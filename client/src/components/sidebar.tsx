import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Factory, Briefcase, ServerCog, BarChart3, FileText, Bot, Send, Columns3, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JobForm from "./job-form";
import ResourceForm from "./resource-form";
import type { Capability } from "@shared/schema";

export default function Sidebar() {
  const [location] = useLocation();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [aiActionsDialogOpen, setAiActionsDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiActionsPrompt, setAiActionsPrompt] = useState("");
  const { toast } = useToast();

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

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
    { icon: BarChart3, label: "Schedule", href: "/", active: location === "/" },
    { icon: Columns3, label: "Boards", href: "/boards", active: location === "/boards" },
    { icon: BarChart3, label: "Analytics", href: "/analytics", active: location === "/analytics" },
    { icon: FileText, label: "Reports", href: "/reports", active: location === "/reports" },
    { icon: Bot, label: "Max", href: "/ai-assistant", active: location === "/ai-assistant" },
  ];

  const getNavigationTooltip = (href: string) => {
    const tooltips = {
      "/": "View production schedule with interactive Gantt charts",
      "/boards": "Organize jobs, operations, and resources with drag-and-drop boards",
      "/analytics": "View production metrics and performance analytics",
      "/reports": "Generate detailed production reports and insights",
      "/ai-assistant": "Chat with Max for schedule optimization and analysis"
    };
    return tooltips[href] || "Navigate to this page";
  };

  return (
    <TooltipProvider>
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <Factory className="text-primary mr-2" size={24} />
            PlanetTogether
          </h1>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <a
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      item.href === "/ai-assistant"
                        ? item.active
                          ? "text-white bg-gradient-to-r from-purple-500 to-pink-500 border-l-4 border-purple-600"
                          : "text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500"
                        : item.active
                          ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                          : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </a>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{getNavigationTooltip(item.href)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="w-full bg-primary hover:bg-blue-700 text-white"
                  onClick={() => setJobDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Create a new production job with priority and deadline</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="w-full bg-primary hover:bg-blue-700 text-white"
                  onClick={() => setResourceDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Resource
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Add a new machine, operator, or facility to the system</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  onClick={() => setAiActionsDialogOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Actions
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Configure quick actions using AI - customize your workflow buttons</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Max</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Ask AI about late jobs..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleAiPrompt}
                    disabled={!aiPrompt.trim() || aiMutation.isPending}
                    className="px-3"
                  >
                    {aiMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Send AI command to analyze schedule and create views</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
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
