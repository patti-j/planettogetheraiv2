import React, { useEffect, useRef, useState } from 'react';

export default function TestScheduler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [status, setStatus] = useState('Initializing...');
  
  useEffect(() => {
    const initScheduler = () => {
      const bryntum = (window as any).bryntum;
      
      if (!bryntum?.schedulerpro) {
        setStatus('Waiting for Bryntum library...');
        setTimeout(initScheduler, 500);
        return;
      }
      
      setStatus('Bryntum loaded, creating scheduler...');
      
      try {
        // Destroy any existing instance
        if (schedulerRef.current) {
          schedulerRef.current.destroy();
          schedulerRef.current = null;
        }
        
        const { SchedulerPro } = bryntum.schedulerpro;
        
        // Create the simplest possible test case
        const testResources = [
          { id: 1, name: 'Resource 1' },
          { id: 2, name: 'Resource 2' },
          { id: 3, name: 'Resource 3' },
          { id: 4, name: 'Resource 4' },
          { id: 5, name: 'Resource 5' }
        ];
        
        const testEvents = [
          { 
            id: 1, 
            name: 'Event 1',
            resourceId: 1,
            startDate: '2025-08-19',
            endDate: '2025-08-20'
          },
          { 
            id: 2, 
            name: 'Event 2',
            resourceId: 2,
            startDate: '2025-08-19',
            endDate: '2025-08-20'
          },
          { 
            id: 3, 
            name: 'Event 3',
            resourceId: 3,
            startDate: '2025-08-20',
            endDate: '2025-08-21'
          },
          { 
            id: 4, 
            name: 'Event 4',
            resourceId: 4,
            startDate: '2025-08-20',
            endDate: '2025-08-21'
          },
          { 
            id: 5, 
            name: 'Event 5',
            resourceId: 5,
            startDate: '2025-08-21',
            endDate: '2025-08-22'
          }
        ];
        
        // Create scheduler with the absolute minimum config
        schedulerRef.current = new SchedulerPro({
          appendTo: containerRef.current,
          height: 600,
          startDate: '2025-08-19',
          endDate: '2025-08-23',
          resources: testResources,
          events: testEvents,
          columns: [
            { text: 'Name', field: 'name', width: 200 }
          ]
        });
        
        setStatus(`Scheduler created! Resources: ${schedulerRef.current.resourceStore.count}, Events: ${schedulerRef.current.eventStore.count}`);
        
        // Check what's actually visible
        setTimeout(() => {
          const visibleRows = schedulerRef.current.rowManager?.visibleRows;
          console.log('Test scheduler visible rows:', visibleRows);
          setStatus(prev => prev + ` | Visible rows: ${visibleRows ? visibleRows.length : 'null'}`);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to create test scheduler:', error);
        setStatus(`Error: ${error.message}`);
      }
    };
    
    initScheduler();
    
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.destroy();
        schedulerRef.current = null;
      }
    };
  }, []);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bryntum Scheduler Test</h1>
      <div className="mb-4 p-2 bg-blue-100 rounded">
        Status: {status}
      </div>
      <div ref={containerRef} style={{ height: '600px' }} />
    </div>
  );
}