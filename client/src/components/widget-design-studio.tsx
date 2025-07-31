import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Gauge, 
  Table, 
  AlertTriangle, 
  Bell, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Users, 
  Factory, 
  CheckCircle, 
  Clock, 
  Target,
  Settings,
  Eye,
  Save,
  Copy,
  Trash2,
  Plus,
  Palette,
  Layout,
  Database,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import UniversalWidget from './universal-widget';
import { WidgetConfig, SystemData, WidgetTemplate, WIDGET_TEMPLATES } from '@/lib/widget-library';

// Widget template interface imported from widget library

interface WidgetDesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetCreate?: (widget: WidgetConfig, targetSystems: string[]) => void;
  editingWidget?: WidgetConfig;
  mode?: 'create' | 'edit';
}

// Widget templates are imported from the unified widget library

const DATA_SOURCES = [
  { value: 'productionOrders', label: 'Production Orders' },
  { value: 'operations', label: 'Operations' },
  { value: 'resources', label: 'Resources' },
  { value: 'customers', label: 'Customers' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'plants', label: 'Plants' },
  { value: 'capabilities', label: 'Capabilities' },
  { value: 'recipes', label: 'Recipes' },
  { value: 'productionVersions', label: 'Production Versions' },
  { value: 'plannedOrders', label: 'Planned Orders' },
  { value: 'users', label: 'Users' },
  { value: 'metrics', label: 'Metrics' },
  { value: 'alerts', label: 'Alerts' }
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'number', label: 'Number Display' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'progress', label: 'Progress Bar' }
];

const AGGREGATION_TYPES = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
];

const TARGET_SYSTEMS = [
  { value: 'cockpit', label: 'Cockpit Dashboard' },
  { value: 'analytics', label: 'Analytics Page' },
  { value: 'canvas', label: 'Max AI Canvas' },
  { value: 'dashboard', label: 'Custom Dashboards' }
];

export default function WidgetDesignStudio({ 
  open, 
  onOpenChange, 
  onWidgetCreate,
  editingWidget,
  mode = 'create' 
}: WidgetDesignStudioProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Widget configuration state
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<Partial<WidgetConfig>>({});
  const [targetSystems, setTargetSystems] = useState<string[]>(['analytics']);
  const [previewData, setPreviewData] = useState<SystemData>({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('template');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load system data for preview
  const { data: productionOrders = [] } = useQuery({ queryKey: ["/api/production-orders"] });
  const { data: operations = [] } = useQuery({ queryKey: ["/api/operations"] });
  const { data: resources = [] } = useQuery({ queryKey: ["/api/resources"] });
  const { data: metrics } = useQuery({ queryKey: ["/api/metrics"] });

  // Initialize preview data with memoization to prevent infinite re-renders
  useEffect(() => {
    // Use real data if available, otherwise provide meaningful mock data for preview
    const mockProductionOrders = [
      { id: 1, orderNumber: 'PO-2025-001', name: 'Paracetamol 500mg', status: 'in_progress', quantity: 5000, progress: 75 },
      { id: 2, orderNumber: 'PO-2025-002', name: 'Ibuprofen 200mg', status: 'planned', quantity: 3000, progress: 0 },
      { id: 3, orderNumber: 'PO-2025-003', name: 'Aspirin 100mg', status: 'completed', quantity: 2000, progress: 100 }
    ];

    const mockOperations = [
      { id: 1, operationName: 'Mixing', status: 'active', progress: 85, estimatedTime: 120 },
      { id: 2, operationName: 'Tablet Pressing', status: 'queued', progress: 0, estimatedTime: 180 },
      { id: 3, operationName: 'Coating', status: 'completed', progress: 100, estimatedTime: 90 }
    ];

    const mockResources = [
      { id: 1, name: 'Reactor 1', type: 'Equipment', status: 'active', utilization: 85 },
      { id: 2, name: 'Tablet Press A', type: 'Equipment', status: 'idle', utilization: 0 },
      { id: 3, name: 'Packaging Line 1', type: 'Equipment', status: 'maintenance', utilization: 0 }
    ];

    const newPreviewData = {
      productionOrders: Array.isArray(productionOrders) && productionOrders.length > 0 ? productionOrders : mockProductionOrders,
      operations: Array.isArray(operations) && operations.length > 0 ? operations : mockOperations,
      resources: Array.isArray(resources) && resources.length > 0 ? resources : mockResources,
      metrics: metrics && Object.keys(metrics).length > 0 ? metrics : {
        totalOrders: 15,
        completedOrders: 8,
        activeOperations: 5,
        equipmentUtilization: 72,
        dailyOutput: 12500
      },
      jobs: Array.isArray(productionOrders) && productionOrders.length > 0 ? productionOrders : mockProductionOrders,
      alerts: [
        { id: 1, title: 'Equipment Maintenance', severity: 'warning', message: 'Reactor 2 requires scheduled maintenance' },
        { id: 2, title: 'Production Delay', severity: 'info', message: 'PO-2025-004 delayed by 2 hours' }
      ],
      customers: [
        { id: 1, name: 'PharmaCorp Ltd', status: 'active', orders: 5 },
        { id: 2, name: 'MediSupply Inc', status: 'active', orders: 3 }
      ],
      vendors: [
        { id: 1, name: 'ChemSource LLC', category: 'Raw Materials', rating: 4.8 },
        { id: 2, name: 'PackPro Solutions', category: 'Packaging', rating: 4.5 }
      ],
      plants: [
        { id: 1, name: 'Plant A - Pharmaceuticals', location: 'New Jersey', status: 'operational' },
        { id: 2, name: 'Plant B - Generics', location: 'Texas', status: 'operational' }
      ],
      capabilities: [
        { id: 1, name: 'Tablet Manufacturing', capacity: 10000, utilizationRate: 75 },
        { id: 2, name: 'Liquid Formulation', capacity: 5000, utilizationRate: 60 }
      ],
      recipes: [
        { id: 1, recipeName: 'Paracetamol 500mg', version: '1.2', status: 'approved' },
        { id: 2, recipeName: 'Ibuprofen 200mg', version: '2.0', status: 'under_review' }
      ],
      productionVersions: [
        { id: 1, versionName: 'Standard Production v1.0', efficiency: 95 },
        { id: 2, versionName: 'High Speed v2.1', efficiency: 88 }
      ],
      plannedOrders: [
        { id: 1, orderNumber: 'PLN-001', plannedDate: '2025-08-01', quantity: 7500 },
        { id: 2, orderNumber: 'PLN-002', plannedDate: '2025-08-03', quantity: 4200 }
      ],
      users: [
        { id: 1, name: 'John Smith', role: 'Production Manager', status: 'active' },
        { id: 2, name: 'Sarah Johnson', role: 'Quality Inspector', status: 'active' }
      ]
    };
    setPreviewData(newPreviewData);
  }, [
    Array.isArray(productionOrders) ? productionOrders.length : 0, 
    Array.isArray(operations) ? operations.length : 0, 
    Array.isArray(resources) ? resources.length : 0, 
    metrics
  ]);

  // Initialize editing mode
  useEffect(() => {
    if (mode === 'edit' && editingWidget) {
      setWidgetConfig(editingWidget);
      const template = WIDGET_TEMPLATES.find(t => t.type === editingWidget.type);
      setSelectedTemplate(template || null);
      setActiveTab('configure');
    }
  }, [mode, editingWidget]);

  const handleTemplateSelect = (template: WidgetTemplate) => {
    setSelectedTemplate(template);
    setWidgetConfig({
      ...template.defaultConfig,
      id: `widget_${Date.now()}`,
      title: template.name,
      subtitle: template.description
    });
    setTargetSystems(template.targetSystems);
    setActiveTab('configure');
  };

  const updateWidgetConfig = (key: string, value: any) => {
    setWidgetConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateWidgetFilters = (filters: any) => {
    setWidgetConfig(prev => ({
      ...prev,
      filters
    }));
  };

  const updateWidgetThresholds = (thresholds: any[]) => {
    setWidgetConfig(prev => ({
      ...prev,
      thresholds
    }));
  };

  const handleSaveWidget = async () => {
    if (!selectedTemplate || !widgetConfig.title || targetSystems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a template, enter a title, and choose at least one target system.",
        variant: "destructive"
      });
      return;
    }

    const finalWidget: WidgetConfig = {
      id: widgetConfig.id || `widget_${Date.now()}`,
      type: selectedTemplate.type,
      title: widgetConfig.title,
      subtitle: widgetConfig.subtitle,
      dataSource: widgetConfig.dataSource || selectedTemplate.defaultConfig.dataSource || 'productionOrders',
      chartType: widgetConfig.chartType || selectedTemplate.defaultConfig.chartType || 'bar',
      aggregation: widgetConfig.aggregation || selectedTemplate.defaultConfig.aggregation || 'count',
      groupBy: widgetConfig.groupBy || selectedTemplate.defaultConfig.groupBy,
      sortBy: widgetConfig.sortBy || selectedTemplate.defaultConfig.sortBy,
      filters: widgetConfig.filters || selectedTemplate.defaultConfig.filters,
      colors: widgetConfig.colors || selectedTemplate.defaultConfig.colors,
      thresholds: widgetConfig.thresholds || selectedTemplate.defaultConfig.thresholds,
      limit: widgetConfig.limit || selectedTemplate.defaultConfig.limit,
      size: widgetConfig.size || selectedTemplate.defaultConfig.size || { width: 400, height: 300 },
      position: widgetConfig.position || { x: 0, y: 0 },
      refreshInterval: widgetConfig.refreshInterval || selectedTemplate.defaultConfig.refreshInterval,
      drillDownTarget: widgetConfig.drillDownTarget || selectedTemplate.defaultConfig.drillDownTarget,
      drillDownParams: widgetConfig.drillDownParams || selectedTemplate.defaultConfig.drillDownParams,
      action: widgetConfig.action || selectedTemplate.defaultConfig.action,
      content: widgetConfig.content || selectedTemplate.defaultConfig.content
    };

    try {
      const deploymentPromises = [];

      // Deploy to each selected target system
      for (const targetSystem of targetSystems) {
        switch (targetSystem) {
          case 'cockpit':
            // Deploy to cockpit dashboard
            deploymentPromises.push(
              apiRequest('POST', '/api/cockpit/widgets', {
                title: finalWidget.title,
                sub_title: finalWidget.subtitle,
                type: finalWidget.type,
                layout_id: 1, // Default layout
                position: finalWidget.position,
                configuration: {
                  dataSource: finalWidget.dataSource,
                  chartType: finalWidget.chartType,
                  aggregation: finalWidget.aggregation,
                  groupBy: finalWidget.groupBy,
                  filters: finalWidget.filters,
                  colors: finalWidget.colors,
                  thresholds: finalWidget.thresholds,
                  limit: finalWidget.limit
                }
              })
            );
            break;

          case 'analytics':
            // Deploy to analytics dashboard configuration
            deploymentPromises.push(
              apiRequest('POST', '/api/analytics/widgets', {
                name: finalWidget.title,
                type: finalWidget.type,
                config: {
                  dataSource: finalWidget.dataSource,
                  chartType: finalWidget.chartType,
                  aggregation: finalWidget.aggregation,
                  groupBy: finalWidget.groupBy,
                  filters: finalWidget.filters,
                  colors: finalWidget.colors,
                  thresholds: finalWidget.thresholds,
                  limit: finalWidget.limit,
                  size: finalWidget.size
                }
              })
            );
            break;

          case 'canvas':
            // Deploy to Max AI canvas widgets
            deploymentPromises.push(
              apiRequest('POST', '/api/max/canvas/widgets', {
                title: finalWidget.title,
                subtitle: finalWidget.subtitle,
                type: finalWidget.type,
                size: finalWidget.size,
                position: finalWidget.position,
                config: {
                  dataSource: finalWidget.dataSource,
                  chartType: finalWidget.chartType,
                  aggregation: finalWidget.aggregation,
                  groupBy: finalWidget.groupBy,
                  filters: finalWidget.filters,
                  colors: finalWidget.colors,
                  thresholds: finalWidget.thresholds,
                  limit: finalWidget.limit,
                  action: finalWidget.action,
                  content: finalWidget.content
                }
              })
            );
            break;

          case 'dashboard':
            // Deploy to custom dashboard system
            deploymentPromises.push(
              apiRequest('POST', '/api/dashboard-configs', finalWidget)
            );
            break;
        }
      }

      // Execute all deployments
      const responses = await Promise.all(deploymentPromises);
      const successfulDeployments = responses.filter(r => r.ok);
      const failedDeployments = responses.filter(r => !r.ok);

      if (failedDeployments.length > 0) {
        console.warn(`Failed to deploy to ${failedDeployments.length} system(s)`);
      }

      // Call the callback if provided
      if (onWidgetCreate) {
        onWidgetCreate(finalWidget, targetSystems);
      }
      
      if (successfulDeployments.length > 0) {
        toast({
          title: "Widget Deployed Successfully",
          description: `Widget "${finalWidget.title}" deployed to ${successfulDeployments.length}/${targetSystems.length} system(s).`
        });
        
        // Invalidate relevant caches for successful deployments
        for (let i = 0; i < responses.length; i++) {
          if (responses[i].ok) {
            const system = targetSystems[i];
            if (system === 'cockpit') {
              queryClient.invalidateQueries({ queryKey: ['/api/cockpit/widgets'] });
            } else if (system === 'analytics') {
              queryClient.invalidateQueries({ queryKey: ['/api/analytics/widgets'] });
            } else if (system === 'canvas') {
              queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
            } else if (system === 'dashboard') {
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard-configs'] });
            }
          }
        }
        
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error('All deployments failed');
      }
    } catch (error) {
      console.error('Widget deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy widget. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setWidgetConfig({});
    setTargetSystems(['analytics']);
    setActiveTab('template');
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? WIDGET_TEMPLATES 
    : WIDGET_TEMPLATES.filter(t => t.category === selectedCategory);

  const previewWidget = widgetConfig.type && widgetConfig.title ? (
    <UniversalWidget
      config={widgetConfig as WidgetConfig}
      data={previewData}
      readOnly={true}
      showControls={false}
      className="h-full"
    />
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] flex flex-col p-2 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            {mode === 'edit' ? 'Edit Widget' : 'Widget Design Studio'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 min-h-0">
          {/* Configuration Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 h-full">
              <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm flex-shrink-0">
                <TabsTrigger value="template" className="px-2 py-1 sm:px-3 sm:py-2">
                  <span className="hidden sm:inline">1. Template</span>
                  <span className="sm:hidden">Template</span>
                </TabsTrigger>
                <TabsTrigger value="configure" className="px-2 py-1 sm:px-3 sm:py-2">
                  <span className="hidden sm:inline">2. Configure</span>
                  <span className="sm:hidden">Configure</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="px-2 py-1 sm:px-3 sm:py-2">
                  <span className="hidden sm:inline">3. Style & Deploy</span>
                  <span className="sm:hidden">Deploy</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="template" className="flex-1 flex flex-col space-y-3 sm:space-y-4 min-h-0 h-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                  <Label className="text-sm font-medium">Category:</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: "calc(100vh - 300px)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 pb-4">
                    {filteredTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <template.icon className="h-5 w-5 text-blue-600" />
                            <Badge variant={template.complexity === 'basic' ? 'default' : 
                                           template.complexity === 'intermediate' ? 'secondary' : 'destructive'}
                                   className="text-xs">
                              {template.complexity}
                            </Badge>
                          </div>
                          <CardTitle className="text-sm font-medium line-clamp-2 leading-tight">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.targetSystems.slice(0, 3).map(system => (
                              <Badge key={system} variant="outline" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                            {template.targetSystems.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.targetSystems.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="configure" className="flex-1 flex flex-col min-h-0 h-full">
                <div className="flex-1 overflow-y-auto overscroll-contain pr-2">
                  <div className="space-y-3 sm:space-y-4 pb-4">
                    {/* Basic Configuration */}
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Basic Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="title" className="text-sm">Widget Title</Label>
                            <Input
                              id="title"
                              value={widgetConfig.title || ''}
                              onChange={(e) => updateWidgetConfig('title', e.target.value)}
                              placeholder="Enter widget title"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="subtitle" className="text-sm">Subtitle (Optional)</Label>
                            <Input
                              id="subtitle"
                              value={widgetConfig.subtitle || ''}
                              onChange={(e) => updateWidgetConfig('subtitle', e.target.value)}
                              placeholder="Enter subtitle"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="dataSource">Data Source</Label>
                            <Select 
                              value={widgetConfig.dataSource || 'jobs'} 
                              onValueChange={(value) => updateWidgetConfig('dataSource', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select data source" />
                              </SelectTrigger>
                              <SelectContent>
                                {DATA_SOURCES.map(source => (
                                  <SelectItem key={source.value} value={source.value}>
                                    {source.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {widgetConfig.type === 'chart' && (
                            <div>
                              <Label htmlFor="chartType">Chart Type</Label>
                              <Select 
                                value={widgetConfig.chartType || 'bar'} 
                                onValueChange={(value) => updateWidgetConfig('chartType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select chart type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CHART_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Data Processing */}
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Data Processing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="aggregation" className="text-sm">Aggregation</Label>
                            <Select 
                              value={widgetConfig.aggregation || 'count'} 
                              onValueChange={(value) => updateWidgetConfig('aggregation', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select aggregation" />
                              </SelectTrigger>
                              <SelectContent>
                                {AGGREGATION_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="groupBy" className="text-sm">Group By (Optional)</Label>
                            <Input
                              id="groupBy"
                              value={widgetConfig.groupBy || ''}
                              onChange={(e) => updateWidgetConfig('groupBy', e.target.value)}
                              placeholder="e.g., status, priority"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="limit" className="text-sm">Limit Records</Label>
                          <Input
                            id="limit"
                            type="number"
                            value={widgetConfig.limit || ''}
                            onChange={(e) => updateWidgetConfig('limit', parseInt(e.target.value) || undefined)}
                            placeholder="Maximum records to show"
                            className="text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto">
                <div className="space-y-3 sm:space-y-4 pb-4">
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Deployment Targets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                          {TARGET_SYSTEMS.map(system => (
                            <div key={system.value} className="flex items-center space-x-2 sm:space-x-3">
                              <Switch
                                id={system.value}
                                checked={targetSystems.includes(system.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setTargetSystems(prev => [...prev, system.value]);
                                  } else {
                                    setTargetSystems(prev => prev.filter(s => s !== system.value));
                                  }
                                }}
                              />
                              <Label htmlFor={system.value} className="text-sm sm:text-base">{system.label}</Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button onClick={handleSaveWidget} className="flex-1">
                        <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="text-sm">{mode === 'edit' ? 'Update Widget' : 'Create Widget'}</span>
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="sm:w-auto">
                        <span className="text-sm">Reset</span>
                      </Button>
                    </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Preview Panel */}
          <div className="w-full lg:w-80 xl:w-96 lg:border-l lg:pl-4 xl:pl-6 order-first lg:order-last">
            <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base">Live Preview</h3>
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 border rounded-lg p-2 sm:p-3 lg:p-4 bg-gray-50 min-h-[150px] sm:min-h-[200px] lg:min-h-[300px]">
                {previewWidget ? (
                  <div className="h-full">
                    {previewWidget}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Layout className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">Select a template to see preview</p>
                    </div>
                  </div>
                )}
              </div>
              
              {widgetConfig.title && (
                <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-2 rounded lg:bg-transparent lg:p-0">
                  <p className="line-clamp-1"><strong>Type:</strong> {widgetConfig.type}</p>
                  <p className="line-clamp-1"><strong>Data Source:</strong> {widgetConfig.dataSource}</p>
                  {widgetConfig.chartType && (
                    <p className="line-clamp-1"><strong>Chart Type:</strong> {widgetConfig.chartType}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}