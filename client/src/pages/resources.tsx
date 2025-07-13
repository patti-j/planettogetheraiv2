import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, ServerCog, Settings, Wrench } from "lucide-react";
import Sidebar from "@/components/sidebar";
import ResourceForm from "@/components/resource-form";
import type { Resource, Capability } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Resources() {
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const { toast } = useToast();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Resource deleted successfully",
        description: "The resource has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting resource",
        description: "There was a problem deleting the resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceDialogOpen(true);
  };

  const handleDeleteResource = (resourceId: number) => {
    if (confirm("Are you sure you want to delete this resource? This may affect scheduled operations.")) {
      deleteResourceMutation.mutate(resourceId);
    }
  };

  const handleDialogClose = () => {
    setResourceDialogOpen(false);
    setEditingResource(null);
  };

  const getCapabilityName = (capabilityId: number) => {
    const capability = capabilities.find(c => c.id === capabilityId);
    return capability?.name || `Capability ${capabilityId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return ServerCog;
      case "operator":
        return Settings;
      case "tool":
        return Wrench;
      default:
        return ServerCog;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
              <p className="text-gray-500">Manage your production resources</p>
            </div>
            <Button 
              onClick={() => setResourceDialogOpen(true)}
              className="bg-accent hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Resource
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ServerCog className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
              <p className="text-gray-500 mb-4">Add your first resource to start scheduling operations.</p>
              <Button onClick={() => setResourceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => {
                const TypeIcon = getTypeIcon(resource.type);
                return (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {resource.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{resource.type}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditResource(resource)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteResource(resource.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Capabilities:</p>
                          <div className="flex flex-wrap gap-1">
                            {resource.capabilities?.length ? (
                              resource.capabilities.map((capId) => (
                                <Badge key={capId} variant="secondary" className="text-xs">
                                  {getCapabilityName(capId)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No capabilities assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Edit Resource" : "Add New Resource"}
            </DialogTitle>
          </DialogHeader>
          <ResourceForm 
            resource={editingResource || undefined}
            capabilities={capabilities}
            onSuccess={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}