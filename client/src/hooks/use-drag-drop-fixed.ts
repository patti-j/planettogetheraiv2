import { useDrop } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Resource, DiscreteOperation } from '@shared/schema';
import { safeCanDrop, safeCanAssignOperation, logDragDropError } from '@/lib/drag-drop-error-handler';

interface DragItem {
  operation: DiscreteOperation;
  cursorOffsetX?: number; // How far from the left edge of the block the cursor is
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export function useOperationDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: { periods: any[]; minDate: Date; maxDate: Date },
  timeUnit: TimeUnit,
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
      // Use the correct field name for work center ID (matches database schema)
      const updateData: any = { workCenterId: resourceId };
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      
      console.log("DRAG DROP API CALL:", { operationId, updateData });
      const response = await apiRequest("PUT", `/api/operations/${operationId}`, updateData);
      const result = await response.json();
      console.log("DRAG DROP API RESPONSE:", result);
      return result;
    },
    onMutate: async ({ operationId, resourceId, startTime, endTime }) => {
      // Optimistically update the cache to prevent visual jumping
      await queryClient.cancelQueries({ queryKey: ["/api/operations"] });
      
      const previousOperations = queryClient.getQueryData(["/api/operations"]);
      
      queryClient.setQueryData(["/api/operations"], (old: any) => {
        if (!old) return old;
        return old.map((op: any) => {
          if (op.id === operationId) {
            return {
              ...op,
              workCenterId: resourceId,
              startTime: startTime || op.startTime,
              endTime: endTime || op.endTime
            };
          }
          return op;
        });
      });
      
      return { previousOperations };
    },
    onSuccess: () => {
      // Only invalidate operations query to get fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({ title: "Operation assigned successfully" });
      onDropSuccess?.();
    },
    onError: (error, variables, context) => {
      // Restore previous state on error
      if (context?.previousOperations) {
        queryClient.setQueryData(["/api/operations"], context.previousOperations);
      }
      
      console.error("Failed to assign operation:", error);
      toast({ title: "Failed to assign operation", variant: "destructive" });
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "operation", // Must match exactly with useDrag type
    canDrop: (item: any) => {
      console.log("🎯 CAN DROP CHECK - TRIGGERED:", {
        itemType: typeof item,
        hasOperation: !!item?.operation,
        operationName: item?.operation?.operationName,
        resourceName: resource.name
      });
      // Always return true for now to debug
      console.log("🎯 FORCING CAN DROP TO TRUE FOR DEBUG");
      return true;
    },
    drop: (item, monitor) => {
      console.log("💥💥💥 DROP HANDLER TRIGGERED! 💥💥💥");
      alert(`Dropping ${item.operation.operationName} on ${resource.name}`);
      console.log("DROP OPERATION:", { 
        operationId: item.operation.id, 
        resourceId: resource.id,
        operationName: item.operation.operationName,
        resourceName: resource.name 
      });
      
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset) {
        const resourceTimelineElement = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (resourceTimelineElement) {
          const rect = resourceTimelineElement.getBoundingClientRect();
          
          // FIXED: Use the cursor position minus the offset within the block to get the block's start position
          const cursorOffsetX = item.cursorOffsetX || 0;
          const blockStartX = clientOffset.x - cursorOffsetX;
          const relativeX = Math.max(0, blockStartX - rect.left);
          
          // Calculate which period we're in
          const periodWidth = timelineWidth / timeScale.periods.length;
          const periodIndex = Math.floor(relativeX / periodWidth);
          const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, timeScale.periods.length - 1));
          
          // Calculate the exact position within the period
          const positionWithinPeriod = relativeX % periodWidth;
          const fractionWithinPeriod = positionWithinPeriod / periodWidth;
          
          // DEBUG: Log the drop calculation values
          console.log("DROP DEBUG:", {
            clientX: clientOffset.x,
            cursorOffsetX,
            blockStartX,
            rectLeft: rect.left,
            relativeX,
            periodWidth,
            periodIndex,
            clampedPeriodIndex,
            positionWithinPeriod,
            fractionWithinPeriod,
            timelineWidth,
            timeScaleLength: timeScale.periods.length,
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
          
          // Calculate end time based on operation duration (in minutes, convert to milliseconds)
          const operationDurationMinutes = item.operation.standardDuration || 480; // Default 8 hours (480 minutes)
          const operationEndTime = new Date(operationStartTime.getTime() + (operationDurationMinutes * 60 * 1000));
          
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
            operationDurationMinutes
          });
            
          console.log("💥 ABOUT TO MUTATE OPERATION:", {
            operationId: item.operation.id,
            resourceId: resource.id,
            startTime: operationStartTime.toISOString(),
            endTime: operationEndTime.toISOString()
          });
          
          alert(`Moving operation to ${resource.name}`);
          
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
    collect: (monitor) => {
      const isOver = monitor.isOver();
      const canDrop = monitor.canDrop();
      if (isOver) {
        console.log("🎯🎯🎯 DROP ZONE ACTIVE! 🎯🎯🎯", {
          resourceName: resource.name,
          isOver,
          canDrop,
          itemType: monitor.getItemType()
        });
      }
      return { isOver, canDrop };
    },
  });

  return { drop, isOver, canDrop };
}

export function useTimelineDrop(
  resource: Resource,
  timelineWidth: number,
  timeScale: any,
  timeUnit: TimeUnit,
  timelineScrollLeft: number,
  timelineBaseDate: Date
) {
  return useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timelineScrollLeft, timelineBaseDate);
}

export function useCapabilityValidation() {
  return {
    canAssignOperation: (operation: any, resource: Resource) => 
      safeCanAssignOperation(operation, resource, "capability-validation")
  };
}