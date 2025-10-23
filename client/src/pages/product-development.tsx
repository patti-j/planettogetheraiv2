import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Code2, FileText, GitBranch, Target, Brain, CheckCircle2, 
  Clock, Users, Zap, BarChart3, Settings, Play, Plus,
  Archive, Network, TestTube, Bug, Lightbulb, Layers,
  Sparkles, TrendingUp, Calendar, Database, Search, Edit, Trash2, Shield
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  type StrategyDocument, type DevelopmentTask, type TestSuite, type TestCase, type ArchitectureComponent,
  insertStrategyDocumentSchema, insertDevelopmentTaskSchema, insertTestSuiteSchema, insertTestCaseSchema, insertArchitectureComponentSchema
} from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface RoadmapPhase {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'delayed';
  progress: number;
  milestones: RoadmapMilestone[];
  features: RoadmapFeature[];
  dependencies?: number[];
}

interface RoadmapMilestone {
  id: number;
  name: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'at-risk';
  completionDate?: string;
}

interface RoadmapFeature {
  id: number;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'small' | 'medium' | 'large' | 'xl';
  status: 'backlog' | 'planned' | 'in-progress' | 'testing' | 'done';
  assignedTeam?: string;
}

export default function ProductDevelopment() {
  const [selectedTab, setSelectedTab] = useState("strategy");
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContext, setAiContext] = useState<'strategy' | 'tasks' | 'testing'>('strategy');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API Queries
  const { data: strategyDocuments = [], isLoading: strategyLoading } = useQuery({
    queryKey: ['/api/strategy-documents'],
    queryFn: () => fetch('/api/strategy-documents').then(res => res.json()) as Promise<StrategyDocument[]>
  });

  const { data: developmentTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/development-tasks'],
    queryFn: () => fetch('/api/development-tasks').then(res => res.json()) as Promise<DevelopmentTask[]>
  });

  const { data: testSuites = [], isLoading: testsLoading } = useQuery({
    queryKey: ['/api/test-suites'],
    queryFn: () => fetch('/api/test-suites').then(res => res.json()) as Promise<TestSuite[]>
  });

  const { data: architectureComponents = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['/api/architecture-components'],
    queryFn: () => fetch('/api/architecture-components').then(res => res.json()) as Promise<ArchitectureComponent[]>
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['/api/test-cases'],
    queryFn: () => fetch('/api/test-cases').then(res => res.json()) as Promise<TestCase[]>
  });

  // Group test cases by suite
  const testCasesBySuite = testCases.reduce((acc: Record<number, TestCase[]>, testCase) => {
    if (!acc[testCase.suiteId]) {
      acc[testCase.suiteId] = [];
    }
    acc[testCase.suiteId].push(testCase);
    return acc;
  }, {});

  // Mutations
  const createStrategyMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/strategy-documents', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-documents'] });
      setShowStrategyDialog(false);
      toast({ title: "Strategy document created successfully" });
    },
    onError: () => {
      toast({ title: "Error creating strategy document", variant: "destructive" });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/development-tasks', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/development-tasks'] });
      setShowTaskDialog(false);
      toast({ title: "Development task created successfully" });
    },
    onError: () => {
      toast({ title: "Error creating development task", variant: "destructive" });
    }
  });

  const createTestSuiteMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/test-suites', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-suites'] });
      setShowTestDialog(false);
      toast({ title: "Test suite created successfully" });
    },
    onError: () => {
      toast({ title: "Error creating test suite", variant: "destructive" });
    }
  });

  // Forms
  const strategyForm = useForm({
    resolver: zodResolver(insertStrategyDocumentSchema.omit({ createdBy: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      title: "",
      content: "",
      category: "architecture" as const,
      status: "draft" as const
    }
  });

  const taskForm = useForm({
    resolver: zodResolver(insertDevelopmentTaskSchema.omit({ createdBy: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      title: "",
      description: "",
      status: "backlog" as const,
      priority: "medium" as const,
      phase: "",
      estimatedHours: 8,
      assignedTo: "",
      dependencies: [],
      dueDate: undefined
    }
  });

  const testForm = useForm({
    resolver: zodResolver(insertTestSuiteSchema.omit({ createdBy: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      name: "",
      description: "",
      type: "unit" as const,
      status: "draft" as const,
      framework: ""
    }
  });

  // Roadmap data reflecting current state of PlanetTogether app
  const roadmapPhases: RoadmapPhase[] = [
    {
      id: 1,
      name: "Foundation & Core Infrastructure",
      description: "Establish robust foundation with essential manufacturing management capabilities",
      startDate: "2024-09-01",
      endDate: "2024-11-30",
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 1,
          name: "Database Schema Complete",
          description: "PostgreSQL with Drizzle ORM, PT tables for manufacturing data",
          targetDate: "2024-10-15",
          status: 'completed',
          completionDate: "2024-10-14"
        },
        {
          id: 2,
          name: "Authentication System",
          description: "JWT authentication with unified role-based permissions",
          targetDate: "2024-10-30",
          status: 'completed',
          completionDate: "2024-10-28"
        },
        {
          id: 3,
          name: "UI Framework",
          description: "React 18 with Shadcn/UI, Tailwind CSS, responsive design",
          targetDate: "2024-11-15",
          status: 'completed',
          completionDate: "2024-11-12"
        }
      ],
      features: [
        { id: 1, name: "User Authentication", description: "JWT-based secure login with session management", priority: 'critical', effort: 'medium', status: 'done', assignedTeam: 'Backend Team' },
        { id: 2, name: "Role-Based Access Control", description: "Feature-action permissions with database + frontend enforcement", priority: 'critical', effort: 'large', status: 'done', assignedTeam: 'Backend Team' },
        { id: 3, name: "Master Data Management", description: "Unified interface with AI-powered modification and validation", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Full Stack' },
        { id: 4, name: "Dashboard System", description: "Customizable dashboards with drag-and-drop widgets", priority: 'high', effort: 'medium', status: 'done', assignedTeam: 'Frontend Team' }
      ]
    },
    {
      id: 2,
      name: "Production Scheduling & APS Core",
      description: "Advanced Production Scheduling with Bryntum Scheduler Pro integration",
      startDate: "2024-11-15",
      endDate: "2025-01-31",
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 4,
          name: "Bryntum Scheduler Pro Integration",
          description: "Interactive Gantt chart with drag-and-drop, constraints engine",
          targetDate: "2024-12-15",
          status: 'completed',
          completionDate: "2024-12-12"
        },
        {
          id: 5,
          name: "Scheduling Algorithms",
          description: "ASAP, ALAP, Critical Path, Resource Leveling, Theory of Constraints/DBR",
          targetDate: "2025-01-15",
          status: 'completed',
          completionDate: "2025-01-10"
        },
        {
          id: 6,
          name: "Version Control System",
          description: "Schedule versioning with snapshots, comparison, and rollback",
          targetDate: "2025-01-25",
          status: 'completed',
          completionDate: "2025-01-22"
        }
      ],
      features: [
        { id: 5, name: "Visual Gantt Scheduler", description: "Bryntum-powered scheduler with auto-save and manual scheduling", priority: 'critical', effort: 'xl', status: 'done', assignedTeam: 'Frontend Team' },
        { id: 6, name: "Resource Capabilities", description: "PT Resource Capabilities System for resource-operation matching", priority: 'critical', effort: 'large', status: 'done', assignedTeam: 'Full Stack' },
        { id: 7, name: "Planning Area Filters", description: "Filter resources by planning area with automatic ASAP scheduling", priority: 'high', effort: 'medium', status: 'done', assignedTeam: 'Frontend Team' },
        { id: 8, name: "Calendar Management", description: "Working hours and maintenance periods configuration", priority: 'high', effort: 'medium', status: 'done', assignedTeam: 'Full Stack' }
      ],
      dependencies: [1]
    },
    {
      id: 3,
      name: "AI & Intelligence Platform",
      description: "Comprehensive AI assistant and intelligent optimization capabilities",
      startDate: "2025-01-01",
      endDate: "2025-02-28",
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 7,
          name: "Max AI Assistant Launch",
          description: "OpenAI GPT-4o powered production intelligence assistant",
          targetDate: "2025-01-20",
          status: 'completed',
          completionDate: "2025-01-18"
        },
        {
          id: 8,
          name: "Voice Chat Integration",
          description: "Real-time voice chat with OpenAI gpt-realtime-mini",
          targetDate: "2025-02-10",
          status: 'completed',
          completionDate: "2025-02-08"
        },
        {
          id: 9,
          name: "AI Alert System",
          description: "Configurable AI analysis triggers with GPT-4o integration",
          targetDate: "2025-02-20",
          status: 'completed',
          completionDate: "2025-02-18"
        }
      ],
      features: [
        { id: 9, name: "Max AI Service", description: "Real-time production intelligence with schedule analysis", priority: 'critical', effort: 'xl', status: 'done', assignedTeam: 'AI Team' },
        { id: 10, name: "Voice Interface", description: "WebSocket architecture with SSE for audio/transcript streaming", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'AI Team' },
        { id: 11, name: "AI Agents Control Panel", description: "Centralized management for all AI agents", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'AI Team' },
        { id: 12, name: "Hint System Service", description: "Intelligent contextual hints with user tracking", priority: 'medium', effort: 'medium', status: 'done', assignedTeam: 'AI Team' }
      ],
      dependencies: [2]
    },
    {
      id: 4,
      name: "Manufacturing Execution System",
      description: "Shop floor control, quality management, and real-time production tracking",
      startDate: "2025-02-01",
      endDate: "2025-04-30",
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 10,
          name: "Product Wheels Implementation",
          description: "Cyclic production scheduling with visual donut charts",
          targetDate: "2025-03-01",
          status: 'completed',
          completionDate: "2025-02-28"
        },
        {
          id: 11,
          name: "Global Control Tower",
          description: "KPI management with weighted performance tracking",
          targetDate: "2025-03-20",
          status: 'completed',
          completionDate: "2025-03-18"
        },
        {
          id: 12,
          name: "Shift Management System",
          description: "Templates, assignments, overtime, and downtime tracking",
          targetDate: "2025-04-10",
          status: 'completed',
          completionDate: "2025-04-08"
        }
      ],
      features: [
        { id: 13, name: "Product Wheels", description: "8 brewery production wheels with segment scheduling", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Full Stack' },
        { id: 14, name: "Labor Planning", description: "Weekly schedules with breaks, tasks, and statistics", priority: 'high', effort: 'medium', status: 'done', assignedTeam: 'Full Stack' },
        { id: 15, name: "ATP-CTP Analysis", description: "Available-to-Promise & Capable-to-Promise calculations", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Analytics Team' },
        { id: 16, name: "Schedule Sequences", description: "Operation sequencer with drag-and-drop reordering", priority: 'medium', effort: 'medium', status: 'done', assignedTeam: 'Frontend Team' }
      ],
      dependencies: [3]
    },
    {
      id: 5,
      name: "Advanced Analytics & Optimization",
      description: "Predictive analytics, optimization studio, and enterprise integration",
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      status: 'in-progress',
      progress: 75,
      milestones: [
        {
          id: 13,
          name: "Demand Forecasting Module",
          description: "Native React forecasting with SQL Server integration",
          targetDate: "2025-05-01",
          status: 'completed',
          completionDate: "2025-04-28"
        },
        {
          id: 14,
          name: "Optimization Studio",
          description: "Visual algorithm builder with SSE progress tracking",
          targetDate: "2025-05-20",
          status: 'completed',
          completionDate: "2025-05-18"
        },
        {
          id: 15,
          name: "Paginated Reports",
          description: "Dynamic reports from SQL Server with filtering and sorting",
          targetDate: "2025-06-01",
          status: 'completed',
          completionDate: "2025-05-28"
        }
      ],
      features: [
        { id: 17, name: "Demand Forecasting", description: "Time-series forecasting with Recharts visualization", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Analytics Team' },
        { id: 18, name: "Optimization Studio", description: "Algorithm registry with 6 scheduling algorithms", priority: 'critical', effort: 'xl', status: 'done', assignedTeam: 'AI Team' },
        { id: 19, name: "Autonomous Optimization", description: "Self-optimizing production schedules", priority: 'high', effort: 'xl', status: 'in-progress', assignedTeam: 'AI Team' },
        { id: 20, name: "SQL Server Integration", description: "mssql package for enterprise data connectivity", priority: 'medium', effort: 'medium', status: 'done', assignedTeam: 'Backend Team' }
      ],
      dependencies: [4]
    },
    {
      id: 6,
      name: "Enterprise Scale & Performance",
      description: "Multi-tenant architecture, advanced integrations, and performance optimization",
      startDate: "2025-06-01",
      endDate: "2025-08-31",
      status: 'upcoming',
      progress: 0,
      milestones: [
        {
          id: 16,
          name: "Multi-Plant Federation",
          description: "Enterprise-wide plant coordination and visibility",
          targetDate: "2025-07-01",
          status: 'pending'
        },
        {
          id: 17,
          name: "Advanced Integrations",
          description: "ERP, MES, and supply chain system integrations",
          targetDate: "2025-07-30",
          status: 'pending'
        },
        {
          id: 18,
          name: "Performance Optimization",
          description: "Sub-second response times for 10,000+ operations",
          targetDate: "2025-08-15",
          status: 'pending'
        }
      ],
      features: [
        { id: 21, name: "Multi-Plant Support", description: "Cross-plant scheduling and resource sharing", priority: 'high', effort: 'xl', status: 'planned', assignedTeam: 'Full Stack' },
        { id: 22, name: "Advanced MRP/DDMRP", description: "Material Requirements Planning with demand-driven capabilities", priority: 'high', effort: 'xl', status: 'planned', assignedTeam: 'Analytics Team' },
        { id: 23, name: "Supply Chain Integration", description: "Real-time supply chain visibility and optimization", priority: 'medium', effort: 'xl', status: 'backlog', assignedTeam: 'Integration Team' },
        { id: 24, name: "Mobile Applications", description: "Native iOS/Android apps for shop floor and management", priority: 'medium', effort: 'xl', status: 'backlog', assignedTeam: 'Mobile Team' }
      ],
      dependencies: [5]
    }
  ];
  // Mock data removed - using API data above
  const phases = [
    {
      name: "Phase 1 - Foundation",
      description: "Core system architecture and basic features", 
      progress: 95,
      tasks: Array.isArray(developmentTasks) ? developmentTasks.filter(t => t.phase?.includes('Phase 1')).length : 8,
      completed: 8
    },
    {
      name: "Phase 2 - Core Features", 
      description: "Production scheduling and optimization capabilities",
      progress: 80,
      tasks: Array.isArray(developmentTasks) ? developmentTasks.filter(t => t.phase?.includes('Phase 2')).length : 12,
      completed: 10
    },
    {
      name: "Phase 3 - Analytics",
      description: "Advanced analytics and reporting features",
      progress: 45,
      tasks: Array.isArray(developmentTasks) ? developmentTasks.filter(t => t.phase?.includes('Phase 3')).length : 8,
      completed: 3
    },
    {
      name: "Phase 4 - UX Enhancement",
      description: "User experience improvements and mobile optimization",
      progress: 10, 
      tasks: Array.isArray(developmentTasks) ? developmentTasks.filter(t => t.phase?.includes('Phase 4')).length : 6,
      completed: 1
    }
  ];

  return (
    <div className="space-y-6 p-3 sm:p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="md:ml-12 ml-0">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Code2 className="w-8 h-8 text-blue-500" />
            Product Development Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Strategy, architecture, development planning, and testing for system builders
          </p>
        </div>
        <Button 
          onClick={() => setShowAIDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm sm:text-base px-3 sm:px-4"
        >
          <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden">AI</span>
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        {/* Mobile: Horizontal scrolling tabs */}
        <div className="sm:hidden">
          <div className="flex overflow-x-auto pb-2 space-x-1">
            <TabsList className="flex w-max gap-1">
              <TabsTrigger value="strategy" className="flex-shrink-0 text-sm px-3">Strategy</TabsTrigger>
              <TabsTrigger value="roadmap" className="flex-shrink-0 text-sm px-3">Roadmap</TabsTrigger>
              <TabsTrigger value="architecture" className="flex-shrink-0 text-sm px-3">Arch</TabsTrigger>
              <TabsTrigger value="development" className="flex-shrink-0 text-sm px-3">Dev</TabsTrigger>
              <TabsTrigger value="progress" className="flex-shrink-0 text-sm px-3">Progress</TabsTrigger>
              <TabsTrigger value="testing" className="flex-shrink-0 text-sm px-3">Testing</TabsTrigger>
              <TabsTrigger value="insights" className="flex-shrink-0 text-sm px-3">Insights</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* Desktop: Grid layout */}
        <div className="hidden sm:block">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Strategic Documentation</h2>
            <Button onClick={() => setShowStrategyDialog(true)} className="text-sm px-3 flex-shrink-0">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Strategy Doc</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {strategyLoading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading strategy documents...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(strategyDocuments) && strategyDocuments.map((strategy) => (
                <Card key={strategy.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <FileText className="w-5 h-5 text-blue-500" />
                          {strategy.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={strategy.category === 'architecture' ? 'default' : 'secondary'}>
                            {strategy.category}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Updated {strategy.updatedAt ? new Date(strategy.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="p-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{strategy.content}</p>
                  </CardContent>
                </Card>
              ))}
              {(!Array.isArray(strategyDocuments) || strategyDocuments.length === 0) && (
                <div className="space-y-4">
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Scaling Strategy Framework
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Strategic approach to scale the manufacturing ERP system from single-tenant to enterprise-grade multi-tenant architecture.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Current Architecture Assessment</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Single shared PostgreSQL database, session-based authentication, Express.js server on port 5000, React frontend served by same server.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Target Architecture</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Database-Per-Tenant architecture with complete data isolation, independent scaling per customer, and enterprise-grade compliance.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Benefits</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 dark:text-gray-300">Complete data isolation & security</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 dark:text-gray-300">Independent customer scaling</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 dark:text-gray-300">Customizable schema per tenant</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 dark:text-gray-300">Enhanced compliance capabilities</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="w-5 h-5 text-purple-500" />
                        Implementation Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Phase 1: Foundation (Q3 2025)</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Connection pooling, Redis caching, rate limiting, query optimization</p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Phase 2: Infrastructure (Q4 2025)</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Load balancing, CDN, background processing, monitoring systems</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Phase 3: Multi-Tenancy (Q1-Q2 2026)</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Database-per-tenant, automated provisioning, isolated backups</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    Create custom strategy documents above to track additional strategic initiatives.
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Product Development Roadmap</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                Export Timeline
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <Settings className="w-4 h-4 mr-2" />
                Configure View
              </Button>
            </div>
          </div>

          {/* Roadmap Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{roadmapPhases.filter(p => p.status === 'completed').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{roadmapPhases.filter(p => p.status === 'in-progress').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{roadmapPhases.filter(p => p.status === 'upcoming').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(roadmapPhases.reduce((acc, p) => acc + p.progress, 0) / roadmapPhases.length)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline View */}
          <div className="space-y-6">
            {roadmapPhases.map((phase, index) => (
              <Card key={phase.id} className={`relative overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                phase.status === 'completed' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                phase.status === 'in-progress' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' :
                phase.status === 'delayed' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                'border-gray-200 dark:border-gray-700'
              }`}>
                {/* Phase Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold ${
                        phase.status === 'completed' ? 'bg-green-500' :
                        phase.status === 'in-progress' ? 'bg-blue-500' :
                        phase.status === 'delayed' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">{phase.name}</CardTitle>
                        <CardDescription className="text-base mt-1 text-gray-600 dark:text-gray-300">{phase.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={
                            phase.status === 'completed' ? 'default' :
                            phase.status === 'in-progress' ? 'secondary' :
                            phase.status === 'delayed' ? 'destructive' : 'outline'
                          }>
                            {phase.status.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                          </span>
                          {phase.dependencies && phase.dependencies.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Depends on Phase {phase.dependencies.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{phase.progress}%</div>
                      <Progress value={phase.progress} className="w-24 mt-1" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Milestones */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Key Milestones ({phase.milestones.length})
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {phase.milestones.map((milestone) => (
                        <div key={milestone.id} className={`p-3 rounded-lg border ${
                          milestone.status === 'completed' ? 'border-green-200 bg-green-50' :
                          milestone.status === 'in-progress' ? 'border-blue-200 bg-blue-50' :
                          milestone.status === 'at-risk' ? 'border-red-200 bg-red-50' :
                          'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{milestone.name}</h5>
                              <p className="text-xs text-gray-600 mt-1">{milestone.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={
                                  milestone.status === 'completed' ? 'default' :
                                  milestone.status === 'in-progress' ? 'secondary' :
                                  milestone.status === 'at-risk' ? 'destructive' : 'outline'
                                }>
                                  {milestone.status.replace('-', ' ')}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {milestone.completionDate ? 
                                    `✓ ${new Date(milestone.completionDate).toLocaleDateString()}` :
                                    `Target: ${new Date(milestone.targetDate).toLocaleDateString()}`
                                  }
                                </span>
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ml-2 ${
                              milestone.status === 'completed' ? 'bg-green-500' :
                              milestone.status === 'in-progress' ? 'bg-blue-500' :
                              milestone.status === 'at-risk' ? 'bg-red-500' :
                              'bg-gray-300'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Key Features ({phase.features.length})
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {phase.features.map((feature) => (
                        <div key={feature.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{feature.name}</h5>
                              <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={
                                  feature.priority === 'critical' ? 'destructive' :
                                  feature.priority === 'high' ? 'default' :
                                  feature.priority === 'medium' ? 'secondary' : 'outline'
                                }>
                                  {feature.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {feature.effort}
                                </Badge>
                                <Badge variant={
                                  feature.status === 'done' ? 'default' :
                                  feature.status === 'in-progress' ? 'secondary' :
                                  feature.status === 'testing' ? 'secondary' : 'outline'
                                }>
                                  {feature.status.replace('-', ' ')}
                                </Badge>
                              </div>
                              {feature.assignedTeam && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{feature.assignedTeam}</span>
                                </div>
                              )}
                            </div>
                            <div className={`w-3 h-3 rounded-full ml-2 ${
                              feature.status === 'done' ? 'bg-green-500' :
                              feature.status === 'in-progress' ? 'bg-blue-500' :
                              feature.status === 'testing' ? 'bg-yellow-500' :
                              feature.status === 'planned' ? 'bg-purple-500' :
                              'bg-gray-300'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                {/* Phase Connection Line */}
                {index < roadmapPhases.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-6 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -ml-1"></div>
                  </div>
                )}
              </Card>
            ))}

            {/* Scaling Implementation Roadmap */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Network className="w-6 h-6 text-blue-500" />
                  Scaling Implementation Roadmap
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Strategic phased approach to scale the manufacturing ERP system using Database-Per-Tenant architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Phase 1 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div className="w-1 h-16 bg-green-200 dark:bg-green-800"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Phase 1: Foundation (Q3 2025)</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          In Progress
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Immediate performance improvements and infrastructure preparation</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">100% Complete</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      {/* Implementation Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Database connection pooling</span>
                          <Badge variant="outline" className="ml-auto text-xs">✓ Done</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Redis caching implementation</span>
                          <Badge variant="outline" className="ml-auto text-xs">✓ Done</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Rate limiting & security</span>
                          <Badge variant="outline" className="ml-auto text-xs">✓ Done</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Query optimization & indexing</span>
                          <Badge variant="outline" className="ml-auto text-xs">✓ Done</Badge>
                        </div>
                      </div>

                      {/* Implementation Details */}
                      <div className="space-y-3 mt-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Database className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Step 1: Database Connection Pooling ✓</p>
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Enhanced database connection pool with monitoring endpoints (/api/system/db-health, /api/system/db-metrics, /api/system/performance). 
                                Pool configured with optimized settings and real-time metrics tracking.
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">Status: Active</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-green-600 dark:text-green-400">Deployed: August 1, 2025</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Step 2: Redis Caching Complete ✓</p>
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Implemented Redis caching with in-memory fallback for session management and query result caching. 
                                Added cache monitoring endpoints (/api/system/cache-health, /api/system/cache-metrics) with invalidation patterns.
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">Features: Session caching, Query caching, Health monitoring</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-green-600 dark:text-green-400">Completed: August 1, 2025</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Step 3: Rate Limiting & Security ✓</p>
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Implemented comprehensive rate limiting with DDoS protection, security headers, and request validation. 
                                Added security monitoring endpoints (/api/system/security-status, /api/system/rate-limit-stats) with real-time threat detection.
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">Features: API rate limits, Auth protection, DDoS defense</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-green-600 dark:text-green-400">Completed: August 1, 2025</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Step 4: Query Optimization & Indexing ✓</p>
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Implemented strategic database indexing with query performance monitoring and execution plan analysis. 
                                Added performance benchmarking endpoints (/api/system/query-performance, /api/system/database-indexes, /api/system/performance-benchmark) with index optimization.
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">Features: Strategic indexing, Performance monitoring, Query analysis</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-green-600 dark:text-green-400">Completed: August 1, 2025</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h5 className="font-semibold text-green-800 dark:text-green-200">Phase 1 Foundation Complete!</h5>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                            All 4 foundation steps successfully implemented with comprehensive testing and monitoring. 
                            System ready for Phase 2 infrastructure scaling.
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 dark:text-green-300">Database Connection Pooling</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 dark:text-green-300">Redis Caching System</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 dark:text-green-300">Rate Limiting & Security</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 dark:text-green-300">Query Optimization</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div className="w-1 h-16 bg-blue-200 dark:bg-blue-800"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Phase 2: Infrastructure (Q4 2025)</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Horizontal scaling and infrastructure improvements</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Load balancer deployment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">CDN for static assets</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Background job processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Monitoring & observability</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Phase 3: Multi-Tenancy (Q1-Q2 2026)</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Database-per-tenant architecture implementation</p>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Dynamic database routing by domain/company</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Automated tenant provisioning system</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Per-tenant schema migration management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">Isolated backup & recovery systems</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Expected Outcomes:</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          Complete data isolation, independent scaling per customer, customizable schema per tenant, and enterprise-grade compliance capabilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">System Architecture</h2>
            <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <Network className="w-4 h-4 mr-2" />
              Visual Diagram
            </Button>
          </div>

          {/* Architecture Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Database className="w-5 h-5 text-blue-500" />
                  Data Layer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">PostgreSQL with Drizzle ORM</p>
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Stable</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Backend API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">Express.js with TypeScript</p>
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Stable</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Code2 className="w-5 h-5 text-orange-500" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">React with TypeScript</p>
                <div className="mt-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Active Development</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {Array.isArray(architectureComponents) && architectureComponents.map((component, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Layers className="w-5 h-5 text-green-500" />
                        {component.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{component.technology}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        component.health === 'Excellent' ? 'default' :
                        component.health === 'Good' ? 'secondary' : 'destructive'
                      }>
                        {component.health}
                      </Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{component.coverage}% Coverage</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{component.description}</p>
                  <Progress value={component.coverage} className="w-full" />
                </CardContent>
              </Card>
            ))}
            
            {(!Array.isArray(architectureComponents) || architectureComponents.length === 0) && (
              <div className="space-y-4">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Database className="w-5 h-5 text-blue-500" />
                      Database Architecture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">PostgreSQL database with comprehensive manufacturing schema including production orders, operations, resources, and planning data.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Production Orders</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Operations</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Resources</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Inventory</Badge>
                    </div>
                    <Progress value={95} className="w-full mt-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">95% Schema Complete</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Layers className="w-5 h-5 text-purple-500" />
                      API Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">RESTful API built with Express.js providing endpoints for all manufacturing operations and data management.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Authentication</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Scheduling</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Optimization</Badge>
                    </div>
                    <Progress value={88} className="w-full mt-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">88% API Coverage</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Code2 className="w-5 h-5 text-orange-500" />
                      Frontend Architecture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">React-based SPA with modular component architecture, featuring Gantt charts, dashboards, and real-time updates.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">React Query</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Tailwind CSS</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">React DnD</Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Shadcn/UI</Badge>
                    </div>
                    <Progress value={75} className="w-full mt-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">75% Implementation Complete</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scaling Strategy Section */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3-Level Scaling Strategy</h3>
              
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Database className="w-5 h-5 text-green-500" />
                    Level 1: Immediate Improvements (Low Impact)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">Quick wins to improve performance and prepare for scaling without major architectural changes.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Add database connection pooling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Implement Redis caching layer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Add rate limiting protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Optimize database queries & indexes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Layers className="w-5 h-5 text-blue-500" />
                    Level 2: Infrastructure Changes (Medium Impact)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">Infrastructure improvements to support multiple server instances and better resource management.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Deploy behind load balancer (nginx)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Separate static asset serving (CDN)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Background job processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Add monitoring & observability</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Network className="w-5 h-5 text-purple-500" />
                    Level 3: Database-Per-Tenant Architecture (High Impact)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">Complete multi-tenancy with separate databases per company/domain for maximum isolation and performance.</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Dynamic Database Selection</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Route connections based on user's domain/company during authentication</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Automated Tenant Provisioning</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Automatic database creation and schema setup for new customers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Per-Tenant Migration Management</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Independent schema updates and data migrations per customer</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Isolated Backup & Recovery</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Customer-specific backup strategies and point-in-time recovery</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">Benefits of Database-Per-Tenant:</p>
                    <ul className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                      <li>• Complete data isolation and security</li>
                      <li>• Independent scaling per customer</li>
                      <li>• Customizable schema per tenant needs</li>
                      <li>• Better compliance and audit capabilities</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Development Planning</h2>
            <Button onClick={() => setShowTaskDialog(true)} className="text-sm px-3 flex-shrink-0">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {tasksLoading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading development tasks...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(developmentTasks) && developmentTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <GitBranch className="w-5 h-5 text-orange-500" />
                          {task.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={
                            task.priority === 'critical' ? 'destructive' :
                            task.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">
                            {task.status.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{task.phase}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{task.estimatedHours}h estimated</p>
                          {task.assignedTo && (
                            <p className="text-sm text-gray-500">{task.assignedTo}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
                    {task.dueDate && (
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!Array.isArray(developmentTasks) || developmentTasks.length === 0) && !(tasksLoading) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No development tasks found. Create your first one above.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <h2 className="text-2xl font-semibold">Development Progress</h2>

          <div className="grid gap-4">
            {phases.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        {phase.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{phase.progress}%</p>
                      <p className="text-sm text-gray-500">
                        {phase.completed}/{phase.tasks} tasks
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={phase.progress} className="w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Overall System Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">58%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">34</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">22</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">System Testing</h2>
            <Button onClick={() => setShowTestDialog(true)} className="text-sm px-3 flex-shrink-0">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Test Suite</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Testing Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">245</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Passed Tests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed Tests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">95%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">2.3s</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Runtime</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {testsLoading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading test suites...</div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(testSuites) && testSuites.map((suite) => (
                <Card key={suite.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <TestTube className="w-5 h-5 text-teal-500" />
                          {suite.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={suite.type === 'integration' ? 'default' : 'secondary'}>
                            {suite.type}
                          </Badge>
                          <Badge variant={suite.status === 'active' ? 'default' : 'secondary'}>
                            {suite.status}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Updated {suite.updatedAt ? new Date(suite.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                          <Play className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Run Tests</span>
                          <span className="sm:hidden">Run</span>
                        </Button>
                        <Button variant="outline" size="sm" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="p-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{suite.description}</p>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Test Cases ({testCasesBySuite[suite.id]?.length || 0})</h4>
                      {testCasesBySuite[suite.id]?.map((testCase) => (
                        <div key={testCase.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              testCase.status === 'pass' ? 'bg-green-500' :
                              testCase.status === 'fail' ? 'bg-red-500' :
                              testCase.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{testCase.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{testCase.status}</span>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-500 dark:text-gray-400 p-2">No test cases defined</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!Array.isArray(testSuites) || testSuites.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No test suites found. Create your first one above.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <h2 className="text-2xl font-semibold">Development Insights</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Development Velocity</span>
                    <span className="font-medium">12 tasks/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bug Resolution Time</span>
                    <span className="font-medium">2.3 days avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Coverage</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code Quality Score</span>
                    <span className="font-medium">8.5/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-500" />
                  Quality Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Bugs</span>
                    <span className="font-medium text-red-600">3 critical</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical Debt</span>
                    <span className="font-medium text-yellow-600">Medium</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Score</span>
                    <span className="font-medium text-green-600">9.2/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Score</span>
                    <span className="font-medium text-blue-600">8.8/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Consider implementing automated testing for the frozen horizon feature to maintain quality as complexity grows.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Mobile optimization should be prioritized based on increasing mobile usage patterns in manufacturing environments.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Database performance optimization recommended as data volume increases with production usage.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Development Assistant
            </DialogTitle>
            <DialogDescription>
              Get AI-powered help with strategy, development planning, and testing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-context">Context</Label>
              <Select value={aiContext} onValueChange={(value: any) => setAiContext(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategy">Strategy & Planning</SelectItem>
                  <SelectItem value="tasks">Development Tasks</SelectItem>
                  <SelectItem value="testing">Testing & Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ai-prompt">What would you like help with?</Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., 'Generate development tasks for mobile optimization phase' or 'Create test cases for the new frozen horizon feature'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategy Document Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Strategy Document</DialogTitle>
            <DialogDescription>
              Add a new strategic document to guide product development
            </DialogDescription>
          </DialogHeader>
          <Form {...strategyForm}>
            <form onSubmit={strategyForm.handleSubmit((data) => createStrategyMutation.mutate(data))} className="space-y-4">
              <FormField
                control={strategyForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Strategy document title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={strategyForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="architecture">Architecture</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="roadmap">Roadmap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={strategyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Strategy document content..." rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowStrategyDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStrategyMutation.isPending}>
                  {createStrategyMutation.isPending ? "Creating..." : "Create Document"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Development Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Development Task</DialogTitle>
            <DialogDescription>
              Add a new development task to track progress
            </DialogDescription>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phase</FormLabel>
                      <FormControl>
                        <Input placeholder="Development phase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="8" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={taskForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input placeholder="Team member name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTaskDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Test Suite Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Test Suite</DialogTitle>
            <DialogDescription>
              Add a new test suite for quality assurance
            </DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit((data) => createTestSuiteMutation.mutate(data))} className="space-y-4">
              <FormField
                control={testForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Test suite name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={testForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                          <SelectItem value="e2e">End-to-End</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={testForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={testForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Test suite description..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTestSuiteMutation.isPending}>
                  {createTestSuiteMutation.isPending ? "Creating..." : "Create Test Suite"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}