import { type Operation, type Job } from "@shared/schema";
import { useDrag } from "react-dnd";
import { useEffect, useState } from "react";

interface OperationBlockProps {
  operation: Operation;
  resourceName: string;
  jobName?: string;
  job?: Job;
  timelineWidth: number;
  dayWidth: number;
  timeUnit: "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";
  timelineScrollLeft: number;
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
  timelineScrollLeft,
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

  const [position, setPosition] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (operation.startTime && operation.endTime) {
      const startTime = new Date(operation.startTime);
      const endTime = new Date(operation.endTime);
      
      // SIMPLIFIED: Calculate position based on timeline periods (matching timeScale generation)
      const baseDate = new Date(timelineBaseDate.getTime());
      
      // Calculate how many periods from base date to operation start
      const timeDiff = startTime.getTime() - baseDate.getTime();
      
      // Calculate step size for this time unit
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
      const startOffset = (startTime.getTime() - baseDate.getTime()) / stepMs;
      const duration = (endTime.getTime() - startTime.getTime()) / stepMs;
      
      const left = startOffset * dayWidth;
      const width = Math.max(duration * dayWidth, 20);
      
      // DEBUG: Log the operation block positioning values
      console.log("OPERATION BLOCK DEBUG:", {
        operationName: operation.name,
        startTime: startTime.toISOString(),
        baseDate: baseDate.toISOString(),
        stepMs,
        startOffset,
        duration,
        dayWidth,
        left,
        width,
        timeUnit
      });
      
      setPosition({ left, width });
    }
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