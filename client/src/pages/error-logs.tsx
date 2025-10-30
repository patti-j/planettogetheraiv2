import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Search, XCircle } from "lucide-react";
import { format } from "date-fns";

interface ErrorLog {
  id: number;
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

interface ErrorReport {
  id: number;
  errorId: string;
  userDescription?: string;
  severity: string;
  reproductionSteps?: string;
  status: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ErrorLogsPage() {
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  // Fetch error logs
  const { data: errorLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<ErrorLog[]>({
    queryKey: [`/api/errors/logs?limit=100&resolved=${resolvedFilter === "all" ? "" : resolvedFilter}`],
  });

  // Fetch error reports
  const { data: errorReports = [], isLoading: reportsLoading } = useQuery<ErrorReport[]>({
    queryKey: ["/api/errors/reports"],
  });

  // Filter logs based on search term
  const filteredLogs = errorLogs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.errorId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "error": return "destructive";
      case "warning": return "secondary";
      default: return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return XCircle;
      case "error": return AlertTriangle;
      case "warning": return Clock;
      default: return CheckCircle;
    }
  };

  const handleMarkResolved = async (errorId: string) => {
    try {
      await fetch(`/api/errors/logs/${errorId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      refetchLogs();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            Error Logs & Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor system errors, reports, and health status
          </p>
        </div>
        <Button onClick={() => refetchLogs()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {errorLogs.filter(log => !log.resolved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {errorLogs.filter(log => log.severity === "critical").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorReports.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search errors by message, URL, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Errors</SelectItem>
            <SelectItem value="false">Unresolved</SelectItem>
            <SelectItem value="true">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
          <CardDescription>
            Detailed system error logs with stack traces and metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8">Loading error logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {errorLogs.length === 0 ? "No error logs found - system is running smoothly!" : "No errors match your search criteria"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const SeverityIcon = getSeverityIcon(log.severity);
                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedError?.id === log.id ? "border-primary bg-muted/50" : ""
                    }`}
                    onClick={() => setSelectedError(selectedError?.id === log.id ? null : log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <SeverityIcon className={`w-5 h-5 mt-0.5 ${
                          log.severity === "critical" ? "text-red-500" :
                          log.severity === "error" ? "text-orange-500" :
                          "text-yellow-500"
                        }`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(log.severity)}>
                              {log.severity.toUpperCase()}
                            </Badge>
                            {log.resolved && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                RESOLVED
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{log.message}</p>
                          <div className="text-xs text-muted-foreground">
                            <div>ID: {log.errorId}</div>
                            <div>URL: {log.url}</div>
                            {log.userId && <div>User: {log.userId}</div>}
                          </div>
                        </div>
                      </div>
                      {!log.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkResolved(log.errorId);
                          }}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                    
                    {selectedError?.id === log.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {log.stack && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Stack Trace:</h4>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                              {log.stack}
                            </pre>
                          </div>
                        )}
                        {log.componentStack && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Component Stack:</h4>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                              {log.componentStack}
                            </pre>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <strong>User Agent:</strong>
                            <div className="text-muted-foreground">{log.userAgent || "Not available"}</div>
                          </div>
                          <div>
                            <strong>Session ID:</strong>
                            <div className="text-muted-foreground">{log.sessionId || "Not available"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Reports Section */}
      {errorReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Reports</CardTitle>
            <CardDescription>
              User-submitted error reports and investigations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errorReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(report.severity)}>
                        {report.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{report.status.toUpperCase()}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm mb-2">Error ID: {report.errorId}</p>
                  {report.userDescription && (
                    <div className="mb-2">
                      <h5 className="font-medium text-sm">User Description:</h5>
                      <p className="text-sm text-muted-foreground">{report.userDescription}</p>
                    </div>
                  )}
                  {report.reproductionSteps && (
                    <div>
                      <h5 className="font-medium text-sm">Reproduction Steps:</h5>
                      <p className="text-sm text-muted-foreground">{report.reproductionSteps}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}