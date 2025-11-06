import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Download, FileText, FileSpreadsheet, Copy, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Import the new focused components
import { DataSourceSelector } from '@/components/reports/DataSourceSelector';
import { ColumnChooser } from '@/components/reports/ColumnChooser';
import { FormatRulesPanel, type FormatRule } from '@/components/reports/FormatRulesPanel';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ExportSettings, ExportDialog, type ExportConfig } from '@/components/reports/ExportSettings';

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export default function PaginatedReports() {
  // Data source state
  const [sourceType, setSourceType] = useState<'sql' | 'powerbi'>('sql');
  const [selectedTable, setSelectedTable] = useState<{ tableName: string; schemaName: string } | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedPowerBITable, setSelectedPowerBITable] = useState<string>('');
  
  // Column configuration state
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [groupingColumns, setGroupingColumns] = useState<string[]>([]);
  const [includeTotals, setIncludeTotals] = useState(false);
  
  // Format rules state
  const [formatRules, setFormatRules] = useState<FormatRule[]>([]);
  
  // Sort and filter state
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useDistinct, setUseDistinct] = useState(false);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    includeHeaders: true,
    includeFooters: false,
    includeTimestamp: true,
    orientation: 'landscape',
    paperSize: 'a4',
    fontSize: 10,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    customHeader: '',
    customFooter: '',
    fileName: 'report'
  });
  
  // Panel sizing
  const [configPanelSize, setConfigPanelSize] = useState(35);

  // Build query URL for data fetching
  const dataUrl = useMemo(() => {
    if (sourceType === 'sql' && selectedTable) {
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
        filters: JSON.stringify(columnFilters),
        distinct: useDistinct.toString()
      });
      return `/api/paginated-reports?${params}`;
    } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
      // Power BI uses POST request, so we'll handle it differently
      return 'powerbi-data'; // This is just a key for React Query
    }
    return null;
  }, [sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, page, pageSize, sortBy, sortOrder, columnFilters, useDistinct]);
  
  // Fetch table schema - using the correct endpoint format
  const schemaUrl = useMemo(() => {
    if (sourceType === 'sql' && selectedTable) {
      return `/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`;
    } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
      return `/api/powerbi/workspaces/${selectedWorkspace}/datasets/${selectedDataset}/tables/${selectedPowerBITable}/schema`;
    }
    return null;
  }, [sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable]);
    
  const { data: tableSchema } = useQuery<TableColumn[]>({
    queryKey: schemaUrl ? [schemaUrl] : [],
    enabled: !!schemaUrl
  });
  
  // Fetch data - handle both SQL and Power BI
  const { data, isLoading } = useQuery({
    queryKey: dataUrl ? [dataUrl, page, pageSize, sortBy, sortOrder, columnFilters, selectedColumns, useDistinct] : [],
    queryFn: async () => {
      if (sourceType === 'sql' && selectedTable) {
        // Regular GET request for SQL data
        const params = new URLSearchParams({
          schema: selectedTable.schemaName,
          table: selectedTable.tableName,
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy,
          sortOrder,
          filters: JSON.stringify(columnFilters),
          distinct: useDistinct.toString()
        });
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/paginated-reports?${params}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
        // POST request for Power BI data
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/powerbi/dataset-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId: selectedWorkspace,
            datasetId: selectedDataset,
            tableName: selectedPowerBITable,
            columns: selectedColumns.length > 0 ? selectedColumns : undefined,
            filters: columnFilters,
            page,
            pageSize,
            sortBy,
            sortOrder
          })
        });
        if (!response.ok) throw new Error('Failed to fetch Power BI data');
        return response.json();
      }
      return null;
    },
    enabled: !!dataUrl
  });
  
  // Fetch totals from server for entire filtered dataset
  const totalsUrl = useMemo(() => {
    if (!includeTotals) return null;
    
    if (sourceType === 'sql' && selectedTable) {
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        filters: JSON.stringify(columnFilters),
      });
      return `/api/paginated-reports/totals?${params}`;
    } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
      return 'powerbi-totals'; // Key for React Query
    }
    return null;
  }, [includeTotals, sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, columnFilters]);

  const { data: serverTotals } = useQuery({
    queryKey: totalsUrl ? [totalsUrl, columnFilters, selectedColumns] : [],
    queryFn: async () => {
      if (sourceType === 'sql' && selectedTable && totalsUrl) {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(totalsUrl, { 
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include' 
        });
        if (!response.ok) throw new Error('Failed to fetch totals');
        return response.json();
      } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/powerbi/dataset-totals', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId: selectedWorkspace,
            datasetId: selectedDataset,
            tableName: selectedPowerBITable,
            columns: selectedColumns,
            filters: columnFilters
          })
        });
        if (!response.ok) throw new Error('Failed to fetch Power BI totals');
        return response.json();
      }
      return null;
    },
    enabled: !!totalsUrl && includeTotals,
  });

  // Calculate totals using server data
  const totals = useMemo(() => {
    if (!includeTotals || !tableSchema) return {};
    
    const totalsRow: Record<string, any> = {};
    const firstTextColumn = tableSchema?.find(col => 
      !['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type => 
        col.dataType.toLowerCase().includes(type)
      )
    )?.columnName;
    
    tableSchema?.forEach(col => {
      const isNumeric = ['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type =>
        col.dataType.toLowerCase().includes(type)
      );
      
      if (isNumeric && serverTotals) {
        totalsRow[col.columnName] = serverTotals[col.columnName] || 0;
      } else if (col.columnName === firstTextColumn) {
        totalsRow[col.columnName] = 'Total';
      } else {
        totalsRow[col.columnName] = '';
      }
    });
    
    return totalsRow;
  }, [includeTotals, tableSchema, serverTotals]);

  // Function to fetch ALL data in chunks (for export)
  const fetchAllData = useCallback(async () => {
    // Check for required selections based on source type
    if (sourceType === 'sql' && !selectedTable) {
      throw new Error('No table selected');
    }
    if (sourceType === 'powerbi' && (!selectedWorkspace || !selectedDataset || !selectedPowerBITable)) {
      throw new Error('Power BI configuration incomplete');
    }
    
    // If no columns selected, use all columns from schema
    const columnsToFetch = selectedColumns.length > 0 
      ? selectedColumns 
      : (tableSchema?.map(col => col.columnName) || []);

    const chunkSize = 100; // Fetch 100 rows at a time
    let allData: any[] = [];
    let currentPage = 1;
    let hasMoreData = true;
    let totalRows = 0;

    setExportMessage('Fetching data...');
    setExportProgress(0);

    try {
      if (sourceType === 'sql' && selectedTable) {
        // First, get the total count to show accurate progress
        const countParams = new URLSearchParams({
          schema: selectedTable.schemaName,
          table: selectedTable.tableName,
          filters: JSON.stringify(columnFilters),
        });
        
        const countUrl = `/api/paginated-reports/count?${countParams}`;
        const token = localStorage.getItem('auth_token');
        const countResponse = await fetch(countUrl, { 
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include' 
        });
        const { count } = await countResponse.json();
        totalRows = count || 0;

        // Now fetch all pages for SQL
        while (hasMoreData) {
          const params = new URLSearchParams({
            schema: selectedTable.schemaName,
            table: selectedTable.tableName,
            page: currentPage.toString(),
            pageSize: chunkSize.toString(),
            sortBy,
            sortOrder,
            filters: JSON.stringify(columnFilters),
          });
          
          const url = `/api/paginated-reports?${params}`;
          const response = await fetch(url, { 
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include' 
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch page ${currentPage}`);
          }

          const pageData = await response.json();
          
          if (pageData.items && pageData.items.length > 0) {
            allData = [...allData, ...pageData.items];
            const progress = Math.min(95, (allData.length / totalRows) * 100);
            setExportProgress(progress);
            setExportMessage(`Fetched ${allData.length} of ${totalRows} rows...`);
          }
          
          // Check if there's more data
          hasMoreData = pageData.items && pageData.items.length === chunkSize;
          currentPage++;
        }
      } else if (sourceType === 'powerbi') {
        // Fetch Power BI data in chunks
        // Note: Power BI might not return total count upfront, so we'll fetch until no more data
        while (hasMoreData) {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/powerbi/dataset-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include',
            body: JSON.stringify({
              workspaceId: selectedWorkspace,
              datasetId: selectedDataset,
              tableName: selectedPowerBITable,
              columns: columnsToFetch,
              filters: columnFilters,
              page: currentPage,
              pageSize: chunkSize,
              sortBy,
              sortOrder
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Power BI data page ${currentPage}`);
          }

          const pageData = await response.json();
          
          if (pageData.items && pageData.items.length > 0) {
            allData = [...allData, ...pageData.items];
            
            // Update progress (we don't know total for Power BI upfront)
            if (pageData.totalCount) {
              totalRows = pageData.totalCount;
              const progress = Math.min(95, (allData.length / totalRows) * 100);
              setExportProgress(progress);
              setExportMessage(`Fetched ${allData.length} of ${totalRows} rows...`);
            } else {
              setExportMessage(`Fetched ${allData.length} rows...`);
              setExportProgress((currentPage / (currentPage + 1)) * 100); // Estimate progress
            }
          }
          
          // Check if there's more data
          hasMoreData = pageData.items && pageData.items.length === chunkSize;
          currentPage++;
        }
      }

      setExportProgress(100);
      setExportMessage('Processing data for export...');
      
      // Filter data to only include selected columns and respect column order
      const filteredData = allData.map(row => {
        const filteredRow: Record<string, any> = {};
        columnsToFetch.forEach(col => {
          filteredRow[col] = row[col];
        });
        return filteredRow;
      });

      return filteredData;
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }, [sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, selectedColumns, sortBy, sortOrder, columnFilters, tableSchema]);
  
  // Group data (client-side for now, should be moved to server)
  const groupedData = useMemo(() => {
    if (!groupingEnabled || groupingColumns.length === 0 || !data?.items) {
      return null;
    }
    
    // TODO: Replace with server-side grouping
    const groups = new Map<string, any>();
    
    data.items.forEach((item: any) => {
      const groupKey = groupingColumns.map(col => item[col]).join('_');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          groupValues: groupingColumns.reduce((acc, col) => {
            acc[col] = item[col];
            return acc;
          }, {} as Record<string, any>),
          items: [],
          expanded: false,
          aggregates: {}
        });
      }
      groups.get(groupKey).items.push(item);
    });
    
    return { groups: Array.from(groups.values()) };
  }, [groupingEnabled, groupingColumns, data]);
  
  // Reset selected columns when table changes
  useEffect(() => {
    if (tableSchema) {
      // Always reset columns when schema changes (which happens when table changes)
      const allColumns = tableSchema.map(col => col.columnName);
      const defaultColumns = tableSchema.slice(0, 5).map(col => col.columnName);
      setColumnOrder(allColumns);
      setSelectedColumns(defaultColumns);
      // Also reset column filters when changing tables
      setColumnFilters({});
      // Reset pagination
      setPage(1);
    }
  }, [tableSchema]);
  
  // Column management
  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);
  
  const handleColumnsReorder = useCallback((newColumns: string[]) => {
    setSelectedColumns(newColumns);
  }, []);
  
  const handleColumnResize = useCallback((column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: width }));
  }, []);
  
  // Grouping management
  const handleGroupingColumnToggle = useCallback((column: string) => {
    setGroupingColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);
  
  const handleGroupExpand = useCallback((groupKey: string) => {
    // TODO: Implement group expansion logic
    console.log('Expanding group:', groupKey);
  }, []);
  
  // Format rules management
  const handleAddFormatRule = useCallback(() => {
    const newRule: FormatRule = {
      id: Date.now().toString(),
      column: selectedColumns[0] || '',
      condition: 'equals',
      value: '',
      backgroundColor: '#ffff00',
      textColor: '#000000',
      fontWeight: 'normal'
    };
    setFormatRules(prev => [...prev, newRule]);
  }, [selectedColumns]);
  
  const handleUpdateFormatRule = useCallback((id: string, updates: Partial<FormatRule>) => {
    setFormatRules(prev => 
      prev.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    );
  }, []);
  
  const handleDeleteFormatRule = useCallback((id: string) => {
    setFormatRules(prev => prev.filter(rule => rule.id !== id));
  }, []);
  
  // Column filter handlers
  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setPage(1); // Reset to page 1 when filtering
  }, []);

  const clearColumnFilter = useCallback((column: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setPage(1);
  }, []);

  // Sorting
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);
  
  // Export functions with all data support
  const exportToCSV = useCallback(async () => {
    if (!data?.items) return;
    
    // If no columns selected, use all columns from schema
    const columnsToExport = selectedColumns.length > 0 
      ? selectedColumns 
      : (tableSchema?.map(col => col.columnName) || []);
      
    if (columnsToExport.length === 0) return;
    
    setIsExporting(true);
    try {
      // First, fetch all data if we have more pages
      let allData = data.items;
      if (data.totalPages > 1) {
        // Fetch all data for export
        const allDataUrl = sourceType === 'sql' && selectedTable
          ? `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}`
          : null;
          
        if (allDataUrl) {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(allDataUrl, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const exportData = await response.json();
            allData = exportData.items || allData;
          }
        }
      }
      
      const rows = [];
      const tableName = selectedTable?.tableName || 'report';
      const dateStamp = new Date().toISOString().split('T')[0];
      
      // Add header
      if (exportConfig.includeHeaders) {
        if (exportConfig.customHeader) {
          rows.push([exportConfig.customHeader]);
          rows.push([]);
        }
        rows.push(columnsToExport);
      }
      
      // Add data
      allData.forEach((item: any) => {
        rows.push(columnsToExport.map(col => {
          const value = item[col];
          // Properly escape values
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }));
      });
      
      // Add totals
      if (includeTotals && totals) {
        rows.push(columnsToExport.map(col => totals[col] || ''));
      }
      
      // Add footer
      if (exportConfig.includeFooters && exportConfig.customFooter) {
        rows.push([]);
        rows.push([exportConfig.customFooter]);
      }
      
      // Add timestamp
      if (exportConfig.includeTimestamp) {
        rows.push([]);
        rows.push([`Generated on: ${new Date().toLocaleString()}`]);
      }
      
      // Create CSV
      const csvContent = rows.map(row => 
        row.map(cell => String(cell || '')).join(',')
      ).join('\n');
      
      // Download with proper filename using export settings
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = exportConfig.fileName || tableName || 'report';
      a.download = `${fileName}_${dateStamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [data, selectedColumns, selectedTable, exportConfig, includeTotals, totals, sourceType, columnFilters, sortBy, sortOrder, tableSchema]);
  
  const exportToExcel = useCallback(async () => {
    if (!data?.items) return;
    
    // If no columns selected, use all columns from schema
    const columnsToExport = selectedColumns.length > 0 
      ? selectedColumns 
      : (tableSchema?.map(col => col.columnName) || []);
      
    if (columnsToExport.length === 0) return;
    
    setIsExporting(true);
    try {
      // First, fetch all data if we have more pages
      let allData = data.items;
      if (data.totalPages > 1) {
        // Fetch all data for export
        const allDataUrl = sourceType === 'sql' && selectedTable
          ? `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}`
          : null;
          
        if (allDataUrl) {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(allDataUrl, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const exportData = await response.json();
            allData = exportData.items || allData;
          }
        }
      }
      
      const workbook = XLSX.utils.book_new();
      const wsData = [];
      
      // Add header
      if (exportConfig.includeHeaders && exportConfig.customHeader) {
        wsData.push([exportConfig.customHeader]);
        wsData.push([]);
      }
      
      // Add column headers
      wsData.push(columnsToExport);
      
      // Add data
      allData.forEach((item: any) => {
        wsData.push(columnsToExport.map(col => item[col] || ''));
      });
      
      // Add totals
      if (includeTotals && totals) {
        wsData.push(columnsToExport.map(col => totals[col] || ''));
      }
      
      // Add footer
      if (exportConfig.includeFooters && exportConfig.customFooter) {
        wsData.push([]);
        wsData.push([exportConfig.customFooter]);
      }
      
      // Add timestamp
      if (exportConfig.includeTimestamp) {
        wsData.push([]);
        wsData.push([`Generated on: ${new Date().toLocaleString()}`]);
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      
      // Apply formatting rules if they exist
      if (formatRules && formatRules.length > 0) {
        const headerRowCount = exportConfig.includeHeaders && exportConfig.customHeader ? 3 : 1;
        
        // Iterate through data rows to apply format rules
        allData.forEach((item: any, rowIndex: number) => {
          const actualRow = headerRowCount + rowIndex + 1; // Excel rows are 1-indexed
          
          columnsToExport.forEach((col, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: actualRow - 1, c: colIndex });
            const value = item[col];
            
            // Check each format rule
            formatRules.forEach(rule => {
              if (rule.column === col && value !== null && value !== undefined) {
                let matches = false;
                
                // Check condition
                switch (rule.condition) {
                  case 'equals':
                    matches = String(value) === String(rule.value);
                    break;
                  case 'contains':
                    matches = String(value).includes(String(rule.value));
                    break;
                  case 'greater':
                    matches = Number(value) > Number(rule.value);
                    break;
                  case 'less':
                    matches = Number(value) < Number(rule.value);
                    break;
                  case 'between':
                    if (rule.value2) {
                      const num = Number(value);
                      matches = num >= Number(rule.value) && num <= Number(rule.value2);
                    }
                    break;
                }
                
                if (matches) {
                  // Apply formatting
                  if (!worksheet[cellAddress]) {
                    worksheet[cellAddress] = { v: value };
                  }
                  
                  worksheet[cellAddress].s = {
                    fill: {
                      patternType: 'solid',
                      fgColor: { rgb: rule.backgroundColor?.replace('#', '') || 'FFFFFF' }
                    },
                    font: {
                      color: { rgb: rule.textColor?.replace('#', '') || '000000' },
                      bold: rule.fontWeight === 'bold'
                    }
                  };
                }
              }
            });
          });
        });
      }
      
      // Apply column widths
      const colWidths = columnsToExport.map(col => ({
        wch: Math.max(10, Math.min(50, (columnWidths[col] || 150) / 10))
      }));
      worksheet['!cols'] = colWidths;
      
      const tableName = selectedTable?.tableName || 'report';
      const dateStamp = new Date().toISOString().split('T')[0];
      const fileName = exportConfig.fileName || tableName || 'report';
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${fileName}_${dateStamp}.xlsx`);
    } catch (error) {
      console.error('Excel export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [data, selectedColumns, columnWidths, exportConfig, includeTotals, totals, formatRules, sourceType, selectedTable, columnFilters, sortBy, sortOrder, tableSchema, useDistinct]);
  
  const exportToPDF = useCallback(async () => {
    if (!data?.items) return;
    
    // If no columns selected, use all columns from schema
    const columnsToExport = selectedColumns.length > 0 
      ? selectedColumns 
      : (tableSchema?.map(col => col.columnName) || []);
      
    if (columnsToExport.length === 0) return;
    
    setIsExporting(true);
    try {
      // First, fetch all data if we have more pages
      let allData = data.items;
      if (data.totalPages > 1) {
        // Fetch all data for export
        const allDataUrl = sourceType === 'sql' && selectedTable
          ? `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}`
          : null;
          
        if (allDataUrl) {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(allDataUrl, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const exportData = await response.json();
            allData = exportData.items || allData;
          }
        }
      }
      
      const doc = new jsPDF({
        orientation: exportConfig.orientation as 'portrait' | 'landscape',
        unit: 'mm',
        format: exportConfig.paperSize as any
      });
      
      // Get table name for header
      const tableName = selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : 'Report';
      const fileName = exportConfig.fileName || selectedTable?.tableName || 'report';
      
      // Calculate rows per page
      const pageHeight = doc.internal.pageSize.height;
      const marginTop = 20;
      const marginBottom = 15;
      const rowHeight = 7;
      const headerHeight = 20; // Space for headers
      const usableHeight = pageHeight - marginTop - marginBottom - headerHeight;
      const rowsPerPage = Math.floor(usableHeight / rowHeight);
      const totalDataPages = Math.ceil(allData.length / rowsPerPage);
      
      for (let pageNum = 0; pageNum < totalDataPages; pageNum++) {
        if (pageNum > 0) {
          doc.addPage();
        }
        
        // Add Generated date at the top
        doc.setFontSize(10);
        doc.setTextColor(100);
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Generated: ${currentDate}`, 14, 10);
        
        // Add table name
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Table: ${tableName}`, 14, 17);
        
        // Get data for this page
        const startIdx = pageNum * rowsPerPage;
        const endIdx = Math.min(startIdx + rowsPerPage, allData.length);
        const pageData = allData.slice(startIdx, endIdx);
        
        // Prepare table data
        const tableData = pageData.map((item: any) =>
          columnsToExport.map(col => {
            const value = item[col];
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') {
              return Number.isInteger(value) ? value.toString() : value.toFixed(2);
            }
            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
            return String(value);
          })
        );
        
        // Add totals row only on the last page
        if (pageNum === totalDataPages - 1 && includeTotals && totals) {
          tableData.push(
            columnsToExport.map(col => {
              const value = totals[col];
              if (value === null || value === undefined) return '';
              if (typeof value === 'number') {
                return Number.isInteger(value) ? value.toString() : value.toFixed(2);
              }
              return String(value);
            })
          );
        }
        
        // Generate table with clean style
        doc.autoTable({
          head: [columnsToExport],
          body: tableData,
          startY: 22,
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'left'
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          didDrawPage: function(data) {
            // Add page number at bottom
            const pageString = pageNum === 0 && totalDataPages === 1 
              ? tableName 
              : `${tableName} - Page ${pageNum + 1}`;
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(
              pageString,
              doc.internal.pageSize.width / 2,
              pageHeight - 8,
              { align: 'center' }
            );
          }
        });
      }
      
      // Save PDF
      const dateStamp = new Date().toISOString().split('T')[0];
      doc.save(`${fileName}_${dateStamp}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [data, selectedColumns, exportConfig, includeTotals, totals, pageSize, sourceType, selectedTable, columnFilters, sortBy, sortOrder, tableSchema, useDistinct]);
  
  // Main export handler
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'csv':
          await exportToCSV();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'pdf':
          await exportToPDF();
          break;
      }
      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()}`,
      });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportToCSV, exportToExcel, exportToPDF]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paginated Reports Designer</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="default"
            data-testid="button-export"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfigPanelSize(prev => prev === 0 ? 35 : 0)}
            data-testid="button-toggle-config"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={configPanelSize}
          minSize={0}
          maxSize={50}
          className={configPanelSize === 0 ? "hidden" : ""}
        >
          <Tabs defaultValue="source" className="h-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="source" className="space-y-4 p-4">
              <DataSourceSelector
                sourceType={sourceType}
                onSourceTypeChange={setSourceType}
                selectedTable={selectedTable}
                onTableChange={setSelectedTable}
                selectedWorkspace={selectedWorkspace}
                onWorkspaceChange={setSelectedWorkspace}
                selectedDataset={selectedDataset}
                onDatasetChange={setSelectedDataset}
                selectedPowerBITable={selectedPowerBITable}
                onPowerBITableChange={setSelectedPowerBITable}
              />
            </TabsContent>
            
            <TabsContent value="columns" className="space-y-4 p-4">
              <div className="space-y-4">
                {/* Column Chooser */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Column Selection</h3>
                  <ColumnChooser
                    allColumns={tableSchema?.map(col => col.columnName) || []}
                    selectedColumns={selectedColumns}
                    onColumnsChange={setSelectedColumns}
                    columnOrder={columnOrder}
                    onColumnOrderChange={setColumnOrder}
                  />
                </div>
                
                {/* Additional Options */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Include Totals Row</label>
                      <p className="text-xs text-muted-foreground">
                        Show a totals row at the bottom of the report with sum of numeric columns
                      </p>
                    </div>
                    <Button
                      variant={includeTotals ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncludeTotals(!includeTotals)}
                    >
                      {includeTotals ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Show Distinct Rows</label>
                      <p className="text-xs text-muted-foreground">
                        Remove duplicate rows and show only unique combinations of values
                      </p>
                    </div>
                    <Button
                      variant={useDistinct ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseDistinct(!useDistinct)}
                    >
                      {useDistinct ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Enable Grouping</label>
                      <p className="text-xs text-muted-foreground">
                        Group rows by one or more columns with aggregations
                      </p>
                    </div>
                    <Button
                      variant={groupingEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGroupingEnabled(!groupingEnabled)}
                    >
                      {groupingEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  {groupingEnabled && (
                    <div className="pl-4 space-y-2">
                      <label className="text-sm font-medium">Select Grouping Columns:</label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {selectedColumns.map(col => (
                          <label key={col} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={groupingColumns.includes(col)}
                              onChange={() => handleGroupingColumnToggle(col)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm truncate">{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="format" className="space-y-4 p-4">
              <FormatRulesPanel
                formatRules={formatRules}
                onAddRule={handleAddFormatRule}
                onUpdateRule={handleUpdateFormatRule}
                onDeleteRule={handleDeleteFormatRule}
                availableColumns={selectedColumns}
              />
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4 p-4">
              <ExportSettings
                exportConfig={exportConfig}
                onUpdateConfig={(updates) => setExportConfig(prev => ({ ...prev, ...updates }))}
                onExport={handleExport}
                isExporting={isExporting}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65} minSize={30}>
          <ReportPreview
            data={data}
            loading={isLoading}
            selectedColumns={columnOrder.filter(col => selectedColumns.includes(col))}
            formatRules={formatRules}
            groupingEnabled={groupingEnabled}
            groupingColumns={groupingColumns}
            groupedData={groupedData}
            includeTotals={includeTotals}
            totals={totals}
            columnWidths={columnWidths}
            sourceType={sourceType}
            onColumnResize={handleColumnResize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onGroupExpand={handleGroupExpand}
            tableSchema={tableSchema}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            onClearColumnFilter={clearColumnFilter}
            onClearAllFilters={clearAllFilters}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose a format to export your report. You can customize export settings in the configuration panel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              variant="outline"
              className="h-24 flex flex-col gap-2"
              data-testid="dialog-export-csv"
            >
              <FileText className="h-8 w-8" />
              <span>CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              variant="outline"
              className="h-24 flex flex-col gap-2"
              data-testid="dialog-export-excel"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>Excel</span>
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              variant="outline"
              className="h-24 flex flex-col gap-2"
              data-testid="dialog-export-pdf"
            >
              <FileText className="h-8 w-8" />
              <span>PDF</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}