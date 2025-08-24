import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Settings, LayoutGrid, List, Filter, Search, RefreshCw, Plus, Download, Edit, Menu, X, Save, History, GitCompareArrows, UserCheck, MessageCircle, Bell, FlaskConical, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import GanttChart from '@/components/ui/gantt-chart';
import BryntumSchedulerProComponent from '@/components/scheduler-pro/BryntumSchedulerPro';
import UnscheduledOperationsGrid from '@/components/scheduler-pro/UnscheduledOperationsGrid';

// Import PT Gantt styles
import '../styles/pt-gantt.css';

import { useQuery, useMutation } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useAuth';
import { usePageEditor, DEFAULT_WIDGET_DEFINITIONS } from '@/hooks/use-page-editor';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useNavigation } from '@/contexts/NavigationContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PageEditMode from '@/components/page-editor/page-edit-mode';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceDashboard } from '@/components/workspace-dashboard';

interface ScheduleFilters {
  dateRange: string;
  priority: string;
  status: string;
  resource: string;
  searchQuery: string;
}

interface LayoutConfig {
  view: 'compact' | 'standard' | 'detailed';
  columnsPerRow: number;
  showFilters: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export default function ProductionSchedulePage() {
  const { hasPermission } = usePermissions();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const { addRecentPage } = useNavigation();
  const [ganttKey, setGanttKey] = useState(Date.now());
  
  // Force refresh Gantt when switching tabs
  const refreshGantt = () => {
    setGanttKey(Date.now());
  };
  
  // Add this page to recent pages when component mounts
  useEffect(() => {
    addRecentPage('/production-schedule', 'Production Schedule', 'Calendar');
  }, []); // Empty dependency array - only run once on mount
  
  // Page editor integration
  const {
    isEditMode,
    layout,
    availableWidgets,
    toggleEditMode,
    handleLayoutChange: handlePageLayoutChange,
    handleTitleChange,
    handleDescriptionChange,
    handleSave
  } = usePageEditor('production-schedule');

  const [filters, setFilters] = useState<ScheduleFilters>({
    dateRange: 'week',
    priority: 'all',
    status: 'all',
    resource: 'all',
    searchQuery: ''
  });
  
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    view: 'standard',
    columnsPerRow: 2,
    showFilters: true,
    autoRefresh: false,
    refreshInterval: 30
  });

  const [activeTab, setActiveTab] = useState('scheduler-pro'); // Default to resource-centered view
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const exportHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [ganttRowHeight, setGanttRowHeight] = useState(isMobile ? 50 : 80);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isDashboardEditMode, setIsDashboardEditMode] = useState(false);

  // Check permissions - allow all in development for demo purposes
  const canViewSchedule = import.meta.env.DEV ? true : hasPermission('schedule', 'view');
  const canEditSchedule = import.meta.env.DEV ? true : hasPermission('schedule', 'edit');
  const canCreateSchedule = import.meta.env.DEV ? true : hasPermission('schedule', 'create');

  // Fetch job templates and operations for the widgets
  const { data: jobTemplates, isLoading: jobTemplatesLoading } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: canViewSchedule
  });

  // Use PT operations endpoint for authentic PT import data with jobs, operations, and activities
  const { data: ptOperations, isLoading: operationsLoading, refetch: refetchOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: canViewSchedule
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
    enabled: canViewSchedule
  });

  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery({
    queryKey: ['/api/capabilities'],
    enabled: canViewSchedule
  });

  // Fetch workspace dashboard for production schedule page
  const { data: workspaceDashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/workspace-dashboards/production-schedule/1'], // Using plant ID 1 for now
    enabled: canViewSchedule
  });

  // Mutation for creating/updating workspace dashboard
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      return apiRequest('POST', '/api/workspace-dashboards', dashboardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspace-dashboards/production-schedule/1'] });
    }
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (!layoutConfig.autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refetch of all data
      window.location.reload();
    }, layoutConfig.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [layoutConfig.autoRefresh, layoutConfig.refreshInterval]);

  if (!canViewSchedule) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground dark:text-muted-foreground">
              You don't have permission to view the production schedule.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFilterChange = (key: keyof ScheduleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLayoutConfigChange = (key: keyof LayoutConfig, value: any) => {
    setLayoutConfig(prev => ({ ...prev, [key]: value }));
  };

  const filteredWidgetConfig = {
    filters: {
      dateRange: filters.dateRange,
      priority: filters.priority !== 'all' ? [filters.priority] : undefined,
      status: filters.status !== 'all' ? [filters.status] : undefined,
      resourceId: filters.resource !== 'all' ? parseInt(filters.resource) : undefined,
      searchQuery: filters.searchQuery || undefined
    },
    view: layoutConfig.view,
    autoRefresh: layoutConfig.autoRefresh
  };

  const gridCols = layoutConfig.columnsPerRow === 1 ? "grid-cols-1" : 
                   layoutConfig.columnsPerRow === 2 ? "grid-cols-1 lg:grid-cols-2" :
                   "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";

  // Render with page edit mode
  if (isEditMode) {
    return (
      <PageEditMode
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        pageTitle={layout.title}
        onPageTitleChange={handleTitleChange}
        pageDescription={layout.description}
        onPageDescriptionChange={handleDescriptionChange}
        layout={layout}
        onLayoutChange={handlePageLayoutChange}
        availableWidgets={availableWidgets}
        onSave={handleSave}
        className="h-screen"
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Header */}
      <div className={`flex items-center justify-between border-b ${isMobile ? 'p-3' : 'p-6'}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Calendar className={`text-blue-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className={`font-bold truncate ${isMobile ? 'text-lg' : 'text-2xl'}`}>{layout.title}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                className={`${isMobile ? 'w-5 h-5 p-0' : 'w-6 h-6 p-0'} opacity-40 hover:opacity-70 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400`}
              >
                <Edit className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              </Button>
            </div>
            {!isMobile && (
              <p className="text-muted-foreground text-sm">
                {layout.description || "Manage production orders, operations, and resource assignments"}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side: Dashboard, Export and Refresh buttons with proper spacing */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          
          {/* Dashboard toggle button - always visible */}
          <Button 
            variant={showDashboard ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => {
              console.log('Dashboard button clicked, showDashboard:', showDashboard);
              setShowDashboard(!showDashboard);
            }}
          >
            <BarChart3 className="w-4 h-4" />
            {!isMobile && "Dashboard"}
            {showDashboard ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          
          {/* Desktop-only buttons */}
          {!isMobile && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={async () => {
                  if (exportHandlerRef.current) {
                    await exportHandlerRef.current();
                  } else {
                    alert("Please wait for the Gantt Chart to load");
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Workspace Dashboard */}
      {showDashboard && (
        <WorkspaceDashboard 
          workspaceDashboard={workspaceDashboard}
          isLoading={dashboardLoading}
          isEditMode={isDashboardEditMode}
          onToggleEditMode={setIsDashboardEditMode}
          onSave={(dashboardData) => createDashboardMutation.mutate(dashboardData)}
          productionData={{
            jobTemplates: Array.isArray(jobTemplates) ? jobTemplates : [],
            operations: Array.isArray(ptOperations) ? ptOperations : [],
            resources: Array.isArray(resources) ? resources : []
          }}
        />
      )}

      {/* Filters and Controls */}
      {layoutConfig.showFilters && (
        <div className={`bg-muted/50 dark:bg-muted/30 border-b ${isMobile ? 'p-2' : 'p-4'}`}>
          {isMobile ? (
            // Mobile: Collapsible filters
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showMobileFilters ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    <LayoutGrid className="w-3 h-3 mr-1" />
                    {layoutConfig.view.charAt(0).toUpperCase() + layoutConfig.view.slice(1)}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newView = layoutConfig.view === 'compact' ? 'standard' : 
                                    layoutConfig.view === 'standard' ? 'detailed' : 'compact';
                      handleLayoutConfigChange('view', newView);
                    }}
                    className="w-8 h-8 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showMobileFilters && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={filters.searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      className="flex-1 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            // Desktop: Horizontal layout
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, operations..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline" className="gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  {layoutConfig.view.charAt(0).toUpperCase() + layoutConfig.view.slice(1)} View
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLayoutConfig(prev => ({ ...prev, showFilters: false }))}
                >
                  <Filter className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newView = layoutConfig.view === 'compact' ? 'standard' : 
                                  layoutConfig.view === 'standard' ? 'detailed' : 'compact';
                    handleLayoutConfigChange('view', newView);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${isMobile ? 'p-2' : 'p-6'} overflow-hidden`}>

        
        {/* Always show tabs - unified approach for mobile and desktop */}
        <div className="mb-4">
          <Tabs defaultValue="scheduler-pro" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-4 gap-1 ${isMobile ? 'h-12' : 'h-10'}`}>
              <TabsTrigger value="scheduler-pro" className={`${isMobile ? 'text-xs p-2' : ''}`}>
                {isMobile ? '📊 Resources' : 'Resource Schedule'}
              </TabsTrigger>
              <TabsTrigger value="demo" className={`bg-orange-200 dark:bg-orange-900 hover:bg-orange-300 ${isMobile ? 'text-xs p-2' : ''}`}>
                {isMobile ? '🧪 Demo' : 'Demo Data'}
              </TabsTrigger>
              <TabsTrigger value="overview" className={`${isMobile ? 'text-xs p-2' : ''}`}>
                {isMobile ? '📈 Overview' : 'Overview'}
              </TabsTrigger>
              <TabsTrigger value="gantt" className={`${isMobile ? 'text-xs p-2' : ''}`}>
                {isMobile ? '📅 Gantt' : 'Simple Gantt'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Tab content wrapper */}
        <Tabs value={activeTab} className="flex-1">
          {/* Remove the TabsList here since we're handling it above */}
          
          <TabsContent value="overview" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : gridCols}`}>
              {/* Gantt Chart Widget - Temporarily disabled to prevent conflict with Bryntum */}
              {/* Note: The old React GanttChart was causing conflicts with Bryntum Gantt */}
              <Card className="col-span-full">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Production Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Please use the Gantt Chart tab for the production timeline view</p>
                      <p className="text-xs mt-2">The Bryntum Gantt provides advanced scheduling capabilities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operation Sequencer Widget */}
              <Card className="col-span-full lg:col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <List className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Operation Sequencer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Operation sequencing dashboard component would appear here</p>
                  </div>
                </CardContent>
              </Card>

              {/* Production Metrics Widget */}
              <Card className="col-span-full lg:col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Production Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Production metrics dashboard component would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduler-pro" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <Card className="h-full">
              <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-base' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Resource-Centered Production Schedule
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    Primary View
                  </Badge>
                </CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    View and manage production operations by resource - see utilization, efficiency, and capacity at a glance. Drag operations between resources to optimize scheduling.
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* PT Operations Summary - Enhanced with Jobs, Operations, Activities breakdown */}
                {!ordersLoading && !operationsLoading && !resourcesLoading && ptOperations && resources && (
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-green-950/30 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{Array.isArray(ptOperations) ? new Set(ptOperations.map(op => op.jobId)).size : 0}</div>
                        <div className="text-xs text-muted-foreground">Unique Jobs</div>
                      </div>
                      <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{Array.isArray(ptOperations) ? ptOperations.length : 0}</div>
                        <div className="text-xs text-muted-foreground">Operations</div>
                      </div>
                      <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{Array.isArray(ptOperations) ? ptOperations.filter(op => op.setupTime > 0 || op.cycleTime > 0).length : 0}</div>
                        <div className="text-xs text-muted-foreground">Activities</div>
                      </div>
                      <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{Array.isArray(ptOperations) ? ptOperations.filter(op => op.onHold).length : 0}</div>
                        <div className="text-xs text-muted-foreground">On Hold</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="font-semibold text-blue-600">Active Resources:</span> 
                          <span className="ml-2">{Array.isArray(resources) ? resources.filter((r: any) => r.status === 'active' || !r.status).length : 0} / {Array.isArray(resources) ? resources.length : 0}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-purple-600">Avg Load:</span> 
                          <span className="ml-2">{Math.round((Array.isArray(ptOperations) ? ptOperations.length : 0) / (Array.isArray(resources) ? resources.length : 1) * 100 / 8)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span>Scheduled</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span>On Hold</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!ordersLoading && !operationsLoading && !resourcesLoading ? (
                  <div className="flex h-full">
                    {/* Unscheduled Operations Grid - Left Panel */}
                    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <UnscheduledOperationsGrid
                        onOperationDragStart={(operation) => {
                          console.log('🎯 Drag started:', operation.name);
                        }}
                        onOperationDrag={(operation, targetResource) => {
                          console.log('🎯 Dragging to:', targetResource?.name);
                        }}
                        onOperationDrop={(operation, targetResource, startDate) => {
                          console.log('🎯 Dropped:', operation.name, 'on', targetResource?.name, 'at', startDate);
                          // This will trigger a refetch of operations after assignment
                          refetchOperations();
                        }}
                      />
                    </div>
                    
                    {/* Bryntum Scheduler Pro - Main Panel */}
                    <div className="flex-1">
                      <BryntumSchedulerProComponent
                        operations={ptOperations || []}
                        resources={resources || []}
                        onOperationUpdate={(operationId, updates) => {
                          console.log('Operation update requested:', operationId, updates);
                          // This will trigger a refetch of operations
                          refetchOperations();
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <GanttChart
                    jobs={productionOrders || []}
                    operations={ptOperations || []}
                    resources={resources || []}
                    capabilities={capabilities || []}
                    view={layoutConfig.view === 'compact' ? 'operations' : 'resources'}
                    selectedResourceViewId={null}
                    onResourceViewChange={() => {}}
                    rowHeight={60}
                    onRowHeightChange={() => {}}
                    onExportReady={(handler) => {
                      exportHandlerRef.current = handler;
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <Card className="h-full">
              <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-base' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Bryntum Demo - Test Data
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Demo Mode
                  </Badge>
                </CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    This tab shows Bryntum Scheduler Pro with their recommended demo data structure. Use this to verify the scheduler component is working correctly.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8" style={{ minHeight: isMobile ? '500px' : '700px' }}>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4">Bryntum Demo</h3>
                    <p className="text-gray-600 mb-4">
                      View the working scheduler implementation
                    </p>
                    <a href="/basic-scheduler" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Open Basic Scheduler Demo →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gantt" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <div className={`${isMobile ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-200px)]'} flex items-center justify-center`}>
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-4">Gantt Chart View</h3>
                <p className="text-gray-600 mb-4">
                  View the working scheduler with Gantt capabilities
                </p>
                <a href="/basic-scheduler" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  View Basic Scheduler Demo →
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sequencer" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <Card>
              <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                <CardTitle className={`${isMobile ? 'text-base' : ''}`}>Operation Sequencer</CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    Drag and drop operations to optimize production sequence
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Operation sequencer dashboard component would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <Card>
              <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                <CardTitle className={`${isMobile ? 'text-base' : ''}`}>Resource Assignment</CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    Manage resource allocations and capacity planning
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Resource assignment dashboard component would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {/* Schedule Versions/Snapshots */}
              <Card className="col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <History className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Schedule Versions
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-sm text-muted-foreground">
                      Save and restore schedule snapshots
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full gap-2" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement save snapshot functionality
                        alert('Save Snapshot functionality will be implemented');
                      }}
                    >
                      <Save className="w-4 h-4" />
                      Save Current Version
                    </Button>
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">Recent Versions</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <span className="text-sm">v1.2 - Production Schedule</span>
                          <span className="text-xs text-muted-foreground">2 hours ago</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <span className="text-sm">v1.1 - Weekly Schedule</span>
                          <span className="text-xs text-muted-foreground">Yesterday</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Approvals */}
              <Card className="col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <UserCheck className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Approval Workflow
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-sm text-muted-foreground">
                      Request and manage schedule approvals
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full gap-2" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement request approval functionality
                        alert('Request Approval functionality will be implemented');
                      }}
                    >
                      <UserCheck className="w-4 h-4" />
                      Request Approval
                    </Button>
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">Pending Approvals</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <div>
                            <span className="text-sm">Schedule Update</span>
                            <Badge variant="outline" className="ml-2 text-xs">Level 1</Badge>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <div>
                            <span className="text-sm">Resource Change</span>
                            <Badge variant="outline" className="ml-2 text-xs">Level 2</Badge>
                          </div>
                          <Badge variant="default" className="bg-green-500 text-white">Approved</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Comparison */}
              <Card className="col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <GitCompareArrows className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Schedule Comparison
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-sm text-muted-foreground">
                      Compare different schedule versions
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full gap-2" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement compare functionality
                        alert('Compare Schedules functionality will be implemented');
                      }}
                    >
                      <GitCompareArrows className="w-4 h-4" />
                      Compare Versions
                    </Button>
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">Recent Comparisons</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <span className="text-sm">v1.2 vs v1.1</span>
                          <Badge variant="outline">12 changes</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <span className="text-sm">Current vs Baseline</span>
                          <Badge variant="outline">5 changes</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Discussions & Notifications */}
              <Card className="col-span-1">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <MessageCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Collaboration
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-sm text-muted-foreground">
                      Discussions and notifications
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2" 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement discussion functionality
                          alert('Start Discussion functionality will be implemented');
                        }}
                      >
                        <MessageCircle className="w-3 h-3" />
                        Discuss
                      </Button>
                      <Button 
                        className="flex-1 gap-2" 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement subscription functionality
                          alert('Subscribe to Changes functionality will be implemented');
                        }}
                      >
                        <Bell className="w-3 h-3" />
                        Subscribe
                      </Button>
                    </div>
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">Recent Activity</p>
                      <div className="space-y-1">
                        <div className="p-2 hover:bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">John: Updated resource allocation</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-5">10 min ago</span>
                        </div>
                        <div className="p-2 hover:bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Bell className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">Schedule approved by manager</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-5">1 hour ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between bg-muted/50 border-t text-muted-foreground ${
        isMobile ? 'px-3 py-2 text-xs flex-col gap-2' : 'px-6 py-3 text-sm'
      }`}>
        <div className={`flex items-center ${isMobile ? 'gap-3 justify-center w-full' : 'gap-4'}`}>
          <span>
            {Array.isArray(productionOrders) ? productionOrders.length : 0} {isMobile ? 'Orders' : 'Production Orders'}
          </span>
          <span>
            {Array.isArray(ptOperations) ? ptOperations.length : 0} Operations
          </span>
          <span>
            {Array.isArray(resources) ? resources.length : 0} Resources
          </span>
        </div>
        
        <div className={`flex items-center ${isMobile ? 'gap-1 justify-center w-full' : 'gap-2'}`}>
          {layoutConfig.autoRefresh && (
            <Badge variant="outline" className={`gap-1 ${isMobile ? 'text-xs' : ''}`}>
              <RefreshCw className="w-3 h-3" />
              {isMobile ? `${layoutConfig.refreshInterval}s` : `Auto-refresh: ${layoutConfig.refreshInterval}s`}
            </Badge>
          )}
          <span className={`${isMobile ? 'text-xs' : ''}`}>
            {isMobile ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : `Last updated: ${new Date().toLocaleTimeString()}`}
          </span>
        </div>
      </div>
    </div>
  );
}