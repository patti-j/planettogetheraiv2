import { type Operation, type Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useDrag } from "react-dnd";
import { useEffect, useState } from "react";

interface OperationBlockProps {
  operation: Operation;
  resourceName: string;
  jobName?: string;
  job?: Job;
  timelineWidth: number;
  dayWidth: number;
}

export default function OperationBlock({
  operation,
  resourceName,
  jobName,
  job,
  timelineWidth,
  dayWidth,
}: OperationBlockProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: { operation },
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
      
      const startOffsetHours = (startTime.getTime() - baseDate.getTime()) / (1000 * 60 * 60);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      const left = (startOffsetHours / 24) * dayWidth;
      const width = Math.max((duration / 24) * dayWidth, 20);
      
      setPosition({ left, width });
    }
  }, [operation.startTime, operation.endTime, dayWidth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "on_hold":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

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

  if (!operation.startTime || !operation.endTime) {
    return null;
  }

  return (
    <div
      ref={drag}
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
          <Badge
            variant="outline"
            className={`text-xs border-white/30 text-white/90 ${getStatusColor(operation.status)}`}
          >
            {operation.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}