import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Offline-friendly Scheduler Pro-style demo (no external imports)
 * ---------------------------------------------------------------------------
 * Why: The sandbox/build environment cannot fetch external URLs (Bryntum npm
 * packages and CSS), causing build errors. This file removes those imports and
 * renders a lightweight, self-contained timeline with drag & drop that mirrors
 * the data model we intended for Scheduler Pro (resources + events + assignments).
 *
 * ✅ Uses Assignment-style mapping (events placed on rows via assignments)
 * ✅ Drag horizontally to reschedule (snap to 15 min)
 * ✅ Drag vertically to reassign to another resource
 * ✅ No external CSS/JS; runs in restricted environments
 *
 * When you run in a real app with network access, you can swap this component
 * for the Bryntum version and feed the same `resourcesData / eventsData /
 * assignmentsData`.
 */

// ---- Time helpers ----------------------------------------------------------
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Convert Date -> ms
const toMs = (d: Date | string | number) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

// Snap a date (ms) to nearest step (ms)
function snapMs(ms: number, stepMs: number) {
  return Math.round(ms / stepMs) * stepMs;
}

// ---- Sample data (Assignment-driven) ---------------------------------------
const startDate = new Date(2025, 3, 1, 8); // 08:00 local
const endDate   = new Date(2025, 3, 1, 18); // 18:00 local

// Resource rows
const resourcesData = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

// Events (no resourceId — assignments drive placement)
const eventsDataInitial = [
  { id: 1, name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 2, name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, name: 'Disinfectant efficacy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 11) },
  { id: 7, name: 'DNA Sequencing',         startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// Each event assigned to a resource
const assignmentsDataInitial = [
  { id: 1, event: 1, resource: 1 },
  { id: 2, event: 2, resource: 1 },
  { id: 3, event: 3, resource: 2 },
  { id: 4, event: 4, resource: 2 },
  { id: 5, event: 5, resource: 3 },
  { id: 6, event: 6, resource: 4 },
  { id: 7, event: 7, resource: 5 }
];

// ---- Small test cases (run once) ------------------------------------------
(function runUnitTests() {
  const step = 15 * MINUTE;
  console.assert(snapMs(0, step) === 0, 'snap 0 -> 0');
  console.assert(snapMs(7.5 * MINUTE, step) === 15 * MINUTE, 'snap 7.5min -> 15min');
  // mapping: event 1 -> resource 1
  const map = new Map(assignmentsDataInitial.map(a => [a.event, a.resource]));
  console.assert(map.get(1) === 1 && map.get(7) === 5, 'assignments map events to resources');
})();

// ---- Styles (inline, no external CSS) -------------------------------------
const styles = {
  page: {
    minHeight: '100vh', 
    background: '#f8fafc', 
    padding: 16, 
    boxSizing: 'border-box' as const, 
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  },
  shell: {
    background: '#fff', 
    borderRadius: 12, 
    boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.1)', 
    overflow: 'hidden'
  },
  header: { 
    padding: '16px 16px 0 16px' 
  },
  sub: { 
    opacity: .8, 
    margin: '4px 0 12px 0' 
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: '220px 1fr', 
    height: 520 
  },
  left: { 
    borderRight: '1px solid #e5e7eb', 
    background: '#fff' 
  },
  right: { 
    position: 'relative' as const, 
    background: '#fff' 
  },
  resourceRow: { 
    display: 'flex', 
    alignItems: 'center', 
    height: 60, 
    padding: '0 12px', 
    borderBottom: '1px solid #f1f5f9' 
  },
  timeRow: { 
    position: 'relative' as const, 
    height: 60, 
    borderBottom: '1px solid #f1f5f9' 
  },
  hourTick: { 
    position: 'absolute' as const, 
    top: 0, 
    bottom: 0, 
    width: 1, 
    background: '#e5e7eb' 
  },
  label: { 
    fontWeight: 600 
  },
  eventBox: {
    position: 'absolute' as const, 
    height: 32, 
    borderRadius: 8, 
    boxShadow: '0 1px 2px rgba(0,0,0,.08)',
    background: '#3b82f6', 
    color: 'white', 
    fontSize: 12, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 8px', 
    cursor: 'grab', 
    userSelect: 'none' as const
  }
};

interface Event {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

interface Assignment {
  id: number;
  event: number;
  resource: number;
}

interface DragState {
  eventId: number;
  startX: number;
  origX: number;
  origResourceIdx: number;
}

// ---- React Component -------------------------------------------------------
export default function SchedulerDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const [eventsData, setEventsData] = useState<Event[]>(eventsDataInitial);
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>(assignmentsDataInitial);
  const [paneWidth, setPaneWidth] = useState(800);

  // map: eventId -> resourceId
  const assignmentMap = useMemo(() => {
    const m = new Map<number, number>();
    assignmentsData.forEach(a => m.set(a.event, a.resource));
    return m;
  }, [assignmentsData]);

  // time helpers dependent on width
  const startMs = toMs(startDate);
  const endMs = toMs(endDate);
  const totalMs = endMs - startMs;
  const pxPerMs = paneWidth / totalMs;
  const msPerPx = totalMs / paneWidth;
  const stepMs = 15 * MINUTE; // 15 min snap

  function dateToX(date: Date) { 
    return (toMs(date) - startMs) * pxPerMs; 
  }
  
  function durationToW(ms: number) { 
    return Math.max(6, ms * pxPerMs); // min width
  }
  
  function xToDate(x: number) { 
    return new Date(snapMs(startMs + x * msPerPx, stepMs)); 
  }

  // measure right pane width
  useEffect(() => {
    if (!rightPaneRef.current) return;
    const ro = new ResizeObserver(() => setPaneWidth(rightPaneRef.current?.clientWidth || 800));
    ro.observe(rightPaneRef.current);
    setPaneWidth(rightPaneRef.current.clientWidth || 800);
    return () => ro.disconnect();
  }, []);

  // drag state
  const dragRef = useRef<DragState | null>(null);

  function onEventPointerDown(e: React.PointerEvent, eventRecord: Event, resourceIdx: number) {
    const box = e.currentTarget as HTMLElement;
    box.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      eventId: eventRecord.id,
      startX: e.clientX,
      origX: box.offsetLeft,
      origResourceIdx: resourceIdx
    };
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragRef.current || !rightPaneRef.current) return;
    const d = dragRef.current;
    const rows = Array.from(rightPaneRef.current.querySelectorAll('[data-row]'));
    // horizontal move (time)
    const dx = e.clientX - d.startX;
    const box = rightPaneRef.current.querySelector(`[data-event="${d.eventId}"]`) as HTMLElement;
    if (box) {
      const newLeft = Math.max(0, Math.min(paneWidth - box.offsetWidth, d.origX + dx));
      box.style.left = `${newLeft}px`;
    }
    // vertical reassignment (detect row under pointer)
    const rp = rightPaneRef.current.getBoundingClientRect();
    const y = e.clientY - rp.top;
    const rowIdx = Math.floor(y / 60); // row height
    box && box.setAttribute('data-hover-row', String(rowIdx));
    rows.forEach((row, i) => {
      (row as HTMLElement).style.outline = (i === rowIdx) ? '2px dashed #93c5fd' : 'none';
    });
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragRef.current || !rightPaneRef.current) return;
    const d = dragRef.current;
    const paneRect = rightPaneRef.current.getBoundingClientRect();
    const box = rightPaneRef.current.querySelector(`[data-event="${d.eventId}"]`) as HTMLElement;

    // Final left -> date
    const left = box ? parseFloat(box.style.left) || 0 : 0;
    const newStart = xToDate(left);

    // keep duration
    const ev = eventsData.find(x => x.id === d.eventId);
    if (!ev) return;
    const durMs = toMs(ev.endDate) - toMs(ev.startDate);
    const newEnd = new Date(toMs(newStart) + durMs);

    // Which row dropped on?
    const dropY = e.clientY - paneRect.top;
    const newRowIdx = Math.max(0, Math.min(resourcesData.length - 1, Math.floor(dropY / 60)));
    const newResourceId = resourcesData[newRowIdx].id;

    // Update events
    setEventsData(prev => prev.map(x => x.id === d.eventId ? { ...x, startDate: newStart, endDate: newEnd } : x));

    // Update assignment (single assignment model)
    setAssignmentsData(prev => prev.map(a => a.event === d.eventId ? { ...a, resource: newResourceId } : a));

    // cleanup visuals
    const rows = Array.from(rightPaneRef.current.querySelectorAll('[data-row]'));
    rows.forEach(row => (row as HTMLElement).style.outline = 'none');
    dragRef.current = null;
  }

  useEffect(() => {
    const el = rightPaneRef.current;
    if (!el) return;
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  });

  // Precompute hour ticks
  const hours = [];
  for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + HOUR)) {
    hours.push(new Date(d));
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Scheduler Pro – Drag & Drop (Offline Demo)</h1>
        <p style={styles.sub}>Drag events horizontally to reschedule (15‑min snap). Drag vertically onto another row to reassign.</p>
      </div>

      <div style={styles.shell}>
        <div style={styles.grid} ref={containerRef}>
          {/* Left column: resources */}
          <div style={styles.left}>
            {resourcesData.map(r => (
              <div key={r.id} style={styles.resourceRow}>
                <span style={styles.label}>{r.name}</span>
                <span style={{ marginLeft: 'auto', opacity: .6 }}>Cap {r.capacity}</span>
              </div>
            ))}
          </div>

          {/* Right: time rows + events */}
          <div style={styles.right} ref={rightPaneRef}>
            {/* hour ticks */}
            {hours.map((h, i) => (
              <div key={+h} style={{ ...styles.hourTick, left: `${dateToX(h)}px` }} />
            ))}

            {/* rows */}
            {resourcesData.map((r, rowIdx) => (
              <div key={r.id} data-row style={{ ...styles.timeRow }}>
                {/* events for this row (by assignment) */}
                {eventsData.filter(ev => assignmentMap.get(ev.id) === r.id).map(ev => {
                  const left = dateToX(ev.startDate);
                  const width = durationToW(toMs(ev.endDate) - toMs(ev.startDate));
                  return (
                    <div
                      key={ev.id}
                      data-event={ev.id}
                      style={{ ...styles.eventBox, left, top: 14, width }}
                      onPointerDown={(e) => onEventPointerDown(e, ev, rowIdx)}
                      title={`${ev.name} — ${ev.startDate.toLocaleTimeString()}–${ev.endDate.toLocaleTimeString()}`}
                    >
                      {ev.name}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}