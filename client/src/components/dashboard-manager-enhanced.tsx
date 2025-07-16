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
        {itemType === "template" && item.template && (
          <div 
            className="bg-white border-2 border-blue-500 rounded-lg shadow-lg opacity-80 cursor-move"
            style={{
              width: 300,
              height: 200,
            }}
          >
            <div className="p-3 h-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{item.template.title}</h4>
                <div className="flex items-center gap-1">
                  <Move className="h-3 w-3 text-gray-400" />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {item.template.type} • 300x200
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
      className={`absolute border-2 rounded-lg bg-white shadow-sm cursor-move widget-no-transition ${
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
      } ${isDragging ? "opacity-30" : ""}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
        // Completely remove all transitions
        transition: 'none !important',
        transform: 'none !important',
        animation: 'none !important',
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
        } else if (item.type === "template") {
          // For new widgets from template, use cursor position minus some offset for better UX
          x = Math.max(0, x - 150); // Center the widget under cursor
          y = Math.max(0, y - 100);
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
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [aiDashboardPrompt, setAiDashboardPrompt] = useState("");
  const [aiWidgetPrompt, setAiWidgetPrompt] = useState("");
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

  // AI Dashboard Creation Mutation
  const aiDashboardMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { 
        command: `Create a dashboard: ${prompt}` 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Dashboard Created",
        description: data.message || "Dashboard created successfully with AI assistance",
      });
      
      // Create the dashboard with AI-generated configuration
      if (data.success) {
        const dashboardData = {
          name: data.data?.name || "AI Generated Dashboard",
          description: data.data?.description || "Created with AI assistance",
          configuration: {
            standardWidgets: data.data?.widgets?.filter((w: any) => w.isStandard) || [],
            customWidgets: data.data?.widgets?.filter((w: any) => !w.isStandard) || []
          }
        };
        
        createDashboardMutation.mutate(dashboardData);
      }
      
      setAiDashboardPrompt("");
    },
    onError: (error) => {
      toast({
        title: "AI Error",
        description: "Failed to create dashboard with AI. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI Widget Creation Mutation
  const aiWidgetMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { 
        command: `Create analytics widgets: ${prompt}` 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Widgets Created",
        description: data.message || "Widgets created successfully with AI assistance",
      });
      
      // Add AI-generated widgets to the working widgets
      if (data.success && data.data?.widgets) {
        const newWidgets = data.data.widgets.map((widget: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: widget.title || "AI Widget",
          type: widget.type || "metric",
          data: widget.data || {},
          visible: true,
          position: { x: Math.random() * 200, y: Math.random() * 200 },
          size: { width: widget.width || 300, height: widget.height || 200 },
          config: widget.config || {},
          isStandard: false
        }));
        
        setWorkingWidgets(prev => [...prev, ...newWidgets]);
      }
      
      setAiWidgetPrompt("");
    },
    onError: (error) => {
      toast({
        title: "AI Error",
        description: "Failed to create widgets with AI. Please try again.",
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
    // Update position immediately without animation to prevent sliding
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

  // AI Handler Functions
  const handleCreateDashboardWithAI = () => {
    if (!aiDashboardPrompt.trim()) return;
    aiDashboardMutation.mutate(aiDashboardPrompt);
  };

  const handleCreateWidgetsWithAI = () => {
    if (!aiWidgetPrompt.trim() || !editingDashboard) return;
    aiWidgetMutation.mutate(aiWidgetPrompt);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-3 sm:px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl truncate">
                  {editingDashboard ? `Edit: ${editingDashboard.name}` : "Dashboard Manager"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-600">
                  {editingDashboard ? "Drag widgets to design your dashboard" : "Manage dashboard configurations"}
                </DialogDescription>
              </div>
              
              {/* Compact Action Controls */}
              <div className="flex items-center gap-2 ml-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browse">Browse</SelectItem>
                    <SelectItem value="create">Create New</SelectItem>
                    <SelectItem value="editor">Visual Editor</SelectItem>
                    <SelectItem value="templates">Widget Library</SelectItem>
                    <SelectItem value="ai">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Assistant</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>
          {/* Content Area - Conditional Rendering */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "browse" && (
              <div className="p-3 sm:p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-semibold">Saved Dashboards</h3>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("create")}
                    className="text-xs sm:text-sm h-8 px-3 touch-manipulation"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span>New</span>
                  </Button>
                </div>

                <div className="grid gap-3">
                  {dashboards.map((dashboard) => (
                    <Card key={dashboard.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{dashboard.name}</h4>
                            {dashboard.isDefault && (
                              <Badge variant="secondary" className="text-xs px-1">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{dashboard.description}</p>
                          <div className="text-xs text-gray-500">
                            {new Date(dashboard.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDashboardSelect(dashboard)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(dashboard)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {dashboards.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No dashboards created yet. Create your first dashboard to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "create" && (
              <div className="p-3 sm:p-4 h-full overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-semibold">Create New Dashboard</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs sm:text-sm">Dashboard Name</Label>
                      <Input
                        id="name"
                        value={newDashboard.name}
                        onChange={(e) => setNewDashboard({...newDashboard, name: e.target.value})}
                        placeholder="Enter dashboard name"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        value={newDashboard.description}
                        onChange={(e) => setNewDashboard({...newDashboard, description: e.target.value})}
                        placeholder="Enter dashboard description"
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isDefault"
                        checked={newDashboard.isDefault}
                        onCheckedChange={(checked) => setNewDashboard({...newDashboard, isDefault: checked as boolean})}
                      />
                      <Label htmlFor="isDefault" className="text-xs sm:text-sm">Set as default dashboard</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateDashboard}
                        disabled={!newDashboard.name.trim() || createDashboardMutation.isPending}
                        className="flex-1 h-8 text-sm"
                      >
                        {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("browse")}
                        className="h-8 text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-xs sm:text-sm font-medium mb-2">Quick AI Create</h4>
                    <div className="space-y-2">
                      <textarea
                        placeholder="Describe dashboard (e.g., 'Production overview with jobs, resources, and efficiency metrics')"
                        className="w-full h-20 p-2 border rounded-lg resize-none text-sm"
                        value={aiDashboardPrompt}
                        onChange={(e) => setAiDashboardPrompt(e.target.value)}
                      />
                      <Button
                        onClick={handleCreateDashboardWithAI}
                        disabled={!aiDashboardPrompt.trim() || aiDashboardMutation.isPending}
                        className="w-full h-8 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        {aiDashboardMutation.isPending ? "Creating..." : (
                          <div className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Create
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "editor" && (
              <div className="p-2 sm:p-3 h-full overflow-hidden">
                {editingDashboard ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">Visual Editor</h3>
                        <p className="text-xs text-gray-600">Drag widgets to design your dashboard</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          onClick={handleSaveEditing}
                          disabled={updateDashboardMutation.isPending}
                          size="sm"
                          className="h-7 px-3 text-xs"
                        >
                          {updateDashboardMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEditing}
                          size="sm"
                          className="h-7 px-3 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 overflow-hidden">
                      <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium">Canvas</h4>
                          <div className="text-xs text-gray-500">
                            {workingWidgets.length} widgets
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <VisualEditor
                            widgets={workingWidgets}
                            onDrop={handleDropWidget}
                            onWidgetSelect={setSelectedWidgetId}
                            selectedWidgetId={selectedWidgetId}
                            onWidgetMove={handleWidgetMove}
                          />
                        </div>
                      </div>
                      <div className="order-1 lg:order-2 flex flex-col">
                        <h4 className="text-xs font-medium mb-2">Widget Library</h4>
                        <div className="flex-1 overflow-y-auto">
                          <div className="space-y-1">
                            {widgetTemplates.map((template) => (
                              <DraggableTemplate key={template.id} template={template} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Select a dashboard to edit from Browse
                  </div>
                )}
              </div>
            )}

            {activeTab === "templates" && (
              <div className="p-3 sm:p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-semibold">Widget Library</h3>
                  <p className="text-xs text-gray-600">Available widgets</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {widgetTemplates.map((template) => (
                    <Card key={template.id} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-blue-600 flex-shrink-0">
                          {template.icon === "BarChart3" && <BarChart3 className="h-4 w-4" />}
                          {template.icon === "TrendingUp" && <TrendingUp className="h-4 w-4" />}
                          {template.icon === "AlertTriangle" && <AlertTriangle className="h-4 w-4" />}
                          {template.icon === "CheckCircle" && <CheckCircle className="h-4 w-4" />}
                          {template.icon === "PieChart" && <PieChart className="h-4 w-4" />}
                          {template.icon === "Activity" && <Activity className="h-4 w-4" />}
                          {template.icon === "Wrench" && <Wrench className="h-4 w-4" />}
                        </div>
                        <h4 className="font-medium text-sm truncate">{template.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{template.description}</p>
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
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="p-3 sm:p-4 h-full overflow-y-auto">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">AI Dashboard Assistant</h3>
                  <p className="text-xs text-gray-600">Create dashboards and widgets using natural language</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium">Dashboard Creation</h4>
                    <div className="space-y-2">
                      <textarea
                        placeholder="Describe the dashboard you want to create..."
                        className="w-full h-20 p-2 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={aiDashboardPrompt}
                        onChange={(e) => setAiDashboardPrompt(e.target.value)}
                      />
                      <Button
                        onClick={handleCreateDashboardWithAI}
                        disabled={!aiDashboardPrompt.trim() || aiDashboardMutation.isPending}
                        className="w-full h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
                      >
                        {aiDashboardMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Create Dashboard
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium">Widget Creation</h4>
                    <div className="space-y-2">
                      <textarea
                        placeholder="Describe the widgets you want to add..."
                        className="w-full h-20 p-2 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={aiWidgetPrompt}
                        onChange={(e) => setAiWidgetPrompt(e.target.value)}
                      />
                      <Button
                        onClick={handleCreateWidgetsWithAI}
                        disabled={!aiWidgetPrompt.trim() || !editingDashboard || aiWidgetMutation.isPending}
                        className="w-full h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
                      >
                        {aiWidgetMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Add Widgets
                          </div>
                        )}
                      </Button>
                      {!editingDashboard && (
                        <p className="text-xs text-gray-500 text-center">
                          Select a dashboard to edit first
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 mt-4">
                  <h4 className="text-xs font-medium mb-2">Quick Examples</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li>• "Production overview dashboard"</li>
                        <li>• "Resource utilization dashboard"</li>
                        <li>• "Quality control dashboard"</li>
                      </ul>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li>• "Chart showing production trends"</li>
                        <li>• "Metrics for efficiency and uptime"</li>
                        <li>• "Table of upcoming deadlines"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}