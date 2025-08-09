import React from 'react';
import { Card } from '@/components/ui/card';

interface GanttFallbackProps {
  operations: any[];
  resources: any[];
}

export function GanttFallback({ operations, resources }: GanttFallbackProps) {
  if (!operations?.length || !resources?.length) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/10 rounded-lg">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">No Schedule Data</h3>
          <p className="text-muted-foreground">
            Waiting for operations and resources to load...
          </p>
        </div>
      </div>
    );
  }

  // Find the earliest and latest dates
  const allDates = operations.flatMap(op => [new Date(op.startTime), new Date(op.endTime)]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const totalDuration = maxDate.getTime() - minDate.getTime();

  // Group operations by resource
  const operationsByResource = new Map();
  resources.forEach(resource => {
    const resourceOps = operations.filter(op => op.workCenterId === resource.id);
    if (resourceOps.length > 0) {
      operationsByResource.set(resource, resourceOps);
    }
  });

  // Generate time markers
  const timeMarkers = [];
  const numMarkers = 5;
  for (let i = 0; i <= numMarkers; i++) {
    const markerDate = new Date(minDate.getTime() + (totalDuration * i / numMarkers));
    timeMarkers.push({
      date: markerDate,
      position: (i / numMarkers) * 100
    });
  }

  const statusColors = {
    'completed': 'bg-green-500',
    'in-progress': 'bg-blue-500',
    'scheduled': 'bg-purple-500',
    'delayed': 'bg-red-500'
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with time axis */}
      <div className="flex border-b bg-muted/50">
        <div className="w-48 p-3 border-r font-semibold bg-muted">
          Resources
        </div>
        <div className="flex-1 relative p-3 min-h-[40px]">
          {timeMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute text-xs text-muted-foreground"
              style={{
                left: `${marker.position}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div>{marker.date.toLocaleDateString()}</div>
              <div className="text-[10px]">
                {marker.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body with resources and operations */}
      <div className="flex-1 overflow-auto">
        {Array.from(operationsByResource.entries()).map(([resource, resourceOps]) => (
          <div key={resource.id} className="flex border-b hover:bg-muted/10">
            {/* Resource info */}
            <div className="w-48 p-3 border-r bg-muted/30">
              <div className="font-medium">{resource.name}</div>
              <div className="text-xs text-muted-foreground">
                {resource.type} • {resourceOps.length} ops
              </div>
            </div>
            
            {/* Timeline with operations */}
            <div className="flex-1 relative" style={{ minHeight: '60px' }}>
              {resourceOps.map((op) => {
                const opStart = new Date(op.startTime);
                const opEnd = new Date(op.endTime);
                const startPercent = ((opStart.getTime() - minDate.getTime()) / totalDuration) * 100;
                const widthPercent = ((opEnd.getTime() - opStart.getTime()) / totalDuration) * 100;
                
                return (
                  <div
                    key={op.id}
                    className={`absolute top-2 h-11 ${statusColors[op.status] || 'bg-gray-500'} 
                               rounded text-white text-xs p-1 cursor-pointer
                               hover:scale-105 hover:z-10 transition-transform
                               shadow-sm hover:shadow-md`}
                    style={{
                      left: `${Math.max(0, startPercent)}%`,
                      width: `${Math.max(1, widthPercent)}%`
                    }}
                    title={`${op.operationName}
Status: ${op.status}
Start: ${opStart.toLocaleString()}
End: ${opEnd.toLocaleString()}`}
                  >
                    <div className="font-semibold truncate">{op.operationName}</div>
                    <div className="text-[10px] opacity-90">
                      {opStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with stats */}
      <div className="border-t p-2 text-xs text-muted-foreground bg-muted/30">
        <span className="mr-4">Operations: {operations.length}</span>
        <span className="mr-4">Resources: {resources.length}</span>
        <span>Period: {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}</span>
      </div>
    </div>
  );
}