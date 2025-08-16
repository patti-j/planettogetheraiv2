import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Gauge,
  DollarSign,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Plus,
  Save,
  Eye,
  Settings,
  Palette,
  Database,
  Calculator,
  X,
  Filter,
  Function,
  Code,
  Trash,
  ArrowRight,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SmartKPIWidgetStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingWidget?: any;
}

interface KPITemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  metrics: string[];
  defaultConfig: any;
  color: string;
}

// Available data sources for formula building
const dataSources = [
  {
    id: 'ptjobs',
    name: 'Production Jobs',
    table: 'ptjobs',
    fields: [
      { name: 'job_id', type: 'string', label: 'Job ID' },
      { name: 'external_id', type: 'string', label: 'External ID' },
      { name: 'name', type: 'string', label: 'Job Name' },
      { name: 'need_date_time', type: 'datetime', label: 'Need Date' },
      { name: 'quantity', type: 'number', label: 'Quantity' },
      { name: 'priority', type: 'number', label: 'Priority' },
      { name: 'scheduled_status', type: 'string', label: 'Status' },
      { name: 'due_date', type: 'datetime', label: 'Due Date' },
      { name: 'late_days', type: 'number', label: 'Days Late' },
      { name: 'completion_percentage', type: 'number', label: 'Completion %' }
    ]
  },
  {
    id: 'ptjoboperations',
    name: 'Job Operations',
    table: 'ptjoboperations',
    fields: [
      { name: 'job_id', type: 'string', label: 'Job ID' },
      { name: 'operation_id', type: 'string', label: 'Operation ID' },
      { name: 'name', type: 'string', label: 'Operation Name' },
      { name: 'scheduled_start', type: 'datetime', label: 'Scheduled Start' },
      { name: 'scheduled_end', type: 'datetime', label: 'Scheduled End' },
      { name: 'actual_start', type: 'datetime', label: 'Actual Start' },
      { name: 'actual_end', type: 'datetime', label: 'Actual End' },
      { name: 'setup_hours', type: 'number', label: 'Setup Hours' },
      { name: 'run_hrs', type: 'number', label: 'Run Hours' },
      { name: 'efficiency', type: 'number', label: 'Efficiency %' },
      { name: 'delay_hours', type: 'number', label: 'Delay Hours' }
    ]
  },
  {
    id: 'ptresources',
    name: 'Resources',
    table: 'ptresources',
    fields: [
      { name: 'resource_id', type: 'string', label: 'Resource ID' },
      { name: 'name', type: 'string', label: 'Resource Name' },
      { name: 'department_name', type: 'string', label: 'Department' },
      { name: 'plant_name', type: 'string', label: 'Plant' },
      { name: 'active', type: 'boolean', label: 'Active' },
      { name: 'speed_factor', type: 'number', label: 'Speed Factor' },
      { name: 'bottleneck', type: 'boolean', label: 'Is Bottleneck' },
      { name: 'utilization', type: 'number', label: 'Utilization %' },
      { name: 'efficiency', type: 'number', label: 'Efficiency %' }
    ]
  },
  {
    id: 'ptjobactivities',
    name: 'Job Activities',
    table: 'ptjobactivities',
    fields: [
      { name: 'job_id', type: 'string', label: 'Job ID' },
      { name: 'activity_name', type: 'string', label: 'Activity Name' },
      { name: 'resource_id', type: 'string', label: 'Resource ID' },
      { name: 'scheduled_start_date', type: 'datetime', label: 'Scheduled Start' },
      { name: 'scheduled_end_date', type: 'datetime', label: 'Scheduled End' },
      { name: 'actual_start', type: 'datetime', label: 'Actual Start' },
      { name: 'actual_end', type: 'datetime', label: 'Actual End' },
      { name: 'production_status', type: 'string', label: 'Production Status' },
      { name: 'activity_type', type: 'string', label: 'Activity Type' }
    ]
  }
];

// Aggregation functions
const aggregationFunctions = [
  { value: 'AVG', label: 'Average' },
  { value: 'SUM', label: 'Sum' },
  { value: 'COUNT', label: 'Count' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
  { value: 'STDDEV', label: 'Standard Deviation' },
  { value: 'VARIANCE', label: 'Variance' },
  { value: 'MEDIAN', label: 'Median' }
];

// Filter operators
const filterOperators = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not Equals' },
  { value: '>', label: 'Greater Than' },
  { value: '>=', label: 'Greater Than or Equal' },
  { value: '<', label: 'Less Than' },
  { value: '<=', label: 'Less Than or Equal' },
  { value: 'LIKE', label: 'Contains' },
  { value: 'NOT LIKE', label: 'Does Not Contain' },
  { value: 'IN', label: 'In List' },
  { value: 'NOT IN', label: 'Not In List' },
  { value: 'IS NULL', label: 'Is Empty' },
  { value: 'IS NOT NULL', label: 'Is Not Empty' }
];

const kpiTemplates: KPITemplate[] = [
  {
    id: 'efficiency',
    name: 'Production Efficiency',
    icon: <Gauge className="h-5 w-5" />,
    category: 'Operations',
    description: 'Track overall equipment effectiveness and production rates',
    metrics: ['OEE', 'Throughput', 'Cycle Time', 'Utilization'],
    defaultConfig: {
      targetValue: 85,
      warningThreshold: 75,
      criticalThreshold: 60,
      unit: '%',
      aggregation: 'average'
    },
    color: 'text-blue-500'
  },
  {
    id: 'quality',
    name: 'Quality Metrics',
    icon: <CheckCircle className="h-5 w-5" />,
    category: 'Quality',
    description: 'Monitor first pass yield and defect rates',
    metrics: ['First Pass Yield', 'Defect Rate', 'Scrap Rate', 'Rework Rate'],
    defaultConfig: {
      targetValue: 98,
      warningThreshold: 95,
      criticalThreshold: 90,
      unit: '%',
      aggregation: 'average'
    },
    color: 'text-green-500'
  },
  {
    id: 'delivery',
    name: 'On-Time Delivery',
    icon: <Clock className="h-5 w-5" />,
    category: 'Logistics',
    description: 'Track delivery performance and schedule adherence',
    metrics: ['On-Time Delivery', 'Schedule Adherence', 'Lead Time', 'Order Fulfillment'],
    defaultConfig: {
      targetValue: 95,
      warningThreshold: 90,
      criticalThreshold: 85,
      unit: '%',
      aggregation: 'average'
    },
    color: 'text-purple-500'
  },
  {
    id: 'cost',
    name: 'Cost Performance',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'Financial',
    description: 'Monitor production costs and budget variance',
    metrics: ['Cost per Unit', 'Budget Variance', 'Material Cost', 'Labor Cost'],
    defaultConfig: {
      targetValue: 100000,
      warningThreshold: 110000,
      criticalThreshold: 120000,
      unit: '$',
      aggregation: 'sum'
    },
    color: 'text-yellow-500'
  },
  {
    id: 'inventory',
    name: 'Inventory Turnover',
    icon: <Package className="h-5 w-5" />,
    category: 'Inventory',
    description: 'Track inventory levels and turnover rates',
    metrics: ['Inventory Turnover', 'Stock Levels', 'Days on Hand', 'Stock Accuracy'],
    defaultConfig: {
      targetValue: 12,
      warningThreshold: 10,
      criticalThreshold: 8,
      unit: 'turns/year',
      aggregation: 'average'
    },
    color: 'text-orange-500'
  },
  {
    id: 'safety',
    name: 'Safety Metrics',
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'Safety',
    description: 'Monitor workplace safety and incident rates',
    metrics: ['Incident Rate', 'Days Without Injury', 'Near Misses', 'Safety Compliance'],
    defaultConfig: {
      targetValue: 0,
      warningThreshold: 2,
      criticalThreshold: 5,
      unit: 'incidents',
      aggregation: 'sum'
    },
    color: 'text-red-500'
  }
];

const visualizationTypes = [
  { id: 'gauge', name: 'Gauge Chart', icon: <Gauge className="h-4 w-4" /> },
  { id: 'line', name: 'Line Chart', icon: <Activity className="h-4 w-4" /> },
  { id: 'bar', name: 'Bar Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'pie', name: 'Pie Chart', icon: <PieChart className="h-4 w-4" /> },
  { id: 'number', name: 'Number Card', icon: <Target className="h-4 w-4" /> },
  { id: 'trend', name: 'Trend Line', icon: <TrendingUp className="h-4 w-4" /> }
];

const refreshIntervals = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' }
];

export function SmartKPIWidgetStudio({ open, onOpenChange, existingWidget }: SmartKPIWidgetStudioProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<KPITemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    description: '',
    metric: '',
    dataSource: '',
    visualization: 'gauge',
    targetValue: 100,
    warningThreshold: 80,
    criticalThreshold: 60,
    unit: '%',
    aggregation: 'average',
    refreshInterval: 30,
    showTrend: true,
    showComparison: true,
    showSparkline: true,
    colorScheme: 'default',
    size: 'medium',
    tags: [] as string[],
    isShared: false,
    alertsEnabled: true,
    alertRecipients: [] as string[],
    // Advanced formula configuration
    formulaConfig: {
      sourceTable: '',
      selectField: '',
      filters: [] as any[],
      groupBy: '',
      aggregationFunction: 'AVG',
      customFormula: '',
      useCustomFormula: false
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with existing widget data if editing
  React.useEffect(() => {
    if (existingWidget) {
      const config = existingWidget.configuration || existingWidget.data?.configuration || {};
      setWidgetConfig({
        ...widgetConfig,
        ...config,
        title: existingWidget.title || '',
        description: existingWidget.description || ''
      });
      
      // Try to find and set the template if it exists
      const templateId = existingWidget.data?.template || config.templateId;
      if (templateId) {
        const template = kpiTemplates.find(t => t.id === templateId);
        if (template) {
          setSelectedTemplate(template);
          setStep(2); // Skip template selection and go to configuration
        }
      } else if (existingWidget.title) {
        // Try to guess template from title or widget type
        const possibleTemplate = kpiTemplates.find(t => 
          existingWidget.title?.toLowerCase().includes(t.name.toLowerCase()) ||
          t.metrics.some(metric => existingWidget.title?.toLowerCase().includes(metric.toLowerCase()))
        );
        if (possibleTemplate) {
          setSelectedTemplate(possibleTemplate);
          setStep(2);
        }
      }
    }
  }, [existingWidget]);

  const createWidgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!existingWidget;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/canvas/widgets/${existingWidget.id}` : '/api/canvas/widgets';
      
      const payload = {
        title: data.title,
        widgetType: 'smart-kpi',
        widgetSubtype: selectedTemplate?.category || 'KPI',
        targetPlatform: 'both',
        data: {
          template: selectedTemplate?.id,
          configuration: data.configuration
        },
        configuration: data.configuration,
        isVisible: true
      };

      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      const isEditing = !!existingWidget;
      toast({
        title: "Success",
        description: isEditing ? "SMART KPI widget updated successfully!" : "SMART KPI widget created successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/design-studio/widgets'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      const isEditing = !!existingWidget;
      toast({
        title: "Error",
        description: isEditing ? "Failed to update widget" : "Failed to create widget",
        variant: "destructive"
      });
    }
  });

  const handleTemplateSelect = (template: KPITemplate) => {
    setSelectedTemplate(template);
    setWidgetConfig({
      ...widgetConfig,
      ...template.defaultConfig,
      title: template.name,
      description: template.description,
      metric: template.metrics[0]
    });
    setStep(2);
  };

  const handleSave = () => {
    if (!widgetConfig.title || !widgetConfig.metric) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createWidgetMutation.mutate({
      title: widgetConfig.title,
      description: widgetConfig.description,
      configuration: widgetConfig
    });
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTemplate(null);
    setWidgetConfig({
      title: '',
      description: '',
      metric: '',
      dataSource: '',
      visualization: 'gauge',
      targetValue: 100,
      warningThreshold: 80,
      criticalThreshold: 60,
      unit: '%',
      aggregation: 'average',
      refreshInterval: 30,
      showTrend: true,
      showComparison: true,
      showSparkline: true,
      colorScheme: 'default',
      size: 'medium',
      tags: [],
      isShared: false,
      alertsEnabled: true,
      alertRecipients: [],
      formulaConfig: {
        sourceTable: '',
        selectField: '',
        filters: [],
        groupBy: '',
        aggregationFunction: 'AVG',
        customFormula: '',
        useCustomFormula: false
      }
    });
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {existingWidget ? 'Edit SMART KPI Widget' : 'SMART KPI Widget Studio'}
          </DialogTitle>
          <DialogDescription className="mb-2">
            {existingWidget ? 'Update your KPI widget configuration and settings' : 'Create powerful KPI widgets with guided templates and intelligent configuration'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pt-2">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 px-4 pt-4">
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
              <span className="text-sm font-medium">Configure KPI</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Customize Display</span>
            </div>
          </div>

          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpiTemplates.map((template) => (
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
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {template.metrics.map((metric) => (
                          <Badge key={metric} variant="secondary" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Custom KPI
                  </CardTitle>
                  <CardDescription>
                    Create a custom KPI widget from scratch
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

          {/* Step 2: KPI Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="formula">Formula Builder</TabsTrigger>
                  <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
                  <TabsTrigger value="display">Display</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Basic Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Widget Title *</Label>
                          <Input
                            id="title"
                            value={widgetConfig.title}
                            onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
                            placeholder="e.g., Production Efficiency"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="metric">Metric *</Label>
                          <Select
                            value={widgetConfig.metric}
                            onValueChange={(value) => setWidgetConfig({ ...widgetConfig, metric: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a metric" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedTemplate?.metrics.map((metric) => (
                                <SelectItem key={metric} value={metric}>
                                  {metric}
                                </SelectItem>
                              )) || (
                                <>
                                  <SelectItem value="custom">Custom Metric</SelectItem>
                                  <SelectItem value="oee">OEE</SelectItem>
                                  <SelectItem value="quality">Quality Rate</SelectItem>
                                  <SelectItem value="performance">Performance Rate</SelectItem>
                                </>
                              )}
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
                          placeholder="Describe what this KPI measures..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Formula Builder Tab */}
                <TabsContent value="formula" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Formula Builder
                      </CardTitle>
                      <CardDescription>
                        Define how your KPI is calculated with flexible data sources and conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Data Source Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <Label className="text-base font-medium">Data Source</Label>
                        </div>
                        <Select
                          value={widgetConfig.formulaConfig.sourceTable}
                          onValueChange={(value) => setWidgetConfig({
                            ...widgetConfig,
                            formulaConfig: { ...widgetConfig.formulaConfig, sourceTable: value, selectField: '' }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select data source table" />
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

                      {/* Field Selection */}
                      {widgetConfig.formulaConfig.sourceTable && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <Label className="text-base font-medium">Calculate Field</Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Field to Calculate</Label>
                              <Select
                                value={widgetConfig.formulaConfig.selectField}
                                onValueChange={(value) => setWidgetConfig({
                                  ...widgetConfig,
                                  formulaConfig: { ...widgetConfig.formulaConfig, selectField: value }
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dataSources
                                    .find(ds => ds.id === widgetConfig.formulaConfig.sourceTable)
                                    ?.fields.filter(field => field.type === 'number' || field.type === 'datetime')
                                    .map((field) => (
                                      <SelectItem key={field.name} value={field.name}>
                                        {field.label} ({field.type})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Aggregation Function</Label>
                              <Select
                                value={widgetConfig.formulaConfig.aggregationFunction}
                                onValueChange={(value) => setWidgetConfig({
                                  ...widgetConfig,
                                  formulaConfig: { ...widgetConfig.formulaConfig, aggregationFunction: value }
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {aggregationFunctions.map((func) => (
                                    <SelectItem key={func.value} value={func.value}>
                                      {func.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filters Section */}
                      {widgetConfig.formulaConfig.sourceTable && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Filter className="h-4 w-4" />
                              <Label className="text-base font-medium">Filters & Conditions</Label>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newFilter = {
                                  id: Date.now(),
                                  field: '',
                                  operator: '=',
                                  value: '',
                                  type: 'string'
                                };
                                setWidgetConfig({
                                  ...widgetConfig,
                                  formulaConfig: {
                                    ...widgetConfig.formulaConfig,
                                    filters: [...widgetConfig.formulaConfig.filters, newFilter]
                                  }
                                });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Filter
                            </Button>
                          </div>

                          {widgetConfig.formulaConfig.filters.length === 0 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                              No filters added. Click "Add Filter" to add conditions like "priority {'>'} 1"
                            </div>
                          )}

                          {widgetConfig.formulaConfig.filters.map((filter, index) => (
                            <div key={filter.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Filter {index + 1}</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newFilters = widgetConfig.formulaConfig.filters.filter(f => f.id !== filter.id);
                                    setWidgetConfig({
                                      ...widgetConfig,
                                      formulaConfig: { ...widgetConfig.formulaConfig, filters: newFilters }
                                    });
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <Select
                                  value={filter.field}
                                  onValueChange={(value) => {
                                    const field = dataSources
                                      .find(ds => ds.id === widgetConfig.formulaConfig.sourceTable)
                                      ?.fields.find(f => f.name === value);
                                    const newFilters = [...widgetConfig.formulaConfig.filters];
                                    newFilters[index] = { ...filter, field: value, type: field?.type || 'string' };
                                    setWidgetConfig({
                                      ...widgetConfig,
                                      formulaConfig: { ...widgetConfig.formulaConfig, filters: newFilters }
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dataSources
                                      .find(ds => ds.id === widgetConfig.formulaConfig.sourceTable)
                                      ?.fields.map((field) => (
                                        <SelectItem key={field.name} value={field.name}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={filter.operator}
                                  onValueChange={(value) => {
                                    const newFilters = [...widgetConfig.formulaConfig.filters];
                                    newFilters[index] = { ...filter, operator: value };
                                    setWidgetConfig({
                                      ...widgetConfig,
                                      formulaConfig: { ...widgetConfig.formulaConfig, filters: newFilters }
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filterOperators.map((op) => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Value"
                                  value={filter.value}
                                  onChange={(e) => {
                                    const newFilters = [...widgetConfig.formulaConfig.filters];
                                    newFilters[index] = { ...filter, value: e.target.value };
                                    setWidgetConfig({
                                      ...widgetConfig,
                                      formulaConfig: { ...widgetConfig.formulaConfig, filters: newFilters }
                                    });
                                  }}
                                />
                                <Badge variant="secondary" className="self-center justify-center">
                                  {filter.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formula Preview */}
                      {widgetConfig.formulaConfig.sourceTable && widgetConfig.formulaConfig.selectField && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            <Label className="text-base font-medium">Formula Preview</Label>
                          </div>
                          <div className="bg-gray-100 border rounded-lg p-4 font-mono text-sm">
                            <div className="text-blue-600">
                              SELECT {widgetConfig.formulaConfig.aggregationFunction}({widgetConfig.formulaConfig.selectField})
                            </div>
                            <div className="text-green-600">
                              FROM {dataSources.find(ds => ds.id === widgetConfig.formulaConfig.sourceTable)?.table}
                            </div>
                            {widgetConfig.formulaConfig.filters.length > 0 && (
                              <div className="text-purple-600">
                                WHERE {widgetConfig.formulaConfig.filters.map(f => 
                                  f.field && f.operator && f.value ? 
                                  `${f.field} ${f.operator} ${f.type === 'string' ? `'${f.value}'` : f.value}` : ''
                                ).filter(Boolean).join(' AND ')}
                              </div>
                            )}
                            {widgetConfig.formulaConfig.groupBy && (
                              <div className="text-orange-600">
                                GROUP BY {widgetConfig.formulaConfig.groupBy}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Example:</strong> For "average job lateness for jobs over priority 1":
                            <br />
                            • Data Source: Production Jobs
                            • Calculate Field: Days Late
                            • Aggregation: Average
                            • Filter: Priority {'>'} 1
                          </div>
                        </div>
                      )}

                      {/* Advanced Options */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Advanced Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Group By (Optional)</Label>
                            <Select
                              value={widgetConfig.formulaConfig.groupBy || 'none'}
                              onValueChange={(value) => setWidgetConfig({
                                ...widgetConfig,
                                formulaConfig: { ...widgetConfig.formulaConfig, groupBy: value === 'none' ? '' : value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="No grouping" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No grouping</SelectItem>
                                {dataSources
                                  .find(ds => ds.id === widgetConfig.formulaConfig.sourceTable)
                                  ?.fields.filter(field => field.type === 'string')
                                  .map((field) => (
                                    <SelectItem key={field.name} value={field.name}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              checked={widgetConfig.formulaConfig.useCustomFormula}
                              onCheckedChange={(checked) => setWidgetConfig({
                                ...widgetConfig,
                                formulaConfig: { ...widgetConfig.formulaConfig, useCustomFormula: checked }
                              })}
                            />
                            <Label>Use custom SQL formula</Label>
                          </div>
                        </div>

                        {widgetConfig.formulaConfig.useCustomFormula && (
                          <div className="space-y-2">
                            <Label>Custom SQL Formula</Label>
                            <Textarea
                              value={widgetConfig.formulaConfig.customFormula}
                              onChange={(e) => setWidgetConfig({
                                ...widgetConfig,
                                formulaConfig: { ...widgetConfig.formulaConfig, customFormula: e.target.value }
                              })}
                              placeholder="Enter custom SQL formula (advanced users only)"
                              rows={4}
                              className="font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Thresholds Tab */}
                <TabsContent value="thresholds" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Thresholds & Targets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Target Value: {widgetConfig.targetValue}</Label>
                        <Slider
                          value={[widgetConfig.targetValue]}
                          onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, targetValue: value })}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Warning Threshold: {widgetConfig.warningThreshold}</Label>
                        <Slider
                          value={[widgetConfig.warningThreshold]}
                          onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, warningThreshold: value })}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Critical Threshold: {widgetConfig.criticalThreshold}</Label>
                        <Slider
                          value={[widgetConfig.criticalThreshold]}
                          onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, criticalThreshold: value })}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={widgetConfig.unit}
                          onChange={(e) => setWidgetConfig({ ...widgetConfig, unit: e.target.value })}
                          placeholder="%, $, units, etc."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Display Tab */}
                <TabsContent value="display" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Display Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Visualization Type</Label>
                          <Select
                            value={widgetConfig.visualization}
                            onValueChange={(value) => setWidgetConfig({ ...widgetConfig, visualization: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gauge">Gauge Chart</SelectItem>
                              <SelectItem value="number">Number Display</SelectItem>
                              <SelectItem value="line">Line Chart</SelectItem>
                              <SelectItem value="bar">Bar Chart</SelectItem>
                              <SelectItem value="progress">Progress Bar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Size</Label>
                          <Select
                            value={widgetConfig.size}
                            onValueChange={(value) => setWidgetConfig({ ...widgetConfig, size: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Color Scheme</Label>
                          <Select
                            value={widgetConfig.colorScheme}
                            onValueChange={(value) => setWidgetConfig({ ...widgetConfig, colorScheme: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={widgetConfig.showTrend}
                            onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showTrend: checked })}
                          />
                          <Label>Show Trend</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={widgetConfig.showComparison}
                            onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showComparison: checked })}
                          />
                          <Label>Show Comparison</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={widgetConfig.showSparkline}
                            onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showSparkline: checked })}
                          />
                          <Label>Show Sparkline</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Refresh Interval (seconds)</Label>
                        <Slider
                          value={[widgetConfig.refreshInterval]}
                          onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, refreshInterval: value })}
                          min={5}
                          max={300}
                          step={5}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-500">{widgetConfig.refreshInterval} seconds</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Templates
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    {existingWidget ? 'Update Widget' : 'Create Widget'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Save */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Thresholds & Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Value: {widgetConfig.targetValue}</Label>
                    <Slider
                      value={[widgetConfig.targetValue]}
                      onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, targetValue: value })}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Warning Threshold: {widgetConfig.warningThreshold}</Label>
                    <Slider
                      value={[widgetConfig.warningThreshold]}
                      onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, warningThreshold: value })}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Critical Threshold: {widgetConfig.criticalThreshold}</Label>
                    <Slider
                      value={[widgetConfig.criticalThreshold]}
                      onValueChange={([value]) => setWidgetConfig({ ...widgetConfig, criticalThreshold: value })}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Customize Display
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Display Customization */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Visualization Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chart Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {visualizationTypes.map((type) => (
                        <Button
                          key={type.id}
                          variant={widgetConfig.visualization === type.id ? "default" : "outline"}
                          onClick={() => setWidgetConfig({ ...widgetConfig, visualization: type.id })}
                          className="flex items-center gap-2"
                        >
                          {type.icon}
                          <span className="text-xs">{type.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="refreshInterval">Refresh Interval</Label>
                      <Select
                        value={widgetConfig.refreshInterval.toString()}
                        onValueChange={(value) => setWidgetConfig({ ...widgetConfig, refreshInterval: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {refreshIntervals.map((interval) => (
                            <SelectItem key={interval.value} value={interval.value.toString()}>
                              {interval.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Widget Size</Label>
                      <Select
                        value={widgetConfig.size}
                        onValueChange={(value) => setWidgetConfig({ ...widgetConfig, size: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xlarge">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showTrend">Show Trend Indicator</Label>
                      <Switch
                        id="showTrend"
                        checked={widgetConfig.showTrend}
                        onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showTrend: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showComparison">Show Period Comparison</Label>
                      <Switch
                        id="showComparison"
                        checked={widgetConfig.showComparison}
                        onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showComparison: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showSparkline">Show Sparkline</Label>
                      <Switch
                        id="showSparkline"
                        checked={widgetConfig.showSparkline}
                        onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, showSparkline: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Sharing & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isShared">Share with Team</Label>
                    <Switch
                      id="isShared"
                      checked={widgetConfig.isShared}
                      onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, isShared: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertsEnabled">Enable Alerts</Label>
                    <Switch
                      id="alertsEnabled"
                      checked={widgetConfig.alertsEnabled}
                      onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, alertsEnabled: checked })}
                    />
                  </div>

                  {widgetConfig.alertsEnabled && (
                    <div className="space-y-2">
                      <Label>Alert Recipients</Label>
                      <Input
                        placeholder="Enter email addresses separated by commas"
                        onChange={(e) => setWidgetConfig({ 
                          ...widgetConfig, 
                          alertRecipients: e.target.value.split(',').map(email => email.trim())
                        })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button onClick={handleSave} disabled={createWidgetMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {createWidgetMutation.isPending 
                      ? (existingWidget ? 'Updating...' : 'Creating...') 
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

    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-6">
          <DialogTitle>Widget Preview</DialogTitle>
          <DialogDescription className="mb-4">
            This is how your KPI widget will appear on the dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <KPIWidgetPreview config={widgetConfig} />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// KPI Widget Preview Component
function KPIWidgetPreview({ config }: { config: any }) {
  // Generate sample data based on configuration
  const generateSampleValue = () => {
    const baseValue = config.targetValue || 95;
    return Math.round(baseValue + (Math.random() - 0.5) * 10);
  };

  const currentValue = generateSampleValue();
  const previousValue = Math.round(currentValue * (0.9 + Math.random() * 0.2));
  const trend = currentValue > previousValue ? 'up' : 'down';
  const trendPercentage = Math.abs(((currentValue - previousValue) / previousValue) * 100);
  const achievement = Math.round((currentValue / (config.targetValue || 100)) * 100);

  // Generate sparkline data
  const sparklineData = Array.from({ length: 15 }, () => 
    Math.round(config.targetValue * (0.8 + Math.random() * 0.4))
  );
  const maxSparkValue = Math.max(...sparklineData);
  const minSparkValue = Math.min(...sparklineData);

  const getStatusColor = () => {
    if (achievement >= 95) return '#10b981'; // emerald
    if (achievement >= 85) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getStatusText = () => {
    if (achievement >= 95) return 'On Target';
    if (achievement >= 85) return 'Near Target';
    return 'Below Target';
  };

  const renderVisualization = () => {
    const percentage = Math.min((currentValue / (config.targetValue || 100)) * 100, 100);
    
    switch (config.visualization) {
      case 'gauge':
        return (
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
                stroke={getStatusColor()}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${percentage * 3.52} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{currentValue}</div>
                <div className="text-xs text-gray-500">{config.unit || 'units'}</div>
              </div>
            </div>
          </div>
        );
        
      case 'bar':
        return (
          <div className="flex items-end justify-center h-24 gap-1">
            {sparklineData.slice(-5).map((value, i) => {
              const height = (value / maxSparkValue) * 100;
              const isLatest = i === 4;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="relative w-8 h-20 bg-gray-100 rounded">
                    <div 
                      className={`absolute bottom-0 w-full rounded transition-all duration-300 ${
                        isLatest ? 'opacity-100' : 'opacity-60'
                      }`}
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: isLatest ? getStatusColor() : '#d1d5db'
                      }}
                    />
                  </div>
                  {isLatest && (
                    <div className="text-xs font-semibold text-gray-900">{value}</div>
                  )}
                </div>
              );
            })}
          </div>
        );
        
      case 'progress':
        return (
          <div className="w-full space-y-3">
            <div className="text-center mb-2">
              <div className="text-3xl font-bold text-gray-900">{currentValue}</div>
              <div className="text-xs text-gray-500">{config.unit || 'units'}</div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getStatusColor()
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span className="font-medium">{config.targetValue || 100}</span>
            </div>
          </div>
        );
        
      default: // number display
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">{currentValue}</div>
            <div className="text-sm text-gray-500">{config.unit || 'units'}</div>
            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                 style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}>
              {achievement}% of target
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6 space-y-4">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {config.title || 'On-Time Delivery'}
                </h3>
                {config.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {config.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                   style={{ backgroundColor: `${getStatusColor()}15`, color: getStatusColor() }}>
                {getStatusText()}
              </div>
            </div>
          </div>

          {/* Main Metrics Section */}
          <div className="mb-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{currentValue}</span>
                  <span className="text-sm text-gray-500">{config.unit || 'units'}</span>
                </div>
                {config.showTrend && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {trend === 'up' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>{trendPercentage.toFixed(1)}%</span>
                    </div>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                )}
              </div>
              
              {/* Visualization */}
              <div className="flex items-center justify-center min-h-[140px] pt-2">
                {renderVisualization()}
              </div>
            </div>

            {/* Sparkline Trend */}
            {config.showSparkline && (
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
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Target</div>
              <div className="text-sm font-semibold text-gray-900">
                {config.targetValue || 95} {config.unit || 'units'}
              </div>
            </div>
            
            {config.showComparison && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Previous</div>
                <div className="text-sm font-semibold text-gray-900">
                  {previousValue} {config.unit || 'units'}
                </div>
              </div>
            )}
            
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Achievement</div>
              <div className="text-sm font-semibold" style={{ color: getStatusColor() }}>
                {achievement}%
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Updates every {config.refreshInterval || 30}s</span>
            </div>
            {config.alertsEnabled && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Alerts enabled</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}