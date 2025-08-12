import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface Operation {
  id: number;
  name: string;
  assignedResourceId: number;
  startTime: Date;
  endTime: Date;
  status: string;
  productionOrderId?: number;
}

interface SimpleGanttProps {
  resources?: Resource[];
  operations?: Operation[];
  onOperationMove?: (operationId: number, resourceId: number, startTime: Date, endTime: Date) => void;
}

export function SimpleGantt({ resources = [], operations = [], onOperationMove }: SimpleGanttProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7);
  
  // Calculate date range
  const startDate = new Date(currentDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + viewDays);
  
  // Generate hours for the timeline
  const hours = [];
  for (let d = new Date(startDate); d < endDate; d.setHours(d.getHours() + 1)) {
    hours.push(new Date(d));
  }
  
  // Group operations by resource
  const operationsByResource = operations.reduce((acc, op) => {
    if (!acc[op.assignedResourceId]) {
      acc[op.assignedResourceId] = [];
    }
    acc[op.assignedResourceId].push(op);
    return acc;
  }, {} as Record<number, Operation[]>);
  
  // Calculate position and width for an operation
  const getOperationStyle = (op: Operation) => {
    const opStart = new Date(op.startTime);
    const opEnd = new Date(op.endTime);
    
    // Calculate left position as percentage
    const totalHours = viewDays * 24;
    const hoursFromStart = (opStart.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const left = (hoursFromStart / totalHours) * 100;
    
    // Calculate width as percentage
    const duration = (opEnd.getTime() - opStart.getTime()) / (1000 * 60 * 60);
    const width = (duration / totalHours) * 100;
    
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`
    };
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-gray-400';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };
  
  return (
    <Card className="w-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Production Schedule</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - viewDays);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + viewDays);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex h-[500px] overflow-auto">
        {/* Resources column */}
        <div className="w-48 flex-shrink-0 border-r bg-gray-50">
          <div className="h-10 border-b px-2 flex items-center font-semibold text-sm">
            Resources
          </div>
          {resources.map(resource => (
            <div key={resource.id} className="h-16 border-b px-2 flex items-center">
              <div>
                <div className="font-medium text-sm">{resource.name}</div>
                <Badge variant="outline" className="text-xs">
                  {resource.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {/* Timeline */}
        <div className="flex-1 relative">
          {/* Timeline header */}
          <div className="h-10 border-b flex sticky top-0 bg-white z-10">
            {Array.from({ length: viewDays }).map((_, dayIndex) => {
              const date = new Date(startDate);
              date.setDate(date.getDate() + dayIndex);
              return (
                <div key={dayIndex} className="flex-1 border-r px-1 text-xs text-center">
                  <div className="font-semibold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-gray-500">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              );
            })}
          </div>
          
          {/* Resource rows with operations */}
          {resources.map(resource => (
            <div key={resource.id} className="h-16 border-b relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: viewDays }).map((_, i) => (
                  <div key={i} className="flex-1 border-r opacity-20" />
                ))}
              </div>
              
              {/* Operations for this resource */}
              {operationsByResource[resource.id]?.map(op => {
                const style = getOperationStyle(op);
                return (
                  <div
                    key={op.id}
                    className={`absolute top-2 h-12 rounded cursor-pointer hover:opacity-90 ${getStatusColor(op.status)} text-white px-1 flex items-center`}
                    style={style}
                    title={`${op.name}\n${new Date(op.startTime).toLocaleString()} - ${new Date(op.endTime).toLocaleString()}`}
                  >
                    <span className="text-xs truncate">{op.name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Delayed</span>
        </div>
      </div>
    </Card>
  );
}