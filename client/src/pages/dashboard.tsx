import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Factory, Maximize2, Minimize2, Bot, Send, Sparkles, BarChart3, Wrench, Calendar, User, Smartphone, Monitor, ChevronDown, Play, Pause, PlayCircle, PauseCircle } from "lucide-react";

import GanttChart from "@/components/ui/gantt-chart";
import MobileSchedule from "@/components/mobile-schedule";
import MetricsCard from "@/components/ui/metrics-card";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import AIAnalyticsManager from "@/components/ai-analytics-manager";
import AnalyticsWidget from "@/components/analytics-widget";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

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
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"operations" | "resources" | "customers">("resources");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedResourceViewId, setSelectedResourceViewId] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(60);
  const [analyticsManagerOpen, setAnalyticsManagerOpen] = useState(false);
  const [visibleDashboards, setVisibleDashboards] = useState<Set<number>>(new Set());
  const [isLivePaused, setIsLivePaused] = useState(false);
  const isMobile = useIsMobile();
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const showCustomWidgets = true;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  // Load dashboard configurations
  const { data: dashboards = [] } = useQuery({
    queryKey: ["/api/dashboard-configs"],
  });

  // Dashboard toggle visibility function
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

  // Get visible dashboards
  const visibleDashboardConfigs = dashboards.filter(dashboard => 
    visibleDashboards.has(dashboard.id)
  );

  // Update custom widgets when dashboard configuration loads
  useEffect(() => {
    if (visibleDashboardConfigs.length > 0) {
      const allWidgets = visibleDashboardConfigs.flatMap(dashboard => 
        dashboard.configuration?.customWidgets || []
      );
      setCustomWidgets(allWidgets);
    }
  }, [visibleDashboardConfigs]);

  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { command: prompt });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Max",
        description: data.message,
      });
      
      // Handle special frontend actions - same as AI Agent component
      if (data.actions?.includes("SET_GANTT_ZOOM")) {
        const event = new CustomEvent('aiGanttZoom', { detail: { zoomLevel: data.data.zoomLevel } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SET_GANTT_SCROLL")) {
        const event = new CustomEvent('aiGanttScroll', { detail: { scrollPosition: data.data.scrollPosition } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SCROLL_TO_TODAY")) {
        const event = new CustomEvent('aiScrollToToday', { detail: {} });
        window.dispatchEvent(event);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process AI command",
        variant: "destructive",
      });
    },
  });

  const handleAiPrompt = () => {
    if (aiPrompt.trim()) {
      aiMutation.mutate(aiPrompt);
      setAiPrompt("");
    }
  };

  const handleWidgetCreate = (widget: AnalyticsWidget) => {
    setCustomWidgets(prev => [...prev, widget]);
  };

  const handleWidgetPositionChange = (id: string, position: { x: number; y: number }) => {
    setCustomWidgets(prev => 
      prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      )
    );
  };

  const handleWidgetUpdate = (widgets: AnalyticsWidget[]) => {
    setCustomWidgets(widgets);
  };

  const handleWidgetToggle = (id: string) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    ));
  };

  const handleWidgetRemove = (id: string) => {
    setCustomWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handleWidgetEdit = (id: string) => {
    // Open analytics manager with the specific widget for editing
    const widget = customWidgets.find(w => w.id === id);
    if (widget) {
      setAnalyticsManagerOpen(true);
      // Could add state to focus on specific widget in manager
    }
  };

  const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAiPrompt();
    }
  };

  // Generate widget data for analytics
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

  if (isMaximized) {
    return (
      <TooltipProvider>
        <div className="h-screen bg-surface overflow-y-auto">
          {/* Maximized Complete Dashboard View */}
          <div className="flex flex-col min-h-full bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="md:ml-0 ml-12">
                  <h2 className="text-2xl font-semibold text-gray-800">Production Schedule - Maximized</h2>
                  <p className="text-gray-600">Full dashboard view with metrics and Gantt chart</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Factory className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save Schedule
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save current schedule configuration</p>
                    </TooltipContent>
                  </Tooltip>
                  {!isMobile && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setIsMaximized(false)}>
                          <Minimize2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Return to normal dashboard view</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {/* Analytics Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setAnalyticsManagerOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Analytics
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create custom analytics widgets using AI</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid gap-4 mt-6 grid-cols-1">
                <MetricsCard
                  title="Active Jobs"
                  value={metrics?.activeJobs?.toString() || "0"}
                  change="+8% from last week"
                  icon="briefcase"
                  color="blue"
                />
                <MetricsCard
                  title="Resource Utilization"
                  value={`${metrics?.utilization || 0}%`}
                  change=""
                  icon="chart-line"
                  color="green"
                  showProgress={true}
                  progressValue={metrics?.utilization || 0}
                />
                <MetricsCard
                  title="Overdue Operations"
                  value={metrics?.overdueOperations?.toString() || "0"}
                  change="Requires attention"
                  icon="exclamation-triangle"
                  color="red"
                />
                <MetricsCard
                  title="Avg. Lead Time"
                  value={`${metrics?.avgLeadTime || 0} days`}
                  change="-0.3 days improved"
                  icon="clock"
                  color="orange"
                />
              </div>

              {/* Custom AI-Generated Widgets */}
              {showCustomWidgets && customWidgets.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Custom Analytics Widgets</h3>
                  <div className="relative min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
                    {customWidgets.map((widget) => (
                      <AnalyticsWidget
                        key={widget.id}
                        widget={widget}
                        onToggle={handleWidgetToggle}
                        onRemove={handleWidgetRemove}
                        onEdit={handleWidgetEdit}
                        onResize={handleWidgetResize}
                        onMove={handleWidgetPositionChange}
                        data={{
                          jobs,
                          operations,
                          resources,
                          metrics,
                          overdueJobs: jobs.filter(job => new Date(job.dueDate) < new Date() && job.status !== 'completed'),
                          resourceUtilization: operations.filter(op => op.assignedResourceId).length / operations.length * 100,
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
                        }}
                      />
                    ))}
                    <div className="absolute top-4 left-4 text-sm text-gray-500 pointer-events-none">
                      Drag widgets using the move handle (⋮⋮) to reposition them
                    </div>
                  </div>
                </div>
              )}
            </header>



            {/* Gantt Container */}
            <div className={`bg-white mx-6 mb-6 rounded-lg shadow-sm border border-gray-200 ${isMobile ? 'flex-1 min-h-0' : 'flex-1 overflow-hidden'}`}>
              {isMobile ? (
                <div className="h-full flex flex-col">
                  <MobileSchedule
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources" | "customers")}>
                    <div className="border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between px-4">
                        <TabsList className="h-auto p-0 bg-transparent">
                          <TabsTrigger 
                            value="resources" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <Wrench className="w-4 h-4 mr-2" />
                            Resource Gantt
                          </TabsTrigger>
                          <TabsTrigger 
                            value="operations" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Job Gantt
                          </TabsTrigger>
                          <TabsTrigger 
                            value="customers" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Customer Gantt
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                    
                    <TabsContent value="resources" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="resources"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>

                    <TabsContent value="operations" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="operations"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>

                    <TabsContent value="customers" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="customers"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  {/* Op Sequencer Section */}
                  <div className="border-t border-gray-200 h-1/2 flex flex-col">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-primary" />
                        <span className="text-sm font-medium text-gray-700">Op Sequencer</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <MobileSchedule
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating AI Assistant Quick Action */}
          <div className="fixed bottom-6 right-6 z-50">
            <div className="floating-ai-assistant rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
              <div className="flex items-center space-x-2 mb-3">
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-gray-700">Max</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask AI to create jobs, schedule operations..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      onClick={handleAiPrompt}
                      disabled={aiMutation.isPending || !aiPrompt.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send AI command to control Gantt chart view</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* AI Analytics Manager */}
          <AIAnalyticsManager
            open={analyticsManagerOpen}
            onOpenChange={setAnalyticsManagerOpen}
            onWidgetCreate={handleWidgetCreate}
            currentWidgets={customWidgets}
            onWidgetUpdate={handleWidgetUpdate}
          />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
              <div className="mb-4 md:mb-0 md:ml-0 ml-12">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Schedule</h2>
                <p className="text-sm md:text-base text-gray-600">Manage operations and resource allocation</p>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="text-xs md:text-sm text-gray-500 flex items-center">
                  <Factory className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  <span className="hidden md:inline">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="md:hidden">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" className="w-full md:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      Save Schedule
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current schedule configuration</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

          {/* Analytics Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Analytics Dashboard</span>
              {/* Live/Pause toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLivePaused(!isLivePaused)}
                className="flex items-center gap-2 hover:bg-gray-100 text-sm"
              >
                {isLivePaused ? (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Paused</span>
                    <PlayCircle className="w-4 h-4 text-gray-600" />
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                    <PauseCircle className="w-4 h-4 text-green-600" />
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[160px] justify-between text-sm"
                  >
                    <span>
                      {visibleDashboards.size === 0 
                        ? "Select Dashboards" 
                        : `${visibleDashboards.size} Selected`}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Dashboards to Display:</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dashboards.map((dashboard) => (
                        <div key={dashboard.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dashboard-${dashboard.id}`}
                            checked={visibleDashboards.has(dashboard.id)}
                            onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                          />
                          <label
                            htmlFor={`dashboard-${dashboard.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
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
                </PopoverContent>
              </Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setAnalyticsManagerOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Analytics
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create custom analytics widgets using AI</p>
                </TooltipContent>
              </Tooltip>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMaximized(!isMaximized)}
                    >
                      {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximize entire production schedule view</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Selected Dashboards */}
          {visibleDashboardConfigs.length > 0 && (
            <div className="mb-6">
              <div className="grid gap-6">
                {visibleDashboardConfigs.map((dashboard) => (
                  <div key={dashboard.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{dashboard.name}</h3>
                      {dashboard.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    
                    {dashboard.configuration?.customWidgets?.length > 0 ? (
                      <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${
                        isMobile ? 'min-h-[800px] p-2' : 'min-h-[400px]'
                      }`}>
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
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                        <div>
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No widgets configured for this dashboard</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {visibleDashboards.size === 0 && (
            <div className="mb-6">
              <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Dashboards Selected</h3>
                <p className="text-sm">
                  Select one or more dashboards from the dropdown above to view their widgets.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Gantt Container */}
        <div className="flex-1 bg-white m-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
          {isMobile ? (
            <div className="h-full flex flex-col">
              <MobileSchedule
                jobs={jobs}
                operations={operations}
                resources={resources}
                capabilities={capabilities}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources" | "customers")}>
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <TabsList className="h-auto p-0 bg-transparent">
                      <TabsTrigger 
                        value="resources" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Resource Gantt
                      </TabsTrigger>
                      <TabsTrigger 
                        value="operations" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Job Gantt
                      </TabsTrigger>
                      <TabsTrigger 
                        value="customers" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Customer Gantt
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center space-x-2 px-6">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setIsMaximized(true)}>
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expand Gantt chart to full screen for better visibility</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <TabsContent value="resources" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="resources"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>

                <TabsContent value="operations" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="operations"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>

                <TabsContent value="customers" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="customers"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>
              </Tabs>
              
              {/* Op Sequencer Section */}
              <div className="border-t border-gray-200 h-1/2 flex flex-col">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <div className="flex items-center">
                    <Smartphone className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-gray-700">Op Sequencer</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MobileSchedule
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            capabilities={capabilities} 
            onSuccess={() => setResourceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

        {/* AI Analytics Manager */}
        <AIAnalyticsManager
          open={analyticsManagerOpen}
          onOpenChange={setAnalyticsManagerOpen}
          onWidgetCreate={handleWidgetCreate}
          currentWidgets={customWidgets}
          onWidgetUpdate={handleWidgetUpdate}
        />
      </div>
    </TooltipProvider>
  );
}
