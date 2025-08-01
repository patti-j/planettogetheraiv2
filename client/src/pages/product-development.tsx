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
  Sparkles, TrendingUp, Calendar, Database, Search, Edit, Trash2
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

  // Mutations
  const createStrategyMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/strategy-documents', { method: 'POST', body: data }),
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
    mutationFn: (data: any) => apiRequest('/api/development-tasks', { method: 'POST', body: data }),
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
    mutationFn: (data: any) => apiRequest('/api/test-suites', { method: 'POST', body: data }),
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
      category: "architecture" as const
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
      dependencies: []
    }
  });

  const testForm = useForm({
    resolver: zodResolver(insertTestSuiteSchema.omit({ createdBy: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      name: "",
      description: "",
      type: "unit" as const,
      status: "draft" as const
    }
  });

  // Mock data for roadmap (this stays as mock since roadmap is static content)
  const roadmapPhases: RoadmapPhase[] = [
    {
      id: 1,
      name: "Foundation & Core Infrastructure",
      description: "Establish robust foundation with essential manufacturing management capabilities",
      startDate: "2024-12-01",
      endDate: "2025-02-28",
      status: 'completed',
      progress: 100,
      milestones: [
        {
          id: 1,
          name: "Database Schema Complete",
          description: "All core tables and relationships established",
          targetDate: "2024-12-15",
          status: 'completed',
          completionDate: "2024-12-14"
        },
        {
          id: 2,
          name: "Authentication System",
          description: "User management and role-based access control",
          targetDate: "2025-01-15",
          status: 'completed',
          completionDate: "2025-01-12"
        },
        {
          id: 3,
          name: "Basic UI Framework",
          description: "Component library and layout system",
          targetDate: "2025-02-01",
          status: 'completed',
          completionDate: "2025-01-28"
        }
      ],
      features: [
        { id: 1, name: "User Authentication", description: "Secure login and session management", priority: 'critical', effort: 'medium', status: 'done', assignedTeam: 'Backend Team' },
        { id: 2, name: "Role Management", description: "Flexible role and permission system", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Backend Team' },
        { id: 3, name: "Basic Dashboard", description: "Initial dashboard with key metrics", priority: 'high', effort: 'medium', status: 'done', assignedTeam: 'Frontend Team' },
        { id: 4, name: "Job Management", description: "Create and manage production jobs", priority: 'critical', effort: 'large', status: 'done', assignedTeam: 'Full Stack' }
      ]
    },
    {
      id: 2,
      name: "Production Scheduling Core",
      description: "Advanced scheduling capabilities with drag-and-drop Gantt charts and optimization",
      startDate: "2025-01-15",
      endDate: "2025-04-30",
      status: 'in-progress',
      progress: 85,
      milestones: [
        {
          id: 4,
          name: "Gantt Chart Implementation",
          description: "Interactive drag-and-drop scheduling interface",
          targetDate: "2025-02-28",
          status: 'completed',
          completionDate: "2025-02-25"
        },
        {
          id: 5,
          name: "Optimization Engine",
          description: "Core scheduling optimization algorithms",
          targetDate: "2025-03-31",
          status: 'completed',
          completionDate: "2025-03-28"
        },
        {
          id: 6,
          name: "Frozen Horizon",
          description: "Prevent rescheduling within specified time periods",
          targetDate: "2025-04-15",
          status: 'completed',
          completionDate: "2025-04-12"
        }
      ],
      features: [
        { id: 5, name: "Interactive Gantt Chart", description: "Drag-and-drop operation scheduling", priority: 'critical', effort: 'xl', status: 'done', assignedTeam: 'Frontend Team' },
        { id: 6, name: "Resource Management", description: "Define and manage manufacturing resources", priority: 'critical', effort: 'large', status: 'done', assignedTeam: 'Full Stack' },
        { id: 7, name: "Capacity Planning", description: "Resource capacity analysis and planning", priority: 'high', effort: 'large', status: 'done', assignedTeam: 'Analytics Team' },
        { id: 8, name: "Optimization Algorithms", description: "AI-powered scheduling optimization", priority: 'high', effort: 'xl', status: 'in-progress', assignedTeam: 'AI Team' }
      ],
      dependencies: [1]
    },
    {
      id: 3,
      name: "AI & Intelligence Platform",
      description: "Comprehensive AI assistant and intelligent optimization capabilities",
      startDate: "2025-03-01",
      endDate: "2025-06-30",
      status: 'in-progress',
      progress: 60,
      milestones: [
        {
          id: 7,
          name: "Max AI Assistant Launch",
          description: "Conversational AI assistant with voice capabilities",
          targetDate: "2025-04-30",
          status: 'completed',
          completionDate: "2025-04-28"
        },
        {
          id: 8,
          name: "Optimization Studio",
          description: "Algorithm development and deployment platform",
          targetDate: "2025-05-31",
          status: 'in-progress'
        },
        {
          id: 9,
          name: "Predictive Analytics",
          description: "Machine learning for demand forecasting and optimization",
          targetDate: "2025-06-15",
          status: 'pending'
        }
      ],
      features: [
        { id: 9, name: "Max AI Assistant", description: "Conversational AI with manufacturing domain knowledge", priority: 'critical', effort: 'xl', status: 'done', assignedTeam: 'AI Team' },
        { id: 10, name: "Voice Interface", description: "Speech-to-text and text-to-speech capabilities", priority: 'medium', effort: 'large', status: 'done', assignedTeam: 'AI Team' },
        { id: 11, name: "Algorithm Studio", description: "Create and deploy custom optimization algorithms", priority: 'high', effort: 'xl', status: 'in-progress', assignedTeam: 'AI Team' },
        { id: 12, name: "Demand Forecasting", description: "AI-powered demand prediction models", priority: 'medium', effort: 'large', status: 'planned', assignedTeam: 'Analytics Team' }
      ],
      dependencies: [2]
    },
    {
      id: 4,
      name: "Enterprise & Scale",
      description: "Multi-plant management, advanced analytics, and enterprise integrations",
      startDate: "2025-05-01",
      endDate: "2025-08-31",
      status: 'upcoming',
      progress: 15,
      milestones: [
        {
          id: 10,
          name: "Multi-Plant Architecture",
          description: "Support for multiple manufacturing facilities",
          targetDate: "2025-06-30",
          status: 'pending'
        },
        {
          id: 11,
          name: "Advanced Analytics",
          description: "Comprehensive reporting and business intelligence",
          targetDate: "2025-07-31",
          status: 'pending'
        },
        {
          id: 12,
          name: "ERP Integration",
          description: "Seamless integration with major ERP systems",
          targetDate: "2025-08-15",
          status: 'pending'
        }
      ],
      features: [
        { id: 13, name: "Multi-Plant Management", description: "Centralized management of multiple facilities", priority: 'high', effort: 'xl', status: 'planned', assignedTeam: 'Backend Team' },
        { id: 14, name: "Advanced Reporting", description: "Custom reports and business intelligence", priority: 'high', effort: 'large', status: 'planned', assignedTeam: 'Analytics Team' },
        { id: 15, name: "ERP Connectors", description: "Pre-built integrations with SAP, Oracle, etc.", priority: 'medium', effort: 'xl', status: 'backlog', assignedTeam: 'Integration Team' },
        { id: 16, name: "Mobile Apps", description: "Native mobile applications for operators", priority: 'medium', effort: 'large', status: 'backlog', assignedTeam: 'Mobile Team' }
      ],
      dependencies: [3]
    },
    {
      id: 5,
      name: "Innovation & Future",
      description: "Next-generation features including IoT integration and advanced AI capabilities",
      startDate: "2025-07-01",
      endDate: "2025-12-31",
      status: 'upcoming',
      progress: 5,
      milestones: [
        {
          id: 13,
          name: "IoT Platform",
          description: "Real-time data collection from manufacturing equipment",
          targetDate: "2025-09-30",
          status: 'pending'
        },
        {
          id: 14,
          name: "Digital Twin",
          description: "Virtual representation of manufacturing processes",
          targetDate: "2025-11-30",
          status: 'pending'
        },
        {
          id: 15,
          name: "Autonomous Operations",
          description: "Self-optimizing manufacturing processes",
          targetDate: "2025-12-31",
          status: 'pending'
        }
      ],
      features: [
        { id: 17, name: "IoT Integration", description: "Connect and monitor manufacturing equipment", priority: 'medium', effort: 'xl', status: 'backlog', assignedTeam: 'IoT Team' },
        { id: 18, name: "Digital Twin", description: "Virtual manufacturing environment simulation", priority: 'low', effort: 'xl', status: 'backlog', assignedTeam: 'AI Team' },
        { id: 19, name: "Predictive Maintenance", description: "AI-powered equipment maintenance scheduling", priority: 'medium', effort: 'large', status: 'backlog', assignedTeam: 'AI Team' },
        { id: 20, name: "Autonomous Optimization", description: "Self-learning optimization algorithms", priority: 'low', effort: 'xl', status: 'backlog', assignedTeam: 'AI Team' }
      ],
      dependencies: [4]
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
    <div className="space-y-6 p-6 pl-16 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
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
                            Updated {new Date(strategy.updatedAt).toLocaleDateString()}
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
                          <span className="text-gray-900 dark:text-white font-medium">25% Complete</span>
                        </div>
                        <Progress value={25} className="h-2" />
                      </div>

                      {/* Implementation Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Database connection pooling</span>
                          <Badge variant="outline" className="ml-auto text-xs">✓ Done</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">Redis caching implementation</span>
                          <Badge variant="outline" className="ml-auto text-xs">Planned</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">Rate limiting & security</span>
                          <Badge variant="outline" className="ml-auto text-xs">Planned</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">Query optimization & indexing</span>
                          <Badge variant="outline" className="ml-auto text-xs">Planned</Badge>
                        </div>
                      </div>

                      {/* Implementation Details */}
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Database className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Latest: Connection Pooling Complete</p>
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
                            Updated {new Date(suite.updatedAt).toLocaleDateString()}
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
                <Brain className="w-4 h-4 mr-2" />
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