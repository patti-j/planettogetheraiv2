// Phase 3 Step 2: Tenant Resolution Middleware
// Multi-Tenant Architecture - Dynamic Database Connection Management

import { Request, Response, NextFunction } from 'express';
import { tenantManager } from './tenant-manager';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
        plan: string;
        features: string[];
        database: any;
      };
    }
  }
}

// Tenant resolution strategies
export enum TenantResolutionStrategy {
  SUBDOMAIN = 'subdomain',
  HEADER = 'header',
  JWT = 'jwt',
  PATH = 'path'
}

interface TenantMiddlewareConfig {
  strategy: TenantResolutionStrategy;
  required: boolean;
  fallbackTenant?: string;
  excludePaths?: string[];
}

// Tenant resolution middleware
export class TenantMiddleware {
  private config: TenantMiddlewareConfig;

  constructor(config: TenantMiddlewareConfig) {
    this.config = config;
    console.log(`🔍 Tenant Middleware: Initialized with ${config.strategy} strategy`);
  }

  // Main middleware function
  public middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip tenant resolution for excluded paths
      if (this.shouldSkipTenantResolution(req.path)) {
        return next();
      }

      // Resolve tenant based on configured strategy
      const tenantInfo = await this.resolveTenantFromRequest(req);
      
      if (!tenantInfo && this.config.required) {
        return res.status(400).json({
          error: 'Tenant not found',
          message: 'Unable to resolve tenant from request',
          strategy: this.config.strategy
        });
      }

      // Set tenant context on request
      if (tenantInfo) {
        req.tenant = {
          id: tenantInfo.id,
          name: tenantInfo.name,
          subdomain: tenantInfo.subdomain,
          plan: tenantInfo.plan,
          features: tenantInfo.features,
          database: await tenantManager.getTenantDatabase(tenantInfo.id)
        };

        // Update last accessed time
        await this.updateTenantAccess(tenantInfo.id);
        
        console.log(`🏢 Tenant Middleware: Resolved tenant ${tenantInfo.name} (${tenantInfo.id})`);
      }

      next();
      
    } catch (error) {
      console.error('Tenant resolution error:', error);
      
      if (this.config.required) {
        return res.status(500).json({
          error: 'Tenant resolution failed',
          message: error.message
        });
      }
      
      next();
    }
  };

  // Resolve tenant from request based on strategy
  private async resolveTenantFromRequest(req: Request): Promise<any> {
    switch (this.config.strategy) {
      case TenantResolutionStrategy.SUBDOMAIN:
        return this.resolveFromSubdomain(req);
      
      case TenantResolutionStrategy.HEADER:
        return this.resolveFromHeader(req);
      
      case TenantResolutionStrategy.JWT:
        return this.resolveFromJWT(req);
      
      case TenantResolutionStrategy.PATH:
        return this.resolveFromPath(req);
      
      default:
        throw new Error(`Unknown tenant resolution strategy: ${this.config.strategy}`);
    }
  }

  // Resolve tenant from subdomain
  private async resolveFromSubdomain(req: Request): Promise<any> {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const subdomain = this.extractSubdomain(host);
    
    if (!subdomain) {
      console.log('🔍 Tenant Middleware: No subdomain found in host:', host);
      return null;
    }

    console.log(`🔍 Tenant Middleware: Resolving subdomain: ${subdomain}`);
    
    return tenantManager.resolveTenant({ subdomain });
  }

  // Resolve tenant from header
  private async resolveFromHeader(req: Request): Promise<any> {
    const tenantId = req.get('x-tenant-id') || req.get('tenant-id');
    
    if (!tenantId) {
      console.log('🔍 Tenant Middleware: No tenant ID found in headers');
      return null;
    }

    console.log(`🔍 Tenant Middleware: Resolving from header: ${tenantId}`);
    
    return tenantManager.resolveTenant({ tenantId });
  }

  // Resolve tenant from JWT token
  private async resolveFromJWT(req: Request): Promise<any> {
    const authHeader = req.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 Tenant Middleware: No Bearer token found');
      return null;
    }

    const token = authHeader.substring(7);
    const tenantId = this.extractTenantFromJWT(token);
    
    if (!tenantId) {
      console.log('🔍 Tenant Middleware: No tenant ID found in JWT');
      return null;
    }

    console.log(`🔍 Tenant Middleware: Resolving from JWT: ${tenantId}`);
    
    return tenantManager.resolveTenant({ tenantId });
  }

  // Resolve tenant from URL path
  private async resolveFromPath(req: Request): Promise<any> {
    const pathParts = req.path.split('/');
    
    // Expect format: /tenant/{tenantId}/api/...
    if (pathParts.length < 3 || pathParts[1] !== 'tenant') {
      console.log('🔍 Tenant Middleware: Invalid tenant path format:', req.path);
      return null;
    }

    const tenantId = pathParts[2];
    console.log(`🔍 Tenant Middleware: Resolving from path: ${tenantId}`);
    
    return tenantManager.resolveTenant({ tenantId });
  }

  // Extract subdomain from host
  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];
    const parts = hostWithoutPort.split('.');
    
    // For localhost development, check for subdomain patterns
    if (hostWithoutPort.includes('localhost')) {
      // Pattern: tenant-subdomain.localhost
      if (parts.length >= 2 && parts[0] !== 'localhost') {
        return parts[0];
      }
      return null;
    }
    
    // For production domains like: subdomain.planettogether.com
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Skip common prefixes
      if (subdomain === 'www' || subdomain === 'api') {
        return null;
      }
      return subdomain;
    }
    
    return null;
  }

  // Extract tenant ID from JWT token
  private extractTenantFromJWT(token: string): string | null {
    try {
      // Simple JWT parsing (in production, use proper JWT library)
      const [, payload] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      return decoded.tenantId || decoded.tenant_id || null;
      
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  // Check if path should skip tenant resolution
  private shouldSkipTenantResolution(path: string): boolean {
    const defaultExcludePaths = [
      '/health',
      '/api/health',
      '/api/tenant-admin',
      '/favicon.ico',
      '/robots.txt'
    ];
    
    const excludePaths = [...defaultExcludePaths, ...(this.config.excludePaths || [])];
    
    return excludePaths.some(excludePath => path.startsWith(excludePath));
  }

  // Update tenant last accessed time
  private async updateTenantAccess(tenantId: string): Promise<void> {
    try {
      // This would update the tenant's lastAccessed field in the database
      console.log(`📊 Tenant Middleware: Updated access time for tenant ${tenantId}`);
    } catch (error) {
      console.error('Failed to update tenant access time:', error);
    }
  }
}

// Tenant-aware database middleware
export const tenantDatabase = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'No tenant context',
      message: 'Tenant must be resolved before database access'
    });
  }

  // Set tenant database context for subsequent operations
  // This would be used by the ORM to select the correct database
  req.app.locals.currentTenantDb = req.tenant.database;
  
  next();
};

// Feature authorization middleware
export const requireTenantFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'No tenant context',
        message: 'Tenant context required for feature authorization'
      });
    }

    if (!req.tenant.features.includes(feature)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `Feature '${feature}' not included in ${req.tenant.plan} plan`,
        availableFeatures: req.tenant.features
      });
    }

    next();
  };
};

// Plan authorization middleware
export const requireTenantPlan = (requiredPlan: string) => {
  const planHierarchy = { starter: 1, professional: 2, enterprise: 3 };
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'No tenant context',
        message: 'Tenant context required for plan authorization'
      });
    }

    const currentPlanLevel = planHierarchy[req.tenant.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (currentPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        error: 'Insufficient plan',
        message: `${requiredPlan} plan or higher required`,
        currentPlan: req.tenant.plan
      });
    }

    next();
  };
};

// Utility function to create tenant middleware with different strategies
export const createTenantMiddleware = (config: TenantMiddlewareConfig): TenantMiddleware => {
  return new TenantMiddleware(config);
};

// Default tenant middleware configurations
export const tenantMiddlewares = {
  subdomain: createTenantMiddleware({
    strategy: TenantResolutionStrategy.SUBDOMAIN,
    required: true
  }),
  
  header: createTenantMiddleware({
    strategy: TenantResolutionStrategy.HEADER,
    required: true
  }),
  
  jwt: createTenantMiddleware({
    strategy: TenantResolutionStrategy.JWT,
    required: true
  }),
  
  path: createTenantMiddleware({
    strategy: TenantResolutionStrategy.PATH,
    required: true
  }),
  
  optional: createTenantMiddleware({
    strategy: TenantResolutionStrategy.HEADER,
    required: false
  })
};