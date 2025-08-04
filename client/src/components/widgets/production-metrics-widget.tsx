import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Clock, AlertTriangle, Target } from 'lucide-react';

interface ProductionMetricsWidgetProps {
  configuration?: {
    filters?: {
      dateRange?: string;
      priority?: string[];
      status?: string[];
      resourceId?: number;
      searchQuery?: string;
    };
    view?: 'compact' | 'standard' | 'detailed';
    autoRefresh?: boolean;
  };
  className?: string;
}

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
}

export default function ProductionMetricsWidget({ 
  configuration = {}, 
  className = '' 
}: ProductionMetricsWidgetProps) {
  const metrics: Metric[] = [
    {
      id: 'oee',
      label: 'Overall Equipment Effectiveness',
      value: 78.5,
      unit: '%',
      target: 85,
      trend: 'up',
      trendValue: 2.3,
      status: 'warning',
      icon: Activity
    },
    {
      id: 'throughput',
      label: 'Throughput',
      value: 145,
      unit: 'units/hr',
      target: 150,
      trend: 'down',
      trendValue: -3.2,
      status: 'warning',
      icon: TrendingUp
    },
    {
      id: 'utilization',
      label: 'Resource Utilization',
      value: 82.1,
      unit: '%',
      target: 80,
      trend: 'up',
      trendValue: 1.8,
      status: 'good',
      icon: Target
    },
    {
      id: 'downtime',
      label: 'Downtime',
      value: 4.2,
      unit: 'hrs',
      target: 2,
      trend: 'up',
      trendValue: 1.1,
      status: 'critical',
      icon: AlertTriangle
    },
    {
      id: 'cycle_time',
      label: 'Avg Cycle Time',
      value: 24.6,
      unit: 'min',
      target: 25,
      trend: 'down',
      trendValue: -0.8,
      status: 'good',
      icon: Clock
    },
    {
      id: 'quality',
      label: 'First Pass Yield',
      value: 94.2,
      unit: '%',
      target: 95,
      trend: 'stable',
      trendValue: 0.1,
      status: 'warning',
      icon: Target
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, trendValue: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`w-4 h-4 ${trendValue > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`w-4 h-4 ${trendValue < 0 ? 'text-red-500' : 'text-green-500'}`} />;
    }
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  const getTargetStatus = (value: number, target?: number) => {
    if (!target) return '';
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'On Target';
    if (percentage >= 90) return 'Near Target';  
    return 'Below Target';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.id} className={`p-4 border ${getStatusColor(metric.status)}`}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium text-sm">{metric.label}</span>
                  </div>
                  {getTrendIcon(metric.trend, metric.trendValue)}
                </div>

                {/* Value */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                  
                  {/* Trend */}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className={`
                      ${metric.trend === 'up' && metric.trendValue > 0 ? 'text-green-600' : ''}
                      ${metric.trend === 'down' && metric.trendValue < 0 ? 'text-red-600' : ''}
                      ${metric.trend === 'stable' ? 'text-gray-600' : ''}
                    `}>
                      {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                    </Badge>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                </div>

                {/* Target */}
                {metric.target && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target: {metric.target}{metric.unit}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTargetStatus(metric.value, metric.target)}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metric.value >= metric.target ? 'bg-green-500' :
                          metric.value >= metric.target * 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((metric.value / metric.target) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Production Summary</h4>
            <p className="text-sm text-muted-foreground">Overall performance indicators</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              {metrics.filter(m => m.status === 'good').length} Good
            </Badge>
            <Badge variant="outline" className="text-yellow-600">
              {metrics.filter(m => m.status === 'warning').length} Warning
            </Badge>
            <Badge variant="outline" className="text-red-600">
              {metrics.filter(m => m.status === 'critical').length} Critical
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}