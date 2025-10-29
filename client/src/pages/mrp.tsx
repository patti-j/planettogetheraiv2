import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, PlayCircle, CheckCircle, Clock, BarChart3, Calendar, Package, Zap, Star, Search, Download } from "lucide-react";
import { MrpRun, MrpRequirement, MrpActionMessage, MasterProductionSchedule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { MrpRunDialog } from "@/components/mrp/mrp-run-dialog";
import { MrpRequirementsGrid } from "@/components/mrp/mrp-requirements-grid";
import { MrpActionMessagesPanel } from "@/components/mrp/mrp-action-messages-panel";
import { MasterProductionSchedulePanel } from "@/components/mrp/master-production-schedule-panel";

export default function MrpPage() {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const queryClient = useQueryClient();
  
  // Saved forecasts state
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const [forecastSearch, setForecastSearch] = useState("");
  const [selectedForecast, setSelectedForecast] = useState<any>(null);
  const [showForecastTable, setShowForecastTable] = useState(false);

  // Fetch MRP runs
  const { data: mrpRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ["/api/mrp/runs"],
  });

  // Fetch latest MRP run details
  const { data: latestRun, isLoading: latestRunLoading } = useQuery({
    queryKey: ["/api/mrp/runs", "latest"],
    enabled: mrpRuns.length > 0,
  });

  // Fetch requirements for selected run
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ["/api/mrp/requirements", selectedRunId],
    enabled: !!selectedRunId,
  });

  // Fetch action messages for selected run
  const { data: actionMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/mrp/action-messages", selectedRunId],
    enabled: !!selectedRunId,
  });

  // Fetch master production schedule
  const { data: mps = [], isLoading: mpsLoading } = useQuery({
    queryKey: ["/api/mrp/master-production-schedule"],
  });
  
  // Fetch saved forecasts
  const { data: savedForecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ["/api/forecasting/saved-forecasts"],
    enabled: showForecastDialog,
  });

  // Create new MRP run
  const createRunMutation = useMutation({
    mutationFn: (runData: any) => apiRequest("/api/mrp/runs", "POST", runData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/runs"] });
      toast({ title: "MRP run started successfully" });
      setShowRunDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to start MRP run", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Execute MRP run
  const executeRunMutation = useMutation({
    mutationFn: (runId: number) => apiRequest(`/api/mrp/runs/${runId}/execute`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mrp/runs"] });
      toast({ title: "MRP calculation started" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to execute MRP run", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "running":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Requirements Planning</h1>
          <p className="text-muted-foreground">
            Plan and manage material requirements across your manufacturing operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForecastDialog(true)} variant="outline" className="gap-2">
            <Star className="h-4 w-4" />
            Load Forecast
          </Button>
          <Button onClick={() => setShowRunDialog(true)} className="gap-2">
            <Zap className="h-4 w-4" />
            New MRP Run
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mrpRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              {mrpRuns.filter((run: MrpRun) => run.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRun?.processedItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {latestRun?.totalItems || 0} total items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Messages</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionMessages.filter((msg: MrpActionMessage) => msg.status === "open").length}
            </div>
            <p className="text-xs text-muted-foreground">
              require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRun ? formatDate(new Date(latestRun.createdAt)) : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestRun?.status && (
                <Badge className={getStatusColor(latestRun.status)}>
                  {latestRun.status}
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">MRP Runs</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="messages">Action Messages</TabsTrigger>
          <TabsTrigger value="mps">Master Production Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MRP Execution History</CardTitle>
              <CardDescription>
                View and manage your MRP calculation runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runsLoading ? (
                  <div className="text-center py-8">Loading runs...</div>
                ) : mrpRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No MRP runs found. Create your first run to get started.
                  </div>
                ) : (
                  mrpRuns.map((run: MrpRun) => (
                    <div 
                      key={run.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(run.status)}
                        <div>
                          <div className="font-medium">{run.runNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {run.description || "No description"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {run.processedItems}/{run.totalItems} items
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(new Date(run.createdAt))}
                          </div>
                        </div>
                        {run.status === "planning" && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              executeRunMutation.mutate(run.id);
                            }}
                            disabled={executeRunMutation.isPending}
                          >
                            Execute
                          </Button>
                        )}
                        {run.processedItems > 0 && (
                          <Progress 
                            value={(run.processedItems / run.totalItems) * 100} 
                            className="w-20"
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          {selectedRunId ? (
            <MrpRequirementsGrid 
              requirements={requirements} 
              isLoading={requirementsLoading}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Select an MRP run to view requirements
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {selectedRunId ? (
            <MrpActionMessagesPanel 
              messages={actionMessages} 
              isLoading={messagesLoading}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Select an MRP run to view action messages
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mps" className="space-y-4">
          <MasterProductionSchedulePanel 
            schedule={mps} 
            isLoading={mpsLoading}
          />
        </TabsContent>
      </Tabs>

      {showRunDialog && (
        <MrpRunDialog 
          open={showRunDialog}
          onOpenChange={setShowRunDialog}
          onSubmit={(data) => createRunMutation.mutate(data)}
          isSubmitting={createRunMutation.isPending}
        />
      )}
      
      {/* Forecast Selection Dialog */}
      <Dialog open={showForecastDialog} onOpenChange={setShowForecastDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Saved Forecast</DialogTitle>
            <DialogDescription>
              Select a saved forecast to view or use for material planning
            </DialogDescription>
          </DialogHeader>
          
          {/* Search Box */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forecasts..."
              value={forecastSearch}
              onChange={(e) => setForecastSearch(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {/* Forecast List */}
          {forecastsLoading ? (
            <div className="text-center py-8">Loading saved forecasts...</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {savedForecasts
                .filter((forecast: any) => 
                  forecast.name.toLowerCase().includes(forecastSearch.toLowerCase()) ||
                  (forecast.description && forecast.description.toLowerCase().includes(forecastSearch.toLowerCase()))
                )
                .map((forecast: any) => (
                  <Card 
                    key={forecast.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setSelectedForecast(forecast);
                      setShowForecastDialog(false);
                      setShowForecastTable(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium">{forecast.name}</h4>
                          {forecast.description && (
                            <p className="text-sm text-muted-foreground">{forecast.description}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Model: {forecast.modelType || "N/A"}</span>
                            <span>Period: {forecast.forecastDays} days</span>
                            <span>Items: {forecast.forecastedItems?.length || 0}</span>
                            <span>Created: {new Date(forecast.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {savedForecasts.filter((forecast: any) => 
                forecast.name.toLowerCase().includes(forecastSearch.toLowerCase()) ||
                (forecast.description && forecast.description.toLowerCase().includes(forecastSearch.toLowerCase()))
              ).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No saved forecasts found
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Forecast Table Dialog */}
      {selectedForecast && (
        <Dialog open={showForecastTable} onOpenChange={setShowForecastTable}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedForecast.name}</DialogTitle>
              <DialogDescription>
                {selectedForecast.description || "Forecast data table"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Forecast Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Model Type</p>
                  <p className="text-sm text-muted-foreground">{selectedForecast.modelType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Forecast Period</p>
                  <p className="text-sm text-muted-foreground">{selectedForecast.forecastDays} days</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Items</p>
                  <p className="text-sm text-muted-foreground">{selectedForecast.forecastedItems?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Accuracy (MAPE)</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedForecast.metrics?.mape ? `${selectedForecast.metrics.mape.toFixed(2)}%` : "N/A"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Forecast Data Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Forecast Data</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Export as CSV
                        const forecastData = selectedForecast.forecastData?.forecast || selectedForecast.forecastData;
                        if (!forecastData) return;
                        
                        const csv = [
                          ["Date", "Forecast Value", "Lower Bound", "Upper Bound"].join(","),
                          ...forecastData.map((row: any) => 
                            [
                              new Date(row.date).toLocaleDateString(),
                              row.value || row.forecast,
                              row.lower,
                              row.upper
                            ].join(",")
                          )
                        ].join("\n");
                        
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selectedForecast.name.replace(/[^a-z0-9]/gi, '_')}_forecast.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: "Success",
                          description: "Forecast exported as CSV"
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Forecast Value</TableHead>
                        <TableHead className="text-right">Lower Bound</TableHead>
                        <TableHead className="text-right">Upper Bound</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const forecastData = selectedForecast.forecastData?.forecast || selectedForecast.forecastData;
                        if (!forecastData || !Array.isArray(forecastData)) {
                          return (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No forecast data available
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return forecastData.slice(0, 50).map((row: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(row.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(row.value || row.forecast)?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.lower?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.upper?.toFixed(2) || "0.00"}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                  {(() => {
                    const forecastData = selectedForecast.forecastData?.forecast || selectedForecast.forecastData;
                    if (forecastData && forecastData.length > 50) {
                      return (
                        <div className="text-center text-sm text-muted-foreground py-2 border-t">
                          Showing first 50 of {forecastData.length} rows. Export to view all data.
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}