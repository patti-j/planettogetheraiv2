import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, GripVertical, Plus, Save } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { ResourceView, Resource } from "@shared/schema";
import { z } from "zod";

const resourceViewFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  resourceSequence: z.array(z.number()).min(1, "At least one resource is required"),
  isDefault: z.boolean().default(false),
});

type ResourceViewFormData = z.infer<typeof resourceViewFormSchema>;

interface DragItem {
  index: number;
  resourceId: number;
  type: string;
}

interface DraggableResourceItemProps {
  resourceId: number;
  resourceName: string;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (resourceId: number) => void;
}

const DraggableResourceItem = ({ resourceId, resourceName, index, onMove, onRemove }: DraggableResourceItemProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'resource',
    item: { index, resourceId, type: 'resource' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'resource',
    hover: (item: DragItem) => {
      if (!drag) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-md border cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <span className="flex-1 text-sm">{index + 1}. {resourceName}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(resourceId)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface ResourceViewFormProps {
  resourceView?: ResourceView;
  resources: Resource[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ResourceViewForm({ 
  resourceView, 
  resources, 
  onSuccess, 
  onCancel 
}: ResourceViewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ResourceViewFormData>({
    name: resourceView?.name || "",
    description: resourceView?.description || "",
    resourceSequence: resourceView?.resourceSequence || [],
    isDefault: resourceView?.isDefault || false,
  });
  
  const [availableResources, setAvailableResources] = useState<Resource[]>(
    resources.filter(r => !formData.resourceSequence.includes(r.id))
  );

  const createMutation = useMutation({
    mutationFn: async (data: ResourceViewFormData) => {
      const response = await apiRequest("POST", "/api/resource-views", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Resource view created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create resource view", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ResourceViewFormData) => {
      const response = await apiRequest("PUT", `/api/resource-views/${resourceView?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Resource view updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update resource view", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = resourceViewFormSchema.safeParse(formData);
    if (!result.success) {
      toast({ 
        title: "Validation Error", 
        description: result.error.errors[0].message,
        variant: "destructive" 
      });
      return;
    }

    if (resourceView) {
      updateMutation.mutate(result.data);
    } else {
      createMutation.mutate(result.data);
    }
  };

  const addResource = (resource: Resource) => {
    setFormData(prev => ({
      ...prev,
      resourceSequence: [...prev.resourceSequence, resource.id]
    }));
    setAvailableResources(prev => prev.filter(r => r.id !== resource.id));
  };

  const removeResource = (resourceId: number) => {
    setFormData(prev => ({
      ...prev,
      resourceSequence: prev.resourceSequence.filter(id => id !== resourceId)
    }));
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      setAvailableResources(prev => [...prev, resource]);
    }
  };

  const moveResource = (fromIndex: number, toIndex: number) => {
    const newSequence = [...formData.resourceSequence];
    const [moved] = newSequence.splice(fromIndex, 1);
    newSequence.splice(toIndex, 0, moved);
    setFormData(prev => ({ ...prev, resourceSequence: newSequence }));
  };

  const getResourceName = (id: number) => {
    return resources.find(r => r.id === id)?.name || `Resource ${id}`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          {resourceView && (
            <CardTitle>Edit "{resourceView.name}"</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter view name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter view description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Resource Sequence</Label>
            
            {/* Selected Resources */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Selected Resources:</div>
              {formData.resourceSequence.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border-2 border-dashed rounded-lg">
                  No resources selected. Add resources from the available list below.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.resourceSequence.map((resourceId, index) => (
                    <DraggableResourceItem
                      key={resourceId}
                      resourceId={resourceId}
                      resourceName={getResourceName(resourceId)}
                      index={index}
                      onMove={moveResource}
                      onRemove={removeResource}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Available Resources */}
            {availableResources.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Available Resources:</div>
                <div className="grid grid-cols-2 gap-2">
                  {availableResources.map((resource) => (
                    <Button
                      key={resource.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addResource(resource)}
                      className="justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {resource.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            />
            <Label htmlFor="isDefault">Set as default view</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {resourceView ? "Update View" : "Create View"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </DndProvider>
  );
}