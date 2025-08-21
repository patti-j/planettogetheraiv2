import React, { useRef, useEffect } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.classic.css';

const BryntumSchedulerProComponent: React.FC = () => {
  const schedulerProRef = useRef<any>(null);

  // Define the configuration with proper store configuration
  const schedulerConfig = {
    // Set height explicitly
    height: 600,
    
    // View configuration
    startDate: new Date(2025, 0, 21),
    endDate: new Date(2025, 0, 28),
    viewPreset: 'hourAndDay',
    
    // Columns for the left grid
    columns: [
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
    ],

    // Row height for better visibility
    rowHeight: 50,
    barMargin: 5,
    
    // Event styling
    eventStyle: 'colored',
    
    // Configure stores with inline data
    resourceStore: {
      data: [
        { id: 'r1', name: 'Mike', type: 'Worker' },
        { id: 'r2', name: 'Dan', type: 'Worker' },
        { id: 'r3', name: 'Sarah', type: 'Worker' },
        { id: 'r4', name: 'Production Line 1', type: 'Machine' },
        { id: 'r5', name: 'Production Line 2', type: 'Machine' }
      ]
    },

    eventStore: {
      data: [
        { 
          id: 'e1', 
          resourceId: 'r1',
          name: 'Brewing Batch #101', 
          startDate: new Date(2025, 0, 22, 8, 0),
          duration: 4,
          durationUnit: 'h',
          eventColor: 'blue'
        },
        { 
          id: 'e2', 
          resourceId: 'r4',
          name: 'Fermentation Process', 
          startDate: new Date(2025, 0, 22, 13, 0),
          duration: 6,
          durationUnit: 'h',
          eventColor: 'green'
        },
        { 
          id: 'e3', 
          resourceId: 'r2',
          name: 'Quality Testing', 
          startDate: new Date(2025, 0, 23, 9, 0),
          duration: 2,
          durationUnit: 'h',
          eventColor: 'orange'
        },
        { 
          id: 'e4', 
          resourceId: 'r5',
          name: 'Packaging Run #45', 
          startDate: new Date(2025, 0, 23, 14, 0),
          duration: 5,
          durationUnit: 'h',
          eventColor: 'purple'
        },
        { 
          id: 'e5', 
          resourceId: 'r3',
          name: 'Equipment Maintenance', 
          startDate: new Date(2025, 0, 24, 10, 0),
          duration: 3,
          durationUnit: 'h',
          eventColor: 'red'
        }
      ]
    },

    dependencyStore: {
      data: [
        { id: 'd1', from: 'e1', to: 'e2', type: 2 }, // Brewing must finish before Fermentation
        { id: 'd2', from: 'e2', to: 'e3', type: 2 }, // Fermentation must finish before Testing
        { id: 'd3', from: 'e3', to: 'e4', type: 2 }  // Testing must finish before Packaging
      ]
    }
  };

  useEffect(() => {
    // Log scheduler instance details for debugging
    if (schedulerProRef.current?.instance) {
      const instance = schedulerProRef.current.instance;
      console.log('Scheduler Pro loaded with:', {
        resources: instance.resourceStore?.count,
        events: instance.eventStore?.count
      });
    }
  }, []);

  return (
    <div className="h-full w-full" style={{ minHeight: '600px' }}>
      <BryntumSchedulerPro
        ref={schedulerProRef}
        {...schedulerConfig}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default BryntumSchedulerProComponent;