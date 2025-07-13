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
          const timelineWidth = rect.width;
          
          // Calculate which day (0-6) and time within that day
          const dayWidth = timelineWidth / 7; // 7 days in timeline
          const dayIndex = Math.floor(relativeX / dayWidth);
          const timeWithinDay = (relativeX % dayWidth) / dayWidth; // 0-1 representing position within day
          
          // Calculate actual start time with more precision
          const today = new Date();
          const startDate = new Date(today);
          startDate.setDate(today.getDate() + dayIndex);
          
          // More precise time calculation: 8 AM to 4 PM (8 hours)
          const workingHours = 8;
          const totalMinutes = timeWithinDay * workingHours * 60; // Convert to minutes
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          
          startDate.setHours(8 + hours, minutes, 0, 0);
          
          // Calculate end time based on operation duration
          const endDate = new Date(startDate);
          endDate.setHours(startDate.getHours() + (item.operation.duration || 8));
          
          startTime = startDate.toISOString();
          endTime = endDate.toISOString();
          
          console.log('Drop calculation:', {
            operationId: item.operation.id,
            resourceId: resource.id,
            relativeX,
            timelineWidth,
            dayWidth,
            dayIndex,
            timeWithinDay,
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
