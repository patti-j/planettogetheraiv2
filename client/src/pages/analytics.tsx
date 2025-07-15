import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Plus, Maximize2, Minimize2, FolderOpen, Sparkles, Eye, EyeOff, ChevronDown, PlayCircle, PauseCircle, GripVertical } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
import EnhancedDashboardManager from "@/components/dashboard-manager-enhanced";
import AnalyticsWidget from "@/components/analytics-widget";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

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
  configuration: any; // Make this flexible to handle different structures
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

// Draggable Dashboard Card Component
interface DraggableDashboardCardProps {
  dashboard: DashboardConfig;
  index: number;
  onMove: (dragIndex: number, dropIndex: number) => void;
  generateWidgetData: () => any;
  isLivePaused: boolean;
  setDashboardManagerOpen: (open: boolean) => void;
}

function DraggableDashboardCard({ 
  dashboard, 
  index, 
  onMove, 
  generateWidgetData, 
  isLivePaused,
  setDashboardManagerOpen
}: DraggableDashboardCardProps) {
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem(`dashboard-size-${dashboard.id}`);
    return saved ? JSON.parse(saved) : { width: 600, height: 400 };
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: 'dashboard',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'dashboard',
    drop: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('e')) {
        newWidth = Math.max(300, startWidth + deltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(200, startHeight + deltaY);
      }
      
      const newSize = { width: newWidth, height: newHeight };
      setSize(newSize);
      localStorage.setItem(`dashboard-size-${dashboard.id}`, JSON.stringify(newSize));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`${isDragging ? 'opacity-50 scale-105' : ''} ${isOver ? 'ring-2 ring-blue-500' : ''} relative ${isResizing ? 'cursor-resizing' : 'cursor-move'} transition-all duration-200`}
      style={{ width: size.width, height: size.height }}
    >
      <Card className="border border-gray-200 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="cursor-move">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>{dashboard.name}</span>
                  {dashboard.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {dashboard.configuration?.customWidgets?.length || 0} widgets
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDashboardManagerOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {dashboard.configuration?.customWidgets?.length > 0 ? (
            <div className="relative h-full bg-gray-50 rounded-lg p-4 overflow-hidden">
              {dashboard.configuration.customWidgets.map((widget: AnalyticsWidget) => (
                <AnalyticsWidget
                  key={widget.id}
                  widget={widget}
                  onToggle={() => {}} // Read-only mode
                  onRemove={() => {}} // Read-only mode
                  onEdit={() => {}} // Read-only mode
                  onResize={() => {}} // Read-only mode
                  onMove={() => {}} // Read-only mode
                  data={generateWidgetData()}
                  readOnly={true}
                />
              ))}
              <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {isLivePaused ? "Live View • Paused" : "Live View • Updates every 30s"}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center">
              <div>
                <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No widgets configured for this dashboard</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Resize handles */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400 hover:bg-gray-600 opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResize(e, 'se')}
        title="Resize diagonally"
      />
      <div 
        className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize bg-gray-400 hover:bg-gray-600 opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResize(e, 's')}
        title="Resize height"
      />
      <div 
        className="absolute top-2 bottom-2 right-0 w-1 cursor-e-resize bg-gray-400 hover:bg-gray-600 opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResize(e, 'e')}
        title="Resize width"
      />
    </div>
  );
}

export default function Analytics() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [visibleDashboards, setVisibleDashboards] = useState<Set<number>>(new Set());
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [dashboardOrder, setDashboardOrder] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  const { data: dashboards = [] } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  // Initialize dashboard order when dashboards are loaded
  useEffect(() => {
    if (dashboards.length > 0 && dashboardOrder.length === 0) {
      // Try to load saved order from localStorage first
      const savedOrder = localStorage.getItem('dashboardOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          // Filter to only include dashboards that still exist
          const validOrder = parsedOrder.filter((id: number) => 
            dashboards.some(d => d.id === id)
          );
          // Add any new dashboards that aren't in the saved order
          const newDashboards = dashboards.filter(d => !validOrder.includes(d.id));
          setDashboardOrder([...validOrder, ...newDashboards.map(d => d.id)]);
        } catch (error) {
          // If parsing fails, use default order
          setDashboardOrder(dashboards.map(d => d.id));
        }
      } else {
        setDashboardOrder(dashboards.map(d => d.id));
      }
    }
  }, [dashboards, dashboardOrder.length]);

  // Handle dashboard reordering
  const handleDashboardMove = (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;
    
    const newOrder = [...dashboardOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setDashboardOrder(newOrder);
    
    // Store the new order in localStorage for persistence
    localStorage.setItem('dashboardOrder', JSON.stringify(newOrder));
    
    // Show success feedback
    toast({
      title: "Dashboard Order Saved",
      description: "Dashboard arrangement has been updated",
      duration: 2000,
    });
  };



  // Get ordered visible dashboards
  const getOrderedVisibleDashboards = () => {
    const visibleDashboardsArray = dashboards.filter(dashboard => 
      visibleDashboards.has(dashboard.id)
    );
    
    // Sort by the order array
    return visibleDashboardsArray.sort((a, b) => {
      const aIndex = dashboardOrder.indexOf(a.id);
      const bIndex = dashboardOrder.indexOf(b.id);
      return aIndex - bIndex;
    });
  };



  // Dashboard management mutations
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      });
    },
    onError: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      });
    },
    onError: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  // Fetch live data for widgets
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: visibleDashboards.size > 0,
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
    enabled: visibleDashboards.size > 0,
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    enabled: visibleDashboards.size > 0,
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
    enabled: visibleDashboards.size > 0,
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
    enabled: visibleDashboards.size > 0,
  });











  const handleToggleDashboardVisibility = (dashboardId: number) => {
    setVisibleDashboards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dashboardId)) {
        newSet.delete(dashboardId);
      } else {
        newSet.add(dashboardId);
      }
      return newSet;
    });
  };



  const visibleDashboardConfigs = getOrderedVisibleDashboards();

  const generateWidgetData = () => ({
    jobs,
    operations,
    resources,
    metrics,
    overdueJobs: jobs.filter(job => new Date(job.dueDate) < new Date() && job.status !== 'completed'),
    resourceUtilization: operations.length > 0 ? (operations.filter(op => op.assignedResourceId).length / operations.length * 100) : 0,
    jobsByStatus: jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    operationsByStatus: operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    resourcesByStatus: resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  const PageContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {/* Live Dashboard Widgets */}
        {visibleDashboardConfigs.length > 0 && (
          <DndProvider backend={HTML5Backend}>
            <div className="flex flex-wrap gap-6 min-h-[200px]">
              {visibleDashboardConfigs.map((dashboard, index) => (
                <DraggableDashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  index={index}
                  onMove={handleDashboardMove}
                  generateWidgetData={generateWidgetData}
                  isLivePaused={isLivePaused}
                  setDashboardManagerOpen={setDashboardManagerOpen}
                />
              ))}
            </div>
          </DndProvider>
        )}

        {/* Empty State */}
        {visibleDashboards.size === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Dashboards Selected</h3>
              <p className="text-sm">
                Select one or more dashboards from the dropdown above to view their live widgets.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
              <p className="text-gray-600">Manage and view dashboard configurations</p>
            </div>
            
            {/* Live indicator in top right */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLivePaused(!isLivePaused)}
                className="flex items-center gap-2 hover:bg-gray-100 text-sm"
              >
                {isLivePaused ? (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Paused</span>
                    <PlayCircle className="w-4 h-4 text-gray-600" />
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                    <PauseCircle className="w-4 h-4 text-green-600" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[160px] justify-between text-sm"
                >
                  <span>
                    {visibleDashboards.size === 0 
                      ? "Select Dashboards" 
                      : `${visibleDashboards.size} Selected`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Dashboards to Display:</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dashboards.map((dashboard) => (
                      <div key={dashboard.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`header-dashboard-${dashboard.id}`}
                          checked={visibleDashboards.has(dashboard.id)}
                          onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                        />
                        <label
                          htmlFor={`header-dashboard-${dashboard.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
                        >
                          {dashboard.name}
                          {dashboard.isDefault && (
                            <Badge variant="secondary" className="text-xs px-1">Default</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setDashboardManagerOpen(true)}
                className="flex items-center gap-2 text-sm"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiAnalyticsOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
              >
                <Sparkles className="h-4 w-4" />
                AI Analytics
              </Button>
            </div>

            {!isMobile && (
              <div className="flex items-center ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="flex items-center gap-2 text-sm"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isMaximized ? (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Analytics - Maximized</h1>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 min-w-[160px] justify-between"
                      >
                        <span>
                          {visibleDashboards.size === 0 
                            ? "Select Dashboards" 
                            : `${visibleDashboards.size} Selected`}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Dashboards to Display:</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dashboards.map((dashboard) => (
                            <div key={dashboard.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`max-dashboard-${dashboard.id}`}
                                checked={visibleDashboards.has(dashboard.id)}
                                onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                              />
                              <label
                                htmlFor={`max-dashboard-${dashboard.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
                              >
                                {dashboard.name}
                                {dashboard.isDefault && (
                                  <Badge variant="secondary" className="text-xs px-1">Default</Badge>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="outline"
                    onClick={() => setDashboardManagerOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAiAnalyticsOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Analytics
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLivePaused(!isLivePaused)}
                    className="flex items-center gap-2 hover:bg-gray-100"
                  >
                    {isLivePaused ? (
                      <>
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-medium">Paused</span>
                        <PlayCircle className="w-4 h-4 text-gray-600" />
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">Live</span>
                        <PauseCircle className="w-4 h-4 text-green-600" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsMaximized(false)}
                    className="flex items-center gap-2"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Minimize
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PageContent />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PageContent />
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedDashboardManager
        open={dashboardManagerOpen}
        onOpenChange={setDashboardManagerOpen}
        dashboards={dashboards}
        currentDashboard={null}
        onDashboardSelect={() => {}}
        onDashboardCreate={(dashboard) => {
          createDashboardMutation.mutate(dashboard);
        }}
        onDashboardUpdate={(dashboard) => {
          updateDashboardMutation.mutate({ id: dashboard.id, data: dashboard });
        }}
        onDashboardDelete={(dashboardId) => {
          deleteDashboardMutation.mutate(dashboardId);
        }}
        standardWidgets={[]}
        customWidgets={[]}
      />

      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
      />
    </>
  );
}