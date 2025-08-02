import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useDeviceType } from "@/hooks/useDeviceType";
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
  Activity
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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${showMaxPane ? 'flex flex-col' : ''}`}>
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <img 
              src={CompanyLogoImage} 
              alt="Company Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Home */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setLocation("/")}
            >
              <Home className="w-5 h-5" />
            </Button>

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
              className={`p-2 ${showMaxPane ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white hover:from-purple-600 hover:to-pink-600`}
              onClick={() => setShowMaxPane(!showMaxPane)}
            >
              <Bot className="w-5 h-5" />
            </Button>

            {/* User Avatar & Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.username || ""} />
                    <AvatarFallback>
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/account")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.path} onClick={() => setLocation(item.path)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${showMaxPane ? 'flex-1 flex flex-col' : 'p-4 space-y-6'}`}>
        {showMaxPane ? (
          <>
            {/* Canvas Area - Top */}
            <div className="flex-1 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Canvas Area</p>
                  <p className="text-xs text-muted-foreground">Visualizations will appear here</p>
                </div>
              </div>
            </div>
            
            {/* Max Pane - Bottom */}
            <div className="h-80 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <MaxSidebar />
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