// production-schedule.tsx (simplified, working version)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { ProjectModel } from '@bryntum/schedulerpro';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

type PTResource = {
  id: number;
  name: string;
  plantName?: string;
  capacity?: number;
  efficiency?: number;
  isBottleneck?: boolean;
  active?: boolean;
};

type PTOperation = {
  id: number;
  name: string;
  jobName?: string;
  operationName?: string;
  resourceId?: number | string;   // PT numeric; we'll map to string
  startDate?: string;             // ISO
  endDate?: string;               // ISO
  duration?: number;              // hours (if no endDate)
  durationUnit?: 'hour' | 'minute' | 'day';
  percent_done?: number;
  eventColor?: string;
  isUnscheduled?: boolean;
};

type PTDependency = {
  id: string;
  from: number | string;
  to: number | string;
  type?: number;     // 2 = FS
  lag?: number;
  lagUnit?: 'hour' | 'day';
};

const UNSCHEDULED_ID = 'unscheduled';

// Color helper similar to your HTML getOperationColor()
function getOperationColor(opName?: string) {
  const s = (opName || '').toLowerCase();
  if (s.includes('cut')) return 'blue';
  if (s.includes('form')) return 'indigo';
  if (s.includes('paint')) return 'orange';
  if (s.includes('inspect')) return 'green';
  return 'cyan';
}

export default function ProductionSchedulePage() {
  const schedulerRef = useRef<any>(null);
  const projectRef = useRef<ProjectModel | null>(null);

  // Timespan - use broader range to capture all operations
  const startDate = useMemo(() => new Date(2025, 7, 1, 0, 0, 0, 0), []); // August 1, 2025
  const endDate   = useMemo(() => new Date(2025, 9, 31, 23, 59, 59, 999), []); // October 31, 2025

  // App state 
  const [loading, setLoading] = useState(true);

  // Initialize ProjectModel and load PT data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Create ProjectModel instance
        const project = new ProjectModel({
          autoLoad: false,
          autoSync: false
        });

        projectRef.current = project;

        // Replace with your actual endpoints if different:
        const [resRes, opsRes] = await Promise.all([
          fetch('/api/pt-resources'),
          fetch('/api/pt-operations')
        ]);

        const ptResources: PTResource[]  = await resRes.json();
        const ptOperations: PTOperation[] = await opsRes.json();

        // Map PT resources to Bryntum resources
        const mappedResources = [
          // Unscheduled lane at the top
          {
            id: UNSCHEDULED_ID,
            name: 'Unscheduled',
            category: 'Queue',
            eventColor: '#808080'
          },
          ...ptResources.map((r, i) => ({
            id: String(r.id), // PT resources already have string IDs
            name: r.name || `Resource ${r.id}`,
            category: r.plantName || 'Main Plant',
            eventColor: r.isBottleneck ? 'red' : (i % 2 === 0 ? 'blue' : 'green')
          }))
        ];

        console.log('🔧 Mapped Resources:', mappedResources);

        // Map PT operations to Bryntum events; if resourceId missing ⇒ unscheduled
        const mappedEvents = ptOperations.map(op => {
          const start = op.startDate ? new Date(op.startDate) : null;
          let end     = op.endDate ? new Date(op.endDate) : null;

          // If only duration present, compute end
          if (start && !end && op.duration) {
            const e = new Date(start);
            const hours = op.durationUnit === 'day' ? (op.duration * 24) : (op.duration || 0);
            e.setHours(e.getHours() + hours);
            end = e;
          }

          // PT operations have string resourceId, check if it exists
          const unscheduled = !op.resourceId || op.resourceId === '0' || op.resourceId === 0;
          const resourceId = unscheduled ? UNSCHEDULED_ID : String(op.resourceId);

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

        console.log('🔧 Mapped Events:', mappedEvents.slice(0, 3));
        console.log('🔧 Resource IDs in events:', [...new Set(mappedEvents.map(e => e.resourceId))]);

        // Optional: infer simple FS dependencies by job sequence if you have hints
        // Exactly like your HTML: build dependencies between sequential ops on different resources
        const inferredDeps: PTDependency[] = []; // keep empty unless you have data
        const mappedDeps = inferredDeps.map(d => ({
          id: d.id,
          from: String(d.from),
          to: String(d.to),
          type: d.type ?? 2,
          lag: d.lag ?? 0,
          lagUnit: d.lagUnit ?? 'hour'
        }));

        if (!cancelled) {
          // Load data into the project model
          await project.loadInlineData({
            resources: mappedResources,
            events: mappedEvents,
            dependencies: mappedDeps
          });
        }
      } catch (e) {
        console.error('Failed to load schedule data', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Features and renderers (mirror your HTML)
  const features = useMemo(() => ({
    dependencies: true,
    eventDrag: {
      showTooltip: true,
      constrainDragToResource: false,
      // Allow dragging from Unscheduled to a real resource (and vice versa)
      validatorFn() { return true; }
    },
    eventResize: { showTooltip: true },
    eventTooltip: {
      template: ({ eventRecord }: any) => `
        <div style="padding:10px">
          <strong>${eventRecord.name}</strong><br>
          ${eventRecord.startDate ? `Start: ${eventRecord.startDate.toLocaleString()}<br>` : ``}
          ${eventRecord.duration ? `Duration: ${eventRecord.duration} ${eventRecord.durationUnit || `hour`}<br>` : ``}
          Progress: ${eventRecord.percentDone ?? 0}%
          ${eventRecord.isUnscheduled ? `<br><span style="color:orange;font-weight:bold;">⚠️ Unscheduled - Drag to a resource</span>` : ``}
          ${eventRecord.jobName ? `<br>Job: ${eventRecord.jobName}` : ``}
          ${eventRecord.operationName ? `<br>Operation: ${eventRecord.operationName}` : ``}
        </div>
      `
    },
    timeRanges: { showCurrentTimeLine: true },
    percentBar: true,
    nonWorkingTime: true,
    criticalPaths: false,
    eventMenu: true,
    scheduleMenu: true
  }), []);

  // Match the HTML's renderer (set color + two-line content)
  const eventRenderer = useMemo(() => {
    return ({ eventRecord, renderData }: any) => {
      renderData.eventColor = eventRecord.eventColor;
      return {
        html: `
          <div style="padding:4px;">
            <div style="font-weight:500;font-size:12px;">${eventRecord.name}</div>
            <div style="font-size:11px;opacity:0.8;">
              ${eventRecord.percentDone ?? 0}% complete
            </div>
          </div>
        `
      };
    };
  }, []);

  // Handle the unscheduled <-> scheduled drag like your HTML
  const onEventDrop = ({ eventRecords, targetResourceRecord }: any) => {
    const scheduler = schedulerRef.current?.instance;
    if (!scheduler) return;

    eventRecords.forEach((ev: any) => {
      const draggedToUnscheduled = targetResourceRecord?.id === UNSCHEDULED_ID;
      if (ev.isUnscheduled && !draggedToUnscheduled) {
        // Now scheduled
        ev.isUnscheduled = false;
        ev.eventColor = getOperationColor(ev.operationName);
        ev.constraintType = 'startnoearlierthan';
        ev.constraintDate = ev.startDate;
      } else if (!ev.isUnscheduled && draggedToUnscheduled) {
        // Back to unscheduled
        ev.isUnscheduled = true;
        ev.eventColor = '#808080';
        ev.constraintType = null;
        ev.constraintDate = null;
      }
    });
  };

  // Assign project to scheduler when both are ready
  useEffect(() => {
    const scheduler = schedulerRef.current?.instance;
    const project = projectRef.current;
    
    if (scheduler && project && !loading) {
      console.log('🔧 Assigning ProjectModel to scheduler');
      scheduler.project = project;
    }
  }, [loading]);

  // Scheduler config using ProjectModel instance
  const schedulerConfig = useMemo(() => ({
    columns: [
      { text: 'Resource', field: 'name', width: 200 },
      { text: 'Category', field: 'category', width: 150 }
    ],
    viewPreset: 'dayAndWeek',
    rowHeight: 60,
    barMargin: 8,
    height: 600, // Fix sizing warning
    startDate,
    endDate,
    // No project prop - will be assigned via scheduler.project property
    features,
    eventRenderer
  }), [startDate, endDate, features, eventRenderer]);

  return (
    <div style={{ padding: 16 }}>
      {loading ? (
        <div style={{ height: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading production schedule…</div>
        </div>
      ) : (
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerConfig}
          // Events
          onEventDrop={onEventDrop}
        />
      )}
    </div>
  );
}