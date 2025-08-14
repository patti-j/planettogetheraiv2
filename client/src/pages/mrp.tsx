import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, PlayCircle, CheckCircle, Clock, BarChart3, Calendar, Package, Zap } from "lucide-react";
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
        <Button onClick={() => setShowRunDialog(true)} className="gap-2">
          <Zap className="h-4 w-4" />
          New MRP Run
        </Button>
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
    </div>
  );
}