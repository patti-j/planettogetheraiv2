import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Target, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  Plus, Edit, Trash2, BarChart3, Users, Calendar, DollarSign,
  AlertCircle, Activity, Maximize2, Minimize2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { 
  BusinessGoal, GoalProgress, GoalRisk, GoalIssue, GoalKpi, GoalAction,
  InsertBusinessGoal, InsertGoalProgress, InsertGoalRisk, InsertGoalIssue, InsertGoalKpi, InsertGoalAction 
} from "@shared/schema";

export default function BusinessGoalsPage() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<BusinessGoal | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<GoalRisk | null>(null);
  const [editingIssue, setEditingIssue] = useState<GoalIssue | null>(null);
  const [formData, setFormData] = useState({
    goalTitle: "",
    goalDescription: "",
    goalType: "",
    priority: "medium",
    owner: "",
    startDate: "",
    targetDate: "",
    targetValue: "",
    targetUnit: "",
    category: "",
  });
  const [riskFormData, setRiskFormData] = useState({
    riskTitle: "",
    riskDescription: "",
    riskType: "operational",
    probability: "medium",
    impact: "medium",
    mitigation_plan: "",
    mitigation_owner: "",
    mitigation_deadline: "",
  });
  const [issueFormData, setIssueFormData] = useState({
    issueTitle: "",
    issueDescription: "",
    issueType: "blocker",
    severity: "medium",
    impact: "schedule",
    assignedTo: "",
    resolutionPlan: "",
    estimatedResolutionDate: "",
  });
  const queryClient = useQueryClient();

  // Fetch business goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/business-goals"],
  });

  // Fetch goal progress
  const { data: progressData = [] } = useQuery({
    queryKey: ["/api/goal-progress"],
  });

  // Fetch goal risks
  const { data: risks = [] } = useQuery({
    queryKey: ["/api/goal-risks"],
  });

  // Fetch goal issues
  const { data: issues = [] } = useQuery({
    queryKey: ["/api/goal-issues"],
  });

  // Fetch goal KPIs
  const { data: kpis = [] } = useQuery({
    queryKey: ["/api/goal-kpis"],
  });

  // Fetch goal actions
  const { data: actions = [] } = useQuery({
    queryKey: ["/api/goal-actions"],
  });

  // Fetch users for goal owner dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (goal: InsertBusinessGoal) =>
      apiRequest("POST", "/api/business-goals", goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-goals"] });
      setShowCreateForm(false);
      resetForm();
    }
  });

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (data: InsertGoalRisk) => {
      return await apiRequest("POST", "/api/goal-risks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-risks"] });
      setShowRiskForm(false);
      resetRiskForm();
    },
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (data: InsertGoalIssue) => {
      return await apiRequest("POST", "/api/goal-issues", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-issues"] });
      setShowIssueForm(false);
      resetIssueForm();
    },
  });

  // Update risk mutation
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GoalRisk> }) => {
      return await apiRequest("PUT", `/api/goal-risks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-risks"] });
      setShowRiskForm(false);
      resetRiskForm();
      setEditingRisk(null);
    },
  });

  // Update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GoalIssue> }) => {
      return await apiRequest("PUT", `/api/goal-issues/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-issues"] });
      setShowIssueForm(false);
      resetIssueForm();
      setEditingIssue(null);
    },
  });

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/goal-risks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-risks"] });
    },
  });

  // Delete issue mutation
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/goal-issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-issues"] });
    },
  });

  // Helper functions to reset forms
  const resetForm = () => {
    setFormData({
      goalTitle: "",
      goalDescription: "",
      goalType: "",
      priority: "medium",
      owner: "",
      startDate: "",
      targetDate: "",
      targetValue: "",
      targetUnit: "",
      category: "",
    });
  };

  const resetRiskForm = () => {
    setRiskFormData({
      riskTitle: "",
      riskDescription: "",
      riskType: "operational",
      probability: "medium",
      impact: "medium",
      mitigation_plan: "",
      mitigation_owner: "",
      mitigation_deadline: "",
    });
  };

  const resetIssueForm = () => {
    setIssueFormData({
      issueTitle: "",
      issueDescription: "",
      issueType: "blocker",
      severity: "medium",
      impact: "schedule",
      assignedTo: "",
      resolutionPlan: "",
      estimatedResolutionDate: "",
    });
  };

  // Handle form submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData: InsertBusinessGoal = {
      title: formData.goalTitle,
      description: formData.goalDescription,
      goalType: formData.goalType,
      priority: formData.priority as "low" | "medium" | "high" | "critical",
      owner: formData.owner,
      startDate: new Date(formData.startDate),
      targetDate: new Date(formData.targetDate),
      targetValue: parseFloat(formData.targetValue) || 0,
      unit: formData.targetUnit,
      category: formData.category,
      status: "active",
      timeframe: "quarterly",
      department: formData.category,
      createdBy: formData.owner,
    };
    createGoalMutation.mutate(goalData);
  };

  const handleRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    
    const riskData: InsertGoalRisk = {
      goalId: selectedGoal.id,
      riskTitle: riskFormData.riskTitle,
      riskDescription: riskFormData.riskDescription,
      riskType: riskFormData.riskType as "operational" | "financial" | "strategic" | "regulatory" | "competitive" | "technological",
      probability: riskFormData.probability as "low" | "medium" | "high",
      impact: riskFormData.impact as "low" | "medium" | "high" | "critical",
      severity: calculateRiskSeverity(riskFormData.probability, riskFormData.impact),
      mitigation_plan: riskFormData.mitigation_plan,
      mitigation_owner: riskFormData.mitigation_owner,
      mitigation_deadline: riskFormData.mitigation_deadline ? new Date(riskFormData.mitigation_deadline) : null,
      identifiedBy: formData.owner, // Using current user
    };

    if (editingRisk) {
      updateRiskMutation.mutate({ id: editingRisk.id, data: riskData });
    } else {
      createRiskMutation.mutate(riskData);
    }
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    
    const issueData: InsertGoalIssue = {
      goalId: selectedGoal.id,
      issueTitle: issueFormData.issueTitle,
      issueDescription: issueFormData.issueDescription,
      issueType: issueFormData.issueType as "blocker" | "delay" | "resource_constraint" | "quality" | "dependency" | "external",
      severity: issueFormData.severity as "low" | "medium" | "high" | "critical",
      impact: issueFormData.impact as "schedule" | "budget" | "quality" | "scope",
      assignedTo: issueFormData.assignedTo,
      resolutionPlan: issueFormData.resolutionPlan,
      estimatedResolutionDate: issueFormData.estimatedResolutionDate ? new Date(issueFormData.estimatedResolutionDate) : null,
      reportedBy: formData.owner, // Using current user
    };

    if (editingIssue) {
      updateIssueMutation.mutate({ id: editingIssue.id, data: issueData });
    } else {
      createIssueMutation.mutate(issueData);
    }
  };

  const calculateRiskSeverity = (probability: string, impact: string): number => {
    const probMap = { low: 1, medium: 2, high: 3 };
    const impactMap = { low: 1, medium: 2, high: 3, critical: 4 };
    return (probMap[probability as keyof typeof probMap] || 1) * (impactMap[impact as keyof typeof impactMap] || 1) * 10;
  };

  const openGoalDetails = (goal: BusinessGoal) => {
    setSelectedGoal(goal);
    setShowGoalDetails(true);
    setActiveTab("overview");
  };

  const openRiskForm = (risk?: GoalRisk) => {
    if (risk) {
      setEditingRisk(risk);
      setRiskFormData({
        riskTitle: risk.riskTitle,
        riskDescription: risk.riskDescription,
        riskType: risk.riskType,
        probability: risk.probability,
        impact: risk.impact,
        mitigation_plan: risk.mitigation_plan || "",
        mitigation_owner: risk.mitigation_owner || "",
        mitigation_deadline: risk.mitigation_deadline ? new Date(risk.mitigation_deadline).toISOString().split('T')[0] : "",
      });
    } else {
      setEditingRisk(null);
      resetRiskForm();
    }
    setShowRiskForm(true);
  };

  const openIssueForm = (issue?: GoalIssue) => {
    if (issue) {
      setEditingIssue(issue);
      setIssueFormData({
        issueTitle: issue.issueTitle,
        issueDescription: issue.issueDescription,
        issueType: issue.issueType,
        severity: issue.severity,
        impact: issue.impact,
        assignedTo: issue.assignedTo || "",
        resolutionPlan: issue.resolutionPlan || "",
        estimatedResolutionDate: issue.estimatedResolutionDate ? new Date(issue.estimatedResolutionDate).toISOString().split('T')[0] : "",
      });
    } else {
      setEditingIssue(null);
      resetIssueForm();
    }
    setShowIssueForm(true);
  };

  // Calculate goal metrics
  const goalMetrics = goals.reduce((acc: any, goal: BusinessGoal) => {
    const goalProgress = progressData.filter((p: GoalProgress) => p.goalId === goal.id);
    const latestProgress = goalProgress.sort((a: GoalProgress, b: GoalProgress) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    const currentProgress = latestProgress?.progressPercentage || 0;
    const progressPercent = Math.min(100, Math.max(0, currentProgress / 100));
    
    acc[goal.id] = {
      progress: progressPercent,
      risks: risks.filter((r: GoalRisk) => r.goalId === goal.id && r.status === 'active').length,
      issues: issues.filter((i: GoalIssue) => i.goalId === goal.id && i.status !== 'resolved').length,
      actions: actions.filter((a: GoalAction) => a.goalId === goal.id && a.status !== 'completed').length,
      kpis: kpis.filter((k: GoalKpi) => k.goalId === goal.id && k.status === 'active').length
    };
    return acc;
  }, {});

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "active": return "bg-blue-500";
      case "paused": return "bg-yellow-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const activeGoals = goals.filter((g: BusinessGoal) => g.status === 'active');
  const completedGoals = goals.filter((g: BusinessGoal) => g.status === 'completed');
  const highPriorityGoals = goals.filter((g: BusinessGoal) => ['high', 'critical'].includes(g.priority));
  const overdueGoals = goals.filter((g: BusinessGoal) => {
    const daysUntilTarget = getDaysUntilTarget(g.targetDate);
    const progress = goalMetrics[g.id]?.progress || 0;
    return daysUntilTarget < 0 && progress < 100;
  });

  const totalActiveRisks = risks.filter((r: GoalRisk) => r.status === 'active').length;
  const totalOpenIssues = issues.filter((i: GoalIssue) => i.status !== 'resolved').length;

  const containerClass = isMaximized 
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" 
    : "min-h-screen bg-gray-50 dark:bg-gray-900";

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading business goals...</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 md:ml-0 ml-12">
              <Target className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Business Goals & Strategy</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Define strategic objectives, track progress, and monitor risks that impact business success
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden md:flex"
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Goals</p>
                  <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Risks</p>
                  <p className="text-2xl font-bold text-red-600">{totalActiveRisks}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</p>
                  <p className="text-2xl font-bold text-orange-600">{totalOpenIssues}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(overdueGoals.length > 0 || totalActiveRisks > 0 || totalOpenIssues > 0) && (
          <div className="space-y-2">
            {overdueGoals.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {overdueGoals.length} goal(s) are overdue and require immediate attention
                </AlertDescription>
              </Alert>
            )}
            
            {totalActiveRisks > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {totalActiveRisks} active risk(s) may impact goal achievement
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map((goal: BusinessGoal) => {
            const metrics = goalMetrics[goal.id] || {};
            const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
            
            return (
              <Card key={goal.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => openGoalDetails(goal)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(goal.priority)} text-white`}>
                          {goal.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(goal.status)} text-white`}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{goal.category}</div>
                      <div className="font-medium">{goal.department}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {goal.description}
                  </p>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round((metrics.progress || 0) * 100)}%</span>
                    </div>
                    <Progress value={(metrics.progress || 0) * 100} className="h-2" />
                  </div>
                  
                  {/* Target Information */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <div className="font-medium">
                        {goal.unit === 'dollars' ? formatCurrency(goal.targetValue) : 
                         goal.unit === 'percentage' ? `${goal.targetValue / 100}%` :
                         `${goal.targetValue} ${goal.unit}`}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Timeline:</span>
                      <div className={`font-medium ${daysUntilTarget < 0 ? 'text-red-600' : daysUntilTarget < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysUntilTarget < 0 ? `${Math.abs(daysUntilTarget)} days overdue` :
                         daysUntilTarget === 0 ? 'Due today' :
                         `${daysUntilTarget} days remaining`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{metrics.risks || 0} risks</span>
                      <span>{metrics.issues || 0} issues</span>
                      <span>{metrics.actions || 0} actions</span>
                      <span>{metrics.kpis || 0} KPIs</span>
                    </div>
                    <span>{goal.owner}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Business Goals Defined
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start by creating strategic business goals to track progress and guide decision-making.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Goal Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Business Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="goalTitle" className="text-sm sm:text-base">Goal Title *</Label>
                <Input
                  id="goalTitle"
                  value={formData.goalTitle}
                  onChange={(e) => setFormData({...formData, goalTitle: e.target.value})}
                  placeholder="Enter goal title"
                  required
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="owner" className="text-sm sm:text-base">Goal Owner *</Label>
                <Select value={formData.owner} onValueChange={(value) => setFormData({...formData, owner: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.username || `${user.firstName} ${user.lastName}`.trim()}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="goalDescription">Description</Label>
              <Textarea
                id="goalDescription"
                value={formData.goalDescription}
                onChange={(e) => setFormData({...formData, goalDescription: e.target.value})}
                placeholder="Describe the goal and its purpose"
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="goalType" className="text-sm sm:text-base">Goal Type</Label>
                <Select value={formData.goalType} onValueChange={(value) => setFormData({...formData, goalType: value})}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-sm sm:text-base">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Production, Sales"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm sm:text-base">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="targetDate" className="text-sm sm:text-base">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="targetValue" className="text-sm sm:text-base">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  placeholder="100"
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="targetUnit" className="text-sm sm:text-base">Target Unit</Label>
                <Input
                  id="targetUnit"
                  value={formData.targetUnit}
                  onChange={(e) => setFormData({...formData, targetUnit: e.target.value})}
                  placeholder="e.g., %, units, $"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createGoalMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Details Dialog */}
      <Dialog open={showGoalDetails} onOpenChange={(open) => {
        setShowGoalDetails(open);
        if (!open) {
          setSelectedGoal(null);
          setActiveTab("overview");
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {selectedGoal?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="risks">
                    Risks ({risks.filter((r: GoalRisk) => r.goalId === selectedGoal.id && r.status === 'active').length})
                  </TabsTrigger>
                  <TabsTrigger value="issues">
                    Issues ({issues.filter((i: GoalIssue) => i.goalId === selectedGoal.id && i.status !== 'resolved').length})
                  </TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Goal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                            <p className="text-gray-900 dark:text-white">{selectedGoal.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner</p>
                              <p className="text-gray-900 dark:text-white">{selectedGoal.owner}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</p>
                              <Badge className={`${getPriorityColor(selectedGoal.priority)} text-white`}>
                                {selectedGoal.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                              <p className="text-gray-900 dark:text-white">{selectedGoal.category}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                              <Badge variant="outline">{selectedGoal.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Progress & Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(goalMetrics[selectedGoal.id]?.progress || 0)}%</span>
                            </div>
                            <Progress value={goalMetrics[selectedGoal.id]?.progress || 0} className="h-2" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</p>
                              <p className="text-gray-900 dark:text-white">
                                {new Date(selectedGoal.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Date</p>
                              <p className="text-gray-900 dark:text-white">
                                {new Date(selectedGoal.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Value</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedGoal.targetValue.toLocaleString()} {selectedGoal.unit}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Risk Management</h3>
                      <Button onClick={() => openRiskForm()} className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Risk
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {risks
                        .filter((risk: GoalRisk) => risk.goalId === selectedGoal.id)
                        .map((risk: GoalRisk) => (
                          <Card key={risk.id} className="border-l-4 border-red-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{risk.riskTitle}</CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={risk.status === 'active' ? 'destructive' : 'secondary'}>
                                      {risk.status}
                                    </Badge>
                                    <Badge variant="outline">{risk.riskType}</Badge>
                                    <span className="text-sm text-gray-600">
                                      {risk.probability} probability, {risk.impact} impact
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => openRiskForm(risk)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => deleteRiskMutation.mutate(risk.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">{risk.riskDescription}</p>
                              {risk.mitigation_plan && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    Mitigation Plan
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {risk.mitigation_plan}
                                  </p>
                                  {risk.mitigation_owner && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Owner: {risk.mitigation_owner}
                                    </p>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      
                      {risks.filter((risk: GoalRisk) => risk.goalId === selectedGoal.id).length === 0 && (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No Risks Identified
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              Start by identifying potential risks that could impact this goal.
                            </p>
                            <Button onClick={() => openRiskForm()} className="bg-red-600 hover:bg-red-700 text-white">
                              <Plus className="h-4 w-4 mr-2" />
                              Identify First Risk
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="issues" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Issue Tracking</h3>
                      <Button onClick={() => openIssueForm()} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {issues
                        .filter((issue: GoalIssue) => issue.goalId === selectedGoal.id)
                        .map((issue: GoalIssue) => (
                          <Card key={issue.id} className="border-l-4 border-orange-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{issue.issueTitle}</CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={issue.status === 'open' ? 'destructive' : issue.status === 'in_progress' ? 'default' : 'secondary'}>
                                      {issue.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="outline">{issue.issueType}</Badge>
                                    <span className="text-sm text-gray-600">
                                      {issue.severity} severity
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => openIssueForm(issue)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => deleteIssueMutation.mutate(issue.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">{issue.issueDescription}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Impact</p>
                                  <p className="text-gray-900 dark:text-white">{issue.impact}</p>
                                </div>
                                {issue.assignedTo && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To</p>
                                    <p className="text-gray-900 dark:text-white">{issue.assignedTo}</p>
                                  </div>
                                )}
                              </div>
                              {issue.resolutionPlan && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    Resolution Plan
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {issue.resolutionPlan}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      
                      {issues.filter((issue: GoalIssue) => issue.goalId === selectedGoal.id).length === 0 && (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No Issues Reported
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              Track and resolve issues that impact goal achievement.
                            </p>
                            <Button onClick={() => openIssueForm()} className="bg-orange-600 hover:bg-orange-700 text-white">
                              <Plus className="h-4 w-4 mr-2" />
                              Report First Issue
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions">
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Action Planning
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Action planning and KPI management features coming soon.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Risk Form Dialog */}
      <Dialog open={showRiskForm} onOpenChange={(open) => {
        setShowRiskForm(open);
        if (!open) {
          setEditingRisk(null);
          resetRiskForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRisk ? "Edit Risk" : "Add New Risk"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRiskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="riskTitle">Risk Title *</Label>
              <Input
                id="riskTitle"
                value={riskFormData.riskTitle}
                onChange={(e) => setRiskFormData({...riskFormData, riskTitle: e.target.value})}
                placeholder="Brief description of the risk"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="riskDescription">Risk Description *</Label>
              <Textarea
                id="riskDescription"
                value={riskFormData.riskDescription}
                onChange={(e) => setRiskFormData({...riskFormData, riskDescription: e.target.value})}
                placeholder="Detailed description of the risk and its potential consequences"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="riskType">Risk Type *</Label>
                <Select 
                  value={riskFormData.riskType} 
                  onValueChange={(value) => setRiskFormData({...riskFormData, riskType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                    <SelectItem value="technological">Technological</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="probability">Probability *</Label>
                <Select 
                  value={riskFormData.probability} 
                  onValueChange={(value) => setRiskFormData({...riskFormData, probability: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select probability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="impact">Impact *</Label>
                <Select 
                  value={riskFormData.impact} 
                  onValueChange={(value) => setRiskFormData({...riskFormData, impact: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mitigation_plan">Mitigation Plan</Label>
              <Textarea
                id="mitigation_plan"
                value={riskFormData.mitigation_plan}
                onChange={(e) => setRiskFormData({...riskFormData, mitigation_plan: e.target.value})}
                placeholder="Describe how this risk will be mitigated or managed"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mitigation_owner">Mitigation Owner</Label>
                <Select 
                  value={riskFormData.mitigation_owner} 
                  onValueChange={(value) => setRiskFormData({...riskFormData, mitigation_owner: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.username || `${user.firstName} ${user.lastName}`.trim()}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mitigation_deadline">Mitigation Deadline</Label>
                <Input
                  id="mitigation_deadline"
                  type="date"
                  value={riskFormData.mitigation_deadline}
                  onChange={(e) => setRiskFormData({...riskFormData, mitigation_deadline: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowRiskForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRiskMutation.isPending || updateRiskMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createRiskMutation.isPending || updateRiskMutation.isPending 
                  ? (editingRisk ? "Updating..." : "Creating...") 
                  : (editingRisk ? "Update Risk" : "Create Risk")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Form Dialog */}
      <Dialog open={showIssueForm} onOpenChange={(open) => {
        setShowIssueForm(open);
        if (!open) {
          setEditingIssue(null);
          resetIssueForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIssue ? "Edit Issue" : "Report New Issue"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div>
              <Label htmlFor="issueTitle">Issue Title *</Label>
              <Input
                id="issueTitle"
                value={issueFormData.issueTitle}
                onChange={(e) => setIssueFormData({...issueFormData, issueTitle: e.target.value})}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="issueDescription">Issue Description *</Label>
              <Textarea
                id="issueDescription"
                value={issueFormData.issueDescription}
                onChange={(e) => setIssueFormData({...issueFormData, issueDescription: e.target.value})}
                placeholder="Detailed description of the issue and its impact"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issueType">Issue Type *</Label>
                <Select 
                  value={issueFormData.issueType} 
                  onValueChange={(value) => setIssueFormData({...issueFormData, issueType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocker">Blocker</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                    <SelectItem value="resource_constraint">Resource Constraint</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="dependency">Dependency</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="severity">Severity *</Label>
                <Select 
                  value={issueFormData.severity} 
                  onValueChange={(value) => setIssueFormData({...issueFormData, severity: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="impact">Impact *</Label>
                <Select 
                  value={issueFormData.impact} 
                  onValueChange={(value) => setIssueFormData({...issueFormData, impact: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="scope">Scope</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select 
                  value={issueFormData.assignedTo} 
                  onValueChange={(value) => setIssueFormData({...issueFormData, assignedTo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.username || `${user.firstName} ${user.lastName}`.trim()}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estimatedResolutionDate">Estimated Resolution Date</Label>
                <Input
                  id="estimatedResolutionDate"
                  type="date"
                  value={issueFormData.estimatedResolutionDate}
                  onChange={(e) => setIssueFormData({...issueFormData, estimatedResolutionDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resolutionPlan">Resolution Plan</Label>
              <Textarea
                id="resolutionPlan"
                value={issueFormData.resolutionPlan}
                onChange={(e) => setIssueFormData({...issueFormData, resolutionPlan: e.target.value})}
                placeholder="Describe how this issue will be resolved"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowIssueForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createIssueMutation.isPending || updateIssueMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {createIssueMutation.isPending || updateIssueMutation.isPending 
                  ? (editingIssue ? "Updating..." : "Creating...") 
                  : (editingIssue ? "Update Issue" : "Report Issue")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}