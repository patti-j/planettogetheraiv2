// Import Bryntum Scheduler Pro
import { SchedulerPro } from '@bryntum/schedulerpro';

// Global scheduler instance
let scheduler = null;

// Initialize the scheduler
function initializeScheduler() {
    console.log('Initializing Production Scheduler...');
    
    const loadingEl = document.getElementById('loading');
    
    try {
        // Create the Scheduler Pro instance
        scheduler = new SchedulerPro({
            // Adopt the container element
            appendTo: 'scheduler-container',
            
            // Time axis configuration
            startDate: new Date(2025, 0, 1),
            endDate: new Date(2025, 2, 1),
            
            // View preset
            viewPreset: 'dayAndWeek',
            
            // Row height
            rowHeight: 50,
            barMargin: 10,
            
            // Column configuration
            columns: [
                {
                    text: 'Resource',
                    field: 'name',
                    width: 200,
                    type: 'tree'
                },
                {
                    text: 'Type',
                    field: 'type',
                    width: 120
                },
                {
                    text: 'Capacity',
                    field: 'capacity',
                    width: 100,
                    renderer: ({ value }) => value ? `${value}%` : '100%'
                }
            ],
            
            // Features configuration
            features: {
                dependencies: true,
                dependencyEdit: true,
                eventDrag: {
                    showTooltip: true,
                    constrainDragToResource: false
                },
                eventResize: {
                    showTooltip: true
                },
                progressLine: {
                    disabled: false
                },
                nonWorkingTime: {
                    disabled: false
                },
                columnLines: false,
                timeRanges: {
                    showCurrentTimeLine: true
                },
                eventTooltip: {
                    template: ({ eventRecord }) => `
                        <div class="b-sch-event-tooltip">
                            <h4>${eventRecord.name}</h4>
                            <p>Start: ${eventRecord.startDate?.toLocaleString() || 'Not scheduled'}</p>
                            <p>End: ${eventRecord.endDate?.toLocaleString() || 'Not scheduled'}</p>
                            <p>Duration: ${eventRecord.duration || 0} ${eventRecord.durationUnit || 'hour'}(s)</p>
                            ${eventRecord.note ? `<p>Note: ${eventRecord.note}</p>` : ''}
                        </div>
                    `
                }
            },
            
            // Project data
            project: {
                resources: [
                    { 
                        id: 'r1', 
                        name: 'CNC Machine 1', 
                        type: 'Machine',
                        capacity: 100
                    },
                    { 
                        id: 'r2', 
                        name: 'CNC Machine 2', 
                        type: 'Machine',
                        capacity: 100
                    },
                    { 
                        id: 'r3', 
                        name: 'Assembly Line 1', 
                        type: 'Work Center',
                        capacity: 100
                    },
                    { 
                        id: 'r4', 
                        name: 'Quality Control Station', 
                        type: 'Work Center',
                        capacity: 100
                    },
                    { 
                        id: 'r5', 
                        name: 'Packaging Station', 
                        type: 'Work Center',
                        capacity: 100
                    }
                ],
                
                events: [
                    {
                        id: 'e1',
                        name: 'Order #1001 - Milling',
                        startDate: '2025-01-06T08:00:00',
                        duration: 4,
                        durationUnit: 'hour',
                        percentDone: 50,
                        note: 'Priority order'
                    },
                    {
                        id: 'e2',
                        name: 'Order #1001 - Assembly',
                        duration: 3,
                        durationUnit: 'hour',
                        percentDone: 0,
                        note: 'Depends on milling'
                    },
                    {
                        id: 'e3',
                        name: 'Order #1001 - Quality Check',
                        duration: 1,
                        durationUnit: 'hour',
                        percentDone: 0
                    },
                    {
                        id: 'e4',
                        name: 'Order #1001 - Packaging',
                        duration: 2,
                        durationUnit: 'hour',
                        percentDone: 0
                    },
                    {
                        id: 'e5',
                        name: 'Order #1002 - Cutting',
                        startDate: '2025-01-06T09:00:00',
                        duration: 5,
                        durationUnit: 'hour',
                        percentDone: 25
                    },
                    {
                        id: 'e6',
                        name: 'Order #1002 - Assembly',
                        duration: 4,
                        durationUnit: 'hour',
                        percentDone: 0
                    },
                    {
                        id: 'e7',
                        name: 'Order #1003 - Drilling',
                        startDate: '2025-01-07T08:00:00',
                        duration: 3,
                        durationUnit: 'hour',
                        percentDone: 0
                    }
                ],
                
                assignments: [
                    { id: 'a1', event: 'e1', resource: 'r1', units: 100 },
                    { id: 'a2', event: 'e2', resource: 'r3', units: 100 },
                    { id: 'a3', event: 'e3', resource: 'r4', units: 100 },
                    { id: 'a4', event: 'e4', resource: 'r5', units: 100 },
                    { id: 'a5', event: 'e5', resource: 'r2', units: 100 },
                    { id: 'a6', event: 'e6', resource: 'r3', units: 100 },
                    { id: 'a7', event: 'e7', resource: 'r1', units: 100 }
                ],
                
                dependencies: [
                    { id: 'd1', fromEvent: 'e1', toEvent: 'e2', type: 2 },
                    { id: 'd2', fromEvent: 'e2', toEvent: 'e3', type: 2 },
                    { id: 'd3', fromEvent: 'e3', toEvent: 'e4', type: 2 },
                    { id: 'd4', fromEvent: 'e5', toEvent: 'e6', type: 2 }
                ]
            },
            
            // Event handlers
            listeners: {
                eventDrop: ({ context }) => {
                    console.log('Event dropped:', context);
                    updateStatus('Operation rescheduled');
                },
                eventResizeEnd: ({ context }) => {
                    console.log('Event resized:', context);
                    updateStatus('Operation duration updated');
                },
                dependencyCreate: ({ source, target, type }) => {
                    console.log('Dependency created:', { source, target, type });
                    updateStatus('Dependency created');
                },
                paint: () => {
                    updateInfo();
                    if (loadingEl) {
                        loadingEl.style.display = 'none';
                    }
                }
            }
        });
        
        // Set up toolbar controls
        setupToolbarControls();
        
        console.log('Production Scheduler initialized successfully');
        updateStatus('Scheduler ready');
        
    } catch (error) {
        console.error('Failed to initialize scheduler:', error);
        updateStatus('Error: Failed to initialize scheduler');
        
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2 style="color: #e53e3e;">Failed to Initialize Scheduler</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// Set up toolbar control handlers
function setupToolbarControls() {
    // Optimize button
    const btnOptimize = document.getElementById('btn-optimize');
    if (btnOptimize) {
        btnOptimize.addEventListener('click', () => {
            console.log('Running schedule optimization...');
            updateStatus('Optimizing schedule...');
            
            if (scheduler && scheduler.project) {
                scheduler.project.commitAsync().then(() => {
                    updateStatus('Schedule optimized');
                });
            }
        });
    }
    
    // Refresh button
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            console.log('Refreshing schedule data...');
            updateStatus('Refreshing...');
            updateStatus('Schedule refreshed');
        });
    }
    
    // View preset selector
    const viewPresetSelect = document.getElementById('view-preset');
    if (viewPresetSelect) {
        viewPresetSelect.addEventListener('change', (e) => {
            if (scheduler) {
                scheduler.viewPreset = e.target.value;
                updateStatus(`View changed to ${e.target.value}`);
            }
        });
    }
    
    // Zoom controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            if (scheduler) {
                scheduler.zoomIn();
                updateStatus('Zoomed in');
            }
        });
    }
    
    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            if (scheduler) {
                scheduler.zoomOut();
                updateStatus('Zoomed out');
            }
        });
    }
    
    const btnFit = document.getElementById('btn-fit');
    if (btnFit) {
        btnFit.addEventListener('click', () => {
            if (scheduler) {
                scheduler.zoomToFit();
                updateStatus('Fitted to view');
            }
        });
    }
}

// Update status bar message
function updateStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// Update status bar info
function updateInfo() {
    const infoEl = document.getElementById('status-info');
    if (infoEl && scheduler && scheduler.project) {
        const eventCount = scheduler.project.eventStore.count;
        const resourceCount = scheduler.project.resourceStore.count;
        infoEl.textContent = `${eventCount} Operations • ${resourceCount} Resources`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScheduler);
} else {
    // DOM is already loaded
    initializeScheduler();
}

// Export for global access
window.productionScheduler = scheduler;