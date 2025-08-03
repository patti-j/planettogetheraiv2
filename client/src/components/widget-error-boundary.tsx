import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widget: {
    id?: string | number;
    title?: string;
    type?: string;
  };
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Widget Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
              Widget Error
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {this.props.widget.title || 'Widget'} failed to load
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4 font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={this.handleRetry}
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                  Development Info
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use
interface WidgetFallbackProps {
  title?: string;
  type?: string;
  error?: string;
  onRetry?: () => void;
}

export const WidgetFallback = ({ title, type, error, onRetry }: WidgetFallbackProps) => (
  <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
    <CardContent className="p-6 text-center">
      <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
        {title || 'Widget Unavailable'}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {type} widget
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        {error || 'Widget component not available in mobile view'}
      </p>
      {onRetry && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Try Again
        </Button>
      )}
    </CardContent>
  </Card>
);