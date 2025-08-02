import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Clock, AlertTriangle, TrendingUp, TrendingDown, Zap, Settings, Play, Pause, RefreshCw } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Operation {
  id: number;
  name: string;
  status: string;
  assignedResourceId: number;
  duration: number;
  startTime?: string;
  endTime?: string;
  productionOrderId: number;
  isBottleneck?: boolean;
  isEarly?: boolean;
  isLate?: boolean;
  timeVarianceHours?: number;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface SequencerConfig {
  view: 'compact' | 'standard' | 'detailed';
  allowReorder: boolean;
  showResourceFilter: boolean;
  showStatusFilter: boolean;
  showOptimizationFlags: boolean;
}

interface OperationSequencerWidgetProps {
  configuration?: SequencerConfig;
  isDesktop?: boolean;
}

const DraggableOperationCard = ({ 
  operation, 
  index, 
  onMove, 
  isCompact = true 
}: { 
  operation: Operation; 
  index: number; 
  onMove: (fromIndex: number, toIndex: number) => void;
  isCompact?: boolean;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'operation',
    item: () => ({ index, id: operation.id }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'operation',
    drop: (item: { index: number; id: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div 
      ref={(node) => drag(drop(node))} 
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver && canDrop ? '#f0f9ff' : 'transparent',
      }}
      className={`${isOver && canDrop ? 'border-2 border-blue-300 border-dashed' : ''} mb-2`}
    >
      <Card className={`border-l-4 cursor-move hover:bg-gray-50 transition-colors ${getStatusColor(operation.status)}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{operation.name}</h4>
                <div className="flex items-center gap-1">
                  {operation.isBottleneck && (
                    <Zap className="w-3 h-3 text-red-500" title="Bottleneck" />
                  )}
                  {operation.isEarly && (
                    <TrendingUp className="w-3 h-3 text-green-500" title="Can be scheduled earlier" />
                  )}
                  {operation.isLate && (
                    <TrendingDown className="w-3 h-3 text-red-500" title="Behind schedule" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(operation.duration)}</span>
                <Badge variant="secondary" className="text-xs">
                  {operation.status}
                </Badge>
              </div>
              
              {operation.startTime && (
                <div className="text-xs text-gray-500 mt-1">
                  Start: {new Date(operation.startTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function OperationSequencerWidget({ 
  configuration = {
    view: 'compact',
    allowReorder: true,
    showResourceFilter: true,
    showStatusFilter: true,
    showOptimizationFlags: true
  },
  isDesktop = false
}: OperationSequencerWidgetProps) {
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orderedOperations, setOrderedOperations] = useState<Operation[]>([]);
  const [hasReorder, setHasReorder] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch operations and resources
  const { data: operations = [], isLoading: operationsLoading } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Mutation for updating operation order
  const updateOperationMutation = useMutation({
    mutationFn: async (data: { id: number; order: number }) => {
      return apiRequest("PATCH", `/api/operations/${data.id}`, { order: data.order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      toast({
        title: "Operation order updated",
        description: "The operation sequence has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update operation order. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter operations based on selected filters
  const filteredOperations = useMemo(() => {
    let filtered = hasReorder && orderedOperations.length > 0 ? [...orderedOperations] : [...operations];

    // Filter by resource
    if (selectedResource !== "all") {
      filtered = filtered.filter(op => op.assignedResourceId === parseInt(selectedResource));
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(op => op.status === selectedStatus);
    }

    // Sort by start time if available
    filtered.sort((a, b) => {
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      return 0;
    });

    return filtered;
  }, [operations, orderedOperations, hasReorder, selectedResource, selectedStatus]);

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (!configuration.allowReorder) return;
    
    const newOperations = [...filteredOperations];
    const [movedOperation] = newOperations.splice(fromIndex, 1);
    newOperations.splice(toIndex, 0, movedOperation);
    
    setOrderedOperations(newOperations);
    setHasReorder(true);
  };

  const handleSaveOrder = () => {
    if (!hasReorder) return;
    
    // Update operation orders
    orderedOperations.forEach((operation, index) => {
      updateOperationMutation.mutate({ id: operation.id, order: index });
    });
    
    setHasReorder(false);
  };

  const handleResetOrder = () => {
    setOrderedOperations([]);
    setHasReorder(false);
  };

  if (operationsLoading || resourcesLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Operation Sequencer</h3>
            <div className="flex items-center gap-2">
              {hasReorder && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetOrder}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveOrder}
                    className="text-xs"
                    disabled={updateOperationMutation.isPending}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Save Order
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          {(configuration.showResourceFilter || configuration.showStatusFilter) && (
            <div className="flex gap-2 mb-4">
              {configuration.showResourceFilter && (
                <Select value={selectedResource} onValueChange={setSelectedResource}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id.toString()}>
                        {resource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {configuration.showStatusFilter && (
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Operations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredOperations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No operations match the current filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOperations.map((operation, index) => (
                  <DraggableOperationCard
                    key={operation.id}
                    operation={operation}
                    index={index}
                    onMove={handleMove}
                    isCompact={configuration.view === 'compact'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredOperations.length} operations</span>
              {hasReorder && (
                <span className="text-orange-600 font-medium">
                  Order changed - save to apply
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </DndProvider>
  );
}