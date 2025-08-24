import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Database, 
  Table, 
  Download, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FileJson,
  Loader2,
  Grid3x3,
  List,
  Info
} from 'lucide-react';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DatabaseTable {
  name: string;
  schema: string;
}

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  ordinal_position: number;
}

interface TableData {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DatabaseExplorer() {
  const { toast } = useToast();
  
  // State management
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'schema' | 'data'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  // Fetch all database tables
  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useQuery({
    queryKey: ['/api/database/tables'],
  });

  // Fetch table schema when a table is selected
  const { data: tableSchema = [], isLoading: schemaLoading } = useQuery({
    queryKey: ['/api/database/tables', selectedTable, 'schema'],
    enabled: !!selectedTable
  });

  // Fetch table data when viewing data
  const { data: tableData, isLoading: dataLoading, refetch: refetchData } = useQuery({
    queryKey: ['/api/database/tables', selectedTable, 'data', currentPage, pageSize, searchTerm, sortBy, sortOrder, filters],
    enabled: !!selectedTable && viewMode === 'data'
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async ({ tableName, format }: { tableName: string; format: 'csv' | 'json' }) => {
      const response = await apiRequest('GET', `/api/database/tables/${tableName}/export?format=${format}`);
      return await response.json();
    },
    onSuccess: (data) => {
      // Create and download file
      const blob = new Blob([data.data], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${data.filename} has been downloaded.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export table data",
        variant: "destructive"
      });
    }
  });

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setViewMode('schema');
    setCurrentPage(1);
    setFilters({});
    setSortBy('');
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[column] = value;
      } else {
        delete newFilters[column];
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter tables based on search
  const filteredTables = tables.filter((table: DatabaseTable) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get data type badge color
  const getDataTypeBadgeColor = (dataType: string) => {
    if (dataType.includes('text') || dataType.includes('varchar') || dataType.includes('character')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (dataType.includes('integer') || dataType.includes('bigint') || dataType.includes('numeric')) {
      return 'bg-green-100 text-green-800';
    }
    if (dataType.includes('timestamp') || dataType.includes('date') || dataType.includes('time')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (dataType.includes('boolean')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Explorer
        </h1>
        <p className="text-gray-600 mt-2">
          Browse and analyze all database tables with real-time data viewing and export capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tables List Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Table className="h-5 w-5" />
                Database Tables
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchTables()}
                  className="ml-auto h-6 w-6"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {tables.length} tables found
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>
              
              {tablesLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading tables...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTables.map((table: DatabaseTable) => (
                    <button
                      key={table.name}
                      onClick={() => handleTableSelect(table.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedTable === table.name
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Table className="h-4 w-4" />
                      <span className="text-sm font-medium truncate">{table.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!selectedTable ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
                  <p className="text-gray-500">Choose a table from the sidebar to view its schema and data</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      {selectedTable}
                    </CardTitle>
                    <CardDescription>
                      Explore table structure and data
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTable('')}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => exportMutation.mutate({ tableName: selectedTable, format: exportFormat })}
                      disabled={exportMutation.isPending}
                      size="sm"
                    >
                      {exportMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs value={viewMode} onValueChange={(value: 'list' | 'schema' | 'data') => setViewMode(value)}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="schema" className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Schema
                    </TabsTrigger>
                    <TabsTrigger value="data" className="flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4" />
                      Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="schema">
                    {schemaLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Loading table schema...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="outline">{tableSchema.length} columns</Badge>
                        </div>
                        
                        <UITable>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Column Name</TableHead>
                              <TableHead>Data Type</TableHead>
                              <TableHead>Nullable</TableHead>
                              <TableHead>Default</TableHead>
                              <TableHead>Max Length</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableSchema.map((column: TableColumn) => (
                              <TableRow key={column.column_name}>
                                <TableCell className="font-medium">{column.column_name}</TableCell>
                                <TableCell>
                                  <Badge className={getDataTypeBadgeColor(column.data_type)}>
                                    {column.data_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{column.is_nullable === 'YES' ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {column.column_default || '-'}
                                </TableCell>
                                <TableCell>{column.character_maximum_length || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </UITable>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="data">
                    <div className="space-y-4">
                      {/* Data Controls */}
                      <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                          />
                          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchData()}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      </div>

                      {/* Data Table */}
                      {dataLoading ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p>Loading table data...</p>
                        </div>
                      ) : tableData && tableData.data.length > 0 ? (
                        <div className="space-y-4">
                          <div className="overflow-x-auto border rounded-lg">
                            <UITable>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(tableData.data[0]).map((column) => (
                                    <TableHead 
                                      key={column}
                                      className="cursor-pointer hover:bg-gray-50"
                                      onClick={() => handleSort(column)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {column}
                                        {sortBy === column && (
                                          <span className="text-xs">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                          </span>
                                        )}
                                      </div>
                                    </TableHead>
                                  ))}
                                </TableRow>
                                {/* Filter Row */}
                                <TableRow className="bg-gray-50/50">
                                  {Object.keys(tableData.data[0]).map((column) => (
                                    <TableHead key={`filter-${column}`} className="p-2">
                                      <Input
                                        placeholder={`Filter ${column}...`}
                                        value={filters[column] || ''}
                                        onChange={(e) => handleFilterChange(column, e.target.value)}
                                        className="h-7 text-xs"
                                      />
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableData.data.map((row: any, index: number) => (
                                  <TableRow key={index}>
                                    {Object.keys(row).map((column) => (
                                      <TableCell key={column} className="max-w-48 truncate">
                                        {row[column] !== null && row[column] !== undefined 
                                          ? String(row[column])
                                          : '-'
                                        }
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </UITable>
                          </div>

                          {/* Pagination */}
                          {tableData.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                Showing {((tableData.pagination.page - 1) * tableData.pagination.limit) + 1} to{' '}
                                {Math.min(tableData.pagination.page * tableData.pagination.limit, tableData.pagination.total)} of{' '}
                                {tableData.pagination.total} records
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                                <span className="text-sm">
                                  Page {tableData.pagination.page} of {tableData.pagination.totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.min(tableData.pagination.totalPages, currentPage + 1))}
                                  disabled={currentPage === tableData.pagination.totalPages}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Eye className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
                          <p className="text-gray-500">This table appears to be empty or your filters don't match any records</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}