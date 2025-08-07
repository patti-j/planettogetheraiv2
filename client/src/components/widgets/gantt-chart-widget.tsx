import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import GanttChart from '@/components/ui/gantt-chart';

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
  // Fetch all required data for the Gantt chart
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations']
  });
  
  const { data: productionOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/production-orders']
  });
  
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources']
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

  if (operationsLoading || ordersLoading || resourcesLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  // Use the actual GanttChart component for proper operation grouping
  return (
    <div className={`w-full ${className}`} style={{ height: isMobile ? '300px' : '400px' }}>
      <GanttChart 
        jobs={(productionOrders as any) || []}
        operations={(operations as any) || []}
        resources={(resources as any) || []}
        capabilities={[]}
        view="operations"  // Use operations view to group by production orders
        rowHeight={compact || isMobile ? 40 : 60}
      />
    </div>
  );
}