import { sql } from 'drizzle-orm';
import { Database } from '../../../shared/types';

/**
 * Base interface for all specialized agents
 * Each agent must implement this interface to work with the agent registry
 */
export interface IAgent {
  /**
   * Unique identifier for the agent
   */
  id: string;
  
  /**
   * Display name for the agent
   */
  name: string;
  
  /**
   * Description of agent capabilities
   */
  description: string;
  
  /**
   * Trigger patterns that activate this agent
   */
  triggers: string[];
  
  /**
   * Required permission to access this agent
   */
  requiredPermission?: string;
  
  /**
   * Initialize the agent (called once on startup)
   */
  initialize(): Promise<void>;
  
  /**
   * Check if the agent can handle a given message
   */
  canHandle(message: string): boolean;
  
  /**
   * Process a message and return a response
   */
  process(message: string, context: AgentContext): Promise<AgentResponse>;
  
  /**
   * Cleanup when agent is being shut down
   */
  shutdown?(): Promise<void>;
}

/**
 * Context passed to agents when processing messages
 */
export interface AgentContext {
  userId: number;
  userName?: string;
  db: Database;
  sessionId?: string;
  metadata?: Record<string, any>;
  permissions?: string[];
}

/**
 * Standard response format from agents
 */
export interface AgentResponse {
  content: string;
  action?: {
    type: string;
    target?: string;
    data?: any;
  };
  error?: boolean;
  requiresClientAction?: boolean;
  clientActionType?: string;
  clientActionData?: any;
}

/**
 * Agent capability flags
 */
export interface AgentCapabilities {
  canSchedule?: boolean;
  canForecast?: boolean;
  canOptimize?: boolean;
  canAnalyze?: boolean;
  canModifyData?: boolean;
  requiresClientBridge?: boolean;
}

/**
 * Base class with common agent functionality
 */
export abstract class BaseAgent implements IAgent {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract triggers: string[];
  abstract requiredPermission?: string;
  
  protected db?: Database;
  protected initialized: boolean = false;
  
  async initialize(): Promise<void> {
    this.initialized = true;
    console.log(`[${this.name}] Agent initialized`);
  }
  
  canHandle(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.triggers.some(trigger => 
      lowerMessage.includes(trigger.toLowerCase())
    );
  }
  
  abstract process(message: string, context: AgentContext): Promise<AgentResponse>;
  
  async shutdown(): Promise<void> {
    this.initialized = false;
    console.log(`[${this.name}] Agent shutdown`);
  }
  
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
  
  protected error(message: string, error?: any): void {
    console.error(`[${this.name}] ERROR: ${message}`, error);
  }
}