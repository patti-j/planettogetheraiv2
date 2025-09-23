import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

interface ProductionSchedulerDHXProps {}

export default function ProductionSchedulerDHX({}: ProductionSchedulerDHXProps) {
  const ganttContainer = useRef<HTMLDivElement>(null);
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
    if (!ganttContainer.current || isInitialized) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt - Resource-Grouped View');
    
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    
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
    gantt.config.show_project_in_taskbar = true;
    
    // Initialize Gantt
    gantt.init(ganttContainer.current);
    console.log('✅ DHTMLX Gantt initialized');
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      if (ganttContainer.current && gantt) {
        gantt.clearAll();
        setIsInitialized(false);
      }
    };
  }, [ganttContainer.current, isInitialized]);

  // Load data - Resources as parent tasks, Operations as children
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
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
        tasks.push({
          id: op.id || op.operationId,
          text: op.operationName || op.name || 'Unnamed Operation',
          start_date: op.scheduledStart ? new Date(op.scheduledStart) : new Date(),
          duration: op.duration || op.cycleHrs || 1,
          progress: op.percentFinished ? op.percentFinished / 100 : 0,
          parent: parentId,
          color: op.color || '#2196F3'
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
    gantt.parse({
      data: tasks,
      links: links
    });

    console.log('✅ Resource-Grouped View loaded');
    console.log('Resources:', resourceMap.size);
    console.log('Operations:', opsCount);
    console.log('Links:', links.length);

    // Calculate date range based on operations
    const operations = Array.isArray(operationsData) ? operationsData : [];
    if (operations.length > 0) {
      const dates = operations
        .map((op: any) => op.scheduledStart ? new Date(op.scheduledStart) : null)
        .filter(Boolean) as Date[];
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Add buffer for better visibility
        minDate.setDate(minDate.getDate() - 1);
        maxDate.setDate(maxDate.getDate() + 2);
        
        // Set the display range
        gantt.config.start_date = minDate;
        gantt.config.end_date = maxDate;
        gantt.render();
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
        <div className="flex-1 relative">
          {(isLoadingOps || isLoadingRes) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading scheduler data...</div>
            </div>
          ) : (
            <div ref={ganttContainer} className="w-full h-full dhtmlx-gantt-container" />
          )}
        </div>
      </Card>
      
      <style>{`
        .dhtmlx-gantt-container {
          width: 100%;
          height: 100%;
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