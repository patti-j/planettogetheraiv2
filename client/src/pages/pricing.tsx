import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bot
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    optimizationRuns?: string;
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

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { toast } = useToast();

  const pricingTiers: PricingTier[] = [
    {
      id: "starter",
      name: "Starter",
      price: billingCycle === "monthly" ? 35 : 350,
      billingPeriod: billingCycle,
      description: "Essential manufacturing management for small teams - $35 per user per month",
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
        aiUsage: "500 AI requests/month",
        optimizationRuns: "10 runs/month",
        support: "Email & Community"
      },
      icon: <Rocket className="w-6 h-6" />
    },
    {
      id: "professional",
      name: "Professional",
      price: billingCycle === "monthly" ? 75 : 750,
      billingPeriod: billingCycle,
      description: "Advanced AI-powered manufacturing optimization - $75 per user per month",
      features: [
        "Everything in Starter",
        "Max AI Assistant with voice interaction",
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
        "Priority phone & email support"
      ],
      limits: {
        users: 50,
        resources: 250,
        jobs: 1000,
        storage: "100GB",
        dataProcessing: "100,000 records/month",
        aiUsage: "5,000 AI requests/month",
        optimizationRuns: "100 runs/month",
        support: "Phone, Email & Chat"
      },
      popular: true,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: billingCycle === "monthly" ? 125 : 1250,
      billingPeriod: billingCycle,
      description: "Complete enterprise manufacturing platform - $125 per user per month",
      features: [
        "Everything in Professional",
        "Unlimited multi-plant operations",
        "Advanced Max AI with file analysis",
        "Custom AI model training",
        "White-label platform options",
        "Advanced security & compliance",
        "Custom workflow automation",
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
        aiUsage: "50,000 AI requests/month",
        optimizationRuns: "Unlimited",
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
      overageRate: "$0.05 per 1,000 additional records processed",
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
      overageRate: "$0.10 per additional AI request",
      icon: <Bot className="w-6 h-6" />,
      examples: [
        "Max AI conversations and file analysis",
        "AI-powered demand forecasting",
        "Intelligent scheduling optimization",
        "Custom AI model training and inference"
      ]
    },
    {
      id: "optimization",
      name: "Optimization Computing",
      description: "High-performance optimization algorithms for complex manufacturing scenarios",
      baseIncluded: "Base tier optimization runs included",
      overageRate: "$2.50 per additional optimization run",
      icon: <Cpu className="w-6 h-6" />,
      examples: [
        "Complex multi-plant scheduling optimization",
        "Advanced capacity planning algorithms",
        "Large-scale inventory optimization",
        "Custom optimization algorithm execution"
      ]
    },
    {
      id: "storage",
      name: "Additional Storage",
      description: "Extended storage for large manufacturing datasets and historical archives",
      baseIncluded: "Base tier storage included",
      overageRate: "$0.25 per GB per month",
      icon: <Cloud className="w-6 h-6" />,
      examples: [
        "Long-term historical data retention",
        "Large file attachments and documents",
        "Extensive production archives",
        "Multi-plant data consolidation"
      ]
    }
  ];

  const handleStartTrial = (tierId: string) => {
    setSelectedTier(tierId);
    toast({
      title: "Starting Free Trial",
      description: "Redirecting you to set up your 14-day free trial...",
    });
    // In real app, this would redirect to trial signup
    setTimeout(() => {
      window.location.href = "/signup?trial=" + tierId;
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
        { name: "Advanced Scheduling Optimizer", starter: false, professional: true, enterprise: true },
        { name: "Unlimited Plant Operations", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "AI & Intelligence",
      features: [
        { name: "Max AI Assistant (Text)", starter: false, professional: true, enterprise: true },
        { name: "Max AI with Voice Interaction", starter: false, professional: true, enterprise: true },
        { name: "Max AI File Analysis & Vision", starter: false, professional: false, enterprise: true },
        { name: "Custom AI Model Training", starter: false, professional: false, enterprise: true },
        { name: "AI-Powered Capacity Planning", starter: false, professional: true, enterprise: true },
        { name: "Inventory Optimization AI", starter: false, professional: true, enterprise: true },
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
        { name: "White-Label Platform Options", starter: false, professional: false, enterprise: true },
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
              From essential production scheduling to advanced AI-powered optimization, we deliver complete manufacturing management solutions with Max AI Assistant, multi-plant operations, and comprehensive role-based access control.
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
                  ${tier.price}
                  <span className="text-lg font-normal text-gray-500">
                    /user/{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
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
                    {tier.limits.optimizationRuns && (
                      <div className="col-span-2">
                        <span className="font-medium">Optimization Runs:</span>
                        <div className="text-gray-600">{tier.limits.optimizationRuns}</div>
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
                    onClick={() => handleStartTrial(tier.id)}
                    variant="outline"
                    className="w-full"
                    disabled={selectedTier === tier.id}
                  >
                    {selectedTier === tier.id ? "Starting Trial..." : "Start 14-Day Free Trial"}
                  </Button>
                  <Button
                    onClick={() => handleSubscribe(tier.id)}
                    className={`w-full ${
                      tier.popular 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : tier.enterprise
                          ? "bg-purple-600 hover:bg-purple-700"
                          : ""
                    }`}
                    disabled={selectedTier === tier.id}
                  >
                    {selectedTier === tier.id ? "Processing..." : "Subscribe Now"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                <Bot className="w-8 h-8 text-blue-600" />
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
              <h3 className="font-semibold mb-2">How does the free trial work?</h3>
              <p className="text-gray-600">14-day free trial with full access to all features. No credit card required to start.</p>
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