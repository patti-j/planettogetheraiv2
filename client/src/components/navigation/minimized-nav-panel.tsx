import { useState } from 'react';
import { useLocation } from 'wouter';
import { Menu, Home, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { useQuery } from '@tanstack/react-query';
// Import icons directly instead of using getIconComponent
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

// Get Lucide icon component from icon name - comprehensive mapping
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Calendar: Icons.Calendar, Brain: Icons.Brain, Briefcase: Icons.Briefcase, Database: Icons.Database, 
    Factory: Icons.Factory, Settings: Icons.Settings, FileText: Icons.FileText, Package: Icons.Package, 
    Target: Icons.Target, BarChart3: Icons.BarChart3, Wrench: Icons.Wrench, Shield: Icons.Shield, 
    BookOpen: Icons.BookOpen, Eye: Icons.Eye, MessageSquare: Icons.MessageSquare, Sparkles: Icons.Sparkles, 
    Building: Icons.Building, Server: Icons.Server, TrendingUp: Icons.TrendingUp, Truck: Icons.Truck, 
    AlertTriangle: Icons.AlertTriangle, MessageCircle: Icons.MessageCircle, GraduationCap: Icons.GraduationCap, 
    Monitor: Icons.Monitor, Columns3: Icons.Columns3, Code: Icons.Code, Network: Icons.Network, Globe: Icons.Globe, 
    GitBranch: Icons.GitBranch, DollarSign: Icons.DollarSign, Headphones: Icons.Headphones, Upload: Icons.Upload, 
    ArrowRightLeft: Icons.ArrowRightLeft, FileSearch: Icons.FileSearch, Presentation: Icons.Presentation, 
    FileX: Icons.FileX, Clock: Icons.Clock, Home: Icons.Home, CreditCard: Icons.CreditCard, Layout: Icons.Layout,
    Grid: Icons.Grid, Workflow: Icons.Workflow, ArrowUpDown: Icons.ArrowUpDown, PlayCircle: Icons.PlayCircle,
    History: Icons.History, Puzzle: Icons.Puzzle, AlertCircle: Icons.AlertCircle, Layers: Icons.Layers,
    Search: Icons.Search, Users: Icons.Users, UserCheck: Icons.UserCheck, Activity: Icons.Activity,
    Zap: Icons.Zap, Cpu: Icons.Cpu, HardDrive: Icons.HardDrive, Clipboard: Icons.Clipboard,
    CheckCircle: Icons.CheckCircle, XCircle: Icons.XCircle, Info: Icons.Info, Mail: Icons.Mail,
    Phone: Icons.Phone, MapPin: Icons.MapPin, Star: Icons.Star, Heart: Icons.Heart, Bookmark: Icons.Bookmark,
    Tag: Icons.Tag, Filter: Icons.Filter, MoreHorizontal: Icons.MoreHorizontal
  };
  return icons[iconName] || Icons.FileText;
};

interface MinimizedNavPanelProps {
  onExpand: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export function MinimizedNavPanel({ onExpand, isPinned, onTogglePin }: MinimizedNavPanelProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { handleNavigation } = useSplitScreen();
  
  // Fetch user preferences to get maxRecentPages setting
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch preferences:', response.status, response.statusText);
        return null;
      }
      return response.json();
    },
    enabled: !!user?.id
  });
  
  // Get max recent pages from user preferences or use default of 5
  const maxRecentPages = userPreferences?.dashboardLayout?.maxRecentPages || 5;
  
  // Safe navigation context access with fallback
  let recentPages: any[] = [];
  let addRecentPage = (path: string, label: string, icon?: string) => {};
  
  try {
    const navigation = useNavigation();
    recentPages = navigation.recentPages || [];
    addRecentPage = navigation.addRecentPage;
  } catch (error) {
    console.warn('NavigationContext not available in MinimizedNavPanel');
  }

  const handlePageClick = (page: any) => {
    handleNavigation(page.path, page.label);
    addRecentPage(page.path, page.label, page.icon);
  };

  const handleHomeClick = () => {
    handleNavigation('/', 'Dashboard');
    addRecentPage('/', 'Dashboard', 'BarChart3');
  };

  return (
    <TooltipProvider>
      <div className="h-full bg-background border-l flex flex-col w-14 relative">
        {/* Header with expand button */}
        <div className="px-2 py-2 border-b flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExpand}
                className="text-white hover:text-white/80 bg-transparent w-8 h-8"
                title="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open navigation menu</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col items-center py-3 gap-2 overflow-y-auto">
          {/* Home Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHomeClick}
                className={cn(
                  "w-8 h-8 rounded-md hover:bg-accent",
                  location === '/' && "bg-accent text-accent-foreground"
                )}
              >
                <Home className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Home</p>
            </TooltipContent>
          </Tooltip>

          {/* Recent Pages */}
          {recentPages.slice(0, maxRecentPages).map((page, index) => {
            const IconComponent = getIconComponent(page.icon || 'FileText');
            const isActive = location === page.path;
            
            return (
              <Tooltip key={`${page.path}-${index}`}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageClick(page)}
                    className={cn(
                      "w-8 h-8 rounded-md hover:bg-accent relative",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{page.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Footer with pin toggle */}
        <div className="px-2 py-2 border-t flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePin}
                className="w-8 h-8 hover:bg-accent"
                title={isPinned ? "Unpin navigation" : "Pin navigation"}
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isPinned ? "Unpin navigation" : "Pin navigation"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}