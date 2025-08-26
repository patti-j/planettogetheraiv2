import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
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
  Info,
  Menu,
  X
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Fetch all database tables
  const { data: tablesRaw = [], isLoading: tablesLoading, refetch: refetchTables } = useQuery({
    queryKey: ['/api/database/tables'],
  });
  const tables = tablesRaw as DatabaseTable[];

  // Fetch table schema when a table is selected
  const { data: tableSchemaRaw = [], isLoading: schemaLoading } = useQuery({
    queryKey: [`/api/database/tables/${selectedTable}/schema`],
    enabled: !!selectedTable
  });
  const tableSchema = tableSchemaRaw as TableColumn[];

  // Fetch table data when viewing data
  const { data: tableDataRaw, isLoading: dataLoading, refetch: refetchData } = useQuery({
    queryKey: [`/api/database/tables/${selectedTable}/data?page=${currentPage}&limit=${pageSize}`, searchTerm, sortBy, sortOrder, filters],
    enabled: !!selectedTable && viewMode === 'data'
  });
  const tableData = tableDataRaw as TableData;

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
    setMobileSheetOpen(false); // Close mobile sheet when table is selected
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
    table && table.name && table.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Tables List Component for reuse
  const TablesList = () => (
    <Card className="h-full">
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
      <CardContent className="h-[calc(100%-120px)] overflow-y-auto">
        <div className="space-y-2 mb-4">
          <Input
            key="mobile-table-search"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
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
  );

  return (
    <div className="container mx-auto p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 md:h-8 md:w-8" />
          Database Explorer
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
          Browse and analyze all database tables with real-time data viewing and export capabilities
        </p>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Tables {selectedTable && `(${selectedTable})`}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold mb-3">Database Tables</h2>
                  <Input
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {tablesLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading tables...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTables.map((table: DatabaseTable) => (
                        <button
                          key={table.name}
                          onClick={() => {
                            handleTableSelect(table.name);
                            setMobileSheetOpen(false);
                          }}
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
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {selectedTable && (
          <Card className="h-[calc(100vh-140px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg truncate">
                    <Table className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{selectedTable}</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Explore table structure and data
                  </CardDescription>
                </div>
                <div className="flex gap-1 ml-2">
                  <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                    <SelectTrigger className="w-16 h-8">
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
                    className="h-8"
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-3">
              <Tabs value={viewMode} onValueChange={(value: 'list' | 'schema' | 'data') => setViewMode(value)}>
                <TabsList className="mb-3 h-8">
                  <TabsTrigger value="schema" className="flex items-center gap-2 text-xs h-7">
                    <Info className="h-3 w-3" />
                    Schema
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2 text-xs h-7">
                    <Grid3x3 className="h-3 w-3" />
                    Data
                  </TabsTrigger>
                </TabsList>

                <div className="h-[calc(100%-60px)] overflow-auto">
                  <TabsContent value="schema" className="mt-0">
                    {schemaLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                        <p className="text-sm">Loading table schema...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="outline" className="text-xs">{tableSchema.length} columns</Badge>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <UITable>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Column</TableHead>
                                <TableHead className="text-xs">Type</TableHead>
                                <TableHead className="text-xs">Null</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableSchema.map((column: TableColumn) => (
                                <TableRow key={column.column_name}>
                                  <TableCell className="font-medium text-xs">{column.column_name}</TableCell>
                                  <TableCell className="text-xs">
                                    <Badge className={`${getDataTypeBadgeColor(column.data_type)} text-xs`}>
                                      {column.data_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">{column.is_nullable === 'YES' ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </UITable>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="data" className="mt-0">
                    <div className="space-y-3">
                      {/* Data Controls - Mobile Optimized */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <Input
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchData()}
                            className="h-8"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="text-xs">Refresh</span>
                          </Button>
                        </div>
                      </div>

                      {dataLoading ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                          <p className="text-sm">Loading data...</p>
                        </div>
                      ) : tableData?.data ? (
                        <div>
                          <div className="overflow-x-auto">
                            <UITable>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(tableData.data[0] || {}).map((key) => (
                                    <TableHead 
                                      key={key} 
                                      className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                      onClick={() => handleSort(key)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {key}
                                        {sortBy === key && (
                                          <span className="text-xs">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                          </span>
                                        )}
                                      </div>
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableData.data.map((row: any, index: number) => (
                                  <TableRow key={index}>
                                    {Object.values(row).map((value: any, cellIndex: number) => (
                                      <TableCell key={cellIndex} className="text-xs">
                                        <div className="max-w-32 truncate">
                                          {value !== null && value !== undefined ? String(value) : '-'}
                                        </div>
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </UITable>
                          </div>

                          {/* Mobile Pagination */}
                          {tableData.pagination && tableData.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Page {tableData.pagination.page} of {tableData.pagination.totalPages}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                  className="h-7 w-7 p-0"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.min(tableData.pagination.totalPages, currentPage + 1))}
                                  disabled={currentPage === tableData.pagination.totalPages}
                                  className="h-7 w-7 p-0"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-sm text-gray-500">No data found</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!selectedTable && (
          <Card className="h-[calc(100vh-140px)]">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
                <p className="text-gray-500 text-sm">Tap the Tables button to choose a table to explore</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)] w-full">
          {/* Tables List Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <TablesList />
          </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={75} minSize={60}>
          {!selectedTable ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
                  <p className="text-gray-500">Choose a table from the sidebar to view its schema and data</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
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

              <CardContent className="flex-1 overflow-hidden">
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
        </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}