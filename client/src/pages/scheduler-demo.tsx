// SchedulerDemo.tsx
import React, { useMemo, useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

// One row per resource
const resourcesData = [
  { id: 1, name: 'Lab #11',     capacity: 8 },
  { id: 2, name: 'Lab #12',     capacity: 10 },
  { id: 3, name: 'Lab #13',     capacity: 6 },
  { id: 4, name: 'X-Ray lab',   capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

// NOTE: No resourceId here — assignments decide which row an event appears on
const eventsData = [
  { id: 1, name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 2, name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, name: