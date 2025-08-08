import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Settings, LayoutGrid, List, Filter, Search, RefreshCw, Plus, Download, Edit, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useAuth';
import { usePageEditor, DEFAULT_WIDGET_DEFINITIONS } from '@/hooks/use-page-editor';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useNavigation } from '@/contexts/NavigationContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PageEditMode from '@/components/page-editor/page-edit-mode';
import GanttChartWidget from '@/components/widgets/gantt-chart-widget';
import GanttChart from '@/components/ui/gantt-chart';
import { GanttResourceView } from '@/components/ui/gantt-resource-view';
import OperationSequencerWidget from '@/components/widgets/operation-sequencer-widget';
import ProductionMetricsWidget from '@/components/widgets/production-metrics-widget';
import ResourceAssignmentWidget from '@/components/widgets/resource-assignment-widget';
import { Input } from '@/components/ui/input';

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

  const [activeTab, setActiveTab] = useState('gantt');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const exportHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [ganttRowHeight, setGanttRowHeight] = useState(isMobile ? 50 : 80);

  // Check permissions
  const canViewSchedule = hasPermission('schedule', 'view');
  const canEditSchedule = hasPermission('schedule', 'edit');
  const canCreateSchedule = hasPermission('schedule', 'create');

  // Fetch production orders and operations for the widgets
  const { data: productionOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/production-orders'],
    enabled: canViewSchedule
  });

  const { data: operations, isLoading: operationsLoading, refetch: refetchOperations } = useQuery({
    queryKey: ['/api/operations'],
    enabled: canViewSchedule
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
    enabled: canViewSchedule
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
      {/* Theme Toggle - Fixed positioned to the left of hamburger menu */}
      <div className="fixed top-4 md:top-5 right-20 z-50">
        <ThemeToggle />
      </div>
      
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
        
        {/* Right side: Export and Refresh buttons with proper spacing */}
        <div className="flex items-center gap-2 flex-shrink-0 pr-24">
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
      <div className={`flex-1 ${isMobile ? 'p-2' : 'p-6'}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`${isMobile ? 'grid w-full grid-cols-2 h-auto gap-1 p-1' : 'grid w-full grid-cols-4'}`}>
            <TabsTrigger 
              value="overview" 
              className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}
            >
              {isMobile ? 'Overview' : 'Schedule Overview'}
            </TabsTrigger>
            <TabsTrigger 
              value="gantt" 
              className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}
            >
              {isMobile ? 'Gantt' : 'Gantt Chart'}
            </TabsTrigger>
            <TabsTrigger 
              value="sequencer" 
              className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}
            >
              {isMobile ? 'Sequencer' : 'Operation Sequencer'}
            </TabsTrigger>
            <TabsTrigger 
              value="resources" 
              className={`${isMobile ? 'text-xs px-2 py-2' : ''}`}
            >
              {isMobile ? 'Resources' : 'Resource Assignment'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : gridCols}`}>
              {/* Gantt Chart Widget */}
              <Card className="col-span-full">
                <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    Production Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChartWidget 
                    configuration={filteredWidgetConfig}
                    className={`${isMobile ? 'h-48' : 'h-80'}`}
                    isMobile={isMobile}
                    compact={layoutConfig.view === 'compact' || isMobile}
                  />
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
                  <OperationSequencerWidget 
                    configuration={{
                      view: isMobile ? 'compact' : layoutConfig.view,
                      allowReorder: canEditSchedule,
                      showResourceFilter: !isMobile,
                      showStatusFilter: !isMobile,
                      showOptimizationFlags: !isMobile
                    }}
                    isDesktop={!isMobile}
                  />
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
                  <ProductionMetricsWidget 
                    configuration={filteredWidgetConfig}
                    className={`${isMobile ? 'h-48' : 'h-64'}`}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className={`${isMobile ? 'mt-3' : 'mt-6'}`}>
            <div className={`${isMobile ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-200px)]'}`}>
              {!ordersLoading && !operationsLoading && !resourcesLoading ? (
                <GanttResourceView
                  key={`${ganttKey}-${JSON.stringify((operations as any)?.map(op => ({id: op.id, start: op.startTime, resource: op.workCenterId})))}`}
                  operations={operations as any || []}
                  resources={resources as any || []}
                  className="h-full"
                  onOperationMove={async (operationId, newResourceId, newStartTime) => {
                    try {
                      // Find the original operation to preserve its duration
                      const originalOp = (operations as any)?.find(op => op.id === operationId);
                      let duration = 60; // Default 60 minutes
                      
                      if (originalOp) {
                        // Calculate original duration in milliseconds
                        const originalStart = new Date(originalOp.startTime);
                        const originalEnd = new Date(originalOp.endTime);
                        duration = (originalEnd.getTime() - originalStart.getTime()) / 60000; // Convert to minutes
                      }
                      
                      const endTime = new Date(newStartTime.getTime() + duration * 60000);
                      
                      // Call API to update the operation using apiRequest
                      console.log('Sending PUT request to:', `/api/operations/${operationId}`, {
                        workCenterId: newResourceId,
                        startTime: newStartTime.toISOString(),
                        endTime: endTime.toISOString()
                      });
                      
                      const response = await apiRequest('PUT', `/api/operations/${operationId}`, {
                        workCenterId: newResourceId,
                        startTime: newStartTime.toISOString(),
                        endTime: endTime.toISOString()
                      });
                      
                      console.log('PUT response:', response.status, response.ok);
                      
                      if (!response.ok) {
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.indexOf("application/json") !== -1) {
                          const error = await response.json();
                          throw new Error(error.message || 'Failed to reschedule operation');
                        } else {
                          throw new Error('Server error: Invalid response format');
                        }
                      }
                      
                      // Check if response is JSON before parsing
                      const contentType = response.headers.get("content-type");
                      let result = {};
                      if (contentType && contentType.indexOf("application/json") !== -1) {
                        result = await response.json();
                      }
                      
                      console.log('Operation updated on server:', result);
                      console.log('Current operations before refetch:', (operations as any)?.map(op => ({
                        id: op.id,
                        name: op.operationName,
                        start: op.startTime,
                        end: op.endTime,
                        resource: op.workCenterId
                      })));
                      
                      // Invalidate and remove all cached data for operations
                      queryClient.removeQueries({ queryKey: ['/api/operations'] });
                      await queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
                      
                      // Wait a bit for the cache to clear
                      await new Promise(resolve => setTimeout(resolve, 200));
                      
                      // Force immediate refresh of operations data with fresh data
                      const refetchResult = await refetchOperations();
                      console.log('Refetch completed:', refetchResult.status);
                      console.log('Operations after refetch:', (refetchResult.data as any)?.map(op => ({
                        id: op.id,
                        name: op.operationName,
                        start: op.startTime,
                        end: op.endTime,
                        resource: op.workCenterId
                      })));
                      
                      // Double-check that the specific operation was updated
                      const updatedOp = (refetchResult.data as any)?.find(op => op.id === operationId);
                      console.log('Updated operation details:', updatedOp ? {
                        id: updatedOp.id,
                        name: updatedOp.operationName,
                        newStart: updatedOp.startTime,
                        newEnd: updatedOp.endTime,
                        newResource: updatedOp.workCenterId,
                        expectedResource: newResourceId,
                        expectedStart: newStartTime.toISOString()
                      } : 'NOT FOUND');
                      
                      // Force complete re-mount of the Gantt component with a delay
                      setTimeout(() => {
                        setGanttKey(Date.now());
                      }, 200);
                    } catch (error) {
                      console.error('ERROR in onOperationMove:', error);
                      console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        operationId,
                        newResourceId,
                        newStartTime
                      });
                      throw error; // Re-throw to preserve original error handling
                    }
                  }}
                />
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading Gantt chart...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                <OperationSequencerWidget 
                  configuration={{
                    view: isMobile ? 'compact' : 'detailed',
                    allowReorder: canEditSchedule,
                    showResourceFilter: !isMobile,
                    showStatusFilter: !isMobile,
                    showOptimizationFlags: !isMobile
                  }}
                  isDesktop={!isMobile}
                />
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
                <ResourceAssignmentWidget 
                  className={`${isMobile ? 'h-64' : 'h-96'}`}
                />
              </CardContent>
            </Card>
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
            {Array.isArray(operations) ? operations.length : 0} Operations
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