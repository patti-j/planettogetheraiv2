import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Star, StarOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ResourceView, Resource } from "@shared/schema";
import ResourceViewForm from "./resource-view-form";

interface ResourceViewManagerProps {
  resources: Resource[];
  selectedViewId?: number;
  onViewChange?: (viewId: number) => void;
}

export default function ResourceViewManager({ 
  resources, 
  selectedViewId, 
  onViewChange 
}: ResourceViewManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingView, setEditingView] = useState<ResourceView | undefined>(undefined);
  const [deletingView, setDeletingView] = useState<ResourceView | undefined>(undefined);

  const { data: resourceViews = [] } = useQuery({
    queryKey: ["/api/resource-views"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/resource-views");
      return response.json();
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: number) => {
      await apiRequest("DELETE", `/api/resource-views/${viewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Resource view deleted successfully" });
      setDeletingView(undefined);
    },
    onError: () => {
      toast({ title: "Failed to delete resource view", variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (viewId: number) => {
      await apiRequest("POST", `/api/resource-views/${viewId}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Default view updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to set default view", variant: "destructive" });
    },
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingView(undefined);
  };

  const handleEditView = (view: ResourceView) => {
    setEditingView(view);
    setIsFormOpen(true);
  };

  const handleDeleteView = (view: ResourceView) => {
    setDeletingView(view);
  };

  const confirmDelete = () => {
    if (deletingView) {
      deleteViewMutation.mutate(deletingView.id);
    }
  };

  const handleSetDefault = (viewId: number) => {
    setDefaultMutation.mutate(viewId);
  };

  const handleViewSelect = (viewId: number) => {
    onViewChange?.(viewId);
  };

  const getResourceNames = (resourceIds: number[]) => {
    return resourceIds.map(id => resources.find(r => r.id === id)?.name || `Resource ${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resource Gantt Views</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingView(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              New Resource Gantt View
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingView ? "Edit Resource Gantt View" : "New Resource Gantt View"}
              </DialogTitle>
            </DialogHeader>
            <ResourceViewForm
              resourceView={editingView}
              resources={resources}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {resourceViews.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No resource gantts created</p>
                <p className="text-sm mb-4">
                  Create custom resource gantts to organize your resources in different sequences for better scheduling visibility.
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Resource Gantt View
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          resourceViews.map((view: ResourceView) => (
            <Card 
              key={view.id} 
              className={`cursor-pointer transition-all ${
                selectedViewId === view.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleViewSelect(view.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{view.name}</CardTitle>
                    {view.isDefault && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEditView(view);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(view.id);
                      }}>
                        {view.isDefault ? (
                          <>
                            <StarOff className="w-4 h-4 mr-2" />
                            Remove Default
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Set as Default
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteView(view);
                        }}
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
                {view.description && (
                  <p className="text-sm text-gray-600 mb-3">{view.description}</p>
                )}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Resource Sequence ({view.resourceSequence.length} resources):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getResourceNames(view.resourceSequence).map((name, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {index + 1}. {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingView} onOpenChange={() => setDeletingView(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the resource view "{deletingView?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}