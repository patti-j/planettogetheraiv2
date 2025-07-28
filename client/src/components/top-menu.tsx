import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Factory, Briefcase, BarChart3, FileText, Bot, Columns3, Menu, Smartphone, 
  DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, 
  Truck, ChevronDown, Target, Database, Building, Server, TrendingUp, 
  Shield, GraduationCap, UserCheck, BookOpen, HelpCircle, AlertTriangle, 
  Package, Brain, User, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3, 
  Eye, FileX, Clock, Monitor, History, X, Upload, Pin, PinOff, PlayCircle, Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "./role-switcher";
import { TrainingModeExit } from "./training-mode-exit";
import { UserProfileDialog } from "./user-profile";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useNavigation } from "@/contexts/NavigationContext";
import { useTour } from "@/contexts/TourContext";
import { TourSelectionDialog } from "./tour-selection-dialog";
import { Input } from "@/components/ui/input";

// Define feature groups with hierarchy and visual styling
const featureGroups = [
  {
    title: "Planning & Scheduling",
    priority: "high", // large cards
    features: [
      { icon: BarChart3, label: "Production Schedule", href: "/production-schedule", feature: "production-scheduling", action: "view", color: "bg-blue-500" },
      { icon: Sparkles, label: "Order Optimization", href: "/optimize-orders", feature: "scheduling-optimizer", action: "view", color: "bg-amber-500" },
      { icon: Monitor, label: "Cockpit", href: "/cockpit", feature: "production-cockpit", action: "view", color: "bg-slate-600" },
      { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", feature: "capacity-planning", action: "view", color: "bg-purple-500" },
      { icon: Target, label: "Production Planning", href: "/production-planning", feature: "production-planning", action: "view", color: "bg-green-500" },
      { icon: Package, label: "ATP/CTP", href: "/atp-ctp", feature: "production-scheduling", action: "view", color: "bg-teal-500" },
      { icon: Clock, label: "Shift Management", href: "/shift-management", feature: "shift-management", action: "view", color: "bg-cyan-500" }
    ]
  },
  {
    title: "AI & Optimization", 
    priority: "high",
    features: [
      { icon: Bot, label: "Max AI Assistant", href: "#max", feature: "", action: "", color: "bg-gradient-to-r from-purple-500 to-pink-600", isAI: true, requiresOnboarding: false },
      { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", feature: "optimization-studio", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { icon: History, label: "Scheduling History", href: "/scheduling-history", feature: "optimization-studio", action: "view", color: "bg-slate-500" },
      { icon: Brain, label: "Demand Planning", href: "/demand-planning", feature: "demand-planning", action: "view", color: "bg-indigo-500" },
      { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", feature: "inventory-optimization", action: "view", color: "bg-emerald-500" }
    ]
  },
  {
    title: "Operations",
    priority: "medium", 
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
    features: [

      { icon: TrendingUp, label: "Business Goals", href: "/business-goals", feature: "business-goals", action: "view", color: "bg-cyan-500" },
      { icon: BarChart3, label: "Analytics", href: "/analytics", feature: "analytics", action: "view", color: "bg-teal-500" },
      { icon: FileText, label: "Reports", href: "/reports", feature: "reports", action: "view", color: "bg-blue-600" }
    ]
  },
  {
    title: "System Administration",
    priority: "low",
    features: [
      { icon: Server, label: "Systems Management", href: "/systems-management-dashboard", feature: "systems-management", action: "view", color: "bg-gray-600" },
      { icon: Database, label: "System Integration", href: "/systems-integration", feature: "systems-integration", action: "view", color: "bg-stone-500" },
      { icon: Shield, label: "Role Management", href: "/role-management", feature: "user-management", action: "view", color: "bg-amber-600" },
      { icon: Code, label: "Extension Studio", href: "/extension-studio", feature: "systems-management", action: "view", color: "bg-violet-500" },
      { icon: Building, label: "Industry Templates", href: "/industry-templates", feature: "industry-templates", action: "view", color: "bg-cyan-600" },
      { icon: Layers, label: "Product Development", href: "/product-development", feature: "systems-management", action: "view", color: "bg-blue-600" },
      { icon: Upload, label: "Master Data Setup", href: "/data-import", feature: "systems-management", action: "view", color: "bg-green-600" },
      { icon: FileX, label: "Logs", href: "/error-logs", feature: "systems-management", action: "view", color: "bg-red-500" }
    ]
  },
  {
    title: "Communication & Collaboration",
    priority: "low",
    features: [
      { icon: Eye, label: "Visual Factory", href: "/visual-factory", feature: "visual-factory", action: "view", color: "bg-indigo-500" },
      { icon: MessageCircle, label: "Chat", href: "/chat", feature: "chat", action: "view", color: "bg-green-600" },
      { icon: Columns3, label: "Boards", href: "/boards", feature: "boards", action: "view", color: "bg-blue-700" },
      { icon: MessageSquare, label: "Feedback", href: "/feedback", feature: "feedback", action: "view", color: "bg-orange-600" }
    ]
  },
  {
    title: "Training & Support",
    priority: "low", 
    features: [
      { icon: BookOpen, label: "Getting Started", href: "/onboarding", feature: "", action: "", color: "bg-emerald-500", requiresOnboarding: false },
      { icon: PlayCircle, label: "Take a Guided Tour", href: "#tour", feature: "", action: "", color: "bg-blue-500", requiresOnboarding: false, isSpecial: true },
      { icon: GraduationCap, label: "Training", href: "/training", feature: "", action: "", color: "bg-blue-500" },
      { icon: Presentation, label: "Presentation System", href: "/presentation-system", feature: "", action: "", color: "bg-purple-600" }
    ]
  }
];

export default function TopMenu() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [tourSelectionOpen, setTourSelectionOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isMaxOpen, setMaxOpen } = useMaxDock();
  const { aiTheme } = useAITheme();
  const { recentPages, clearRecentPages, togglePinPage } = useNavigation();
  const { startTour } = useTour();

  // Get onboarding status for menu filtering
  const { data: onboardingData } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user
  }) as { data: any };

  // Check if onboarding is complete
  const isOnboardingComplete = onboardingData && 
    onboardingData.companyName?.trim() && 
    onboardingData.selectedFeatures && 
    onboardingData.selectedFeatures.length > 0;

  // Derive current role from user data if not provided
  const currentRole = user?.currentRole || (user?.activeRoleId && user?.roles ? 
    user.roles.find(role => role.id === user.activeRoleId) : null);

  // Convert to RoleSwitcher-compatible format with required description
  const currentRoleForSwitcher = currentRole ? {
    id: currentRole.id,
    name: currentRole.name,
    description: currentRole.description || ''
  } : null;

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

  const handleFeatureClick = (feature: any) => {
    if (feature.href === "#max") {
      toggleMaxAI();
    } else if (feature.href === "#tour") {
      // Open tour selection dialog to let user choose which tour to take
      setTourSelectionOpen(true);
    }
    setMenuOpen(false);
  };

  // Smaller, more compact cards for desktop
  const getCardSize = (priority: string) => {
    return "w-full aspect-square min-h-[100px] h-[100px] min-w-[100px]"; // Smaller for more compact layout
  };

  const getIconSize = (priority: string) => {
    return "w-4 h-4"; // Smaller icons for compact design
  };

  const getTextSize = (priority: string) => {
    return "text-xs font-medium"; // Smaller text to fit compact cards
  };

  return (
    <>
      {/* Hamburger Menu Button - Only visible when menu is closed */}
      {!menuOpen && (
        <div className="fixed top-2 left-2 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMenuOpen(true)}
            className="p-2 bg-white shadow-lg border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500"
          >
            <Menu className="w-5 h-5 text-gray-800 stroke-2" />
          </Button>
        </div>
      )}

      {/* Full Screen Dropdown Menu */}
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
            className="bg-white border-b border-gray-200 shadow-lg min-h-[50vh] max-h-[80vh] overflow-y-auto"
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
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {/* Close Button - moved to left side */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-gray-200 flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
                <Factory className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">PlanetTogether</h1>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* User Profile Section */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    <TrainingModeExit />
                    <RoleSwitcher userId={user?.id || 0} currentRole={currentRoleForSwitcher} />
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
                      className="hidden md:block text-left cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 transition-colors duration-200"
                      onClick={() => setUserProfileOpen(true)}
                    >
                      <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500">{currentRole?.name || 'No Role'}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserProfileDialog 
                        open={userProfileOpen}
                        onOpenChange={setUserProfileOpen}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => logout()}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        title="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only user controls */}
            <div className="sm:hidden px-4 py-3 border-b border-gray-200 bg-gray-25">
              <div className="flex items-center justify-center space-x-4">
                <TrainingModeExit />
                <RoleSwitcher userId={user?.id || 0} currentRole={currentRoleForSwitcher} />
              </div>
            </div>

            {/* Search Filter */}
            <div className="px-6 pt-4 pb-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchFilter("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Menu Content */}
            <div className="p-6 space-y-8">
              {/* Recent & Favorites Section */}
              {recentPages.filter(page => {
                if (!searchFilter.trim()) return true;
                const searchTerm = searchFilter.toLowerCase();
                return page.label.toLowerCase().includes(searchTerm);
              }).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex-1">
                      Recent & Favorites
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentPages}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
                    >
                      Clear
                    </Button>
                  </div>
                  {/* Mobile: 3 columns, Desktop: 6 columns for more compact layout */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 auto-rows-fr">
                    {recentPages.filter(page => {
                      if (!searchFilter.trim()) return true;
                      const searchTerm = searchFilter.toLowerCase();
                      return page.label.toLowerCase().includes(searchTerm);
                    }).map((page, index) => {
                      // Map page paths to their original icons and colors
                      const getIconAndColorForPage = (path: string) => {
                        // Find the icon and color from the feature groups
                        for (const group of featureGroups) {
                          const feature = group.features.find(f => f.href === path);
                          if (feature) return { icon: feature.icon, color: feature.color };
                        }
                        // Default fallback
                        return { icon: FileText, color: "bg-gray-500" };
                      };
                      
                      const { icon: IconComponent, color } = getIconAndColorForPage(page.path);
                      const iconColorClass = color.replace('bg-', 'text-').replace('-500', '-600');
                      
                      return (
                        <div key={`${page.path}-${index}`} className="relative group">
                          <Link 
                            href={page.path}
                            onClick={() => setMenuOpen(false)}
                          >
                            <div className={`
                              w-full aspect-square min-h-[100px] h-[100px] min-w-[100px] md:min-h-[90px] md:h-[90px] md:min-w-[90px] 
                              bg-white border hover:border-gray-300 hover:shadow-md rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] 
                              flex flex-col items-center justify-center text-center space-y-1 relative
                              ${page.isPinned ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}
                            `}>
                              <div className="bg-gray-100 p-1.5 rounded-full flex items-center justify-center flex-shrink-0">
                                <IconComponent className={`w-4 h-4 ${iconColorClass}`} strokeWidth={1.5} fill="none" />
                              </div>
                              <span className="text-xs font-medium text-gray-800 leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0">
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
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Single column on mobile, two-column layout on desktop */}
              <div className="md:grid md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">
                {/* Left Column - All groups on mobile, first half on desktop */}
                <div className="space-y-6">
                  {getVisibleGroups().slice(0, Math.ceil(getVisibleGroups().length / 2)).map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        {group.title}
                      </h3>
                      {/* Mobile: 3 columns, Desktop: 4 columns for compact layout */}
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 auto-rows-fr">
                        {group.features.map((feature, featureIndex) => (
                          <Link 
                            key={featureIndex} 
                            href={feature.href === "#max" ? "#" : feature.href}
                            onClick={() => handleFeatureClick(feature)}
                          >
                            <div className={`
                              ${getCardSize(group.priority)}
                              bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md
                              rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                              flex flex-col items-center justify-center text-center space-y-1
                              ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}
                              ${feature.isAI ? 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : ''}
                            `}>
                              <div className={`
                                ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-100'}
                                p-1.5 rounded-full flex items-center justify-center flex-shrink-0
                              `}>
                                <feature.icon 
                                  className={`${getIconSize(group.priority)} ${feature.isAI ? 'text-white' : feature.color.replace('bg-', 'text-').replace('-500', '-600')}`} 
                                  strokeWidth={1.5} 
                                  fill="none"
                                />
                              </div>
                              <span className={`${getTextSize(group.priority)} text-gray-800 font-medium leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0`}>
                                {feature.label}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show remaining groups on mobile in same column */}
                  <div className="md:hidden space-y-6">
                    {getVisibleGroups().slice(Math.ceil(getVisibleGroups().length / 2)).map((group, groupIndex) => (
                      <div key={groupIndex + Math.ceil(getVisibleGroups().length / 2)} className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          {group.title}
                        </h3>
                        <div className="grid grid-cols-3 gap-3 auto-rows-fr">
                          {group.features.map((feature, featureIndex) => (
                            <Link 
                              key={featureIndex} 
                              href={feature.href === "#max" ? "#" : feature.href}
                              onClick={() => handleFeatureClick(feature)}
                            >
                              <div className={`
                                ${getCardSize(group.priority)}
                                bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md
                                rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                                flex flex-col items-center justify-center text-center space-y-1
                                ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}
                                ${feature.isAI ? 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : ''}
                              `}>
                                <div className={`
                                  ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-100'}
                                  p-1.5 rounded-full flex items-center justify-center flex-shrink-0
                                `}>
                                  <feature.icon 
                                    className={`${getIconSize(group.priority)} ${feature.isAI ? 'text-white' : feature.color.replace('bg-', 'text-').replace('-500', '-600')}`} 
                                    strokeWidth={1.5} 
                                    fill="none"
                                  />
                                </div>
                                <span className={`${getTextSize(group.priority)} text-gray-800 font-medium leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0`}>
                                  {feature.label}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right Column - only visible on desktop */}
                <div className="hidden md:block space-y-6">
                  {getVisibleGroups().slice(Math.ceil(getVisibleGroups().length / 2)).map((group, groupIndex) => (
                    <div key={groupIndex + Math.ceil(getVisibleGroups().length / 2)} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        {group.title}
                      </h3>
                      <div className="grid grid-cols-4 gap-3 auto-rows-fr">
                        {group.features.map((feature, featureIndex) => (
                          <Link 
                            key={featureIndex} 
                            href={feature.href === "#max" ? "#" : feature.href}
                            onClick={() => handleFeatureClick(feature)}
                          >
                            <div className={`
                              ${getCardSize(group.priority)}
                              bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md
                              rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                              flex flex-col items-center justify-center text-center space-y-1
                              ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}
                              ${feature.isAI ? 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : ''}
                            `}>
                              <div className={`
                                ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-100'}
                                p-1.5 rounded-full flex items-center justify-center flex-shrink-0
                              `}>
                                <feature.icon 
                                  className={`${getIconSize(group.priority)} ${feature.isAI ? 'text-white' : feature.color.replace('bg-', 'text-').replace('-500', '-600')}`} 
                                  strokeWidth={1.5} 
                                  fill="none"
                                />
                              </div>
                              <span className={`${getTextSize(group.priority)} text-gray-800 font-medium leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0`}>
                                {feature.label}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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