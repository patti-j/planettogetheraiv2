import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, Target, DollarSign, Clock, Activity, Lightbulb, ChartBar, Play, CheckCircle2, AlertCircle, Search, Filter, Calendar, Users, Brain, Award, TrendingDown, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import type { ImprovementInitiative, ImprovementMetric, ImprovementSimulation } from "@shared/schema";
import { insertImprovementInitiativeSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockInitiatives: ImprovementInitiative[] = [
  {
    id: 1,
    title: "Reduce Setup Time on Line 3",
    description: "Implement SMED techniques to reduce changeover time by 50%",
    category: "productivity",
    subcategory: "setup_reduction",
    status: "in_progress",
    priority: "high",
    plantId: 1,
    departmentId: 1,
    problemStatement: "Setup times on Line 3 average 4 hours, causing significant production delays",
    rootCause: "Lack of standardized procedures and tools not organized",
    proposedSolution: "Implement Single-Minute Exchange of Dies (SMED) methodology",
    implementationApproach: "Phase 1: Document current state, Phase 2: Separate internal/external activities, Phase 3: Optimize",
    baselineMetrics: { setupTime: 240, productsPerDay: 100 },
    targetMetrics: { setupTime: 120, productsPerDay: 150 },
    actualMetrics: { setupTime: 180, productsPerDay: 125 },
    estimatedAnnualValue: "150000",
    actualAnnualValue: null,
    costToImplement: "25000",
    paybackPeriodMonths: 2,
    riskLevel: "low",
    complexity: "medium",
    riskMitigation: "Pilot on one line first, train operators thoroughly",
    initiatedBy: 1,
    leadBy: 2,
    teamMembers: [1, 2, 3, 4],
    resourcesRequired: { training: "40 hours", equipment: "$5000", consulting: "$10000" },
    identifiedDate: new Date("2024-01-15"),
    approvalDate: new Date("2024-01-20"),
    startDate: new Date("2024-02-01"),
    targetCompletionDate: new Date("2024-04-30"),
    actualCompletionDate: null,
    relatedAIRecommendationId: 1,
    linkedInitiatives: [2, 3],
    affectedJobsOperations: ["Job-101", "Job-102", "Job-103"],
    lastReviewedAt: new Date("2024-03-01"),
    nextReviewDate: new Date("2024-03-15"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: 2,
    title: "Implement Predictive Maintenance",
    description: "Use IoT sensors and AI to predict equipment failures before they occur",
    category: "quality",
    subcategory: "preventive_maintenance",
    status: "simulated",
    priority: "high",
    plantId: 1,
    departmentId: 2,
    problemStatement: "Unplanned downtime costs $50,000 per incident",
    rootCause: "Reactive maintenance approach, no early warning system",
    proposedSolution: "Install vibration sensors and implement AI-based failure prediction",
    implementationApproach: "Deploy sensors, collect baseline data, train ML models, integrate with maintenance system",
    baselineMetrics: { downtime: 120, mtbf: 720 },
    targetMetrics: { downtime: 30, mtbf: 1440 },
    actualMetrics: null,
    estimatedAnnualValue: "500000",
    actualAnnualValue: null,
    costToImplement: "100000",
    paybackPeriodMonths: 3,
    riskLevel: "medium",
    complexity: "complex",
    riskMitigation: "Partner with experienced IoT vendor, phase rollout",
    initiatedBy: 3,
    leadBy: 3,
    teamMembers: [3, 4, 5],
    resourcesRequired: { sensors: "$30000", software: "$40000", training: "$10000", integration: "$20000" },
    identifiedDate: new Date("2024-02-01"),
    approvalDate: null,
    startDate: null,
    targetCompletionDate: new Date("2024-06-30"),
    actualCompletionDate: null,
    relatedAIRecommendationId: 2,
    linkedInitiatives: [],
    affectedJobsOperations: ["All Production Lines"],
    lastReviewedAt: new Date("2024-03-10"),
    nextReviewDate: new Date("2024-03-20"),
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-10")
  },
  {
    id: 3,
    title: "Optimize Inventory Levels",
    description: "Reduce inventory holding costs by 30% while maintaining service levels",
    category: "cost",
    subcategory: "inventory_optimization",
    status: "identified",
    priority: "medium",
    plantId: 1,
    departmentId: 3,
    problemStatement: "Excess inventory ties up $2M in working capital",
    rootCause: "No systematic inventory optimization, safety stock levels not data-driven",
    proposedSolution: "Implement dynamic safety stock calculation based on demand variability",
    implementationApproach: "Analyze historical data, implement ABC analysis, set dynamic reorder points",
    baselineMetrics: { inventoryValue: 2000000, stockouts: 5 },
    targetMetrics: { inventoryValue: 1400000, stockouts: 3 },
    actualMetrics: null,
    estimatedAnnualValue: "180000",
    actualAnnualValue: null,
    costToImplement: "30000",
    paybackPeriodMonths: 2,
    riskLevel: "medium",
    complexity: "medium",
    riskMitigation: "Maintain critical parts buffer, monitor service levels closely",
    initiatedBy: 4,
    leadBy: null,
    teamMembers: [],
    resourcesRequired: { software: "$15000", consulting: "$10000", training: "$5000" },
    identifiedDate: new Date("2024-03-01"),
    approvalDate: null,
    startDate: null,
    targetCompletionDate: new Date("2024-05-31"),
    actualCompletionDate: null,
    relatedAIRecommendationId: null,
    linkedInitiatives: [],
    affectedJobsOperations: ["All SKUs"],
    lastReviewedAt: new Date("2024-03-05"),
    nextReviewDate: new Date("2024-03-25"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-05")
  }
];

// Form schema for creating new initiative
const createInitiativeSchema = insertImprovementInitiativeSchema.extend({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  problemStatement: z.string().min(1, "Problem statement is required"),
  proposedSolution: z.string().min(1, "Proposed solution is required"),
  estimatedAnnualValue: z.string().optional(),
  costToImplement: z.string().optional(),
  targetCompletionDate: z.string().optional()
});

type CreateInitiativeFormData = z.infer<typeof createInitiativeSchema>;

export default function ContinuousImprovement() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInitiative, setSelectedInitiative] = useState<ImprovementInitiative | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [simulateDialogOpen, setSimulateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form for creating new initiative
  const form = useForm<CreateInitiativeFormData>({
    resolver: zodResolver(createInitiativeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
      problemStatement: "",
      proposedSolution: "",
      estimatedAnnualValue: "",
      costToImplement: "",
      targetCompletionDate: ""
    }
  });

  // Fetch initiatives (using mock data for now)
  const { data: initiatives = mockInitiatives, isLoading } = useQuery<ImprovementInitiative[]>({
    queryKey: ["/api/improvement-initiatives"],
    queryFn: async () => {
      // In production, this would fetch from the API
      return mockInitiatives;
    }
  });

  // Fetch AI recommendations that could become initiatives
  const { data: aiRecommendations = [] } = useQuery({
    queryKey: ["/api/ai/recommendations"],
    enabled: false // Disabled for now since API doesn't exist yet
  });

  // Create initiative mutation
  const createInitiativeMutation = useMutation({
    mutationFn: async (data: CreateInitiativeFormData) => {
      return await apiRequest("/api/improvement-initiatives", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvement-initiatives"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Improvement initiative created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create initiative",
        variant: "destructive"
      });
    }
  });

  // Run simulation mutation
  const runSimulationMutation = useMutation({
    mutationFn: async (initiativeId: number) => {
      return await apiRequest(`/api/improvement-initiatives/${initiativeId}/simulate`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvement-initiatives"] });
      setSimulateDialogOpen(false);
      toast({
        title: "Simulation Started",
        description: "The simulation is running. Results will be available soon."
      });
    }
  });

  // Filter initiatives
  const filteredInitiatives = initiatives.filter(initiative => {
    const matchesCategory = selectedCategory === "all" || initiative.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || initiative.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      initiative.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      initiative.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Calculate summary statistics
  const stats = {
    totalInitiatives: initiatives.length,
    inProgress: initiatives.filter(i => i.status === "in_progress").length,
    totalEstimatedValue: initiatives.reduce((sum, i) => sum + parseFloat(i.estimatedAnnualValue || "0"), 0),
    averagePayback: initiatives.reduce((sum, i) => sum + (i.paybackPeriodMonths || 0), 0) / initiatives.length || 0
  };

  const categoryColors = {
    productivity: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    quality: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cost: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    safety: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    sustainability: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
  };

  const statusIcons = {
    identified: <Lightbulb className="h-4 w-4" />,
    simulated: <ChartBar className="h-4 w-4" />,
    approved: <CheckCircle2 className="h-4 w-4" />,
    in_progress: <Activity className="h-4 w-4" />,
    completed: <Award className="h-4 w-4" />,
    on_hold: <AlertCircle className="h-4 w-4" />,
    cancelled: <TrendingDown className="h-4 w-4" />
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Continuous Improvement Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Identify opportunities, simulate scenarios, and track improvement initiatives
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setSimulateDialogOpen(true)}
            data-testid="button-run-simulation"
          >
            <Play className="h-4 w-4 mr-2" />
            Run Simulation
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-initiative">
                <Plus className="h-4 w-4 mr-2" />
                New Initiative
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Improvement Initiative</DialogTitle>
                <DialogDescription>
                  Define a new continuous improvement opportunity
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createInitiativeMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Reduce setup time on Line 3" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="productivity">Productivity</SelectItem>
                              <SelectItem value="quality">Quality</SelectItem>
                              <SelectItem value="cost">Cost</SelectItem>
                              <SelectItem value="safety">Safety</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                              <SelectItem value="sustainability">Sustainability</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="problemStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Statement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the current problem or opportunity..." 
                            {...field} 
                            data-testid="textarea-problem"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposedSolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Solution</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your proposed solution..." 
                            {...field} 
                            data-testid="textarea-solution"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedAnnualValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Annual Value ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="150000" {...field} data-testid="input-value" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costToImplement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost to Implement ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="25000" {...field} data-testid="input-cost" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createInitiativeMutation.isPending}>
                      {createInitiativeMutation.isPending ? "Creating..." : "Create Initiative"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Initiatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInitiatives}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.inProgress} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Annual Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(stats.totalEstimatedValue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Potential savings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Payback Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePayback.toFixed(1)} months</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Time to ROI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search initiatives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]" data-testid="filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="sustainability">Sustainability</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" data-testid="filter-status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="simulated">Simulated</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="initiatives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="initiatives">Active Initiatives</TabsTrigger>
          <TabsTrigger value="opportunities">AI Opportunities</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="initiatives" className="space-y-4">
          {/* Initiatives Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInitiatives.map((initiative) => (
              <Card 
                key={initiative.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedInitiative(initiative)}
                data-testid={`initiative-card-${initiative.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{initiative.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      {statusIcons[initiative.status]}
                      <Badge variant="outline" className="capitalize">
                        {initiative.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{initiative.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={cn("capitalize", categoryColors[initiative.category])}>
                      {initiative.category}
                    </Badge>
                    <Badge 
                      variant={initiative.priority === "critical" ? "destructive" : 
                               initiative.priority === "high" ? "default" : "secondary"}
                    >
                      {initiative.priority}
                    </Badge>
                  </div>

                  {/* Progress Indicator */}
                  {initiative.status === "in_progress" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>35%</span>
                      </div>
                      <Progress value={35} />
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Est. Value</p>
                      <p className="font-semibold text-green-600">
                        ${parseInt(initiative.estimatedAnnualValue || "0").toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Payback</p>
                      <p className="font-semibold">{initiative.paybackPeriodMonths || "TBD"} months</p>
                    </div>
                  </div>

                  {/* Team Members */}
                  {initiative.teamMembers && initiative.teamMembers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {initiative.teamMembers.length} team members
                      </span>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="h-4 w-4" />
                    {initiative.targetCompletionDate ? (
                      <span>Due {format(new Date(initiative.targetCompletionDate), "MMM dd, yyyy")}</span>
                    ) : (
                      <span>Timeline TBD</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInitiatives.length === 0 && (
            <Card className="p-12 text-center">
              <CardContent>
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No initiatives found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Identified Opportunities
              </CardTitle>
              <CardDescription>
                Opportunities discovered through data analysis and AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Optimize Batch Sequencing</h3>
                    <Badge className="bg-purple-100 text-purple-800">AI Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Analysis shows 25% reduction in changeover time possible through optimized sequencing
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-semibold">Potential: $200k/year</span>
                    <span>Confidence: 92%</span>
                  </div>
                  <Button size="sm" className="mt-2">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Convert to Initiative
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Energy Consumption Pattern Optimization</h3>
                    <Badge className="bg-purple-100 text-purple-800">AI Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Off-peak scheduling could reduce energy costs by 18%
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-semibold">Potential: $150k/year</span>
                    <span>Confidence: 88%</span>
                  </div>
                  <Button size="sm" className="mt-2">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Convert to Initiative
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Initiatives</CardTitle>
              <CardDescription>Successfully implemented improvements with realized value</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">No completed initiatives yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Value Realization Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart3 className="h-20 w-20 text-gray-300" />
                <p className="text-gray-500 ml-4">Chart visualization coming soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Initiative Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart3 className="h-20 w-20 text-gray-300" />
                <p className="text-gray-500 ml-4">Chart visualization coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Simulation Dialog */}
      <Dialog open={simulateDialogOpen} onOpenChange={setSimulateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Improvement Simulation</DialogTitle>
            <DialogDescription>
              Select an initiative to simulate its potential impact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select initiative to simulate" />
              </SelectTrigger>
              <SelectContent>
                {initiatives.filter(i => i.status === "identified" || i.status === "approved").map(initiative => (
                  <SelectItem key={initiative.id} value={initiative.id.toString()}>
                    {initiative.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSimulateDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => runSimulationMutation.mutate(1)}>
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}