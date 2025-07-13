import { type Operation, type Job } from "@shared/schema";
import { useDrag } from "react-dnd";
import { useEffect, useState, useMemo } from "react";

interface OperationBlockProps {
  operation: Operation;
  resourceName: string;
  jobName?: string;
  job?: Job;
  timelineWidth: number;
  dayWidth: number;
  timeUnit: "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";
  timelineBaseDate: Date;
}

export default function OperationBlock({
  operation,
  resourceName,
  jobName,
  job,
  timelineWidth,
  dayWidth,
  timeUnit,
  timelineBaseDate,
}: OperationBlockProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: (monitor) => {
      console.log("Starting drag for operation:", operation.name);
      // Store the initial mouse position relative to the element
      const initialOffset = monitor.getInitialClientOffset();
      const elementRect = monitor.getInitialSourceClientOffset();
      
      const cursorOffsetX = initialOffset && elementRect ? initialOffset.x - elementRect.x : 0;
      
      return { 
        operation,
        cursorOffsetX // How far from the left edge of the block the cursor is
      };
    },
    end: (item, monitor) => {
      console.log("Ending drag for operation:", operation.name, "dropped:", monitor.didDrop());
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Use useMemo to prevent unnecessary recalculations and visual jumps
  const position = useMemo(() => {
    if (!operation.startTime || !operation.endTime) {
      return { left: 0, width: 0 };
    }

    const startTime = new Date(operation.startTime);
    const endTime = new Date(operation.endTime);
    
    // Calculate step size for this time unit (in milliseconds)
    let stepMs: number;
    switch (timeUnit) {
      case "hour":
        stepMs = 60 * 60 * 1000;
        break;
      case "shift":
        stepMs = 8 * 60 * 60 * 1000;
        break;
      case "day":
        stepMs = 24 * 60 * 60 * 1000;
        break;
      case "week":
        stepMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        stepMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "quarter":
        stepMs = 90 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        stepMs = 365 * 24 * 60 * 60 * 1000;
        break;
      case "decade":
        stepMs = 3650 * 24 * 60 * 60 * 1000;
        break;
      default:
        stepMs = 24 * 60 * 60 * 1000;
    }
    
    // Calculate position relative to the timeline base
    const baseDate = new Date(timelineBaseDate.getTime());
    const startOffset = (startTime.getTime() - baseDate.getTime()) / stepMs;
    const operationDurationMs = endTime.getTime() - startTime.getTime();
    const durationInTimeUnits = operationDurationMs / stepMs;
    
    // Calculate width based on timeline width and the operation duration
    // Use dayWidth as the base unit (which represents the width of one time unit)
    const left = startOffset * dayWidth;
    const width = Math.max(durationInTimeUnits * dayWidth, 20); // Minimum width for visibility
    
    return { left, width };
  }, [operation.startTime, operation.endTime, dayWidth, timeUnit, timelineBaseDate]);


  const getJobColor = (jobId: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
    ];
    return colors[jobId % colors.length];
  };

  // If this is an unscheduled operation, render it as a draggable block without position
  if (!operation.startTime || !operation.endTime) {
    return (
      <div
        ref={drag}
        data-operation-block
        className={`inline-block mr-2 mb-2 rounded-md border-2 border-gray-300 shadow-sm cursor-move transition-all duration-200 ${
          isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
        } bg-gray-100 hover:bg-gray-200`}
        style={{
          height: "40px",
          minWidth: "120px",
          padding: "0 8px",
        }}
      >
        <div className="h-full flex items-center justify-between text-gray-700 text-xs">
          <div className="flex-1 truncate">
            <div className="font-medium truncate">{operation.name}</div>
            <div className="text-gray-500 truncate">{jobName || `Job ${operation.jobId}`}</div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <div className="text-xs text-gray-500">
              {operation.duration}h
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={drag}
      data-operation-block
      className={`absolute top-2 z-10 rounded-md border-2 border-white shadow-md cursor-move transition-all duration-200 ${
        isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
      } ${getJobColor(operation.jobId)}`}
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: "40px",
        minWidth: "80px",
      }}
    >
      <div className="h-full flex items-center justify-between px-2 text-white text-xs">
        <div className="flex-1 truncate">
          <div className="font-medium truncate">{operation.name}</div>
          <div className="text-white/80 truncate">{jobName || `Job ${operation.jobId}`}</div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <div className="text-xs text-white/70">
            {operation.duration}h
          </div>
        </div>
      </div>
    </div>
  );
}