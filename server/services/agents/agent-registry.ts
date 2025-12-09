import { IAgent, AgentContext, AgentResponse } from './base-agent.interface';
import { productionSchedulingAgent } from './production-scheduling-agent.service';
import { fpaAgent } from './fpa-agent.service';
import { adhocReportingAgent } from './adhoc-reporting-agent.service';

/**
 * Agent Registry - Manages all available agents and routes requests
 * This registry allows for role-based agent access control
 */
export class AgentRegistry {
  private agents: Map<string, IAgent> = new Map();
  private initialized: boolean = false;
  
  /**
   * Register an agent with the registry
   */
  registerAgent(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} is already registered, skipping...`);
      return;
    }
    
    this.agents.set(agent.id, agent);
    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.id})`);
  }
  
  /**
   * Initialize all registered agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[AgentRegistry] Already initialized, skipping...');
      return;
    }
    
    console.log('[AgentRegistry] Initializing agent registry...');
    
    // Register all available agents
    this.registerAgent(productionSchedulingAgent);
    this.registerAgent(fpaAgent);
    this.registerAgent(adhocReportingAgent);
    
    // Future agents would be registered here:
    // this.registerAgent(demandForecastingAgent);
    // this.registerAgent(inventoryOptimizationAgent);
    // this.registerAgent(qualityControlAgent);
    
    // Initialize all registered agents
    const initPromises = Array.from(this.agents.values()).map(agent => 
      agent.initialize().catch(error => {
        console.error(`Failed to initialize agent ${agent.id}:`, error);
      })
    );
    
    await Promise.all(initPromises);
    
    this.initialized = true;
    console.log(`[AgentRegistry] Initialized ${this.agents.size} agents`);
  }
  
  /**
   * Get agents available to a user based on their permissions
   */
  getAvailableAgents(userPermissions?: string[]): IAgent[] {
    const availableAgents: IAgent[] = [];
    
    for (const agent of this.agents.values()) {
      // Check if user has required permission for this agent
      if (!agent.requiredPermission || 
          userPermissions?.includes(agent.requiredPermission) ||
          userPermissions?.includes('*')) {
        availableAgents.push(agent);
      }
    }
    
    return availableAgents;
  }
  
  /**
   * Get a specific agent by ID
   */
  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Find the best agent to handle a message
   */
  findBestAgent(message: string, userPermissions?: string[]): IAgent | undefined {
    const availableAgents = this.getAvailableAgents(userPermissions);
    
    // Find agents that can handle this message
    const capableAgents = availableAgents.filter(agent => agent.canHandle(message));
    
    if (capableAgents.length === 0) {
      return undefined;
    }
    
    // For now, return the first matching agent
    // In the future, we could implement a scoring system
    return capableAgents[0];
  }
  
  /**
   * Process a message by routing it to the appropriate agent
   */
  async processMessage(
    message: string, 
    context: AgentContext
  ): Promise<AgentResponse | undefined> {
    // Get all agents that can potentially handle this message
    const availableAgents = this.getAvailableAgents(context.permissions);
    const capableAgents = availableAgents.filter(agent => agent.canHandle(message));
    
    if (capableAgents.length === 0) {
      console.log('[AgentRegistry] No agent found to handle message:', message.substring(0, 50) + '...');
      return undefined;
    }
    
    // Try each capable agent until one successfully handles the request
    for (const agent of capableAgents) {
      console.log(`[AgentRegistry] Trying agent: ${agent.name}`);
      
      try {
        // Process the message with the selected agent
        const response = await agent.process(message, context);
        
        // If agent returns null, it means it cannot handle this request
        if (response === null) {
          console.log(`[AgentRegistry] Agent ${agent.name} returned null, trying next agent...`);
          continue; // Try the next agent
        }
        
        // Success! Add agent metadata to the response
        console.log(`[AgentRegistry] Agent ${agent.name} successfully handled request`);
        return {
          ...response,
          metadata: {
            ...response.metadata,
            agentId: agent.id,
            agentName: agent.name
          }
        } as AgentResponse;
      } catch (error) {
        console.error(`[AgentRegistry] Agent ${agent.id} failed to process message:`, error);
        // Continue to next agent instead of returning error immediately
        continue;
      }
    }
    
    // If we get here, no agent could handle the request
    console.log('[AgentRegistry] No agent could successfully handle the request');
    return undefined;
  }
  
  /**
   * Get list of all registered agents (for admin/debugging)
   */
  getAllAgents(): Array<{ id: string; name: string; description: string }> {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description
    }));
  }
  
  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    console.log('[AgentRegistry] Shutting down all agents...');
    
    const shutdownPromises = Array.from(this.agents.values()).map(agent => 
      agent.shutdown?.().catch(error => {
        console.error(`Failed to shutdown agent ${agent.id}:`, error);
      })
    );
    
    await Promise.all(shutdownPromises);
    
    this.agents.clear();
    this.initialized = false;
    
    console.log('[AgentRegistry] All agents shut down');
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

// Export for convenience
export type { IAgent, AgentContext, AgentResponse } from './base-agent.interface';