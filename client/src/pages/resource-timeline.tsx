import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInHours, addDays, startOfDay } from 'date-fns';

interface Resource {
  id: number;
  external_id: string;
  name: string;
  type: string;
  description?: string;
  plant_id?: string;
  plant_name?: string;
}

interface Operation {
  id: number;
  name: string;
  resourceId: string; // This is the external_id of the resource
  resourceName: string;
  startDate: string;
  endDate: string;
  duration: number;
  percentDone: number;
}

export default function ResourceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [hoveredOperation, setHoveredOperation] = useState<Operation | null>(null);

  // Fetch resources from PT tables
  const { data: resources = [], isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ['/api/pt-resources-clean']
  });

  // Fetch operations
  const { data: operations = [], isLoading: loadingOperations } = useQuery<Operation[]>({
    queryKey: ['/api/pt-operations'],
    select: (data: any[]) => {
      const ops = data
        .filter(op => {
          // Check for valid dates using correct field names
          const hasValidDates = (op.startTime || op.start_time) && (op.endTime || op.end_time);
          if (!hasValidDates) {
            console.log('Skipping operation with invalid dates:', op.name);
          }
          return hasValidDates;
        })
        .map(op => ({
          id: op.id,
          name: op.name,
          resourceId: op.assignedResourceId || op.resourceId || op.resource_id,
          resourceName: op.assignedResourceName || op.resourceName || op.resource_name,
          startDate: op.startTime || op.start_time || op.startDate,
          endDate: op.endTime || op.end_time || op.endDate,
          duration: op.duration,
          percentDone: op.completionPercentage || op.percentFinished || op.percent_done || op.percentDone || 0
        }));
      console.log('Operations mapped:', ops.length, 'operations');
      console.log('Sample operation:', ops[0]);
      return ops;
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('Resources loaded:', resources);
    console.log('Resources count:', resources.length);
  }, [resources]);

  // Auto-scroll to show first operations (6 AM)
  useEffect(() => {
    if (timelineScrollRef.current && operations.length > 0) {
      // Scroll to 6 AM (6 hours from start)
      const scrollPosition = 6 * 50; // 6 hours * 50px per hour
      timelineScrollRef.current.scrollLeft = scrollPosition;
    }
  }, [operations]);

  if (loadingResources || loadingOperations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading scheduling data...</div>
      </div>
    );
  }

  // Timeline configuration
  const startDate = new Date('2025-08-19');
  const endDate = new Date('2025-08-31');
  const totalDays = differenceInHours(endDate, startDate) / 24;
  const hourWidth = 50; // pixels per hour - increased for better visibility
  const totalWidth = totalDays * 24 * hourWidth;
  const rowHeight = 50;
  const headerHeight = 60;

  // Group operations by resource
  const operationsByResource = new Map<string, Operation[]>();
  operations.forEach(op => {
    // Use the resourceId (which is the external_id string) as the key
    const resourceKey = String(op.resourceId);
    if (resourceKey && resourceKey !== 'null') {
      if (!operationsByResource.has(resourceKey)) {
        operationsByResource.set(resourceKey, []);
      }
      operationsByResource.get(resourceKey)!.push(op);
    }
  });
  
  // Debug logging
  console.log('Operations by resource Map size:', operationsByResource.size);
  console.log('Operations by resource keys:', Array.from(operationsByResource.keys()));
  console.log('Resource external_ids:', resources.map(r => r.external_id));
  console.log('Sample mapping:', operationsByResource.get('RES-PLANT-AMS-01-001'));

  // Calculate position for an operation
  const getOperationPosition = (op: Operation) => {
    const opStart = new Date(op.startDate);
    const hoursFromStart = differenceInHours(opStart, startDate);
    const left = hoursFromStart * hourWidth;
    // Duration is already in minutes, convert to hours for pixel calculation
    const durationInHours = op.duration / 60;
    const width = Math.max(durationInHours * hourWidth, 20); // Minimum width of 20px for visibility
    return { left, width };
  };

  // Generate time headers
  const timeHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    timeHeaders.push({
      date,
      label: format(date, 'MMM d'),
      position: i * 24 * hourWidth
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Resource Timeline</h1>
        <p className="text-sm text-gray-600 mt-1">
          {resources.length} Resources | {operations.length} Operations
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Resource column */}
            <div className="flex-shrink-0 w-48 border-r">
              {/* Header */}
              <div className="h-[60px] border-b bg-gray-50 px-4 flex items-center font-semibold">
                Resources
              </div>
              {/* Resource rows */}
              {resources.map((resource, index) => (
                <div
                  key={resource.id}
                  className={`h-[50px] border-b px-4 flex items-center ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-sm">{resource.name}</div>
                    <div className="text-xs text-gray-500">{resource.type}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div ref={timelineScrollRef} className="flex-1 overflow-auto">
              <div className="relative" style={{ width: `${totalWidth}px` }}>
                {/* Time header */}
                <div className="h-[60px] border-b bg-gray-50 sticky top-0 z-30">
                  {timeHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="absolute top-0 h-full border-l border-gray-300"
                      style={{ left: `${header.position}px` }}
                    >
                      <div className="px-2 py-1 text-xs font-medium">
                        {header.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resource rows container */}
                <div className="relative">
                  {/* Resource backgrounds and grid lines */}
                  {resources.map((resource, resourceIndex) => (
                    <div
                      key={resource.id}
                      className={`h-[50px] border-b relative ${
                        resourceIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* Grid lines */}
                      {timeHeaders.map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-full border-l border-gray-200"
                          style={{ left: `${i * 24 * hourWidth}px` }}
                        />
                      ))}
                    </div>
                  ))}
                  
                  {/* Operations overlay - positioned absolutely */}
                  {resources.map((resource, resourceIndex) => {
                    const resourceOps = operationsByResource.get(resource.external_id) || [];
                    const rowTop = resourceIndex * 50; // Each row is 50px tall
                    
                    // Debug log for first resource
                    if (resourceIndex === 0) {
                      console.log(`Resource ${resource.name} (${resource.external_id}): ${resourceOps.length} operations`);
                    }
                    
                    return resourceOps.map(op => {
                      const { left, width } = getOperationPosition(op);
                      const isHovered = hoveredOperation?.id === op.id;
                      const isSelected = selectedOperation?.id === op.id;
                      
                      // Debug first operation of first resource
                      if (resourceIndex === 0 && resourceOps.indexOf(op) === 0) {
                        console.log(`Rendering operation ${op.name} at position: top=${rowTop + 8}px, left=${left}px, width=${width}px`);
                      }
                      
                      return (
                        <div
                          key={op.id}
                          className={`absolute h-[34px] rounded cursor-move transition-all ${
                            isSelected 
                              ? 'bg-blue-600 shadow-lg z-20 ring-2 ring-blue-300' 
                              : isHovered 
                                ? 'bg-blue-500 shadow-md z-10' 
                                : op.percentDone === 100
                                  ? 'bg-green-500 shadow-sm'
                                  : 'bg-blue-400 shadow-sm'
                          }`}
                          style={{
                            top: `${rowTop + 8}px`, // Position within the correct row
                            left: `${left}px`,
                            width: `${width}px`,
                            minWidth: '40px'
                          }}
                          onMouseEnter={() => setHoveredOperation(op)}
                          onMouseLeave={() => setHoveredOperation(null)}
                          onClick={() => setSelectedOperation(op)}
                          title={`${op.name}\nResource: ${op.resourceName}\nStart: ${op.startDate ? format(new Date(op.startDate), 'MMM d, h:mm a') : 'N/A'}\nEnd: ${op.endDate ? format(new Date(op.endDate), 'MMM d, h:mm a') : 'N/A'}\nDuration: ${op.duration} minutes\nProgress: ${op.percentDone}%`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('operation', JSON.stringify(op));
                            (e.target as HTMLElement).style.opacity = '0.5';
                          }}
                          onDragEnd={(e) => {
                            (e.target as HTMLElement).style.opacity = '';
                          }}
                        >
                          <div className="px-2 py-1 text-white text-xs truncate flex items-center justify-between">
                            <span>{op.name.split(':')[1]?.trim() || op.name}</span>
                            {op.percentDone === 100 && (
                              <span className="ml-1">✓</span>
                            )}
                          </div>
                          {op.percentDone > 0 && op.percentDone < 100 && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-b"
                              style={{ width: `${op.percentDone}%` }}
                            />
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected operation details panel */}
      {selectedOperation && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 max-w-md z-40">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">{selectedOperation.name}</h3>
            <button
              onClick={() => setSelectedOperation(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Resource:</span>
              <p className="font-medium">{selectedOperation.resourceName}</p>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-medium">{selectedOperation.duration} minutes</p>
            </div>
            <div>
              <span className="text-gray-600">Start:</span>
              <p>{format(new Date(selectedOperation.startDate), 'MMM d, h:mm a')}</p>
            </div>
            <div>
              <span className="text-gray-600">End:</span>
              <p>{format(new Date(selectedOperation.endDate), 'MMM d, h:mm a')}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Progress:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${selectedOperation.percentDone === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${selectedOperation.percentDone}%` }}
                  />
                </div>
                <span className="font-medium">{selectedOperation.percentDone}%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t flex gap-2">
            <button className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              Edit Details
            </button>
            <button className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
              View Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}