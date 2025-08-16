import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMobile } from "@/hooks/use-mobile";
import { SmartKPIWidgetStudio } from "@/components/smart-kpi-widget-studio";
import { DashboardVisualDesigner } from "@/components/dashboard-visual-designer";

import { 
  Plus, 
  Sparkles, 
  Layout, 
  FileText, 
  Menu,
  Edit,
  Trash2,
  Eye,
  Save,
  Download,
  Upload,
  Copy,
  Settings,
  Wand2,
  Palette,
  Grid,
  BarChart3,
  PieChart,
  Activity,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  Brain,
  Zap,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Maximize2,
  Minimize2,
  Move,
  Code,
  Package,
  Layers,
  Target,
  Gauge
} from "lucide-react";



// Widget Preview Component
const WidgetPreview = ({ widget }: { widget: any }) => {
  // Check if this is a pre-built widget with a component property
  const componentName = widget?.data?.component || widget?.configuration?.component;
  
  // No widget components available - using dashboard approach instead

  // Return placeholder for dashboard components
  return (
    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500">Component Preview</p>
        <p className="text-xs text-gray-400">{widget.title || 'Dashboard Component'}</p>
      </div>
    </div>
  );
};

interface DesignItem {
  id: string;
  type: 'widget' | 'dashboard' | 'page' | 'menu';
  title: string;
  description?: string;
  configuration: any;
  data?: any; // Preserve original data field for pre-built widgets
  status: 'draft' | 'active' | 'archived';
  targetPlatform: 'mobile' | 'desktop' | 'both';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  version?: number;
  parentId?: string; // For menu items and sub-pages
  order?: number; // For menu ordering
}

interface MenuStructure {
  id: string;
  title: string;
  icon?: string;
  href?: string;
  items?: MenuStructure[];
  feature?: string;
  action?: string;
  color?: string;
}

export default function UIDesignStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();
  const isMobile = useMobile();
  
  // State management
  const [activeTab, setActiveTab] = useState<'widgets' | 'dashboards' | 'pages' | 'menus'>('widgets');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DesignItem | null>(null);
  
  // AI Creation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartKPIStudioOpen, setSmartKPIStudioOpen] = useState(false);

  const [showVisualDesigner, setShowVisualDesigner] = useState(false);
  const [dashboardToEdit, setDashboardToEdit] = useState<any>(null);
  
  // Menu builder state
  const [menuStructure, setMenuStructure] = useState<MenuStructure[]>([]);
  const [selectedMenuNode, setSelectedMenuNode] = useState<MenuStructure | null>(null);
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    type: activeTab,
    targetPlatform: "both" as const,
    template: "",
    configuration: {}
  });

  // Fetch items based on active tab
  const { data: items = [], isLoading } = useQuery({
    queryKey: [`/api/design-studio/${activeTab}`],
    queryFn: async () => {
      let apiUrl = '';
      
      switch (activeTab) {
        case 'widgets':
          apiUrl = '/api/canvas/widgets';
          break;
        case 'dashboards':
          apiUrl = '/api/dashboard-configs';
          break;
        case 'pages':
          // Pages endpoint might not exist yet, use mock data for now
          return [];
        case 'menus':
          // Menus endpoint might not exist yet, use mock data for now
          return [];
        default:
          return [];
      }
      
      if (!apiUrl) return [];
      
      try {
        const response = await apiRequest('GET', apiUrl);
        const data = await response.json();
        
        // Transform the data to match our DesignItem interface
        if (activeTab === 'widgets') {
          return data.map((widget: any) => ({
            id: widget.id?.toString() || '',
            type: 'widget' as const,
            title: widget.title || 'Untitled Widget',
            description: widget.subtitle || widget.description || '',
            configuration: widget.configuration || widget.config || {},
            data: widget.data || {}, // Preserve the data field for pre-built widgets
            status: widget.isVisible || widget.is_visible ? 'active' : 'draft',
            targetPlatform: widget.targetPlatform || widget.target_platform || 'both',
            createdAt: widget.createdAt || widget.created_at || new Date().toISOString(),
            updatedAt: widget.updatedAt || widget.updated_at || widget.createdAt || new Date().toISOString(),
            createdBy: widget.userId?.toString() || widget.user_id?.toString(),
            tags: widget.tags || []
          }));
        } else if (activeTab === 'dashboards') {
          return data.map((dashboard: any) => ({
            id: dashboard.id?.toString() || '',
            type: 'dashboard' as const,
            title: dashboard.name || 'Untitled Dashboard',
            description: dashboard.description || '',
            configuration: dashboard.config || {},
            status: dashboard.isActive ? 'active' : 'draft',
            targetPlatform: 'both',
            createdAt: dashboard.createdAt || new Date().toISOString(),
            updatedAt: dashboard.updatedAt || dashboard.createdAt || new Date().toISOString(),
            createdBy: dashboard.userId?.toString(),
            tags: dashboard.tags || []
          }));
        }
        
        return [];
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        return [];
      }
    }
  });

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPlatform = filterPlatform === 'all' || item.targetPlatform === filterPlatform;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<DesignItem>) => {
      let apiUrl = '';
      let payload: any = {};
      
      switch (activeTab) {
        case 'widgets':
          apiUrl = '/api/canvas/widgets';
          payload = {
            title: data.title,
            subtitle: data.description,
            type: 'widget',
            config: data.configuration || {},
            isVisible: data.status === 'active',
            sessionId: 'design-studio',
            position: { x: 0, y: 0 },
            size: { width: 400, height: 300 }
          };
          break;
        case 'dashboards':
          apiUrl = '/api/dashboard-configs';
          payload = {
            name: data.title,
            description: data.description,
            config: data.configuration || {},
            isActive: data.status === 'active'
          };
          break;
        default:
          throw new Error(`Creation not supported for ${activeTab}`);
      }
      
      const response = await apiRequest('POST', apiUrl, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-studio/${activeTab}`] });
      setShowCreateDialog(false);
      resetCreateForm();
      toast({
        title: "Created Successfully",
        description: `Your ${activeTab.slice(0, -1)} has been created.`
      });
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({
        title: "Creation Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<DesignItem> }) => {
      let apiUrl = '';
      let payload: any = {};
      
      switch (activeTab) {
        case 'widgets':
          apiUrl = `/api/canvas/widgets/${data.id}`;
          payload = {
            title: data.updates.title,
            subtitle: data.updates.description,
            config: data.updates.configuration,
            isVisible: data.updates.status === 'active'
          };
          break;
        case 'dashboards':
          apiUrl = `/api/dashboard-configs/${data.id}`;
          payload = {
            name: data.updates.title,
            description: data.updates.description,
            config: data.updates.configuration,
            isActive: data.updates.status === 'active'
          };
          break;
        default:
          throw new Error(`Update not supported for ${activeTab}`);
      }
      
      const response = await apiRequest('PUT', apiUrl, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-studio/${activeTab}`] });
      setEditMode(false);
      toast({
        title: "Updated Successfully",
        description: `Your ${activeTab.slice(0, -1)} has been updated.`
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      let apiUrl = '';
      
      switch (activeTab) {
        case 'widgets':
          apiUrl = `/api/canvas/widgets/${id}`;
          break;
        case 'dashboards':
          apiUrl = `/api/dashboard-configs/${id}`;
          break;
        default:
          throw new Error(`Delete not supported for ${activeTab}`);
      }
      
      const response = await apiRequest('DELETE', apiUrl);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-studio/${activeTab}`] });
      setShowDeleteDialog(false);
      setItemToDelete(null);
      toast({
        title: "Deleted Successfully",
        description: `The ${activeTab.slice(0, -1)} has been removed.`
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // AI Generation
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Please provide a description",
        description: "Tell me what you want to create.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/ai/generate-design', {
        prompt: aiPrompt,
        type: activeTab,
        targetPlatform: createForm.targetPlatform
      });
      
      const result = await response.json();
      
      setCreateForm({
        ...createForm,
        title: result.title || `AI Generated ${activeTab.slice(0, -1)}`,
        description: result.description || aiPrompt,
        configuration: result.configuration || {}
      });
      
      toast({
        title: "AI Generation Complete",
        description: "Review and customize the generated design."
      });
      
      setShowAIAssistant(false);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate design. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      type: activeTab,
      targetPlatform: "both",
      template: "",
      configuration: {}
    });
    setAiPrompt("");
  };

  const handleEditWidget = (item: DesignItem) => {
    // Check if this is a SMART KPI widget by checking widget type
    const isSmartKPIWidget = item.data?.widgetType === 'smart-kpi' || 
                            item.configuration?.widgetType === 'smart-kpi' ||
                            item.title?.toLowerCase().includes('kpi') ||
                            item.data?.template; // Has template field indicating it's from SMART KPI studio
    
    if (activeTab === 'widgets' && isSmartKPIWidget) {
      // Open SMART KPI Widget Studio with existing data
      setSelectedItem(item);
      setSmartKPIStudioOpen(true);
    } else {
      // For other widgets, use regular edit mode
      setSelectedItem(item);
      setEditMode(true);
    }
  };

  const handleCreate = () => {
    if (!createForm.title) {
      toast({
        title: "Title Required",
        description: "Please provide a title.",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      type: activeTab as any,
      title: createForm.title,
      description: createForm.description,
      targetPlatform: createForm.targetPlatform,
      configuration: createForm.configuration,
      status: 'draft'
    });
  };

  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'widgets': return <Grid className="h-4 w-4" />;
      case 'dashboards': return <Layout className="h-4 w-4" />;
      case 'pages': return <FileText className="h-4 w-4" />;
      case 'menus': return <Menu className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                UI Design Studio
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-0">
                Create and manage user interface elements - widgets, dashboards, pages, and menus
              </p>
            </div>
          </div>
        </div>



        {/* AI Assistant Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Design Assistant
            </CardTitle>
            <p className="text-sm text-muted-foreground">Let me help you create amazing designs with natural language</p>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={`Describe the ${activeTab.slice(0, -1)} you want to create...`}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIGenerate()}
                className="flex-1"
              />
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-50"
                onClick={() => setAiPrompt("Create a production metrics dashboard with real-time updates")}>
                Production Dashboard
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-50"
                onClick={() => setAiPrompt("Build a widget showing machine efficiency with charts")}>
                Efficiency Widget
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-50"
                onClick={() => setAiPrompt("Design a mobile-friendly inventory management page")}>
                Inventory Page
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-50"
                onClick={() => setAiPrompt("Create a navigation menu for shop floor workers")}>
                Shop Floor Menu
              </Badge>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-t-lg rounded-b-none">
                <TabsTrigger value="widgets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <Grid className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Widgets</span>
                </TabsTrigger>
                <TabsTrigger value="dashboards" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                  <Layout className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Dashboards</span>
                </TabsTrigger>
                <TabsTrigger value="pages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Pages</span>
                </TabsTrigger>
                <TabsTrigger value="menus" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                  <Menu className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Menus</span>
                </TabsTrigger>
              </TabsList>

              {/* Common toolbar for all tabs */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create {activeTab.slice(0, -1)}
                    </Button>
                    {activeTab === 'widgets' && (
                      <Button 
                        variant="outline"
                        onClick={() => setShowDesignStudio(true)}
                      >
                        <Palette className="h-4 w-4 mr-1" />
                        Design Studio
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <TabsContent value={activeTab} className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {activeTab} found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ? `No results for "${searchTerm}"` : `Create your first ${activeTab.slice(0, -1)} to get started`}
                    </p>
                    
                    {/* Widget Creation Options */}
                    {activeTab === 'widgets' ? (
                      <div className="space-y-4">
                        {/* SMART KPI Widget Studio - Featured Option */}
                        <Card className="max-w-md mx-auto border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <div className="p-1 bg-purple-600 rounded">
                                <Gauge className="h-4 w-4 text-white" />
                              </div>
                              SMART KPI Widget Studio
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Create powerful KPI widgets with guided templates and intelligent configuration
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Button 
                              onClick={() => setSmartKPIStudioOpen(true)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-3"
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Create SMART KPI Widget
                            </Button>
                            <div className="flex flex-wrap gap-2 justify-center">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                <span>Real-time metrics</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <BarChart3 className="h-3 w-3" />
                                <span>Multiple visualizations</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Target className="h-3 w-3" />
                                <span>SMART framework</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* General Widget Creation */}
                        <div className="pt-4 border-t border-gray-200">
                          <Button 
                            onClick={() => setShowCreateDialog(true)}
                            variant="outline"
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Custom Widget
                          </Button>
                        </div>
                      </div>
                    ) : activeTab === 'dashboards' ? (
                      <div className="space-y-4">
                        {/* Dashboard Creation Options */}
                        <Card className="max-w-md mx-auto border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <div className="p-1 bg-green-600 rounded">
                                <Layout className="h-4 w-4 text-white" />
                              </div>
                              Dashboard Designer
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Create comprehensive dashboards with drag-and-drop widgets and real-time data visualization
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Button 
                              onClick={() => {
                                setDashboardToEdit(null);
                                setShowVisualDesigner(true);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                            >
                              <Layout className="h-4 w-4 mr-2" />
                              Open Visual Dashboard Designer
                            </Button>
                            <div className="flex flex-wrap gap-2 justify-center">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Grid className="h-3 w-3" />
                                <span>Drag & drop widgets</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                <span>Real-time updates</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Smartphone className="h-3 w-3" />
                                <span>Responsive layouts</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Quick Dashboard Creation */}
                        <div className="pt-4 border-t border-gray-200">
                          <Button 
                            onClick={() => setShowCreateDialog(true)}
                            variant="outline"
                            className="bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Dashboard Template
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create {activeTab.slice(0, -1)}
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Creation Toolbar based on active tab */}
                    {activeTab === 'widgets' && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Widget Creation</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => setSmartKPIStudioOpen(true)}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Gauge className="h-3 w-3 mr-1" />
                              SMART KPI Widget
                            </Button>
                            <Button
                              onClick={() => setShowCreateDialog(true)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Custom Widget
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'dashboards' && (
                      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layout className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard Creation</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => {
                                setDashboardToEdit(null);
                                setShowVisualDesigner(true);
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Layout className="h-3 w-3 mr-1" />
                              Visual Designer
                            </Button>
                            <Button
                              onClick={() => setShowCreateDialog(true)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              New Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredItems.map((item) => (
                        <Card 
                        key={item.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          if (activeTab === 'dashboards') {
                            // Open dashboard in visual designer for viewing/editing
                            setDashboardToEdit({
                              id: item.id,
                              name: item.title,
                              description: item.description,
                              layout: item.configuration?.layout || "grid",
                              gridColumns: item.configuration?.gridColumns || 12,
                              widgets: item.configuration?.customWidgets || item.configuration?.widgets || [],
                              targetPlatform: item.targetPlatform
                            });
                            setShowVisualDesigner(true);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getItemIcon(activeTab)}
                              <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description || `No description provided`}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {item.targetPlatform === 'mobile' || item.targetPlatform === 'both' ? (
                                <Smartphone className="h-4 w-4 text-gray-400" />
                              ) : null}
                              {item.targetPlatform === 'desktop' || item.targetPlatform === 'both' ? (
                                <Monitor className="h-4 w-4 text-gray-400" />
                              ) : null}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeTab === 'dashboards') {
                                    // Edit dashboard with visual designer
                                    setDashboardToEdit({
                                      id: item.id,
                                      name: item.title,
                                      description: item.description,
                                      layout: item.configuration?.layout || "grid",
                                      gridColumns: item.configuration?.gridColumns || 12,
                                      widgets: item.configuration?.customWidgets || item.configuration?.widgets || [],
                                      targetPlatform: item.targetPlatform
                                    });
                                    setShowVisualDesigner(true);
                                  } else {
                                    handleEditWidget(item);
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete(item);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New {activeTab.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                Design a new {activeTab.slice(0, -1)} with AI assistance or templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={`Enter ${activeTab.slice(0, -1)} title`}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder={`Describe your ${activeTab.slice(0, -1)}`}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="platform">Target Platform</Label>
                <Select 
                  value={createForm.targetPlatform} 
                  onValueChange={(v) => setCreateForm({ ...createForm, targetPlatform: v as any })}
                >
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Mobile & Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile Only</SelectItem>
                    <SelectItem value="desktop">Desktop Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {activeTab === 'widgets' && (
                <div>
                  <Label>Choose Template</Label>
                  <ScrollArea className="h-48 mt-2 border rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[].map((template: any) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <CardContent className="p-3">
                            <div className="text-sm font-medium">{template.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!createForm.title}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  Create {activeTab.slice(0, -1)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {selectedItem?.title}</DialogTitle>
              <DialogDescription>
                {selectedItem?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedItem?.type === 'widget' && (
                <WidgetPreview widget={selectedItem} />
              )}
              {selectedItem?.type === 'dashboard' && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-600">Dashboard preview would appear here</p>
                </div>
              )}
              {selectedItem?.type === 'page' && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-600">Page preview would appear here</p>
                </div>
              )}
              {selectedItem?.type === 'menu' && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-600">Menu structure preview would appear here</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {activeTab.slice(0, -1)}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Design Studio Modal - Widget functionality removed */}
        {showDesignStudio && activeTab === 'widgets' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Design Studio</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Widget design functionality has been replaced with dashboard-based components.
              </p>
              <Button onClick={() => setShowDesignStudio(false)}>Close</Button>
            </div>
          </div>
        )}

        {/* SMART KPI Widget Studio */}
        <SmartKPIWidgetStudio
          open={smartKPIStudioOpen}
          onOpenChange={setSmartKPIStudioOpen}
          existingWidget={selectedItem && smartKPIStudioOpen ? selectedItem : undefined}
        />
        
        {/* Dashboard Visual Designer */}
        <DashboardVisualDesigner
          open={showVisualDesigner}
          onOpenChange={setShowVisualDesigner}
          dashboard={dashboardToEdit}
          onSave={async (dashboardConfig) => {
            // Save dashboard configuration
            const dashboardData = {
              name: dashboardConfig.name,
              description: dashboardConfig.description,
              targetPlatform: dashboardConfig.targetPlatform,
              configuration: {
                layout: dashboardConfig.layout,
                gridColumns: dashboardConfig.gridColumns,
                widgets: dashboardConfig.widgets,
                standardWidgets: [],
                customWidgets: dashboardConfig.widgets
              }
            };
            
            if (dashboardConfig.id) {
              // Update existing dashboard
              await apiRequest("PATCH", `/api/dashboard-configs/${dashboardConfig.id}`, dashboardData);
            } else {
              // Create new dashboard
              await apiRequest("POST", "/api/dashboard-configs", dashboardData);
            }
            
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard-configs'] });
            toast({
              title: "Success",
              description: `Dashboard "${dashboardConfig.name}" has been saved successfully`
            });
            setShowVisualDesigner(false);
            setDashboardToEdit(null);
            
            // Refresh the dashboard list if we're on the dashboards tab
            if (activeTab === 'dashboards') {
              queryClient.invalidateQueries({ queryKey: [`/api/design-studio/dashboards`] });
            }
          }}
        />
        

      </div>
    </div>
  );
}