import { useState, useRef, useCallback } from "react";
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
import { 
  Plus, Save, Trash2, BarChart3, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, Target, PieChart, Activity, Users, Package, RotateCcw, Maximize2,
  Minimize2, Grid3x3, Move, Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DndProvider } from "react-dnd";
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
  id?: number;
  name: string;
  description: string;
  configuration: {
    standardWidgets: AnalyticsWidget[];
    customWidgets: AnalyticsWidget[];
  };
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardDesignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDashboard?: DashboardConfig | null;
  onSave?: (dashboard: DashboardConfig) => void;
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
    icon: "Users",
    description: "Table showing resource status information",
    defaultConfig: { sortable: true },
    defaultData: { icon: "Users", description: "Resource information" }
  },
  {
    id: "inventory-levels",
    title: "Inventory Levels",
    type: "metric",
    icon: "Package",
    description: "Shows current inventory levels",
    defaultConfig: { color: "orange" },
    defaultData: { icon: "Package", description: "Material inventory" }
  }
];

const iconMap = {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Target,
  PieChart, Activity, Users, Package
};

export function DashboardDesigner({ open, onOpenChange, existingDashboard, onSave }: DashboardDesignerProps) {
  const [dashboardName, setDashboardName] = useState(existingDashboard?.name || "");
  const [dashboardDescription, setDashboardDescription] = useState(existingDashboard?.description || "");
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [widgets, setWidgets] = useState<AnalyticsWidget[]>(existingDashboard?.configuration.customWidgets || []);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Draggable widget item for the widget library
  const DraggableWidget = ({ template }: { template: WidgetTemplate }) => {
    const Icon = iconMap[template.icon as keyof typeof iconMap] || BarChart3;
    
    return (
      <div
        className="p-3 bg-white dark:bg-gray-700 border rounded-lg cursor-grab hover:border-blue-500 hover:shadow-md transition-all"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'widget',
            title: template.title,
            widgetType: template.type,
            template: template
          }));
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium">{template.title}</span>
        </div>
        <p className="text-xs text-gray-500">{template.description}</p>
        <Badge variant="outline" className="mt-2 text-xs">
          {template.type}
        </Badge>
      </div>
    );
  };

  // Handle saving the dashboard
  const handleSave = useCallback(async () => {
    if (!dashboardName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a dashboard name",
        variant: "destructive"
      });
      return;
    }

    const dashboardData: DashboardConfig = {
      ...existingDashboard,
      name: dashboardName,
      description: dashboardDescription,
      configuration: {
        standardWidgets: existingDashboard?.configuration.standardWidgets || [],
        customWidgets: widgets
      }
    };

    try {
      if (existingDashboard?.id) {
        // Update existing dashboard
        const response = await apiRequest("PUT", `/api/dashboard-configs/${existingDashboard.id}`, dashboardData);
        const updatedDashboard = await response.json();
        
        toast({
          title: "Dashboard Updated",
          description: `"${dashboardName}" has been updated successfully.`
        });
        
        onSave?.(updatedDashboard);
      } else {
        // Create new dashboard
        const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
        const newDashboard = await response.json();
        
        toast({
          title: "Dashboard Created",
          description: `"${dashboardName}" has been created successfully.`
        });
        
        onSave?.(newDashboard);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dashboard. Please try again.",
        variant: "destructive"
      });
    }
  }, [dashboardName, dashboardDescription, widgets, existingDashboard, onSave, onOpenChange, toast, queryClient]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-blue-600" />
              {existingDashboard ? `Edit Dashboard: ${existingDashboard.name}` : "New Dashboard Designer"}
            </DialogTitle>
            <DialogDescription>
              Drag and drop widgets to create your custom dashboard layout
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex gap-6 min-h-0">
            {/* Left Panel - Widget Library */}
            <div className="w-80 flex flex-col border-r">
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Dashboard Settings</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-xs">Name</Label>
                    <Input
                      id="name"
                      value={dashboardName}
                      onChange={(e) => setDashboardName(e.target.value)}
                      placeholder="My Dashboard"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Textarea
                      id="description"
                      value={dashboardDescription}
                      onChange={(e) => setDashboardDescription(e.target.value)}
                      placeholder="Dashboard description"
                      className="h-16 resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Canvas Size</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="canvas-width" className="text-xs">W:</Label>
                    <Input
                      id="canvas-width"
                      type="number"
                      value={canvasWidth}
                      onChange={(e) => setCanvasWidth(Number(e.target.value))}
                      className="w-16 h-6 text-xs"
                      min="400"
                      max="1600"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="canvas-height" className="text-xs">H:</Label>
                    <Input
                      id="canvas-height"
                      type="number"
                      value={canvasHeight}
                      onChange={(e) => setCanvasHeight(Number(e.target.value))}
                      className="w-16 h-6 text-xs"
                      min="300"
                      max="1200"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setCanvasWidth(800); setCanvasHeight(600); }}
                    className="h-6 px-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="p-4">
                  <h3 className="font-medium mb-3">Widget Library</h3>
                  <p className="text-xs text-gray-500 mb-4">Drag widgets to the canvas</p>
                </div>
                <ScrollArea className="px-4 pb-4 flex-1">
                  <div className="space-y-3">
                    {widgetTemplates.map((template) => (
                      <DraggableWidget key={template.id} template={template} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Panel - Canvas */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Design Canvas</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{widgets.length} widgets</span>
                    <Button variant="outline" size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Dashboard
                    </Button>
                  </div>
                </div>
              </div>

              {/* Canvas Container */}
              <div className="flex-1 overflow-auto p-4">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 relative overflow-hidden"
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
                    const x = e.clientX - rect.left - 4; // Account for padding
                    const y = e.clientY - rect.top - 4;
                    
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'widget') {
                        const newWidget: AnalyticsWidget = {
                          id: `widget-${Date.now()}`,
                          title: data.title,
                          type: data.widgetType,
                          position: { x: Math.max(0, x), y: Math.max(0, y) },
                          size: { width: 200, height: 150 },
                          visible: true,
                          data: data.template?.defaultData || {},
                          config: data.template?.defaultConfig || {}
                        };
                        
                        setWidgets(prev => [...prev, newWidget]);
                      }
                    } catch (error) {
                      console.error('Error parsing drop data:', error);
                    }
                  }}
                >
                  {widgets.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Drop widgets here</p>
                        <p className="text-sm">Drag widgets from the library to start designing</p>
                      </div>
                    </div>
                  )}
                  
                  {widgets.map((widget) => {
                    const Icon = iconMap[widget.data?.icon as keyof typeof iconMap] || BarChart3;
                    
                    return (
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
                              
                              setWidgets(prev => prev.map(w => 
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
                        <div className="widget-header flex items-center justify-between mb-2 p-3 cursor-move border-b">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium truncate">{widget.title}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWidgets(prev => prev.filter(w => w.id !== widget.id));
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="widget-content px-3 pb-3">
                          <div className="text-xs text-gray-500 capitalize mb-1">{widget.type}</div>
                          <div className="text-xs text-gray-400">{widget.data?.description}</div>
                        </div>
                        
                        {/* Resize Handles */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity">
                          <div 
                            className="w-full h-full bg-blue-500 rounded-tl-lg"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startWidth = widget.size.width;
                              const startHeight = widget.size.height;
                              const startX = e.clientX;
                              const startY = e.clientY;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const newWidth = Math.max(150, startWidth + (e.clientX - startX));
                                const newHeight = Math.max(100, startHeight + (e.clientY - startY));
                                
                                setWidgets(prev => prev.map(w => 
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}