import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Globe, 
  Rocket,
  Shield,
  Award,
  BarChart3,
  Building2,
  Target,
  Zap,
  ArrowUpRight,
  CheckCircle,
  Star,
  Calendar,
  FileText,
  Mail,
  Phone,
  Briefcase,
  ChartBar,
  PieChart,
  Activity,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";

const InvestorRelationsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeMetric, setActiveMetric] = useState("arr");

  const keyMetrics = [
    {
      label: "Annual Recurring Revenue",
      value: "$45M",
      growth: "+120% YoY",
      description: "Strong revenue growth trajectory",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      label: "Customer Count",
      value: "450+",
      growth: "+85% YoY",
      description: "Rapid customer acquisition",
      icon: <Users className="w-5 h-5" />
    },
    {
      label: "Net Revenue Retention",
      value: "142%",
      growth: "Best in class",
      description: "Negative churn with expansion",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      label: "Gross Margin",
      value: "85%",
      growth: "SaaS benchmark",
      description: "Highly scalable business model",
      icon: <ChartBar className="w-5 h-5" />
    }
  ];

  const marketOpportunity = [
    {
      segment: "Manufacturing Software TAM",
      value: "$12B",
      growth: "by 2025",
      cagr: "18% CAGR"
    },
    {
      segment: "AI in Manufacturing",
      value: "$4.2B",
      growth: "by 2025",
      cagr: "45% CAGR"
    },
    {
      segment: "Supply Chain Software",
      value: "$19B",
      growth: "by 2026",
      cagr: "22% CAGR"
    }
  ];

  const competitiveAdvantages = [
    {
      title: "Transparent AI Technology",
      description: "First manufacturing platform with explainable AI that shows reasoning",
      moat: "3+ years ahead of competitors"
    },
    {
      title: "Industry-Specific Solution",
      description: "Purpose-built for pharmaceutical and industrial manufacturing",
      moat: "Deep domain expertise"
    },
    {
      title: "Enterprise Scalability",
      description: "Proven to handle Fortune 500 manufacturing complexity",
      moat: "10+ enterprise deployments"
    },
    {
      title: "Regulatory Compliance",
      description: "FDA 21 CFR Part 11 compliant with full audit trails",
      moat: "Certified for pharma use"
    }
  ];

  const growthDrivers = [
    {
      driver: "AI Feature Adoption",
      current: "85%",
      target: "95%",
      impact: "2x revenue per customer"
    },
    {
      driver: "International Expansion",
      current: "15%",
      target: "40%",
      impact: "$20M ARR opportunity"
    },
    {
      driver: "Enterprise Accounts",
      current: "25",
      target: "100",
      impact: "$50M ARR potential"
    },
    {
      driver: "Partner Channel",
      current: "10%",
      target: "30%",
      impact: "3x sales efficiency"
    }
  ];

  const milestones = [
    { year: "2023", event: "Launched transparent AI features", impact: "85% feature adoption" },
    { year: "2024", event: "Achieved $45M ARR milestone", impact: "120% growth" },
    { year: "2024", event: "SOC 2 Type II certification", impact: "Enterprise ready" },
    { year: "2025", event: "Global expansion launch", impact: "3 new markets" },
    { year: "2025", event: "Target $100M ARR", impact: "Path to IPO" }
  ];

  const investorTestimonials = [
    {
      quote: "PlanetTogether's AI-first approach and transparent technology give them a significant competitive moat in the $12B manufacturing software market.",
      author: "Sarah Mitchell",
      title: "Partner",
      firm: "Manufacturing Ventures",
      investment: "Series B Lead"
    },
    {
      quote: "The 142% net revenue retention and 85% gross margins demonstrate a highly scalable SaaS model with strong product-market fit.",
      author: "David Chen",
      title: "Managing Director",
      firm: "Industrial Tech Capital",
      investment: "Series A Investor"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center text-white">
            <Badge className="mb-4 sm:mb-6 bg-blue-600/50 text-white border-blue-400 px-3 sm:px-4 py-1.5 sm:py-2">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Investor Relations
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Transforming Manufacturing with
              <span className="block text-yellow-300 mt-2">Transparent AI Technology</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto px-4 sm:px-0">
              Building the future of intelligent manufacturing with 450+ customers, $45M ARR, 
              and 142% net revenue retention in a $12B addressable market.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg shadow-xl"
                onClick={() => window.open('/investor-deck.pdf', '_blank')}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Download Investor Deck
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg"
                onClick={() => window.location.href = 'mailto:investors@planettogether.com'}
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Contact IR Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Key Performance Metrics
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Strong growth trajectory with industry-leading metrics
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {metric.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {metric.growth}
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 text-primary">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Market Opportunity
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              $12B+ Total Addressable Market
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Operating in rapidly growing markets with strong tailwinds from AI adoption
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {marketOpportunity.map((market, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">{market.segment}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">
                    {market.value}
                  </div>
                  <Badge variant="outline" className="mb-2">{market.growth}</Badge>
                  <div className="text-sm text-muted-foreground">{market.cagr}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4" variant="outline">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Competitive Moat
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Sustainable Competitive Advantages
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {competitiveAdvantages.map((advantage, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    {advantage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    {advantage.description}
                  </p>
                  <Badge className="bg-primary/10 text-primary">
                    {advantage.moat}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Drivers */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Growth Strategy
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Clear Path to $100M ARR
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {growthDrivers.map((driver, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">{driver.driver}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <div className="text-lg sm:text-xl font-semibold">{driver.current}</div>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <div className="text-lg sm:text-xl font-bold text-primary">{driver.target}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {driver.impact}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline & Milestones */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Growth Timeline
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center mb-6 sm:mb-8">
                <div className="flex-shrink-0 w-20 sm:w-24 text-right pr-4 sm:pr-6">
                  <div className="text-sm sm:text-base font-bold text-primary">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full relative">
                  <div className="absolute w-0.5 h-16 sm:h-20 bg-gray-300 left-1/2 transform -translate-x-1/2 top-full"></div>
                </div>
                <div className="flex-grow pl-4 sm:pl-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                    <div className="font-semibold text-sm sm:text-base mb-1">{milestone.event}</div>
                    <Badge variant="outline" className="text-xs">{milestone.impact}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              What Investors Say
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {investorTestimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}, {testimonial.firm}</div>
                    </div>
                    <Badge className="bg-primary/10 text-primary">
                      {testimonial.investment}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              Join Our Growth Journey
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90">
              Be part of the transformation of manufacturing with AI technology
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg shadow-lg"
                onClick={() => window.location.href = 'mailto:investors@planettogether.com'}
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Schedule IR Meeting
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg"
                onClick={() => window.open('/investor-deck.pdf', '_blank')}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Download Materials
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-sm opacity-80">
                For investor inquiries: investors@planettogether.com | +1 (888) 555-0100
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvestorRelationsPage;