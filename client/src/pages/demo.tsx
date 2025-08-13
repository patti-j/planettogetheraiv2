import React, { useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.material.css';

export default function DemoPage() {
  const schedulerRef = useRef<any>(null);
  
  // Pure Bryntum test data - 5 resources with colorful operations
  const testData = {
    startDate: new Date('2025-08-05'),
    endDate: new Date('2025-08-31'),
    viewPreset: 'weekAndDayLetter',
    rowHeight: 60,
    barMargin: 5,
    eventStyle: 'colored' as const,
    snap: true,
    readOnly: false,
    
    columns: [
      { 
        type: 'resourceInfo',
        text: 'Test Resources',
        width: 200,
        showEventCount: true,
        showImage: false
      }
    ],
    
    // 5 Test Resources
    resources: [
      { id: 1, name: 'Resource 1 - Test', eventColor: 'blue' },
      { id: 2, name: 'Resource 2 - Test', eventColor: 'red' },
      { id: 3, name: 'Resource 3 - Test', eventColor: 'orange' },
      { id: 4, name: 'Resource 4 - Test', eventColor: 'green' },
      { id: 5, name: 'Resource 5 - Test', eventColor: 'purple' }
    ],
    
    // Sample colorful events - make them draggable and resizable
    events: [
      {
        id: 1,
        name: 'Blue Task - Drag Me!',
        startDate: '2025-08-07T08:00:00',
        endDate: '2025-08-07T12:00:00',
        eventColor: 'blue',
        draggable: true,
        resizable: true
      },
      {
        id: 2,
        name: 'Red Task - Resize Me!',
        startDate: '2025-08-07T13:00:00',
        endDate: '2025-08-07T17:00:00',
        eventColor: 'red',
        draggable: true,
        resizable: true
      },
      {
        id: 3,
        name: 'Orange Task - Move Me!',
        startDate: '2025-08-08T09:00:00',
        endDate: '2025-08-08T11:00:00',
        eventColor: 'orange',
        draggable: true,
        resizable: true
      },
      {
        id: 4,
        name: 'Green Task',
        startDate: '2025-08-07T10:00:00',
        endDate: '2025-08-07T18:00:00',
        eventColor: 'green',
        draggable: true,
        resizable: true
      },
      {
        id: 5,
        name: 'Purple Task',
        startDate: '2025-08-08T08:00:00',
        endDate: '2025-08-08T12:00:00',
        eventColor: 'purple',
        draggable: true,
        resizable: true
      }
    ],
    
    // Assignments linking events to resources
    assignments: [
      { id: 1, eventId: 1, resourceId: 1 },
      { id: 2, eventId: 2, resourceId: 2 },
      { id: 3, eventId: 3, resourceId: 3 },
      { id: 4, eventId: 4, resourceId: 4 },
      { id: 5, eventId: 5, resourceId: 5 }
    ],
    
    // Enable ALL Bryntum Pro features
    features: {
      // Core drag and drop
      eventDrag: {
        constrainDragToResource: false,
        showTooltip: true
      },
      eventResize: {
        showTooltip: true
      },
      eventDragCreate: true,
      eventDragSelect: true,
      
      // Tooltips and editing
      eventTooltip: {
        template: ({ eventRecord }) => `
          <b>${eventRecord.name}</b><br>
          Start: ${eventRecord.startDate}<br>
          End: ${eventRecord.endDate}<br>
          <em>Drag to move, resize edges to change duration</em>
        `
      },
      eventEdit: {
        editorConfig: {
          title: 'Edit Task',
          height: 400
        }
      },
      
      // Context menus
      eventMenu: {
        items: {
          deleteEvent: {
            text: 'Delete',
            icon: 'b-fa-trash',
            onItem: ({ eventRecord }) => eventRecord.remove()
          },
          editEvent: {
            text: 'Edit',
            icon: 'b-fa-edit',
            onItem: ({ eventRecord }) => {
              const scheduler = schedulerRef.current?.instance;
              scheduler?.editEvent(eventRecord);
            }
          }
        }
      },
      scheduleMenu: {
        items: {
          addEvent: {
            text: 'Add new task here',
            icon: 'b-fa-plus',
            onItem: ({ resourceRecord, date }) => {
              resourceRecord.events.add({
                name: 'New Task',
                startDate: date,
                duration: 4,
                durationUnit: 'hour',
                eventColor: 'cyan'
              });
            }
          }
        }
      },
      
      // Time navigation
      headerZoom: true,
      zoomOnMouseWheel: true,
      pan: true,
      
      // Visual features
      timeRanges: true,
      nonWorkingTime: true,
      columnLines: true,
      dependencies: true,
      dependencyEdit: true,
      
      // Data management
      eventFilter: true,
      group: 'eventColor',
      sort: true,
      summary: true,
      
      // Additional Pro features
      resourceTimeRanges: true,
      percentBar: true,
      labels: {
        left: {
          field: 'name',
          editor: false
        }
      }
    },
    
    // Add toolbar with controls
    tbar: {
      items: [
        {
          type: 'button',
          text: 'Zoom In',
          icon: 'b-fa-search-plus',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.zoomIn();
          }
        },
        {
          type: 'button',
          text: 'Zoom Out',
          icon: 'b-fa-search-minus',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.zoomOut();
          }
        },
        {
          type: 'button',
          text: 'Zoom to Fit',
          icon: 'b-fa-expand-arrows-alt',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.zoomToFit();
          }
        },
        '|',
        {
          type: 'button',
          text: 'Previous',
          icon: 'b-fa-angle-left',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.shiftPrevious();
          }
        },
        {
          type: 'button',
          text: 'Today',
          icon: 'b-fa-calendar-day',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.scrollToDate(new Date(), { block: 'center', animate: true });
          }
        },
        {
          type: 'button',
          text: 'Next',
          icon: 'b-fa-angle-right',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.shiftNext();
          }
        },
        '->',
        {
          type: 'button',
          text: 'Add Event',
          icon: 'b-fa-plus-circle',
          style: 'background: #4CAF50; color: white;',
          onAction: () => {
            const scheduler = schedulerRef.current?.instance;
            scheduler?.eventStore.add({
              resourceId: Math.floor(Math.random() * 5) + 1,
              name: 'New Task',
              startDate: new Date('2025-08-10T10:00:00'),
              duration: 3,
              durationUnit: 'hour',
              eventColor: 'teal'
            });
          }
        }
      ]
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: '20px',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: '#ff6b35',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Bryntum Pure Test Demo</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>5 Test Resources with Colorful Tasks</p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '10px',
        height: 'calc(100% - 120px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...testData}
        />
      </div>
    </div>
  );
}