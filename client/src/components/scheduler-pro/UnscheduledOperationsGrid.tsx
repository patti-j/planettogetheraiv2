import React, { useEffect, useRef, useMemo } from 'react';
import { BryntumGrid } from '@bryntum/schedulerpro-react';
import { useQuery } from '@tanstack/react-query';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

interface UnscheduledOperationsGridProps {
  onOperationDragStart?: (operation: any) => void;
  onOperationDrag?: (operation: any, targetResource: any) => void;
  onOperationDrop?: (operation: any, targetResource: any, startDate: Date) => void;
  schedulerRef?: React.RefObject<any>;
}

const UnscheduledOperationsGrid: React.FC<UnscheduledOperationsGridProps> = ({
  onOperationDragStart,
  onOperationDrag,
  onOperationDrop,
  schedulerRef
}) => {
  const gridRef = useRef<any>(null);

  // Fetch unscheduled operations
  const { data: ptOperations, isLoading } = useQuery({
    queryKey: ['/api/pt-operations']
  });

  // Filter for unscheduled operations only (following Jim's corrections)
  const unscheduledOperations = useMemo(() => {
    if (!Array.isArray(ptOperations)) return [];
    
    return ptOperations
      .filter((op: any) => 
        op.assignmentType === 'unscheduled' || 
        !op.isActuallyScheduled ||
        !op.resourceBlockId
      )
      .map((op: any) => ({
        id: op.id,
        name: op.operationName,
        jobName: op.jobName,
        duration: op.duration || op.standardDuration || 1,
        durationUnit: 'hour',
        priority: op.priority || 5,
        status: op.status || 'planned',
        description: op.description || '',
        setupTime: op.setupTime || 0,
        runTime: op.runTime || op.standardDuration || 1,
        postProcessingTime: op.postProcessingTime || 0,
        // Required capabilities for resource matching
        requiredCapabilities: op.requiredCapabilities || [],
        // Visual indicators
        iconCls: getOperationIcon(op),
        cls: `priority-${op.priority || 5} status-${op.status || 'planned'}`
      }));
  }, [ptOperations]);

  function getOperationIcon(operation: any): string {
    switch (operation.operationType) {
      case 'milling': return 'b-fa b-fa-cog';
      case 'assembly': return 'b-fa b-fa-wrench';
      case 'quality': return 'b-fa b-fa-check-circle';
      case 'packaging': return 'b-fa b-fa-box';
      default: return 'b-fa b-fa-tasks';
    }
  }

  // Configure grid following Bryntum patterns
  const gridConfig = {
    data: unscheduledOperations,
    
    columns: [
      {
        text: 'Operation',
        field: 'name',
        width: 180,
        htmlEncode: false,
        renderer: ({ record }: any) => 
          `<i class="${record.iconCls}"></i> ${record.name}`
      },
      {
        text: 'Job',
        field: 'jobName',
        width: 120
      },
      {
        text: 'Duration',
        field: 'duration',
        width: 80,
        htmlEncode: false,
        renderer: ({ record }: any) => 
          `${record.duration}${record.durationUnit === 'hour' ? 'h' : 'd'}`
      },
      {
        text: 'Priority',
        field: 'priority',
        width: 80,
        renderer: ({ value }: any) => {
          const badges = {
            1: '🔴 Critical',
            2: '🔴 Critical', 
            3: '🟠 High',
            4: '🟠 High',
            5: '🟡 Medium',
            6: '🟡 Medium',
            7: '🟢 Low',
            8: '🟢 Low',
            9: '🟢 Low',
            10: '🟢 Low'
          };
          return badges[value as keyof typeof badges] || '🟡 Medium';
        }
      },
      {
        text: 'Status',
        field: 'status',
        width: 100,
        renderer: ({ value }: any) => {
          const statusMap = {
            planned: '📋 Planned',
            ready: '✅ Ready',
            on_hold: '⏸️ Hold',
            cancelled: '❌ Cancelled'
          };
          return statusMap[value as keyof typeof statusMap] || '📋 Planned';
        }
      }
    ],
    
    features: {
      stripe: true,
      sort: true,
      filter: true,
      cellTooltip: {
        template: ({ record }: any) => `
          <div class="operation-details">
            <h4>${record.jobName}: ${record.name}</h4>
            <p><strong>Total Duration:</strong> ${record.duration} hours</p>
            <p><strong>Setup:</strong> ${record.setupTime}h | <strong>Run:</strong> ${record.runTime}h | <strong>Post:</strong> ${record.postProcessingTime}h</p>
            <p><strong>Priority:</strong> ${record.priority}/10</p>
            ${record.requiredCapabilities?.length ? `<p><strong>Requires:</strong> ${record.requiredCapabilities.join(', ')}</p>` : ''}
            <p class="drag-hint">💡 Drag to scheduler to assign resource and time</p>
          </div>
        `
      }
    },
    
    // Enable row selection for better UX
    selectionMode: {
      row: true,
      multiSelect: false
    },
    
    // Row styling based on priority and status
    getRowClass: ({ record }: any) => {
      const classes = [`priority-${record.priority}`, `status-${record.status}`];
      if (record.priority <= 3) classes.push('high-priority');
      if (record.status === 'on_hold') classes.push('on-hold');
      return classes.join(' ');
    }
  };

  // Initialize drag functionality when grid is ready
  useEffect(() => {
    if (gridRef.current && schedulerRef?.current) {
      const grid = gridRef.current;
      const scheduler = schedulerRef.current;
      
      // Set up drag-from-grid functionality following Bryntum documentation
      const dragHelper = new (window as any).bryntum.schedulerpro.DragHelper({
        cloneTarget: true,
        autoSizeClonedTarget: false,
        dropTargetSelector: '.b-timeline-subgrid',
        targetSelector: '.b-grid-row:not(.b-group-row)',
        
        onDragStart: ({ context }: any) => {
          const task = grid.getRecordFromElement(context.grabbed);
          context.task = task;
          
          // Notify parent component
          onOperationDragStart?.(task);
          
          // Enable scrolling in scheduler
          scheduler.enableScrollingCloseToEdges(scheduler.timeAxisSubGrid);
          
          // Disable tooltips during drag
          if (scheduler.features.eventTooltip) {
            scheduler.features.eventTooltip.disabled = true;
          }
        },
        
        onDrag: ({ event, context }: any) => {
          const { task } = context;
          const coordinate = scheduler.getCoordinateFromDate(new Date());
          const startDate = scheduler.getDateFromCoordinate(coordinate, 'round', false);
          const resource = context.target && scheduler.resolveResourceRecord(context.target, [event.offsetX, event.offsetY]);
          
          // Validate drop location
          context.valid = Boolean(startDate && resource) && 
            (scheduler.allowOverlap || scheduler.isDateRangeAvailable(
              startDate, 
              new Date(startDate.getTime() + task.duration * 60 * 60 * 1000), 
              null, 
              resource
            ));
          
          // Save resource for drop handling
          context.resource = resource;
          
          // Notify parent component
          onOperationDrag?.(task, resource);
        },
        
        onDrop: ({ context }: any) => {
          const { task, target, resource, valid, element } = context;
          
          if (valid && target && resource) {
            const coordinate = (window as any).bryntum.schedulerpro.DomHelper.getTranslateX(element);
            const startDate = scheduler.getDateFromCoordinate(coordinate, 'round', false);
            
            if (startDate) {
              // Remove from unscheduled grid
              grid.store.remove(task);
              
              // Notify parent component to handle the assignment
              onOperationDrop?.(task, resource, startDate);
            }
          }
          
          // Cleanup
          scheduler.disableScrollingCloseToEdges(scheduler.timeAxisSubGrid);
          if (scheduler.features.eventTooltip) {
            scheduler.features.eventTooltip.disabled = false;
          }
        },
        
        createProxy: (element: any) => {
          const task = grid.getRecordFromElement(element);
          const proxy = document.createElement('div');
          const durationInPx = scheduler.timeAxisViewModel.getDistanceForDuration(task.duration * 60 * 60 * 1000);
          
          // Create scheduler event-like proxy
          proxy.classList.add('b-sch-event-wrap', 'b-sch-event', 'b-unassigned-class', `b-sch-${scheduler.mode}`);
          proxy.innerHTML = `
            <div class="b-sch-event b-has-content b-sch-event-withicon">
              <div class="b-sch-event-content">
                <i class="${task.iconCls}"></i> ${task.name}
              </div>
            </div>
          `;
          
          proxy.style.height = `${scheduler.rowHeight - (2 * scheduler.resourceMargin)}px`;
          proxy.style.width = `${durationInPx}px`;
          
          return proxy;
        }
      });
      
      // Store reference for cleanup
      (grid as any)._dragHelper = dragHelper;
    }
  }, [gridRef.current, schedulerRef?.current, onOperationDragStart, onOperationDrag, onOperationDrop]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Loading unscheduled operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="p-3 border-b bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
        <h3 className="font-semibold text-sm text-orange-800 dark:text-orange-200">
          📋 Unscheduled Operations ({unscheduledOperations.length})
        </h3>
        <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
          💡 Drag operations to the scheduler to assign resources and schedule
        </p>
      </div>
      
      <BryntumGrid
        ref={gridRef}
        {...gridConfig}
        height="100%"
      />
    </div>
  );
};

export default UnscheduledOperationsGrid;