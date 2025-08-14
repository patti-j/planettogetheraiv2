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
import { UserProfileDialog } from './user-profile';
import { ThemeToggle } from './theme-toggle';
import { GlobalSearchDialog } from './global-search-dialog';
import { AssignedRoleSwitcher } from './assigned-role-switcher';
import {
  Settings, User, LogOut, Search, Bell, Home, Calendar, BarChart3,
  Package, Factory, TrendingUp, Plus, X, GripVertical, Edit2,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle, ChevronDown,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Icon mapping for quick access items
const iconMap = {
  Home, Calendar, BarChart3, Package, Factory, TrendingUp,
  Clock, Target, AlertTriangle, MessageSquare, HelpCircle,
  Bot, Sparkles, Globe, Database, Shield, Brain, Briefcase,
  Search, Bell, Settings, User
};

// Default header items by role
const defaultHeaderItemsByRole = {
  'Administrator': [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', alwaysVisible: true },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
    { id: 'systems', label: 'Systems', icon: 'Database', href: '/systems-management-dashboard' },
    { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications' },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Production Manager': [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', alwaysVisible: true },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule' },
    { id: 'shop-floor', label: 'Shop Floor', icon: 'Factory', href: '/shop-floor' },
    { id: 'capacity', label: 'Capacity', icon: 'Briefcase', href: '/capacity-planning' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Plant Manager': [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', alwaysVisible: true },
    { id: 'kpi', label: 'KPIs', icon: 'TrendingUp', href: '/smart-kpi-tracking' },
    { id: 'optimization', label: 'Optimize', icon: 'Sparkles', href: '/optimization-studio' },
    { id: 'business-goals', label: 'Goals', icon: 'Target', href: '/business-goals' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Operator': [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', alwaysVisible: true },
    { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule' },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat' },
    { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ],
  'Quality Manager': [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/', alwaysVisible: true },
    { id: 'quality', label: 'Quality', icon: 'Shield', href: '/quality-control' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
    { id: 'search', label: 'Search', icon: 'Search', action: 'search', alwaysVisible: true },
    { id: 'theme', label: 'Theme', icon: 'Settings', action: 'theme', alwaysVisible: true },
    { id: 'profile', label: 'Profile', icon: 'User', action: 'profile', alwaysVisible: true }
  ]
};

// Available items to add
const availableItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/' },
  { id: 'schedule', label: 'Schedule', icon: 'Calendar', href: '/production-schedule' },
  { id: 'shop-floor', label: 'Shop Floor', icon: 'Factory', href: '/shop-floor' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', href: '/reports' },
  { id: 'capacity', label: 'Capacity', icon: 'Briefcase', href: '/capacity-planning' },
  { id: 'inventory', label: 'Inventory', icon: 'Package', href: '/inventory-optimization' },
  { id: 'quality', label: 'Quality', icon: 'Shield', href: '/quality-control' },
  { id: 'optimization', label: 'Optimize', icon: 'Sparkles', href: '/optimization-studio' },
  { id: 'kpi', label: 'KPIs', icon: 'TrendingUp', href: '/smart-kpi-tracking' },
  { id: 'business-goals', label: 'Goals', icon: 'Target', href: '/business-goals' },
  { id: 'systems', label: 'Systems', icon: 'Database', href: '/systems-management-dashboard' },
  { id: 'enterprise-map', label: 'Map', icon: 'Globe', href: '/enterprise-map' },
  { id: 'users', label: 'Users', icon: 'Shield', href: '/user-access-management' },
  { id: 'max-ai', label: 'Max AI', icon: 'Bot', action: 'max-ai' },
  { id: 'chat', label: 'Chat', icon: 'MessageSquare', href: '/chat' },
  { id: 'help', label: 'Help', icon: 'HelpCircle', href: '/help' },
  { id: 'operator-dash', label: 'My Tasks', icon: 'Clock', href: '/operator-dashboard' },
  { id: 'demand', label: 'Demand', icon: 'Brain', href: '/demand-planning' },
  { id: 'search', label: 'Search', icon: 'Search', action: 'search' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', action: 'notifications' },
  { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle', action: 'alerts' },
];

interface HeaderItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: string;
  alwaysVisible?: boolean;
}

interface CustomizableHeaderProps {
  className?: string;
}

export function CustomizableHeader({ className }: CustomizableHeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
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
  const handleItemClick = (item: HeaderItem) => {
    if (item.href) {
      setLocation(item.href);
      if (item.label && item.href !== '/') {
        addRecentPage(item.href, item.label, item.icon);
      }
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
        onClick={() => handleItemClick(item)}
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
            <img src="/logo-icon.png" alt="Logo" className="h-6 w-6" />
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
                <div className="space-y-2">
                  {availableItems
                    .filter(item => !tempHeaderItems.find(i => i.id === item.id))
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
    </>
  );
}