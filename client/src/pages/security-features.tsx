import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Users, 
  Lock, 
  Eye, 
  Key, 
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
  Network,
  Cloud,
  Monitor,
  Server,
  Zap,
  Fingerprint,
  UserCheck,
  ShieldCheck,
  LockKeyhole,
  UserCog,
  Globe
} from "lucide-react";
import { useLocation } from "wouter";

const SecurityFeaturesPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeSecurityLevel, setActiveSecurityLevel] = useState("enterprise");

  const coreSecurityFeatures = [
    {
      title: "Advanced Role-Based Access Control (RBAC)",
      icon: <UserCog className="w-8 h-8" />,
      description: "Granular permission management with hierarchical roles, feature-level access control, and dynamic permission assignment",
      benefits: [
        "Hierarchical role structure with inheritance and override capabilities",
        "Feature-action level permissions for precise access control",
        "Dynamic role assignment based on organizational structure",
        "Temporary access grants with automatic expiration",
        "Multi-tenancy support for external partner access",
        "Audit trails for all permission changes and access attempts"
      ],
      roiImpact: "95% reduction in security incidents, 80% faster user provisioning",
      competitiveDifferentiator: "Manufacturing-specific RBAC with shop floor, production, and executive role templates"
    },
    {
      title: "Enterprise Authentication & SSO",
      icon: <Fingerprint className="w-8 h-8" />,
      description: "Enterprise-grade authentication with Single Sign-On, multi-factor authentication, and seamless identity management",
      benefits: [
        "SAML 2.0 and OAuth 2.0 / OpenID Connect integration",
        "Active Directory and LDAP synchronization",
        "Multi-factor authentication with TOTP, SMS, and hardware tokens",
        "Passwordless authentication with biometric and security keys",
        "Session management with configurable timeout and concurrent limits",
        "Just-in-time user provisioning and deprovisioning"
      ],
      roiImpact: "60% reduction in password-related help desk tickets, 99.9% authentication uptime",
      competitiveDifferentiator: "Manufacturing-optimized authentication supporting shop floor devices and mobile workers"
    },
    {
      title: "Data Security & Encryption",
      icon: <LockKeyhole className="w-8 h-8" />,
      description: "Bank-grade data protection with end-to-end encryption, secure key management, and comprehensive data governance",
      benefits: [
        "AES-256 encryption at rest with managed encryption keys",
        "TLS 1.3 encryption in transit with perfect forward secrecy",
        "Field-level encryption for sensitive manufacturing data",
        "Hardware Security Module (HSM) integration for key management",
        "Zero-trust network architecture with micro-segmentation",
        "Data loss prevention (DLP) with automated classification"
      ],
      roiImpact: "100% data breach prevention, 90% reduction in compliance audit time",
      competitiveDifferentiator: "Manufacturing data-specific encryption protecting intellectual property and trade secrets"
    },
    {
      title: "Compliance & Audit Management",
      icon: <ShieldCheck className="w-8 h-8" />,
      description: "Automated compliance monitoring and reporting for manufacturing regulations and industry standards",
      benefits: [
        "SOC 2 Type II compliance with continuous monitoring",
        "GDPR, CCPA, and regional privacy regulation compliance",
        "FDA CFR Part 11 validation for pharmaceutical manufacturing",
        "ISO 27001 and NIST framework alignment",
        "Automated audit trail generation with tamper-proof logging",
        "Real-time compliance dashboards with violation alerts"
      ],
      roiImpact: "85% reduction in compliance preparation time, 100% audit success rate",
      competitiveDifferentiator: "Pre-built compliance templates for manufacturing regulations and industry standards"
    }
  ];

  const securityLayers = [
    {
      layer: "Network Security",
      description: "Perimeter and network-level protection",
      features: [
        {
          name: "Web Application Firewall",
          description: "Advanced WAF with manufacturing-specific threat detection",
          protection: "OWASP Top 10 protection"
        },
        {
          name: "DDoS Protection",
          description: "Automatic detection and mitigation of distributed attacks",
          protection: "99.9% uptime guarantee"
        },
        {
          name: "VPN & Private Connectivity",
          description: "Secure plant connectivity with site-to-site VPN",
          protection: "Encrypted plant connections"
        }
      ],
      icon: <Globe className="w-6 h-6" />
    },
    {
      layer: "Application Security",
      description: "Application-level security controls and monitoring",
      features: [
        {
          name: "Secure Development",
          description: "Security-first development with automated testing",
          protection: "Zero-day vulnerability prevention"
        },
        {
          name: "Runtime Protection",
          description: "Real-time application security monitoring",
          protection: "Immediate threat response"
        },
        {
          name: "API Security",
          description: "Comprehensive API protection and rate limiting",
          protection: "API abuse prevention"
        }
      ],
      icon: <Cpu className="w-6 h-6" />
    },
    {
      layer: "Data Security",
      description: "Data protection at all levels and states",
      features: [
        {
          name: "Encryption at Rest",
          description: "AES-256 encryption for all stored data",
          protection: "Full data protection"
        },
        {
          name: "Encryption in Transit",
          description: "TLS 1.3 for all data transmission",
          protection: "Secure data transport"
        },
        {
          name: "Key Management",
          description: "Enterprise key management with HSM",
          protection: "Secure key lifecycle"
        }
      ],
      icon: <Database className="w-6 h-6" />
    },
    {
      layer: "Identity & Access",
      description: "User authentication and authorization controls",
      features: [
        {
          name: "Multi-Factor Authentication",
          description: "Multiple authentication factors for enhanced security",
          protection: "Account takeover prevention"
        },
        {
          name: "Privileged Access",
          description: "Enhanced security for administrative accounts",
          protection: "Insider threat mitigation"
        },
        {
          name: "Access Monitoring",
          description: "Real-time access monitoring and alerting",
          protection: "Unauthorized access detection"
        }
      ],
      icon: <UserCheck className="w-6 h-6" />
    }
  ];

  const roleTemplates = [
    {
      role: "Executive Dashboard",
      description: "C-level executives and senior management",
      permissions: ["View all KPIs", "Financial reporting", "Strategic planning", "Global oversight"],
      restrictions: ["No operational changes", "Read-only access"],
      icon: <Building2 className="w-6 h-6" />
    },
    {
      role: "Plant Manager",
      description: "Individual facility management and operations",
      permissions: ["Plant operations", "Staff management", "Local scheduling", "Performance monitoring"],
      restrictions: ["Single plant scope", "Budget approvals required"],
      icon: <Users className="w-6 h-6" />
    },
    {
      role: "Production Supervisor",
      description: "Daily production oversight and management",
      permissions: ["Schedule changes", "Quality oversight", "Resource allocation", "Team coordination"],
      restrictions: ["Department scope", "Schedule approval limits"],
      icon: <Gauge className="w-6 h-6" />
    },
    {
      role: "Shop Floor Operator",
      description: "Front-line production and machine operators",
      permissions: ["Job execution", "Quality checks", "Basic reporting", "Equipment status"],
      restrictions: ["Job-level access", "No schedule changes"],
      icon: <Settings className="w-6 h-6" />
    },
    {
      role: "Quality Assurance",
      description: "Quality control and compliance management",
      permissions: ["Quality data", "Compliance reporting", "Audit management", "Process validation"],
      restrictions: ["Quality-focused", "Cross-departmental view"],
      icon: <ShieldCheck className="w-6 h-6" />
    },
    {
      role: "External Partner",
      description: "Suppliers, customers, and service providers",
      permissions: ["Limited data access", "Collaboration tools", "Status updates", "Document sharing"],
      restrictions: ["Partner-specific data", "No internal operations"],
      icon: <Network className="w-6 h-6" />
    }
  ];

  const complianceStandards = [
    {
      standard: "SOC 2 Type II",
      description: "Security, availability, processing integrity, confidentiality, and privacy",
      coverage: ["Security controls", "Audit procedures", "Continuous monitoring"],
      status: "Certified",
      icon: <Shield className="w-6 h-6" />
    },
    {
      standard: "ISO 27001",
      description: "Information security management systems",
      coverage: ["Risk management", "Security policies", "Incident response"],
      status: "Aligned", 
      icon: <FileText className="w-6 h-6" />
    },
    {
      standard: "GDPR",
      description: "European Union data protection regulation",
      coverage: ["Data privacy", "Consent management", "Right to be forgotten"],
      status: "Compliant",
      icon: <Globe className="w-6 h-6" />
    },
    {
      standard: "FDA CFR Part 11",
      description: "Electronic records and signatures for pharmaceuticals",
      coverage: ["Electronic signatures", "Audit trails", "Data integrity"],
      status: "Validated",
      icon: <FileText className="w-6 h-6" />
    },
    {
      standard: "HIPAA",
      description: "Healthcare information privacy and security",
      coverage: ["PHI protection", "Access controls", "Breach notification"],
      status: "Compliant",
      icon: <Shield className="w-6 h-6" />
    },
    {
      standard: "NIST Framework",
      description: "Cybersecurity framework for critical infrastructure",
      coverage: ["Identify", "Protect", "Detect", "Respond", "Recover"],
      status: "Aligned",
      icon: <ShieldCheck className="w-6 h-6" />
    }
  ];

  const securityMetrics = [
    { name: "Security Incidents", baseline: "12/month", withPlatform: "1/month", improvement: "92% reduction" },
    { name: "Compliance Prep Time", baseline: "200 hours", withPlatform: "30 hours", improvement: "85% faster" },
    { name: "User Provisioning", baseline: "2 days", withPlatform: "5 minutes", improvement: "99% faster" },
    { name: "Audit Success Rate", baseline: "75%", withPlatform: "100%", improvement: "25% improvement" },
    { name: "Password Help Desk", baseline: "50 tickets/week", withPlatform: "5 tickets/week", improvement: "90% reduction" },
    { name: "Data Breach Risk", baseline: "High", withPlatform: "Minimal", improvement: "Risk elimination" }
  ];

  const industryApplications = [
    {
      industry: "Pharmaceutical Manufacturing",
      challenge: "Strict FDA regulations requiring validated electronic records and signatures with complete audit trails",
      solution: "CFR Part 11 validated platform with electronic signatures, automated audit trails, and compliance reporting",
      results: [
        "100% FDA audit success rate",
        "90% reduction in validation documentation time",
        "Complete electronic records compliance",
        "Automated 21 CFR Part 11 reporting"
      ],
      testimonial: "The built-in CFR Part 11 validation saved us months of implementation time and ensures ongoing compliance.",
      customer: "VP Quality Assurance, Global Pharmaceutical Company"
    },
    {
      industry: "Aerospace & Defense",
      challenge: "ITAR and export control requirements with strict access controls and data protection",
      solution: "Advanced RBAC with ITAR compliance, citizen-based access controls, and secure collaboration",
      results: [
        "100% ITAR compliance achievement",
        "Secure international collaboration",
        "Granular export control management",
        "Zero security violations"
      ],
      testimonial: "The platform's security architecture meets our most stringent defense contractor requirements.",
      customer: "CISO, Major Defense Contractor"
    },
    {
      industry: "Automotive Manufacturing",
      challenge: "Global operations requiring consistent security across multiple countries and regulatory environments",
      solution: "Multi-regional compliance management, global SSO, and unified security policies",
      results: [
        "Unified global security posture",
        "95% reduction in regional compliance gaps",
        "Streamlined global user management",
        "Consistent security across 20+ countries"
      ],
      testimonial: "Managing security across our global operations has never been simpler or more effective.",
      customer: "Global IT Director, Fortune 100 Automotive"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-900 via-orange-900 to-amber-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-10 h-10 text-red-300" />
              <Badge className="bg-red-600/50 text-white border-red-400 text-lg px-4 py-2">
                Enterprise Security & Compliance
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Bank-Grade Security for
              <span className="block text-red-300">Manufacturing Operations</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-orange-100 max-w-4xl mx-auto">
              Comprehensive security platform with advanced RBAC, enterprise authentication, 
              and automated compliance for the most demanding manufacturing environments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Security Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
                onClick={() => setLocation('/pricing')}
              >
                <Shield className="w-5 h-5 mr-2" />
                Security Assessment
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-orange-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-400" />
                <span>SOC 2 Type II certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-400" />
                <span>Zero-trust architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-400" />
                <span>Manufacturing-specific RBAC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-red-600 border-red-600">
              <Shield className="w-4 h-4 mr-2" />
              Defense-Grade Security Platform
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Four Pillars of Manufacturing Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive security framework designed specifically for manufacturing environments 
              with enterprise-grade protection and regulatory compliance.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {coreSecurityFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-red-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-red-600 transition-colors">
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
                    <h4 className="font-semibold text-gray-900 mb-3">Security Capabilities:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">Security Impact</span>
                    </div>
                    <p className="text-red-700 font-medium">{feature.roiImpact}</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-800">Manufacturing Focus</span>
                    </div>
                    <p className="text-orange-700">{feature.competitiveDifferentiator}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Defense-in-Depth Security Architecture
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Multi-layered security approach providing comprehensive protection 
              at every level of your manufacturing operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {securityLayers.map((layer, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto p-3 bg-red-100 rounded-full w-fit mb-4">
                    <div className="text-red-600">
                      {layer.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{layer.layer}</CardTitle>
                  <p className="text-sm text-gray-600">{layer.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {layer.features.map((feature, idx) => (
                      <div key={idx} className="border-l-2 border-red-200 pl-4">
                        <h4 className="font-semibold text-gray-900 text-sm">{feature.name}</h4>
                        <p className="text-xs text-gray-600 mb-1">{feature.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {feature.protection}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Templates */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Manufacturing-Specific Role Templates
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pre-configured role templates designed for manufacturing organizations 
              with appropriate permissions and restrictions for each level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleTemplates.map((role, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      {role.icon}
                    </div>
                    <CardTitle className="text-lg">{role.role}</CardTitle>
                  </div>
                  <p className="text-gray-600 text-sm">{role.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Permissions:</h4>
                    <div className="space-y-1">
                      {role.permissions.map((permission, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-gray-600">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Restrictions:</h4>
                    <div className="space-y-1">
                      {role.restrictions.map((restriction, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-gray-600">{restriction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-900 to-orange-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-8 h-8 text-red-300" />
              <Badge className="bg-red-600/50 text-white border-red-400 text-lg px-4 py-2">
                Ready for Enterprise Security?
              </Badge>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Secure Your Manufacturing Operations Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience enterprise-grade security designed specifically for manufacturing. 
              Advanced RBAC, automated compliance, and zero-trust architecture.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/demo-tour')}
              >
                <Play className="w-5 h-5 mr-2" />
                Security Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() => setLocation('/pricing')}
              >
                <Shield className="w-5 h-5 mr-2" />
                Security Assessment
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
                <ShieldCheck className="w-4 h-4" />
                SOC 2 Type II certified
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Global compliance ready
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                24/7 security monitoring
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Expert security team
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityFeaturesPage;