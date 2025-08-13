import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Settings,
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
  DollarSign,
  ArrowRight,
  Bell,
  RefreshCw,
  Plus
} from 'lucide-react';
import { HomeDashboardCustomizer, DashboardWidget, HomeDashboardLayout } from './home-dashboard-customizer';

interface CustomizableHomeDashboardProps {
  className?: string;
}

// Draggable Widget Component for the main dashboard
interface DashboardWidgetProps {
  widget: DashboardWidget;
  onMove: (id: string, position: { x: number; y: number }) => void;
  isEditing?: boolean;
}

function DraggableWidget({ widget, onMove, isEditing = false }: DashboardWidgetProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'dashboard-widget',
    item: { id: widget.id, position: widget.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditing,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ position: { x: number; y: number } }>();
      if (dropResult && monitor.didDrop()) {
        onMove(item.id, dropResult.position);
      }
    }
  });
  
  return (
    <Card
      ref={drag}
      className={`absolute transition-all ${isDragging ? 'opacity-50 z-50' : ''} ${
        isEditing ? 'border-blue-500 cursor-move hover:border-blue-600' : ''
      }`}
      style={{
        left: widget.position?.x || 0,
        top: widget.position?.y || 0,
        width: widget.size?.width || 200,
        height: widget.size?.height || 150,
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {widget.title}
          {isEditing && (
            <Badge variant="secondary" className="text-xs">
              Drag me
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <RenderWidget widget={widget} />
      </CardContent>
    </Card>
  );
}

// Component to render widget content based on type
function RenderWidget({ widget }: { widget: DashboardWidget }) {
  const commonProps = { widget };
  
  switch (widget.type) {
    case 'metric':
      return <MetricWidget {...commonProps} />;
    case 'chart':
      return <ChartWidget {...commonProps} />;
    case 'quick-links':
      return <QuickLinksWidget {...commonProps} />;
    case 'recent-activity':
      return <RecentActivityWidget {...commonProps} />;
    case 'alerts':
      return <AlertsWidget {...commonProps} />;
    default:
      return (
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Widget type "{widget.type}" not implemented yet</p>
        </div>
      );
  }
}

// Drop Zone Component for the dashboard
interface DashboardDropZoneProps {
  children: React.ReactNode;
  onDrop: (item: any, position: { x: number; y: number }) => void;
  isEditing: boolean;
}

function DashboardDropZone({ children, onDrop, isEditing }: DashboardDropZoneProps) {
  const GRID_SIZE = 20;
  
  const [{ isOver }, drop] = useDrop({
    accept: 'dashboard-widget',
    drop: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const targetRef = drop as any;
      
      if (clientOffset && targetRef?.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const position = {
          x: Math.max(0, Math.round((clientOffset.x - rect.left) / GRID_SIZE) * GRID_SIZE),
          y: Math.max(0, Math.round((clientOffset.y - rect.top) / GRID_SIZE) * GRID_SIZE)
        };
        
        return { position };
      }
      return {};
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
        isEditing ? 'border-2 border-dashed border-gray-300 bg-gray-50/10' : ''
      } ${isOver ? 'border-blue-500 bg-blue-50/20' : ''}`}
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

// Widget renderers for different widget types
function MetricWidget({ widget }: { widget: DashboardWidget }) {
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/production-orders'],
    refetchInterval: 60000
  });

  const { data: operations } = useQuery({
    queryKey: ['/api/operations'],
    refetchInterval: 60000
  });

  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    refetchInterval: 60000
  });

  // Calculate metrics based on widget config
  const getMetricValue = (metric: string) => {
    switch (metric) {
      case 'active_orders':
        return Array.isArray(productionOrders) ? productionOrders.filter((order: any) => order.status === 'in_progress').length : 0;
      case 'completed_today':
        return Array.isArray(productionOrders) ? productionOrders.filter((order: any) => {
          const completedDate = new Date(order.actualCompletionDate);
          const today = new Date();
          return order.status === 'completed' && 
                 completedDate.toDateString() === today.toDateString();
        }).length : 0;
      case 'efficiency':
        return Array.isArray(resources) ? Math.round((resources.filter((r: any) => r.currentStatus === 'busy').length / resources.length) * 100) : 0;
      case 'on_time_delivery':
        return Math.round(Math.random() * 20 + 80); // Mock data
      case 'schedule_adherence':
        return Math.round(Math.random() * 15 + 85); // Mock data
      case 'cycle_time':
        return Math.round(Math.random() * 5 + 15); // Mock data
      default:
        return 0;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'active_orders': return Factory;
      case 'completed_today': return CheckCircle;
      case 'efficiency': return TrendingUp;
      case 'on_time_delivery': return Target;
      case 'schedule_adherence': return Clock;
      case 'cycle_time': return Activity;
      default: return BarChart3;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'active_orders': return 'Active Orders';
      case 'completed_today': return 'Completed Today';
      case 'efficiency': return 'Efficiency';
      case 'on_time_delivery': return 'On-Time Delivery';
      case 'schedule_adherence': return 'Schedule Adherence';
      case 'cycle_time': return 'Avg Cycle Time';
      default: return metric;
    }
  };

  const metrics = widget.config?.metrics || ['active_orders', 'completed_today', 'efficiency'];

  return (
    <div className="grid grid-cols-1 gap-3">
      {metrics.map((metric: string) => {
        const Icon = getMetricIcon(metric);
        const value = getMetricValue(metric);
        const isPercentage = ['efficiency', 'on_time_delivery', 'schedule_adherence'].includes(metric);
        
        return (
          <div key={metric} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{getMetricLabel(metric)}</span>
            </div>
            <Badge variant="secondary">
              {value}{isPercentage ? '%' : ''}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function ChartWidget({ widget }: { widget: DashboardWidget }) {
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/production-orders'],
    refetchInterval: 60000
  });

  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    refetchInterval: 60000
  });

  // Mock chart data based on widget config
  const getChartData = () => {
    if (widget.config?.dataSource === 'production_orders' && Array.isArray(productionOrders)) {
      const statusCounts = productionOrders.reduce((acc: Record<string, number>, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(statusCounts).map(([status, count]) => ({
        label: status.replace('_', ' ').toUpperCase(),
        value: count
      }));
    }

    if (widget.config?.dataSource === 'resources' && Array.isArray(resources)) {
      const typeCounts = resources.reduce((acc: Record<string, number>, resource: any) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(typeCounts).map(([type, count]) => ({
        label: type.replace('_', ' ').toUpperCase(),
        value: count
      }));
    }

    // Default mock data
    return [
      { label: 'In Progress', value: 12 },
      { label: 'Completed', value: 8 },
      { label: 'Pending', value: 5 },
      { label: 'Delayed', value: 2 }
    ];
  };

  const chartData = getChartData();
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => Number(d.value))) : 1;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {widget.config?.chartType || 'bar'} chart - {widget.config?.dataSource || 'mock data'}
      </div>
      {chartData.map((item, index) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{String(item.value)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(Number(item.value) / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickLinksWidget({ widget }: { widget: DashboardWidget }) {
  const [, setLocation] = useLocation();
  
  const defaultLinks = [
    { label: 'Production Schedule', href: '/production-schedule', icon: 'Calendar' },
    { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { label: 'Shop Floor', href: '/shop-floor', icon: 'Factory' },
    { label: 'Reports', href: '/reports', icon: 'FileText' }
  ];

  const links = widget.config?.links || defaultLinks;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar': return Calendar;
      case 'BarChart3': return BarChart3;
      case 'Factory': return Factory;
      case 'FileText': return Activity;
      default: return ArrowRight;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link: any, index: number) => {
        const Icon = getIcon(link.icon);
        
        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-auto p-3 flex flex-col items-center gap-2"
            onClick={() => setLocation(link.href)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs text-center">{link.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function RecentActivityWidget({ widget }: { widget: DashboardWidget }) {
  const { data: operations } = useQuery({
    queryKey: ['/api/operations'],
    refetchInterval: 60000
  });

  // Mock recent activities
  const activities = [
    { id: 1, type: 'operation', message: 'Operation "Mixing" completed', time: '5 min ago' },
    { id: 2, type: 'order', message: 'New production order created', time: '12 min ago' },
    { id: 3, type: 'resource', message: 'Resource "Line A" back online', time: '18 min ago' },
    { id: 4, type: 'alert', message: 'Maintenance reminder due', time: '25 min ago' },
    { id: 5, type: 'optimization', message: 'Schedule optimization completed', time: '32 min ago' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'operation': return Activity;
      case 'order': return Package;
      case 'resource': return Factory;
      case 'alert': return AlertTriangle;
      case 'optimization': return TrendingUp;
      default: return Clock;
    }
  };

  const limit = widget.config?.limit || 5;

  return (
    <div className="space-y-3">
      {activities.slice(0, limit).map((activity) => {
        const Icon = getActivityIcon(activity.type);
        
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-0.5 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.message}</p>
              {widget.config?.showTimestamps && (
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertsWidget({ widget }: { widget: DashboardWidget }) {
  // Mock alerts data
  const alerts = [
    { id: 1, severity: 'high', message: 'Machine maintenance overdue', time: '2 hours ago' },
    { id: 2, severity: 'medium', message: 'Low inventory warning', time: '4 hours ago' },
    { id: 3, severity: 'low', message: 'Schedule update available', time: '1 day ago' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const allowedSeverities = widget.config?.severity || ['high', 'medium', 'low'];
  const filteredAlerts = alerts.filter(alert => allowedSeverities.includes(alert.severity));
  const limit = widget.config?.limit || 5;

  return (
    <div className="space-y-3">
      {filteredAlerts.slice(0, limit).map((alert) => (
        <div key={alert.id} className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
              <span className="text-xs text-muted-foreground">{alert.time}</span>
            </div>
            <p className="text-sm mt-1">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderWidget(widget: DashboardWidget) {
  const commonProps = { widget };
  
  switch (widget.type) {
    case 'metric':
      return <MetricWidget {...commonProps} />;
    case 'chart':
      return <ChartWidget {...commonProps} />;
    case 'quick-links':
      return <QuickLinksWidget {...commonProps} />;
    case 'recent-activity':
      return <RecentActivityWidget {...commonProps} />;
    case 'alerts':
      return <AlertsWidget {...commonProps} />;
    default:
      return (
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Widget type "{widget.type}" not implemented yet</p>
        </div>
      );
  }
}

export function CustomizableHomeDashboard({ className }: CustomizableHomeDashboardProps) {
  const { user } = useAuth();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<HomeDashboardLayout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load user's dashboard layout
  const { data: layouts = [] } = useQuery({
    queryKey: ['/api/home-layouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/home-layouts?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch layouts');
      return response.json();
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (layouts.length > 0 && !currentLayout) {
      // Find default layout or use the first one
      const defaultLayout = layouts.find((l: HomeDashboardLayout) => l.isDefault) || layouts[0];
      setCurrentLayout(defaultLayout);
    } else if (user?.id && !currentLayout && layouts.length === 0) {
      // Create default layout only if we have no layouts and no current layout
      const defaultLayout: HomeDashboardLayout = {
        userId: user.id,
        name: 'Default Dashboard',
        isDefault: true,
        widgets: [
          {
            id: 'default-metrics',
            type: 'metric',
            title: 'Production Metrics',
            position: { x: 20, y: 20 },
            size: { width: 300, height: 200 },
            config: { metrics: ['active_orders', 'completed_today', 'efficiency'] },
            visible: true
          },
          {
            id: 'default-quick-links',
            type: 'quick-links',
            title: 'Quick Actions',
            position: { x: 340, y: 20 },
            size: { width: 300, height: 200 },
            config: {},
            visible: true
          },
          {
            id: 'default-activity',
            type: 'recent-activity',
            title: 'Recent Activity',
            position: { x: 20, y: 240 },
            size: { width: 350, height: 300 },
            config: { limit: 5, showTimestamps: true },
            visible: true
          }
        ]
      };
      setCurrentLayout(defaultLayout);
    }
  }, [layouts.length, user?.id]);

  const handleLayoutUpdate = (updatedLayout: HomeDashboardLayout) => {
    setCurrentLayout(updatedLayout);
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleWidgetMove = (id: string, position: { x: number; y: number }) => {
    if (!currentLayout) return;
    
    const updatedWidgets = currentLayout.widgets.map(widget =>
      widget.id === id ? { ...widget, position } : widget
    );
    
    const updatedLayout = { ...currentLayout, widgets: updatedWidgets };
    setCurrentLayout(updatedLayout);
  };

  const handleDropOnDashboard = (item: any, position: { x: number; y: number }) => {
    // Handle drop events on the dashboard drop zone
    console.log('Drop on dashboard:', item, position);
  };

  if (!currentLayout || !user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{currentLayout.name}</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName || user.username}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditMode ? 'Exit Edit' : 'Edit Layout'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizerOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardDropZone 
        onDrop={handleDropOnDashboard}
        isEditing={isEditMode}
      >
        {/* Render visible widgets */}
        {currentLayout.widgets
          .filter(widget => widget.visible)
          .map(widget => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              onMove={handleWidgetMove}
              isEditing={isEditMode}
            />
          ))}

        {currentLayout.widgets.filter(w => w.visible).length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No widgets configured</h3>
              <p className="mb-4">Add widgets to customize your dashboard</p>
              <Button onClick={() => setCustomizerOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Widgets
              </Button>
            </div>
          </div>
        )}
      </DashboardDropZone>

      {/* Dashboard Customizer */}
      <HomeDashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        currentLayout={currentLayout}
        onLayoutUpdate={handleLayoutUpdate}
      />
    </div>
  );
}