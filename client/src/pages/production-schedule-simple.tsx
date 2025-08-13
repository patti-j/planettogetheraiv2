import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Search, RefreshCw, Download, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useAuth';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useNavigation } from '@/contexts/NavigationContext';
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

  const handleFilterChange = (key: keyof ScheduleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const isLoading = operationsLoading || resourcesLoading;

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
              <BryntumSchedulerProComponent 
                height="100%"
                startDate={new Date()}
                endDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              />
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