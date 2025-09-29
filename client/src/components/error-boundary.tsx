import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Send, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
  reportSent: boolean;
  userFeedback: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSent: false,
      userFeedback: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to backend
    this.logErrorToBackend(error, errorInfo, errorId);
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack || '',
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        severity: this.determineSeverity(error),
        resolved: false,
        metadata: {
          retryCount: this.retryCount,
          errorName: error.name,
          errorType: 'React Error Boundary',
          browserInfo: {
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled
          }
        }
      };

      await apiRequest('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      console.error('Failed to log error to backend:', logError);
    }
  }

  private getCurrentUserId(): number | null {
    // Try to get user ID from localStorage token or session
    try {
      const token = localStorage.getItem('auth_token');
      if (token && token.startsWith('user_')) {
        const parts = token.split('_');
        if (parts.length >= 2) {
          return parseInt(parts[1]);
        }
      }
    } catch {
      // Fallback
    }
    return null;
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors that break core functionality
    if (message.includes('chunk') || message.includes('network') || message.includes('failed to fetch')) {
      return 'critical';
    }

    // High severity for component errors
    if (stack.includes('react') || message.includes('render') || message.includes('component')) {
      return 'high';
    }

    // Medium for UI-related issues
    if (message.includes('ui') || message.includes('form') || message.includes('input')) {
      return 'medium';
    }

    return 'low';
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        reportSent: false,
        userFeedback: ''
      });
    } else {
      // Max retries reached, redirect to safe page
      window.location.href = '/';
    }
  };

  private handleReportError = async () => {
    if (!this.state.errorId) return;

    this.setState({ isReporting: true });

    try {
      const reportData = {
        errorId: this.state.errorId,
        userFeedback: this.state.userFeedback,
        status: 'reported',
        priority: this.determineSeverity(this.state.error!),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await apiRequest('/api/errors/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      this.setState({ reportSent: true, isReporting: false });
    } catch (error) {
      console.error('Failed to submit error report:', error);
      this.setState({ isReporting: false });
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorId, isReporting, reportSent, userFeedback } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-lg">
              We encountered an unexpected error. Our team has been automatically notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Details */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
                Error Details
              </h3>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                {error?.message}
              </p>
              {errorId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Error ID: {errorId}
                </p>
              )}
            </div>

            {/* User Feedback */}
            {!reportSent && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Help us improve by describing what you were doing when this error occurred:
                </h3>
                <Textarea
                  placeholder="I was trying to..."
                  value={userFeedback}
                  onChange={(e) => this.setState({ userFeedback: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {/* Success Message */}
            {reportSent && (
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Thank you for your feedback. Your error report has been sent to our support team.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {this.retryCount > 0 && `(${this.maxRetries - this.retryCount} remaining)`}
                </Button>
              )}
              
              {!reportSent && (
                <Button
                  onClick={this.handleReportError}
                  disabled={isReporting}
                  className="flex-1 flex items-center gap-2"
                  variant="outline"
                >
                  <Send className="w-4 h-4" />
                  {isReporting ? 'Sending...' : 'Send Report'}
                </Button>
              )}

              <Button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center gap-2"
                variant={canRetry ? "outline" : "default"}
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Technical Information (Collapsible) */}
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer font-medium mb-2">
                Technical Details (for developers)
              </summary>
              <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded font-mono text-xs overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {error?.name}: {error?.message}
                </div>
                <div className="mb-2">
                  <strong>Stack Trace:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {error?.stack}
                  </pre>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Higher-order component wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = async (error: Error, context?: string, userId?: number) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack || '',
        componentStack: context || 'Manual report',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: userId || null,
        severity: 'medium' as const,
        resolved: false,
        metadata: {
          manualReport: true,
          context: context || 'No context provided'
        }
      };

      await apiRequest('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      return errorId;
    } catch (logError) {
      console.error('Failed to report error:', logError);
      throw logError;
    }
  };

  return { reportError };
}