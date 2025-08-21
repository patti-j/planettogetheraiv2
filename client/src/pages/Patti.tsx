// Patti.tsx
import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

// One row per resource
const resourcesData = [
  { id: 'r1', name: 'Lab #11',     capacity: 8 },
  { id: 'r2', name: 'Lab #12',     capacity: 10 },
  { id: 'r3', name: 'Lab #13',     capacity: 6 },
  { id: 'r4', name: 'X-Ray lab',   capacity: 4 },
  { id: 'r5', name: 'Biosafety L3', capacity: 5 }
];

// NOTE: No resourceId here — assignments decide the row
const eventsData = [
  { id: 'e1', name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 'e2', name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 'e3', name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 'e4', name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 'e5', name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 'e6', name: 'Disinfectant efficacy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 11) },
  { id: 'e7', name: 'DNA Sequencing',         startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// Each event assigned to exactly one resource (can be multiple if you want)
const assignmentsData = [
  { id: 'a1', eventId: 'e1', resourceId: 'r1' },
  { id: 'a2', eventId: 'e2', resourceId: 'r1' },
  { id: 'a3', eventId: 'e3', resourceId: 'r2' },
  { id: 'a4', eventId: 'e4', resourceId: 'r2' },
  { id: 'a5', eventId: 'e5', resourceId: 'r3' },
  { id: 'a6', eventId: 'e6', resourceId: 'r4' },
  { id: 'a7', eventId: 'e7', resourceId: 'r5' }
];

export default function Patti() {
  const schedulerRef = useRef<any>(null);

  // Use a Project with explicit store configuration
  const project = useMemo(() => ({
    resourceStore: {
      data: resourcesData
    },
    eventStore: {
      data: eventsData
    },
    assignmentStore: {
      data: assignmentsData
    }
  }), []);

  const features = useMemo(() => ({
    eventDrag : {
      showTooltip : true,
      // allow reassign + reschedule
      constrainDragToResource : false,
      constrainDragToTimeSlot : false,
      // disallow start before 07:00
      validatorFn({ startDate }: any) {
        return startDate.getHours() >= 7;
      }
    },
    eventEdit : true,
    timeRanges : true
  }), []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-3">Scheduler Pro – Drag & Drop Example</h1>
        <p className="mb-4 opacity-80">
          Drag events to reschedule in time or drop onto another resource to reassign.
          A simple validator prevents drops before 07:00.
        </p>

        <BryntumSchedulerPro
          project={project as any}
          startDate={startDate}
          endDate={endDate}
          viewPreset="hourAndDay"
          rowHeight={60}
          barMargin={8}
          features={features}
          columns={[
            { type: 'resourceInfo' as const, text: 'Lab', width: 220, field: 'name' },
            { text: 'Capacity', width: 120, field: 'capacity', align: 'center' as const }
          ]}
          style={{ height: 520 }}
          onReady={({ widget }: any) => {
            schedulerRef.current = widget;
            // Debug output to verify data loading
            console.log('=== SCHEDULER PRO DATA CHECK ===');
            console.log('Resource count:', widget.resourceStore.count);
            console.log('Event count:', widget.eventStore.count);
            console.log('Assignment count:', widget.assignmentStore.count);
            
            // Log actual resources to verify they loaded
            console.log('Resources:', widget.resourceStore.records.map((r: any) => ({
              id: r.id,
              name: r.name
            })));
            
            // Log assignments to verify mapping
            console.log('Assignments:', widget.assignmentStore.records.map((a: any) => ({
              id: a.id,
              eventId: a.eventId,
              resourceId: a.resourceId
            })));
          }}
        />
      </div>
    </div>
  );
} 