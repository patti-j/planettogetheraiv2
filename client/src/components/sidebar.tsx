import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Factory, Briefcase, BarChart3, FileText, Columns3, Menu, Smartphone, DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, Truck, ChevronDown, Target, Database, Building, Server, TrendingUp, Shield, GraduationCap, UserCheck, BookOpen, HelpCircle, AlertTriangle, Package, Brain, User, Users, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3, FileSearch, Puzzle, Layout, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "./role-switcher";
import { TrainingModeExit } from "./training-mode-exit";
import { UserProfileDialog } from "./user-profile";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useNavigation } from "@/contexts/NavigationContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import TopUserProfile from "./top-user-profile";

export default function Sidebar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
  // Authentication hooks
  const { hasPermission } = usePermissions();
  const { logout } = useAuth();
  const { isMaxOpen, setMaxOpen } = useMaxDock();
  const { getThemeClasses } = useAITheme();
  const { addRecentPage } = useNavigation();
  
  console.log("Sidebar component loading, location:", location);
  console.log("🚨 WIDGETS DEBUG: Sidebar component is rendering");



  // Check for scroll indicator on mount and resize
  useEffect(() => {
    const checkScrollIndicator = () => {
      if (navRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = navRef.current;
        // Show indicator only if there's content to scroll AND user hasn't scrolled to the bottom
        const hasScrollableContent = scrollHeight > clientHeight;
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - 5; // 5px tolerance
        setShowScrollIndicator(hasScrollableContent && !isAtBottom);
      }
    };

    checkScrollIndicator();
    window.addEventListener('resize', checkScrollIndicator);
    
    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', checkScrollIndicator);
    }

    return () => {
      window.removeEventListener('resize', checkScrollIndicator);
      if (navElement) {
        navElement.removeEventListener('scroll', checkScrollIndicator);
      }
    };
  }, []);

  // Function to open onboarding wizard
  const openOnboardingWizard = () => {
    window.dispatchEvent(new CustomEvent('openOnboarding'));
    setMobileMenuOpen(false);
  };

  // Function to toggle Max AI Assistant
  const toggleMaxAI = () => {
    setMaxOpen(!isMaxOpen);
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    
    // Add Max AI to recent items when opened
    if (!isMaxOpen) {
      addRecentPage("#max", "Max AI Assistant", "Sparkles");
    }
  };

  // CRITICAL DEBUG: Check if this code is even running - REFRESHED
  console.log("🚨 SIDEBAR RENDER: Starting navigationItems creation - WIDGETS CHECK");

  const navigationItems: Array<{
    icon: any;
    label: string;
    href: string;
    active: boolean;
    feature: string;
    action: string;
    onClick?: () => void;
    isAI?: boolean;
    isExternal?: boolean;
  }> = [
    { icon: Home, label: "Home", href: "/", active: location === "/", feature: "", action: "" },
    { icon: BookOpen, label: "Getting Started", href: "/help", active: location === "/help", feature: "getting-started", action: "view" },
    { icon: TrendingUp, label: "Business Goals", href: "/business-goals", active: location === "/business-goals", feature: "business-goals", action: "view" },
    { icon: Briefcase, label: "Implementation Projects", href: "/implementation-projects", active: location === "/implementation-projects", feature: "implementation-projects", action: "view" },
    { icon: Target, label: "Optimize Orders", href: "/optimize-orders", active: location === "/optimize-orders", feature: "scheduling-optimizer", action: "view" },
    { icon: Target, label: "Production Planning", href: "/production-planning", active: location === "/production-planning", feature: "production-planning", action: "view" },
    { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", active: location === "/capacity-planning", feature: "capacity-planning", action: "view" },
    { icon: Users, label: "Labor Planning", href: "/labor-planning", active: location === "/labor-planning", feature: "labor-planning", action: "view" },
    { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", active: location === "/optimization-studio", feature: "optimization-studio", action: "view" },
    
    // AI and Analytics
    ...(isMaxOpen ? [] : [{ icon: Sparkles, label: "Max AI Assistant", href: "#max", active: false, feature: "", action: "", onClick: toggleMaxAI, isAI: true }]),
    { icon: Brain, label: "Demand Forecasting", href: "/demand-forecasting", active: location === "/demand-forecasting", feature: "demand-forecasting", action: "view" },
    { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", active: location === "/inventory-optimization", feature: "inventory-optimization", action: "view" },
    { icon: BarChart3, label: "Analytics", href: "/analytics", active: location === "/analytics", feature: "analytics", action: "view" },
    { icon: TrendingUp, label: "Continuous Improvement", href: "/continuous-improvement", active: location === "/continuous-improvement", feature: "continuous-improvement", action: "view" },
    { icon: FileText, label: "Reports", href: "/reports", active: location === "/reports", feature: "reports", action: "view" },
    { icon: Layout, label: "Dashboards", href: "/dashboards", active: location === "/dashboards", feature: "systems-management", action: "view" },
    { icon: Puzzle, label: "Widgets", href: "/widgets", active: location === "/widgets", feature: "systems-management", action: "view" },
    { icon: Grid3X3, label: "Widget Showcase", href: "/widget-showcase", active: location === "/widget-showcase", feature: "systems-management", action: "view" },
    
    // Data Management
    { icon: Database, label: "Master Data Setup", href: "/data-import", active: location === "/data-import", feature: "data-import", action: "view" },
    { icon: Database, label: "Data Schema View", href: "/data-schema", active: location === "/data-schema", feature: "systems-management", action: "view" },
    { icon: FileText, label: "Table Field Documentation", href: "/table-field-viewer", active: location === "/table-field-viewer", feature: "systems-management", action: "view" },
    { icon: Database, label: "System Integration", href: "/systems-integration", active: location === "/systems-integration", feature: "systems-integration", action: "view" },
    
    // Shop Floor Operations
    { icon: Smartphone, label: "Shop Floor", href: "/shop-floor", active: location === "/shop-floor", feature: "shop-floor", action: "view" },
    { icon: Settings, label: "Operator", href: "/operator-dashboard", active: location === "/operator-dashboard", feature: "operator-dashboard", action: "view" },
    { icon: Truck, label: "Forklift Driver", href: "/forklift-driver", active: location === "/forklift-driver", feature: "forklift-driver", action: "view" },
    { icon: Wrench, label: "Maintenance", href: "/maintenance", active: location === "/maintenance", feature: "maintenance", action: "view" },
    { icon: AlertTriangle, label: "Disruption Management", href: "/disruption-management", active: location === "/disruption-management", feature: "disruption-management", action: "view" },
    
    // Management & Administration
    { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", active: location === "/systems-management-dashboard", feature: "systems-management", action: "view" },
    { icon: Building, label: "Plants Management", href: "/plants-management", active: location === "/plants-management", feature: "systems-management", action: "view" },
    { icon: Code, label: "Extension Studio", href: "/extension-studio", active: location === "/extension-studio", feature: "systems-management", action: "view" },
    { icon: FileSearch, label: "Logs", href: "/error-logs", active: location === "/error-logs", feature: "systems-management", action: "view" },
    { icon: AlertTriangle, label: "Constraints Management", href: "/constraints", active: location === "/constraints", feature: "constraints-management", action: "view" },
    { icon: Layers, label: "Canvas", href: "/canvas", active: location === "/canvas", feature: "", action: "" },
    { icon: Shield, label: "User & Access Management", href: "/user-access-management", active: location === "/user-access-management" || location === "/role-management" || location === "/user-role-assignments-page", feature: "user-management", action: "view" },
    { icon: GraduationCap, label: "Training", href: "/training", active: location === "/training", feature: "training", action: "view" },
    { icon: Building, label: "Industry Templates", href: "/industry-templates", active: location === "/industry-templates", feature: "industry-templates", action: "view" },
    { icon: Presentation, label: "Presentation System", href: "/presentation-system", active: location === "/presentation-system" || location === "/presentation-studio", feature: "training", action: "view" },
    { icon: MessageCircle, label: "Chat", href: "/chat", active: location === "/chat", feature: "chat", action: "view" },
    { icon: Columns3, label: "Boards", href: "/boards", active: location === "/boards", feature: "boards", action: "view" },
    { icon: Factory, label: "Visual Factory", href: "/visual-factory", active: location === "/visual-factory", feature: "visual-factory", action: "view" },

    { icon: DollarSign, label: "Sales", href: "/sales", active: location === "/sales", feature: "sales", action: "view" },
    { icon: DollarSign, label: "FP&A Dashboard", href: "/fpa-dashboard", active: location === "/fpa-dashboard", feature: "fpa", action: "view" },
    { icon: Headphones, label: "Customer Service", href: "/customer-service", active: location === "/customer-service", feature: "customer-service", action: "view" },
    { icon: MessageSquare, label: "Feedback", href: "/feedback", active: location === "/feedback", feature: "feedback", action: "view" },

  ].filter(item => {
    // Always show Home, Getting Started, Canvas, Max AI Assistant (when closed), and temporarily Constraints Management
    const isAlwaysVisible = item.href === "#" || 
      item.href === "/" ||  // Always show Home page
      item.href === "/canvas" ||
      item.href === "#max" ||
      item.href === "/constraints" || // TEMPORARY: Always show constraints for debugging
      item.href === "/analytics" ||  // Show analytics for admin
      item.href === "/continuous-improvement" ||  // Show Continuous Improvement for all users
      item.href === "/reports" ||  // Show reports for admin
      item.href === "/schedule" || // Show schedule for admin
      item.href === "/user-access-management"; // TEMPORARY: Always show User & Access Management
    
    // Check permission for other items
    const hasPermissionForItem = hasPermission(item.feature || "", item.action || "");
    
    // Enhanced debug logging for specific menu items
    if (item.label === "Widgets" || item.label === "User & Access Management" || item.label === "Continuous Improvement") {
      console.log(`🔍 ${item.label.toUpperCase()} MENU DEBUG:`, {
        label: item.label,
        href: item.href,
        feature: item.feature,
        action: item.action,
        hasPermissionForItem,
        isAlwaysVisible,
        shouldShow: isAlwaysVisible || hasPermissionForItem,
        permissionCheck: `hasPermission("${item.feature}", "${item.action}")`,
        userInfo: 'Check usePermissions hook output'
      });
      console.log(`🚨 ${item.label}: hasPermission result:`, hasPermissionForItem);
      console.log(`🚨 ${item.label}: isAlwaysVisible result:`, isAlwaysVisible);
      console.log(`🚨 ${item.label}: Final filter result:`, isAlwaysVisible || hasPermissionForItem);
    }
    
    // Debug logging for Constraints Management menu item
    if (item.label === "Constraints Management") {
      console.log(`🔍 CONSTRAINTS MENU DEBUG (ENHANCED):`, {
        label: item.label,
        href: item.href,
        feature: item.feature,
        action: item.action,
        hasPermissionForItem,
        isAlwaysVisible,
        shouldShow: isAlwaysVisible || hasPermissionForItem,
        permissionCheck: `hasPermission("${item.feature}", "${item.action}")`,
        userInfo: 'Check usePermissions hook output',
        FORCING_VISIBLE: true
      });
      console.log(`🚨 CONSTRAINTS: hasPermission result:`, hasPermissionForItem);
      console.log(`🚨 CONSTRAINTS: isAlwaysVisible result:`, isAlwaysVisible);
      console.log(`🚨 CONSTRAINTS: Final filter result:`, isAlwaysVisible || hasPermissionForItem);
      console.log(`🚨 CONSTRAINTS: SHOULD BE VISIBLE NOW!`);
    }
    
    // Debug logging for other specific menu items
    if (item.label === "Logs" || item.label === "Systems Management" || item.label === "Extension Studio") {
      console.log(`Menu filter check for ${item.label}:`, {
        label: item.label,
        href: item.href,
        feature: item.feature,
        action: item.action,
        hasPermissionForItem,
        isAlwaysVisible,
        shouldShow: isAlwaysVisible || hasPermissionForItem
      });
    }
    
    return isAlwaysVisible || hasPermissionForItem;
  });

  // Enhanced debugging - log all menu items and specifically check for Widgets
  console.log(`🔍 SIDEBAR DEBUG: Total navigationItems before filter: ${navigationItems.length + (navigationItems.length === 0 ? 1 : 0)}`);
  console.log(`🔍 SIDEBAR DEBUG: navigationItems after filter: ${navigationItems.length}`);
  
  // Check if Widgets exists in the original array
  const originalItems = [
    { icon: BookOpen, label: "Getting Started", href: "/help", active: location === "/help", feature: "getting-started", action: "view" },
    { icon: TrendingUp, label: "Business Goals", href: "/business-goals", active: location === "/business-goals", feature: "business-goals", action: "view" },
    { icon: Target, label: "Optimize Orders", href: "/optimize-orders", active: location === "/optimize-orders", feature: "scheduling-optimizer", action: "view" },
    { icon: Target, label: "Production Planning", href: "/production-planning", active: location === "/production-planning", feature: "production-planning", action: "view" },
    { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", active: location === "/capacity-planning", feature: "capacity-planning", action: "view" },
    { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", active: location === "/optimization-studio", feature: "optimization-studio", action: "view" },
    
    // AI and Analytics
    ...(isMaxOpen ? [] : [{ icon: Sparkles, label: "Max AI Assistant", href: "#max", active: false, feature: "", action: "", onClick: toggleMaxAI, isAI: true }]),
    { icon: Brain, label: "Demand Forecasting", href: "/demand-forecasting", active: location === "/demand-forecasting", feature: "demand-forecasting", action: "view" },
    { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", active: location === "/inventory-optimization", feature: "inventory-optimization", action: "view" },
    { icon: BarChart3, label: "Analytics", href: "/analytics", active: location === "/analytics", feature: "analytics", action: "view" },
    { icon: TrendingUp, label: "Continuous Improvement", href: "/continuous-improvement", active: location === "/continuous-improvement", feature: "continuous-improvement", action: "view" },
    { icon: FileText, label: "Reports", href: "/reports", active: location === "/reports", feature: "reports", action: "view" },
    { icon: Layout, label: "Dashboards", href: "/dashboards", active: location === "/dashboards", feature: "systems-management", action: "view" },
    { icon: Puzzle, label: "Widgets", href: "/widgets", active: location === "/widgets", feature: "systems-management", action: "view" },
    { icon: Grid3X3, label: "Widget Showcase", href: "/widget-showcase", active: location === "/widget-showcase", feature: "systems-management", action: "view" },
    
    // Data Management
    { icon: Database, label: "Master Data Setup", href: "/data-import", active: location === "/data-import", feature: "data-import", action: "view" },
    { icon: Database, label: "Data Schema View", href: "/data-schema", active: location === "/data-schema", feature: "systems-management", action: "view" },
    { icon: FileText, label: "Table Field Documentation", href: "/table-field-viewer", active: location === "/table-field-viewer", feature: "systems-management", action: "view" },
    { icon: Database, label: "System Integration", href: "/systems-integration", active: location === "/systems-integration", feature: "systems-integration", action: "view" },
    
    // Shop Floor Operations
    { icon: Smartphone, label: "Shop Floor", href: "/shop-floor", active: location === "/shop-floor", feature: "shop-floor", action: "view" },
    { icon: Settings, label: "Operator", href: "/operator-dashboard", active: location === "/operator-dashboard", feature: "operator-dashboard", action: "view" },
    { icon: Truck, label: "Forklift Driver", href: "/forklift-driver", active: location === "/forklift-driver", feature: "forklift-driver", action: "view" },
    { icon: Wrench, label: "Maintenance", href: "/maintenance", active: location === "/maintenance", feature: "maintenance", action: "view" },
    { icon: AlertTriangle, label: "Disruption Management", href: "/disruption-management", active: location === "/disruption-management", feature: "disruption-management", action: "view" },
    
    // Management & Administration
    { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", active: location === "/systems-management-dashboard", feature: "systems-management", action: "view" },
    { icon: Building, label: "Plants Management", href: "/plants-management", active: location === "/plants-management", feature: "systems-management", action: "view" },
    { icon: Code, label: "Extension Studio", href: "/extension-studio", active: location === "/extension-studio", feature: "systems-management", action: "view" },
    { icon: FileSearch, label: "Logs", href: "/error-logs", active: location === "/error-logs", feature: "systems-management", action: "view" },
    { icon: Layers, label: "Canvas", href: "/canvas", active: location === "/canvas", feature: "", action: "" },
    { icon: Shield, label: "User & Access Management", href: "/user-access-management", active: location === "/user-access-management" || location === "/role-management" || location === "/user-role-assignments-page", feature: "user-management", action: "view" },
    { icon: GraduationCap, label: "Training", href: "/training", active: location === "/training", feature: "training", action: "view" },
    { icon: Building, label: "Industry Templates", href: "/industry-templates", active: location === "/industry-templates", feature: "industry-templates", action: "view" },
    { icon: Presentation, label: "Presentation System", href: "/presentation-system", active: location === "/presentation-system" || location === "/presentation-studio", feature: "training", action: "view" },
    { icon: MessageCircle, label: "Chat", href: "/chat", active: location === "/chat", feature: "chat", action: "view" },
    { icon: Columns3, label: "Boards", href: "/boards", active: location === "/boards", feature: "boards", action: "view" },
    { icon: Factory, label: "Visual Factory", href: "/visual-factory", active: location === "/visual-factory", feature: "visual-factory", action: "view" },
    { icon: DollarSign, label: "Sales", href: "/sales", active: location === "/sales", feature: "sales", action: "view" },
    { icon: DollarSign, label: "FP&A Dashboard", href: "/fpa-dashboard", active: location === "/fpa-dashboard", feature: "fpa", action: "view" },
    { icon: Headphones, label: "Customer Service", href: "/customer-service", active: location === "/customer-service", feature: "customer-service", action: "view" },
    { icon: MessageSquare, label: "Feedback", href: "/feedback", active: location === "/feedback", feature: "feedback", action: "view" },
  ];
  
  console.log(`🚨 TOTAL NAVIGATION ITEMS: ${navigationItems.length}`);
  console.log(`🚨 ALL NAVIGATION ITEMS:`, navigationItems.map(item => `${item.label} (${item.href})`));
  
  const widgetsInFiltered = navigationItems.find(item => item.label === "Widgets");
  console.log(`🚨 WIDGETS IN FINAL ARRAY:`, widgetsInFiltered);
  
  // Add explicit console log for Widgets rendering
  if (widgetsInFiltered) {
    console.log(`🚨 WIDGETS ITEM WILL BE RENDERED!`);
  } else {
    console.log(`🚨 WIDGETS ITEM NOT FOUND IN FINAL ARRAY!`);
  }

  const getNavigationTooltip = (href: string) => {
    const tooltips: Record<string, string> = {
      "#": "Track your implementation progress and complete setup tasks with guided help",
      "#max": "AI-powered assistant for intelligent production planning, optimization, and contextual guidance",
      "/business-goals": "Define strategic objectives, track progress, and monitor risks that impact business success",
      "/production-schedule": "View production schedule with interactive Gantt charts and scheduling tools",
      "/optimize-orders": "Optimize orders with intelligent scheduling and multi-operation planning",
      "/inventory-optimization": "Optimize inventory levels, reduce costs, and improve service levels with AI-powered recommendations",
      "/demand-forecasting": "AI-powered demand prediction and analysis for optimal planning and inventory management",
      "/capacity-planning": "Plan and optimize production capacity including staffing, shifts, and equipment",
      "/production-planning": "Create and manage production plans with targets, resource allocation, and milestone tracking",
      "/optimization-studio": "Define, customize, test, and deploy optimization algorithms across manufacturing functions with AI-powered algorithm creation",
      "/erp-import": "Import and manage data from external ERP systems including orders, inventory, resources, and schedules",
      "/visual-factory": "Automated large screen displays for manufacturing facilities with real-time information",
      "/shop-floor": "Mobile-optimized interface for production schedulers on the floor",
      "/operator-dashboard": "Review upcoming operations and report status or problems",
      "/forklift-driver": "Material movement tracking for forklift drivers",
      "/maintenance": "Plan and manage resource maintenance schedules and work orders",
      "/disruption-management": "Track and manage production disruptions including machine breakdowns, material shortages, and personnel issues",
      "/systems-management-dashboard": "Monitor system health, manage users, and oversee IT infrastructure",
      "/plants-management": "Manage manufacturing plant locations, configurations, and multi-plant operations",
      "/extension-studio": "Create and manage custom software extensions to extend platform capabilities",
      "/error-logs": "Monitor system logs, track errors, and manage issue resolution with comprehensive logging and reporting",
      "/canvas": "Dynamic content space for AI-generated visualizations, dashboards, and interactive reports",
      "/user-access-management": "Manage users, roles, and permissions in one consolidated interface",
      "/training": "Interactive training modules and role demonstrations for comprehensive system training",
      "/industry-templates": "Select pre-configured industry templates for automated application setup with AI-generated configurations",
      "/presentation-system": "Manage and create presentations with slides, templates, and libraries for sales, training, and consulting",
      "/chat": "Real-time messaging and communication with team members and contextual discussions",
      "/boards": "Organize jobs, operations, and resources with drag-and-drop boards",
      "/system-integrations": "Connect and manage integrations with external systems like SAP, NetSuite, and other enterprise software with AI-powered data flows",
      "/sales": "Manage sales leads, orders, and customer relationships",
      "/customer-service": "Handle customer orders, issues, and support requests",
      "/analytics": "View production metrics and performance analytics",
      "/reports": "Generate detailed production reports and insights",
      "/feedback": "Submit feedback and suggestions to help improve the system",
      "/widgets": "Create, manage, and deploy widgets across dashboard systems with design studio and library access",
      "/dashboards": "Create, manage, and configure manufacturing dashboards with custom layouts and widget configurations",
      "/constraints": "Manage production constraints, violations, and compliance requirements to optimize manufacturing efficiency"
    };
    return tooltips[href] || "Navigate to this page";
  };

  // User Avatar Section - displays avatar, name, action icons, and role controls
  const SidebarUserAvatarSection = ({ isMobileSheet = false }: { isMobileSheet?: boolean }) => {
    const [userProfileOpen, setUserProfileOpen] = useState(false);
    const { user, logout } = useAuth();

    // Get current role for role switcher
    const { data: currentRole } = useQuery({
      queryKey: [`/api/users/${user?.id}/current-role`],
      enabled: !!user?.id,
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/users/${user?.id}/current-role`);
        return await response.json();
      },
    });

    if (!user) return null;

    return (
      <TooltipProvider>
        <div className="space-y-3">
          {/* User Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="w-8 h-8 mr-3">
                <AvatarImage src={undefined} alt="User avatar" />
                <AvatarFallback className="text-xs">
                  {user.firstName 
                    ? user.firstName.charAt(0).toUpperCase()
                    : user.username
                    ? user.username.charAt(0).toUpperCase()
                    : <User className="w-4 h-4" />
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserProfileOpen(true)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                title="Profile & Settings"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("Sidebar logout button clicked");
                  logout();
                }}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 ring-2 ring-red-200"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Role Controls beneath user info - horizontally centered */}
          {user?.id && (
            <div className="space-y-3 flex flex-col items-center">
              <TrainingModeExit />
              <RoleSwitcher userId={user.id} currentRole={currentRole} />
            </div>
          )}
        </div>
        
        <UserProfileDialog 
          open={userProfileOpen} 
          onOpenChange={setUserProfileOpen}
        />
      </TooltipProvider>
    );
  };



  const SidebarContent = ({ onNavigate = () => {}, isMobileSheet = false }: { onNavigate?: () => void; isMobileSheet?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <h1 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center mb-3">
          <Factory className="text-primary mr-2" size={20} />
          PlanetTogether
        </h1>
        {/* User Avatar and Name */}
        <SidebarUserAvatarSection isMobileSheet={isMobileSheet} />
      </div>

      <div className="flex-1 relative min-h-0">
        <nav ref={navRef} className="h-full p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                {item.onClick ? (
                  <button
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap ${
                      item.isAI
                        ? item.active
                          ? `text-white ${getThemeClasses(false)} border-l-4 border-purple-600`
                          : `text-gray-600 hover:text-white ${getThemeClasses(true)}`
                        : item.active
                          ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                          : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={item.onClick}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.isAI && (
                      <div className="ml-auto">
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                          AI
                        </div>
                      </div>
                    )}
                  </button>
                ) : item.isExternal ? (
                  <a
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap ${
                      item.active
                        ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <Link href={item.href}>
                    <a
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap ${
                        item.isAI
                          ? item.active
                            ? `text-white ${getThemeClasses(false)} border-l-4 border-purple-600`
                            : `text-gray-600 hover:text-white ${getThemeClasses(true)}`
                          : item.active
                            ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                            : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={onNavigate}
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.isAI && (
                        <div className="ml-auto">
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                            AI
                          </div>
                        </div>
                      )}
                    </a>
                  </Link>
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{getNavigationTooltip(item.href)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-1">
            <div className="animate-bounce">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>


    </div>
  );

  // Sidebar hamburger menu removed - using modern dropdown from top-menu.tsx instead
  return null;
}
