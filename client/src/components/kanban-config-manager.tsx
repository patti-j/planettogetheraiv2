import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Settings, Save, X } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job, Resource, Capability, KanbanConfig } from "@shared/schema";

// Use the type from shared schema
// interface KanbanConfig is already imported from @shared/schema

interface SwimLane {
  id: string;
  title: string;
  status: string;
  color: string;
  order: number;
}

interface KanbanFilters {
  priorities: string[];
  statuses: string[];
  resources: number[];
  capabilities: number[];
  customers: string[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface DisplayOptions {
  showPriority: boolean;
  showDueDate: boolean;
  showCustomer: boolean;
  showResource: boolean;
  showProgress: boolean;
  cardSize: "compact" | "standard" | "detailed";
  groupBy: "none" | "priority" | "customer" | "resource";
}

interface KanbanConfigManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  resources: Resource[];
  capabilities: Capability[];
}

interface DragItem {
  index: number;
  type: string;
}

interface DraggableSwimLaneProps {
  swimLane: SwimLane;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const DraggableSwimLane = ({ swimLane, index, onMove, onEdit, onRemove }: DraggableSwimLaneProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: "swimlane",
    item: { index, type: "swimlane" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "swimlane",
    hover: (item: DragItem) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-4 h-4 rounded-full ${swimLane.color}`}></div>
        <div>
          <div className="font-medium">{swimLane.title}</div>
          <div className="text-sm text-gray-500">Status: {swimLane.status}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(index)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface KanbanConfigFormProps {
  config?: KanbanConfig;
  jobs: Job[];
  resources: Resource[];
  capabilities: Capability[];
  onSave: (config: Omit<KanbanConfig, 'id'>) => void;
  onCancel: () => void;
}

const KanbanConfigForm = ({ config, jobs, resources, capabilities, onSave, onCancel }: KanbanConfigFormProps) => {
  const [formData, setFormData] = useState<Omit<KanbanConfig, 'id'>>({
    name: config?.name || "",
    description: config?.description || "",
    viewType: config?.viewType || "jobs",
    swimLanes: config?.swimLanes || [
      { id: "planned", title: "Planned", status: "planned", color: "bg-blue-500", order: 0 },
      { id: "in_progress", title: "In Progress", status: "in_progress", color: "bg-yellow-500", order: 1 },
      { id: "completed", title: "Completed", status: "completed", color: "bg-green-500", order: 2 },
      { id: "cancelled", title: "Cancelled", status: "cancelled", color: "bg-red-500", order: 3 },
    ],
    filters: config?.filters || {
      priorities: [],
      statuses: [],
      resources: [],
      capabilities: [],
      customers: [],
      dateRange: { from: null, to: null }
    },
    displayOptions: config?.displayOptions || {
      showPriority: true,
      showDueDate: true,
      showCustomer: true,
      showResource: true,
      showProgress: true,
      cardSize: "standard",
      groupBy: "none"
    },
    isDefault: config?.isDefault || false
  });

  const [editingSwimLane, setEditingSwimLane] = useState<number | null>(null);
  const [swimLaneForm, setSwimLaneForm] = useState<SwimLane>({
    id: "",
    title: "",
    status: "",
    color: "bg-blue-500",
    order: 0
  });

  const priorityOptions = ["high", "medium", "low"];
  const statusOptions = ["planned", "in_progress", "completed", "cancelled"];
  const colorOptions = [
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-red-500", label: "Red" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-pink-500", label: "Pink" },
    { value: "bg-indigo-500", label: "Indigo" },
    { value: "bg-orange-500", label: "Orange" },
  ];

  const uniqueCustomers = [...new Set(jobs.map(job => job.customer))];

  const handleSwimLaneMove = (fromIndex: number, toIndex: number) => {
    const newSwimLanes = [...formData.swimLanes];
    const [moved] = newSwimLanes.splice(fromIndex, 1);
    newSwimLanes.splice(toIndex, 0, moved);
    
    // Update order values
    newSwimLanes.forEach((lane, index) => {
      lane.order = index;
    });
    
    setFormData({ ...formData, swimLanes: newSwimLanes });
  };

  const handleSwimLaneEdit = (index: number) => {
    const swimLane = formData.swimLanes[index];
    setSwimLaneForm(swimLane);
    setEditingSwimLane(index);
  };

  const handleSwimLaneRemove = (index: number) => {
    const newSwimLanes = formData.swimLanes.filter((_, i) => i !== index);
    newSwimLanes.forEach((lane, i) => {
      lane.order = i;
    });
    setFormData({ ...formData, swimLanes: newSwimLanes });
  };

  const handleAddSwimLane = () => {
    const newSwimLane: SwimLane = {
      id: `lane_${Date.now()}`,
      title: "",
      status: "",
      color: "bg-blue-500",
      order: formData.swimLanes.length
    };
    setSwimLaneForm(newSwimLane);
    setEditingSwimLane(-1); // -1 indicates adding new
  };

  const handleSaveSwimLane = () => {
    if (editingSwimLane === -1) {
      // Adding new swim lane
      setFormData({
        ...formData,
        swimLanes: [...formData.swimLanes, { ...swimLaneForm, order: formData.swimLanes.length }]
      });
    } else {
      // Editing existing swim lane
      const newSwimLanes = [...formData.swimLanes];
      newSwimLanes[editingSwimLane!] = swimLaneForm;
      setFormData({ ...formData, swimLanes: newSwimLanes });
    }
    setEditingSwimLane(null);
    setSwimLaneForm({
      id: "",
      title: "",
      status: "",
      color: "bg-blue-500",
      order: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Board Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Production Board, Priority Tasks"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this board is used for..."
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="viewType">View Type</Label>
          <Select value={formData.viewType} onValueChange={(value) => setFormData({ ...formData, viewType: value as "jobs" | "operations" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jobs">Jobs</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Swim Lanes Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Swim Lanes</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSwimLane}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lane
          </Button>
        </div>
        
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-2">
            {formData.swimLanes.map((swimLane, index) => (
              <DraggableSwimLane
                key={swimLane.id}
                swimLane={swimLane}
                index={index}
                onMove={handleSwimLaneMove}
                onEdit={handleSwimLaneEdit}
                onRemove={handleSwimLaneRemove}
              />
            ))}
          </div>
        </DndProvider>
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Filters</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priorities</Label>
            <div className="space-y-2 mt-2">
              {priorityOptions.map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={formData.filters.priorities.includes(priority)}
                    onCheckedChange={(checked) => {
                      const newPriorities = checked
                        ? [...formData.filters.priorities, priority]
                        : formData.filters.priorities.filter(p => p !== priority);
                      setFormData({
                        ...formData,
                        filters: { ...formData.filters, priorities: newPriorities }
                      });
                    }}
                  />
                  <Label htmlFor={`priority-${priority}`} className="capitalize">{priority}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Customers</Label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {uniqueCustomers.map((customer) => (
                <div key={customer} className="flex items-center space-x-2">
                  <Checkbox
                    id={`customer-${customer}`}
                    checked={formData.filters.customers.includes(customer)}
                    onCheckedChange={(checked) => {
                      const newCustomers = checked
                        ? [...formData.filters.customers, customer]
                        : formData.filters.customers.filter(c => c !== customer);
                      setFormData({
                        ...formData,
                        filters: { ...formData.filters, customers: newCustomers }
                      });
                    }}
                  />
                  <Label htmlFor={`customer-${customer}`}>{customer}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Display Options</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Show on Cards</Label>
            <div className="space-y-2 mt-2">
              {[
                { key: "showPriority", label: "Priority" },
                { key: "showDueDate", label: "Due Date" },
                { key: "showCustomer", label: "Customer" },
                { key: "showResource", label: "Resource" },
                { key: "showProgress", label: "Progress" },
              ].map((option) => (
                <div key={option.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.key}
                    checked={formData.displayOptions[option.key as keyof DisplayOptions] as boolean}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        displayOptions: {
                          ...formData.displayOptions,
                          [option.key]: checked
                        }
                      });
                    }}
                  />
                  <Label htmlFor={option.key}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div>
                <Label>Card Size</Label>
                <Select
                  value={formData.displayOptions.cardSize}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    displayOptions: { ...formData.displayOptions, cardSize: value as "compact" | "standard" | "detailed" }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Group By</Label>
                <Select
                  value={formData.displayOptions.groupBy}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    displayOptions: { ...formData.displayOptions, groupBy: value as "none" | "priority" | "customer" | "resource" }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      {/* Swim Lane Edit Dialog */}
      <Dialog open={editingSwimLane !== null} onOpenChange={(open) => !open && setEditingSwimLane(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSwimLane === -1 ? "Add Swim Lane" : "Edit Swim Lane"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="swim-lane-title">Title</Label>
              <Input
                id="swim-lane-title"
                value={swimLaneForm.title}
                onChange={(e) => setSwimLaneForm({ ...swimLaneForm, title: e.target.value })}
                placeholder="e.g., In Progress, Review"
              />
            </div>
            
            <div>
              <Label htmlFor="swim-lane-status">Status Value</Label>
              <Input
                id="swim-lane-status"
                value={swimLaneForm.status}
                onChange={(e) => setSwimLaneForm({ ...swimLaneForm, status: e.target.value })}
                placeholder="e.g., in_progress, review"
              />
            </div>
            
            <div>
              <Label htmlFor="swim-lane-color">Color</Label>
              <Select
                value={swimLaneForm.color}
                onValueChange={(value) => setSwimLaneForm({ ...swimLaneForm, color: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${color.value}`}></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingSwimLane(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveSwimLane}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default function KanbanConfigManager({ open, onOpenChange, jobs, resources, capabilities }: KanbanConfigManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<KanbanConfig | undefined>();

  // Fetch kanban configurations from API
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["/api/kanban-configs"],
    enabled: open,
  });

  // Create kanban configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: async (configData: Omit<KanbanConfig, 'id' | 'createdAt'>) => {
      return apiRequest("/api/kanban-configs", {
        method: "POST",
        body: configData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Board configuration created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating board configuration", description: error.message, variant: "destructive" });
    }
  });

  // Update kanban configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, ...configData }: { id: number } & Partial<Omit<KanbanConfig, 'id' | 'createdAt'>>) => {
      return apiRequest(`/api/kanban-configs/${id}`, {
        method: "PUT",
        body: configData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Board configuration updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating board configuration", description: error.message, variant: "destructive" });
    }
  });

  // Delete kanban configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/kanban-configs/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Board configuration deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting board configuration", description: error.message, variant: "destructive" });
    }
  });

  // Set default kanban configuration mutation
  const setDefaultConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/kanban-configs/${id}/set-default`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Default board configuration updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating default board configuration", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveConfig = (configData: Omit<KanbanConfig, 'id' | 'createdAt'>) => {
    if (editingConfig) {
      // Update existing config
      updateConfigMutation.mutate({ id: editingConfig.id, ...configData });
    } else {
      // Create new config
      createConfigMutation.mutate(configData);
    }
    
    setShowForm(false);
    setEditingConfig(undefined);
  };

  const handleEditConfig = (config: KanbanConfig) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDeleteConfig = (id: number) => {
    if (confirm("Are you sure you want to delete this board configuration?")) {
      deleteConfigMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultConfigMutation.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kanban Board Configurations</DialogTitle>
        </DialogHeader>
        
        {!showForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Create and manage custom Kanban board configurations with different swim lanes, filters, and display options.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Configuration
              </Button>
            </div>
            
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{config.name}</span>
                          {config.isDefault && <Badge variant="secondary">Default</Badge>}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditConfig(config)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteConfig(config.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{config.viewType === "jobs" ? "Jobs" : "Operations"}</Badge>
                        <span className="text-sm text-gray-600">{config.swimLanes.length} swim lanes</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {config.swimLanes.map((lane) => (
                          <Badge key={lane.id} className="text-xs">
                            <div className={`w-2 h-2 rounded-full ${lane.color} mr-1`}></div>
                            {lane.title}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {config.filters.priorities.length > 0 && (
                            <span>Priorities: {config.filters.priorities.join(", ")}</span>
                          )}
                          {config.filters.customers.length > 0 && (
                            <span className="ml-4">Customers: {config.filters.customers.length}</span>
                          )}
                        </div>
                        {!config.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefault(config.id)}>
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <KanbanConfigForm
            config={editingConfig}
            jobs={jobs}
            resources={resources}
            capabilities={capabilities}
            onSave={handleSaveConfig}
            onCancel={() => {
              setShowForm(false);
              setEditingConfig(undefined);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}