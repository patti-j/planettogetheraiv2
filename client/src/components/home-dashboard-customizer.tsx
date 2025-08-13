import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Move, 
  Settings, 
  Grid3x3, 
  Maximize2,
  Minimize2,
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Package,
  Factory,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Calendar,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'quick-links' | 'recent-activity' | 'alerts' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  visible: boolean;
}

export interface HomeDashboardLayout {
  id?: number;
  userId: number;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface HomeDashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLayout?: HomeDashboardLayout | null;
  onLayoutUpdate?: (layout: HomeDashboardLayout) => void;
}

// Available widget templates for the home page
const WIDGET_TEMPLATES = [
  {
    id: 'production-metrics',
    type: 'metric' as const,
    title: 'Production Metrics',
    icon: Factory,
    description: 'Key production KPIs and metrics',
    defaultSize: { width: 300, height: 200 },
    config: {
      metrics: ['active_orders', 'completed_today', 'efficiency'],
      showTrends: true
    }
  },
  {
    id: 'resource-utilization',
    type: 'chart' as const,
    title: 'Resource Utilization',
    icon: BarChart3,
    description: 'Real-time resource utilization chart',
    defaultSize: { width: 400, height: 300 },
    config: {
      chartType: 'bar',
      dataSource: 'resources',
      groupBy: 'type'
    }
  },
  {
    id: 'order-status',
    type: 'chart' as const,
    title: 'Order Status',
    icon: PieChart,
    description: 'Distribution of order statuses',
    defaultSize: { width: 350, height: 300 },
    config: {
      chartType: 'pie',
      dataSource: 'production_orders',
      groupBy: 'status'
    }
  },
  {
    id: 'quick-links',
    type: 'quick-links' as const,
    title: 'Quick Actions',
    icon: Grid3x3,
    description: 'Frequently used navigation links',
    defaultSize: { width: 300, height: 250 },
    config: {
      links: [
        { label: 'Production Schedule', href: '/production-schedule', icon: 'Calendar' },
        { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
        { label: 'Shop Floor', href: '/shop-floor', icon: 'Factory' },
        { label: 'Reports', href: '/reports', icon: 'FileText' }
      ]
    }
  },
  {
    id: 'recent-activity',
    type: 'recent-activity' as const,
    title: 'Recent Activity',
    icon: Clock,
    description: 'Latest operations and updates',
    defaultSize: { width: 350, height: 400 },
    config: {
      limit: 10,
      showTimestamps: true
    }
  },
  {
    id: 'alerts',
    type: 'alerts' as const,
    title: 'System Alerts',
    icon: AlertTriangle,
    description: 'Important alerts and notifications',
    defaultSize: { width: 400, height: 200 },
    config: {
      severity: ['high', 'medium'],
      limit: 5
    }
  },
  {
    id: 'schedule-performance',
    type: 'metric' as const,
    title: 'Schedule Performance',
    icon: Target,
    description: 'Schedule adherence and performance metrics',
    defaultSize: { width: 300, height: 200 },
    config: {
      metrics: ['on_time_delivery', 'schedule_adherence', 'cycle_time'],
      showTargets: true
    }
  },
  {
    id: 'capacity-overview',
    type: 'chart' as const,
    title: 'Capacity Overview',
    icon: TrendingUp,
    description: 'Current and planned capacity utilization',
    defaultSize: { width: 450, height: 300 },
    config: {
      chartType: 'line',
      dataSource: 'capacity',
      timeRange: '7d'
    }
  }
];

const GRID_SIZE = 20;

interface DraggableWidgetProps {
  widget: DashboardWidget;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

function DraggableWidget({ widget, onMove, onResize, onDelete, isEditing }: DraggableWidgetProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id, position: widget.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditing
  });

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  return (
    <Card
      ref={drag}
      className={`absolute transition-all ${isDragging ? 'opacity-50' : ''} ${
        isEditing ? 'border-blue-500 cursor-move' : ''
      }`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{widget.title}</CardTitle>
          {isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(widget.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Widget content will render here based on type: {widget.type}
        </div>
      </CardContent>
      
      {/* Resize handle */}
      {isEditing && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = widget.size.width;
            const startHeight = widget.size.height;

            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(200, snapToGrid(startWidth + (e.clientX - startX)));
              const newHeight = Math.max(150, snapToGrid(startHeight + (e.clientY - startY)));
              onResize(widget.id, { width: newWidth, height: newHeight });
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </Card>
  );
}

interface DropZoneProps {
  children: React.ReactNode;
  onDrop: (item: any, position: { x: number; y: number }) => void;
  isEditing: boolean;
}

function DropZone({ children, onDrop, isEditing }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ['widget', 'template'],
    drop: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const dropRef = drop as any;
      
      if (clientOffset && dropRef.current) {
        const rect = dropRef.current.getBoundingClientRect();
        const position = {
          x: Math.max(0, Math.round((clientOffset.x - rect.left) / GRID_SIZE) * GRID_SIZE),
          y: Math.max(0, Math.round((clientOffset.y - rect.top) / GRID_SIZE) * GRID_SIZE)
        };
        
        onDrop(item, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    canDrop: () => isEditing
  });

  return (
    <div
      ref={drop}
      className={`relative min-h-[600px] w-full ${
        isEditing ? 'border-2 border-dashed border-gray-300 bg-gray-50/50' : ''
      } ${isOver ? 'border-blue-500 bg-blue-50' : ''}`}
      style={{
        backgroundImage: isEditing ? 
          `radial-gradient(circle, #cbd5e1 1px, transparent 1px)` : 'none',
        backgroundSize: isEditing ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
      }}
    >
      {children}
    </div>
  );
}

export function HomeDashboardCustomizer({ 
  open, 
  onOpenChange, 
  currentLayout, 
  onLayoutUpdate 
}: HomeDashboardCustomizerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layoutName, setLayoutName] = useState('My Dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentLayout) {
      setWidgets(currentLayout.widgets);
      setLayoutName(currentLayout.name);
    }
  }, [currentLayout?.id]);

  const handleAddWidget = (template: typeof WIDGET_TEMPLATES[0], position: { x: number; y: number }) => {
    const newWidget: DashboardWidget = {
      id: `${template.id}-${Date.now()}`,
      type: template.type,
      title: template.title,
      position,
      size: template.defaultSize,
      config: template.config,
      visible: true
    };

    setWidgets(prev => [...prev, newWidget]);
    toast({
      title: "Widget Added",
      description: `${template.title} has been added to your dashboard.`
    });
  };

  const handleMoveWidget = (id: string, position: { x: number; y: number }) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, position } : w
    ));
  };

  const handleResizeWidget = (id: string, size: { width: number; height: number }) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, size } : w
    ));
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Widget Removed",
      description: "Widget has been removed from your dashboard."
    });
  };

  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: HomeDashboardLayout) => {
      const method = layout.id ? 'PATCH' : 'POST';
      const url = layout.id ? `/api/home-dashboard-layouts/${layout.id}` : '/api/home-dashboard-layouts';
      const response = await apiRequest(method, url, layout);
      return response as HomeDashboardLayout;
    },
    onSuccess: (savedLayout) => {
      if (onLayoutUpdate) {
        onLayoutUpdate(savedLayout);
      }
      setIsEditing(false);
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard layout has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/home-dashboard-layouts'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save dashboard layout. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    const layout: HomeDashboardLayout = {
      ...currentLayout,
      name: layoutName,
      widgets,
      userId: currentLayout?.userId || 0,
      isDefault: currentLayout?.isDefault || false
    };

    saveLayoutMutation.mutate(layout);
  };

  const handleDrop = (item: any, position: { x: number; y: number }) => {
    if (item.templateId) {
      // Adding new widget from template
      const template = WIDGET_TEMPLATES.find(t => t.id === item.templateId);
      if (template) {
        handleAddWidget(template, position);
      }
    } else if (item.id) {
      // Moving existing widget
      handleMoveWidget(item.id, position);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Customize Home Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-[70vh]">
          {/* Widget Palette */}
          <div className="w-80 border-r pr-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Widget Library</h3>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Done" : "Edit"}
              </Button>
            </div>
            
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {WIDGET_TEMPLATES.map((template) => (
                  <WidgetTemplate
                    key={template.id}
                    template={template}
                    disabled={!isEditing}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Dashboard Canvas */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Dashboard Name:</label>
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={!isEditing}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveLayoutMutation.isPending}
                >
                  Save Layout
                </Button>
              </div>
            </div>

            <DndProvider backend={HTML5Backend}>
              <DropZone onDrop={handleDrop} isEditing={isEditing}>
                {widgets.map((widget) => (
                  <DraggableWidget
                    key={widget.id}
                    widget={widget}
                    onMove={handleMoveWidget}
                    onResize={handleResizeWidget}
                    onDelete={handleDeleteWidget}
                    isEditing={isEditing}
                  />
                ))}
                
                {widgets.length === 0 && isEditing && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Grid3x3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Drag widgets from the library to start building your dashboard</p>
                    </div>
                  </div>
                )}
              </DropZone>
            </DndProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WidgetTemplateProps {
  template: typeof WIDGET_TEMPLATES[0];
  disabled: boolean;
}

function WidgetTemplate({ template, disabled }: WidgetTemplateProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'template',
    item: { templateId: template.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !disabled
  });

  const Icon = template.icon;

  return (
    <Card
      ref={drag}
      className={`p-3 cursor-pointer transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{template.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {template.description}
          </p>
          <Badge variant="outline" className="mt-2 text-xs">
            {template.type}
          </Badge>
        </div>
      </div>
    </Card>
  );
}