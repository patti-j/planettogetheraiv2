import { useDrop } from "react-dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Operation, Resource } from "@shared/schema";

interface DragItem {
  operation: Operation;
}

export function useOperationDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: any[],
  timeUnit: "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade",
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      // Also invalidate job-specific operations
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

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: (item) => {
      // Check if resource has required capabilities
      const operation = item.operation;
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        return true; // No capabilities required
      }
      
      // Check if resource has all required capabilities
      const resourceCapabilities = resource.capabilities || [];
      return operation.requiredCapabilities.every(reqCap => 
        resourceCapabilities.includes(reqCap)
      );
    },
    drop: (item, monitor) => {
      // Get the drop position and calculate time-based positioning
      const clientOffset = monitor.getClientOffset();
      
      let startTime, endTime;
      if (clientOffset) {
        // Find the resource timeline element
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          const relativeX = Math.max(0, clientOffset.x - rect.left);
          
          // Calculate which time period and position within that period
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          const timeWithinPeriod = (relativeX % periodWidth) / periodWidth; // 0-1 representing position within period
          
          // Get the base date for this period
          const now = new Date();
          let periodStart: Date;
          let periodDuration: number; // in milliseconds
          
          switch (timeUnit) {
            case "hour":
              periodStart = new Date(now.getTime() + (periodIndex * 60 * 60 * 1000));
              periodDuration = 60 * 60 * 1000; // 1 hour
              break;
            case "day":
              periodStart = new Date(now.getTime() + (periodIndex * 24 * 60 * 60 * 1000));
              periodStart.setHours(8, 0, 0, 0); // Start at 8 AM
              periodDuration = 8 * 60 * 60 * 1000; // 8 working hours
              break;
            case "week":
              periodStart = new Date(now.getTime() + (periodIndex * 7 * 24 * 60 * 60 * 1000));
              periodStart.setHours(8, 0, 0, 0); // Start at 8 AM on first day
              periodDuration = 5 * 8 * 60 * 60 * 1000; // 5 working days * 8 hours
              break;
          }
          
          // Calculate precise start time within the period
          const offsetWithinPeriod = timeWithinPeriod * periodDuration;
          const startDate = new Date(periodStart.getTime() + offsetWithinPeriod);
          
          // Calculate end time based on operation duration
          const operationDuration = item.operation.duration || 8; // default 8 hours
          const endDate = new Date(startDate.getTime() + (operationDuration * 60 * 60 * 1000));
          
          startTime = startDate.toISOString();
          endTime = endDate.toISOString();
          
          console.log('Drop calculation:', {
            operationId: item.operation.id,
            resourceId: resource.id,
            timeUnit,
            relativeX,
            periodWidth,
            periodIndex,
            timeWithinPeriod,
            startTime,
            endTime
          });
        }
      }
      
      // Always update the operation, whether it's changing resources or just position
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

  return {
    drop,
    isOver,
    canDrop,
    isDropping: updateOperationMutation.isPending,
  };
}

// Hook for dropping operations in operations view (for time-only changes)
export function useTimelineDrop(
  timelineWidth: number,
  timeScale: any[],
  timeUnit: "hour" | "day" | "week",
  onDropSuccess?: () => void
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOperationMutation = useMutation({
    mutationFn: async ({ operationId, startTime, endTime }: { 
      operationId: number; 
      startTime?: string;
      endTime?: string;
    }) => {
      const updateData: any = {};
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      
      const response = await apiRequest("PUT", `/api/operations/${operationId}`, updateData);
      return response.json();
    },
    onSuccess: (updatedOperation) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      // Also invalidate job-specific operations
      if (updatedOperation.jobId) {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs", updatedOperation.jobId, "operations"] });
      }
      
      toast({ title: "Operation rescheduled successfully" });
      onDropSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to reschedule operation:", error);
      toast({ title: "Failed to reschedule operation", variant: "destructive" });
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: "operation",
    canDrop: () => true, // Can always drop for time changes
    drop: (item, monitor) => {
      // Get the drop position and calculate time-based positioning
      const clientOffset = monitor.getClientOffset();
      
      let startTime, endTime;
      if (clientOffset) {
        // Find the timeline element
        const timelineElement = document.querySelector(`[data-timeline-container]`);
        if (timelineElement) {
          const rect = timelineElement.getBoundingClientRect();
          const relativeX = Math.max(0, clientOffset.x - rect.left);
          
          // Calculate which time period and position within that period
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          const timeWithinPeriod = (relativeX % periodWidth) / periodWidth; // 0-1 representing position within period
          
          // Get the base date for this period
          const now = new Date();
          let periodStart: Date;
          let periodDuration: number; // in milliseconds
          
          switch (timeUnit) {
            case "hour":
              periodStart = new Date(now.getTime() + (periodIndex * 60 * 60 * 1000));
              periodDuration = 60 * 60 * 1000; // 1 hour
              break;
            case "day":
              periodStart = new Date(now.getTime() + (periodIndex * 24 * 60 * 60 * 1000));
              periodStart.setHours(8, 0, 0, 0); // Start at 8 AM
              periodDuration = 8 * 60 * 60 * 1000; // 8 working hours
              break;
            case "week":
              periodStart = new Date(now.getTime() + (periodIndex * 7 * 24 * 60 * 60 * 1000));
              periodStart.setHours(8, 0, 0, 0); // Start at 8 AM on first day
              periodDuration = 5 * 8 * 60 * 60 * 1000; // 5 working days * 8 hours
              break;
          }
          
          // Calculate precise start time within the period
          const offsetWithinPeriod = timeWithinPeriod * periodDuration;
          const startDate = new Date(periodStart.getTime() + offsetWithinPeriod);
          
          // Calculate end time based on operation duration
          const operationDuration = item.operation.duration || 8; // default 8 hours
          const endDate = new Date(startDate.getTime() + (operationDuration * 60 * 60 * 1000));
          
          startTime = startDate.toISOString();
          endTime = endDate.toISOString();
          
          console.log('Timeline drop calculation:', {
            operationId: item.operation.id,
            timeUnit,
            relativeX,
            periodWidth,
            periodIndex,
            timeWithinPeriod,
            startTime,
            endTime
          });
        }
      }
      
      // Update the operation time
      updateOperationMutation.mutate({
        operationId: item.operation.id,
        startTime,
        endTime
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return {
    drop,
    isOver,
    canDrop,
    isDropping: updateOperationMutation.isPending,
  };
}

export function useCapabilityValidation() {
  const validateCapabilities = (
    operationCapabilities: number[],
    resourceCapabilities: number[]
  ): boolean => {
    if (!operationCapabilities || operationCapabilities.length === 0) {
      return true; // No capabilities required
    }
    
    return operationCapabilities.every(reqCap => 
      resourceCapabilities.includes(reqCap)
    );
  };

  const getMissingCapabilities = (
    operationCapabilities: number[],
    resourceCapabilities: number[]
  ): number[] => {
    if (!operationCapabilities || operationCapabilities.length === 0) {
      return [];
    }
    
    return operationCapabilities.filter(reqCap => 
      !resourceCapabilities.includes(reqCap)
    );
  };

  return {
    validateCapabilities,
    getMissingCapabilities,
  };
}
