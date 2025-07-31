// Unified Widget System Library
// This library provides types and utilities for creating widgets across all application areas

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
  MoreHorizontal 
} from 'lucide-react';

export interface WidgetConfig {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'alert' | 'progress' | 'gauge' | 'list' | 'timeline' | 'button' | 'text' | 'schedule-optimization';
  title: string;
  subtitle?: string;
  dataSource: 'productionOrders' | 'operations' | 'resources' | 'customers' | 'vendors' | 'plants' | 'capabilities' | 'recipes' | 'productionVersions' | 'plannedOrders' | 'users' | 'metrics' | 'alerts' | 'optimization';
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'number' | 'gauge' | 'progress';
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  groupBy?: string;
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  filters?: Record<string, any>;
  colors?: string[];
  thresholds?: Array<{ value: number; color: string; label?: string }>;
  limit?: number;
  size: { width: number; height: number };
  position: { x: number; y: number };
  refreshInterval?: number;
  drillDownTarget?: string;
  drillDownParams?: Record<string, any>;
  action?: string;
  content?: string;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'operations' | 'management' | 'custom';
  type: WidgetConfig['type'];
  icon: React.ComponentType<any>;
  defaultConfig: Partial<WidgetConfig>;
  targetSystems: ('cockpit' | 'analytics' | 'canvas' | 'dashboard')[];
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface SystemData {
  productionOrders?: any[];
  operations?: any[];
  resources?: any[];
  customers?: any[];
  vendors?: any[];
  plants?: any[];
  capabilities?: any[];
  recipes?: any[];
  productionVersions?: any[];
  plannedOrders?: any[];
  users?: any[];
  metrics?: Record<string, any>;
  alerts?: any[];
}

export interface ProcessedWidgetData {
  value?: number | string;
  label?: string;
  change?: string;
  trend?: 'up' | 'down';
  items?: any[];
  chartData?: any;
  tableData?: any[];
  alertData?: any[];
  progressValue?: number;
  gaugeValue?: number;
}

export class WidgetDataProcessor {
  constructor(private systemData: SystemData) {}

  processWidgetData(config: WidgetConfig): ProcessedWidgetData | null {
    try {
      const sourceData = this.getSourceData(config.dataSource);
      if (!sourceData || (Array.isArray(sourceData) && sourceData.length === 0)) {
        return this.getEmptyStateData(config);
      }

      switch (config.type) {
        case 'kpi':
          return this.processKPIData(config, sourceData);
        case 'chart':
          return this.processChartData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'table':
          return this.processTableData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'alert':
          return this.processAlertData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'progress':
          return this.processProgressData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'gauge':
          return this.processGaugeData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'list':
          return this.processListData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'timeline':
          return this.processTimelineData(config, Array.isArray(sourceData) ? sourceData : []);
        case 'button':
          return this.processButtonData(config);
        case 'text':
          return this.processTextData(config);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error processing widget data:', error);
      return null;
    }
  }

  private getSourceData(dataSource: string) {
    switch (dataSource) {
      case 'productionOrders':
        return this.systemData.productionOrders || [];
      case 'operations':
        return this.systemData.operations || [];
      case 'resources':
        return this.systemData.resources || [];
      case 'customers':
        return this.systemData.customers || [];
      case 'vendors':
        return this.systemData.vendors || [];
      case 'plants':
        return this.systemData.plants || [];
      case 'capabilities':
        return this.systemData.capabilities || [];
      case 'recipes':
        return this.systemData.recipes || [];
      case 'productionVersions':
        return this.systemData.productionVersions || [];
      case 'plannedOrders':
        return this.systemData.plannedOrders || [];
      case 'users':
        return this.systemData.users || [];
      case 'metrics':
        return this.systemData.metrics || {};
      case 'alerts':
        return this.systemData.alerts || [];
      default:
        return [];
    }
  }

  private getEmptyStateData(config: WidgetConfig): ProcessedWidgetData {
    return {
      value: 0,
      label: `No ${config.dataSource} data available`,
      items: [],
      chartData: null,
      tableData: [],
      alertData: [],
      progressValue: 0,
      gaugeValue: 0
    };
  }

  private processKPIData(config: WidgetConfig, data: any): ProcessedWidgetData {
    if (config.dataSource === 'metrics' && typeof data === 'object') {
      // Handle metrics object
      const metricValue = this.extractMetricValue(data, config.groupBy);
      return {
        value: metricValue,
        label: config.title,
        items: Array.isArray(this.systemData.productionOrders) ? this.systemData.productionOrders.slice(0, 3) : []
      };
    }

    if (Array.isArray(data)) {
      const filteredData = this.applyFilters(data, config.filters);
      const value = this.calculateAggregation(filteredData, config.aggregation, config.groupBy);
      
      return {
        value,
        label: config.title,
        items: filteredData.slice(0, 3)
      };
    }

    return this.getEmptyStateData(config);
  }

  private processChartData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    try {
      const filteredData = this.applyFilters(data, config.filters);
      const groupedData = this.groupData(filteredData, config.groupBy);
      
      const labels = Object.keys(groupedData);
      const values = labels.map(label => 
        this.calculateAggregation(groupedData[label], config.aggregation)
      );

      // Ensure we have valid data for the chart
      if (labels.length === 0 || values.length === 0) {
        return this.getEmptyStateData(config);
      }

      const chartData = {
        labels,
        datasets: [{
          label: config.title || 'Data',
          data: values,
          backgroundColor: config.colors || [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
          ],
          borderColor: config.colors || [
            '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'
          ],
          borderWidth: 1
        }]
      };

      return { chartData };
    } catch (error) {
      console.error('Error processing chart data:', error);
      return this.getEmptyStateData(config);
    }
  }

  private processTableData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    let filteredData = this.applyFilters(data, config.filters);
    
    if (config.sortBy) {
      filteredData = this.sortData(filteredData, config.sortBy);
    }

    if (config.limit) {
      filteredData = filteredData.slice(0, config.limit);
    }

    return { tableData: filteredData };
  }

  private processAlertData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    const filteredData = this.applyFilters(data, config.filters);
    const sortedData = this.sortData(filteredData, 
      config.sortBy || { field: 'created_at', direction: 'desc' }
    );
    const limitedData = config.limit ? sortedData.slice(0, config.limit) : sortedData;

    return { alertData: limitedData };
  }

  private processProgressData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    const filteredData = this.applyFilters(data, config.filters);
    const progressValue = this.calculateAggregation(filteredData, config.aggregation, config.groupBy);

    return { 
      progressValue: Math.min(100, Math.max(0, progressValue)),
      value: progressValue,
      label: config.title
    };
  }

  private processGaugeData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    const filteredData = this.applyFilters(data, config.filters);
    const gaugeValue = this.calculateAggregation(filteredData, config.aggregation, config.groupBy);

    return { 
      gaugeValue: Math.min(100, Math.max(0, gaugeValue)),
      value: gaugeValue,
      label: config.title
    };
  }

  private processListData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    let filteredData = this.applyFilters(data, config.filters);
    
    if (config.sortBy) {
      filteredData = this.sortData(filteredData, config.sortBy);
    }

    if (config.limit) {
      filteredData = filteredData.slice(0, config.limit);
    }

    return { items: filteredData };
  }

  private processTimelineData(config: WidgetConfig, data: any[]): ProcessedWidgetData {
    if (!Array.isArray(data)) {
      return this.getEmptyStateData(config);
    }

    const filteredData = this.applyFilters(data, config.filters);
    const sortedData = this.sortData(filteredData, 
      config.sortBy || { field: 'scheduled_date', direction: 'asc' }
    );

    return { items: sortedData };
  }

  private extractMetricValue(metrics: Record<string, any>, field?: string): number {
    if (field && metrics[field] !== undefined) {
      return Number(metrics[field]) || 0;
    }
    
    // Default to first numeric value found
    for (const value of Object.values(metrics)) {
      if (typeof value === 'number') {
        return value;
      }
    }
    
    return 0;
  }

  private applyFilters(data: any[], filters?: Record<string, any>): any[] {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  private groupData(data: any[], groupBy?: string): Record<string, any[]> {
    if (!groupBy) {
      return { 'All': data };
    }

    return data.reduce((groups, item) => {
      const groupValue = item[groupBy] || 'Unknown';
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private calculateAggregation(data: any[], aggregation?: string, field?: string): number {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    switch (aggregation) {
      case 'count':
        return data.length;
      case 'sum':
        return data.reduce((sum, item) => sum + (Number(item[field || 'value']) || 0), 0);
      case 'avg':
        const total = data.reduce((sum, item) => sum + (Number(item[field || 'value']) || 0), 0);
        return total / data.length;
      case 'min':
        return Math.min(...data.map(item => Number(item[field || 'value']) || 0));
      case 'max':
        return Math.max(...data.map(item => Number(item[field || 'value']) || 0));
      default:
        return data.length;
    }
  }

  private sortData(data: any[], sortBy: { field: string; direction: 'asc' | 'desc' }): any[] {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];
      
      if (aValue < bValue) {
        return sortBy.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortBy.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private processButtonData(config: WidgetConfig): ProcessedWidgetData {
    return {
      value: config.title,
      label: config.subtitle || 'Click to execute',
      action: config.action || 'custom'
    };
  }

  private processTextData(config: WidgetConfig): ProcessedWidgetData {
    return {
      value: config.title,
      label: config.content || 'Add your content here...'
    };
  }
}

// Comprehensive Widget Templates for all systems
export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // KPI & Metrics Templates
  {
    id: 'kpi-metric',
    name: 'KPI Metric',
    description: 'Display a single key performance indicator with trend',
    category: 'analytics',
    type: 'kpi',
    icon: TrendingUp,
    defaultConfig: {
      type: 'kpi',
      dataSource: 'productionOrders',
      aggregation: 'count',
      chartType: 'number',
      size: { width: 300, height: 200 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'active-production-orders-kpi',
    name: 'Active Production Orders Counter',
    description: 'Shows number of currently active production orders',
    category: 'operations',
    type: 'kpi',
    icon: Factory,
    defaultConfig: {
      type: 'kpi',
      dataSource: 'productionOrders',
      aggregation: 'count',
      chartType: 'number',
      filters: { status: ['active'] },
      size: { width: 280, height: 180 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'resource-utilization-kpi',
    name: 'Resource Utilization',
    description: 'Shows percentage of resources being used',
    category: 'operations',
    type: 'kpi',
    icon: Users,
    defaultConfig: {
      type: 'kpi',
      dataSource: 'resources',
      aggregation: 'avg',
      chartType: 'progress',
      groupBy: 'utilization',
      size: { width: 300, height: 200 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'completion-rate-kpi',
    name: 'Completion Rate',
    description: 'Shows percentage of completed operations',
    category: 'management',
    type: 'kpi',
    icon: CheckCircle,
    defaultConfig: {
      type: 'kpi',
      dataSource: 'operations',
      aggregation: 'avg',
      chartType: 'progress',
      groupBy: 'completion_percentage',
      size: { width: 300, height: 180 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  // Chart Templates
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Compare categories with vertical bars',
    category: 'analytics',
    type: 'chart',
    icon: BarChart3,
    defaultConfig: {
      type: 'chart',
      chartType: 'bar',
      dataSource: 'operations',
      groupBy: 'status',
      aggregation: 'count',
      size: { width: 400, height: 300 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    description: 'Show proportions in a circular chart',
    category: 'analytics',
    type: 'chart',
    icon: PieChart,
    defaultConfig: {
      type: 'chart',
      chartType: 'pie',
      dataSource: 'productionOrders',
      groupBy: 'status',
      aggregation: 'count',
      size: { width: 350, height: 300 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Track trends over time',
    category: 'analytics',
    type: 'chart',
    icon: LineChart,
    defaultConfig: {
      type: 'chart',
      chartType: 'line',
      dataSource: 'metrics',
      groupBy: 'created_at',
      aggregation: 'avg',
      size: { width: 500, height: 300 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'intermediate'
  },
  {
    id: 'gauge-chart',
    name: 'Gauge',
    description: 'Display progress or utilization as a gauge',
    category: 'operations',
    type: 'gauge',
    icon: Gauge,
    defaultConfig: {
      type: 'gauge',
      dataSource: 'resources',
      aggregation: 'avg',
      groupBy: 'utilization',
      thresholds: [
        { value: 80, color: '#10b981', label: 'Good' },
        { value: 60, color: '#f59e0b', label: 'Warning' },
        { value: 0, color: '#ef4444', label: 'Critical' }
      ],
      size: { width: 300, height: 250 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'intermediate'
  },
  // Table & List Templates
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Display detailed records in a table format',
    category: 'management',
    type: 'table',
    icon: Table,
    defaultConfig: {
      type: 'table',
      dataSource: 'operations',
      limit: 10,
      sortBy: { field: 'created_at', direction: 'desc' },
      size: { width: 600, height: 400 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'activity-feed',
    name: 'Activity Feed',
    description: 'Show recent activities and events',
    category: 'operations',
    type: 'list',
    icon: Activity,
    defaultConfig: {
      type: 'list',
      dataSource: 'operations',
      limit: 8,
      sortBy: { field: 'updated_at', direction: 'desc' },
      size: { width: 400, height: 350 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  // Alert & Notification Templates
  {
    id: 'alert-list',
    name: 'Alert List',
    description: 'Show system alerts and notifications',
    category: 'operations',
    type: 'alert',
    icon: AlertTriangle,
    defaultConfig: {
      type: 'alert',
      dataSource: 'alerts',
      limit: 5,
      filters: { severity: ['warning', 'critical'] },
      size: { width: 400, height: 300 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  {
    id: 'alerts-dashboard',
    name: 'Alerts Dashboard',
    description: 'System alerts and notifications feed',
    category: 'operations',
    type: 'alert',
    icon: Bell,
    defaultConfig: {
      type: 'alert',
      dataSource: 'alerts',
      limit: 8,
      filters: { severity: ['warning', 'critical', 'info'] },
      sortBy: { field: 'created_at', direction: 'desc' },
      size: { width: 400, height: 320 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  // Progress & Tracking Templates
  {
    id: 'progress-tracker',
    name: 'Progress Tracker',
    description: 'Track completion progress with progress bars',
    category: 'management',
    type: 'progress',
    icon: CheckCircle,
    defaultConfig: {
      type: 'progress',
      dataSource: 'productionOrders',
      aggregation: 'avg',
      groupBy: 'completion_percentage',
      size: { width: 350, height: 200 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  // Timeline & Schedule Templates
  {
    id: 'schedule-overview',
    name: 'Schedule Overview',
    description: 'Display production schedule timeline',
    category: 'operations',
    type: 'timeline',
    icon: Calendar,
    defaultConfig: {
      type: 'timeline',
      dataSource: 'productionOrders',
      groupBy: 'scheduled_date',
      filters: { status: ['scheduled', 'active'] },
      size: { width: 600, height: 300 }
    },
    targetSystems: ['cockpit', 'analytics'],
    complexity: 'advanced'
  },
  // Operations Specific Templates
  {
    id: 'production-status',
    name: 'Production Status',
    description: 'Real-time production line status overview',
    category: 'operations',
    type: 'table',
    icon: Factory,
    defaultConfig: {
      type: 'table',
      dataSource: 'operations',
      filters: { status: ['active', 'running'] },
      sortBy: { field: 'priority', direction: 'desc' },
      limit: 10,
      size: { width: 500, height: 350 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'intermediate'
  },
  {
    id: 'resource-status',
    name: 'Resource Status',
    description: 'Display current status of manufacturing resources',
    category: 'operations',
    type: 'gauge',
    icon: Users,
    defaultConfig: {
      type: 'gauge',
      dataSource: 'resources',
      aggregation: 'avg',
      groupBy: 'status',
      thresholds: [
        { value: 90, color: '#10b981', label: 'Optimal' },
        { value: 70, color: '#f59e0b', label: 'Warning' },
        { value: 0, color: '#ef4444', label: 'Critical' }
      ],
      size: { width: 300, height: 250 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'intermediate'
  },
  // Canvas-Specific Templates
  {
    id: 'interactive-button',
    name: 'Interactive Button',
    description: 'Clickable button for triggering actions',
    category: 'custom',
    type: 'button',
    icon: Target,
    defaultConfig: {
      type: 'button',
      title: 'Action Button',
      subtitle: 'Click to execute',
      size: { width: 200, height: 100 },
      colors: ['#3b82f6'],
      action: 'custom'
    },
    targetSystems: ['canvas'],
    complexity: 'basic'
  },
  {
    id: 'text-display',
    name: 'Text Display',
    description: 'Rich text content and documentation',
    category: 'custom',
    type: 'text',
    icon: MoreHorizontal,
    defaultConfig: {
      type: 'text',
      title: 'Information Panel',
      content: 'Add your content here...',
      size: { width: 400, height: 200 }
    },
    targetSystems: ['canvas'],
    complexity: 'basic'
  },
  // Management Templates
  {
    id: 'performance-metrics',
    name: 'Performance Metrics',
    description: 'Key performance indicators dashboard',
    category: 'management',
    type: 'kpi',
    icon: Target,
    defaultConfig: {
      type: 'kpi',
      dataSource: 'metrics',
      aggregation: 'avg',
      chartType: 'number',
      size: { width: 350, height: 220 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'intermediate'
  },
  {
    id: 'overdue-operations',
    name: 'Overdue Operations',
    description: 'Operations that are past their due date',
    category: 'management',
    type: 'alert',
    icon: Clock,
    defaultConfig: {
      type: 'alert',
      dataSource: 'operations',
      filters: { status: ['overdue'] },
      limit: 5,
      size: { width: 400, height: 250 }
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'basic'
  },
  // Schedule Optimization Widget
  {
    id: 'schedule-optimization',
    name: 'Schedule Optimization',
    description: 'Run optimization algorithms, view history, and track performance',
    category: 'operations',
    type: 'schedule-optimization',
    icon: Target,
    defaultConfig: {
      type: 'schedule-optimization',
      dataSource: 'optimization',
      size: { width: 400, height: 350 },
      showQuickActions: true,
      showHistory: true,
      showMetrics: true,
      maxHistoryItems: 5,
      defaultView: 'overview',
      showAlgorithmSelector: true,
      showProfileSelector: true
    },
    targetSystems: ['cockpit', 'analytics', 'canvas'],
    complexity: 'advanced'
  }
];

// Utility functions for widget management

export function convertCockpitWidgetToUniversal(cockpitWidget: any): WidgetConfig {
  return {
    id: cockpitWidget.id.toString(),
    type: mapCockpitTypeToUniversalType(cockpitWidget.type),
    title: cockpitWidget.title,
    subtitle: cockpitWidget.sub_title,
    dataSource: cockpitWidget.configuration?.dataSource || 'productionOrders',
    chartType: cockpitWidget.configuration?.chartType || 'bar',
    aggregation: cockpitWidget.configuration?.aggregation || 'count',
    groupBy: cockpitWidget.configuration?.groupBy,
    sortBy: cockpitWidget.configuration?.sortBy,
    filters: cockpitWidget.configuration?.filters,
    colors: cockpitWidget.configuration?.colors,
    thresholds: cockpitWidget.configuration?.thresholds,
    limit: cockpitWidget.configuration?.limit,
    size: { width: 400, height: 300 },
    position: cockpitWidget.position || { x: 0, y: 0 },
    refreshInterval: cockpitWidget.configuration?.refreshInterval,
    drillDownTarget: cockpitWidget.configuration?.drillDownTarget,
    drillDownParams: cockpitWidget.configuration?.drillDownParams
  };
}

export function convertUniversalToCockpitWidget(widget: WidgetConfig, layoutId: number): any {
  return {
    layout_id: layoutId,
    type: mapUniversalTypeToCockpitType(widget.type),
    title: widget.title,
    sub_title: widget.subtitle,
    position: widget.position,
    configuration: {
      dataSource: widget.dataSource,
      chartType: widget.chartType,
      aggregation: widget.aggregation,
      groupBy: widget.groupBy,
      sortBy: widget.sortBy,
      filters: widget.filters,
      colors: widget.colors,
      thresholds: widget.thresholds,
      limit: widget.limit,
      refreshInterval: widget.refreshInterval,
      drillDownTarget: widget.drillDownTarget,
      drillDownParams: widget.drillDownParams
    },
    is_visible: true
  };
}

export function convertUniversalToCanvasWidget(widget: WidgetConfig, userId: number, sessionId?: string): any {
  return {
    title: widget.title,
    widget_type: widget.type,
    widget_subtype: widget.chartType,
    data: {}, // Will be populated with actual data
    configuration: {
      dataSource: widget.dataSource,
      chartType: widget.chartType,
      aggregation: widget.aggregation,
      groupBy: widget.groupBy,
      filters: widget.filters,
      colors: widget.colors,
      thresholds: widget.thresholds,
      limit: widget.limit
    },
    position: {
      x: widget.position.x,
      y: widget.position.y,
      width: widget.size.width,
      height: widget.size.height
    },
    is_visible: true,
    created_by_max: false,
    session_id: sessionId,
    user_id: userId
  };
}

function mapCockpitTypeToUniversalType(cockpitType: string): WidgetConfig['type'] {
  switch (cockpitType) {
    case 'metrics':
    case 'kpi':
      return 'kpi';
    case 'chart':
      return 'chart';
    case 'alerts':
      return 'alert';
    case 'schedule':
    case 'production':
      return 'table';
    case 'resources':
      return 'gauge';
    case 'activity':
      return 'list';
    case 'schedule-optimization':
      return 'schedule-optimization';
    default:
      return 'kpi';
  }
}

function mapUniversalTypeToCockpitType(universalType: WidgetConfig['type']): string {
  switch (universalType) {
    case 'kpi':
      return 'kpi';
    case 'chart':
      return 'chart';
    case 'alert':
      return 'alerts';
    case 'table':
      return 'schedule';
    case 'gauge':
      return 'resources';
    case 'list':
      return 'activity';
    case 'progress':
      return 'metrics';
    case 'timeline':
      return 'schedule';
    case 'schedule-optimization':
      return 'schedule-optimization';
    default:
      return 'kpi';
  }
}