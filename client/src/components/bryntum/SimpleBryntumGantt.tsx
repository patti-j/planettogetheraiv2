import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

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
  // Start from August 7, 2025 to show the operations
  const [currentDate, setCurrentDate] = useState(new Date('2025-08-07'));
  const [viewDays] = useState(7); // Show 7 days by default

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - viewDays);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + viewDays);
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';
    
    console.log('SimpleBryntumGantt - Resources:', resources?.length || 0, 'Operations:', operations?.length || 0);
    console.log('Resources details:', JSON.stringify(resources));
    console.log('Operations details:', JSON.stringify(operations));
    
    // Ensure we have valid arrays
    const validResources = Array.isArray(resources) ? resources : [];
    const validOperations = Array.isArray(operations) ? operations : [];
    
    // Calculate date range
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + viewDays);
    
    // Create main wrapper
    const mainWrapper = document.createElement('div');
    mainWrapper.style.display = 'flex';
    mainWrapper.style.flexDirection = 'column';
    mainWrapper.style.height = '600px';
    mainWrapper.style.border = '1px solid #ddd';
    mainWrapper.style.borderRadius = '8px';
    mainWrapper.style.overflow = 'hidden';
    
    // Create navigation controls
    const controls = document.createElement('div');
    controls.style.padding = '12px';
    controls.style.background = '#f8f9fa';
    controls.style.borderBottom = '2px solid #dee2e6';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.alignItems = 'center';
    
    const leftControls = document.createElement('div');
    leftControls.style.display = 'flex';
    leftControls.style.gap = '8px';
    leftControls.style.alignItems = 'center';
    
    const dateRange = document.createElement('div');
    dateRange.style.fontWeight = '600';
    dateRange.style.fontSize = '14px';
    dateRange.style.color = '#212529';
    dateRange.textContent = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    leftControls.appendChild(dateRange);
    controls.appendChild(leftControls);
    
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.gap = '4px';
    controls.appendChild(rightControls);
    
    mainWrapper.appendChild(controls);
    
    // Create gantt content wrapper
    const ganttWrapper = document.createElement('div');
    ganttWrapper.style.display = 'flex';
    ganttWrapper.style.flex = '1';
    ganttWrapper.style.overflow = 'hidden';
    
    // Left pane - Resources
    const resourcePane = document.createElement('div');
    resourcePane.style.minWidth = '250px';
    resourcePane.style.maxWidth = '250px';
    resourcePane.style.borderRight = '2px solid #dee2e6';
    resourcePane.style.background = '#f8f9fa';
    resourcePane.style.display = 'flex';
    resourcePane.style.flexDirection = 'column';
    
    // Resources header
    const resourceHeader = document.createElement('div');
    resourceHeader.style.padding = '12px';
    resourceHeader.style.borderBottom = '1px solid #dee2e6';
    resourceHeader.style.background = '#e9ecef';
    resourceHeader.style.fontWeight = '600';
    resourceHeader.style.fontSize = '13px';
    resourceHeader.style.color = '#495057';
    resourceHeader.textContent = `Resources (${validResources.length})`;
    resourcePane.appendChild(resourceHeader);
    
    // Resources list container
    const resourceList = document.createElement('div');
    resourceList.style.flex = '1';
    resourceList.style.overflowY = 'auto';
    resourceList.style.minHeight = '100%';
    resourcePane.appendChild(resourceList);
    
    // Timeline container
    const timelineContainer = document.createElement('div');
    timelineContainer.style.flex = '1';
    timelineContainer.style.display = 'flex';
    timelineContainer.style.flexDirection = 'column';
    timelineContainer.style.overflow = 'hidden';
    
    // Timeline header
    const timelineHeader = document.createElement('div');
    timelineHeader.style.height = '44px';
    timelineHeader.style.borderBottom = '1px solid #dee2e6';
    timelineHeader.style.background = '#e9ecef';
    timelineHeader.style.overflowX = 'hidden';
    
    const timelineHeaderContent = document.createElement('div');
    timelineHeaderContent.style.display = 'flex';
    timelineHeaderContent.style.minWidth = `${viewDays * 200}px`;
    
    // Generate day columns
    for (let day = 0; day < viewDays; day++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + day);
      
      const dayColumn = document.createElement('div');
      dayColumn.style.width = '200px';
      dayColumn.style.borderRight = '1px solid #dee2e6';
      dayColumn.style.padding = '8px';
      dayColumn.style.textAlign = 'center';
      dayColumn.style.fontSize = '12px';
      dayColumn.style.fontWeight = '500';
      dayColumn.style.color = '#495057';
      
      const isToday = dayDate.toDateString() === new Date().toDateString();
      if (isToday) {
        dayColumn.style.background = '#fff3cd';
        dayColumn.style.color = '#856404';
      }
      
      dayColumn.innerHTML = `
        <div style="font-weight: 600;">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        <div>${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      `;
      timelineHeaderContent.appendChild(dayColumn);
    }
    
    timelineHeader.appendChild(timelineHeaderContent);
    timelineContainer.appendChild(timelineHeader);
    
    // Timeline content with scroll
    const timelineScroll = document.createElement('div');
    timelineScroll.style.flex = '1';
    timelineScroll.style.overflowY = 'auto';
    timelineScroll.style.overflowX = 'auto';
    timelineScroll.style.background = '#ffffff';
    
    const timelineContent = document.createElement('div');
    timelineContent.style.minWidth = `${viewDays * 200}px`;
    timelineContent.style.height = 'auto';
    timelineContent.style.minHeight = '100%';
    
    // Create rows for each resource
    if (validResources.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.padding = '40px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#6c757d';
      emptyMessage.textContent = 'No resources available';
      resourceList.appendChild(emptyMessage);
      timelineContent.appendChild(emptyMessage.cloneNode(true));
    } else {
      console.log('Starting to render resources, count:', validResources.length);
      validResources.forEach((resource, index) => {
        console.log(`Rendering resource ${index + 1}:`, resource.name, resource.id);
        
        // Resource row in left pane
        const resourceRow = document.createElement('div');
        resourceRow.style.padding = '12px';
        resourceRow.style.borderBottom = '1px solid #dee2e6';
        resourceRow.style.height = '60px';
        resourceRow.style.display = 'flex';
        resourceRow.style.alignItems = 'center';
        resourceRow.style.background = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        resourceRow.innerHTML = `
          <div>
            <div style="font-weight: 500; font-size: 13px; color: #212529;">${resource.name || `Resource ${resource.id}`}</div>
            <div style="font-size: 11px; color: #6c757d; margin-top: 2px;">${resource.type || 'Standard'} • ${resource.status || 'Active'}</div>
          </div>
        `;
        resourceList.appendChild(resourceRow);
        
        // Timeline row for this resource
        const timelineRow = document.createElement('div');
        timelineRow.style.height = '60px';
        timelineRow.style.borderBottom = '1px solid #dee2e6';
        timelineRow.style.position = 'relative';
        timelineRow.style.background = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        // Add day grid lines
        for (let day = 0; day < viewDays; day++) {
          const gridLine = document.createElement('div');
          gridLine.style.position = 'absolute';
          gridLine.style.left = `${day * 200}px`;
          gridLine.style.top = '0';
          gridLine.style.width = '1px';
          gridLine.style.height = '100%';
          gridLine.style.background = '#dee2e6';
          timelineRow.appendChild(gridLine);
        }
        
        // Find operations for this resource
        const resourceOps = validOperations.filter(op => 
          op.assignedResourceId === resource.id || 
          op.workCenterId === resource.id ||
          op.resourceId === resource.id
        );
        
        console.log(`Resource ${resource.name} (ID: ${resource.id}) has ${resourceOps.length} operations`);
        console.log(`Resource ${resource.id} operations:`, resourceOps.map(op => ({
          id: op.id,
          name: op.name || op.operationName,
          assignedResourceId: op.assignedResourceId,
          workCenterId: op.workCenterId,
          resourceId: op.resourceId,
          startTime: op.startTime,
          endTime: op.endTime
        })));
        
        // Render operations as bars on timeline
        resourceOps.forEach(op => {
          const opStartTime = op.startTime ? new Date(op.startTime) : null;
          const opEndTime = op.endTime ? new Date(op.endTime) : null;
          
          if (!opStartTime || !opEndTime) {
            console.log(`Skipping operation ${op.id} - missing dates`);
            return;
          }
          
          // Check if operation falls within the current view
          if (opEndTime < startDate || opStartTime > endDate) {
            console.log(`Operation ${op.id} outside view range:`, opStartTime, 'to', opEndTime);
            return;
          }
          
          console.log(`Rendering operation ${op.id} for resource ${resource.id}:`, op.name || op.operationName);
          
          const bar = document.createElement('div');
          bar.style.position = 'absolute';
          bar.style.top = '10px';
          bar.style.height = '40px';
          bar.style.borderRadius = '6px';
          bar.style.padding = '4px 8px';
          bar.style.display = 'flex';
          bar.style.alignItems = 'center';
          bar.style.fontSize = '11px';
          bar.style.fontWeight = '500';
          bar.style.color = 'white';
          bar.style.cursor = 'pointer';
          bar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          bar.style.overflow = 'hidden';
          bar.style.whiteSpace = 'nowrap';
          bar.style.textOverflow = 'ellipsis';
          bar.style.transition = 'transform 0.2s';
          
          // Calculate position based on date
          const daysDiff = (opStartTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const duration = (opEndTime.getTime() - opStartTime.getTime()) / (1000 * 60 * 60 * 24);
          
          const leftPos = Math.max(0, daysDiff * 200);
          const width = Math.max(40, duration * 200);
          
          bar.style.left = `${leftPos}px`;
          bar.style.width = `${width}px`;
          
          // Color based on status
          const status = op.status || 'scheduled';
          if (status === 'completed') {
            bar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          } else if (status === 'in-progress' || status === 'in_progress') {
            bar.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          } else if (status === 'delayed') {
            bar.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
          } else {
            bar.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
          }
          
          // Add hover effect
          bar.onmouseenter = () => {
            bar.style.transform = 'translateY(-2px)';
            bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          };
          bar.onmouseleave = () => {
            bar.style.transform = 'translateY(0)';
            bar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          };
          
          const operationName = op.name || op.operationName || op.operation_name || 'Operation';
          bar.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <div style="font-weight: 600;">${operationName}</div>
              <div style="font-size: 10px; opacity: 0.9;">${opStartTime.toLocaleDateString()} - ${opEndTime.toLocaleDateString()}</div>
            </div>
          `;
          
          bar.title = `${operationName}
Start: ${opStartTime.toLocaleString()}
End: ${opEndTime.toLocaleString()}
Duration: ${duration.toFixed(1)} days
Status: ${status}`;
          
          timelineRow.appendChild(bar);
        });
        
        timelineContent.appendChild(timelineRow);
        console.log(`Added timeline row for resource ${resource.id}`);
      });
      console.log(`Total timeline rows added: ${timelineContent.children.length}`);
    }
    
    timelineScroll.appendChild(timelineContent);
    timelineContainer.appendChild(timelineScroll);
    console.log('Timeline container setup complete');
    
    ganttWrapper.appendChild(resourcePane);
    ganttWrapper.appendChild(timelineContainer);
    mainWrapper.appendChild(ganttWrapper);
    
    // Add status bar
    const statusBar = document.createElement('div');
    statusBar.style.padding = '8px 12px';
    statusBar.style.background = '#f8f9fa';
    statusBar.style.borderTop = '1px solid #dee2e6';
    statusBar.style.fontSize = '12px';
    statusBar.style.color = '#6c757d';
    statusBar.style.display = 'flex';
    statusBar.style.justifyContent = 'space-between';
    
    const totalOps = validOperations.length;
    const assignedOps = validOperations.filter(op => 
      op.assignedResourceId || op.workCenterId || op.resourceId
    ).length;
    
    statusBar.innerHTML = `
      <div>Resources: ${validResources.length} • Operations: ${totalOps} • Assigned: ${assignedOps}</div>
      <div>View: ${viewDays} days</div>
    `;
    
    mainWrapper.appendChild(statusBar);
    container.appendChild(mainWrapper);

  }, [operations, resources, currentDate, viewDays]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Resource Schedule</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={navigatePrevious}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={navigateToday}
              className="gap-1"
            >
              <CalendarDays className="w-4 h-4" />
              Today
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={navigateNext}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export default SimpleBryntumGantt;