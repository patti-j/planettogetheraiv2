import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Maximize2, Minimize2, FolderOpen, Sparkles, Eye, EyeOff } from "lucide-react";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
import EnhancedDashboardManager from "@/components/dashboard-manager-enhanced";
import AnalyticsWidget from "@/components/analytics-widget";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  isStandard?: boolean;
}

interface DashboardConfig {
  id: number;
  name: string;
  description: string;
  configuration: any; // Make this flexible to handle different structures
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

export default function Analytics() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardConfig | null>(null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const [visibleDashboards, setVisibleDashboards] = useState<Set<number>>(new Set());
  const [showLiveView, setShowLiveView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  const { data: dashboards = [] } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  // Fetch live data for widgets
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: showLiveView,
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
    enabled: showLiveView,
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    enabled: showLiveView,
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
    enabled: showLiveView,
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000,
    enabled: showLiveView,
  });

  const loadDashboardMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      const response = await apiRequest("GET", `/api/dashboard-configs/${dashboardId}`);
      return response.json();
    },
    onSuccess: (data) => {
      // Ensure configuration has the expected structure
      if (!data.configuration) {
        data.configuration = { standardWidgets: [], customWidgets: [] };
      }
      if (!data.configuration.standardWidgets) {
        data.configuration.standardWidgets = [];
      }
      if (!data.configuration.customWidgets) {
        data.configuration.customWidgets = [];
      }
      
      setCurrentDashboard(data);
      toast({
        title: "Dashboard loaded",
        description: `Loaded dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard configuration",
        variant: "destructive",
      });
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      toast({
        title: "Dashboard created",
        description: `Created dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating dashboard",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("PUT", `/api/dashboard-configs/${dashboardData.id}`, dashboardData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setCurrentDashboard(data);
      toast({
        title: "Dashboard updated",
        description: `Updated dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating dashboard",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (dashboardId: number) => {
      await apiRequest("DELETE", `/api/dashboard-configs/${dashboardId}`);
      return dashboardId;
    },
    onSuccess: (dashboardId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      if (currentDashboard?.id === dashboardId) {
        setCurrentDashboard(null);
        setSelectedDashboardId("");
      }
      toast({
        title: "Dashboard deleted",
        description: "Dashboard has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting dashboard",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const handleLoadDashboard = (dashboardId: string) => {
    if (dashboardId) {
      setSelectedDashboardId(dashboardId);
      loadDashboardMutation.mutate(dashboardId);
    }
  };

  const handleDashboardSelect = (dashboard: DashboardConfig) => {
    setCurrentDashboard(dashboard);
    setSelectedDashboardId(dashboard.id.toString());
  };

  const handleDashboardCreate = (dashboard: DashboardConfig) => {
    createDashboardMutation.mutate(dashboard);
  };

  const handleDashboardUpdate = (dashboard: DashboardConfig) => {
    updateDashboardMutation.mutate(dashboard);
  };

  const handleDashboardDelete = (dashboardId: number) => {
    deleteDashboardMutation.mutate(dashboardId);
  };

  const handleToggleDashboardVisibility = (dashboardId: number) => {
    setVisibleDashboards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dashboardId)) {
        newSet.delete(dashboardId);
      } else {
        newSet.add(dashboardId);
      }
      return newSet;
    });
  };

  const handleToggleLiveView = () => {
    setShowLiveView(!showLiveView);
    if (!showLiveView) {
      // When enabling live view, show the selected dashboard by default
      if (currentDashboard) {
        setVisibleDashboards(new Set([currentDashboard.id]));
      }
    }
  };

  const visibleDashboardConfigs = dashboards.filter(dashboard => 
    visibleDashboards.has(dashboard.id)
  );

  const generateWidgetData = () => ({
    jobs,
    operations,
    resources,
    metrics,
    overdueJobs: jobs.filter(job => new Date(job.dueDate) < new Date() && job.status !== 'completed'),
    resourceUtilization: operations.length > 0 ? (operations.filter(op => op.assignedResourceId).length / operations.length * 100) : 0,
    jobsByStatus: jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    operationsByStatus: operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    resourcesByStatus: resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  const PageContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {/* Compact Dashboard Controls */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-4 w-4" />
                Dashboard Controls
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-1 text-xs px-2"
                >
                  <Settings className="h-3 w-3" />
                  Manage
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAiAnalyticsOpen(true)}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs px-2"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Analytics
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Dashboard Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Dashboard:</Label>
                <Select value={selectedDashboardId} onValueChange={handleLoadDashboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dashboard to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{dashboard.name}</span>
                          {dashboard.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Live View Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Live Dashboard View:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLiveView}
                    className="flex items-center gap-1 text-xs px-2"
                  >
                    {showLiveView ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showLiveView ? 'Hide' : 'Show'}
                  </Button>
                </div>
                
                {showLiveView && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Select dashboards to display:</div>
                    <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                      {dashboards.map((dashboard) => (
                        <div key={dashboard.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dashboard-${dashboard.id}`}
                            checked={visibleDashboards.has(dashboard.id)}
                            onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                          />
                          <label
                            htmlFor={`dashboard-${dashboard.id}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                          >
                            {dashboard.name}
                            {dashboard.isDefault && (
                              <Badge variant="secondary" className="text-xs px-1">Default</Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Dashboard Widgets */}
        {showLiveView && visibleDashboardConfigs.length > 0 && (
          <div className="space-y-6">
            {visibleDashboardConfigs.map((dashboard) => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{dashboard.name}</span>
                        {dashboard.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {dashboard.configuration?.customWidgets?.length || 0} widgets
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDashboardManagerOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.configuration?.customWidgets?.length > 0 ? (
                    <div className="relative min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {dashboard.configuration.customWidgets.map((widget: AnalyticsWidget) => (
                        <AnalyticsWidget
                          key={widget.id}
                          widget={widget}
                          onToggle={() => {}} // Read-only mode
                          onRemove={() => {}} // Read-only mode
                          onEdit={() => {}} // Read-only mode
                          onResize={() => {}} // Read-only mode
                          onMove={() => {}} // Read-only mode
                          data={generateWidgetData()}
                          readOnly={true}
                        />
                      ))}
                      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        Live View • Updates every 30s
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No widgets configured for this dashboard</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dashboard Configuration Preview */}
        {currentDashboard && !showLiveView && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{currentDashboard.name}</span>
                    {currentDashboard.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{currentDashboard.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDashboardManagerOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Dashboard Configuration</h3>
                <p className="text-sm">
                  This dashboard contains {currentDashboard?.configuration?.standardWidgets?.length || 0} standard widgets 
                  and {currentDashboard?.configuration?.customWidgets?.length || 0} custom widgets.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <Badge variant="outline">
                    Standard: {currentDashboard?.configuration?.standardWidgets?.length || 0}
                  </Badge>
                  <Badge variant="outline">
                    Custom: {currentDashboard?.configuration?.customWidgets?.length || 0}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={handleToggleLiveView}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Live Widgets
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentDashboard && !showLiveView && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Dashboard Selected</h3>
              <p className="text-sm mb-4">
                Select a dashboard from the dropdown above to view its configuration, or enable live view to see widgets in action.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleLiveView}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Live Widgets
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
              <p className="text-gray-600">Manage and view dashboard configurations</p>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAiAnalyticsOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Analytics
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleLiveView}
                  className="flex items-center gap-2"
                >
                  {showLiveView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showLiveView ? 'Hide Live' : 'Live View'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="flex items-center gap-2"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isMaximized ? (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Analytics - Maximized</h1>
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(false)}
                  className="flex items-center gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PageContent />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PageContent />
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedDashboardManager
        open={dashboardManagerOpen}
        onOpenChange={setDashboardManagerOpen}
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        onDashboardSelect={handleDashboardSelect}
        onDashboardCreate={handleDashboardCreate}
        onDashboardUpdate={handleDashboardUpdate}
        onDashboardDelete={handleDashboardDelete}
        standardWidgets={currentDashboard?.configuration?.standardWidgets || []}
        customWidgets={currentDashboard?.configuration?.customWidgets || []}
      />

      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        widgets={currentDashboard?.configuration.customWidgets || []}
        onWidgetCreate={(widget) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: [...currentDashboard.configuration.customWidgets, widget]
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
        onWidgetUpdate={(widgetId, updates) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: currentDashboard.configuration.customWidgets.map(w => 
                  w.id === widgetId ? { ...w, ...updates } : w
                )
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
        onWidgetDelete={(widgetId) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: currentDashboard.configuration.customWidgets.filter(w => w.id !== widgetId)
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
      />
    </>
  );
}