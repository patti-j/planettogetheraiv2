import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Factory, Briefcase, BarChart3, FileText, Bot, Columns3, Menu, Smartphone, 
  DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, 
  Truck, ChevronDown, ChevronRight, Target, Database, Building, Server, TrendingUp, 
  Shield, GraduationCap, UserCheck, BookOpen, HelpCircle, AlertTriangle, 
  Package, Brain, User, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3, 
  Eye, FileX, Clock, Monitor, History, X, Upload, Pin, PinOff, PlayCircle, Search, Network, ArrowRightLeft, Puzzle, Layout, Home, AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "./role-switcher";
import { AssignedRoleSwitcher } from "./assigned-role-switcher";
import { UserProfileDialog } from "./user-profile";
import { ThemeToggle, ThemeToggleSimple } from "./theme-toggle";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useNavigation } from "@/contexts/NavigationContext";
import { useTour } from "@/contexts/TourContext";
import { TourSelectionDialog } from "./tour-selection-dialog";
import { Input } from "@/components/ui/input";
import { DashboardCardContainer } from "./dashboard-card-container";
import { useTheme } from "@/contexts/ThemeContext";
import { useViewMode } from "@/hooks/use-view-mode";
import { FloatingHamburgerMenu } from "./floating-hamburger-menu";

// Define feature groups with hierarchy and visual styling
const featureGroups = [
  {
    title: "Planning & Scheduling",
    priority: "high", // large cards
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      { icon: BarChart3, label: "Production Schedule", href: "/production-schedule", feature: "production-scheduling", action: "view", color: "bg-blue-500" },
      { icon: Layout, label: "Scheduler Dashboard", href: "/production-scheduler-dashboard", feature: "scheduling", action: "view", color: "bg-indigo-500" },
      { icon: Sparkles, label: "Order Optimization", href: "/optimize-orders", feature: "scheduling-optimizer", action: "view", color: "bg-amber-500" },
      { icon: Monitor, label: "Cockpit", href: "/cockpit", feature: "production-cockpit", action: "view", color: "bg-slate-600" },
      { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", feature: "capacity-planning", action: "view", color: "bg-purple-500" },
      { icon: Target, label: "Production Planning", href: "/production-planning", feature: "production-planning", action: "view", color: "bg-green-500" },
      { icon: Package, label: "ATP/CTP", href: "/atp-ctp", feature: "production-scheduling", action: "view", color: "bg-teal-500" },
      { icon: Clock, label: "Shift Management", href: "/shift-management", feature: "shift-management", action: "view", color: "bg-cyan-500" },
      { icon: AlertCircle, label: "Constraints Management", href: "/constraints", feature: "production-scheduling", action: "view", color: "bg-orange-600" }
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
      { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", feature: "optimization-studio", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { icon: BarChart3, label: "Analytics", href: "/analytics", feature: "analytics", action: "view", color: "bg-teal-500" },
      { icon: FileText, label: "Reports", href: "/reports", feature: "reports", action: "view", color: "bg-blue-600" }
    ]
  },
  {
    title: "Operations",
    priority: "medium", 
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    features: [
      { icon: Factory, label: "Shop Floor", href: "/shop-floor", feature: "shop-floor", action: "view", color: "bg-orange-500" },
      { icon: Settings, label: "Operator Dashboard", href: "/operator-dashboard", feature: "operator-dashboard", action: "view", color: "bg-gray-500" },
      { icon: Truck, label: "Forklift Driver", href: "/forklift-driver", feature: "forklift-driver", action: "view", color: "bg-yellow-500" },
      { icon: Wrench, label: "Maintenance", href: "/maintenance", feature: "maintenance", action: "view", color: "bg-red-500" },
      { icon: AlertTriangle, label: "Disruption Management", href: "/disruption-management", feature: "disruption-management", action: "view", color: "bg-red-600" }
    ]
  },
  {
    title: "Management",
    priority: "medium",
    color: "green",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    features: [
      { icon: TrendingUp, label: "Business Goals", href: "/business-goals", feature: "business-goals", action: "view", color: "bg-cyan-500" },
      { icon: Brain, label: "Demand Planning", href: "/demand-planning", feature: "demand-planning", action: "view", color: "bg-indigo-500" },
      { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", feature: "inventory-optimization", action: "view", color: "bg-emerald-500" }
    ]
  },
  {
    title: "System Administration",
    priority: "low",
    color: "gray",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-600",
    features: [
      { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", feature: "systems-management", action: "view", color: "bg-gray-600" },
      { icon: Database, label: "System Integration", href: "/systems-integration", feature: "systems-integration", action: "view", color: "bg-stone-500" },
      { icon: Shield, label: "User & Access Management", href: "/user-access-management", feature: "user-management", action: "view", color: "bg-amber-600" },
      { icon: Code, label: "Extension Studio", href: "/extension-studio", feature: "systems-management", action: "view", color: "bg-violet-500" },
      { icon: Puzzle, label: "Widgets", href: "/widgets", feature: "systems-management", action: "view", color: "bg-blue-500" },
      { icon: Layout, label: "Dashboards", href: "/dashboards", feature: "systems-management", action: "view", color: "bg-green-500" },
      { icon: Building, label: "Industry Templates", href: "/industry-templates", feature: "industry-templates", action: "view", color: "bg-cyan-600" },
      { icon: Layers, label: "Product Development", href: "/product-development", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Upload, label: "Master Data Setup", href: "/data-import", feature: "systems-management", action: "view", color: "bg-green-600" },
      { icon: Network, label: "Functional Map", href: "/functional-map", feature: "systems-management", action: "view", color: "bg-indigo-600" },
      { icon: Shield, label: "Data Validation", href: "/data-validation", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Network, label: "Data Map View", href: "/data-map", feature: "systems-management", action: "view", color: "bg-purple-600" },
      { icon: Database, label: "Data Schema View", href: "/data-schema", feature: "systems-management", action: "view", color: "bg-indigo-600" },
      { icon: ArrowRightLeft, label: "Data Relationships", href: "/data-relationships", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: FileText, label: "Table Field Documentation", href: "/table-field-viewer", feature: "systems-management", action: "view", color: "bg-slate-600" },
      { icon: FileX, label: "Logs", href: "/error-logs", feature: "systems-management", action: "view", color: "bg-red-500" }
    ]
  },
  {
    title: "Communication & Collaboration",
    priority: "low",
    color: "teal",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-800",
    features: [
      { icon: Eye, label: "Visual Factory", href: "/visual-factory", feature: "visual-factory", action: "view", color: "bg-indigo-500" },
      { icon: MessageCircle, label: "Chat", href: "/chat", feature: "chat", action: "view", color: "bg-green-600" },
      { icon: Columns3, label: "Boards", href: "/boards", feature: "boards", action: "view", color: "bg-blue-700" },
      { icon: MessageSquare, label: "Feedback", href: "/feedback", feature: "feedback", action: "view", color: "bg-orange-600" }
    ]
  },
  {
    title: "Support & Onboarding",
    priority: "low", 
    color: "indigo",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    features: [
      { icon: BookOpen, label: "Getting Started", href: "/onboarding", feature: "", action: "", color: "bg-emerald-500", requiresOnboarding: false },
      { icon: PlayCircle, label: "Take a Guided Tour", href: "#tour", feature: "", action: "", color: "bg-blue-500", requiresOnboarding: false, isSpecial: true },
      { icon: Settings, label: "Tenant Administration", href: "/tenant-admin", feature: "tenant-admin", action: "view", color: "bg-purple-600" }
    ]
  }
];

export default function TopMenu() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [tourSelectionOpen, setTourSelectionOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [useCardLayout, setUseCardLayout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const menuContentRef = React.useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isMaxOpen, setMaxOpen } = useMaxDock();
  const { aiTheme, getThemeClasses } = useAITheme();
  const { recentPages, clearRecentPages, togglePinPage, addRecentPage } = useNavigation();
  const { startTour } = useTour();
  const { resolvedTheme } = useTheme();

  // Helper function to get dark mode compatible background colors
  const getDarkModeColor = (lightColor: string, darkColor?: string) => {
    // Now we include dark mode classes directly in the data, so just pass through
    return lightColor;
  };

  // Helper function to get dark mode compatible border colors
  const getDarkModeBorder = (lightBorder: string, darkBorder?: string) => {
    // Now we include dark mode classes directly in the data, so just pass through
    return lightBorder;
  };

  // Get onboarding status for menu filtering
  const { data: onboardingData } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user
  }) as { data: any };

  // Get user's assigned roles
  const { data: assignedRoles = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/assigned-roles`],
    enabled: !!user?.id,
  });

  // Get user's current role
  const { data: currentRoleData } = useQuery({
    queryKey: [`/api/users/${user?.id}/current-role`],
    enabled: !!user?.id,
    staleTime: 0, // Force fresh data
    cacheTime: 0  // Don't cache
  });

  // Check if onboarding is complete
  // For admin users or authenticated users, we'll consider onboarding complete
  const isOnboardingComplete = true; // Simplified - always show all menu items for authenticated users

  // Effect to detect if content overflows viewport
  React.useEffect(() => {
    if (!menuOpen || !menuContentRef.current) return;

    const checkOverflow = () => {
      const contentHeight = menuContentRef.current?.scrollHeight || 0;
      const viewportHeight = window.innerHeight;
      const headerHeight = 180; // Approximate header and search area height
      const padding = 100; // Additional padding for comfort
      
      // Use card layout if content would overflow with some margin
      setUseCardLayout(contentHeight + headerHeight + padding > viewportHeight);
    };

    // Check on mount and window resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [menuOpen, searchFilter]);

  // Toggle category expansion in card layout
  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  // Use fetched current role or derive from user data
  const currentRole = currentRoleData || user?.currentRole || (user?.activeRoleId && user?.roles ? 
    user.roles.find(role => role.id === user.activeRoleId) : null);

  // Convert to RoleSwitcher-compatible format with required description
  // For admin user, default to Administrator role if no specific role is set
  const currentRoleForSwitcher = currentRole ? {
    id: (currentRole as any)?.id || '',
    name: (currentRole as any)?.name || '',
    description: (currentRole as any)?.description || ''
  } : (user?.username === 'admin' ? {
    id: '6',
    name: 'Administrator',
    description: 'Full system access'
  } : null);

  // Function to toggle Max AI Assistant
  const toggleMaxAI = () => {
    setMaxOpen(!isMaxOpen);
    setMenuOpen(false);
  };

  // Filter features based on permissions, onboarding completion, and search
  const getVisibleFeatures = (features: any[]) => {
    return features.filter(feature => {
      if (feature.href === "#max") return !isMaxOpen; // Only show Max AI when closed
      if (feature.requiresOnboarding === false) return true; // Always show items that don't require onboarding
      if (!feature.feature) return true; // Always show items without permission requirements
      
      // Hide features that require onboarding if not complete (except Getting Started and Take a Tour)
      if (!isOnboardingComplete && feature.href !== "/onboarding" && feature.href !== "#tour") {
        return false;
      }
      
      // Check permissions for feature access
      return hasPermission(feature.feature, feature.action);
    }).filter(feature => {
      // Apply search filter if search term exists
      if (!searchFilter.trim()) return true;
      const searchTerm = searchFilter.toLowerCase();
      return feature.label.toLowerCase().includes(searchTerm);
    });
  };

  const getVisibleGroups = () => {
    return featureGroups.map(group => ({
      ...group,
      features: getVisibleFeatures(group.features)
    })).filter(group => group.features.length > 0);
  };

  // Flatten all menu items for individual search results
  const getAllSearchableItems = () => {
    const allItems: Array<{
      feature: any;
      groupTitle: string;
      groupColor: string;
    }> = [];
    
    featureGroups.forEach(group => {
      // When searching, include ALL features regardless of permissions or onboarding status
      // Users should be able to search for and see what features exist
      group.features.forEach(feature => {
        allItems.push({
          feature,
          groupTitle: group.title,
          groupColor: group.color
        });
      });
    });
    
    return allItems;
  };

  // Get search results for individual menu items
  const getSearchResults = () => {
    if (!searchFilter.trim()) return [];
    
    const searchTerm = searchFilter.toLowerCase();
    const allItems = getAllSearchableItems();
    
    // Debug logging
    console.log('=== MENU SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Total searchable items:', allItems.length);
    console.log('All items:', allItems.map(item => item.feature.label));
    
    const results = allItems.filter(item => 
      item.feature.label.toLowerCase().includes(searchTerm)
    );
    
    console.log('Matching results:', results.length);
    console.log('Results:', results.map(item => item.feature.label));
    console.log('=== END SEARCH DEBUG ===');
    
    return results;
  };

  const handleFeatureClick = (feature: any) => {
    if (feature.href === "#max") {
      // Add Max AI to recent pages
      addRecentPage("#max", "Max AI Assistant", "Bot");
      toggleMaxAI();
    } else if (feature.href === "#tour") {
      // Open tour selection dialog to let user choose which tour to take
      setTourSelectionOpen(true);
    } else {
      // For all regular menu items, add them to recent pages
      addRecentPage(feature.href, feature.label, feature.icon?.name || 'FileText');
    }
    setMenuOpen(false);
  };

  // Compact card sizes for 3-column layout without scrolling
  const getCardSize = (priority: string) => {
    switch (priority) {
      case "high":
        return "w-full min-h-[60px] h-[60px] sm:min-h-[65px] sm:h-[65px] md:min-h-[70px] md:h-[70px]";
      case "medium":
        return "w-full min-h-[55px] h-[55px] sm:min-h-[60px] sm:h-[60px] md:min-h-[65px] md:h-[65px]";
      default:
        return "w-full min-h-[50px] h-[50px] sm:min-h-[55px] sm:h-[55px] md:min-h-[60px] md:h-[60px]";
    }
  };

  const getIconSize = (priority: string) => {
    switch (priority) {
      case "high":
        return "w-4 h-4";
      case "medium":
        return "w-3.5 h-3.5";
      default:
        return "w-3 h-3";
    }
  };

  const getTextSize = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-[11px] font-semibold";
      case "medium":
        return "text-[10px] font-medium";
      default:
        return "text-[10px] font-normal";
    }
  };

  const { currentView } = useViewMode();

  return (
    <>
      {/* Floating Hamburger Menu Button - Show on all views */}
      <FloatingHamburgerMenu
        onToggle={(newState) => {
          console.log('Hamburger menu toggled, new state:', newState);
          setMenuOpen(newState);
        }}
        isOpen={menuOpen}
        showOnDesktop={true}
        showOnMobile={true}
      />
      
      {/* Persistent Theme Toggle - Always visible except in mobile view */}
      {!menuOpen && currentView !== "mobile" && (
        <div className="fixed top-2 right-2 z-50">
          <ThemeToggleSimple />
        </div>
      )}

      {/* Full Screen Dropdown Menu - Show on all views */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-25"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // Prevent background scrolling when touching outside menu content
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            className="hamburger-menu-container bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-2xl h-screen overflow-hidden flex flex-col"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Menu Header with Logo and Controls */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {/* Close Button - moved to left side */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 hover:bg-gray-100 flex-shrink-0 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
                <div
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isMobileDevice = window.innerWidth < 768;
                    console.log('🔴 LOGO CLICKED - window width:', window.innerWidth);
                    console.log('🔴 Is mobile device:', isMobileDevice);
                    console.log('🔴 Current location:', location);
                    const targetPath = isMobileDevice ? "/mobile-home" : "/";
                    console.log('🔴 Target path:', targetPath);
                    console.log('🔴 Closing menu and navigating...');
                    setMenuOpen(false);
                    // Force navigation with a small delay to ensure menu closes first
                    setTimeout(() => {
                      console.log('🔴 Actually navigating to:', targetPath);
                      setLocation(targetPath);
                    }, 100);
                  }}
                >
                  <img 
                    src="/attached_assets/Copy of logo-icon_250px_1754109283906.PNG" 
                    alt="PlanetTogether" 
                    className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 object-contain"
                  />
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">PlanetTogether</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* User Profile Section */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    <AssignedRoleSwitcher userId={user?.id || 0} currentRole={currentRoleForSwitcher} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar 
                      className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                      onClick={() => setUserProfileOpen(true)}
                    >
                      <AvatarFallback className="bg-blue-500 text-white text-xs sm:text-sm">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="hidden md:block text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md px-2 py-1 transition-colors duration-200"
                      onClick={() => setUserProfileOpen(true)}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(currentRole as any)?.name || (user?.username === 'admin' ? 'Administrator' : 'No Role')}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserProfileDialog 
                        open={userProfileOpen}
                        onOpenChange={setUserProfileOpen}
                      />
                      <ThemeToggle />
                      <MobileViewToggle />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("Logout button clicked");
                          logout();
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 ring-2 ring-red-200"
                        title="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only user controls and search - combined on same level to save vertical space */}
            <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-25 dark:bg-gray-800">
              <div className="flex items-center justify-between space-x-3">
                {/* Search on the left */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchFilter}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('=== MOBILE SEARCH INPUT CHANGED ===');
                      console.log('New search value:', newValue);
                      setSearchFilter(newValue);
                    }}
                    className="pl-9 pr-8 py-2 w-full text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {searchFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {/* Role switching controls on the right */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Show assigned role switcher for users with multiple assigned roles */}
                  <AssignedRoleSwitcher userId={user?.id || 0} currentRole={currentRoleForSwitcher} />
                </div>
              </div>
            </div>

            {/* Desktop search filter - centered and constrained width */}
            <div className="hidden sm:block px-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex justify-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchFilter}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('=== SEARCH INPUT CHANGED ===');
                      console.log('New search value:', newValue);
                      setSearchFilter(newValue);
                    }}
                    className="pl-9 pr-4 py-2 w-full text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {searchFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Content */}
            <div ref={menuContentRef} className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto flex-1 overflow-y-auto">
              {/* Recent & Favorites Section */}
              {recentPages.filter(page => {
                if (!searchFilter.trim()) return true;
                const searchTerm = searchFilter.toLowerCase();
                return page.label.toLowerCase().includes(searchTerm);
              }).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 flex-1">
                      Recent & Favorites
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentPages}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 h-auto"
                    >
                      Clear
                    </Button>
                  </div>
                  <DashboardCardContainer
                    maxVisibleCardsMobile={3}
                    maxVisibleCardsTablet={3}
                    maxVisibleCardsDesktop={3}
                    showMoreText="Show More"
                    showLessText="Show Less"
                    gridClassName="grid grid-cols-3 gap-3 auto-rows-fr"
                    cards={recentPages.filter(page => {
                      if (!searchFilter.trim()) return true;
                      const searchTerm = searchFilter.toLowerCase();
                      return page.label.toLowerCase().includes(searchTerm);
                    }).map((page, index) => {
                      // Map page paths to their original icons and colors
                      const getIconAndColorForPage = (path: string) => {
                        // Find the icon and color from the feature groups
                        for (const group of featureGroups) {
                          const feature = group.features.find(f => f.href === path);
                          if (feature) return { 
                            icon: feature.icon, 
                            color: feature.color, 
                            isAI: (feature as any).isAI || false 
                          };
                        }
                        // Default fallback
                        return { icon: FileText, color: "bg-gray-500", isAI: false };
                      };
                      
                      const { icon: IconComponent, color, isAI } = getIconAndColorForPage(page.path);
                      const iconColorClass = isAI ? 'text-white' : color.replace('bg-', 'text-').replace('-500', '-600');
                      
                      return {
                        id: `recent-${page.path}-${index}`,
                        priority: page.isPinned ? 1 : 5, // Pinned items get highest priority
                        content: (
                          <div key={`${page.path}-${index}`} className="relative group">
                            <Link 
                              href={page.path === "#max" ? "#" : page.path}
                              onClick={() => {
                                if (page.path === "#max") {
                                  toggleMaxAI();
                                }
                                setMenuOpen(false);
                              }}
                            >
                              <div className={`
                                w-full aspect-square min-h-[60px] h-[60px] min-w-[60px] md:min-h-[70px] md:h-[70px] md:min-w-[70px] 
                                border hover:shadow-md rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] 
                                flex flex-col items-center justify-center text-center space-y-1 relative
                                ${page.isPinned ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-700/40 dark:border-emerald-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'}
                                ${isAI ? 'border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-700/30 dark:to-pink-700/30' : ''}
                              `}>
                                <div className={`
                                  ${isAI ? getThemeClasses(false) : 'bg-gray-100 dark:bg-gray-600'} 
                                  p-1.5 rounded-full flex items-center justify-center flex-shrink-0
                                `}>
                                  <IconComponent className={`w-4 h-4 ${iconColorClass}`} strokeWidth={1.5} fill="none" />
                                </div>
                                <span className="text-xs font-medium text-gray-800 dark:text-white leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0">
                                  {page.label}
                                </span>
                                {/* Pin/Unpin Button - Bottom Right Corner */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    togglePinPage(page.path);
                                  }}
                                  className={`
                                    absolute bottom-1 right-1 h-4 w-4 p-0 transition-all
                                    ${page.isPinned ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}
                                  `}
                                  title={page.isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
                                >
                                  {page.isPinned ? <Pin className="h-2.5 w-2.5" strokeWidth={2} /> : <PinOff className="h-2.5 w-2.5" strokeWidth={1} />}
                                </Button>
                              </div>
                            </Link>
                          </div>
                        )
                      };
                    })}
                  />
                </div>
              )}

              {/* Search Results Section - Show individual menu items when searching */}
              {searchFilter.trim() && getSearchResults().length > 0 && (() => {
                console.log('=== RENDERING SEARCH RESULTS ===');
                console.log('Search filter:', searchFilter);
                console.log('Results count:', getSearchResults().length);
                return true;
              })() && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 flex-1">
                      Search Results ({getSearchResults().length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {getSearchResults().map((item, index) => (
                      <Link 
                        key={`search-${index}`}
                        href={item.feature.href === "#max" ? "#" : item.feature.href}
                        onClick={() => handleFeatureClick(item.feature)}
                      >
                        <div className={`
                          w-full min-h-[80px] h-[80px] 
                          border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 
                          hover:shadow-md rounded-xl p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                          flex flex-col items-center justify-center text-center space-y-2
                          ${location === item.feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'}
                          ${item.feature.isAI ? 'border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' : ''}
                        `}>
                          <div className={`
                            ${item.feature.isAI ? getThemeClasses(false) : item.feature.color} 
                            p-2 rounded-lg flex items-center justify-center flex-shrink-0
                          `}>
                            <item.feature.icon className="w-4 h-4 text-white" strokeWidth={1.5} fill="none" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-800 dark:text-white leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0">
                              {item.feature.label}
                            </span>
                            <span className={`text-xs ${
                              item.groupColor === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              item.groupColor === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              item.groupColor === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                              item.groupColor === 'green' ? 'text-green-600 dark:text-green-400' :
                              item.groupColor === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                              item.groupColor === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                              'text-gray-600 dark:text-gray-400'
                            } font-normal`}>
                              {item.groupTitle}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No Results Message */}
              {searchFilter.trim() && getSearchResults().length === 0 && (() => {
                console.log('=== NO SEARCH RESULTS ===');
                console.log('Search filter:', searchFilter);
                console.log('All searchable items:', getAllSearchableItems().length);
                return true;
              })() && (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
                    No results found for "{searchFilter}"
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Try searching with different keywords
                  </p>
                </div>
              )}
              
              {/* Card Layout (when content overflows) or Expanded Layout (when content fits) */}
              {!searchFilter.trim() && (
                useCardLayout ? (
                // Card layout for when content exceeds viewport
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getVisibleGroups().map((group, groupIndex) => {
                    const isExpanded = expandedCategories.has(group.title);
                    const Icon = isExpanded ? ChevronDown : ChevronRight;
                    
                    return (
                      <div key={groupIndex} className={`${getDarkModeColor(group.bgColor, group.bgColor.replace('-50', '-950/20').replace('dark:', ''))} rounded-xl border ${getDarkModeBorder(group.borderColor, group.borderColor.replace('-200', '-800').replace('dark:', ''))} overflow-hidden shadow-sm`}>
                        <div 
                          className="p-4 cursor-pointer hover:bg-opacity-70 transition-colors"
                          onClick={() => toggleCategory(group.title)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {(() => {
                                const FirstIcon = group.features[0]?.icon;
                                const colorMap: Record<string, string> = {
                                  'blue': 'bg-blue-500 dark:bg-blue-600',
                                  'purple': 'bg-purple-500 dark:bg-purple-600',
                                  'orange': 'bg-orange-500 dark:bg-orange-600',
                                  'green': 'bg-green-500 dark:bg-green-600',
                                  'gray': 'bg-gray-500 dark:bg-gray-600',
                                  'teal': 'bg-teal-500 dark:bg-teal-600',
                                  'amber': 'bg-amber-500 dark:bg-amber-600'
                                };
                                const bgColor = colorMap[group.color] || 'bg-gray-500 dark:bg-gray-600';
                                
                                return (
                                  <>
                                    <div className={`${bgColor} p-2 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                      {FirstIcon && <FirstIcon className="w-5 h-5 text-white" strokeWidth={1.5} />}
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                                      {group.title}
                                    </h3>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'
                                }}>
                                {group.features.length}
                              </span>
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-opacity-50 dark:bg-opacity-100"
                            style={{ 
                              backgroundColor: resolvedTheme === 'dark' ? 'rgb(55, 65, 81)' : 'rgba(243, 244, 246, 0.5)'
                            }}>
                            <div className="grid grid-cols-2 gap-2">
                              {group.features.map((feature, featureIndex) => (
                                <Link 
                                  key={featureIndex} 
                                  href={feature.href === "#max" ? "#" : feature.href}
                                  onClick={() => handleFeatureClick(feature)}
                                >
                                  <div className={`
                                    h-[50px] border hover:shadow-sm
                                    rounded-lg p-2 cursor-pointer transition-all duration-150
                                    flex items-center space-x-2
                                    ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-700/40' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'}
                                    ${feature.isAI ? 'border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-700/30 dark:to-pink-700/30' : ''}
                                  `}>
                                    <div className={`
                                      ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : feature.color}
                                      p-1 rounded-md flex items-center justify-center flex-shrink-0
                                    `}>
                                      <feature.icon className="w-3 h-3 text-white" strokeWidth={1.5} fill="none" />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-white leading-tight line-clamp-2 overflow-hidden">
                                      {feature.label}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Expanded layout when content fits comfortably
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  {getVisibleGroups().map((group, groupIndex) => (
                    <div key={groupIndex} className={`${getDarkModeColor(group.bgColor, group.bgColor.replace('-50', '-950/20').replace('dark:', ''))} rounded-xl border ${getDarkModeBorder(group.borderColor, group.borderColor.replace('-200', '-800').replace('dark:', ''))} p-4 shadow-sm`}>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center uppercase tracking-wide">
                        {(() => {
                          const FirstIcon = group.features[0]?.icon;
                          const colorMap: Record<string, string> = {
                            'blue': 'bg-blue-500',
                            'purple': 'bg-purple-500',
                            'orange': 'bg-orange-500',
                            'green': 'bg-green-500',
                            'gray': 'bg-gray-500',
                            'teal': 'bg-teal-500',
                            'amber': 'bg-amber-500'
                          };
                          const bgColor = colorMap[group.color] || 'bg-gray-500';
                          
                          return (
                            <>
                              <div className={`${bgColor} p-1.5 rounded-md flex items-center justify-center flex-shrink-0 mr-2.5`}>
                                {FirstIcon && <FirstIcon className="w-4 h-4 text-white" strokeWidth={1.5} />}
                              </div>
                              {group.title}
                            </>
                          );
                        })()}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {group.features.map((feature, featureIndex) => (
                          <Link 
                            key={featureIndex} 
                            href={feature.href === "#max" ? "#" : feature.href}
                            onClick={() => handleFeatureClick(feature)}
                          >
                            <div className={`
                              ${getCardSize(group.priority)}
                              border hover:shadow-sm
                              rounded-lg p-2 cursor-pointer transition-all duration-150
                              flex flex-col items-center justify-center text-center gap-1
                              ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-700/40' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'}
                              ${feature.isAI ? 'border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-700/30 dark:to-pink-700/30' : ''}
                            `}>
                              <div className={`
                                ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : feature.color}
                                p-1.5 rounded-md flex items-center justify-center flex-shrink-0
                              `}>
                                <feature.icon 
                                  className={`${getIconSize(group.priority)} text-white`} 
                                  strokeWidth={1.5} 
                                  fill="none"
                                />
                              </div>
                              <span className={`${getTextSize(group.priority)} text-gray-700 dark:text-white leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0`}>
                                {feature.label}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                )
              )}
            </div>
          </div>
          
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setMenuOpen(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
            }}
            style={{ touchAction: 'none' }}
          />
        </div>
      )}

      {/* Tour Selection Dialog */}
      <TourSelectionDialog 
        open={tourSelectionOpen} 
        onOpenChange={setTourSelectionOpen}
      />
    </>
  );
}

// Mobile View Toggle Component
function MobileViewToggle() {
  const { currentView, toggleView } = useViewMode();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleView}
      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 ring-2 ring-blue-200"
      title="Switch to Mobile View"
    >
      <Smartphone className="h-4 w-4" />
    </Button>
  );
}