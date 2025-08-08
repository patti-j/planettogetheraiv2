import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Maximize2, Calendar, Clock } from 'lucide-react';

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
}

export function GanttResourceView({ operations, resources, className = '' }: GanttResourceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = default, 2 = zoomed in, 0.5 = zoomed out
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [timelineStart, setTimelineStart] = useState(new Date(2025, 7, 7, 7, 0)); // Aug 7, 7 AM
  const [timelineEnd, setTimelineEnd] = useState(new Date(2025, 7, 7, 21, 0)); // Aug 7, 9 PM
  
  // Calculate total hours based on zoom and view mode
  const getTimeRange = () => {
    switch(viewMode) {
      case 'hourly':
        return { hours: 14, start: new Date(2025, 7, 7, 7, 0), end: new Date(2025, 7, 7, 21, 0) };
      case 'daily':
        return { hours: 24 * 7, start: new Date(2025, 7, 4, 0, 0), end: new Date(2025, 7, 11, 0, 0) }; // Week view
      case 'weekly':
        return { hours: 24 * 30, start: new Date(2025, 7, 1, 0, 0), end: new Date(2025, 7, 31, 0, 0) }; // Month view
      default:
        return { hours: 14, start: new Date(2025, 7, 7, 7, 0), end: new Date(2025, 7, 7, 21, 0) };
    }
  };
  
  const timeRange = getTimeRange();
  const totalHours = timeRange.hours / zoomLevel;

  // Group operations by resource
  const operationsByResource = resources.map(resource => ({
    resource,
    operations: operations.filter(op => op.workCenterId === resource.id)
  }));

  // Calculate position and width for an operation
  const getOperationStyle = (op: Operation) => {
    const start = new Date(op.startTime);
    const end = new Date(op.endTime);
    
    // Calculate hours from timeline start
    const hoursFromStart = (start.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Convert to percentage
    const left = (hoursFromStart / totalHours) * 100;
    const width = (duration / totalHours) * 100;
    
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
    
    if (viewMode === 'hourly') {
      const hoursToShow = Math.ceil(totalHours);
      const hourStep = zoomLevel < 0.5 ? 2 : 1;
      
      for (let i = 0; i <= hoursToShow; i += hourStep) {
        const hour = 7 + (i * zoomLevel);
        if (hour > 21) break;
        
        const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
        markers.push(
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
            {displayHour}
          </div>
        );
      }
    } else if (viewMode === 'daily') {
      // Show days of the week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysToShow = Math.min(7, Math.ceil(totalHours / 24));
      
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(timeRange.start);
        date.setDate(date.getDate() + i);
        markers.push(
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
            <div>{days[date.getDay()]}</div>
            <div className="text-[10px]">{date.getMonth() + 1}/{date.getDate()}</div>
          </div>
        );
      }
    } else if (viewMode === 'weekly') {
      // Show weeks of the month
      const weeksToShow = Math.min(4, Math.ceil(totalHours / (24 * 7)));
      
      for (let i = 0; i < weeksToShow; i++) {
        markers.push(
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
            Week {i + 1}
          </div>
        );
      }
    }
    
    return markers;
  };
  
  const timeMarkers = generateTimeMarkers();

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📅 Production Timeline
          <Badge variant="secondary">{operations.length} Operations</Badge>
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
          <div className="flex-1 flex">
            {timeMarkers}
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
            <div className="flex-1 relative h-12">
              {resourceOps.map((op) => {
                const style = getOperationStyle(op);
                const statusColor = getStatusColor(op.status);
                
                return (
                  <div
                    key={op.id}
                    className={`absolute top-0 h-full rounded overflow-hidden cursor-pointer hover:z-10 hover:shadow-lg transition-shadow ${statusColor}`}
                    style={style}
                    title={`${op.operationName} - PO-${op.productionOrderId}`}
                  >
                    <div className="h-1/2 bg-black/20 px-1 text-[10px] text-white font-bold flex items-center">
                      PO-{op.productionOrderId}
                    </div>
                    <div className="h-1/2 px-1 text-[10px] text-white flex items-center">
                      {op.operationName.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs">
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
      </div>
    </Card>
  );
}