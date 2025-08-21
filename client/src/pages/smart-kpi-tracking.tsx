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
  Sparkles, HandshakeIcon, GraduationCap, Flag,
  Edit, Save, X, User, Crown, Shield, UserPlus,
  Search, Filter, SortAsc, MoreHorizontal
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  businessGoalId?: number; // Optional relationship to business goals
  targetValue: number;
  targetPeriod: string;
  periodStartDate: string;
  periodEndDate: string;
  targetType: string;
  baselineValue: number;
  stretchTarget: number;
  minimumAcceptable: number;
  contributionToGoal?: string; // How this KPI supports the business goal
  goalWeight?: number; // Weight percentage this KPI contributes to the business goal (0-100)
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

// Form schema for creating KPI targets
const createTargetSchema = z.object({
  kpiDefinitionId: z.number(),
  targetValue: z.number().min(0, "Target value must be positive"),
  period: z.string().min(1, "Please select a period"),
  businessGoalId: z.number().optional(),
  notes: z.string().optional()
});

type CreateTargetFormData = z.infer<typeof createTargetSchema>;

export default function SmartKpiTrackingPage() {
  const [activeTab, setActiveTab] = useState("realtime");
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedKpi, setSelectedKpi] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  // Fetch business goals for relationship tracking
  const { data: businessGoals = [] } = useQuery({
    queryKey: ["/api/business-goals"],
    select: (data) => data.filter((goal: any) => goal.status === 'active')
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

  // Create target mutation
  const createTargetMutation = useMutation({
    mutationFn: async (data: CreateTargetFormData) => {
      const response = await fetch("/api/smart-kpi-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          setBy: 1, // Current user ID - would be from auth context
          status: "active",
          setDate: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error("Failed to create target");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-kpi-targets"] });
      toast({ title: "Target created", description: "New KPI target has been set successfully." });
      setCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create target. Please try again." });
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

  // Get business goal information for a KPI target
  const getBusinessGoalForKpi = (kpiTarget: SmartKpiTarget) => {
    if (!kpiTarget.businessGoalId) return null;
    return businessGoals.find((goal: any) => goal.id === kpiTarget.businessGoalId);
  };

  // Get all KPIs linked to business goals
  const getKpisLinkedToGoals = () => {
    return targets.filter(target => target.businessGoalId).map(target => {
      const kpiDef = kpiDefinitions.find(kpi => kpi.id === target.kpiDefinitionId);
      const businessGoal = getBusinessGoalForKpi(target);
      const performance = calculateKpiPerformance(target.kpiDefinitionId);
      
      return {
        target,
        kpiDefinition: kpiDef,
        businessGoal,
        performance,
        contributionToGoal: target.contributionToGoal,
        goalWeight: target.goalWeight
      };
    }).filter(item => item.kpiDefinition && item.businessGoal);
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 flex items-center">
              <Target className="w-6 h-6 mr-2" />
              SMART KPI Performance Center
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Real-time factory performance management, accountability tracking, and success celebration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm">
              <Bell className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Subscribe to Alerts</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full mb-6">
          <TabsTrigger value="realtime" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Real-Time</span>
            <span className="sm:hidden">Live</span>
          </TabsTrigger>
          <TabsTrigger value="accountability" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Accountability</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Management</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
          <TabsTrigger value="celebrations" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Celebrations</span>
            <span className="sm:hidden">Wins</span>
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Learning</span>
            <span className="sm:hidden">Learn</span>
          </TabsTrigger>
          <TabsTrigger value="improvements" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Improvements</span>
            <span className="sm:hidden">Improve</span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-1 px-2 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Meetings</span>
            <span className="sm:hidden">Meet</span>
          </TabsTrigger>
        </TabsList>

        {/* Real-Time Performance Tab */}
        <TabsContent value="realtime" className="space-y-4 pb-6">
          {/* Live Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">On Track</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  {kpiDefinitions.filter(kpi => {
                    const perf = calculateKpiPerformance(kpi.id);
                    return perf?.status === "on-track";
                  }).length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">KPIs meeting targets</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">At Risk</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">
                  {kpiDefinitions.filter(kpi => {
                    const perf = calculateKpiPerformance(kpi.id);
                    return perf?.status === "at-risk";
                  }).length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Critical</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === "critical").length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Immediate action required</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Overall Health</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                  {dashboardData?.targetAchievement || 0}%
                </div>
                <Progress value={dashboardData?.targetAchievement || 0} className="mt-1 sm:mt-2 h-1 sm:h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Live KPI Grid */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 animate-pulse" />
                Live KPI Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Real-time monitoring updated every {refreshInterval/1000} seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {kpiDefinitions.map(kpi => {
                  const performance = calculateKpiPerformance(kpi.id);
                  const level = performance ? getPerformanceLevel(performance.performance) : null;
                  
                  return (
                    <div key={kpi.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm truncate">{kpi.name}</h4>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{kpi.category}</p>
                        </div>
                        {performance && (
                          <Badge 
                            variant={performance.status === "on-track" ? "default" : performance.status === "at-risk" ? "secondary" : "destructive"}
                            className="text-[10px] sm:text-xs ml-2"
                          >
                            {performance.status.replace("-", " ")}
                          </Badge>
                        )}
                      </div>
                      
                      {performance ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-lg sm:text-xl md:text-2xl font-bold">{performance.actual}</span>
                              <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">/ {performance.target} {kpi.measurementUnit}</span>
                            </div>
                            <div className={cn("text-sm sm:text-base md:text-lg font-bold", level?.color)}>
                              {level?.icon} {performance.performance}%
                            </div>
                          </div>
                          <Progress value={Math.min(performance.performance, 100)} className="h-1.5 sm:h-2" />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              Gap: {performance.gap > 0 ? "+" : ""}{performance.gap.toFixed(1)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              Target: {kpi.targetDirection}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-3 sm:py-4 text-muted-foreground">
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2" />
                          <p className="text-[10px] sm:text-xs">Awaiting data</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Business Goal Alignment Section */}
          {getKpisLinkedToGoals().length > 0 && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Business Goal Alignment
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  KPIs linked to strategic business objectives and their contribution tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  {getKpisLinkedToGoals().map((kpiData) => {
                    const { target, kpiDefinition, businessGoal, performance, contributionToGoal, goalWeight } = kpiData;
                    
                    return (
                      <div key={target.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* KPI Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-sm">{kpiDefinition?.name}</h4>
                              {performance && (
                                <Badge 
                                  variant={performance.status === "on-track" ? "default" : performance.status === "at-risk" ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {performance.status.replace("-", " ")}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Business Goal Link */}
                            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-2">
                              <Flag className="h-3 w-3" />
                              <span className="font-medium">→ {businessGoal?.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {businessGoal?.category}
                              </Badge>
                            </div>
                            
                            {/* Contribution Details */}
                            {contributionToGoal && (
                              <p className="text-xs text-muted-foreground mb-2 italic">
                                "{contributionToGoal}"
                              </p>
                            )}
                            
                            {/* Weight & Performance */}
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Weight:</span>
                                <span className="font-medium">{goalWeight}%</span>
                              </div>
                              {performance && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Performance:</span>
                                  <span className="font-medium">{performance.actual} / {performance.target} {kpiDefinition?.measurementUnit}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Performance Visual */}
                          {performance && (
                            <div className="flex flex-col items-center text-center min-w-[80px]">
                              <div className={cn("text-2xl font-bold mb-1", 
                                performance.status === "on-track" ? "text-green-600" : 
                                performance.status === "at-risk" ? "text-yellow-600" : "text-red-600"
                              )}>
                                {performance.performance}%
                              </div>
                              <Progress 
                                value={Math.min(performance.performance, 100)} 
                                className="w-16 h-2 mb-1" 
                              />
                              <span className="text-xs text-muted-foreground">
                                Goal Achievement
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{getKpisLinkedToGoals().length}</div>
                      <div className="text-xs text-muted-foreground">Linked KPIs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {getKpisLinkedToGoals().filter(k => k.performance?.status === "on-track").length}
                      </div>
                      <div className="text-xs text-muted-foreground">On Track</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">
                        {getKpisLinkedToGoals().filter(k => k.performance?.status === "at-risk").length}
                      </div>
                      <div className="text-xs text-muted-foreground">At Risk</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(getKpisLinkedToGoals().reduce((sum, k) => sum + (k.goalWeight || 0), 0) / Math.max(getKpisLinkedToGoals().length, 1))}%
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Weight</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
        <TabsContent value="accountability" className="space-y-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Team Performance Leaderboard */}
            <Card className="md:col-span-2">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  Team Performance Accountability
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Individual and team performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {teamMembers
                    .sort((a, b) => b.performance - a.performance)
                    .map((member, index) => {
                      const level = getPerformanceLevel(member.performance);
                      return (
                        <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 border rounded-lg gap-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground">
                              #{index + 1}
                            </div>
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-xs sm:text-sm">{member.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{member.role}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.achievements.map(achievement => (
                                  <Badge key={achievement} variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1 py-0">
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-auto sm:ml-0">
                            <div className={cn("text-lg sm:text-xl md:text-2xl font-bold", level.color)}>
                              {level.icon} {member.performance}%
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[10px] sm:text-xs text-muted-foreground">
                              <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />
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
                    const owner = kpi.ownerId ? teamMembers.find(m => m.id === kpi.ownerId) || teamMembers[0] : teamMembers[0];
                    return (
                      <div key={kpi.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{kpi.name}</p>
                          <p className="text-xs text-muted-foreground">{owner?.name || 'Unassigned'}</p>
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
                  const assignee = improvement.assignedTo ? teamMembers.find(m => m.id === improvement.assignedTo) || teamMembers[0] : teamMembers[0];
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
                              {assignee?.name || 'Unassigned'}
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

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4 pb-6">
          {/* KPI Ownership Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* KPI Owners Management */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  KPI Ownership Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Assign and manage who owns each KPI definition
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search KPIs..." 
                        className="pl-8 text-sm"
                      />
                    </div>
                    <Select>
                      <SelectTrigger className="w-[140px] text-sm">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="efficiency">Efficiency</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {kpiDefinitions.map(kpi => {
                    const owner = kpi.ownerId ? teamMembers.find(m => m.id === kpi.ownerId) || teamMembers[0] : teamMembers[0];
                    return (
                      <div key={kpi.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">{kpi.name}</h4>
                              <Badge variant="outline" className="text-[10px]">
                                {kpi.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {kpi.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {owner?.name ? owner.name.split(' ').map(n => n[0]).join('') : 'NA'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{owner?.name || 'Unassigned'}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full text-sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign New KPI Owner
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Target Management */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Target Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage target setting authority and approval workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  {/* Target Approval Process */}
                  <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Target Approval Workflow
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Target Setter</span>
                        <Badge variant="secondary">KPI Owner</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Approval Required</span>
                        <Badge variant="outline">Plant Manager</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Final Authority</span>
                        <Badge>Operations Director</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Recent Target Changes */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Recent Target Changes</h4>
                    <div className="space-y-2">
                      {targets.slice(0, 3).map(target => {
                        const kpi = kpiDefinitions.find(k => k.id === target.kpiDefinitionId);
                        // Since target doesn't have setBy property, we'll use a default team member or show "System"
                        const setter = teamMembers[0]; // Use first team member as default
                        
                        return (
                          <div key={target.id} className="border rounded-lg p-2 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{kpi?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Target: {target.targetValue} {kpi?.measurementUnit}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={target.status === "active" ? "default" : "secondary"} className="text-[10px]">
                                  {target.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Set by {setter?.name || 'System'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button className="w-full text-sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Set New Target
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ownership Overview */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Ownership Overview & Analytics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete view of KPI ownership distribution and accountability metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ownership Distribution */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Ownership Distribution</h4>
                  {teamMembers.slice(0, 5).map(member => {
                    const ownedKpis = kpiDefinitions.filter(kpi => kpi.ownerId === member.id).length;
                    return (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {ownedKpis} KPIs
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Performance by Owner */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Performance by Owner</h4>
                  {teamMembers.slice(0, 5).map(member => {
                    const ownedKpis = kpiDefinitions.filter(kpi => kpi.ownerId === member.id);
                    const avgPerformance = ownedKpis.length > 0 
                      ? ownedKpis.reduce((acc, kpi) => {
                          const perf = calculateKpiPerformance(kpi.id);
                          return acc + (perf?.performance || 0);
                        }, 0) / ownedKpis.length 
                      : 0;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between">
                        <span className="text-sm">{member.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(avgPerformance, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{Math.round(avgPerformance)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Accountability Metrics */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Accountability Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Targets Set</span>
                      <Badge variant="default">{targets.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Targets Achieved</span>
                      <Badge variant="default">
                        {targets.filter(t => t.status === "active").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Pending Approvals</span>
                      <Badge variant="secondary">
                        {targets.filter(t => !t.approvedBy).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Overdue Reviews</span>
                      <Badge variant="destructive">2</Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full text-sm mt-3">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Celebrations Tab */}
        <TabsContent value="celebrations" className="space-y-4 pb-6">
          {/* Success Stories */}
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-600" />
                Today's Wins & Celebrations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Recognizing excellence and achievement across the factory floor
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <h3 className="font-semibold text-xs sm:text-sm">Star Performer</h3>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                      <AvatarFallback className="text-xs sm:text-sm">EC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">Emily Davis</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">Achieved 100% First Pass Yield</p>
                      <Badge className="mt-1 text-[9px] sm:text-[10px] px-1 sm:px-2" variant="default">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Perfect Quality
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    <h3 className="font-semibold text-xs sm:text-sm">Longest Streak</h3>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                      <AvatarFallback className="text-xs sm:text-sm">SC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">Sarah Chen</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">7 days meeting all targets</p>
                      <Badge className="mt-1 text-[9px] sm:text-[10px] px-1 sm:px-2" variant="default">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Consistency Champion
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    <h3 className="font-semibold text-xs sm:text-sm">Most Improved</h3>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                      <AvatarFallback className="text-xs sm:text-sm">TW</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">Tom Wilson</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">+15% performance this week</p>
                      <Badge className="mt-1 text-[9px] sm:text-[10px] px-1 sm:px-2" variant="default">
                        <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Rising Star
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <HandshakeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    <h3 className="font-semibold text-xs sm:text-sm">Team Player</h3>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                      <AvatarFallback className="text-xs sm:text-sm">MJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">Mike Johnson</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">Helped 3 teams hit targets</p>
                      <Badge className="mt-1 text-[9px] sm:text-[10px] px-1 sm:px-2" variant="default">
                        <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
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
        <TabsContent value="learning" className="space-y-4 pb-6">
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
        <TabsContent value="improvements" className="space-y-4 pb-6">
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
        <TabsContent value="meetings" className="space-y-4 pb-6">
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

      {/* Create Target Dialog */}
      <CreateTargetDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        kpiDefinitions={kpiDefinitions}
        businessGoals={businessGoals}
        onSubmit={(data) => createTargetMutation.mutate(data)}
        isLoading={createTargetMutation.isPending}
      />
    </div>
  );
}

// Create Target Dialog Component
function CreateTargetDialog({
  open,
  onOpenChange,
  kpiDefinitions,
  businessGoals,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiDefinitions: SmartKpiDefinition[];
  businessGoals: any[];
  onSubmit: (data: CreateTargetFormData) => void;
  isLoading: boolean;
}) {
  const form = useForm<CreateTargetFormData>({
    resolver: zodResolver(createTargetSchema),
    defaultValues: {
      targetValue: 0,
      period: "",
      notes: ""
    }
  });

  const handleSubmit = (data: CreateTargetFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set New KPI Target</DialogTitle>
          <DialogDescription>
            Define a new target for a KPI to track performance
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kpiDefinitionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KPI</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select KPI" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kpiDefinitions.map((kpi) => (
                        <SelectItem key={kpi.id} value={kpi.id.toString()}>
                          {kpi.name} ({kpi.measurementUnit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter target value"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Period</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessGoalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Business Goal (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No business goal</SelectItem>
                      {businessGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id.toString()}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes or context" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Target"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}