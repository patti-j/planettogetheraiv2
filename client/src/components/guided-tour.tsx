import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Play
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string;
  icon: React.ElementType;
  benefits: string[];
  actionText: string;
  duration: string;
}

interface GuidedTourProps {
  role: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Define role-specific tour steps
const getTourSteps = (role: string): TourStep[] => {
  const commonSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Demo",
      description: "Let's explore the key features that will transform your manufacturing operations.",
      page: "current",
      icon: Play,
      benefits: [
        "See real-time production insights",
        "Experience intelligent scheduling",
        "Understand role-based workflows"
      ],
      actionText: "Start Tour",
      duration: "5 min tour"
    }
  ];

  const roleSteps: Record<string, TourStep[]> = {
    'director': [
      {
        id: "business-goals",
        title: "Strategic Business Goals",
        description: "Define and track strategic objectives with KPI monitoring and risk management.",
        page: "/business-goals",
        icon: TrendingUp,
        benefits: [
          "Align production with business objectives",
          "Monitor KPIs in real-time",
          "Identify and mitigate risks early"
        ],
        actionText: "Explore Goals",
        duration: "2 min"
      },
      {
        id: "analytics",
        title: "Executive Analytics",
        description: "Access comprehensive dashboards with production metrics and performance insights.",
        page: "/analytics",
        icon: BarChart3,
        benefits: [
          "Make data-driven decisions",
          "Identify optimization opportunities",
          "Track performance trends"
        ],
        actionText: "View Analytics",
        duration: "2 min"
      },
      {
        id: "reports",
        title: "Executive Reports",
        description: "Generate detailed reports for stakeholders and board presentations.",
        page: "/reports",
        icon: Settings,
        benefits: [
          "Professional reporting for stakeholders",
          "Automated report generation",
          "Custom metrics and visualizations"
        ],
        actionText: "See Reports",
        duration: "1 min"
      }
    ],
    'production-scheduler': [
      {
        id: "schedule",
        title: "Production Schedule",
        description: "Interactive Gantt charts for visual production planning and resource allocation.",
        page: "/",
        icon: BarChart3,
        benefits: [
          "Drag-and-drop operation scheduling",
          "Real-time capacity visualization",
          "Optimize resource utilization"
        ],
        actionText: "See Schedule",
        duration: "3 min"
      },
      {
        id: "shop-floor",
        title: "Shop Floor Management",
        description: "Mobile-optimized interface for managing operations on the production floor.",
        page: "/shop-floor",
        icon: Users,
        benefits: [
          "Real-time operation status",
          "Mobile-friendly interface",
          "Quick status updates"
        ],
        actionText: "Visit Shop Floor",
        duration: "2 min"
      }
    ],
    'plant-manager': [
      {
        id: "plant-overview",
        title: "Plant Management",
        description: "Comprehensive oversight of plant operations and strategic decision-making.",
        page: "/plant-manager",
        icon: Settings,
        benefits: [
          "Complete plant visibility",
          "Strategic planning tools",
          "Performance optimization"
        ],
        actionText: "Manage Plant",
        duration: "3 min"
      },
      {
        id: "capacity-planning",
        title: "Capacity Planning",
        description: "Plan and optimize production capacity including staffing and equipment.",
        page: "/capacity-planning",
        icon: Target,
        benefits: [
          "Optimize resource allocation",
          "Plan future capacity needs",
          "Balance workloads effectively"
        ],
        actionText: "Plan Capacity",
        duration: "2 min"
      }
    ]
  };

  return [...commonSteps, ...(roleSteps[role] || roleSteps['production-scheduler'])];
};

export function GuidedTour({ role, onComplete, onSkip }: GuidedTourProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  const tourSteps = getTourSteps(role);
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Navigate to the first relevant step page when tour starts
  useEffect(() => {
    if (currentStep === 0) {
      // Add a delay to ensure authentication is fully loaded
      const timer = setTimeout(() => {
        // For the welcome step, navigate to the first actual feature page
        const firstFeatureStep = tourSteps.find(step => step.page !== "current");
        if (firstFeatureStep) {
          console.log("Guided tour navigating to:", firstFeatureStep.page);
          setLocation(firstFeatureStep.page);
        }
      }, 1000); // 1 second delay to ensure auth is ready
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Navigate to the next step's page
      const nextStepData = tourSteps[nextStep];
      if (nextStepData && nextStepData.page !== "current") {
        console.log("Guided tour navigating to next step:", nextStepData.page);
        setTimeout(() => {
          setLocation(nextStepData.page);
        }, 100);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    toast({
      title: "Tour Complete!",
      description: "You've successfully completed the demo tour. Continue exploring the features.",
    });
    onComplete();
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  const currentStepData = tourSteps[currentStep];
  const StepIcon = currentStepData.icon;

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white shadow-2xl">
          <CardHeader className="relative">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="text-sm">
                {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')} Demo
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTour}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-blue-100">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900">
                  {currentStepData.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Step {currentStep + 1} of {tourSteps.length}</span>
                <span>{currentStepData.duration}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Key Benefits
              </h4>
              <ul className="space-y-2">
                {currentStepData.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkipTour}
                  className="text-gray-500"
                >
                  Skip Tour
                </Button>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>
              
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Complete Tour
                    <CheckCircle className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    {currentStepData.actionText}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}