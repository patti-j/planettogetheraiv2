import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Target, TrendingUp, AlertTriangle, Users, Plus, BarChart3, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SmartKpiDashboardData {
  activeKpis: number;
  criticalAlerts: number;
  improvementsInProgress: number;
  targetAchievement: number;
  kpisByCategory: Array<{ category: string; count: number; avgPerformance: number }>;
  recentMeetings: Array<{
    id: number;
    title: string;
    meetingType: string;
    scheduledDate: string;
    organizerId: number;
  }>;
  urgentActions: Array<{ type: string; description: string; dueDate: string }>;
}

interface SmartKpiDefinition {
  id: number;
  name: string;
  description: string;
  category: string;
  businessStrategy: string;
  measurementUnit: string;
  calculationMethod: string;
  targetDirection: string;
  isActive: boolean;
  createdAt: string;
}

interface SmartKpiAlert {
  id: number;
  kpiDefinitionId: number;
  severity: string;
  alertType: string;
  message: string;
  status: string;
  triggeredAt: string;
}

export default function SmartKpiTrackingPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<SmartKpiDashboardData>({
    queryKey: ["/api/smart-kpi-analytics/dashboard"],
    enabled: activeTab === "dashboard"
  });

  // Fetch KPI definitions
  const { data: kpiDefinitions = [], isLoading: isKpisLoading } = useQuery<SmartKpiDefinition[]>({
    queryKey: ["/api/smart-kpi-definitions"],
    enabled: activeTab === "kpis"
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery<SmartKpiAlert[]>({
    queryKey: ["/api/smart-kpi-alerts"],
    enabled: activeTab === "alerts"
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "Cost Leadership": return "bg-blue-100 text-blue-800";
      case "Customer Service Excellence": return "bg-green-100 text-green-800";
      case "Innovation & Growth": return "bg-purple-100 text-purple-800";
      case "Environmental Sustainability": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isDashboardLoading && activeTab === "dashboard") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart KPI Tracking</h1>
          <p className="text-muted-foreground">Monitor and improve KPIs based on meetings and business goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add KPI
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active KPIs</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.activeKpis}</div>
                    <p className="text-xs text-muted-foreground">Tracking performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{dashboardData.criticalAlerts}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardData.targetAchievement}%</div>
                    <Progress value={dashboardData.targetAchievement} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Improvements</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.improvementsInProgress}</div>
                    <p className="text-xs text-muted-foreground">In progress</p>
                  </CardContent>
                </Card>
              </div>

              {/* KPIs by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    KPIs by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.kpisByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{category.category}</div>
                          <Badge variant="outline">{category.count} KPIs</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Avg Performance:</div>
                          <div className="font-medium">{category.avgPerformance}%</div>
                          <Progress value={category.avgPerformance} className="w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Meetings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Meetings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.recentMeetings.map((meeting) => (
                        <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{meeting.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {meeting.meetingType} • {format(new Date(meeting.scheduledDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Urgent Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Urgent Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.urgentActions.map((action, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{action.type}</div>
                                <div className="text-sm">{action.description}</div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Due: {format(new Date(action.dueDate), 'MMM d')}
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">KPI Definitions</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New KPI
            </Button>
          </div>

          {isKpisLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kpiDefinitions.map((kpi) => (
                <Card key={kpi.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{kpi.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                      </div>
                      <Badge variant={kpi.isActive ? "default" : "secondary"}>
                        {kpi.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{kpi.category}</Badge>
                      <Badge className={getStrategyColor(kpi.businessStrategy)}>
                        {kpi.businessStrategy}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Unit</div>
                        <div className="text-muted-foreground">{kpi.measurementUnit}</div>
                      </div>
                      <div>
                        <div className="font-medium">Direction</div>
                        <div className="text-muted-foreground">{kpi.targetDirection}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button variant="outline" size="sm">View Performance</Button>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">KPI Meetings</h2>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Meeting management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">KPI Alerts</h2>
            <Button variant="outline">Mark All Read</Button>
          </div>

          {isAlertsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{alert.alertType}</Badge>
                          <Badge variant={alert.status === "open" ? "destructive" : "secondary"}>
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-muted-foreground">
                          Triggered: {format(new Date(alert.triggeredAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === "open" && (
                          <>
                            <Button variant="outline" size="sm">Acknowledge</Button>
                            <Button size="sm">Resolve</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No alerts found. Great job maintaining your KPIs!
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}