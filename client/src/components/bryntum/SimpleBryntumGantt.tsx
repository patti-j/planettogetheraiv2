import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleBryntumGanttProps {
  operations: any[];
  resources: any[];
  className?: string;
}

export function SimpleBryntumGantt({ 
  operations, 
  resources, 
  className = '' 
}: SimpleBryntumGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';
    
    // Create a resource-based Gantt visualization
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.height = '500px';
    wrapper.style.overflow = 'auto';
    wrapper.style.border = '1px solid #ddd';
    
    // Left pane - Resources
    const resourcePane = document.createElement('div');
    resourcePane.style.minWidth = '200px';
    resourcePane.style.borderRight = '2px solid #333';
    resourcePane.style.background = '#f5f5f5';
    
    // Resources header
    const resourceHeader = document.createElement('div');
    resourceHeader.style.padding = '10px';
    resourceHeader.style.borderBottom = '1px solid #ddd';
    resourceHeader.style.background = '#e0e0e0';
    resourceHeader.style.fontWeight = 'bold';
    resourceHeader.textContent = 'Resources';
    resourcePane.appendChild(resourceHeader);
    
    // Timeline header (hours/days)
    const timelineWrapper = document.createElement('div');
    timelineWrapper.style.flex = '1';
    timelineWrapper.style.position = 'relative';
    timelineWrapper.style.overflowX = 'auto';
    
    const timelineHeader = document.createElement('div');
    timelineHeader.style.height = '43px';
    timelineHeader.style.borderBottom = '1px solid #ddd';
    timelineHeader.style.background = '#e0e0e0';
    timelineHeader.style.display = 'flex';
    timelineHeader.style.minWidth = '2000px';
    
    // Generate time slots (24 hours for simplicity)
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.style.width = '80px';
      timeSlot.style.borderRight = '1px solid #ccc';
      timeSlot.style.padding = '10px 5px';
      timeSlot.style.textAlign = 'center';
      timeSlot.style.fontSize = '12px';
      timeSlot.textContent = `${hour}:00`;
      timelineHeader.appendChild(timeSlot);
    }
    timelineWrapper.appendChild(timelineHeader);
    
    const timelineContent = document.createElement('div');
    timelineContent.style.position = 'relative';
    timelineContent.style.minWidth = '2000px';
    
    // Create rows for each resource
    resources.forEach((resource, index) => {
      // Resource row in left pane
      const resourceRow = document.createElement('div');
      resourceRow.style.padding = '15px 10px';
      resourceRow.style.borderBottom = '1px solid #ddd';
      resourceRow.style.height = '50px';
      resourceRow.style.display = 'flex';
      resourceRow.style.alignItems = 'center';
      resourceRow.innerHTML = `
        <div>
          <div style="font-weight: 500;">${resource.name || `Resource ${resource.id}`}</div>
          <div style="font-size: 11px; color: #666;">${resource.type || 'Standard'}</div>
        </div>
      `;
      resourcePane.appendChild(resourceRow);
      
      // Timeline row for this resource
      const timelineRow = document.createElement('div');
      timelineRow.style.height = '50px';
      timelineRow.style.borderBottom = '1px solid #ddd';
      timelineRow.style.position = 'relative';
      timelineRow.style.background = index % 2 === 0 ? '#fff' : '#fafafa';
      
      // Add grid lines
      for (let hour = 0; hour < 24; hour++) {
        const gridLine = document.createElement('div');
        gridLine.style.position = 'absolute';
        gridLine.style.left = `${hour * 80}px`;
        gridLine.style.top = '0';
        gridLine.style.width = '1px';
        gridLine.style.height = '100%';
        gridLine.style.background = '#e0e0e0';
        timelineRow.appendChild(gridLine);
      }
      
      // Find operations for this resource
      const resourceOps = operations.filter(op => 
        op.assignedResourceId === resource.id || op.workCenterId === resource.id
      );
      
      // Render operations as bars on timeline
      resourceOps.forEach(op => {
        const bar = document.createElement('div');
        bar.style.position = 'absolute';
        bar.style.top = '10px';
        bar.style.height = '30px';
        bar.style.borderRadius = '4px';
        bar.style.padding = '0 8px';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.fontSize = '12px';
        bar.style.color = 'white';
        bar.style.cursor = 'pointer';
        bar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        bar.style.overflow = 'hidden';
        bar.style.whiteSpace = 'nowrap';
        bar.style.textOverflow = 'ellipsis';
        
        // Calculate position based on time
        const startTime = op.startTime ? new Date(op.startTime) : new Date();
        const endTime = op.endTime ? new Date(op.endTime) : new Date(startTime.getTime() + 3600000);
        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        const duration = (endTime.getTime() - startTime.getTime()) / 3600000; // in hours
        
        bar.style.left = `${startHour * 80}px`;
        bar.style.width = `${Math.max(duration * 80, 40)}px`;
        
        // Color based on status
        if (op.status === 'completed') {
          bar.style.background = '#22c55e';
        } else if (op.status === 'in-progress') {
          bar.style.background = '#3b82f6';
        } else {
          bar.style.background = '#9ca3af';
        }
        
        bar.textContent = op.name || op.operationName || 'Operation';
        bar.title = `${op.name || op.operationName}\nStart: ${startTime.toLocaleString()}\nEnd: ${endTime.toLocaleString()}\nStatus: ${op.status || 'scheduled'}`;
        
        timelineRow.appendChild(bar);
      });
      
      timelineContent.appendChild(timelineRow);
    });
    
    timelineWrapper.appendChild(timelineContent);
    wrapper.appendChild(resourcePane);
    wrapper.appendChild(timelineWrapper);
    container.appendChild(wrapper);
    
    // Add notice
    const notice = document.createElement('div');
    notice.style.marginTop = '20px';
    notice.style.padding = '12px';
    notice.style.background = '#d1fae5';
    notice.style.border = '1px solid #34d399';
    notice.style.borderRadius = '4px';
    notice.innerHTML = `
      <strong>Resource-Based Gantt View:</strong> Resources are shown in the left pane, with their assigned operations displayed on the timeline. This is a simplified visualization while we configure the full Bryntum Gantt functionality.
    `;
    container.appendChild(notice);

  }, [operations, resources]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}