import { useDrop } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Resource, Operation } from '@shared/schema';

interface DragItem {
  operation: Operation;
  cursorOffsetX?: number; // How far from the left edge of the block the cursor is
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export function useOperationDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: any[],
  timeUnit: TimeUnit,
  timelineScrollLeft: number,
  timelineBaseDate: Date,
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
      
      if (clientOffset) {
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          
          // FIXED: Use the cursor position minus the offset within the block to get the block's start position
          const cursorOffsetX = item.cursorOffsetX || 0;
          const blockStartX = clientOffset.x - cursorOffsetX;
          const relativeX = Math.max(0, blockStartX - rect.left + timelineScrollLeft);
          
          // Calculate which period we're in
          const periodWidth = timelineWidth / timeScale.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, timeScale.length - 1));
          
          // Calculate the exact position within the period
          const positionWithinPeriod = relativeX % periodWidth;
          const fractionWithinPeriod = positionWithinPeriod / periodWidth;
          
          // DEBUG: Log the drop calculation values
          console.log("DROP DEBUG:", {
            clientX: clientOffset.x,
            cursorOffsetX,
            blockStartX,
            rectLeft: rect.left,
            timelineScrollLeft,
            relativeX,
            periodWidth,
            periodIndex,
            clampedPeriodIndex,
            positionWithinPeriod,
            fractionWithinPeriod,
            timelineWidth,
            timeScaleLength: timeScale.length,
            timeUnit
          });
          
          // FIXED: Use the same period-based calculation as OperationBlock
          // Calculate step size for this time unit (matching OperationBlock)
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
          
          // FIXED: Calculate operation start time using precise position within the period
          const periodStartTime = timelineBaseDate.getTime() + (clampedPeriodIndex * stepMs);
          const preciseStartTime = periodStartTime + (fractionWithinPeriod * stepMs);
          const operationStartTime = new Date(preciseStartTime);
          
          // Calculate end time based on operation duration
          const operationDuration = item.operation.duration || 8; // Default 8 hours
          const operationEndTime = new Date(operationStartTime.getTime() + (operationDuration * 60 * 60 * 1000));
          
          // DEBUG: Log the final time calculation
          console.log("FINAL TIME CALCULATION:", {
            timelineBaseDate: timelineBaseDate.toISOString(),
            clampedPeriodIndex,
            fractionWithinPeriod,
            stepMs,
            periodStartTime: new Date(periodStartTime).toISOString(),
            preciseStartTime: new Date(preciseStartTime).toISOString(),
            operationStartTime: operationStartTime.toISOString(),
            operationEndTime: operationEndTime.toISOString(),
            operationDuration
          });
            
          // Update the operation with the new timing
          updateOperationMutation.mutate({
            operationId: item.operation.id,
            resourceId: resource.id,
            startTime: operationStartTime.toISOString(),
            endTime: operationEndTime.toISOString()
          });
        }
      }
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
  timelineScrollLeft: number,
  timelineBaseDate: Date,
  onDropSuccess?: () => void
) {
  return useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timelineScrollLeft, timelineBaseDate, onDropSuccess);
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
    }
  };
}