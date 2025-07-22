import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Play,
  Upload,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Lightbulb,
  Book,
  Video,
  FileText,
  Download,
  ExternalLink,
  Star,
  Trophy,
  Gift,
  Sparkles,
  Zap,
  Clock,
  Info,
  AlertCircle,
  X,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ChevronRight,
  ChevronDown
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

export default function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false);
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
        documentation: "https://docs.planettogether.com/getting-started"
      }
    },
    {
      id: "profile_setup",
      title: "Set Up Your Profile",
      description: "Configure your user profile and preferences",
      category: "setup",
      completed: false,
      optional: false,
      estimatedTime: 3,
      prerequisites: ["welcome"],
      resources: {
        documentation: "https://docs.planettogether.com/profile-setup"
      }
    },
    {
      id: "upload_resources",
      title: "Add Your Resources",
      description: "Upload or manually add your manufacturing resources (machines, operators, facilities)",
      category: "data",
      completed: resources.length > 0,
      optional: false,
      estimatedTime: 15,
      prerequisites: ["profile_setup"],
      resources: {
        template: "/templates/resources-template.csv",
        documentation: "https://docs.planettogether.com/resources"
      }
    },
    {
      id: "create_capabilities",
      title: "Define Capabilities",
      description: "Set up the capabilities that your resources can perform",
      category: "data",
      completed: false,
      optional: false,
      estimatedTime: 10,
      prerequisites: ["upload_resources"],
      resources: {
        documentation: "https://docs.planettogether.com/capabilities"
      }
    },
    {
      id: "import_jobs",
      title: "Import Jobs",
      description: "Add your production jobs from existing systems or create them manually",
      category: "data",
      completed: jobs.length > 0,
      optional: false,
      estimatedTime: 20,
      prerequisites: ["create_capabilities"],
      resources: {
        template: "/templates/jobs-template.csv",
        documentation: "https://docs.planettogether.com/jobs"
      }
    },
    {
      id: "schedule_operations",
      title: "Schedule Operations",
      description: "Learn to schedule operations on your resources using the Gantt chart",
      category: "features",
      completed: operations.length > 0,
      optional: false,
      estimatedTime: 15,
      prerequisites: ["import_jobs"],
      resources: {
        video: "https://example.com/scheduling-video",
        documentation: "https://docs.planettogether.com/scheduling"
      }
    },
    {
      id: "drag_drop_tutorial",
      title: "Master Drag & Drop",
      description: "Learn to efficiently move operations between resources",
      category: "features",
      completed: false,
      optional: false,
      estimatedTime: 10,
      prerequisites: ["schedule_operations"],
      resources: {
        video: "https://example.com/drag-drop-video"
      }
    },
    {
      id: "explore_boards",
      title: "Explore Kanban Boards",
      description: "Learn to use boards for different views of your jobs and operations",
      category: "features",
      completed: false,
      optional: true,
      estimatedTime: 12,
      prerequisites: ["drag_drop_tutorial"],
      resources: {
        video: "https://example.com/boards-video",
        documentation: "https://docs.planettogether.com/boards"
      }
    },
    {
      id: "setup_analytics",
      title: "Set Up Analytics",
      description: "Configure dashboards and metrics to track your performance",
      category: "features",
      completed: false,
      optional: true,
      estimatedTime: 8,
      prerequisites: ["schedule_operations"],
      resources: {
        documentation: "https://docs.planettogether.com/analytics"
      }
    },
    {
      id: "meet_max",
      title: "Meet Max AI Assistant",
      description: "Learn to use the AI assistant for scheduling optimization and insights",
      category: "features",
      completed: false,
      optional: true,
      estimatedTime: 10,
      prerequisites: ["schedule_operations"],
      resources: {
        video: "https://example.com/max-ai-video",
        documentation: "https://docs.planettogether.com/ai-assistant"
      }
    },
    {
      id: "mobile_setup",
      title: "Mobile Access Setup",
      description: "Learn about mobile features for shop floor operations",
      category: "advanced",
      completed: false,
      optional: true,
      estimatedTime: 5,
      prerequisites: ["schedule_operations"],
      resources: {
        documentation: "https://docs.planettogether.com/mobile"
      }
    },
    {
      id: "integrations",
      title: "System Integrations",
      description: "Connect with your existing ERP, MES, or other systems",
      category: "advanced",
      completed: false,
      optional: true,
      estimatedTime: 30,
      prerequisites: ["import_jobs"],
      resources: {
        documentation: "https://docs.planettogether.com/integrations"
      }
    }
  ];

  // Interactive tours
  const tours: OnboardingTour[] = [
    {
      id: "basic_navigation",
      title: "Basic Navigation",
      category: "basic",
      duration: 5,
      steps: [
        {
          id: "sidebar",
          title: "Navigation Sidebar",
          description: "Use the sidebar to navigate between different sections of PlanetTogether",
          target: ".sidebar",
          placement: "right"
        },
        {
          id: "schedule",
          title: "Schedule View",
          description: "This is your main scheduling interface with the Gantt chart",
          target: ".schedule-view",
          placement: "bottom"
        },
        {
          id: "max_button",
          title: "Max AI Assistant",
          description: "Click here to access Max, your AI assistant for scheduling help",
          target: ".max-button",
          placement: "left"
        }
      ]
    },
    {
      id: "scheduling_basics",
      title: "Scheduling Basics",
      category: "intermediate",
      duration: 8,
      steps: [
        {
          id: "gantt_chart",
          title: "Gantt Chart",
          description: "This timeline shows your operations scheduled across resources",
          target: ".gantt-chart",
          placement: "top"
        },
        {
          id: "resource_list",
          title: "Resource List",
          description: "Your resources are listed here. Operations are assigned to these resources",
          target: ".resource-list",
          placement: "right"
        },
        {
          id: "operation_block",
          title: "Operation Blocks",
          description: "Each block represents an operation. You can drag these between resources",
          target: ".operation-block:first-child",
          placement: "top"
        }
      ]
    }
  ];

  // Calculate progress
  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const totalSteps = onboardingSteps.filter(step => !step.optional).length;
  const progress = (completedSteps / totalSteps) * 100;

  // Check if user is new (no existing data)
  const isNewUser = jobs.length === 0 && resources.length === 0 && operations.length === 0;
  
  // Check if user has seen onboarding before
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';

  // Auto-open for new users who haven't seen onboarding
  useEffect(() => {
    // Always disable onboarding popup - never show it automatically
    // Users can manually access it from the help menu if needed
    return;
  }, [isNewUser, hasSeenOnboarding, user]);

  // Listen for custom event to open onboarding
  useEffect(() => {
    const handleOpenOnboarding = () => {
      // Check if user is in demo mode - if so, don't show onboarding popup
      const isDemo = localStorage.getItem("authToken")?.startsWith("demo_") || 
                     user?.id?.startsWith("demo_") || 
                     user?.username?.startsWith("demo_");
      
      // Only open onboarding for non-demo users
      if (!isDemo) {
        setIsOpen(true);
      }
    };

    window.addEventListener('openOnboarding', handleOpenOnboarding);
    return () => window.removeEventListener('openOnboarding', handleOpenOnboarding);
  }, [user]);

  // Mark onboarding as seen when user closes it
  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  // Mark step as completed
  const markStepCompleted = useMutation({
    mutationFn: async (stepId: string) => {
      // In real app, this would update user progress in database
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: (_, stepId) => {
      const stepIndex = onboardingSteps.findIndex(s => s.id === stepId);
      if (stepIndex !== -1) {
        onboardingSteps[stepIndex].completed = true;
      }
      toast({
        title: "Step Completed!",
        description: "Great job! You're making progress.",
      });
    },
  });

  // Start tour
  const startTour = (tour: OnboardingTour) => {
    setCurrentTour(tour);
    setTourStepIndex(0);
    setTourActive(true);
    toast({
      title: `Starting ${tour.title}`,
      description: `This tour will take approximately ${tour.duration} minutes.`,
    });
  };

  // Next tour step
  const nextTourStep = () => {
    if (currentTour && tourStepIndex < currentTour.steps.length - 1) {
      setTourStepIndex(tourStepIndex + 1);
    } else {
      // Tour completed
      setTourActive(false);
      setCurrentTour(null);
      setTourStepIndex(0);
      toast({
        title: "Tour Completed!",
        description: "You've completed the interactive tour. Well done!",
      });
    }
  };

  // Previous tour step
  const prevTourStep = () => {
    if (tourStepIndex > 0) {
      setTourStepIndex(tourStepIndex - 1);
    }
  };

  // Get steps by category
  const getStepsByCategory = (category: string) => {
    return onboardingSteps.filter(step => step.category === category);
  };

  // Get category progress
  const getCategoryProgress = (category: string) => {
    const categorySteps = getStepsByCategory(category);
    const completedCount = categorySteps.filter(step => step.completed).length;
    return (completedCount / categorySteps.length) * 100;
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "setup": return <Settings className="w-5 h-5" />;
      case "data": return <Upload className="w-5 h-5" />;
      case "features": return <Star className="w-5 h-5" />;
      case "advanced": return <Zap className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  // Download template
  const downloadTemplate = (templatePath: string) => {
    // In real app, this would download the actual template
    toast({
      title: "Template Downloaded",
      description: "The template file has been downloaded to your computer.",
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              {isNewUser ? "Welcome to PlanetTogether" : "PlanetTogether Help & Guide"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Progress Overview - Only show for new users */}
            {isNewUser && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Your Progress</h3>
                  <Badge variant="outline" className="text-blue-600">
                    {completedSteps} of {totalSteps} completed
                  </Badge>
                </div>
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">
                  {progress === 100 ? "Congratulations! You've completed the essential setup." : 
                   `${Math.round(progress)}% complete - Keep going!`}
                </p>
              </div>
            )}

            {/* Welcome message for returning users */}
            {!isNewUser && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Welcome back!</h3>
                <p className="text-sm text-gray-600">
                  Use this guide to review features, access tutorials, or explore advanced capabilities.
                </p>
              </div>
            )}

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="setup" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Setup
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Category Content */}
              {["setup", "data", "features", "advanced"].map(category => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="space-y-4">
                    {/* Category Progress */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={getCategoryProgress(category)} className="w-20 h-2" />
                        <span className="text-sm text-gray-600">
                          {Math.round(getCategoryProgress(category))}%
                        </span>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      {getStepsByCategory(category).map((step, index) => (
                        <Card key={step.id} className={`transition-all ${step.completed ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {step.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{step.title}</h4>
                                  {step.optional && (
                                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {step.estimatedTime} min
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                                
                                {/* Prerequisites */}
                                {step.prerequisites.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-gray-500 mb-1">Prerequisites:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {step.prerequisites.map(prereq => {
                                        const prereqStep = onboardingSteps.find(s => s.id === prereq);
                                        return prereqStep ? (
                                          <Badge key={prereq} variant="outline" className="text-xs">
                                            {prereqStep.title}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Expandable Details */}
                                <div className="mb-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                                  >
                                    {expandedStep === step.id ? (
                                      <ChevronDown className="w-4 h-4 mr-1" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 mr-1" />
                                    )}
                                    {expandedStep === step.id ? "Hide Details" : "Show Details"}
                                  </Button>
                                </div>

                                {expandedStep === step.id && (
                                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                    <h5 className="font-medium mb-2">Resources Available:</h5>
                                    <div className="space-y-2">
                                      {step.resources.video && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(step.resources.video, '_blank')}
                                          className="flex items-center gap-2"
                                        >
                                          <Video className="w-4 h-4" />
                                          Watch Video Tutorial
                                        </Button>
                                      )}
                                      {step.resources.documentation && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(step.resources.documentation, '_blank')}
                                          className="flex items-center gap-2"
                                        >
                                          <Book className="w-4 h-4" />
                                          Read Documentation
                                        </Button>
                                      )}
                                      {step.resources.template && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => downloadTemplate(step.resources.template!)}
                                          className="flex items-center gap-2"
                                        >
                                          <Download className="w-4 h-4" />
                                          Download Template
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {!step.completed && (
                                    <Button
                                      size="sm"
                                      onClick={() => markStepCompleted.mutate(step.id)}
                                      disabled={markStepCompleted.isPending}
                                      className="flex items-center gap-2"
                                    >
                                      {markStepCompleted.isPending ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                      Mark Complete
                                    </Button>
                                  )}
                                  
                                  {step.id === "schedule_operations" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startTour(tours.find(t => t.id === "scheduling_basics")!)}
                                      className="flex items-center gap-2"
                                    >
                                      <Play className="w-4 h-4" />
                                      Start Tour
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Interactive Tours Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Interactive Tours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tours.map(tour => (
                  <Card key={tour.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{tour.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {tour.duration} min
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {tour.steps.length} interactive steps
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startTour(tour)}
                        className="flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Tour
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open("/", '_blank')}>
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("/boards", '_blank')}>
                  <Target className="w-4 h-4 mr-2" />
                  Open Boards
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("/ai-assistant", '_blank')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Meet Max
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("/feedback", '_blank')}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Give Feedback
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Overlay */}
      {tourActive && currentTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{currentTour.steps[tourStepIndex].title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTourActive(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                {currentTour.steps[tourStepIndex].description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {tourStepIndex + 1} of {currentTour.steps.length}
                  </span>
                  <Progress value={((tourStepIndex + 1) / currentTour.steps.length) * 100} className="w-16 h-2" />
                </div>
                
                <div className="flex gap-2">
                  {tourStepIndex > 0 && (
                    <Button variant="outline" size="sm" onClick={prevTourStep}>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                  )}
                  <Button size="sm" onClick={nextTourStep}>
                    {tourStepIndex === currentTour.steps.length - 1 ? "Finish" : "Next"}
                    {tourStepIndex < currentTour.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}