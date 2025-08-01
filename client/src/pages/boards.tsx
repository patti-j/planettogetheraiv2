import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Maximize2, Minimize2, ChevronDown, Plus, Settings, Users, Briefcase, Wrench, Sparkles, Columns3 } from "lucide-react";

import KanbanBoard from "@/components/kanban-board";
import KanbanConfigManager from "@/components/kanban-config-manager";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { type Job, type Operation, type Resource, type KanbanConfig, type Capability } from "@shared/schema";

export default function Boards() {
  const isMobile = useIsMobile();
  const [isMaximized, setIsMaximized] = useState(false);
  const { isMaxOpen } = useMaxDock();
  
  // Automatically maximize on mobile devices and keep it maximized
  useEffect(() => {
    if (isMobile && !isMaximized) {
      setIsMaximized(true);
    }
  }, [isMobile]);
  
  // Prevent minimizing on mobile
  const handleToggleMaximize = () => {
    if (isMobile) {
      // Don't allow minimizing on mobile
      return;
    }
    setIsMaximized(!isMaximized);
  };
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const { toast } = useToast();
  const { aiTheme } = useAITheme();

  // AI Event Listeners for form opening
  useEffect(() => {
    const handleAIOpenJobForm = () => {
      setJobDialogOpen(true);
      toast({
        title: "Job Form Opened",
        description: "Ready to create a new job"
      });
    };

    const handleAIOpenResourceForm = () => {
      setResourceDialogOpen(true);
      toast({
        title: "Resource Form Opened",
        description: "Ready to create a new resource"
      });
    };

    const handleAIOpenOperationForm = () => {
      // Operation forms are handled within job forms in this page
      setJobDialogOpen(true);
      toast({
        title: "Job Form Opened",
        description: "You can add operations within the job form"
      });
    };

    window.addEventListener('aiOpenJobForm', handleAIOpenJobForm);
    window.addEventListener('aiOpenResourceForm', handleAIOpenResourceForm);
    window.addEventListener('aiOpenOperationForm', handleAIOpenOperationForm);

    return () => {
      window.removeEventListener('aiOpenJobForm', handleAIOpenJobForm);
      window.removeEventListener('aiOpenResourceForm', handleAIOpenResourceForm);
      window.removeEventListener('aiOpenOperationForm', handleAIOpenOperationForm);
    };
  }, [toast]);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ['/api/capabilities'],
  });

  const { data: kanbanConfigs = [] } = useQuery<KanbanConfig[]>({
    queryKey: ['/api/kanban-configs'],
  });

  // Load selected config
  const selectedConfig = kanbanConfigs.find(c => c.id === selectedConfigId) || kanbanConfigs.find(c => c.isDefault);

  const handleConfigSelect = (configId: number) => {
    setSelectedConfigId(configId);
    toast({
      title: "Board configuration changed",
      description: `Switched to ${kanbanConfigs.find(c => c.id === configId)?.name} board`,
    });
  };

  // AI Board Creation
  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return await apiRequest("POST", "/api/ai-agent", { 
        command: `Create board configurations: ${prompt}`,
        action: "CREATE_KANBAN_BOARDS"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "AI Board Creation",
        description: "Board configurations created successfully",
      });
      setAiDialogOpen(false);
      setAiPrompt("");
      // Refresh kanban configs
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create board configurations with AI",
        variant: "destructive",
      });
    },
  });

  const handleAICreate = () => {
    if (aiPrompt.trim()) {
      aiMutation.mutate(aiPrompt);
    }
  };

  const PageContent = () => (
    <div className="flex-1 flex flex-col relative">
      {/* Maximize/Minimize button - Fixed position in top-right corner */}
      {!isMobile && (
        <button
          onClick={handleToggleMaximize}
          className="fixed top-2 right-2 z-10 bg-white shadow-md hover:shadow-lg border border-gray-200 rounded-md p-2 transition-all duration-200"
          title={isMaximized ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <Columns3 className="w-6 h-6 mr-2" />
              Boards
            </h1>
            <p className="text-sm md:text-base text-gray-600">Organize jobs, operations, and resources using customizable board views</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden bg-white">
        <KanbanBoard
          jobs={jobs}
          operations={operations}
          resources={resources}
          capabilities={capabilities}
          selectedConfig={selectedConfig}
          onConfigChange={handleConfigSelect}
          kanbanConfigs={kanbanConfigs}
          isMaximized={isMaximized}
          onCreateJob={() => setJobDialogOpen(true)}
          onCreateResource={() => setResourceDialogOpen(true)}
          onConfigureBoards={() => setShowConfigManager(true)}
          onAICreateBoards={() => setAiDialogOpen(true)}
        />
      </main>
    </div>
  );

  if (isMaximized) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 bg-white z-40">
          <PageContent />
          
          {/* Dialogs for maximized view */}
          <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Job</DialogTitle>
              </DialogHeader>
              <JobForm onSuccess={() => setJobDialogOpen(false)} />
            </DialogContent>
          </Dialog>

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

          <KanbanConfigManager
            open={showConfigManager}
            onOpenChange={setShowConfigManager}
            jobs={jobs}
            resources={resources}
            capabilities={capabilities}
          />

          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                  AI Board Creation
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Describe the board you want to create:
                  </label>
                  <Textarea
                    placeholder="e.g., 'Create a board to track jobs by priority with color coding' or 'Show operations grouped by resource assignment'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setAiDialogOpen(false)}
                    disabled={aiMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className={`${aiTheme.gradient} text-white`}
                    onClick={handleAICreate}
                    disabled={aiMutation.isPending || !aiPrompt.trim()}
                  >
                    {aiMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Board
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <PageContent />
        
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

        {/* Kanban Config Manager */}
        <KanbanConfigManager
          open={showConfigManager}
          onOpenChange={setShowConfigManager}
          jobs={jobs}
          resources={resources}
          capabilities={capabilities}
        />

        {/* AI Board Creation Dialog */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                AI Board Creation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Describe the board you want to create:
                </label>
                <Textarea
                  placeholder="e.g., 'Create a board to track jobs by priority with color coding' or 'Show operations grouped by resource assignment'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAiDialogOpen(false)}
                  disabled={aiMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  className={`${aiTheme.gradient} text-white`}
                  onClick={handleAICreate}
                  disabled={aiMutation.isPending || !aiPrompt.trim()}
                >
                  {aiMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Board
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}