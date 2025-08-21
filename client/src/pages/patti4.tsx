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
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                + Add Operation
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Export PDF
              </button>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              {viewPresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handleViewChange(preset.value)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                    currentView === preset.value 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Zoom In"
              >
                🔍+
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Zoom Out"
              >
                🔍-
              </button>
              <button
                onClick={handleZoomToFit}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Fit to View"
              >
                ⊡
              </button>
            </div>
          </div>
        </div>
        
        {/* Scheduler Container */}
        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden" style={{ height: '600px' }}>
          <div ref={containerRef} className="h-full relative">
            {/* Demo Notice - Remove when Bryntum is installed */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="max-w-2xl p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Bryntum Scheduler Pro Integration
                </h2>
                <p className="text-gray-600 mb-6">
                  This component is ready to integrate with Bryntum Scheduler Pro. 
                  To complete the setup:
                </p>
                
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Installation Steps:</h3>
                  <ol className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>Install packages: <code className="bg-white px-2 py-1 rounded">npm install @bryntum/schedulerpro @bryntum/schedulerpro-react</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Import Bryntum styles in your app</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Uncomment the import statements in this component</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>Initialize the SchedulerPro instance in useEffect</span>
                    </li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-indigo-700 mb-2">Current Features:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>✓ Hierarchical resources</li>
                      <li>✓ Drag & drop operations</li>
                      <li>✓ Dependencies</li>
                      <li>✓ Progress tracking</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-2">Production Ready:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>✓ Resource utilization</li>
                      <li>✓ Priority levels</li>
                      <li>✓ Status tracking</li>
                      <li>✓ PDF export</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics Footer */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Operations</p>
                <p className="text-2xl font-bold text-gray-800">{events.length}</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Resources</p>
                <p className="text-2xl font-bold text-gray-800">11</p>
              </div>
              <span className="text-3xl">⚙️</span>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg Utilization</p>
                <p className="text-2xl font-bold text-green-600">79%</p>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">1</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inline Styles */}
      <style>{`
        .utilization-bar {
          height: 20px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .custom-tooltip {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .custom-tooltip h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .tooltip-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-scheduled { background: #e3f2fd; color: #1976d2; }
        .status-in-progress { background: #fff3e0; color: #f57c00; }
        .status-completed { background: #e8f5e9; color: #388e3c; }
        .status-on-hold { background: #fce4ec; color: #c2185b; }
        
        .priority-low { color: #9e9e9e; }
        .priority-medium { color: #ff9800; }
        .priority-high { color: #f44336; font-weight: 600; }
        .priority-critical { color: #d32f2f; font-weight: 700; }
        
        .progress-bar {
          width: 100px;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
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
        }
        
        .event-name {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .priority-indicator {
          margin-left: 4px;
        }
        
        .progress-bar-mini {
          margin-top: 4px;
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
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .custom-event.priority-high,
        .custom-event.priority-critical {
          box-shadow: 0 2px 8px rgba(244,67,54,0.3);
        }
        
        .resource-type-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          background: #f5f5f5;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default ProductionScheduler;