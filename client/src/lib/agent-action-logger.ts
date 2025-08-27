import { apiRequest } from './queryClient';

export interface LogAgentActionParams {
  sessionId?: string;
  agentType: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  actionDescription: string;
  reasoning: string;
  userPrompt?: string | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  undoInstructions?: {
    method: string;
    endpoint?: string;
    data?: Record<string, any>;
    dependencies?: string[];
  } | null;
  parentActionId?: number | null;
  batchId?: string | null;
  executionTime?: number | null;
  success?: boolean;
  errorMessage?: string | null;
}

/**
 * Agent Action Logger - Tracks all AI agent actions across the system
 * 
 * This utility helps maintain a comprehensive log of all agent activities,
 * providing transparency, accountability, and the ability to undo actions.
 */
export class AgentActionLogger {
  private static instance: AgentActionLogger;
  private currentSessionId: string;
  private currentBatchId: string | null = null;
  
  private constructor() {
    // Generate a session ID for this browser session
    this.currentSessionId = this.generateSessionId();
  }
  
  public static getInstance(): AgentActionLogger {
    if (!AgentActionLogger.instance) {
      AgentActionLogger.instance = new AgentActionLogger();
    }
    return AgentActionLogger.instance;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public startBatch(): string {
    this.currentBatchId = this.generateBatchId();
    return this.currentBatchId;
  }
  
  public endBatch(): void {
    this.currentBatchId = null;
  }
  
  /**
   * Log an agent action to the database
   */
  public async logAction(params: LogAgentActionParams): Promise<number | null> {
    try {
      const startTime = Date.now();
      
      const actionData = {
        sessionId: params.sessionId || this.currentSessionId,
        agentType: params.agentType,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        actionDescription: params.actionDescription,
        reasoning: params.reasoning,
        userPrompt: params.userPrompt,
        beforeState: params.beforeState,
        afterState: params.afterState,
        undoInstructions: params.undoInstructions,
        parentActionId: params.parentActionId,
        batchId: params.batchId || this.currentBatchId,
        executionTime: params.executionTime,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
        createdAt: new Date().toISOString()
      };
      
      const response = await apiRequest('/api/agent-actions', {
        method: 'POST',
        body: JSON.stringify(actionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`Agent action logged in ${executionTime}ms:`, {
        type: params.agentType,
        action: params.actionType,
        description: params.actionDescription
      });
      
      return response.id;
    } catch (error) {
      console.error('Failed to log agent action:', error);
      return null;
    }
  }
  
  /**
   * Log a successful action with before/after states
   */
  public async logSuccessfulAction(params: Omit<LogAgentActionParams, 'success' | 'errorMessage'>) {
    return this.logAction({
      ...params,
      success: true,
      errorMessage: null
    });
  }
  
  /**
   * Log a failed action with error details
   */
  public async logFailedAction(
    params: Omit<LogAgentActionParams, 'success' | 'errorMessage'>,
    error: Error | string
  ) {
    return this.logAction({
      ...params,
      success: false,
      errorMessage: typeof error === 'string' ? error : error.message,
      afterState: null
    });
  }
  
  /**
   * Log a batch of related actions
   */
  public async logBatchActions(actions: LogAgentActionParams[]): Promise<number[]> {
    const batchId = this.startBatch();
    const actionIds: number[] = [];
    
    try {
      for (const action of actions) {
        const actionId = await this.logAction({
          ...action,
          batchId
        });
        if (actionId) {
          actionIds.push(actionId);
        }
      }
    } finally {
      this.endBatch();
    }
    
    return actionIds;
  }
  
  /**
   * Create undo instructions for database operations
   */
  public createDatabaseUndoInstructions(
    entityType: string,
    entityId: string,
    beforeState: Record<string, any>
  ) {
    return {
      method: 'database_restore',
      data: {
        entityType,
        entityId,
        restoreState: beforeState
      },
      dependencies: []
    };
  }
  
  /**
   * Create undo instructions for API calls
   */
  public createApiUndoInstructions(
    endpoint: string,
    method: string = 'POST',
    data?: Record<string, any>,
    dependencies: string[] = []
  ) {
    return {
      method: 'api_call',
      endpoint,
      data: {
        method,
        ...data
      },
      dependencies
    };
  }
  
  /**
   * Create undo instructions for state changes
   */
  public createStateUndoInstructions(
    revertData: Record<string, any>,
    dependencies: string[] = []
  ) {
    return {
      method: 'state_revert',
      data: revertData,
      dependencies
    };
  }
}

// Convenience functions for common agent types
export const logger = AgentActionLogger.getInstance();

export const logMaxAIAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'max' });

export const logSchedulerAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'scheduler' });

export const logOptimizerAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'optimizer' });

export const logAnalyticsAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'analytics' });

export const logProductionAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'production' });

export const logInventoryAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'inventory' });

export const logQualityAction = (params: Omit<LogAgentActionParams, 'agentType'>) => 
  logger.logAction({ ...params, agentType: 'quality' });

// Export the main logger instance
export default logger;