import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Monitor, BarChart3, TrendingUp, Activity, AlertCircle, Grid, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useViewMode } from "@/hooks/use-view-mode";
import { Skeleton } from "@/components/ui/skeleton";

interface Dashboard {
  id: number;
  title: string;
  description: string;
  targetPlatform: string;
  configuration: {
    layout: string;
    widgets: string[];
  };
  createdAt: string;
}

export default function MobileDashboardView() {
  const [, params] = useRoute("/dashboards/:id");
  const [, setLocation] = useLocation();
  const { currentView } = useViewMode();
  
  const dashboardId = params?.id;

  // Fetch dashboard data
  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['/api/mobile/dashboards', dashboardId],
    queryFn: async () => {
      const response = await fetch('/api/mobile/dashboards');
      const dashboards = await response.json();
      return dashboards.find((d: Dashboard) => d.id.toString() === dashboardId);
    },
    enabled: !!dashboardId
  });

  const handleBack = () => {
    setLocation(currentView === "desktop" ? "/" : "/mobile-home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dashboard Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The dashboard you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const renderDashboardContent = () => {
    switch (dashboard.id) {
      case 1: // Factory Overview
        return (
          <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Production</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
                  <p className="text-xs text-green-600">+2.3% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">94%</p>
                  <p className="text-xs text-green-600">+1.1% from yesterday</p>
                </CardContent>
              </Card>
            </div>

            {/* Equipment Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Equipment Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { name: 'Primary Reactor', status: 'Running', efficiency: 96 },
                    { name: 'Secondary Mixer', status: 'Maintenance', efficiency: 0 },
                    { name: 'Packaging Line', status: 'Running', efficiency: 89 }
                  ].map((equipment) => (
                    <div key={equipment.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{equipment.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{equipment.status}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={equipment.status === 'Running' ? 'default' : 'destructive'}>
                          {equipment.efficiency}% Efficiency
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">pH Level</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">7.2</p>
                    <Badge variant="default" className="text-xs">Normal</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Temperature</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">22°C</p>
                    <Badge variant="default" className="text-xs">Normal</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Purity</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">99.8%</p>
                    <Badge variant="default" className="text-xs">Normal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Production Planning
        return (
          <div className="space-y-4">
            {/* Current Orders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Production Orders</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { id: 'PO-2025-001', product: 'Chemical Batch A', progress: 85, eta: '2 hours' },
                    { id: 'PO-2025-002', product: 'Chemical Batch B', progress: 40, eta: '6 hours' },
                    { id: 'PO-2025-003', product: 'Chemical Batch C', progress: 10, eta: '12 hours' }
                  ].map((order) => (
                    <div key={order.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{order.product}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 dark:text-gray-400">ETA: {order.eta}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{order.progress}% complete</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resource Allocation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { resource: 'Reactor Capacity', used: 75, total: 100 },
                    { resource: 'Labor Hours', used: 120, total: 160 },
                    { resource: 'Raw Materials', used: 85, total: 100 }
                  ].map((resource) => (
                    <div key={resource.resource} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{resource.resource}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {resource.used}/{resource.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (resource.used / resource.total) > 0.9 ? 'bg-red-600' : 
                            (resource.used / resource.total) > 0.7 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min((resource.used / resource.total) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Quality Control
        return (
          <div className="space-y-4">
            {/* Test Results */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Test Results</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { batch: 'Batch #1234', tests: 5, passed: 5, failed: 0, status: 'Passed' },
                    { batch: 'Batch #1235', tests: 5, passed: 4, failed: 1, status: 'Review' },
                    { batch: 'Batch #1236', tests: 5, passed: 5, failed: 0, status: 'Passed' }
                  ].map((result) => (
                    <div key={result.batch} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{result.batch}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {result.passed}/{result.tests} tests passed
                        </p>
                      </div>
                      <Badge variant={result.status === 'Passed' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inspection Plans */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upcoming Inspections</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[
                    { type: 'Equipment Calibration', due: 'Today', priority: 'High' },
                    { type: 'Quality Audit', due: 'Tomorrow', priority: 'Medium' },
                    { type: 'Safety Inspection', due: 'Next Week', priority: 'Low' }
                  ].map((inspection) => (
                    <div key={inspection.type} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{inspection.type}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Due: {inspection.due}</p>
                      </div>
                      <Badge variant={
                        inspection.priority === 'High' ? 'destructive' : 
                        inspection.priority === 'Medium' ? 'secondary' : 'outline'
                      }>
                        {inspection.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Inventory Management
        return (
          <div className="space-y-4">
            {/* Stock Levels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Stock Levels</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[
                    { item: 'Raw Material A', current: 750, min: 500, max: 1000, unit: 'kg' },
                    { item: 'Raw Material B', current: 200, min: 300, max: 800, unit: 'L' },
                    { item: 'Packaging Material', current: 1500, min: 1000, max: 2000, unit: 'units' }
                  ].map((item) => (
                    <div key={item.item} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{item.item}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.current} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.current < item.min ? 'bg-red-600' : 
                            item.current > item.max * 0.8 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min((item.current / item.max) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Min: {item.min}</span>
                        <span>Max: {item.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dashboard Preview</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dashboard.description}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-white">{dashboard.title}</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">{dashboard.description}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Dashboard
          </Badge>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-4">
        {renderDashboardContent()}
        
        {/* Dashboard Info */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Dashboard Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Layout:</span>
                <span className="font-medium capitalize">{dashboard.configuration.layout}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Widgets:</span>
                <span className="font-medium">{dashboard.configuration.widgets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                <span className="font-medium capitalize">{dashboard.targetPlatform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium">
                  {new Date(dashboard.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}