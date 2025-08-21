import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const startDate = new Date(2025, 3, 1, 8);  // 08:00
const endDate   = new Date(2025, 3, 1, 18); // 18:00

// 1) Resources (rows)
const resourcesData = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

// 2) Events (NO resourceId in Pro – assignments decide rows)
const eventsData = [
  { id: 1, name: 'RNA Sequencing',         startDate: '2025-04-01T08:00:00', endDate: '2025-04-01T11:00:00' },
  { id: 2, name: 'Glycan analysis',        startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00' },
  { id: 3, name: 'Electron microscopy',    startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T12:00:00' },
  { id: 4, name: 'Covid variant analysis', startDate: '2025-04-01T13:00:00', endDate: '2025-04-01T17:00:00' },
  { id: 5, name: 'Bacterial identification', startDate: '2025-04-01T10:00:00', endDate: '2025-04-01T14:00:00' },
  { id: 6, name: 'Disinfectant efficacy',  startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T11:00:00' },
  { id: 7, name: 'DNA Sequencing',         startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00' }
];

// 3) Assignments (event -> resource). NOTE: keys are `event` and `resource`
const assignmentsData = [
  { id: 1, event: 1, resource: 1 },
  { id: 2, event: 2, resource: 1 },
  { id: 3, event: 3, resource: 2 },
  { id: 4, event: 4, resource: 2 },
  { id: 5, event: 5, resource: 3 },
  { id: 6, event: 6, resource: 4 },
  { id: 7, event: 7, resource: 5 }
];

export default function SchedulerDemo() {
  const schedulerRef = useRef<any>(null);

  // Single source of truth for Pro stores
  const project = useMemo(() => ({ resourcesData, eventsData, assignmentsData }), []);

  const features = useMemo(() => ({
    eventDrag: {
      showTooltip: true,
      constrainDragToResource: false,
      constrainDragToTimeSlot: false,
      validatorFn({ startDate, endDate }: any) {
        const h1 = startDate.getHours();
        const h2 = endDate.getHours();
        return h1 >= 8 && h1 < 18 && h2 <= 18;
      }
    },
    eventEdit: true,
    timeRanges: true
  }), []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-3">Scheduler Pro – Lab Resource Scheduling</h1>
        <p className="mb-4 opacity-80">
          Events are distributed across 5 lab resources. Drag to reschedule (15-min snap) or drop onto another resource to reassign.
        </p>

        <BryntumSchedulerPro
          project={project}
          startDate={startDate}
          endDate={endDate}
          viewPreset="hourAndDay"
          rowHeight={60}
          barMargin={8}
          timeResolution={{ unit: 'minute', increment: 15 }}
          features={features}
          columns={[
            { type: 'resourceInfo', text: 'Lab', width: 220, field: 'name' },
            { text: 'Capacity', width: 120, field: 'capacity', align: 'center' }
          ]}
          style={{ height: 600 }}
          onReady={({ widget }) => {
            schedulerRef.current = widget;
            // Sanity checks – should print: 5 resources, 7 events, 7 assignments
            console.log('resources:', widget.resourceStore.count);
            console.log('events:', widget.eventStore.count);
            console.log('assignments:', widget.assignmentStore.count);
          }}
          listeners={{
            eventDrop: ({ eventRecords, targetResourceRecord }: any) => {
              console.log('Dropped', eventRecords[0]?.name, '->', targetResourceRecord?.name);
            }
          }}
        />
      </div>
    </div>
  );
}