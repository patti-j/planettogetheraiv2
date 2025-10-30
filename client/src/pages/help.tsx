import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  Settings, 
  AlertTriangle,
  Zap,
  Users,
  FileText,
  Video,
  ExternalLink
} from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        question: "How do I navigate the dashboard?",
        answer: "Use the left navigation panel to access different modules. Recent pages are available in the header for quick access. The mobile version uses a bottom navigation bar for easy thumb navigation."
      },
      {
        question: "What are the main features of PlanetTogether?",
        answer: "PlanetTogether provides production scheduling, resource management, demand planning, supply chain optimization, and AI-powered analytics for manufacturing operations."
      },
      {
        question: "How do I customize my dashboard?",
        answer: "Go to Settings > Dashboard Layout to configure widgets, header items, and display preferences. Changes are saved automatically to your profile."
      }
    ]
  },
  {
    id: "scheduling",
    title: "Production Scheduling",
    icon: <Calendar className="h-4 w-4" />,
    items: [
      {
        question: "How do I create a production schedule?",
        answer: "Navigate to Production Schedule and use the Gantt chart interface to drag and drop operations. The system automatically handles resource constraints and dependencies."
      },
      {
        question: "What is the Master Production Schedule (MPS)?",
        answer: "MPS provides demand-supply alignment with configurable time periods (daily, weekly, monthly, quarterly). Use it to identify and resolve supply-demand misalignments."
      },
      {
        question: "How does resource optimization work?",
        answer: "The system uses advanced algorithms to balance resource utilization, minimize setup times, and optimize throughput while respecting capacity constraints."
      }
    ]
  },
  {
    id: "alerts",
    title: "Alerts & Monitoring",
    icon: <AlertTriangle className="h-4 w-4" />,
    items: [
      {
        question: "How do I manage alerts?",
        answer: "View all alerts in the Alerts page. You can acknowledge, resolve, or escalate alerts. Use filters to focus on specific types or priorities."
      },
      {
        question: "What is AI Analysis Configuration?",
        answer: "Configure automated AI analysis with custom schedules, trigger types, and analysis scope. Set up proactive monitoring and intelligent recommendations."
      },
      {
        question: "How do alert notifications work?",
        answer: "Alerts can be delivered via email, desktop notifications, or in-app messages. Configure your preferences in Settings > Notifications."
      }
    ]
  },
  {
    id: "collaboration",
    title: "Collaboration",
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      {
        question: "How does the chat system work?",
        answer: "Create channels for team communication, direct messages, and project discussions. Share files, mentions, and integrate with production workflows."
      },
      {
        question: "What are demand management comments?",
        answer: "Add comments to demand planning items for collaborative decision-making. Comments support mentions, attachments, and approval workflows."
      },
      {
        question: "How do I invite team members?",
        answer: "Go to User Management to invite colleagues, assign roles, and configure permissions based on their responsibilities."
      }
    ]
  },
  {
    id: "optimization",
    title: "AI & Optimization",
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        question: "What is the Optimization Studio?",
        answer: "A comprehensive workspace for algorithm management, deployment tracking, and performance monitoring. Includes governance controls and version management."
      },
      {
        question: "How does AI analysis work?",
        answer: "AI continuously monitors production data, identifies patterns, and provides actionable recommendations for efficiency improvements and problem resolution."
      },
      {
        question: "Can I customize optimization algorithms?",
        answer: "Yes, through Algorithm Governance you can deploy custom algorithms, manage versions, and control plant-specific approvals."
      }
    ]
  },
  {
    id: "data",
    title: "Data Management",
    icon: <FileText className="h-4 w-4" />,
    items: [
      {
        question: "How do I import data from other systems?",
        answer: "Use the Data Import features to connect with external systems, Excel files, and databases. Support for PlanetTogether Publish/Import formats is included."
      },
      {
        question: "What is the Data Schema visualization?",
        answer: "Interactive visualization of database relationships with lasso selection, zoom controls, and relationship analysis tools for understanding data structures."
      },
      {
        question: "How do I backup my data?",
        answer: "Data is automatically backed up to secure cloud storage. Manual exports are available through Reports > Data Export."
      }
    ]
  }
];

const quickActions = [
  { label: "Create Production Order", icon: <Calendar className="h-4 w-4" />, path: "/production-schedule" },
  { label: "View Alerts", icon: <AlertTriangle className="h-4 w-4" />, path: "/alerts" },
  { label: "Open Chat", icon: <MessageSquare className="h-4 w-4" />, path: "/chat" },
  { label: "Optimization Studio", icon: <Zap className="h-4 w-4" />, path: "/optimization-studio" },
  { label: "User Settings", icon: <Settings className="h-4 w-4" />, path: "/settings" },
  { label: "Master Data", icon: <FileText className="h-4 w-4" />, path: "/master-data" }
];

const videoTutorials = [
  { title: "Getting Started with PlanetTogether", duration: "5:30", thumbnail: "🎬" },
  { title: "Production Scheduling Basics", duration: "8:15", thumbnail: "📅" },
  { title: "AI Analysis Configuration", duration: "6:45", thumbnail: "🤖" },
  { title: "Data Import and Integration", duration: "12:20", thumbnail: "📊" },
  { title: "Advanced Optimization Techniques", duration: "15:45", thumbnail: "⚡" }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("getting-started");

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.items.some(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers, tutorials, and resources to get the most out of PlanetTogether
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              {helpSections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-1 text-xs">
                  {section.icon}
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {helpSections.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {section.icon}
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {section.items.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.answer}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.path}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Video Tutorials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {videoTutorials.map((video, index) => (
                <div key={index} className="p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{video.thumbnail}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{video.title}</h4>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {video.duration}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </div>
              <div className="space-y-2">
                <a
                  href="/chat"
                  className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Live Chat</span>
                </a>
                <a
                  href="mailto:support@planettogether.com"
                  className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm">Email Support</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}