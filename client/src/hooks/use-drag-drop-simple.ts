import { useDrop } from "react-dnd";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Operation, type Resource } from "@shared/schema";

interface DragItem {
  operation: Operation;
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export function useOperationDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: any[],
  timeUnit: TimeUnit,
  onDropSuccess?: () => void
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOperationMutation = useMutation({
    mutationFn: async ({ operationId, resourceId, startTime, endTime }: { 
      operationId: number; 
      resourceId: number; 
      startTime?: string;
      endTime?: string;
    }) => {
      const updateData: any = { assignedResourceId: resourceId };
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      
      const response = await apiRequest("PUT", `/api/operations/${operationId}`, updateData);
      return response.json();
    },
    onSuccess: (updatedOperation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      if (updatedOperation.jobId) {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs", updatedOperation.jobId, "operations"] });
      }
      
      toast({ title: "Operation assigned successfully" });
      onDropSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to assign operation:", error);
      toast({ title: "Failed to assign operation", variant: "destructive" });
    },
  });

  const calculateTimeFromDrop = (timeUnit: TimeUnit, periodIndex: number, timeWithinPeriod: number) => {
    const now = new Date();
    let periodStart: Date;
    let periodDuration: number;
    
    switch (timeUnit) {
      case "hour":
        periodStart = new Date(now.getTime() + (periodIndex * 60 * 60 * 1000));
        periodDuration = 60 * 60 * 1000; // 1 hour
        break;
      case "shift":
        periodStart = new Date(now.getTime() + (periodIndex * 8 * 60 * 60 * 1000));
        periodDuration = 8 * 60 * 60 * 1000; // 8-hour shift
        break;
      case "day":
        periodStart = new Date(now.getTime() + (periodIndex * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 8 * 60 * 60 * 1000; // 8 working hours
        break;
      case "week":
        periodStart = new Date(now.getTime() + (periodIndex * 7 * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 5 * 8 * 60 * 60 * 1000; // 5 working days * 8 hours
        break;
      case "month":
        periodStart = new Date(now.getTime() + (periodIndex * 30 * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 22 * 8 * 60 * 60 * 1000; // ~22 working days * 8 hours
        break;
      case "quarter":
        periodStart = new Date(now.getTime() + (periodIndex * 90 * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 66 * 8 * 60 * 60 * 1000; // ~66 working days * 8 hours
        break;
      case "year":
        periodStart = new Date(now.getTime() + (periodIndex * 365 * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 260 * 8 * 60 * 60 * 1000; // ~260 working days * 8 hours
        break;
      case "decade":
        periodStart = new Date(now.getTime() + (periodIndex * 3650 * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 2600 * 8 * 60 * 60 * 1000; // ~2600 working days * 8 hours
        break;
      default:
        periodStart = new Date(now.getTime() + (periodIndex * 24 * 60 * 60 * 1000));
        periodStart.setHours(8, 0, 0, 0);
        periodDuration = 8 * 60 * 60 * 1000;
        break;
    }
    
    return { periodStart, periodDuration };
  };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      // Simplified - allow all drops for now
      return true;
    },
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      let startTime, endTime;
      if (clientOffset) {
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          const relativeX = Math.max(0, clientOffset.x - rect.left);
          
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          const timeWithinPeriod = (relativeX % periodWidth) / periodWidth;
          
          const { periodStart, periodDuration } = calculateTimeFromDrop(timeUnit, periodIndex, timeWithinPeriod);
          
          const offsetWithinPeriod = timeWithinPeriod * periodDuration;
          const startDate = new Date(periodStart.getTime() + offsetWithinPeriod);
          
          const operationDuration = item.operation.duration || 8;
          const endDate = new Date(startDate.getTime() + (operationDuration * 60 * 60 * 1000));
          
          startTime = startDate.toISOString();
          endTime = endDate.toISOString();
        }
      }
      
      updateOperationMutation.mutate({
        operationId: item.operation.id,
        resourceId: resource.id,
        startTime,
        endTime
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return { drop, isOver, canDrop };
}