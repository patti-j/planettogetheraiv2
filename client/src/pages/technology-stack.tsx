import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, Database, Cloud, Code, Cpu, Monitor, Globe, 
  Shield, Zap, BarChart3, Layers, Sparkles, Settings,
  CheckCircle, ArrowRight, Bot, FileText, Gauge
} from "lucide-react";

const TechnologyStack = () => {
  const frontendTechnologies = [
    { name: "React 18", version: "18.x", description: "Modern UI framework with hooks and concurrent features", category: "Core" },
    { name: "TypeScript", version: "5.x", description: "Type-safe JavaScript development", category: "Core" },
    { name: "Vite", version: "Latest", description: "Fast build tool and development server", category: "Build" },
    { name: "Tailwind CSS", version: "3.x", description: "Utility-first CSS framework", category: "Styling" },
    { name: "Shadcn/UI", version: "Latest", description: "Component library built on Radix UI primitives", category: "UI" },
    { name: "Radix UI", version: "Latest", description: "Accessible component primitives", category: "UI" },
    { name: "TanStack Query", version: "5.x", description: "Powerful data synchronization for React", category: "State" },
    { name: "Wouter", version: "Latest", description: "Minimalist React router", category: "Routing" },
    { name: "React DnD", version: "Latest", description: "Drag and drop for React", category: "Interaction" },
    { name: "Bryntum Scheduler Pro", version: "6.3.1", description: "Enterprise Gantt chart with optimization algorithms", category: "Scheduling" },
    { name: "Chart.js", version: "4.5.0", description: "Data visualization and charts", category: "Visualization" },
    { name: "Recharts", version: "Latest", description: "React charting library", category: "Visualization" }
  ];

  const backendTechnologies = [
    { name: "Node.js", version: "20.x", description: "JavaScript runtime environment", category: "Runtime" },
    { name: "Express.js", version: "Latest", description: "Web application framework", category: "Framework" },
    { name: "TypeScript", version: "5.x", description: "Type-safe server development", category: "Language" },
    { name: "PostgreSQL", version: "15+", description: "Advanced relational database", category: "Database" },
    { name: "Drizzle ORM", version: "Latest", description: "Type-safe SQL ORM", category: "Database" },
    { name: "Neon Database", version: "Latest", description: "Serverless PostgreSQL platform", category: "Database" },
    { name: "Redis", version: "7.x", description: "In-memory data structure store", category: "Cache" },
    { name: "OpenAI API", version: "Latest", description: "GPT-4o integration for AI features", category: "AI" },
    { name: "Anthropic Claude", version: "Latest", description: "Advanced AI assistant integration", category: "AI" },
    { name: "AWS SES", version: "Latest", description: "Email delivery service", category: "Communication" },
    { name: "Google Cloud Storage", version: "Latest", description: "Object storage and CDN", category: "Storage" },
    { name: "Stripe", version: "Latest", description: "Payment processing", category: "Payments" }
  ];

  const infrastructureTechnologies = [
    { name: "Replit Deployments", version: "Latest", description: "Automated deployment platform", category: "Deployment" },
    { name: "Docker", version: "Latest", description: "Containerization platform", category: "Containers" },
    { name: "GitHub", version: "Latest", description: "Version control and CI/CD", category: "DevOps" },
    { name: "Neon Database", version: "Latest", description: "Serverless PostgreSQL with branching", category: "Database" },
    { name: "CloudFlare", version: "Latest", description: "CDN and security", category: "Network" },
    { name: "SSL/TLS", version: "1.3", description: "End-to-end encryption", category: "Security" }
  ];

  const architecturalFeatures = [
    { title: "Multi-Tenant Architecture", description: "Supports multiple companies with data isolation" },
    { title: "Role-Based Access Control", description: "Granular permissions system with feature-action mapping" },
    { title: "Real-Time Synchronization", description: "Live updates across all connected clients" },
    { title: "AI-First Design", description: "Integrated artificial intelligence throughout the platform" },
    { title: "Microservices Ready", description: "Modular architecture for easy scaling and deployment" },
    { title: "Mobile Responsive", description: "Progressive web app with mobile-first design" },
    { title: "Enterprise Security", description: "SOC 2 compliant with advanced security measures" },
    { title: "API-First", description: "RESTful APIs with comprehensive documentation" }
  ];

  const performanceMetrics = [
    { metric: "Page Load Time", value: "< 2 seconds", description: "Optimized for fast initial load" },
    { metric: "Database Response", value: "< 100ms", description: "Efficient query optimization" },
    { metric: "Uptime SLA", value: "99.9%", description: "Enterprise-grade reliability" },
    { metric: "Concurrent Users", value: "1000+", description: "Horizontal scaling capability" },
    { metric: "Data Processing", value: "Real-time", description: "Live data synchronization" },
    { metric: "Mobile Performance", value: "90+ Lighthouse", description: "Optimized mobile experience" }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Technology Stack Overview</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          PlanetTogether leverages cutting-edge technologies to deliver enterprise-grade manufacturing 
          optimization and supply chain management solutions.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Code className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">React 18</div>
            <div className="text-sm text-muted-foreground">Frontend Framework</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">PostgreSQL</div>
            <div className="text-sm text-muted-foreground">Database Engine</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">GPT-4o</div>
            <div className="text-sm text-muted-foreground">AI Integration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gauge className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frontend" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="frontend">Frontend</TabsTrigger>
          <TabsTrigger value="backend">Backend</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        {/* Frontend Technologies */}
        <TabsContent value="frontend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Frontend Technologies
              </CardTitle>
              <CardDescription>
                Modern React-based frontend with TypeScript, delivering exceptional user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frontendTechnologies.map((tech, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{tech.name}</h4>
                      <Badge variant="secondary">{tech.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                    <div className="text-xs font-mono text-blue-600">{tech.version}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backend Technologies */}
        <TabsContent value="backend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Backend Technologies
              </CardTitle>
              <CardDescription>
                Robust Node.js backend with PostgreSQL database and AI integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backendTechnologies.map((tech, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{tech.name}</h4>
                      <Badge variant="secondary">{tech.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                    <div className="text-xs font-mono text-blue-600">{tech.version}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure */}
        <TabsContent value="infrastructure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Infrastructure & DevOps
              </CardTitle>
              <CardDescription>
                Enterprise-grade infrastructure with automated deployment and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {infrastructureTechnologies.map((tech, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{tech.name}</h4>
                      <Badge variant="secondary">{tech.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                    <div className="text-xs font-mono text-blue-600">{tech.version}</div>
                  </div>
                ))}
              </div>

              {/* Performance Metrics */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performanceMetrics.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.metric}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {item.value}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                System Architecture
              </CardTitle>
              <CardDescription>
                Scalable, secure, and maintainable architecture designed for enterprise manufacturing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Architectural Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architecturalFeatures.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold">{feature.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Data Flow */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Data Flow Architecture</h3>
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium">Client Applications</div>
                      <div className="text-sm text-muted-foreground">React Web App</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <Server className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="font-medium">API Gateway</div>
                      <div className="text-sm text-muted-foreground">Express.js Server</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="font-medium">Database Layer</div>
                      <div className="text-sm text-muted-foreground">PostgreSQL + Redis</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="font-medium">AI Services</div>
                      <div className="text-sm text-muted-foreground">OpenAI + Claude</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Security & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold">Authentication</h4>
                    <p className="text-sm text-muted-foreground">Role-based access control with JWT tokens</p>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <Zap className="h-6 w-6 text-yellow-600" />
                    <h4 className="font-semibold">Encryption</h4>
                    <p className="text-sm text-muted-foreground">End-to-end TLS 1.3 encryption</p>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <FileText className="h-6 w-6 text-green-600" />
                    <h4 className="font-semibold">Compliance</h4>
                    <p className="text-sm text-muted-foreground">SOC 2 Type II and GDPR compliant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investment Highlights */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Investment Technology Highlights
          </CardTitle>
          <CardDescription>
            Key technical advantages for potential investors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">Competitive Advantages</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Licensed Bryntum Scheduler Pro with full optimization algorithms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">AI-first architecture with GPT-4o integration throughout</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Multi-tenant SaaS architecture ready for enterprise scaling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Real-time production optimization and resource allocation</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600">Technical Scalability</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Serverless PostgreSQL with automatic scaling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Microservices-ready modular architecture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Cloud-native deployment with CI/CD automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Enterprise-grade security and compliance framework</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnologyStack;