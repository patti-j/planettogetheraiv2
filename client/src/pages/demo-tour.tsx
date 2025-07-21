import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Factory, 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings, 
  ChevronRight, 
  Play, 
  Eye,
  Target,
  BarChart3,
  Smartphone,
  Building,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Info,
  Server,
  Wrench
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: any;
  duration: string;
  valueProposition: string;
  highlights: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  icon: any;
  primaryColor: string;
  steps: TourStep[];
}

export default function DemoTour() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourStarted, setTourStarted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const roles: Role[] = [
    {
      id: "director",
      name: "Director/Executive",
      description: "CEO, COO, Plant Director - Strategic oversight and business performance",
      icon: TrendingUp,
      primaryColor: "blue",
      steps: [
        {
          id: "business-goals",
          title: "Strategic Business Goals Dashboard",
          description: "See how PlanetTogether aligns production with business objectives",
          route: "/business-goals",
          icon: TrendingUp,
          duration: "3 min",
          valueProposition: "Track KPIs, monitor progress, and ensure production supports strategic goals",
          highlights: ["Real-time KPI tracking", "Goal progress monitoring", "Risk assessment", "Strategic alignment"]
        },
        {
          id: "analytics",
          title: "Executive Analytics & Reporting",
          description: "Comprehensive insights into production performance and efficiency",
          route: "/analytics",
          icon: BarChart3,
          duration: "4 min",
          valueProposition: "Make data-driven decisions with comprehensive production analytics",
          highlights: ["Performance dashboards", "Trend analysis", "ROI tracking", "Operational insights"]
        }
      ]
    },
    {
      id: "plant-manager",
      name: "Plant Manager",
      description: "Operations Manager, Plant Director - Facility oversight and capacity management",
      icon: Building,
      primaryColor: "purple",
      steps: [
        {
          id: "plant-manager",
          title: "Comprehensive Plant Operations",
          description: "Oversee entire plant operations from a single dashboard",
          route: "/plant-manager",
          icon: Building,
          duration: "4 min",
          valueProposition: "Gain complete visibility into plant performance and resource utilization",
          highlights: ["Plant-wide metrics", "Resource utilization", "Performance tracking", "Operational insights"]
        },
        {
          id: "capacity-planning",
          title: "Strategic Capacity Planning",
          description: "Plan future capacity needs and optimize resource allocation",
          route: "/capacity-planning",
          icon: TrendingUp,
          duration: "4 min",
          valueProposition: "Optimize capacity utilization and plan for future growth",
          highlights: ["Capacity analysis", "Future planning", "Resource optimization", "Growth projections"]
        }
      ]
    },
    {
      id: "production-scheduler",
      name: "Production Scheduler",
      description: "Production Planner, Scheduler - Daily scheduling and resource optimization",
      icon: Calendar,
      primaryColor: "green",
      steps: [
        {
          id: "schedule",
          title: "Intelligent Production Scheduling",
          description: "Experience drag-and-drop scheduling with AI optimization",
          route: "/",
          icon: Calendar,
          duration: "5 min",
          valueProposition: "Reduce scheduling time by 70% while improving on-time delivery",
          highlights: ["Visual Gantt charts", "Drag-and-drop operations", "Resource optimization", "Real-time updates"]
        },
        {
          id: "optimize-orders",
          title: "AI-Powered Order Optimization",
          description: "Let AI suggest optimal scheduling strategies for complex orders",
          route: "/scheduling-optimizer",
          icon: Target,
          duration: "4 min",
          valueProposition: "Increase efficiency by 25% with intelligent scheduling recommendations",
          highlights: ["Multi-strategy optimization", "Cost analysis", "Delivery optimization", "Resource balancing"]
        },
        {
          id: "shop-floor",
          title: "Mobile Shop Floor Management",
          description: "Real-time production monitoring on mobile devices",
          route: "/shop-floor",
          icon: Smartphone,
          duration: "3 min",
          valueProposition: "Stay connected to production anywhere with mobile-optimized interfaces",
          highlights: ["Mobile responsiveness", "Real-time updates", "Quick status changes", "Production metrics"]
        }
      ]
    },
    {
      id: "it-administrator",
      name: "IT Administrator",
      description: "IT Manager, System Administrator - System configuration and user management",
      icon: Settings,
      primaryColor: "orange",
      steps: [
        {
          id: "systems-management",
          title: "System Administration",
          description: "Configure system settings and monitor performance",
          route: "/systems-management",
          icon: Settings,
          duration: "3 min",
          valueProposition: "Easy system configuration with comprehensive monitoring and control",
          highlights: ["System monitoring", "Configuration management", "Performance tracking", "Security controls"]
        },
        {
          id: "role-management",
          title: "Role & Permission Management",
          description: "Set up users, roles, and permissions for your organization",
          route: "/role-management",
          icon: Users,
          duration: "3 min",
          valueProposition: "Flexible role-based access control tailored to your organization",
          highlights: ["Custom roles", "Granular permissions", "User management", "Security compliance"]
        }
      ]
    },
    {
      id: "systems-manager",
      name: "Systems Manager",
      description: "IT systems oversight, security management, and infrastructure monitoring",
      icon: Server,
      primaryColor: "indigo",
      steps: [
        {
          id: "systems-management",
          title: "System Configuration & Monitoring",
          description: "Configure system settings and monitor infrastructure health",
          route: "/systems-management",
          icon: Settings,
          duration: "4 min",
          valueProposition: "Maintain system reliability and performance with comprehensive monitoring",
          highlights: ["System health monitoring", "Configuration management", "Performance analytics", "Security controls"]
        }
      ]
    },
    {
      id: "administrator",
      name: "Administrator",
      description: "Full system access with all permissions across all features",
      icon: Users,
      primaryColor: "red",
      steps: [
        {
          id: "role-management",
          title: "Role & Permission Management",
          description: "Set up users, roles, and permissions for your organization",
          route: "/role-management",
          icon: Users,
          duration: "3 min",
          valueProposition: "Flexible role-based access control tailored to your organization",
          highlights: ["Custom roles", "Granular permissions", "User management", "Security compliance"]
        },
        {
          id: "systems-management",
          title: "System Administration",
          description: "Complete system configuration and monitoring capabilities",
          route: "/systems-management",
          icon: Settings,
          duration: "4 min",
          valueProposition: "Full administrative control over all system functions",
          highlights: ["Full system access", "Advanced configuration", "User administration", "System monitoring"]
        }
      ]
    },
    {
      id: "shop-floor-operations",
      name: "Shop Floor Operations",
      description: "Shop floor supervision with operator oversight and maintenance coordination",
      icon: Factory,
      primaryColor: "yellow",
      steps: [
        {
          id: "shop-floor",
          title: "Shop Floor Operations Management",
          description: "Real-time shop floor monitoring and operator coordination",
          route: "/shop-floor",
          icon: Smartphone,
          duration: "3 min",
          valueProposition: "Coordinate shop floor activities with real-time visibility",
          highlights: ["Real-time monitoring", "Operator coordination", "Production tracking", "Issue management"]
        },
        {
          id: "operator-dashboard",
          title: "Operator Dashboard Management",
          description: "Oversee operator activities and task assignments",
          route: "/operator-dashboard",
          icon: Users,
          duration: "3 min",
          valueProposition: "Manage operator workflows and task assignments effectively",
          highlights: ["Task management", "Resource assignments", "Performance tracking", "Communication tools"]
        }
      ]
    },
    {
      id: "data-analyst",
      name: "Data Analyst",
      description: "Production data analysis and reporting specialist",
      icon: BarChart3,
      primaryColor: "teal",
      steps: [
        {
          id: "analytics",
          title: "Production Analytics & Insights",
          description: "Analyze production data and generate insights",
          route: "/analytics",
          icon: BarChart3,
          duration: "4 min",
          valueProposition: "Transform production data into actionable business insights",
          highlights: ["Data visualization", "Trend analysis", "Performance metrics", "Predictive analytics"]
        },
        {
          id: "reports-analysis",
          title: "Advanced Reporting & Analysis",
          description: "Create comprehensive reports and data analysis",
          route: "/reports",
          icon: BarChart3,
          duration: "4 min",
          valueProposition: "Generate detailed reports for data-driven decision making",
          highlights: ["Custom reports", "Statistical analysis", "Data visualization", "Export capabilities"]
        }
      ]
    },
    {
      id: "trainer",
      name: "Trainer",
      description: "Training coordination and demonstration management",
      icon: GraduationCap,
      primaryColor: "pink",
      steps: [
        {
          id: "training",
          title: "Training & Demonstration Management",
          description: "Coordinate training programs and system demonstrations",
          route: "/training",
          icon: GraduationCap,
          duration: "3 min",
          valueProposition: "Manage comprehensive training programs and role demonstrations",
          highlights: ["Training modules", "Role demonstrations", "User onboarding", "System tutorials"]
        },
        {
          id: "role-switching",
          title: "Role Switching & Demonstrations",
          description: "Switch between different roles for training purposes",
          route: "/training",
          icon: Users,
          duration: "4 min",
          valueProposition: "Demonstrate system capabilities across all user roles",
          highlights: ["Role switching", "Live demonstrations", "Feature showcasing", "Training scenarios"]
        }
      ]
    },
    {
      id: "maintenance-technician",
      name: "Maintenance Technician",
      description: "Equipment maintenance with work order and scheduling access",
      icon: Wrench,
      primaryColor: "gray",
      steps: [
        {
          id: "maintenance-planning",
          title: "Maintenance Planning & Scheduling",
          description: "Plan and schedule equipment maintenance activities",
          route: "/maintenance-planning",
          icon: Wrench,
          duration: "4 min",
          valueProposition: "Ensure equipment reliability through proactive maintenance planning",
          highlights: ["Maintenance scheduling", "Work order management", "Resource planning", "Performance tracking"]
        }
      ]
    }
  ];

  const startTour = async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    
    try {
      // Authenticate as demo user for the selected role
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to start demo");
      }

      const data = await response.json();
      
      // Store demo token in localStorage
      localStorage.setItem("authToken", data.token);
      
      toast({
        title: "Demo Started!",
        description: `Welcome to PlanetTogether! You're now exploring as a ${data.user.role}.`,
      });

      setShowRoleSelection(false);
      setTourStarted(true);
      setCurrentStep(0);
      
      // Get first step route
      const role = roles.find(r => r.id === selectedRole);
      
      if (role?.steps[0]) {
        setLocation(role.steps[0].route);
      }
    } catch (error) {
      console.error("Demo login error:", error);
      toast({
        title: "Demo Error",
        description: "Failed to start demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (!role) return;

    const currentRoleStep = currentStep < role.steps.length ? role.steps[currentStep] : null;
    if (currentRoleStep) {
      setCompletedSteps(prev => [...prev, currentRoleStep.id]);
    }

    const allSteps = [
      ...role.steps,
      ...additionalRoles.flatMap(roleId => roles.find(r => r.id === roleId)?.steps || [])
    ];

    if (currentStep < allSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      setLocation(allSteps[nextStepIndex].route);
    } else {
      // Tour completed
      setTourStarted(false);
      setShowRoleSelection(true);
    }
  };

  const getCurrentStep = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (!role) return null;

    const allSteps = [
      ...role.steps,
      ...additionalRoles.flatMap(roleId => roles.find(r => r.id === roleId)?.steps || [])
    ];

    return allSteps[currentStep];
  };

  const getTotalSteps = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (!role) return 0;

    return role.steps.length + additionalRoles.reduce((total, roleId) => {
      const additionalRole = roles.find(r => r.id === roleId);
      return total + (additionalRole?.steps.length || 0);
    }, 0);
  };

  if (!showRoleSelection && tourStarted) {
    const currentStepData = getCurrentStep();
    const totalSteps = getTotalSteps();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
        <Card className="w-96 mt-4 mr-4 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                Step {currentStep + 1} of {totalSteps}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTourStarted(false);
                  setShowRoleSelection(true);
                }}
              >
                Exit Tour
              </Button>
            </div>
            {currentStepData && (
              <>
                <div className="flex items-center gap-2">
                  <currentStepData.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                </div>
                <CardDescription>{currentStepData.description}</CardDescription>
              </>
            )}
          </CardHeader>
          {currentStepData && (
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Value:</strong> {currentStepData.valueProposition}
                </AlertDescription>
              </Alert>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
                <ul className="space-y-1">
                  {currentStepData.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">
                  Estimated time: {currentStepData.duration}
                </span>
                <Button onClick={nextStep} className="flex items-center gap-2">
                  {currentStep < totalSteps - 1 ? "Next Step" : "Complete Tour"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Factory className="text-primary mr-3" size={40} />
            <h1 className="text-4xl font-bold text-gray-800">PlanetTogether Demo Tour</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">AI-powered production scheduling platform</p>
          <p className="text-gray-500">
            Experience how PlanetTogether transforms manufacturing operations for your specific role
          </p>
        </div>

        <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to PlanetTogether!</DialogTitle>
              <DialogDescription className="text-lg">
                Let's customize your demo experience. Select your primary role and any additional roles you'd like to explore.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pr-2">
              {/* Primary Role Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">What's your primary role?</h3>
                <div className="grid gap-4">
                  {roles.map((role) => (
                    <Card 
                      key={role.id} 
                      className={`cursor-pointer transition-all ${
                        selectedRole === role.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <role.icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{role.name}</h4>
                            <p className="text-gray-600 mb-2">{role.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{role.steps.length} tour stops</span>
                              <span>•</span>
                              <span>{role.steps.reduce((total, step) => total + parseInt(step.duration), 0)} min total</span>
                            </div>
                          </div>
                          {selectedRole === role.id && (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Roles */}
              {selectedRole && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Would you like to see features for other roles too?
                  </h3>
                  <div className="grid gap-3">
                    {roles.filter(role => role.id !== selectedRole).map((role) => (
                      <div key={role.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={role.id}
                          checked={additionalRoles.includes(role.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAdditionalRoles(prev => [...prev, role.id]);
                            } else {
                              setAdditionalRoles(prev => prev.filter(id => id !== role.id));
                            }
                          }}
                        />
                        <label htmlFor={role.id} className="flex items-center gap-3 cursor-pointer flex-1">
                          <role.icon className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{role.name}</span>
                          <span className="text-sm text-gray-500">
                            (+{role.steps.length} stops, {role.steps.reduce((total, step) => total + parseInt(step.duration), 0)} min)
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tour Summary */}
              {selectedRole && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Your Personalized Tour:</h4>
                  <div className="text-sm text-gray-700">
                    <p>• {getTotalSteps()} total stops</p>
                    <p>• Approximately {
                      (roles.find(r => r.id === selectedRole)?.steps.reduce((total, step) => total + parseInt(step.duration), 0) || 0) +
                      additionalRoles.reduce((total, roleId) => {
                        const role = roles.find(r => r.id === roleId);
                        return total + (role?.steps.reduce((stepTotal, step) => stepTotal + parseInt(step.duration), 0) || 0);
                      }, 0)
                    } minutes</p>
                    <p>• Interactive demonstrations with real features</p>
                    <p>• Learn key benefits for your specific role</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={startTour}
                  disabled={!selectedRole || isLoading}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  {isLoading ? "Starting Demo..." : "Start Demo Tour"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}