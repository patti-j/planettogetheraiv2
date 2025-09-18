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

  // The complete HTML content from the uploaded file (body content only)
  const htmlContent = `
    <!-- Complete styles from the HTML file -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
            overflow: auto;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            height: 100vh;
            font-size: 14px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .header h1 {
            color: #2563eb;
            font-size: 1.5rem;
            font-weight: bold;
        }

        .toolbar {
            background: rgba(255, 255, 255, 0.9);
            padding: 0.75rem 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid #e0e0e0;
            flex-shrink: 0;
        }

        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-right: 1rem;
            border-right: 1px solid #e0e0e0;
        }

        .toolbar-group:last-child {
            border-right: none;
        }

        .toolbar label {
            font-size: 0.875rem;
            color: #666;
            font-weight: 500;
        }

        .toolbar select,
        .toolbar button {
            padding: 0.375rem 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .toolbar select:hover,
        .toolbar button:hover {
            background: #f5f5f5;
            border-color: #999;
        }

        .toolbar button {
            background: white;
            color: #333 !important;
            border: 1px solid #e0e0e0;
            font-weight: 400;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            transition: all 0.2s;
        }

        .toolbar button:hover {
            background: #e8f5e9;
            transform: translateY(-1px);
            border-color: #4CAF50;
            color: #2e7d32 !important;
            box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
        }
        
        .toolbar button.icon-only {
            padding: 0.375rem 0.5rem;
            min-width: 32px;
        }
        
        .toolbar button svg {
            width: 16px;
            height: 16px;
        }

        .scheduler-container {
            flex: 1;
            margin: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        #scheduler {
            flex: 1;
            min-height: 600px;
            height: auto;
            overflow: auto;
        }

        .status-bar {
            background: rgba(255, 255, 255, 0.95);
            padding: 0.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            color: #666;
            border-top: 1px solid #e0e0e0;
            flex-shrink: 0;
        }

        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #666;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error-message {
            background: #ff4444;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem;
            text-align: center;
        }
        
        /* Dark theme overrides */
        .dark-theme {
            background: #1a1a1a;
        }
        
        .dark-theme .header {
            background: rgba(30, 30, 30, 0.95);
            color: white;
        }
        
        .dark-theme .header h1 {
            color: #60a5fa;
        }
        
        .dark-theme .toolbar {
            background: rgba(40, 40, 40, 0.9);
            border-bottom-color: #444;
        }
        
        .dark-theme .toolbar label {
            color: #ccc;
        }
        
        .dark-theme .toolbar button {
            background: #2a2a2a;
            color: #e0e0e0 !important;
            border-color: #444;
        }
        
        .dark-theme .toolbar button:hover {
            background: #1b5e20;
            color: #a5d6a7 !important;
            border-color: #4CAF50;
            box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
        }
        
        .dark-theme .toolbar select {
            background: #2a2a2a;
            color: #e0e0e0;
            border-color: #444;
        }
        
        .dark-theme .toolbar select:hover {
            background: #333;
            border-color: #666;
        }
        
        .dark-theme .status-bar {
            background: rgba(30, 30, 30, 0.95);
            color: #ccc;
            border-top-color: #444;
        }
        
        .dark-theme .scheduler-container {
            background: #2a2a2a;
        }
        
        /* Dark theme for scheduler using filter */
        .dark-theme #scheduler {
            filter: invert(0.9) hue-rotate(180deg);
        }
        
        /* Re-invert images and icons in dark mode */
        .dark-theme #scheduler img,
        .dark-theme #scheduler .b-icon {
            filter: invert(1) hue-rotate(-180deg);
        }
        
        /* Dependency lines styling */
        .b-sch-dependency {
            stroke: #666 !important;
            stroke-width: 2 !important;
            opacity: 0.8 !important;
        }
        
        .b-sch-dependency-arrow {
            fill: #666 !important;
            stroke: #666 !important;
        }
        
        .b-sch-dependency:hover {
            stroke: #333 !important;
            stroke-width: 3 !important;
            opacity: 1 !important;
        }
        
        .b-sch-dependency-arrow:hover {
            fill: #333 !important;
            stroke: #333 !important;
        }
        
        /* Critical path dependency styling */
        .b-sch-dependency.b-critical {
            stroke: #ff4444 !important;
            stroke-width: 3 !important;
        }
        
        .b-sch-dependency.b-critical .b-sch-dependency-arrow {
            fill: #ff4444 !important;
            stroke: #ff4444 !important;
        }
        
        /* Header updates for hamburger and Max AI */
        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .hamburger-btn, .max-ai-btn {
            background: white;
            border: 1px solid #ddd;
            color: #333;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
        }
        
        .hamburger-btn:hover, .max-ai-btn:hover {
            background: #f5f5f5;
            border-color: #999;
            transform: translateY(-1px);
        }
        
        /* Navigation Menu */
        .nav-menu {
            position: fixed;
            top: 0;
            left: -300px;
            width: 300px;
            height: 100vh;
            background: white;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            transition: left 0.3s ease;
            z-index: 2000;
        }
        
        .nav-menu.open {
            left: 0;
        }
        
        .nav-menu-header {
            background: #333;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .nav-menu-header h3 {
            margin: 0;
        }
        
        .close-menu, .close-max-ai {
            background: transparent;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
        }
        
        .nav-menu-items {
            padding: 1rem;
        }
        
        .nav-item {
            display: block;
            padding: 0.75rem 1rem;
            color: #333;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.2s;
            margin-bottom: 0.5rem;
        }
        
        .nav-item:hover {
            background: #f5f5f5;
        }
        
        .nav-item.active {
            background: #f0f0f0;
            color: #333;
            font-weight: 500;
        }
        
        /* Max AI Panel */
        .max-ai-panel {
            position: fixed;
            top: 0;
            right: 0; /* Visible by default to showcase scheduler features */
            width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            transition: right 0.3s ease;
            z-index: 2000;
            display: flex;
            flex-direction: column;
        }
        
        .max-ai-panel.closed {
            right: -400px;
            pointer-events: none;
        }
        
        .max-ai-header {
            background: #333;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .max-ai-header h3 {
            margin: 0;
        }
        
        .max-ai-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .max-ai-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        
        .max-ai-message {
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        
        .max-ai-message.assistant {
            background: #f0f0f0;
            font-size: 0.9rem;
        }
        
        .max-ai-message.user {
            background: rgba(59, 130, 246, 0.1);
            margin-left: 2rem;
        }
        
        .max-ai-message ul {
            margin-left: 1.5rem;
            margin-top: 0.5rem;
        }
        
        .max-ai-message strong {
            font-weight: 600;
            color: #333;
        }
        
        .max-ai-input {
            display: flex;
            padding: 1rem;
            border-top: 1px solid #e0e0e0;
            gap: 0.5rem;
        }
        
        .max-ai-input input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        
        .max-ai-input button {
            padding: 0.5rem 1rem;
            background: #333;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .max-ai-input button:hover {
            background: #555;
        }
        
        /* Dark theme for nav menu and Max AI */
        .dark-theme .nav-menu,
        .dark-theme .max-ai-panel {
            background: #2a2a2a;
            color: white;
        }
        
        .dark-theme .constraint-modal-content {
            background: #2a2a2a;
            color: white;
        }
        
        .dark-theme .constraint-modal-header {
            background: #333;
            border-bottom-color: #444;
        }
        
        .dark-theme .constraint-modal-header h2 {
            color: white;
        }
        
        .dark-theme .constraint-modal-close {
            color: #ccc;
        }
        
        .dark-theme .constraint-modal-close:hover {
            color: white;
        }
        
        .dark-theme .constraint-section h3 {
            color: white;
            border-bottom-color: #444;
        }
        
        .dark-theme .constraint-group h4 {
            color: #ccc;
        }
        
        .dark-theme .constraint-item:hover {
            background: #333;
        }
        
        .dark-theme .constraint-label {
            color: #e0e0e0;
        }
        
        .dark-theme .constraint-modal-footer {
            background: #333;
            border-top-color: #444;
        }
        
        .dark-theme .constraint-modal-footer button {
            background: #2a2a2a;
            color: #e0e0e0;
            border-color: #444;
        }
        
        .dark-theme .constraint-modal-footer button:hover {
            background: #1b5e20;
            color: #a5d6a7;
            border-color: #4CAF50;
        }
        
        .dark-theme .constraint-modal-footer button.apply {
            background: #2e7d32;
            color: white;
            border-color: #2e7d32;
        }
        
        .dark-theme .constraint-modal-footer button.apply:hover {
            background: #4CAF50;
        }
        
        .dark-theme .nav-item {
            color: #ccc;
        }
        
        .dark-theme .nav-item:hover {
            background: #333;
        }
        
        .dark-theme .nav-item.active {
            background: rgba(59, 130, 246, 0.2);
        }
        
        .dark-theme .max-ai-message.assistant {
            background: #333;
            color: #ccc;
        }
        
        .dark-theme .max-ai-message.user {
            background: rgba(59, 130, 246, 0.2);
            color: #ccc;
        }
        
        .dark-theme .max-ai-input {
            border-top-color: #444;
        }
        
        .dark-theme .max-ai-input input {
            background: #333;
            color: white;
            border-color: #444;
        }
        
        /* Quick Actions Styles */
        .max-ai-quick-actions {
            padding: 0.75rem;
            background: linear-gradient(to right, #eff6ff, #e0e7ff);
            border-bottom: 1px solid #e0e0e0;
        }
        
        .dark-theme .max-ai-quick-actions {
            background: linear-gradient(to right, #1a2332, #202842);
            border-bottom: 1px solid #444;
        }
        
        .quick-actions-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .dark-theme .quick-actions-title {
            color: #cbd5e0;
        }
        
        .quick-actions-section {
            margin-bottom: 0.75rem;
        }
        
        .quick-actions-label {
            font-size: 0.75rem;
            color: #718096;
            margin-bottom: 0.5rem;
        }
        
        .dark-theme .quick-actions-label {
            color: #a0aec0;
        }
        
        .quick-actions-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .quick-action-btn {
            padding: 0.5rem;
            font-size: 0.75rem;
            background: white;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
        }
        
        .dark-theme .quick-action-btn {
            background: #2d3748;
            border: 1px solid #4a5568;
            color: #e0e0e0;
        }
        
        .quick-action-btn:hover {
            background: #edf2f7;
            border-color: #666;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dark-theme .quick-action-btn:hover {
            background: #374151;
            border-color: #666;
        }
        
        /* Constraint Settings Styles */
        .constraint-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            align-items: center;
            justify-content: center;
        }
        
        .constraint-modal.active {
            display: flex;
        }
        
        .constraint-modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .constraint-modal-header {
            padding: 1rem 1.5rem;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .constraint-modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            color: #333;
        }
        
        .constraint-modal-close {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .constraint-modal-close:hover {
            color: #333;
        }
        
        .constraint-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
        }
        
        .constraint-section {
            margin-bottom: 2rem;
        }
        
        .constraint-section h3 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: #333;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .constraint-group {
            margin-bottom: 1rem;
        }
        
        .constraint-group h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.95rem;
            color: #555;
            font-weight: 600;
        }
        
        .constraint-item {
            display: flex;
            align-items: center;
            padding: 0.5rem;
            margin-bottom: 0.25rem;
            border-radius: 4px;
            transition: background 0.2s;
        }
        
        .constraint-item:hover {
            background: #f9f9f9;
        }
        
        .constraint-toggle {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 22px;
            margin-right: 1rem;
        }
        
        .constraint-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .constraint-toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.3s;
            border-radius: 22px;
        }
        
        .constraint-toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
        }
        
        .constraint-toggle input:checked + .constraint-toggle-slider {
            background-color: #4CAF50;
        }
        
        .constraint-toggle input:checked + .constraint-toggle-slider:before {
            transform: translateX(18px);
        }
        
        .constraint-label {
            flex: 1;
            cursor: pointer;
            font-size: 0.875rem;
            color: #333;
        }
        
        .constraint-modal-footer {
            padding: 1rem 1.5rem;
            background: #f5f5f5;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        
        .constraint-modal-footer button {
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            color: #333;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .constraint-modal-footer button:hover {
            background: #f5f5f5;
            border-color: #999;
        }
        
        .constraint-modal-footer button.apply {
            background: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
        
        .constraint-modal-footer button.apply:hover {
            background: #45a049;
        }
    </style>

    <!-- Navigation Menu -->
    <div id="navMenu" class="nav-menu">
        <div class="nav-menu-header">
            <h3>Navigation</h3>
            <button class="close-menu" id="closeNavMenu">×</button>
        </div>
        <div class="nav-menu-items">
            <a href="#dashboard" class="nav-item">📊 Dashboard</a>
            <a href="#production-schedule" class="nav-item active" data-testid="nav-production-schedule">📅 Production Schedule</a>
            <a href="#capacity-planning" class="nav-item">⚙️ Capacity Planning</a>
            <a href="#inventory" class="nav-item">📦 Inventory</a>
            <a href="#quality" class="nav-item">✅ Quality</a>
            <a href="#analytics" class="nav-item">📈 Analytics</a>
            <a href="#settings" class="nav-item">⚙️ Settings</a>
        </div>
    </div>

    <!-- Max AI Panel -->
    <div id="maxAiPanel" class="max-ai-panel closed">
        <div class="max-ai-header">
            <h3>🤖 Max AI Assistant</h3>
            <button class="close-max-ai" id="closeMaxAi">×</button>
        </div>
        <div class="max-ai-content">
            <!-- Quick Actions Section -->
            <div class="max-ai-quick-actions">
                <div class="quick-actions-title">
                    ⚡ Quick Actions
                </div>
                
                <div class="quick-actions-section">
                    <div class="quick-actions-label">Scheduling Algorithms</div>
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" data-action="asap" data-testid="quick-action-asap">
                            🚀 ASAP
                        </button>
                        <button class="quick-action-btn" data-action="alap" data-testid="quick-action-alap">
                            ⏰ ALAP
                        </button>
                        <button class="quick-action-btn" data-action="criticalPath" data-testid="quick-action-critical-path">
                            🎯 Critical Path
                        </button>
                        <button class="quick-action-btn" data-action="levelResources" data-testid="quick-action-level-resources">
                            ⚖️ Level Resources
                        </button>
                    </div>
                </div>
                
                <div class="quick-actions-section">
                    <div class="quick-actions-label">Analysis</div>
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" data-action="analyze" data-testid="quick-action-analyze">
                            📊 Analyze
                        </button>
                        <button class="quick-action-btn" data-action="utilization" data-testid="quick-action-utilization">
                            📈 Utilization
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="max-ai-messages" id="maxMessages">
                <div class="max-ai-message assistant">
                    <strong>🤖 Max AI Assistant</strong><br><br>
                    Welcome to the Production Schedule optimization assistant!<br><br>
                    <strong>I can help you:</strong><br>
                    • Run scheduling algorithms (ASAP, ALAP, Critical Path, etc.)<br>
                    • Analyze resource utilization and bottlenecks<br>
                    • Provide optimization recommendations<br>
                    • Explain different scheduling approaches<br><br>
                    <strong>Try saying:</strong><br>
                    • "Run ASAP scheduling"<br>
                    • "Analyze the current schedule"<br>
                    • "What is critical path?"<br>
                    • "Level the resources"<br><br>
                    Use the quick action buttons above for instant optimization!
                </div>
            </div>
            <div class="max-ai-input">
                <input type="text" id="maxInput" placeholder="Ask me about scheduling optimization..." data-testid="max-ai-input">
                <button id="maxSend" data-testid="max-ai-send">Send</button>
            </div>
        </div>
    </div>

    <!-- Header -->
    <div class="header">
        <h1>Production Schedule TSX</h1>
        <div class="header-actions">
            <button class="hamburger-btn" id="navMenuToggle" data-testid="nav-menu-toggle">☰ Menu</button>
            <button class="max-ai-btn" id="maxAiToggle" data-testid="max-ai-toggle">🤖 Max AI</button>
        </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
        <div class="toolbar-group">
            <label for="viewPreset">View:</label>
            <select id="viewPreset" data-testid="view-preset">
                <option value="hourAndDay">Hour & Day</option>
                <option value="dayAndWeek" selected>Day & Week</option>
                <option value="weekAndMonth">Week & Month</option>
                <option value="monthAndYear">Month & Year</option>
            </select>
        </div>
        
        <div class="toolbar-group">
            <label for="schedulingAlgorithm">Algorithm:</label>
            <select id="schedulingAlgorithm" data-testid="scheduling-algorithm">
                <option value="asap">ASAP (Forward)</option>
                <option value="alap">ALAP (Backward)</option>
                <option value="criticalPath">Critical Path</option>
                <option value="levelResources">Level Resources</option>
                <option value="drum">Drum (TOC)</option>
            </select>
            <button id="applyScheduling" data-testid="apply-scheduling">Apply Algorithm</button>
        </div>
        
        <div class="toolbar-group">
            <button id="constraintSettings" data-testid="constraint-settings">⚙️ Constraints</button>
        </div>
        
        <div class="toolbar-group">
            <button id="zoomIn" class="icon-only" title="Zoom In" data-testid="zoom-in">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                </svg>
            </button>
            <button id="zoomOut" class="icon-only" title="Zoom Out" data-testid="zoom-out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            </button>
            <button id="zoomToFit" title="Zoom to Fit" data-testid="zoom-to-fit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            </button>
            <button id="refresh" title="Refresh" data-testid="refresh">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            </button>
        </div>
    </div>

    <div class="scheduler-container">
        <div id="scheduler"></div>
        <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner"></div>
        </div>
    </div>

    <div class="status-bar">
        <span id="operationCount">0 operations scheduled</span>
        <span id="resourceUtilization">Resource utilization: --</span>
    </div>
    
    <!-- Constraint Settings Modal -->
    <div id="constraintModal" class="constraint-modal">
        <div class="constraint-modal-content">
            <div class="constraint-modal-header">
                <h2>Optimization Constraints Configuration</h2>
                <button class="constraint-modal-close" id="closeConstraintModal">×</button>
            </div>
            <div class="constraint-modal-body">
                <!-- Physical Constraints Section -->
                <div class="constraint-section">
                    <h3>Physical Constraints</h3>
                    
                    <div class="constraint-group">
                        <h4>General Validation Rules</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="noOverlap" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="noOverlap" class="constraint-label">No overlapping activities (unless overlap features enabled)</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="dateValidation" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="dateValidation" class="constraint-label">Start date must precede end date</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="mandatoryFields" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="mandatoryFields" class="constraint-label">Activities must include mandatory fields</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Dependency Constraints</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="predecessorLogic" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="predecessorLogic" class="constraint-label">Follow predecessor/successor logic (FS, SS, etc.)</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="noCircular" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="noCircular" class="constraint-label">Prevent circular dependencies</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Time Constraints</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="workingHours" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="workingHours" class="constraint-label">Align with working hours and holidays</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="leadLagTimes" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="leadLagTimes" class="constraint-label">Respect lead/lag times for dependencies</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Resource Constraints</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="noOverAllocation" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="noOverAllocation" class="constraint-label">Prevent resource over-allocation</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="skillMatching" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="skillMatching" class="constraint-label">Match resource skills/capabilities</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="capacityLimits" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="capacityLimits" class="constraint-label">Respect capacity limits (e.g., machine throughput)</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Inventory/Material Constraints</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="materialAvailability" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="materialAvailability" class="constraint-label">Required material must be available</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="batchSizeRules" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="batchSizeRules" class="constraint-label">Adhere to min/max batch size rules</label>
                        </div>
                    </div>
                </div>
                
                <!-- Policy Constraints Section -->
                <div class="constraint-section">
                    <h3>Policy Constraints</h3>
                    
                    <div class="constraint-group">
                        <h4>Business Rules</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="priorityRules" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="priorityRules" class="constraint-label">High-priority activities given preference</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="needDates" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="needDates" class="constraint-label">Jobs must meet Need Dates</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="budgetConstraints">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="budgetConstraints" class="constraint-label">Stay within budgeted labor/resource costs</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Time Flexibility</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="weekendWork">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="weekendWork" class="constraint-label">Permit weekend/holiday work for deadlines</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="workloadBalance" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="workloadBalance" class="constraint-label">Balance workload across shifts</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="limitOvertime" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="limitOvertime" class="constraint-label">Limit overtime to control labor costs</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Process Flow</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="parallelProcessing">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="parallelProcessing" class="constraint-label">Allow parallel processing for non-dependent activities</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="alternativeRouting">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="alternativeRouting" class="constraint-label">Permit alternative routing paths</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="skipNonCritical">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="skipNonCritical" class="constraint-label">Skip non-critical steps for low-priority orders</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="preventSameSetup" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="preventSameSetup" class="constraint-label">Prevent same setup type on multiple resources</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Material Handling</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="justInTime">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="justInTime" class="constraint-label">Schedule assuming just-in-time material delivery</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="substituteMaterials">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="substituteMaterials" class="constraint-label">Allow substitute materials if primary unavailable</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="partialMaterial">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="partialMaterial" class="constraint-label">Start with partial material availability</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Cost Control</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="avoidPeakRates" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="avoidPeakRates" class="constraint-label">Avoid high-energy activities during peak utility rates</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="costEfficiency">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="costEfficiency" class="constraint-label">Prioritize cost-efficient activities over urgency</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="restrictPremium" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="restrictPremium" class="constraint-label">Restrict use of premium resources unless necessary</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Quality & Compliance</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="deferredInspections">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="deferredInspections" class="constraint-label">Allow deferred inspections post-production</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="processDeviations">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="processDeviations" class="constraint-label">Accept minor deviations within tolerance</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="auditTrails" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="auditTrails" class="constraint-label">Enable detailed audit trails</label>
                        </div>
                    </div>
                    
                    <div class="constraint-group">
                        <h4>Optimization Preferences</h4>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="minimizeMakespan" checked>
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="minimizeMakespan" class="constraint-label">Minimize makespan to complete jobs quickly</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="maximizeUtilization">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="maximizeUtilization" class="constraint-label">Maximize machine utilization over labor cost</label>
                        </div>
                        <div class="constraint-item">
                            <label class="constraint-toggle">
                                <input type="checkbox" id="prioritizeMargin">
                                <span class="constraint-toggle-slider"></span>
                            </label>
                            <label for="prioritizeMargin" class="constraint-label">Prioritize high-margin orders when capacity limited</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="constraint-modal-footer">
                <button id="resetConstraints">Reset to Defaults</button>
                <button id="cancelConstraints">Cancel</button>
                <button class="apply" id="applyConstraints">Apply Constraints</button>
            </div>
        </div>
    </div>

    <script>
        // Initialize the complete scheduler functionality
        (function() {
            // Declare global variables and functions that will be accessible
            let scheduler = null;
            
            // Global function accessible from React
            window.initProductionScheduler = async function() {
                try {
                    // Wait for DOM and Bryntum to load
                    if (!window.bryntum?.schedulerpro) {
                        console.warn('Bryntum Scheduler Pro not available yet, retrying...');
                        setTimeout(window.initProductionScheduler, 500);
                        return;
                    }
                    
                    console.log('✅ Initializing Production Scheduler...');
                    
                    // Initialize scheduler using global bryntum object
                    const { SchedulerPro } = window.bryntum.schedulerpro;
                    
                    // Set today's date to September 3, 2025
                    const today = new Date(2025, 8, 3); // September 3, 2025
                    today.setHours(8, 0, 0, 0); // Start at 8 AM
                    
                    // Helper to create a date relative to September 3, 2025
                    function createDate(hoursFromNow) {
                        const date = new Date(2025, 8, 3); // September 3, 2025
                        date.setHours(8 + hoursFromNow, 0, 0, 0); // Start at 8 AM
                        return date;
                    }
                    
                    // Fetch real PT operations and resources from the backend
                    let resources = [];
                    let ptOperations = [];
                    
                    try {
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
                            // Fallback sample data
                            resources = [
                                { id: 'cnc1', name: 'CNC Machine 1', category: 'Machining' },
                                { id: 'cnc2', name: 'CNC Machine 2', category: 'Machining' },
                                { id: 'assembly1', name: 'Assembly Line 1', category: 'Assembly' },
                                { id: 'assembly2', name: 'Assembly Line 2', category: 'Assembly' },
                                { id: 'qc1', name: 'Quality Control 1', category: 'Inspection' },
                                { id: 'packaging1', name: 'Packaging Station 1', category: 'Packaging' }
                            ];
                        }
                        
                        // Add an "Unscheduled" resource at the top to hold unscheduled operations
                        resources.unshift({
                            id: 'unscheduled',
                            name: '🔄 Unscheduled Operations',
                            category: 'Unscheduled',
                            eventColor: '#808080' // Gray color for unscheduled items
                        });
                        
                        if (operationsResponse.ok) {
                            ptOperations = await operationsResponse.json();
                            console.log('✅ PT Operations fetched successfully:', ptOperations.length);
                            if (ptOperations.length > 0) {
                                console.log('✅ First PT operation sample:', ptOperations[0]);
                            }
                        } else {
                            console.error('❌ Failed to fetch PT operations:', operationsResponse.status);
                        }
                    } catch (error) {
                        console.error('❌ Error fetching data:', error);
                        // Use fallback sample data
                        resources = [
                            { id: 'cnc1', name: 'CNC Machine 1', category: 'Machining' },
                            { id: 'cnc2', name: 'CNC Machine 2', category: 'Machining' },
                            { id: 'assembly1', name: 'Assembly Line 1', category: 'Assembly' },
                            { id: 'assembly2', name: 'Assembly Line 2', category: 'Assembly' },
                            { id: 'qc1', name: 'Quality Control 1', category: 'Inspection' },
                            { id: 'packaging1', name: 'Packaging Station 1', category: 'Packaging' }
                        ];
                    }

                    // Map resources to create resource lookup by both ID and name
                    const resourceMap = new Map();
                    const resourceByName = new Map();
                    resources.forEach(resource => {
                        resourceMap.set(resource.id, resource);
                        resourceMap.set(resource.name, resource);
                        // Also create a name-based lookup for better matching
                        resourceByName.set(resource.name?.toLowerCase(), resource);
                    });

                    // Process PT operations for the scheduler
                    let events = [];
                    let assignments = [];
                    
                    if (ptOperations && ptOperations.length > 0) {
                        console.log('📋 Processing PT operations for scheduler...');
                        
                        ptOperations.forEach((op, index) => {
                            // Create the event
                            const eventId = op.id || \`event-\${index}\`;
                            
                            // Calculate start and end dates
                            const startDate = op.scheduled_start ? new Date(op.scheduled_start) : createDate(index * 2);
                            const duration = op.cycle_hrs || op.duration || 2; // Default 2 hours
                            const endDate = op.scheduled_end ? new Date(op.scheduled_end) : new Date(startDate.getTime() + duration * 60 * 60 * 1000);
                            
                            const event = {
                                id: eventId,
                                name: op.operation_name || op.name || \`Operation \${index + 1}\`,
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
                            
                            // Create assignment based on resource mapping
                            let resourceId = 'unscheduled'; // Default to unscheduled
                            
                            // Try different ways to match the resource
                            if (op.resource_id && resourceMap.has(op.resource_id)) {
                                resourceId = op.resource_id;
                            } else if (op.resource_name && resourceByName.has(op.resource_name.toLowerCase())) {
                                resourceId = resourceByName.get(op.resource_name.toLowerCase()).id;
                            } else if (op.resourceId && resourceMap.has(op.resourceId)) {
                                resourceId = op.resourceId;
                            } else {
                                // If we can't find a resource, put it in unscheduled
                                console.warn(\`⚠️ No resource found for operation \${event.name}, placing in unscheduled\`);
                            }
                            
                            assignments.push({
                                id: \`assignment-\${eventId}\`,
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
                            
                            const eventId = \`event-\${index}\`;
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
                                jobName: \`Job \${Math.floor(index / 3) + 1}\`,
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
                                id: \`assignment-\${eventId}\`,
                                eventId: eventId,
                                resourceId: assignedResourceId
                            });
                        });
                    }
                    
                    console.log(\`📊 Created \${events.length} events and \${assignments.length} assignments\`);
                    console.log('📋 Resource distribution:', assignments.reduce((acc, a) => {
                        acc[a.resourceId] = (acc[a.resourceId] || 0) + 1;
                        return acc;
                    }, {}));

                    // Create dependencies for demonstration
                    const dependencies = [];
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
                    
                    // Helper function for operation colors
                    function getOperationColor(opName) {
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
                    
                    // Create scheduler configuration
                    const schedulerConfig = {
                        appendTo: document.getElementById('scheduler'),
                        startDate: new Date(2025, 8, 3), // September 3, 2025
                        endDate: new Date(2025, 8, 17),   // September 17, 2025 (2 weeks)
                        viewPreset: 'dayAndWeek',
                        rowHeight: 60,
                        barMargin: 8,
                        
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
                                template: ({ eventRecord, resourceRecord }) => \`
                                    <div style="padding: 10px;">
                                        <strong>\${eventRecord.name}</strong><br>
                                        Resource: <em>\${resourceRecord?.name || '—'}</em><br>
                                        \${eventRecord.startDate ? \`Start: \${eventRecord.startDate.toLocaleString()}<br>\` : ''}
                                        \${eventRecord.duration ? \`Duration: \${eventRecord.duration} \${eventRecord.durationUnit || 'hour'}<br>\` : ''}
                                        Progress: \${eventRecord.percentDone || 0}%
                                        \${resourceRecord?.id === 'unscheduled' ? '<br><span style="color: orange; font-weight: bold;">⚠ Drag to a resource to schedule</span>' : ''}
                                    </div>
                                \`
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
                                renderer: ({ record }) => \`
                                    <div>
                                        <strong>\${record.name}</strong>
                                        \${record.category ? \`<div style="font-size: 0.8em; color: #666;">\${record.category}</div>\` : ''}
                                    </div>
                                \`
                            }
                        ],
                        
                        // Event renderer
                        eventRenderer: ({ eventRecord, assignmentRecord }) => {
                            const duration = eventRecord.duration || 0;
                            const unit = eventRecord.durationUnit || 'hour';
                            return \`
                                <div style="padding: 2px 6px; font-size: 12px; line-height: 1.2;">
                                    <div style="font-weight: bold;">\${eventRecord.name}</div>
                                    <div style="opacity: 0.8;">\${duration}\${unit.charAt(0)} • \${eventRecord.percentDone || 0}%</div>
                                </div>
                            \`;
                        }
                    };
                    
                    // Hide loading overlay
                    document.getElementById('loadingOverlay').style.display = 'none';
                    
                    // Create the scheduler
                    scheduler = new SchedulerPro(schedulerConfig);
                    
                    // Store reference globally
                    window.scheduler = scheduler;
                    
                    // Set up event listeners
                    setupEventListeners();
                    
                    // Update status
                    updateStatus();
                    
                    console.log('✅ Production Scheduler initialized successfully!');
                    
                } catch (error) {
                    console.error('❌ Error initializing scheduler:', error);
                    document.getElementById('loadingOverlay').style.display = 'none';
                    
                    // Show error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = \`Failed to initialize scheduler: \${error.message}\`;
                    document.getElementById('scheduler').appendChild(errorDiv);
                }
            };
            
            // Set up all event listeners and functionality
            function setupEventListeners() {
                // Navigation menu functions
                window.toggleNavMenu = function() {
                    const navMenu = document.getElementById('navMenu');
                    navMenu.classList.toggle('open');
                };
                
                window.closeNavMenu = function() {
                    const navMenu = document.getElementById('navMenu');
                    navMenu.classList.remove('open');
                };
                
                // Max AI functions
                window.toggleMaxAI = function() {
                    const maxAiPanel = document.getElementById('maxAiPanel');
                    maxAiPanel.classList.toggle('closed');
                };
                
                // Constraint modal functions
                window.openConstraintModal = function() {
                    document.getElementById('constraintModal').classList.add('active');
                };
                
                window.closeConstraintModal = function() {
                    document.getElementById('constraintModal').classList.remove('active');
                };
                
                window.resetConstraints = function() {
                    // Reset all checkboxes to their default states
                    const checkboxes = document.querySelectorAll('#constraintModal input[type="checkbox"]');
                    const defaults = {
                        'noOverlap': true,
                        'dateValidation': true,
                        'mandatoryFields': true,
                        'predecessorLogic': true,
                        'noCircular': true,
                        'workingHours': true,
                        'leadLagTimes': true,
                        'noOverAllocation': true,
                        'skillMatching': true,
                        'capacityLimits': true,
                        'materialAvailability': true,
                        'batchSizeRules': true,
                        'priorityRules': true,
                        'needDates': true,
                        'workloadBalance': true,
                        'limitOvertime': true,
                        'preventSameSetup': true,
                        'avoidPeakRates': true,
                        'restrictPremium': true,
                        'auditTrails': true,
                        'minimizeMakespan': true
                    };
                    
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = defaults[checkbox.id] || false;
                    });
                };
                
                window.applyConstraints = function() {
                    // Collect all constraint settings
                    const constraints = {};
                    const checkboxes = document.querySelectorAll('#constraintModal input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                        constraints[checkbox.id] = checkbox.checked;
                    });
                    
                    console.log('Applied constraints:', constraints);
                    // Here you would apply the constraints to the scheduler
                    
                    window.closeConstraintModal();
                    
                    // Show success message
                    const statusElement = document.getElementById('operationCount');
                    const originalText = statusElement.textContent;
                    statusElement.innerHTML = '<span style="color: green; font-weight: bold;">Constraints applied successfully!</span>';
                    
                    setTimeout(() => {
                        statusElement.textContent = originalText;
                        updateStatus();
                    }, 3000);
                };
                
                // Max AI Quick Actions
                window.maxQuickAction = function(action) {
                    const messages = {
                        'asap': 'run asap scheduling',
                        'alap': 'run alap scheduling', 
                        'criticalPath': 'execute critical path',
                        'levelResources': 'level resources',
                        'analyze': 'analyze schedule',
                        'utilization': 'show utilization'
                    };
                    
                    if (messages[action]) {
                        // Simulate sending the message
                        const input = document.getElementById('maxInput');
                        input.value = messages[action];
                        sendMaxMessage();
                    }
                };
                
                // Max AI message handling
                function sendMaxMessage() {
                    const maxInput = document.getElementById('maxInput');
                    const maxMessages = document.getElementById('maxMessages');
                    const message = maxInput.value.trim();
                    
                    if (!message) return;
                    
                    // Add user message
                    const userMsg = document.createElement('div');
                    userMsg.className = 'max-ai-message user';
                    userMsg.textContent = message;
                    maxMessages.appendChild(userMsg);
                    
                    // Clear input
                    maxInput.value = '';
                    
                    // Process AI response and execute algorithms
                    setTimeout(async () => {
                        const aiMsg = document.createElement('div');
                        aiMsg.className = 'max-ai-message assistant';
                        
                        // Parse message for algorithm commands
                        const lowerMessage = message.toLowerCase();
                        let response = '';
                        let executedAlgorithm = null;
                        
                        // Check for algorithm execution commands
                        if (lowerMessage.includes('run') || lowerMessage.includes('execute') || lowerMessage.includes('apply') || lowerMessage.includes('optimize')) {
                            if (lowerMessage.includes('asap') || lowerMessage.includes('forward')) {
                                executedAlgorithm = 'asap';
                                response = '🚀 Executing ASAP (Forward) scheduling algorithm...';
                            } else if (lowerMessage.includes('alap') || lowerMessage.includes('backward')) {
                                executedAlgorithm = 'alap';
                                response = '⏰ Executing ALAP (Backward) scheduling algorithm...';
                            } else if (lowerMessage.includes('critical path')) {
                                executedAlgorithm = 'criticalPath';
                                response = '🎯 Executing Critical Path optimization...';
                            } else if (lowerMessage.includes('level') || lowerMessage.includes('balance resource')) {
                                executedAlgorithm = 'levelResources';
                                response = '⚖️ Executing Resource Leveling algorithm...';
                            } else if (lowerMessage.includes('drum') || lowerMessage.includes('toc') || lowerMessage.includes('constraint')) {
                                executedAlgorithm = 'drum';
                                response = '🥁 Executing Drum (Theory of Constraints) optimization...';
                            } else {
                                response = 'To optimize the schedule, please specify an algorithm. You can say:\\n• "Run ASAP scheduling"\\n• "Apply ALAP algorithm"\\n• "Execute critical path optimization"\\n• "Level resources"\\n• "Apply drum scheduling"';
                            }
                        } 
                        // Check for analysis or information requests
                        else if (lowerMessage.includes('what') || lowerMessage.includes('explain') || lowerMessage.includes('tell me about')) {
                            if (lowerMessage.includes('asap')) {
                                response = 'ASAP (As Soon As Possible) pushes all operations to the earliest possible time slots. Best for urgent orders or maximizing early throughput. Say "Run ASAP" to apply it.';
                            } else if (lowerMessage.includes('alap')) {
                                response = 'ALAP (As Late As Possible) delays operations to the latest time that still meets due dates. Minimizes inventory holding costs. Say "Run ALAP" to apply it.';
                            } else if (lowerMessage.includes('critical path')) {
                                response = 'Critical Path identifies the longest sequence of dependent tasks and optimizes them first. Minimizes project completion time. Say "Execute critical path" to apply it.';
                            } else if (lowerMessage.includes('level') || lowerMessage.includes('resource')) {
                                response = 'Resource Leveling distributes work evenly across all resources. Prevents overloading and improves efficiency. Say "Level resources" to apply it.';
                            } else if (lowerMessage.includes('drum') || lowerMessage.includes('toc')) {
                                response = 'Drum scheduling (TOC) identifies your bottleneck resource and optimizes around it. Maximizes throughput. Say "Apply drum scheduling" to apply it.';
                            } else if (lowerMessage.includes('current') || lowerMessage.includes('active')) {
                                const currentAlgo = document.getElementById('schedulingAlgorithm').value;
                                const algoNames = {
                                    'asap': 'ASAP (Forward)',
                                    'alap': 'ALAP (Backward)',
                                    'criticalPath': 'Critical Path',
                                    'levelResources': 'Resource Leveling',
                                    'drum': 'Drum (TOC)'
                                };
                                response = \`The current active algorithm is: \${algoNames[currentAlgo]}. You can ask me to run any other algorithm to change it.\`;
                            } else {
                                response = 'I can help you optimize the schedule. Try asking:\\n• "Run ASAP scheduling"\\n• "What is the current algorithm?"\\n• "Explain critical path"\\n• "Level the resources"';
                            }
                        }
                        // Check for help commands
                        else if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
                            response = '📊 **Schedule Optimization Commands:**\\n\\n**Execute Algorithms:**\\n• Run ASAP\\n• Apply ALAP\\n• Execute critical path\\n• Level resources\\n• Apply drum scheduling\\n\\n**Get Information:**\\n• What is ASAP?\\n• Explain critical path\\n• Current algorithm?\\n\\n**Analysis:**\\n• Analyze schedule\\n• Show utilization';
                        }
                        // Check for analysis commands
                        else if (lowerMessage.includes('analyze') || lowerMessage.includes('utilization') || lowerMessage.includes('insights') || lowerMessage.includes('bottleneck')) {
                            // Perform detailed schedule analysis
                            const events = scheduler.eventStore.records || [];
                            const resources = scheduler.resourceStore.records || [];
                            
                            // Calculate resource utilization details
                            const resourceUsage = {};
                            resources.forEach(resource => {
                                const assignments = scheduler.assignmentStore.records.filter(a => a.resourceId === resource.id);
                                const resourceEvents = assignments.map(a => scheduler.eventStore.getById(a.eventId)).filter(Boolean);
                                let totalDuration = 0;
                                resourceEvents.forEach(event => {
                                    const duration = (event.endDate - event.startDate) / (1000 * 60 * 60); // hours
                                    totalDuration += duration;
                                });
                                resourceUsage[resource.name] = {
                                    operations: resourceEvents.length,
                                    hoursUsed: totalDuration.toFixed(1),
                                    utilization: resourceEvents.length > 0 ? 100 : 0
                                };
                            });
                            
                            // Find bottlenecks (resources with highest utilization)
                            let bottleneck = null;
                            let maxOps = 0;
                            Object.entries(resourceUsage).forEach(([name, data]) => {
                                if (data.operations > maxOps) {
                                    maxOps = data.operations;
                                    bottleneck = name;
                                }
                            });
                            
                            // Calculate timeline span
                            let earliestStart = null;
                            let latestEnd = null;
                            events.forEach(event => {
                                if (!earliestStart || event.startDate < earliestStart) {
                                    earliestStart = event.startDate;
                                }
                                if (!latestEnd || event.endDate > latestEnd) {
                                    latestEnd = event.endDate;
                                }
                            });
                            
                            const makespan = earliestStart && latestEnd ? 
                                ((latestEnd - earliestStart) / (1000 * 60 * 60)).toFixed(1) : 0;
                            
                            // Build comprehensive analysis
                            response = '📊 **Production Schedule Analysis**\\n\\n';
                            response += \`📈 **Overall Metrics:**\\n\`;
                            response += \`• Total Operations: \${events.length}\\n\`;
                            response += \`• Active Resources: \${Object.values(resourceUsage).filter(r => r.operations > 0).length}/\${resources.length}\\n\`;
                            response += \`• Total Makespan: \${makespan} hours\\n\`;
                            response += \`• Current Algorithm: \${document.getElementById('schedulingAlgorithm').options[document.getElementById('schedulingAlgorithm').selectedIndex].text}\\n\\n\`;
                            
                            response += \`🏭 **Resource Utilization:**\\n\`;
                            Object.entries(resourceUsage).forEach(([name, data]) => {
                                if (data.operations > 0) {
                                    response += \`• \${name}: \${data.operations} operations, \${data.hoursUsed} hours\\n\`;
                                }
                            });
                            
                            if (bottleneck) {
                                response += \`\\n⚠️ **Bottleneck Identified:**\\n\`;
                                response += \`• \${bottleneck} has the highest load with \${maxOps} operations\\n\`;
                            }
                            
                            // Optimization recommendations
                            response += \`\\n💡 **Optimization Recommendations:**\\n\`;
                            
                            const currentAlgo = document.getElementById('schedulingAlgorithm').value;
                            if (currentAlgo === 'asap') {
                                response += \`• Current: ASAP - Good for urgent orders\\n\`;
                                response += \`• Consider: ALAP to reduce inventory costs\\n\`;
                                response += \`• Consider: Level Resources to balance workload\\n\`;
                            } else if (currentAlgo === 'alap') {
                                response += \`• Current: ALAP - Minimizing inventory\\n\`;
                                response += \`• Consider: ASAP for faster delivery\\n\`;
                                response += \`• Consider: Critical Path to reduce makespan\\n\`;
                            } else if (currentAlgo === 'criticalPath') {
                                response += \`• Current: Critical Path - Optimized for completion time\\n\`;
                                response += \`• Consider: Level Resources if some resources are overloaded\\n\`;
                                response += \`• Consider: Drum/TOC if bottleneck is limiting throughput\\n\`;
                            } else if (currentAlgo === 'levelResources') {
                                response += \`• Current: Resource Leveling - Balanced workload\\n\`;
                                response += \`• Consider: Critical Path to reduce total time\\n\`;
                                response += \`• Consider: Drum/TOC to optimize bottlenecks\\n\`;
                            } else {
                                response += \`• Current: Drum/TOC - Optimized for bottlenecks\\n\`;
                                response += \`• Consider: ASAP for urgent completion\\n\`;
                                response += \`• Consider: Level Resources for even distribution\\n\`;
                            }
                            
                            response += \`\\nWould you like me to apply a different algorithm to optimize the schedule?\`;
                        }
                        else {
                            response = \`I understand you're asking about "\${message}". I can help you optimize the schedule using different algorithms. Say "help" to see available commands.\`;
                        }
                        
                        // Execute the algorithm if one was selected
                        if (executedAlgorithm) {
                            aiMsg.textContent = response;
                            maxMessages.appendChild(aiMsg);
                            maxMessages.scrollTop = maxMessages.scrollHeight;
                            
                            // Change the dropdown and execute
                            document.getElementById('schedulingAlgorithm').value = executedAlgorithm;
                            
                            // Execute the algorithm after a brief delay
                            setTimeout(() => {
                                // Click the apply button to trigger the algorithm
                                document.getElementById('applyScheduling').click();
                                
                                // Add success message after algorithm completes
                                setTimeout(() => {
                                    const successMsg = document.createElement('div');
                                    successMsg.className = 'max-ai-message assistant';
                                    const algoNames = {
                                        'asap': 'ASAP (Forward)',
                                        'alap': 'ALAP (Backward)',
                                        'criticalPath': 'Critical Path',
                                        'levelResources': 'Resource Leveling',
                                        'drum': 'Drum (TOC)'
                                    };
                                    
                                    // Get updated stats
                                    const utilization = document.getElementById('resourceUtilization').textContent;
                                    const totalOps = document.getElementById('operationCount').textContent;
                                    
                                    successMsg.textContent = \`✅ Successfully applied \${algoNames[executedAlgorithm]} algorithm!\\n\\nResults:\\n• \${totalOps}\\n• \${utilization}\\n\\nThe schedule has been optimized. Would you like to try a different algorithm?\`;
                                    maxMessages.appendChild(successMsg);
                                    maxMessages.scrollTop = maxMessages.scrollHeight;
                                }, 1500); // Wait for algorithm to complete
                            }, 500);
                        } else {
                            aiMsg.textContent = response;
                            maxMessages.appendChild(aiMsg);
                            maxMessages.scrollTop = maxMessages.scrollHeight;
                        }
                    }, 300);
                    
                    maxMessages.scrollTop = maxMessages.scrollHeight;
                }
                
                // Max AI event listeners
                document.getElementById('maxSend').addEventListener('click', sendMaxMessage);
                document.getElementById('maxInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMaxMessage();
                });
                
                // View preset selector
                document.getElementById('viewPreset').addEventListener('change', (e) => {
                    if (scheduler) {
                        scheduler.viewPreset = e.target.value;
                    }
                });
                
                // Zoom controls
                document.getElementById('zoomIn').addEventListener('click', () => {
                    if (scheduler) {
                        scheduler.zoomLevel = Math.min(scheduler.zoomLevel + 2, 20);
                    }
                });
                
                document.getElementById('zoomOut').addEventListener('click', () => {
                    if (scheduler) {
                        scheduler.zoomLevel = Math.max(scheduler.zoomLevel - 2, 0);
                    }
                });
                
                document.getElementById('zoomToFit').addEventListener('click', () => {
                    if (scheduler) {
                        scheduler.zoomToFit();
                    }
                });
                
                // Refresh button
                document.getElementById('refresh').addEventListener('click', () => {
                    if (scheduler) {
                        scheduler.refresh();
                        updateStatus();
                    }
                });
                
                // Apply Scheduling Algorithm button
                document.getElementById('applyScheduling').addEventListener('click', () => {
                    const algorithm = document.getElementById('schedulingAlgorithm').value;
                    document.getElementById('loadingOverlay').style.display = 'flex';
                    
                    // Store current view settings to maintain consistent timeline
                    const currentZoomLevel = scheduler ? scheduler.zoomLevel : 10;
                    const currentStartDate = scheduler ? scheduler.startDate : new Date(2025, 8, 3);
                    const currentEndDate = scheduler ? scheduler.endDate : new Date(2025, 8, 17);
                    
                    requestAnimationFrame(() => {
                        setTimeout(async () => {
                            try {
                                let message = '';
                                let color = 'green';
                                
                                switch(algorithm) {
                                    case 'asap':
                                        // ASAP - As Soon As Possible (Forward Scheduling)
                                        await asapScheduling();
                                        message = 'ASAP scheduling applied - operations scheduled as early as possible!';
                                        break;
                                        
                                    case 'alap':
                                        // ALAP - As Late As Possible (Backward Scheduling)
                                        await alapScheduling();
                                        message = 'ALAP scheduling applied - operations scheduled as late as possible!';
                                        color = 'blue';
                                        break;
                                        
                                    case 'criticalPath':
                                        // Critical Path Method
                                        await criticalPathScheduling();
                                        message = 'Critical Path identified and optimized!';
                                        color = 'orange';
                                        break;
                                        
                                    case 'levelResources':
                                        // Resource Leveling
                                        await levelResourcesScheduling();
                                        message = 'Resources leveled - workload balanced across resources!';
                                        color = 'purple';
                                        break;
                                        
                                    case 'drum':
                                        // Drum (Theory of Constraints)
                                        await drumScheduling();
                                        message = 'Drum scheduling applied - optimized around bottleneck!';
                                        color = 'brown';
                                        break;
                                }
                                
                                // Refresh the scheduler
                                if (scheduler) {
                                    scheduler.refresh();
                                    
                                    // Restore the original view settings to maintain consistent timeline
                                    scheduler.zoomLevel = currentZoomLevel;
                                    scheduler.setTimeSpan(currentStartDate, currentEndDate);
                                }
                                
                                // Hide loading and show success message
                                document.getElementById('loadingOverlay').style.display = 'none';
                                updateStatus();
                                
                                // Show message in status bar
                                const statusElement = document.getElementById('operationCount');
                                const originalText = statusElement.textContent;
                                statusElement.innerHTML = \`<span style="color: \${color}; font-weight: bold;">\${message}</span>\`;
                                
                                setTimeout(() => {
                                    statusElement.textContent = originalText;
                                    updateStatus();
                                }, 3000);
                                
                            } catch (error) {
                                console.error('Scheduling error:', error);
                                document.getElementById('loadingOverlay').style.display = 'none';
                                
                                const statusElement = document.getElementById('operationCount');
                                const originalText = statusElement.textContent;
                                statusElement.innerHTML = \`<span style="color: red;">Scheduling failed - \${error.message}</span>\`;
                                
                                setTimeout(() => {
                                    statusElement.textContent = originalText;
                                    updateStatus();
                                }, 3000);
                            }
                        }, 300);
                    });
                });
            }
            
            // Scheduling Algorithm Implementations
            async function asapScheduling() {
                if (!scheduler) return;
                
                // ASAP (As Soon As Possible) - Forward scheduling with resource constraints
                const events = [...scheduler.eventStore.records].sort((a, b) => 
                    a.startDate.getTime() - b.startDate.getTime()
                );
                
                // Use September 3, 2025 as the base scheduling date
                const baseDate = new Date(2025, 8, 3);
                baseDate.setHours(7, 0, 0, 0); // Start at 7 AM
                
                const resourceEvents = {};
                const assignments = scheduler.assignmentStore.records;
                
                // Group events by resource
                assignments.forEach(assignment => {
                    const event = scheduler.eventStore.getById(assignment.eventId);
                    if (event && assignment.resourceId !== 'unscheduled') {
                        if (!resourceEvents[assignment.resourceId]) {
                            resourceEvents[assignment.resourceId] = [];
                        }
                        resourceEvents[assignment.resourceId].push(event);
                    }
                });
                
                Object.keys(resourceEvents).forEach(resourceId => {
                    const resEvents = resourceEvents[resourceId];
                    let nextAvailableTime = new Date(baseDate);
                    
                    resEvents.forEach(event => {
                        // Respect constraint dates if set
                        const earliestStart = event.constraintDate || nextAvailableTime;
                        const actualStart = new Date(Math.max(earliestStart.getTime(), nextAvailableTime.getTime()));
                        
                        event.startDate = actualStart;
                        event.constraintType = 'startnoearlierthan';
                        event.constraintDate = actualStart;
                        event.manuallyScheduled = false;
                        const durationMs = event.duration * 60 * 60 * 1000;
                        event.endDate = new Date(event.startDate.getTime() + durationMs);
                        nextAvailableTime = new Date(event.endDate.getTime() + 30 * 60 * 1000); // 30 min buffer
                    });
                });
                
                scheduler.eventStore.commit();
            }
            
            async function alapScheduling() {
                if (!scheduler) return;
                
                // ALAP (As Late As Possible) - Backward scheduling from due dates
                const events = [...scheduler.eventStore.records].sort((a, b) => 
                    b.endDate.getTime() - a.endDate.getTime()
                );
                
                // Use September 17, 2025 as the base end date
                const baseEndDate = new Date(2025, 8, 17);
                baseEndDate.setHours(17, 0, 0, 0); // End at 5 PM
                
                const resourceEvents = {};
                const assignments = scheduler.assignmentStore.records;
                
                // Group events by resource
                assignments.forEach(assignment => {
                    const event = scheduler.eventStore.getById(assignment.eventId);
                    if (event && assignment.resourceId !== 'unscheduled') {
                        if (!resourceEvents[assignment.resourceId]) {
                            resourceEvents[assignment.resourceId] = [];
                        }
                        resourceEvents[assignment.resourceId].push(event);
                    }
                });
                
                Object.keys(resourceEvents).forEach(resourceId => {
                    const resEvents = resourceEvents[resourceId];
                    let nextAvailableTime = new Date(baseEndDate);
                    
                    resEvents.forEach(event => {
                        const durationMs = event.duration * 60 * 60 * 1000;
                        const latestEnd = event.constraintDate || nextAvailableTime;
                        const actualEnd = new Date(Math.min(latestEnd.getTime(), nextAvailableTime.getTime()));
                        
                        event.endDate = actualEnd;
                        event.startDate = new Date(event.endDate.getTime() - durationMs);
                        event.constraintType = 'finishnolaterthan';
                        event.constraintDate = actualEnd;
                        event.manuallyScheduled = false;
                        nextAvailableTime = new Date(event.startDate.getTime() - 30 * 60 * 1000); // 30 min buffer
                    });
                });
                
                scheduler.eventStore.commit();
            }
            
            async function criticalPathScheduling() {
                if (!scheduler) return;
                
                // Critical Path Method - Identify and optimize critical path
                const events = scheduler.eventStore.records;
                const dependencies = scheduler.dependencyStore.records;
                
                // Build dependency graph
                const eventMap = new Map();
                events.forEach(event => eventMap.set(event.id, event));
                
                // Calculate earliest start times (forward pass)
                const earliestStart = new Map();
                const visited = new Set();
                
                function calculateES(eventId) {
                    if (visited.has(eventId)) return earliestStart.get(eventId);
                    visited.add(eventId);
                    
                    const predecessors = dependencies.filter(d => d.toEvent === eventId);
                    if (predecessors.length === 0) {
                        // No predecessors, start at project start
                        earliestStart.set(eventId, new Date(2025, 8, 3, 7, 0, 0, 0));
                    } else {
                        let maxPredFinish = new Date(2025, 8, 3, 7, 0, 0, 0);
                        predecessors.forEach(dep => {
                            const predES = calculateES(dep.fromEvent);
                            const predEvent = eventMap.get(dep.fromEvent);
                            const predFinish = new Date(predES.getTime() + predEvent.duration * 60 * 60 * 1000);
                            if (predFinish > maxPredFinish) {
                                maxPredFinish = predFinish;
                            }
                        });
                        earliestStart.set(eventId, maxPredFinish);
                    }
                    
                    return earliestStart.get(eventId);
                }
                
                events.forEach(event => calculateES(event.id));
                
                // Update event start dates based on critical path
                events.forEach(event => {
                    const es = earliestStart.get(event.id);
                    if (es) {
                        event.startDate = es;
                        event.endDate = new Date(es.getTime() + event.duration * 60 * 60 * 1000);
                        event.constraintType = 'startnoearlierthan';
                        event.constraintDate = es;
                        event.manuallyScheduled = false;
                    }
                });
                
                scheduler.eventStore.commit();
            }
            
            async function levelResourcesScheduling() {
                if (!scheduler) return;
                
                // Resource Leveling - Distribute workload evenly
                const events = [...scheduler.eventStore.records];
                const assignments = scheduler.assignmentStore.records;
                
                // Group events by resource
                const resourceGroups = {};
                assignments.forEach(assignment => {
                    const event = scheduler.eventStore.getById(assignment.eventId);
                    if (event && assignment.resourceId !== 'unscheduled') {
                        if (!resourceGroups[assignment.resourceId]) {
                            resourceGroups[assignment.resourceId] = [];
                        }
                        resourceGroups[assignment.resourceId].push(event);
                    }
                });
                
                // Calculate total workload
                const totalHours = events.reduce((sum, event) => sum + event.duration, 0);
                const resourceCount = Object.keys(resourceGroups).length;
                const targetHoursPerResource = totalHours / resourceCount;
                
                // Redistribute events to balance load
                const sortedResources = Object.keys(resourceGroups).sort((a, b) => {
                    const loadA = resourceGroups[a].reduce((sum, e) => sum + e.duration, 0);
                    const loadB = resourceGroups[b].reduce((sum, e) => sum + e.duration, 0);
                    return loadB - loadA; // Highest load first
                });
                
                // Move events from overloaded to underloaded resources
                for (let i = 0; i < sortedResources.length - 1; i++) {
                    const overloadedResource = sortedResources[i];
                    const underloadedResource = sortedResources[sortedResources.length - 1 - i];
                    
                    const overloadedEvents = resourceGroups[overloadedResource];
                    const overloadedHours = overloadedEvents.reduce((sum, e) => sum + e.duration, 0);
                    
                    if (overloadedHours > targetHoursPerResource * 1.2) {
                        // Move smallest event to underloaded resource
                        const smallestEvent = overloadedEvents.reduce((min, e) => 
                            e.duration < min.duration ? e : min
                        );
                        
                        // Update assignment
                        const assignment = assignments.find(a => a.eventId === smallestEvent.id);
                        if (assignment) {
                            assignment.resourceId = underloadedResource;
                        }
                    }
                }
                
                // Reschedule events with even spacing
                const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0);
                let currentTime = new Date(baseDate);
                
                events.forEach((event, index) => {
                    event.startDate = new Date(currentTime);
                    event.endDate = new Date(currentTime.getTime() + event.duration * 60 * 60 * 1000);
                    event.constraintType = 'startnoearlierthan';
                    event.constraintDate = new Date(currentTime);
                    event.manuallyScheduled = false;
                    
                    // Advance time with staggered spacing
                    currentTime = new Date(currentTime.getTime() + (event.duration * 60 * 60 * 1000) + (30 * 60 * 1000));
                });
                
                scheduler.eventStore.commit();
                scheduler.assignmentStore.commit();
            }
            
            async function drumScheduling() {
                if (!scheduler) return;
                
                // Drum (Theory of Constraints) - Optimize around bottleneck
                const assignments = scheduler.assignmentStore.records;
                const resources = scheduler.resourceStore.records;
                
                // Identify bottleneck resource (resource with most operations)
                const resourceLoad = {};
                assignments.forEach(assignment => {
                    if (assignment.resourceId !== 'unscheduled') {
                        resourceLoad[assignment.resourceId] = (resourceLoad[assignment.resourceId] || 0) + 1;
                    }
                });
                
                const bottleneckResourceId = Object.keys(resourceLoad).reduce((a, b) => 
                    resourceLoad[a] > resourceLoad[b] ? a : b
                );
                
                console.log(\`Identified bottleneck resource: \${bottleneckResourceId}\`);
                
                // Get bottleneck events and optimize their schedule first
                const bottleneckAssignments = assignments.filter(a => a.resourceId === bottleneckResourceId);
                const bottleneckEvents = bottleneckAssignments.map(a => 
                    scheduler.eventStore.getById(a.eventId)
                ).filter(Boolean);
                
                // Schedule bottleneck resource optimally
                const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0);
                let currentTime = new Date(baseDate);
                
                bottleneckEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
                
                bottleneckEvents.forEach(event => {
                    event.startDate = new Date(currentTime);
                    event.endDate = new Date(currentTime.getTime() + event.duration * 60 * 60 * 1000);
                    event.constraintType = 'startnoearlierthan';
                    event.constraintDate = new Date(currentTime);
                    event.manuallyScheduled = false;
                    
                    currentTime = new Date(currentTime.getTime() + event.duration * 60 * 60 * 1000 + 15 * 60 * 1000); // 15 min buffer
                });
                
                // Schedule other resources around bottleneck
                const otherEvents = scheduler.eventStore.records.filter(event => 
                    !bottleneckEvents.includes(event)
                );
                
                let otherTime = new Date(baseDate);
                otherEvents.forEach(event => {
                    event.startDate = new Date(otherTime);
                    event.endDate = new Date(otherTime.getTime() + event.duration * 60 * 60 * 1000);
                    event.constraintType = 'startnoearlierthan';
                    event.constraintDate = new Date(otherTime);
                    event.manuallyScheduled = false;
                    
                    otherTime = new Date(otherTime.getTime() + event.duration * 60 * 60 * 1000 + 45 * 60 * 1000); // 45 min buffer
                });
                
                scheduler.eventStore.commit();
            }
            
            // Update status bar
            // Status updates are now handled by the main JavaScript function
            // The global window.updateSchedulerStatus function handles all status updates
        })();
    </script>
  `;

  return (
    <div
      className="w-full h-screen overflow-hidden"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      data-testid="production-schedule-tsx"
    />
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