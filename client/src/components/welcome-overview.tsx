import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Factory, Users, Target, TrendingUp, Clock, Award, Zap, CheckCircle2,
  ArrowRight, Calendar, BarChart3, Package, Brain, Sparkles, Shield,
  Settings, PlayCircle, BookOpen, Lightbulb, Globe, Rocket, Heart,
  Star, UserPlus, Building, DollarSign, Timer, AlertCircle, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
  activities: string[];
  outcomes: string[];
  effort: 'low' | 'medium' | 'high';
}

interface Benefit {
  title: string;
  description: string;
  icon: React.ElementType;
  impact: string;
  timeToValue: string;
}

interface Capability {
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
}

export function WelcomeOverview({ onComplete }: { onComplete: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPhase, setCurrentPhase] = useState(0);

  const capabilities: Capability[] = [
    {
      name: "AI-Powered Production Scheduling",
      description: "Optimize your production schedule with intelligent algorithms",
      icon: Brain,
      features: [
        "Visual Gantt chart scheduling",
        "Automatic conflict resolution",
        "Real-time schedule optimization",
        "What-if scenario planning"
      ]
    },
    {
      name: "Intelligent Resource Management",
      description: "Maximize equipment and workforce efficiency",
      icon: Users,
      features: [
        "Resource capacity planning",
        "Skill-based assignment",
        "Bottleneck identification",
        "Utilization tracking"
      ]
    },
    {
      name: "Adaptive Planning Automation",
      description: "Automatically adjust to disruptions and changes",
      icon: Zap,
      features: [
        "Real-time disruption response",
        "Automated plan adjustments",
        "Smart alert system",
        "Continuous optimization"
      ]
    },
    {
      name: "Supply Chain Visibility",
      description: "End-to-end visibility from procurement to delivery",
      icon: Package,
      features: [
        "Material requirements planning (MRP)",
        "Inventory optimization",
        "Supplier collaboration",
        "Demand forecasting"
      ]
    },
    {
      name: "Quality & Compliance",
      description: "Ensure product quality and regulatory compliance",
      icon: Shield,
      features: [
        "Quality control tracking",
        "Compliance documentation",
        "Audit trail management",
        "Certificate generation"
      ]
    },
    {
      name: "Analytics & Insights",
      description: "Data-driven decision making with AI insights",
      icon: BarChart3,
      features: [
        "Real-time KPI dashboards",
        "Predictive analytics",
        "Performance trending",
        "Custom report generation"
      ]
    }
  ];

  const benefits: Benefit[] = [
    {
      title: "30-50% Reduction in Production Lead Times",
      description: "Optimize scheduling and eliminate bottlenecks to deliver faster",
      icon: Clock,
      impact: "Faster customer delivery, improved cash flow",
      timeToValue: "2-4 weeks"
    },
    {
      title: "25% Increase in Resource Utilization",
      description: "Better allocation of equipment and workforce",
      icon: TrendingUp,
      impact: "Higher throughput without additional investment",
      timeToValue: "1-2 weeks"
    },
    {
      title: "40% Reduction in Planning Time",
      description: "AI-powered automation handles routine planning tasks",
      icon: Timer,
      impact: "Free up planners for strategic activities",
      timeToValue: "Immediate"
    },
    {
      title: "20% Reduction in Inventory Costs",
      description: "Optimize stock levels and reduce waste",
      icon: DollarSign,
      impact: "Lower working capital requirements",
      timeToValue: "4-6 weeks"
    },
    {
      title: "95%+ On-Time Delivery",
      description: "Reliable scheduling and proactive issue resolution",
      icon: Award,
      impact: "Improved customer satisfaction and retention",
      timeToValue: "2-3 weeks"
    },
    {
      title: "Empowered Workforce",
      description: "Clear priorities and reduced firefighting",
      icon: Heart,
      impact: "Higher employee satisfaction and productivity",
      timeToValue: "1 week"
    }
  ];

  const implementationTimeline: TimelinePhase[] = [
    {
      phase: "Discovery & Setup",
      duration: "Week 1",
      description: "Initial system configuration and data import",
      activities: [
        "Account setup and team onboarding",
        "Import existing data (products, resources, orders)",
        "Configure plants and departments",
        "Set up user roles and permissions"
      ],
      outcomes: [
        "System ready with your data",
        "Team familiar with navigation",
        "Basic scheduling capabilities active"
      ],
      effort: 'medium'
    },
    {
      phase: "Core Implementation",
      duration: "Weeks 2-3",
      description: "Activate core scheduling and planning features",
      activities: [
        "Configure production scheduling rules",
        "Set up resource calendars and shifts",
        "Define routing and operations",
        "Create initial production plans"
      ],
      outcomes: [
        "Active production scheduling",
        "Resource optimization in place",
        "First optimized schedules generated"
      ],
      effort: 'high'
    },
    {
      phase: "Optimization & Training",
      duration: "Weeks 4-5",
      description: "Fine-tune system and train advanced users",
      activities: [
        "Optimize scheduling parameters",
        "Configure KPIs and dashboards",
        "Advanced user training",
        "Set up automation rules"
      ],
      outcomes: [
        "System optimized for your workflow",
        "Team proficient in daily operations",
        "Automation reducing manual work"
      ],
      effort: 'medium'
    },
    {
      phase: "Advanced Features",
      duration: "Weeks 6-8",
      description: "Activate advanced capabilities as needed",
      activities: [
        "Enable AI-powered optimization",
        "Configure supply chain integration",
        "Set up quality management",
        "Implement advanced analytics"
      ],
      outcomes: [
        "Full system capabilities active",
        "End-to-end visibility achieved",
        "Continuous improvement cycle established"
      ],
      effort: 'low'
    },
    {
      phase: "Continuous Improvement",
      duration: "Ongoing",
      description: "Refine and expand system usage",
      activities: [
        "Regular performance reviews",
        "Process optimization",
        "New feature adoption",
        "Team skill development"
      ],
      outcomes: [
        "Sustained performance improvements",
        "Growing ROI over time",
        "Organization-wide adoption"
      ],
      effort: 'low'
    }
  ];

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Factory className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to PlanetTogether</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your AI-First Manufacturing Optimization Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Transform your manufacturing operations with intelligent scheduling, real-time optimization, 
            and AI-powered insights. Join hundreds of manufacturers who've revolutionized their production.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Rocket className="h-3 w-3 mr-1" />
              Quick Setup
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Globe className="h-3 w-3 mr-1" />
              Industry Leader
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="getstarted">Get Started</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                System Capabilities
              </CardTitle>
              <CardDescription>
                Comprehensive tools to optimize every aspect of your manufacturing operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {capabilities.map((capability, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <capability.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{capability.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {capability.description}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {capability.features.map((feature, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Expected Benefits & ROI
              </CardTitle>
              <CardDescription>
                Measurable improvements for your company and team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <benefit.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">Impact:</span>
                          <span className="text-muted-foreground">{benefit.impact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Time to Value:</span>
                          <Badge variant="secondary">{benefit.timeToValue}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="bg-primary/5 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Benefits for Your Team
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium">Production Planners</h5>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Automated scheduling</li>
                      <li>• Visual planning tools</li>
                      <li>• Proactive alerts</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium">Shop Floor Teams</h5>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Clear work priorities</li>
                      <li>• Mobile access</li>
                      <li>• Real-time updates</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium">Management</h5>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Executive dashboards</li>
                      <li>• Performance insights</li>
                      <li>• Strategic visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Implementation Journey
              </CardTitle>
              <CardDescription>
                Your path to manufacturing excellence - clear milestones and realistic timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {implementationTimeline.map((phase, index) => (
                  <div
                    key={index}
                    className={`relative ${index === currentPhase ? 'ring-2 ring-primary ring-offset-2' : ''} 
                      rounded-lg p-6 bg-card border`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-semibold">{phase.phase}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-11">
                          {phase.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{phase.duration}</Badge>
                        <p className={`text-sm mt-1 font-medium ${getEffortColor(phase.effort)}`}>
                          {phase.effort.charAt(0).toUpperCase() + phase.effort.slice(1)} Effort
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-11">
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Key Activities
                        </h5>
                        <ul className="space-y-1">
                          {phase.activities.map((activity, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Expected Outcomes
                        </h5>
                        <ul className="space-y-1">
                          {phase.outcomes.map((outcome, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Star className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {index < implementationTimeline.length - 1 && (
                      <div className="absolute left-7 -bottom-6 h-6 w-0.5 bg-border" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 dark:text-blue-100">Flexible Implementation</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      This timeline is adaptable to your needs. Many companies see value from day one, 
                      and you can adjust the pace based on your resources and priorities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="getstarted" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Ready to Transform Your Manufacturing?
              </CardTitle>
              <CardDescription>
                Three simple steps to begin your optimization journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <PlayCircle className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">1. Start with a Tour</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Take a guided tour to see the system in action with sample data
                    </p>
                    <Link href="/demo-tour">
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Demo Tour
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Settings className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">2. Configure Basics</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up your plants, resources, and import initial data
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={onComplete}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Start Configuration
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <UserPlus className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">3. Invite Your Team</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Add team members and assign roles for collaboration
                    </p>
                    <Link href="/user-access-management">
                      <Button variant="outline" className="w-full">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Support & Resources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Link href="/help">
                      <Button variant="ghost" className="w-full justify-start">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Help Center & Documentation
                      </Button>
                    </Link>
                    <Link href="/training">
                      <Button variant="ghost" className="w-full justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Training Videos & Tutorials
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <Link href="/chat">
                      <Button variant="ghost" className="w-full justify-start">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ask for Help
                      </Button>
                    </Link>
                    <Link href="/feedback">
                      <Button variant="ghost" className="w-full justify-start">
                        <Heart className="h-4 w-4 mr-2" />
                        Share Feedback
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <Button 
                  size="lg" 
                  className="min-w-[200px]"
                  onClick={onComplete}
                >
                  Get Started Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  No credit card required • Free trial available • Full support included
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}