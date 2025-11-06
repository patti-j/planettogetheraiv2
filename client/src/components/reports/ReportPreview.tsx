import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Filter, ChevronDown, ChevronRight as ChevronRightIcon, Loader2, X } from "lucide-react";
import { FormatRule } from './FormatRulesPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

interface ReportPreviewProps {
  data: {
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | undefined;
  loading: boolean;
  selectedColumns: string[];
  formatRules: FormatRule[];
  groupingEnabled: boolean;
  groupingColumns: string[];
  groupedData: any;
  includeTotals: boolean;
  totals: Record<string, any>;
  columnWidths: Record<string, number>;
  onColumnResize: (column: string, width: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onGroupExpand?: (groupKey: string) => void;
  // New props for column filtering
  tableSchema?: TableColumn[] | null;
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (column: string, value: string) => void;
  onClearColumnFilter?: (column: string) => void;
  onClearAllFilters?: () => void;
}

export const ReportPreview = memo(({
  data,
  loading,
  selectedColumns,
  formatRules,
  groupingEnabled,
  groupingColumns,
  groupedData,
  includeTotals,
  totals,
  columnWidths,
  onColumnResize,
  searchTerm,
  onSearchChange,
  sortBy,
  sortOrder,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onGroupExpand,
  tableSchema,
  columnFilters = {},
  onColumnFilterChange,
  onClearColumnFilter,
  onClearAllFilters
}: ReportPreviewProps) => {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Get schema info for a column
  const getColumnSchema = useCallback((columnName: string): TableColumn | undefined => {
    return tableSchema?.find(col => col.columnName === columnName);
  }, [tableSchema]);

  // Format data type for display
  const formatDataType = useCallback((dataType: string): string => {
    // Return empty string if we don't know the type
    if (!dataType) return '';
    
    const type = dataType.toLowerCase();
    if (type.includes('int')) return 'Number';
    if (type.includes('decimal') || type.includes('numeric') || type.includes('float')) return 'Decimal';
    if (type.includes('date') || type.includes('time')) return 'Date/Time';
    if (type.includes('bit') || type.includes('bool')) return 'Boolean';
    if (type.includes('money')) return 'Currency';
    if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'Text';
    
    // If we don't recognize the type, return empty string
    return '';
  }, []);

  // Use server-side filtered data directly (no local filtering)
  const filteredData = useMemo(() => {
    if (!data?.items) return null;
    
    // Return server data as-is - all filtering happens on the server
    return {
      ...data,
      items: data.items,
      total: data.totalCount || data.total || data.items.length,
      totalPages: Math.ceil((data.totalCount || data.total || data.items.length) / pageSize)
    };
  }, [data, pageSize]);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some(filter => filter !== '');
  }, [columnFilters]);

  // Apply conditional formatting
  const getCellStyle = useCallback((column: string, value: any): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    formatRules.forEach(rule => {
      if (rule.column !== column) return;
      
      let matches = false;
      const numValue = parseFloat(value);
      const ruleValue = parseFloat(rule.value);
      const ruleValue2 = rule.value2 ? parseFloat(rule.value2) : 0;
      
      switch (rule.condition) {
        case 'equals':
          matches = value == rule.value;
          break;
        case 'greater':
          matches = !isNaN(numValue) && !isNaN(ruleValue) && numValue > ruleValue;
          break;
        case 'less':
          matches = !isNaN(numValue) && !isNaN(ruleValue) && numValue < ruleValue;
          break;
        case 'contains':
          matches = String(value).toLowerCase().includes(rule.value.toLowerCase());
          break;
        case 'between':
          matches = !isNaN(numValue) && !isNaN(ruleValue) && !isNaN(ruleValue2) &&
                   numValue >= Math.min(ruleValue, ruleValue2) && 
                   numValue <= Math.max(ruleValue, ruleValue2);
          break;
      }
      
      if (matches) {
        if (rule.backgroundColor) style.backgroundColor = rule.backgroundColor;
        if (rule.textColor) style.color = rule.textColor;
        if (rule.fontWeight) style.fontWeight = rule.fontWeight;
      }
    });
    
    return style;
  }, [formatRules]);

  // Format cell value
  const formatCellValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString();
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    // Stop propagation to prevent triggering column sort
    e.stopPropagation();
    e.preventDefault();
    
    setResizingColumn(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column] || 150);
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    onColumnResize(resizingColumn, newWidth);
  }, [resizingColumn, startX, startWidth, onColumnResize]);

  const handleMouseUp = useCallback(() => {
    if (resizingColumn) {
      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setResizingColumn(null);
    }
  }, [resizingColumn]);

  // Add mouse event listeners for column resizing
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Also listen for mouse leave to handle edge cases
      const handleMouseLeave = () => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  const renderGroupedData = () => {
    if (!groupedData || !groupedData.groups) return null;

    return (
      <div className="space-y-2">
        {groupedData.groups.map((group: any) => (
          <div key={group.groupKey} className="border rounded">
            <div
              className="flex items-center p-2 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onGroupExpand?.(group.groupKey)}
              data-testid={`group-header-${group.groupKey}`}
            >
              {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              <span className="ml-2 font-medium">
                {groupingColumns.map(col => `${col}: ${group.groupValues[col]}`).join(', ')}
              </span>
              {Object.entries(group.aggregates || {}).map(([col, value]) => (
                <span key={col} className="ml-4 text-sm text-gray-600">
                  {col}: {formatCellValue(value)}
                </span>
              ))}
            </div>
            {group.expanded && group.items?.length > 0 && (
              <div className="p-2">
                <Table>
                  <TableBody>
                    {group.items.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        {selectedColumns.map(column => (
                          <TableCell
                            key={column}
                            style={{
                              width: columnWidths[column] || 150,
                              ...getCellStyle(column, item[column])
                            }}
                          >
                            {formatCellValue(item[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-[70vh] max-h-[800px] min-h-[400px]">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Report Preview</CardTitle>
          {hasActiveFilters && onClearAllFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllFilters}
              data-testid="button-clear-all-filters"
            >
              <X className="mr-1 h-3 w-3" />
              Clear All Filters
            </Button>
          )}
        </div>
        
        {/* Active filters as badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(columnFilters).map(([column, value]) => {
              if (!value) return null;
              return (
                <Badge
                  key={column}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                  data-testid={`badge-filter-${column}`}
                >
                  <span className="font-medium">{column}:</span>
                  <span>{value}</span>
                  {onClearColumnFilter && (
                    <button
                      onClick={() => onClearColumnFilter(column)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`clear-filter-${column}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        )}
        
        {/* Page size control only - removed table-level search */}
        <div className="flex justify-end mt-4">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            data-testid="select-page-size"
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Table Container with proper scrolling */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full w-full p-4">
            <div className="min-w-full">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : groupingEnabled && groupedData ? (
                renderGroupedData()
              ) : filteredData && filteredData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No results found</p>
                  {hasActiveFilters && (
                    <p className="text-sm mt-2">
                      Try adjusting your filters or{' '}
                      {onClearAllFilters && (
                        <button
                          onClick={onClearAllFilters}
                          className="text-primary underline"
                        >
                          clear all filters
                        </button>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background border-b">
                      {/* First row: Column headers with data types */}
                      <TableRow>
                        {selectedColumns.map((column) => {
                          const schema = getColumnSchema(column);
                          return (
                            <TableHead
                              key={column}
                              className="relative hover:bg-gray-100 dark:hover:bg-gray-800 pb-1"
                              style={{ 
                                width: columnWidths[column] || 150,
                                userSelect: resizingColumn ? 'none' : 'auto'
                              }}
                              data-testid={`header-${column}`}
                            >
                              <div 
                                className="flex flex-col cursor-pointer pr-4"
                                onClick={() => onSort(column)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{column}</span>
                                  {sortBy === column && (
                                    <span className="ml-1">
                                      {sortOrder === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                                {schema && (
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    {formatDataType(schema.dataType)}
                                  </span>
                                )}
                              </div>
                              {/* Resize Handle */}
                              <div
                                className={`
                                  absolute -right-1 top-0 h-full w-2 cursor-col-resize 
                                  hover:bg-blue-500/30 transition-colors
                                  ${resizingColumn === column ? 'bg-blue-500/50' : ''}
                                `}
                                style={{
                                  padding: '0 3px',
                                  width: '8px',
                                  marginRight: '-3px'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, column)}
                                title="Drag to resize column"
                              >
                                <div className={`
                                  h-full w-0.5 mx-auto
                                  ${resizingColumn === column ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                                `} />
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                      {/* Second row: Filter inputs */}
                      {onColumnFilterChange && (
                        <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                          {selectedColumns.map((column) => (
                            <TableHead
                              key={`filter-${column}`}
                              className="p-1"
                              style={{ width: columnWidths[column] || 150 }}
                            >
                              <div className="relative">
                                <Input
                                  placeholder="Filter..."
                                  value={columnFilters[column] || ''}
                                  onChange={(e) => onColumnFilterChange(column, e.target.value)}
                                  className="h-8 text-sm pl-7 pr-7"
                                  data-testid={`filter-input-${column}`}
                                />
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                {columnFilters[column] && onClearColumnFilter && (
                                  <button
                                    onClick={() => onClearColumnFilter(column)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-destructive"
                                    data-testid={`clear-filter-input-${column}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      )}
                    </TableHeader>
                    <TableBody>
                      {filteredData?.items.map((item, idx) => (
                        <TableRow key={idx} data-testid={`row-${idx}`}>
                          {selectedColumns.map((column) => (
                            <TableCell
                              key={column}
                              style={{
                                width: columnWidths[column] || 150,
                                ...getCellStyle(column, item[column])
                              }}
                              data-testid={`cell-${idx}-${column}`}
                            >
                              {formatCellValue(item[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      
                      {/* Totals row */}
                      {includeTotals && totals && Object.keys(totals).length > 0 && (
                        <TableRow className="font-bold bg-gray-100 dark:bg-gray-900">
                          {selectedColumns.map((column) => (
                            <TableCell
                              key={column}
                              style={{ width: columnWidths[column] || 150 }}
                              data-testid={`total-${column}`}
                            >
                              {formatCellValue(totals[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        
        {/* Pagination controls - Always show to display total count */}
        {filteredData && (
          <div className="flex-shrink-0 border-t bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {filteredData.totalPages} • Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredData.total)} of {filteredData.total} total rows
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, filteredData.totalPages) }, (_, i) => {
                    let pageNum;
                    if (filteredData.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= filteredData.totalPages - 2) {
                      pageNum = filteredData.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === filteredData.totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ReportPreview.displayName = 'ReportPreview';