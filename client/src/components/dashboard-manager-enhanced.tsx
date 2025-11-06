import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAITheme } from "@/hooks/use-ai-theme";
import { Plus, Settings, Star, Trash2, Edit3, Eye, Save, Move, Palette, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, PieChart, Activity, Zap, Users, Package, Wrench, ArrowUp, ArrowDown, MoreHorizontal, Grid3x3, Maximize2, Minimize2, RotateCcw, Sparkles, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useDrag, useDrop, useDragLayer, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


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
  configuration: {
    standardWidgets: AnalyticsWidget[];
    customWidgets: AnalyticsWidget[];
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboards: DashboardConfig[];
  currentDashboard: DashboardConfig | null;
  onDashboardSelect: (dashboard: DashboardConfig) => void;
  onDashboardCreate: (dashboard: DashboardConfig) => void;
  onDashboardUpdate: (dashboard: DashboardConfig) => void;
  onDashboardDelete: (dashboardId: number) => void;
  standardWidgets: AnalyticsWidget[];
  customWidgets: AnalyticsWidget[];
}

export function EnhancedDashboardManager({
  open,
  onOpenChange,
  dashboards,
  currentDashboard,
  onDashboardSelect,
  onDashboardCreate,
  onDashboardUpdate,
  onDashboardDelete,
  standardWidgets,
  customWidgets,
}: DashboardManagerProps) {
  const [viewMode, setViewMode] = useState<"dashboards" | "widgets">("dashboards");
  const [editingDashboard, setEditingDashboard] = useState<DashboardConfig | null>(null);
  const [editingWidget, setEditingWidget] = useState<AnalyticsWidget | null>(null);
  const [editMode, setEditMode] = useState<"manual" | "ai">("manual");
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");


  const [aiWidgetPrompt, setAiWidgetPrompt] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isEditDialogMaximized, setIsEditDialogMaximized] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardConfig | null>(null);
  const [widgetToDelete, setWidgetToDelete] = useState<AnalyticsWidget | null>(null);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetType, setNewWidgetType] = useState<"metric" | "chart" | "table" | "progress">("metric");
  const [newWidgetConfig, setNewWidgetConfig] = useState<any>({});
  const [newWidgetData, setNewWidgetData] = useState<any>({});
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();

  // Get all widgets from all dashboards
  const allWidgets = dashboards.flatMap(dashboard => [
    ...(dashboard.configuration.standardWidgets || []),
    ...(dashboard.configuration.customWidgets || [])
  ]);

  // Mutations
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      });
      onDashboardCreate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setNewDashboardName("");
      setNewDashboardDescription("");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });



  const updateDashboardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/dashboard-configs/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      });
      onDashboardUpdate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setIsEditDialogOpen(false);
      setEditingDashboard(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/dashboard-configs/${id}`);
      return await response.json();
    },
    onSuccess: (data, id) => {
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });
      onDashboardDelete(id);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setIsDeleteDialogOpen(false);
      setDashboardToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });



  // AI Widget Creation Mutation
  const aiWidgetMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-widget", {
        prompt: prompt,
        targetSystems: ["analytics", "dashboard"]
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const successfulDeployments = data.deployments?.filter(d => d.success) || [];
        const failedDeployments = data.deployments?.filter(d => !d.success) || [];
        
        if (successfulDeployments.length > 0) {
          toast({
            title: "Success",
            description: `AI widget created and deployed to ${successfulDeployments.map(d => d.system).join(', ')}`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/widgets"] });
          queryClient.invalidateQueries({ queryKey: ["/api/canvas/widgets"] });
          setAiWidgetPrompt("");
          setIsEditDialogOpen(false);
        } else if (failedDeployments.length > 0) {
          toast({
            title: "Partial Success",
            description: `Widget created but deployment failed: ${failedDeployments[0]?.error || 'Unknown error'}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create AI widget",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create AI widgets",
        variant: "destructive",
      });
    },
  });

  // Handle dashboard creation
  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) return;

    const dashboardData = {
      name: newDashboardName,
      description: newDashboardDescription,
      configuration: {
        standardWidgets: [],
        customWidgets: [],
      },
    };

    createDashboardMutation.mutate(dashboardData);
  };

  // Handle dashboard update
  const handleUpdateDashboard = async () => {
    if (!editingDashboard || !newDashboardName.trim()) return;

    const dashboardData = {
      name: newDashboardName,
      description: newDashboardDescription,
      configuration: editingDashboard.configuration,
    };

    updateDashboardMutation.mutate({ id: editingDashboard.id, data: dashboardData });
  };



  // Handle AI widget creation
  const handleCreateWidgetsWithAI = async () => {
    if (!aiWidgetPrompt.trim()) return;
    aiWidgetMutation.mutate(aiWidgetPrompt);
  };

  // Handle dashboard edit
  const handleEditDashboard = (dashboard: DashboardConfig) => {
    setEditingDashboard(dashboard);
    setEditingWidget(null);
    setNewDashboardName(dashboard.name);
    setNewDashboardDescription(dashboard.description);

    setEditMode("manual");
    setIsEditDialogOpen(true);
  };

  // Handle widget edit
  const handleEditWidget = (widget: AnalyticsWidget) => {
    setEditingWidget(widget);
    setEditingDashboard(null);
    setNewWidgetName(widget.title);
    setNewWidgetType(widget.type);
    setNewWidgetConfig(widget.config);
    setNewWidgetData(widget.data);
    setAiWidgetPrompt("");
    setEditMode("manual");
    setIsEditDialogOpen(true);
  };

  // Handle dashboard delete
  const handleDeleteDashboard = (dashboard: DashboardConfig) => {
    setDashboardToDelete(dashboard);
    setWidgetToDelete(null);
    setIsDeleteDialogOpen(true);
  };

  // Handle widget delete
  const handleDeleteWidget = (widget: AnalyticsWidget) => {
    setWidgetToDelete(widget);
    setDashboardToDelete(null);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (dashboardToDelete) {
      deleteDashboardMutation.mutate(dashboardToDelete.id);
    } else if (widgetToDelete) {
      // Handle widget deletion - would need to be implemented
      toast({
        title: "Info",
        description: "Widget deletion not yet implemented",
      });
      setIsDeleteDialogOpen(false);
      setWidgetToDelete(null);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div>
              <DialogTitle>Dashboard Manager OLD</DialogTitle>
              <DialogDescription>
                Manage your dashboards and widgets
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Toggle Controls */}
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "dashboards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("dashboards")}
                  className="flex items-center gap-2"
                >
                  <Grid3x3 className="w-4 h-4" />
                  Dashboards
                </Button>
                <Button
                  variant={viewMode === "widgets" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("widgets")}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Widgets
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === "dashboards" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Dashboards</h3>
                    <Button
                      onClick={() => {
                        setEditingDashboard(null);
                        setEditingWidget(null);
                        setNewDashboardName("");
                        setNewDashboardDescription("");

                        setEditMode("manual");
                        setIsEditDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Dashboard
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboards.sort((a, b) => a.name.localeCompare(b.name)).map((dashboard) => (
                      <Card key={dashboard.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base mb-1">{dashboard.name}</CardTitle>
                              <p className="text-sm text-gray-600 truncate">{dashboard.description}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDashboard(dashboard)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDashboard(dashboard)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              {dashboard.configuration?.standardWidgets?.length || 0} standard widgets
                            </span>
                            <span>
                              {dashboard.configuration?.customWidgets?.length || 0} custom widgets
                            </span>
                            {dashboard.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {dashboards.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Grid3x3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No dashboards created yet</p>
                      <p className="text-sm">Click "New Dashboard" to create your first dashboard</p>
                    </div>
                  )}
                </div>
              )}

              {viewMode === "widgets" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Widgets</h3>
                    <Button
                      variant="outline"
                      size="default"
                      className="flex items-center gap-2"
                      onClick={() => {
                        // Trigger widget creation process
                        console.log('Widget creation requested');
                        toast({
                          title: "Widget Studio",
                          description: "Widget creation feature coming soon"
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      New Widget
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allWidgets.map((widget) => (
                      <Card key={widget.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{widget.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1 capitalize">{widget.type}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditWidget(widget)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWidget(widget)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline" className="text-xs">
                              {widget.type}
                            </Badge>
                            {widget.isStandard && (
                              <Badge variant="secondary" className="text-xs">
                                Standard
                              </Badge>
                            )}
                            {widget.visible ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Visible
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {allWidgets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No widgets created yet</p>
                      <p className="text-sm">Click "New Widget" to create your first widget</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`${isEditDialogMaximized ? 'max-w-[95vw] w-[95vw] h-[95vh]' : 'max-w-2xl max-h-[90vh]'} flex flex-col`}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {editingDashboard ? "Edit Dashboard" : editingWidget ? "Edit Widget" : viewMode === "dashboards" ? "New Dashboard" : "New Widget"}
                </DialogTitle>
                <DialogDescription>
                  {editingDashboard ? "Edit your dashboard settings" : editingWidget ? "Edit your widget settings" : viewMode === "dashboards" ? "Create a new dashboard" : "Create a new widget"}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogMaximized(!isEditDialogMaximized)}
                className="h-8 w-8 p-0 mr-2"
              >
                {isEditDialogMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Edit Mode Toggle */}
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant={editMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode("manual")}
                >
                  Manual Edit
                </Button>
                <Button
                  variant={editMode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode("ai")}
                  className={`flex items-center gap-2 ${editMode === "ai" ? aiTheme.gradient : ""}`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Edit
                </Button>
              </div>
            </div>

            {/* Edit Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editMode === "manual" ? (
                <div className="space-y-4">
                  {(editingDashboard || (!editingWidget && viewMode === "dashboards")) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dashboard-name">Dashboard Name</Label>
                          <Input
                            id="dashboard-name"
                            value={newDashboardName}
                            onChange={(e) => setNewDashboardName(e.target.value)}
                            placeholder="Enter dashboard name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dashboard-description">Description</Label>
                          <Input
                            id="dashboard-description"
                            value={newDashboardDescription}
                            onChange={(e) => setNewDashboardDescription(e.target.value)}
                            placeholder="Enter dashboard description"
                          />
                        </div>
                      </div>
                      
                      {/* Visual Dashboard Editor */}
                      <div className="space-y-2">
                        <Label>Dashboard Layout</Label>
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Widget Library</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {['metric', 'chart', 'table', 'progress'].map((type) => (
                                <div
                                  key={type}
                                  className="p-2 bg-white dark:bg-gray-700 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-center text-sm capitalize"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({
                                      type: 'widget',
                                      widgetType: type,
                                      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
                                    }));
                                  }}
                                >
                                  {type === 'metric' && <BarChart3 className="w-4 h-4 mx-auto mb-1" />}
                                  {type === 'chart' && <TrendingUp className="w-4 h-4 mx-auto mb-1" />}
                                  {type === 'table' && <Grid3x3 className="w-4 h-4 mx-auto mb-1" />}
                                  {type === 'progress' && <Target className="w-4 h-4 mx-auto mb-1" />}
                                  {type}
                                </div>
                              ))}
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
                                    if (editingDashboard?.configuration?.customWidgets) {
                                      const widgets = editingDashboard.configuration.customWidgets;
                                      if (widgets.length > 0) {
                                        const maxX = Math.max(...widgets.map((w: any) => w.position.x + w.size.width));
                                        const maxY = Math.max(...widgets.map((w: any) => w.position.y + w.size.height));
                                        const padding = 40;
                                        setCanvasWidth(Math.max(400, maxX + padding));
                                        setCanvasHeight(Math.max(300, maxY + padding));
                                      }
                                    }
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  Auto-size
                                </Button>
                                <Label htmlFor="canvas-width">W:</Label>
                                <Input
                                  id="canvas-width"
                                  type="number"
                                  value={canvasWidth}
                                  onChange={(e) => setCanvasWidth(Number(e.target.value))}
                                  className="w-16 h-6 text-xs"
                                  min="400"
                                  max="1600"
                                />
                                <Label htmlFor="canvas-height">H:</Label>
                                <Input
                                  id="canvas-height"
                                  type="number"
                                  value={canvasHeight}
                                  onChange={(e) => setCanvasHeight(Number(e.target.value))}
                                  className="w-16 h-6 text-xs"
                                  min="300"
                                  max="1200"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setCanvasWidth(800); setCanvasHeight(600); }}
                                  className="h-6 px-2 text-xs"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Canvas Container with proper scrolling */}
                            <div className="border rounded-lg overflow-auto max-h-[600px]" style={{ maxWidth: '100%' }}>
                              <div 
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-4 relative overflow-hidden"
                                style={{ 
                                  width: canvasWidth, 
                                  height: canvasHeight, 
                                  minHeight: '300px',
                                  backgroundImage: `
                                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                                  `,
                                  backgroundSize: '20px 20px'
                                }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (e.currentTarget && e.currentTarget.classList) {
                                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                                }
                              }}
                              onDragLeave={(e) => {
                                if (e.currentTarget && e.currentTarget.classList) {
                                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (e.currentTarget && e.currentTarget.classList) {
                                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                }
                                
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  if (data.type === 'widget') {
                                    const newWidget = {
                                      id: `widget-${Date.now()}`,
                                      title: data.title,
                                      type: data.widgetType,
                                      position: { x, y },
                                      size: { width: 200, height: 150 },
                                      visible: true,
                                      data: {},
                                      config: {}
                                    };
                                    
                                    // Add to dashboard configuration
                                    if (editingDashboard) {
                                      const updatedConfig = {
                                        ...editingDashboard.configuration,
                                        customWidgets: [...(editingDashboard.configuration.customWidgets || []), newWidget]
                                      };
                                      setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error parsing drop data:', error);
                                }
                              }}
                            >
                              {editingDashboard && editingDashboard.configuration.customWidgets?.map((widget: any) => (
                                <div
                                  key={widget.id}
                                  className="absolute bg-white dark:bg-gray-700 border rounded-lg shadow-sm group hover:border-blue-500 cursor-move"
                                  style={{
                                    left: widget.position?.x || 0,
                                    top: widget.position?.y || 0,
                                    width: widget.size?.width || 400,
                                    height: widget.size?.height || 300
                                  }}
                                  onMouseDown={(e) => {
                                    const target = e.target as Element;
                                    if (target === e.currentTarget || target.closest('.widget-header') || target.closest('.widget-content')) {
                                      // Handle widget dragging
                                      const startX = e.clientX - widget.position.x;
                                      const startY = e.clientY - widget.position.y;
                                      
                                      const handleMouseMove = (e: MouseEvent) => {
                                        const snapSize = 20; // Grid size for snapping
                                        const rawX = Math.max(0, Math.min(canvasWidth - (widget.size?.width || 400), e.clientX - startX));
                                        const rawY = Math.max(0, Math.min(canvasHeight - (widget.size?.height || 300), e.clientY - startY));
                                        
                                        // Snap to grid
                                        const newX = Math.round(rawX / snapSize) * snapSize;
                                        const newY = Math.round(rawY / snapSize) * snapSize;
                                        
                                        if (editingDashboard) {
                                          const updatedConfig = {
                                            ...editingDashboard.configuration,
                                            customWidgets: editingDashboard.configuration.customWidgets?.map((w: any) => 
                                              w.id === widget.id ? { ...w, position: { x: newX, y: newY } } : w
                                            )
                                          };
                                          setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                        }
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
                                    <span className="text-xs font-medium truncate">{widget.title}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (editingDashboard) {
                                          const updatedConfig = {
                                            ...editingDashboard.configuration,
                                            customWidgets: editingDashboard.configuration.customWidgets?.filter((w: any) => w.id !== widget.id)
                                          };
                                          setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="widget-content px-2 pb-2 cursor-move">
                                    <div className="text-xs text-gray-500 capitalize">{widget.type}</div>
                                  </div>
                                  
                                  {/* Resize Handles */}
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {/* Corner resize handles */}
                                    <div 
                                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startWidth = widget.size.width;
                                        const startHeight = widget.size.height;
                                        
                                        const handleMouseMove = (e: MouseEvent) => {
                                          const snapSize = 20; // Grid size for snapping
                                          const rawWidth = Math.max(100, Math.min(canvasWidth - widget.position.x, startWidth + (e.clientX - startX)));
                                          const rawHeight = Math.max(80, Math.min(canvasHeight - widget.position.y, startHeight + (e.clientY - startY)));
                                          
                                          // Snap to grid
                                          const newWidth = Math.round(rawWidth / snapSize) * snapSize;
                                          const newHeight = Math.round(rawHeight / snapSize) * snapSize;
                                          
                                          if (editingDashboard) {
                                            const updatedConfig = {
                                              ...editingDashboard.configuration,
                                              customWidgets: editingDashboard.configuration.customWidgets?.map((w: any) => 
                                                w.id === widget.id ? { ...w, size: { width: newWidth, height: newHeight } } : w
                                              )
                                            };
                                            setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                          }
                                        };
                                        
                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };
                                        
                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                      }}
                                    />
                                    
                                    {/* Right edge resize handle */}
                                    <div 
                                      className="absolute top-1/2 -right-1 w-2 h-6 bg-blue-500 rounded cursor-ew-resize pointer-events-auto transform -translate-y-1/2"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const startX = e.clientX;
                                        const startWidth = widget.size?.width || 400;
                                        
                                        const handleMouseMove = (e: MouseEvent) => {
                                          const snapSize = 20; // Grid size for snapping
                                          const rawWidth = Math.max(100, Math.min(canvasWidth - (widget.position?.x || 0), startWidth + (e.clientX - startX)));
                                          
                                          // Snap to grid
                                          const newWidth = Math.round(rawWidth / snapSize) * snapSize;
                                          
                                          if (editingDashboard) {
                                            const updatedConfig = {
                                              ...editingDashboard.configuration,
                                              customWidgets: editingDashboard.configuration.customWidgets?.map((w: any) => 
                                                w.id === widget.id ? { ...w, size: { width: newWidth, height: widget.size?.height || 300 } } : w
                                              )
                                            };
                                            setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                          }
                                        };
                                        
                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };
                                        
                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                      }}
                                    />
                                    
                                    {/* Bottom edge resize handle */}
                                    <div 
                                      className="absolute -bottom-1 left-1/2 w-6 h-2 bg-blue-500 rounded cursor-ns-resize pointer-events-auto transform -translate-x-1/2"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const startY = e.clientY;
                                        const startHeight = widget.size?.height || 300;
                                        
                                        const handleMouseMove = (e: MouseEvent) => {
                                          const snapSize = 20; // Grid size for snapping
                                          const rawHeight = Math.max(80, Math.min(canvasHeight - (widget.position?.y || 0), startHeight + (e.clientY - startY)));
                                          
                                          // Snap to grid
                                          const newHeight = Math.round(rawHeight / snapSize) * snapSize;
                                          
                                          if (editingDashboard) {
                                            const updatedConfig = {
                                              ...editingDashboard.configuration,
                                              customWidgets: editingDashboard.configuration.customWidgets?.map((w: any) => 
                                                w.id === widget.id ? { ...w, size: { width: widget.size?.width || 400, height: newHeight } } : w
                                              )
                                            };
                                            setEditingDashboard({ ...editingDashboard, configuration: updatedConfig });
                                          }
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
                              
                              {(!editingDashboard || !editingDashboard.configuration.customWidgets?.length) && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                  <div className="text-center">
                                    <Grid3x3 className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Drag widgets here to build your dashboard</p>
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {(editingWidget || (!editingDashboard && viewMode === "widgets")) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="widget-name">Widget Name</Label>
                        <Input
                          id="widget-name"
                          value={newWidgetName}
                          onChange={(e) => setNewWidgetName(e.target.value)}
                          placeholder="Enter widget name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="widget-type">Widget Type</Label>
                        <Select value={newWidgetType} onValueChange={(value: any) => setNewWidgetType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select widget type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="metric">Metric</SelectItem>
                            <SelectItem value="chart">Chart</SelectItem>
                            <SelectItem value="table">Table</SelectItem>
                            <SelectItem value="progress">Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Widget Configuration */}
                      <div className="space-y-2">
                        <Label>Widget Configuration</Label>
                        <div className="border rounded-lg p-4 bg-gray-50">
                          {newWidgetType === 'metric' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="metric-value">Value</Label>
                                  <Input
                                    id="metric-value"
                                    value={newWidgetConfig.value || ''}
                                    onChange={(e) => setNewWidgetConfig({...newWidgetConfig, value: e.target.value})}
                                    placeholder="e.g., 42"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="metric-unit">Unit</Label>
                                  <Input
                                    id="metric-unit"
                                    value={newWidgetConfig.unit || ''}
                                    onChange={(e) => setNewWidgetConfig({...newWidgetConfig, unit: e.target.value})}
                                    placeholder="e.g., %"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="metric-change">Change Text</Label>
                                <Input
                                  id="metric-change"
                                  value={newWidgetConfig.change || ''}
                                  onChange={(e) => setNewWidgetConfig({...newWidgetConfig, change: e.target.value})}
                                  placeholder="e.g., +5% from last week"
                                />
                              </div>
                              <div>
                                <Label htmlFor="metric-color">Color</Label>
                                <Select value={newWidgetConfig.color} onValueChange={(value: any) => setNewWidgetConfig({...newWidgetConfig, color: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blue">Blue</SelectItem>
                                    <SelectItem value="green">Green</SelectItem>
                                    <SelectItem value="orange">Orange</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                    <SelectItem value="purple">Purple</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          
                          {newWidgetType === 'chart' && (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="chart-type">Chart Type</Label>
                                <Select value={newWidgetConfig.chartType} onValueChange={(value: any) => setNewWidgetConfig({...newWidgetConfig, chartType: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select chart type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="line">Line Chart</SelectItem>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="area">Area Chart</SelectItem>
                                    <SelectItem value="pie">Pie Chart</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="chart-data">Data Source</Label>
                                <Select value={newWidgetConfig.dataSource} onValueChange={(value: any) => setNewWidgetConfig({...newWidgetConfig, dataSource: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select data source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="jobs">Jobs Data</SelectItem>
                                    <SelectItem value="operations">Operations Data</SelectItem>
                                    <SelectItem value="resources">Resources Data</SelectItem>
                                    <SelectItem value="metrics">Metrics Data</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          
                          {newWidgetType === 'table' && (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="table-data">Data Source</Label>
                                <Select value={newWidgetConfig.dataSource} onValueChange={(value: any) => setNewWidgetConfig({...newWidgetConfig, dataSource: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select data source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="jobs">Jobs Table</SelectItem>
                                    <SelectItem value="operations">Operations Table</SelectItem>
                                    <SelectItem value="resources">Resources Table</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="table-columns">Columns (comma-separated)</Label>
                                <Input
                                  id="table-columns"
                                  value={newWidgetConfig.columns || ''}
                                  onChange={(e) => setNewWidgetConfig({...newWidgetConfig, columns: e.target.value})}
                                  placeholder="e.g., name, status, priority"
                                />
                              </div>
                              <div>
                                <Label htmlFor="table-rows">Max Rows</Label>
                                <Input
                                  id="table-rows"
                                  type="number"
                                  value={newWidgetConfig.maxRows || ''}
                                  onChange={(e) => setNewWidgetConfig({...newWidgetConfig, maxRows: e.target.value})}
                                  placeholder="e.g., 10"
                                />
                              </div>
                            </div>
                          )}
                          
                          {newWidgetType === 'progress' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="progress-value">Current Value</Label>
                                  <Input
                                    id="progress-value"
                                    type="number"
                                    value={newWidgetConfig.value || ''}
                                    onChange={(e) => setNewWidgetConfig({...newWidgetConfig, value: e.target.value})}
                                    placeholder="e.g., 75"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="progress-max">Max Value</Label>
                                  <Input
                                    id="progress-max"
                                    type="number"
                                    value={newWidgetConfig.maxValue || ''}
                                    onChange={(e) => setNewWidgetConfig({...newWidgetConfig, maxValue: e.target.value})}
                                    placeholder="e.g., 100"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="progress-label">Label</Label>
                                <Input
                                  id="progress-label"
                                  value={newWidgetConfig.label || ''}
                                  onChange={(e) => setNewWidgetConfig({...newWidgetConfig, label: e.target.value})}
                                  placeholder="e.g., Completion Rate"
                                />
                              </div>
                              <div>
                                <Label htmlFor="progress-color">Color</Label>
                                <Select value={newWidgetConfig.color} onValueChange={(value: any) => setNewWidgetConfig({...newWidgetConfig, color: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blue">Blue</SelectItem>
                                    <SelectItem value="green">Green</SelectItem>
                                    <SelectItem value="orange">Orange</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                    <SelectItem value="purple">Purple</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Widget Size and Position */}
                      <div className="space-y-2">
                        <Label>Widget Dimensions</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="widget-width">Width (px)</Label>
                            <Input
                              id="widget-width"
                              type="number"
                              value={newWidgetConfig.width || '300'}
                              onChange={(e) => setNewWidgetConfig({...newWidgetConfig, width: e.target.value})}
                              placeholder="300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="widget-height">Height (px)</Label>
                            <Input
                              id="widget-height"
                              type="number"
                              value={newWidgetConfig.height || '200'}
                              onChange={(e) => setNewWidgetConfig({...newWidgetConfig, height: e.target.value})}
                              placeholder="200"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(editingDashboard || (!editingWidget && viewMode === "dashboards")) && (
                    <p className="text-sm text-gray-600">
                      AI dashboard generation is now available from the main dashboard page.
                    </p>
                  )}

                  {(editingWidget || (!editingDashboard && viewMode === "widgets")) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ai-widget-prompt">AI Widget Prompt</Label>
                        <Textarea
                          id="ai-widget-prompt"
                          value={aiWidgetPrompt}
                          onChange={(e) => setAiWidgetPrompt(e.target.value)}
                          placeholder="Describe the widget you want to create or modify... (e.g., 'Create a metric widget showing current efficiency percentage')"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex-shrink-0 p-4 pr-12 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingDashboard ? handleUpdateDashboard : handleCreateDashboard}
                disabled={
                  (editingDashboard || (!editingWidget && viewMode === "dashboards")) && !newDashboardName.trim()
                }
              >
                {editingDashboard ? "Update Dashboard" : editingWidget ? "Update Widget" : viewMode === "dashboards" ? "Create Dashboard" : "Create Widget"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              {dashboardToDelete ? "dashboard" : "widget"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteDashboardMutation.isPending}
            >
              {deleteDashboardMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}