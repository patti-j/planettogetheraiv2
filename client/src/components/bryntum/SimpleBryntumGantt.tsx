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
  const ganttRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Simple fallback Gantt visualization if Bryntum fails
    const container = containerRef.current;
    container.innerHTML = '';
    
    // Create a simple table-based Gantt visualization
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background: #f5f5f5;">Operation</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background: #f5f5f5;">Resource</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background: #f5f5f5;">Start Time</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background: #f5f5f5;">End Time</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background: #f5f5f5;">Status</th>
    `;
    table.appendChild(headerRow);
    
    // Data rows
    operations.forEach(op => {
      const row = document.createElement('tr');
      const resource = resources.find(r => r.id === (op.assignedResourceId || op.workCenterId));
      const startTime = op.startTime ? new Date(op.startTime).toLocaleString() : 'Not scheduled';
      const endTime = op.endTime ? new Date(op.endTime).toLocaleString() : 'Not scheduled';
      
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px;">${op.name || op.operationName || 'Unknown'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${resource?.name || 'Unassigned'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${startTime}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${endTime}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <span style="
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            background: ${op.status === 'completed' ? '#22c55e' : op.status === 'in-progress' ? '#3b82f6' : '#9ca3af'};
            color: white;
          ">${op.status || 'scheduled'}</span>
        </td>
      `;
      table.appendChild(row);
    });
    
    container.appendChild(table);
    
    // Add a notice about Bryntum
    const notice = document.createElement('div');
    notice.style.marginTop = '20px';
    notice.style.padding = '12px';
    notice.style.background = '#fef3c7';
    notice.style.border = '1px solid #fcd34d';
    notice.style.borderRadius = '4px';
    notice.innerHTML = `
      <strong>Note:</strong> This is a simplified view. The full Bryntum Gantt chart with drag-and-drop functionality is currently being configured.
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