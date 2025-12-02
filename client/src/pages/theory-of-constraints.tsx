import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Factory, 
  Clock, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Database, 
  Play,
  Star,
  Eye,
  Workflow,
  Gauge,
  Users,
  FileText,
  MessageSquare,
  Bot,
  Lightbulb,
  Search,
  Layers,
  MousePointer,
  Settings,
  Calendar,
  Building2,
  Boxes,
  MapPin,
  LineChart,
  PieChart,
  Activity,
  Smartphone,
  Link,
  Maximize,
  Minimize,
  Filter,
  GitBranch,
  Shuffle,
  RotateCw
} from "lucide-react";
import { useLocation } from "wouter";

const TheoryOfConstraintsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeConstraintType, setActiveConstraintType] = useState("capacity");

  const coreTocFeatures = [
    {
      title: "Automated Constraint Identification",
      icon: <Target className="w-8 h-8" />,
      description: "AI-powered analysis automatically identifies bottlenecks across your entire production system in real-time",
      benefits: [
        "Real-time bottleneck detection using production data analysis",
        "Constraint propagation tracking through multi-stage processes",
        "Historical constraint pattern analysis and prediction",
        "Constraint impact quantification with throughput calculations",
        "Multi-constraint scenario modeling and resolution prioritization",
        "Visual constraint mapping with dependency relationships"
      ],
      roiImpact: "50% faster constraint identification, 35% improvement in throughput optimization",
      competitiveDifferentiator: "First manufacturing platform with AI-powered constraint detection that learns your production patterns"
    },
    {
      title: "Drum-Buffer-Rope Scheduling",
      icon: <Workflow className="w-8 h-8" />,
      description: "Advanced TOC scheduling methodology that focuses all resources around your critical constraints (drums)",
      benefits: [
        "Automated drum resource identification and protection",
        "Dynamic buffer sizing based on constraint variability",
        "Rope mechanism for upstream process synchronization",
        "Buffer management with automatic adjustment algorithms",
        "Constraint elevation planning with capacity analysis",
        "Real-time schedule adjustments for constraint protection"
      ],
      roiImpact: "25% increase in system throughput, 40% reduction in work-in-process inventory",
      competitiveDifferentiator: "Complete DBR implementation with automated buffer management and constraint protection"
    },
    {
      title: "Throughput Accounting & Measurement",
      icon: <BarChart3 className="w-8 h-8" />,
      description: "TOC-based financial metrics that focus on throughput, inventory, and operational expense optimization",
      benefits: [
        "Throughput calculation with real-time constraint impact analysis",
        "Inventory valuation using TOC principles and flow optimization",
        "Operational expense allocation with constraint-based costing",
        "Return on investment calculations for constraint improvements",
        "Product mix optimization based on throughput per constraint hour",
        "Make-vs-buy decisions using TOC financial analysis"
      ],
      roiImpact: "30% improvement in profitability analysis, 20% better resource allocation decisions",
      competitiveDifferentiator: "Integrated TOC accounting that provides true constraint-based financial insights"
    },
    {
      title: "Five Focusing Steps Automation",
      icon: <Lightbulb className="w-8 h-8" />,
      description: "Systematic constraint management following Goldratt's five focusing steps with AI-guided improvement",
      benefits: [
        "Step 1: Automated constraint identification with data analytics",
        "Step 2: AI-powered exploitation recommendations for maximum output",
        "Step 3: Subordination rules engine for non-constraint optimization",
        "Step 4: Constraint elevation planning with ROI analysis",
        "Step 5: Inertia prevention with continuous monitoring loops",
        "Iterative improvement tracking with constraint migration analysis"
      ],
      roiImpact: "60% faster improvement cycle implementation, 45% sustainable throughput gains",
      competitiveDifferentiator: "Complete automation of TOC methodology with AI-guided decision support at each step"
    }
  ];

  const constraintTypes = [
    {
      type: "Capacity Constraints",
      description: "Physical limitations in production capacity",
      examples: ["Machine capacity", "Labor availability", "Processing time"],
      identification: "Utilization analysis, queue time monitoring, throughput measurement",
      solutions: ["Capacity increases", "Efficiency improvements", "Load balancing"],
      icon: <Factory className="w-6 h-6" />
    },
    {
      type: "Material Constraints",
      description: "Supply chain and inventory limitations",
      examples: ["Raw material shortages", "Component availability", "Supplier delays"],
      identification: "Inventory analysis, supplier performance, demand vs supply",
      solutions: ["Supplier development", "Safety stock optimization", "Alternative sourcing"],
      icon: <Boxes className="w-6 h-6" />
    },
    {
      type: "Market Constraints",
      description: "Demand limitations and market factors",
      examples: ["Customer demand", "Sales capacity", "Market conditions"],
      identification: "Demand analysis, sales pipeline, market research",
      solutions: ["Marketing initiatives", "Product development", "Market expansion"],
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      type: "Policy Constraints",
      description: "Internal rules and procedures that limit performance",
      examples: ["Work rules", "Quality procedures", "Approval processes"],
      identification: "Process analysis, policy review, exception tracking",
      solutions: ["Policy revision", "Process improvement", "Exception management"],
      icon: <FileText className="w-6 h-6" />
    },
    {
      type: "Skill Constraints",
      description: "Human resource and knowledge limitations",
      examples: ["Technical skills", "Training gaps", "Certification requirements"],
      identification: "Skill assessments, training records, performance analysis",
      solutions: ["Training programs", "Cross-training", "Skill development"],
      icon: <Users className="w-6 h-6" />
    },
    {
      type: "Quality Constraints",
      description: "Quality-related bottlenecks and limitations",
      examples: ["Defect rates", "Rework requirements", "Inspection capacity"],
      identification: "Quality metrics, defect analysis, inspection throughput",
      solutions: ["Quality improvement", "Error prevention", "Inspection optimization"],
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const tocMethodology = [
    {
      step: "1. IDENTIFY",
      title: "Find the System's Constraint",
      description: "Locate the bottleneck that limits overall system performance",
      actions: [
        "Analyze production flow and identify queues",
        "Measure capacity utilization across all resources",
        "Calculate throughput rates at each process step",
        "Identify the resource with highest utilization"
      ],
      tools: ["Capacity analysis", "Queue monitoring", "Throughput measurement", "Utilization tracking"],
      icon: <Search className="w-8 h-8" />
    },
    {
      step: "2. EXPLOIT",
      title: "Maximize Constraint Performance", 
      description: "Get the most out of the constraint without major investments",
      actions: [
        "Eliminate constraint downtime and setup reductions",
        "Ensure constraint always has work (never starved)",
        "Improve constraint efficiency and quality",
        "Optimize constraint scheduling and priorities"
      ],
      tools: ["Setup reduction", "Preventive maintenance", "Quality improvement", "Priority scheduling"],
      icon: <Maximize className="w-8 h-8" />
    },
    {
      step: "3. SUBORDINATE",
      title: "Align Everything to Support the Constraint",
      description: "Make all other resources work to support the constraint's rhythm",
      actions: [
        "Schedule non-constraints based on constraint needs",
        "Build protective buffers before the constraint",
        "Avoid overproduction at non-constraint resources",
        "Coordinate all activities around constraint schedule"
      ],
      tools: ["Buffer management", "Synchronized scheduling", "Flow control", "Resource coordination"],
      icon: <Link className="w-8 h-8" />
    },
    {
      step: "4. ELEVATE",
      title: "Increase Constraint Capacity",
      description: "Invest in expanding the constraint's capacity when exploitation is maximized",
      actions: [
        "Add constraint capacity through equipment or people",
        "Improve constraint technology and capabilities",
        "Eliminate constraint waste and inefficiencies",
        "Consider constraint relocation or redesign"
      ],
      tools: ["Capacity expansion", "Technology upgrade", "Process improvement", "Investment analysis"],
      icon: <TrendingUp className="w-8 h-8" />
    },
    {
      step: "5. REPEAT",
      title: "Prevent Inertia & Find New Constraints",
      description: "When constraint moves, start over and avoid letting inertia become the constraint",
      actions: [
        "Monitor for constraint migration to new resources",
        "Update policies and procedures for new reality",
        "Train teams on new constraint management needs",
        "Prevent old constraint thinking from limiting performance"
      ],
      tools: ["Continuous monitoring", "Policy updates", "Training programs", "Change management"],
      icon: <RotateCw className="w-8 h-8" />
    }
  ];

  const industryApplications = [
    {
      industry: "Automotive Manufacturing",
      challenge: "Complex assembly line with multiple feeding processes and varying cycle times creating bottlenecks",
      constraint: "Paint booth capacity limiting overall production throughput",
      solution: "DBR scheduling with paint booth as drum, protective buffers, and upstream synchronization",
      results: [
        "28% increase in production throughput",
        "45% reduction in work-in-process inventory",
        "90% improvement in on-time delivery",
        "35% reduction in production lead times"
      ],
      testimonial: "TOC transformed our understanding of our production system. We focused on the paint booth constraint and saw immediate improvements across the entire line.",
      customer: "Manufacturing Director, Global Auto Manufacturer"
    },
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Batch processing with complex cleaning validations and regulatory requirements creating capacity constraints",
      constraint: "Reactor capacity and cleaning validation time limiting batch production",
      solution: "Campaign scheduling optimization, cleaning time reduction, and buffer management around reactors",
      results: [
        "40% improvement in reactor utilization",
        "25% increase in batch throughput",
        "60% reduction in campaign changeover time",
        "100% regulatory compliance maintained"
      ],
      testimonial: "By focusing on our reactor constraints and implementing proper buffer management, we achieved significant throughput gains while maintaining full compliance.",
      customer: "Operations Director, Leading Pharmaceutical Company"
    },
    {
      industry: "Food Production",
      challenge: "Multi-product facility with varying processing times and seasonal demand patterns",
      constraint: "Packaging line capacity limiting overall facility throughput during peak seasons",
      solution: "Constraint-based production planning, packaging optimization, and demand smoothing strategies",
      results: [
        "35% increase in peak season throughput",
        "50% reduction in packaging line downtime",
        "30% improvement in product changeover efficiency",
        "20% reduction in overtime costs"
      ],
      testimonial: "Understanding our packaging constraint allowed us to redesign our entire production approach. We now handle peak demand without the chaos we used to experience.",
      customer: "Plant Manager, Regional Food Processor"
    }
  ];

  const competitiveComparison = [
    {
      feature: "Constraint Identification",
      planetTogether: "AI-powered real-time constraint detection with predictive analytics",
      competitors: "Manual analysis with periodic reviews",
      advantage: "Continuous constraint monitoring with early warning systems"
    },
    {
      feature: "DBR Implementation",
      planetTogether: "Complete automated DBR with dynamic buffer management",
      competitors: "Basic scheduling without true DBR methodology",
      advantage: "Full TOC methodology implementation with proven results"
    },
    {
      feature: "Throughput Accounting",
      planetTogether: "Integrated TOC financial metrics with real-time calculations",
      competitors: "Traditional cost accounting without constraint focus",
      advantage: "True constraint-based financial insights for better decision making"
    },
    {
      feature: "Five Focusing Steps",
      planetTogether: "Automated workflow with AI guidance through each step",
      competitors: "Manual process requiring extensive TOC expertise",
      advantage: "Systematic constraint improvement with built-in methodology"
    },
    {
      feature: "Multi-Constraint Handling",
      planetTogether: "Simultaneous multi-constraint optimization with priority ranking",
      competitors: "Single constraint focus without system-wide optimization",
      advantage: "Complete system optimization across all constraint types"
    }
  ];

  const roiCalculator = [
    {
      metric: "Throughput Improvement",
      baseline: "Current system throughput with hidden constraints",
      withTOC: "25-50% throughput increase through constraint focus",
      calculation: "Increased output × contribution margin",
      annualValue: "$2-5M additional revenue on $10M production facility"
    },
    {
      metric: "Inventory Reduction", 
      baseline: "$5M work-in-process inventory with traditional scheduling",
      withTOC: "$3M WIP with DBR buffer management",
      calculation: "$2M inventory reduction × 20% carrying cost",
      annualValue: "$400,000 annual inventory carrying cost savings"
    },
    {
      metric: "Lead Time Reduction",
      baseline: "6 weeks average production lead time",
      withTOC: "3 weeks with constraint-focused flow",
      calculation: "50% lead time reduction enabling premium pricing",
      annualValue: "$500,000 additional margin from faster delivery"
    },
    {
      metric: "Operational Efficiency",
      baseline: "75% overall equipment effectiveness",
      withTOC: "90% OEE with constraint protection",
      calculation: "15% efficiency gain across production assets",
      annualValue: "$1,200,000 additional capacity value"
    }
  ];

  const kpiMetrics = [
    { name: "System Throughput", description: "Revenue per time period", target: "+25-50%", color: "text-green-600" },
    { name: "Inventory Turns", description: "Cost of goods sold / Average inventory", target: "+40%", color: "text-blue-600" },
    { name: "Lead Time", description: "Customer order to delivery time", target: "-50%", color: "text-purple-600" },
    { name: "OEE", description: "Overall equipment effectiveness", target: "+15%", color: "text-orange-600" },
    { name: "Constraint Utilization", description: "Bottleneck resource utilization", target: "95%+", color: "text-red-600" },
    { name: "Buffer Status", description: "Protective buffer health", target: "Green 90%+", color: "text-green-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-900 via-red-900 to-pink-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Target className="w-10 h-10 text-orange-300" />
              <Badge className="bg-orange-600/50 text-white border-orange-400 text-lg px-4 py-2">
                Theory of Constraints (TOC)
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Breakthrough Manufacturing Performance
              <span className="block text-orange-300">Through Constraint Management</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-red-100 max-w-4xl mx-auto">
              Unlock your system's potential with AI-powered Theory of Constraints. 
              Find bottlenecks, maximize throughput, and achieve dramatic performance improvements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch TOC Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Target className="w-5 h-5 mr-2" />
                Try Constraint Analyzer
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-red-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400" />
                <span>25-50% throughput gains</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400" />
                <span>AI constraint detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400" />
                <span>Complete DBR automation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core TOC Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-orange-600 border-orange-600">
              <Target className="w-4 h-4 mr-2" />
              Advanced TOC Implementation
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Constraint Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete Theory of Constraints implementation with AI-powered automation, 
              advanced analytics, and proven methodology for breakthrough performance.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreTocFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-orange-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors">
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
                          <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-800">Proven Impact</span>
                    </div>
                    <p className="text-orange-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">Competitive Edge</span>
                    </div>
                    <p className="text-red-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Five Focusing Steps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              The Five Focusing Steps - Automated
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Goldratt's proven methodology for continuous improvement, enhanced with 
              AI automation and intelligent guidance for faster, more effective results.
            </p>
          </div>

          <div className="space-y-8">
            {tocMethodology.map((step, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-8 bg-gradient-to-br from-orange-600 to-red-600 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        {step.icon}
                      </div>
                      <div>
                        <Badge className="bg-white/20 text-white mb-2">{step.step}</Badge>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-orange-100 text-lg mb-6">{step.description}</p>
                    
                    <h4 className="text-xl font-semibold mb-4">Key Actions:</h4>
                    <ul className="space-y-2">
                      {step.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-orange-300 mt-0.5 flex-shrink-0" />
                          <span className="text-orange-100">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">Available Tools & Methods</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {step.tools.map((tool, idx) => (
                        <div key={idx} className="bg-orange-50 rounded-lg p-3 text-center">
                          <span className="text-orange-700 font-medium">{tool}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold text-gray-800">AI Assistance</span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Automated guidance and recommendations for executing this step effectively, 
                          with real-time data analysis and performance tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Constraint Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Six Types of Manufacturing Constraints
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive constraint identification and management across all areas 
              that can limit your manufacturing system performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {constraintTypes.map((constraint, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      {constraint.icon}
                    </div>
                    <CardTitle className="text-lg">{constraint.type}</CardTitle>
                  </div>
                  <p className="text-gray-600">{constraint.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Common Examples:</h4>
                    <div className="flex flex-wrap gap-2">
                      {constraint.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Identification Methods:</h4>
                    <p className="text-sm text-gray-600">{constraint.identification}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Solution Approaches:</h4>
                    <p className="text-sm text-gray-600">{constraint.solutions}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Applications */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Real-World TOC Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Theory of Constraints delivers breakthrough performance 
              improvements across diverse manufacturing environments.
            </p>
          </div>

          <div className="space-y-12">
            {industryApplications.map((application, index) => (
              <Card key={index} className="overflow-hidden shadow-xl">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-8 bg-gradient-to-br from-orange-600 to-red-600 text-white">
                    <Badge className="bg-white/20 text-white mb-4">{application.industry}</Badge>
                    <h3 className="text-2xl font-bold mb-4">The Challenge</h3>
                    <p className="text-orange-100 mb-6 text-lg">{application.challenge}</p>
                    
                    <h3 className="text-2xl font-bold mb-4">Identified Constraint</h3>
                    <p className="text-orange-100 mb-6 text-lg">{application.constraint}</p>
                    
                    <h3 className="text-2xl font-bold mb-4">TOC Solution</h3>
                    <p className="text-orange-100 text-lg">{application.solution}</p>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Measurable Results</h3>
                    <div className="space-y-4 mb-8">
                      {application.results.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{result}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-orange-500">
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

      {/* KPI Metrics */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              TOC Key Performance Indicators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track your constraint management success with metrics that matter 
              for sustainable throughput improvements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiMetrics.map((kpi, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                  <p className="text-sm text-gray-600">{kpi.description}</p>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${kpi.color} mb-2`}>
                    {kpi.target}
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3">
                    <div className="text-sm text-orange-800 mb-1">Typical Improvement</div>
                    <div className="text-lg font-bold text-orange-700">
                      Through TOC Implementation
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-900 to-red-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Target className="w-8 h-8 text-orange-300" />
              <Badge className="bg-orange-600/50 text-white border-orange-400 text-lg px-4 py-2">
                Ready for Breakthrough Performance?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Unlock Your System's True Potential
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience the power of Theory of Constraints with AI automation. 
              Find your constraints, maximize throughput, and achieve lasting improvements.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch TOC Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Target className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/production-scheduling')}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Scheduling Features
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Results in weeks
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Proven ROI
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise ready
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Expert guidance included
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TheoryOfConstraintsPage;