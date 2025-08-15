import { pgTable, serial, text, timestamp, boolean, integer, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// Enum types for alerts
export const alertSeverityEnum = pgEnum('alert_severity', ['critical', 'high', 'medium', 'low', 'info']);
export const alertTypeEnum = pgEnum('alert_type', [
  'production_delay',
  'quality_issue',
  'inventory_shortage',
  'equipment_failure',
  'maintenance_required',
  'safety_violation',
  'capacity_exceeded',
  'delivery_delay',
  'cost_overrun',
  'compliance_issue',
  'custom',
  'ai_detected'
]);
export const alertStatusEnum = pgEnum('alert_status', ['active', 'acknowledged', 'resolved', 'dismissed', 'escalated']);
export const alertSourceEnum = pgEnum('alert_source', ['system', 'user', 'ai', 'sensor', 'integration']);

// Main alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: alertTypeEnum("type").notNull().default('custom'),
  severity: alertSeverityEnum("severity").notNull().default('medium'),
  status: alertStatusEnum("status").notNull().default('active'),
  source: alertSourceEnum("source").notNull().default('system'),
  
  // Related entities
  userId: integer("user_id").references(() => users.id),
  plantId: integer("plant_id"),
  departmentId: integer("department_id"),
  resourceId: integer("resource_id"),
  productionOrderId: integer("production_order_id"),
  jobId: integer("job_id"),
  
  // Alert details
  triggerCondition: jsonb("trigger_condition"), // JSON object defining when to trigger
  actualValue: text("actual_value"), // The value that triggered the alert
  thresholdValue: text("threshold_value"), // The threshold that was exceeded
  metadata: jsonb("metadata"), // Additional context data
  
  // AI-related fields
  aiGenerated: boolean("ai_generated").default(false),
  aiConfidence: integer("ai_confidence"), // 0-100 confidence score
  aiModel: text("ai_model"), // Which AI model generated this
  aiReasoning: text("ai_reasoning"), // AI's explanation
  
  // Timing
  detectedAt: timestamp("detected_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  escalatedAt: timestamp("escalated_at"),
  expiresAt: timestamp("expires_at"),
  
  // User actions
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  resolvedBy: integer("resolved_by").references(() => users.id),
  escalatedTo: integer("escalated_to").references(() => users.id),
  
  // Additional fields
  priority: integer("priority").default(50), // 1-100 priority score
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  actionsTaken: jsonb("actions_taken"), // Array of actions taken
  resolution: text("resolution"),
  rootCause: text("root_cause"),
  preventiveMeasures: text("preventive_measures"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert rules - Define conditions for automatic alert generation
export const alertRules = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: alertTypeEnum("type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  isActive: boolean("is_active").default(true),
  
  // Rule conditions
  entityType: text("entity_type"), // 'job', 'resource', 'inventory', etc.
  entityId: integer("entity_id"), // Optional specific entity
  condition: jsonb("condition").notNull(), // Complex condition logic
  
  // Thresholds
  metric: text("metric"), // What to monitor
  operator: text("operator"), // >, <, =, !=, contains, etc.
  threshold: text("threshold"), // Value to compare against
  
  // AI Configuration
  useAi: boolean("use_ai").default(false),
  aiPrompt: text("ai_prompt"), // Custom prompt for AI analysis
  aiThreshold: integer("ai_threshold"), // Confidence threshold for AI alerts
  
  // Notification settings
  notifyUsers: jsonb("notify_users"), // Array of user IDs to notify
  notifyRoles: jsonb("notify_roles"), // Array of role IDs to notify
  escalationChain: jsonb("escalation_chain"), // Escalation path
  
  // Timing
  checkInterval: integer("check_interval"), // Minutes between checks
  cooldownPeriod: integer("cooldown_period"), // Minutes before re-alerting
  lastChecked: timestamp("last_checked"),
  lastTriggered: timestamp("last_triggered"),
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert history - Track all changes to alerts
export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id).notNull(),
  action: text("action").notNull(), // 'created', 'acknowledged', 'escalated', 'resolved', etc.
  userId: integer("user_id").references(() => users.id),
  previousStatus: alertStatusEnum("previous_status"),
  newStatus: alertStatusEnum("new_status"),
  comment: text("comment"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Alert subscriptions - User preferences for alert notifications
export const alertSubscriptions = pgTable("alert_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  alertType: alertTypeEnum("alert_type"),
  severity: alertSeverityEnum("severity"),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  
  // Notification preferences
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  
  // Filtering
  keywords: jsonb("keywords"), // Array of keywords to match
  excludeKeywords: jsonb("exclude_keywords"), // Keywords to exclude
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI training data - Store feedback for improving AI alert generation
export const alertAiTraining = pgTable("alert_ai_training", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  ruleId: integer("rule_id").references(() => alertRules.id),
  
  // Training data
  inputData: jsonb("input_data").notNull(), // The data that triggered the alert
  expectedOutput: boolean("expected_output"), // Was this a good alert?
  actualOutput: boolean("actual_output"), // What the AI predicted
  
  // Feedback
  userFeedback: text("user_feedback"),
  wasUseful: boolean("was_useful"),
  falsePositive: boolean("false_positive").default(false),
  falseNegative: boolean("false_negative").default(false),
  
  // Model info
  modelVersion: text("model_version"),
  confidence: integer("confidence"),
  
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const alertsRelations = relations(alerts, ({ one, many }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [alerts.acknowledgedBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
  escalatedToUser: one(users, {
    fields: [alerts.escalatedTo],
    references: [users.id],
  }),
  history: many(alertHistory),
  aiTraining: many(alertAiTraining),
}));

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [alertRules.createdBy],
    references: [users.id],
  }),
  aiTraining: many(alertAiTraining),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertHistory.alertId],
    references: [alerts.id],
  }),
  user: one(users, {
    fields: [alertHistory.userId],
    references: [users.id],
  }),
}));

export const alertSubscriptionsRelations = relations(alertSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [alertSubscriptions.userId],
    references: [users.id],
  }),
}));

export const alertAiTrainingRelations = relations(alertAiTraining, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertAiTraining.alertId],
    references: [alerts.id],
  }),
  rule: one(alertRules, {
    fields: [alertAiTraining.ruleId],
    references: [alertRules.id],
  }),
  user: one(users, {
    fields: [alertAiTraining.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertAlertSchema = createInsertSchema(alerts);
export const insertAlertRuleSchema = createInsertSchema(alertRules);
export const insertAlertHistorySchema = createInsertSchema(alertHistory);
export const insertAlertSubscriptionSchema = createInsertSchema(alertSubscriptions);
export const insertAlertAiTrainingSchema = createInsertSchema(alertAiTraining);

// Export types
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = z.infer<typeof insertAlertHistorySchema>;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type InsertAlertSubscription = z.infer<typeof insertAlertSubscriptionSchema>;
export type AlertAiTraining = typeof alertAiTraining.$inferSelect;
export type InsertAlertAiTraining = z.infer<typeof insertAlertAiTrainingSchema>;