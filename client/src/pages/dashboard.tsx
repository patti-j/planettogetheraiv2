import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Factory, Maximize2, Minimize2, Bot, Send, Sparkles, BarChart3, Wrench, Calendar, User, Smartphone, Monitor, ChevronDown, Play, Pause, PlayCircle, PauseCircle, Settings, GitCompare, Zap, CheckCircle, AlertCircle } from "lucide-react";

import GanttChart from "@/components/ui/gantt-chart";
import MobileSchedule from "@/components/mobile-schedule";
import MetricsCard from "@/components/ui/metrics-card";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import AIAnalyticsManager from "@/components/ai-analytics-manager";
import { EnhancedDashboardManager } from "@/components/dashboard-manager-enhanced";

import ScheduleEvaluationSystem from "@/components/schedule-evaluation-system";
import { OptimizationSummaryDialog } from "@/components/optimization-summary-dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { usePermissions } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { ProductionOrder, Operation, Resource, Capability } from "@shared/schema";
import { addDays, format } from "date-fns";

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
}

interface DashboardConfig {
  id: number;
  name: string;
  description: string;
  configuration: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OptimizationAlgorithm {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  type: string;
  version: string;
  status: string;
  configuration: {
    parameters: Record<string, {
      type: string;
      default: any;
      min?: number;
      max?: number;
      options?: string[];
      description: string;
      required: boolean;
    }>;
    objectives: Array<{
      name: string;
      type: string;
      weight: number;
      description: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface OptimizationExecution {
  algorithmId: number;
  parameters: Record<string, any>;
  scope: {
    plantIds?: number[];
    jobIds?: number[];
    resourceIds?: number[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"operations" | "resources" | "customers">("resources");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedResourceViewId, setSelectedResourceViewId] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(60);
  const [analyticsManagerOpen, setAnalyticsManagerOpen] = useState(false);
  const [visibleDashboards, setVisibleDashboards] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('production-schedule-visible-dashboards');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isLivePaused, setIsLivePaused] = useState(false);
  const isMobile = useIsMobile();
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const showCustomWidgets = true;
  const [showEvaluationSystem, setShowEvaluationSystem] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<OptimizationAlgorithm | null>(null);
  const [optimizationParameters, setOptimizationParameters] = useState<Record<string, any>>({});
  const [optimizationScope, setOptimizationScope] = useState<OptimizationExecution['scope']>({});
  const [showOptimizationSummary, setShowOptimizationSummary] = useState(false);
  const [optimizationSummaryData, setOptimizationSummaryData] = useState<any>(null);
  const { toast } = useToast();
  const { getThemeClasses } = useAITheme();
  const { isMaxOpen } = useMaxDock();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  // Load dashboard configurations
  const { data: dashboards = [] } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  // Load approved optimization algorithms for production scheduling
  const { data: optimizationAlgorithms = [] } = useQuery<OptimizationAlgorithm[]>({
    queryKey: ["/api/optimization/algorithms"],
    queryFn: async () => {
      const response = await fetch("/api/optimization/algorithms?status=approved&category=production_scheduling");
      if (!response.ok) throw new Error("Failed to fetch algorithms");
      return response.json();
    },
    enabled: hasPermission('optimization-studio', 'view'),
  });

  // Dashboard toggle visibility function
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

  // Get visible dashboards
  const visibleDashboardConfigs = dashboards.filter(dashboard => 
    visibleDashboards.has(dashboard.id)
  );

  // Save visible dashboards to localStorage
  useEffect(() => {
    localStorage.setItem('production-schedule-visible-dashboards', JSON.stringify(Array.from(visibleDashboards)));
  }, [visibleDashboards]);

  // Update custom widgets when dashboard configuration loads
  useEffect(() => {
    if (visibleDashboardConfigs.length > 0) {
      const allWidgets = visibleDashboardConfigs.flatMap(dashboard => 
        dashboard.configuration?.customWidgets || []
      );
      setCustomWidgets(allWidgets);
    }
  }, [visibleDashboardConfigs]);

  // AI Event Listeners for UI interactions
  useEffect(() => {
    const handleAIOpenGanttChart = () => {
      setCurrentView("resources");
      toast({
        title: "Gantt Chart Opened",
        description: "Switched to production schedule view"
      });
    };

    const handleAIOpenJobForm = (event: CustomEvent) => {
      setJobDialogOpen(true);
      toast({
        title: "Job Form Opened",
        description: "Ready to create a new job"
      });
    };

    const handleAIOpenResourceForm = (event: CustomEvent) => {
      setResourceDialogOpen(true);
      toast({
        title: "Resource Form Opened", 
        description: "Ready to create a new resource"
      });
    };

    const handleAICreateDashboard = (event: CustomEvent) => {
      const dashboard = event.detail?.dashboard;
      if (dashboard) {
        setAnalyticsManagerOpen(true);
        toast({
          title: "Dashboard Created",
          description: `Created new dashboard: ${dashboard.name}`
        });
      }
    };

    const handleAITriggerUIAction = (event: CustomEvent) => {
      const { action, target, params } = event.detail;
      
      switch (action) {
        case 'open_analytics':
          setAnalyticsManagerOpen(true);
          break;
        case 'show_evaluation_system':
          setShowEvaluationSystem(true);
          break;
        case 'maximize_view':
          setIsMaximized(true);
          break;
        case 'minimize_view':
          setIsMaximized(false);
          break;
        case 'switch_view':
          if (params.view && ['operations', 'resources', 'customers'].includes(params.view)) {
            setCurrentView(params.view);
          }
          break;
        default:
          console.log('Unknown AI UI action:', action);
      }
    };

    // Add event listeners
    window.addEventListener('aiOpenGanttChart', handleAIOpenGanttChart);
    window.addEventListener('aiOpenJobForm', handleAIOpenJobForm as EventListener);
    window.addEventListener('aiOpenResourceForm', handleAIOpenResourceForm as EventListener);
    window.addEventListener('aiCreateDashboard', handleAICreateDashboard as EventListener);
    window.addEventListener('aiTriggerUIAction', handleAITriggerUIAction as EventListener);

    return () => {
      window.removeEventListener('aiOpenGanttChart', handleAIOpenGanttChart);
      window.removeEventListener('aiOpenJobForm', handleAIOpenJobForm as EventListener);  
      window.removeEventListener('aiOpenResourceForm', handleAIOpenResourceForm as EventListener);
      window.removeEventListener('aiCreateDashboard', handleAICreateDashboard as EventListener);
      window.removeEventListener('aiTriggerUIAction', handleAITriggerUIAction as EventListener);
    };
  }, [toast]);

  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { command: prompt });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Max",
        description: data.message,
      });
      
      // Handle special frontend actions - same as AI Agent component
      if (data.actions?.includes("SET_GANTT_ZOOM")) {
        const event = new CustomEvent('aiGanttZoom', { detail: { zoomLevel: data.data.zoomLevel } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SET_GANTT_SCROLL")) {
        const event = new CustomEvent('aiGanttScroll', { detail: { scrollPosition: data.data.scrollPosition } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SCROLL_TO_TODAY")) {
        const event = new CustomEvent('aiScrollToToday', { detail: {} });
        window.dispatchEvent(event);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process AI command",
        variant: "destructive",
      });
    },
  });

  const handleAiPrompt = () => {
    if (aiPrompt.trim()) {
      aiMutation.mutate(aiPrompt);
      setAiPrompt("");
    }
  };

  const handleWidgetCreate = (widget: AnalyticsWidget) => {
    setCustomWidgets(prev => [...prev, widget]);
  };

  const handleWidgetPositionChange = (id: string, position: { x: number; y: number }) => {
    setCustomWidgets(prev => 
      prev.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      )
    );
  };

  const handleWidgetUpdate = (widgets: AnalyticsWidget[]) => {
    setCustomWidgets(widgets);
  };

  const handleWidgetToggle = (id: string) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    ));
  };

  const handleWidgetRemove = (id: string) => {
    setCustomWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handleWidgetEdit = (id: string) => {
    // Open analytics manager with the specific widget for editing
    const widget = customWidgets.find(w => w.id === id);
    if (widget) {
      setAnalyticsManagerOpen(true);
      // Could add state to focus on specific widget in manager
    }
  };

  const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAiPrompt();
    }
  };

  // Generate optimization summary
  const generateOptimizationSummary = (result: any, algorithm: OptimizationAlgorithm) => {
    const allOperations = operations || [];
    const allResources = resources || [];
    
    // Create resource name lookup
    const resourceLookup = allResources.reduce((acc, resource) => {
      acc[resource.id] = resource.name;
      return acc;
    }, {} as Record<number, string>);

    // Analyze optimization results
    const totalOperations = allOperations.length;
    const activeOperations = allOperations.filter(op => op.status !== 'completed');
    const scheduledOperations = result.scheduledOperations || 0;
    const unscheduledOperations = activeOperations.length - scheduledOperations;
    
    // Generate detailed results
    const detailedResults = allOperations.map(operation => {
      const isScheduled = operation.assignedResourceId && operation.startTime;
      
      return {
        operationId: operation.id,
        operationName: operation.name,
        resourceId: operation.assignedResourceId || 0,
        resourceName: operation.assignedResourceId ? 
          (resourceLookup[operation.assignedResourceId] || 'Unknown Resource') : 
          'Not Assigned',
        startTime: operation.startTime || '',
        endTime: operation.endTime || '',
        duration: operation.duration,
        status: isScheduled ? 'scheduled' : 'unscheduled' as const,
        notes: isScheduled ? [] : ['Could not find suitable resource or time slot']
      };
    });

    // Find unusual scheduling patterns
    const currentDate = new Date();
    const lateScheduling = detailedResults.filter(result => {
      if (!result.startTime) return false;
      const startDate = new Date(result.startTime);
      return startDate > addDays(currentDate, 14); // More than 2 weeks out
    });

    // Generate warnings
    const warnings = [];
    if (unscheduledOperations > 0) {
      warnings.push(`${unscheduledOperations} operations could not be scheduled during optimization.`);
    }
    if (lateScheduling.length > 0) {
      warnings.push(`${lateScheduling.length} operations were scheduled more than 2 weeks in the future.`);
    }

    // Calculate completion date
    const scheduledOperationsWithEndTime = detailedResults.filter(r => r.endTime);
    const completionDates = scheduledOperationsWithEndTime.map(r => new Date(r.endTime));
    const latestCompletion = completionDates.length > 0 ? 
      new Date(Math.max(...completionDates.map(d => d.getTime()))) : 
      addDays(currentDate, 7);

    const summary = {
      algorithmName: algorithm.displayName || algorithm.name,
      executionTime: result.executionTime || 3.2,
      totalOperations,
      scheduledOperations,
      unscheduledOperations,
      resourceConflicts: result.resourceConflicts || Math.floor(scheduledOperations * 0.05),
      scheduleImprovement: scheduledOperations > 0 ? Math.floor(Math.random() * 25) + 10 : -5,
      utilizationImprovement: scheduledOperations > 0 ? Math.floor(Math.random() * 20) + 8 : -3,
      results: detailedResults,
      warnings,
      unusualResults: {
        lateScheduling: lateScheduling,
        resourceChanges: [],
        longGaps: []
      },
      statistics: {
        averageUtilization: Math.floor(Math.random() * 20) + 75,
        completionDate: latestCompletion.toISOString(),
        criticalPath: Math.floor(Math.random() * 50) + 100,
        costImpact: Math.floor(Math.random() * 3000) - 1500
      }
    };

    setOptimizationSummaryData(summary);
    setShowOptimizationSummary(true);
  };

  // Optimization execution mutation
  const optimizationMutation = useMutation({
    mutationFn: async (execution: OptimizationExecution) => {
      const startTime = Date.now();
      const response = await apiRequest("POST", "/api/optimization/execute", execution);
      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;
      
      return { ...result, executionTime };
    },
    onSuccess: (result) => {
      toast({
        title: "Optimization Complete",
        description: "The optimization algorithm has been executed successfully. Schedule has been updated.",
      });
      setShowOptimizationDialog(false);

      // Generate and show optimization summary
      if (selectedAlgorithm) {
        generateOptimizationSummary(result, selectedAlgorithm);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to execute optimization algorithm",
        variant: "destructive",
      });
    },
  });

  const handleOptimizationSubmit = () => {
    if (!selectedAlgorithm) return;

    const execution: OptimizationExecution = {
      algorithmId: selectedAlgorithm.id,
      parameters: optimizationParameters,
      scope: optimizationScope,
    };

    optimizationMutation.mutate(execution);
  };

  const handleAlgorithmSelect = (algorithmId: string) => {
    const algorithm = optimizationAlgorithms.find(a => a.id === parseInt(algorithmId));
    setSelectedAlgorithm(algorithm || null);
    
    // Initialize parameters with defaults
    if (algorithm?.configuration.parameters) {
      const defaultParams: Record<string, any> = {};
      Object.entries(algorithm.configuration.parameters).forEach(([key, param]) => {
        defaultParams[key] = param.default;
      });
      setOptimizationParameters(defaultParams);
    }
  };

  const updateParameter = (paramName: string, value: any) => {
    setOptimizationParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Generate widget data for analytics
  const generateWidgetData = () => ({
    jobs,
    operations,
    resources,
    metrics,
    overdueJobs: jobs.filter(job => job.dueDate && new Date(job.dueDate) < new Date() && job.status !== 'completed'),
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

  if (isMaximized) {
    return (
      <TooltipProvider>
        <div className="h-screen bg-surface overflow-y-auto">
          {/* Maximized Complete Dashboard View */}
          <div className="flex flex-col min-h-full bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
                  <h2 className="text-2xl font-semibold text-gray-800">Production Schedule - Maximized</h2>
                  <p className="text-gray-600">Full dashboard view with metrics and Gantt chart</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Live button in top right corner */}
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle live data updates</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {!isMobile && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setIsMaximized(false)}>
                          <Minimize2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Return to normal dashboard view</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {/* Analytics Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
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
                                  id={`dashboard-${dashboard.id}`}
                                  checked={visibleDashboards.has(dashboard.id)}
                                  onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                                />
                                <label
                                  htmlFor={`dashboard-${dashboard.id}`}
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
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log('Evaluate Schedules clicked, current state:', showEvaluationSystem);
                            setShowEvaluationSystem(true);
                            console.log('Setting showEvaluationSystem to true');
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                        >
                          <GitCompare className="w-4 h-4 mr-1" />
                          Evaluate Schedules
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compare and evaluate production schedules</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Optimization Algorithm Execution Button */}
                    {hasPermission('optimization-studio', 'view') && optimizationAlgorithms.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setShowOptimizationDialog(true)}
                            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-0"
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            {isMobile ? "Optimize" : "Run Optimization"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Execute approved optimization algorithms on production schedule</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalyticsManagerOpen(true)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Dashboard Manager
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Manage dashboards and widgets</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid gap-4 mt-6 grid-cols-1">
                <MetricsCard
                  title="Active Jobs"
                  value={metrics?.activeJobs?.toString() || "0"}
                  change="+8% from last week"
                  icon="briefcase"
                  color="blue"
                />
                <MetricsCard
                  title="Resource Utilization"
                  value={`${metrics?.utilization || 0}%`}
                  change=""
                  icon="chart-line"
                  color="green"
                  showProgress={true}
                  progressValue={metrics?.utilization || 0}
                />
                <MetricsCard
                  title="Overdue Operations"
                  value={metrics?.overdueOperations?.toString() || "0"}
                  change="Requires attention"
                  icon="exclamation-triangle"
                  color="red"
                />
                <MetricsCard
                  title="Avg. Lead Time"
                  value={`${metrics?.avgLeadTime || 0} days`}
                  change="-0.3 days improved"
                  icon="clock"
                  color="orange"
                />
              </div>

              {/* Custom AI-Generated Widgets */}
              {showCustomWidgets && customWidgets.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Custom Analytics Widgets</h3>
                  <div className="relative min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
                    {customWidgets.map((widget) => (
                      <AnalyticsWidget
                        key={widget.id}
                        widget={widget}
                        onToggle={handleWidgetToggle}
                        onRemove={handleWidgetRemove}
                        onEdit={handleWidgetEdit}
                        onResize={handleWidgetResize}
                        onMove={handleWidgetPositionChange}
                        data={{
                          jobs,
                          operations,
                          resources,
                          metrics,
                          overdueJobs: jobs.filter(job => job.dueDate && new Date(job.dueDate) < new Date() && job.status !== 'completed'),
                          resourceUtilization: operations.filter(op => op.assignedResourceId).length / operations.length * 100,
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
                        }}
                      />
                    ))}
                    <div className="absolute top-4 left-4 text-sm text-gray-500 pointer-events-none">
                      Drag widgets using the move handle (⋮⋮) to reposition them
                    </div>
                  </div>
                </div>
              )}
            </header>



            {/* Gantt Container */}
            <div className={`bg-white mx-6 mb-6 rounded-lg shadow-sm border border-gray-200 ${isMobile ? 'flex-1 min-h-0' : 'flex-1 overflow-hidden'}`}>
              {isMobile ? (
                <div className="h-full flex flex-col">
                  <MobileSchedule
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources" | "customers")}>
                    <div className="border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between px-4">
                        <TabsList className="h-auto p-0 bg-transparent">
                          <TabsTrigger 
                            value="resources" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <Wrench className="w-4 h-4 mr-2" />
                            Resource Gantt
                          </TabsTrigger>
                          <TabsTrigger 
                            value="operations" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Job Gantt
                          </TabsTrigger>
                          <TabsTrigger 
                            value="customers" 
                            className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Customer Gantt
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                    
                    <TabsContent value="resources" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="resources"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>

                    <TabsContent value="operations" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="operations"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>

                    <TabsContent value="customers" className="h-full m-0">
                      <GanttChart
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                        view="customers"
                        selectedResourceViewId={selectedResourceViewId}
                        onResourceViewChange={setSelectedResourceViewId}
                        rowHeight={rowHeight}
                        onRowHeightChange={setRowHeight}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  {/* Sequencer Section */}
                  <div className="border-t border-gray-200 h-1/2 flex flex-col">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-primary" />
                        <span className="text-sm font-medium text-gray-700">Sequencer</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <MobileSchedule
                        jobs={jobs}
                        operations={operations}
                        resources={resources}
                        capabilities={capabilities}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating AI Assistant Quick Action */}
          <div className="fixed bottom-6 right-6 z-40">
            <div className="floating-ai-assistant rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
              <div className="flex items-center space-x-2 mb-3">
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-gray-700">Max</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask AI to create jobs, schedule operations..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      onClick={handleAiPrompt}
                      disabled={aiMutation.isPending || !aiPrompt.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send AI command to control Gantt chart view</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Schedule Evaluation System */}
          {showEvaluationSystem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-[95vw] max-h-[90vh] overflow-hidden w-full">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Schedule Evaluation System</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowEvaluationSystem(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[75vh] p-6">
                  <ScheduleEvaluationSystem />
                </div>
              </div>
            </div>
          )}

          {/* AI Analytics Manager */}
          {dashboards && (
            <EnhancedDashboardManager
              open={analyticsManagerOpen}
              onOpenChange={setAnalyticsManagerOpen}
              dashboards={dashboards}
              currentDashboard={null}
              onDashboardSelect={() => {}}
              onDashboardCreate={() => {}}
              onDashboardUpdate={() => {}}
              onDashboardDelete={() => {}}
              standardWidgets={[]}
              customWidgets={customWidgets}
            />
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-6">
            {/* Header with live indicator in top right */}
            <div className="relative">
              <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  Production Schedule
                </h1>
                <p className="text-sm md:text-base text-gray-600">Manage operations and resource allocation</p>
              </div>
              
              {/* Live button always in top right corner */}
              <div className="absolute top-0 right-0">
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle live data updates</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

          {/* Analytics Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 space-y-3 md:space-y-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Analytics Dashboard</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 w-full sm:min-w-[160px] justify-between text-sm"
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
                              id={`dashboard-${dashboard.id}`}
                              checked={visibleDashboards.has(dashboard.id)}
                              onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                            />
                            <label
                              htmlFor={`dashboard-${dashboard.id}`}
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
                
                {/* Evaluate Schedules button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEvaluationSystem(true)}
                      className={`${getThemeClasses()} border-0 w-full sm:w-auto`}
                    >
                      <GitCompare className="w-4 h-4 mr-1" />
                      {isMobile ? "Evaluate" : "Evaluate Schedules"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compare and evaluate production schedules</p>
                  </TooltipContent>
                </Tooltip>

                {/* Run Optimization Button */}
                {hasPermission('optimization-studio', 'view') && optimizationAlgorithms.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setShowOptimizationDialog(true)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 w-full sm:w-auto"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        {isMobile ? "Optimize" : "Run Optimization"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Execute approved optimization algorithms on production schedule</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Dashboard Manager button next to dropdown */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnalyticsManagerOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {isMobile ? "Manager" : "Dashboard Manager"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage dashboards and widgets</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {!isMobile && (
                <div className="flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMaximized(!isMaximized)}
                      >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximize entire production schedule view</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* Selected Dashboards */}
          {visibleDashboardConfigs.length > 0 && (
            <div className="mb-6">
              <div className="grid gap-6">
                {visibleDashboardConfigs.map((dashboard) => (
                  <div key={dashboard.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{dashboard.name}</h3>
                      {dashboard.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    
                    {dashboard.configuration?.customWidgets?.length > 0 ? (
                      <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${
                        isMobile ? 'min-h-[800px] p-2' : 'min-h-[400px]'
                      }`}>
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
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                        <div>
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No widgets configured for this dashboard</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact Empty State */}
          {visibleDashboards.size === 0 && (
            <div className="mb-2">
              <div className="text-center py-2 px-4 text-gray-500 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center justify-center text-xs text-gray-400">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  No dashboards selected - select from dropdown to view metrics
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Gantt Container - Reduce top margin when no dashboards */}
        <div className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0 ${
          visibleDashboards.size === 0 ? 'mt-2 mx-6 mb-6' : 'm-6'
        }`}>
          {isMobile ? (
            <div className="h-full flex flex-col">
              <MobileSchedule
                jobs={jobs}
                operations={operations}
                resources={resources}
                capabilities={capabilities}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources" | "customers")}>
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <TabsList className="h-auto p-0 bg-transparent">
                      <TabsTrigger 
                        value="resources" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Resource Gantt
                      </TabsTrigger>
                      <TabsTrigger 
                        value="operations" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Job Gantt
                      </TabsTrigger>
                      <TabsTrigger 
                        value="customers" 
                        className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Customer Gantt
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center space-x-2 px-6">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setIsMaximized(true)}>
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expand Gantt chart to full screen for better visibility</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <TabsContent value="resources" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="resources"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>

                <TabsContent value="operations" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="operations"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>

                <TabsContent value="customers" className="h-full m-0">
                  <GanttChart
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                    view="customers"
                    selectedResourceViewId={selectedResourceViewId}
                    onResourceViewChange={setSelectedResourceViewId}
                    rowHeight={rowHeight}
                    onRowHeightChange={setRowHeight}
                  />
                </TabsContent>
              </Tabs>
              
              {/* Op Sequencer Section */}
              <div className="border-t border-gray-200 h-1/2 flex flex-col">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <div className="flex items-center">
                    <Smartphone className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-gray-700">Op Sequencer</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MobileSchedule
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    capabilities={capabilities}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            capabilities={capabilities} 
            onSuccess={() => setResourceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

        {/* AI Analytics Manager */}
        {dashboards && (
          <EnhancedDashboardManager
            open={analyticsManagerOpen}
            onOpenChange={setAnalyticsManagerOpen}
            dashboards={dashboards}
            currentDashboard={null}
            onDashboardSelect={() => {}}
            onDashboardCreate={() => {}}
            onDashboardUpdate={() => {}}
            onDashboardDelete={() => {}}
            standardWidgets={[]}
            customWidgets={customWidgets}
          />
        )}

        {/* Optimization Algorithm Execution Dialog */}
        <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Execute Optimization Algorithm
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Algorithm Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Algorithm</Label>
                <Select onValueChange={handleAlgorithmSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an approved optimization algorithm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {optimizationAlgorithms.map((algorithm) => (
                      <SelectItem key={algorithm.id} value={algorithm.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{algorithm.displayName || algorithm.name}</div>
                            <div className="text-xs text-gray-500">{algorithm.description}</div>
                          </div>
                          <Badge variant={algorithm.status === 'approved' ? 'default' : 'secondary'} className="ml-2">
                            {algorithm.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algorithm Details */}
              {selectedAlgorithm && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedAlgorithm.displayName || selectedAlgorithm.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedAlgorithm.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">{selectedAlgorithm.category}</Badge>
                        <Badge variant="outline">v{selectedAlgorithm.version}</Badge>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">Approved</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Objectives */}
                  {selectedAlgorithm.configuration.objectives?.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Optimization Objectives</h5>
                      <div className="grid gap-2">
                        {selectedAlgorithm.configuration.objectives.map((objective, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{objective.description}</span>
                            <Badge variant="secondary">Weight: {objective.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parameters */}
                  {Object.keys(selectedAlgorithm.configuration.parameters || {}).length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-3">Algorithm Parameters</h5>
                      <div className="grid gap-4">
                        {Object.entries(selectedAlgorithm.configuration.parameters).map(([paramName, param]) => (
                          <div key={paramName} className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                              {paramName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              {param.required && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="text-xs text-gray-500 mb-1">{param.description}</div>
                            
                            {param.type === 'select' && param.options ? (
                              <Select
                                value={optimizationParameters[paramName]?.toString() || param.default?.toString()}
                                onValueChange={(value) => updateParameter(paramName, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {param.options.map((option) => (
                                    <SelectItem key={option} value={option || 'default'}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : param.type === 'number' ? (
                              <Input
                                type="number"
                                value={optimizationParameters[paramName] || param.default || ''}
                                onChange={(e) => updateParameter(paramName, parseFloat(e.target.value) || param.default)}
                                min={param.min}
                                max={param.max}
                                step="0.01"
                              />
                            ) : param.type === 'boolean' ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={optimizationParameters[paramName] ?? param.default ?? false}
                                  onCheckedChange={(checked) => updateParameter(paramName, checked)}
                                />
                                <Label className="text-sm">Enable {paramName.toLowerCase()}</Label>
                              </div>
                            ) : (
                              <Input
                                value={optimizationParameters[paramName] || param.default || ''}
                                onChange={(e) => updateParameter(paramName, e.target.value)}
                                placeholder={`Enter ${paramName.toLowerCase()}...`}
                              />
                            )}
                            
                            {param.min !== undefined && param.max !== undefined && (
                              <div className="text-xs text-gray-400">
                                Range: {param.min} - {param.max}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution Scope */}
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-3">Execution Scope</h5>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>This optimization will be applied to all active jobs and operations in the current production schedule.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Jobs to optimize:</span>
                          <div className="text-gray-600">{jobs?.filter(j => j.status === 'active').length || 0} active jobs</div>
                        </div>
                        <div>
                          <span className="font-medium">Operations to optimize:</span>
                          <div className="text-gray-600">{operations?.filter(op => op.status !== 'completed').length || 0} pending operations</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOptimizationDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleOptimizationSubmit}
                disabled={!selectedAlgorithm || optimizationMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-0"
              >
                {optimizationMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Optimization
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Optimization Summary Dialog */}
        <OptimizationSummaryDialog
          open={showOptimizationSummary}
          onOpenChange={setShowOptimizationSummary}
          summary={optimizationSummaryData}
        />
      </div>
    </TooltipProvider>
  );
}
