// Agent Manager Implementation
import type { AgentManager, AgentCapability } from '../types';
import { MANUFACTURING_AGENTS, getAgentWelcomeMessage, type Agent } from '@planettogether/shared-components/config/agents';

export class AgentManagerImpl implements AgentManager {
  private agents: Agent[] = [...MANUFACTURING_AGENTS];
  private currentAgent: Agent = MANUFACTURING_AGENTS[0]; // Default to Max
  private listeners: Set<() => void> = new Set();

  getAvailableAgents(): Agent[] {
    return this.agents.filter(agent => agent.status === 'active');
  }

  getCurrentAgent(): Agent {
    return this.currentAgent;
  }

  async switchToAgent(agentId: string): Promise<void> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }
    
    if (agent.status !== 'active') {
      throw new Error(`Agent ${agentId} is not active`);
    }

    const previousAgent = this.currentAgent;
    this.currentAgent = agent;

    console.log(`[AgentManager] Switched from ${previousAgent.displayName} to ${agent.displayName}`);
    
    // Notify listeners
    this.notifyListeners();
  }

  updateAgentStatus(agentId: string, status: Agent['status']): void {
    const agentIndex = this.agents.findIndex(a => a.id === agentId);
    if (agentIndex !== -1) {
      this.agents[agentIndex] = { ...this.agents[agentIndex], status };
      this.notifyListeners();
    }
  }

  getAgentCapabilities(agentId: string): AgentCapability[] {
    const agent = this.agents.find(a => a.id === agentId);
    return agent?.capabilities || [];
  }

  // Get all agents (including inactive)
  getAllAgents(): Agent[] {
    return [...this.agents];
  }

  // Get agent by ID
  getAgentById(agentId: string): Agent | undefined {
    return this.agents.find(a => a.id === agentId);
  }

  // Subscribe to agent changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Agent manager listener error:', error);
      }
    });
  }

  // Get welcome message for agent
  getAgentWelcomeMessage(agent?: Agent): string {
    const targetAgent = agent || this.currentAgent;
    return getAgentWelcomeMessage(targetAgent);
  }
}

// Singleton instance
export const agentManager = new AgentManagerImpl();