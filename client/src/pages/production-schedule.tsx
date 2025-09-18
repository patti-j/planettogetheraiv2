// production-schedule.tsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * ProductionSchedule (vanilla UMD integration)
 * - Loads Bryntum Scheduler Pro via /schedulerpro.umd.js and theme CSS
 * - Uses AssignmentStore (no event.resourceId) to avoid "everything on one resource" issues
 * - Canonical resource id is the string `resource_id` from /api/resources
 * - Maps operations.resourceId (string) to resource.resource_id (string)
 * - Adds an "Unscheduled" lane (events without valid assignment appear there visually)
 * - Drag event between rows updates assignment (or removes it when dropping to Unscheduled)
 * - Single-init guard for React 18 StrictMode
 * - Console diagnostics to spot data mismatches fast
 *
 * Endpoints expected:
 *   GET /api/resources       -> [{ resource_id: "1", name: "Resource A", ... }, ...]
 *   GET /api/pt-operations   -> [{ id, name, resourceId: "1", startDate/endDate or duration* }, ...]
 *
 * Static assets expected (match your standalone HTML):
 *   /schedulerpro.umd.js
 *   /schedulerpro.classic-light.css  (or your chosen theme)
 */

declare global {
  interface Window {
    bryntum?: any;
    scheduler?: any;
    __PT_SCHED_UMD_LOADING__?: boolean;
    __PT_SCHED_UMD_LOADED__?: boolean;
  }
}

const THEME_HREF = '/schedulerpro.classic-light.css';
const UMD_SRC    = '/schedulerpro.umd.js';

function ensureThemeLink(): Promise<void> {
  return new Promise((resolve) => {
    const id = 'bryntum-scheduler-theme-link';
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    if (existing) return resolve();
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = THEME_HREF;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

function ensureUmdScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.bryntum?.schedulerpro || window.__PT_SCHED_UMD_LOADED__) return resolve();
    if (window.__PT_SCHED_UMD_LOADING__) {
      const onReady = () => resolve();
      window.addEventListener('__pt_sched_umd_ready__', onReady, { once: true });
      return;
    }
    window.__PT_SCHED_UMD_LOADING__ = true;
    const script = document.createElement('script');
    script.id = 'bryntum-scheduler-umd-script';
    script.src = UMD_SRC;
    script.async = true;
    script.onload = () => {
      window.__PT_SCHED_UMD_LOADING__ = false;
      window.__PT_SCHED_UMD_LOADED__ = true;
      window.dispatchEvent(new Event('__pt_sched_umd_ready__'));
      resolve();
    };
    script.onerror = () => {
      window.__PT_SCHED_UMD_LOADING__ = false;
      reject(new Error('Failed to load Bryntum UMD'));
    };
    document.body.appendChild(script);
  });
}

// Helpers
function A<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function S(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return String(v);
}

function getOperationColor(opName?: string) {
  const s = (opName || '').toLowerCase();
  if (s.includes('cut')) return 'blue';
  if (s.includes('form')) return 'indigo';
  if (s.includes('paint')) return 'orange';
  if (s.includes('inspect')) return 'green';
  return 'cyan';
}

export default function ProductionSchedule() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initOnce = useRef(false);

  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    let destroyed = false;
    let scheduler: any;

    async function init() {
      try {
        setLoading(true);
        await ensureThemeLink();
        await ensureUmdScript();

        const { SchedulerPro } = window.bryntum.schedulerpro;

        // Timespan (match your standalone if desired)
        const startDate = new Date(2025, 8, 3); startDate.setHours(0, 0, 0, 0);
        const endDate   = new Date(2025, 8, 17); endDate.setHours(23, 59, 59, 999);

        // Fetch data
        const [resResp, opsResp] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/pt-operations')
        ]).catch(() => [{ ok: false }, { ok: false }] as any);

        const rawResources = resResp && (resResp as any).ok ? await (resResp as any).json() : [];
        const rawOps       = opsResp && (opsResp as any).ok ? await (opsResp as any).json() : [];

        const resourcesSrc = A(rawResources);
        const opsSrc       = A(rawOps);

        // Build resources (canonical id = resource.resource_id string)
        const mappedResources = [
          { id: 'unscheduled', name: 'Unscheduled', category: 'Queue', eventColor: '#808080' },
          ...resourcesSrc.map((r: any, i: number) => ({
            id: S(r.resource_id) ?? S(r.id) ?? `r${i}`,           // canonical string id
            name: r.name ?? r.displayName ?? `Resource ${i + 1}`,
            category: r.category ?? r.plantName ?? r.area ?? 'Default',
            eventColor: r.isBottleneck ? 'red' : (i % 2 === 0 ? 'blue' : 'green')
          }))
        ];

        // Build events (NO resourceId here; use assignments instead)
        const seen = new Set<string>();
        const mappedEvents = opsSrc.map((op: any, i: number) => {
          const id = S(op.id) ?? `e${i}`;
          if (seen.has(id)) return null;
          seen.add(id);

          const start = op.startDate ? new Date(op.startDate)
                        : (op.startTime ? new Date(op.startTime) : null);
          let end = op.endDate ? new Date(op.endDate) : null;
          if (start && !end && op.duration) {
            const e = new Date(start);
            const hrs = op.durationUnit === 'day' ? (op.duration * 24) : (op.duration || 0);
            e.setHours(e.getHours() + hrs);
            end = e;
          }

          return {
            id,
            name: op.name ?? op.operationName ?? `Op ${i + 1}`,
            jobName: op.jobName,
            operationName: op.operationName,
            startDate: start || null,
            endDate: end || null,
            duration: op.duration,
            durationUnit: op.durationUnit || 'hour',
            percentDone: op.percent_finished ?? op.percent_done ?? op.percentDone ?? 0,
            isUnscheduled: false,            // will be set after assignments mapping
            eventColor: getOperationColor(op.operationName),
            draggable: true,
            resizable: true
          };
        }).filter(Boolean) as any[];

        // Build assignments from op.resourceId → resource.resource_id
        const resourceIdSet = new Set(mappedResources.map(r => r.id));
        const mappedAssignments: any[] = [];
        for (const op of opsSrc) {
          const eid = S(op.id);
          const rid = S(op.resourceId ?? op.resource_id);
          if (!eid) continue;
          if (rid && resourceIdSet.has(rid)) {
            mappedAssignments.push({ id: `a_${eid}`, eventId: eid, resourceId: rid });
          }
        }

        // Orphans: mark events without assignments as Unscheduled (visual hint via color/flag)
        const assignedEventIds = new Set(mappedAssignments.map(a => a.eventId));
        for (const ev of mappedEvents) {
          if (!assignedEventIds.has(ev.id)) {
            ev.isUnscheduled = true;
            ev.eventColor = '#808080';
          }
        }

        // Diagnostics
        console.log('[ProdSched] Resources sample:', mappedResources.slice(0, 5).map(r => r.id));
        console.log('[ProdSched] Events sample:', mappedEvents.slice(0, 3).map(e => ({ id: e.id, name: e.name })));
        console.log('[ProdSched] Assignments sample:', mappedAssignments.slice(0, 5));
        const orphanCount = mappedEvents.length - assignedEventIds.size;
        if (orphanCount) {
          console.warn(`[ProdSched] Orphan events (no assignment): ${orphanCount}`);
        }

        // Instantiate SchedulerPro with explicit stores
        const { SchedulerPro: SP } = window.bryntum.schedulerpro;
        scheduler = new SP({
          appendTo: containerRef.current!,
          startDate,
          endDate,
          viewPreset: 'dayAndWeek',
          rowHeight: 60,
          barMargin: 8,
          project: {
            resourceStore:   { data: mappedResources },
            eventStore:      { data: mappedEvents },
            assignmentStore: { data: mappedAssignments },
            dependencyStore: { data: [] }
          },
          features: {
            dependencies: true,
            eventDrag: { showTooltip: true, constrainDragToResource: false },
            eventResize: { showTooltip: true },
            eventTooltip: {
              template: ({ eventRecord }: any) => `
                <div style="padding:10px">
                  <strong>${eventRecord.name}</strong><br>
                  ${eventRecord.startDate ? `Start: ${eventRecord.startDate.toLocaleString()}<br>` : ''}
                  ${eventRecord.duration ? `Duration: ${eventRecord.duration} ${eventRecord.durationUnit || 'hour'}<br>` : ''}
                  Progress: ${eventRecord.percentDone ?? 0}%
                  ${eventRecord.isUnscheduled ? '<br><span style="color:orange;font-weight:bold;">⚠️ Unscheduled - Drag to a resource</span>' : ''}
                  ${eventRecord.jobName ? `<br>Job: ${eventRecord.jobName}` : ''}
                  ${eventRecord.operationName ? `<br>Operation: ${eventRecord.operationName}` : ''}
                </div>
              `
            },
            timeRanges: { showCurrentTimeLine: true },
            percentBar: true,
            nonWorkingTime: true,
            eventMenu: true,
            scheduleMenu: true
          },
          columns: [
            { text: 'Resource', field: 'name', width: 220 },
            { text: 'Category', field: 'category', width: 160 }
          ]
        });

        // Drag/drop: move assignment to new resource or remove assignment for Unscheduled
        scheduler.on('eventdrop', ({ eventRecords, targetResourceRecord }: any) => {
          const aStore = scheduler.project.assignmentStore;
          const droppingToUnscheduled = targetResourceRecord?.id === 'unscheduled';

          eventRecords.forEach((ev: any) => {
            // Find existing assignment (assuming single assignment per op)
            const existing = aStore.find((a: any) => a.eventId === ev.id);
            if (droppingToUnscheduled) {
              // Remove assignment → becomes unscheduled
              if (existing) aStore.remove(existing);
              ev.isUnscheduled = true;
              ev.eventColor = '#808080';
              ev.constraintType = null;
              ev.constraintDate = null;
            } else {
              const newResourceId = String(targetResourceRecord.id);
              if (existing) {
                existing.resourceId = newResourceId;
              } else {
                aStore.add({ id: `a_${ev.id}`, eventId: ev.id, resourceId: newResourceId });
              }
              ev.isUnscheduled = false;
              ev.eventColor = getOperationColor(ev.operationName);
              ev.constraintType = 'startnoearlierthan';
              ev.constraintDate = ev.startDate;
            }
          });
        });

        if (!destroyed) {
          window.scheduler = scheduler;
          const rCount = scheduler?.project?.resourceStore?.count;
          const eCount = scheduler?.project?.eventStore?.count;
          const aCount = scheduler?.project?.assignmentStore?.count;
          console.log('[ProdSched] Scheduler ready', { resources: rCount, events: eCount, assignments: aCount });
          setLoading(false);
          setError(null);
        }
      } catch (e: any) {
        console.error('[ProdSched] Failed to initialize', e);
        if (!destroyed) {
          setError(e?.message || 'Failed to initialize scheduler');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      try {
        if (window.scheduler && window.scheduler.destroy) {
          window.scheduler.destroy();
          window.scheduler = undefined;
        }
      } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col h-[700px]">
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-lg">Loading Production Schedule...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-500 text-center">
              <h3 className="text-xl font-bold mb-2">Error</h3>
              <p>{error}</p>
              <p className="text-sm mt-2 text-gray-600">
                Make sure schedulerpro.umd.js and schedulerpro.classic-light.css are available in your public folder.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}