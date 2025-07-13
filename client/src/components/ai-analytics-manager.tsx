import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Plus, Settings, BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Eye, EyeOff, Grid3X3, LayoutGrid, Maximize2, Minimize2, RefreshCw, Download, Share2, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface AIAnalyticsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetCreate: (widget: AnalyticsWidget) => void;
  currentWidgets: AnalyticsWidget[];
  onWidgetUpdate: (widgets: AnalyticsWidget[]) => void;
}

export default function AIAnalyticsManager({ 
  open, 
  onOpenChange, 
  onWidgetCreate, 
  currentWidgets, 
  onWidgetUpdate 
}: AIAnalyticsManagerProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiCreating, setIsAiCreating] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<AnalyticsWidget | null>(null);
  const [layoutMode, setLayoutMode] = useState<"grid" | "free">("grid");
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const aiAnalyticsMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/command", { 
        command: `Create analytics widgets: ${prompt}` 
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Analytics",
        description: data.message,
      });
      
      // Handle widget creation from AI
      if (data.actions?.includes("CREATE_ANALYTICS_WIDGETS")) {
        const widgets = data.data.widgets || [];
        widgets.forEach((widget: any) => {
          const newWidget: AnalyticsWidget = {
            id: Math.random().toString(36).substr(2, 9),
            title: widget.title,
            type: widget.type,
            data: widget.data,
            visible: true,
            position: { x: 0, y: 0 },
            size: { width: 300, height: 200 },
            config: widget.config || {}
          };
          onWidgetCreate(newWidget);
        });
      }
      
      setAiPrompt("");
      setIsAiCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create analytics widgets",
        variant: "destructive",
      });
      setIsAiCreating(false);
    },
  });

  const handleAiCreate = () => {
    if (!aiPrompt.trim()) return;
    setIsAiCreating(true);
    aiAnalyticsMutation.mutate(aiPrompt);
  };

  const handleWidgetToggle = (widgetId: string) => {
    const updatedWidgets = currentWidgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    );
    onWidgetUpdate(updatedWidgets);
  };

  const handleWidgetRemove = (widgetId: string) => {
    const updatedWidgets = currentWidgets.filter(widget => widget.id !== widgetId);
    onWidgetUpdate(updatedWidgets);
  };

  const handleWidgetResize = (widgetId: string, newSize: { width: number; height: number }) => {
    const updatedWidgets = currentWidgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size: newSize }
        : widget
    );
    onWidgetUpdate(updatedWidgets);
  };

  const handleWidgetMove = (widgetId: string, newPosition: { x: number; y: number }) => {
    const updatedWidgets = currentWidgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, position: newPosition }
        : widget
    );
    onWidgetUpdate(updatedWidgets);
  };

  const createManualWidget = (type: string) => {
    const newWidget: AnalyticsWidget = {
      id: Math.random().toString(36).substr(2, 9),
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type as any,
      data: {},
      visible: true,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      config: {}
    };
    onWidgetCreate(newWidget);
  };

  const exportDashboard = () => {
    const dashboardData = {
      widgets: currentWidgets,
      layout: layoutMode,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Analytics & Dashboard Manager</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="ai-create" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai-create">AI Create</TabsTrigger>
              <TabsTrigger value="widgets">Widget Library</TabsTrigger>
              <TabsTrigger value="layout">Layout Controls</TabsTrigger>
              <TabsTrigger value="settings">Dashboard Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-create" className="flex-1 space-y-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Create Analytics with AI</h3>
                <p className="text-sm opacity-90">
                  Describe what analytics and reports you want to create. AI will generate widgets automatically.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-prompt">Analytics Description</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Example: Create a dashboard showing job completion rates by priority, resource utilization over time, and overdue operations with drill-down capabilities"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleAiCreate}
                    disabled={!aiPrompt.trim() || isAiCreating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isAiCreating ? "Creating..." : "Create Analytics"}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setAiPrompt("")}>
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Quick Examples</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => setAiPrompt("Show me production efficiency metrics with resource utilization charts")}
                      >
                        Production Efficiency Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => setAiPrompt("Create job tracking reports with completion status and timeline analysis")}
                      >
                        Job Tracking Reports
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => setAiPrompt("Generate capacity planning analytics with resource allocation insights")}
                      >
                        Capacity Planning Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current Widgets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {currentWidgets.length === 0 ? (
                          <p className="text-sm text-gray-500">No widgets created yet</p>
                        ) : (
                          currentWidgets.map((widget) => (
                            <div key={widget.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {widget.type}
                                </Badge>
                                <span className="text-sm">{widget.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleWidgetToggle(widget.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleWidgetRemove(widget.id)}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="widgets" className="flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => createManualWidget("metric")}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-xs">Metric Card</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => createManualWidget("chart")}
                >
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-xs">Chart Widget</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => createManualWidget("table")}
                >
                  <Grid3X3 className="w-6 h-6" />
                  <span className="text-xs">Data Table</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => createManualWidget("progress")}
                >
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-xs">Progress Bar</span>
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Widget Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">Production Overview</h4>
                    <p className="text-xs text-gray-500 mt-1">Key metrics and KPIs</p>
                    <Button size="sm" className="mt-2 w-full bg-primary hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">Resource Utilization</h4>
                    <p className="text-xs text-gray-500 mt-1">Charts and utilization data</p>
                    <Button size="sm" className="mt-2 w-full bg-primary hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="flex-1 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Layout Mode</Label>
                  <Select value={layoutMode} onValueChange={(value: any) => setLayoutMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="free">Free Position</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Auto Arrange
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fit to Screen
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Layout
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Widget Visibility</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentWidgets.map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{widget.title}</span>
                        <Switch 
                          checked={widget.visible}
                          onCheckedChange={() => handleWidgetToggle(widget.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Refresh Interval</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={exportDashboard}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Dashboard
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Dashboard
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Display Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Show Grid Lines</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-refresh Data</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Timestamps</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}