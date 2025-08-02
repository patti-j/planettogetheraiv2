import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Clock, AlertTriangle, TrendingUp, TrendingDown, Zap, Settings, Play, Pause, RefreshCw, Calendar } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ScheduleScenario {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface ResourceRequirementBlock {
  id: number;
  scenarioId: number;
  discretePhaseResourceRequirementId?: number;
  processResourceRequirementId?: number;
  assignedResourceId: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  blockType: string;
  status: string;
  priority: number;
  requiredCapacity: string;
  isBottleneck: boolean;
  isCriticalPath: boolean;
  floatTime: number;
  notes?: string;
}

interface Operation {
  id: number;
  name: string;
  status: string;
  duration: number;
  productionOrderId: number;
  operationNumber?: string;
  description?: string;
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
  defaultScenarioId?: number;
  defaultResourceId?: number;
}

interface OperationSequencerWidgetProps {
  configuration?: SequencerConfig;
  isDesktop?: boolean;
}

const DraggableOperationCard = ({ 
  block, 
  operation,
  index, 
  onMove, 
  isCompact = true 
}: { 
  block: ResourceRequirementBlock;
  operation?: Operation;
  index: number; 
  onMove: (fromIndex: number, toIndex: number) => void;
  isCompact?: boolean;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'operation',
    item: () => ({ index, id: block.id }),
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
      case 'planned': return 'bg-blue-400';
      case 'confirmed': return 'bg-green-400';
      case 'pending': return 'bg-yellow-500';
      case 'delayed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
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
      <Card className={`border-l-4 cursor-move hover:bg-gray-50 transition-colors ${getStatusColor(block.status)}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">
                  {operation ? operation.name : `Block ${block.id} (${block.blockType})`}
                </h4>
                <div className="flex items-center gap-1">
                  {block.isBottleneck && (
                    <Zap className="w-3 h-3 text-red-500" title="Bottleneck" />
                  )}
                  {block.isCriticalPath && (
                    <AlertTriangle className="w-3 h-3 text-orange-500" title="Critical Path" />
                  )}
                  {block.floatTime > 0 && (
                    <TrendingUp className="w-3 h-3 text-green-500" title={`${block.floatTime}min float time`} />
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(block.scheduledStartTime, block.scheduledEndTime)}</span>
                <Badge variant="secondary" className="text-xs">
                  {block.status}
                </Badge>
                {block.priority > 1 && (
                  <Badge variant="outline" className="text-xs">
                    P{block.priority}
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                <div>Start: {new Date(block.scheduledStartTime).toLocaleString()}</div>
                {operation && (
                  <div className="text-xs text-blue-600 mt-1">
                    {operation.operationNumber && `Op ${operation.operationNumber} • `}
                    Order #{operation.productionOrderId}
                  </div>
                )}
              </div>
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
  const [selectedScenario, setSelectedScenario] = useState<string>(
    configuration.defaultScenarioId?.toString() || ""
  );
  const [selectedResource, setSelectedResource] = useState<string>(
    configuration.defaultResourceId?.toString() || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orderedBlocks, setOrderedBlocks] = useState<ResourceRequirementBlock[]>([]);
  const [hasReorder, setHasReorder] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scenarios
  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<ScheduleScenario[]>({
    queryKey: ["/api/schedule-scenarios"],
  });

  // Fetch resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Fetch resource requirement blocks for selected scenario
  const { data: blocks = [], isLoading: blocksLoading } = useQuery<ResourceRequirementBlock[]>({
    queryKey: ["/api/schedule-scenarios", selectedScenario, "blocks"],
    enabled: !!selectedScenario,
  });

  // Fetch discrete operations to get operation details
  const { data: discreteOperations = [], isLoading: operationsLoading } = useQuery<Operation[]>({
    queryKey: ["/api/discrete-operations"],
  });

  // Fetch discrete phase resource requirements to link blocks to operations
  const { data: discreteResourceRequirements = [], isLoading: requirementsLoading } = useQuery<any[]>({
    queryKey: ["/api/discrete-operation-phase-resource-requirements"],
  });

  // Mutation for updating resource requirement block order
  const updateBlockMutation = useMutation({
    mutationFn: async (data: { id: number; priority: number }) => {
      return apiRequest("PUT", `/api/resource-requirement-blocks/${data.id}`, { priority: data.priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-scenarios", selectedScenario, "blocks"] });
      toast({
        title: "Block order updated",
        description: "The operation sequence has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update block order. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create a map of resource requirements to operations for quick lookup
  const requirementToOperationMap = useMemo(() => {
    const map = new Map();
    discreteResourceRequirements.forEach(req => {
      map.set(req.id, req);
    });
    return map;
  }, [discreteResourceRequirements]);

  const operationMap = useMemo(() => {
    const map = new Map();
    discreteOperations.forEach(op => {
      map.set(op.id, op);
    });
    return map;
  }, [discreteOperations]);

  // Filter and enrich blocks with operation data
  const filteredBlocksWithOperations = useMemo(() => {
    let filtered = hasReorder && orderedBlocks.length > 0 ? [...orderedBlocks] : [...blocks];

    // Filter by resource
    if (selectedResource && selectedResource !== "all") {
      filtered = filtered.filter(block => block.assignedResourceId === parseInt(selectedResource));
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(block => block.status === selectedStatus);
    }

    // Sort by scheduled start time
    filtered.sort((a, b) => {
      return new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime();
    });

    // Enrich with operation data
    return filtered.map(block => {
      let operation = null;
      if (block.discretePhaseResourceRequirementId) {
        const requirement = requirementToOperationMap.get(block.discretePhaseResourceRequirementId);
        if (requirement && requirement.discreteOperationId) {
          operation = operationMap.get(requirement.discreteOperationId);
        }
      }
      return { block, operation };
    });
  }, [blocks, orderedBlocks, hasReorder, selectedResource, selectedStatus, requirementToOperationMap, operationMap]);

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (!configuration.allowReorder) return;
    
    const newBlocks = [...filteredBlocksWithOperations.map(item => item.block)];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    
    setOrderedBlocks(newBlocks);
    setHasReorder(true);
  };

  const handleSaveOrder = () => {
    if (!hasReorder) return;
    
    // Update block priorities (higher index = higher priority)
    orderedBlocks.forEach((block, index) => {
      updateBlockMutation.mutate({ id: block.id, priority: index + 1 });
    });
    
    setHasReorder(false);
  };

  const handleResetOrder = () => {
    setOrderedBlocks([]);
    setHasReorder(false);
  };

  if (scenariosLoading || resourcesLoading || operationsLoading || requirementsLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Show scenario selection if no scenario is selected
  if (!selectedScenario && scenarios.length > 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Operation Sequencer</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select Schedule Scenario</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose a scenario to view its scheduled operations.
                </p>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose scenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id.toString()}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state when no scenarios are available
  if (!scenarios || scenarios.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Operation Sequencer</h3>
          </div>
          
          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Schedule Scenarios Found</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  Create schedule scenarios using the Schedule Optimizer to view operations here.
                </p>
              </div>
            </div>
          </div>
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
                    disabled={updateBlockMutation.isPending}
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

          {/* Scenario and Filters */}
          <div className="space-y-2 mb-4">
            {/* Scenario Selection */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select scenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id.toString()}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resource and Status Filters */}
            {selectedScenario && (configuration.showResourceFilter || configuration.showStatusFilter) && (
              <div className="flex gap-2">
                {configuration.showResourceFilter && (
                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Resources</SelectItem>
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
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Operations List */}
          <div className="flex-1 overflow-y-auto">
            {!selectedScenario ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p>Select a scenario above to view operations</p>
              </div>
            ) : blocksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredBlocksWithOperations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No operations found for the selected scenario and filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBlocksWithOperations.map(({ block, operation }, index) => (
                  <DraggableOperationCard
                    key={block.id}
                    block={block}
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
              <span>
                {selectedScenario ? `${filteredBlocksWithOperations.length} operation blocks` : 'No scenario selected'}
              </span>
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