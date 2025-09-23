import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Maximize, Calendar } from 'lucide-react';

export default function ProductionSchedulerDHX() {
  console.log('🚀 ProductionSchedulerDHX component is rendering');
  console.log('✅ DHTMLX Gantt library loaded:', typeof gantt !== 'undefined');

  const ganttContainer = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Fetch operations data
  const { data: operationsData = [], isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ['/api/pt-operations']
  });
  
  // Fetch resources data 
  const { data: resourcesData = [], isLoading: isLoadingRes } = useQuery({
    queryKey: ['/api/resources']
  });
  
  // Fetch dependencies data
  const { data: dependenciesData = [], isLoading: isLoadingDeps } = useQuery({
    queryKey: ['/api/pt-dependencies']
  });

  // Initialize DHTMLX Gantt - Simple Resource-only View
  useEffect(() => {
    if (isInitialized || !ganttContainer.current) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt - Resource Timeline View');
    
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    gantt.config.correct_work_time = true;
    gantt.config.round_dnd_dates = true;
    
    // Set row height for resources
    gantt.config.row_height = 60; // Taller rows to accommodate multiple operations
    gantt.config.bar_height = 16;
    
    // Configure scales
    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d %M";
    gantt.config.min_column_width = 50;
    gantt.config.scale_height = 90;
    
    gantt.config.subscales = [
      {
        unit: "hour",
        step: 6,
        date: "%H:00"
      }
    ];
    
    // Configure grid columns - resources only
    gantt.config.columns = [
      {
        name: "text",
        label: "Resource",
        tree: false,
        width: 180
      },
      {
        name: "capacity",
        label: "Capacity",
        align: "center",
        width: 70,
        template: function(obj: any) {
          return obj.capacity || "24h";
        }
      }
    ];
    
    // Disable drag and drop for now
    gantt.config.readonly = true;
    gantt.config.drag_links = false;
    gantt.config.drag_move = false;
    gantt.config.drag_resize = false;
    gantt.config.show_links = false; // Hide links initially
    gantt.config.show_progress = true;
    gantt.config.sort = false;
    
    // Disable auto-scrolling to prevent errors
    gantt.config.scroll_on_click = false;
    gantt.config.autoscroll = false;
    gantt.config.autoscroll_speed = 0;
    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.initial_scroll = false;
    gantt.config.preserve_scroll = true;
    
    // Hide resource bars on timeline
    gantt.templates.task_class = function(start: any, end: any, task: any) {
      if (task.is_resource) {
        return "resource-task-hidden";
      }
      return "";
    };
    
    // Style resource rows in grid
    gantt.templates.grid_row_class = function(start: any, end: any, task: any) {
      if (task.is_resource) {
        return "resource-grid-row";
      }
      return "";
    };
    
    // Style resource rows in timeline
    gantt.templates.task_row_class = function(start: any, end: any, task: any) {
      if (task.is_resource) {
        return "resource-timeline-row";
      }
      return "";
    };
    
    // Initialize Gantt with error handling
    try {
      // Prevent the auto-show behavior completely
      const originalShowTask = gantt.showTask;
      const originalShowDate = gantt.showDate;
      
      // Temporarily disable show methods during initialization
      gantt.showTask = () => {};
      gantt.showDate = () => {};
      
      try {
        gantt.init(ganttContainer.current);
        setIsInitialized(true);
        console.log('✅ DHTMLX Gantt initialized - Resource Timeline View');
        
        // Restore show methods after a delay
        setTimeout(() => {
          gantt.showTask = originalShowTask;
          gantt.showDate = originalShowDate;
          console.log('📅 Show methods restored');
        }, 500);
      } catch (initErr) {
        console.error('❌ Error during Gantt initialization:', initErr);
        // Still restore methods on error
        gantt.showTask = originalShowTask;
        gantt.showDate = originalShowDate;
      }
    } catch (error) {
      console.error('❌ Failed to initialize DHTMLX Gantt:', error);
    }
    
    return () => {
      // Cleanup on unmount
      if (isInitialized) {
        gantt.clearAll();
      }
    };
  }, [ganttContainer.current, isInitialized]);

  // Load data - Only Resources as rows, Operations as custom layer
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }

    // Clear existing data
    gantt.clearAll();

    // Create resource-only tasks (12 rows)
    const resourceTasks = (Array.isArray(resourcesData) ? resourcesData : []).map((resource: any, index: number) => ({
      id: `resource_${resource.id}`,
      text: resource.name || `Resource ${resource.id}`,
      start_date: new Date("2025-08-22"), // Fixed start date for resources
      duration: 30 * 24, // 30 days duration for visualization
      capacity: resource.available_hours || 24,
      resource_id: resource.id,
      is_resource: true, // Flag to identify resource rows
      progress: 0,
      readonly: true
    }));

    console.log('📋 Loading Resource-Only View:', {
      resourceCount: resourceTasks.length
    });

    // Parse resource data first
    gantt.parse({
      data: resourceTasks,
      links: []
    });

    // Now add operations as a custom layer on the timeline
    const operations = Array.isArray(operationsData) ? operationsData : [];
    
    // Store operations data globally for the custom layer
    (gantt as any)._operations = operations;
    (gantt as any)._resourceMap = new Map();
    resourceTasks.forEach((res: any, index: number) => {
      (gantt as any)._resourceMap.set(res.resource_id, index);
    });

    // Add custom task layer for operations
    gantt.addTaskLayer(function(task: any) {
      if (!task.is_resource) {
        return false; // Don't render non-resource tasks
      }
      
      const resourceId = task.resource_id;
      const resourceOps = operations.filter((op: any) => {
        const opResourceId = op.resourceId || op.resourceDbId || 1;
        return String(opResourceId) === String(resourceId);
      });

      // Create a container for all operations on this resource
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';

      // Render each operation as a bar
      let yOffset = 5; // Start position for first operation
      resourceOps.forEach((op: any, index: number) => {
        if (!op.scheduledStart) return;

        const startDate = new Date(op.scheduledStart);
        const endDate = op.scheduledEnd ? new Date(op.scheduledEnd) : new Date(startDate.getTime() + (op.duration || 1) * 3600000);
        
        // Get position for this operation
        const pos = gantt.getTaskPosition(task, startDate, endDate);
        
        // Create operation bar
        const opBar = document.createElement('div');
        opBar.className = 'custom-operation-bar';
        opBar.style.position = 'absolute';
        opBar.style.left = pos.left + 'px';
        opBar.style.width = pos.width + 'px';
        opBar.style.top = yOffset + 'px';
        opBar.style.height = '16px';
        opBar.style.backgroundColor = op.color || '#2196F3';
        opBar.style.borderRadius = '2px';
        opBar.style.fontSize = '10px';
        opBar.style.color = 'white';
        opBar.style.padding = '0 4px';
        opBar.style.lineHeight = '16px';
        opBar.style.overflow = 'hidden';
        opBar.style.textOverflow = 'ellipsis';
        opBar.style.whiteSpace = 'nowrap';
        opBar.innerHTML = op.name || 'Operation';
        
        container.appendChild(opBar);
        
        // Move to next row position if overlapping
        yOffset += 20;
        if (yOffset > 40) {
          yOffset = 5; // Reset to top if too many operations
        }
      });

      return container;
    });

    console.log('✅ Resource Timeline View loaded');
    console.log('Resources:', resourceTasks.length);
    console.log('Operations (on timeline):', operations.length);

    // Calculate date range based on operations
    if (operations.length > 0) {
      const dates = operations
        .map((op: any) => op.scheduledStart ? new Date(op.scheduledStart) : null)
        .filter((d: any) => d && d instanceof Date && !isNaN(d.getTime()));
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
        
        // Add padding
        minDate.setDate(minDate.getDate() - 1);
        maxDate.setDate(maxDate.getDate() + 7);
        
        gantt.config.start_date = minDate;
        gantt.config.end_date = maxDate;
        gantt.render();
        
        // After rendering, safely try to show current date
        setTimeout(() => {
          try {
            const today = new Date();
            gantt.showDate(today);
            console.log('📅 Centered view on today\'s date');
          } catch (err: any) {
            console.log('⚠️ Could not center view (this is normal):', err?.message);
          }
        }, 300);
      }
    }
  }, [operationsData, resourcesData, dependenciesData, isLoadingOps, isLoadingRes, isInitialized]);

  const handleZoomToFit = () => {
    if (ganttContainer.current) {
      gantt.render();
    }
  };

  const handleRefresh = () => {
    refetchOps();
  };

  const handleToday = () => {
    const today = new Date();
    gantt.showDate(today);
  };

  const handleZoomIn = () => {
    const currentScale = gantt.config.scale_unit;
    if (currentScale === 'month') {
      gantt.config.scale_unit = 'week';
      gantt.config.date_scale = 'Week %W';
    } else if (currentScale === 'week') {
      gantt.config.scale_unit = 'day';
      gantt.config.date_scale = '%d %M';
    }
    gantt.render();
  };

  const handleZoomOut = () => {
    const currentScale = gantt.config.scale_unit;
    if (currentScale === 'day') {
      gantt.config.scale_unit = 'week';
      gantt.config.date_scale = 'Week %W';
    } else if (currentScale === 'week') {
      gantt.config.scale_unit = 'month';
      gantt.config.date_scale = '%F %Y';
    }
    gantt.render();
  };

  if (isLoadingOps || isLoadingRes) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Loading scheduler data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => window.location.href = '/production-schedule'}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Production Schedule
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Production Scheduler - Resource Timeline
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="gap-2"
            title="Go to Today"
          >
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            −
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomToFit}
            className="gap-2"
            title="Fit to View"
          >
            <Maximize className="h-4 w-4" />
            Fit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Gantt Component */}
      <div 
        ref={ganttContainer} 
        className="flex-1 w-full"
        style={{ height: 'calc(100vh - 60px)' }}
      />
      
      {/* Custom styles for resource timeline view */}
      <style jsx global>{`
        /* Hide resource task bars */
        .resource-task-hidden {
          display: none !important;
        }
        
        /* Style resource rows in grid */
        .resource-grid-row {
          background-color: #f3f4f6 !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #d1d5db !important;
        }
        
        /* Style resource rows in timeline */
        .resource-timeline-row {
          background-color: #fafafa !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        /* Dark mode support */
        .dark .resource-grid-row {
          background-color: #374151 !important;
          border-bottom: 1px solid #4b5563 !important;
        }
        
        .dark .resource-timeline-row {
          background-color: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
        }
        
        /* Custom operation bars */
        .custom-operation-bar {
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .custom-operation-bar:hover {
          opacity: 0.8;
        }
        
        /* Ensure resource rows have enough height */
        .gantt_task_row {
          height: 60px !important;
        }
        
        .gantt_row {
          height: 60px !important;
        }
        
        /* Grid cell height */
        .gantt_cell {
          height: 60px !important;
        }
      `}</style>
    </div>
  );
}