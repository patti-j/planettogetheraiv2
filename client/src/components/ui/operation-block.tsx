import { useDrag } from "react-dnd";
import { Badge } from "@/components/ui/badge";
import type { Operation, Job } from "@shared/schema";

interface OperationBlockProps {
  operation: Operation;
  resourceName: string;
  jobName?: string;
  job?: Job;
}

export default function OperationBlock({ operation, resourceName, jobName, job }: OperationBlockProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "operation",
    item: { operation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getOperationColor = () => {
    if (!job) return "bg-gray-400";
    
    const today = new Date();
    const dueDate = new Date(job.dueDate);
    const operationEndTime = operation.endTime ? new Date(operation.endTime) : null;
    
    if (operationEndTime) {
      // Check if operation is completed on time
      if (operationEndTime <= dueDate) {
        // Check if it's more than a week early
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        if (dueDate.getTime() - operationEndTime.getTime() > weekInMs) {
          return "bg-yellow-500"; // More than a week early
        }
        return "bg-green-500"; // On time
      } else {
        return "bg-red-500"; // Late
      }
    }
    
    // For operations without end time, check if we're past due date
    if (today > dueDate) {
      return "bg-red-500"; // Late
    }
    
    return "bg-blue-500"; // Default for active operations
  };

  // Calculate position and width based on operation timing
  const getOperationStyle = () => {
    const baseLeft = 10; // Starting position with some padding
    const baseWidth = 144; // Base width
    
    // Calculate based on operation duration
    const durationInHours = operation.duration || 8;
    const width = Math.max(baseWidth, durationInHours * 18); // 18px per hour
    
    // Position operations based on their start time or order
    const timelineWidth = 1200; // Total timeline width (matches Gantt chart)
    const dayWidth = timelineWidth / 7; // Each day slot width (dynamic based on timeline)
    
    let startDay = 0;
    if (operation.startTime) {
      // Use actual start time if available
      const startTime = new Date(operation.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startTime.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      startDay = Math.max(0, Math.min(6, daysDiff)); // Clamp to 0-6 days
      
      // Also calculate time within the day for more precise positioning
      const workingHours = 8; // 8 AM to 4 PM
      const hoursInDay = startTime.getHours() - 8; // Assuming 8 AM start
      const minutesInDay = startTime.getMinutes();
      const totalMinutesInDay = Math.max(0, hoursInDay * 60 + minutesInDay);
      const timeOffset = (totalMinutesInDay / (workingHours * 60)) * dayWidth; // More precise time positioning
      
      console.log('Operation positioning:', {
        operationId: operation.id,
        startTime: operation.startTime,
        daysDiff,
        startDay,
        hoursInDay,
        timeOffset,
        finalLeft: baseLeft + startDay * dayWidth + timeOffset
      });
      
      return {
        left: `${baseLeft + startDay * dayWidth + timeOffset}px`,
        width: `${width}px`,
        top: "4px",
      };
    } else {
      // Fallback to order-based positioning
      startDay = (operation.order || 0) % 7; // Distribute across 7 days
    }
    
    return {
      left: `${baseLeft + startDay * dayWidth}px`,
      width: `${width}px`,
      top: "4px",
    };
  };

  const formatDueDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      ref={drag}
      className={`absolute text-white rounded px-3 py-1 shadow-sm cursor-move hover:shadow-md transition-shadow ${
        getOperationColor()
      } ${isDragging ? "opacity-50" : ""}`}
      style={getOperationStyle()}
    >
      <div className="text-xs font-medium">{jobName || "Unknown Job"}</div>
      <div className="text-xs opacity-90">{operation.name}</div>
      <div className="text-xs opacity-80">
        Due: {job ? formatDueDate(job.dueDate) : "Unknown"}
      </div>
    </div>
  );
}
