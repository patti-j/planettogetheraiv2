import { useState, useEffect, useMemo } from "react";
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
import { useLocation } from "wouter";
import {
  Factory, Users, BarChart3, Package, CheckCircle2, ArrowRight,
  Building, Target, Clock, Truck, Sparkles, Upload,
  Star, FileImage, TrendingUp, DollarSign, ShieldCheck,
  Plus, X, ChevronRight, Globe, Loader2, Search, MapPin, Trash2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Benefit {
  id: string;
  title: string;
  description: string;
  category: 'efficiency' | 'cost' | 'quality' | 'delivery' | 'capacity';
  estimatedValue: string;
  estimatedPercent: number;
  timeToValue: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  kpis: string[];
}

interface BusinessGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  targetValue: number;
  fromBenefit?: boolean;
}

const INDUSTRY_BENEFITS: Record<string, Benefit[]> = {
  'manufacturing': [
    {
      id: 'oee-improvement',
      title: 'Improve Overall Equipment Effectiveness (OEE)',
      description: 'Increase equipment utilization and reduce unplanned downtime through optimized scheduling',
      category: 'efficiency',
      estimatedValue: '$150K-$500K annually',
      estimatedPercent: 15,
      timeToValue: '3-6 months',
      icon: Factory,
      priority: 'high',
      kpis: ['OEE %', 'Equipment Uptime', 'MTBF']
    },
    {
      id: 'inventory-reduction',
      title: 'Reduce Work-in-Progress Inventory',
      description: 'Optimize production flow to minimize WIP and carrying costs',
      category: 'cost',
      estimatedValue: '$100K-$300K annually',
      estimatedPercent: 20,
      timeToValue: '6-9 months',
      icon: Package,
      priority: 'high',
      kpis: ['WIP Days', 'Inventory Turns', 'Carrying Cost']
    },
    {
      id: 'on-time-delivery',
      title: 'Improve On-Time Delivery Performance',
      description: 'Meet customer commitments consistently through accurate scheduling and capacity planning',
      category: 'delivery',
      estimatedValue: '$200K-$1M+ annually',
      estimatedPercent: 25,
      timeToValue: '3-6 months',
      icon: Truck,
      priority: 'high',
      kpis: ['On-Time Delivery %', 'Lead Time', 'Customer Satisfaction']
    },
    {
      id: 'setup-reduction',
      title: 'Reduce Setup/Changeover Time',
      description: 'Optimize job sequencing to minimize changeovers and setup time',
      category: 'efficiency',
      estimatedValue: '$75K-$200K annually',
      estimatedPercent: 30,
      timeToValue: '3-6 months',
      icon: Clock,
      priority: 'medium',
      kpis: ['Setup Time', 'Changeover Frequency', 'Batch Size Optimization']
    },
    {
      id: 'capacity-utilization',
      title: 'Maximize Capacity Utilization',
      description: 'Better balance workload across resources and identify bottlenecks',
      category: 'capacity',
      estimatedValue: '$100K-$400K annually',
      estimatedPercent: 18,
      timeToValue: '3-6 months',
      icon: BarChart3,
      priority: 'high',
      kpis: ['Capacity Utilization %', 'Bottleneck Throughput', 'Resource Balance']
    },
    {
      id: 'quality-improvement',
      title: 'Reduce Defects and Rework',
      description: 'Improve first-pass yield through better process control and traceability',
      category: 'quality',
      estimatedValue: '$50K-$150K annually',
      estimatedPercent: 15,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'medium',
      kpis: ['First Pass Yield', 'Scrap Rate', 'Rework Cost']
    }
  ],
  'automotive': [
    {
      id: 'jit-optimization',
      title: 'Optimize Just-in-Time Production',
      description: 'Achieve precise synchronization with customer demand and reduce buffer stock',
      category: 'efficiency',
      estimatedValue: '$500K-$2M annually',
      estimatedPercent: 25,
      timeToValue: '6-12 months',
      icon: Clock,
      priority: 'high',
      kpis: ['JIT Compliance', 'Buffer Stock Level', 'Production Sync Rate']
    },
    {
      id: 'line-balance',
      title: 'Improve Production Line Balance',
      description: 'Optimize workstation allocation and reduce bottlenecks across assembly lines',
      category: 'capacity',
      estimatedValue: '$300K-$1M annually',
      estimatedPercent: 20,
      timeToValue: '3-6 months',
      icon: BarChart3,
      priority: 'high',
      kpis: ['Line Balance Efficiency', 'Takt Time Adherence', 'Cycle Time Variance']
    },
    {
      id: 'supply-chain-sync',
      title: 'Synchronize Supply Chain',
      description: 'Coordinate with suppliers for timely material delivery and reduce shortages',
      category: 'delivery',
      estimatedValue: '$400K-$1.5M annually',
      estimatedPercent: 30,
      timeToValue: '6-9 months',
      icon: Truck,
      priority: 'high',
      kpis: ['Supplier On-Time %', 'Material Shortage Events', 'Supply Chain Lead Time']
    }
  ],
  'aerospace': [
    {
      id: 'compliance-tracking',
      title: 'Streamline Compliance & Traceability',
      description: 'Maintain complete audit trails and regulatory compliance documentation',
      category: 'quality',
      estimatedValue: '$200K-$800K annually',
      estimatedPercent: 35,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'high',
      kpis: ['Compliance Rate', 'Audit Findings', 'Documentation Accuracy']
    },
    {
      id: 'complex-scheduling',
      title: 'Optimize Complex Assembly Scheduling',
      description: 'Manage long lead times and complex BOMs with precision scheduling',
      category: 'efficiency',
      estimatedValue: '$500K-$2M annually',
      estimatedPercent: 20,
      timeToValue: '9-12 months',
      icon: Factory,
      priority: 'high',
      kpis: ['Schedule Adherence', 'Assembly Efficiency', 'Lead Time Reduction']
    }
  ],
  'pharmaceutical': [
    {
      id: 'batch-optimization',
      title: 'Optimize Batch Production',
      description: 'Improve batch scheduling and reduce campaign changeover times',
      category: 'efficiency',
      estimatedValue: '$300K-$1M annually',
      estimatedPercent: 22,
      timeToValue: '6-9 months',
      icon: Factory,
      priority: 'high',
      kpis: ['Batch Cycle Time', 'Campaign Efficiency', 'Changeover Time']
    },
    {
      id: 'gmp-compliance',
      title: 'Enhance GMP Compliance',
      description: 'Maintain rigorous quality standards and regulatory compliance',
      category: 'quality',
      estimatedValue: '$200K-$500K annually',
      estimatedPercent: 40,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'high',
      kpis: ['GMP Compliance Score', 'Quality Deviations', 'Audit Readiness']
    }
  ],
  'food_production': [
    {
      id: 'freshness-optimization',
      title: 'Optimize Production for Freshness',
      description: 'Schedule production to minimize shelf life impact and reduce waste',
      category: 'quality',
      estimatedValue: '$150K-$500K annually',
      estimatedPercent: 25,
      timeToValue: '3-6 months',
      icon: Clock,
      priority: 'high',
      kpis: ['Product Freshness', 'Waste Reduction', 'Shelf Life Optimization']
    },
    {
      id: 'sanitation-scheduling',
      title: 'Improve Sanitation Scheduling',
      description: 'Optimize cleaning schedules between product runs to maximize uptime',
      category: 'efficiency',
      estimatedValue: '$100K-$300K annually',
      estimatedPercent: 18,
      timeToValue: '3-6 months',
      icon: Factory,
      priority: 'medium',
      kpis: ['Sanitation Time', 'Uptime %', 'Cross-Contamination Events']
    }
  ],
  'beverage_production': [
    {
      id: 'batch-fermentation',
      title: 'Optimize Batch Fermentation',
      description: 'Improve fermentation scheduling for consistent quality and throughput',
      category: 'quality',
      estimatedValue: '$200K-$600K annually',
      estimatedPercent: 22,
      timeToValue: '3-6 months',
      icon: Clock,
      priority: 'high',
      kpis: ['Fermentation Yield', 'Batch Consistency', 'Tank Utilization']
    },
    {
      id: 'packaging-efficiency',
      title: 'Improve Packaging Line Efficiency',
      description: 'Reduce changeover times and increase packaging line throughput',
      category: 'efficiency',
      estimatedValue: '$150K-$400K annually',
      estimatedPercent: 20,
      timeToValue: '3-6 months',
      icon: Factory,
      priority: 'medium',
      kpis: ['Packaging OEE', 'Changeover Time', 'Line Availability']
    }
  ],
  'electronics': [
    {
      id: 'smt-optimization',
      title: 'Optimize SMT Line Efficiency',
      description: 'Maximize surface mount technology line throughput and reduce defects',
      category: 'efficiency',
      estimatedValue: '$200K-$600K annually',
      estimatedPercent: 20,
      timeToValue: '3-6 months',
      icon: Factory,
      priority: 'high',
      kpis: ['SMT Line OEE', 'First Pass Yield', 'Defect Rate']
    },
    {
      id: 'component-management',
      title: 'Improve Component Management',
      description: 'Reduce component shortages and optimize inventory levels',
      category: 'cost',
      estimatedValue: '$150K-$400K annually',
      estimatedPercent: 25,
      timeToValue: '6-9 months',
      icon: Package,
      priority: 'high',
      kpis: ['Component Availability', 'Inventory Turns', 'Shortage Events']
    }
  ]
};

const SIZE_MULTIPLIERS: Record<string, number> = {
  'small': 0.5,
  'medium': 1.0,
  'large': 2.0,
  'enterprise': 4.0
};

interface PlantInfo {
  id: string;
  name: string;
  location: string;
  plantType: string;
  employeeCount: string;
  mainProducts: string;
  currentChallenges: string;
  priority: 'high' | 'medium' | 'low';
}

const onboardingSteps = [
  {
    id: 'company-info',
    title: 'Company Info',
    description: 'Tell us about your company'
  },
  {
    id: 'roi-benefits',
    title: 'Benefits',
    description: 'See your potential ROI'
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Set your objectives'
  },
  {
    id: 'continue',
    title: 'Continue',
    description: 'Define requirements & features'
  }
];

const INDUSTRY_OPTIONS = [
  { value: 'manufacturing', label: 'General Manufacturing' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'aerospace', label: 'Aerospace' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'food_production', label: 'Food Production' },
  { value: 'beverage_production', label: 'Beverage Production' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'metals', label: 'Metals' },
  { value: 'textiles', label: 'Textiles' }
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industries: [] as string[],
    size: '',
    description: '',
    website: '',
    numberOfPlants: '',
    products: ''
  });
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [businessGoals, setBusinessGoals] = useState<BusinessGoal[]>([]);
  const [plants, setPlants] = useState<PlantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpWebsite, setIsLookingUpWebsite] = useState(false);
  const [isLookingUpPlants, setIsLookingUpPlants] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedIndustryTemplates, setSelectedIndustryTemplates] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if company already has onboarding in progress
  const { data: existingOnboarding, isLoading: onboardingLoading } = useQuery<CompanyOnboarding | null>({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch industry templates
  const { data: industryTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/industry-templates'],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // User preferences for cross-device company info sync
  const { data: userPreferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id
  });

  // Load company info from multiple sources
  useEffect(() => {
    const prefCompanyInfo = (userPreferences as any)?.companyInfo;
    if (prefCompanyInfo && Object.keys(prefCompanyInfo).some(key => prefCompanyInfo[key])) {
      setCompanyInfo(prefCompanyInfo);
      return;
    }
    
    try {
      const localStorageInfo = localStorage.getItem('onboarding-company-info');
      if (localStorageInfo) {
        const parsedInfo = JSON.parse(localStorageInfo);
        setCompanyInfo(parsedInfo);
      }
    } catch (error) {
      console.error('Failed to load company info from localStorage:', error);
    }
  }, [userPreferences]);

  // Mutation to update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (companyInfo: any) => {
      if (!user?.id) return;
      const currentPrefs = userPreferences || {};
      const updatedPrefs = { ...(currentPrefs as object), companyInfo };
      await apiRequest('PUT', `/api/user-preferences/${user.id}`, updatedPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
    }
  });

  const createOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/onboarding/initialize', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
    }
  });

  // Create business goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest('POST', '/api/business-goals', goalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('business-goals');
        }
      });
    }
  });

  // Website lookup function using AI
  const handleWebsiteLookup = async () => {
    if (!companyInfo.website) {
      toast({
        title: "Website Required",
        description: "Please enter a company website to look up.",
        variant: "destructive"
      });
      return;
    }

    setIsLookingUpWebsite(true);
    try {
      const response = await apiRequest('POST', '/api/company-lookup', { 
        website: companyInfo.website 
      });
      const data = await response.json();
      
      if (data.success && data.companyInfo) {
        // Handle industry from API - could be string or already parsed
        let newIndustries = companyInfo.industries || [];
        if (data.companyInfo.industry) {
          const apiIndustry = data.companyInfo.industry.toLowerCase().replace(/[^a-z_]/g, '_');
          const matchedIndustry = INDUSTRY_OPTIONS.find(o => 
            o.value === apiIndustry || o.label.toLowerCase() === data.companyInfo.industry.toLowerCase()
          );
          if (matchedIndustry && !newIndustries.includes(matchedIndustry.value)) {
            newIndustries = [...newIndustries, matchedIndustry.value];
          }
        }
        
        const newInfo = {
          ...companyInfo,
          name: data.companyInfo.name || companyInfo.name,
          industries: newIndustries.length > 0 ? newIndustries : companyInfo.industries,
          size: data.companyInfo.size || companyInfo.size,
          description: data.companyInfo.description || companyInfo.description,
          products: data.companyInfo.products || companyInfo.products,
          numberOfPlants: data.companyInfo.numberOfPlants || companyInfo.numberOfPlants
        };
        saveCompanyInfo(newInfo);
        
        toast({
          title: "Company Info Found",
          description: `Found information for ${data.companyInfo.name || 'your company'}. Please review and adjust as needed.`
        });
      } else {
        toast({
          title: "Limited Info Found",
          description: data.message || "Could not find detailed company information. Please fill in manually.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Website lookup error:', error);
      toast({
        title: "Lookup Failed",
        description: "Could not retrieve company information. Please fill in manually.",
        variant: "destructive"
      });
    } finally {
      setIsLookingUpWebsite(false);
    }
  };

  // Plant lookup function using AI
  const handlePlantLookup = async () => {
    if (!companyInfo.website) {
      toast({
        title: "Website Required",
        description: "Please enter a company website in the Company Info step first.",
        variant: "destructive"
      });
      return;
    }

    setIsLookingUpPlants(true);
    try {
      const response = await apiRequest('POST', '/api/plants-lookup', { 
        website: companyInfo.website,
        companyName: companyInfo.name,
        industry: companyInfo.industries?.join(', ') || 'manufacturing',
        numberOfPlants: companyInfo.numberOfPlants || '3'
      });
      const data = await response.json();
      
      if (data.success && data.plants && data.plants.length > 0) {
        // Transform AI plants to match our PlantInfo format
        const newPlants: PlantInfo[] = data.plants.map((plant: any, index: number) => ({
          id: `plant-${Date.now()}-${index}`,
          name: plant.name || `Plant ${index + 1}`,
          location: plant.location || '',
          plantType: plant.plantType || 'discrete',
          employeeCount: plant.employeeCount || '',
          mainProducts: plant.mainProducts || '',
          currentChallenges: plant.currentChallenges || '',
          priority: plant.priority || (index === 0 ? 'high' : 'medium')
        }));
        
        setPlants(newPlants);
        
        toast({
          title: "Plants Auto-Filled",
          description: `Found ${newPlants.length} plant${newPlants.length !== 1 ? 's' : ''} for ${companyInfo.name || 'your company'}. Please review and adjust as needed.`
        });
      } else {
        toast({
          title: "Limited Info Found",
          description: data.message || "Could not find detailed plant information. Please add plants manually.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Plant lookup error:', error);
      toast({
        title: "Lookup Failed",
        description: "Could not retrieve plant information. Please add plants manually.",
        variant: "destructive"
      });
    } finally {
      setIsLookingUpPlants(false);
    }
  };

  // Map industry values to templates
  const industryToTemplateMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (Array.isArray(industryTemplates)) {
      industryTemplates.forEach((template: any) => {
        const category = template.category || template.targetIndustry;
        if (!map[category]) map[category] = [];
        map[category].push(template);
      });
    }
    return map;
  }, [industryTemplates]);

  const hasTemplatesForIndustry = (industry: string) => {
    return !!(industryToTemplateMap[industry]?.length > 0);
  };

  // Get benefits based on company info (combining benefits from all selected industries)
  const benefits = useMemo(() => {
    const industries = companyInfo.industries?.length > 0 ? companyInfo.industries : ['manufacturing'];
    const sizeMultiplier = SIZE_MULTIPLIERS[companyInfo.size] || 1.0;
    const plantMultiplier = Math.max(1, parseInt(companyInfo.numberOfPlants) || 1);
    
    // Collect unique benefits from all selected industries
    const benefitMap = new Map<string, Benefit>();
    industries.forEach(industry => {
      const industryBenefits = INDUSTRY_BENEFITS[industry] || [];
      industryBenefits.forEach(benefit => {
        if (!benefitMap.has(benefit.id)) {
          benefitMap.set(benefit.id, benefit);
        }
      });
    });
    
    // Also add general manufacturing benefits if not already included
    if (!industries.includes('manufacturing')) {
      INDUSTRY_BENEFITS['manufacturing']?.forEach(benefit => {
        if (!benefitMap.has(benefit.id)) {
          benefitMap.set(benefit.id, benefit);
        }
      });
    }
    
    return Array.from(benefitMap.values()).map(benefit => ({
      ...benefit,
      estimatedValue: scaleEstimatedValue(benefit.estimatedValue, sizeMultiplier * plantMultiplier)
    }));
  }, [companyInfo.industries, companyInfo.size, companyInfo.numberOfPlants]);

  const saveCompanyInfo = (newInfo: any) => {
    setCompanyInfo(newInfo);
    try {
      localStorage.setItem('onboarding-company-info', JSON.stringify(newInfo));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
    if (user?.id) {
      updatePreferencesMutation.mutate(newInfo);
    }
  };

  const handleIndustryToggle = (value: string) => {
    const currentIndustries = companyInfo.industries || [];
    const newIndustries = currentIndustries.includes(value)
      ? currentIndustries.filter(i => i !== value)
      : [...currentIndustries, value];
    
    const newInfo = {...companyInfo, industries: newIndustries};
    saveCompanyInfo(newInfo);
    
    // Show templates dialog if newly selected industry has templates
    if (!currentIndustries.includes(value)) {
      const templatesForIndustry = industryToTemplateMap[value];
      if (templatesForIndustry?.length > 0) {
        setSelectedIndustryTemplates(templatesForIndustry);
        setTemplateDialogOpen(true);
      }
    }
  };

  const handleBenefitToggle = (benefitId: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefitId) 
        ? prev.filter(id => id !== benefitId)
        : [...prev, benefitId]
    );
  };

  const handleAddCustomGoal = () => {
    const newGoal: BusinessGoal = {
      id: `custom-goal-${Date.now()}`,
      title: '',
      description: '',
      category: 'efficiency',
      priority: 'medium',
      targetValue: 10,
      fromBenefit: false
    };
    setBusinessGoals(prev => [...prev, newGoal]);
  };

  const handleRemoveGoal = (goalId: string) => {
    setBusinessGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleGoalChange = (goalId: string, field: string, value: any) => {
    setBusinessGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, [field]: value } : g
    ));
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    
    try {
      if (currentStep === 0 && companyInfo.name && companyInfo.industries?.length > 0) {
        await createOnboardingMutation.mutateAsync({
          companyName: companyInfo.name,
          industry: companyInfo.industries.join(', '),
          size: companyInfo.size,
          description: companyInfo.description
        });
      }

      // Auto-transfer selected benefits to goals when moving from Benefits to Goals step
      if (currentStep === 1 && selectedBenefits.length > 0) {
        const selectedBenefitObjects = benefits.filter(b => selectedBenefits.includes(b.id));
        const newGoals: BusinessGoal[] = selectedBenefitObjects.map(benefit => ({
          id: `goal-${benefit.id}`,
          title: benefit.title,
          description: `${benefit.description}\n\nEstimated Value: ${benefit.estimatedValue || 'TBD'}\nTime to Value: ${benefit.timeToValue || 'TBD'}\nRelated KPIs: ${(benefit.kpis || []).join(', ')}`,
          category: benefit.category,
          priority: benefit.priority,
          targetValue: benefit.estimatedPercent || 10,
          fromBenefit: true
        }));
        
        setBusinessGoals(prev => [...prev, ...newGoals]);
        setSelectedBenefits([]);
        
        if (newGoals.length > 0) {
          toast({
            title: 'Benefits added as goals',
            description: `${newGoals.length} benefit${newGoals.length !== 1 ? 's' : ''} added to your business goals.`
          });
        }
      }

      if (currentStep === 2 && businessGoals.length > 0) {
        // Save business goals to database
        for (const goal of businessGoals) {
          if (goal.title) {
            const now = new Date();
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + 6);
            
            await createGoalMutation.mutateAsync({
              goalTitle: goal.title,
              goalDescription: goal.description,
              goalType: 'operational',
              priority: goal.priority,
              category: goal.category,
              targetValue: goal.targetValue.toString(),
              targetUnit: '%',
              status: 'not_started',
              startDate: now.toISOString(),
              targetDate: targetDate.toISOString()
            });
          }
        }
        
        toast({
          title: 'Goals saved',
          description: `${businessGoals.filter(g => g.title).length} business goal${businessGoals.length !== 1 ? 's' : ''} saved successfully.`
        });
      }

      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
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

  const handleContinueToImplementation = () => {
    setLocation('/company-onboarding-overview');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return companyInfo.name && companyInfo.industries && companyInfo.industries.length > 0;
      case 1:
        return true; // Can proceed even without selecting benefits
      case 2:
        return true; // Can proceed even without goals
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Plant management functions
  const handleAddPlant = () => {
    const plantCount = parseInt(companyInfo.numberOfPlants) || 1;
    const newPlant: PlantInfo = {
      id: `plant-${Date.now()}`,
      name: `Plant ${plants.length + 1}`,
      location: '',
      plantType: 'discrete',
      employeeCount: '',
      mainProducts: '',
      currentChallenges: '',
      priority: plants.length === 0 ? 'high' : 'medium'
    };
    setPlants(prev => [...prev, newPlant]);
  };

  const handleRemovePlant = (plantId: string) => {
    setPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const handlePlantChange = (plantId: string, field: keyof PlantInfo, value: string) => {
    setPlants(prev => prev.map(p => 
      p.id === plantId ? { ...p, [field]: value } : p
    ));
  };

  const progressPercentage = ((currentStep + 1) / onboardingSteps.length) * 100;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'efficiency': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'cost': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'quality': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'delivery': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'capacity': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to PlanetTogether
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Let's set up your manufacturing optimization in a few simple steps
            </p>
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
                    className={cn(
                      "truncate px-1",
                      index <= currentStep ? 'text-blue-600 font-medium' : ''
                    )}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 1: Company Information */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6" />
                Company Information
              </CardTitle>
              <CardDescription>
                Tell us about your company so we can customize your experience and show relevant ROI projections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Website Lookup Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">AI-Powered Company Lookup</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Enter your company website and we'll automatically detect your industry, size, and recommend relevant benefits.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={companyInfo.website}
                      onChange={(e) => saveCompanyInfo({...companyInfo, website: e.target.value})}
                      placeholder="https://yourcompany.com"
                      className="pl-10"
                      data-testid="input-company-website"
                    />
                  </div>
                  <Button
                    onClick={handleWebsiteLookup}
                    disabled={isLookingUpWebsite || !companyInfo.website}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-lookup-website"
                  >
                    {isLookingUpWebsite ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Lookup
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => saveCompanyInfo({...companyInfo, name: e.target.value})}
                    placeholder="Enter your company name"
                    data-testid="input-company-name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Industries * (select one or more)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {INDUSTRY_OPTIONS.map(option => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                          companyInfo.industries?.includes(option.value)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                        )}
                        onClick={() => handleIndustryToggle(option.value)}
                        data-testid={`checkbox-industry-${option.value}`}
                      >
                        <Checkbox
                          checked={companyInfo.industries?.includes(option.value) || false}
                          onCheckedChange={() => handleIndustryToggle(option.value)}
                        />
                        <span className="text-sm">{option.label}</span>
                        {hasTemplatesForIndustry(option.value) && companyInfo.industries?.includes(option.value) && (
                          <Star className="w-3 h-3 text-blue-600 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                  {companyInfo.industries?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {companyInfo.industries.map(i => INDUSTRY_OPTIONS.find(o => o.value === i)?.label).join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <Select 
                    value={companyInfo.size}
                    onValueChange={(value) => saveCompanyInfo({...companyInfo, size: value})}
                  >
                    <SelectTrigger data-testid="select-company-size">
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
                  <label className="block text-sm font-medium mb-2">Number of Plants</label>
                  <Input
                    type="number"
                    min="1"
                    value={companyInfo.numberOfPlants}
                    onChange={(e) => saveCompanyInfo({...companyInfo, numberOfPlants: e.target.value})}
                    placeholder="Enter number of plants"
                    data-testid="input-number-plants"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Main Products (Optional)</label>
                <Textarea
                  value={companyInfo.products}
                  onChange={(e) => saveCompanyInfo({...companyInfo, products: e.target.value})}
                  placeholder="Describe your main products..."
                  className="min-h-[80px]"
                  data-testid="textarea-products"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: ROI/Benefits */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Expected Benefits & ROI
              </CardTitle>
              <CardDescription>
                Based on your {companyInfo.industries?.length > 0 ? companyInfo.industries.map(i => INDUSTRY_OPTIONS.find(o => o.value === i)?.label).join(', ') : 'industry'} profile, here are the typical benefits you can expect
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">15-25%</div>
                  <div className="text-sm text-blue-700">Productivity Gain</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">15-30%</div>
                  <div className="text-sm text-green-700">Inventory Reduction</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <Truck className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">+20-30%</div>
                  <div className="text-sm text-orange-700">On-Time Delivery</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">3-6 mo</div>
                  <div className="text-sm text-purple-700">Time to Value</div>
                </div>
              </div>

              {/* Benefits list */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Select benefits to add as business goals</h3>
                  {selectedBenefits.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedBenefits.length} selected
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                        selectedBenefits.includes(benefit.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => handleBenefitToggle(benefit.id)}
                      data-testid={`benefit-card-${benefit.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedBenefits.includes(benefit.id)}
                          onCheckedChange={() => handleBenefitToggle(benefit.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <benefit.icon className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium">{benefit.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{benefit.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getCategoryColor(benefit.category)}>
                              {benefit.category}
                            </Badge>
                            <Badge className={getPriorityColor(benefit.priority)}>
                              {benefit.priority} priority
                            </Badge>
                            <Badge variant="outline">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {benefit.estimatedValue}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {benefit.timeToValue}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Goals */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Your Business Goals
              </CardTitle>
              <CardDescription>
                Review the goals derived from benefits and add any additional custom goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {businessGoals.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No goals defined yet</p>
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-go-back-benefits"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      Add from Benefits
                    </Button>
                    <Button onClick={handleAddCustomGoal} data-testid="button-add-custom-goal">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Goal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {businessGoals.map((goal) => (
                      <Card key={goal.id} className={cn(
                        "border",
                        goal.fromBenefit ? "border-blue-200 bg-blue-50/50" : "border-gray-200"
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              {goal.fromBenefit && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  From Benefits
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveGoal(goal.id)}
                              data-testid={`button-remove-goal-${goal.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Goal Title</label>
                              <Input
                                value={goal.title}
                                onChange={(e) => handleGoalChange(goal.id, 'title', e.target.value)}
                                placeholder="Enter goal title"
                                data-testid={`input-goal-title-${goal.id}`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <Select
                                  value={goal.category}
                                  onValueChange={(value) => handleGoalChange(goal.id, 'category', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="efficiency">Efficiency</SelectItem>
                                    <SelectItem value="cost">Cost</SelectItem>
                                    <SelectItem value="quality">Quality</SelectItem>
                                    <SelectItem value="delivery">Delivery</SelectItem>
                                    <SelectItem value="capacity">Capacity</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <Select
                                  value={goal.priority}
                                  onValueChange={(value) => handleGoalChange(goal.id, 'priority', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-1">Description</label>
                              <Textarea
                                value={goal.description}
                                onChange={(e) => handleGoalChange(goal.id, 'description', e.target.value)}
                                placeholder="Describe the goal..."
                                rows={2}
                                data-testid={`textarea-goal-description-${goal.id}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button variant="outline" onClick={handleAddCustomGoal} className="w-full" data-testid="button-add-another-goal">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Goal
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Continue to Implementation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Great Progress!</CardTitle>
              <CardDescription className="text-lg">
                You've completed the initial setup. Now let's define your detailed requirements and select features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">What you've accomplished:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Company profile: <strong>{companyInfo.name}</strong> ({companyInfo.industries?.map(i => INDUSTRY_OPTIONS.find(o => o.value === i)?.label).join(', ') || 'Manufacturing'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Reviewed industry-specific ROI projections</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Defined {businessGoals.length} business goal{businessGoals.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Next steps in the Implementation Hub:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <span>Define detailed manufacturing requirements</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span>Select and configure features</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                    <span>Set up data connections and imports</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                    <span>Track implementation milestones</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleContinueToImplementation}
                  className="px-8"
                  data-testid="button-continue-implementation"
                >
                  Continue to Implementation Hub
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            data-testid="button-previous-step"
          >
            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={handleNextStep}
              disabled={!canProceed() || isLoading}
              data-testid="button-next-step"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleContinueToImplementation}
              data-testid="button-finish-onboarding"
            >
              Continue to Onboarding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Industry Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Industry Templates Available</DialogTitle>
            <DialogDescription>
              We found templates specifically designed for your industry. Would you like to apply one?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedIndustryTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileImage className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Skip for Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function scaleEstimatedValue(baseValue: string, multiplier: number): string {
  const match = baseValue.match(/\$(\d+)K?-?\$?(\d+)?([KM])?/i);
  if (!match) return baseValue;
  
  let low = parseInt(match[1]) * (match[3]?.toUpperCase() === 'M' ? 1000 : 1);
  let high = match[2] ? parseInt(match[2]) * (match[3]?.toUpperCase() === 'M' ? 1000 : 1) : low * 2;
  
  low = Math.round(low * multiplier);
  high = Math.round(high * multiplier);
  
  const formatValue = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}M`;
    return `$${val}K`;
  };
  
  return `${formatValue(low)}-${formatValue(high)} annually`;
}
