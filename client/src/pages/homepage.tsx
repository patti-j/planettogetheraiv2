import React from 'react';
import { DashboardCardContainer } from '@/components/dashboard-card-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  Factory, 
  Target,
  Database,
  Shield,
  FileText,
  MessageSquare,
  Lightbulb,
  Clock,
  Activity,
  Wrench,
  Package,
  Truck,
  DollarSign,
  UserCheck,
  Phone
} from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  priority: number;
}

export default function Homepage() {
  // Log when homepage renders
  console.log('🏠 Homepage component is rendering!');
  
  // Convert feature cards to dashboard cards
  const createDashboardCards = (items: FeatureCard[], colorClass: string) => {
    return items.map((item, index) => ({
      id: `${item.route}-${index}`,
      priority: item.priority,
      content: (
        <Link href={item.route}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${colorClass} rounded-lg`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        </Link>
      )
    }));
  };

  // Recent & Favorites section
  const recentItems: FeatureCard[] = [
    { title: "Production Schedule", description: "View and manage production operations", icon: Calendar, route: "/production-schedule", priority: 1 },
    { title: "Analytics", description: "Production performance insights", icon: BarChart3, route: "/analytics", priority: 2 },
    { title: "Operations", description: "Shop floor operations management", icon: Factory, route: "/shop-floor", priority: 3 },
    { title: "Resources", description: "Equipment and workforce management", icon: Users, route: "/resources", priority: 4 },
    { title: "Reports", description: "Comprehensive production reports", icon: FileText, route: "/reports", priority: 5 },
    { title: "Data Schema", description: "Database structure visualization", icon: Database, route: "/data-schema", priority: 6 },
  ];

  // Planning & Scheduling section
  const planningItems: FeatureCard[] = [
    { title: "Production Schedule", description: "Visual Gantt chart scheduling", icon: Calendar, route: "/production-schedule", priority: 1 },
    { title: "Optimization Studio", description: "AI-powered schedule optimization", icon: Target, route: "/optimization-studio", priority: 2 },
    { title: "Resource Planning", description: "Equipment and capacity planning", icon: Users, route: "/resources", priority: 3 },
    { title: "Scheduling History", description: "Historical scheduling data", icon: Clock, route: "/scheduling-history", priority: 4 },
  ];

  // Operations section
  const operationsItems: FeatureCard[] = [
    { title: "Shop Floor", description: "Real-time operations monitoring", icon: Factory, route: "/shop-floor", priority: 1 },
    { title: "Operator Dashboard", description: "Operator workstation interface", icon: Activity, route: "/operator-dashboard", priority: 2 },
    { title: "Maintenance", description: "Equipment maintenance tracking", icon: Wrench, route: "/maintenance", priority: 3 },
    { title: "Quality Control", description: "Product quality management", icon: Target, route: "/quality", priority: 4 },
  ];

  // Analytics & Reporting section
  const analyticsItems: FeatureCard[] = [
    { title: "Analytics", description: "Production performance metrics", icon: BarChart3, route: "/analytics", priority: 1 },
    { title: "Reports", description: "Comprehensive reporting tools", icon: FileText, route: "/reports", priority: 2 },
    { title: "Dashboards", description: "Custom dashboard management", icon: TrendingUp, route: "/dashboards", priority: 3 },
    { title: "Widget Studio", description: "Create custom widgets", icon: Lightbulb, route: "/widget-studio", priority: 4 },
  ];

  // System Administration section
  const systemItems: FeatureCard[] = [
    { title: "Data Management", description: "Import and manage master data", icon: Database, route: "/data-management", priority: 1 },
    { title: "Role Management", description: "User roles and permissions", icon: Shield, route: "/role-management", priority: 2 },
    { title: "System Settings", description: "Application configuration", icon: Settings, route: "/settings", priority: 3 },
    { title: "Data Schema", description: "Database structure visualization", icon: Database, route: "/data-schema", priority: 4 },
  ];

  // Communication & Collaboration section
  const communicationItems: FeatureCard[] = [
    { title: "Visual Factory", description: "Factory display boards", icon: Factory, route: "/visual-factory", priority: 1 },
    { title: "Chat", description: "Team communication", icon: MessageSquare, route: "/chat", priority: 2 },
    { title: "Boards", description: "Collaboration boards", icon: Target, route: "/boards", priority: 3 },
    { title: "Feedback", description: "Submit feedback and suggestions", icon: MessageSquare, route: "/feedback", priority: 4 },
  ];

  // Training & Support section
  const trainingItems: FeatureCard[] = [
    { title: "Getting Started", description: "Initial setup and configuration", icon: Target, route: "/onboarding", priority: 1 },
    { title: "Take a Guided Tour", description: "Interactive feature walkthrough", icon: Clock, route: "/training", priority: 2 },
    { title: "Training", description: "Comprehensive training modules", icon: Target, route: "/training", priority: 3 },
    { title: "Presentation System", description: "Demo and presentation tools", icon: FileText, route: "/presentation-system", priority: 4 },
  ];

  // Supply Chain section
  const supplyChainItems: FeatureCard[] = [
    { title: "Inventory", description: "Stock and inventory management", icon: Package, route: "/inventory", priority: 1 },
    { title: "Purchasing", description: "Purchase order management", icon: Truck, route: "/purchasing", priority: 2 },
    { title: "Suppliers", description: "Supplier relationship management", icon: Users, route: "/suppliers", priority: 3 },
    { title: "ATP/CTP", description: "Available to Promise calculations", icon: Target, route: "/atp-ctp", priority: 4 },
  ];

  // Sales & Customer Service section
  const salesItems: FeatureCard[] = [
    { title: "Sales", description: "Sales order management", icon: DollarSign, route: "/sales", priority: 1 },
    { title: "Customer Service", description: "Customer support interface", icon: UserCheck, route: "/customer-service", priority: 2 },
    { title: "CRM", description: "Customer relationship management", icon: Phone, route: "/crm", priority: 3 },
    { title: "Order Tracking", description: "Track customer orders", icon: Package, route: "/orders", priority: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to PlanetTogether
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your comprehensive AI-powered manufacturing ERP platform for production scheduling, 
            operations management, and intelligent optimization.
          </p>
        </div>

        {/* Recent & Favorites */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Recent & Favorites
          </h2>
          <DashboardCardContainer
            cards={createDashboardCards(recentItems, "bg-blue-100 text-blue-600")}
            maxVisibleCardsMobile={2}
            maxVisibleCardsTablet={3}
            maxVisibleCardsDesktop={4}
            showMoreText="Show More Recent Items"
            showLessText="Show Less"
            gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          />
        </div>

        {/* Feature Groups */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Planning & Scheduling */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Planning & Scheduling
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(planningItems, "bg-green-100 text-green-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Planning Tools"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* Operations */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Operations
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(operationsItems, "bg-orange-100 text-orange-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Operations"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* Analytics & Reporting */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Analytics & Reporting
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(analyticsItems, "bg-purple-100 text-purple-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Analytics"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* System Administration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                System Administration
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(systemItems, "bg-red-100 text-red-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Admin Tools"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Communication & Collaboration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Communication & Collaboration
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(communicationItems, "bg-teal-100 text-teal-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Communication Tools"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* Training & Support */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Training & Support
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(trainingItems, "bg-indigo-100 text-indigo-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Training"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* Supply Chain */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Supply Chain
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(supplyChainItems, "bg-yellow-100 text-yellow-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Supply Chain"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>

            {/* Sales & Customer Service */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Sales & Customer Service
              </h2>
              <DashboardCardContainer
                cards={createDashboardCards(salesItems, "bg-pink-100 text-pink-600")}
                maxVisibleCardsMobile={2}
                maxVisibleCardsTablet={3}
                maxVisibleCardsDesktop={4}
                showMoreText="Show More Sales Tools"
                showLessText="Show Less"
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}