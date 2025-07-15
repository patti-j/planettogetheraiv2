import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Maximize2, Minimize2, FolderOpen, Sparkles } from "lucide-react";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
import EnhancedDashboardManager from "@/components/dashboard-manager-enhanced";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  isStandard?: boolean;
}

interface DashboardConfig {
  id: number;
  name: string;
  description: string;
  configuration: any; // Make this flexible to handle different structures
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Analytics() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardConfig | null>(null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  const { data: dashboards = [] } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  const loadDashboardMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      const response = await apiRequest("GET", `/api/dashboard-configs/${dashboardId}`);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Dashboard loaded:", data);
      console.log("Configuration:", data.configuration);
      
      // Ensure configuration has the expected structure
      if (!data.configuration) {
        data.configuration = { standardWidgets: [], customWidgets: [] };
      }
      if (!data.configuration.standardWidgets) {
        data.configuration.standardWidgets = [];
      }
      if (!data.configuration.customWidgets) {
        data.configuration.customWidgets = [];
      }
      
      console.log("After normalization:", data.configuration);
      console.log("Custom widgets count:", data.configuration.customWidgets?.length || 0);
      console.log("Standard widgets count:", data.configuration.standardWidgets?.length || 0);
      
      setCurrentDashboard(data);
      toast({
        title: "Dashboard loaded",
        description: `Loaded dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard configuration",
        variant: "destructive",
      });
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      toast({
        title: "Dashboard created",
        description: `Created dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating dashboard",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("PUT", `/api/dashboard-configs/${dashboardData.id}`, dashboardData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setCurrentDashboard(data);
      toast({
        title: "Dashboard updated",
        description: `Updated dashboard: ${data.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating dashboard",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (dashboardId: number) => {
      await apiRequest("DELETE", `/api/dashboard-configs/${dashboardId}`);
      return dashboardId;
    },
    onSuccess: (dashboardId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      if (currentDashboard?.id === dashboardId) {
        setCurrentDashboard(null);
        setSelectedDashboardId("");
      }
      toast({
        title: "Dashboard deleted",
        description: "Dashboard has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting dashboard",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const handleLoadDashboard = (dashboardId: string) => {
    if (dashboardId) {
      setSelectedDashboardId(dashboardId);
      loadDashboardMutation.mutate(dashboardId);
    }
  };

  const handleDashboardSelect = (dashboard: DashboardConfig) => {
    setCurrentDashboard(dashboard);
    setSelectedDashboardId(dashboard.id.toString());
  };

  const handleDashboardCreate = (dashboard: DashboardConfig) => {
    createDashboardMutation.mutate(dashboard);
  };

  const handleDashboardUpdate = (dashboard: DashboardConfig) => {
    updateDashboardMutation.mutate(dashboard);
  };

  const handleDashboardDelete = (dashboardId: number) => {
    deleteDashboardMutation.mutate(dashboardId);
  };

  const PageContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {/* Dashboard Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Dashboard Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedDashboardId} onValueChange={handleLoadDashboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dashboard to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{dashboard.name}</span>
                          {dashboard.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </Button>
                <Button
                  onClick={() => setAiAnalyticsOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Display */}
        {currentDashboard ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{currentDashboard.name}</span>
                    {currentDashboard.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{currentDashboard.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDashboardManagerOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Dashboard Preview</h3>
                <p className="text-sm">
                  This dashboard contains {currentDashboard?.configuration?.standardWidgets?.length || 0} standard widgets 
                  and {currentDashboard?.configuration?.customWidgets?.length || 0} custom widgets.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <Badge variant="outline">
                    Standard: {currentDashboard?.configuration?.standardWidgets?.length || 0}
                  </Badge>
                  <Badge variant="outline">
                    Custom: {currentDashboard?.configuration?.customWidgets?.length || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Dashboard Selected</h3>
              <p className="text-sm mb-4">
                Select a dashboard from the dropdown above to view its configuration.
              </p>
              <Button
                onClick={() => setDashboardManagerOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
              <p className="text-gray-600">Manage and view dashboard configurations</p>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAiAnalyticsOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Analytics
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="flex items-center gap-2"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isMaximized ? (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Analytics - Maximized</h1>
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(false)}
                  className="flex items-center gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PageContent />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PageContent />
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedDashboardManager
        open={dashboardManagerOpen}
        onOpenChange={setDashboardManagerOpen}
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        onDashboardSelect={handleDashboardSelect}
        onDashboardCreate={handleDashboardCreate}
        onDashboardUpdate={handleDashboardUpdate}
        onDashboardDelete={handleDashboardDelete}
        standardWidgets={currentDashboard?.configuration?.standardWidgets || []}
        customWidgets={currentDashboard?.configuration?.customWidgets || []}
      />

      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        widgets={currentDashboard?.configuration.customWidgets || []}
        onWidgetCreate={(widget) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: [...currentDashboard.configuration.customWidgets, widget]
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
        onWidgetUpdate={(widgetId, updates) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: currentDashboard.configuration.customWidgets.map(w => 
                  w.id === widgetId ? { ...w, ...updates } : w
                )
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
        onWidgetDelete={(widgetId) => {
          if (currentDashboard) {
            const updatedDashboard = {
              ...currentDashboard,
              configuration: {
                ...currentDashboard.configuration,
                customWidgets: currentDashboard.configuration.customWidgets.filter(w => w.id !== widgetId)
              }
            };
            handleDashboardUpdate(updatedDashboard);
          }
        }}
      />
    </>
  );
}