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
  Plus, Search, Filter, Edit3, Trash2, Copy, Eye, Clock,
  Code2, MessageSquare, ThumbsUp, ThumbsDown, Bug, 
  Lightbulb, ArrowRight, ChevronDown, ChevronUp, AlertTriangle, Bot
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BackwardsSchedulingAlgorithm from "@/components/backwards-scheduling-algorithm";
import AlgorithmArchitectureView from "@/components/algorithm-architecture-view";

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
  const [aiSessionMessages, setAiSessionMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiSessionActive, setAiSessionActive] = useState(false);
  const [currentAlgorithmDraft, setCurrentAlgorithmDraft] = useState<any>(null);
  const [aiSessionStep, setAiSessionStep] = useState(1);
  const [showBackwardsScheduling, setShowBackwardsScheduling] = useState(false);
  const [showArchitectureView, setShowArchitectureView] = useState(false);
  const [architectureAlgorithmName, setArchitectureAlgorithmName] = useState("");
  const [selectedAlgorithmForDev, setSelectedAlgorithmForDev] = useState<OptimizationAlgorithm | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());

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

  // Fetch algorithm feedback for development purposes
  const { data: algorithmFeedback = [] } = useQuery({
    queryKey: ['/api/algorithm-feedback'],
    queryFn: async () => {
      const response = await fetch('/api/algorithm-feedback');
      if (!response.ok) throw new Error('Failed to fetch algorithm feedback');
      return response.json();
    }
  });

  // Fetch feedback for specific algorithm when selected
  const { data: selectedAlgorithmFeedback = [] } = useQuery({
    queryKey: ['/api/algorithm-feedback/algorithm', selectedAlgorithmForDev?.name],
    queryFn: async () => {
      if (!selectedAlgorithmForDev?.name) return [];
      const response = await fetch(`/api/algorithm-feedback/algorithm/${selectedAlgorithmForDev.name}`);
      if (!response.ok) throw new Error('Failed to fetch algorithm feedback');
      return response.json();
    },
    enabled: !!selectedAlgorithmForDev
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

  // AI collaborative session mutation
  const aiCollaborateSession = useMutation({
    mutationFn: async ({ message, sessionData }: { message: string; sessionData: any }) => {
      const response = await fetch('/api/ai-agent/collaborative-algorithm-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionMessages: aiSessionMessages,
          currentDraft: currentAlgorithmDraft,
          step: aiSessionStep,
          ...sessionData
        })
      });
      if (!response.ok) throw new Error('Failed to process AI collaboration');
      return response.json();
    },
    onSuccess: (data) => {
      setAiSessionMessages(prev => [...prev, 
        { role: 'user', content: aiPrompt },
        { role: 'assistant', content: data.response }
      ]);
      
      if (data.algorithmDraft) {
        setCurrentAlgorithmDraft(data.algorithmDraft);
      }
      
      if (data.nextStep) {
        setAiSessionStep(data.nextStep);
      }
      
      setAiPrompt("");
    },
    onError: (error: any) => {
      toast({ title: "AI collaboration error", description: error.message, variant: "destructive" });
    }
  });

  // Finalize AI algorithm creation
  const finalizeAIAlgorithmMutation = useMutation({
    mutationFn: async (finalAlgorithm: any) => {
      const response = await fetch('/api/optimization/algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAlgorithm)
      });
      if (!response.ok) throw new Error('Failed to create final algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/algorithms'] });
      setShowAICreateDialog(false);
      resetAISession();
      toast({ title: "Algorithm created successfully", description: "Your AI-developed algorithm is ready for testing!" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating algorithm", description: error.message, variant: "destructive" });
    }
  });

  // Reset AI session
  const resetAISession = () => {
    setAiSessionMessages([]);
    setAiSessionActive(false);
    setCurrentAlgorithmDraft(null);
    setAiSessionStep(1);
    setAiPrompt("");
  };

  // Start AI collaboration session
  const startAISession = () => {
    setAiSessionActive(true);
    setAiSessionMessages([{
      role: 'assistant',
      content: "Hello! I'm here to help you develop a custom optimization algorithm step by step. Let's start by understanding your specific requirements.\n\n**Step 1: Problem Definition**\n\nCould you describe the optimization problem you're trying to solve? For example:\n- What type of manufacturing process needs optimization?\n- What are your main objectives (minimize cost, maximize throughput, reduce setup times, etc.)?\n- Are there any specific constraints or limitations I should know about?"
    }]);
    setAiSessionStep(1);
  };

  // Filter algorithms based on category and search
  const filteredAlgorithms = algorithms.filter((algo: OptimizationAlgorithm) => {
    const matchesCategory = selectedCategory === "all" || algo.category === selectedCategory;
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         algo.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter feedback based on filter selection
  const filteredFeedback = selectedAlgorithmFeedback.filter((feedback: any) => {
    if (feedbackFilter === "all") return true;
    if (feedbackFilter === "bugs") return feedback.feedbackType === "bug_report" || feedback.feedbackType === "bug";
    if (feedbackFilter === "improvements") return feedback.feedbackType === "improvement_suggestion" || feedback.feedbackType === "improvement";
    if (feedbackFilter === "critical") return feedback.severity === "critical" || feedback.severity === "high";
    if (feedbackFilter === "max") {
      // Check if feedback is from Max AI Assistant (submitted by Max system user or has Max-specific metadata)
      return feedback.submittedBy === 9 || // Max system user ID
             (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant") ||
             feedback.title?.includes("[AUTOMATED FEEDBACK]");
    }
    return true;
  });

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper function to get feedback type icon
  const getFeedbackIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case 'bug_report': return <Bug className="w-4 h-4" />;
      case 'improvement_suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'performance_issue': return <AlertTriangle className="w-4 h-4" />;
      case 'positive_feedback': return <ThumbsUp className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Toggle feedback expansion
  const toggleFeedbackExpansion = (feedbackId: number) => {
    setExpandedFeedback(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "production_planning", label: "Production Planning" },
    { value: "schedule_optimization", label: "Schedule Optimization" },
    { value: "inventory_optimization", label: "Inventory Optimization" },
    { value: "capacity_optimization", label: "Capacity Optimization" },
    { value: "demand_forecasting", label: "Demand Forecasting" },
    { value: "ctp_optimization", label: "Capable to Promise (CTP) Optimization" },
    { value: "order_optimization", label: "Order Optimization" }
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
    <Card className="hover:shadow-md transition-shadow">
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
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="capitalize">{algorithm.category.replace('_', ' ')}</span>
          <span>v{algorithm.version}</span>
        </div>
        {algorithm.performance && Object.keys(algorithm.performance).length > 0 && (
          <div className="mb-3 flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Performance: {algorithm.performance.score || 'N/A'}</span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAlgorithm(algorithm);
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            Details
          </Button>
          {algorithm.name === 'backwards-scheduling' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setArchitectureAlgorithmName(algorithm.displayName);
                setShowArchitectureView(true);
              }}
            >
              <Cpu className="w-3 h-3 mr-1" />
              Architecture
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Show algorithm architecture view if selected
  if (showArchitectureView) {
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
          <AlgorithmArchitectureView 
            algorithmName={architectureAlgorithmName}
            onClose={() => setShowArchitectureView(false)}
          />
        </div>
      </div>
    );
  }

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
          <BackwardsSchedulingAlgorithm onNavigateBack={() => setShowBackwardsScheduling(false)} />
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
            <Dialog open={showAICreateDialog} onOpenChange={(open) => {
              setShowAICreateDialog(open);
              if (!open) resetAISession();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Collaborate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col overflow-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Algorithm Development Assistant
                    {aiSessionActive && (
                      <Badge variant="outline" className="ml-2">
                        Step {aiSessionStep}/5
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    Work collaboratively with AI to develop a sophisticated optimization algorithm tailored to your specific needs
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
                  {!aiSessionActive ? (
                    /* Initial Introduction */
                    <div className="flex-1 overflow-y-auto space-y-4 p-1" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Let's Build Your Algorithm Together</h3>
                            <p className="text-gray-700">
                              I'll guide you through a step-by-step process to understand your requirements and develop a custom optimization algorithm. This includes:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                              <li><strong>Problem Analysis:</strong> Understanding your specific optimization challenges</li>
                              <li><strong>Objective Definition:</strong> Clarifying what you want to optimize for</li>
                              <li><strong>Constraint Identification:</strong> Mapping out limitations and requirements</li>
                              <li><strong>Algorithm Design:</strong> Creating the optimization logic and parameters</li>
                              <li><strong>Testing Strategy:</strong> Planning how to validate the algorithm performance</li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-3">
                              The process typically takes 10-15 minutes and results in a production-ready algorithm.
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      <div className="flex justify-center">
                        <Button 
                          onClick={startAISession}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8 py-2"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Start Collaborative Development
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Active Session Interface */
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                      {/* Progress Indicator */}
                      <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Development Progress</span>
                          <span className="text-sm text-gray-600">{aiSessionStep}/5 Steps Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                            style={{ width: `${(aiSessionStep / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Conversation Area */}
                      <div 
                        className="flex-1 overflow-y-auto border rounded-lg p-2 sm:p-4 space-y-4 bg-gray-50" 
                        style={{ 
                          WebkitOverflowScrolling: 'touch',
                          overscrollBehavior: 'contain',
                          touchAction: 'pan-y',
                          minHeight: 0
                        }}
                      >
                        {aiSessionMessages.map((message, index) => (
                          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg ${
                              message.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white border shadow-sm'
                            }`}>
                              <div className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</div>
                            </div>
                          </div>
                        ))}
                        {aiCollaborateSession.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-white border shadow-sm p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                AI is thinking...
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current Algorithm Draft Preview */}
                      {currentAlgorithmDraft && (
                        <Card className="p-4 bg-green-50 border-green-200">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Current Algorithm Draft
                          </h4>
                          <div className="text-sm space-y-1">
                            <div><strong>Name:</strong> {currentAlgorithmDraft.name}</div>
                            <div><strong>Objective:</strong> {currentAlgorithmDraft.objective}</div>
                            <div><strong>Category:</strong> {currentAlgorithmDraft.category}</div>
                            {currentAlgorithmDraft.parameters && (
                              <div><strong>Parameters:</strong> {Object.keys(currentAlgorithmDraft.parameters).length} configured</div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* Input Area */}
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your response or ask questions about the algorithm development..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          rows={2}
                          className="resize-none text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (aiPrompt.trim()) {
                                aiCollaborateSession.mutate({ message: aiPrompt, sessionData: {} });
                              }
                            }
                          }}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="text-xs text-gray-500">
                            Press Enter to send, Shift+Enter for new line
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={resetAISession}
                            >
                              Start Over
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => aiCollaborateSession.mutate({ message: aiPrompt, sessionData: {} })}
                              disabled={!aiPrompt.trim() || aiCollaborateSession.isPending}
                              className="bg-gradient-to-r from-purple-500 to-pink-600"
                            >
                              Send
                            </Button>
                            {aiSessionStep >= 5 && currentAlgorithmDraft && (
                              <Button 
                                size="sm"
                                onClick={() => finalizeAIAlgorithmMutation.mutate(currentAlgorithmDraft)}
                                disabled={finalizeAIAlgorithmMutation.isPending}
                                className="bg-gradient-to-r from-green-500 to-emerald-600"
                              >
                                {finalizeAIAlgorithmMutation.isPending ? "Creating..." : "Create Algorithm"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-5 text-xs sm:text-sm">
              <TabsTrigger value="algorithms" className="px-2 sm:px-4">
                <span className="hidden sm:inline">Algorithms</span>
                <span className="sm:hidden">Algo</span>
              </TabsTrigger>
              <TabsTrigger value="development" className="px-2 sm:px-4">
                <span className="hidden sm:inline">Development</span>
                <span className="sm:hidden">Dev</span>
              </TabsTrigger>
              <TabsTrigger value="testing" className="px-2 sm:px-4">
                <span className="hidden sm:inline">Testing</span>
                <span className="sm:hidden">Test</span>
              </TabsTrigger>
              <TabsTrigger value="deployments" className="px-2 sm:px-4">
                <span className="hidden sm:inline">Deployments</span>
                <span className="sm:hidden">Deploy</span>
              </TabsTrigger>
              <TabsTrigger value="extensions" className="px-2 sm:px-4">
                <span className="hidden sm:inline">Extensions</span>
                <span className="sm:hidden">Ext</span>
              </TabsTrigger>
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

          <TabsContent value="development" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Development & Improvement</h2>
              <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                <Brain className="w-4 h-4 mr-2" />
                Create New Algorithm
              </Button>
            </div>

            {/* Development Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Algorithm Selection Panel */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      Select Algorithm
                    </CardTitle>
                    <CardDescription>
                      Choose an algorithm to review feedback and make improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {algorithms.length === 0 ? (
                      <div className="text-center py-4">
                        <Code2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No algorithms available</p>
                        <p className="text-xs text-gray-500">Create your first algorithm to get started</p>
                      </div>
                    ) : (
                      algorithms.map((algorithm: OptimizationAlgorithm) => (
                        <div
                          key={algorithm.id}
                          onClick={() => setSelectedAlgorithmForDev(algorithm)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAlgorithmForDev?.id === algorithm.id
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{algorithm.displayName}</h4>
                              <p className="text-xs text-gray-600 mt-1">{algorithm.category}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={algorithm.status === 'deployed' ? 'default' : 'secondary'} className="text-xs">
                                  {algorithm.status}
                                </Badge>
                                <span className="text-xs text-gray-500">v{algorithm.version}</span>
                              </div>
                            </div>
                            {selectedAlgorithmForDev?.id === algorithm.id && (
                              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Feedback Statistics */}
                {selectedAlgorithmForDev && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Feedback Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Bug className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'bug_report').length}</p>
                            <p className="text-xs text-gray-600">Bugs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'improvement_suggestion').length}</p>
                            <p className="text-xs text-gray-600">Ideas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.severity === 'critical' || f.severity === 'high').length}</p>
                            <p className="text-xs text-gray-600">Critical</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'positive_feedback').length}</p>
                            <p className="text-xs text-gray-600">Positive</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Feedback Review Panel */}
              <div className="lg:col-span-2">
                {!selectedAlgorithmForDev ? (
                  <Card className="p-8 text-center">
                    <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select an Algorithm</h3>
                    <p className="text-gray-600 mb-4">
                      Choose an algorithm from the left panel to review user feedback and identify improvement opportunities
                    </p>
                    <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                      <Brain className="w-4 h-4 mr-2" />
                      Create New Algorithm Instead
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Algorithm Info & Controls */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Code2 className="w-5 h-5" />
                              {selectedAlgorithmForDev.displayName}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {selectedAlgorithmForDev.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={selectedAlgorithmForDev.status === 'deployed' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {selectedAlgorithmForDev.status}
                            </Badge>
                            <Badge variant="outline">v{selectedAlgorithmForDev.version}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                            <SelectTrigger className="w-48">
                              <Filter className="w-4 h-4 mr-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Feedback</SelectItem>
                              <SelectItem value="bugs">Bug Reports</SelectItem>
                              <SelectItem value="improvements">Improvement Ideas</SelectItem>
                              <SelectItem value="critical">Critical Issues</SelectItem>
                              <SelectItem value="max">Max AI Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageSquare className="w-4 h-4" />
                            <span>{filteredFeedback.length} feedback items</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Feedback List */}
                    <div className="space-y-3">
                      {filteredFeedback.length === 0 ? (
                        <Card className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
                          <p className="text-gray-600 mb-4">
                            {feedbackFilter === "all" 
                              ? "No user feedback has been submitted for this algorithm yet"
                              : `No ${feedbackFilter} feedback found for this algorithm`
                            }
                          </p>
                          <Button variant="outline" onClick={() => window.open('/feedback?tab=submit&type=algorithm', '_blank')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feedback
                          </Button>
                        </Card>
                      ) : (
                        filteredFeedback.map((feedback: any) => (
                          <Card key={feedback.id} className="transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0">
                                    {getFeedbackIcon(feedback.feedbackType)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">
                                        {/* Show Max indicator for automated feedback */}
                                        {(feedback.submittedBy === 9 || 
                                          (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant")) && (
                                          <span className="inline-flex items-center gap-1 mr-2">
                                            <Bot className="w-4 h-4 text-purple-600" />
                                            <span className="text-xs font-medium text-purple-600">MAX AI</span>
                                          </span>
                                        )}
                                        {feedback.title}
                                      </h4>
                                      <Badge className={`${getSeverityColor(feedback.severity)} text-white text-xs`}>
                                        {feedback.severity}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {feedback.category}
                                      </Badge>
                                      {/* Automated feedback badge */}
                                      {(feedback.submittedBy === 9 || 
                                        (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant")) && (
                                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                                          AUTOMATED
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {feedback.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>Submitted {new Date(feedback.createdAt).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span>Status: {feedback.status}</span>
                                      {feedback.suggestedImprovement && (
                                        <>
                                          <span>•</span>
                                          <span className="text-blue-600">Has suggestion</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFeedbackExpansion(feedback.id)}
                                  className="flex-shrink-0"
                                >
                                  {expandedFeedback.has(feedback.id) ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </CardHeader>
                            
                            {expandedFeedback.has(feedback.id) && (
                              <CardContent className="pt-0">
                                <div className="space-y-4 pl-7">
                                  {feedback.expectedResult && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Expected Result:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.expectedResult}</p>
                                    </div>
                                  )}
                                  {feedback.actualResult && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Actual Result:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.actualResult}</p>
                                    </div>
                                  )}
                                  {feedback.suggestedImprovement && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                                        Suggested Improvement:
                                      </h5>
                                      <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{feedback.suggestedImprovement}</p>
                                    </div>
                                  )}
                                  {feedback.reproductionSteps && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Reproduction Steps:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.reproductionSteps}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <Button size="sm" variant="outline">
                                      <ArrowRight className="w-3 h-3 mr-1" />
                                      Implement
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Respond
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Mark Resolved
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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