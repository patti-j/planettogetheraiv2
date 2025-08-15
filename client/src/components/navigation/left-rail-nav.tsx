import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Clock, ChevronRight, FolderOpen, Pin, PinOff, X, Menu, Minimize2, Maximize2, Calendar, Brain, Briefcase, Database, Factory, Settings, FileText, Package, Target, BarChart3, Wrench, Shield, Bot, BookOpen, Eye, MessageSquare, Sparkles, Building, Server, TrendingUp, Truck, AlertTriangle, MessageCircle, GraduationCap, Monitor, Columns3, Code, Network, Globe, GitBranch, DollarSign, Headphones, Upload, ArrowRightLeft, FileSearch, Presentation, FileX, Grid, PlayCircle, Search, History, Layout, Puzzle, AlertCircle, Layers, Workflow, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { SlideOutMenu } from './slide-out-menu';

export function LeftRailNav() {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { recentPages, togglePinPage, clearRecentPages } = useNavigation();

  // Get Lucide icon component from icon name
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Calendar, Brain, Briefcase, Database, Factory, Settings, FileText, Package, Target, BarChart3, 
      Wrench, Shield, Bot, BookOpen, Eye, MessageSquare, Sparkles, Building, Server, TrendingUp, 
      Truck, AlertTriangle, MessageCircle, GraduationCap, Monitor, Columns3, Code, Network, Globe, 
      GitBranch, DollarSign, Headphones, Upload, ArrowRightLeft, FileSearch, Presentation, FileX, 
      Grid, PlayCircle, Search, History, Layout, Puzzle, AlertCircle, Layers, Workflow, ArrowUpDown
    };
    
    const IconComponent = icons[iconName] || FileText;
    return IconComponent;
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


          {/* Home Section */}
          <div className="p-2 border-b">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={location === '/' ? 'default' : 'ghost'}
                    className={cn(
                      "flex-1 justify-start",
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
              
              {/* Collapse Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                    aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                  >
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform",
                      isCollapsed ? "rotate-0" : "rotate-180"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isCollapsed ? "Expand navigation" : "Collapse navigation"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
                        {(() => {
                          const IconComponent = getIconComponent(page.icon || 'FileText');
                          return <IconComponent className="h-4 w-4 mr-2 flex-shrink-0" />;
                        })()}
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

        {/* Minimize Control */}
        <div className="p-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center"
                )}
                aria-label="Minimize navigation"
              >
                <Minimize2 className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Minimize</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Minimize navigation</p>
            </TooltipContent>
          </Tooltip>
        </div>

        </div>
      </TooltipProvider>
    </>
  );
}