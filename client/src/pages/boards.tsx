import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ChevronDown, Plus, Settings, Users, Briefcase, Wrench } from "lucide-react";
import Sidebar from "@/components/sidebar";
import KanbanBoard from "@/components/kanban-board";
import KanbanConfigManager from "@/components/kanban-config-manager";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { type Job, type Operation, type Resource, type KanbanConfig, type Capability } from "@shared/schema";

export default function Boards() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
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

  const PageContent = () => (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Board</h2>
            <p className="text-sm text-gray-600">Organize jobs, operations, and resources with drag-and-drop boards</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Management Actions */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary hover:bg-blue-700 text-white" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create new jobs, resources, or boards</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setJobDialogOpen(true)}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  New Job
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResourceDialogOpen(true)}>
                  <Wrench className="w-4 h-4 mr-2" />
                  New Resource
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowConfigManager(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Boards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Board Selection */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedConfig?.name || "Select Board"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch between different board configurations</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                {kanbanConfigs.map((config) => (
                  <DropdownMenuItem
                    key={config.id}
                    onClick={() => handleConfigSelect(config.id)}
                    className={selectedConfig?.id === config.id ? "bg-blue-50 text-blue-900" : ""}
                  >
                    <div className="flex items-center">
                      {config.viewType === "jobs" ? (
                        <Briefcase className="w-4 h-4 mr-2" />
                      ) : config.viewType === "resources" ? (
                        <Wrench className="w-4 h-4 mr-2" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{config.viewType} board</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowConfigManager(true)} className="text-blue-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Boards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMaximized ? "Exit full screen" : "Maximize board view"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <KanbanBoard
          jobs={jobs}
          operations={operations}
          resources={resources}
          capabilities={capabilities}
          selectedConfig={selectedConfig}
          onConfigChange={handleConfigSelect}
        />
      </main>
    </div>
  );

  if (isMaximized) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 bg-white z-50">
          <PageContent />
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
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <JobForm onSuccess={() => setJobDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Resource Dialog */}
        <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
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
      </div>
    </TooltipProvider>
  );
}