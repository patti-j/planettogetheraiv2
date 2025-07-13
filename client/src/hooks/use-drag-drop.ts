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

  const calculateTimeFromDrop = (timeUnit: TimeUnit, periodIndex: number, timeWithinPeriod: number) => {
    const now = new Date();
    let stepMs: number;
    
    // Match the exact logic from the Gantt chart timeScale generation
    switch (timeUnit) {
      case "hour":
        stepMs = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case "shift":
        stepMs = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        break;
      case "day":
        stepMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      case "week":
        stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        break;
      case "month":
        stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
        break;
      case "quarter":
        stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter in milliseconds
        break;
      case "year":
        stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds
        break;
      case "decade":
        stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade in milliseconds
        break;
      default:
        stepMs = 24 * 60 * 60 * 1000; // Default to 1 day
        break;
    }
    
    // Calculate the exact period start time matching the timeline generation
    const periodStart = new Date(now.getTime() + (periodIndex * stepMs));
    
    return { periodStart, periodDuration: stepMs };
  };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      const operation = item.operation;
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      return operation.requiredCapabilities.every(reqCap => 
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
          const relativeX = Math.max(0, clientOffset.x - rect.left + timelineScrollLeft);
          
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

  const calculateTimeFromDrop = (timeUnit: TimeUnit, periodIndex: number, timeWithinPeriod: number) => {
    const now = new Date();
    let stepMs: number;
    
    // Match the exact logic from the Gantt chart timeScale generation
    switch (timeUnit) {
      case "hour":
        stepMs = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case "shift":
        stepMs = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        break;
      case "day":
        stepMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      case "week":
        stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        break;
      case "month":
        stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
        break;
      case "quarter":
        stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter in milliseconds
        break;
      case "year":
        stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds
        break;
      case "decade":
        stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade in milliseconds
        break;
      default:
        stepMs = 24 * 60 * 60 * 1000; // Default to 1 day
        break;
    }
    
    // Calculate the exact period start time matching the timeline generation
    const periodStart = new Date(now.getTime() + (periodIndex * stepMs));
    
    return { periodStart, periodDuration: stepMs };
  };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      const operation = item.operation;
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      return operation.requiredCapabilities.every(reqCap => 
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

export function useCapabilityValidation() {
  return {
    canAssignOperation: (operation: Operation, resource: Resource) => {
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true;
      }
      
      const resourceCapabilities = resource.capabilities || [];
      return operation.requiredCapabilities.every(reqCap => 
        resourceCapabilities.includes(reqCap)
      );
    },
  };
}