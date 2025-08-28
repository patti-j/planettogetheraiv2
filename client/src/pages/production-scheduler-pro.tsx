import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

declare global {
  interface Window {
    bryntum: any;
  }
}

const ProductionSchedulerPro: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);

  useEffect(() => {
    // Check if Bryntum is loaded
    const checkBryntum = () => {
      if (window.bryntum && window.bryntum.schedulerpro && containerRef.current) {
        initializeScheduler();
      } else {
        // Retry after a short delay
        setTimeout(checkBryntum, 100);
      }
    };

    const initializeScheduler = () => {
      try {
        const { SchedulerPro, ProjectModel, ResourceModel, EventModel } = window.bryntum.schedulerpro;

        if (!SchedulerPro) {
          console.error('SchedulerPro not found in window.bryntum.schedulerpro');
          return;
        }

        // Sample resources (production lines, machines, workers)
        const resources = [
          { id: 1, name: 'Production Line 1', category: 'Production Line' },
          { id: 2, name: 'Production Line 2', category: 'Production Line' },
          { id: 3, name: 'Assembly Station A', category: 'Assembly' },
          { id: 4, name: 'Assembly Station B', category: 'Assembly' },
          { id: 5, name: 'Quality Check 1', category: 'Quality Control' },
          { id: 6, name: 'Packaging Unit 1', category: 'Packaging' },
          { id: 7, name: 'Packaging Unit 2', category: 'Packaging' },
          { id: 8, name: 'Warehouse Bay 1', category: 'Storage' }
        ];

        // Sample production events/jobs
        const events = [
          {
            id: 1,
            name: 'Order #1001 - Product A',
            startDate: new Date(Date.now() + 1000 * 60 * 60),
            duration: 4,
            durationUnit: 'h',
            resourceId: 1,
            percentDone: 30,
            eventColor: 'blue'
          },
          {
            id: 2,
            name: 'Order #1002 - Product B',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 5),
            duration: 3,
            durationUnit: 'h',
            resourceId: 1,
            percentDone: 0,
            eventColor: 'green'
          },
          {
            id: 3,
            name: 'Order #1003 - Assembly',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
            duration: 2,
            durationUnit: 'h',
            resourceId: 3,
            percentDone: 50,
            eventColor: 'orange'
          },
          {
            id: 4,
            name: 'Order #1004 - Quality Inspection',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
            duration: 1,
            durationUnit: 'h',
            resourceId: 5,
            percentDone: 0,
            eventColor: 'red'
          },
          {
            id: 5,
            name: 'Order #1005 - Packaging',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 6),
            duration: 2,
            durationUnit: 'h',
            resourceId: 6,
            percentDone: 0,
            eventColor: 'purple'
          }
        ];

        // Create the scheduler
        schedulerRef.current = new SchedulerPro({
          appendTo: containerRef.current,
          height: 700,
          
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
          viewPreset: 'hourAndDay',
          
          columns: [
            { text: 'Resource', field: 'name', width: 200 },
            { text: 'Category', field: 'category', width: 150 }
          ],

          features: {
            // Enable various production scheduling features
            dependencies: true,
            dependencyEdit: true,
            eventDrag: true,
            eventDragCreate: true,
            eventEdit: {
              items: {
                generalTab: {
                  items: {
                    name: { label: 'Production Order' },
                    resourceField: { label: 'Assigned Resource' },
                    startDateField: { label: 'Start Time' },
                    endDateField: { label: 'End Time' },
                    percentDoneField: { label: 'Completion %' }
                  }
                }
              }
            },
            eventResize: true,
            eventTooltip: {
              template: (data: any) => `
                <div class="b-sch-event-tooltip">
                  <h3>${data.eventRecord.name}</h3>
                  <p>Start: ${new Date(data.eventRecord.startDate).toLocaleString()}</p>
                  <p>Duration: ${data.eventRecord.duration} ${data.eventRecord.durationUnit}</p>
                  <p>Progress: ${data.eventRecord.percentDone || 0}%</p>
                  <p>Resource: ${data.eventRecord.resource?.name || 'Unassigned'}</p>
                </div>
              `
            },
            percentBar: true,
            resourceNonWorkingTime: true,
            scheduleTooltip: true,
            sort: 'name',
            stripe: true,
            timeRanges: true,
            tree: false
          },

          // Configure the project model with resources and events
          project: {
            resourcesData: resources,
            eventsData: events,
            
            // Enable automatic scheduling
            autoCalculatePercentDoneForParentTasks: true
          },

          // Add custom event renderer for production-specific visualization
          eventRenderer({ eventRecord, renderData }: any) {
            const completionClass = eventRecord.percentDone >= 100 ? 'completed' : 
                                   eventRecord.percentDone > 0 ? 'in-progress' : 'pending';
            
            renderData.cls = `production-event ${completionClass}`;
            
            return eventRecord.name;
          },

          // Configure time axis
          timeAxis: {
            continuous: false
          },

          // Add toolbar with production-specific actions
          tbar: {
            items: [
              {
                type: 'button',
                text: 'Add Production Order',
                icon: 'b-fa b-fa-plus',
                onClick: () => {
                  console.log('Add new production order');
                }
              },
              {
                type: 'button',
                text: 'Optimize Schedule',
                icon: 'b-fa b-fa-magic',
                onClick: () => {
                  console.log('Optimize production schedule');
                }
              },
              {
                type: 'button',
                text: 'Export to PDF',
                icon: 'b-fa b-fa-file-pdf',
                onClick: () => {
                  console.log('Export schedule to PDF');
                }
              }
            ]
          }
        });

        console.log('SchedulerPro initialized successfully');
      } catch (error) {
        console.error('Error initializing SchedulerPro:', error);
      }
    };

    checkBryntum();

    // Cleanup
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.destroy();
        schedulerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Production Scheduler Pro</h1>
        <div className="text-sm text-muted-foreground">
          Powered by Bryntum Scheduler Pro
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div 
            ref={containerRef} 
            className="bryntum-scheduler-container"
            style={{ minHeight: '700px' }}
          />
        </CardContent>
      </Card>

      <style>{`
        .bryntum-scheduler-container {
          font-family: inherit;
        }
        
        .production-event {
          border-radius: 4px;
          padding: 4px;
        }
        
        .production-event.completed {
          opacity: 0.7;
          background-pattern: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0,0,0,.05) 10px,
            rgba(0,0,0,.05) 20px
          );
        }
        
        .production-event.in-progress {
          border-left: 3px solid #fbbf24;
        }
        
        .production-event.pending {
          border-left: 3px solid #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ProductionSchedulerPro;