import { memo, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Search, Filter, ChevronDown, ChevronRight as ChevronRightIcon, Loader2 } from "lucide-react";
import { FormatRule } from './FormatRulesPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
  onGroupExpand
}: ReportPreviewProps) => {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

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
    setResizingColumn(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column] || 150);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    onColumnResize(resizingColumn, newWidth);
  }, [resizingColumn, startX, startWidth, onColumnResize]);

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
  }, []);

  // Add mouse event listeners for column resizing
  useMemo(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
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
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
        
        {/* Search and filter controls */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
          
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
      
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : groupingEnabled && groupedData ? (
              renderGroupedData()
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedColumns.map((column) => (
                      <TableHead
                        key={column}
                        className="relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        style={{ width: columnWidths[column] || 150 }}
                        onClick={() => onSort(column)}
                        data-testid={`header-${column}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{column}</span>
                          {sortBy === column && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                        <div
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-500"
                          onMouseDown={(e) => handleMouseDown(e, column)}
                        />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((item, idx) => (
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
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {/* Pagination controls */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} results
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
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  let pageNum;
                  if (data.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.totalPages - 2) {
                    pageNum = data.totalPages - 4 + i;
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
                disabled={page === data.totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ReportPreview.displayName = 'ReportPreview';