import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

// ---- Sample data -----------------------------------------------------------
const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

const resources = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing',       startDate,                       endDate: new Date(2025, 3, 1, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis',      startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, resourceId: 3, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, resourceId: 4, name: 'Disinfectant efficacy', startDate: new Date(2025, 3, 1, 9), endDate: new Date(2025, 3, 1, 11) },
  { id: 7, resourceId: 5, name: 'DNA Sequencing',       startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// ---- Main component --------------------------------------------------------
export default function SchedulerDemo() {
  const schedulerRef = useRef<any>(null);
  const [dataState, setDataState] = useState({ resources, events });

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset : 'hourAndDay',
    rowHeight  : 60,
    barMargin  : 8,

    resources : dataState.resources,
    events    : dataState.events,

    // Explicit drag-and-drop configuration
    features : {
      eventDrag : {
        showTooltip : true,
        constrainDragToResource : false,
        constrainDragToTimeSlot : false,
        validatorFn({ startDate }: any) {
          // Prevent scheduling before 7 AM
          return startDate.getHours() >= 7;
        }
      },
      eventEdit : true,
      timeRanges : true
    },

    // 15-minute time snapping
    timeResolution: {
      unit: 'minute',
      increment: 15
    },

    columns : [
      { type : 'resourceInfo', text : 'Lab', width : 200, field : 'name' },
      { text : 'Capacity', width : 140, field : 'capacity', align : 'center' }
    ],

    listeners : {
      eventDrop : () => {
        const instance = schedulerRef.current;
        if (!instance) return;
        const nextEvents = instance.eventStore.records.map((r: any) => ({
          id: r.id, resourceId: r.resourceId, name: r.name, startDate: r.startDate, endDate: r.endDate
        }));
        setDataState(prev => ({ ...prev, events: nextEvents }));
      }
    }
  }), [dataState]);

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
              onReady={({ widget }) => { 
                schedulerRef.current = widget;
                console.log('Scheduler loaded:', {
                  resources: widget.resourceStore.count,
                  events: widget.eventStore.count
                });
              }}
              {...schedulerProps}
            />
          </div>
        </div>
      </div>
    </div>
  );
}