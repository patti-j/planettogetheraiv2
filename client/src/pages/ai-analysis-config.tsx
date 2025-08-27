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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    triggerType: 'scheduled' as const,
    scheduleExpression: '0 */6 * * *', // Every 6 hours
    dataSources: [] as string[],
    analysisScope: 'global' as const,
    lookbackHours: 24,
    analysisPrompt: '',
    confidenceThreshold: 0.8,
    minIntervalMinutes: 60,
    maxAlertsPerRun: 10,
    autoCreateAlerts: true,
    alertSeverity: 'medium',
    alertType: 'operational'
  });
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

  // Create configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest('/api/alerts/ai-analysis-configs', { 
        method: 'POST', 
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Configuration Created",
        description: "AI analysis configuration created successfully.",
      });
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        isActive: true,
        triggerType: 'scheduled',
        scheduleExpression: '0 */6 * * *',
        dataSources: [],
        analysisScope: 'global',
        lookbackHours: 24,
        analysisPrompt: '',
        confidenceThreshold: 0.8,
        minIntervalMinutes: 60,
        maxAlertsPerRun: 10,
        autoCreateAlerts: true,
        alertSeverity: 'medium',
        alertType: 'operational'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/ai-analysis-configs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create configuration. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateConfig = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a configuration name.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.analysisPrompt.trim()) {
      toast({
        title: "Validation Error", 
        description: "Please enter an analysis prompt.",
        variant: "destructive",
      });
      return;
    }
    createConfigMutation.mutate(formData);
  };

  const presetSchedules = [
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Every 12 hours", value: "0 */12 * * *" },
    { label: "Daily at 6 AM", value: "0 6 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
    { label: "Weekly on Sunday", value: "0 0 * * 0" },
  ];

  const dataSources = [
    "production_orders",
    "operations", 
    "resources",
    "quality_data",
    "inventory_levels",
    "schedule_performance",
    "equipment_status",
    "workforce_data"
  ];

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
            <Wand2 className="h-4 w-4 text-muted-foreground" />
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

      {/* Create Configuration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create AI Analysis Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Line Performance Analysis"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this analysis will monitor and detect..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Enable this configuration</Label>
              </div>
            </div>

            {/* Trigger Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trigger & Scheduling</h3>
              
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select 
                  value={formData.triggerType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled (Time-based)</SelectItem>
                    <SelectItem value="event_based">Event-based (Data changes)</SelectItem>
                    <SelectItem value="threshold_based">Threshold-based (Metrics)</SelectItem>
                    <SelectItem value="continuous">Continuous (Real-time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.triggerType === 'scheduled' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedulePreset">Schedule Preset</Label>
                    <Select 
                      value={formData.scheduleExpression} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleExpression: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a preset schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {presetSchedules.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleExpression">Custom Cron Expression</Label>
                    <Input
                      id="scheduleExpression"
                      placeholder="0 */6 * * * (every 6 hours)"
                      value={formData.scheduleExpression}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleExpression: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute hour day month weekday. Examples: "0 */6 * * *" (every 6 hours), "0 9 * * 1-5" (weekdays at 9 AM)
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minIntervalMinutes">Minimum Interval (minutes)</Label>
                  <Input
                    id="minIntervalMinutes"
                    type="number"
                    min="1"
                    value={formData.minIntervalMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, minIntervalMinutes: parseInt(e.target.value) || 60 }))}
                  />
                  <p className="text-xs text-muted-foreground">Prevents too frequent analysis runs</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lookbackHours">Data Lookback (hours)</Label>
                  <Input
                    id="lookbackHours"
                    type="number"
                    min="1"
                    value={formData.lookbackHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, lookbackHours: parseInt(e.target.value) || 24 }))}
                  />
                  <p className="text-xs text-muted-foreground">How far back to analyze data</p>
                </div>
              </div>
            </div>

            {/* Data Sources & Scope */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Sources & Scope</h3>
              
              <div className="space-y-2">
                <Label htmlFor="analysisScope">Analysis Scope</Label>
                <Select 
                  value={formData.analysisScope} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, analysisScope: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (All Plants)</SelectItem>
                    <SelectItem value="plant">Plant-specific</SelectItem>
                    <SelectItem value="department">Department-specific</SelectItem>
                    <SelectItem value="resource">Resource-specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Sources to Analyze</Label>
                <div className="grid grid-cols-2 gap-2">
                  {dataSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={source}
                        checked={formData.dataSources.includes(source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              dataSources: [...prev.dataSources, source] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              dataSources: prev.dataSources.filter(s => s !== source) 
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={source} className="text-sm capitalize">
                        {source.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analysis Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Analysis Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="analysisPrompt">Analysis Prompt</Label>
                <Textarea
                  id="analysisPrompt"
                  placeholder="Analyze production data for efficiency issues, quality problems, and optimization opportunities..."
                  value={formData.analysisPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, analysisPrompt: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what the AI should look for and analyze in the data
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                  <Input
                    id="confidenceThreshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.confidenceThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) || 0.8 }))}
                  />
                  <p className="text-xs text-muted-foreground">0.0 to 1.0 (higher = more certain)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAlertsPerRun">Max Alerts per Run</Label>
                  <Input
                    id="maxAlertsPerRun"
                    type="number"
                    min="1"
                    value={formData.maxAlertsPerRun}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAlertsPerRun: parseInt(e.target.value) || 10 }))}
                  />
                  <p className="text-xs text-muted-foreground">Prevents alert flooding</p>
                </div>
              </div>
            </div>

            {/* Alert Generation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alert Generation</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoCreateAlerts"
                  checked={formData.autoCreateAlerts}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoCreateAlerts: checked }))}
                />
                <Label htmlFor="autoCreateAlerts">Automatically create alerts from analysis</Label>
              </div>

              {formData.autoCreateAlerts && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alertSeverity">Default Alert Severity</Label>
                    <Select 
                      value={formData.alertSeverity} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, alertSeverity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertType">Default Alert Type</Label>
                    <Select 
                      value={formData.alertType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, alertType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={createConfigMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConfig}
                disabled={createConfigMutation.isPending}
              >
                {createConfigMutation.isPending ? "Creating..." : "Create Configuration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}