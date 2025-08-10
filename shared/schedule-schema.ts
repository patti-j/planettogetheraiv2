import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  jsonb,
  decimal,
  uuid,
  pgEnum,
  index,
  foreignKey,
  unique,
  real
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Enums for schedule types and statuses
export const scheduleTypeEnum = pgEnum('schedule_type', [
  'plant',
  'department', 
  'resource',
  'work_center',
  'production_line',
  'enterprise'
]);

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'in_review',
  'approved',
  'published',
  'active',
  'archived',
  'superseded'
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'on_hold',
  'escalated'
]);

// Main schedules table - stores schedule versions
export const schedules = pgTable('schedules', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleCode: varchar('schedule_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Schedule scope
  scheduleType: scheduleTypeEnum('schedule_type').notNull(),
  scopeId: integer('scope_id'), // ID of plant, department, resource etc.
  scopeName: varchar('scope_name', { length: 255 }),
  
  // Version control
  version: integer('version').notNull().default(1),
  parentScheduleId: integer('parent_schedule_id'),
  isBaseline: boolean('is_baseline').default(false),
  
  // Time horizon
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  scheduleHorizonDays: integer('schedule_horizon_days'),
  
  // Status and workflow
  status: scheduleStatusEnum('status').notNull().default('draft'),
  approvalStatus: approvalStatusEnum('approval_status').default('pending'),
  
  // Metadata
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedBy: integer('modified_by'),
  modifiedAt: timestamp('modified_at').defaultNow(),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  publishedAt: timestamp('published_at'),
  
  // Performance metrics
  utilizationRate: real('utilization_rate'),
  efficiencyScore: real('efficiency_score'),
  onTimeDeliveryRate: real('on_time_delivery_rate'),
  
  // Additional settings
  parameters: jsonb('parameters'), // Scheduling parameters used
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_schedules_status').on(table.status),
  index('idx_schedules_type').on(table.scheduleType),
  index('idx_schedules_dates').on(table.startDate, table.endDate),
  index('idx_schedules_scope').on(table.scopeId),
  foreignKey({
    columns: [table.parentScheduleId],
    foreignColumns: [table.id]
  })
]);

// Schedule assignments - tasks/operations assigned in a schedule
export const scheduleAssignments = pgTable('schedule_assignments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer('schedule_id').notNull(),
  
  // What is being scheduled
  assignmentType: varchar('assignment_type', { length: 50 }).notNull(), // 'operation', 'order', 'job'
  assignmentId: integer('assignment_id').notNull(),
  assignmentName: varchar('assignment_name', { length: 255 }),
  
  // Resource assignment
  resourceId: integer('resource_id'),
  resourceName: varchar('resource_name', { length: 255 }),
  alternateResourceId: integer('alternate_resource_id'),
  
  // Timing
  plannedStartTime: timestamp('planned_start_time').notNull(),
  plannedEndTime: timestamp('planned_end_time').notNull(),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  
  // Quantities and durations
  plannedDuration: integer('planned_duration'), // minutes
  actualDuration: integer('actual_duration'),
  plannedQuantity: decimal('planned_quantity', { precision: 15, scale: 3 }),
  actualQuantity: decimal('actual_quantity', { precision: 15, scale: 3 }),
  
  // Sequencing and priority
  sequenceNumber: integer('sequence_number'),
  priority: integer('priority').default(5),
  isLocked: boolean('is_locked').default(false),
  isManuallyScheduled: boolean('is_manually_scheduled').default(false),
  
  // Status tracking
  status: varchar('status', { length: 50 }).default('scheduled'),
  completionPercentage: real('completion_percentage').default(0),
  
  // Constraints and dependencies
  predecessors: jsonb('predecessors'), // Array of assignment IDs
  successors: jsonb('successors'),
  constraints: jsonb('constraints'),
  
  // Additional data
  metadata: jsonb('metadata'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  index('idx_schedule_assignments_schedule').on(table.scheduleId),
  index('idx_schedule_assignments_resource').on(table.resourceId),
  index('idx_schedule_assignments_dates').on(table.plannedStartTime, table.plannedEndTime),
  index('idx_schedule_assignments_type').on(table.assignmentType, table.assignmentId),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedules.id]
  })
]);

// Schedule comparisons - for comparing different schedule versions
export const scheduleComparisons = pgTable('schedule_comparisons', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  comparisonCode: varchar('comparison_code', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  
  baseScheduleId: integer('base_schedule_id').notNull(),
  compareScheduleId: integer('compare_schedule_id').notNull(),
  
  // Comparison metrics
  totalChanges: integer('total_changes'),
  resourceChanges: integer('resource_changes'),
  timingChanges: integer('timing_changes'),
  sequenceChanges: integer('sequence_changes'),
  
  // Performance differences
  utilizationDelta: real('utilization_delta'),
  efficiencyDelta: real('efficiency_delta'),
  onTimeDelta: real('on_time_delta'),
  
  // Comparison details
  comparisonData: jsonb('comparison_data'),
  highlights: jsonb('highlights'), // Key differences to highlight
  
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_comparisons_schedules').on(table.baseScheduleId, table.compareScheduleId),
  foreignKey({
    columns: [table.baseScheduleId],
    foreignColumns: [schedules.id]
  }),
  foreignKey({
    columns: [table.compareScheduleId],
    foreignColumns: [schedules.id]
  })
]);

// Schedule discussions - collaborative comments and discussions
export const scheduleDiscussions = pgTable('schedule_discussions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer('schedule_id').notNull(),
  
  // Discussion thread
  parentDiscussionId: integer('parent_discussion_id'),
  threadId: varchar('thread_id', { length: 50 }),
  
  // Content
  userId: integer('user_id').notNull(),
  userName: varchar('user_name', { length: 255 }),
  userRole: varchar('user_role', { length: 100 }),
  
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  
  // Context - what part of schedule is being discussed
  contextType: varchar('context_type', { length: 50 }), // 'assignment', 'resource', 'general'
  contextId: integer('context_id'),
  contextData: jsonb('context_data'),
  
  // Status
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  
  // Mentions and notifications
  mentions: jsonb('mentions'), // Array of user IDs mentioned
  isAnnouncement: boolean('is_announcement').default(false),
  isPinned: boolean('is_pinned').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  editedAt: timestamp('edited_at'),
  
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_discussions_schedule').on(table.scheduleId),
  index('idx_discussions_user').on(table.userId),
  index('idx_discussions_thread').on(table.threadId),
  index('idx_discussions_context').on(table.contextType, table.contextId),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedules.id]
  }),
  foreignKey({
    columns: [table.parentDiscussionId],
    foreignColumns: [table.id]
  })
]);

// Schedule approvals - approval workflow tracking
export const scheduleApprovals = pgTable('schedule_approvals', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer('schedule_id').notNull(),
  
  // Approval level and sequence
  approvalLevel: integer('approval_level').notNull(),
  approvalSequence: integer('approval_sequence'),
  
  // Approver details
  approverId: integer('approver_id').notNull(),
  approverName: varchar('approver_name', { length: 255 }),
  approverRole: varchar('approver_role', { length: 100 }),
  delegatedTo: integer('delegated_to'),
  
  // Status and decision
  status: approvalStatusEnum('status').notNull().default('pending'),
  decision: varchar('decision', { length: 50 }), // 'approve', 'reject', 'request_changes'
  comments: text('comments'),
  conditions: text('conditions'), // Any conditions for approval
  
  // Timing
  requestedAt: timestamp('requested_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  dueDate: timestamp('due_date'),
  escalatedAt: timestamp('escalated_at'),
  
  // Additional data
  attachments: jsonb('attachments'),
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_approvals_schedule').on(table.scheduleId),
  index('idx_approvals_approver').on(table.approverId),
  index('idx_approvals_status').on(table.status),
  unique('unq_schedule_approver_level').on(table.scheduleId, table.approverId, table.approvalLevel),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedules.id]
  })
]);

// Schedule snapshots - point-in-time copies for history
export const scheduleSnapshots = pgTable('schedule_snapshots', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer('schedule_id').notNull(),
  
  snapshotCode: varchar('snapshot_code', { length: 50 }).unique(),
  snapshotType: varchar('snapshot_type', { length: 50 }), // 'auto', 'manual', 'approval', 'publish'
  description: text('description'),
  
  // Snapshot data
  scheduleData: jsonb('schedule_data').notNull(), // Complete schedule state
  assignmentsData: jsonb('assignments_data').notNull(), // All assignments
  metricsData: jsonb('metrics_data'), // Performance metrics at time of snapshot
  
  // Versioning
  version: integer('version'),
  isBaseline: boolean('is_baseline').default(false),
  
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_snapshots_schedule').on(table.scheduleId),
  index('idx_snapshots_created').on(table.createdAt),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedules.id]
  })
]);

// Schedule subscriptions - who gets notified about schedule changes
export const scheduleSubscriptions = pgTable('schedule_subscriptions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer('schedule_id').notNull(),
  userId: integer('user_id').notNull(),
  
  // Subscription preferences
  notifyOnChanges: boolean('notify_on_changes').default(true),
  notifyOnApproval: boolean('notify_on_approval').default(true),
  notifyOnPublish: boolean('notify_on_publish').default(true),
  notifyOnDiscussion: boolean('notify_on_discussion').default(false),
  
  // Notification settings
  emailNotifications: boolean('email_notifications').default(true),
  inAppNotifications: boolean('in_app_notifications').default(true),
  digestFrequency: varchar('digest_frequency', { length: 50 }), // 'immediate', 'hourly', 'daily'
  
  subscribedAt: timestamp('subscribed_at').defaultNow(),
  lastNotifiedAt: timestamp('last_notified_at'),
  
  metadata: jsonb('metadata')
}, (table) => [
  index('idx_subscriptions_schedule').on(table.scheduleId),
  index('idx_subscriptions_user').on(table.userId),
  unique('unq_schedule_user_subscription').on(table.scheduleId, table.userId),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedules.id]
  })
]);

// Relations
export const schedulesRelations = relations(schedules, ({ many, one }) => ({
  assignments: many(scheduleAssignments),
  discussions: many(scheduleDiscussions),
  approvals: many(scheduleApprovals),
  snapshots: many(scheduleSnapshots),
  subscriptions: many(scheduleSubscriptions),
  parentSchedule: one(schedules, {
    fields: [schedules.parentScheduleId],
    references: [schedules.id]
  }),
  childSchedules: many(schedules)
}));

export const scheduleAssignmentsRelations = relations(scheduleAssignments, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleAssignments.scheduleId],
    references: [schedules.id]
  })
}));

export const scheduleDiscussionsRelations = relations(scheduleDiscussions, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [scheduleDiscussions.scheduleId],
    references: [schedules.id]
  }),
  parentDiscussion: one(scheduleDiscussions, {
    fields: [scheduleDiscussions.parentDiscussionId],
    references: [scheduleDiscussions.id]
  }),
  replies: many(scheduleDiscussions)
}));

// Insert schemas
export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  modifiedAt: true
});

export const insertScheduleAssignmentSchema = createInsertSchema(scheduleAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertScheduleDiscussionSchema = createInsertSchema(scheduleDiscussions).omit({
  id: true,
  createdAt: true
});

export const insertScheduleApprovalSchema = createInsertSchema(scheduleApprovals).omit({
  id: true,
  requestedAt: true
});

export const insertScheduleComparisonSchema = createInsertSchema(scheduleComparisons).omit({
  id: true,
  createdAt: true
});

export const insertScheduleSnapshotSchema = createInsertSchema(scheduleSnapshots).omit({
  id: true,
  createdAt: true
});

export const insertScheduleSubscriptionSchema = createInsertSchema(scheduleSubscriptions).omit({
  id: true,
  subscribedAt: true
});

// Type exports
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;
export type InsertScheduleAssignment = z.infer<typeof insertScheduleAssignmentSchema>;
export type ScheduleDiscussion = typeof scheduleDiscussions.$inferSelect;
export type InsertScheduleDiscussion = z.infer<typeof insertScheduleDiscussionSchema>;
export type ScheduleApproval = typeof scheduleApprovals.$inferSelect;
export type InsertScheduleApproval = z.infer<typeof insertScheduleApprovalSchema>;
export type ScheduleComparison = typeof scheduleComparisons.$inferSelect;
export type InsertScheduleComparison = z.infer<typeof insertScheduleComparisonSchema>;
export type ScheduleSnapshot = typeof scheduleSnapshots.$inferSelect;
export type InsertScheduleSnapshot = z.infer<typeof insertScheduleSnapshotSchema>;
export type ScheduleSubscription = typeof scheduleSubscriptions.$inferSelect;
export type InsertScheduleSubscription = z.infer<typeof insertScheduleSubscriptionSchema>;