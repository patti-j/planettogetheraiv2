import { Clock, CheckCircle, XCircle, Loader2, StopCircle, TrendingUp, Zap, Database, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Types for refresh tracking
type RefreshStatus = 'idle' | 'refreshing' | 'completed' | 'failed' | 'cancelling' | 'cancelled';
type RefreshInfo = {
  status: RefreshStatus;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  refreshId?: string;
  error?: string;
  estimation?: {
    estimateRangeSeconds: {
      min: number;
      max: number;
      median: number;
    };
    confidenceLevel: "low" | "medium" | "high";
    historicalDataPoints: number;
    averageDurationSeconds: number;
    contextualFactors: {
      storageMode: string;
      isLargeDataset?: boolean;
      isPeakHour?: boolean;
      recentFailures?: boolean;
    };
    message: string;
  };
  progressPercentage?: number; // calculated based on elapsed vs estimated time
  contextualMessage?: string; // dynamic message based on progress
};

interface RefreshStopwatchProps {
  refreshInfo: RefreshInfo;
  onDismiss?: () => void;
  onCancel?: () => void; // New cancel callback
  className?: string;
  compact?: boolean;
}

// Format elapsed time as MM:SS or HH:MM:SS
function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Get status display properties
function getStatusProps(status: RefreshStatus) {
  switch (status) {
    case 'refreshing':
      return {
        icon: Loader2,
        iconClass: "w-4 h-4 animate-spin text-blue-500",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        title: "Dataset Refreshing",
        description: "Please wait while the dataset is being refreshed..."
      };
    case 'cancelling':
      return {
        icon: StopCircle,
        iconClass: "w-4 h-4 text-orange-500",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        title: "Cancelling Refresh",
        description: "Cancelling the dataset refresh..."
      };
    case 'cancelled':
      return {
        icon: StopCircle,
        iconClass: "w-4 h-4 text-orange-500",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        title: "Refresh Cancelled",
        description: "Dataset refresh was cancelled successfully."
      };
    case 'completed':
      return {
        icon: CheckCircle,
        iconClass: "w-4 h-4 text-green-500",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        title: "Refresh Completed",
        description: "Dataset has been refreshed successfully!"
      };
    case 'failed':
      return {
        icon: XCircle,
        iconClass: "w-4 h-4 text-red-500",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        title: "Refresh Failed",
        description: "Dataset refresh encountered an error."
      };
    default:
      return {
        icon: Clock,
        iconClass: "w-4 h-4 text-muted-foreground",
        badgeVariant: "outline" as const,
        badgeClass: "",
        title: "No Active Refresh",
        description: "Dataset is ready for refresh."
      };
  }
}

export function RefreshStopwatch({ refreshInfo, onDismiss, onCancel, className = "", compact = false }: RefreshStopwatchProps) {
  const { status, elapsedTime, error, estimation, progressPercentage, contextualMessage } = refreshInfo;
  const statusProps = getStatusProps(status);
  const StatusIcon = statusProps.icon;
  
  // Debug logging for display - more detailed
  if (status !== 'idle') {
    console.log(`🖥️ RefreshStopwatch render:`, {
      status,
      elapsedTime: `${elapsedTime}s`,
      progress: `${progressPercentage}%`,
      hasEstimation: !!estimation,
      estimationType: typeof estimation,
      estimationData: estimation ? {
        averageDurationSeconds: estimation.averageDurationSeconds,
        confidenceLevel: estimation.confidenceLevel,
        storageMode: estimation.contextualFactors?.storageMode,
        historicalPoints: estimation.historicalDataPoints
      } : 'none',
      refreshInfoKeys: Object.keys(refreshInfo),
      contextualMessage
    });
  }
  
  if (status === 'idle') {
    return null; // Don't show anything when idle
  }

  const formattedTime = formatElapsedTime(elapsedTime);
  const canCancel = status === 'refreshing' && onCancel;
  const isCancelling = status === 'cancelling';

  // Get estimation display info
  const getEstimatedTimeRemaining = () => {
    if (!estimation || status !== 'refreshing') return null;
    const remainingSeconds = Math.max(0, estimation.averageDurationSeconds - elapsedTime);
    return remainingSeconds > 0 ? formatElapsedTime(remainingSeconds) : null;
  };

  const getConfidenceIndicator = () => {
    if (!estimation) return null;
    const confidence = estimation.confidenceLevel;
    if (confidence === 'high') return { icon: TrendingUp, color: "text-green-600", tooltip: "High confidence (based on consistent history)" };
    if (confidence === 'medium') return { icon: Timer, color: "text-yellow-600", tooltip: "Medium confidence (some historical data)" };
    return { icon: Clock, color: "text-gray-500", tooltip: "Low confidence (limited historical data)" };
  };

  if (compact) {
    // Enhanced compact version with progress indicator
    const estimatedRemaining = getEstimatedTimeRemaining();
    const confidence = getConfidenceIndicator();
    
    return (
      <div className={`flex items-center space-x-2 ${className}`} data-testid="refresh-stopwatch-compact">
        <StatusIcon className={statusProps.iconClass} />
        <Badge variant={statusProps.badgeVariant} className={`${statusProps.badgeClass} font-mono text-sm`}>
          {formattedTime}
        </Badge>
        
        {/* Progress indicator for refreshing status */}
        {status === 'refreshing' && progressPercentage !== undefined && (
          <div className="flex items-center space-x-1">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progressPercentage}%
            </span>
          </div>
        )}
        
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {contextualMessage || (status === 'refreshing' ? 'Refreshing...' : 
           status === 'cancelling' ? 'Cancelling...' : statusProps.title)}
        </span>
        
        {/* Estimation info */}
        {estimation && status === 'refreshing' && confidence && (
          <Tooltip>
            <TooltipTrigger>
              <confidence.icon className={`w-3 h-3 ${confidence.color}`} />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs">
                <p>{confidence.tooltip}</p>
                {estimatedRemaining && <p>Est. remaining: {estimatedRemaining}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        {canCancel && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            disabled={isCancelling}
            data-testid="button-cancel-refresh"
            className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 dark:hover:border-red-800"
          >
            <StopCircle className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Enhanced full card version with progress details
  const estimatedRemaining = getEstimatedTimeRemaining();
  const confidence = getConfidenceIndicator();
  
  return (
    <Card className={`p-4 ${className}`} data-testid="refresh-stopwatch-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <StatusIcon className={statusProps.iconClass} />
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-sm">{statusProps.title}</h4>
              <Badge variant={statusProps.badgeVariant} className={`${statusProps.badgeClass} font-mono text-sm`}>
                {formattedTime}
              </Badge>
            </div>
            
            {/* Contextual description with estimation message */}
            <p className="text-sm text-muted-foreground">
              {contextualMessage || statusProps.description}
            </p>
            
            {/* Progress text for refreshing status */}
            {status === 'refreshing' && progressPercentage !== undefined && (
              <div className="text-xs text-muted-foreground">
                <span>Progress {progressPercentage}%</span>
              </div>
            )}
            
            {/* Estimation details */}
            {estimation && status === 'refreshing' && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {estimatedRemaining && (
                  <div className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>Est. remaining: {estimatedRemaining}</span>
                  </div>
                )}
                {/* Peak hours indicator removed - now shown dynamically in contextualMessage when exceeding estimate */}
              </div>
            )}
            
            {/* Initial estimation message */}
            {estimation && status === 'refreshing' && estimation.message && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                {estimation.message}
              </p>
            )}
            
            {error && (status === 'failed' || status === 'cancelled') && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-md">
                {error}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {canCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              disabled={isCancelling}
              data-testid="button-cancel-refresh"
              className="h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 dark:hover:border-red-800"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Cancel Refresh
            </Button>
          )}
          {onDismiss && (status === 'completed' || status === 'failed' || status === 'cancelled') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              data-testid="button-dismiss-refresh"
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Hook to manage refresh notifications with auto-dismiss
export function useRefreshNotifications(refreshInfo: RefreshInfo) {
  const { status, elapsedTime } = refreshInfo;
  
  // Return notification props for toast/alert systems
  const getNotification = () => {
    if (status === 'completed') {
      return {
        title: "Dataset Refresh Completed",
        description: `Successfully refreshed in ${formatElapsedTime(elapsedTime)}`,
        variant: "default" as const
      };
    } else if (status === 'failed') {
      return {
        title: "Dataset Refresh Failed",
        description: `Failed after ${formatElapsedTime(elapsedTime)}. ${refreshInfo.error || ''}`,
        variant: "destructive" as const
      };
    }
    return null;
  };

  return {
    notification: getNotification(),
    shouldShow: status === 'completed' || status === 'failed',
    formatElapsedTime: (seconds: number) => formatElapsedTime(seconds)
  };
}