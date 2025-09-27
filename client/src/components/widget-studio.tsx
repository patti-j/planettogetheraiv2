import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Gauge,
  Grid,
  Table2,
  Clock,
  Plus,
  Save,
  Eye,
  Settings,
  Palette,
  Database,
  Filter,
  ChevronRight,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  Zap,
  AreaChart,
  ScatterChart,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WidgetStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingWidget?: any;
  widgetType?: 'chart' | 'gauge' | 'table' | 'activity';
}

interface WidgetTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'chart' | 'gauge' | 'table' | 'activity';
  description: string;
  defaultConfig: any;
  color: string;
}

// Widget templates for different types
const widgetTemplates: WidgetTemplate[] = [
  // Chart Templates
  {
    id: 'line-chart',
    name: 'Line Chart',
    icon: <LineChart className="h-5 w-5" />,
    type: 'chart',
    description: 'Track trends and changes over time',
    color: 'text-green-600',
    defaultConfig: {
      chartType: 'line',
      xAxis: 'time',
      yAxis: 'value',
      showGrid: true,
      showLegend: true,
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    }
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    icon: <BarChart3 className="h-5 w-5" />,
    type: 'chart',
    description: 'Compare values across categories',
    color: 'text-blue-600',
    defaultConfig: {
      chartType: 'bar',
      orientation: 'vertical',
      stacked: false,
      showValues: true,
      colors: ['#3b82f6', '#10b981', '#f59e0b']
    }
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    icon: <PieChart className="h-5 w-5" />,
    type: 'chart',
    description: 'Show proportions and percentages',
    color: 'text-purple-600',
    defaultConfig: {
      chartType: 'pie',
      showLabels: true,
      showPercentages: true,
      donut: false,
      colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    icon: <AreaChart className="h-5 w-5" />,
    type: 'chart',
    description: 'Visualize cumulative values over time',
    color: 'text-cyan-600',
    defaultConfig: {
      chartType: 'area',
      stacked: false,
      showGrid: true,
      gradient: true,
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6']
    }
  },
  {
    id: 'scatter-chart',
    name: 'Scatter Plot',
    icon: <ScatterChart className="h-5 w-5" />,
    type: 'chart',
    description: 'Show correlations between variables',
    color: 'text-indigo-600',
    defaultConfig: {
      chartType: 'scatter',
      showTrendLine: true,
      showGrid: true,
      pointSize: 5,
      colors: ['#6366f1', '#3b82f6', '#10b981']
    }
  },
  // Gauge Templates
  {
    id: 'radial-gauge',
    name: 'Radial Gauge',
    icon: <Gauge className="h-5 w-5" />,
    type: 'gauge',
    description: 'Display single metric with target',
    color: 'text-purple-600',
    defaultConfig: {
      gaugeType: 'radial',
      min: 0,
      max: 100,
      target: 75,
      showNeedle: true,
      showLabels: true,
      colors: {
        low: '#ef4444',
        medium: '#f59e0b',
        high: '#10b981'
      }
    }
  },
  {
    id: 'linear-gauge',
    name: 'Linear Gauge',
    icon: <Activity className="h-5 w-5" />,
    type: 'gauge',
    description: 'Horizontal or vertical progress indicator',
    color: 'text-teal-600',
    defaultConfig: {
      gaugeType: 'linear',
      orientation: 'horizontal',
      min: 0,
      max: 100,
      target: 75,
      showMarkers: true,
      colors: {
        low: '#ef4444',
        medium: '#f59e0b',
        high: '#10b981'
      }
    }
  },
  {
    id: 'speedometer',
    name: 'Speedometer',
    icon: <Timer className="h-5 w-5" />,
    type: 'gauge',
    description: 'Classic speedometer visualization',
    color: 'text-orange-600',
    defaultConfig: {
      gaugeType: 'speedometer',
      min: 0,
      max: 200,
      target: 150,
      showZones: true,
      animateNeedle: true,
      colors: ['#10b981', '#f59e0b', '#ef4444']
    }
  },
  // Table Templates
  {
    id: 'data-table',
    name: 'Data Table',
    icon: <Table2 className="h-5 w-5" />,
    type: 'table',
    description: 'Display tabular data with sorting',
    color: 'text-orange-600',
    defaultConfig: {
      tableType: 'data',
      showHeader: true,
      sortable: true,
      filterable: true,
      paginated: true,
      pageSize: 10,
      striped: true,
      compact: false
    }
  },
  {
    id: 'pivot-table',
    name: 'Pivot Table',
    icon: <Grid className="h-5 w-5" />,
    type: 'table',
    description: 'Aggregate and summarize data',
    color: 'text-amber-600',
    defaultConfig: {
      tableType: 'pivot',
      rowGrouping: [],
      columnGrouping: [],
      aggregations: ['sum', 'average', 'count'],
      showTotals: true,
      expandable: true
    }
  },
  // Activity Templates
  {
    id: 'activity-feed',
    name: 'Activity Feed',
    icon: <Activity className="h-5 w-5" />,
    type: 'activity',
    description: 'Real-time activity updates',
    color: 'text-teal-600',
    defaultConfig: {
      activityType: 'feed',
      maxItems: 20,
      autoRefresh: true,
      refreshInterval: 30,
      showTimestamps: true,
      groupByDate: false,
      showIcons: true
    }
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: <Clock className="h-5 w-5" />,
    type: 'activity',
    description: 'Chronological event display',
    color: 'text-indigo-600',
    defaultConfig: {
      activityType: 'timeline',
      orientation: 'vertical',
      showConnectors: true,
      expandable: true,
      showDates: true,
      groupByPeriod: 'day'
    }
  },
  {
    id: 'alerts',
    name: 'Alert Monitor',
    icon: <AlertCircle className="h-5 w-5" />,
    type: 'activity',
    description: 'Track system alerts and notifications',
    color: 'text-red-600',
    defaultConfig: {
      activityType: 'alerts',
      severityFilter: ['critical', 'warning', 'info'],
      autoAcknowledge: false,
      playSound: true,
      maxAlerts: 50,
      showResolved: false
    }
  }
];

// Data sources for all widget types
const dataSources = [
  { id: 'ptjobs', name: 'Production Jobs', table: 'ptjobs' },
  { id: 'ptresources', name: 'Resources', table: 'ptresources' },
  { id: 'ptoperations', name: 'Operations', table: 'ptoperations' },
  { id: 'inventory', name: 'Inventory', table: 'inventory' },
  { id: 'quality', name: 'Quality Metrics', table: 'quality_metrics' },
  { id: 'maintenance', name: 'Maintenance', table: 'maintenance' },
  { id: 'alerts', name: 'System Alerts', table: 'alerts' },
  { id: 'custom', name: 'Custom Query', table: 'custom' }
];

export function WidgetStudio({ open, onOpenChange, existingWidget, widgetType }: WidgetStudioProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableFields, setAvailableFields] = useState<Array<{name: string, type: string, label: string}>>([]);
  
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    description: '',
    type: widgetType || 'chart',
    template: '',
    dataSource: '',
    refreshInterval: 30,
    targetPlatform: 'both',
    configuration: {} as any,
    // Chart specific
    chartConfig: {
      chartType: 'line',
      xAxis: '',
      yAxis: '',
      groupBy: '',
      aggregation: 'sum',
      showGrid: true,
      showLegend: true,
      showValues: false,
      colors: [] as string[]
    },
    // Gauge specific
    gaugeConfig: {
      gaugeType: 'radial',
      valueField: '',
      min: 0,
      max: 100,
      target: 75,
      warning: 60,
      critical: 40,
      unit: '%',
      showTarget: true
    },
    // Table specific
    tableConfig: {
      columns: [] as string[],
      sortBy: '',
      sortOrder: 'asc',
      pageSize: 10,
      showSearch: true,
      showExport: true,
      groupBy: '',
      aggregations: [] as string[]
    },
    // Activity specific
    activityConfig: {
      activityType: 'feed',
      eventField: '',
      timestampField: '',
      maxItems: 20,
      groupBy: '',
      filterBy: [] as string[],
      showNotifications: true
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch table fields when data source changes
  const { data: tableFields } = useQuery({
    queryKey: ['/api/database/table-fields', widgetConfig.dataSource],
    enabled: !!widgetConfig.dataSource && widgetConfig.dataSource !== 'custom',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update available fields when table fields change
  useEffect(() => {
    if (tableFields) {
      setAvailableFields(tableFields);
    } else {
      setAvailableFields([]);
    }
  }, [tableFields]);

  // Initialize with existing widget data if editing
  useEffect(() => {
    if (existingWidget) {
      const config = existingWidget.configuration || existingWidget.data?.configuration || {};
      setWidgetConfig({
        ...widgetConfig,
        ...config,
        title: existingWidget.title || '',
        description: existingWidget.description || '',
        type: existingWidget.widgetType || widgetType || 'chart'
      });
      
      // Find matching template
      const templateId = existingWidget.data?.template || config.templateId;
      if (templateId) {
        const template = widgetTemplates.find(t => t.id === templateId);
        if (template) {
          setSelectedTemplate(template);
          setStep(2);
        }
      }
    }
  }, [existingWidget]);

  // Filter templates by widget type
  const filteredTemplates = widgetType 
    ? widgetTemplates.filter(t => t.type === widgetType)
    : widgetTemplates.filter(t => t.type === widgetConfig.type);

  const createWidgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!existingWidget;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/canvas/widgets/${existingWidget.id}` : '/api/canvas/widgets';
      
      const payload = {
        title: data.title,
        widgetType: data.type,
        widgetSubtype: selectedTemplate?.name || data.type,
        targetPlatform: data.targetPlatform,
        data: {
          template: selectedTemplate?.id,
          configuration: data
        },
        configuration: data,
        isVisible: true
      };

      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      const isEditing = !!existingWidget;
      toast({
        title: "Success",
        description: isEditing ? "Widget updated successfully!" : "Widget created successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/design-studio/widgets'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save widget",
        variant: "destructive"
      });
    }
  });

  const handleTemplateSelect = (template: WidgetTemplate) => {
    setSelectedTemplate(template);
    setWidgetConfig({
      ...widgetConfig,
      type: template.type,
      template: template.id,
      configuration: template.defaultConfig
    });
    setStep(2);
  };

  const handleSave = () => {
    if (!widgetConfig.title) {
      toast({
        title: "Error",
        description: "Please provide a widget title",
        variant: "destructive"
      });
      return;
    }

    const finalConfig = {
      ...widgetConfig,
      ...widgetConfig.configuration,
      chartConfig: widgetConfig.type === 'chart' ? widgetConfig.chartConfig : undefined,
      gaugeConfig: widgetConfig.type === 'gauge' ? widgetConfig.gaugeConfig : undefined,
      tableConfig: widgetConfig.type === 'table' ? widgetConfig.tableConfig : undefined,
      activityConfig: widgetConfig.type === 'activity' ? widgetConfig.activityConfig : undefined
    };

    createWidgetMutation.mutate(finalConfig);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTemplate(null);
    setWidgetConfig({
      title: '',
      description: '',
      type: widgetType || 'chart',
      template: '',
      dataSource: '',
      refreshInterval: 30,
      targetPlatform: 'both',
      configuration: {},
      chartConfig: {
        chartType: 'line',
        xAxis: '',
        yAxis: '',
        groupBy: '',
        aggregation: 'sum',
        showGrid: true,
        showLegend: true,
        showValues: false,
        colors: []
      },
      gaugeConfig: {
        gaugeType: 'radial',
        valueField: '',
        min: 0,
        max: 100,
        target: 75,
        warning: 60,
        critical: 40,
        unit: '%',
        showTarget: true
      },
      tableConfig: {
        columns: [],
        sortBy: '',
        sortOrder: 'asc',
        pageSize: 10,
        showSearch: true,
        showExport: true,
        groupBy: '',
        aggregations: []
      },
      activityConfig: {
        activityType: 'feed',
        eventField: '',
        timestampField: '',
        maxItems: 20,
        groupBy: '',
        filterBy: [],
        showNotifications: true
      }
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Widget Studio
          </DialogTitle>
          <DialogDescription>
            Create custom widgets for your dashboards
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-2">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Choose Template</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Configure Widget</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Preview & Save</span>
            </div>
          </div>

          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Widget Type Selector */}
              {!widgetType && (
                <div className="mb-4">
                  <Label>Widget Type</Label>
                  <Select
                    value={widgetConfig.type}
                    onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Charts
                        </div>
                      </SelectItem>
                      <SelectItem value="gauge">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4" />
                          Gauges
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4" />
                          Tables
                        </div>
                      </SelectItem>
                      <SelectItem value="activity">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Activity
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className={template.color}>{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Custom Widget
                  </CardTitle>
                  <CardDescription>
                    Create a custom widget from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setStep(2)}
                  >
                    Start from Scratch
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="data">Data Source</TabsTrigger>
                  <TabsTrigger value="display">Display Options</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Widget Title *</Label>
                      <Input
                        id="title"
                        value={widgetConfig.title}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
                        placeholder="e.g., Production Metrics"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="platform">Target Platform</Label>
                      <Select
                        value={widgetConfig.targetPlatform}
                        onValueChange={(value) => setWidgetConfig({ ...widgetConfig, targetPlatform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Both</SelectItem>
                          <SelectItem value="desktop">Desktop Only</SelectItem>
                          <SelectItem value="mobile">Mobile Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={widgetConfig.description}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, description: e.target.value })}
                      placeholder="Describe what this widget displays..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data Source</Label>
                    <Select
                      value={widgetConfig.dataSource}
                      onValueChange={(value) => setWidgetConfig({ ...widgetConfig, dataSource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type-specific configuration */}
                  {widgetConfig.type === 'chart' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>X-Axis Field</Label>
                          <Select
                            value={widgetConfig.chartConfig.xAxis}
                            onValueChange={(value) => setWidgetConfig({
                              ...widgetConfig,
                              chartConfig: { ...widgetConfig.chartConfig, xAxis: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select X-axis field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.label}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                              {availableFields.length === 0 && (
                                <SelectItem value="" disabled>
                                  Select a data source first
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Y-Axis Field</Label>
                          <Select
                            value={widgetConfig.chartConfig.yAxis}
                            onValueChange={(value) => setWidgetConfig({
                              ...widgetConfig,
                              chartConfig: { ...widgetConfig.chartConfig, yAxis: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Y-axis field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.label}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                              {availableFields.length === 0 && (
                                <SelectItem value="" disabled>
                                  Select a data source first
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Aggregation</Label>
                        <Select
                          value={widgetConfig.chartConfig.aggregation}
                          onValueChange={(value) => setWidgetConfig({
                            ...widgetConfig,
                            chartConfig: { ...widgetConfig.chartConfig, aggregation: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {widgetConfig.type === 'gauge' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Value Field</Label>
                        <Select
                          value={widgetConfig.gaugeConfig.valueField}
                          onValueChange={(value) => setWidgetConfig({
                            ...widgetConfig,
                            gaugeConfig: { ...widgetConfig.gaugeConfig, valueField: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select value field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.filter(field => 
                              field.type === 'numeric' || field.type === 'integer' || field.type === 'real'
                            ).map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                <div className="flex items-center gap-2">
                                  <span>{field.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                            {availableFields.length === 0 && (
                              <SelectItem value="" disabled>
                                Select a data source first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Min Value</Label>
                          <Input
                            type="number"
                            value={widgetConfig.gaugeConfig.min}
                            onChange={(e) => setWidgetConfig({
                              ...widgetConfig,
                              gaugeConfig: { ...widgetConfig.gaugeConfig, min: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Target</Label>
                          <Input
                            type="number"
                            value={widgetConfig.gaugeConfig.target}
                            onChange={(e) => setWidgetConfig({
                              ...widgetConfig,
                              gaugeConfig: { ...widgetConfig.gaugeConfig, target: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Value</Label>
                          <Input
                            type="number"
                            value={widgetConfig.gaugeConfig.max}
                            onChange={(e) => setWidgetConfig({
                              ...widgetConfig,
                              gaugeConfig: { ...widgetConfig.gaugeConfig, max: Number(e.target.value) }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {widgetConfig.type === 'table' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Page Size</Label>
                        <Select
                          value={String(widgetConfig.tableConfig.pageSize)}
                          onValueChange={(value) => setWidgetConfig({
                            ...widgetConfig,
                            tableConfig: { ...widgetConfig.tableConfig, pageSize: Number(value) }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="25">25 rows</SelectItem>
                            <SelectItem value="50">50 rows</SelectItem>
                            <SelectItem value="100">100 rows</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Enable Search</Label>
                        <Switch
                          checked={widgetConfig.tableConfig.showSearch}
                          onCheckedChange={(checked) => setWidgetConfig({
                            ...widgetConfig,
                            tableConfig: { ...widgetConfig.tableConfig, showSearch: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Enable Export</Label>
                        <Switch
                          checked={widgetConfig.tableConfig.showExport}
                          onCheckedChange={(checked) => setWidgetConfig({
                            ...widgetConfig,
                            tableConfig: { ...widgetConfig.tableConfig, showExport: checked }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {widgetConfig.type === 'activity' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Max Items</Label>
                        <Input
                          type="number"
                          value={widgetConfig.activityConfig.maxItems}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            activityConfig: { ...widgetConfig.activityConfig, maxItems: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Event Field</Label>
                        <Select
                          value={widgetConfig.activityConfig.eventField}
                          onValueChange={(value) => setWidgetConfig({
                            ...widgetConfig,
                            activityConfig: { ...widgetConfig.activityConfig, eventField: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                <div className="flex items-center gap-2">
                                  <span>{field.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                            {availableFields.length === 0 && (
                              <SelectItem value="" disabled>
                                Select a data source first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Notifications</Label>
                        <Switch
                          checked={widgetConfig.activityConfig.showNotifications}
                          onCheckedChange={(checked) => setWidgetConfig({
                            ...widgetConfig,
                            activityConfig: { ...widgetConfig.activityConfig, showNotifications: checked }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="display" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Refresh Interval (seconds)</Label>
                    <Select
                      value={String(widgetConfig.refreshInterval)}
                      onValueChange={(value) => setWidgetConfig({ ...widgetConfig, refreshInterval: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No auto-refresh</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Preview
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Save */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Preview</CardTitle>
                  <CardDescription>
                    Review your widget configuration before saving
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">{widgetConfig.title || widgetConfig.name || 'Untitled Widget'}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {widgetConfig.description || 'No description provided'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{selectedTemplate?.name || 'Custom'}</Badge>
                        <Badge variant="outline">{widgetConfig.type}</Badge>
                        <Badge variant="outline">{widgetConfig.targetPlatform}</Badge>
                        {widgetConfig.dataSource && (
                          <Badge variant="outline">
                            {dataSources.find(d => d.id === widgetConfig.dataSource)?.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={createWidgetMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createWidgetMutation.isPending ? 'Saving...' 
                      : (existingWidget ? 'Update Widget' : 'Create Widget')
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Preview Dialog */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Widget Preview</DialogTitle>
          <DialogDescription>
            This is how your widget will appear on the dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <WidgetPreview config={widgetConfig} template={selectedTemplate} />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Widget Preview Component
function WidgetPreview({ config, template }: { config: any; template: WidgetTemplate | null }) {
  const renderPreview = () => {
    switch (config.type) {
      case 'chart':
        return (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {template?.icon || <BarChart3 className="h-5 w-5" />}
              <span className="font-semibold">{config.title || 'Chart Widget'}</span>
            </div>
            <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded flex items-center justify-center">
              <span className="text-muted-foreground">Chart Preview</span>
            </div>
          </div>
        );
      
      case 'gauge':
        return (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {template?.icon || <Gauge className="h-5 w-5" />}
              <span className="font-semibold">{config.title || 'Gauge Widget'}</span>
            </div>
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * 0.75} ${2 * Math.PI * 56}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">75%</div>
                    <div className="text-xs text-muted-foreground">Target</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {template?.icon || <Table2 className="h-5 w-5" />}
              <span className="font-semibold">{config.title || 'Table Widget'}</span>
            </div>
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-sm">Column 1</th>
                    <th className="p-2 text-left text-sm">Column 2</th>
                    <th className="p-2 text-left text-sm">Column 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2 text-sm">Data 1</td>
                    <td className="p-2 text-sm">Data 2</td>
                    <td className="p-2 text-sm">Data 3</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 text-sm">Data 4</td>
                    <td className="p-2 text-sm">Data 5</td>
                    <td className="p-2 text-sm">Data 6</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'activity':
        return (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {template?.icon || <Activity className="h-5 w-5" />}
              <span className="font-semibold">{config.title || 'Activity Widget'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">New order received</span>
                <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Production started</span>
                <span className="text-xs text-muted-foreground ml-auto">5m ago</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Maintenance scheduled</span>
                <span className="text-xs text-muted-foreground ml-auto">10m ago</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 border rounded-lg">
            <span className="text-muted-foreground">Widget Preview</span>
          </div>
        );
    }
  };

  return renderPreview();
}