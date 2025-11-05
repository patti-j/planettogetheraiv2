import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePowerBIAuth, usePowerBIWorkspaces, usePowerBIDatasets, usePowerBIDataset, usePowerBIDatasetTables } from "@/hooks/use-powerbi-api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { FileText, Search, Download, Calendar, Database, Columns3, X, RefreshCw, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, Filter, Check, BarChart3, GripVertical, Settings, FileInput, FileOutput } from "lucide-react";
import { format } from "date-fns";

interface SQLTable {
  tableName: string;
  schemaName: string;
}

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  maxLength: number | null;
}

interface PaginatedReportData {
  items: Array<Record<string, any>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type SourceType = "sql" | "powerbi";

export default function PaginatedReports() {
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [selectedTable, setSelectedTable] = useState<SQLTable | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedPowerBITable, setSelectedPowerBITable] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Column Chooser Dialog
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [hiddenColumnsSearch, setHiddenColumnsSearch] = useState("");
  const [shownColumnsSearch, setShownColumnsSearch] = useState("");
  const [selectedHiddenColumns, setSelectedHiddenColumns] = useState<string[]>([]);
  const [selectedShownColumns, setSelectedShownColumns] = useState<string[]>([]);
  
  // Export settings
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("excel");
  const [exportHeader, setExportHeader] = useState("");
  const [exportFooter, setExportFooter] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  
  // Column ordering
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isDraggingColumn, setIsDraggingColumn] = useState<string | null>(null);

  // Power BI authentication
  const { isAuthenticated, authenticateAuto } = usePowerBIAuth();

  // Auto-authenticate when Power BI is selected
  useEffect(() => {
    if (sourceType === 'powerbi' && !isAuthenticated) {
      authenticateAuto().catch(console.error);
    }
  }, [sourceType, isAuthenticated, authenticateAuto]);

  // Fetch list of SQL Server tables (only when SQL source is selected)
  const { data: tables, isLoading: loadingTables } = useQuery<SQLTable[]>({
    queryKey: ['/api/sql-tables'],
    enabled: sourceType === 'sql',
  });

  // Fetch Power BI workspaces (only when Power BI source is selected)
  const { data: powerbiWorkspaces, isLoading: loadingWorkspaces } = usePowerBIWorkspaces(
    sourceType === 'powerbi' && isAuthenticated
  );

  // Fetch Power BI datasets (only when workspace is selected)
  const { data: powerbiDatasets, isLoading: loadingDatasets } = usePowerBIDatasets(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId
  );

  // Fetch Power BI dataset details (only when dataset is selected)
  const { data: datasetDetails, isLoading: loadingDatasetDetails } = usePowerBIDataset(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId,
    selectedDatasetId
  );

  // Fetch Power BI dataset tables (only when dataset is selected)
  const { data: datasetTables, isLoading: loadingDatasetTables } = usePowerBIDatasetTables(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId,
    selectedDatasetId
  );

  // Fetch table schema based on source type
  const { data: tableSchema, isLoading: loadingSchema, error: schemaError } = useQuery<TableColumn[]>({
    queryKey: (() => {
      if (sourceType === 'sql' && selectedTable) {
        return [`/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`];
      } else if (sourceType === 'powerbi' && selectedPowerBITable && datasetTables) {
        // For Power BI, we'll extract columns from the tables data
        const table = datasetTables.find((t: any) => t.name === selectedPowerBITable);
        return table?.columns ? [`powerbi-columns`, workspaceId, selectedDatasetId, selectedPowerBITable] : [];
      }
      return [];
    })(),
    queryFn: async () => {
      if (sourceType === 'sql' && selectedTable) {
        // Use apiRequest to include authentication headers for SQL
        const { apiRequest } = await import('@/lib/queryClient');
        const response = await apiRequest('GET', `/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`);
        return response.json();
      } else if (sourceType === 'powerbi' && selectedPowerBITable && datasetTables) {
        // For Power BI, transform columns to match SQL schema format
        const table = datasetTables.find((t: any) => t.name === selectedPowerBITable);
        if (table?.columns) {
          return table.columns.map((col: any) => ({
            columnName: col.name,
            dataType: col.dataType || 'Unknown',
            isNullable: 'YES',
            maxLength: null
          }));
        }
      }
      return [];
    },
    enabled: (!!selectedTable || !!selectedPowerBITable),
  });

  // Fetch paginated data
  const paginatedDataUrl = (() => {
    if (sourceType === 'sql' && selectedTable) {
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        sortBy,
        sortOrder,
      });
      return `/api/paginated-reports?${params}`;
    } else if (sourceType === 'powerbi' && selectedPowerBITable && workspaceId && selectedDatasetId) {
      const params = new URLSearchParams({
        workspaceId,
        datasetId: selectedDatasetId,
        table: selectedPowerBITable,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        sortBy,
        sortOrder,
      });
      return `/api/powerbi/dataset-data?${params}`;
    }
    return null;
  })();

  const { data, isLoading, error } = useQuery<PaginatedReportData>({
    queryKey: paginatedDataUrl ? [paginatedDataUrl] : [],
    enabled: (!!selectedTable || !!selectedPowerBITable) && !!paginatedDataUrl,
  });

  // Update selected columns when table schema loads
  // Removed - this is handled by the other useEffect below

  const handleSourceTypeChange = (type: SourceType) => {
    setSourceType(type);
    setWorkspaceName("");
    setWorkspaceId("");
    setSelectedTable(null);
    setSelectedDatasetId("");
    setSelectedPowerBITable("");
    setCurrentPage(1);
    setSortBy("");
    setSearchTerm("");
    setColumnFilters({});
  };

  const handleWorkspaceChange = (value: string) => {
    // Value is the workspace name, find the corresponding ID
    const workspace = powerbiWorkspaces?.find(w => w.name === value);
    if (workspace) {
      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);
    }
    setSelectedDatasetId("");
    setSelectedPowerBITable("");
    setSelectedTable(null);
    setCurrentPage(1);
  };

  const handleTableSelect = (value: string) => {
    const [schemaName, tableName] = value.split('.');
    setSelectedTable({ schemaName, tableName });
    setCurrentPage(1);
    setSortBy("");
    setSearchTerm("");
    setColumnFilters({});
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const handleSelectAllColumns = () => {
    if (tableSchema) {
      setSelectedColumns(tableSchema.map(col => col.columnName));
    }
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleColumnFilterChange = (columnName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
  };

  // Handle column reordering
  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [movedColumn] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedColumn);
    setColumnOrder(newOrder);
  };

  // Filter data locally based on column filters
  const filteredData = data?.items.filter(item => {
    return Object.entries(columnFilters).every(([column, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = item[column];
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    });
  }) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
  };

  // Initialize column order when schema is loaded
  useEffect(() => {
    if (tableSchema && tableSchema.length > 0) {
      const allColumns = tableSchema.map(col => col.columnName);
      
      // Initialize columnOrder with all columns if it's empty
      if (columnOrder.length === 0) {
        setColumnOrder(allColumns);
        setSelectedColumns(allColumns);
      } else {
        // Ensure columnOrder contains all new columns
        const newColumns = allColumns.filter(col => !columnOrder.includes(col));
        if (newColumns.length > 0) {
          setColumnOrder(prev => [...prev, ...newColumns]);
        }
      }
    }
  }, [tableSchema]);

  // Reorder columns
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [movedColumn] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedColumn);
    setColumnOrder(newOrder);
  };

  // Export handler
  const handleExport = async () => {
    if (!data?.total || data.total === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "default"
      });
      setShowExportDialog(false);
      return;
    }

    // Export columns in the order they appear in columnOrder, but ensure all selected columns are included
    const columnsToExport = selectedColumns.filter(col => columnOrder.includes(col));
    // Also add any selected columns that might not be in columnOrder (edge case)
    const missingColumns = selectedColumns.filter(col => !columnOrder.includes(col));
    if (missingColumns.length > 0) {
      console.warn('Some columns were not in columnOrder:', missingColumns);
      columnsToExport.push(...missingColumns);
    }
    
    // Fetch ALL data for export (without pagination)
    let allData: any[] = [];
    
    console.log('Export initiated:', {
      totalRows: data?.total,
      currentPageSize: data?.items?.length,
      selectedColumns: columnsToExport.length,
      format: exportFormat
    });
    
    try {
      // Build URL for fetching all data
      let exportUrl = "";
      if (sourceType === 'sql' && selectedTable) {
        exportUrl = `/api/paginated-reports?schemaName=${encodeURIComponent(selectedTable.schemaName)}&tableName=${encodeURIComponent(selectedTable.tableName)}&page=1&pageSize=999999`; // Large pageSize to get all data
      } else if (sourceType === 'powerbi' && selectedPowerBITable && selectedDatasetId) {
        exportUrl = `/api/paginated-reports/powerbi?datasetId=${encodeURIComponent(selectedDatasetId)}&tableName=${encodeURIComponent(selectedPowerBITable)}&page=1&pageSize=999999`;
      }
      
      console.log('Fetching all data from:', exportUrl);
      
      if (exportUrl) {
        // Fetch all data for export
        const response = await fetch(exportUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch export data: ${response.status} ${response.statusText}`);
        }
        
        const exportResult = await response.json() as PaginatedReportData;
        allData = exportResult.items || [];
        
        console.log('Export data fetched:', {
          totalRowsFetched: allData.length,
          expectedRows: exportResult.total,
          pagesReturned: Math.ceil(allData.length / 10)
        });
        
        if (allData.length !== exportResult.total) {
          console.warn(`Data mismatch: Expected ${exportResult.total} rows but got ${allData.length} rows`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch all data for export:', error);
      // Fall back to using current page data if fetch fails
      allData = data?.items || [];
      toast({
        title: "Export Warning",
        description: "Could not fetch all data. Exporting current page only.",
        variant: "destructive"
      });
    }
    
    // Apply column filters to the exported data
    const filteredExportData = allData.filter(item => {
      return Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = item[column];
        if (cellValue === null || cellValue === undefined) return false;
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
    
    // Prepare export data with ordered columns
    const exportData = filteredExportData.map(row => {
      const orderedRow: any = {};
      columnsToExport.forEach(col => {
        orderedRow[col] = row[col];
      });
      return orderedRow;
    });

    // Add header and footer
    const exportContent = {
      header: exportHeader,
      footer: exportFooter,
      timestamp: includeTimestamp ? new Date().toLocaleString() : null,
      tableName: sourceType === 'sql' 
        ? `${selectedTable?.schemaName}.${selectedTable?.tableName}`
        : selectedPowerBITable,
      data: exportData,
      columns: columnsToExport
    };

    // Convert to desired format
    const tableName = exportContent.tableName?.replace(/[^a-zA-Z0-9]/g, '_') || 'report';
    const dateStamp = new Date().toISOString().split('T')[0];
    
    if (exportFormat === 'csv') {
      const csv = convertToCSV(exportContent);
      const fileName = `${tableName}_${dateStamp}.csv`;
      downloadFile(csv, fileName, 'text/csv');
      toast({
        title: "Export Successful",
        description: `Your report has been exported as CSV`,
        variant: "default"
      });
    } else if (exportFormat === 'excel') {
      await exportToExcel(exportContent, `${tableName}_${dateStamp}.xlsx`);
    } else if (exportFormat === 'pdf') {
      await exportToPDF(exportContent, `${tableName}_${dateStamp}.pdf`);
    }
    
    setShowExportDialog(false);
  };

  const convertToCSV = (exportContent: any) => {
    let csv = '';
    
    // Add header if provided
    if (exportContent.header) {
      csv += exportContent.header + '\n\n';
    }
    
    // Add timestamp if enabled
    if (exportContent.timestamp) {
      csv += `Generated: ${exportContent.timestamp}\n`;
      csv += `Table: ${exportContent.tableName}\n\n`;
    }
    
    // Add column headers
    csv += exportContent.columns.join(',') + '\n';
    
    // Add data rows
    exportContent.data.forEach((row: any) => {
      const values = exportContent.columns.map((col: string) => {
        const val = row[col];
        // Escape commas and quotes in CSV
        if (val !== null && val !== undefined) {
          const strVal = String(val);
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }
        return '';
      });
      csv += values.join(',') + '\n';
    });
    
    // Add footer if provided
    if (exportContent.footer) {
      csv += '\n' + exportContent.footer;
    }
    
    return csv;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel Export Function
  const exportToExcel = async (exportContent: any, filename: string) => {
    try {
      const { utils, writeFile } = await import('xlsx');
      
      // Prepare worksheet data
      const worksheetData: any[][] = [];
      
      // Add header if provided
      if (exportContent.header) {
        worksheetData.push([exportContent.header]);
        worksheetData.push([]); // Empty row
      }
      
      // Add timestamp and table info if enabled
      if (exportContent.timestamp) {
        worksheetData.push([`Generated: ${exportContent.timestamp}`]);
        worksheetData.push([`Table: ${exportContent.tableName}`]);
        worksheetData.push([]); // Empty row
      }
      
      // Add column headers
      worksheetData.push(exportContent.columns);
      
      // Add data rows
      exportContent.data.forEach((row: any) => {
        worksheetData.push(exportContent.columns.map((col: string) => row[col] ?? ''));
      });
      
      // Add footer if provided
      if (exportContent.footer) {
        worksheetData.push([]); // Empty row
        worksheetData.push([exportContent.footer]);
      }
      
      // Create workbook and worksheet
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet(worksheetData);
      
      // Auto-size columns
      const colWidths = exportContent.columns.map((col: string) => ({
        wch: Math.max(
          col.length,
          ...exportContent.data.map((row: any) => 
            String(row[col] ?? '').length
          ).slice(0, 100)
        ) + 2
      }));
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      utils.book_append_sheet(wb, ws, "Report");
      
      // Save file
      writeFile(wb, filename);
      
      toast({
        title: "Export Successful",
        description: `Your report has been exported as Excel`,
        variant: "default"
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export Excel file",
        variant: "destructive"
      });
    }
  };

  // PDF Export Function - Simplified approach
  const exportToPDF = async (exportContent: any, filename: string) => {
    try {
      // Dynamic import of jsPDF and autoTable
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      
      // Create new PDF document with autoTable support
      const doc: any = new jsPDF({
        orientation: exportContent.columns.length > 6 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Import autoTable plugin (this extends the jsPDF prototype)
      // The import alone should add the autoTable method to the doc instance
      
      let yPosition = 15;
      
      // Add header if provided
      if (exportContent.header) {
        doc.setFontSize(14);
        doc.text(exportContent.header, 14, yPosition);
        yPosition += 10;
      }
      
      // Add metadata
      if (exportContent.timestamp) {
        doc.setFontSize(10);
        doc.text(`Generated: ${exportContent.timestamp}`, 14, yPosition);
        yPosition += 6;
        if (exportContent.tableName) {
          doc.text(`Table: ${exportContent.tableName}`, 14, yPosition);
          yPosition += 8;
        }
      }
      
      // Prepare table data - handle all data types properly
      const tableHeaders = exportContent.columns;
      const tableRows = exportContent.data.map((row: any) => 
        exportContent.columns.map((col: string) => {
          const value = row[col];
          if (value === null || value === undefined) {
            return '';
          }
          // Convert to string and handle long values
          const strValue = String(value);
          if (strValue.length > 60) {
            return strValue.substring(0, 57) + '...';
          }
          return strValue;
        })
      );
      
      console.log('PDF Export Data:', {
        headers: tableHeaders.length,
        rows: tableRows.length,
        firstRow: tableRows[0],
        lastRow: tableRows[tableRows.length - 1]
      });
      
      // Always use autoTable for professional table rendering
      if (true) { // Force usage of autoTable - it should always be available after import
        // Determine column alignments based on data types
        const columnAlignments = exportContent.columns.map((col: string) => {
          // Check first non-null value to determine data type
          const sampleValue = exportContent.data.find((row: any) => 
            row[col] !== null && row[col] !== undefined
          )?.[col];
          
          // Numbers and dates align right, text aligns left
          if (typeof sampleValue === 'number') {
            return 'right';
          } else if (sampleValue instanceof Date || 
                     (typeof sampleValue === 'string' && 
                      !isNaN(Date.parse(sampleValue)) && 
                      sampleValue.match(/\d{4}-\d{2}-\d{2}/))) {
            return 'center';
          }
          return 'left';
        });
        
        doc.autoTable({
          head: [tableHeaders],
          body: tableRows,
          startY: yPosition,
          theme: 'grid', // Professional table with full grid lines
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            lineColor: [128, 128, 128], // Gray borders
            lineWidth: 0.1,
            valign: 'middle', // Vertical alignment
            font: 'helvetica'
          },
          headStyles: {
            fillColor: [240, 240, 240], // Light gray header background
            textColor: [0, 0, 0], // Black text
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [128, 128, 128], // Gray borders for header
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250] // Very light gray for alternating rows
          },
          columnStyles: exportContent.columns.reduce((acc: any, col: string, index: number) => {
            acc[index] = {
              halign: columnAlignments[index],
              cellWidth: 'auto'
            };
            return acc;
          }, {}),
          margin: { left: 10, right: 10, top: yPosition },
          showHead: 'everyPage', // Repeat headers on each page
          tableLineColor: [128, 128, 128], // Gray table border
          tableLineWidth: 0.1,
          didDrawPage: function(data: any) {
            // Add page header on each page (after first)
            if (data.pageNumber > 1) {
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(`${exportContent.tableName || 'Report'} - Continued`, 10, 10);
            }
            
            // Footer with page numbers on each page
            // Get total page count - use the data object's pageCount or calculate
            const pageCount = data.pageCount || doc.internal.pages.length - 1 || '?';
            
            // Draw footer line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(10, doc.internal.pageSize.height - 15, 
                    doc.internal.pageSize.width - 10, 
                    doc.internal.pageSize.height - 15);
            
            // Add page number - ensure it's visible and properly positioned
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100); // Gray color for footer
            const currentPage = data.pageNumber || doc.internal.getCurrentPageInfo().pageNumber;
            const pageString = `Page ${currentPage} of ${pageCount}`;
            
            // Center the page number text
            const textWidth = doc.getTextWidth(pageString);
            const centerX = (doc.internal.pageSize.width - textWidth) / 2;
            doc.text(pageString, centerX, doc.internal.pageSize.height - 10);
            
            // Add timestamp on the left
            doc.setFontSize(8);
            doc.text(
              new Date().toLocaleDateString(),
              10,
              doc.internal.pageSize.height - 10
            );
            
            // Add report name on the right
            const reportName = exportContent.tableName || 'Paginated Report';
            doc.text(
              reportName,
              doc.internal.pageSize.width - 10,
              doc.internal.pageSize.height - 10,
              { align: 'right' }
            );
          }
        });
        
        // Add footer if provided
        if (exportContent.footer) {
          const finalY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.height - 30;
          if (finalY < doc.internal.pageSize.height - 20) {
            doc.setFontSize(10);
            doc.text(exportContent.footer, 14, finalY + 10);
          }
        }
      } else {
        // This should never happen as we're importing autoTable above
        throw new Error('PDF table generation library not loaded. Please try again or use CSV/Excel export.');
      }
      
      // Save the PDF file
      doc.save(filename);
      
      toast({
        title: "Export Successful",
        description: `Report exported as ${filename}`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('PDF export error details:', error);
      
      // More specific error message
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "PDF Export Failed",
        description: `Unable to generate PDF: ${errorMessage}. Try CSV or Excel format instead.`,
        variant: "destructive"
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const formatCellValue = (value: any, dataType: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Handle dates
    if (dataType.toLowerCase().includes('date') || dataType.toLowerCase().includes('time')) {
      try {
        return format(new Date(value), 'MMM dd, yyyy HH:mm:ss');
      } catch {
        return String(value);
      }
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle numbers
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const renderPaginationItems = () => {
    if (!data) return null;
    
    const items = [];
    const totalPages = data.totalPages;
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          data-testid="button-previous-page"
        />
      </PaginationItem>
    );

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
            data-testid="button-page-1"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
            data-testid={`button-page-${i}`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
            data-testid={`button-page-${totalPages}`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          data-testid="button-next-page"
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                Paginated Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                View data from any SQL Server table with pagination and filtering
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(true)}
              disabled={!data?.items || data.items.length === 0}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Source Type Selector - Big Tiles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Select Data Source
            </CardTitle>
            <CardDescription>Choose between Analytics SQL Database or Power BI Datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              {/* SQL Database Tile */}
              <button
                onClick={() => handleSourceTypeChange('sql')}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                  sourceType === 'sql'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid="button-select-sql"
              >
                {sourceType === 'sql' && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Analytics SQL Database</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect to SQL Server tables for direct data access
                    </p>
                  </div>
                </div>
              </button>

              {/* Power BI Tile */}
              <button
                onClick={() => handleSourceTypeChange('powerbi')}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                  sourceType === 'powerbi'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid="button-select-powerbi"
              >
                {sourceType === 'powerbi' && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Power BI Datasets</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Access semantic models from your Power BI workspaces
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Selector - Only show for Power BI */}
        {sourceType === 'powerbi' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                Select Workspace
              </CardTitle>
              <CardDescription>
                Choose your Power BI workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label htmlFor="workspace-select">Workspace</Label>
                <Select
                  value={workspaceName}
                  onValueChange={handleWorkspaceChange}
                  disabled={loadingWorkspaces || !isAuthenticated}
                >
                  <SelectTrigger id="workspace-select" data-testid="select-workspace">
                    <SelectValue placeholder={
                      !isAuthenticated 
                        ? "Authenticating..." 
                        : loadingWorkspaces 
                          ? "Loading workspaces..." 
                          : "Select a workspace..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {powerbiWorkspaces?.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.name}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                    {!powerbiWorkspaces?.length && !loadingWorkspaces && (
                      <SelectItem value="no-workspaces" disabled>
                        No workspaces available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table/Dataset Selector - Show for SQL (always) or Power BI (after workspace selected) */}
        {(sourceType === 'sql' || (sourceType === 'powerbi' && workspaceName.trim())) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                {sourceType === 'sql' ? 'Select Table' : 'Select Dataset'}
              </CardTitle>
              <CardDescription>
                {sourceType === 'sql' 
                  ? 'Choose a table from your SQL Server database'
                  : `Choose a dataset (semantic model) from ${workspaceName} workspace`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourceType === 'sql' ? (
                <div className="max-w-md">
                  <Label htmlFor="table-select">Table</Label>
                  <Select
                    value={selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : ""}
                    onValueChange={handleTableSelect}
                    disabled={loadingTables}
                  >
                    <SelectTrigger id="table-select" data-testid="select-table">
                      <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select a table..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {tables?.map((table) => (
                        <SelectItem
                          key={`${table.schemaName}.${table.tableName}`}
                          value={`${table.schemaName}.${table.tableName}`}
                        >
                          {table.schemaName}.{table.tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="max-w-md">
                  <Label htmlFor="dataset-select">Dataset (Semantic Model)</Label>
                  <Select
                    value={selectedDatasetId}
                    onValueChange={setSelectedDatasetId}
                    disabled={loadingDatasets}
                  >
                    <SelectTrigger id="dataset-select" data-testid="select-dataset">
                      <SelectValue placeholder={loadingDatasets ? "Loading datasets..." : "Select a dataset..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {powerbiDatasets?.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                      {!powerbiDatasets?.length && !loadingDatasets && (
                        <SelectItem value="no-datasets" disabled>
                          No datasets available in this workspace
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Power BI Table Selection */}
        {sourceType === 'powerbi' && selectedDatasetId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Select Table
              </CardTitle>
              <CardDescription>
                Choose a table from the {datasetDetails?.name || 'selected'} dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-w-md">
                  <Label htmlFor="powerbi-table-select">Table</Label>
                  <Select
                    value={selectedPowerBITable}
                    onValueChange={(value) => {
                      setSelectedPowerBITable(value);
                      setCurrentPage(1);
                      setSearchTerm("");
                      setColumnFilters({});
                    }}
                    disabled={loadingDatasetTables}
                  >
                    <SelectTrigger id="powerbi-table-select" data-testid="select-powerbi-table">
                      <SelectValue placeholder={loadingDatasetTables ? "Discovering tables..." : "Select a table..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetTables && datasetTables.length > 0 ? (
                        datasetTables.filter((table: any) => 
                          // Filter out any error/placeholder tables
                          table.name && !table.name.includes('Unable to auto-discover')
                        ).map((table: any) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name} {table.columns?.length ? `(${table.columns.length} columns)` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        !loadingDatasetTables && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            No tables discovered. Ensure you have a Premium workspace with proper XMLA permissions.
                          </div>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedTable || (sourceType === 'powerbi' && selectedPowerBITable)) && (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters & Search</CardTitle>
                <CardDescription>Refine your report data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search all columns..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                        data-testid="input-search"
                      />
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label htmlFor="sortBy">Sort By</Label>
                    <Select value={sortBy || "none"} onValueChange={(value) => setSortBy(value === "none" ? "" : value)} disabled={loadingSchema || !tableSchema}>
                      <SelectTrigger id="sortBy" data-testid="select-sort-by">
                        <SelectValue placeholder={loadingSchema ? "Loading columns..." : "Select column..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sorting</SelectItem>
                        {tableSchema?.map((col) => (
                          <SelectItem key={col.columnName} value={col.columnName}>
                            {col.columnName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Size */}
                  <div className="space-y-2">
                    <Label htmlFor="pageSize">Items per page</Label>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger id="pageSize" data-testid="select-page-size">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report Results</CardTitle>
                    <CardDescription>
                      {isLoading ? (
                        "Loading..."
                      ) : data ? (
                        sourceType === 'sql' && selectedTable ? 
                          `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, data.total)} of ${data.total} records from ${selectedTable.schemaName}.${selectedTable.tableName}` :
                          `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, data.total)} of ${data.total} records from ${selectedPowerBITable}`
                      ) : (
                        "No data available"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Column Selector */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!tableSchema}
                      onClick={() => setShowColumnChooser(true)}
                      data-testid="button-column-selector"
                    >
                      <Columns3 className="w-4 h-4 mr-2" />
                      Columns ({selectedColumns.length}/{tableSchema?.length || 0})
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Page {currentPage} of {data?.totalPages || 0}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {schemaError ? (
                  <div className="text-center py-8 text-destructive" data-testid="text-schema-error">
                    Error loading table schema: {schemaError instanceof Error ? schemaError.message : 'Unknown error'}
                  </div>
                ) : loadingSchema ? (
                  <div className="space-y-3">
                    <p className="text-center text-muted-foreground">Loading table structure...</p>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-destructive" data-testid="text-error">
                    Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data && data.items.length > 0 && tableSchema ? (
                  <>
                    {/* Active Filters Display */}
                    {Object.keys(columnFilters).length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium">Active Filters:</span>
                        {Object.entries(columnFilters).map(([column, value]) => (
                          <Badge key={column} variant="secondary" className="gap-1">
                            {column}: {value}
                            <button
                              onClick={() => clearColumnFilter(column)}
                              className="ml-1 hover:bg-muted rounded-full"
                              data-testid={`button-clear-filter-${column}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-6 text-xs"
                          data-testid="button-clear-all-filters"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                    
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          {/* Column Headers */}
                          <TableRow>
                            {tableSchema.filter(col => selectedColumns.includes(col.columnName)).map((column) => (
                              <TableHead
                                key={column.columnName}
                                className="min-w-[150px]"
                                data-testid={`header-${column.columnName}`}
                              >
                                <div 
                                  className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                                  onClick={() => handleSort(column.columnName)}
                                >
                                  {column.columnName}
                                  {sortBy === column.columnName && (
                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-normal">
                                  {column.dataType}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                          {/* Column Filters */}
                          <TableRow className="bg-muted/50">
                            {tableSchema.filter(col => selectedColumns.includes(col.columnName)).map((column) => (
                              <TableHead key={`filter-${column.columnName}`} className="p-2">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                  <Input
                                    value={columnFilters[column.columnName] || ""}
                                    onChange={(e) => handleColumnFilterChange(column.columnName, e.target.value)}
                                    className="h-8 pl-7 pr-7 text-xs"
                                    data-testid={`input-filter-${column.columnName}`}
                                  />
                                  {columnFilters[column.columnName] && (
                                    <button
                                      onClick={() => clearColumnFilter(column.columnName)}
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-muted rounded-full p-0.5"
                                      data-testid={`button-clear-column-filter-${column.columnName}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                              <TableRow key={index} data-testid={`row-report-${index}`}>
                                {tableSchema.filter(col => selectedColumns.includes(col.columnName)).map((column) => (
                                  <TableCell
                                    key={column.columnName}
                                    data-testid={`cell-${column.columnName}-${index}`}
                                  >
                                    {formatCellValue(item[column.columnName], column.dataType)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell 
                                colSpan={selectedColumns.length} 
                                className="text-center py-8 text-muted-foreground"
                              >
                                No records match your filters. Try adjusting the filter criteria.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                      <div className="mt-6">
                        <Pagination>
                          <PaginationContent>
                            {renderPaginationItems()}
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-data">
                    No data available in this table. Try adjusting your filters or select a different table.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedTable && !loadingTables && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Table to Begin</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Choose a table from the dropdown above to view and analyze its data with advanced pagination and filtering options.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Select format and configure export settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-3 py-2">
              {/* Export Format - Compact Card Design */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">FORMAT</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-colors ${
                      exportFormat === 'csv' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-xs font-medium">CSV</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-colors ${
                      exportFormat === 'excel' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-xs font-medium">Excel</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-colors ${
                      exportFormat === 'pdf' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-xs font-medium">PDF</div>
                  </button>
                </div>
              </div>

              {/* Header & Footer - Single Row */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">HEADER & FOOTER</Label>
                <Input
                  value={exportHeader}
                  onChange={(e) => setExportHeader(e.target.value)}
                  placeholder="Header text (optional)"
                  className="h-8 text-sm"
                />
                <Input
                  value={exportFooter}
                  onChange={(e) => setExportFooter(e.target.value)}
                  placeholder="Footer text (optional)"
                  className="h-8 text-sm"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">OPTIONS</Label>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="include-timestamp" className="text-sm font-normal cursor-pointer">
                    Include timestamp
                  </Label>
                  <Switch
                    id="include-timestamp"
                    checked={includeTimestamp}
                    onCheckedChange={setIncludeTimestamp}
                    className="scale-90"
                  />
                </div>
              </div>

              {/* Export Summary */}
              <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{selectedColumns.length} columns</span>
                  <span>•</span>
                  <span>{data?.total || 0} rows</span>
                  {exportFormat === 'pdf' && (
                    <>
                      <span>•</span>
                      <span>
                        {(() => {
                          // Accurate page estimation based on total rows in dataset
                          const cols = selectedColumns.length;
                          const rows = data?.total || 0;
                          
                          // PDF typically fits about 10-12 rows per page with headers
                          // Landscape orientation (>6 columns) fits fewer rows
                          const rowsPerPage = cols > 6 ? 10 : 12;
                          
                          // Calculate pages needed for the rows
                          const estimatedPages = Math.ceil(rows / rowsPerPage);
                          
                          return `~${estimatedPages} page${estimatedPages !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{exportFormat.toUpperCase()} format</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleExport} disabled={!exportFormat}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Chooser Dialog */}
      <Dialog open={showColumnChooser} onOpenChange={setShowColumnChooser}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Column Chooser</DialogTitle>
            <DialogDescription>
              Drag and drop columns between panels or double-click to move them. Use the arrow buttons to move selected columns.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
            {/* Hidden Columns Panel */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Hidden Columns:</div>
              <Input
                placeholder="Search Columns"
                value={hiddenColumnsSearch}
                onChange={(e) => setHiddenColumnsSearch(e.target.value)}
                className="h-8"
              />
              <div 
                className="border rounded-lg p-2 h-80 overflow-y-auto"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnName = e.dataTransfer.getData("text/plain");
                  if (columnName && selectedColumns.includes(columnName)) {
                    setSelectedColumns(prev => prev.filter(c => c !== columnName));
                    setColumnOrder(prev => {
                      // Move to end of hidden columns
                      const newOrder = prev.filter(c => c !== columnName);
                      newOrder.push(columnName);
                      return newOrder;
                    });
                  }
                }}
              >
                {columnOrder
                  .filter(colName => !selectedColumns.includes(colName))
                  .filter(colName => colName.toLowerCase().includes(hiddenColumnsSearch.toLowerCase()))
                  .map(colName => {
                    const col = tableSchema?.find(c => c.columnName === colName);
                    if (!col) return null;
                    return (
                      <div
                        key={col.columnName}
                        className={`px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${
                          selectedHiddenColumns.includes(col.columnName) 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-accent'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", col.columnName);
                          setIsDraggingColumn(col.columnName);
                        }}
                        onDragEnd={() => setIsDraggingColumn(null)}
                        onClick={() => {
                          setSelectedHiddenColumns(prev => 
                            prev.includes(col.columnName)
                              ? prev.filter(c => c !== col.columnName)
                              : [...prev, col.columnName]
                          );
                          setSelectedShownColumns([]);
                        }}
                        onDoubleClick={() => {
                          setSelectedColumns(prev => [...prev, col.columnName]);
                          setSelectedHiddenColumns(prev => prev.filter(c => c !== col.columnName));
                        }}
                      >
                        <div className="text-sm">{col.columnName}</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Arrow Buttons */}
            <div className="flex flex-col justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // Move selected hidden columns to shown
                  setSelectedColumns(prev => [...prev, ...selectedHiddenColumns]);
                  setSelectedHiddenColumns([]);
                }}
                disabled={selectedHiddenColumns.length === 0}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // Move selected shown columns to hidden
                  setSelectedColumns(prev => prev.filter(c => !selectedShownColumns.includes(c)));
                  setSelectedShownColumns([]);
                }}
                disabled={selectedShownColumns.length === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Shown Columns Panel */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Shown Columns:</div>
              <Input
                placeholder="Search Columns"
                value={shownColumnsSearch}
                onChange={(e) => setShownColumnsSearch(e.target.value)}
                className="h-8"
              />
              <div 
                className="border rounded-lg p-2 h-80 overflow-y-auto"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnName = e.dataTransfer.getData("text/plain");
                  if (columnName && !selectedColumns.includes(columnName)) {
                    setSelectedColumns(prev => [...prev, columnName]);
                  }
                }}
              >
                {columnOrder
                  .filter(colName => selectedColumns.includes(colName))
                  .filter(colName => colName.toLowerCase().includes(shownColumnsSearch.toLowerCase()))
                  .map((colName, index) => {
                    const col = tableSchema?.find(c => c.columnName === colName);
                    if (!col) return null;
                    return (
                      <div
                        key={col.columnName}
                        className={`px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${
                          selectedShownColumns.includes(col.columnName) 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-accent'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", col.columnName);
                          setIsDraggingColumn(col.columnName);
                        }}
                        onDragEnd={() => setIsDraggingColumn(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedColumn = e.dataTransfer.getData("text/plain");
                          if (draggedColumn && draggedColumn !== col.columnName) {
                            handleColumnReorder(
                              columnOrder.indexOf(draggedColumn),
                              columnOrder.indexOf(col.columnName)
                            );
                          }
                        }}
                        onClick={() => {
                          setSelectedShownColumns(prev => 
                            prev.includes(col.columnName)
                              ? prev.filter(c => c !== col.columnName)
                              : [...prev, col.columnName]
                          );
                          setSelectedHiddenColumns([]);
                        }}
                        onDoubleClick={() => {
                          setSelectedColumns(prev => prev.filter(c => c !== col.columnName));
                          setSelectedShownColumns(prev => prev.filter(c => c !== col.columnName));
                        }}
                      >
                        <div className="text-sm">{col.columnName}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => {
              setShowColumnChooser(false);
              setHiddenColumnsSearch("");
              setShownColumnsSearch("");
              setSelectedHiddenColumns([]);
              setSelectedShownColumns([]);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowColumnChooser(false);
              setHiddenColumnsSearch("");
              setShownColumnsSearch("");
              setSelectedHiddenColumns([]);
              setSelectedShownColumns([]);
            }}>
              Save And Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
