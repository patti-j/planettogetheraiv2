import type { Express } from 'express';
import { db } from '../db';
import {
  schedules,
  scheduleAssignments,
  scheduleDiscussions,
  scheduleApprovals,
  scheduleComparisons,
  scheduleSnapshots,
  scheduleSubscriptions,
  insertScheduleSchema,
  insertScheduleAssignmentSchema,
  insertScheduleDiscussionSchema,
  insertScheduleApprovalSchema,
  type Schedule,
  type ScheduleAssignment
} from '@shared/schedule-schema';
import { eq, and, or, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

export default function registerScheduleRoutes(app: Express) {
  // Get all schedules with filtering
  app.get('/api/schedules', async (req, res) => {
    try {
      const { type, status, scopeId, startDate, endDate } = req.query;
      
      let query = db.select().from(schedules);
      const conditions = [];
      
      if (type) {
        conditions.push(eq(schedules.scheduleType, type as any));
      }
      if (status) {
        conditions.push(eq(schedules.status, status as any));
      }
      if (scopeId) {
        conditions.push(eq(schedules.scopeId, parseInt(scopeId as string)));
      }
      if (startDate) {
        conditions.push(gte(schedules.startDate, new Date(startDate as string)));
      }
      if (endDate) {
        conditions.push(lte(schedules.endDate, new Date(endDate as string)));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const result = await query.orderBy(desc(schedules.createdAt));
      res.json(result);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  });

  // Get single schedule with all related data
  app.get('/api/schedules/:id', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      // Get schedule
      const [schedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, scheduleId));
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      // Get assignments
      const assignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, scheduleId))
        .orderBy(asc(scheduleAssignments.plannedStartTime));
      
      // Get discussions
      const discussions = await db
        .select()
        .from(scheduleDiscussions)
        .where(eq(scheduleDiscussions.scheduleId, scheduleId))
        .orderBy(desc(scheduleDiscussions.createdAt));
      
      // Get approvals
      const approvals = await db
        .select()
        .from(scheduleApprovals)
        .where(eq(scheduleApprovals.scheduleId, scheduleId))
        .orderBy(asc(scheduleApprovals.approvalLevel));
      
      res.json({
        ...schedule,
        assignments,
        discussions,
        approvals
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  });

  // Create new schedule
  app.post('/api/schedules', async (req, res) => {
    try {
      const userId = (req as any).user?.id || 1;
      const scheduleData = insertScheduleSchema.parse({
        ...req.body,
        createdBy: userId,
        modifiedBy: userId,
        scheduleCode: `SCH-${Date.now()}`
      });
      
      const [newSchedule] = await db
        .insert(schedules)
        .values(scheduleData)
        .returning();
      
      // Create initial subscription for creator
      await db.insert(scheduleSubscriptions).values({
        scheduleId: newSchedule.id,
        userId,
        notifyOnChanges: true,
        notifyOnApproval: true,
        notifyOnPublish: true,
        emailNotifications: true,
        inAppNotifications: true
      });
      
      res.json(newSchedule);
    } catch (error) {
      console.error('Error creating schedule:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid schedule data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  });

  // Update schedule
  app.put('/api/schedules/:id', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const userId = (req as any).user?.id || 1;
      
      const [updatedSchedule] = await db
        .update(schedules)
        .set({
          ...req.body,
          modifiedBy: userId,
          modifiedAt: new Date()
        })
        .where(eq(schedules.id, scheduleId))
        .returning();
      
      if (!updatedSchedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  });

  // Save schedule assignments (bulk)
  app.post('/api/schedules/:id/assignments', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const assignments = req.body.assignments;
      
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ error: 'Assignments must be an array' });
      }
      
      // Delete existing assignments for this schedule
      await db
        .delete(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, scheduleId));
      
      // Insert new assignments
      if (assignments.length > 0) {
        const assignmentData = assignments.map(a => ({
          ...insertScheduleAssignmentSchema.parse(a),
          scheduleId
        }));
        
        await db.insert(scheduleAssignments).values(assignmentData);
      }
      
      // Update schedule modified timestamp
      await db
        .update(schedules)
        .set({ modifiedAt: new Date() })
        .where(eq(schedules.id, scheduleId));
      
      res.json({ message: 'Assignments saved successfully', count: assignments.length });
    } catch (error) {
      console.error('Error saving assignments:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid assignment data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to save assignments' });
    }
  });

  // Add discussion/comment
  app.post('/api/schedules/:id/discussions', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const userId = (req as any).user?.id || 1;
      const userName = (req as any).user?.username || 'User';
      
      const discussionData = insertScheduleDiscussionSchema.parse({
        ...req.body,
        scheduleId,
        userId,
        userName
      });
      
      const [newDiscussion] = await db
        .insert(scheduleDiscussions)
        .values(discussionData)
        .returning();
      
      res.json(newDiscussion);
    } catch (error) {
      console.error('Error adding discussion:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid discussion data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add discussion' });
    }
  });

  // Submit for approval
  app.post('/api/schedules/:id/submit-approval', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const { approvers } = req.body;
      
      // Update schedule status
      await db
        .update(schedules)
        .set({ 
          status: 'in_review',
          approvalStatus: 'pending'
        })
        .where(eq(schedules.id, scheduleId));
      
      // Create approval records
      if (approvers && Array.isArray(approvers)) {
        const approvalData = approvers.map((approver, index) => ({
          scheduleId,
          approverId: approver.id,
          approverName: approver.name,
          approverRole: approver.role,
          approvalLevel: index + 1,
          approvalSequence: index + 1,
          status: 'pending' as const
        }));
        
        await db.insert(scheduleApprovals).values(approvalData);
      }
      
      res.json({ message: 'Schedule submitted for approval' });
    } catch (error) {
      console.error('Error submitting for approval:', error);
      res.status(500).json({ error: 'Failed to submit for approval' });
    }
  });

  // Approve/reject schedule
  app.post('/api/schedules/:id/approval-decision', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const userId = (req as any).user?.id || 1;
      const { decision, comments, conditions } = req.body;
      
      // Update approval record
      await db
        .update(scheduleApprovals)
        .set({
          status: decision === 'approve' ? 'approved' : 'rejected',
          decision,
          comments,
          conditions,
          reviewedAt: new Date()
        })
        .where(and(
          eq(scheduleApprovals.scheduleId, scheduleId),
          eq(scheduleApprovals.approverId, userId),
          eq(scheduleApprovals.status, 'pending')
        ));
      
      // Check if all approvals are complete
      const pendingApprovals = await db
        .select()
        .from(scheduleApprovals)
        .where(and(
          eq(scheduleApprovals.scheduleId, scheduleId),
          eq(scheduleApprovals.status, 'pending')
        ));
      
      if (pendingApprovals.length === 0) {
        // All approvals complete - check if approved
        const rejectedApprovals = await db
          .select()
          .from(scheduleApprovals)
          .where(and(
            eq(scheduleApprovals.scheduleId, scheduleId),
            eq(scheduleApprovals.status, 'rejected')
          ));
        
        const finalStatus = rejectedApprovals.length > 0 ? 'draft' : 'approved';
        const approvalStatus = rejectedApprovals.length > 0 ? 'rejected' : 'approved';
        
        await db
          .update(schedules)
          .set({
            status: finalStatus,
            approvalStatus,
            approvedBy: approvalStatus === 'approved' ? userId : null,
            approvedAt: approvalStatus === 'approved' ? new Date() : null
          })
          .where(eq(schedules.id, scheduleId));
      }
      
      res.json({ message: 'Approval decision recorded' });
    } catch (error) {
      console.error('Error recording approval:', error);
      res.status(500).json({ error: 'Failed to record approval' });
    }
  });

  // Publish schedule
  app.post('/api/schedules/:id/publish', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      // First check if schedule is approved
      const [schedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, scheduleId));
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      if (schedule.approvalStatus !== 'approved') {
        return res.status(400).json({ error: 'Schedule must be approved before publishing' });
      }
      
      // Update any currently active schedules of same type/scope to superseded
      await db
        .update(schedules)
        .set({ status: 'superseded' })
        .where(and(
          eq(schedules.status, 'active'),
          eq(schedules.scheduleType, schedule.scheduleType),
          eq(schedules.scopeId, schedule.scopeId || 0)
        ));
      
      // Publish this schedule
      const [publishedSchedule] = await db
        .update(schedules)
        .set({
          status: 'active',
          publishedAt: new Date()
        })
        .where(eq(schedules.id, scheduleId))
        .returning();
      
      // Create a snapshot for the published version
      await db.insert(scheduleSnapshots).values({
        scheduleId,
        snapshotCode: `SNAP-PUB-${Date.now()}`,
        snapshotType: 'publish',
        description: 'Published version snapshot',
        scheduleData: publishedSchedule as any,
        assignmentsData: {} as any, // Would include full assignments
        version: publishedSchedule.version,
        createdBy: (req as any).user?.id || 1
      });
      
      res.json({ message: 'Schedule published successfully', schedule: publishedSchedule });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      res.status(500).json({ error: 'Failed to publish schedule' });
    }
  });

  // Compare schedules
  app.post('/api/schedules/compare', async (req, res) => {
    try {
      const { baseScheduleId, compareScheduleId } = req.body;
      
      // Get both schedules and their assignments
      const [baseSchedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, baseScheduleId));
      
      const [compareSchedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, compareScheduleId));
      
      if (!baseSchedule || !compareSchedule) {
        return res.status(404).json({ error: 'One or both schedules not found' });
      }
      
      const baseAssignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, baseScheduleId));
      
      const compareAssignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, compareScheduleId));
      
      // Perform comparison logic
      const comparison = {
        baseSchedule,
        compareSchedule,
        metrics: {
          totalChanges: 0,
          resourceChanges: 0,
          timingChanges: 0,
          sequenceChanges: 0,
          utilizationDelta: (compareSchedule.utilizationRate || 0) - (baseSchedule.utilizationRate || 0),
          efficiencyDelta: (compareSchedule.efficiencyScore || 0) - (baseSchedule.efficiencyScore || 0),
          onTimeDelta: (compareSchedule.onTimeDeliveryRate || 0) - (baseSchedule.onTimeDeliveryRate || 0)
        },
        differences: {
          added: [] as any[],
          removed: [] as any[],
          modified: [] as any[]
        }
      };
      
      // Compare assignments
      const baseMap = new Map(baseAssignments.map(a => [a.assignmentId, a]));
      const compareMap = new Map(compareAssignments.map(a => [a.assignmentId, a]));
      
      // Find added
      compareAssignments.forEach(ca => {
        if (!baseMap.has(ca.assignmentId)) {
          comparison.differences.added.push(ca);
          comparison.metrics.totalChanges++;
        }
      });
      
      // Find removed and modified
      baseAssignments.forEach(ba => {
        const ca = compareMap.get(ba.assignmentId);
        if (!ca) {
          comparison.differences.removed.push(ba);
          comparison.metrics.totalChanges++;
        } else {
          // Check for modifications
          if (ba.resourceId !== ca.resourceId) {
            comparison.metrics.resourceChanges++;
            comparison.metrics.totalChanges++;
          }
          if (ba.plannedStartTime?.getTime() !== ca.plannedStartTime?.getTime() ||
              ba.plannedEndTime?.getTime() !== ca.plannedEndTime?.getTime()) {
            comparison.metrics.timingChanges++;
            comparison.metrics.totalChanges++;
          }
          if (ba.sequenceNumber !== ca.sequenceNumber) {
            comparison.metrics.sequenceChanges++;
            comparison.metrics.totalChanges++;
          }
          
          if (comparison.metrics.totalChanges > 0) {
            comparison.differences.modified.push({
              base: ba,
              compare: ca
            });
          }
        }
      });
      
      // Save comparison
      const [savedComparison] = await db
        .insert(scheduleComparisons)
        .values({
          comparisonCode: `CMP-${Date.now()}`,
          name: `${baseSchedule.name} vs ${compareSchedule.name}`,
          baseScheduleId,
          compareScheduleId,
          ...comparison.metrics,
          comparisonData: comparison as any,
          createdBy: (req as any).user?.id || 1
        })
        .returning();
      
      res.json({ ...comparison, comparisonId: savedComparison.id });
    } catch (error) {
      console.error('Error comparing schedules:', error);
      res.status(500).json({ error: 'Failed to compare schedules' });
    }
  });

  // Get active schedule for scope
  app.get('/api/schedules/active/:type/:scopeId', async (req, res) => {
    try {
      const { type, scopeId } = req.params;
      
      const [activeSchedule] = await db
        .select()
        .from(schedules)
        .where(and(
          eq(schedules.status, 'active'),
          eq(schedules.scheduleType, type as any),
          eq(schedules.scopeId, parseInt(scopeId))
        ));
      
      if (!activeSchedule) {
        return res.status(404).json({ error: 'No active schedule found' });
      }
      
      const assignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, activeSchedule.id))
        .orderBy(asc(scheduleAssignments.plannedStartTime));
      
      res.json({
        ...activeSchedule,
        assignments
      });
    } catch (error) {
      console.error('Error fetching active schedule:', error);
      res.status(500).json({ error: 'Failed to fetch active schedule' });
    }
  });

  // Create schedule snapshot
  app.post('/api/schedules/:id/snapshot', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const { description, type = 'manual' } = req.body;
      
      // Get schedule and assignments
      const [schedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, scheduleId));
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      const assignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, scheduleId));
      
      // Create snapshot
      const [snapshot] = await db
        .insert(scheduleSnapshots)
        .values({
          scheduleId,
          snapshotCode: `SNAP-${Date.now()}`,
          snapshotType: type,
          description,
          scheduleData: schedule as any,
          assignmentsData: assignments as any,
          version: schedule.version,
          createdBy: (req as any).user?.id || 1
        })
        .returning();
      
      res.json(snapshot);
    } catch (error) {
      console.error('Error creating snapshot:', error);
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  });
}