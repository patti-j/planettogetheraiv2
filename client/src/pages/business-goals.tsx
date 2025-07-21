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
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData: InsertBusinessGoal = {
      goalTitle: formData.goalTitle,
      goalDescription: formData.goalDescription,
      goalType: formData.goalType,
      priority: formData.priority as "low" | "medium" | "high" | "critical",
      owner: formData.owner,
      startDate: new Date(formData.startDate),
      targetDate: new Date(formData.targetDate),
      targetValue: parseFloat(formData.targetValue) || 0,
      targetUnit: formData.targetUnit,
      category: formData.category,
      status: "active"
    };
    createGoalMutation.mutate(goalData);
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
                    onClick={() => setSelectedGoal(goal)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Business Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goalTitle">Goal Title *</Label>
                <Input
                  id="goalTitle"
                  value={formData.goalTitle}
                  onChange={(e) => setFormData({...formData, goalTitle: e.target.value})}
                  placeholder="Enter goal title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="owner">Goal Owner *</Label>
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select value={formData.goalType} onValueChange={(value) => setFormData({...formData, goalType: value})}>
                  <SelectTrigger>
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
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
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
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Production, Sales"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="targetUnit">Target Unit</Label>
                <Input
                  id="targetUnit"
                  value={formData.targetUnit}
                  onChange={(e) => setFormData({...formData, targetUnit: e.target.value})}
                  placeholder="e.g., %, units, $"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGoalMutation.isPending}>
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}