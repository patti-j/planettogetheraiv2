import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Plus, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Factory, 
  TrendingUp,
  Activity,
  Monitor,
  Bell,
  Maximize2,
  RefreshCw,
  Eye,
  MoreVertical,
  Trash2,
  Edit,
  Grid,
  PieChart,
  LineChart,
  Calendar,
  MapPin,
  Sparkles,
  Wand2,
  Brain,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Maximize } from "lucide-react";

interface CockpitLayout {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  is_shared: boolean;
  grid_layout: any;
  theme: string;
  refresh_interval: number;
  auto_refresh: boolean;
  created_at: string;
  updated_at: string;
}

interface CockpitWidget {
  id: number;
  layout_id: number;
  type: string;
  title: string;
  sub_title?: string;
  position: any;
  configuration: any;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface CockpitAlert {
  id: number;
  widget_id: number;
  severity: string;
  title: string;
  message: string;
  source: string;
  status: string;
  created_at: string;
}

const widgetTypes = [
  { value: "metrics", label: "Key Metrics", icon: BarChart3 },
  { value: "chart", label: "Chart", icon: PieChart },
  { value: "alerts", label: "Alerts & Notifications", icon: Bell },
  { value: "schedule", label: "Schedule Overview", icon: Calendar },
  { value: "resources", label: "Resource Status", icon: Users },
  { value: "production", label: "Production Status", icon: Factory },
  { value: "kpi", label: "KPI Dashboard", icon: TrendingUp },
  { value: "activity", label: "Activity Feed", icon: Activity }
];

const themes = [
  { value: "professional", label: "Professional" },
  { value: "dark", label: "Dark Mode" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "modern", label: "Modern" }
];

export default function ProductionCockpit() {
  const [maximized, setMaximized] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [newLayoutDialog, setNewLayoutDialog] = useState(false);
  const [newWidgetDialog, setNewWidgetDialog] = useState(false);
  const [aiLayoutDialog, setAiLayoutDialog] = useState(false);
  const [aiWidgetDialog, setAiWidgetDialog] = useState(false);
  const [newLayoutData, setNewLayoutData] = useState({
    name: "",
    description: "",
    theme: "professional",
    auto_refresh: true,
    refresh_interval: 30
  });
  const [newWidgetData, setNewWidgetData] = useState({
    type: "metrics",
    title: "",
    sub_title: "",
    position: { x: 0, y: 0, w: 4, h: 3 }
  });
  const [aiLayoutData, setAiLayoutData] = useState({
    description: "",
    role: "Production Scheduler",
    industry: "Manufacturing",
    goals: ""
  });
  const [aiWidgetData, setAiWidgetData] = useState({
    description: "",
    dataSource: "jobs",
    visualizationType: "chart"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch layouts
  const { data: layouts = [], isLoading: layoutsLoading } = useQuery<CockpitLayout[]>({
    queryKey: ["/api/cockpit/layouts"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch widgets for selected layout
  const { data: widgets = [], isLoading: widgetsLoading } = useQuery<CockpitWidget[]>({
    queryKey: ["/api/cockpit/widgets", selectedLayout],
    enabled: selectedLayout !== null,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<CockpitAlert[]>({
    queryKey: ["/api/cockpit/alerts"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch production metrics
  const { data: metrics = {}, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["/api/metrics"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<any[]>({
    queryKey: ["/api/resources"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Create layout mutation
  const createLayoutMutation = useMutation({
    mutationFn: (layoutData: any) =>
      fetch("/api/cockpit/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layoutData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cockpit/layouts"] });
      setNewLayoutDialog(false);
      setNewLayoutData({
        name: "",
        description: "",
        theme: "professional",
        auto_refresh: true,
        refresh_interval: 30
      });
      toast({ title: "Layout created successfully" });
    }
  });

  // Create widget mutation
  const createWidgetMutation = useMutation({
    mutationFn: (widgetData: any) =>
      fetch("/api/cockpit/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(widgetData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cockpit/widgets", selectedLayout] });
      setNewWidgetDialog(false);
      setNewWidgetData({
        type: "metrics",
        title: "",
        sub_title: "",
        position: { x: 0, y: 0, w: 4, h: 3 }
      });
      toast({ title: "Widget added successfully" });
    }
  });

  // AI layout generation mutation
  const aiLayoutMutation = useMutation({
    mutationFn: (aiData: any) =>
      fetch("/api/cockpit/ai-generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiData)
      }).then(res => res.json()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cockpit/layouts"] });
      setAiLayoutDialog(false);
      setAiLayoutData({
        description: "",
        role: "Production Scheduler",
        industry: "Manufacturing",
        goals: ""
      });
      if (result.layout) {
        setSelectedLayout(result.layout.id);
        toast({ title: `AI layout "${result.layout.name}" created with ${result.widgets?.length || 0} widgets` });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate AI layout", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // AI widget generation mutation
  const aiWidgetMutation = useMutation({
    mutationFn: (aiData: any) =>
      fetch("/api/cockpit/ai-generate-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiData,
          layoutId: selectedLayout
        })
      }).then(res => res.json()),
    onSuccess: (widget) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cockpit/widgets", selectedLayout] });
      setAiWidgetDialog(false);
      setAiWidgetData({
        description: "",
        dataSource: "jobs",
        visualizationType: "chart"
      });
      toast({ title: `AI widget "${widget.title}" added successfully` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate AI widget", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Set default layout on load
  useEffect(() => {
    if (layouts.length > 0 && !selectedLayout) {
      const defaultLayout = layouts.find((layout: CockpitLayout) => layout.is_default) || layouts[0];
      setSelectedLayout(defaultLayout.id);
    }
  }, [layouts, selectedLayout]);

  const handleCreateLayout = () => {
    createLayoutMutation.mutate({
      ...newLayoutData,
      grid_layout: {
        cols: 12,
        rows: 10,
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
      }
    });
  };

  const handleCreateWidget = () => {
    if (!selectedLayout) return;
    
    createWidgetMutation.mutate({
      ...newWidgetData,
      layout_id: selectedLayout,
      configuration: getDefaultWidgetConfig(newWidgetData.type)
    });
  };

  const getDefaultWidgetConfig = (type: string) => {
    switch (type) {
      case "metrics":
        return { metrics: ["activeJobs", "utilization", "efficiency"], showTrends: true };
      case "chart":
        return { chartType: "bar", dataSource: "jobs", groupBy: "status" };
      case "alerts":
        return { severity: ["critical", "warning"], autoRefresh: true };
      case "schedule":
        return { view: "week", showResources: true };
      case "resources":
        return { showUtilization: true, groupBy: "type" };
      case "production":
        return { showTargets: true, periodView: "daily" };
      case "kpi":
        return { kpis: ["oee", "throughput", "quality"], layout: "grid" };
      case "activity":
        return { sources: ["system", "users"], limit: 20 };
      default:
        return {};
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "warning": return "orange";
      case "info": return "blue";
      default: return "default";
    }
  };

  const currentLayout = layouts?.find((layout: CockpitLayout) => layout?.id === selectedLayout);

  return (
    <div className={`min-h-screen bg-background ${maximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 lg:p-4 border-b bg-card gap-3 lg:gap-4">
        {/* Title and Layout Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Monitor className="h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              <span className="hidden sm:inline">Production Scheduler's Cockpit</span>
              <span className="sm:hidden">Cockpit</span>
            </h1>
          </div>
          
          {/* Layout Selector */}
          <Select
            value={selectedLayout?.toString()}
            onValueChange={(value) => setSelectedLayout(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-48 lg:w-64">
              <SelectValue placeholder="Select layout..." />
            </SelectTrigger>
            <SelectContent>
              {layouts?.map((layout: CockpitLayout) => layout && layout.id ? (
                <SelectItem key={layout.id.toString()} value={layout.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{layout.name || 'Unknown Layout'}</span>
                    {layout.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                </SelectItem>
              ) : null)}
            </SelectContent>
          </Select>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-2">
          {/* Auto Refresh Toggle - Hide label on mobile */}
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-xs sm:text-sm hidden sm:inline">
              Auto Refresh
            </Label>
            <Label htmlFor="auto-refresh" className="text-xs sm:hidden">
              Auto
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries()}
              disabled={metricsLoading}
              className="p-2 lg:px-3"
            >
              <RefreshCw className={`h-4 w-4 ${metricsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline ml-2">Refresh</span>
            </Button>

            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="p-2 lg:px-3">
                  <Settings className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>Cockpit Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                      min="5"
                      max="300"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Maximize */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaximized(!maximized)}
              className="p-2 lg:px-3"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Maximize</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={newLayoutDialog} onOpenChange={setNewLayoutDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Layout</span>
                  <span className="sm:hidden">Layout</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Layout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="layout-name">Layout Name</Label>
                    <Input
                      id="layout-name"
                      value={newLayoutData.name}
                      onChange={(e) => setNewLayoutData({ ...newLayoutData, name: e.target.value })}
                      placeholder="Enter layout name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="layout-description">Description</Label>
                    <Textarea
                      id="layout-description"
                      value={newLayoutData.description}
                      onChange={(e) => setNewLayoutData({ ...newLayoutData, description: e.target.value })}
                      placeholder="Enter description..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="layout-theme">Theme</Label>
                    <Select
                      value={newLayoutData.theme}
                      onValueChange={(value) => setNewLayoutData({ ...newLayoutData, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateLayout} className="w-full">
                    Create Layout
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* AI Layout Generation Dialog */}
            <Dialog open={aiLayoutDialog} onOpenChange={setAiLayoutDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">AI Layout</span>
                  <span className="sm:hidden">AI</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI-Powered Layout Creation
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-description">Describe your ideal cockpit layout</Label>
                    <Textarea
                      id="ai-description"
                      value={aiLayoutData.description}
                      onChange={(e) => setAiLayoutData({ ...aiLayoutData, description: e.target.value })}
                      placeholder="e.g., I need a layout focused on real-time production monitoring with KPI dashboards, resource utilization charts, and alert panels for quality issues..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-role">Your Role</Label>
                      <Select
                        value={aiLayoutData.role}
                        onValueChange={(value) => setAiLayoutData({ ...aiLayoutData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Production Scheduler">Production Scheduler</SelectItem>
                          <SelectItem value="Plant Manager">Plant Manager</SelectItem>
                          <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                          <SelectItem value="Quality Manager">Quality Manager</SelectItem>
                          <SelectItem value="Maintenance Manager">Maintenance Manager</SelectItem>
                          <SelectItem value="Shift Supervisor">Shift Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ai-industry">Industry</Label>
                      <Select
                        value={aiLayoutData.industry}
                        onValueChange={(value) => setAiLayoutData({ ...aiLayoutData, industry: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Automotive">Automotive</SelectItem>
                          <SelectItem value="Aerospace">Aerospace</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                          <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ai-goals">Key Goals & Priorities</Label>
                    <Textarea
                      id="ai-goals"
                      value={aiLayoutData.goals}
                      onChange={(e) => setAiLayoutData({ ...aiLayoutData, goals: e.target.value })}
                      placeholder="e.g., Improve OEE, reduce downtime, optimize resource utilization, ensure on-time delivery..."
                      rows={2}
                    />
                  </div>
                  <Button 
                    onClick={() => aiLayoutMutation.mutate(aiLayoutData)} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={aiLayoutMutation.isPending || !aiLayoutData.description}
                  >
                    {aiLayoutMutation.isPending ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Generating AI Layout...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate AI Layout
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={newWidgetDialog} onOpenChange={setNewWidgetDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!selectedLayout} className="text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Widget</span>
                  <span className="sm:hidden">Widget</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <Select
                      value={newWidgetData.type}
                      onValueChange={(value) => setNewWidgetData({ ...newWidgetData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {widgetTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={newWidgetData.title}
                      onChange={(e) => setNewWidgetData({ ...newWidgetData, title: e.target.value })}
                      placeholder="Enter widget title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="widget-subtitle">Subtitle (Optional)</Label>
                    <Input
                      id="widget-subtitle"
                      value={newWidgetData.sub_title}
                      onChange={(e) => setNewWidgetData({ ...newWidgetData, sub_title: e.target.value })}
                      placeholder="Enter subtitle..."
                    />
                  </div>
                  <Button onClick={handleCreateWidget} className="w-full">
                    Add Widget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* AI Widget Generation Dialog */}
            <Dialog open={aiWidgetDialog} onOpenChange={setAiWidgetDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!selectedLayout}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">AI Widget</span>
                  <span className="sm:hidden">AI+</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI-Powered Widget Creation
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-widget-description">Describe the widget you need</Label>
                    <Textarea
                      id="ai-widget-description"
                      value={aiWidgetData.description}
                      onChange={(e) => setAiWidgetData({ ...aiWidgetData, description: e.target.value })}
                      placeholder="e.g., A real-time chart showing resource utilization by department, or a KPI dashboard tracking production targets vs actuals..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-data-source">Primary Data Source</Label>
                      <Select
                        value={aiWidgetData.dataSource}
                        onValueChange={(value) => setAiWidgetData({ ...aiWidgetData, dataSource: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jobs">Jobs & Orders</SelectItem>
                          <SelectItem value="resources">Resources & Equipment</SelectItem>
                          <SelectItem value="operations">Operations & Tasks</SelectItem>
                          <SelectItem value="metrics">Production Metrics</SelectItem>
                          <SelectItem value="alerts">Alerts & Issues</SelectItem>
                          <SelectItem value="schedule">Schedule & Timeline</SelectItem>
                          <SelectItem value="quality">Quality Metrics</SelectItem>
                          <SelectItem value="capacity">Capacity & Utilization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ai-visualization">Visualization Type</Label>
                      <Select
                        value={aiWidgetData.visualizationType}
                        onValueChange={(value) => setAiWidgetData({ ...aiWidgetData, visualizationType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chart">Chart (Bar/Line/Pie)</SelectItem>
                          <SelectItem value="metrics">KPI Metrics</SelectItem>
                          <SelectItem value="table">Data Table</SelectItem>
                          <SelectItem value="gauge">Gauge/Progress</SelectItem>
                          <SelectItem value="timeline">Timeline View</SelectItem>
                          <SelectItem value="map">Resource Map</SelectItem>
                          <SelectItem value="alerts">Alert Panel</SelectItem>
                          <SelectItem value="activity">Activity Feed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => aiWidgetMutation.mutate(aiWidgetData)} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={aiWidgetMutation.isPending || !aiWidgetData.description}
                  >
                    {aiWidgetMutation.isPending ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Generating AI Widget...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate AI Widget
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="whitespace-nowrap">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">Last Updated: </span>
                <span className="sm:hidden">Updated: </span>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Critical Alerts Bar */}
        {alerts.filter((alert: CockpitAlert) => alert.severity === 'critical').length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Critical Alerts Active</span>
                <Badge variant="destructive">
                  {alerts.filter((alert: CockpitAlert) => alert.severity === 'critical').length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        {selectedLayout ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-[400px] sm:min-h-[600px]">
            {/* Key Metrics */}
            <Card className="col-span-1 lg:col-span-8">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Production Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {metricsLoading ? "..." : metrics?.activeJobs || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {metricsLoading ? "..." : `${metrics?.utilization || 0}%`}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Utilization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      {metricsLoading ? "..." : metrics?.overdueOperations || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Overdue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {resourcesLoading ? "..." : resources.length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Resources</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Panel */}
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  Active Alerts
                  {alerts.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {alertsLoading ? (
                    <div className="text-sm">Loading alerts...</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-xs sm:text-sm">No active alerts</div>
                    </div>
                  ) : (
                    alerts.map((alert: CockpitAlert) => (
                      <div key={alert.id} className="flex items-start gap-2 p-2 rounded border">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{alert.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {alert.message}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs flex-shrink-0">
                          {alert.severity}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Status */}
            <Card className="col-span-1 lg:col-span-6">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Factory className="h-4 w-4 sm:h-5 sm:w-5" />
                  Job Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {jobsLoading ? (
                    <div className="text-sm">Loading jobs...</div>
                  ) : (
                    jobs.slice(0, 5).map((job: any) => (
                      <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{job.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            Customer: {job.customer}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                          <Badge variant={
                            job.status === 'active' ? 'default' :
                            job.status === 'completed' ? 'secondary' :
                            job.status === 'overdue' ? 'destructive' : 'secondary'
                          } className="text-xs">
                            {job.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Priority: {job.priority}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card className="col-span-1 lg:col-span-6">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {resourcesLoading ? (
                    <div className="text-sm">Loading resources...</div>
                  ) : (
                    resources.slice(0, 4).map((resource: any) => (
                      <div key={resource.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate flex-1 mr-2">{resource.name}</span>
                          <span className="text-muted-foreground flex-shrink-0">
                            {Math.floor(Math.random() * 40 + 60)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.floor(Math.random() * 40 + 60)} 
                          className="h-2"
                        />
                        <div className="text-xs text-muted-foreground truncate">
                          Type: {resource.type}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Widgets */}
            {widgets.map((widget: CockpitWidget) => (
              <Card key={widget.id} className="col-span-1 lg:col-span-4">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span className="truncate flex-1 mr-2">{widget.title}</span>
                    <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  {widget.sub_title && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{widget.sub_title}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Widget content for {widget.type}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Welcome to Production Cockpit</h3>
              <p className="text-muted-foreground mb-4">
                Select a layout or create a new one to get started with your customizable dashboard.
              </p>
              <Button onClick={() => setNewLayoutDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Layout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}