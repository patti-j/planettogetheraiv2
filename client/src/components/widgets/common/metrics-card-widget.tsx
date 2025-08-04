import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Calendar,
  Target,
  Zap,
  LucideIcon
} from 'lucide-react';

interface MetricChange {
  value: number;
  label: string;
  direction: 'up' | 'down' | 'neutral';
  isPercentage?: boolean;
  period?: string;
}

interface MetricsCardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  
  // Change/Trend indicators
  change?: MetricChange;
  trend?: 'positive' | 'negative' | 'neutral';
  
  // Progress indicators
  progress?: {
    current: number;
    target: number;
    label?: string;
    showPercentage?: boolean;
  };
  
  // Visual configuration
  icon?: LucideIcon | string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange';
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  
  // Additional data
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  
  // Actions
  onClick?: () => void;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  'chart': BarChart3,
  'users': Users,
  'package': Package,
  'clock': Clock,
  'alert': AlertTriangle,
  'check': CheckCircle,
  'dollar': DollarSign,
  'activity': Activity,
  'calendar': Calendar,
  'target': Target,
  'zap': Zap,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown
};

const colorConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-600',
    border: 'border-blue-200 dark:border-blue-800'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-600',
    border: 'border-green-200 dark:border-green-800'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600',
    border: 'border-red-200 dark:border-red-800'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-600',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-600',
    border: 'border-purple-200 dark:border-purple-800'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-600',
    border: 'border-orange-200 dark:border-orange-800'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-950',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'text-gray-600',
    border: 'border-gray-200 dark:border-gray-800'
  }
};

export default function MetricsCardWidget({
  title,
  value,
  subtitle,
  change,
  trend,
  progress,
  icon,
  color = 'blue',
  variant = 'default',
  size = 'md',
  badge,
  onClick,
  className = ''
}: MetricsCardWidgetProps) {
  const colorClasses = colorConfig[color];
  
  // Resolve icon
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : icon;
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const renderChangeIndicator = () => {
    if (!change) return null;
    
    const ChangeIcon = change.direction === 'up' ? TrendingUp : 
                      change.direction === 'down' ? TrendingDown : Minus;
    
    const changeColor = change.direction === 'up' ? 'text-green-600' :
                       change.direction === 'down' ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div className={`flex items-center gap-1 text-sm ${changeColor}`}>
        <ChangeIcon className="w-4 h-4" />
        <span>
          {change.isPercentage && change.direction !== 'neutral' && (change.direction === 'up' ? '+' : '-')}
          {Math.abs(change.value)}
          {change.isPercentage ? '%' : ''}
        </span>
        <span className="text-muted-foreground">
          {change.label}
          {change.period && ` ${change.period}`}
        </span>
      </div>
    );
  };

  const renderProgress = () => {
    if (!progress) return null;
    
    const percentage = Math.min(100, Math.round((progress.current / progress.target) * 100));
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {progress.label || 'Progress'}
          </span>
          {progress.showPercentage !== false && (
            <span className="font-medium">{percentage}%</span>
          )}
        </div>
        <Progress 
          value={percentage} 
          className="h-2" 
          // Apply color theme to progress bar
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.current.toLocaleString()}</span>
          <span>{progress.target.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-3';
      case 'lg': return 'p-6';
      default: return 'p-4';
    }
  };

  const getValueSize = () => {
    switch (size) {
      case 'sm': return 'text-lg';
      case 'lg': return 'text-3xl';
      default: return 'text-2xl';
    }
  };

  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={`${getValueSize()} font-bold ${colorClasses.text}`}>
                {formatValue(value)}
              </p>
            </div>
            {IconComponent && (
              <IconComponent className={`w-8 h-8 ${colorClasses.icon}`} />
            )}
          </div>
        );

      case 'compact':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent className={`w-4 h-4 ${colorClasses.icon}`} />
                )}
                <p className="text-sm font-medium">{title}</p>
              </div>
              {badge && (
                <Badge variant={badge.variant || 'secondary'}>
                  {badge.text}
                </Badge>
              )}
            </div>
            <p className={`${getValueSize()} font-bold`}>
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {renderChangeIndicator()}
          </div>
        );

      case 'detailed':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                    <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                )}
                <div>
                  <p className="font-medium">{title}</p>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>
              {badge && (
                <Badge variant={badge.variant || 'secondary'}>
                  {badge.text}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <p className={`${getValueSize()} font-bold`}>
                {formatValue(value)}
              </p>
              {renderChangeIndicator()}
            </div>
            
            {renderProgress()}
          </div>
        );

      default: // 'default'
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {IconComponent && (
                <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
              )}
            </div>
            
            <div className="space-y-1">
              <p className={`${getValueSize()} font-bold`}>
                {formatValue(value)}
              </p>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              {renderChangeIndicator()}
              {badge && (
                <Badge variant={badge.variant || 'secondary'}>
                  {badge.text}
                </Badge>
              )}
            </div>
            
            {renderProgress()}
          </div>
        );
    }
  };

  return (
    <Card 
      className={`${className} ${colorClasses.border} hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className={getSizeClasses()}>
        {renderContent()}
      </CardContent>
    </Card>
  );
}