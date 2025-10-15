import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FileText, Search, Download, Calendar, Database } from "lucide-react";
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

export default function PaginatedReports() {
  const [selectedTable, setSelectedTable] = useState<SQLTable | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch list of SQL Server tables
  const { data: tables, isLoading: loadingTables } = useQuery<SQLTable[]>({
    queryKey: ['/api/sql-tables'],
    queryFn: async () => {
      const response = await fetch('/api/sql-tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      return response.json();
    },
  });

  // Fetch table schema when table is selected
  const { data: tableSchema, isLoading: loadingSchema, error: schemaError } = useQuery<TableColumn[]>({
    queryKey: ['/api/sql-tables', selectedTable?.schemaName, selectedTable?.tableName, 'schema'],
    queryFn: async () => {
      if (!selectedTable) return [];
      const response = await fetch(`/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`);
      if (!response.ok) {
        throw new Error('Failed to fetch table schema');
      }
      return response.json();
    },
    enabled: !!selectedTable,
  });

  // Fetch paginated data
  const { data, isLoading, error } = useQuery<PaginatedReportData>({
    queryKey: [
      '/api/paginated-reports',
      selectedTable?.schemaName,
      selectedTable?.tableName,
      currentPage,
      pageSize,
      searchTerm,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      if (!selectedTable) {
        return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
      }
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        sortBy,
        sortOrder,
      });
      const response = await fetch(`/api/paginated-reports?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!selectedTable,
  });

  const handleTableSelect = (value: string) => {
    const [schemaName, tableName] = value.split('.');
    setSelectedTable({ schemaName, tableName });
    setCurrentPage(1);
    setSortBy("");
    setSearchTerm("");
  };

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

        {/* Table Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Select Table
            </CardTitle>
            <CardDescription>Choose a table from your SQL Server database</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {selectedTable && (
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
                    <Select value={sortBy} onValueChange={setSortBy} disabled={loadingSchema || !tableSchema}>
                      <SelectTrigger id="sortBy" data-testid="select-sort-by">
                        <SelectValue placeholder={loadingSchema ? "Loading columns..." : "Select column..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No sorting</SelectItem>
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
                        `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, data.total)} of ${data.total} records from ${selectedTable.schemaName}.${selectedTable.tableName}`
                      ) : (
                        "No data available"
                      )}
                    </CardDescription>
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
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {tableSchema.map((column) => (
                              <TableHead
                                key={column.columnName}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort(column.columnName)}
                                data-testid={`header-${column.columnName}`}
                              >
                                <div className="flex items-center gap-1">
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
                        </TableHeader>
                        <TableBody>
                          {data.items.map((item, index) => (
                            <TableRow key={index} data-testid={`row-report-${index}`}>
                              {tableSchema.map((column) => (
                                <TableCell
                                  key={column.columnName}
                                  data-testid={`cell-${column.columnName}-${index}`}
                                >
                                  {formatCellValue(item[column.columnName], column.dataType)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
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
