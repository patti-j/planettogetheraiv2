import { type DiscreteOperation, type ProductionOrder } from "@shared/schema";
import { useDrag } from "react-dnd";
import { useEffect, useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";


interface OperationBlockProps {
  operation: DiscreteOperation;
  resourceName: string;
  jobName?: string;
  job?: ProductionOrder;
  timelineWidth: number;
  dayWidth: number;
  timeUnit: "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";
  timelineBaseDate: Date;
  colorScheme?: string;
  textLabeling?: string;
  customTextLabels?: any[];
  rowHeight?: number;
  onHoverStart?: (jobId: number) => void;
  onHoverEnd?: () => void;
  onViewDetails?: (operation: DiscreteOperation) => void;
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
  customTextLabels = [],
  rowHeight = 60,
  onHoverStart,
  onHoverEnd,
  onViewDetails,
}: OperationBlockProps) {
  
  // Calculate operation block height with comfortable margins
  // Leave 8px margin at top and bottom (16px total)
  const blockHeight = Math.max(24, rowHeight - 16);
  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: (monitor) => {
      console.log("🚀 Starting drag for operation:", operation.operationName, "with type: operation");
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
      console.log("🏁 Ending drag for operation:", operation.operationName, "dropped:", monitor.didDrop(), "dropResult:", monitor.getDropResult());
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
    
    // Calculate width based on the operation's actual duration
    // For day/shift views, we want accurate proportional widths
    const operationDurationHours = operationDurationMs / (60 * 60 * 1000);
    
    // For "day" time unit, dayWidth is the width of one full day (24 hours)
    // We need to calculate the width based on the actual operation duration
    let width: number;
    
    if (timeUnit === "day" || timeUnit === "shift") {
      // For day view, calculate width as a proportion of the day
      // dayWidth = width of one full day period
      const hoursInPeriod = timeUnit === "day" ? 24 : 8;
      const widthPerHour = dayWidth / hoursInPeriod;
      width = operationDurationHours * widthPerHour;
      
      console.log(`Operation ${operation.operationName}: duration=${operationDurationHours}h, widthPerHour=${widthPerHour}, width=${width}, dayWidth=${dayWidth}`);
    } else {
      // For other time units, use the existing calculation
      let pixelsPerHour: number;
      switch (timeUnit) {
        case "hour":
          pixelsPerHour = dayWidth;
          break;
        case "week":
          pixelsPerHour = dayWidth / (7 * 24);
          break;
        case "month":
          pixelsPerHour = dayWidth / (30 * 24);
          break;
        default:
          pixelsPerHour = dayWidth / 24;
      }
      width = operationDurationHours * pixelsPerHour;
    }
    
    // Ensure minimum width for visibility
    const minWidth = 40; // Minimum width to show text
    width = Math.max(width, minWidth);
    
    // Calculate left position
    const left = startOffset * dayWidth;
    
    return { left, width };
  }, [operation.startTime, operation.endTime, dayWidth, timeUnit, timelineBaseDate]);


  const getBlockColor = () => {
    switch (colorScheme) {
      case "job":
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
        return jobColors[(operation.productionOrderId || 0) % jobColors.length];
      
      case "priority":
      case "by_priority":
        switch (job?.priority) {
          case "high": return "bg-red-500";
          case "medium": return "bg-yellow-500";
          case "low": return "bg-green-500";
          default: return "bg-gray-500";
        }
      
      case "status":
      case "by_status":
        switch (operation.status) {
          case "completed": return "bg-green-500";
          case "In-Progress": return "bg-blue-500";
          case "planned": return "bg-gray-500";
          default: return "bg-gray-500";
        }
      
      case "by_operation_type":
        // Generate color based on operation name hash
        const hash = (operation.operationName || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
      
      case "resource":
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
        return resourceColors[(operation.workCenterId || 0) % resourceColors.length];
      
      case "duration":
      case "by_duration":
        // Color based on duration ranges
        const duration = operation.standardDuration || 0;
        if (duration <= 2) return "bg-green-500";
        if (duration <= 4) return "bg-yellow-500";
        if (duration <= 8) return "bg-orange-500";
        return "bg-red-500";
      
      default:
        return "bg-blue-500";
    }
  };

  const getTextForLabel = (labelType: string) => {
    switch (labelType) {
      case "operation_name":
        return operation.operationName;
      
      case "job_name":
        return jobName || `J${operation.productionOrderId}`;
        
      case "job_number":
        return `J${operation.productionOrderId}`;
      
      case "due_date":
        return job?.dueDate ? new Date(job.dueDate).toLocaleDateString() : "No due date";
      
      case "priority":
        return job?.priority || "medium";
      
      case "status":
        return operation.status;
      
      case "duration":
        return `${operation.standardDuration || 0}h`;
      
      case "progress":
        // Calculate progress based on status
        return operation.status === "completed" ? "100%" : 
               operation.status === "In-Progress" ? "50%" : "0%";
      
      case "resource_name":
        return resourceName || "Unassigned";
      
      case "customer":
        return job?.customerId?.toString() || "Unknown";
      
      case "job_description":
        return job?.description || "No description";
      
      case "operation_description":
        return operation.description || "No description";
      
      case "resource_type":
        // This would need to be passed from parent component
        return "Machine"; // placeholder
      
      case "capabilities":
        return "None"; // TODO: Add capability display when schema is finalized
      
      case "start_time":
        return operation.startTime ? new Date(operation.startTime).toLocaleString() : "Not scheduled";
      
      case "end_time":
        return operation.endTime ? new Date(operation.endTime).toLocaleString() : "Not scheduled";
      
      case "slack_days":
        // Calculate slack days (due date - planned end date)
        if (job?.dueDate && operation.endTime) {
          const dueDate = new Date(job.dueDate);
          const endDate = new Date(operation.endTime);
          const diffTime = dueDate.getTime() - endDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 ? `${diffDays} days` : `${Math.abs(diffDays)} days over`;
        }
        return "N/A";
      
      case "days_late":
        // Calculate days late (current date - due date)
        if (job?.dueDate) {
          const dueDate = new Date(job.dueDate);
          const currentDate = new Date();
          const diffTime = currentDate.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? `${diffDays} days late` : "On time";
        }
        return "N/A";
      
      case "completion_percent":
        // Calculate completion percentage based on status and time
        if (operation.status === "completed") return "100%";
        if (operation.status === "planned") return "0%";
        if (operation.status === "in_progress") {
          // Simple calculation based on time passed
          if (operation.startTime && operation.endTime) {
            const startTime = new Date(operation.startTime).getTime();
            const endTime = new Date(operation.endTime).getTime();
            const currentTime = new Date().getTime();
            const totalDuration = endTime - startTime;
            const elapsed = currentTime - startTime;
            const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            return `${Math.round(percentage)}%`;
          }
          return "50%";
        }
        return "0%";
      
      default:
        return operation.operationName || "Operation";
    }
  };

  const getBlockText = () => {
    // Check if it's a custom text label
    if (textLabeling?.startsWith("custom_")) {
      const customLabelId = parseInt(textLabeling.replace("custom_", ""));
      const customLabel = customTextLabels.find(label => label.id === customLabelId);
      if (customLabel && customLabel.config) {
        const enabledLabels = customLabel.config.labels
          .filter(label => label.enabled)
          .sort((a, b) => a.order - b.order);
        
        return (
          <div className="flex flex-wrap items-center gap-1">
            {enabledLabels.map((label, index) => (
              <span
                key={`${label.type}-${index}`}
                style={{
                  fontSize: `${label.fontSize || customLabel.config.fontSize || 12}px`,
                  color: label.fontColor || customLabel.config.fontColor || "#ffffff",
                }}
              >
                {getTextForLabel(label.type)}
                {index < enabledLabels.length - 1 && " • "}
              </span>
            ))}
          </div>
        );
      }
    }
    // Fallback to operation name if no custom label
    return operation.operationName || "Operation";
  };

  const getTooltipContent = () => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "Not scheduled";
      return new Date(dateStr).toLocaleString();
    };

    return (
      <div className="space-y-2 text-sm">
        <div className="font-semibold border-b border-gray-200 pb-1">
          {operation.operationName || `Operation ${operation.id}`}
        </div>
        <div className="space-y-1">
          <div><strong>Job:</strong> {jobName || `Job ${operation.productionOrderId}`}</div>
          {job?.customerId && <div><strong>Customer:</strong> {job.customerId}</div>}
          {job?.priority && <div><strong>Priority:</strong> {job.priority}</div>}
          <div><strong>Status:</strong> {operation.status}</div>
          {operation.standardDuration && <div><strong>Duration:</strong> {operation.standardDuration}h</div>}
          <div><strong>Resource:</strong> {resourceName || "Unassigned"}</div>
        </div>
        {(operation.startTime || operation.endTime) && (
          <div className="space-y-1 border-t border-gray-200 pt-1">
            <div><strong>Start:</strong> {formatDate(operation.startTime?.toString() || null)}</div>
            <div><strong>End:</strong> {formatDate(operation.endTime?.toString() || null)}</div>
          </div>
        )}
        {(operation.description || job?.description) && (
          <div className="border-t border-gray-200 pt-1">
            <strong>Description:</strong> {operation.description || job?.description}
          </div>
        )}
      </div>
    );
  };

  // If this is an unscheduled operation, render it as a draggable block without position
  if (!operation.startTime || !operation.endTime) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={drag}
              data-operation-block
              data-operation-id={operation.id}
              className={`inline-block mr-2 mb-2 rounded shadow-sm cursor-move transition-all duration-200 overflow-hidden ${
                isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
              }`}
              style={{
                height: `${blockHeight}px`,
                minWidth: "120px",
                border: "1px solid #333",
              }}
              onMouseEnter={() => onHoverStart?.(operation.productionOrderId)}
              onMouseLeave={() => onHoverEnd?.()}
            >
              <div className="h-full flex flex-col">
                {/* Blue header with WO and operation name */}
                <div className="bg-blue-600 text-white px-2 py-1 text-xs font-medium border-b border-blue-700" style={{ height: '60%' }}>
                  <div className="truncate">WO-{job?.orderNumber || operation.productionOrderId}</div>
                  <div className="truncate">{operation.operationName || "Operation"}</div>
                </div>
                {/* Status bar - orange for waiting (unscheduled operations are waiting) */}
                <div className="bg-orange-500 flex-1 px-2 flex items-center text-xs text-white font-medium">
                  <span className="truncate">Waiting</span>
                </div>
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(operation);
                    }}
                    className="absolute bottom-1 right-1 h-4 w-4 p-0 hover:bg-white/20 z-20"
                    title="View operation details"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-lg z-[2147483647] tooltip-content p-4 min-w-80"
            sideOffset={15}
            avoidCollisions={true}
            collisionPadding={30}
            sticky="always"
          >
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={drag}
            data-operation-block
            data-operation-id={operation.id}
            className={`absolute z-10 rounded shadow-md cursor-move transition-all duration-200 overflow-hidden ${
              isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
            }`}
            style={{
              left: `${position.left}px`,
              width: `${position.width}px`,
              height: `${blockHeight}px`,
              minWidth: "80px",
              top: "8px", // Center vertically with 8px margin
              border: "1px solid #333",
            }}
            onMouseEnter={() => onHoverStart?.(operation.productionOrderId)}
            onMouseLeave={() => onHoverEnd?.()}
          >
            <div className="h-full flex flex-col relative">
              {/* Blue header with WO and operation name */}
              <div className="bg-blue-600 text-white px-2 py-0.5 text-xs font-medium border-b border-blue-700" style={{ minHeight: '55%' }}>
                <div className="truncate leading-tight">WO-{job?.orderNumber || operation.productionOrderId}</div>
                <div className="truncate leading-tight">{operation.operationName?.substring(0, 20) || "Op"}</div>
              </div>
              {/* Status bar - green for ready, orange for waiting */}
              <div className={`flex-1 px-2 flex items-center text-xs text-white font-medium ${
                operation.status === 'completed' ? 'bg-green-600' :
                operation.status === 'in_progress' ? 'bg-green-600' :
                operation.status === 'scheduled' ? 'bg-orange-500' :
                'bg-orange-500'
              }`}>
                <span className="truncate">
                  {operation.status === 'completed' ? 'Completed' :
                   operation.status === 'in_progress' ? 'Ready' :
                   operation.status === 'scheduled' ? 'Waiting' :
                   'Waiting'}
                </span>
              </div>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(operation);
                  }}
                  className="absolute bottom-1 right-1 h-4 w-4 p-0 hover:bg-white/20 z-20"
                  title="View operation details"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-lg z-[2147483647] tooltip-content p-4 min-w-80"
          sideOffset={15}
          avoidCollisions={true}
          collisionPadding={30}
          sticky="always"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}