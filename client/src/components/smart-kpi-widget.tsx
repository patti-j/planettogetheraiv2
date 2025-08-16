import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';

interface SmartKpiWidgetProps {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'good' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
  data: number[];
  description?: string;
  isEditMode?: boolean;
  onRemove?: () => void;
}

export function SmartKpiWidget({
  id,
  title,
  currentValue,
  targetValue,
  unit,
  status,
  trend,
  data,
  description,
  isEditMode = false,
  onRemove
}: SmartKpiWidgetProps) {
  const achievementPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
  
  const statusColors = {
    good: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    danger: 'text-red-600 bg-red-50 dark:bg-red-950/30'
  };

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    stable: <Minus className="w-3 h-3" />
  };

  // Simple sparkline using CSS
  const sparklinePoints = data.slice(-15).map((value, index) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const height = range > 0 ? ((value - min) / range) * 40 : 20;
    return `${(index * 6)}px ${40 - height}px`;
  }).join(', ');

  return (
    <Card className="relative">
      {isEditMode && onRemove && (
        <Button
          variant="outline"
          size="sm"
          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-white shadow-lg border-2"
          onClick={onRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Badge variant="outline" className={statusColors[status]}>
            {trendIcon[trend]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Current Value */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {currentValue.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {targetValue.toLocaleString()}{unit} ({achievementPercentage}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  status === 'good' ? 'bg-green-500' : 
                  status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-10 relative">
            <svg className="w-full h-full" viewBox="0 0 90 40">
              <polyline
                points={sparklinePoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={
                  status === 'good' ? 'text-green-500' : 
                  status === 'warning' ? 'text-amber-500' : 'text-red-500'
                }
              />
            </svg>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}