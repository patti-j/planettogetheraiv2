import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity, 
  Brain, 
  Sparkles, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Grid,
  LineChart,
  Calendar,
  MapPin,
  Bell,
  Target,
  TrendingUp,
  Monitor,
  Wand2,
  Zap,
  Layout,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useAITheme } from "@/hooks/use-ai-theme";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedDashboardManager } from "@/components/dashboard-manager-enhanced";

interface DashboardItem {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  configuration: {
    standardWidgets: any[];
    customWidgets: any[];
  };
}

const DASHBOARD_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Grid },
  { value: 'operations', label: 'Operations', icon: Monitor },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'management', label: 'Management', icon: Target },
  { value: 'planning', label: 'Planning', icon: Calendar },
  { value: 'monitoring', label: 'Monitoring', icon: Activity }
];

const DASHBOARD_TEMPLATES = [
  {
    id: 'production-overview',
    name: 'Production Overview',
    description: 'Complete overview of production operations with key metrics and alerts',
    category: 'operations',
    icon: Monitor,
    complexity: 'Beginner',
    widgets: [
      { type: 'kpi', title: 'Active Production Orders', dataSource: 'productionOrders' },
      { type: 'chart', title: 'Production Status Distribution', dataSource: 'productionOrders', chartType: 'pie' },
      { type: 'alert', title: 'Critical Alerts', dataSource: 'alerts' }
    ]
  },
  {
    id: 'resource-monitoring',
    name: 'Resource Monitoring',
    description: 'Monitor resource utilization and capacity across all plants',
    category: 'management',
    icon: Activity,
    complexity: 'Intermediate',
    widgets: [
      { type: 'gauge', title: 'Overall Resource Utilization', dataSource: 'resources' },
      { type: 'chart', title: 'Resource Capacity by Plant', dataSource: 'resources' },
      { type: 'table', title: 'Resource Status', dataSource: 'resources' }
    ]
  },
  {
    id: 'performance-analytics',
    name: 'Performance Analytics',
    description: 'Advanced analytics for production performance and efficiency tracking',
    category: 'analytics',
    icon: TrendingUp,
    complexity: 'Advanced',
    widgets: [
      { type: 'chart', title: 'OEE Trends', dataSource: 'operations', chartType: 'line' },
      { type: 'chart', title: 'Throughput Analysis', dataSource: 'operations' },
      { type: 'kpi', title: 'Efficiency Score', dataSource: 'operations' }
    ]
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    description: 'Quality metrics and control charts for manufacturing excellence',
    category: 'monitoring',
    icon: Target,
    complexity: 'Intermediate',
    widgets: [
      { type: 'chart', title: 'Defect Rate Trends', dataSource: 'quality', chartType: 'line' },
      { type: 'gauge', title: 'First Pass Yield', dataSource: 'quality' },
      { type: 'alert', title: 'Quality Alerts', dataSource: 'alerts' }
    ]
  }
];

export default function DashboardsPage() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const { getThemeClasses } = useAITheme();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDashboardManager, setShowDashboardManager] = useState(false);
  const [showAiDashboardDialog, setShowAiDashboardDialog] = useState(false);
  const [aiDashboardPrompt, setAiDashboardPrompt] = useState("");
  const [creationMode, setCreationMode] = useState<'template' | 'custom'>('template');

  // Dashboard creation state
  const [newDashboard, setNewDashboard] = useState({
    name: "",
    description: "",
    category: "operations",
    template: ""
  });

  // Fetch dashboards
  const { data: dashboards = [], isLoading: isDashboardsLoading, refetch: refetchDashboards } = useQuery<DashboardItem[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  // Create dashboard mutation
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await apiRequest("POST", "/api/dashboard-configs", dashboardData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Dashboard created",
        description: "Your new dashboard has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setShowCreateDialog(false);
      setShowTemplateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  // Update dashboard mutation
  const updateDashboardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/dashboard-configs/${id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Dashboard updated",
        description: "Dashboard has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setShowEditDialog(false);
      setSelectedDashboard(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  // Delete dashboard mutation
  const deleteDashboardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dashboard-configs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Dashboard deleted",
        description: "Dashboard has been deleted successfully",
      });
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

  // AI Dashboard Generation mutation
  const generateAiDashboardMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-dashboard", { prompt });
      return response;
    },
    onSuccess: (dashboardConfig) => {
      // Create the dashboard using the AI-generated configuration
      const dashboardData = {
        name: dashboardConfig.name,
        description: dashboardConfig.description || "AI-generated dashboard",
        configuration: {
          standardWidgets: [],
          customWidgets: dashboardConfig.widgets || []
        }
      };
      
      createDashboardMutation.mutate(dashboardData);
      setShowAiDashboardDialog(false);
      setAiDashboardPrompt("");
    },
    onError: (error: any) => {
      const isQuotaError = error?.quotaExceeded || 
                          error?.message?.includes('quota') || 
                          error?.message?.includes('limit');
      
      toast({
        title: isQuotaError ? "OpenAI Quota Exceeded" : "AI Generation Failed",
        description: isQuotaError 
          ? "The OpenAI API quota has been exceeded. Please try again later or contact support."
          : error?.message || "Failed to generate dashboard with AI",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewDashboard({
      name: "",
      description: "",
      category: "operations",
      template: ""
    });
  };

  const handleCreateFromTemplate = (template: any) => {
    const dashboardData = {
      name: template.name,
      description: template.description,
      isDefault: false,
      configuration: {
        standardWidgets: [],
        customWidgets: template.widgets.map((widget: any, index: number) => ({
          id: `widget-${index}`,
          title: widget.title,
          type: widget.type,
          data: widget.dataSource === 'productionOrders' ? { value: 0, label: widget.title } : {},
          visible: true,
          position: { x: (index % 3) * 220, y: Math.floor(index / 3) * 140 },
          size: { width: 200, height: 120 },
          config: { color: "blue", showTrend: true }
        }))
      }
    };
    
    createDashboardMutation.mutate(dashboardData);
  };

  const handleCreateCustom = () => {
    const dashboardData = {
      name: newDashboard.name,
      description: newDashboard.description,
      isDefault: false,
      configuration: {
        standardWidgets: [],
        customWidgets: []
      }
    };
    
    createDashboardMutation.mutate(dashboardData);
  };

  const handleEdit = (dashboard: DashboardItem) => {
    setSelectedDashboard(dashboard);
    setShowDashboardManager(true);
  };



  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this dashboard?")) {
      deleteDashboardMutation.mutate(id);
    }
  };

  // Filter dashboards
  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 pt-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-gray-600 mt-2">Create, manage, and organize your manufacturing dashboards</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowAiDashboardDialog(true)}
            className={`flex items-center gap-2 ${getThemeClasses()} border-0`}
          >
            <Sparkles className="w-4 h-4" />
            New Dashboard
          </Button>
      
          <Button
            onClick={() => setShowTemplateDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Create from Template
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search dashboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dashboard Grid */}
      {isDashboardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-100 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard) => {
            const widgetCount = dashboard.configuration.standardWidgets.length + dashboard.configuration.customWidgets.length;
            
            return (
              <Card key={dashboard.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-600" />
                        {dashboard.name}
                        {dashboard.isDefault && (
                          <Badge variant="secondary" className="ml-2">
                            <Layout className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {dashboard.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Dashboard Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Grid className="w-4 h-4" />
                        {widgetCount} widgets
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(dashboard.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(dashboard)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/analytics?dashboard=${dashboard.id}`, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(dashboard.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isDashboardsLoading && filteredDashboards.length === 0 && (
        <div className="text-center py-12">
          <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No dashboards found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first dashboard"}
          </p>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      )}

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Dashboard Template</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {DASHBOARD_TEMPLATES.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <template.icon className="w-8 h-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {template.complexity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-700">Included widgets:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.widgets.map((widget, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {widget.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleCreateFromTemplate(template)}
                    className="w-full"
                    disabled={createDashboardMutation.isPending}
                  >
                    {createDashboardMutation.isPending ? "Creating..." : "Use Template"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Dashboard Creation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Dashboard</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Dashboard Name</Label>
              <Input
                id="name"
                value={newDashboard.name}
                onChange={(e) => setNewDashboard(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter dashboard name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDashboard.description}
                onChange={(e) => setNewDashboard(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter dashboard description"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateCustom}
                disabled={!newDashboard.name || createDashboardMutation.isPending}
                className="flex-1"
              >
                {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Dashboard Manager */}
      <EnhancedDashboardManager
        open={showDashboardManager}
        onOpenChange={setShowDashboardManager}
        dashboards={dashboards}
        currentDashboard={selectedDashboard}
        onDashboardSelect={(dashboard) => {
          setSelectedDashboard(dashboard);
          // Optional: Navigate to analytics view
          // window.open(`/analytics?dashboard=${dashboard.id}`, '_blank');
        }}
        onDashboardCreate={(dashboard) => {
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
          toast({
            title: "Dashboard created",
            description: "New dashboard has been created successfully",
          });
        }}
        onDashboardUpdate={(dashboard) => {
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
          toast({
            title: "Dashboard updated",
            description: "Dashboard has been updated successfully",
          });
        }}
        onDashboardDelete={(dashboardId) => {
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
          toast({
            title: "Dashboard deleted",
            description: "Dashboard has been deleted successfully",
          });
        }}
        standardWidgets={[]}
        customWidgets={[]}
      />

      {/* AI Dashboard Generation Dialog */}
      <Dialog open={showAiDashboardDialog} onOpenChange={setShowAiDashboardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 ai-gradient-text" />
              Generate Dashboard with AI
            </DialogTitle>
            <div className="text-sm text-gray-600">
              Describe the type of dashboard you want to create, and AI will generate it for you with appropriate widgets and layout.
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-dashboard-prompt" className="text-sm font-medium">
                Dashboard Description
              </Label>
              <Textarea
                id="ai-dashboard-prompt"
                placeholder="Example: Create a production monitoring dashboard with KPI metrics for efficiency, quality, and throughput. Include charts showing production trends and alerts for any issues."
                value={aiDashboardPrompt}
                onChange={(e) => setAiDashboardPrompt(e.target.value)}
                className="mt-1 min-h-[120px] resize-none"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about the metrics, charts, and widgets you want to include.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAiDashboardDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (aiDashboardPrompt.trim()) {
                  generateAiDashboardMutation.mutate(aiDashboardPrompt.trim());
                }
              }}
              disabled={!aiDashboardPrompt.trim() || generateAiDashboardMutation.isPending}
              className={`flex items-center gap-2 ${getThemeClasses()} border-0`}
            >
              {generateAiDashboardMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Dashboard
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}