import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  capabilities: jsonb("capabilities").$type<number[]>().default([]),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  customer: text("customer").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("planned"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  duration: integer("duration").notNull(), // in hours
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]),
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  order: integer("order").notNull().default(0),
});

export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  fromOperationId: integer("from_operation_id").references(() => operations.id).notNull(),
  toOperationId: integer("to_operation_id").references(() => operations.id).notNull(),
});

export const resourceViews = pgTable("resource_views", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  resourceSequence: jsonb("resource_sequence").$type<number[]>().notNull(),
  isDefault: boolean("is_default").default(false),
  colorScheme: text("color_scheme").notNull().default("by_job"),
  textLabeling: text("text_labeling").notNull().default("operation_name"),
  textLabelConfig: jsonb("text_label_config").$type<{
    labels: Array<{
      type: "operation_name" | "job_name" | "due_date" | "priority" | "status" | "duration" | "progress" | "resource_name" | "customer" | "job_description" | "operation_description" | "resource_type" | "capabilities" | "start_time" | "end_time" | "slack_days" | "days_late" | "completion_percent";
      enabled: boolean;
      order: number;
    }>;
    fontSize: number;
    fontColor: string;
  }>().default(sql`'{"labels": [{"type": "operation_name", "enabled": true, "order": 0}], "fontSize": 12, "fontColor": "#ffffff"}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kanbanConfigs = pgTable("kanban_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  viewType: text("view_type").notNull(),
  swimLaneField: text("swim_lane_field").notNull(), // Field to use for swim lanes (e.g., "status", "priority", "customer")
  swimLaneColors: jsonb("swim_lane_colors").$type<Record<string, string>>().default(sql`'{}'::jsonb`), // Color mapping for swim lane values
  filters: jsonb("filters").$type<{
    priorities: string[];
    statuses: string[];
    resources: number[];
    capabilities: number[];
    customers: string[];
    dateRange: {
      from: string | null;
      to: string | null;
    };
  }>().default(sql`'{"priorities": [], "statuses": [], "resources": [], "capabilities": [], "customers": [], "dateRange": {"from": null, "to": null}}'::jsonb`),
  displayOptions: jsonb("display_options").$type<{
    showPriority: boolean;
    showDueDate: boolean;
    showCustomer: boolean;
    showResource: boolean;
    showProgress: boolean;
    cardSize: "compact" | "standard" | "detailed";
    groupBy: "none" | "priority" | "customer" | "resource";
  }>().default(sql`'{"showPriority": true, "showDueDate": true, "showCustomer": true, "showResource": true, "showProgress": true, "cardSize": "standard", "groupBy": "none"}'::jsonb`),
  cardOrdering: jsonb("card_ordering").$type<Record<string, number[]>>().default(sql`'{}'::jsonb`), // Maps swim lane value to array of card IDs in order
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customTextLabels = pgTable("custom_text_labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  config: jsonb("config").$type<{
    labels: Array<{
      type: "operation_name" | "job_name" | "due_date" | "priority" | "status" | "duration" | "progress" | "resource_name" | "customer" | "job_description" | "operation_description" | "resource_type" | "capabilities" | "start_time" | "end_time" | "slack_days" | "days_late" | "completion_percent";
      enabled: boolean;
      order: number;
      fontSize: number;
      fontColor: string;
    }>;
    fontSize: number;
    fontColor: string;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reportConfigs = pgTable("report_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'jobs', 'operations', 'resources', 'summary', 'custom'
  configuration: jsonb("configuration").$type<{
    fields: string[];
    filters: Record<string, any>;
    sorting: { field: string; direction: 'asc' | 'desc' };
    grouping?: string;
    chartType?: 'table' | 'chart' | 'summary';
    widgets?: Array<{
      id: string;
      title: string;
      type: "metric" | "chart" | "table" | "progress";
      data: any;
      visible: boolean;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: any;
    }>;
  }>().notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dashboardConfigs = pgTable("dashboard_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  configuration: jsonb("configuration").$type<{
    standardWidgets: Array<{
      id: string;
      title: string;
      type: "metric" | "chart" | "table" | "progress";
      data: any;
      visible: boolean;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: any;
    }>;
    customWidgets: Array<{
      id: string;
      title: string;
      type: "metric" | "chart" | "table" | "progress";
      data: any;
      visible: boolean;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: any;
    }>;
  }>().notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Scenarios for evaluation and comparison
export const scheduleScenarios = pgTable("schedule_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, approved, rejected, archived
  createdBy: text("created_by").notNull(),
  baselineScenarioId: integer("baseline_scenario_id").references(() => scheduleScenarios.id),
  configuration: jsonb("configuration").$type<{
    scheduling_strategy: "fastest" | "most_efficient" | "balanced" | "custom";
    optimization_priorities: Array<"delivery_time" | "resource_utilization" | "cost_efficiency" | "customer_satisfaction">;
    constraints: {
      max_overtime_hours?: number;
      resource_availability?: Record<string, any>;
      deadline_priorities?: Record<string, number>;
    };
  }>().notNull(),
  metrics: jsonb("metrics").$type<{
    total_duration_hours: number;
    resource_utilization_percent: number;
    on_time_delivery_percent: number;
    total_cost: number;
    overtime_hours: number;
    customer_satisfaction_score: number;
    efficiency_score: number;
    risk_level: "low" | "medium" | "high";
    bottleneck_resources: string[];
    critical_path_duration: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Operations within specific scenarios
export const scenarioOperations = pgTable("scenario_operations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scheduleScenarios.id).notNull(),
  operationId: integer("operation_id").references(() => operations.id).notNull(),
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
});

// Feedback and evaluations from stakeholders
export const scenarioEvaluations = pgTable("scenario_evaluations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scheduleScenarios.id).notNull(),
  evaluatorName: text("evaluator_name").notNull(),
  evaluatorRole: text("evaluator_role").notNull(), // production_manager, sales, finance, customer_service, etc.
  department: text("department"),
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  criteria_scores: jsonb("criteria_scores").$type<{
    delivery_feasibility: number;
    resource_efficiency: number;
    cost_effectiveness: number;
    risk_level: number;
    customer_impact: number;
  }>().notNull(),
  comments: text("comments"),
  recommendations: text("recommendations"),
  approval_status: text("approval_status").notNull().default("pending"), // pending, approved, rejected, conditional
  priority_concerns: jsonb("priority_concerns").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion threads for collaborative decision making
export const scenarioDiscussions = pgTable("scenario_discussions", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scheduleScenarios.id).notNull(),
  parentId: integer("parent_id").references(() => scenarioDiscussions.id), // for threaded discussions
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull().default("comment"), // comment, question, concern, suggestion, decision
  tags: jsonb("tags").$type<string[]>().default([]),
  attachments: jsonb("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>().default([]),
  mentions: jsonb("mentions").$type<string[]>().default([]),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export const insertOperationSchema = createInsertSchema(operations).omit({
  id: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
});

export const insertResourceViewSchema = createInsertSchema(resourceViews).omit({
  id: true,
  createdAt: true,
});

export const insertCustomTextLabelSchema = createInsertSchema(customTextLabels).omit({
  id: true,
  createdAt: true,
});

export const insertKanbanConfigSchema = createInsertSchema(kanbanConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertReportConfigSchema = createInsertSchema(reportConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardConfigSchema = createInsertSchema(dashboardConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleScenarioSchema = createInsertSchema(scheduleScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScenarioOperationSchema = createInsertSchema(scenarioOperations).omit({
  id: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertScenarioEvaluationSchema = createInsertSchema(scenarioEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScenarioDiscussionSchema = createInsertSchema(scenarioDiscussions).omit({
  id: true,
  createdAt: true,
});

export type InsertCapability = z.infer<typeof insertCapabilitySchema>;
export type Capability = typeof capabilities.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type Operation = typeof operations.$inferSelect;

export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type Dependency = typeof dependencies.$inferSelect;

export type InsertResourceView = z.infer<typeof insertResourceViewSchema>;
export type ResourceView = typeof resourceViews.$inferSelect;

export type InsertCustomTextLabel = z.infer<typeof insertCustomTextLabelSchema>;
export type CustomTextLabel = typeof customTextLabels.$inferSelect;

export type InsertKanbanConfig = z.infer<typeof insertKanbanConfigSchema>;
export type KanbanConfig = typeof kanbanConfigs.$inferSelect;

export type InsertReportConfig = z.infer<typeof insertReportConfigSchema>;
export type ReportConfig = typeof reportConfigs.$inferSelect;

export type InsertDashboardConfig = z.infer<typeof insertDashboardConfigSchema>;
export type DashboardConfig = typeof dashboardConfigs.$inferSelect;

export type InsertScheduleScenario = z.infer<typeof insertScheduleScenarioSchema>;
export type ScheduleScenario = typeof scheduleScenarios.$inferSelect;

export type InsertScenarioOperation = z.infer<typeof insertScenarioOperationSchema>;
export type ScenarioOperation = typeof scenarioOperations.$inferSelect;

export type InsertScenarioEvaluation = z.infer<typeof insertScenarioEvaluationSchema>;
export type ScenarioEvaluation = typeof scenarioEvaluations.$inferSelect;

export type InsertScenarioDiscussion = z.infer<typeof insertScenarioDiscussionSchema>;
export type ScenarioDiscussion = typeof scenarioDiscussions.$inferSelect;
