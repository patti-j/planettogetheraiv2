import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings, Sparkles, RotateCcw, AlertTriangle } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import type { CustomTextLabel } from "@shared/schema";

interface CustomTextLabelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TextLabel {
  type: "operation_name" | "job_name" | "due_date" | "priority" | "status" | "duration" | "progress" | "resource_name" | "customer" | "job_description" | "operation_description" | "resource_type" | "capabilities" | "start_time" | "end_time" | "slack_days" | "days_late" | "completion_percent";
  enabled: boolean;
  order: number;
  fontSize: number;
  fontColor: string;
}

interface TextLabelConfig {
  labels: TextLabel[];
  fontSize: number;
  fontColor: string;
}

interface DragItem {
  index: number;
  type: string;
}

interface DraggableTextLabelProps {
  label: TextLabel;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<TextLabel>) => void;
  globalFontSize: number;
  globalFontColor: string;
}

const DraggableTextLabel = ({ label, index, onMove, onToggle, onRemove, onUpdate, globalFontSize, globalFontColor }: DraggableTextLabelProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: "textLabel",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "textLabel",
    hover: (item: DragItem) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const getDisplayName = (type: string) => {
    const displayNames = {
      operation_name: "Operation Name",
      job_name: "Job Name",
      due_date: "Due Date",
      priority: "Priority",
      status: "Status",
      duration: "Duration",
      progress: "Progress",
      resource_name: "Resource Name",
      customer: "Customer",
      job_description: "Job Description",
      operation_description: "Operation Description",
      resource_type: "Resource Type",
      capabilities: "Capabilities",
      start_time: "Start Time",
      end_time: "End Time",
      slack_days: "Slack Days",
      days_late: "Days Late",
      completion_percent: "Completion %",
    };
    return displayNames[type] || type;
  };

  const isUsingIndividualFontSize = label.fontSize !== globalFontSize;
  const isUsingIndividualFontColor = label.fontColor !== globalFontColor;
  const hasIndividualStyling = isUsingIndividualFontSize || isUsingIndividualFontColor;

  const resetToGlobal = () => {
    onUpdate(index, { fontSize: globalFontSize, fontColor: globalFontColor });
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between p-2 border rounded cursor-move ${
        isDragging ? "opacity-50" : ""
      } ${label.enabled ? "bg-blue-50" : "bg-gray-50"} ${hasIndividualStyling ? "ring-2 ring-orange-300" : ""}`}
    >
      <div className="flex items-center space-x-2 flex-1">
        <input
          type="checkbox"
          checked={label.enabled}
          onChange={() => onToggle(index)}
          className="w-4 h-4"
        />
        <span className="text-sm font-medium flex-1">{getDisplayName(label.type)}</span>
        {hasIndividualStyling && (
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
              <AlertTriangle className="h-2 w-2 mr-1" />
              Custom
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToGlobal}
              className="h-5 w-5 p-0 text-blue-500 hover:text-blue-700"
              title="Reset to global settings"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        )}
        <Badge variant="secondary" className="text-xs">
          {label.order + 1}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <label className="text-xs text-gray-500">Size:</label>
          <input
            type="number"
            min="8"
            max="32"
            value={label.fontSize}
            onChange={(e) => onUpdate(index, { fontSize: parseInt(e.target.value) || 12 })}
            className={`w-12 h-6 text-xs border rounded px-1 ${isUsingIndividualFontSize ? "bg-orange-50 border-orange-300" : ""}`}
          />
        </div>
        <div className="flex items-center space-x-1">
          <label className="text-xs text-gray-500">Color:</label>
          <input
            type="color"
            value={label.fontColor}
            onChange={(e) => onUpdate(index, { fontColor: e.target.value })}
            className={`w-6 h-6 border rounded cursor-pointer ${isUsingIndividualFontColor ? "ring-2 ring-orange-300" : ""}`}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

interface CustomTextLabelFormProps {
  onSave: (name: string, config: TextLabelConfig) => void;
  onCancel: () => void;
  initialName?: string;
  initialConfig?: TextLabelConfig;
}

const CustomTextLabelForm = ({ onSave, onCancel, initialName = "", initialConfig }: CustomTextLabelFormProps) => {
  const [name, setName] = useState(initialName);
  const [config, setConfig] = useState<TextLabelConfig>(
    initialConfig || {
      labels: [{ type: "operation_name", enabled: true, order: 0, fontSize: 12, fontColor: "#ffffff" }],
      fontSize: 12,
      fontColor: "#ffffff",
    }
  );

  const availableTypes = [
    "operation_name", "job_name", "due_date", "priority", "status", "duration", "progress",
    "resource_name", "customer", "job_description", "operation_description", "resource_type",
    "capabilities", "start_time", "end_time", "slack_days", "days_late", "completion_percent"
  ];

  const addLabel = (type: string) => {
    const newLabel: TextLabel = {
      type: type as any,
      enabled: true,
      order: config.labels.length,
      fontSize: 12,
      fontColor: "#ffffff",
    };
    setConfig({
      ...config,
      labels: [...config.labels, newLabel],
    });
  };

  const moveLabel = (fromIndex: number, toIndex: number) => {
    const newLabels = [...config.labels];
    const [movedLabel] = newLabels.splice(fromIndex, 1);
    newLabels.splice(toIndex, 0, movedLabel);
    
    // Update order values
    const updatedLabels = newLabels.map((label, index) => ({ ...label, order: index }));
    setConfig({ ...config, labels: updatedLabels });
  };

  const toggleLabel = (index: number) => {
    const newLabels = [...config.labels];
    newLabels[index].enabled = !newLabels[index].enabled;
    setConfig({ ...config, labels: newLabels });
  };

  const updateLabel = (index: number, updates: Partial<TextLabel>) => {
    const newLabels = [...config.labels];
    newLabels[index] = { ...newLabels[index], ...updates };
    setConfig({ ...config, labels: newLabels });
  };

  const removeLabel = (index: number) => {
    const newLabels = config.labels.filter((_, i) => i !== index);
    const updatedLabels = newLabels.map((label, i) => ({ ...label, order: i }));
    setConfig({ ...config, labels: updatedLabels });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), config);
  };

  const usedTypes = config.labels.map(label => label.type);
  const unusedTypes = availableTypes.filter(type => !usedTypes.includes(type));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="labelName">Label Configuration Name</Label>
        <Input
          id="labelName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for this text label configuration"
        />
      </div>

      <div>
        <Label>Text Labels</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <DndProvider backend={HTML5Backend}>
            {config.labels.map((label, index) => (
              <DraggableTextLabel
                key={`${label.type}-${index}`}
                label={label}
                index={index}
                onMove={moveLabel}
                onToggle={toggleLabel}
                onRemove={removeLabel}
                onUpdate={updateLabel}
                globalFontSize={config.fontSize}
                globalFontColor={config.fontColor}
              />
            ))}
          </DndProvider>
        </div>
      </div>

      {unusedTypes.length > 0 && (
        <div>
          <Label>Add Label</Label>
          <div className="flex flex-wrap gap-2">
            {unusedTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addLabel(type)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fontSize">Font Size</Label>
          <Input
            id="fontSize"
            type="number"
            value={config.fontSize}
            onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) || 12 })}
            min="8"
            max="24"
          />
        </div>
        <div>
          <Label htmlFor="fontColor">Font Color</Label>
          <Input
            id="fontColor"
            type="color"
            value={config.fontColor}
            onChange={(e) => setConfig({ ...config, fontColor: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

interface AITextLabelFormProps {
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AITextLabelForm = ({ onSubmit, onCancel, isLoading }: AITextLabelFormProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">Describe the text labels you want to create</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Create labels for tracking job progress including operation name, percentage complete, and due date"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="text-sm text-gray-600">
        <p>AI will analyze your request and create custom text labels with appropriate field combinations.</p>
        <p className="mt-2">Available fields include: operation name, job name, due date, priority, status, duration, progress, resource name, customer, job description, operation description, resource type, capabilities, start time, end time, slack days, days late, and completion percentage.</p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!prompt.trim() || isLoading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          {isLoading ? "Creating..." : "Create with AI"}
        </Button>
      </div>
    </div>
  );
};

export default function CustomTextLabelManager({ open, onOpenChange }: CustomTextLabelManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<CustomTextLabel | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customTextLabels = [] } = useQuery<CustomTextLabel[]>({
    queryKey: ["/api/custom-text-labels"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/custom-text-labels");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: TextLabelConfig }) => {
      const response = await apiRequest("POST", "/api/custom-text-labels", {
        name,
        config,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-text-labels"] });
      toast({ title: "Custom text label created successfully" });
      setShowForm(false);
      setEditingLabel(null);
    },
    onError: () => {
      toast({ title: "Failed to create custom text label", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, config }: { id: number; name: string; config: TextLabelConfig }) => {
      const response = await apiRequest("PUT", `/api/custom-text-labels/${id}`, {
        name,
        config,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-text-labels"] });
      toast({ title: "Custom text label updated successfully" });
      setShowForm(false);
      setEditingLabel(null);
    },
    onError: () => {
      toast({ title: "Failed to update custom text label", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-text-labels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-text-labels"] });
      toast({ title: "Custom text label deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete custom text label", variant: "destructive" });
    },
  });

  const aiCreateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", {
        command: `CREATE_CUSTOM_TEXT_LABELS: ${prompt}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-text-labels"] });
      toast({ title: "AI custom text labels created successfully" });
      setShowAIForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create AI custom text labels", variant: "destructive" });
    },
  });

  const handleSave = (name: string, config: TextLabelConfig) => {
    if (editingLabel) {
      updateMutation.mutate({ id: editingLabel.id, name, config });
    } else {
      createMutation.mutate({ name, config });
    }
  };

  const handleEdit = (label: CustomTextLabel) => {
    setEditingLabel(label);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this custom text label?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLabel(null);
  };

  const handleAICancel = () => {
    setShowAIForm(false);
  };

  if (showForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? "Edit Custom Text Label" : "Create Custom Text Label"}
            </DialogTitle>
          </DialogHeader>
          <CustomTextLabelForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialName={editingLabel?.name}
            initialConfig={editingLabel?.config}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (showAIForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Create Custom Text Labels</DialogTitle>
          </DialogHeader>
          <AITextLabelForm
            onSubmit={aiCreateMutation.mutate}
            onCancel={handleAICancel}
            isLoading={aiCreateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Custom Text Labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create and manage custom text label configurations for your resource views.
            </p>
            <div className="flex space-x-2">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
              <Button 
                onClick={() => setShowAIForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Create
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {customTextLabels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No custom text labels found. Create your first one to get started.
              </div>
            ) : (
              customTextLabels.map((label) => (
                <div key={label.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{label.name}</h4>
                    <p className="text-sm text-gray-600">
                      {label.config.labels.filter(l => l.enabled).length} active labels
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(label)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(label.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}