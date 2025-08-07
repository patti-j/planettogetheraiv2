import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface GanttChartWidgetProps {
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
  isMobile?: boolean;
  compact?: boolean;
}

export default function GanttChartWidget({ 
  configuration = {}, 
  className = '', 
  isMobile = false, 
  compact = false 
}: GanttChartWidgetProps) {
  // Fetch real operations data from the API
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations']
  });

  // Transform operations data to match the expected format
  const transformedData = React.useMemo(() => {
    if (!operations || !Array.isArray(operations)) return [];
    
    return operations.map((op: any) => ({
      id: op.id,
      orderNumber: `OP-${op.id}`,
      item: op.operationName || `Operation ${op.id}`,
      quantity: op.standardDuration || 0,
      startDate: op.startTime ? new Date(op.startTime) : new Date(),
      endDate: op.endTime ? new Date(op.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: op.status || "scheduled",
      priority: op.priority === 1 ? "critical" : op.priority <= 3 ? "high" : op.priority <= 7 ? "medium" : "low",
      progress: op.completionPercentage || 0,
      resource: `Work Center ${op.workCenterId || 1}`
    }));
  }, [operations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (operationsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading operations...</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {transformedData.slice(0, 3).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              {getPriorityIcon(order.priority)}
              <span className="font-medium text-sm">{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
              <span className="text-xs text-muted-foreground">{order.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Production Timeline</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Today</Button>
          <Button variant="outline" size="sm">Week</Button>
          <Button variant="outline" size="sm">Month</Button>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="grid grid-cols-8 gap-1 mb-2 text-xs text-muted-foreground font-medium">
        <div>Order</div>
        <div>Item</div>
        <div>Resource</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Progress</div>
        <div>Start</div>
        <div>End</div>
      </div>

      {/* Timeline Content */}
      <div className="space-y-2">
        {transformedData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No operations found</p>
          </Card>
        ) : (
          transformedData.map((order) => (
            <Card key={order.id} className="p-3">
              <div className="grid grid-cols-8 gap-1 items-center text-sm">
                <div className="font-medium">{order.orderNumber}</div>
                <div>{order.item}</div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {order.resource}
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                  <span className="capitalize">{order.status}</span>
                </div>
                <div>{getPriorityIcon(order.priority)}</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getStatusColor(order.status)}`}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <span className="text-xs">{order.progress}%</span>
                </div>
                <div className="text-xs">
                  {order.startDate.toLocaleDateString()}
                </div>
                <div className="text-xs">
                  {order.endDate.toLocaleDateString()}
                </div>
              </div>

              {/* Gantt Bar Visualization */}
              <div className="mt-3 relative">
                <div className="w-full h-6 bg-gray-100 rounded relative">
                  <div 
                    className={`absolute top-0 h-full rounded ${getStatusColor(order.status)} opacity-80`}
                    style={{ 
                      left: '10%', 
                      width: `${Math.max(order.progress, 10)}%` 
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white mix-blend-difference">
                    {order.quantity.toLocaleString()} units
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Delayed</span>
        </div>
      </div>
    </div>
  );
}