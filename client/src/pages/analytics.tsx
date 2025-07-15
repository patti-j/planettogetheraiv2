import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Sparkles, Settings, Plus, Maximize2, Minimize2, Eye, EyeOff, X, Move } from "lucide-react";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
import AnalyticsWidget from "@/components/analytics-widget";
import type { Job, Operation, Resource } from "@shared/schema";

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

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

export default function Analytics() {
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const [layoutMode] = useState<"grid" | "free">("free");
  const [showCustomWidgets] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Standard widgets state
  const [standardWidgets, setStandardWidgets] = useState<AnalyticsWidget[]>([
    {
      id: "active-jobs",
      title: "Active Jobs",
      type: "metric",
      data: { icon: "BarChart3", description: "Currently in production" },
      visible: true,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "resource-utilization",
      title: "Resource Utilization",
      type: "metric",
      data: { icon: "TrendingUp", description: "Operations assigned to resources" },
      visible: true,
      position: { x: 320, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "overdue-jobs",
      title: "Overdue Jobs",
      type: "metric",
      data: { icon: "AlertTriangle", description: "Past due date" },
      visible: true,
      position: { x: 640, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "total-operations",
      title: "Total Operations",
      type: "metric",
      data: { icon: "CheckCircle", description: "All operations" },
      visible: true,
      position: { x: 960, y: 0 },
      size: { width: 300, height: 150 },
      config: {},
      isStandard: true
    },
    {
      id: "jobs-by-status",
      title: "Jobs by Status",
      type: "table",
      data: {},
      visible: true,
      position: { x: 0, y: 180 },
      size: { width: 400, height: 300 },
      config: {},
      isStandard: true
    },
    {
      id: "operations-by-status",
      title: "Operations by Status",
      type: "table",
      data: {},
      visible: true,
      position: { x: 420, y: 180 },
      size: { width: 400, height: 300 },
      config: {},
      isStandard: true
    },
    {
      id: "resources-by-status",
      title: "Resources by Status",
      type: "table",
      data: {},
      visible: true,
      position: { x: 840, y: 180 },
      size: { width: 400, height: 300 },
      config: {},
      isStandard: true
    },
    {
      id: "overdue-jobs-list",
      title: "Overdue Jobs List",
      type: "table",
      data: {},
      visible: true,
      position: { x: 0, y: 500 },
      size: { width: 800, height: 300 },
      config: {},
      isStandard: true
    }
  ]);

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const getJobsByStatus = () => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getOperationsByStatus = () => {
    const statusCounts = operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourcesByStatus = () => {
    const statusCounts = resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourceUtilization = () => {
    const assigned = operations.filter(op => op.assignedResourceId).length;
    const total = operations.length;
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  };

  const getOverdueJobs = () => {
    const now = new Date();
    return jobs.filter(job => new Date(job.dueDate) < now && job.status !== 'completed');
  };

  const jobsByStatus = getJobsByStatus();
  const operationsByStatus = getOperationsByStatus();
  const resourcesByStatus = getResourcesByStatus();
  const resourceUtilization = getResourceUtilization();
  const overdueJobs = getOverdueJobs();

  const handleWidgetCreate = (widget: AnalyticsWidget) => {
    setCustomWidgets(prev => [...prev, widget]);
  };

  const handleWidgetUpdate = (widgets: AnalyticsWidget[]) => {
    setCustomWidgets(widgets);
  };

  const handleWidgetToggle = (id: string) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      ));
    }
  };

  const handleWidgetRemove = (id: string) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, visible: false } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.filter(widget => widget.id !== id));
    }
  };

  const handleWidgetEdit = (id: string) => {
    // Open analytics manager with the specific widget for editing
    const widget = customWidgets.find(w => w.id === id);
    if (widget) {
      setAiAnalyticsOpen(true);
      // Could add state to focus on specific widget in manager
    }
  };

  const handleAddManualWidget = () => {
    const newWidget: AnalyticsWidget = {
      id: Date.now().toString(),
      title: "New Analytics Widget",
      type: "metric",
      data: { value: 0, label: "New Metric" },
      visible: true,
      position: { x: 20, y: 20 },
      size: { width: 300, height: 200 },
      config: {}
    };
    setCustomWidgets(prev => [...prev, newWidget]);
  };

  const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, size } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, size } : widget
      ));
    }
  };

  const handleWidgetPositionChange = (id: string, position: { x: number; y: number }) => {
    const standardWidget = standardWidgets.find(w => w.id === id);
    if (standardWidget) {
      setStandardWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      ));
    } else {
      setCustomWidgets(prev => prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      ));
    }
  };

  // Component to render standard widgets as draggable items
  const StandardWidget = ({ widget, onToggle, onRemove, onMove, onResize }: {
    widget: AnalyticsWidget;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onMove: (id: string, position: { x: number; y: number }) => void;
    onResize: (id: string, size: { width: number; height: number }) => void;
  }) => {
    const getIconComponent = (iconName: string) => {
      switch (iconName) {
        case "BarChart3": return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
        case "TrendingUp": return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
        case "AlertTriangle": return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
        case "CheckCircle": return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
        default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
      }
    };

    const getMetricValue = (widgetId: string) => {
      switch (widgetId) {
        case "active-jobs": return metrics?.activeJobs || 0;
        case "resource-utilization": return `${resourceUtilization}%`;
        case "overdue-jobs": return overdueJobs.length;
        case "total-operations": return operations.length;
        default: return 0;
      }
    };

    const getTableData = (widgetId: string) => {
      switch (widgetId) {
        case "jobs-by-status": return jobsByStatus;
        case "operations-by-status": return operationsByStatus;
        case "resources-by-status": return resourcesByStatus;
        case "overdue-jobs-list": return overdueJobs;
        default: return {};
      }
    };

    if (!widget.visible) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: widget.position.x,
          top: widget.position.y,
          width: widget.size.width,
          height: widget.size.height,
          cursor: 'move'
        }}
        onMouseDown={(e) => {
          const startX = e.clientX - widget.position.x;
          const startY = e.clientY - widget.position.y;
          
          const handleMouseMove = (e: MouseEvent) => {
            onMove(widget.id, {
              x: e.clientX - startX,
              y: e.clientY - startY
            });
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Move className="h-4 w-4 text-gray-400" />
              {widget.title}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(widget.id);
                }}
                className="h-6 w-6 p-0"
              >
                {widget.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(widget.id);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
              {widget.type === "metric" && widget.data.icon && getIconComponent(widget.data.icon)}
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto">
            {widget.type === "metric" ? (
              <div>
                <div className="text-2xl font-bold">{getMetricValue(widget.id)}</div>
                <p className="text-xs text-muted-foreground">
                  {widget.data.description}
                </p>
              </div>
            ) : widget.type === "table" ? (
              <div className="space-y-2">
                {widget.id === "overdue-jobs-list" ? (
                  overdueJobs.length > 0 ? (
                    overdueJobs.map((job) => (
                      <div key={job.id} className="p-2 bg-red-50 rounded">
                        <p className="font-medium text-red-900 text-sm">{job.name}</p>
                        <p className="text-xs text-red-700">Due: {new Date(job.dueDate).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No overdue jobs</p>
                  )
                ) : (
                  Object.entries(getTableData(widget.id)).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {key}
                      </Badge>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  };

  const PageContent = () => (
    <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
              <p className="text-gray-600 mt-1">Production performance insights</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2 md:gap-2">
              <Button
                onClick={() => setAiAnalyticsOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Analytics
              </Button>
              <Button
                className="bg-primary hover:bg-blue-700 text-white whitespace-nowrap"
                size="sm"
                onClick={handleAddManualWidget}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Analytic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
                className="whitespace-nowrap hidden sm:flex"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Analytics Dashboard - Free Form Layout */}
          <div className="relative" style={{ minHeight: '1000px' }}>
            {/* Standard Widgets */}
            {standardWidgets.map((widget) => (
              <StandardWidget
                key={widget.id}
                widget={widget}
                onToggle={handleWidgetToggle}
                onRemove={handleWidgetRemove}
                onMove={handleWidgetPositionChange}
                onResize={handleWidgetResize}
              />
            ))}

            {/* Custom Analytics Widgets */}
            {showCustomWidgets && customWidgets.map((widget) => (
              <AnalyticsWidget
                key={widget.id}
                widget={widget}
                onToggle={handleWidgetToggle}
                onRemove={handleWidgetRemove}
                onEdit={handleWidgetEdit}
                onPositionChange={handleWidgetPositionChange}
                onResize={handleWidgetResize}
                jobs={jobs}
                operations={operations}
                resources={resources}
                metrics={metrics}
                layoutMode={layoutMode}
              />
            ))}
          </div>

          {/* Legacy Grid Layout - Hidden */}
          <div className="hidden">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in production
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resourceUtilization}%</div>
                <p className="text-xs text-muted-foreground">
                  Operations assigned to resources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operations.length}</div>
                <p className="text-xs text-muted-foreground">
                  All operations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdowns */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jobs by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(jobsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(jobsByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No jobs available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operations by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(operationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(operationsByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No operations available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resources by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(resourcesByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(resourcesByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No resources available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Jobs */}
          {overdueJobs.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Overdue Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{job.name}</p>
                        <p className="text-sm text-red-600">Customer: {job.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Due: {new Date(job.dueDate).toLocaleDateString()}
                        </p>
                        <Badge className="bg-red-100 text-red-800 capitalize">
                          {job.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </main>
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <PageContent />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <PageContent />
      
      {/* AI Analytics Manager */}
      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        onWidgetCreate={handleWidgetCreate}
        currentWidgets={customWidgets}
        onWidgetUpdate={handleWidgetUpdate}
      />
    </div>
  );
}