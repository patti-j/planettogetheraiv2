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
import { Plus, Edit, Trash2, Settings, Save, X, Sparkles } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Resource, Capability, KanbanConfig } from "@shared/schema";

// Define Job type locally since it's not exported from schema
interface Job {
  id: number;
  orderNumber: string;
  name: string;
  customer: string;
  priority: string;
  status: string;
  quantity: number;
  dueDate: string;
}

// Use the type from shared schema
// interface KanbanConfig is already imported from @shared/schema

// Define available swim lane fields for jobs and operations
interface SwimLaneFieldOption {
  value: string;
  label: string;
  type: "jobs" | "operations" | "resources" | "both";
  values: string[];
}

const SWIM_LANE_FIELDS: SwimLaneFieldOption[] = [
  { value: "status", label: "Status", type: "both", values: ["planned", "In-Progress", "completed", "cancelled"] },
  { value: "priority", label: "Priority", type: "both", values: ["low", "medium", "high"] },
  { value: "customer", label: "Customer", type: "jobs", values: [] }, // Will be populated dynamically
  { value: "assignedResourceId", label: "Assigned Resource", type: "operations", values: [] }, // Will be populated dynamically
  { value: "type", label: "Resource Type", type: "resources", values: ["Machine", "Operator", "Facility"] },
  { value: "resourceStatus", label: "Resource Status", type: "resources", values: ["active", "maintenance", "offline"] },
];

interface KanbanConfigManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  resources: Resource[];
  capabilities: Capability[];
}

interface ColorMappingProps {
  swimLaneField: string;
  fieldValues: string[];
  colors: Record<string, string>;
  onColorChange: (value: string, color: string) => void;
}

const ColorMapping = ({ swimLaneField, fieldValues, colors, onColorChange }: ColorMappingProps) => {
  const defaultColors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];
  
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

  return (
    <div className="space-y-3">
      <Label>Swim Lane Colors</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fieldValues.map((value, index) => (
          <div key={value} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${colors[value] || defaultColors[index % defaultColors.length]}`}></div>
            <span className="text-sm font-medium capitalize">{value}</span>
            <Select
              value={colors[value] || defaultColors[index % defaultColors.length]}
              onValueChange={(color) => onColorChange(value, color)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
                      <span className="text-xs">{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};

interface KanbanConfigFormProps {
  config?: KanbanConfig;
  jobs: Job[];
  resources: Resource[];
  capabilities: Capability[];
  onSave: (config: Omit<KanbanConfig, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const KanbanConfigForm = ({ config, jobs, resources, capabilities, onSave, onCancel }: KanbanConfigFormProps) => {
  const [formData, setFormData] = useState<Omit<KanbanConfig, 'id' | 'createdAt'>>({
    name: config?.name || "",
    description: config?.description || "",
    viewType: config?.viewType || "jobs",
    swimLaneField: config?.swimLaneField || "status",
    swimLaneColors: config?.swimLaneColors || {},
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
    cardOrdering: config?.cardOrdering || {},
    isDefault: config?.isDefault || false
  });

  const priorityOptions = ["high", "medium", "low"];
  const statusOptions = ["planned", "in_progress", "completed", "cancelled"];
  const uniqueCustomers = Array.from(new Set(jobs.map(job => job.customer).filter(Boolean)));
  const resourceOptions = resources.map(r => ({ value: r.id.toString(), label: r.name }));

  // Get available swim lane fields based on view type
  const availableFields = SWIM_LANE_FIELDS.filter(field => 
    field.type === "both" || field.type === formData.viewType
  );

  // Get current field values based on selected swim lane field
  const getCurrentFieldValues = () => {
    const field = availableFields.find(f => f.value === formData.swimLaneField);
    if (!field) return [];
    
    if (field.value === "customer") {
      return uniqueCustomers;
    } else if (field.value === "assignedResourceId") {
      return resourceOptions.map(r => r.label);
    } else {
      return field.values;
    }
  };

  const currentFieldValues = getCurrentFieldValues();

  const handleColorChange = (value: string, color: string) => {
    setFormData({
      ...formData,
      swimLaneColors: {
        ...formData.swimLaneColors,
        [value]: color
      }
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
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this board is used for..."
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="viewType">View Type</Label>
          <Select value={formData.viewType} onValueChange={(value) => setFormData({ ...formData, viewType: value as "jobs" | "operations" | "resources" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jobs">Jobs</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="resources">Resources</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Swim Lanes Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Swim Lanes</h3>
        
        <div>
          <Label htmlFor="swimLaneField">Group By Field</Label>
          <Select 
            value={formData.swimLaneField} 
            onValueChange={(value) => setFormData({ ...formData, swimLaneField: value, swimLaneColors: {} })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {currentFieldValues.length > 0 && (
          <ColorMapping
            swimLaneField={formData.swimLaneField}
            fieldValues={currentFieldValues}
            colors={formData.swimLaneColors || {}}
            onColorChange={handleColorChange}
          />
        )}
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Priorities</Label>
            <div className="space-y-2 mt-2">
              {priorityOptions.map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={formData.filters?.priorities?.includes(priority) || false}
                    onCheckedChange={(checked) => {
                      const currentPriorities = formData.filters?.priorities || [];
                      const newPriorities = checked
                        ? [...currentPriorities, priority]
                        : currentPriorities.filter(p => p !== priority);
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
                    checked={formData.filters?.customers?.includes(customer) || false}
                    onCheckedChange={(checked) => {
                      const currentCustomers = formData.filters?.customers || [];
                      const newCustomers = checked
                        ? [...currentCustomers, customer]
                        : currentCustomers.filter(c => c !== customer);
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    checked={formData.displayOptions?.[option.key as keyof typeof formData.displayOptions] as boolean || false}
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
                  value={formData.displayOptions?.cardSize || "standard"}
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
                  value={formData.displayOptions?.groupBy || "none"}
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
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>


    </form>
  );
};

export default function KanbanConfigManager({ open, onOpenChange, jobs, resources, capabilities }: KanbanConfigManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<KanbanConfig | undefined>();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Fetch kanban configurations from API
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["/api/kanban-configs"],
    enabled: open,
  });

  // Create kanban configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: async (configData: Omit<KanbanConfig, 'id' | 'createdAt'>) => {
      return apiRequest("POST", "/api/kanban-configs", configData);
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
      return apiRequest("PUT", `/api/kanban-configs/${id}`, configData);
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
      return apiRequest("DELETE", `/api/kanban-configs/${id}`);
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
      return apiRequest("POST", `/api/kanban-configs/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Default board configuration updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating default board configuration", description: error.message, variant: "destructive" });
    }
  });

  // AI create kanban configuration mutation
  const aiCreateConfigMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest("POST", "/api/ai-agent/command", { command: `Create a Kanban board: ${prompt}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "AI board configuration created successfully" });
      setShowAIDialog(false);
      setAiPrompt("");
    },
    onError: (error: any) => {
      toast({ title: "Error creating AI board configuration", description: error.message, variant: "destructive" });
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Board Configurations</DialogTitle>
        </DialogHeader>
        
        {!showForm ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-600">
                Create and manage custom board configurations with different swim lanes, filters, and display options.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  onClick={() => setShowAIDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">AI Create</span>
                  <span className="sm:hidden">AI</span>
                </Button>
                <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Configuration</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {(configs as KanbanConfig[]).map((config) => (
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
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditConfig(config)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteConfig(config.id)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{config.viewType === "jobs" ? "Jobs" : "Operations"}</Badge>
                        <span className="text-sm text-gray-600">Swim Lane: {config.swimLaneField}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Badge className="text-xs">
                          <div className={`w-2 h-2 rounded-full bg-blue-500 mr-1`}></div>
                          {config.swimLaneField}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {config.filters?.priorities && config.filters.priorities.length > 0 && (
                            <span>Priorities: {config.filters.priorities.join(", ")}</span>
                          )}
                          {config.filters?.customers && config.filters.customers.length > 0 && (
                            <span className="ml-4">Customers: {config.filters.customers.length}</span>
                          )}
                        </div>
                        {!config.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefault(config.id)} className="text-xs">
                            <span className="hidden sm:inline">Set as Default</span>
                            <span className="sm:hidden">Default</span>
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
      
      {/* AI Creation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Create Kanban Board</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Describe your Kanban board</Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., 'Create a board to track jobs by priority with color coding' or 'Show operations grouped by resource assignment'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => aiCreateConfigMutation.mutate(aiPrompt)}
                disabled={!aiPrompt.trim() || aiCreateConfigMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                {aiCreateConfigMutation.isPending ? (
                  "Creating..."
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
    </Dialog>
  );
}