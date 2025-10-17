import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Lightbulb, 
  Bug, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Send,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  User,
  Calendar,
  Tag,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Reply,
  Award,
  Target,
  Zap,
  Heart,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Settings,
  Flag,
  Archive,
  RefreshCw,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useLocation } from "wouter";

interface FeedbackItem {
  id: number;
  type: "suggestion" | "bug" | "feature_request" | "improvement" | "complaint" | "praise";
  category: "scheduling" | "ui_ux" | "performance" | "reporting" | "mobile" | "integration" | "general";
  title: string;
  description: string;
  submittedBy: string;
  submitterName?: string;
  submittedDate: string;
  createdAt?: string;
  status: "new" | "under_review" | "in_progress" | "completed" | "rejected" | "duplicate";
  priority: "low" | "medium" | "high" | "critical";
  votes: number;
  userVote?: "up" | "down" | null;
  comments: FeedbackComment[];
  tags: string[];
  assignedTo?: string;
  resolvedDate?: string;
  resolution?: string;
  implementationVersion?: string;
}

interface FeedbackComment {
  id: number;
  feedbackId: number;
  author: string;
  content: string;
  createdDate: string;
  isOfficial: boolean;
}

interface FeedbackStats {
  totalSubmissions: number;
  openItems: number;
  completedItems: number;
  averageResponseTime: number;
  topCategories: { category: string; count: number }[];
  recentActivity: number;
}

interface AlgorithmFeedback {
  id: number;
  schedulingHistoryId?: number;
  algorithmPerformanceId?: number;
  optimizationRunId?: number;
  algorithmName: string;
  algorithmVersion: string;
  executionId?: string;
  submittedBy: number;
  feedbackType: "improvement_suggestion" | "bug_report" | "performance_issue" | "positive_feedback";
  severity: "low" | "medium" | "high" | "critical";
  category: "scheduling_accuracy" | "resource_utilization" | "performance" | "usability" | "results_quality";
  title: string;
  description: string;
  expectedResult?: string;
  actualResult?: string;
  suggestedImprovement?: string;
  plantId?: number;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: number;
  resolvedBy?: number;
  resolvedAt?: string;
  resolutionNotes?: string;
  implementationStatus?: "not_started" | "in_development" | "testing" | "deployed";
  implementationNotes?: string;
  implementationVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Feedback() {
  const { isMaxOpen } = useMaxDock();
  const [, setLocation] = useLocation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState("submit");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [currentUser] = useState("Current User"); // In real app, this would come from auth
  
  // Algorithm feedback specific state
  const [algorithmFeedbackDialogOpen, setAlgorithmFeedbackDialogOpen] = useState(false);
  const [selectedAlgorithmContext, setSelectedAlgorithmContext] = useState<{
    algorithmName?: string;
    algorithmVersion?: string;
    executionId?: string;
    schedulingHistoryId?: number;
    algorithmPerformanceId?: number;
    optimizationRunId?: number;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for available algorithms to help with auto-completion
  const { data: availableAlgorithms = [] } = useQuery({
    queryKey: ["/api/optimization/algorithms"],
  });

  // Handle URL parameters and sessionStorage context for algorithm feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const typeParam = urlParams.get('type');
    
    // Handle both algorithm tab and algorithm type
    if (tabParam === 'algorithm' || (tabParam === 'submit' && typeParam === 'algorithm')) {
      setActiveTab(tabParam || 'submit');
      
      // Check for algorithm context in sessionStorage
      const algorithmContextStr = sessionStorage.getItem('algorithmFeedbackContext');
      if (algorithmContextStr) {
        try {
          const algorithmContext = JSON.parse(algorithmContextStr);
          setSelectedAlgorithmContext(algorithmContext);
          // Clear the context after using it
          sessionStorage.removeItem('algorithmFeedbackContext');
        } catch (e) {
          console.error('Failed to parse algorithm feedback context:', e);
        }
      } else {
        // If no specific context, try to auto-detect from current page or recent activity
        const currentPath = window.location.pathname;
        if (currentPath.includes('scheduling') && availableAlgorithms.length > 0) {
          // Auto-detect scheduling algorithm context
          const schedulingAlgorithm = availableAlgorithms.find((alg: any) => 
            alg.name.includes('scheduling') || alg.type === 'scheduling'
          );
          if (schedulingAlgorithm) {
            setSelectedAlgorithmContext({
              algorithmName: schedulingAlgorithm.name,
              algorithmVersion: schedulingAlgorithm.version || "1.0.0",
              triggerContext: "auto-detected-scheduling"
            });
          }
        }
      }
    }
    
    // If URL has tab=submit and type=algorithm, auto-open algorithm feedback dialog
    if (tabParam === 'submit' && typeParam === 'algorithm') {
      setAlgorithmFeedbackDialogOpen(true);
    }
  }, [availableAlgorithms]);

  // Fetch feedback data from API
  const { data: feedbackData = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/feedback"],
  });

  // Mock stats - to be replaced when API is ready
  const mockStats: FeedbackStats = {
    totalSubmissions: 47,
    openItems: 23,
    completedItems: 18,
    averageResponseTime: 2.3,
    topCategories: [
      { category: "scheduling", count: 12 },
      { category: "ui_ux", count: 8 },
      { category: "reporting", count: 7 },
      { category: "mobile", count: 6 },
      { category: "performance", count: 5 }
    ],
    recentActivity: 8
  };

  // Fetch feedback stats from API  
  const { data: feedbackStats = mockStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/feedback/stats"],
  });

  // Fetch algorithm feedback data from API
  const { data: algorithmFeedbackData = [], isLoading: algorithmFeedbackLoading } = useQuery({
    queryKey: ["/api/algorithm-feedback"],
  });

  // Combine and normalize feedback data for unified viewing
  const combinedFeedback = useMemo(() => {
    const regularFeedback = (feedbackData || []).map((item: any) => ({
      ...item,
      feedbackSource: 'regular',
      algorithmName: null,
      algorithmVersion: null,
      executionId: null
    }));

    const algorithmFeedback = (algorithmFeedbackData || []).map((item: any) => ({
      ...item,
      feedbackSource: 'algorithm',
      type: item.feedbackType, // Map feedbackType to type for consistency
      submittedBy: `User #${item.submittedBy}`,
      submittedDate: item.createdAt,
      votes: 0, // Algorithm feedback doesn't have votes yet
      userVote: null,
      comments: [],
      tags: [item.algorithmName, `v${item.algorithmVersion}`, item.category]
    }));

    return [...regularFeedback, ...algorithmFeedback];
  }, [feedbackData, algorithmFeedbackData]);

  // Mock feedback data (to be removed after API integration)
  const mockFeedback: FeedbackItem[] = [
    {
      id: 1,
      type: "suggestion",
      category: "scheduling",
      title: "Add bulk operation scheduling",
      description: "It would be great to have the ability to schedule multiple operations at once instead of doing them one by one. This would save a lot of time when setting up large production runs.",
      submittedBy: "John Operator",
      submittedDate: "2025-07-10",
      status: "under_review",
      priority: "medium",
      votes: 12,
      userVote: "up",
      comments: [
        {
          id: 1,
          feedbackId: 1,
          author: "Sarah Manager",
          content: "This is a great suggestion. We're evaluating the technical feasibility for the next release.",
          createdDate: "2025-07-11",
          isOfficial: true
        }
      ],
      tags: ["scheduling", "bulk-operations", "productivity"],
      assignedTo: "Development Team"
    },
    {
      id: 2,
      type: "bug",
      category: "ui_ux",
      title: "Gantt chart scrolling issues on mobile",
      description: "When using the Gantt chart on mobile devices, the scrolling becomes jerky and sometimes operations don't render properly. This makes it difficult to use on tablets in the shop floor.",
      submittedBy: "Mike Technician",
      submittedDate: "2025-07-08",
      status: "in_progress",
      priority: "high",
      votes: 8,
      userVote: null,
      comments: [
        {
          id: 2,
          feedbackId: 2,
          author: "Tech Support",
          content: "We've reproduced this issue and are working on a fix. Expected resolution in the next update.",
          createdDate: "2025-07-09",
          isOfficial: true
        }
      ],
      tags: ["mobile", "gantt-chart", "bug"],
      assignedTo: "UI/UX Team"
    },
    {
      id: 3,
      type: "feature_request",
      category: "reporting",
      title: "Export reports to Excel format",
      description: "Currently reports can only be viewed in the browser. Adding Excel export would make it easier to share reports with management and do additional analysis.",
      submittedBy: "Lisa Supervisor",
      submittedDate: "2025-07-05",
      status: "completed",
      priority: "medium",
      votes: 15,
      userVote: "up",
      comments: [
        {
          id: 3,
          feedbackId: 3,
          author: "Product Manager",
          content: "Great news! Excel export functionality has been added to all reports. You can find the export button in the report header.",
          createdDate: "2025-07-12",
          isOfficial: true
        }
      ],
      tags: ["reporting", "excel", "export"],
      assignedTo: "Development Team",
      resolvedDate: "2025-07-12",
      resolution: "Feature implemented in version 2.1.0",
      implementationVersion: "2.1.0"
    },
    {
      id: 4,
      type: "praise",
      category: "general",
      title: "Love the new Max AI assistant!",
      description: "The AI assistant is incredibly helpful for optimizing schedules and getting quick answers. It's like having an expert available 24/7. Great work on this feature!",
      submittedBy: "Tom Production Manager",
      submittedDate: "2025-07-12",
      status: "new",
      priority: "low",
      votes: 20,
      userVote: "up",
      comments: [],
      tags: ["ai", "praise", "max-assistant"]
    },
    {
      id: 5,
      type: "improvement",
      category: "performance",
      title: "Faster loading for large datasets",
      description: "When we have many jobs and operations (500+), the dashboard takes a long time to load. Would be great to have pagination or lazy loading to improve performance.",
      submittedBy: "David Planner",
      submittedDate: "2025-07-06",
      status: "under_review",
      priority: "medium",
      votes: 6,
      userVote: null,
      comments: [
        {
          id: 4,
          feedbackId: 5,
          author: "Tech Lead",
          content: "We're investigating performance optimizations including pagination and data virtualization. This is on our roadmap.",
          createdDate: "2025-07-07",
          isOfficial: true
        }
      ],
      tags: ["performance", "loading", "optimization"],
      assignedTo: "Backend Team"
    }
  ];

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: Partial<FeedbackItem>) => {
      return apiRequest("POST", "/api/feedback", feedback);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it and get back to you soon.",
      });
      setFeedbackDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/stats"] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Vote on feedback mutation
  const voteFeedbackMutation = useMutation({
    mutationFn: async ({ id, vote }: { id: number; vote: "up" | "down" }) => {
      return apiRequest("POST", `/api/feedback/${id}/vote`, { voteType: vote });
    },
    onSuccess: () => {
      toast({
        title: "Vote Recorded",
        description: "Your vote has been recorded. Thank you for your input!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/stats"] });
    },
    onError: () => {
      toast({
        title: "Vote Failed",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ feedbackId, comment }: { feedbackId: number; comment: string }) => {
      // In real app, this would add comment to API
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
      setCommentDialogOpen(false);
      setNewComment("");
    },
  });

  // Submit algorithm feedback mutation
  const submitAlgorithmFeedbackMutation = useMutation({
    mutationFn: async (feedback: Partial<AlgorithmFeedback>) => {
      return apiRequest("POST", "/api/algorithm-feedback", feedback);
    },
    onSuccess: () => {
      toast({
        title: "Algorithm Feedback Submitted",
        description: "Thank you for your algorithm feedback! This helps improve our optimization algorithms.",
      });
      setAlgorithmFeedbackDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/algorithm-feedback"] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit algorithm feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Vote on algorithm feedback mutation
  const voteAlgorithmFeedbackMutation = useMutation({
    mutationFn: async ({ id, vote }: { id: number; vote: "upvote" | "downvote" }) => {
      return apiRequest("POST", `/api/algorithm-feedback/${id}/vote`, { voteType: vote });
    },
    onSuccess: () => {
      toast({
        title: "Vote Recorded",
        description: "Your vote on algorithm feedback has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/algorithm-feedback"] });
    },
    onError: () => {
      toast({
        title: "Vote Failed",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "under_review": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "duplicate": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "suggestion": return "bg-purple-100 text-purple-800";
      case "bug": return "bg-red-100 text-red-800";
      case "feature_request": return "bg-blue-100 text-blue-800";
      case "improvement": return "bg-green-100 text-green-800";
      case "complaint": return "bg-orange-100 text-orange-800";
      case "praise": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Algorithm feedback utility functions
  const getAlgorithmFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "improvement_suggestion": return "bg-blue-100 text-blue-800";
      case "bug_report": return "bg-red-100 text-red-800";
      case "performance_issue": return "bg-orange-100 text-orange-800";
      case "positive_feedback": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAlgorithmSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getAlgorithmStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter combined feedback (regular + algorithm)
  const filteredFeedback = combinedFeedback.filter((item: any) => {
    const matchesSearch = searchTerm === "" || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.submittedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.algorithmName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.type === typeFilter || item.feedbackType === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  // Sort combined feedback
  const sortedFeedback = [...filteredFeedback].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || b.submittedDate).getTime() - new Date(a.createdAt || a.submittedDate).getTime();
      case "oldest":
        return new Date(a.createdAt || a.submittedDate).getTime() - new Date(b.createdAt || b.submittedDate).getTime();
      case "most_votes":
        return (b.votes || 0) - (a.votes || 0);
      case "least_votes":
        return (a.votes || 0) - (b.votes || 0);
      default:
        return 0;
    }
  });

  // Algorithm Feedback Content Component
  const AlgorithmFeedbackContent = () => {
    const [algorithmSearchTerm, setAlgorithmSearchTerm] = useState("");
    const [algorithmTypeFilter, setAlgorithmTypeFilter] = useState<string>("all");
    const [algorithmStatusFilter, setAlgorithmStatusFilter] = useState<string>("all");
    const [algorithmCategoryFilter, setAlgorithmCategoryFilter] = useState<string>("all");
    const [algorithmSortBy, setAlgorithmSortBy] = useState<string>("newest");

    const currentAlgorithmFeedback: AlgorithmFeedback[] = algorithmFeedbackLoading ? [] : (algorithmFeedbackData as AlgorithmFeedback[]);
    
    const filteredAlgorithmFeedback = currentAlgorithmFeedback.filter((item: AlgorithmFeedback) => {
      const matchesSearch = algorithmSearchTerm === "" || 
        item.title.toLowerCase().includes(algorithmSearchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(algorithmSearchTerm.toLowerCase()) ||
        item.algorithmName.toLowerCase().includes(algorithmSearchTerm.toLowerCase());
      
      const matchesType = algorithmTypeFilter === "all" || item.feedbackType === algorithmTypeFilter;
      const matchesStatus = algorithmStatusFilter === "all" || item.status === algorithmStatusFilter;
      const matchesCategory = algorithmCategoryFilter === "all" || item.category === algorithmCategoryFilter;
      
      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    const sortedAlgorithmFeedback = [...filteredAlgorithmFeedback].sort((a: AlgorithmFeedback, b: AlgorithmFeedback) => {
      switch (algorithmSortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "severity":
          const severityOrder = { "critical": 4, "high": 3, "medium": 2, "low": 1 };
          return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        default:
          return 0;
      }
    });

    return (
      <div className="space-y-6">
        {/* Algorithm Feedback Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Algorithm Feedback</h2>
            <p className="text-gray-600">Submit feedback on scheduling and optimization algorithm performance</p>
          </div>
          <Button 
            onClick={() => setAlgorithmFeedbackDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Submit Algorithm Feedback
          </Button>
        </div>

        {/* Algorithm Feedback Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search algorithm feedback..."
              className="pl-10"
              value={algorithmSearchTerm}
              onChange={(e) => setAlgorithmSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={algorithmTypeFilter} onValueChange={setAlgorithmTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="improvement_suggestion">Improvement Suggestion</SelectItem>
              <SelectItem value="bug_report">Bug Report</SelectItem>
              <SelectItem value="performance_issue">Performance Issue</SelectItem>
              <SelectItem value="positive_feedback">Positive Feedback</SelectItem>
            </SelectContent>
          </Select>

          <Select value={algorithmStatusFilter} onValueChange={setAlgorithmStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={algorithmCategoryFilter} onValueChange={setAlgorithmCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="scheduling_accuracy">Scheduling Accuracy</SelectItem>
              <SelectItem value="resource_utilization">Resource Utilization</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="usability">Usability</SelectItem>
              <SelectItem value="results_quality">Results Quality</SelectItem>
            </SelectContent>
          </Select>

          <Select value={algorithmSortBy} onValueChange={setAlgorithmSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Algorithm Feedback List */}
        <div className="space-y-4">
          {algorithmFeedbackLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading algorithm feedback...</p>
            </div>
          ) : sortedAlgorithmFeedback.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Algorithm Feedback Yet</h3>
                <p className="text-gray-600 mb-4">Be the first to provide feedback on algorithm performance</p>
                <Button onClick={() => setAlgorithmFeedbackDialogOpen(true)}>
                  Submit Algorithm Feedback
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedAlgorithmFeedback.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getAlgorithmSeverityColor(item.severity)}`}></div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <Badge className={getAlgorithmFeedbackTypeColor(item.feedbackType)}>
                          {item.feedbackType.replace("_", " ")}
                        </Badge>
                        <Badge className={getAlgorithmStatusColor(item.status)}>
                          {item.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.algorithmName} v{item.algorithmVersion}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      
                      {/* Show expected vs actual results if available */}
                      {(item.expectedResult || item.actualResult) && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                          {item.expectedResult && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Expected Result:</span>
                              <p className="text-sm text-gray-600">{item.expectedResult}</p>
                            </div>
                          )}
                          {item.actualResult && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Actual Result:</span>
                              <p className="text-sm text-gray-600">{item.actualResult}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show suggested improvement if available */}
                      {item.suggestedImprovement && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <span className="text-sm font-medium text-blue-800">Suggested Improvement:</span>
                          <p className="text-sm text-blue-700">{item.suggestedImprovement}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          User #{item.submittedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {item.category.replace("_", " ")}
                        </span>
                        {item.executionId && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Run #{item.executionId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resolution details */}
                  {item.status === "resolved" && item.resolutionNotes && (
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-green-800">Resolution</p>
                      <p className="text-green-700">{item.resolutionNotes}</p>
                      {item.implementationVersion && (
                        <p className="text-xs text-green-600 mt-1">
                          Implemented in version {item.implementationVersion}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Implementation status */}
                  {item.implementationStatus && item.implementationStatus !== "not_started" && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-blue-800">Implementation Status</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.implementationStatus.replace("_", " ")}
                        </Badge>
                        {item.implementationNotes && (
                          <span className="text-sm text-blue-700">{item.implementationNotes}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const PageContent = () => (
    <div className="space-y-6">
      {/* Submit Feedback Tab */}
      {activeTab === "submit" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Submit New Feedback
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("view")}
                  data-testid="button-close-submit"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Feedback Type
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="praise">Praise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Category
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduling">Scheduling</SelectItem>
                        <SelectItem value="ui_ux">UI/UX</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Title
                  </label>
                  <Input placeholder="Brief description of your feedback" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <Textarea 
                    placeholder="Provide detailed information about your feedback, including steps to reproduce (for bugs) or specific requirements (for features)"
                    className="min-h-[120px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Priority
                  </label>
                  <Select>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags (Optional)
                  </label>
                  <Input placeholder="Add relevant tags separated by commas" />
                </div>
                
                <Button className="w-full flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Feedback Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.totalSubmissions || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.openItems || 0}
                  </div>
                  <div className="text-sm text-gray-500">Open Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.completedItems || 0}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.averageResponseTime || 0}d
                  </div>
                  <div className="text-sm text-gray-500">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Feedback Tab */}
      {activeTab === "view" && (
        <div className="space-y-4">
          {/* Header with Exit Button */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  General Feedback and Suggestions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  data-testid="button-close-view"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="improvement_suggestion">Algorithm Improvement</SelectItem>
                <SelectItem value="bug_report">Algorithm Bug</SelectItem>
                <SelectItem value="performance_issue">Performance Issue</SelectItem>
                <SelectItem value="positive_feedback">Positive Feedback</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_votes">Most Votes</SelectItem>
                <SelectItem value="least_votes">Least Votes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback List */}
          <div className="space-y-4">
            {sortedFeedback.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${item.feedbackSource === 'algorithm' ? getAlgorithmSeverityColor(item.severity) : getPriorityColor(item.priority)}`}></div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <Badge className={item.feedbackSource === 'algorithm' ? getAlgorithmFeedbackTypeColor(item.feedbackType) : getTypeColor(item.type)}>
                          {(item.feedbackType || item.type).replace("_", " ")}
                        </Badge>
                        <Badge className={item.feedbackSource === 'algorithm' ? getAlgorithmStatusColor(item.status) : getStatusColor(item.status)}>
                          {item.status.replace("_", " ")}
                        </Badge>
                        {item.feedbackSource === 'algorithm' && (
                          <Badge variant="outline" className="text-xs">
                            {item.algorithmName} v{item.algorithmVersion}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      
                      {/* Algorithm-specific information */}
                      {item.feedbackSource === 'algorithm' && (item.expectedResult || item.actualResult) && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                          {item.expectedResult && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Expected Result:</span>
                              <p className="text-sm text-gray-600">{item.expectedResult}</p>
                            </div>
                          )}
                          {item.actualResult && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Actual Result:</span>
                              <p className="text-sm text-gray-600">{item.actualResult}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Algorithm suggested improvement */}
                      {item.feedbackSource === 'algorithm' && item.suggestedImprovement && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <span className="text-sm font-medium text-blue-800">Suggested Improvement:</span>
                          <p className="text-sm text-blue-700">{item.suggestedImprovement}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {item.submitterName || item.submittedBy || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.createdAt || item.submittedDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {item.category}
                        </span>
                        {item.feedbackSource === 'algorithm' && item.executionId && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Run #{item.executionId}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {item.feedbackSource === 'algorithm' ? 'Algorithm' : 'General'}
                          </Badge>
                        </span>
                      </div>
                    </div>
                    {item.feedbackSource !== 'algorithm' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={item.userVote === "up" ? "default" : "outline"}
                            onClick={() => voteFeedbackMutation.mutate({ id: item.id, vote: "up" })}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium">{item.votes || 0}</span>
                          <Button
                            size="sm"
                            variant={item.userVote === "down" ? "default" : "outline"}
                            onClick={() => voteFeedbackMutation.mutate({ id: item.id, vote: "down" })}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map((tag: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Resolution */}
                  {(item.status === "completed" || item.status === "resolved") && (item.resolution || item.resolutionNotes) && (
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-green-800">Resolution</p>
                      <p className="text-green-700">{item.resolution || item.resolutionNotes}</p>
                      {item.implementationVersion && (
                        <p className="text-xs text-green-600 mt-1">
                          Implemented in version {item.implementationVersion}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Implementation status for algorithm feedback */}
                  {item.feedbackSource === 'algorithm' && item.implementationStatus && item.implementationStatus !== "not_started" && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-blue-800">Implementation Status</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.implementationStatus.replace("_", " ")}
                        </Badge>
                        {item.implementationNotes && (
                          <span className="text-sm text-blue-700">{item.implementationNotes}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Comments Preview */}
                  {item.comments.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Latest Response ({item.comments.length} total)
                      </p>
                      <div className="space-y-2">
                        {item.comments.slice(-1).map((comment: any) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{comment.author}</span>
                                {comment.isOfficial && (
                                  <Badge variant="outline" className="text-xs">Official</Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdDate).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setCommentDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Add Comment
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.totalSubmissions || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Submissions</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.openItems || 0}
                  </div>
                  <div className="text-sm text-gray-500">Open Items</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.completedItems || 0}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statsLoading ? "..." : (feedbackStats as any)?.averageResponseTime || 0}d
                  </div>
                  <div className="text-sm text-gray-500">Avg Response Time</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsLoading ? (
                  <div className="text-center text-gray-500">Loading...</div>
                ) : (feedbackStats as any)?.topCategories?.length > 0 ? (
                  (feedbackStats as any).topCategories.map((category: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="capitalize">{category.category.replace("_", " ")}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(category.count / ((feedbackStats as any)?.totalSubmissions || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{category.count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">No category data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-50 ${isMaximized ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col`}>
      {/* Maximize button in top right corner matching hamburger menu positioning */}
      <div className="hidden sm:block fixed top-2 right-16 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 sm:p-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2" />
              Feedback & Suggestions
            </h1>
            <p className="text-sm md:text-base text-gray-600">Share your ideas and help us improve PlanetTogether</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto">
            <TabsList className="h-10 inline-flex sm:w-full sm:grid sm:grid-cols-4">
              <TabsTrigger 
                value="submit" 
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
              >
                <span className="sm:hidden">Submit</span>
                <span className="hidden sm:inline">Submit Feedback</span>
              </TabsTrigger>
              <TabsTrigger 
                value="view" 
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
              >
                <span className="sm:hidden">View</span>
                <span className="hidden sm:inline">View Feedback</span>
              </TabsTrigger>
              <TabsTrigger 
                value="algorithm" 
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
              >
                <span className="sm:hidden">Algorithm</span>
                <span className="hidden sm:inline">Algorithm Feedback</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="submit" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="view" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="algorithm" className="mt-6">
            <AlgorithmFeedbackContent />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <PageContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFeedback && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedFeedback.title}</p>
                <p className="text-sm text-gray-600">{selectedFeedback.description}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Comment
              </label>
              <Textarea
                placeholder="Share your thoughts, ask questions, or provide additional information..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setCommentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedFeedback && addCommentMutation.mutate({ 
                  feedbackId: selectedFeedback.id, 
                  comment: newComment 
                })}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Algorithm Feedback Submission Dialog */}
      <Dialog open={algorithmFeedbackDialogOpen} onOpenChange={setAlgorithmFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Algorithm Feedback</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const feedbackData = {
                algorithmName: formData.get('algorithmName') as string,
                algorithmVersion: formData.get('algorithmVersion') as string,
                feedbackType: formData.get('feedbackType') as "improvement_suggestion" | "bug_report" | "performance_issue" | "positive_feedback",
                severity: formData.get('severity') as "low" | "medium" | "high" | "critical",
                category: formData.get('category') as "scheduling_accuracy" | "resource_utilization" | "performance" | "usability" | "results_quality",
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                expectedResult: (formData.get('expectedResult') as string) || undefined,
                actualResult: (formData.get('actualResult') as string) || undefined,
                suggestedImprovement: (formData.get('suggestedImprovement') as string) || undefined,
                executionId: selectedAlgorithmContext?.executionId,
                schedulingHistoryId: selectedAlgorithmContext?.schedulingHistoryId,
                algorithmPerformanceId: selectedAlgorithmContext?.algorithmPerformanceId,
                optimizationRunId: selectedAlgorithmContext?.optimizationRunId,
                submittedBy: 1, // This would come from auth context
                status: 'open' as const,
                priority: formData.get('severity') as "low" | "medium" | "high" | "critical", // Use severity as priority
              };
              submitAlgorithmFeedbackMutation.mutate(feedbackData);
            }}
            className="space-y-4"
          >
            {/* Algorithm Detection and Context */}
            {selectedAlgorithmContext && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Algorithm context detected: <strong>{selectedAlgorithmContext.algorithmName}</strong> v{selectedAlgorithmContext.algorithmVersion}
                  {selectedAlgorithmContext.executionId && ` (Run #${selectedAlgorithmContext.executionId})`}
                  {selectedAlgorithmContext.triggerContext === "auto-detected-scheduling" && " (Auto-detected from current page)"}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Algorithm Name *
                </label>
                <Select 
                  name="algorithmName"
                  defaultValue={selectedAlgorithmContext?.algorithmName || ""}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAlgorithms.map((algorithm: any) => (
                      <SelectItem key={algorithm.id} value={algorithm.name}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{algorithm.name}</span>
                          {algorithm.version && <span className="text-xs text-gray-500">v{algorithm.version}</span>}
                        </div>
                        {algorithm.description && (
                          <div className="text-xs text-gray-600 mt-1">{algorithm.description}</div>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="backwards-scheduling">backwards-scheduling</SelectItem>
                    <SelectItem value="forward-scheduling">forward-scheduling</SelectItem>
                    <SelectItem value="capacity-planning">capacity-planning</SelectItem>
                    <SelectItem value="resource-optimization">resource-optimization</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select from available algorithms or recently used ones
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Algorithm Version *
                </label>
                <Input 
                  name="algorithmVersion"
                  defaultValue={selectedAlgorithmContext?.algorithmVersion || "1.0.0"}
                  placeholder="e.g., 1.0.0, 2.1.3"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current version auto-detected when available
                </p>
              </div>
            </div>

            {/* Execution Context Display */}
            {(selectedAlgorithmContext?.executionId || selectedAlgorithmContext?.schedulingHistoryId) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execution Context
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedAlgorithmContext.executionId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Run ID:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border text-xs">
                        {selectedAlgorithmContext.executionId}
                      </span>
                    </div>
                  )}
                  {selectedAlgorithmContext.schedulingHistoryId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Scheduling History:</span>
                      <span className="text-xs">#{selectedAlgorithmContext.schedulingHistoryId}</span>
                    </div>
                  )}
                  {selectedAlgorithmContext.algorithmPerformanceId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Performance Tracking:</span>
                      <span className="text-xs">#{selectedAlgorithmContext.algorithmPerformanceId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Feedback Type *
                </label>
                <Select name="feedbackType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement_suggestion">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <div>
                          <div className="font-medium">Improvement Suggestion</div>
                          <div className="text-xs text-gray-500">Suggest ways to enhance algorithm performance</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="bug_report">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium">Bug Report</div>
                          <div className="text-xs text-gray-500">Report unexpected behavior or errors</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="performance_issue">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <div>
                          <div className="font-medium">Performance Issue</div>
                          <div className="text-xs text-gray-500">Report slow or inefficient execution</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="positive_feedback">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium">Positive Feedback</div>
                          <div className="text-xs text-gray-500">Share what worked well</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Severity *
                </label>
                <Select name="severity" defaultValue="medium" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Low - Minor enhancement or nice-to-have</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Medium - Noticeable impact on workflow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>High - Significant disruption or inefficiency</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Critical - System failure or major issue</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category *
              </label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduling_accuracy">
                    <div>
                      <div className="font-medium">Scheduling Accuracy</div>
                      <div className="text-xs text-gray-500">Timeline predictions, sequencing, dependencies</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="resource_utilization">
                    <div>
                      <div className="font-medium">Resource Utilization</div>
                      <div className="text-xs text-gray-500">Equipment allocation, capacity planning</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="performance">
                    <div>
                      <div className="font-medium">Performance</div>
                      <div className="text-xs text-gray-500">Speed, efficiency, computational time</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="usability">
                    <div>
                      <div className="font-medium">Usability</div>
                      <div className="text-xs text-gray-500">User interface, ease of use, workflow</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="results_quality">
                    <div>
                      <div className="font-medium">Results Quality</div>
                      <div className="text-xs text-gray-500">Output accuracy, feasibility, optimization</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Title *
              </label>
              <Input 
                name="title"
                placeholder="Brief summary of your feedback"
                required
              />
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Quick suggestions:</p>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={(e) => {
                      const titleInput = (e.target as HTMLElement).closest('form')?.querySelector('input[name="title"]') as HTMLInputElement;
                      if (titleInput) titleInput.value = `${selectedAlgorithmContext?.algorithmName || 'Algorithm'} scheduling takes too long`;
                    }}
                  >
                    Performance issue
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={(e) => {
                      const titleInput = (e.target as HTMLElement).closest('form')?.querySelector('input[name="title"]') as HTMLInputElement;
                      if (titleInput) titleInput.value = `${selectedAlgorithmContext?.algorithmName || 'Algorithm'} results could be more accurate`;
                    }}
                  >
                    Accuracy improvement
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={(e) => {
                      const titleInput = (e.target as HTMLElement).closest('form')?.querySelector('input[name="title"]') as HTMLInputElement;
                      if (titleInput) titleInput.value = `Unexpected error in ${selectedAlgorithmContext?.algorithmName || 'algorithm'}`;
                    }}
                  >
                    Bug report
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description *
              </label>
              <Textarea 
                name="description"
                placeholder="Detailed description of your feedback, observations, or issues"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Expected Result
                </label>
                <Textarea 
                  name="expectedResult"
                  placeholder="What did you expect the algorithm to do?"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Actual Result
                </label>
                <Textarea 
                  name="actualResult"
                  placeholder="What actually happened?"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Suggested Improvement
              </label>
              <Textarea 
                name="suggestedImprovement"
                placeholder="How do you think this could be improved?"
                rows={3}
              />
            </div>

            {selectedAlgorithmContext?.executionId && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This feedback will be linked to execution run #{selectedAlgorithmContext.executionId}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAlgorithmFeedbackDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={submitAlgorithmFeedbackMutation.isPending}
              >
                {submitAlgorithmFeedbackMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}