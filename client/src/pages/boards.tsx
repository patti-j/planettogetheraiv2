import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Maximize2, Minimize2, ChevronDown, Plus, Settings, Users, Briefcase, Wrench, Sparkles } from "lucide-react";
import Sidebar from "@/components/sidebar";
import KanbanBoard from "@/components/kanban-board";
import KanbanConfigManager from "@/components/kanban-config-manager";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
        description: data.message || "Board configurations created successfully",
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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-800">Boards</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Organize jobs, operations, and resources using customizable board views</p>
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
          onToggleMaximize={handleToggleMaximize}
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
        <div className="fixed inset-0 bg-white z-50 flex">
          <Sidebar />
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
              <ResourceForm onSuccess={() => setResourceDialogOpen(false)} />
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
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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