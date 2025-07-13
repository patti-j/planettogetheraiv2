import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Save, Factory, Maximize2, Minimize2, Bot, Send, Sparkles, Grid3X3, LayoutGrid, BarChart3 } from "lucide-react";
import Sidebar from "@/components/sidebar";
import GanttChart from "@/components/ui/gantt-chart";
import MetricsCard from "@/components/ui/metrics-card";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import AIAnalyticsManager from "@/components/ai-analytics-manager";
import AnalyticsWidget from "@/components/analytics-widget";
import { useToast } from "@/hooks/use-toast";
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
  const [currentView, setCurrentView] = useState<"operations" | "resources">("resources");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedResourceViewId, setSelectedResourceViewId] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(60);
  const [analyticsManagerOpen, setAnalyticsManagerOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([
    {
      id: "sample-1",
      title: "Job Status Distribution",
      type: "chart",
      data: {},
      visible: true,
      position: { x: 20, y: 20 },
      size: { width: 400, height: 300 },
      config: { chartType: "pie", field: "status" }
    },
    {
      id: "sample-2", 
      title: "Resource Efficiency",
      type: "progress",
      data: {},
      visible: true,
      position: { x: 450, y: 20 },
      size: { width: 300, height: 200 },
      config: { target: 85, current: 78 }
    },
    {
      id: "sample-3",
      title: "Recent Operations",
      type: "table",
      data: {},
      visible: true,
      position: { x: 20, y: 350 },
      size: { width: 500, height: 300 },
      config: { limit: 5 }
    }
  ]);
  const [showCustomWidgets, setShowCustomWidgets] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"grid" | "free">("grid");
  const { toast } = useToast();

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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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

  if (isMaximized) {
    return (
      <TooltipProvider>
        <div className="h-screen bg-surface">
          {/* Maximized Complete Dashboard View */}
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
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
                </div>
              </div>
              
              {/* Analytics Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomWidgets(!showCustomWidgets)}
                      >
                        <Grid3X3 className="w-4 h-4 mr-2" />
                        {showCustomWidgets ? "Hide" : "Show"} Analytics
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle display of custom analytics widgets</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMode = layoutMode === "grid" ? "free" : "grid";
                          setLayoutMode(newMode);
                          toast({
                            title: `Layout switched to ${newMode === "grid" ? "Grid" : "Free"} mode`,
                            description: newMode === "grid" ? "Widgets organized in columns" : "Single column layout"
                          });
                        }}
                      >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        {layoutMode === "grid" ? "Free Layout" : "Grid Layout"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Switch between organized grid and free-form layout</p>
                    </TooltipContent>
                  </Tooltip>
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
              <div className={`grid gap-4 mt-6 ${layoutMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
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
                  <div className={`${layoutMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "relative min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg"}`}>
                    {customWidgets.map((widget) => (
                      <AnalyticsWidget
                        key={widget.id}
                        widget={widget}
                        onToggle={handleWidgetToggle}
                        onRemove={handleWidgetRemove}
                        onEdit={handleWidgetEdit}
                        onResize={handleWidgetResize}
                        onPositionChange={handleWidgetPositionChange}
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        metrics={metrics}
                        layoutMode={layoutMode}
                      />
                    ))}
                    {layoutMode === "free" && (
                      <div className="absolute top-4 left-4 text-sm text-gray-500 pointer-events-none">
                        Drag widgets using the move handle (⋮⋮) to reposition them
                      </div>
                    )}
                  </div>
                </div>
              )}
            </header>

            {/* Gantt Container */}
            <div className="flex-1 bg-white mx-6 mb-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources")}>
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <TabsList className="h-auto p-0 bg-transparent">
                      <TabsTrigger 
                        value="resources" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Factory className="w-4 h-4 mr-2" />
                        Resource Gantt
                      </TabsTrigger>
                      <TabsTrigger 
                        value="operations" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Factory className="w-4 h-4 mr-2" />
                        Job Gantt
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
              </Tabs>
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
      <div className="flex h-screen bg-surface">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Schedule</h2>
                <p className="text-gray-600">Manage operations and resource allocation</p>
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
              </div>
            </div>

          {/* Analytics Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Analytics Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newShow = !showCustomWidgets;
                      setShowCustomWidgets(newShow);
                      toast({
                        title: `Custom widgets ${newShow ? "shown" : "hidden"}`,
                        description: newShow ? "AI-generated analytics widgets are now visible" : "Custom widgets are now hidden"
                      });
                    }}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    {showCustomWidgets ? "Hide Custom" : "Show Custom"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle display of custom analytics widgets</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMode = layoutMode === "grid" ? "free" : "grid";
                      setLayoutMode(newMode);
                      toast({
                        title: `Layout switched to ${newMode === "grid" ? "Grid" : "Free"} mode`,
                        description: newMode === "grid" ? "Widgets organized in columns" : "Single column layout"
                      });
                    }}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    {layoutMode === "grid" ? "Free Layout" : "Grid Layout"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch between organized grid and free-form layout</p>
                </TooltipContent>
              </Tooltip>
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
            </div>
          </div>

          {/* Metrics Cards */}
          <div className={`grid gap-4 mb-6 ${layoutMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Custom Analytics Widgets</h3>
              <div className={`${layoutMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "relative min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg"}`}>
                {customWidgets.map((widget) => (
                  <AnalyticsWidget
                    key={widget.id}
                    widget={widget}
                    onToggle={handleWidgetToggle}
                    onRemove={handleWidgetRemove}
                    onEdit={handleWidgetEdit}
                    onResize={handleWidgetResize}
                    onPositionChange={handleWidgetPositionChange}
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    metrics={metrics}
                    layoutMode={layoutMode}
                  />
                ))}
                {layoutMode === "free" && (
                  <div className="absolute top-4 left-4 text-sm text-gray-500 pointer-events-none">
                    Drag widgets using the move handle (⋮⋮) to reposition them
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Gantt Container */}
        <div className="flex-1 bg-white m-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources")}>
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="resources" 
                    className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    Resource Gantt
                  </TabsTrigger>
                  <TabsTrigger 
                    value="operations" 
                    className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    Job Gantt
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
          </Tabs>
        </div>
      </main>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
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
