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
import { useMobile } from "@/hooks/use-mobile";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import UniversalWidget from "@/components/universal-widget";
import WidgetDesignStudio from "@/components/widget-design-studio";
import WidgetStudioButton from "@/components/widget-studio-button";
import { WidgetConfig, WidgetDataProcessor, SystemData, convertUniversalToCockpitWidget, WIDGET_TEMPLATES, WidgetTemplate } from "@/lib/widget-library";
import { apiRequest } from "@/lib/queryClient";

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

// Helper functions for widget type mapping
function mapCockpitTypeToUniversalType(cockpitType: string): 'kpi' | 'chart' | 'table' | 'alert' | 'progress' | 'gauge' | 'list' {
  switch (cockpitType) {
    case 'metrics':
    case 'kpi':
      return 'kpi';
    case 'chart':
      return 'chart';
    case 'alerts':
      return 'alert';
    case 'schedule':
    case 'production':
      return 'table';
    case 'resources':
      return 'gauge';
    case 'activity':
      return 'list';
    default:
      return 'kpi';
  }
}

function getDefaultDataSource(cockpitType: string): string {
  switch (cockpitType) {
    case 'metrics':
    case 'kpi':
      return 'productionOrders';
    case 'chart':
      return 'productionOrders';
    case 'alerts':
      return 'alerts';
    case 'schedule':
    case 'production':
      return 'operations';
    case 'resources':
      return 'resources';
    case 'activity':
      return 'productionOrders';
    default:
      return 'productionOrders';
  }
}

export default function ProductionCockpit() {
  const [maximized, setMaximized] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [newLayoutDialog, setNewLayoutDialog] = useState(false);
  const [newWidgetDialog, setNewWidgetDialog] = useState(false);
  const [widgetCreationMode, setWidgetCreationMode] = useState<'basic' | 'template'>('basic');
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
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
    dataSource: "productionOrders",
    visualizationType: "chart"
  });
  const [optimizationDialog, setOptimizationDialog] = useState(false);
  const [optimizationHistoryDialog, setOptimizationHistoryDialog] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [algorithmParameters, setAlgorithmParameters] = useState<any>({});
  const [widgetStudioOpen, setWidgetStudioOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();

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

  // Fetch operations
  const { data: operations = [] } = useQuery<any[]>({
    queryKey: ["/api/operations"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch capabilities
  const { data: capabilities = [] } = useQuery<any[]>({
    queryKey: ["/api/capabilities"],
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false
  });

  // Fetch optimization algorithms
  const { data: algorithms = [] } = useQuery<any[]>({
    queryKey: ["/api/optimization/algorithms"],
  });

  // Fetch optimization profiles for selected algorithm
  const { data: profiles = [] } = useQuery({
    queryKey: ['/api/optimization-profiles/algorithm', selectedAlgorithm?.id],
    queryFn: async () => {
      if (!selectedAlgorithm?.id) return [];
      const response = await fetch(`/api/optimization-profiles/algorithm/${selectedAlgorithm.id}`);
      if (!response.ok) throw new Error('Failed to fetch profiles');
      return response.json();
    },
    enabled: !!selectedAlgorithm?.id
  });

  // Fetch default profile for selected algorithm
  const { data: defaultProfile } = useQuery({
    queryKey: ['/api/optimization-profiles/algorithm', selectedAlgorithm?.id, 'default'],
    queryFn: async () => {
      if (!selectedAlgorithm?.id) return null;
      const response = await fetch(`/api/optimization-profiles/algorithm/${selectedAlgorithm.id}/default`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedAlgorithm?.id
  });

  // Fetch scheduling history
  const { data: schedulingHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/scheduling-history"],
  });

  // Prepare system data for widgets
  const systemData: SystemData = {
    jobs,
    operations,
    resources,
    capabilities,
    metrics,
    alerts
  };

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
        dataSource: "productionOrders",
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

  // Optimization execution mutation
  const optimizationMutation = useMutation({
    mutationFn: (data: { algorithmId: number; profileId?: number; parameters: any }) =>
      fetch("/api/optimization/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling-history"] });
      setOptimizationDialog(false);
      setSelectedAlgorithm(null);
      setAlgorithmParameters({});
      toast({ 
        title: "Optimization completed successfully",
        description: `${result.optimizedOperations || 0} operations optimized`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Optimization failed", 
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

  // Auto-select default profile when algorithm is selected
  useEffect(() => {
    if (selectedAlgorithm && defaultProfile && !selectedProfile) {
      setSelectedProfile(defaultProfile);
    }
  }, [selectedAlgorithm, defaultProfile, selectedProfile]);

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
    
    if (widgetCreationMode === 'template' && selectedTemplate) {
      // Create widget from template
      const widget: WidgetConfig = {
        id: `widget-${Date.now()}`,
        ...selectedTemplate.defaultConfig,
        title: selectedTemplate.name,
        subtitle: selectedTemplate.description,
        position: { x: 0, y: 0 }
      };
      
      const cockpitWidget = convertUniversalToCockpitWidget(widget, selectedLayout);
      createWidgetMutation.mutate(cockpitWidget);
    } else {
      // Create basic widget
      createWidgetMutation.mutate({
        ...newWidgetData,
        layout_id: selectedLayout,
        configuration: getDefaultWidgetConfig(newWidgetData.type)
      });
    }
  };



  const getDefaultWidgetConfig = (type: string) => {
    switch (type) {
      case "metrics":
        return { metrics: ["activeJobs", "utilization", "efficiency"], showTrends: true };
      case "chart":
        return { chartType: "bar", dataSource: "productionOrders", groupBy: "status" };
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

  const handleWidgetCreate = (widget: WidgetConfig, targetSystems: string[]) => {
    if (!selectedLayout) {
      toast({
        title: "No Layout Selected",
        description: "Please select a layout first",
        variant: "destructive"
      });
      return;
    }

    if (targetSystems.includes('cockpit')) {
      const cockpitWidget = convertUniversalToCockpitWidget(widget, selectedLayout);
      createWidgetMutation.mutate(cockpitWidget);
    }

    // Could also save to other systems if they're selected
    toast({
      title: "Widget Created",
      description: `${widget.title} has been added to ${targetSystems.join(', ')}`,
    });
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

  // Get widget templates that target cockpit
  const cockpitTemplates = WIDGET_TEMPLATES.filter(template => 
    template.targetSystems.includes('cockpit')
  );

  return (
    <div className={`min-h-screen bg-background ${maximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between p-3 lg:p-4 border-b bg-card gap-3 lg:gap-4 ${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
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

            {/* Widget Studio Button */}
            <WidgetStudioButton
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              targetSystems={['cockpit']}
              onWidgetCreate={handleWidgetCreate}
            >
              <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create Widget</span>
              <span className="sm:hidden">Widget</span>
            </WidgetStudioButton>

            {/* Optimization Dialog */}
            <Dialog open={optimizationDialog} onOpenChange={setOptimizationDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm">
                  <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Run Optimization</span>
                  <span className="sm:hidden">Optimize</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-500" />
                    Run Optimization Algorithm
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="algorithm-select">Select Algorithm</Label>
                    <Select
                      value={selectedAlgorithm?.id?.toString()}
                      onValueChange={(value) => {
                        const algorithm = algorithms.find(a => a.id === parseInt(value));
                        setSelectedAlgorithm(algorithm);
                        setAlgorithmParameters({});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose optimization algorithm..." />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms.filter(a => a.status === 'approved').map((algorithm) => (
                          <SelectItem key={algorithm.id.toString()} value={algorithm.id.toString()}>
                            {algorithm.displayName || algorithm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAlgorithm && (
                    <>
                      <div>
                        <Label htmlFor="profile-select">Optimization Profile</Label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedProfile?.id?.toString()}
                            onValueChange={(value) => {
                              const profile = profiles.find((p: any) => p.id === parseInt(value));
                              setSelectedProfile(profile);
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Choose optimization profile..." />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map((profile: any) => (
                                <SelectItem key={profile.id.toString()} value={profile.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {profile.name}
                                    {profile.isDefault && (
                                      <Badge variant="secondary" className="text-xs">Default</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowProfileDialog(true)}
                            disabled={!selectedProfile}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {selectedProfile && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">Profile: {selectedProfile.name}</p>
                          {selectedProfile.description && (
                            <p className="text-xs text-muted-foreground mb-2">{selectedProfile.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Execution Scope:</strong></p>
                            <p>• {jobs.length} active jobs will be optimized</p>
                            <p>• {operations.length} operations will be analyzed</p>
                            <p>• {resources.length} resources available for assignment</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <Button 
                    onClick={() => {
                      if (selectedAlgorithm && selectedProfile) {
                        optimizationMutation.mutate({
                          algorithmId: selectedAlgorithm.id,
                          profileId: selectedProfile.id,
                          parameters: algorithmParameters
                        });
                      }
                    }}
                    disabled={!selectedAlgorithm || !selectedProfile || optimizationMutation.isPending}
                    className="w-full"
                  >
                    {optimizationMutation.isPending ? "Running..." : "Execute Optimization"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Optimization History Dialog */}
            <Dialog open={optimizationHistoryDialog} onOpenChange={setOptimizationHistoryDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                  <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Optimization History</span>
                  <span className="sm:hidden">History</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Optimization History & Results
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {schedulingHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No optimization history available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedulingHistory.slice(0, 10).map((entry: any) => (
                        <Card key={entry.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={entry.status === 'completed' ? 'default' : 'secondary'}>
                                {entry.status}
                              </Badge>
                              <span className="font-medium">{entry.algorithmName}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.executedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Operations Optimized:</strong> {entry.operationsCount || 0}</p>
                            <p><strong>Execution Time:</strong> {entry.executionTime || 'N/A'}ms</p>
                            <p><strong>Performance Score:</strong> {entry.performanceScore || 'N/A'}</p>
                            {entry.summary && (
                              <p className="text-muted-foreground mt-2">{entry.summary}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Profile Adjustment Dialog */}
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Optimization Profile Settings
                  </DialogTitle>
                </DialogHeader>
                {selectedProfile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Profile Name</Label>
                        <p className="text-sm text-muted-foreground">{selectedProfile.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Algorithm</Label>
                        <p className="text-sm text-muted-foreground">{selectedAlgorithm?.displayName || selectedAlgorithm?.name}</p>
                      </div>
                    </div>
                    
                    {selectedProfile.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{selectedProfile.description}</p>
                      </div>
                    )}

                    <div className="bg-muted p-4 rounded-lg">
                      <Label className="text-sm font-medium mb-3 block">Profile Configuration</Label>
                      <div className="space-y-3">
                        {selectedProfile.profileConfig && (
                          <div className="space-y-2">
                            {Object.entries(selectedProfile.profileConfig).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-xs capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-xs text-muted-foreground">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowProfileDialog(false)}
                      >
                        Close
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          // Navigate to optimization studio for full profile editing
                          window.location.href = '/optimization-studio';
                        }}
                      >
                        Edit in Optimization Studio
                      </Button>
                    </div>
                  </div>
                )}
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

            <Dialog open={newWidgetDialog} onOpenChange={(open) => {
              setNewWidgetDialog(open);
              if (!open) {
                setWidgetCreationMode('basic');
                setSelectedTemplate(null);
                setNewWidgetData({ type: "metrics", title: "", sub_title: "", position: { x: 0, y: 0, w: 4, h: 3 } });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!selectedLayout} className="text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Widget</span>
                  <span className="sm:hidden">Widget</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                </DialogHeader>
                
                {/* Mode Selection */}
                <div className="flex gap-2">
                  <Button 
                    variant={widgetCreationMode === 'basic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setWidgetCreationMode('basic');
                      setSelectedTemplate(null);
                    }}
                  >
                    Basic Widgets
                  </Button>
                  <Button 
                    variant={widgetCreationMode === 'template' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWidgetCreationMode('template')}
                  >
                    Widget Library ({cockpitTemplates.length})
                  </Button>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                  {widgetCreationMode === 'basic' ? (
                    // Basic Widget Creation
                    <>
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
                    </>
                  ) : (
                    // Widget Library Templates
                    <>
                      <div>
                        <Label>Choose from Widget Library</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {cockpitTemplates.map((template) => (
                            <div
                              key={template.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <div className="flex items-start gap-3">
                                <template.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {template.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {template.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {template.complexity}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {selectedTemplate && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start gap-3">
                            <selectedTemplate.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium">{selectedTemplate.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {selectedTemplate.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">
                                Data Source: {selectedTemplate.defaultConfig.dataSource} | 
                                Type: {selectedTemplate.defaultConfig.type}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button 
                  onClick={handleCreateWidget} 
                  className="w-full"
                  disabled={
                    widgetCreationMode === 'basic' 
                      ? !newWidgetData.type || !newWidgetData.title
                      : !selectedTemplate
                  }
                >
                  {widgetCreationMode === 'basic' ? 'Add Widget' : 'Add from Library'}
                </Button>
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
                          <SelectItem value="productionOrders">Production Orders</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="resources">Resources</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="vendors">Vendors</SelectItem>
                          <SelectItem value="plants">Plants</SelectItem>
                          <SelectItem value="capabilities">Capabilities</SelectItem>
                          <SelectItem value="recipes">Recipes</SelectItem>
                          <SelectItem value="productionVersions">Production Versions</SelectItem>
                          <SelectItem value="plannedOrders">Planned Orders</SelectItem>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="metrics">Metrics</SelectItem>
                          <SelectItem value="alerts">Alerts</SelectItem>
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

            {/* Widget Design Studio */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setWidgetStudioOpen(true)}
              className="border-purple-500 text-purple-600 hover:bg-purple-50 text-xs sm:text-sm"
            >
              <Wand2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Widget Studio</span>
              <span className="sm:hidden">Studio</span>
            </Button>
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
            {widgets.map((widget: CockpitWidget) => {
              // Convert cockpit widget to universal widget config
              const widgetConfig: WidgetConfig = {
                id: widget.id.toString(),
                type: mapCockpitTypeToUniversalType(widget.type),
                title: widget.title,
                subtitle: widget.sub_title,
                dataSource: widget.configuration?.dataSource || getDefaultDataSource(widget.type),
                chartType: widget.configuration?.chartType || 'bar',
                aggregation: widget.configuration?.aggregation || 'count',
                groupBy: widget.configuration?.groupBy || 'status',
                filters: widget.configuration?.filters,
                colors: widget.configuration?.colors,
                thresholds: widget.configuration?.thresholds,
                size: { width: 400, height: 300 },
                position: widget.position || { x: 0, y: 0 }
              };

              return (
                <div key={widget.id} className="col-span-1 lg:col-span-4">
                  <UniversalWidget 
                    config={widgetConfig}
                    data={systemData}
                    onEdit={(id) => {
                      // Handle widget editing
                      toast({ title: "Edit widget functionality coming soon" });
                    }}
                    onRemove={(id) => {
                      // Handle widget removal
                      toast({ title: "Remove widget functionality coming soon" });
                    }}
                    onRefresh={(id) => {
                      queryClient.invalidateQueries({ queryKey: ["/api/cockpit/widgets", selectedLayout] });
                    }}
                    showControls={true}
                  />
                </div>
              );
            })}
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

      {/* Widget Design Studio */}
      <WidgetDesignStudio
        open={widgetStudioOpen}
        onOpenChange={setWidgetStudioOpen}
        onWidgetCreate={handleWidgetCreate}
      />
    </div>
  );
}