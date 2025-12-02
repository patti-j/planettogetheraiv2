import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Bot, 
  BarChart3, 
  Users, 
  Settings, 
  Factory, 
  Target, 
  TrendingUp, 
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Calendar,
  Globe,
  Smartphone,
  Database,
  MessageSquare,
  Eye,
  Timer,
  Maximize2,
  Menu,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";

const PresentationPage = () => {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("hero");
  const [isMaximized, setIsMaximized] = useState(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Demo navigation function - redirects to login for protected routes
  const navigateToDemo = (path: string) => {
    // Map to public pages or redirect to login
    const publicPageMap: Record<string, string> = {
      '/dashboard': '/login?returnUrl=/dashboard',
      '/production-schedule': '/login?returnUrl=/production-schedule',
      '/analytics': '/analytics-reporting',
      '/training': '/login?returnUrl=/training',
      '/systems-integration': '/integration-api',
      '/visual-factory': '/login?returnUrl=/visual-factory',
    };
    
    const targetPath = publicPageMap[path] || path;
    setLocation(targetPath);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'overview', 'ai-features', 'core-capabilities', 'roles', 'benefits', 'architecture', 'demo'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPosition >= element.offsetTop && scrollPosition < element.offsetTop + element.offsetHeight) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Factory className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">PlanetTogether Next</span>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {[
                { id: 'hero', label: 'Home' },
                { id: 'overview', label: 'Overview' },
                { id: 'ai-features', label: 'AI Features' },
                { id: 'capabilities', label: 'Capabilities' },
                { id: 'demo', label: 'Demo' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Maximize Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsMaximized(!isMaximized)}
        className="hidden sm:flex fixed top-2 right-16 z-50"
        title={isMaximized ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {/* Hero Section */}
      <section id="hero" className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium">
              🚀 The Future of Manufacturing Management
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              PlanetTogether Next
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Revolutionizing manufacturing operations with AI-powered intelligence, seamless workflows, and adaptive user experiences that transform how we build the future.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
              onClick={() => scrollToSection('demo')}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Demo Tour
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => scrollToSection('overview')}
            >
              Learn More
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { number: "14+", label: "Specialized Roles", icon: Users },
              { number: "AI", label: "Powered Assistant", icon: Bot },
              { number: "Multi", label: "Plant Support", icon: Factory },
              { number: "Real-time", label: "Updates", icon: Zap }
            ].map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="overview" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Manufacturing Intelligence Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              An integrated ecosystem that connects every aspect of your manufacturing operations with intelligent automation and real-time insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Intelligent Operations",
                description: "AI-powered production scheduling with predictive analytics and automated optimization",
                icon: Bot,
                features: ["Smart scheduling algorithms", "Predictive maintenance", "Resource optimization", "Bottleneck detection"]
              },
              {
                title: "Universal Connectivity",
                description: "Seamless integration with existing systems and multi-plant architecture support",
                icon: Globe,
                features: ["ERP/MES integration", "Multi-plant management", "Real-time data sync", "API connectivity"]
              },
              {
                title: "Adaptive Experience",
                description: "Role-based interfaces with personalized workflows and guided training systems",
                icon: Users,
                features: ["14 specialized roles", "Guided tour system", "Voice assistance", "Mobile responsive"]
              }
            ].map((item, index) => (
              <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <item.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section id="ai-features" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Max AI Assistant</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your intelligent manufacturing companion that understands context, performs actions, and learns from your workflow patterns.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                {
                  title: "Universal UI Control",
                  description: "Max can perform any action you can do - opening forms, creating dashboards, navigating pages",
                  icon: Settings
                },
                {
                  title: "Chart Generation",
                  description: "Create pie charts, bar charts, Gantt charts, and histograms from natural language requests",
                  icon: BarChart3
                },
                {
                  title: "Voice Interaction",
                  description: "Complete voice control with speech-to-text input and natural voice responses",
                  icon: MessageSquare
                },
                {
                  title: "Memory System",
                  description: "Learns your workflow patterns and preferences with user-controllable memory management",
                  icon: Bot
                },
                {
                  title: "Canvas Visualization",
                  description: "Dynamic workspace for creating interactive dashboards and data visualizations",
                  icon: Eye
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-md">
                    <feature.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Sparkles className="h-8 w-8" />
                    <div>
                      <h3 className="text-xl font-semibold">Max AI Assistant</h3>
                      <p className="text-purple-100">Intelligent Manufacturing Companion</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">User:</p>
                    <p className="text-gray-800">"Show me a pie chart of job status distribution"</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-2">Max:</p>
                    <p className="text-gray-800">"I've created a pie chart showing your job status distribution. I can see 2 active jobs currently in the system. The chart is now displayed in your canvas."</p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => navigateToDemo('/dashboard')}
                  >
                    Try Max Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Manufacturing Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every tool you need to optimize production, manage resources, and drive continuous improvement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Production Scheduling",
                description: "Visual Gantt charts with drag-and-drop scheduling and real-time optimization",
                icon: Calendar,
                demo: "/production-schedule"
              },
              {
                title: "Analytics & Reporting",
                description: "Comprehensive dashboards with AI-generated insights and custom reporting",
                icon: BarChart3,
                demo: "/analytics"
              },
              {
                title: "Resource Management",
                description: "Capability-based resource allocation with multi-plant support",
                icon: Users,
                demo: "/dashboard"
              },
              {
                title: "Systems Integration",
                description: "Connect with ERP, MES, and other manufacturing systems",
                icon: Database,
                demo: "/systems-integration"
              },
              {
                title: "Visual Factory",
                description: "Shop floor visualization with real-time status monitoring",
                icon: Factory,
                demo: "/visual-factory"
              },
              {
                title: "Training & Tours",
                description: "Guided learning experiences with voice narration and role-specific content",
                icon: Timer,
                demo: "/training"
              }
            ].map((capability, index) => (
              <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                   onClick={() => navigateToDemo(capability.demo)}>
                <CardHeader>
                  <capability.icon className="h-12 w-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{capability.title}</CardTitle>
                  <CardDescription>{capability.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-blue-50">
                    Explore Feature
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section id="roles" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Specialized Role Experiences</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored interfaces and workflows for every manufacturing role, from executives to operators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Director", color: "bg-purple-100 text-purple-800", icon: TrendingUp },
              { name: "Plant Manager", color: "bg-blue-100 text-blue-800", icon: Factory },
              { name: "Production Scheduler", color: "bg-green-100 text-green-800", icon: Calendar },
              { name: "Data Analyst", color: "bg-orange-100 text-orange-800", icon: BarChart3 },
              { name: "IT Administrator", color: "bg-red-100 text-red-800", icon: Settings },
              { name: "Quality Manager", color: "bg-indigo-100 text-indigo-800", icon: Target },
              { name: "Sales Representative", color: "bg-teal-100 text-teal-800", icon: Users },
              { name: "Customer Service", color: "bg-pink-100 text-pink-800", icon: MessageSquare }
            ].map((role, index) => (
              <Card key={index} className="text-center border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                   onClick={() => navigateToDemo('/training')}>
                <CardContent className="pt-6">
                  <role.icon className="h-8 w-8 mx-auto mb-3 text-gray-600 group-hover:scale-110 transition-transform" />
                  <Badge className={`${role.color} mb-2`}>{role.name}</Badge>
                  <p className="text-xs text-gray-500 mt-2">Guided tour available</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Benefits */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transform Your Manufacturing Operations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Drive efficiency, reduce costs, and accelerate growth with intelligent manufacturing management.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: "Operational Excellence",
                benefits: [
                  "40% reduction in scheduling time",
                  "25% improvement in resource utilization",
                  "Real-time visibility across all operations",
                  "Automated bottleneck detection and resolution"
                ]
              },
              {
                title: "Enhanced Productivity",
                benefits: [
                  "AI-powered optimization recommendations",
                  "Predictive maintenance scheduling",
                  "Streamlined workflows and processes",
                  "Reduced manual data entry and errors"
                ]
              },
              {
                title: "Strategic Growth",
                benefits: [
                  "Data-driven decision making",
                  "Scalable multi-plant architecture",
                  "Comprehensive analytics and reporting",
                  "Continuous improvement insights"
                ]
              }
            ].map((section, index) => (
              <Card key={index} className="h-full border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section id="architecture" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Modern Technology Stack</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge technologies for performance, scalability, and maintainability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { category: "Frontend", tech: ["React 18", "TypeScript", "Tailwind CSS", "Shadcn/UI"] },
              { category: "Backend", tech: ["Express.js", "PostgreSQL", "Drizzle ORM", "Node.js"] },
              { category: "AI & Voice", tech: ["OpenAI GPT-4o", "Whisper API", "TTS Integration", "Claude Sonnet"] },
              { category: "Features", tech: ["Real-time updates", "Mobile responsive", "Voice control", "Multi-plant"] }
            ].map((stack, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-center">{stack.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {stack.tech.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 text-center py-1 px-2 bg-white rounded border">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Experience PlanetTogether Next</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Take a guided tour through our manufacturing intelligence platform and see how it transforms operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Demo Journey</h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Executive Dashboard", description: "Start with strategic overview and key metrics", path: "/dashboard" },
                  { step: "2", title: "Production Scheduling", description: "Explore visual Gantt charts and drag-and-drop scheduling", path: "/production-schedule" },
                  { step: "3", title: "Max AI Assistant", description: "Interact with AI assistant and voice controls", path: "/dashboard" },
                  { step: "4", title: "Analytics & Insights", description: "Dive into performance metrics and AI-generated insights", path: "/analytics" },
                  { step: "5", title: "Role-Specific Training", description: "Experience guided tours for different manufacturing roles", path: "/training" }
                ].map((item, index) => (
                  <div key={index} 
                       className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                       onClick={() => navigateToDemo(item.path)}>
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8 text-center">
                <Rocket className="h-16 w-16 mx-auto mb-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin?</h3>
                <p className="text-gray-600 mb-6">
                  Start your journey with PlanetTogether Next and discover how AI-powered manufacturing management can transform your operations.
                </p>
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={() => navigateToDemo('/training')}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Guided Tour
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigateToDemo('/dashboard')}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Explore Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">The Future of Manufacturing is Here</h2>
          <p className="text-xl mb-8 opacity-90">
            Join PlanetTogether in revolutionizing manufacturing operations with intelligent automation, 
            seamless workflows, and the power of AI-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
              onClick={() => navigateToDemo('/training')}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Begin Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
              onClick={() => scrollToSection('hero')}
            >
              Back to Top
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PresentationPage;