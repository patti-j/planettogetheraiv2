import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Filter, Save, Factory, Maximize2, Minimize2, Bot, Send, Sparkles, Grid3X3, LayoutGrid, BarChart3 } from "lucide-react";
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
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const [showCustomWidgets, setShowCustomWidgets] = useState(false);
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
        title: "AI Assistant",
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
    console.log("Edit widget:", id);
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
      <div className="h-screen bg-surface">
        {/* Maximized Gantt View */}
        <div className="flex flex-col h-full bg-white">
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
                <div className="flex items-center space-x-4 px-6">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Factory className="w-4 h-4 mr-1" />
                    Production Schedule - Maximized View
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setIsMaximized(false)}>
                        <Minimize2 className="w-4 h-4 mr-2" />
                        Minimize
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Return to normal dashboard view</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <TabsContent value="resources" className="flex-1 m-0">
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

            <TabsContent value="operations" className="flex-1 m-0">
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

        {/* Floating AI Assistant Quick Action */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="floating-ai-assistant rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
            <div className="flex items-center space-x-2 mb-3">
              <Bot className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-gray-700">AI Assistant</span>
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
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Production Schedule</h2>
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
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter schedule by date, priority, or resource type</p>
                  </TooltipContent>
                </Tooltip>
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
                    onClick={() => setShowCustomWidgets(!showCustomWidgets)}
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
                    onClick={() => setLayoutMode(layoutMode === "grid" ? "free" : "grid")}
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
                    onClick={() => setAiAnalyticsOpen(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <div className={`grid gap-4 ${layoutMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {customWidgets.map((widget) => (
                  <AnalyticsWidget
                    key={widget.id}
                    widget={widget}
                    onToggle={handleWidgetToggle}
                    onRemove={handleWidgetRemove}
                    onEdit={handleWidgetEdit}
                    onResize={handleWidgetResize}
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    metrics={metrics}
                  />
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Gantt Container */}
        <div className="flex-1 bg-white m-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Maximize
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
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        onWidgetCreate={handleWidgetCreate}
        currentWidgets={customWidgets}
        onWidgetUpdate={handleWidgetUpdate}
      />
      </div>
    </TooltipProvider>
  );
}
