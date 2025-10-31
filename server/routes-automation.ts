/**
 * AI Automation Rules Routes
 * 
 * API endpoints for managing automation rules and viewing execution history
 */

import express from 'express';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { db } from './db';
import { 
  automationRules, 
  automationExecutions,
  insertAutomationRuleSchema,
  insertAutomationExecutionSchema
} from '@shared/schema';
import { requireAuth } from './enhanced-auth-middleware';

export const automationRoutes = express.Router();

// Get all automation rules for current user
automationRoutes.get('/api/automation-rules', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    
    const rules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.createdBy, userId))
      .orderBy(desc(automationRules.createdAt));
    
    res.json(rules);
  } catch (error: any) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// Get single automation rule
automationRoutes.get('/api/automation-rules/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.session?.user?.id || 1;
    
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, id),
        eq(automationRules.createdBy, userId)
      ))
      .limit(1);
    
    if (!rule) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }
    
    res.json(rule);
  } catch (error: any) {
    console.error('Error fetching automation rule:', error);
    res.status(500).json({ error: 'Failed to fetch automation rule' });
  }
});

// Create new automation rule
automationRoutes.post('/api/automation-rules', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    
    const validated = insertAutomationRuleSchema.parse({
      ...req.body,
      createdBy: userId
    });
    
    const [rule] = await db
      .insert(automationRules)
      .values(validated)
      .returning();
    
    res.status(201).json(rule);
  } catch (error: any) {
    console.error('Error creating automation rule:', error);
    res.status(400).json({ error: error.message || 'Failed to create automation rule' });
  }
});

// Update automation rule
automationRoutes.patch('/api/automation-rules/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.session?.user?.id || 1;
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, id),
        eq(automationRules.createdBy, userId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }
    
    // FIX: Validate and whitelist allowed fields
    const updateSchema = insertAutomationRuleSchema.partial().omit({ createdBy: true });
    const validated = updateSchema.parse(req.body);
    
    const [rule] = await db
      .update(automationRules)
      .set({
        ...validated,
        updatedAt: new Date()
      })
      .where(eq(automationRules.id, id))
      .returning();
    
    res.json(rule);
  } catch (error: any) {
    console.error('Error updating automation rule:', error);
    res.status(400).json({ error: error.message || 'Failed to update automation rule' });
  }
});

// Delete automation rule
automationRoutes.delete('/api/automation-rules/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.session?.user?.id || 1;
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, id),
        eq(automationRules.createdBy, userId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }
    
    await db
      .delete(automationRules)
      .where(eq(automationRules.id, id));
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting automation rule:', error);
    res.status(500).json({ error: 'Failed to delete automation rule' });
  }
});

// Get execution history for a rule
automationRoutes.get('/api/automation-rules/:id/executions', requireAuth, async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    const userId = req.session?.user?.id || 1;
    const { limit = 50 } = req.query;
    
    // Verify ownership of the rule
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, ruleId),
        eq(automationRules.createdBy, userId)
      ))
      .limit(1);
    
    if (!rule) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }
    
    const executions = await db
      .select()
      .from(automationExecutions)
      .where(eq(automationExecutions.ruleId, ruleId))
      .orderBy(desc(automationExecutions.executedAt))
      .limit(parseInt(limit as string));
    
    res.json(executions);
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch execution history' });
  }
});

// Get all execution history for current user's rules
automationRoutes.get('/api/automation-executions', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const { limit = 100 } = req.query;
    
    // Get all rule IDs owned by user
    const userRules = await db
      .select({ id: automationRules.id })
      .from(automationRules)
      .where(eq(automationRules.createdBy, userId));
    
    const ruleIds = userRules.map(r => r.id);
    
    if (ruleIds.length === 0) {
      return res.json([]);
    }
    
    // FIX: Filter in SQL, not in memory
    const { inArray } = await import('drizzle-orm');
    const executions = await db
      .select()
      .from(automationExecutions)
      .where(inArray(automationExecutions.ruleId, ruleIds))
      .orderBy(desc(automationExecutions.executedAt))
      .limit(parseInt(limit as string));
    
    res.json(executions);
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch execution history' });
  }
});

// Log an execution (used by automation engine)
automationRoutes.post('/api/automation-executions', requireAuth, async (req, res) => {
  try {
    const validated = insertAutomationExecutionSchema.parse(req.body);
    
    const [execution] = await db
      .insert(automationExecutions)
      .values(validated)
      .returning();
    
    // Update rule execution count and last executed timestamp
    await db
      .update(automationRules)
      .set({
        executionCount: db.$dynamic().sql`${automationRules.executionCount} + 1`,
        lastExecutedAt: new Date()
      })
      .where(eq(automationRules.id, validated.ruleId));
    
    res.status(201).json(execution);
  } catch (error: any) {
    console.error('Error logging execution:', error);
    res.status(400).json({ error: error.message || 'Failed to log execution' });
  }
});

// Test automation rule (dry run)
automationRoutes.post('/api/automation-rules/:id/test', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.session?.user?.id || 1;
    
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, id),
        eq(automationRules.createdBy, userId)
      ))
      .limit(1);
    
    if (!rule) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }
    
    // Perform dry run validation
    const testResult = {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      issueType: rule.issueType,
      wouldExecute: rule.isEnabled,
      matchConditions: rule.matchConditions,
      actions: rule.actionPayload,
      requiresApproval: rule.requiresApproval,
      message: rule.isEnabled 
        ? 'Rule is active and would execute automatically when conditions match'
        : 'Rule is disabled and will not execute'
    };
    
    res.json(testResult);
  } catch (error: any) {
    console.error('Error testing automation rule:', error);
    res.status(500).json({ error: 'Failed to test automation rule' });
  }
});
