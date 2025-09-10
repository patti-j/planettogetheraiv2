// Analytics Reporting Module with Database Integration
import type { 
  AnalyticsReportingContract,
  KPIMetric,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';

class AnalyticsReportingModule implements AnalyticsReportingContract {
  private name = 'analytics-reporting';
  private metricCallbacks = new Map<string, Array<(metrics: KPIMetric[]) => void>>();
  private metricsPollingInterval: NodeJS.Timeout | null = null;
  private lastMetricsHash: string = '';
  // Store dashboards in memory (since no dashboard tables exist)
  private dashboards: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    console.log('[AnalyticsReporting] Module initializing...');
    
    // Check database connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error('[AnalyticsReporting] Database connection failed');
      throw new Error('Failed to connect to database');
    }
    
    console.log('[AnalyticsReporting] Database connected successfully');
    
    // Start polling for metrics updates
    this.startMetricsPolling();
    
    console.log('[AnalyticsReporting] Module initialized');
  }

  async destroy(): Promise<void> {
    console.log('[AnalyticsReporting] Module destroying...');
    
    // Stop polling
    if (this.metricsPollingInterval) {
      clearInterval(this.metricsPollingInterval);
      this.metricsPollingInterval = null;
    }
    
    this.metricCallbacks.clear();
    this.dashboards.clear();
    console.log('[AnalyticsReporting] Module destroyed');
  }

  // KPI Management
  async getKPIs(category?: string, plantId?: number): Promise<ApiResponse<KPIMetric[]>> {
    try {
      const metrics: KPIMetric[] = [];
      
      // Production KPIs
      if (!category || category === 'production') {
        const productionMetrics = await this.calculateProductionKPIs(plantId);
        metrics.push(...productionMetrics);
      }
      
      // Utilization KPIs
      if (!category || category === 'utilization') {
        const utilizationMetrics = await this.calculateUtilizationKPIs(plantId);
        metrics.push(...utilizationMetrics);
      }
      
      // Performance KPIs
      if (!category || category === 'performance') {
        const performanceMetrics = await this.calculatePerformanceKPIs(plantId);
        metrics.push(...performanceMetrics);
      }
      
      // Quality KPIs (if quality module provides data)
      if (!category || category === 'quality') {
        const qualityMetrics = await this.calculateQualityKPIs(plantId);
        metrics.push(...qualityMetrics);
      }
      
      return { success: true, data: metrics };
    } catch (error) {
      console.error('[AnalyticsReporting] Error fetching KPIs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch KPIs' 
      };
    }
  }

  async calculateKPI(kpiId: string, parameters: any): Promise<ApiResponse<KPIMetric>> {
    try {
      let metric: KPIMetric | null = null;
      
      switch (kpiId) {
        case 'oee':
          metric = await this.calculateOEE(parameters.plantId, parameters.resourceId);
          break;
        case 'cycle-time':
          metric = await this.calculateCycleTime(parameters.plantId);
          break;
        case 'throughput':
          metric = await this.calculateThroughput(parameters.plantId);
          break;
        case 'on-time-delivery':
          metric = await this.calculateOnTimeDelivery(parameters.plantId);
          break;
        default:
          return { success: false, error: `Unknown KPI: ${kpiId}` };
      }
      
      return { success: true, data: metric };
    } catch (error) {
      console.error('[AnalyticsReporting] Error calculating KPI:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to calculate KPI' 
      };
    }
  }

  // Dashboard Management
  async getDashboards(userId: number): Promise<ApiResponse<any[]>> {
    try {
      const userDashboards = Array.from(this.dashboards.values())
        .filter(d => d.userId === userId);
      
      return { success: true, data: userDashboards };
    } catch (error) {
      console.error('[AnalyticsReporting] Error fetching dashboards:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboards' 
      };
    }
  }

  async createDashboard(dashboard: any): Promise<ApiResponse<any>> {
    try {
      const id = `dashboard-${Date.now()}`;
      const newDashboard = {
        ...dashboard,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.dashboards.set(id, newDashboard);
      
      return { success: true, data: newDashboard };
    } catch (error) {
      console.error('[AnalyticsReporting] Error creating dashboard:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create dashboard' 
      };
    }
  }

  async updateDashboard(dashboardId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      
      if (!dashboard) {
        return { success: false, error: 'Dashboard not found' };
      }
      
      const updatedDashboard = {
        ...dashboard,
        ...updates,
        updatedAt: new Date()
      };
      
      this.dashboards.set(dashboardId, updatedDashboard);
      
      return { success: true, data: updatedDashboard };
    } catch (error) {
      console.error('[AnalyticsReporting] Error updating dashboard:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update dashboard' 
      };
    }
  }

  // Report Generation
  async generateReport(reportType: string, parameters: any): Promise<ApiResponse<any>> {
    try {
      let reportData: any = {};
      
      switch (reportType) {
        case 'production-summary':
          reportData = await this.generateProductionSummary(parameters);
          break;
        case 'resource-utilization':
          reportData = await this.generateResourceUtilization(parameters);
          break;
        case 'performance-analysis':
          reportData = await this.generatePerformanceAnalysis(parameters);
          break;
        case 'kpi-dashboard':
          const kpis = await this.getKPIs(undefined, parameters.plantId);
          reportData = {
            kpis: kpis.data,
            generatedAt: new Date(),
            parameters
          };
          break;
        default:
          return { success: false, error: `Unknown report type: ${reportType}` };
      }
      
      const report = {
        id: `report-${Date.now()}`,
        type: reportType,
        data: reportData,
        parameters,
        generatedAt: new Date()
      };
      
      return { success: true, data: report };
    } catch (error) {
      console.error('[AnalyticsReporting] Error generating report:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate report' 
      };
    }
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<ApiResponse<string>> {
    // For now, return a mock URL
    return { 
      success: true, 
      data: `/exports/${reportId}.${format}` 
    };
  }

  // Real-time Analytics
  subscribeToMetricUpdates(metricIds: string[], callback: (metrics: KPIMetric[]) => void): () => void {
    const key = metricIds.join(',');
    if (!this.metricCallbacks.has(key)) {
      this.metricCallbacks.set(key, []);
    }
    this.metricCallbacks.get(key)!.push(callback);
    
    return () => {
      const callbacks = this.metricCallbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  async getRealtimeData(dataType: string, filters: any): Promise<ApiResponse<any>> {
    try {
      switch (dataType) {
        case 'throughput':
          const operations = await ptTables.getJobOperations({
            plantId: filters.plantId,
            status: 'completed',
            dateRange: {
              start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
              end: new Date()
            }
          });
          return { 
            success: true, 
            data: { 
              count: operations.length,
              timestamp: new Date()
            }
          };
        
        case 'active-operations':
          const activeOps = await ptTables.getJobOperations({
            plantId: filters.plantId,
            status: 'in_progress'
          });
          return { 
            success: true, 
            data: { 
              count: activeOps.length,
              operations: activeOps,
              timestamp: new Date()
            }
          };
        
        default:
          return { success: true, data: {} };
      }
    } catch (error) {
      console.error('[AnalyticsReporting] Error fetching realtime data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch realtime data' 
      };
    }
  }

  // Private calculation methods
  private async calculateProductionKPIs(plantId?: number): Promise<KPIMetric[]> {
    const orders = await ptTables.getManufacturingOrders({ plantId });
    const operations = await ptTables.getJobOperations({ plantId });
    
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalOrders = orders.length;
    const completedOps = operations.filter(o => o.status === 'completed').length;
    const totalOps = operations.length;
    
    return [
      {
        id: 'order-completion-rate',
        name: 'Order Completion Rate',
        value: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        unit: '%',
        target: 95,
        trend: 'up',
        category: 'production',
        timestamp: new Date()
      },
      {
        id: 'operation-completion-rate',
        name: 'Operation Completion Rate',
        value: totalOps > 0 ? (completedOps / totalOps) * 100 : 0,
        unit: '%',
        target: 98,
        trend: 'stable',
        category: 'production',
        timestamp: new Date()
      },
      {
        id: 'wip-count',
        name: 'Work In Progress',
        value: operations.filter(o => o.status === 'in_progress').length,
        unit: 'operations',
        target: 50,
        trend: 'down',
        category: 'production',
        timestamp: new Date()
      }
    ];
  }

  private async calculateUtilizationKPIs(plantId?: number): Promise<KPIMetric[]> {
    const resources = await ptTables.getResources(plantId);
    const metrics: KPIMetric[] = [];
    
    // Calculate average utilization
    let totalUtilization = 0;
    let resourceCount = 0;
    
    for (const resource of resources) {
      const utilization = await ptTables.getResourceUtilization(resource.id, {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      });
      
      totalUtilization += utilization.utilization;
      resourceCount++;
    }
    
    metrics.push({
      id: 'avg-resource-utilization',
      name: 'Average Resource Utilization',
      value: resourceCount > 0 ? totalUtilization / resourceCount : 0,
      unit: '%',
      target: 85,
      trend: 'up',
      category: 'utilization',
      timestamp: new Date()
    });
    
    // Identify bottlenecks
    const bottlenecks = resources.filter(r => r.bottleneck === true);
    metrics.push({
      id: 'bottleneck-count',
      name: 'Active Bottlenecks',
      value: bottlenecks.length,
      unit: 'resources',
      target: 0,
      trend: 'stable',
      category: 'utilization',
      timestamp: new Date()
    });
    
    return metrics;
  }

  private async calculatePerformanceKPIs(plantId?: number): Promise<KPIMetric[]> {
    const operations = await ptTables.getJobOperations({ 
      plantId,
      status: 'completed' 
    });
    
    // Calculate average cycle time
    let totalCycleTime = 0;
    let cycleTimeCount = 0;
    
    operations.forEach(op => {
      if (op.actualStartDate && op.actualEndDate) {
        const cycleTime = op.actualEndDate.getTime() - op.actualStartDate.getTime();
        totalCycleTime += cycleTime;
        cycleTimeCount++;
      }
    });
    
    const avgCycleTime = cycleTimeCount > 0 
      ? totalCycleTime / cycleTimeCount / (1000 * 60) // Convert to minutes
      : 0;
    
    return [
      {
        id: 'avg-cycle-time',
        name: 'Average Cycle Time',
        value: Math.round(avgCycleTime),
        unit: 'minutes',
        target: 60,
        trend: 'down',
        category: 'performance',
        timestamp: new Date()
      },
      {
        id: 'operations-per-hour',
        name: 'Operations Per Hour',
        value: avgCycleTime > 0 ? Math.round(60 / avgCycleTime) : 0,
        unit: 'ops/hr',
        target: 10,
        trend: 'up',
        category: 'performance',
        timestamp: new Date()
      }
    ];
  }

  private async calculateQualityKPIs(plantId?: number): Promise<KPIMetric[]> {
    // Basic quality metrics (would integrate with Quality Management module)
    return [
      {
        id: 'first-pass-yield',
        name: 'First Pass Yield',
        value: 98.5, // Mock value
        unit: '%',
        target: 99,
        trend: 'stable',
        category: 'quality',
        timestamp: new Date()
      },
      {
        id: 'defect-rate',
        name: 'Defect Rate',
        value: 1.5, // Mock value
        unit: '%',
        target: 1,
        trend: 'down',
        category: 'quality',
        timestamp: new Date()
      }
    ];
  }

  private async calculateOEE(plantId?: number, resourceId?: number): Promise<KPIMetric> {
    // OEE = Availability × Performance × Quality
    const availability = 0.90; // Mock
    const performance = 0.95; // Mock
    const quality = 0.985; // Mock
    
    return {
      id: 'oee',
      name: 'Overall Equipment Effectiveness',
      value: Math.round(availability * performance * quality * 100),
      unit: '%',
      target: 85,
      trend: 'up',
      category: 'performance',
      timestamp: new Date()
    };
  }

  private async calculateCycleTime(plantId?: number): Promise<KPIMetric> {
    const operations = await ptTables.getJobOperations({ 
      plantId,
      status: 'completed' 
    });
    
    let totalTime = 0;
    let count = 0;
    
    operations.forEach(op => {
      if (op.processTime) {
        totalTime += op.processTime;
        count++;
      }
    });
    
    return {
      id: 'cycle-time',
      name: 'Average Cycle Time',
      value: count > 0 ? Math.round(totalTime / count) : 0,
      unit: 'minutes',
      target: 45,
      trend: 'stable',
      category: 'performance',
      timestamp: new Date()
    };
  }

  private async calculateThroughput(plantId?: number): Promise<KPIMetric> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const operations = await ptTables.getJobOperations({
      plantId,
      status: 'completed',
      dateRange: {
        start: oneHourAgo,
        end: new Date()
      }
    });
    
    return {
      id: 'throughput',
      name: 'Hourly Throughput',
      value: operations.length,
      unit: 'units/hr',
      target: 100,
      trend: 'up',
      category: 'production',
      timestamp: new Date()
    };
  }

  private async calculateOnTimeDelivery(plantId?: number): Promise<KPIMetric> {
    const orders = await ptTables.getManufacturingOrders({ 
      plantId,
      status: 'completed' 
    });
    
    let onTimeCount = 0;
    
    orders.forEach(order => {
      if (order.actualEndDate && order.dueDate) {
        if (order.actualEndDate <= order.dueDate) {
          onTimeCount++;
        }
      }
    });
    
    return {
      id: 'on-time-delivery',
      name: 'On-Time Delivery',
      value: orders.length > 0 ? (onTimeCount / orders.length) * 100 : 100,
      unit: '%',
      target: 95,
      trend: 'stable',
      category: 'performance',
      timestamp: new Date()
    };
  }

  private async generateProductionSummary(parameters: any): Promise<any> {
    const orders = await ptTables.getManufacturingOrders({ plantId: parameters.plantId });
    const operations = await ptTables.getJobOperations({ plantId: parameters.plantId });
    
    return {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
      totalOperations: operations.length,
      completedOperations: operations.filter(o => o.status === 'completed').length,
      inProgressOperations: operations.filter(o => o.status === 'in_progress').length,
      dateRange: parameters.dateRange,
      generatedAt: new Date()
    };
  }

  private async generateResourceUtilization(parameters: any): Promise<any> {
    const resources = await ptTables.getResources(parameters.plantId);
    const utilizationData = [];
    
    for (const resource of resources) {
      const utilization = await ptTables.getResourceUtilization(resource.id, {
        start: new Date(parameters.dateRange.start),
        end: new Date(parameters.dateRange.end)
      });
      
      utilizationData.push({
        resourceId: resource.id,
        resourceName: resource.name,
        utilization: utilization.utilization,
        operations: utilization.operations.length,
        isBottleneck: resource.bottleneck
      });
    }
    
    return {
      resources: utilizationData,
      avgUtilization: utilizationData.reduce((sum, r) => sum + r.utilization, 0) / utilizationData.length,
      dateRange: parameters.dateRange,
      generatedAt: new Date()
    };
  }

  private async generatePerformanceAnalysis(parameters: any): Promise<any> {
    const kpis = await this.getKPIs('performance', parameters.plantId);
    const oee = await this.calculateOEE(parameters.plantId);
    const cycleTime = await this.calculateCycleTime(parameters.plantId);
    const throughput = await this.calculateThroughput(parameters.plantId);
    
    return {
      kpis: kpis.data,
      oee,
      cycleTime,
      throughput,
      dateRange: parameters.dateRange,
      generatedAt: new Date()
    };
  }

  private startMetricsPolling() {
    // Poll for metrics updates every 30 seconds
    this.metricsPollingInterval = setInterval(async () => {
      try {
        const metrics = await this.getKPIs();
        const metricsHash = JSON.stringify(metrics.data?.map(m => `${m.id}-${m.value}`));
        
        if (metricsHash !== this.lastMetricsHash) {
          this.lastMetricsHash = metricsHash;
          this.notifyMetricSubscribers(metrics.data || []);
        }
      } catch (error) {
        console.error('[AnalyticsReporting] Polling error:', error);
      }
    }, 30000);
  }

  private notifyMetricSubscribers(metrics: KPIMetric[]) {
    this.metricCallbacks.forEach((callbacks, key) => {
      const metricIds = key.split(',');
      const filteredMetrics = metrics.filter(m => metricIds.includes(m.id));
      
      callbacks.forEach(callback => {
        try {
          callback(filteredMetrics);
        } catch (error) {
          console.error('[AnalyticsReporting] Error in metric callback:', error);
        }
      });
    });
  }
}

// Export singleton instance
export const analyticsReportingModule = new AnalyticsReportingModule();
export default analyticsReportingModule;