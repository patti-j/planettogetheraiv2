import React, { useEffect, useRef } from 'react';

export function BryntumTestNew() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🟢🟢🟢 BryntumTestNew: Component mounted 🟢🟢🟢');
    console.log('🟢 Window bryntum available:', !!window.bryntum);
    console.log('🟢 Container ref:', !!containerRef.current);
    
    return () => {
      console.log('🟢🟢🟢 BryntumTestNew: Component unmounted 🟢🟢🟢');
    };
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', border: '2px solid green' }}>
      <h2 style={{ color: 'green' }}>BryntumTestNew Component</h2>
      <p>This is a completely new test component with green logs</p>
      <div ref={containerRef} style={{ height: '400px', backgroundColor: 'white' }} />
    </div>
  );
}

BryntumTestNew.displayName = 'BryntumTestNew';