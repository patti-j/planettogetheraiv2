import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Factory, Briefcase, BarChart3, FileText, Bot, Columns3, Menu, Smartphone, 
  DollarSign, Headphones, Settings, Wrench, MessageSquare, MessageCircle, 
  Truck, ChevronDown, Target, Database, Building, Server, TrendingUp, 
  Shield, GraduationCap, UserCheck, BookOpen, HelpCircle, AlertTriangle, 
  Package, Brain, User, LogOut, Code, Layers, Presentation, Sparkles, Grid3X3 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "./role-switcher";
import { TrainingModeExit } from "./training-mode-exit";
import { UserProfileDialog } from "./user-profile";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";

// Define feature groups with hierarchy and visual styling
const featureGroups = [
  {
    title: "Core Production",
    priority: "high", // large cards
    features: [
      { icon: BarChart3, label: "Production Schedule", href: "/production-schedule", feature: "production-scheduling", action: "view", color: "bg-blue-500" },
      { icon: Factory, label: "Shop Floor", href: "/shop-floor", feature: "shop-floor", action: "view", color: "bg-orange-500" },
      { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", feature: "capacity-planning", action: "view", color: "bg-purple-500" },
      { icon: Target, label: "Production Planning", href: "/production-planning", feature: "production-planning", action: "view", color: "bg-green-500" }
    ]
  },
  {
    title: "AI & Optimization", 
    priority: "high",
    features: [
      { icon: Bot, label: "Max AI Assistant", href: "#max", feature: "", action: "", color: "bg-gradient-to-r from-purple-500 to-pink-600", isAI: true },
      { icon: Sparkles, label: "Optimization Studio", href: "/optimization-studio", feature: "optimization-studio", action: "view", color: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { icon: Brain, label: "Demand Forecasting", href: "/demand-forecasting", feature: "demand-forecasting", action: "view", color: "bg-indigo-500" },
      { icon: Package, label: "Inventory Optimization", href: "/inventory-optimization", feature: "inventory-optimization", action: "view", color: "bg-emerald-500" }
    ]
  },
  {
    title: "Operations",
    priority: "medium", 
    features: [
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
      { icon: Building, label: "Plant Manager", href: "/plant-manager-dashboard", feature: "plant-manager", action: "view", color: "bg-slate-500" },
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
      { icon: Code, label: "Extension Studio", href: "/extension-studio", feature: "systems-management", action: "view", color: "bg-violet-500" }
    ]
  },
  {
    title: "Communication & Collaboration",
    priority: "low",
    features: [
      { icon: MessageCircle, label: "Chat", href: "/chat", feature: "chat", action: "view", color: "bg-green-600" },
      { icon: Columns3, label: "Boards", href: "/boards", feature: "boards", action: "view", color: "bg-blue-700" },
      { icon: Presentation, label: "Presentation System", href: "/presentation-system", feature: "presentation-system", action: "view", color: "bg-purple-600" },
      { icon: MessageSquare, label: "Feedback", href: "/feedback", feature: "feedback", action: "view", color: "bg-orange-600" }
    ]
  },
  {
    title: "Training & Support",
    priority: "low", 
    features: [
      { icon: BookOpen, label: "Getting Started", href: "/help", feature: "getting-started", action: "view", color: "bg-lime-500" },
      { icon: GraduationCap, label: "Training", href: "/training", feature: "training", action: "view", color: "bg-blue-500" },
      { icon: Building, label: "Industry Templates", href: "/industry-templates", feature: "industry-templates", action: "view", color: "bg-cyan-600" }
    ]
  }
];

export default function TopMenu() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { isMaxOpen, setMaxOpen } = useMaxDock();
  const { aiTheme } = useAITheme();

  // Function to toggle Max AI Assistant
  const toggleMaxAI = () => {
    setMaxOpen(!isMaxOpen);
    setMenuOpen(false);
  };

  // Filter features based on permissions
  const getVisibleFeatures = (features: any[]) => {
    return features.filter(feature => {
      if (feature.href === "#max") return !isMaxOpen; // Only show Max AI when closed
      if (!feature.feature) return true; // Always show items without permission requirements
      return hasPermission(feature.feature, feature.action);
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
    }
    setMenuOpen(false);
  };

  const getCardSize = (priority: string) => {
    switch (priority) {
      case "high": return "col-span-2 row-span-2 h-32"; // Large cards
      case "medium": return "col-span-1 row-span-1 h-20"; // Medium cards  
      case "low": return "col-span-1 row-span-1 h-16"; // Small cards
      default: return "col-span-1 row-span-1 h-20";
    }
  };

  const getIconSize = (priority: string) => {
    switch (priority) {
      case "high": return "w-8 h-8";
      case "medium": return "w-6 h-6"; 
      case "low": return "w-5 h-5";
      default: return "w-6 h-6";
    }
  };

  const getTextSize = (priority: string) => {
    switch (priority) {
      case "high": return "text-base font-semibold";
      case "medium": return "text-sm font-medium";
      case "low": return "text-xs font-medium";
      default: return "text-sm font-medium";
    }
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
            className="p-2 bg-white shadow-md border border-gray-300 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Full Screen Dropdown Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-25">
          <div className="bg-white border-b border-gray-200 shadow-lg min-h-[50vh] max-h-[80vh] overflow-y-auto">
            {/* Menu Header with Logo and Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <Factory className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">PlanetTogether</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* User Profile Section */}
                <div className="flex items-center space-x-3">
                  <TrainingModeExit />
                  <RoleSwitcher userId={user?.id || 0} currentRole={user?.currentRole} />
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.currentRole?.name}</p>
                    </div>
                  </div>
                </div>
                
                {/* Close Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                  className="p-2"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Menu Content */}
            <div className="p-6 space-y-8">
              {getVisibleGroups().map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {group.features.map((feature, featureIndex) => (
                      <Link 
                        key={featureIndex} 
                        href={feature.href === "#max" ? "#" : feature.href}
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <div className={`
                          ${getCardSize(group.priority)}
                          bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md
                          rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                          flex flex-col items-center justify-center text-center space-y-3
                          ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}
                          ${feature.isAI ? 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : ''}
                        `}>
                          <div className={`
                            ${feature.isAI ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-100'}
                            p-3 rounded-full flex items-center justify-center
                          `}>
                            <feature.icon 
                              className={`${getIconSize(group.priority)} ${feature.isAI ? 'text-white' : feature.color.replace('bg-', 'text-').replace('-500', '-600')}`} 
                              strokeWidth={1.5} 
                              fill="none"
                            />
                          </div>
                          <span className={`${getTextSize(group.priority)} text-gray-800 font-medium leading-tight`}>
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
          
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}