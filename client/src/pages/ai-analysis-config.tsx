import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Plus, 
  Calendar, 
  Clock, 
  Target, 
  Brain,
  Activity,
  Settings,
  History
} from "lucide-react";

interface AnalysisConfig {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'scheduled' | 'event_based' | 'threshold_based' | 'continuous';
  scheduleExpression: string;
  dataSources: string[];
  analysisScope: 'plant' | 'department' | 'resource' | 'global';
  lookbackHours: number;
  analysisPrompt: string;
  confidenceThreshold: number;
  minIntervalMinutes: number;
  maxAlertsPerRun: number;
  autoCreateAlerts: boolean;
  alertSeverity: string;
  alertType: string;
  lastAnalysisAt: string | null;
  lastAlertCreatedAt: string | null;
}

interface AnalysisRun {
  id: number;
  configId: number;
  configName: string;
  triggerReason: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  errorMessage: string | null;
  dataPointsAnalyzed: number;
  alertsCreated: number;
  analysisSummary: string | null;
  executionTimeMs: number | null;
}

export default function AIAnalysisConfig() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch analysis configurations
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['/api/alerts/ai-analysis-configs'],
    queryFn: () => apiRequest('/api/alerts/ai-analysis-configs')
  });

  // Fetch analysis history
  const { data: history = [] } = useQuery({
    queryKey: ['/api/alerts/ai-analysis-history', selectedConfigId],
    queryFn: () => apiRequest('/api/alerts/ai-analysis-history', {
      method: 'GET',
      params: selectedConfigId ? { configId: selectedConfigId } : {}
    }),
    enabled: showHistoryDialog
  });

  // Run analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: (configId: number) => 
      apiRequest(`/api/alerts/ai-analysis/${configId}/run`, { method: 'POST' }),
    onSuccess: (data, configId) => {
      toast({
        title: "Analysis Started",
        description: `AI analysis running for configuration ${configId}. Created ${data.alertsCreated} alerts.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/ai-analysis-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to run AI analysis. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Run scheduled analyses mutation  
  const runScheduledMutation = useMutation({
    mutationFn: () => apiRequest('/api/alerts/ai-analysis/run-scheduled', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Scheduled Analysis Complete",
        description: `Ran ${data.totalConfigs} analyses. Check history for details.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/ai-analysis-configs'] });
    }
  });

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled': return 'blue';
      case 'event_based': return 'green';
      case 'threshold_based': return 'orange';
      case 'continuous': return 'purple';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'running': return 'blue';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const formatLastRun = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Analysis Configuration</h1>
          <p className="text-muted-foreground">
            Configure when and how AI analyzes your manufacturing data to detect issues and opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistoryDialog(true)}
            variant="outline"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            onClick={() => runScheduledMutation.mutate()}
            disabled={runScheduledMutation.isPending}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Run All Due
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </div>
      </div>

      {/* Analysis Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">
              {configs.filter((c: AnalysisConfig) => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Analyses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {configs.filter((c: AnalysisConfig) => c.triggerType === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Automated schedules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Models Active</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {configs.filter((c: AnalysisConfig) => c.autoCreateAlerts).length}
            </div>
            <p className="text-xs text-muted-foreground">Auto-creating alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {configs.filter((c: AnalysisConfig) => c.lastAnalysisAt).length}
            </div>
            <p className="text-xs text-muted-foreground">Have run before</p>
          </CardContent>
        </Card>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading configurations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config: AnalysisConfig) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-${getTriggerTypeColor(config.triggerType)}-200`}>
                        {config.triggerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {config.scheduleExpression || 'Manual only'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Every {config.minIntervalMinutes}min minimum
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{config.analysisScope}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatLastRun(config.lastAnalysisAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAnalysisMutation.mutate(config.id)}
                          disabled={runAnalysisMutation.isPending}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Analysis History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analysis Run History</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alerts Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((run: AnalysisRun) => (
                  <TableRow key={run.id}>
                    <TableCell>{run.configName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.triggerReason}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(run.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {run.executionTimeMs ? `${Math.round(run.executionTimeMs / 1000)}s` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-${getStatusColor(run.status)}-200`}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.alertsCreated || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}