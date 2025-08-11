import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Settings, User, ChevronDown, Building2, Calendar, Layers3, Command, Menu, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
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

export function DesktopTopBar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('production');
  const [selectedPlants, setSelectedPlants] = useState<string[]>(['plant-1']);
  const [dateHorizon, setDateHorizon] = useState('30-days');
  const [workspace, setWorkspace] = useState('personal');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

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

  const workspaces = [
    { value: 'personal', label: 'Personal', count: 5 },
    { value: 'team', label: 'Team', count: 12 },
    { value: 'org-templates', label: 'Organization Templates', count: 8 },
  ];

  const availablePlants = [
    { id: 'plant-1', name: 'Main Factory', location: 'Detroit, MI' },
    { id: 'plant-2', name: 'West Coast Facility', location: 'Los Angeles, CA' },
    { id: 'plant-3', name: 'Southern Plant', location: 'Houston, TX' },
    { id: 'plant-4', name: 'Eastern Hub', location: 'Newark, NJ' },
  ];

  const commandItems = [
    { label: 'Production Schedule', action: () => setLocation('/production-schedule') },
    { label: 'Inventory Management', action: () => setLocation('/inventory') },
    { label: 'Quality Control', action: () => setLocation('/quality') },
    { label: 'Master Data', action: () => setLocation('/master-data') },
    { label: 'Reports', action: () => setLocation('/reports') },
    { label: 'Settings', action: () => setLocation('/settings') },
    { label: 'AI Insights', action: () => document.dispatchEvent(new CustomEvent('toggle-ai-panel')) },
    { label: 'Create New Order', action: () => setLocation('/orders/new') },
    { label: 'View Notifications', action: () => document.dispatchEvent(new CustomEvent('toggle-bottom-drawer')) },
  ];

  // Function to toggle main menu
  const toggleMainMenu = () => {
    const event = new CustomEvent('toggle-main-menu');
    document.dispatchEvent(event);
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="h-14 bg-background border-b flex items-center px-4 gap-3 sticky top-0 z-50">
      {/* Hamburger Menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMainMenu}
        className="flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Toggle main menu</span>
      </Button>

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Workspaces */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Layers3 className="w-4 h-4 mr-2" />
            Workspaces
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[250px]">
          <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map(ws => (
            <DropdownMenuItem
              key={ws.value}
              onClick={() => setWorkspace(ws.value)}
              className={workspace === ws.value ? 'bg-accent' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <span>{ws.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {ws.count}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="text-muted-foreground">Create New Workspace</span>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full p-0 w-9 h-9">
            <Avatar className="w-9 h-9">
              <AvatarImage src={(user as any)?.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
                {user?.lastName?.[0]?.toUpperCase() || ''}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
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