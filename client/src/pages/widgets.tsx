import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { useAITheme } from "@/hooks/use-ai-theme";

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
  const { aiTheme } = useAITheme();
  
  // Scroll position management
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewWidget, setPreviewWidget] = useState<WidgetItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<WidgetItem | null>(null);

  // AI Widget Creation State
  const [aiWidgetData, setAiWidgetData] = useState({
    description: "",
    dataSource: "productionOrders",
    visualizationType: "chart",
    targetSystems: ["dashboard"] as string[]
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
        description: `${data.title} has been generated and added to ${aiWidgetData.targetSystems.join(', ')}`,
      });
      setShowAIDialog(false);
      setAiWidgetData({
        description: "",
        dataSource: "productionOrders",
        visualizationType: "chart",
        targetSystems: ["dashboard"]
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

      const response = await apiRequest('DELETE', endpoint);
      return response.json();
    },
    onMutate: async (widget) => {
      // Store current scroll position before mutation
      savedScrollPosition.current = window.scrollY;
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/cockpit/widgets"] });
      await queryClient.cancelQueries({ queryKey: ["/api/canvas/widgets"] });
      await queryClient.cancelQueries({ queryKey: ["/api/dashboard-configs"] });

      // Snapshot previous values for rollback
      const previousCockpitWidgets = queryClient.getQueryData(["/api/cockpit/widgets"]);
      const previousCanvasWidgets = queryClient.getQueryData(["/api/canvas/widgets"]);
      const previousDashboardConfigs = queryClient.getQueryData(["/api/dashboard-configs"]);

      // Optimistically remove the widget from the UI
      const [system, id] = widget.id.split('-');
      
      if (system === 'cockpit') {
        queryClient.setQueryData(["/api/cockpit/widgets"], (old: any) => 
          old ? old.filter((w: any) => w.id !== parseInt(id)) : []
        );
      } else if (system === 'canvas') {
        queryClient.setQueryData(["/api/canvas/widgets"], (old: any) => 
          old ? old.filter((w: any) => w.id !== parseInt(id)) : []
        );
      } else if (system === 'dashboard') {
        queryClient.setQueryData(["/api/dashboard-configs"], (old: any) => 
          old ? old.filter((w: any) => w.id !== parseInt(id)) : []
        );
      }

      // Return context for rollback on error
      return {
        previousCockpitWidgets,
        previousCanvasWidgets,
        previousDashboardConfigs
      };
    },
    onSuccess: () => {
      toast({
        title: "Widget Deleted",
        description: "Widget has been successfully deleted.",
      });
      // Don't invalidate queries here since we're using optimistic updates
      // The widget should already be removed from UI immediately
    },
    onError: (error, widget, context) => {
      // Rollback optimistic updates on error
      if (context) {
        queryClient.setQueryData(["/api/cockpit/widgets"], context.previousCockpitWidgets);
        queryClient.setQueryData(["/api/canvas/widgets"], context.previousCanvasWidgets);
        queryClient.setQueryData(["/api/dashboard-configs"], context.previousDashboardConfigs);
      }
      
      toast({
        title: "Error",
        description: "Failed to delete widget.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Restore scroll position after mutation completes and DOM updates
      // Use multiple frames to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (savedScrollPosition.current > 0) {
            window.scrollTo(0, savedScrollPosition.current);
            savedScrollPosition.current = 0;
          }
        });
      });
    }
  });

  const handleWidgetCreate = (widget: WidgetConfig, targetSystems: string[]) => {
    toast({
      title: selectedWidget ? "Widget Updated" : "Widget Created",
      description: `${widget.title} has been ${selectedWidget ? 'updated in' : 'added to'} ${targetSystems.join(', ')}`,
    });
    setShowStudio(false);
    setSelectedWidget(null); // Clear selection after create/edit
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

  // Widget action handlers
  const handleViewWidget = (widget: WidgetItem) => {
    setPreviewWidget(widget);
    setShowPreviewDialog(true);
  };

  const handleEditWidget = (widget: WidgetItem) => {
    // Convert widget data to WidgetConfig format for editing
    const editConfig: WidgetConfig = {
      id: widget.id,
      title: widget.title,
      type: widget.type as any,
      subtitle: widget.description || '',
      ...widget.configuration
    };
    
    // Open Widget Design Studio in edit mode
    setSelectedWidget(widget);
    setShowStudio(true);
    setCreationMode('studio');
  };

  const handleCopyWidget = async (widget: WidgetItem) => {
    try {
      // Create a copy of the widget configuration
      const copiedConfig = {
        ...widget.configuration,
        title: `${widget.title} (Copy)`,
        id: undefined // Let system generate new ID
      };

      // Copy to clipboard as JSON for now
      await navigator.clipboard.writeText(JSON.stringify(copiedConfig, null, 2));
      
      toast({
        title: "Widget Copied",
        description: `${widget.title} configuration copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy widget configuration",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWidget = (widget: WidgetItem) => {
    setWidgetToDelete(widget);
    setShowDeleteDialog(true);
  };

  const confirmDeleteWidget = () => {
    if (widgetToDelete) {
      deleteWidgetMutation.mutate(widgetToDelete);
      setShowDeleteDialog(false);
      setWidgetToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-8 md:pb-16">
      {/* Header */}
      <div className="border-b bg-card px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 lg:ml-6">
            <Grid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Widgets</h1>
            <Badge variant="outline" className="text-xs">{metrics.total} widgets</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowStudio(true)} 
              variant="outline"
              className="gap-1 sm:gap-2 text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Widget</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button 
              onClick={() => setShowAIDialog(true)} 
              className={`gap-1 sm:gap-2 text-sm ${aiTheme.gradient} text-white border-0`}
              size={isMobile ? "sm" : "default"}
            >
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Widget AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Widgets</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-lg sm:text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.active} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Cockpit Widgets</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{metrics.bySystem.cockpit}</div>
              <p className="text-xs text-muted-foreground">Production focused</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Canvas Widgets</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{metrics.bySystem.canvas}</div>
              <p className="text-xs text-muted-foreground">Custom layouts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Dashboard Configs</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{metrics.bySystem.dashboard}</div>
              <p className="text-xs text-muted-foreground">Analytics dashboards</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Search & Filter Widgets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <Input
                  id="search"
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="type-filter" className="text-sm">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="text-sm">
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
                <Label htmlFor="system-filter" className="text-sm">System</Label>
                <Select value={filterSystem} onValueChange={setFilterSystem}>
                  <SelectTrigger className="text-sm">
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
                <Label htmlFor="status-filter" className="text-sm">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-sm">
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
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Widgets ({filteredWidgets.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No widgets found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredWidgets.map((widget) => {
                  const IconComponent = getWidgetIcon(widget.type);
                  return (
                    <Card key={widget.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                            <h3 className="font-semibold truncate text-sm sm:text-base">{widget.title}</h3>
                          </div>
                          <Badge className={`text-xs flex-shrink-0 ${getSystemBadgeColor(widget.system)}`}>
                            {widget.system}
                          </Badge>
                        </div>
                        {widget.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {widget.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground min-w-0 flex-1">
                            <p className="truncate">Type: {widget.type}</p>
                            <p className="truncate">Modified: {new Date(widget.lastModified).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-blue-100"
                              onClick={() => handleViewWidget(widget)}
                              title="Preview widget"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100"
                              onClick={() => handleEditWidget(widget)}
                              title="Edit widget"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-purple-100"
                              onClick={() => handleCopyWidget(widget)}
                              title="Copy widget configuration"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                              onClick={() => handleDeleteWidget(widget)}
                              title="Delete widget"
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

      {/* Widget Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Widget Preview: {previewWidget?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 bg-gray-50 rounded-lg">
            {previewWidget && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {previewWidget.type}
                  </div>
                  <div>
                    <span className="font-medium">System:</span> 
                    <Badge className={`ml-2 ${getSystemBadgeColor(previewWidget.system)}`}>
                      {previewWidget.system}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(previewWidget.created).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Modified:</span> {new Date(previewWidget.lastModified).toLocaleString()}
                  </div>
                </div>
                
                {previewWidget.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-sm text-muted-foreground">{previewWidget.description}</p>
                  </div>
                )}
                
                {previewWidget.configuration && (
                  <div>
                    <span className="font-medium">Configuration:</span>
                    <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(previewWidget.configuration, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Live Widget Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="text-sm font-medium mb-2">Live Preview:</div>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <UniversalWidget 
                      config={{
                        id: previewWidget.id,
                        title: previewWidget.title,
                        type: previewWidget.type as any,
                        ...previewWidget.configuration
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Widget
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{widgetToDelete?.title}"? This action cannot be undone.
              The widget will be permanently removed from the {widgetToDelete?.system} system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWidget}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Widget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Widget Design Studio Dialog */}
      <Dialog open={showStudio} onOpenChange={(open) => {
        setShowStudio(open);
        if (!open) {
          setSelectedWidget(null); // Clear selection when dialog closes
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Widget Design Studio</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <WidgetDesignStudio
              open={showStudio}
              onOpenChange={setShowStudio}
              onWidgetCreate={handleWidgetCreate}
              editingWidget={selectedWidget ? {
                id: selectedWidget.id,
                title: selectedWidget.title,
                type: selectedWidget.type as any,
                subtitle: selectedWidget.description || '',
                ...selectedWidget.configuration
              } : undefined}
              mode={selectedWidget ? 'edit' : 'create'}
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
              <Label htmlFor="target-systems">Target Systems</Label>
              <div className="border rounded-md p-3 space-y-2">
                {[
                  { value: 'cockpit', label: 'Production Cockpit' },
                  { value: 'canvas', label: 'Canvas Dashboard' },
                  { value: 'dashboard', label: 'Analytics Dashboard' }
                ].map(system => (
                  <div key={system.value} className="flex items-center space-x-2">
                    <Switch
                      id={`ai-${system.value}`}
                      checked={aiWidgetData.targetSystems.includes(system.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAiWidgetData({
                            ...aiWidgetData,
                            targetSystems: [...aiWidgetData.targetSystems, system.value]
                          });
                        } else {
                          setAiWidgetData({
                            ...aiWidgetData,
                            targetSystems: aiWidgetData.targetSystems.filter(s => s !== system.value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`ai-${system.value}`} className="text-sm font-normal">
                      {system.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => aiWidgetMutation.mutate(aiWidgetData)} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={aiWidgetMutation.isPending || !aiWidgetData.description || aiWidgetData.targetSystems.length === 0}
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