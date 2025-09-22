import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Maximize, Calendar } from 'lucide-react';

export default function ProductionSchedulerDHX() {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Fetch operations data
  const { data: operationsData = [], isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ['/api/pt-operations'],
    refetchInterval: 60000,
  });

  // Fetch resources data  
  const { data: resourcesData = [], isLoading: isLoadingRes } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Fetch dependencies data
  const { data: dependenciesData = [] } = useQuery({
    queryKey: ['/api/pt-dependencies'],
  });

  useEffect(() => {
    if (!ganttContainer.current || isInitialized.current) return;
    
    // Configure Gantt
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.show_grid = true;
    gantt.config.show_chart = true;
    gantt.config.show_links = true;
    gantt.config.show_progress = true;
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;
    gantt.config.drag_links = true;
    gantt.config.details_on_dblclick = true;
    gantt.config.autofit = true;
    gantt.config.columns = [
      { name: "text", label: "Operation", tree: true, width: 200 },
      { name: "resource_name", label: "Resource", width: 100 },
      { name: "start_date", label: "Start", width: 90 },
      { name: "duration", label: "Duration", width: 60 },
      { name: "add", label: "", width: 30 }
    ];

    // Set scale
    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d %M";
    gantt.config.subscales = [
      { unit: "hour", step: 1, format: "%H" }
    ];
    gantt.config.scale_height = 54;
    
    // Configure resource view
    gantt.config.layout = {
      css: "gantt_container",
      rows: [
        {
          cols: [
            {
              view: "grid",
              scrollX: "gridScroll",
              scrollable: true,
              width: 400
            },
            { resizer: true, width: 1 },
            {
              view: "timeline",
              scrollX: "scrollHor",
              scrollY: "scrollVer",
              scrollable: true
            },
            {
              view: "scrollbar",
              id: "scrollVer"
            }
          ]
        },
        {
          view: "scrollbar",
          id: "scrollHor",
          height: 20
        }
      ]
    };

    // Initialize Gantt
    gantt.init(ganttContainer.current);
    isInitialized.current = true;

    // Cleanup
    return () => {
      if (ganttContainer.current && gantt.$container) {
        gantt.clearAll();
      }
    };
  }, []);

  // Load data when it changes
  useEffect(() => {
    if (!isInitialized.current || isLoadingOps || isLoadingRes) return;

    const opsArray = Array.isArray(operationsData) ? operationsData : [];
    const resArray = Array.isArray(resourcesData) ? resourcesData : [];
    const depsArray = Array.isArray(dependenciesData) ? dependenciesData : [];

    // Transform operations to DHTMLX format
    const tasks = opsArray
      .filter((op: any) => op.startDate && op.endDate)
      .map((op: any) => {
        const startDate = new Date(op.startDate);
        const endDate = new Date(op.endDate);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)); // Hours

        return {
          id: op.id,
          text: op.name || op.operationName || 'Operation',
          start_date: startDate,
          duration: duration / 24, // Convert to days for DHTMLX
          progress: (op.percent_done || 0) / 100,
          resource_id: op.resourceId ? parseInt(op.resourceId, 10) : null,
          resource_name: op.resourceName || 'Unassigned',
          color: op.priority > 5 ? '#ff5252' : op.priority > 3 ? '#ff9800' : '#4caf50',
          job_id: op.jobId,
          job_name: op.jobName
        };
      });

    // Transform dependencies to DHTMLX format
    const links = depsArray.map((dep: any) => ({
      id: dep.id || `link_${dep.from}_${dep.to}`,
      source: dep.from,
      target: dep.to,
      type: dep.type === 2 ? "0" : "1" // Convert to DHTMLX types (0=finish-to-start, 1=start-to-start)
    }));

    // Load data into Gantt
    gantt.clearAll();
    gantt.parse({
      data: tasks,
      links: links
    });

    // Auto-fit timeline
    if (tasks.length > 0) {
      const minDate = new Date(Math.min(...tasks.map((t: any) => t.start_date.getTime())));
      const maxDate = new Date(Math.max(...tasks.map((t: any) => {
        const endDate = new Date(t.start_date);
        endDate.setDate(endDate.getDate() + t.duration);
        return endDate.getTime();
      })));
      
      minDate.setDate(minDate.getDate() - 7);
      maxDate.setDate(maxDate.getDate() + 7);
      
      gantt.config.start_date = minDate;
      gantt.config.end_date = maxDate;
      gantt.render();
    }

    console.log('Loaded tasks:', tasks.length);
    console.log('Loaded links:', links.length);
  }, [operationsData, resourcesData, dependenciesData, isLoadingOps, isLoadingRes]);

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