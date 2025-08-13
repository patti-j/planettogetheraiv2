import React, { useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { Card } from '@/components/ui/card';

// Import Bryntum styles
import '@bryntum/schedulerpro/schedulerpro.material.css';

interface SchedulerProDemoProps {
  height?: string;
}

// Bryntum demo data - exactly as they recommend in their documentation
const demoData = {
  project: {
    startDate: '2025-08-01',
    calendar: 'general',
    hoursPerDay: 8,
    daysPerWeek: 5,
    daysPerMonth: 20
  },
  
  calendars: {
    rows: [
      {
        id: 'general',
        name: 'General',
        intervals: [
          {
            recurrentStartDate: 'on Sat at 0:00',
            recurrentEndDate: 'on Mon at 0:00',
            isWorking: false
          }
        ]
      }
    ]
  },
  
  resources: {
    rows: [
      { id: 'r1', name: 'Assembly Line A', type: 'assembly_line', calendar: 'general' },
      { id: 'r2', name: 'CNC Machine 1', type: 'machining_center', calendar: 'general' },
      { id: 'r3', name: 'Quality Station 1', type: 'inspection', calendar: 'general' },
      { id: 'r4', name: 'Packaging Line B', type: 'packaging', calendar: 'general' },
      { id: 'r5', name: 'Mixing Tank 1', type: 'mixing', calendar: 'general' }
    ]
  },
  
  events: {
    rows: [
      {
        id: 1,
        name: 'Product A - Mixing',
        startDate: '2025-08-07T08:00:00',
        duration: 4,
        durationUnit: 'hour',
        percentDone: 25,
        eventColor: '#4285F4'
      },
      {
        id: 2,
        name: 'Product A - Assembly',
        startDate: '2025-08-07T13:00:00',
        duration: 6,
        durationUnit: 'hour',
        percentDone: 0,
        eventColor: '#DB4437'
      },
      {
        id: 3,
        name: 'Product A - Quality Check',
        startDate: '2025-08-08T09:00:00',
        duration: 2,
        durationUnit: 'hour',
        percentDone: 0,
        eventColor: '#F4B400'
      },
      {
        id: 4,
        name: 'Product B - CNC Machining',
        startDate: '2025-08-07T10:00:00',
        duration: 8,
        durationUnit: 'hour',
        percentDone: 50,
        eventColor: '#0F9D58'
      },
      {
        id: 5,
        name: 'Product B - Assembly',
        startDate: '2025-08-08T08:00:00',
        duration: 4,
        durationUnit: 'hour',
        percentDone: 0,
        eventColor: '#AB47BC'
      },
      {
        id: 6,
        name: 'Product C - Packaging',
        startDate: '2025-08-09T10:00:00',
        duration: 3,
        durationUnit: 'hour',
        percentDone: 0,
        eventColor: '#00ACC1'
      }
    ]
  },
  
  assignments: {
    rows: [
      { id: 'a1', eventId: 1, resourceId: 'r5', units: 100 },
      { id: 'a2', eventId: 2, resourceId: 'r1', units: 100 },
      { id: 'a3', eventId: 3, resourceId: 'r3', units: 100 },
      { id: 'a4', eventId: 4, resourceId: 'r2', units: 100 },
      { id: 'a5', eventId: 5, resourceId: 'r1', units: 100 },
      { id: 'a6', eventId: 6, resourceId: 'r4', units: 100 }
    ]
  },
  
  dependencies: {
    rows: [
      { id: 'd1', fromEvent: 1, toEvent: 2, type: 2 }, // Finish-to-Start
      { id: 'd2', fromEvent: 2, toEvent: 3, type: 2 }, // Finish-to-Start
      { id: 'd3', fromEvent: 4, toEvent: 5, type: 2 }  // Finish-to-Start
    ]
  }
};

const BryntumSchedulerProDemo: React.FC<SchedulerProDemoProps> = ({ 
  height = '700px'
}) => {
  const schedulerRef = useRef<any>(null);

  // Bryntum recommended configuration from their documentation
  const schedulerConfig = {
    // Basic configuration
    startDate: new Date('2025-08-05'),
    endDate: new Date('2025-08-31'),
    
    // View preset - as per Bryntum docs
    viewPreset: 'weekAndDayLetter',
    
    // Row height for better visibility
    rowHeight: 60,
    barMargin: 5,
    
    // Event rendering
    eventStyle: 'plain' as const,
    eventColor: null, // Let events use their own colors
    
    // Enable features as per Bryntum best practices
    features: {
      // Progress line to show current time
      progressLine: {
        disabled: false,
        statusDate: new Date()
      },
      // Non-working time visualization
      nonWorkingTime: true,
      // Event tooltip
      eventTooltip: {
        template: (data: any) => `
          <div class="b-sch-event-tooltip">
            <div>${data.eventRecord.name}</div>
            <div>Start: ${data.eventRecord.startDate}</div>
            <div>End: ${data.eventRecord.endDate}</div>
            <div>Progress: ${data.eventRecord.percentDone}%</div>
          </div>
        `
      },
      // Dependencies between tasks
      dependencies: true,
      // Event drag and drop
      eventDrag: {
        constrainDragToResource: false
      },
      // Event resize
      eventResize: true,
      // Time ranges
      timeRanges: {
        showCurrentTimeLine: true
      }
    },
    
    // Column configuration for resource grid
    columns: [
      { 
        type: 'resourceInfo',
        text: 'Resources',
        width: 200,
        showEventCount: false,
        showImage: false
      },
      {
        text: 'Type',
        field: 'type',
        width: 120,
        renderer: ({ record }: any) => {
          const typeIcons: any = {
            assembly_line: '🏭',
            machining_center: '⚙️',
            inspection: '🔍',
            packaging: '📦',
            mixing: '🧪'
          };
          return `${typeIcons[record.type] || '📊'} ${record.type}`;
        }
      }
    ],
    
    // Use inline data instead of CrudManager for demo
    project: demoData.project,
    resources: demoData.resources.rows,
    events: demoData.events.rows,
    assignments: demoData.assignments.rows,
    dependencies: demoData.dependencies.rows,
    calendars: demoData.calendars.rows
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Bryntum Scheduler Pro - Demo Data</h3>
        <p className="text-sm text-muted-foreground">
          Using Bryntum's recommended data structure and configuration
        </p>
      </div>
      
      <div style={{ height }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerConfig}
        />
      </div>
    </Card>
  );
};

export default BryntumSchedulerProDemo;