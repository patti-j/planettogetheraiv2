import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const startDate = new Date(2025, 3, 1, 8);  // Apr 1, 2025 08:00
const endDate   = new Date(2025, 3, 1, 18); // Apr 1, 2025 18:00

// 1) Resources (rows)
const resources = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

// 2) Events (NO resourceId in Pro – assignments decide rows)
const events = [
  { id: 1, name: 'RNA Sequencing',         startDate: '2025-04-01T08:00:00', endDate: '2025-04-01T11:00:00' },
  { id: 2, name: 'Glycan analysis',        startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00' },
  { id: 3, name: 'Electron microscopy',    startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T12:00:00' },
  { id: 4, name: 'Covid variant analysis', startDate: '2025-04-01T13:00:00', endDate: '2025-04-01T17:00:00' },
  { id: 5, name: 'Bacterial identification', startDate: '2025-04-01T10:00:00', endDate: '2025-04-01T14:00:00' },
  { id: 6, name: 'Disinfectant efficacy',  startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T11:00:00' },
  { id: 7, name: 'DNA Sequencing',         startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00' }
];

// 3) Assignments (event -> resource). MUST use eventId/resourceId
const assignments = [
  { id: 1, eventId: 1, resourceId: 1 },
  { id: 2, eventId: 2, resourceId: 1 },
  { id: 3, eventId: 3, resourceId: 2 },
  { id: 4, eventId: 4, resourceId: 2 },
  { id: 5, eventId: 5, resourceId: 3 },
  { id: 6, eventId: 6, resourceId: 4 },
  { id: 7, eventId: 7, resourceId: 5 }
];

export default function Patti3() {
  const schedulerRef = useRef<any>(null);

  const project = useMemo(() => ({ resources, events, assignments }), []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-2">PATTI3 - ChatGPT Implementation (Direct Copy)</h1>
        <p className="mb-4 opacity-80">
          This should distribute events across 5 lab resources. Check browser console for logs.
        </p>

        <BryntumSchedulerPro
          project={project}               // ← single source of truth
          startDate={startDate}
          endDate={endDate}
          viewPreset="hourAndDay"
          rowHeight={60}
          barMargin={8}
          timeResolution={{ unit: 'minute', increment: 15 }}
          columns={[
            { type: 'resourceInfo', text: 'Lab', width: 220, field: 'name' },
            { text: 'Capacity', width: 120, field: 'capacity', align: 'center' }
          ]}
          features={{
            eventDrag: {
              showTooltip: true,
              constrainDragToResource: false,
              constrainDragToTimeSlot: false
            },
            eventEdit: true
          }}
          onReady={({ widget }) => {
            schedulerRef.current = widget;
            console.log('💡 PATTI2 PAGE LOADED');
            console.log('Store counts (from widget):', {
              resources: widget.resourceStore.count,
              events: widget.eventStore.count,
              assignments: widget.assignmentStore.count
            });
            console.table(widget.assignmentStore.records.map((a: any) => ({
              id: a.id, eventId: a.eventId, resourceId: a.resourceId
            })));
            console.table(widget.resourceStore.records.map((r: any) => ({
              id: r.id, name: r.name
            })));
          }}
        />
      </div>
    </div>
  );
}