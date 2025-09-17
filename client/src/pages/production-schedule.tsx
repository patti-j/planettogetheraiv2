// production-schedule-vanilla-fix.tsx
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    bryntum?: any;
    scheduler?: any;
  }
}

const THEME_HREF = '/schedulerpro.classic-light.css?v=3';
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
    if (window.bryntum?.schedulerpro) return resolve();
    const id = 'bryntum-scheduler-umd-script';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Bryntum UMD')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = UMD_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Bryntum UMD'));
    document.body.appendChild(script);
  });
}

// Helpers
function asArray(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function toStrId(v: any, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    if ('id' in v) return toStrId((v as any).id, fallback);
    if ('_id' in v) return toStrId((v as any)._id, fallback);
  }
  try { return String(v); } catch { return fallback; }
}

function getOperationColor(opName?: string) {
  const s = (opName || '').toLowerCase();
  if (s.includes('cut')) return 'blue';
  if (s.includes('form')) return 'indigo';
  if (s.includes('paint')) return 'orange';
  if (s.includes('inspect')) return 'green';
  return 'cyan';
}

export default function ProductionScheduleVanillaFix() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let destroyed = false;
    let schedulerInstance: any;

    async function init() {
      try {
        setLoading(true);
        await ensureThemeLink();
        await ensureUmdScript();

        const { SchedulerPro } = window.bryntum.schedulerpro;

        // Timespan: match standalone
        const startDate = new Date(2025, 8, 3); startDate.setHours(0, 0, 0, 0);
        const endDate   = new Date(2025, 8, 17); endDate.setHours(23, 59, 59, 999);

        // Fetch
        const [resResp, opsResp] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/pt-operations')
        ]).catch((e) => {
          console.warn('Fetch failed, continuing with empty arrays', e);
          return [{ ok: false }, { ok: false }] as any;
        });

        const rawResources = resResp && (resResp as any).ok ? await (resResp as any).json() : [];
        const rawOps       = opsResp && (opsResp as any).ok ? await (opsResp as any).json() : [];

        // Normalize
        const resourcesSrc = asArray(rawResources);
        const opsSrc       = asArray(rawOps);

        const resourceData = [
          { id: 'unscheduled', name: 'Unscheduled', category: 'Queue', eventColor: '#808080' },
          ...resourcesSrc.map((r: any, i: number) => ({
            id: toStrId(r.id ?? r.external_id ?? r.resourceId ?? r.name, `r${i}`),
            name: (r.name ?? r.displayName ?? `Resource ${i + 1}`),
            category: (r.category ?? r.plantName ?? r.area ?? 'Default'),
            eventColor: r.isBottleneck ? 'red' : (i % 2 === 0 ? 'blue' : 'green')
          }))
        ];

        const resourceIdSet = new Set(resourceData.map(r => r.id));

        // Deduplicate events by id, normalize resourceId to string
        const seen = new Set<string>();
        const eventData = opsSrc.map((op: any, i: number) => {
          const id = toStrId(op.id ?? op.operationId ?? `e${i}`, `e${i}`);
          if (seen.has(id)) return null;
          seen.add(id);

          const start = op.startDate ? new Date(op.startDate)
                        : (op.startTime ? new Date(op.startTime) : null);
          let end = op.endDate ? new Date(op.endDate) : null;
          if (start && !end && op.duration) {
            const e = new Date(start);
            const hours = op.durationUnit === 'day' ? (op.duration * 24) : (op.duration || 0);
            e.setHours(e.getHours() + hours);
            end = e;
          }

          const rawResId = (op.resourceId ?? op.machineId ?? op.resource_id);
          const unscheduled = !rawResId || rawResId === 0 || rawResId === '0' || rawResId === 'unscheduled';
          const resourceId = unscheduled ? 'unscheduled' : toStrId(rawResId, 'unscheduled');

          return {
            id,
            name: op.name ?? op.operationName ?? `Op ${i + 1}`,
            jobName: op.jobName,
            operationName: op.operationName,
            startDate: start || null,
            endDate: end || null,
            duration: op.duration,
            durationUnit: op.durationUnit || 'hour',
            resourceId,
            isUnscheduled: unscheduled || !resourceIdSet.has(String(resourceId)),
            percentDone: op.percent_done ?? op.percentDone ?? 0,
            eventColor: unscheduled ? '#808080' : (op.eventColor || getOperationColor(op.operationName)),
            draggable: true,
            resizable: true
          };
        }).filter(Boolean) as any[];

        // Mark orphans (resourceId not in store) as unscheduled
        const orphans = eventData.filter(e => e.resourceId !== 'unscheduled' && !resourceIdSet.has(String(e.resourceId)));
        if (orphans.length) {
          console.warn(`[Scheduler] Found ${orphans.length} events with non-matching resourceId. Example:`, orphans[0]);
          for (const ev of orphans) {
            ev.isUnscheduled = true;
            ev.resourceId = 'unscheduled';
            ev.eventColor = '#808080';
          }
        }

        // Create assignments (required for Scheduler Pro functionality)
        const assignments = eventData
          .filter(e => e.resourceId) // Include all events, even unscheduled
          .map((e, i) => ({
            id: `a-${e.id}`,
            eventId: e.id,
            resourceId: e.resourceId
          }));

        // Remove resourceId from events (assignments handle the relationship)
        const eventsForScheduler = eventData.map(({ resourceId, ...rest }) => rest);

        // Instantiate using store configs (non-deprecated) with AssignmentStore
        schedulerInstance = new SchedulerPro({
          appendTo: containerRef.current!,
          startDate,
          endDate,
          viewPreset: 'dayAndWeek',
          rowHeight: 60,
          barMargin: 8,
          project: {
            resourceStore: { data: resourceData },
            eventStore: { data: eventsForScheduler },
            assignmentStore: { data: assignments },
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
            { text: 'Resource', field: 'name', width: 200 },
            { text: 'Category', field: 'category', width: 150 }
          ]
        });

        schedulerInstance.on('eventdrop', ({ eventRecords, targetResourceRecord }: any) => {
          eventRecords.forEach((eventRecord: any) => {
            if (eventRecord.isUnscheduled && targetResourceRecord.id !== 'unscheduled') {
              eventRecord.isUnscheduled = false;
              eventRecord.eventColor = getOperationColor(eventRecord.operationName);
              eventRecord.constraintType = 'startnoearlierthan';
              eventRecord.constraintDate = eventRecord.startDate;
            } else if (!eventRecord.isUnscheduled && targetResourceRecord.id === 'unscheduled') {
              eventRecord.isUnscheduled = true;
              eventRecord.eventColor = '#808080';
              eventRecord.constraintType = null;
              eventRecord.constraintDate = null;
            }
          });
        });

        if (!destroyed) {
          window.scheduler = schedulerInstance;
          // Diagnostics
          // @ts-ignore
          const rCount = schedulerInstance?.project?.resourceStore?.count;
          // @ts-ignore
          const eCount = schedulerInstance?.project?.eventStore?.count;
          console.log('[Scheduler] Ready', { resources: rCount, events: eCount });
          console.log('[Scheduler] Resource IDs:', Array.from(resourceIdSet).slice(0, 10), '...');
          console.log('[Scheduler] Sample event:', eventData[0]);
          setLoading(false);
          setError(null);
        }
      } catch (e: any) {
        console.error('Failed to initialize vanilla SchedulerPro', e);
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
        if (schedulerInstance && schedulerInstance.destroy) {
          schedulerInstance.destroy();
        }
      } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col h-[700px]">
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div>Loading production schedule…</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}