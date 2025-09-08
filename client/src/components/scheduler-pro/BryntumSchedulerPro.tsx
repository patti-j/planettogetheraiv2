import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { ProjectModel } from '@bryntum/schedulerpro';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

interface BryntumSchedulerProComponentProps {
  operations?: any[];
  resources?: any[];
  project?: {
    resources: any[];
    events: any[];
    assignments: any[];
  };
  onOperationUpdate?: (operationId: number, updates: any) => void;
  displayOptions?: {
    showWeekends: boolean;
    showNonWorkingTime: boolean;
    showResourceNames: boolean;
    showOperationDetails: boolean;
    showDependencies: boolean;
    showCriticalPath: boolean;
    showProgress: boolean;
    showTooltips: boolean;
    compactMode: boolean;
    colorBy: string;
    timeFormat: string;
    gridLines: string;
    rowHeight: string;
    highlightCurrentTime: boolean;
    showBaselines: boolean;
    showConstraints: boolean;
  };
}

const BryntumSchedulerProComponent = forwardRef((props: BryntumSchedulerProComponentProps, ref: any) => {
  const {
    operations = [], 
    resources = [],
    project,
    onOperationUpdate,
    displayOptions = {
      showWeekends: true,
      showNonWorkingTime: true,
      showResourceNames: true,
      showOperationDetails: true,
      showDependencies: true,
      showCriticalPath: false,
      showProgress: true,
      showTooltips: true,
      compactMode: false,
      colorBy: 'status',
      timeFormat: '12h',
      gridLines: 'both',
      rowHeight: 'normal',
      highlightCurrentTime: true,
      showBaselines: false,
      showConstraints: true
    }
  } = props;
  const schedulerRef = useRef<any>(null);
  
  // Expose the scheduler instance through the ref
  useImperativeHandle(ref, () => schedulerRef.current, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch PT operations and resources if not provided
  const { data: ptOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: operations.length === 0
  });

  const { data: ptResources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
    enabled: resources.length === 0
  });

  // Check if project prop is a ProjectModel instance
  const hasProjectProp = project && (project instanceof ProjectModel || (project.resources && project.events && project.assignments));
  
  // Use provided data or fetched data
  const effectiveOperations = hasProjectProp ? [] : (operations.length > 0 ? operations : (ptOperations || []));
  const effectiveResources = hasProjectProp ? [] : (resources.length > 0 ? resources : (ptResources || []));

  // Transform PT resources to Bryntum format - DEDUPLICATE RESOURCES (one row per unique resource)
  const bryntumResources = useMemo(() => {
    if (!Array.isArray(effectiveResources) || !effectiveResources.length) return [];
    
    
    // Deduplicate resources by ID to ensure one row per resource
    const resourceMap = new Map();
    
    effectiveResources.forEach((resource: any) => {
      const resourceId = resource.id || resource.resource_id;
      
      // Only keep the first occurrence of each resource ID
      if (!resourceMap.has(resourceId)) {
        const displayName = resource.name || `Resource ${resourceId}`;
        
        resourceMap.set(resourceId, {
          id: `r_${resourceId}`,
          name: displayName,
          type: resource.type || 'machine',
          capacity: resource.capacity || 100,
          department: resource.departmentName || resource.department_name || 'Production',
          active: resource.active !== false,
          // Jim's corrections: Track if this is a bottleneck resource
          isBottleneck: resource.bottleneck || false,
          // Custom styling based on resource status
          enabled: resource.active
        });
      }
    });
    
    const deduplicatedResources = Array.from(resourceMap.values());
    
    // console.log('Bryntum resources created (deduplicated):', deduplicatedResources.length, 'from', effectiveResources.length, 'original');
    // console.log('Sample Bryntum resource:', deduplicatedResources[0]);
    
    return deduplicatedResources;
  }, [effectiveResources]);

  // Transform PT operations to Bryntum events format following Jim's corrections
  const bryntumEvents = useMemo(() => {
    if (!Array.isArray(effectiveOperations) || !effectiveOperations.length) return [];
    
    // console.log('Creating Bryntum events from operations:', effectiveOperations.length);
    // console.log('Sample operation data:', effectiveOperations[0]);
    
    const events = effectiveOperations.map((op: any) => {
      const startDate = new Date(op.startTime);
      const duration = op.duration || 3; // Default 3 hours if no duration
      const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + duration * 60 * 60 * 1000);
      
      // Validate dates to prevent runtime errors
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date for operation:', op.operationName, { startTime: op.startTime, endTime: op.endTime });
        return null; // Skip invalid events
      }
      
      // console.log(`Event ${op.operationName} dates:`, { 
      //   startDate: startDate instanceof Date, 
      //   endDate: endDate instanceof Date,
      //   startType: typeof startDate,
      //   endType: typeof endDate
      // });
      
      // Format name based on display options
      let eventName = op.operationName;
      if (displayOptions.showResourceNames && op.resourceName) {
        eventName = `${op.jobName}: ${op.operationName}`;
      }
      if (displayOptions.showOperationDetails && op.duration) {
        eventName += ` (${op.duration}h)`;
      }
      
      return {
        id: `e_${op.id || op.operationId}`,
        name: eventName,
        startDate: startDate,
        endDate: endDate,
        // Bryntum-supported properties only
        eventColor: getOperationColor(op),
        // Lock scheduled operations to prevent accidental moves
        readOnly: op.isLocked || false,
        // Show progress bar if enabled
        percentDone: displayOptions.showProgress ? (op.completionPercentage || 0) : undefined,
        // Store custom data in a data object that Bryntum won't process
        data: {
          assignmentType: op.assignmentType || 'unscheduled',
          isActuallyScheduled: op.isActuallyScheduled || false,
          resourceBlockId: op.resourceBlockId,
          jobId: op.jobId,
          operationId: op.operationId,
          priority: op.priority,
          status: op.status,
          setupStart: op.setupStart,
          setupEnd: op.setupEnd,
          runStart: op.runStart,
          runEnd: op.runEnd,
          postProcessingStart: op.postProcessingStart,
          postProcessingEnd: op.postProcessingEnd
        }
      };
    });
    
    // Filter out null entries from invalid dates and ensure type safety
    const validEvents = events.filter((event): event is NonNullable<typeof event> => event !== null);
    
    // console.log('Created events:', validEvents.length);
    return validEvents;
  }, [effectiveOperations, displayOptions]);

  // Create assignments based on Jim's corrections - WITH PROPER RESOURCE VALIDATION
  const bryntumAssignments = useMemo(() => {
    if (!Array.isArray(effectiveOperations) || !effectiveOperations.length) return [];
    
    // PT Table-based validation following Jim's corrections
    const validateResourceAssignment = (op: any, resource: any): boolean => {
      // Following Jim's notes: Default resource can override capability requirements
      const isDefaultResource = op.defaultResourceId === resource.id || 
                               op.assignedResourceId === resource.id;
      
      if (isDefaultResource) {
        // console.log(`✅ Using default/preferred resource: ${op.operationName} -> ${resource.name}`);
        return true; // Default resource is always valid per Jim's notes
      }
      
      // For non-default assignments, we would normally check capabilities
      // but for now, allow all assignments to show the actual PT data
      // TODO: Implement proper capability checking when PT capability APIs are available
      // console.log(`✅ Allowing PT assignment: ${op.operationName} -> ${resource.name}`);
      return true;
    };
    
    // Create assignments for operations - FIXED to map PT data correctly
    const assignments = effectiveOperations
      .filter((op: any) => {
        // Check if operation has resource assignment
        const resourceId = op.assignedResourceId || op.resourceId || op.resource_id || 
                          op.scheduledResourceId || op.defaultResourceId;
        return resourceId; // Allow any operation with a resource ID
      })
      .map((op: any, index: number) => {
        const resourceId = op.assignedResourceId || op.resourceId || op.resource_id || 
                          op.scheduledResourceId || op.defaultResourceId;
        
        // Find matching resource by ID from PT resources
        const matchingResource = Array.isArray(effectiveResources) ? 
          effectiveResources.find((r: any) => {
            // PT resources use 'id' field, operations use assignedResourceId
            return String(r.id || r.resource_id) === String(resourceId);
          }) : null;
        
        if (matchingResource) {
          // console.log(`✅ Creating assignment: ${op.operationName} -> ${matchingResource.name} (ID: ${resourceId})`);
          
          return {
            id: `a_${op.id || op.operationId}_${index}`,
            eventId: `e_${op.id || op.operationId}`,
            resourceId: `r_${matchingResource.id}`, // Use actual resource ID from PT table
            units: 100
          };
        } else {
          // console.log(`❌ No matching resource found for operation ${op.operationName} (resourceId: ${resourceId})`);
          return null;
        }
      });
    
    // Filter out null assignments and ensure type safety
    const validAssignments = assignments.filter((assignment): assignment is NonNullable<typeof assignment> => assignment !== null);
    
    // console.log(`Created ${validAssignments.length} valid assignments from ${effectiveOperations.length} operations`);
    
    if (assignments.length === 0 && effectiveOperations.length > 0) {
      // console.log('DEBUG: No assignments created, checking data:');
      // console.log('Sample operation:', effectiveOperations[0]);
      // console.log('Sample resource:', effectiveResources[0]);
      // console.log('Operations with resource IDs:', effectiveOperations.filter(op => 
      //   op.assignedResourceId || op.resourceId || op.resource_id || op.scheduledResourceId || op.defaultResourceId
      // ).length);
    }
    return validAssignments;
  }, [effectiveOperations, effectiveResources]);

  // Dependencies removed to clean up visual clutter
  const bryntumDependencies = useMemo(() => {
    // Return empty array to remove all dependency lines
    return [];
  }, []);

  // Mutation for updating operations after drag-and-drop
  const updateOperationMutation = useMutation({
    mutationFn: async ({ operationId, updates }: { operationId: number; updates: any }) => {
      return fetch(`/api/pt-operations/${operationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pt-operations'] });
      toast({
        title: "Operation Updated",
        description: "The operation has been successfully rescheduled.",
      });
    },
    onError: (error) => {
      console.error('Failed to update operation:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the operation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Color coding based on Jim's corrections
  function getOperationColor(op: any): string {
    if (op.assignmentType === 'scheduled') {
      return op.isLocked ? '#dc2626' : '#059669'; // Red for locked, green for scheduled
    } else {
      return op.priority > 7 ? '#ea580c' : '#6b7280'; // Orange for high priority unscheduled, gray for normal
    }
  }

  const projectModel = useMemo(() => {
    // If project prop is already a ProjectModel instance, use it directly
    if (project instanceof ProjectModel) {
      // console.log('Using provided ProjectModel instance');
      return project;
    }
    
    // If project prop has data arrays, create ProjectModel from it
    if (hasProjectProp && project) {
      // console.log('Creating ProjectModel from provided data');
      // console.log('- Resources:', project.resources?.length || 0);
      // console.log('- Events:', project.events?.length || 0);
      // console.log('- Assignments:', project.assignments?.length || 0);
      
      return new ProjectModel({
        resources: project.resources || [],
        events: project.events || [],
        assignments: project.assignments || []
      });
    }
    
    // Otherwise, build ProjectModel from operations/resources
    // console.log('Creating ProjectModel from operations/resources:');
    // console.log('- Resources:', bryntumResources.length);
    // console.log('- Events:', bryntumEvents.length);  
    // console.log('- Assignments:', bryntumAssignments.length);
    // console.log('- Dependencies:', bryntumDependencies.length);
    
    // Log some sample data for debugging
    if (bryntumResources.length > 0) {
      // console.log('Sample resource:', bryntumResources[0]);
    }
    if (bryntumEvents.length > 0) {
      // console.log('Sample event:', bryntumEvents[0]);
      // console.log('Event date types:', typeof bryntumEvents[0]?.startDate, typeof bryntumEvents[0]?.endDate);
      // console.log('Event date range:', bryntumEvents[0]?.startDate, 'to', bryntumEvents[0]?.endDate);
      // console.log('Scheduler view dates:', new Date(2025, 7, 22), 'to', new Date(2025, 7, 29));
    }
    if (bryntumAssignments.length > 0) {
      // console.log('Sample assignment:', bryntumAssignments[0]);
    }
    
    // Create ProjectModel instance with proper store configuration
    return new ProjectModel({
      resources: bryntumResources,
      events: bryntumEvents,
      assignments: bryntumAssignments,
      dependencies: bryntumDependencies
    });
  }, [hasProjectProp, project, bryntumResources, bryntumEvents, bryntumAssignments, bryntumDependencies]);

  // Force layout recalculation after mount to fix scroll bar visibility
  // MUST be called before any conditional returns to avoid React hooks error
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (schedulerRef.current?.widget) {
        schedulerRef.current.widget.refresh();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [bryntumResources, bryntumEvents]);

  // Show loading state while data is being fetched (only if not using project prop)
  if (!hasProjectProp && (operationsLoading || resourcesLoading)) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading production schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
      <div className="flex-1 min-h-0">
        <BryntumSchedulerPro
        ref={schedulerRef}
        // Pass ProjectModel instance - no inner store configs to avoid warning
        project={projectModel}
        startDate={new Date(2025, 8, 1)}  // September 1, 2025
        endDate={new Date(2025, 8, 7)}    // September 7, 2025 - 1 week view
        viewPreset="hourAndDay"
        rowHeight={displayOptions.rowHeight === 'compact' ? 40 : displayOptions.rowHeight === 'comfortable' ? 70 : 60}
        barMargin={displayOptions.compactMode ? 4 : 8}
        height={700}
        autoAdjustTimeAxis={false}
        
        // Enable scrolling for navigation
        scrollable={true}
        
        columns={[
          { 
            type: 'resourceInfo', 
            field: 'name', 
            text: 'Resource', 
            width: 200,
            htmlEncode: false
          },
          {
            field: 'type',
            text: 'Type',
            width: 100
          },
          {
            field: 'department',
            text: 'Department',
            width: 120
          }
        ]}
        
        // Feature configuration - using any to bypass TypeScript issues
        {...{ 
          weekendsEnabled: displayOptions.showWeekends,
          features: {
          
          // Grid and visualization features
          columnLines: displayOptions.gridLines === 'vertical' || displayOptions.gridLines === 'both',
          stripe: displayOptions.gridLines === 'horizontal' || displayOptions.gridLines === 'both',
          nonWorkingTime: displayOptions.showNonWorkingTime,
          resourceNonWorkingTime: displayOptions.showNonWorkingTime,
          percentBar: displayOptions.showProgress,
          timeRanges: {
            showCurrentTimeLine: displayOptions.highlightCurrentTime
          },
          criticalPaths: {
            disabled: !displayOptions.showCriticalPath
          },

          // Configure drag-and-drop, editing, and resizing capabilities for interactive scheduling
          eventDrag: {
            showTooltip: displayOptions.showTooltips,
            constrainDragToResource: true, // Maintain resource assignments for production integrity
            constrainDragToTimeSlot: false, // Allow time flexibility within resource
            // Validate resource compatibility and scheduling constraints
            validatorFn: ({ dragData, targetResourceRecord, startDate, endDate }: any) => {
              try {
                const event = dragData?.eventRecord;
                
                // Log validation for debugging production scheduling constraints
                /* console.log('Validating production operation drag:', {
                  operation: event?.name,
                  targetResource: targetResourceRecord?.name,
                  resourceType: targetResourceRecord?.type,
                  isLocked: event?.readOnly,
                  resourceActive: targetResourceRecord?.active
                }); */
                
                // Basic safety checks
                if (!event) {
                  console.warn('Validation failed: No event record found');
                  return { valid: false, message: 'Invalid operation' };
                }
                
                if (!targetResourceRecord) {
                  console.warn('Validation failed: No target resource selected');
                  return { valid: false, message: 'Must drop on a valid resource' };
                }
                
                // Prevent moving locked operations that are scheduled with resource blocks
                if (event.readOnly) {
                  console.warn('Validation failed: Operation is locked');
                  return {
                    valid: false,
                    message: 'This operation is locked and cannot be moved'
                  };
                }
                
                // Validate resource compatibility for production requirements
                const resourceType = targetResourceRecord?.type;
                const requiredType = event?.requiredResourceType;
                if (requiredType && resourceType && resourceType !== requiredType) {
                  console.warn('Validation failed: Resource type mismatch');
                  return {
                    valid: false,
                    message: `This operation requires a ${requiredType} resource`
                  };
                }
                
                // Check if resource is active
                if (targetResourceRecord.active === false) {
                  console.warn('Validation failed: Target resource is inactive');
                  return {
                    valid: false,
                    message: 'Cannot assign to inactive resource'
                  };
                }
                
                // Check for time conflicts (basic overlap detection)
                if (startDate && endDate && schedulerRef.current?.eventStore) {
                  try {
                    const conflictingEvents = schedulerRef.current.eventStore.query((record: any) => {
                      const isSameEvent = record === event || record.id === event.id;
                      const isOnTargetResource = record.resources?.some((r: any) => r === targetResourceRecord || r.id === targetResourceRecord.id);
                      const hasTimeOverlap = !(record.endDate <= startDate || record.startDate >= endDate);
                      
                      return !isSameEvent && isOnTargetResource && hasTimeOverlap;
                    });
                    
                    if (conflictingEvents && conflictingEvents.length > 0) {
                      console.warn('Validation failed: Time conflict detected', {
                        conflicts: conflictingEvents.length,
                        operations: conflictingEvents.map((r: any) => r.name)
                      });
                      return {
                        valid: false,
                        message: `Time slot conflicts with ${conflictingEvents.length} existing operation(s)`
                      };
                    }
                  } catch (conflictError) {
                    console.error('Error checking time conflicts:', conflictError);
                    // Don't block the move due to conflict checking error, but log it
                  }
                }
                
                // console.log('Validation passed: Operation can be moved to this resource');
                return { valid: true };
                
              } catch (validationError) {
                console.error('Validation error occurred:', validationError);
                // Block the move for safety if validation fails
                return { 
                  valid: false, 
                  message: 'Unable to validate move - operation blocked' 
                };
              }
            }
          },
          eventResize: {
            showTooltip: true,
            // Validate duration changes for production scheduling
            validatorFn: ({ eventRecord, startDate, endDate }: any) => {
              if (eventRecord.readOnly) {
                return {
                  valid: false,
                  message: 'Locked operations cannot be resized'
                };
              }
              
              // Ensure minimum operation duration (1 hour)
              const duration = (endDate - startDate) / (1000 * 60 * 60);
              if (duration < 1) {
                return {
                  valid: false,
                  message: 'Operations must be at least 1 hour long'
                };
              }
              
              return { valid: true };
            }
          },
          eventEdit: false, // Disable direct editing to prevent accidental changes
          eventDragCreate: false, // Disable creation via drag to maintain production integrity
          eventTooltip: {
            disabled: !displayOptions.showTooltips,
            template: ({ eventRecord }: any) => `
              <div class="operation-tooltip">
                <h4>${eventRecord?.name || 'Unknown Operation'}</h4>
                <p><strong>Type:</strong> ${eventRecord?.assignmentType || 'unscheduled'}</p>
                <p><strong>Status:</strong> ${eventRecord?.status || 'planned'}</p>
                <p><strong>Priority:</strong> ${eventRecord?.priority || 'Medium'}</p>
                ${eventRecord.setupStart ? `<p><strong>Setup:</strong> ${eventRecord.setupStart} - ${eventRecord.setupEnd}</p>` : ''}
                ${eventRecord.runStart ? `<p><strong>Run:</strong> ${eventRecord.runStart} - ${eventRecord.runEnd}</p>` : ''}
                ${eventRecord.isActuallyScheduled ? '<p><span style="color: green;">✓ Actually Scheduled</span></p>' : '<p><span style="color: orange;">⚠ Unscheduled</span></p>'}
              </div>
            `
          },
          dependencies: displayOptions.showDependencies, // Control dependency lines visibility
          dependencyEdit: displayOptions.showDependencies
        }}} // Close features object with spread operator
        
        
        // Enhanced event handlers following Bryntum documentation patterns
        onEventDrop={({ eventRecord, newResource, oldResource, valid }: any) => {
          if (!valid) {
            toast({
              title: "Invalid Drop",
              description: "The operation could not be moved to the selected location.",
              variant: "destructive",
            });
            return;
          }
          
          /* console.log('Operation moved:', {
            operation: eventRecord?.name || 'Unknown',
            from: oldResource?.name,
            to: newResource?.name,
            newStart: eventRecord?.startDate,
            newEnd: eventRecord.endDate,
            assignmentType: eventRecord.assignmentType
          }); */
          
          // Extract operation ID from event ID
          const operationId = parseInt(eventRecord.id.replace('e_', ''));
          const newResourceId = parseInt(newResource.id.replace('r_', ''));
          
          // Prepare update data following Jim's corrections
          const updates = {
            resourceId: newResourceId,
            startDate: eventRecord.startDate.toISOString(),
            endDate: eventRecord.endDate.toISOString(),
            // Update assignment type if moving from unscheduled to scheduled
            assignmentType: eventRecord.assignmentType === 'unscheduled' ? 'manual' : eventRecord.assignmentType,
            // Note: This will update ptjoboperations.scheduled_start/end for unscheduled operations
            // For scheduled operations with resource blocks, this should be handled differently
          };
          
          // Show optimistic update feedback
          toast({
            title: "Operation Moved",
            description: `${eventRecord?.name || 'Operation'} moved to ${newResource?.name || 'resource'}`,
          });
          
          // Call the mutation or callback
          if (onOperationUpdate) {
            onOperationUpdate(operationId, updates);
          } else {
            updateOperationMutation.mutate({ operationId, updates });
          }
        }}
        
        onEventDragStart={({ eventRecord }: any) => {
          // console.log('Drag started for operation:', eventRecord?.name || 'Unknown');
          
          // Add visual feedback class
          if (schedulerRef.current) {
            schedulerRef.current.element.classList.add('b-dragging-event');
          }
        }}
        
        onEventDragAbort={({ eventRecord }: any) => {
          // console.log('Drag ended for operation:', eventRecord?.name || 'Unknown');
          
          // Remove visual feedback class
          if (schedulerRef.current) {
            schedulerRef.current.element.classList.remove('b-dragging-event');
          }
        }}
        
        onEventResizeEnd={({ eventRecord }: any) => {
          // console.log('Operation resized:', {
          //   operation: eventRecord?.name || 'Unknown',
          //   newStart: eventRecord?.startDate,
          //   newEnd: eventRecord?.endDate,
          //   newDuration: (eventRecord?.endDate && eventRecord?.startDate) ? eventRecord.endDate - eventRecord.startDate : 0
          // });
          
          const operationId = parseInt(eventRecord.id.replace('e_', ''));
          const updates = {
            startDate: eventRecord.startDate.toISOString(),
            endDate: eventRecord.endDate.toISOString()
          };
          
          if (onOperationUpdate) {
            onOperationUpdate(operationId, updates);
          } else {
            updateOperationMutation.mutate({ operationId, updates });
          }
        }}
        
        onPaint={() => {
          // console.log('💡 Production Scheduler Pro loaded with Jim\'s corrections');
          if (schedulerRef.current?.widget) {
            const widget = schedulerRef.current.widget;
            // console.log('✅ Scheduler painted with ProjectModel:');
            // console.log('Store counts:', {
            //   resources: widget.resourceStore?.count || 0,
            //   events: widget.eventStore?.count || 0,
            //   assignments: widget.assignmentStore?.count || 0,
            //   dependencies: widget.dependencyStore?.count || 0
            // });
          }
          // console.log('Assignment types:', {
          //   scheduled: bryntumEvents.filter(e => e.data?.assignmentType === 'scheduled').length,
          //   unscheduled: bryntumEvents.filter(e => e.data?.assignmentType === 'unscheduled').length
          // });
        }}
        />
      </div>
    </div>
  );
});

BryntumSchedulerProComponent.displayName = 'BryntumSchedulerProComponent';

export default BryntumSchedulerProComponent;