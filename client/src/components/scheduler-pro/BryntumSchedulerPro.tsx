import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const BryntumSchedulerProComponent: React.FC = () => {
  const schedulerRef = useRef<any>(null);

  // 1) Resources (rows)
  const resources = [
    { id: 'r1', name: 'Mike', type: 'Worker' },
    { id: 'r2', name: 'Dan', type: 'Worker' },
    { id: 'r3', name: 'Sarah', type: 'Worker' },
    { id: 'r4', name: 'Production Line 1', type: 'Machine' },
    { id: 'r5', name: 'Production Line 2', type: 'Machine' }
  ];

  // 2) Events (NO resourceId in Pro – assignments decide rows)
  const events = [
    { 
      id: 'e1', 
      name: 'Brewing Batch #101', 
      startDate: '2025-01-22T08:00:00',
      endDate: '2025-01-22T12:00:00'
    },
    { 
      id: 'e2', 
      name: 'Fermentation Process', 
      startDate: '2025-01-22T13:00:00',
      endDate: '2025-01-22T19:00:00'
    },
    { 
      id: 'e3', 
      name: 'Quality Testing', 
      startDate: '2025-01-23T09:00:00',
      endDate: '2025-01-23T11:00:00'
    },
    { 
      id: 'e4', 
      name: 'Packaging Run #45', 
      startDate: '2025-01-23T14:00:00',
      endDate: '2025-01-23T19:00:00'
    },
    { 
      id: 'e5', 
      name: 'Equipment Maintenance', 
      startDate: '2025-01-24T10:00:00',
      endDate: '2025-01-24T13:00:00'
    }
  ];

  // 3) Assignments (event -> resource). MUST use eventId/resourceId
  const assignments = [
    { id: 'a1', eventId: 'e1', resourceId: 'r1' },
    { id: 'a2', eventId: 'e2', resourceId: 'r4' },
    { id: 'a3', eventId: 'e3', resourceId: 'r2' },
    { id: 'a4', eventId: 'e4', resourceId: 'r5' },
    { id: 'a5', eventId: 'e5', resourceId: 'r3' }
  ];

  // 4) Dependencies
  const dependencies = [
    { id: 'd1', from: 'e1', to: 'e2', type: 2 },
    { id: 'd2', from: 'e2', to: 'e3', type: 2 },
    { id: 'd3', from: 'e3', to: 'e4', type: 2 }
  ];

  const project = useMemo(() => ({ 
    resources, 
    events, 
    assignments, 
    dependencies 
  }), []);

  return (
    <div className="h-full w-full" style={{ minHeight: '600px' }}>
      <BryntumSchedulerPro
        project={project}
        startDate={new Date(2025, 0, 21)}
        endDate={new Date(2025, 0, 28)}
        viewPreset="hourAndDay"
        rowHeight={50}
        barMargin={5}
        height={600}
        columns={[
          { 
            type: 'resourceInfo', 
            field: 'name', 
            text: 'Resource', 
            width: 200
          },
          {
            field: 'type',
            text: 'Type',
            width: 100
          }
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
          console.log('💡 Production Scheduler Pro loaded');
          console.log('Store counts (from widget):', {
            resources: widget.resourceStore.count,
            events: widget.eventStore.count,
            assignments: widget.assignmentStore.count,
            dependencies: widget.dependencyStore.count
          });
        }}
      />
    </div>
  );
};

export default BryntumSchedulerProComponent;