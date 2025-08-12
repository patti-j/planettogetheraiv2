import React from 'react';
import { BryntumTestNew } from '@/components/bryntum/BryntumTestNew';

export default function TestBryntumPage() {
  console.log('🔵🔵🔵 TestBryntumPage: Component rendered 🔵🔵🔵');
  
  return (
    <div style={{ padding: '40px', backgroundColor: '#e0f2ff' }}>
      <h1 style={{ color: 'blue', marginBottom: '20px' }}>Test Bryntum Page</h1>
      <p style={{ marginBottom: '20px' }}>This is a completely new page to test Bryntum components without caching issues.</p>
      <BryntumTestNew />
    </div>
  );
}

TestBryntumPage.displayName = 'TestBryntumPage';