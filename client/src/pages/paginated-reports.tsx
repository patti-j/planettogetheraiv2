import { useState } from "react";
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
import { FileText, Search, Download, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PaginatedReportData {
  items: Array<{
    id: number;
    agentConnectionId: number;
    agentName?: string;
    actionType: string;
    endpoint?: string;
    method?: string;
    responseStatus?: number;
    executionTimeMs?: number;
    timestamp: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function PaginatedReports() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch paginated data
  const { data, isLoading, error } = useQuery<PaginatedReportData>({
    queryKey: ['/api/paginated-reports', currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        statusFilter,
        sortBy,
        sortOrder,
      });
      const response = await fetch(`/api/paginated-reports?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const getStatusBadge = (status?: number) => {
    if (!status) return <Badge variant="secondary">N/A</Badge>;
    if (status >= 200 && status < 300) return <Badge className="bg-green-600 dark:bg-green-700">Success</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="destructive">Client Error</Badge>;
    if (status >= 500) return <Badge variant="destructive">Server Error</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
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

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          data-testid="button-previous-page"
        />
      </PaginationItem>
    );

    // First page
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

    // Page numbers
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

    // Last page
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

    // Next button
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
                View and analyze agent activity reports with advanced filtering
              </p>
            </div>
          </div>
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <CardDescription>Refine your report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search actions..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success (2xx)</SelectItem>
                    <SelectItem value="client-error">Client Error (4xx)</SelectItem>
                    <SelectItem value="server-error">Server Error (5xx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy" data-testid="select-sort-by">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                    <SelectItem value="actionType">Action Type</SelectItem>
                    <SelectItem value="responseStatus">Status</SelectItem>
                    <SelectItem value="executionTimeMs">Execution Time</SelectItem>
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
                    `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, data.total)} of ${data.total} records`
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
            {error ? (
              <div className="text-center py-8 text-destructive" data-testid="text-error">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('id')}
                          data-testid="header-id"
                        >
                          ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('agentName')}
                          data-testid="header-agent"
                        >
                          Agent {sortBy === 'agentName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('actionType')}
                          data-testid="header-action"
                        >
                          Action Type {sortBy === 'actionType' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead data-testid="header-endpoint">Endpoint</TableHead>
                        <TableHead data-testid="header-method">Method</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('responseStatus')}
                          data-testid="header-status"
                        >
                          Status {sortBy === 'responseStatus' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('executionTimeMs')}
                          data-testid="header-execution-time"
                        >
                          Exec Time {sortBy === 'executionTimeMs' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('timestamp')}
                          data-testid="header-timestamp"
                        >
                          Timestamp {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <TableRow key={item.id} data-testid={`row-report-${item.id}`}>
                          <TableCell className="font-medium" data-testid={`text-id-${item.id}`}>
                            {item.id}
                          </TableCell>
                          <TableCell data-testid={`text-agent-${item.id}`}>
                            {item.agentName || `Agent #${item.agentConnectionId}`}
                          </TableCell>
                          <TableCell data-testid={`text-action-${item.id}`}>
                            <Badge variant="outline">{item.actionType}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground" data-testid={`text-endpoint-${item.id}`}>
                            {item.endpoint || '-'}
                          </TableCell>
                          <TableCell data-testid={`text-method-${item.id}`}>
                            {item.method ? (
                              <Badge variant="secondary" className="text-xs">
                                {item.method}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-status-${item.id}`}>
                            {getStatusBadge(item.responseStatus)}
                          </TableCell>
                          <TableCell data-testid={`text-exec-time-${item.id}`}>
                            {item.executionTimeMs ? `${item.executionTimeMs}ms` : '-'}
                          </TableCell>
                          <TableCell className="text-xs" data-testid={`text-timestamp-${item.id}`}>
                            {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {renderPaginationItems()}
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-data">
                No data available. Try adjusting your filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
