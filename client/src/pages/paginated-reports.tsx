import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Download, FileText, FileSpreadsheet, Copy, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  
  // Grouping state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupDetails, setGroupDetails] = useState<Record<string, any[]>>({});
  
  // Format rules state
  const [formatRules, setFormatRules] = useState<FormatRule[]>([]);
  
  // Sort and filter state
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [useDistinct, setUseDistinct] = useState(true); // Enabled by default
  const [aggregationTypes, setAggregationTypes] = useState<Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'>>({});
  
  // Helper function to detect numeric columns (works identically for both SQL and Power BI)
  const getNumericColumns = useCallback((schema: TableColumn[] | null): string[] => {
    if (!schema) return [];
    const numericTypes = ['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint', 'number', 'double', 'real'];
    return schema
      .filter(col => {
        // Both SQL Server and Power BI return dataType field
        const dataType = col.dataType || '';
        return numericTypes.some(type => dataType.toLowerCase().includes(type));
      })
      .map(col => {
        // Both SQL Server and Power BI return columnName field
        return col.columnName || '';
      });
  }, []);
  
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
        distinct: useDistinct.toString(),
        selectedColumns: JSON.stringify(selectedColumns),
        aggregationTypes: JSON.stringify(aggregationTypes)
      });
      return `/api/paginated-reports?${params}`;
    } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
      // Power BI uses POST request, so we'll handle it differently
      return 'powerbi-data'; // This is just a key for React Query
    }
    return null;
  }, [sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, page, pageSize, sortBy, sortOrder, columnFilters, useDistinct, selectedColumns]);
  
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

  // Initialize aggregation types when useDistinct changes or columns change
  useEffect(() => {
    if (useDistinct && tableSchema) {
      const numericCols = getNumericColumns(tableSchema);
      
      setAggregationTypes(prev => {
        const newAggregationTypes: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'> = {};
        
        // Initialize with 'sum' for all numeric columns that are selected
        numericCols.forEach(col => {
          if (selectedColumns.includes(col)) {
            newAggregationTypes[col] = prev[col] || 'sum';
          }
        });
        
        // Only update if actually changed to avoid infinite loop
        if (JSON.stringify(prev) !== JSON.stringify(newAggregationTypes)) {
          return newAggregationTypes;
        }
        return prev;
      });
    } else if (!useDistinct) {
      // Clear aggregation types when distinct is disabled
      setAggregationTypes({});
    }
  }, [useDistinct, selectedColumns, tableSchema, getNumericColumns]);
  
  // Fetch data - handle both SQL and Power BI
  const { data, isLoading } = useQuery({
    queryKey: dataUrl ? [dataUrl, page, pageSize, sortBy, sortOrder, columnFilters, selectedColumns, useDistinct, aggregationTypes] : [],
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
          distinct: useDistinct.toString(),
          selectedColumns: JSON.stringify(selectedColumns),
          aggregationTypes: JSON.stringify(aggregationTypes)
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
            sortOrder,
            distinct: useDistinct,
            aggregationTypes: useDistinct ? aggregationTypes : undefined
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
      
      if (isNumeric) {
        // When using aggregation, the totals need special handling
        if (useDistinct && aggregationTypes[col.columnName]) {
          const aggType = aggregationTypes[col.columnName];
          
          // For COUNT aggregation, sum the counts from aggregated data
          // For other aggregations (SUM, AVG, MIN, MAX), use server totals or calculate from visible data
          if (aggType === 'count') {
            // Sum of counts from the current page data
            totalsRow[col.columnName] = data?.items?.reduce((sum, item) => 
              sum + (parseFloat(item[col.columnName]) || 0), 0) || 0;
          } else if (serverTotals && serverTotals[col.columnName] !== undefined) {
            // Use server-calculated totals for aggregated data
            totalsRow[col.columnName] = serverTotals[col.columnName];
          } else if (data?.items && aggType) {
            // Calculate totals based on aggregation type from visible data
            const values = data.items.map(item => parseFloat(item[col.columnName]) || 0).filter(v => !isNaN(v));
            
            if (values.length > 0) {
              switch (aggType) {
                case 'sum':
                  totalsRow[col.columnName] = values.reduce((a, b) => a + b, 0);
                  break;
                case 'avg':
                  totalsRow[col.columnName] = values.reduce((a, b) => a + b, 0) / values.length;
                  break;
                case 'min':
                  totalsRow[col.columnName] = Math.min(...values);
                  break;
                case 'max':
                  totalsRow[col.columnName] = Math.max(...values);
                  break;
                default:
                  totalsRow[col.columnName] = values.reduce((a, b) => a + b, 0);
              }
            } else {
              totalsRow[col.columnName] = 0;
            }
          } else {
            totalsRow[col.columnName] = 0;
          }
        } else {
          // No aggregation - use standard totals from server
          totalsRow[col.columnName] = serverTotals?.[col.columnName] || 0;
        }
      } else if (col.columnName === firstTextColumn) {
        // Display "Total" label with aggregation indicator if applicable
        const hasAggregation = useDistinct && Object.keys(aggregationTypes).length > 0;
        totalsRow[col.columnName] = hasAggregation ? 'Total (Aggregated)' : 'Total';
      } else {
        totalsRow[col.columnName] = '';
      }
    });
    
    return totalsRow;
  }, [includeTotals, tableSchema, serverTotals, useDistinct, aggregationTypes, data]);

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
          // For Power BI, continue while we get full pages
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
          // For Power BI, continue while we get full pages
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
  // Fetch grouped data from server when grouping is enabled
  const { data: groupedData } = useQuery({
    queryKey: groupingEnabled && groupingColumns.length > 0 
      ? ['grouped', sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, 
         groupingColumns, page, pageSize, sortBy, sortOrder, columnFilters, selectedColumns]
      : [],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      
      if (sourceType === 'sql' && selectedTable) {
        const params = new URLSearchParams({
          schema: selectedTable.schemaName,
          table: selectedTable.tableName,
          groupColumns: JSON.stringify(groupingColumns),
          aggregateColumns: JSON.stringify(selectedColumns.filter(col => !groupingColumns.includes(col))),
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy,
          sortOrder,
          filters: JSON.stringify(columnFilters)
        });
        
        const response = await fetch(`/api/paginated-reports/grouped?${params}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch grouped data');
        const result = await response.json();
        
        // Transform server response to match expected format
        return {
          groups: result.groups?.map((group: any) => ({
            ...group,
            groupKey: JSON.stringify(group.groupValues),
            expanded: expandedGroups.has(JSON.stringify(group.groupValues)),
            items: groupDetails[JSON.stringify(group.groupValues)] || []
          })) || []
        };
      } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
        // For Power BI, we'll use the regular endpoint with aggregation
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
            columns: selectedColumns,
            filters: columnFilters,
            page,
            pageSize,
            sortBy,
            sortOrder,
            distinct: true,
            aggregationTypes: selectedColumns.reduce((acc, col) => {
              if (!groupingColumns.includes(col)) {
                // Detect if column is numeric and apply default aggregation
                const numericColumn = tableSchema?.find(c => 
                  c.columnName === col && 
                  ['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type =>
                    c.dataType.toLowerCase().includes(type)
                  )
                );
                if (numericColumn) {
                  acc[col] = 'sum'; // Default to SUM for numeric columns
                }
              }
              return acc;
            }, {} as Record<string, string>)
          })
        });
        
        if (!response.ok) throw new Error('Failed to fetch Power BI grouped data');
        const result = await response.json();
        
        // Transform aggregated results into groups
        const groups = result.items?.map((item: any) => {
          const groupValues = groupingColumns.reduce((acc, col) => {
            acc[col] = item[col];
            return acc;
          }, {} as Record<string, any>);
          
          return {
            groupValues,
            groupKey: JSON.stringify(groupValues),
            expanded: expandedGroups.has(JSON.stringify(groupValues)),
            items: groupDetails[JSON.stringify(groupValues)] || [],
            aggregates: item // The entire item contains aggregated values
          };
        }) || [];
        
        return { groups };
      }
      
      return { groups: [] };
    },
    enabled: groupingEnabled && groupingColumns.length > 0 && !!dataUrl
  });
  
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
    setSelectedColumns(prev => {
      const isRemoving = prev.includes(column);
      
      // If removing a column that is currently being sorted, clear the sort
      if (isRemoving && sortBy === column) {
        setSortBy('');
      }
      
      return isRemoving 
        ? prev.filter(c => c !== column)
        : [...prev, column];
    });
  }, [sortBy]);
  
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
  
  const handleGroupExpand = useCallback(async (groupKey: string) => {
    // Toggle expanded state
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey);
      // Clear cached details for this group
      setGroupDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[groupKey];
        return newDetails;
      });
    } else {
      newExpandedGroups.add(groupKey);
      
      // Fetch detail rows for this group if not already fetched
      if (!groupDetails[groupKey]) {
        try {
          // Parse the group key to extract filter values
          const groupValues = JSON.parse(groupKey);
          
          // Build filters for the group
          const groupFilters = { ...columnFilters };
          Object.entries(groupValues).forEach(([col, val]) => {
            groupFilters[col] = val as string;
          });
          
          // Fetch detail rows for this group
          const token = localStorage.getItem('auth_token');
          
          if (sourceType === 'sql' && selectedTable) {
            const params = new URLSearchParams({
              schema: selectedTable.schemaName,
              table: selectedTable.tableName,
              page: '1',
              pageSize: '100', // Get up to 100 detail rows per group
              filters: JSON.stringify(groupFilters),
              selectedColumns: JSON.stringify(selectedColumns),
              sortBy: sortBy || '',
              sortOrder: sortOrder || 'asc'
            });
            
            const response = await fetch(`/api/paginated-reports?${params}`, {
              headers: {
                'Authorization': token ? `Bearer ${token}` : ''
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              setGroupDetails(prev => ({
                ...prev,
                [groupKey]: data.items || []
              }));
            }
          } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
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
                filters: groupFilters,
                page: 1,
                pageSize: 100,
                sortBy: sortBy || null,
                sortOrder: sortOrder || 'asc'
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              setGroupDetails(prev => ({
                ...prev,
                [groupKey]: data.items || []
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch group details:', error);
        }
      }
    }
    
    setExpandedGroups(newExpandedGroups);
  }, [expandedGroups, groupDetails, columnFilters, sourceType, selectedTable, selectedWorkspace, selectedDataset, selectedPowerBITable, selectedColumns, sortBy, sortOrder]);
  
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
      // For Power BI, always fetch all data; for SQL, only if multiple pages
      const shouldFetchAllData = sourceType === 'powerbi' || (data.totalPages > 1);
      
      if (shouldFetchAllData) {
        // Fetch all data for export based on source type
        if (sourceType === 'sql' && selectedTable) {
          const allDataUrl = `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}&selectedColumns=${encodeURIComponent(JSON.stringify(selectedColumns))}`;
          
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
        } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
          // Fetch all Power BI data for export
          const token = localStorage.getItem('auth_token');
          allData = [];
          let currentPage = 1;
          let hasMoreData = true;
          
          while (hasMoreData) {
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
                page: currentPage,
                pageSize: 1000, // Fetch in larger chunks for export
                sortBy: sortBy || null,
                sortOrder: sortOrder || 'asc',
                distinct: useDistinct
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch Power BI data: ${response.statusText}`);
            }
            
            const pageData = await response.json();
            
            if (pageData.items && pageData.items.length > 0) {
              allData = [...allData, ...pageData.items];
              currentPage++;
              // Continue fetching while we get full pages of data
              hasMoreData = pageData.items.length === 1000;
            } else {
              hasMoreData = false;
            }
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
        // Add column headers with aggregation types if applicable
        const headersWithAggregation = columnsToExport.map(col => {
          if (useDistinct && aggregationTypes[col] && aggregationTypes[col] !== 'none') {
            return `${col} (${aggregationTypes[col].toUpperCase()})`;
          }
          return col;
        });
        rows.push(headersWithAggregation);
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
  }, [data, selectedColumns, selectedTable, exportConfig, includeTotals, totals, sourceType, columnFilters, sortBy, sortOrder, tableSchema, useDistinct, selectedWorkspace, selectedDataset, selectedPowerBITable]);
  
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
      // For Power BI, always fetch all data; for SQL, only if multiple pages
      const shouldFetchAllData = sourceType === 'powerbi' || (data.totalPages > 1);
      
      if (shouldFetchAllData) {
        // Fetch all data for export based on source type
        if (sourceType === 'sql' && selectedTable) {
          const allDataUrl = `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}&selectedColumns=${encodeURIComponent(JSON.stringify(selectedColumns))}`;
          
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
        } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
          // Fetch all Power BI data for export
          const token = localStorage.getItem('auth_token');
          allData = [];
          let currentPage = 1;
          let hasMoreData = true;
          
          while (hasMoreData) {
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
                page: currentPage,
                pageSize: 1000, // Fetch in larger chunks for export
                sortBy: sortBy || null,
                sortOrder: sortOrder || 'asc',
                distinct: useDistinct
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch Power BI data: ${response.statusText}`);
            }
            
            const pageData = await response.json();
            
            if (pageData.items && pageData.items.length > 0) {
              allData = [...allData, ...pageData.items];
              currentPage++;
              // Continue fetching while we get full pages of data
              hasMoreData = pageData.items.length === 1000;
            } else {
              hasMoreData = false;
            }
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
      
      // Add column headers with aggregation types if applicable
      const headersWithAggregation = columnsToExport.map(col => {
        if (useDistinct && aggregationTypes[col] && aggregationTypes[col] !== 'none') {
          return `${col} (${aggregationTypes[col].toUpperCase()})`;
        }
        return col;
      });
      wsData.push(headersWithAggregation);
      
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
  }, [data, selectedColumns, columnWidths, exportConfig, includeTotals, totals, formatRules, sourceType, selectedTable, columnFilters, sortBy, sortOrder, tableSchema, useDistinct, selectedWorkspace, selectedDataset, selectedPowerBITable]);
  
  const exportToPDF = useCallback(async () => {
    if (!data?.items) return;
    
    // If no columns selected, use all columns from schema
    const columnsToExport = selectedColumns.length > 0 
      ? selectedColumns 
      : (tableSchema?.map(col => col.columnName) || []);
      
    if (columnsToExport.length === 0) {
      console.error('No columns selected for PDF export');
      return;
    }
    
    setIsExporting(true);
    try {
      // First, fetch all data if we have more pages
      let allData = data.items;
      // For Power BI, always fetch all data; for SQL, only if multiple pages
      const shouldFetchAllData = sourceType === 'powerbi' || (data.totalPages > 1);
      
      if (shouldFetchAllData) {
        // Fetch all data for export based on source type
        if (sourceType === 'sql' && selectedTable) {
          const allDataUrl = `/api/paginated-reports/export-data?schema=${selectedTable.schemaName}&table=${selectedTable.tableName}&filters=${encodeURIComponent(JSON.stringify(columnFilters))}&sortBy=${sortBy}&sortOrder=${sortOrder}&distinct=${useDistinct}&selectedColumns=${encodeURIComponent(JSON.stringify(columnsToExport))}`;
          
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
          } else {
            throw new Error(`Failed to fetch export data: ${response.statusText}`);
          }
        } else if (sourceType === 'powerbi' && selectedWorkspace && selectedDataset && selectedPowerBITable) {
          // Fetch all Power BI data for export
          const token = localStorage.getItem('auth_token');
          allData = [];
          let currentPage = 1;
          let hasMoreData = true;
          
          while (hasMoreData) {
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
                columns: columnsToExport,
                filters: columnFilters,
                page: currentPage,
                pageSize: 1000, // Fetch in larger chunks for export
                sortBy: sortBy || null,
                sortOrder: sortOrder || 'asc',
                distinct: useDistinct
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch Power BI data: ${response.statusText}`);
            }
            
            const pageData = await response.json();
            
            if (pageData.items && pageData.items.length > 0) {
              allData = [...allData, ...pageData.items];
              currentPage++;
              // Continue fetching while we get full pages of data
              hasMoreData = pageData.items.length === 1000;
            } else {
              hasMoreData = false;
            }
          }
        }
      }
      
      // Validate we have data to export
      if (!allData || allData.length === 0) {
        throw new Error('No data available to export');
      }
      
      // Create document respecting user's export configuration
      const doc = new jsPDF({
        orientation: exportConfig.orientation as 'portrait' | 'landscape',
        unit: 'mm',
        format: exportConfig.paperSize as any
      }) as any; // Cast to any to access autoTable
      
      // Get table name for header
      const tableName = selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : 'Report';
      const fileName = exportConfig.fileName || selectedTable?.tableName || 'report';
      
      // Initial Y position for content - respect margin settings
      const marginTop = exportConfig.marginTop || 15;
      const marginLeft = exportConfig.marginLeft || 14;
      const marginRight = exportConfig.marginRight || 14;
      const marginBottom = exportConfig.marginBottom || 15;
      let yPosition = marginTop;
      
      // Add custom header if configured
      if (exportConfig.includeHeaders && exportConfig.customHeader) {
        doc.setFontSize(exportConfig.fontSize || 10);
        doc.text(exportConfig.customHeader, marginLeft, yPosition);
        yPosition += 8;
      }
      
      // Add timestamp if configured
      if (exportConfig.includeTimestamp) {
        doc.setFontSize(exportConfig.fontSize || 10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPosition);
        yPosition += 6;
      }
      
      // Add table name
      doc.setFontSize((exportConfig.fontSize || 10) + 1);
      doc.text(`Table: ${tableName}`, marginLeft, yPosition);
      yPosition += 8;
      
      // Prepare table data with aggregation types in headers
      const tableHeaders = columnsToExport.map(col => {
        if (useDistinct && aggregationTypes[col] && aggregationTypes[col] !== 'none') {
          return `${col} (${aggregationTypes[col].toUpperCase()})`;
        }
        return col;
      });
      const tableRows = allData.map((item: any) =>
        columnsToExport.map(col => {
          // Check if column exists
          if (!(col in item)) {
            console.warn(`Column ${col} not found in data`);
            return '';
          }
          const value = item[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
          }
          if (typeof value === 'boolean') return value ? 'Yes' : 'No';
          
          // Handle long strings
          const strValue = String(value);
          if (strValue.length > 60) {
            return strValue.substring(0, 57) + '...';
          }
          return strValue;
        })
      );
      
      // Add totals row if needed
      if (includeTotals && totals) {
        const totalsRow = columnsToExport.map(col => {
          const value = totals[col];
          if (value !== undefined && value !== null) {
            return typeof value === 'number' 
              ? Number.isInteger(value) ? value.toString() : value.toFixed(2)
              : String(value);
          }
          return col === columnsToExport[0] ? 'Total' : '';
        });
        tableRows.push(totalsRow);
      }
      
      // Use autoTable for professional PDF generation with pagination
      // The import should have attached the autoTable method to jsPDF prototype
      try {
        const tableConfig: any = {
          body: tableRows,
          startY: yPosition,
          theme: 'grid',
          styles: {
            fontSize: exportConfig.fontSize || 9,
            cellPadding: 3,
            overflow: 'linebreak',
            lineColor: [128, 128, 128],
            lineWidth: 0.1,
            valign: 'middle',
            font: 'helvetica'
          },
          pageBreak: 'auto',
          rowPageBreak: 'avoid',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [128, 128, 128],
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          margin: { left: marginLeft, right: marginRight, top: yPosition, bottom: marginBottom },
          showHead: exportConfig.includeHeaders !== false ? 'everyPage' : false,
          tableLineColor: [128, 128, 128],
          tableLineWidth: 0.1
        };
        
        // Only add headers if includeHeaders is not explicitly false
        if (exportConfig.includeHeaders !== false) {
          tableConfig.head = [tableHeaders];
        }
        
        // Add the didDrawPage callback
        tableConfig.didDrawPage = function(data: any) {
            // Add page header on continued pages
            if (data.pageNumber > 1) {
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(`${tableName} - Continued`, 10, 10);
            }
            
            // Footer with page numbers
            const pageCount = data.pageCount || '?';
            
            // Draw footer line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(10, doc.internal.pageSize.height - 15, 
                    doc.internal.pageSize.width - 10, 
                    doc.internal.pageSize.height - 15);
            
            // Page number
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            const currentPage = data.pageNumber || 1;
            const pageString = `Page ${currentPage} of ${pageCount}`;
            
            // Center the page number
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
            doc.text(
              tableName,
              doc.internal.pageSize.width - 10,
              doc.internal.pageSize.height - 10,
              { align: 'right' }
            );
            
            // Add custom footer if configured
            if (exportConfig.includeFooters && exportConfig.customFooter) {
              doc.setFontSize(exportConfig.fontSize || 9);
              doc.setTextColor(50, 50, 50);
              const footerY = doc.internal.pageSize.height - marginBottom - 5;
              doc.text(exportConfig.customFooter, marginLeft, footerY);
            }
          };
        
        // Apply the configuration to generate the PDF table
        // Use the imported autoTable function directly
        autoTable(doc, tableConfig);
      } catch (error) {
        // Fallback if autoTable fails
        console.error('Error using jsPDF autoTable:', error);
        doc.setFontSize(10);
        doc.text('Error generating table. Please check console for details.', 14, yPosition + 10);
        doc.text(`Total records: ${allData.length}`, 14, yPosition + 20);
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
  }, [data, selectedColumns, exportConfig, includeTotals, totals, sourceType, selectedTable, columnFilters, sortBy, sortOrder, tableSchema, useDistinct, selectedWorkspace, selectedDataset, selectedPowerBITable]);
  
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
                  
                  {/* Aggregation Type Selection for Numeric Columns */}
                  {useDistinct && tableSchema && getNumericColumns(tableSchema).length > 0 && (
                    <div className="border-l-4 border-primary/20 pl-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium">Aggregation Types</label>
                        <p className="text-xs text-muted-foreground">
                          Select how to aggregate numeric columns when showing distinct rows
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getNumericColumns(tableSchema)
                          .filter(col => selectedColumns.includes(col))
                          .map(col => (
                            <div key={col} className="flex items-center justify-between gap-2">
                              <span className="text-sm truncate flex-1" title={col}>{col}</span>
                              <Select
                                value={aggregationTypes[col] || 'sum'}
                                onValueChange={(value: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none') => {
                                  setAggregationTypes(prev => ({
                                    ...prev,
                                    [col]: value
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sum">SUM</SelectItem>
                                  <SelectItem value="avg">AVG</SelectItem>
                                  <SelectItem value="min">MIN</SelectItem>
                                  <SelectItem value="max">MAX</SelectItem>
                                  <SelectItem value="count">COUNT</SelectItem>
                                  <SelectItem value="none">Don't Summarize</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        {getNumericColumns(tableSchema).filter(col => selectedColumns.includes(col)).length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            No numeric columns selected
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
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
            useDistinct={useDistinct}
            aggregationTypes={aggregationTypes}
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