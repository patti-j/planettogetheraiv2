import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

interface ProductionSchedulerDHXProps {}

export default function ProductionSchedulerDHX({}: ProductionSchedulerDHXProps) {
  const [ganttContainer, setGanttContainer] = useState<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch operations data
  const { data: operationsData, isLoading: isLoadingOps } = useQuery({
    queryKey: ['/api/pt-operations'],
  });

  // Fetch resources data
  const { data: resourcesData, isLoading: isLoadingRes } = useQuery({
    queryKey: ['/api/pt-resources'],
  });

  // Fetch dependencies data
  const { data: dependenciesData, isLoading: isLoadingDeps } = useQuery({
    queryKey: ['/api/pt-dependencies'],
  });

  // Initialize DHTMLX Gantt
  useEffect(() => {
    console.log('🔄 DHTMLX Init Check:', {
      hasContainer: !!ganttContainer,
      isInitialized: isInitialized
    });
    
    if (!ganttContainer || isInitialized) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt - Resource-Grouped View');
    
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    
    // Set initial date range to Aug 2025 (where our operations are)
    gantt.config.start_date = new Date(2025, 7, 15); // Aug 15, 2025
    gantt.config.end_date = new Date(2025, 8, 30); // Sep 30, 2025
    
    // Configure scales (new format to avoid deprecation warning)
    gantt.config.scales = [
      {unit: "day", step: 1, format: "%d %M"},
      {unit: "hour", step: 1, format: "%H:00"}
    ];
    
    // Configure grid columns
    gantt.config.columns = [
      {
        name: "text",
        label: "Resource/Operation",
        tree: true,
        width: 250
      },
      {
        name: "start_date",
        label: "Start",
        align: "center",
        width: 90,
        template: function(task: any) {
          if (task.$level === 0) return "";
          if (!task.start_date) return "";
          const date = new Date(task.start_date);
          return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        }
      },
      {
        name: "duration",
        label: "Duration (h)",
        align: "center",
        width: 70,
        template: function(task: any) {
          if (task.$level === 0) return "";
          return task.duration || "";
        }
      }
    ];
    
    // Configure task styling
    gantt.templates.task_class = function(start, end, task) {
      if (task.$level === 0) {
        return "resource-row";
      }
      return "operation-task";
    };
    
    gantt.templates.task_text = function(start, end, task) {
      if (task.$level === 0) {
        return "";  // Don't show text on resource rows
      }
      return task.text;
    };
    
    // Force task bars to be visible with proper styling
    gantt.templates.task_class = function(start, end, task) {
      if (task.type === 'project') {
        return 'resource-row';
      }
      return 'operation-task visible-bar';
    };
    
    // Configure resource row colors
    gantt.templates.grid_row_class = function(start, end, task) {
      if (task.$level === 0) {
        return "resource-grid-row";
      }
      return "";
    };
    
    // Disable some features for now
    gantt.config.readonly = false;
    gantt.config.drag_links = false;
    gantt.config.drag_move = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_progress = false;
    
    // Show project tasks (resources) as bars across timeline
    gantt.config.show_project_in_taskbar = false; // Disable resource bars to see operations clearly
    
    // Initialize Gantt
    gantt.init(ganttContainer);
    console.log('✅ DHTMLX Gantt initialized');
    setIsInitialized(true);
    
    // Force initial render
    gantt.render();

    // Cleanup on unmount
    return () => {
      if (ganttContainer && gantt) {
        gantt.clearAll();
        setIsInitialized(false);
      }
    };
  }, [ganttContainer]); // Run when container is ready

  // Load data - Resources as parent tasks, Operations as children
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }
    
    // Prevent multiple data loads
    if (!operationsData || !resourcesData) {
      return;
    }
    
    console.log('📊 Raw Data:', {
      operations: operationsData,
      resources: resourcesData,
      dependencies: dependenciesData
    });

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
        resource_capacity: resource.available_hours || 24,
        render: "split" // This makes resource show as background bar
      };
      tasks.push(resourceTask);
      resourceMap.set(String(resource.id), resourceTask.id);
    });
    
    // Add operations as children of resources
    const resourceAssignmentCount = new Map();
    
    (Array.isArray(operationsData) ? operationsData : []).forEach((op: any) => {
      // Map field names from PT API response
      const resourceId = String(op.resourceId || op.resource_id || op.resourceDbId || 1);
      const parentId = resourceMap.get(resourceId);
      
      // Track assignment distribution
      resourceAssignmentCount.set(resourceId, (resourceAssignmentCount.get(resourceId) || 0) + 1);
      
      if (parentId) {
        const startDate = op.scheduledStart ? new Date(op.scheduledStart) : new Date();
        const endDate = op.scheduledEnd ? new Date(op.scheduledEnd) : new Date(startDate.getTime() + (op.duration || 4) * 60 * 60 * 1000);
        
        tasks.push({
          id: op.id || op.operationId,
          text: op.operationName || op.name || 'Unnamed Operation',
          start_date: startDate,
          end_date: endDate,
          duration: op.duration || op.cycleHrs || 1,
          progress: op.percentFinished ? op.percentFinished / 100 : 0,
          parent: parentId,
          type: "task", // Explicitly set as task type
          render: "bar", // Render as a bar on timeline
          color: op.color || '#2196F3',
          bar_height: 20 // Set bar height for visibility
        });
      }
    });
    
    // Transform dependencies
    const links = (Array.isArray(dependenciesData) ? dependenciesData : []).map((dep: any) => ({
      id: dep.dependencyId || dep.id,
      source: dep.fromOperationId || dep.from,
      target: dep.toOperationId || dep.to,
      type: dep.type || "0"
    }));

    const opsCount = Array.isArray(operationsData) ? operationsData.length : 0;
    
    console.log('📋 Loading Resource-Grouped Data:', {
      resourceCount: resourceMap.size,
      operationsCount: opsCount,
      linksCount: links.length
    });
    
    console.log('🔍 Resource Assignment Distribution:');
    resourceAssignmentCount.forEach((count, resourceId) => {
      const resourceName = (resourcesData as any[])?.find((r: any) => String(r.id) === resourceId)?.name || `Resource ${resourceId}`;
      console.log(`  ${resourceName} (ID: ${resourceId}): ${count} operations`);
    });

    // Parse the data
    const ganttData = {
      data: tasks,
      links: links
    };
    
    console.log('📦 About to parse DHTMLX Gantt data:', {
      tasksCount: tasks.length,
      linksCount: links.length,
      firstTask: tasks[0],
      firstLink: links[0]
    });
    
    gantt.parse(ganttData);
    
    console.log('✅ Resource-Grouped View loaded');
    console.log('Resources:', resourceMap.size);
    console.log('Operations:', opsCount);
    console.log('Links:', links.length);
    
    // Force render and refresh after parsing
    setTimeout(() => {
      gantt.render();
      gantt.refreshData();
      // Force a complete redraw
      if (ganttContainer) {
        gantt.init(ganttContainer);
        gantt.parse(ganttData);
      }
      console.log('🔄 DHTMLX Gantt refreshed and reinitialized');
      
      // Debug: Check if DHTMLX created elements
      const ganttElements = document.querySelectorAll('.gantt_grid, .gantt_task, .gantt_ver_scroll');
      console.log('📊 DHTMLX DOM elements created:', {
        gridElements: document.querySelectorAll('.gantt_grid').length,
        taskElements: document.querySelectorAll('.gantt_task').length,
        scrollElements: document.querySelectorAll('.gantt_ver_scroll').length,
        containerChildren: ganttContainer?.children.length || 0
      });
    }, 100);

    // Calculate date range based on operations and ensure proper display
    const operations = Array.isArray(operationsData) ? operationsData : [];
    if (operations.length > 0) {
      // Get dates from operations that have scheduled dates
      const scheduledOps = operations.filter((op: any) => op.scheduledStart);
      
      if (scheduledOps.length > 0) {
        // Parse the dates from the operations
        const dates = scheduledOps.map((op: any) => new Date(op.scheduledStart));
        
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        console.log('📅 Operation date range:', { 
          minDate: minDate.toISOString(), 
          maxDate: maxDate.toISOString(),
          totalOps: scheduledOps.length
        });
        
        // Add buffer for better visibility - extend range
        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 10);
        
        // Set the display range
        gantt.config.start_date = minDate;
        gantt.config.end_date = maxDate;
        gantt.config.show_tasks_outside_timescale = false;
        
        // Force the gantt to show the correct date range
        setTimeout(() => {
          gantt.render();
          // Scroll to show the first operation
          if (scheduledOps[0]?.scheduledStart) {
            const firstOpDate = new Date(scheduledOps[0].scheduledStart);
            gantt.showDate(firstOpDate);
            console.log('📍 Scrolled to first operation date:', firstOpDate.toISOString());
          }
        }, 300);
      }
    }
    
  }, [operationsData, resourcesData, dependenciesData, isInitialized]);

  console.log('🚀 ProductionSchedulerDHX component is rendering');
  console.log('✅ DHTMLX Gantt library loaded:', typeof gantt !== 'undefined');

  return (
    <div className="h-screen w-full p-4 bg-gray-50">
      <Card className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">DHTMLX Gantt - Resource View</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 relative" style={{ minHeight: '600px' }}>
          {(isLoadingOps || isLoadingRes) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading scheduler data...</div>
            </div>
          ) : (
            <div 
              ref={setGanttContainer} 
              className="dhtmlx-gantt-container"
              style={{ width: '100%', height: '600px' }}
            />
          )}
        </div>
      </Card>
      
      <style>{`
        .dhtmlx-gantt-container {
          width: 100%;
          height: 100%;
          min-height: 500px;
          position: relative;
        }
        
        /* DHTMLX Gantt specific styles to ensure visibility */
        .gantt_container {
          width: 100% !important;
          height: 100% !important;
        }
        
        .resource-grid-row {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .resource-row {
          background-color: #e0e0e0 !important;
          opacity: 0.3;
        }
        
        .operation-task {
          border: 1px solid #2196F3;
        }
        
        .gantt_task_line.resource-row {
          background-color: #e0e0e0;
          border: 1px solid #c0c0c0;
        }
        
        .gantt_tree_icon.gantt_open {
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAA...);
        }
        
        .gantt_tree_icon.gantt_close {
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAA...);
        }
      `}</style>
    </div>
  );
}