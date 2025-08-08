import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Maximize2, Calendar, Clock, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Operation {
  id: number;
  operationName: string;
  productionOrderId: number;
  workCenterId: number;
  startTime: string;
  endTime: string;
  status: string;
  standardDuration: number;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  isDrum?: boolean;
}

interface GanttResourceViewProps {
  operations: Operation[];
  resources: Resource[];
  className?: string;
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date) => Promise<void>;
}

export function GanttResourceView({ operations, resources, className = '', onOperationMove }: GanttResourceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = default, 2 = zoomed in, 0.5 = zoomed out
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [draggedOperation, setDraggedOperation] = useState<Operation | null>(null);
  const [dropTarget, setDropTarget] = useState<{ resourceId: number; time: Date } | null>(null);
  
  // Process operations to ensure they're fresh objects with parsed dates
  const processedOperations = useMemo(() => {
    console.log('Processing operations, raw count:', operations.length);
    const processed = operations.map(op => ({
      ...op,
      startTime: typeof op.startTime === 'string' ? op.startTime : op.startTime.toISOString(),
      endTime: typeof op.endTime === 'string' ? op.endTime : op.endTime.toISOString()
    }));
    console.log('Processed operations:', processed.map(op => ({
      id: op.id,
      name: op.operationName,
      start: op.startTime,
      end: op.endTime,
      resource: op.workCenterId
    })));
    return processed;
  }, [operations]);
  
  // Calculate timeline range based on actual operations
  const timelineRange = useMemo(() => {
    if (processedOperations.length === 0) {
      // Default range if no operations
      return {
        start: new Date(2025, 7, 7, 0, 0), // Aug 7, midnight
        end: new Date(2025, 7, 14, 0, 0) // Aug 14, midnight (1 week)
      };
    }
    
    // Find min and max dates from operations
    let minDate = new Date(processedOperations[0].startTime);
    let maxDate = new Date(processedOperations[0].endTime);
    
    processedOperations.forEach(op => {
      const start = new Date(op.startTime);
      const end = new Date(op.endTime);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });
    
    // Add padding: start at beginning of day, end at end of day
    const rangeStart = new Date(minDate);
    rangeStart.setHours(0, 0, 0, 0);
    
    const rangeEnd = new Date(maxDate);
    rangeEnd.setHours(23, 59, 59, 999);
    
    // If same day, show hourly view, otherwise daily
    if (rangeStart.toDateString() === rangeEnd.toDateString()) {
      rangeStart.setHours(6, 0, 0, 0); // Start at 6 AM
      rangeEnd.setHours(22, 0, 0, 0); // End at 10 PM
    }
    
    return { start: rangeStart, end: rangeEnd };
  }, [processedOperations]);
  
  console.log('GanttResourceView: Timeline range', timelineRange);
  console.log('GanttResourceView: Processed operations', processedOperations);
  
  // Calculate total hours based on timeline range
  const getTimeRange = () => {
    const hours = (timelineRange.end.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60);
    return { 
      hours, 
      start: timelineRange.start, 
      end: timelineRange.end 
    };
  };
  
  const timeRange = getTimeRange();
  const totalHours = timeRange.hours; // Don't divide by zoomLevel - this is the base timeline

  // Group operations by resource - use processedOperations
  const operationsByResource = resources.map(resource => ({
    resource,
    operations: processedOperations.filter(op => op.workCenterId === resource.id)
  }));

  // Calculate position and width for an operation
  const getOperationStyle = (op: Operation) => {
    const start = new Date(op.startTime);
    const end = new Date(op.endTime);
    
    // Calculate hours from timeline start
    const hoursFromStart = (start.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Use the base time range (before zoom) for percentage calculations
    const baseHours = timeRange.hours; // This is the actual hours in the timeline
    
    // Convert to percentage based on the base timeline, not the zoomed timeline
    const left = (hoursFromStart / baseHours) * 100;
    const width = (duration / baseHours) * 100;
    
    // Debug logging
    console.log(`Operation ${op.id} position:`, {
      operationId: op.id,
      startTime: op.startTime,
      endTime: op.endTime,
      hoursFromStart,
      duration,
      baseHours,
      totalHours,
      zoomLevel,
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    });
    
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 2, 4)); // Max zoom 4x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 2, 0.25)); // Min zoom 0.25x
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
  };

  // Generate time markers based on view mode
  const generateTimeMarkers = () => {
    const markers = [];
    const baseHours = timeRange.hours; // Use base hours, not zoomed
    const baseDays = Math.ceil(baseHours / 24);
    
    if (baseDays <= 1 || viewMode === 'hourly') {
      // Show hourly markers for single day or hourly view
      const startHour = timeRange.start.getHours();
      const hoursToShow = Math.ceil(baseHours);
      const hourStep = Math.max(1, Math.floor(hoursToShow / 8)); // Adjust step based on zoom
      
      for (let i = 0; i <= hoursToShow; i += hourStep) {
        const currentHour = startHour + i;
        if (currentHour >= 24) break;
        
        const displayHour = currentHour === 0 ? '12 AM' : currentHour === 12 ? '12 PM' : 
                          currentHour > 12 ? `${currentHour - 12} PM` : `${currentHour} AM`;
        markers.push(
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
            {displayHour}
          </div>
        );
      }
    } else {
      // Show daily markers for multi-day view
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < baseDays; i++) {
        const date = new Date(timeRange.start);
        date.setDate(date.getDate() + i);
        
        if (date > timeRange.end) break;
        
        markers.push(
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
            <div>{days[date.getDay()]}</div>
            <div className="text-[10px]">{date.getMonth() + 1}/{date.getDate()}</div>
          </div>
        );
      }
    }
    
    return markers;
  };
  
  const timeMarkers = generateTimeMarkers();

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, operation: Operation) => {
    setDraggedOperation(operation);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    target.style.cursor = 'grabbing';
    
    // Store the operation data in dataTransfer
    e.dataTransfer.setData('operation', JSON.stringify(operation));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.style.cursor = 'move';
    setDraggedOperation(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, resourceId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate time based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const hoursOffset = totalHours * percentage;
    
    const newTime = new Date(timeRange.start);
    newTime.setHours(newTime.getHours() + Math.floor(hoursOffset));
    
    setDropTarget({ resourceId, time: newTime });
  };

  const handleDrop = async (e: React.DragEvent, resourceId: number) => {
    e.preventDefault();
    
    if (!draggedOperation || !onOperationMove) return;
    
    // Don't allow dropping on same resource
    if (draggedOperation.workCenterId === resourceId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const hoursOffset = totalHours * percentage;
      
      const newStartTime = new Date(timeRange.start);
      newStartTime.setHours(newStartTime.getHours() + Math.floor(hoursOffset));
      
      // Check if time is significantly different (at least 30 minutes)
      const oldStart = new Date(draggedOperation.startTime);
      const timeDiff = Math.abs(newStartTime.getTime() - oldStart.getTime());
      if (timeDiff < 30 * 60 * 1000) {
        setDraggedOperation(null);
        setDropTarget(null);
        return; // No significant change
      }
    }
    
    // Calculate drop time
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const hoursOffset = totalHours * percentage;
    
    const newStartTime = new Date(timeRange.start);
    newStartTime.setHours(newStartTime.getHours() + Math.floor(hoursOffset));
    
    // Round to nearest 15 minutes for more precision
    const minutes = newStartTime.getMinutes();
    newStartTime.setMinutes(Math.round(minutes / 15) * 15);
    
    try {
      await onOperationMove(draggedOperation.id, resourceId, newStartTime);
      
      // Get the selected algorithm for the success message
      const selectedAlgorithm = localStorage.getItem('selectedRescheduleAlgorithm');
      const algorithmMessage = selectedAlgorithm 
        ? ` using ${selectedAlgorithm.replace(/-/g, ' ').toUpperCase()} algorithm`
        : '';
      
      toast({
        title: "✓ Operation Rescheduled",
        description: `${draggedOperation.operationName} moved to ${newStartTime.toLocaleString()}${algorithmMessage}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Reschedule",
        description: error.message || "Could not move the operation. Please try again.",
        variant: "destructive",
      });
    }
    
    setDraggedOperation(null);
    setDropTarget(null);
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📅 Production Timeline
          <Badge variant="secondary">{processedOperations.length} Operations</Badge>
        </h3>
        
        {/* View Mode and Zoom Controls */}
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Hourly
                </div>
              </SelectItem>
              <SelectItem value="daily">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Daily
                </div>
              </SelectItem>
              <SelectItem value="weekly">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Weekly
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 border-l pl-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.25}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFitToScreen}
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="ml-2">
              {Math.round(zoomLevel * 100)}%
            </Badge>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        {/* Timeline header */}
        <div className="flex border-b border-border pb-2 mb-4">
          <div className="w-48 pr-4 text-sm font-medium">Resources</div>
          <div className="flex-1 overflow-x-auto">
            <div 
              className="flex min-w-full"
              style={{ 
                width: `${100 * zoomLevel}%`,
                minWidth: '100%'
              }}
            >
              {timeMarkers}
            </div>
          </div>
        </div>

        {/* Resource rows */}
        {operationsByResource.map(({ resource, operations: resourceOps }) => (
          <div key={resource.id} className="flex border-b border-border py-2 min-h-[60px]">
            {/* Resource info */}
            <div className="w-48 pr-4">
              <div className="font-medium flex items-center gap-2">
                {resource.isDrum && <span className="text-red-500">🥁</span>}
                {resource.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {resource.type} • {resourceOps.length} operations
              </div>
            </div>

            {/* Timeline with operations */}
            <div 
              className={`flex-1 relative h-12 ${
                draggedOperation ? 'bg-gray-50 dark:bg-gray-900/50' : ''
              } transition-colors duration-200`}
              onDragOver={(e) => handleDragOver(e, resource.id)}
              onDrop={(e) => handleDrop(e, resource.id)}
            >
              {/* Drop indicator with time preview */}
              {dropTarget && dropTarget.resourceId === resource.id && draggedOperation && (
                <>
                  <div
                    className="absolute top-0 h-full w-1 bg-blue-500 z-20 pointer-events-none animate-pulse"
                    style={{
                      left: `${((dropTarget.time.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60) / totalHours) * 100}%`
                    }}
                  />
                  <div
                    className="absolute -top-6 bg-blue-500 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none"
                    style={{
                      left: `${((dropTarget.time.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60) / totalHours) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {dropTarget.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
              
              {resourceOps.map((op) => {
                const style = getOperationStyle(op);
                const statusColor = getStatusColor(op.status);
                const isDragging = draggedOperation?.id === op.id;
                
                // Force unique key with position data to ensure re-render
                const uniqueKey = `${op.id}-${op.workCenterId}-${new Date(op.startTime).getTime()}-${style.left}-${style.width}`;
                
                return (
                  <div
                    key={uniqueKey}
                    draggable
                    onDragStart={(e) => handleDragStart(e, op)}
                    onDragEnd={handleDragEnd}
                    className={`absolute top-0 h-full rounded overflow-hidden cursor-move hover:z-10 hover:shadow-lg transition-all duration-200 ${statusColor} ${
                      isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''
                    } hover:ring-2 hover:ring-blue-400`}
                    style={{
                      position: 'absolute',
                      left: style.left,
                      width: style.width,
                      top: 0,
                      height: '100%'
                    }}
                    title={`${op.operationName} - PO-${op.productionOrderId}
Start: ${new Date(op.startTime).toLocaleString('en-US', { 
  year: 'numeric', month: 'short', day: 'numeric', 
  hour: '2-digit', minute: '2-digit', hour12: false,
  timeZone: 'UTC'
})} UTC
End: ${new Date(op.endTime).toLocaleString('en-US', { 
  year: 'numeric', month: 'short', day: 'numeric', 
  hour: '2-digit', minute: '2-digit', hour12: false,
  timeZone: 'UTC'
})} UTC
Duration: ${op.standardDuration} min
Status: ${op.status}`}
                  >
                    <div className="h-1/2 bg-black/20 px-1 text-[10px] text-white font-bold flex items-center justify-between">
                      <span className="truncate">PO-{op.productionOrderId}</span>
                      <GripVertical className="w-3 h-3 flex-shrink-0" />
                    </div>
                    <div className="h-1/2 px-1 text-[10px] text-white flex items-center">
                      <span className="truncate">{op.operationName.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend and Instructions */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        {resources.some(r => r.isDrum) && (
          <div className="flex items-center gap-1">
            <span className="text-red-500">🥁</span>
            <span>Bottleneck Resource</span>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto text-muted-foreground">
          <GripVertical className="w-3 h-3" />
          <span>Drag operations to reschedule</span>
        </div>
      </div>
    </Card>
  );
}