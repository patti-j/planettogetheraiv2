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
  colorScheme?: string;
  textLabeling?: string;
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
  colorScheme = "by_job",
  textLabeling = "operation_name",
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
    
    // Calculate width based on the operation's actual duration relative to the time unit
    // Convert operation duration to hours and calculate what fraction of the time unit it represents
    const operationDurationHours = operationDurationMs / (60 * 60 * 1000);
    const timeUnitHours = stepMs / (60 * 60 * 1000);
    
    // The width should be proportional to how much of the time unit the operation takes
    // For example: 6 hours in a month (720 hours) = 6/720 = 0.0083 of the month width
    const durationRatio = operationDurationHours / timeUnitHours;
    
    // Operation width scales proportionally with zoom level - zoomed out = smaller blocks
    
    // Calculate width based on timeline width and the operation duration ratio
    const left = startOffset * dayWidth;
    
    // Adaptive minimum width based on zoom level - tighter constraints for zoomed out views
    const minWidth = timeUnit === "month" ? 2 : timeUnit === "week" ? 4 : timeUnit === "day" ? 8 : 12;
    const width = Math.max(durationRatio * dayWidth, minWidth);
    
    return { left, width };
  }, [operation.startTime, operation.endTime, dayWidth, timeUnit, timelineBaseDate]);


  const getBlockColor = () => {
    switch (colorScheme) {
      case "by_job":
        const jobColors = [
          "bg-blue-500",
          "bg-green-500",
          "bg-purple-500",
          "bg-orange-500",
          "bg-pink-500",
          "bg-indigo-500",
          "bg-teal-500",
          "bg-red-500",
        ];
        return jobColors[operation.jobId % jobColors.length];
      
      case "by_priority":
        switch (job?.priority) {
          case "high": return "bg-red-500";
          case "medium": return "bg-yellow-500";
          case "low": return "bg-green-500";
          default: return "bg-gray-500";
        }
      
      case "by_status":
        switch (operation.status) {
          case "completed": return "bg-green-500";
          case "in_progress": return "bg-blue-500";
          case "planned": return "bg-gray-500";
          default: return "bg-gray-500";
        }
      
      case "by_operation_type":
        // Generate color based on operation name hash
        const hash = operation.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const typeColors = [
          "bg-cyan-500",
          "bg-emerald-500",
          "bg-violet-500",
          "bg-amber-500",
          "bg-rose-500",
          "bg-sky-500",
          "bg-lime-500",
          "bg-fuchsia-500",
        ];
        return typeColors[hash % typeColors.length];
      
      case "by_resource":
        const resourceColors = [
          "bg-slate-500",
          "bg-zinc-500",
          "bg-neutral-500",
          "bg-stone-500",
          "bg-red-500",
          "bg-orange-500",
          "bg-amber-500",
          "bg-yellow-500",
        ];
        return resourceColors[(operation.assignedResourceId || 0) % resourceColors.length];
      
      default:
        return "bg-blue-500";
    }
  };

  const getBlockText = () => {
    switch (textLabeling) {
      case "operation_name":
        return operation.name;
      
      case "job_name":
        return jobName || `Job ${operation.jobId}`;
      
      case "both":
        return `${jobName || `Job ${operation.jobId}`} - ${operation.name}`;
      
      case "duration":
        return `${operation.duration}h`;
      
      case "progress":
        // For now, we'll show status as progress
        return operation.status === "completed" ? "100%" : 
               operation.status === "in_progress" ? "50%" : "0%";
      
      case "none":
        return "";
      
      default:
        return operation.name;
    }
  };

  // If this is an unscheduled operation, render it as a draggable block without position
  if (!operation.startTime || !operation.endTime) {
    return (
      <div
        ref={drag}
        data-operation-block
        className={`inline-block mr-2 mb-2 rounded-md border-2 border-white shadow-sm cursor-move transition-all duration-200 ${
          isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
        } ${getBlockColor()}`}
        style={{
          height: "40px",
          minWidth: "120px",
          padding: "0 8px",
        }}
      >
        <div className="h-full flex items-center justify-between text-white text-xs">
          <div className="flex-1 truncate">
            <div className="font-medium truncate">{getBlockText()}</div>
            {textLabeling !== "none" && textLabeling !== "both" && (
              <div className="text-white/70 truncate">{operation.duration}h</div>
            )}
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
      } ${getBlockColor()}`}
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: "40px",
        minWidth: "80px",
      }}
    >
      <div className="h-full flex items-center justify-between px-2 text-white text-xs">
        <div className="flex-1 truncate">
          <div className="font-medium truncate">{getBlockText()}</div>
          {textLabeling !== "none" && textLabeling !== "both" && textLabeling !== "duration" && (
            <div className="text-white/70 truncate">{operation.duration}h</div>
          )}
        </div>
      </div>
    </div>
  );
}