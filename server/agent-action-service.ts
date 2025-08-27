import { db } from './db';
import { agentActions, users } from '@shared/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import type { InsertAgentAction, AgentAction } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

export class AgentActionService {
  // Log a new agent action
  async logAction(actionData: Omit<InsertAgentAction, 'batchId'>): Promise<AgentAction> {
    const batchId = actionData.batchId || uuidv4();
    
    const [action] = await db
      .insert(agentActions)
      .values({
        ...actionData,
        batchId,
      })
      .returning();

    return action;
  }

  // Log a batch of related actions
  async logBatchActions(actions: Omit<InsertAgentAction, 'batchId'>[]): Promise<AgentAction[]> {
    const batchId = uuidv4();
    
    const actionsWithBatch = actions.map(action => ({
      ...action,
      batchId,
    }));

    const insertedActions = await db
      .insert(agentActions)
      .values(actionsWithBatch)
      .returning();

    return insertedActions;
  }

  // Get action history for a user
  async getActionHistory(userId: number, limit = 50, offset = 0): Promise<AgentAction[]> {
    const actions = await db
      .select()
      .from(agentActions)
      .where(eq(agentActions.createdBy, userId))
      .orderBy(desc(agentActions.createdAt))
      .limit(limit)
      .offset(offset);

    return actions;
  }

  // Get action history for a specific session
  async getSessionHistory(sessionId: string): Promise<AgentAction[]> {
    const actions = await db
      .select()
      .from(agentActions)
      .where(eq(agentActions.sessionId, sessionId))
      .orderBy(desc(agentActions.createdAt));

    return actions;
  }

  // Get actions that can be undone (not already undone and no dependent actions)
  async getUndoableActions(userId: number): Promise<AgentAction[]> {
    const actions = await db
      .select()
      .from(agentActions)
      .where(
        and(
          eq(agentActions.createdBy, userId),
          eq(agentActions.isUndone, false),
          eq(agentActions.success, true)
        )
      )
      .orderBy(desc(agentActions.createdAt));

    // Filter out actions that have dependent actions that aren't undone
    const undoableActions = [];
    for (const action of actions) {
      const dependentActions = await this.getDependentActions(action.id);
      const hasUndoneOrFailedDependents = dependentActions.some(dep => !dep.isUndone);
      
      if (!hasUndoneOrFailedDependents) {
        undoableActions.push(action);
      }
    }

    return undoableActions;
  }

  // Get actions that depend on a specific action
  async getDependentActions(actionId: number): Promise<AgentAction[]> {
    // Find actions that have this action as a parent or in their dependencies
    const dependentActions = await db
      .select()
      .from(agentActions)
      .where(eq(agentActions.parentActionId, actionId));

    // Also check for actions that reference this action in their undo instructions dependencies
    const allActions = await db.select().from(agentActions);
    const additionalDependents = allActions.filter(action => {
      if (!action.undoInstructions?.dependencies) return false;
      return action.undoInstructions.dependencies.includes(actionId.toString());
    });

    return [...dependentActions, ...additionalDependents];
  }

  // Undo a specific action
  async undoAction(actionId: number, undoneBy: number): Promise<{ success: boolean; error?: string }> {
    try {
      const action = await db
        .select()
        .from(agentActions)
        .where(eq(agentActions.id, actionId))
        .limit(1);

      if (!action.length) {
        return { success: false, error: 'Action not found' };
      }

      const actionToUndo = action[0];

      if (actionToUndo.isUndone) {
        return { success: false, error: 'Action already undone' };
      }

      // Check if there are dependent actions that need to be undone first
      const dependents = await this.getDependentActions(actionId);
      const undoableDependents = dependents.filter(dep => !dep.isUndone);
      
      if (undoableDependents.length > 0) {
        return { 
          success: false, 
          error: `Cannot undo: ${undoableDependents.length} dependent action(s) must be undone first` 
        };
      }

      // Execute the undo operation based on the undo instructions
      if (actionToUndo.undoInstructions) {
        const undoResult = await this.executeUndoOperation(actionToUndo);
        if (!undoResult.success) {
          return { success: false, error: undoResult.error };
        }
      }

      // Mark as undone
      await db
        .update(agentActions)
        .set({
          isUndone: true,
          undoneAt: new Date(),
          undoneBy,
        })
        .where(eq(agentActions.id, actionId));

      return { success: true };

    } catch (error) {
      console.error('Error undoing action:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Execute the actual undo operation
  private async executeUndoOperation(action: AgentAction): Promise<{ success: boolean; error?: string }> {
    if (!action.undoInstructions) {
      return { success: true }; // No undo instructions means no action needed
    }

    const { method, endpoint, data } = action.undoInstructions;

    try {
      switch (method) {
        case 'database_restore':
          // Restore database state from beforeState
          if (action.beforeState && action.entityType && action.entityId) {
            await this.restoreDatabaseState(action.entityType, action.entityId, action.beforeState);
          }
          break;

        case 'api_call':
          // Make an API call to undo the action
          if (endpoint) {
            await this.makeUndoApiCall(endpoint, data || {});
          }
          break;

        case 'state_revert':
          // Custom state reversion logic
          await this.revertApplicationState(action);
          break;

        default:
          return { success: false, error: `Unknown undo method: ${method}` };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Undo operation failed' 
      };
    }
  }

  // Helper method to restore database state
  private async restoreDatabaseState(entityType: string, entityId: string, beforeState: any): Promise<void> {
    // This would need to be implemented based on the specific entity types
    // For now, we'll throw an error to indicate it needs implementation
    throw new Error(`Database restore not implemented for entity type: ${entityType}`);
  }

  // Helper method to make undo API calls
  private async makeUndoApiCall(endpoint: string, data: any): Promise<void> {
    // This would make HTTP requests to undo API endpoints
    // For now, we'll throw an error to indicate it needs implementation
    throw new Error(`API call undo not implemented for endpoint: ${endpoint}`);
  }

  // Helper method to revert application state
  private async revertApplicationState(action: AgentAction): Promise<void> {
    // This would handle custom state reversion logic
    // For now, we'll throw an error to indicate it needs implementation
    throw new Error(`State revert not implemented for action type: ${action.actionType}`);
  }

  // Get action statistics for a user
  async getActionStats(userId: number): Promise<{
    total: number;
    byAgentType: Record<string, number>;
    byActionType: Record<string, number>;
    successful: number;
    undone: number;
    recent24h: number;
  }> {
    const actions = await db
      .select()
      .from(agentActions)
      .where(eq(agentActions.createdBy, userId));

    const stats = {
      total: actions.length,
      byAgentType: {} as Record<string, number>,
      byActionType: {} as Record<string, number>,
      successful: 0,
      undone: 0,
      recent24h: 0,
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    actions.forEach(action => {
      // Count by agent type
      stats.byAgentType[action.agentType] = (stats.byAgentType[action.agentType] || 0) + 1;
      
      // Count by action type
      stats.byActionType[action.actionType] = (stats.byActionType[action.actionType] || 0) + 1;
      
      // Count successful actions
      if (action.success) stats.successful++;
      
      // Count undone actions
      if (action.isUndone) stats.undone++;
      
      // Count recent actions
      if (action.createdAt && action.createdAt > oneDayAgo) stats.recent24h++;
    });

    return stats;
  }
}

export const agentActionService = new AgentActionService();