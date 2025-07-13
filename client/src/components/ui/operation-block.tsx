import { useDrag } from "react-dnd";
import { Badge } from "@/components/ui/badge";
import type { Operation } from "@shared/schema";

interface OperationBlockProps {
  operation: Operation;
  resourceName: string;
}

export default function OperationBlock({ operation, resourceName }: OperationBlockProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "operation",
    item: { operation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getOperationColor = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning";
      case "completed": return "bg-accent";
      case "planned": return "bg-primary";
      default: return "bg-gray-400";
    }
  };

  // Calculate position and width based on operation timing
  const getOperationStyle = () => {
    const baseLeft = 10; // Starting position with some padding
    const baseWidth = 144; // Base width
    
    // Calculate based on operation duration
    const durationInDays = Math.ceil((operation.duration || 8) / 24);
    const width = Math.max(baseWidth, durationInDays * 48);
    
    // Position operations based on their order within the timeline
    // Each day slot is ~172px wide (from the time scale)
    const dayWidth = 172;
    const startDay = (operation.order || 0) % 7; // Distribute across 7 days
    
    return {
      left: `${baseLeft + startDay * dayWidth}px`,
      width: `${width}px`,
      top: "4px",
    };
  };

  return (
    <div
      ref={drag}
      className={`absolute text-white rounded px-3 py-1 shadow-sm cursor-move hover:shadow-md transition-shadow ${
        getOperationColor(operation.status)
      } ${isDragging ? "opacity-50" : ""}`}
      style={getOperationStyle()}
    >
      <div className="text-xs font-medium">{operation.name}</div>
      <div className="text-xs opacity-80">
        {operation.duration}h • {resourceName}
      </div>
    </div>
  );
}
