import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Wrench, Building, Package, Settings, ChevronDown, Sparkles, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import AIAnalyticsManager from "@/components/ai-analytics-manager";
import AnalyticsWidget from "@/components/analytics-widget";
import Sidebar from "@/components/sidebar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ReportConfig } from "@shared/schema";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
}

export default function Reports() {
  const [widgets, setWidgets] = useState<AnalyticsWidget[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['/api/capabilities'],
  });

  const { data: reportConfigs = [] } = useQuery({
    queryKey: ['/api/report-configs'],
  });

  // Load selected config
  const { data: selectedConfig } = useQuery({
    queryKey: ['/api/report-configs', selectedConfigId],
    enabled: !!selectedConfigId,
  });

  // Create report config mutation
  const createConfigMutation = useMutation({
    mutationFn: async (config: { name: string; description: string; configuration: any }) => {
      return await apiRequest('POST', '/api/report-configs', config);
    },
    onSuccess: (newConfig) => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-configs'] });
      setSelectedConfigId(newConfig.id);
      setShowConfigDialog(false);
      setConfigName("");
      setConfigDescription("");
      toast({
        title: "Success",
        description: "Report configuration created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report configuration",
        variant: "destructive",
      });
    },
  });

  // Set default config mutation
  const setDefaultConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('POST', `/api/report-configs/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-configs'] });
      toast({
        title: "Success",
        description: "Default report configuration updated",
      });
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, configuration }: { id: number; configuration: any }) => {
      return await apiRequest('PUT', `/api/report-configs/${id}`, { configuration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-configs'] });
      toast({
        title: "Success",
        description: "Report configuration updated",
      });
    },
  });

  // AI widget creation mutation
  const createAIWidgetsMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return await apiRequest('POST', '/api/ai-agent', {
        message: `Create analytics widgets: ${prompt}`,
      });
    },
    onSuccess: (response) => {
      if (response.success && response.data?.widgets) {
        const newWidgets = response.data.widgets.map((widget: any) => ({
          ...widget,
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        setWidgets(prev => [...prev, ...newWidgets]);
        toast({
          title: "Success",
          description: "AI widgets created successfully",
        });
      }
      setShowAIDialog(false);
      setAiPrompt("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create AI widgets",
        variant: "destructive",
      });
    },
  });

  // Initialize default widgets or load from selected config
  useEffect(() => {
    if (selectedConfig && selectedConfig.configuration?.widgets) {
      setWidgets(selectedConfig.configuration.widgets);
    } else {
      // Default widgets
      const defaultWidgets: AnalyticsWidget[] = [
        {
          id: "1",
          title: "Production Overview",
          type: "metric",
          data: {
            value: jobs.length,
            label: "Total Jobs",
            change: "+12%",
            icon: "package"
          },
          visible: true,
          position: { x: 0, y: 0 },
          size: { width: 300, height: 120 },
          config: { color: "blue" }
        },
        {
          id: "2",
          title: "Resource Utilization",
          type: "progress",
          data: {
            value: 85,
            max: 100,
            label: "Average Utilization",
            color: "green"
          },
          visible: true,
          position: { x: 320, y: 0 },
          size: { width: 300, height: 120 },
          config: { showPercentage: true }
        },
        {
          id: "3",
          title: "Operations Status",
          type: "chart",
          data: {
            labels: ["Completed", "In Progress", "Pending"],
            datasets: [{
              data: [
                operations.filter(op => op.status === "completed").length,
                operations.filter(op => op.status === "In-Progress").length,
                operations.filter(op => op.status === "pending").length
              ],
              backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b"]
            }]
          },
          visible: true,
          position: { x: 0, y: 140 },
          size: { width: 400, height: 300 },
          config: { chartType: "doughnut" }
        },
        {
          id: "4",
          title: "Job Priority Distribution",
          type: "table",
          data: {
            headers: ["Priority", "Count", "Percentage"],
            rows: [
              ["High", jobs.filter(j => j.priority === "high").length, "25%"],
              ["Medium", jobs.filter(j => j.priority === "medium").length, "50%"],
              ["Low", jobs.filter(j => j.priority === "low").length, "25%"]
            ]
          },
          visible: true,
          position: { x: 420, y: 140 },
          size: { width: 350, height: 200 },
          config: { striped: true }
        }
      ];
      
      setWidgets(defaultWidgets);
    }
  }, [jobs, operations, selectedConfig]);

  // Save widget configuration when widgets change
  useEffect(() => {
    if (selectedConfigId && widgets.length > 0) {
      const saveConfiguration = async () => {
        try {
          await updateConfigMutation.mutateAsync({
            id: selectedConfigId,
            configuration: { widgets }
          });
        } catch (error) {
          // Silent fail for auto-save
        }
      };
      
      const debounceTimer = setTimeout(saveConfiguration, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [widgets, selectedConfigId]);

  // Simplified drag handling for reports page
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleWidgetCreate = (widget: AnalyticsWidget) => {
    setWidgets(prev => [...prev, widget]);
  };

  const handleWidgetUpdate = (id: string, updates: Partial<AnalyticsWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, ...updates } : widget
    ));
  };

  const handleWidgetRemove = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handlePositionChange = (id: string, position: { x: number; y: number }) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, position } : widget
    ));
  };

  const handleRemove = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handleCreateConfig = () => {
    if (!configName.trim()) return;
    
    createConfigMutation.mutate({
      name: configName,
      description: configDescription,
      configuration: { widgets }
    });
  };

  const handleCreateAIWidgets = () => {
    if (!aiPrompt.trim()) return;
    
    createAIWidgetsMutation.mutate(aiPrompt);
  };

  const selectedConfigName = selectedConfig?.name || reportConfigs.find(c => c.isDefault)?.name || "Default Report";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create, view, and export comprehensive manufacturing reports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between">
                    {selectedConfigName}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {reportConfigs.map((config) => (
                    <DropdownMenuItem
                      key={config.id}
                      onClick={() => setSelectedConfigId(config.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{config.name}</span>
                      {config.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowConfigDialog(true)}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Reports
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {widgets.length > 0 && (
                <>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={() => {
                      const reportData = JSON.stringify(widgets, null, 2);
                      const blob = new Blob([reportData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedConfigName || 'report'}-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => setShowAIDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Create
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {widgets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reports Created</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get started by creating your first report widget
                </p>
                <Button
                  onClick={() => setShowAIDialog(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {widgets.filter(widget => widget.visible).map((widget) => (
                  <div
                    key={widget.id}
                    className="h-80"
                  >
                    <AnalyticsWidget
                      widget={widget}
                      onToggle={() => handleWidgetUpdate(widget.id, { visible: !widget.visible })}
                      onRemove={() => handleRemove(widget.id)}
                      onEdit={() => {}}
                      onResize={(id, size) => handleWidgetUpdate(id, { size })}
                      onPositionChange={(id, position) => handlePositionChange(id, position)}
                      jobs={jobs}
                      operations={operations}
                      resources={resources}
                      metrics={{}}
                      layoutMode="grid"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      <AIAnalyticsManager
        open={showManager}
        onOpenChange={setShowManager}
        onWidgetCreate={handleWidgetCreate}
        currentWidgets={widgets}
        onWidgetUpdate={setWidgets}
      />

      {/* Report Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-name">Report Name</Label>
              <Input
                id="config-name"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Enter report name..."
              />
            </div>
            <div>
              <Label htmlFor="config-description">Description</Label>
              <Textarea
                id="config-description"
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowConfigDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConfig}
                disabled={!configName.trim() || createConfigMutation.isPending}
              >
                {createConfigMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Creation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              AI Widget Creation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Describe the widgets you want to create</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Create a performance dashboard showing job completion rates, resource efficiency metrics, and quality control statistics'"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAIDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAIWidgets}
                disabled={!aiPrompt.trim() || createAIWidgetsMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {createAIWidgetsMutation.isPending ? "Creating..." : "Create Widgets"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}