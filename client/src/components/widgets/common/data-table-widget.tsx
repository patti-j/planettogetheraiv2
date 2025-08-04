import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnConfig {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ActionConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
}

interface DataTableWidgetProps {
  title?: string;
  data: any[];
  columns: ColumnConfig[];
  
  // Features
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  selectable?: boolean;
  
  // Search configuration
  searchKeys?: string[];
  searchPlaceholder?: string;
  
  // Pagination
  pageSize?: number;
  showPagination?: boolean;
  
  // Actions
  actions?: ActionConfig[];
  bulkActions?: ActionConfig[];
  
  // Styling
  variant?: 'default' | 'compact' | 'striped';
  className?: string;
  
  // Callbacks
  onRowClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  
  // Loading state
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTableWidget({
  title,
  data = [],
  columns = [],
  searchable = true,
  sortable = true,
  filterable = false,
  paginated = true,
  selectable = false,
  searchKeys,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  showPagination = true,
  actions = [],
  bulkActions = [],
  variant = 'default',
  className = '',
  onRowClick,
  onSelectionChange,
  onRefresh,
  onExport,
  loading = false,
  emptyMessage = 'No data available'
}: DataTableWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm && searchable) {
      const keys = searchKeys || columns.map(col => col.key);
      filtered = filtered.filter(row =>
        keys.some(key => {
          const value = row[key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        filtered = filtered.filter(row => {
          const value = row[key];
          return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, searchTerm, columnFilters, searchKeys, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectRow = (row: any, checked: boolean) => {
    const newSelection = checked
      ? [...selectedRows, row]
      : selectedRows.filter(r => r !== row);
    
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...paginatedData] : [];
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const renderCell = (column: ColumnConfig, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    // Default rendering with some smart formatting
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'number' && column.key.includes('amount') || column.key.includes('price')) {
      return `$${value.toLocaleString()}`;
    }
    
    return value?.toString() || '-';
  };

  const renderToolbar = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        )}
        
        {filterable && columns.some(col => col.filterable) && (
          <div className="flex gap-2">
            {columns
              .filter(col => col.filterable)
              .map(column => {
                const uniqueValues = [...new Set(data.map(row => row[column.key]).filter(Boolean))];
                
                return (
                  <Select
                    key={column.key}
                    value={columnFilters[column.key] || 'all'}
                    onValueChange={(value) => setColumnFilters(prev => ({
                      ...prev,
                      [column.key]: value
                    }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          {column.header}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueValues.map(value => (
                        <SelectItem key={value} value={value.toString()}>
                          {value.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })}
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {bulkActions.length > 0 && selectedRows.length > 0 && (
          <div className="flex gap-1">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => action.onClick(selectedRows)}
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.label} ({selectedRows.length})
              </Button>
            ))}
          </div>
        )}
        
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
        
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        )}
      </div>
    </div>
  );

  const renderPagination = () => {
    if (!showPagination || !paginated || totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {renderToolbar()}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.width || ''} ${
                    column.sortable && sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                              ? 'text-primary' : 'text-muted-foreground'
                          }`} 
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                              ? 'text-primary' : 'text-muted-foreground'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && <TableHead className="w-12">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow 
                  key={index}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${
                    variant === 'striped' && index % 2 === 0 ? 'bg-muted/25' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row)}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell 
                      key={column.key}
                      className={`${
                        variant === 'compact' ? 'py-2' : 'py-3'
                      } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {renderCell(column, row)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                              className={action.variant === 'destructive' ? 'text-destructive' : ''}
                            >
                              <action.icon className="w-4 h-4 mr-2" />
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {renderPagination()}
    </div>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}