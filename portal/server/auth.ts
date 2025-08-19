import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseStorage } from '../../server/storage';
import { ExternalUser, ExternalCompany, PortalSession } from '../shared/schema';

const JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'portal-secret-key-change-in-production';
const SESSION_TIMEOUT = parseInt(process.env.PORTAL_SESSION_TIMEOUT || '3600');

export interface PortalRequest extends Request {
  user?: ExternalUser;
  company?: ExternalCompany;
  session?: PortalSession;
}

// Create JWT token
export function createToken(userId: string, companyId: string): string {
  return jwt.sign(
    { userId, companyId, type: 'portal' },
    JWT_SECRET,
    { expiresIn: SESSION_TIMEOUT }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Portal authentication middleware
export async function portalAuth(
  req: PortalRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'portal') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user and company from database
    const storage = new DatabaseStorage();
    const user = await storage.getPortalUser(decoded.userId);
    const company = await storage.getExternalCompany(decoded.companyId);

    if (!user || !company) {
      return res.status(401).json({ error: 'User or company not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    if (company.status !== 'active') {
      return res.status(403).json({ error: 'Company account is not active' });
    }

    // Attach to request
    req.user = user;
    req.company = company;

    // Log activity
    await storage.logPortalActivity({
      userId: user.id,
      companyId: company.id,
      action: 'api_access',
      resourceType: req.path,
      ipAddress: req.ip,
    });

    next();
  } catch (error) {
    console.error('Portal auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Company type specific middleware
export function requireCompanyType(...types: string[]) {
  return (req: PortalRequest, res: Response, next: NextFunction) => {
    if (!req.company) {
      return res.status(403).json({ error: 'No company context' });
    }

    if (!types.includes(req.company.type)) {
      return res.status(403).json({ 
        error: `This feature is only available for ${types.join(', ')} accounts` 
      });
    }

    next();
  };
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return (req: PortalRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'No user context' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `This action requires one of the following roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
}

// Rate limiting middleware
const rateLimitMap = new Map<string, number[]>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: PortalRequest, res: Response, next: NextFunction) => {
    const key = `${req.company?.id || req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request timestamps for this key
    let timestamps = rateLimitMap.get(key) || [];
    
    // Filter out old timestamps
    timestamps = timestamps.filter(t => t > windowStart);
    
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later' 
      });
    }

    // Add current timestamp and update map
    timestamps.push(now);
    rateLimitMap.set(key, timestamps);

    next();
  };
}