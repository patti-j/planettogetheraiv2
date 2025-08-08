import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface GanttWidgetProps {
  configuration?: {
    showLegend?: boolean;
    viewMode?: 'day' | 'week' | 'month';
    height?: string;
    enableDragDrop?: boolean;
    showResourceNames?: boolean;
    showTimeScale?: boolean;
    compactMode?: boolean;
  };
  className?: string;
}

interface Operation {
  id: number;
  operationName: string;
  workCenterId: number;
  startTime: string;
  endTime: string;
  status: string;
  priority?: number;
  completionPercentage?: number;
}

interface Resource {
  id: number;
  name: string;
  type?: string;
  capabilities?: string[];
}

export default function GanttWidget({ configuration = {}, className }: GanttWidgetProps) {
  const {
    showLegend = true,
    viewMode = 'day',
    height = '400px',
    enableDragDrop = false,
    showResourceNames = true,
    showTimeScale = true,
    compactMode = false
  } = configuration;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedOperation, setDraggedOperation] = useState<Operation | null>(null);

  // Fetch operations data
  const { data: operations = [], isLoading: operationsLoading } = useQuery<Operation[]>({
    queryKey: ['/api/operations']
  });

  // Fetch resources data
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['/api/resources']
  });

  // Calculate time range based on view mode
  const timeRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(diff + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  // Filter operations within time range
  const visibleOperations = useMemo(() => {
    return operations.filter(op => {
      const opStart = new Date(op.startTime);
      const opEnd = new Date(op.endTime);
      return opStart <= timeRange.end && opEnd >= timeRange.start;
    });
  }, [operations, timeRange]);

  // Group operations by resource
  const operationsByResource = useMemo(() => {
    const grouped = new Map<number, Operation[]>();
    
    resources.forEach(resource => {
      grouped.set(resource.id, []);
    });
    
    visibleOperations.forEach(op => {
      const resourceOps = grouped.get(op.workCenterId) || [];
      resourceOps.push(op);
      grouped.set(op.workCenterId, resourceOps);
    });
    
    return grouped;
  }, [resources, visibleOperations]);

  // Calculate position and width for an operation
  const getOperationStyle = (operation: Operation) => {
    const opStart = new Date(operation.startTime);
    const opEnd = new Date(operation.endTime);
    const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    
    const startOffset = Math.max(0, opStart.getTime() - timeRange.start.getTime());
    const endOffset = Math.min(rangeMs, opEnd.getTime() - timeRange.start.getTime());
    
    const left = (startOffset / rangeMs) * 100;
    const width = ((endOffset - startOffset) / rangeMs) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-orange-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, operation: Operation) => {
    if (!enableDragDrop) return;
    setDraggedOperation(operation);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, resourceId: number, timePercent: number) => {
    e.preventDefault();
    if (!enableDragDrop || !draggedOperation) return;
    
    const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    const newStartMs = timeRange.start.getTime() + (rangeMs * timePercent);
    const newStartTime = new Date(newStartMs);
    
    // Calculate duration
    const duration = new Date(draggedOperation.endTime).getTime() - 
                    new Date(draggedOperation.startTime).getTime();
    const newEndTime = new Date(newStartMs + duration);
    
    try {
      // Update operation via API
      await apiRequest('PUT', `/api/operations/${draggedOperation.id}`, {
        workCenterId: resourceId,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      });
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
      
      toast({
        title: "Operation Rescheduled",
        description: `${draggedOperation.operationName} moved successfully`
      });
    } catch (error) {
      toast({
        title: "Failed to Reschedule",
        description: "Could not move the operation",
        variant: "destructive"
      });
    }
    
    setDraggedOperation(null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDragDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Navigate time
  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  // Format date for display
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: viewMode === 'month' ? 'numeric' : undefined
    };
    
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString(undefined, { ...options, year: 'numeric' });
    } else if (viewMode === 'week') {
      return `${timeRange.start.toLocaleDateString(undefined, options)} - ${timeRange.end.toLocaleDateString(undefined, options)}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  };

  // Loading state
  if (operationsLoading || resourcesLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      <CardHeader className={compactMode ? "py-3 px-4" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className={compactMode ? "h-4 w-4" : "h-5 w-5"} />
            <span className={compactMode ? "text-sm" : ""}>Production Schedule</span>
            <Badge variant="secondary" className={compactMode ? "text-xs" : ""}>
              {visibleOperations.length} Operations
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Time navigation */}
            <div className="flex items-center gap-1">
              <Button
                size={compactMode ? "sm" : "icon"}
                variant="ghost"
                onClick={() => navigateTime('prev')}
                className={compactMode ? "h-7 w-7" : ""}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className={cn(
                "font-medium min-w-[140px] text-center",
                compactMode && "text-sm"
              )}>
                {formatDateRange()}
              </span>
              <Button
                size={compactMode ? "sm" : "icon"}
                variant="ghost"
                onClick={() => navigateTime('next')}
                className={compactMode ? "h-7 w-7" : ""}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Fullscreen toggle */}
            <Button
              size={compactMode ? "sm" : "icon"}
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={compactMode ? "h-7 w-7" : ""}
            >
              {isFullscreen ? 
                <Minimize2 className="h-4 w-4" /> : 
                <Maximize2 className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={compactMode ? "p-2" : ""}>
        <div 
          className="relative overflow-auto"
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
        >
          {/* Time scale header */}
          {showTimeScale && (
            <div className={cn(
              "flex border-b sticky top-0 bg-background z-10",
              compactMode ? "h-6 text-xs" : "h-8 text-sm"
            )}>
              <div className={cn(
                "border-r flex-shrink-0",
                showResourceNames ? (compactMode ? "w-20" : "w-32") : "w-0"
              )} />
              <div className="flex-1 flex">
                {Array.from({ length: viewMode === 'day' ? 24 : (viewMode === 'week' ? 7 : 30) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 text-center border-r text-muted-foreground"
                  >
                    {viewMode === 'day' ? `${i}:00` : 
                     viewMode === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] :
                     i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Resources and operations */}
          {Array.from(operationsByResource.entries()).map(([resourceId, ops]) => {
            const resource = resources.find(r => r.id === resourceId);
            if (!resource) return null;
            
            return (
              <div 
                key={resourceId} 
                className={cn(
                  "flex border-b",
                  compactMode ? "h-10" : "h-14"
                )}
              >
                {/* Resource name */}
                {showResourceNames && (
                  <div className={cn(
                    "border-r flex-shrink-0 flex items-center px-2 bg-muted/30",
                    compactMode ? "w-20 text-xs" : "w-32 text-sm"
                  )}>
                    <span className="font-medium truncate">{resource.name}</span>
                  </div>
                )}
                
                {/* Operations timeline */}
                <div 
                  className="flex-1 relative"
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    handleDrop(e, resourceId, percent);
                  }}
                >
                  {ops.map(operation => (
                    <div
                      key={operation.id}
                      className={cn(
                        "absolute rounded-sm flex items-center px-1 cursor-pointer transition-all hover:z-10 hover:shadow-lg",
                        getStatusColor(operation.status),
                        compactMode ? "top-1 h-8" : "top-2 h-10",
                        enableDragDrop && "cursor-move"
                      )}
                      style={getOperationStyle(operation)}
                      draggable={enableDragDrop}
                      onDragStart={(e) => handleDragStart(e, operation)}
                      title={`${operation.operationName} (${operation.status})`}
                    >
                      <span className={cn(
                        "text-white truncate font-medium",
                        compactMode ? "text-xs" : "text-sm"
                      )}>
                        {operation.operationName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className={cn(
            "flex gap-4 mt-4 flex-wrap",
            compactMode && "mt-2"
          )}>
            {['scheduled', 'in_progress', 'completed', 'delayed'].map(status => (
              <div key={status} className="flex items-center gap-1">
                <div className={cn(
                  "rounded",
                  getStatusColor(status),
                  compactMode ? "w-2 h-2" : "w-3 h-3"
                )} />
                <span className={cn(
                  "text-muted-foreground capitalize",
                  compactMode ? "text-xs" : "text-sm"
                )}>
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}