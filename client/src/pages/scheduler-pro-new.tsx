import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Import Bryntum SchedulerPro styles and scripts

export default function SchedulerProNew() {
  const schedulerRef = useRef<HTMLDivElement>(null);
  const [scheduler, setScheduler] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch PT operations from API
  const { data: ptOperations = [] } = useQuery({
    queryKey: ['/api/pt-operations'],
  });

  // Fetch PT resources from API
  const { data: ptResources = [] } = useQuery({
    queryKey: ['/api/pt-resources'],
  });

  useEffect(() => {
    if (!schedulerRef.current || !(window as any).bryntum) {
      console.error('Bryntum library not loaded or ref not available');
      setError('Scheduler library not loaded');
      setIsLoading(false);
      return;
    }

    const { SchedulerPro } = (window as any).bryntum.schedulerpro;
    
    if (!SchedulerPro) {
      console.error('SchedulerPro not available');
      setError('SchedulerPro not available');
      setIsLoading(false);
      return;
    }

    try {
      // Transform PT resources - exact copy from working HTML
      let resources = (Array.isArray(ptResources) ? ptResources : []).map((resource: any) => ({
        id: `r_${resource.id}`,
        name: resource.name,
        category: resource.category || 'machine',
        originalId: resource.id
      }));

      // Add unscheduled resource at the top
      resources.unshift({
        id: 'unscheduled',
        name: 'Unscheduled Operations',
        category: 'Unscheduled'
      });

      // Create resource lookup maps - exact copy from working HTML
      const resourceMap = new Map();
      const resourceByName = new Map();
      resources.forEach((resource: any) => {
        resourceMap.set(resource.id, resource);
        resourceMap.set(resource.name, resource);
        resourceByName.set(resource.name?.toLowerCase(), resource);
      });

      // Helper function to find resource ID - exact copy from working HTML
      function findResourceId(operation: any) {
        // Try various ways to match the resource
        if (operation.resourceId && resourceMap.has(operation.resourceId)) {
          return operation.resourceId;
        }
        if (operation.resource_id && resourceMap.has(operation.resource_id)) {
          return operation.resource_id;
        }
        
        // Try to match by exact name
        if (operation.resourceName) {
          if (resourceMap.has(operation.resourceName)) {
            return resourceMap.get(operation.resourceName).id;
          }
          
          // Try case-insensitive match
          const lowerName = operation.resourceName.toLowerCase();
          if (resourceByName.has(lowerName)) {
            return resourceByName.get(lowerName).id;
          }
          
          // If resource name exists but not found, create a new resource entry
          if (operation.resourceName !== 'Resource null' && operation.resourceName !== 'Unassigned') {
            const dynamicId = `resource_${operation.resourceName.replace(/\s+/g, '_').toLowerCase()}`;
            
            // Add it to resources if not already there
            if (!resourceMap.has(dynamicId)) {
              const newResource = {
                id: dynamicId,
                name: operation.resourceName,
                category: 'Manufacturing'
              };
              resources.push(newResource);
              resourceMap.set(dynamicId, newResource);
              resourceMap.set(operation.resourceName, newResource);
              resourceByName.set(operation.resourceName.toLowerCase(), newResource);
            }
            return dynamicId;
          }
        }
        
        // Don't fallback to a random resource - return null for unscheduled
        return null;
      }

      // Helper function to assign colors based on operation type
      function getOperationColor(operationName: string) {
        if (!operationName) return '#4a90e2';
        const name = operationName.toLowerCase();
        if (name.includes('milling') || name.includes('machining')) return '#4a90e2';
        if (name.includes('mashing')) return '#f39c12';
        if (name.includes('lautering')) return '#e74c3c';
        if (name.includes('boiling')) return '#e67e22';
        if (name.includes('whirlpool')) return '#9b59b6';
        if (name.includes('cooling')) return '#3498db';
        if (name.includes('fermentation')) return '#27ae60';
        if (name.includes('assembly')) return '#2ecc71';
        if (name.includes('packaging')) return '#f39c12';
        if (name.includes('quality') || name.includes('testing')) return '#8e44ad';
        if (name.includes('maintenance')) return '#95a5a6';
        return '#4a90e2';
      }

      // Transform PT operations into events - Fixed for PT data
      let events = (Array.isArray(ptOperations) ? ptOperations : []).map((operation: any, index: number) => {
        // First try to find a matching resource using the PT resource name
        let resourceId = null;
        
        // Map PT resource to scheduler resource
        if (operation.resourceName && operation.resourceName !== 'Unassigned' && operation.resourceName !== 'Resource null') {
          // Try to find exact match first
          const exactMatch = resources.find(r => r.name === operation.resourceName);
          if (exactMatch) {
            resourceId = exactMatch.id;
          } else {
            // Create dynamic resource ID for PT resources
            resourceId = `r_${operation.resourceId || operation.resource_id}`;
            // Make sure this resource exists in our resources list
            if (!resources.find(r => r.id === resourceId)) {
              resources.push({
                id: resourceId,
                name: operation.resourceName,
                category: 'Manufacturing',
                originalId: operation.resourceId || operation.resource_id
              });
            }
          }
        }
        
        // Check if operation is truly unscheduled (no resource assigned)
        const isUnscheduled = !resourceId;
        
        let startDate;
        
        if (isUnscheduled) {
          // Place unscheduled operations on the unscheduled resource line
          const hoursOffset = (index % 10) * 3;
          const daysOffset = Math.floor(index / 10);
          startDate = new Date(2025, 8, 3 + daysOffset, 8 + hoursOffset);
          resourceId = 'unscheduled';
        } else if (operation.startTime && operation.startTime !== null) {
          // Use the operation's actual scheduled time if it exists
          const originalDate = new Date(operation.startTime);
          startDate = originalDate;
        } else {
          // For unscheduled operations with assigned resources, distribute them across time
          const hoursOffset = (index % 24) * 1; // Spread across 24 hours
          const daysOffset = Math.floor(index / 24);
          startDate = new Date(2025, 8, 10 + daysOffset, 8 + hoursOffset);
        }
        
        const duration = operation.duration ? (operation.duration / 60) : 2;
        
        return {
          id: operation.id,
          name: operation.name || `${operation.jobName || 'Job'}: ${operation.operationName || operation.name || 'Operation'}`,
          startDate: startDate,
          duration: duration,
          durationUnit: 'hour',
          resourceId: resourceId,
          percentDone: operation.percent_done || 0,
          eventColor: isUnscheduled ? '#808080' : (operation.eventColor || getOperationColor(operation.operationName || operation.name)),
          constraintType: (isUnscheduled || !operation.startTime) ? null : 'startnoearlierthan',
          constraintDate: (isUnscheduled || !operation.startTime) ? null : startDate,
          manuallyScheduled: false,
          draggable: true,
          jobName: operation.jobName,
          operationName: operation.operationName || operation.name,
          resourceName: operation.resourceName,
          isUnscheduled: isUnscheduled,
          ptData: operation
        };
      }).filter((event: any) => event.resourceId);

      // Create dependencies array for brewery process sequences
      const dependencies: any[] = [];
      
      // Create dependencies between sequential brewery operations
      const breweryOps = events.filter((event: any) => {
        const opName = (event.operationName || event.name || '').toLowerCase();
        return opName.includes('milling') || 
               opName.includes('mashing') || 
               opName.includes('lautering') || 
               opName.includes('boiling') || 
               opName.includes('whirlpool') || 
               opName.includes('cooling') || 
               opName.includes('fermentation');
      });
      
      // Group operations by job/product to find sequences
      const jobGroups: any = {};
      breweryOps.forEach((op: any) => {
        const jobKey = op.jobName || 'default';
        if (!jobGroups[jobKey]) {
          jobGroups[jobKey] = [];
        }
        jobGroups[jobKey].push(op);
      });
      
      // Define the correct brewery process sequence
      const processSequence = ['milling', 'mashing', 'lautering', 'boiling', 'whirlpool', 'cooling', 'fermentation'];
      
      // Create dependencies for each job's operations
      Object.keys(jobGroups).forEach(jobKey => {
        const jobOps = jobGroups[jobKey];
        
        // Sort operations by their process sequence order
        jobOps.sort((a: any, b: any) => {
          const aName = (a.operationName || a.name || '').toLowerCase();
          const bName = (b.operationName || b.name || '').toLowerCase();
          
          let aIndex = processSequence.findIndex(step => aName.includes(step));
          let bIndex = processSequence.findIndex(step => bName.includes(step));
          
          if (aIndex === -1) aIndex = 999;
          if (bIndex === -1) bIndex = 999;
          
          if (aIndex === bIndex) {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          }
          
          return aIndex - bIndex;
        });
        
        // Create dependencies between sequential operations
        for (let i = 0; i < jobOps.length - 1; i++) {
          const fromOp = jobOps[i];
          const toOp = jobOps[i + 1];
          
          // Only create dependency if operations are on different resources
          if (fromOp.resourceId !== toOp.resourceId) {
            dependencies.push({
              id: `dep_${fromOp.id}_${toOp.id}`,
              from: fromOp.id,
              to: toOp.id,
              type: 2, // Finish-to-Start dependency
              lag: 0,
              lagUnit: 'hour'
            });
          }
        }
      });

      console.log(`Initializing Bryntum with:`, {
        resources: resources.length,
        events: events.length,
        dependencies: dependencies.length
      });

      // Create scheduler instance - exact configuration from working HTML
      const schedulerInstance = new SchedulerPro({
        appendTo: schedulerRef.current,
        
        columns: [
          { text: 'Resource', field: 'name', width: 200 },
          { text: 'Category', field: 'category', width: 150 }
        ],

        viewPreset: 'dayAndWeek',
        rowHeight: 60,
        barMargin: 8,

        // Project configuration for ASAP scheduling
        project: {
          autoLoad: false,
          autoSync: false,
          // Use ASAP scheduling with resource constraints
          schedulingEngine: {
            multiplePerResource: true,
            allowOverlap: false
          }
        },

        features: {
          dependencies: true,
          
          eventDrag: {
            constrainDragToResource: false,
            showTooltip: true
          },
          
          eventTooltip: {
            template: (data: any) => {
              const event = data.eventRecord;
              return `
                <div class="b-sch-event-tooltip">
                  <div><b>${event.name}</b></div>
                  <div>Resource: ${event.resourceName || 'Unassigned'}</div>
                  <div>Start: ${event.startDate?.toLocaleString()}</div>
                  <div>Duration: ${event.duration} ${event.durationUnit}</div>
                  <div>Progress: ${event.percentDone || 0}%</div>
                  ${event.isUnscheduled ? '<div style="color: orange;">⚠️ Unscheduled - Drag to schedule</div>' : ''}
                </div>
              `;
            }
          },
          
          eventEdit: false,
          cellEdit: false,
          taskEdit: false,
          
          timeRanges: {
            showCurrentTimeLine: true
          },
          
          nonWorkingTime: {
            highlightWeekends: false
          }
        },

        startDate: new Date(2025, 7, 31),
        endDate: new Date(2025, 8, 14),

        // Event listeners
        listeners: {
          paint: () => {
            console.log('Scheduler painted successfully');
            setIsLoading(false);
          },
          
          beforeEventDropFinalize: ({ context }: any) => {
            const event = context.eventRecord;
            const newResource = context.newResource;
            
            if (newResource && newResource.id !== 'unscheduled') {
              event.isUnscheduled = false;
              event.eventColor = getOperationColor(event.operationName);
              event.constraintType = 'startnoearlierthan';
              event.constraintDate = event.startDate;
            }
            
            console.log(`Moved ${event.name} to ${newResource?.name}`);
          }
        },

        // Event renderer with custom styling
        eventRenderer: ({ eventRecord, renderData }: any) => {
          renderData.style = `background-color: ${eventRecord.eventColor || '#4a90e2'}`;
          
          if (eventRecord.isUnscheduled) {
            renderData.cls = 'unscheduled-event';
            renderData.style += '; opacity: 0.7; border: 2px dashed #666;';
          }
          
          return eventRecord.name;
        }
      });

      // Load data into the scheduler
      schedulerInstance.project.loadInlineData({
        resourcesData: resources,
        eventsData: events,
        dependenciesData: dependencies
      });

      console.log('Scheduler initialized with inline data');
      
      setScheduler(schedulerInstance);

    } catch (err) {
      console.error('Error initializing scheduler:', err);
      setError('Failed to initialize scheduler');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (scheduler) {
        scheduler.destroy();
      }
    };
  }, [ptOperations, ptResources]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          <p className="text-xl font-semibold">Error Loading Scheduler</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-background">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading Scheduler...</p>
          </div>
        </div>
      )}
      
      <div
        ref={schedulerRef}
        className="h-full w-full scheduler-container"
        style={{ minHeight: '600px' }}
      />
      
      <style>{`
        /* Import Bryntum styles */
        @import url('/bryntum/schedulerpro.stockholm.css');
        
        /* Custom styling to override purple theme */
        .scheduler-container {
          --b-primary-color: #4a90e2;
          --b-primary-color-light: #6ba3e7;
          --b-primary-color-dark: #3a7bc8;
        }
        
        .b-sch-event {
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .b-sch-event-selected {
          box-shadow: 0 0 0 2px #4a90e2;
        }
        
        .unscheduled-event {
          pattern: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.1) 10px,
            rgba(0, 0, 0, 0.1) 20px
          );
        }
        
        .b-grid-header {
          background: #f8f9fa;
        }
        
        .b-sch-timeaxis-cell {
          border-color: #e0e0e0;
        }
        
        .b-weekend {
          background: rgba(0, 0, 0, 0.03);
        }
      `}</style>
    </div>
  );
}