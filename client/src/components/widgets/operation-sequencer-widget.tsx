import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Play, Pause, Check, Clock, AlertTriangle, Settings } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface OperationSequencerWidgetProps {
  configuration?: {
    view?: 'compact' | 'standard' | 'detailed';
    allowReorder?: boolean;
    showResourceFilter?: boolean;
    showStatusFilter?: boolean;
    showOptimizationFlags?: boolean;
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
    hover: (item: { index: number }) => {
      if (!allowReorder) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      moveOperation(dragIndex, hoverIndex);
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
        ref={allowReorder ? (node) => drag(drop(node)) : undefined}
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
      ref={allowReorder ? (node) => drag(drop(node)) : undefined}
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
    showOptimizationFlags = true
  } = configuration;

  const [operations, setOperations] = useState<Operation[]>([
    {
      id: 1,
      orderNumber: "PO-2024-001",
      operationName: "Material Preparation",
      resource: "Prep Station 1",
      estimatedDuration: 2,
      status: 'completed',
      priority: 'high',
      dependencies: [],
      isOptimized: true,
      setupTime: 0.5
    },
    {
      id: 2,
      orderNumber: "PO-2024-001",
      operationName: "Mixing Process",
      resource: "Mixer A",
      estimatedDuration: 4,
      status: 'in-progress',
      priority: 'high',
      dependencies: [1],
      isOptimized: true,
      setupTime: 1
    },
    {
      id: 3,
      orderNumber: "PO-2024-002",
      operationName: "Quality Check",
      resource: "QC Lab",
      estimatedDuration: 1,
      status: 'pending',
      priority: 'medium',
      dependencies: [2],
      isOptimized: false,
      setupTime: 0.25
    },
    {
      id: 4,
      orderNumber: "PO-2024-002",
      operationName: "Packaging",
      resource: "Pack Line 1",
      estimatedDuration: 3,
      status: 'blocked',
      priority: 'critical',
      dependencies: [3],
      isOptimized: true,
      setupTime: 0.75
    }
  ]);

  const [filters, setFilters] = useState({
    resource: 'all',
    status: 'all'
  });

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {/* Filters */}
        {(showResourceFilter || showStatusFilter) && (
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

        {/* Operations List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
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

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Operations:</span>
              <div className="font-medium">{filteredOperations.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Duration:</span>
              <div className="font-medium">
                {filteredOperations.reduce((sum, op) => sum + op.estimatedDuration, 0)}h
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}