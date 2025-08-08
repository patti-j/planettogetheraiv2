import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [timelineStart] = useState(new Date(2025, 7, 7, 7, 0)); // Aug 7, 7 AM
  const [timelineEnd] = useState(new Date(2025, 7, 7, 21, 0)); // Aug 7, 9 PM
  const totalHours = 14; // 7 AM to 9 PM

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
    const hoursFromStart = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60);
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

  // Generate hour markers
  const hourMarkers = [];
  for (let i = 0; i <= totalHours; i++) {
    const hour = 7 + i; // Starting at 7 AM
    const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
    hourMarkers.push(
      <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border">
        {displayHour}
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📅 Production Timeline
          <Badge variant="secondary">{operations.length} Operations</Badge>
        </h3>
      </div>

      <div ref={containerRef} className="relative">
        {/* Timeline header */}
        <div className="flex border-b border-border pb-2 mb-4">
          <div className="w-48 pr-4 text-sm font-medium">Resources</div>
          <div className="flex-1 flex">
            {hourMarkers}
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