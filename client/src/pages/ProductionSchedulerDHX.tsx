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
    queryKey: ['/api/scheduler/operations-dhx'],
  });

  // Fetch resources data
  const { data: resourcesData, isLoading: isLoadingRes } = useQuery({
    queryKey: ['/api/scheduler/resources-dhx'],
  });

  // Fetch dependencies data
  const { data: dependenciesData, isLoading: isLoadingDeps } = useQuery({
    queryKey: ['/api/scheduler/dependencies-dhx'],
  });

  // Initialize DHTMLX Gantt with Resource Timeline Extension
  useEffect(() => {
    if (!ganttContainer.current || isInitialized) {
      return;
    }

    console.log('🎯 Initializing DHTMLX Gantt - Resource Timeline Extension');
    
    // Enable the resource panel plugin (Pro feature)
    try {
      // @ts-ignore - Resource panel is a Pro feature that may not be in type definitions
      gantt.plugins({
        resource_panel: true,
        grouping: true
      });
    } catch (error) {
      console.warn('Resource panel plugin not available - trying alternative approach:', error);
    }
    
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
    gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
    gantt.config.duration_unit = "hour";
    gantt.config.work_time = true;
    
    // Enable resource processing
    gantt.config.process_resource_assignments = true;
    gantt.config.resource_store = "resource";
    gantt.config.resource_property = "$resources";
    
    // Configure resource timeline layout
    gantt.config.layout = {
      css: "gantt_container",
      rows: [
        // Main Gantt area (top)
        {
          gravity: 2,
          cols: [
            {
              view: "grid",
              width: 400,
              scrollY: "scrollVer",
              config: gantt.config.columns || []
            },
            { resizer: true, width: 1 },
            {
              view: "timeline",
              scrollX: "scrollHor",
              scrollY: "scrollVer"
            },
            {
              view: "scrollbar",
              id: "scrollVer",
              group: "vertical"
            }
          ]
        },
        { resizer: true, width: 1 },
        // Resource Panel (bottom)
        {
          gravity: 1,
          config: { height: 400 },
          cols: [
            {
              view: "resourceGrid",
              width: 400,
              scrollY: "resourceVScroll",
              bind: "resource",
              config: {
                columns: [
                  {
                    name: "text",
                    label: "Resource Name",
                    tree: false,
                    width: 250
                  },
                  {
                    name: "capacity",
                    label: "Capacity",
                    align: "center",
                    width: 70,
                    template: function(resource: any) {
                      return resource.capacity || "24h";
                    }
                  },
                  {
                    name: "workload",
                    label: "Load %",
                    align: "center",
                    width: 70,
                    template: function(resource: any) {
                      return resource.workload || "0%";
                    }
                  }
                ]
              }
            },
            { resizer: true, width: 1 },
            {
              view: "resourceTimeline",
              scrollX: "scrollHor",
              scrollY: "resourceVScroll",
              bind: "resource"
            },
            {
              view: "scrollbar",
              id: "resourceVScroll",
              group: "vertical"
            }
          ]
        },
        {
          view: "scrollbar",
          id: "scrollHor",
          group: "horizontal"
        }
      ]
    };
    
    // Configure scales
    gantt.config.scales = [
      {
        unit: "day",
        format: "%d %M"
      },
      {
        unit: "hour",
        format: "%H:00"
      }
    ];
    
    // Configure grid columns for main gantt
    gantt.config.columns = [
      {
        name: "text",
        label: "Operation",
        tree: false,
        width: 180
      },
      {
        name: "job_name",
        label: "Job",
        align: "center",
        width: 100,
        template: function(task: any) {
          return task.job_name || "";
        }
      },
      {
        name: "duration",
        label: "Duration",
        align: "center",
        width: 60
      }
    ];
    
    // Configure resource cell rendering
    gantt.templates.resource_cell_value = function(start_date, end_date, resource, tasks) {
      let totalLoad = 0;
      let capacity = resource.capacity || 24;
      
      tasks.forEach(function(task: any) {
        if (task.$resource_assignments) {
          const assignment = task.$resource_assignments.find((a: any) => a.resource_id == resource.id);
          if (assignment) {
            totalLoad += assignment.value || task.duration;
          }
        }
      });
      
      const loadPercent = Math.round((totalLoad / capacity) * 100);
      let cssClass = "resource_normal";
      if (loadPercent > 100) cssClass = "resource_overloaded";
      else if (loadPercent > 80) cssClass = "resource_high_load";
      
      return `<div class="${cssClass}">${loadPercent}%</div>`;
    };
    
    // Configure resource cell styling
    gantt.templates.resource_cell_class = function(start_date, end_date, resource, tasks) {
      let totalLoad = 0;
      let capacity = resource.capacity || 24;
      
      tasks.forEach(function(task: any) {
        if (task.$resource_assignments) {
          const assignment = task.$resource_assignments.find((a: any) => a.resource_id == resource.id);
          if (assignment) {
            totalLoad += assignment.value || task.duration;
          }
        }
      });
      
      const loadPercent = (totalLoad / capacity) * 100;
      if (loadPercent > 100) return "resource_overloaded";
      if (loadPercent > 80) return "resource_high_load";
      return "resource_normal";
    };
    
    // Disable some features for now
    gantt.config.readonly = true;
    gantt.config.drag_links = false;
    gantt.config.drag_move = false;
    gantt.config.drag_resize = false;
    gantt.config.drag_progress = false;

    // Initialize Gantt
    gantt.init(ganttContainer.current);
    console.log('✅ DHTMLX Gantt Resource Timeline initialized');
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      if (ganttContainer.current && gantt) {
        gantt.clearAll();
        setIsInitialized(false);
      }
    };
  }, [ganttContainer.current, isInitialized]);

  // Load data with resource assignments
  useEffect(() => {
    if (!isInitialized || isLoadingOps || isLoadingRes) {
      return;
    }

    // Clear existing data
    gantt.clearAll();
    
    // Create resource datastore
    let resourceStore: any;
    try {
      resourceStore = gantt.createDatastore({
        name: "resource",
        type: "treeDatastore",
        initItem: function(item: any) {
          item.id = item.id || gantt.uid();
          return item;
        }
      });
    } catch (error) {
      console.warn('Could not create resource datastore:', error);
    }
    
    // Prepare resources
    const resources = (Array.isArray(resourcesData) ? resourcesData : []).map((resource: any) => ({
      id: String(resource.id),
      text: resource.name || `Resource ${resource.id}`,
      capacity: resource.available_hours || 24,
      workload: 0,
      parent: null,
      open: true
    }));
    
    // Parse resources to datastore if available
    if (resourceStore) {
      resourceStore.parse(resources);
      console.log('📚 Resource datastore populated:', resources.length);
    }
    
    // Create tasks with resource assignments
    const tasks: any[] = [];
    const resourceAssignmentCount = new Map();
    
    (Array.isArray(operationsData) ? operationsData : []).forEach((op: any) => {
      const resourceId = String(op.resourceId || op.resourceDbId || 1);
      
      // Track assignment distribution
      resourceAssignmentCount.set(resourceId, (resourceAssignmentCount.get(resourceId) || 0) + 1);
      
      const task = {
        id: op.id,
        text: op.name || 'Unnamed Operation',
        start_date: op.scheduledStart ? new Date(op.scheduledStart) : new Date(),
        duration: op.duration || 1,
        progress: op.percentFinished ? op.percentFinished / 100 : 0,
        color: op.color || '#2196F3',
        job_name: op.jobName || 'N/A',
        parent: 0,
        // Resource assignment properties
        $resources: [resourceId],
        $resource_assignments: [
          {
            resource_id: resourceId,
            value: op.duration || 1,
            mode: "hours"
          }
        ]
      };
      
      tasks.push(task);
    });
    
    // Transform dependencies
    const links = (Array.isArray(dependenciesData) ? dependenciesData : []).map((dep: any) => ({
      id: dep.id,
      source: dep.from,
      target: dep.to,
      type: dep.type || "0"
    }));

    console.log('📋 Loading Resource Timeline Data:', {
      resourceCount: resources.length,
      operationsCount: tasks.length,
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

    console.log('✅ Resource Timeline Data loaded');
    console.log('Resources:', resources.length);
    console.log('Operations:', tasks.length);
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

  if (!operationsData || !resourcesData) {
    const resCount = Array.isArray(resourcesData) ? resourcesData.length : 0;
    const opsCount = Array.isArray(operationsData) ? operationsData.length : 0;
    const depsCount = Array.isArray(dependenciesData) ? dependenciesData.length : 0;
    
    console.log('📋 Loading Resource Timeline View:', {
      resourceCount: resCount,
      operationsCount: opsCount,
      totalTasks: resCount + opsCount,
      linksCount: depsCount
    });
  }

  return (
    <div className="h-screen w-full p-4 bg-gray-50">
      <Card className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">DHTMLX Resource Timeline</h1>
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
        
        :global(.gantt_container) {
          width: 100%;
          height: 100%;
        }
        
        :global(.resource_normal) {
          background-color: #66bb6a;
          color: white;
          text-align: center;
          padding: 2px;
        }
        
        :global(.resource_high_load) {
          background-color: #ffa726;
          color: white;
          text-align: center;
          padding: 2px;
        }
        
        :global(.resource_overloaded) {
          background-color: #ff6b6b;
          color: white;
          text-align: center;
          padding: 2px;
        }
        
        :global(.gantt_resource_panel .gantt_grid_data .gantt_row) {
          border-bottom: 1px solid #e0e0e0;
        }
        
        :global(.gantt_resource_task) {
          background: rgba(100, 150, 200, 0.8);
          border: 1px solid #6496c8;
        }
      `}</style>
    </div>
  );
}