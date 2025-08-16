import { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Save, 
  Settings, 
  Trash2, 
  Move, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff,
  Grid,
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  Target,
  Clock,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Copy,
  Download,
  Upload,
  X,
  GripVertical,
  Palette,
  Layout,
  Layers
} from "lucide-react";

interface WidgetDefinition {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress" | "custom";
  icon: React.ElementType;
  category: string;
  defaultSize: { width: number; height: number };
  description: string;
  configurable: boolean;
}

interface DashboardWidget {
  id: string;
  widgetId: string;
  title: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  data?: any;
}

interface DashboardConfig {
  id?: number;
  name: string;
  description: string;
  layout: "grid" | "freeform";
  gridColumns: number;
  widgets: DashboardWidget[];
  theme?: string;
  targetPlatform: "desktop" | "mobile" | "both";
}

interface DashboardVisualDesignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard?: DashboardConfig | null;
  onSave: (dashboard: DashboardConfig) => void;
}

// Widget Library Definition
const WIDGET_LIBRARY: WidgetDefinition[] = [
  // Metrics
  {
    id: "kpi-metric",
    title: "KPI Metric",
    type: "metric",
    icon: Target,
    category: "Metrics",
    defaultSize: { width: 200, height: 120 },
    description: "Display a single KPI with trend",
    configurable: true
  },
  {
    id: "gauge-metric",
    title: "Gauge",
    type: "metric",
    icon: Activity,
    category: "Metrics",
    defaultSize: { width: 200, height: 200 },
    description: "Circular gauge indicator",
    configurable: true
  },
  {
    id: "counter",
    title: "Counter",
    type: "metric",
    icon: TrendingUp,
    category: "Metrics",
    defaultSize: { width: 150, height: 100 },
    description: "Simple numeric counter",
    configurable: true
  },
  
  // Charts
  {
    id: "line-chart",
    title: "Line Chart",
    type: "chart",
    icon: Activity,
    category: "Charts",
    defaultSize: { width: 400, height: 300 },
    description: "Time series line chart",
    configurable: true
  },
  {
    id: "bar-chart",
    title: "Bar Chart",
    type: "chart",
    icon: BarChart3,
    category: "Charts",
    defaultSize: { width: 400, height: 300 },
    description: "Comparative bar chart",
    configurable: true
  },
  {
    id: "pie-chart",
    title: "Pie Chart",
    type: "chart",
    icon: PieChart,
    category: "Charts",
    defaultSize: { width: 300, height: 300 },
    description: "Distribution pie chart",
    configurable: true
  },
  
  // Tables
  {
    id: "data-table",
    title: "Data Table",
    type: "table",
    icon: Grid,
    category: "Tables",
    defaultSize: { width: 500, height: 400 },
    description: "Tabular data display",
    configurable: true
  },
  {
    id: "resource-list",
    title: "Resource List",
    type: "table",
    icon: Users,
    category: "Tables",
    defaultSize: { width: 400, height: 300 },
    description: "List of resources",
    configurable: true
  },
  
  // Progress
  {
    id: "progress-bar",
    title: "Progress Bar",
    type: "progress",
    icon: Activity,
    category: "Progress",
    defaultSize: { width: 300, height: 80 },
    description: "Linear progress indicator",
    configurable: true
  },
  {
    id: "milestone-tracker",
    title: "Milestone Tracker",
    type: "progress",
    icon: CheckCircle,
    category: "Progress",
    defaultSize: { width: 400, height: 150 },
    description: "Project milestone progress",
    configurable: true
  },
  
  // Production
  {
    id: "production-status",
    title: "Production Status",
    type: "custom",
    icon: Package,
    category: "Production",
    defaultSize: { width: 350, height: 200 },
    description: "Current production status",
    configurable: true
  },
  {
    id: "schedule-overview",
    title: "Schedule Overview",
    type: "custom",
    icon: Clock,
    category: "Production",
    defaultSize: { width: 400, height: 250 },
    description: "Production schedule summary",
    configurable: true
  },
  {
    id: "alerts-panel",
    title: "Alerts Panel",
    type: "custom",
    icon: AlertTriangle,
    category: "Production",
    defaultSize: { width: 350, height: 300 },
    description: "Active alerts and notifications",
    configurable: true
  }
];

// Draggable Widget from Library
function LibraryWidget({ widget }: { widget: WidgetDefinition }) {
  const [{ isDragging }, drag] = useDrag({
    type: "library-widget",
    item: widget,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const Icon = widget.icon;

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move transition-all hover:shadow-md hover:border-blue-400 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{widget.title}</h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{widget.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {widget.category}
            </Badge>
            <span className="text-xs text-gray-400">
              {widget.defaultSize.width}x{widget.defaultSize.height}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Canvas Widget (Placed on Dashboard)
function CanvasWidget({ 
  widget, 
  onMove, 
  onResize, 
  onRemove, 
  onConfigure,
  isSelected,
  onSelect,
  gridSize = 20,
  widgetLibrary = WIDGET_LIBRARY
}: { 
  widget: DashboardWidget;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  gridSize?: number;
  widgetLibrary?: WidgetDefinition[];
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "canvas-widget",
    item: { ...widget, type: "canvas-widget" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.size.width,
      startHeight: widget.size.height,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      const newWidth = Math.max(100, Math.round((resizeRef.current.startWidth + deltaX) / gridSize) * gridSize);
      const newHeight = Math.max(80, Math.round((resizeRef.current.startHeight + deltaY) / gridSize) * gridSize);
      onResize(widget.id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Find the widget definition for the icon
  const widgetDef = widgetLibrary.find(w => w.id === widget.widgetId);
  const Icon = widgetDef?.icon || Target;

  return (
    <div
      ref={drag}
      className={`absolute bg-white dark:bg-gray-800 border rounded-lg shadow-sm transition-all ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "ring-2 ring-blue-500" : ""} ${isResizing ? "cursor-nwse-resize" : "cursor-move"}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
      }}
      onClick={() => onSelect(widget.id)}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium truncate">{widget.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(widget.id);
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(widget.id);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Widget Content (Preview) */}
      <div className="p-3 flex items-center justify-center h-[calc(100%-40px)]">
        <div className="text-center text-gray-400">
          <Icon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">{widgetDef?.type || "Widget"}</p>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22" />
        </svg>
      </div>
    </div>
  );
}

// Main Dashboard Canvas
function DashboardCanvas({ 
  widgets, 
  onAddWidget, 
  onMoveWidget, 
  onResizeWidget, 
  onRemoveWidget,
  onConfigureWidget,
  layout = "grid",
  gridColumns = 12,
  selectedWidgetId,
  onSelectWidget
}: {
  widgets: DashboardWidget[];
  onAddWidget: (widget: WidgetDefinition, position: { x: number; y: number }) => void;
  onMoveWidget: (id: string, position: { x: number; y: number }) => void;
  onResizeWidget: (id: string, size: { width: number; height: number }) => void;
  onRemoveWidget: (id: string) => void;
  onConfigureWidget: (id: string) => void;
  layout?: "grid" | "freeform";
  gridColumns?: number;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSize = layout === "grid" ? 20 : 1;

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["library-widget", "canvas-widget"],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = Math.round((offset.x - canvasRect.left) / gridSize) * gridSize;
        const y = Math.round((offset.y - canvasRect.top) / gridSize) * gridSize;

        if (item.type === "canvas-widget") {
          // Moving existing widget
          onMoveWidget(item.id, { x, y });
        } else {
          // Adding new widget from library
          onAddWidget(item, { x, y });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine refs
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      drop(node);
    },
    [drop]
  );

  return (
    <div
      ref={setRefs}
      className={`relative w-full h-full bg-gray-50 dark:bg-gray-900 border-2 border-dashed rounded-lg ${
        isOver && canDrop ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300"
      }`}
      onClick={() => onSelectWidget(null)}
      style={{
        minHeight: 600,
        backgroundImage: layout === "grid" 
          ? `repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, #e5e7eb ${gridSize - 1}px, #e5e7eb ${gridSize}px),
             repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, #e5e7eb ${gridSize - 1}px, #e5e7eb ${gridSize}px)`
          : "none",
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    >
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Layers className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Drag widgets here to build your dashboard</p>
            <p className="text-gray-400 text-sm mt-1">Select widgets from the library on the left</p>
          </div>
        </div>
      )}

      {widgets.map((widget) => (
        <CanvasWidget
          key={widget.id}
          widget={widget}
          onMove={onMoveWidget}
          onResize={onResizeWidget}
          onRemove={onRemoveWidget}
          onConfigure={onConfigureWidget}
          isSelected={selectedWidgetId === widget.id}
          onSelect={onSelectWidget}
          gridSize={gridSize}
          widgetLibrary={COMBINED_WIDGET_LIBRARY}
        />
      ))}
    </div>
  );
}

// Widget Configuration Dialog
function WidgetConfigDialog({
  widget,
  open,
  onOpenChange,
  onSave
}: {
  widget: DashboardWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (widget: DashboardWidget) => void;
}) {
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setConfig(widget.config || {});
    }
  }, [widget]);

  if (!widget) return null;

  const handleSave = () => {
    onSave({
      ...widget,
      title,
      config
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Widget</DialogTitle>
          <DialogDescription>
            Customize the widget settings and data source
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="widget-title">Widget Title</Label>
            <Input
              id="widget-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter widget title"
            />
          </div>

          <div>
            <Label>Data Source</Label>
            <Select defaultValue="production">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production Data</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="custom">Custom Query</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Refresh Interval</Label>
            <Select defaultValue="30">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Manual</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function DashboardVisualDesigner({
  open,
  onOpenChange,
  dashboard,
  onSave
}: DashboardVisualDesignerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dashboard configuration state
  const [dashboardName, setDashboardName] = useState(dashboard?.name || "");
  const [dashboardDescription, setDashboardDescription] = useState(dashboard?.description || "");
  const [layout, setLayout] = useState<"grid" | "freeform">(dashboard?.layout || "grid");
  const [gridColumns, setGridColumns] = useState(dashboard?.gridColumns || 12);
  const [targetPlatform, setTargetPlatform] = useState<"desktop" | "mobile" | "both">(dashboard?.targetPlatform || "both");
  
  // Widgets state
  const [widgets, setWidgets] = useState<DashboardWidget[]>(dashboard?.widgets || []);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [widgetToConfig, setWidgetToConfig] = useState<DashboardWidget | null>(null);
  
  // View state
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Load custom canvas widgets
  const { data: canvasWidgets = [] } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    queryFn: () => apiRequest('GET', '/api/canvas/widgets')
  });

  // Convert canvas widgets to widget definitions
  const customWidgetDefs: WidgetDefinition[] = Array.isArray(canvasWidgets) ? canvasWidgets.map((widget: any) => ({
    id: `custom-${widget.id}`,
    title: widget.title,
    type: widget.widgetType || "custom",
    icon: Target, // Default icon for custom widgets
    category: "Custom Widgets",
    defaultSize: { width: 300, height: 200 },
    description: widget.data?.description || "Custom widget created by user",
    configurable: true
  })) : [];

  // Combine static and custom widgets
  const COMBINED_WIDGET_LIBRARY = [...WIDGET_LIBRARY, ...customWidgetDefs];

  // Get unique categories including custom widgets
  const categories = ["All", ...new Set(COMBINED_WIDGET_LIBRARY.map(w => w.category))];

  // Filter widgets by category
  const filteredWidgets = selectedCategory === "All" 
    ? COMBINED_WIDGET_LIBRARY 
    : COMBINED_WIDGET_LIBRARY.filter(w => w.category === selectedCategory);

  // Add widget to canvas
  const handleAddWidget = (widgetDef: WidgetDefinition, position: { x: number; y: number }) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      widgetId: widgetDef.id,
      title: widgetDef.title,
      type: widgetDef.type,
      position,
      size: widgetDef.defaultSize,
      config: {},
    };
    setWidgets([...widgets, newWidget]);
    setSelectedWidgetId(newWidget.id);
  };

  // Move widget
  const handleMoveWidget = (id: string, position: { x: number; y: number }) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, position } : w
    ));
  };

  // Resize widget
  const handleResizeWidget = (id: string, size: { width: number; height: number }) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, size } : w
    ));
  };

  // Remove widget
  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  };

  // Configure widget
  const handleConfigureWidget = (id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      setWidgetToConfig(widget);
      setConfigDialogOpen(true);
    }
  };

  // Save widget configuration
  const handleSaveWidgetConfig = (updatedWidget: DashboardWidget) => {
    setWidgets(widgets.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
    setWidgetToConfig(null);
  };

  // Save dashboard
  const handleSaveDashboard = () => {
    if (!dashboardName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a dashboard name",
        variant: "destructive"
      });
      return;
    }

    const dashboardConfig: DashboardConfig = {
      id: dashboard?.id,
      name: dashboardName,
      description: dashboardDescription,
      layout,
      gridColumns,
      widgets,
      targetPlatform
    };

    onSave(dashboardConfig);
    toast({
      title: "Success",
      description: "Dashboard saved successfully"
    });
  };

  // Clear canvas
  const handleClearCanvas = () => {
    setWidgets([]);
    setSelectedWidgetId(null);
  };

  // Duplicate selected widget
  const handleDuplicateWidget = () => {
    if (selectedWidgetId) {
      const widget = widgets.find(w => w.id === selectedWidgetId);
      if (widget) {
        const newWidget: DashboardWidget = {
          ...widget,
          id: `widget-${Date.now()}`,
          position: {
            x: widget.position.x + 20,
            y: widget.position.y + 20
          }
        };
        setWidgets([...widgets, newWidget]);
        setSelectedWidgetId(newWidget.id);
      }
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-xl font-semibold">Visual Dashboard Designer</h2>
              <p className="text-sm text-gray-500">
                Create and customize your dashboard visually
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {previewMode ? "Preview" : "Edit"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCanvas}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleSaveDashboard}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Dashboard
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Widget Library */}
            <div className="w-80 border-r flex flex-col">
              {/* Dashboard Settings */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Dashboard Settings</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dashboard-name" className="text-xs">Name</Label>
                    <Input
                      id="dashboard-name"
                      value={dashboardName}
                      onChange={(e) => setDashboardName(e.target.value)}
                      placeholder="Dashboard name"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dashboard-desc" className="text-xs">Description</Label>
                    <Textarea
                      id="dashboard-desc"
                      value={dashboardDescription}
                      onChange={(e) => setDashboardDescription(e.target.value)}
                      placeholder="Dashboard description"
                      className="h-16 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Layout</Label>
                      <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="freeform">Freeform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={targetPlatform} onValueChange={(v: any) => setTargetPlatform(v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Library */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 pb-2">
                  <h3 className="font-medium mb-3">Widget Library</h3>
                  <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid grid-cols-3 h-8">
                      {categories.slice(0, 3).map(cat => (
                        <TabsTrigger key={cat} value={cat} className="text-xs">
                          {cat}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-2 pb-4">
                    {filteredWidgets.map((widget) => (
                      <LibraryWidget key={widget.id} widget={widget} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col">
              {/* Canvas Toolbar */}
              <div className="p-2 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
                  </Badge>
                  {selectedWidgetId && (
                    <>
                      <Separator orientation="vertical" className="h-5" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDuplicateWidget}
                        className="h-7"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfigureWidget(selectedWidgetId)}
                        className="h-7"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Grid className="w-3 h-3" />
                  {layout === "grid" ? "Grid Layout" : "Freeform Layout"}
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-4 overflow-auto">
                <DashboardCanvas
                  widgets={widgets}
                  onAddWidget={handleAddWidget}
                  onMoveWidget={handleMoveWidget}
                  onResizeWidget={handleResizeWidget}
                  onRemoveWidget={handleRemoveWidget}
                  onConfigureWidget={handleConfigureWidget}
                  layout={layout}
                  gridColumns={gridColumns}
                  selectedWidgetId={selectedWidgetId}
                  onSelectWidget={setSelectedWidgetId}
                />
              </div>
            </div>
          </div>

          {/* Widget Configuration Dialog */}
          <WidgetConfigDialog
            widget={widgetToConfig}
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            onSave={handleSaveWidgetConfig}
          />
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}