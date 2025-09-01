import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Database, 
  Globe, 
  Play,
  Star,
  Eye,
  Workflow,
  Gauge,
  Factory,
  Package,
  Truck,
  FileText,
  MessageSquare,
  Bot,
  Lightbulb,
  Search,
  Layers,
  MousePointer,
  Move3D,
  Smartphone
} from "lucide-react";
import { useLocation } from "wouter";

const ProductionSchedulingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeSchedulingMode, setActiveSchedulingMode] = useState("interactive");

  const coreSchedulingFeatures = [
    {
      title: "Interactive Gantt Chart Scheduling",
      icon: <Calendar className="w-8 h-8" />,
      description: "Industry's most advanced Gantt chart with drag-and-drop scheduling, real-time optimization, and visual constraint management",
      benefits: [
        "Drag-and-drop operation assignment with automatic constraint checking",
        "Real-time capacity visualization with color-coded utilization",
        "Interactive timeline with zoom levels from minutes to months",
        "Visual constraint relationships with dependency tracking",
        "Multi-resource scheduling with skill-based assignments",
        "What-if scenario planning with instant impact analysis"
      ],
      roiImpact: "45% reduction in scheduling time, 30% improvement in resource utilization",
      competitiveDifferentiator: "Only manufacturing platform with Bryntum Scheduler Pro integration providing enterprise-grade Gantt capabilities"
    },
    {
      title: "AI-Powered Schedule Optimization",
      icon: <Bot className="w-8 h-8" />,
      description: "Intelligent algorithms continuously optimize schedules for efficiency, cost, and delivery performance",
      benefits: [
        "ASAP (As Soon As Possible) scheduling for fastest completion",
        "ALAP (As Late As Possible) scheduling for minimal inventory",
        "Critical Path Method (CPM) for timeline optimization",
        "Resource leveling for balanced workload distribution",
        "Theory of Constraints (TOC) drum-buffer-rope scheduling",
        "Multi-objective optimization balancing cost, time, and quality"
      ],
      roiImpact: "25% improvement in on-time delivery, 20% reduction in expediting costs",
      competitiveDifferentiator: "Advanced optimization algorithms typically found only in specialized APS systems, integrated seamlessly"
    },
    {
      title: "Dynamic Rescheduling & Disruption Management",
      icon: <RefreshCw className="w-8 h-8" />,
      description: "Automatic schedule adjustments in response to real-time changes and disruptions",
      benefits: [
        "Automatic rescheduling when priorities change or delays occur",
        "Real-time constraint violation detection and resolution",
        "Emergency order insertion with minimal schedule disruption",
        "Machine breakdown response with alternative routing",
        "Material shortage handling with substitute material logic",
        "Labor absence management with skill-based reallocation"
      ],
      roiImpact: "60% faster response to disruptions, 35% reduction in late deliveries",
      competitiveDifferentiator: "Intelligent disruption management that learns from past responses and suggests optimal recovery strategies"
    },
    {
      title: "Mobile & Voice-Controlled Scheduling",
      icon: <Smartphone className="w-8 h-8" />,
      description: "Schedule management from anywhere using mobile devices and voice commands",
      benefits: [
        "Mobile-responsive Gantt charts optimized for tablets and phones",
        "Voice commands for hands-free schedule queries and updates",
        "Touch-optimized drag-and-drop for mobile scheduling",
        "Offline capability for schedule viewing and basic updates",
        "Push notifications for schedule changes and alerts",
        "QR code scanning for quick job and resource identification"
      ],
      roiImpact: "50% increase in schedule accessibility, 40% faster shop floor response",
      competitiveDifferentiator: "First manufacturing platform with native voice control specifically designed for production scheduling"
    }
  ];

  const schedulingAlgorithms = [
    {
      name: "ASAP (As Soon As Possible)",
      description: "Schedules all operations to start and finish as early as possible",
      useCases: ["Rush orders", "Maximum throughput", "Early delivery goals"],
      benefits: ["Fastest completion times", "High equipment utilization", "Early revenue recognition"],
      icon: <Zap className="w-6 h-6" />
    },
    {
      name: "ALAP (As Late As Possible)",
      description: "Schedules operations to start as late as possible while meeting due dates",
      useCases: ["Inventory minimization", "Cash flow optimization", "Perishable goods"],
      benefits: ["Minimal work-in-process", "Reduced carrying costs", "Fresher products"],
      icon: <Clock className="w-6 h-6" />
    },
    {
      name: "Critical Path Method (CPM)",
      description: "Identifies the longest sequence of dependent operations",
      useCases: ["Project management", "Complex assemblies", "Deadline-critical production"],
      benefits: ["Optimized project timelines", "Resource focus", "Risk identification"],
      icon: <Target className="w-6 h-6" />
    },
    {
      name: "Resource Leveling",
      description: "Smooths resource utilization to avoid overallocation",
      useCases: ["Capacity management", "Overtime reduction", "Balanced workload"],
      benefits: ["Even resource usage", "Reduced overtime", "Improved quality"],
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      name: "Theory of Constraints (TOC)",
      description: "Focuses scheduling around bottleneck resources (drums)",
      useCases: ["Bottleneck management", "Throughput maximization", "Pull-based production"],
      benefits: ["Maximum throughput", "Reduced inventory", "Simplified scheduling"],
      icon: <Shield className="w-6 h-6" />
    },
    {
      name: "Multi-Objective Optimization",
      description: "Balances multiple goals simultaneously",
      useCases: ["Complex trade-offs", "Multiple KPIs", "Strategic alignment"],
      benefits: ["Balanced performance", "Strategic alignment", "Holistic optimization"],
      icon: <Settings className="w-6 h-6" />
    }
  ];

  const ganttCapabilities = [
    {
      category: "Visual Interaction",
      features: [
        {
          name: "Drag & Drop Operations",
          description: "Intuitive operation rescheduling with real-time constraint validation",
          impact: "80% faster schedule adjustments"
        },
        {
          name: "Multi-Level Zoom",
          description: "Seamless zoom from minute-level detail to yearly overview",
          impact: "360° scheduling visibility"
        },
        {
          name: "Color-Coded Status",
          description: "Visual status indicators for operations, resources, and constraints",
          impact: "Instant status recognition"
        }
      ]
    },
    {
      category: "Constraint Management",
      features: [
        {
          name: "Dependency Visualization",
          description: "Clear visual representation of operation dependencies and relationships",
          impact: "90% reduction in dependency errors"
        },
        {
          name: "Capacity Monitoring",
          description: "Real-time capacity utilization with overload warnings",
          impact: "Prevents 95% of overallocation issues"
        },
        {
          name: "Skill-Based Assignment",
          description: "Automatic resource assignment based on required skills and certifications",
          impact: "100% compliance with skill requirements"
        }
      ]
    },
    {
      category: "Performance Optimization",
      features: [
        {
          name: "Automatic Load Balancing",
          description: "Intelligent distribution of work across available resources",
          impact: "25% improvement in resource utilization"
        },
        {
          name: "Bottleneck Identification",
          description: "Visual highlighting of constraints limiting throughput",
          impact: "50% faster constraint resolution"
        },
        {
          name: "Schedule Optimization",
          description: "One-click optimization using multiple algorithms",
          impact: "30% improvement in schedule efficiency"
        }
      ]
    }
  ];

  const industryApplications = [
    {
      industry: "Automotive Manufacturing",
      challenge: "Complex assembly sequences with hundreds of components and just-in-time delivery requirements",
      solution: "Multi-level Gantt scheduling with supplier integration, real-time constraint management, and automated sequencing optimization",
      results: [
        "98% on-time delivery achievement",
        "35% reduction in work-in-process inventory",
        "50% faster response to engineering changes",
        "Zero line stoppages due to scheduling conflicts"
      ],
      testimonial: "The visual Gantt scheduling has transformed our ability to manage complex assembly operations. We can see months ahead while managing minute-by-minute execution.",
      customer: "Production Planning Manager, Global Auto Manufacturer"
    },
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Batch processing with strict FDA compliance, equipment cleaning validations, and campaign scheduling",
      solution: "Campaign-aware Gantt scheduling with cleaning time management, batch genealogy tracking, and regulatory compliance automation",
      results: [
        "100% FDA audit compliance",
        "40% improvement in batch cycle times",
        "60% reduction in cleaning-related delays",
        "25% increase in equipment utilization"
      ],
      testimonial: "PlanetTogether's scheduling system ensures we never miss a cleaning validation or regulatory requirement while maximizing our production efficiency.",
      customer: "Operations Director, Leading Pharmaceutical Company"
    },
    {
      industry: "Aerospace Manufacturing",
      challenge: "Long lead-time projects with critical path dependencies and stringent quality requirements",
      solution: "Project-based Gantt scheduling with critical path analysis, milestone tracking, and quality gate management",
      results: [
        "95% on-time project delivery",
        "30% reduction in project duration",
        "100% quality gate compliance",
        "50% improvement in resource coordination"
      ],
      testimonial: "The critical path visualization and constraint management capabilities have revolutionized how we manage complex aerospace projects.",
      customer: "Program Manager, Aerospace Defense Contractor"
    }
  ];

  const competitiveComparison = [
    {
      feature: "Gantt Chart Quality",
      planetTogether: "Enterprise Bryntum Scheduler Pro with advanced features",
      competitors: "Basic HTML5 Gantt charts with limited functionality",
      advantage: "Professional-grade scheduling interface used by Fortune 500 companies"
    },
    {
      feature: "Optimization Algorithms",
      planetTogether: "6+ advanced algorithms including TOC and multi-objective",
      competitors: "Basic ASAP/ALAP scheduling only",
      advantage: "Sophisticated optimization typically found only in high-end APS systems"
    },
    {
      feature: "Real-Time Updates",
      planetTogether: "Live synchronization across all users and systems",
      competitors: "Batch updates or manual refresh required",
      advantage: "True real-time collaboration and immediate response to changes"
    },
    {
      feature: "Mobile Capability",
      planetTogether: "Native mobile Gantt with touch optimization and voice control",
      competitors: "Desktop-only or basic mobile viewing",
      advantage: "Full scheduling capability from any device, anywhere"
    },
    {
      feature: "AI Integration",
      planetTogether: "AI-powered optimization suggestions with reasoning display",
      competitors: "Manual scheduling with no AI assistance",
      advantage: "Intelligent automation that learns and improves over time"
    }
  ];

  const roiCalculator = [
    {
      metric: "Scheduling Time Reduction",
      baseline: "8 hours/week for manual scheduling",
      withPT: "2 hours/week with automated scheduling",
      savings: "6 hours/week × $75/hour = $450/week",
      annualValue: "$23,400 per scheduler annually"
    },
    {
      metric: "Improved Resource Utilization",
      baseline: "70% average equipment utilization",
      withPT: "90% utilization with optimized scheduling",
      savings: "20% increase in productive capacity",
      annualValue: "$500K+ additional revenue on $2.5M equipment"
    },
    {
      metric: "Reduced Expediting Costs",
      baseline: "$50K/month in expediting fees",
      withPT: "$10K/month with proactive scheduling",
      savings: "$40K/month in reduced expediting",
      annualValue: "$480,000 annual savings"
    },
    {
      metric: "Faster Response to Changes",
      baseline: "4 hours to reschedule after disruption",
      withPT: "15 minutes with automatic rescheduling",
      savings: "3.75 hours × $200/hour disruption cost",
      annualValue: "$750 per disruption event"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="w-10 h-10 text-green-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Advanced Production Scheduling
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              The World's Most Advanced
              <span className="block text-green-300">Manufacturing Gantt Scheduler</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Enterprise-grade Gantt scheduling with AI optimization, real-time collaboration, 
              and mobile control. Schedule smarter, deliver faster, optimize everything.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Gantt Demo (5 min)
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Try Interactive Scheduler
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Drag & drop scheduling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>6+ optimization algorithms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Real-time collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Scheduling Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-600">
              <Cpu className="w-4 h-4 mr-2" />
              Enterprise Scheduling Platform
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Revolutionary Scheduling Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Go beyond basic scheduling with advanced features that transform how you plan, 
              execute, and optimize your manufacturing operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreSchedulingFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <p className="text-gray-600 text-base leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Proven Performance Impact</span>
                    </div>
                    <p className="text-green-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Competitive Edge</span>
                    </div>
                    <p className="text-blue-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduling Algorithms */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Advanced Optimization Algorithms
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from six sophisticated scheduling algorithms, each optimized for different 
              business objectives and manufacturing environments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedulingAlgorithms.map((algorithm, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {algorithm.icon}
                    </div>
                    <CardTitle className="text-lg">{algorithm.name}</CardTitle>
                  </div>
                  <p className="text-gray-600">{algorithm.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Best For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {algorithm.useCases.map((useCase, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm">
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Benefits:</h4>
                      <ul className="space-y-1">
                        {algorithm.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gantt Capabilities Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Enterprise Gantt Chart Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade Gantt scheduling with capabilities typically found only in 
              specialized project management and APS systems.
            </p>
          </div>

          <div className="space-y-12">
            {ganttCapabilities.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{category.category}</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card key={featureIndex} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <p className="text-gray-600">{feature.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-800">Impact</span>
                          </div>
                          <span className="text-green-700 font-medium">{feature.impact}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Applications */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how advanced Gantt scheduling transforms operations in complex manufacturing environments.
            </p>
          </div>

          <div className="space-y-12">
            {industryApplications.map((application, index) => (
              <Card key={index} className="overflow-hidden shadow-xl">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-8 bg-gradient-to-br from-blue-600 to-green-600 text-white">
                    <Badge className="bg-white/20 text-white mb-4">{application.industry}</Badge>
                    <h3 className="text-2xl font-bold mb-4">The Challenge</h3>
                    <p className="text-blue-100 mb-6 text-lg">{application.challenge}</p>
                    
                    <h3 className="text-2xl font-bold mb-4">Our Solution</h3>
                    <p className="text-blue-100 text-lg">{application.solution}</p>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Measurable Results</h3>
                    <div className="space-y-4 mb-8">
                      {application.results.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{result}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
                      <p className="text-gray-700 italic text-lg mb-3">"{application.testimonial}"</p>
                      <p className="text-gray-600 font-medium">— {application.customer}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Why Our Gantt Scheduling Leads the Market
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare our enterprise-grade scheduling capabilities with traditional manufacturing software solutions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <th className="p-4 text-left font-semibold">Scheduling Capability</th>
                  <th className="p-4 text-center font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      PlanetTogether
                    </div>
                  </th>
                  <th className="p-4 text-center font-semibold">Traditional MES/ERP</th>
                  <th className="p-4 text-center font-semibold">Your Advantage</th>
                </tr>
              </thead>
              <tbody>
                {competitiveComparison.map((item, index) => (
                  <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="p-4 font-semibold text-gray-900">{item.feature}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 font-medium">{item.planetTogether}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-red-600">{item.competitors}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">{item.advantage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Calculate Your Scheduling ROI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See the measurable financial impact of advanced Gantt scheduling on your operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {roiCalculator.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-center">{item.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Current State</h4>
                      <p className="text-red-700">{item.baseline}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">With PlanetTogether</h4>
                      <p className="text-green-700">{item.withPT}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Monthly Savings</h4>
                      <p className="text-blue-700">{item.savings}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <h4 className="font-bold text-yellow-800 text-lg">{item.annualValue}</h4>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-green-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="w-8 h-8 text-green-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Ready to Transform Your Scheduling?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Experience Advanced Gantt Scheduling Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              See the world's most advanced manufacturing Gantt scheduler in action. 
              Interactive demo, free trial, and expert consultation available.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Interactive Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/ai-features')}
              >
                <Bot className="w-5 h-5 mr-2" />
                AI Features
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Setup in minutes
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ROI in weeks
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise secure
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Expert support included
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductionSchedulingPage;