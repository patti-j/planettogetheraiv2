import { useState } from "react";
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
  ChevronRight
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
  };
  popular?: boolean;
  enterprise?: boolean;
  icon: React.ReactNode;
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { toast } = useToast();

  const pricingTiers: PricingTier[] = [
    {
      id: "starter",
      name: "Starter",
      price: billingCycle === "monthly" ? 29 : 290,
      billingPeriod: billingCycle,
      description: "Perfect for small manufacturing teams - $29 per user per month",
      features: [
        "Basic production scheduling",
        "Gantt chart visualization",
        "Resource management",
        "Job tracking",
        "Mobile access",
        "Email support",
        "Basic reporting",
        "Standard integrations"
      ],
      limits: {
        users: 5,
        resources: 25,
        jobs: 100,
        storage: "5GB",
        support: "Email"
      },
      icon: <Rocket className="w-6 h-6" />
    },
    {
      id: "professional",
      name: "Professional",
      price: billingCycle === "monthly" ? 59 : 590,
      billingPeriod: billingCycle,
      description: "Advanced features for growing manufacturers - $59 per user per month",
      features: [
        "Everything in Starter",
        "Advanced scheduling algorithms",
        "Capacity planning",
        "AI-powered optimization",
        "Custom dashboards",
        "Advanced reporting & analytics",
        "API access",
        "Priority support",
        "Real-time collaboration",
        "Inventory integration"
      ],
      limits: {
        users: 25,
        resources: 100,
        jobs: 500,
        storage: "50GB",
        support: "Phone & Email"
      },
      popular: true,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: billingCycle === "monthly" ? 89 : 890,
      billingPeriod: billingCycle,
      description: "Complete manufacturing management solution - $89 per user per month",
      features: [
        "Everything in Professional",
        "Multi-site management",
        "Advanced AI insights",
        "Custom integrations",
        "White-label options",
        "Dedicated account manager",
        "Custom training",
        "SLA guarantees",
        "Advanced security",
        "Unlimited API calls"
      ],
      limits: {
        users: "unlimited",
        resources: "unlimited",
        jobs: "unlimited",
        storage: "Unlimited",
        support: "24/7 Dedicated"
      },
      enterprise: true,
      icon: <Crown className="w-6 h-6" />
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
      category: "Core Features",
      features: [
        { name: "Production Scheduling", starter: true, professional: true, enterprise: true },
        { name: "Gantt Chart Visualization", starter: true, professional: true, enterprise: true },
        { name: "Resource Management", starter: true, professional: true, enterprise: true },
        { name: "Job Tracking", starter: true, professional: true, enterprise: true },
        { name: "Mobile Access", starter: true, professional: true, enterprise: true },
        { name: "Real-time Collaboration", starter: false, professional: true, enterprise: true },
        { name: "Advanced Scheduling Algorithms", starter: false, professional: true, enterprise: true },
        { name: "AI-Powered Optimization", starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: "Analytics & Reporting",
      features: [
        { name: "Basic Reports", starter: true, professional: true, enterprise: true },
        { name: "Advanced Analytics", starter: false, professional: true, enterprise: true },
        { name: "Custom Dashboards", starter: false, professional: true, enterprise: true },
        { name: "Predictive Insights", starter: false, professional: false, enterprise: true },
        { name: "Executive Reporting", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Integrations",
      features: [
        { name: "Standard Integrations", starter: true, professional: true, enterprise: true },
        { name: "API Access", starter: false, professional: true, enterprise: true },
        { name: "Custom Integrations", starter: false, professional: false, enterprise: true },
        { name: "ERP Integration", starter: false, professional: true, enterprise: true },
        { name: "Inventory Management", starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: "Support & Training",
      features: [
        { name: "Email Support", starter: true, professional: true, enterprise: true },
        { name: "Phone Support", starter: false, professional: true, enterprise: true },
        { name: "Priority Support", starter: false, professional: true, enterprise: true },
        { name: "Dedicated Account Manager", starter: false, professional: false, enterprise: true },
        { name: "Custom Training", starter: false, professional: false, enterprise: true },
        { name: "24/7 Support", starter: false, professional: false, enterprise: true }
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
              From small teams to enterprise operations, we have the right solution to optimize your production scheduling and boost efficiency
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
                  <>
                    <tr key={category.category} className="bg-gray-50">
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
                  </>
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