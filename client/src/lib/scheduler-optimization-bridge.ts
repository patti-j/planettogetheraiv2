/**
 * Scheduler Optimization Bridge
 * Provides integration between Bryntum Scheduler Pro and Optimization Studio
 */

import {
  ScheduleDataDTO,
  EventDTO,
  ResourceDTO,
  DependencyDTO,
  ConstraintDTO,
  OptimizationRequestDTO,
  OptimizationResponseDTO,
  OptimizedEventDTO,
  OptimizationMetrics
} from '@shared/optimization-types';

/**
 * Collect current schedule data from Bryntum Scheduler
 */
export function collectSchedulerData(scheduler: any): ScheduleDataDTO {
  const resources = scheduler.resourceStore.records
    .filter((resource: any) => resource.id !== 'unscheduled') // Exclude unscheduled resource
    .map((resource: any): ResourceDTO => ({
      id: String(resource.id),
      name: resource.name,
      type: resource.type || 'default',
      calendar: resource.calendar?.id,
      capacity: Number(resource.capacity || 1), // Ensure it's a number
      attributes: {
        efficiency: resource.efficiency,
        skills: resource.skills,
        costPerHour: resource.costPerHour
      }
    }));

  // Collect PT operations as events/operations
  const operations = scheduler.eventStore.records
    .filter((event: any) => {
      // Only include scheduled operations (exclude unscheduled)
      const assignment = scheduler.assignmentStore.find((a: any) => a.eventId === event.id);
      return assignment && assignment.resourceId !== 'unscheduled';
    })
    .map((event: any): EventDTO => {
      // Find the actual assigned resource
      const assignment = scheduler.assignmentStore.find((a: any) => a.eventId === event.id);
      const resourceId = assignment ? String(assignment.resourceId) : String(event.resourceId);
      
      return {
        id: String(event.id), // Ensure ID is string
        name: event.name || '',
        resourceId: resourceId,
        startDate: event.startDate?.toISOString() || new Date().toISOString(),
        endDate: event.endDate?.toISOString() || new Date().toISOString(),
        duration: Number(event.duration || 0), // Ensure duration is number
        manuallyScheduled: event.manuallyScheduled || false,
        locked: event.locked || false,
        priority: event.priority,
        attributes: {
          jobId: event.jobId,
          jobName: event.jobName,
          operationId: event.operationId,
          productId: event.productId,
          quantity: event.quantity,
          setupTime: event.setupTime,
          processingTime: event.processingTime,
          percentDone: event.percentDone
        }
      } as any;
    });

  const dependencies = scheduler.dependencyStore.records.map((dep: any): DependencyDTO => {
    // Extract the IDs properly from Bryntum dependency records
    let fromId = dep.from;
    let toId = dep.to;
    
    // If they are objects with id property, extract the id
    if (typeof fromId === 'object' && fromId?.id) {
      fromId = fromId.id;
    }
    if (typeof toId === 'object' && toId?.id) {
      toId = toId.id;
    }
    
    // Also check fromEvent/toEvent properties
    if (!fromId && dep.fromEvent) {
      fromId = typeof dep.fromEvent === 'object' ? dep.fromEvent.id : dep.fromEvent;
    }
    if (!toId && dep.toEvent) {
      toId = typeof dep.toEvent === 'object' ? dep.toEvent.id : dep.toEvent;
    }
    
    return {
      id: String(dep.id),
      fromEvent: String(fromId || ''),
      toEvent: String(toId || ''),
      type: dep.type || 2, // Default to Finish-to-Start
      lag: dep.lag || 0,
      lagUnit: dep.lagUnit || 'hour'
    };
  });

  const constraints: ConstraintDTO[] = operations
    .filter((event: any) => event.constraintType && event.constraintDate)
    .map((event: any) => ({
      id: `constraint-${event.id}`,
      type: event.constraintType,
      date: event.constraintDate,
      eventId: event.id
    }));

  return {
    version: `v_${Date.now()}`,
    snapshot: {
      resources,
      events: operations, // Map operations to events for the DTO
      dependencies,
      constraints
    },
    metadata: {
      plantId: scheduler.project?.id || 'default',
      timestamp: new Date().toISOString(),
      userId: 'current-user' // Replace with actual user ID
    }
  };
}

/**
 * Apply optimized schedule back to Bryntum Scheduler
 */
export async function applyOptimizationResults(
  scheduler: any,
  optimizedData: OptimizationResponseDTO,
  options: {
    algorithmId?: string;
    markAsManuallyScheduled?: boolean;
    showMetrics?: boolean;
    animateChanges?: boolean;
  } = {}
): Promise<void> {
  const {
    algorithmId = 'forward-scheduling',
    markAsManuallyScheduled = false, // Changed default to false - programmatic scheduling should NOT be marked as manual
    showMetrics = true,
    animateChanges = false
  } = options;

  if (!optimizedData.result) {
    throw new Error('No optimization results to apply');
  }

  // Suspend auto-commit to batch updates
  scheduler.project.suspendAutoCommit();

  try {
    // Track changes for animation
    const changedEvents: string[] = [];

    // First, clear any manually scheduled flags from programmatically scheduled events
    // This allows Bryntum's constraint engine to properly schedule them
    for (const optEvent of optimizedData.result.events) {
      const event = scheduler.eventStore.getById(optEvent.id);
      if (event && optEvent.changed) {
        // Store old position for animation
        if (animateChanges) {
          event.meta = event.meta || {};
          event.meta.oldStart = event.startDate;
          event.meta.oldEnd = event.endDate;
          event.meta.oldResource = event.resourceId;
        }

        // Apply optimized values
        event.set({
          startDate: new Date(optEvent.startDate),
          endDate: new Date(optEvent.endDate),
          resourceId: optEvent.resourceId,
          // IMPORTANT: Set manuallyScheduled to false for programmatic scheduling
          manuallyScheduled: false
        });

        // Add visual indicator
        event.cls = (event.cls || '') + ' optimized-event';
        changedEvents.push(event.id);
      }
    }

    // Resume auto-commit to let Bryntum process the changes
    scheduler.project.resumeAutoCommit();
    
    // Now trigger Bryntum's scheduling engine with the appropriate direction
    // This will resolve constraints properly
    console.log(`[Optimization] Triggering Bryntum scheduling engine with algorithm: ${algorithmId}`);
    
    // Determine scheduling direction based on algorithm
    let schedulingDirection = 'Forward'; // Default to forward (ASAP)
    if (algorithmId === 'backward-scheduling' || algorithmId.toLowerCase().includes('alap')) {
      schedulingDirection = 'Backward';
    } else if (algorithmId === 'critical-path' || algorithmId.includes('toc') || algorithmId.includes('drum')) {
      schedulingDirection = 'None'; // Let TOC algorithm handle its own logic
    }
    
    // Apply Bryntum's constraint engine to resolve overlaps and dependencies
    if (scheduler.project.schedule) {
      console.log(`[Optimization] Running Bryntum schedule() with direction: ${schedulingDirection}`);
      await scheduler.project.schedule({
        direction: schedulingDirection,
        // Respect resource constraints
        respectResourceCalendar: true,
        // Apply dependency constraints
        skipNonWorkingTime: true
      });
    } else if (scheduler.project.propagate) {
      // Fallback to propagate if schedule method doesn't exist
      console.log('[Optimization] Running Bryntum propagate() to apply constraints');
      await scheduler.project.propagate();
    }
    
    // Commit all changes after constraint resolution
    await scheduler.project.commitAsync();

    // Only NOW mark events as manually scheduled if explicitly requested
    // This is for when user wants to lock the optimized schedule
    if (markAsManuallyScheduled) {
      console.log('[Optimization] Marking events as manually scheduled (locked)');
      scheduler.project.suspendAutoCommit();
      
      for (const eventId of changedEvents) {
        const event = scheduler.eventStore.getById(eventId);
        if (event) {
          event.manuallyScheduled = true;
        }
      }
      
      scheduler.project.resumeAutoCommit();
      await scheduler.project.commitAsync();
    }

    // Animate changes if requested
    if (animateChanges && changedEvents.length > 0) {
      animateScheduleChanges(scheduler, changedEvents);
    }

    // Show metrics if requested
    if (showMetrics && optimizedData.result.metrics) {
      showOptimizationMetrics(scheduler, optimizedData.result.metrics);
    }

    // Notify success
    if (scheduler.features.toast) {
      scheduler.toast({
        html: `✅ Optimization applied successfully (${changedEvents.length} events updated)`,
        timeout: 3000
      });
    }

  } catch (error) {
    scheduler.project.resumeAutoCommit();
    console.error('[Optimization] Error applying optimization results:', error);
    throw error;
  }
}

/**
 * Create optimization request from scheduler data
 */
export function createOptimizationRequest(
  scheduler: any,
  algorithmId: string,
  options: {
    profileId?: number;
    objectives?: string[];
    timeLimit?: number;
    lockedEvents?: string[];
  } = {}
): any {
  const scheduleData = collectSchedulerData(scheduler);

  // Identify locked events
  const lockedEvents = options.lockedEvents || 
    scheduler.eventStore.records
      .filter((event: any) => event.locked || event.manuallyScheduled)
      .map((event: any) => String(event.id));

  // Create properly formatted request matching the server schema
  return {
    scheduleData: {
      ...scheduleData,
      // Ensure we have operations in the data
      operations: scheduleData.snapshot.events.map((e: any) => ({
        ...e,
        type: 'operation' // Mark as operation type
      }))
    },
    algorithmId: algorithmId, // Keep as string for API
    algorithm: algorithmId, // Also include as 'algorithm' for backwards compatibility
    profileId: String(options.profileId || 1), // Convert to string for API
    parameters: {
      objectives: options.objectives || ['minimize_makespan'],
      timeLimit: options.timeLimit || 60
    },
    options: {
      objective: 'minimize_makespan',
      timeLimit: options.timeLimit || 30,
      incrementalMode: false,
      warmStart: false
    },
    locks: {
      events: lockedEvents,
      resourceIntervals: []
    }
  };
}

/**
 * Submit optimization job to server
 */
export async function submitOptimizationJob(
  request: OptimizationRequestDTO
): Promise<OptimizationResponseDTO> {
  const response = await fetch('/api/schedules/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit optimization job');
  }

  return response.json();
}

/**
 * Check job status
 */
export async function checkJobStatus(runId: string): Promise<OptimizationResponseDTO> {
  const response = await fetch(`/api/schedules/optimize/${runId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check job status');
  }

  return response.json();
}

/**
 * Subscribe to job progress via Server-Sent Events
 */
export function subscribeToJobProgress(
  runId: string,
  callbacks: {
    onProgress?: (progress: any) => void;
    onComplete?: (result: any) => void;
    onError?: (error: any) => void;
  }
): EventSource {
  const eventSource = new EventSource(`/api/schedules/optimize/${runId}/progress`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'progress':
        callbacks.onProgress?.(data.data);
        break;
      case 'complete':
        callbacks.onComplete?.(data);
        eventSource.close();
        break;
      case 'error':
        callbacks.onError?.(data.error);
        eventSource.close();
        break;
    }
  };

  eventSource.onerror = (error) => {
    callbacks.onError?.(error);
    eventSource.close();
  };

  return eventSource;
}

/**
 * Animate schedule changes
 */
function animateScheduleChanges(scheduler: any, changedEventIds: string[]): void {
  // Add animation class
  changedEventIds.forEach(id => {
    const eventElement = scheduler.getElementFromEventRecord(scheduler.eventStore.getById(id));
    if (eventElement) {
      eventElement.classList.add('schedule-change-animation');
      setTimeout(() => {
        eventElement.classList.remove('schedule-change-animation');
      }, 2000);
    }
  });
}

/**
 * Show optimization metrics
 */
function showOptimizationMetrics(scheduler: any, metrics: OptimizationMetrics): void {
  const metricsHtml = `
    <div class="optimization-metrics">
      <h3>Optimization Results</h3>
      <ul>
        <li>Makespan: ${metrics.makespan.toFixed(1)} hours</li>
        <li>Resource Utilization: ${metrics.resourceUtilization.toFixed(1)}%</li>
        <li>Improvement: ${metrics.improvementPercentage.toFixed(1)}%</li>
        <li>Computation Time: ${metrics.computationTime.toFixed(2)}s</li>
      </ul>
    </div>
  `;

  if (scheduler.features.toast) {
    scheduler.toast({
      html: metricsHtml,
      timeout: 5000,
      cls: 'optimization-metrics-toast'
    });
  }
}

/**
 * Create a snapshot of current schedule for rollback
 */
export function createScheduleSnapshot(scheduler: any): string {
  const snapshot = {
    events: scheduler.eventStore.records.map((e: any) => ({
      id: e.id,
      startDate: e.startDate?.toISOString(),
      endDate: e.endDate?.toISOString(),
      resourceId: e.resourceId,
      manuallyScheduled: e.manuallyScheduled
    })),
    dependencies: scheduler.dependencyStore.records.map((d: any) => ({
      id: d.id,
      fromEvent: d.fromEvent,
      toEvent: d.toEvent,
      type: d.type,
      lag: d.lag,
      lagUnit: d.lagUnit
    }))
  };

  return JSON.stringify(snapshot);
}

/**
 * Restore schedule from snapshot
 */
export function restoreScheduleSnapshot(scheduler: any, snapshotJson: string): void {
  const snapshot = JSON.parse(snapshotJson);
  
  scheduler.project.suspendAutoCommit();
  
  try {
    // Restore events
    snapshot.events.forEach((eventData: any) => {
      const event = scheduler.eventStore.getById(eventData.id);
      if (event) {
        event.set({
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          resourceId: eventData.resourceId,
          manuallyScheduled: eventData.manuallyScheduled
        });
      }
    });

    scheduler.project.resumeAutoCommit();
    scheduler.project.commitAsync();
    
  } catch (error) {
    scheduler.project.resumeAutoCommit();
    throw error;
  }
}