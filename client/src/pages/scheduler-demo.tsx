import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

// ---- Sample data -----------------------------------------------------------
const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

const resources = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing',         startDate,                        endDate: new Date(2025, 3, 1, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis',        startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy',    startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, resourceI