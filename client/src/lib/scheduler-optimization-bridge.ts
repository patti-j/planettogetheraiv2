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
  const resources = scheduler.resourceStore.records.map((resource: any): ResourceDTO => ({
    id: resource.id,
    name: resource.name,
    type: resource.type || 'default',
    calendar: resource.calendar?.id,
    capacity: resource.capacity || 1,
    attributes: {
      efficiency: resource.efficiency,
      skills: resource.skills,
      costPerHour: resource.costPerHour
    }
  }));

  const events = scheduler.eventStore.records.map((event: any): EventDTO => ({
    id: event.id,
    name: event.name,
    resourceId: event.resourceId,
    startDate: event.startDate?.toISOString() || '',
    endDate: event.endDate?.toISOString() || '',
    duration: event.durationMS || 0,
    manuallyScheduled: event.manuallyScheduled || false,
    locked: event.locked || false,
    priority: event.priority,
    attributes: {
      jobId: event.jobId,
      operationId: event.operationId,
      productId: event.productId,
      quantity: event.quantity,
      setupTime: event.setupTime,
      processingTime: event.processingTime
    }
  }));

  const dependencies = scheduler.dependencyStore.records.map((dep: any): DependencyDTO => ({
    id: dep.id,
    fromEvent: dep.fromEvent,
    toEvent: dep.toEvent,
    type: dep.type || 2, // Default to Finish-to-Start
    lag: dep.lag,
    lagUnit: dep.lagUnit
  }));

  const constraints: ConstraintDTO[] = events
    .filter((event: any) => event.constraintType && event.constraintDate)
    .map((event: any) => ({
      id: `constraint-${event.id}`,
      type: event.constraintType,
      date: event.constraintDate.toISOString(),
      eventId: event.id
    }));

  return {
    version: `v_${Date.now()}`,
    snapshot: {
      resources,
      events,
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
    markAsManuallyScheduled?: boolean;
    showMetrics?: boolean;
    animateChanges?: boolean;
  } = {}
): Promise<void> {
  const {
    markAsManuallyScheduled = true,
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

    // Apply optimized dates to events
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
          resourceId: optEvent.resourceId
        });

        // Mark as manually scheduled to prevent engine override
        if (markAsManuallyScheduled) {
          event.manuallyScheduled = true;
        }

        // Add visual indicator
        event.cls = (event.cls || '') + ' optimized-event';
        changedEvents.push(event.id);
      }
    }

    // Resume and propagate changes
    scheduler.project.resumeAutoCommit();
    await scheduler.project.commitAsync();

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
    throw error;
  }
}

/**
 * Create optimization request from scheduler data
 */
export function createOptimizationRequest(
  scheduler: any,
  algorithmId: number,
  options: {
    profileId?: number;
    objective?: string;
    timeLimit?: number;
    lockedEvents?: string[];
  } = {}
): OptimizationRequestDTO {
  const scheduleData = collectSchedulerData(scheduler);

  // Identify locked events
  const lockedEvents = options.lockedEvents || 
    scheduler.eventStore.records
      .filter((event: any) => event.locked || event.manuallyScheduled)
      .map((event: any) => event.id);

  return {
    scheduleData,
    algorithmId,
    profileId: options.profileId,
    options: {
      objective: (options.objective || 'minimize_makespan') as any,
      timeLimit: options.timeLimit || 60,
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