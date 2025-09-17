// production-schedule-vanilla-mapfix.tsx
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    bryntum?: any;
    scheduler?: any;
    __PT_SCHEDULER_UMD_LOADING__?: boolean;
    __PT_SCHEDULER_UMD_LOADED__?: boolean;
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
    if (window.bryntum?.schedulerpro || window.__PT_SCHEDULER_UMD_LOADED__) return resolve();
    if (window.__PT_SCHEDULER_UMD_LOADING__) {
      const onReady = () => resolve();
      window.addEventListener('__pt_scheduler_umd_ready__', onReady, { once: true });
      return;
    }
    window.__PT_SCHEDULER_UMD_LOADING__ = true;
    const script = document.createElement('script');
    script.id = 'bryntum-scheduler-umd-script';
    script.src = UMD_SRC;
    script.async = true;
    script.onload = () => {
      window.__PT_SCHEDULER_UMD_LOADING__ = false;
      window.__PT_SCHEDULER_UMD_LOADED__ = true;
      window.dispatchEvent(new Event('__pt_scheduler_umd_ready__'));
      resolve();
    };
    script.onerror = () => {
      window.__PT_SCHEDULER_UMD_LOADING__ = false;
      reject(new Error('Failed to load Bryntum UMD'));
    };
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

function toStr(v: any): string | undefined {
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

export default function ProductionScheduleVanillaMapFix() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[MapFix] useEffect started');
    let destroyed = false;
    let schedulerInstance: any;

    async function init() {
      try {
        console.log('[MapFix] init() starting');
        setLoading(true);
        await ensureThemeLink();
        console.log('[MapFix] theme loaded');
        await ensureUmdScript();
        console.log('[MapFix] UMD loaded');
        const { SchedulerPro } = window.bryntum.schedulerpro;
        console.log('[MapFix] SchedulerPro class ready');

        // Timespan
        const startDate = new Date(2025, 8, 3); startDate.setHours(0, 0, 0, 0);
        const endDate   = new Date(2025, 8, 17); endDate.setHours(23, 59, 59, 999);

        // Fetch
        const [resResp, opsResp] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/pt-operations')
        ]).catch(() => [{ ok: false }, { ok: false }] as any);

        const rawResources = resResp && (resResp as any).ok ? await (resResp as any).json() : [];
        const rawOps       = opsResp && (opsResp as any).ok ? await (opsResp as any).json() : [];
        const resourcesSrc = asArray(rawResources);
        const opsSrc       = asArray(rawOps);

        // Build resource data using resource.resource_id (string) as the CANONICAL id
        const mappedResources = [
          { id: 'unscheduled', name: 'Unscheduled', category: 'Queue', eventColor: '#808080' },
          ...resourcesSrc.map((r: any, i: number) => {
            const canonicalId = toStr(r.resource_id) ?? toStr(r.id) ?? `r${i}`;
            return {
              id: canonicalId, // <-- important
              name: r.name ?? r.displayName ?? `Resource ${i + 1}`,
              category: r.category ?? r.plantName ?? r.area ?? 'Default',
              eventColor: r.isBottleneck ? 'red' : (i % 2 === 0 ? 'blue' : 'green')
            };
          })
        ];

        const idSet = new Set(mappedResources.map(r => r.id));
        const firstFew = mappedResources.slice(0, 6).map(r => r.id);
        console.log('[MapFix] Resource ids (first few):', firstFew);

        // Map operations: resourceId must match resource.resource_id
        const seen = new Set<string>();
        const mappedEvents = opsSrc.map((op: any, i: number) => {
          const id = toStr(op.id) ?? `e${i}`;
          if (seen.has(id)) return null;
          seen.add(id);

          const resourceId = toStr(op.resourceId);
          const start = op.startDate ? new Date(op.startDate)
                        : (op.startTime ? new Date(op.startTime) : null);
          let end = op.endDate ? new Date(op.endDate) : null;
          if (start && !end && op.duration) {
            const e = new Date(start);
            const hrs = op.durationUnit === 'day' ? (op.duration * 24) : (op.duration || 0);
            e.setHours(e.getHours() + hrs);
            end = e;
          }

          const exists = resourceId ? idSet.has(resourceId) : false;
          const isUnscheduled = !resourceId || !exists;

          return {
            id,
            name: op.name ?? op.operationName ?? `Op ${i + 1}`,
            jobName: op.jobName,
            operationName: op.operationName,
            startDate: start || null,
            endDate: end || null,
            duration: op.duration,
            durationUnit: op.durationUnit || 'hour',
            resourceId: isUnscheduled ? 'unscheduled' : resourceId,
            isUnscheduled,
            percentDone: op.percent_done ?? op.percentDone ?? 0,
            eventColor: isUnscheduled ? '#808080' : (op.eventColor || getOperationColor(op.operationName)),
            draggable: true,
            resizable: true
          };
        }).filter(Boolean) as any[];

        const orphanCount = mappedEvents.filter(e => e.resourceId === 'unscheduled').length;
        if (orphanCount) {
          console.warn(`[MapFix] Orphan events (resourceId not found): ${orphanCount}`);
          // Print a small sample for quick inspection
          console.warn('[MapFix] Orphan sample:', mappedEvents.find(e => e.resourceId === 'unscheduled'));
        }

        schedulerInstance = new SchedulerPro({
          appendTo: containerRef.current!,
          startDate,
          endDate,
          viewPreset: 'dayAndWeek',
          rowHeight: 60,
          barMargin: 8,
          project: {
            resourceStore: { data: mappedResources },
            eventStore: { data: mappedEvents },
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

        if (!destroyed) {
          // Diagnostics
          // @ts-ignore
          const rCount = schedulerInstance?.project?.resourceStore?.count;
          // @ts-ignore
          const eCount = schedulerInstance?.project?.eventStore?.count;
          console.log('[MapFix] Scheduler ready', { resources: rCount, events: eCount });
          setLoading(false);
          setError(null);
        }
      } catch (e: any) {
        console.error('[MapFix] Failed to initialize', e);
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