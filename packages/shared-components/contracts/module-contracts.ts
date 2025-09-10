// Module API Contracts for PlanetTogether Federation

import type { 
  Job, 
  JobOperation, 
  Resource, 
  QualityInspection,
  InventoryItem,
  AgentAnalysisRequest,
  AgentAnalysisResponse,
  KPIMetric,
  PaginationRequest,
  ApiResponse
} from '../types';

// Core Platform Module Contract
export interface CorePlatformContract {
  // Authentication & Authorization
  getCurrentUser(): Promise<ApiResponse<any>>;
  getUserPermissions(userId: number): Promise<ApiResponse<string[]>>;
  
  // Plant Management
  getPlants(): Promise<ApiResponse<any[]>>;
  getPlantById(plantId: number): Promise<ApiResponse<any>>;
  
  // Navigation & Routing
  navigateTo(route: string, params?: Record<string, any>): void;
  getCurrentRoute(): string;
  
  // Theme & UI State
  getTheme(): string;
  setTheme(theme: string): void;
}

// Agent System Module Contract
export interface AgentSystemContract {
  // Agent Management
  getAvailableAgents(): Promise<ApiResponse<any[]>>;
  getCurrentAgent(): any;
  switchToAgent(agentId: string): Promise<void>;
  
  // Agent Analysis
  requestAnalysis(request: AgentAnalysisRequest): Promise<AgentAnalysisResponse>;
  getAgentCapabilities(agentId: string): Promise<ApiResponse<any[]>>;
  
  // Agent Communication
  sendMessageToAgent(agentId: string, message: string): Promise<ApiResponse<string>>;
  subscribeToAgentUpdates(callback: (update: any) => void): () => void;
}

// Production Scheduling Module Contract
export interface ProductionSchedulingContract {
  // Job Management
  getJobs(filters?: any, pagination?: PaginationRequest): Promise<ApiResponse<Job[]>>;
  getJobById(jobId: number): Promise<ApiResponse<Job>>;
  updateJob(jobId: number, updates: Partial<Job>): Promise<ApiResponse<Job>>;
  createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Job>>;
  
  // Operation Management
  getJobOperations(jobId: number): Promise<ApiResponse<JobOperation[]>>;
  updateOperation(operationId: number, updates: Partial<JobOperation>): Promise<ApiResponse<JobOperation>>;
  scheduleOperation(operationId: number, resourceId: number, startDate: Date): Promise<ApiResponse<JobOperation>>;
  
  // Resource Management
  getResources(plantId?: number): Promise<ApiResponse<Resource[]>>;
  getResourceUtilization(resourceId: number, dateRange: any): Promise<ApiResponse<any>>;
  
  // Scheduling Algorithms
  optimizeSchedule(parameters: any): Promise<ApiResponse<any>>;
  detectBottlenecks(plantId: number): Promise<ApiResponse<any[]>>;
  
  // Events
  onScheduleUpdate(callback: (schedule: any) => void): () => void;
  onJobStatusChange(callback: (job: Job) => void): () => void;
}

// Shop Floor Module Contract
export interface ShopFloorContract {
  // Real-time Operations
  getCurrentOperations(plantId: number): Promise<ApiResponse<JobOperation[]>>;
  updateOperationStatus(operationId: number, status: string): Promise<ApiResponse<JobOperation>>;
  reportProgress(operationId: number, percentComplete: number): Promise<ApiResponse<void>>;
  
  // Equipment Monitoring
  getEquipmentStatus(plantId: number): Promise<ApiResponse<any[]>>;
  reportEquipmentIssue(resourceId: number, issue: any): Promise<ApiResponse<void>>;
  
  // Operator Interface
  getOperatorTasks(operatorId: string): Promise<ApiResponse<any[]>>;
  completeTask(taskId: string): Promise<ApiResponse<void>>;
  
  // Events
  onOperationStatusChange(callback: (operation: JobOperation) => void): () => void;
  onEquipmentAlert(callback: (alert: any) => void): () => void;
}

// Quality Management Module Contract
export interface QualityManagementContract {
  // Inspection Management
  getInspections(filters?: any): Promise<ApiResponse<QualityInspection[]>>;
  createInspection(inspection: Omit<QualityInspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<QualityInspection>>;
  updateInspectionResults(inspectionId: number, results: any[]): Promise<ApiResponse<QualityInspection>>;
  
  // Quality Standards
  getQualityStandards(itemType?: string): Promise<ApiResponse<any[]>>;
  validateQuality(operationId: number, measurements: any[]): Promise<ApiResponse<any>>;
  
  // Quality Analytics
  getQualityMetrics(plantId: number, dateRange: any): Promise<ApiResponse<KPIMetric[]>>;
  getDefectAnalysis(dateRange: any): Promise<ApiResponse<any>>;
  
  // Events
  onQualityAlert(callback: (alert: any) => void): () => void;
  onInspectionComplete(callback: (inspection: QualityInspection) => void): () => void;
}

// Inventory Planning Module Contract
export interface InventoryPlanningContract {
  // Inventory Management
  getInventoryItems(plantId?: number): Promise<ApiResponse<InventoryItem[]>>;
  updateInventoryLevel(itemId: number, quantity: number, reason: string): Promise<ApiResponse<InventoryItem>>;
  getInventoryTransactions(itemId?: number, dateRange?: any): Promise<ApiResponse<any[]>>;
  
  // Demand Forecasting
  getDemandForecast(itemId: number, horizon: number): Promise<ApiResponse<any>>;
  updateForecast(itemId: number, forecast: any[]): Promise<ApiResponse<any>>;
  
  // Stock Planning
  getReorderRecommendations(plantId: number): Promise<ApiResponse<any[]>>;
  calculateSafetyStock(itemId: number): Promise<ApiResponse<number>>;
  
  // Events
  onStockLevelChange(callback: (item: InventoryItem) => void): () => void;
  onReorderAlert(callback: (alert: any) => void): () => void;
}

// Analytics Reporting Module Contract
export interface AnalyticsReportingContract {
  // KPI Management
  getKPIs(category?: string, plantId?: number): Promise<ApiResponse<KPIMetric[]>>;
  calculateKPI(kpiId: string, parameters: any): Promise<ApiResponse<KPIMetric>>;
  
  // Dashboard Management
  getDashboards(userId: number): Promise<ApiResponse<any[]>>;
  createDashboard(dashboard: any): Promise<ApiResponse<any>>;
  updateDashboard(dashboardId: string, updates: any): Promise<ApiResponse<any>>;
  
  // Report Generation
  generateReport(reportType: string, parameters: any): Promise<ApiResponse<any>>;
  exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<ApiResponse<string>>;
  
  // Real-time Analytics
  subscribeToMetricUpdates(metricIds: string[], callback: (metrics: KPIMetric[]) => void): () => void;
  getRealtimeData(dataType: string, filters: any): Promise<ApiResponse<any>>;
}

// Shared Components Module Contract
export interface SharedComponentsContract {
  // Component Registry
  getAvailableComponents(): string[];
  renderComponent(componentName: string, props: any): React.ReactElement;
  
  // Theme Management
  getThemeColors(): Record<string, string>;
  getComponentStyles(componentName: string): any;
  
  // Utility Functions
  formatDate(date: Date, format?: string): string;
  formatCurrency(amount: number, currency?: string): string;
  formatDuration(minutes: number): string;
  
  // Data Grid Utilities
  exportToExcel(data: any[], filename: string): void;
  exportToPDF(data: any[], title: string): void;
}

// Module Federation Event Bus
export interface FederationEventBus {
  // Event Management
  emit(eventType: string, payload: any, target?: string): void;
  subscribe(eventType: string, callback: (payload: any) => void): () => void;
  
  // Module Communication
  sendMessage(targetModule: string, message: any): Promise<any>;
  broadcast(message: any): void;
  
  // State Synchronization
  syncState(moduleId: string, state: any): void;
  getSharedState(key: string): any;
  setSharedState(key: string, value: any): void;
}

// Module Registration Interface
export interface ModuleRegistration {
  name: string;
  version: string;
  dependencies: string[];
  provides: string[];
  contract: any;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}