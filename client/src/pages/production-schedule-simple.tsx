import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Search, RefreshCw, Download, Settings, BarChart3, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useAuth';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useNavigation } from '@/contexts/NavigationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { WorkspaceDashboard } from '@/components/workspace-dashboard';
import BryntumSchedulerProComponent from '@/components/scheduler-pro/BryntumSchedulerPro';

interface ScheduleFilters {
  dateRange: string;
  priority: string;
  status: string;
  searchQuery: string;
}

export default function ProductionSchedulePage() {
  const { hasPermission } = usePermissions();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const { addRecentPage } = useNavigation();

  // Add this page to recent pages when component mounts
  useEffect(() => {
    addRecentPage('/production-schedule', 'Production Schedule', 'Calendar');
  }, []);

  const [filters, setFilters] = useState<ScheduleFilters>({
    dateRange: 'week',
    priority: 'all',
    status: 'all',
    searchQuery: ''
  });

  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [dashboardSelectorOpen, setDashboardSelectorOpen] = useState(false);

  // Check permissions - allow all in development for demo purposes
  const canViewSchedule = import.meta.env.DEV ? true : hasPermission('schedule', 'view');

  // Fetch data
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations'],
    enabled: canViewSchedule
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
    enabled: canViewSchedule
  });

  // Fetch available dashboards
  const { data: dashboards = [], isLoading: dashboardsLoading, error: dashboardsError } = useQuery({
    queryKey: ['/api/dashboard-configs'],
    enabled: canViewSchedule
  });

  const handleFilterChange = (key: keyof ScheduleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const isLoading = operationsLoading || resourcesLoading;
  
  // Debug logging
  React.useEffect(() => {
    console.log('Dashboard data:', { dashboards, dashboardsLoading, dashboardsError });
  }, [dashboards, dashboardsLoading, dashboardsError]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className={`flex items-center justify-between border-b ${isMobile ? 'p-3' : 'p-6'}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Calendar className={`text-blue-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          <div className="min-w-0 flex-1">
            <h1 className={`font-bold truncate ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              Production Schedule
            </h1>
            {!isMobile && (
              <p className="text-muted-foreground text-sm">
                Resource-centered view for optimal production planning
              </p>
            )}
          </div>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dashboard selector button */}
          <Dialog open={dashboardSelectorOpen} onOpenChange={setDashboardSelectorOpen}>
            <DialogTrigger asChild>
              <Button 
                variant={showDashboard ? "default" : "outline"} 
                size="sm" 
                className={isMobile ? 'p-2' : 'gap-2'}
              >
                <BarChart3 className="w-4 h-4" />
                {!isMobile && (selectedDashboard ? 'Dashboard' : 'Add Dashboard')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Dashboard</DialogTitle>
                <DialogDescription>
                  Choose a dashboard created in the UI Design Studio to display above the production schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {dashboardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="ml-2 text-sm text-muted-foreground">Loading dashboards...</p>
                  </div>
                ) : dashboardsError ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm mb-3">Error loading dashboards</p>
                    <p className="text-xs">{dashboardsError.message || 'Please try again'}</p>
                  </div>
                ) : dashboards.length > 0 ? (
                  dashboards.map((dashboard: any) => (
                    <Button
                      key={dashboard.id}
                      variant={selectedDashboard === dashboard.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedDashboard(dashboard.id);
                        setShowDashboard(true);
                        setDashboardSelectorOpen(false);
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {dashboard.name || `Dashboard ${dashboard.id}`}
                      {dashboard.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          • {dashboard.description}
                        </span>
                      )}
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm mb-3">No dashboards available</p>
                    <p className="text-xs">Create dashboards in the UI Design Studio</p>
                  </div>
                )}
                
                {selectedDashboard && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setSelectedDashboard(null);
                      setShowDashboard(false);
                      setDashboardSelectorOpen(false);
                    }}
                  >
                    Remove Dashboard
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={isMobile ? 'p-2' : 'gap-2'}
          >
            <Filter className="w-4 h-4" />
            {!isMobile && 'Filters'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Export functionality - placeholder for now
              console.log('Export clicked');
            }}
            className={isMobile ? 'p-2' : 'gap-2'}
          >
            <Download className="w-4 h-4" />
            {!isMobile && 'Export'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className={isMobile ? 'p-2' : 'gap-2'}
          >
            <RefreshCw className="w-4 h-4" />
            {!isMobile && 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`bg-muted/50 dark:bg-muted/30 border-b ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row items-center gap-4'}`}>
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search operations..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
            
            <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger className={`${isMobile ? 'text-sm flex-1' : 'w-32'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className={`${isMobile ? 'text-sm flex-1' : 'w-32'}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Selected Dashboard Panel */}
      {showDashboard && selectedDashboard && (
        <div className={`bg-muted/30 border-b ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Production Dashboard</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDashboard(false)}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
          <WorkspaceDashboard
            dashboardId={selectedDashboard}
            workspaceId="production-schedule"
            compact={true}
          />
        </div>
      )}

      {/* Main Content - Bryntum Scheduler Pro */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full m-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Resource Schedule
              </div>
              {!isLoading && (
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {Array.isArray(resources) ? resources.length : 0} Resources
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {Array.isArray(operations) ? operations.length : 0} Operations
                  </Badge>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-5rem)]">
            {!isLoading ? (
              <BryntumSchedulerProComponent />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading schedule...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}