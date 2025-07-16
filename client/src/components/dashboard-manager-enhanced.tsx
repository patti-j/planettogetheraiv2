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
import { Plus, Settings, Star, Trash2, Edit3, Eye, Save, Move, Palette, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, PieChart, Activity, Zap, Users, Package, Wrench, ArrowUp, ArrowDown, MoreHorizontal, Grid3x3, Maximize2, Minimize2, RotateCcw, Sparkles, Bot } from "lucide-react";
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
  const [aiDashboardPrompt, setAiDashboardPrompt] = useState("");
  const [aiWidgetPrompt, setAiWidgetPrompt] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardConfig | null>(null);
  const [widgetToDelete, setWidgetToDelete] = useState<AnalyticsWidget | null>(null);
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetType, setNewWidgetType] = useState<"metric" | "chart" | "table" | "progress">("metric");
  const [newWidgetConfig, setNewWidgetConfig] = useState<any>({});
  const [newWidgetData, setNewWidgetData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all widgets from all dashboards
  const allWidgets = dashboards.flatMap(dashboard => [
    ...dashboard.configuration.standardWidgets,
    ...dashboard.configuration.customWidgets
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
      setAiDashboardPrompt("");
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

  // AI Dashboard Creation Mutation
  const aiDashboardMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent", {
        command: `CREATE_DASHBOARD: ${prompt}`,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "AI Dashboard created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
        setAiDashboardPrompt("");
        setIsEditDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create AI dashboard",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create AI dashboard",
        variant: "destructive",
      });
    },
  });

  // AI Widget Creation Mutation
  const aiWidgetMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent", {
        command: `CREATE_ANALYTICS_WIDGETS: ${prompt}`,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "AI Widgets created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
        setAiWidgetPrompt("");
        setIsEditDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create AI widgets",
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

  // Handle AI dashboard creation
  const handleCreateDashboardWithAI = async () => {
    if (!aiDashboardPrompt.trim()) return;
    aiDashboardMutation.mutate(aiDashboardPrompt);
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
    setAiDashboardPrompt("");
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
            <DialogTitle>Dashboard Manager</DialogTitle>
            <DialogDescription>
              Manage your dashboards and widgets
            </DialogDescription>
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
                        setAiDashboardPrompt("");
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
                    {dashboards.map((dashboard) => (
                      <Card key={dashboard.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{dashboard.name}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
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
                              {dashboard.configuration.standardWidgets.length} standard widgets
                            </span>
                            <span>
                              {dashboard.configuration.customWidgets.length} custom widgets
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
                      onClick={() => {
                        setEditingWidget(null);
                        setEditingDashboard(null);
                        setNewWidgetName("");
                        setNewWidgetType("metric");
                        setNewWidgetConfig({});
                        setNewWidgetData({});
                        setAiWidgetPrompt("");
                        setEditMode("manual");
                        setIsEditDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingDashboard ? "Edit Dashboard" : editingWidget ? "Edit Widget" : viewMode === "dashboards" ? "New Dashboard" : "New Widget"}
            </DialogTitle>
            <DialogDescription>
              {editingDashboard ? "Edit your dashboard settings" : editingWidget ? "Edit your widget settings" : viewMode === "dashboards" ? "Create a new dashboard" : "Create a new widget"}
            </DialogDescription>
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
                  className="flex items-center gap-2"
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
                        <Textarea
                          id="dashboard-description"
                          value={newDashboardDescription}
                          onChange={(e) => setNewDashboardDescription(e.target.value)}
                          placeholder="Enter dashboard description"
                          rows={3}
                        />
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
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(editingDashboard || (!editingWidget && viewMode === "dashboards")) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ai-dashboard-prompt">AI Dashboard Prompt</Label>
                        <Textarea
                          id="ai-dashboard-prompt"
                          value={aiDashboardPrompt}
                          onChange={(e) => setAiDashboardPrompt(e.target.value)}
                          placeholder="Describe the dashboard you want to create or modify... (e.g., 'Create a production dashboard with job status, resource utilization, and completion rates')"
                          rows={4}
                        />
                      </div>
                    </>
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
            <div className="flex-shrink-0 p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              {editMode === "manual" ? (
                <Button
                  onClick={editingDashboard ? handleUpdateDashboard : handleCreateDashboard}
                  disabled={
                    (editingDashboard || (!editingWidget && viewMode === "dashboards")) && !newDashboardName.trim()
                  }
                >
                  {editingDashboard ? "Update Dashboard" : editingWidget ? "Update Widget" : viewMode === "dashboards" ? "Create Dashboard" : "Create Widget"}
                </Button>
              ) : (
                <Button
                  onClick={
                    (editingDashboard || (!editingWidget && viewMode === "dashboards"))
                      ? handleCreateDashboardWithAI
                      : handleCreateWidgetsWithAI
                  }
                  disabled={
                    ((editingDashboard || (!editingWidget && viewMode === "dashboards")) && !aiDashboardPrompt.trim()) ||
                    ((!editingDashboard && (editingWidget || viewMode === "widgets")) && !aiWidgetPrompt.trim()) ||
                    aiDashboardMutation.isPending ||
                    aiWidgetMutation.isPending
                  }
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {aiDashboardMutation.isPending || aiWidgetMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create with AI
                    </div>
                  )}
                </Button>
              )}
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