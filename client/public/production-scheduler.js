// Import Bryntum Scheduler Pro
import { SchedulerPro } from '@bryntum/schedulerpro';

// Global scheduler instance
let scheduler = null;

// Sample data for production scheduling
const resources = [
    { id: 'cnc1', name: 'CNC Machine 1', category: 'Machining' },
    { id: 'cnc2', name: 'CNC Machine 2', category: 'Machining' },
    { id: 'assembly1', name: 'Assembly Line 1', category: 'Assembly' },
    { id: 'assembly2', name: 'Assembly Line 2', category: 'Assembly' },
    { id: 'qc1', name: 'Quality Control 1', category: 'Inspection' },
    { id: 'packaging1', name: 'Packaging Station 1', category: 'Packaging' }
];

const events = [
    {
        id: 1,
        name: 'Part Machining - Order #1001',
        startDate: new Date(2025, 0, 27, 8, 0),
        duration: 4,
        durationUnit: 'hour',
        resourceId: 'cnc1',
        percentDone: 25,
        eventColor: 'blue'
    },
    {
        id: 2,
        name: 'Part Machining - Order #1002',
        startDate: new Date(2025, 0, 27, 13, 0),
        duration: 3,
        durationUnit: 'hour',
        resourceId: 'cnc1',
        percentDone: 0,
        eventColor: 'blue'
    },
    {
        id: 3,
        name: 'Component Assembly - Order #1001',
        startDate: new Date(2025, 0, 27, 14, 0),
        duration: 5,
        durationUnit: 'hour',
        resourceId: 'assembly1',
        percentDone: 0,
        eventColor: 'green'
    },
    {
        id: 4,
        name: 'Quality Inspection - Order #1001',
        startDate: new Date(2025, 0, 28, 9, 0),
        duration: 2,
        durationUnit: 'hour',
        resourceId: 'qc1',
        percentDone: 0,
        eventColor: 'orange'
    },
    {
        id: 5,
        name: 'Packaging - Order #1001',
        startDate: new Date(2025, 0, 28, 11, 30),
        duration: 1.5,
        durationUnit: 'hour',
        resourceId: 'packaging1',
        percentDone: 0,
        eventColor: 'purple'
    },
    {
        id: 6,
        name: 'Part Machining - Order #1003',
        startDate: new Date(2025, 0, 28, 8, 0),
        duration: 6,
        durationUnit: 'hour',
        resourceId: 'cnc2',
        percentDone: 10,
        eventColor: 'blue'
    }
];

const dependencies = [
    { id: 1, fromEvent: 1, toEvent: 3, type: 2 }, // Finish-to-Start
    { id: 2, fromEvent: 3, toEvent: 4, type: 2 },
    { id: 3, fromEvent: 4, toEvent: 5, type: 2 }
];

// Initialize the scheduler
export async function initializeScheduler() {
    // Create scheduler instance
    scheduler = new SchedulerPro({
        appendTo: 'scheduler',
        
        // Configure columns for resource grid
        columns: [
            { text: 'Resource', field: 'name', width: 200 },
            { text: 'Category', field: 'category', width: 150 }
        ],

        // View preset
        viewPreset: 'dayAndWeek',
        
        // Row height
        rowHeight: 60,
        barMargin: 8,

        // Features
        features: {
            // Enable dependency lines
            dependencies: true,
            
            // Enable event drag and drop
            eventDrag: {
                showTooltip: true
            },
            
            // Enable event resize
            eventResize: {
                showTooltip: true
            },
            
            // Show event tooltips
            eventTooltip: {
                template: ({ eventRecord }) => `
                    <div style="padding: 10px;">
                        <strong>${eventRecord.name}</strong><br>
                        Start: ${eventRecord.startDate.toLocaleString()}<br>
                        Duration: ${eventRecord.duration} ${eventRecord.durationUnit}<br>
                        Progress: ${eventRecord.percentDone}%
                    </div>
                `
            },
            
            // Timeline header
            timeRanges: {
                showCurrentTimeLine: true
            },
            
            // Progress line
            progressLine: {
                disabled: false
            },
            
            // Non-working time
            nonWorkingTime: {
                disabled: false
            }
        },

        // Event renderer
        eventRenderer({ eventRecord, renderData }) {
            renderData.eventColor = eventRecord.eventColor;
            return {
                html: `
                    <div style="padding: 4px;">
                        <div style="font-weight: 500; font-size: 12px;">${eventRecord.name}</div>
                        <div style="font-size: 11px; opacity: 0.8;">
                            ${eventRecord.percentDone}% complete
                        </div>
                    </div>
                `
            };
        },

        // Project configuration for SchedulerPro
        project: {
            // Data stores
            resourcesData: resources,
            eventsData: events,
            dependenciesData: dependencies,
            
            // Auto calculate dates based on dependencies
            autoCalculateStartDate: true,
            autoCalculateEndDate: true
        },

        // Start and end dates for the timeline
        startDate: new Date(2025, 0, 26),
        endDate: new Date(2025, 1, 2),
        
        // Zoom level
        zoomLevel: 10
    });

    // Set up toolbar event handlers
    setupToolbarHandlers();
    
    // Update status
    updateStatus();
    
    return scheduler;
}

// Setup toolbar handlers
function setupToolbarHandlers() {
    // View preset selector
    document.getElementById('viewPreset')?.addEventListener('change', (e) => {
        scheduler.viewPreset = e.target.value;
    });
    
    // Zoom controls
    document.getElementById('zoomIn')?.addEventListener('click', () => {
        scheduler.zoomLevel = Math.min(scheduler.zoomLevel + 2, 20);
    });
    
    document.getElementById('zoomOut')?.addEventListener('click', () => {
        scheduler.zoomLevel = Math.max(scheduler.zoomLevel - 2, 0);
    });
    
    document.getElementById('zoomToFit')?.addEventListener('click', () => {
        scheduler.zoomToFit();
    });
    
    // Optimize button
    document.getElementById('optimize')?.addEventListener('click', () => {
        optimizeSchedule();
    });
    
    // Listen to scheduler events
    scheduler.on('eventdrop', updateStatus);
    scheduler.on('eventresizeend', updateStatus);
    scheduler.on('aftereventadd', updateStatus);
    scheduler.on('aftereventremove', updateStatus);
}

// Update status bar
function updateStatus() {
    const operationCount = scheduler?.eventStore?.count || 0;
    document.getElementById('operationCount').textContent = `${operationCount} operations scheduled`;
    
    // Calculate resource utilization (simplified)
    const totalResources = scheduler?.resourceStore?.count || 0;
    const busyResources = new Set(scheduler?.eventStore?.records.map(e => e.resourceId)).size;
    const utilization = totalResources > 0 ? Math.round((busyResources / totalResources) * 100) : 0;
    
    document.getElementById('resourceUtilization').textContent = `Resource utilization: ${utilization}%`;
    
    // Update last update time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

// Simple optimization function
function optimizeSchedule() {
    if (!scheduler) return;
    
    // Show loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    setTimeout(() => {
        // Run the built-in optimization
        scheduler.project.propagate().then(() => {
            // Adjust events to minimize gaps (ASAP scheduling)
            const events = scheduler.eventStore.records;
            events.forEach(event => {
                // This is simplified - Bryntum Pro has more sophisticated optimization
                event.setStartDate(event.earlyStartDate || event.startDate, true);
            });
            
            // Hide loading
            document.getElementById('loadingOverlay').style.display = 'none';
            
            // Update status
            updateStatus();
            
            alert('Schedule optimized successfully!');
        });
    }, 500);
}

// Export for external use
export { scheduler };