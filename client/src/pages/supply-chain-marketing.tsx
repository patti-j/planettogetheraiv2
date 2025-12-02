import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Truck, 
  Factory, 
  Globe, 
  Target, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Clock, 
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
  Smartphone
} from "lucide-react";
import { useLocation } from "wouter";

const SupplyChainMarketingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState("overview");

  const coreInventoryFeatures = [
    {
      title: "AI-Powered Demand Forecasting",
      icon: <TrendingUp className="w-8 h-8" />,
      description: "Machine learning algorithms predict demand with 95% accuracy, automatically adjusting forecasts based on seasonality, trends, and market conditions",
      benefits: [
        "Multi-algorithm forecasting with ensemble modeling for maximum accuracy",
        "Automatic seasonal pattern detection and adjustment",
        "External factor integration (weather, economic indicators, promotions)",
        "Real-time forecast accuracy tracking with automatic model retraining",
        "Demand sensing with short-term pattern recognition",
        "Collaborative forecasting with sales team input and override capabilities"
      ],
      roiImpact: "40% reduction in forecast error, 25% decrease in safety stock requirements",
      competitiveDifferentiator: "Advanced AI forecasting typically found only in specialized demand planning systems, integrated seamlessly with production"
    },
    {
      title: "Intelligent Inventory Optimization",
      icon: <Package className="w-8 h-8" />,
      description: "Automated optimization of stock levels, reorder points, and safety stocks across all locations and product categories",
      benefits: [
        "Dynamic safety stock calculation based on demand variability and lead times",
        "Automated reorder point optimization with service level targets",
        "Multi-echelon inventory optimization across distribution network",
        "ABC/XYZ classification with differentiated inventory strategies",
        "Slow-moving and obsolete inventory identification and management",
        "Economic order quantity (EOQ) optimization with quantity discounts"
      ],
      roiImpact: "30% reduction in inventory carrying costs, 98% service level achievement",
      competitiveDifferentiator: "Comprehensive inventory optimization that considers production constraints, capacity, and lead time variability"
    },
    {
      title: "Supply Chain Visibility & Control Tower",
      icon: <Globe className="w-8 h-8" />,
      description: "End-to-end supply chain visibility with real-time monitoring, exception management, and predictive alerts",
      benefits: [
        "Real-time visibility across entire supply chain network",
        "Supplier performance monitoring with delivery and quality metrics",
        "Exception-based management with automated alert generation",
        "Supply chain risk assessment and mitigation recommendations",
        "Cross-functional collaboration tools for supply chain teams",
        "KPI dashboards with drill-down capabilities for root cause analysis"
      ],
      roiImpact: "50% faster response to supply chain disruptions, 20% improvement in supplier performance",
      competitiveDifferentiator: "Integrated control tower that connects suppliers, production, and customers in one unified platform"
    },
    {
      title: "Procurement & Supplier Optimization",
      icon: <Truck className="w-8 h-8" />,
      description: "Intelligent procurement planning with supplier performance management and automated sourcing decisions",
      benefits: [
        "Automated purchase order generation based on inventory levels and forecasts",
        "Supplier performance scoring with delivery, quality, and cost metrics",
        "Multi-supplier sourcing with risk diversification strategies",
        "Contract management with price optimization and volume commitments",
        "Supplier collaboration portal for real-time communication",
        "Purchase price variance analysis with cost reduction opportunities"
      ],
      roiImpact: "15% reduction in procurement costs, 95% on-time supplier delivery",
      competitiveDifferentiator: "AI-driven procurement decisions that balance cost, quality, risk, and sustainability factors automatically"
    }
  ];

  const supplyChainCapabilities = [
    {
      category: "Demand Planning",
      description: "Advanced forecasting and demand management capabilities",
      features: [
        {
          name: "Statistical Forecasting",
          description: "Multiple algorithms automatically select best fit for each item",
          impact: "85-95% forecast accuracy",
          icon: <BarChart3 className="w-6 h-6" />
        },
        {
          name: "Collaborative Planning",
          description: "Sales team input integration with automated reconciliation",
          impact: "30% improvement in consensus forecasts",
          icon: <Users className="w-6 h-6" />
        },
        {
          name: "Demand Sensing",
          description: "Real-time demand signal capture and short-term adjustment",
          impact: "50% reduction in forecast bias",
          icon: <Activity className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Inventory Management",
      description: "Comprehensive inventory optimization and control",
      features: [
        {
          name: "Multi-Location Optimization",
          description: "Network-wide inventory optimization with transfer recommendations",
          impact: "25% reduction in total inventory",
          icon: <MapPin className="w-6 h-6" />
        },
        {
          name: "Dynamic Safety Stocks",
          description: "Continuous optimization based on demand variability and service targets",
          impact: "40% reduction in safety stock excess",
          icon: <Shield className="w-6 h-6" />
        },
        {
          name: "Slow-Moving Detection",
          description: "Automatic identification and management of obsolete inventory",
          impact: "60% reduction in write-offs",
          icon: <AlertTriangle className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Supplier Management",
      description: "Intelligent supplier relationship and performance management",
      features: [
        {
          name: "Performance Scoring",
          description: "Comprehensive supplier evaluation with quality, delivery, and cost metrics",
          impact: "90% supplier compliance achievement",
          icon: <Star className="w-6 h-6" />
        },
        {
          name: "Risk Assessment",
          description: "Continuous supplier risk monitoring with mitigation strategies",
          impact: "80% reduction in supply disruptions",
          icon: <Shield className="w-6 h-6" />
        },
        {
          name: "Automated Sourcing",
          description: "Intelligent sourcing decisions based on cost, quality, and availability",
          impact: "15% procurement cost reduction",
          icon: <Bot className="w-6 h-6" />
        }
      ]
    }
  ];

  const inventoryStrategies = [
    {
      strategy: "ABC Analysis",
      description: "Classify inventory by value contribution",
      applications: ["High-value items (A)", "Moderate-value items (B)", "Low-value items (C)"],
      benefits: ["Focused management effort", "Differentiated service levels", "Optimized ordering policies"],
      icon: <PieChart className="w-6 h-6" />
    },
    {
      strategy: "XYZ Analysis", 
      description: "Classify inventory by demand variability",
      applications: ["Stable demand (X)", "Variable demand (Y)", "Irregular demand (Z)"],
      benefits: ["Appropriate safety stocks", "Targeted forecast methods", "Risk-based planning"],
      icon: <LineChart className="w-6 h-6" />
    },
    {
      strategy: "Min-Max Planning",
      description: "Simple reorder point system with maximum levels",
      applications: ["C-items", "Maintenance supplies", "Low-value consumables"],
      benefits: ["Simplified management", "Reduced stockouts", "Automated replenishment"],
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      strategy: "Economic Order Quantity",
      description: "Optimize order quantities to minimize total costs",
      applications: ["Regular demand items", "Stable lead times", "Known ordering costs"],
      benefits: ["Cost optimization", "Reduced ordering frequency", "Balanced carrying costs"],
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      strategy: "Vendor Managed Inventory",
      description: "Supplier-controlled inventory with consumption-based replenishment",
      applications: ["Commodity items", "Trusted suppliers", "High-volume items"],
      benefits: ["Reduced inventory investment", "Improved availability", "Lower administrative costs"],
      icon: <Truck className="w-6 h-6" />
    },
    {
      strategy: "Just-in-Time (JIT)",
      description: "Minimize inventory with precisely timed deliveries",
      applications: ["Lean manufacturing", "Short lead times", "Reliable suppliers"],
      benefits: ["Minimal inventory investment", "Reduced waste", "Improved cash flow"],
      icon: <Clock className="w-6 h-6" />
    }
  ];

  const industryApplications = [
    {
      industry: "Automotive Manufacturing",
      challenge: "Managing thousands of components with varying lead times and just-in-time delivery requirements",
      solution: "Multi-tier supplier visibility, predictive analytics for component shortages, and automated expediting",
      results: [
        "Zero line-down events due to part shortages",
        "45% reduction in component inventory levels",
        "98% supplier delivery performance",
        "30% reduction in expediting costs"
      ],
      testimonial: "The supply chain visibility has been game-changing. We can see potential issues weeks in advance and take proactive action.",
      customer: "Supply Chain Director, Major Auto OEM"
    },
    {
      industry: "Pharmaceutical Manufacturing", 
      challenge: "Managing expensive raw materials with expiration dates and strict regulatory requirements",
      solution: "FEFO inventory management, automated expiry tracking, and regulatory compliance monitoring",
      results: [
        "99.8% regulatory compliance achievement",
        "60% reduction in expired material write-offs",
        "25% improvement in material yield",
        "100% lot traceability and genealogy"
      ],
      testimonial: "We've eliminated expired materials and improved our regulatory compliance while reducing inventory investment significantly.",
      customer: "Operations Director, Global Pharmaceutical Company"
    },
    {
      industry: "Food Production",
      challenge: "Managing perishable ingredients with seasonal demand variations and quality requirements",
      solution: "Shelf-life optimization, seasonal forecasting, and quality-based inventory strategies",
      results: [
        "40% reduction in food waste",
        "95% freshness guarantee achievement", 
        "20% improvement in inventory turns",
        "25% reduction in emergency procurement"
      ],
      testimonial: "Our inventory optimization has dramatically improved freshness while reducing waste and costs.",
      customer: "Supply Chain Manager, Regional Food Processor"
    }
  ];

  const competitiveComparison = [
    {
      feature: "Forecasting Accuracy",
      planetTogether: "95% accuracy with ensemble ML algorithms",
      competitors: "70-80% with basic statistical methods",
      advantage: "Significantly better forecast accuracy leads to optimal inventory levels"
    },
    {
      feature: "Inventory Optimization",
      planetTogether: "Multi-echelon optimization with production constraints",
      competitors: "Single-location optimization without production integration",
      advantage: "Network-wide optimization considering manufacturing capacity and constraints"
    },
    {
      feature: "Supply Chain Visibility",
      planetTogether: "Real-time end-to-end visibility with predictive alerts",
      competitors: "Limited visibility with reactive reporting",
      advantage: "Proactive supply chain management with early warning systems"
    },
    {
      feature: "AI Integration",
      planetTogether: "AI-powered decisions with transparent reasoning",
      competitors: "Rule-based systems with manual override",
      advantage: "Intelligent automation that learns and adapts while maintaining transparency"
    },
    {
      feature: "Production Integration",
      planetTogether: "Seamless integration with production planning and scheduling",
      competitors: "Separate systems requiring manual coordination",
      advantage: "Unified planning that optimizes both inventory and production simultaneously"
    }
  ];

  const roiCalculator = [
    {
      metric: "Inventory Carrying Cost Reduction",
      baseline: "25% of inventory value annually",
      withPT: "18% with optimized levels",
      savings: "7% reduction on $10M inventory = $700K",
      annualValue: "$700,000 annual inventory cost savings"
    },
    {
      metric: "Improved Forecast Accuracy",
      baseline: "75% forecast accuracy",
      withPT: "95% accuracy with AI forecasting", 
      savings: "20% reduction in safety stock needs",
      annualValue: "$500,000 reduction in safety stock investment"
    },
    {
      metric: "Reduced Stockout Costs",
      baseline: "$100K/month in stockout and expediting costs",
      withPT: "$20K/month with predictive replenishment",
      savings: "$80K/month in avoided stockouts",
      annualValue: "$960,000 annual savings from stockout prevention"
    },
    {
      metric: "Procurement Efficiency",
      baseline: "15% of procurement team time on manual tasks",
      withPT: "5% with automated procurement planning",
      savings: "10% time savings × $500K team cost",
      annualValue: "$50,000 annual labor efficiency savings"
    }
  ];

  const kpiMetrics = [
    { name: "Inventory Turns", target: "12x annually", improvement: "+40%" },
    { name: "Service Level", target: "98%", improvement: "+8%" },
    { name: "Forecast Accuracy", target: "95%", improvement: "+20%" },
    { name: "Stockout Frequency", target: "<1%", improvement: "-80%" },
    { name: "Carrying Cost", target: "18% of value", improvement: "-7%" },
    { name: "Supplier Performance", target: "95% on-time", improvement: "+15%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Package className="w-10 h-10 text-green-300" />
              <Badge className="bg-green-600/50 text-white border-green-400 text-lg px-4 py-2">
                Smart Supply Chain Management
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              AI-Powered Inventory Optimization
              <span className="block text-green-300">& Supply Chain Intelligence</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto">
              Transform your supply chain with intelligent forecasting, automated optimization, 
              and end-to-end visibility. Reduce costs, improve service, and eliminate waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Supply Chain Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Package className="w-5 h-5 mr-2" />
                Try Inventory Optimizer
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>95% forecast accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>30% inventory reduction</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Real-time visibility</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-green-600 border-green-600">
              <Bot className="w-4 h-4 mr-2" />
              AI-Driven Supply Chain Platform
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Supply Chain Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive supply chain management with AI-powered optimization, 
              predictive analytics, and seamless integration with production planning.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreInventoryFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-green-600 transition-colors">
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
                      <span className="font-semibold text-green-800">Proven Results</span>
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

      {/* Supply Chain Capabilities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Comprehensive Supply Chain Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced capabilities across demand planning, inventory management, 
              and supplier relationships for end-to-end optimization.
            </p>
          </div>

          <div className="space-y-12">
            {supplyChainCapabilities.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.category}</h3>
                  <p className="text-lg text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card key={featureIndex} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="mx-auto p-3 bg-green-100 rounded-full w-fit mb-4">
                          <div className="text-green-600">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Package className="w-8 h-8 text-green-300" />
              <Badge className="bg-green-600/50 text-white border-green-400 text-lg px-4 py-2">
                Ready to Optimize Your Supply Chain?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Transform Your Inventory Management Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience AI-powered supply chain optimization with real-time visibility, 
              predictive analytics, and seamless production integration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Supply Chain Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Package className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/production-scheduling')}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Production Features
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Implementation in weeks
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ROI within months
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise security
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

export default SupplyChainMarketingPage;