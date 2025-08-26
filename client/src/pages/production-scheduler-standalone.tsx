import React, { useEffect } from 'react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const ProductionSchedulerStandalone: React.FC = () => {
  useEffect(() => {
    // Create an iframe to load the pure JS implementation
    const container = document.getElementById('scheduler-frame-container');
    if (container) {
      container.innerHTML = `
        <iframe 
          src="/production-schedule-js" 
          style="width: 100%; height: 100%; border: none;"
          title="Production Scheduler"
        ></iframe>
      `;
    }
  }, []);

  return (
    <div id="scheduler-frame-container" style={{ height: '100vh', width: '100%' }} />
  );
};

export default ProductionSchedulerStandalone;