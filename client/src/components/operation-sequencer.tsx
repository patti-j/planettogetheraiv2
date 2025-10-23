import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  GripVertical,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Calendar,
  Factory,
  ArrowRight,
  Save,
  RotateCcw
} from 'lucide-react';

interface Operation {
  id: number;
  name: string;
  description?: string;
  status: string;
  duration: number;
  startTime?: Date;
  endTime?: Date;
  assignedResourceId?: number;
  jobId: number;
  order: number;
  priority: number;
  operationName: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface OperationSequencerProps {
  resourceFilter?: string;
  statusFilter?: string;
  view?: 'compact' | 'standard' | 'detailed';
  onSequenceChange?: (operations: Operation[]) => void;
}

export function OperationSequencer({ 
  resourceFilter = 'all', 
  statusFilter = 'all',
  view = 'standard',
  onSequenceChange
}: OperationSequencerProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch operations
  const { data: operationsData = [], isLoading } = useQuery({
    queryKey: ['/api/operations'],
  });

  // Fetch resources for display
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Save sequence mutation
  const saveSequenceMutation = useMutation({
    mutationFn: async (updatedOperations: Operation[]) => {
      return apiRequest('PUT', '/api/operations/sequence', { operations: updatedOperations });
    },
    onSuccess: () => {
      toast({
        title: "Sequence Saved",
        description: "Operation sequence has been updated successfully."
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save operation sequence. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize operations from API data
  useEffect(() => {
    if (operationsData && (operationsData as any[]).length > 0) {
      // Filter operations based on filters
      let filteredOps = [...(operationsData as Operation[])];
      
      if (resourceFilter !== 'all') {
        filteredOps = filteredOps.filter(op => 
          op.assignedResourceId?.toString() === resourceFilter
        );
      }
      
      if (statusFilter !== 'all') {
        filteredOps = filteredOps.filter(op => 
          op.status && op.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Sort by current order/sequence
      filteredOps.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setOperations(filteredOps);
    }
  }, [operationsData, resourceFilter, statusFilter]);

  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    const reorderedOperations = Array.from(operations);
    const [removed] = reorderedOperations.splice(source.index, 1);
    reorderedOperations.splice(destination.index, 0, removed);

    // Update order values
    const updatedOperations = reorderedOperations.map((op, index) => ({
      ...op,
      order: index + 1
    }));

    setOperations(updatedOperations);
    setHasChanges(true);
    
    if (onSequenceChange) {
      onSequenceChange(updatedOperations);
    }
  };

  // Save sequence
  const handleSaveSequence = () => {
    saveSequenceMutation.mutate(operations);
  };

  // Reset sequence
  const handleResetSequence = () => {
    const originalOps = [...(operationsData as Operation[])]
      .filter(op => {
        if (resourceFilter !== 'all' && op.assignedResourceId?.toString() !== resourceFilter) return false;
        if (statusFilter !== 'all' && (!op.status || op.status.toLowerCase() !== statusFilter.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.id - b.id); // Reset to original ID order
    
    const resetOps = originalOps.map((op, index) => ({
      ...op,
      order: index + 1
    }));
    
    setOperations(resetOps);
    setHasChanges(false);
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    if (!status) {
      return { icon: Pause, color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' };
    }
    switch (status.toLowerCase()) {
      case 'completed':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' };
      case 'in-progress':
      case 'in progress':
        return { icon: Play, color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' };
      case 'pending':
      case 'scheduled':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' };
      case 'blocked':
        return { icon: AlertTriangle, color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' };
      default:
        return { icon: Pause, color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' };
    }
  };

  // Get resource name
  const getResourceName = (resourceId?: number) => {
    if (!resourceId) return 'Unassigned';
    const resource = (resources as Resource[]).find(r => r.id === resourceId);
    return resource?.name || `Resource ${resourceId}`;
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-red-200 bg-red-50';
    if (priority >= 3) return 'border-orange-200 bg-orange-50';
    if (priority >= 2) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Loading operations...</p>
        </div>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Factory className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-500">No operations found</p>
          <p className="text-xs text-gray-400 mt-1">
            {resourceFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Operations will appear here when available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {hasChanges && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              You have unsaved changes to the operation sequence
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSequence}
              className="text-blue-700 border-blue-300"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSequence}
              disabled={saveSequenceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-3 w-3 mr-1" />
              {saveSequenceMutation.isPending ? 'Saving...' : 'Save Sequence'}
            </Button>
          </div>
        </div>
      )}

      {/* Operations List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="operations-sequence">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 min-h-32 p-2 rounded-lg transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
              }`}
            >
              {operations.map((operation, index) => {
                const statusInfo = getStatusInfo(operation.status);
                const StatusIcon = statusInfo.icon;
                const resourceName = getResourceName(operation.assignedResourceId);

                return (
                  <Draggable
                    key={operation.id}
                    draggableId={operation.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style}
                        className={`${snapshot.isDragging ? 'rotate-1 scale-105' : ''} transition-transform`}
                      >
                        <Card className={`transition-all duration-200 hover:shadow-md ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
                        } ${getPriorityColor(operation.priority)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>

                              {/* Sequence Number */}
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                              </div>

                              {/* Operation Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {operation.name}
                                  </h3>
                                  <Badge className={statusInfo.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {operation.status}
                                  </Badge>
                                </div>
                                
                                {view !== 'compact' && (
                                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {operation.duration}min
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {resourceName}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      Job #{operation.jobId}
                                    </div>
                                  </div>
                                )}

                                {view === 'detailed' && operation.description && (
                                  <p className="mt-2 text-xs text-gray-600">
                                    {operation.description}
                                  </p>
                                )}
                              </div>

                              {/* Priority Indicator */}
                              {operation.priority >= 3 && (
                                <div className="flex-shrink-0">
                                  <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                                    P{operation.priority}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Helper Text */}
      <div className="text-center text-xs text-gray-500 mt-4">
        <ArrowRight className="h-3 w-3 inline mr-1" />
        Drag operations up or down to change their sequence order
      </div>
    </div>
  );
}