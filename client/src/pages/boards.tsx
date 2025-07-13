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
        <KanbanBoard
          jobs={jobs}
          operations={operations}
          resources={resources}
          capabilities={capabilities}
          selectedConfig={selectedConfig}
          onConfigChange={handleConfigSelect}
          kanbanConfigs={kanbanConfigs}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(!isMaximized)}
          onCreateJob={() => setJobDialogOpen(true)}
          onCreateResource={() => setResourceDialogOpen(true)}
          onConfigureBoards={() => setShowConfigManager(true)}
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