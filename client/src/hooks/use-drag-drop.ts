import { useDrop } from "react-dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Operation, Resource } from "@shared/schema";

interface DragItem {
  operation: Operation;
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export function useOperationDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: any[],
  timeUnit: TimeUnit,
  timelineScrollLeft: number,
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
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({ title: "Operation assigned successfully" });
      onDropSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to assign operation:", error);
      toast({ title: "Failed to assign operation", variant: "destructive" });
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      const operation = item.operation;
      if (!operation || !operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      const operationCapabilities = operation.requiredCapabilities || [];
      return operationCapabilities.every(reqCap => 
        resourceCapabilities.includes(reqCap)
      );
    },
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      let startTime, endTime;
      if (clientOffset) {
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          
          // Calculate position relative to timeline, accounting for scroll
          const relativeX = Math.max(0, clientOffset.x - rect.left + timelineScrollLeft);
          
          // Calculate which period we're in based on the timeline scale
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          
          // Clamp to valid period indices
          const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, timeScale.length - 1));
          
          // Get the exact time for this period from the timeScale
          const periodData = timeScale[clampedPeriodIndex];
          if (periodData && periodData.date) {
            const periodStartTime = new Date(periodData.date);
            
            // Calculate offset within the period
            const offsetWithinPeriod = (relativeX % periodWidth) / periodWidth;
            
            // Calculate step size for this time unit
            let stepMs: number;
            switch (timeUnit) {
              case "hour":
                stepMs = 60 * 60 * 1000; // 1 hour
                break;
              case "shift":
                stepMs = 8 * 60 * 60 * 1000; // 8 hours
                break;
              case "day":
                stepMs = 24 * 60 * 60 * 1000; // 1 day
                break;
              case "week":
                stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week
                break;
              case "month":
                stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month
                break;
              case "quarter":
                stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter
                break;
              case "year":
                stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year
                break;
              case "decade":
                stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade
                break;
              default:
                stepMs = 24 * 60 * 60 * 1000; // Default to 1 day
            }
            
            // Calculate the exact start time
            const startDate = new Date(periodStartTime.getTime() + (offsetWithinPeriod * stepMs));
            
            // Calculate end time based on operation duration
            const operationDuration = item.operation.duration || 8;
            const endDate = new Date(startDate.getTime() + (operationDuration * 60 * 60 * 1000));
            
            startTime = startDate.toISOString();
            endTime = endDate.toISOString();
          }
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

export function useTimelineDrop(
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
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({ title: "Operation assigned successfully" });
      onDropSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to assign operation:", error);
      toast({ title: "Failed to assign operation", variant: "destructive" });
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      const operation = item.operation;
      if (!operation || !operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      const operationCapabilities = operation.requiredCapabilities || [];
      return operationCapabilities.every(reqCap => 
        resourceCapabilities.includes(reqCap)
      );
    },
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      let startTime, endTime;
      if (clientOffset) {
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          
          // Calculate position relative to timeline (no scroll here for timeline drop)
          const relativeX = Math.max(0, clientOffset.x - rect.left);
          
          // Calculate which period we're in based on the timeline scale
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          
          // Clamp to valid period indices
          const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, timeScale.length - 1));
          
          // Get the exact time for this period from the timeScale
          const periodData = timeScale[clampedPeriodIndex];
          if (periodData && periodData.date) {
            const periodStartTime = new Date(periodData.date);
            
            // Calculate offset within the period
            const offsetWithinPeriod = (relativeX % periodWidth) / periodWidth;
            
            // Calculate step size for this time unit
            let stepMs: number;
            switch (timeUnit) {
              case "hour":
                stepMs = 60 * 60 * 1000; // 1 hour
                break;
              case "shift":
                stepMs = 8 * 60 * 60 * 1000; // 8 hours
                break;
              case "day":
                stepMs = 24 * 60 * 60 * 1000; // 1 day
                break;
              case "week":
                stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week
                break;
              case "month":
                stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month
                break;
              case "quarter":
                stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter
                break;
              case "year":
                stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year
                break;
              case "decade":
                stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade
                break;
              default:
                stepMs = 24 * 60 * 60 * 1000; // Default to 1 day
            }
            
            // Calculate the exact start time
            const startDate = new Date(periodStartTime.getTime() + (offsetWithinPeriod * stepMs));
            
            // Calculate end time based on operation duration
            const operationDuration = item.operation.duration || 8;
            const endDate = new Date(startDate.getTime() + (operationDuration * 60 * 60 * 1000));
            
            startTime = startDate.toISOString();
            endTime = endDate.toISOString();
          }
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

export function useCapabilityValidation() {
  return {
    canAssignOperation: (operation: Operation, resource: Resource) => {
      if (!operation || !operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      const operationCapabilities = operation.requiredCapabilities || [];
      return operationCapabilities.every(reqCap => 
        resourceCapabilities.includes(reqCap)
      );
    },
  };
}