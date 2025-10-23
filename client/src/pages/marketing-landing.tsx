import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PublicSiteSearch } from '@/components/public-site-search';
import { 
  Factory, 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Building2,
  Cog,
  Database,
  Bot,
  Smartphone,
  Globe,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Download,
  Award,
  Lightbulb,
  DollarSign,
  Gauge,
  Settings,
  Package,
  Truck,
  Sparkles
} from 'lucide-react';
// Using direct gradient classes for now

interface MarketingPage {
  id: number;
  title: string;
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  language: string;
  targetAudience: string[];
  conversionGoals: string[];
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadCapture {
  id: number;
  pageId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  interests: string[];
  stage: string;
  source: string;
  notes?: string;
  createdAt: Date;
}

interface CustomerStory {
  id: number;
  customerName: string;
  customerTitle: string;
  company: string;
  industry: string;
  companySize: string;
  story: {
    quote: string;
    results: Array<{
      metric: string;
      description: string;
      improvement: string;
    }>;
    solution: string;
    challenge: string;
  };
  storyType: string;
  language: string;
  isApproved: boolean;
  isFeatured: boolean;
}

interface ContentBlock {
  id: number;
  name: string;
  type: string;
  category: string;
  content: {
    text: string;
    button_text?: string;
    button_url?: string;
  };
  language: string;
  usageCount: number;
  isActive: boolean;
}

const MANUFACTURING_SECTORS = [
  { name: 'Automotive', icon: Factory, description: 'Complex assembly operations with stringent quality requirements' },
  { name: 'Aerospace', icon: Settings, description: 'Precision manufacturing with regulatory compliance' },
  { name: 'Electronics', icon: Zap, description: 'High-volume production with component traceability' },
  { name: 'Food & Beverage', icon: Package, description: 'Batch processing with expiration tracking' },
  { name: 'Pharmaceuticals', icon: Shield, description: 'GMP compliance with lot tracking' },
  { name: 'Textiles', icon: Cog, description: 'Multi-stage production with seasonal demands' },
  { name: 'Chemical', icon: Database, description: 'Process manufacturing with safety protocols' },
  { name: 'Metal Fabrication', icon: Building2, description: 'Custom manufacturing with material optimization' }
];

const COMPANY_SIZES = [
  { 
    size: 'Small (1-50 employees)', 
    benefits: ['Quick implementation', 'Immediate ROI', 'Simple workflows'],
    pricing: '$35/user/month'
  },
  { 
    size: 'Medium (51-500 employees)', 
    benefits: ['Multi-department coordination', 'Advanced analytics', 'Workflow automation'],
    pricing: '$75/user/month'
  },
  { 
    size: 'Large (500+ employees)', 
    benefits: ['Enterprise integration', 'Custom solutions', 'Dedicated support'],
    pricing: '$125/user/month'
  }
];

const BUYER_PERSONAS = [
  {
    role: 'C-Suite Executive',
    pain_points: ['Visibility into operations', 'Cost optimization', 'Strategic planning'],
    value_props: ['Real-time dashboards', 'ROI analytics', 'Strategic insights'],
    icon: TrendingUp
  },
  {
    role: 'Production Manager',
    pain_points: ['Schedule optimization', 'Resource allocation', 'AI decision trust'],
    value_props: ['Transparent AI scheduling', 'Playbook-guided optimization', 'Explainable AI decisions'],
    icon: Target
  },
  {
    role: 'Plant Manager',
    pain_points: ['Multi-line coordination', 'Efficiency monitoring', 'Team management'],
    value_props: ['Unified operations view', 'Performance metrics', 'Team coordination'],
    icon: Factory
  },
  {
    role: 'IT Director',
    pain_points: ['System integration', 'Data security', 'Scalability'],
    value_props: ['API connectivity', 'Enterprise security', 'Cloud architecture'],
    icon: Database
  }
];

const ROI_METRICS = [
  { metric: 'Production Efficiency', improvement: '15-25%', icon: Gauge },
  { metric: 'Cost Reduction', improvement: '10-20%', icon: DollarSign },
  { metric: 'Schedule Adherence', improvement: '20-35%', icon: Clock },
  { metric: 'Quality Improvement', improvement: '12-18%', icon: Award }
];

export default function MarketingLandingPage() {
  const { toast } = useToast();
  
  // AI theme gradient classes
  const aiTheme = {
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600'
  };
  const queryClient = useQueryClient();
  
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedCompanySize, setSelectedCompanySize] = useState('');
  const [leadFormData, setLeadFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    phone: '',
    interests: [] as string[]
  });

  // Fetch customer stories for social proof
  const { data: customerStories = [] } = useQuery<CustomerStory[]>({
    queryKey: ['/api/marketing/customer-stories'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      
      const response = await fetch(`/api/marketing/customer-stories?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customer stories');
      return response.json();
    }
  });

  // Fetch content blocks for dynamic content
  const { data: contentBlocks = [] } = useQuery<ContentBlock[]>({
    queryKey: ['/api/marketing/content-blocks'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLanguage) params.append('language', selectedLanguage);
      
      const response = await fetch(`/api/marketing/content-blocks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch content blocks');
      return response.json();
    }
  });

  // Lead capture mutation
  const leadCaptureMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          pageId: 1, // Main landing page ID
          stage: 'awareness',
          source: 'website_landing'
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
        jobTitle: '',
        phone: '',
        interests: []
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
    leadCaptureMutation.mutate({
      ...leadFormData,
      interests: [selectedIndustry, selectedCompanySize, ...leadFormData.interests].filter(Boolean)
    });
  };

  const handleInterestToggle = (interest: string) => {
    setLeadFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Factory className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">PlanetTogether</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Component */}
              <PublicSiteSearch className="bg-white/10 border-white/20 text-white hover:bg-white/20 [&_span]:text-white [&_svg]:text-white" />
              
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = '/login'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl lg:text-5xl font-bold mb-3">
                Transform Your Manufacturing Operations with 
                <span className={`block ${aiTheme.gradient} bg-clip-text text-transparent`}>
                  Transparent AI Intelligence
                </span>
              </h1>
              <p className="text-lg lg:text-xl mb-4 text-blue-100">
                Join other leading global manufacturers achieving 25% efficiency gains through transparent AI decision-making, 
                collaborative knowledge systems, and intelligent playbook-guided optimization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button 
                  size="lg" 
                  className={`${aiTheme.gradient} hover:opacity-90 text-white px-6 py-3 text-base`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo (2 min)
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-slate-900 px-6 py-3 text-base"
                  onClick={() => window.location.href = '/whats-coming'}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhanced AI Features
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-slate-900 px-6 py-3 text-base"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Consultation
                </Button>
              </div>
              <div className="flex items-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Affordable Starter Edition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>AI transparency & reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Setup in under 1 hour</span>
                </div>
              </div>
            </div>
            
            <div className="lg:justify-self-end">
              <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Get Started Today</CardTitle>
                  <CardDescription>
                    Choose the Starter Edition for immediate access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={leadFormData.firstName}
                        onChange={(e) => setLeadFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                      <Input
                        placeholder="Last Name"
                        value={leadFormData.lastName}
                        onChange={(e) => setLeadFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Work Email"
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Company Name"
                      value={leadFormData.company}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Job Title"
                      value={leadFormData.jobTitle}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                    <Button 
                      type="submit" 
                      className={`w-full ${aiTheme.gradient} hover:opacity-90 text-white`}
                      disabled={leadCaptureMutation.isPending}
                    >
                      {leadCaptureMutation.isPending ? 'Getting Started...' : 'Get Started'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                  <p className="text-xs text-gray-600 mt-4 text-center">
                    By getting started, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Sectors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Leading Manufacturers Across Industries
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From automotive assembly lines to pharmaceutical production, our platform adapts to your specific manufacturing requirements.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {MANUFACTURING_SECTORS.map((sector, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedIndustry === sector.name ? `ring-2 ring-blue-500 ${aiTheme.gradient} bg-clip-border` : ''
                }`}
                onClick={() => setSelectedIndustry(sector.name)}
              >
                <CardContent className="p-6 text-center">
                  <sector.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">{sector.name}</h3>
                  <p className="text-sm text-gray-600">{sector.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Measurable Results from Day One
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Our customers consistently achieve significant improvements in key manufacturing metrics within the first 90 days.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ROI_METRICS.map((metric, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <metric.icon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="text-2xl font-bold mb-2">{metric.improvement}</h3>
                  <p className="text-blue-100">{metric.metric}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Transparency & Playbook Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="text-blue-600 font-semibold">Enhanced AI Intelligence</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transparent AI You Can Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See exactly how our enhanced Max AI makes decisions with transparent reasoning, collaborative playbooks, and explainable intelligence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Lightbulb className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">AI Reasoning Display</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  See step-by-step how Max AI analyzes data, considers options, and makes recommendations. Full transparency in every decision.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Settings className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Playbook Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI learns from your manufacturing expertise through collaborative playbooks, ensuring decisions align with your proven processes.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Gauge className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Confidence Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Every AI recommendation comes with confidence levels and reasoning, so you know when to trust automation and when to review manually.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Buyer Personas Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Solutions Tailored to Your Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a C-suite executive or production manager, our platform provides role-specific insights and tools.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BUYER_PERSONAS.map((persona, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <persona.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <CardTitle className="text-xl">{persona.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-600 mb-2">Pain Points:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {persona.pain_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Our Solutions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {persona.value_props.map((prop, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Stories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Success Stories from Leading Manufacturers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from real companies transforming their operations with our platform.
            </p>
          </div>
          
          {customerStories.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {customerStories.slice(0, 3).map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">{story.industry}</Badge>
                      <Badge variant="secondary">{story.companySize}</Badge>
                    </div>
                    <CardTitle className="text-xl">{story.company}</CardTitle>
                    <CardDescription>{story.customerName} - {story.customerTitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6 italic">"{story.story.quote}"</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {story.story.results.slice(0, 4).map((result, index) => (
                        <div key={index} className="text-center">
                          <div className="text-lg font-bold text-blue-600">{result.improvement}</div>
                          <div className="text-sm text-gray-600">{result.metric}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold">{story.customerName}</div>
                      <div className="text-sm text-gray-600">{story.customerTitle}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Loading customer success stories...
            </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      <section className={`py-20 ${aiTheme.gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to Experience Transparent AI Manufacturing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 1,000+ manufacturers experiencing AI that shows its thinking, learns from expertise, and delivers transparent optimization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Demo Call
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center text-center text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Onboarding support included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}