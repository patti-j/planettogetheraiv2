import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  Edit3, 
  Grid, 
  BarChart3, 
  FileText, 
  Smartphone, 
  Monitor,
  TabletSmartphone as TabsIcon,
  Palette,
  Component,
  Database,
  Search,
  Filter,
  MoreVertical,
  Bot,
  Sparkles,
  Wand2,
  X
} from 'lucide-react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import WidgetDesignStudio from '@/components/widget-design-studio';
import { EnhancedDashboardManager } from '@/components/dashboard-manager-enhanced';
import AIDesignStudio from '@/components/ai-design-studio';
import { MobileDesignStudio } from './design-studio-mobile';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  type: 'grid' | 'tabs' | 'dashboard' | 'custom';
  category: string;
  preview?: string;
}

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  targetPlatform: 'mobile' | 'desktop' | 'both';
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgetCount: number;
}

const pageTemplates: PageTemplate[] = [
  {
    id: 'production-overview',
    name: 'Production Overview',
    description: 'Comprehensive production monitoring and control',
    type: 'dashboard',
    category: 'Operations'
  },
  {
    id: 'quality-dashboard',
    name: 'Quality Dashboard',
    description: 'Quality metrics and compliance tracking',
    type: 'grid',
    category: 'Quality'
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management', 
    description: 'Stock levels, transactions, and forecasting',
    type: 'tabs',
    category: 'Inventory'
  },
  {
    id: 'analytics-hub',
    name: 'Analytics Hub',
    description: 'Advanced analytics and reporting center',
    type: 'custom',
    category: 'Analytics'
  }
];

const widgetTemplates: WidgetTemplate[] = [
  // Original widgets
  {
    id: 'kpi-card',
    name: 'KPI Card',
    description: 'Key performance indicator display',
    type: 'kpi',
    category: 'Metrics',
    targetPlatform: 'both'
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Time-series data visualization',
    type: 'chart',
    category: 'Charts',
    targetPlatform: 'both'
  },
  {
    id: 'status-table',
    name: 'Status Table',
    description: 'Tabular data with status indicators',
    type: 'table',
    category: 'Data',
    targetPlatform: 'desktop'
  },
  {
    id: 'mobile-list',
    name: 'Mobile List',
    description: 'Compact list view for mobile',
    type: 'list',
    category: 'Mobile',
    targetPlatform: 'mobile'
  },
  
  // New Common Widget Components
  {
    id: 'filter-search-widget',
    name: 'Filter & Search',
    description: 'Search input with filter dropdowns and active filters',
    type: 'filter-search',
    category: 'Controls',
    targetPlatform: 'both'
  },
  {
    id: 'metrics-card-widget',
    name: 'Metrics Card',
    description: 'Advanced metrics display with trends and progress',
    type: 'metrics-card',
    category: 'Metrics',
    targetPlatform: 'both'
  },
  {
    id: 'status-indicator-widget',
    name: 'Status Indicator',
    description: 'Status badges and progress indicators',
    type: 'status-indicator',
    category: 'Status',
    targetPlatform: 'both'
  },
  {
    id: 'data-table-widget',
    name: 'Data Table',
    description: 'Full-featured data table with sorting and filtering',
    type: 'data-table',
    category: 'Data',
    targetPlatform: 'both'
  },
  {
    id: 'action-buttons-widget',
    name: 'Action Buttons',
    description: 'Button groups with dropdown overflow',
    type: 'action-buttons',
    category: 'Controls',
    targetPlatform: 'both'
  },
  {
    id: 'kanban-card-widget',
    name: 'Kanban Card',
    description: 'Draggable cards for kanban boards',
    type: 'kanban-card',
    category: 'Cards',
    targetPlatform: 'both'
  }
];

const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'factory-overview',
    name: 'Factory Overview',
    description: 'Complete factory status at a glance',
    category: 'Operations',
    widgetCount: 8
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level business metrics',
    category: 'Management',
    widgetCount: 6
  },
  {
    id: 'maintenance-center',
    name: 'Maintenance Center',
    description: 'Equipment health and maintenance schedules',
    category: 'Maintenance',
    widgetCount: 5
  }
];

export default function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  console.log("🎨 DesignStudio render - open:", open);
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [activeTab, setActiveTab] = useState('widgets');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [justOpened, setJustOpened] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog states for nested editors
  const [widgetStudioOpen, setWidgetStudioOpen] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [aiDesignStudioOpen, setAiDesignStudioOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingDashboard, setEditingDashboard] = useState(null);

  const categories = ['All', 'Operations', 'Quality', 'Inventory', 'Analytics', 'Management', 'Maintenance', 'Mobile', 'Controls', 'Status', 'Data', 'Cards', 'Charts'];

  const filteredPageTemplates = pageTemplates.filter(template => 
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredWidgetTemplates = widgetTemplates.filter(template =>
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDashboardTemplates = dashboardTemplates.filter(template =>
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (searchTerm === '' || template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: any) => {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData)
      });
      if (!response.ok) throw new Error('Failed to create page');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Page created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create page", variant: "destructive" });
    }
  });

  // Create dashboard mutation
  const createDashboardMutation = useMutation({
    mutationFn: async (dashboardData: any) => {
      const response = await fetch('/api/mobile/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboardData)
      });
      if (!response.ok) throw new Error('Failed to create dashboard');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Dashboard created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/dashboards'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create dashboard", variant: "destructive" });
    }
  });

  const handleCreatePage = (template: PageTemplate) => {
    console.log('📄 Creating page from template:', template);
    try {
      const pageData = {
        title: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        layout: {
          type: template.type,
          columns: 12,
          rows: 8,
          widgets: [],
          settings: {
            responsive: true,
            mobileOptimized: true,
            showHeader: true,
            showFilters: false,
            theme: 'auto'
          }
        }
      };
      console.log('📄 Submitting page data:', pageData);
      createPageMutation.mutate(pageData);
    } catch (error) {
      console.error('❌ Error creating page:', error);
    }
  };

  const handleCreateWidget = (template: WidgetTemplate) => {
    console.log('🔧 Creating widget from template:', template);
    console.log('🔧 Current widget studio state:', widgetStudioOpen);
    console.log('🔧 Current editing widget state:', editingWidget);
    try {
      const newEditingWidget = {
        title: template.name,
        type: template.type,
        category: template.category,
        targetPlatform: template.targetPlatform,
        description: template.description
      };
      console.log('🔧 Setting editing widget to:', newEditingWidget);
      setEditingWidget(newEditingWidget);
      console.log('🔧 Opening widget studio...');
      setWidgetStudioOpen(true);
      console.log('🔧 Widget studio should now be open');
    } catch (error) {
      console.error('❌ Error creating widget:', error);
    }
  };

  const handleCreateDashboard = (template: DashboardTemplate) => {
    console.log('Creating dashboard from template:', template);
    const dashboardData = {
      title: template.name,
      description: template.description,
      targetPlatform: 'both',
      configuration: {
        layout: template.category.toLowerCase(),
        widgets: []
      }
    };
    createDashboardMutation.mutate(dashboardData);
  };

  const handleEditWidget = (template: WidgetTemplate) => {
    console.log('✏️ Editing widget template:', template);
    console.log('✏️ Current widget studio state:', widgetStudioOpen);
    console.log('✏️ Current editing widget state:', editingWidget);
    try {
      const newEditingWidget = {
        title: template.name,
        type: template.type,
        category: template.category,
        targetPlatform: template.targetPlatform,
        description: template.description,
        isTemplate: true,
        templateId: template.id
      };
      console.log('✏️ Setting editing widget to:', newEditingWidget);
      setEditingWidget(newEditingWidget);
      console.log('✏️ Opening widget studio for editing...');
      setWidgetStudioOpen(true);
      console.log('✏️ Widget studio should now be open');
    } catch (error) {
      console.error('❌ Error editing widget:', error);
    }
  };

  // Track when dialog opens to prevent immediate close
  React.useEffect(() => {
    if (open && !justOpened) {
      setJustOpened(true);
      setTimeout(() => setJustOpened(false), 200);
    }
  }, [open]);

  if (!open) {
    console.log("🎨 DesignStudio not rendering - open is false");
    return null;
  }

  console.log("🎨 DesignStudio rendering dialog content");
  console.log("🎨 isMobile:", isMobile);
  console.log("🎨 Screen width:", window.innerWidth);

  return (
    <div style={{ zIndex: 2147483649 }} className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className={`
        w-[90vw] max-w-[280px] h-[85vh] mx-2 
        bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col
      `}>
        {true ? ( // Force mobile layout for now
          <MobileDesignStudio
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => onOpenChange(false)}
            onAiAssistant={() => setAiDesignStudioOpen(true)}
            filteredWidgetTemplates={filteredWidgetTemplates}
            filteredDashboardTemplates={filteredDashboardTemplates}
            onCreateWidget={(template) => {
              const newWidget = {
                title: template.name,
                type: template.type,
                category: template.category,
                targetPlatform: template.targetPlatform,
                description: template.description,
                isTemplate: true,
                templateId: template.id
              };
              setEditingWidget(newWidget);
              setWidgetStudioOpen(true);
            }}
            onCreateDashboard={handleCreateDashboard}
          />
        ) : (
          // Desktop: Existing layout with constrained height  
          <>
            <div className="flex-shrink-0 p-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Design Studio</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Create and manage pages, dashboards, and widgets in one integrated workspace
              </p>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* AI Design Assistant Button */}
              <div className="p-4 border-b flex-shrink-0">
                <Button
                  onClick={() => setAiDesignStudioOpen(true)}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bot className="w-5 h-5" />
                      <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
                    </div>
                    <span>AI Design Assistant</span>
                    <Wand2 className="w-4 h-4" />
                  </div>
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Create, modify, or remove pages, widgets, and dashboards with AI
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4 p-4 border-b flex-shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                  <TabsTrigger value="widgets" className="flex items-center gap-2">
                    <Component className="w-4 h-4" />
                    Widgets
                  </TabsTrigger>
                  <TabsTrigger value="dashboards" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboards
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Pages
                  </TabsTrigger>
                  <TabsTrigger value="menu" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Menu
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabsContent value="widgets" className="h-full m-0 overflow-hidden">
                    <ScrollArea className="h-full" style={{ height: '100%' }}>
                      <div className="p-4 pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredWidgetTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {template.category}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs flex items-center gap-1"
                                      >
                                        {template.targetPlatform === 'mobile' && <Smartphone className="w-3 h-3" />}
                                        {template.targetPlatform === 'desktop' && <Monitor className="w-3 h-3" />}
                                        {template.targetPlatform === 'both' && <Grid className="w-3 h-3" />}
                                        {template.targetPlatform}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>  
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-4">
                                  {template.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🔘 Desktop Create button clicked for widget:', template.name);
                                      handleCreateWidget(template);
                                    }}
                                    className="flex-1"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🔘 Desktop Edit button clicked for widget:', template.name);
                                      handleEditWidget(template);
                                    }}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="widgets" className="h-full m-0 overflow-hidden">
                    <ScrollArea className="h-full" style={{ height: '100%' }}>
                      <div className="p-4 pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredWidgetTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {template.category}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs flex items-center gap-1"
                                      >
                                        {template.targetPlatform === 'mobile' && <Smartphone className="w-3 h-3" />}
                                        {template.targetPlatform === 'desktop' && <Monitor className="w-3 h-3" />}
                                        {template.targetPlatform === 'both' && <Grid className="w-3 h-3" />}
                                        {template.targetPlatform}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-4">
                                  {template.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🔘 Desktop Create button clicked for widget:', template.name);
                                      handleCreateWidget(template);
                                    }}
                                    className="flex-1"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🔘 Desktop Edit button clicked for widget:', template.name);
                                      handleEditWidget(template);
                                    }}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="dashboards" className="h-full m-0 overflow-hidden">
                    <ScrollArea className="h-full" style={{ height: '100%' }}>
                      <div className="p-4 pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredDashboardTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      {template.category}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground">
                                    <BarChart3 className="w-4 h-4" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-4">
                                  {template.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                  <span>{template.widgetCount} widgets</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCreateDashboard(template)}
                                    className="flex-1"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="pages" className="h-full m-0 overflow-hidden">
                    <ScrollArea className="h-full" style={{ height: '100%' }}>
                      <div className="p-4 pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredPageTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      {template.category}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground">
                                    {template.type === 'grid' && <Grid className="w-4 h-4" />}
                                    {template.type === 'tabs' && <TabsIcon className="w-4 h-4" />}
                                    {template.type === 'dashboard' && <BarChart3 className="w-4 h-4" />}
                                    {template.type === 'custom' && <Settings className="w-4 h-4" />}
                                  </div>
                                </div>
                              </CardHeader>  
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-4">
                                  {template.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCreatePage(template)}
                                    className="flex-1"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="menu" className="h-full m-0 overflow-hidden">
                    <ScrollArea className="h-full" style={{ height: '100%' }}>
                      <div className="p-4 pb-6">
                        <div className="text-center py-8 text-muted-foreground">
                          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Menu management coming soon</p>
                          <p className="text-sm">Configure sidebar navigation and organization</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </div>
      
      {/* Nested Widget Design Studio */}
      <WidgetDesignStudio
        open={widgetStudioOpen}
        onOpenChange={setWidgetStudioOpen}
        editingWidget={editingWidget}
        mode={editingWidget ? 'edit' : 'create'}
        onWidgetCreate={(widget, targetSystems) => {
          console.log('Widget created:', widget, targetSystems);
          setWidgetStudioOpen(false);
          setEditingWidget(null);
          toast({ title: "Success", description: "Widget created successfully" });
        }}
      />

      {/* AI Design Studio */}
      <AIDesignStudio
        open={aiDesignStudioOpen}
        onOpenChange={setAiDesignStudioOpen}
      />
    </div>
  );
}