import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, Plus, Grid3X3, Sparkles, ChevronRight, Target, Package,
  Calendar, Users, BarChart3, Settings, TrendingUp, Factory,
  Database, Shield, FileText, MessageSquare, Clock, Activity,
  Wrench, Truck, DollarSign, UserCheck, Phone, Lightbulb,
  Gauge, LineChart, PieChart, MapPin, Bell, Zap, Layers,
  Menu, X, LogOut, Briefcase, Brain, AlertTriangle, Server,
  Puzzle, Layout, FileSearch, Columns3, BookOpen, GraduationCap,
  Presentation
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

interface Widget {
  id: number;
  title: string;
  type: string;
  description?: string;
  icon?: React.ComponentType<any>;
  route?: string;
}

interface Dashboard {
  id: number;
  title: string;
  description: string;
  widgetCount?: number;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'kpi': Gauge,
  'chart': LineChart,
  'gauge': PieChart,
  'gantt': Calendar,
  'list': Grid3X3,
  'map': MapPin,
  'resource-assignment': Users,
  'operation-dispatch': Activity,
  'schedule-optimizer': Target,
  'operation-sequencer': Layers,
  'production-metrics': Factory,
  'equipment-status': Wrench,
  'quality-dashboard': Shield,
  'inventory-tracking': Package,
};

export default function DesktopHome() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setMaxOpen } = useMaxDock();
  const [, setLocation] = useLocation();

  // Fetch widgets
  const { data: widgets = [] } = useQuery<Widget[]>({
    queryKey: ['/api/mobile/widgets'],
    queryFn: async () => {
      const response = await fetch('/api/mobile/widgets');
      if (!response.ok) throw new Error('Failed to fetch widgets');
      const data = await response.json();
      return data.map((w: any) => ({
        ...w,
        icon: iconMap[w.type] || Grid3X3
      }));
    }
  });

  // Fetch dashboards
  const { data: dashboards = [] } = useQuery<Dashboard[]>({
    queryKey: ['/api/mobile/dashboards'],
  });

  const quickActions = [
    { icon: Calendar, label: "Schedule", route: "/production-schedule", color: "bg-blue-500" },
    { icon: BarChart3, label: "Analytics", route: "/analytics", color: "bg-green-500" },
    { icon: Factory, label: "Shop Floor", route: "/shop-floor", color: "bg-orange-500" },
    { icon: FileText, label: "Reports", route: "/reports", color: "bg-purple-500" },
    { icon: Database, label: "Data", route: "/data-schema", color: "bg-red-500" },
    { icon: Settings, label: "Settings", route: "/settings", color: "bg-gray-500" },
  ];

  const pages = [
    // Planning & Scheduling
    { title: "Production Schedule", icon: Calendar, route: "/production-schedule", category: "Planning" },
    { title: "Optimization Studio", icon: Target, route: "/optimization-studio", category: "Planning" },
    { title: "Resource Planning", icon: Users, route: "/resources", category: "Planning" },
    { title: "Scheduling History", icon: Clock, route: "/scheduling-history", category: "Planning" },
    
    // Operations
    { title: "Shop Floor", icon: Factory, route: "/shop-floor", category: "Operations" },
    { title: "Operator Dashboard", icon: Activity, route: "/operator-dashboard", category: "Operations" },
    { title: "Maintenance", icon: Wrench, route: "/maintenance", category: "Operations" },
    { title: "Quality Control", icon: Shield, route: "/quality", category: "Operations" },
    
    // Analytics
    { title: "Analytics", icon: BarChart3, route: "/analytics", category: "Analytics" },
    { title: "KPI Dashboard", icon: TrendingUp, route: "/kpi", category: "Analytics" },
    { title: "Reports", icon: FileText, route: "/reports", category: "Analytics" },
    { title: "Widget Studio", icon: Lightbulb, route: "/widget-studio", category: "Analytics" },
    
    // Supply Chain
    { title: "Inventory", icon: Package, route: "/inventory", category: "Supply Chain" },
    { title: "Purchasing", icon: Truck, route: "/purchasing", category: "Supply Chain" },
    { title: "Sales", icon: DollarSign, route: "/sales", category: "Supply Chain" },
    { title: "ATP/CTP", icon: Target, route: "/atp-ctp", category: "Supply Chain" },
  ];

  const filteredWidgets = widgets.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDashboards = dashboards.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Hamburger Menu Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="ghost"
          size="icon"
          className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Menu - Same structure as mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar Panel */}
          <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{(user?.firstName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.firstName || user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setSidebarOpen(false);
                    }}
                    className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSidebarOpen(false)}
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
                        setSidebarOpen(false);
                        setLocation('/production-schedule');
                      }}
                    >
                      <BarChart3 className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Production Schedule</span>
                    </div>
                    <Link href="/optimize-orders" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                      <Sparkles className="w-5 h-5 text-amber-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Order Optimization</span>
                    </Link>
                    <Link href="/capacity-planning" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Briefcase className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Capacity Planning</span>
                    </Link>
                    <Link href="/production-planning" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Target className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Production Planning</span>
                    </Link>
                  </div>
                </div>

                {/* AI & Optimization */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI & Optimization</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/optimization-studio" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Optimization Studio</span>
                    </Link>
                    <Link href="/demand-forecasting" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Brain className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Demand Planning</span>
                    </Link>
                    <Link href="/inventory-optimization" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                      <Package className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Inventory Optimization</span>
                    </Link>
                  </div>
                </div>

                {/* Operations */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Operations</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/shop-floor" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                      <Factory className="w-5 h-5 text-orange-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Shop Floor</span>
                    </Link>
                    <Link href="/operator-dashboard" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors">
                      <Settings className="w-5 h-5 text-gray-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Operator Dashboard</span>
                    </Link>
                    <Link href="/maintenance" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                      <Wrench className="w-5 h-5 text-yellow-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Maintenance</span>
                    </Link>
                    <Link href="/disruption-management" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-red-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Disruption Management</span>
                    </Link>
                  </div>
                </div>

                {/* Management & Administration */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Management & Administration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/systems-management-dashboard" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors">
                      <Server className="w-5 h-5 text-slate-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Systems Management</span>
                    </Link>
                    <Link href="/user-access-management" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Shield className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">User Management</span>
                    </Link>
                    <Link href="/widgets" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Puzzle className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Widgets</span>
                    </Link>
                    <Link href="/dashboards" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Layout className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Dashboards</span>
                    </Link>
                  </div>
                </div>

                {/* Data Management */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Management</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/data-schema" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Database className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Data Schema</span>
                    </Link>
                    <Link href="/data-import" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Database className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Data Import</span>
                    </Link>
                    <Link href="/table-field-viewer" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors">
                      <FileText className="w-5 h-5 text-slate-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Table Documentation</span>
                    </Link>
                    <Link href="/error-logs" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <FileSearch className="w-5 h-5 text-red-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Error Logs</span>
                    </Link>
                  </div>
                </div>

                {/* Communication & Collaboration */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Communication & Collaboration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/visual-factory" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <Factory className="w-5 h-5 text-indigo-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Visual Factory</span>
                    </Link>
                    <Link href="/chat" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <MessageSquare className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Chat</span>
                    </Link>
                    <Link href="/boards" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Columns3 className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Boards</span>
                    </Link>
                    <Link href="/feedback" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                      <MessageSquare className="w-5 h-5 text-orange-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Feedback</span>
                    </Link>
                  </div>
                </div>

                {/* Training & Support */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Training & Support</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/help" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                      <BookOpen className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Getting Started</span>
                    </Link>
                    <Link href="/training" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <GraduationCap className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs text-center text-gray-700 dark:text-gray-300">Training</span>
                    </Link>
                    <Link href="/presentation-system" onClick={() => setSidebarOpen(false)} className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
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

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 mt-2">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="ml-12"> {/* Add left margin to avoid overlap with hamburger menu */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName || user?.username || 'User'}!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your AI-powered manufacturing command center
              </p>
            </div>
            <div className="flex items-center gap-4 mr-12"> {/* Add right margin for theme toggle */}
              <Button 
                onClick={() => setMaxOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask Max AI
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search widgets, dashboards, or pages..."
            className="pl-10 pr-4 py-3 text-lg w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.route}>
              <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-105">
                <CardContent className="p-4 text-center">
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8 grid lg:grid-cols-3 gap-6">
        {/* Widgets Section */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Widget Library</h2>
            <Link href="/widget-studio">
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </Link>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredWidgets.slice(0, 8).map((widget) => (
              <Link key={widget.id} href={`/widgets/${widget.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-102">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {widget.icon && <widget.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{widget.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {widget.type} widget
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {widgets.length > 8 && (
              <Link href="/widgets">
                <Button variant="outline" className="w-full">
                  View All {widgets.length} Widgets
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Dashboards Section */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboards</h2>
            <Badge variant="outline">{dashboards.length} Available</Badge>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredDashboards.map((dashboard) => (
              <Link key={dashboard.id} href={`/dashboards/${dashboard.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-102">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{dashboard.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {dashboard.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {dashboards.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Layers className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No dashboards created yet
                  </p>
                  <Button size="sm" variant="outline" className="mt-3">
                    Create Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Pages Section */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Pages</h2>
            <Badge variant="outline">{pages.length} Pages</Badge>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {Object.entries(
              filteredPages.reduce((acc, page) => {
                if (!acc[page.category]) acc[page.category] = [];
                acc[page.category].push(page);
                return acc;
              }, {} as Record<string, typeof pages>)
            ).map(([category, categoryPages]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                  {category}
                </h4>
                <div className="space-y-2 mb-4">
                  {categoryPages.map((page) => (
                    <Link key={page.route} href={page.route}>
                      <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-102">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <page.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {page.title}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}