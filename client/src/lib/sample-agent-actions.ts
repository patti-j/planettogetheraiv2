import { logger } from './agent-action-logger';

/**
 * Sample Agent Actions - Demonstrates logging capabilities
 * This file shows how different parts of the system can log their AI agent activities
 */

// Example: Max AI Chat Response
export const logMaxAIChatResponse = async (userPrompt: string, aiResponse: string, context?: any) => {
  return logger.logSuccessfulAction({
    agentType: 'max',
    actionType: 'generate',
    entityType: 'chat_response',
    actionDescription: 'Generated AI response to user query',
    reasoning: 'User asked a question and Max AI provided contextual manufacturing intelligence response',
    userPrompt,
    beforeState: { userQuery: userPrompt, context },
    afterState: { response: aiResponse, timestamp: new Date().toISOString() },
    undoInstructions: null // Chat responses typically can't be undone
  });
};

// Example: Production Schedule Optimization
export const logScheduleOptimization = async (
  scheduleId: string, 
  beforeSchedule: any, 
  afterSchedule: any, 
  algorithm: string,
  reasoning: string
) => {
  return logger.logSuccessfulAction({
    agentType: 'scheduler',
    actionType: 'optimize',
    entityType: 'production_schedule',
    entityId: scheduleId,
    actionDescription: `Optimized production schedule using ${algorithm}`,
    reasoning,
    userPrompt: null,
    beforeState: beforeSchedule,
    afterState: afterSchedule,
    undoInstructions: logger.createDatabaseUndoInstructions(
      'production_schedule',
      scheduleId,
      beforeSchedule
    )
  });
};

// Example: Resource Allocation Change
export const logResourceAllocation = async (
  operationId: string,
  fromResourceId: string | null,
  toResourceId: string,
  reasoning: string
) => {
  const beforeState = { operationId, resourceId: fromResourceId };
  const afterState = { operationId, resourceId: toResourceId };
  
  return logger.logSuccessfulAction({
    agentType: 'optimizer',
    actionType: 'update',
    entityType: 'operation',
    entityId: operationId,
    actionDescription: `Reassigned operation to resource ${toResourceId}`,
    reasoning,
    beforeState,
    afterState,
    undoInstructions: logger.createApiUndoInstructions(
      `/api/operations/${operationId}/assign-resource`,
      'POST',
      { resourceId: fromResourceId }
    )
  });
};

// Example: Inventory Adjustment
export const logInventoryAdjustment = async (
  itemId: string,
  previousQuantity: number,
  newQuantity: number,
  adjustmentReason: string
) => {
  const beforeState = { itemId, quantity: previousQuantity };
  const afterState = { itemId, quantity: newQuantity };
  
  return logger.logSuccessfulAction({
    agentType: 'inventory',
    actionType: 'update',
    entityType: 'inventory_item',
    entityId: itemId,
    actionDescription: `Adjusted inventory from ${previousQuantity} to ${newQuantity}`,
    reasoning: adjustmentReason,
    beforeState,
    afterState,
    undoInstructions: logger.createApiUndoInstructions(
      `/api/inventory/${itemId}/adjust`,
      'POST',
      { quantity: previousQuantity, reason: 'Agent action undo' }
    )
  });
};

// Example: Quality Alert Generation
export const logQualityAlert = async (
  alertData: any,
  detectionMethod: string,
  confidence: number
) => {
  return logger.logSuccessfulAction({
    agentType: 'quality',
    actionType: 'create',
    entityType: 'quality_alert',
    entityId: alertData.id?.toString(),
    actionDescription: `Generated quality alert: ${alertData.title}`,
    reasoning: `AI detected potential quality issue using ${detectionMethod} with ${confidence}% confidence`,
    beforeState: null,
    afterState: alertData,
    undoInstructions: logger.createApiUndoInstructions(
      `/api/alerts/${alertData.id}`,
      'DELETE'
    )
  });
};

// Example: Dashboard Widget Creation
export const logDashboardWidgetCreation = async (
  widgetData: any,
  userRequest: string
) => {
  return logger.logSuccessfulAction({
    agentType: 'analytics',
    actionType: 'create',
    entityType: 'dashboard_widget',
    entityId: widgetData.id?.toString(),
    actionDescription: `Created dashboard widget: ${widgetData.title}`,
    reasoning: 'AI generated custom dashboard widget based on user requirements',
    userPrompt: userRequest,
    beforeState: null,
    afterState: widgetData,
    undoInstructions: logger.createApiUndoInstructions(
      `/api/widgets/${widgetData.id}`,
      'DELETE'
    )
  });
};

// Example: Production Order Priority Adjustment
export const logProductionOrderPriorityChange = async (
  orderId: string,
  oldPriority: number,
  newPriority: number,
  reasoning: string
) => {
  const beforeState = { orderId, priority: oldPriority };
  const afterState = { orderId, priority: newPriority };
  
  return logger.logSuccessfulAction({
    agentType: 'production',
    actionType: 'update',
    entityType: 'production_order',
    entityId: orderId,
    actionDescription: `Changed production order priority from ${oldPriority} to ${newPriority}`,
    reasoning,
    beforeState,
    afterState,
    undoInstructions: logger.createApiUndoInstructions(
      `/api/production-orders/${orderId}`,
      'PATCH',
      { priority: oldPriority }
    )
  });
};

// Example: Failed Action Logging
export const logFailedScheduleOptimization = async (
  scheduleId: string,
  algorithm: string,
  error: Error
) => {
  return logger.logFailedAction({
    agentType: 'scheduler',
    actionType: 'optimize',
    entityType: 'production_schedule',
    entityId: scheduleId,
    actionDescription: `Failed to optimize production schedule using ${algorithm}`,
    reasoning: 'Attempted to optimize schedule but encountered constraints or data issues',
    beforeState: { scheduleId, algorithm },
    undoInstructions: null
  }, error);
};

// Example: Batch Operations
export const logBatchScheduleUpdates = async (operations: any[]) => {
  const batchActions = operations.map(op => ({
    agentType: 'scheduler' as const,
    actionType: 'update' as const,
    entityType: 'operation' as const,
    entityId: op.id?.toString(),
    actionDescription: `Updated operation ${op.name} schedule`,
    reasoning: 'Part of batch schedule optimization to improve overall throughput',
    beforeState: { startTime: op.oldStartTime, endTime: op.oldEndTime },
    afterState: { startTime: op.newStartTime, endTime: op.newEndTime },
    undoInstructions: logger.createApiUndoInstructions(
      `/api/operations/${op.id}`,
      'PATCH',
      { startTime: op.oldStartTime, endTime: op.oldEndTime }
    )
  }));
  
  return logger.logBatchActions(batchActions);
};

// Utility function to create sample data for testing
export const createSampleAgentActions = async () => {
  console.log('Creating sample agent actions for testing...');
  
  try {
    // Create a few sample actions
    await logMaxAIChatResponse(
      'How can we optimize our brewing schedule?',
      'Based on your current capacity and demand patterns, I recommend implementing a demand-driven scheduling approach with 15% buffer capacity.',
      { currentUtilization: 85, demandPattern: 'seasonal' }
    );
    
    await logScheduleOptimization(
      'schedule_001',
      { operations: [{ id: 1, resource: 'tank_1', duration: 120 }] },
      { operations: [{ id: 1, resource: 'tank_2', duration: 105 }] },
      'Critical Path Method',
      'Identified bottleneck in tank_1 and reassigned to tank_2 for 12% efficiency gain'
    );
    
    await logQualityAlert(
      { id: 'qa_001', title: 'Temperature Variance Detected', severity: 'medium' },
      'Statistical Process Control',
      92
    );
    
    console.log('Sample agent actions created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create sample actions:', error);
    return false;
  }
};