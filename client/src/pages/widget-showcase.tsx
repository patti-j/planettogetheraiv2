import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Share2, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import UniversalWidget from '@/components/universal-widget';
import { WidgetConfig, SystemData, WIDGET_TEMPLATES } from '@/lib/widget-library';
import { useToast } from '@/hooks/use-toast';
import type { Job, Operation, Resource, Capability } from '@shared/schema';

export default function WidgetShowcase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all required data
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"]
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"]
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"]
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"]
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["/api/cockpit/alerts"],
    initialData: [
      { id: 1, type: 'warning', title: 'Resource Overload', message: 'CNC Machine-001 running at 120% capacity', severity: 'medium' },
      { id: 2, type: 'error', title: 'Equipment Issue', message: 'Welder-001 requires maintenance', severity: 'high' },
      { id: 3, type: 'info', title: 'Schedule Update', message: '2 operations rescheduled for tomorrow', severity: 'low' }
    ]
  });

  const { data: metrics = {} } = useQuery<any>({
    queryKey: ["/api/metrics"],
    initialData: {
      activeJobs: jobs.length,
      utilization: 85,
      overdueOperations: 3,
      efficiency: 92
    }
  });

  // Prepare system data
  const systemData: SystemData = {
    jobs,
    operations,
    resources,
    capabilities,
    metrics,
    alerts
  };

  // Sample widget configurations demonstrating different types
  const sampleWidgets: WidgetConfig[] = [
    {
      id: 'jobs-kpi',
      type: 'kpi',
      title: 'Active Jobs',
      subtitle: 'Currently in production',
      dataSource: 'jobs',
      aggregation: 'count',
      filters: { status: ['active'] },
      size: { width: 300, height: 200 },
      position: { x: 0, y: 0 },
      colors: ['#3b82f6']
    },
    {
      id: 'job-status-chart',
      type: 'chart',
      title: 'Job Status Distribution',
      subtitle: 'Breakdown by status',
      dataSource: 'jobs',
      chartType: 'pie',
      groupBy: 'status',
      aggregation: 'count',
      size: { width: 400, height: 300 },
      position: { x: 0, y: 0 },
      colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280']
    },
    {
      id: 'operations-table',
      type: 'table',
      title: 'Recent Operations',
      subtitle: 'Latest activity',
      dataSource: 'operations',
      size: { width: 500, height: 350 },
      position: { x: 0, y: 0 }
    },
    {
      id: 'resource-utilization',
      type: 'gauge',
      title: 'Resource Utilization',
      subtitle: 'Overall efficiency',
      dataSource: 'resources',
      aggregation: 'avg',
      groupBy: 'utilization',
      size: { width: 300, height: 250 },
      position: { x: 0, y: 0 },
      colors: ['#10b981'],
      thresholds: [
        { value: 80, color: '#10b981', label: 'Good' },
        { value: 60, color: '#f59e0b', label: 'Warning' },
        { value: 0, color: '#ef4444', label: 'Critical' }
      ]
    },
    {
      id: 'alerts-feed',
      type: 'alert',
      title: 'System Alerts',
      subtitle: 'Recent notifications',
      dataSource: 'alerts',
      size: { width: 400, height: 300 },
      position: { x: 0, y: 0 }
    },
    {
      id: 'progress-widget',
      type: 'progress',
      title: 'Production Progress',
      subtitle: 'Daily targets',
      dataSource: 'operations',
      aggregation: 'avg',
      size: { width: 350, height: 150 },
      position: { x: 0, y: 0 },
      colors: ['#3b82f6']
    }
  ];

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast({ title: "All widgets refreshed successfully" });
    } catch (error) {
      toast({ title: "Error refreshing widgets", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportWidget = (widgetId: string) => {
    const widget = sampleWidgets.find(w => w.id === widgetId);
    if (widget) {
      const dataStr = JSON.stringify(widget, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `widget-${widgetId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: `Widget ${widget.title} exported` });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Universal Widget Showcase</h1>
          <p className="text-muted-foreground">
            Demonstration of the universal widget system with real manufacturing data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{operations.length}</div>
              <div className="text-sm text-muted-foreground">Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{resources.length}</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{alerts.length}</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Showcase */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Widgets</TabsTrigger>
          <TabsTrigger value="kpi">KPI</TabsTrigger>
          <TabsTrigger value="chart">Charts</TabsTrigger>
          <TabsTrigger value="table">Tables</TabsTrigger>
          <TabsTrigger value="gauge">Gauges</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sampleWidgets.map((widget) => (
              <div key={widget.id} className="relative">
                <UniversalWidget
                  config={widget}
                  data={systemData}
                  onEdit={(id) => toast({ title: `Edit widget: ${id}` })}
                  onRemove={(id) => toast({ title: `Remove widget: ${id}` })}
                  onRefresh={(id) => toast({ title: `Refresh widget: ${id}` })}
                  showControls={true}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {widget.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportWidget(widget.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Individual widget type tabs */}
        {['kpi', 'chart', 'table', 'gauge', 'alert', 'progress'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sampleWidgets.filter(w => w.type === type).map((widget) => (
                <div key={widget.id} className="relative">
                  <UniversalWidget
                    config={widget}
                    data={systemData}
                    onEdit={(id) => toast({ title: `Edit ${type} widget: ${id}` })}
                    onRemove={(id) => toast({ title: `Remove ${type} widget: ${id}` })}
                    onRefresh={(id) => toast({ title: `Refresh ${type} widget: ${id}` })}
                    showControls={true}
                  />
                  <div className="mt-2 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExportWidget(widget.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {sampleWidgets.filter(w => w.type === type).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No {type} widgets available in this showcase
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Widget Templates Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Available Widget Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(WIDGET_TEMPLATES).map(([key, template]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{template.type}</Badge>
                  <span className="font-medium">{template.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{template.subtitle || 'Widget template'}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Data Source: {template.dataSource}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}