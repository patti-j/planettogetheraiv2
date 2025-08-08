import React, { useEffect, useRef, useState } from 'react';

// Simple test component to verify Bryntum loading
export function BryntumTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Checking Bryntum...');

  useEffect(() => {
    const checkBryntum = () => {
      console.log('BryntumTest: Checking window.bryntum...', window.bryntum);
      
      if (!window.bryntum) {
        setStatus('❌ window.bryntum is undefined');
        console.error('window.bryntum is undefined');
        return;
      }
      
      if (!window.bryntum.gantt) {
        setStatus('❌ window.bryntum.gantt is undefined');
        console.error('window.bryntum.gantt is undefined');
        return;
      }
      
      if (!window.bryntum.gantt.Gantt) {
        setStatus('❌ window.bryntum.gantt.Gantt is undefined');
        console.error('window.bryntum.gantt.Gantt is undefined');
        return;
      }
      
      setStatus('✅ Bryntum Gantt is available!');
      console.log('✅ Bryntum Gantt is available!', window.bryntum.gantt.Gantt);
      
      // Try to create a simple gantt
      try {
        if (containerRef.current) {
          const { Gantt } = window.bryntum.gantt;
          
          const gantt = new Gantt({
            appendTo: containerRef.current,
            columns: [{ type: 'name', field: 'name', text: 'Task' }],
            project: {
              tasksData: [
                { id: 1, name: 'Test Task', startDate: '2025-08-08', duration: 1 }
              ]
            },
            viewPreset: 'dayAndWeek'
          });
          
          setStatus('✅ Simple Gantt created successfully!');
          console.log('Simple Gantt created:', gantt);
        }
      } catch (error) {
        setStatus(`❌ Failed to create Gantt: ${error.message}`);
        console.error('Failed to create simple gantt:', error);
      }
    };
    
    // Check immediately and retry every 500ms if needed
    const checkInterval = setInterval(() => {
      if (status.includes('✅')) {
        clearInterval(checkInterval);
        return;
      }
      checkBryntum();
    }, 500);
    
    // Initial check
    checkBryntum();
    
    return () => clearInterval(checkInterval);
  }, [status]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Bryntum Library Test</h3>
      <p className="mb-4">{status}</p>
      <div ref={containerRef} style={{ height: '400px', border: '1px solid #ccc' }}></div>
    </div>
  );
}