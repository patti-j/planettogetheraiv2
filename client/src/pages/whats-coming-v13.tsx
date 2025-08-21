import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  BarChart3, 
  Workflow, 
  Bot, 
  TrendingUp,
  Database,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  Target,
  Network,
  Eye,
  Settings
} from 'lucide-react';

export default function WhatsComing() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('ai');

  const features = {
    ai: [
      {
        title: "Max AI Assistant",
        description: "Natural language interface for all manufacturing operations",
        icon: <Bot className="h-6 w-6" />,
        status: "Beta",
        benefits: ["Voice-controlled operations", "Intelligent recommendations", "Predictive insights"]
      },
      {
        title: "AI-Powered Optimization",
        description: "AI driven continuous improvement and performance optimization",
        icon: <Brain className="h-6 w-6" />,
        status: "New",
        benefits: ["Optimization studio", "Autonomous scheduling", "Feedback driven adaptation"]
      },
      {
        title: "Intelligent Alerts",
        description: "Proactive notifications with AI-generated solutions",
        icon: <Zap className="h-6 w-6" />,
        status: "Enhanced",
        benefits: ["Smart prioritization", "Root cause analysis", "Automated resolution"]
      },
      {
        title: "UI Design Studio",
        description: "Visual interface designer for custom dashboards and layouts",
        icon: <Settings className="h-6 w-6" />,
        status: "New",
        benefits: ["Drag-and-drop designer", "Custom widgets", "Real-time preview"]
      }
    ],
    analytics: [
      {
        title: "Smart KPI Tracking",
        description: "AI-driven performance metrics with predictive analytics",
        icon: <TrendingUp className="h-6 w-6" />,
        status: "New",
        benefits: ["Custom dashboards", "Trend analysis", "Benchmark comparisons"]
      },
      {
        title: "ML Demand Planning",
        description: "Machine learning powered demand forecasting and planning",
        icon: <Target className="h-6 w-6" />,
        status: "New",
        benefits: ["Predictive forecasting", "Seasonal adjustments", "Demand sensing"]
      },
      {
        title: "Control Tower",
        description: "Centralized command center for end-to-end visibility",
        icon: <Network className="h-6 w-6" />,
        status: "New",
        benefits: ["Supply chain visibility", "Exception management", "Cross-functional coordination"]
      },
      {
        title: "Advanced Reporting",
        description: "Interactive reports with drill-down capabilities",
        icon: <BarChart3 className="h-6 w-6" />,
        status: "Enhanced",
        benefits: ["Real-time data", "Custom visualizations", "Export options"]
      },
      {
        title: "Visual Factory Displays",
        description: "Large-screen displays for shop floor visibility",
        icon: <Eye className="h-6 w-6" />,
        status: "New",
        benefits: ["Live production status", "Performance metrics", "Alert notifications"]
      }
    ],
    collaboration: [
      {
        title: "Integrated Chat System",
        description: "Team communication with manufacturing context",
        icon: <MessageSquare className="h-6 w-6" />,
        status: "New",
        benefits: ["Production-aware messaging", "File sharing", "Task coordination"]
      },
      {
        title: "Master Production Scheduling",
        description: "Advanced MPS with constraint-based planning",
        icon: <Workflow className="h-6 w-6" />,
        status: "New",
        benefits: ["Capacity balancing", "Demand alignment", "Production optimization"]
      },
      {
        title: "Operation Dispatcher",
        description: "Real-time work order dispatching and coordination",
        icon: <Zap className="h-6 w-6" />,
        status: "New",
        benefits: ["Dynamic work assignment", "Priority management", "Resource coordination"]
      },
      {
        title: "Partner Portal",
        description: "External stakeholder access with role-based permissions",
        icon: <Users className="h-6 w-6" />,
        status: "Beta",
        benefits: ["Supplier integration", "Customer visibility", "Secure collaboration"]
      },
      {
        title: "Multi-Plant Management",
        description: "Centralized control across multiple facilities",
        icon: <Network className="h-6 w-6" />,
        status: "Enhanced",
        benefits: ["Global visibility", "Standardized processes", "Resource sharing"]
      }
    ],
    integration: [
      {
        title: "DDMRP Implementation",
        description: "Demand Driven Material Requirements Planning",
        icon: <Target className="h-6 w-6" />,
        status: "New",
        benefits: ["Buffer management", "Flow optimization", "Demand sensing"]
      },
      {
        title: "Maintenance Planning",
        description: "Integrated maintenance scheduling and management",
        icon: <Settings className="h-6 w-6" />,
        status: "New",
        benefits: ["Preventive scheduling", "Resource coordination", "Downtime optimization"]
      },
      {
        title: "ERP Connectors",
        description: "Seamless integration with major ERP systems",
        icon: <Database className="h-6 w-6" />,
        status: "Enhanced",
        benefits: ["SAP integration", "Real-time sync", "Bidirectional data flow"]
      },
      {
        title: "API Management",
        description: "RESTful APIs for custom integrations",
        icon: <Globe className="h-6 w-6" />,
        status: "New",
        benefits: ["Developer tools", "Webhook support", "Authentication"]
      },
      {
        title: "Mobile Applications",
        description: "Native mobile apps for iOS and Android",
        icon: <Smartphone className="h-6 w-6" />,
        status: "New",
        benefits: ["Offline capability", "Push notifications", "Touch-optimized UI"]
      }
    ]
  };

  const categoryInfo = {
    ai: {
      title: "AI & Intelligence",
      description: "Revolutionary AI capabilities transforming manufacturing operations",
      icon: <Brain className="h-5 w-5" />
    },
    analytics: {
      title: "Analytics & Insights",
      description: "Advanced analytics for data-driven decision making",
      icon: <BarChart3 className="h-5 w-5" />
    },
    collaboration: {
      title: "Collaboration & Communication",
      description: "Enhanced teamwork and stakeholder engagement tools",
      icon: <Users className="h-5 w-5" />
    },
    integration: {
      title: "Integration & Mobility",
      description: "Seamless connectivity and mobile-first experiences",
      icon: <Globe className="h-5 w-5" />
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-green-100 text-green-800 border-green-200';
      case 'Enhanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Beta': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8" />
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-1">
                Coming Soon
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              PlanetTogether <span className="text-yellow-300">13</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              The next generation of AI-first manufacturing optimization
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => setLocation('/pricing')}
              >
                <Target className="h-5 w-5 mr-2" />
                Get Early Access
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => setLocation('/demo-tour')}
              >
                <Eye className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Core Message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Beyond Production Scheduling
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            While PlanetTogether continues to excel at production scheduling, MRP, and capacity planning, 
            version 13 introduces breakthrough capabilities that transform your entire manufacturing ecosystem.
          </p>
        </div>

        {/* Feature Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-12 h-auto p-1">
            {Object.entries(categoryInfo).map(([key, info]) => (
              <TabsTrigger 
                key={key} 
                value={key} 
                className="flex flex-col gap-2 p-4 text-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                {info.icon}
                <span className="font-medium">{info.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(features).map(([category, categoryFeatures]) => (
            <TabsContent key={category} value={category} className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {categoryInfo[category as keyof typeof categoryInfo].title}
                </h3>
                <p className="text-lg text-gray-600">
                  {categoryInfo[category as keyof typeof categoryInfo].description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryFeatures.map((feature, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {feature.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {feature.title}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(feature.status)} border`}>
                          {feature.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base mt-2">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Call to Action */}
        <div className="mt-20 bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 md:p-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Manufacturing?
            </h3>
            <p className="text-xl mb-8 text-gray-200">
              Join our early access program and be among the first to experience 
              the future of AI-powered manufacturing optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => setLocation('/pricing')}
              >
                <Star className="h-5 w-5 mr-2" />
                Join Early Access
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => setLocation('/marketing')}
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Release Timeline</h3>
            <p className="text-lg text-gray-600">
              Progressive rollout of PlanetTogether 13 features
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-blue-200"></div>
            
            <div className="space-y-12">
              {[
                { quarter: "Q4 2025", title: "AI Assistant Beta", description: "Max AI voice interface and intelligent recommendations" },
                { quarter: "Q1 2026", title: "Analytics Platform", description: "Advanced KPI tracking and visual factory displays" },
                { quarter: "Q2 2026", title: "Collaboration Suite", description: "Integrated chat, partner portal, and mobile apps" },
                { quarter: "Q3 2026", title: "Integration Hub", description: "Enhanced ERP connectors and API management" }
              ].map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <Card className="inline-block max-w-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        <CardDescription>{milestone.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  <div className={`flex-1 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                    <Badge className="bg-blue-100 text-blue-800">
                      {milestone.quarter}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}