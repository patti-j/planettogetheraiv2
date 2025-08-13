import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Target, TrendingUp, AlertTriangle, Calendar, Users, 
  CheckCircle2, XCircle, Clock, BarChart3, Brain,
  Trophy, Zap, MessageSquare, Plus, Settings,
  Award, Flame, Star, ArrowUp, ArrowDown, Minus,
  Bell, UserCheck, Activity, RefreshCw, Eye,
  Sparkles, HandshakeIcon, GraduationCap, Flag
} from "lucide-react";
import { format, formatDistanceToNow, isToday, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Performance levels for gamification
const PERFORMANCE_LEVELS = {
  bronze: { min: 0, max: 69, color: "text-orange-600", icon: "🥉", label: "Bronze" },
  silver: { min: 70, max: 84, color: "text-gray-500", icon: "🥈", label: "Silver" },
  gold: { min: 85, max: 94, color: "text-yellow-500", icon: "🥇", label: "Gold" },
  platinum: { min: 95, max: 100, color: "text-purple-600", icon: "💎", label: "Platinum" }
};

function getPerformanceLevel(score: number) {
  if (score >= 95) return PERFORMANCE_LEVELS.platinum;
  if (score >= 85) return PERFORMANCE_LEVELS.gold;
  if (score >= 70) return PERFORMANCE_LEVELS.silver;
  return PERFORMANCE_LEVELS.bronze;
}

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
    status: string;
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
  thresholdCritical: number;
  thresholdWarning: number;
  ownerId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SmartKpiTarget {
  id: number;
  kpiDefinitionId: number;
  targetValue: number;
  targetPeriod: string;
  periodStartDate: string;
  periodEndDate: string;
  targetType: string;
  baselineValue: number;
  stretchTarget: number;
  minimumAcceptable: number;
  status: string;
}

interface SmartKpiActual {
  id: number;
  kpiDefinitionId: number;
  actualValue: number;
  measurementDate: string;
  measurementPeriod: string;
  collectionMethod: string;
  isValidated: boolean;
  confidenceLevel: string;
  notes?: string;
}

interface SmartKpiAlert {
  id: number;
  kpiDefinitionId: number;
  severity: string;
  alertType: string;
  message: string;
  status: string;
  triggerValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
}

interface SmartKpiImprovement {
  id: number;
  kpiDefinitionId: number;
  title: string;
  description: string;
  improvementType: string;
  identifiedDate: string;
  expectedImpact: number;
  assignedTo: number;
  targetCompletionDate: string;
  priority: string;
  status: string;
  investmentRequired?: number;
  roiProjection?: number;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  performance: number;
  streak: number;
  achievements: string[];
}

export default function SmartKpiTrackingPage() {
  const [activeTab, setActiveTab] = useState("realtime");
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedKpi, setSelectedKpi] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Auto-refresh for real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "realtime") {
        queryClient.invalidateQueries({ queryKey: ["/api/smart-kpi-analytics/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/smart-kpi-actuals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/smart-kpi-alerts"] });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, activeTab, queryClient]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<SmartKpiDashboardData>({
    queryKey: ["/api/smart-kpi-analytics/dashboard"],
    refetchInterval: activeTab === "realtime" ? refreshInterval : false
  });

  // Fetch KPI definitions
  const { data: kpiDefinitions = [], isLoading: isKpisLoading } = useQuery<SmartKpiDefinition[]>({
    queryKey: ["/api/smart-kpi-definitions"]
  });

  // Fetch current targets
  const { data: targets = [] } = useQuery<SmartKpiTarget[]>({
    queryKey: ["/api/smart-kpi-targets", { status: "active" }]
  });

  // Fetch today's actuals
  const { data: todayActuals = [] } = useQuery<SmartKpiActual[]>({
    queryKey: ["/api/smart-kpi-actuals", { 
      startDate: startOfDay(new Date()).toISOString(),
      endDate: endOfDay(new Date()).toISOString()
    }],
    refetchInterval: activeTab === "realtime" ? refreshInterval : false
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery<SmartKpiAlert[]>({
    queryKey: ["/api/smart-kpi-alerts", { status: "open" }],
    refetchInterval: activeTab === "realtime" ? refreshInterval : false
  });

  // Fetch improvements
  const { data: improvements = [] } = useQuery<SmartKpiImprovement[]>({
    queryKey: ["/api/smart-kpi-improvements", { status: "in_progress" }]
  });

  // Mock team performance data (would be fetched from API)
  const teamMembers: TeamMember[] = [
    { id: 1, name: "Sarah Chen", role: "Production Manager", performance: 92, streak: 5, achievements: ["5-Day Streak", "Quality Champion"] },
    { id: 2, name: "Mike Johnson", role: "Line Supervisor", performance: 88, streak: 3, achievements: ["Efficiency Expert"] },
    { id: 3, name: "Emily Davis", role: "Quality Lead", performance: 95, streak: 7, achievements: ["Perfect Week", "Zero Defects"] },
    { id: 4, name: "Tom Wilson", role: "Shift Leader", performance: 79, streak: 1, achievements: ["Rising Star"] }
  ];

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/smart-kpi-alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-kpi-alerts"] });
      toast({ title: "Alert acknowledged", description: "The alert has been marked as acknowledged." });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getTrendIcon = (current: number, previous: number, targetDirection: string) => {
    if (current > previous) {
      return targetDirection === "higher" ? 
        <ArrowUp className="h-4 w-4 text-green-500" /> : 
        <ArrowDown className="h-4 w-4 text-red-500" />;
    } else if (current < previous) {
      return targetDirection === "lower" ? 
        <ArrowUp className="h-4 w-4 text-green-500" /> : 
        <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Calculate real-time KPI performance
  const calculateKpiPerformance = (kpiId: number) => {
    const actual = todayActuals.find(a => a.kpiDefinitionId === kpiId);
    const target = targets.find(t => t.kpiDefinitionId === kpiId);
    
    if (!actual || !target) return null;
    
    const performance = (actual.actualValue / target.targetValue) * 100;
    const gap = actual.actualValue - target.targetValue;
    
    return {
      actual: actual.actualValue,
      target: target.targetValue,
      performance: Math.round(performance),
      gap: gap,
      status: performance >= 100 ? "on-track" : performance >= 90 ? "at-risk" : "off-track"
    };
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart KPI Performance Center</h1>
            <p className="text-muted-foreground">
              Real-time factory performance management, accountability tracking, and success celebration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Subscribe to Alerts
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="realtime" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="accountability" className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            Accountability
          </TabsTrigger>
          <TabsTrigger value="celebrations" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Celebrations
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="improvements" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Improvements
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Meetings
          </TabsTrigger>
        </TabsList>

        {/* Real-Time Performance Tab */}
        <TabsContent value="realtime" className="space-y-4">
          {/* Live Performance Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">On Track</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {kpiDefinitions.filter(kpi => {
                    const perf = calculateKpiPerformance(kpi.id);
                    return perf?.status === "on-track";
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">KPIs meeting targets</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {kpiDefinitions.filter(kpi => {
                    const perf = calculateKpiPerformance(kpi.id);
                    return perf?.status === "at-risk";
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === "critical").length}
                </div>
                <p className="text-xs text-muted-foreground">Immediate action required</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.targetAchievement || 0}%
                </div>
                <Progress value={dashboardData?.targetAchievement || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Live KPI Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                Live KPI Performance
              </CardTitle>
              <CardDescription>
                Real-time monitoring updated every {refreshInterval/1000} seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {kpiDefinitions.map(kpi => {
                  const performance = calculateKpiPerformance(kpi.id);
                  const level = performance ? getPerformanceLevel(performance.performance) : null;
                  
                  return (
                    <div key={kpi.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{kpi.name}</h4>
                          <p className="text-xs text-muted-foreground">{kpi.category}</p>
                        </div>
                        {performance && (
                          <Badge variant={performance.status === "on-track" ? "default" : performance.status === "at-risk" ? "secondary" : "destructive"}>
                            {performance.status.replace("-", " ")}
                          </Badge>
                        )}
                      </div>
                      
                      {performance ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{performance.actual}</span>
                              <span className="text-sm text-muted-foreground">/ {performance.target} {kpi.measurementUnit}</span>
                            </div>
                            <div className={cn("text-lg font-bold", level?.color)}>
                              {level?.icon} {performance.performance}%
                            </div>
                          </div>
                          <Progress value={Math.min(performance.performance, 100)} className="h-2" />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              Gap: {performance.gap > 0 ? "+" : ""}{performance.gap.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Target: {kpi.targetDirection}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Awaiting data</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {alerts.map(alert => (
                      <Alert key={alert.id} className={cn(
                        "cursor-pointer hover:shadow-md transition-shadow",
                        alert.severity === "critical" && "border-red-500"
                      )}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center justify-between">
                          <span>{alert.message}</span>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="flex justify-between items-center mt-2">
                          <span className="text-xs">
                            Triggered {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                          </span>
                          {alert.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Accountability Tab */}
        <TabsContent value="accountability" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Team Performance Leaderboard */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Team Performance Accountability
                </CardTitle>
                <CardDescription>
                  Individual and team performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers
                    .sort((a, b) => b.performance - a.performance)
                    .map((member, index) => {
                      const level = getPerformanceLevel(member.performance);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-muted-foreground">
                              #{index + 1}
                            </div>
                            <Avatar>
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                              <div className="flex gap-1 mt-1">
                                {member.achievements.map(achievement => (
                                  <Badge key={achievement} variant="outline" className="text-xs">
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-2xl font-bold", level.color)}>
                              {level.icon} {member.performance}%
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {member.streak} day streak
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Ownership Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  KPI Ownership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kpiDefinitions.slice(0, 5).map(kpi => {
                    const owner = teamMembers[kpi.ownerId % teamMembers.length];
                    return (
                      <div key={kpi.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{kpi.name}</p>
                          <p className="text-xs text-muted-foreground">{owner.name}</p>
                        </div>
                        <Badge variant="outline">{kpi.businessStrategy}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Actions Accountability */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Actions Tracking</CardTitle>
              <CardDescription>
                Who's responsible for what improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvements.map(improvement => {
                  const assignee = teamMembers[improvement.assignedTo % teamMembers.length];
                  const daysUntilDue = Math.ceil((new Date(improvement.targetCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={improvement.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{improvement.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{improvement.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm">
                              <UserCheck className="h-3 w-3" />
                              {assignee.name}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {daysUntilDue > 0 ? `${daysUntilDue} days left` : "Overdue"}
                            </div>
                            <Badge variant={improvement.priority === "high" ? "destructive" : improvement.priority === "medium" ? "secondary" : "outline"}>
                              {improvement.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">Expected Impact</div>
                          <div className="text-2xl font-bold text-green-600">+{improvement.expectedImpact}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Celebrations Tab */}
        <TabsContent value="celebrations" className="space-y-4">
          {/* Success Stories */}
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                Today's Wins & Celebrations
              </CardTitle>
              <CardDescription>
                Recognizing excellence and achievement across the factory floor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Star Performer</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>EC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Emily Davis</p>
                      <p className="text-sm text-muted-foreground">Achieved 100% First Pass Yield</p>
                      <Badge className="mt-1" variant="default">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Perfect Quality
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">Longest Streak</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Sarah Chen</p>
                      <p className="text-sm text-muted-foreground">7 days meeting all targets</p>
                      <Badge className="mt-1" variant="default">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Consistency Champion
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Most Improved</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>TW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Tom Wilson</p>
                      <p className="text-sm text-muted-foreground">+15% performance this week</p>
                      <Badge className="mt-1" variant="default">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Rising Star
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <HandshakeIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Team Player</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Mike Johnson</p>
                      <p className="text-sm text-muted-foreground">Helped 3 teams hit targets</p>
                      <Badge className="mt-1" variant="default">
                        <Users className="h-3 w-3 mr-1" />
                        Collaboration Hero
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements & Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Production Line A - New Record!</AlertTitle>
                  <AlertDescription>
                    Achieved highest OEE score of 92% - beating previous record by 5%
                  </AlertDescription>
                </Alert>
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Quality Team - Zero Defects Week</AlertTitle>
                  <AlertDescription>
                    First time achieving zero defects for an entire week across all products
                  </AlertDescription>
                </Alert>
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertTitle>Energy Team - Sustainability Goal Met</AlertTitle>
                  <AlertDescription>
                    Reduced energy consumption by 18% this month, exceeding target by 3%
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Learning from Performance Data
              </CardTitle>
              <CardDescription>
                Key insights and lessons learned from KPI trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Best Practices */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Best Practices Identified</h3>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Morning Huddles Impact</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Teams with daily morning huddles show 15% better KPI performance
                      </p>
                      <Badge className="mt-2" variant="outline">
                        <Brain className="h-3 w-3 mr-1" />
                        Insight
                      </Badge>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Preventive Maintenance</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Regular PM reduces downtime by 40% and improves OEE by 8%
                      </p>
                      <Badge className="mt-2" variant="outline">
                        <Brain className="h-3 w-3 mr-1" />
                        Proven
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Lessons Learned */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Recent Lessons Learned</h3>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Shift Handover Quality</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Poor handovers led to 3 quality issues - new checklist implemented
                      </p>
                      <Badge className="mt-2" variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Corrected
                      </Badge>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Material Flow Optimization</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reorganizing material flow reduced waste by 25% in Line B
                      </p>
                      <Badge className="mt-2" variant="secondary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Recommendations */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                  Recommended Training Based on KPI Gaps
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quality Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">For teams below 90% FPY</p>
                      <Button size="sm" className="mt-2 w-full" variant="outline">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Enroll
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Efficiency Optimization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">For OEE below 85%</p>
                      <Button size="sm" className="mt-2 w-full" variant="outline">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Enroll
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Energy Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Sustainability focus</p>
                      <Button size="sm" className="mt-2 w-full" variant="outline">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Enroll
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Improvement Initiatives
              </CardTitle>
              <CardDescription>
                Continuous improvement projects driving KPI performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {improvements.map(improvement => {
                  const kpi = kpiDefinitions.find(k => k.id === improvement.kpiDefinitionId);
                  const progressDays = Math.round(
                    ((Date.now() - new Date(improvement.identifiedDate).getTime()) /
                    (new Date(improvement.targetCompletionDate).getTime() - new Date(improvement.identifiedDate).getTime())) * 100
                  );
                  
                  return (
                    <div key={improvement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{improvement.title}</h3>
                          <p className="text-sm text-muted-foreground">{improvement.description}</p>
                        </div>
                        <Badge variant={
                          improvement.status === "completed" ? "default" :
                          improvement.status === "in_progress" ? "secondary" :
                          "outline"
                        }>
                          {improvement.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Impact on KPI</p>
                          <p className="font-semibold">{kpi?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Impact</p>
                          <p className="font-semibold text-green-600">+{improvement.expectedImpact}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Investment</p>
                          <p className="font-semibold">${improvement.investmentRequired?.toLocaleString() || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ROI</p>
                          <p className="font-semibold">{improvement.roiProjection || 0}%</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{Math.min(progressDays, 100)}%</span>
                        </div>
                        <Progress value={Math.min(progressDays, 100)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                KPI Review Meetings
              </CardTitle>
              <CardDescription>
                Scheduled meetings for performance review and planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentMeetings.map(meeting => (
                  <div key={meeting.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{meeting.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(meeting.scheduledDate), "MMM d, yyyy h:mm a")}
                          </span>
                          <Badge variant="outline">{meeting.meetingType}</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-1" />
                Schedule KPI Review Meeting
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}