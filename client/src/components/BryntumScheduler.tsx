import { useEffect, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.classic-light.css';

// Type definitions
interface Resource {
  id: string | number;
  resource_id?: string;
  name: string;
  displayName?: string;
  category?: string;
  plantName?: string;
  area?: string;
  active?: boolean;
  isBottleneck?: boolean;
}

interface Operation {
  id: string | number;
  name?: string;
  operationName?: string;
  startDate?: string;
  scheduled_start?: string;
  endDate?: string;
  scheduled_end?: string;
  duration?: number;
  durationUnit?: string;
  percent_finished?: number;
  percent_done?: number;
  percentDone?: number;
  resourceId?: string;
  resource_id?: string;
  jobName?: string;
  job_name?: string;
  jobId?: string;
  job_id?: string;
}

interface Capabilities {
  [resourceId: string]: string[];
}

// Toast notification component
const ToastContainer: React.FC<{ toasts: string[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
      }}
    >
      {toasts.map((message, index) => (
        <div
          key={index}
          role="alert"
          style={{
            background: '#333',
            color: 'white',
            padding: '12px 20px',
            marginBottom: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '14px',
            animation: 'slideIn 0.3s ease-out',
            minWidth: '200px',
          }}
        >
          {message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const BryntumScheduler: React.FC = () => {
  const schedulerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<string[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<Capabilities>({});

  // Helper functions
  const A = (p: any): any[] => {
    if (Array.isArray(p)) return p;
    if (Array.isArray(p?.data)) return p.data;
    if (Array.isArray(p?.results)) return p.results;
    if (Array.isArray(p?.items)) return p.items;
    return [];
  };

  const S = (v: any): string | undefined => {
    if (v == null) return undefined;
    return typeof v === 'string' ? v : String(v);
  };

  const opColor = (name?: string): string => {
    const s = (name || '').toLowerCase();
    if (s.includes('whirlpool')) return 'blue';
    if (s.includes('boil')) return 'indigo';
    if (s.includes('mash')) return 'cyan';
    if (s.includes('ferment')) return 'green';
    if (s.includes('matur')) return 'purple';
    return 'teal';
  };

  const showToast = (message: string) => {
    setToasts((prev) => [...prev, message]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  const getOperationType = (eventName?: string): string => {
    if (!eventName) return 'Other';
    const name = eventName.toLowerCase();
    if (name.includes('mill')) return 'Milling';
    if (name.includes('mash') && name.includes('decoction')) return 'Decoction';
    if (name.includes('mash')) return 'Mashing';
    if (name.includes('lauter')) return 'Lautering';
    if (name.includes('boil')) return 'Boiling';
    if (name.includes('ferment')) return 'Fermentation';
    if (name.includes('lager')) return 'Lagering';
    if (name.includes('condition')) return 'Conditioning';
    if (name.includes('packag')) return 'Packaging';
    if (name.includes('dry hop')) return 'Dry Hopping';
    return 'Other';
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, o, c] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/pt-operations'),
          fetch('/api/resource-capabilities'),
        ]);

        const resourcesData = r.ok ? await r.json() : [];
        const operationsData = o.ok ? await o.json() : [];
        const capabilitiesData = c.ok ? await c.json() : {};

        const rawResources = A(resourcesData);
        const rawOperations = A(operationsData);

        // Build resource rows
        const resourceRows = [
          { id: 'unscheduled', name: 'Unscheduled', category: 'Queue', eventColor: '#808080' },
          ...rawResources.map((r: Resource, i: number) => ({
            id: S(r.resource_id) ?? S(r.id) ?? `r${i}`,
            name: r.name ?? r.displayName ?? `Resource ${i + 1}`,
            category: r.category ?? r.plantName ?? r.area ?? 'Default',
            active: r.active !== false,
            eventColor: r.isBottleneck ? 'red' : i % 2 ? 'green' : 'blue',
          })),
        ];

        // Build events
        const eventsData: any[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < rawOperations.length; i++) {
          const op = rawOperations[i] as Operation;
          const id = S(op.id) ?? `e${i}`;
          if (seen.has(id)) continue;
          seen.add(id);

          const start = op.startDate
            ? new Date(op.startDate)
            : op.scheduled_start
            ? new Date(op.scheduled_start)
            : null;
          let end = op.endDate
            ? new Date(op.endDate)
            : op.scheduled_end
            ? new Date(op.scheduled_end)
            : null;
          if (start && !end && op.duration) {
            end = new Date(start);
            const hrs = op.durationUnit === 'day' ? op.duration * 24 : +(op.duration || 0);
            end.setHours(end.getHours() + hrs);
          }

          eventsData.push({
            id,
            name: op.name ?? op.operationName ?? `Op ${i + 1}`,
            startDate: start || null,
            endDate: end || null,
            duration: Math.min(op.duration || 4, 8),
            durationUnit: op.durationUnit || 'hour',
            percentDone: op.percent_finished ?? op.percent_done ?? op.percentDone ?? 0,
            isUnscheduled: false,
            eventColor: opColor(op.name || op.operationName),
            draggable: true,
            resizable: true,
            jobName: op.jobName || op.job_name || '',
            jobId: op.jobId || op.job_id || '',
          });
        }

        // Build assignments
        const resSet = new Set(resourceRows.map((r) => r.id));
        const assignmentsData: any[] = [];
        for (const op of rawOperations) {
          const eid = S(op.id);
          const rid = S(op.resourceId ?? op.resource_id);
          if (!eid) continue;
          if (rid && resSet.has(rid)) {
            assignmentsData.push({ id: `a_${eid}_${rid}`, eventId: eid, resourceId: rid });
          }
        }

        // Ensure all events have assignments (assign orphans to unscheduled)
        const assigned = new Set(assignmentsData.map((a) => a.eventId));
        for (const ev of eventsData) {
          if (!assigned.has(ev.id)) {
            ev.isUnscheduled = true;
            ev.eventColor = '#808080';
            // Add assignment to unscheduled resource
            assignmentsData.push({
              id: `a_${ev.id}_unscheduled`,
              eventId: ev.id,
              resourceId: 'unscheduled',
            });
          }
        }

        // Build dependencies
        const dependenciesData: any[] = [];
        const opsByJob: { [key: string]: Operation[] } = {};
        for (const op of rawOperations) {
          const jobId = op.jobId || op.job_id;
          if (!jobId) continue;
          if (!opsByJob[jobId]) opsByJob[jobId] = [];
          opsByJob[jobId].push(op);
        }

        let depId = 1;
        for (const jobId in opsByJob) {
          const jobOps = opsByJob[jobId];
          jobOps.sort((a, b) => {
            const aStart = a.scheduled_start || a.startDate;
            const bStart = b.scheduled_start || b.startDate;
            if (!aStart || !bStart) return 0;
            return new Date(aStart).getTime() - new Date(bStart).getTime();
          });

          for (let i = 0; i < jobOps.length - 1; i++) {
            const fromOp = jobOps[i];
            const toOp = jobOps[i + 1];
            dependenciesData.push({
              id: `dep_${depId++}`,
              from: S(fromOp.id),
              to: S(toOp.id),
              type: 2,
              lag: 0,
              lagUnit: 'hour',
            });
          }
        }

        console.log(`Created ${dependenciesData.length} dependencies across ${Object.keys(opsByJob).length} jobs`);

        setResources(resourceRows);
        setEvents(eventsData);
        setAssignments(assignmentsData);
        setDependencies(dependenciesData);
        setCapabilities(capabilitiesData);
        setLoading(false);

        // Commit initial data after it's loaded into stores
        setTimeout(() => {
          if (schedulerRef.current?.instance) {
            schedulerRef.current.instance.project.commitAsync();
          }
        }, 100);
      } catch (error) {
        console.error('Error loading scheduler data:', error);
        showToast('Failed to load scheduler data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper functions for scheduler operations
  const cleanupOverlaps = async () => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    const p = scheduler.project;
    const byRes = new Map();

    p.assignmentStore.forEach((a: any) => {
      const ev = a.event;
      const res = a.resource;
      if (!ev || !res || !ev.startDate || !ev.endDate || res.id === 'unscheduled') return;
      const list = byRes.get(res.id) ?? [];
      list.push(ev);
      byRes.set(res.id, list);
    });

    // Batch all changes for efficiency
    // Bryntum uses beginBatch/endBatch, not batch()
    p.beginBatch();
    
    for (const [rid, evs] of byRes) {
      evs.sort((a: any, b: any) => a.startDate - b.startDate);
      for (let i = 1; i < evs.length; i++) {
        const prev = evs[i - 1];
        const curr = evs[i];
        if (prev.endDate > curr.startDate) {
          const asg = p.assignmentStore.find((r: any) => r.eventId === curr.id && r.resourceId === rid);
          if (asg) {
            // Update assignment to unscheduled using set()
            asg.set({ resourceId: 'unscheduled' });
            curr.set({ isUnscheduled: true, eventColor: '#808080' });
            console.log(`Moved overlapping event "${curr.name}" from ${rid} to Unscheduled`);
            showToast(`Moved overlapping event "${curr.name}" to Unscheduled`);
          }
        }
      }
    }
    
    p.endBatch();

    // Commit changes to update the DOM
    await p.commitAsync();
  };

  const moveToUnscheduled = async (eventId: string) => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    const p = scheduler.project;
    const event = p.eventStore.getById(eventId);
    if (!event) return;

    // Batch changes
    p.beginBatch();
    
    const assignment = p.assignmentStore.find((a: any) => a.eventId === eventId);
    if (assignment && assignment.resourceId !== 'unscheduled') {
      // Update the existing assignment to unscheduled using set()
      assignment.set({ resourceId: 'unscheduled' });
      event.set({ isUnscheduled: true, eventColor: '#808080' });
      console.log(`Moved event "${event.name}" to Unscheduled`);
      showToast(`Moved "${event.name}" to Unscheduled`);
    } else if (!assignment) {
      // Create new assignment to unscheduled if none exists
      p.assignmentStore.add({
        id: `a_${eventId}_unscheduled`,
        eventId: eventId,
        resourceId: 'unscheduled',
      });
      event.set({ isUnscheduled: true, eventColor: '#808080' });
    }
    
    p.endBatch();

    // Commit changes
    await p.commitAsync();
  };

  const handleScheduleOperation = async (eventId: string, targetResourceId: string) => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return false;

    const p = scheduler.project;
    const event = p.eventStore.getById(eventId);
    const targetResource = p.resourceStore.getById(targetResourceId);
    
    if (!event || !targetResource) return false;

    // Check capabilities
    if (targetResourceId !== 'unscheduled') {
      const operationType = getOperationType(event.name);
      const resourceCapabilities = capabilities[targetResourceId] || [];
      if (!resourceCapabilities.includes(operationType)) {
        showToast(`${targetResource.name} cannot perform ${operationType} operations`);
        return false;
      }
    }

    // Batch all changes
    p.beginBatch();
    
    // Find existing assignment
    const existingAssignment = p.assignmentStore.find((a: any) => a.eventId === eventId);
    
    if (existingAssignment) {
      // Update existing assignment's resource using set()
      existingAssignment.set({ resourceId: targetResourceId });
    } else {
      // Create new assignment if none exists
      p.assignmentStore.add({
        id: `a_${eventId}_${targetResourceId}`,
        eventId: eventId,
        resourceId: targetResourceId,
      });
    }

    // Update event properties using set()
    if (targetResourceId === 'unscheduled') {
      event.set({ isUnscheduled: true, eventColor: '#808080' });
    } else {
      event.set({ isUnscheduled: false, eventColor: opColor(event.name) });
    }
    
    p.endBatch();

    // Commit changes
    await p.commitAsync();

    return true;
  };

  const optimizeSchedule = async () => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    try {
      showToast('Starting optimization...');
      
      // Import optimization functions
      const { createOptimizationRequest, submitOptimizationJob, checkJobStatus, applyOptimizationResults } = await import('@/lib/scheduler-optimization-bridge');
      
      // Create optimization request with forward-scheduling algorithm
      const request = createOptimizationRequest(scheduler, 'forward-scheduling', {
        profileId: 1,
        objectives: ['minimize_makespan', 'maximize_utilization'],
        timeLimit: 60
      });
      
      console.log('Optimization request:', request);
      
      // Check if we have any operations (scheduled or unscheduled)
      const allOperations = scheduler.eventStore.records;
      const scheduledOps = request.scheduleData.snapshot.events;
      
      if (allOperations.length === 0) {
        showToast('No operations available to optimize.');
        return;
      }
      
      // If no scheduled operations, try to pack unscheduled first
      if (scheduledOps.length === 0) {
        showToast('No operations scheduled. Running Pack Unscheduled first...');
        await packUnscheduled();
        
        // Recreate the request with the newly scheduled operations
        request = createOptimizationRequest(scheduler, 'forward-scheduling', {
          profileId: 1,
          objectives: ['minimize_makespan', 'maximize_utilization'],
          timeLimit: 60
        });
        
        // Check again after packing
        if (!request.scheduleData.snapshot.events || request.scheduleData.snapshot.events.length === 0) {
          showToast('Could not schedule any operations. Please check resource capabilities.');
          return;
        }
      }
      
      // Submit optimization job
      const response = await submitOptimizationJob(request);
      console.log('Optimization response:', response);
      
      if (response.status === 'queued' || response.status === 'running') {
        showToast(`Optimization job ${response.runId} submitted. Processing...`);
        
        // Poll for job completion
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        const pollInterval = setInterval(async () => {
          attempts++;
          
          try {
            const status = await checkJobStatus(response.runId);
            console.log('Job status:', status);
            
            if (status.status === 'completed' && status.result) {
              clearInterval(pollInterval);
              
              // Apply optimization results
              await applyOptimizationResults(scheduler, status, {
                markAsManuallyScheduled: true,
                showMetrics: true,
                animateChanges: true
              });
              
              showToast('✅ Optimization completed successfully!');
            } else if (status.status === 'failed') {
              clearInterval(pollInterval);
              showToast(`❌ Optimization failed: ${status.error?.message || 'Unknown error'}`);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              showToast('⏱️ Optimization timed out. Please try again.');
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error('Error checking job status:', error);
            showToast('Error checking optimization status');
          }
        }, 1000); // Poll every second
      } else if (response.status === 'failed' || response.error) {
        showToast(`Optimization failed: ${response.error?.message || response.error || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      console.error('Optimization error:', error);
      // Check if it's a validation error from the server
      if (error.message?.includes('validation') || error.message?.includes('Invalid')) {
        showToast('Optimization failed due to data validation errors. Please try packing operations first.');
      } else {
        showToast(`Failed to start optimization: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const packUnscheduled = async () => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    const p = scheduler.project;
    // Find events assigned to unscheduled resource
    const evs = p.eventStore.query((ev: any) => {
      const assignment = p.assignmentStore.find((a: any) => a.eventId === ev.id);
      return assignment && assignment.resourceId === 'unscheduled';
    });
    const resources = p.resourceStore.records.filter((r: any) => r.id !== 'unscheduled');

    let placed = 0;
    
    // Batch all changes for efficiency
    p.beginBatch();
    
    for (const ev of evs) {
        const durMs = ev.endDate && ev.startDate
          ? ev.endDate - ev.startDate
          : (ev.duration || 2) * 3600000;
        let candidateStart = ev.startDate || new Date(scheduler.startDate);
        let candidateEnd = new Date(candidateStart.getTime() + durMs);

        outer: for (const res of resources) {
          const operationType = getOperationType(ev.name);
          const resourceCapabilities = capabilities[res.id] || [];
          if (!resourceCapabilities.includes(operationType)) {
            continue;
          }

          for (let hop = 0; hop < 200; hop++) {
            if (scheduler.isDateRangeAvailable(candidateStart, candidateEnd, res, ev)) {
              // Update existing assignment from unscheduled to target resource
              const existingAssignment = p.assignmentStore.find((a: any) => a.eventId === ev.id);
              if (existingAssignment) {
                existingAssignment.set({ resourceId: res.id });
              } else {
                // Should not happen, but create if missing
                p.assignmentStore.add({
                  id: `a_${ev.id}_${res.id}`,
                  eventId: ev.id,
                  resourceId: res.id,
                });
              }
              ev.set({
                startDate: candidateStart,
                endDate: candidateEnd,
                isUnscheduled: false,
                eventColor: opColor(ev.name),
              });
              placed++;
              break outer;
            }

            const blockers = p.eventStore
              .query(
                (x: any) =>
                  p.assignmentStore.find((a: any) => a.eventId === x.id && a.resourceId === res.id) &&
                  x.endDate > candidateStart &&
                  x.startDate < candidateEnd
              )
              .sort((a: any, b: any) => a.endDate - b.endDate);
            candidateStart = blockers.length
              ? new Date(blockers[blockers.length - 1].endDate)
              : new Date(candidateEnd);
            candidateEnd = new Date(candidateStart.getTime() + durMs);
          }
        }
      }
    
    p.endBatch();

    // Commit all changes
    await p.commitAsync();

    showToast(`${placed} event(s) scheduled`);
  };

  const packStoreChanges = (store: any) => {
    const added = store.added?.map((r: any) => r.data) || [];
    const removed = store.removed?.map((r: any) => ({ id: r.id })) || [];
    const updated = (
      store.modifiedRecords?.length
        ? store.modifiedRecords
        : Array.from(store.modified || [])
    ).map((r: any) => ({ id: r.id, ...r.changes }));

    return { added, updated, removed };
  };

  const saveManual = async () => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    const p = scheduler.project;
    const payload = {
      resources: packStoreChanges(p.resourceStore),
      events: packStoreChanges(p.eventStore),
      assignments: packStoreChanges(p.assignmentStore),
      dependencies: packStoreChanges(p.dependencyStore),
    };

    console.log('Saving changes:', payload);

    try {
      const res = await fetch('/api/scheduler/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Sync HTTP ' + res.status);

      p.resourceStore.commit();
      p.eventStore.commit();
      p.assignmentStore.commit();
      p.dependencyStore.commit();
      showToast('Changes saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Save failed: ' + (error as Error).message);
    }
  };

  const validateOperation = ({ resourceRecord, startDate, endDate, eventRecord }: any) => {
    if (!resourceRecord || resourceRecord.id === 'unscheduled') {
      return true;
    }

    const operationType = getOperationType(eventRecord?.name);
    const resourceCapabilities = capabilities[resourceRecord.id] || [];

    if (!resourceCapabilities.includes(operationType)) {
      console.warn(`Resource ${resourceRecord.name} cannot perform ${operationType} operations`);
      return {
        valid: false,
        message: `${resourceRecord.name} cannot perform ${operationType} operations`,
      };
    }

    const scheduler = schedulerRef.current?.instance;
    if (scheduler) {
      const available = scheduler.isDateRangeAvailable(startDate, endDate, resourceRecord, eventRecord);
      if (!available) {
        return { valid: false, message: `Time conflict on ${resourceRecord?.name}` };
      }
    }

    return true;
  };

  // Scheduler configuration
  const schedulerConfig = {
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: (() => {
      const end = new Date();
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);
      return end;
    })(),
    viewPreset: 'dayAndWeek',
    rowHeight: 60,  // Fixed row height for consistency
    barMargin: 10,  // Margin from top/bottom of row
    eventStyle: 'plain' as const,        // Use plain event style
    maintainSelectionOnDatasetChange: true,
    allowOverlap: false,        // Prevent events from overlapping
    passStartEndParameters: true,
    enableEventAnimations: false,  // Disable animations that might affect positioning
    useInitialAnimation: false,    // No initial animation
    project: {
      resourceStore: { data: resources },
      eventStore: { data: events },
      assignmentStore: { data: assignments },
      dependencyStore: { data: dependencies },
      stm: {
        autoRecord: true,
        disabled: false,
      },
    },
    features: {
      stripe: true,
      dependencies: {
        disabled: false,
        showTooltip: true,
        drawOnEventResize: true,
        markerStyle: 'arrow',
        lineStyle: 'solid',
      },
      eventDrag: {
        showTooltip: true,
        constrainDragToResource: false,
        validatorFn: validateOperation,
      },
      eventResize: {
        showTooltip: true,
        validatorFn: validateOperation,
      },
      eventTooltip: {
        template: ({ eventRecord, resourceRecord }: any) => {
          let durationText = '';
          if (eventRecord.startDate && eventRecord.endDate) {
            const durationMs = eventRecord.endDate - eventRecord.startDate;
            const hours = Math.round(durationMs / (1000 * 60 * 60));
            if (hours < 24) {
              durationText = `Duration: ${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
              const days = Math.round(hours / 24);
              const remainingHours = hours % 24;
              if (remainingHours > 0) {
                durationText = `Duration: ${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${
                  remainingHours !== 1 ? 's' : ''
                }`;
              } else {
                durationText = `Duration: ${days} day${days !== 1 ? 's' : ''}`;
              }
            }
          }

          return `
            <div style="padding:10px">
              <strong>${eventRecord.name}</strong><br>
              ${eventRecord.jobName ? `Job: <strong>${eventRecord.jobName}</strong><br>` : ''}
              ${eventRecord.jobId ? `Job #: ${eventRecord.jobId}<br>` : ''}
              Resource: <em>${resourceRecord?.name ?? '—'}</em><br>
              ${eventRecord.startDate ? `Start: ${eventRecord.startDate.toLocaleString()}<br>` : ''}
              ${durationText ? `${durationText}<br>` : ''}
              ${eventRecord.endDate ? `End: ${eventRecord.endDate.toLocaleString()}<br>` : ''}
              Progress: ${eventRecord.percentDone ?? 0}%
              ${
                eventRecord.isUnscheduled
                  ? '<br><span style="color:orange;font-weight:bold;">⚠ Drag to a resource to schedule</span>'
                  : ''
              }
            </div>
          `;
        },
      },
      timeRanges: { showCurrentTimeLine: true },
      percentBar: true,
      nonWorkingTime: true,
      eventMenu: true,
      scheduleMenu: true,
    },
    columns: [
      { type: 'rownumber' as const, width: 40 },
      {
        text: 'Resource',
        field: 'name',
        width: 220,
        flex: 1,
        renderer: ({ record }: any) => `${record.name} (${record.id})`,
      },
      { text: 'Department', field: 'category', width: 120 },
    ] as any,
    eventRenderer: ({ eventRecord, assignmentRecord }: any) => {
      const rid = assignmentRecord?.resourceId ?? 'unassigned';
      return `${eventRecord.name} [${rid}]`;
    },
    tbar: {
      items: [
        '->' as const,
        {
          type: 'button' as const,
          text: 'Today',
          tooltip: 'Scroll to today or first event',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (!scheduler) return;
            
            const today = new Date();
            const events = scheduler.eventStore.records;

            if (today >= scheduler.startDate && today <= scheduler.endDate) {
              scheduler.scrollToDate(today, { block: 'center', animate: true });
              showToast('Scrolled to today');
            } else if (events.length > 0) {
              const firstEvent = events.reduce((earliest: any, event: any) => {
                if (!event.startDate) return earliest;
                return !earliest || event.startDate < earliest.startDate ? event : earliest;
              }, null);

              if (firstEvent?.startDate) {
                scheduler.scrollToDate(firstEvent.startDate, { block: 'center', animate: true });
                showToast('Scrolled to first scheduled event');
              }
            } else {
              scheduler.scrollToDate(scheduler.startDate, { block: 'center', animate: true });
              showToast('Scrolled to schedule start');
            }
          },
        },
        {
          type: 'button' as const,
          text: 'Fit to View',
          tooltip: 'Zoom to show all events',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (!scheduler) return;

            if (scheduler.zoomToFit) {
              scheduler.zoomToFit({ animate: true });
              showToast('Zoomed to fit all events');
              return;
            }

            try {
              const events = scheduler.eventStore.records.filter((e: any) => e.startDate && e.endDate);
              if (events.length === 0) {
                showToast('No scheduled events to fit');
                return;
              }

              let minDate: Date | null = null;
              let maxDate: Date | null = null;

              events.forEach((event: any) => {
                if (!minDate || event.startDate < minDate) {
                  minDate = event.startDate as Date;
                }
                if (!maxDate || event.endDate > maxDate) {
                  maxDate = event.endDate as Date;
                }
              });

              if (minDate && maxDate) {
                // TypeScript now knows both are Date objects, not null
                const minTime = (minDate as Date).getTime();
                const maxTime = (maxDate as Date).getTime();
                const range = maxTime - minTime;
                const padding = range * 0.1;
                const paddedStart = new Date(minTime - padding);
                const paddedEnd = new Date(maxTime + padding);

                if (scheduler.zoomToSpan) {
                  scheduler.zoomToSpan({
                    startDate: paddedStart,
                    endDate: paddedEnd,
                  });
                } else {
                  scheduler.setTimeSpan(paddedStart, paddedEnd);
                  const centerDate = new Date((minTime + maxTime) / 2);
                  scheduler.scrollToDate(centerDate, { block: 'center', animate: false });
                }

                showToast('Zoomed to fit all events');
              }
            } catch (e) {
              console.warn('Fit to View error:', e);
              showToast('Unable to fit to view');
            }
          },
        },
        '|' as const,
        {
          type: 'button' as const,
          text: '–',
          tooltip: 'Zoom out',
          onClick: () => schedulerRef.current?.instance?.zoomOut(),
        },
        {
          type: 'slider' as const,
          width: 120,
          min: 0,
          max: 20,
          value: 10,
          showTooltip: false,
          onChange: ({ value }: any) => schedulerRef.current?.instance?.zoomToLevel(value),
        },
        {
          type: 'button' as const,
          text: '+',
          tooltip: 'Zoom in',
          onClick: () => schedulerRef.current?.instance?.zoomIn(),
        },
        '|' as const,
        {
          type: 'button' as const,
          text: 'Pack Unscheduled',
          cls: 'b-raised',
          onClick: async () => {
            await packUnscheduled();
          },
        },
        {
          type: 'button' as const,
          text: 'Optimize Schedule',
          cls: 'b-raised b-green',
          icon: 'b-fa b-fa-magic',
          onClick: async () => {
            await optimizeSchedule();
          },
        },
        {
          type: 'button' as const,
          text: 'Save',
          cls: 'b-raised b-green',
          onClick: saveManual,
        },
        {
          type: 'button' as const,
          text: 'Undo',
          tooltip: 'Undo last change',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            const stm = scheduler?.project?.stm;
            if (stm?.canUndo) {
              console.log('Undoing last action...');
              stm.undo();
              showToast('Undone');
            } else {
              showToast('Nothing to undo');
            }
          },
        },
        {
          type: 'button' as const,
          text: 'Redo',
          tooltip: 'Redo last undone change',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            const stm = scheduler?.project?.stm;
            if (stm?.canRedo) {
              console.log('Redoing last action...');
              stm.redo();
              showToast('Redone');
            } else {
              showToast('Nothing to redo');
            }
          },
        },
      ],
    },
    listeners: {
      paint: ({ source }: any) => {
        // Setup event handlers after scheduler is painted
        const scheduler = source;

        // Cleanup overlaps after initial load
        setTimeout(async () => {
          await cleanupOverlaps();

          // Unschedule some operations for testing
          const p = scheduler.project;
          const eventsToUnschedule = [
            'Fermentation - IPA',
            'Dry Hopping - IPA',
            'Packaging - IPA',
            'Milling - Wheat',
            'Mashing - Wheat',
            'Fermentation - Wheat',
          ];

          // Batch all changes for unscheduling test events
          p.beginBatch();
          
          eventsToUnschedule.forEach((eventName: string) => {
            const event = p.eventStore.find((e: any) => e.name === eventName);
            if (event) {
              const assignment = p.assignmentStore.find((a: any) => a.eventId === event.id);
              if (assignment) {
                const originalStart = event.startDate;
                const originalDuration = event.duration || 2;

                p.assignmentStore.remove(assignment);
                p.assignmentStore.add({
                  id: `a_${event.id}_unscheduled`,
                  eventId: event.id,
                  resourceId: 'unscheduled',
                });

                if (!originalStart) {
                  const today = new Date();
                  today.setHours(8, 0, 0, 0);
                  event.set({
                    startDate: today,
                    duration: originalDuration,
                    durationUnit: 'hour',
                    isUnscheduled: true,
                    eventColor: '#808080'
                  });
                } else {
                  event.set({
                    isUnscheduled: true,
                    eventColor: '#808080'
                  });
                }
              }
            }
          });
          
          p.endBatch();

          // Commit changes after batch
          await p.commitAsync();
        }, 100);

        // Validate assignment changes
        scheduler.project.assignmentStore.on('beforeAdd', ({ record }: any) => {
          // Add null check for record before accessing properties
          if (!record || !record.resourceId || !record.eventId) {
            return;
          }
          
          const resource = scheduler.resourceStore.getById(record.resourceId);
          const event = scheduler.eventStore.getById(record.eventId);

          if (!resource || !event || resource.id === 'unscheduled') {
            return;
          }

          const operationType = getOperationType(event.name);
          const resourceCapabilities = capabilities[resource.id] || [];

          if (!resourceCapabilities.includes(operationType)) {
            console.warn(`Blocking assignment: ${resource.name} cannot perform ${operationType}`);
            showToast(`${resource.name} cannot perform ${operationType} operations`);
            return false;
          }

          if (event.startDate && event.endDate) {
            if (!scheduler.isDateRangeAvailable(event.startDate, event.endDate, resource, event)) {
              console.warn(`Blocking assignment: Resource ${resource.name} is busy at that time`);
              showToast('That resource is already busy for that time range.');
              return false;
            }
          }
        });

        // Validate drop finalization
        scheduler.on('beforeEventDropFinalize', ({ context }: any) => {
          const { eventRecord, newResource, startDate, endDate } = context;

          if (newResource && newResource.id !== 'unscheduled') {
            const operationType = getOperationType(eventRecord?.name);
            const resourceCapabilities = capabilities[newResource.id] || [];

            if (!resourceCapabilities.includes(operationType)) {
              console.warn(`Blocking drop: ${newResource.name} cannot perform ${operationType}`);
              showToast(`${newResource.name} cannot perform ${operationType} operations`);
              context.valid = false;
              return false;
            }

            if (!scheduler.isDateRangeAvailable(startDate, endDate, newResource, eventRecord)) {
              console.warn(`Blocking drop: Resource ${newResource?.name} is busy at that time`);
              showToast('That resource is already busy for that time range.');
              context.valid = false;
              return false;
            }
          }
        });

        // Validate drag operations
        scheduler.on('beforeEventDrag', ({ eventRecord, resourceRecord, context }: any) => {
          if (resourceRecord && resourceRecord.id !== 'unscheduled') {
            const operationType = getOperationType(eventRecord?.name);
            const resourceCapabilities = capabilities[resourceRecord.id] || [];

            if (!resourceCapabilities.includes(operationType)) {
              context.external.invalid = true;
            }
          }
        });

        // Smooth trackpad zoom
        scheduler.on('scheduleMouseWheel', ({ event }: any) => {
          if (event.ctrlKey) {
            event.preventDefault();
            event.deltaY < 0 ? scheduler.zoomIn() : scheduler.zoomOut();
          }
        });

        // Monitor STM state changes
        scheduler.project.stm.on('recordingstop', () => {
          console.log('STM recorded action, can undo:', scheduler.project.stm.canUndo);
        });

        // Enable STM if not already enabled
        if (!scheduler.project.stm.enabled) {
          scheduler.project.stm.enable();
        }
        console.log('STM enabled:', scheduler.project.stm.enabled);
        console.log('Overlap prevention and capability validation enabled for all operations');
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer toasts={toasts} />
      <BryntumSchedulerPro 
        ref={schedulerRef} 
        {...schedulerConfig}
      />
    </div>
  );
};

export default BryntumScheduler;