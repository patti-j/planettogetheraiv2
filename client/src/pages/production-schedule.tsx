// production-schedule-vanilla.tsx
import React, { useEffect, useRef, useState } from 'react';

// This component embeds Bryntum Scheduler Pro via the UMD bundle (`/schedulerpro.umd.js`)
// and theme CSS (`/schedulerpro.classic-light.css`) — same as your working HTML.
// It mirrors the unscheduled lane, drag-to-schedule behavior, tooltips, percent bar,
// and date span used in your standalone page.
//
// Prereqs (match your standalone page):
//   • Host these assets somewhere your app can reach them:
//       /schedulerpro.umd.js
//       /schedulerpro.classic-light.css
//   • Your backend should expose:
//       GET /api/resources
//       GET /api/pt-operations
//
// Notes:
//   • We dynamically inject the CSS/JS if they're not already present.
//   • On unmount, we destroy the Bryntum instance to avoid leaks.

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

// Color helper similar to your HTML
function getOperationColor(opName?: string) {
  const s = (opName || '').toLowerCase();
  if (s.includes('cut')) return 'blue';
  if (s.includes('form')) return 'indigo';
  if (s.includes('paint')) return 'orange';
  if (s.includes('inspect')) return 'green';
  return 'cyan';
}

export default function ProductionScheduleVanilla() {
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

        // Timespan: Sep 3–17, 2025 (matches the standalone page)
        const startDate = new Date(2025, 8, 3); // months 0-based
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(2025, 8, 17);
        endDate.setHours(23, 59, 59, 999);

        // Fetch resources and PT operations from your backend (same routes as the HTML)
        let resources: any[] = [];
        let ptOperations: any[] = [];

        const [resResp, opsResp] = await Promise.all([
          fetch('/api/resources'),
          fetch('/api/pt-operations')
        ]);

        resources = resResp.ok ? await resResp.json() : [];
        ptOperations = opsResp.ok ? await opsResp.json() : [];

        // If backend not ready, add minimal sample data (optional)
        if (!resources || resources.length === 0) {
          resources = [
            { id: 'cnc1', name: 'CNC Machine 1', category: 'Machining' },
            { id: 'assembly1', name: 'Assembly Line 1', category: 'Assembly' }
          ];
        }

        // Add the "Unscheduled" lane at the top
        const resourceData = [
          { id: 'unscheduled', name: 'Unscheduled', category: 'Queue', eventColor: '#808080' },
          ...resources.map((r: any, i: number) => ({
            id: String(r.id ?? r.external_id ?? r.name ?? `r${i}`),
            name: r.name ?? `Resource ${i + 1}`,
            category: r.category ?? r.plantName ?? 'Default',
            eventColor: r.isBottleneck ? 'red' : (i % 2 === 0 ? 'blue' : 'green')
          }))
        ];

        // Map PT operations to events
        const eventData = (ptOperations || []).map((op: any) => {
          const start = op.startDate ? new Date(op.startDate) : (op.startTime ? new Date(op.startTime) : null);
          let end = op.endDate ? new Date(op.endDate) : null;

          if (start && !end && op.duration) {
            const e = new Date(start);
            const hours = op.durationUnit === 'day' ? (op.duration * 24) : (op.duration || 0);
            e.setHours(e.getHours() + hours);
            end = e;
          }

          const unscheduled = !op.resourceId || op.resourceId === 0;
          const resourceId = unscheduled ? 'unscheduled' : String(op.resourceId);

          return {
            id: String(op.id),
            name: op.name,
            jobName: op.jobName,
            operationName: op.operationName,
            startDate: start || null,
            endDate: end || null,
            duration: op.duration,
            durationUnit: op.durationUnit || 'hour',
            resourceId,
            isUnscheduled: unscheduled,
            percentDone: op.percent_done ?? 0,
            eventColor: unscheduled ? '#808080' : (op.eventColor || getOperationColor(op.operationName)),
            draggable: true,
            resizable: true
          };
        });

        // Create the scheduler like in the HTML (vanilla)
        schedulerInstance = new SchedulerPro({
          appendTo: containerRef.current!,
          startDate,
          endDate,
          viewPreset: 'dayAndWeek',
          rowHeight: 60,
          barMargin: 8,
          // Project inline data
          project: {
            resources: resourceData,
            events: eventData,
            dependencies: []
          },
          // Features mirroring the HTML
          features: {
            dependencies: true,
            eventDrag: {
              showTooltip: true,
              constrainDragToResource: false
            },
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

        // Unschedule <-> schedule drag logic (from your HTML)
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