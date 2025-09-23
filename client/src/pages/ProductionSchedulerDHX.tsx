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

  // Initialize DHTMLX Gantt with Resource View
  useEffect(() => {
    if (isInitialized || !ganttContainer.current) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt with Resource View');
    
    // Configure resource view
    gantt.config.resource_store = "resource";
    gantt.config.resource_property = "resource_id";
    gantt.config.order_branch = true;
    gantt.config.order_branch_free = true;
    
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    gantt.config.correct_work_time = true;
    gantt.config.round_dnd_dates = true;
    
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
    
    // Configure layout with resource view
    gantt.config.layout = {
      css: "gantt_container",
      rows: [
        {
          cols: [
            {
              view: "grid",
              width: 250,
              scrollY: "scrollVer",
              scrollX: "scrollHor"
            },
            { resizer: true, width: 1 },
            {
              view: "timeline",
              scrollX: "scrollHor",
              scrollY: "scrollVer"
            },
            {
              view: "scrollbar",
              scroll: "y",
              id: "scrollVer"
            }
          ]
        },
        {
          view: "scrollbar",
          scroll: "x",
          id: "scrollHor",
          height: 20
        }
      ]
    };
    
    // Configure grid columns to show resources only
    gantt.config.columns = [
      {
        name: "text",
        label: "Resource",
        tree: false,
        width: 150
      },
      {
        name: "capacity",
        label: "Capacity",
        align: "center",
        width: 80,
        template: function(obj: any) {
          return obj.$level === 0 ? (obj.capacity || "24h") : "";
        }
      }
    ];
    
    // Disable drag and drop for now
    gantt.config.readonly = true;
    gantt.config.drag_links = false;
    gantt.config.drag_move = false;
    gantt.config.drag_resize = false;
    gantt.config.show_links = true;
    gantt.config.show_progress = true;
    gantt.config.sort = true;
    
    // Disable auto-scrolling to prevent errors
    gantt.config.scroll_on_click = false;
    gantt.config.autoscroll = false;
    gantt.config.autoscroll_speed = 0;
    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.initial_scroll = false;
    gantt.config.preserve_scroll = true;
    
    // Configure task rendering templates
    gantt.templates.task_text = function(start: any, end: any, task: any) {
      if (task.$level === 0) {
        // Don't show text for resource rows
        return "";
      }
      return task.text || "";
    };
    
    gantt.templates.task_class = function(start: any, end: any, task: any) {
      if (task.$level === 0) {
        // Hide the bar for resource rows
        return "resource-row";
      }
      return "";
    };
    
    // Style resource rows differently
    gantt.templates.grid_row_class = function(start: any, end: any, task: any) {
      if (task.$level === 0) {
        return "resource-row-grid";
      }
      return "";
    };
    
    gantt.templates.task_row_class = function(start: any, end: any, task: any) {
      if (task.$level === 0) {
        return "resource-row-timeline";
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
        console.log('✅ DHTMLX Gantt initialized successfully with Resource View');
        
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

  // Load data into Gantt with Resource View Structure
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }

    // Clear existing data
    gantt.clearAll();

    // First, create resource rows with unique IDs
    const resourceTasks = (Array.isArray(resourcesData) ? resourcesData : []).map((resource: any) => ({
      id: `resource_${resource.id}`,
      text: resource.name || `Resource ${resource.id}`,
      type: "project", // Makes it expandable
      open: true, // Keep expanded
      capacity: resource.available_hours || 24,
      resource_id: resource.id,
      start_date: new Date("2025-08-22"), // Use earliest date from operations
      duration: 30 * 24, // 30 days default duration
      parent: 0,
      $level: 0 // Mark as resource level
    }));

    // Then, create operation tasks as children of resources
    const operationTasks = (Array.isArray(operationsData) ? operationsData : []).map((op: any) => {
      const resourceId = op.resourceId || op.resourceDbId || 1; // Default to resource 1 if not assigned
      return {
        id: op.id,
        text: op.name || 'Unnamed Operation',
        start_date: op.scheduledStart ? new Date(op.scheduledStart) : new Date(),
        duration: op.duration || 1,
        progress: op.percentFinished ? op.percentFinished / 100 : 0,
        parent: `resource_${resourceId}`, // Parent is the resource
        resource_id: resourceId,
        job_name: op.jobName || 'N/A',
        color: op.color || '#2196F3',
        $level: 1 // Mark as operation level
      };
    });

    // Combine all tasks
    const allTasks = [...resourceTasks, ...operationTasks];

    // Transform dependencies to Gantt links format
    const links = (Array.isArray(dependenciesData) ? dependenciesData : []).map((dep: any) => ({
      id: dep.id,
      source: dep.from,
      target: dep.to,
      type: dep.type || "0"
    }));

    console.log('📋 Loading data into Resource View:', {
      resourceCount: resourceTasks.length,
      operationsCount: operationTasks.length,
      linksCount: links.length,
      firstResource: resourceTasks[0],
      firstOperation: operationTasks[0]
    });

    // Load data
    gantt.parse({
      data: allTasks,
      links: links
    });

    console.log('✅ Data loaded into Resource View');

    // Calculate date range
    if (operationTasks.length > 0) {
      const dates = operationTasks
        .map((t: any) => t.start_date)
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

    console.log('Resources loaded:', resourceTasks.length);
    console.log('Operations loaded:', operationTasks.length);
    console.log('Links loaded:', links.length);
  }, [operationsData, resourcesData, dependenciesData, isLoadingOps, isLoadingRes, isInitialized]);

  const handleZoomToFit = () => {
    // DHTMLX Gantt doesn't have built-in zoom-to-fit, 
    // but we can adjust the scale to show all tasks
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
    // Change to a more detailed view
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
    // Change to a less detailed view
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
          Production Scheduler - Resource View
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
      
      {/* Custom styles for resource view */}
      <style jsx global>{`
        /* Hide task bars for resource rows */
        .resource-row {
          display: none !important;
        }
        
        /* Style resource rows in grid */
        .resource-row-grid {
          background-color: #f3f4f6 !important;
          font-weight: 600 !important;
        }
        
        .gantt_task_line.resource-row-grid {
          background-color: #f3f4f6 !important;
        }
        
        /* Style resource rows in timeline */
        .resource-row-timeline {
          background-color: #fafafa !important;
        }
        
        /* Dark mode support */
        .dark .resource-row-grid {
          background-color: #374151 !important;
        }
        
        .dark .resource-row-timeline {
          background-color: #1f2937 !important;
        }
        
        /* Make operation tasks smaller */
        .gantt_task_line {
          height: 20px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }
        
        .gantt_task_content {
          font-size: 11px !important;
        }
      `}</style>
    </div>
  );
}