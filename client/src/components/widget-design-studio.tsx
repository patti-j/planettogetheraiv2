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

interface WidgetDesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetCreate?: (widget: WidgetConfig, targetSystems: string[]) => void;
  editingWidget?: Partial<WidgetConfig>;
  mode?: 'create' | 'edit';
}

const DATA_SOURCES = [
  { value: 'productionOrders', label: 'Production Orders' },
  { value: 'operations', label: 'Operations' },
  { value: 'resources', label: 'Resources' },
  { value: 'capabilities', label: 'Capabilities' },
  { value: 'recipes', label: 'Recipes' },
  { value: 'productionVersions', label: 'Production Versions' },
  { value: 'plannedOrders', label: 'Planned Orders' },
  { value: 'users', label: 'Users' },
  { value: 'metrics', label: 'Metrics' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'optimization', label: 'Optimization Engine' }
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
    const mockProductionOrders = [
      { id: 1, orderNumber: 'PO-001', itemCode: 'PARA-500', status: 'in_progress', progress: 65 },
      { id: 2, orderNumber: 'PO-002', itemCode: 'IBU-200', status: 'scheduled', progress: 0 }
    ];

    const newPreviewData: SystemData = {
      productionOrders: Array.isArray(productionOrders) && productionOrders.length > 0 ? productionOrders : mockProductionOrders,
      operations: Array.isArray(operations) && operations.length > 0 ? operations : [
        { id: 1, operationName: 'Tablet Manufacturing', resourceName: 'Tablet Press 1', status: 'running' },
        { id: 2, operationName: 'Quality Control', resourceName: 'QC Lab', status: 'idle' }
      ],
      resources: Array.isArray(resources) && resources.length > 0 ? resources : [
        { id: 1, name: 'Tablet Press 1', type: 'Equipment', status: 'running', utilizationRate: 85 },
        { id: 2, name: 'Filling Line A', type: 'Equipment', status: 'idle', utilizationRate: 0 }
      ],
      metrics: metrics || { activeJobs: 5, utilization: 75, overdueOperations: 2 }
    };
    setPreviewData(newPreviewData);
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
      // Optimization-specific properties
      algorithm: widgetConfig.algorithm,
      objective: widgetConfig.objective,
      timeHorizon: widgetConfig.timeHorizon,
      maxIterations: widgetConfig.maxIterations,
      content: widgetConfig.content || selectedTemplate.defaultConfig.content
    };

    try {
      const deploymentPromises = [];

      // Deploy to each selected target system
      for (const targetSystem of targetSystems) {
        switch (targetSystem) {
          case 'cockpit':
            deploymentPromises.push(
              apiRequest('POST', '/api/cockpit/widgets', {
                title: finalWidget.title,
                sub_title: finalWidget.subtitle,
                type: finalWidget.type,
                layout_id: 1,
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
            deploymentPromises.push(
              apiRequest('POST', '/api/dashboard-configs', finalWidget)
            );
            break;
        }
      }

      const responses = await Promise.all(deploymentPromises);
      const successfulDeployments = responses.filter(r => r.ok);

      if (onWidgetCreate) {
        onWidgetCreate(finalWidget, targetSystems);
      }
      
      if (successfulDeployments.length > 0) {
        toast({
          title: "Widget Deployed Successfully",
          description: `Widget "${finalWidget.title}" deployed to ${successfulDeployments.length}/${targetSystems.length} system(s).`
        });
        
        // Invalidate relevant caches
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
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Configuration Panel */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
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
            
            <TabsContent value="template" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-2">
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
            </TabsContent>
            
            <TabsContent value="configure" className="space-y-4 mt-0">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Basic Configuration */}
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base">Basic Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-3">
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
                          <Label htmlFor="dataSource" className="text-sm">Data Source</Label>
                          <Select 
                            value={widgetConfig.dataSource || (selectedTemplate?.type === 'schedule-optimization' ? 'optimization' : 'productionOrders')} 
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
                  
                  {/* Context-sensitive Configuration */}
                  {selectedTemplate?.type === 'schedule-optimization' ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Optimization Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="algorithm" className="text-sm">Algorithm</Label>
                            <Select 
                              value={widgetConfig.algorithm || 'backwards-scheduling'} 
                              onValueChange={(value) => updateWidgetConfig('algorithm', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select algorithm" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="backwards-scheduling">Backwards Scheduling</SelectItem>
                                <SelectItem value="finite-capacity">Finite Capacity</SelectItem>
                                <SelectItem value="genetic-algorithm">Genetic Algorithm</SelectItem>
                                <SelectItem value="simulated-annealing">Simulated Annealing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="objective" className="text-sm">Primary Objective</Label>
                            <Select 
                              value={widgetConfig.objective || 'minimize-makespan'} 
                              onValueChange={(value) => updateWidgetConfig('objective', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select objective" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minimize-makespan">Minimize Makespan</SelectItem>
                                <SelectItem value="maximize-throughput">Maximize Throughput</SelectItem>
                                <SelectItem value="minimize-lateness">Minimize Lateness</SelectItem>
                                <SelectItem value="balance-workload">Balance Workload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="timeHorizon" className="text-sm">Time Horizon (days)</Label>
                            <Input
                              id="timeHorizon"
                              type="number"
                              value={widgetConfig.timeHorizon || '7'}
                              onChange={(e) => updateWidgetConfig('timeHorizon', parseInt(e.target.value) || 7)}
                              placeholder="7"
                              className="text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="maxIterations" className="text-sm">Max Iterations</Label>
                            <Input
                              id="maxIterations"
                              type="number"
                              value={widgetConfig.maxIterations || '1000'}
                              onChange={(e) => updateWidgetConfig('maxIterations', parseInt(e.target.value) || 1000)}
                              placeholder="1000"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader className="pb-1">
                        <CardTitle className="text-base">Data Processing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-3">
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
                  )}
                </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4 mt-0">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base">Deploy to Systems</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base">Live Preview</h3>
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            
            <div className="border rounded-lg p-3 bg-gray-50 h-[300px] overflow-hidden">
              {previewWidget ? (
                <div className="h-full">
                  {previewWidget}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layout className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
    </div>
  );
}