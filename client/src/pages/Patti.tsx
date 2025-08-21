// Patti.tsx
import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

// ---- Sample data -----------------------------------------------------------
const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

const resourcesData = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const eventsData = [
  { id: 1, name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 2, name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, name: 'Disinfectant efficacy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 11) },
  { id: 7, name: 'DNA Sequencing',         startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// Each event is assigned to exactly one resource via assignmentsData
const assignmentsData = [
  { id: 1, eventId: 1, resourceId: 1 },
  { id: 2, eventId: 2, resourceId: 1 },
  { id: 3, eventId: 3, resourceId: 2 },
  { id: 4, eventId: 4, resourceId: 2 },
  { id: 5, eventId: 5, resourceId: 3 },
  { id: 6, eventId: 6, resourceId: 4 },
  { id: 7, eventId: 7, resourceId: 5 }
];

// ---- Component -------------------------------------------------------------
export default function Patti() {
  const schedulerRef = useRef<any>(null);

  // Use the recommended `project` config in Scheduler Pro
  const project = useMemo(() => ({
    resourcesData,
    eventsData,
    assignmentsData
  }), []);

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset : 'hourAndDay',
    rowHeight  : 60,
    barMargin  : 8,

    features : {
      eventDrag : {
        showTooltip : true,
        // Allow moves in time and across resources
        constrainDragToResource : false,
        constrainDragToTimeSlot : false,
        // Simple validation: disallow starts before 07:00
        validatorFn({ startDate }: any) {
          return startDate.getHours() >= 7;
        }
      },
      eventEdit : true,
      timeRanges : true
    },

    columns : [
      { type : 'resourceInfo', text : 'Lab', width : 220, field : 'name' },
      { text : 'Capacity', width : 120, field : 'capacity', align : 'center' }
    ]
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
          project={project}
          onReady={({ widget }: any) => { schedulerRef.current = widget; }}
          {...schedulerProps}
        />
      </div>
    </div>
  );
} 