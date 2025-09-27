import { useState, useRef, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";
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
  Layers,
  Bot,
  Send,
  MessageSquare,
  Shield
} from "lucide-react";

interface WidgetDefinition {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress" | "custom" | string;
  icon: React.ElementType;
  category: string;
  defaultSize: { width: number; height: number };
  description: string;
  configurable: boolean;
  isSystem?: boolean;
  originalWidget?: any;
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

// Widget Library Definition - Empty initially, will be populated from database
const WIDGET_LIBRARY: WidgetDefinition[] = [];

// Custom Drag Layer for better visual feedback
function CustomDragLayer({ widgetLibrary = [] }: { widgetLibrary?: WidgetDefinition[] }) {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  const transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`;

  // Render appropriate preview based on item type
  const renderPreview = () => {
    if (itemType === "library-widget") {
      const Icon = item.icon || Target;
      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3 min-w-[200px] opacity-90">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{item.title}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
      );
    } else if (itemType === "canvas-widget") {
      const widgetDef = widgetLibrary.find(w => w.id === item.widgetId);
      const Icon = widgetDef?.icon || Target;
      return (
        <div 
          className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg opacity-90"
          style={{ width: item.size.width, height: item.size.height }}
        >
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium truncate">{item.title}</span>
            </div>
          </div>
          <div className="p-3 flex items-center justify-center h-[calc(100%-40px)]">
            <span className="text-xs text-gray-500">Widget Preview</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed top-0 left-0 pointer-events-none z-50" style={{ transform }}>
      {renderPreview()}
    </div>
  );
}

// Draggable Widget from Library
function LibraryWidget({ widget }: { widget: WidgetDefinition & { isSystem?: boolean } }) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "library-widget",
    item: widget,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const Icon = widget.icon;
  const isSystemWidget = widget.isSystem || widget.category === "System";

  // Get a user-friendly type label
  const getTypeLabel = () => {
    if (widget.category === "Metrics") return "KPI";
    if (widget.category === "Gauges") return "Gauge";
    if (widget.category === "Charts") return "Chart";
    if (widget.category === "Tables") return "Table";
    if (widget.category === "Activity") return "Activity Feed";
    if (widget.category === "Progress") return "Progress";
    if (widget.category === "System") return "System";
    return widget.category;
  };

  // Get category-specific colors
  const getCategoryColors = () => {
    switch(widget.category) {
      case "Metrics": return { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" };
      case "Gauges": return { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" };
      case "Charts": return { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" };
      case "Tables": return { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" };
      case "Activity": return { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400" };
      case "Progress": return { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400" };
      case "System": return { bg: "bg-gray-200 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400" };
      default: return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };
    }
  };

  const colors = getCategoryColors();

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move transition-all hover:shadow-md hover:border-blue-400 ${
        isDragging ? "opacity-50" : ""
      } ${isSystemWidget ? "border-gray-300 bg-gray-50/50 dark:bg-gray-900/50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{widget.title}</h4>
            {isSystemWidget && (
              <Shield className="w-3 h-3 text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{widget.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {getTypeLabel()}
            </Badge>
            {!widget.configurable && (
              <Badge variant="secondary" className="text-xs">
                Read-only
              </Badge>
            )}
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
  onDuplicate,
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
  onDuplicate: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  gridSize?: number;
  widgetLibrary?: WidgetDefinition[];
}) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "canvas-widget",
    item: { ...widget, type: "canvas-widget" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

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
      startWidth: widget.size?.width || 400,
      startHeight: widget.size?.height || 300,
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
  const widgetDef = widgetLibrary?.find(w => w.id === widget.widgetId);
  const Icon = widgetDef?.icon || Target;

  return (
    <div
      ref={drag}
      className={`absolute bg-white dark:bg-gray-800 border rounded-lg shadow-sm transition-all ${
        isDragging ? "opacity-50" : ""
      } ${isSelected ? "ring-2 ring-blue-500" : ""} ${isResizing ? "cursor-nwse-resize" : "cursor-move"}`}
      style={{
        left: widget.position?.x || 0,
        top: widget.position?.y || 0,
        width: widget.size?.width || 400,
        height: widget.size?.height || 300,
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
              onDuplicate(widget.id);
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
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
  onDuplicateWidget,
  layout = "grid",
  gridColumns = 12,
  selectedWidgetId,
  onSelectWidget,
  widgetLibrary
}: {
  widgets: DashboardWidget[];
  onAddWidget: (widget: WidgetDefinition, position: { x: number; y: number }) => void;
  onMoveWidget: (id: string, position: { x: number; y: number }) => void;
  onResizeWidget: (id: string, size: { width: number; height: number }) => void;
  onRemoveWidget: (id: string) => void;
  onConfigureWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  layout?: "grid" | "freeform";
  gridColumns?: number;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  widgetLibrary?: WidgetDefinition[];
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSize = layout === "grid" ? 20 : 1;

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["library-widget", "canvas-widget"],
    drop: (item: any, monitor) => {
      console.log('Drop event triggered:', { item, monitor: monitor.getItemType() });
      
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = Math.round((offset.x - canvasRect.left) / gridSize) * gridSize;
        const y = Math.round((offset.y - canvasRect.top) / gridSize) * gridSize;

        const itemType = monitor.getItemType();
        console.log('Item type:', itemType, 'Position:', { x, y });

        if (itemType === "canvas-widget") {
          // Moving existing widget
          console.log('Moving widget:', item.id);
          onMoveWidget(item.id, { x, y });
        } else if (itemType === "library-widget") {
          // Adding new widget from library
          console.log('Adding widget from library:', item);
          try {
            onAddWidget(item, { x, y });
          } catch (error) {
            console.error('Error adding widget:', error);
          }
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
          onDuplicate={onDuplicateWidget}
          isSelected={selectedWidgetId === widget.id}
          onSelect={onSelectWidget}
          gridSize={gridSize}
          widgetLibrary={widgetLibrary || []}
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
  
  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);

  // Effect to update state when dashboard prop changes (for editing existing dashboards)
  useEffect(() => {
    if (dashboard) {
      setDashboardName(dashboard.name || "");
      setDashboardDescription(dashboard.description || "");
      setLayout(dashboard.layout || "grid");
      setGridColumns(dashboard.gridColumns || 12);
      setTargetPlatform(dashboard.targetPlatform || "both");
      setWidgets(dashboard.widgets || []);
    } else {
      // Reset to defaults when no dashboard is provided (creating new)
      setDashboardName("");
      setDashboardDescription("");
      setLayout("grid");
      setGridColumns(12);
      setTargetPlatform("both");
      setWidgets([]);
    }
    // Reset selection when dashboard changes
    setSelectedWidgetId(null);
  }, [dashboard]);

  // Load custom canvas widgets
  const { data: canvasWidgetsResponse, isLoading: isLoadingCanvasWidgets } = useQuery({
    queryKey: ['/api/canvas/widgets'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0 // Don't cache
  });
  
  // Ensure canvasWidgets is always an array
  const canvasWidgets = Array.isArray(canvasWidgetsResponse) ? canvasWidgetsResponse : [];



  // Convert canvas widgets to widget definitions
  const customWidgetDefs: WidgetDefinition[] = Array.isArray(canvasWidgets) ? canvasWidgets.map((widget: any) => {
    // Determine the widget category and type from configuration or data
    let category = "Custom";
    let icon = Target;
    let widgetType = "custom";
    
    // Check if it's a system widget (title starts with "System")
    const isSystemWidget = widget.is_system_widget || widget.isSystemWidget || widget.title?.startsWith("System");
    
    // Use the widget_type/widgetType first if available
    const actualWidgetType = widget.widgetType || widget.widget_type;
    const actualWidgetSubtype = widget.widgetSubtype || widget.widget_subtype;
    
    // Debug log for gauge widgets
    if (widget.title?.includes("Gauge") || actualWidgetType === 'gauge') {
      console.log('Gauge widget debug:', {
        title: widget.title,
        actualWidgetType,
        actualWidgetSubtype,
        isGaugeCheck: actualWidgetType === 'gauge' || actualWidgetSubtype === 'gauge'
      });
    }
    
    // Extract visualization type from configuration or data
    const visualization = widget.configuration?.visualization || widget.data?.configuration?.visualization;
    const widgetTemplate = widget.data?.template;
    
    // Determine category based on widget type, subtype, or visualization
    if (isSystemWidget) {
      category = "System";
      icon = Shield;
      widgetType = actualWidgetType || "custom";
    } else if (actualWidgetType === 'kpi' || actualWidgetSubtype === 'kpi' || visualization === 'metric') {
      category = "Metrics";
      icon = Target;
      widgetType = "metric";
    } else if (actualWidgetType === 'gauge' || actualWidgetSubtype === 'gauge' || visualization === 'gauge') {
      category = "Gauges";
      icon = Activity;
      widgetType = "gauge";  // Changed from "metric" to "gauge"
    } else if (actualWidgetType === 'chart' || actualWidgetSubtype === 'chart' || 
               visualization === 'line' || visualization === 'bar' || visualization === 'pie') {
      category = "Charts";  
      icon = BarChart3;
      widgetType = "chart";
    } else if (actualWidgetType === 'table' || actualWidgetSubtype === 'table' || visualization === 'table') {
      category = "Tables";
      icon = Grid;
      widgetType = "table";
    } else if (actualWidgetType === 'activity' || actualWidgetSubtype === 'activity' || visualization === 'activity') {
      category = "Activity";
      icon = MessageSquare;
      widgetType = "custom";
    } else if (actualWidgetType === 'progress' || actualWidgetSubtype === 'progress' || visualization === 'progress') {
      category = "Progress";
      icon = TrendingUp;
      widgetType = "progress";
    } else if (widgetTemplate === 'production' || widgetTemplate === 'schedule' || widgetTemplate === 'operations') {
      category = "Production";
      icon = Package;
      widgetType = "custom";
    }
    
    // Override icon based on specific widget titles or types
    if (widget.title?.includes("Alert")) icon = AlertTriangle;
    if (widget.title?.includes("Resource")) icon = Users;
    if (widget.title?.includes("Schedule")) icon = Clock;
    if (widget.title?.includes("Gauge")) icon = Activity;
    if (widget.title?.includes("Activity")) icon = MessageSquare;
    if (widget.title?.includes("Progress")) icon = TrendingUp;
    if (widget.title?.includes("Delivery")) icon = CheckCircle;
    if (widget.title?.includes("Table")) icon = Grid;
    if (widget.title?.includes("KPI")) icon = Target;
    
    return {
      id: `widget-${widget.id}`,
      title: widget.title || widget.name || "Untitled Widget",
      type: widgetType,
      icon,
      category,
      defaultSize: { width: 300, height: 200 },
      description: widget.configuration?.description || widget.data?.description || 
                   (isSystemWidget ? "System-generated widget" : "User-created widget"),
      configurable: !isSystemWidget,
      isSystem: isSystemWidget,
      originalWidget: widget // Store original widget data
    };
  }) : [];

  // Combine static and custom widgets
  const COMBINED_WIDGET_LIBRARY = [...WIDGET_LIBRARY, ...customWidgetDefs];

  // AI-powered dashboard editing mutation
  const aiEditMutation = useMutation({
    mutationFn: async ({ prompt, dashboardConfig }: { prompt: string; dashboardConfig: any }) => {
      return apiRequest('POST', '/api/dashboard-configs/ai-edit', {
        prompt,
        dashboardConfig
      });
    },
    onSuccess: (data: any) => {
      if (data.updatedConfig) {
        // Apply AI-generated changes to the dashboard
        const updatedConfig = data.updatedConfig;
        if (updatedConfig.name) setDashboardName(updatedConfig.name);
        if (updatedConfig.description) setDashboardDescription(updatedConfig.description);
        if (updatedConfig.layout) setLayout(updatedConfig.layout);
        if (updatedConfig.targetPlatform) setTargetPlatform(updatedConfig.targetPlatform);
        if (updatedConfig.widgets) setWidgets(updatedConfig.widgets);
        
        toast({
          title: "AI Edit Applied",
          description: data.explanation || "Dashboard updated successfully with AI suggestions"
        });
      }
      setAiPrompt("");
      setAiProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "AI Edit Failed",
        description: error.message || "Failed to apply AI changes to dashboard",
        variant: "destructive"
      });
      setAiProcessing(false);
    }
  });

  // Get unique categories including custom widgets
  const categories = ["All", ...new Set(COMBINED_WIDGET_LIBRARY.map(w => w.category))];

  // Filter widgets by category
  const filteredWidgets = selectedCategory === "All" 
    ? COMBINED_WIDGET_LIBRARY 
    : COMBINED_WIDGET_LIBRARY.filter(w => w.category === selectedCategory);



  // Add widget to canvas
  const handleAddWidget = (widgetDef: WidgetDefinition, position: { x: number; y: number }) => {
    console.log('handleAddWidget called with:', { widgetDef, position });
    
    try {
      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        widgetId: widgetDef.id,
        title: widgetDef.title,
        type: widgetDef.type,
        position,
        size: widgetDef.defaultSize || { width: 300, height: 200 },
        config: {},
      };
      
      console.log('New widget created:', newWidget);
      setWidgets([...widgets, newWidget]);
      setSelectedWidgetId(newWidget.id);
      
      console.log('Widget added successfully');
    } catch (error) {
      console.error('Error in handleAddWidget:', error);
    }
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
  const handleDuplicateWidget = (widgetId?: string) => {
    const targetId = widgetId || selectedWidgetId;
    if (targetId) {
      const widget = widgets.find(w => w.id === targetId);
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

  // Handle AI prompt submission
  const handleAiPrompt = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description of changes you want to make",
        variant: "destructive"
      });
      return;
    }

    setAiProcessing(true);

    // Create current dashboard config for AI context
    const currentConfig = {
      name: dashboardName,
      description: dashboardDescription,
      layout,
      targetPlatform,
      gridColumns,
      widgets
    };

    aiEditMutation.mutate({
      prompt: aiPrompt,
      dashboardConfig: currentConfig
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer widgetLibrary={COMBINED_WIDGET_LIBRARY} />
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
            <div className="flex items-center gap-2 mr-8">
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
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left Sidebar - Widget Library */}
            <div className="w-80 border-r flex flex-col min-h-0">
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
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 pb-2 flex-shrink-0">
                  <h3 className="font-medium mb-3">Widget Library ({canvasWidgets?.length || 0} widgets)</h3>
                  <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <ScrollArea className="w-full">
                      <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full">
                        {categories.map(cat => (
                          <TabsTrigger 
                            key={cat} 
                            value={cat} 
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium"
                          >
                            {cat === "System" && <Shield className="w-3 h-3 mr-1" />}
                            {cat}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </ScrollArea>
                  </Tabs>
                </div>
                
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-2 pb-4">
                    {filteredWidgets.length > 0 ? (
                      filteredWidgets.map((widget) => (
                        <LibraryWidget key={widget.id} widget={widget} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No widgets available</p>
                        <p className="text-xs mt-1">
                          {selectedCategory === "All" 
                            ? "Create widgets in the Widget Studio first"
                            : `No ${selectedCategory.toLowerCase()} widgets found`}
                        </p>
                      </div>
                    )}
                    </div>
                  </ScrollArea>
                </div>
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

                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md px-2 py-1">
                    <Sparkles className="w-3 h-3 text-purple-600 flex-shrink-0" />
                    <Input
                      placeholder="Describe changes you want to make..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiPrompt();
                        }
                      }}
                      className="h-6 text-xs border-0 bg-transparent focus:ring-0 focus:border-0 min-w-80 placeholder:text-purple-400"
                      disabled={aiProcessing}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAiPrompt}
                      disabled={aiProcessing || !aiPrompt.trim()}
                      className="h-6 px-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800"
                    >
                      {aiProcessing ? (
                        <Sparkles className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Grid className="w-3 h-3" />
                    {layout === "grid" ? "Grid Layout" : "Freeform Layout"}
                  </div>
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
                  onDuplicateWidget={handleDuplicateWidget}
                  layout={layout}
                  gridColumns={gridColumns}
                  selectedWidgetId={selectedWidgetId}
                  onSelectWidget={setSelectedWidgetId}
                  widgetLibrary={COMBINED_WIDGET_LIBRARY}
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