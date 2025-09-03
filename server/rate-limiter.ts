// Phase 1 Step 3: Rate Limiting & Security Implementation
// Database-Per-Tenant Architecture - Foundation Phase

import { Request, Response, NextFunction } from 'express';

// In-memory rate limiting for Phase 1 (will be Redis-backed in production)
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDuration: number;

  constructor(windowMs = 60000, maxRequests = 100, blockDuration = 300000) {
    this.windowMs = windowMs; // 1 minute window
    this.maxRequests = maxRequests; // 100 requests per window
    this.blockDuration = blockDuration; // 5 minute block duration
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  private getClientKey(req: Request): string {
    // Use IP address as primary identifier
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    // Add user ID if authenticated for more granular control
    const userId = (req as any).user?.id;
    return userId ? `${ip}:${userId}` : `${ip}:anonymous`;
  }

  private cleanup(): void {
    const now = Date.now();
    this.requests.forEach((data, key) => {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    });
  }

  public check(req: Request): { allowed: boolean; remainingRequests: number; resetTime: number; blocked?: boolean } {
    const key = this.getClientKey(req);
    const now = Date.now();
    
    let clientData = this.requests.get(key);
    
    // Initialize or reset if window expired
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false
      };
      this.requests.set(key, clientData);
    }
    
    // Check if client is currently blocked
    if (clientData.blocked) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: clientData.resetTime,
        blocked: true
      };
    }
    
    // Increment request count
    clientData.count++;
    
    // Check if limit exceeded
    if (clientData.count > this.maxRequests) {
      clientData.blocked = true;
      clientData.resetTime = now + this.blockDuration; // Extend reset time for block duration
      
      console.log(`🚫 Rate limit exceeded for ${key}: ${clientData.count} requests`);
      
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: clientData.resetTime,
        blocked: true
      };
    }
    
    return {
      allowed: true,
      remainingRequests: this.maxRequests - clientData.count,
      resetTime: clientData.resetTime
    };
  }

  public getStats(): { totalClients: number; blockedClients: number; totalRequests: number } {
    let totalRequests = 0;
    let blockedClients = 0;
    
    this.requests.forEach((data) => {
      totalRequests += data.count;
      if (data.blocked) blockedClients++;
    });
    
    return {
      totalClients: this.requests.size,
      blockedClients,
      totalRequests
    };
  }
}

// Different rate limiters for different types of requests
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter(60000, 100, 300000), // 100 req/min, 5min block
  
  // Stricter limits for authentication endpoints
  auth: new RateLimiter(60000, 10, 900000), // 10 req/min, 15min block
  
  // Very strict limits for data modification
  write: new RateLimiter(60000, 50, 600000), // 50 req/min, 10min block
  
  // Relaxed limits for read-only operations
  read: new RateLimiter(60000, 200, 180000), // 200 req/min, 3min block
};

// Rate limiting middleware factory
export function createRateLimitMiddleware(limiterType: keyof typeof rateLimiters = 'api') {
  return (req: Request, res: Response, next: NextFunction) => {
    const limiter = rateLimiters[limiterType];
    const result = limiter.check(req);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': limiter['maxRequests'].toString(),
      'X-RateLimit-Remaining': result.remainingRequests.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'X-RateLimit-Type': limiterType
    });
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: result.blocked 
          ? 'Client temporarily blocked due to excessive requests' 
          : 'Rate limit exceeded',
        retryAfter,
        resetTime: result.resetTime,
        type: limiterType
      });
    }
    
    next();
  };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Security headers for Phase 1 implementation
  res.set({
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    
    // HTTPS enforcement (when in production)
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains' 
      : undefined,
    
    // Content Security Policy (basic)
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; connect-src 'self' https:; font-src 'self' https: data:;",
    
    // Permissions Policy to silence browser warnings
    'Permissions-Policy': 'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()',
    
    // API-specific headers
    'X-API-Version': '1.0',
    'X-Security-Level': 'Phase-1-Foundation'
  });
  
  next();
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Basic request validation
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      error: 'Request Too Large',
      message: 'Request body exceeds maximum allowed size',
      maxSize: '10MB'
    });
  }
  
  // Validate request method
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      error: 'Method Not Allowed',
      allowed: allowedMethods
    });
  }
  
  next();
}

// DDoS protection patterns
export class DDoSProtection {
  private connectionCounts = new Map<string, number>();
  private suspiciousIPs = new Set<string>();
  
  public checkConnection(req: Request): boolean {
    const ip = this.getClientIP(req);
    const current = this.connectionCounts.get(ip) || 0;
    
    // Allow up to 50 concurrent connections per IP
    if (current >= 50) {
      this.suspiciousIPs.add(ip);
      console.log(`🛡️ DDoS Protection: Blocking suspicious IP ${ip} (${current} connections)`);
      return false;
    }
    
    this.connectionCounts.set(ip, current + 1);
    return true;
  }
  
  public releaseConnection(req: Request): void {
    const ip = this.getClientIP(req);
    const current = this.connectionCounts.get(ip) || 0;
    if (current > 0) {
      this.connectionCounts.set(ip, current - 1);
    }
  }
  
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    return forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress || 'unknown';
  }
  
  public getStats() {
    return {
      activeConnections: Array.from(this.connectionCounts.values()).reduce((a, b) => a + b, 0),
      uniqueIPs: this.connectionCounts.size,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: Array.from(this.suspiciousIPs)
    };
  }
}

export const ddosProtection = new DDoSProtection();

// Export rate limiting stats for monitoring
export function getRateLimitStats() {
  return {
    api: rateLimiters.api.getStats(),
    auth: rateLimiters.auth.getStats(),
    write: rateLimiters.write.getStats(),
    read: rateLimiters.read.getStats(),
    ddos: ddosProtection.getStats(),
    timestamp: new Date().toISOString()
  };
}