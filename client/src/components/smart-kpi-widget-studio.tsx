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
  X
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
    alertRecipients: [] as string[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with existing widget data if editing
  React.useEffect(() => {
    if (existingWidget) {
      setWidgetConfig({
        ...widgetConfig,
        ...existingWidget.configuration,
        title: existingWidget.title || '',
        description: existingWidget.description || ''
      });
    }
  }, [existingWidget]);

  const createWidgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/canvas/widgets', {
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
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "SMART KPI widget created successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/widgets'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create widget",
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
      alertRecipients: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Smart KPI Widget Studio
          </DialogTitle>
          <DialogDescription>
            Create powerful KPI widgets with guided templates and intelligent configuration
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataSource">Data Source</Label>
                      <Select
                        value={widgetConfig.dataSource}
                        onValueChange={(value) => setWidgetConfig({ ...widgetConfig, dataSource: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production Data</SelectItem>
                          <SelectItem value="quality">Quality System</SelectItem>
                          <SelectItem value="erp">ERP System</SelectItem>
                          <SelectItem value="iot">IoT Sensors</SelectItem>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aggregation">Aggregation</Label>
                      <Select
                        value={widgetConfig.aggregation}
                        onValueChange={(value) => setWidgetConfig({ ...widgetConfig, aggregation: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="min">Minimum</SelectItem>
                          <SelectItem value="max">Maximum</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </div>
                </CardContent>
              </Card>

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
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button onClick={handleSave} disabled={createWidgetMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {createWidgetMutation.isPending ? 'Creating...' : 'Create Widget'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}