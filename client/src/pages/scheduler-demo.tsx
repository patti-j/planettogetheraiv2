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

// 3) Assignments (event -> resource). MUST use eventId/resourceId in Pro
const assignmentsData = [
  { id: 1, eventId: 1, resourceId: 1 },  // RNA Sequencing -> Lab #11
  { id: 2, eventId: 2, resourceId: 1 },  // Glycan analysis -> Lab #11
  { id: 3, eventId: 3, resourceId: 2 },  // Electron microscopy -> Lab #12
  { id: 4, eventId: 4, resourceId: 2 },  // Covid variant analysis -> Lab #12
  { id: 5, eventId: 5, resourceId: 3 },  // Bacterial identification -> Lab #13
  { id: 6, eventId: 6, resourceId: 4 },  // Disinfectant efficacy -> X-Ray lab
  { id: 7, eventId: 7, resourceId: 5 }   // DNA Sequencing -> Biosafety L3
];

export default function SchedulerDemo() {
  const schedulerRef = useRef<any>(null);

  // Single source of truth for Pro stores - ONLY use project prop
  const project = useMemo(() => ({ 
    resourcesData, 
    eventsData, 
    assignmentsData 
  }), []);

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
      <div className="w-full px-4">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-2xl font-semibold mb-3">Scheduler Pro – Lab Resource Scheduling</h1>
          <p className="mb-4 opacity-80">
            Events distributed across 5 lab resources. Drag to reschedule (15-min snap) or drop onto another resource.
          </p>

          <div style={{ height: '70vh', minHeight: '500px' }}>
            <BryntumSchedulerPro
              project={project}  // ONLY use project prop, not resources/events separately
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
              onReady={({ widget }) => {
                schedulerRef.current = widget;
                // Should print: resources=5, events=7, assignments=7
                console.log('✅ Scheduler loaded with:');
                console.log('  resources:', widget.resourceStore.count);
                console.log('  events:', widget.eventStore.count);
                console.log('  assignments:', widget.assignmentStore.count);
                
                // Debug: exact assignment links
                console.table(widget.assignmentStore.records.map((a: any) => ({
                  id: a.id, eventId: a.eventId, resourceId: a.resourceId
                })));
              }}
              listeners={{
                eventDrop: ({ eventRecords, targetResourceRecord }: any) => {
                  console.log('Dropped', eventRecords[0]?.name, '->', targetResourceRecord?.name);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}