import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Brain, 
  Eye, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Settings, 
  Target, 
  Lightbulb, 
  RefreshCw, 
  AlertTriangle, 
  Mic, 
  Upload, 
  Search, 
  Bot, 
  Cpu, 
  Database, 
  Globe, 
  Play,
  Star
} from "lucide-react";
import { useLocation } from "wouter";

const AiFeaturesPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const investorHighlights = [
    { metric: "AI Market Size", value: "$4.2B", growth: "by 2025", description: "Manufacturing AI TAM" },
    { metric: "Customer Adoption", value: "85%", growth: "AI feature usage", description: "Active AI engagement" },
    { metric: "ROI Achievement", value: "6 months", growth: "avg. payback", description: "Customer ROI timeline" },
    { metric: "Patent Portfolio", value: "12+", growth: "AI patents", description: "Proprietary technology" }
  ];

  const customerTestimonials = [
    {
      quote: "The transparent AI reasoning has been a game-changer. Our operators trust the system because they can see exactly why decisions are made.",
      author: "Maria Rodriguez",
      title: "VP Operations",
      company: "PharmaTech Industries",
      results: "35% efficiency improvement",
      rating: 5
    },
    {
      quote: "Voice control on the shop floor has transformed how we interact with our systems. It's like having an expert assistant always available.",
      author: "John Chen",
      title: "Plant Manager",
      company: "Automotive Solutions Inc",
      results: "60% faster data access",
      rating: 5
    },
    {
      quote: "The AI playbook system captured decades of our expertise and made it accessible to everyone. New operators are productive in days, not months.",
      author: "Sarah Williams",
      title: "Director of Manufacturing",
      company: "Chemical Corp",
      results: "50% training reduction",
      rating: 5
    }
  ];

  const coreAiFeatures = [
    {
      title: "Max AI Assistant with Transparent Reasoning",
      icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />,
      description: "The first manufacturing AI that shows you exactly how it thinks and makes decisions",
      mobileDescription: "AI that shows its thinking process",
      benefits: [
        "See step-by-step AI reasoning for every recommendation",
        "Understand confidence levels and uncertainty factors",
        "Trust AI decisions with full transparency and explainability",
        "Learn from AI logic to improve your own decision-making"
      ],
      roiImpact: "35% faster decision-making with 90% confidence in AI recommendations",
      metrics: { value: "90%", label: "Decision Confidence" },
      competitiveDifferentiator: "Unlike black-box AI systems, Max AI shows its complete thought process, building trust through transparency"
    },
    {
      title: "AI Playbook Integration & Knowledge System",
      icon: <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />,
      description: "Collaborative knowledge management where AI learns from your manufacturing expertise",
      mobileDescription: "AI that learns from your expertise",
      benefits: [
        "AI learns from your proven manufacturing processes and best practices",
        "Collaborative playbook creation with intelligent suggestions",
        "Knowledge base that evolves with your organization",
        "AI recommendations based on your specific context and history"
      ],
      roiImpact: "50% reduction in training time for new operators, 25% improvement in process consistency",
      metrics: { value: "50%", label: "Training Reduction" },
      competitiveDifferentiator: "First AI system that truly learns and adapts to your specific manufacturing environment and expertise"
    },
    {
      title: "Natural Language Voice Control",
      icon: <Mic className="w-6 h-6 sm:w-8 sm:h-8" />,
      description: "Control your entire manufacturing system using natural speech commands",
      mobileDescription: "Voice-controlled manufacturing",
      benefits: [
        "Hands-free operation for shop floor environments",
        "Natural conversation with your manufacturing data",
        "Voice-activated scheduling and resource management",
        "Accessibility for users with different technical backgrounds"
      ],
      roiImpact: "60% faster data access, 40% reduction in training requirements",
      metrics: { value: "60%", label: "Faster Access" },
      competitiveDifferentiator: "Industry's most advanced voice interface specifically designed for manufacturing operations"
    },
    {
      title: "AI File Analysis & Vision",
      icon: <Upload className="w-6 h-6 sm:w-8 sm:h-8" />,
      description: "Upload and analyze any manufacturing document, drawing, or image with AI",
      mobileDescription: "AI document & image analysis",
      benefits: [
        "Instant analysis of technical drawings and specifications",
        "Extract production requirements from any document format",
        "Visual quality inspection with AI-powered image recognition",
        "Automated data extraction from legacy documents"
      ],
      roiImpact: "80% faster document processing, 95% reduction in manual data entry errors",
      metrics: { value: "95%", label: "Error Reduction" },
      competitiveDifferentiator: "Only manufacturing platform with built-in AI vision and document intelligence"
    }
  ];

  const aiCapabilities = [
    {
      category: "Production Intelligence",
      description: "AI-powered production optimization and intelligent scheduling",
      features: [
        {
          name: "Autonomous Schedule Optimization",
          description: "AI continuously optimizes production schedules in real-time",
          impact: "25% improvement in on-time delivery",
          icon: <Clock className="w-6 h-6" />
        },
        {
          name: "Bottleneck Detection & Resolution",
          description: "AI identifies constraints and automatically suggests solutions",
          impact: "30% increase in throughput efficiency",
          icon: <Target className="w-6 h-6" />
        },
        {
          name: "Predictive Resource Allocation",
          description: "AI forecasts resource needs and prevents shortages",
          impact: "20% reduction in resource waste",
          icon: <BarChart3 className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Quality Intelligence",
      description: "AI-driven quality management and predictive quality control",
      features: [
        {
          name: "Defect Prediction",
          description: "AI predicts quality issues before they occur",
          impact: "50% reduction in defect rates",
          icon: <Eye className="w-6 h-6" />
        },
        {
          name: "Process Deviation Detection",
          description: "AI monitors processes and alerts to deviations instantly",
          impact: "90% faster issue detection",
          icon: <AlertTriangle className="w-6 h-6" />
        },
        {
          name: "Automated Quality Reports",
          description: "AI generates comprehensive quality analysis reports",
          impact: "75% reduction in reporting time",
          icon: <FileText className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Supply Chain Intelligence",
      description: "AI-optimized inventory management and demand forecasting",
      features: [
        {
          name: "Demand Forecasting",
          description: "AI predicts demand with industry-leading accuracy",
          impact: "85% forecast accuracy improvement",
          icon: <TrendingUp className="w-6 h-6" />
        },
        {
          name: "Inventory Optimization",
          description: "AI optimizes stock levels to minimize costs while ensuring availability",
          impact: "30% reduction in inventory carrying costs",
          icon: <Database className="w-6 h-6" />
        },
        {
          name: "Supplier Performance Prediction",
          description: "AI analyzes supplier patterns and predicts delivery performance",
          impact: "40% improvement in supplier reliability",
          icon: <Users className="w-6 h-6" />
        }
      ]
    }
  ];

  const competitiveComparison = [
    {
      feature: "AI Transparency & Reasoning",
      planetTogether: "Full reasoning display with confidence scoring",
      competitors: "Black-box recommendations without explanation",
      advantage: "Build trust and understanding in AI decisions"
    },
    {
      feature: "Manufacturing-Specific AI",
      planetTogether: "Purpose-built for production environments",
      competitors: "Generic AI adapted for manufacturing",
      advantage: "Superior accuracy and relevance for manufacturing use cases"
    },
    {
      feature: "Voice Control",
      planetTogether: "Native voice interface with manufacturing vocabulary",
      competitors: "Limited or no voice capabilities",
      advantage: "Hands-free operation ideal for shop floor environments"
    },
    {
      feature: "Knowledge Integration",
      planetTogether: "AI learns from your playbooks and processes",
      competitors: "Static AI that doesn't adapt to your environment",
      advantage: "Continuously improving AI that understands your specific context"
    },
    {
      feature: "File Analysis",
      planetTogether: "Built-in document and image AI analysis",
      competitors: "Requires separate tools or manual data entry",
      advantage: "Streamlined workflow with integrated AI vision"
    }
  ];

  const useCases = [
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Complex regulatory compliance and batch tracking requirements",
      solution: "Max AI analyzes batch records, predicts compliance risks, and suggests corrective actions with full audit trails",
      results: [
        "90% reduction in compliance review time",
        "Zero regulatory violations in 18 months",
        "50% faster batch release cycles"
      ],
      testimonial: "Max AI has transformed our compliance processes. We can now trust AI recommendations because we see exactly how decisions are made.",
      customer: "Director of Quality, Global Pharma Corp"
    },
    {
      industry: "Automotive Manufacturing",
      challenge: "Just-in-time delivery with complex supply chain dependencies",
      solution: "AI continuously optimizes production schedules, predicts supplier delays, and automatically adjusts plans to maintain delivery commitments",
      results: [
        "98% on-time delivery achievement",
        "35% reduction in expediting costs",
        "25% improvement in line efficiency"
      ],
      testimonial: "The transparency of Max AI's decision-making process gives us confidence to rely on automated scheduling for our critical production lines.",
      customer: "Manufacturing Director, Tier 1 Automotive Supplier"
    },
    {
      industry: "Food Production",
      challenge: "Managing perishable inventory with fluctuating demand and shelf-life constraints",
      solution: "AI forecasts demand patterns, optimizes production schedules around expiration dates, and minimizes waste through intelligent inventory management",
      results: [
        "40% reduction in food waste",
        "20% improvement in freshness metrics",
        "15% increase in profit margins"
      ],
      testimonial: "Max AI helps us balance freshness, waste reduction, and customer satisfaction better than any human planner could.",
      customer: "Operations Manager, Regional Food Processor"
    }
  ];

  const pricingImpact = [
    {
      metric: "Implementation Time",
      traditional: "6-12 months",
      withMaxAi: "2-4 weeks",
      improvement: "75% faster deployment"
    },
    {
      metric: "Training Requirements",
      traditional: "40+ hours per user",
      withMaxAi: "4-8 hours per user",
      improvement: "80% reduction in training time"
    },
    {
      metric: "Decision Speed",
      traditional: "Hours to days",
      withMaxAi: "Minutes to hours",
      improvement: "90% faster decision-making"
    },
    {
      metric: "Accuracy",
      traditional: "70-80% forecast accuracy",
      withMaxAi: "90-95% forecast accuracy",
      improvement: "20% improvement in accuracy"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-xs sm:text-sm lg:text-lg px-3 sm:px-4 py-1 sm:py-2">
                Industry-Leading AI Technology
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">
              AI That Shows Its Work:
              <span className="block text-yellow-300 mt-2">Transparent Manufacturing Intelligence</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
              The first manufacturing AI that explains every decision. 
              <span className="hidden sm:inline">Learns from your expertise and continuously improves with complete transparency.</span>
            </p>
            
            {/* Mobile-friendly pricing indicator */}
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-blue-200">
                Starting at <span className="font-bold text-yellow-300">$999/month</span> for AI features
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg shadow-xl"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Watch AI Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-blue-100 px-4 sm:px-0">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span>See AI reasoning</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span>Voice control</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span>Learns from you</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investor Highlights - NEW Mobile Optimized */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {investorHighlights.map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">
                    {item.value}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mb-0.5">{item.metric}</div>
                  <Badge variant="secondary" className="text-xs">
                    {item.growth}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core AI Features - Mobile Optimized */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-blue-600 border-blue-600 text-xs sm:text-sm">
              <Cpu className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Revolutionary AI Technology
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6 px-2">
              Four Game-Changing AI Capabilities
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-6 lg:px-0">
              Transparent, trustworthy AI designed for manufacturing.
              <span className="hidden sm:inline"> Transform operations with AI that shows its work.</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {coreAiFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-200">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">
                        <span className="sm:hidden">{feature.title.split(' ').slice(0, 3).join(' ')}</span>
                        <span className="hidden sm:inline">{feature.title}</span>
                      </CardTitle>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        <span className="sm:hidden">{feature.mobileDescription}</span>
                        <span className="hidden sm:inline">{feature.description}</span>
                      </p>
                      {feature.metrics && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                          <span className="text-xl sm:text-2xl font-bold text-green-600">{feature.metrics.value}</span>
                          <span className="text-xs sm:text-sm text-green-700">{feature.metrics.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="hidden sm:block">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-xs sm:text-sm font-semibold text-green-800">ROI Impact</span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-700 font-medium">{feature.roiImpact}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities by Category */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              AI-Powered Intelligence Across Your Operations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Max AI integrates seamlessly into every aspect of your manufacturing operations, 
              providing intelligent insights and automated optimization where you need it most.
            </p>
          </div>

          <div className="space-y-12">
            {aiCapabilities.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.category}</h3>
                  <p className="text-lg text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card key={featureIndex} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-4">
                          <div className="text-blue-600">
                            {feature.icon}
                          </div>
                        </div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <div className="bg-green-100 rounded-lg p-3">
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

      {/* Competitive Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Why Max AI Leads the Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how PlanetTogether's AI capabilities compare to traditional manufacturing software and generic AI solutions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <th className="p-4 text-left font-semibold">AI Capability</th>
                  <th className="p-4 text-center font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      PlanetTogether Max AI
                    </div>
                  </th>
                  <th className="p-4 text-center font-semibold">Traditional Solutions</th>
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

      {/* Industry Use Cases */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Real-World AI Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how manufacturers across industries are achieving breakthrough results with Max AI's transparent intelligence.
            </p>
          </div>

          <div className="space-y-12">
            {useCases.map((useCase, index) => (
              <Card key={index} className="overflow-hidden shadow-xl">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <Badge className="bg-white/20 text-white mb-4">{useCase.industry}</Badge>
                    <h3 className="text-2xl font-bold mb-4">The Challenge</h3>
                    <p className="text-blue-100 mb-6 text-lg">{useCase.challenge}</p>
                    
                    <h3 className="text-2xl font-bold mb-4">Max AI Solution</h3>
                    <p className="text-blue-100 text-lg">{useCase.solution}</p>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Measurable Results</h3>
                    <div className="space-y-4 mb-8">
                      {useCase.results.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{result}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                      <p className="text-gray-700 italic text-lg mb-3">"{useCase.testimonial}"</p>
                      <p className="text-gray-600 font-medium">— {useCase.customer}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI & Implementation Impact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Faster Implementation, Better Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Max AI's transparent, user-friendly design means faster deployment and immediate value realization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingImpact.map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Traditional Approach</p>
                      <p className="text-red-600 font-semibold">{item.traditional}</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500 mb-1">With Max AI</p>
                      <p className="text-green-600 font-semibold">{item.withMaxAi}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-600 font-bold">{item.improvement}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW Mobile Optimized */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-10">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Customer Success Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">What Customers Say</h2>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <div className="flex gap-1 mb-3">
                {[...Array(customerTestimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-base sm:text-lg lg:text-xl mb-4 italic text-gray-700">
                "{customerTestimonials[activeTestimonial].quote}"
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-3 sm:mb-0">
                  <p className="font-semibold text-sm sm:text-base">{customerTestimonials[activeTestimonial].author}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {customerTestimonials[activeTestimonial].title}, {customerTestimonials[activeTestimonial].company}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 self-start sm:self-auto">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {customerTestimonials[activeTestimonial].results}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Mobile-friendly navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {customerTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeTestimonial ? 'bg-primary' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-xs sm:text-sm lg:text-lg px-3 sm:px-4 py-1 sm:py-2">
                Ready for AI Transparency?
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-6 px-2">
              See Max AI in Action Today
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 px-4 sm:px-0">
              Experience the first manufacturing AI that shows its work.
              <span className="hidden sm:inline"> Watch our demo to see transparent reasoning and voice control.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-semibold shadow-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Watch Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm opacity-80">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>15-min setup</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise security
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                24/7 support included
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AiFeaturesPage;