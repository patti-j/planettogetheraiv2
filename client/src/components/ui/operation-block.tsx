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
}: OperationBlockProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: () => {
      console.log("Starting drag for operation:", operation.name);
      return { operation };
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
      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);
      
      // Calculate position based on time unit
      let left = 0;
      let width = 0;
      
      switch (timeUnit) {
        case "hour":
          const startOffsetHours = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60);
          const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          left = (startOffsetHours / 24) * dayWidth;
          width = Math.max((durationHours / 24) * dayWidth, 20);
          break;
        case "shift":
          const startOffsetShifts = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 8);
          const durationShifts = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 8);
          left = startOffsetShifts * dayWidth;
          width = Math.max(durationShifts * dayWidth, 20);
          break;
        case "day":
          const startOffsetDays = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
          const durationDays = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
          left = startOffsetDays * dayWidth;
          width = Math.max(durationDays * dayWidth, 20);
          break;
        case "week":
          const startOffsetWeeks = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
          const durationWeeks = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24 * 7);
          left = startOffsetWeeks * dayWidth;
          width = Math.max(durationWeeks * dayWidth, 20);
          break;
        case "month":
          const startOffsetMonths = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          const durationMonths = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24 * 30);
          left = startOffsetMonths * dayWidth;
          width = Math.max(durationMonths * dayWidth, 20);
          break;
        case "quarter":
          const startOffsetQuarters = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 90);
          const durationQuarters = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24 * 90);
          left = startOffsetQuarters * dayWidth;
          width = Math.max(durationQuarters * dayWidth, 20);
          break;
        case "year":
          const startOffsetYears = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          const durationYears = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24 * 365);
          left = startOffsetYears * dayWidth;
          width = Math.max(durationYears * dayWidth, 20);
          break;
        case "decade":
          const startOffsetDecades = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 365 * 10);
          const durationDecades = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24 * 365 * 10);
          left = startOffsetDecades * dayWidth;
          width = Math.max(durationDecades * dayWidth, 20);
          break;
        default:
          // Default to day calculation
          const defaultOffsetDays = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
          const defaultDurationDays = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
          left = defaultOffsetDays * dayWidth;
          width = Math.max(defaultDurationDays * dayWidth, 20);
          break;
      }
      
      setPosition({ left, width });
    }
  }, [operation.startTime, operation.endTime, dayWidth, timeUnit]);


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