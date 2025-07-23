import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Circle,
  Clock,
  Play,
  Book,
  Video,
  FileText,
  Download,
  ExternalLink,
  Star,
  Trophy,
  Gift,
  Lightbulb,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Sparkles,
  Zap,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Job, Resource, Operation } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: "setup" | "data" | "features" | "advanced";
  completed: boolean;
  optional: boolean;
  estimatedTime: number; // in minutes
  prerequisites: string[];
  resources: {
    video?: string;
    documentation?: string;
    template?: string;
  };
}

interface OnboardingProgress {
  userId: string;
  currentStep: string;
  completedSteps: string[];
  startedAt: string;
  lastActiveAt: string;
  totalSteps: number;
  completedCount: number;
  estimatedTimeRemaining: number;
}

interface OnboardingTour {
  id: string;
  title: string;
  steps: TourStep[];
  category: "basic" | "intermediate" | "advanced";
  duration: number;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  placement: "top" | "bottom" | "left" | "right";
  action?: "click" | "hover" | "type";
  content?: string;
}

export default function HelpAndGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("setup");
  const [showProgress, setShowProgress] = useState(true);
  const [tourActive, setTourActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if user is new (no existing data)
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  // Onboarding steps configuration
  const onboardingSteps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to PlanetTogether",
      description: "Get an overview of the system and what you can accomplish",
      category: "setup",
      completed: false,
      optional: false,
      estimatedTime: 5,
      prerequisites: [],
      resources: {
        video: "https://example.com/welcome-video",
        documentation: "/docs/getting-started"
      }
    },
    {
      id: "account_setup",
      title: "Complete Your Account Setup",
      description: "Verify your account details and configure basic preferences",
      category: "setup",
      completed: true,
      optional: false,
      estimatedTime: 10,
      prerequisites: ["welcome"],
      resources: {
        documentation: "/docs/account-setup"
      }
    },
    {
      id: "create_first_job",
      title: "Create Your First Job",
      description: "Learn how to create a production job with customer requirements",
      category: "data",
      completed: jobs.length > 0,
      optional: false,
      estimatedTime: 15,
      prerequisites: ["account_setup"],
      resources: {
        video: "https://example.com/job-creation",
        template: "/templates/sample-job.json"
      }
    },
    {
      id: "add_resources",
      title: "Add Production Resources",
      description: "Set up machines, equipment, and personnel for your operations",
      category: "data",
      completed: resources.length > 0,
      optional: false,
      estimatedTime: 20,
      prerequisites: ["create_first_job"],
      resources: {
        video: "https://example.com/resource-setup",
        template: "/templates/resources-template.csv"
      }
    },
    {
      id: "schedule_operations",
      title: "Schedule Your First Operations",
      description: "Learn the drag-and-drop scheduling interface",
      category: "features",
      completed: operations.length > 0,
      optional: false,
      estimatedTime: 25,
      prerequisites: ["add_resources"],
      resources: {
        video: "https://example.com/scheduling-tutorial"
      }
    },
    {
      id: "explore_analytics",
      title: "Explore Analytics & Reports",
      description: "Discover insights from your production data",
      category: "features",
      completed: false,
      optional: true,
      estimatedTime: 15,
      prerequisites: ["schedule_operations"],
      resources: {
        video: "https://example.com/analytics-overview",
        documentation: "/docs/analytics"
      }
    },
    {
      id: "ai_assistant",
      title: "Meet Your AI Assistant",
      description: "Learn how to use voice commands and AI automation",
      category: "advanced",
      completed: false,
      optional: true,
      estimatedTime: 20,
      prerequisites: ["explore_analytics"],
      resources: {
        video: "https://example.com/ai-assistant-demo"
      }
    },
    {
      id: "optimization",
      title: "Production Optimization",
      description: "Advanced techniques for maximizing efficiency",
      category: "advanced",
      completed: false,
      optional: true,
      estimatedTime: 30,
      prerequisites: ["ai_assistant"],
      resources: {
        documentation: "/docs/optimization-strategies",
        template: "/templates/optimization-checklist.pdf"
      }
    }
  ];

  // Available tours
  const availableTours: OnboardingTour[] = [
    {
      id: "basic_navigation",
      title: "Basic Navigation Tour",
      category: "basic",
      duration: 5,
      steps: [
        {
          id: "nav_1",
          title: "Main Navigation",
          description: "This is your main navigation sidebar",
          target: ".sidebar",
          placement: "right"
        },
        {
          id: "nav_2",
          title: "Dashboard Overview",
          description: "Your production dashboard shows key metrics",
          target: ".dashboard-content",
          placement: "bottom"
        }
      ]
    },
    {
      id: "job_creation",
      title: "Job Creation Walkthrough",
      category: "intermediate",
      duration: 10,
      steps: [
        {
          id: "job_1",
          title: "New Job Button",
          description: "Click here to create a new production job",
          target: ".new-job-button",
          placement: "bottom",
          action: "click"
        }
      ]
    }
  ];

  // Calculate progress
  const totalSteps = onboardingSteps.length;
  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const estimatedTimeRemaining = onboardingSteps
    .filter(step => !step.completed)
    .reduce((total, step) => total + step.estimatedTime, 0);

  // Filter steps by category
  const categorizedSteps = {
    setup: onboardingSteps.filter(step => step.category === "setup"),
    data: onboardingSteps.filter(step => step.category === "data"),
    features: onboardingSteps.filter(step => step.category === "features"),
    advanced: onboardingSteps.filter(step => step.category === "advanced")
  };

  const categoryIcons = {
    setup: Settings,
    data: BarChart3,
    features: Zap,
    advanced: Sparkles
  };

  const categoryColors = {
    setup: "bg-blue-50 text-blue-600 border-blue-200",
    data: "bg-green-50 text-green-600 border-green-200",
    features: "bg-purple-50 text-purple-600 border-purple-200",
    advanced: "bg-orange-50 text-orange-600 border-orange-200"
  };

  // Step completion handler
  const completeStep = async (stepId: string) => {
    try {
      await apiRequest('POST', '/api/onboarding/complete-step', { stepId });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/progress'] });
      
      const step = onboardingSteps.find(s => s.id === stepId);
      toast({
        title: "Step Completed!",
        description: `Great job completing: ${step?.title}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark step as completed",
        variant: "destructive",
      });
    }
  };

  // Tour control handlers
  const startTour = (tour: OnboardingTour) => {
    setCurrentTour(tour);
    setTourStepIndex(0);
    setTourActive(true);
    toast({
      title: "Tour Started",
      description: `Starting ${tour.title}`,
    });
  };

  const nextTourStep = () => {
    if (currentTour && tourStepIndex < currentTour.steps.length - 1) {
      setTourStepIndex(tourStepIndex + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    setTourActive(false);
    setCurrentTour(null);
    setTourStepIndex(0);
    toast({
      title: "Tour Completed!",
      description: "You've completed the guided tour",
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Getting Started</h1>
          <p className="text-sm md:text-base text-gray-600">
            Complete setup tasks, learn features, and track your implementation progress
          </p>
        </div>
        <div className="lg:flex-shrink-0 flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            {completedSteps}/{totalSteps} Complete
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProgress(!showProgress)}
          >
            {showProgress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      {showProgress && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                Implementation Progress
              </CardTitle>
              <div className="text-sm text-gray-600">
                ~{estimatedTimeRemaining} min remaining
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                {Object.entries(categorizedSteps).map(([category, steps]) => {
                  const categoryCompleted = steps.filter(s => s.completed).length;
                  const categoryTotal = steps.length;
                  const categoryPercentage = categoryTotal > 0 ? (categoryCompleted / categoryTotal) * 100 : 0;
                  const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];

                  return (
                    <div key={category} className={`p-3 rounded-lg border ${categoryColors[category as keyof typeof categoryColors]}`}>
                      <div className="flex items-center mb-2">
                        <CategoryIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {categoryCompleted}/{categoryTotal} complete
                      </div>
                      <Progress value={categoryPercentage} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {Object.keys(categorizedSteps).map((category) => {
          const steps = categorizedSteps[category as keyof typeof categorizedSteps];
          const completedCount = steps.filter(s => s.completed).length;
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CategoryIcon className="h-4 w-4 mr-2" />
              <span className="capitalize">{category}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {completedCount}/{steps.length}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Steps Grid */}
      <div className="grid gap-4">
        {categorizedSteps[activeCategory as keyof typeof categorizedSteps].map((step) => {
          const isExpanded = expandedStep === step.id;
          const canStart = step.prerequisites.every(prereq => 
            onboardingSteps.find(s => s.id === prereq)?.completed
          );

          return (
            <Card key={step.id} className={`transition-all ${
              step.completed ? 'bg-green-50 border-green-200' : 
              !canStart ? 'bg-gray-50 border-gray-200 opacity-60' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-full p-1 ${
                      step.completed ? 'bg-green-100' : 
                      !canStart ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-base flex items-center">
                        {step.title}
                        {step.optional && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Optional
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {step.estimatedTime}m
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Prerequisites */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                      {step.prerequisites.length > 0 ? (
                        <div className="space-y-1">
                          {step.prerequisites.map((prereqId) => {
                            const prereq = onboardingSteps.find(s => s.id === prereqId);
                            return (
                              <div key={prereqId} className="flex items-center text-sm">
                                {prereq?.completed ? (
                                  <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400 mr-2" />
                                )}
                                {prereq?.title || prereqId}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">None</p>
                      )}
                    </div>

                    {/* Resources */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Resources</h4>
                      <div className="space-y-2">
                        {step.resources.video && (
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Video className="h-4 w-4 mr-2" />
                            Watch Video Tutorial
                          </Button>
                        )}
                        {step.resources.documentation && (
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <FileText className="h-4 w-4 mr-2" />
                            View Documentation
                          </Button>
                        )}
                        {step.resources.template && (
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t">
                    {step.completed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : canStart ? (
                      <Button
                        onClick={() => completeStep(step.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Mark as Complete
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Prerequisites Required
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Interactive Tours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="h-5 w-5 mr-2 text-blue-600" />
            Interactive Tours
          </CardTitle>
          <CardDescription>
            Take guided tours to learn specific features hands-on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTours.map((tour) => (
              <Card key={tour.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tour.title}</CardTitle>
                    <Badge 
                      variant={tour.category === 'basic' ? 'default' : 
                              tour.category === 'intermediate' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {tour.category}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {tour.duration} minutes
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => startTour(tour)}
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Tour
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Quick Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Need Assistance?</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Contact support at support@planettogether.com</li>
                <li>• Join our community forum</li>
                <li>• Schedule a training session</li>
                <li>• Access the knowledge base</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quick Links</h4>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start p-2">
                  <Book className="h-4 w-4 mr-2" />
                  User Manual
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start p-2">
                  <Video className="h-4 w-4 mr-2" />
                  Video Library
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start p-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Support Portal
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}