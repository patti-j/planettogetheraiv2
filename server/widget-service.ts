import { DatabaseStorage } from "./storage";
import { z } from "zod";

// Widget configuration schemas for validation
export const widgetConfigSchemas = {
  'production-order-status': z.object({
    showMetrics: z.boolean().default(true),
    refreshInterval: z.number().min(1000).default(30000),
    maxItems: z.number().min(1).max(100).default(20)
  }),
  'operation-sequencer': z.object({
    isDesktop: z.boolean().optional(),
    maxItems: z.number().min(1).max(100).default(20),
    view: z.enum(['list', 'grid']).default('list')
  }),
  'atp-ctp': z.object({
    compact: z.boolean().default(false),
    showDetails: z.boolean().default(true),
    view: z.enum(['compact', 'full']).default('full')
  }),
  'reports': z.object({
    reportTypes: z.array(z.string()).default(['production', 'quality']),
    timeRange: z.enum(['daily', 'weekly', 'monthly']).default('daily')
  }),
  'schedule-tradeoff-analyzer': z.object({
    showOptimizer: z.boolean().default(true),
    analysisDepth: z.enum(['basic', 'advanced']).default('basic')
  }),
  'schedule-optimizer': z.object({
    showOptimizer: z.boolean().default(true),
    optimizationLevel: z.enum(['fast', 'balanced', 'thorough']).default('balanced')
  }),
  'operation-dispatch': z.object({
    isMobile: z.boolean().optional(),
    compact: z.boolean().default(false),
    showActions: z.boolean().default(true)
  }),
  'resource-assignment': z.object({
    isMobile: z.boolean().optional(),
    compact: z.boolean().default(false),
    showDetails: z.boolean().default(true)
  }),
  'sales-order-status': z.object({
    showTimeline: z.boolean().default(true),
    groupBy: z.enum(['status', 'priority', 'date']).default('status')
  })
};

// Widget registry with component metadata
export const WIDGET_REGISTRY = {
  'production-order-status': {
    title: 'Production Order Status',
    category: 'production',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['configuration'],
    configSchema: widgetConfigSchemas['production-order-status']
  },
  'operation-sequencer': {
    title: 'Operation Sequencer',
    category: 'scheduling',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['isDesktop'],
    configSchema: widgetConfigSchemas['operation-sequencer']
  },
  'atp-ctp': {
    title: 'ATP/CTP Calculator',
    category: 'planning',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['compact'],
    configSchema: widgetConfigSchemas['atp-ctp']
  },
  'reports': {
    title: 'Reports Widget',
    category: 'analytics',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['configuration'],
    configSchema: widgetConfigSchemas['reports']
  },
  'schedule-tradeoff-analyzer': {
    title: 'Schedule Tradeoff Analyzer',
    category: 'scheduling',
    platforms: ['desktop'],
    requiredProps: ['showOptimizer'],
    configSchema: widgetConfigSchemas['schedule-tradeoff-analyzer']
  },
  'schedule-optimizer': {
    title: 'Schedule Optimizer',
    category: 'scheduling',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['showOptimizer'],
    configSchema: widgetConfigSchemas['schedule-optimizer']
  },
  'operation-dispatch': {
    title: 'Operation Dispatch',
    category: 'operations',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['isMobile', 'compact'],
    configSchema: widgetConfigSchemas['operation-dispatch']
  },
  'resource-assignment': {
    title: 'Resource Assignment',
    category: 'resources',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['isMobile', 'compact'],
    configSchema: widgetConfigSchemas['resource-assignment']
  },
  'sales-order-status': {
    title: 'Sales Order Status',
    category: 'sales',
    platforms: ['mobile', 'desktop'],
    requiredProps: ['showTimeline'],
    configSchema: widgetConfigSchemas['sales-order-status']
  }
};

export class WidgetService {
  constructor(private storage: DatabaseStorage) {}

  // Validate widget configuration against schema
  validateWidgetConfig(widgetType: string, configuration: any): any {
    const schema = widgetConfigSchemas[widgetType as keyof typeof widgetConfigSchemas];
    if (!schema) {
      console.warn(`No validation schema found for widget type: ${widgetType}`);
      return configuration;
    }
    
    try {
      return schema.parse(configuration);
    } catch (error) {
      console.error(`Widget config validation failed for ${widgetType}:`, error);
      // Return default configuration for the widget type
      return schema.parse({});
    }
  }

  // Check if widget is supported on given platform
  isWidgetSupportedOnPlatform(widgetType: string, platform: 'mobile' | 'desktop'): boolean {
    const widget = WIDGET_REGISTRY[widgetType as keyof typeof WIDGET_REGISTRY];
    if (!widget) return false;
    
    return widget.platforms.includes(platform) || widget.platforms.includes('both' as any);
  }

  // Get widget component props based on platform and configuration
  getWidgetProps(widgetType: string, configuration: any, platform: 'mobile' | 'desktop'): any {
    const validatedConfig = this.validateWidgetConfig(widgetType, configuration);
    const isMobileTarget = platform === 'mobile';
    
    const baseProps = {
      configuration: validatedConfig,
      className: "w-full"
    };

    switch (widgetType) {
      case 'operation-sequencer':
        return { 
          ...baseProps, 
          isDesktop: !isMobileTarget
        };
      
      case 'atp-ctp':
        return { 
          ...baseProps, 
          compact: validatedConfig.compact || isMobileTarget
        };
      
      case 'operation-dispatch':
      case 'resource-assignment':
        return { 
          ...baseProps, 
          isMobile: isMobileTarget,
          compact: validatedConfig.compact || isMobileTarget
        };
      
      default:
        return {
          ...baseProps,
          isMobile: isMobileTarget,
          compact: isMobileTarget || validatedConfig.compact
        };
    }
  }

  // Get all available widget types
  getAvailableWidgetTypes(): string[] {
    return Object.keys(WIDGET_REGISTRY);
  }

  // Get widget metadata
  getWidgetMetadata(widgetType: string) {
    return WIDGET_REGISTRY[widgetType as keyof typeof WIDGET_REGISTRY];
  }
}