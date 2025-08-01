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

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, highlight = false }) => (
  <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${highlight ? 'border-primary bg-primary/5' : ''}`}>
    <CardHeader className="pb-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

interface StatCardProps {
  value: string;
  label: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description }) => (
  <div className="text-center p-6">
    <div className="text-4xl font-bold text-primary mb-2">{value}</div>
    <div className="text-lg font-semibold mb-1">{label}</div>
    <div className="text-sm text-muted-foreground">{description}</div>
  </div>
);

const MarketingHome: React.FC = () => {
  const [, setLocation] = useLocation();
  const { logout, isAuthenticated } = useAuth();

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
      icon: <Bot className="w-6 h-6" />,
      title: "AI-Powered Intelligence",
      description: "Advanced AI assistant Max provides real-time insights, predictive analytics, and intelligent recommendations for optimal production planning.",
      highlight: true
    },
    {
      icon: <Factory className="w-6 h-6" />,
      title: "Smart Manufacturing",
      description: "Comprehensive production scheduling, resource optimization, and real-time shop floor monitoring for pharmaceutical and industrial manufacturing."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Deep insights into production efficiency, resource utilization, quality metrics, and predictive maintenance with customizable dashboards."
    },
    {
      icon: <Cog className="w-6 h-6" />,
      title: "Process Optimization",
      description: "Intelligent algorithms for backwards and forward scheduling, capacity planning, and resource allocation optimization."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "Role-based access control, audit trails, and compliance management for pharmaceutical and regulated industries."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Manufacturing",
      description: "Multi-plant operations, international compliance, and supply chain visibility across global manufacturing networks."
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
    { name: "Pharmaceutical", description: "FDA-compliant manufacturing processes" },
    { name: "Chemical", description: "Process manufacturing optimization" },
    { name: "Industrial", description: "Discrete manufacturing excellence" },
    { name: "Food & Beverage", description: "Quality and safety management" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Manufacturing Excellence
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Transform Your Manufacturing Operations
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
              The most advanced AI First Factory Optimization Platform for pharmaceutical, chemical, and industrial manufacturing. 
              Optimize production, reduce costs, and accelerate growth with intelligent automation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="px-8 py-6 text-lg font-semibold"
              >
                Start Free Trial
                <Rocket className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                size="lg"
                onClick={handleWatchDemo}
                className="px-8 py-6 text-lg font-semibold"
              >
                <Play className="mr-2 w-5 h-5" />
                Schedule Demo
              </Button>

              <Button 
                variant="ghost" 
                size="lg"
                onClick={handleLogin}
                className="px-8 py-6 text-lg font-semibold border border-primary/20 hover:bg-primary/5"
              >
                Login
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                FDA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                ISO Certified
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                500+ Manufacturers
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                4.9/5 Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard 
              value="25%" 
              label="Cost Reduction" 
              description="Average production cost savings"
            />
            <StatCard 
              value="30%" 
              label="Efficiency Gain" 
              description="Equipment utilization improvement"
            />
            <StatCard 
              value="95%" 
              label="On-Time Delivery" 
              description="Customer satisfaction rate"
            />
            <StatCard 
              value="24/7" 
              label="AI Monitoring" 
              description="Continuous optimization"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Cpu className="w-4 h-4 mr-2" />
              Advanced Features
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need for Manufacturing Excellence</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI First Factory Optimization Platform with AI-powered insights, real-time monitoring, and intelligent optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                highlight={feature.highlight}
              />
            ))}
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

      {/* Industries Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Building2 className="w-4 h-4 mr-2" />
              Industry Solutions
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Built for Your Industry</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Specialized manufacturing solutions tailored to meet the unique requirements of your industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Factory className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{industry.name}</h3>
                <p className="text-sm text-muted-foreground">{industry.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Manufacturing?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join the manufacturing revolution with our AI First Factory Optimization Platform. Start your free trial today and see results in weeks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="default"
                onClick={handleGetStarted}
                className="px-8 py-6 text-lg font-semibold bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Start Free Trial
                <Rocket className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleWatchDemo}
                className="px-8 py-6 text-lg font-semibold bg-white/10 dark:bg-gray-800/10 border-white text-white hover:bg-white/20 dark:hover:bg-gray-800/20"
              >
                Schedule Demo
                <Calendar className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingHome;