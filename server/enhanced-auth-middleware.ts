import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, apiKeys, apiKeyUsage, roles, userRoles, rolePermissions, permissions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

// In-memory cache for role permissions (roleId → permission strings[])
const rolePermissionsCache = new Map<number, string[]>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<number, number>();

// Helper to get cached or fetch permissions for a role
async function getRolePermissions(roleId: number): Promise<string[]> {
  const now = Date.now();
  const cachedTime = cacheTimestamps.get(roleId);
  
  // Return cached if still valid
  if (cachedTime && (now - cachedTime) < CACHE_TTL_MS) {
    const cached = rolePermissionsCache.get(roleId);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch from database using single join query
  const rolePermissionRows = await db.select({
    feature: permissions.feature,
    action: permissions.action
  })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  const permissionStrings = rolePermissionRows.map(row => 
    `${row.feature}:${row.action}`
  );
  
  // Cache the result
  rolePermissionsCache.set(roleId, permissionStrings);
  cacheTimestamps.set(roleId, now);
  
  return permissionStrings;
}

// Extended Request interface for authentication context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    type: 'user' | 'api_key';
    apiKeyId?: number;
    permissions?: string[];
    roleId?: number;
  };
}

// Authentication result interface
interface AuthResult {
  success: boolean;
  user?: AuthenticatedRequest['user'];
  error?: string;
}

// Enhanced authentication middleware supporting JWT and API keys
export async function enhancedAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // DISABLED AUTO-LOGIN - User must manually log in
    // if (process.env.NODE_ENV === 'development') {
    //   console.log("🔧 [Enhanced Auth] Development mode: Providing automatic admin access");
    //   req.user = {...};
    //   return next();
    // }

    const authResult = await authenticateRequest(req);
    
    if (!authResult.success) {
      console.log(`🔒 [Enhanced Auth] Authentication failed: ${authResult.error}`);
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        message: authResult.error
      });
    }

    // Add user context to request
    req.user = authResult.user;
    console.log(`✅ [Enhanced Auth] Authenticated ${authResult.user?.type}: ${authResult.user?.username || authResult.user?.email}`);
    
    next();
  } catch (error) {
    console.error('🚨 [Enhanced Auth] Middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication system error' 
    });
  }
}

// Core authentication logic supporting multiple methods
async function authenticateRequest(req: AuthenticatedRequest): Promise<AuthResult> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { success: false, error: 'No authorization header provided' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Invalid authorization header format' };
  }

  const token = authHeader.substring(7);

  // Try API key authentication first (format: pt_key_xxxxxxxxxxxxx)
  if (token.startsWith('pt_key_')) {
    return await authenticateApiKey(token, req);
  }

  // Try JWT authentication
  if (token.length > 50) {
    return await authenticateJWT(token, req);
  }

  return { success: false, error: 'Invalid token format' };
}

// JWT Authentication
async function authenticateJWT(token: string, req: AuthenticatedRequest): Promise<AuthResult> {
  try {
    console.log(`🔑 [JWT Auth] Authenticating JWT token...`);
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    if (!userId) {
      return { success: false, error: 'Invalid JWT payload' };
    }

    // Fetch user with all necessary fields
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userRecord = user[0];

    if (!userRecord || !userRecord.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    // Special handling for admin users - grant wildcard permission first
    // Admin user should have full access in both development and production
    let permissionStrings: string[] = [];
    
    if (userRecord.username === 'admin' || userRecord.email === 'admin@planettogether.com') {
      permissionStrings = ['*'];
    } else {
      // Fetch ALL roles for the user to support multi-role permissions
      const userRoleRows = await db.select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      
      // Collect permissions from all user roles
      const allPermissions = new Set<string>();
      for (const userRole of userRoleRows) {
        const rolePerms = await getRolePermissions(userRole.roleId);
        rolePerms.forEach(perm => allPermissions.add(perm));
      }
      
      permissionStrings = Array.from(allPermissions);
    }

    return {
      success: true,
      user: {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        type: 'user',
        permissions: permissionStrings,
        roleId: userRecord.activeRoleId || undefined
      }
    };

  } catch (error) {
    console.error('🚨 [JWT Auth] JWT verification failed:', error);
    return { success: false, error: 'Invalid or expired JWT token' };
  }
}

// API Key Authentication
async function authenticateApiKey(token: string, req: AuthenticatedRequest): Promise<AuthResult> {
  try {
    console.log(`🗝️ [API Key Auth] Authenticating API key...`);
    
    // Extract key ID from token (format: pt_key_12345_secrethash)
    const parts = token.split('_');
    if (parts.length < 3 || parts[0] !== 'pt' || parts[1] !== 'key') {
      return { success: false, error: 'Invalid API key format' };
    }

    const keyId = parts[2];
    const secret = parts.slice(3).join('_');

    // Find the API key with basic info only (no nested relations to avoid N+1)
    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyId, keyId),
        eq(apiKeys.isActive, true)
      ),
      with: {
        user: true
      }
    });

    if (!apiKey) {
      return { success: false, error: 'API key not found or inactive' };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { success: false, error: 'API key has expired' };
    }

    // Verify secret
    const isValidSecret = await bcrypt.compare(secret, apiKey.keyHash);
    if (!isValidSecret) {
      return { success: false, error: 'Invalid API key secret' };
    }

    // Update last used timestamp (non-blocking)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .then(() => {})
      .catch(err => console.error('Failed to update last used timestamp:', err));

    // Log usage (non-blocking)
    logApiKeyUsage(apiKey.id, req);

    // Fetch permissions using cached helper to avoid N+1 query problem
    let permissionStrings: string[] = [];
    
    if (apiKey.roleId) {
      permissionStrings = await getRolePermissions(apiKey.roleId);
    }

    return {
      success: true,
      user: {
        id: apiKey.user.id,
        username: apiKey.user.username,
        email: apiKey.user.email,
        type: 'api_key',
        apiKeyId: apiKey.id,
        permissions: permissionStrings,
        roleId: apiKey.roleId || undefined
      }
    };

  } catch (error) {
    console.error('🚨 [API Key Auth] Authentication failed:', error);
    return { success: false, error: 'API key authentication failed' };
  }
}

// Log API key usage for monitoring and analytics
async function logApiKeyUsage(apiKeyId: number, req: AuthenticatedRequest) {
  try {
    const startTime = Date.now();
    
    // Get request metadata
    const endpoint = req.originalUrl || req.url;
    const method = req.method;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const requestSize = parseInt(req.get('Content-Length') || '0');

    await db.insert(apiKeyUsage).values({
      apiKeyId,
      endpoint,
      method,
      ipAddress,
      userAgent,
      requestSize,
      responseStatus: 0, // Will be updated by response middleware
      responseTime: 0,
      responseSize: 0
    });

  } catch (error) {
    console.error('🚨 [API Key Usage] Failed to log usage:', error);
    // Don't fail the request if logging fails
  }
}

// Permission checking middleware
export function requirePermission(feature: string, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const requiredPermission = `${feature}:${action}`;
    
    // Normalize permissions to array to handle different data types safely
    const perms = Array.isArray(user.permissions) 
      ? user.permissions 
      : (typeof user.permissions === 'string' ? [user.permissions] : []);
    
    // Check for wildcard permission (*) or specific permission
    const hasPermission = perms.includes("*") || perms.includes(requiredPermission);

    if (!hasPermission) {
      console.log(`🚫 [Permission] User ${user.username} denied access to ${requiredPermission}`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredPermission
      });
    }

    console.log(`✅ [Permission] User ${user.username} granted access to ${requiredPermission}`);
    next();
  };
}

// Backwards compatibility with existing JWT middleware
export const requireAuth = enhancedAuth;

export default enhancedAuth;