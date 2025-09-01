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

  const coreAiFeatures = [
    {
      title: "Max AI Assistant with Transparent Reasoning",
      icon: <Sparkles className="w-8 h-8" />,
      description: "The first manufacturing AI that shows you exactly how it thinks and makes decisions",
      benefits: [
        "See step-by-step AI reasoning for every recommendation",
        "Understand confidence levels and uncertainty factors",
        "Trust AI decisions with full transparency and explainability",
        "Learn from AI logic to improve your own decision-making"
      ],
      roiImpact: "35% faster decision-making with 90% confidence in AI recommendations",
      competitiveDifferentiator: "Unlike black-box AI systems, Max AI shows its complete thought process, building trust through transparency"
    },
    {
      title: "AI Playbook Integration & Knowledge System",
      icon: <BookOpen className="w-8 h-8" />,
      description: "Collaborative knowledge management where AI learns from your manufacturing expertise",
      benefits: [
        "AI learns from your proven manufacturing processes and best practices",
        "Collaborative playbook creation with intelligent suggestions",
        "Knowledge base that evolves with your organization",
        "AI recommendations based on your specific context and history"
      ],
      roiImpact: "50% reduction in training time for new operators, 25% improvement in process consistency",
      competitiveDifferentiator: "First AI system that truly learns and adapts to your specific manufacturing environment and expertise"
    },
    {
      title: "Natural Language Voice Control",
      icon: <Mic className="w-8 h-8" />,
      description: "Control your entire manufacturing system using natural speech commands",
      benefits: [
        "Hands-free operation for shop floor environments",
        "Natural conversation with your manufacturing data",
        "Voice-activated scheduling and resource management",
        "Accessibility for users with different technical backgrounds"
      ],
      roiImpact: "60% faster data access, 40% reduction in training requirements",
      competitiveDifferentiator: "Industry's most advanced voice interface specifically designed for manufacturing operations"
    },
    {
      title: "AI File Analysis & Vision",
      icon: <Upload className="w-8 h-8" />,
      description: "Upload and analyze any manufacturing document, drawing, or image with AI",
      benefits: [
        "Instant analysis of technical drawings and specifications",
        "Extract production requirements from any document format",
        "Visual quality inspection with AI-powered image recognition",
        "Automated data extraction from legacy documents"
      ],
      roiImpact: "80% faster document processing, 95% reduction in manual data entry errors",
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
      industry: "Food & Beverage",
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-10 h-10 text-yellow-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Industry-Leading AI Technology
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              AI That Shows Its Work:
              <span className="block text-yellow-300">Transparent Manufacturing Intelligence</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              The first manufacturing AI system that explains every decision, learns from your expertise, 
              and continuously improves your operations with complete transparency and trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch AI Demo (3 min)
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>See AI reasoning in real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Voice-controlled operations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Learns from your expertise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core AI Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-600">
              <Cpu className="w-4 h-4 mr-2" />
              Revolutionary AI Technology
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Game-Changing AI Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your manufacturing operations with AI technology that's transparent, 
              trustworthy, and specifically designed for production environments.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreAiFeatures.map((feature, index) => (
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
                    <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
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
                      <span className="font-semibold text-green-800">Proven ROI Impact</span>
                    </div>
                    <p className="text-green-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Competitive Advantage</span>
                    </div>
                    <p className="text-blue-700">{feature.competitiveDifferentiator}</p>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-yellow-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Ready to Experience AI Transparency?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              See Max AI in Action Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience the first manufacturing AI that shows its work. Watch our live demo to see 
              transparent reasoning, voice control, and intelligent automation in action.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Live Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/solutions-comparison')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Compare Solutions
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Setup in 15 minutes
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
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