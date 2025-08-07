import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'png' | 'svg';
  orientation?: 'portrait' | 'landscape';
  includeHeaders?: boolean;
  includeTimeline?: boolean;
  includeResourceList?: boolean;
  dateRange?: { start: Date; end: Date };
  selectedResources?: number[];
}

export class GanttExportUtility {
  static async exportToPDF(
    ganttElement: HTMLElement,
    title: string = 'Production Schedule',
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const {
      orientation = 'landscape',
      includeHeaders = true,
      includeTimeline = true,
      includeResourceList = true
    } = options;

    try {
      // Create a copy of the element to avoid modifying the original
      const clonedElement = ganttElement.cloneNode(true) as HTMLElement;
      document.body.appendChild(clonedElement);
      
      // Apply export-specific styles
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.width = orientation === 'landscape' ? '1920px' : '1080px';
      clonedElement.style.height = 'auto';
      
      // Hide elements not needed in export
      if (!includeResourceList) {
        const resourceList = clonedElement.querySelector('.resource-list');
        if (resourceList) (resourceList as HTMLElement).style.display = 'none';
      }
      
      // Capture the element as canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove cloned element
      document.body.removeChild(clonedElement);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = orientation === 'landscape' ? 297 : 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title
      if (includeHeaders) {
        pdf.setFontSize(16);
        pdf.text(title, 10, 10);
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 18);
      }
      
      // Add the canvas image
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, includeHeaders ? 25 : 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  }

  static async exportToExcel(
    jobs: any[],
    operations: any[],
    resources: any[],
    title: string = 'Production Schedule',
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const { dateRange, selectedResources } = options;
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Filter data based on options
      let filteredOperations = operations;
      if (dateRange) {
        filteredOperations = operations.filter(op => {
          if (!op.startTime) return false;
          const opStart = new Date(op.startTime);
          return opStart >= dateRange.start && opStart <= dateRange.end;
        });
      }
      if (selectedResources && selectedResources.length > 0) {
        filteredOperations = filteredOperations.filter(op => 
          selectedResources.includes(op.workCenterId)
        );
      }
      
      // Create operations sheet
      const operationsData = filteredOperations.map(op => ({
        'Operation ID': op.id,
        'Operation Name': op.name,
        'Job ID': op.discreteJobId,
        'Job Name': jobs.find(j => j.id === op.discreteJobId)?.name || '',
        'Resource': resources.find(r => r.id === op.workCenterId)?.name || '',
        'Start Time': op.startTime ? new Date(op.startTime).toLocaleString() : '',
        'End Time': op.endTime ? new Date(op.endTime).toLocaleString() : '',
        'Duration (hours)': op.startTime && op.endTime ? 
          ((new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2) : '',
        'Status': op.status || 'scheduled',
        'Progress (%)': op.completionPercentage || 0,
        'Setup Time': op.setupTime || 0,
        'Process Time': op.processTime || 0,
        'Sequence': op.sequence || 0
      }));
      
      const operationsSheet = XLSX.utils.json_to_sheet(operationsData);
      XLSX.utils.book_append_sheet(workbook, operationsSheet, 'Operations');
      
      // Create jobs sheet
      const jobsData = jobs.map(job => ({
        'Job ID': job.id,
        'Job Name': job.name,
        'Customer': job.customerId || '',
        'Start Date': job.startDate ? new Date(job.startDate).toLocaleDateString() : '',
        'End Date': job.endDate ? new Date(job.endDate).toLocaleDateString() : '',
        'Priority': job.priority || 'medium',
        'Status': job.status || 'scheduled',
        'Quantity': job.quantity || 0,
        'Item': job.itemId || ''
      }));
      
      const jobsSheet = XLSX.utils.json_to_sheet(jobsData);
      XLSX.utils.book_append_sheet(workbook, jobsSheet, 'Jobs');
      
      // Create resources sheet
      const resourcesData = resources.map(res => {
        const resOps = filteredOperations.filter(op => op.workCenterId === res.id);
        const totalHours = resOps.reduce((sum, op) => {
          if (op.startTime && op.endTime) {
            return sum + (new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60);
          }
          return sum;
        }, 0);
        
        return {
          'Resource ID': res.id,
          'Resource Name': res.name,
          'Type': res.type || '',
          'Department': res.departmentId || '',
          'Efficiency (%)': res.efficiency || 100,
          'Total Operations': resOps.length,
          'Total Hours': totalHours.toFixed(2),
          'Utilization (%)': ((totalHours / 40) * 100).toFixed(1) // Assuming 40-hour work week
        };
      });
      
      const resourcesSheet = XLSX.utils.json_to_sheet(resourcesData);
      XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources');
      
      // Create summary sheet
      const summaryData = [{
        'Report Title': title,
        'Generated Date': new Date().toLocaleString(),
        'Total Jobs': jobs.length,
        'Total Operations': filteredOperations.length,
        'Total Resources': resources.length,
        'Date Range': dateRange ? 
          `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}` : 'All dates',
        'Completed Operations': filteredOperations.filter(op => op.status === 'completed').length,
        'In Progress Operations': filteredOperations.filter(op => op.status === 'in-progress').length,
        'Scheduled Operations': filteredOperations.filter(op => op.status === 'scheduled').length,
        'Delayed Operations': filteredOperations.filter(op => op.status === 'delayed').length
      }];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Save the workbook
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      throw error;
    }
  }

  static async exportToPNG(
    ganttElement: HTMLElement,
    title: string = 'Production Schedule'
  ): Promise<void> {
    try {
      const canvas = await html2canvas(ganttElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to export PNG:', error);
      throw error;
    }
  }

  static printGantt(ganttElement: HTMLElement, title: string = 'Production Schedule'): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }
    
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${ganttElement.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}