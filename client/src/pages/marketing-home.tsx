import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Calendar,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface ExtendedFeatureCardProps extends FeatureCardProps {
  roi?: string;
  link?: string;
  onNavigate?: (path: string) => void;
}

const FeatureCard: React.FC<ExtendedFeatureCardProps> = ({ icon, title, description, roi, highlight = false, link, onNavigate }) => {
  const handleClick = () => {
    if (link && onNavigate) {
      onNavigate(link);
    }
  };

  return (
    <Card 
      className={`group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 rounded-2xl overflow-hidden ${highlight ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 relative' : 'bg-white border border-gray-100'} ${link ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-orange-500 text-white text-xs sm:text-sm px-4 py-2 rounded-bl-xl font-bold shadow-lg">
          ✨ MOST POPULAR
        </div>
      )}
      <CardHeader className="pb-4 sm:pb-6 p-6 sm:p-8">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 ${highlight ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'}`}>
          {icon}
        </div>
        <CardTitle className="text-lg sm:text-xl lg:text-2xl leading-tight font-bold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 sm:p-8 pt-0">
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{description}</p>
        {roi && (
          <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            {roi}
          </div>
        )}
        {link && (
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium group-hover:text-blue-700">
            Learn more <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description }) => (
  <div className="group text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">{value}</div>
    <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{label}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </div>
);

const MarketingHome: React.FC = () => {
  const [, setLocation] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [leadFormData, setLeadFormData] = React.useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: ''
  });

  const leadCaptureMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          pageId: 1,
          stage: 'awareness',
          source: 'website_home'
        })
      });
      if (!response.ok) throw new Error('Failed to capture lead');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your interest!",
        description: "We'll be in touch within 24 hours to schedule your personalized demo."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/leads'] });
      setLeadFormData({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: ''
      });
    },
    onError: () => {
      toast({
        title: "Submission Error",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  });

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    leadCaptureMutation.mutate(leadFormData);
  };

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
      highlight: true,
      link: "/ai-features"
    },
    {
      icon: <Factory className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Smart Manufacturing",
      description: "Real-time production scheduling and resource optimization.",
      fullDescription: "Comprehensive production scheduling, resource optimization, and real-time shop floor monitoring for pharmaceutical and industrial manufacturing.",
      roi: "30% efficiency improvement",
      link: "/supply-chain"
    },
    {
      icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Advanced Analytics",
      description: "AI-powered insights and predictive maintenance.",
      fullDescription: "Deep insights into production efficiency, resource utilization, quality metrics, and predictive maintenance with customizable dashboards.",
      roi: "45% faster issue detection",
      link: "/analytics-reporting"
    },
    {
      icon: <Cog className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "AI Knowledge System",
      description: "Collaborative playbook system that learns from your expertise.",
      fullDescription: "Collaborative playbook system where AI learns from your manufacturing expertise and provides transparent, knowledge-driven recommendations for better decisions.",
      roi: "50% knowledge retention",
      link: "/theory-of-constraints"
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Enterprise Security",
      description: "FDA-compliant security and audit trails.",
      fullDescription: "Role-based access control, audit trails, and compliance management for pharmaceutical and regulated industries.",
      roi: "100% compliance rate",
      link: "/security-features"
    },
    {
      icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Global Manufacturing",
      description: "Multi-plant operations with global visibility.",
      fullDescription: "Multi-plant operations, international compliance, and supply chain visibility across global manufacturing networks.",
      roi: "Unlimited scalability",
      link: "/enterprise-scalability"
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
    { name: "Food Production", description: "Quality, safety, and freshness management", customers: "60+" },
    { name: "Beverage Production", description: "Fermentation and packaging optimization", customers: "40+" }
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
    <div className="min-h-screen bg-background">
      {/* Hero Section - Enhanced Modern Design */}
      <section className="relative overflow-hidden bg-black text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}} />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced badge with glow effect */}
            <div className="mb-6 sm:mb-8">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse" />
                AI-Powered Manufacturing Excellence
              </Badge>
            </div>
            
            {/* Enhanced heading with better typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Manufacturing Operations
              </span>
            </h1>
            
            {/* Enhanced description with better contrast */}
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0 font-light">
              The most advanced <span className="font-semibold text-white">AI-First Factory Optimization Platform</span> with transparent AI decision-making.
              <br className="hidden sm:block" />
              <span className="text-purple-200">Trust AI that shows its thinking and learns from your expertise.</span>
            </p>
            
            {/* Enhanced CTAs with modern styling */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-10 sm:mb-12 px-4 sm:px-0">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="group relative w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center">
                  Start Free Trial
                  <Rocket className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
              
              <Button 
                size="lg"
                onClick={handleWatchDemo}
                className="group relative w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center">
                  <Play className="mr-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
                  Watch 3-Min Demo
                </span>
              </Button>
            </div>
            
            {/* Enhanced pricing indicator */}
            <div className="mb-8 sm:mb-10">
              <p className="text-base sm:text-lg text-blue-200 font-medium">
                Starting at <span className="font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1 rounded-full text-base sm:text-lg">$499/month</span>
              </p>
              <p className="text-sm sm:text-base text-blue-300 mt-2">
                No credit card required • Cancel anytime • 30-day money-back guarantee
              </p>
            </div>

            {/* Enhanced Trust Indicators with better styling */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mb-1" />
                <span className="text-sm sm:text-base font-semibold text-white">FDA Compliant</span>
                <span className="text-xs text-blue-200">Regulatory Ready</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mb-1" />
                <span className="text-sm sm:text-base font-semibold text-white">ISO Certified</span>
                <span className="text-xs text-blue-200">Quality Standards</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-1" />
                <span className="text-sm sm:text-base font-semibold text-white">500+ Customers</span>
                <span className="text-xs text-blue-200">Global Trust</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mb-1" />
                <span className="text-sm sm:text-base font-semibold text-white">4.9/5 Rating</span>
                <span className="text-xs text-blue-200">Top Rated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Get Started Today
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-8">
                Join leading manufacturers achieving 25% efficiency gains through transparent AI decision-making 
                and intelligent playbook-guided optimization.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100">Personalized demo tailored to your industry</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100">See ROI projections for your operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100">Get started in under 1 hour</span>
                </div>
              </div>
            </div>
            
            <div className="lg:justify-self-end w-full max-w-md">
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl text-gray-900">Request a Demo</CardTitle>
                  <CardDescription className="text-gray-600">
                    Fill out the form and we'll be in touch within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="space-y-4" data-testid="lead-capture-form">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={leadFormData.firstName}
                        onChange={(e) => setLeadFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        data-testid="input-first-name"
                      />
                      <Input
                        placeholder="Last Name"
                        value={leadFormData.lastName}
                        onChange={(e) => setLeadFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Work Email"
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-email"
                    />
                    <Input
                      placeholder="Company Name"
                      value={leadFormData.company}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                      data-testid="input-company"
                    />
                    <Input
                      placeholder="Job Title"
                      value={leadFormData.jobTitle}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      data-testid="input-job-title"
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
                      disabled={leadCaptureMutation.isPending}
                      data-testid="button-submit-lead"
                    >
                      {leadCaptureMutation.isPending ? 'Submitting...' : 'Request Demo'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By submitting, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
              <BarChart3 className="w-4 h-4 mr-2" />
              Proven Performance
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Results That <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Speak Volumes</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Real improvements from real customers across the globe
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="group text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">25%</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Cost Reduction</div>
              <div className="text-sm text-gray-600">Average savings achieved</div>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">30%</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Efficiency</div>
              <div className="text-sm text-gray-600">Operational improvement</div>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">On-Time</div>
              <div className="text-sm text-gray-600">Delivery performance</div>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">AI Monitor</div>
              <div className="text-sm text-gray-600">Always optimizing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute inset-0 bg-grid-slate-100/30" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-6 py-3 text-base font-medium shadow-lg">
              <Cpu className="w-5 h-5 mr-2" />
              Advanced AI Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 px-2 text-gray-900">
              Everything You Need for <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Manufacturing Excellence</span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 leading-relaxed">
              AI-powered platform with transparent decision-making and proven ROI across every manufacturing process.
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
                link={feature.link}
                onNavigate={setLocation}
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