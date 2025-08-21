// Patti.tsx
import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

// One row per resource
const resources = [
  { id: 1, name: 'Lab #11',     capacity: 8 },
  { id: 2, name: 'Lab #12',     capacity: 10 },
  { id: 3, name: 'Lab #13',     capacity: 6 },
  { id: 4, name: 'X-Ray lab',   capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

// Events with resourceId to place them on the correct row
const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, resourceId: 3, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, resourceId: 4, name: 'Disinfectant efficacy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 11) },
  { id: 7, resourceId: 5, name: 'DNA Sequencing',         startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

export default function Patti() {
  const schedulerRef = useRef<any>(null);

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 8,
    height: 520,
    
    // Pass data directly as props
    resources,
    events,
    
    features: {
      eventDrag: {
        showTooltip: true,
        constrainDragToResource: false,
        constrainDragToTimeSlot: false,
        // Simple validation: disallow starts before 07:00
        validatorFn({ startDate }: any) {
          return startDate.getHours() >= 7;
        }
      },
      eventEdit: true,
      timeRanges: true
    },
    
    columns: [
      { type: 'resourceInfo' as const, text: 'Lab', width: 220, field: 'name' },
      { text: 'Capacity', width: 120, field: 'capacity', align: 'center' as const }
    ]
  }), []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-3">Scheduler Pro – Drag & Drop Example</h1>
        <p className="mb-4 opacity-80">
          Drag events to reschedule in time or drop onto another resource to reassign. A simple validator prevents drops before 07:00.
        </p>

        <BryntumSchedulerPro
          ref={(ref: any) => {
            if (ref?.instance) {
              schedulerRef.current = ref.instance;
              // Quick sanity checks in console:
              console.log('resource count:', ref.instance.resourceStore.count, ref.instance.resourceStore.records.map((r: any) => r.name));
              console.log('event count:', ref.instance.eventStore.count);
            }
          }}
          {...schedulerProps}
        />
      </div>
    </div>
  );
} 