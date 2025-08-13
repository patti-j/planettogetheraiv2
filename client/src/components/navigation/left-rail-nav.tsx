import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Clock, ChevronDown, ChevronRight, FolderOpen, Grid, Pin, PinOff, X, Menu, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { SlideOutMenu } from './slide-out-menu';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export function LeftRailNav() {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { recentPages, togglePinPage, clearRecentPages } = useNavigation();
  
  // Mock workspaces for now - this would come from the backend
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
    // In a real app, this would trigger workspace context change
    console.log('Switching to workspace:', workspace.name);
  };

  // Get page icon based on path
  const getPageIcon = (path: string) => {
    if (path.includes('dashboard')) return '📊';
    if (path.includes('production')) return '🏭';
    if (path.includes('inventory')) return '📦';
    if (path.includes('quality')) return '✅';
    if (path.includes('reports')) return '📈';
    if (path.includes('settings')) return '⚙️';
    return '📄';
  };

  return (
    <>
      {/* Slide-out Menu */}
      <SlideOutMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      {/* Minimized state - floating restore button */}
      {isMinimized && (
        <div className="fixed left-2 top-4 z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-10 w-10 p-0 shadow-lg bg-background/95 backdrop-blur-sm"
                  aria-label="Restore navigation"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Restore navigation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <TooltipProvider>
        <div className={cn(
          "h-full bg-background border-r transition-all duration-300 flex flex-col",
          isMinimized && "hidden",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {/* Workspace Switcher */}
          <div className="p-2 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <span className="text-lg mr-2">{activeWorkspace.icon}</span>
                    {!isCollapsed && (
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium truncate">{activeWorkspace.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{activeWorkspace.description}</p>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />}
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
                    className={cn(
                      "cursor-pointer",
                      workspace.id === activeWorkspace.id && "bg-accent"
                    )}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Grid className="h-4 w-4 mr-2" />
                  Manage Workspaces
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Home Button */}
          <div className="p-2 border-b">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={location === '/' ? 'default' : 'ghost'}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => setLocation('/')}
                >
                  <Home className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Home</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Home</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Menu Button */}
          <div className="p-2 border-b">
            {!isCollapsed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="w-full justify-start"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
                <span className="ml-2">Menu</span>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(true)}
                    className="w-full justify-center"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Menu</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

        {/* Recent Pages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-2 py-2 border-b">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Recent Pages</p>
                  {recentPages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentPages}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </>
              )}
              {isCollapsed && (
                <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {recentPages.length === 0 ? (
                !isCollapsed && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No recent pages
                  </p>
                )
              ) : (
                recentPages.map((page) => (
                  <Tooltip key={page.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={location === page.path ? 'secondary' : 'ghost'}
                        className={cn(
                          "w-full justify-start group",
                          isCollapsed && "justify-center px-2"
                        )}
                        onClick={() => setLocation(page.path)}
                      >
                        <span className="text-sm mr-2">{getPageIcon(page.path)}</span>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left truncate text-sm">
                              {page.label}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinPage(page.path);
                              }}
                            >
                              {page.isPinned ? (
                                <PinOff className="h-3 w-3" />
                              ) : (
                                <Pin className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{page.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Controls */}
        <div className="p-2 border-t">
          {!isCollapsed ? (
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="flex-1 justify-start"
                    aria-label="Minimize navigation"
                  >
                    <Minimize2 className="h-4 w-4" />
                    <span className="ml-2">Minimize</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Minimize navigation</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(true)}
                    className="flex-shrink-0"
                    aria-label="Collapse navigation"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Collapse navigation</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="w-full justify-center"
                    aria-label="Minimize navigation"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Minimize navigation</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(false)}
                    className="w-full justify-center"
                    aria-label="Expand navigation"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand navigation</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        </div>
      </TooltipProvider>
    </>
  );
}