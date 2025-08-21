import React, { useRef, useEffect, useMemo } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.classic.css';

const BryntumSchedulerProComponent: React.FC = () => {
  const schedulerProRef = useRef<any>(null);

  // Configuration object with all the data
  const schedulerConfig = useMemo(() => ({
    // The project includes all stores (resources, events, assignments, dependencies)
    project: {
      // Resources (workers, machines, etc.)
      resourcesData: [
        { id: 1, name: 'Mike', type: 'Worker' },
        { id: 2, name: 'Dan', type: 'Worker' },
        { id: 3, name: 'Sarah', type: 'Worker' },
        { id: 4, name: 'Production Line 1', type: 'Machine' },
        { id: 5, name: 'Production Line 2', type: 'Machine' }
      ],

      // Events (tasks, operations)
      eventsData: [
        { 
          id: 1, 
          name: 'Brewing Batch #101', 
          startDate: '2025-01-22T08:00:00',
          duration: 4,
          durationUnit: 'h',
          eventColor: 'blue'
        },
        { 
          id: 2, 
          name: 'Fermentation Process', 
          startDate: '2025-01-22T13:00:00',
          duration: 6,
          durationUnit: 'h',
          eventColor: 'green'
        },
        { 
          id: 3, 
          name: 'Quality Testing', 
          startDate: '2025-01-23T09:00:00',
          duration: 2,
          durationUnit: 'h',
          eventColor: 'orange'
        },
        { 
          id: 4, 
          name: 'Packaging Run #45', 
          startDate: '2025-01-23T14:00:00',
          duration: 5,
          durationUnit: 'h',
          eventColor: 'purple'
        },
        { 
          id: 5, 
          name: 'Equipment Maintenance', 
          startDate: '2025-01-24T10:00:00',
          duration: 3,
          durationUnit: 'h',
          eventColor: 'red'
        }
      ],

      // Assignments - This is the KEY for making events show on different rows!
      assignmentsData: [
        { id: 1, event: 1, resource: 1 }, // Brewing Batch -> Mike
        { id: 2, event: 2, resource: 4 }, // Fermentation -> Production Line 1
        { id: 3, event: 3, resource: 2 }, // Quality Testing -> Dan
        { id: 4, event: 4, resource: 5 }, // Packaging -> Production Line 2
        { id: 5, event: 5, resource: 3 }  // Maintenance -> Sarah
      ],

      // Dependencies between tasks (optional)
      dependenciesData: [
        { id: 1, from: 1, to: 2, type: 2 }, // Brewing must finish before Fermentation
        { id: 2, from: 2, to: 3, type: 2 }, // Fermentation must finish before Testing
        { id: 3, from: 3, to: 4, type: 2 }  // Testing must finish before Packaging
      ]
    },

    // View configuration
    startDate: '2025-01-21',
    endDate: '2025-01-28',
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
    
    // Make it responsive
    autoHeight: false
  }), []);

  useEffect(() => {
    // You can access the scheduler instance here if needed
    if (schedulerProRef.current?.instance) {
      console.log('Scheduler Pro instance loaded:', schedulerProRef.current.instance);
    }
  }, []);

  return (
    <div className="h-full w-full">
      <BryntumSchedulerPro
        ref={schedulerProRef}
        {...schedulerConfig}
      />
    </div>
  );
};

export default BryntumSchedulerProComponent;