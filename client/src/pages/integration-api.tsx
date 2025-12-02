import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Database, 
  Code, 
  Cloud, 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Play,
  Star,
  Eye,
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
  LineChart,
  PieChart,
  Activity,
  Smartphone,
  Monitor,
  Server,
  Lock,
  Globe,
  GitBranch,
  Link,
  Webhook,
  Puzzle,
  Repeat,
  Shield,
  Target,
  Package,
  Factory,
  Truck
} from "lucide-react";
import { useLocation } from "wouter";

const IntegrationApiPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeIntegrationType, setActiveIntegrationType] = useState("enterprise");

  const coreIntegrationFeatures = [
    {
      title: "Enterprise System Connectors",
      icon: <Puzzle className="w-8 h-8" />,
      description: "500+ pre-built connectors for major ERP, MES, PLM, and manufacturing systems with zero-code integration",
      benefits: [
        "SAP (ECC, S/4HANA, Manufacturing, PP, MM modules)",
        "Oracle (EBS, Cloud ERP, Manufacturing Cloud)",
        "Microsoft Dynamics 365 (Finance, Supply Chain, Manufacturing)",
        "Infor (CloudSuite Industrial, LN, Visual, SyteLine)",
        "Epicor (Prophet 21, Kinetic, ERP 10)",
        "QAD, IFS, SYSPRO, Sage, NetSuite integrations"
      ],
      roiImpact: "80% faster integration deployment, 90% reduction in custom development",
      competitiveDifferentiator: "Manufacturing-specific data mapping with deep ERP integration expertise"
    },
    {
      title: "Modern API Platform",
      icon: <Code className="w-8 h-8" />,
      description: "Comprehensive RESTful APIs with GraphQL support, real-time webhooks, and developer-friendly tools",
      benefits: [
        "Complete REST API coverage for all platform functionality",
        "GraphQL endpoints for flexible data queries and mutations",
        "Real-time webhooks for event-driven integrations",
        "OpenAPI 3.0 specification with interactive documentation",
        "SDK libraries for .NET, Java, Python, Node.js, and PHP",
        "Rate limiting, authentication, and monitoring built-in"
      ],
      roiImpact: "70% faster custom integration development, unlimited API scalability",
      competitiveDifferentiator: "Manufacturing-first API design with production scheduling and supply chain focus"
    },
    {
      title: "Real-Time Data Synchronization",
      icon: <Zap className="w-8 h-8" />,
      description: "Event-driven architecture with real-time data synchronization across all connected systems",
      benefits: [
        "Bi-directional real-time data synchronization",
        "Event streaming with Apache Kafka integration",
        "Conflict resolution with master data management",
        "Data transformation and mapping with visual tools",
        "Delta synchronization for efficient data transfer",
        "Guaranteed delivery with retry mechanisms and dead letter queues"
      ],
      roiImpact: "99.9% data consistency across systems, sub-second data propagation",
      competitiveDifferentiator: "Manufacturing-optimized event streaming for production and supply chain data"
    },
    {
      title: "Integration Automation & Orchestration",
      icon: <Workflow className="w-8 h-8" />,
      description: "Visual workflow builder for complex integration scenarios with automated testing and monitoring",
      benefits: [
        "Visual drag-and-drop integration workflow designer",
        "Pre-built workflow templates for common manufacturing scenarios",
        "Automated testing and validation of integration flows",
        "Real-time monitoring and alerting for integration health",
        "Error handling and retry logic with escalation procedures",
        "Integration performance analytics and optimization recommendations"
      ],
      roiImpact: "60% reduction in integration maintenance, 95% uptime achievement",
      competitiveDifferentiator: "Manufacturing process-aware integration orchestration with production workflow templates"
    }
  ];

  const systemCategories = [
    {
      category: "Enterprise Resource Planning (ERP)",
      description: "Core business system integrations",
      systems: [
        { name: "SAP ECC/S4HANA", logo: "SAP", coverage: "Master data, orders, inventory, financials" },
        { name: "Oracle EBS/Cloud", logo: "Oracle", coverage: "Manufacturing, supply chain, procurement" },
        { name: "Microsoft Dynamics 365", logo: "Microsoft", coverage: "Finance, operations, manufacturing" },
        { name: "Infor CloudSuite", logo: "Infor", coverage: "Industrial manufacturing, distribution" },
        { name: "Epicor Kinetic", logo: "Epicor", coverage: "Job management, scheduling, quality" },
        { name: "NetSuite", logo: "NetSuite", coverage: "Financials, CRM, e-commerce integration" }
      ],
      icon: <Building2 className="w-6 h-6" />
    },
    {
      category: "Manufacturing Execution Systems (MES)",
      description: "Shop floor and production system connectivity",
      systems: [
        { name: "Wonderware MES", logo: "Wonderware", coverage: "Production tracking, quality, genealogy" },
        { name: "GE Proficy", logo: "GE", coverage: "Plant operations, batch management" },
        { name: "Rockwell FactoryTalk", logo: "Rockwell", coverage: "Production management, analytics" },
        { name: "Siemens Opcenter", logo: "Siemens", coverage: "Execution, intelligence, quality" },
        { name: "Dassault DELMIA", logo: "Dassault", coverage: "Digital manufacturing, simulation" },
        { name: "Applied Materials", logo: "AMAT", coverage: "Semiconductor manufacturing" }
      ],
      icon: <Factory className="w-6 h-6" />
    },
    {
      category: "Quality Management Systems (QMS)",
      description: "Quality and compliance system integration",
      systems: [
        { name: "MasterControl", logo: "MasterControl", coverage: "Document control, CAPA, training" },
        { name: "TrackWise", logo: "Sparta", coverage: "Quality management, compliance" },
        { name: "Veeva Vault", logo: "Veeva", coverage: "Life sciences quality, regulatory" },
        { name: "ETQ Reliance", logo: "ETQ", coverage: "Quality processes, risk management" },
        { name: "IQS Quality Suite", logo: "IQS", coverage: "Quality management, supplier quality" },
        { name: "Pilgrim Quality", logo: "Pilgrim", coverage: "Statistical quality control" }
      ],
      icon: <Shield className="w-6 h-6" />
    },
    {
      category: "Supply Chain & Logistics",
      description: "Supply chain and transportation management",
      systems: [
        { name: "Blue Yonder", logo: "JDA", coverage: "Demand planning, supply optimization" },
        { name: "Oracle SCM Cloud", logo: "Oracle", coverage: "Supply chain planning, execution" },
        { name: "SAP APO/IBP", logo: "SAP", coverage: "Advanced planning, demand management" },
        { name: "Manhattan WMS", logo: "Manhattan", coverage: "Warehouse management, labor" },
        { name: "Kinaxis RapidResponse", logo: "Kinaxis", coverage: "Concurrent planning, analytics" },
        { name: "E2open", logo: "E2open", coverage: "Multi-tier supply chain visibility" }
      ],
      icon: <Truck className="w-6 h-6" />
    }
  ];

  const apiCapabilities = [
    {
      capability: "Production Scheduling API",
      description: "Complete access to scheduling engine and optimization",
      endpoints: [
        "GET /api/schedules - Retrieve production schedules",
        "POST /api/schedules/optimize - Trigger schedule optimization",
        "PUT /api/jobs/{id}/sequence - Modify job sequences",
        "GET /api/resources/utilization - Resource utilization data"
      ],
      useCase: "Custom scheduling interfaces, mobile apps, external optimization",
      icon: <Calendar className="w-6 h-6" />
    },
    {
      capability: "Inventory Management API",
      description: "Real-time inventory data and optimization controls",
      endpoints: [
        "GET /api/inventory/items - Inventory item details",
        "POST /api/inventory/transactions - Record inventory moves",
        "GET /api/inventory/optimization - Optimization recommendations",
        "PUT /api/inventory/levels - Update stock levels"
      ],
      useCase: "Warehouse systems, mobile scanning, automated replenishment",
      icon: <Package className="w-6 h-6" />
    },
    {
      capability: "Master Data API",
      description: "Centralized master data management and synchronization",
      endpoints: [
        "GET /api/items - Product and item master data",
        "POST /api/customers - Customer information management",
        "PUT /api/suppliers - Supplier data updates",
        "GET /api/bom/{id} - Bill of materials structures"
      ],
      useCase: "ERP synchronization, data governance, catalog management",
      icon: <Database className="w-6 h-6" />
    },
    {
      capability: "Analytics & Reporting API",
      description: "KPI data, analytics, and custom reporting capabilities",
      endpoints: [
        "GET /api/kpis/production - Production performance metrics",
        "POST /api/reports/custom - Generate custom reports",
        "GET /api/analytics/trends - Historical trend analysis",
        "GET /api/dashboards/{id} - Dashboard configurations"
      ],
      useCase: "Business intelligence, executive dashboards, regulatory reporting",
      icon: <BarChart3 className="w-6 h-6" />
    }
  ];

  const integrationPatterns = [
    {
      pattern: "Real-Time Synchronization",
      description: "Immediate data propagation across systems",
      scenarios: ["Production status updates", "Inventory level changes", "Quality alerts"],
      technology: "Webhooks, Event Streaming, WebSockets",
      latency: "< 100ms",
      icon: <Zap className="w-6 h-6" />
    },
    {
      pattern: "Batch Processing",
      description: "Scheduled bulk data transfer and processing",
      scenarios: ["Nightly master data sync", "Historical data exports", "Bulk uploads"],
      technology: "REST APIs, File Transfer, ETL",
      latency: "Scheduled",
      icon: <Database className="w-6 h-6" />
    },
    {
      pattern: "Event-Driven Architecture",
      description: "Reactive system responses to business events",
      scenarios: ["Order changes", "Equipment failures", "Quality issues"],
      technology: "Message Queues, Event Bus, Saga Pattern",
      latency: "< 1 second",
      icon: <Workflow className="w-6 h-6" />
    },
    {
      pattern: "API Gateway",
      description: "Centralized API management and security",
      scenarios: ["Mobile app access", "Partner integrations", "Microservices"],
      technology: "OAuth 2.0, Rate Limiting, Load Balancing",
      latency: "< 50ms overhead",
      icon: <Network className="w-6 h-6" />
    }
  ];

  const industryApplications = [
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Complex regulatory requirements demanding complete data traceability and system validation",
      solution: "Validated integrations with MES, LIMS, and ERP systems ensuring 21 CFR Part 11 compliance",
      results: [
        "100% data traceability across all systems",
        "95% reduction in validation documentation time",
        "Real-time batch genealogy tracking",
        "Automated regulatory reporting"
      ],
      testimonial: "The validated integrations saved us months of validation work while ensuring complete compliance.",
      customer: "IT Director, Global Pharmaceutical Company"
    },
    {
      industry: "Automotive Manufacturing",
      challenge: "Just-in-time production requiring real-time coordination between suppliers, production, and logistics",
      solution: "Real-time integration platform connecting EDI, supplier portals, MES, and transportation systems",
      results: [
        "Zero line-down events due to parts shortages",
        "50% reduction in inventory levels",
        "Real-time supplier visibility",
        "Automated exception management"
      ],
      testimonial: "The integration platform transformed our ability to respond to supply chain disruptions in real-time.",
      customer: "Supply Chain Director, Major Automotive OEM"
    },
    {
      industry: "Food Production",
      challenge: "Managing complex formulations and regulatory requirements across multiple production sites",
      solution: "Integrated platform connecting ERP, formulation systems, quality management, and regulatory reporting",
      results: [
        "100% recipe accuracy and traceability",
        "60% faster new product introduction",
        "Automated nutritional labeling",
        "Real-time quality monitoring"
      ],
      testimonial: "Integration across our sites has enabled us to standardize processes while maintaining local flexibility.",
      customer: "Operations Manager, Regional Food Processor"
    }
  ];

  const competitiveComparison = [
    {
      feature: "Pre-Built Connectors",
      planetTogether: "500+ manufacturing-specific connectors with deep ERP integration",
      competitors: "Generic connectors requiring extensive customization",
      advantage: "Manufacturing-optimized data mapping and process templates"
    },
    {
      feature: "API Completeness",
      planetTogether: "100% feature coverage with REST and GraphQL APIs",
      competitors: "Limited API coverage requiring workarounds",
      advantage: "Complete programmatic access to all platform capabilities"
    },
    {
      feature: "Real-Time Capabilities",
      planetTogether: "Sub-second event streaming with guaranteed delivery",
      competitors: "Batch-based integration with hours of latency",
      advantage: "True real-time manufacturing operations synchronization"
    },
    {
      feature: "Integration Monitoring",
      planetTogether: "Real-time monitoring with automated error recovery",
      competitors: "Manual monitoring requiring IT intervention",
      advantage: "Self-healing integrations with proactive issue resolution"
    },
    {
      feature: "Developer Experience",
      planetTogether: "Comprehensive SDKs, documentation, and sandbox environment",
      competitors: "Limited documentation and developer tools",
      advantage: "Accelerated development with manufacturing-focused examples"
    }
  ];

  const roiCalculator = [
    {
      metric: "Integration Development Time",
      baseline: "6 months for custom ERP integration",
      withPlatform: "2 weeks with pre-built connectors",
      calculation: "23 weeks saved × $2,000/week developer cost",
      annualValue: "$460,000 saved per major integration project"
    },
    {
      metric: "Integration Maintenance",
      baseline: "$200K annually for custom integration maintenance",
      withPlatform: "$40K with automated monitoring and self-healing",
      calculation: "$160K annual savings in maintenance costs",
      annualValue: "$160,000 annual maintenance cost reduction"
    },
    {
      metric: "Data Latency Improvement",
      baseline: "4-hour batch processing for critical data",
      withPlatform: "Real-time streaming with sub-second latency",
      calculation: "Faster decision-making enabling 5% efficiency gain",
      annualValue: "$500,000 additional productivity from real-time operations"
    },
    {
      metric: "System Downtime Reduction",
      baseline: "2 hours/month integration-related downtime",
      withPlatform: "5 minutes/month with automated failover",
      calculation: "115 minutes saved × $10,000/hour downtime cost",
      annualValue: "$230,000 annual savings from reduced downtime"
    }
  ];

  const developerResources = [
    { name: "API Documentation", description: "Complete OpenAPI 3.0 specification", link: "/api/docs" },
    { name: "SDK Libraries", description: "Native SDKs for popular languages", link: "/developers/sdks" },
    { name: "Code Examples", description: "Manufacturing-specific integration examples", link: "/developers/examples" },
    { name: "Sandbox Environment", description: "Free testing environment with sample data", link: "/developers/sandbox" },
    { name: "Integration Guides", description: "Step-by-step integration tutorials", link: "/developers/guides" },
    { name: "Community Forum", description: "Developer community and support", link: "/developers/community" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-green-900 to-teal-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Network className="w-10 h-10 text-blue-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Integration & API Platform
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Connect Everything in Your
              <span className="block text-blue-300">Manufacturing Ecosystem</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-green-100 max-w-4xl mx-auto">
              500+ pre-built connectors, modern APIs, and real-time integration platform 
              designed specifically for manufacturing environments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-green-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Integration Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Code className="w-5 h-5 mr-2" />
                API Documentation
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>500+ pre-built connectors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Real-time synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Manufacturing-optimized APIs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Integration Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-600">
              <Network className="w-4 h-4 mr-2" />
              Enterprise Integration Platform
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Manufacturing Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive integration platform with manufacturing-specific connectors, 
              modern APIs, and real-time synchronization for seamless operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreIntegrationFeatures.map((feature, index) => (
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
                    <h4 className="font-semibold text-gray-900 mb-3">Integration Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Integration ROI</span>
                    </div>
                    <p className="text-blue-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Manufacturing Advantage</span>
                    </div>
                    <p className="text-green-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* System Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              500+ Pre-Built Manufacturing Connectors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Extensive library of manufacturing-specific integrations across all 
              major system categories with deep industry expertise.
            </p>
          </div>

          <div className="space-y-12">
            {systemCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                      {category.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                  </div>
                  <p className="text-lg text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.systems.map((system, systemIndex) => (
                    <Card key={systemIndex} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{system.logo}</span>
                          </div>
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{system.coverage}</p>
                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready to Deploy
                          </Badge>
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
      <section className="py-20 bg-gradient-to-r from-blue-900 to-green-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Network className="w-8 h-8 text-blue-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Ready to Connect Your Manufacturing Systems?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Transform Your Manufacturing Integration
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience the power of manufacturing-optimized integration with 500+ connectors, 
              real-time synchronization, and comprehensive APIs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Integration Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Code className="w-5 h-5 mr-2" />
                API Documentation
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/enterprise-scalability')}
              >
                <Building2 className="w-5 h-5 mr-2" />
                Enterprise Features
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Deploy in days, not months
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise security built-in
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Real-time synchronization
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Expert integration support
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntegrationApiPage;