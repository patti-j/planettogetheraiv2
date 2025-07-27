import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Factory, Users, BarChart3, Package, Settings, CheckCircle2, ArrowRight,
  Building, Target, Calendar, Truck, Wrench, Brain, Sparkles, Upload,
  PlayCircle, BookOpen, Lightbulb, ChevronRight, Clock, Award
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isSkippable: boolean;
}

interface FeatureModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  estimatedSetupTime: string;
  dataRequirements: string[];
  benefits: string[];
  isSelected: boolean;
}

interface CompanyOnboarding {
  id: number;
  companyName: string;
  industry: string;
  size: string;
  currentStep: string;
  completedSteps: string[];
  selectedFeatures: string[];
  teamMembers: number;
  isCompleted: boolean;
  createdAt: string;
}

const featureModules: FeatureModule[] = [
  {
    id: 'production-scheduling',
    name: 'Production Scheduling',
    description: 'Plan and schedule your production operations with drag-and-drop Gantt charts',
    icon: BarChart3,
    complexity: 'beginner',
    prerequisites: [],
    estimatedSetupTime: '15-30 minutes',
    dataRequirements: ['Jobs', 'Resources', 'Operations'],
    benefits: ['Visual production timeline', 'Resource optimization', 'Delivery planning'],
    isSelected: false
  },
  {
    id: 'resource-management',
    name: 'Resource Management',
    description: 'Manage your equipment, personnel, and facilities with capability tracking',
    icon: Factory,
    complexity: 'beginner',
    prerequisites: [],
    estimatedSetupTime: '10-20 minutes',
    dataRequirements: ['Resources', 'Capabilities'],
    benefits: ['Asset tracking', 'Skill management', 'Utilization monitoring'],
    isSelected: false
  },
  {
    id: 'inventory-optimization',
    name: 'Inventory Management',
    description: 'Track materials, optimize stock levels, and manage supply chain',
    icon: Package,
    complexity: 'intermediate',
    prerequisites: ['production-scheduling'],
    estimatedSetupTime: '30-45 minutes',
    dataRequirements: ['Inventory Items', 'Suppliers', 'Demand Forecasts'],
    benefits: ['Stock optimization', 'Cost reduction', 'Supply planning'],
    isSelected: false
  },
  {
    id: 'quality-management',
    name: 'Quality Control',
    description: 'Monitor quality metrics and manage inspection processes',
    icon: Award,
    complexity: 'intermediate',
    prerequisites: ['production-scheduling'],
    estimatedSetupTime: '20-35 minutes',
    dataRequirements: ['Quality Standards', 'Inspection Points'],
    benefits: ['Quality tracking', 'Defect reduction', 'Compliance'],
    isSelected: false
  },
  {
    id: 'maintenance-management',
    name: 'Maintenance Planning',
    description: 'Schedule preventive maintenance and track equipment health',
    icon: Wrench,
    complexity: 'intermediate',
    prerequisites: ['resource-management'],
    estimatedSetupTime: '25-40 minutes',
    dataRequirements: ['Maintenance Schedules', 'Equipment History'],
    benefits: ['Uptime improvement', 'Cost control', 'Predictive maintenance'],
    isSelected: false
  },
  {
    id: 'ai-optimization',
    name: 'AI Optimization',
    description: 'Leverage artificial intelligence for automated optimization and insights',
    icon: Brain,
    complexity: 'advanced',
    prerequisites: ['production-scheduling', 'resource-management'],
    estimatedSetupTime: '45-60 minutes',
    dataRequirements: ['Historical Data', 'Performance Metrics'],
    benefits: ['Automated optimization', 'Predictive analytics', 'Intelligent recommendations'],
    isSelected: false
  }
];

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome & Company Setup',
    description: 'Basic company information and team setup',
    isCompleted: false,
    isSkippable: false
  },
  {
    id: 'feature-selection',
    title: 'Feature Selection',
    description: 'Choose the manufacturing features you want to use',
    isCompleted: false,
    isSkippable: false
  },
  {
    id: 'data-setup',
    title: 'Data Setup',
    description: 'Import or create your initial data',
    isCompleted: false,
    isSkippable: false
  },
  {
    id: 'guided-tour',
    title: 'Guided Tour',
    description: 'Learn how to use your selected features',
    isCompleted: false,
    isSkippable: true
  },
  {
    id: 'team-collaboration',
    title: 'Team Setup',
    description: 'Invite team members and set up roles',
    isCompleted: false,
    isSkippable: true
  },
  {
    id: 'completion',
    title: 'Ready to Go!',
    description: 'Your system is configured and ready for production use',
    isCompleted: false,
    isSkippable: false
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(() => {
    // Load from localStorage or start at 0
    const saved = localStorage.getItem('onboarding-current-step');
    return saved ? parseInt(saved) : 0;
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('onboarding-selected-features');
    return saved ? JSON.parse(saved) : [];
  });
  const [companyInfo, setCompanyInfo] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('onboarding-company-info');
    return saved ? JSON.parse(saved) : {
      name: '',
      industry: '',
      size: '',
      description: '',
      website: '',
      numberOfPlants: '',
      products: ''
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if company already has onboarding in progress
  const { data: existingOnboarding } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user
  }) as { data: CompanyOnboarding | undefined };

  const createOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/onboarding/initialize', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
      toast({
        title: "Onboarding Started",
        description: "Your company onboarding has been initialized.",
      });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      // First get the onboarding to get the company onboarding ID
      const userId = user?.id;
      if (!userId) throw new Error("User not authenticated");
      
      const response = await apiRequest('POST', '/api/onboarding/progress', {
        userId,
        companyOnboardingId: existingOnboarding?.id || 1, // Use existing or fallback
        step: data.step,
        status: 'completed',
        data: data.data || {}
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
    }
  });

  const progressPercentage = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleFeatureToggle = (featureId: string) => {
    console.log('Feature toggle clicked:', featureId);
    setSelectedFeatures(prev => {
      const newFeatures = prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId];
      console.log('Selected features updated from', prev, 'to', newFeatures);
      // Save to localStorage
      localStorage.setItem('onboarding-selected-features', JSON.stringify(newFeatures));
      return newFeatures;
    });
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    
    try {
      if (currentStep === 0 && companyInfo.name && companyInfo.industry) {
        // Initialize company onboarding
        await createOnboardingMutation.mutateAsync({
          companyName: companyInfo.name,
          industry: companyInfo.industry,
          size: companyInfo.size,
          description: companyInfo.description
        });
      }

      if (currentStep === 1 && selectedFeatures.length > 0) {
        // Save selected features locally for now to avoid API issues
        console.log('Selected features for step 1:', selectedFeatures);
        // Optional: Save to backend if onboarding exists
        try {
          if (existingOnboarding?.id) {
            await updateProgressMutation.mutateAsync({
              step: 'feature-selection',
              data: { selectedFeatures }
            });
          }
        } catch (error) {
          console.log('Progress save failed, continuing anyway:', error);
          // Continue without blocking the user
        }
      }

      if (currentStep < onboardingSteps.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        // Save progress to localStorage
        localStorage.setItem('onboarding-current-step', nextStep.toString());
      }
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipStep = () => {
    if (onboardingSteps[currentStep].isSkippable && currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      localStorage.setItem('onboarding-current-step', nextStep.toString());
    }
  };

  const handleStartOver = () => {
    // Clear all localStorage data and restart
    localStorage.removeItem('onboarding-current-step');
    localStorage.removeItem('onboarding-selected-features');
    localStorage.removeItem('onboarding-company-info');
    setCurrentStep(0);
    setSelectedFeatures([]);
    setCompanyInfo({
      name: '',
      industry: '',
      size: '',
      description: '',
      website: '',
      numberOfPlants: '',
      products: ''
    });
  };

  const getSelectedFeatureModules = () => {
    return featureModules.filter(module => selectedFeatures.includes(module.id));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return companyInfo.name && companyInfo.industry;
      case 1:
        return selectedFeatures.length > 0;
      case 2:
        return true; // Data setup has its own validation
      default:
        return true;
    }
  };

  if (existingOnboarding?.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Welcome Back!</CardTitle>
              <CardDescription>
                Your company onboarding is complete. Ready to get to work?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/production-schedule">
                <Button size="lg" className="mr-4">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="outline" size="lg">
                  Review Setup
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to PlanetTogether
            </h1>
            <p className="text-lg text-gray-600">
              Let's get your manufacturing operations set up in just a few simple steps
            </p>
            
            {/* Show resume progress message if we're continuing from a saved state */}
            {currentStep > 0 && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg inline-block">
                <p className="text-sm text-blue-800">
                  📋 Continuing from step {currentStep + 1}: {onboardingSteps[currentStep].title}
                  <button 
                    onClick={handleStartOver}
                    className="ml-2 text-blue-600 underline hover:text-blue-800"
                  >
                    Start over from beginning
                  </button>
                </p>
              </div>
            )}
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="mb-4" />
              <div className="flex justify-between text-xs text-gray-500">
                {onboardingSteps.map((step, index) => (
                  <span 
                    key={step.id}
                    className={`${index <= currentStep ? 'text-blue-600 font-medium' : ''}`}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6" />
                Company Information
              </CardTitle>
              <CardDescription>
                Tell us about your company so we can customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => {
                      const newInfo = {...companyInfo, name: e.target.value};
                      setCompanyInfo(newInfo);
                      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                    }}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry *</label>
                  <Select 
                    value={companyInfo.industry}
                    onValueChange={(value) => {
                      const newInfo = {...companyInfo, industry: value};
                      setCompanyInfo(newInfo);
                      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="aerospace">Aerospace</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                      <SelectItem value="textiles">Textiles</SelectItem>
                      <SelectItem value="chemicals">Chemicals</SelectItem>
                      <SelectItem value="metals">Metals</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <Select 
                    value={companyInfo.size}
                    onValueChange={(value) => {
                      const newInfo = {...companyInfo, size: value};
                      setCompanyInfo(newInfo);
                      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                      <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website (Optional)</label>
                  <Input
                    value={companyInfo.website}
                    onChange={(e) => {
                      const newInfo = {...companyInfo, website: e.target.value};
                      setCompanyInfo(newInfo);
                      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                    }}
                    placeholder="https://www.yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Plants</label>
                  <Input
                    type="number"
                    min="1"
                    value={companyInfo.numberOfPlants}
                    onChange={(e) => {
                      const newInfo = {...companyInfo, numberOfPlants: e.target.value};
                      setCompanyInfo(newInfo);
                      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                    }}
                    placeholder="Enter number of manufacturing plants"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Main Products</label>
                <Textarea
                  value={companyInfo.products}
                  onChange={(e) => {
                    const newInfo = {...companyInfo, products: e.target.value};
                    setCompanyInfo(newInfo);
                    localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                  }}
                  placeholder="Describe your main products and the basic production process of how you make them (e.g., materials used, key manufacturing steps, assembly processes)..."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Brief Description (Optional)</label>
                <Textarea
                  value={companyInfo.description}
                  onChange={(e) => {
                    const newInfo = {...companyInfo, description: e.target.value};
                    setCompanyInfo(newInfo);
                    localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
                  }}
                  placeholder="Tell us a bit about what you manufacture..."
                  className="min-h-[100px]"
                />
              </div>
              
              {existingOnboarding && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Team Onboarding</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your company already has {existingOnboarding.teamMembers} team member(s) who have started the setup process. 
                        You'll be joining their configuration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Choose Your Features
              </CardTitle>
              <CardDescription>
                Select the manufacturing features that match your current needs. You can always add more later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureModules.map((module) => (
                  <div
                    key={module.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedFeatures.includes(module.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFeatureToggle(module.id)}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedFeatures.includes(module.id)}
                        onCheckedChange={(checked) => {
                          // Prevent double-firing from card click and checkbox click
                          if (checked !== selectedFeatures.includes(module.id)) {
                            handleFeatureToggle(module.id);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <module.icon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold">{module.name}</h3>
                          <Badge variant={module.complexity === 'beginner' ? 'default' : module.complexity === 'intermediate' ? 'secondary' : 'destructive'}>
                            {module.complexity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Setup time: {module.estimatedSetupTime}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {module.benefits.map((benefit, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedFeatures.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Selected Features Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Features selected: {selectedFeatures.length}</p>
                      <p className="text-sm text-green-700">
                        Estimated setup time: {
                          getSelectedFeatureModules()
                            .reduce((total, module) => {
                              const time = parseInt(module.estimatedSetupTime.split('-')[1]);
                              return total + time;
                            }, 0)
                        } minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">
                        Data requirements: {
                          Array.from(new Set(
                            getSelectedFeatureModules()
                              .flatMap(module => module.dataRequirements)
                          )).join(', ')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Data Setup
              </CardTitle>
              <CardDescription>
                Import your existing data or start with sample data to get going quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Start Options</h3>
                  <Link href="/data-import">
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Import My Data
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Sample Data Loaded",
                        description: "Your system is now populated with sample data to explore.",
                      });
                    }}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Use Sample Data
                  </Button>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Required Data for Your Features</h3>
                  <div className="space-y-2">
                    {Array.from(new Set(getSelectedFeatureModules().flatMap(module => module.dataRequirements))).map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-6 h-6" />
                Interactive Guided Tour
              </CardTitle>
              <CardDescription>
                Take a personalized tour of your selected features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getSelectedFeatureModules().map((module) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <module.icon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{module.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Tour
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Team Setup
              </CardTitle>
              <CardDescription>
                Invite team members and set up user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Invite Team Members</h3>
                  <div className="space-y-3">
                    <Input placeholder="Enter email address" />
                    <Button variant="outline">
                      Send Invitation
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Quick Role Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium">Production Manager</h4>
                      <p className="text-sm text-gray-600">Full access to scheduling and resources</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium">Operator</h4>
                      <p className="text-sm text-gray-600">View schedules and update job status</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>
                Your manufacturing system is configured and ready for production use
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Production Dashboard</h4>
                  <p className="text-sm text-gray-600">Start scheduling your operations</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Help Center</h4>
                  <p className="text-sm text-gray-600">Get support when you need it</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">AI Assistant</h4>
                  <p className="text-sm text-gray-600">Get intelligent recommendations</p>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Link href="/production-schedule">
                  <Button size="lg">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Help
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {onboardingSteps[currentStep].isSkippable && (
              <Button variant="ghost" onClick={handleSkipStep}>
                Skip Step
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              disabled={!canProceed() || isLoading || createOnboardingMutation.isPending || updateProgressMutation.isPending}
              className={currentStep === onboardingSteps.length - 1 ? "hidden" : ""}
            >
              {(isLoading || createOnboardingMutation.isPending || updateProgressMutation.isPending) ? "Processing..." : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}