import { 
  Factory, Briefcase, BarChart3, FileText, Bot, Columns3, Smartphone, 
  DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, 
  Truck, ChevronDown, ChevronRight, Target, Database, Building, Server, TrendingUp, 
  Shield, GraduationCap, UserCheck, BookOpen, AlertTriangle, 
  Package, User, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3, 
  Eye, FileX, Clock, Monitor, History, X, Upload, Pin, PinOff, PlayCircle, Search, 
  Network, ArrowRightLeft, Puzzle, Layout, Home, AlertCircle, FileSearch, Globe, Calendar, GitBranch,
  Workflow, Users, ArrowUpDown, FolderKanban
} from "lucide-react";

// Unified navigation menu structure for both desktop and mobile
export interface NavigationGroup {
  title: string;
  priority: "high" | "medium" | "low";
  color?: string;
  bgColor?: string;
  borderColor?: string;
  features: any[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    title: "Business Management", 
    priority: "high",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      { icon: Globe, label: "Global Control Tower", href: "/control-tower", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Building, label: "Plants Management", href: "/plants-management", feature: "plant-manager", action: "view", color: "bg-slate-500" },
      { icon: DollarSign, label: "Financial Management", href: "/financial-management", feature: "analytics", action: "view", color: "bg-green-600" },
      { icon: TrendingUp, label: "Business Goals", href: "/business-goals", feature: "business-goals", action: "view", color: "bg-cyan-500" },
      { icon: Target, label: "SMART KPI Tracking", href: "/smart-kpi-tracking", feature: "business-goals", action: "view", color: "bg-gradient-to-r from-green-500 to-blue-600" },
      { icon: DollarSign, label: "Sales", href: "/sales", feature: "analytics", action: "view", color: "bg-green-500" },
      { icon: Headphones, label: "Customer Service", href: "/customer-service", feature: "feedback", action: "view", color: "bg-blue-500" },

    ]
  },
  {
    title: "Planning & Scheduling",
    priority: "high",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      // 1. Start with overview and process guidance
      { icon: Workflow, label: "Planning Process Guide", href: "/planning-overview", feature: "schedule", action: "view", color: "bg-gradient-to-r from-blue-500 to-purple-600" },
      
      // 2. Demand analysis and forecasting
      { icon: Sparkles, label: "Demand Planning", href: "/demand-planning", feature: "analytics", action: "view", color: "bg-indigo-500" },
      { icon: Target, label: "Demand/Supply Alignment", href: "/demand-supply-alignment", feature: "analytics", action: "view", color: "bg-blue-700" },
      
      // 3. Capacity and resource planning
      { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", feature: "capacity-planning", action: "view", color: "bg-purple-500" },
      { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", feature: "analytics", action: "view", color: "bg-emerald-500" },
      
      // 4. Material and production requirements
      { icon: FileSearch, label: "Material Requirements Planning", href: "/mrp", feature: "schedule", action: "view", color: "bg-violet-600" },
      { icon: Sparkles, label: "Demand-Driven MRP (DDMRP)", href: "/ddmrp", feature: "schedule", action: "view", color: "bg-gradient-to-r from-blue-500 to-green-600" },
      { icon: BarChart3, label: "Master Production Schedule", href: "/master-production-schedule", feature: "schedule", action: "view", color: "bg-blue-600" },
      { icon: Target, label: "Production Planning", href: "/production-planning", feature: "schedule", action: "view", color: "bg-green-500" },
      
      // 5. Scheduling and execution
      { icon: Package, label: "ATP/CTP", href: "/atp-ctp", feature: "schedule", action: "view", color: "bg-teal-500" },
      { icon: Calendar, label: "Production Schedule", href: "/production-schedule", feature: "schedule", action: "view", color: "bg-indigo-600" },
      { icon: ArrowUpDown, label: "Schedule Sequences", href: "/schedule-sequences", feature: "schedule", action: "view", color: "bg-purple-500" },
      { icon: Clock, label: "Shift Management", href: "/shift-management", feature: "schedule", action: "view", color: "bg-cyan-500" },
      
      // 6. Constraints and optimization
      { icon: AlertCircle, label: "Constraints Management", href: "/constraints", feature: "schedule", action: "view", color: "bg-orange-600" },
      { icon: Sparkles, label: "Order Optimization", href: "/order-optimization", feature: "scheduling-optimizer", action: "view", color: "bg-amber-500" }
    ]
  },
  {
    title: "AI & Analytics", 
    priority: "high",
    color: "purple",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    features: [
      { icon: Sparkles, label: "Max AI Assistant", href: "#max", feature: "ai-assistant", action: "view", color: "bg-gradient-to-r from-purple-500 to-pink-600", isAI: true, requiresOnboarding: false },
      { icon: GraduationCap, label: "Onboarding Assistant", href: "/onboarding-assistant", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-purple-600 to-pink-500" },
      { icon: Sparkles, label: "Autonomous Optimization", href: "/autonomous-optimization", feature: "analytics", action: "view", color: "bg-gradient-to-r from-blue-500 to-purple-600" },
      { icon: Sparkles, label: "Demand Forecasting", href: "/demand-forecasting", feature: "analytics", action: "view", color: "bg-purple-500" },
      { icon: BarChart3, label: "Analytics", href: "/analytics", feature: "analytics", action: "view", color: "bg-teal-500" },
      { icon: TrendingUp, label: "AI Insights", href: "/ai-insights", feature: "analytics", action: "view", color: "bg-gradient-to-r from-purple-500 to-pink-600" },
      { icon: FileText, label: "Reports", href: "/reports", feature: "reports", action: "view", color: "bg-blue-600" },
      { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", feature: "analytics", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { icon: Sparkles, label: "UI Design Studio", href: "/design-studio", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-purple-500 to-pink-600" },
      { icon: GitBranch, label: "AI Scenario Creator", href: "/ai-scenario-creator", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-blue-500 to-purple-600" },
      { icon: BookOpen, label: "Playbooks", href: "/playbooks", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-green-500 to-blue-600" },
      { icon: History, label: "Agent History", href: "/agent-history", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-gray-500 to-blue-600" }
    ]
  },
  {
    title: "Data Management",
    priority: "medium",
    color: "green",
    bgColor: "bg-green-50 dark:bg-green-950/20", 
    borderColor: "border-green-200 dark:border-green-800",
    features: [
      { icon: Upload, label: "Master Data Setup", href: "/data-import", feature: "systems-management", action: "view", color: "bg-green-600" },
      { icon: FileText, label: "Master Data Editor", href: "/master-data", feature: "systems-management", action: "view", color: "bg-emerald-600" },
      { icon: Search, label: "Database Explorer", href: "/database-explorer", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Database, label: "Data Schema View", href: "/data-schema", feature: "systems-management", action: "view", color: "bg-indigo-600" },
      { icon: FileText, label: "Table Field Documentation", href: "/table-field-viewer", feature: "systems-management", action: "view", color: "bg-slate-600" },
      { icon: Database, label: "System Integration", href: "/systems-integration", feature: "systems-management", action: "view", color: "bg-stone-500" },
      { icon: ArrowRightLeft, label: "Data Relationships", href: "/data-relationships", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Network, label: "Data Map View", href: "/data-map", feature: "systems-management", action: "view", color: "bg-purple-600" },
      { icon: Shield, label: "Data Validation", href: "/data-validation", feature: "systems-management", action: "view", color: "bg-blue-600" }
    ]
  },
  {
    title: "Shop Floor Operations",
    priority: "medium", 
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    features: [
      { icon: Smartphone, label: "Shop Floor", href: "/shop-floor", feature: "shop-floor", action: "view", color: "bg-orange-500" },
      { icon: Users, label: "Labor Management", href: "/labor-planning", feature: "schedule", action: "view", color: "bg-indigo-500" },
      { icon: Clock, label: "Time Tracking", href: "/time-tracking", feature: "schedule", action: "view", color: "bg-purple-600" },
      { icon: Settings, label: "Operator Dashboard", href: "/operator-dashboard", feature: "operator-dashboard", action: "view", color: "bg-gray-500" },
      { icon: Truck, label: "Forklift Driver", href: "/forklift-driver", feature: "shop-floor", action: "view", color: "bg-yellow-500" },
      { icon: Wrench, label: "Maintenance", href: "/maintenance", feature: "maintenance-planning", action: "view", color: "bg-red-500" },
      { icon: AlertTriangle, label: "Disruption Management", href: "/disruption-management", feature: "schedule", action: "view", color: "bg-red-600" },
      { icon: AlertCircle, label: "Alerts & Notifications", href: "/alerts", feature: "analytics", action: "view", color: "bg-red-500" }
    ]
  },
  {
    title: "Management & Administration",
    priority: "low",
    color: "gray",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-600",
    features: [
      { icon: FolderKanban, label: "Implementation Projects", href: "/implementation-projects", feature: "implementation-projects", action: "view", color: "bg-blue-600" },
      { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", feature: "systems-management", action: "view", color: "bg-gray-600" },
      { icon: Shield, label: "User & Access Management", href: "/user-access-management", feature: "role-management", action: "view", color: "bg-amber-600" },
      { icon: Code, label: "Extension Studio", href: "/extension-studio", feature: "systems-management", action: "view", color: "bg-violet-500" },
      { icon: FileSearch, label: "Logs", href: "/error-logs", feature: "systems-management", action: "view", color: "bg-red-500" },
      { icon: AlertTriangle, label: "Constraints Management", href: "/constraints", feature: "systems-management", action: "view", color: "bg-orange-600" },
      { icon: Settings, label: "Tenant Administration", href: "/tenant-admin", feature: "systems-management", action: "view", color: "bg-purple-600" }
    ]
  },
  {
    title: "Training & Support",
    priority: "low", 
    color: "indigo",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    features: [
      { icon: BookOpen, label: "Getting Started", href: "/onboarding", feature: "systems-management", action: "view", color: "bg-emerald-500" },
      { icon: GraduationCap, label: "Training", href: "/training", feature: "training", action: "view", color: "bg-cyan-500", requiresOnboarding: false },
      { icon: Building, label: "Industry Templates", href: "/industry-templates", feature: "systems-management", action: "view", color: "bg-cyan-600" },
      { icon: Presentation, label: "Presentation System", href: "/presentation-system", feature: "training", action: "view", color: "bg-blue-700" },
      { icon: PlayCircle, label: "Take a Guided Tour", href: "/guided-tour", feature: "training", action: "view", color: "bg-blue-500", requiresOnboarding: false, isSpecial: true }
    ]
  },
  {
    title: "Communication & Collaboration",
    priority: "low",
    color: "teal",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-800",
    features: [
      { icon: MessageCircle, label: "Chat", href: "/chat", feature: "feedback", action: "view", color: "bg-green-600" },
      { icon: Columns3, label: "Boards", href: "/boards", feature: "boards", action: "view", color: "bg-blue-700" },
      { icon: Factory, label: "Visual Factory", href: "/visual-factory", feature: "visual-factory", action: "view", color: "bg-indigo-500" },
      { icon: MessageSquare, label: "Feedback", href: "/feedback", feature: "feedback", action: "view", color: "bg-orange-600" }
    ]
  }
];

// Flatten all features for easy access
export const getAllNavigationItems = () => {
  const items: any[] = [];
  navigationGroups.forEach(group => {
    group.features.forEach(feature => {
      items.push({
        ...feature,
        category: group.title
      });
    });
  });
  return items;
};

// Get navigation item by href
export const getNavigationItemByHref = (href: string) => {
  return getAllNavigationItems().find(item => item.href === href);
};