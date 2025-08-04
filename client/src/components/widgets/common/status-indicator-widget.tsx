import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Play, 
  Pause, 
  Square,
  Circle,
  TrendingUp,
  TrendingDown,
  Minus,
  LucideIcon
} from 'lucide-react';

interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon?: LucideIcon;
  description?: string;
}

interface StatusIndicatorWidgetProps {
  // Single status mode
  status?: string;
  customStatuses?: Record<string, StatusConfig>;
  
  // Multiple status mode
  statuses?: Array<{
    status: string;
    count: number;
    percentage?: number;
  }>;
  
  // Priority mode
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Progress mode
  progress?: {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
  };
  
  // Display configuration
  variant?: 'badge' | 'card' | 'indicator' | 'list' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showCount?: boolean;
  showPercentage?: boolean;
  
  // Layout
  title?: string;
  className?: string;
  onClick?: (status: string) => void;
}

const defaultStatuses: Record<string, StatusConfig> = {
  // Job/Order statuses
  'pending': {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    icon: Clock
  },
  'in_progress': {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    icon: Play
  },
  'completed': {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    icon: CheckCircle
  },
  'cancelled': {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    icon: XCircle
  },
  'failed': {
    value: 'failed',
    label: 'Failed',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    icon: AlertCircle
  },
  'on_hold': {
    value: 'on_hold',
    label: 'On Hold',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    icon: Pause
  },
  'draft': {
    value: 'draft',
    label: 'Draft',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    icon: Circle
  },
  'active': {
    value: 'active',
    label: 'Active',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    icon: CheckCircle
  },
  'inactive': {
    value: 'inactive',
    label: 'Inactive',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    icon: Square
  }
};

const priorityStatuses: Record<string, StatusConfig> = {
  'low': {
    value: 'low',
    label: 'Low',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    icon: Minus
  },
  'medium': {
    value: 'medium',
    label: 'Medium',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    icon: TrendingUp
  },
  'high': {
    value: 'high',
    label: 'High',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    icon: TrendingUp
  },
  'critical': {
    value: 'critical',
    label: 'Critical',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    icon: AlertCircle
  }
};

export default function StatusIndicatorWidget({
  status,
  customStatuses,
  statuses = [],
  priority,
  progress,
  variant = 'badge',
  size = 'md',
  showIcon = true,
  showCount = false,
  showPercentage = false,
  title,
  className = '',
  onClick
}: StatusIndicatorWidgetProps) {
  const statusConfig = customStatuses || defaultStatuses;
  const activeStatus = priority ? priorityStatuses[priority] : (status ? statusConfig[status] : null);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-base px-4 py-2';
      default: return 'text-sm px-3 py-1.5';
    }
  };

  const renderSingleStatus = () => {
    if (!activeStatus) return null;
    
    const Icon = activeStatus.icon;
    
    switch (variant) {
      case 'badge':
        return (
          <Badge 
            className={`${activeStatus.bgColor} ${activeStatus.textColor} ${getSizeClasses()} hover:opacity-80 cursor-pointer`}
            onClick={() => onClick?.(activeStatus.value)}
          >
            {showIcon && Icon && <Icon className="w-3 h-3 mr-1" />}
            {activeStatus.label}
          </Badge>
        );
        
      case 'indicator':
        return (
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={() => onClick?.(activeStatus.value)}
          >
            <div className={`w-3 h-3 rounded-full ${activeStatus.color}`} />
            <span className={`${getSizeClasses()} ${activeStatus.textColor}`}>
              {activeStatus.label}
            </span>
          </div>
        );
        
      case 'card':
        return (
          <Card 
            className={`${activeStatus.bgColor} border-${activeStatus.color.replace('bg-', 'border-')} cursor-pointer hover:opacity-80`}
            onClick={() => onClick?.(activeStatus.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {showIcon && Icon && <Icon className="w-5 h-5" />}
                <span className={`font-medium ${activeStatus.textColor}`}>
                  {activeStatus.label}
                </span>
              </div>
              {activeStatus.description && (
                <p className={`text-sm mt-1 ${activeStatus.textColor} opacity-80`}>
                  {activeStatus.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return (
          <span className={`${activeStatus.textColor} ${getSizeClasses()}`}>
            {showIcon && Icon && <Icon className="w-4 h-4 inline mr-1" />}
            {activeStatus.label}
          </span>
        );
    }
  };

  const renderMultipleStatuses = () => {
    if (statuses.length === 0) return null;
    
    return (
      <div className="space-y-2">
        {statuses.map((statusItem, index) => {
          const config = statusConfig[statusItem.status];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => onClick?.(statusItem.status)}
            >
              <div className="flex items-center gap-2">
                {showIcon && Icon && <Icon className="w-4 h-4" />}
                <span className={`${getSizeClasses()} ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showCount && (
                  <Badge variant="secondary">{statusItem.count}</Badge>
                )}
                {showPercentage && statusItem.percentage !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {statusItem.percentage}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderProgress = () => {
    if (!progress) return null;
    
    const percentage = Math.round((progress.current / progress.total) * 100);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {progress.label || 'Progress'}
          </span>
          {progress.showPercentage !== false && (
            <span className="text-sm text-muted-foreground">
              {percentage}%
            </span>
          )}
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.current}</span>
          <span>{progress.total}</span>
        </div>
      </div>
    );
  };

  const content = () => {
    if (variant === 'progress' && progress) {
      return renderProgress();
    }
    
    if (variant === 'list' && statuses.length > 0) {
      return renderMultipleStatuses();
    }
    
    return renderSingleStatus();
  };

  if (title && variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {content()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {title && variant !== 'card' && (
        <h3 className="text-sm font-medium mb-2">{title}</h3>
      )}
      {content()}
    </div>
  );
}