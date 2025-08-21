import React, { useRef, useEffect } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';

// Simple test data
const resources = [
  { id: 1, name: 'Resource 1' },
  { id: 2, name: 'Resource 2' },
  { id: 3, name: 'Resource 3' }
];

const events = [
  { 
    id: 1, 
    name: 'Event 1',
    startDate: '2025-04-01T09:00:00',
    endDate: '2025-04-01T11:00:00',
    resourceId: 1  // Direct resource assignment
  },
  { 
    id: 2, 
    name: 'Event 2',
    startDate: '2025-04-01T10:00:00',
    endDate: '2025-04-01T12:00:00',
    resourceId: 2
  },
  { 
    id: 3, 
    name: 'Event 3',
    startDate: '2025-04-01T11:00:00',
    endDate: '2025-04-01T13:00:00',
    resourceId: 3
  }
];

export default function SchedulerTest() {
  const schedulerRef = useRef<any>(null);
  
  useEffect(() => {
    // Log when component mounts
    console.log('SchedulerTest mounted with data:', { resources, events });
  }, []);
  
  const schedulerConfig = {
    startDate: '2025-04-01',
    endDate: '2025-04-02',
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 8,
    
    // Direct data assignment
    resources: resources,
    events: events,
    
    columns: [
      { text: 'Resource', field: 'name', width: 150 }
    ],
    
    features: {
      eventDrag: true,
      eventResize: true,
      eventTooltip: true
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold mb-4">Simple Scheduler Test</h1>
      <p className="mb-4">Testing basic Bryntum Scheduler Pro data loading with resourceId approach.</p>
      
      <div style={{ height: '500px' }}>
        <BryntumSchedulerPro
          {...schedulerConfig}
          ref={(ref: any) => {
            if (ref?.instance) {
              schedulerRef.current = ref.instance;
              console.log('Scheduler instance ready:', {
                resourceCount: ref.instance.resourceStore?.count,
                eventCount: ref.instance.eventStore?.count
              });
            }
          }}
        />
      </div>
    </div>
  );
}