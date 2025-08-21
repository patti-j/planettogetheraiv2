import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

/**
 * Scheduler Pro demo with Bryntum imports
 * ---------------------------------------------------------------------------
 * Using Bryntum Scheduler Pro with direct resourceId assignment
 * 
 * ✅ Events distributed across resources using resourceId
 * ✅ Drag horizontally to reschedule (with 15 min snapping)
 * ✅ Drag vertically to reassign to another resource
 * ✅ Full Bryntum Pro features enabled
 */

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

// Events with direct resourceId assignment (simpler approach)
const eventsDataInitial = [
  { id: 1, name: 'RNA Sequencing',         startDate: '2025-04-01T08:00:00', endDate: '2025-04-01T11:00:00', resourceId: 1 },
  { id: 2, name: 'Glycan analysis',        startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00', resourceId: 1 },
  { id: 3, name: 'Electron microscopy',    startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T12:00:00', resourceId: 2 },
  { id: 4, name: 'Covid variant analysis', startDate: '2025-04-01T13:00:00', endDate: '2025-04-01T17:00:00', resourceId: 2 },
  { id: 5, name: 'Bacterial identification', startDate: '2025-04-01T10:00:00', endDate: '2025-04-01T14:00:00', resourceId: 3 },
  { id: 6, name: 'Disinfectant efficacy',  startDate: '2025-04-01T09:00:00', endDate: '2025-04-01T11:00:00', resourceId: 4 },
  { id: 7, name: 'DNA Sequencing',         startDate: '2025-04-01T12:00:00', endDate: '2025-04-01T16:00:00', resourceId: 5 }
];

export default function SchedulerDemo() {
  const schedulerRef = useRef<any>(null);
  
  // Configure the scheduler with assignment-based scheduling
  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 8,
    height: 600,
    
    // Direct data assignment (simpler than assignment store)
    resources: resourcesData,
    events: eventsDataInitial,
    
    // Configure drag and drop
    features: {
      eventDrag: {
        showTooltip: true,
        constrainDragToResource: false,
        constrainDragToTimeSlot: false,
        // 15-minute snapping
        dragHelperConfig: {
          snapToIncrement: true,
          increment: 15,
          incrementUnit: 'minute'
        },
        validatorFn({ startDate, endDate }: any) {
          // Prevent scheduling before 8 AM or after 6 PM
          const hours = startDate.getHours();
          const endHours = endDate.getHours();
          return hours >= 8 && hours < 18 && endHours <= 18;
        }
      },
      eventEdit: true,
      timeRanges: true
    } as any,

    // Snap configuration for 15-minute intervals
    snap: true,
    snapRelativeToEventStartDate: false,
    timeResolution: {
      unit: 'minute',
      increment: 15
    },

    columns: [
      { type: 'resourceInfo' as const, text: 'Lab', width: 220, field: 'name' },
      { text: 'Capacity', width: 120, field: 'capacity', align: 'center' as const }
    ],

    listeners: {
      // Handle drag and drop updates
      eventDrop: ({ eventRecords, targetResourceRecord }: any) => {
        const instance = schedulerRef.current;
        if (!instance) return;
        
        console.log('Event dropped:', {
          event: eventRecords[0]?.name,
          targetResource: targetResourceRecord?.name,
          newAssignments: eventRecords[0]?.assignments
        });
      },
      
      // Log data loading for debugging
      dataChange: () => {
        const instance = schedulerRef.current;
        if (instance) {
          console.log('Data changed - Resources:', instance.resourceStore.count, 
                      'Events:', instance.eventStore.count,
                      'Assignments:', instance.assignmentStore?.count || 0);
        }
      }
    }
  }), []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-3">Scheduler Pro – Lab Resource Scheduling</h1>
        <p className="mb-4 opacity-80">
          Events are distributed across 5 lab resources. Drag events to reschedule (15-min snap) or drop onto another resource to reassign.
        </p>

        <div style={{ height: '600px', width: '100%' }}>
          <BryntumSchedulerPro
            {...schedulerProps}
            ref={schedulerRef}
          />
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Assignment Store Pattern</h3>
          <p className="text-sm text-blue-800">
            This demo uses Bryntum's Assignment Store, which separates event definitions from their resource assignments.
            This allows events to be assigned to multiple resources or easily reassigned via drag & drop.
          </p>
        </div>
      </div>
    </div>
  );
}