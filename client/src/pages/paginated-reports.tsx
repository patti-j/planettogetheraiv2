import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePowerBIAuth, usePowerBIWorkspaces, usePowerBIDatasets, usePowerBIDataset, usePowerBIDatasetTables } from "@/hooks/use-powerbi-api";
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
import { FileText, Search, Download, Calendar, Database, Columns3, X, RefreshCw, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, Filter } from "lucide-react";
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
        // Default query for SQL
        const response = await fetch(`/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`);
        if (!response.ok) throw new Error('Failed to fetch schema');
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
  useEffect(() => {
    if (tableSchema) {
      setSelectedColumns(tableSchema.map(col => col.columnName));
    }
  }, [tableSchema]);

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
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Source Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Select Data Source
            </CardTitle>
            <CardDescription>Choose between Analytics SQL Database or Power BI Datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="source-select">Data Source</Label>
              <Select
                value={sourceType || ""}
                onValueChange={(value) => handleSourceTypeChange(value as SourceType)}
              >
                <SelectTrigger id="source-select" data-testid="select-source-type">
                  <SelectValue placeholder="Select a data source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sql">Analytics SQL Database</SelectItem>
                  <SelectItem value="powerbi">Power BI Datasets</SelectItem>
                </SelectContent>
              </Select>
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
                      if (value !== 'manual-entry') {
                        setSelectedPowerBITable(value);
                        setCurrentPage(1);
                        setSearchTerm("");
                        setColumnFilters({});
                      }
                    }}
                    disabled={loadingDatasetTables}
                  >
                    <SelectTrigger id="powerbi-table-select" data-testid="select-powerbi-table">
                      <SelectValue placeholder={loadingDatasetTables ? "Discovering tables..." : "Select or enter a table name..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetTables && datasetTables.length > 0 ? (
                        <>
                          {datasetTables.map((table: any) => (
                            <SelectItem key={table.name} value={table.name}>
                              {table.name} {table.columns?.length ? `(${table.columns.length} columns)` : ''}
                            </SelectItem>
                          ))}
                          <SelectItem value="manual-entry">
                            <span className="text-muted-foreground">Enter table name manually...</span>
                          </SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="manual-entry">
                            Enter table name manually
                          </SelectItem>
                          {!loadingDatasetTables && (
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              Auto-discovery unavailable. Enter table name below.
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Manual table name entry */}
                {(selectedPowerBITable === 'manual-entry' || (!datasetTables?.length && !loadingDatasetTables)) && (
                  <div className="max-w-md">
                    <Label htmlFor="manual-table-name">Enter Table Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="manual-table-name"
                        placeholder="e.g., Sales, Orders, Customers"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            setSelectedPowerBITable(e.currentTarget.value);
                            setCurrentPage(1);
                            setSearchTerm("");
                            setColumnFilters({});
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const input = document.getElementById('manual-table-name') as HTMLInputElement;
                          if (input?.value) {
                            setSelectedPowerBITable(input.value);
                            setCurrentPage(1);
                            setSearchTerm("");
                            setColumnFilters({});
                          }
                        }}
                      >
                        Use Table
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Common table names: Sales, Orders, Customers, Products, Date
                    </p>
                  </div>
                )}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!tableSchema} data-testid="button-column-selector">
                          <Columns3 className="w-4 h-4 mr-2" />
                          Columns ({selectedColumns.length}/{tableSchema?.length || 0})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Select Columns</h4>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAllColumns}
                                className="h-6 text-xs"
                                data-testid="button-select-all-columns"
                              >
                                All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeselectAllColumns}
                                className="h-6 text-xs"
                                data-testid="button-deselect-all-columns"
                              >
                                None
                              </Button>
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto space-y-2">
                            {tableSchema?.map((col) => (
                              <div key={col.columnName} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`col-${col.columnName}`}
                                  checked={selectedColumns.includes(col.columnName)}
                                  onCheckedChange={() => handleColumnToggle(col.columnName)}
                                  data-testid={`checkbox-column-${col.columnName}`}
                                />
                                <label
                                  htmlFor={`col-${col.columnName}`}
                                  className="text-sm flex-1 cursor-pointer"
                                >
                                  {col.columnName}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({col.dataType})
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
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
    </div>
  );
}
