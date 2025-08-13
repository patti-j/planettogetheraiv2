import React from 'react';
import BryntumSchedulerProDemo from '@/components/scheduler-pro/BryntumSchedulerProDemo';

export default function DemoPage() {
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
        <h1 style={{ margin: 0, fontSize: '24px' }}>Bryntum Demo - Test Data</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>5 Resources with Sample Operations</p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '10px',
        height: 'calc(100% - 120px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <BryntumSchedulerProDemo height="100%" />
      </div>
    </div>
  );
}