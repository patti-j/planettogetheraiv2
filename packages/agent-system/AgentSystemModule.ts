// Agent System Module Implementation
// Using simplified standalone implementation for Week 3 client adapter integration
import { agentManager, agentAnalysisEngine, agentCommunication } from './services';
import type { 
  AgentSystemContract, 
  AgentAnalysisRequest, 
  AgentAnalysisResponse,
  AgentRecommendation 
} from '../shared-components/contracts/module-contracts';

// Simplified types and base class for initial federation
interface ModuleInitOptions {
  config?: Record<string, any>;
}

abstract class BaseModule {
  protected abstract name: string;
  
  async initialize(options?: ModuleInitOptions): Promise<void> {
    console.log(`[${this.name}] Initializing module...`);
    await this.onInitialize(options);
  }
  
  async destroy(): Promise<void> {
    console.log(`[${this.name}] Destroying module...`);
    await this.onDestroy();
  }
  
  protected abstract onInitialize(options?: ModuleInitOptions): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
}

export class AgentSystemModule extends BaseModule implements AgentSystemContract {
  protected name = 'agent-system';
  
  // Service instances
  agentManager = agentManager;
  analysisEngine = agentAnalysisEngine;
  communication = agentCommunication;

  protected async onInitialize(options?: ModuleInitOptions): Promise<void> {
    console.log('[AgentSystem] Initializing agent system...');
    
    // Initialize with welcome message from default agent (Max)
    const currentAgent = this.agentManager.getCurrentAgent();
    const welcomeMessage = this.agentManager.getAgentWelcomeMessage(currentAgent);
    this.communication.initializeWithWelcome(currentAgent.id, welcomeMessage);
    
    console.log('[AgentSystem] Agent system initialized');
  }

  protected async onDestroy(): Promise<void> {
    console.log('[AgentSystem] Destroying agent system...');
    this.communication.clearMessages();
  }

  // AgentSystemContract Implementation
  async getAvailableAgents(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const agents = this.agentManager.getAvailableAgents();
      return { success: true, data: agents };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  getCurrentAgent(): any {
    return this.agentManager.getCurrentAgent();
  }

  async switchToAgent(agentId: string): Promise<void> {
    await this.agentManager.switchToAgent(agentId);
    
    // Add transition message to communication
    const agent = this.agentManager.getCurrentAgent();
    const welcomeMessage = this.agentManager.getAgentWelcomeMessage(agent);
    
    this.communication.addMessage({
      agentId: agent.id,
      type: 'system',
      content: `Switched to ${agent.displayName}. ${welcomeMessage}`,
      context: {
        page: window.location.pathname,
        type: 'agent_switch'
      }
    });
  }

  async requestAnalysis(request: AgentAnalysisRequest): Promise<AgentAnalysisResponse> {
    try {
      const analysis = await this.analysisEngine.requestAnalysis(request.agentId, request.context);
      
      // Convert analysis recommendations to proper AgentRecommendation format
      const recommendations: AgentRecommendation[] = analysis.recommendations.map((rec: any, index: number) => ({
        id: `rec-${index}`,
        title: typeof rec === 'string' ? rec : rec.title || rec,
        description: typeof rec === 'string' ? '' : rec.description || '',
        impact: 'medium' as const,
        confidence: 0.85,
        actions: [],
        reasoning: ''
      }));
      
      return {
        agentId: request.agentId,
        summary: analysis.summary,
        insights: analysis.keyInsights,
        recommendations,
        metrics: {
          efficiency: analysis.performanceMetrics.efficiency || 0,
          quality: analysis.performanceMetrics.quality || 0,
          cost: analysis.performanceMetrics.cost || 0,
          safety: analysis.performanceMetrics.safety || 0,
          delivery: analysis.performanceMetrics.delivery || 0
        },
        confidence: 85 // Default confidence level
      };
    } catch (error) {
      return {
        agentId: request.agentId,
        summary: 'Analysis failed',
        insights: [],
        recommendations: [],
        metrics: {
          efficiency: 0,
          quality: 0,
          cost: 0,
          safety: 0,
          delivery: 0
        },
        confidence: 0
      };
    }
  }

  async getAgentCapabilities(agentId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const capabilities = this.agentManager.getAgentCapabilities(agentId);
      return { success: true, data: capabilities };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendMessageToAgent(agentId: string, message: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await this.communication.sendMessage(agentId, message);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  subscribeToAgentUpdates(callback: (update: any) => void): () => void {
    // Subscribe to agent manager changes
    const unsubscribeManager = this.agentManager.subscribe(() => {
      callback({
        type: 'agent_change',
        currentAgent: this.agentManager.getCurrentAgent(),
        availableAgents: this.agentManager.getAvailableAgents()
      });
    });

    // Subscribe to message updates
    const unsubscribeMessages = this.communication.subscribeToMessages((messages) => {
      callback({
        type: 'messages_update',
        messages: messages
      });
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeManager();
      unsubscribeMessages();
    };
  }

  // Additional helper methods
  getMessages() {
    return this.communication.getMessages();
  }

  clearMessages() {
    this.communication.clearMessages();
    
    // Re-add welcome message
    const currentAgent = this.agentManager.getCurrentAgent();
    const welcomeMessage = this.agentManager.getAgentWelcomeMessage(currentAgent);
    this.communication.initializeWithWelcome(currentAgent.id, welcomeMessage);
  }

  getAllAgents() {
    return this.agentManager.getAllAgents();
  }

  updateAgentStatus(agentId: string, status: 'active' | 'inactive' | 'busy' | 'error') {
    this.agentManager.updateAgentStatus(agentId, status);
  }

  async processUserRequest(agentId: string, request: string): Promise<string> {
    return await this.analysisEngine.processUserRequest(agentId, request);
  }
}

// Singleton instance
export const agentSystemModule = new AgentSystemModule();