import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useViewMode } from "@/hooks/use-view-mode";
import { MaxSidebar } from "@/components/max-sidebar";
import CompanyLogoImage from "@/assets/company-logo.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  TrendingUp,
  Activity,
  Library,
  BarChart3,
  Monitor,
  Smartphone,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

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

export default function MobileHomePage() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMaxPane, setShowMaxPane] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const { currentView, toggleView, isForced } = useViewMode();

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
    queryKey: ["mobile-dashboards"], 
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
      return allDashboards;
    }
  });

  // Recent items tracking
  const getRecentItems = () => {
    const recent = localStorage.getItem('mobileRecentItems');
    return recent ? JSON.parse(recent) : [];
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
      title: "My Tasks",
      icon: CheckSquare,
      path: "/tasks",
      color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
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
                      <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 force-mobile-view fixed inset-0 w-full h-full overflow-y-auto z-[9999]">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo/Brand - Clickable to go home */}
          <div className="flex items-center">
            <img 
              src={CompanyLogoImage} 
              alt="Company Logo" 
              className="h-8 w-8 object-contain cursor-pointer"
              onClick={() => {
                // Close Max pane and reset to clean home state
                setShowMaxPane(false);
                setShowSearch(false);
                setSearchQuery("");
                setShowLibrary(false);
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Dialog open={showSearch} onOpenChange={setShowSearch}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Search className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search dashboards, widgets, reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Enter keywords to search across the platform
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Max AI Assistant */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowMaxPane(!showMaxPane)}
            >
              <Bot className="w-5 h-5" />
            </Button>



            {/* Mobile Library */}
            <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Library className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Mobile Library</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Recent Items */}
                  {recentItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recently Viewed</h3>
                      <div className="space-y-2">
                        {recentItems.slice(0, 5).map((item: any) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={() => {
                              setLocation(item.type === 'widget' ? `/widgets/${item.id}` : `/dashboards/${item.id}`);
                              setShowLibrary(false);
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

                  {/* Debug info */}
                  <div className="p-2 mb-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <p>Widgets: {mobileWidgets.length}</p>
                    <p>Dashboards: {mobileDashboards.length}</p>
                    <p>Recent Items: {recentItems.length}</p>
                  </div>

                  {/* Mobile Widgets */}
                  {mobileWidgets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Mobile Widgets ({mobileWidgets.length})</h3>
                      <div className="space-y-2">
                        {mobileWidgets.map((widget: any) => (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => {
                              addToRecent(widget, 'widget');
                              setLocation(`/widgets/${widget.id}`);
                              setShowLibrary(false);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <BarChart3 className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{widget.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{widget.type}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Widget</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mobile Dashboards */}
                  {mobileDashboards.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Mobile Dashboards ({mobileDashboards.length})</h3>
                      <div className="space-y-2">
                        {mobileDashboards.map((dashboard: any) => (
                          <div
                            key={dashboard.id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900"
                            onClick={() => {
                              addToRecent(dashboard, 'dashboard');
                              setLocation(`/dashboards/${dashboard.id}`);
                              setShowLibrary(false);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <Monitor className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{dashboard.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{dashboard.description || 'Dashboard'}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Dashboard</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {mobileWidgets.length === 0 && mobileDashboards.length === 0 && (
                    <div className="text-center py-8">
                      <Library className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No mobile widgets or dashboards available</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create some widgets or dashboards with mobile target platform</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {/* User Info Section */}
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.username || ""} />
                      <AvatarFallback>
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* User Actions */}
                <DropdownMenuItem onClick={() => setLocation("/account")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* View Mode Toggle */}
                <DropdownMenuItem onClick={toggleView}>
                  {currentView === "mobile" ? (
                    <>
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Switch to Desktop View</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      <span>Switch to Mobile View</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Navigation Items */}
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.path} onClick={() => setLocation(item.path)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                
                {/* Logout */}
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${showMaxPane ? 'flex-1 flex flex-col' : 'p-4 space-y-6'}`}>
        {showMaxPane ? (
          <>
            {/* Max Pane - Top */}
            <div className="h-80 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <MaxSidebar />
            </div>
            
            {/* Canvas Area - Bottom */}
            <div className="flex-1 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Canvas Area</p>
                  <p className="text-xs text-muted-foreground">Visualizations will appear here</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 space-y-6">
            {/* Welcome Section */}
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.username}!
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
        )}
      </div>
    </div>
  );
}