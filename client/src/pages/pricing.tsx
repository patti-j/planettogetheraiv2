import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicSiteSearch } from "@/components/public-site-search";
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Building2,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Headphones,
  Rocket,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Globe,
  Lock,
  MessageSquare,
  Cpu,
  Database,
  Cloud,
  ChevronRight,
  Bot,
  Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ROICalculator from "@/components/website/ROICalculator";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  description: string;
  features: string[];
  limits: {
    users: number | "unlimited";
    resources: number | "unlimited";
    jobs: number | "unlimited";
    storage: string;
    support: string;
    dataProcessing?: string;
    aiUsage?: string;
  };
  popular?: boolean;
  enterprise?: boolean;
  icon: React.ReactNode;
}

interface UsageTier {
  id: string;
  name: string;
  description: string;
  baseIncluded: string;
  overageRate: string;
  icon: React.ReactNode;
  examples: string[];
}

interface OptimizationAddon {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  icon: React.ReactNode;
  complexity: "core" | "advanced" | "premium";
  requiredModules?: string[];
}

const optimizationAddons: OptimizationAddon[] = [
  {
    id: "production-scheduling",
    name: "Schedule Optimization",
    description: "Core scheduling engine with Gantt charts, resource allocation, and timeline optimization",
    monthlyPrice: 0, // Contact Sales
    yearlyPrice: 0, // Contact Sales
    features: [
      "Interactive Gantt chart scheduling",
      "Drag-and-drop operation assignment",
      "Resource capacity management",
      "Real-time schedule optimization",
      "Critical path analysis",
      "Schedule scenario comparison",
      "Mobile scheduling interface"
    ],
    icon: <Calendar className="w-6 h-6" />,
    complexity: "core"
  },
  {
    id: "capacity-planning",
    name: "Capacity Optimization",
    description: "Advanced capacity forecasting, bottleneck analysis, and resource optimization",
    monthlyPrice: 0, // Contact Sales
    yearlyPrice: 0, // Contact Sales
    features: [
      "Capacity forecasting & modeling",
      "Bottleneck identification & analysis",
      "Resource utilization optimization",
      "What-if scenario planning",
      "Demand vs capacity alignment",
      "Long-term capacity planning",
      "Resource requirement planning"
    ],
    icon: <TrendingUp className="w-6 h-6" />,
    complexity: "advanced",
    requiredModules: ["production-scheduling"]
  },
  {
    id: "inventory-optimization",
    name: "Inventory Optimization",
    description: "Advanced inventory optimization with AI-powered demand forecasting and stock optimization",
    monthlyPrice: 0, // Contact Sales
    yearlyPrice: 0, // Contact Sales
    features: [
      "Inventory level optimization",
      "Automated reorder point calculation",
      "Stock level recommendations",
      "Supply chain optimization",
      "Multi-location inventory tracking",
      "Cost reduction analytics",
      "Supplier performance tracking"
    ],
    icon: <Database className="w-6 h-6" />,
    complexity: "advanced",
    requiredModules: ["production-scheduling"]
  },
  {
    id: "demand-planning",
    name: "Demand Plan Optimization",
    description: "AI-powered demand forecasting with predictive analytics and market intelligence",
    monthlyPrice: 0, // Contact Sales
    yearlyPrice: 0, // Contact Sales
    features: [
      "AI-powered demand forecasting",
      "Seasonal trend analysis",
      "Market intelligence integration",
      "Customer demand patterns",
      "Sales forecast accuracy",
      "Demand variability analysis",
      "Collaborative planning workflows"
    ],
    icon: <BarChart3 className="w-6 h-6" />,
    complexity: "premium",
    requiredModules: ["production-scheduling", "capacity-planning"]
  },
  {
    id: "theory-of-constraints",
    name: "Theory of Constraints (TOC)",
    description: "Advanced constraint-based optimization with drum-buffer-rope scheduling and buffer management",
    monthlyPrice: 0, // Contact Sales
    yearlyPrice: 0, // Contact Sales
    features: [
      "Bottleneck (drum) identification & management",
      "Automated drum analysis & recommendations",
      "Time & stock buffer management",
      "Red/yellow/green zone monitoring",
      "Buffer consumption tracking & alerts",
      "Constraint-based scheduling optimization",
      "Drum-Buffer-Rope (DBR) methodology",
      "Buffer penetration analytics",
      "TOC performance dashboards"
    ],
    icon: <Shield className="w-6 h-6" />,
    complexity: "premium",
    requiredModules: ["production-scheduling", "capacity-planning"]
  }
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [numberOfPlants, setNumberOfPlants] = useState<number>(1);
  const [showROICalculator, setShowROICalculator] = useState(false);
  const { toast } = useToast();

  const toggleAddon = (addonId: string) => {
    const addon = optimizationAddons.find(m => m.id === addonId);
    if (!addon) return;

    if (selectedModules.includes(addonId)) {
      // Remove addon and any dependent addons
      const addonsToRemove = optimizationAddons
        .filter(m => m.requiredModules?.includes(addonId) || m.id === addonId)
        .map(m => m.id);
      
      setSelectedModules(prev => prev.filter(id => !addonsToRemove.includes(id)));
    } else {
      // Add addon and ensure required addons are also selected
      const requiredAddons = addon.requiredModules || [];
      const newAddons = Array.from(new Set([...selectedModules, ...requiredAddons, addonId]));
      setSelectedModules(newAddons);
    }
  };

  const calculateAddonTotal = () => {
    return selectedModules.reduce((total, addonId) => {
      const addon = optimizationAddons.find(m => m.id === addonId);
      if (!addon) return total;
      const addonPrice = billingCycle === "monthly" ? addon.monthlyPrice : addon.yearlyPrice;
      return total + (addonPrice * numberOfPlants);
    }, 0);
  };

  const getModuleComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "core": return "bg-green-100 text-green-800";
      case "advanced": return "bg-blue-100 text-blue-800";
      case "premium": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const pricingTiers: PricingTier[] = [
    {
      id: "starter",
      name: "Starter",
      price: 0, // Contact Sales
      billingPeriod: billingCycle,
      description: "Essential manufacturing management for small teams",
      features: [
        "Production scheduling with Gantt charts",
        "Resource & job management",
        "Basic shop floor controls",
        "Mobile-responsive interface",
        "Standard role-based access (5 roles)",
        "Basic reporting & analytics",
        "Email notifications",
        "Community support",
        "Kanban boards",
        "Basic operator dashboard",
        "Visual factory displays",
        "Getting started guidance"
      ],
      limits: {
        users: 10,
        resources: 50,
        jobs: 200,
        storage: "10GB",
        dataProcessing: "10,000 records/month",
        aiUsage: "1,000 AI requests/month with playbook integration",
        support: "Email & Community"
      },
      icon: <Rocket className="w-6 h-6" />
    },
    {
      id: "professional",
      name: "Professional",
      price: 0, // Contact Sales
      billingPeriod: billingCycle,
      description: "Advanced AI-powered manufacturing optimization with transparent reasoning",
      features: [
        "Everything in Starter",
        "Enhanced Max AI with transparent decision-making",
        "AI playbook integration & knowledge management",
        "Max AI reasoning display & confidence scoring",
        "Advanced capacity planning & forecasting",
        "Inventory optimization & demand planning",
        "Scheduling optimizer with AI algorithms",
        "Advanced analytics & custom dashboards",
        "Multi-plant management",
        "Systems integration hub (ERP, MES, SCADA)",
        "Advanced role management (14 roles)",
        "Disruption management & maintenance",
        "Extension studio for customizations",
        "Training system with guided tours",
        "API access & webhook support",
        "Theory of Constraints (TOC) fundamentals",
        "Basic drum resource management",
        "Priority phone & email support"
      ],
      limits: {
        users: 50,
        resources: 250,
        jobs: 1000,
        storage: "100GB",
        dataProcessing: "100,000 records/month",
        aiUsage: "10,000 AI requests/month with full transparency",
        support: "Phone, Email & Chat"
      },
      popular: true,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 0, // Contact Sales
      billingPeriod: billingCycle,
      description: "Complete enterprise manufacturing platform",
      features: [
        "Everything in Professional",
        "Unlimited multi-plant operations",
        "Advanced Max AI with transparent reasoning & file analysis",
        "AI Knowledge System with collaborative playbooks",
        "AI Optimization Studio",
        "Custom AI model training",
        "White-label platform options",
        "Advanced security & compliance",
        "Custom workflow automation",
        "Full Theory of Constraints (TOC) suite",
        "Advanced buffer management system",
        "Automated drum analysis & optimization",
        "Real-time constraint monitoring",
        "Dedicated customer success manager",
        "Custom training & onboarding",
        "24/7 premium support with SLA",
        "Custom integrations & development",
        "Advanced audit logs & reporting",
        "Disaster recovery & backup",
        "Single sign-on (SSO) integration",
        "Unlimited API calls & webhooks"
      ],
      limits: {
        users: "unlimited",
        resources: "unlimited",
        jobs: "unlimited",
        storage: "Unlimited",
        dataProcessing: "1M+ records/month included",
        aiUsage: "Unlimited AI requests with advanced reasoning",
        support: "24/7 Dedicated with SLA"
      },
      enterprise: true,
      icon: <Crown className="w-6 h-6" />
    }
  ];

  const usageTiers: UsageTier[] = [
    {
      id: "data-processing",
      name: "Data Processing",
      description: "Large-scale manufacturing data management with high-performance processing",
      baseIncluded: "Base tier limits included",
      overageRate: "Contact Sales for pricing",
      icon: <Database className="w-6 h-6" />,
      examples: [
        "Processing 500K+ production orders monthly",
        "Managing 100K+ inventory transactions", 
        "Bulk operations on large datasets",
        "High-volume data imports and exports"
      ]
    },
    {
      id: "ai-usage",
      name: "AI & Machine Learning",
      description: "Advanced AI processing for optimization, forecasting, and intelligent automation",
      baseIncluded: "Base tier AI requests included",
      overageRate: "Contact Sales for pricing",
      icon: <Sparkles className="w-6 h-6" />,
      examples: [
        "Max AI conversations and file analysis",
        "AI-powered demand forecasting",
        "Intelligent scheduling optimization",
        "Custom AI model training and inference"
      ]
    },

    {
      id: "storage",
      name: "Additional Storage",
      description: "Extended storage for large manufacturing datasets and historical archives",
      baseIncluded: "Base tier storage included",
      overageRate: "Contact Sales for pricing",
      icon: <Cloud className="w-6 h-6" />,
      examples: [
        "Long-term historical data retention",
        "Large file attachments and documents",
        "Extensive production archives",
        "Multi-plant data consolidation"
      ]
    }
  ];

  const handleGetStarted = (tierId: string) => {
    setSelectedTier(tierId);
    toast({
      title: "Getting Started",
      description: "Redirecting you to start your subscription...",
    });
    // In real app, this would redirect to subscription signup
    setTimeout(() => {
      window.location.href = "/signup?plan=" + tierId;
    }, 1500);
  };

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    toast({
      title: "Starting Subscription",
      description: "Redirecting you to secure checkout...",
    });
    // In real app, this would integrate with Stripe
    setTimeout(() => {
      window.location.href = "/checkout?plan=" + tierId + "&billing=" + billingCycle;
    }, 1500);
  };

  const featureComparison = [
    {
      category: "Core Production Management",
      features: [
        { name: "Production Scheduling & Gantt Charts", starter: true, professional: true, enterprise: true },
        { name: "Resource & Job Management", starter: true, professional: true, enterprise: true },
        { name: "Kanban Boards & Visual Workflow", starter: true, professional: true, enterprise: true },
        { name: "Shop Floor Controls & Mobile Access", starter: true, professional: true, enterprise: true },
        { name: "Operator Dashboard & Visual Factory", starter: true, professional: true, enterprise: true },
        { name: "Multi-Plant Management", starter: false, professional: true, enterprise: true },
        { name: "Unlimited Plant Operations", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "AI & Intelligence",
      features: [
        { name: "Enhanced Max AI with Playbook Integration", starter: false, professional: true, enterprise: true },
        { name: "AI Transparency & Reasoning Display", starter: false, professional: true, enterprise: true },
        { name: "Max AI with Voice Interaction", starter: false, professional: true, enterprise: true },
        { name: "AI Knowledge Base & Collaborative Playbooks", starter: false, professional: true, enterprise: true },
        { name: "Max AI File Analysis & Vision", starter: false, professional: false, enterprise: true },
        { name: "AI Optimization Studio", starter: false, professional: false, enterprise: true },
        { name: "Custom AI Model Training", starter: false, professional: false, enterprise: true },
        { name: "AI-Powered Capacity Planning", starter: false, professional: true, enterprise: true },
        { name: "Inventory Planning AI", starter: false, professional: true, enterprise: true },
        { name: "Demand Forecasting AI", starter: false, professional: true, enterprise: true },
        { name: "Disruption Management AI", starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: "Analytics & Reporting",
      features: [
        { name: "Basic Production Reports", starter: true, professional: true, enterprise: true },
        { name: "Advanced Analytics Dashboard", starter: false, professional: true, enterprise: true },
        { name: "Custom Dashboards & Widgets", starter: false, professional: true, enterprise: true },
        { name: "Business Goals & KPI Tracking", starter: false, professional: true, enterprise: true },
        { name: "Executive-Level Reporting", starter: false, professional: false, enterprise: true },
        { name: "Predictive Analytics", starter: false, professional: false, enterprise: true },
        { name: "Advanced Audit Logs", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Role Management & Access",
      features: [
        { name: "Basic Role-Based Access (5 roles)", starter: true, professional: false, enterprise: false },
        { name: "Advanced Role Management (14 roles)", starter: false, professional: true, enterprise: true },
        { name: "User Management & Assignments", starter: false, professional: true, enterprise: true },
        { name: "Plant Manager Dashboard", starter: false, professional: true, enterprise: true },
        { name: "Forklift Driver & Maintenance Roles", starter: false, professional: true, enterprise: true },
        { name: "Sales & Customer Service Roles", starter: false, professional: true, enterprise: true },
        { name: "Single Sign-On (SSO)", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Systems Integration",
      features: [
        { name: "Email Notifications", starter: true, professional: true, enterprise: true },
        { name: "Systems Integration Hub", starter: false, professional: true, enterprise: true },
        { name: "ERP/MES/SCADA Integration", starter: false, professional: true, enterprise: true },
        { name: "API Access & Webhooks", starter: false, professional: true, enterprise: true },
        { name: "Custom Integrations", starter: false, professional: false, enterprise: true },
        { name: "Unlimited API Calls", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Training & Customization",
      features: [
        { name: "Getting Started Guidance", starter: true, professional: true, enterprise: true },
        { name: "Interactive Guided Tours", starter: false, professional: true, enterprise: true },
        { name: "Training System with Voice", starter: false, professional: true, enterprise: true },
        { name: "Extension Studio & Customizations", starter: false, professional: true, enterprise: true },
        { name: "Custom Training & Onboarding", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Support & Enterprise",
      features: [
        { name: "Email & Community Support", starter: true, professional: false, enterprise: false },
        { name: "Priority Phone, Email & Chat", starter: false, professional: true, enterprise: false },
        { name: "24/7 Premium Support with SLA", starter: false, professional: false, enterprise: true },
        { name: "Dedicated Customer Success Manager", starter: false, professional: false, enterprise: true },
        { name: "Advanced Security & Compliance", starter: false, professional: false, enterprise: true },
        { name: "Disaster Recovery & Backup", starter: false, professional: false, enterprise: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold">PlanetTogether</span>
            </div>
            <div className="flex items-center gap-4">
              <PublicSiteSearch />
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              <Sparkles className="w-4 h-4 mr-1" />
              Manufacturing Management Platform
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose the Perfect Plan for Your Manufacturing Operation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              From essential production scheduling to advanced AI-powered optimization, our AI First Factory Optimization Platform delivers complete manufacturing solutions with Max AI Assistant, multi-plant operations, and comprehensive role-based access control.
            </p>
            
            {/* Login and Demo Tour Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
              <Button 
                onClick={() => window.location.href = '/login'} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Sign In to Your Account
              </Button>
              <Button 
                onClick={() => window.location.href = '/?demo=true'} 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
              >
                Start Interactive Demo Tour
              </Button>
              <Button 
                onClick={() => setShowROICalculator(!showROICalculator)} 
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Your ROI
              </Button>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-6 py-2 rounded-md transition-colors ${
                  billingCycle === "monthly" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 rounded-md transition-colors ${
                  billingCycle === "yearly" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600"
                }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly
                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ROI Calculator Section */}
        {showROICalculator && (
          <div className="mb-12">
            <ROICalculator />
          </div>
        )}
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative transition-all duration-300 hover:shadow-2xl ${
                tier.popular ? "ring-2 ring-blue-500 scale-105" : ""
              } ${selectedTier === tier.id ? "ring-2 ring-green-500" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    tier.popular 
                      ? "bg-blue-100 text-blue-600" 
                      : tier.enterprise 
                        ? "bg-purple-100 text-purple-600"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="text-4xl font-bold mt-4">
                  {tier.price === 0 ? (
                    <a 
                      href="https://www.planettogether.com/contact-sales"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4 transition-colors"
                    >
                      Contact Sales
                    </a>
                  ) : (
                    <>
                      ${tier.price}
                      <span className="text-lg font-normal text-gray-500">
                        /user/{billingCycle === "monthly" ? "mo" : "yr"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-600 mt-2">{tier.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Users:</span>
                      <div className="text-gray-600">{tier.limits.users}</div>
                    </div>
                    <div>
                      <span className="font-medium">Resources:</span>
                      <div className="text-gray-600">{tier.limits.resources}</div>
                    </div>
                    <div>
                      <span className="font-medium">Jobs:</span>
                      <div className="text-gray-600">{tier.limits.jobs}</div>
                    </div>
                    <div>
                      <span className="font-medium">Storage:</span>
                      <div className="text-gray-600">{tier.limits.storage}</div>
                    </div>
                    {tier.limits.dataProcessing && (
                      <div className="col-span-2">
                        <span className="font-medium">Data Processing:</span>
                        <div className="text-gray-600">{tier.limits.dataProcessing}</div>
                      </div>
                    )}
                    {tier.limits.aiUsage && (
                      <div className="col-span-2">
                        <span className="font-medium">AI Requests:</span>
                        <div className="text-gray-600">{tier.limits.aiUsage}</div>
                      </div>
                    )}

                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      {tier.features.slice(0, 6).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {tier.features.length > 6 && (
                        <div className="text-sm text-gray-500">
                          +{tier.features.length - 6} more features
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleGetStarted(tier.id)}
                    variant="outline"
                    className="w-full"
                    disabled={selectedTier === tier.id}
                  >
                    {selectedTier === tier.id ? "Getting Started..." : "Get Started"}
                  </Button>
                  <Button
                    onClick={() => window.open('https://www.planettogether.com/contact-sales', '_blank')}
                    className={`w-full ${
                      tier.popular 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : tier.enterprise
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-gray-900 hover:bg-gray-800"
                    } text-white`}
                  >
                    Contact Sales Team
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Optimization Add-ons Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Optimization Add-ons</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-6">
              Scale your capabilities with specialized optimization add-ons. Each add-on works independently and can be added to any plan. Pricing is per plant per month for multi-location operations.
            </p>
            
            {/* Plant Count Selector */}
            <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
              <label className="text-sm font-medium text-gray-700">Number of Plants:</label>
              <select 
                value={numberOfPlants} 
                onChange={(e) => setNumberOfPlants(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map(count => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? 'plant' : 'plants'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add-on Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {optimizationAddons.map((addon) => {
              const isSelected = selectedModules.includes(addon.id);
              const isRequired = addon.requiredModules?.some(reqId => 
                selectedModules.includes(reqId) && 
                optimizationAddons.find(m => m.id === reqId && selectedModules.includes(m.id))
              );
              const isDisabled = addon.requiredModules?.some(reqId => !selectedModules.includes(reqId));

              return (
                <Card 
                  key={addon.id} 
                  className={`relative transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  } ${isDisabled ? "opacity-60" : ""}`}
                  onClick={() => !isDisabled && toggleAddon(addon.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}>
                          {addon.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            {addon.name}
                            <Badge className={getModuleComplexityColor(addon.complexity)}>
                              {addon.complexity}
                            </Badge>
                          </CardTitle>
                          <div className="text-xl font-bold mt-1">
                            <a 
                              href="https://www.planettogether.com/contact-sales"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 transition-colors"
                            >
                              Contact Sales
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? "bg-blue-600 border-blue-600" 
                          : "border-gray-300"
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">{addon.description}</p>
                    
                    {addon.requiredModules && addon.requiredModules.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600">
                          Requires: {addon.requiredModules.map(reqId => {
                            const reqAddon = optimizationAddons.find(m => m.id === reqId);
                            return reqAddon?.name;
                          }).join(", ")}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {addon.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {addon.features.length > 4 && (
                        <div className="text-sm text-gray-500">
                          +{addon.features.length - 4} more features
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Module Total Calculator */}
          {selectedModules.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Selected Add-ons Total</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedModules.length} add-on{selectedModules.length !== 1 ? 's' : ''} selected for {numberOfPlants} {numberOfPlants === 1 ? 'plant' : 'plants'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    ${calculateAddonTotal()}
                    <span className="text-lg font-normal text-gray-500">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {numberOfPlants > 1 ? `Total for ${numberOfPlants} plants • ` : ''}Add to any plan above
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedModules.map(addonId => {
                  const addon = optimizationAddons.find(m => m.id === addonId);
                  if (!addon) return null;
                  return (
                    <Badge key={addonId} variant="secondary" className="flex items-center gap-1">
                      {addon.name}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAddon(addonId);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Add-on Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Add/remove add-ons anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Full feature access instantly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage-Based Pricing Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Usage-Based Pricing</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              Scale with confidence. All plans include generous base limits, with transparent usage-based pricing for enterprise-scale operations processing large data volumes, heavy AI usage, and complex optimizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageTiers.map((usage) => (
              <Card key={usage.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                      {usage.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{usage.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{usage.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Base Included</div>
                      <div className="text-xs text-gray-600">{usage.baseIncluded}</div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-700 mb-1">Overage Rate</div>
                      <div className="text-lg font-bold text-blue-900">{usage.overageRate}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Common Use Cases:</div>
                      <div className="space-y-1">
                        {usage.examples.slice(0, 2).map((example, index) => (
                          <div key={index} className="flex items-start text-xs text-gray-600">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                            <span>{example}</span>
                          </div>
                        ))}
                        {usage.examples.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{usage.examples.length - 2} more scenarios
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Volume Discounts Available</h3>
              <p className="text-gray-600 mb-4">
                For enterprise customers with consistent high-volume usage, we offer significant volume discounts and custom pricing plans.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Contact Sales for Custom Pricing
                </Button>
                <div className="text-sm text-gray-600">
                  Save 20-40% with annual volume commitments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Platform Capabilities */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Complete Manufacturing Intelligence Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Max AI Assistant</h3>
              <p className="text-sm text-gray-600 mt-2">Voice-enabled AI that creates dashboards, analyzes files, and controls your entire interface</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Multi-Plant Operations</h3>
              <p className="text-sm text-gray-600 mt-2">Manage unlimited manufacturing plants with unified scheduling and resource allocation</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">14 Specialized Roles</h3>
              <p className="text-sm text-gray-600 mt-2">From production schedulers to plant managers, each role gets tailored interfaces and permissions</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Universal Integration</h3>
              <p className="text-sm text-gray-600 mt-2">Connect with any ERP, MES, SCADA, or custom system through our integration hub</p>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-4 px-6">Features</th>
                  <th className="text-center py-4 px-6">Starter</th>
                  <th className="text-center py-4 px-6">Professional</th>
                  <th className="text-center py-4 px-6">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-3 px-6 font-semibold text-gray-700">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-6">{feature.name}</td>
                        <td className="text-center py-3 px-6">
                          {feature.starter ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3 px-6">
                          {feature.professional ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3 px-6">
                          {feature.enterprise ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose PlanetTogether?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">Bank-level encryption and SOC 2 compliance</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Proven ROI</h3>
              <p className="text-gray-600">Average 23% efficiency improvement</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Expert Support</h3>
              <p className="text-gray-600">Dedicated manufacturing experts</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
              <p className="text-gray-600">No setup fees for any plan. We include onboarding and training to get you started quickly.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does billing work?</h3>
              <p className="text-gray-600">Monthly or yearly subscriptions starting with our Starter Edition. No setup fees. Cancel anytime.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What integrations are available?</h3>
              <p className="text-gray-600">We integrate with major ERP systems, inventory management tools, and can build custom integrations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}