import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Code2, FileText, GitBranch, Target, Brain, CheckCircle2, 
  Clock, Users, Zap, BarChart3, Settings, Play, Plus,
  Archive, Network, TestTube, Bug, Lightbulb, Layers,
  Sparkles, TrendingUp, Calendar, Database, Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StrategyDocument {
  id: number;
  title: string;
  content: string;
  category: 'architecture' | 'technical' | 'business' | 'roadmap';
  createdAt: string;
  updatedAt: string;
}

interface DevelopmentTask {
  id: number;
  title: string;
  description: string;
  status: 'backlog' | 'planned' | 'in-progress' | 'testing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  phase: string;
  estimatedHours: number;
  assignedTo?: string;
  dependencies: number[];
  createdAt: string;
  dueDate?: string;
}

interface TestSuite {
  id: number;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'draft' | 'active' | 'archived';
  testCases: TestCase[];
  lastRun?: string;
  passRate?: number;
}

interface TestCase {
  id: number;
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'pass' | 'fail' | 'pending' | 'skipped';
  lastRun?: string;
}

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

  // Mock data for development - in real implementation, these would come from API
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
  const strategies: StrategyDocument[] = [
    {
      id: 1,
      title: "System Architecture Strategy",
      content: "Focus on modular, microservices architecture with clear separation of concerns. Frontend: React with TypeScript, Backend: Express.js with PostgreSQL, Real-time: WebSockets...",
      category: 'architecture',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-15'
    },
    {
      id: 2,
      title: "AI Integration Roadmap",
      content: "Integrate AI capabilities throughout the platform: 1) Max AI Assistant for user interaction, 2) Optimization algorithms for production scheduling, 3) Predictive analytics...",
      category: 'technical',
      createdAt: '2025-01-05',
      updatedAt: '2025-01-20'
    }
  ];

  const tasks: DevelopmentTask[] = [
    {
      id: 1,
      title: "Frozen Horizon Implementation",
      description: "Add frozen horizon functionality to prevent rescheduling of operations within specified time period",
      status: 'done',
      priority: 'high',
      phase: 'Phase 2 - Core Features',
      estimatedHours: 16,
      assignedTo: 'Development Team',
      dependencies: [],
      createdAt: '2025-01-20',
      dueDate: '2025-01-26'
    },
    {
      id: 2,
      title: "Advanced Analytics Dashboard",
      description: "Create comprehensive analytics with predictive insights and performance metrics",
      status: 'in-progress',
      priority: 'medium',
      phase: 'Phase 3 - Analytics',
      estimatedHours: 32,
      assignedTo: 'Analytics Team',
      dependencies: [1],
      createdAt: '2025-01-22'
    },
    {
      id: 3,
      title: "Mobile Optimization",
      description: "Optimize all interfaces for mobile devices with responsive design improvements",
      status: 'planned',
      priority: 'high',
      phase: 'Phase 4 - UX Enhancement',
      estimatedHours: 24,
      dependencies: [2],
      createdAt: '2025-01-25'
    }
  ];

  const testSuites: TestSuite[] = [
    {
      id: 1,
      name: "Optimization Algorithm Tests",
      description: "Test suite for backwards scheduling and optimization features",
      type: 'integration',
      status: 'active',
      lastRun: '2025-01-26T10:30:00Z',
      passRate: 92,
      testCases: [
        {
          id: 1,
          name: "Frozen Horizon Validation",
          description: "Test that operations within frozen horizon are not rescheduled",
          steps: ["Enable frozen horizon", "Set 3-day period", "Run optimization", "Verify no changes to near-term operations"],
          expectedResult: "Operations within 3 days remain unchanged",
          status: 'pass',
          lastRun: '2025-01-26T10:30:00Z'
        },
        {
          id: 2,
          name: "Resource Constraint Handling",
          description: "Test algorithm behavior with limited resources",
          steps: ["Create high-demand scenario", "Run optimization", "Check resource allocation"],
          expectedResult: "Optimal resource utilization without conflicts",
          status: 'pass',
          lastRun: '2025-01-26T10:30:00Z'
        }
      ]
    },
    {
      id: 2,
      name: "UI/UX Tests",
      description: "End-to-end testing of user interface components",
      type: 'e2e',
      status: 'active',
      lastRun: '2025-01-25T15:45:00Z',
      passRate: 88,
      testCases: [
        {
          id: 3,
          name: "Navigation Flow",
          description: "Test navigation between main application sections",
          steps: ["Login", "Navigate to each section", "Verify page loads", "Check responsive design"],
          expectedResult: "All pages load correctly on desktop and mobile",
          status: 'fail',
          lastRun: '2025-01-25T15:45:00Z'
        }
      ]
    }
  ];

  const phases = [
    {
      name: "Phase 1 - Foundation",
      description: "Core system architecture and basic features",
      progress: 95,
      tasks: tasks.filter(t => t.phase.includes('Phase 1')).length || 8,
      completed: 8
    },
    {
      name: "Phase 2 - Core Features",
      description: "Production scheduling and optimization capabilities",
      progress: 80,
      tasks: tasks.filter(t => t.phase.includes('Phase 2')).length || 12,
      completed: 10
    },
    {
      name: "Phase 3 - Analytics",
      description: "Advanced analytics and reporting features",
      progress: 45,
      tasks: tasks.filter(t => t.phase.includes('Phase 3')).length || 8,
      completed: 3
    },
    {
      name: "Phase 4 - UX Enhancement", 
      description: "User experience improvements and mobile optimization",
      progress: 10,
      tasks: tasks.filter(t => t.phase.includes('Phase 4')).length || 6,
      completed: 1
    }
  ];

  const architectureComponents = [
    {
      name: "Frontend Layer",
      technology: "React + TypeScript",
      description: "User interface with responsive design and real-time updates",
      health: "Excellent",
      coverage: 85
    },
    {
      name: "Backend API",
      technology: "Express.js + Node.js",
      description: "RESTful API with authentication and business logic",
      health: "Good",
      coverage: 78
    },
    {
      name: "Database",
      technology: "PostgreSQL + Drizzle ORM",
      description: "Relational database with optimized schema and indexing",
      health: "Excellent",
      coverage: 92
    },
    {
      name: "AI Services",
      technology: "OpenAI GPT-4o + Custom Algorithms",
      description: "AI assistant and optimization algorithms",
      health: "Good",
      coverage: 70
    },
    {
      name: "Real-time Communication",
      technology: "WebSockets",
      description: "Live updates and real-time collaboration features",
      health: "Fair",
      coverage: 60
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-500" />
            Product Development Hub
          </h1>
          <p className="text-gray-600 mt-1">
            Strategy, architecture, development planning, and testing for system builders
          </p>
        </div>
        <Button 
          onClick={() => setShowAIDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Strategic Documentation</h2>
            <Button onClick={() => setShowStrategyDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Strategy Doc
            </Button>
          </div>

          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        {strategy.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={strategy.category === 'architecture' ? 'default' : 'secondary'}>
                          {strategy.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Updated {new Date(strategy.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{strategy.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Product Development Roadmap</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Export Timeline
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure View
              </Button>
            </div>
          </div>

          {/* Roadmap Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{roadmapPhases.filter(p => p.status === 'completed').length}</p>
                  <p className="text-sm text-gray-600">Completed Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{roadmapPhases.filter(p => p.status === 'in-progress').length}</p>
                  <p className="text-sm text-gray-600">Active Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{roadmapPhases.filter(p => p.status === 'upcoming').length}</p>
                  <p className="text-sm text-gray-600">Upcoming Phases</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(roadmapPhases.reduce((acc, p) => acc + p.progress, 0) / roadmapPhases.length)}%
                  </p>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline View */}
          <div className="space-y-6">
            {roadmapPhases.map((phase, index) => (
              <Card key={phase.id} className={`relative overflow-hidden ${
                phase.status === 'completed' ? 'border-green-200 bg-green-50' :
                phase.status === 'in-progress' ? 'border-blue-200 bg-blue-50' :
                phase.status === 'delayed' ? 'border-red-200 bg-red-50' :
                'border-gray-200'
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
                        <CardTitle className="text-xl">{phase.name}</CardTitle>
                        <CardDescription className="text-base mt-1">{phase.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={
                            phase.status === 'completed' ? 'default' :
                            phase.status === 'in-progress' ? 'secondary' :
                            phase.status === 'delayed' ? 'destructive' : 'outline'
                          }>
                            {phase.status.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                          </span>
                          {phase.dependencies && phase.dependencies.length > 0 && (
                            <span className="text-xs text-gray-500">
                              Depends on Phase {phase.dependencies.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">{phase.progress}%</div>
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
                                <Badge size="sm" variant={
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
                                <Badge size="sm" variant={
                                  feature.priority === 'critical' ? 'destructive' :
                                  feature.priority === 'high' ? 'default' :
                                  feature.priority === 'medium' ? 'secondary' : 'outline'
                                }>
                                  {feature.priority}
                                </Badge>
                                <Badge size="sm" variant="outline">
                                  {feature.effort}
                                </Badge>
                                <Badge size="sm" variant={
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
                    <div className="w-1 h-6 bg-gray-300"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full -ml-1"></div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">System Architecture</h2>
            <Button variant="outline">
              <Network className="w-4 h-4 mr-2" />
              Visual Diagram
            </Button>
          </div>

          <div className="grid gap-4">
            {architectureComponents.map((component, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-green-500" />
                        {component.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{component.technology}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        component.health === 'Excellent' ? 'default' :
                        component.health === 'Good' ? 'secondary' : 'destructive'
                      }>
                        {component.health}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">{component.coverage}% Coverage</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{component.description}</p>
                  <Progress value={component.coverage} className="w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Development Planning</h2>
            <Button onClick={() => setShowTaskDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>

          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
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
                          {task.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{task.phase}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{task.estimatedHours}h estimated</p>
                      {task.assignedTo && (
                        <p className="text-sm text-gray-500">{task.assignedTo}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{task.description}</p>
                  {task.dueDate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Overall System Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">58%</p>
                  <p className="text-sm text-gray-600">Overall Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">34</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">22</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">12</p>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">System Testing</h2>
            <Button onClick={() => setShowTestDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Test Suite
            </Button>
          </div>

          <div className="grid gap-4">
            {testSuites.map((suite) => (
              <Card key={suite.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
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
                        {suite.passRate && (
                          <span className="text-sm text-gray-500">
                            {suite.passRate}% pass rate
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4" />
                      Run Tests
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{suite.description}</p>
                  {suite.lastRun && (
                    <p className="text-sm text-gray-500">
                      Last run: {new Date(suite.lastRun).toLocaleString()}
                    </p>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Test Cases ({suite.testCases.length})</h4>
                    {suite.testCases.map((testCase) => (
                      <div key={testCase.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            testCase.status === 'pass' ? 'bg-green-500' :
                            testCase.status === 'fail' ? 'bg-red-500' :
                            testCase.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium">{testCase.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{testCase.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
}