import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Target, CheckCircle, AlertCircle, 
  TrendingUp, Users, Package, Calendar, Brain,
  Sparkles, BookOpen, Video, Phone, Mail,
  ChevronRight, Clock, Award, BarChart3,
  Settings, Database, Workflow, Globe, GraduationCap
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  tasks: ImplementationTask[];
  milestones: Milestone[];
}

interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  dependencies?: string[];
  estimatedHours?: number;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  achieved: boolean;
  description: string;
}

interface ConsultantRecommendation {
  id: string;
  type: 'feature' | 'process' | 'training' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  status: 'suggested' | 'accepted' | 'in-progress' | 'completed' | 'declined';
  reasoning: string;
  benefits: string[];
  prerequisites?: string[];
}

interface CustomerGoal {
  id: string;
  goal: string;
  targetDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'achieved' | 'paused';
  relatedFeatures: string[];
  successMetrics: string[];
  progress: number;
}

export const AIImplementationConsultant: React.FC = () => {
  const [activePhase, setActivePhase] = useState<string>('discovery');
  const [showChat, setShowChat] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // Fetch implementation data
  const { data: implementationData, isLoading } = useQuery({
    queryKey: ['/api/implementation/status'],
    queryFn: async () => {
      // This would fetch from your actual API
      return {
        company: {
          name: 'Heineken',
          industry: 'Food & Beverage',
          size: 'Enterprise',
          implementationStage: 'Phase 2',
          goLiveDate: '2025-09-15'
        },
        phases: getImplementationPhases(),
        recommendations: getProactiveRecommendations(),
        goals: getCustomerGoals(),
        healthScore: 85,
        adoptionRate: 72,
        activeUsers: 156,
        completedMilestones: 8,
        totalMilestones: 15
      };
    }
  });

  // Save goal progress
  const saveGoalMutation = useMutation({
    mutationFn: async (goal: CustomerGoal) => {
      const response = await fetch('/api/implementation/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/implementation/status'] });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Implementation Health Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-lg sm:text-xl">Max AI Onboarding Assistant</CardTitle>
            </div>
            <Button 
              onClick={() => setShowChat(!showChat)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white w-full sm:w-auto"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chat with Max</span>
              <span className="sm:hidden">Chat</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Health Score"
              value={`${implementationData?.healthScore}%`}
              icon={TrendingUp}
              color="text-green-600"
              trend="+5% from last week"
            />
            <MetricCard
              title="Adoption Rate"
              value={`${implementationData?.adoptionRate}%`}
              icon={Users}
              color="text-blue-600"
              trend="+12% this month"
            />
            <MetricCard
              title="Active Users"
              value={implementationData?.activeUsers}
              icon={Users}
              color="text-purple-600"
              trend="156 of 200 licensed"
            />
            <MetricCard
              title="Milestones"
              value={`${implementationData?.completedMilestones}/${implementationData?.totalMilestones}`}
              icon={Award}
              color="text-orange-600"
              trend="Next due in 3 days"
            />
          </div>

          {/* Proactive Consultant Message */}
          <ProactiveConsultantMessage 
            phase={activePhase}
            company={implementationData?.company}
          />
        </CardContent>
      </Card>

      {/* Main Implementation Tabs */}
      <Tabs defaultValue="roadmap" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
          <TabsTrigger value="roadmap" className="text-xs sm:text-sm">Roadmap</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs sm:text-sm">Goals</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs sm:text-sm">AI Rec.</TabsTrigger>
          <TabsTrigger value="training" className="text-xs sm:text-sm">Training</TabsTrigger>
          <TabsTrigger value="success" className="text-xs sm:text-sm">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap">
          <ImplementationRoadmap 
            phases={implementationData?.phases || []}
            activePhase={activePhase}
            onPhaseSelect={setActivePhase}
          />
        </TabsContent>

        <TabsContent value="goals">
          <BusinessGoalsManager 
            goals={implementationData?.goals || []}
            onGoalSelect={setSelectedGoal}
            onGoalSave={saveGoalMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="recommendations">
          <AIRecommendations 
            recommendations={implementationData?.recommendations || []}
          />
        </TabsContent>

        <TabsContent value="training">
          <TrainingAndSupport />
        </TabsContent>

        <TabsContent value="success">
          <SuccessMetrics 
            company={implementationData?.company}
            metrics={getSuccessMetrics()}
          />
        </TabsContent>
      </Tabs>

      {/* AI Chat Assistant (Overlay) */}
      {showChat && (
        <AIConsultantChat 
          onClose={() => setShowChat(false)}
          context={{
            phase: activePhase,
            goals: implementationData?.goals,
            recommendations: implementationData?.recommendations
          }}
        />
      )}
    </div>
  );
};

// Proactive Consultant Message Component
const ProactiveConsultantMessage: React.FC<{ phase: string; company: any }> = ({ phase, company }) => {
  const messages = {
    discovery: {
      title: "Welcome to Your Implementation Journey!",
      content: "I'm Max, your AI onboarding assistant. I've analyzed your company profile and prepared a customized implementation plan for Heineken's manufacturing operations. Let's start by understanding your key business goals and pain points.",
      actions: ["Schedule Discovery Call", "Review Implementation Plan", "Set Business Goals"]
    },
    configuration: {
      title: "Configuration Phase In Progress",
      content: "Great progress! We're now configuring your master data and production workflows. Based on your food & beverage industry requirements, I recommend prioritizing recipe management and quality control features.",
      actions: ["Configure Master Data", "Set Up Workflows", "Import Historical Data"]
    },
    training: {
      title: "Training Your Team for Success",
      content: "Your system is configured! Now let's ensure your team is ready. I've prepared role-specific training paths for operators, planners, and managers. The production scheduler training has the highest priority based on your goals.",
      actions: ["Start Scheduler Training", "Schedule Team Sessions", "Access Training Materials"]
    },
    optimization: {
      title: "Optimizing for Peak Performance",
      content: "Your team is using the system well! I've identified several optimization opportunities based on your usage patterns. Implementing these could improve your OEE by 8-12%.",
      actions: ["View Optimization Report", "Implement AI Suggestions", "Schedule Review Meeting"]
    },
    scaling: {
      title: "Ready to Scale",
      content: "Excellent adoption rates! You're ready to expand to additional plants. Based on your success metrics, I recommend rolling out to your European facilities next.",
      actions: ["Plan Multi-Plant Rollout", "Review Scaling Strategy", "Configure New Plants"]
    }
  };

  const message = messages[phase] || messages.discovery;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{message.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message.content}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {message.actions.map((action, index) => (
                <Button 
                  key={index} 
                  size="sm" 
                  variant={index === 0 ? "default" : "outline"}
                  className="w-full sm:w-auto justify-between sm:justify-center"
                >
                  <span>{action}</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Implementation Roadmap Component
const ImplementationRoadmap: React.FC<{
  phases: ImplementationPhase[];
  activePhase: string;
  onPhaseSelect: (phase: string) => void;
}> = ({ phases, activePhase, onPhaseSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Implementation Roadmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <div key={phase.id} className="relative">
              {index < phases.length - 1 && (
                <div className="absolute left-5 sm:left-6 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              )}
              <div 
                className={`flex items-start gap-3 sm:gap-4 cursor-pointer p-3 sm:p-4 rounded-lg transition-colors
                  ${activePhase === phase.id ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => onPhaseSelect(phase.id)}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0
                  ${phase.status === 'completed' ? 'bg-green-500' : 
                    phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'} text-white`}>
                  {phase.status === 'completed' ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h4 className="font-semibold text-base sm:text-lg truncate">{phase.name}</h4>
                    <Badge 
                      variant={phase.status === 'completed' ? 'default' : 
                               phase.status === 'in-progress' ? 'secondary' : 'outline'}
                      className="text-xs w-fit"
                    >
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">{phase.description}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      {phase.duration}
                    </span>
                    <span className="text-xs sm:text-sm">{phase.tasks.filter(t => t.status === 'completed').length} of {phase.tasks.length} tasks completed</span>
                  </div>
                  {phase.status === 'in-progress' && (
                    <Progress value={phase.progress} className="mt-3" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Business Goals Manager Component
const BusinessGoalsManager: React.FC<{
  goals: CustomerGoal[];
  onGoalSelect: (goalId: string) => void;
  onGoalSave: (goal: CustomerGoal) => void;
}> = ({ goals, onGoalSelect, onGoalSave }) => {
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Goals Alignment</CardTitle>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map(goal => (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{goal.goal}</h4>
                    <Badge variant={
                      goal.priority === 'critical' ? 'destructive' :
                      goal.priority === 'high' ? 'default' :
                      goal.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {goal.priority}
                    </Badge>
                    <Badge variant={goal.status === 'achieved' ? 'default' : 'outline'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Related Features: </span>
                      {goal.relatedFeatures.join(', ')}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      AI Recommendation:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Based on your progress, I recommend focusing on {goal.relatedFeatures[0]} 
                      implementation this week. This will accelerate your goal achievement by 20%.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGoalSelect(goal.id)}
                  className="ml-4"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// AI Recommendations Component
const AIRecommendations: React.FC<{ recommendations: ConsultantRecommendation[] }> = ({ recommendations }) => {
  const [filter, setFilter] = useState<'all' | 'feature' | 'process' | 'training' | 'optimization'>('all');

  const filteredRecommendations = filter === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.type === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Recommendations</CardTitle>
        <div className="flex gap-2 mt-4">
          {['all', 'feature', 'process', 'training', 'optimization'].map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type as any)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredRecommendations.map(rec => (
              <Card key={rec.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      rec.type === 'feature' ? 'default' :
                      rec.type === 'process' ? 'secondary' :
                      rec.type === 'training' ? 'outline' : 'destructive'
                    }>
                      {rec.type}
                    </Badge>
                    <h4 className="font-semibold">{rec.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Impact: {rec.impact}
                    </Badge>
                    <Badge variant="outline">
                      Effort: {rec.effort}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{rec.description}</p>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg mb-3">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                    Why I'm recommending this:
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{rec.reasoning}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Expected Benefits:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {rec.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
                    Accept & Implement
                  </Button>
                  <Button size="sm" variant="outline">
                    Schedule Discussion
                  </Button>
                  <Button size="sm" variant="ghost">
                    Not Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Training and Support Component
const TrainingAndSupport: React.FC = () => {
  const trainingModules = [
    {
      role: "Production Scheduler",
      modules: [
        { name: "Advanced Scheduling Techniques", duration: "2 hours", status: "completed", progress: 100 },
        { name: "Constraint Management", duration: "1.5 hours", status: "in-progress", progress: 60 },
        { name: "Optimization Strategies", duration: "2.5 hours", status: "not-started", progress: 0 }
      ]
    },
    {
      role: "Plant Manager",
      modules: [
        { name: "Dashboard & KPI Management", duration: "1 hour", status: "completed", progress: 100 },
        { name: "Performance Analytics", duration: "1.5 hours", status: "not-started", progress: 0 }
      ]
    },
    {
      role: "Operator",
      modules: [
        { name: "Shop Floor Interface", duration: "30 min", status: "completed", progress: 100 },
        { name: "Quality Data Entry", duration: "45 min", status: "in-progress", progress: 75 }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Training Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {trainingModules.map(role => (
              <div key={role.role}>
                <h4 className="font-semibold mb-3">{role.role}</h4>
                <div className="space-y-2">
                  {role.modules.map(module => (
                    <div key={module.name} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{module.name}</span>
                        <Badge variant={
                          module.status === 'completed' ? 'default' :
                          module.status === 'in-progress' ? 'secondary' : 'outline'
                        }>
                          {module.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {module.duration}
                      </div>
                      <Progress value={module.progress} className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SupportResource
              icon={Video}
              title="Weekly Implementation Calls"
              description="Every Tuesday at 2 PM EST"
              action="Join Next Call"
            />
            <SupportResource
              icon={BookOpen}
              title="Implementation Guide"
              description="Step-by-step documentation"
              action="Open Guide"
            />
            <SupportResource
              icon={Phone}
              title="Priority Support Hotline"
              description="24/7 technical support"
              action="Call Support"
            />
            <SupportResource
              icon={Mail}
              title="Email Your Consultant"
              description="Get answers within 4 hours"
              action="Send Email"
            />
            <SupportResource
              icon={MessageCircle}
              title="Max AI Assistant"
              description="Instant answers to your questions"
              action="Chat Now"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Success Metrics Component
const SuccessMetrics: React.FC<{ company: any; metrics: any[] }> = ({ company, metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map(metric => (
              <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{metric.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{metric.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className={`text-sm ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TimelineItem
              date="Week 1-2"
              title="Discovery & Planning"
              status="completed"
              description="Business requirements gathered and implementation plan created"
            />
            <TimelineItem
              date="Week 3-4"
              title="System Configuration"
              status="completed"
              description="Master data setup and workflow configuration"
            />
            <TimelineItem
              date="Week 5-6"
              title="User Training"
              status="in-progress"
              description="Role-based training for all user groups"
            />
            <TimelineItem
              date="Week 7-8"
              title="Pilot Testing"
              status="upcoming"
              description="Limited production run with selected products"
            />
            <TimelineItem
              date="Week 9-10"
              title="Go Live"
              status="upcoming"
              description="Full system deployment and support"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{ title: string; value: string | number; icon: any; color: string; trend: string }> = 
  ({ title, value, icon: Icon, color, trend }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-xs text-gray-500">{trend}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </CardContent>
  </Card>
);

const SupportResource: React.FC<{ icon: any; title: string; description: string; action: string }> = 
  ({ icon: Icon, title, description, action }) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-600" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
    <Button size="sm" variant="outline">{action}</Button>
  </div>
);

const TimelineItem: React.FC<{ date: string; title: string; status: string; description: string }> = 
  ({ date, title, status, description }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full ${
        status === 'completed' ? 'bg-green-500' :
        status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
      }`} />
      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex-1 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-gray-500">{date}</span>
        <Badge variant={
          status === 'completed' ? 'default' :
          status === 'in-progress' ? 'secondary' : 'outline'
        }>
          {status}
        </Badge>
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

// AI Consultant Chat Component
const AIConsultantChat: React.FC<{ onClose: () => void; context: any }> = ({ onClose, context }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Max, your AI onboarding assistant. I see you're in the " + context.phase + 
               " phase. How can I help you achieve your implementation goals today?"
    }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, { role: 'user', content: message }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Based on your question about "${message}", I recommend focusing on your highest priority goal. 
                  Would you like me to create a specific action plan for this?`
      }]);
    }, 1000);
    
    setMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          <span className="font-semibold">Max AI Consultant</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything about your implementation..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

// Data functions
function getImplementationPhases(): ImplementationPhase[] {
  return [
    {
      id: 'discovery',
      name: 'Discovery & Planning',
      description: 'Understanding your business requirements and creating implementation strategy',
      duration: '2 weeks',
      status: 'completed',
      progress: 100,
      tasks: [
        { id: '1', title: 'Business Process Analysis', description: 'Map current workflows', priority: 'high', status: 'completed' },
        { id: '2', title: 'Requirements Gathering', description: 'Document system requirements', priority: 'high', status: 'completed' },
        { id: '3', title: 'Implementation Plan', description: 'Create detailed project plan', priority: 'high', status: 'completed' }
      ],
      milestones: [
        { id: '1', name: 'Kickoff Meeting', date: '2025-07-01', achieved: true, description: 'Project kickoff with stakeholders' },
        { id: '2', name: 'Requirements Approved', date: '2025-07-15', achieved: true, description: 'Business requirements sign-off' }
      ]
    },
    {
      id: 'configuration',
      name: 'System Configuration',
      description: 'Setting up master data, workflows, and system parameters',
      duration: '3 weeks',
      status: 'in-progress',
      progress: 65,
      tasks: [
        { id: '4', title: 'Master Data Setup', description: 'Configure products, resources, BOMs', priority: 'high', status: 'completed' },
        { id: '5', title: 'Workflow Configuration', description: 'Set up production workflows', priority: 'high', status: 'in-progress' },
        { id: '6', title: 'Integration Setup', description: 'Connect with existing systems', priority: 'medium', status: 'pending' }
      ],
      milestones: [
        { id: '3', name: 'Master Data Complete', date: '2025-08-01', achieved: true, description: 'All master data configured' },
        { id: '4', name: 'Workflows Configured', date: '2025-08-15', achieved: false, description: 'Production workflows ready' }
      ]
    },
    {
      id: 'training',
      name: 'Training & Testing',
      description: 'User training and system testing',
      duration: '2 weeks',
      status: 'not-started',
      progress: 0,
      tasks: [
        { id: '7', title: 'Create Training Materials', description: 'Develop role-based training', priority: 'high', status: 'pending' },
        { id: '8', title: 'Conduct Training Sessions', description: 'Train all user groups', priority: 'high', status: 'pending' },
        { id: '9', title: 'User Acceptance Testing', description: 'Validate system with users', priority: 'high', status: 'pending' }
      ],
      milestones: [
        { id: '5', name: 'Training Complete', date: '2025-09-01', achieved: false, description: 'All users trained' },
        { id: '6', name: 'UAT Sign-off', date: '2025-09-07', achieved: false, description: 'User acceptance confirmed' }
      ]
    },
    {
      id: 'golive',
      name: 'Go Live & Support',
      description: 'System deployment and post-launch support',
      duration: '1 week',
      status: 'not-started',
      progress: 0,
      tasks: [
        { id: '10', title: 'Production Cutover', description: 'Switch to new system', priority: 'high', status: 'pending' },
        { id: '11', title: 'Hypercare Support', description: 'Intensive support period', priority: 'high', status: 'pending' }
      ],
      milestones: [
        { id: '7', name: 'Go Live', date: '2025-09-15', achieved: false, description: 'System in production' }
      ]
    },
    {
      id: 'optimization',
      name: 'Optimization',
      description: 'Continuous improvement and optimization',
      duration: 'Ongoing',
      status: 'not-started',
      progress: 0,
      tasks: [
        { id: '12', title: 'Performance Tuning', description: 'Optimize system performance', priority: 'medium', status: 'pending' },
        { id: '13', title: 'Process Optimization', description: 'Refine business processes', priority: 'medium', status: 'pending' }
      ],
      milestones: [
        { id: '8', name: 'First Optimization Review', date: '2025-10-01', achieved: false, description: 'Review and optimize' }
      ]
    }
  ];
}

function getProactiveRecommendations(): ConsultantRecommendation[] {
  return [
    {
      id: '1',
      type: 'feature',
      title: 'Enable Advanced Scheduling Optimizer',
      description: 'Your production complexity would benefit from our AI-powered scheduling optimizer',
      impact: 'high',
      effort: 'low',
      status: 'suggested',
      reasoning: 'Based on your 200+ SKUs and multiple production lines, the optimizer could reduce changeover time by 15% and improve on-time delivery by 10%.',
      benefits: [
        'Reduce changeover time by 15%',
        'Improve on-time delivery to 95%',
        'Decrease scheduling effort by 50%'
      ],
      prerequisites: ['Master data complete', 'Production routes defined']
    },
    {
      id: '2',
      type: 'process',
      title: 'Implement Daily Production Meetings Workflow',
      description: 'Standardize your daily production meetings with automated KPI reports',
      impact: 'medium',
      effort: 'low',
      status: 'suggested',
      reasoning: 'I noticed irregular meeting patterns in your calendar. A standardized daily meeting with automated reports would improve communication and decision-making.',
      benefits: [
        'Reduce meeting time by 30%',
        'Improve issue resolution speed',
        'Better cross-department alignment'
      ]
    },
    {
      id: '3',
      type: 'training',
      title: 'Advanced Scheduler Training for Power Users',
      description: 'Your schedulers would benefit from advanced training on constraint management',
      impact: 'high',
      effort: 'medium',
      status: 'suggested',
      reasoning: 'Usage data shows your schedulers are using basic features only. Advanced training would unlock significant efficiency gains.',
      benefits: [
        'Unlock advanced scheduling features',
        'Improve schedule quality',
        'Reduce manual interventions'
      ]
    },
    {
      id: '4',
      type: 'optimization',
      title: 'Optimize Bottle Filling Line Capacity',
      description: 'AI analysis shows your bottle filling line is a constraint that could be optimized',
      impact: 'high',
      effort: 'medium',
      status: 'suggested',
      reasoning: 'The bottle filling line is limiting overall production by 20%. Small scheduling adjustments could increase throughput significantly.',
      benefits: [
        'Increase line efficiency by 20%',
        'Reduce bottlenecks',
        'Improve overall OEE by 8%'
      ]
    }
  ];
}

function getCustomerGoals(): CustomerGoal[] {
  return [
    {
      id: '1',
      goal: 'Achieve 95% On-Time Delivery',
      targetDate: '2025-12-31',
      priority: 'critical',
      status: 'active',
      relatedFeatures: ['Advanced Scheduling', 'Real-time Tracking', 'Capacity Planning'],
      successMetrics: ['OTD Rate', 'Customer Satisfaction Score', 'Order Cycle Time'],
      progress: 78
    },
    {
      id: '2',
      goal: 'Reduce Production Costs by 12%',
      targetDate: '2026-03-31',
      priority: 'high',
      status: 'active',
      relatedFeatures: ['Optimization Studio', 'Waste Tracking', 'Resource Utilization'],
      successMetrics: ['Cost per Unit', 'Material Waste %', 'Labor Efficiency'],
      progress: 45
    },
    {
      id: '3',
      goal: 'Improve Overall Equipment Effectiveness to 85%',
      targetDate: '2025-10-31',
      priority: 'high',
      status: 'active',
      relatedFeatures: ['Performance Monitoring', 'Maintenance Management', 'Quality Control'],
      successMetrics: ['OEE Score', 'Availability Rate', 'Performance Rate', 'Quality Rate'],
      progress: 62
    },
    {
      id: '4',
      goal: 'Complete Digital Transformation',
      targetDate: '2026-06-30',
      priority: 'medium',
      status: 'active',
      relatedFeatures: ['System Integration', 'Mobile Apps', 'Analytics Dashboard'],
      successMetrics: ['Digital Adoption Rate', 'Paper Reduction %', 'Data Accuracy'],
      progress: 35
    }
  ];
}

function getSuccessMetrics() {
  return [
    { name: 'System Adoption Rate', value: '78%', trend: 12, description: 'Active users vs licensed users' },
    { name: 'Schedule Adherence', value: '92%', trend: 5, description: 'Actual vs planned production' },
    { name: 'Data Accuracy', value: '96%', trend: 3, description: 'Master data quality score' },
    { name: 'Process Efficiency', value: '85%', trend: 8, description: 'Automated vs manual processes' },
    { name: 'User Satisfaction', value: '4.2/5', trend: 10, description: 'Average user feedback score' }
  ];
}

export default AIImplementationConsultant;