import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity, 
  Bot, 
  Sparkles, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Grid,
  LineChart,
  Calendar,
  MapPin,
  Bell,
  Target,
  TrendingUp,
  Monitor,
  Zap,
  Layout,
  Settings,
  Save,
  RotateCcw,
  Grid3x3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useAITheme } from "@/hooks/use-ai-theme";
import { apiRequest } from "@/lib/queryClient";

import { useDeviceType, shouldShowWidget } from "@/hooks/useDeviceType";
import { TargetPlatformSelector } from "@/components/target-platform-selector";
import { Smartphone, Tablet } from "lucide-react";


interface DashboardItem {
  id: number;
  name: string;
  description?: string;
  targetPlatform?: "mobile" | "desktop" | "both";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  configuration: {
    standardWidgets: any[];
    customWidgets: any[];
  };
}

const DASHBOARD_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Grid },
  { value: 'operations', label: 'Operations', icon: Monitor },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'management', label: 'Management', icon: Target },
  { value: 'planning', label: 'Planning', icon: Calendar },
  { value: 'monitoring', label: 'Monitoring', icon: Activity }
];

const DASHBOARD_TEMPLATES = [
  {
    id: 'production-overview',
    name: 'Production Overview',
    description: 'Complete overview of production operations with key metrics and alerts',
    category: 'operations',
    icon: Monitor,
    complexity: 'Beginner',
    widgets: [
      { type: 'kpi', title: 'Active Production Orders', dataSource: 'productionOrders' },
      { type: 'chart', title: 'Production Status Distribution', dataSource: 'productionOrders', chartType: 'pie' },
      { type: 'alert', title: 'Critical Alerts', dataSource: 'alerts' }
    ]
  },
  {
    id: 'resource-monitoring',
    name: 'Resource Monitoring',
    description: 'Monitor resource utilization and capacity across all plants',
    category: 'management',
    icon: Activity,
    complexity: 'Intermediate',
    widgets: [
      { type: 'gauge', title: 'Overall Resource Utilization', dataSource: 'resources' },
      { type: 'chart', title: 'Resource Capacity by Plant', dataSource: 'resources' },
      { type: 'table', title: 'Resource Status', dataSource: 'resources' }
    ]
  },
  {
    id: 'performance-analytics',
    name: 'Performance Analytics',
    description: 'Advanced analytics for production performance and efficiency tracking',
    category: 'analytics',
    icon: TrendingUp,
    complexity: 'Advanced',
    widgets: [
      { type: 'chart', title: 'OEE Trends', dataSource: 'operations', chartType: 'line' },
      { type: 'chart', title: 'Throughput Analysis', dataSource: 'operations' },
      { type: 'kpi', title: 'Efficiency Score', dataSource: 'operations' }
    ]
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    description: 'Quality metrics and control charts for manufacturing excellence',
    category: 'monitoring',
    icon: Target,
    complexity: 'Intermediate',
    widgets: [
      { type: 'chart', title: 'Defect Rate Trends', dataSource: 'quality', chartType: 'line' },
      { type: 'gauge', title: 'First Pass Yield', dataSource: 'quality' },
      { type: 'alert', title: 'Quality Alerts', dataSource: 'alerts' }
    ]
  }
];

export default function DashboardsPage() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const { aiTheme } = useAITheme();
  const queryClient = useQueryClient();
  const currentDevice = useDeviceType();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardItem | null>(null);
  const [showEnhancedDashboardManager, setShowEnhancedDashboardManager] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);


  const [showAiDashboardDialog, setShowAiDashboardDialog] = useState(false);
  const [aiDashboardPrompt, setAiDashboardPrompt] = useState("");
  const [newDashboardTargetPlatform, setNewDashboardTargetPlatform] = useState<"mobile" | "desktop" | "both">("both");
  const [creationMode, setCreationMode] = useState<'template' | 'custom'>('template');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewDashboard, setViewDashboard] = useState<DashboardItem | null>(null);

  // Dashboard creation state
  const [newDashboard, setNewDashboard] = useState({
    name: "",
    description: "",
    category: "operations",
    template: ""
  });

  // Canvas editor state
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const [tempDashboardWidgets, setTempDashboardWidgets] = useState<any[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);

  // Fetch dashboards
  const { data: dashboards = [], isLoading: isDashboardsLoading, refetch: refetchDashboards } = useQuery<DashboardItem[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  // Fetch data for widget rendering
  const { data: productionOrders = [] } = useQuery({
    queryKey: ["/api/jobs"],
    enabled: showViewDialog && viewDashboard !== null,
    refetchInterval: 30000,
  });

  const { data: operations = [] } = useQuery({
    queryKey: ["/api/operations"],
    enabled: showViewDialog && viewDashboard !== null,
    refetchInterval: 30000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
    enabled: showViewDialog && viewDashboard !== null,
    refetchInterval: 30000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    enabled: showViewDialog && viewDashboard !== null,
    refetchInterval: 30000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/cockpit/alerts"],
    enabled: showViewDialog && viewDashboard !== null,
    refetchInterval: 30000,
  });

  // Prepare system data for universal widgets
  const systemData = {
    productionOrders: Array.isArray(productionOrders) ? productionOrders : [],
    jobs: Array.isArray(productionOrders) ? productionOrders : [], // Also map productionOrders to jobs for compatibility
    operations: Array.isArray(operations) ? operations : [],
    resources: Array.isArray(resources) ? resources : [],
    metrics: metrics && typeof metrics === 'object' ? metrics : {},
    alerts: Array.isArray(alerts) ? alerts : []
  };

  // Fetch existing widgets from all systems for the widget library
  const { data: cockpitWidgets = [] } = useQuery({
    queryKey: ['/api/cockpit/widgets'],
    select: (data: any[]) => data.map(widget => ({
      id: `cockpit-${widget.id}`,
      title: widget.title || `${widget.type} Widget`,
      type: widget.type,
      system: 'cockpit',
      configuration: widget.configuration,
      description: widget.sub_title
    }))
  });

  const { data: canvasWidgets = [] } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    select: (data: any[]) => data.map(widget => ({
      id: `canvas-${widget.id}`,
      title: widget.title || `${widget.type} Widget`,
      type: widget.type,
      system: 'canvas',
      configuration: widget.config,
      description: widget.description
    }))
  });

  const { data: dashboardWidgets = [] } = useQuery({
    queryKey: ['/api/dashboard-configs'],
    select: (data: any[]) => {
      const widgets: any[] = [];
      data.forEach(dashboard => {
        if (dashboard.configuration?.customWidgets) {
          dashboard.configuration.customWidgets.forEach((widget: any) => {
            widgets.push({
              id: `dashboard-${dashboard.id}-${widget.id}`,
              title: widget.title || `${widget.type} Widget`,
              type: widget.type,
              system: 'dashboard',
              configuration: widget.config,
              description: `From ${dashboard.name} dashboard`
            });
          });
        }
      });
      return widgets;
    }
  });

  // Combine all widgets for the library
  const allAvailableWidgets = [...cockpitWidgets, ...canvasWidgets, ...dashboardWidgets];

  // Create dashboard mutation
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Dashboard created",
        description: "Your new dashboard has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });

      setShowTemplateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  // Update dashboard mutation
  const updateDashboardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/dashboard-configs/${id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Dashboard updated",
        description: "Dashboard has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setShowEditDialog(false);
      setSelectedDashboard(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  // Delete dashboard mutation
  const deleteDashboardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dashboard-configs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Dashboard deleted",
        description: "Dashboard has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  // AI Dashboard Generation mutation
  const generateAiDashboardMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-dashboard", { prompt });
      return response;
    },
    onSuccess: (dashboardConfig: any) => {
      // Create the dashboard using the AI-generated configuration
      const dashboardData = {
        name: dashboardConfig.name || "AI Dashboard",
        description: dashboardConfig.description || "AI-generated dashboard",
        targetPlatform: "both" as const, // Default for AI-generated dashboards
        configuration: {
          standardWidgets: [],
          customWidgets: dashboardConfig.widgets || []
        }
      };
      
      createDashboardMutation.mutate(dashboardData);
      setShowAiDashboardDialog(false);
      setAiDashboardPrompt("");
    },
    onError: (error: any) => {
      const isQuotaError = error?.quotaExceeded || 
                          error?.message?.includes('quota') || 
                          error?.message?.includes('limit');
      
      toast({
        title: isQuotaError ? "OpenAI Quota Exceeded" : "AI Generation Failed",
        description: isQuotaError 
          ? "The OpenAI API quota has been exceeded. Please try again later or contact support."
          : error?.message || "Failed to generate dashboard with AI",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewDashboard({
      name: "",
      description: "",
      category: "operations",
      template: ""
    });
  };

  const handleCreateFromTemplate = (template: any) => {
    const dashboardData = {
      name: template.name,
      description: template.description,
      targetPlatform: "both", // Default for template dashboards
      isDefault: false,
      configuration: {
        standardWidgets: [],
        customWidgets: template.widgets.map((widget: any, index: number) => ({
          id: `widget-${index}`,
          title: widget.title,
          type: widget.type,
          data: widget.dataSource === 'productionOrders' ? { value: 0, label: widget.title } : {},
          visible: true,
          position: { x: (index % 3) * 220, y: Math.floor(index / 3) * 140 },
          size: { width: 200, height: 120 },
          config: { color: "blue", showTrend: true }
        }))
      }
    };
    
    createDashboardMutation.mutate(dashboardData);
  };



  const handleEdit = (dashboard: DashboardItem) => {
    setSelectedDashboard(dashboard);
    setNewDashboardName(dashboard.name);
    setNewDashboardDescription(dashboard.description || "");
    setTempDashboardWidgets(dashboard.configuration?.customWidgets || []);
    setShowEnhancedDashboardManager(true);
  };

  const handleView = (dashboard: DashboardItem) => {
    setViewDashboard(dashboard);
    setShowViewDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this dashboard?")) {
      deleteDashboardMutation.mutate(id);
    }
  };

  // Filter dashboards
  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = shouldShowWidget(dashboard.targetPlatform || "both", currentDevice);
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="container mx-auto p-6 pt-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            Dashboards
          </h1>
          <p className="text-gray-600 mt-2">Create, manage, and organize your manufacturing dashboards</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => {
              setSelectedDashboard(null);
              setShowEnhancedDashboardManager(true);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Dashboard
          </Button>

          <Button
            onClick={() => setShowAiDashboardDialog(true)}
            className={`flex items-center gap-2 ${aiTheme.gradient} text-white border-0`}
          >
            <Sparkles className="w-4 h-4" />
            New Dashboard AI
          </Button>
      
          <Button
            onClick={() => setShowTemplateDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Create from Template
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search dashboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dashboard Grid */}
      {isDashboardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-100 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard) => {
            const widgetCount = dashboard.configuration.standardWidgets.length + dashboard.configuration.customWidgets.length;
            
            return (
              <Card key={dashboard.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-600" />
                        {dashboard.name}
                        <div className="flex items-center gap-1 ml-2">
                          {dashboard.isDefault && (
                            <Badge variant="secondary">
                              <Layout className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {dashboard.targetPlatform === "mobile" && <Smartphone className="w-3 h-3 mr-1" />}
                            {dashboard.targetPlatform === "desktop" && <Monitor className="w-3 h-3 mr-1" />}
                            {dashboard.targetPlatform === "both" && <Tablet className="w-3 h-3 mr-1" />}
                            {dashboard.targetPlatform || "both"}
                          </Badge>
                        </div>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {dashboard.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Dashboard Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Grid className="w-4 h-4" />
                        {widgetCount} widgets
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(dashboard.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(dashboard)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(dashboard)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(dashboard.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isDashboardsLoading && filteredDashboards.length === 0 && (
        <div className="text-center py-12">
          <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No dashboards found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first dashboard"}
          </p>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      )}

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Dashboard Template</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {DASHBOARD_TEMPLATES.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <template.icon className="w-8 h-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {template.complexity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-700">Included widgets:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.widgets.map((widget, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {widget.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleCreateFromTemplate(template)}
                    className="w-full"
                    disabled={createDashboardMutation.isPending}
                  >
                    {createDashboardMutation.isPending ? "Creating..." : "Use Template"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>





      {/* New Dashboard Canvas Dialog */}
      <Dialog open={showEnhancedDashboardManager} onOpenChange={setShowEnhancedDashboardManager}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {selectedDashboard ? "Edit Dashboard" : "Create New Dashboard"}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (selectedDashboard) {
                      // Update existing dashboard
                      const dashboardData = {
                        name: newDashboardName || selectedDashboard.name,
                        description: newDashboardDescription || selectedDashboard.description,
                        configuration: {
                          standardWidgets: [],
                          customWidgets: tempDashboardWidgets
                        }
                      };
                      updateDashboardMutation.mutate({ id: selectedDashboard.id, data: dashboardData });
                    } else {
                      // Create new dashboard
                      const dashboardData = {
                        name: newDashboardName || "Untitled Dashboard",
                        description: newDashboardDescription || "Dashboard created with canvas editor",
                        targetPlatform: newDashboardTargetPlatform,
                        configuration: {
                          standardWidgets: [],
                          customWidgets: tempDashboardWidgets
                        }
                      };
                      createDashboardMutation.mutate(dashboardData);
                    }
                    setShowEnhancedDashboardManager(false);
                    setNewDashboardName("");
                    setNewDashboardDescription("");
                    setNewDashboardTargetPlatform("both");
                    setTempDashboardWidgets([]);
                  }}
                  disabled={createDashboardMutation.isPending || updateDashboardMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {selectedDashboard ? "Update Dashboard" : "Save Dashboard"}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full space-y-6 p-6">
              {/* Dashboard Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input
                    id="dashboard-name"
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder={selectedDashboard?.name || "Enter dashboard name"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Input
                    id="dashboard-description"
                    value={newDashboardDescription}
                    onChange={(e) => setNewDashboardDescription(e.target.value)}
                    placeholder={selectedDashboard?.description || "Enter dashboard description"}
                  />
                </div>
                
                {/* Target Platform Selector */}
                <div className="col-span-1 md:col-span-2">
                  <TargetPlatformSelector 
                    value={newDashboardTargetPlatform}
                    onChange={setNewDashboardTargetPlatform}
                    label="Target Platform"
                  />
                </div>
              </div>
              
              {/* Visual Dashboard Editor */}
              <div className="space-y-2 flex-1">
                <Label>Dashboard Layout</Label>
                <div className="border rounded-lg p-4 bg-gray-50 h-full min-h-[500px]">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Widget Library</h4>
                      <Badge variant="outline">{allAvailableWidgets.length} widgets</Badge>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {allAvailableWidgets.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {allAvailableWidgets.map((widget) => (
                            <div
                              key={widget.id}
                              className="p-2 bg-white border rounded cursor-pointer hover:bg-gray-100 text-left text-xs"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                  type: 'existing-widget',
                                  widget: widget
                                }));
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{widget.title}</div>
                                  <div className="text-gray-500 capitalize">{widget.type}</div>
                                  {widget.description && (
                                    <div className="text-gray-400 text-xs truncate mt-1">{widget.description}</div>
                                  )}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`ml-2 text-xs ${
                                    widget.system === 'cockpit' ? 'bg-blue-50 text-blue-600' :
                                    widget.system === 'canvas' ? 'bg-green-50 text-green-600' :
                                    'bg-purple-50 text-purple-600'
                                  }`}
                                >
                                  {widget.system === 'cockpit' ? 'Cockpit' : 
                                   widget.system === 'canvas' ? 'Canvas' : 'Dashboard'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Grid className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">No existing widgets found</p>
                          <p className="text-xs text-gray-400">Create widgets first to add them to dashboards</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Dashboard Canvas</h4>
                      <div className="flex items-center gap-2 text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (tempDashboardWidgets.length > 0) {
                              const maxX = Math.max(...tempDashboardWidgets.map((w: any) => w.position.x + w.size.width));
                              const maxY = Math.max(...tempDashboardWidgets.map((w: any) => w.position.y + w.size.height));
                              const padding = 40;
                              setCanvasWidth(Math.max(400, maxX + padding));
                              setCanvasHeight(Math.max(300, maxY + padding));
                            }
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Auto-size
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setCanvasWidth(800); setCanvasHeight(600); }}
                          className="h-6 px-2 text-xs"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 relative overflow-auto"
                      style={{ 
                        width: '100%', 
                        height: '400px',
                        backgroundImage: `
                          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        try {
                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                          if (data.type === 'existing-widget') {
                            const newWidget = {
                              id: `dashboard-widget-${Date.now()}`,
                              title: data.widget.title,
                              type: data.widget.type,
                              position: { x, y },
                              size: { width: 250, height: 180 },
                              visible: true,
                              data: {},
                              config: data.widget.configuration || {},
                              sourceSystem: data.widget.system,
                              sourceId: data.widget.id,
                              description: data.widget.description
                            };
                            
                            setTempDashboardWidgets([...tempDashboardWidgets, newWidget]);
                          }
                        } catch (err) {
                          console.error('Failed to parse drag data:', err);
                        }
                      }}
                    >
                      {/* Render Widgets */}
                      {tempDashboardWidgets.map((widget: any) => (
                        <div
                          key={widget.id}
                          className="absolute bg-white border rounded-lg shadow-sm group hover:border-blue-500 cursor-move"
                          style={{
                            left: widget.position?.x || 0,
                            top: widget.position?.y || 0,
                            width: widget.size?.width || 200,
                            height: widget.size?.height || 150
                          }}
                          onMouseDown={(e) => {
                            const target = e.target as HTMLElement;
                            if (target === e.currentTarget || (target && 'closest' in target && (target.closest('.widget-header') || target.closest('.widget-content')))) {
                              // Handle widget dragging
                              const startX = e.clientX - (widget.position?.x || 0);
                              const startY = e.clientY - (widget.position?.y || 0);
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const snapSize = 20; // Grid size for snapping
                                const rawX = Math.max(0, Math.min(760, e.clientX - startX)); // Canvas boundaries
                                const rawY = Math.max(0, Math.min(360, e.clientY - startY)); // Canvas boundaries
                                
                                // Snap to grid
                                const newX = Math.round(rawX / snapSize) * snapSize;
                                const newY = Math.round(rawY / snapSize) * snapSize;
                                
                                setTempDashboardWidgets(prev => prev.map((w: any) => 
                                  w.id === widget.id ? { ...w, position: { x: newX, y: newY } } : w
                                ));
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }
                          }}
                        >
                          <div className="widget-header flex items-center justify-between mb-1 p-2 cursor-move">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{widget.title}</div>
                              {widget.sourceSystem && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mt-1 ${
                                    widget.sourceSystem === 'cockpit' ? 'bg-blue-50 text-blue-600' :
                                    widget.sourceSystem === 'canvas' ? 'bg-green-50 text-green-600' :
                                    'bg-purple-50 text-purple-600'
                                  }`}
                                >
                                  {widget.sourceSystem === 'cockpit' ? 'Cockpit' : 
                                   widget.sourceSystem === 'canvas' ? 'Canvas' : 'Dashboard'}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTempDashboardWidgets(prev => prev.filter((w: any) => w.id !== widget.id));
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="widget-content px-2 pb-2 cursor-move">
                            <div className="text-xs text-gray-500 capitalize mb-1">{widget.type}</div>
                            {widget.description && (
                              <div className="text-xs text-gray-400 truncate">{widget.description}</div>
                            )}
                          </div>
                          
                          {/* Resize Handles */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {/* Corner resize handle */}
                            <div 
                              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startWidth = widget.size?.width || 200;
                                const startHeight = widget.size?.height || 150;
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const snapSize = 20; // Grid size for snapping
                                  const rawWidth = Math.max(100, Math.min(800 - (widget.position?.x || 0), startWidth + (e.clientX - startX)));
                                  const rawHeight = Math.max(80, Math.min(600 - (widget.position?.y || 0), startHeight + (e.clientY - startY)));
                                  
                                  // Snap to grid
                                  const newWidth = Math.round(rawWidth / snapSize) * snapSize;
                                  const newHeight = Math.round(rawHeight / snapSize) * snapSize;
                                  
                                  setTempDashboardWidgets(prev => prev.map((w: any) => 
                                    w.id === widget.id ? { ...w, size: { width: newWidth, height: newHeight } } : w
                                  ));
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      
                      {tempDashboardWidgets.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Grid className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Drag widgets here to build your dashboard</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Dashboard Generation Dialog */}
      <Dialog open={showAiDashboardDialog} onOpenChange={setShowAiDashboardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 ai-gradient-text" />
              Generate Dashboard with AI
            </DialogTitle>
            <div className="text-sm text-gray-600">
              Describe the type of dashboard you want to create, and AI will generate it for you with appropriate widgets and layout.
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-dashboard-prompt" className="text-sm font-medium">
                Dashboard Description
              </Label>
              <Textarea
                id="ai-dashboard-prompt"
                placeholder="Example: Create a production monitoring dashboard with KPI metrics for efficiency, quality, and throughput. Include charts showing production trends and alerts for any issues."
                value={aiDashboardPrompt}
                onChange={(e) => setAiDashboardPrompt(e.target.value)}
                className="mt-1 min-h-[120px] resize-none"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about the metrics, charts, and widgets you want to include.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAiDashboardDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (aiDashboardPrompt.trim()) {
                  generateAiDashboardMutation.mutate(aiDashboardPrompt.trim());
                }
              }}
              disabled={!aiDashboardPrompt.trim() || generateAiDashboardMutation.isPending}
              className={`flex items-center gap-2 ${aiTheme.gradient} text-white border-0`}
            >
              {generateAiDashboardMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Dashboard
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard View Modal */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              {viewDashboard?.name || "Dashboard View"}
            </DialogTitle>
            <div className="text-sm text-gray-600">
              {viewDashboard?.description || "Dashboard preview"}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {viewDashboard && (
              <>
                {/* Dashboard Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <Grid className="w-4 h-4" />
                    {(viewDashboard.configuration.standardWidgets.length + viewDashboard.configuration.customWidgets.length)} widgets
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last updated: {new Date(viewDashboard.updatedAt).toLocaleDateString()}
                  </div>
                  {viewDashboard.isDefault && (
                    <Badge variant="secondary" className="ml-auto">
                      <Layout className="w-3 h-3 mr-1" />
                      Default Dashboard
                    </Badge>
                  )}
                </div>

                {/* Live Dashboard Content */}
                <div className="border rounded-lg bg-gray-50 p-4">

                  {viewDashboard.configuration.customWidgets.length > 0 ? (
                    <div 
                      className="relative bg-white rounded border min-h-[400px] overflow-hidden"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                          linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}
                    >
                      {viewDashboard.configuration.customWidgets.map((widget: any) => {
                        // Convert dashboard widget to UniversalWidget config
                        // Map dashboard widget types to UniversalWidget types
                        const mapWidgetType = (dashboardType: string): string => {
                          switch (dashboardType) {
                            case 'metric':
                            case 'kpi':
                              return 'kpi';
                            case 'chart':
                            case 'bar':
                            case 'line':
                            case 'pie':
                            case 'doughnut':
                              return 'chart';
                            case 'table':
                            case 'list':
                              return 'table';
                            case 'alert':
                            case 'notification':
                              return 'alert';
                            case 'progress':
                              return 'progress';
                            case 'gauge':
                              return 'gauge';
                            default:
                              return 'kpi'; // Default fallback
                          }
                        };

                        // Ensure we have valid configuration from the widget
                        const widgetConfig = {
                          id: widget.id || `widget-${Math.random()}`,
                          type: mapWidgetType(widget.type || 'kpi'),
                          title: widget.title || 'Widget',
                          subtitle: widget.description,
                          dataSource: widget.dataSource || widget.config?.dataSource || 'jobs',
                          chartType: widget.chartType || widget.config?.chartType || 'bar',
                          aggregation: widget.aggregation || widget.config?.aggregation || 'count',
                          groupBy: widget.groupBy || widget.config?.groupBy,
                          sortBy: widget.sortBy || widget.config?.sortBy,
                          filters: widget.filters || widget.config?.filters,
                          colors: widget.colors || widget.config?.colors,
                          thresholds: widget.thresholds || widget.config?.thresholds,
                          limit: widget.limit || widget.config?.limit || 10,
                          size: { 
                            width: widget.size?.width || 300, 
                            height: widget.size?.height || 200 
                          },
                          position: { 
                            x: widget.position?.x || 0, 
                            y: widget.position?.y || 0 
                          },
                          refreshInterval: widget.refreshInterval || widget.config?.refreshInterval,
                          drillDownTarget: widget.drillDownTarget || widget.config?.drillDownTarget,
                          drillDownParams: widget.drillDownParams || widget.config?.drillDownParams
                        };

                        console.log('Dashboard widget:', {
                          originalType: widget.type,
                          mappedType: widgetConfig.type,
                          title: widget.title,
                          data: widget.data,
                          config: widget.config
                        });

                        return (
                          <div
                            key={widget.id}
                            className="absolute bg-white border rounded-lg shadow-sm overflow-hidden"
                            style={{
                              left: widget.position?.x || 0,
                              top: widget.position?.y || 0,
                              width: widget.size?.width || 300,
                              height: widget.size?.height || 200
                            }}
                          >
                            <div className="p-2 border-b bg-gray-50 rounded-t-lg">
                              <div className="text-sm font-medium truncate">{widget.title}</div>
                              {widget.sourceSystem && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mt-1 ${
                                    widget.sourceSystem === 'cockpit' ? 'bg-blue-50 text-blue-600' :
                                    widget.sourceSystem === 'canvas' ? 'bg-green-50 text-green-600' :
                                    'bg-purple-50 text-purple-600'
                                  }`}
                                >
                                  {widget.sourceSystem === 'cockpit' ? 'Cockpit' : 
                                   widget.sourceSystem === 'canvas' ? 'Canvas' : 'Dashboard'}
                                </Badge>
                              )}
                            </div>
                            <div className="p-2 h-full">
                              {(() => {
                                try {
                                  // For dashboard widgets with pre-existing data, render directly
                                  if (widget.data && widget.type === 'metric') {
                                    return (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-2xl font-bold text-blue-600">
                                            {widget.data.value}
                                          </span>
                                          <div className="text-right">
                                            <div className="text-xs text-gray-500 capitalize">
                                              {widget.data.label}
                                            </div>
                                            {widget.data.trend && (
                                              <div className="text-xs text-green-600">
                                                {widget.data.trend}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Fallback to simple widget display for now
                                  return (
                                    <div className="flex items-center justify-center h-full text-gray-600">
                                      <div className="text-center">
                                        <div className="text-lg font-semibold mb-1">{widget.title}</div>
                                        <div className="text-xs text-gray-400 capitalize">{widget.type} widget</div>
                                        {widget.description && (
                                          <div className="text-xs text-gray-500 mt-1">{widget.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                } catch (error) {
                                  console.error('Widget rendering error:', error);
                                  return (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                      <div className="text-center">
                                        <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">Widget unavailable</p>
                                        <p className="text-xs opacity-75">Data loading or configuration error</p>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <div className="text-center">
                        <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">This dashboard has no widgets yet</p>
                        <p className="text-xs mt-1">Use the Edit button to add widgets</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewDialog(false);
                      setTimeout(() => handleEdit(viewDashboard), 100);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Dashboard
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}