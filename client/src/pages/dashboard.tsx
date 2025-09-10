import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Factory,
  BarChart3,
  Target,
  Truck,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar,
  Settings,
  Bell,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { usePermissions } from "@/hooks/useAuth";
import { Link } from "wouter";
import { format } from "date-fns";
import { getFederationModule, isFederationInitialized } from "@/lib/federation-bootstrap";

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
  qualityRate: number;
  onTimeDelivery: number;
  inventoryTurnover: number;
  totalRevenue: number;
}

interface Alert {
  id: number;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  icon: string;
}

export default function Dashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { getThemeClasses } = useAITheme();
  const { isMaxOpen } = useMaxDock();
  const { hasPermission } = usePermissions();
  const [federationStatus, setFederationStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [moduleMetrics, setModuleMetrics] = useState<any>(null);

  // Check federation status on mount
  useEffect(() => {
    const checkFederation = async () => {
      try {
        const isInitialized = isFederationInitialized();
        if (isInitialized) {
          setFederationStatus('ready');
          // Load metrics from production-scheduling module
          const prodModule = await getFederationModule('production-scheduling');
          const jobs = await prodModule.getJobs();
          if (jobs.success) {
            // Federation modules are ready
            console.log('[Dashboard] Federation modules ready');
          }
        } else {
          setFederationStatus('loading');
        }
      } catch (error) {
        console.error('[Dashboard] Federation check failed:', error);
        setFederationStatus('error');
      }
    };
    checkFederation();
  }, []);

  // Fetch dashboard metrics
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics", selectedTimeRange],
    queryFn: async () => {
      // Return sample metrics for now
      return {
        activeJobs: 47,
        utilization: 78.5,
        overdueOperations: 3,
        avgLeadTime: 4.2,
        qualityRate: 98.7,
        onTimeDelivery: 94.3,
        inventoryTurnover: 12.5,
        totalRevenue: 2847500
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    queryFn: async () => {
      // Return sample alerts
      return [
        {
          id: 1,
          type: 'warning',
          title: 'Resource Bottleneck',
          message: 'Machine M-203 is approaching 95% capacity',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 2,
          type: 'error',
          title: 'Quality Alert',
          message: 'Batch B-4521 failed quality inspection',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 3,
          type: 'info',
          title: 'Maintenance Scheduled',
          message: 'Preventive maintenance for Line 3 tomorrow at 2 PM',
          timestamp: new Date().toISOString(),
          priority: 'medium'
        }
      ];
    },
  });

  // Fetch recent activities
  const { data: activities = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      // Return sample activities
      return [
        {
          id: 1,
          type: 'job_created',
          description: 'New production order #PO-2024-847 created',
          timestamp: new Date().toISOString(),
          user: 'John Smith',
          icon: 'Package'
        },
        {
          id: 2,
          type: 'schedule_updated',
          description: 'Schedule optimized for Plant A',
          timestamp: new Date().toISOString(),
          user: 'System',
          icon: 'Calendar'
        },
        {
          id: 3,
          type: 'quality_check',
          description: 'Quality inspection completed for Batch B-4520',
          timestamp: new Date().toISOString(),
          user: 'Sarah Johnson',
          icon: 'CheckCircle'
        }
      ];
    },
  });

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityIcon = (icon: string) => {
    switch(icon) {
      case 'Package': return <Package className="h-4 w-4" />;
      case 'Calendar': return <Calendar className="h-4 w-4" />;
      case 'CheckCircle': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={`h-full ${isMobile ? 'p-2' : 'p-6'} overflow-auto bg-gray-50 dark:bg-gray-950`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Executive Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Real-time overview of your manufacturing operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTimeRange('today')}
              className={selectedTimeRange === 'today' ? 'bg-primary text-primary-foreground' : ''}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTimeRange('week')}
              className={selectedTimeRange === 'week' ? 'bg-primary text-primary-foreground' : ''}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTimeRange('month')}
              className={selectedTimeRange === 'month' ? 'bg-primary text-primary-foreground' : ''}
            >
              This Month
            </Button>
          </div>
        </div>
      </div>

      {/* Federation Status Card */}
      {federationStatus === 'ready' && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Federation Modules</CardTitle>
              <Link to="/federation-dashboard">
                <Button size="sm" variant="ghost">
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">8 Modules Active</span>
              </div>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Sync
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Optimization Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                12%
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.utilization || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics?.utilization || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.qualityRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                0.3%
              </span>{" "}
              improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                8.2%
              </span>{" "}
              growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.onTimeDelivery || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics?.onTimeDelivery || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgLeadTime || 0} days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-500 inline-flex items-center">
                <ArrowDown className="h-3 w-3 mr-1" />
                0.5 days
              </span>{" "}
              reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Operations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.overdueOperations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed sections */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="quicklinks">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(alert.timestamp), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
                    {getActivityIcon(activity.icon)}
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">by {activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quicklinks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/production-scheduler">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Production Scheduler
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View and manage production schedules
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analytics
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deep dive into performance metrics
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/control-tower">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Control Tower
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor and control operations
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/master-data-management">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Master Data
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage products, resources, and customers
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Reports
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate and view reports
                  </p>
                </CardContent>
              </Card>
            </Link>

            {hasPermission('ai-assistant', 'view') && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      AI Assistant
                    </span>
                    <Badge className="bg-purple-600">AI</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get intelligent insights and recommendations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}