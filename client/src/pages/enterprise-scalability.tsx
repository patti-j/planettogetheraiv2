import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Globe, 
  Factory, 
  Users, 
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
  Settings,
  FileText,
  MessageSquare,
  Bot,
  Lightbulb,
  Search,
  Layers,
  MousePointer,
  Calendar,
  Boxes,
  MapPin,
  LineChart,
  PieChart,
  Activity,
  Smartphone,
  Network,
  Cloud,
  Monitor,
  Server,
  Zap,
  Lock,
  Maximize2,
  GitBranch,
  Repeat
} from "lucide-react";
import { useLocation } from "wouter";

const EnterpriseScalabilityPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeScaleLevel, setActiveScaleLevel] = useState("multi-plant");

  const coreEnterpriseFeatures = [
    {
      title: "Multi-Plant Global Operations",
      icon: <Globe className="w-8 h-8" />,
      description: "Seamlessly manage manufacturing operations across multiple facilities, countries, and time zones with unified visibility and control",
      benefits: [
        "Centralized visibility across all manufacturing facilities worldwide",
        "Cross-plant capacity planning and load balancing optimization",
        "Global inventory optimization with inter-plant transfer management",
        "Unified reporting and KPI dashboards across all locations",
        "Multi-currency and multi-language support for global operations",
        "Time zone-aware scheduling and collaboration tools"
      ],
      roiImpact: "35% improvement in global capacity utilization, 25% reduction in inter-plant inventory",
      competitiveDifferentiator: "Native multi-plant architecture designed for global manufacturing from the ground up"
    },
    {
      title: "Horizontal Scaling & Cloud Architecture",
      icon: <Cloud className="w-8 h-8" />,
      description: "Unlimited scalability with cloud-native architecture that grows with your business from startup to Fortune 500",
      benefits: [
        "Auto-scaling infrastructure that handles demand spikes automatically",
        "Microservices architecture for independent component scaling",
        "Load-balanced database clusters with automatic failover",
        "CDN distribution for global performance optimization",
        "Container-based deployment with Kubernetes orchestration",
        "99.9% uptime SLA with enterprise-grade reliability"
      ],
      roiImpact: "60% reduction in IT infrastructure costs, 99.9% system availability",
      competitiveDifferentiator: "Cloud-native architecture with unlimited horizontal scaling capabilities"
    },
    {
      title: "Enterprise Security & Compliance",
      icon: <Shield className="w-8 h-8" />,
      description: "Bank-grade security with comprehensive compliance support for regulated industries and global standards",
      benefits: [
        "SOC 2 Type II compliance with comprehensive audit trails",
        "Enterprise SSO integration with SAML, OAuth, and LDAP",
        "Role-based access control with granular permission management",
        "Data encryption at rest and in transit with enterprise key management",
        "GDPR, HIPAA, and SOX compliance with automated reporting",
        "Advanced threat detection with real-time security monitoring"
      ],
      roiImpact: "100% compliance achievement, 80% reduction in security audit preparation time",
      competitiveDifferentiator: "Comprehensive enterprise security designed for manufacturing environments"
    },
    {
      title: "Advanced Integration & API Platform",
      icon: <Network className="w-8 h-8" />,
      description: "Enterprise-grade integration platform with 500+ pre-built connectors and unlimited custom API capabilities",
      benefits: [
        "Pre-built connectors for major ERP, MES, and PLM systems",
        "RESTful APIs with GraphQL support for flexible data access",
        "Event-driven architecture with real-time webhooks",
        "Enterprise service bus (ESB) for complex integration scenarios",
        "API rate limiting, authentication, and monitoring",
        "Self-healing integration with automatic retry and error handling"
      ],
      roiImpact: "75% faster integration deployment, 90% reduction in integration maintenance",
      competitiveDifferentiator: "Manufacturing-specific integration platform with deep industry expertise"
    }
  ];

  const scaleLevels = [
    {
      level: "Single Plant",
      userRange: "50-500 users",
      description: "Complete manufacturing optimization for individual facilities",
      features: ["Full scheduling & planning", "Inventory optimization", "Quality management", "Basic reporting"],
      pricing: "Starting at $5,000/month",
      icon: <Factory className="w-6 h-6" />
    },
    {
      level: "Multi-Plant Regional",
      userRange: "500-2,000 users", 
      description: "Regional operations with multiple connected facilities",
      features: ["Cross-plant planning", "Regional inventory pools", "Consolidated reporting", "Advanced analytics"],
      pricing: "Starting at $15,000/month",
      icon: <Building2 className="w-6 h-6" />
    },
    {
      level: "Global Enterprise",
      userRange: "2,000-10,000 users",
      description: "Worldwide manufacturing with complex supply chains",
      features: ["Global optimization", "Multi-currency support", "Advanced compliance", "Custom integrations"],
      pricing: "Starting at $50,000/month",
      icon: <Globe className="w-6 h-6" />
    },
    {
      level: "Fortune 500",
      userRange: "10,000+ users",
      description: "Massive scale with unlimited customization capabilities",
      features: ["Unlimited scaling", "Custom development", "Dedicated support", "On-premise options"],
      pricing: "Custom enterprise pricing",
      icon: <Maximize2 className="w-6 h-6" />
    }
  ];

  const architectureCapabilities = [
    {
      category: "Scalability & Performance",
      description: "Built for unlimited growth and performance at scale",
      features: [
        {
          name: "Auto-Scaling Infrastructure",
          description: "Automatically scales compute resources based on demand",
          impact: "Handles 10x traffic spikes seamlessly",
          icon: <TrendingUp className="w-6 h-6" />
        },
        {
          name: "Distributed Database",
          description: "Horizontally partitioned databases for unlimited data growth",
          impact: "Petabyte-scale data management",
          icon: <Database className="w-6 h-6" />
        },
        {
          name: "Global CDN",
          description: "Content delivery network for worldwide performance",
          impact: "Sub-100ms response times globally",
          icon: <Globe className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Enterprise Integration",
      description: "Seamless connectivity with your existing technology stack",
      features: [
        {
          name: "Pre-Built Connectors",
          description: "500+ ready-to-use integrations with popular systems",
          impact: "80% faster integration deployment",
          icon: <Network className="w-6 h-6" />
        },
        {
          name: "API-First Design",
          description: "Complete functionality accessible via modern APIs",
          impact: "Unlimited custom integration possibilities",
          icon: <Cpu className="w-6 h-6" />
        },
        {
          name: "Event-Driven Architecture",
          description: "Real-time data synchronization across all systems",
          impact: "Instant data consistency",
          icon: <Zap className="w-6 h-6" />
        }
      ]
    },
    {
      category: "Security & Compliance",
      description: "Enterprise-grade security for regulated environments",
      features: [
        {
          name: "Advanced Encryption",
          description: "AES-256 encryption at rest and in transit",
          impact: "Bank-grade data protection",
          icon: <Lock className="w-6 h-6" />
        },
        {
          name: "Compliance Automation",
          description: "Automated compliance reporting and audit trails",
          impact: "95% reduction in compliance overhead",
          icon: <FileText className="w-6 h-6" />
        },
        {
          name: "Identity Management",
          description: "Enterprise SSO with fine-grained access control",
          impact: "Centralized security management",
          icon: <Users className="w-6 h-6" />
        }
      ]
    }
  ];

  const industryApplications = [
    {
      industry: "Global Automotive Manufacturing",
      scale: "25 plants across 15 countries",
      challenge: "Coordinating just-in-time production across a complex global supply chain with multiple tiers of suppliers",
      solution: "Multi-plant optimization with real-time global visibility, cross-plant capacity balancing, and supplier integration",
      results: [
        "98% on-time delivery across all global plants",
        "35% reduction in global inventory levels",
        "50% improvement in supply chain responsiveness",
        "25% reduction in total logistics costs"
      ],
      testimonial: "PlanetTogether's global architecture allowed us to operate as one unified manufacturing network rather than 25 disconnected plants.",
      customer: "VP Global Operations, Fortune 100 Automotive OEM"
    },
    {
      industry: "Pharmaceutical Manufacturing",
      scale: "12 facilities across 8 countries",
      challenge: "Managing complex regulatory requirements across multiple jurisdictions while optimizing global production capacity",
      solution: "Unified compliance management, global batch genealogy tracking, and cross-plant campaign optimization",
      results: [
        "100% regulatory compliance across all jurisdictions",
        "40% improvement in global capacity utilization",
        "60% faster regulatory submission preparation",
        "30% reduction in compliance-related delays"
      ],
      testimonial: "The platform's global compliance capabilities have transformed how we manage our worldwide pharmaceutical operations.",
      customer: "Chief Operations Officer, Global Pharmaceutical Company"
    },
    {
      industry: "Consumer Electronics",
      scale: "18 plants across Asia-Pacific region",
      challenge: "Managing rapid product lifecycle changes and demand volatility across multiple manufacturing sites",
      solution: "Global demand sensing, cross-plant flexibility management, and rapid reconfiguration capabilities",
      results: [
        "50% faster response to demand changes",
        "30% improvement in forecast accuracy",
        "40% reduction in obsolete inventory",
        "25% increase in production flexibility"
      ],
      testimonial: "The ability to rapidly reconfigure our global production network has been crucial for staying competitive in fast-moving consumer electronics.",
      customer: "Director of Global Manufacturing, Major Electronics Brand"
    }
  ];

  const competitiveComparison = [
    {
      feature: "Multi-Plant Architecture",
      planetTogether: "Native global architecture with unified data model",
      competitors: "Separate instances requiring complex integration",
      advantage: "True single source of truth across all facilities"
    },
    {
      feature: "Scalability",
      planetTogether: "Unlimited horizontal scaling with cloud-native design",
      competitors: "Limited scalability requiring expensive hardware upgrades",
      advantage: "Pay-as-you-grow model with infinite scale potential"
    },
    {
      feature: "Integration Platform",
      planetTogether: "500+ pre-built connectors with enterprise API platform",
      competitors: "Custom integration required for each connection",
      advantage: "Rapid deployment with comprehensive connectivity"
    },
    {
      feature: "Security & Compliance",
      planetTogether: "Built-in compliance for major standards (SOC2, GDPR, HIPAA)",
      competitors: "Additional compliance modules at extra cost",
      advantage: "Comprehensive compliance included in base platform"
    },
    {
      feature: "Global Support",
      planetTogether: "24/7 follow-the-sun support with local expertise",
      competitors: "Regional support with time zone limitations",
      advantage: "Always-available expert support in your language and time zone"
    }
  ];

  const roiCalculator = [
    {
      metric: "Multi-Plant Coordination Efficiency",
      baseline: "Manual coordination with 15% capacity imbalance",
      withPlatform: "Automated load balancing with 5% variance",
      calculation: "10% efficiency gain × $50M plant capacity",
      annualValue: "$5,000,000 additional productive capacity value"
    },
    {
      metric: "Integration & IT Costs",
      baseline: "$2M annually for custom integrations and maintenance",
      withPlatform: "$500K with pre-built connectors and automation",
      calculation: "$1.5M annual savings in integration costs",
      annualValue: "$1,500,000 annual IT cost reduction"
    },
    {
      metric: "Compliance & Audit Efficiency",
      baseline: "200 person-days annually for compliance preparation",
      withPlatform: "40 person-days with automated compliance reporting",
      calculation: "160 days × $1,000/day fully loaded cost",
      annualValue: "$160,000 annual compliance efficiency savings"
    },
    {
      metric: "Global Inventory Optimization",
      baseline: "$20M global inventory with 25% excess",
      withPlatform: "$15M with cross-plant optimization",
      calculation: "$5M inventory reduction × 20% carrying cost",
      annualValue: "$1,000,000 annual inventory carrying cost savings"
    }
  ];

  const enterpriseFeatures = [
    { name: "Single Sign-On (SSO)", included: true, description: "Enterprise identity integration" },
    { name: "Advanced Analytics", included: true, description: "Custom dashboards and reporting" },
    { name: "API Access", included: true, description: "Full REST and GraphQL APIs" },
    { name: "Dedicated Support", included: true, description: "24/7 expert manufacturing support" },
    { name: "Custom Integrations", included: true, description: "Professional integration services" },
    { name: "Compliance Automation", included: true, description: "SOC2, GDPR, HIPAA compliance" },
    { name: "Training & Onboarding", included: true, description: "Comprehensive user training programs" },
    { name: "Success Management", included: true, description: "Dedicated customer success team" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Building2 className="w-10 h-10 text-blue-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Enterprise Manufacturing Platform
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Global Manufacturing Operations
              <span className="block text-blue-300">At Unlimited Scale</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-purple-100 max-w-4xl mx-auto">
              Enterprise-grade manufacturing platform designed for global operations. 
              Multi-plant coordination, unlimited scalability, and world-class security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Enterprise Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Building2 className="w-5 h-5 mr-2" />
                Get Enterprise Quote
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-purple-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Unlimited horizontal scaling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Global multi-plant operations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Enterprise security & compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Enterprise Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-600">
              <Cloud className="w-4 h-4 mr-2" />
              Enterprise Cloud Platform
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Enterprise Manufacturing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purpose-built for global manufacturing organizations requiring unlimited scale, 
              enterprise security, and seamless multi-plant coordination.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreEnterpriseFeatures.map((feature, index) => (
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
                    <h4 className="font-semibold text-gray-900 mb-3">Enterprise Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Enterprise Impact</span>
                    </div>
                    <p className="text-blue-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Market Leadership</span>
                    </div>
                    <p className="text-purple-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scale Levels */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Scale From Startup to Fortune 500
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform grows with your business, from single facilities to 
              global manufacturing networks with unlimited scalability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scaleLevels.map((level, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group relative">
                <CardHeader className="text-center">
                  <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {level.icon}
                  </div>
                  <CardTitle className="text-lg">{level.level}</CardTitle>
                  <Badge variant="outline" className="mx-auto">{level.userRange}</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">{level.description}</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Included Features:</h4>
                    <ul className="space-y-1 text-sm">
                      {level.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="font-bold text-blue-600">{level.pricing}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Capabilities */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Enterprise Architecture & Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cloud-native architecture designed for enterprise manufacturing 
              with unlimited scalability and enterprise-grade capabilities.
            </p>
          </div>

          <div className="space-y-12">
            {architectureCapabilities.map((category, categoryIndex) => (
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
                        <div className="bg-blue-100 rounded-lg p-3">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-800">Enterprise Value</span>
                          </div>
                          <span className="text-blue-700 font-medium">{feature.impact}</span>
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
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Building2 className="w-8 h-8 text-blue-300" />
              <Badge className="bg-blue-600/50 text-white border-blue-400 text-lg px-4 py-2">
                Ready for Enterprise Manufacturing?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Scale Your Manufacturing Operations Globally
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join global manufacturing leaders who trust our platform for their 
              most critical operations. Enterprise-grade security, unlimited scale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Enterprise Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Building2 className="w-5 h-5 mr-2" />
                Get Custom Quote
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
                <Shield className="w-4 h-4" />
                SOC 2 Type II certified
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                24/7 global support
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                99.9% uptime SLA
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Dedicated success team
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnterpriseScalabilityPage;