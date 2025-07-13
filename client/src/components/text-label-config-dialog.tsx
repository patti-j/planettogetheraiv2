import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ResourceView } from "@shared/schema";

interface TextLabelConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceView: ResourceView;
}

interface TextLabel {
  type: "operation_name" | "job_name" | "due_date" | "priority" | "status" | "duration" | "progress" | "resource_name" | "customer" | "job_description" | "operation_description" | "resource_type" | "capabilities" | "start_time" | "end_time" | "slack_days" | "days_late" | "completion_percent";
  enabled: boolean;
  order: number;
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

const DraggableTextLabelItem = ({ 
  label, 
  index, 
  onMove, 
  onToggle, 
  onRemove 
}: { 
  label: TextLabel; 
  index: number; 
  onMove: (fromIndex: number, toIndex: number) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "text-label",
    item: { index, type: "text-label" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "text-label",
    hover: (item: DragItem) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const getLabelDisplayName = (type: string) => {
    switch (type) {
      case "operation_name": return "Operation Name";
      case "job_name": return "Job Name";
      case "due_date": return "Due Date";
      case "priority": return "Priority";
      case "status": return "Status";
      case "duration": return "Duration";
      case "progress": return "Progress %";
      case "resource_name": return "Resource Name";
      case "customer": return "Customer";
      case "job_description": return "Job Description";
      case "operation_description": return "Operation Description";
      case "resource_type": return "Resource Type";
      case "capabilities": return "Capabilities";
      case "start_time": return "Start Time";
      case "end_time": return "End Time";
      case "slack_days": return "Slack Days";
      case "days_late": return "Days Late";
      case "completion_percent": return "Completion %";
      default: return type;
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center space-x-2 p-2 border rounded ${
        isDragging ? "opacity-50" : ""
      } ${label.enabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
    >
      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
      <Switch
        checked={label.enabled}
        onCheckedChange={() => onToggle(index)}
      />
      <div className="flex-1 text-sm font-medium">
        {getLabelDisplayName(label.type)}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-6 w-6 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default function TextLabelConfigDialog({ open, onOpenChange, resourceView }: TextLabelConfigDialogProps) {
  const [config, setConfig] = useState<TextLabelConfig>(() => {
    const defaultConfig = {
      labels: [
        { type: "operation_name" as const, enabled: true, order: 0 }
      ],
      fontSize: 12,
      fontColor: "#ffffff"
    };
    
    return resourceView.textLabelConfig || defaultConfig;
  });

  const [configName, setConfigName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updatedConfig: TextLabelConfig) => {
      return apiRequest("PUT", `/api/resource-views/${resourceView.id}`, {
        textLabelConfig: updatedConfig
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Text label configuration updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update text label configuration", variant: "destructive" });
    }
  });

  const saveNamedConfigMutation = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: TextLabelConfig }) => {
      return apiRequest("POST", "/api/custom-text-labels", {
        name,
        config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-text-labels"] });
      toast({ title: "Named configuration saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save named configuration", variant: "destructive" });
    }
  });

  const handleMove = (fromIndex: number, toIndex: number) => {
    const newLabels = [...config.labels];
    const [movedLabel] = newLabels.splice(fromIndex, 1);
    newLabels.splice(toIndex, 0, movedLabel);
    
    // Update order values
    const updatedLabels = newLabels.map((label, index) => ({
      ...label,
      order: index
    }));
    
    setConfig({ ...config, labels: updatedLabels });
  };

  const handleToggle = (index: number) => {
    const newLabels = [...config.labels];
    newLabels[index].enabled = !newLabels[index].enabled;
    setConfig({ ...config, labels: newLabels });
  };

  const handleRemove = (index: number) => {
    const newLabels = config.labels.filter((_, i) => i !== index);
    const reorderedLabels = newLabels.map((label, i) => ({
      ...label,
      order: i
    }));
    setConfig({ ...config, labels: reorderedLabels });
  };

  const handleAddLabel = (type: string) => {
    const newLabel: TextLabel = {
      type: type as any,
      enabled: true,
      order: config.labels.length
    };
    setConfig({ ...config, labels: [...config.labels, newLabel] });
  };

  const availableLabelTypes = [
    "operation_name", "job_name", "due_date", "priority", "status", 
    "duration", "progress", "resource_name", "customer", "job_description",
    "operation_description", "resource_type", "capabilities", "start_time",
    "end_time", "slack_days", "days_late", "completion_percent"
  ].filter(type => !config.labels.some(label => label.type === type));

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  const handleSaveAsNamed = () => {
    if (!configName.trim()) {
      toast({ title: "Please enter a name for the configuration", variant: "destructive" });
      return;
    }
    saveNamedConfigMutation.mutate({ name: configName, config });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Text Labels</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Text Labels List */}
          <div>
            <Label className="text-sm font-medium">Text Labels</Label>
            <div className="mt-2 space-y-2">
              <DndProvider backend={HTML5Backend}>
                {config.labels.map((label, index) => (
                  <DraggableTextLabelItem
                    key={`${label.type}-${index}`}
                    label={label}
                    index={index}
                    onMove={handleMove}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                  />
                ))}
              </DndProvider>
            </div>
          </div>

          {/* Add New Label */}
          {availableLabelTypes.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Add Label</Label>
              <Select onValueChange={handleAddLabel}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a label type to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableLabelTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Font Size */}
          <div>
            <Label className="text-sm font-medium">Font Size (px)</Label>
            <Input
              type="number"
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) || 12 })}
              min="8"
              max="24"
              className="mt-2"
            />
          </div>

          {/* Font Color */}
          <div>
            <Label className="text-sm font-medium">Font Color</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="color"
                value={config.fontColor}
                onChange={(e) => setConfig({ ...config, fontColor: e.target.value })}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                type="text"
                value={config.fontColor}
                onChange={(e) => setConfig({ ...config, fontColor: e.target.value })}
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Save as Named Configuration */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Save as Named Configuration</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Enter configuration name"
                className="flex-1"
              />
              <Button 
                onClick={handleSaveAsNamed} 
                disabled={saveNamedConfigMutation.isPending || !configName.trim()}
                variant="outline"
              >
                {saveNamedConfigMutation.isPending ? "Saving..." : "Save As"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}