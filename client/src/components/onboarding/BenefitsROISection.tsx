import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, DollarSign, Clock, Target, CheckCircle2, ArrowRight,
  Factory, Package, Users, BarChart3, Sparkles, Zap, ShieldCheck,
  Truck, Wrench, ChevronRight, Calculator, PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  relatedFeatures: string[];
  kpis: string[];
}

interface ROIMetric {
  label: string;
  value: string;
  improvement: string;
  icon: any;
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
      relatedFeatures: ['production-scheduling', 'maintenance-management'],
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
      relatedFeatures: ['inventory-optimization', 'production-scheduling'],
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
      relatedFeatures: ['production-scheduling', 'capacity-planning'],
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
      relatedFeatures: ['production-scheduling', 'ai-optimization'],
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
      relatedFeatures: ['capacity-planning', 'theory-of-constraints'],
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
      relatedFeatures: ['quality-control', 'production-scheduling'],
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
      estimatedPercent: 20,
      timeToValue: '6-9 months',
      icon: Zap,
      priority: 'high',
      relatedFeatures: ['production-scheduling', 'inventory-optimization'],
      kpis: ['JIT Adherence', 'Buffer Days', 'Line Stoppages']
    },
    {
      id: 'line-efficiency',
      title: 'Improve Assembly Line Efficiency',
      description: 'Balance line operations and reduce takt time variability',
      category: 'efficiency',
      estimatedValue: '$300K-$1M annually',
      estimatedPercent: 15,
      timeToValue: '3-6 months',
      icon: Factory,
      priority: 'high',
      relatedFeatures: ['production-scheduling', 'capacity-planning'],
      kpis: ['Line Efficiency', 'Takt Time', 'Balance Loss']
    },
    {
      id: 'supplier-sync',
      title: 'Improve Supplier Synchronization',
      description: 'Better coordinate with suppliers to reduce stockouts and expediting costs',
      category: 'delivery',
      estimatedValue: '$200K-$500K annually',
      estimatedPercent: 25,
      timeToValue: '6-12 months',
      icon: Truck,
      priority: 'high',
      relatedFeatures: ['supply-chain', 'inventory-optimization'],
      kpis: ['Supplier OTD', 'Expediting Cost', 'Stockout Rate']
    },
    {
      id: 'quality-ppm',
      title: 'Reduce Quality PPM',
      description: 'Decrease parts per million defects through improved process control',
      category: 'quality',
      estimatedValue: '$100K-$500K annually',
      estimatedPercent: 30,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'high',
      relatedFeatures: ['quality-control', 'production-scheduling'],
      kpis: ['PPM', 'Customer Claims', 'Warranty Cost']
    }
  ],
  'aerospace': [
    {
      id: 'compliance-tracking',
      title: 'Improve Regulatory Compliance Tracking',
      description: 'Ensure full traceability and documentation for FAA/EASA requirements',
      category: 'quality',
      estimatedValue: 'Risk Mitigation: $1M+',
      estimatedPercent: 40,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'high',
      relatedFeatures: ['quality-control', 'production-scheduling'],
      kpis: ['Compliance Rate', 'Audit Findings', 'Documentation Accuracy']
    },
    {
      id: 'long-lead-time',
      title: 'Optimize Long Lead Time Planning',
      description: 'Better manage complex multi-month production cycles',
      category: 'delivery',
      estimatedValue: '$300K-$1M annually',
      estimatedPercent: 20,
      timeToValue: '6-12 months',
      icon: Clock,
      priority: 'high',
      relatedFeatures: ['production-planning', 'capacity-planning'],
      kpis: ['Schedule Adherence', 'Lead Time Reduction', 'Planning Accuracy']
    }
  ],
  'food-beverage': [
    {
      id: 'shelf-life-optimization',
      title: 'Optimize Shelf Life Management',
      description: 'Reduce waste from expired products through better FIFO scheduling',
      category: 'cost',
      estimatedValue: '$100K-$500K annually',
      estimatedPercent: 25,
      timeToValue: '3-6 months',
      icon: Package,
      priority: 'high',
      relatedFeatures: ['inventory-optimization', 'production-scheduling'],
      kpis: ['Waste %', 'Shelf Life Utilization', 'FIFO Compliance']
    },
    {
      id: 'batch-traceability',
      title: 'Improve Batch Traceability',
      description: 'Enhance lot tracking for food safety compliance and recall readiness',
      category: 'quality',
      estimatedValue: 'Risk Mitigation: $500K+',
      estimatedPercent: 50,
      timeToValue: '3-6 months',
      icon: ShieldCheck,
      priority: 'high',
      relatedFeatures: ['quality-control', 'production-scheduling'],
      kpis: ['Traceability Time', 'Recall Readiness', 'Compliance Score']
    }
  ],
  'pharmaceuticals': [
    {
      id: 'gmp-compliance',
      title: 'Strengthen GMP Compliance',
      description: 'Ensure production follows Good Manufacturing Practice requirements',
      category: 'quality',
      estimatedValue: 'Risk Mitigation: $5M+',
      estimatedPercent: 60,
      timeToValue: '6-12 months',
      icon: ShieldCheck,
      priority: 'high',
      relatedFeatures: ['quality-control', 'production-scheduling'],
      kpis: ['FDA Observations', 'Deviation Rate', 'CAPA Closure Time']
    },
    {
      id: 'batch-yield',
      title: 'Improve Batch Yield',
      description: 'Optimize batch scheduling to maximize yield and reduce failed batches',
      category: 'cost',
      estimatedValue: '$500K-$2M annually',
      estimatedPercent: 10,
      timeToValue: '6-12 months',
      icon: TrendingUp,
      priority: 'high',
      relatedFeatures: ['production-scheduling', 'quality-control'],
      kpis: ['Batch Yield %', 'Failed Batches', 'Right First Time']
    }
  ]
};

const DEFAULT_BENEFITS: Benefit[] = INDUSTRY_BENEFITS['manufacturing'];

const SIZE_MULTIPLIERS: Record<string, number> = {
  'small': 0.5,
  'medium': 1.0,
  'large': 2.0,
  'enterprise': 4.0
};

interface BenefitsROISectionProps {
  companyInfo?: {
    industry?: string;
    size?: string;
    numberOfPlants?: string;
  };
}

export function BenefitsROISection({ companyInfo }: BenefitsROISectionProps) {
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [transferring, setTransferring] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: onboardingStatus } = useQuery<any>({
    queryKey: ['/api/onboarding/status']
  });

  const { data: existingGoals = [] } = useQuery<any[]>({
    queryKey: ['/api/business-goals']
  });

  const effectiveCompanyInfo = useMemo(() => {
    return {
      industry: companyInfo?.industry || onboardingStatus?.industry || 'manufacturing',
      size: companyInfo?.size || onboardingStatus?.size || 'medium',
      numberOfPlants: companyInfo?.numberOfPlants || onboardingStatus?.numberOfPlants || '1'
    };
  }, [companyInfo, onboardingStatus]);

  const benefits = useMemo(() => {
    const industryKey = effectiveCompanyInfo.industry.toLowerCase().replace(/\s+/g, '-');
    return INDUSTRY_BENEFITS[industryKey] || DEFAULT_BENEFITS;
  }, [effectiveCompanyInfo.industry]);

  const sizeMultiplier = useMemo(() => {
    return SIZE_MULTIPLIERS[effectiveCompanyInfo.size.toLowerCase()] || 1.0;
  }, [effectiveCompanyInfo.size]);

  const roiMetrics: ROIMetric[] = useMemo(() => {
    const plantCount = parseInt(effectiveCompanyInfo.numberOfPlants) || 1;
    const baseValue = 500000 * sizeMultiplier * plantCount;
    
    return [
      {
        label: 'Estimated Annual Savings',
        value: `$${(baseValue / 1000).toFixed(0)}K - $${((baseValue * 3) / 1000).toFixed(0)}K`,
        improvement: 'Year 1',
        icon: DollarSign
      },
      {
        label: 'Productivity Improvement',
        value: '15-25%',
        improvement: '6-12 months',
        icon: TrendingUp
      },
      {
        label: 'On-Time Delivery',
        value: '+20-30%',
        improvement: '3-6 months',
        icon: Truck
      },
      {
        label: 'Inventory Reduction',
        value: '15-30%',
        improvement: '6-9 months',
        icon: Package
      }
    ];
  }, [effectiveCompanyInfo, sizeMultiplier]);

  const createGoalMutation = useMutation({
    mutationFn: async (goal: any) => {
      return apiRequest('POST', '/api/business-goals', goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-goals'] });
    }
  });

  const handleSelectBenefit = (benefitId: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefitId) 
        ? prev.filter(id => id !== benefitId)
        : [...prev, benefitId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBenefits.length === benefits.length) {
      setSelectedBenefits([]);
    } else {
      setSelectedBenefits(benefits.map(b => b.id));
    }
  };

  const handleTransferToGoals = async () => {
    if (selectedBenefits.length === 0) {
      toast({
        title: 'No benefits selected',
        description: 'Please select at least one benefit to transfer to business goals.',
        variant: 'destructive'
      });
      return;
    }

    setTransferring(true);
    const selectedBenefitObjects = benefits.filter(b => selectedBenefits.includes(b.id));
    
    try {
      const existingTitles = new Set(existingGoals.flatMap((g: any) => [
        g.title?.toLowerCase(),
        g.goalTitle?.toLowerCase()
      ].filter(Boolean)));
      let created = 0;
      let skipped = 0;

      for (const benefit of selectedBenefitObjects) {
        if (existingTitles.has(benefit.title.toLowerCase())) {
          skipped++;
          continue;
        }

        const now = new Date();
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 6);
        
        await createGoalMutation.mutateAsync({
          goalTitle: benefit.title,
          goalDescription: `${benefit.description}\n\nEstimated Value: ${benefit.estimatedValue}\nTime to Value: ${benefit.timeToValue}\nRelated KPIs: ${benefit.kpis.join(', ')}`,
          goalType: 'operational',
          priority: benefit.priority,
          category: benefit.category,
          targetValue: benefit.estimatedPercent.toString(),
          targetUnit: '%',
          status: 'not_started',
          startDate: now,
          targetDate: targetDate
        });
        created++;
      }

      toast({
        title: 'Benefits transferred successfully',
        description: `Created ${created} new business goal${created !== 1 ? 's' : ''}${skipped > 0 ? `. ${skipped} already existed.` : '.'}`,
      });

      setSelectedBenefits([]);
    } catch (error) {
      console.error('Error transferring benefits:', error);
      toast({
        title: 'Error transferring benefits',
        description: 'Some benefits could not be transferred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferSingle = async (benefit: Benefit) => {
    const existingTitles = new Set(existingGoals.flatMap((g: any) => [
      g.title?.toLowerCase(),
      g.goalTitle?.toLowerCase()
    ].filter(Boolean)));
    
    if (existingTitles.has(benefit.title.toLowerCase())) {
      toast({
        title: 'Goal already exists',
        description: `"${benefit.title}" is already in your business goals.`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const now = new Date();
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 6);
      
      await createGoalMutation.mutateAsync({
        goalTitle: benefit.title,
        goalDescription: `${benefit.description}\n\nEstimated Value: ${benefit.estimatedValue}\nTime to Value: ${benefit.timeToValue}\nRelated KPIs: ${benefit.kpis.join(', ')}`,
        goalType: 'operational',
        priority: benefit.priority,
        category: benefit.category,
        targetValue: benefit.estimatedPercent.toString(),
        targetUnit: '%',
        status: 'not_started',
        startDate: now,
        targetDate: targetDate
      });

      toast({
        title: 'Goal created',
        description: `"${benefit.title}" has been added to your business goals.`,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create business goal. Please try again.',
        variant: 'destructive'
      });
    }
  };

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

  const isGoalAlreadyCreated = (benefitId: string) => {
    const benefit = benefits.find(b => b.id === benefitId);
    if (!benefit) return false;
    return existingGoals.some((g: any) => 
      (g.title?.toLowerCase() === benefit.title.toLowerCase()) ||
      (g.goalTitle?.toLowerCase() === benefit.title.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Typical Benefits & ROI
          </h2>
          <p className="text-muted-foreground mt-1">
            Based on your industry ({effectiveCompanyInfo.industry}) and company size ({effectiveCompanyInfo.size})
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSelectAll}
            data-testid="button-select-all-benefits"
          >
            {selectedBenefits.length === benefits.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            onClick={handleTransferToGoals}
            disabled={selectedBenefits.length === 0 || transferring}
            data-testid="button-transfer-to-goals"
          >
            {transferring ? (
              <>Transferring...</>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Transfer to Goals ({selectedBenefits.length})
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roiMetrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <metric.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.improvement}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {benefits.map((benefit) => {
          const IconComponent = benefit.icon;
          const isSelected = selectedBenefits.includes(benefit.id);
          const alreadyCreated = isGoalAlreadyCreated(benefit.id);

          return (
            <Card 
              key={benefit.id} 
              className={cn(
                "transition-all cursor-pointer",
                isSelected && "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
                alreadyCreated && "opacity-60"
              )}
              onClick={() => !alreadyCreated && handleSelectBenefit(benefit.id)}
              data-testid={`card-benefit-${benefit.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected}
                      disabled={alreadyCreated}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => !alreadyCreated && handleSelectBenefit(benefit.id)}
                      data-testid={`checkbox-benefit-${benefit.id}`}
                    />
                    <div className={cn(
                      "p-3 rounded-xl",
                      isSelected ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <IconComponent className={cn(
                        "h-6 w-6",
                        isSelected ? "text-blue-600" : "text-gray-600"
                      )} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      {alreadyCreated && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Already a Goal
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getCategoryColor(benefit.category)}>
                        {benefit.category}
                      </Badge>
                      <Badge className={getPriorityColor(benefit.priority)}>
                        {benefit.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{benefit.estimatedValue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{benefit.timeToValue}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Potential Improvement</span>
                        <span className="font-medium">{benefit.estimatedPercent}%</span>
                      </div>
                      <Progress value={benefit.estimatedPercent} className="h-2" />
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {benefit.kpis.slice(0, 2).map((kpi, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {kpi}
                          </Badge>
                        ))}
                        {benefit.kpis.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{benefit.kpis.length - 2} more
                          </Badge>
                        )}
                      </div>
                      
                      {!alreadyCreated && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransferSingle(benefit);
                          }}
                          data-testid={`button-transfer-${benefit.id}`}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Add to Goals
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
              <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">ROI Calculator</h3>
              <p className="text-sm text-muted-foreground">
                These estimates are based on industry benchmarks for {effectiveCompanyInfo.industry} companies 
                of {effectiveCompanyInfo.size} size with {effectiveCompanyInfo.numberOfPlants} plant(s). 
                Actual results may vary based on implementation scope and current operational maturity.
              </p>
            </div>
            <Button variant="outline" data-testid="button-customize-roi">
              <PieChart className="h-4 w-4 mr-2" />
              Customize Estimates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
