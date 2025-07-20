import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Factory, Briefcase, ServerCog, BarChart3, FileText, Bot, Send, Columns3, Sparkles, Menu, X, Smartphone, DollarSign, Headphones, Settings, Wrench, MessageSquare, Book, Truck, ChevronDown, Target, Database, Building, Server, TrendingUp, LogOut, User, Shield, GraduationCap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import JobForm from "./job-form";
import ResourceForm from "./resource-form";
import { RoleSwitcher } from "./role-switcher";
import type { Capability } from "@shared/schema";

export default function Sidebar() {
  const [location] = useLocation();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [aiActionsDialogOpen, setAiActionsDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiActionsPrompt, setAiActionsPrompt] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Authentication hooks
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  // Check for scroll indicator on mount and resize
  useEffect(() => {
    const checkScrollIndicator = () => {
      if (navRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = navRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 10);
      }
    };

    checkScrollIndicator();
    window.addEventListener('resize', checkScrollIndicator);
    
    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', checkScrollIndicator);
    }

    return () => {
      window.removeEventListener('resize', checkScrollIndicator);
      if (navElement) {
        navElement.removeEventListener('scroll', checkScrollIndicator);
      }
    };
  }, []);

  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { command: prompt });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Max",
        description: data.message,
      });
      
      // Handle special frontend actions - same as AI Agent component
      if (data.actions?.includes("SET_GANTT_ZOOM")) {
        const event = new CustomEvent('aiGanttZoom', { detail: { zoomLevel: data.data.zoomLevel } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SET_GANTT_SCROLL")) {
        const event = new CustomEvent('aiGanttScroll', { detail: { scrollPosition: data.data.scrollPosition } });
        window.dispatchEvent(event);
      }
      if (data.actions?.includes("SCROLL_TO_TODAY")) {
        const event = new CustomEvent('aiScrollToToday', { detail: {} });
        window.dispatchEvent(event);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process AI command",
        variant: "destructive",
      });
    },
  });

  const aiActionsMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { 
        command: `Configure quick actions: ${prompt}`,
        action: "CONFIGURE_QUICK_ACTIONS"
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Actions Configuration",
        description: data.message || "Quick actions configured successfully",
      });
      setAiActionsDialogOpen(false);
      setAiActionsPrompt("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to configure quick actions with AI",
        variant: "destructive",
      });
    },
  });

  const handleAiPrompt = () => {
    if (aiPrompt.trim()) {
      aiMutation.mutate(aiPrompt);
      setAiPrompt("");
    }
  };

  const handleAiActionsPrompt = () => {
    if (aiActionsPrompt.trim()) {
      aiActionsMutation.mutate(aiActionsPrompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAiPrompt();
    }
  };

  const handleAiActionsKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAiActionsPrompt();
    }
  };

  const navigationItems = [
    { icon: TrendingUp, label: "Business Goals", href: "/business-goals", active: location === "/business-goals", feature: "business-goals", action: "view" },
    { icon: BarChart3, label: "Schedule", href: "/", active: location === "/", feature: "schedule", action: "view" },
    { icon: Target, label: "Optimize Orders", href: "/scheduling-optimizer", active: location === "/scheduling-optimizer", feature: "scheduling-optimizer", action: "view" },
    { icon: Briefcase, label: "Capacity Planning", href: "/capacity-planning", active: location === "/capacity-planning", feature: "capacity-planning", action: "view" },
    { icon: Smartphone, label: "Shop Floor", href: "/shop-floor", active: location === "/shop-floor", feature: "shop-floor", action: "view" },
    { icon: Settings, label: "Operator", href: "/operator", active: location === "/operator", feature: "operator-dashboard", action: "view" },
    { icon: Truck, label: "Forklift Driver", href: "/forklift", active: location === "/forklift", feature: "forklift-driver", action: "view" },
    { icon: Wrench, label: "Maintenance", href: "/maintenance", active: location === "/maintenance", feature: "maintenance", action: "view" },
    { icon: Building, label: "Plant Manager", href: "/plant-manager", active: location === "/plant-manager", feature: "plant-manager", action: "view" },
    { icon: Server, label: "Systems Management", href: "/systems-management", active: location === "/systems-management", feature: "systems-management", action: "view" },
    { icon: Shield, label: "Role Management", href: "/role-management", active: location === "/role-management", feature: "user-management", action: "view" },
    { icon: GraduationCap, label: "Training", href: "/training", active: location === "/training", feature: "training", action: "view" },
    { icon: Columns3, label: "Boards", href: "/boards", active: location === "/boards", feature: "boards", action: "view" },
    { icon: Database, label: "ERP Import", href: "/erp-import", active: location === "/erp-import", feature: "erp-import", action: "view" },
    { icon: DollarSign, label: "Sales", href: "/sales", active: location === "/sales", feature: "sales", action: "view" },
    { icon: Headphones, label: "Customer Service", href: "/customer-service", active: location === "/customer-service", feature: "customer-service", action: "view" },
    { icon: BarChart3, label: "Analytics", href: "/analytics", active: location === "/analytics", feature: "analytics", action: "view" },
    { icon: FileText, label: "Reports", href: "/reports", active: location === "/reports", feature: "reports", action: "view" },
    { icon: MessageSquare, label: "Feedback", href: "/feedback", active: location === "/feedback", feature: "feedback", action: "view" },
    { icon: Bot, label: "Max", href: "/ai-assistant", active: location === "/ai-assistant", feature: "ai-assistant", action: "view" },
  ].filter(item => 
    // Always show Schedule dashboard for authenticated users
    item.href === "/" || 
    // Show item if user has permission
    hasPermission(item.feature || "", item.action || "")
  );

  const getNavigationTooltip = (href: string) => {
    const tooltips = {
      "/business-goals": "Define strategic objectives, track progress, and monitor risks that impact business success",
      "/": "View production schedule with interactive Gantt charts",
      "/scheduling-optimizer": "Optimize orders with intelligent scheduling and multi-operation planning",
      "/capacity-planning": "Plan and optimize production capacity including staffing, shifts, and equipment",
      "/shop-floor": "Mobile-optimized interface for production schedulers on the floor",
      "/operator": "Review upcoming operations and report status or problems",
      "/forklift": "Material movement tracking for forklift drivers",
      "/maintenance": "Plan and manage resource maintenance schedules and work orders",
      "/plant-manager": "Comprehensive plant operations oversight and strategic decision-making",
      "/systems-management": "Monitor system health, manage users, and oversee IT infrastructure",
      "/role-management": "Define user roles and specify feature permissions for different user types",
      "/training": "Interactive training modules and role demonstrations for comprehensive system training",
      "/boards": "Organize jobs, operations, and resources with drag-and-drop boards",
      "/erp-import": "Import and manage data from external ERP systems with issue tracking",
      "/sales": "Manage sales leads, orders, and customer relationships",
      "/customer-service": "Handle customer orders, issues, and support requests",
      "/analytics": "View production metrics and performance analytics",
      "/reports": "Generate detailed production reports and insights",
      "/feedback": "Submit feedback and suggestions to help improve the system",
      "/ai-assistant": "Chat with Max for schedule optimization and analysis"
    };
    return tooltips[href] || "Navigate to this page";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <h1 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
          <Factory className="text-primary mr-2" size={20} />
          PlanetTogether
        </h1>
      </div>
      
      <div className="flex-1 relative min-h-0">
        <nav ref={navRef} className="h-full p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <a
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap ${
                      item.href === "/ai-assistant"
                        ? item.active
                          ? "text-white bg-gradient-to-r from-purple-500 to-pink-500 border-l-4 border-purple-600"
                          : "text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500"
                        : item.active
                          ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                          : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{getNavigationTooltip(item.href)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-1">
            <div className="animate-bounce">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
        {/* User Info Section */}
        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-800">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Roles: {user.roles?.map(role => role.name).join(", ") || "No roles"}
            </div>
            <RoleSwitcher userId={user.id} />
          </div>
        )}
        
        <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setJobDialogOpen(true)}
                className="w-full justify-start text-xs md:text-sm"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                New Job
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Create a new production job</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setResourceDialogOpen(true)}
                className="w-full justify-start text-xs md:text-sm"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                New Resource
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add a new manufacturing resource</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAiActionsDialogOpen(true)}
                className="w-full justify-start text-xs md:text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                AI Actions
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Configure AI-powered quick actions</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/email-settings">
                <a
                  className="flex items-center px-3 py-2 rounded-lg transition-colors text-sm md:text-base w-full text-gray-600 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Email Settings
                </a>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Configure AWS SES for email notifications</p>
            </TooltipContent>
          </Tooltip>

        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Ask Max..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-xs md:text-sm"
              disabled={aiMutation.isPending}
            />
            <Button
              onClick={handleAiPrompt}
              disabled={aiMutation.isPending || !aiPrompt.trim()}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 hover:from-purple-600 hover:to-pink-600"
            >
              {aiMutation.isPending ? (
                <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white shadow-lg">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-white shadow-lg border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            capabilities={capabilities} 
            onSuccess={() => setResourceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* AI Actions Dialog */}
      <Dialog open={aiActionsDialogOpen} onOpenChange={setAiActionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Configure AI Actions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the quick actions you want to configure:
              </label>
              <Input
                value={aiActionsPrompt}
                onChange={(e) => setAiActionsPrompt(e.target.value)}
                onKeyPress={handleAiActionsKeyPress}
                placeholder="e.g., New buttons for common maintenance tasks and priority job creation..."
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAiActionsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAiActionsPrompt}
                disabled={!aiActionsPrompt.trim() || aiActionsMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {aiActionsMutation.isPending ? "Configuring..." : "Configure with AI"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
