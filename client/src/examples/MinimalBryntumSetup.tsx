import React from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
// CRITICAL: Import ONE theme CSS file - Using Stockholm theme for v6.3.3
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

/**
 * Minimal Bryntum SchedulerPro Setup
 * This shows the bare minimum required for a properly working scheduler
 */

const MinimalBryntumSetup: React.FC = () => {
  // Minimal required configuration
  const config = {
    startDate: new Date(2025, 8, 20),
    endDate: new Date(2025, 8, 27),
    viewPreset: 'dayAndWeek',
    
    // Simple resource list
    resources: [
      { id: 1, name: 'Resource 1' },
      { id: 2, name: 'Resource 2' },
      { id: 3, name: 'Resource 3' }
    ],
    
    // Simple events
    events: [
      {
        id: 1,
        resourceId: 1,
        name: 'Task 1',
        startDate: '2025-09-21',
        endDate: '2025-09-22'
      },
      {
        id: 2,
        resourceId: 2,
        name: 'Task 2',
        startDate: '2025-09-22',
        endDate: '2025-09-24'
      }
    ]
  };

  return (
    <div>
      <h2>Minimal Bryntum Setup</h2>
      
      {/* CRITICAL: Container must have explicit height */}
      <div style={{ height: '400px' }}>
        <BryntumSchedulerPro {...config} />
      </div>
    </div>
  );
};

export default MinimalBryntumSetup;

/**
 * KEY POINTS FOR PROPER BRYNTUM REACT SETUP:
 * 
 * 1. CSS IMPORT:
 *    - Import ONLY ONE theme CSS file at the component or app level
 *    - Never inject custom CSS that modifies Bryntum's internal classes
 *    - Available themes:
 *      - schedulerpro.classic-light.css (what we're using)
 *      - schedulerpro.classic-dark.css
 *      - schedulerpro.material.css
 *      - schedulerpro.stockholm.css
 * 
 * 2. CONTAINER REQUIREMENTS:
 *    - The scheduler's parent container MUST have an explicit height
 *    - Without height, the scheduler won't render properly
 *    - Can use px, vh, or calc() - just needs to be explicit
 * 
 * 3. COMPONENT STRUCTURE:
 *    - Keep it simple - let Bryntum handle its own DOM
 *    - Don't wrap with unnecessary divs
 *    - Don't apply custom styles to Bryntum's internal elements
 * 
 * 4. CONFIGURATION:
 *    - Pass config as props or spread object
 *    - Use TypeScript types for better IDE support
 *    - Separate large configs into their own objects/files
 * 
 * 5. COMMON MISTAKES TO AVOID:
 *    ❌ Adding custom CSS to override Bryntum classes
 *    ❌ Forgetting to set container height
 *    ❌ Importing multiple theme CSS files
 *    ❌ Using autoHeight: false with custom height styles
 *    ❌ Injecting styles dynamically that conflict with Bryntum
 * 
 * 6. CUSTOMIZATION:
 *    - Use Bryntum's configuration options, not CSS overrides
 *    - For styling, use the cls or eventColor properties
 *    - For layout, use rowHeight, barMargin, etc. in config
 *    - For themes, switch the imported CSS file
 */