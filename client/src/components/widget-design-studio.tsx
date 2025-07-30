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

  // Initialize preview data
  useEffect(() => {
    setPreviewData({
      productionOrders: Array.isArray(productionOrders) ? productionOrders : [],
      operations: Array.isArray(operations) ? operations : [],
      resources: Array.isArray(resources) ? resources : [],
      metrics: metrics || {}
    });
  }, [productionOrders, operations, resources, metrics]);

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
              fetch('/api/cockpit/widgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
              })
            );
            break;

          case 'analytics':
            // Deploy to analytics dashboard configuration
            deploymentPromises.push(
              fetch('/api/analytics/widgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
              })
            );
            break;

          case 'canvas':
            // Deploy to Max AI canvas widgets
            deploymentPromises.push(
              fetch('/api/max/canvas/widgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
              })
            );
            break;

          case 'dashboard':
            // Deploy to custom dashboard system
            deploymentPromises.push(
              fetch('/api/dashboard/widgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalWidget)
              })
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
              queryClient.invalidateQueries({ queryKey: ['/api/max/canvas/widgets'] });
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Widget' : 'Widget Design Studio'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Configuration Panel */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="template">1. Template</TabsTrigger>
                <TabsTrigger value="configure">2. Configure</TabsTrigger>
                <TabsTrigger value="style">3. Style & Deploy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template" className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Category:</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
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
                
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-2 gap-4">
                    {filteredTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <template.icon className="h-8 w-8 text-blue-600" />
                            <Badge variant={template.complexity === 'basic' ? 'default' : 
                                           template.complexity === 'intermediate' ? 'secondary' : 'destructive'}>
                              {template.complexity}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.targetSystems.map(system => (
                              <Badge key={system} variant="outline" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="configure" className="flex-1 space-y-4">
                <ScrollArea className="h-[500px] space-y-4">
                  <div className="space-y-4 pr-4">
                    {/* Basic Configuration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title">Widget Title</Label>
                            <Input
                              id="title"
                              value={widgetConfig.title || ''}
                              onChange={(e) => updateWidgetConfig('title', e.target.value)}
                              placeholder="Enter widget title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                            <Input
                              id="subtitle"
                              value={widgetConfig.subtitle || ''}
                              onChange={(e) => updateWidgetConfig('subtitle', e.target.value)}
                              placeholder="Enter subtitle"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
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
                      <CardHeader>
                        <CardTitle className="text-lg">Data Processing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="aggregation">Aggregation</Label>
                            <Select 
                              value={widgetConfig.aggregation || 'count'} 
                              onValueChange={(value) => updateWidgetConfig('aggregation', value)}
                            >
                              <SelectTrigger>
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
                            <Label htmlFor="groupBy">Group By (Optional)</Label>
                            <Input
                              id="groupBy"
                              value={widgetConfig.groupBy || ''}
                              onChange={(e) => updateWidgetConfig('groupBy', e.target.value)}
                              placeholder="e.g., status, priority"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="limit">Limit Records</Label>
                          <Input
                            id="limit"
                            type="number"
                            value={widgetConfig.limit || ''}
                            onChange={(e) => updateWidgetConfig('limit', parseInt(e.target.value) || undefined)}
                            placeholder="Maximum records to show"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="style" className="flex-1 space-y-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Deployment Targets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {TARGET_SYSTEMS.map(system => (
                          <div key={system.value} className="flex items-center space-x-2">
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
                            <Label htmlFor={system.value}>{system.label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveWidget} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {mode === 'edit' ? 'Update Widget' : 'Create Widget'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Preview Panel */}
          <div className="w-96 border-l pl-6">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Live Preview</h3>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 border rounded-lg p-4 bg-gray-50">
                {previewWidget ? (
                  <div className="h-full">
                    {previewWidget}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a template to see preview</p>
                    </div>
                  </div>
                )}
              </div>
              
              {widgetConfig.title && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {widgetConfig.type}</p>
                  <p><strong>Data Source:</strong> {widgetConfig.dataSource}</p>
                  {widgetConfig.chartType && (
                    <p><strong>Chart Type:</strong> {widgetConfig.chartType}</p>
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