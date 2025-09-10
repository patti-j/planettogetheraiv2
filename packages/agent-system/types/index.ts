// Agent System Types
import type { AgentSystemContract } from '@planettogether/shared-components/contracts/module-contracts';
// Re-export shared types
export type { Agent, AgentCapability } from '@planettogether/shared-components/config/agents';

export interface AgentMessage {
  id: string;
  agentId: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    page?: string;
    data?: any;
    relatedAgents?: string[];
  };
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
  timestamp?: Date;
}

export interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
  actions: RecommendedAction[];
  metrics?: {
    currentValue: number;
    projectedValue: number;
    improvement: string;
    unit: string;
  };
}

export interface RecommendedAction {
  id: string;
  type: 'navigate' | 'create' | 'update' | 'analyze' | 'optimize';
  label: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: string;
  impact?: string;
  parameters?: Record<string, any>;
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
  actionRequired?: string;
}

export interface AgentCoordination {
  id: string;
  coordinatingAgent: string;
  collaboratingAgents: string[];
  objective: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  sharedContext: any;
  results?: any;
}

// Service Interfaces
export interface AgentManager {
  getAvailableAgents(): Agent[];
  getCurrentAgent(): Agent;
  switchToAgent(agentId: string): Promise<void>;
  updateAgentStatus(agentId: string, status: Agent['status']): void;
  getAgentCapabilities(agentId: string): AgentCapability[];
}

export interface AgentAnalysisEngine {
  requestAnalysis(agentId: string, context?: any): Promise<AgentAnalysis>;
  generateRecommendations(agentId: string, data: any): Promise<AgentRecommendation[]>;
  processUserRequest(agentId: string, request: string): Promise<string>;
}

export interface AgentCommunication {
  sendMessage(agentId: string, message: string): Promise<string>;
  addMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): void;
  getMessages(): AgentMessage[];
  clearMessages(): void;
  subscribeToMessages(callback: (messages: AgentMessage[]) => void): () => void;
}

// Agent System Implementation
export interface AgentSystemImplementation extends AgentSystemContract {
  agentManager: AgentManager;
  analysisEngine: AgentAnalysisEngine;
  communication: AgentCommunication;
}