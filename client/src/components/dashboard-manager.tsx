import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Star, Trash2, Edit3, Eye, Save, Move, Palette, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, PieChart, Activity, Zap, Users, Package, Wrench, ArrowUp, ArrowDown, MoreHorizontal, Grid3x3, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
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

interface WidgetTemplate {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  icon: string;
  description: string;
  defaultConfig: any;
  defaultData: any;
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

// Widget templates for easy widget creation
const widgetTemplates: WidgetTemplate[] = [
  {
    id: "active-jobs",
    title: "Active Jobs",
    type: "metric",
    icon: "BarChart3",
    description: "Shows number of currently active jobs",
    defaultConfig: { color: "blue" },
    defaultData: { icon: "BarChart3", description: "Currently in production" }
  },
  {
    id: "resource-utilization",
    title: "Resource Utilization",
    type: "metric",
    icon: "TrendingUp",
    description: "Shows percentage of resources being used",
    defaultConfig: { color: "green" },
    defaultData: { icon: "TrendingUp", description: "Operations assigned to resources" }
  },
  {
    id: "overdue-jobs",
    title: "Overdue Jobs",
    type: "metric",
    icon: "AlertTriangle",
    description: "Shows number of jobs past due date",
    defaultConfig: { color: "red" },
    defaultData: { icon: "AlertTriangle", description: "Past due date" }
  },
  {
    id: "completion-rate",
    title: "Completion Rate",
    type: "progress",
    icon: "CheckCircle",
    description: "Shows percentage of completed operations",
    defaultConfig: { color: "green" },
    defaultData: { icon: "CheckCircle", description: "Operations completed" }
  },
  {
    id: "jobs-by-status",
    title: "Jobs by Status",
    type: "chart",
    icon: "PieChart",
    description: "Chart showing job distribution by status",
    defaultConfig: { chartType: "pie" },
    defaultData: { icon: "PieChart", description: "Job status distribution" }
  },
  {
    id: "operations-timeline",
    title: "Operations Timeline",
    type: "chart",
    icon: "Activity",
    description: "Timeline chart of operations",
    defaultConfig: { chartType: "timeline" },
    defaultData: { icon: "Activity", description: "Operation timeline" }
  },
  {
    id: "resource-status",
    title: "Resource Status",
    type: "table",
    icon: "Wrench",
    description: "Table showing all resources and their status",
    defaultConfig: { columns: ["name", "type", "status"] },
    defaultData: { icon: "Wrench", description: "Resource status table" }
  }
];

// Draggable widget component for the editor
const DraggableWidget = ({ widget, onMove, onResize, onEdit, onDelete, isSelected, onSelect }: any) => {
  const [{ isDragging }, drag] = useDrag({
    type: "widget",
    item: { id: widget.id, type: "widget" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`absolute border-2 rounded-lg bg-white shadow-sm cursor-move ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "border-blue-500" : "border-gray-200"}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
      }}
      onClick={() => onSelect(widget.id)}
    >
      <div className="p-3 h-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{widget.title}</h4>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(widget);
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(widget.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {widget.type} • {widget.size.width}x{widget.size.height}
        </div>
      </div>
    </div>
  );
};

// Drop zone for the visual editor
const DropZone = ({ children, onDrop }: any) => {
  const [{ isOver }, drop] = useDrop({
    accept: ["widget", "template"],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const dropElement = drop as any;
      const dropZoneRect = dropElement?.getBoundingClientRect?.();
      if (offset && dropZoneRect) {
        const x = offset.x - dropZoneRect.left;
        const y = offset.y - dropZoneRect.top;
        onDrop(item, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`relative w-full h-96 border-2 border-dashed rounded-lg ${
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
    >
      {children}
    </div>
  );
};

export default function DashboardManager({
  open,
  onOpenChange,
  dashboards,
  currentDashboard,
  onDashboardSelect,
  onDashboardCreate,
  onDashboardUpdate,
  onDashboardDelete,
  standardWidgets,
  customWidgets
}: DashboardManagerProps) {
  const [activeTab, setActiveTab] = useState("browse");
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" });
  const [editingDashboard, setEditingDashboard] = useState<DashboardConfig | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [workingWidgets, setWorkingWidgets] = useState<AnalyticsWidget[]>([]);
  const [editingWidget, setEditingWidget] = useState<AnalyticsWidget | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize working widgets when editing a dashboard
  useEffect(() => {
    if (editingDashboard) {
      setWorkingWidgets([
        ...editingDashboard.configuration.standardWidgets,
        ...editingDashboard.configuration.customWidgets
      ]);
    } else {
      setWorkingWidgets([...standardWidgets, ...customWidgets]);
    }
  }, [editingDashboard, standardWidgets, customWidgets]);

  // Widget management functions
  const handleAddWidget = (template: WidgetTemplate, position: { x: number; y: number }) => {
    const newWidget: AnalyticsWidget = {
      id: `${template.id}-${Date.now()}`,
      title: template.title,
      type: template.type,
      data: template.defaultData,
      visible: true,
      position: position,
      size: { width: 300, height: 200 },
      config: template.defaultConfig,
      isStandard: false
    };
    setWorkingWidgets([...workingWidgets, newWidget]);
  };

  const handleMoveWidget = (widgetId: string, newPosition: { x: number; y: number }) => {
    setWorkingWidgets(widgets =>
      widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, position: newPosition }
          : widget
      )
    );
  };

  const handleResizeWidget = (widgetId: string, newSize: { width: number; height: number }) => {
    setWorkingWidgets(widgets =>
      widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      )
    );
  };

  const handleEditWidget = (widget: AnalyticsWidget) => {
    setEditingWidget(widget);
  };

  const handleUpdateWidget = (updatedWidget: AnalyticsWidget) => {
    setWorkingWidgets(widgets =>
      widgets.map(widget =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      )
    );
    setEditingWidget(null);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWorkingWidgets(widgets => widgets.filter(widget => widget.id !== widgetId));
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
  };

  const handleDropWidget = (item: any, position: { x: number; y: number }) => {
    if (item.type === "template") {
      const template = widgetTemplates.find(t => t.id === item.id);
      if (template) {
        handleAddWidget(template, position);
      }
    } else if (item.type === "widget") {
      handleMoveWidget(item.id, position);
    }
  };

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
      setNewDashboard({ name: "", description: "" });
      setActiveTab("browse");
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/dashboard-configs/${id}/set-default`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default dashboard set successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set default dashboard",
        variant: "destructive",
      });
    },
  });

  const handleCreateDashboard = () => {
    if (!newDashboard.name.trim()) {
      toast({
        title: "Error",
        description: "Dashboard name is required",
        variant: "destructive",
      });
      return;
    }

    const dashboardData = {
      name: newDashboard.name,
      description: newDashboard.description,
      configuration: {
        standardWidgets: workingWidgets.filter(w => w.isStandard),
        customWidgets: workingWidgets.filter(w => !w.isStandard)
      },
      isDefault: false
    };

    createDashboardMutation.mutate(dashboardData);
  };

  const handleStartEditing = (dashboard: DashboardConfig) => {
    setEditingDashboard(dashboard);
    setActiveTab("editor");
  };

  const handleCancelEditing = () => {
    setEditingDashboard(null);
    setWorkingWidgets([...standardWidgets, ...customWidgets]);
    setSelectedWidgetId(null);
    setActiveTab("browse");
  };

  const handleSaveEditing = () => {
    if (!editingDashboard) return;

    const updatedData = {
      name: editingDashboard.name,
      description: editingDashboard.description,
      configuration: {
        standardWidgets: workingWidgets.filter(w => w.isStandard),
        customWidgets: workingWidgets.filter(w => !w.isStandard)
      }
    };

    updateDashboardMutation.mutate({ id: editingDashboard.id, data: updatedData });
  };

  const handleUpdateDashboard = () => {
    if (!editingDashboard) return;

    const updatedData = {
      name: editingDashboard.name,
      description: editingDashboard.description,
      configuration: {
        standardWidgets: standardWidgets,
        customWidgets: customWidgets
      }
    };

    updateDashboardMutation.mutate({ id: editingDashboard.id, data: updatedData });
  };

  const handleSaveCurrentLayout = () => {
    if (!currentDashboard) return;

    const updatedData = {
      configuration: {
        standardWidgets: standardWidgets,
        customWidgets: customWidgets
      }
    };

    updateDashboardMutation.mutate({ id: currentDashboard.id, data: updatedData });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingDashboard ? `Edit Dashboard: ${editingDashboard.name}` : "Manage Dashboards"}
            </DialogTitle>
            <DialogDescription>
              Create, edit, and organize your dashboard configurations with comprehensive widget management
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="editor">Visual Editor</TabsTrigger>
              <TabsTrigger value="templates">Widget Library</TabsTrigger>
            </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saved Dashboards</h3>
            </div>

            <ScrollArea className="h-80">
              <div className="grid gap-4">
                {dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{dashboard.name}</h4>
                          {dashboard.isDefault && (
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{dashboard.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Standard: {dashboard.configuration.standardWidgets.length} widgets
                          </span>
                          <span>
                            Custom: {dashboard.configuration.customWidgets.length} widgets
                          </span>
                          <span>
                            Created: {new Date(dashboard.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDashboardSelect(dashboard)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDashboard(dashboard)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(dashboard.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {dashboards.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No dashboards saved yet</p>
                    <p className="text-sm">Create your first dashboard to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>



          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Dashboard Layout</h3>
                {currentDashboard && (
                  <Button
                    onClick={handleSaveCurrentLayout}
                    disabled={updateDashboardMutation.isPending}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Layout
                  </Button>
                )}
              </div>

              {currentDashboard ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{currentDashboard.name}</h4>
                      <p className="text-sm text-gray-600">{currentDashboard.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Standard Widgets</p>
                        <p className="text-gray-600">{standardWidgets.length} widgets</p>
                      </div>
                      <div>
                        <p className="font-medium">Custom Widgets</p>
                        <p className="text-gray-600">{customWidgets.length} widgets</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No dashboard currently loaded</p>
                  <p className="text-sm">Select a dashboard from the Browse tab to get started</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {editingDashboard && (
          <Dialog open={!!editingDashboard} onOpenChange={() => setEditingDashboard(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Dashboard Name</Label>
                  <Input
                    id="edit-name"
                    value={editingDashboard.name}
                    onChange={(e) => setEditingDashboard(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingDashboard.description}
                    onChange={(e) => setEditingDashboard(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateDashboard}
                    disabled={updateDashboardMutation.isPending}
                    className="flex-1"
                  >
                    {updateDashboardMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingDashboard(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
    </DndProvider>
  );
}