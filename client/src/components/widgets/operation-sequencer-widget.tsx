import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown, Play, Pause, Check, Clock, AlertTriangle, Settings, Columns, Wrench, X } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery } from '@tanstack/react-query';

interface OperationSequencerWidgetProps {
  configuration?: {
    view?: 'compact' | 'standard' | 'detailed';
    allowReorder?: boolean;
    showResourceFilter?: boolean;
    showStatusFilter?: boolean;
    showOptimizationFlags?: boolean;
    multiResourceView?: boolean;
  };
  isDesktop?: boolean;
}

interface Operation {
  id: number;
  orderNumber: string;
  operationName: string;
  resource: string;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: number[];
  isOptimized: boolean;
  setupTime: number;
}

const DraggableOperation: React.FC<{
  operation: Operation;
  index: number;
  moveOperation: (dragIndex: number, hoverIndex: number) => void;
  allowReorder: boolean;
  view: string;
}> = ({ operation, index, moveOperation, allowReorder, view }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'operation',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: allowReorder,
  });

  const [, drop] = useDrop({
    accept: 'operation',
    hover: (item: { index: number }, monitor) => {
      if (!allowReorder) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveOperation(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Play className="w-4 h-4 text-blue-500" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (view === 'compact') {
    return (
      <div
        ref={allowReorder ? (node) => { ref.current = node; drag(drop(node)); } : ref}
        className={`p-2 border-l-4 ${getPriorityColor(operation.priority)} rounded cursor-${allowReorder ? 'move' : 'default'} ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(operation.status)}
            <span className="font-medium text-sm">{operation.operationName}</span>
            {operation.isOptimized && (
              <Badge variant="outline" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {operation.estimatedDuration}h
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      ref={allowReorder ? (node) => { ref.current = node; drag(drop(node)); } : ref}
      className={`p-4 border-l-4 ${getPriorityColor(operation.priority)} cursor-${allowReorder ? 'move' : 'default'} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(operation.status)}
            <div>
              <div className="font-medium">{operation.operationName}</div>
              <div className="text-sm text-muted-foreground">{operation.orderNumber}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {operation.isOptimized && (
              <Badge variant="outline" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs capitalize">
              {operation.priority}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Resource:</span>
            <div className="font-medium">{operation.resource}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="font-medium">{operation.estimatedDuration}h</div>
          </div>
        </div>

        {view === 'detailed' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Setup Time:</span>
              <div className="font-medium">{operation.setupTime}h</div>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="font-medium capitalize">{operation.status}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function OperationSequencerWidget({ 
  configuration = {}, 
  isDesktop = true 
}: OperationSequencerWidgetProps) {
  const {
    view = 'standard',
    allowReorder = true,
    showResourceFilter = true,
    showStatusFilter = true,
    showOptimizationFlags = true,
    multiResourceView = false
  } = configuration;

  // Fetch real operations data from the API
  const { data: apiOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations']
  });

  // Transform API data to match the expected format
  const transformedOperations = React.useMemo(() => {
    if (!apiOperations || !Array.isArray(apiOperations)) return [];
    
    return apiOperations.map((op: any) => ({
      id: op.id,
      orderNumber: `OP-${op.id}`,
      operationName: op.operationName || `Operation ${op.id}`,
      resource: `Work Center ${op.workCenterId || 1}`,
      estimatedDuration: Math.round((op.standardDuration || 60) / 60 * 100) / 100, // Convert minutes to hours
      actualDuration: op.actualDuration ? Math.round(op.actualDuration / 60 * 100) / 100 : undefined,
      status: op.status === 'scheduled' ? 'pending' : 
              op.status === 'in_progress' ? 'in-progress' : 
              op.status || 'pending' as 'pending' | 'in-progress' | 'completed' | 'blocked',
      priority: op.priority === 1 ? 'critical' : 
                op.priority <= 3 ? 'high' : 
                op.priority <= 7 ? 'medium' : 'low' as 'low' | 'medium' | 'high' | 'critical',
      dependencies: [], // Could be enhanced with actual dependency data
      isOptimized: op.priority <= 5, // Mark higher priority operations as optimized
      setupTime: 0.25 // Default setup time
    }));
  }, [apiOperations]);

  const [operations, setOperations] = useState<Operation[]>([]);

  // Update local state when API data changes
  React.useEffect(() => {
    if (transformedOperations.length > 0) {
      setOperations(transformedOperations);
    }
  }, [transformedOperations]);

  const [filters, setFilters] = useState({
    resource: 'all',
    status: 'all'
  });

  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isMultiResourceMode, setIsMultiResourceMode] = useState(multiResourceView);

  const moveOperation = (dragIndex: number, hoverIndex: number) => {
    if (!allowReorder) return;
    
    setOperations((prevOperations) => {
      const newOperations = [...prevOperations];
      const draggedOperation = newOperations[dragIndex];
      newOperations.splice(dragIndex, 1);
      newOperations.splice(hoverIndex, 0, draggedOperation);
      return newOperations;
    });
  };

  const filteredOperations = operations.filter(op => {
    if (filters.resource !== 'all' && op.resource !== filters.resource) return false;
    if (filters.status !== 'all' && op.status !== filters.status) return false;
    return true;
  });

  const uniqueResources = [...new Set(operations.map(op => op.resource))];
  const uniqueStatuses = [...new Set(operations.map(op => op.status))];

  // Group operations by resource for multi-resource view
  const operationsByResource = React.useMemo(() => {
    const grouped: Record<string, Operation[]> = {};
    operations.forEach(op => {
      if (!grouped[op.resource]) {
        grouped[op.resource] = [];
      }
      grouped[op.resource].push(op);
    });
    return grouped;
  }, [operations]);

  // Handle resource selection for multi-resource view
  const handleResourceToggle = (resource: string) => {
    setSelectedResources(prev => 
      prev.includes(resource) 
        ? prev.filter(r => r !== resource)
        : [...prev, resource]
    );
  };

  if (operationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading operations...</p>
        </div>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No operations found</p>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isMultiResourceMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsMultiResourceMode(!isMultiResourceMode)}
              className="flex items-center gap-2"
            >
              <Columns className="w-4 h-4" />
              Multi-Resource View
            </Button>
          </div>
        </div>

        {/* Multi-Resource Selector (only shown in multi-resource mode) */}
        {isMultiResourceMode && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4" />
              <span className="text-sm font-medium">Select Resources to Compare:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueResources.map(resource => (
                <div key={resource} className="flex items-center gap-2">
                  <Checkbox
                    id={`resource-${resource}`}
                    checked={selectedResources.includes(resource)}
                    onCheckedChange={() => handleResourceToggle(resource)}
                  />
                  <label 
                    htmlFor={`resource-${resource}`}
                    className="text-sm cursor-pointer"
                  >
                    {resource}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {operationsByResource[resource]?.length || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Resource Filters (only shown in single resource mode) */}
        {!isMultiResourceMode && (showResourceFilter || showStatusFilter) && (
          <div className="flex flex-wrap items-center gap-2">
            {showResourceFilter && (
              <Select 
                value={filters.resource} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showStatusFilter && (
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showOptimizationFlags && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  {operations.filter(op => op.isOptimized).length} Optimized
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        {isMultiResourceMode ? (
          /* Multi-Resource Side-by-Side View */
          <div className="flex h-full min-h-0 max-h-[60vh] overflow-hidden">
            {selectedResources.length === 0 ? (
              <div className="flex-1 p-8">
                <Card>
                  <div className="p-6 text-center">
                    <Columns className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-2">No resources selected</p>
                    <p className="text-sm text-gray-400">Select resources above to see operations side by side</p>
                  </div>
                </Card>
              </div>
            ) : (
              selectedResources.map(resource => {
                const resourceOperations = operationsByResource[resource] || [];
                
                return (
                  <div key={resource} className="flex-1 min-w-64 border-r border-gray-200 last:border-r-0">
                    {/* Resource Header */}
                    <div className="bg-gray-50 border-b border-gray-200 p-3 sticky top-0 z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-sm text-gray-900">
                              {resource}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {resourceOperations.length} ops
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResourceToggle(resource)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Resource Operations */}
                    <div className="p-2 space-y-2 h-full overflow-y-auto">
                      {resourceOperations.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No operations</p>
                        </div>
                      ) : (
                        resourceOperations.map((operation, index) => (
                          <DraggableOperation
                            key={operation.id}
                            operation={operation}
                            index={index}
                            moveOperation={moveOperation}
                            allowReorder={allowReorder}
                            view={view}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Single Resource List View */
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredOperations.map((operation, index) => (
              <DraggableOperation
                key={operation.id}
                operation={operation}
                index={index}
                moveOperation={moveOperation}
                allowReorder={allowReorder}
                view={view}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Operations:</span>
              <div className="font-medium">
                {isMultiResourceMode 
                  ? selectedResources.reduce((sum, resource) => sum + (operationsByResource[resource]?.length || 0), 0)
                  : filteredOperations.length
                }
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Duration:</span>
              <div className="font-medium">
                {isMultiResourceMode 
                  ? selectedResources.reduce((sum, resource) => 
                      sum + (operationsByResource[resource]?.reduce((opSum, op) => opSum + op.estimatedDuration, 0) || 0), 0
                    )
                  : filteredOperations.reduce((sum, op) => sum + op.estimatedDuration, 0)
                }h
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}