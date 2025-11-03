import { EventEmitter } from 'events';
import { AgentResponse } from './base-agent.interface';

/**
 * Agent Bridge - Handles communication between server-side agents and client-side applications
 * This bridge allows agents to trigger actions in the client (browser) such as:
 * - Executing scheduling algorithms in Bryntum
 * - Refreshing UI components
 * - Navigating to specific pages
 */
export class AgentBridge extends EventEmitter {
  private static instance: AgentBridge;
  private activeConnections: Map<string, any> = new Map();
  
  private constructor() {
    super();
    console.log('[AgentBridge] Bridge initialized');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AgentBridge {
    if (!AgentBridge.instance) {
      AgentBridge.instance = new AgentBridge();
    }
    return AgentBridge.instance;
  }
  
  /**
   * Register a client connection (WebSocket, SSE, etc.)
   */
  registerConnection(connectionId: string, connection: any): void {
    this.activeConnections.set(connectionId, connection);
    console.log(`[AgentBridge] Registered connection: ${connectionId}`);
  }
  
  /**
   * Unregister a client connection
   */
  unregisterConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    console.log(`[AgentBridge] Unregistered connection: ${connectionId}`);
  }
  
  /**
   * Send a message to all active clients
   */
  broadcast(message: BridgeMessage): void {
    const messageStr = JSON.stringify(message);
    
    for (const [connectionId, connection] of this.activeConnections) {
      try {
        // Handle different connection types
        if (connection.send) {
          // WebSocket
          connection.send(messageStr);
        } else if (connection.write) {
          // SSE
          connection.write(`data: ${messageStr}\n\n`);
        }
      } catch (error) {
        console.error(`[AgentBridge] Failed to send to ${connectionId}:`, error);
        this.unregisterConnection(connectionId);
      }
    }
  }
  
  /**
   * Send a message to a specific client
   */
  sendToClient(connectionId: string, message: BridgeMessage): boolean {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      console.warn(`[AgentBridge] Connection ${connectionId} not found`);
      return false;
    }
    
    try {
      const messageStr = JSON.stringify(message);
      
      if (connection.send) {
        // WebSocket
        connection.send(messageStr);
      } else if (connection.write) {
        // SSE
        connection.write(`data: ${messageStr}\n\n`);
      }
      
      return true;
    } catch (error) {
      console.error(`[AgentBridge] Failed to send to ${connectionId}:`, error);
      this.unregisterConnection(connectionId);
      return false;
    }
  }
  
  /**
   * Handle agent responses that require client action
   */
  async handleAgentResponse(response: AgentResponse, userId?: number): Promise<void> {
    if (!response.requiresClientAction) {
      return;
    }
    
    const message: BridgeMessage = {
      type: response.clientActionType || 'AGENT_ACTION',
      data: response.clientActionData,
      timestamp: new Date().toISOString(),
      agentId: response.metadata?.agentId,
      userId
    };
    
    // Broadcast to all clients (or could filter by userId)
    this.broadcast(message);
    
    // Emit event for logging/monitoring
    this.emit('clientAction', message);
  }
  
  /**
   * Execute a scheduling algorithm via the client bridge
   */
  async executeSchedulingAlgorithm(
    algorithm: string, 
    targetPage: string = 'production-scheduler'
  ): Promise<void> {
    const message: BridgeMessage = {
      type: 'EXECUTE_SCHEDULING_ALGORITHM',
      data: {
        algorithm,
        targetPage
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    console.log(`[AgentBridge] Sent algorithm execution request: ${algorithm}`);
  }
  
  /**
   * Save the current schedule via the client bridge
   */
  async saveSchedule(name: string, targetPage: string = 'production-scheduler'): Promise<void> {
    const message: BridgeMessage = {
      type: 'SAVE_SCHEDULE',
      data: {
        name,
        targetPage
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    console.log(`[AgentBridge] Sent save schedule request: ${name}`);
  }
  
  /**
   * Load a saved schedule via the client bridge
   */
  async loadSchedule(name: string, targetPage: string = 'production-scheduler'): Promise<void> {
    const message: BridgeMessage = {
      type: 'LOAD_SCHEDULE',
      data: {
        name,
        targetPage
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    console.log(`[AgentBridge] Sent load schedule request: ${name}`);
  }
  
  /**
   * Navigate to a specific page
   */
  async navigateTo(path: string): Promise<void> {
    const message: BridgeMessage = {
      type: 'NAVIGATE',
      data: {
        path
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    console.log(`[AgentBridge] Sent navigation request: ${path}`);
  }
  
  /**
   * Refresh a specific component or data
   */
  async refresh(target: string): Promise<void> {
    const message: BridgeMessage = {
      type: 'REFRESH',
      data: {
        target
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    console.log(`[AgentBridge] Sent refresh request: ${target}`);
  }
}

/**
 * Message format for bridge communication
 */
export interface BridgeMessage {
  type: string;
  data?: any;
  timestamp: string;
  agentId?: string;
  userId?: number;
  error?: string;
}

// Export singleton instance
export const agentBridge = AgentBridge.getInstance();