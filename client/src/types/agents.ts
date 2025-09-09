// Core Agent System Types
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  specialties: string[];
  capabilities: AgentCapability[];
  status: 'active' | 'idle' | 'processing' | 'offline';
  priority: number; // for display order
  department: 'operations' | 'planning' | 'support' | 'orchestration';
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  requiresData: string[]; // PT table dependencies
}

export interface AgentMessage {
  id: string;
  agentId: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  context?: MessageContext;
  actions?: AgentAction[];
  recommendations?: AgentRecommendation[];
  attachments?: AttachmentFile[];
  reasoning?: string;
}

export interface MessageContext {
  page?: string;
  userId?: number;
  plantId?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  relatedData?: {
    jobs?: number[];
    operations?: number[];
    resources?: number[];
  };
}

export interface AgentAction {
  id: string;
  type: 'navigate' | 'create' | 'update' | 'analyze' | 'optimize' | 'alert';
  label: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters?: Record<string, any>;
  estimatedTime?: string;
  impact?: string;
}

export interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  reasoning: string;
  actions: AgentAction[];
  metrics?: {
    currentValue: number;
    projectedValue: number;
    improvement: string;
    unit: string;
  };
}

export interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface AgentAnalysis {
  agentId: string;
  summary: string;
  keyInsights: string[];
  recommendations: AgentRecommendation[];
  alerts: AgentAlert[];
  performanceMetrics: {
    efficiency: number;
    quality: number;
    cost: number;
    safety: number;
  };
}

export interface AgentAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  category: string;
  requiresAction: boolean;
  suggestedActions?: AgentAction[];
}

// Agent Communication & Coordination
export interface AgentCoordination {
  primaryAgent: string;
  collaboratingAgents: string[];
  coordinationType: 'sequential' | 'parallel' | 'hierarchical';
  dataSharing: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  };
  conflictResolution?: 'primary_wins' | 'user_decides' | 'escalate_to_max';
}

// Manufacturing-specific data interfaces
export interface ProductionData {
  jobs: any[];
  operations: any[];
  resources: any[];
  schedules: any[];
  workOrders: any[];
}

export interface QualityData {
  inspections: any[];
  defects: any[];
  compliance: any[];
  standards: any[];
}

export interface InventoryData {
  items: any[];
  stock: any[];
  movements: any[];
  forecasts: any[];
}

export interface MaintenanceData {
  equipment: any[];
  schedules: any[];
  workOrders: any[];
  history: any[];
}

// Agent Response Types
export interface AgentResponse {
  success: boolean;
  agentId: string;
  message: string;
  data?: any;
  actions?: AgentAction[];
  recommendations?: AgentRecommendation[];
  reasoning?: string;
  followUpQuestions?: string[];
  coordinationNeeded?: AgentCoordination;
}