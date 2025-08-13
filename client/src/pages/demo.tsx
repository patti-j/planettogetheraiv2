import React, { useRef, useEffect, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.material.css';
import { useQuery } from '@tanstack/react-query';

export default function DemoPage() {
  const schedulerRef = useRef<any>(null);
  const [schedulerData, setSchedulerData] = useState<any>(null);
  
  // Fetch production orders
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/production-orders'],
    enabled: true
  });
  
  // Fetch discrete operations  
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
      const bryntumResources = resources.slice(0, 10).map((resource: any) => ({
        id: resource.id,
        name: resource.name,
        eventColor: resource.isDrum ? 'red' : 'blue'
      }));
      
      // Map operations to Bryntum events
      const bryntumEvents = operations.map((op: any) => {
        // Find the related production order
        const order = productionOrders.find((po: any) => po.id === op.productionOrderId);
        
        return {
          id: op.id,
          name: op.operationName || op.name,
          jobName: order ? order.name : `Order ${op.productionOrderId || ''}`,
          startDate: op.startTime || new Date('2025-08-07T08:00:00'),
          endDate: op.endTime || new Date('2025-08-07T12:00:00'),
          status: op.status || 'waiting',
          eventColor: op.status === 'scheduled' || op.status === 'ready' ? 'green' : 
                     op.status === 'in_progress' ? 'blue' : 
                     op.status === 'completed' ? 'gray' : 'orange',
          draggable: true,
          resizable: true
        };
      });
      
      // Create assignments (map operations to resources)
      const bryntumAssignments = operations.map((op: any, index: number) => ({
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
    
    // Use eventBodyTemplate for custom event display (safer than eventRenderer)
    eventBodyTemplate: (data) => {
      const jobName = data.jobName || 'Unknown Job';
      const operationName = data.name || 'Unknown Operation';
      const status = data.status || 'waiting';
      
      // Status colors
      const statusColors = {
        ready: '#4CAF50',
        waiting: '#FF9800',  
        in_progress: '#2196F3',
        completed: '#9E9E9E',
        planned: '#FFC107',
        scheduled: '#4CAF50'
      };

      const statusColor = statusColors[status] || '#FF9800';
      const statusText = status === 'scheduled' ? 'ready' : status.replace('_', ' ');
      
      return `
        <div style="
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2px 4px;
          font-size: 11px;
          box-sizing: border-box;
        ">
          <div>
            <div style="
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.2;
              color: #333;
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
            background-color: ${statusColor};
            color: white;
            padding: 1px 4px;
            border-radius: 2px;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
            margin-top: 2px;
          ">
            ${statusText}
          </div>
        </div>
      `;
    },
    
    columns: [
      { 
        type: 'resourceInfo',
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
      
      // Tooltips and editing
      eventTooltip: {
        // Ensure tooltip appears near mouse cursor
        align: 'b-t',
        anchorToTarget: true,
        trackMouse: false,
        hideDelay: 100,
        showDelay: 300,
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
            onItem: ({ eventRecord }) => {
              const scheduler = schedulerRef.current?.instance;
              scheduler?.editEvent(eventRecord);
            }
          },
          changeStatus: {
            text: 'Change Status',
            icon: 'b-fa-flag',
            menu: [
              {
                text: 'Ready',
                onItem: ({ eventRecord }) => {
                  eventRecord.status = 'scheduled';
                  eventRecord.eventColor = 'green';
                }
              },
              {
                text: 'Waiting',
                onItem: ({ eventRecord }) => {
                  eventRecord.status = 'waiting';
                  eventRecord.eventColor = 'orange';
                }
              },
              {
                text: 'In Progress',
                onItem: ({ eventRecord }) => {
                  eventRecord.status = 'in_progress';
                  eventRecord.eventColor = 'blue';
                }
              },
              {
                text: 'Completed',
                onItem: ({ eventRecord }) => {
                  eventRecord.status = 'completed';
                  eventRecord.eventColor = 'gray';
                }
              }
            ]
          },
          deleteEvent: {
            text: 'Delete Operation',
            icon: 'b-fa-trash',
            onItem: ({ eventRecord }) => eventRecord.remove()
          }
        }
      },
      scheduleMenu: {
        items: {
          addEvent: {
            text: 'Add new operation here',
            icon: 'b-fa-plus',
            onItem: ({ resourceRecord, date }) => {
              resourceRecord.events.add({
                name: 'New Operation',
                jobName: 'Unassigned Job',
                status: 'planned',
                startDate: date,
                duration: 4,
                durationUnit: 'hour',
                eventColor: 'orange'
              });
            }
          }
        }
      },
      
      // Time navigation
      headerZoom: true,
      zoomOnMouseWheel: true,
      pan: true,
      
      // Visual features
      timeRanges: true,
      nonWorkingTime: true,
      columnLines: true,
      dependencies: true,
      dependencyEdit: true,
      
      // Data management
      eventFilter: true,
      sort: true,
      summary: true,
      
      // Additional Pro features
      resourceTimeRanges: true,
      percentBar: false,
      labels: {
        left: {
          field: 'jobName',
          editor: false
        }
      }
    },
    
    // Add toolbar with controls
    tbar: {
      items: [
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
          style: 'background: #4CAF50; color: white;',
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
    }
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