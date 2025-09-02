import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Sparkles, Settings, Plus, Maximize2, Minimize2, Eye, EyeOff, X, Move, FolderOpen } from "lucide-react";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
// Analytics widget component removed - functionality replaced with dashboard-based components
import DashboardManager from "@/components/dashboard-manager";
// Widget functionality replaced with dashboard-based components
import type { Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMaxDock } from '@/contexts/MaxDockContext';
import { WidgetConfig } from '@/lib/widget-library';

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

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

export default function Analytics() {
  const { isMaxOpen } = useMaxDock();
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const [layoutMode] = useState<"grid" | "free">("free");
  const [showCustomWidgets] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [widgetStudioOpen, setWidgetStudioOpen] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Standard widgets state
  const [standardWidgets, setStandardWidgets] = useState<AnalyticsWidget[]>([
    {
      id: "active-jobs",
      title: "Active Jobs",
      type: "metric",
      data: { icon: "BarChart3", description: "Currently in production" },
      visible: true,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "resource-utilization",
      title: "Resource Utilization",
      type: "metric",
      data: { icon: "TrendingUp", description: "Operations assigned to resources" },
      visible: true,
      position: { x: 320, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "overdue-jobs",
      title: "Overdue Jobs",
      type: "metric",
      data: { icon: "AlertTriangle", description: "Past due date" },
      visible: true,
      position: { x: 640, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "total-operations",
      title: "Total Operations",
      type: "metric",
      data: { icon: "CheckCircle", description: "All operations" },
      visible: true,
      position: { x: 960, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    }
  ]);

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: dashboards = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  const loadDashboardMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      const response = await apiRequest("GET", `/api/dashboard-configs/${dashboardId}`);
      return response;
    },
    onSuccess: (data) => {
      setCurrentDashboard(data);
      setStandardWidgets(data.configuration.standardWidgets);
      setCustomWidgets(data.configuration.customWidgets);
      toast({
        title: "Dashboard loaded",
        description: `Loaded ${data.name} dashboard`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive",
      });
    },
  });

  const handleDashboardSelect = (dashboard: any) => {
    setCurrentDashboard(dashboard);
    setStandardWidgets(dashboard.configuration.standardWidgets);
    setCustomWidgets(dashboard.configuration.customWidgets);
    setSelectedDashboardId(dashboard.id.toString());
    setDashboardManagerOpen(false);
  };

  const handleDashboardCreate = (dashboard: any) => {
    setCurrentDashboard(dashboard);
    setSelectedDashboardId(dashboard.id.toString());
    setDashboardManagerOpen(false);
  };

  const handleDashboardUpdate = (dashboard: any) => {
    setCurrentDashboard(dashboard);
    setSelectedDashboardId(dashboard.id.toString());
  };

  const handleDashboardDelete = (dashboardId: number) => {
    if (currentDashboard?.id === dashboardId) {
      setCurrentDashboard(null);
      setSelectedDashboardId("");
    }
  };

  const handleWidgetCreate = (widget: WidgetConfig, targetSystems: string[]) => {
    // Convert universal widget config to analytics widget
    const analyticsWidget: AnalyticsWidget = {
      id: widget.id,
      title: widget.title,
      type: widget.type as "metric" | "chart" | "table" | "progress",
      data: {}, // Will be populated by real data
      visible: true,
      position: widget.position || { x: 0, y: 0 },
      size: widget.size || { width: 400, height: 300 },
      config: widget
    };

    if (targetSystems.includes('analytics')) {
      setCustomWidgets(prev => [...prev, analyticsWidget]);
    }

    // Here you could also save to other systems like cockpit, canvas, etc.
    if (targetSystems.includes('cockpit')) {
      // Save to cockpit system
      console.log('Saving widget to cockpit:', widget);
    }

    if (targetSystems.includes('canvas')) {
      // Save to Max AI canvas
      console.log('Saving widget to canvas:', widget);
    }

    toast({
      title: "Widget Created",
      description: `${widget.title} has been added to ${targetSystems.join(', ')}`,
    });
  };

  const getJobsByStatus = () => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getOperationsByStatus = () => {
    const statusCounts = operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourcesByStatus = () => {
    const statusCounts = resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourceUtilization = () => {
    const assigned = operations.filter(op => op.assignedResourceId).length;
    const total = operations.length;
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  };

  const getOverdueJobs = () => {
    const now = new Date();
    return jobs.filter(job => new Date(job.dueDate) < now && job.status !== 'completed');
  };

  const jobsByStatus = getJobsByStatus();
  const operationsByStatus = getOperationsByStatus();
  const resourcesByStatus = getResourcesByStatus();
  const resourceUtilization = getResourceUtilization();
  const overdueJobs = getOverdueJobs();

  const handleAnalyticsWidgetCreate = (widget: AnalyticsWidget) => {
    setCustomWidgets(prev => [...prev, widget]);
  };

  const handleWidgetUpdate = (widgets: AnalyticsWidget[]) => {
    setCustomWidgets(widgets);
  };

  const handleAddManualWidget = () => {
    setCustomWidgets(prev => [...prev, {
      id: `custom-${Date.now()}`,
      title: "New Widget",
      type: "metric",
      data: { value: 0, description: "Custom metric" },
      visible: true,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      config: {}
    }]);
  };

  const handleWidgetToggle = (id: string) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      ));
    }
  };

  const handleWidgetRemove = (id: string) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: false } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.filter(widget => widget.id !== id));
    }
  };

  const handleWidgetEdit = (id: string) => {
    const widget = customWidgets.find(w => w.id === id);
    if (widget) {
      setAiAnalyticsOpen(true);
    }
  };

  const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, size } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, size } : widget
      ));
    }
  };

  const handleWidgetPositionChange = (id: string, position: { x: number; y: number }) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      ));
    }
  };

  const PageContent = () => (
    <div className="h-full flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="relative">
          <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
            <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
            <p className="text-gray-600 mt-1">Production performance insights</p>
          </div>
          
          {/* Maximize button moved to fixed top-right position */}
          {/* Control buttons below header */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2 md:gap-2 mt-4">
            <Select value={selectedDashboardId} onValueChange={(value) => {
              if (value) {
                loadDashboardMutation.mutate(value);
              }
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select dashboard" />
              </SelectTrigger>
              <SelectContent>
                {dashboards.map((dashboard) => (
                  <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                    {dashboard.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setDashboardManagerOpen(true)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              Manage
            </Button>
            <Button
              onClick={() => setAiAnalyticsOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Analytics
            </Button>
            <Button
              className="bg-primary hover:bg-blue-700 text-white whitespace-nowrap"
              size="sm"
              onClick={handleAddManualWidget}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Analytic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWidgetStudioOpen(true)}
              className="whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-2" />
              Widget Studio
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {/* Analytics Dashboard - Free Form Layout */}
        <div className="relative pb-8" style={{ minHeight: '2000px' }}>
          {/* Standard Widgets */}
          {standardWidgets.map((widget) => (
            <AnalyticsWidget
              key={widget.id}
              widget={widget}
              onToggle={handleWidgetToggle}
              onRemove={handleWidgetRemove}
              onMove={handleWidgetPositionChange}
              onResize={handleWidgetResize}
              onEdit={handleWidgetEdit}
              data={{
                jobs,
                operations,
                resources,
                metrics,
                overdueJobs,
                resourceUtilization,
                jobsByStatus,
                operationsByStatus,
                resourcesByStatus
              }}
            />
          ))}
          
          {/* Custom Widgets */}
          {showCustomWidgets && customWidgets.map((widget) => (
            <AnalyticsWidget
              key={widget.id}
              widget={widget}
              onToggle={handleWidgetToggle}
              onRemove={handleWidgetRemove}
              onMove={handleWidgetPositionChange}
              onResize={handleWidgetResize}
              onEdit={handleWidgetEdit}
              data={{
                jobs,
                operations,
                resources,
                metrics,
                overdueJobs,
                resourceUtilization,
                jobsByStatus,
                operationsByStatus,
                resourcesByStatus
              }}
            />
          ))}
        </div>

        {/* Legacy Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently in production
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resourceUtilization}%</div>
              <p className="text-xs text-muted-foreground">
                Operations assigned to resources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Past due date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operations.length}</div>
              <p className="text-xs text-muted-foreground">
                All operations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(jobsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {status}
                    </Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(jobsByStatus).length === 0 && (
                  <p className="text-sm text-gray-500">No jobs available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(operationsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {status}
                    </Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(operationsByStatus).length === 0 && (
                  <p className="text-sm text-gray-500">No operations available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(resourcesByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {status}
                    </Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(resourcesByStatus).length === 0 && (
                  <p className="text-sm text-gray-500">No resources available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Jobs */}
        {overdueJobs.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Overdue Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">{job.name}</p>
                      <p className="text-sm text-red-600">Customer: {job.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Due: {new Date(job.dueDate).toLocaleDateString()}
                      </p>
                      <Badge className="bg-red-100 text-red-800 capitalize">
                        {job.priority} priority
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );

  return (
    <>
      {/* Maximize button positioned to avoid hamburger menu */}
      <div className="fixed right-12 z-40 top-20 md:top-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="shadow-md border"
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {isMaximized ? (
        <div className="fixed inset-0 bg-white z-40">
          <PageContent />
          
          {/* AI Analytics Manager */}
          <AIAnalyticsManager
            open={aiAnalyticsOpen}
            onOpenChange={setAiAnalyticsOpen}
            onWidgetCreate={handleAnalyticsWidgetCreate}
            currentWidgets={customWidgets}
            onWidgetUpdate={handleWidgetUpdate}
          />
          
          {/* Dashboard Manager */}
          <DashboardManager
            open={dashboardManagerOpen}
            onOpenChange={setDashboardManagerOpen}
            dashboards={dashboards}
            currentDashboard={currentDashboard}
            onDashboardSelect={handleDashboardSelect}
            onDashboardCreate={handleDashboardCreate}
            onDashboardUpdate={handleDashboardUpdate}
            onDashboardDelete={handleDashboardDelete}
            standardWidgets={standardWidgets}
            customWidgets={customWidgets}
          />
          
          {/* Widget Design Studio - Replaced with dashboard functionality */}
          {widgetStudioOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Widget Design Studio</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Widget design functionality has been replaced with dashboard-based components.
                </p>
                <Button onClick={() => setWidgetStudioOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-screen bg-gray-50 dark:bg-gray-900">
          <PageContent />
        </div>
      )}
      
      {/* AI Analytics Manager */}
      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        onWidgetCreate={handleAnalyticsWidgetCreate}
        currentWidgets={customWidgets}
        onWidgetUpdate={handleWidgetUpdate}
      />
      
      {/* Dashboard Manager */}
      <DashboardManager
        open={dashboardManagerOpen}
        onOpenChange={setDashboardManagerOpen}
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        onDashboardSelect={handleDashboardSelect}
        onDashboardCreate={handleDashboardCreate}
        onDashboardUpdate={handleDashboardUpdate}
        onDashboardDelete={handleDashboardDelete}
        standardWidgets={standardWidgets}
        customWidgets={customWidgets}
      />
      
      {/* Widget Design Studio - Replaced with dashboard functionality */}
      {widgetStudioOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Widget Design Studio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Widget design functionality has been replaced with dashboard-based components.
            </p>
            <Button onClick={() => setWidgetStudioOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
}