import { z } from "zod";

// Configuration schemas for validation
const commonConfigSchema = z.object({
  refreshInterval: z.number().optional(),
  showHeader: z.boolean().optional(),
  compact: z.boolean().optional()
});
import OperationSequencerWidget from "@/components/widgets/operation-sequencer-widget";
import AtpCtpWidget from "@/components/widgets/atp-ctp-widget";
import { SalesOrderStatusWidget } from "@/components/widgets/sales-order-status-widget";
import ReportsWidget from "@/components/widgets/reports-widget";
import ScheduleTradeoffAnalyzerWidget from "@/components/widgets/schedule-tradeoff-analyzer-widget";
import ScheduleOptimizationWidget from "@/components/schedule-optimization-widget";
import ProductionOrderStatusWidget from "@/components/widgets/production-order-status-widget";
import OperationDispatchWidget from "@/components/widgets/operation-dispatch-widget";
import ResourceAssignmentWidget from "@/components/widgets/resource-assignment-widget";
import EquipmentStatusWidget from "@/components/widgets/equipment-status-widget";
import QualityDashboardWidget from "@/components/widgets/quality-dashboard-widget";
import InventoryTrackingWidget from "@/components/widgets/inventory-tracking-widget";
import ProductionMetricsWidget from "@/components/widgets/production-metrics-widget";
import GanttChartWidget from "@/components/widgets/gantt-chart-widget";
import GanttWidget from "@/components/widgets/gantt-widget";
// Common utility widgets
import FilterSearchWidget from "@/components/widgets/common/filter-search-widget";
import StatusIndicatorWidget from "@/components/widgets/common/status-indicator-widget";
import MetricsCardWidget from "@/components/widgets/common/metrics-card-widget";
import DataTableWidget from "@/components/widgets/common/data-table-widget";
import ActionButtonsWidget from "@/components/widgets/common/action-buttons-widget";
import KanbanCardWidget from "@/components/widgets/common/kanban-card-widget";
import CustomKPIWidget from "@/components/widgets/custom-kpi-widget";

// Standardized widget interface
export interface StandardWidgetProps {
  id?: string;
  title?: string;
  configuration?: Record<string, any>;
  platform?: 'mobile' | 'desktop' | 'both';
  className?: string;
  onError?: (error: Error) => void;
  [key: string]: any; // Allow additional props for backward compatibility
}

// Widget size categories
export type WidgetSizeCategory = 'compact' | 'medium' | 'large' | 'extra-large';

// Widget bar compatibility
export interface WidgetBarCompatibility {
  supported: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  preferredSize?: WidgetSizeCategory;
}

// Widget metadata interface
export interface WidgetMetadata {
  component: React.ComponentType<StandardWidgetProps>;
  displayName: string;
  description: string;
  supportedPlatforms: ('mobile' | 'desktop' | 'both')[];
  sizeCategory: WidgetSizeCategory;
  widgetBarCompatibility: WidgetBarCompatibility;
  configSchema?: z.ZodSchema<any>;
  defaultConfig?: Record<string, any>;
  requiredProps?: string[];
}

// Configuration schemas for each widget type
const operationSequencerConfigSchema = z.object({
  isDesktop: z.boolean().optional(),
  view: z.enum(['list', 'grid']).default('list'),
  showFilters: z.boolean().default(true)
});

const atpCtpConfigSchema = z.object({
  compact: z.boolean().default(false),
  showDetails: z.boolean().default(true),
  view: z.enum(['compact', 'expanded']).default('expanded')
});

const productionMetricsConfigSchema = z.object({
  metrics: z.array(z.string()).default(['output', 'efficiency', 'quality']),
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  showTrends: z.boolean().default(true)
});

const equipmentStatusConfigSchema = z.object({
  equipment: z.array(z.string()).default([]),
  showAlerts: z.boolean().default(true),
  refreshInterval: z.number().default(30000)
});

const qualityDashboardConfigSchema = z.object({
  tests: z.array(z.string()).default(['pH', 'temperature', 'purity']),
  showHistory: z.boolean().default(true),
  alertThresholds: z.record(z.number()).default({})
});

const inventoryTrackingConfigSchema = z.object({
  materials: z.array(z.string()).default(['raw_materials', 'wip', 'finished_goods']),
  showReorderPoints: z.boolean().default(true),
  groupBy: z.enum(['category', 'location', 'supplier']).default('category')
});

const ganttChartConfigSchema = z.object({
  view: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  resources: z.array(z.string()).default(['all']),
  showDependencies: z.boolean().default(true)
});

const customKpiConfigSchema = z.object({
  view: z.enum(['compact', 'standard', 'detailed']).default('standard'),
  showTrends: z.boolean().default(true),
  showTargets: z.boolean().default(true),
  showHistory: z.boolean().default(false),
  maxKPIs: z.number().default(6),
  allowEdit: z.boolean().default(true),
  kpis: z.array(z.string()).default(['oee', 'yield', 'cost-per-unit'])
});

const scheduleOptimizerConfigSchema = z.object({
  view: z.enum(['minimal', 'compact', 'standard']).default('standard'),
  showQuickActions: z.boolean().default(true),
  showHistory: z.boolean().default(true),
  showMetrics: z.boolean().default(true),
  maxHistoryItems: z.number().default(5),
  defaultView: z.enum(['overview', 'history', 'algorithms']).default('overview'),
  showAlgorithmSelector: z.boolean().default(true),
  showProfileSelector: z.boolean().default(true),
  minimal: z.boolean().default(false)
});

// Centralized widget registry
export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  'custom-kpi': {
    component: CustomKPIWidget,
    displayName: 'Custom KPI Tracker',
    description: 'Track custom KPIs with targets and trend analysis',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: {
      supported: true,
      minWidth: 200,
      minHeight: 100,
      maxWidth: 300,
      maxHeight: 200,
      preferredSize: 'compact'
    },
    configSchema: customKpiConfigSchema,
    defaultConfig: { 
      view: 'standard', 
      showTrends: true, 
      showTargets: true, 
      maxKPIs: 6,
      kpis: ['oee', 'yield', 'cost-per-unit'] 
    }
  },
  'operation-sequencer': {
    component: OperationSequencerWidget,
    displayName: 'Operation Sequencer',
    description: 'Manage and sequence manufacturing operations',
    supportedPlatforms: ['both'],
    sizeCategory: 'large',
    widgetBarCompatibility: {
      supported: false,
      minWidth: 400,
      minHeight: 300,
      preferredSize: 'large'
    },
    configSchema: operationSequencerConfigSchema,
    defaultConfig: { isDesktop: false, view: 'list' }
  },
  'atp-ctp': {
    component: AtpCtpWidget,
    displayName: 'ATP/CTP Calculator',
    description: 'Available-to-Promise and Capable-to-Promise calculations',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    configSchema: atpCtpConfigSchema,
    defaultConfig: { compact: false, view: 'expanded' }
  },
  'sales-order-status': {
    component: SalesOrderStatusWidget,
    displayName: 'Sales Order Status',
    description: 'Track sales order progress and status',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    defaultConfig: {}
  },
  'reports': {
    component: ReportsWidget,
    displayName: 'Reports',
    description: 'Generate and view manufacturing reports',
    supportedPlatforms: ['both'],
    sizeCategory: 'large',
    widgetBarCompatibility: { supported: false, preferredSize: 'large' },
    defaultConfig: {}
  },
  'schedule-tradeoff-analyzer': {
    component: ScheduleTradeoffAnalyzerWidget,
    displayName: 'Schedule Tradeoff Analyzer',
    description: 'Analyze scheduling tradeoffs and optimize production',
    supportedPlatforms: ['desktop'],
    sizeCategory: 'extra-large',
    widgetBarCompatibility: { supported: false, preferredSize: 'extra-large' },
    defaultConfig: {}
  },
  'schedule-optimizer': {
    component: ScheduleOptimizationWidget,
    displayName: 'Schedule Optimizer',
    description: 'Optimize production schedules using AI',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: {
      supported: true,
      minWidth: 220,
      minHeight: 120,
      maxWidth: 300,
      maxHeight: 180,
      preferredSize: 'compact'
    },
    configSchema: scheduleOptimizerConfigSchema,
    defaultConfig: { 
      view: 'standard',
      showOptimizer: true,
      showQuickActions: true,
      showHistory: true,
      minimal: false
    }
  },
  'production-order-status': {
    component: ProductionOrderStatusWidget,
    displayName: 'Production Order Status',
    description: 'Monitor production order progress',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: {
      supported: true,
      minWidth: 250,
      minHeight: 150,
      maxWidth: 350,
      maxHeight: 220,
      preferredSize: 'medium'
    },
    defaultConfig: {}
  },
  'operation-dispatch': {
    component: OperationDispatchWidget,
    displayName: 'Operation Dispatch',
    description: 'Dispatch and manage manufacturing operations',
    supportedPlatforms: ['both'],
    sizeCategory: 'large',
    widgetBarCompatibility: { supported: false, preferredSize: 'large' },
    defaultConfig: { isMobile: false, compact: false }
  },
  'resource-assignment': {
    component: ResourceAssignmentWidget,
    displayName: 'Resource Assignment',
    description: 'Assign and manage resource allocations',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    defaultConfig: { isMobile: false, compact: false }
  },
  // Map legacy API types to actual components
  'production-metrics': {
    component: ProductionOrderStatusWidget,
    displayName: 'Production Metrics',
    description: 'Monitor production performance metrics',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    configSchema: productionMetricsConfigSchema,
    defaultConfig: { metrics: ['output', 'efficiency', 'quality'] }
  },
  'equipment-status': {
    component: ResourceAssignmentWidget,
    displayName: 'Equipment Status',
    description: 'Monitor equipment status and availability',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    configSchema: equipmentStatusConfigSchema,
    defaultConfig: { equipment: [], showAlerts: true }
  },
  'quality-dashboard': {
    component: ReportsWidget,
    displayName: 'Quality Dashboard',
    description: 'Quality metrics and test results dashboard',
    supportedPlatforms: ['both'],
    sizeCategory: 'large',
    widgetBarCompatibility: { supported: false, preferredSize: 'large' },
    configSchema: qualityDashboardConfigSchema,
    defaultConfig: { tests: ['pH', 'temperature', 'purity'] }
  },
  'inventory-tracking': {
    component: ProductionOrderStatusWidget,
    displayName: 'Inventory Tracking',
    description: 'Track inventory levels and movements',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    configSchema: inventoryTrackingConfigSchema,
    defaultConfig: { materials: ['raw_materials', 'wip', 'finished_goods'] }
  },
  'gantt-chart': {
    component: GanttChartWidget,
    displayName: 'Gantt Chart',
    description: 'Visual project timeline and resource scheduling',
    supportedPlatforms: ['both'],
    sizeCategory: 'extra-large',
    widgetBarCompatibility: { supported: false, preferredSize: 'extra-large' },
    configSchema: ganttChartConfigSchema,
    defaultConfig: { view: 'weekly', isDesktop: false }
  },
  'gantt-widget': {
    component: GanttWidget,
    displayName: 'Gantt Timeline',
    description: 'Advanced Gantt chart with dependencies',
    supportedPlatforms: ['both'],
    sizeCategory: 'extra-large',
    widgetBarCompatibility: { supported: false, preferredSize: 'extra-large' },
    configSchema: ganttChartConfigSchema,
    defaultConfig: { view: 'weekly', showDependencies: true }
  },
  // Common utility widgets
  'filter-search': {
    component: FilterSearchWidget,
    displayName: 'Filter & Search',
    description: 'Search and filter interface component',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: { supported: true, minWidth: 200, maxWidth: 300, preferredSize: 'compact' },
    configSchema: commonConfigSchema,
    defaultConfig: { showFilters: true }
  },
  'status-indicator': {
    component: StatusIndicatorWidget,
    displayName: 'Status Indicator',
    description: 'Visual status badges and indicators',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: { supported: true, minWidth: 150, maxWidth: 250, preferredSize: 'compact' },
    configSchema: commonConfigSchema,
    defaultConfig: { showProgress: true }
  },
  'metrics-card': {
    component: MetricsCardWidget,
    displayName: 'Metrics Card',
    description: 'Key metrics display card',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: { supported: true, minWidth: 180, maxWidth: 280, preferredSize: 'compact' },
    configSchema: commonConfigSchema,
    defaultConfig: { showTrends: true }
  },
  'data-table': {
    component: DataTableWidget,
    displayName: 'Data Table',
    description: 'Sortable and filterable data table',
    supportedPlatforms: ['both'],
    sizeCategory: 'large',
    widgetBarCompatibility: { supported: false, preferredSize: 'large' },
    configSchema: commonConfigSchema,
    defaultConfig: { sortable: true, filterable: true }
  },
  'action-buttons': {
    component: ActionButtonsWidget,
    displayName: 'Action Buttons',
    description: 'Configurable action button groups',
    supportedPlatforms: ['both'],
    sizeCategory: 'medium',
    widgetBarCompatibility: { supported: false, preferredSize: 'medium' },
    configSchema: commonConfigSchema,
    defaultConfig: { layout: 'horizontal' }
  },
  'kanban-card': {
    component: MetricsCardWidget, // Use metrics card instead since it's compatible
    displayName: 'Kanban Card',
    description: 'Draggable cards for Kanban boards',
    supportedPlatforms: ['both'],
    sizeCategory: 'compact',
    widgetBarCompatibility: { supported: true, minWidth: 160, maxWidth: 240, preferredSize: 'compact' },
    configSchema: commonConfigSchema,
    defaultConfig: { draggable: true }
  }
};

// Utility functions
export const getWidgetComponent = (type: string): React.ComponentType<StandardWidgetProps> | null => {
  const widget = WIDGET_REGISTRY[type];
  return widget ? widget.component : null;
};

export const validateWidgetConfig = (type: string, config: any): any => {
  const widget = WIDGET_REGISTRY[type];
  if (widget?.configSchema) {
    try {
      return widget.configSchema.parse(config);
    } catch (error) {
      console.warn(`Invalid config for widget ${type}:`, error);
      return widget.defaultConfig || {};
    }
  }
  return config;
};

export const getWidgetDefaultConfig = (type: string): Record<string, any> => {
  const widget = WIDGET_REGISTRY[type];
  return widget?.defaultConfig || {};
};

export const isWidgetSupportedOnPlatform = (type: string, platform: 'mobile' | 'desktop'): boolean => {
  const widget = WIDGET_REGISTRY[type];
  if (!widget) return false;
  return widget.supportedPlatforms.includes('both') || widget.supportedPlatforms.includes(platform);
};

export const getAvailableWidgets = (platform?: 'mobile' | 'desktop'): Array<{ type: string; metadata: WidgetMetadata }> => {
  return Object.entries(WIDGET_REGISTRY)
    .filter(([type, metadata]) => !platform || isWidgetSupportedOnPlatform(type, platform))
    .map(([type, metadata]) => ({ type, metadata }));
};