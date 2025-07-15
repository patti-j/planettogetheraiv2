import { useState, useEffect, useRef, useCallback } from "react";
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
import { useDrag, useDrop, useDragLayer } from "react-dnd";

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

// Draggable widget template component
const DraggableTemplate = ({ template }: { template: WidgetTemplate }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "template",
    item: () => {
      console.log("Starting drag for template:", template.id);
      return { id: template.id, type: "template", template };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const IconComponent = {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    PieChart,
    Activity,
    Wrench
  }[template.icon] || BarChart3;

  return (
    <div
      ref={drag}
      className={`p-4 border rounded-lg cursor-move bg-white hover:bg-gray-50 transition-all ${
        isDragging ? "opacity-50 scale-105" : ""
      }`}
      style={{ touchAction: 'none' }}
      onMouseDown={() => console.log("Mouse down on template:", template.id)}
    >
      <div className="flex items-center gap-3 mb-2">
        <IconComponent className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium">{template.title}</h4>
      </div>
      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {template.type}
        </Badge>
        <div className="text-xs text-gray-400">
          {isDragging ? "Dragging..." : "Drag me"}
        </div>
      </div>
    </div>
  );
};

// Custom drag layer for smooth drag preview
const CustomDragLayer = () => {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
    differenceFromInitialOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        style={{
          transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
        }}
        className="absolute"
      >
        {itemType === "widget" && item.widget && (
          <div 
            className="bg-white border-2 border-blue-500 rounded-lg shadow-lg opacity-80 cursor-move"
            style={{
              width: item.widget.size.width,
              height: item.widget.size.height,
            }}
          >
            <div className="p-3 h-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{item.widget.title}</h4>
                <div className="flex items-center gap-1">
                  <Move className="h-3 w-3 text-gray-400" />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {item.widget.type} • {item.widget.size.width}x{item.widget.size.height}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Draggable widget component within the canvas
const DraggableWidget = ({ widget, isSelected, onSelect, onMove }: {
  widget: AnalyticsWidget;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "widget",
    item: { 
      id: widget.id, 
      type: "widget", 
      widget,
      // Store the initial position when drag starts
      initialPosition: widget.position
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Hide the default drag preview
  useEffect(() => {
    preview(null);
  }, [preview]);

  return (
    <div
      ref={drag}
      className={`absolute border-2 rounded-lg bg-white shadow-sm cursor-move transition-all ${
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
      } ${isDragging ? "opacity-30" : ""}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
      }}
      onClick={onSelect}
    >
      <div className="p-3 h-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{widget.title}</h4>
          <div className="flex items-center gap-1">
            <Move className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {widget.type} • {widget.size.width}x{widget.size.height}
        </div>
      </div>
    </div>
  );
};

// Visual editor drop zone
const VisualEditor = ({ widgets, onDrop, onWidgetSelect, selectedWidgetId, onWidgetMove }: {
  widgets: AnalyticsWidget[];
  onDrop: (item: any, position: { x: number; y: number }) => void;
  onWidgetSelect: (widgetId: string) => void;
  selectedWidgetId: string | null;
  onWidgetMove: (widgetId: string, newPosition: { x: number; y: number }) => void;
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: ["widget", "template"],
    drop: (item: any, monitor) => {
      console.log("Drop event triggered:", item);
      const offset = monitor.getClientOffset();
      const dropZoneRect = dropRef.current?.getBoundingClientRect();
      console.log("Drop position:", offset, dropZoneRect);
      if (offset && dropZoneRect) {
        let x = Math.max(0, offset.x - dropZoneRect.left);
        let y = Math.max(0, offset.y - dropZoneRect.top);
        
        // Handle existing widget movement vs new widget creation
        if (item.type === "widget") {
          // For existing widgets, calculate the offset from initial drag position
          const initialOffset = monitor.getInitialSourceClientOffset();
          const differenceFromInitial = monitor.getDifferenceFromInitialOffset();
          
          if (initialOffset && differenceFromInitial && item.initialPosition) {
            // Calculate new position based on initial widget position and drag difference
            x = Math.max(0, item.initialPosition.x + differenceFromInitial.x);
            y = Math.max(0, item.initialPosition.y + differenceFromInitial.y);
          }
          
          console.log("Calculated position:", { x, y });
          onWidgetMove(item.id, { x, y });
        } else {
          // For new widgets from template, use cursor position
          console.log("Calculated position:", { x, y });
          onDrop(item, { x, y });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine refs
  const combinedRef = useCallback(
    (node: HTMLDivElement) => {
      dropRef.current = node;
      drop(node);
    },
    [drop]
  );

  return (
    <div
      ref={combinedRef}
      className={`relative w-full h-96 border-2 border-dashed rounded-lg transition-all ${
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      {widgets.map((widget) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          isSelected={selectedWidgetId === widget.id}
          onSelect={() => onWidgetSelect(widget.id)}
          onMove={(newPosition) => onWidgetMove(widget.id, newPosition)}
        />
      ))}
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">📋</div>
            <div>Drag widgets from the Widget Library to get started</div>
            <div className="text-sm mt-1">Drop zone is ready for widgets</div>
          </div>
        </div>
      )}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 border-2 border-blue-500 rounded-lg">
          <div className="text-blue-700 font-medium">Drop widget here</div>
        </div>
      )}
      <CustomDragLayer />
    </div>
  );
};

export default function EnhancedDashboardManager({
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dashboard created successfully. You can now add widgets.",
      });
      onDashboardCreate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      
      // Switch to edit mode for the newly created dashboard
      setEditingDashboard(data);
      setWorkingWidgets([]);
      setSelectedWidgetId(null);
      setActiveTab("editor");
      
      setNewDashboard({ name: "", description: "" });
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
      setActiveTab("browse");
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

  // Initialize working widgets when editing
  useEffect(() => {
    if (editingDashboard) {
      setWorkingWidgets([
        ...editingDashboard.configuration.standardWidgets,
        ...editingDashboard.configuration.customWidgets
      ]);
    } else {
      setWorkingWidgets([]);
    }
  }, [editingDashboard]);

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

  const handleDropWidget = (item: any, position: { x: number; y: number }) => {
    console.log("handleDropWidget called with:", item, position);
    if (item.type === "template") {
      const template = item.template || widgetTemplates.find(t => t.id === item.id);
      if (template) {
        console.log("Adding widget from template:", template);
        handleAddWidget(template, position);
      } else {
        console.log("Template not found for:", item.id);
      }
    }
  };

  const handleWidgetMove = (widgetId: string, newPosition: { x: number; y: number }) => {
    console.log("Moving widget:", widgetId, "to position:", newPosition);
    setWorkingWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId ? { ...widget, position: newPosition } : widget
      )
    );
  };

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

  const handleCancelEditing = () => {
    setEditingDashboard(null);
    setWorkingWidgets([]);
    setSelectedWidgetId(null);
    setActiveTab("browse");
  };

  return (
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="editor">Visual Editor</TabsTrigger>
              <TabsTrigger value="templates">Widget Library</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Dashboards</h3>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("create")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Dashboard
                </Button>
              </div>

              <ScrollArea className="flex-1">
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
                            variant="ghost"
                            size="sm"
                            onClick={() => onDashboardSelect(dashboard)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(dashboard)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
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
                    <div className="text-center py-8 text-gray-500">
                      No dashboards created yet. Create your first dashboard to get started.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dashboard Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Dashboard Name</Label>
                    <Input
                      id="name"
                      value={newDashboard.name}
                      onChange={(e) => setNewDashboard({...newDashboard, name: e.target.value})}
                      placeholder="Enter dashboard name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newDashboard.description}
                      onChange={(e) => setNewDashboard({...newDashboard, description: e.target.value})}
                      placeholder="Enter dashboard description"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateDashboard}
                      disabled={createDashboardMutation.isPending}
                    >
                      {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("browse")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Widget Preview</h3>
                  <div className="min-h-[200px] bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      After creating your dashboard, use the Visual Editor to add and arrange widgets.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="flex-1 space-y-4">
              {editingDashboard ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Visual Editor</h3>
                      <p className="text-sm text-gray-600">
                        Drag widgets from the Widget Library to design your dashboard
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEditing}
                        disabled={updateDashboardMutation.isPending}
                      >
                        {updateDashboardMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Canvas</h4>
                          <p className="text-sm text-gray-600">Drag widgets from the library to the canvas below</p>
                        </div>
                        <VisualEditor
                          widgets={workingWidgets}
                          onDrop={handleDropWidget}
                          onWidgetSelect={setSelectedWidgetId}
                          selectedWidgetId={selectedWidgetId}
                          onWidgetMove={handleWidgetMove}
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Canvas has {workingWidgets.length} widgets
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const template = widgetTemplates[0];
                              handleAddWidget(template, { x: 10, y: 10 });
                            }}
                          >
                            Test Add Widget
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium">Widget Library</h4>
                        <p className="text-sm text-gray-600">Drag these widgets to the canvas</p>
                        <ScrollArea className="h-80">
                          <div className="space-y-2">
                            {widgetTemplates.map((template) => (
                              <DraggableTemplate key={template.id} template={template} />
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Select a dashboard to edit from the Browse tab
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="flex-1 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Widget Library</h3>
                  <p className="text-sm text-gray-600">
                    Available widgets for your dashboards
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {widgetTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-blue-600">
                          {template.icon === "BarChart3" && <BarChart3 className="h-5 w-5" />}
                          {template.icon === "TrendingUp" && <TrendingUp className="h-5 w-5" />}
                          {template.icon === "AlertTriangle" && <AlertTriangle className="h-5 w-5" />}
                          {template.icon === "CheckCircle" && <CheckCircle className="h-5 w-5" />}
                          {template.icon === "PieChart" && <PieChart className="h-5 w-5" />}
                          {template.icon === "Activity" && <Activity className="h-5 w-5" />}
                          {template.icon === "Wrench" && <Wrench className="h-5 w-5" />}
                        </div>
                        <h4 className="font-medium">{template.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveTab("editor");
                            if (!editingDashboard) {
                              toast({
                                title: "Info",
                                description: "Select a dashboard to edit first",
                              });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
  );
}