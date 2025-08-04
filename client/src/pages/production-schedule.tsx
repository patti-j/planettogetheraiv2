import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Settings, LayoutGrid, List, Filter, Search, RefreshCw, Plus, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useAuth';
import GanttChartWidget from '@/components/widgets/gantt-chart-widget';
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

  const [activeTab, setActiveTab] = useState('overview');

  // Check permissions
  const canViewSchedule = hasPermission('schedule', 'view');
  const canEditSchedule = hasPermission('schedule', 'edit');
  const canCreateSchedule = hasPermission('schedule', 'create');

  // Fetch production orders and operations for the widgets
  const { data: productionOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/production-orders'],
    enabled: canViewSchedule
  });

  const { data: operations, isLoading: operationsLoading } = useQuery({
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
            <p className="text-center text-muted-foreground">
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

  const handleLayoutChange = (key: keyof LayoutConfig, value: any) => {
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Production Schedule</h1>
            <p className="text-muted-foreground">
              Manage production orders, operations, and resource assignments
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canCreateSchedule && (
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
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
        </div>
      </div>

      {/* Filters and Controls */}
      {layoutConfig.showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 border-b">
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
                handleLayoutChange('view', newView);
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Schedule Overview</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="sequencer">Operation Sequencer</TabsTrigger>
            <TabsTrigger value="resources">Resource Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className={`grid gap-6 ${gridCols}`}>
              {/* Gantt Chart Widget */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Production Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChartWidget 
                    configuration={filteredWidgetConfig}
                    className="h-80"
                    isMobile={false}
                    compact={layoutConfig.view === 'compact'}
                  />
                </CardContent>
              </Card>

              {/* Operation Sequencer Widget */}
              <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Operation Sequencer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OperationSequencerWidget 
                    configuration={{
                      view: layoutConfig.view,
                      allowReorder: canEditSchedule,
                      showResourceFilter: true,
                      showStatusFilter: true,
                      showOptimizationFlags: true
                    }}
                    isDesktop={true}
                  />
                </CardContent>
              </Card>

              {/* Production Metrics Widget */}
              <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Production Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductionMetricsWidget 
                    configuration={filteredWidgetConfig}
                    className="h-64"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Gantt Chart</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visual timeline of all production orders and operations
                </p>
              </CardHeader>
              <CardContent>
                <GanttChartWidget 
                  configuration={filteredWidgetConfig}
                  className="h-[600px]"
                  isMobile={false}
                  compact={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sequencer" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Operation Sequencer</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag and drop operations to optimize production sequence
                </p>
              </CardHeader>
              <CardContent>
                <OperationSequencerWidget 
                  configuration={{
                    view: 'detailed',
                    allowReorder: canEditSchedule,
                    showResourceFilter: true,
                    showStatusFilter: true,
                    showOptimizationFlags: true
                  }}
                  isDesktop={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Assignment</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage resource allocations and capacity planning
                </p>
              </CardHeader>
              <CardContent>
                <ResourceAssignmentWidget 
                  className="h-96"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {Array.isArray(productionOrders) ? productionOrders.length : 0} Production Orders
          </span>
          <span>
            {Array.isArray(operations) ? operations.length : 0} Operations
          </span>
          <span>
            {Array.isArray(resources) ? resources.length : 0} Resources
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {layoutConfig.autoRefresh && (
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="w-3 h-3" />
              Auto-refresh: {layoutConfig.refreshInterval}s
            </Badge>
          )}
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}