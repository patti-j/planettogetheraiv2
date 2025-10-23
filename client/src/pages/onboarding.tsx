import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useTour } from "@/contexts/TourContext";
import { WelcomeOverview } from "@/components/welcome-overview";
import {
  Factory, Users, BarChart3, Package, Settings, CheckCircle2, ArrowRight,
  Building, Target, Calendar, Truck, Wrench, Bot, Sparkles, Upload,
  PlayCircle, BookOpen, Lightbulb, ChevronRight, Clock, Award, TrendingUp, ClipboardList,
  Star, FileImage, Info, X, Zap
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
    name: 'Schedule Optimization',
    description: 'Plan and schedule your production operations with drag-and-drop Gantt charts',
    icon: BarChart3,
    complexity: 'beginner',
    prerequisites: [],
    estimatedSetupTime: '15-30 minutes',
    dataRequirements: ['Production Orders', 'Resources', 'Operations', 'Plants', 'Capabilities'],
    benefits: ['Visual production timeline', 'Resource optimization', 'Delivery planning'],
    isSelected: false
  },
  {
    id: 'theory-of-constraints',
    name: 'Theory of Constraints (TOC)',
    description: 'Identify and manage production bottlenecks with drum-buffer-rope methodology',
    icon: Target,
    complexity: 'beginner',
    prerequisites: [],
    estimatedSetupTime: '10-20 minutes',
    dataRequirements: ['Resources', 'Operations', 'Production Orders'],
    benefits: ['Bottleneck identification', 'Throughput optimization', 'Buffer management'],
    isSelected: false
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Optimization',
    description: 'Plan and forecast production capacity across your facilities and resources',
    icon: TrendingUp,
    complexity: 'intermediate',
    prerequisites: ['production-scheduling'],
    estimatedSetupTime: '20-35 minutes',
    dataRequirements: ['Resources', 'Production Orders', 'Historical Data'],
    benefits: ['Capacity optimization', 'Demand forecasting', 'Resource planning'],
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
    id: 'production-planning',
    name: 'Production Plan Optimization',
    description: 'Create and manage production plans, targets, and milestones',
    icon: ClipboardList,
    complexity: 'intermediate',
    prerequisites: ['production-scheduling'],
    estimatedSetupTime: '25-40 minutes',
    dataRequirements: ['Production Plans', 'Production Targets', 'Milestones'],
    benefits: ['Strategic planning', 'Target tracking', 'Milestone management'],
    isSelected: false
  },
  {
    id: 'maintenance-management',
    name: 'Maintenance Planning',
    description: 'Schedule preventive maintenance and track equipment health',
    icon: Wrench,
    complexity: 'intermediate',
    prerequisites: ['production-scheduling'],
    estimatedSetupTime: '25-40 minutes',
    dataRequirements: ['Maintenance Schedules', 'Equipment History'],
    benefits: ['Uptime improvement', 'Cost control', 'Predictive maintenance'],
    isSelected: false
  },
  {
    id: 'ai-optimization',
    name: 'AI Optimization',
    description: 'Leverage artificial intelligence for automated optimization and insights',
    icon: Bot,
    complexity: 'advanced',
    prerequisites: ['production-scheduling', 'capacity-planning'],
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
    id: 'business-goals',
    title: 'Business Goals Setup',
    description: 'Define strategic objectives to guide feature prioritization and optimization',
    isCompleted: false,
    isSkippable: false
  },
  {
    id: 'feature-selection',
    title: 'Feature Selection',
    description: 'Choose the manufacturing features aligned with your business goals',
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
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const stepParam = urlParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 0;
  
  console.log('Onboarding URL parsing:', { location, stepParam, initialStep });
  
  const [currentStep, setCurrentStep] = useState(Math.max(0, Math.min(initialStep, 7)));
  const [showWelcomeOverview, setShowWelcomeOverview] = useState(true);

  // Update step when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const stepParam = urlParams.get('step');
    if (stepParam) {
      const newStep = Math.max(0, Math.min(parseInt(stepParam, 10), 6));
      console.log('URL step parameter changed, setting step to:', newStep);
      setCurrentStep(newStep);
    }
  }, [location]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    size: '',
    description: '',
    website: '',
    numberOfPlants: '',
    products: ''
  });
  const [businessGoals, setBusinessGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedIndustryTemplates, setSelectedIndustryTemplates] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startTour } = useTour();

  // Check if company already has onboarding in progress
  const { data: existingOnboarding, isLoading: onboardingLoading } = useQuery<CompanyOnboarding | null>({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // Initialize selected features from existing onboarding data
  useEffect(() => {
    if (existingOnboarding?.selectedFeatures) {
      setSelectedFeatures(existingOnboarding.selectedFeatures);
      console.log('Loaded selected features from database:', existingOnboarding.selectedFeatures);
    }
  }, [existingOnboarding]);

  // Handle starting tour for a specific feature
  const handleStartTour = async (module: FeatureModule) => {
    try {
      // Map feature modules to role IDs that best represent their functionality
      const featureToRoleMap: { [key: string]: number } = {
        'production-scheduling': 1, // Production Scheduler role
        'capacity-planning': 1,     // Production Scheduler role  
        'ai-optimization': 1,       // Production Scheduler role
        'supply-chain': 2,          // Supply Chain Manager role
        'maintenance-management': 6, // Maintenance Manager role
        'quality-control': 7,       // Quality Manager role
        'shop-floor': 5,            // Shop Floor Operator role
      };

      const roleId = featureToRoleMap[module.id] || 1; // Default to Production Scheduler
      
      console.log(`Starting tour for feature "${module.name}" with role ID: ${roleId}`);
      
      await startTour(roleId, false, 'training');
      
      toast({
        title: "Tour Started!",
        description: `Starting interactive tour for ${module.name}`,
      });
      
    } catch (error) {
      console.error('Error starting tour:', error);
      toast({
        title: "Error",
        description: "Failed to start tour. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch available industry templates
  const { data: industryTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/industry-templates'],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // Map industry values to available templates
  const industryToTemplateMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    console.log('Building industry template map from:', industryTemplates);
    if (Array.isArray(industryTemplates)) {
      industryTemplates.forEach((template: any) => {
        const category = template.category || template.targetIndustry;
        if (!map[category]) {
          map[category] = [];
        }
        map[category].push(template);
      });
    }
    console.log('Industry template map created:', map);
    return map;
  }, [industryTemplates]);

  // Function to check if industry has templates
  const hasTemplatesForIndustry = (industry: string) => {
    return !!(industryToTemplateMap[industry] && industryToTemplateMap[industry].length > 0);
  };

  // User preferences for cross-device company info sync
  const { data: userPreferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id
  });

  // Load company info from multiple sources with priority: database > localStorage
  useEffect(() => {
    // First, try to load from database (user preferences)
    const companyInfo = (userPreferences as any)?.companyInfo;
    if (companyInfo && Object.keys(companyInfo).some(key => companyInfo[key])) {
      console.log('Loading company info from database:', companyInfo);
      setCompanyInfo(companyInfo);
      return;
    }
    
    // Fallback to localStorage if database is empty
    try {
      const localStorageInfo = localStorage.getItem('onboarding-company-info');
      if (localStorageInfo) {
        const parsedInfo = JSON.parse(localStorageInfo);
        console.log('Loading company info from localStorage:', parsedInfo);
        setCompanyInfo(parsedInfo);
        
        // If user is authenticated, sync localStorage data to database
        if (user?.id && parsedInfo && Object.keys(parsedInfo).some(key => parsedInfo[key])) {
          console.log('Syncing localStorage data to database');
          updatePreferencesMutation.mutate(parsedInfo);
        }
      }
    } catch (error) {
      console.error('Failed to load company info from localStorage:', error);
    }
  }, [userPreferences, user?.id]);

  // Mutation to update user preferences with company info
  const updatePreferencesMutation = useMutation({
    mutationFn: async (companyInfo: any) => {
      if (!user?.id) {
        console.error('No user ID available for preferences update');
        return;
      }
      
      const currentPrefs = userPreferences || {};
      const updatedPrefs = {
        ...(currentPrefs as object),
        companyInfo: companyInfo
      };
      
      console.log('Updating user preferences with company info:', companyInfo);
      await apiRequest('PUT', `/api/user-preferences/${user.id}`, updatedPrefs);
    },
    onSuccess: () => {
      console.log('User preferences updated successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
    },
    onError: (error) => {
      console.error('Failed to update user preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save company information. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating onboarding with data:', data);
      const response = await apiRequest('POST', '/api/onboarding/initialize', data);
      const result = await response.json();
      console.log('Onboarding creation response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Onboarding creation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
      // Removed annoying "Onboarding Started" toast notification
    },
    onError: (error) => {
      console.error('Onboarding creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to initialize onboarding. Please try again.",
        variant: "destructive"
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

  // Mutation to apply industry template
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('POST', `/api/industry-templates/${templateId}/apply`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Applied",
        description: "Industry template has been applied to your system configuration."
      });
      setTemplateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/industry-templates'] });
    },
    onError: (error) => {
      console.error('Failed to apply template:', error);
      toast({
        title: "Error",
        description: "Failed to apply industry template. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Helper function to save company info with dual persistence
  const saveCompanyInfo = (newInfo: any) => {
    console.log('Saving company info:', newInfo);
    setCompanyInfo(newInfo);
    
    // Always save to localStorage for immediate persistence
    try {
      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
    
    // Save to database for authenticated users
    if (user?.id) {
      updatePreferencesMutation.mutate(newInfo);
    }
  };

  // Adjust progress for welcome overview
  const totalSteps = showWelcomeOverview ? onboardingSteps.length + 1 : onboardingSteps.length;
  const adjustedStep = showWelcomeOverview ? currentStep : currentStep - 1;
  const progressPercentage = ((adjustedStep + 1) / totalSteps) * 100;

  const handleFeatureToggle = (featureId: string) => {
    console.log('Feature toggle clicked:', featureId);
    setSelectedFeatures(prev => {
      const newFeatures = prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId];
      console.log('Selected features updated from', prev, 'to', newFeatures);
      return newFeatures;
    });
  }

  // Handle industry selection with template checking
  const handleIndustryChange = (value: string) => {
    console.log('Industry changed to:', value);
    const newInfo = {...companyInfo, industry: value};
    saveCompanyInfo(newInfo);
    
    // Check if this industry has templates and show dialog
    const templatesForIndustry = industryToTemplateMap[value];
    console.log('Templates for industry:', value, templatesForIndustry);
    
    if (templatesForIndustry && templatesForIndustry.length > 0) {
      console.log('Setting templates and opening dialog:', templatesForIndustry);
      setSelectedIndustryTemplates(templatesForIndustry);
      setTemplateDialogOpen(true);
      console.log('Template dialog should be open now');
    } else {
      console.log('No templates found for industry:', value);
    }
  };

  const handleNextStep = async () => {
    console.log('handleNextStep called - currentStep:', currentStep);
    console.log('Company info:', companyInfo);
    console.log('Selected features:', selectedFeatures);
    console.log('Can proceed?', canProceed());
    
    setIsLoading(true);
    
    try {
      if (currentStep === 0 && companyInfo.name && companyInfo.industry) {
        console.log('Initializing company onboarding...');
        // Initialize company onboarding
        await createOnboardingMutation.mutateAsync({
          companyName: companyInfo.name,
          industry: companyInfo.industry,
          size: companyInfo.size,
          description: companyInfo.description
        });
        console.log('Company onboarding initialized successfully');
      }

      if (currentStep === 1 && businessGoals.length > 0) {
        console.log('Business goals defined for step 1:', businessGoals);
        // Save business goals would be implemented here
      }

      if (currentStep === 2 && selectedFeatures.length > 0) {
        // Save selected features to main onboarding record
        console.log('Selected features for step 1:', selectedFeatures);
        try {
          if (existingOnboarding?.id) {
            console.log('Updating onboarding record with features:', selectedFeatures);
            
            const updateData = {
              selectedFeatures: selectedFeatures,
              currentStep: 'features-selected'
            };
            console.log('Sending update data:', updateData);
            
            // Update the main onboarding record with selected features using apiRequest
            const response = await apiRequest('PUT', `/api/onboarding/company/${existingOnboarding.id}`, updateData);
            console.log('API response:', response);
            
            console.log('Onboarding record updated successfully');
            
            // Invalidate cache to reload onboarding data
            queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
          } else {
            console.error('No existing onboarding found - cannot update features');
          }
        } catch (error) {
          console.error('Progress save failed:', error);
          // Show user feedback about the error but don't block progression
          toast({
            title: "Warning",
            description: "Failed to save selected features, but you can continue.",
            variant: "default"
          });
        }
      }

      if (currentStep < onboardingSteps.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
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
    }
  };

  const handleStartOver = async () => {
    // Reset onboarding state to beginning
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
    
    // Reset database onboarding completion status
    if (existingOnboarding?.id) {
      try {
        await apiRequest('PUT', `/api/onboarding/company/${existingOnboarding.id}`, {
          isCompleted: false,
          currentStep: 'company-info',
          selectedFeatures: []
        });
        
        // Clear localStorage
        localStorage.removeItem('onboarding-company-info');
        
        // Refresh onboarding data
        queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
        
        toast({
          title: "Onboarding Reset",
          description: "Starting fresh with the onboarding process."
        });
      } catch (error) {
        console.error('Failed to reset onboarding:', error);
      }
    }
  };

  const getSelectedFeatureModules = () => {
    return featureModules.filter(module => selectedFeatures.includes(module.id));
  };

  const canProceed = () => {
    // Adjusted for the new welcome overview step
    const adjustedStep = showWelcomeOverview ? currentStep : currentStep - 1;
    switch (adjustedStep) {
      case 0:
        return true; // Welcome overview
      case 1:
        return companyInfo.name && companyInfo.industry;
      case 2:
        return businessGoals.length > 0;
      case 3:
        return selectedFeatures.length > 0;
      case 4:
        return true; // Data setup has its own validation
      default:
        return true;
    }
  };

  // Check if device is mobile based on window width
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile(); // Check on mount
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);



  // Show loading state briefly while essential data is loading
  if (onboardingLoading && user && !existingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  // Show welcome overview for new users
  if (showWelcomeOverview && currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <WelcomeOverview 
          onComplete={() => {
            setShowWelcomeOverview(false);
            setCurrentStep(1);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to PlanetTogether
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
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
          
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="mb-4" />
              <div className="flex justify-between text-xs text-gray-500 flex-wrap gap-1">
                {onboardingSteps.map((step, index) => (
                  <span 
                    key={step.id}
                    className={`${index <= currentStep ? 'text-blue-600 font-medium' : ''} truncate`}
                  >
                    {isMobile ? step.title.split(' ')[0] : step.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6" />
                Company Information
              </CardTitle>
              <CardDescription>
                Tell us about your company so we can customize your experience
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  // Fill in test data
                  const testData = {
                    name: 'Acme Manufacturing Corp',
                    industry: 'pharmaceutical',
                    size: '100-500',
                    description: 'Leading pharmaceutical manufacturer specializing in generic drugs and innovative formulations',
                    website: 'https://acme-pharma.com',
                    numberOfPlants: '5',
                    products: 'Tablets, Capsules, Injectables, Suspensions, APIs'
                  };
                  saveCompanyInfo(testData);
                  
                  // Pre-select features for testing
                  setSelectedFeatures([
                    'production-planning',
                    'inventory-management',
                    'quality-control',
                    'supply-chain',
                    'ai-optimization'
                  ]);
                  
                  toast({
                    title: "Test Data Filled",
                    description: "Test company information has been populated. You can modify it as needed.",
                  });
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Fill Test Data
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => {
                      const newInfo = {...companyInfo, name: e.target.value};
                      saveCompanyInfo(newInfo);
                    }}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry *</label>
                  <Select 
                    value={companyInfo.industry}
                    onValueChange={handleIndustryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automotive">
                        <div className="flex items-center justify-between w-full">
                          Automotive
                          {hasTemplatesForIndustry("automotive") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="aerospace">
                        <div className="flex items-center justify-between w-full">
                          Aerospace
                          {hasTemplatesForIndustry("aerospace") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="electronics">
                        <div className="flex items-center justify-between w-full">
                          Electronics
                          {hasTemplatesForIndustry("electronics") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="pharmaceutical">
                        <div className="flex items-center justify-between w-full">
                          Pharmaceutical
                          {hasTemplatesForIndustry("pharmaceutical") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="food_beverage">
                        <div className="flex items-center justify-between w-full">
                          Food & Beverage
                          {hasTemplatesForIndustry("food_beverage") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="textiles">
                        <div className="flex items-center justify-between w-full">
                          Textiles
                          {hasTemplatesForIndustry("textiles") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="chemicals">
                        <div className="flex items-center justify-between w-full">
                          Chemicals
                          {hasTemplatesForIndustry("chemicals") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="metals">
                        <div className="flex items-center justify-between w-full">
                          Metals
                          {hasTemplatesForIndustry("metals") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="manufacturing">
                        <div className="flex items-center justify-between w-full">
                          General Manufacturing
                          {hasTemplatesForIndustry("manufacturing") && (
                            <FileImage className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {companyInfo.industry && hasTemplatesForIndustry(companyInfo.industry) && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <Star className="w-4 h-4" />
                      Industry templates available for this selection
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <Select 
                    value={companyInfo.size}
                    onValueChange={(value) => {
                      const newInfo = {...companyInfo, size: value};
                      saveCompanyInfo(newInfo);
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
                      saveCompanyInfo(newInfo);
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
                      saveCompanyInfo(newInfo);
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
                    saveCompanyInfo(newInfo);
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
                    saveCompanyInfo(newInfo);
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

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Define Your Business Goals
              </CardTitle>
              <CardDescription>
                Set strategic objectives that will guide feature prioritization and optimization algorithms. 
                These goals help determine which manufacturing capabilities to implement first and how to optimize your operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Why Business Goals Matter</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• <strong>Feature Prioritization:</strong> Determines which manufacturing features to implement first</li>
                        <li>• <strong>Algorithm Selection:</strong> Guides optimization approaches (efficiency vs. quality vs. throughput)</li>
                        <li>• <strong>KPI Alignment:</strong> Links performance metrics to strategic objectives</li>
                        <li>• <strong>Resource Allocation:</strong> Optimizes investment in equipment and personnel</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Your Strategic Objectives</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBusinessGoals([...businessGoals, { 
                        title: '', 
                        category: 'operational-efficiency', 
                        description: '', 
                        priority: 'medium',
                        timeframe: '3-6-months'
                      }])}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Add Goal
                    </Button>
                  </div>

                  {businessGoals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Business Goals Defined</p>
                      <p className="text-sm">Add your first strategic objective to guide system optimization</p>
                    </div>
                  )}

                  {businessGoals.map((goal, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Input
                              placeholder="Goal title (e.g., Reduce production lead time by 20%)"
                              value={goal.title}
                              onChange={(e) => {
                                const updatedGoals = [...businessGoals];
                                updatedGoals[index].title = e.target.value;
                                setBusinessGoals(updatedGoals);
                              }}
                            />
                            <Select
                              value={goal.category}
                              onValueChange={(value) => {
                                const updatedGoals = [...businessGoals];
                                updatedGoals[index].category = value;
                                setBusinessGoals(updatedGoals);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="operational-efficiency">Operational Efficiency</SelectItem>
                                <SelectItem value="quality-improvement">Quality Improvement</SelectItem>
                                <SelectItem value="cost-reduction">Cost Reduction</SelectItem>
                                <SelectItem value="capacity-expansion">Capacity Expansion</SelectItem>
                                <SelectItem value="customer-satisfaction">Customer Satisfaction</SelectItem>
                                <SelectItem value="sustainability">Sustainability</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Select
                              value={goal.priority}
                              onValueChange={(value) => {
                                const updatedGoals = [...businessGoals];
                                updatedGoals[index].priority = value;
                                setBusinessGoals(updatedGoals);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="medium">Medium Priority</SelectItem>
                                <SelectItem value="low">Low Priority</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={goal.timeframe}
                              onValueChange={(value) => {
                                const updatedGoals = [...businessGoals];
                                updatedGoals[index].timeframe = value;
                                setBusinessGoals(updatedGoals);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate (0-3 months)</SelectItem>
                                <SelectItem value="3-6-months">Short-term (3-6 months)</SelectItem>
                                <SelectItem value="6-12-months">Medium-term (6-12 months)</SelectItem>
                                <SelectItem value="12-months-plus">Long-term (12+ months)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Textarea
                              placeholder="Describe the goal and expected impact on your manufacturing operations..."
                              value={goal.description}
                              onChange={(e) => {
                                const updatedGoals = [...businessGoals];
                                updatedGoals[index].description = e.target.value;
                                setBusinessGoals(updatedGoals);
                              }}
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedGoals = businessGoals.filter((_, i) => i !== index);
                              setBusinessGoals(updatedGoals);
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {businessGoals.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Impact on System Configuration</h4>
                        <div className="text-sm text-green-700 mt-2 space-y-1">
                          <p><strong>Goals defined:</strong> {businessGoals.length}</p>
                          <p><strong>High priority goals:</strong> {businessGoals.filter(g => g.priority === 'high').length}</p>
                          <p><strong>Next step:</strong> Features will be recommended based on your {businessGoals.filter(g => g.priority === 'high').length > 0 ? 'high-priority' : 'defined'} objectives</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Choose Your Features
              </CardTitle>
              <CardDescription>
                Select the manufacturing features aligned with your business goals. You can always add more later.
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

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Data Setup
              </CardTitle>
              <CardDescription>
                Set up your manufacturing data to get started with production scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Get Started</h3>
                  <p className="text-sm text-gray-600">
                    You have three options for setting up your data: <strong>manually enter</strong> information directly, <strong>import</strong> from existing files (Excel, CSV), or <strong>connect through integrations</strong> with your ERP systems. You can also generate AI-powered sample data to get started quickly.
                  </p>
                  <Link href="/data-import">
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Go to Master Data Import
                    </Button>
                  </Link>
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

        {currentStep === 5 && (
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartTour(module)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Tour
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && (
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
                      <p className="text-sm text-gray-600">View schedules and update production order status</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 7 && (
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
                <Link href="/production-scheduler">
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

      {/* Template Suggestion Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={(open) => {
        console.log('Template dialog onOpenChange called with:', open);
        setTemplateDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-blue-600" />
              Industry Templates Available
            </DialogTitle>
            <DialogDescription>
              We found {selectedIndustryTemplates.length} industry template{selectedIndustryTemplates.length > 1 ? 's' : ''} that match your industry selection. These templates can help you get started faster with pre-configured settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedIndustryTemplates.map((template, index) => (
              <div key={template.id || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    
                    {template.features && template.features.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Includes:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.features.slice(0, 3).map((feature: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {feature}
                            </span>
                          ))}
                          {template.features.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{template.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => applyTemplateMutation.mutate(template.id)}
                    disabled={applyTemplateMutation.isPending}
                    size="sm"
                    className="ml-4"
                  >
                    {applyTemplateMutation.isPending ? "Applying..." : "Apply"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              You can always change or modify templates later from the Industry Templates page in System Administration.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}