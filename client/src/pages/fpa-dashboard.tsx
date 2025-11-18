import { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Calendar,
  PieChart,
  BarChart3,
  FileText,
  Building,
  Calculator,
  Target,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useToast } from "@/hooks/use-toast";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  status?: 'positive' | 'negative' | 'neutral';
}

function KPICard({ title, value, change, changeLabel, icon: Icon, status = 'neutral' }: KPICardProps) {
  return (
    <Card data-testid={`kpi-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {change !== 0 && (
            <>
              {change > 0 ? (
                <ArrowUpRight className={cn("h-3 w-3 mr-1", status === 'positive' ? "text-green-600" : "text-red-600")} />
              ) : (
                <ArrowDownRight className={cn("h-3 w-3 mr-1", status === 'negative' ? "text-red-600" : "text-green-600")} />
              )}
              <span className={cn(
                "font-medium",
                change > 0 
                  ? status === 'positive' ? "text-green-600" : "text-red-600"
                  : status === 'negative' ? "text-red-600" : "text-green-600"
              )}>
                {Math.abs(change)}%
              </span>
            </>
          )}
          <span className="ml-1">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  badge?: string;
}

function QuickAction({ icon: Icon, title, description, href, badge }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent cursor-pointer transition-colors" data-testid={`quick-action-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription className="text-xs mt-1">{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {badge && <Badge variant="secondary">{badge}</Badge>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function FPADashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { setMaxOpen } = useMaxDock();
  const { aiTheme } = useAITheme();
  const { toast } = useToast();
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  // Mock data - in production this would come from the database
  const budgetVariance = -3.2;
  const revenueGrowth = 12.5;
  const grossMargin = 42.3;
  const operatingCashFlow = 2450000;
  const dso = 45; // Days Sales Outstanding
  const workingCapital = 1850000;
  
  // AI Recommendations data
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      title: "Reduce Material Costs",
      description: "Lock in 6-month contracts with suppliers to avoid 8% price volatility",
      impact: "$180K annual savings",
      priority: "high",
      type: "cost-reduction"
    },
    {
      id: 2,
      title: "Optimize Cash Flow",
      description: "Accelerate collections to reduce DSO from 45 to 38 days",
      impact: "$450K working capital improvement",
      priority: "medium",
      type: "working-capital"
    },
    {
      id: 3,
      title: "Improve Forecast Accuracy",
      description: "Implement rolling forecasts with weekly updates for better visibility",
      impact: "Reduce variance by 15%",
      priority: "medium",
      type: "planning"
    }
  ]);

  const handleResolveRecommendation = (id: number) => {
    // Remove the recommendation from the list
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    toast({
      title: "Recommendation Applied",
      description: "The FP&A optimization has been implemented.",
    });
    // In production, this would also update the database
  };

  const handleDismissRecommendation = (id: number) => {
    // Remove the recommendation from the list
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    toast({
      title: "Recommendation Dismissed",
      description: "You can review this later in the insights panel.",
    });
    // In production, this would also update the database
  };
  
  const openAIAssistant = (prompt?: string) => {
    setMaxOpen(true);
    if (prompt) {
      // In production, this would send the prompt to Max AI
      console.log("Opening AI with prompt:", prompt);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FP&A Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Financial Planning & Analysis for Manufacturing Operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => openAIAssistant("Help me with FP&A analysis")}
            data-testid="button-ai-assistant"
            className={cn(aiTheme === "dark" ? "border-purple-500 hover:bg-purple-950" : "border-purple-300 hover:bg-purple-50")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant="outline" data-testid="button-export-reports">
            <FileText className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button data-testid="button-new-analysis">
            <Calculator className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Key Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard 
          title="Budget Variance" 
          value={`${budgetVariance}%`}
          change={budgetVariance}
          changeLabel="vs plan"
          icon={Target}
          status="negative"
        />
        <KPICard 
          title="Revenue Growth" 
          value={`${revenueGrowth}%`}
          change={revenueGrowth}
          changeLabel="YoY"
          icon={TrendingUp}
          status="positive"
        />
        <KPICard 
          title="Gross Margin" 
          value={`${grossMargin}%`}
          change={2.1}
          changeLabel="vs last month"
          icon={PieChart}
          status="positive"
        />
        <KPICard 
          title="Operating Cash Flow" 
          value={`$${(operatingCashFlow/1000000).toFixed(1)}M`}
          change={8.3}
          changeLabel="vs last quarter"
          icon={DollarSign}
          status="positive"
        />
        <KPICard 
          title="DSO" 
          value={`${dso} days`}
          change={-5}
          changeLabel="improvement"
          icon={Calendar}
          status="positive"
        />
        <KPICard 
          title="Working Capital" 
          value={`$${(workingCapital/1000000).toFixed(1)}M`}
          change={-2.5}
          changeLabel="vs target"
          icon={Activity}
          status="negative"
        />
      </div>

      {/* AI Recommendations Section */}
      {showRecommendations && recommendations.length > 0 && (
        <Card className={cn("border-2", aiTheme === "dark" ? "border-purple-500/30 bg-purple-950/20" : "border-purple-200")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className={cn("h-5 w-5", aiTheme === "dark" ? "text-purple-400" : "text-purple-600")} />
                <CardTitle>AI Financial Insights</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {recommendations.length} Recommendations
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecommendations(false)}
                  data-testid="button-hide-recommendations"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              AI-powered recommendations to optimize financial performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={cn(
                  "p-4 rounded-lg border",
                  aiTheme === "dark" ? "bg-purple-950/30 border-purple-500/20" : "bg-purple-50 border-purple-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge 
                        variant={rec.priority === "high" ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-medium text-green-600">Impact: {rec.impact}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveRecommendation(rec.id)}
                      className="flex items-center"
                      data-testid={`button-resolve-${rec.id}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismissRecommendation(rec.id)}
                      data-testid={`button-dismiss-${rec.id}`}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => openAIAssistant("Analyze financial performance and suggest optimizations")}
                data-testid="button-ai-analysis"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask FP&A Agent for More Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Budget vs Actual Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Budget vs Actual
              <Badge variant={budgetVariance < 0 ? "destructive" : "default"}>
                {budgetVariance < 0 ? "Over Budget" : "Under Budget"}
              </Badge>
            </CardTitle>
            <CardDescription>Current fiscal year performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Revenue</span>
                <span className="font-medium">102% of budget</span>
              </div>
              <Progress value={102} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Operating Expenses</span>
                <span className="font-medium">105% of budget</span>
              </div>
              <Progress value={105} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Capital Expenditure</span>
                <span className="font-medium">87% of budget</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>R&D Investment</span>
                <span className="font-medium">95% of budget</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <Link href="/variance-analysis">
              <Button variant="outline" className="w-full mt-4" data-testid="button-detailed-variance">
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Variance Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Profitability Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Profitability by Plant</CardTitle>
            <CardDescription>Operating margin comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Milwaukee Plant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">18.5%</span>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    2.1%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Chicago Plant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">15.2%</span>
                  <Badge variant="outline" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    0.5%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Denver Plant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">22.1%</span>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    3.8%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Portland Plant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">19.7%</span>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    1.2%
                  </Badge>
                </div>
              </div>
            </div>
            <Link href="/profitability-analysis">
              <Button variant="outline" className="w-full mt-4" data-testid="button-profitability-details">
                <PieChart className="h-4 w-4 mr-2" />
                Detailed Profitability Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Tools & Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">FP&A Tools & Analysis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickAction 
            icon={Calculator}
            title="Budget Management"
            description="Create, review, and manage operational and capital budgets"
            href="/budgets"
            badge="Q4 Planning"
          />
          <QuickAction 
            icon={TrendingUp}
            title="Forecast & Planning"
            description="Revenue, expense, and cash flow forecasting tools"
            href="/forecasting"
          />
          <QuickAction 
            icon={BarChart3}
            title="Variance Analysis"
            description="Analyze budget vs actual variances and root causes"
            href="/variance-analysis"
          />
          <QuickAction 
            icon={Building}
            title="Cost Center Analysis"
            description="Track and analyze costs by department and cost center"
            href="/cost-centers"
          />
          <QuickAction 
            icon={PieChart}
            title="Product Profitability"
            description="Analyze profitability by product, customer, and channel"
            href="/profitability-analysis"
          />
          <QuickAction 
            icon={Activity}
            title="KPI Dashboard"
            description="Monitor and track key financial performance indicators"
            href="/financial-kpis"
          />
        </div>
      </div>

      {/* Integration Links */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Systems & Data Sources</CardTitle>
          <CardDescription>Links to related manufacturing and operational systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/production-planning">
              <Button variant="outline" className="w-full justify-start" data-testid="link-production-planning">
                <Activity className="h-4 w-4 mr-2" />
                Production Planning
              </Button>
            </Link>
            <Link href="/inventory-optimization">
              <Button variant="outline" className="w-full justify-start" data-testid="link-inventory">
                <Building className="h-4 w-4 mr-2" />
                Inventory Management
              </Button>
            </Link>
            <Link href="/demand-forecasting">
              <Button variant="outline" className="w-full justify-start" data-testid="link-demand-forecast">
                <TrendingUp className="h-4 w-4 mr-2" />
                Demand Forecasting
              </Button>
            </Link>
            <Link href="/capacity-planning">
              <Button variant="outline" className="w-full justify-start" data-testid="link-capacity">
                <Calculator className="h-4 w-4 mr-2" />
                Capacity Planning
              </Button>
            </Link>
            <Link href="/continuous-improvement">
              <Button variant="outline" className="w-full justify-start" data-testid="link-continuous-improvement">
                <Target className="h-4 w-4 mr-2" />
                Continuous Improvement
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full justify-start" data-testid="link-reports">
                <FileText className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
            </Link>
            <Link href="/control-tower">
              <Button variant="outline" className="w-full justify-start" data-testid="link-control-tower">
                <AlertCircle className="h-4 w-4 mr-2" />
                Control Tower
              </Button>
            </Link>
            <Link href="/business-goals">
              <Button variant="outline" className="w-full justify-start" data-testid="link-business-goals">
                <Target className="h-4 w-4 mr-2" />
                Business Goals
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Alerts & Actions</CardTitle>
          <CardDescription>Items requiring FP&A attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Q4 Budget Submission Due</p>
                <p className="text-xs text-muted-foreground">Department budgets due by Nov 30</p>
              </div>
            </div>
            <Button size="sm" variant="outline" data-testid="button-review-budget">Review</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Chicago Plant Over Budget</p>
                <p className="text-xs text-muted-foreground">Operating expenses 12% over budget</p>
              </div>
            </div>
            <Button size="sm" variant="outline" data-testid="button-analyze-variance">Analyze</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Revenue Forecast Updated</p>
                <p className="text-xs text-muted-foreground">Q4 forecast increased by 8%</p>
              </div>
            </div>
            <Button size="sm" variant="outline" data-testid="button-view-forecast">View</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}