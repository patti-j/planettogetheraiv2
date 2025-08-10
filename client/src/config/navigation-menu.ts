import { 
  Factory, Briefcase, BarChart3, FileText, Bot, Columns3, Smartphone, 
  DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, 
  Truck, ChevronDown, ChevronRight, Target, Database, Building, Server, TrendingUp, 
  Shield, GraduationCap, UserCheck, BookOpen, AlertTriangle, 
  Package, Brain, User, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3, 
  Eye, FileX, Clock, Monitor, History, X, Upload, Pin, PinOff, PlayCircle, Search, 
  Network, ArrowRightLeft, Puzzle, Layout, Home, AlertCircle, FileSearch, Globe
} from "lucide-react";

// Unified navigation menu structure for both desktop and mobile
export const navigationGroups = [
  {
    title: "Planning & Scheduling",
    priority: "high",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      { icon: Home, label: "Home", href: "/", feature: "", action: "" },
      { icon: BarChart3, label: "Production Schedule", href: "/production-schedule", feature: "production-scheduling", action: "view", color: "bg-blue-500" },
      { icon: Layout, label: "Scheduler Dashboard", href: "/production-scheduler-dashboard", feature: "scheduling", action: "view", color: "bg-indigo-500" },
      { icon: Sparkles, label: "Order Optimization", href: "/optimize-orders", feature: "scheduling-optimizer", action: "view", color: "bg-amber-500" },
      { icon: Monitor, label: "Cockpit", href: "/cockpit", feature: "production-cockpit", action: "view", color: "bg-slate-600" },
      { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", feature: "capacity-planning", action: "view", color: "bg-purple-500" },
      { icon: Target, label: "Production Planning", href: "/production-planning", feature: "production-planning", action: "view", color: "bg-green-500" },
      { icon: Package, label: "ATP/CTP", href: "/atp-ctp", feature: "production-scheduling", action: "view", color: "bg-teal-500" },
      { icon: Clock, label: "Shift Management", href: "/shift-management", feature: "shift-management", action: "view", color: "bg-cyan-500" },
      { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", feature: "inventory-optimization", action: "view", color: "bg-emerald-500" },
      { icon: Brain, label: "Demand Planning", href: "/demand-planning", feature: "demand-planning", action: "view", color: "bg-indigo-500" },
      { icon: AlertCircle, label: "Constraints Management", href: "/constraints", feature: "production-scheduling", action: "view", color: "bg-orange-600" },
      { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", feature: "optimization-studio", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" }
    ]
  },
  {
    title: "AI & Analytics", 
    priority: "high",
    color: "purple",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    features: [
      { icon: Bot, label: "Max AI Assistant", href: "#max", feature: "", action: "", color: "bg-gradient-to-r from-purple-500 to-pink-600", isAI: true, requiresOnboarding: false },
      { icon: Bot, label: "Autonomous Optimization", href: "/autonomous-optimization", feature: "optimization", action: "view", color: "bg-gradient-to-r from-blue-500 to-purple-600" },
      { icon: Brain, label: "Demand Forecasting", href: "/demand-forecasting", feature: "demand-forecasting", action: "view", color: "bg-purple-500" },
      { icon: BarChart3, label: "Analytics", href: "/analytics", feature: "analytics", action: "view", color: "bg-teal-500" },
      { icon: FileText, label: "Reports", href: "/reports", feature: "reports", action: "view", color: "bg-blue-600" },
      { icon: Layout, label: "Dashboards", href: "/dashboards", feature: "systems-management", action: "view", color: "bg-green-500" },
      { icon: Smartphone, label: "Mobile Widget Library", href: "/widget-showcase", feature: "systems-management", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { icon: Puzzle, label: "Widget Studio", href: "/widgets", feature: "systems-management", action: "view", color: "bg-blue-500" },
      { icon: Layers, label: "Canvas", href: "/canvas", feature: "", action: "", color: "bg-purple-600" }
    ]
  },
  {
    title: "Data Management",
    priority: "medium",
    color: "green",
    bgColor: "bg-green-50 dark:bg-green-950/20", 
    borderColor: "border-green-200 dark:border-green-800",
    features: [
      { icon: Upload, label: "Master Data Setup", href: "/data-import", feature: "data-import", action: "view", color: "bg-green-600" },
      { icon: FileText, label: "Master Data Editor", href: "/master-data", feature: "systems-management", action: "view", color: "bg-emerald-600" },
      { icon: Database, label: "Data Schema View", href: "/data-schema", feature: "systems-management", action: "view", color: "bg-indigo-600" },
      { icon: FileText, label: "Table Field Documentation", href: "/table-field-viewer", feature: "systems-management", action: "view", color: "bg-slate-600" },
      { icon: Database, label: "System Integration", href: "/systems-integration", feature: "systems-integration", action: "view", color: "bg-stone-500" },
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
      { icon: Settings, label: "Operator Dashboard", href: "/operator-dashboard", feature: "operator-dashboard", action: "view", color: "bg-gray-500" },
      { icon: Truck, label: "Forklift Driver", href: "/forklift-driver", feature: "forklift-driver", action: "view", color: "bg-yellow-500" },
      { icon: Wrench, label: "Maintenance", href: "/maintenance", feature: "maintenance", action: "view", color: "bg-red-500" },
      { icon: AlertTriangle, label: "Disruption Management", href: "/disruption-management", feature: "disruption-management", action: "view", color: "bg-red-600" }
    ]
  },
  {
    title: "Business Management", 
    priority: "medium",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      { icon: Globe, label: "Enterprise Map", href: "/enterprise-map", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Building, label: "Plants Management", href: "/plants-management", feature: "systems-management", action: "view", color: "bg-slate-500" },
      { icon: TrendingUp, label: "Business Intelligence", href: "/business-intelligence", feature: "business-intelligence", action: "view", color: "bg-indigo-600" },
      { icon: DollarSign, label: "Financial Management", href: "/financial-management", feature: "financial-management", action: "view", color: "bg-green-600" },
      { icon: TrendingUp, label: "Business Goals", href: "/business-goals", feature: "business-goals", action: "view", color: "bg-cyan-500" },
      { icon: DollarSign, label: "Sales", href: "/sales", feature: "sales", action: "view", color: "bg-green-500" },
      { icon: Headphones, label: "Customer Service", href: "/customer-service", feature: "customer-service", action: "view", color: "bg-blue-500" },
      { icon: Building, label: "Plant Manager", href: "/plant-manager-dashboard", feature: "plant-manager", action: "view", color: "bg-indigo-500" }
    ]
  },
  {
    title: "Management & Administration",
    priority: "low",
    color: "gray",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-600",
    features: [
      { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", feature: "systems-management", action: "view", color: "bg-gray-600" },
      { icon: Shield, label: "User & Access Management", href: "/user-access-management", feature: "user-management", action: "view", color: "bg-amber-600" },
      { icon: Code, label: "Extension Studio", href: "/extension-studio", feature: "systems-management", action: "view", color: "bg-violet-500" },
      { icon: FileSearch, label: "Logs", href: "/error-logs", feature: "systems-management", action: "view", color: "bg-red-500" },
      { icon: AlertTriangle, label: "Constraints Management", href: "/constraints", feature: "constraints-management", action: "view", color: "bg-orange-600" },
      { icon: Settings, label: "Tenant Administration", href: "/tenant-admin", feature: "tenant-admin", action: "view", color: "bg-purple-600" }
    ]
  },
  {
    title: "Training & Support",
    priority: "low", 
    color: "indigo",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    features: [
      { icon: BookOpen, label: "Getting Started", href: "/help", feature: "getting-started", action: "view", color: "bg-emerald-500" },
      { icon: GraduationCap, label: "Training", href: "/training", feature: "training", action: "view", color: "bg-cyan-500", requiresOnboarding: false },
      { icon: Building, label: "Industry Templates", href: "/industry-templates", feature: "industry-templates", action: "view", color: "bg-cyan-600" },
      { icon: Presentation, label: "Presentation System", href: "/presentation-system", feature: "training", action: "view", color: "bg-blue-700" },
      { icon: PlayCircle, label: "Take a Guided Tour", href: "#tour", feature: "", action: "", color: "bg-blue-500", requiresOnboarding: false, isSpecial: true }
    ]
  },
  {
    title: "Communication & Collaboration",
    priority: "low",
    color: "teal",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-800",
    features: [
      { icon: MessageCircle, label: "Chat", href: "/chat", feature: "chat", action: "view", color: "bg-green-600" },
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