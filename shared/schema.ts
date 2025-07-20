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
