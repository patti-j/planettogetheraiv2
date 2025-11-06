import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, Circle, Clock, TrendingUp, Zap, Brain, 
  Network, Database, Shield, Globe, Users, BarChart3,
  Workflow, Bot, MessageSquare, FileSpreadsheet, Calendar,
  Settings, Sparkles, Target, Package, Truck, Factory
} from "lucide-react";

interface RoadmapQuarter {
  quarter: string;
  year: number;
  status: 'completed' | 'current' | 'upcoming';
  theme: string;
  description: string;
  features: RoadmapFeature[];
}

interface RoadmapFeature {
  title: string;
  description: string;
  category: 'platform' | 'ai-ml' | 'integration' | 'enterprise' | 'analytics' | 'ux';
  impact: 'high' | 'medium' | 'low';
  icon: any;
}

export default function DevelopmentRoadmap() {
  const roadmapData: RoadmapQuarter[] = [
    {
      quarter: "Q2",
      year: 2026,
      status: "current",
      theme: "Production Foundation & Enterprise Ready",
      description: "First major release with core APS capabilities and enterprise-grade infrastructure",
      features: [
        {
          title: "Advanced Planning & Scheduling Engine v1.0",
          description: "Complete production scheduler with drag-and-drop Gantt charts, resource optimization, and constraint-based planning",
          category: "platform",
          impact: "high",
          icon: Calendar
        },
        {
          title: "AI-Powered Demand Forecasting",
          description: "Prophet-based ML forecasting with multi-horizon predictions, seasonal analysis, and automated model retraining",
          category: "ai-ml",
          impact: "high",
          icon: Brain
        },
        {
          title: "Multi-Tenant Enterprise Architecture",
          description: "Role-based access control, department isolation, SSO integration, and audit logging",
          category: "enterprise",
          impact: "high",
          icon: Shield
        },
        {
          title: "Real-Time Production Monitoring",
          description: "Live dashboard with KPIs, machine status tracking, WIP monitoring, and alert notifications",
          category: "analytics",
          impact: "medium",
          icon: BarChart3
        },
        {
          title: "ERP Integration Framework",
          description: "Pre-built connectors for SAP, Oracle, Microsoft Dynamics with bi-directional data sync",
          category: "integration",
          impact: "high",
          icon: Network
        },
        {
          title: "Mobile-Responsive Interface",
          description: "Progressive web app with offline capabilities for shop floor supervisors",
          category: "ux",
          impact: "medium",
          icon: Globe
        }
      ]
    },
    {
      quarter: "Q3",
      year: 2026,
      status: "upcoming",
      theme: "Intelligence & Automation",
      description: "Enhanced AI capabilities and workflow automation to reduce manual planning overhead",
      features: [
        {
          title: "AI Scheduling Assistant",
          description: "Conversational AI that suggests optimal schedules, explains decisions, and handles routine planning tasks",
          category: "ai-ml",
          impact: "high",
          icon: Bot
        },
        {
          title: "Predictive Maintenance Integration",
          description: "Machine learning models to predict equipment failures and automatically adjust schedules",
          category: "ai-ml",
          impact: "high",
          icon: Settings
        },
        {
          title: "Automated Workflow Engine",
          description: "No-code workflow builder for approval processes, notifications, and automated responses to schedule changes",
          category: "platform",
          impact: "medium",
          icon: Workflow
        },
        {
          title: "Advanced Analytics Suite",
          description: "Interactive dashboards for OEE analysis, capacity utilization, on-time delivery metrics, and cost tracking",
          category: "analytics",
          impact: "medium",
          icon: TrendingUp
        },
        {
          title: "Supply Chain Visibility Portal",
          description: "Supplier collaboration platform with order tracking, delivery confirmations, and automated PO management",
          category: "integration",
          impact: "medium",
          icon: Truck
        },
        {
          title: "Custom Report Builder",
          description: "Drag-and-drop report designer with scheduling, export options, and executive summaries",
          category: "analytics",
          impact: "low",
          icon: FileSpreadsheet
        }
      ]
    },
    {
      quarter: "Q4",
      year: 2026,
      status: "upcoming",
      theme: "Scale & Performance",
      description: "Infrastructure improvements for high-volume manufacturing and global deployments",
      features: [
        {
          title: "Distributed Scheduling Engine",
          description: "Microservices architecture supporting 100,000+ operations and multi-plant scheduling",
          category: "platform",
          impact: "high",
          icon: Database
        },
        {
          title: "What-If Scenario Planning",
          description: "Parallel simulation engine to test capacity changes, new product introductions, and demand scenarios",
          category: "platform",
          impact: "high",
          icon: Sparkles
        },
        {
          title: "Global Manufacturing Support",
          description: "Multi-timezone scheduling, currency handling, regional compliance, and localization (10+ languages)",
          category: "enterprise",
          impact: "high",
          icon: Globe
        },
        {
          title: "IoT Device Integration",
          description: "Direct connectivity to PLCs, SCADA systems, and shop floor sensors for real-time data collection",
          category: "integration",
          impact: "medium",
          icon: Network
        },
        {
          title: "Advanced Constraint Modeling",
          description: "Support for complex rules including setup matrices, tool availability, skill-based routing, and batch processing",
          category: "platform",
          impact: "medium",
          icon: Target
        },
        {
          title: "Performance Optimization",
          description: "Sub-second schedule generation for 10,000+ jobs with 99.9% uptime SLA",
          category: "platform",
          impact: "medium",
          icon: Zap
        }
      ]
    },
    {
      quarter: "Q1",
      year: 2027,
      status: "upcoming",
      theme: "Industry Intelligence",
      description: "Vertical-specific solutions and industry best practices built into the platform",
      features: [
        {
          title: "Industry Templates Library",
          description: "Pre-configured solutions for automotive, aerospace, food & beverage, pharma, and electronics manufacturing",
          category: "platform",
          impact: "high",
          icon: Factory
        },
        {
          title: "Regulatory Compliance Engine",
          description: "Automated validation for FDA 21 CFR Part 11, ISO 9001, AS9100, and IATF 16949 compliance",
          category: "enterprise",
          impact: "high",
          icon: Shield
        },
        {
          title: "Supply Chain AI Copilot",
          description: "Natural language interface to query schedules, analyze bottlenecks, and generate executive reports",
          category: "ai-ml",
          impact: "high",
          icon: MessageSquare
        },
        {
          title: "Collaborative Planning Portal",
          description: "Customer and supplier portals for shared visibility, commitment management, and collaborative forecasting",
          category: "integration",
          impact: "medium",
          icon: Users
        },
        {
          title: "API Marketplace",
          description: "Developer platform with SDKs, webhooks, and integration templates for custom extensions",
          category: "platform",
          impact: "medium",
          icon: Package
        },
        {
          title: "Embedded BI & Data Warehouse",
          description: "Built-in OLAP cube for multi-dimensional analysis and custom KPI tracking",
          category: "analytics",
          impact: "low",
          icon: Database
        }
      ]
    },
    {
      quarter: "Q2",
      year: 2027,
      status: "upcoming",
      theme: "Autonomous Operations",
      description: "Self-optimizing systems that learn and improve without human intervention",
      features: [
        {
          title: "Autonomous Scheduling",
          description: "AI system that continuously optimizes schedules based on real-time conditions and historical performance",
          category: "ai-ml",
          impact: "high",
          icon: Brain
        },
        {
          title: "Intelligent Resource Allocation",
          description: "ML-powered labor and machine assignment that balances efficiency, skills, and utilization",
          category: "ai-ml",
          impact: "high",
          icon: Users
        },
        {
          title: "Digital Twin Integration",
          description: "Virtual factory simulation for testing changes before implementation and real-time optimization",
          category: "platform",
          impact: "high",
          icon: Factory
        },
        {
          title: "Blockchain Supply Chain",
          description: "Distributed ledger for end-to-end traceability, quality records, and supplier verification",
          category: "integration",
          impact: "medium",
          icon: Network
        },
        {
          title: "Sustainability Metrics",
          description: "Carbon footprint tracking, energy optimization, and ESG reporting integrated into scheduling decisions",
          category: "analytics",
          impact: "medium",
          icon: TrendingUp
        },
        {
          title: "Voice-Activated Planning",
          description: "Hands-free schedule adjustments and status queries for shop floor environments",
          category: "ux",
          impact: "low",
          icon: MessageSquare
        }
      ]
    },
    {
      quarter: "Q3",
      year: 2027,
      status: "upcoming",
      theme: "Platform Ecosystem",
      description: "Open platform with marketplace, partner integrations, and community-driven innovation",
      features: [
        {
          title: "App Marketplace Launch",
          description: "Third-party extensions, industry add-ons, and custom modules from partners and community",
          category: "platform",
          impact: "high",
          icon: Package
        },
        {
          title: "AI Model Marketplace",
          description: "Pre-trained ML models for specific industries, processes, and optimization scenarios",
          category: "ai-ml",
          impact: "medium",
          icon: Sparkles
        },
        {
          title: "White-Label Platform",
          description: "Rebrandable solution for VARs, consultants, and OEMs to create custom APS offerings",
          category: "enterprise",
          impact: "high",
          icon: Settings
        },
        {
          title: "Advanced API v2.0",
          description: "GraphQL API, real-time subscriptions, and enhanced developer tools for deep integrations",
          category: "platform",
          impact: "medium",
          icon: Network
        },
        {
          title: "Enterprise Data Lake",
          description: "Centralized repository for cross-plant analytics, benchmarking, and corporate reporting",
          category: "analytics",
          impact: "medium",
          icon: Database
        },
        {
          title: "Customer Success AI",
          description: "Automated onboarding, in-app guidance, and proactive support recommendations",
          category: "ux",
          impact: "low",
          icon: Bot
        }
      ]
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      platform: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      'ai-ml': "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      integration: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      enterprise: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      analytics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      ux: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getCategoryStats = () => {
    const allFeatures = roadmapData.flatMap(q => q.features);
    const categories = {
      platform: allFeatures.filter(f => f.category === 'platform').length,
      'ai-ml': allFeatures.filter(f => f.category === 'ai-ml').length,
      integration: allFeatures.filter(f => f.category === 'integration').length,
      enterprise: allFeatures.filter(f => f.category === 'enterprise').length,
      analytics: allFeatures.filter(f => f.category === 'analytics').length,
      ux: allFeatures.filter(f => f.category === 'ux').length,
    };
    return categories;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white" data-testid="heading-roadmap">
            Development Roadmap
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our 18-month vision for the next generation of AI-powered supply chain planning and advanced production scheduling
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="outline" className="px-4 py-2">
              <Calendar className="w-4 h-4 mr-2" />
              Q2 2026 - Q3 2027
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Target className="w-4 h-4 mr-2" />
              {roadmapData.reduce((acc, q) => acc + q.features.length, 0)} Features Planned
            </Badge>
          </div>
        </div>

        {/* Category Overview */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Feature Distribution
            </CardTitle>
            <CardDescription>
              Roadmap breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{categoryStats.platform}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Platform</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{categoryStats['ai-ml']}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI & ML</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{categoryStats.integration}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Integration</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{categoryStats.enterprise}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise</p>
              </div>
              <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{categoryStats.analytics}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analytics</p>
              </div>
              <div className="text-center p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{categoryStats.ux}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">UX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="category" data-testid="tab-category">By Category</TabsTrigger>
          </TabsList>

          {/* Timeline View */}
          <TabsContent value="timeline" className="space-y-6 mt-6">
            {roadmapData.map((quarter, index) => (
              <Card 
                key={`${quarter.quarter}-${quarter.year}`}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                  quarter.status === 'current' ? 'ring-2 ring-blue-500' : ''
                }`}
                data-testid={`quarter-card-${quarter.quarter}-${quarter.year}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(quarter.status)}
                      <div>
                        <CardTitle className="text-2xl">
                          {quarter.quarter} {quarter.year}
                          {quarter.status === 'current' && (
                            <Badge className="ml-3 bg-blue-600 text-white">First Release</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-lg font-semibold mt-1">
                          {quarter.theme}
                        </CardDescription>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {quarter.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={quarter.status === 'current' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {quarter.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {quarter.features.map((feature, featureIndex) => {
                      const Icon = feature.icon;
                      return (
                        <div 
                          key={featureIndex}
                          className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                          data-testid={`feature-${quarter.quarter}-${quarter.year}-${featureIndex}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                              <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {feature.title}
                                </h4>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getCategoryColor(feature.category)}`}
                                >
                                  {feature.category.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {feature.description}
                              </p>
                              <div className="mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    feature.impact === 'high' 
                                      ? 'border-red-500 text-red-700 dark:text-red-400' 
                                      : feature.impact === 'medium'
                                      ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                                      : 'border-gray-500 text-gray-700 dark:text-gray-400'
                                  }`}
                                >
                                  {feature.impact.toUpperCase()} IMPACT
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>

                {/* Connection line to next quarter */}
                {index < roadmapData.length - 1 && (
                  <div className="flex justify-center -mb-3">
                    <div className="w-1 h-6 bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* Category View */}
          <TabsContent value="category" className="space-y-6 mt-6">
            {(['platform', 'ai-ml', 'integration', 'enterprise', 'analytics', 'ux'] as const).map((category) => {
              const categoryFeatures = roadmapData.flatMap(q => 
                q.features
                  .filter(f => f.category === category)
                  .map(f => ({ ...f, quarter: q.quarter, year: q.year }))
              );

              if (categoryFeatures.length === 0) return null;

              return (
                <Card key={category} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getCategoryColor(category)}>
                        {category.toUpperCase().replace('-', ' & ')}
                      </Badge>
                      <span className="text-gray-500">({categoryFeatures.length} features)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div 
                            key={index}
                            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                                <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {feature.title}
                                  </h4>
                                  <Badge variant="outline">
                                    {feature.quarter} {feature.year}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Footer Note */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> This roadmap represents our current vision and is subject to change based on customer feedback, 
              market demands, and technological advancements. Features and timelines may be adjusted to ensure we deliver 
              the highest value to our enterprise and SMB customers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
