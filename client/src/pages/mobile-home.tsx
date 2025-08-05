import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useViewMode } from "@/hooks/use-view-mode";
import { MaxSidebar } from "@/components/max-sidebar";
import { FloatingHamburgerMenu } from "@/components/floating-hamburger-menu";
import CompanyLogoImage from "@/assets/company-logo.png";
import planetTogetherLogo from "@/assets/planet-together-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  LayoutDashboard,
  CheckSquare,
  Inbox,
  Search,
  Menu,
  Bot,
  Settings,
  User,
  LogOut,
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Activity,
  Library,
  BarChart3,
  Monitor,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit,
  Trash2,
  X,
  BookOpen,
  Target,
  Package,
  Brain,
  Briefcase,
  Sparkles,
  Database,
  Truck,
  Wrench,
  Building,
  Server,
  Grid3X3,
  Puzzle,
  Layout,
  FileSearch,
  FileText,
  Layers,
  Shield,
  GraduationCap,
  Presentation,
  MessageCircle,
  Columns3,
  Factory,
  MessageSquare,
  // Additional icons for widget and dashboard types
  PieChart,
  LineChart,
  Gauge,
  Table,
  Users,
  CheckCircle,
  Calculator,
  Cog,
  Zap,
  GitBranch,
  BarChart2,
  TrendingDown,
  PlayCircle,
  PauseCircle,
  Palette,
  Eye
} from "lucide-react";

// Import widget components
import WidgetDesignStudio from '@/components/widget-design-studio';
import { WidgetConfig } from '@/lib/widget-library';
import DesignStudio from '@/components/design-studio/design-studio-clean';
import { AiDesignStudioMobile } from '@/components/design-studio/ai-design-studio-mobile';

// Import page components for mobile routing - only import existing pages
import ProductionSchedulePage from "@/pages/production-schedule";
import Dashboard from "@/pages/dashboard";
import ProductionCockpit from "@/pages/production-cockpit";
import Analytics from "@/pages/analytics";
import ShopFloor from "@/pages/shop-floor";
import Reports from "@/pages/reports";
import BoardsPage from "@/pages/boards";
// Note: TasksPage, InboxPage, AccountSettings, DashboardManager, WidgetManager don't exist yet

// Icon mapping functions
const getWidgetIcon = (type: string) => {
  switch (type) {
    case 'production-metrics':
    case 'production-overview':
      return Factory;
    case 'equipment-status':
    case 'resource-status':
      return Cog;
    case 'quality-dashboard':
    case 'quality-metrics':
      return Shield;
    case 'inventory-tracking':
    case 'inventory-levels':
      return Package;
    case 'gantt-chart':
    case 'schedule-gantt':
      return Calendar;
    case 'atp-ctp':
    case 'atp-ctp-calculator':
      return Calculator;
    case 'reports':
    case 'reports-widget':
      return FileText;
    case 'alerts':
    case 'alert-dashboard':
      return AlertTriangle;
    case 'kpi':
    case 'performance-metrics':
      return Target;
    case 'chart':
    case 'bar-chart':
      return BarChart3;
    case 'pie-chart':
      return PieChart;
    case 'line-chart':
      return LineChart;
    case 'table':
    case 'data-table':
      return Table;
    case 'gauge':
    case 'progress':
      return Gauge;
    case 'users':
    case 'user-management':
      return Users;
    case 'sales-order-status':
      return CheckCircle;
    case 'schedule-optimization':
      return Zap;
    case 'production-order-status':
      return CheckCircle;
    case 'operation-dispatch':
      return Zap;
    case 'resource-assignment':
      return Users;
    case 'database':
    case 'data-source':
      return Database;
    default:
      return BarChart3; // Default fallback
  }
};

const getDashboardIcon = (title: string, description?: string) => {
  const combined = `${title} ${description || ''}`.toLowerCase();
  
  if (combined.includes('factory') || combined.includes('production')) {
    return Factory;
  }
  if (combined.includes('planning') || combined.includes('schedule')) {
    return Calendar;
  }
  if (combined.includes('quality') || combined.includes('control')) {
    return Shield;
  }
  if (combined.includes('inventory') || combined.includes('stock')) {
    return Package;
  }
  if (combined.includes('analytics') || combined.includes('metrics')) {
    return TrendingUp;
  }
  if (combined.includes('maintenance') || combined.includes('equipment')) {
    return Cog;
  }
  if (combined.includes('management') || combined.includes('users')) {
    return Users;
  }
  if (combined.includes('overview') || combined.includes('summary')) {
    return Layers;
  }
  
  return Monitor; // Default fallback
};

// Function to determine the route for a widget based on its type and properties
const getWidgetRoute = (widget: any): string | null => {
  const widgetType = widget.type || widget.widgetType;
  const widgetTitle = widget.title?.toLowerCase() || '';
  
  // Map specific widget types to their corresponding pages
  switch (widgetType) {
    case 'gantt':
    case 'schedule-gantt':
      return '/production-schedule';
    case 'schedule-optimizer':
    case 'schedule-optimization':
      return `/widgets/${widget.id}`;
    case 'operation-dispatch':
    case 'operation-sequencer':
    case 'operation-sequencing':
      return `/widgets/${widget.id}`;
    case 'production-metrics':
    case 'production-overview':
      return '/production-cockpit';
    case 'analytics':
    case 'analytics-dashboard':
      return '/analytics';
    case 'shop-floor':
    case 'shop-floor-management':
      return '/shop-floor';
    case 'reports':
    case 'reporting':
      return '/reports';
    case 'dashboard':
    case 'overview-dashboard':
      return '/dashboard';
    default:
      // Check title-based routing for specific widgets
      if (widgetTitle.includes('schedule') && widgetTitle.includes('optimizer')) {
        return `/widgets/${widget.id}`;
      }
      if (widgetTitle.includes('operation') && widgetTitle.includes('sequencer')) {
        return `/widgets/${widget.id}`;
      }
      if (widgetTitle.includes('gantt') || (widgetTitle.includes('schedule') && !widgetTitle.includes('optimizer'))) {
        return '/production-schedule';
      }
      if (widgetTitle.includes('production') && widgetTitle.includes('cockpit')) {
        return '/production-cockpit';
      }
      if (widgetTitle.includes('analytics')) {
        return '/analytics';
      }
      if (widgetTitle.includes('shop') && widgetTitle.includes('floor')) {
        return '/shop-floor';
      }
      if (widgetTitle.includes('report')) {
        return '/reports';
      }
      
      // For unknown widget types, return null to use fallback
      return null;
  }
};

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  type: string;
  status: "pending" | "in-progress" | "completed";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  read: boolean;
}

// Mobile-specific Production Schedule Page
function MobileProductionSchedulePage() {
  const { data: jobs = [] }: { data: any[] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] }: { data: any[] } = useQuery({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] }: { data: any[] } = useQuery({
    queryKey: ["/api/resources"],
  });

  // Calculate basic statistics
  const totalOperations = operations.length;
  const runningOperations = operations.filter((op: any) => op.status === "running").length;
  const completedOperations = operations.filter((op: any) => op.status === "completed").length;
  const activeResources = resources.filter((resource: any) => 
    operations.some((op: any) => op.assignedResourceId === resource.id && op.status === "running")
  ).length;

  const [, setLocation] = useLocation();

  return (
    <div className="p-4 space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            console.log("⬅️ Back button clicked from Production Schedule");
            setLocation('/');
          }}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Production Schedule</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time production scheduling
          </p>
        </div>
        <div className="w-9"></div> {/* Spacer for balance */}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {totalOperations}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Operations
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {runningOperations}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Running Now
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
              {completedOperations}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Completed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {activeResources}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Active Resources
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Current Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {operations.slice(0, 5).map((operation: any) => (
            <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {operation.name || `Operation ${operation.id}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Resource: {resources.find((r: any) => r.id === operation.assignedResourceId)?.name || 'Unassigned'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-xs ${
                    operation.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    operation.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}
                >
                  {operation.status === 'running' ? (
                    <PlayCircle className="w-3 h-3 mr-1" />
                  ) : operation.status === 'completed' ? (
                    <CheckSquare className="w-3 h-3 mr-1" />
                  ) : (
                    <PauseCircle className="w-3 h-3 mr-1" />
                  )}
                  {operation.status}
                </Badge>
              </div>
            </div>
          ))}
          {operations.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No operations scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Resource Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resources.slice(0, 5).map((resource: any) => {
            const isActive = operations.some((op: any) => op.assignedResourceId === resource.id && op.status === "running");
            return (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {resource.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {resource.type || 'Equipment'}
                  </div>
                </div>
                <Badge 
                  className={`text-xs ${
                    isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {isActive ? 'Active' : 'Idle'}
                </Badge>
              </div>
            );
          })}
          {resources.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No resources available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component to render different pages on mobile underneath the header
function MobilePageContent({ location }: { location: string }) {
  // Mobile wrapper that prevents full-screen behavior and adds proper constraints
  const MobilePageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="mobile-page-wrapper w-full h-full max-h-full overflow-auto relative bg-white dark:bg-gray-900" style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
      {children}
    </div>
  );

  console.log("🔍 MobilePageContent - Rendering for location:", location);
  
  switch (location) {
    case "/production-schedule":
      console.log("📅 Rendering Production Schedule page");
      return (
        <MobilePageWrapper>
          <ProductionSchedulePage />
        </MobilePageWrapper>
      );
    case "/dashboard":
      return (
        <MobilePageWrapper>
          <Dashboard />
        </MobilePageWrapper>
      );
    case "/production-cockpit":
      return (
        <MobilePageWrapper>
          <ProductionCockpit />
        </MobilePageWrapper>
      );
    case "/analytics":
      return (
        <MobilePageWrapper>
          <Analytics />
        </MobilePageWrapper>
      );
    case "/shop-floor":
      return (
        <MobilePageWrapper>
          <ShopFloor />
        </MobilePageWrapper>
      );
    case "/reports":
      return (
        <MobilePageWrapper>
          <Reports />
        </MobilePageWrapper>
      );
    case "/boards":
      return (
        <MobilePageWrapper>
          <BoardsPage />
        </MobilePageWrapper>
      );
    case "/tasks":
    case "/inbox":
    case "/account":
    case "/account-settings":
    case "/dashboard-manager":
    case "/widget-manager":
      return (
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The {location.replace('/', '').replace('-', ' ')} page is under development.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      );
    default:
      return (
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The page "{location}" could not be found.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      );
  }
}

// Mobile Menu Trigger Component - using FloatingHamburgerMenu
function MobileMenuTrigger() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch user profile with firstName for greeting
  const { data: userProfile } = useQuery({
    queryKey: ["/api/auth/profile"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const handleToggle = (open: boolean) => {
    console.log("🍔 Mobile Hamburger clicked! Setting open to:", open);
    setIsOpen(open);
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-2"
        onClick={() => handleToggle(!isOpen)}
      >
        <Menu className="w-5 h-5" />
      </Button>
      
      {/* Simple mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsOpen(false)}
          />
          {/* Sidebar Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{(userProfile?.firstName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{userProfile?.firstName || user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">{userProfile?.email || user?.email || 'demo@example.com'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Navigation Menu - Categorized Desktop Structure */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                
                {/* Planning & Scheduling */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Planning & Scheduling</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div 
                      className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                      onClick={() => {
                        console.log("📅 Production Schedule clicked from hamburger menu");
                        setIsOpen(false); // Close menu first
                        setLocation('/production-schedule'); // Then navigate
                      }}
                    >
                      <BarChart3 className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Production Schedule</span>
                    </div>
                    <Link href="/optimize-orders" className="flex flex-col items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                      <Sparkles className="w-5 h-5 text-amber-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Order Optimization</span>
                    </Link>
                    <Link href="/capacity-planning" className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Briefcase className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Capacity Planning</span>
                    </Link>
                    <Link href="/production-planning" className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Target className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Production Planning</span>
                    </Link>
                  </div>
                </div>

                {/* AI & Optimization */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI & Optimization</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/optimization-studio" className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Optimization Studio</span>
                    </Link>
                    <Link href="/demand-forecasting" className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Brain className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Demand Planning</span>
                    </Link>
                    <Link href="/inventory-optimization" className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                      <Package className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Inventory Optimization</span>
                    </Link>
                  </div>
                </div>

                {/* Operations */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Operations</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/shop-floor" className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                      <Factory className="w-5 h-5 text-orange-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Shop Floor</span>
                    </Link>
                    <Link href="/operator-dashboard" className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors">
                      <Settings className="w-5 h-5 text-gray-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Operator Dashboard</span>
                    </Link>
                    <Link href="/maintenance" className="flex flex-col items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                      <Wrench className="w-5 h-5 text-yellow-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Maintenance</span>
                    </Link>
                    <Link href="/disruption-management" className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-red-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Disruption Management</span>
                    </Link>
                  </div>
                </div>

                {/* Management & Administration */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Management & Administration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/systems-management-dashboard" className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors">
                      <Server className="w-5 h-5 text-slate-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Systems Management</span>
                    </Link>
                    <Link href="/user-access-management" className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Shield className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">User Management</span>
                    </Link>
                    <Link href="/widgets" className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Puzzle className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Widgets</span>
                    </Link>
                    <Link href="/dashboards" className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Layout className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Dashboards</span>
                    </Link>
                  </div>
                </div>

                {/* Data Management */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Management</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/data-schema" className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Database className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Data Schema</span>
                    </Link>
                    <Link href="/data-import" className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Database className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Data Import</span>
                    </Link>
                    <Link href="/table-field-viewer" className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors">
                      <FileText className="w-5 h-5 text-slate-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Table Documentation</span>
                    </Link>
                    <Link href="/error-logs" className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <FileSearch className="w-5 h-5 text-red-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Error Logs</span>
                    </Link>
                  </div>
                </div>

                {/* Communication & Collaboration */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Communication & Collaboration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/visual-factory" className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Factory className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Visual Factory</span>
                    </Link>
                    <Link href="/chat" className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Chat</span>
                    </Link>
                    <Link href="/boards" className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Columns3 className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Boards</span>
                    </Link>
                    <Link href="/feedback" className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                      <MessageSquare className="w-5 h-5 text-orange-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Feedback</span>
                    </Link>
                  </div>
                </div>

                {/* Training & Support */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Training & Support</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/help" className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                      <BookOpen className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Getting Started</span>
                    </Link>
                    <Link href="/training" className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <GraduationCap className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Training</span>
                    </Link>
                    <Link href="/presentation-system" className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Presentation className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Presentations</span>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MobileHomePage() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [activeLibraryTab, setActiveLibraryTab] = useState("widgets");
  const [currentWidgetPage, setCurrentWidgetPage] = useState(0);
  const [currentDashboardPage, setCurrentDashboardPage] = useState(0);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 4; // Show 4 items per page for mobile
  const [editingDashboard, setEditingDashboard] = useState(null);
  const [dashboardStudioOpen, setDashboardStudioOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { currentView, toggleView, isForced } = useViewMode();
  const queryClient = useQueryClient();
  
  // Fetch user profile with firstName for greeting
  const { data: userProfile } = useQuery({
    queryKey: ["/api/auth/profile"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  console.log('🔍 User object:', user);
  console.log('🔍 User profile:', userProfile);
  
  // Remove sidebar state as it's handled by SidebarProvider
  
  // Max AI panel state
  const [maxPanelOpen, setMaxPanelOpen] = useState(false);
  const [maxResponse, setMaxResponse] = useState<any>(null);
  const [isMaxLoading, setIsMaxLoading] = useState(false);
  const [showMaxSettings, setShowMaxSettings] = useState(false);

  // Widget management state
  const [widgetStudioOpen, setWidgetStudioOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<any>(null);
  const [designStudioOpen, setDesignStudioOpen] = useState(false);
  
  // Preview states for design studio preview windows
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'widget' | 'dashboard' | null>(null);

  // Widget deletion mutation
  const deleteWidgetMutation = useMutation({
    mutationFn: async (widgetId: string) => {
      const response = await apiRequest("DELETE", `/api/analytics/widgets/${widgetId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile/widgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/widgets"] });
    },
  });

  // Widget management functions
  const handleCreateWidget = (widget: WidgetConfig, targetSystems: string[]) => {
    console.log('Widget created for mobile:', widget, 'systems:', targetSystems);
    queryClient.invalidateQueries({ queryKey: ["/api/mobile/widgets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/widgets"] });
    setWidgetStudioOpen(false);
  };

  const handleEditWidget = (widget: any) => {
    console.log('🔍 Opening preview for widget:', widget.title);
    setPreviewItem(widget);
    setPreviewType('widget');
  };

  const handleEditDashboard = (dashboard: any) => {
    console.log('🔍 Opening preview for dashboard:', dashboard.title);
    setPreviewItem(dashboard);
    setPreviewType('dashboard');
  };

  const handleDeleteWidget = async (widget: any) => {
    if (confirm(`Are you sure you want to delete "${widget.title}"?`)) {
      await deleteWidgetMutation.mutateAsync(widget.id);
    }
  };
  
  // AI prompt handling
  const handleAIPrompt = async (prompt: string) => {
    try {
      setIsMaxLoading(true);
      console.log('Sending AI prompt:', prompt);
      
      const response = await fetch('/api/ai-agent/mobile-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: prompt,
          context: {
            page: '/mobile-home',
            user: user?.firstName || user?.username,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response:', contentType);
        setMaxResponse({
          message: "Authentication required. Please refresh the page and try again.",
          error: true
        });
        setMaxPanelOpen(true);
        return;
      }
      
      const data = await response.json();
      console.log('AI Response:', data);
      
      // Store response and open panel
      setMaxResponse(data);
      setMaxPanelOpen(true);
      
      // Handle widget creation if requested
      if (data.canvasAction === 'create' && data.data?.type === 'widget') {
        // Navigate to widget view - for now just show in response
        console.log('Would create widget:', data.data);
      }
      
    } catch (error) {
      console.error('AI prompt error:', error);
      setMaxResponse({
        message: "I'm temporarily unavailable. Please try again later.",
        error: true
      });
      setMaxPanelOpen(true);
    } finally {
      setIsMaxLoading(false);
    }
  };

  // Mock data - in real app, these would come from API
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      // Mock tasks data
      return [
        {
          id: "1",
          title: "Review Production Order PO-2024-001",
          priority: "high" as const,
          dueDate: "2025-08-02",
          type: "Review",
          status: "pending" as const
        },
        {
          id: "2", 
          title: "Quality Inspection - Batch B-001",
          priority: "medium" as const,
          dueDate: "2025-08-03",
          type: "Inspection",
          status: "in-progress" as const
        },
        {
          id: "3",
          title: "Schedule Equipment Maintenance",
          priority: "low" as const,
          dueDate: "2025-08-05",
          type: "Maintenance",
          status: "pending" as const
        }
      ] as Task[];
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      // Mock notifications data
      return [
        {
          id: "1",
          title: "Production Alert",
          message: "Line 2 efficiency below target",
          type: "warning" as const,
          timestamp: "2025-08-02T10:30:00Z",
          read: false
        },
        {
          id: "2",
          title: "Order Completed",
          message: "Production order PO-2024-095 finished",
          type: "success" as const,
          timestamp: "2025-08-02T09:15:00Z",
          read: false
        }
      ] as Notification[];
    }
  });

  // Fetch mobile widgets and dashboards
  const { data: mobileWidgets = [] } = useQuery({
    queryKey: ["mobile-widgets"],
    queryFn: async () => {
      console.log("=== FETCHING MOBILE WIDGETS ===");
      const response = await fetch("/api/mobile/widgets");
      console.log("=== MOBILE WIDGETS RESPONSE ===", response.status, response.ok);
      
      const responseText = await response.text();
      console.log("=== RAW RESPONSE TEXT ===", responseText.substring(0, 200));
      
      let allWidgets;
      try {
        allWidgets = JSON.parse(responseText);
      } catch (e) {
        console.error("=== JSON PARSE ERROR ===", e);
        return [];
      }
      
      console.log("=== MOBILE WIDGETS DATA ===", allWidgets);
      console.log("=== MOBILE WIDGETS TYPE ===", typeof allWidgets, Array.isArray(allWidgets));
      return allWidgets;
    }
  });

  const { data: mobileDashboards = [] } = useQuery({
    queryKey: ["mobile-dashboards-fixed"], 
    queryFn: async () => {
      console.log("=== FETCHING MOBILE DASHBOARDS ===");
      const response = await fetch("/api/mobile/dashboards");
      console.log("=== MOBILE DASHBOARDS RESPONSE ===", response.status, response.ok);
      
      const responseText = await response.text();
      console.log("=== RAW RESPONSE TEXT ===", responseText.substring(0, 200));
      
      let allDashboards;
      try {
        allDashboards = JSON.parse(responseText);
      } catch (e) {
        console.error("=== JSON PARSE ERROR ===", e);
        return [];
      }
      
      console.log("=== MOBILE DASHBOARDS DATA ===", allDashboards);
      console.log("=== MOBILE DASHBOARDS TYPE ===", typeof allDashboards, Array.isArray(allDashboards));
      
      // Server should now provide Production Scheduler Dashboard (ID 5)
      
      return allDashboards;
    }
  });

  // Recent items tracking
  const getRecentItems = () => {
    const recent = localStorage.getItem('mobileRecentItems');
    const items = recent ? JSON.parse(recent) : [];
    
    // Fix any Schedule Optimizer items with wrong ID (9 should be 52)
    // Fix any Operation Sequencer items with wrong ID (6 should be 99)
    const fixedItems = items.map((item: any) => {
      if (item.title === 'Schedule Optimizer' && item.id !== 52) {
        console.log("🔧 Fixing Schedule Optimizer ID from", item.id, "to 52");
        return { ...item, id: 52 };
      }
      if (item.title === 'Operation Sequencer' && item.id !== 99) {
        console.log("🔧 Fixing Operation Sequencer ID from", item.id, "to 99");
        return { ...item, id: 99 };
      }
      return item;
    });
    
    // Save the fixed items back to localStorage if changes were made
    if (JSON.stringify(fixedItems) !== JSON.stringify(items)) {
      localStorage.setItem('mobileRecentItems', JSON.stringify(fixedItems));
    }
    
    return fixedItems;
  };

  const addToRecent = (item: any, type: 'widget' | 'dashboard') => {
    const recent = getRecentItems();
    const newItem = { ...item, type, viewedAt: new Date().toISOString() };
    const filtered = recent.filter((r: any) => !(r.id === item.id && r.type === type));
    const updated = [newItem, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem('mobileRecentItems', JSON.stringify(updated));
  };

  const recentItems = getRecentItems();

  const unreadNotifications = notifications.filter(n => !n.read);
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const highPriorityTasks = tasks.filter(t => t.priority === "high");

  // Filter widgets and dashboards based on search query
  const filteredWidgets = mobileWidgets.filter((widget: any) => {
    if (!librarySearchQuery) return true;
    const query = librarySearchQuery.toLowerCase();
    return (
      widget.title.toLowerCase().includes(query) ||
      widget.type.toLowerCase().includes(query) ||
      (widget.description && widget.description.toLowerCase().includes(query))
    );
  });

  const filteredDashboards = mobileDashboards.filter((dashboard: any) => {
    if (!librarySearchQuery) return true;
    const query = librarySearchQuery.toLowerCase();
    return (
      dashboard.title.toLowerCase().includes(query) ||
      (dashboard.description && dashboard.description.toLowerCase().includes(query))
    );
  });

  // Pagination logic for widgets and dashboards
  const widgetsToShow = librarySearchQuery ? filteredWidgets : mobileWidgets;
  const dashboardsToShow = librarySearchQuery ? filteredDashboards : mobileDashboards;

  const totalWidgetPages = Math.ceil(widgetsToShow.length / ITEMS_PER_PAGE);
  const totalDashboardPages = Math.ceil(dashboardsToShow.length / ITEMS_PER_PAGE);

  const paginatedWidgets = widgetsToShow.slice(
    currentWidgetPage * ITEMS_PER_PAGE,
    (currentWidgetPage + 1) * ITEMS_PER_PAGE
  );

  const paginatedDashboards = dashboardsToShow.slice(
    currentDashboardPage * ITEMS_PER_PAGE,
    (currentDashboardPage + 1) * ITEMS_PER_PAGE
  );

  // Navigation functions
  const goToPrevWidgetPage = () => {
    setCurrentWidgetPage(Math.max(0, currentWidgetPage - 1));
  };

  const goToNextWidgetPage = () => {
    setCurrentWidgetPage(Math.min(totalWidgetPages - 1, currentWidgetPage + 1));
  };

  const goToPrevDashboardPage = () => {
    setCurrentDashboardPage(Math.max(0, currentDashboardPage - 1));
  };

  const goToNextDashboardPage = () => {
    setCurrentDashboardPage(Math.min(totalDashboardPages - 1, currentDashboardPage + 1));
  };

  // Reset pagination when switching tabs or searching
  useEffect(() => {
    setCurrentWidgetPage(0);
    setCurrentDashboardPage(0);
  }, [activeLibraryTab, librarySearchQuery]);

  const filteredRecentItems = recentItems.filter((item: any) => {
    if (!librarySearchQuery) return true;
    const query = librarySearchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query);
  });

  const quickActions = [
    {
      title: "Production",
      icon: Activity,
      path: "/production-cockpit",
      color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Dashboards",
      icon: LayoutDashboard,
      path: "/dashboards",
      color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
    },
    {
      title: "Design Studio",
      icon: Palette,
      action: () => {
        console.log("🎨 Design Studio button clicked!");
        setDesignStudioOpen(true);
      },
      color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
    },
    {
      title: "My Tasks",
      icon: CheckSquare,
      path: "/tasks",
      color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
      badge: pendingTasks.length > 0 ? pendingTasks.length : undefined
    },
    {
      title: "Inbox",
      icon: Inbox,
      path: "/inbox",
      color: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
      badge: unreadNotifications.length > 0 ? unreadNotifications.length : undefined
    }
  ];

  const menuItems = [
    { title: "Analytics", icon: TrendingUp, path: "/analytics" },
    { title: "Production", icon: Activity, path: "/production-cockpit" },
    { title: "Shop Floor", icon: Settings, path: "/shop-floor" },
    { title: "Reports", icon: Calendar, path: "/reports" },
    { title: "Settings", icon: Settings, path: "/account" }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "success": return <CheckSquare className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  // Debug logging
  console.log("🏠 MobileHomePage render - currentView:", currentView, "isForced:", isForced);
  console.log("🔍 MobileHomePage - location:", location);
  console.log("🔍 MobileHomePage - should show home?", location === "/" || location === "/mobile-home" || location === "/mobile");
  console.log("🔍 MobileHomePage - widgetStudioOpen:", widgetStudioOpen);
  console.log("🔍 MobileHomePage - maxPanelOpen:", maxPanelOpen);
  console.log("🔍 MobileHomePage - designStudioOpen:", designStudioOpen);
  
  // Reset any cached view states when navigating to home
  useEffect(() => {
    if (location === "/" || location === "/mobile-home" || location === "/mobile") {
      console.log("🏠 Resetting to mobile home view for location:", location);
      // Force any potential cached states to clear
      window.scrollTo(0, 0);
      // Reset widget studio state to ensure home content is shown
      setWidgetStudioOpen(false);
      setEditingWidget(null);
      // Reset Max panel state
      setMaxPanelOpen(false);
      setMaxResponse(null);
      setShowMaxSettings(false);
      // Don't reset Design Studio state - let it persist
    }
  }, [location]);

  // Reset scroll position on component mount/login
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [user]);

  // When on /mobile-home route, ALWAYS show mobile view - never render desktop content
  // This prevents desktop content from showing underneath when pulling to refresh
  if (false) { // Disabled desktop rendering on mobile-home route
    return (
      <div className="force-desktop-view">
        {/* Desktop Navigation Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={CompanyLogoImage} 
                alt="Company Logo" 
                className="h-8 w-8 object-contain"
              />
              <nav className="flex space-x-2 md:space-x-6 overflow-x-auto">
                <Link href="/dashboard" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                <Link href="/production-cockpit" className="text-sm font-medium hover:text-blue-600">Production</Link>
                <Link href="/analytics" className="text-sm font-medium hover:text-blue-600">Analytics</Link>
                <Link href="/shop-floor" className="text-sm font-medium hover:text-blue-600">Shop Floor</Link>
                <Link href="/boards" className="text-sm font-medium hover:text-blue-600">Boards</Link>
                <Link href="/reports" className="text-sm font-medium hover:text-blue-600">Reports</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleView}
                      className="p-2 view-mode-forced"
                    >
                      <Smartphone className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to Mobile View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback>{(userProfile?.firstName || user?.username)?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {/* View Mode Toggle in Desktop Mode */}
                  <DropdownMenuItem onClick={toggleView}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    <span>Switch to Mobile View</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Desktop Content Area */}
        <div className="flex flex-col md:flex-row">
          {/* Desktop Sidebar - collapsible on mobile */}
          <div className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-r md:border-b-0 dark:border-gray-700 min-h-screen">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Manufacturing</h3>
              <nav className="grid grid-cols-2 md:grid-cols-1 gap-2">
                <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/production-cockpit" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Activity className="mr-3 h-4 w-4" />
                  Production Cockpit
                </Link>
                <Link href="/analytics" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TrendingUp className="mr-3 h-4 w-4" />
                  Analytics
                </Link>
                <Link href="/shop-floor" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Settings className="mr-3 h-4 w-4" />
                  Shop Floor
                </Link>
                <Link href="/boards" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <BarChart3 className="mr-3 h-4 w-4" />
                  Boards
                </Link>
                <Link href="/reports" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Calendar className="mr-3 h-4 w-4" />
                  Reports
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manufacturing Dashboard</h1>
              
              {/* Desktop Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Quick Stats */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Activity className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Production</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">94%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Issues</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activities */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckSquare className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Production order PO-2025-001 completed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Equipment maintenance scheduled</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">New shift started</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 force-mobile-view flex flex-col overflow-hidden">
      {/* Mobile Header - Fixed */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 flex-shrink-0 z-50 relative">
            <div className="flex items-center px-4 py-3 gap-3">
          {/* Logo - clickable to go home */}
          <div className="flex-shrink-0">
            <img 
              src={planetTogetherLogo} 
              alt="PlanetTogether" 
              className="w-8 h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🏠 Logo clicked - forcing navigation to home");
                console.log("🔍 Current states - designStudioOpen:", designStudioOpen, "widgetStudioOpen:", widgetStudioOpen, "maxPanelOpen:", maxPanelOpen);
                
                // Close all overlays first
                setDesignStudioOpen(false);
                setWidgetStudioOpen(false);
                setMaxPanelOpen(false);
                setPreviewItem(null);
                setPreviewType(null);
                
                // Use setLocation for proper navigation
                setLocation("/");
              }}
            />
          </div>
          
          {/* Search/Prompt Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-all duration-200 ${
                searchQuery || isSearchFocused ? 'left-3' : 'left-3'
              }`} />
              <Input
                placeholder="Search or ask Max"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    // Handle search or AI prompt
                    if (searchQuery.toLowerCase().includes('max') || searchQuery.includes('?') || searchQuery.includes('how') || searchQuery.includes('what') || searchQuery.includes('show') || searchQuery.includes('create')) {
                      // This looks like an AI prompt
                      await handleAIPrompt(searchQuery);
                      setSearchQuery(""); // Clear after sending
                    } else {
                      // This looks like a search
                      console.log('Search:', searchQuery);
                      // TODO: Perform search functionality
                      alert(`Searching for: ${searchQuery}`);
                      setSearchQuery(""); // Clear after searching
                    }
                  }
                }}
                className={`py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-full transition-all duration-200 ${
                  searchQuery || isSearchFocused 
                    ? 'pl-10 pr-4 text-left' 
                    : 'pl-10 pr-4 text-left'
                }`}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Max AI Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setMaxPanelOpen(true)}
            >
              <Bot className="w-5 h-5 text-blue-600" />
            </Button>

            {/* Library */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => {
                const libraryDialog = document.getElementById('library-dialog');
                if (libraryDialog) {
                  libraryDialog.style.display = 'block';
                }
              }}
            >
              <Library className="w-5 h-5" />
            </Button>

            {/* Hamburger Menu Trigger */}
            <MobileMenuTrigger />

            {/* Library Modal */}
            <div 
              id="library-dialog" 
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              style={{ display: 'none' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  e.currentTarget.style.display = 'none';
                }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col touch-pan-y">
                {/* Fixed header */}
                <div className="flex justify-between items-center p-4 sm:p-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Library</h2>
                  <button 
                    onClick={() => {
                      const dialog = document.getElementById('library-dialog');
                      if (dialog) {
                        dialog.style.display = 'none';
                        setLibrarySearchQuery(""); // Reset search when closing
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {/* Search Input */}
                  <div className="relative mb-4 mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search widgets and dashboards..."
                      value={librarySearchQuery}
                      onChange={(e) => setLibrarySearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setLibrarySearchQuery("");
                        }
                      }}
                      className="pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg touch-manipulation"
                      autoFocus
                    />
                    {librarySearchQuery && (
                      <button
                        onClick={() => setLibrarySearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Content area inside scrollable container */}
                  <div className="flex flex-col gap-6">
                  {/* Search Results Summary */}
                  {librarySearchQuery && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Found {filteredWidgets.length + filteredDashboards.length + filteredRecentItems.length} results for "{librarySearchQuery}"
                      </p>
                    </div>
                  )}

                  {/* Recent Items - Moved above tabs since they contain both widgets and dashboards */}
                  {(!librarySearchQuery || filteredRecentItems.length > 0) && recentItems.length > 0 && (
                    <div className="flex flex-col gap-3 mb-6">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Recently Viewed
                        {librarySearchQuery && (
                          <span className="ml-2 text-xs text-gray-500">({filteredRecentItems.length})</span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {(librarySearchQuery ? filteredRecentItems : recentItems).slice(0, 5).map((item: any) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 active:bg-gray-200 dark:active:bg-gray-500 touch-manipulation"
                            onClick={() => {
                              const dialog = document.getElementById('library-dialog');
                              if (dialog) dialog.style.display = 'none';
                              // For widgets, navigate to live widget page
                              if (item.type === 'widget') {
                                console.log("🔍 Recent item clicked - item:", item, "id:", item.id, "title:", item.title);
                                const route = getWidgetRoute(item);
                                console.log("🔍 Recent item route result:", route);
                                if (route) {
                                  console.log("🔍 Using recent item route:", route);
                                  setLocation(route);
                                } else {
                                  // Fallback to widget viewer with correct route format
                                  console.log("🔍 Recent item fallback - item:", item, "navigating to:", `/widgets/${item.id}`);
                                  setLocation(`/widgets/${item.id}`);
                                }
                              } else {
                                // For dashboards, show preview
                                setPreviewItem(item);
                                setPreviewType('dashboard');
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              {item.type === 'widget' ? (
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Monitor className="w-4 h-4 text-green-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.type}</p>
                              </div>
                            </div>
                            <Clock className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Navigation - Now below recently viewed */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button
                      onClick={() => setActiveLibraryTab("widgets")}
                      className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeLibraryTab === "widgets"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Widgets ({librarySearchQuery ? filteredWidgets.length : mobileWidgets.length})
                    </button>
                    <button
                      onClick={() => setActiveLibraryTab("dashboards")}
                      className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeLibraryTab === "dashboards"
                          ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Dashboards ({librarySearchQuery ? filteredDashboards.length : mobileDashboards.length})
                    </button>
                  </div>

                  {/* Widgets Tab Content */}
                  {activeLibraryTab === "widgets" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Mobile Widgets 
                          {librarySearchQuery ? (
                            <span className="ml-1">({filteredWidgets.length}/{mobileWidgets.length})</span>
                          ) : (
                            <span className="ml-1">({mobileWidgets.length})</span>
                          )}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWidget(null);
                            setWidgetStudioOpen(true);
                          }}
                          className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-xs">Create</span>
                        </Button>
                      </div>

                      {/* Navigation Controls for Widgets */}
                      {totalWidgetPages > 1 && (
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPrevWidgetPage}
                            disabled={currentWidgetPage === 0}
                            className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-xs">Previous</span>
                          </Button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {currentWidgetPage + 1} of {totalWidgetPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextWidgetPage}
                            disabled={currentWidgetPage >= totalWidgetPages - 1}
                            className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                          >
                            <span className="text-xs">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    
                    {(librarySearchQuery ? filteredWidgets.length > 0 : mobileWidgets.length > 0) ? (
                      <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {paginatedWidgets.map((widget: any) => (
                          <div
                            key={widget.id}
                            className="flex flex-col p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-all duration-200 active:scale-95 active:bg-blue-200 dark:active:bg-blue-800 touch-manipulation"
                            onClick={() => {
                              console.log("🔍 Widget clicked - widget:", widget, "id:", widget.id, "title:", widget.title);
                              addToRecent(widget, 'widget');
                              const dialog = document.getElementById('library-dialog');
                              if (dialog) dialog.style.display = 'none';
                              // Navigate to the actual widget page to show live widget
                              const route = getWidgetRoute(widget);
                              console.log("🔍 Widget route result:", route);
                              if (route) {
                                console.log("🔍 Using widget route:", route);
                                setLocation(route);
                              } else {
                                // Fallback to correct widget viewer format
                                console.log("🔍 Using fallback route:", `/widgets/${widget.id}`);
                                setLocation(`/widgets/${widget.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                {(() => {
                                  const IconComponent = getWidgetIcon(widget.type);
                                  return <IconComponent className="w-4 h-4 text-blue-600 flex-shrink-0" />;
                                })()}
                                <div className="text-left flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                                    {widget.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {widget.type}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewItem(widget);
                                  setPreviewType('widget');
                                }}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 ml-2"
                                title="Preview widget"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>

                          </div>
                        ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        {librarySearchQuery ? (
                          <>
                            <p className="text-sm">No widgets match your search</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm">No widgets yet</p>
                            <p className="text-xs mt-1">Create your first widget to get started</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Dashboards Tab Content */}
                  {activeLibraryTab === "dashboards" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Mobile Dashboards 
                          {librarySearchQuery ? (
                            <span className="ml-1">({filteredDashboards.length}/{mobileDashboards.length})</span>
                          ) : (
                            <span className="ml-1">({mobileDashboards.length})</span>
                          )}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDashboard(null);
                            setDashboardStudioOpen(true);
                          }}
                          className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-xs">Create</span>
                        </Button>
                      </div>

                      {/* Navigation Controls for Dashboards */}
                      {totalDashboardPages > 1 && (
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPrevDashboardPage}
                            disabled={currentDashboardPage === 0}
                            className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-xs">Previous</span>
                          </Button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Page {currentDashboardPage + 1} of {totalDashboardPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextDashboardPage}
                            disabled={currentDashboardPage >= totalDashboardPages - 1}
                            className="flex items-center gap-1 h-8 px-3 touch-manipulation"
                          >
                            <span className="text-xs">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {(librarySearchQuery ? filteredDashboards.length > 0 : mobileDashboards.length > 0) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {paginatedDashboards.map((dashboard: any) => (
                          <div
                            key={dashboard.id}
                            className="flex flex-col p-3 sm:p-4 bg-green-50 dark:bg-green-950 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 cursor-pointer transition-all duration-200 active:scale-95 active:bg-green-200 dark:active:bg-green-800 touch-manipulation"
                            onClick={() => {
                              addToRecent(dashboard, 'dashboard');
                              const dialog = document.getElementById('library-dialog');
                              if (dialog) dialog.style.display = 'none';
                              
                              // Handle Production Scheduler Dashboard specially
                              if (dashboard.title === "Production Scheduler Dashboard") {
                                setLocation('/production-scheduler-dashboard');
                              } else {
                                setLocation(`/dashboards/${dashboard.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                {(() => {
                                  const IconComponent = getDashboardIcon(dashboard.title, dashboard.description);
                                  return <IconComponent className="w-4 h-4 text-green-600 flex-shrink-0" />;
                                })()}
                                <div className="text-left flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                                    {dashboard.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {dashboard.description || 'Dashboard'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewItem(dashboard);
                                  setPreviewType('dashboard');
                                }}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 ml-2 touch-manipulation"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>

                          </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                          {librarySearchQuery ? (
                            <>
                              <p className="text-sm">No dashboards match your search</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">No dashboards yet</p>
                              <p className="text-xs mt-1">Create your first dashboard to get started</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {(librarySearchQuery ? 
                    (filteredWidgets.length === 0 && filteredDashboards.length === 0 && filteredRecentItems.length === 0) :
                    (mobileWidgets.length === 0 && mobileDashboards.length === 0)
                  ) && (
                    <div className="text-center py-8">
                      <Library className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      {librarySearchQuery ? (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{librarySearchQuery}"</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search terms</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400">No mobile widgets or dashboards available</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create some widgets or dashboards with mobile target platform</p>
                        </>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Add mobile-specific CSS overrides */}
      <style>{`
        .mobile-page-wrapper *,
        .mobile-page-wrapper *:before,
        .mobile-page-wrapper *:after {
          position: static !important;
          top: unset !important;
          left: unset !important;
          right: unset !important;
          bottom: unset !important;
          z-index: auto !important;
        }
        .mobile-page-wrapper .h-screen,
        .mobile-page-wrapper .min-h-screen,
        .mobile-page-wrapper .h-full,
        .mobile-page-wrapper .min-h-full {
          height: auto !important;
          min-height: auto !important;
        }
        .mobile-page-wrapper > div:first-child {
          height: auto !important;
          min-height: auto !important;
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
        }
        .mobile-page-wrapper .flex.flex-col.h-screen,
        .mobile-page-wrapper div[class*="h-screen"],
        .mobile-page-wrapper div[class*="min-h-screen"] {
          height: auto !important;
          min-height: auto !important;
        }
        .mobile-page-wrapper .bg-gray-50.dark\\:bg-gray-900 {
          background: transparent !important;
        }
        /* Ensure mobile header stays on top */
        .mobile-header {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 50 !important;
        }
      `}</style>

      {/* Main Content - Check route and render appropriate content */}
      {(() => {
        const shouldShowHome = location === "/" || location === "/mobile-home" || location === "/mobile";
        console.log("🔍 MobileHomePage - Location check result:", shouldShowHome, "for location:", location);
        return shouldShowHome;
      })() ? (
        <div key={`mobile-home-${location}`} className="flex-1 overflow-auto p-4 space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userProfile?.firstName || user?.username || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                action.action || action.title === "Dashboards" ? (
                  <Card 
                    key={action.title.toLowerCase().replace(/\s+/g, '-')}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`🎯 Quick action clicked: ${action.title}`, action);
                      if (action.action) {
                        console.log("🎯 Executing action function...");
                        // Use setTimeout to prevent immediate dialog close
                        setTimeout(() => {
                          action.action();
                        }, 10);
                      } else if (action.title === "Dashboards") {
                        console.log("🔍 Dashboards card clicked, setting showLibrary to true");
                        // Use setTimeout to ensure state change happens after any other handlers
                        setTimeout(() => {
                          const libraryDialog = document.getElementById('library-dialog');
                          if (libraryDialog) libraryDialog.style.display = 'block';
                        }, 0);
                      }
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3 relative`}>
                        <action.icon className="w-6 h-6" />
                        {action.badge && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {action.title}
                      </h3>
                    </CardContent>
                  </Card>
                ) : (
                  <Link key={action.path} href={action.path}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3 relative`}>
                          <action.icon className="w-6 h-6" />
                          {action.badge && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {action.title}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                )
              ))}
            </div>

            {/* Priority Tasks */}
            {highPriorityTasks.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Priority Tasks
                    </h2>
                    <Badge variant="destructive">{highPriorityTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {highPriorityTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {task.dueDate}
                          </p>
                        </div>
                        <Badge className={`ml-2 ${getPriorityColor(task.priority)}`} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {highPriorityTasks.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setLocation("/tasks")}>
                      View All Tasks ({highPriorityTasks.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Notifications */}
            {unreadNotifications.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      Recent Alerts
                    </h2>
                    <Badge variant="secondary">{unreadNotifications.length} new</Badge>
                  </div>
                  <div className="space-y-2">
                    {unreadNotifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {unreadNotifications.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setLocation("/inbox")}>
                      View All Notifications ({unreadNotifications.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {tasks.filter(t => t.status === "completed").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completed Today
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {pendingTasks.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pending Tasks
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      ) : (
        // For other routes, render them underneath the mobile header
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <MobilePageContent location={location} />
        </div>
      )}

      {/* Max AI Fly-out Panel - Full Screen Overlay */}
          {maxPanelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMaxPanelOpen(false)}
          />
          
          {/* Panel - Full screen covering header completely */}
          <div className="absolute inset-0 w-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            {/* Single Consolidated Header with Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                
                {/* Input Box in Header */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={isSearchFocused ? "Search or ask Max" : "Search or ask Max"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        // Handle search or AI prompt
                        if (searchQuery.toLowerCase().includes('max') || searchQuery.includes('?') || searchQuery.includes('how') || searchQuery.includes('what') || searchQuery.includes('show') || searchQuery.includes('create')) {
                          // This looks like an AI prompt
                          await handleAIPrompt(searchQuery);
                          setSearchQuery(""); // Clear after sending
                        } else {
                          // This looks like a search
                          console.log('Search:', searchQuery);
                          // TODO: Perform search functionality
                          alert(`Searching for: ${searchQuery}`);
                          setSearchQuery(""); // Clear after searching
                        }
                      }
                    }}
                    className="pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-center placeholder:text-center"
                    style={{ textAlign: searchQuery ? 'left' : 'center' }}
                  />
                </div>

                {/* Header Controls */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-8 w-8"
                  onClick={() => setShowMaxSettings(!showMaxSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMaxPanelOpen(false)}
                  className="p-2 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {showMaxSettings && (
              <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Max AI Settings</h3>
                <div className="space-y-4">
                  {/* AI Theme Colors */}
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 block mb-2">AI Theme</span>
                    <div className="flex gap-2">
                      <button className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white dark:border-gray-600"></button>
                      <button className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 border border-gray-300 dark:border-gray-600"></button>
                      <button className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 border border-gray-300 dark:border-gray-600"></button>
                      <button className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 border border-gray-300 dark:border-gray-600"></button>
                      <button className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 border border-gray-300 dark:border-gray-600"></button>
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Voice Response</span>
                    <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option>Alloy (Default)</option>
                      <option>Echo</option>
                      <option>Fable</option>
                      <option>Onyx</option>
                      <option>Nova</option>
                      <option>Shimmer</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Voice Speed</span>
                    <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option>Normal</option>
                      <option>Slow</option>
                      <option>Fast</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Voice</span>
                    <input type="checkbox" className="rounded" />
                  </div>

                  {/* Response Settings */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Response Speed</span>
                    <select className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option>Balanced</option>
                      <option>Fast</option>
                      <option>Detailed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Action Buttons</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-create Widgets</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <button 
                    className="w-full text-xs bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700"
                    onClick={() => setShowMaxSettings(false)}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isMaxLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Max is thinking...</span>
                </div>
              ) : maxResponse ? (
                <div className="space-y-4">
                  {/* AI Response */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {maxResponse.message}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {maxResponse.actions && maxResponse.actions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Quick Actions</h3>
                      {maxResponse.actions.map((action: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            // Handle action clicks
                            if (action === 'show_widget' && maxResponse.data?.type === 'widget') {
                              // Show widget creation studio instead
                              setWidgetStudioOpen(true);
                            } else if (action === 'create_dashboard') {
                              setLocation('/dashboard'); // Navigate to dashboard
                            } else if (action === 'show_production') {
                              setLocation('/production-cockpit');
                            } else if (action === 'show_schedule') {
                              setLocation('/scheduling');
                            }
                            setMaxPanelOpen(false);
                          }}
                        >
                          {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Widget Preview */}
                  {maxResponse.data && maxResponse.data.type === 'widget' && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {maxResponse.data.title}
                      </h3>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Widget Type: {maxResponse.data.type}
                      </div>
                      {maxResponse.data.content?.widgets && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Components:</div>
                          <div className="flex flex-wrap gap-1">
                            {maxResponse.data.content.widgets.map((widget: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {widget.replace('-', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Max is ready to help!</p>
                </div>
              )}
            </div>

            {/* Footer with tip */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Use the search box in the header to continue chatting with Max
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Widget Design Studio for Mobile - only render when explicitly open */}
      {widgetStudioOpen && (
        <WidgetDesignStudio
          open={widgetStudioOpen}
          onOpenChange={setWidgetStudioOpen}
          onWidgetCreate={handleCreateWidget}
          editingWidget={editingWidget}
          mode={editingWidget ? 'edit' : 'create'}
        />
      )}

      {/* Design Studio - integrated design system */}
      <DesignStudio
        open={designStudioOpen}
        onOpenChange={setDesignStudioOpen}
      />

      {/* AI Design Studio Mobile - for preview functionality - only show when preview is active */}
      {(previewItem && previewType) && (
        <AiDesignStudioMobile
          previewItem={previewItem}
          previewType={previewType}
          onClosePreview={() => {
            setPreviewItem(null);
            setPreviewType(null);
          }}
        />
      )}
    </div>
  );
}