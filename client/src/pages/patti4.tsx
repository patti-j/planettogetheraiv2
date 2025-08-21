import React, { useEffect, useRef, useState } from 'react';

// This component assumes you have installed and can import Bryntum Scheduler Pro
// npm install @bryntum/schedulerpro @bryntum/schedulerpro-react

const ProductionScheduler = () => {
  const schedulerRef = useRef(null);
  const containerRef = useRef(null);
  const [schedulerInstance, setSchedulerInstance] = useState(null);
  const [currentView, setCurrentView] = useState('weekAndDayLetter');

  // Sample production data
  const resources = [
    {
      id: 'line1',
      name: 'Production Line 1',
      type: 'Line',
      capacity: '100%',
      utilization: 85,
      expanded: true,
      children: [
        { id: 'machine1', name: 'CNC Machine 1', type: 'Machine', capacity: '8h/day', utilization: 90 },
        { id: 'machine2', name: 'CNC Machine 2', type: 'Machine', capacity: '8h/day', utilization: 75 },
        { id: 'lathe1', name: 'Lathe 1', type: 'Machine', capacity: '8h/day', utilization: 80 }
      ]
    },
    {
      id: 'line2',
      name: 'Production Line 2',
      type: 'Line',
      capacity: '100%',
      utilization: 78,
      expanded: true,
      children: [
        { id: 'assembly1', name: 'Assembly Station 1', type: 'Station', capacity: '10h/day', utilization: 88 },
        { id: 'assembly2', name: 'Assembly Station 2', type: 'Station', capacity: '10h/day', utilization: 70 }
      ]
    },
    {
      id: 'quality',
      name: 'Quality Control',
      type: 'Department',
      capacity: '100%',
      utilization: 92,
      expanded: true,
      children: [
        { id: 'qc1', name: 'QC Station 1', type: 'Station', capacity: '8h/day', utilization: 95 },
        { id: 'qc2', name: 'QC Station 2', type: 'Station', capacity: '8h/day', utilization: 89 }
      ]
    },
    {
      id: 'packaging',
      name: 'Packaging',
      type: 'Department',
      capacity: '100%',
      utilization: 68,
      expanded: true,
      children: [
        { id: 'pack1', name: 'Packaging Line 1', type: 'Line', capacity: '12h/day', utilization: 72 },
        { id: 'pack2', name: 'Packaging Line 2', type: 'Line', capacity: '12h/day', utilization: 65 }
      ]
    }
  ];

  const events = [
    {
      id: 1,
      resourceId: 'machine1',
      name: 'Order #1001 - Machining',
      startDate: new Date(2024, 0, 2, 8),
      endDate: new Date(2024, 0, 2, 12),
      eventColor: '#4CAF50',
      status: 'In Progress',
      priority: 'High',
      customer: 'Acme Corp',
      progress: 65
    },
    {
      id: 2,
      resourceId: 'machine2',
      name: 'Order #1002 - Machining',
      startDate: new Date(2024, 0, 2, 13),
      endDate: new Date(2024, 0, 2, 17),
      eventColor: '#4CAF50',
      status: 'Scheduled',
      priority: 'Medium',
      customer: 'TechCo',
      progress: 0
    },
    {
      id: 3,
      resourceId: 'assembly1',
      name: 'Order #1001 - Assembly',
      startDate: new Date(2024, 0, 3, 8),
      endDate: new Date(2024, 0, 3, 16),
      eventColor: '#2196F3',
      status: 'Scheduled',
      priority: 'High',
      customer: 'Acme Corp',
      progress: 0
    },
    {
      id: 4,
      resourceId: 'qc1',
      name: 'Order #1001 - Quality Check',
      startDate: new Date(2024, 0, 4, 8),
      endDate: new Date(2024, 0, 4, 10),
      eventColor: '#FF9800',
      status: 'Scheduled',
      priority: 'High',
      customer: 'Acme Corp',
      progress: 0
    },
    {
      id: 5,
      resourceId: 'pack1',
      name: 'Order #1001 - Packaging',
      startDate: new Date(2024, 0, 4, 11),
      endDate: new Date(2024, 0, 4, 14),
      eventColor: '#9C27B0',
      status: 'Scheduled',
      priority: 'High',
      customer: 'Acme Corp',
      progress: 0
    },
    {
      id: 6,
      resourceId: 'lathe1',
      name: 'Order #1003 - Turning',
      startDate: new Date(2024, 0, 3, 8),
      endDate: new Date(2024, 0, 3, 15),
      eventColor: '#4CAF50',
      status: 'Scheduled',
      priority: 'Low',
      customer: 'BuildIt Inc',
      progress: 0
    },
    {
      id: 7,
      resourceId: 'assembly2',
      name: 'Order #1002 - Assembly',
      startDate: new Date(2024, 0, 3, 8),
      endDate: new Date(2024, 0, 3, 14),
      eventColor: '#2196F3',
      status: 'Scheduled',
      priority: 'Medium',
      customer: 'TechCo',
      progress: 0
    }
  ];

  const dependencies = [
    { id: 1, fromEvent: 1, toEvent: 3, type: 2, lag: 0 },
    { id: 2, fromEvent: 3, toEvent: 4, type: 2, lag: 0 },
    { id: 3, fromEvent: 4, toEvent: 5, type: 2, lag: 1 },
    { id: 4, fromEvent: 2, toEvent: 7, type: 2, lag: 0 }
  ];

  // View presets for different zoom levels
  const viewPresets = [
    { value: 'hourAndDay', label: 'Hour' },
    { value: 'dayAndWeek', label: 'Day' },
    { value: 'weekAndDayLetter', label: 'Week' },
    { value: 'weekAndMonth', label: 'Month' },
    { value: 'monthAndYear', label: 'Year' }
  ];

  const schedulerConfig = {
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 2, 1),
    viewPreset: currentView,
    rowHeight: 70,
    barMargin: 8,
    eventStyle: 'rounded',
    
    columns: [
      { 
        text: 'Resource', 
        field: 'name', 
        width: 220,
        type: 'tree',
        renderer: ({ record }) => {
          const icon = record.type === 'Line' ? '🏭' : 
                       record.type === 'Machine' ? '⚙️' : 
                       record.type === 'Station' ? '🔧' : 
                       record.type === 'Department' ? '📊' : '';
          return `${icon} ${record.name}`;
        }
      },
      { 
        text: 'Type', 
        field: 'type', 
        width: 100,
        renderer: ({ value }) => `<span class="resource-type-badge">${value}</span>`
      },
      { 
        text: 'Capacity', 
        field: 'capacity', 
        width: 90,
        align: 'center'
      },
      {
        text: 'Utilization',
        field: 'utilization',
        width: 100,
        align: 'center',
        renderer: ({ value }) => {
          const color = value > 90 ? '#f44336' : value > 70 ? '#ff9800' : '#4caf50';
          return `<div class="utilization-bar" style="background: linear-gradient(90deg, ${color} ${value}%, #e0e0e0 ${value}%);">${value}%</div>`;
        }
      }
    ],
    
    features: {
      tree: true,
      timeRanges: {
        showCurrentTimeLine: true,
        showHeaderElements: true
      },
      dependencies: {
        showTooltip: true
      },
      dependencyEdit: true,
      eventDrag: {
        constrainDragToResource: false
      },
      eventDragCreate: true,
      eventResize: true,
      eventEdit: {
        items: {
          nameField: { label: 'Operation Name', weight: 100 },
          resourceField: { label: 'Assigned Resource', weight: 200 },
          startDateField: { label: 'Start Date', weight: 300 },
          endDateField: { label: 'End Date', weight: 400 },
          statusField: {
            label: 'Status',
            type: 'combo',
            items: ['Scheduled', 'In Progress', 'Completed', 'On Hold'],
            weight: 500
          },
          priorityField: {
            label: 'Priority',
            type: 'combo',
            items: ['Low', 'Medium', 'High', 'Critical'],
            weight: 600
          },
          customerField: {
            label: 'Customer',
            type: 'text',
            weight: 700
          },
          progressField: {
            label: 'Progress (%)',
            type: 'number',
            min: 0,
            max: 100,
            weight: 800
          }
        }
      },
      eventTooltip: {
        template: ({ eventRecord }) => `
          <div class="custom-tooltip">
            <h3>${eventRecord.name}</h3>
            <div class="tooltip-row">
              <span>Status:</span>
              <span class="status-badge status-${eventRecord.status?.toLowerCase().replace(' ', '-')}">${eventRecord.status}</span>
            </div>
            <div class="tooltip-row">
              <span>Customer:</span>
              <span>${eventRecord.customer}</span>
            </div>
            <div class="tooltip-row">
              <span>Priority:</span>
              <span class="priority-${eventRecord.priority?.toLowerCase()}">${eventRecord.priority}</span>
            </div>
            <div class="tooltip-row">
              <span>Progress:</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${eventRecord.progress}%"></div>
              </div>
              <span>${eventRecord.progress}%</span>
            </div>
            <div class="tooltip-row">
              <span>Start:</span>
              <span>${eventRecord.startDate?.toLocaleString()}</span>
            </div>
            <div class="tooltip-row">
              <span>End:</span>
              <span>${eventRecord.endDate?.toLocaleString()}</span>
            </div>
          </div>
        `
      },
      nonWorkingTime: {
        highlightWeekends: true
      },
      resourceNonWorkingTime: true,
      pdf: {
        exportServer: '/pdf-export'
      }
    },
    
    eventRenderer: ({ eventRecord, renderData }) => {
      renderData.cls = `custom-event priority-${eventRecord.priority?.toLowerCase()} status-${eventRecord.status?.toLowerCase().replace(' ', '-')}`;
      
      return `
        <div class="event-content">
          <div class="event-header">
            <span class="event-name">${eventRecord.name}</span>
            ${eventRecord.priority === 'High' || eventRecord.priority === 'Critical' ? '<span class="priority-indicator">⚠️</span>' : ''}
          </div>
          ${eventRecord.progress > 0 ? `
            <div class="event-progress">
              <div class="progress-bar-mini">
                <div class="progress-fill-mini" style="width: ${eventRecord.progress}%"></div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    },
    
    resourceStore: {
      tree: true,
      data: resources
    },
    
    eventStore: {
      data: events
    },
    
    dependencyStore: {
      data: dependencies
    }
  };

  // Initialize scheduler (this would use actual Bryntum library in production)
  useEffect(() => {
    // In production, you would initialize like this:
    // import { SchedulerPro } from '@bryntum/schedulerpro';
    // const scheduler = new SchedulerPro({
    //   appendTo: containerRef.current,
    //   ...schedulerConfig
    // });
    // setSchedulerInstance(scheduler);
    
    console.log('Scheduler would be initialized with config:', schedulerConfig);
    
    return () => {
      // Cleanup
      if (schedulerInstance) {
        // schedulerInstance.destroy();
      }
    };
  }, []);

  const handleZoomIn = () => {
    console.log('Zooming in...');
    // schedulerInstance?.zoomIn();
  };

  const handleZoomOut = () => {
    console.log('Zooming out...');
    // schedulerInstance?.zoomOut();
  };

  const handleZoomToFit = () => {
    console.log('Fitting to view...');
    // schedulerInstance?.zoomToFit();
  };

  const handleExport = () => {
    console.log('Exporting to PDF...');
    // schedulerInstance?.features.pdfExport.export({
    //   format: 'A3',
    //   orientation: 'landscape'
    // });
  };

  const handleViewChange = (preset) => {
    setCurrentView(preset);
    // schedulerInstance?.viewPreset = preset;
  };

  const handleAddOperation = () => {
    console.log('Adding new operation...');
    // Open dialog to add new operation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="mx-auto max-w-full">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md rounded-t-2xl shadow-2xl p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Production Scheduler Pro
              </h1>
              <p className="text-gray-600 mt-1">Real-time production planning and resource management</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddOperation}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <span>➕</span>
                <span>Add Operation</span>
              </button>
              
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <span>📄</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleZoomIn}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Zoom In"
              >
                <span>🔍+</span>
              </button>
              <button
                onClick={handleZoomOut}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <span>🔍-</span>
              </button>
              <button
                onClick={handleZoomToFit}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Fit to View"
              >
                <span>⬜</span>
              </button>
              
              <div className="ml-4 flex gap-1">
                {viewPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleViewChange(preset.value)}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      currentView === preset.value
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Statistics */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">On Track</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">At Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Delayed</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scheduler Container */}
        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden">
          <div ref={containerRef} className="min-h-[600px] p-4">
            {/* This is where Bryntum Scheduler would render */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="mb-4">
                <span className="text-6xl">📅</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Bryntum Scheduler Pro Preview
              </h2>
              <p className="text-gray-500 mb-4">
                The production scheduler will be rendered here once Bryntum Scheduler Pro is installed
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
                <p className="text-sm text-blue-800 font-mono mb-2">
                  npm install @bryntum/schedulerpro @bryntum/schedulerpro-react
                </p>
                <p className="text-xs text-blue-600">
                  Note: This is a commercial library that requires a license
                </p>
              </div>
              
              {/* Sample Data Display */}
              <div className="mt-8 text-left max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Sample Data Loaded:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">📊 Resources</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 2 Production Lines with 5 machines</li>
                      <li>• 2 Assembly Stations</li>
                      <li>• 2 Quality Control Stations</li>
                      <li>• 2 Packaging Lines</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">📦 Operations</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 7 Scheduled Operations</li>
                      <li>• 4 Dependencies Configured</li>
                      <li>• 3 Customer Orders</li>
                      <li>• Mixed Priority Levels</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info Panel */}
        <div className="mt-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Production Overview</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🏭</span>
                <span className="text-2xl font-bold text-indigo-600">4</span>
              </div>
              <p className="text-sm text-gray-600">Active Lines</p>
              <p className="text-xs text-gray-500 mt-1">85% avg utilization</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📦</span>
                <span className="text-2xl font-bold text-green-600">7</span>
              </div>
              <p className="text-sm text-gray-600">Operations</p>
              <p className="text-xs text-gray-500 mt-1">1 in progress</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-2xl font-bold text-orange-600">92%</span>
              </div>
              <p className="text-sm text-gray-600">On-Time Rate</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👥</span>
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-xs text-gray-500 mt-1">Active orders</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .utilization-bar {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 12px;
        }
        
        .resource-type-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .custom-tooltip {
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .custom-tooltip h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .tooltip-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .tooltip-row > span:first-child {
          width: 80px;
          color: #666;
        }
        
        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .status-scheduled {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .status-in-progress {
          background: #e8f5e9;
          color: #388e3c;
        }
        
        .status-completed {
          background: #f3e5f5;
          color: #7b1fa2;
        }
        
        .status-on-hold {
          background: #fff3e0;
          color: #f57c00;
        }
        
        .priority-low {
          color: #666;
        }
        
        .priority-medium {
          color: #ff9800;
        }
        
        .priority-high {
          color: #f44336;
          font-weight: 600;
        }
        
        .priority-critical {
          color: #d32f2f;
          font-weight: 700;
        }
        
        .progress-bar {
          width: 100px;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          margin: 0 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s ease;
        }
        
        .event-content {
          padding: 4px 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .event-name {
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        
        .priority-indicator {
          margin-left: 4px;
        }
        
        .event-progress {
          margin-top: 4px;
        }
        
        .progress-bar-mini {
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill-mini {
          height: 100%;
          background: rgba(255,255,255,0.8);
        }
        
        .custom-event {
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .custom-event.priority-high,
        .custom-event.priority-critical {
          box-shadow: 0 2px 8px rgba(244,67,54,0.3);
        }
        
        .custom-event.status-in-progress {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76,175,80,0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(76,175,80,0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76,175,80,0);
          }
        }
      `}} />
    </div>
  );
};

export default ProductionScheduler;