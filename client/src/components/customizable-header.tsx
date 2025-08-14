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
import { useFullScreen } from '@/contexts/FullScreenContext';
import { UserProfileDialog } from './user-profile';
import { ThemeToggle } from './theme-toggle';
import { GlobalSearchDialog } from './global-search-dialog';
import { AssignedRoleSwitcher } from './assigned-role-switcher';
import WidgetModal from './widget-modal';
import WidgetFlyout from './widget-flyout';
import {
  Settings, User, LogOut, Search, Bell, Home, Calendar, BarChart3,
  Package, Factory, TrendingUp, Plus, X, GripVertical, Edit2,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle, ChevronDown,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase, Maximize, Minimize
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import companyLogo from '@/assets/company-logo.png';
import { getAvailableWidgets, type WidgetMetadata } from '@/lib/widget-registry';

// Icon mapping for quick access items
const iconMap = {
  Home, Calendar, BarChart3, Package, Factory, TrendingUp,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase,
  Search, Bell, Settings, User, Maximize, Minimize
};

// Default header items by role
const defaultHeaderItemsByRole = {
  'Administrator': [
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
    { id: 'systems', label: 'Systems', icon: 'Database', href: '/systems-management-dashboard' },
    { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications' },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Production Manager': [
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule' },
    { id: 'shop-floor', label: 'Shop Floor', icon: 'Factory', href: '/shop-floor' },
    { id: 'capacity', label: 'Capacity', icon: 'Briefcase', href: '/capacity-planning' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Plant Manager': [
    { id: 'kpi', label: 'KPIs', icon: 'TrendingUp', href: '/smart-kpi-tracking' },
    { id: 'optimization', label: 'Optimize', icon: 'Sparkles', href: '/optimization-studio' },
    { id: 'business-goals', label: 'Goals', icon: 'Target', href: '/business-goals' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Operator': [
    { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule' },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat' },
    { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Quality Manager': [
    { id: 'quality', label: 'Quality', icon: 'Shield', href: '/quality-control' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ]
};

// Generate available items including widgets
const generateAvailableItems = (): HeaderItem[] => {
  // Base navigation items
  const baseItems: HeaderItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', type: 'page' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule', type: 'page' },
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
    { id: 'enterprise-map', label: 'Map', icon: 'Globe', href: '/enterprise-map', type: 'page' },
    { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management', type: 'page' },
    { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard', type: 'page' },
    { id: 'demand', label: 'Demand', icon: 'Brain', href: '/demand-planning', type: 'page' },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat', type: 'page' },
    { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help', type: 'page' },
    { id: 'max-ai', label: 'Max AI', icon: 'Bot', action: 'max-ai', type: 'action' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', type: 'action' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications', type: 'action' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts', type: 'action' },
  ];

  // Add widgets as header items
  const widgetItems: HeaderItem[] = getAvailableWidgets('desktop').map(({ type, metadata }) => ({
    id: `widget-${type}`,
    label: metadata.displayName,
    icon: getWidgetIcon(type),
    widget: type,
    type: 'widget' as const
  }));

  return [...baseItems, ...widgetItems];
};

// Map widget types to appropriate icons
const getWidgetIcon = (widgetType: string): string => {
  const iconMap: Record<string, string> = {
    'operation-sequencer': 'Factory',
    'custom-kpi': 'TrendingUp',
    'atp-ctp': 'Calendar',
    'sales-order-status': 'Package',
    'reports': 'BarChart3',
    'schedule-tradeoff-analyzer': 'TrendingUp',
    'schedule-optimizer': 'Sparkles',
    'production-order-status': 'Clock',
    'operation-dispatch': 'Target',
    'resource-assignment': 'Briefcase',
    'production-metrics': 'BarChart3',
    'equipment-status': 'Settings',
    'quality-dashboard': 'Shield',
    'inventory-tracking': 'Package',
    'gantt-chart': 'Calendar',
    'gantt-widget': 'Calendar',
    'filter-search': 'Search',
    'status-indicator': 'AlertTriangle',
    'metrics-card': 'TrendingUp',
    'data-table': 'Database',
    'action-buttons': 'Plus',
    'kanban-card': 'Package'
  };
  return iconMap[widgetType] || 'HelpCircle';
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
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [widgetFlyoutOpen, setWidgetFlyoutOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<{ type: string; title: string } | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);
  const [headerItems, setHeaderItems] = useState<HeaderItem[]>([]);
  const [tempHeaderItems, setTempHeaderItems] = useState<HeaderItem[]>([]);
  const { addRecentPage } = useNavigation();

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
    if (preferences?.dashboardLayout?.headerItems) {
      setHeaderItems(preferences.dashboardLayout.headerItems);
    } else {
      // Load defaults based on role
      const roleName = currentRole?.name || 'Operator';
      const defaultItems = defaultHeaderItemsByRole[roleName] || defaultHeaderItemsByRole['Operator'];
      setHeaderItems(defaultItems);
    }
  }, [preferences, currentRole]);

  // Save header configuration
  const saveHeaderMutation = useMutation({
    mutationFn: async (items: HeaderItem[]) => {
      const updatedPreferences = {
        ...preferences,
        dashboardLayout: {
          ...preferences?.dashboardLayout,
          headerItems: items
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

  // Handle drag end for reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tempHeaderItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTempHeaderItems(items);
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
    saveHeaderMutation.mutate(tempHeaderItems);
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
        case 'profile':
          setUserProfileOpen(true);
          break;
        case 'theme':
          // Theme toggle is handled by the component itself
          break;
        case 'notifications':
        case 'alerts':
          toast({
            title: "Coming soon",
            description: `${item.label} feature will be available soon.`
          });
          break;
        case 'max-ai':
          // Toggle Max AI dock
          const event = new CustomEvent('toggle-max-ai');
          document.dispatchEvent(event);
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
        <span className="hidden lg:inline text-sm">{item.label}</span>
      </Button>
    );
  };

  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b bg-background",
        className
      )}>
        {/* Left side - Logo and main nav items */}
        <div className="flex items-center gap-2">
          {/* Logo/Home */}
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 px-3 py-2 h-9"
          >
            <img src={companyLogo} alt="PlanetTogether" className="h-6 w-6 object-contain" />
            <span className="hidden lg:inline font-semibold">PlanetTogether</span>
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-2" />

          {/* Header items */}
          <div className="flex items-center gap-1">
            {headerItems.filter(item => !['profile', 'theme'].includes(item.id)).map(renderHeaderItem)}
          </div>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center gap-2">
          {/* Customize button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempHeaderItems([...headerItems]);
              setCustomizeOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 h-9"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden lg:inline text-sm">Customize</span>
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
            <span className="hidden lg:inline text-sm">
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </Button>

          {/* Theme and Profile (always visible) */}
          {headerItems.filter(item => ['profile', 'theme'].includes(item.id)).map(renderHeaderItem)}

          {/* Role switcher */}
          <AssignedRoleSwitcher 
            userId={user?.id || 0} 
            currentRole={currentRole ? {
              id: currentRole.id || '',
              name: currentRole.name || '',
              description: currentRole.description || ''
            } : null}
          />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm">{user?.firstName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setUserProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/account')}>
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
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Customize Header</DialogTitle>
            <DialogDescription>
              Add, remove, and reorder header items to suit your workflow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Current header items */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Current Header Items</Label>
              <ScrollArea className="h-[400px] border rounded-md p-3">
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
              <ScrollArea className="h-[400px] border rounded-md p-3">
                <div className="space-y-4">
                  {/* Pages Section */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Pages</Label>
                    <div className="space-y-2">
                      {availableItems
                        .filter(item => item.type === 'page' && !tempHeaderItems.find(i => i.id === item.id))
                        .map(item => {
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
                        .map(item => {
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
                        .map(item => {
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

          <DialogFooter>
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