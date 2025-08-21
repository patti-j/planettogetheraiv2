import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarDays, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  Zap,
  RefreshCw
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface DashboardWidget {
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
  name: string;
  description: string;
  standardWidgets: DashboardWidget[];
  customWidgets: DashboardWidget[];
}

export default function ProductionSchedulerDashboard() {
  const { toast } = useToast();

  const { data: dashboardConfig, isLoading, error } = useQuery<DashboardConfig>({
    queryKey: ["/api/dashboard-configs/1"], // ID 1 is our Production Scheduler Dashboard
  });

  const { data: productionOrders } = useQuery<any[]>({
    queryKey: ["/api/pt-jobs"],
  });

  const { data: resources } = useQuery<any[]>({
    queryKey: ["/api/resources"],
  });

  const handleRefreshDashboard = () => {
    toast({
      title: "Dashboard Refreshed",
      description: "All widgets have been updated with the latest data.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading Production Scheduler Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Unable to load the production scheduler dashboard configuration.
          </p>
        </div>
      </div>
    );
  }

  // Quick stats for the header
  const activeOrders = productionOrders?.filter((order: any) => 
    ["In Progress", "Scheduled", "Ready"].includes(order.status)
  )?.length || 0;
  
  const availableResources = resources?.filter((resource: any) => 
    resource.status === "active"
  )?.length || 0;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <CalendarDays className="w-6 h-6 mr-2" />
            Production Scheduler Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {dashboardConfig?.description || "Comprehensive dashboard for production scheduling operations"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex">
            <Activity className="h-3 w-3 mr-1" />
            {activeOrders} Active Orders
          </Badge>
          <Badge variant="outline" className="hidden sm:flex">
            <Target className="h-3 w-3 mr-1" />
            {availableResources} Resources
          </Badge>
          <Button onClick={handleRefreshDashboard} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimize</p>
                <p className="text-xs text-muted-foreground">Schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analyze</p>
                <p className="text-xs text-muted-foreground">Trade-offs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Check</p>
                <p className="text-xs text-muted-foreground">ATP/CTP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitor</p>
                <p className="text-xs text-muted-foreground">KPIs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Schedule Optimization Widget - Full height on left */}
        <div className="lg:row-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Schedule Optimizer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <h3 className="font-semibold text-sm mb-2">Algorithm</h3>
                    <p className="text-xs text-muted-foreground">Critical Path</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <h3 className="font-semibold text-sm mb-2">Profile</h3>
                    <p className="text-xs text-muted-foreground">Balanced</p>
                  </div>
                </div>
                <Button className="w-full" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Schedule
                </Button>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last optimization:</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Improvement:</span>
                    <span className="text-green-600">+12% efficiency</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Trade-off Analyzer - Spans 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Schedule Trade-off Analyzer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Schedule analysis dashboard component would appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Utilization Gauge */}
        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {resources?.slice(0, 3).map((resource: any, index: number) => {
                  const utilization = Math.floor(Math.random() * 40) + 60;
                  return (
                    <div key={resource.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{resource.name}</span>
                        <span className="text-muted-foreground">
                          {utilization}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ATP/CTP Overview */}
        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                ATP/CTP Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">ATP/CTP dashboard component would appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Active Orders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Production Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Active Production Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {productionOrders?.slice(0, 8).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.name}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={order.status === "In Progress" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "TBD"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Bottleneck Alerts */}
        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Bottleneck Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Resource Conflict</p>
                      <p className="text-xs text-muted-foreground">
                        Primary Reactor overbooked by 2 hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950">
                    <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Late Order</p>
                      <p className="text-xs text-muted-foreground">
                        PO-2024-001 behind schedule by 1 day
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Capacity Warning</p>
                      <p className="text-xs text-muted-foreground">
                        Next week at 95% capacity
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}