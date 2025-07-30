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
  Brain, 
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
  Wand2,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import WidgetDesignStudio from "@/components/widget-design-studio";
import UniversalWidget from "@/components/universal-widget";
import { WidgetConfig, WIDGET_TEMPLATES, WidgetTemplate } from "@/lib/widget-library";
import { apiRequest } from "@/lib/queryClient";

interface WidgetItem {
  id: string;
  title: string;
  type: string;
  system: 'cockpit' | 'canvas' | 'dashboard';
  created: string;
  lastModified: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
  configuration?: any;
}

export default function WidgetsPage() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedWidget, setSelectedWidget] = useState<WidgetItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [creationMode, setCreationMode] = useState<'studio' | 'template' | 'ai'>('studio');

  // AI Widget Creation State
  const [aiWidgetData, setAiWidgetData] = useState({
    description: "",
    dataSource: "productionOrders",
    visualizationType: "chart",
    targetSystem: "dashboard"
  });

  // Template Selection State
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);

  // Fetch widgets from all systems
  const { data: cockpitWidgets = [], isLoading: cockpitLoading } = useQuery({
    queryKey: ['/api/cockpit/widgets'],
    select: (data: any[]) => data.map(widget => ({
      id: `cockpit-${widget.id}`,
      title: widget.title || `${widget.type} Widget`,
      type: widget.type,
      system: 'cockpit' as const,
      created: widget.created_at || new Date().toISOString(),
      lastModified: widget.updated_at || new Date().toISOString(),
      status: 'active' as const,
      description: widget.sub_title,
      configuration: widget.configuration
    }))
  });

  const { data: canvasWidgets = [], isLoading: canvasLoading } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    select: (data: any[]) => data.map(widget => ({
      id: `canvas-${widget.id}`,
      title: widget.title || `${widget.type} Widget`,
      type: widget.type,
      system: 'canvas' as const,
      created: widget.created_at || new Date().toISOString(),
      lastModified: widget.updated_at || new Date().toISOString(),
      status: 'active' as const,
      description: widget.description,
      configuration: widget.config
    }))
  });

  const { data: dashboardWidgets = [], isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/dashboard-configs'],
    select: (data: any[]) => data.map(config => ({
      id: `dashboard-${config.id}`,
      title: config.name || 'Dashboard Config',
      type: 'dashboard',
      system: 'dashboard' as const,
      created: config.created_at || new Date().toISOString(),
      lastModified: config.updated_at || new Date().toISOString(),
      status: 'active' as const,
      description: config.description,
      configuration: config.config
    }))
  });

  // Combine all widgets
  const allWidgets = [...cockpitWidgets, ...canvasWidgets, ...dashboardWidgets];
  const isLoading = cockpitLoading || canvasLoading || dashboardLoading;

  // Filter widgets based on search and filters
  const filteredWidgets = allWidgets.filter(widget => {
    const matchesSearch = widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || widget.type === filterType;
    const matchesSystem = filterSystem === "all" || widget.system === filterSystem;
    const matchesStatus = filterStatus === "all" || widget.status === filterStatus;

    return matchesSearch && matchesType && matchesSystem && matchesStatus;
  });

  // Widget metrics
  const metrics = {
    total: allWidgets.length,
    bySystem: {
      cockpit: cockpitWidgets.length,
      canvas: canvasWidgets.length,
      dashboard: dashboardWidgets.length
    },
    byType: allWidgets.reduce((acc, widget) => {
      acc[widget.type] = (acc[widget.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    active: allWidgets.filter(w => w.status === 'active').length
  };

  // Widget type options for filtering
  const widgetTypes = [
    { value: "metrics", label: "Metrics", icon: BarChart3 },
    { value: "chart", label: "Charts", icon: PieChart },
    { value: "alerts", label: "Alerts", icon: Bell },
    { value: "schedule", label: "Schedule", icon: Calendar },
    { value: "resources", label: "Resources", icon: Grid },
    { value: "production", label: "Production", icon: Activity },
    { value: "kpi", label: "KPI Dashboard", icon: TrendingUp },
    { value: "activity", label: "Activity Feed", icon: Monitor }
  ];

  // AI Widget Creation Mutation
  const aiWidgetMutation = useMutation({
    mutationFn: async (data: typeof aiWidgetData) => {
      const response = await fetch('/api/ai/generate-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Widget Created",
        description: `${data.title} has been generated and added to ${aiWidgetData.targetSystem}`,
      });
      setShowAIDialog(false);
      setAiWidgetData({
        description: "",
        dataSource: "productionOrders",
        visualizationType: "chart",
        targetSystem: "dashboard"
      });
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error Creating Widget",
        description: "Failed to generate AI widget. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete Widget Mutation
  const deleteWidgetMutation = useMutation({
    mutationFn: async (widget: WidgetItem) => {
      const [system, id] = widget.id.split('-');
      let endpoint = '';
      
      switch (system) {
        case 'cockpit':
          endpoint = `/api/cockpit/widgets/${id}`;
          break;
        case 'canvas':
          endpoint = `/api/canvas/widgets/${id}`;
          break;
        case 'dashboard':
          endpoint = `/api/dashboard-configs/${id}`;
          break;
      }

      const response = await fetch(endpoint, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Widget Deleted",
        description: "Widget has been successfully deleted.",
      });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete widget.",
        variant: "destructive"
      });
    }
  });

  const handleWidgetCreate = (widget: WidgetConfig, targetSystems: string[]) => {
    toast({
      title: "Widget Created",
      description: `${widget.title} has been added to ${targetSystems.join(', ')}`,
    });
    setShowStudio(false);
    queryClient.invalidateQueries();
  };

  const getSystemBadgeColor = (system: string) => {
    switch (system) {
      case 'cockpit': return 'bg-blue-100 text-blue-800';
      case 'canvas': return 'bg-green-100 text-green-800';
      case 'dashboard': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWidgetIcon = (type: string) => {
    const typeConfig = widgetTypes.find(t => t.value === type);
    return typeConfig?.icon || Grid;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Grid className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Widget Management</h1>
            <Badge variant="outline">{metrics.total} widgets</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowStudio(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Widget
            </Button>
            <Button 
              onClick={() => setShowAIDialog(true)} 
              variant="outline"
              className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Brain className="h-4 w-4" />
              AI Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.active} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cockpit Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.bySystem.cockpit}</div>
              <p className="text-xs text-muted-foreground">Production focused</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canvas Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.bySystem.canvas}</div>
              <p className="text-xs text-muted-foreground">Custom layouts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dashboard Configs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{metrics.bySystem.dashboard}</div>
              <p className="text-xs text-muted-foreground">Analytics dashboards</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Widgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {widgetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="system-filter">System</Label>
                <Select value={filterSystem} onValueChange={setFilterSystem}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Systems</SelectItem>
                    <SelectItem value="cockpit">Cockpit</SelectItem>
                    <SelectItem value="canvas">Canvas</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget List */}
        <Card>
          <CardHeader>
            <CardTitle>Widgets ({filteredWidgets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No widgets found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWidgets.map((widget) => {
                  const IconComponent = getWidgetIcon(widget.type);
                  return (
                    <Card key={widget.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold truncate">{widget.title}</h3>
                          </div>
                          <Badge className={`text-xs ${getSystemBadgeColor(widget.system)}`}>
                            {widget.system}
                          </Badge>
                        </div>
                        {widget.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {widget.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            <p>Type: {widget.type}</p>
                            <p>Modified: {new Date(widget.lastModified).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => deleteWidgetMutation.mutate(widget)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Widget Design Studio Dialog */}
      <Dialog open={showStudio} onOpenChange={setShowStudio}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Widget Design Studio</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <WidgetDesignStudio
              open={showStudio}
              onOpenChange={setShowStudio}
              onWidgetCreate={handleWidgetCreate}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Widget Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI-Powered Widget Creation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-description">Describe the widget you need</Label>
              <Textarea
                id="ai-description"
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
            <div>
              <Label htmlFor="target-system">Target System</Label>
              <Select
                value={aiWidgetData.targetSystem}
                onValueChange={(value) => setAiWidgetData({ ...aiWidgetData, targetSystem: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cockpit">Production Cockpit</SelectItem>
                  <SelectItem value="canvas">Canvas Dashboard</SelectItem>
                  <SelectItem value="dashboard">Analytics Dashboard</SelectItem>
                </SelectContent>
              </Select>
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
  );
}