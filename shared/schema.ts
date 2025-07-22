import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, primaryKey, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  photo: text("photo"), // Base64 encoded photo data
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

// Systems Management Tables for IT Administration

// User management for the application
export const systemUsers = pgTable("system_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // admin, production_manager, operator, viewer, it_admin
  department: text("department"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  lastLogin: timestamp("last_login"),
  passwordHash: text("password_hash").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System health monitoring
export const systemHealth = pgTable("system_health", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(),
  metricType: text("metric_type").notNull(), // cpu, memory, disk, database, api_response_time, active_users
  environment: text("environment").notNull(), // production, staging, development
  status: text("status").notNull(), // healthy, warning, critical
  threshold: jsonb("threshold").$type<{
    warning: number;
    critical: number;
    unit: string;
  }>().notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  notes: text("notes"),
});

// Environment management
export const systemEnvironments = pgTable("system_environments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // production, staging, development, testing
  displayName: text("display_name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  status: text("status").notNull().default("active"), // active, maintenance, offline
  version: text("version").notNull(),
  lastDeployment: timestamp("last_deployment"),
  deployedBy: text("deployed_by"),
  configuration: jsonb("configuration").$type<{
    database_url?: string;
    api_keys?: Record<string, string>;
    feature_flags?: Record<string, boolean>;
    resource_limits?: {
      cpu: number;
      memory: number;
      storage: number;
    };
  }>().default({}),
  healthStatus: text("health_status").notNull().default("unknown"), // healthy, degraded, unhealthy, unknown
  uptime: integer("uptime").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System upgrades and deployments
export const systemUpgrades = pgTable("system_upgrades", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  releaseNotes: text("release_notes"),
  environment: text("environment").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, rolled_back
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  initiatedBy: text("initiated_by").notNull(),
  approvedBy: text("approved_by"),
  rollbackPlan: text("rollback_plan"),
  testResults: jsonb("test_results").$type<{
    automated_tests: { passed: number; failed: number; total: number };
    manual_tests: { passed: number; failed: number; total: number };
    performance_tests: { passed: number; failed: number; total: number };
  }>().default({ automated_tests: { passed: 0, failed: 0, total: 0 }, manual_tests: { passed: 0, failed: 0, total: 0 }, performance_tests: { passed: 0, failed: 0, total: 0 } }),
  deploymentLog: text("deployment_log"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity and audit logging
export const systemAuditLog = pgTable("system_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => systemUsers.id),
  username: text("username").notNull(),
  action: text("action").notNull(), // login, logout, create, update, delete, view, export
  resource: text("resource").notNull(), // jobs, operations, resources, users, settings
  resourceId: text("resource_id"),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  environment: text("environment").notNull().default("production"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// System configuration and settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // security, performance, features, integrations
  key: text("key").notNull(),
  value: jsonb("value").$type<any>().notNull(),
  description: text("description"),
  dataType: text("data_type").notNull(), // string, number, boolean, json, array
  environment: text("environment").notNull(),
  isSecret: boolean("is_secret").default(false),
  lastModifiedBy: text("last_modified_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disruption Management
export const disruptions = pgTable("disruptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // machine_breakdown, material_shortage, absent_employee, quality_issue, equipment_maintenance, supplier_delay, weather, power_outage, other
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, resolved, monitoring, escalated
  description: text("description"),
  affectedResourceId: integer("affected_resource_id").references(() => resources.id),
  affectedJobId: integer("affected_job_id").references(() => jobs.id),
  affectedOperationId: integer("affected_operation_id").references(() => operations.id),
  startTime: timestamp("start_time").notNull(),
  estimatedDuration: integer("estimated_duration"), // in hours
  actualEndTime: timestamp("actual_end_time"),
  reportedBy: text("reported_by").notNull(),
  assignedTo: text("assigned_to"),
  impactAssessment: jsonb("impact_assessment").$type<{
    delayedOperations: number;
    affectedJobs: number;
    estimatedDelay: number; // hours
    financialImpact: number;
    customerImpact: string;
  }>().default({ delayedOperations: 0, affectedJobs: 0, estimatedDelay: 0, financialImpact: 0, customerImpact: "none" }),
  resolutionPlan: text("resolution_plan"),
  resolutionNotes: text("resolution_notes"),
  preventiveMeasures: text("preventive_measures"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const disruptionActions = pgTable("disruption_actions", {
  id: serial("id").primaryKey(),
  disruptionId: integer("disruption_id").references(() => disruptions.id).notNull(),
  actionType: text("action_type").notNull(), // reschedule_operation, reassign_resource, delay_job, order_materials, repair_equipment, hire_temp_staff, notify_customer, escalate
  description: text("description").notNull(),
  targetId: integer("target_id"), // ID of affected operation, job, or resource
  targetType: text("target_type"), // operation, job, resource
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  assignedTo: text("assigned_to"),
  scheduledTime: timestamp("scheduled_time"),
  completedTime: timestamp("completed_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disruptionEscalations = pgTable("disruption_escalations", {
  id: serial("id").primaryKey(),
  disruptionId: integer("disruption_id").references(() => disruptions.id).notNull(),
  escalatedBy: text("escalated_by").notNull(),
  escalatedTo: text("escalated_to").notNull(),
  reason: text("reason").notNull(),
  urgencyLevel: text("urgency_level").notNull(), // low, medium, high, urgent
  expectedResponse: timestamp("expected_response"),
  actualResponse: timestamp("actual_response"),
  resolutionRequired: boolean("resolution_required").default(true),
  status: text("status").notNull().default("pending"), // pending, acknowledged, resolved
  notes: text("notes"),
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

// Systems Management Insert Schemas
export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemHealthSchema = createInsertSchema(systemHealth).omit({
  id: true,
  timestamp: true,
});

export const insertSystemEnvironmentSchema = createInsertSchema(systemEnvironments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemUpgradeSchema = createInsertSchema(systemUpgrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.union([z.string().datetime(), z.date()]).optional(),
  startedAt: z.union([z.string().datetime(), z.date()]).optional(),
  completedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertSystemAuditLogSchema = createInsertSchema(systemAuditLog).omit({
  id: true,
  timestamp: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Disruption Management Insert Schemas
export const insertDisruptionSchema = createInsertSchema(disruptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDisruptionActionSchema = createInsertSchema(disruptionActions).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledTime: z.union([z.string().datetime(), z.date()]).optional(),
  completedTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDisruptionEscalationSchema = createInsertSchema(disruptionEscalations).omit({
  id: true,
  createdAt: true,
}).extend({
  expectedResponse: z.union([z.string().datetime(), z.date()]).optional(),
  actualResponse: z.union([z.string().datetime(), z.date()]).optional(),
});

// Capacity Planning Tables for Production Planners

// Capacity planning scenarios for different planning periods
export const capacityPlanningScenarios = pgTable("capacity_planning_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  planningPeriod: text("planning_period").notNull(), // weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, approved, archived
  createdBy: text("created_by").notNull(),
  aiRecommendations: jsonb("ai_recommendations").$type<{
    staffing_recommendations: Array<{
      department: string;
      current_staff: number;
      recommended_staff: number;
      justification: string;
      priority: "low" | "medium" | "high";
    }>;
    shift_recommendations: Array<{
      shift_name: string;
      current_hours: number;
      recommended_hours: number;
      days_per_week: number;
      justification: string;
    }>;
    equipment_recommendations: Array<{
      equipment_type: string;
      action: "purchase" | "upgrade" | "maintain" | "retire";
      quantity: number;
      estimated_cost: number;
      roi_months: number;
      justification: string;
    }>;
    capacity_projections: {
      current_capacity: number;
      projected_capacity: number;
      bottlenecks: string[];
      expansion_opportunities: string[];
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staffing level planning and decisions
export const staffingPlans = pgTable("staffing_plans", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => capacityPlanningScenarios.id).notNull(),
  department: text("department").notNull(),
  jobRole: text("job_role").notNull(),
  skillLevel: text("skill_level").notNull(), // entry, intermediate, senior, expert
  currentStaffCount: integer("current_staff_count").notNull(),
  plannedStaffCount: integer("planned_staff_count").notNull(),
  hourlyRate: integer("hourly_rate").notNull(), // in cents
  overtimeMultiplier: integer("overtime_multiplier").notNull().default(150), // 1.5x = 150
  benefits_cost_percent: integer("benefits_cost_percent").notNull().default(30),
  recruitment_timeline_weeks: integer("recruitment_timeline_weeks").default(8),
  training_cost_per_person: integer("training_cost_per_person").default(0),
  justification: text("justification"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("planned"), // planned, approved, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift planning and scheduling patterns
export const shiftPlans = pgTable("shift_plans", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => capacityPlanningScenarios.id).notNull(),
  shiftName: text("shift_name").notNull(),
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  daysOfWeek: jsonb("days_of_week").$type<number[]>().notNull(), // 0=Sunday, 1=Monday, etc.
  staffRequired: integer("staff_required").notNull(),
  premiumRate: integer("premium_rate").default(0), // percentage increase for night/weekend shifts
  effectiveDate: timestamp("effective_date").notNull(),
  endDate: timestamp("end_date"),
  machinesOperating: integer("machines_operating").notNull(),
  expectedOutput: integer("expected_output").notNull(), // units per hour
  notes: text("notes"),
  status: text("status").notNull().default("planned"), // planned, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment planning and investment decisions
export const equipmentPlans = pgTable("equipment_plans", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => capacityPlanningScenarios.id).notNull(),
  equipmentType: text("equipment_type").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  action: text("action").notNull(), // purchase, lease, upgrade, maintain, retire
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost").notNull(), // in cents
  installationCost: integer("installation_cost").default(0),
  maintenanceCostPerYear: integer("maintenance_cost_per_year").default(0),
  expectedLifespan: integer("expected_lifespan").notNull(), // in years
  capacityIncrease: integer("capacity_increase").default(0), // percentage increase in production capacity
  energyConsumption: integer("energy_consumption").default(0), // kWh per hour
  floorSpaceRequired: integer("floor_space_required").default(0), // square feet
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
  roi_analysis: jsonb("roi_analysis").$type<{
    payback_period_months: number;
    net_present_value: number;
    internal_rate_of_return: number;
    break_even_units: number;
  }>(),
  justification: text("justification"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("planned"), // planned, approved, ordered, installed, cancelled
  implementation_timeline: jsonb("implementation_timeline").$type<{
    planning_weeks: number;
    procurement_weeks: number;
    installation_weeks: number;
    training_weeks: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Capacity projections and analysis
export const capacityProjections = pgTable("capacity_projections", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => capacityPlanningScenarios.id).notNull(),
  resourceType: text("resource_type").notNull(), // machines, labor, facility
  currentCapacity: integer("current_capacity").notNull(), // units per day
  projectedCapacity: integer("projected_capacity").notNull(), // units per day after changes
  demandForecast: integer("demand_forecast").notNull(), // projected demand units per day
  utilizationRate: integer("utilization_rate").notNull(), // percentage
  bottleneckFactor: integer("bottleneck_factor").notNull().default(100), // percentage of total capacity limited by this resource
  seasonalVariation: jsonb("seasonal_variation").$type<{
    q1_multiplier: number;
    q2_multiplier: number;
    q3_multiplier: number;
    q4_multiplier: number;
  }>().default({ q1_multiplier: 1.0, q2_multiplier: 1.0, q3_multiplier: 1.0, q4_multiplier: 1.0 }),
  risksAndMitigation: jsonb("risks_and_mitigation").$type<Array<{
    risk: string;
    probability: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>>().default([]),
  notes: text("notes"),
  validFromDate: timestamp("valid_from_date").notNull(),
  validToDate: timestamp("valid_to_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Systems Management Types
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type SystemUser = typeof systemUsers.$inferSelect;

export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;
export type SystemHealth = typeof systemHealth.$inferSelect;

export type InsertSystemEnvironment = z.infer<typeof insertSystemEnvironmentSchema>;
export type SystemEnvironment = typeof systemEnvironments.$inferSelect;

export type InsertSystemUpgrade = z.infer<typeof insertSystemUpgradeSchema>;
export type SystemUpgrade = typeof systemUpgrades.$inferSelect;

export type InsertSystemAuditLog = z.infer<typeof insertSystemAuditLogSchema>;
export type SystemAuditLog = typeof systemAuditLog.$inferSelect;

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

// Disruption Management Types
export type InsertDisruption = z.infer<typeof insertDisruptionSchema>;
export type Disruption = typeof disruptions.$inferSelect;

export type InsertDisruptionAction = z.infer<typeof insertDisruptionActionSchema>;
export type DisruptionAction = typeof disruptionActions.$inferSelect;

export type InsertDisruptionEscalation = z.infer<typeof insertDisruptionEscalationSchema>;
export type DisruptionEscalation = typeof disruptionEscalations.$inferSelect;

// Capacity Planning Insert Schemas
export const insertCapacityPlanningScenarioSchema = createInsertSchema(capacityPlanningScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]),
});

export const insertStaffingPlanSchema = createInsertSchema(staffingPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftPlanSchema = createInsertSchema(shiftPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertEquipmentPlanSchema = createInsertSchema(equipmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCapacityProjectionSchema = createInsertSchema(capacityProjections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  validFromDate: z.union([z.string().datetime(), z.date()]),
  validToDate: z.union([z.string().datetime(), z.date()]),
});



// Capacity Planning Types
export type InsertCapacityPlanningScenario = z.infer<typeof insertCapacityPlanningScenarioSchema>;
export type CapacityPlanningScenario = typeof capacityPlanningScenarios.$inferSelect;

export type InsertStaffingPlan = z.infer<typeof insertStaffingPlanSchema>;
export type StaffingPlan = typeof staffingPlans.$inferSelect;

export type InsertShiftPlan = z.infer<typeof insertShiftPlanSchema>;
export type ShiftPlan = typeof shiftPlans.$inferSelect;

export type InsertEquipmentPlan = z.infer<typeof insertEquipmentPlanSchema>;
export type EquipmentPlan = typeof equipmentPlans.$inferSelect;

export type InsertCapacityProjection = z.infer<typeof insertCapacityProjectionSchema>;
export type CapacityProjection = typeof capacityProjections.$inferSelect;

// Business Goals and Directorial Oversight Tables

// Strategic business goals set by directors
export const businessGoals = pgTable("business_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // financial, operational, strategic, quality, customer, growth
  goalType: text("goal_type").notNull(), // revenue, cost_reduction, efficiency, quality_improvement, customer_satisfaction, market_share
  targetValue: integer("target_value").notNull(), // target number (revenue in cents, percentage * 100, etc)
  currentValue: integer("current_value").default(0),
  unit: text("unit").notNull(), // dollars, percentage, units, days, etc
  timeframe: text("timeframe").notNull(), // quarterly, annual, monthly
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, paused, completed, cancelled
  owner: text("owner").notNull(), // director/executive responsible
  department: text("department"), // which department is primarily responsible
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress tracking for business goals
export const goalProgress = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  reportedValue: integer("reported_value").notNull(),
  progressPercentage: integer("progress_percentage").notNull(), // calculated percentage * 100
  milestone: text("milestone"), // description of what was achieved
  reportedBy: text("reported_by").notNull(),
  reportingPeriod: text("reporting_period").notNull(), // Q1-2025, Jan-2025, Week-1-2025
  metrics: jsonb("metrics").$type<{
    leading_indicators?: Record<string, number>;
    lagging_indicators?: Record<string, number>;
    kpis?: Record<string, number>;
  }>().default({}),
  notes: text("notes"),
  attachments: jsonb("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>().default([]),
  confidence: integer("confidence").notNull().default(100), // confidence level in reported progress (percentage)
  createdAt: timestamp("created_at").defaultNow(),
});

// Risks and issues that may impact business goals
export const goalRisks = pgTable("goal_risks", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  riskTitle: text("risk_title").notNull(),
  riskDescription: text("risk_description").notNull(),
  riskType: text("risk_type").notNull(), // operational, financial, strategic, regulatory, competitive, technological
  probability: text("probability").notNull(), // low, medium, high
  impact: text("impact").notNull(), // low, medium, high, critical
  severity: integer("severity").notNull(), // calculated risk score (1-100)
  status: text("status").notNull().default("active"), // active, mitigated, resolved, accepted
  mitigation_plan: text("mitigation_plan"),
  mitigation_owner: text("mitigation_owner"),
  mitigation_deadline: timestamp("mitigation_deadline"),
  identifiedBy: text("identified_by").notNull(),
  lastReviewed: timestamp("last_reviewed").defaultNow(),
  escalated: boolean("escalated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issues and blockers affecting business goals
export const goalIssues = pgTable("goal_issues", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  issueTitle: text("issue_title").notNull(),
  issueDescription: text("issue_description").notNull(),
  issueType: text("issue_type").notNull(), // blocker, delay, resource_constraint, quality, dependency, external
  severity: text("severity").notNull(), // low, medium, high, critical
  impact: text("impact").notNull(), // schedule, budget, quality, scope
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: text("assigned_to"),
  reportedBy: text("reported_by").notNull(),
  resolutionPlan: text("resolution_plan"),
  estimatedResolutionDate: timestamp("estimated_resolution_date"),
  actualResolutionDate: timestamp("actual_resolution_date"),
  resolutionNotes: text("resolution_notes"),
  escalated: boolean("escalated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Key performance indicators linked to business goals
export const goalKpis = pgTable("goal_kpis", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  kpiName: text("kpi_name").notNull(),
  kpiDescription: text("kpi_description"),
  kpiType: text("kpi_type").notNull(), // leading, lagging, operational, financial
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  unit: text("unit").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly
  dataSource: text("data_source"), // where the KPI data comes from
  calculationMethod: text("calculation_method"),
  owner: text("owner").notNull(),
  status: text("status").notNull().default("active"), // active, paused, retired
  threshold_warning: integer("threshold_warning"), // warning threshold value
  threshold_critical: integer("threshold_critical"), // critical threshold value
  trend: text("trend"), // improving, declining, stable, volatile
  lastMeasured: timestamp("last_measured"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Action plans and initiatives to achieve business goals
export const goalActions = pgTable("goal_actions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  actionTitle: text("action_title").notNull(),
  actionDescription: text("action_description").notNull(),
  actionType: text("action_type").notNull(), // strategic_initiative, operational_improvement, investment, policy_change, training
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, cancelled, on_hold
  assignedTo: text("assigned_to").notNull(),
  budget: integer("budget").default(0), // in cents
  expectedImpact: text("expected_impact"),
  success_criteria: text("success_criteria"),
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  resources_required: jsonb("resources_required").$type<{
    people?: number;
    equipment?: string[];
    skills?: string[];
    external_support?: string[];
  }>().default({}),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  progress: integer("progress").default(0), // percentage * 100
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Goals Insert Schemas
export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string().datetime(), z.date()]),
  targetDate: z.union([z.string().datetime(), z.date()]),
});

export const insertGoalProgressSchema = createInsertSchema(goalProgress).omit({
  id: true,
  createdAt: true,
});

export const insertGoalRiskSchema = createInsertSchema(goalRisks).omit({
  id: true,
  lastReviewed: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  mitigation_deadline: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertGoalIssueSchema = createInsertSchema(goalIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estimatedResolutionDate: z.union([z.string().datetime(), z.date()]).optional(),
  actualResolutionDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertGoalKpiSchema = createInsertSchema(goalKpis).omit({
  id: true,
  lastMeasured: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalActionSchema = createInsertSchema(goalActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  targetDate: z.union([z.string().datetime(), z.date()]).optional(),
  completedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// Business Goals Types
export type InsertBusinessGoal = z.infer<typeof insertBusinessGoalSchema>;
export type BusinessGoal = typeof businessGoals.$inferSelect;

export type InsertGoalProgress = z.infer<typeof insertGoalProgressSchema>;
export type GoalProgress = typeof goalProgress.$inferSelect;

export type InsertGoalRisk = z.infer<typeof insertGoalRiskSchema>;
export type GoalRisk = typeof goalRisks.$inferSelect;

export type InsertGoalIssue = z.infer<typeof insertGoalIssueSchema>;
export type GoalIssue = typeof goalIssues.$inferSelect;

export type InsertGoalKpi = z.infer<typeof insertGoalKpiSchema>;
export type GoalKpi = typeof goalKpis.$inferSelect;

export type InsertGoalAction = z.infer<typeof insertGoalActionSchema>;
export type GoalAction = typeof goalActions.$inferSelect;

// User Management Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  activeRoleId: integer("active_role_id").references(() => roles.id),
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"), // Base64 encoded avatar image or avatar URL
  jobTitle: varchar("job_title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  feature: varchar("feature", { length: 50 }).notNull(), // feature category like 'scheduling', 'business_goals', etc.
  action: varchar("action", { length: 50 }).notNull(), // action like 'view', 'create', 'edit', 'delete'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: integer("assigned_by").references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: integer("granted_by").references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// User Preferences Table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  theme: varchar("theme", { length: 20 }).notNull().default("light"), // light, dark, system
  language: varchar("language", { length: 10 }).notNull().default("en"), // en, es, fr, etc.
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  dateFormat: varchar("date_format", { length: 20 }).notNull().default("MM/dd/yyyy"),
  timeFormat: varchar("time_format", { length: 10 }).notNull().default("12h"), // 12h, 24h
  notifications: jsonb("notifications").$type<{
    email: boolean;
    push: boolean;
    desktop: boolean;
    reminders: boolean;
    tours: boolean;
  }>().default(sql`'{"email": true, "push": true, "desktop": true, "reminders": true, "tours": true}'::jsonb`),
  dashboardLayout: jsonb("dashboard_layout").$type<{
    sidebarCollapsed: boolean;
    defaultPage: string;
    widgetPreferences: Record<string, any>;
  }>().default(sql`'{"sidebarCollapsed": false, "defaultPage": "/", "widgetPreferences": {}}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Management Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// User Management Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  assignedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  grantedAt: true,
});

// User Management Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// User with roles and permissions type for authentication
export type UserWithRoles = User & {
  roles: (Role & {
    permissions: Permission[];
  })[];
};

// Visual Factory Display Schema
export const visualFactoryDisplays = pgTable("visual_factory_displays", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  audience: varchar("audience", { length: 50 }).notNull(), // shop-floor, customer-service, sales, management, general
  autoRotationInterval: integer("auto_rotation_interval").default(30),
  isActive: boolean("is_active").default(true),
  useAiMode: boolean("use_ai_mode").default(false),
  widgets: jsonb("widgets").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVisualFactoryDisplaySchema = createInsertSchema(visualFactoryDisplays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVisualFactoryDisplay = z.infer<typeof insertVisualFactoryDisplaySchema>;
export type VisualFactoryDisplay = typeof visualFactoryDisplays.$inferSelect;

// Demo Tour Participants Schema
export const demoTourParticipants = pgTable("demo_tour_participants", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  primaryRole: varchar("primary_role", { length: 100 }).notNull(),
  additionalRoles: jsonb("additional_roles").$type<string[]>().default([]),
  voiceNarrationEnabled: boolean("voice_narration_enabled").default(false),
  tourStartedAt: timestamp("tour_started_at").defaultNow(),
  tourCompletedAt: timestamp("tour_completed_at"),
  tourSteps: jsonb("tour_steps").$type<Array<{
    stepId: string;
    stepTitle: string;
    roleId: string;
    completedAt: string;
    duration: number; // seconds spent on this step
  }>>().default([]),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referralSource: varchar("referral_source", { length: 255 }),
  feedback: text("feedback"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice recordings cache for tour narration
export const voiceRecordingsCache = pgTable("voice_recordings_cache", {
  id: serial("id").primaryKey(),
  textHash: varchar("text_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of the text content
  role: varchar("role", { length: 50 }).notNull(), // director, production-scheduler, etc.
  stepId: varchar("step_id", { length: 100 }).notNull(), // tour step identifier
  voice: varchar("voice", { length: 20 }).notNull(), // AI voice used (nova, alloy, etc.)
  audioData: text("audio_data").notNull(), // Base64 encoded audio file
  fileSize: integer("file_size").notNull(), // in bytes
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  usageCount: integer("usage_count").default(1),
});

// Tours table for storing generated tour content
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(), // Reference to roles table
  roleDisplayName: varchar("role_display_name", { length: 100 }).notNull(), // Display name for the role
  tourData: jsonb("tour_data").$type<{
    steps: Array<{
      id: string;
      title: string;
      description: string;
      page: string;
      icon: any;
      benefits: string[];
      actionText: string;
      duration: string;
      voiceScript?: string;
    }>;
    totalSteps: number;
    estimatedDuration: string;
    voiceScriptCount: number;
  }>().notNull(),
  isGenerated: boolean("is_generated").default(true), // true if AI generated, false if manually created
  generatedAt: timestamp("generated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 100 }), // user who generated/created the tour
});

export const insertDemoTourParticipantSchema = createInsertSchema(demoTourParticipants).omit({
  id: true,
  tourStartedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceRecordingsCacheSchema = createInsertSchema(voiceRecordingsCache).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  usageCount: true,
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  generatedAt: true,
  updatedAt: true,
});

export type InsertDemoTourParticipant = z.infer<typeof insertDemoTourParticipantSchema>;
export type DemoTourParticipant = typeof demoTourParticipants.$inferSelect;
export type InsertVoiceRecordingsCache = z.infer<typeof insertVoiceRecordingsCacheSchema>;
export type VoiceRecordingsCache = typeof voiceRecordingsCache.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;

// User Preferences Schema and Types
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Chat System Tables
export const chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'direct', 'group', 'contextual'
  description: text("description"),
  contextType: varchar("context_type", { length: 50 }), // 'job', 'operation', 'resource', 'goal', etc.
  contextId: integer("context_id"), // ID of the related object
  isPrivate: boolean("is_private").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
});

export const chatMembers = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).default("member"), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
}, (table) => ({
  channelUserUnique: unique().on(table.channelId, table.userId),
}));

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"), // 'text', 'file', 'system', 'mention'
  replyToId: integer("reply_to_id").references(() => chatMessages.id),
  attachments: jsonb("attachments"), // Array of file attachments
  metadata: jsonb("metadata"), // Additional message data
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  channelCreatedAtIdx: index("chat_messages_channel_created_at_idx").on(table.channelId, table.createdAt),
}));

export const chatReactions = pgTable("chat_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  messageUserEmojiUnique: unique().on(table.messageId, table.userId, table.emoji),
}));

// Chat Relations
export const chatChannelsRelations = relations(chatChannels, ({ one, many }) => ({
  creator: one(users, {
    fields: [chatChannels.createdBy],
    references: [users.id],
  }),
  members: many(chatMembers),
  messages: many(chatMessages),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  channel: one(chatChannels, {
    fields: [chatMembers.channelId],
    references: [chatChannels.id],
  }),
  user: one(users, {
    fields: [chatMembers.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  channel: one(chatChannels, {
    fields: [chatMessages.channelId],
    references: [chatChannels.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
  }),
  reactions: many(chatReactions),
}));

export const chatReactionsRelations = relations(chatReactions, ({ one }) => ({
  message: one(chatMessages, {
    fields: [chatReactions.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [chatReactions.userId],
    references: [users.id],
  }),
}));

// Chat Insert Schemas
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertChatMemberSchema = createInsertSchema(chatMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatReactionSchema = createInsertSchema(chatReactions).omit({
  id: true,
  createdAt: true,
});

// Chat Types
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatMember = typeof chatMembers.$inferSelect;
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatReaction = typeof chatReactions.$inferSelect;
export type InsertChatReaction = z.infer<typeof insertChatReactionSchema>;
