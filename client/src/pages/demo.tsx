import { useEffect, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { useQuery } from '@tanstack/react-query';

export default function DemoPage() {
  const schedulerRef = useRef<any>(null);
  const [schedulerData, setSchedulerData] = useState<any>(null);

  // Fetch production orders/jobs
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/production-orders'],
    enabled: true
  });
  
  // Fetch operations
  const { data: operations } = useQuery({
    queryKey: ['/api/operations'],
    enabled: true
  });
  
  // Fetch resources/work centers
  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });
  
  useEffect(() => {
    if (productionOrders && operations && resources) {
      // Map resources to Bryntum format
      const bryntumResources = (resources as any[]).slice(0, 10).map((resource: any) => ({
        id: resource.id,
        name: resource.name,
        eventColor: resource.isDrum ? 'red' : 'blue'
      }));
      
      // Map operations to Bryntum events with job names
      const bryntumEvents = (operations as any[]).map((op: any, index: number) => {
        // Assign operations to production orders for demo purposes
        const orderIndex = Math.floor(index / 3) % (productionOrders as any[]).length;
        const order = (productionOrders as any[])[orderIndex];
        
        const event = {
          id: op.id,
          name: op.operationName || op.name || 'Unknown Operation',
          jobName: order ? `${order.orderNumber} - ${order.name}` : `Operation ${op.id}`,
          startDate: op.startTime || new Date('2025-08-07T08:00:00'),
          endDate: op.endTime || new Date('2025-08-07T12:00:00'),
          status: op.status || 'waiting',
          eventColor: op.status === 'scheduled' || op.status === 'ready' ? 'green' : 
                     op.status === 'in_progress' ? 'blue' : 
                     op.status === 'completed' ? 'gray' : 'orange',
          draggable: true,
          resizable: true
        };
        
        return event;
      });
      
      // Create assignments (map operations to resources)
      const bryntumAssignments = (operations as any[]).map((op: any, index: number) => ({
        id: index + 1,
        eventId: op.id,
        resourceId: op.workCenterId || op.assignedResourceId || (index % bryntumResources.length) + 1
      }));
      
      setSchedulerData({
        resources: bryntumResources,
        events: bryntumEvents,
        assignments: bryntumAssignments
      });
    }
  }, [productionOrders, operations, resources]);
  
  if (!schedulerData) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Production Schedule...</h2>
          <p>Fetching jobs and operations data</p>
        </div>
      </div>
    );
  }
  
  const config = {
    startDate: new Date('2025-08-05'),
    endDate: new Date('2025-08-31'),
    viewPreset: 'weekAndDayLetter',
    rowHeight: 70,
    barMargin: 5,
    eventStyle: 'colored' as const,
    snap: true,
    readOnly: false,
    
    columns: [
      { 
        type: 'resourceInfo' as const,
        text: 'Work Centers / Resources',
        width: 250,
        showEventCount: true,
        showImage: false
      }
    ],
    
    // Use real data from API
    resources: schedulerData.resources,
    events: schedulerData.events,
    assignments: schedulerData.assignments,
    
    // Enable ALL Bryntum Pro features
    features: {
      // Custom event renderer for the event bars
      eventRenderer: {
        renderer: ({ eventRecord, renderData }) => {
          const jobName = eventRecord.jobName || 'Unknown Job';
          const operationName = eventRecord.name || 'Unknown Operation';
          const status = eventRecord.status || 'waiting';
          
          // Status colors matching the screenshot
          const statusColors = {
            ready: '#4CAF50',
            waiting: '#FF9800',
            in_progress: '#2196F3',
            completed: '#9E9E9E',
            planned: '#FFC107',
            scheduled: '#4CAF50'
          };

          const statusColor = statusColors[status] || '#FF9800';
          
          // Override the event content with custom HTML
          renderData.eventContent = `
            <div style="
              height: 100%;
              display: flex;
              flex-direction: column;
              padding: 0;
              font-size: 11px;
              box-sizing: border-box;
              background: white;
              border: 1px solid #ddd;
              border-radius: 2px;
              overflow: hidden;
            ">
              <div style="
                flex: 1;
                padding: 3px 5px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                background: white;
              ">
                <div style="
                  font-weight: bold;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  line-height: 1.2;
                  color: #333;
                  font-size: 11px;
                ">
                  ${jobName}
                </div>
                <div style="
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  line-height: 1.2;
                  font-size: 10px;
                  color: #666;
                  margin-top: 1px;
                ">
                  ${operationName}
                </div>
              </div>
              <div style="
                height: 5px;
                background-color: ${statusColor};
                margin: 0;
              "></div>
            </div>
          `;
          
          return renderData;
        }
      },
      
      // Core drag and drop
      eventDrag: {
        constrainDragToResource: false,
        showTooltip: true
      },
      eventResize: {
        showTooltip: true
      },
      eventDragCreate: true,
      eventDragSelect: true,
      
      // Tooltips
      eventTooltip: {
        // Positioning configuration
        align: 'b-t',
        anchorToTarget: true,
        hideDelay: 100,
        showDelay: 200,
        autoHide: true,
        template: ({ eventRecord }) => `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${eventRecord.jobName || 'Job'}</h4>
            <b>Operation:</b> ${eventRecord.name}<br>
            <b>Status:</b> <span style="color: ${
              eventRecord.status === 'scheduled' || eventRecord.status === 'ready' ? '#4CAF50' : 
              eventRecord.status === 'waiting' ? '#FF9800' :
              eventRecord.status === 'in_progress' ? '#2196F3' : '#666'
            }; font-weight: bold;">${eventRecord.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}</span><br>
            <b>Start:</b> ${eventRecord.startDate ? new Date(eventRecord.startDate).toLocaleString() : 'Not set'}<br>
            <b>End:</b> ${eventRecord.endDate ? new Date(eventRecord.endDate).toLocaleString() : 'Not set'}<br>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
            <em style="font-size: 11px;">Drag to move, resize edges to change duration</em>
          </div>
        `
      },
      eventEdit: {
        editorConfig: {
          title: 'Edit Operation',
          height: 450,
          // Custom fields for editing
          items: {
            generalTab: {
              title: 'General',
              items: {
                jobNameField: {
                  type: 'text',
                  name: 'jobName',
                  label: 'Job Name',
                  weight: 100
                },
                nameField: {
                  type: 'text',
                  name: 'name',
                  label: 'Operation Name',
                  weight: 200
                },
                statusField: {
                  type: 'combo',
                  name: 'status',
                  label: 'Status',
                  weight: 300,
                  items: [
                    { value: 'planned', text: 'Planned' },
                    { value: 'scheduled', text: 'Ready' },
                    { value: 'waiting', text: 'Waiting' },
                    { value: 'in_progress', text: 'In Progress' },
                    { value: 'completed', text: 'Completed' }
                  ]
                }
              }
            }
          }
        }
      },
      
      // Context menus  
      eventMenu: {
        items: {
          editEvent: {
            text: 'Edit Operation',
            icon: 'b-fa-edit',
            weight: 100
          },
          deleteEvent: {
            text: 'Delete Operation',
            icon: 'b-fa-trash',
            weight: 200
          },
          '-': {
            weight: 300
          },
          changeStatus: {
            text: 'Change Status',
            icon: 'b-fa-flag',
            weight: 400,
            menu: [
              { text: 'Planned', icon: 'b-fa-clock' },
              { text: 'Ready', icon: 'b-fa-check-circle' },
              { text: 'Waiting', icon: 'b-fa-pause-circle' },
              { text: 'In Progress', icon: 'b-fa-play-circle' },
              { text: 'Completed', icon: 'b-fa-check-double' }
            ]
          }
        }
      },
      scheduleMenu: {
        items: {
          addEvent: {
            text: 'Add Operation',
            icon: 'b-fa-plus',
            weight: 100
          }
        }
      },
      
      // Timeline and view features
      timeRanges: {
        showCurrentTimeLine: true,
        showHeaderElements: true
      },
      nonWorkingTime: {
        highlightWeekends: true
      },
      
      // Advanced scheduling features
      dependencies: true,
      dependencyEdit: true,
      resourceTimeRanges: true,
      timeAxisHeaderMenu: true,
      columnLines: true,
      rowReorder: true,
      
      // Filter and search
      filter: true,
      search: true,
      
      // Grouping  
      group: false,
      sort: 'name',
      
      // Summary
      summary: {
        renderer: ({ events }) => {
          const statusCounts = {
            planned: 0,
            scheduled: 0,
            waiting: 0,
            in_progress: 0,
            completed: 0
          };
          
          events.forEach((event: any) => {
            const status = event.status || 'waiting';
            if (statusCounts[status] !== undefined) {
              statusCounts[status]++;
            }
          });
          
          return `
            <div style="padding: 5px; font-size: 12px;">
              <b>Status Summary:</b>
              Ready: ${statusCounts.scheduled} | 
              Waiting: ${statusCounts.waiting} | 
              In Progress: ${statusCounts.in_progress} | 
              Completed: ${statusCounts.completed}
            </div>
          `;
        }
      }
    },
    
    // Add toolbar with zoom and navigation controls
    tbar: [
      {
        type: 'button',
        text: 'Zoom In',
        icon: 'b-fa-search-plus',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.zoomIn();
        }
      },
      {
        type: 'button',
        text: 'Zoom Out',
        icon: 'b-fa-search-minus',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.zoomOut();
        }
      },
      {
        type: 'button',
        text: 'Zoom to Fit',
        icon: 'b-fa-expand-arrows-alt',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.zoomToFit();
        }
      },
      '|',
      {
        type: 'button',
        text: 'Previous',
        icon: 'b-fa-angle-left',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.shiftPrevious();
        }
      },
      {
        type: 'button',
        text: 'Today',
        icon: 'b-fa-calendar-day',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.scrollToDate(new Date(), { block: 'center', animate: true });
        }
      },
      {
        type: 'button',
        text: 'Next',
        icon: 'b-fa-angle-right',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          scheduler?.shiftNext();
        }
      },
      '->',
      {
        type: 'button',
        text: 'Refresh Data',
        icon: 'b-fa-sync',
        onAction: () => {
          window.location.reload();
        }
      },
      {
        type: 'button',
        text: 'Add Operation',
        icon: 'b-fa-plus-circle',
        cls: 'b-green',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          const firstResource = schedulerData.resources[0];
          if (firstResource) {
            scheduler?.eventStore.add({
              resourceId: firstResource.id,
              name: 'New Operation',
              jobName: 'Unassigned Job',
              status: 'planned',
              startDate: new Date('2025-08-10T10:00:00'),
              duration: 3,
              durationUnit: 'hour',
              eventColor: 'orange'
            });
          }
        }
      }
    ]
  };
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: '20px',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Production Schedule Gantt</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Jobs and Operations with Status Tracking</p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '10px',
        height: 'calc(100% - 120px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...config}
        />
      </div>
    </div>
  );
}