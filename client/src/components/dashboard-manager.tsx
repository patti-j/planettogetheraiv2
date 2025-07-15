import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Star, Trash2, Edit3, Eye, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
}

interface DashboardConfig {
  id: number;
  name: string;
  description: string;
  configuration: {
    standardWidgets: AnalyticsWidget[];
    customWidgets: AnalyticsWidget[];
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboards: DashboardConfig[];
  currentDashboard: DashboardConfig | null;
  onDashboardSelect: (dashboard: DashboardConfig) => void;
  onDashboardCreate: (dashboard: DashboardConfig) => void;
  onDashboardUpdate: (dashboard: DashboardConfig) => void;
  onDashboardDelete: (dashboardId: number) => void;
  standardWidgets: AnalyticsWidget[];
  customWidgets: AnalyticsWidget[];
}

export default function DashboardManager({
  open,
  onOpenChange,
  dashboards,
  currentDashboard,
  onDashboardSelect,
  onDashboardCreate,
  onDashboardUpdate,
  onDashboardDelete,
  standardWidgets,
  customWidgets
}: DashboardManagerProps) {
  const [activeTab, setActiveTab] = useState("browse");
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" });
  const [editingDashboard, setEditingDashboard] = useState<DashboardConfig | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      return await apiRequest("POST", "/api/dashboard-configs", dashboardData);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      });
      onDashboardCreate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setNewDashboard({ name: "", description: "" });
      setActiveTab("browse");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateDashboardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/dashboard-configs/${id}`, data);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      });
      onDashboardUpdate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setEditingDashboard(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/dashboard-configs/${id}`);
    },
    onSuccess: (data, id) => {
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });
      onDashboardDelete(id);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/dashboard-configs/${id}/set-default`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default dashboard set successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set default dashboard",
        variant: "destructive",
      });
    },
  });

  const handleCreateDashboard = () => {
    if (!newDashboard.name.trim()) {
      toast({
        title: "Error",
        description: "Dashboard name is required",
        variant: "destructive",
      });
      return;
    }

    const dashboardData = {
      name: newDashboard.name,
      description: newDashboard.description,
      configuration: {
        standardWidgets: standardWidgets,
        customWidgets: customWidgets
      },
      isDefault: false
    };

    createDashboardMutation.mutate(dashboardData);
  };

  const handleUpdateDashboard = () => {
    if (!editingDashboard) return;

    const updatedData = {
      name: editingDashboard.name,
      description: editingDashboard.description,
      configuration: {
        standardWidgets: standardWidgets,
        customWidgets: customWidgets
      }
    };

    updateDashboardMutation.mutate({ id: editingDashboard.id, data: updatedData });
  };

  const handleSaveCurrentLayout = () => {
    if (!currentDashboard) return;

    const updatedData = {
      configuration: {
        standardWidgets: standardWidgets,
        customWidgets: customWidgets
      }
    };

    updateDashboardMutation.mutate({ id: currentDashboard.id, data: updatedData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Manager</DialogTitle>
          <DialogDescription>
            Create, manage, and switch between custom analytics dashboards
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="current">Current Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saved Dashboards</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("create")}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Dashboard
              </Button>
            </div>

            <ScrollArea className="h-80">
              <div className="grid gap-4">
                {dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{dashboard.name}</h4>
                          {dashboard.isDefault && (
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{dashboard.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Standard: {dashboard.configuration.standardWidgets.length} widgets
                          </span>
                          <span>
                            Custom: {dashboard.configuration.customWidgets.length} widgets
                          </span>
                          <span>
                            Created: {new Date(dashboard.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDashboardSelect(dashboard)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDashboard(dashboard)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(dashboard.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {dashboards.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No dashboards saved yet</p>
                    <p className="text-sm">Create your first dashboard to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dashboard-name">Dashboard Name</Label>
                <Input
                  id="dashboard-name"
                  placeholder="Enter dashboard name"
                  value={newDashboard.name}
                  onChange={(e) => setNewDashboard(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dashboard-description">Description</Label>
                <Textarea
                  id="dashboard-description"
                  placeholder="Enter dashboard description"
                  value={newDashboard.description}
                  onChange={(e) => setNewDashboard(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Current Layout Preview</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Standard widgets: {standardWidgets.length}</span>
                  <span>Custom widgets: {customWidgets.length}</span>
                  <span>Total widgets: {standardWidgets.length + customWidgets.length}</span>
                </div>
              </div>
              <Button
                onClick={handleCreateDashboard}
                disabled={createDashboardMutation.isPending}
                className="w-full"
              >
                {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Dashboard Layout</h3>
                {currentDashboard && (
                  <Button
                    onClick={handleSaveCurrentLayout}
                    disabled={updateDashboardMutation.isPending}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Layout
                  </Button>
                )}
              </div>

              {currentDashboard ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{currentDashboard.name}</h4>
                      <p className="text-sm text-gray-600">{currentDashboard.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Standard Widgets</p>
                        <p className="text-gray-600">{standardWidgets.length} widgets</p>
                      </div>
                      <div>
                        <p className="font-medium">Custom Widgets</p>
                        <p className="text-gray-600">{customWidgets.length} widgets</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No dashboard currently loaded</p>
                  <p className="text-sm">Select a dashboard from the Browse tab to get started</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {editingDashboard && (
          <Dialog open={!!editingDashboard} onOpenChange={() => setEditingDashboard(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Dashboard Name</Label>
                  <Input
                    id="edit-name"
                    value={editingDashboard.name}
                    onChange={(e) => setEditingDashboard(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingDashboard.description}
                    onChange={(e) => setEditingDashboard(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateDashboard}
                    disabled={updateDashboardMutation.isPending}
                    className="flex-1"
                  >
                    {updateDashboardMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingDashboard(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}