import { useEffect } from 'react';

/**
 * ProductionScheduleTSX - React wrapper for the integrated HTML production scheduler
 * This component embeds the complete HTML functionality using dangerouslySetInnerHTML
 * while maintaining compatibility with the React routing system.
 */
export default function ProductionSchedule() {
  useEffect(() => {
    // Set the document title
    document.title = "Production Schedule TSX";

    // Ensure Bryntum CSS is loaded with error handling
    const ensureBryntumCSS = () => {
      return new Promise<void>((resolve, reject) => {
        const existingLink = document.getElementById('scheduler-theme');
        if (existingLink) {
          resolve();
          return;
        }

        const link = document.createElement('link');
        link.id = 'scheduler-theme';
        link.rel = 'stylesheet';
        link.href = '/schedulerpro.classic-light.css';
        
        link.onload = () => {
          console.log('✅ Bryntum CSS loaded successfully');
          resolve();
        };
        
        link.onerror = () => {
          console.error('❌ Failed to load Bryntum CSS');
          const error = new Error('Failed to load Bryntum CSS file. Please ensure the CSS is available.');
          const loadingOverlay = document.getElementById('loadingOverlay');
          if (loadingOverlay) {
            loadingOverlay.innerHTML = `
              <div style="text-align: center; color: red; background: white; padding: 2rem; border-radius: 8px; margin: 2rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <h3>⚠️ CSS Loading Failed</h3>
                <p>Failed to load Bryntum CSS assets.</p>
                <p>Please ensure the assets are accessible at <code>/schedulerpro.classic-light.css</code></p>
                <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
              </div>
            `;
          }
          reject(error);
        };
        
        document.head.appendChild(link);
      });
    };

    // Ensure Bryntum UMD script is loaded
    const ensureBryntumUMD = () => {
      return new Promise<void>((resolve) => {
        if (window.bryntum?.schedulerpro) {
          resolve();
          return;
        }

        const existingScript = document.getElementById('bryntum-umd-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'bryntum-umd-script';
          script.src = '/schedulerpro.umd.js';
          script.onload = () => resolve();
          script.onerror = () => {
            const error = new Error('Failed to load Bryntum Scheduler Pro assets. Please ensure the assets are available.');
            console.error('❌ Critical: Bryntum UMD script failed to load');
            // Show user-facing error
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
              loadingOverlay.innerHTML = `
                <div style="text-align: center; color: red; background: white; padding: 2rem; border-radius: 8px; margin: 2rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                  <h3>⚠️ Asset Loading Failed</h3>
                  <p>Failed to load Bryntum Scheduler Pro assets.</p>
                  <p>Please ensure the assets are accessible at <code>/schedulerpro.umd.js</code></p>
                  <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
                </div>
              `;
            }
            throw error;
          };
          document.head.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    // Main scheduler initialization function (extracted from dangerouslySetInnerHTML)
    const initProductionScheduler = async () => {
      try {
        // Wait for DOM and Bryntum to load
        if (!window.bryntum?.schedulerpro) {
          console.warn('🔄 Bryntum Scheduler Pro not available yet, retrying...');
          setTimeout(() => initProductionScheduler(), 500);
          return;
        }
        
        console.log('✅ Initializing Production Scheduler...');
        
        // Initialize scheduler using global bryntum object
        const { SchedulerPro } = window.bryntum.schedulerpro;
        
        // Set today's date to September 3, 2025
        const today = new Date(2025, 8, 3); // September 3, 2025
        today.setHours(8, 0, 0, 0); // Start at 8 AM
        
        // Helper to create a date relative to September 3, 2025
        function createDate(hoursFromNow: number) {
          const date = new Date(2025, 8, 3); // September 3, 2025
          date.setHours(8 + hoursFromNow, 0, 0, 0); // Start at 8 AM
          return date;
        }
        
        // Fetch real PT operations and resources from the backend
        let resources: any[] = [];
        let ptOperations: any[] = [];
        
        try {
          console.log('📡 Fetching data from backend APIs...');
          // Fetch resources and PT operations from the backend APIs
          const [resourcesResponse, operationsResponse] = await Promise.all([
            fetch('/api/resources'),
            fetch('/api/pt-operations')
          ]);
          
          if (resourcesResponse.ok) {
            resources = await resourcesResponse.json();
            console.log('✅ Resources fetched successfully:', resources.length);
          } else {
            console.error('❌ Failed to fetch resources:', resourcesResponse.status);
            throw new Error('Failed to fetch resources');
          }
          
          if (operationsResponse.ok) {
            ptOperations = await operationsResponse.json();
            console.log('✅ PT Operations fetched successfully:', ptOperations.length);
            if (ptOperations.length > 0) {
              console.log('✅ First PT operation sample:', ptOperations[0]);
            }
          } else {
            console.error('❌ Failed to fetch PT operations:', operationsResponse.status);
            throw new Error('Failed to fetch PT operations');
          }
        } catch (error) {
          console.error('❌ Error fetching data:', error);
          // Use fallback sample data
          resources = [
            { resource_id: 'cnc1', name: 'CNC Machine 1', category: 'Machining' },
            { resource_id: 'cnc2', name: 'CNC Machine 2', category: 'Machining' },
            { resource_id: 'assembly1', name: 'Assembly Line 1', category: 'Assembly' },
            { resource_id: 'assembly2', name: 'Assembly Line 2', category: 'Assembly' },
            { resource_id: 'qc1', name: 'Quality Control 1', category: 'Inspection' },
            { resource_id: 'packaging1', name: 'Packaging Station 1', category: 'Packaging' }
          ];
          console.log('⚠️ Using fallback sample resources');
        }

        // 🔧 FIX 1: Normalize Resources Before Scheduler (Per Architect Recommendation)
        console.log('🔧 Normalizing resources to fix ID mapping mismatch...');
        console.log('📋 Raw resources from API:', resources.map(r => ({ id: r.id, resource_id: r.resource_id, name: r.name })));
        
        resources = resources.map(r => ({
          id: String(r.resource_id ?? r.id), 
          name: r.name ?? r.resource_name ?? r.display_name ?? 'Resource', 
          category: r.category
        }));
        
        console.log('✅ Normalized resources:', resources.map(r => ({ id: r.id, name: r.name })));

        // Add an "Unscheduled" resource at the top to hold unscheduled operations
        resources.unshift({
          id: 'unscheduled',
          name: '🔄 Unscheduled Operations',
          category: 'Unscheduled',
          eventColor: '#808080' // Gray color for unscheduled items
        });

        // 🔧 FIX 2: Build Proper Resource Maps (Per Architect Recommendation)
        const resourceMap = new Map();
        const resourceByName = new Map();
        
        for (const r of resources) {
          resourceMap.set(r.id, r);
          if (r.name) {
            resourceByName.set(r.name.toLowerCase(), r);
          }
        }
        
        console.log('🗺️ Resource Map Keys:', Array.from(resourceMap.keys()));
        console.log('🗺️ Resource By Name Keys:', Array.from(resourceByName.keys()));

        // Process PT operations for the scheduler
        let events: any[] = [];
        let assignments: any[] = [];
        
        console.log('🔄 Processing PT operations for scheduler...');
        
        // Helper function for operation colors
        function getOperationColor(opName: string) {
          if (!opName) return 'teal';
          const s = opName.toLowerCase();
          if (s.includes('whirlpool')) return 'blue';
          if (s.includes('boil') || s.includes('boiling')) return 'indigo';
          if (s.includes('mash')) return 'cyan';
          if (s.includes('ferment')) return 'green';
          if (s.includes('matur')) return 'purple';
          if (s.includes('quality') || s.includes('qc')) return 'orange';
          if (s.includes('package') || s.includes('packaging')) return 'brown';
          if (s.includes('assembly')) return 'pink';
          if (s.includes('cnc') || s.includes('machine')) return 'red';
          return 'teal';
        }
        
        if (ptOperations && ptOperations.length > 0) {
          console.log('📋 Processing real PT operations for scheduler...');
          
          ptOperations.forEach((op: any, index: number) => {
            // Create the event
            const eventId = op.id || `event-${index}`;
            
            // Calculate start and end dates
            const startDate = op.scheduled_start ? new Date(op.scheduled_start) : createDate(index * 2);
            const duration = op.cycle_hrs || op.duration || 2; // Default 2 hours
            const endDate = op.scheduled_end ? new Date(op.scheduled_end) : new Date(startDate.getTime() + duration * 60 * 60 * 1000);
            
            const event = {
              id: eventId,
              name: op.operation_name || op.name || `Operation ${index + 1}`,
              startDate: startDate,
              endDate: endDate,
              duration: duration,
              durationUnit: 'hour',
              percentDone: op.percent_finished || 0,
              jobName: op.job_name,
              operationName: op.operation_name,
              eventColor: getOperationColor(op.operation_name),
              draggable: true,
              resizable: true,
              constraintType: 'startnoearlierthan',
              constraintDate: startDate
            };
            
            events.push(event);
            
            // 🔧 FIX 3: Normalize Assignment Mapping (Per Architect Recommendation)
            let resourceId = 'unscheduled'; // Default to unscheduled
            
            const matched = op.resource_id ?? op.resourceId;
            if (matched && resourceMap.has(String(matched))) {
              resourceId = String(matched);
              console.log(`✅ Matched resource ${resourceId} for operation ${event.name}`);
            } else if (op.resource_name && resourceByName.has(op.resource_name.toLowerCase())) {
              resourceId = resourceByName.get(op.resource_name.toLowerCase()).id;
              console.log(`✅ Matched resource ${resourceId} by name for operation ${event.name}`);
            } else {
              console.warn(`⚠️ No resource found for operation ${event.name} (resource_id: ${op.resource_id}, resourceId: ${op.resourceId}, resource_name: ${op.resource_name}), placing in unscheduled`);
            }
            
            assignments.push({
              id: `assignment-${eventId}`,
              eventId: eventId,
              resourceId: resourceId
            });
          });
        } else {
          // Create sample events for demonstration
          console.log('📋 Creating sample events for demonstration...');
          
          const sampleEvents = [
            { name: 'Mashing Operation', duration: 3, resourcePattern: 'mash' },
            { name: 'Boiling Process', duration: 2, resourcePattern: 'boil' },
            { name: 'Fermentation', duration: 8, resourcePattern: 'ferment' },
            { name: 'Quality Check', duration: 1, resourcePattern: 'qc' },
            { name: 'Packaging Line', duration: 4, resourcePattern: 'packaging' },
            { name: 'Assembly Process', duration: 3, resourcePattern: 'assembly' },
            { name: 'CNC Machining', duration: 5, resourcePattern: 'cnc' },
            { name: 'Whirlpool Separation', duration: 2, resourcePattern: 'whirlpool' }
          ];
          
          sampleEvents.forEach((sample, index) => {
            const hoursOffset = (index % 10) * 3; // Spread operations every 3 hours
            const daysOffset = Math.floor(index / 10); // New row every 10 operations
            
            const eventId = `event-${index}`;
            const startDate = createDate(hoursOffset + (daysOffset * 24));
            const endDate = new Date(startDate.getTime() + sample.duration * 60 * 60 * 1000);
            
            const event = {
              id: eventId,
              name: sample.name,
              startDate: startDate,
              endDate: endDate,
              duration: sample.duration,
              durationUnit: 'hour',
              percentDone: Math.floor(Math.random() * 100),
              jobName: `Job ${Math.floor(index / 3) + 1}`,
              operationName: sample.name,
              eventColor: getOperationColor(sample.name),
              draggable: true,
              resizable: true,
              constraintType: 'startnoearlierthan',
              constraintDate: startDate
            };
            
            events.push(event);
            
            // Find matching resource for this operation
            let assignedResourceId = 'unscheduled';
            for (const resource of resources) {
              if (resource.id === 'unscheduled') continue;
              if (resource.name.toLowerCase().includes(sample.resourcePattern) ||
                  resource.id.toLowerCase().includes(sample.resourcePattern)) {
                assignedResourceId = resource.id;
                break;
              }
            }
            
            // If no specific match found, use a random real resource (not unscheduled)
            if (assignedResourceId === 'unscheduled') {
              const realResources = resources.filter(r => r.id !== 'unscheduled');
              if (realResources.length > 0) {
                assignedResourceId = realResources[index % realResources.length].id;
              }
            }
            
            assignments.push({
              id: `assignment-${eventId}`,
              eventId: eventId,
              resourceId: assignedResourceId
            });
          });
        }
        
        console.log(`📊 Created ${events.length} events and ${assignments.length} assignments`);
        
        // 🐛 FIX 4: Enhanced Debug Logging (Per Architect Recommendation)
        const resourceDistribution = assignments.reduce((acc: any, a: any) => {
          acc[a.resourceId] = (acc[a.resourceId] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📋 Resource distribution:', resourceDistribution);
        
        const scheduledAssignments = assignments.filter(a => a.resourceId !== 'unscheduled');
        const unscheduledAssignments = assignments.filter(a => a.resourceId === 'unscheduled');
        
        console.log(`✅ VERIFICATION: ${scheduledAssignments.length} assignments scheduled, ${unscheduledAssignments.length} unscheduled`);
        console.log('📊 Scheduled assignments per resource:', scheduledAssignments.reduce((acc: any, a: any) => {
          acc[a.resourceId] = (acc[a.resourceId] || 0) + 1;
          return acc;
        }, {}));
        
        if (scheduledAssignments.length === 0) {
          console.error('🚨 CRITICAL: All assignments are unscheduled! Resource mapping failed.');
          console.log('🔍 Sample operation data:', ptOperations.slice(0, 3).map(op => ({
            resource_id: op.resource_id,
            resourceId: op.resourceId, 
            resource_name: op.resource_name,
            operation_name: op.operation_name
          })));
        } else {
          console.log('🎉 SUCCESS: Resource mapping working - operations properly distributed!');
        }

        // Create dependencies for demonstration
        const dependencies: any[] = [];
        if (events.length >= 3) {
          dependencies.push({
            id: 'dep1',
            fromEvent: events[0].id,
            toEvent: events[1].id,
            type: 'FinishToStart'
          });
          dependencies.push({
            id: 'dep2', 
            fromEvent: events[1].id,
            toEvent: events[2].id,
            type: 'FinishToStart'
          });
        }
        
        // Create scheduler configuration
        const schedulerConfig = {
          appendTo: document.getElementById('scheduler'),
          startDate: new Date(2025, 8, 3), // September 3, 2025
          endDate: new Date(2025, 8, 17),   // September 17, 2025 (2 weeks)
          viewPreset: 'dayAndWeek',
          rowHeight: 60,
          barMargin: 8,
          height: 600, // Explicit height to ensure all rows are visible
          autoHeight: false, // Disable auto height to use explicit height
          
          // Project data
          project: {
            resourceStore: {
              data: resources
            },
            eventStore: {
              data: events
            },
            assignmentStore: {
              data: assignments
            },
            dependencyStore: {
              data: dependencies
            }
          },
          
          // Features
          features: {
            stripe: true,
            dependencies: true,
            eventDrag: {
              showTooltip: true,
              constrainDragToResource: false
            },
            eventResize: {
              showTooltip: true
            },
            eventTooltip: {
              template: ({ eventRecord, resourceRecord }: any) => `
                <div style="padding: 10px;">
                  <strong>${eventRecord.name}</strong><br>
                  Resource: <em>${resourceRecord?.name || '—'}</em><br>
                  ${eventRecord.startDate ? `Start: ${eventRecord.startDate.toLocaleString()}<br>` : ''}
                  ${eventRecord.duration ? `Duration: ${eventRecord.duration} ${eventRecord.durationUnit || 'hour'}<br>` : ''}
                  Progress: ${eventRecord.percentDone || 0}%
                  ${resourceRecord?.id === 'unscheduled' ? '<br><span style="color: orange; font-weight: bold;">⚠ Drag to a resource to schedule</span>' : ''}
                </div>
              `
            },
            timeRanges: {
              showCurrentTimeLine: true
            },
            percentBar: true,
            nonWorkingTime: true,
            eventMenu: true,
            scheduleMenu: true
          },
          
          // Columns
          columns: [
            {
              type: 'rownumber',
              width: 50
            },
            {
              text: 'Resource',
              field: 'name',
              width: 200,
              renderer: ({ record }: any) => `
                <div>
                  <strong>${record.name}</strong>
                  ${record.category ? `<div style="font-size: 0.8em; color: #666;">${record.category}</div>` : ''}
                </div>
              `
            }
          ],
          
          // Event renderer
          eventRenderer: ({ eventRecord }: any) => {
            const duration = eventRecord.duration || 0;
            const unit = eventRecord.durationUnit || 'hour';
            return `
              <div style="padding: 2px 6px; font-size: 12px; line-height: 1.2;">
                <div style="font-weight: bold;">${eventRecord.name}</div>
                <div style="opacity: 0.8;">${duration}${unit.charAt(0)} • ${eventRecord.percentDone || 0}%</div>
              </div>
            `;
          }
        };

        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        
        // Create the scheduler
        const scheduler = new SchedulerPro(schedulerConfig);
        
        // Store reference globally
        window.scheduler = scheduler;
        
        // 🔧 DEBUG: Verify resources are loaded properly
        console.log('🎉 Scheduler initialized successfully!');
        console.log('🔍 DEBUG: Resource verification:');
        console.log(`   Total resources configured: ${resources.length}`);
        console.log(`   Resources in scheduler store: ${scheduler.resourceStore.count}`);
        console.log(`   Scheduler height: ${schedulerConfig.height}px`);
        console.log(`   Row height: ${schedulerConfig.rowHeight}px`);
        console.log(`   Expected total height needed: ${resources.length * schedulerConfig.rowHeight}px`);
        console.log('   Resource details:', scheduler.resourceStore.records.map(r => ({id: r.id, name: r.name})));
        
        // Verify scheduler grid display
        setTimeout(() => {
          const schedulerEl = document.getElementById('scheduler');
          if (schedulerEl) {
            console.log('🔍 DEBUG: Scheduler DOM verification:');
            console.log(`   Scheduler container height: ${schedulerEl.offsetHeight}px`);
            console.log(`   Scheduler container scroll height: ${schedulerEl.scrollHeight}px`);
            const gridRows = schedulerEl.querySelectorAll('.b-grid-row');
            console.log(`   Visible grid rows in DOM: ${gridRows.length}`);
          }
        }, 1000);
        
        // Update status bar with better error handling and timing
        const updateStatus = () => {
          if (!scheduler || !scheduler.eventStore || !scheduler.assignmentStore || !scheduler.resourceStore) {
            console.warn('⚠️ Scheduler stores not ready for status update');
            return;
          }
          
          const events = scheduler.eventStore.records || [];
          const assignments = scheduler.assignmentStore.records || [];
          const resources = scheduler.resourceStore.records || [];
          
          // 🔧 FIX 4: Harden Status Calculation (Per Architect Recommendation)  
          const scheduledAssignments = assignments.filter((a: any) => {
            const rid = a.resourceId ?? a.resource?.id ?? a.get?.('resourceId');
            return rid && rid !== 'unscheduled';
          });
          const scheduledCount = scheduledAssignments.length;
          
          console.log('📊 Status calculation details:');
          console.log(`   Total assignments: ${assignments.length}`);
          console.log(`   Scheduled assignments: ${scheduledCount}`);
          console.log(`   Assignment resource IDs:`, assignments.map(a => a.resourceId).slice(0, 10));
          const operationCountEl = document.getElementById('operationCount');
          if (operationCountEl) {
            operationCountEl.textContent = `${scheduledCount} operations scheduled`;
            console.log(`✅ Updated operation count: ${scheduledCount}`);
          } else {
            console.warn('⚠️ Operation count element not found');
          }
          
          // Calculate resource utilization with hardened logic
          const activeResources = resources.filter((r: any) => r.id !== 'unscheduled');
          const resourcesWithOps = new Set(
            scheduledAssignments.map((a: any) => a.resourceId)
          );
          
          console.log(`   Active resources: ${activeResources.length}`);
          console.log(`   Resources with operations: ${resourcesWithOps.size}`);
          console.log(`   Resource IDs with ops:`, Array.from(resourcesWithOps));
          const utilizationPercent = activeResources.length > 0 ? 
            Math.round((resourcesWithOps.size / activeResources.length) * 100) : 0;
          
          const utilizationEl = document.getElementById('resourceUtilization');
          if (utilizationEl) {
            utilizationEl.textContent = `Resource utilization: ${utilizationPercent}%`;
            console.log(`✅ Updated resource utilization: ${utilizationPercent}%`);
          } else {
            console.warn('⚠️ Resource utilization element not found');
          }
          
          // Additional debug info
          console.log(`📊 Status Update Details:`);
          console.log(`   Total events: ${events.length}`);
          console.log(`   Total assignments: ${assignments.length}`);
          console.log(`   Active resources: ${activeResources.length}`);
          console.log(`   Resources with operations: ${resourcesWithOps.size}`);
        };
        
        // Store the updateStatus function globally for access after DOM insertion
        window.updateSchedulerStatus = updateStatus;
        
        // Delay initial status update to ensure DOM is ready
        setTimeout(() => {
          console.log('🔄 Calling delayed status update...');
          updateStatus();
        }, 500);
        
        // Set up store listeners for real-time updates
        scheduler.eventStore.on('dataChange', updateStatus);
        scheduler.assignmentStore.on('dataChange', updateStatus);
        
        // Additional event listeners for more comprehensive updates
        scheduler.eventStore.on('add', updateStatus);
        scheduler.eventStore.on('remove', updateStatus);
        scheduler.assignmentStore.on('add', updateStatus);
        scheduler.assignmentStore.on('remove', updateStatus);
        
      } catch (error) {
        console.error('❌ Failed to initialize scheduler:', error);
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
          loadingOverlay.innerHTML = `
            <div style="text-align: center; color: red;">
              <h3>Failed to initialize scheduler</h3>
              <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
              <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px;">Retry</button>
            </div>
          `;
        }
      }
    };

    // Initialize the scheduler after ensuring dependencies are loaded
    const initializeScheduler = async () => {
      try {
        // Verify DOM elements exist before proceeding
        const requiredElements = ['scheduler', 'loadingOverlay', 'operationCount', 'resourceUtilization'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
          console.warn('⚠️ Required DOM elements missing:', missingElements);
          // DOM elements will be available after HTML content is rendered
        }
        
        await ensureBryntumCSS();
        await ensureBryntumUMD();
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          initProductionScheduler();
        }, 100);
      } catch (error) {
        console.error('❌ Failed to initialize scheduler:', error);
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
          loadingOverlay.innerHTML = `
            <div style="text-align: center; color: red; background: white; padding: 2rem; border-radius: 8px; margin: 2rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <h3>❌ Initialization Failed</h3>
              <p>Failed to initialize the scheduler component.</p>
              <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
              <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
            </div>
          `;
        }
      }
    };

    initializeScheduler();

    // Cleanup function for memory leak prevention
    return () => {
      console.log('🧹 Cleaning up Production Schedule component...');
      
      // Destroy scheduler instance
      if (window.scheduler) {
        try {
          // Remove event listeners first
          if (window.scheduler.eventStore) {
            window.scheduler.eventStore.un('dataChange');
            window.scheduler.eventStore.un('add');
            window.scheduler.eventStore.un('remove');
          }
          if (window.scheduler.assignmentStore) {
            window.scheduler.assignmentStore.un('dataChange');
            window.scheduler.assignmentStore.un('add');
            window.scheduler.assignmentStore.un('remove');
          }
          
          // Destroy scheduler instance
          if (typeof window.scheduler.destroy === 'function') {
            window.scheduler.destroy();
          }
          console.log('✅ Scheduler instance destroyed');
        } catch (error) {
          console.warn('⚠️ Error destroying scheduler:', error);
        }
        window.scheduler = null;
      }
      
      // Clear global functions
      window.initProductionScheduler = undefined;
      window.updateSchedulerStatus = undefined;
      window.toggleMaxAI = undefined;
      window.toggleNavMenu = undefined;
      window.closeNavMenu = undefined;
      window.openConstraintModal = undefined;
      window.closeConstraintModal = undefined;
      window.maxQuickAction = undefined;
      
      // Clear any status update intervals
      if (window.statusUpdateInterval) {
        clearInterval(window.statusUpdateInterval);
        window.statusUpdateInterval = undefined;
      }
      
      console.log('✅ Global cleanup completed');
    };

    // Implement Max AI panel toggle functionality
    const setupEventHandlers = () => {
      // Global toggle function for Max AI panel
      window.toggleMaxAI = function() {
        const panel = document.getElementById('maxAiPanel');
        if (panel) {
          panel.classList.toggle('closed');
        }
      };

      // Navigation menu toggle functions
      window.toggleNavMenu = function() {
        const menu = document.getElementById('navMenu');
        if (menu) {
          menu.classList.toggle('open');
        }
      };

      window.closeNavMenu = function() {
        const menu = document.getElementById('navMenu');
        if (menu) {
          menu.classList.remove('open');
        }
      };

      // Constraint modal functions
      window.openConstraintModal = function() {
        const modal = document.getElementById('constraintModal');
        if (modal) {
          modal.classList.add('active');
        }
      };

      window.closeConstraintModal = function() {
        const modal = document.getElementById('constraintModal');
        if (modal) {
          modal.classList.remove('active');
        }
      };

      // Quick action function for Max AI
      window.maxQuickAction = function(action) {
        const input = document.getElementById('maxInput');
        if (input) {
          switch (action) {
            case 'asap':
              input.value = 'Run ASAP scheduling';
              break;
            case 'alap':
              input.value = 'Run ALAP scheduling';
              break;
            case 'criticalPath':
              input.value = 'Execute critical path';
              break;
            case 'levelResources':
              input.value = 'Level the resources';
              break;
            case 'analyze':
              input.value = 'Analyze the schedule';
              break;
            case 'utilization':
              input.value = 'Show resource utilization';
              break;
          }
          // Trigger the send message function
          document.getElementById('maxSend')?.click();
        }
      };

      // Add event listeners for buttons that previously had inline onclick handlers
      
      // Navigation menu buttons
      document.getElementById('navMenuToggle')?.addEventListener('click', window.toggleNavMenu);
      document.getElementById('closeNavMenu')?.addEventListener('click', window.closeNavMenu);
      
      // Max AI panel buttons
      document.getElementById('maxAiToggle')?.addEventListener('click', window.toggleMaxAI);
      document.getElementById('closeMaxAi')?.addEventListener('click', window.toggleMaxAI);
      
      // Quick action buttons
      document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.closest('button')?.getAttribute('data-action');
          if (action) {
            window.maxQuickAction(action);
          }
        });
      });
      
      // Constraint modal buttons
      document.getElementById('constraintSettings')?.addEventListener('click', window.openConstraintModal);
      document.getElementById('closeConstraintModal')?.addEventListener('click', window.closeConstraintModal);
      document.getElementById('cancelConstraints')?.addEventListener('click', window.closeConstraintModal);
      
      document.getElementById('resetConstraints')?.addEventListener('click', () => {
        // Reset all checkboxes to their default states
        const checkboxes = document.querySelectorAll('#constraintModal input[type="checkbox"]');
        const defaults = {
          'noOverlap': true, 'dateValidation': true, 'mandatoryFields': true,
          'predecessorLogic': true, 'noCircular': true, 'workingHours': true,
          'leadLagTimes': true, 'noOverAllocation': true, 'skillMatching': true,
          'capacityLimits': true, 'materialAvailability': true, 'batchSizeRules': true,
          'priorityRules': true, 'needDates': true, 'workloadBalance': true,
          'limitOvertime': true, 'preventSameSetup': true, 'avoidPeakRates': true,
          'restrictPremium': true, 'auditTrails': true, 'minimizeMakespan': true
        };
        
        checkboxes.forEach(checkbox => {
          checkbox.checked = defaults[checkbox.id] || false;
        });
      });
      
      document.getElementById('applyConstraints')?.addEventListener('click', () => {
        // Collect all constraint settings
        const constraints = {};
        const checkboxes = document.querySelectorAll('#constraintModal input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          constraints[checkbox.id] = checkbox.checked;
        });
        
        // Apply constraints to scheduler if available
        if (window.scheduler && window.scheduler.project) {
          // Store constraints in the scheduler's project
          window.scheduler.project.constraintSettings = constraints;
        }
        
        // Close modal
        window.closeConstraintModal();
        
        // Show feedback
        const statusElement = document.getElementById('operationCount');
        const originalText = statusElement?.textContent || '';
        if (statusElement) {
          statusElement.innerHTML = '<span style="color: green; font-weight: bold;">Constraints applied successfully!</span>';
          setTimeout(() => {
            statusElement.textContent = originalText;
          }, 3000);
        }
      });
    };

    // Set up event handlers after a short delay to ensure DOM is ready
    setTimeout(setupEventHandlers, 500);

    // Add additional status update calls after DOM is ready
    setTimeout(() => {
      console.log('🔄 Calling post-DOM status update...');
      if (window.updateSchedulerStatus) {
        window.updateSchedulerStatus();
      }
      
      // Set up periodic status updates as fallback
      const statusInterval = setInterval(() => {
        if (window.updateSchedulerStatus && window.scheduler) {
          window.updateSchedulerStatus();
        }
      }, 2000); // Update every 2 seconds

      // Store interval ID for cleanup
      window.statusUpdateInterval = statusInterval;
    }, 1000);

    // Cleanup function
    return () => {
      // Clean up any global scheduler instances
      if (window.scheduler?.destroy) {
        try {
          window.scheduler.destroy();
          window.scheduler = undefined;
        } catch (error) {
          console.warn('Error cleaning up scheduler:', error);
        }
      }
      
      // Clean up status update interval
      if (window.statusUpdateInterval) {
        clearInterval(window.statusUpdateInterval);
        window.statusUpdateInterval = undefined;
      }
      
      // Clean up global functions
      window.updateSchedulerStatus = undefined;
    };
  }, []);

  // Component converted to proper JSX instead of dangerouslySetInnerHTML
  // This fixes the issue where raw HTML was being displayed as text
  
  return (
    <div className="w-full h-screen overflow-hidden bg-gray-50 flex flex-col text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }} data-testid="production-schedule-tsx">
      {/* Header */}
      <div className="bg-white/95 shadow-lg p-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-blue-600 text-xl font-bold">Production Schedule TSX</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors" id="navMenuToggle" data-testid="nav-menu-toggle">☰ Menu</button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" id="maxAiToggle" data-testid="max-ai-toggle">🤖 Max AI</button>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-white/90 px-8 py-3 flex items-center gap-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <label htmlFor="viewPreset" className="text-sm text-gray-600 font-medium">View:</label>
          <select id="viewPreset" className="px-3 py-1.5 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:border-gray-400 transition-colors" data-testid="view-preset">
            <option value="hourAndDay">Hour & Day</option>
            <option value="dayAndWeek" defaultSelected>Day & Week</option>
            <option value="weekAndMonth">Week & Month</option>
            <option value="monthAndYear">Month & Year</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <label htmlFor="schedulingAlgorithm" className="text-sm text-gray-600 font-medium">Algorithm:</label>
          <select id="schedulingAlgorithm" className="px-3 py-1.5 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:border-gray-400 transition-colors" data-testid="scheduling-algorithm">
            <option value="asap">ASAP (Forward)</option>
            <option value="alap">ALAP (Backward)</option>
            <option value="criticalPath">Critical Path</option>
            <option value="levelResources">Level Resources</option>
            <option value="drum">Drum (TOC)</option>
          </select>
          <button id="applyScheduling" className="px-3 py-1.5 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" data-testid="apply-scheduling">Apply Algorithm</button>
        </div>
        
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <button id="constraintSettings" className="px-3 py-1.5 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" data-testid="constraint-settings">⚙️ Constraints</button>
        </div>
        
        <div className="flex items-center gap-1">
          <button id="zoomIn" className="p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" title="Zoom In" data-testid="zoom-in">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
            </svg>
          </button>
          <button id="zoomOut" className="p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" title="Zoom Out" data-testid="zoom-out">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button id="zoomToFit" className="p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" title="Zoom to Fit" data-testid="zoom-to-fit">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
          <button id="refresh" className="p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors" title="Refresh" data-testid="refresh">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Scheduler Container */}
      <div className="flex-1 relative bg-white">
        <div id="scheduler" className="w-full h-full"></div>
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center" id="loadingOverlay">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 px-8 py-2 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
        <span id="operationCount">0 operations scheduled</span>
        <span id="resourceUtilization">Resource utilization: --</span>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    bryntum?: any;
    scheduler?: any;
    initProductionScheduler?: () => void;
    updateSchedulerStatus?: () => void;
    statusUpdateInterval?: NodeJS.Timeout;
    toggleMaxAI?: () => void;
    toggleNavMenu?: () => void;
    closeNavMenu?: () => void;
    openConstraintModal?: () => void;
    closeConstraintModal?: () => void;
    maxQuickAction?: (action: string) => void;
  }
}
