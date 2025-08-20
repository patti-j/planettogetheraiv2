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
  resourceId: number;
  resourceName: string;
  startDate: string;
  endDate: string;
  duration: number;
  percentDone: number;
}

export default function ResourceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [hoveredOperation, setHoveredOperation] = useState<Operation | null>(null);

  // Fetch resources from PT tables
  const { data: resources = [], isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ['/api/pt-resources-clean']
  });

  // Debug logging
  useEffect(() => {
    console.log('Resources loaded:', resources);
    console.log('Resources count:', resources.length);
  }, [resources]);

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
  const hourWidth = 3; // pixels per hour
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
    const width = (op.duration / 60) * hourWidth; // duration is in minutes
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
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex">
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
            <div className="flex-1 overflow-x-auto">
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
                    
                    return resourceOps.map(op => {
                      const { left, width } = getOperationPosition(op);
                      const isHovered = hoveredOperation?.id === op.id;
                      const isSelected = selectedOperation?.id === op.id;
                      
                      return (
                        <div
                          key={op.id}
                          className={`absolute h-[34px] rounded cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-blue-600 shadow-lg z-20' 
                              : isHovered 
                                ? 'bg-blue-500 shadow-md z-10' 
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
                          title={`${op.name}\n${op.startDate ? format(new Date(op.startDate), 'MMM d HH:mm') : 'N/A'} - ${op.endDate ? format(new Date(op.endDate), 'MMM d HH:mm') : 'N/A'}`}
                        >
                          <div className="px-2 py-1 text-white text-xs truncate">
                            {op.name.split(':')[1]?.trim() || op.name}
                          </div>
                          {op.percentDone > 0 && (
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

      {/* Selected operation details */}
      {selectedOperation && (
        <div className="bg-white border-t px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{selectedOperation.name}</h3>
              <p className="text-sm text-gray-600">
                Resource: {selectedOperation.resourceName} | 
                Duration: {selectedOperation.duration} minutes | 
                Progress: {selectedOperation.percentDone}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(selectedOperation.startDate), 'MMM d, yyyy HH:mm')} - 
                {format(new Date(selectedOperation.endDate), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
            <button
              onClick={() => setSelectedOperation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}