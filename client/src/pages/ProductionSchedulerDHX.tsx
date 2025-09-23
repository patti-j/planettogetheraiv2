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

  // Initialize DHTMLX Gantt - Resource View with Hidden Operation Rows
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
    gantt.config.row_height = 44;
    gantt.config.bar_height = 16;
    gantt.config.open_tree_initially = true;
    
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
    
    // Configure grid columns
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
        template: function(task: any) {
          return task.capacity || "";
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
    gantt.config.sort = false;
    
    // Disable auto-scrolling to prevent errors
    gantt.config.scroll_on_click = false;
    gantt.config.autoscroll = false;
    gantt.config.autoscroll_speed = 0;
    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.initial_scroll = false;
    gantt.config.preserve_scroll = true;
    
    // Custom task text template for operations
    gantt.templates.task_text = function(start: any, end: any, task: any) {
      return task.text || "";
    };
    
    // Tooltip template for operations
    gantt.templates.tooltip_text = function(start: Date, end: Date, task: any) {
      return `<b>Operation:</b> ${task.text}<br/>
              <b>Job:</b> ${task.job_name || 'N/A'}<br/>
              <b>Start:</b> ${gantt.templates.tooltip_date_format(start)}<br/>
              <b>End:</b> ${gantt.templates.tooltip_date_format(end)}<br/>
              <b>Duration:</b> ${task.duration} hours<br/>
              <b>Progress:</b> ${Math.round((task.progress || 0) * 100)}%`;
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

  // Load data - Resources as parent tasks, Operations as children
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }

    // Clear existing data
    gantt.clearAll();
    
    // Create tasks array with resources as parent tasks
    const tasks: any[] = [];
    const resourceMap = new Map();
    
    // Add resources as parent tasks  
    (Array.isArray(resourcesData) ? resourcesData : []).forEach((resource: any) => {
      const resourceTask = {
        id: `resource_${resource.id}`,
        text: resource.name || `Resource ${resource.id}`,
        type: "project",
        open: true,
        capacity: resource.available_hours || 24
      };
      tasks.push(resourceTask);
      resourceMap.set(String(resource.id), resourceTask.id);
    });
    
    // Add operations as children of resources
    const resourceAssignmentCount = new Map();
    
    (Array.isArray(operationsData) ? operationsData : []).forEach((op: any) => {
      // Ensure resource_id is a string to match resource map keys
      const resourceId = String(op.resourceId || op.resourceDbId || 1);
      const parentId = resourceMap.get(resourceId);
      
      // Track assignment distribution
      resourceAssignmentCount.set(resourceId, (resourceAssignmentCount.get(resourceId) || 0) + 1);
      
      if (parentId) {
        tasks.push({
          id: op.id,
          text: op.name || 'Unnamed Operation',
          start_date: op.scheduledStart ? new Date(op.scheduledStart) : new Date(),
          duration: op.duration || 1,
          progress: op.percentFinished ? op.percentFinished / 100 : 0,
          parent: parentId,
          color: op.color || '#2196F3',
          job_name: op.jobName || 'N/A'
        });
      }
    });
    
    // Transform dependencies
    const links = (Array.isArray(dependenciesData) ? dependenciesData : []).map((dep: any) => ({
      id: dep.id,
      source: dep.from,
      target: dep.to,
      type: dep.type || "0"
    }));

    console.log('📋 Loading Resource Timeline View:', {
      resourceCount: resourceMap.size,
      operationsCount: operationsData.length,
      linksCount: links.length
    });
    
    console.log('🔍 Resource Assignment Distribution:');
    resourceAssignmentCount.forEach((count, resourceId) => {
      const resourceName = (resourcesData as any[])?.find((r: any) => String(r.id) === resourceId)?.name || `Resource ${resourceId}`;
      console.log(`  ${resourceName} (ID: ${resourceId}): ${count} operations`);
    });

    // Parse the data
    gantt.parse({
      data: tasks,
      links: links
    });

    console.log('✅ Resource Timeline View loaded');
    console.log('Resources:', resourceMap.size);
    console.log('Operations:', operationsData.length);
    console.log('Links:', links.length);

    // Calculate date range based on operations
    const operations = Array.isArray(operationsData) ? operationsData : [];
    if (operations.length > 0) {
      const dates: Date[] = operations
        .map((op: any) => op.scheduledStart ? new Date(op.scheduledStart) : null)
        .filter((d: any): d is Date => d && d instanceof Date && !isNaN(d.getTime()));
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        
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
    </div>
  );
}