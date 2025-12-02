import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  LineChart, 
  Activity, 
  Target, 
  Eye, 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Database, 
  Play,
  Star,
  Workflow,
  Gauge,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Bot,
  Lightbulb,
  Search,
  Layers,
  MousePointer,
  Calendar,
  Building2,
  Boxes,
  MapPin,
  Smartphone,
  Monitor,
  Server,
  Lock,
  Globe,
  Network,
  Cloud,
  Zap,
  Repeat,
  Shield,
  Package,
  Factory
} from "lucide-react";
import { useLocation } from "wouter";

const AnalyticsReportingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeAnalyticsLevel, setActiveAnalyticsLevel] = useState("executive");

  const coreAnalyticsFeatures = [
    {
      title: "Real-Time Manufacturing Intelligence",
      icon: <Activity className="w-8 h-8" />,
      description: "Live production dashboards with real-time KPI monitoring, automated alerts, and predictive insights for manufacturing operations",
      benefits: [
        "Real-time production monitoring with live OEE calculations",
        "Automated KPI tracking across all manufacturing functions",
        "Predictive analytics for equipment maintenance and performance",
        "Exception-based alerts with configurable thresholds",
        "Drill-down capabilities from summary to detailed transaction level",
        "Mobile-responsive dashboards for plant floor and executive viewing"
      ],
      roiImpact: "45% faster issue identification, 30% improvement in decision-making speed",
      competitiveDifferentiator: "Manufacturing-specific analytics with production scheduling and constraint optimization insights"
    },
    {
      title: "AI-Powered Advanced Analytics",
      icon: <Bot className="w-8 h-8" />,
      description: "Machine learning algorithms for demand forecasting, optimization recommendations, and intelligent business insights",
      benefits: [
        "AI-driven demand forecasting with multiple algorithm ensemble",
        "Automated root cause analysis for production issues",
        "Predictive maintenance recommendations based on equipment data",
        "Intelligent capacity planning with scenario modeling",
        "Anomaly detection for quality and production metrics",
        "Natural language query interface for business users"
      ],
      roiImpact: "60% improvement in forecast accuracy, 40% reduction in unplanned downtime",
      competitiveDifferentiator: "Manufacturing-trained AI models with transparent reasoning and explainable insights"
    },
    {
      title: "Executive Business Intelligence",
      icon: <Target className="w-8 h-8" />,
      description: "Strategic dashboards and reporting for C-level executives with financial integration and performance tracking",
      benefits: [
        "Executive KPI dashboards with drill-down to operational details",
        "Financial performance tracking with manufacturing cost analysis",
        "Multi-plant comparison and benchmarking capabilities",
        "Strategic planning support with scenario analysis",
        "Board-ready reports with professional visualization",
        "ROI analysis for manufacturing investments and improvements"
      ],
      roiImpact: "50% faster strategic decision-making, 25% improvement in resource allocation",
      competitiveDifferentiator: "Manufacturing-focused executive analytics with production, financial, and strategic integration"
    },
    {
      title: "Regulatory & Compliance Reporting",
      icon: <FileText className="w-8 h-8" />,
      description: "Automated compliance reporting for manufacturing regulations with audit trails and validation documentation",
      benefits: [
        "Automated regulatory report generation for FDA, EPA, OSHA",
        "Complete audit trails with electronic signatures and timestamps",
        "Compliance dashboard with regulatory requirement tracking",
        "Automated data validation and integrity checking",
        "Exception reporting for compliance violations and corrective actions",
        "Integration with quality management systems for complete traceability"
      ],
      roiImpact: "80% reduction in compliance preparation time, 100% audit success rate",
      competitiveDifferentiator: "Pre-built regulatory templates for pharmaceutical, food, and chemical manufacturing"
    }
  ];

  const kpiCategories = [
    {
      category: "Production Performance",
      description: "Manufacturing efficiency and productivity metrics",
      kpis: [
        {
          name: "Overall Equipment Effectiveness (OEE)",
          description: "Availability × Performance × Quality effectiveness",
          calculation: "(Good Units / Planned Units) × 100",
          target: "85%+",
          impact: "Primary manufacturing efficiency indicator"
        },
        {
          name: "First Pass Yield",
          description: "Percentage of products manufactured correctly first time",
          calculation: "Good Units / Total Units Produced",
          target: "95%+",
          impact: "Quality and efficiency combined metric"
        },
        {
          name: "Schedule Adherence",
          description: "Percentage of jobs completed on scheduled time",
          calculation: "On-Time Jobs / Total Jobs",
          target: "95%+",
          impact: "Production planning effectiveness"
        },
        {
          name: "Cycle Time Efficiency",
          description: "Actual vs theoretical minimum cycle time",
          calculation: "Theoretical Time / Actual Time",
          target: "90%+",
          impact: "Process optimization opportunity identification"
        }
      ],
      icon: <Gauge className="w-6 h-6" />
    },
    {
      category: "Supply Chain & Inventory",
      description: "Supply chain performance and inventory optimization",
      kpis: [
        {
          name: "Inventory Turnover",
          description: "How frequently inventory is sold and replaced",
          calculation: "Cost of Goods Sold / Average Inventory",
          target: "12x annually",
          impact: "Working capital efficiency indicator"
        },
        {
          name: "Stockout Frequency",
          description: "Percentage of time items are out of stock",
          calculation: "Stockout Events / Total Demand Events",
          target: "<2%",
          impact: "Service level and planning effectiveness"
        },
        {
          name: "Supplier Performance",
          description: "On-time delivery from suppliers",
          calculation: "On-Time Deliveries / Total Deliveries",
          target: "95%+",
          impact: "Supply chain reliability measure"
        },
        {
          name: "Forecast Accuracy",
          description: "Accuracy of demand forecasting",
          calculation: "100% - |Actual - Forecast| / Actual",
          target: "90%+",
          impact: "Planning and inventory optimization"
        }
      ],
      icon: <Package className="w-6 h-6" />
    },
    {
      category: "Quality & Compliance",
      description: "Quality management and regulatory compliance metrics",
      kpis: [
        {
          name: "Defect Rate",
          description: "Percentage of products with quality defects",
          calculation: "Defective Units / Total Units Produced",
          target: "<0.5%",
          impact: "Quality system effectiveness"
        },
        {
          name: "Customer Complaints",
          description: "Rate of customer quality complaints",
          calculation: "Complaints / Units Shipped",
          target: "<0.1%",
          impact: "Customer satisfaction and quality"
        },
        {
          name: "Compliance Score",
          description: "Regulatory compliance achievement",
          calculation: "Compliant Items / Total Required Items",
          target: "100%",
          impact: "Regulatory risk management"
        },
        {
          name: "CAPA Effectiveness",
          description: "Corrective action effectiveness rate",
          calculation: "Effective CAPAs / Total CAPAs",
          target: "95%+",
          impact: "Continuous improvement success"
        }
      ],
      icon: <Shield className="w-6 h-6" />
    },
    {
      category: "Financial Performance",
      description: "Manufacturing financial and cost metrics",
      kpis: [
        {
          name: "Manufacturing Cost per Unit",
          description: "Total manufacturing cost per unit produced",
          calculation: "(Labor + Material + Overhead) / Units",
          target: "Trend down",
          impact: "Cost efficiency and profitability"
        },
        {
          name: "Labor Efficiency",
          description: "Actual vs standard labor hours",
          calculation: "Standard Hours / Actual Hours",
          target: "100%+",
          impact: "Workforce productivity measure"
        },
        {
          name: "Equipment ROI",
          description: "Return on manufacturing equipment investment",
          calculation: "(Revenue - Investment) / Investment",
          target: "20%+",
          impact: "Capital investment effectiveness"
        },
        {
          name: "Scrap & Waste Cost",
          description: "Cost of scrapped and wasted materials",
          calculation: "Scrap Value / Total Material Cost",
          target: "<2%",
          impact: "Process efficiency and sustainability"
        }
      ],
      icon: <DollarSign className="w-6 h-6" />
    }
  ];

  const dashboardTypes = [
    {
      type: "Executive Dashboard",
      audience: "C-Level Executives, VPs",
      description: "Strategic overview with key performance indicators",
      features: [
        "High-level KPI summary with trend analysis",
        "Multi-plant performance comparison",
        "Financial performance integration",
        "Strategic initiative tracking",
        "Exception alerts for critical issues",
        "Board-ready visualizations"
      ],
      refreshRate: "Real-time",
      icon: <Target className="w-6 h-6" />
    },
    {
      type: "Operations Dashboard",
      audience: "Plant Managers, Operations Directors",
      description: "Detailed operational metrics and performance tracking",
      features: [
        "Production performance monitoring",
        "Resource utilization tracking",
        "Schedule adherence and efficiency",
        "Quality metrics and trends",
        "Capacity planning analytics",
        "Maintenance and downtime analysis"
      ],
      refreshRate: "Every 5 minutes",
      icon: <Factory className="w-6 h-6" />
    },
    {
      type: "Shop Floor Dashboard",
      audience: "Supervisors, Line Leads, Operators",
      description: "Real-time production status and immediate actions",
      features: [
        "Live production status and rates",
        "Job progress and completion tracking",
        "Quality alerts and inspection results",
        "Equipment status and alarms",
        "Labor tracking and efficiency",
        "Simple, visual interface design"
      ],
      refreshRate: "Real-time",
      icon: <Gauge className="w-6 h-6" />
    },
    {
      type: "Quality Dashboard",
      audience: "Quality Managers, QA Teams",
      description: "Quality metrics, compliance, and improvement tracking",
      features: [
        "Quality trend analysis and SPC charts",
        "Defect tracking and root cause analysis",
        "Supplier quality performance",
        "Compliance status and audit readiness",
        "CAPA tracking and effectiveness",
        "Customer complaint analysis"
      ],
      refreshRate: "Every 15 minutes",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const reportingCapabilities = [
    {
      category: "Standard Reports",
      description: "Pre-configured reports for common manufacturing needs",
      reports: [
        "Daily Production Summary",
        "Weekly OEE Analysis",
        "Monthly Financial Performance",
        "Quarterly Quality Review",
        "Annual Capacity Planning",
        "Regulatory Compliance Report"
      ],
      features: ["Automated scheduling", "Email distribution", "Multi-format export"],
      icon: <FileText className="w-6 h-6" />
    },
    {
      category: "Ad Hoc Reporting",
      description: "Flexible report builder for custom analysis",
      reports: [
        "Custom date range analysis",
        "Product line performance",
        "Cost center analysis",
        "Supplier performance review",
        "Equipment utilization study",
        "Process capability analysis"
      ],
      features: ["Drag-and-drop builder", "Visual query interface", "Real-time preview"],
      icon: <Search className="w-6 h-6" />
    },
    {
      category: "Regulatory Reports",
      description: "Compliance and regulatory reporting templates",
      reports: [
        "FDA submission reports",
        "EPA environmental reporting",
        "OSHA safety compliance",
        "ISO audit documentation",
        "Customer quality reports",
        "Supplier audit reports"
      ],
      features: ["Validated templates", "Electronic signatures", "Audit trails"],
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const industryApplications = [
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Complex regulatory reporting requirements with complete batch genealogy and validation",
      solution: "Automated regulatory reporting with validated analytics and electronic signature workflows",
      results: [
        "100% regulatory compliance achievement",
        "90% reduction in report preparation time",
        "Complete batch traceability reporting",
        "Automated FDA submission preparation"
      ],
      testimonial: "The regulatory reporting capabilities have transformed our compliance process from weeks to hours.",
      customer: "Quality Director, Global Pharmaceutical Company"
    },
    {
      industry: "Automotive Manufacturing",
      challenge: "Real-time visibility across global manufacturing network with supplier performance tracking",
      solution: "Global dashboard with multi-plant KPIs, supplier scorecards, and predictive analytics",
      results: [
        "Real-time visibility across 15 plants",
        "50% improvement in supplier performance",
        "30% faster issue resolution",
        "25% reduction in quality escapes"
      ],
      testimonial: "Global visibility has enabled us to operate as one unified manufacturing network.",
      customer: "VP Manufacturing, Major Automotive OEM"
    },
    {
      industry: "Food Production",
      challenge: "Managing food safety compliance with traceability and recall capabilities",
      solution: "Comprehensive food safety dashboard with lot tracking and automated recall management",
      results: [
        "Complete lot-to-lot traceability",
        "60% faster recall response time",
        "100% food safety compliance",
        "Automated HACCP reporting"
      ],
      testimonial: "The traceability and recall capabilities give us confidence in our food safety management.",
      customer: "Quality Manager, Regional Food Processor"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <BarChart3 className="w-10 h-10 text-purple-300" />
              <Badge className="bg-purple-600/50 text-white border-purple-400 text-lg px-4 py-2">
                Advanced Analytics & Reporting
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Manufacturing Intelligence
              <span className="block text-purple-300">That Drives Decisions</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-indigo-100 max-w-4xl mx-auto">
              AI-powered analytics, real-time dashboards, and comprehensive reporting 
              for manufacturing excellence and regulatory compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Analytics Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Try Analytics Platform
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-indigo-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span>Real-time manufacturing intelligence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span>AI-powered insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span>Regulatory compliance automation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Analytics Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-purple-600 border-purple-600">
              <Bot className="w-4 h-4 mr-2" />
              AI-Powered Manufacturing Intelligence
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Manufacturing Analytics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analytics platform with real-time monitoring, AI insights, 
              executive dashboards, and automated compliance reporting.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreAnalyticsFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-purple-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">
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
                    <h4 className="font-semibold text-gray-900 mb-3">Analytics Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Business Impact</span>
                    </div>
                    <p className="text-purple-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-indigo-600" />
                      <span className="font-semibold text-indigo-800">Manufacturing Focus</span>
                    </div>
                    <p className="text-indigo-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Comprehensive Manufacturing KPI Framework
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete set of manufacturing key performance indicators with 
              benchmarks, calculations, and business impact analysis.
            </p>
          </div>

          <div className="space-y-12">
            {kpiCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                      {category.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                  </div>
                  <p className="text-lg text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {category.kpis.map((kpi, kpiIndex) => (
                    <Card key={kpiIndex} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{kpi.name}</CardTitle>
                        <p className="text-sm text-gray-600">{kpi.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-semibold text-gray-700 mb-1">Calculation:</div>
                          <div className="text-sm text-gray-600 font-mono">{kpi.calculation}</div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-700">Target:</div>
                            <div className="text-lg font-bold text-purple-600">{kpi.target}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700">Impact:</div>
                            <div className="text-sm text-gray-600">{kpi.impact}</div>
                          </div>
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

      {/* Dashboard Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Role-Based Dashboards for Every Level
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored dashboards for different roles and responsibilities 
              from shop floor operators to C-level executives.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {dashboardTypes.map((dashboard, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {dashboard.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dashboard.type}</CardTitle>
                      <p className="text-sm text-gray-600">{dashboard.audience}</p>
                    </div>
                  </div>
                  <p className="text-gray-600">{dashboard.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {dashboard.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Refresh Rate:</span>
                      <span className="text-sm text-purple-700">{dashboard.refreshRate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <BarChart3 className="w-8 h-8 text-purple-300" />
              <Badge className="bg-purple-600/50 text-white border-purple-400 text-lg px-4 py-2">
                Ready for Manufacturing Intelligence?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Transform Your Manufacturing Analytics
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience the power of AI-driven manufacturing intelligence with real-time dashboards, 
              predictive analytics, and automated compliance reporting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Analytics Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Try Analytics Platform
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/ai-features')}
              >
                <Bot className="w-5 h-5 mr-2" />
                AI Capabilities
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time insights
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Compliance automation
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Executive dashboards
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Role-based analytics
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsReportingPage;