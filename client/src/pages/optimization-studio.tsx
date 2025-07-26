import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Maximize2, Minimize2, Sparkles, Brain, Target, Cpu, Play, 
  CheckCircle, Settings, Database, Monitor, TrendingUp, 
  Code, TestTube, Rocket, BarChart3, Layers, Package,
  Plus, Search, Filter, Edit3, Trash2, Copy, Eye, ArrowLeft, Clock
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BackwardsSchedulingAlgorithm from "@/components/backwards-scheduling-algorithm";

interface OptimizationAlgorithm {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  type: string;
  baseAlgorithmId?: number;
  version: string;
  status: string;
  isStandard: boolean;
  configuration: any;
  algorithmCode?: string;
  uiComponents: any;
  performance: any;
  approvals: any;
  createdBy: number;
  createdAt: string;
}

interface AlgorithmTest {
  id: number;
  algorithmId: number;
  name: string;
  description: string;
  testType: string;
  configuration: any;
  results?: any;
  createdAt: string;
}

interface AlgorithmDeployment {
  id: number;
  algorithmId: number;
  targetModule: string;
  environment: string;
  version: string;
  status: string;
  configuration: any;
  deployedAt: string;
  metrics: any;
}

export default function OptimizationStudio() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTab, setSelectedTab] = useState("algorithms");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<OptimizationAlgorithm | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAICreateDialog, setShowAICreateDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showBackwardsScheduling, setShowBackwardsScheduling] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch optimization algorithms
  const { data: algorithms = [], isLoading: algorithmsLoading } = useQuery({
    queryKey: ['/api/optimization/algorithms'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/algorithms');
      if (!response.ok) throw new Error('Failed to fetch algorithms');
      return response.json();
    }
  });

  // Fetch standard algorithms
  const { data: standardAlgorithms = [] } = useQuery({
    queryKey: ['/api/optimization/standard-algorithms'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/standard-algorithms');
      if (!response.ok) throw new Error('Failed to fetch standard algorithms');
      return response.json();
    }
  });

  // Fetch algorithm tests
  const { data: tests = [] } = useQuery({
    queryKey: ['/api/optimization/tests'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      return response.json();
    }
  });

  // Fetch deployments
  const { data: deployments = [] } = useQuery({
    queryKey: ['/api/optimization/deployments'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/deployments');
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    }
  });

  // Create algorithm mutation
  const createAlgorithmMutation = useMutation({
    mutationFn: async (algorithmData: any) => {
      const response = await fetch('/api/optimization/algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(algorithmData)
      });
      if (!response.ok) throw new Error('Failed to create algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/algorithms'] });
      setShowCreateDialog(false);
      toast({ title: "Algorithm created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating algorithm", description: error.message, variant: "destructive" });
    }
  });

  // AI algorithm creation mutation
  const createAIAlgorithmMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // This would integrate with the AI agent to generate algorithm code
      const algorithmData = {
        name: `ai_generated_${Date.now()}`,
        displayName: "AI Generated Algorithm",
        description: `Algorithm generated from prompt: ${prompt}`,
        category: "production_scheduling",
        type: "standard",
        version: "1.0.0",
        status: "draft",
        isStandard: true,
        configuration: { aiGenerated: true, prompt },
        algorithmCode: `// AI Generated Algorithm\n// Prompt: ${prompt}\n\nfunction optimizeProduction(data) {\n  // AI implementation would go here\n  return data;\n}`,
        uiComponents: {},
        performance: {},
        approvals: { approved: false }
      };
      
      const response = await fetch('/api/optimization/algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(algorithmData)
      });
      if (!response.ok) throw new Error('Failed to create AI algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/algorithms'] });
      setShowAICreateDialog(false);
      setAiPrompt("");
      toast({ title: "AI algorithm generated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error generating AI algorithm", description: error.message, variant: "destructive" });
    }
  });

  // Filter algorithms based on category and search
  const filteredAlgorithms = algorithms.filter((algo: OptimizationAlgorithm) => {
    const matchesCategory = selectedCategory === "all" || algo.category === selectedCategory;
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         algo.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "production_scheduling", label: "Production Scheduling" },
    { value: "inventory_optimization", label: "Inventory Optimization" },
    { value: "capacity_planning", label: "Capacity Planning" },
    { value: "demand_forecasting", label: "Demand Forecasting" },
    { value: "resource_allocation", label: "Resource Allocation" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'testing': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'deployed': return 'bg-blue-500';
      case 'retired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const AlgorithmCard = ({ algorithm }: { algorithm: OptimizationAlgorithm }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedAlgorithm(algorithm)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{algorithm.displayName}</CardTitle>
            <CardDescription className="mt-1">{algorithm.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={`${getStatusColor(algorithm.status)} text-white`}>
              {algorithm.status}
            </Badge>
            {algorithm.isStandard && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="capitalize">{algorithm.category.replace('_', ' ')}</span>
          <span>v{algorithm.version}</span>
        </div>
        {algorithm.performance && Object.keys(algorithm.performance).length > 0 && (
          <div className="mt-3 flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Performance: {algorithm.performance.score || 'N/A'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Show backwards scheduling algorithm if selected
  if (showBackwardsScheduling) {
    return (
      <div className="relative min-h-screen bg-gray-50">
        <Button
          onClick={() => setIsMaximized(!isMaximized)}
          className="fixed top-2 right-2 z-50"
          size="icon"
          variant="outline"
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        
        <div className={`p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMaximized ? '' : ''}`}>
          <Button 
            onClick={() => setShowBackwardsScheduling(false)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Optimization Studio
          </Button>
          <BackwardsSchedulingAlgorithm />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Maximize/Minimize Button */}
      <Button
        onClick={() => setIsMaximized(!isMaximized)}
        className="fixed top-2 right-2 z-50"
        size="icon"
        variant="outline"
      >
        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      <div className={`p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMaximized ? '' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Optimization Studio
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Define, customize, test, and deploy optimization algorithms across manufacturing functions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Dialog open={showAICreateDialog} onOpenChange={setShowAICreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Create
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI Algorithm Generator</DialogTitle>
                  <DialogDescription>
                    Describe the optimization problem you want to solve, and AI will generate a custom algorithm
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Optimization Requirements</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="E.g., 'Create a production scheduling algorithm that minimizes setup times while maximizing throughput for automotive parts manufacturing'"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAICreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createAIAlgorithmMutation.mutate(aiPrompt)}
                      disabled={!aiPrompt.trim() || createAIAlgorithmMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-600"
                    >
                      {createAIAlgorithmMutation.isPending ? "Generating..." : "Generate Algorithm"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Algorithm
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="deployments">Deployments</TabsTrigger>
              <TabsTrigger value="extensions">Extensions</TabsTrigger>
            </TabsList>
            
            {selectedTab === "algorithms" && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search algorithms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="algorithms" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Algorithms</p>
                      <p className="text-xl font-bold">{algorithms.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Standard</p>
                      <p className="text-xl font-bold">{algorithms.filter((a: OptimizationAlgorithm) => a.isStandard).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Deployed</p>
                      <p className="text-xl font-bold">{algorithms.filter((a: OptimizationAlgorithm) => a.status === 'deployed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">In Testing</p>
                      <p className="text-xl font-bold">{algorithms.filter((a: OptimizationAlgorithm) => a.status === 'testing').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Algorithm - Backwards Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Featured Algorithm</h2>
                <Badge variant="outline">Production Scheduling</Badge>
              </div>
              <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setShowBackwardsScheduling(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-blue-900">Backwards Scheduling Algorithm</CardTitle>
                      <CardDescription className="mt-1 text-blue-700">
                        Advanced backwards scheduling that starts from job due dates and works backwards to optimize start times, 
                        reducing WIP inventory and improving cash flow while ensuring due date compliance.
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className="bg-green-500 text-white">
                        approved
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Standard
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-blue-700 mb-3">
                    <span>Production Scheduling</span>
                    <span>v1.0.0</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>Due Date Focus</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Optimized Timing</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Backwards Logic</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBackwardsScheduling(true);
                    }}
                  >
                    Configure & Run Algorithm
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Standard Algorithms Section */}
            {standardAlgorithms.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold">Standard Algorithms</h2>
                  <Badge variant="outline">AI-Powered</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {standardAlgorithms.slice(0, 6).map((algorithm: OptimizationAlgorithm) => (
                    <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Algorithms Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Custom Algorithms</h2>
                <Badge variant="outline">{filteredAlgorithms.length} algorithms</Badge>
              </div>
              
              {algorithmsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredAlgorithms.length === 0 ? (
                <Card className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No algorithms found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedCategory !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first optimization algorithm to get started"
                    }
                  </p>
                  <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                    <Brain className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAlgorithms.map((algorithm: OptimizationAlgorithm) => (
                    <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Testing</h2>
              <Button>
                <TestTube className="w-4 h-4 mr-2" />
                New Test
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tests.length === 0 ? (
                <Card className="p-8 text-center col-span-2">
                  <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tests configured</h3>
                  <p className="text-gray-600 mb-4">
                    Start testing your algorithms with real or example data
                  </p>
                  <Button>Create First Test</Button>
                </Card>
              ) : (
                tests.map((test: AlgorithmTest) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{test.testType}</Badge>
                        <Button size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="deployments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Deployments</h2>
              <Button>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Algorithm
              </Button>
            </div>
            
            <div className="space-y-4">
              {deployments.length === 0 ? (
                <Card className="p-8 text-center">
                  <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active deployments</h3>
                  <p className="text-gray-600 mb-4">
                    Deploy approved algorithms to production modules
                  </p>
                  <Button>Deploy First Algorithm</Button>
                </Card>
              ) : (
                deployments.map((deployment: AlgorithmDeployment) => (
                  <Card key={deployment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Algorithm #{deployment.algorithmId}</CardTitle>
                          <CardDescription>{deployment.targetModule} - {deployment.environment}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(deployment.status)} text-white`}>
                          {deployment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          <span>v{deployment.version}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>Health: OK</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="extensions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Extension Data Management</h2>
              <Button>
                <Database className="w-4 h-4 mr-2" />
                Add Extension Field
              </Button>
            </div>
            
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Extension system ready</h3>
              <p className="text-gray-600 mb-4">
                Add custom data fields to jobs and resources for algorithm-specific requirements
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Fields
                </Button>
                <Button>
                  <Eye className="w-4 h-4 mr-2" />
                  View Data
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Algorithm Detail Dialog */}
      {selectedAlgorithm && (
        <Dialog open={!!selectedAlgorithm} onOpenChange={() => setSelectedAlgorithm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAlgorithm.displayName}
                <Badge className={`${getStatusColor(selectedAlgorithm.status)} text-white`}>
                  {selectedAlgorithm.status}
                </Badge>
                {selectedAlgorithm.isStandard && (
                  <Badge variant="outline">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Standard
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>{selectedAlgorithm.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Category:</strong> {selectedAlgorithm.category.replace('_', ' ')}
                </div>
                <div>
                  <strong>Version:</strong> {selectedAlgorithm.version}
                </div>
                <div>
                  <strong>Type:</strong> {selectedAlgorithm.type}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedAlgorithm.createdAt).toLocaleDateString()}
                </div>
              </div>

              {selectedAlgorithm.algorithmCode && (
                <div>
                  <h4 className="font-semibold mb-2">Algorithm Code</h4>
                  <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm"><code>{selectedAlgorithm.algorithmCode}</code></pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Algorithm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}