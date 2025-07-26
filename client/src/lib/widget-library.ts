// Chart.js components will be imported in the widget renderer component
// This file focuses on data processing and configuration

export interface WidgetConfig {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'alert' | 'progress' | 'gauge' | 'list';
  title: string;
  subtitle?: string;
  dataSource: string;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  groupBy?: string;
  filters?: {
    status?: string[];
    priority?: string[];
    dateRange?: { start: string; end: string };
    resourceTypes?: string[];
  };
  thresholds?: Array<{ value: number; color: string; label?: string }>;
  colors?: string[];
  refreshInterval?: number;
  size?: { width: number; height: number };
  position?: { x: number; y: number };
}

export interface SystemData {
  jobs: any[];
  operations: any[];
  resources: any[];
  capabilities: any[];
  metrics: any;
  alerts: any[];
}

export class WidgetDataProcessor {
  private data: SystemData;

  constructor(data: SystemData) {
    this.data = data;
  }

  // Process data based on widget configuration
  processWidgetData(config: WidgetConfig): any {
    switch (config.dataSource) {
      case 'jobs':
        return this.processJobsData(config);
      case 'operations':
        return this.processOperationsData(config);
      case 'resources':
        return this.processResourcesData(config);
      case 'metrics':
        return this.processMetricsData(config);
      case 'alerts':
        return this.processAlertsData(config);
      default:
        return null;
    }
  }

  private processJobsData(config: WidgetConfig): any {
    let jobs = [...this.data.jobs];

    // Apply filters
    if (config.filters?.status?.length) {
      jobs = jobs.filter(job => config.filters!.status!.includes(job.status));
    }
    if (config.filters?.priority?.length) {
      jobs = jobs.filter(job => config.filters!.priority!.includes(job.priority));
    }

    switch (config.type) {
      case 'kpi':
        return this.generateKPIData(jobs, config);
      case 'chart':
        return this.generateChartData(jobs, config);
      case 'table':
        return this.generateTableData(jobs, config);
      case 'list':
        return this.generateListData(jobs, config);
      default:
        return { value: jobs.length, label: config.title };
    }
  }

  private processOperationsData(config: WidgetConfig): any {
    let operations = [...this.data.operations];

    // Apply filters
    if (config.filters?.status?.length) {
      operations = operations.filter(op => config.filters!.status!.includes(op.status));
    }

    switch (config.type) {
      case 'kpi':
        return this.generateKPIData(operations, config);
      case 'chart':
        return this.generateChartData(operations, config);
      case 'table':
        return this.generateTableData(operations, config);
      case 'progress':
        return this.generateProgressData(operations, config);
      default:
        return { value: operations.length, label: config.title };
    }
  }

  private processResourcesData(config: WidgetConfig): any {
    let resources = [...this.data.resources];

    // Apply filters
    if (config.filters?.resourceTypes?.length) {
      resources = resources.filter(res => config.filters!.resourceTypes!.includes(res.type));
    }

    switch (config.type) {
      case 'kpi':
        return this.generateKPIData(resources, config);
      case 'chart':
        return this.generateChartData(resources, config);
      case 'table':
        return this.generateTableData(resources, config);
      case 'gauge':
        return this.generateGaugeData(resources, config);
      default:
        return { value: resources.length, label: config.title };
    }
  }

  private processMetricsData(config: WidgetConfig): any {
    const metrics = this.data.metrics || {};
    
    switch (config.type) {
      case 'kpi':
        return {
          value: metrics[config.groupBy || 'totalJobs'] || 0,
          label: config.title,
          change: this.calculateChange(metrics[config.groupBy || 'totalJobs']),
          trend: 'up'
        };
      case 'gauge':
        return {
          value: metrics.utilization || 0,
          max: 100,
          label: config.title,
          thresholds: config.thresholds || [
            { value: 30, color: '#ef4444', label: 'Low' },
            { value: 70, color: '#f59e0b', label: 'Medium' },
            { value: 90, color: '#10b981', label: 'High' }
          ]
        };
      default:
        return metrics;
    }
  }

  private processAlertsData(config: WidgetConfig): any {
    let alerts = [...this.data.alerts];

    switch (config.type) {
      case 'alert':
      case 'list':
        return {
          items: alerts.slice(0, 10),
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length
        };
      case 'kpi':
        return {
          value: alerts.length,
          label: config.title,
          critical: alerts.filter(a => a.severity === 'critical').length
        };
      default:
        return alerts;
    }
  }

  private generateKPIData(items: any[], config: WidgetConfig): any {
    let value: number;
    
    switch (config.aggregation) {
      case 'sum':
        value = items.reduce((sum, item) => sum + (item[config.groupBy || 'value'] || 0), 0);
        break;
      case 'avg':
        value = items.length > 0 ? 
          items.reduce((sum, item) => sum + (item[config.groupBy || 'value'] || 0), 0) / items.length : 0;
        break;
      case 'max':
        value = Math.max(...items.map(item => item[config.groupBy || 'value'] || 0));
        break;
      case 'min':
        value = Math.min(...items.map(item => item[config.groupBy || 'value'] || 0));
        break;
      case 'count':
      default:
        value = items.length;
        break;
    }

    return {
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      label: config.title,
      change: this.calculateChange(value),
      trend: Math.random() > 0.5 ? 'up' : 'down', // In real implementation, this would be calculated from historical data
      items: items.slice(0, 5) // Recent items for context
    };
  }

  private generateChartData(items: any[], config: WidgetConfig): any {
    const groupField = config.groupBy || 'status';
    const grouped = items.reduce((acc, item) => {
      const key = item[groupField] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);
    const colors = config.colors || [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ];

    switch (config.chartType) {
      case 'pie':
      case 'doughnut':
        return {
          labels,
          datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
      case 'line':
        return {
          labels,
          datasets: [{
            label: config.title,
            data,
            borderColor: colors[0],
            backgroundColor: colors[0] + '20',
            fill: false,
            tension: 0.4
          }]
        };
      case 'bar':
      default:
        return {
          labels,
          datasets: [{
            label: config.title,
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1,
            borderRadius: 4
          }]
        };
    }
  }

  private generateTableData(items: any[], config: WidgetConfig): any {
    const columns = this.getColumnsForDataSource(config.dataSource);
    const rows = items.slice(0, 10).map(item => {
      const row: any = {};
      columns.forEach(col => {
        row[col.key] = item[col.key] || '-';
      });
      return row;
    });

    return {
      columns,
      rows,
      total: items.length
    };
  }

  private generateListData(items: any[], config: WidgetConfig): any {
    return {
      items: items.slice(0, 8).map(item => ({
        id: item.id,
        title: item.name || item.title || `Item ${item.id}`,
        subtitle: item.status || item.type || '',
        status: item.status,
        priority: item.priority,
        metadata: item
      })),
      total: items.length
    };
  }

  private generateProgressData(operations: any[], config: WidgetConfig): any {
    const completed = operations.filter(op => op.status === 'completed').length;
    const total = operations.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      value: percentage,
      completed,
      total,
      label: config.title
    };
  }

  private generateGaugeData(resources: any[], config: WidgetConfig): any {
    const available = resources.filter(res => res.status === 'available').length;
    const total = resources.length;
    const utilization = total > 0 ? (available / total) * 100 : 0;

    return {
      value: utilization,
      max: 100,
      label: config.title,
      available,
      total,
      thresholds: config.thresholds || [
        { value: 30, color: '#ef4444', label: 'Low' },
        { value: 70, color: '#f59e0b', label: 'Medium' },
        { value: 90, color: '#10b981', label: 'High' }
      ]
    };
  }

  private getColumnsForDataSource(dataSource: string): Array<{ key: string; label: string }> {
    switch (dataSource) {
      case 'jobs':
        return [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Job Name' },
          { key: 'status', label: 'Status' },
          { key: 'priority', label: 'Priority' },
          { key: 'dueDate', label: 'Due Date' }
        ];
      case 'operations':
        return [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Operation' },
          { key: 'status', label: 'Status' },
          { key: 'duration', label: 'Duration' },
          { key: 'assignedResource', label: 'Resource' }
        ];
      case 'resources':
        return [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Resource' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status' },
          { key: 'utilization', label: 'Utilization' }
        ];
      default:
        return [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' }
        ];
    }
  }

  private calculateChange(value: number): string {
    // In a real implementation, this would compare with historical data
    const change = Math.random() * 20 - 10; // Random change between -10 and +10
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }
}

// Predefined widget templates
export const WIDGET_TEMPLATES: WidgetConfig[] = [
  {
    id: 'jobs-overview-kpi',
    type: 'kpi',
    title: 'Total Active Jobs',
    dataSource: 'jobs',
    aggregation: 'count',
    filters: { status: ['active', 'in-progress'] }
  },
  {
    id: 'jobs-by-status-chart',
    type: 'chart',
    title: 'Jobs by Status',
    dataSource: 'jobs',
    chartType: 'pie',
    groupBy: 'status'
  },
  {
    id: 'operations-progress',
    type: 'progress',
    title: 'Operations Completion',
    dataSource: 'operations',
    groupBy: 'status'
  },
  {
    id: 'resource-utilization-gauge',
    type: 'gauge',
    title: 'Resource Utilization',
    dataSource: 'resources',
    groupBy: 'utilization'
  },
  {
    id: 'critical-alerts',
    type: 'alert',
    title: 'Critical Alerts',
    dataSource: 'alerts',
    filters: { status: ['critical', 'high'] }
  },
  {
    id: 'recent-jobs-table',
    type: 'table',
    title: 'Recent Jobs',
    dataSource: 'jobs'
  },
  {
    id: 'operations-by-resource-chart',
    type: 'chart',
    title: 'Operations by Resource',
    dataSource: 'operations',
    chartType: 'bar',
    groupBy: 'assignedResource'
  },
  {
    id: 'job-priorities-list',
    type: 'list',
    title: 'High Priority Jobs',
    dataSource: 'jobs',
    filters: { priority: ['high', 'critical'] }
  }
];

export default WidgetDataProcessor;