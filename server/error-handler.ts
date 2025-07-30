import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number | string };
    }
  }
}
import { storage } from './storage';

export interface ErrorContext {
  operation: string;
  endpoint?: string;
  userId?: number;
  requestData?: any;
  additionalInfo?: Record<string, any>;
}

export class SystemError extends Error {
  public code: string;
  public statusCode: number;
  public context: ErrorContext;
  public timestamp: Date;

  constructor(
    message: string,
    code: string = 'SYSTEM_ERROR',
    statusCode: number = 500,
    context: ErrorContext
  ) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();
  }
}

export class ValidationError extends SystemError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string, context: ErrorContext, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, context);
    this.name = 'DatabaseError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class AuthenticationError extends SystemError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SystemError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends SystemError {
  constructor(message: string, context: ErrorContext) {
    super(message, 'NOT_FOUND_ERROR', 404, context);
    this.name = 'NotFoundError';
  }
}

export async function logError(error: Error, context: ErrorContext): Promise<string> {
  try {
    const errorId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const severity = determineSeverity(error);
    
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack || '',
      componentStack: `Server: ${context.operation}`,
      timestamp: new Date(),
      userAgent: 'Server',
      url: context.endpoint || 'Unknown endpoint',
      userId: context.userId?.toString() || null,
      severity,
      resolved: false,
      metadata: {
        operation: context.operation,
        errorCode: (error as SystemError).code || 'UNKNOWN',
        requestData: context.requestData ? JSON.stringify(context.requestData) : null,
        additionalInfo: context.additionalInfo || {}
      }
    };

    await storage.logError(errorData);
    console.error(`[ERROR ${errorId}] ${context.operation}:`, error.message);
    console.error('Stack:', error.stack);
    
    return errorId;
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
    console.error('Original error:', error);
    return 'failed_to_log';
  }
}

function determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof DatabaseError) return 'critical';
  if (error instanceof AuthenticationError) return 'high';
  if (error instanceof ValidationError) return 'medium';
  if (error instanceof NotFoundError) return 'low';
  
  const message = error.message.toLowerCase();
  if (message.includes('connection') || message.includes('timeout') || message.includes('network')) {
    return 'critical';
  }
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'high';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'medium';
  }
  
  return 'medium';
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createSafeHandler(operation: string) {
  return (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        const context: ErrorContext = {
          operation,
          endpoint: `${req.method} ${req.path}`,
          userId: typeof req.user?.id === 'number' ? req.user.id : undefined,
          requestData: req.body,
          additionalInfo: {
            query: req.query,
            params: req.params,
            userAgent: req.headers['user-agent']
          }
        };

        // Log the error
        const errorId = await logError(error as Error, context);

        // Handle different error types
        if (error instanceof ValidationError) {
          return res.status(400).json({
            success: false,
            message: error.message,
            code: error.code,
            errorId
          });
        }

        if (error instanceof AuthenticationError) {
          return res.status(401).json({
            success: false,
            message: error.message,
            code: error.code,
            errorId
          });
        }

        if (error instanceof AuthorizationError) {
          return res.status(403).json({
            success: false,
            message: error.message,
            code: error.code,
            errorId
          });
        }

        if (error instanceof NotFoundError) {
          return res.status(404).json({
            success: false,
            message: error.message,
            code: error.code,
            errorId
          });
        }

        if (error instanceof DatabaseError) {
          return res.status(500).json({
            success: false,
            message: 'Database operation failed',
            code: error.code,
            errorId
          });
        }

        // Generic error
        return res.status(500).json({
          success: false,
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
          errorId
        });
      }
    });
  };
}

export function errorMiddleware(error: Error, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(error);
  }

  const context: ErrorContext = {
    operation: 'Global Error Handler',
    endpoint: `${req.method} ${req.path}`,
    userId: typeof req.user?.id === 'number' ? req.user.id : undefined,
    requestData: req.body
  };

  logError(error, context).then(errorId => {
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      errorId
    });
  }).catch(logError => {
    console.error('Failed to log error:', logError);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      errorId: 'failed_to_log'
    });
  });
}