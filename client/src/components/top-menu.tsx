import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Menu, ChevronDown, ChevronRight, User, LogOut, X, Pin, PinOff, Search, History,
  FileText, Calendar, Home, BookOpen, PlayCircle, Smartphone
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
import { GlobalSearchDialog } from "./global-search-dialog";
import { Input } from "@/components/ui/input";
import { DashboardCardContainer } from "./dashboard-card-container";
import { useTheme } from "@/hooks/useThemeFederated";
import { useViewMode } from "@/hooks/use-view-mode";
import { useLayoutDensity } from "@/contexts/LayoutDensityContext";
import { navigationGroups } from "@/config/navigation-menu";
import companyLogo from '@/assets/planet-together-logo.png';

// Use shared navigation groups
const featureGroups = navigationGroups;

interface TopMenuProps {
  onToggleAiPanel?: () => void;
  onToggleNavPanel?: () => void;
  isAiPanelOpen?: boolean;
  isNavPanelOpen?: boolean;
}

export default function TopMenu({ onToggleAiPanel, onToggleNavPanel, isAiPanelOpen, isNavPanelOpen }: TopMenuProps) {
  const [location, setLocation] = useLocation();
  const { handleNavigation } = useSplitScreen();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Debug userProfileOpen state changes
  useEffect(() => {
    console.log('userProfileOpen state changed to:', userProfileOpen);
  }, [userProfileOpen]);
  
  // Listen for toggle-main-menu event from hamburger menu
  useEffect(() => {
    const handleToggleMenu = () => {
      setMenuOpen(prev => !prev);
    };
    
    document.addEventListener('toggle-main-menu', handleToggleMenu);
    
    return () => {
      document.removeEventListener('toggle-main-menu', handleToggleMenu);
    };
  }, []);
  const [tourSelectionOpen, setTourSelectionOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [useCardLayout, setUseCardLayout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Check if navigation is pinned to show/hide menu button
  const [isNavigationPinned, setIsNavigationPinned] = useState(() => {
    try {
      return localStorage.getItem('navigationMenuPinned') === 'true';
    } catch {
      return false;
    }
  });

  // Listen for navigation pinned state changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const pinned = localStorage.getItem('navigationMenuPinned') === 'true';
        setIsNavigationPinned(pinned);
      } catch {
        // Ignore errors
      }
    };
    
    const interval = setInterval(handleStorageChange, 200);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  const menuContentRef = React.useRef<HTMLDivElement>(null);
  const mobileSearchRef = React.useRef<HTMLInputElement>(null);
  const desktopSearchRef = React.useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isMaxOpen, setMaxOpen } = useMaxDock();
  const { aiTheme, getThemeClasses } = useAITheme();
  const { recentPages, clearRecentPages, togglePinPage, addRecentPage } = useNavigation();
  const { startTour } = useTour();
  const { resolvedTheme } = useTheme();

  // Prevent body scroll when menu is open to fix double scroll bar issue
  useEffect(() => {
    if (menuOpen) {
      // Store original body overflow style
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [menuOpen]);

  // Auto-select search text when menu opens
  useEffect(() => {
    if (menuOpen) {
      // Use a small delay to ensure the menu has opened
      const timer = setTimeout(() => {
        // Focus and select text in the appropriate search input
        if (window.innerWidth < 640 && mobileSearchRef.current) {
          mobileSearchRef.current.focus();
          mobileSearchRef.current.select();
        } else if (desktopSearchRef.current) {
          desktopSearchRef.current.focus();
          desktopSearchRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [menuOpen]);

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
    gcTime: 0  // Don't cache (using gcTime instead of deprecated cacheTime)
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
    // Don't allow collapsing Recent & Favorites - keep it always expanded
    if (categoryTitle === "Recent & Favorites") return;
    
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
      
      // Skip permission check for common menu items that should always be visible
      const alwaysVisibleItems = ['SMART KPI Tracking', 'Max AI Assistant', 'Getting Started', 'Take a Guided Tour'];
      if (alwaysVisibleItems.includes(feature.label)) {
        return true;
      }
      
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
    const groups = featureGroups.map(group => ({
      ...group,
      features: getVisibleFeatures(group.features)
    })).filter(group => group.features.length > 0);
    
    // Add Recent & Favorites group at the beginning when not searching and there are recent pages
    if (!searchFilter.trim() && recentPages.length > 0) {
      const recentGroup = {
        title: "Recent & Favorites",
        priority: "high" as const,
        color: "gray" as const,
        bgColor: "bg-gray-50 dark:bg-gray-950/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        features: recentPages.map((page, index) => {
          // Map page paths to their original icons and colors
          const getIconAndColorForPage = (path: string) => {
            // Find the icon and color from the feature groups
            for (const group of featureGroups) {
              const feature = group.features.find(f => f.href === path);
              if (feature) {
                return { 
                  icon: feature.icon, 
                  color: feature.color || "bg-gray-500", 
                  isAI: (feature as any).isAI || false 
                };
              }
            }
            // Default fallback
            return { icon: FileText, color: "bg-gray-500", isAI: false };
          };
          
          const { icon, color, isAI } = getIconAndColorForPage(page.path);
          
          return {
            label: page.label,
            href: page.path === "#max" ? "#" : page.path,
            icon: icon,
            color: color,
            isAI: isAI,
            isPinned: page.isPinned,
            onClick: () => {
              if (page.path === "#max") {
                toggleMaxAI();
              }
              setMenuOpen(false);
            }
          };
        })
      };
      
      groups.unshift(recentGroup);
    }
    
    return groups;
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
          groupColor: group.color || 'gray'
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
    // Handle recent pages features specially
    if (feature.onClick) {
      feature.onClick();
      return;
    }
    if (feature.href === "#max") {
      // Add Max AI to recent pages
      addRecentPage("#max", "Max AI Assistant", "Bot");
      toggleMaxAI();
    } else if (feature.href === "#tour") {
      // Open tour selection dialog to let user choose which tour to take
      setTourSelectionOpen(true);
    } else {
      // For all regular menu items, add them to recent pages and navigate
      addRecentPage(feature.href, feature.label, feature.icon?.name || 'FileText');
      handleNavigation(feature.href, feature.label);
    }
    setMenuOpen(false);
  };

  // Get density from context
  const { density } = useLayoutDensity();

  // Compact card sizes for 3-column layout without scrolling - now respects density
  const getCardSize = (priority: string) => {
    // Adjust sizes based on density
    if (density === 'compact') {
      switch (priority) {
        case "high":
          return "w-full min-h-[50px] h-[50px] sm:min-h-[55px] sm:h-[55px] md:min-h-[60px] md:h-[60px]";
        case "medium":
          return "w-full min-h-[45px] h-[45px] sm:min-h-[50px] sm:h-[50px] md:min-h-[55px] md:h-[55px]";
        default:
          return "w-full min-h-[40px] h-[40px] sm:min-h-[45px] sm:h-[45px] md:min-h-[50px] md:h-[50px]";
      }
    } else if (density === 'compressed') {
      switch (priority) {
        case "high":
          return "w-full min-h-[45px] h-[45px] sm:min-h-[50px] sm:h-[50px] md:min-h-[55px] md:h-[55px]";
        case "medium":
          return "w-full min-h-[40px] h-[40px] sm:min-h-[45px] sm:h-[45px] md:min-h-[50px] md:h-[50px]";
        default:
          return "w-full min-h-[35px] h-[35px] sm:min-h-[40px] sm:h-[40px] md:min-h-[45px] md:h-[45px]";
      }
    } else if (density === 'comfortable') {
      switch (priority) {
        case "high":
          return "w-full min-h-[70px] h-[70px] sm:min-h-[75px] sm:h-[75px] md:min-h-[80px] md:h-[80px]";
        case "medium":
          return "w-full min-h-[65px] h-[65px] sm:min-h-[70px] sm:h-[70px] md:min-h-[75px] md:h-[75px]";
        default:
          return "w-full min-h-[60px] h-[60px] sm:min-h-[65px] sm:h-[65px] md:min-h-[70px] md:h-[70px]";
      }
    } else { // standard
      switch (priority) {
        case "high":
          return "w-full min-h-[60px] h-[60px] sm:min-h-[65px] sm:h-[65px] md:min-h-[70px] md:h-[70px]";
        case "medium":
          return "w-full min-h-[55px] h-[55px] sm:min-h-[60px] sm:h-[60px] md:min-h-[65px] md:h-[65px]";
        default:
          return "w-full min-h-[50px] h-[50px] sm:min-h-[55px] sm:h-[55px] md:min-h-[60px] md:h-[60px]";
      }
    }
  };

  const getIconSize = (priority: string) => {
    // Adjust icon sizes based on density
    if (density === 'compact' || density === 'compressed') {
      switch (priority) {
        case "high":
          return "w-3.5 h-3.5";
        case "medium":
          return "w-3 h-3";
        default:
          return "w-2.5 h-2.5";
      }
    } else if (density === 'comfortable') {
      switch (priority) {
        case "high":
          return "w-5 h-5";
        case "medium":
          return "w-4.5 h-4.5";
        default:
          return "w-4 h-4";
      }
    } else { // standard
      switch (priority) {
        case "high":
          return "w-4 h-4";
        case "medium":
          return "w-3.5 h-3.5";
        default:
          return "w-3 h-3";
      }
    }
  };

  const getTextSize = (priority: string) => {
    // Adjust text sizes based on density
    if (density === 'compact' || density === 'compressed') {
      switch (priority) {
        case "high":
          return "text-[10px] font-semibold";
        case "medium":
          return "text-[9px] font-medium";
        default:
          return "text-[9px] font-normal";
      }
    } else if (density === 'comfortable') {
      switch (priority) {
        case "high":
          return "text-[12px] font-semibold";
        case "medium":
          return "text-[11px] font-medium";
        default:
          return "text-[11px] font-normal";
      }
    } else { // standard
      switch (priority) {
        case "high":
          return "text-[11px] font-semibold";
        case "medium":
          return "text-[10px] font-medium";
        default:
          return "text-[10px] font-normal";
      }
    }
  };

  const { currentView } = useViewMode();
  
  // Check if we're viewing on mobile (based on viewport width)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Show footer on mobile viewport (less than 480px) or on specific mobile pages
  // BUT NOT when we're using MobileLayout component (which handles its own navigation)
  const isMobilePage = location === '/mobile-home' || location === '/mobile' || location.startsWith('/widgets/') || location.startsWith('/dashboards/');
  const isMobileViewport = windowWidth < 480;
  
  // Don't render mobile navigation if we're on routes that use MobileLayout
  const mobileLayoutRoutes = ['/mobile-home', '/mobile'];
  const shouldUseMobileLayout = mobileLayoutRoutes.some(route => location.includes(route)) || (isMobileViewport && location === '/');
  
  // Skip mobile navigation rendering if MobileLayout should handle it
  if (shouldUseMobileLayout) {
    return null;
  }
  
  // Always show on mobile viewport or mobile pages (but only if MobileLayout isn't handling it)
  if (isMobileViewport || isMobilePage) {
    return (
      <>
        {/* Mobile Bottom Navigation Bar - Always visible on mobile pages */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg w-full h-14" style={{ position: 'relative', zIndex: 2147483647 }}>
          <div className="flex items-center justify-around px-2 py-2">
            {/* Home Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/mobile-home', 'Home')}
              className="flex flex-col items-center gap-1 p-2 h-auto"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px]">Home</span>
            </Button>
            
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🔧 Mobile menu button clicked, toggling menu');
                setMenuOpen(!menuOpen);
              }}
              className="flex flex-col items-center gap-1 p-2 h-auto"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="text-[10px]">Menu</span>
            </Button>
            
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="flex flex-col items-center gap-1 p-2 h-auto"
            >
              <Search className="h-5 w-5" />
              <span className="text-[10px]">Search</span>
            </Button>
            
            {/* Recent/History Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/mobile-home', 'Home')}
              className="flex flex-col items-center gap-1 p-2 h-auto"
            >
              <History className="h-5 w-5" />
              <span className="text-[10px]">Recent</span>
            </Button>
            
            {/* Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserProfileOpen(true)}
              className="flex flex-col items-center gap-1 p-2 h-auto"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px]">Profile</span>
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Default return for non-mobile pages
  return (
    <>
      {/* Full Screen Dropdown Menu - Show on all views */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 overflow-hidden"
          style={{ 
            zIndex: 2147483645,
            touchAction: 'none',
            // Prevent body scroll when menu is open
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onTouchStart={(e) => {
            // Only prevent touch events to stop background scrolling
            if (e.type === 'touchstart') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            // Prevent background scrolling when touching outside menu content
            if (e.type === 'touchmove') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchEnd={(e) => {
            if (e.type === 'touchend') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <div 
            className="hamburger-menu-container bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-2xl h-full flex flex-col"
            style={{ 
              zIndex: 2147483645,
              touchAction: 'pan-y' 
            }}
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
            {/* Menu Header with Logo and Controls - Fixed header, minimal height */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex-shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                  <img 
                    src={companyLogo}
                    alt="PlanetTogether"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-bold text-lg text-gray-900 dark:text-white">PlanetTogether</span>
                </div>
                {/* Close Menu Button - Red X in top left */}
                <Button
                  onClick={() => {
                    console.log("Close menu button clicked");
                    setMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white border-red-400 dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-500 shadow-md border transition-all duration-200"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* Moved buttons from right side - MobileViewToggle and Logout - borders removed */}
                <div className="flex items-center space-x-1">
                  <MobileViewToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("Logout button clicked");
                      logout();
                    }}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* User Profile Section */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    {/* Navigation toggle moved to CustomizableHeader */}
                    
                    <AssignedRoleSwitcher userId={user?.id || 0} currentRole={currentRoleForSwitcher} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="hidden md:block text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md px-2 py-1 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('🎯 Name clicked! Opening profile dialog...', { userProfileOpen });
                        setTimeout(() => {
                          setUserProfileOpen(true);
                          console.log('After setting userProfileOpen to true');
                        }, 0);
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.firstName || user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(currentRole as any)?.name || (user?.username === 'admin' ? 'Administrator' : 'No Role')}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserProfileDialog 
                        open={userProfileOpen}
                        onOpenChange={(newOpen) => {
                          console.log('UserProfileDialog onOpenChange called with:', newOpen);
                          setUserProfileOpen(newOpen);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed search section - not scrollable */}
            {/* Mobile-only search */}
            <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-25 dark:bg-gray-800">
              <div className="flex items-center justify-between space-x-3">
                {/* Search on the left */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    ref={mobileSearchRef}
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
                  {/* Navigation toggle - desktop only and when nav panel handler exists */}
                  {onToggleNavPanel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleNavPanel}
                      className="p-2 h-8 w-8 hover:bg-muted hidden sm:flex"
                      title={isNavPanelOpen ? "Close navigation menu" : "Open navigation menu"}
                    >
                      {isNavPanelOpen ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Menu className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
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
                    ref={desktopSearchRef}
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

            {/* Scrollable content area containing menu items only */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <div ref={menuContentRef} className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {getSearchResults().map((item, index) => (
                      <div 
                        key={`search-${index}`}
                        onClick={() => handleFeatureClick(item.feature)}
                      >
                        <div className={`
                          w-full min-h-[70px] h-[70px] sm:min-h-[80px] sm:h-[80px] 
                          border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 
                          hover:shadow-md rounded-xl p-2 sm:p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                          flex flex-col items-center justify-center text-center space-y-1
                          ${location === item.feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'}
                          ${item.feature.isAI ? 'border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' : ''}
                        `}>
                          <item.feature.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${item.feature.isAI ? 'text-purple-600' : item.feature.color?.replace('bg-', 'text-').replace('-500', '-600') || 'text-gray-600'}`} strokeWidth={1.5} fill="none" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-800 dark:text-white leading-tight text-center line-clamp-2 overflow-hidden flex-shrink-0">
                              {item.feature.label}
                            </span>
                            <span className={`text-[9px] sm:text-xs ${
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
                      </div>
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
              
              {/* Unified scrollable layout - Recent Pages and all categories in one container */}
              {!searchFilter.trim() && (
                <div className="space-y-3">
                  {getVisibleGroups().map((group, groupIndex) => {
                    const isExpanded = expandedCategories.has(group.title) || group.title === "Recent & Favorites";
                    const Icon = isExpanded ? ChevronDown : ChevronRight;
                    const isRecentGroup = group.title === "Recent & Favorites";
                    
                    return (
                      <div key={groupIndex} className={`
                        ${isRecentGroup ? 
                          'bg-transparent border-0 shadow-none' : 
                          `${getDarkModeColor(group.bgColor || 'bg-gray-50 dark:bg-gray-950/20', (group.bgColor || 'bg-gray-50 dark:bg-gray-950/20').replace('-50', '-950/20').replace('dark:', ''))} rounded-xl border ${getDarkModeBorder(group.borderColor || 'border-gray-200 dark:border-gray-800', (group.borderColor || 'border-gray-200 dark:border-gray-800').replace('-200', '-800').replace('dark:', ''))} overflow-hidden shadow-sm`
                        }
                        ${isRecentGroup ? 'mb-4' : ''}
                      `}>
                        <div 
                          className={`${isRecentGroup ? 'p-0' : 'p-4 cursor-pointer hover:bg-opacity-70 transition-colors'}`}
                          onClick={() => !isRecentGroup && toggleCategory(group.title)}
                        >
                          {isRecentGroup ? (
                            <div className="flex items-center justify-between mb-3">
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
                          ) : (
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
                                  const bgColor = colorMap[group.color || 'gray'] || 'bg-gray-500 dark:bg-gray-600';
                                  
                                  return (
                                    <>
                                      {FirstIcon && <FirstIcon className={`w-5 h-5 flex-shrink-0 ${bgColor.replace('bg-', 'text-').replace('-500', '-600')}`} strokeWidth={1.5} />}
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
                          )}
                        </div>
                        
                        {isExpanded && (
                          <div className={`${isRecentGroup ? 'border-0 p-0' : 'border-t border-gray-200 dark:border-gray-700 p-3 bg-opacity-50 dark:bg-opacity-100'}`}
                            style={!isRecentGroup ? { 
                              backgroundColor: resolvedTheme === 'dark' ? 'rgb(55, 65, 81)' : 'rgba(243, 244, 246, 0.5)'
                            } : {}}>
                            <div className={`${isRecentGroup ? 'grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3' : 'grid grid-cols-2 gap-2'}`}>
                              {group.features.map((feature, featureIndex) => (
                                <div 
                                  key={featureIndex} 
                                  onClick={() => handleFeatureClick(feature)}
                                  className="relative group"
                                >
                                  <div className={`
                                    h-[50px] border hover:shadow-sm
                                    rounded-lg p-2 cursor-pointer transition-all duration-150
                                    flex items-center space-x-2
                                    ${location === feature.href ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-700/40' : 
                                      feature.isPinned ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-700/40 dark:border-emerald-400' :
                                      'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'}
                                    ${feature.isAI ? 'border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-700/30 dark:to-pink-700/30' : ''}
                                  `}>
                                    <feature.icon className={`w-3 h-3 flex-shrink-0 ${feature.isAI ? 'text-purple-600' : feature.color?.replace('bg-', 'text-').replace('-500', '-600') || 'text-gray-600'}`} strokeWidth={1.5} fill="none" />
                                    <span className="text-xs text-gray-700 dark:text-white leading-tight line-clamp-2 overflow-hidden flex-1">
                                      {feature.label}
                                    </span>
                                    {group.title === "Recent & Favorites" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          togglePinPage(feature.href);
                                        }}
                                        className={`
                                          h-3 w-3 p-0 transition-all opacity-0 group-hover:opacity-100
                                          ${feature.isPinned ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}
                                        `}
                                        title={feature.isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
                                      >
                                        {feature.isPinned ? <Pin className="h-2 w-2" strokeWidth={2} /> : <PinOff className="h-2 w-2" strokeWidth={1} />}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>{/* End of scrollable content area */}
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
      
      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      
      {/* User Profile Dialog */}
      <UserProfileDialog
        open={userProfileOpen}
        onOpenChange={setUserProfileOpen}
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
      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
      title="Switch to Mobile View"
    >
      <Smartphone className="h-4 w-4" />
    </Button>
  );
}