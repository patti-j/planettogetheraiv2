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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMobile } from "@/hooks/use-mobile";
import { SmartKPIWidgetStudio } from "@/components/smart-kpi-widget-studio";
import { WidgetStudio } from "@/components/widget-studio";
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
  Bot,
  Palette,
  Grid,
  BarChart3,
  PieChart,
  Activity,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  ChevronDown,
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



// Widget Preview Component - Enhanced for SMART KPI widgets
const WidgetPreview = ({ widget }: { widget: any }) => {
  // Debug logging to understand widget structure
  console.log('Widget Preview Data:', widget);
  
  // Get widget type from various possible locations
  const widgetType = widget?.widget_type || 
                     widget?.widgetType || 
                     widget?.configuration?.widgetType ||
                     widget?.data?.widgetType ||
                     widget?.type;
                     
  // Get widget subtype
  const widgetSubtype = widget?.widget_subtype || 
                        widget?.widgetSubtype || 
                        widget?.configuration?.widgetSubtype ||
                        widget?.data?.widgetSubtype;
  
  // Check if this is a SMART KPI widget
  const isSmartKPI = widgetType === 'smart-kpi' || 
                     widget?.data?.template ||
                     widgetSubtype === 'kpi';
  
  // Check if this is a system widget
  const isSystemWidget = widget?.is_system_widget || 
                        widget?.configuration?.isSystemWidget || 
                        widget?.data?.isSystemWidget;
  
  // Get configuration from various possible locations
  const config = widget?.data?.configuration || widget?.configuration || widget?.data || {};
  
  if (isSmartKPI) {
    // Generate sample data for KPI preview
    const targetValue = config.targetValue || 95;
    const currentValue = Math.round(targetValue + (Math.random() - 0.5) * 10);
    const previousValue = Math.round(currentValue * (0.9 + Math.random() * 0.2));
    const trend = currentValue > previousValue ? 'up' : 'down';
    const trendPercentage = Math.abs(((currentValue - previousValue) / previousValue) * 100);
    const achievement = Math.round((currentValue / targetValue) * 100);
    
    // Generate sparkline data
    const sparklineData = Array.from({ length: 15 }, () => 
      Math.round(targetValue * (0.8 + Math.random() * 0.4))
    );
    const maxSparkValue = Math.max(...sparklineData);
    const minSparkValue = Math.min(...sparklineData);
    
    const getStatusColor = () => {
      if (achievement >= 95) return '#10b981';
      if (achievement >= 85) return '#f59e0b';
      return '#ef4444';
    };
    
    const getStatusText = () => {
      if (achievement >= 95) return 'On Target';
      if (achievement >= 85) return 'Near Target';
      return 'Below Target';
    };
    
    return (
      <div className="w-full bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <p className="text-sm text-gray-500">{config.metric || config.description || 'Key Performance Indicator'}</p>
            </div>
            <Badge className="text-xs" style={{ backgroundColor: getStatusColor() }}>
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{currentValue}</span>
                <span className="text-sm text-gray-500">{config.unit || '%'}</span>
              </div>
              {config.showTrend !== false && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      trend === 'up' ? '-rotate-90' : 'rotate-90'
                    }`} />
                    <span>{trendPercentage.toFixed(1)}%</span>
                  </div>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>
              )}
            </div>
            
            {/* Gauge Visualization */}
            {config.visualization === 'gauge' && (
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke={getStatusColor()}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${achievement * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{achievement}%</div>
                    <div className="text-xs text-gray-500">of target</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bar Visualization */}
            {config.visualization === 'bar' && (
              <div className="w-32 h-24 flex items-end gap-1">
                {[75, 85, 65, 90, achievement].map((val, i) => (
                  <div key={i} className="flex-1 bg-gray-200 rounded-t relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 rounded-t transition-all"
                      style={{ 
                        height: `${val}%`,
                        backgroundColor: i === 4 ? getStatusColor() : '#e5e7eb'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Progress Bar Visualization */}
            {config.visualization === 'progress' && (
              <div className="w-48">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0</span>
                  <span>Target: {targetValue}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all rounded-full"
                    style={{ 
                      width: `${Math.min(achievement, 100)}%`,
                      backgroundColor: getStatusColor()
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Sparkline */}
          {config.showSparkline !== false && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">15-DAY TREND</span>
                <span className="text-xs text-gray-400">
                  Min: {minSparkValue} / Max: {maxSparkValue}
                </span>
              </div>
              <div className="flex items-end gap-0.5 h-12">
                {sparklineData.map((value, i) => {
                  const height = ((value - minSparkValue) / (maxSparkValue - minSparkValue)) * 100;
                  const isLatest = i === sparklineData.length - 1;
                  return (
                    <div 
                      key={i}
                      className="flex-1 rounded-sm transition-all duration-200 hover:opacity-80"
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: isLatest ? getStatusColor() : '#e5e7eb',
                        minHeight: '2px'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-sm font-semibold">{targetValue} {config.unit || '%'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Achievement</p>
              <p className="text-sm font-semibold">{achievement}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gap</p>
              <p className="text-sm font-semibold">{Math.abs(targetValue - currentValue)} {config.unit || '%'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if this is a pre-built widget with a component property
  const componentName = widget?.data?.component || widget?.configuration?.component;
  
  // Render other widget types - check widgetType from all possible locations
  if (widgetType) {
    return (
      <div className="w-full min-h-64 border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{widget.title}</h3>
          <div className="flex gap-2">
            {isSystemWidget && (
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                <Settings className="h-3 w-3 mr-1" />
                System
              </Badge>
            )}
            <Badge>{widgetType}</Badge>
            {widgetSubtype && (
              <Badge variant="outline">{widgetSubtype}</Badge>
            )}
          </div>
        </div>
        
        {(widgetType === 'chart' || widgetSubtype === 'chart') && (
          <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Chart Widget</p>
              <p className="text-xs text-gray-400">{config.chartType || 'Bar Chart'}</p>
            </div>
          </div>
        )}
        
        {(widgetType === 'gauge' || widgetSubtype === 'gauge') && (
          <div className="h-48 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Gauge Widget</p>
              <p className="text-xs text-gray-400">{config.gaugeType || 'Radial Gauge'}</p>
            </div>
          </div>
        )}
        
        {(widgetType === 'table' || widgetSubtype === 'table') && (
          <div className="h-48 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex gap-4 text-xs font-semibold text-gray-600 border-b pb-2">
                <div className="flex-1">Name</div>
                <div className="w-20">Status</div>
                <div className="w-20">Value</div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 text-sm">
                  <div className="flex-1">Item {i}</div>
                  <div className="w-20">
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="w-20">100{i}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(widgetType === 'activity' || widgetSubtype === 'activity') && (
          <div className="h-48 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-teal-600" />
              <p className="text-sm text-gray-600">Activity Feed</p>
              <p className="text-xs text-gray-400">Real-time updates</p>
            </div>
          </div>
        )}
        
        {/* Fallback for metrics/KPI widgets that aren't SMART KPIs */}
        {(widgetType === 'kpi' || widgetType === 'metric' || widgetSubtype === 'metric') && !isSmartKPI && (
          <div className="h-48 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">KPI Metric</p>
              <p className="text-xs text-gray-400">{config.metric || 'Performance Indicator'}</p>
              <p className="text-2xl font-bold mt-2">{config.value || '85%'}</p>
            </div>
          </div>
        )}
        
        {/* Generic widget preview if no specific type matches */}
        {!widgetType && !widgetSubtype && (
          <div className="h-48 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-600">Widget</p>
              <p className="text-xs text-gray-400">Custom Component</p>
            </div>
          </div>
        )}
        
        {widget.description && (
          <p className="text-sm text-gray-500 mt-3">{widget.description}</p>
        )}
      </div>
    );
  }

  // Return a more detailed placeholder for unknown widgets
  return (
    <div className="w-full min-h-64 border rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{widget.title || widget.name || 'Untitled Widget'}</h3>
        {isSystemWidget && (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            <Settings className="h-3 w-3 mr-1" />
            System
          </Badge>
        )}
      </div>
      
      <div className="h-48 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600">Widget Preview</p>
          <p className="text-xs text-gray-400">
            {widgetType || widgetSubtype || 'Custom Component'}
          </p>
          {widget.description && (
            <p className="text-xs text-gray-500 mt-2 px-4">{widget.description}</p>
          )}
        </div>
      </div>
      
      {/* Show debug info in development */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>Type: {widgetType || 'Not specified'}</p>
        <p>Subtype: {widgetSubtype || 'Not specified'}</p>
        <p>Platform: {widget.targetPlatform || widget.target_platform || 'both'}</p>
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
  widgetType?: string; // The actual widget type from database (kpi, gauge, chart, etc.)
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
  const [filterSource, setFilterSource] = useState("all");
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
  const [widgetStudioOpen, setWidgetStudioOpen] = useState(false);
  const [widgetStudioType, setWidgetStudioType] = useState<'chart' | 'gauge' | 'table' | 'activity' | undefined>(undefined);
  const [widgetToEdit, setWidgetToEdit] = useState<any>(null);

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
            title: widget.title || widget.name || 'Untitled Widget',
            description: widget.subtitle || widget.description || '',
            configuration: widget.configuration || widget.config || {},
            data: widget.data || {}, // Preserve the data field for pre-built widgets
            widgetType: widget.widget_type || widget.widgetType, // Add the actual widget type from database
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
            configuration: dashboard.configuration || {}, // Use dashboard.configuration instead of dashboard.config
            status: dashboard.isActive ? 'active' : 'draft',
            targetPlatform: dashboard.target_platform || dashboard.targetPlatform || 'both',
            createdAt: dashboard.created_at || dashboard.createdAt || new Date().toISOString(),
            updatedAt: dashboard.updated_at || dashboard.updatedAt || dashboard.created_at || dashboard.createdAt || new Date().toISOString(),
            createdBy: dashboard.created_by?.toString() || dashboard.createdBy?.toString() || dashboard.userId?.toString(),
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
    
    // For widgets, filter by source (user/system)
    let matchesSource = true;
    if (activeTab === 'widgets' && filterSource !== 'all') {
      const isSystemWidget = item.configuration?.isSystemWidget || item.data?.isSystemWidget;
      matchesSource = (filterSource === 'system' && isSystemWidget) || 
                     (filterSource === 'user' && !isSystemWidget);
    }
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesSource;
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
      // Analyze prompt to determine widget type
      const promptLower = aiPrompt.toLowerCase();
      
      if (activeTab === 'widgets') {
        // Detect and open appropriate widget studio based on prompt
        if (promptLower.includes('kpi') || promptLower.includes('metric') || promptLower.includes('performance')) {
          // SMART KPI Widget
          setSelectedItem({
            id: '',
            type: 'widget',
            title: aiPrompt.split(' ').slice(0, 5).join(' '),
            description: aiPrompt,
            configuration: {},
            status: 'draft',
            targetPlatform: 'both',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setSmartKPIStudioOpen(true);
          setShowAIAssistant(false);
        } else if (promptLower.includes('chart') || promptLower.includes('graph') || promptLower.includes('trend')) {
          // Chart Widget
          setWidgetToEdit(null);
          setWidgetStudioType('chart');
          setWidgetStudioOpen(true);
          setShowAIAssistant(false);
        } else if (promptLower.includes('gauge') || promptLower.includes('meter') || promptLower.includes('progress')) {
          // Gauge Widget
          setWidgetToEdit(null);
          setWidgetStudioType('gauge');
          setWidgetStudioOpen(true);
          setShowAIAssistant(false);
        } else if (promptLower.includes('table') || promptLower.includes('grid') || promptLower.includes('list')) {
          // Table Widget
          setWidgetToEdit(null);
          setWidgetStudioType('table');
          setWidgetStudioOpen(true);
          setShowAIAssistant(false);
        } else if (promptLower.includes('activity') || promptLower.includes('feed') || promptLower.includes('timeline') || promptLower.includes('alert')) {
          // Activity Widget
          setWidgetToEdit(null);
          setWidgetStudioType('activity');
          setWidgetStudioOpen(true);
          setShowAIAssistant(false);
        } else {
          // Default to chart widget
          setWidgetToEdit(null);
          setWidgetStudioType('chart');
          setWidgetStudioOpen(true);
          setShowAIAssistant(false);
        }
        
        toast({
          title: "Opening Widget Studio",
          description: "Creating your widget based on the prompt."
        });
      } else {
        // For dashboards and other types, use the existing flow
        const response = await apiRequest('POST', '/api/ai/design-studio', {
          prompt: aiPrompt,
          context: activeTab
        });
        
        const result = await response.json();
        
        if (result.action === 'create_dashboard' && activeTab === 'dashboards') {
          // Open visual designer for dashboard creation
          setDashboardToEdit(null);
          setShowVisualDesigner(true);
          setShowAIAssistant(false);
        } else {
          setCreateForm({
            ...createForm,
            title: result.title || `AI Generated ${activeTab.slice(0, -1)}`,
            description: result.description || aiPrompt,
            configuration: result.configuration || {}
          });
        }
        
        toast({
          title: "AI Generation Complete",
          description: "Review and customize the generated design."
        });
        
        setShowAIAssistant(false);
      }
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
    
    // Check for other widget types
    const widgetType = item.data?.widgetType || item.configuration?.widgetType;
    const isChartWidget = widgetType === 'chart' || item.title?.toLowerCase().includes('chart');
    const isGaugeWidget = widgetType === 'gauge' || item.title?.toLowerCase().includes('gauge');
    const isTableWidget = widgetType === 'table' || item.title?.toLowerCase().includes('table');
    const isActivityWidget = widgetType === 'activity' || item.title?.toLowerCase().includes('activity');
    
    if (activeTab === 'widgets') {
      if (isSmartKPIWidget) {
        // Open SMART KPI Widget Studio with existing data
        setSelectedItem(item);
        setSmartKPIStudioOpen(true);
      } else if (isChartWidget || isGaugeWidget || isTableWidget || isActivityWidget) {
        // Open Widget Studio for other widget types
        setWidgetToEdit(item);
        setWidgetStudioType(undefined); // Let studio determine type from widget
        setWidgetStudioOpen(true);
      } else {
        // For unknown widgets, use regular edit mode
        setSelectedItem(item);
        setEditMode(true);
      }
    } else {
      // For non-widget items, use regular edit mode
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

  const getWidgetTypeInfo = (item: DesignItem) => {
    // Use the widgetType field from the item if available (this is from the database)
    const widgetType = item.widgetType || item.configuration?.widgetType || item.data?.widgetType;
    
    // Check various indicators for KPI widgets
    const isKPI = widgetType === 'kpi' ||
                  widgetType === 'smart-kpi' || 
                  item.data?.widgetType === 'smart-kpi' || 
                  item.configuration?.widgetType === 'smart-kpi' ||
                  item.configuration?.widgetType === 'metric' ||
                  item.title?.toLowerCase().includes('kpi') ||
                  item.data?.template || // Has template field indicating it's from SMART KPI studio
                  item.configuration?.metricName || // Has metric configuration
                  item.data?.calculation; // Has calculation data
    
    if (isKPI) {
      return {
        category: 'KPI',
        icon: <Target className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Key Performance Indicator'
      };
    }

    switch (widgetType) {
      case 'chart':
        return {
          category: 'Chart',
          icon: <BarChart3 className="h-3 w-3" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Data Visualization'
        };
      case 'gauge':
        return {
          category: 'Gauge',
          icon: <Gauge className="h-3 w-3" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'Gauge Display'
        };
      case 'table':
        return {
          category: 'Table',
          icon: <Grid className="h-3 w-3" />,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Data Table'
        };
      case 'activity':
        return {
          category: 'Activity',
          icon: <Activity className="h-3 w-3" />,
          color: 'bg-teal-100 text-teal-800 border-teal-200',
          description: 'Activity Monitor'
        };
      case 'system':
        return {
          category: 'System',
          icon: <Settings className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'System Widget'
        };
      default:
        return {
          category: 'Widget',
          icon: <Package className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Custom Widget'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold">UI Design Studio</h1>
        </div>



        {/* AI Assistant Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
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
                  <Sparkles className="h-4 w-4" />
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
                        className="pl-12"
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
                    {activeTab === 'widgets' && (
                      <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="user">User Created</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'widgets' ? (
                      <>
                        {/* Dropdown menu for widget creation */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Widget
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {/* SMART KPI */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(null);
                                setSmartKPIStudioOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Target className="h-4 w-4 mr-2 text-purple-600" />
                              SMART KPI Widget
                            </DropdownMenuItem>
                            
                            {/* Chart */}
                            <DropdownMenuItem
                              onClick={() => {
                                setWidgetStudioType('chart');
                                setWidgetToEdit(null);
                                setWidgetStudioOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                              Chart Widget
                            </DropdownMenuItem>
                            
                            {/* Gauge */}
                            <DropdownMenuItem
                              onClick={() => {
                                setWidgetStudioType('gauge');
                                setWidgetToEdit(null);
                                setWidgetStudioOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Gauge className="h-4 w-4 mr-2 text-purple-600" />
                              Gauge Widget
                            </DropdownMenuItem>
                            
                            {/* Table */}
                            <DropdownMenuItem
                              onClick={() => {
                                setWidgetStudioType('table');
                                setWidgetToEdit(null);
                                setWidgetStudioOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Grid className="h-4 w-4 mr-2 text-orange-600" />
                              Table Widget
                            </DropdownMenuItem>
                            
                            {/* Activity */}
                            <DropdownMenuItem
                              onClick={() => {
                                setWidgetStudioType('activity');
                                setWidgetToEdit(null);
                                setWidgetStudioOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Activity className="h-4 w-4 mr-2 text-teal-600" />
                              Activity Widget
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
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
                </div>
              </div>

              {/* Tab Content */}
              <TabsContent value={activeTab} className="h-full m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
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
                      <div className="space-y-6">
                        {/* Professional Sample Widgets Section */}
                        <div className="max-w-4xl mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Professional Templates</h3>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await apiRequest('POST', '/api/seeds/sample-widgets');
                                  await response.json();
                                  queryClient.invalidateQueries({ queryKey: ['/api/design-studio/widgets'] });
                                  toast({
                                    title: "Sample Widgets Created",
                                    description: "Professional widget templates have been loaded."
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to create sample widgets.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Load Professional Templates
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            <Card className="border border-green-200 bg-green-50 dark:bg-green-900/20 hover:shadow-lg transition-shadow cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 bg-green-600 rounded">
                                    <Target className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm font-medium">Production Efficiency</span>
                                </div>
                                <p className="text-xs text-muted-foreground">OEE monitoring with real-time alerts</p>
                              </CardContent>
                            </Card>
                            <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:shadow-lg transition-shadow cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 bg-blue-600 rounded">
                                    <Gauge className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm font-medium">Machine Utilization</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Resource utilization dashboard</p>
                              </CardContent>
                            </Card>
                            <Card className="border border-purple-200 bg-purple-50 dark:bg-purple-900/20 hover:shadow-lg transition-shadow cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 bg-purple-600 rounded">
                                    <BarChart3 className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm font-medium">Production Trends</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Volume forecasting charts</p>
                              </CardContent>
                            </Card>
                            <Card className="border border-orange-200 bg-orange-50 dark:bg-orange-900/20 hover:shadow-lg transition-shadow cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 bg-orange-600 rounded">
                                    <Activity className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm font-medium">Events Feed</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Real-time production events</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

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
                        
                        {/* Other Widget Types */}
                        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                          {/* Charts */}
                          <Card className="border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                            setWidgetStudioType('chart');
                            setWidgetToEdit(null);
                            setWidgetStudioOpen(true);
                          }}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <div className="p-1 bg-green-600 rounded">
                                  <BarChart3 className="h-3 w-3 text-white" />
                                </div>
                                Charts
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground mb-2">
                                Line, bar, pie, area charts
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Create Chart Widget
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Gauges */}
                          <Card className="border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                            setWidgetStudioType('gauge');
                            setWidgetToEdit(null);
                            setWidgetStudioOpen(true);
                          }}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <div className="p-1 bg-purple-600 rounded">
                                  <Gauge className="h-3 w-3 text-white" />
                                </div>
                                Gauges
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground mb-2">
                                Radial, linear, speedometer
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Create Gauge Widget
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Tables */}
                          <Card className="border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                            setWidgetStudioType('table');
                            setWidgetToEdit(null);
                            setWidgetStudioOpen(true);
                          }}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <div className="p-1 bg-orange-600 rounded">
                                  <Grid className="h-3 w-3 text-white" />
                                </div>
                                Tables
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground mb-2">
                                Data tables, pivot tables
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Create Table Widget
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Activity */}
                          <Card className="border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                            setWidgetStudioType('activity');
                            setWidgetToEdit(null);
                            setWidgetStudioOpen(true);
                          }}>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <div className="p-1 bg-teal-600 rounded">
                                  <Activity className="h-3 w-3 text-white" />
                                </div>
                                Activity
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground mb-2">
                                Feeds, timelines, alerts
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Create Activity Widget
                              </Button>
                            </CardContent>
                          </Card>

                          {/* System Widgets */}
                          <Card className="border border-gray-500 bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <div className="p-1 bg-gray-600 rounded">
                                  <Settings className="h-3 w-3 text-white" />
                                </div>
                                System Widgets
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground mb-2">
                                System-created, read-only
                              </p>
                              <Button variant="outline" size="sm" className="w-full" disabled>
                                Created by System Only
                              </Button>
                            </CardContent>
                          </Card>
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
                      <div className="mb-6 space-y-4">
                        {/* Quick Creation */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
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
                                <Target className="h-3 w-3 mr-1" />
                                SMART KPI Widget
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Widget Categories */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Widget Categories</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                              <Target className="h-4 w-4 text-blue-600" />
                              <div className="text-xs">
                                <div className="font-medium text-blue-800 dark:text-blue-300">KPI</div>
                                <div className="text-gray-500">Performance Metrics</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                              <BarChart3 className="h-4 w-4 text-green-600" />
                              <div className="text-xs">
                                <div className="font-medium text-green-800 dark:text-green-300">Chart</div>
                                <div className="text-gray-500">Data Visualization</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                              <Gauge className="h-4 w-4 text-purple-600" />
                              <div className="text-xs">
                                <div className="font-medium text-purple-800 dark:text-purple-300">Gauge</div>
                                <div className="text-gray-500">Visual Meters</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700">
                              <Grid className="h-4 w-4 text-orange-600" />
                              <div className="text-xs">
                                <div className="font-medium text-orange-800 dark:text-orange-300">Table</div>
                                <div className="text-gray-500">Data Tables</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-teal-200 dark:border-teal-700">
                              <Activity className="h-4 w-4 text-teal-600" />
                              <div className="text-xs">
                                <div className="font-medium text-teal-800 dark:text-teal-300">Activity</div>
                                <div className="text-gray-500">Live Monitoring</div>
                              </div>
                            </div>
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
                      {filteredItems.map((item) => {
                        const isSystemWidget = item.configuration?.isSystemWidget || item.data?.isSystemWidget;
                        const widgetTypeInfo = getWidgetTypeInfo(item);
                        
                        return (
                        <Card 
                        key={item.id} 
                        className={`transition-shadow ${
                          isSystemWidget 
                            ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 cursor-default opacity-75'
                            : 'hover:shadow-lg cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isSystemWidget) return; // Prevent editing System widgets
                          
                          if (activeTab === 'dashboards') {
                            // Open dashboard in visual designer for viewing/editing
                            console.log('Dashboard clicked:', item);
                            console.log('Dashboard configuration:', item.configuration);
                            
                            setDashboardToEdit({
                              id: item.id,
                              name: item.title,
                              description: item.description,
                              layout: item.configuration?.layout || "grid",
                              gridColumns: item.configuration?.gridColumns || 12,
                              widgets: item.configuration?.widgets !== undefined ? item.configuration.widgets : (item.configuration?.customWidgets || item.configuration?.standardWidgets || []),
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
                            <div className="flex flex-col gap-1 items-end">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              {activeTab === 'widgets' && (() => {
                                const typeInfo = getWidgetTypeInfo(item);
                                return (
                                  <div className="flex flex-col gap-1 items-end">
                                    <Badge variant="outline" className={`text-xs border ${typeInfo.color}`}>
                                      <div className="flex items-center gap-1">
                                        {typeInfo.icon}
                                        {typeInfo.category}
                                      </div>
                                    </Badge>
                                    {isSystemWidget && (
                                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                                        <Settings className="h-2 w-2 mr-1" />
                                        System
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.description || `No description provided`}
                            </p>
                            {activeTab === 'widgets' && (() => {
                              const typeInfo = getWidgetTypeInfo(item);
                              return (
                                <p className="text-xs text-gray-500 italic">
                                  {typeInfo.description}
                                </p>
                              );
                            })()}
                          </div>
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
                                disabled={isSystemWidget}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSystemWidget) return;
                                  if (activeTab === 'dashboards') {
                                    // Edit dashboard with visual designer
                                    setDashboardToEdit({
                                      id: item.id,
                                      name: item.title,
                                      description: item.description,
                                      layout: item.configuration?.layout || "grid",
                                      gridColumns: item.configuration?.gridColumns || 12,
                                      widgets: item.configuration?.widgets !== undefined ? item.configuration.widgets : (item.configuration?.customWidgets || item.configuration?.standardWidgets || []),
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
                                disabled={isSystemWidget}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSystemWidget) return;
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
                        );
                      })}
                    </div>
                  </>
                )}
                  </div>
                </ScrollArea>
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
                <div className="w-full min-h-96 bg-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
                      <p className="text-sm text-gray-500">{selectedItem.description}</p>
                    </div>
                    <Badge>{selectedItem.configuration?.layout || 'grid'}</Badge>
                  </div>
                  
                  {/* Dashboard Layout Preview */}
                  <div className={`grid gap-4 ${
                    selectedItem.configuration?.layout === 'masonry' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : `grid-cols-${selectedItem.configuration?.gridColumns || 12}`
                  }`}>
                    
                    {/* Sample Dashboard Widgets */}
                    <div className="col-span-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 h-32 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Production Chart</p>
                      </div>
                    </div>
                    
                    <div className="col-span-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 h-32 flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-xl font-bold">94.2%</p>
                        <p className="text-sm">Efficiency</p>
                      </div>
                    </div>
                    
                    <div className="col-span-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 h-32 flex items-center justify-center">
                      <div className="text-center">
                        <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-xl font-bold">87</p>
                        <p className="text-sm">Active Orders</p>
                      </div>
                    </div>
                    
                    <div className="col-span-6 bg-gray-50 rounded-lg p-4 h-40">
                      <h4 className="font-medium mb-3">Recent Activities</h4>
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Order #{1000 + i} completed</span>
                            <span className="text-gray-400 ml-auto">2 min ago</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="col-span-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 h-40 flex items-center justify-center">
                      <div className="text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <p className="text-lg font-bold">3</p>
                        <p className="text-sm">Alerts</p>
                        <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                      </div>
                    </div>
                    
                  </div>
                  
                  {selectedItem.configuration?.widgets && selectedItem.configuration.widgets.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Contains {selectedItem.configuration.widgets.length} custom widget(s)
                      </p>
                    </div>
                  )}
                </div>
              )}
              {selectedItem?.type === 'page' && (
                <div className="w-full min-h-96 bg-white rounded-lg border overflow-hidden">
                  {/* Page Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-medium">{selectedItem.title}</h3>
                    <Badge>{selectedItem.targetPlatform}</Badge>
                  </div>
                  
                  {/* Page Content Preview */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-72"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-blue-500 rounded w-20"></div>
                          <div className="h-8 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                      
                      {/* Content Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                      
                      {/* Table/List Section */}
                      <div className="border rounded-lg">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                        </div>
                        <div className="p-4 space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="h-3 bg-gray-200 rounded flex-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {selectedItem.description && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">{selectedItem.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedItem?.type === 'menu' && (
                <div className="w-full min-h-64 bg-white rounded-lg border overflow-hidden">
                  {/* Menu Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-medium">{selectedItem.title}</h3>
                    <Badge>{selectedItem.targetPlatform}</Badge>
                  </div>
                  
                  {/* Menu Structure Preview */}
                  <div className="p-4">
                    <div className="space-y-2">
                      {/* Main Menu Items */}
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Layout className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Dashboard</span>
                        <Badge variant="outline" className="ml-auto">Home</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Production</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                      </div>
                      
                      {/* Sub-menu items */}
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 rounded text-sm">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span>Orders</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 rounded text-sm">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span>Operations</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 rounded text-sm">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span>Resources</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Analytics</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Settings</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                      </div>
                    </div>
                    
                    {selectedItem.description && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">{selectedItem.description}</p>
                      </div>
                    )}
                  </div>
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
          dashboard={dashboardToEdit ? {
            ...dashboardToEdit,
            widgets: dashboardToEdit.configuration?.customWidgets || dashboardToEdit.configuration?.standardWidgets || dashboardToEdit.widgets || [],
            layout: dashboardToEdit.configuration?.layout || dashboardToEdit.layout,
            gridColumns: dashboardToEdit.configuration?.gridColumns || dashboardToEdit.gridColumns
          } : null}
          onSave={async (dashboardConfig) => {
            // Save dashboard configuration
            const dashboardData = {
              name: dashboardConfig.name,
              description: dashboardConfig.description,
              targetPlatform: dashboardConfig.targetPlatform,
              configuration: {
                layout: dashboardConfig.layout,
                gridColumns: dashboardConfig.gridColumns,
                standardWidgets: [],
                customWidgets: dashboardConfig.widgets || []
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
        
        {/* General Widget Studio for Charts, Gauges, Tables, Activity */}
        <WidgetStudio
          open={widgetStudioOpen}
          onOpenChange={setWidgetStudioOpen}
          existingWidget={widgetToEdit}
          widgetType={widgetStudioType}
        />

      </div>
    </div>
  );
}