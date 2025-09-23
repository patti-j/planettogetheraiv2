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

  // Initialize DHTMLX Gantt
  useEffect(() => {
    if (isInitialized || !ganttContainer.current) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt');
    
    // Configure Gantt
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.show_grid = true;
    gantt.config.show_chart = true;
    gantt.config.show_links = true;
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.readonly = false;
    gantt.config.drag_links = false;
    gantt.config.drag_move = false;
    gantt.config.drag_resize = false;
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    gantt.config.correct_work_time = true;
    gantt.config.round_dnd_dates = true;
    gantt.config.show_progress = true;
    gantt.config.sort = true;
    gantt.config.autosize = true;
    gantt.config.fit_tasks = true;
    
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
    
    // Configure columns for the grid
    gantt.config.columns = [
      {
        name: "text",
        label: "Operation",
        tree: false,
        width: 200
      },
      {
        name: "start_date",
        label: "Start",
        align: "center",
        width: 100
      },
      {
        name: "duration",
        label: "Duration",
        align: "center",
        width: 70
      },
      {
        name: "resource_name",
        label: "Resource",
        align: "center",
        width: 100
      },
      {
        name: "job_name",
        label: "Job",
        align: "center",
        width: 100
      }
    ];
    
    // Disable auto-scrolling to prevent errors
    gantt.config.scroll_on_click = false;
    gantt.config.autoscroll = false;
    gantt.config.autoscroll_speed = 0;
    gantt.config.show_tasks_outside_timescale = true;
    gantt.config.initial_scroll = false;
    gantt.config.preserve_scroll = true;
    gantt.config.show_task_cells = false;
    
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
        console.log('✅ DHTMLX Gantt initialized successfully');
        
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

  // Load data into Gantt
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }

    // Clear existing data
    gantt.clearAll();

    // Transform operations data to Gantt tasks format
    const tasks = (Array.isArray(operationsData) ? operationsData : []).map((op: any) => ({
      id: op.id,
      text: op.name || 'Unnamed Operation',
      start_date: op.scheduledStart ? new Date(op.scheduledStart) : new Date(),
      duration: op.duration || 1,
      progress: op.percentFinished ? op.percentFinished / 100 : 0,
      resource_id: op.resourceId || op.resourceDbId,
      resource_name: op.resourceName || 'Unassigned',
      color: op.color || '#2196F3',
      job_id: op.jobId,
      job_name: op.jobName || 'N/A'
    }));

    // Transform dependencies to Gantt links format
    const links = (Array.isArray(dependenciesData) ? dependenciesData : []).map((dep: any) => ({
      id: dep.id,
      source: dep.from,
      target: dep.to,
      type: dep.type || "0"
    }));

    console.log('📋 Loading data into Gantt:', {
      tasksCount: tasks.length,
      linksCount: links.length,
      firstTask: tasks[0],
      firstLink: links[0]
    });

    // Load data
    gantt.parse({
      data: tasks,
      links: links
    });

    console.log('✅ Data loaded into Gantt');

    // Calculate date range
    if (tasks.length > 0) {
      const dates = tasks.map((t: any) => t.start_date).filter((d: any) => d);
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
          if (tasks.length > 0 && gantt.$task_scale) {
            const today = new Date();
            gantt.showDate(today);
            console.log('📅 Centered view on today\'s date');
          }
        } catch (err: any) {
          console.log('⚠️ Could not center view (this is normal):', err?.message);
        }
      }, 300);
    }

    console.log('Loaded tasks:', tasks.length);
    console.log('Loaded links:', links.length);
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
          Production Scheduler - DHTMLX Gantt
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