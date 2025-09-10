// Shared TypeScript interfaces for PlanetTogether modular federation

// Core Manufacturing Domain Types
export interface ManufacturingEntity {
  id: number;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantEntity extends ManufacturingEntity {
  plantId: number;
  plantName: string;
  location?: string;
  timezone?: string;
}

// Production Types
export interface Job extends ManufacturingEntity {
  jobId: number;
  jobName: string;
  jobNumber: string;
  status: JobStatus;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  estimatedDuration?: number;
  plantId: number;
}

export interface JobOperation extends ManufacturingEntity {
  operationId: number;
  jobId: number;
  operationName: string;
  sequence: number;
  duration: number;
  status: OperationStatus;
  resourceId?: number;
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
}

export interface Resource extends ManufacturingEntity {
  resourceId: number;
  resourceName: string;
  resourceType: string;
  capacity: number;
  plantId: number;
  isActive: boolean;
  capabilities: string[];
}

// Status Enums
export type JobStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type OperationStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type QualityStatus = 'pass' | 'fail' | 'pending' | 'rework';

// Agent System Types
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  requiredData: string[];
}

export interface AgentAnalysisRequest {
  agentId: string;
  context: {
    plantId?: number;
    timeRange?: DateRange;
    filters?: Record<string, any>;
  };
  data?: any;
}

export interface AgentAnalysisResponse {
  agentId: string;
  summary: string;
  insights: string[];
  recommendations: AgentRecommendation[];
  metrics: PerformanceMetrics;
  confidence: number;
}

export interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actions: RecommendedAction[];
  reasoning: string;
}

export interface RecommendedAction {
  id: string;
  type: 'navigate' | 'create' | 'update' | 'analyze' | 'optimize';
  label: string;
  description: string;
  parameters?: Record<string, any>;
}

// Quality Management Types
export interface QualityInspection extends ManufacturingEntity {
  inspectionId: number;
  jobId: number;
  operationId?: number;
  inspectionType: string;
  status: QualityStatus;
  inspector?: string;
  inspectionDate: Date;
  results: QualityResult[];
}

export interface QualityResult {
  parameter: string;
  value: number | string;
  unit?: string;
  specification: QualitySpecification;
  status: QualityStatus;
}

export interface QualitySpecification {
  parameter: string;
  targetValue?: number;
  minimumValue?: number;
  maximumValue?: number;
  tolerance?: number;
  unit?: string;
}

// Inventory Types
export interface InventoryItem extends ManufacturingEntity {
  itemId: number;
  itemCode: string;
  itemName: string;
  itemType: 'raw_material' | 'work_in_progress' | 'finished_good' | 'tool' | 'consumable';
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  plantId: number;
}

export interface InventoryTransaction extends ManufacturingEntity {
  transactionId: number;
  itemId: number;
  transactionType: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  quantity: number;
  unit: string;
  reference?: string;
  jobId?: number;
  operationId?: number;
}

// Analytics Types
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  efficiency: number;
  quality: number;
  cost: number;
  safety: number;
  delivery: number;
}

// Shared Utility Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Module Communication Types
export interface ModuleEvent {
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
}

export interface ModuleAPI {
  name: string;
  version: string;
  endpoints: APIEndpoint[];
  events: EventDefinition[];
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestType?: string;
  responseType: string;
  auth?: boolean;
}

export interface EventDefinition {
  name: string;
  description: string;
  payloadType: string;
}

// Component Props Types for Shared Components
export interface DataGridProps<T> {
  data: T[];
  columns: GridColumn<T>[];
  loading?: boolean;
  pagination?: PaginationRequest;
  onRowSelect?: (row: T) => void;
  onDataUpdate?: (data: T[]) => void;
  filters?: Record<string, any>;
  exportEnabled?: boolean;
}

export interface GridColumn<T> {
  key: keyof T;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  formatter?: (value: any, row: T) => string | React.ReactNode;
}

export interface DashboardWidgetProps {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'custom';
  data?: any;
  config?: Record<string, any>;
  refreshInterval?: number;
}

// Error Types
export interface ModuleError {
  code: string;
  message: string;
  module: string;
  details?: any;
  timestamp: Date;
}

export class ModuleError extends Error {
  constructor(
    public code: string,
    message: string,
    public module: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ModuleError';
  }
}