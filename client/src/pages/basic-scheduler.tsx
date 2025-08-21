// Basic Scheduler Demo - Based on Bryntum Basic Example
import React, { useMemo, useRef } from 'react';
import { BryntumScheduler } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

export default function BasicScheduler() {
  const schedulerRef = useRef(null);

  // Define the time range - showing one day
  const startDate = new Date(2025, 0, 1, 6, 0); // Jan 1, 2025, 6 AM
  const endDate = new Date(2025, 0, 1, 20, 0);  // Jan 1, 2025, 8 PM

  // Resources (people) - one row per person
  const resources = [
    { id: 'mike', name: 'Mike' },
    { id: 'linda', name: 'Linda' },
    { id: 'don', name: 'Don' },
    { id: 'karen', name: 'Karen' },
    { id: 'doug', name: 'Doug' },
    { id: 'peter', name: 'Peter' },
    { id: 'sam', name: 'Sam' },
    { id: 'melissa', name: 'Melissa' },
    { id: 'john', name: 'John' },
    { id: 'ellen', name: 'Ellen' }
  ];

  // Events (tasks) with their schedule - matching the screenshot
  const events = [
    {
      id: 1,
      resourceId: 'mike',
      name: 'Click me',
      startDate: new Date(2025, 0, 1, 8, 0),
      endDate: new Date(2025, 0, 1, 11, 0),
      eventColor: 'green'
    },
    {
      id: 2,
      resourceId: 'linda',
      name: 'Drag me',
      startDate: new Date(2025, 0, 1, 10, 0),
      endDate: new Date(2025, 0, 1, 13, 0),
      eventColor: 'blue'
    },
    {
      id: 3,
      resourceId: 'don',
      name: 'Double click me',
      startDate: new Date(2025, 0, 1, 14, 0),
      endDate: new Date(2025, 0, 1, 18, 0),
      eventColor: 'pink'
    },
    {
      id: 4,
      resourceId: 'karen',
      name: 'Right click me',
      startDate: new Date(2025, 0, 1, 8, 0),
      endDate: new Date(2025, 0, 1, 12, 0),
      eventColor: 'orange'
    },
    {
      id: 5,
      resourceId: 'doug',
      name: 'Sports event',
      startDate: new Date(2025, 0, 1, 6, 0),
      endDate: new Date(2025, 0, 1, 10, 0),
      eventColor: 'lime',
      iconCls: 'b-fa b-fa-football'
    },
    {
      id: 6,
      resourceId: 'peter',
      name: "Dad's birthday",
      startDate: new Date(2025, 0, 1, 12, 0),
      endDate: new Date(2025, 0, 1, 14, 0),
      eventColor: 'teal',
      iconCls: 'b-fa b-fa-birthday-cake'
    }
  ];

  // Scheduler configuration
  const schedulerConfig = useMemo(() => ({
    startDate,
    endDate,
    viewPreset: 'hourAndDay',
    rowHeight: 50,
    barMargin: 5,
    eventStyle: 'rounded' as const,
    
    columns: [
      { 
        text: 'NAME', 
        field: 'name', 
        width: 150,
        cellCls: 'resource-name'
      }
    ],

    features: {
      eventDrag: {
        showTooltip: true
      },
      eventResize: true,
      eventEdit: {
        items: {
          nameField: {
            label: 'Event name',
            weight: 100
          },
          resourceField: {
            label: 'Assigned to',
            weight: 200
          },
          startDateField: {
            label: 'Start',
            weight: 300
          },
          endDateField: {
            label: 'End',
            weight: 400
          }
        }
      },
      eventTooltip: {
        template: ({ eventRecord }) => `
          <div class="event-tooltip">
            <div class="event-name">${eventRecord.name}</div>
            <div class="event-dates">
              ${eventRecord.startDate.toLocaleTimeString()} - ${eventRecord.endDate.toLocaleTimeString()}
            </div>
          </div>
        `
      }
    },

    resourceStore: {
      data: resources
    },

    eventStore: {
      data: events
    },

    // Event renderer to customize appearance
    eventRenderer({ eventRecord }) {
      return {
        eventColor: eventRecord.eventColor,
        iconCls: eventRecord.iconCls
      };
    }
  }), []);

  return (
    <div className="scheduler-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Basic Scheduler Demo
        </h1>
        <p style={{ 
          margin: '10px 0 0 0', 
          color: '#666',
          fontSize: '14px'
        }}>
          A simple resource scheduling example with drag & drop, resize, and edit capabilities
        </p>
      </div>

      {/* Scheduler */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{ 
          height: '100%', 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <BryntumScheduler
            ref={schedulerRef}
            {...schedulerConfig}
          />
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        .b-sch-event {
          border-radius: 4px;
          font-size: 13px;
          padding: 4px 8px;
          font-weight: 500;
        }
        
        .b-sch-event.b-sch-event-selected {
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .resource-name {
          font-weight: 500;
          color: #333;
        }
        
        .event-tooltip {
          padding: 8px;
        }
        
        .event-name {
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .event-dates {
          font-size: 12px;
          color: #666;
        }
        
        .b-grid-header {
          background: #f8f8f8;
          font-weight: 600;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}