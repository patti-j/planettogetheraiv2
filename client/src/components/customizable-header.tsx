import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { useLayoutDensity } from '@/contexts/LayoutDensityContext';
import { UserProfileDialog } from './user-profile';
import { ThemeToggle } from './theme-toggle';
import { GlobalSearchDialog } from './global-search-dialog';
import { AssignedRoleSwitcher } from './assigned-role-switcher';
import { WorkspaceSwitcher } from './workspace-switcher';
// Widget components
import { WidgetFlyout } from './widget-flyout';
import { WidgetModal } from './widget-modal';


import {
  Settings, User, LogOut, Search, Bell, Home, Calendar, BarChart3,
  Package, Factory, TrendingUp, Plus, X, GripVertical, Edit2,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle, ChevronDown,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase, Maximize, Minimize, Building2,
  MoreHorizontal, Minus, Equal, Layout, Menu, SplitSquareHorizontal, SplitSquareVertical, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import companyLogo from '@/assets/planet-together-logo.png';


// Icon mapping for quick access items
const iconMap = {
  Home, Calendar, BarChart3, Package, Factory, TrendingUp,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase,
  Search, Bell, Settings, User, Maximize, Minimize, Building2
};

// Default header items by role
const defaultHeaderItemsByRole = {
  'Administrator': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
    { id: 'systems', label: 'Systems', icon: 'Database', href: '/systems-management-dashboard' },
    { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications' },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Production Manager': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-scheduler' },
    { id: 'shop-floor', label: 'Shop Floor', icon: 'Factory', href: '/shop-floor' },
    { id: 'capacity', label: 'Capacity', icon: 'Briefcase', href: '/capacity-planning' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Plant Manager': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'kpi', label: 'KPIs', icon: 'TrendingUp', href: '/smart-kpi-tracking' },
    { id: 'optimization', label: 'Optimize', icon: 'Sparkles', href: '/optimization-studio' },
    { id: 'business-goals', label: 'Goals', icon: 'Target', href: '/business-goals' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Operator': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-scheduler' },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat' },
    { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Quality Manager': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'quality', label: 'Quality', icon: 'Shield', href: '/quality-control' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Maintenance Manager': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'maintenance', label: 'Maintenance', icon: 'Settings', href: '/maintenance' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ],
  'Supply Chain Manager': [
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', alwaysVisible: true },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', alwaysVisible: true },
    { id: 'inventory', label: 'Inventory', icon: 'Package', href: '/inventory-optimization' },
    { id: 'demand', label: 'Demand', icon: 'Brain', href: '/demand-planning' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true }
  ]
};

// Generate available items including widgets
const generateAvailableItems = (): HeaderItem[] => {
  // Base navigation items
  const baseItems: HeaderItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', type: 'page' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-scheduler', type: 'page' },
    { id: 'shop-floor', label: 'Shop Floor', icon: 'Factory', href: '/shop-floor', type: 'page' },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics', type: 'page' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports', type: 'page' },
    { id: 'capacity', label: 'Capacity', icon: 'Briefcase', href: '/capacity-planning', type: 'page' },
    { id: 'inventory', label: 'Inventory', icon: 'Package', href: '/inventory-optimization', type: 'page' },
    { id: 'quality', label: 'Quality', icon: 'Shield', href: '/quality-control', type: 'page' },
    { id: 'optimization', label: 'Optimize', icon: 'Sparkles', href: '/optimization-studio', type: 'page' },
    { id: 'kpi', label: 'KPIs', icon: 'TrendingUp', href: '/smart-kpi-tracking', type: 'page' },
    { id: 'business-goals', label: 'Goals', icon: 'Target', href: '/business-goals', type: 'page' },
    { id: 'systems', label: 'Systems', icon: 'Database', href: '/systems-management-dashboard', type: 'page' },
    { id: 'enterprise-map', label: 'Control Tower', icon: 'Globe', href: '/enterprise-map', type: 'page' },
    { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management', type: 'page' },
    { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard', type: 'page' },
    { id: 'demand', label: 'Demand', icon: 'Brain', href: '/demand-planning', type: 'page' },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat', type: 'page' },
    { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help', type: 'page' },

    { id: 'search', label: 'Search', icon: 'Search', action: 'search', type: 'action' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications', type: 'action' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts', type: 'action' },
    { id: 'workspace-switcher', label: 'Workspace Switcher', icon: 'Building2', action: 'workspace-switcher', type: 'action' },
    { id: 'role-switcher', label: 'Role Switcher', icon: 'User', action: 'role-switcher', type: 'action' },
  ];

  // Widget items with enhanced configuration
  const widgetItems: HeaderItem[] = [
    { 
      id: 'widget-operation-sequencer', 
      label: 'Operation Sequencer', 
      icon: 'Factory', 
      type: 'widget', 
      widget: 'operation-sequencer' 
    },
    { 
      id: 'widget-schedule-optimizer', 
      label: 'Schedule Optimizer', 
      icon: 'Sparkles', 
      type: 'widget', 
      widget: 'schedule-optimizer' 
    },
    { 
      id: 'widget-resource-monitor', 
      label: 'Resource Monitor', 
      icon: 'Target', 
      type: 'widget', 
      widget: 'resource-monitor' 
    },
    { 
      id: 'widget-quality-tracker', 
      label: 'Quality Tracker', 
      icon: 'Shield', 
      type: 'widget', 
      widget: 'quality-tracker' 
    },
    { 
      id: 'widget-inventory-alerts', 
      label: 'Inventory Alerts', 
      icon: 'Package', 
      type: 'widget', 
      widget: 'inventory-alerts' 
    },
    { 
      id: 'widget-performance-kpi', 
      label: 'Performance KPI', 
      icon: 'TrendingUp', 
      type: 'widget', 
      widget: 'performance-kpi' 
    }
  ];

  return [...baseItems, ...widgetItems];
};



const availableItems = generateAvailableItems();

interface HeaderItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: string;
  widget?: string; // Widget type for widget items
  alwaysVisible?: boolean;
  type?: 'page' | 'action' | 'widget'; // Item type for better organization
}

interface CustomizableHeaderProps {
  className?: string;
}

export function CustomizableHeader({ className }: CustomizableHeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const queryClient = useQueryClient();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  const [headerItems, setHeaderItems] = useState<HeaderItem[]>([]);
  const [tempHeaderItems, setTempHeaderItems] = useState<HeaderItem[]>([]);
  const [showHeaderText, setShowHeaderText] = useState<boolean>(true);
  const [tempShowHeaderText, setTempShowHeaderText] = useState<boolean>(true);
  const { density, setDensity } = useLayoutDensity();
  const [uiDensity, setUiDensity] = useState<'compact' | 'compressed' | 'standard' | 'comfortable'>('standard');
  const { addRecentPage } = useNavigation();
  const { splitMode, setSplitMode } = useSplitScreen();

  // Widget state
  const [selectedWidget, setSelectedWidget] = useState<{ type: string; title: string } | null>(null);
  const [widgetFlyoutOpen, setWidgetFlyoutOpen] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);

  // Get user preferences
  const { data: preferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });

  // Get current role
  const { data: currentRoleData } = useQuery({
    queryKey: [`/api/users/${user?.id}/current-role`],
    enabled: !!user?.id,
  });

  const currentRole = currentRoleData || user?.currentRole || 
    (user?.activeRoleId && user?.roles ? 
      user.roles.find(role => role.id === user.activeRoleId) : null);

  // Load header configuration from preferences
  useEffect(() => {
    if ((preferences as any)?.dashboardLayout?.headerItems) {
      setHeaderItems((preferences as any).dashboardLayout.headerItems);
    } else {
      // Load defaults based on role
      const roleName = (currentRole as any)?.name || 'Operator';
      const defaultItems = defaultHeaderItemsByRole[roleName] || defaultHeaderItemsByRole['Operator'];
      setHeaderItems(defaultItems);
    }
    
    // Load header text display setting
    const showText = (preferences as any)?.dashboardLayout?.showHeaderText ?? true;
    setShowHeaderText(showText);
    
    // Load UI density setting
    const prefDensity = (preferences as any)?.dashboardLayout?.uiDensity ?? 'standard';
    setUiDensity(prefDensity);
    // Also sync with context if different
    if (density !== prefDensity) {
      setDensity(prefDensity);
    }
  }, [preferences, currentRole]);

  // Save header configuration
  const saveHeaderMutation = useMutation({
    mutationFn: async ({ items, showText }: { items: HeaderItem[], showText: boolean }) => {
      const updatedPreferences = {
        ...(preferences as any),
        dashboardLayout: {
          ...(preferences as any)?.dashboardLayout,
          headerItems: items,
          showHeaderText: showText
        }
      };
      return apiRequest('PUT', '/api/user-preferences', updatedPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
      toast({
        title: "Header saved",
        description: "Your header configuration has been saved."
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving header",
        description: "Failed to save header configuration. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save UI density
  const saveDensityMutation = useMutation({
    mutationFn: async (density: 'compact' | 'compressed' | 'standard' | 'comfortable') => {
      const updatedPreferences = {
        ...(preferences as any),
        dashboardLayout: {
          ...(preferences as any)?.dashboardLayout,
          uiDensity: density
        }
      };
      return apiRequest('PUT', '/api/user-preferences', updatedPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
    }
  });

  // Handle density change
  const handleDensityChange = (newDensity: 'compact' | 'compressed' | 'standard' | 'comfortable') => {
    // Update both local state and context immediately for instant UI feedback
    setUiDensity(newDensity);
    setDensity(newDensity);
    // Save to database
    saveDensityMutation.mutate(newDensity);
  };

  // Handle drag end for reordering and moving between lists
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Moving within header items (reordering)
    if (source.droppableId === 'header-items' && destination.droppableId === 'header-items') {
      const items = Array.from(tempHeaderItems);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setTempHeaderItems(items);
    }
    // Moving from header items to available items (removing from header)
    else if (source.droppableId === 'header-items' && destination.droppableId === 'available-items') {
      const headerItems = Array.from(tempHeaderItems);
      const [removedItem] = headerItems.splice(source.index, 1);
      setTempHeaderItems(headerItems);
    }
    // Moving from available items to header items (adding to header)
    else if (source.droppableId === 'available-items' && destination.droppableId === 'header-items') {
      // Find the item being dragged from available items
      const draggedItemId = result.draggableId;
      const itemToAdd = availableItems.find(item => item.id === draggedItemId);
      
      if (itemToAdd && !tempHeaderItems.find(item => item.id === itemToAdd.id)) {
        const headerItems = Array.from(tempHeaderItems);
        headerItems.splice(destination.index, 0, itemToAdd);
        setTempHeaderItems(headerItems);
      }
    }
  };

  // Add item to header
  const addHeaderItem = (item: HeaderItem) => {
    if (!tempHeaderItems.find(i => i.id === item.id)) {
      setTempHeaderItems([...tempHeaderItems, item]);
    }
  };

  // Remove item from header
  const removeHeaderItem = (itemId: string) => {
    const item = tempHeaderItems.find(i => i.id === itemId);
    if (!item?.alwaysVisible) {
      setTempHeaderItems(tempHeaderItems.filter(i => i.id !== itemId));
    }
  };

  // Save customizations
  const saveCustomizations = () => {
    setHeaderItems(tempHeaderItems);
    setShowHeaderText(tempShowHeaderText);
    saveHeaderMutation.mutate({ items: tempHeaderItems, showText: tempShowHeaderText });
    setCustomizeOpen(false);
  };

  // Handle item click
  const handleItemClick = (item: HeaderItem, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (item.href) {
      setLocation(item.href);
      if (item.label && item.href !== '/') {
        addRecentPage(item.href, item.label, item.icon);
      }
    } else if (item.widget) {
      // Open widget in flyout panel
      setSelectedWidget({ type: item.widget, title: item.label });
      setFlyoutAnchor(event?.currentTarget || null);
      setWidgetFlyoutOpen(true);
    } else if (item.action) {
      switch (item.action) {
        case 'search':
          setSearchOpen(true);
          break;
        case 'theme':
          // Theme toggle is handled by the component itself
          break;
        case 'notifications':
          toast({
            title: "Coming soon",
            description: `${item.label} feature will be available soon.`
          });
          break;
        case 'alerts':
          setLocation('/alerts');
          addRecentPage('/alerts', 'Alerts & Notifications', 'AlertTriangle');
          break;

        case 'workspace-switcher':
          // Workspace switcher is handled by the component directly
          // No action needed here since it's a dropdown component
          break;
        case 'role-switcher':
          // Role switcher is handled by the component directly
          // No action needed here since it's a dropdown component
          break;
      }
    }
  };

  // Render header item
  const renderHeaderItem = (item: HeaderItem) => {
    const Icon = iconMap[item.icon] || HelpCircle;

    // Special handling for theme toggle
    if (item.action === 'theme') {
      return <ThemeToggle key={item.id} />;
    }

    // Special handling for workspace switcher
    if (item.action === 'workspace-switcher') {
      return (
        <WorkspaceSwitcher 
          key={item.id}
          userId={user?.id || 0}
          variant="header" 
          showIcon={true}
        />
      );
    }

    // Special handling for role switcher
    if (item.action === 'role-switcher') {
      return (
        <AssignedRoleSwitcher 
          key={item.id}
          userId={user?.id || 0}
          variant="compact"
        />
      );
    }



    return (
      <Button
        key={item.id}
        variant="ghost"
        size="sm"
        onClick={(e) => handleItemClick(item, e)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 h-9",
          item.href === location && "bg-accent"
        )}
      >
        <Icon className="h-4 w-4" />
        {showHeaderText && <span className="hidden lg:inline text-sm">{item.label}</span>}
      </Button>
    );
  };

  return (
    <>
      <div className={cn(
        "relative flex items-center px-4 py-2 border-b bg-background",
        className
      )}>
        {/* Fixed left section - Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => setLocation('/home')}
            className="flex items-center gap-2 px-3 py-2 h-9"
          >
            <img src={companyLogo} alt="PlanetTogether" className="h-6 w-6 object-contain" />
            {showHeaderText && <span className="hidden lg:inline font-semibold">PlanetTogether</span>}
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
        </div>

        {/* Scrollable middle section - Navigation items */}
        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <div className="flex items-center gap-1 min-w-max pr-4">
            {headerItems.filter(item => !['theme'].includes(item.id)).map(renderHeaderItem)}
          </div>
        </div>

        {/* Fixed right section - Critical controls always visible */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Split Screen selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 h-9"
                title="Split Screen"
              >
                {splitMode === 'horizontal' && <SplitSquareHorizontal className="h-4 w-4" />}
                {splitMode === 'vertical' && <SplitSquareVertical className="h-4 w-4" />}
                {splitMode === 'none' && <Square className="h-4 w-4" />}
                {showHeaderText && <span className="hidden lg:inline text-sm">
                  {splitMode === 'horizontal' ? 'Side by Side' : 
                   splitMode === 'vertical' ? 'Top/Bottom' : 'Single Page'}
                </span>}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => setSplitMode('none')}
                className={cn("flex items-center gap-2", splitMode === 'none' && "bg-accent")}
              >
                <Square className="h-4 w-4" />
                <span>Single Page</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSplitMode('horizontal')}
                className={cn("flex items-center gap-2", splitMode === 'horizontal' && "bg-accent")}
              >
                <SplitSquareHorizontal className="h-4 w-4" />
                <span>Side by Side</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSplitMode('vertical')}
                className={cn("flex items-center gap-2", splitMode === 'vertical' && "bg-accent")}
              >
                <SplitSquareVertical className="h-4 w-4" />
                <span>Top/Bottom</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* UI Density selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 h-9"
              >
                <Layout className="h-4 w-4" />
                {showHeaderText && <span className="hidden lg:inline text-sm">
                  {uiDensity === 'compact' ? 'Compact' : 
                   uiDensity === 'compressed' ? 'Compressed' : 
                   uiDensity === 'comfortable' ? 'Comfortable' : 'Standard'}
                </span>}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => handleDensityChange('compact')}
                className={cn("flex items-center gap-2", (uiDensity === 'compact' || density === 'compact') && "bg-accent")}
              >
                <Minus className="h-3 w-3" />
                <span>Compact</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDensityChange('compressed')}
                className={cn("flex items-center gap-2", (uiDensity === 'compressed' || density === 'compressed') && "bg-accent")}
              >
                <Minus className="h-4 w-4" />
                <span>Compressed</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDensityChange('standard')}
                className={cn("flex items-center gap-2", (uiDensity === 'standard' || density === 'standard') && "bg-accent")}
              >
                <Equal className="h-4 w-4" />
                <span>Standard</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDensityChange('comfortable')}
                className={cn("flex items-center gap-2", (uiDensity === 'comfortable' || density === 'comfortable') && "bg-accent")}
              >
                <Plus className="h-4 w-4" />
                <span>Comfortable</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Customize button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempHeaderItems([...headerItems]);
              setTempShowHeaderText(showHeaderText);
              setCustomizeOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 h-9"
          >
            <Edit2 className="h-4 w-4" />
            {showHeaderText && <span className="hidden lg:inline text-sm">Customize</span>}
          </Button>

          {/* Fullscreen toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullScreen}
            className="flex items-center gap-2 px-3 py-2 h-9"
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
            {showHeaderText && (
              <span className="hidden lg:inline text-sm">
                {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              </span>
            )}
          </Button>


          {/* Theme (always visible) */}
          {headerItems.filter(item => ['theme'].includes(item.id)).map(renderHeaderItem)}

          {/* Role switcher */}
          <AssignedRoleSwitcher 
            userId={user?.id || 0} 
            currentRole={currentRole ? {
              id: (currentRole as any).id || '',
              name: (currentRole as any).name || '',
              description: (currentRole as any).description || ''
            } : null}
          />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(user as any)?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold border border-border">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {showHeaderText && <span className="hidden lg:inline text-sm">{user?.firstName}</span>}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setUserProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Customization dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Customize Header</DialogTitle>
            <DialogDescription>
              Add, remove, and reorder header items to suit your workflow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-4 flex-1 min-h-0 overflow-hidden">
            {/* Current header items */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Current Header Items</Label>
              <ScrollArea className="h-[300px] border rounded-md p-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="header-items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {tempHeaderItems.map((item, index) => {
                          const Icon = iconMap[item.icon] || HelpCircle;
                          return (
                            <Draggable 
                              key={item.id} 
                              draggableId={item.id} 
                              index={index}
                              isDragDisabled={item.alwaysVisible}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md border bg-card",
                                    snapshot.isDragging && "opacity-50",
                                    item.alwaysVisible && "opacity-75"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className={cn(
                                        "h-4 w-4 text-muted-foreground",
                                        item.alwaysVisible && "opacity-50"
                                      )} />
                                    </div>
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm">{item.label}</span>
                                    {item.alwaysVisible && (
                                      <span className="text-xs text-muted-foreground">(Required)</span>
                                    )}
                                    {item.widget && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Widget</span>
                                    )}
                                  </div>
                                  {!item.alwaysVisible && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeHeaderItem(item.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </ScrollArea>
            </div>

            {/* Available items */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Available Items</Label>
              <ScrollArea className="h-[300px] border rounded-md p-3">
                <div className="space-y-4">
                  {/* Pages Section */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Pages</Label>
                    <div className="space-y-2">
                      {availableItems
                        .filter(item => item.type === 'page' && !tempHeaderItems.find(i => i.id === item.id))
                        .map((item) => {
                          const Icon = iconMap[item.icon] || HelpCircle;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent cursor-pointer"
                              onClick={() => addHeaderItem(item)}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">{item.label}</span>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Widgets Section */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Widgets</Label>
                    <div className="space-y-2">
                      {availableItems
                        .filter(item => item.type === 'widget' && !tempHeaderItems.find(i => i.id === item.id))
                        .map((item) => {
                          const Icon = iconMap[item.icon] || HelpCircle;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent cursor-pointer"
                              onClick={() => addHeaderItem(item)}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">{item.label}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Widget</span>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Actions</Label>
                    <div className="space-y-2">
                      {availableItems
                        .filter(item => item.type === 'action' && !tempHeaderItems.find(i => i.id === item.id))
                        .map((item) => {
                          const Icon = iconMap[item.icon] || HelpCircle;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent cursor-pointer"
                              onClick={() => addHeaderItem(item)}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">{item.label}</span>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Header text display setting */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-header-text" className="text-sm font-medium">
                  Show Text Labels
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display text labels alongside icons in the header
                </p>
              </div>
              <Switch
                id="show-header-text"
                checked={tempShowHeaderText}
                onCheckedChange={setTempShowHeaderText}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomizations}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* User profile dialog */}
      <UserProfileDialog open={userProfileOpen} onOpenChange={setUserProfileOpen} />

      {/* Widget flyout */}
      {selectedWidget && (
        <WidgetFlyout
          isOpen={widgetFlyoutOpen}
          onClose={() => {
            setWidgetFlyoutOpen(false);
            setSelectedWidget(null);
            setFlyoutAnchor(null);
          }}
          onPin={() => {
            // Add widget to widget bar
            toast({
              title: "Widget Pinned",
              description: `${selectedWidget.title} has been added to your widget bar.`
            });
            setWidgetFlyoutOpen(false);
            setSelectedWidget(null);
          }}
          onMaximize={() => {
            // Switch to modal view
            setWidgetFlyoutOpen(false);
            setWidgetModalOpen(true);
          }}
          widgetType={selectedWidget.type}
          widgetTitle={selectedWidget.title}
          position="top-right"
          anchorElement={flyoutAnchor}
        />
      )}

      {/* Widget modal */}
      {selectedWidget && (
        <WidgetModal
          isOpen={widgetModalOpen}
          onClose={() => {
            setWidgetModalOpen(false);
            setSelectedWidget(null);
          }}
          widgetType={selectedWidget.type}
          widgetTitle={selectedWidget.title}
        />
      )}
    </>
  );
}