import React, { useRef, useEffect } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import type { BryntumSchedulerProProps } from '@bryntum/schedulerpro-react';
// Import the Bryntum CSS theme - this is the proper way
import '@bryntum/schedulerpro/schedulerpro.classic-light.css';

/**
 * Example Bryntum SchedulerPro React Component
 * Following official Bryntum React integration patterns
 */

// Configuration object - best practice to separate config from component
const schedulerProConfig: Partial<BryntumSchedulerProProps> = {
  // View configuration
  viewPreset: 'hourAndDay',
  startDate: new Date(2025, 8, 20, 6),
  endDate: new Date(2025, 8, 27, 18),
  
  // Layout configuration
  rowHeight: 50,
  barMargin: 5,
  eventColor: 'blue',
  
  // Resource columns
  columns: [
    {
      type: 'resourceInfo',
      text: 'Resource',
      field: 'name',
      width: 250,
      showEventCount: false
    },
    {
      text: 'Department',
      field: 'department',
      width: 150,
      editor: false
    }
  ],
  
  // Enable features
  stripeFeature: true,
  dependenciesFeature: true,
  timeRangesFeature: true,
  eventTooltipFeature: {
    template: (data: any) => `
      <div class="b-sch-event-tooltip">
        <h3>${data.eventRecord.name}</h3>
        <p>Start: ${data.eventRecord.startDate}</p>
        <p>End: ${data.eventRecord.endDate}</p>
        <p>Resource: ${data.resourceRecord.name}</p>
      </div>
    `
  },
  
  // Selection mode
  selectionMode: {
    multiSelect: false,
    checkbox: false
  },
  
  // Allow overlapping events
  allowOverlap: false,
  
  // Auto-create events on double-click
  autoCreate: 'dblclick'
};

// Sample data following Bryntum's data structure
const resources = [
  { id: 'r1', name: 'Mike', department: 'Sales' },
  { id: 'r2', name: 'Linda', department: 'Engineering' },
  { id: 'r3', name: 'Don', department: 'Marketing' },
  { id: 'r4', name: 'Karen', department: 'HR' },
  { id: 'r5', name: 'Doug', department: 'Operations' }
];

const events = [
  {
    id: 1,
    resourceId: 'r1',
    name: 'Client Meeting',
    startDate: new Date(2025, 8, 21, 9),
    endDate: new Date(2025, 8, 21, 11),
    eventColor: 'blue'
  },
  {
    id: 2,
    resourceId: 'r2',
    name: 'Code Review',
    startDate: new Date(2025, 8, 21, 10),
    endDate: new Date(2025, 8, 21, 12),
    eventColor: 'green'
  },
  {
    id: 3,
    resourceId: 'r3',
    name: 'Marketing Campaign',
    startDate: new Date(2025, 8, 22, 8),
    endDate: new Date(2025, 8, 22, 14),
    eventColor: 'orange'
  }
];

const dependencies = [
  { id: 1, from: 1, to: 2, type: 2 } // End-to-Start dependency
];

const BryntumSchedulerExample: React.FC = () => {
  // Ref to access the Bryntum instance
  const schedulerRef = useRef<any>(null);
  
  useEffect(() => {
    // Access the actual SchedulerPro instance after mount
    const schedulerInstance = schedulerRef.current?.instance;
    
    if (schedulerInstance) {
      console.log('SchedulerPro instance is ready:', schedulerInstance);
      
      // Example: Add event listeners
      schedulerInstance.on({
        eventClick: ({ eventRecord }: any) => {
          console.log('Event clicked:', eventRecord.name);
        },
        eventDrop: ({ eventRecords, targetResourceRecord }: any) => {
          console.log('Event dropped on resource:', targetResourceRecord.name);
        },
        beforeEventDelete: ({ eventRecords }: any) => {
          console.log('About to delete event:', eventRecords[0].name);
          // Return false to prevent deletion
          return true;
        }
      });
    }
    
    // Cleanup
    return () => {
      // Bryntum handles its own cleanup
    };
  }, []);
  
  const handleDataChange = (event: any) => {
    console.log('Data changed:', event);
  };
  
  return (
    <div className="scheduler-example-container">
      <h2>Bryntum SchedulerPro React Example</h2>
      <p>This example follows the official Bryntum React integration patterns</p>
      
      {/* The scheduler container should have explicit dimensions */}
      <div style={{ height: '500px', width: '100%' }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerProConfig}
          resources={resources}
          events={events}
          dependencies={dependencies}
          onDataChange={handleDataChange}
        />
      </div>
      
      <div className="example-notes">
        <h3>Key Implementation Points:</h3>
        <ul>
          <li>CSS theme imported at the top of the file</li>
          <li>Configuration object separated from component</li>
          <li>Proper TypeScript typing with BryntumSchedulerProProps</li>
          <li>Container with explicit height (required for proper rendering)</li>
          <li>Event listeners attached via the instance ref</li>
          <li>Clean data structure following Bryntum conventions</li>
        </ul>
      </div>
    </div>
  );
};

export default BryntumSchedulerExample;