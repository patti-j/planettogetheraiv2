import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Cpu, 
  BarChart3, 
  Users, 
  Globe, 
  Sparkles,
  TrendingUp,
  Bot,
  Factory,
  Cog,
  Target,
  Award,
  Rocket,
  ChevronRight,
  Play,
  Building2,
  Clock,
  DollarSign,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface ExtendedFeatureCardProps extends FeatureCardProps {
  roi?: string;
}

const FeatureCard: React.FC<ExtendedFeatureCardProps> = ({ icon, title, description, roi, highlight = false }) => (
  <Card className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${highlight ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden' : ''}`}>
    {highlight && (
      <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
        TOP RATED
      </div>
    )}
    <CardHeader className="pb-3 sm:pb-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${highlight ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg' : 'bg-secondary'}`}>
        {icon}
      </div>
      <CardTitle className="text-base sm:text-lg leading-tight">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
      {roi && (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          {roi}
        </div>
      )}
    </CardContent>
  </Card>
);

interface StatCardProps {
  value: string;
  label: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description }) => (
  <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1 sm:mb-2">{value}</div>
    <div className="text-sm sm:text-base lg:text-lg font-semibold mb-0.5 sm:mb-1">{label}</div>
    <div className="text-xs sm:text-sm text-muted-foreground">{description}</div>
  </div>
);

const MarketingHome: React.FC = () => {
  const [, setLocation] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  const handleGetStarted = () => {
    setLocation("/pricing");
  };

  const handleWatchDemo = () => {
    setLocation("/demo-tour");
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Enhanced Max AI Assistant",
      description: "Transparent AI decision-making with full reasoning visibility.",
      fullDescription: "Next-generation AI with transparent decision-making, playbook integration, and real-time production intelligence. See exactly how AI makes recommendations with full reasoning transparency.",
      roi: "60% faster decision-making",
      highlight: true
    },
    {
      icon: <Factory className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Smart Manufacturing",
      description: "Real-time production scheduling and resource optimization.",
      fullDescription: "Comprehensive production scheduling, resource optimization, and real-time shop floor monitoring for pharmaceutical and industrial manufacturing.",
      roi: "30% efficiency improvement"
    },
    {
      icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Advanced Analytics",
      description: "AI-powered insights and predictive maintenance.",
      fullDescription: "Deep insights into production efficiency, resource utilization, quality metrics, and predictive maintenance with customizable dashboards.",
      roi: "45% faster issue detection"
    },
    {
      icon: <Cog className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "AI Knowledge System",
      description: "Collaborative playbook system that learns from your expertise.",
      fullDescription: "Collaborative playbook system where AI learns from your manufacturing expertise and provides transparent, knowledge-driven recommendations for better decisions.",
      roi: "50% knowledge retention"
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Enterprise Security",
      description: "FDA-compliant security and audit trails.",
      fullDescription: "Role-based access control, audit trails, and compliance management for pharmaceutical and regulated industries.",
      roi: "100% compliance rate"
    },
    {
      icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Global Manufacturing",
      description: "Multi-plant operations with global visibility.",
      fullDescription: "Multi-plant operations, international compliance, and supply chain visibility across global manufacturing networks.",
      roi: "Unlimited scalability"
    }
  ];

  const benefits = [
    "Reduce production costs by up to 25%",
    "Increase equipment utilization by 30%",
    "Minimize inventory carrying costs",
    "Improve on-time delivery performance",
    "Enhance quality control and compliance",
    "Accelerate decision-making with AI insights"
  ];

  const industries = [
    { name: "Pharmaceutical", description: "FDA-compliant manufacturing processes", customers: "50+" },
    { name: "Chemical", description: "Process manufacturing optimization", customers: "120+" },
    { name: "Industrial", description: "Discrete manufacturing excellence", customers: "200+" },
    { name: "Food & Beverage", description: "Quality and safety management", customers: "80+" }
  ];

  const testimonials = [
    {
      quote: "PlanetTogether's AI transparency feature has transformed how we make production decisions. We can see exactly why the AI recommends certain schedules, building trust across our team.",
      author: "Sarah Chen",
      title: "VP Operations",
      company: "Global Pharma Corp",
      rating: 5,
      results: "25% cost reduction in 6 months"
    },
    {
      quote: "The ROI was evident within weeks. Our production efficiency improved by 35% and we eliminated all manual scheduling tasks.",
      author: "Michael Torres",
      title: "Plant Manager",
      company: "Industrial Solutions Inc",
      rating: 5,
      results: "$2.5M annual savings"
    },
    {
      quote: "As an investor, I'm impressed by PlanetTogether's scalable architecture and clear path to profitability. The AI-first approach is exactly what manufacturing needs.",
      author: "Jennifer Wu",
      title: "Managing Partner",
      company: "Manufacturing Ventures",
      rating: 5,
      results: "3x portfolio growth"
    }
  ];

  const investorMetrics = [
    { metric: "Annual Recurring Revenue", value: "$45M+", growth: "+120% YoY" },
    { metric: "Customer Retention", value: "97%", growth: "Industry leading" },
    { metric: "Market Opportunity", value: "$12B", growth: "TAM by 2025" },
    { metric: "Gross Margin", value: "85%", growth: "SaaS benchmark" }
  ];

  return (
    <div className="fixed inset-0 min-h-screen bg-background z-[9999] overflow-auto">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mobile-optimized badge */}
            <Badge variant="secondary" className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              AI-Powered Manufacturing Excellence
            </Badge>
            
            {/* Mobile-optimized heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
              Transform Your Manufacturing Operations
            </h1>
            
            {/* Mobile-optimized description */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              The most advanced AI First Factory Optimization Platform with transparent AI decision-making. 
              <span className="hidden sm:inline"> Trust AI that shows its thinking and learns from your expertise.</span>
            </p>
            
            {/* Mobile-optimized CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
              >
                Start Free Trial
                <Rocket className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={handleWatchDemo}
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold border-2"
              >
                <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Watch 3-Min Demo
              </Button>
            </div>
            
            {/* Pricing indicator for transparency */}
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              Starting at <span className="font-semibold text-primary">$499/month</span> • No credit card required • Cancel anytime
            </p>

            {/* Mobile-optimized Trust Indicators */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span>FDA Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span>ISO Certified</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span>500+ Customers</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Optimized */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard 
              value="25%" 
              label="Cost Reduction" 
              description="Avg. savings"
            />
            <StatCard 
              value="30%" 
              label="Efficiency" 
              description="Improvement"
            />
            <StatCard 
              value="95%" 
              label="On-Time" 
              description="Delivery rate"
            />
            <StatCard 
              value="24/7" 
              label="AI Monitor" 
              description="Always on"
            />
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Cpu className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Advanced Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">Everything You Need for Manufacturing Excellence</h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-6 lg:px-0">
              AI-powered platform with transparent decision-making and proven ROI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                roi={feature.roi}
                highlight={feature.highlight}
              />
            ))}
          </div>
          
          {/* Mobile-friendly detailed features link */}
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/ai-features')}
              className="text-sm sm:text-base"
            >
              Explore All Features
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <TrendingUp className="w-4 h-4 mr-2" />
                Proven Results</Badge>
              <h2 className="text-4xl font-bold mb-6">Measurable Impact on Your Operations</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join hundreds of manufacturers who have transformed their operations with our AI-powered platform. 
                See real results in weeks, not months.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">$2.5M</div>
                  <div className="text-sm text-muted-foreground">Annual Savings</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">3x</div>
                  <div className="text-sm text-muted-foreground">Faster Planning</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">ROI</div>
                  <div className="text-sm text-muted-foreground">6 Months</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Customer Success
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Trusted by Industry Leaders</h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              See how manufacturers are transforming their operations with PlanetTogether
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-1">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl mb-4 italic text-muted-foreground leading-relaxed">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div className="mb-3">
                    <p className="font-semibold text-sm sm:text-base">{testimonials[activeTestimonial].author}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {testimonials[activeTestimonial].title}, {testimonials[activeTestimonial].company}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {testimonials[activeTestimonial].results}
                  </Badge>
                </div>
              </div>
              
              {/* Mobile-friendly testimonial navigation */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Industries Section - Mobile Optimized */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Industry Solutions
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Built for Your Industry</h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Specialized solutions for regulated manufacturing industries
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{industry.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">{industry.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {industry.customers} customers
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Section - NEW */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border-yellow-400">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              For Investors
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">A Compelling Investment Opportunity</h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Leading the $12B manufacturing software market with AI-first innovation
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
            {investorMetrics.map((item, index) => (
              <Card key={index} className="p-4 sm:p-6 text-center hover:shadow-lg transition-all">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">
                  {item.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold mb-1">{item.metric}</div>
                <Badge variant="secondary" className="text-xs">
                  {item.growth}
                </Badge>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/investor-deck')}
              className="px-6 sm:px-8 py-4 sm:py-5 text-sm sm:text-base"
            >
              <BarChart3 className="mr-2 w-4 h-4" />
              View Investor Deck
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Transform Your Manufacturing?</h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 px-4 sm:px-0">
              Join 500+ manufacturers already using PlanetTogether. See ROI in weeks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button 
                size="lg" 
                variant="default"
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold bg-white dark:bg-gray-800 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
              >
                Start Free Trial
                <Rocket className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleWatchDemo}
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold bg-white/10 dark:bg-gray-800/10 border-2 border-white text-white hover:bg-white/20 dark:hover:bg-gray-800/20"
              >
                Schedule Demo
                <Calendar className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-3 sm:flex sm:justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm opacity-80">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>15-min setup</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>No setup fees</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>SOC 2 certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingHome;