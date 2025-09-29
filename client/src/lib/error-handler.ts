import { toast } from '@/hooks/use-toast';

export interface ClientErrorContext {
  component: string;
  operation: string;
  userId?: number;
  additionalInfo?: Record<string, any>;
}

export class ClientError extends Error {
  public code: string;
  public context: ClientErrorContext;
  public timestamp: Date;

  constructor(
    message: string,
    code: string = 'CLIENT_ERROR',
    context: ClientErrorContext
  ) {
    super(message);
    this.name = 'ClientError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

export class NetworkError extends ClientError {
  constructor(message: string, context: ClientErrorContext) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ClientError {
  constructor(message: string, context: ClientErrorContext) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class ComponentError extends ClientError {
  constructor(message: string, context: ClientErrorContext) {
    super(message, 'COMPONENT_ERROR', context);
    this.name = 'ComponentError';
  }
}

export async function logClientError(error: Error, context: ClientErrorContext): Promise<string> {
  try {
    const errorId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack || '',
      componentStack: `Client: ${context.component} - ${context.operation}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || null,
      severity: determineSeverity(error),
      resolved: false,
      metadata: {
        component: context.component,
        operation: context.operation,
        errorCode: (error as ClientError).code || 'UNKNOWN',
        additionalInfo: context.additionalInfo || {}
      }
    };

    const response = await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify(errorData)
    });

    if (!response.ok) {
      throw new Error('Failed to log error to server');
    }

    console.error(`[CLIENT ERROR ${errorId}] ${context.component}/${context.operation}:`, error.message);
    
    return errorId;
  } catch (logError) {
    console.error('Failed to log client error:', logError);
    console.error('Original error:', error);
    return 'failed_to_log';
  }
}

function determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof NetworkError) return 'critical';
  if (error instanceof ComponentError) return 'high';
  if (error instanceof ValidationError) return 'medium';
  
  const message = error.message.toLowerCase();
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'critical';
  }
  if (message.includes('component') || message.includes('render')) {
    return 'high';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'medium';
  }
  
  return 'medium';
}

export function handleApiError(error: any, context: ClientErrorContext): void {
  if (error?.name === 'AbortError') {
    // Request was cancelled, don't show error
    return;
  }

  let errorMessage = 'An unexpected error occurred';
  let shouldLog = true;

  if (error?.message) {
    errorMessage = error.message;
  }

  // Handle different error types
  if (error?.status === 401) {
    errorMessage = 'You are not authorized to perform this action';
  } else if (error?.status === 403) {
    errorMessage = 'Access denied';
  } else if (error?.status === 404) {
    errorMessage = 'Resource not found';
  } else if (error?.status === 422) {
    errorMessage = 'Invalid data provided';
  } else if (error?.status >= 500) {
    errorMessage = 'Server error occurred';
  }

  // Show user-friendly error message
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive'
  });

  // Log error for debugging
  if (shouldLog) {
    const clientError = new ClientError(error?.message || errorMessage, 'API_ERROR', context);
    logClientError(clientError, context).catch(console.error);
  }
}

export function createSafeAsyncFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ClientErrorContext,
  onError?: (error: Error) => void
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const clientError = error instanceof ClientError ? error : 
        new ClientError((error as Error).message, 'ASYNC_ERROR', context);
      
      await logClientError(clientError, context);
      
      if (onError) {
        onError(clientError);
      } else {
        handleApiError(error, context);
      }
      
      return null;
    }
  };
}

export function createSafeFunction<T extends any[], R>(
  fn: (...args: T) => R,
  context: ClientErrorContext,
  onError?: (error: Error) => R | null
) {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      const clientError = error instanceof ClientError ? error : 
        new ClientError((error as Error).message, 'FUNCTION_ERROR', context);
      
      logClientError(clientError, context).catch(console.error);
      
      if (onError) {
        return onError(clientError);
      } else {
        console.error(`Error in ${context.component}/${context.operation}:`, error);
        return null;
      }
    }
  };
}

export function useErrorHandler(component: string) {
  const handleError = (error: Error, operation: string, additionalInfo?: Record<string, any>) => {
    const context: ClientErrorContext = {
      component,
      operation,
      additionalInfo
    };
    
    handleApiError(error, context);
  };

  const safeAsync = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    operation: string,
    onError?: (error: Error) => void
  ) => {
    return createSafeAsyncFunction(fn, { component, operation }, onError);
  };

  const safe = <T extends any[], R>(
    fn: (...args: T) => R,
    operation: string,
    onError?: (error: Error) => R | null
  ) => {
    return createSafeFunction(fn, { component, operation }, onError);
  };

  return {
    handleError,
    safeAsync,
    safe,
    logError: (error: Error, operation: string, additionalInfo?: Record<string, any>) => {
      const context: ClientErrorContext = {
        component,
        operation,
        additionalInfo
      };
      return logClientError(error, context);
    }
  };
}

// Enhanced React Query error handler
export function createSafeQuery<T>(
  queryFn: () => Promise<T>,
  context: ClientErrorContext,
  options?: {
    showToast?: boolean;
    customErrorMessage?: string;
  }
) {
  return async (): Promise<T> => {
    try {
      return await queryFn();
    } catch (error: any) {
      await logClientError(error, context);
      
      if (options?.showToast !== false) {
        const errorMessage = options?.customErrorMessage || 
          (error?.status === 404 ? "Data not found" :
           error?.status >= 500 ? "Server error occurred" :
           "Failed to load data");
           
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw error; // Re-throw for React Query to handle
    }
  };
}

// Enhanced form submission handler
export function createSafeSubmission<T>(
  submitFn: (data: T) => Promise<void>,
  context: ClientErrorContext,
  options?: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    onSuccess?: () => void;
  }
) {
  return async (data: T): Promise<void> => {
    try {
      await submitFn(data);
      
      if (options?.showSuccessToast !== false) {
        toast({
          title: "Success",
          description: options?.successMessage || "Operation completed successfully",
          variant: "default",
        });
      }
      
      options?.onSuccess?.();
    } catch (error: any) {
      await logClientError(error, context);
      
      if (options?.showErrorToast !== false) {
        const errorMessage = error?.message || "Failed to complete operation";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw error;
    }
  };
}