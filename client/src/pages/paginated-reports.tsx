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
import { ColumnConfigurator } from '@/components/reports/ColumnConfigurator';
import { FormatRulesPanel, type FormatRule } from '@/components/reports/FormatRulesPanel';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ExportSettings, type ExportConfig } from '@/components/reports/ExportSettings';

export default function PaginatedReports() {
  // Data source state
  const [sourceType, setSourceType] = useState<'sql' | 'powerbi'>('sql');
  const [selectedTable, setSelectedTable] = useState<{ tableName: string; schemaName: string } | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  
  // Column configuration state
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [groupingColumns, setGroupingColumns] = useState<string[]>([]);
  const [includeTotals, setIncludeTotals] = useState(false);
  
  // Format rules state
  const [formatRules, setFormatRules] = useState<FormatRule[]>([]);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
        searchTerm,
        sortBy,
        sortOrder
      });
      return `/api/paginated-reports?${params}`;
    }
    // TODO: Add Power BI data fetching
    return null;
  }, [sourceType, selectedTable, page, pageSize, searchTerm, sortBy, sortOrder]);
  
  // Fetch table schema
  const schemaUrl = selectedTable 
    ? `/api/sql-schema?table=${selectedTable.tableName}&schema=${selectedTable.schemaName}` 
    : null;
    
  const { data: tableSchema } = useQuery({
    queryKey: schemaUrl ? [schemaUrl] : [],
    enabled: !!schemaUrl
  });
  
  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: dataUrl ? [dataUrl] : [],
    enabled: !!dataUrl
  });
  
  // Fetch totals from server for entire filtered dataset
  const totalsUrl = useMemo(() => {
    if (!includeTotals) return null;
    
    if (sourceType === 'sql' && selectedTable) {
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        searchTerm,
        filters: JSON.stringify(columnFilters),
      });
      return `/api/paginated-reports/totals?${params}`;
    }
    return null;
  }, [includeTotals, sourceType, selectedTable, searchTerm, columnFilters]);

  const { data: serverTotals } = useQuery({
    queryKey: totalsUrl ? [totalsUrl] : [],
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
  
  // Group data (client-side for now, should be moved to server)
  const groupedData = useMemo(() => {
    if (!groupingEnabled || groupingColumns.length === 0 || !data?.items) {
      return null;
    }
    
    // TODO: Replace with server-side grouping
    const groups = new Map<string, any>();
    
    data.items.forEach(item => {
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
  
  // Initialize selected columns when schema loads
  useEffect(() => {
    if (tableSchema && selectedColumns.length === 0) {
      const defaultColumns = tableSchema.slice(0, 5).map(col => col.columnName);
      setSelectedColumns(defaultColumns);
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
  
  // Export functions
  const exportToCSV = useCallback(() => {
    if (!data?.items || selectedColumns.length === 0) return;
    
    const rows = [];
    
    // Add header
    if (exportConfig.includeHeaders) {
      if (exportConfig.customHeader) {
        rows.push([exportConfig.customHeader]);
        rows.push([]);
      }
      rows.push(selectedColumns);
    }
    
    // Add data
    data.items.forEach(item => {
      rows.push(selectedColumns.map(col => item[col] || ''));
    });
    
    // Add totals
    if (includeTotals && totals) {
      rows.push(selectedColumns.map(col => totals[col] || ''));
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
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportConfig.fileName || 'report'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [data, selectedColumns, exportConfig, includeTotals, totals]);
  
  const exportToExcel = useCallback(() => {
    if (!data?.items || selectedColumns.length === 0) return;
    
    const workbook = XLSX.utils.book_new();
    const wsData = [];
    
    // Add header
    if (exportConfig.includeHeaders && exportConfig.customHeader) {
      wsData.push([exportConfig.customHeader]);
      wsData.push([]);
    }
    
    // Add column headers
    wsData.push(selectedColumns);
    
    // Add data
    data.items.forEach(item => {
      wsData.push(selectedColumns.map(col => item[col] || ''));
    });
    
    // Add totals
    if (includeTotals && totals) {
      wsData.push(selectedColumns.map(col => totals[col] || ''));
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
    
    // Apply column widths
    const colWidths = selectedColumns.map(col => ({
      wch: Math.max(10, Math.min(50, (columnWidths[col] || 150) / 10))
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${exportConfig.fileName || 'report'}.xlsx`);
  }, [data, selectedColumns, columnWidths, exportConfig, includeTotals, totals]);
  
  const exportToPDF = useCallback(() => {
    if (!data?.items || selectedColumns.length === 0) return;
    
    const doc = new jsPDF({
      orientation: exportConfig.orientation,
      unit: 'mm',
      format: exportConfig.paperSize
    });
    
    // Add header
    let yPos = exportConfig.marginTop;
    if (exportConfig.includeHeaders && exportConfig.customHeader) {
      doc.setFontSize(12);
      doc.text(exportConfig.customHeader, exportConfig.marginLeft, yPos);
      yPos += 10;
    }
    
    // Prepare table data
    const tableData = data.items.map(item =>
      selectedColumns.map(col => {
        const value = item[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          return Number.isInteger(value) ? value.toString() : value.toFixed(2);
        }
        return String(value);
      })
    );
    
    // Add totals row
    if (includeTotals && totals) {
      tableData.push(
        selectedColumns.map(col => {
          const value = totals[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
          }
          return String(value);
        })
      );
    }
    
    // Generate table
    (doc as any).autoTable({
      head: [selectedColumns],
      body: tableData,
      startY: yPos,
      margin: {
        left: exportConfig.marginLeft,
        right: exportConfig.marginRight
      },
      styles: {
        fontSize: exportConfig.fontSize,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Add footer
    if (exportConfig.includeFooters && exportConfig.customFooter) {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text(exportConfig.customFooter, exportConfig.marginLeft, pageHeight - exportConfig.marginBottom);
    }
    
    // Add timestamp
    if (exportConfig.includeTimestamp) {
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth - exportConfig.marginRight - 50,
        pageHeight - exportConfig.marginBottom + 5
      );
    }
    
    // Save PDF
    doc.save(`${exportConfig.fileName || 'report'}.pdf`);
  }, [data, selectedColumns, exportConfig, includeTotals, totals]);
  
  // Main export handler
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          exportToExcel();
          break;
        case 'pdf':
          exportToPDF();
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
                selectedDataset={selectedDataset}
                onDatasetChange={setSelectedDataset}
              />
            </TabsContent>
            
            <TabsContent value="columns" className="space-y-4 p-4">
              <ColumnConfigurator
                tableSchema={tableSchema || null}
                selectedColumns={selectedColumns}
                onColumnToggle={handleColumnToggle}
                onColumnsReorder={handleColumnsReorder}
                groupingEnabled={groupingEnabled}
                onGroupingToggle={setGroupingEnabled}
                groupingColumns={groupingColumns}
                onGroupingColumnToggle={handleGroupingColumnToggle}
                includeTotals={includeTotals}
                onTotalsToggle={setIncludeTotals}
              />
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
            selectedColumns={selectedColumns}
            formatRules={formatRules}
            groupingEnabled={groupingEnabled}
            groupingColumns={groupingColumns}
            groupedData={groupedData}
            includeTotals={includeTotals}
            totals={totals}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onGroupExpand={handleGroupExpand}
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