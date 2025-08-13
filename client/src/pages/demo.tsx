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
    eventStyle: 'plain' as const,
    
    columns: [
      { 
        type: 'resourceInfo',
        text: 'Test Resources',
        width: 200
      }
    ],
    
    // 5 Test Resources
    resources: [
      { id: 1, name: 'Resource 1 - Test' },
      { id: 2, name: 'Resource 2 - Test' },
      { id: 3, name: 'Resource 3 - Test' },
      { id: 4, name: 'Resource 4 - Test' },
      { id: 5, name: 'Resource 5 - Test' }
    ],
    
    // Sample colorful events
    events: [
      {
        id: 1,
        name: 'Blue Task',
        startDate: '2025-08-07T08:00:00',
        endDate: '2025-08-07T12:00:00',
        eventColor: '#4285F4'
      },
      {
        id: 2,
        name: 'Red Task',
        startDate: '2025-08-07T13:00:00',
        endDate: '2025-08-07T17:00:00',
        eventColor: '#DB4437'
      },
      {
        id: 3,
        name: 'Yellow Task',
        startDate: '2025-08-08T09:00:00',
        endDate: '2025-08-08T11:00:00',
        eventColor: '#F4B400'
      },
      {
        id: 4,
        name: 'Green Task',
        startDate: '2025-08-07T10:00:00',
        endDate: '2025-08-07T18:00:00',
        eventColor: '#0F9D58'
      },
      {
        id: 5,
        name: 'Purple Task',
        startDate: '2025-08-08T08:00:00',
        endDate: '2025-08-08T12:00:00',
        eventColor: '#AB47BC'
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
    
    features: {
      eventDrag: true,
      eventResize: true,
      eventTooltip: true
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