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
    mutationFn: async ({ operationId, resourceId }: { operationId: number; resourceId: number }) => {
      const response = await apiRequest("PUT", `/api/operations/${operationId}`, {
        assignedResourceId: resourceId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Operation assigned successfully" });
      onDropSuccess?.();
    },
    onError: () => {
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
    drop: (item) => {
      if (item.operation.assignedResourceId !== resource.id) {
        updateOperationMutation.mutate({
          operationId: item.operation.id,
          resourceId: resource.id,
        });
      }
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
