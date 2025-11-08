import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Settings, User, ChevronDown, Building2, Calendar, Command, Sun, Moon, Monitor, Maximize2, Minimize2, MoreVertical, Rows3, Rows4, Rows2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useThemeFederated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useFullScreen } from '@/contexts/FullScreenContext';
import { useLayoutDensity } from '@/contexts/LayoutDensityContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export function DesktopTopBar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('production');
  const [selectedPlants, setSelectedPlants] = useState<string[]>(['plant-1']);
  const [dateHorizon, setDateHorizon] = useState('30-days');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { density, setDensity } = useLayoutDensity();

  // Workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>({
    id: '1',
    name: 'Production',
    description: 'Manufacturing Operations',
    icon: '🏭',
    isActive: true
  });

  const workspaces: Workspace[] = [
    { id: '1', name: 'Production', description: 'Manufacturing Operations', icon: '🏭' },
    { id: '2', name: 'Engineering', description: 'Product Development', icon: '⚙️' },
    { id: '3', name: 'Quality', description: 'Quality Control', icon: '✅' },
    { id: '4', name: 'Logistics', description: 'Supply Chain', icon: '📦' },
    { id: '5', name: 'Finance', description: 'Financial Planning', icon: '💰' }
  ];

  const switchWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    console.log('Switching to workspace:', workspace.name);
  };

  // Fetch plants data
  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
    queryFn: async () => {
      const response = await fetch('/api/plants');
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Command palette keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const scenarios = [
    { value: 'production', label: 'Production' },
    { value: 'planning', label: 'Planning' },
    { value: 'simulation-1', label: 'Simulation 1' },
    { value: 'simulation-2', label: 'Simulation 2' },
    { value: 'what-if', label: 'What-If Analysis' },
  ];

  const dateHorizons = [
    { value: '7-days', label: '7 Days' },
    { value: '14-days', label: '14 Days' },
    { value: '30-days', label: '30 Days' },
    { value: '60-days', label: '60 Days' },
    { value: '90-days', label: '90 Days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const availablePlants = [
    { id: 'plant-1', name: 'Main Factory', location: 'Detroit, MI' },
    { id: 'plant-2', name: 'West Coast Facility', location: 'Los Angeles, CA' },
    { id: 'plant-3', name: 'Southern Plant', location: 'Houston, TX' },
    { id: 'plant-4', name: 'Eastern Hub', location: 'Newark, NJ' },
  ];

  const commandItems = [
    { label: 'Production Schedule', action: () => setLocation('/production-schedule-simple') },
    { label: 'Inventory Management', action: () => setLocation('/inventory') },
    { label: 'Quality Control', action: () => setLocation('/quality') },
    { label: 'Master Data', action: () => setLocation('/master-data') },
    { label: 'Reports', action: () => setLocation('/reports') },
    { label: 'Settings', action: () => setLocation('/settings') },
    { label: 'Create New Order', action: () => setLocation('/orders/new') },
    { label: 'View Notifications', action: () => document.dispatchEvent(new CustomEvent('toggle-bottom-drawer')) },
  ];

  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  return (
    <div className="h-14 bg-background border-b flex items-center px-4 gap-3 sticky top-0 z-50">
      {/* Workspace Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[140px] justify-between"
          >
            <div className="flex items-center min-w-0">
              <span className="text-lg mr-2">{activeWorkspace.icon}</span>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate">{activeWorkspace.name}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Switch Workspace</p>
            <p className="text-xs text-muted-foreground">Select active workspace</p>
          </div>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace)}
              className={workspace.id === activeWorkspace.id ? "bg-accent" : ""}
            >
              <span className="mr-2">{workspace.icon}</span>
              <div className="flex-1">
                <p className="text-sm">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">{workspace.description}</p>
              </div>
              {workspace.id === activeWorkspace.id && (
                <Badge variant="secondary" className="ml-2">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Back/Forward Navigation */}
      <div className="flex items-center gap-1 border-r pr-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-9 w-9"
                data-testid="button-navigate-back"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Go back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleForward}
                className="h-9 w-9"
                data-testid="button-navigate-forward"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Go forward</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Global Search / Command Palette */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="w-3 h-3" />K
          </kbd>
        </Button>
      </div>

      {/* Only show filters when not in full screen */}
      {!isFullScreen && (
        <>
          {/* Scenario Switcher */}
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map(scenario => (
                <SelectItem key={scenario.value} value={scenario.value}>
                  {scenario.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Plant Filter (Multi-select) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px]">
                <Building2 className="w-4 h-4 mr-2" />
                Plants ({selectedPlants.length})
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[250px]">
              <DropdownMenuLabel>Select Plants</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availablePlants.map(plant => (
                <DropdownMenuCheckboxItem
                  key={plant.id}
                  checked={selectedPlants.includes(plant.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlants([...selectedPlants, plant.id]);
                    } else {
                      setSelectedPlants(selectedPlants.filter(p => p !== plant.id));
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <span>{plant.name}</span>
                    <span className="text-xs text-muted-foreground">{plant.location}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Horizon Selector */}
          <Select value={dateHorizon} onValueChange={setDateHorizon}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {dateHorizons.map(horizon => (
                <SelectItem key={horizon.value} value={horizon.value}>
                  {horizon.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />


      {/* Layout Density Control */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            {density === 'compressed' ? (
              <Rows2 className="h-4 w-4" />
            ) : density === 'comfortable' ? (
              <Rows4 className="h-4 w-4" />
            ) : (
              <Rows3 className="h-4 w-4" />
            )}
            <span className="sr-only">Layout density</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Layout Density</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDensity('compressed')}>
            <Rows2 className="mr-2 h-4 w-4" />
            <span>Compressed</span>
            {density === 'compressed' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDensity('standard')}>
            <Rows3 className="mr-2 h-4 w-4" />
            <span>Standard</span>
            {density === 'standard' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDensity('comfortable')}>
            <Rows4 className="mr-2 h-4 w-4" />
            <span>Comfortable</span>
            {density === 'comfortable' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            {resolvedTheme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile/Settings */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full p-0 w-9 h-9">
              <Avatar className="w-9 h-9 border-2 border-muted-foreground/20">
                <AvatarImage src={(user as any)?.avatar || undefined} />
                <AvatarFallback className="text-xs bg-muted border border-border">
                  {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.firstName} {user.lastName}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-full p-0 w-9 h-9 flex items-center justify-center">
                <Avatar className="w-9 h-9 border-2 border-muted-foreground/20 animate-pulse">
                  <AvatarFallback className="text-xs bg-muted border border-border">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Loading user...</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Command Palette Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            {commandItems.map((item, index) => (
              <CommandItem
                key={index}
                onSelect={() => {
                  item.action();
                  setCommandOpen(false);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}