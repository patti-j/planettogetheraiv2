import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, decimal, primaryKey, index, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import and re-export PT Publish tables with proper aliasing
import * as PT from "./pt-publish-schema";

// Re-export PT insert schemas with proper names
export const insertPtPlantsSchema = PT.insertPtPlantsSchema;
export const insertPtJobMaterialsSchema = PT.insertPtJobMaterialsSchema;
export const insertPtManufacturingOrdersSchema = PT.insertPtManufacturingOrdersSchema;
export const insertPtJobOperationsSchema = PT.insertPtJobOperationsSchema;
export const insertPtResourcesSchema = PT.insertPtResourcesSchema;
export const insertPtCapabilitiesSchema = PT.insertPtCapabilitiesSchema;
export const insertPtDepartmentsSchema = PT.insertPtDepartmentsSchema;

// Create aliases for legacy schema names
export const insertPlantSchema = PT.insertPtPlantsSchema;
export const insertCapabilitySchema = PT.insertPtCapabilitiesSchema;
export const insertResourceSchema = PT.insertPtResourcesSchema;
export const insertProductionOrderSchema = PT.insertPtManufacturingOrdersSchema;

// Export insert types
export type InsertPtPlant = PT.InsertPtPlant;
export type InsertPtResource = PT.InsertPtResource;
export type InsertPtCapability = PT.InsertPtCapability;
export type InsertPtManufacturingOrder = PT.InsertPtManufacturingOrder;

// Re-export legacy types from PT for backward compatibility
export type Plant = PT.Plant;
export type InsertPlant = PT.InsertPlant;
export type Resource = PT.Resource;
export type InsertResource = PT.InsertResource;
export type Capability = PT.Capability;
export type InsertCapability = PT.InsertCapability;
export type ProductionOrder = PT.ProductionOrder;
export type InsertProductionOrder = PT.InsertProductionOrder;
export type ManufacturingOrder = PT.ManufacturingOrder;
export type InsertManufacturingOrder = PT.InsertManufacturingOrder;

// Using PT tables instead of non-PT tables
export const ptPlants = PT.ptPlants;
export const capabilities = PT.ptCapabilities;
export const resources = PT.ptResources;
export const plantResources = PT.ptResourceCapabilities; // Using PT ResourceCapabilities table
export const departments = PT.ptDepartments;

// Re-export PT tables with their actual names
export const ptJobOperations = PT.ptJobOperations;
export const ptManufacturingOrders = PT.ptManufacturingOrders;

// Create aliases for legacy references
export const productionOrders = ptManufacturingOrders;
export const recipeOperations = ptJobOperations;
export const ptCapabilities = PT.ptCapabilities;
export const ptMetrics = PT.ptMetrics;

// Alias discrete operations to PT Job Operations for backward compatibility
export const discreteOperations = PT.ptJobOperations;
export const insertDiscreteOperationSchema = PT.insertPtJobOperationsSchema;

// Recipe Phases - subdivisions of operations for more granular control (PP-PI specific)
// REMOVED: Using PT tables instead
/*export const recipePhases = pgTable("recipe_phases", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => recipeOperations.id).notNull(), // Which operation this phase belongs to

  phaseNumber: text("phase_number").notNull(), // e.g., "A", "B" within operation
  phaseName: text("phase_name").notNull(), // e.g., "Mixing", "Heating"
  phaseType: text("phase_type").notNull(), // process, quality_check, setup, cleanup
  description: text("description"),
  
  // Timing
  duration: integer("duration"), // minutes
  setupTime: integer("setup_time").default(0), // phase-specific setup
  
  // Resource assignment - can be more specific than operation level
  specificResourceId: integer("specific_resource_id").references(() => resources.id), // Specific vessel or machine
  resourceCapabilities: jsonb("resource_capabilities").$type<number[]>().default([]),
  
  // Process parameters and control
  processParameters: jsonb("process_parameters").$type<{
    temperature: { target: number; min: number; max: number; unit: string };
    pressure: { target: number; min: number; max: number; unit: string };
    ph: { target: number; min: number; max: number };
    agitation_speed: { target: number; min: number; max: number; unit: string };
    flow_rate: { target: number; min: number; max: number; unit: string };
    residence_time: { target: number; min: number; max: number; unit: string };
  }>(),
  
  // Environmental controls
  environmentalControls: jsonb("environmental_controls").$type<{
    atmosphere: string; // nitrogen, air, vacuum
    humidity: { target: number; min: number; max: number };
    cleanliness_level: string; // ISO class or similar
  }>(),
  
  // Process instructions and automation
  processInstructions: text("process_instructions"), // Step-by-step instructions
  automationInstructions: jsonb("automation_instructions").$type<{
    control_recipe_name: string;
    parameters: Array<{
      parameter_name: string;
      parameter_value: string;
      parameter_type: string; // setpoint, alarm_limit, interlock
    }>;
  }>(),
  
  // Quality and safety
  qualityChecks: jsonb("quality_checks").$type<Array<{
    check_name: string;
    check_type: string; // visual, measurement, test
    specification: string;
    frequency: string; // continuous, start, end, hourly
    mandatory: boolean;
  }>>().default([]),
  safetyRequirements: text("safety_requirements"),
  
  // Process control system integration
  piSheetReference: text("pi_sheet_reference"), // Reference to PI sheet for automation
  controlSystemMessages: jsonb("control_system_messages").$type<Array<{
    message_type: string; // start, stop, alarm, parameter_change
    message_content: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  operationPhaseIdx: unique().on(table.operationId, table.phaseNumber),
}));*/

// Recipe Phase Relationships - REMOVED - Using PT tables instead

// Recipe Operation Relationships - REMOVED - Using PT tables instead

// Recipe Material Assignments - REMOVED - Using PT tables instead

// PTVendors - supplier information for recipe materials and equipment
export const PTvendors = pgTable("ptvendors", {
  id: serial("id").primaryKey(),
  vendorNumber: text("vendor_number").notNull().unique(), // e.g., "VND-001"
  vendorName: text("vendor_name").notNull(),
  vendorType: text("vendor_type").notNull().default("supplier"), // supplier, contractor, service_provider
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull().default("US"),
  taxId: text("tax_id"),
  paymentTerms: text("payment_terms"), // net30, net60, COD, etc.
  currency: text("currency").notNull().default("USD"),
  preferredVendor: boolean("preferred_vendor").default(false),
  qualificationLevel: text("qualification_level").default("qualified"), // qualified, approved, preferred, restricted
  capabilities: jsonb("capabilities").$type<string[]>().default([]), // what they can supply
  certifications: jsonb("certifications").$type<Array<{
    certification: string;
    issued_by: string;
    issued_date: string;
    expiry_date: string;
    status: string;
  }>>().default([]),
  performanceRating: integer("performance_rating").default(5), // 1-10 scale
  status: text("status").notNull().default("active"), // active, inactive, suspended
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Using PT Customers table instead of non-PT customers table
export const customers = PT.ptCustomers;

// Using PT JobMaterials table instead of recipes (BOM in PT)
export const recipes = PT.ptJobMaterials;

// Recipe Formulas - REMOVED - Using PT tables instead



// Production Versions - REMOVED - Using PT tables instead

// Resource Requirements - REMOVED - Using PT tables instead

// Resource Requirement Assignments - REMOVED - Using PT tables instead



// Dependencies - REMOVED - Using PT tables instead

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
  }>().default(sql`'{"labels": [{"type": "operation_name", "enabled": undefined, "order": 0}], "fontSize": 12, "fontColor": "#ffffff"}'::jsonb`),
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
  }>().default(sql`'{"showPriority": undefined, "showDueDate": undefined, "showCustomer": undefined, "showResource": undefined, "showProgress": undefined, "cardSize": "standard", "groupBy": "none"}'::jsonb`),
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
  targetPlatform: text("target_platform").notNull().default("both"), // "mobile", "desktop", "both"
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

// Agent Action History - tracks all AI agent actions for transparency and undo capability
export const agentActions = pgTable("agent_actions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // Chat or interaction session ID
  agentType: text("agent_type").notNull(), // 'max', 'scheduler', 'optimizer', 'analytics', etc.
  actionType: text("action_type").notNull(), // 'create', 'update', 'delete', 'optimize', 'analyze', 'generate'
  entityType: text("entity_type").notNull(), // 'production_order', 'schedule', 'resource', 'dashboard', etc.
  entityId: text("entity_id"), // ID of the affected entity (if applicable)
  actionDescription: text("action_description").notNull(), // Human-readable description of what was done
  reasoning: text("reasoning").notNull(), // Why the agent took this action
  userPrompt: text("user_prompt"), // Original user request that triggered this action
  beforeState: jsonb("before_state").$type<Record<string, any>>(), // State before the action
  afterState: jsonb("after_state").$type<Record<string, any>>(), // State after the action
  undoInstructions: jsonb("undo_instructions").$type<{
    method: string; // 'api_call', 'database_restore', 'state_revert'
    endpoint?: string; // API endpoint to call for undo
    data?: Record<string, any>; // Data needed for undo operation
    dependencies?: string[]; // Other actions that must be undone first
  }>(), // Instructions for how to undo this action
  isUndone: boolean("is_undone").default(false),
  undoneAt: timestamp("undone_at"),
  undoneBy: integer("undone_by").references(() => users.id),
  parentActionId: integer("parent_action_id"), // Links to parent action if this is a sub-action
  batchId: text("batch_id"), // Groups related actions together
  executionTime: integer("execution_time"), // Time taken to execute in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schedule Scenarios for evaluation and comparison
export const scheduleScenarios = pgTable("schedule_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, approved, rejected, archived
  createdBy: text("created_by").notNull(),
  baselineScenarioId: integer("baseline_scenario_id").references(() => scheduleScenarios.id),
  algorithmId: integer("algorithm_id"), // Reference to optimization algorithm used
  optimizationProfileId: integer("optimization_profile_id"), // Reference to optimization profile used
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

// resourceRequirementBlocks - DELETED: replaced by ptjobresourceblocks

// Operations within specific scenarios (kept for backward compatibility if needed)
export const scenarioOperations = pgTable("scenario_operations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scheduleScenarios.id).notNull(),
  // References PT Job Operations
  ptJobOperationId: integer("pt_job_operation_id").references(() => ptJobOperations.id),
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
export const scenarioDiscussions: any = pgTable("scenario_discussions", {
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

// Playbook System - Free-form wiki-like collaborative knowledge base
export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Free-form markdown content - the main wiki content
  tags: jsonb("tags").$type<string[]>().default([]), // Flexible tagging system
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  lastEditedBy: integer("last_edited_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contentSearchIndex: index("playbook_content_search_idx").on(table.content),
  titleSearchIndex: index("playbook_title_search_idx").on(table.title),
  tagsIndex: index("playbook_tags_idx").on(table.tags),
}));

// Playbook Collaborators - users who can edit specific playbooks
export const playbookCollaborators = pgTable("playbook_collaborators", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").references(() => playbooks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  permission: text("permission").notNull().default("edit"), // read, edit, admin
  addedBy: integer("added_by").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  collaboratorUnique: unique().on(table.playbookId, table.userId),
}));

// Playbook History - track all changes for audit purposes
export const playbookHistory = pgTable("playbook_history", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").references(() => playbooks.id).notNull(),
  previousContent: text("previous_content"),
  newContent: text("new_content"),
  changeType: text("change_type").notNull(), // created, updated, archived, restored
  changeDescription: text("change_description"),
  editedBy: integer("edited_by").references(() => users.id).notNull(),
  editedAt: timestamp("edited_at").defaultNow(),
});

// Playbook Usage Analytics - track how knowledge is being accessed and used
export const playbookUsage = pgTable("playbook_usage", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").references(() => playbooks.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  actionType: text("action_type").notNull(), // viewed, applied, referenced, shared
  context: text("context"), // where it was used (scheduling, optimization, etc.)
  effectivenessRating: integer("effectiveness_rating"), // 1-5 scale, how helpful it was
  usedAt: timestamp("used_at").defaultNow(),
});

// Unified Widget System - supports widgets across all application areas
export const unifiedWidgets = pgTable("unified_widgets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  targetPlatform: text("target_platform").notNull().default("both"), // "mobile", "desktop", "both"
  widgetType: text("widget_type").notNull(), // kpi, chart, table, alert, progress, gauge, list, timeline
  dataSource: text("data_source").notNull(), // jobs, operations, resources, metrics, alerts, plants, users
  chartType: text("chart_type"), // bar, line, pie, doughnut, number, gauge, progress
  aggregation: text("aggregation"), // count, sum, avg, min, max
  groupBy: text("group_by"),
  sortBy: jsonb("sort_by").$type<{ field: string; direction: "asc" | "desc" }>(),
  filters: jsonb("filters").$type<Record<string, any>>().default({}),
  colors: jsonb("colors").$type<string[]>().default([]),
  thresholds: jsonb("thresholds").$type<Array<{ value: number; color: string; label?: string }>>().default([]),
  limit: integer("limit"),
  size: jsonb("size").$type<{ width: number; height: number }>().notNull(),
  position: jsonb("position").$type<{ x: number; y: number }>().notNull(),
  refreshInterval: integer("refresh_interval"), // in seconds
  drillDownTarget: text("drill_down_target"),
  drillDownParams: jsonb("drill_down_params").$type<Record<string, any>>().default({}),
  
  // Multi-system deployment support
  deployedSystems: jsonb("deployed_systems").$type<string[]>().default([]), // cockpit, analytics, canvas, visual_factory
  systemSpecificConfig: jsonb("system_specific_config").$type<Record<string, any>>().default({}),
  
  // Ownership and permissions
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isShared: boolean("is_shared").default(false),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]), // user IDs or roles
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  description: text("description"),
  category: text("category"), // operational, financial, quality, safety, custom
  isTemplate: boolean("is_template").default(false),
  templateCategory: text("template_category"), // production, maintenance, quality, executive
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Widget deployment instances - tracks where widgets are deployed and with what specific configuration
export const widgetDeployments = pgTable("widget_deployments", {
  id: serial("id").primaryKey(),
  widgetId: integer("widget_id").references(() => unifiedWidgets.id).notNull(),
  targetSystem: text("target_system").notNull(), // cockpit, analytics, canvas, visual_factory
  targetContext: text("target_context"), // layout_id, dashboard_id, canvas_id, etc.
  systemSpecificId: integer("system_specific_id"), // reference to the system's own widget table
  position: jsonb("position").$type<{ x: number; y: number }>(),
  size: jsonb("size").$type<{ width: number; height: number }>(),
  isActive: boolean("is_active").default(true),
  customConfig: jsonb("custom_config").$type<Record<string, any>>().default({}), // system-specific overrides
  deployedAt: timestamp("deployed_at").defaultNow(),
  deployedBy: integer("deployed_by").references(() => users.id).notNull(),
}, (table) => ({
  widgetSystemUnique: unique().on(table.widgetId, table.targetSystem, table.targetContext),
}));

// Home Dashboard Layouts - customizable dashboard layouts for the home page
export const homeDashboardLayouts = pgTable("home_dashboard_layouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  widgets: jsonb("widgets").$type<Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'quick-links' | 'recent-activity' | 'alerts' | 'custom';
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: any;
    visible: boolean;
  }>>().notNull().default([]),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userDefaultUnique: unique().on(table.userId, table.isDefault),
  userIndex: index("home_dashboard_layouts_user_idx").on(table.userId),
}));

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
  affectedProductionOrderId: integer("affected_production_order_id").references(() => productionOrders.id),
  // Can reference either discrete or process operations

  startTime: timestamp("start_time").notNull(),
  estimatedDuration: integer("estimated_duration"), // in hours
  actualEndTime: timestamp("actual_end_time"),
  reportedBy: text("reported_by").notNull(),
  assignedTo: text("assigned_to"),
  impactAssessment: jsonb("impact_assessment").$type<{
    delayedOperations: number;
    affectedProductionOrders: number;
    estimatedDelay: number; // hours
    financialImpact: number;
    customerImpact: string;
  }>().default({ delayedOperations: 0, affectedProductionOrders: 0, estimatedDelay: 0, financialImpact: 0, customerImpact: "none" }),
  resolutionPlan: text("resolution_plan"),
  resolutionNotes: text("resolution_notes"),
  preventiveMeasures: text("preventive_measures"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External Portal Tables
export const externalCompanies = pgTable('external_companies', {
  id: varchar('id', { length: 255 }).primaryKey().default(sql`gen_random_uuid()::text`),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'supplier', 'customer', 'oem'
  erpLinkId: varchar('erp_link_id', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  size: varchar('size', { length: 50 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  address: text('address'),
  taxId: varchar('tax_id', { length: 100 }),
  website: varchar('website', { length: 255 }),
  aiOnboardingComplete: boolean('ai_onboarding_complete').default(false),
  aiProfile: jsonb('ai_profile'), // AI-generated company profile
  aiPreferences: jsonb('ai_preferences'),
  aiUsageLevel: varchar('ai_usage_level', { length: 50 }),
  enabledFeatures: jsonb('enabled_features'),
  customSettings: jsonb('custom_settings'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'active', 'inactive'
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  activatedAt: timestamp('activated_at'),
  lastActivityAt: timestamp('last_activity_at')
});

export const externalUsers = pgTable('external_users', {
  id: varchar('id', { length: 255 }).primaryKey().default(sql`gen_random_uuid()::text`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  companyId: varchar('company_id', { length: 255 }).references(() => externalCompanies.id),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  jobTitle: varchar('job_title', { length: 100 }),
  department: varchar('department', { length: 100 }),
  avatar: varchar('avatar', { length: 500 }),
  role: varchar('role', { length: 50 }).default('user'), // 'admin', 'manager', 'user'
  permissions: jsonb('permissions'),
  accessLevel: varchar('access_level', { length: 50 }),
  aiConversationHistory: jsonb('ai_conversation_history'),
  aiPersonalization: jsonb('ai_personalization'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en'),
  aiAssistanceLevel: varchar('ai_assistance_level', { length: 20 }).default('standard'),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const externalSessions = pgTable('external_sessions', {
  id: varchar('id', { length: 255 }).primaryKey().default(sql`gen_random_uuid()::text`),
  userId: varchar('user_id', { length: 255 }).references(() => externalUsers.id),
  token: varchar('token', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow()
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

// Removed duplicate exports - using PT schema aliases instead

// Commented out - plantResources table aliased to PT tables
// export const insertPlantResourceSchema = createInsertSchema(plantResources, {}).omit({ id: true, createdAt: true });
// export type InsertPlantResource = z.infer<typeof insertPlantResourceSchema>;

// Removed duplicate export - using PT schema alias instead

// Commented out - plannedOrders table not available
// export const insertPlannedOrderSchema = createInsertSchema(plannedOrders, {}).omit({ id: true, createdAt: true });
// export type InsertPlannedOrder = z.infer<typeof insertPlannedOrderSchema>;

export const insertAgentActionSchema = createInsertSchema(agentActions, {
  createdAt: z.date().optional(),
}).omit({ id: true });
export type InsertAgentAction = z.infer<typeof insertAgentActionSchema>;

// Commented out - plannedOrderProductionOrders table not available
// Junction table insert schema for many-to-many relationship
// export const insertPlannedOrderProductionOrderSchema = createInsertSchema(plannedOrderProductionOrders, {}).omit({ id: true, convertedAt: true });

// Insert schemas for both operation types

// Dependencies table not available in PT schema - removed
// export const insertDependencySchema = createInsertSchema(dependencies).omit({ id: true });

export const insertResourceViewSchema = createInsertSchema(resourceViews).omit({ id: true });

export const insertCustomTextLabelSchema = createInsertSchema(customTextLabels).omit({ id: true });

export const insertKanbanConfigSchema = createInsertSchema(kanbanConfigs).omit({ id: true });

export const insertReportConfigSchema = createInsertSchema(reportConfigs).omit({ id: true });

export const insertDashboardConfigSchema = createInsertSchema(dashboardConfigs).omit({ id: true });

export const insertScheduleScenarioSchema = createInsertSchema(scheduleScenarios).omit({ id: true });

// insertResourceRequirementBlockSchema - DELETED: resourceRequirementBlocks table was replaced by ptjobresourceblocks



export const insertScenarioOperationSchema = createInsertSchema(scenarioOperations).omit({ id: true });

export const insertScenarioEvaluationSchema = createInsertSchema(scenarioEvaluations).omit({ id: true });

export const insertScenarioDiscussionSchema = createInsertSchema(scenarioDiscussions).omit({ id: true });

// Systems Management Insert Schemas
export const insertSystemUserSchema = createInsertSchema(systemUsers, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertSystemHealthSchema = createInsertSchema(systemHealth, {
  id: z.number().optional(),
  timestamp: z.date().optional(),
});

export const insertSystemEnvironmentSchema = createInsertSchema(systemEnvironments, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertSystemUpgradeSchema = createInsertSchema(systemUpgrades, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  scheduledDate: z.union([z.string().datetime(), z.date()]).optional(),
  startedAt: z.union([z.string().datetime(), z.date()]).optional(),
  completedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertSystemAuditLogSchema = createInsertSchema(systemAuditLog, {
  id: z.number().optional(),
  timestamp: z.date().optional(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Disruption Management Insert Schemas
export const insertDisruptionSchema = createInsertSchema(disruptions, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertDisruptionActionSchema = createInsertSchema(disruptionActions, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});

export const insertDisruptionEscalationSchema = createInsertSchema(disruptionEscalations, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
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

// Comprehensive Shift Management System
// Resource shift templates - define standard shift patterns
export const shiftTemplates = pgTable("shift_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Day Shift", "Night Shift", "Weekend", etc.
  description: text("description"),
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  shiftType: text("shift_type").notNull(), // regular, overtime, split, rotating
  startTime: text("start_time").notNull(), // HH:MM format (24-hour)
  endTime: text("end_time").notNull(), // HH:MM format (24-hour)
  duration: integer("duration").notNull(), // minutes
  breakDuration: integer("break_duration").default(30), // minutes
  lunchDuration: integer("lunch_duration").default(60), // minutes
  daysOfWeek: jsonb("days_of_week").$type<number[]>().notNull(), // [1,2,3,4,5] = Mon-Fri
  isActive: boolean("is_active").default(true),
  premiumRate: integer("premium_rate").default(0), // percentage (150 = 1.5x pay)
  minimumStaffing: integer("minimum_staffing").default(1),
  maximumStaffing: integer("maximum_staffing"),
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]), // capability IDs
  color: text("color").default("#3B82F6"), // for UI display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resource shift assignments - links resources to shifts for specific periods
export const resourceShiftAssignments = pgTable("resource_shift_assignments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  endDate: timestamp("end_date"), // null = indefinite
  status: text("status").notNull().default("active"), // active, suspended, ended
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  notes: text("notes"),
  isTemporary: boolean("is_temporary").default(false), // for overtime, vacation coverage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift scenarios for capacity planning - test different shift configurations
export const shiftScenarios = pgTable("shift_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  capacityScenarioId: integer("capacity_scenario_id").references(() => capacityPlanningScenarios.id),
  status: text("status").notNull().default("draft"), // draft, active, archived
  createdBy: integer("created_by").references(() => users.id).notNull(),
  simulationResults: jsonb("simulation_results").$type<{
    totalCapacity: number; // units per day
    laborCost: number; // per day
    utilizationRate: number; // percentage
    bottlenecks: Array<{
      resourceType: string;
      shiftName: string;
      capacityGap: number;
    }>;
    recommendations: Array<{
      type: "add_shift" | "extend_shift" | "add_resources" | "redistribute";
      description: string;
      estimatedImpact: number;
      estimatedCost: number;
    }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company holidays and plant-specific closures
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "New Year's Day", "Plant Maintenance Day"
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // federal, state, company, plant_specific
  plantId: integer("plant_id").references(() => PT.ptPlants.id), // null = all plants
  isRecurring: boolean("is_recurring").default(false), // annual holidays
  recurringType: text("recurring_type"), // "annual", "monthly", "custom"
  recurringPattern: jsonb("recurring_pattern").$type<{
    month?: number; // 1-12
    day?: number; // 1-31
    weekOfMonth?: number; // 1-5
    dayOfWeek?: number; // 0-6
  }>(),
  operationalImpact: text("operational_impact").notNull(), // full_closure, reduced_staff, essential_only
  plannedStaffing: integer("planned_staffing").default(0), // number of essential staff
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resource absences - planned and unplanned time off
export const resourceAbsences = pgTable("resource_absences", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  type: text("type").notNull(), // vacation, sick, personal, training, maintenance, breakdown
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, denied, active, completed
  isPlanned: boolean("is_planned").default(true), // false for emergency absences
  reason: text("reason"),
  approvedBy: integer("approved_by").references(() => users.id),
  replacementResourceId: integer("replacement_resource_id").references(() => resources.id),
  impactOnSchedule: text("impact_on_schedule"), // none, minor, major, critical
  operationsNotified: boolean("operations_notified").default(false),
  reschedulingRequired: boolean("rescheduling_required").default(false),
  notes: text("notes"),
  requestedBy: integer("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift coverage tracking - who's covering for absent resources
export const shiftCoverage = pgTable("shift_coverage", {
  id: serial("id").primaryKey(),
  absenceId: integer("absence_id").references(() => resourceAbsences.id).notNull(),
  coveringResourceId: integer("covering_resource_id").references(() => resources.id).notNull(),
  shiftDate: timestamp("shift_date").notNull(),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id).notNull(),
  coverageType: text("coverage_type").notNull(), // full, partial, split
  startTime: text("start_time"), // override shift template if partial
  endTime: text("end_time"), // override shift template if partial
  premiumPay: boolean("premium_pay").default(true), // overtime or premium rates
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  efficiencyRating: integer("efficiency_rating"), // 1-5 after completion
  notes: text("notes"),
  arrangedBy: integer("arranged_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift utilization metrics - track actual vs planned utilization
export const shiftUtilization = pgTable("shift_utilization", {
  id: serial("id").primaryKey(),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id).notNull(),
  date: timestamp("date").notNull(),
  plannedResources: integer("planned_resources").notNull(),
  actualResources: integer("actual_resources").notNull(),
  plannedOutput: integer("planned_output"), // units expected
  actualOutput: integer("actual_output"), // units produced
  utilizationRate: integer("utilization_rate").notNull(), // percentage
  absenteeRate: integer("absentee_rate").notNull(), // percentage
  overtimeHours: integer("overtime_hours").default(0),
  downtimeMinutes: integer("downtime_minutes").default(0),
  qualityScore: integer("quality_score"), // percentage
  safetyIncidents: integer("safety_incidents").default(0),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Smart KPI Meeting system for tracking performance and improvement guidance
export const smartKpiMeetings = pgTable("smart_kpi_meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  meetingType: text("meeting_type").notNull(), // daily_standup, weekly_review, monthly_planning, quarterly_review
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  attendees: jsonb("attendees").$type<number[]>().default([]), // user IDs
  businessGoalsDiscussed: jsonb("business_goals_discussed").$type<string[]>().default([]),
  keyDecisions: jsonb("key_decisions").$type<Array<{
    decision: string;
    owner: number; // user ID
    dueDate: string;
    priority: "high" | "medium" | "low";
  }>>().default([]),
  actionItems: jsonb("action_items").$type<Array<{
    task: string;
    assignee: number; // user ID
    dueDate: string;
    status: "pending" | "in_progress" | "completed" | "delayed";
    kpiImpact: string[]; // KPI IDs that this action affects
  }>>().default([]),
  meetingNotes: text("meeting_notes"),
  nextMeetingDate: timestamp("next_meeting_date"),
  status: text("status").notNull().default("completed"), // scheduled, in_progress, completed, cancelled
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart KPI definitions with business goal alignment
export const smartKpiDefinitions = pgTable("smart_kpi_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // efficiency, quality, delivery, cost, safety, sustainability
  businessStrategy: text("business_strategy").notNull(), // cost_leadership, customer_service, innovation, environmental
  calculationMethod: text("calculation_method").notNull(), // manual, automated, hybrid
  formula: text("formula"), // mathematical formula for calculation
  dataSource: text("data_source"), // where the data comes from
  measurementUnit: text("measurement_unit").notNull(), // percentage, hours, dollars, count, etc.
  targetType: text("target_type").notNull(), // higher_better, lower_better, range_target
  isActive: boolean("is_active").default(true),
  trackingFrequency: text("tracking_frequency_final").notNull(), // real_time, hourly, daily, weekly, monthly
  reportingLevel: text("reporting_level").notNull(), // plant, department, line, resource
  improvementActions: jsonb("improvement_actions").$type<Array<{
    condition: string; // when to trigger this action
    action: string; // what to do
    priority: "high" | "medium" | "low";
    estimatedImpact: string;
  }>>().default([]),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart KPI targets with time-based goals
export const smartKpiTargets = pgTable("smart_kpi_targets", {
  id: serial("id").primaryKey(),
  kpiDefinitionId: integer("kpi_definition_id").references(() => smartKpiDefinitions.id).notNull(),
  businessGoalId: integer("business_goal_id").references(() => businessGoals.id), // Optional relationship to business goals
  targetPeriod: text("target_period").notNull(), // daily, weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  targetValue: numeric("target_value", { precision: 15, scale: 5 }).notNull(),
  minimumAcceptable: numeric("minimum_acceptable", { precision: 15, scale: 5 }),
  stretchGoal: numeric("stretch_goal", { precision: 15, scale: 5 }),
  businessJustification: text("business_justification"),
  contributionToGoal: text("contribution_to_goal"), // How this KPI supports the business goal
  goalWeight: integer("goal_weight").default(100), // Weight percentage this KPI contributes to the business goal (0-100)
  resourcesRequired: jsonb("resources_required").$type<Array<{
    type: string; // labor, equipment, budget, training
    description: string;
    estimatedCost: number;
  }>>().default([]),
  risks: jsonb("risks").$type<Array<{
    risk: string;
    probability: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>>().default([]),
  setBy: integer("set_by").references(() => users.id).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  status: text("status").notNull().default("active"), // draft, active, achieved, missed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart KPI actual performance tracking
export const smartKpiActuals = pgTable("smart_kpi_actuals", {
  id: serial("id").primaryKey(),
  kpiDefinitionId: integer("kpi_definition_id").references(() => smartKpiDefinitions.id).notNull(),
  recordDate: timestamp("record_date").notNull(),
  actualValue: numeric("actual_value", { precision: 15, scale: 5 }).notNull(),
  dataSource: text("data_source").notNull(), // manual_entry, automated_system, calculated
  dataQuality: text("data_quality").notNull().default("good"), // excellent, good, fair, poor
  confidence: integer("confidence").notNull().default(100), // 0-100 percentage
  contextNotes: text("context_notes"), // external factors affecting the measurement
  validationStatus: text("validation_status").notNull().default("pending"), // pending, validated, rejected
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  relatedMeetingId: integer("related_meeting_id").references(() => smartKpiMeetings.id),
  contributingFactors: jsonb("contributing_factors").$type<Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    magnitude: "low" | "medium" | "high";
  }>>().default([]),
  recordedBy: integer("recorded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart KPI improvement initiatives
export const smartKpiImprovements = pgTable("smart_kpi_improvements", {
  id: serial("id").primaryKey(),
  kpiDefinitionId: integer("kpi_definition_id").references(() => smartKpiDefinitions.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  initiativeType: text("initiative_type").notNull(), // process_improvement, training, equipment_upgrade, policy_change
  triggerReason: text("trigger_reason").notNull(), // target_miss, trend_analysis, meeting_decision, external_requirement
  relatedMeetingId: integer("related_meeting_id").references(() => smartKpiMeetings.id),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("planning"), // planning, approved, in_progress, completed, cancelled, on_hold
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedImpact: numeric("estimated_impact", { precision: 5, scale: 2 }), // percentage improvement expected
  actualImpact: numeric("actual_impact", { precision: 5, scale: 2 }), // percentage improvement achieved
  estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 15, scale: 2 }),
  resourcesRequired: jsonb("resources_required").$type<Array<{
    type: string;
    description: string;
    quantity: number;
    cost: number;
  }>>().default([]),
  successCriteria: jsonb("success_criteria").$type<Array<{
    criteria: string;
    measurementMethod: string;
    targetValue: number;
    achieved: boolean;
  }>>().default([]),
  lessonsLearned: text("lessons_learned"),
  recommendedForReplication: boolean("recommended_for_replication").default(false),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart KPI alerts and notifications
export const smartKpiAlerts = pgTable("smart_kpi_alerts", {
  id: serial("id").primaryKey(),
  kpiDefinitionId: integer("kpi_definition_id").references(() => smartKpiDefinitions.id).notNull(),
  alertType: text("alert_type").notNull(), // threshold_breach, trend_warning, target_achievement, data_quality
  severity: text("severity").notNull(), // info, warning, critical
  message: text("message").notNull(),
  triggeredValue: numeric("triggered_value", { precision: 15, scale: 5 }),
  thresholdValue: numeric("threshold_value", { precision: 15, scale: 5 }),
  triggerCondition: text("trigger_condition"), // above, below, equals, trend_up, trend_down
  alertedUsers: jsonb("alerted_users").$type<number[]>().default([]), // user IDs who should be notified
  notificationsSent: jsonb("notifications_sent").$type<Array<{
    userId: number;
    method: "email" | "sms" | "in_app";
    sentAt: string;
    status: "sent" | "failed" | "pending";
  }>>().default([]),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolution: text("resolution"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  status: text("status").notNull().default("active"), // active, acknowledged, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production Scheduler's Cockpit Configuration
export const cockpitLayouts = pgTable("cockpit_layouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  targetPlatform: text("target_platform").notNull().default("both"), // "mobile", "desktop", "both"
  isDefault: boolean("is_default").default(false),
  isShared: boolean("is_shared").default(false), // Can be shared with other users
  sharedWithRoles: jsonb("shared_with_roles").$type<string[]>().default([]), // Role IDs that can access
  gridLayout: jsonb("grid_layout").$type<{
    cols: number; // 12, 16, 20, 24
    rows: number; // 8, 12, 16, 20
    compactType: 'vertical' | 'horizontal' | null;
    margin: [number, number];
    containerPadding: [number, number];
  }>().notNull(),
  theme: text("theme").notNull().default("professional"), // professional, dark, light, custom
  refreshInterval: integer("refresh_interval").notNull().default(30), // seconds
  autoRefresh: boolean("auto_refresh").default(true),
  customStyles: jsonb("custom_styles").$type<{
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    cardStyle?: 'modern' | 'classic' | 'minimal';
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cockpitWidgets = pgTable("cockpit_widgets", {
  id: serial("id").primaryKey(),
  layoutId: integer("layout_id").references(() => cockpitLayouts.id).notNull(),
  type: text("type").notNull(), // kpi, chart, table, alert, gantt, resource_status, schedule_overview
  title: text("title").notNull(),
  subTitle: text("sub_title"),
  targetPlatform: text("target_platform").notNull().default("both"), // "mobile", "desktop", "both"
  position: jsonb("position").$type<{
    x: number; y: number; w: number; h: number;
  }>().notNull(),
  configuration: jsonb("configuration").$type<{
    dataSource: string; // jobs, operations, resources, metrics, alerts
    filters?: {
      plantId?: number;
      priority?: string[];
      status?: string[];
      dateRange?: { start: string; end: string };
      resourceTypes?: string[];
    };
    chartType?: 'line' | 'bar' | 'pie' | 'gauge' | 'number' | 'progress';
    metrics?: string[]; // which metrics to display
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
    groupBy?: string; // field to group data by
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number; // max records to show
    colors?: string[];
    thresholds?: Array<{ value: number; color: string; label?: string }>;
    drillDownTarget?: string; // page to navigate to on click
    drillDownParams?: Record<string, any>;
    refreshInterval?: number; // override layout refresh
    alerts?: {
      enabled: boolean;
      conditions: Array<{
        field: string;
        operator: '>' | '<' | '=' | '!=' | 'contains';
        value: any;
        severity: 'info' | 'warning' | 'error' | 'critical';
      }>;
    };
  }>().notNull(),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cockpitAlerts = pgTable("cockpit_alerts", {
  id: serial("id").primaryKey(),
  widgetId: integer("widget_id").references(() => cockpitWidgets.id).notNull(),
  severity: text("severity").notNull(), // info, warning, error, critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(), // system, user, ai
  status: text("status").notNull().default("active"), // active, acknowledged, resolved
  triggerCondition: jsonb("trigger_condition").$type<{
    field: string;
    operator: string;
    value: any;
    actualValue: any;
  }>(),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cockpitTemplates = pgTable("cockpit_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // production, quality, maintenance, management
  industryType: text("industry_type"), // automotive, aerospace, electronics, general
  targetRole: text("target_role"), // scheduler, manager, supervisor, operator
  layout: jsonb("layout").$type<{
    gridLayout: any;
    widgets: Array<{
      type: string;
      title: string;
      position: { x: number; y: number; w: number; h: number };
      configuration: any;
    }>;
  }>().notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(0), // 1-5 stars
  isOfficial: boolean("is_official").default(false), // created by system vs user
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workspace-specific dashboards for production schedule pages
export const workspaceDashboards = pgTable("workspace_dashboards", {
  id: serial("id").primaryKey(),
  pageIdentifier: text("page_identifier").notNull(), // production-schedule, capacity-planning, etc.
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(), // Workspace identifier via plant
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Dashboard configuration
  configuration: jsonb("configuration").$type<{
    layout: {
      type: 'grid' | 'flex' | 'masonry';
      columns: number;
      gap: number;
      padding: number;
    };
    widgets: Array<{
      id: string;
      type: 'kpi' | 'chart' | 'table' | 'alert' | 'metric' | 'progress' | 'custom';
      title: string;
      subtitle?: string;
      position: { x: number; y: number; w: number; h: number };
      configuration: {
        dataSource?: string;
        filters?: Record<string, any>;
        chartType?: string;
        metrics?: string[];
        aggregation?: string;
        refreshInterval?: number;
        thresholds?: Array<{ value: number; color: string; label?: string }>;
        customConfig?: Record<string, any>;
      };
      isVisible: boolean;
    }>;
    refreshInterval: number;
    autoRefresh: boolean;
    theme: string;
  }>().notNull(),
  
  // Access and sharing
  isShared: boolean("is_shared").default(true), // Shared across workspace by default
  sharedWithRoles: jsonb("shared_with_roles").$type<string[]>().default([]), // Role-based access
  
  // Audit trail
  createdBy: integer("created_by").references(() => users.id).notNull(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one active dashboard per page per workspace
  pageWorkspaceActiveUnique: unique().on(table.pageIdentifier, table.plantId, table.isActive),
  pageIdentifierIdx: index("workspace_dashboards_page_idx").on(table.pageIdentifier),
  plantIdIdx: index("workspace_dashboards_plant_idx").on(table.plantId),
}));

// Comprehensive Alerts System
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, high, medium, low, info
  status: text("status").notNull().default("active"), // active, acknowledged, resolved, escalated, dismissed
  type: text("type").notNull(), // production, quality, maintenance, inventory, resource, schedule, ai_detected, custom
  category: text("category"), // delay, breakdown, quality_issue, shortage, capacity, safety, performance
  
  // Entity associations
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  departmentId: integer("department_id").references(() => departments.id),
  resourceId: integer("resource_id").references(() => resources.id),
  jobId: integer("job_id").references(() => productionOrders.id),
  operationId: integer("operation_id").references(() => ptJobOperations.id),
  itemId: integer("item_id").references(() => items.id),
  
  // Alert metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  metrics: jsonb("metrics").$type<{
    currentValue?: number;
    thresholdValue?: number;
    deviation?: number;
    trend?: 'up' | 'down' | 'stable';
    impactScore?: number; // 1-100
  }>().default({}),
  
  // AI-generated insights
  aiGenerated: boolean("ai_generated").default(false),
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 2 }), // 0-100%
  aiInsights: text("ai_insights"),
  aiModel: text("ai_model"), // which AI model generated this
  suggestedActions: jsonb("suggested_actions").$type<string[]>().default([]),
  
  // Learning and improvement
  trainingData: jsonb("training_data").$type<{
    userFeedback?: 'helpful' | 'not_helpful' | 'neutral';
    actionTaken?: string;
    outcomeEffective?: boolean;
    improvementNotes?: string;
  }>().default({}),
  
  // Alert rules and conditions
  alertRule: jsonb("alert_rule").$type<{
    condition: {
      field: string;
      operator: '>' | '<' | '=' | '!=' | 'between' | 'contains' | 'trend';
      value: any;
      value2?: any; // for between operator
    };
    frequency?: 'once' | 'recurring' | 'continuous';
    cooldownMinutes?: number;
  }>(),
  
  // Notification settings
  notificationChannels: jsonb("notification_channels").$type<string[]>().default(['in_app']), // in_app, email, sms, teams, slack
  notificationsSent: jsonb("notifications_sent").$type<Array<{
    channel: string;
    sentAt: string;
    recipient: string;
    status: 'sent' | 'failed' | 'pending';
  }>>().default([]),
  
  // Alert lifecycle
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: integer("escalated_to").references(() => users.id),
  dismissedAt: timestamp("dismissed_at"),
  dismissedBy: integer("dismissed_by").references(() => users.id),
  
  // Resolution details
  resolution: text("resolution"),
  rootCause: text("root_cause"),
  preventiveMeasures: text("preventive_measures"),
  estimatedDowntime: numeric("estimated_downtime", { precision: 10, scale: 2 }), // in minutes
  actualDowntime: numeric("actual_downtime", { precision: 10, scale: 2 }), // in minutes
  estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 15, scale: 2 }),
  
  // Priority and scheduling
  priority: integer("priority").default(50), // 1-100, higher is more urgent
  dueDate: timestamp("due_date"),
  slaMinutes: integer("sla_minutes"), // SLA for resolution in minutes
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: jsonb("recurring_pattern").$type<{
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[]; // 0-6
    dayOfMonth?: number;
    endDate?: string;
  }>(),
  
  // Related alerts
  parentAlertId: integer("parent_alert_id").references(() => alerts.id),
  relatedAlertIds: jsonb("related_alert_ids").$type<number[]>().default([]),
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  severityIdx: index().on(table.severity),
  statusIdx: index().on(table.status),
  typeIdx: index().on(table.type),
  plantIdx: index().on(table.plantId),
  createdAtIdx: index().on(table.createdAt),
  priorityIdx: index().on(table.priority),
}));

// Alert Comments and Activity Log
export const alertComments = pgTable("alert_comments", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]), // URLs or base64
  isInternal: boolean("is_internal").default(false), // internal notes vs customer-visible
  createdAt: timestamp("created_at").defaultNow(),
});

// Alert Templates for common issues
export const alertTemplates = pgTable("alert_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  category: text("category"),
  severity: text("severity").notNull(),
  defaultTitle: text("default_title").notNull(),
  defaultDescription: text("default_description").notNull(),
  suggestedActions: jsonb("suggested_actions").$type<string[]>().default([]),
  alertRule: jsonb("alert_rule").$type<any>(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Alert Training Data
export const alertTrainingData = pgTable("alert_training_data", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  contextData: jsonb("context_data").$type<any>().notNull(), // System state when alert was created
  alertAccuracy: text("alert_accuracy"), // accurate, false_positive, missed
  userAction: text("user_action"), // what action the user took
  outcome: text("outcome"), // successful, partially_successful, unsuccessful
  feedbackNotes: text("feedback_notes"),
  improvementSuggestions: text("improvement_suggestions"),
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Alert Subscription Preferences
export const alertSubscriptions = pgTable("alert_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  alertTypes: jsonb("alert_types").$type<string[]>().default([]), // which types to subscribe to
  severities: jsonb("severities").$type<string[]>().default(['critical', 'high']),
  plants: jsonb("plants").$type<number[]>().default([]), // empty means all plants
  departments: jsonb("departments").$type<number[]>().default([]),
  notificationChannels: jsonb("notification_channels").$type<{
    inApp: boolean;
    email: boolean;
    sms: boolean;
    teams: boolean;
    slack: boolean;
  }>().default({ inApp: true, email: false, sms: false, teams: false, slack: false }),
  quietHours: jsonb("quiet_hours").$type<{
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    timezone: string;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Canvas Content Storage
export const canvasContent = pgTable("canvas_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull(), // Groups content from same conversation session
  itemData: jsonb("item_data").$type<{
    id: string;
    type: 'dashboard' | 'chart' | 'table' | 'image' | 'interactive' | 'custom';
    title: string;
    content: any;
    width?: string;
    height?: string;
    position?: { x: number; y: number };
  }>().notNull(),
  displayOrder: integer("display_order").notNull().default(0), // Higher numbers appear at top
  createdAt: timestamp("created_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
});

// Plant KPI Targets - Define target KPIs for each plant with weights
export const plantKpiTargets = pgTable("plant_kpi_targets", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  kpiName: text("kpi_name").notNull(), // OEE, Throughput, Quality, Schedule_Adherence, Cost_Per_Unit, etc.
  kpiType: text("kpi_type").notNull(), // percentage, rate, currency, time, count
  targetValue: numeric("target_value", { precision: 15, scale: 5 }).notNull(),
  unitOfMeasure: text("unit_of_measure"), // %, units/hr, $, minutes, etc.
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull().default("1.0"), // Relative importance (0.1 to 10.0)
  isActive: boolean("is_active").default(true),
  description: text("description"),
  // Performance thresholds
  excellentThreshold: numeric("excellent_threshold", { precision: 15, scale: 5 }), // 95%+ of target
  goodThreshold: numeric("good_threshold", { precision: 15, scale: 5 }), // 90%+ of target
  warningThreshold: numeric("warning_threshold", { precision: 15, scale: 5 }), // 80%+ of target
  // Calculation settings
  calculationMethod: text("calculation_method").default("direct"), // direct, rolling_average, cumulative
  rollingPeriodDays: integer("rolling_period_days").default(7),
  dataSource: text("data_source"), // table/field reference for calculation
  dataSourceQuery: text("data_source_query"), // SQL query for complex calculations
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  plantKpiIdx: index().on(table.plantId, table.kpiName),
  uniquePlantKpi: unique().on(table.plantId, table.kpiName),
}));

// Plant KPI Performance History - Actual performance data over time
export const plantKpiPerformance = pgTable("plant_kpi_performance", {
  id: serial("id").primaryKey(),
  plantKpiTargetId: integer("plant_kpi_target_id").references(() => plantKpiTargets.id).notNull(),
  measurementDate: timestamp("measurement_date").notNull(),
  actualValue: numeric("actual_value", { precision: 15, scale: 5 }).notNull(),
  targetValue: numeric("target_value", { precision: 15, scale: 5 }).notNull(),
  performanceRatio: numeric("performance_ratio", { precision: 5, scale: 4 }), // actual/target
  performanceGrade: text("performance_grade"), // excellent, good, warning, critical
  dataSource: text("data_source"), // How this measurement was obtained
  calculationDetails: jsonb("calculation_details").$type<{
    baseData?: any;
    calculationMethod?: string;
    aggregationPeriod?: string;
    excludedData?: any;
    notes?: string;
  }>(),
  isCalculated: boolean("is_calculated").default(true), // vs manually entered
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  measurementDateIdx: index().on(table.measurementDate),
  kpiTargetDateIdx: index().on(table.plantKpiTargetId, table.measurementDate),
}));

// Autonomous Optimization Configuration
export const autonomousOptimization = pgTable("autonomous_optimization", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  isEnabled: boolean("is_enabled").default(false),
  
  // Optimization objectives
  optimizationObjective: text("optimization_objective").notNull().default("weighted_kpi"), // weighted_kpi, single_kpi, multi_objective
  targetKpiIds: jsonb("target_kpi_ids").$type<number[]>().default([]), // References to plantKpiTargets
  
  // Algorithm configuration
  allowedAlgorithms: jsonb("allowed_algorithms").$type<string[]>().default(['ASAP', 'ALAP', 'CRITICAL_PATH', 'LEVEL_RESOURCES', 'DRUM_TOC']),
  currentAlgorithm: text("current_algorithm").default("ASAP"),
  autoAlgorithmSelection: boolean("auto_algorithm_selection").default(true),
  
  // Parameter tuning settings
  enableParameterTuning: boolean("enable_parameter_tuning").default(true),
  tunableParameters: jsonb("tunable_parameters").$type<{
    [algorithmName: string]: {
      [parameterName: string]: {
        currentValue: number;
        minValue: number;
        maxValue: number;
        stepSize: number;
        autoTune: boolean;
      };
    };
  }>().default({}),
  
  // Learning and adaptation
  learningMode: text("learning_mode").default("active"), // active, passive, disabled
  performanceThreshold: numeric("performance_threshold", { precision: 5, scale: 2 }).default("0.90"), // When to trigger optimization
  evaluationPeriodMinutes: integer("evaluation_period_minutes").default(60), // How often to evaluate performance
  adaptationSensitivity: text("adaptation_sensitivity").default("medium"), // low, medium, high
  
  // Constraints and safety
  maxChangesPerDay: integer("max_changes_per_day").default(5),
  requiredApproval: boolean("required_approval").default(true),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Results tracking
  totalOptimizations: integer("total_optimizations").default(0),
  successfulOptimizations: integer("successful_optimizations").default(0),
  lastOptimizationAt: timestamp("last_optimization_at"),
  lastPerformanceScore: numeric("last_performance_score", { precision: 5, scale: 4 }),
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  plantIdx: index().on(table.plantId),
  enabledIdx: index().on(table.isEnabled),
}));

// Optimization History - Track all optimization attempts and results
export const optimizationHistory = pgTable("optimization_history", {
  id: serial("id").primaryKey(),
  autonomousOptimizationId: integer("autonomous_optimization_id").references(() => autonomousOptimization.id).notNull(),
  optimizationType: text("optimization_type").notNull(), // algorithm_change, parameter_tuning, schedule_adjustment
  
  // What was changed
  previousConfiguration: jsonb("previous_configuration").$type<{
    algorithm?: string;
    parameters?: any;
    scheduleState?: any;
  }>(),
  newConfiguration: jsonb("new_configuration").$type<{
    algorithm?: string;
    parameters?: any;
    scheduleState?: any;
  }>(),
  
  // Why the change was made
  triggerReason: text("trigger_reason"), // poor_performance, scheduled_evaluation, manual_trigger
  performanceBeforeOptimization: jsonb("performance_before_optimization").$type<{
    kpiScores: Array<{ kpiId: number; value: number; target: number; ratio: number }>;
    weightedScore: number;
    timestamp: string;
  }>(),
  
  // Results
  optimizationStatus: text("optimization_status").default("pending"), // pending, running, completed, failed, rolled_back
  performanceAfterOptimization: jsonb("performance_after_optimization").$type<{
    kpiScores: Array<{ kpiId: number; value: number; target: number; ratio: number }>;
    weightedScore: number;
    timestamp: string;
  }>(),
  performanceImprovement: numeric("performance_improvement", { precision: 5, scale: 4 }), // positive = improvement
  
  // Execution details
  executionStartedAt: timestamp("execution_started_at"),
  executionCompletedAt: timestamp("execution_completed_at"),
  executionDurationMinutes: integer("execution_duration_minutes"),
  errorMessage: text("error_message"),
  
  // Approval workflow
  requiresApproval: boolean("requires_approval").default(false),
  approvalStatus: text("approval_status").default("auto_approved"), // pending, approved, rejected, auto_approved
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  optimizationIdIdx: index().on(table.autonomousOptimizationId),
  statusIdx: index().on(table.optimizationStatus),
  createdAtIdx: index().on(table.createdAt),
}));

// Alert schemas for insert/select operations
export const insertAlertSchema = createInsertSchema(alerts, {
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['active', 'acknowledged', 'resolved', 'escalated', 'dismissed']),
  type: z.enum(['production', 'quality', 'maintenance', 'inventory', 'resource', 'schedule', 'ai_detected', 'custom']),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAlertCommentSchema = createInsertSchema(alertComments).omit({ id: true, createdAt: true });
export const insertAlertTemplateSchema = createInsertSchema(alertTemplates).omit({ id: true, createdAt: true });
export const insertAlertTrainingDataSchema = createInsertSchema(alertTrainingData).omit({ id: true, createdAt: true });
export const insertAlertSubscriptionSchema = createInsertSchema(alertSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertComment = typeof alertComments.$inferSelect;
export type InsertAlertComment = z.infer<typeof insertAlertCommentSchema>;
export type AlertTemplate = typeof alertTemplates.$inferSelect;
export type InsertAlertTemplate = z.infer<typeof insertAlertTemplateSchema>;
export type AlertTrainingData = typeof alertTrainingData.$inferSelect;
export type InsertAlertTrainingData = z.infer<typeof insertAlertTrainingDataSchema>;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type InsertAlertSubscription = z.infer<typeof insertAlertSubscriptionSchema>;

// User settings for canvas retention
export const canvasSettings = pgTable("canvas_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  retentionDays: integer("retention_days").notNull().default(30),
  autoScroll: boolean("auto_scroll").default(true),
  maxItemsPerSession: integer("max_items_per_session").default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presentation System - stores presentation templates and content
export const presentations = pgTable("presentations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // sales, training, consulting, custom
  audience: text("audience"), // specific customer name or role
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isTemplate: boolean("is_template").default(false), // true for reusable templates
  isPublic: boolean("is_public").default(false), // can be used by other users
  tags: jsonb("tags").$type<string[]>().default([]), // searchable tags
  thumbnail: text("thumbnail"), // base64 image or URL
  estimatedDuration: integer("estimated_duration"), // minutes
  targetRoles: jsonb("target_roles").$type<string[]>().default([]), // which roles this is designed for
  customization: jsonb("customization").$type<{
    customerName?: string;
    industry?: string;
    specificNeeds?: string[];
    customBranding?: {
      logo?: string;
      colors?: { primary: string; secondary: string };
      fonts?: string;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual slides within presentations
export const presentationSlides = pgTable("presentation_slides", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  slideOrder: integer("slide_order").notNull(),
  title: text("title").notNull(),
  slideType: text("slide_type").notNull(), // title, content, demo, transition, summary, etc.
  content: jsonb("content").$type<{
    text?: string;
    bullets?: string[];
    images?: { url: string; caption?: string; position?: string }[];
    charts?: any[];
    demoStep?: {
      route: string;
      action?: string;
      highlights?: string[];
      interaction?: string;
    };
    notes?: string; // presenter notes
    transitions?: {
      animation?: string;
      duration?: number;
    };
  }>().notNull(),
  layout: text("layout").default("standard"), // standard, two-column, full-image, demo-split
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#000000"),
  duration: integer("duration"), // seconds to display this slide
  voiceNarration: text("voice_narration"), // AI-generated or custom script
  isInteractive: boolean("is_interactive").default(false), // requires user interaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration with tour system
export const presentationTourIntegrations = pgTable("presentation_tour_integrations", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  tourId: integer("tour_id").references(() => tours.id).notNull(),
  integrationMode: text("integration_mode").notNull(), // 'interleaved', 'before', 'after', 'parallel'
  slideMapping: jsonb("slide_mapping").$type<Array<{
    slideId: number;
    tourStepId: number;
    timing: 'before' | 'after' | 'during';
    transitionType: 'fade' | 'slide' | 'instant';
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Presentation library and sharing
export const presentationLibrary = pgTable("presentation_library", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  category: text("category").notNull(), // sales-templates, training-modules, industry-specific, customer-custom
  subcategory: text("subcategory"), // automotive, healthcare, manufacturing-101, etc.
  downloadCount: integer("download_count").default(0),
  rating: integer("rating").default(0), // average rating 1-5
  ratingCount: integer("rating_count").default(0),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Presentation analytics and usage tracking
export const presentationAnalytics = pgTable("presentation_analytics", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  sessionId: text("session_id").notNull(), // unique session identifier
  presentedBy: integer("presented_by").references(() => users.id).notNull(),
  audienceType: text("audience_type"), // internal, customer, prospect, partner
  audienceSize: integer("audience_size"),
  duration: integer("duration"), // actual presentation duration in minutes
  slidesViewed: integer("slides_viewed"),
  interactionCount: integer("interaction_count"), // demo interactions during presentation
  feedback: jsonb("feedback").$type<{
    rating?: number;
    comments?: string;
    effectiveness?: number;
    engagement?: number;
  }>(),
  completionRate: integer("completion_rate"), // percentage of presentation completed
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated content cache for presentations
export const presentationAIContent = pgTable("presentation_ai_content", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  slideId: integer("slide_id").references(() => presentationSlides.id),
  contentType: text("content_type").notNull(), // voice, text, image, chart
  prompt: text("prompt").notNull(), // original AI prompt
  generatedContent: jsonb("generated_content").notNull(),
  model: text("model").notNull(), // AI model used
  cost: integer("cost"), // API cost in cents
  quality: integer("quality"), // 1-5 quality rating
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Presentation Studio - Raw materials and content storage
export const presentationMaterials = pgTable("presentation_materials", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  materialType: text("material_type").notNull(), // case_study, statistics, research, images, documents, video, audio, data_sheet, testimonial, competitive_analysis
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content").$type<{
    // For case studies
    caseStudy?: {
      company: string;
      industry: string;
      challenge: string;
      solution: string;
      results: string[];
      metrics?: { name: string; before: string; after: string; improvement: string }[];
      timeline: string;
      customerQuote?: string;
      customerRole?: string;
    };
    // For statistics/data
    statistics?: {
      source: string;
      date: string;
      data: Array<{ metric: string; value: string; context?: string }>;
      methodology?: string;
      sampleSize?: string;
    };
    // For research/reports
    research?: {
      title: string;
      authors: string[];
      publication: string;
      date: string;
      keyFindings: string[];
      relevantQuotes: string[];
      methodology?: string;
    };
    // For media files
    media?: {
      fileType: string; // image, video, audio, pdf, excel, powerpoint
      fileName: string;
      fileUrl: string;
      fileSize: number;
      transcript?: string; // for audio/video
      keyPoints?: string[]; // extracted key information
    };
    // For testimonials
    testimonial?: {
      customerName: string;
      company: string;
      role: string;
      quote: string;
      context: string;
      useCase: string;
      metrics?: string[];
    };
    // Raw text content
    text?: string;
  }>().notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  source: text("source"), // where this material came from
  credibility: integer("credibility"), // 1-5 credibility rating
  relevanceScore: integer("relevance_score"), // AI-calculated relevance to presentation
  usageCount: integer("usage_count").default(0), // how many times used in slides
  isVerified: boolean("is_verified").default(false), // manually verified by user
  aiSuggestions: jsonb("ai_suggestions").$type<{
    bestSlideTypes: string[]; // which slide types this material works best for
    suggestedUsage: string; // AI suggestion on how to use this material
    contentGaps?: string[]; // what additional content might be needed
    qualityScore: number; // 1-10 AI assessment of material quality
  }>(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presentation Studio - Content suggestions and templates
export const presentationContentSuggestions = pgTable("presentation_content_suggestions", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentation_id").references(() => presentations.id).notNull(),
  category: text("category").notNull(), // based on presentation type
  suggestionType: text("suggestion_type").notNull(), // material_needed, content_gap, improvement, structure
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  suggestedMaterials: jsonb("suggested_materials").$type<string[]>().default([]), // types of materials that would help
  aiReasoning: text("ai_reasoning"), // why AI suggests this
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, completed
  createdBy: text("created_by").notNull().default("AI"), // AI or user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presentation Studio - Project workspace
export const presentationProjects = pgTable("presentation_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  presentationType: text("presentation_type").notNull(), // sales, training, consulting, executive, technical, marketing
  targetAudience: text("target_audience").notNull(),
  objectives: jsonb("objectives").$type<string[]>().default([]),
  duration: integer("duration"), // estimated minutes
  status: text("status").notNull().default("planning"), // planning, researching, drafting, reviewing, finalizing, completed
  collaborators: jsonb("collaborators").$type<number[]>().default([]), // user IDs
  deadline: timestamp("deadline"),
  presentationId: integer("presentation_id").references(() => presentations.id), // linked presentation when created
  aiProfile: jsonb("ai_profile").$type<{
    tone: string; // professional, friendly, authoritative, conversational
    complexity: string; // beginner, intermediate, advanced, executive
    focusAreas: string[]; // key topics to emphasize
    restrictions: string[]; // what to avoid
  }>(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types already defined above - removing duplicates to avoid conflicts
// export type Capability = typeof capabilities.$inferSelect;
// export type Resource = typeof resources.$inferSelect;
// PlantResource now uses PT tables
// export type PlantResource = typeof plantResources.$inferSelect;
// export type ProductionOrder = typeof productionOrders.$inferSelect;
// PlannedOrder now uses PT tables
// export type PlannedOrder = typeof plannedOrders.$inferSelect;

// Junction table types for many-to-many relationship - commented out as tables don't exist
// export type PlannedOrderProductionOrder = typeof plannedOrderProductionOrders.$inferSelect;
// export type InsertPlannedOrderProductionOrder = z.infer<typeof insertPlannedOrderProductionOrderSchema>;



// export type InsertDependency = z.infer<typeof insertDependencySchema>;
// export type Dependency = typeof dependencies.$inferSelect;

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

// InsertResourceRequirementBlock - DELETED: resourceRequirementBlocks table was replaced by ptjobresourceblocks
// ResourceRequirementBlock - DELETED: resourceRequirementBlocks table was replaced by ptjobresourceblocks



export type InsertScenarioEvaluation = z.infer<typeof insertScenarioEvaluationSchema>;
export type ScenarioEvaluation = typeof scenarioEvaluations.$inferSelect;

export type InsertScenarioDiscussion = z.infer<typeof insertScenarioDiscussionSchema>;
export type ScenarioDiscussion = typeof scenarioDiscussions.$inferSelect;

// Systems Management Types
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type SystemUser = typeof systemUsers.$inferSelect;

export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;
export type SystemHealth = typeof systemHealth.$inferSelect;

// KPI and Autonomous Optimization Types
export const insertPlantKpiTargetSchema = createInsertSchema(plantKpiTargets, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type InsertPlantKpiTarget = z.infer<typeof insertPlantKpiTargetSchema>;
export type PlantKpiTarget = typeof plantKpiTargets.$inferSelect;

export const insertPlantKpiPerformanceSchema = createInsertSchema(plantKpiPerformance, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});
export type InsertPlantKpiPerformance = z.infer<typeof insertPlantKpiPerformanceSchema>;
export type PlantKpiPerformance = typeof plantKpiPerformance.$inferSelect;

export const insertAutonomousOptimizationSchema = createInsertSchema(autonomousOptimization, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type InsertAutonomousOptimization = z.infer<typeof insertAutonomousOptimizationSchema>;
export type AutonomousOptimization = typeof autonomousOptimization.$inferSelect;

export const insertOptimizationHistorySchema = createInsertSchema(optimizationHistory, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});
export type InsertOptimizationHistory = z.infer<typeof insertOptimizationHistorySchema>;
export type OptimizationHistory = typeof optimizationHistory.$inferSelect;

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

// Canvas Content Types
export type InsertCanvasContent = z.infer<typeof insertCanvasContentSchema>;
export type CanvasContent = typeof canvasContent.$inferSelect;

export type InsertCanvasSettings = z.infer<typeof insertCanvasSettingsSchema>;
export type CanvasSettings = typeof canvasSettings.$inferSelect;

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

// Canvas Content Insert Schemas
export const insertCanvasContentSchema = createInsertSchema(canvasContent).omit({
  id: true,
  createdAt: true,
});

export const insertCanvasSettingsSchema = createInsertSchema(canvasSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Cockpit Insert Schemas
export const insertCockpitLayoutSchema = createInsertSchema(cockpitLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Playbook Insert Schemas
export const insertPlaybookSchema = createInsertSchema(playbooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaybookCollaboratorSchema = createInsertSchema(playbookCollaborators).omit({
  id: true,
  addedAt: true,
});

export const insertPlaybookHistorySchema = createInsertSchema(playbookHistory).omit({
  id: true,
  editedAt: true,
});

export const insertPlaybookUsageSchema = createInsertSchema(playbookUsage).omit({
  id: true,
  usedAt: true,
});

// Playbook Types
export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;

export type PlaybookCollaborator = typeof playbookCollaborators.$inferSelect;
export type InsertPlaybookCollaborator = z.infer<typeof insertPlaybookCollaboratorSchema>;

export type PlaybookHistory = typeof playbookHistory.$inferSelect;
export type InsertPlaybookHistory = z.infer<typeof insertPlaybookHistorySchema>;

export type PlaybookUsage = typeof playbookUsage.$inferSelect;
export type InsertPlaybookUsage = z.infer<typeof insertPlaybookUsageSchema>;

export const insertCockpitWidgetSchema = createInsertSchema(cockpitWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCockpitAlertSchema = createInsertSchema(cockpitAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertCockpitTemplateSchema = createInsertSchema(cockpitTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceDashboardSchema = createInsertSchema(workspaceDashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastModifiedAt: true,
});

// Cockpit Types
export type InsertCockpitLayout = z.infer<typeof insertCockpitLayoutSchema>;
export type CockpitLayout = typeof cockpitLayouts.$inferSelect;

export type InsertCockpitWidget = z.infer<typeof insertCockpitWidgetSchema>;
export type CockpitWidget = typeof cockpitWidgets.$inferSelect;

export type InsertCockpitAlert = z.infer<typeof insertCockpitAlertSchema>;
export type CockpitAlert = typeof cockpitAlerts.$inferSelect;

export type WorkspaceDashboard = typeof workspaceDashboards.$inferSelect;
export type InsertWorkspaceDashboard = z.infer<typeof insertWorkspaceDashboardSchema>;

export type InsertCockpitTemplate = z.infer<typeof insertCockpitTemplateSchema>;
export type CockpitTemplate = typeof cockpitTemplates.$inferSelect;

// Stock Management Tables
export const stockItems = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  type: text("type").notNull().default("raw_material"), // raw_material, work_in_progress, finished_goods, consumables
  unitOfMeasure: text("unit_of_measure").notNull().default("units"),
  standardCost: integer("standard_cost").notNull().default(0), // in cents
  averageCost: integer("average_cost").notNull().default(0), // in cents
  supplier: text("supplier"),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  minStockLevel: integer("min_stock_level").notNull().default(0),
  maxStockLevel: integer("max_stock_level").notNull().default(1000),
  reorderPoint: integer("reorder_point").notNull().default(0),
  economicOrderQuantity: integer("economic_order_quantity").notNull().default(100),
  safetyStock: integer("safety_stock").notNull().default(0),
  abcClassification: text("abc_classification").default("B"), // A, B, C classification
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => stockItems.id).notNull(),
  transactionType: text("transaction_type").notNull(), // receipt, issue, adjustment, transfer, scrap, return
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost").default(0), // in cents
  totalValue: integer("total_value").default(0), // in cents
  referenceNumber: text("reference_number"), // PO number, work order, etc.
  reason: text("reason"),
  location: text("location").notNull().default("main_warehouse"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockBalances = pgTable("stock_balances", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => stockItems.id).notNull(),
  location: text("location").notNull().default("main_warehouse"),
  quantityOnHand: integer("quantity_on_hand").notNull().default(0),
  quantityAllocated: integer("quantity_allocated").notNull().default(0),
  quantityOnOrder: integer("quantity_on_order").notNull().default(0),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  lastTransactionDate: timestamp("last_transaction_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  itemLocationIdx: unique().on(table.itemId, table.location),
}));

// Demand Planning Tables
export const demandForecasts = pgTable("demand_forecasts", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull(), // Will be FK to stocks.id when stocks table is moved up
  forecastPeriod: text("forecast_period").notNull(), // daily, weekly, monthly, quarterly
  forecastDate: timestamp("forecast_date").notNull(),
  forecastQuantity: integer("forecast_quantity").notNull(),
  actualQuantity: integer("actual_quantity"), // filled when actual data is available
  forecastMethod: text("forecast_method").notNull(), // moving_average, exponential_smoothing, linear_regression, seasonal_decomposition
  confidence_interval: jsonb("confidence_interval").$type<{
    lower_bound: number;
    upper_bound: number;
    confidence_level: number;
  }>(),
  seasonality_factor: integer("seasonality_factor").default(100), // percentage multiplier
  trend_factor: integer("trend_factor").default(100), // percentage multiplier
  accuracy_metrics: jsonb("accuracy_metrics").$type<{
    mean_absolute_error: number;
    mean_squared_error: number;
    mean_absolute_percentage_error: number;
    forecast_bias: number;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const demandForecastsRelations = relations(demandForecasts, ({ one }) => ({
  stock: one(stocks, {
    fields: [demandForecasts.stockId],
    references: [stocks.id],
  }),
}));

export const demandDrivers = pgTable("demand_drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // seasonal, promotional, economic, competitive, internal
  impact_factor: integer("impact_factor").notNull().default(100), // percentage impact
  isActive: boolean("is_active").default(true),
  applicableItems: jsonb("applicable_items").$type<number[]>().default([]), // item IDs affected
  createdAt: timestamp("created_at").defaultNow(),
});

export const demandHistory = pgTable("demand_history", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => stockItems.id).notNull(),
  period: timestamp("period").notNull(),
  actualDemand: integer("actual_demand").notNull(),
  salesQuantity: integer("sales_quantity").default(0),
  returnQuantity: integer("return_quantity").default(0),
  promotionalImpact: integer("promotional_impact").default(0),
  seasonalAdjustment: integer("seasonal_adjustment").default(100), // percentage
  baselineDemand: integer("baseline_demand"),
  drivingFactors: jsonb("driving_factors").$type<Array<{
    driver_id: number;
    impact_percentage: number;
    notes?: string;
  }>>().default([]),
  dataSource: text("data_source").notNull().default("manual"), // manual, erp, sales_system, pos
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  itemPeriodIdx: unique().on(table.itemId, table.period),
}));

export const stockOptimizationScenarios = pgTable("stock_optimization_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("reorder_optimization"), // reorder_optimization, safety_stock_optimization, abc_analysis
  status: text("status").notNull().default("draft"), // draft, running, completed, failed
  parameters: jsonb("parameters").$type<{
    service_level_target?: number; // percentage
    carrying_cost_rate?: number; // annual percentage
    ordering_cost?: number; // cost per order
    stockout_cost_rate?: number; // percentage of item value
    forecast_horizon_days?: number;
    include_seasonality?: boolean;
    optimization_method?: string;
  }>().default({}),
  results: jsonb("results").$type<{
    total_inventory_value_before?: number;
    total_inventory_value_after?: number;
    total_carrying_cost_savings?: number;
    service_level_improvement?: number;
    items_analyzed?: number;
    items_modified?: number;
    recommendations_count?: number;
  }>(),
  createdBy: integer("created_by"),
  runStartTime: timestamp("run_start_time"),
  runEndTime: timestamp("run_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const optimizationRecommendations = pgTable("optimization_recommendations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => stockOptimizationScenarios.id).notNull(),
  itemId: integer("item_id").references(() => stockItems.id).notNull(),
  recommendationType: text("recommendation_type").notNull(), // reorder_point, safety_stock, order_quantity, abc_classification
  currentValue: integer("current_value").notNull(),
  recommendedValue: integer("recommended_value").notNull(),
  potentialSavings: integer("potential_savings"), // in cents annually
  impactAnalysis: jsonb("impact_analysis").$type<{
    inventory_reduction?: number;
    service_level_impact?: number;
    carrying_cost_change?: number;
    ordering_frequency_change?: number;
    risk_assessment?: string;
  }>(),
  confidence_score: integer("confidence_score").default(50), // 0-100
  implementation_priority: text("implementation_priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, approved, implemented, rejected
  reasoning: text("reasoning"),
  approvedBy: integer("approved_by"),
  implementedBy: integer("implemented_by"),
  approvedAt: timestamp("approved_at"),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Workflow Automation System - Integrates with Extension Studio

// Workflow automation triggers that can activate when certain conditions are met
export const workflowTriggers = pgTable("workflow_triggers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // event, schedule, webhook, manual, condition
  eventType: text("event_type"), // machine_breakdown, schedule_change, quality_issue, inventory_low, job_late, etc.
  conditions: jsonb("conditions").$type<{
    entity?: string; // resource, job, operation, inventory, etc.
    field?: string; // status, progress, quantity, etc.
    operator?: string; // equals, greater_than, less_than, contains, etc.
    value?: any;
    multiple_conditions?: Array<{
      field: string;
      operator: string;
      value: any;
      logic?: "AND" | "OR";
    }>;
  }>().default({}),
  scheduleConfig: jsonb("schedule_config").$type<{
    frequency?: string; // once, daily, weekly, monthly, yearly
    interval?: number; // every N units
    days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
    time?: string; // HH:MM format
    timezone?: string;
    start_date?: string;
    end_date?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(5), // 1=highest, 10=lowest
  extensionId: integer("extension_id").references(() => extensions.id), // Optional link to extension
  plantId: integer("plant_id").references(() => PT.ptPlants.id), // Trigger applies to specific plant
  createdBy: integer("created_by").references(() => users.id).notNull(),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow actions that can be executed when triggers fire
export const workflowActions = pgTable("workflow_actions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  actionType: text("action_type").notNull(), // notification, schedule_adjustment, create_job, update_status, webhook, email, sms, api_call, custom_script
  configuration: jsonb("configuration").$type<{
    // Notification actions
    recipients?: string[]; // email addresses or user IDs
    subject?: string;
    message?: string;
    channels?: string[]; // email, sms, slack, teams, in_app
    
    // Schedule adjustment actions
    reschedule_operations?: boolean;
    priority_boost?: number;
    resource_reallocation?: boolean;
    
    // Job/Operation actions
    job_template_id?: number;
    operation_changes?: Array<{
      operation_id: number;
      field: string;
      new_value: any;
    }>;
    
    // External API actions
    webhook_url?: string;
    http_method?: string;
    headers?: Record<string, string>;
    body_template?: string;
    
    // Custom script actions
    script_content?: string;
    script_language?: string; // javascript, python, sql
    timeout_seconds?: number;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  retryConfig: jsonb("retry_config").$type<{
    max_retries?: number;
    retry_delay_seconds?: number;
    exponential_backoff?: boolean;
  }>().default({ max_retries: 3, retry_delay_seconds: 30, exponential_backoff: true }),
  extensionId: integer("extension_id").references(() => extensions.id), // Optional link to extension
  createdBy: integer("created_by").references(() => users.id).notNull(),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  averageExecutionTime: integer("average_execution_time").default(0), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Complete workflows that link triggers to actions
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("automation"), // automation, scheduling, maintenance, quality, inventory, notifications
  status: text("status").notNull().default("draft"), // draft, active, paused, error, disabled
  triggerId: integer("trigger_id").references(() => workflowTriggers.id).notNull(),
  priority: integer("priority").default(5), // 1=highest, 10=lowest
  timeout: integer("timeout").default(300), // seconds before workflow times out
  plantId: integer("plant_id").references(() => PT.ptPlants.id), // Workflow applies to specific plant
  extensionId: integer("extension_id").references(() => extensions.id), // Links to Extension Studio extension
  createdBy: integer("created_by").references(() => users.id).notNull(),
  approvedBy: integer("approved_by").references(() => users.id), // Required approval for certain workflows
  version: text("version").notNull().default("1.0.0"),
  tags: jsonb("tags").$type<string[]>().default([]),
  executionCount: integer("execution_count").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  lastExecuted: timestamp("last_executed"),
  averageExecutionTime: integer("average_execution_time").default(0), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Link workflows to their actions (many-to-many with execution order)
export const workflowActionMappings = pgTable("workflow_action_mappings", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id).notNull(),
  actionId: integer("action_id").references(() => workflowActions.id).notNull(),
  executionOrder: integer("execution_order").notNull().default(1),
  isConditional: boolean("is_conditional").default(false),
  conditions: jsonb("conditions").$type<{
    previous_action_result?: string;
    field_checks?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>(),
  delaySeconds: integer("delay_seconds").default(0), // Delay before executing this action
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workflowActionIdx: unique().on(table.workflowId, table.actionId, table.executionOrder),
}));

// Execution history and monitoring
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id).notNull(),
  triggerId: integer("trigger_id").references(() => workflowTriggers.id).notNull(),
  status: text("status").notNull(), // running, completed, failed, timeout, cancelled
  triggerData: jsonb("trigger_data").$type<Record<string, any>>().default({}), // Context that caused trigger
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // milliseconds
  errorMessage: text("error_message"),
  executionContext: jsonb("execution_context").$type<{
    user_id?: number;
    plant_id?: number;
    resource_id?: number;
    job_id?: number;
    operation_id?: number;
    triggered_by?: string; // manual, scheduled, event
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual action execution results within workflow executions
export const workflowActionExecutions = pgTable("workflow_action_executions", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").references(() => workflowExecutions.id).notNull(),
  actionId: integer("action_id").references(() => workflowActions.id).notNull(),
  status: text("status").notNull(), // running, completed, failed, skipped, retry
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // milliseconds
  result: jsonb("result").$type<Record<string, any>>(),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow monitoring and alerts
export const workflowMonitoring = pgTable("workflow_monitoring", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id).notNull(),
  monitoringType: text("monitoring_type").notNull(), // performance, errors, frequency, resource_usage
  thresholds: jsonb("thresholds").$type<{
    max_execution_time?: number; // milliseconds
    max_error_rate?: number; // percentage
    min_success_rate?: number; // percentage
    max_executions_per_hour?: number;
    max_memory_usage?: number; // MB
  }>(),
  alertConfig: jsonb("alert_config").$type<{
    notification_channels?: string[];
    escalation_rules?: Array<{
      condition: string;
      delay_minutes: number;
      recipients: string[];
    }>;
    alert_frequency?: string; // immediate, hourly, daily, weekly
  }>(),
  isActive: boolean("is_active").default(true),
  lastAlert: timestamp("last_alert"),
  alertCount: integer("alert_count").default(0),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Algorithm Version Control and Plant Deployment
export const algorithmVersions = pgTable("algorithm_versions", {
  id: serial("id").primaryKey(),
  algorithmName: text("algorithm_name").notNull(),
  version: text("version").notNull(), // e.g., "1.2.3"
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // scheduling, optimization, resource_allocation, capacity_planning
  algorithmType: text("algorithm_type").notNull(), // bryntum, custom, third_party
  developmentStatus: text("development_status").notNull().default("development"), // development, testing, production, deprecated
  releaseDate: timestamp("release_date"),
  deprecationDate: timestamp("deprecation_date"),
  features: jsonb("features").$type<string[]>().default([]),
  requirements: jsonb("requirements").$type<{
    minMemoryMb: number;
    minCpuCores: number;
    supportedPlatforms: string[];
    dependencies: string[];
  }>(),
  configuration: jsonb("configuration").$type<{
    parameters: Array<{
      name: string;
      type: string;
      defaultValue: any;
      description?: string;
      required: boolean;
    }>;
    constraints: Array<{
      name: string;
      type: string;
      value: any;
    }>;
  }>(),
  performanceMetrics: jsonb("performance_metrics").$type<{
    averageExecutionTimeMs: number;
    memoryUsageMb: number;
    successRate: number;
    lastBenchmarkDate: string;
  }>(),
  changeLog: text("change_log"),
  documentation: text("documentation"),
  contactInfo: jsonb("contact_info").$type<{
    developer: string;
    maintainer: string;
    supportEmail?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  algorithmVersionIdx: unique().on(table.algorithmName, table.version),
}));

export const plantAlgorithmDeployments = pgTable("plant_algorithm_deployments", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  algorithmVersionId: integer("algorithm_version_id").references(() => algorithmVersions.id).notNull(),
  deploymentStatus: text("deployment_status").notNull().default("pending"), // pending, approved, deployed, testing, rejected, retired
  approvalLevel: text("approval_level").notNull().default("plant_manager"), // plant_manager, regional_director, corporate, emergency
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  approvalComments: text("approval_comments"),
  deployedDate: timestamp("deployed_date"),
  retiredDate: timestamp("retired_date"),
  isDefault: boolean("is_default").default(false), // Is this the default algorithm for this category at this plant
  priority: integer("priority").default(100), // Higher priority algorithms are preferred
  restrictions: jsonb("restrictions").$type<{
    timeWindows: Array<{
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    }>;
    maxConcurrentRuns: number;
    resourceLimits: {
      maxMemoryMb: number;
      maxCpuUsage: number;
    };
    userRoles: string[];
    productTypes: string[];
    orderTypes: string[];
  }>(),
  configuration: jsonb("configuration").$type<{
    plantSpecificParameters: Array<{
      name: string;
      value: any;
      overrideReason: string;
    }>;
    integrationSettings: Record<string, any>;
  }>(),
  performanceData: jsonb("performance_data").$type<{
    totalRuns: number;
    successfulRuns: number;
    averageExecutionTime: number;
    lastRunDate: string;
    issues: Array<{
      date: string;
      severity: string;
      description: string;
      resolved: boolean;
    }>;
  }>(),
  testResults: jsonb("test_results").$type<{
    testSuiteResults: Array<{
      suiteName: string;
      testDate: string;
      passed: boolean;
      results: Record<string, any>;
    }>;
    performanceBenchmarks: Array<{
      benchmarkName: string;
      result: number;
      unit: string;
      testDate: string;
    }>;
  }>(),
  rollbackPlan: text("rollback_plan"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  plantAlgorithmIdx: unique().on(table.plantId, table.algorithmVersionId),
}));

export const algorithmApprovalWorkflows = pgTable("algorithm_approval_workflows", {
  id: serial("id").primaryKey(),
  deploymentId: integer("deployment_id").references(() => plantAlgorithmDeployments.id).notNull(),
  workflowStep: integer("workflow_step").notNull().default(1),
  stepName: text("step_name").notNull(), // plant_request, technical_review, manager_approval, deployment, verification
  stepStatus: text("step_status").notNull().default("pending"), // pending, approved, rejected, in_progress, completed
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedRole: text("assigned_role"), // plant_manager, technical_lead, regional_director
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  comments: text("comments"),
  attachments: jsonb("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
    uploadedBy: number;
    uploadedDate: string;
  }>>().default([]),
  requirements: jsonb("requirements").$type<{
    documentsRequired: string[];
    testsRequired: string[];
    approvalsRequired: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const algorithmUsageLogs = pgTable("algorithm_usage_logs", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  algorithmVersionId: integer("algorithm_version_id").references(() => algorithmVersions.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  executionId: text("execution_id").notNull(), // Unique identifier for this run
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // running, completed, failed, cancelled
  inputParameters: jsonb("input_parameters"),
  outputResults: jsonb("output_results"),
  errorMessage: text("error_message"),
  memoryUsageMb: integer("memory_usage_mb"),
  cpuUsagePercent: integer("cpu_usage_percent"),
  dataProcessed: jsonb("data_processed").$type<{
    ordersProcessed: number;
    resourcesOptimized: number;
    timeHorizonDays: number;
  }>(),
  qualityMetrics: jsonb("quality_metrics").$type<{
    scheduleEfficiency: number;
    resourceUtilization: number;
    constraintViolations: number;
    improvementScore: number;
  }>(),
  feedback: jsonb("feedback").$type<{
    userRating: number;
    userComments?: string;
    issues?: string[];
    suggestions?: string[];
  }>(),
  context: text("context"), // manual, automated, batch, emergency
  createdAt: timestamp("created_at").defaultNow(),
});

// Plant Optimization Settings for Autonomous Optimization
export const plantOptimizationSettings = pgTable("plant_optimization_settings", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull().unique(),
  enabled: boolean("enabled").default(true),
  profile: text("profile").notNull().default("standard"), // standard, aggressive, conservative, custom
  priority: integer("priority").default(1), // 1=high, 2=medium, 3=low
  modules: jsonb("modules").$type<{
    scheduling: boolean;
    productionPlanning: boolean;
    demandPlanning: boolean;
    inventoryOptimization: boolean;
    resourceAllocation: boolean;
    qualityControl: boolean;
    maintenancePlanning: boolean;
    supplyChain: boolean;
  }>().default({
    scheduling: true,
    productionPlanning: true,
    demandPlanning: true,
    inventoryOptimization: false,
    resourceAllocation: true,
    qualityControl: false,
    maintenancePlanning: false,
    supplyChain: false
  }),
  algorithms: jsonb("algorithms").$type<{
    productionScheduling: string;
    orderOptimization: string;
    resequencing: string;
    demandPlanning: string;
    mrp: string;
    mps: string;
    capacityPlanning: string;
  }>().default({
    productionScheduling: "Standard Algorithm",
    orderOptimization: "Standard Algorithm",
    resequencing: "Standard Algorithm",
    demandPlanning: "Standard Algorithm",
    mrp: "Standard Algorithm",
    mps: "Standard Algorithm",
    capacityPlanning: "Standard Algorithm"
  }),
  constraints: jsonb("constraints").$type<{
    maxUtilization: number;
    minQuality: number;
    maxCost: number;
  }>().default({
    maxUtilization: 90,
    minQuality: 95,
    maxCost: 105
  }),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Algorithm Version Control
export const algorithmVersionsRelations = relations(algorithmVersions, ({ many, one }) => ({
  plantDeployments: many(plantAlgorithmDeployments),
  usageLogs: many(algorithmUsageLogs),
  createdByUser: one(users, {
    fields: [algorithmVersions.createdBy],
    references: [users.id],
  }),
}));

export const plantAlgorithmDeploymentsRelations = relations(plantAlgorithmDeployments, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [plantAlgorithmDeployments.plantId],
    references: [ptPlants.id],
  }),
  algorithmVersion: one(algorithmVersions, {
    fields: [plantAlgorithmDeployments.algorithmVersionId],
    references: [algorithmVersions.id],
  }),
  approvedByUser: one(users, {
    fields: [plantAlgorithmDeployments.approvedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [plantAlgorithmDeployments.createdBy],
    references: [users.id],
  }),
  approvalWorkflows: many(algorithmApprovalWorkflows),
  usageLogs: many(algorithmUsageLogs),
}));

export const algorithmApprovalWorkflowsRelations = relations(algorithmApprovalWorkflows, ({ one }) => ({
  deployment: one(plantAlgorithmDeployments, {
    fields: [algorithmApprovalWorkflows.deploymentId],
    references: [plantAlgorithmDeployments.id],
  }),
  assignedToUser: one(users, {
    fields: [algorithmApprovalWorkflows.assignedTo],
    references: [users.id],
  }),
}));

export const algorithmUsageLogsRelations = relations(algorithmUsageLogs, ({ one }) => ({
  plant: one(ptPlants, {
    fields: [algorithmUsageLogs.plantId],
    references: [ptPlants.id],
  }),
  algorithmVersion: one(algorithmVersions, {
    fields: [algorithmUsageLogs.algorithmVersionId],
    references: [algorithmVersions.id],
  }),
  user: one(users, {
    fields: [algorithmUsageLogs.userId],
    references: [users.id],
  }),
}));

export const plantOptimizationSettingsRelations = relations(plantOptimizationSettings, ({ one }) => ({
  plant: one(ptPlants, {
    fields: [plantOptimizationSettings.plantId],
    references: [ptPlants.id],
  }),
  updatedByUser: one(users, {
    fields: [plantOptimizationSettings.updatedBy],
    references: [users.id],
  }),
}));

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

// departments is already exported from PT tables above (line 15)

// User Authority Management - Link users to their areas of responsibility
export const userAuthorities = pgTable("user_authorities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  authorityType: varchar("authority_type", { length: 50 }).notNull(), // 'plant', 'department', 'resource'
  authorityId: integer("authority_id").notNull(), // ID of plant, department, or resource
  authorityLevel: varchar("authority_level", { length: 50 }).notNull().default("view"), // 'view', 'schedule', 'manage', 'admin'
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserAuthority: unique().on(table.userId, table.authorityType, table.authorityId),
  authorityIdx: index().on(table.userId, table.authorityType, table.isActive),
}));

// AI Schedule Recommendations
export const aiScheduleRecommendations = pgTable("ai_schedule_recommendations", {
  id: serial("id").primaryKey(),
  recommendationType: varchar("recommendation_type", { length: 100 }).notNull(), // 'optimization', 'conflict_resolution', 'resource_reallocation', 'maintenance_scheduling', etc.
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // 'critical', 'high', 'medium', 'low'
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'reviewed', 'applied', 'ignored', 'expired'
  
  // Scope of recommendation
  scopeType: varchar("scope_type", { length: 50 }).notNull(), // 'global', 'plant', 'department', 'resource', 'job'
  scopeId: integer("scope_id"), // ID of the specific plant, department, resource, or job
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  departmentId: integer("department_id").references(() => departments.id),
  resourceId: integer("resource_id").references(() => resources.id),
  
  // Recommendation details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  impact: text("impact"), // Expected impact if applied
  reasoning: text("reasoning"), // AI's reasoning for the recommendation
  confidence: numeric("confidence", { precision: 5, scale: 2 }), // 0-100 confidence percentage
  
  // Proposed changes
  proposedChanges: jsonb("proposed_changes").$type<{
    operations?: Array<{
      operationId: number;
      currentStart: string;
      currentEnd: string;
      proposedStart: string;
      proposedEnd: string;
      currentResource?: number;
      proposedResource?: number;
    }>;
    resources?: Array<{
      resourceId: number;
      currentAllocation: number;
      proposedAllocation: number;
    }>;
    sequencing?: Array<{
      jobId: number;
      currentSequence: number;
      proposedSequence: number;
    }>;
  }>().notNull(),
  
  // Metrics and improvements
  currentMetrics: jsonb("current_metrics").$type<{
    makespan?: number;
    utilization?: number;
    tardiness?: number;
    setupTime?: number;
    throughput?: number;
    cost?: number;
  }>(),
  proposedMetrics: jsonb("proposed_metrics").$type<{
    makespan?: number;
    utilization?: number;
    tardiness?: number;
    setupTime?: number;
    throughput?: number;
    cost?: number;
  }>(),
  
  // AI generation details
  aiModel: varchar("ai_model", { length: 100 }).default("gpt-5"),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  
  // Review and application
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  appliedBy: integer("applied_by").references(() => users.id),
  appliedAt: timestamp("applied_at"),
  applicationNotes: text("application_notes"),
  rollbackData: jsonb("rollback_data"), // Data needed to rollback changes if needed
  
  // Tracking
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index().on(table.status, table.priority),
  scopeIdx: index().on(table.scopeType, table.scopeId),
  plantIdx: index().on(table.plantId, table.status),
  expiryIdx: index().on(table.expiresAt, table.status),
}));

// Track actions on recommendations
export const recommendationActions = pgTable("recommendation_actions", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").references(() => aiScheduleRecommendations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'view', 'review', 'apply', 'ignore', 'rollback'
  notes: text("notes"),
  metadata: jsonb("metadata"), // Any additional action-specific data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  recActionIdx: index().on(table.recommendationId, table.action),
  userActionIdx: index().on(table.userId, table.createdAt),
}));

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
  }>().default(sql`'{"email": undefined, "push": undefined, "desktop": undefined, "reminders": undefined, "tours": true}'::jsonb`),
  dashboardLayout: jsonb("dashboard_layout").$type<{
    sidebarCollapsed: boolean;
    defaultPage: string;
    widgetPreferences: Record<string, any>;
    recentPages?: Array<{
      path: string;
      label: string;
      icon?: string;
      timestamp: number;
    }>;
  }>().default(sql`'{"sidebarCollapsed": false, "defaultPage": "/", "widgetPreferences": {}}'::jsonb`),
  companyInfo: jsonb("company_info").$type<{
    name?: string;
    industry?: string;
    size?: string;
    description?: string;
    website?: string;
    numberOfPlants?: string;
    products?: string;
  }>().default(sql`'{}'::jsonb`),
  aiThemeColor: varchar("ai_theme_color", { length: 30 }).notNull().default("purple-pink"), // purple-pink, blue-indigo, emerald-teal, orange-red, violet-purple, cyan-blue
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

// Insert schemas for new AI recommendations tables
export const insertDepartmentSchema = createInsertSchema(departments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAuthoritySchema = createInsertSchema(userAuthorities).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiScheduleRecommendationSchema = createInsertSchema(aiScheduleRecommendations).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  generatedAt: true,
  viewCount: true,
});

export const insertRecommendationActionSchema = createInsertSchema(recommendationActions).omit({ 
  id: true,
  createdAt: true,
});

// Type exports for new tables
// Remove duplicate Department export - already defined elsewhere
// export type Department = typeof departments.$inferSelect;
// export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type AiScheduleRecommendation = typeof aiScheduleRecommendations.$inferSelect;
export type InsertAiScheduleRecommendation = z.infer<typeof insertAiScheduleRecommendationSchema>;

export type RecommendationAction = typeof recommendationActions.$inferSelect;
export type InsertRecommendationAction = z.infer<typeof insertRecommendationActionSchema>;

// NOTE: userAuthorities and aiScheduleRecommendations tables are already defined earlier in the schema

// AI Recommendation Feedback - Track user feedback on recommendations
export const aiRecommendationFeedback = pgTable("ai_recommendation_feedback", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").references(() => aiScheduleRecommendations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  feedbackType: text("feedback_type").notNull(), // 'helpful', 'not_helpful', 'partially_helpful', 'wrong'
  rating: integer("rating"), // 1-5 stars
  comment: text("comment"),
  suggestedImprovement: text("suggested_improvement"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  recommendationIdx: index("ai_feedback_rec_idx").on(table.recommendationId),
  userIdx: index("ai_feedback_user_idx").on(table.userId),
}));

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

// Remove duplicate UserAuthority export - already defined elsewhere  
// export type UserAuthority = typeof userAuthorities.$inferSelect;
// export type InsertUserAuthority = typeof userAuthorities.$inferInsert;

export type AIScheduleRecommendation = typeof aiScheduleRecommendations.$inferSelect;
export type InsertAIScheduleRecommendation = typeof aiScheduleRecommendations.$inferInsert;

export type AIRecommendationFeedback = typeof aiRecommendationFeedback.$inferSelect;
export type InsertAIRecommendationFeedback = typeof aiRecommendationFeedback.$inferInsert;

// User with roles and permissions type for authentication
export type UserWithRoles = User & {
  roles: (Role & {
    permissions: Permission[];
  })[];
  currentRole?: {
    id: number;
    name: string;
  } | null;
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
  useDashboardRotation: boolean("use_dashboard_rotation").default(false),
  dashboardSequence: jsonb("dashboard_sequence").default([]),
  // Scheduling fields
  scheduleStartTime: varchar("schedule_start_time", { length: 5 }).default("07:00"), // HH:MM format
  scheduleEndTime: varchar("schedule_end_time", { length: 5 }).default("17:00"),     // HH:MM format
  scheduleDaysOfWeek: jsonb("schedule_days_of_week").$type<number[]>().default([1,2,3,4,5]), // 0=Sun, 1=Mon, etc.
  scheduleEnabled: boolean("schedule_enabled").default(false),
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

// User Resource Assignments - tracks which resources operators can access
export const userResourceAssignments = pgTable("user_resource_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: integer("revoked_by").references(() => users.id),
  canSkipOperations: boolean("can_skip_operations").default(false),
  scheduleVisibilityDays: integer("schedule_visibility_days").default(7), // How many days ahead they can see
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userResourceUniqueIdx: unique().on(table.userId, table.resourceId),
  userIdx: index("user_resource_assignments_user_idx").on(table.userId),
  resourceIdx: index("user_resource_assignments_resource_idx").on(table.resourceId),
}));

// Operation Status Reports - tracks operator reporting on operations
export const operationStatusReports = pgTable("operation_status_reports", {
  id: serial("id").primaryKey(),
  ptJobOperationId: integer("pt_job_operation_id").references(() => ptJobOperations.id),
  reportedBy: integer("reported_by").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  
  // Operation phase tracking
  phaseType: text("phase_type", { enum: ["setup", "running", "cleanup"] }).notNull(),
  phaseStatus: text("phase_status", { enum: ["started", "completed", "paused", "skipped"] }).notNull(),
  
  // Skip handling
  skipReason: text("skip_reason"), // Required if phase_status is 'skipped'
  skipReasonCategory: text("skip_reason_category", { 
    enum: ["material_shortage", "equipment_issue", "quality_problem", "scheduling_conflict", "maintenance_required", "other"] 
  }),
  
  // Time tracking
  timeSpent: integer("time_spent"), // minutes
  reportedStartTime: timestamp("reported_start_time"),
  reportedEndTime: timestamp("reported_end_time"),
  
  // Production quantities
  goodQuantity: numeric("good_quantity", { precision: 10, scale: 4 }).default("0"),
  scrapQuantity: numeric("scrap_quantity", { precision: 10, scale: 4 }).default("0"),
  unitOfMeasure: text("unit_of_measure").default("EA"),
  
  // Comments and notes
  comments: text("comments"),
  qualityNotes: text("quality_notes"),
  issuesEncountered: text("issues_encountered"),
  
  // Metadata
  reportedAt: timestamp("reported_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ptJobOperationIdx: index("operation_status_reports_pt_job_operation_idx").on(table.ptJobOperationId),
  reportedByIdx: index("operation_status_reports_user_idx").on(table.reportedBy),
  resourceIdx: index("operation_status_reports_resource_idx").on(table.resourceId),
  reportedAtIdx: index("operation_status_reports_reported_at_idx").on(table.reportedAt),
}));

// Skip Reason Templates - predefined reasons for skipping operations
export const skipReasonTemplates = pgTable("skip_reason_templates", {
  id: serial("id").primaryKey(),
  category: text("category", { 
    enum: ["material_shortage", "equipment_issue", "quality_problem", "scheduling_conflict", "maintenance_required", "other"] 
  }).notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  requiresApproval: boolean("requires_approval").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas and types for user resource assignments
export const insertUserResourceAssignmentSchema = createInsertSchema(userResourceAssignments, { 
  id: undefined,
  assignedAt: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type InsertUserResourceAssignment = z.infer<typeof insertUserResourceAssignmentSchema>;
export type UserResourceAssignment = typeof userResourceAssignments.$inferSelect;

// Insert schemas and types for operation status reports
export const insertOperationStatusReportSchema = createInsertSchema(operationStatusReports, { 
  id: undefined,
  reportedAt: undefined,
  updatedAt: undefined,
});

export type InsertOperationStatusReport = z.infer<typeof insertOperationStatusReportSchema>;
export type OperationStatusReport = typeof operationStatusReports.$inferSelect;

// Insert schemas and types for skip reason templates
export const insertSkipReasonTemplateSchema = createInsertSchema(skipReasonTemplates, { 
  id: undefined,
  createdAt: undefined,
});

export type InsertSkipReasonTemplate = z.infer<typeof insertSkipReasonTemplateSchema>;
export type SkipReasonTemplate = typeof skipReasonTemplates.$inferSelect;

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
      // Enhanced navigation controls
      target?: {
        type: 'page' | 'tab' | 'section' | 'element' | 'button' | 'dialog';
        selector?: string; // CSS selector or data attribute
        tabId?: string; // For tab navigation (e.g., "tour-management", "role-demonstrations")
        action?: 'click' | 'hover' | 'focus' | 'scroll' | 'highlight';
        waitFor?: string; // Element to wait for after navigation
        description?: string; // Description of what to show/highlight
      };
      // Pre-actions to set up the step (optional)
      preActions?: Array<{
        type: 'click' | 'navigate' | 'scroll' | 'wait';
        selector?: string;
        value?: string | number;
        description?: string;
      }>;
      // Visual highlighting and focus
      spotlight?: {
        enabled: boolean;
        selector?: string; // What to highlight
        overlay?: boolean; // Show dark overlay on rest of screen
        position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
      };
    }>;
    totalSteps: number;
    estimatedDuration: string;
    voiceScriptCount: number;
  }>().notNull(),
  isGenerated: boolean("is_generated").default(true), // true if AI generated, false if manually created
  allowSystemInteraction: boolean("allow_system_interaction").default(true), // Controls whether users can interact with the rest of the system during the tour
  generatedAt: timestamp("generated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 100 }), // user who generated/created the tour
});

export const insertDemoTourParticipantSchema = createInsertSchema(demoTourParticipants, { 
  id: undefined,
  tourStartedAt: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertVoiceRecordingsCacheSchema = createInsertSchema(voiceRecordingsCache, { 
  id: undefined,
  createdAt: undefined,
  lastUsedAt: undefined,
  usageCount: undefined,
});

export const insertTourSchema = createInsertSchema(tours, { 
  id: undefined,
  generatedAt: undefined,
  updatedAt: undefined,
});

// Field Comments table for database documentation
export const fieldComments = pgTable("field_comments", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 255 }).notNull(),
  columnName: varchar("column_name", { length: 255 }).notNull(),
  comment: text("comment").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tableColumnUnique: unique().on(table.tableName, table.columnName),
  tableNameIdx: index("field_comments_table_name_idx").on(table.tableName),
}));

export const insertFieldCommentSchema = createInsertSchema(fieldComments, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type InsertDemoTourParticipant = z.infer<typeof insertDemoTourParticipantSchema>;
export type DemoTourParticipant = typeof demoTourParticipants.$inferSelect;
export type InsertVoiceRecordingsCache = z.infer<typeof insertVoiceRecordingsCacheSchema>;
export type VoiceRecordingsCache = typeof voiceRecordingsCache.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertFieldComment = z.infer<typeof insertFieldCommentSchema>;
export type FieldComment = typeof fieldComments.$inferSelect;

// User Preferences Schema and Types
export const insertUserPreferencesSchema = createInsertSchema(userPreferences, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
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

export const chatMessages: any = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  originalLanguage: varchar("original_language", { length: 10 }).default("en"), // Language the message was written in
  translations: jsonb("translations").$type<Record<string, string>>().default(sql`'{}'::jsonb`), // Cached translations by language code
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

// Product Development Tables
export const strategyDocuments = pgTable("strategy_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'architecture', 'technical', 'business', 'roadmap'
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const developmentTasks = pgTable("development_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("backlog"), // 'backlog', 'planned', 'in-progress', 'testing', 'done'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
  phase: text("phase").notNull(),
  estimatedHours: integer("estimated_hours").default(0),
  assignedTo: text("assigned_to"),
  dependencies: jsonb("dependencies").$type<number[]>().default([]),
  dueDate: timestamp("due_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'unit', 'integration', 'e2e', 'performance', 'security'
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'archived'
  lastRun: timestamp("last_run"),
  passRate: integer("pass_rate"), // percentage 0-100
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  suiteId: integer("suite_id").references(() => testSuites.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").$type<string[]>().default([]),
  expectedResult: text("expected_result").notNull(),
  status: text("status").notNull().default("pending"), // 'pass', 'fail', 'pending', 'skipped'
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const architectureComponents = pgTable("architecture_components", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  technology: text("technology").notNull(),
  description: text("description"),
  health: text("health").notNull().default("good"), // 'excellent', 'good', 'fair', 'poor'
  coverage: integer("coverage").default(0), // percentage 0-100
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Development Relations
export const strategyDocumentsRelations = relations(strategyDocuments, ({ one }) => ({
  creator: one(users, {
    fields: [strategyDocuments.createdBy],
    references: [users.id],
  }),
}));

export const developmentTasksRelations = relations(developmentTasks, ({ one }) => ({
  creator: one(users, {
    fields: [developmentTasks.createdBy],
    references: [users.id],
  }),
}));

export const testSuitesRelations = relations(testSuites, ({ one, many }) => ({
  creator: one(users, {
    fields: [testSuites.createdBy],
    references: [users.id],
  }),
  testCases: many(testCases),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  suite: one(testSuites, {
    fields: [testCases.suiteId],
    references: [testSuites.id],
  }),
}));

// Product Development Insert Schemas
export const insertStrategyDocumentSchema = createInsertSchema(strategyDocuments, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertDevelopmentTaskSchema = createInsertSchema(developmentTasks, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertTestSuiteSchema = createInsertSchema(testSuites, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertTestCaseSchema = createInsertSchema(testCases, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertArchitectureComponentSchema = createInsertSchema(architectureComponents, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Product Development Types
export type StrategyDocument = typeof strategyDocuments.$inferSelect;
export type InsertStrategyDocument = z.infer<typeof insertStrategyDocumentSchema>;
export type DevelopmentTask = typeof developmentTasks.$inferSelect;
export type InsertDevelopmentTask = z.infer<typeof insertDevelopmentTaskSchema>;
export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;
export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type ArchitectureComponent = typeof architectureComponents.$inferSelect;
export type InsertArchitectureComponent = z.infer<typeof insertArchitectureComponentSchema>;

// Chat Insert Schemas
export const insertChatChannelSchema = createInsertSchema(chatChannels, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  lastMessageAt: undefined,
});

export const insertChatMemberSchema = createInsertSchema(chatMembers, { 
  id: undefined,
  joinedAt: undefined,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages, { 
  id: undefined,
  createdAt: undefined,
});

export const insertChatReactionSchema = createInsertSchema(chatReactions, { 
  id: undefined,
  createdAt: undefined,
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

// Stock and Demand Forecasting Insert Schemas
export const insertStockItemSchema = createInsertSchema(stockItems, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions, { 
  id: undefined,
  createdAt: undefined,
});

export const insertStockBalanceSchema = createInsertSchema(stockBalances, { 
  id: undefined,
  updatedAt: undefined,
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  forecastDate: z.union([z.string().datetime(), z.date()]),
});

export const insertDemandDriverSchema = createInsertSchema(demandDrivers, { 
  id: undefined,
  createdAt: undefined,
});

export const insertDemandHistorySchema = createInsertSchema(demandHistory, { 
  id: undefined,
  createdAt: undefined,
}, {
  period: z.union([z.string().datetime(), z.date()]),
});

export const insertStockOptimizationScenarioSchema = createInsertSchema(stockOptimizationScenarios, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertOptimizationRecommendationSchema = createInsertSchema(optimizationRecommendations, { 
  id: undefined,
  createdAt: undefined,
});

// Stock and Demand Planning Types
export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

export type StockBalance = typeof stockBalances.$inferSelect;
export type InsertStockBalance = z.infer<typeof insertStockBalanceSchema>;

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;

export type DemandDriver = typeof demandDrivers.$inferSelect;
export type InsertDemandDriver = z.infer<typeof insertDemandDriverSchema>;

export type DemandHistory = typeof demandHistory.$inferSelect;
export type InsertDemandHistory = z.infer<typeof insertDemandHistorySchema>;

export type StockOptimizationScenario = typeof stockOptimizationScenarios.$inferSelect;
export type InsertStockOptimizationScenario = z.infer<typeof insertStockOptimizationScenarioSchema>;

export type OptimizationRecommendation = typeof optimizationRecommendations.$inferSelect;
export type InsertOptimizationRecommendation = z.infer<typeof insertOptimizationRecommendationSchema>;

// Recipe Insert Schemas - SAP S/4HANA Process Industries Structure
// Commented out - replaced with PT Publish tables
/*
export const insertRecipeSchema = createInsertSchema(recipes, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  validityDateFrom: z.union([z.string().datetime(), z.date()]),
  validityDateTo: z.union([z.string().datetime(), z.date()]).optional(),
  approvedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// export const insertRecipeOperationSchema = createInsertSchema(recipeOperations, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export const insertRecipePhaseSchema = createInsertSchema(recipePhases, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export const insertRecipePhaseRelationshipSchema = createInsertSchema(recipePhaseRelationships, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export const insertRecipeOperationRelationshipSchema = createInsertSchema(recipeOperationRelationships, { 
//   id: undefined,
//   createdAt: undefined,
// });

// export const insertRecipeMaterialAssignmentSchema = createInsertSchema(recipeMaterialAssignments, { 
//   id: undefined,
//   createdAt: undefined,
// });

// export const insertRecipeFormulaSchema = createInsertSchema(recipeFormulas, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });
*/



// Vendor and Customer Insert Schemas
export const insertPTVendorSchema = createInsertSchema(PTvendors, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertCustomerSchema = createInsertSchema(customers, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Recipe Types - SAP S/4HANA Process Industries Structure
// Recipe-related types - Commented out, replaced with PT Publish tables
/*
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

// Commented out - using PT tables instead
// export type RecipeOperation = typeof recipeOperations.$inferSelect;
// export type InsertRecipeOperation = z.infer<typeof insertRecipeOperationSchema>;

// export type RecipePhase = typeof recipePhases.$inferSelect;
// export type InsertRecipePhase = z.infer<typeof insertRecipePhaseSchema>;

// export type RecipePhaseRelationship = typeof recipePhaseRelationships.$inferSelect;
// export type InsertRecipePhaseRelationship = z.infer<typeof insertRecipePhaseRelationshipSchema>;

// export type RecipeOperationRelationship = typeof recipeOperationRelationships.$inferSelect;
// export type InsertRecipeOperationRelationship = z.infer<typeof insertRecipeOperationRelationshipSchema>;

// export type RecipeMaterialAssignment = typeof recipeMaterialAssignments.$inferSelect;
// export type InsertRecipeMaterialAssignment = z.infer<typeof insertRecipeMaterialAssignmentSchema>;

// export type RecipeFormula = typeof recipeFormulas.$inferSelect;
// export type InsertRecipeFormula = z.infer<typeof insertRecipeFormulaSchema>;
*/



// Vendor and Customer Types
export type PTVendor = typeof PTvendors.$inferSelect;
export type InsertPTVendor = z.infer<typeof insertPTVendorSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type AgentAction = typeof agentActions.$inferSelect;

// Onboarding Management Tables
export const companyOnboarding = pgTable("company_onboarding", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  size: text("size"),
  description: text("description"),
  currentStep: text("current_step").notNull().default("welcome"),
  completedSteps: jsonb("completed_steps").$type<string[]>().default([]),
  selectedFeatures: jsonb("selected_features").$type<string[]>().default([]),
  teamMembers: integer("team_members").default(1),
  isCompleted: boolean("is_completed").default(false),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  companyOnboardingId: integer("company_onboarding_id").references(() => companyOnboarding.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  step: text("step").notNull(),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userStepIdx: unique().on(table.userId, table.step),
}));

// ===== IMPLEMENTATION TRACKING SYSTEM =====

// Main implementation project tracking
export const implementationProjects = pgTable("implementation_projects", {
  id: serial("id").primaryKey(),
  companyOnboardingId: integer("company_onboarding_id").references(() => companyOnboarding.id),
  projectName: text("project_name").notNull(),
  projectCode: text("project_code").notNull().unique(), // e.g., "IMPL-2025-001"
  clientCompany: text("client_company").notNull(),
  implementationPartner: text("implementation_partner"),
  projectManager: integer("project_manager").references(() => users.id),
  technicalLead: integer("technical_lead").references(() => users.id),
  
  // Project details
  projectType: text("project_type").notNull(), // full_implementation, migration, upgrade, pilot
  scope: text("scope").notNull(), // basic, standard, enterprise, custom
  estimatedDuration: integer("estimated_duration"), // in days
  actualDuration: integer("actual_duration"), // in days
  kickoffDate: timestamp("kickoff_date"),
  targetGoLiveDate: timestamp("target_go_live_date"),
  actualGoLiveDate: timestamp("actual_go_live_date"),
  
  // Status tracking
  status: text("status").notNull().default("planning"), // planning, in_progress, testing, training, go_live, completed, on_hold
  healthStatus: text("health_status").default("green"), // green, yellow, red
  riskLevel: text("risk_level").default("low"), // low, medium, high, critical
  completionPercentage: numeric("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Financial tracking
  budgetAmount: numeric("budget_amount", { precision: 15, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 15, scale: 2 }).default("0"),
  
  // Modules/Features configuration
  selectedModules: jsonb("selected_modules").$type<string[]>().default([]),
  customizations: jsonb("customizations").$type<Record<string, any>>().default({}),
  integrations: jsonb("integrations").$type<string[]>().default([]),
  
  // AI tracking
  aiInsights: jsonb("ai_insights").$type<Record<string, any>>().default({}),
  lastAiAnalysis: timestamp("last_ai_analysis"),
  aiRecommendations: jsonb("ai_recommendations").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation phases (milestones)
export const implementationPhases = pgTable("implementation_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  phaseName: text("phase_name").notNull(),
  phaseNumber: integer("phase_number").notNull(),
  description: text("description"),
  
  // Timing
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, skipped
  completionPercentage: numeric("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Deliverables
  deliverables: jsonb("deliverables").$type<string[]>().default([]),
  acceptanceCriteria: jsonb("acceptance_criteria").$type<string[]>().default([]),
  
  // Dependencies
  dependsOnPhaseId: integer("depends_on_phase_id"),
  blockedBy: jsonb("blocked_by").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  projectPhaseIdx: unique().on(table.projectId, table.phaseNumber),
}));

// SOPs (Standard Operating Procedures) library
export const implementationSops = pgTable("implementation_sops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // setup, configuration, training, migration, testing, go_live
  version: text("version").notNull().default("1.0"),
  
  // Content
  description: text("description"),
  content: text("content"), // Rich text or markdown
  steps: jsonb("steps").$type<Array<{
    stepNumber: number;
    title: string;
    description: string;
    expectedDuration: number;
    requiredRole: string;
  }>>().default([]),
  
  // Metadata
  applicableModules: jsonb("applicable_modules").$type<string[]>().default([]),
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
  estimatedDuration: integer("estimated_duration"), // in minutes
  
  // Tracking
  isActive: boolean("is_active").default(true),
  isTemplate: boolean("is_template").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document management for implementation
export const implementationDocuments = pgTable("implementation_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id),
  phaseId: integer("phase_id").references(() => implementationPhases.id),
  sopId: integer("sop_id").references(() => implementationSops.id),
  
  // Document details
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(), // contract, sop, training, configuration, report, signoff
  category: text("category"), // legal, technical, training, testing, project_management
  
  // Storage
  storageUrl: text("storage_url"), // URL to cloud storage
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  checksum: text("checksum"), // for integrity verification
  
  // Version control
  version: text("version").default("1.0"),
  isLatest: boolean("is_latest").default(true),
  previousVersionId: integer("previous_version_id"),
  
  // Metadata
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Access control
  accessLevel: text("access_level").default("project"), // public, project, restricted
  sharedWith: jsonb("shared_with").$type<number[]>().default([]), // user ids
  
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase signoffs
export const implementationSignoffs = pgTable("implementation_signoffs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  phaseId: integer("phase_id").references(() => implementationPhases.id),
  
  // Signoff details
  signoffType: text("signoff_type").notNull(), // phase_completion, go_live, training_completion, data_validation
  title: text("title").notNull(),
  description: text("description"),
  
  // Requirements
  requiredSignoffs: jsonb("required_signoffs").$type<Array<{
    role: string;
    name: string;
    email: string;
    required: boolean;
  }>>().default([]),
  
  // Actual signoffs
  signoffs: jsonb("signoffs").$type<Array<{
    userId: number;
    name: string;
    role: string;
    signedAt: string;
    comments: string;
    signature: string; // base64 or URL
  }>>().default([]),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, partial, completed, rejected
  isComplete: boolean("is_complete").default(false),
  completedAt: timestamp("completed_at"),
  
  // Attachments
  attachedDocuments: jsonb("attached_documents").$type<number[]>().default([]), // document ids
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation activities log
export const implementationActivities = pgTable("implementation_activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  phaseId: integer("phase_id").references(() => implementationPhases.id),
  
  // Activity details
  activityType: text("activity_type").notNull(), // task_completed, document_uploaded, signoff_received, meeting, training, issue_reported
  title: text("title").notNull(),
  description: text("description"),
  
  // Related entities
  relatedTaskId: integer("related_task_id"),
  relatedDocumentId: integer("related_document_id"),
  relatedSignoffId: integer("related_signoff_id"),
  
  // Participants
  performedBy: integer("performed_by").references(() => users.id),
  participants: jsonb("participants").$type<number[]>().default([]), // user ids
  
  // Metadata
  duration: integer("duration"), // in minutes
  location: text("location"), // onsite, remote, hybrid
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  activityDate: timestamp("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Implementation tasks
export const implementationTasks = pgTable("implementation_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  phaseId: integer("phase_id").references(() => implementationPhases.id),
  sopId: integer("sop_id").references(() => implementationSops.id),
  
  // Task details
  taskName: text("task_name").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // configuration, training, testing, documentation, migration
  priority: text("priority").default("medium"), // low, medium, high, critical
  
  // Assignment
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").references(() => users.id),
  team: jsonb("team").$type<number[]>().default([]), // additional team members
  
  // Timing
  estimatedHours: numeric("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: numeric("actual_hours", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled, blocked
  completionPercentage: numeric("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  blockedReason: text("blocked_reason"),
  
  // Dependencies
  dependsOn: jsonb("depends_on").$type<number[]>().default([]), // task ids
  
  // Deliverables
  deliverables: jsonb("deliverables").$type<string[]>().default([]),
  attachments: jsonb("attachments").$type<number[]>().default([]), // document ids
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation comments/collaboration
export const implementationComments = pgTable("implementation_comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  
  // Related to
  entityType: text("entity_type").notNull(), // project, phase, task, document, signoff
  entityId: integer("entity_id").notNull(),
  
  // Comment details
  comment: text("comment").notNull(),
  commentType: text("comment_type").default("general"), // general, issue, resolution, question, update
  
  // Threading
  parentCommentId: integer("parent_comment_id"),
  
  // Mentions
  mentions: jsonb("mentions").$type<number[]>().default([]), // user ids
  
  // Attachments
  attachments: jsonb("attachments").$type<number[]>().default([]), // document ids
  
  // Metadata
  isInternal: boolean("is_internal").default(false), // internal vs client-visible
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-generated status reports
export const implementationStatusReports = pgTable("implementation_status_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => implementationProjects.id).notNull(),
  
  // Report details
  reportType: text("report_type").notNull(), // daily, weekly, monthly, executive, milestone
  reportDate: timestamp("report_date").notNull(),
  period: text("period"), // e.g., "Week 12", "March 2025"
  
  // AI-generated content
  executiveSummary: text("executive_summary"),
  progressSummary: text("progress_summary"),
  keyAccomplishments: jsonb("key_accomplishments").$type<string[]>().default([]),
  upcomingMilestones: jsonb("upcoming_milestones").$type<string[]>().default([]),
  
  // Metrics
  overallProgress: numeric("overall_progress", { precision: 5, scale: 2 }),
  scheduleVariance: numeric("schedule_variance", { precision: 5, scale: 2 }), // percentage ahead/behind
  budgetVariance: numeric("budget_variance", { precision: 5, scale: 2 }), // percentage over/under
  
  // Issues and risks
  activeIssues: jsonb("active_issues").$type<Array<{
    title: string;
    severity: string;
    owner: string;
    dueDate: string;
  }>>().default([]),
  risks: jsonb("risks").$type<Array<{
    title: string;
    probability: string;
    impact: string;
    mitigation: string;
  }>>().default([]),
  
  // Recommendations
  aiRecommendations: jsonb("ai_recommendations").$type<Array<{
    category: string;
    recommendation: string;
    priority: string;
    expectedImpact: string;
  }>>().default([]),
  
  // Distribution
  distributedTo: jsonb("distributed_to").$type<number[]>().default([]), // user ids
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  
  // AI metadata
  aiModel: text("ai_model").default("gpt-4o"),
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 2 }),
  generationTime: integer("generation_time"), // in milliseconds
  
  generatedBy: integer("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== TYPE EXPORTS FOR IMPLEMENTATION TRACKING =====

// Implementation Projects
export const insertImplementationProjectSchema = createInsertSchema(implementationProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationProject = z.infer<typeof insertImplementationProjectSchema>;
export type ImplementationProject = typeof implementationProjects.$inferSelect;

// Implementation Phases
export const insertImplementationPhaseSchema = createInsertSchema(implementationPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationPhase = z.infer<typeof insertImplementationPhaseSchema>;
export type ImplementationPhase = typeof implementationPhases.$inferSelect;

// Implementation SOPs
export const insertImplementationSopSchema = createInsertSchema(implementationSops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationSop = z.infer<typeof insertImplementationSopSchema>;
export type ImplementationSop = typeof implementationSops.$inferSelect;

// Implementation Documents
export const insertImplementationDocumentSchema = createInsertSchema(implementationDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  uploadedAt: true,
});
export type InsertImplementationDocument = z.infer<typeof insertImplementationDocumentSchema>;
export type ImplementationDocument = typeof implementationDocuments.$inferSelect;

// Implementation Signoffs
export const insertImplementationSignoffSchema = createInsertSchema(implementationSignoffs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationSignoff = z.infer<typeof insertImplementationSignoffSchema>;
export type ImplementationSignoff = typeof implementationSignoffs.$inferSelect;

// Implementation Activities
export const insertImplementationActivitySchema = createInsertSchema(implementationActivities).omit({
  id: true,
  createdAt: true,
});
export type InsertImplementationActivity = z.infer<typeof insertImplementationActivitySchema>;
export type ImplementationActivity = typeof implementationActivities.$inferSelect;

// Implementation Tasks
export const insertImplementationTaskSchema = createInsertSchema(implementationTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationTask = z.infer<typeof insertImplementationTaskSchema>;
export type ImplementationTask = typeof implementationTasks.$inferSelect;

// Implementation Comments
export const insertImplementationCommentSchema = createInsertSchema(implementationComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationComment = z.infer<typeof insertImplementationCommentSchema>;
export type ImplementationComment = typeof implementationComments.$inferSelect;

// Implementation Status Reports
export const insertImplementationStatusReportSchema = createInsertSchema(implementationStatusReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertImplementationStatusReport = z.infer<typeof insertImplementationStatusReportSchema>;
export type ImplementationStatusReport = typeof implementationStatusReports.$inferSelect;

// Onboarding relations
export const companyOnboardingRelations = relations(companyOnboarding, ({ many, one }) => ({
  createdByUser: one(users, {
    fields: [companyOnboarding.createdBy],
    references: [users.id],
  }),
  progress: many(onboardingProgress),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  companyOnboarding: one(companyOnboarding, {
    fields: [onboardingProgress.companyOnboardingId],
    references: [companyOnboarding.id],
  }),
  user: one(users, {
    fields: [onboardingProgress.userId],
    references: [users.id],
  }),
}));

// Feedback Management Tables
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // suggestion, bug, feature_request, improvement, complaint, praise
  category: text("category").notNull(), // scheduling, ui_ux, performance, reporting, mobile, integration, general
  title: text("title").notNull(),
  description: text("description").notNull(),
  submittedBy: text("submitted_by").notNull(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("new"), // new, under_review, in_progress, completed, rejected, duplicate
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  votes: integer("votes").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  assignedTo: text("assigned_to"),
  resolution: text("resolution"),
  implementationVersion: text("implementation_version"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbackComments = pgTable("feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => feedback.id).notNull(),
  author: text("author").notNull(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  isOfficial: boolean("is_official").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackVotes = pgTable("feedback_votes", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => feedback.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: text("vote_type").notNull(), // up, down
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userFeedbackIdx: unique().on(table.userId, table.feedbackId),
}));

// Feedback relations
export const feedbackRelations = relations(feedback, ({ many, one }) => ({
  comments: many(feedbackComments),
  votes: many(feedbackVotes),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const feedbackCommentsRelations = relations(feedbackComments, ({ one }) => ({
  feedback: one(feedback, {
    fields: [feedbackComments.feedbackId],
    references: [feedback.id],
  }),
  user: one(users, {
    fields: [feedbackComments.userId],
    references: [users.id],
  }),
}));

export const feedbackVotesRelations = relations(feedbackVotes, ({ one }) => ({
  feedback: one(feedback, {
    fields: [feedbackVotes.feedbackId],
    references: [feedback.id],
  }),
  user: one(users, {
    fields: [feedbackVotes.userId],
    references: [users.id],
  }),
}));

// Feedback schemas
export const insertFeedbackSchema = createInsertSchema(feedback, { 
  id: undefined,
  votes: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  resolvedAt: undefined,
});

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments, { 
  id: undefined,
  createdAt: undefined,
});

export const insertFeedbackVoteSchema = createInsertSchema(feedbackVotes, { 
  id: undefined,
  createdAt: undefined,
});

// Feedback types
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;

// DELETED: productionVersionPhaseBomProductOutputs - Replaced by PT production structures

// DELETED: productionVersionPhaseRecipeProductOutputs - Replaced by PT production structures

// DELETED: Insert schemas for productionVersionPhase tables - replaced by PT structures

// DELETED: Types for productionVersionPhase tables - replaced by PT structures

// DELETED: Relations for productionVersionPhase tables - replaced by PT structures

// Onboarding schemas
export const insertCompanyOnboardingSchema = createInsertSchema(companyOnboarding, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress, { 
  id: undefined,
  createdAt: undefined,
});

// Onboarding types
export type CompanyOnboarding = typeof companyOnboarding.$inferSelect;
export type InsertCompanyOnboarding = z.infer<typeof insertCompanyOnboardingSchema>;

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;

// Systems Integration Tables
export const systemIntegrations = pgTable("system_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemType: text("system_type").notNull(), // erp, crm, wms, mes, api, database, file_system, cloud_service
  provider: text("provider"), // SAP, Oracle, Microsoft, Salesforce, etc.
  version: text("version"),
  status: text("status").notNull().default("inactive"), // active, inactive, error, testing, configuring
  connectionType: text("connection_type").notNull(), // rest_api, soap, database, file_transfer, webhook, message_queue
  authType: text("auth_type").notNull(), // oauth2, api_key, basic_auth, certificate, token
  config: jsonb("config").$type<{
    endpoint?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    apiKey?: string;
    clientId?: string;
    scopes?: string[];
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
    retryConfig?: {
      maxRetries: number;
      backoffMs: number;
    };
    timeout?: number;
  }>().notNull(),
  lastSync: timestamp("last_sync"),
  lastError: text("last_error"),
  syncFrequency: text("sync_frequency").default("manual"), // manual, hourly, daily, weekly, real_time
  dataMapping: jsonb("data_mapping").$type<{
    inbound: Array<{
      sourceField: string;
      targetField: string;
      transformation?: string;
      validation?: string;
    }>;
    outbound: Array<{
      sourceField: string;
      targetField: string;
      transformation?: string;
      validation?: string;
    }>;
  }>().default(sql`'{"inbound": [], "outbound": []}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationJobs = pgTable("integration_jobs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => systemIntegrations.id).notNull(),
  name: text("name").notNull(),
  jobType: text("job_type").notNull(), // import, export, sync, test, validate
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  direction: text("direction").notNull(), // inbound, outbound, bidirectional
  dataType: text("data_type").notNull(), // orders, inventory, customers, schedules, reports
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  successfulRecords: integer("successful_records").default(0),
  failedRecords: integer("failed_records").default(0),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // seconds
  summary: jsonb("summary").$type<{
    newRecords: number;
    updatedRecords: number;
    skippedRecords: number;
    deletedRecords: number;
    dataQualityScore: number;
    validationErrors: number;
    transformationErrors: number;
  }>(),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationEvents = pgTable("integration_events", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => systemIntegrations.id).notNull(),
  jobId: integer("job_id").references(() => integrationJobs.id),
  eventType: text("event_type").notNull(), // connection_test, sync_start, sync_end, error, warning, info
  severity: text("severity").notNull().default("info"), // critical, error, warning, info, debug
  message: text("message").notNull(),
  details: jsonb("details").$type<Record<string, any>>(),
  recordsAffected: integer("records_affected").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationMappings = pgTable("integration_mappings", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => systemIntegrations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sourceSystem: text("source_system").notNull(),
  targetSystem: text("target_system").notNull(),
  entityType: text("entity_type").notNull(), // job, operation, resource, customer, product
  mappingRules: jsonb("mapping_rules").$type<Array<{
    sourceField: string;
    targetField: string;
    dataType: string;
    transformation?: {
      type: string; // format, calculate, lookup, conditional
      config: any;
    };
    validation?: {
      required: boolean;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      minValue?: number;
      maxValue?: number;
    };
    defaultValue?: any;
  }>>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationTemplates = pgTable("integration_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemType: text("system_type").notNull(),
  provider: text("provider").notNull(),
  version: text("version"),
  category: text("category").notNull(), // manufacturing, finance, hr, logistics, quality
  templateConfig: jsonb("template_config").$type<{
    connectionSettings: Record<string, any>;
    defaultMappings: Array<{
      sourceField: string;
      targetField: string;
      dataType: string;
    }>;
    requiredFields: string[];
    optionalFields: string[];
    testData: Record<string, any>;
  }>().notNull(),
  aiPrompt: text("ai_prompt"), // Prompt for AI-assisted setup
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(5), // 1-5 stars
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduling History System - Track algorithm execution results
export const schedulingHistory: any = pgTable("scheduling_history", {
  id: serial("id").primaryKey(),
  algorithmName: text("algorithm_name").notNull(),
  algorithmType: text("algorithm_type").notNull(), // backwards_scheduling, forward_scheduling, constraint_based, ai_optimized
  algorithmVersion: text("algorithm_version").notNull().default("1.0.0"),
  executionMode: text("execution_mode").notNull().default("production"), // production, simulation, test
  triggeredBy: integer("triggered_by").references(() => users.id).notNull(),
  triggerMethod: text("trigger_method").notNull().default("manual"), // manual, automated, scheduled, api
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  status: text("status").notNull().default("running"), // running, completed, failed, cancelled
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  executionDuration: integer("execution_duration"), // milliseconds
  inputData: jsonb("input_data").$type<{
    jobs: any[];
    resources: any[];
    operations: any[];
    parameters: Record<string, any>;
    constraints: Record<string, any>;
  }>().notNull(),
  outputData: jsonb("output_data").$type<{
    schedule: any[];
    metrics: Record<string, any>;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  }>(),
  performanceMetrics: jsonb("performance_metrics").$type<{
    operationsScheduled: number;
    resourceUtilization: number;
    onTimeDelivery: number;
    totalCost: number;
    bottlenecks: string[];
    efficiency: number;
    qualityScore: number;
  }>(),
  comparisonBaseline: integer("comparison_baseline").references(() => schedulingHistory.id), // Compare against previous run
  improvementMetrics: jsonb("improvement_metrics").$type<{
    durationImprovement: number; // percentage
    utilizationImprovement: number;
    costImprovement: number;
    deliveryImprovement: number;
  }>(),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isBookmarked: boolean("is_bookmarked").default(false),
  shareLevel: text("share_level").notNull().default("team"), // private, team, plant, organization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detailed scheduling results for each operation
export const schedulingResults = pgTable("scheduling_results", {
  id: serial("id").primaryKey(),
  historyId: integer("history_id").references(() => schedulingHistory.id).notNull(),
  // References PT Job Operations
  ptJobOperationId: integer("pt_job_operation_id").references(() => ptJobOperations.id),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id),
  originalStartTime: timestamp("original_start_time"),
  originalEndTime: timestamp("original_end_time"),
  newStartTime: timestamp("new_start_time"),
  newEndTime: timestamp("new_end_time"),
  duration: integer("duration").notNull(), // hours
  status: text("status").notNull().default("scheduled"), // scheduled, delayed, conflict, cancelled
  priority: integer("priority").default(5),
  resourceUtilization: integer("resource_utilization"), // percentage
  constraintsViolated: jsonb("constraints_violated").$type<string[]>().default([]),
  optimizationScore: integer("optimization_score"), // 1-100
  conflicts: jsonb("conflicts").$type<Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    affectedOperations: number[];
  }>>().default([]),
  alternatives: jsonb("alternatives").$type<Array<{
    resourceId: number;
    startTime: string;
    endTime: string;
    score: number;
    reason: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Algorithm performance tracking
export const algorithmPerformance = pgTable("algorithm_performance", {
  id: serial("id").primaryKey(),
  algorithmName: text("algorithm_name").notNull(),
  algorithmType: text("algorithm_type").notNull(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  executionCount: integer("execution_count").default(0),
  successCount: integer("success_count").default(0),
  averageExecutionTime: integer("average_execution_time").default(0), // milliseconds
  averageImprovement: integer("average_improvement").default(0), // percentage
  averageUtilization: integer("average_utilization").default(0), // percentage
  bestPerformanceHistoryId: integer("best_performance_history_id").references(() => schedulingHistory.id),
  worstPerformanceHistoryId: integer("worst_performance_history_id").references(() => schedulingHistory.id),
  trends: jsonb("trends").$type<{
    utilizationTrend: "improving" | "declining" | "stable";
    executionTimeTrend: "improving" | "declining" | "stable";
    qualityTrend: "improving" | "declining" | "stable";
    monthlyStats: Array<{
      month: string;
      executions: number;
      avgUtilization: number;
      avgDuration: number;
    }>;
  }>(),
  recommendations: jsonb("recommendations").$type<Array<{
    type: "parameter_adjustment" | "algorithm_change" | "resource_addition" | "process_improvement";
    description: string;
    priority: "low" | "medium" | "high";
    estimatedImpact: number;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Systems Integration Insert Schemas
export const insertSystemIntegrationSchema = createInsertSchema(systemIntegrations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertIntegrationJobSchema = createInsertSchema(integrationJobs, { 
  id: undefined,
  createdAt: undefined,
});

export const insertIntegrationEventSchema = createInsertSchema(integrationEvents, { 
  id: undefined,
  createdAt: undefined,
});

// Scheduling History Insert Schemas
export const insertSchedulingHistorySchema = createInsertSchema(schedulingHistory, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSchedulingResultSchema = createInsertSchema(schedulingResults, { 
  id: undefined,
  createdAt: undefined,
});

export const insertAlgorithmPerformanceSchema = createInsertSchema(algorithmPerformance, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// TypeScript types for scheduling history
export type SchedulingHistory = typeof schedulingHistory.$inferSelect;
export type InsertSchedulingHistory = z.infer<typeof insertSchedulingHistorySchema>;
export type SchedulingResult = typeof schedulingResults.$inferSelect;
export type InsertSchedulingResult = z.infer<typeof insertSchedulingResultSchema>;
export type AlgorithmPerformance = typeof algorithmPerformance.$inferSelect;
export type InsertAlgorithmPerformance = z.infer<typeof insertAlgorithmPerformanceSchema>;

export const insertIntegrationMappingSchema = createInsertSchema(integrationMappings, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertIntegrationTemplateSchema = createInsertSchema(integrationTemplates, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Systems Integration Types
export type SystemIntegration = typeof systemIntegrations.$inferSelect;
export type InsertSystemIntegration = z.infer<typeof insertSystemIntegrationSchema>;

export type IntegrationJob = typeof integrationJobs.$inferSelect;
export type InsertIntegrationJob = z.infer<typeof insertIntegrationJobSchema>;

export type IntegrationEvent = typeof integrationEvents.$inferSelect;
export type InsertIntegrationEvent = z.infer<typeof insertIntegrationEventSchema>;

export type IntegrationMapping = typeof integrationMappings.$inferSelect;
export type InsertIntegrationMapping = z.infer<typeof insertIntegrationMappingSchema>;

export type IntegrationTemplate = typeof integrationTemplates.$inferSelect;
export type InsertIntegrationTemplate = z.infer<typeof insertIntegrationTemplateSchema>;

export type FeedbackVote = typeof feedbackVotes.$inferSelect;
export type InsertFeedbackVote = z.infer<typeof insertFeedbackVoteSchema>;

// Workflow Automation Insert Schemas
export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers, { 
  id: undefined,
  lastTriggered: undefined,
  triggerCount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertWorkflowActionSchema = createInsertSchema(workflowActions, { 
  id: undefined,
  executionCount: undefined,
  lastExecuted: undefined,
  averageExecutionTime: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertWorkflowSchema = createInsertSchema(workflows, { 
  id: undefined,
  executionCount: undefined,
  successCount: undefined,
  errorCount: undefined,
  lastExecuted: undefined,
  averageExecutionTime: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertWorkflowActionMappingSchema = createInsertSchema(workflowActionMappings, { 
  id: undefined,
  createdAt: undefined,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions, { 
  id: undefined,
  createdAt: undefined,
});

export const insertWorkflowActionExecutionSchema = createInsertSchema(workflowActionExecutions, { 
  id: undefined,
  createdAt: undefined,
});

export const insertWorkflowMonitoringSchema = createInsertSchema(workflowMonitoring, { 
  id: undefined,
  lastAlert: undefined,
  alertCount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Workflow Automation Types
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type InsertWorkflowTrigger = z.infer<typeof insertWorkflowTriggerSchema>;

export type WorkflowAction = typeof workflowActions.$inferSelect;
export type InsertWorkflowAction = z.infer<typeof insertWorkflowActionSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowActionMapping = typeof workflowActionMappings.$inferSelect;
export type InsertWorkflowActionMapping = z.infer<typeof insertWorkflowActionMappingSchema>;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;

export type WorkflowActionExecution = typeof workflowActionExecutions.$inferSelect;
export type InsertWorkflowActionExecution = z.infer<typeof insertWorkflowActionExecutionSchema>;

export type WorkflowMonitoring = typeof workflowMonitoring.$inferSelect;
export type InsertWorkflowMonitoring = z.infer<typeof insertWorkflowMonitoringSchema>;

// Plant Management Schemas - Temporarily removed PT.ptPlants references

// Extension Studio Tables
export const extensions = pgTable("extensions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  version: text("version").notNull().default("1.0.0"),
  type: text("type").notNull(), // component, workflow, integration, dashboard, report
  category: text("category").notNull(), // ui, automation, analytics, integration
  status: text("status").notNull().default("draft"), // draft, published, active, deprecated
  visibility: text("visibility").notNull().default("private"), // private, public, company
  configuration: jsonb("configuration").$type<{
    entryPoint?: string;
    dependencies?: string[];
    permissions?: string[];
    settings?: Record<string, any>;
    triggers?: Array<{
      event: string;
      conditions?: Record<string, any>;
    }>;
  }>().default({}),
  sourceCode: text("source_code"), // Main extension code
  manifest: jsonb("manifest").$type<{
    name: string;
    version: string;
    author: string;
    description: string;
    main: string;
    permissions: string[];
    api_version: string;
    min_app_version: string;
  }>(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  installCount: integer("install_count").default(0),
  rating: integer("rating").default(0), // Average rating * 10 (for decimal precision)
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const extensionFiles = pgTable("extension_files", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id).notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(), // js, tsx, css, json, md
  size: integer("size").notNull(), // in bytes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const extensionInstallations = pgTable("extension_installations", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("active"), // active, disabled, error
  configuration: jsonb("configuration").$type<Record<string, any>>().default({}),
  installedAt: timestamp("installed_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export const extensionMarketplace = pgTable("extension_marketplace", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id).notNull(),
  featured: boolean("featured").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  screenshots: jsonb("screenshots").$type<string[]>().default([]), // Base64 images
  documentation: text("documentation"),
  changelog: text("changelog"),
  supportUrl: text("support_url"),
  pricing: jsonb("pricing").$type<{
    type: "free" | "paid" | "subscription";
    price?: number;
    currency?: string;
    billingPeriod?: "monthly" | "yearly" | "one-time";
  }>().default({ type: "free" }),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const extensionReviews = pgTable("extension_reviews", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  review: text("review"),
  helpful: integer("helpful").default(0), // Number of helpful votes
  createdAt: timestamp("created_at").defaultNow(),
});



// Algorithm Feedback System - User feedback on algorithm performance for continuous improvement
export const algorithmFeedback = pgTable("algorithm_feedback", {
  id: serial("id").primaryKey(),
  // Links to specific algorithm execution
  schedulingHistoryId: integer("scheduling_history_id").references(() => schedulingHistory.id),
  algorithmPerformanceId: integer("algorithm_performance_id").references(() => algorithmPerformance.id),
  optimizationRunId: integer("optimization_run_id").references(() => optimizationRuns.id),
  
  // Algorithm identification
  algorithmName: text("algorithm_name").notNull(),
  algorithmVersion: text("algorithm_version").notNull(),
  executionId: text("execution_id"), // For tracking specific executions
  
  // Feedback details
  submittedBy: integer("submitted_by").references(() => users.id).notNull(),
  feedbackType: text("feedback_type").notNull(), // improvement_suggestion, bug_report, performance_issue, positive_feedback
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  category: text("category").notNull(), // scheduling_accuracy, resource_utilization, performance, usability, results_quality
  
  // Feedback content
  title: text("title").notNull(),
  description: text("description").notNull(),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  suggestedImprovement: text("suggested_improvement"),
  
  // Context information
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  executionContext: jsonb("execution_context").$type<{
    jobCount?: number;
    resourceCount?: number;
    operationCount?: number;
    planningHorizon?: number;
    constraints?: string[];
    parameters?: Record<string, any>;
    datasetSize?: string;
    complexity?: "low" | "medium" | "high";
  }>(),
  
  // Performance metrics at time of feedback
  performanceSnapshot: jsonb("performance_snapshot").$type<{
    executionTime?: number; // milliseconds
    resourceUtilization?: number; // percentage
    onTimeDelivery?: number; // percentage
    costOptimization?: number; // percentage
    makespan?: number; // minutes
    bottlenecks?: string[];
    errors?: string[];
    warnings?: string[];
  }>(),
  
  // Reproduction information
  reproducible: boolean("reproducible").default(false),
  reproductionSteps: jsonb("reproduction_steps").$type<string[]>(),
  attachments: jsonb("attachments").$type<Array<{
    filename: string;
    type: string; // screenshot, log, data_export, config
    content: string; // base64 or file path
    description?: string;
  }>>().default([]),
  
  // Feedback status and resolution
  status: text("status").notNull().default("open"), // open, acknowledged, in_progress, resolved, closed, wont_fix
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  
  // Implementation tracking
  implementationStatus: text("implementation_status").default("pending"), // pending, planned, in_development, testing, deployed, rejected
  targetVersion: text("target_version"),
  implementedInVersion: text("implemented_in_version"),
  estimatedEffort: text("estimated_effort"), // hours, days, weeks
  implementationNotes: text("implementation_notes"),
  
  // Voting and validation
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  validatedBy: jsonb("validated_by").$type<Array<{
    userId: number;
    role: string;
    validatedAt: string;
    comments?: string;
  }>>().default([]),
  
  // Categorization and tagging
  tags: jsonb("tags").$type<string[]>().default([]),
  relatedFeedback: jsonb("related_feedback").$type<number[]>().default([]), // IDs of related feedback items
  
  // Audit trail
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastViewedAt: timestamp("last_viewed_at"),
}, (table) => ({
  feedbackTypeIndex: index("algorithm_feedback_type_idx").on(table.feedbackType),
  algorithmNameIndex: index("algorithm_feedback_algorithm_idx").on(table.algorithmName),
  statusIndex: index("algorithm_feedback_status_idx").on(table.status),
  submittedByIndex: index("algorithm_feedback_user_idx").on(table.submittedBy),
  createdAtIndex: index("algorithm_feedback_created_idx").on(table.createdAt),
  severityIndex: index("algorithm_feedback_severity_idx").on(table.severity),
  categoryIndex: index("algorithm_feedback_category_idx").on(table.category),
}));

// Algorithm Feedback Comments - Discussion thread for each feedback item
export const algorithmFeedbackComments = pgTable("algorithm_feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => algorithmFeedback.id, { onDelete: "cascade" }).notNull(),
  parentCommentId: integer("parent_comment_id"), // For nested comments - self-reference
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  commentType: text("comment_type").notNull().default("comment"), // comment, status_update, resolution, implementation_update
  mentions: jsonb("mentions").$type<number[]>().default([]), // User IDs mentioned in comment
  attachments: jsonb("attachments").$type<Array<{
    filename: string;
    type: string;
    content: string;
    description?: string;
  }>>().default([]),
  isInternal: boolean("is_internal").default(false), // Internal team comments vs public
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  feedbackIdIndex: index("feedback_comments_feedback_idx").on(table.feedbackId),
  authorIndex: index("feedback_comments_author_idx").on(table.authorId),
  createdAtIndex: index("feedback_comments_created_idx").on(table.createdAt),
}));

// Algorithm Feedback Votes - Track user votes on feedback items
export const algorithmFeedbackVotes = pgTable("algorithm_feedback_votes", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => algorithmFeedback.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: text("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueVote: unique().on(table.feedbackId, table.userId),
  feedbackIdIndex: index("feedback_votes_feedback_idx").on(table.feedbackId),
  userIdIndex: index("feedback_votes_user_idx").on(table.userId),
}));

// Optimization Studio Tables
export const optimizationAlgorithms: any = pgTable("optimization_algorithms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // schedule_optimization, inventory_optimization, capacity_optimization, demand_forecasting, ctp_optimization, order_optimization
  type: text("type").notNull(), // standard, custom, derived
  baseAlgorithmId: integer("base_algorithm_id").references(() => optimizationAlgorithms.id), // For derived algorithms
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("draft"), // draft, testing, approved, deployed, deprecated
  isStandard: boolean("is_standard").default(false), // System-provided standard algorithms
  configuration: jsonb("configuration").$type<{
    parameters: Record<string, {
      type: string;
      default: any;
      min?: number;
      max?: number;
      options?: string[];
      description: string;
      required: boolean;
    }>;
    constraints: Array<{
      name: string;
      type: string;
      value: any;
      description: string;
    }>;
    objectives: Array<{
      name: string;
      type: string; // minimize, maximize
      weight: number;
      description: string;
    }>;
    dataSources: string[]; // Which data types the algorithm needs
    extensionData: Array<{
      entityType: string; // jobs, resources, operations, custom
      fields: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
      }>;
    }>;
  }>().default(sql`'{}'::jsonb`),
  algorithmCode: text("algorithm_code"), // AI-generated or custom algorithm logic
  uiComponents: jsonb("ui_components").$type<{
    settingsForm: Array<{
      field: string;
      type: string;
      label: string;
      placeholder?: string;
      options?: string[];
      validation?: Record<string, any>;
    }>;
    resultsDisplay: Array<{
      type: string; // chart, table, metric, summary
      config: Record<string, any>;
    }>;
  }>().default(sql`'{}'::jsonb`),
  performance: jsonb("performance").$type<{
    averageExecutionTime: number; // milliseconds
    memoryUsage: number; // MB
    successRate: number; // percentage
    lastBenchmark: string;
    testResults: Array<{
      testId: string;
      dataset: string;
      score: number;
      metrics: Record<string, number>;
      executedAt: string;
    }>;
  }>().default(sql`'{}'::jsonb`),
  approvals: jsonb("approvals").$type<{
    approved: boolean;
    approvedBy: number | null;
    approvedAt: string | null;
    comments: string;
    requiredPermissions: string[];
  }>().default({ approved: false, approvedBy: null, approvedAt: null, comments: "", requiredPermissions: [] }),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const algorithmTests = pgTable("algorithm_tests", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  testType: text("test_type").notNull(), // performance, accuracy, stress, comparison
  configuration: jsonb("configuration").$type<{
    dataset: {
      type: string; // sample, production, synthetic
      size: number;
      parameters: Record<string, any>;
    };
    metrics: string[]; // Which metrics to track
    constraints: Record<string, any>;
    duration: number; // Test duration in minutes
  }>().notNull(),
  results: jsonb("results").$type<{
    status: string; // running, completed, failed
    startTime: string;
    endTime: string;
    executionTime: number;
    memoryUsed: number;
    score: number;
    metrics: Record<string, number>;
    errors: string[];
    output: any;
    comparison?: {
      baselineAlgorithm: number;
      improvement: number;
      significantDifference: boolean;
    };
  }>(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const algorithmDeployments = pgTable("algorithm_deployments", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  targetModule: text("target_module").notNull(), // production_scheduling, inventory_optimization, capacity_planning
  environment: text("environment").notNull(), // development, staging, production
  version: text("version").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, rollback, failed
  configuration: jsonb("configuration").$type<Record<string, any>>().default({}),
  rollbackConfig: jsonb("rollback_config").$type<{
    previousAlgorithmId: number | null;
    rollbackTriggers: Array<{
      metric: string;
      threshold: number;
      operator: string;
    }>;
  }>(),
  deployedBy: integer("deployed_by").references(() => users.id).notNull(),
  deployedAt: timestamp("deployed_at").defaultNow(),
  lastHealthCheck: timestamp("last_health_check"),
  metrics: jsonb("metrics").$type<Record<string, number>>().default({}),
});

export const extensionData = pgTable("extension_data", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  entityType: text("entity_type").notNull(), // jobs, resources, operations, custom
  entityId: integer("entity_id"), // ID of the related entity (can be null for custom entities)
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // string, number, boolean, date, json
  value: jsonb("value").notNull(),
  metadata: jsonb("metadata").$type<{
    description?: string;
    source?: string;
    lastUpdated?: string;
    validationRules?: Record<string, any>;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Optimization Scope Configurations - Flexible filtering for optimization runs
export const optimizationScopeConfigs = pgTable("optimization_scope_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("production_scheduling"), // production_scheduling, inventory_optimization, capacity_planning
  isDefault: boolean("is_default").default(false),
  isShared: boolean("is_shared").default(false), // Can be used by other users
  scopeFilters: jsonb("scope_filters").$type<{
    plants?: {
      include: number[]; // plant IDs to include
      exclude: number[]; // plant IDs to exclude
    };
    resources?: {
      include: number[]; // resource IDs to include
      exclude: number[]; // resource IDs to exclude
      types?: string[]; // resource types to include
      status?: string[]; // resource status to include
    };
    productionOrders?: {
      include: number[]; // production order IDs to include
      exclude: number[]; // production order IDs to exclude
      priorities?: string[]; // priority levels to include
      customers?: string[]; // customers to include
      statuses?: string[]; // order statuses to include
      dueDateRange?: {
        start: string; // ISO date string
        end: string; // ISO date string
      };
    };
    operations?: {
      include: number[]; // operation IDs to include
      exclude: number[]; // operation IDs to exclude
      capabilities?: number[]; // required capability IDs
      status?: string[]; // operation statuses to include
    };
    items?: {
      include: string[]; // item numbers to include
      exclude: string[]; // item numbers to exclude
      categories?: string[]; // item categories to include
    };
    dateRange?: {
      start: string; // ISO date string
      end: string; // ISO date string
    };
    customFilters?: Record<string, any>; // For algorithm-specific filters
  }>().notNull().default({}),
  optimizationGoals: jsonb("optimization_goals").$type<{
    primary: string; // cost_reduction, time_optimization, resource_utilization, quality_improvement
    secondary?: string[];
    weights?: Record<string, number>; // Weight distribution for multi-objective optimization
  }>().default(sql`'{"primary": "cost_reduction"}'::jsonb`),
  constraints: jsonb("constraints").$type<{
    maxExecutionTime?: number; // in minutes
    resourceCapacityLimits?: Record<string, number>;
    mandatoryBreaks?: boolean;
    overtimeAllowed?: boolean;
    parallelProcessing?: boolean;
    customConstraints?: Record<string, any>;
  }>().default({}),
  metadata: jsonb("metadata").$type<{
    estimatedItems?: number;
    estimatedComplexity?: "low" | "medium" | "high";
    lastUsed?: string;
    usageCount?: number;
    averageExecutionTime?: number;
    successRate?: number;
  }>().default({}),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Optimization Run History - Track scope configurations used in optimization runs
export const optimizationRuns = pgTable("optimization_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  scopeConfigId: integer("scope_config_id").references(() => optimizationScopeConfigs.id),
  scopeSnapshot: jsonb("scope_snapshot").$type<typeof optimizationScopeConfigs.$inferSelect.scopeFilters>().notNull(), // Snapshot of filters used
  parameters: jsonb("parameters").$type<Record<string, any>>().default({}),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  results: jsonb("results").$type<{
    totalItemsProcessed?: number;
    improvementMetrics?: Record<string, number>;
    executionTime?: number; // in milliseconds
    memoryUsage?: number; // in MB
    optimizationScore?: number;
    beforeMetrics?: Record<string, any>;
    afterMetrics?: Record<string, any>;
    recommendations?: Array<{
      type: string;
      description: string;
      impact: string;
      priority: "low" | "medium" | "high";
    }>;
  }>(),
  error: text("error"), // Error message if failed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Optimization Profiles - Algorithm-specific execution configurations for schedulers
export const optimizationProfiles = pgTable("optimization_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  isDefault: boolean("is_default").default(false),
  isShared: boolean("is_shared").default(false), // Can be used by other schedulers
  profileConfig: jsonb("profile_config").$type<{
    // General scheduler options
    includePlannedOrders?: {
      enabled: boolean;
      weight?: number; // Priority weight vs production orders (0.1-1.0)
      convertToProduction?: boolean; // Auto-convert planned orders when scheduled
    };
    
    // Scope selection
    scope?: {
      plantIds?: number[]; // Which plants to include in optimization
      resourceIds?: number[]; // Specific resources to optimize
      resourceTypes?: string[]; // Filter by resource type
      capabilityIds?: number[]; // Required capabilities
      productionOrderIds?: number[]; // Specific orders to include
      excludeOrderIds?: number[]; // Orders to exclude
      dateRange?: {
        start: string;
        end: string;
      };
    };
    
    // Algorithm-specific parameters (varies by algorithm)
    algorithmParameters?: {
      // Backwards Scheduling specific
      backwardsScheduling?: {
        bufferTime?: number; // Buffer time in minutes
        allowOvertime?: boolean;
        maxOvertimePerDay?: number; // Minutes
        prioritizeByDueDate?: boolean;
        considerSetupTimes?: boolean;
        setupTimeMatrix?: Record<string, Record<string, number>>;
      };
      
      // Forward Scheduling specific  
      forwardScheduling?: {
        startDate?: string;
        prioritizeByPriority?: boolean;
        loadBalancing?: boolean;
        allowResourceSwitching?: boolean;
        maxQueueTime?: number; // Minutes
      };
      
      // Job Shop Scheduling specific
      jobShopScheduling?: {
        optimizationStrategy?: "makespan" | "flow_time" | "resource_utilization";
        allowPreemption?: boolean;
        sequenceOptimization?: boolean;
        bottleneckFocus?: boolean;
      };
      
      // Capacity Planning specific
      capacityPlanning?: {
        planningHorizon?: number; // Days
        considerMaintenance?: boolean;
        allowCapacityExpansion?: boolean;
        demandVariability?: number; // Percentage
      };
      
      // Custom algorithm parameters
      custom?: Record<string, any>;
    };
    
    // Optimization objectives and weights
    objectives?: {
      primary: "minimize_makespan" | "minimize_cost" | "maximize_throughput" | "minimize_lateness" | "maximize_utilization";
      secondary?: string[];
      weights?: Record<string, number>; // Objective importance weights
    };
    
    // Constraints
    constraints?: {
      maxExecutionTime?: number; // Minutes
      resourceCapacityLimits?: boolean;
      shiftConstraints?: boolean;
      skillRequirements?: boolean;
      qualityConstraints?: boolean;
      safetyRequirements?: boolean;
      customConstraints?: Record<string, any>;
    };
    
    // Performance settings
    performance?: {
      maxIterations?: number;
      convergenceThreshold?: number;
      parallelProcessing?: boolean;
      memoryLimit?: number; // MB
      timeoutMinutes?: number;
    };
    
    // Output preferences
    output?: {
      includeGanttChart?: boolean;
      includeResourceUtilization?: boolean;
      includeKPIReports?: boolean;
      emailNotification?: boolean;
      exportFormat?: "excel" | "pdf" | "csv" | "json";
    };
  }>().notNull().default({}),
  
  // Validation rules for the profile
  validationRules: jsonb("validation_rules").$type<{
    requiredFields?: string[];
    constraints?: Array<{
      field: string;
      operator: "gt" | "lt" | "gte" | "lte" | "eq" | "ne" | "in" | "range";
      value: any;
      message: string;
    }>;
    dependencies?: Array<{
      ifField: string;
      ifValue: any;
      thenRequire: string[];
      thenForbid?: string[];
    }>;
  }>().default({}),
  
  // Usage statistics
  metadata: jsonb("metadata").$type<{
    usageCount?: number;
    lastUsed?: string;
    averageExecutionTime?: number; // Minutes
    successRate?: number; // Percentage
    typicalDataSize?: {
      orders: number;
      resources: number;
      operations: number;
    };
    compatibleAlgorithmVersions?: string[];
  }>().default({}),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Profile Usage History - Track when profiles are used in optimization runs
export const profileUsageHistory = pgTable("profile_usage_history", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => optimizationProfiles.id).notNull(),
  optimizationRunId: integer("optimization_run_id").references(() => optimizationRuns.id).notNull(),
  profileSnapshot: jsonb("profile_snapshot").$type<typeof optimizationProfiles.$inferSelect.profileConfig>().notNull(),
  executionResults: jsonb("execution_results").$type<{
    executionTime?: number; // Minutes
    dataProcessed?: {
      orders: number;
      resources: number;
      operations: number;
    };
    kpis?: Record<string, number>;
    errors?: string[];
    warnings?: string[];
  }>(),
  usedBy: integer("used_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Optimization Studio Insert Schemas
export const insertOptimizationAlgorithmSchema = createInsertSchema(optimizationAlgorithms, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertAlgorithmTestSchema = createInsertSchema(algorithmTests, { 
  id: undefined,
  createdAt: undefined,
});

export const insertAlgorithmDeploymentSchema = createInsertSchema(algorithmDeployments, { 
  id: undefined,
  deployedAt: undefined,
  lastHealthCheck: undefined,
});

export const insertExtensionDataSchema = createInsertSchema(extensionData, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertExtensionFileSchema = createInsertSchema(extensionFiles, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertExtensionInstallationSchema = createInsertSchema(extensionInstallations, { 
  id: undefined,
  installedAt: undefined,
  lastUsed: undefined,
});

export const insertExtensionMarketplaceSchema = createInsertSchema(extensionMarketplace, { 
  id: undefined,
  publishedAt: undefined,
  updatedAt: undefined,
});

export const insertExtensionReviewSchema = createInsertSchema(extensionReviews, { 
  id: undefined,
  helpful: undefined,
  createdAt: undefined,
});

export const insertExtensionSchema = createInsertSchema(extensions, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Extension Studio Types
export type Extension = typeof extensions.$inferSelect;
export type InsertExtension = z.infer<typeof insertExtensionSchema>;

export type ExtensionFile = typeof extensionFiles.$inferSelect;
export type InsertExtensionFile = z.infer<typeof insertExtensionFileSchema>;

export type ExtensionInstallation = typeof extensionInstallations.$inferSelect;
export type InsertExtensionInstallation = z.infer<typeof insertExtensionInstallationSchema>;

export type ExtensionMarketplace = typeof extensionMarketplace.$inferSelect;
export type InsertExtensionMarketplace = z.infer<typeof insertExtensionMarketplaceSchema>;

export type ExtensionReview = typeof extensionReviews.$inferSelect;
export type InsertExtensionReview = z.infer<typeof insertExtensionReviewSchema>;

// Optimization Studio Types
export type OptimizationAlgorithm = typeof optimizationAlgorithms.$inferSelect;
export type InsertOptimizationAlgorithm = z.infer<typeof insertOptimizationAlgorithmSchema>;

export type AlgorithmTest = typeof algorithmTests.$inferSelect;
export type InsertAlgorithmTest = z.infer<typeof insertAlgorithmTestSchema>;

export type AlgorithmDeployment = typeof algorithmDeployments.$inferSelect;
export type InsertAlgorithmDeployment = z.infer<typeof insertAlgorithmDeploymentSchema>;

export type ExtensionData = typeof extensionData.$inferSelect;
export type InsertExtensionData = z.infer<typeof insertExtensionDataSchema>;

// Optimization Scope Configuration Insert Schemas
export const insertOptimizationScopeConfigSchema = createInsertSchema(optimizationScopeConfigs, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertOptimizationRunSchema = createInsertSchema(optimizationRuns, { 
  id: undefined,
  createdAt: undefined,
});

// Optimization Profiles Insert Schemas
export const insertOptimizationProfileSchema = createInsertSchema(optimizationProfiles, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertProfileUsageHistorySchema = createInsertSchema(profileUsageHistory, { 
  id: undefined,
  createdAt: undefined,
});

// Optimization Scope Configuration Types
export type OptimizationScopeConfig = typeof optimizationScopeConfigs.$inferSelect;
export type InsertOptimizationScopeConfig = z.infer<typeof insertOptimizationScopeConfigSchema>;

export type OptimizationRun = typeof optimizationRuns.$inferSelect;
export type InsertOptimizationRun = z.infer<typeof insertOptimizationRunSchema>;

// Optimization Profiles Types
export type OptimizationProfile = typeof optimizationProfiles.$inferSelect;
export type InsertOptimizationProfile = z.infer<typeof insertOptimizationProfileSchema>;

export type ProfileUsageHistory = typeof profileUsageHistory.$inferSelect;
export type InsertProfileUsageHistory = z.infer<typeof insertProfileUsageHistorySchema>;

// Error Logging and Monitoring Tables
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  errorId: text("error_id").notNull().unique(),
  message: text("message").notNull(),
  stack: text("stack"),
  componentStack: text("component_stack"),
  timestamp: timestamp("timestamp").notNull(),
  url: text("url").notNull(),
  userAgent: text("user_agent"),
  userId: text("user_id"),
  sessionId: text("session_id"),
  severity: text("severity").notNull().default("error"), // error, warning, critical
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const errorReports = pgTable("error_reports", {
  id: serial("id").primaryKey(),
  errorId: text("error_id").references(() => errorLogs.errorId).notNull(),
  userDescription: text("user_description"),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  reproductionSteps: text("reproduction_steps"),
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  assignedTo: text("assigned_to"),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs, { 
  id: undefined,
  createdAt: undefined,
});

export const insertErrorReportSchema = createInsertSchema(errorReports, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

export type InsertErrorReport = z.infer<typeof insertErrorReportSchema>;
export type ErrorReport = typeof errorReports.$inferSelect;

// Drum Analysis History - Track analysis runs for drum identification
export const drumAnalysisHistory = pgTable("drum_analysis_history", {
  id: serial("id").primaryKey(),
  analysisType: text("analysis_type").notNull(), // 'automated', 'manual', 'capacity-based', 'utilization-based'
  resourceId: integer("resource_id"), // Can be null for batch analyses
  utilizationPercentage: text("utilization_percentage"),
  bottleneckScore: text("bottleneck_score"),
  recommendation: text("recommendation"),
  isCurrentBottleneck: boolean("is_current_bottleneck").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Custom TOC Constraints - User-defined constraints following Theory of Constraints methodology
export const customConstraints = pgTable("custom_constraints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Constraint name/title
  description: text("description").notNull(), // Full text description of the constraint
  constraintType: text("constraint_type").notNull(), // 'physical' or 'policy'
  severity: text("severity").notNull(), // 'hard' (cannot be violated) or 'soft' (can be violated)
  
  // TOC-specific fields
  category: text("category"), // e.g., 'capacity', 'resource', 'material', 'schedule', 'quality', 'regulatory'
  impactArea: text("impact_area"), // e.g., 'throughput', 'inventory', 'operating_expense'
  bufferType: text("buffer_type"), // 'time', 'stock', 'capacity', 'resource'
  bufferSize: numeric("buffer_size", { precision: 10, scale: 2 }), // Numeric buffer value if applicable
  
  // Relationships
  resourceIds: jsonb("resource_ids").$type<number[]>().default([]), // Related resource IDs
  processIds: jsonb("process_ids").$type<number[]>().default([]), // Related process/operation IDs
  productIds: jsonb("product_ids").$type<number[]>().default([]), // Related product/item IDs
  
  // Constraint parameters
  parameters: jsonb("parameters").$type<{
    value?: number;
    unit?: string;
    formula?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>().default({}),
  
  // Monitoring and enforcement
  isActive: boolean("is_active").default(true),
  enforceInScheduling: boolean("enforce_in_scheduling").default(true),
  enforceInOptimization: boolean("enforce_in_optimization").default(true),
  monitoringFrequency: text("monitoring_frequency"), // 'realtime', 'hourly', 'daily', 'weekly'
  
  // Violation handling
  violationAction: text("violation_action"), // 'block', 'warn', 'log', 'notify'
  violationThreshold: numeric("violation_threshold", { precision: 10, scale: 2 }), // Threshold for soft constraints
  currentViolationCount: integer("current_violation_count").default(0),
  lastViolationDate: timestamp("last_violation_date"),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  nameIndex: index("custom_constraints_name_idx").on(table.name),
  typeIndex: index("custom_constraints_type_idx").on(table.constraintType),
  severityIndex: index("custom_constraints_severity_idx").on(table.severity),
  activeIndex: index("custom_constraints_active_idx").on(table.isActive)
}));

// Algorithm Feedback System Types and Schemas
export const insertAlgorithmFeedbackSchema = createInsertSchema(algorithmFeedback, { 
  id: undefined,
  upvotes: undefined,
  downvotes: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  lastViewedAt: undefined,
});

export const insertAlgorithmFeedbackCommentSchema = createInsertSchema(algorithmFeedbackComments, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertAlgorithmFeedbackVoteSchema = createInsertSchema(algorithmFeedbackVotes, { 
  id: undefined,
  createdAt: undefined,
});

export type AlgorithmFeedback = typeof algorithmFeedback.$inferSelect;
export type InsertAlgorithmFeedback = z.infer<typeof insertAlgorithmFeedbackSchema>;

export type AlgorithmFeedbackComment = typeof algorithmFeedbackComments.$inferSelect;
export type InsertAlgorithmFeedbackComment = z.infer<typeof insertAlgorithmFeedbackCommentSchema>;

export type AlgorithmFeedbackVote = typeof algorithmFeedbackVotes.$inferSelect;
export type InsertAlgorithmFeedbackVote = z.infer<typeof insertAlgorithmFeedbackVoteSchema>;

// Insert schemas and types for Custom Constraints
export const insertCustomConstraintSchema = createInsertSchema(customConstraints, { 
  id: undefined,
  currentViolationCount: undefined,
  lastViolationDate: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export type CustomConstraint = typeof customConstraints.$inferSelect;
export type InsertCustomConstraint = z.infer<typeof insertCustomConstraintSchema>;

// Tour Prompt Templates System
export const tourPromptTemplates = pgTable("tour_prompt_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // general, role_specific, business_focused, technical, sales_demo
  promptContent: text("prompt_content").notNull(),
  variables: jsonb("variables").$type<Array<{
    name: string;
    description: string;
    type: "text" | "select" | "number" | "boolean";
    required: boolean;
    defaultValue?: any;
    options?: string[]; // for select types
  }>>().default([]),
  isBuiltIn: boolean("is_built_in").default(false),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(0), // User rating 1-5
  tags: jsonb("tags").$type<string[]>().default([]),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tourPromptTemplateUsage = pgTable("tour_prompt_template_usage", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => tourPromptTemplates.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tourCount: integer("tour_count").default(1), // Number of tours generated in this usage
  variables: jsonb("variables").$type<Record<string, any>>().default({}), // Variable values used
  generationDuration: integer("generation_duration"), // milliseconds
  satisfactionRating: integer("satisfaction_rating"), // 1-5, how satisfied user was with results
  feedback: text("feedback"), // User feedback on the generated tours
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTourPromptTemplateSchema = createInsertSchema(tourPromptTemplates, { 
  id: undefined,
  usageCount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  lastUsed: undefined,
});

export const insertTourPromptTemplateUsageSchema = createInsertSchema(tourPromptTemplateUsage, { 
  id: undefined,
  createdAt: undefined,
});

// Tour Prompt Templates Types
export type TourPromptTemplate = typeof tourPromptTemplates.$inferSelect;
export type InsertTourPromptTemplate = z.infer<typeof insertTourPromptTemplateSchema>;

export type TourPromptTemplateUsage = typeof tourPromptTemplateUsage.$inferSelect;
export type InsertTourPromptTemplateUsage = z.infer<typeof insertTourPromptTemplateUsageSchema>;

// Max AI Memory Management Tables
export const aiMemories = pgTable("ai_memories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Can be user ID or demo user ID
  type: text("type").notNull(), // conversation, workflow_pattern, preference, insight, interaction
  category: text("category").notNull(), // page_usage, feature_preference, optimization_pattern, communication_style, error_pattern
  content: text("content").notNull(), // The actual memory content
  context: jsonb("context").$type<{
    page?: string;
    feature?: string;
    action?: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }>().default({}),
  confidence: integer("confidence").notNull().default(50), // 0-100 confidence score
  importance: text("importance").notNull().default("medium"), // low, medium, high, critical
  source: text("source").notNull().default("chat"), // chat, navigation, interaction, system_observation
  lastAccessed: timestamp("last_accessed").defaultNow(),
  accessCount: integer("access_count").default(1),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary memories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiMemoryTags = pgTable("ai_memory_tags", {
  id: serial("id").primaryKey(),
  memoryId: integer("memory_id").references(() => aiMemories.id).notNull(),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiConversationContext = pgTable("ai_conversation_context", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  conversationSummary: text("conversation_summary"),
  topics: jsonb("topics").$type<string[]>().default([]),
  keyInsights: jsonb("key_insights").$type<Array<{
    insight: string;
    confidence: number;
    timestamp: string;
  }>>().default([]),
  userGoals: jsonb("user_goals").$type<string[]>().default([]),
  preferredInteractionStyle: text("preferred_interaction_style"), // detailed, concise, technical, conversational
  totalMessages: integer("total_messages").default(0),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userSessionIdx: unique().on(table.userId, table.sessionId),
}));

// AI Memory Relations
export const aiMemoriesRelations = relations(aiMemories, ({ many }) => ({
  tags: many(aiMemoryTags),
}));

export const aiMemoryTagsRelations = relations(aiMemoryTags, ({ one }) => ({
  memory: one(aiMemories, {
    fields: [aiMemoryTags.memoryId],
    references: [aiMemories.id],
  }),
}));

// AI Memory Insert Schemas
export const insertAIMemorySchema = createInsertSchema(aiMemories, { 
  id: undefined,
  lastAccessed: undefined,
  accessCount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertAIMemoryTagSchema = createInsertSchema(aiMemoryTags, { 
  id: undefined,
  createdAt: undefined,
});

export const insertAIConversationContextSchema = createInsertSchema(aiConversationContext, { 
  id: undefined,
  totalMessages: undefined,
  lastInteraction: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// AI Memory Types
export type AIMemory = typeof aiMemories.$inferSelect;
export type InsertAIMemory = z.infer<typeof insertAIMemorySchema>;

export type AIMemoryTag = typeof aiMemoryTags.$inferSelect;
export type InsertAIMemoryTag = z.infer<typeof insertAIMemoryTagSchema>;

export type AIConversationContext = typeof aiConversationContext.$inferSelect;
export type InsertAIConversationContext = z.infer<typeof insertAIConversationContextSchema>;

// Presentation System Insert Schemas
export const insertPresentationSchema = createInsertSchema(presentations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertPresentationSlideSchema = createInsertSchema(presentationSlides, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertPresentationTourIntegrationSchema = createInsertSchema(presentationTourIntegrations, { 
  id: undefined,
  createdAt: undefined,
});

export const insertPresentationLibrarySchema = createInsertSchema(presentationLibrary, { 
  id: undefined,
  downloadCount: undefined,
  rating: undefined,
  ratingCount: undefined,
  approvedAt: undefined,
  createdAt: undefined,
});

export const insertPresentationAnalyticsSchema = createInsertSchema(presentationAnalytics, { 
  id: undefined,
  createdAt: undefined,
});

export const insertPresentationAIContentSchema = createInsertSchema(presentationAIContent, { 
  id: undefined,
  createdAt: undefined,
});

// Presentation Studio Insert Schemas
export const insertPresentationMaterialSchema = createInsertSchema(presentationMaterials, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertPresentationContentSuggestionSchema = createInsertSchema(presentationContentSuggestions, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertPresentationProjectSchema = createInsertSchema(presentationProjects, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Presentation System Types
export type Presentation = typeof presentations.$inferSelect;
export type InsertPresentation = z.infer<typeof insertPresentationSchema>;

export type PresentationSlide = typeof presentationSlides.$inferSelect;
export type InsertPresentationSlide = z.infer<typeof insertPresentationSlideSchema>;

export type PresentationTourIntegration = typeof presentationTourIntegrations.$inferSelect;
export type InsertPresentationTourIntegration = z.infer<typeof insertPresentationTourIntegrationSchema>;

// Presentation Studio Types
export type PresentationMaterial = typeof presentationMaterials.$inferSelect;
export type InsertPresentationMaterial = z.infer<typeof insertPresentationMaterialSchema>;

export type PresentationContentSuggestion = typeof presentationContentSuggestions.$inferSelect;
export type InsertPresentationContentSuggestion = z.infer<typeof insertPresentationContentSuggestionSchema>;

export type PresentationProject = typeof presentationProjects.$inferSelect;
export type InsertPresentationProject = z.infer<typeof insertPresentationProjectSchema>;

export type PresentationLibrary = typeof presentationLibrary.$inferSelect;
export type InsertPresentationLibrary = z.infer<typeof insertPresentationLibrarySchema>;

export type PresentationAnalytics = typeof presentationAnalytics.$inferSelect;
export type InsertPresentationAnalytics = z.infer<typeof insertPresentationAnalyticsSchema>;

export type PresentationAIContent = typeof presentationAIContent.$inferSelect;
export type InsertPresentationAIContent = z.infer<typeof insertPresentationAIContentSchema>;







// Production Planning Tables

// Production plans contain overall planning information
export const productionPlans = pgTable("production_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  planType: text("plan_type").notNull().default("weekly"), // daily, weekly, monthly, custom
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed, cancelled
  targetUnits: integer("target_units").notNull().default(0),
  actualUnits: integer("actual_units").notNull().default(0),
  efficiency: integer("efficiency").default(0), // percentage
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  createdBy: text("created_by").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production targets define specific goals for products/jobs
export const productionTargets = pgTable("production_targets", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => productionPlans.id).notNull(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  targetQuantity: integer("target_quantity").notNull(),
  actualQuantity: integer("actual_quantity").notNull().default(0),
  targetStartDate: timestamp("target_start_date").notNull(),
  targetEndDate: timestamp("target_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, delayed, cancelled
  priority: text("priority").notNull().default("medium"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resource allocations for production planning
export const resourceAllocations = pgTable("resource_allocations", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => productionPlans.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  allocationType: text("allocation_type").notNull(), // dedicated, shared, backup
  allocatedHours: integer("allocated_hours").notNull(),
  actualHours: integer("actual_hours").notNull().default(0),
  utilizationTarget: integer("utilization_target").notNull().default(80), // percentage
  actualUtilization: integer("actual_utilization").notNull().default(0), // percentage
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cost: integer("cost").default(0), // cost in cents
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production milestones and checkpoints
export const productionMilestones = pgTable("production_milestones", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => productionPlans.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date").notNull(),
  actualDate: timestamp("actual_date"),
  status: text("status").notNull().default("pending"), // pending, achieved, missed, cancelled
  milestoneType: text("milestone_type").notNull(), // start, checkpoint, delivery, completion
  targetValue: integer("target_value"), // units, percentage, etc.
  actualValue: integer("actual_value"),
  responsible: text("responsible"),
  dependencies: jsonb("dependencies").$type<number[]>().default([]), // milestone IDs this depends on
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production Planning Insert Schemas
export const insertProductionPlanSchema = createInsertSchema(productionPlans, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  startDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
  endDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertProductionTargetSchema = createInsertSchema(productionTargets, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  targetStartDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
  targetEndDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
  actualStartDate: z.union([z.string().datetime(), z.date(), z.null()]).transform((val) => {
    return val === null ? null : (typeof val === 'string' ? new Date(val) : val);
  }).optional(),
  actualEndDate: z.union([z.string().datetime(), z.date(), z.null()]).transform((val) => {
    return val === null ? null : (typeof val === 'string' ? new Date(val) : val);
  }).optional(),
});

export const insertResourceAllocationSchema = createInsertSchema(resourceAllocations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertProductionMilestoneSchema = createInsertSchema(productionMilestones, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Production Planning Types
export type ProductionPlan = typeof productionPlans.$inferSelect;
export type InsertProductionPlan = z.infer<typeof insertProductionPlanSchema>;

export type ProductionTarget = typeof productionTargets.$inferSelect;
export type InsertProductionTarget = z.infer<typeof insertProductionTargetSchema>;

export type ResourceAllocation = typeof resourceAllocations.$inferSelect;
export type InsertResourceAllocation = z.infer<typeof insertResourceAllocationSchema>;

export type ProductionMilestone = typeof productionMilestones.$inferSelect;
export type InsertProductionMilestone = z.infer<typeof insertProductionMilestoneSchema>;

// Industry Templates System for Manufacturing Sectors
export const industryTemplates = pgTable("industry_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // automotive, electronics, food_beverage, pharmaceutical, aerospace, textiles, chemicals, metals, manufacturing, custom
  version: text("version").notNull().default("1.0.0"),
  targetIndustry: text("target_industry").notNull(),
  companySize: text("company_size").notNull().default("medium"), // small, medium, large, enterprise
  configurations: jsonb("configurations").$type<{
    // Data volume configurations by company size
    dataVolumes?: {
      small?: {
        plants: { min: number; max: number };
        resourcesPerPlant: { min: number; max: number };
        capabilities: { min: number; max: number };
        ordersPerPlant: { min: number; max: number };
        operationsPerOrder: { min: number; max: number };
      };
      medium?: {
        plants: { min: number; max: number };
        resourcesPerPlant: { min: number; max: number };
        capabilities: { min: number; max: number };
        ordersPerPlant: { min: number; max: number };
        operationsPerOrder: { min: number; max: number };
      };
      large?: {
        plants: { min: number; max: number };
        resourcesPerPlant: { min: number; max: number };
        capabilities: { min: number; max: number };
        ordersPerPlant: { min: number; max: number };
        operationsPerOrder: { min: number; max: number };
      };
      enterprise?: {
        plants: { min: number; max: number };
        resourcesPerPlant: { min: number; max: number };
        capabilities: { min: number; max: number };
        ordersPerPlant: { min: number; max: number };
        operationsPerOrder: { min: number; max: number };
      };
    };
    
    // Dashboard configurations
    dashboards?: Array<{
      name: string;
      description: string;
      layout: string; // grid, flex, custom
      widgets: Array<{
        type: string;
        position: { x: number; y: number; width: number; height: number };
        config: any;
      }>;
    }>;
    
    // KPI and metrics configuration
    kpis?: Array<{
      name: string;
      description: string;
      category: string; // production, quality, efficiency, cost, safety
      calculation: string;
      target: number;
      unit: string;
      displayFormat: string;
    }>;
    
    // Report templates
    reports?: Array<{
      name: string;
      description: string;
      type: string; // production, quality, efficiency, custom
      frequency: string; // daily, weekly, monthly, quarterly
      template: string;
      parameters: any;
    }>;
    
    // Visual Factory displays
    visualFactory?: Array<{
      name: string;
      description: string;
      type: string; // metrics, alerts, schedule, custom
      layout: any;
      dataSource: string;
    }>;
    
    // Production workflows
    workflows?: Array<{
      name: string;
      description: string;
      steps: Array<{
        name: string;
        type: string;
        parameters: any;
      }>;
    }>;
    
    // Color schemes and branding
    theme?: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
    };
  }>().notNull(),
  features: jsonb("features").$type<string[]>().default([]), // List of included features
  prerequisites: jsonb("prerequisites").$type<string[]>().default([]), // Required capabilities or setup
  setupInstructions: text("setup_instructions").notNull(),
  benefits: jsonb("benefits").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(5), // 1-5 stars
  createdBy: integer("created_by"),
  tags: jsonb("tags").$type<string[]>().default([]),
  aiPrompt: text("ai_prompt"), // For AI-assisted customization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User applications of industry templates
export const userIndustryTemplates = pgTable("user_industry_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => industryTemplates.id).notNull(),
  customName: text("custom_name"),
  customConfiguration: jsonb("custom_configuration").$type<any>(), // User customizations
  status: text("status").notNull().default("applied"), // applied, customizing, active, inactive
  appliedAt: timestamp("applied_at").defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
}, (table) => ({
  userTemplateIdx: unique().on(table.userId, table.templateId),
}));

// Dashboard and Widget-Based Page Architecture
// System pages that can be either curated (non-customizable) or user-adjustable
export const systemPages = pgTable("system_pages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // production-schedule, capacity-planning, analytics, etc
  title: text("title").notNull(), // "Production Schedule", "Capacity Planning", etc
  description: text("description"),
  category: text("category").notNull(), // planning-scheduling, ai-optimization, operations, management, data-management, communication, training
  path: text("path").notNull().unique(), // /production-schedule, /capacity-planning, etc
  icon: text("icon").notNull(), // lucide icon name
  
  // Page behavior configuration
  pageType: text("page_type").notNull().default("dashboard"), // dashboard, curated, hybrid, workflow
  isCustomizable: boolean("is_customizable").default(true), // false for curated pages
  allowWidgetAdd: boolean("allow_widget_add").default(true),
  allowWidgetRemove: boolean("allow_widget_remove").default(true),
  allowWidgetReorder: boolean("allow_widget_reorder").default(true),
  allowLayoutChange: boolean("allow_layout_change").default(true),
  
  // Default layout configuration
  defaultLayout: jsonb("default_layout").$type<{
    type: 'grid' | 'flex' | 'masonry' | 'custom';
    columns: number;
    gap: number;
    padding: number;
    responsive: {
      mobile: { columns: number; gap: number };
      tablet: { columns: number; gap: number };
      desktop: { columns: number; gap: number };
    };
  }>().notNull(),
  
  // Default widgets for this page
  defaultWidgets: jsonb("default_widgets").$type<Array<{
    widgetId: number;
    position: { x: number; y: number; w: number; h: number };
    isRequired: boolean; // Cannot be removed by users
    isResizable: boolean;
    isMovable: boolean;
    customConfig?: Record<string, any>;
  }>>().default([]),
  
  // Access control
  requiredPermissions: jsonb("required_permissions").$type<Array<{
    feature: string;
    action: string;
  }>>().default([]),
  visibleToRoles: jsonb("visible_to_roles").$type<string[]>().default([]), // Empty means visible to all
  
  // Navigation and organization
  isInMainMenu: boolean("is_in_main_menu").default(true),
  menuOrder: integer("menu_order").default(100),
  isInSidebar: boolean("is_in_sidebar").default(true),
  sidebarOrder: integer("sidebar_order").default(100),
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  version: text("version").default("1.0.0"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-customized versions of system pages
export const userPageLayouts = pgTable("user_page_layouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pageId: integer("page_id").references(() => systemPages.id).notNull(),
  
  // Custom layout configuration
  customLayout: jsonb("custom_layout").$type<{
    type: 'grid' | 'flex' | 'masonry' | 'custom';
    columns: number;
    gap: number;
    padding: number;
    responsive: {
      mobile: { columns: number; gap: number };
      tablet: { columns: number; gap: number };
      desktop: { columns: number; gap: number };
    };
  }>(),
  
  // Custom widget configuration
  widgets: jsonb("widgets").$type<Array<{
    widgetId: number;
    position: { x: number; y: number; w: number; h: number };
    customConfig?: Record<string, any>;
    isVisible: boolean;
    customTitle?: string;
  }>>().default([]),
  
  // User preferences
  lastViewedAt: timestamp("last_viewed_at"),
  isBookmarked: boolean("is_bookmarked").default(false),
  customTitle: text("custom_title"), // User can rename the page for themselves
  notes: text("notes"), // Personal notes about the page
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userPageUnique: unique().on(table.userId, table.pageId),
}));

// Dashboard configurations for traditional dashboard-style pages
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("user"), // system, user, template, shared
  
  // Layout configuration
  layout: jsonb("layout").$type<{
    type: 'grid' | 'flex' | 'masonry';
    columns: number;
    rows?: number;
    gap: number;
    padding: number;
    backgroundColor?: string;
    responsive: {
      mobile: { columns: number; gap: number };
      tablet: { columns: number; gap: number };
      desktop: { columns: number; gap: number };
    };
  }>().notNull(),
  
  // Widgets configuration
  widgets: jsonb("widgets").$type<Array<{
    id: string; // unique within dashboard
    widgetId: number; // reference to unifiedWidgets
    position: { x: number; y: number; w: number; h: number };
    customConfig?: Record<string, any>;
    customTitle?: string;
    isVisible: boolean;
  }>>().default([]),
  
  // Dashboard metadata
  targetPlatform: text("target_platform").notNull().default("both"), // mobile, desktop, both
  category: text("category"), // operations, financial, quality, custom
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Access control
  isPublic: boolean("is_public").default(false),
  isTemplate: boolean("is_template").default(false),
  templateCategory: text("template_category"), // production, management, analysis
  
  // Ownership
  createdBy: integer("created_by").references(() => users.id).notNull(),
  sharedWith: jsonb("shared_with").$type<Array<{
    type: 'user' | 'role';
    id: string;
    permissions: ('view' | 'edit' | 'share')[];
  }>>().default([]),
  
  // Usage tracking
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mobile-optimized dashboard configurations
export const mobileDashboards = pgTable("mobile_dashboards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Mobile-specific layout
  configuration: jsonb("configuration").$type<{
    layout: 'list' | 'grid' | 'cards' | 'timeline';
    widgets: string[]; // widget identifiers optimized for mobile
    scrollDirection: 'vertical' | 'horizontal';
    itemsPerScreen: number;
    autoRotate: boolean;
    rotationInterval: number; // seconds
  }>().notNull(),
  
  targetPlatform: text("target_platform").notNull().default("mobile"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas and types for dashboard/page architecture
export const insertSystemPageSchema = createInsertSchema(systemPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPageLayoutSchema = createInsertSchema(userPageLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true,
  viewCount: true,
  lastViewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMobileDashboardSchema = createInsertSchema(mobileDashboards).omit({
  id: true,
  createdAt: true,
});

// Types for dashboard/page architecture
export type SystemPage = typeof systemPages.$inferSelect;
export type InsertSystemPage = z.infer<typeof insertSystemPageSchema>;

export type UserPageLayout = typeof userPageLayouts.$inferSelect;
export type InsertUserPageLayout = z.infer<typeof insertUserPageLayoutSchema>;

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;

export type MobileDashboard = typeof mobileDashboards.$inferSelect;
export type InsertMobileDashboard = z.infer<typeof insertMobileDashboardSchema>;

// Template configurations for specific use cases
export const templateConfigurations = pgTable("template_configurations", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => industryTemplates.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  configurationType: text("configuration_type").notNull(), // dashboard, report, workflow, kpi
  configuration: jsonb("configuration").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Industry Templates Insert Schemas
export const insertIndustryTemplateSchema = createInsertSchema(industryTemplates, { 
  id: undefined,
  usageCount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertUserIndustryTemplateSchema = createInsertSchema(userIndustryTemplates, { 
  id: undefined,
  appliedAt: undefined,
  lastModified: undefined,
});

export const insertTemplateConfigurationSchema = createInsertSchema(templateConfigurations, { 
  id: undefined,
  createdAt: undefined,
});

// Industry Templates Types
export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type InsertIndustryTemplate = z.infer<typeof insertIndustryTemplateSchema>;

export type UserIndustryTemplate = typeof userIndustryTemplates.$inferSelect;
export type InsertUserIndustryTemplate = z.infer<typeof insertUserIndustryTemplateSchema>;

export type TemplateConfiguration = typeof templateConfigurations.$inferSelect;
export type InsertTemplateConfiguration = z.infer<typeof insertTemplateConfigurationSchema>;

// Shift Management System Insert Schemas
export const insertShiftTemplateSchema = createInsertSchema(shiftTemplates, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertResourceShiftAssignmentSchema = createInsertSchema(resourceShiftAssignments, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftScenarioSchema = createInsertSchema(shiftScenarios, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertHolidaySchema = createInsertSchema(holidays, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  date: z.union([z.string().datetime(), z.date()]),
});

export const insertResourceAbsenceSchema = createInsertSchema(resourceAbsences, { 
  id: undefined,
  requestedAt: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  startDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]),
  approvedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftCoverageSchema = createInsertSchema(shiftCoverage, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  shiftDate: z.union([z.string().datetime(), z.date()]),
});

export const insertShiftUtilizationSchema = createInsertSchema(shiftUtilization, { 
  id: undefined,
  createdAt: undefined,
}, {
  date: z.union([z.string().datetime(), z.date()]),
});

// Shift Management System Types
export type ShiftTemplate = typeof shiftTemplates.$inferSelect;
export type InsertShiftTemplate = z.infer<typeof insertShiftTemplateSchema>;

export type ResourceShiftAssignment = typeof resourceShiftAssignments.$inferSelect;
export type InsertResourceShiftAssignment = z.infer<typeof insertResourceShiftAssignmentSchema>;

export type ShiftScenario = typeof shiftScenarios.$inferSelect;
export type InsertShiftScenario = z.infer<typeof insertShiftScenarioSchema>;

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;

export type ResourceAbsence = typeof resourceAbsences.$inferSelect;
export type InsertResourceAbsence = z.infer<typeof insertResourceAbsenceSchema>;

export type ShiftCoverage = typeof shiftCoverage.$inferSelect;
export type InsertShiftCoverage = z.infer<typeof insertShiftCoverageSchema>;

export type ShiftUtilization = typeof shiftUtilization.$inferSelect;
export type InsertShiftUtilization = z.infer<typeof insertShiftUtilizationSchema>;

// Unplanned Downtime Management Tables
export const unplannedDowntime = pgTable("unplanned_downtime", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  downtimeType: text("downtime_type").notNull(), // equipment_failure, emergency_maintenance, power_outage, quality_issue, accident, breakdown
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, resolved, investigating, pending_parts
  title: text("title").notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  estimatedEndTime: timestamp("estimated_end_time"),
  actualEndTime: timestamp("actual_end_time"),
  reportedBy: integer("reported_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  estimatedCost: integer("estimated_cost").default(0), // in cents
  actualCost: integer("actual_cost").default(0), // in cents
  impactedOperations: jsonb("impacted_operations").$type<number[]>().default([]),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  preventiveMeasures: text("preventive_measures"),
  partsRequired: jsonb("parts_required").$type<{name: string, quantity: number, cost?: number}[]>().default([]),
  laborHours: integer("labor_hours").default(0), // in minutes
  downtimeMinutes: integer("downtime_minutes").default(0),
  isRecurring: boolean("is_recurring").default(false),
  lastOccurrence: timestamp("last_occurrence"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Overtime Shift Management Tables
export const overtimeShifts = pgTable("overtime_shifts", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id),
  overtimeType: text("overtime_type").notNull(), // emergency_coverage, planned_overtime, maintenance_window, production_push, disruption_coverage
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, active, completed, cancelled
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  approvedBy: integer("approved_by").references(() => users.id),
  requestedBy: integer("requested_by").references(() => users.id).notNull(),
  hourlyRate: integer("hourly_rate").notNull(), // in cents
  premiumMultiplier: integer("premium_multiplier").notNull().default(150), // 150 = 1.5x normal rate
  estimatedCost: integer("estimated_cost").notNull(), // in cents
  actualCost: integer("actual_cost").default(0), // in cents
  assignedOperations: jsonb("assigned_operations").$type<number[]>().default([]),
  coveringFor: integer("covering_for").references(() => resources.id), // if covering for another resource
  downtimeId: integer("downtime_id").references(() => unplannedDowntime.id), // if related to downtime
  notes: text("notes"),
  isEmergency: boolean("is_emergency").default(false),
  autoApproved: boolean("auto_approved").default(false),
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Downtime Actions and Response Tracking
export const downtimeActions = pgTable("downtime_actions", {
  id: serial("id").primaryKey(),
  downtimeId: integer("downtime_id").references(() => unplannedDowntime.id).notNull(),
  actionType: text("action_type").notNull(), // immediate_response, investigation, repair, testing, follow_up, documentation
  actionTitle: text("action_title").notNull(),
  description: text("description").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled, blocked
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedDuration: integer("estimated_duration").default(0), // in minutes
  actualDuration: integer("actual_duration").default(0), // in minutes
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  skillsRequired: jsonb("skills_required").$type<string[]>().default([]),
  toolsRequired: jsonb("tools_required").$type<string[]>().default([]),
  cost: integer("cost").default(0), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift Change Requests for Emergency Coverage
export const shiftChangeRequests = pgTable("shift_change_requests", {
  id: serial("id").primaryKey(),
  originalResourceId: integer("original_resource_id").references(() => resources.id).notNull(),
  replacementResourceId: integer("replacement_resource_id").references(() => resources.id),
  shiftDate: timestamp("shift_date").notNull(),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id).notNull(),
  requestType: text("request_type").notNull(), // emergency_coverage, planned_absence, illness, overtime_needed, shift_swap
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, denied, fulfilled, cancelled
  urgency: text("urgency").notNull().default("normal"), // low, normal, high, critical
  requestedBy: integer("requested_by").references(() => users.id).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  downtimeId: integer("downtime_id").references(() => unplannedDowntime.id), // if related to downtime
  estimatedCoverage: integer("estimated_coverage").default(100), // percentage coverage needed
  skillsRequired: jsonb("skills_required").$type<string[]>().default([]),
  notes: text("notes"),
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unplanned Downtime Insert Schemas
export const insertUnplannedDowntimeSchema = createInsertSchema(unplannedDowntime, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  startTime: z.union([z.string().datetime(), z.date()]),
  estimatedEndTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
  lastOccurrence: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertOvertimeShiftSchema = createInsertSchema(overtimeShifts, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  startTime: z.union([z.string().datetime(), z.date()]),
  endTime: z.union([z.string().datetime(), z.date()]),
  actualStartTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDowntimeActionSchema = createInsertSchema(downtimeActions, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  startedAt: z.union([z.string().datetime(), z.date()]).optional(),
  completedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftChangeRequestSchema = createInsertSchema(shiftChangeRequests, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  shiftDate: z.union([z.string().datetime(), z.date()]),
});

// Unplanned Downtime and Overtime Types
export type UnplannedDowntime = typeof unplannedDowntime.$inferSelect;
export type InsertUnplannedDowntime = z.infer<typeof insertUnplannedDowntimeSchema>;

export type OvertimeShift = typeof overtimeShifts.$inferSelect;
export type InsertOvertimeShift = z.infer<typeof insertOvertimeShiftSchema>;

export type DowntimeAction = typeof downtimeActions.$inferSelect;
export type InsertDowntimeAction = z.infer<typeof insertDowntimeActionSchema>;

export type ShiftChangeRequest = typeof shiftChangeRequests.$inferSelect;
export type InsertShiftChangeRequest = z.infer<typeof insertShiftChangeRequestSchema>;

// Third-party API Integration System
export const apiIntegrations = pgTable("api_integrations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemType: varchar("system_type", { length: 100 }).notNull(), // 'erp', 'crm', 'wms', 'mes', 'scada', 'iot', 'custom'
  provider: varchar("provider", { length: 100 }).notNull(), // 'SAP', 'Salesforce', 'Oracle', 'Microsoft', 'Custom'
  status: varchar("status", { length: 20 }).notNull().default('inactive'), // 'active', 'inactive', 'testing', 'error', 'pending'
  healthStatus: varchar("health_status", { length: 20 }).notNull().default('unknown'), // 'healthy', 'degraded', 'unhealthy', 'unknown'
  isAiGenerated: boolean("is_ai_generated").default(false),
  endpoint: text("endpoint").notNull(),
  apiVersion: varchar("api_version", { length: 50 }),
  authType: varchar("auth_type", { length: 50 }).notNull(), // 'oauth2', 'api_key', 'basic', 'bearer', 'custom'
  authConfig: jsonb("auth_config").$type<Record<string, any>>().default({}), // Encrypted auth details
  headers: jsonb("headers").$type<Record<string, string>>().default({}),
  requestConfig: jsonb("request_config").$type<{
    timeout: number;
    retries: number;
    retryDelay: number;
    rateLimit?: { requests: number; period: number };
  }>().default({ timeout: 30000, retries: 3, retryDelay: 1000 }),
  syncFrequency: varchar("sync_frequency", { length: 50 }).default('manual'), // 'manual', 'realtime', '15min', '30min', '1hour', '6hour', '12hour', '24hour'
  lastSync: timestamp("last_sync"),
  nextSync: timestamp("next_sync"),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  totalRequests: integer("total_requests").default(0),
  avgResponseTime: integer("avg_response_time").default(0), // milliseconds
  dataTypes: jsonb("data_types").$type<string[]>().default([]), // ['orders', 'inventory', 'customers', 'production_plans']
  capabilities: jsonb("capabilities").$type<string[]>().default([]), // ['read', 'write', 'realtime', 'batch', 'webhook']
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const apiMappings = pgTable("api_mappings", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => apiIntegrations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  direction: varchar("direction", { length: 15 }).notNull(), // 'inbound', 'outbound', 'bidirectional'
  sourceSystem: varchar("source_system", { length: 100 }).notNull(), // 'external' or 'planettogether'
  sourceTable: varchar("source_table", { length: 100 }).notNull(),
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  fieldMappings: jsonb("field_mappings").$type<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    isRequired: boolean;
    defaultValue?: any;
  }[]>().notNull(),
  transformationRules: jsonb("transformation_rules").$type<{
    script?: string;
    conditions?: Array<{ field: string; operator: string; value: any; action: string }>;
    validations?: Array<{ field: string; rule: string; message: string }>;
  }>().default({}),
  filters: jsonb("filters").$type<{
    conditions?: Array<{ field: string; operator: string; value: any }>;
    dateRange?: { field: string; from?: string; to?: string };
  }>().default({}),
  isActive: boolean("is_active").default(true),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiTests = pgTable("api_tests", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => apiIntegrations.id).notNull(),
  testType: varchar("test_type", { length: 50 }).notNull(), // 'connection', 'authentication', 'data_flow', 'performance', 'mapping'
  testName: varchar("test_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'passed', 'failed', 'running', 'pending'
  request: jsonb("request").$type<{
    method: string;
    endpoint: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, any>;
  }>(),
  response: jsonb("response").$type<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    responseTime: number;
  }>(),
  expectedResult: jsonb("expected_result").$type<any>(),
  actualResult: jsonb("actual_result").$type<any>(),
  errorMessage: text("error_message"),
  duration: integer("duration"), // milliseconds
  automatedTest: boolean("automated_test").default(false),
  schedule: varchar("schedule", { length: 50 }), // 'manual', 'continuous', 'daily', 'weekly'
  createdAt: timestamp("created_at").defaultNow(),
  runAt: timestamp("run_at").defaultNow(),
});

export const apiAuditLogs = pgTable("api_audit_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => apiIntegrations.id).notNull(),
  operation: varchar("operation", { length: 100 }).notNull(), // 'sync', 'test', 'configure', 'authenticate'
  method: varchar("method", { length: 10 }).notNull(), // 'GET', 'POST', 'PUT', 'DELETE'
  endpoint: text("endpoint").notNull(),
  requestData: jsonb("request_data").$type<any>(),
  responseData: jsonb("response_data").$type<any>(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // milliseconds
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  recordsProcessed: integer("records_processed").default(0),
  dataSize: integer("data_size").default(0), // bytes
  userId: integer("user_id").references(() => users.id),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => apiIntegrations.id).notNull(),
  credentialType: varchar("credential_type", { length: 50 }).notNull(), // 'oauth2', 'api_key', 'certificate', 'basic_auth'
  name: varchar("name", { length: 255 }).notNull(),
  encryptedValue: text("encrypted_value").notNull(), // Encrypted credential data
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  refreshToken: text("refresh_token"), // For OAuth2
  scope: text("scope"), // OAuth2 scopes
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Integration Insert Schemas
export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertApiMappingSchema = createInsertSchema(apiMappings, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertApiTestSchema = createInsertSchema(apiTests, { 
  id: undefined,
  createdAt: undefined,
  runAt: undefined,
});

export const insertApiAuditLogSchema = createInsertSchema(apiAuditLogs, { 
  id: undefined,
  createdAt: undefined,
});

export const insertApiCredentialSchema = createInsertSchema(apiCredentials, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// API Integration Types
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;

export type ApiMapping = typeof apiMappings.$inferSelect;
export type InsertApiMapping = z.infer<typeof insertApiMappingSchema>;

export type ApiTest = typeof apiTests.$inferSelect;
export type InsertApiTest = z.infer<typeof insertApiTestSchema>;

export type ApiAuditLog = typeof apiAuditLogs.$inferSelect;
export type InsertApiAuditLog = z.infer<typeof insertApiAuditLogSchema>;

export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = z.infer<typeof insertApiCredentialSchema>;

// Scheduling History Relations
export const schedulingHistoryRelations = relations(schedulingHistory, ({ one, many }) => ({
  triggeredByUser: one(users, {
    fields: [schedulingHistory.triggeredBy],
    references: [users.id],
  }),
  plant: one(ptPlants, {
    fields: [schedulingHistory.plantId],
    references: [ptPlants.id],
  }),
  comparisonBaselineHistory: one(schedulingHistory, {
    fields: [schedulingHistory.comparisonBaseline],
    references: [schedulingHistory.id],
  }),
  schedulingResults: many(schedulingResults),
}));

export const schedulingResultsRelations = relations(schedulingResults, ({ one }) => ({
  history: one(schedulingHistory, {
    fields: [schedulingResults.historyId],
    references: [schedulingHistory.id],
  }),
  // References PT Job Operations
  ptJobOperation: one(ptJobOperations, {
    fields: [schedulingResults.ptJobOperationId],
    references: [ptJobOperations.id],
  }),
  productionOrder: one(productionOrders, {
    fields: [schedulingResults.productionOrderId],
    references: [productionOrders.id],
  }),
  resource: one(resources, {
    fields: [schedulingResults.resourceId],
    references: [resources.id],
  }),
}));

export const algorithmPerformanceRelations = relations(algorithmPerformance, ({ one }) => ({
  plant: one(ptPlants, {
    fields: [algorithmPerformance.plantId],
    references: [ptPlants.id],
  }),
  bestPerformanceHistory: one(schedulingHistory, {
    fields: [algorithmPerformance.bestPerformanceHistoryId],
    references: [schedulingHistory.id],
  }),
  worstPerformanceHistory: one(schedulingHistory, {
    fields: [algorithmPerformance.worstPerformanceHistoryId],
    references: [schedulingHistory.id],
  }),
}));

// Recipe Relations - SAP S/4HANA Process Industries Structure
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [recipes.plantId],
    references: [ptPlants.id],
  }),
  operations: many(recipeOperations),
  // productOutputs: many(recipeProductOutputs),
  ptJobOperations: many(ptJobOperations), // One-to-many relationship with PT Job Operations
  // operationRelationships: many(recipeOperationRelationships, {
  //   relationName: "recipeToRelationships"
  // }),
  // materialAssignments: many(recipeMaterialAssignments),
  // formulas: many(recipeFormulas),
}));

export const recipeOperationsRelations = relations(recipeOperations, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [recipeOperations.recipeId],
    references: [recipes.id],
  }),
  workCenter: one(workCenters, {
    fields: [recipeOperations.workCenterId],
    references: [workCenters.id],
  }),
  // phases: many(recipePhases),
  // materialAssignments: many(recipeMaterialAssignments),
  // predecessorRelationships: many(recipeOperationRelationships, {
  //   relationName: "predecessorOperation"
  // }),
  // successorRelationships: many(recipeOperationRelationships, {
  //   relationName: "successorOperation"
  // }),
}));

// export const recipePhasesRelations = relations(recipePhases, ({ one, many }) => ({
//   operation: one(recipeOperations, {
//     fields: [recipePhases.operationId],
//     references: [recipeOperations.id],
//   }),
//   ptJobOperation: one(ptJobOperations, { // Many-to-one relationship: many recipe phases belong to PT Job Operations
//     fields: [recipePhases.ptJobOperationId],
//     references: [ptJobOperations.id],
//   }),
//   specificResource: one(resources, {
//     fields: [recipePhases.specificResourceId],
//     references: [resources.id],
//   }),
//   materialAssignments: many(recipeMaterialAssignments),
//   formulas: many(recipeFormulas),
//   resourceRequirements: many(resourceRequirements), // One-to-many with resource requirements
//   formulationDetailAssignments: many(productionVersionPhaseFormulationDetails), // Junction table for phase-specific formulation details
//   // Junction table links for recipe product outputs within production versions
//   recipeProductOutputLinks: many(productionVersionPhaseRecipeProductOutputs),
//   predecessorRelationships: many(recipePhaseRelationships, {
//     relationName: "predecessor"
//   }),
//   successorRelationships: many(recipePhaseRelationships, {
//     relationName: "successor"
//   }),
// }));

// export const recipePhaseRelationshipsRelations = relations(recipePhaseRelationships, ({ one }) => ({
//   recipe: one(recipes, {
//     fields: [recipePhaseRelationships.recipeId],
//     references: [recipes.id],
//   }),
//   predecessorPhase: one(recipePhases, {
//     fields: [recipePhaseRelationships.predecessorPhaseId],
//     references: [recipePhases.id],
//     relationName: "predecessor"
//   }),
//   successorPhase: one(recipePhases, {
//     fields: [recipePhaseRelationships.successorPhaseId],
//     references: [recipePhases.id],
//     relationName: "successor"
//   }),
// }));

// export const recipeOperationRelationshipsRelations = relations(recipeOperationRelationships, ({ one }) => ({
//   recipe: one(recipes, {
//     fields: [recipeOperationRelationships.recipeId],
//     references: [recipes.id],
//     relationName: "recipeToRelationships"
//   }),
//   predecessorOperation: one(recipeOperations, {
//     fields: [recipeOperationRelationships.predecessorOperationId],
//     references: [recipeOperations.id],
//     relationName: "predecessorOperation"
//   }),
//   successorOperation: one(recipeOperations, {
//     fields: [recipeOperationRelationships.successorOperationId],
//     references: [recipeOperations.id],
//     relationName: "successorOperation"
//   }),
//   // predecessorPhase: one(recipePhases, {
//   //   fields: [recipeOperationRelationships.predecessorPhaseId],
//   //   references: [recipePhases.id],
//   // }),
//   // successorPhase: one(recipePhases, {
//   //   fields: [recipeOperationRelationships.successorPhaseId],
//   //   references: [recipePhases.id],
//   // }),
// }));

// export const recipeMaterialAssignmentsRelations = relations(recipeMaterialAssignments, ({ one }) => ({
//   recipe: one(recipes, {
//     fields: [recipeMaterialAssignments.recipeId],
//     references: [recipes.id],
//   }),
//   operation: one(recipeOperations, {
//     fields: [recipeMaterialAssignments.operationId],
//     references: [recipeOperations.id],
//   }),
//   // phase: one(recipePhases, {
//   //   fields: [recipeMaterialAssignments.phaseId],
//   //   references: [recipePhases.id],
//   // }),
// }));

// export const recipeFormulasRelations = relations(recipeFormulas, ({ one }) => ({
//   recipe: one(recipes, {
//     fields: [recipeFormulas.recipeId],
//     references: [recipes.id],
//   }),
//   // phase: one(recipePhases, {
//   //   fields: [recipeFormulas.phaseId],
//   //   references: [recipePhases.id],
//   // }),
// }));





// Resource Requirements relations - COMMENTED OUT: Tables not defined
// export const resourceRequirementsRelations = relations(resourceRequirements, ({ one, many }) => ({
//   // Recipe phase relationship (many-to-one)
//   recipePhase: one(recipePhases, {
//     fields: [resourceRequirements.recipePhaseId],
//     references: [recipePhases.id],
//   }),
//   // Removed: discreteOperationPhase relationship (table deleted)
//   // Default resource relationship
//   defaultResource: one(resources, {
//     fields: [resourceRequirements.defaultResourceId],
//     references: [resources.id],
//   }),
//   // Assignment relationships
//   assignments: many(resourceRequirementAssignments),
// }));

// Resource Requirement Assignments relations - COMMENTED OUT: Tables not defined
// export const resourceRequirementAssignmentsRelations = relations(resourceRequirementAssignments, ({ one }) => ({
//   requirement: one(resourceRequirements, {
//     fields: [resourceRequirementAssignments.requirementId],
//     references: [resourceRequirements.id],
//   }),
//   assignedResource: one(resources, {
//     fields: [resourceRequirementAssignments.assignedResourceId],
//     references: [resources.id],
//   }),
// }));

// ===== COMPREHENSIVE ERP MANUFACTURING DATA STRUCTURES =====

// NOTE: departments table is already defined earlier in the schema

// Using PT Departments table instead of workCenters
export const workCenters = PT.ptDepartments;

// Many-to-many junction table: Work Centers ↔ Resources
export const workCenterResources = pgTable("work_center_resources", {
  id: serial("id").primaryKey(),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  isPrimary: boolean("is_primary").default(true), // Indicates if this is the primary work center for this resource
  allocationPercentage: integer("allocation_percentage").default(100), // percentage of resource allocated to this work center
  effectiveDate: timestamp("effective_date").defaultNow(),
  endDate: timestamp("end_date"), // null = no end date
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workCenterResourceUnique: unique().on(table.workCenterId, table.resourceId),
}));

// Many-to-many junction table: Departments ↔ Resources (for shared resources)
export const departmentResources = pgTable("department_resources", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  allocationPercentage: integer("allocation_percentage").default(100), // percentage of resource allocated to this department
  costAllocationMethod: text("cost_allocation_method").default("percentage"), // percentage, hours, activity_based
  effectiveDate: timestamp("effective_date").defaultNow(),
  endDate: timestamp("end_date"), // null = no end date
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  departmentResourceUnique: unique().on(table.departmentId, table.resourceId),
}));

// Employees - personnel who can be assigned to work centers or used as resources
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeNumber: text("employee_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phoneNumber: text("phone_number"),
  departmentId: integer("department_id").references(() => departments.id),
  workCenterId: integer("work_center_id").references(() => workCenters.id),
  jobTitle: text("job_title").notNull(),
  skillLevel: text("skill_level").notNull().default("intermediate"), // entry, intermediate, senior, expert
  hourlyRate: integer("hourly_rate").default(0), // in cents
  isResource: boolean("is_resource").default(false), // Can be assigned as a resource
  capabilities: jsonb("capabilities").$type<number[]>().default([]), // Skill capabilities
  shiftPattern: text("shift_pattern").default("day"), // day, night, rotating
  hireDate: timestamp("hire_date"),
  terminationDate: timestamp("termination_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sites - DELETED: replaced by ptwarehouses

// Using PT Items table instead of non-PT items table
export const items = PT.ptItems;

// Storage Locations - DELETED: replaced by ptwarehouses

// Using PT Inventories table instead of non-PT inventory table
export const inventory = PT.ptInventories;

// Inventory lots for lot-controlled items
export const inventoryLots = pgTable("inventory_lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  // storageLocationId: removed - storageLocations table was replaced by ptwarehouses
  quantity: integer("quantity").notNull().default(0),
  expirationDate: timestamp("expiration_date"),
  receivedDate: timestamp("received_date").notNull(),
  vendorLotNumber: text("vendor_lot_number"),
  status: text("status").notNull().default("available"), // available, hold, expired, consumed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  lotItemStorageLocationIdx: unique().on(table.lotNumber, table.itemId, table.storageLocationId),
}));

// Sales orders from customers - enhanced with comprehensive pricing, discount, payment terms, freight handling, and tax management
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderDate: timestamp("order_date").notNull(),
  requestedDate: timestamp("requested_date").notNull(),
  promisedDate: timestamp("promised_date"),
  shippedDate: timestamp("shipped_date"),
  status: text("status").notNull().default("open"), // open, confirmed, in_production, shipped, invoiced, closed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  currency: text("currency").notNull().default("USD"),
  // siteId: removed - sites table was replaced by ptwarehouses
  salesPerson: text("sales_person"),
  notes: text("notes"),
  
  // Comprehensive pricing and financial terms
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0"), // Order subtotal before discounts and taxes
  discountAmount: numeric("discount_amount", { precision: 15, scale: 2 }).default("0"), // Total discount amount
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"), // Overall discount percentage
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0"), // Total tax amount
  freightAmount: numeric("freight_amount", { precision: 15, scale: 2 }).default("0"), // Shipping/freight charges
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default("0"), // Final order total (subtotal - discount + tax + freight)
  
  // Payment and financial terms
  paymentTerms: text("payment_terms").default("NET30"), // NET30, NET15, COD, Prepaid, 2/10NET30, etc.
  paymentMethod: text("payment_method"), // credit_card, ach, wire_transfer, check, cash, trade_credit
  creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }), // Customer credit limit for this order
  creditCheckRequired: boolean("credit_check_required").default(false),
  creditApproved: boolean("credit_approved").default(false),
  creditApprovedBy: integer("credit_approved_by").references(() => users.id),
  creditApprovedDate: timestamp("credit_approved_date"),
  
  // Shipping and logistics terms
  shippingTerms: text("shipping_terms").default("FOB Origin"), // FOB Origin, FOB Destination, EXW, FCA, CPT, CIP, DAP, DDP
  carrierCode: text("carrier_code"), // UPS, FedEx, DHL, USPS, Freight, Customer_Pickup, etc.
  shippingMethod: text("shipping_method"), // ground, air, express, freight, overnight, 2day, standard
  freightTerms: text("freight_terms").default("Prepaid"), // Prepaid, Collect, Third_Party, Prepaid_Add
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  
  // Sales channel and territory management
  salesChannel: text("sales_channel").default("direct"), // direct, distributor, online, retail, partner, reseller
  salesTerritory: text("sales_territory"), // North, South, East, West, International, specific regions
  salesRegion: text("sales_region"), // Americas, EMEA, APAC, etc.
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("0"), // Sales commission percentage
  commissionAmount: numeric("commission_amount", { precision: 15, scale: 2 }).default("0"), // Calculated commission amount
  
  // Advanced discount and promotion management
  discountCodes: text("discount_codes").array(), // Applied discount/promo codes
  volumeDiscountTier: text("volume_discount_tier"), // bronze, silver, gold, platinum based on order value
  loyaltyDiscount: numeric("loyalty_discount", { precision: 5, scale: 2 }).default("0"), // Customer loyalty discount percentage
  seasonalDiscount: numeric("seasonal_discount", { precision: 5, scale: 2 }).default("0"), // Seasonal promotion discount
  earlyPaymentDiscount: numeric("early_payment_discount", { precision: 5, scale: 2 }).default("0"), // Early payment discount (e.g., 2/10NET30)
  
  // Tax management and compliance  
  taxExempt: boolean("tax_exempt").default(false), // Customer tax exempt status
  taxExemptCertificate: text("tax_exempt_certificate"), // Tax exemption certificate number
  taxJurisdiction: text("tax_jurisdiction"), // State, province, country for tax calculation
  salesTaxRate: numeric("sales_tax_rate", { precision: 5, scale: 4 }).default("0"), // Applied sales tax rate
  useTaxRate: numeric("use_tax_rate", { precision: 5, scale: 4 }).default("0"), // Use tax rate if applicable
  vatRate: numeric("vat_rate", { precision: 5, scale: 4 }).default("0"), // VAT rate for international orders
  taxCalculationMethod: text("tax_calculation_method").default("standard"), // standard, vertex, avalara, manual
  
  // Contract and pricing agreements
  contractNumber: text("contract_number"), // Reference to blanket purchase agreement or contract
  priceListId: integer("price_list_id"), // Reference to customer-specific price list
  quotationNumber: text("quotation_number"), // Reference to sales quotation
  quotationValidUntil: timestamp("quotation_valid_until"), // Quote expiration date
  priceHoldUntil: timestamp("price_hold_until"), // Price protection date
  
  // International trade and compliance
  incoterms: text("incoterms"), // EXW, FCA, CPT, CIP, DAT, DAP, DDP, FAS, FOB, CFR, CIF for international orders
  exportLicense: text("export_license"), // Export license number if required
  importLicense: text("import_license"), // Import license number if required  
  countryOfOrigin: text("country_of_origin"), // Country where goods originate
  harmonizedCode: text("harmonized_code"), // HS code for customs classification
  customsValue: numeric("customs_value", { precision: 15, scale: 2 }), // Declared customs value
  
  // Approval and authorization workflow
  requiresApproval: boolean("requires_approval").default(false), // Order requires manager approval
  approvalRequired: text("approval_required"), // credit, pricing, terms, discount, manager
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: timestamp("approved_date"),
  approvalNotes: text("approval_notes"),
  
  // Shipping address with enhanced structure
  shippingAddress: jsonb("shipping_address").$type<{
    name?: string;
    company?: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
    specialInstructions?: string;
  }>(),
  
  // Billing address (separate from shipping)
  billingAddress: jsonb("billing_address").$type<{
    name?: string;
    company?: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequently queried fields
  salesOrderStatusIdx: index("sales_orders_status_idx").on(table.status),
  salesOrderCustomerIdx: index("sales_orders_customer_idx").on(table.customerId),
  salesOrderDateIdx: index("sales_orders_order_date_idx").on(table.orderDate),
  salesOrderPersonIdx: index("sales_orders_sales_person_idx").on(table.salesPerson),
  salesOrderChannelIdx: index("sales_orders_sales_channel_idx").on(table.salesChannel),
  salesOrderTerritoryIdx: index("sales_orders_sales_territory_idx").on(table.salesTerritory),
  salesOrderTotalIdx: index("sales_orders_total_amount_idx").on(table.totalAmount),
  salesOrderApprovalIdx: index("sales_orders_requires_approval_idx").on(table.requiresApproval),
  salesOrderCarrierIdx: index("sales_orders_carrier_code_idx").on(table.carrierCode),
  salesOrderContractIdx: index("sales_orders_contract_number_idx").on(table.contractNumber),
}));

// Sales order line items - DELETED: replaced by ptsalesorderlines

// Sales order line distributions - DELETED: replaced by ptsalesorderlinedistributions

// Stocks table - indicates how much of an item is in stock (linked to storage_locations and other tables)
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  // storageLocationId: removed - storageLocations table was replaced by ptwarehouses
  quantityOnHand: integer("quantity_on_hand").notNull().default(0),
  quantityReserved: integer("quantity_reserved").default(0), // Reserved for sales orders
  quantityAvailable: integer("quantity_available").notNull().default(0), // On hand - reserved
  allocatedQuantity: integer("allocated_quantity").default(0), // Planned allocations
  inTransitQuantity: integer("in_transit_quantity").default(0), // Goods in transit
  costMethod: text("cost_method").notNull().default("FIFO"), // FIFO, LIFO, average
  lastCountVariance: integer("last_count_variance").default(0), // Cycle counting variance
  unitCost: integer("unit_cost").default(0), // in cents - current average unit cost
  totalValue: integer("total_value").default(0), // in cents - quantity * unit cost
  minimumLevel: integer("minimum_level").default(0), // Reorder point
  maximumLevel: integer("maximum_level").default(0), // Maximum stock level
  lastCountDate: timestamp("last_count_date"), // Last physical inventory count
  lastReceiptDate: timestamp("last_receipt_date"), // Last receipt/adjustment
  lastIssueDate: timestamp("last_issue_date"), // Last issue/shipment
  lotControl: boolean("lot_control").default(false), // Whether this item uses lot tracking
  serialControl: boolean("serial_control").default(false), // Whether this item uses serial tracking
  status: text("status").notNull().default("active"), // active, inactive, blocked, quarantine
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  stocksItemLocationIdx: unique().on(table.itemId, table.storageLocationId), // One stock record per item per location
  quantityOnHandIdx: index("stocks_quantity_on_hand_idx").on(table.quantityOnHand),
  quantityAvailableIdx: index("stocks_quantity_available_idx").on(table.quantityAvailable),
  statusIdx: index("stocks_status_idx").on(table.status),
}));

// Purchase orders to suppliers
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierName: text("supplier_name").notNull(),
  supplierCode: text("supplier_code"),
  supplierContact: jsonb("supplier_contact").$type<{
    name?: string;
    email?: string;
    phone?: string;
  }>(),
  orderDate: timestamp("order_date").notNull(),
  requestedDate: timestamp("requested_date").notNull(),
  promisedDate: timestamp("promised_date"),
  receivedDate: timestamp("received_date"),
  status: text("status").notNull().default("open"), // open, confirmed, partial_received, received, invoiced, closed, cancelled
  totalAmount: integer("total_amount").default(0), // in cents
  currency: text("currency").notNull().default("USD"),
  // siteId: removed - sites table was replaced by ptwarehouses
  buyerName: text("buyer_name"),
  notes: text("notes"),
  terms: text("terms"), // payment terms
  freightTerms: text("freight_terms"), // FOB, CIF, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase order line items - DELETED: replaced by ptpurchasestostock

// Transfer orders - DELETED: replaced by pttransferorders

// Transfer order line items - DELETED: replaced by pttransferorders

// Bills of Material - main BOM table
export const billsOfMaterial = pgTable("bills_of_material", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").references(() => items.id).notNull(),
  version: text("version").notNull().default("1"),
  effectiveDate: timestamp("effective_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  isActive: boolean("is_active").default(true),
});

// BOM line items - components needed
export const bomLines = pgTable("bom_lines", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => materialRequirements.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  componentItemId: integer("component_item_id").references(() => items.id).notNull(),
  quantity: integer("quantity").notNull(), // quantity needed per parent
  unitOfMeasure: text("unit_of_measure").notNull(),
  scrapFactor: integer("scrap_factor").default(0), // percentage
  leadTimeOffset: integer("lead_time_offset").default(0), // days
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  bomLineIdx: unique().on(table.bomId, table.lineNumber),
}));

// BOM Material Requirements - detailed material requirements for each BOM
export const bomMaterialRequirements = pgTable("bom_material_requirements", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => materialRequirements.id).notNull(),
  materialId: integer("material_id").references(() => items.id).notNull(), // Reference to material/item
  requiredQuantity: numeric("required_quantity", { precision: 10, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  materialType: text("material_type").notNull().default("raw_material"), // raw_material, semi_finished, purchased_part
  consumptionType: text("consumption_type").notNull().default("variable"), // variable, fixed, backflush
  scrapPercentage: numeric("scrap_percentage", { precision: 5, scale: 2 }).default("0"),
  leadTimeOffset: integer("lead_time_offset").default(0), // days before production start
  isOptional: boolean("is_optional").default(false),
  substituteItems: jsonb("substitute_items").$type<number[]>().default([]), // Array of substitute item IDs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// BOM Product Outputs - what products are produced by each BOM
export const bomProductOutputs = pgTable("bom_product_outputs", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => materialRequirements.id).notNull(),
  productId: integer("product_id").references(() => items.id).notNull(), // Reference to output product/item
  stockId: integer("stock_id").references(() => stocks.id), // Link to specific stock record for output tracking
  outputQuantity: numeric("output_quantity", { precision: 10, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  productType: text("product_type").notNull().default("primary"), // primary, co_product, by_product
  yieldPercentage: numeric("yield_percentage", { precision: 5, scale: 2 }).default("100"), // Expected yield %
  qualityGrade: text("quality_grade"), // Grade or quality classification
  isPrimary: boolean("is_primary").default(false), // True for the main output product
  sortOrder: integer("sort_order").default(1), // Display order
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Material Requirements - detailed requirements for formulations in process manufacturing OR bills of material in discrete manufacturing
export const materialRequirements = pgTable("material_requirements", {
  id: serial("id").primaryKey(),
  formulationId: integer("formulation_id").references(() => formulations.id),
  bomId: integer("bom_id").references(() => materialRequirements.id), // New relationship to bills of material
  itemId: integer("item_id").references(() => items.id), // Link to item master for inventory management
  stockId: integer("stock_id").references(() => stocks.id), // Link to specific stock record for material tracking
  requirementName: text("requirement_name").notNull(),
  requiredQuantity: numeric("required_quantity", { precision: 10, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  materialType: text("material_type").notNull().default("formulation"),
  consumptionType: text("consumption_type").notNull().default("variable"), // variable, fixed, backflush
  processStage: text("process_stage"), // mixing, heating, cooling, finishing
  timingRequirements: text("timing_requirements"), // when this material is needed
  qualitySpecifications: jsonb("quality_specifications").$type<{
    purity_min?: number;
    purity_max?: number;
    moisture_max?: number;
    particle_size?: string;
    color_requirements?: string;
    other_specs?: Array<{ parameter: string; value: string; tolerance: string }>;
  }>().default({}),
  storageConditions: text("storage_conditions"),
  handlingInstructions: text("handling_instructions"),
  safetyRequirements: text("safety_requirements"),
  isCritical: boolean("is_critical").default(false),
  substituteFormulations: jsonb("substitute_formulations").$type<number[]>().default([]), // Array of substitute formulation IDs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Formulation Details - detailed specifications and properties for each formulation
export const formulationDetails = pgTable("formulation_details", {
  id: serial("id").primaryKey(),
  formulationId: integer("formulation_id").references(() => formulations.id, { onDelete: 'cascade' }).notNull(),
  itemId: integer("item_id").references(() => items.id), // Link to item master for standardized specifications
  detailType: text("detail_type").notNull(), // composition, specification, property, instruction, safety, storage
  detailName: text("detail_name").notNull(),
  detailValue: text("detail_value"),
  numericValue: numeric("numeric_value", { precision: 15, scale: 6 }),
  unitOfMeasure: text("unit_of_measure"),
  rangeMin: numeric("range_min", { precision: 15, scale: 6 }),
  rangeMax: numeric("range_max", { precision: 15, scale: 6 }),
  targetValue: numeric("target_value", { precision: 15, scale: 6 }),
  tolerance: numeric("tolerance", { precision: 15, scale: 6 }),
  testMethod: text("test_method"),
  specification: text("specification"),
  category: text("category"), // chemical, physical, microbiological, sensory
  isRequired: boolean("is_required").notNull().default(true),
  isCritical: boolean("is_critical").notNull().default(false),
  processStage: text("process_stage"), // where this detail applies
  conditions: text("conditions"), // environmental conditions for measurement
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table linking formulation details to specific recipe phases within production versions
// DELETED: productionVersionPhaseFormulationDetails - Replaced by PT formulation structures

// Formulations - master list of formulations for process manufacturing (similar to BOM but for process manufacturing)
export const formulations = pgTable("formulations", {
  id: serial("id").primaryKey(),
  formulationNumber: text("formulation_number").notNull().unique(), // e.g., "FORM-001"
  formulationName: text("formulation_name").notNull(),
  chemicalName: text("chemical_name"), // Official chemical name
  casNumber: text("cas_number"), // Chemical Abstracts Service number
  molecularFormula: text("molecular_formula"), // e.g., "C8H9NO2"
  molecularWeight: numeric("molecular_weight", { precision: 10, scale: 4 }), // g/mol
  formulationType: text("formulation_type").notNull().default("raw_material"), // raw_material, catalyst, solvent, intermediate, additive, preservative
  
  // Physical properties
  physicalForm: text("physical_form").notNull().default("solid"), // solid, liquid, gas, powder, granular, paste
  density: numeric("density", { precision: 10, scale: 4 }), // g/cm³ or kg/L
  meltingPoint: numeric("melting_point", { precision: 10, scale: 2 }), // °C
  boilingPoint: numeric("boiling_point", { precision: 10, scale: 2 }), // °C
  solubility: text("solubility"), // Water soluble, organic soluble, etc.
  color: text("color"),
  odor: text("odor"),
  
  // Safety and handling
  hazardClass: text("hazard_class"), // Flammable, Corrosive, Toxic, etc.
  unNumber: text("un_number"), // UN shipping classification
  packingGroup: text("packing_group"), // I, II, III
  flashPoint: numeric("flash_point", { precision: 10, scale: 2 }), // °C
  autoIgnitionTemp: numeric("auto_ignition_temp", { precision: 10, scale: 2 }), // °C
  
  // Storage requirements
  storageTemperature: jsonb("storage_temperature").$type<{
    min: number;
    max: number;
    unit: string; // C, F
    controlled: boolean;
  }>(),
  storageConditions: text("storage_conditions"), // Cool, dry place; Under nitrogen; Refrigerated
  shelfLife: integer("shelf_life"), // days
  lightSensitive: boolean("light_sensitive").default(false),
  moistureSensitive: boolean("moisture_sensitive").default(false),
  airSensitive: boolean("air_sensitive").default(false),
  
  // Quality specifications
  purity: numeric("purity", { precision: 5, scale: 2 }), // percentage
  moistureContent: numeric("moisture_content", { precision: 5, scale: 2 }), // percentage
  ashContent: numeric("ash_content", { precision: 5, scale: 2 }), // percentage
  specifications: jsonb("specifications").$type<Array<{
    parameter: string;
    specification: string;
    test_method: string;
    min_value?: number;
    max_value?: number;
    unit?: string;
  }>>().default([]),
  
  // Regulatory and compliance
  foodGrade: boolean("food_grade").default(false),
  pharmacopeialGrade: text("pharmacopeial_grade"), // USP, EP, JP, etc.
  kosherCertified: boolean("kosher_certified").default(false),
  halalCertified: boolean("halal_certified").default(false),
  organicCertified: boolean("organic_certified").default(false),
  gmoFree: boolean("gmo_free").default(false),
  
  // Production version linkage for process manufacturing - COMMENTED OUT: productionVersions table not defined
  // productionVersionId: integer("production_version_id").references(() => productionVersions.id),
  
  // Sourcing and supply
  preferredVendorId: integer("preferred_vendor_id").references(() => PTvendors.id),
  backupVendors: jsonb("backup_vendors").$type<number[]>().default([]), // Array of vendor IDs
  standardPackSize: numeric("standard_pack_size", { precision: 10, scale: 4 }), // kg, L, units
  packSizeUnit: text("pack_size_unit"), // kg, L, units, drums, bags
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 10, scale: 4 }),
  leadTime: integer("lead_time").default(0), // days
  
  // Cost and economics
  standardCost: numeric("standard_cost", { precision: 10, scale: 4 }), // per unit
  costUnit: text("cost_unit"), // per kg, per L, per unit
  lastCostUpdate: timestamp("last_cost_update"),
  
  // Status and lifecycle
  status: text("status").notNull().default("active"), // active, inactive, obsolete, restricted
  approvalStatus: text("approval_status").notNull().default("approved"), // approved, pending, rejected
  approvedBy: text("approved_by"),
  approvedDate: timestamp("approved_date"),
  
  // Documentation
  sdsPath: text("sds_path"), // Path to Safety Data Sheet
  specSheetPath: text("spec_sheet_path"), // Path to specification sheet
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Routing operations - steps in the routing
export const routingOperations = pgTable("routing_operations", {
  id: serial("id").primaryKey(),
  routingId: integer("routing_id").references(() => routings.id).notNull(),
  operationNumber: integer("operation_number").notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  description: text("description").notNull(),
  setupTime: integer("setup_time").default(0), // minutes
  runTime: integer("run_time").notNull(), // minutes per unit
  teardownTime: integer("teardown_time").default(0), // minutes
  queueTime: integer("queue_time").default(0), // minutes
  moveTime: integer("move_time").default(0), // minutes
  overlap: integer("overlap").default(0), // percentage - how much can overlap with next operation
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  routingOperationIdx: unique().on(table.routingId, table.operationNumber),
}));

// Demand forecasts
export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  // siteId: removed - sites table was replaced by ptwarehouses
  forecastDate: timestamp("forecast_date").notNull(),
  forecastQuantity: integer("forecast_quantity").notNull(),
  forecastType: text("forecast_type").notNull().default("demand"), // demand, supply, safety_stock
  forecastMethod: text("forecast_method").notNull().default("manual"), // manual, statistical, ai, collaborative
  confidence: integer("confidence").default(50), // percentage
  plannerName: text("planner_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  itemSiteDateIdx: unique().on(table.itemId, table.siteId, table.forecastDate),
}));

// ===== ERP RELATIONS =====

// Plants Relations - Temporarily removed PT.ptPlants references

// Resources Relations
export const resourcesRelations = relations(resources, ({ many }) => ({
  plantResources: many(plantResources),
  workCenterResourceLinks: many(workCenterResources), // Many-to-many relationship with work centers
  departmentResourceLinks: many(departmentResources), // Many-to-many relationship with departments
}));

// Plant Resources Junction Table Relations
export const plantResourcesRelations = relations(plantResources, ({ one }) => ({
  plant: one(ptPlants, {
    fields: [plantResources.plantId],
    references: [ptPlants.id],
  }),
  resource: one(resources, {
    fields: [plantResources.resourceId],
    references: [resources.id],
  }),
}));

// Work Center Resources Junction Table Relations
export const workCenterResourcesRelations = relations(workCenterResources, ({ one }) => ({
  workCenter: one(workCenters, {
    fields: [workCenterResources.workCenterId],
    references: [workCenters.id],
  }),
  resource: one(resources, {
    fields: [workCenterResources.resourceId],
    references: [resources.id],
  }),
}));

// Department Resources Junction Table Relations
export const departmentResourcesRelations = relations(departmentResources, ({ one }) => ({
  department: one(departments, {
    fields: [departmentResources.departmentId],
    references: [departments.id],
  }),
  resource: one(resources, {
    fields: [departmentResources.resourceId],
    references: [resources.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parentDepartment: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
  }),
  plant: one(ptPlants, {
    fields: [departments.plantId],
    references: [ptPlants.id],
  }),
  workCenters: many(workCenters),
  employees: many(employees),
  departmentResourceLinks: many(departmentResources), // Many-to-many relationship with resources
}));

export const workCentersRelations = relations(workCenters, ({ one, many }) => ({
  department: one(departments, {
    fields: [workCenters.departmentId],
    references: [departments.id],
  }),
  plant: one(ptPlants, {
    fields: [workCenters.plantId],
    references: [ptPlants.id],
  }),
  employees: many(employees),
  routingOperations: many(routingOperations),
  workCenterResourceLinks: many(workCenterResources), // Many-to-many relationship with resources
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  workCenter: one(workCenters, {
    fields: [employees.workCenterId],
    references: [workCenters.id],
  }),
}));

// sitesRelations - DELETED: sites table was replaced by ptwarehouses

export const itemsRelations = relations(items, ({ many }) => ({
  inventory: many(inventory),
  inventoryLots: many(inventoryLots),
  stocks: many(stocks), // Link to stocks for comprehensive inventory tracking
  // salesOrderLines: DELETED - replaced by ptsalesorderlines
  // purchaseOrderLines: DELETED - replaced by ptpurchasestostock
  // transferOrderLines: DELETED - replaced by pttransferorders
  billsOfMaterial: many(billsOfMaterial),
  bomLines: many(bomLines),
  bomProductOutputs: many(bomProductOutputs), // BOM outputs for discrete manufacturing
  // recipeProductOutputs: many(recipeProductOutputs), // Recipe outputs for process manufacturing
  materialRequirements: many(materialRequirements), // Link to material requirements for inventory management
  formulationDetails: many(formulationDetails), // Link to formulation details for standardized specifications
  routings: many(routings),
  forecasts: many(forecasts),
  plannedOrders: many(plannedOrders), // Link to planned orders for this item
}));

// storageLocationsRelations - DELETED: storageLocations table was replaced by ptwarehouses

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
  // storageLocation: DELETED - storageLocations table was replaced by ptwarehouses
}));

export const inventoryLotsRelations = relations(inventoryLots, ({ one }) => ({
  item: one(items, {
    fields: [inventoryLots.itemId],
    references: [items.id],
  }),
  // storageLocation: DELETED - storageLocations table was replaced by ptwarehouses
}));

export const customersRelations = relations(customers, ({ many }) => ({
  salesOrders: many(salesOrders),
  productionOrders: many(productionOrders),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  // site: DELETED - sites table was replaced by ptwarehouses
  // lines: DELETED - salesOrderLines table was replaced by ptsalesorderlines
}));

// salesOrderLinesRelations - DELETED: salesOrderLines table was replaced by ptsalesorderlines

// salesOrderLineDistributionsRelations - DELETED: salesOrderLineDistributions table was replaced by ptsalesorderlinedistributions

export const stocksRelations = relations(stocks, ({ one, many }) => ({
  item: one(items, {
    fields: [stocks.itemId],
    references: [items.id],
  }),
  // storageLocation: DELETED - storageLocations table was replaced by ptwarehouses
  // salesOrderLineDistributions: DELETED - replaced by ptsalesorderlinedistributions
  // purchaseOrderLines: DELETED - replaced by ptpurchasestostock
  // transferOrderLines: DELETED - replaced by pttransferorders
  demandForecasts: many(demandForecasts),
  bomProductOutputs: many(bomProductOutputs),
  // recipeProductOutputs: many(recipeProductOutputs),
  materialRequirements: many(materialRequirements),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  // site: DELETED - sites table was replaced by ptwarehouses
  // lines: DELETED - purchaseOrderLines table was replaced by ptpurchasestostock
}));

// purchaseOrderLinesRelations - DELETED: purchaseOrderLines table was replaced by ptpurchasestostock

// transferOrdersRelations - DELETED: transferOrders table was replaced by pttransferorders

// transferOrderLinesRelations - DELETED: transferOrderLines table was replaced by pttransferorders

export const billsOfMaterialRelations = relations(billsOfMaterial, ({ one, many }) => ({
  parentItem: one(items, {
    fields: [billsOfMaterial.parentItemId],
    references: [items.id],
  }),
  lines: many(bomLines),
  bomMaterialRequirements: many(bomMaterialRequirements), // Renamed for clarity - direct BOM-material link
  materialRequirements: many(materialRequirements), // New relationship - detailed material requirements
  productOutputs: many(bomProductOutputs),
  productionVersions: many(productionVersions),
}));

export const bomLinesRelations = relations(bomLines, ({ one }) => ({
  bom: one(billsOfMaterial, {
    fields: [bomLines.bomId],
    references: [billsOfMaterial.id],
  }),
  componentItem: one(items, {
    fields: [bomLines.componentItemId],
    references: [items.id],
  }),
}));

// Relations for BOM Material Requirements
export const bomMaterialRequirementsRelations = relations(bomMaterialRequirements, ({ one }) => ({
  bom: one(billsOfMaterial, {
    fields: [bomMaterialRequirements.bomId],
    references: [billsOfMaterial.id],
  }),
  material: one(items, {
    fields: [bomMaterialRequirements.materialId],
    references: [items.id],
  }),
}));

// Relations for BOM Product Outputs  
export const bomProductOutputsRelations = relations(bomProductOutputs, ({ one }) => ({
  bom: one(billsOfMaterial, {
    fields: [bomProductOutputs.bomId],
    references: [billsOfMaterial.id],
  }),
  product: one(items, {
    fields: [bomProductOutputs.productId],
    references: [items.id],
  }),
  stock: one(stocks, {
    fields: [bomProductOutputs.stockId],
    references: [stocks.id],
  }),
}));

// export const recipeProductOutputsRelations = relations(recipeProductOutputs, ({ one }) => ({
//   recipe: one(recipes, {
//     fields: [recipeProductOutputs.recipeId],
//     references: [recipes.id],
//   }),
//   product: one(items, {
//     fields: [recipeProductOutputs.productId],
//     references: [items.id],
//   }),
//   stock: one(stocks, {
//     fields: [recipeProductOutputs.stockId],
//     references: [stocks.id],
//   }),
// }));

// export const routingsRelations = relations(routings, ({ one, many }) => ({
//   item: one(items, {
//     fields: [routings.itemId],
//     references: [items.id],
//   }),
//   operations: many(routingOperations),
//   ptJobOperations: many(ptJobOperations),
//   productionVersions: many(productionVersions),
// }));

// export const routingOperationsRelations = relations(routingOperations, ({ one }) => ({
//   routing: one(routings, {
//     fields: [routingOperations.routingId],
//     references: [routings.id],
//   }),
//   workCenter: one(workCenters, {
//     fields: [routingOperations.workCenterId],
//     references: [workCenters.id],
//   }),
// }));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  item: one(items, {
    fields: [forecasts.itemId],
    references: [items.id],
  }),
  // site: DELETED - sites table was replaced by ptwarehouses
}));

// ===== MRP (Material Requirements Planning) TABLES =====

// MRP Master Production Schedule - defines what we plan to produce
export const masterProductionSchedule = pgTable("ptMasterProductionSchedule", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  periodType: text("period_type").notNull().default("weekly"), // daily, weekly, monthly
  planningHorizon: integer("planning_horizon").notNull().default(52), // weeks
  bucketStartDate: timestamp("bucket_start_date").notNull(),
  bucketEndDate: timestamp("bucket_end_date").notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 5 }).notNull().default("0"),
  firmedQuantity: numeric("firmed_quantity", { precision: 15, scale: 5 }).default("0"),
  source: text("source").notNull().default("forecast"), // forecast, sales_order, manual
  sourceId: integer("source_id"), // reference to sales order or other source
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  itemPlantPeriodIdx: unique().on(table.itemId, table.plantId, table.bucketStartDate),
}));

// MRP Runs - tracks each execution of the MRP calculation
export const mrpRuns = pgTable("mrp_runs", {
  id: serial("id").primaryKey(),
  runNumber: text("run_number").notNull().unique(), // e.g., "MRP-2025-001"
  description: text("description"),
  plantId: integer("plant_id").references(() => PT.ptPlants.id),
  runType: text("run_type").notNull().default("net_change"), // net_change, regenerative, single_level
  status: text("status").notNull().default("planning"), // planning, running, completed, failed
  planningHorizon: integer("planning_horizon").notNull().default(365), // days
  cutoffDate: timestamp("cutoff_date").notNull(), // data cutoff for this run
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  processedItems: integer("processed_items").default(0),
  totalItems: integer("total_items").default(0),
  errorCount: integer("error_count").default(0),
  warningCount: integer("warning_count").default(0),
  parameters: jsonb("parameters").$type<{
    includeForecast: boolean;
    includeSafetyStock: boolean;
    firmedPlannedOrders: boolean;
    considerCapacity: boolean;
    leadTimeMethod: string; // fixed, variable, dynamic
    lotSizeMethod: string; // lot_for_lot, eoq, fixed, period_order_quantity
  }>().default({}),
  messages: jsonb("messages").$type<Array<{
    type: string; // error, warning, info
    message: string;
    itemId?: number;
    timestamp: string;
  }>>().default([]),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// MRP Requirements - calculated material requirements for each item/period
export const mrpRequirements = pgTable("mrp_requirements", {
  id: serial("id").primaryKey(),
  mrpRunId: integer("mrp_run_id").references(() => mrpRuns.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  periodStartDate: timestamp("period_start_date").notNull(),
  periodEndDate: timestamp("period_end_date").notNull(),
  
  // MRP calculations
  grossRequirement: numeric("gross_requirement", { precision: 15, scale: 5 }).default("0"),
  scheduledReceipts: numeric("scheduled_receipts", { precision: 15, scale: 5 }).default("0"),
  projectedAvailable: numeric("projected_available", { precision: 15, scale: 5 }).default("0"),
  netRequirement: numeric("net_requirement", { precision: 15, scale: 5 }).default("0"),
  plannedOrderReceipts: numeric("planned_order_receipts", { precision: 15, scale: 5 }).default("0"),
  plannedOrderReleases: numeric("planned_order_releases", { precision: 15, scale: 5 }).default("0"),
  
  // Additional planning data
  safetyStock: numeric("safety_stock", { precision: 15, scale: 5 }).default("0"),
  allocatedQuantity: numeric("allocated_quantity", { precision: 15, scale: 5 }).default("0"),
  availableToPromise: numeric("available_to_promise", { precision: 15, scale: 5 }).default("0"),
  
  // Sources of demand/supply
  demandSources: jsonb("demand_sources").$type<Array<{
    sourceType: string; // sales_order, production_order, forecast, safety_stock
    sourceId: number;
    quantity: number;
    dueDate: string;
  }>>().default([]),
  
  supplySources: jsonb("supply_sources").$type<Array<{
    sourceType: string; // purchase_order, production_order, planned_order, on_hand
    sourceId: number;
    quantity: number;
    availableDate: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mrpItemPeriodIdx: unique().on(table.mrpRunId, table.itemId, table.periodStartDate),
}));

// MRP Action Messages - suggestions for planners
export const mrpActionMessages = pgTable("mrp_action_messages", {
  id: serial("id").primaryKey(),
  mrpRunId: integer("mrp_run_id").references(() => mrpRuns.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  messageType: text("message_type").notNull(), // expedite, de_expedite, cancel, reschedule, release, firm
  priority: text("priority").notNull().default("medium"), // high, medium, low
  message: text("message").notNull(),
  originalDate: timestamp("original_date"),
  suggestedDate: timestamp("suggested_date"),
  originalQuantity: numeric("original_quantity", { precision: 15, scale: 5 }),
  suggestedQuantity: numeric("suggested_quantity", { precision: 15, scale: 5 }),
  affectedOrderType: text("affected_order_type"), // purchase_order, production_order, planned_order
  affectedOrderId: integer("affected_order_id"),
  daysEarly: integer("days_early"),
  daysLate: integer("days_late"),
  status: text("status").notNull().default("open"), // open, acknowledged, completed, ignored
  acknowledgedBy: integer("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// MRP Planning Parameters - item-specific planning settings
export const mrpPlanningParameters = pgTable("mrp_planning_parameters", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => PT.ptPlants.id).notNull(),
  
  // Planning method
  planningMethod: text("planning_method").notNull().default("mrp"), // mrp, reorder_point, kanban, manual
  mrpType: text("mrp_type").notNull().default("standard"), // standard, phantom, planning
  lowLevelCode: integer("low_level_code").default(0), // for BOM explosion order
  
  // Lot sizing
  lotSizeRule: text("lot_size_rule").notNull().default("lot_for_lot"), // lot_for_lot, eoq, fixed, period_order_quantity
  lotSize: numeric("lot_size", { precision: 15, scale: 5 }).default("1"),
  minimumOrderQuantity: numeric("minimum_order_quantity", { precision: 15, scale: 5 }).default("1"),
  maximumOrderQuantity: numeric("maximum_order_quantity", { precision: 15, scale: 5 }),
  orderMultiple: numeric("order_multiple", { precision: 15, scale: 5 }).default("1"),
  
  // Lead times
  leadTime: integer("lead_time").default(0), // days
  safetyLeadTime: integer("safety_lead_time").default(0), // days
  
  // Safety stock and service levels
  safetyStock: numeric("safety_stock", { precision: 15, scale: 5 }).default("0"),
  safetyStockMethod: text("safety_stock_method").default("fixed"), // fixed, calculated, dynamic
  serviceLevel: integer("service_level").default(95), // percentage
  
  // Planning horizon and frequencies
  planningTimeFence: integer("planning_time_fence").default(0), // days - no automatic changes within this fence
  demandTimeFence: integer("demand_time_fence").default(0), // days - use actual demand instead of forecast
  releaseTimeFence: integer("release_time_fence").default(0), // days - automatically release planned orders
  
  // Control parameters
  includeInMrp: boolean("include_in_mrp").default(true),
  createPurchaseReqs: boolean("create_purchase_reqs").default(true),
  createPlannedOrders: boolean("create_planned_orders").default(true),
  autoFirmPlannedOrders: boolean("auto_firm_planned_orders").default(false),
  consumeForecast: boolean("consume_forecast").default(true),
  
  // Capacity considerations
  considerCapacity: boolean("consider_capacity").default(false),
  infiniteCapacity: boolean("infinite_capacity").default(true),
  
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  itemPlantIdx: unique().on(table.itemId, table.plantId),
}));

// MRP Relations (to be handled below with existing relations)

// MRP Relations
export const masterProductionScheduleRelations = relations(masterProductionSchedule, ({ one }) => ({
  item: one(items, {
    fields: [masterProductionSchedule.itemId],
    references: [items.id],
  }),
  plant: one(ptPlants, {
    fields: [masterProductionSchedule.plantId],
    references: [ptPlants.id],
  }),
}));

export const mrpRunsRelations = relations(mrpRuns, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [mrpRuns.plantId],
    references: [ptPlants.id],
  }),
  requirements: many(mrpRequirements),
  actionMessages: many(mrpActionMessages),
}));

export const mrpRequirementsRelations = relations(mrpRequirements, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpRequirements.mrpRunId],
    references: [mrpRuns.id],
  }),
  item: one(items, {
    fields: [mrpRequirements.itemId],
    references: [items.id],
  }),
  plant: one(ptPlants, {
    fields: [mrpRequirements.plantId],
    references: [ptPlants.id],
  }),
}));

export const mrpActionMessagesRelations = relations(mrpActionMessages, ({ one }) => ({
  mrpRun: one(mrpRuns, {
    fields: [mrpActionMessages.mrpRunId],
    references: [mrpRuns.id],
  }),
  item: one(items, {
    fields: [mrpActionMessages.itemId],
    references: [items.id],
  }),
  plant: one(ptPlants, {
    fields: [mrpActionMessages.plantId],
    references: [ptPlants.id],
  }),
}));

export const mrpPlanningParametersRelations = relations(mrpPlanningParameters, ({ one }) => ({
  item: one(items, {
    fields: [mrpPlanningParameters.itemId],
    references: [items.id],
  }),
  plant: one(ptPlants, {
    fields: [mrpPlanningParameters.plantId],
    references: [ptPlants.id],
  }),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [productionOrders.plantId],
    references: [ptPlants.id],
  }),
  customer: one(customers, {
    fields: [productionOrders.customerId],
    references: [customers.id],
  }),
  // COMMENTED OUT: productionVersions table not defined
  // productionVersion: one(productionVersions, {
  //   fields: [productionOrders.productionVersionId],
  //   references: [productionVersions.id],
  // }),
  // Relations to PT Job Operations
  ptJobOperations: many(ptJobOperations),
  // Many-to-many relationship with planned orders via junction table
  plannedOrderLinks: many(plannedOrderProductionOrders),
}));

// COMMENTED OUT: productionVersions table not defined
// export const productionVersionsRelations = relations(productionVersions, ({ one, many }) => ({
//   plant: one(ptPlants, {
//     fields: [productionVersions.plantId],
//     references: [ptPlants.id],
//   }),
//   recipe: one(recipes, {
//     fields: [productionVersions.recipeId],
//     references: [recipes.id],
//   }),
//   routing: one(routings, {
//     fields: [productionVersions.routingId],
//     references: [routings.id],
//   }),
//   bom: one(billsOfMaterial, {
//     fields: [productionVersions.bomId],
//     references: [billsOfMaterial.id],
//   }),
//   productionOrders: many(productionOrders),
//   plannedOrders: many(plannedOrders),
//   formulations: many(formulations), // One-to-many: one production version can have many formulations
//   phaseFormulationDetailAssignments: many(productionVersionPhaseFormulationDetails), // Junction table for phase-specific formulation details
//   phaseMaterialRequirementAssignments: many(productionVersionPhaseMaterialRequirements), // Junction table for phase-specific material requirements
//   phaseBomProductOutputAssignments: many(productionVersionPhaseBomProductOutputs), // Junction table for discrete phase-specific product outputs
//   phaseRecipeProductOutputAssignments: many(productionVersionPhaseRecipeProductOutputs), // Junction table for process phase-specific product outputs
// }));

// COMMENTED OUT: plannedOrders table not defined
// export const plannedOrdersRelations = relations(plannedOrders, ({ one, many }) => ({
//   plant: one(ptPlants, {
//     fields: [plannedOrders.plantId],
//     references: [ptPlants.id],
//   }),
//   productionVersion: one(productionVersions, {
//     fields: [plannedOrders.productionVersionId],
//     references: [productionVersions.id],
//   }),
//   item: one(items, {
//     fields: [plannedOrders.itemId],
//     references: [items.id],
//   }),
//   // Many-to-many relationship with production orders via junction table
//   productionOrderLinks: many(plannedOrderProductionOrders),
// });

// Junction table relations for many-to-many relationship - COMMENTED OUT: Tables not defined
// export const plannedOrderProductionOrdersRelations = relations(plannedOrderProductionOrders, ({ one }) => ({
//   plannedOrder: one(plannedOrders, {
//     fields: [plannedOrderProductionOrders.plannedOrderId],
//     references: [plannedOrders.id],
//   }),
//   productionOrder: one(productionOrders, {
//     fields: [plannedOrderProductionOrders.productionOrderId],
//     references: [productionOrders.id],
//   }),
//   convertedBy: one(users, {
//     fields: [plannedOrderProductionOrders.convertedBy],
//     references: [users.id],
//   }),
// });

// Relations for material requirements - COMMENTED OUT: Tables not defined
// export const materialRequirementsRelations = relations(materialRequirements, ({ one, many }) => ({
//   formulation: one(formulations, {
//     fields: [materialRequirements.formulationId],
//     references: [formulations.id],
//   }),
//   billOfMaterial: one(billsOfMaterial, {
//     fields: [materialRequirements.bomId],
//     references: [billsOfMaterial.id],
//   }),
//   item: one(items, {
//     fields: [materialRequirements.itemId],
//     references: [items.id],
//   }),
//   stock: one(stocks, {
//     fields: [materialRequirements.stockId],
//     references: [stocks.id],
//   }),
// });

// Relations for formulations - COMMENTED OUT: Tables not defined
// export const formulationsRelations = relations(formulations, ({ one, many }) => ({
//   productionVersion: one(productionVersions, {
//     fields: [formulations.productionVersionId],
//     references: [productionVersions.id],
//   }),
//   preferredVendor: one(vendors, {
//     fields: [formulations.preferredVendorId],
//     references: [vendors.id],
//   }),
//   materialRequirements: many(materialRequirements), // One-to-many: one formulation can have many material requirements
//   formulationDetails: many(formulationDetails), // One-to-many: one formulation can have many formulation details
// }));

// Relations for formulation details - COMMENTED OUT: Tables not defined
// export const formulationDetailsRelations = relations(formulationDetails, ({ one, many }) => ({
//   formulation: one(formulations, {
//     fields: [formulationDetails.formulationId],
//     references: [formulations.id],
//   }),
//   item: one(items, {
//     fields: [formulationDetails.itemId],
//     references: [items.id],
//   }),
//   phaseAssignments: many(productionVersionPhaseFormulationDetails), // Many-to-many: one formulation detail can be assigned to many phases
// }));

// Relations for production version phase formulation details junction table - COMMENTED OUT: Tables not defined
// DELETED: productionVersionPhaseFormulationDetails relations - Replaced by PT structures

// Enhanced vendor relations to include formulations - COMMENTED OUT: formulations table not defined
// export const vendorsRelations = relations(vendors, ({ many }) => ({
//   preferredFormulations: many(formulations),
// }));



// ===== ERP INSERT SCHEMAS =====
// NOTE: insertDepartmentSchema is already defined earlier in the schema

export const insertWorkCenterSchema = createInsertSchema(workCenters, { 
  id: undefined,
  createdAt: undefined,
});

export const insertWorkCenterResourceSchema = createInsertSchema(workCenterResources, { 
  id: undefined,
  createdAt: undefined,
}, {
  effectiveDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDepartmentResourceSchema = createInsertSchema(departmentResources, { 
  id: undefined,
  createdAt: undefined,
}, {
  effectiveDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertEmployeeSchema = createInsertSchema(employees, { 
  id: undefined,
  createdAt: undefined,
}, {
  hireDate: z.union([z.string().datetime(), z.date()]).optional(),
  terminationDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// insertSiteSchema - DELETED: sites table was replaced by ptwarehouses

export const insertItemSchema = createInsertSchema(items, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  // Date field transformations for enhanced items table
  lastAnalysisDate: z.union([z.string().datetime(), z.date()]).optional(),
  phaseOutDate: z.union([z.string().datetime(), z.date()]).optional(),
  releaseDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastModifiedDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastCountDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastUsageDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// insertStorageLocationSchema - DELETED: storageLocations table was replaced by ptwarehouses

export const insertInventorySchema = createInsertSchema(inventory, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertInventoryLotSchema = createInsertSchema(inventoryLots, { 
  id: undefined,
  createdAt: undefined,
}, {
  expirationDate: z.union([z.string().datetime(), z.date()]).optional(),
  receivedDate: z.union([z.string().datetime(), z.date()]),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  orderDate: z.union([z.string().datetime(), z.date()]),
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
  shippedDate: z.union([z.string().datetime(), z.date()]).optional(),
  creditApprovedDate: z.union([z.string().datetime(), z.date()]).optional(),
  expectedDeliveryDate: z.union([z.string().datetime(), z.date()]).optional(),
  quotationValidUntil: z.union([z.string().datetime(), z.date()]).optional(),
  priceHoldUntil: z.union([z.string().datetime(), z.date()]).optional(),
  approvedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// insertSalesOrderLineSchema - DELETED: salesOrderLines table was replaced by ptsalesorderlines

// insertSalesOrderLineDistributionSchema - DELETED: salesOrderLineDistributions table was replaced by ptsalesorderlinedistributions

export const insertStockSchema = createInsertSchema(stocks, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  lastCountDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastReceiptDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastIssueDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  orderDate: z.union([z.string().datetime(), z.date()]),
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
  receivedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

// insertPurchaseOrderLineSchema - DELETED: purchaseOrderLines table was replaced by ptpurchasestostock

// insertTransferOrderSchema - DELETED: transferOrders table was replaced by pttransferorders

// insertTransferOrderLineSchema - DELETED: transferOrderLines table was replaced by pttransferorders

export const insertBillOfMaterialSchema = createInsertSchema(billsOfMaterial, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  expiredDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertBomLineSchema = createInsertSchema(bomLines, { 
  id: undefined,
  createdAt: undefined,
});

export const insertBomMaterialRequirementSchema = createInsertSchema(bomMaterialRequirements, { 
  id: undefined,
  createdAt: undefined,
});

export const insertBomProductOutputSchema = createInsertSchema(bomProductOutputs, { 
  id: undefined,
  createdAt: undefined,
});

// export const insertRecipeProductOutputSchema = createInsertSchema(recipeProductOutputs, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export const insertRoutingSchema = createInsertSchema(routings, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// }, {
//   effectiveDate: z.union([z.string().datetime(), z.date()]),
//   expiredDate: z.union([z.string().datetime(), z.date()]).optional(),
// });

export const insertRoutingOperationSchema = createInsertSchema(routingOperations, { 
  id: undefined,
  createdAt: undefined,
});

export const insertMaterialRequirementSchema = createInsertSchema(materialRequirements, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Removed: insertFormulationsSchema - use insertFormulationSchema instead

export const insertForecastSchema = createInsertSchema(forecasts, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  forecastDate: z.union([z.string().datetime(), z.date()]),
});

// ===== ERP TYPE EXPORTS =====

export type Department = typeof departments.$inferSelect;
// InsertDepartment already exported above at line 4266

export type WorkCenter = typeof workCenters.$inferSelect;
export type InsertWorkCenter = z.infer<typeof insertWorkCenterSchema>;

export type WorkCenterResource = typeof workCenterResources.$inferSelect;
export type InsertWorkCenterResource = z.infer<typeof insertWorkCenterResourceSchema>;

export type DepartmentResource = typeof departmentResources.$inferSelect;
export type InsertDepartmentResource = z.infer<typeof insertDepartmentResourceSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Site type - DELETED: sites table was replaced by ptwarehouses
// InsertSite type - DELETED: insertSiteSchema was removed

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

// StorageLocation type - DELETED: storageLocations table was replaced by ptwarehouses
// InsertStorageLocation type - DELETED: insertStorageLocationSchema was removed

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InsertInventoryLot = z.infer<typeof insertInventoryLotSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

// SalesOrderLine type - DELETED: salesOrderLines table was replaced by ptsalesorderlines
// InsertSalesOrderLine type - DELETED: insertSalesOrderLineSchema was removed

// SalesOrderLineDistribution and InsertSalesOrderLineDistribution types - DELETED: related tables/schemas were removed

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

// PurchaseOrderLine type - DELETED: purchaseOrderLines table was replaced by ptpurchasestostock
// InsertPurchaseOrderLine type - DELETED: insertPurchaseOrderLineSchema was removed

// TransferOrder type - DELETED: transferOrders table was replaced by pttransferorders
// InsertTransferOrder type - DELETED: insertTransferOrderSchema was removed

// TransferOrderLine and InsertTransferOrderLine types - DELETED: related tables/schemas were removed

export type BillOfMaterial = typeof billsOfMaterial.$inferSelect;
export type InsertBillOfMaterial = z.infer<typeof insertBillOfMaterialSchema>;

export type BomLine = typeof bomLines.$inferSelect;
export type InsertBomLine = z.infer<typeof insertBomLineSchema>;

export type BomMaterialRequirement = typeof bomMaterialRequirements.$inferSelect;
export type InsertBomMaterialRequirement = z.infer<typeof insertBomMaterialRequirementSchema>;

export type BomProductOutput = typeof bomProductOutputs.$inferSelect;
export type InsertBomProductOutput = z.infer<typeof insertBomProductOutputSchema>;

// export type RecipeProductOutput = typeof recipeProductOutputs.$inferSelect;
// export type InsertRecipeProductOutput = z.infer<typeof insertRecipeProductOutputSchema>;

// export type Routing = typeof routings.$inferSelect;
// export type InsertRouting = z.infer<typeof insertRoutingSchema>;

export type RoutingOperation = typeof routingOperations.$inferSelect;
export type InsertRoutingOperation = z.infer<typeof insertRoutingOperationSchema>;

export type MaterialRequirement = typeof materialRequirements.$inferSelect;
export type InsertMaterialRequirement = z.infer<typeof insertMaterialRequirementSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;

// User Secrets Management - for storing API keys and sensitive connection data
export const userSecrets = pgTable("user_secrets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // Display name for the secret (e.g., "OpenAI API Key", "AWS Access Key")
  key: text("key").notNull(), // The actual key identifier (e.g., "OPENAI_API_KEY", "AWS_ACCESS_KEY_ID")
  encryptedValue: text("encrypted_value").notNull(), // Encrypted secret value
  description: text("description"), // Optional description of what this secret is used for
  category: text("category").notNull().default("api_key"), // api_key, database, integration, other
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userKeyUnique: unique().on(table.userId, table.key), // Ensure unique key per user
}));

export const insertUserSecretSchema = createInsertSchema(userSecrets, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type UserSecret = typeof userSecrets.$inferSelect;
export type InsertUserSecret = z.infer<typeof insertUserSecretSchema>;

// Production Version Schema - COMMENTED OUT: productionVersions table not defined
// export const insertProductionVersionSchema = createInsertSchema(productionVersions, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export type ProductionVersion = typeof productionVersions.$inferSelect;
// export type InsertProductionVersion = z.infer<typeof insertProductionVersionSchema>;

// Resource Requirements Insert Schemas - COMMENTED OUT: resourceRequirements and resourceRequirementAssignments tables not defined
// export const insertResourceRequirementSchema = createInsertSchema(resourceRequirements, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// });

// export const insertResourceRequirementAssignmentSchema = createInsertSchema(resourceRequirementAssignments, { 
//   id: undefined,
//   createdAt: undefined,
//   updatedAt: undefined,
// }, {
//   plannedStartTime: z.union([z.string().datetime(), z.date()]).optional(),
//   plannedEndTime: z.union([z.string().datetime(), z.date()]).optional(),
//   actualStartTime: z.union([z.string().datetime(), z.date()]).optional(),
//   actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
// });



// Resource Requirements Types - COMMENTED OUT: Tables not defined
// export type ResourceRequirement = typeof resourceRequirements.$inferSelect;
// export type InsertResourceRequirement = z.infer<typeof insertResourceRequirementSchema>;
// export type ResourceRequirementAssignment = typeof resourceRequirementAssignments.$inferSelect;
// export type InsertResourceRequirementAssignment = z.infer<typeof insertResourceRequirementAssignmentSchema>;


// Formulations Insert Schema and Types
export const insertFormulationSchema = createInsertSchema(formulations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}, {
  approvedDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastCostUpdate: z.union([z.string().datetime(), z.date()]).optional(),
});

export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;

// Formulation Details Insert Schema and Types
export const insertFormulationDetailSchema = createInsertSchema(formulationDetails, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type FormulationDetail = typeof formulationDetails.$inferSelect;
export type InsertFormulationDetail = z.infer<typeof insertFormulationDetailSchema>;

// DELETED: productionVersionPhaseFormulationDetails schemas and types - Replaced by PT structures

// Canvas widgets that Max can display on the canvas at user request
export const canvasWidgets = pgTable("canvas_widgets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetPlatform: text("target_platform").notNull().default("both"), // "mobile", "desktop", "both"
  widgetType: text("widget_type").notNull(), // 'chart', 'table', 'metric', 'alert', 'list', 'custom', 'system'
  widgetSubtype: text("widget_subtype"), // 'bar', 'pie', 'line', 'gauge', etc.
  data: jsonb("data").$type<Record<string, any>>().notNull(), // Widget data content
  configuration: jsonb("configuration").$type<Record<string, any>>().default({}), // Widget display configuration
  position: jsonb("position").$type<{ x: number; y: number; width: number; height: number }>(), // Canvas position
  isVisible: boolean("is_visible").default(true),
  createdByMax: boolean("created_by_max").default(false), // True if created by Max AI
  isSystemWidget: boolean("is_system_widget").default(false), // True if created by system and cannot be edited
  sessionId: text("session_id"), // Session identifier for grouping widgets
  userId: integer("user_id").references(() => users.id), // User who requested the widget
  plantId: integer("plant_id").references(() => PT.ptPlants.id), // Plant context if applicable
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // Additional metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("canvas_widgets_user_idx").on(table.userId),
  sessionIdIdx: index("canvas_widgets_session_idx").on(table.sessionId),
  visibleIdx: index("canvas_widgets_visible_idx").on(table.isVisible),
  createdByMaxIdx: index("canvas_widgets_max_idx").on(table.createdByMax),
}));

// Canvas widgets insert schema and types
export const insertCanvasWidgetSchema = createInsertSchema(canvasWidgets, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type CanvasWidget = typeof canvasWidgets.$inferSelect;
export type InsertCanvasWidget = z.infer<typeof insertCanvasWidgetSchema>;

// Unified Widget System Schemas
export const insertUnifiedWidgetSchema = createInsertSchema(unifiedWidgets, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertUnifiedWidget = z.infer<typeof insertUnifiedWidgetSchema>;
export type UnifiedWidget = typeof unifiedWidgets.$inferSelect;

export const insertWidgetDeploymentSchema = createInsertSchema(widgetDeployments, { 
  id: undefined,
  deployedAt: undefined,
});
export type InsertWidgetDeployment = z.infer<typeof insertWidgetDeploymentSchema>;
export type WidgetDeployment = typeof widgetDeployments.$inferSelect;

// ==================== TOC BUFFER MANAGEMENT ====================

// Buffer Types: Time buffers protect against disruptions, Stock buffers protect against stockouts
export const bufferDefinitions = pgTable("buffer_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  bufferType: text("buffer_type").notNull(), // 'time', 'stock'
  bufferCategory: text("buffer_category").notNull(), // For time: 'drum', 'feeding', 'shipping', 'project'; For stock: 'finished_goods', 'raw_material', 'wip'
  
  // Location/Application
  locationEntityType: text("location_entity_type"), // 'resource', 'operation', 'item', 'work_center', 'warehouse'
  locationEntityId: integer("location_entity_id"),
  resourceId: integer("resource_id").references(() => resources.id), // For drum buffers
  operationId: integer("operation_id"), // For feeding buffers - production operations
  itemId: integer("item_id").references(() => items.id), // For stock buffers
  workCenterId: integer("work_center_id").references(() => workCenters.id),
  
  // Buffer sizing
  targetSize: numeric("target_size", { precision: 15, scale: 2 }).notNull(), // Time in minutes or stock quantity
  sizeUnit: text("size_unit").notNull(), // 'minutes', 'hours', 'pieces', 'kg', etc.
  minSize: numeric("min_size", { precision: 15, scale: 2 }),
  maxSize: numeric("max_size", { precision: 15, scale: 2 }),
  
  // Buffer zones (TOC concept: Red, Yellow, Green)
  redZonePercent: numeric("red_zone_percent", { precision: 5, scale: 2 }).default('33.33'),
  yellowZonePercent: numeric("yellow_zone_percent", { precision: 5, scale: 2 }).default('33.33'),
  greenZonePercent: numeric("green_zone_percent", { precision: 5, scale: 2 }).default('33.34'),
  
  // Management policies
  replenishmentPolicy: text("replenishment_policy").default('standard'), // 'standard', 'min-max', 'dynamic'
  priorityLevel: integer("priority_level").default(1), // 1-5, higher is more critical
  protectionLevel: text("protection_level").default('standard'), // 'minimal', 'standard', 'critical'
  
  // Status and activation
  isActive: boolean("is_active").default(true),
  effectiveFromDate: timestamp("effective_from_date"),
  effectiveToDate: timestamp("effective_to_date"),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("buffer_type_idx").on(table.bufferType),
  categoryIdx: index("buffer_category_idx").on(table.bufferCategory),
  locationIdx: index("buffer_location_idx").on(table.locationEntityType, table.locationEntityId),
  activeIdx: index("buffer_active_idx").on(table.isActive),
}));

// Buffer consumption tracking - real-time buffer status
export const bufferConsumption = pgTable("buffer_consumption", {
  id: serial("id").primaryKey(),
  bufferDefinitionId: integer("buffer_definition_id").references(() => bufferDefinitions.id).notNull(),
  
  // Current status
  currentLevel: numeric("current_level", { precision: 15, scale: 2 }).notNull(), // Current buffer level
  currentZone: text("current_zone").notNull(), // 'green', 'yellow', 'red'
  consumptionRate: numeric("consumption_rate", { precision: 15, scale: 2 }), // Rate per hour
  
  // Reference to consuming entity
  consumingEntityType: text("consuming_entity_type"), // 'production_order', 'operation', 'transfer_order'
  consumingEntityId: integer("consuming_entity_id"),
  
  // Tracking details
  measurementTimestamp: timestamp("measurement_timestamp").defaultNow(),
  penetrationIntoRed: numeric("penetration_into_red", { precision: 5, scale: 2 }), // % penetration into red zone
  timeSinceLastReplenishment: integer("time_since_last_replenishment"), // minutes
  
  // Alerts and actions
  alertStatus: text("alert_status").default('normal'), // 'normal', 'warning', 'critical', 'emergency'
  actionRequired: text("action_required"), // Recommended action
  
  // Historical tracking
  avgConsumptionRate24h: numeric("avg_consumption_rate_24h", { precision: 15, scale: 2 }),
  avgConsumptionRate7d: numeric("avg_consumption_rate_7d", { precision: 15, scale: 2 }),
  maxPenetrationRed24h: numeric("max_penetration_red_24h", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  bufferIdx: index("buffer_consumption_buffer_idx").on(table.bufferDefinitionId),
  zoneIdx: index("buffer_consumption_zone_idx").on(table.currentZone),
  alertIdx: index("buffer_consumption_alert_idx").on(table.alertStatus),
  timestampIdx: index("buffer_consumption_timestamp_idx").on(table.measurementTimestamp),
}));

// Buffer management history - for analysis and improvement
export const bufferManagementHistory = pgTable("buffer_management_history", {
  id: serial("id").primaryKey(),
  bufferDefinitionId: integer("buffer_definition_id").references(() => bufferDefinitions.id).notNull(),
  
  // Event details
  eventType: text("event_type").notNull(), // 'penetration', 'replenishment', 'size_change', 'policy_change', 'expedite'
  eventTimestamp: timestamp("event_timestamp").defaultNow(),
  eventDescription: text("event_description"),
  
  // Buffer status at event
  levelBefore: numeric("level_before", { precision: 15, scale: 2 }),
  levelAfter: numeric("level_after", { precision: 15, scale: 2 }),
  zoneBefore: text("zone_before"), // 'green', 'yellow', 'red'
  zoneAfter: text("zone_after"),
  
  // Impact and cause
  impactSeverity: text("impact_severity"), // 'low', 'medium', 'high', 'critical'
  rootCause: text("root_cause"),
  causedByEntityType: text("caused_by_entity_type"), // What caused the event
  causedByEntityId: integer("caused_by_entity_id"),
  
  // Response and resolution
  responseAction: text("response_action"),
  responseTime: integer("response_time"), // minutes from event to response
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  
  // Performance metrics
  serviceLevel: numeric("service_level", { precision: 5, scale: 2 }), // % of time buffer stayed green
  leadTimeImpact: integer("lead_time_impact"), // Impact on lead time in minutes
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  bufferIdx: index("buffer_history_buffer_idx").on(table.bufferDefinitionId),
  eventTypeIdx: index("buffer_history_event_type_idx").on(table.eventType),
  timestampIdx: index("buffer_history_timestamp_idx").on(table.eventTimestamp),
  severityIdx: index("buffer_history_severity_idx").on(table.impactSeverity),
}));

// Buffer policies - rules for buffer management
export const bufferPolicies = pgTable("buffer_policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  policyType: text("policy_type").notNull(), // 'replenishment', 'expedite', 'size_adjustment', 'alert'
  
  // Conditions
  triggerCondition: jsonb("trigger_condition").$type<{
    zone: string[]; // Which zones trigger this policy
    penetrationPercent?: number; // % penetration threshold
    timePeriod?: number; // Time in zone before trigger
    consumptionRate?: number; // Consumption rate threshold
  }>().notNull(),
  
  // Actions
  actionType: text("action_type").notNull(), // 'expedite_order', 'increase_size', 'alert_manager', 'change_priority'
  actionParameters: jsonb("action_parameters").$type<{
    expediteLevel?: string;
    sizeChangePercent?: number;
    alertRecipients?: string[];
    priorityChange?: number;
  }>(),
  
  // Application scope
  applicableBufferTypes: text("applicable_buffer_types").array(), // Which buffer types this applies to
  applicableBufferCategories: text("applicable_buffer_categories").array(),
  specificBufferIds: integer("specific_buffer_ids").array(), // Specific buffers if not general
  
  // Effectiveness tracking
  timesTriggered: integer("times_triggered").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }),
  avgResponseTime: integer("avg_response_time"), // minutes
  
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("buffer_policy_type_idx").on(table.policyType),
  activeIdx: index("buffer_policy_active_idx").on(table.isActive),
}));

// ==================== CONSTRAINTS MANAGEMENT SYSTEM ====================

// Manufacturing Constraints Management System
export const constraintCategories = pgTable("constraint_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Equipment", "Material", "Policy", "Quality"
  description: text("description"),
  color: text("color").default("#6366f1"), // For UI display
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const constraints = pgTable("constraints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => constraintCategories.id),
  
  // Constraint classification
  constraintType: text("constraint_type").notNull(), // "physical", "policy"
  severityLevel: text("severity_level").notNull(), // "hard", "soft"
  priority: text("priority").notNull().default("medium"), // "high", "medium", "low"
  
  // Scope and applicability
  scope: text("scope").notNull(), // "global", "plant", "resource", "operation", "item"
  applicableToPlantId: integer("applicable_to_plant_id").references(() => ptPlants.id),
  applicableToResourceId: integer("applicable_to_resource_id").references(() => resources.id),
  applicableToItemId: integer("applicable_to_item_id").references(() => items.id),
  applicableToWorkCenterId: integer("applicable_to_work_center_id").references(() => workCenters.id),
  
  // Constraint definition
  constraintRule: jsonb("constraint_rule").$type<{
    type: "capacity" | "time" | "sequence" | "resource" | "quality" | "custom";
    operator: "=" | "!=" | "<" | ">" | "<=" | ">=" | "between" | "in" | "not_in";
    field: string; // The field being constrained (e.g., "quantity", "duration", "startTime")
    value: any; // The constraint value(s)
    unit?: string; // Unit of measurement if applicable
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>; // Additional conditions for complex constraints
  }>(),
  
  // Violation handling
  violationAction: text("violation_action").notNull().default("warn"), // "block", "warn", "log"
  violationMessage: text("violation_message"),
  violationPenalty: numeric("violation_penalty", { precision: 10, scale: 2 }), // Cost penalty for soft constraints
  
  // Temporal aspects
  effectiveFromDate: timestamp("effective_from_date"),
  effectiveToDate: timestamp("effective_to_date"),
  isActive: boolean("is_active").default(true),
  
  // Metadata
  businessJustification: text("business_justification"),
  regulatoryBasis: text("regulatory_basis"),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("constraints_name_idx").on(table.name),
  categoryIdx: index("constraints_category_idx").on(table.categoryId),
  scopeIdx: index("constraints_scope_idx").on(table.scope),
  typeIdx: index("constraints_type_idx").on(table.constraintType),
  severityIdx: index("constraints_severity_idx").on(table.severityLevel),
  activeIdx: index("constraints_active_idx").on(table.isActive),
}));

export const constraintViolations = pgTable("constraint_violations", {
  id: serial("id").primaryKey(),
  constraintId: integer("constraint_id").references(() => constraints.id).notNull(),
  
  // Reference to what violated the constraint
  violationEntityType: text("violation_entity_type").notNull(), // "production_order", "operation", "resource_allocation"
  violationEntityId: integer("violation_entity_id").notNull(),
  
  // Violation details
  violationTimestamp: timestamp("violation_timestamp").defaultNow(),
  violationValue: jsonb("violation_value").$type<any>(), // The actual value that violated the constraint
  expectedValue: jsonb("expected_value").$type<any>(), // The expected/allowed value
  violationSeverity: text("violation_severity").notNull(), // "critical", "major", "minor", "warning"
  
  // Impact assessment
  impactDescription: text("impact_description"),
  estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
  estimatedDelay: integer("estimated_delay_minutes"),
  affectedCustomers: jsonb("affected_customers").$type<number[]>().default([]),
  
  // Resolution tracking
  status: text("status").notNull().default("open"), // "open", "acknowledged", "resolved", "waived"
  resolution: text("resolution"), // Description of how the violation was resolved
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  waiverReason: text("waiver_reason"), // If violation was waived, why?
  waiverApprovedBy: integer("waiver_approved_by").references(() => users.id),
  
  // Prevention measures
  preventiveMeasures: text("preventive_measures"),
  rootCauseAnalysis: text("root_cause_analysis"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  constraintIdx: index("violations_constraint_idx").on(table.constraintId),
  entityIdx: index("violations_entity_idx").on(table.violationEntityType, table.violationEntityId),
  timestampIdx: index("violations_timestamp_idx").on(table.violationTimestamp),
  statusIdx: index("violations_status_idx").on(table.status),
  severityIdx: index("violations_severity_idx").on(table.violationSeverity),
}));

export const constraintExceptions = pgTable("constraint_exceptions", {
  id: serial("id").primaryKey(),
  constraintId: integer("constraint_id").references(() => constraints.id).notNull(),
  
  // Exception details
  exceptionName: text("exception_name").notNull(),
  exceptionDescription: text("exception_description"),
  exceptionType: text("exception_type").notNull(), // "temporary", "permanent", "conditional"
  
  // Scope of exception
  applicableToEntityType: text("applicable_to_entity_type"), // "production_order", "customer", "item"
  applicableToEntityId: integer("applicable_to_entity_id"),
  
  // Temporal aspects
  validFromDate: timestamp("valid_from_date"),
  validToDate: timestamp("valid_to_date"),
  
  // Approval workflow
  requestedBy: integer("requested_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  businessJustification: text("business_justification").notNull(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  constraintIdx: index("exceptions_constraint_idx").on(table.constraintId),
  entityIdx: index("exceptions_entity_idx").on(table.applicableToEntityType, table.applicableToEntityId),
  validityIdx: index("exceptions_validity_idx").on(table.validFromDate, table.validToDate),
  activeIdx: index("exceptions_active_idx").on(table.isActive),
}));

// Constraints insert schemas and types
export const insertConstraintCategorySchema = createInsertSchema(constraintCategories, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertConstraintCategory = z.infer<typeof insertConstraintCategorySchema>;
export type ConstraintCategory = typeof constraintCategories.$inferSelect;

export const insertConstraintSchema = createInsertSchema(constraints, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertConstraint = z.infer<typeof insertConstraintSchema>;
export type Constraint = typeof constraints.$inferSelect;

export const insertConstraintViolationSchema = createInsertSchema(constraintViolations, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertConstraintViolation = z.infer<typeof insertConstraintViolationSchema>;
export type ConstraintViolation = typeof constraintViolations.$inferSelect;

export const insertConstraintExceptionSchema = createInsertSchema(constraintExceptions, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertConstraintException = z.infer<typeof insertConstraintExceptionSchema>;
export type ConstraintException = typeof constraintExceptions.$inferSelect;

// Buffer management insert schemas and types
export const insertBufferDefinitionSchema = createInsertSchema(bufferDefinitions, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertBufferDefinition = z.infer<typeof insertBufferDefinitionSchema>;
export type BufferDefinition = typeof bufferDefinitions.$inferSelect;

export const insertBufferConsumptionSchema = createInsertSchema(bufferConsumption, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertBufferConsumption = z.infer<typeof insertBufferConsumptionSchema>;
export type BufferConsumption = typeof bufferConsumption.$inferSelect;

export const insertBufferManagementHistorySchema = createInsertSchema(bufferManagementHistory, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertBufferManagementHistory = z.infer<typeof insertBufferManagementHistorySchema>;
export type BufferManagementHistory = typeof bufferManagementHistory.$inferSelect;

export const insertBufferPolicySchema = createInsertSchema(bufferPolicies, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertBufferPolicy = z.infer<typeof insertBufferPolicySchema>;
export type BufferPolicy = typeof bufferPolicies.$inferSelect;

// Missing table definitions and types that are referenced in storage interface

// Account Management Tables
export const accountInfo = pgTable("account_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accountType: text("account_type").notNull().default("free"),
  subscriptionTier: text("subscription_tier").default("basic"),
  billingEmail: text("billing_email"),
  billingAddress: jsonb("billing_address"),
  paymentMethodId: text("payment_method_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billingHistory = pgTable("billing_history", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accountInfo.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  billingDate: timestamp("billing_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accountInfo.id).notNull(),
  metricType: text("metric_type").notNull(),
  value: numeric("value").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Integration Data Flow Tables
export const integrationDataFlow = pgTable("integration_data_flow", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  integrationId: integer("integration_id").references(() => systemIntegrations.id),
  sourceSystem: text("source_system").notNull(),
  targetSystem: text("target_system").notNull(),
  dataFlowType: text("data_flow_type").notNull(),
  isActive: boolean("is_active").default(true),
  schedule: text("schedule"),
  lastExecution: timestamp("last_execution"),
  nextExecution: timestamp("next_execution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationExecutionLog = pgTable("integration_execution_log", {
  id: serial("id").primaryKey(),
  dataFlowId: integer("data_flow_id").references(() => integrationDataFlow.id),
  executionId: text("execution_id").notNull(),
  status: text("status").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  recordsProcessed: integer("records_processed").default(0),
  errorCount: integer("error_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationDataMapping = pgTable("integration_data_mapping", {
  id: serial("id").primaryKey(),
  dataFlowId: integer("data_flow_id").references(() => integrationDataFlow.id).notNull(),
  sourceField: text("source_field").notNull(),
  targetField: text("target_field").notNull(),
  transformation: text("transformation"),
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationWebhook = pgTable("integration_webhook", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => systemIntegrations.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("POST"),
  headers: jsonb("headers"),
  eventTypes: jsonb("event_types").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  secret: text("secret"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Recipe Equipment Junction Table
export const recipeEquipment = pgTable("recipe_equipment", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  isPrimary: boolean("is_primary").default(false),
  utilizationPercentage: numeric("utilization_percentage").default("100"),
  setupTime: integer("setup_time").default(0),
  cleaningTime: integer("cleaning_time").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas and types for the missing tables
export const insertAccountInfoSchema = createInsertSchema(accountInfo, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertAccountInfo = z.infer<typeof insertAccountInfoSchema>;
export type AccountInfo = typeof accountInfo.$inferSelect;

export const insertBillingHistorySchema = createInsertSchema(billingHistory, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;

export const insertUsageMetricsSchema = createInsertSchema(usageMetrics, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertUsageMetrics = z.infer<typeof insertUsageMetricsSchema>;
export type UsageMetrics = typeof usageMetrics.$inferSelect;

export const insertIntegrationDataFlowSchema = createInsertSchema(integrationDataFlow, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertIntegrationDataFlow = z.infer<typeof insertIntegrationDataFlowSchema>;
export type IntegrationDataFlow = typeof integrationDataFlow.$inferSelect;

export const insertIntegrationExecutionLogSchema = createInsertSchema(integrationExecutionLog, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertIntegrationExecutionLog = z.infer<typeof insertIntegrationExecutionLogSchema>;
export type IntegrationExecutionLog = typeof integrationExecutionLog.$inferSelect;

export const insertIntegrationDataMappingSchema = createInsertSchema(integrationDataMapping, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertIntegrationDataMapping = z.infer<typeof insertIntegrationDataMappingSchema>;
export type IntegrationDataMapping = typeof integrationDataMapping.$inferSelect;

export const insertIntegrationWebhookSchema = createInsertSchema(integrationWebhook, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertIntegrationWebhook = z.infer<typeof insertIntegrationWebhookSchema>;
export type IntegrationWebhook = typeof integrationWebhook.$inferSelect;



export const insertRecipeEquipmentSchema = createInsertSchema(recipeEquipment, { 
  id: undefined,
  createdAt: undefined,
});
export type InsertRecipeEquipment = z.infer<typeof insertRecipeEquipmentSchema>;
export type RecipeEquipment = typeof recipeEquipment.$inferSelect;

// Home Dashboard Layout schemas
export const insertHomeDashboardLayoutSchema = createInsertSchema(homeDashboardLayouts, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertHomeDashboardLayout = z.infer<typeof insertHomeDashboardLayoutSchema>;
export type HomeDashboardLayout = typeof homeDashboardLayouts.$inferSelect;

// MPS duplicate removed - using the original definition from MRP section

// Sales forecasts that feed into MPS (simplified structure)
export const salesForecasts = pgTable("sales_forecasts", {
  id: serial("id").primaryKey(),
  itemNumber: text("item_number").notNull(),
  plantId: integer("plant_id").notNull(),
  forecastData: jsonb("forecast_data").default([]),
  forecastModel: text("forecast_model").default("manual"),
  accuracyScore: numeric("accuracy_score", { precision: 5, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdBy: integer("created_by"),
  notes: text("notes"),
  isBaseline: boolean("is_baseline").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Available to Promise calculations (simplified structure)
export const availableToPromise = pgTable("available_to_promise", {
  id: serial("id").primaryKey(),
  itemNumber: text("item_number").notNull(),
  plantId: integer("plant_id").notNull(),
  atpData: jsonb("atp_data").default([]),
  atpRules: jsonb("atp_rules").default({}),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  calculationTrigger: text("calculation_trigger").default("manual"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MRP Zod schemas
export const insertMasterProductionScheduleSchema = createInsertSchema(masterProductionSchedule, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertMrpRunSchema = createInsertSchema(mrpRuns, {
  id: undefined,
  createdAt: undefined,
});

export const insertMrpRequirementSchema = createInsertSchema(mrpRequirements, {
  id: undefined,
  createdAt: undefined,
});

export const insertMrpActionMessageSchema = createInsertSchema(mrpActionMessages, {
  id: undefined,
  createdAt: undefined,
});

export const insertMrpPlanningParametersSchema = createInsertSchema(mrpPlanningParameters, {
  id: undefined,
  createdAt: undefined,
  lastUpdated: undefined,
});

// MRP Type exports
export type MasterProductionSchedule = typeof masterProductionSchedule.$inferSelect;
export type InsertMasterProductionSchedule = z.infer<typeof insertMasterProductionScheduleSchema>;

export type MrpRun = typeof mrpRuns.$inferSelect;
export type InsertMrpRun = z.infer<typeof insertMrpRunSchema>;

export type MrpRequirement = typeof mrpRequirements.$inferSelect;
export type InsertMrpRequirement = z.infer<typeof insertMrpRequirementSchema>;

export type MrpActionMessage = typeof mrpActionMessages.$inferSelect;
export type InsertMrpActionMessage = z.infer<typeof insertMrpActionMessageSchema>;

export type MrpPlanningParameters = typeof mrpPlanningParameters.$inferSelect;
export type InsertMrpPlanningParameters = z.infer<typeof insertMrpPlanningParametersSchema>;

// MPS types moved to MRP section above

export const insertSalesForecastSchema = createInsertSchema(salesForecasts, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertSalesForecast = z.infer<typeof insertSalesForecastSchema>;
export type SalesForecast = typeof salesForecasts.$inferSelect;

export const insertAvailableToPromiseSchema = createInsertSchema(availableToPromise, { 
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});
export type InsertAvailableToPromise = z.infer<typeof insertAvailableToPromiseSchema>;
export type AvailableToPromise = typeof availableToPromise.$inferSelect;

// Smart KPI Insert Schemas
export const insertSmartKpiMeetingSchema = createInsertSchema(smartKpiMeetings, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSmartKpiDefinitionSchema = createInsertSchema(smartKpiDefinitions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSmartKpiTargetSchema = createInsertSchema(smartKpiTargets, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSmartKpiActualSchema = createInsertSchema(smartKpiActuals, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSmartKpiImprovementSchema = createInsertSchema(smartKpiImprovements, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertSmartKpiAlertSchema = createInsertSchema(smartKpiAlerts, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

// Smart KPI Types
export type SmartKpiMeeting = typeof smartKpiMeetings.$inferSelect;
export type InsertSmartKpiMeeting = z.infer<typeof insertSmartKpiMeetingSchema>;

export type SmartKpiDefinition = typeof smartKpiDefinitions.$inferSelect;
export type InsertSmartKpiDefinition = z.infer<typeof insertSmartKpiDefinitionSchema>;

export type SmartKpiTarget = typeof smartKpiTargets.$inferSelect;
export type InsertSmartKpiTarget = z.infer<typeof insertSmartKpiTargetSchema>;

export type SmartKpiActual = typeof smartKpiActuals.$inferSelect;
export type InsertSmartKpiActual = z.infer<typeof insertSmartKpiActualSchema>;

export type SmartKpiImprovement = typeof smartKpiImprovements.$inferSelect;
export type InsertSmartKpiImprovement = z.infer<typeof insertSmartKpiImprovementSchema>;

export type SmartKpiAlert = typeof smartKpiAlerts.$inferSelect;
export type InsertSmartKpiAlert = z.infer<typeof insertSmartKpiAlertSchema>;





// Collaborative Demand Management Tables
export const demandChangeRequests = pgTable("demand_change_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(), // e.g., "DCR-2025-001"
  title: text("title").notNull(),
  description: text("description"),
  requestType: text("request_type").notNull(), // demand_increase, demand_decrease, new_product, product_discontinuation, schedule_change
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, under_review, approved, rejected, implemented
  urgency: text("urgency").notNull().default("normal"), // normal, urgent, critical
  
  // Who is involved
  requestedBy: integer("requested_by").references(() => users.id).notNull(), // User who created the request
  assignedTo: integer("assigned_to").references(() => users.id), // Planner/Scheduler assigned to review
  approvedBy: integer("approved_by").references(() => users.id), // Who approved the change
  
  // What products/items are affected
  affectedItems: jsonb("affected_items").$type<{
    itemId: number;
    itemName: string;
    currentDemand: number;
    proposedDemand: number;
    effectiveDate: string;
    reason: string;
  }[]>().default([]),
  
  // Timeline information
  requestedDate: timestamp("requested_date").defaultNow(),
  requiredByDate: timestamp("required_by_date"),
  reviewStartDate: timestamp("review_start_date"),
  reviewDueDate: timestamp("review_due_date"),
  approvedDate: timestamp("approved_date"),
  implementedDate: timestamp("implemented_date"),
  
  // Impact analysis
  businessImpact: jsonb("business_impact").$type<{
    revenue_impact?: number;
    customer_impact?: string;
    operational_impact?: string;
    resource_requirements?: string;
  }>(),
  
  // Supporting information
  justification: text("justification"),
  attachments: jsonb("attachments").$type<{
    filename: string;
    fileType: string;
    uploadedBy: number;
    uploadedAt: string;
  }[]>().default([]),
  
  // Review and approval workflow
  reviewNotes: text("review_notes"),
  approvalNotes: text("approval_notes"),
  implementationNotes: text("implementation_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const demandChangeComments = pgTable("demand_change_comments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => demandChangeRequests.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  commentType: text("comment_type").notNull().default("comment"), // comment, status_change, approval, rejection
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // Internal comments vs customer-facing
  attachments: jsonb("attachments").$type<{
    filename: string;
    fileType: string;
    size: number;
  }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const demandChangeApprovals = pgTable("demand_change_approvals", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => demandChangeRequests.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // planner, scheduler, manager, customer
  status: text("status").notNull(), // pending, approved, rejected, delegated
  decision: text("decision"), // Approval or rejection reason
  decidedAt: timestamp("decided_at"),
  delegatedTo: integer("delegated_to").references(() => users.id),
  isRequired: boolean("is_required").default(true),
  orderSequence: integer("order_sequence").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const demandCollaborationSessions = pgTable("demand_collaboration_sessions", {
  id: serial("id").primaryKey(),
  sessionName: text("session_name").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(), // planning_meeting, review_session, crisis_response, forecast_review
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed, cancelled
  
  // Participants
  organizer: integer("organizer").references(() => users.id).notNull(),
  participants: jsonb("participants").$type<{
    userId: number;
    role: string; // planner, scheduler, manager, analyst
    joinedAt?: string;
    status: string; // invited, accepted, declined, attended
  }[]>().default([]),
  
  // Session details
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  
  // Related changes and topics
  relatedRequests: jsonb("related_requests").$type<number[]>().default([]), // Array of demand change request IDs
  agenda: jsonb("agenda").$type<{
    item: string;
    estimatedDuration: number;
    presenter: number;
    status: string; // pending, in_progress, completed, skipped
  }[]>().default([]),
  
  // Outcomes
  decisions: jsonb("decisions").$type<{
    decision: string;
    rationale: string;
    assignedTo?: number;
    dueDate?: string;
    status: string; // pending, in_progress, completed
  }[]>().default([]),
  
  meetingNotes: text("meeting_notes"),
  actionItems: jsonb("action_items").$type<{
    action: string;
    assignedTo: number;
    dueDate: string;
    priority: string;
    status: string; // pending, in_progress, completed, overdue
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for demand management tables
export const demandChangeRequestsRelations = relations(demandChangeRequests, ({ one, many }) => ({
  requestedByUser: one(users, {
    fields: [demandChangeRequests.requestedBy],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [demandChangeRequests.assignedTo],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [demandChangeRequests.approvedBy],
    references: [users.id],
  }),
  comments: many(demandChangeComments),
  approvals: many(demandChangeApprovals),
}));

export const demandChangeCommentsRelations = relations(demandChangeComments, ({ one }) => ({
  request: one(demandChangeRequests, {
    fields: [demandChangeComments.requestId],
    references: [demandChangeRequests.id],
  }),
  user: one(users, {
    fields: [demandChangeComments.userId],
    references: [users.id],
  }),
}));

export const demandChangeApprovalsRelations = relations(demandChangeApprovals, ({ one }) => ({
  request: one(demandChangeRequests, {
    fields: [demandChangeApprovals.requestId],
    references: [demandChangeRequests.id],
  }),
  user: one(users, {
    fields: [demandChangeApprovals.userId],
    references: [users.id],
  }),
  delegatedToUser: one(users, {
    fields: [demandChangeApprovals.delegatedTo],
    references: [users.id],
  }),
}));

export const demandCollaborationSessionsRelations = relations(demandCollaborationSessions, ({ one }) => ({
  organizerUser: one(users, {
    fields: [demandCollaborationSessions.organizer],
    references: [users.id],
  }),
}));

// Insert schemas for demand management tables
export const insertDemandChangeRequestSchema = createInsertSchema(demandChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemandChangeCommentSchema = createInsertSchema(demandChangeComments).omit({
  id: true,
  createdAt: true,
});

export const insertDemandChangeApprovalSchema = createInsertSchema(demandChangeApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertDemandCollaborationSessionSchema = createInsertSchema(demandCollaborationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Algorithm Version Control Insert Schemas
export const insertAlgorithmVersionSchema = createInsertSchema(algorithmVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlantAlgorithmDeploymentSchema = createInsertSchema(plantAlgorithmDeployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlgorithmApprovalWorkflowSchema = createInsertSchema(algorithmApprovalWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlgorithmUsageLogSchema = createInsertSchema(algorithmUsageLogs).omit({
  id: true,
  createdAt: true,
});

// Algorithm Version Control Types
export type AlgorithmVersion = typeof algorithmVersions.$inferSelect;
export type InsertAlgorithmVersion = z.infer<typeof insertAlgorithmVersionSchema>;

export type PlantAlgorithmDeployment = typeof plantAlgorithmDeployments.$inferSelect;
export type InsertPlantAlgorithmDeployment = z.infer<typeof insertPlantAlgorithmDeploymentSchema>;

export type AlgorithmApprovalWorkflow = typeof algorithmApprovalWorkflows.$inferSelect;
export type InsertAlgorithmApprovalWorkflow = z.infer<typeof insertAlgorithmApprovalWorkflowSchema>;

export type AlgorithmUsageLog = typeof algorithmUsageLogs.$inferSelect;
export type InsertAlgorithmUsageLog = z.infer<typeof insertAlgorithmUsageLogSchema>;

// Types for demand management
export type DemandChangeRequest = typeof demandChangeRequests.$inferSelect;
export type InsertDemandChangeRequest = z.infer<typeof insertDemandChangeRequestSchema>;

export type DemandChangeComment = typeof demandChangeComments.$inferSelect;
export type InsertDemandChangeComment = z.infer<typeof insertDemandChangeCommentSchema>;

export type DemandChangeApproval = typeof demandChangeApprovals.$inferSelect;
export type InsertDemandChangeApproval = z.infer<typeof insertDemandChangeApprovalSchema>;

export type DemandCollaborationSession = typeof demandCollaborationSessions.$inferSelect;
export type InsertDemandCollaborationSession = z.infer<typeof insertDemandCollaborationSessionSchema>;

// ========================================
// Commenting and Discussion System Tables
// ========================================

// Comments - Core commenting functionality with threading support
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  
  // Context - what this comment is attached to
  entityType: text("entity_type").notNull(), // 'resource', 'job', 'production_order', 'operation', 'plant', 'schedule', 'mps', etc.
  entityId: integer("entity_id").notNull(), // ID of the entity being commented on
  contextArea: text("context_area"), // Optional: 'production_scheduling', 'master_production_schedule', 'quality', 'maintenance', etc.
  
  // Comment content
  content: text("content").notNull(), // The actual comment text (supports markdown)
  plainTextContent: text("plain_text_content"), // Plain text version for search/notifications
  
  // Threading support
  parentCommentId: integer("parent_comment_id"), // References comments.id for replies
  threadRootId: integer("thread_root_id"), // References the top-level comment in a thread
  threadDepth: integer("thread_depth").default(0), // 0 for root, 1 for direct reply, etc.
  
  // Author and metadata
  authorId: integer("author_id").notNull(), // References users.id
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  editHistory: jsonb("edit_history").$type<Array<{
    content: string;
    editedAt: string;
    editedBy: number;
  }>>().default([]),
  
  // Status and visibility
  status: text("status").notNull().default("active"), // 'active', 'resolved', 'deleted', 'archived'
  isPinned: boolean("is_pinned").default(false),
  isPrivate: boolean("is_private").default(false), // Private comments only visible to certain users
  visibility: text("visibility").default("all"), // 'all', 'team', 'department', 'mentioned_only'
  
  // Rich features
  metadata: jsonb("metadata").$type<{
    attachmentCount?: number;
    mentionCount?: number;
    reactionCount?: number;
    taskStatus?: string; // If comment creates a task
    priority?: string;
    dueDate?: string;
    assignedTo?: number[];
    labels?: string[];
    linkedEntities?: Array<{ type: string; id: number; name: string }>;
  }>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
}, (table) => ({
  entityIdx: index().on(table.entityType, table.entityId),
  authorIdx: index().on(table.authorId),
  parentIdx: index().on(table.parentCommentId),
  threadIdx: index().on(table.threadRootId),
  statusIdx: index().on(table.status),
  createdAtIdx: index().on(table.createdAt),
}));

// Comment Mentions - Track user mentions (@username) in comments
export const commentMentions = pgTable("comment_mentions", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  mentionedUserId: integer("mentioned_user_id").notNull(), // References users.id
  mentionedByUserId: integer("mentioned_by_user_id").notNull(), // References users.id
  
  // Mention context
  mentionType: text("mention_type").notNull().default("direct"), // 'direct' (@user), 'team' (@team), 'everyone' (@everyone)
  mentionText: text("mention_text"), // The actual @mention text used
  position: integer("position"), // Character position in the comment where mention appears
  
  // Status tracking
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  commentUserIdx: unique().on(table.commentId, table.mentionedUserId),
  mentionedUserIdx: index().on(table.mentionedUserId),
  acknowledgedIdx: index().on(table.isAcknowledged),
}));

// Notifications - Inbox for users (mentions, replies, assignments, etc.)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  
  // Recipient
  userId: integer("user_id").notNull(), // References users.id
  
  // Notification type and source
  type: text("type").notNull(), // 'mention', 'reply', 'assignment', 'status_change', 'comment_on_watched', 'task_due', etc.
  category: text("category").notNull().default("comment"), // 'comment', 'task', 'system', 'alert'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  
  // Reference to source
  sourceType: text("source_type"), // 'comment', 'task', 'alert', etc.
  sourceId: integer("source_id"), // ID of the source entity
  
  // Related entities
  relatedEntityType: text("related_entity_type"), // 'resource', 'job', 'production_order', etc.
  relatedEntityId: integer("related_entity_id"),
  relatedEntityName: text("related_entity_name"), // Cached name for display
  
  // Notification content
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // URL to navigate to when clicked
  iconType: text("icon_type"), // Icon to display
  
  // Additional data
  metadata: jsonb("metadata").$type<{
    commentSnippet?: string;
    authorName?: string;
    authorAvatar?: string;
    contextInfo?: any;
    actionButtons?: Array<{ label: string; action: string; data: any }>;
  }>().default({}),
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  
  // Delivery preferences
  emailSent: boolean("email_sent").default(false),
  pushSent: boolean("push_sent").default(false),
  inAppShown: boolean("in_app_shown").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for notifications
}, (table) => ({
  userIdx: index().on(table.userId, table.isRead, table.isArchived),
  typeIdx: index().on(table.type),
  createdAtIdx: index().on(table.createdAt),
  sourceIdx: index().on(table.sourceType, table.sourceId),
}));

// Comment Attachments - Files attached to comments
export const commentAttachments = pgTable("comment_attachments", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  
  // File information
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // Size in bytes
  fileUrl: text("file_url").notNull(), // URL or path to file
  thumbnailUrl: text("thumbnail_url"), // For images/videos
  
  // File metadata
  uploadedBy: integer("uploaded_by").notNull(), // References users.id
  description: text("description"),
  
  // File processing status
  status: text("status").notNull().default("uploaded"), // 'uploading', 'uploaded', 'processing', 'failed'
  processingError: text("processing_error"),
  
  // Timestamps
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (table) => ({
  commentIdx: index().on(table.commentId),
}));

// Comment Reactions - Likes, emojis, etc. on comments
export const commentReactions = pgTable("comment_reactions", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").notNull(), // References users.id
  
  // Reaction type
  reactionType: text("reaction_type").notNull(), // 'like', 'heart', 'thumbs_up', 'celebrate', 'thinking', etc.
  reactionEmoji: text("reaction_emoji"), // The actual emoji character
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserReaction: unique().on(table.commentId, table.userId, table.reactionType),
  commentIdx: index().on(table.commentId),
  userIdx: index().on(table.userId),
}));

// Comment Watchers - Users watching a thread for updates
export const commentWatchers = pgTable("comment_watchers", {
  id: serial("id").primaryKey(),
  
  // What to watch
  watchType: text("watch_type").notNull(), // 'comment', 'thread', 'entity'
  watchId: integer("watch_id").notNull(), // ID of comment, thread, or entity
  entityType: text("entity_type"), // For entity watching
  
  // Watcher
  userId: integer("user_id").notNull(), // References users.id
  
  // Notification preferences
  notifyOnReply: boolean("notify_on_reply").default(true),
  notifyOnMention: boolean("notify_on_mention").default(true),
  notifyOnStatusChange: boolean("notify_on_status_change").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueWatcher: unique().on(table.watchType, table.watchId, table.userId),
  userIdx: index().on(table.userId),
}));

// ========================================
// Insert Schemas for Commenting System
// ========================================

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentMentionSchema = createInsertSchema(commentMentions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCommentAttachmentSchema = createInsertSchema(commentAttachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertCommentReactionSchema = createInsertSchema(commentReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCommentWatcherSchema = createInsertSchema(commentWatchers).omit({
  id: true,
  createdAt: true,
});

// ========================================
// Types for Commenting System
// ========================================

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CommentMention = typeof commentMentions.$inferSelect;
export type InsertCommentMention = z.infer<typeof insertCommentMentionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type CommentAttachment = typeof commentAttachments.$inferSelect;
export type InsertCommentAttachment = z.infer<typeof insertCommentAttachmentSchema>;

export type CommentReaction = typeof commentReactions.$inferSelect;
export type InsertCommentReaction = z.infer<typeof insertCommentReactionSchema>;

export type CommentWatcher = typeof commentWatchers.$inferSelect;
export type InsertCommentWatcher = z.infer<typeof insertCommentWatcherSchema>;

// ========================================
// PT Publish Tables - External Data from PlanetTogether
// ========================================

// PT Publish Jobs - Manufacturing orders from PlanetTogether
export const ptJobs = pgTable("ptjobs", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 255 }).notNull(),
  jobId: integer("job_id").notNull(),
  customers: text("customers"),
  customerEmail: text("customer_email"),
  agentEmail: text("agent_email"),
  entryDate: timestamp("entry_date"),
  needDateTime: timestamp("need_date_time"),
  scheduledStartDateTime: timestamp("scheduled_start_date_time"),
  scheduledEndDateTime: timestamp("scheduled_end_date_time"),
  holdUntil: timestamp("hold_until"),
  earliestDelivery: timestamp("earliest_delivery"),
  classification: text("classification"),
  type: text("type"),
  priority: integer("priority"),
  importance: integer("importance"),
  hot: boolean("hot").default(false),
  hotReason: text("hot_reason"),
  scheduled: boolean("scheduled").default(false),
  scheduledStatus: text("scheduled_status"),
  finished: boolean("finished").default(false),
  started: boolean("started").default(false),
  percentFinished: integer("percent_finished").default(0),
  cancelled: boolean("cancelled").default(false),
  onHold: text("on_hold"),
  onHoldReason: text("on_hold_reason"),
  hold: boolean("hold").default(false),
  holdReason: text("hold_reason"),
  name: text("name"),
  orderNumber: text("order_number"),
  externalId: text("external_id"),
  description: text("description"),
  notes: text("notes"),
  product: text("product"),
  productDescription: text("product_description"),
  qty: numeric("qty", { precision: 15, scale: 5 }),
  revenue: numeric("revenue", { precision: 15, scale: 2 }),
  profit: numeric("profit", { precision: 15, scale: 2 }),
  latePenaltyCost: numeric("late_penalty_cost", { precision: 15, scale: 2 }),
  expectedLatePenaltyCost: numeric("expected_late_penalty_cost", { precision: 15, scale: 2 }),
  laborCost: numeric("labor_cost", { precision: 15, scale: 2 }),
  machineCost: numeric("machine_cost", { precision: 15, scale: 2 }),
  materialCost: numeric("material_cost", { precision: 15, scale: 2 }),
  shippingCost: numeric("shipping_cost", { precision: 15, scale: 2 }),
  subcontractCost: numeric("subcontract_cost", { precision: 15, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 15, scale: 2 }),
  throughput: numeric("throughput", { precision: 15, scale: 5 }),
  standardHours: numeric("standard_hours", { precision: 10, scale: 2 }),
  expectedRunHours: numeric("expected_run_hours", { precision: 10, scale: 2 }),
  expectedSetupHours: numeric("expected_setup_hours", { precision: 10, scale: 2 }),
  reportedRunHours: numeric("reported_run_hours", { precision: 10, scale: 2 }),
  reportedSetupHours: numeric("reported_setup_hours", { precision: 10, scale: 2 }),
  schedulingHours: numeric("scheduling_hours", { precision: 10, scale: 2 }),
  percentOfStandardHrs: integer("percent_of_standard_hrs"),
  percentOverStandardHrs: integer("percent_over_standard_hrs"),
  late: boolean("late").default(false),
  overdue: boolean("overdue").default(false),
  latenessDays: numeric("lateness_days", { precision: 10, scale: 2 }),
  overdueDays: numeric("overdue_days", { precision: 10, scale: 2 }),
  startsInDays: integer("starts_in_days"),
  maxEarlyDeliveryDays: numeric("max_early_delivery_days", { precision: 10, scale: 2 }),
  leadResource: text("lead_resource"),
  resourceNames: text("resource_names"),
  bottlenecks: text("bottlenecks"),
  canSpanPlants: boolean("can_span_plants").default(false),
  failedToScheduleReason: text("failed_to_schedule_reason"),
  locked: text("locked"),
  anchored: text("anchored"),
  doNotDelete: boolean("do_not_delete").default(false),
  doNotSchedule: boolean("do_not_schedule").default(false),
  template: boolean("template").default(false),
  colorCode: text("color_code"),
  entryMethod: text("entry_method"),
  commitmentPreserved: boolean("commitment_preserved").default(false),
  doNotDeletePreserved: boolean("do_not_delete_preserved").default(false),
  doNotSchedulePreserved: boolean("do_not_schedule_preserved").default(false),
  commitment: text("commitment"),
  enteredToday: boolean("entered_today").default(false),
  printed: boolean("printed").default(false),
  invoiced: boolean("invoiced").default(false),
  shipped: text("shipped"),
  destination: text("destination"),
  reviewed: boolean("reviewed").default(false),
  percentOfMaterialsAvailable: integer("percent_of_materials_available"),
  successorOrderNumbers: text("successor_order_numbers"),
  lowLevelCode: integer("low_level_code"),
});

// PT Publish Resources - Resources from PlanetTogether
export const ptResources = pgTable("ptresources", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 255 }).notNull(),
  plantId: integer("plant_id").notNull(),
  departmentId: integer("department_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  bottleneck: boolean("bottleneck").default(false),
  bufferHours: numeric("buffer_hours", { precision: 10, scale: 2 }),
  capacityType: text("capacity_type"),
  drum: boolean("drum").default(false),
  overtimeHourlyCost: numeric("overtime_hourly_cost", { precision: 15, scale: 2 }),
  standardHourlyCost: numeric("standard_hourly_cost", { precision: 15, scale: 2 }),
  experimentalDispatcherOne: integer("experimental_dispatcher_one"),
  experimentalDispatcherTwo: integer("experimental_dispatcher_two"),
  experimentalDispatcherThree: integer("experimental_dispatcher_three"),
  experimentalDispatcherFour: integer("experimental_dispatcher_four"),
  normalDispatcher: integer("normal_dispatcher"),
  workcenter: text("workcenter"),
  canOffload: boolean("can_offload").default(false),
  canPreemptMaterials: boolean("can_preempt_materials").default(false),
  canPreemptPredecessors: boolean("can_preempt_predecessors").default(false),
  canWorkOvertime: boolean("can_work_overtime").default(false),
  cycleEfficiencyMultiplier: numeric("cycle_efficiency_multiplier", { precision: 5, scale: 2 }),
  headStartHours: numeric("head_start_hours", { precision: 10, scale: 2 }),
  postActivityRestHours: numeric("post_activity_rest_hours", { precision: 10, scale: 2 }),
  stage: integer("stage"),
  transferHours: numeric("transfer_hours", { precision: 10, scale: 2 }),
  consecutiveSetupTimes: boolean("consecutive_setup_times").default(false),
  activitySetupEfficiencyMultiplier: numeric("activity_setup_efficiency_multiplier", { precision: 5, scale: 2 }),
  changeoverSetupEfficiencyMultiplier: numeric("changeover_setup_efficiency_multiplier", { precision: 5, scale: 2 }),
  setupIncluded: text("setup_included"),
  setupHours: numeric("setup_hours", { precision: 10, scale: 2 }),
  useOperationSetupTime: boolean("use_operation_setup_time").default(false),
  active: boolean("active").default(true),
  sameCell: boolean("same_cell").default(false),
  resourceType: text("resource_type"),
  externalId: text("external_id"),
  alwaysShowPostProcessing: boolean("always_show_post_processing").default(false),
  attributeCodeTableName: text("attribute_code_table_name"),
  bottleneckPercent: numeric("bottleneck_percent", { precision: 5, scale: 2 }),
  bufferHrs: numeric("buffer_hrs", { precision: 10, scale: 2 }),
  cellName: text("cell_name"),
  disallowDragAndDrops: boolean("disallow_drag_and_drops").default(false),
  excludeFromGantts: boolean("exclude_from_gantts").default(false),
  experimentalOptimizeRule: text("experimental_optimize_rule"),
  experimentalOptimizeRuleTwo: text("experimental_optimize_rule_two"),
  experimentalOptimizeRuleThree: text("experimental_optimize_rule_three"),
  experimentalOptimizeRuleFour: text("experimental_optimize_rule_four"),
  ganttRowHeightFactor: integer("gantt_row_height_factor"),
  headStartDays: numeric("head_start_days", { precision: 10, scale: 2 }),
  imageFileName: text("image_file_name"),
  maxQty: numeric("max_qty", { precision: 15, scale: 5 }),
  maxQtyPerCycle: numeric("max_qty_per_cycle", { precision: 15, scale: 5 }),
  minQty: numeric("min_qty", { precision: 15, scale: 5 }),
  minQtyPerCycle: numeric("min_qty_per_cycle", { precision: 15, scale: 5 }),
  nbrCapabilities: integer("nbr_capabilities"),
  normalOptimizeRule: text("normal_optimize_rule"),
  overlappingOnlineIntervals: integer("overlapping_online_intervals"),
  sequential: boolean("sequential").default(false),
  setupHrs: numeric("setup_hrs", { precision: 10, scale: 2 }),
  shopViewUsersCount: integer("shop_view_users_count"),
  transferHrs: numeric("transfer_hrs", { precision: 10, scale: 2 }),
  workcenterExternalId: text("workcenter_external_id"),
  maxCumulativeQty: numeric("max_cumulative_qty", { precision: 15, scale: 5 }),
  manualAssignmentOnly: boolean("manual_assignment_only").default(false),
  isTank: boolean("is_tank").default(false),
  minNbrOfPeople: numeric("min_nbr_of_people", { precision: 5, scale: 2 }),
  batchType: text("batch_type"),
  batchVolume: numeric("batch_volume", { precision: 15, scale: 5 }),
  autoJoinHrs: numeric("auto_join_hrs", { precision: 10, scale: 2 }),
  omitSetupOnFirstActivity: boolean("omit_setup_on_first_activity").default(false),
  omitSetupOnFirstActivityInShift: boolean("omit_setup_on_first_activity_in_shift").default(false),
  minVolume: numeric("min_volume", { precision: 15, scale: 5 }),
  maxVolume: numeric("max_volume", { precision: 15, scale: 5 }),
  standardCleanHours: numeric("standard_clean_hours", { precision: 10, scale: 2 }),
  standardCleanoutGrade: integer("standard_cleanout_grade"),
  useOperationCleanout: boolean("use_operation_cleanout").default(false),
  useAttributeCleanouts: boolean("use_attribute_cleanouts").default(false),
  operationCountCleanoutTriggerTableName: text("operation_count_cleanout_trigger_table_name"),
  productionUnitCleanoutTriggerTableName: text("production_unit_cleanout_trigger_table_name"),
  timeCleanoutTriggerTableName: text("time_cleanout_trigger_table_name"),
  priority: integer("priority"),
  maxSameSetupHours: numeric("max_same_setup_hours", { precision: 10, scale: 2 }),
  maxSameSetupHrs: numeric("max_same_setup_hrs", { precision: 10, scale: 2 }),
  setupCodeTableName: text("setup_code_table_name"),
});





// Insert schemas for PT Publish tables
export const insertPtJobSchema = createInsertSchema(ptJobs).omit({
  id: true,
});

export const insertPtResourceSchema = createInsertSchema(ptResources).omit({
  id: true,
});

export const insertPtJobOperationSchema = createInsertSchema(ptJobOperations).omit({
  id: true,
});

export const insertPtCapabilitySchema = createInsertSchema(ptCapabilities).omit({
  id: true,
});

export const insertPtMetricSchema = createInsertSchema(ptMetrics).omit({
  id: true,
  calculatedAt: true,
});

export const insertPtManufacturingOrderSchema = createInsertSchema(ptManufacturingOrders).omit({
  id: true,
});

// Types for PT Publish tables
export type PtJob = typeof ptJobs.$inferSelect;
export type InsertPtPublishJob = z.infer<typeof insertPtPublishJobSchema>;

export type PtResource = typeof ptResources.$inferSelect;
export type InsertPtPublishResource = z.infer<typeof insertPtPublishResourceSchema>;

export type PtJobOperation = typeof ptJobOperations.$inferSelect;
export type InsertPtPublishJobOperation = z.infer<typeof insertPtPublishJobOperationSchema>;

export type PtCapability = typeof ptCapabilities.$inferSelect;
export type InsertPtPublishCapability = z.infer<typeof insertPtPublishCapabilitySchema>;

export type PtMetric = typeof ptMetrics.$inferSelect;
export type InsertPtPublishMetric = z.infer<typeof insertPtPublishMetricSchema>;

export type PtManufacturingOrder = typeof ptManufacturingOrders.$inferSelect;
export type InsertPtPublishManufacturingOrder = z.infer<typeof insertPtPublishManufacturingOrderSchema>;

// Max AI Chat Messages - Store persistent chat history
export const maxChatMessages = pgTable("max_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  source: text("source").default("panel"), // 'header' or 'panel'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaxChatMessageSchema = createInsertSchema(maxChatMessages).omit({
  id: true,
  createdAt: true,
});

export type MaxChatMessage = typeof maxChatMessages.$inferSelect;
export type InsertMaxChatMessage = z.infer<typeof insertMaxChatMessageSchema>;

// Create unified Operation type that combines different operation types
export type Operation = {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  duration: number;
  startTime?: Date | null;
  endTime?: Date | null;
  order: number;
};

// Helper function to convert different operation types to unified Operation type
export const toUnifiedOperation = (op: any, type: 'discrete' | 'process' | 'recipe' | 'routing'): Operation => {
  switch (type) {
    case 'discrete':
      return {
        id: op.id,
        name: op.operationName || op.name || `Operation ${op.id}`,
        description: op.description,
        status: op.status,
        duration: op.standardDuration || op.actualDuration || 0,
        startTime: op.startTime,
        endTime: op.endTime,
        order: op.sequenceNumber || 0
      };
    case 'process':
      return {
        id: op.id,
        name: op.operationName || op.name || `Operation ${op.id}`,
        description: op.description,
        status: op.status,
        duration: op.standardDuration || op.actualDuration || 0,
        startTime: op.startTime,
        endTime: op.endTime,
        order: op.sequenceNumber || 0
      };
    case 'recipe':
      return {
        id: op.id,
        name: op.operationName || op.name || `Operation ${op.id}`,
        description: op.description,
        status: 'planned', // Default status for recipe operations
        duration: op.processingTime || 0,
        startTime: null,
        endTime: null,
        order: parseInt(op.operationNumber || '0') || 0
      };
    case 'routing':
      return {
        id: op.id,
        name: op.operationName || op.name || `Operation ${op.id}`,
        description: op.description,
        status: 'planned', // Default status for routing operations
        duration: op.standardRunTime || 0,
        startTime: null,
        endTime: null,
        order: op.sequenceNumber || 0
      };
    default:
      return {
        id: op.id,
        name: op.name || `Operation ${op.id}`,
        description: op.description,
        status: op.status || 'planned',
        duration: op.duration || 0,
        startTime: op.startTime || null,
        endTime: op.endTime || null,
        order: op.order || 0
      };
  }
};

// Export individual operation types for reference
export type RecipeOperation = typeof recipeOperations.$inferSelect;
export type RoutingOperation = typeof routingOperations.$inferSelect;

// Export schedule schemas
export * from './schedule-schema';

// ==================== Intelligent Contextual Hint Bubbles ====================

// Hint configurations table
export const hintConfigurations = pgTable('hint_configurations', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('info'), // info, tip, warning, tutorial
  target: varchar('target', { length: 200 }), // CSS selector for target element
  page: varchar('page', { length: 100 }), // Page URL pattern
  position: varchar('position', { length: 20 }).default('auto'), // top, bottom, left, right, auto, center
  trigger: varchar('trigger', { length: 20 }).default('auto'), // hover, click, auto, manual
  delay: integer('delay').default(0), // Delay in milliseconds before showing
  sequence: integer('sequence'), // Order in a tutorial sequence
  sequenceGroup: varchar('sequence_group', { length: 50 }), // Group for tutorial sequences
  prerequisites: text('prerequisites'), // JSON array of prerequisite hint keys
  conditions: text('conditions'), // JSON conditions for showing hint
  priority: integer('priority').default(0), // Higher priority hints show first
  isActive: boolean('is_active').default(true),
  isDismissible: boolean('is_dismissible').default(true),
  showOnce: boolean('show_once').default(false),
  expiresAt: timestamp('expires_at'),
  metadata: text('metadata'), // JSON for additional configuration
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// User hint interactions table
export const userHintInteractions = pgTable('user_hint_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  hintId: integer('hint_id').notNull().references(() => hintConfigurations.id),
  status: varchar('status', { length: 20 }).notNull().default('unseen'), // unseen, seen, dismissed, completed
  seenAt: timestamp('seen_at'),
  dismissedAt: timestamp('dismissed_at'),
  completedAt: timestamp('completed_at'),
  interactionCount: integer('interaction_count').default(0),
  lastInteractionAt: timestamp('last_interaction_at'),
  metadata: text('metadata'), // JSON for tracking additional interaction data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    userHintIdx: index('user_hint_idx').on(table.userId, table.hintId),
    statusIdx: index('hint_status_idx').on(table.status)
  };
});

// Hint sequences table for managing tutorial flows
export const hintSequences = pgTable('hint_sequences', {
  id: serial('id').primaryKey(),
  groupName: varchar('group_name', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  hintIds: text('hint_ids').notNull(), // JSON array of hint IDs in order
  totalSteps: integer('total_steps').notNull(),
  requiredCompletion: boolean('required_completion').default(false),
  metadata: text('metadata'), // JSON for additional sequence configuration
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Insert schemas for hints
export const insertHintConfigurationSchema = createInsertSchema(hintConfigurations);
export const insertUserHintInteractionSchema = createInsertSchema(userHintInteractions);
export const insertHintSequenceSchema = createInsertSchema(hintSequences);

// Types for hints
export type HintConfiguration = typeof hintConfigurations.$inferSelect;
export type InsertHintConfiguration = z.infer<typeof insertHintConfigurationSchema>;
export type UserHintInteraction = typeof userHintInteractions.$inferSelect;
export type InsertUserHintInteraction = z.infer<typeof insertUserHintInteractionSchema>;
export type HintSequence = typeof hintSequences.$inferSelect;
export type InsertHintSequence = z.infer<typeof insertHintSequenceSchema>;

// ==================== Labor Planning & Workforce Optimization ====================

// Employee Skills - Track what skills each employee has
export const employeeSkills = pgTable('employee_skills', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  skillCategory: varchar('skill_category', { length: 50 }).notNull(), // machining, assembly, quality, maintenance, material_handling
  proficiencyLevel: varchar('proficiency_level', { length: 20 }).notNull().default('basic'), // basic, intermediate, advanced, expert
  certificationDate: timestamp('certification_date'),
  expirationDate: timestamp('expiration_date'),
  isCurrent: boolean('is_current').default(true),
  trainingHours: integer('training_hours').default(0),
  lastAssessmentDate: timestamp('last_assessment_date'),
  assessmentScore: numeric('assessment_score', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userSkillIdx: index('employee_skills_user_idx').on(table.userId),
  skillCategoryIdx: index('employee_skills_category_idx').on(table.skillCategory),
  currentSkillsIdx: index('employee_skills_current_idx').on(table.isCurrent)
}));

// Labor Shift Templates - Define standard shift patterns for labor planning
export const laborShiftTemplates = pgTable('labor_shift_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(), // SHIFT-1, SHIFT-2, SHIFT-3
  plantId: integer('plant_id').references(() => ptPlants.id),
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:MM format (e.g., "07:00")
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:MM format (e.g., "15:00")
  durationHours: numeric('duration_hours', { precision: 4, scale: 2 }).notNull(),
  breakMinutes: integer('break_minutes').default(0),
  lunchMinutes: integer('lunch_minutes').default(0),
  netWorkHours: numeric('net_work_hours', { precision: 4, scale: 2 }).notNull(),
  daysOfWeek: jsonb('days_of_week').$type<boolean[]>().notNull(), // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  shiftType: varchar('shift_type', { length: 20 }).notNull().default('regular'), // regular, overtime, weekend, holiday
  minimumStaff: integer('minimum_staff').notNull().default(1),
  maximumStaff: integer('maximum_staff'),
  requiredSkills: jsonb('required_skills').$type<{
    skillCategory: string;
    minimumLevel: string;
    requiredCount: number;
  }[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  plantShiftIdx: index('shift_templates_plant_idx').on(table.plantId),
  activeShiftsIdx: index('shift_templates_active_idx').on(table.isActive)
}));

// Shift Assignments - Assign employees to specific shifts
export const shiftAssignments = pgTable('shift_assignments', {
  id: serial('id').primaryKey(),
  shiftTemplateId: integer('shift_template_id').references(() => laborShiftTemplates.id),
  userId: integer('user_id').notNull().references(() => users.id),
  assignedDate: timestamp('assigned_date').notNull(),
  startDateTime: timestamp('start_date_time').notNull(),
  endDateTime: timestamp('end_date_time').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled, confirmed, in_progress, completed, absent, cancelled
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  overtimeHours: numeric('overtime_hours', { precision: 4, scale: 2 }).default('0'),
  assignedResourceId: integer('assigned_resource_id').references(() => resources.id),
  assignedWorkCenter: varchar('assigned_work_center', { length: 100 }),
  productionAreaId: integer('production_area_id'),
  role: varchar('role', { length: 50 }), // operator, supervisor, quality_inspector, material_handler
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  modifiedBy: integer('modified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userDateIdx: index('shift_assignments_user_date_idx').on(table.userId, table.assignedDate),
  statusIdx: index('shift_assignments_status_idx').on(table.status),
  dateIdx: index('shift_assignments_date_idx').on(table.assignedDate),
  resourceIdx: index('shift_assignments_resource_idx').on(table.assignedResourceId)
}));

// Labor Capacity Requirements - Track how much labor capacity is needed
export const laborCapacityRequirements = pgTable('labor_capacity_requirements', {
  id: serial('id').primaryKey(),
  plantId: integer('plant_id').references(() => ptPlants.id),
  productionOrderId: integer('production_order_id').references(() => productionOrders.id),
  resourceId: integer('resource_id').references(() => resources.id),
  workCenter: varchar('work_center', { length: 100 }),
  requiredDate: timestamp('required_date').notNull(),
  shiftTemplateId: integer('shift_template_id').references(() => laborShiftTemplates.id),
  requiredHeadcount: integer('required_headcount').notNull(),
  requiredHours: numeric('required_hours', { precision: 8, scale: 2 }).notNull(),
  requiredSkills: jsonb('required_skills').$type<{
    skillName: string;
    skillCategory: string;
    minimumLevel: string;
    requiredCount: number;
  }[]>().notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'), // low, normal, high, critical
  capacityType: varchar('capacity_type', { length: 20 }).notNull().default('production'), // production, setup, maintenance, quality
  assignedHeadcount: integer('assigned_headcount').default(0),
  assignedHours: numeric('assigned_hours', { precision: 8, scale: 2 }).default('0'),
  gapHeadcount: integer('gap_headcount').default(0),
  gapHours: numeric('gap_hours', { precision: 8, scale: 2 }).default('0'),
  fulfillmentStatus: varchar('fulfillment_status', { length: 20 }).notNull().default('unfulfilled'), // unfulfilled, partial, fulfilled, overstaffed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  dateIdx: index('labor_capacity_date_idx').on(table.requiredDate),
  plantIdx: index('labor_capacity_plant_idx').on(table.plantId),
  orderIdx: index('labor_capacity_order_idx').on(table.productionOrderId),
  statusIdx: index('labor_capacity_status_idx').on(table.fulfillmentStatus)
}));

// Employee Availability - Track when employees are available
export const employeeAvailability = pgTable('employee_availability', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  availableDate: timestamp('available_date').notNull(),
  shiftTemplateId: integer('shift_template_id').references(() => laborShiftTemplates.id),
  availabilityType: varchar('availability_type', { length: 20 }).notNull().default('available'), // available, unavailable, partial, on_leave, training
  startTime: varchar('start_time', { length: 5 }), // HH:MM format, null means all day
  endTime: varchar('end_time', { length: 5 }), // HH:MM format
  maxHours: numeric('max_hours', { precision: 4, scale: 2 }),
  preferredHours: numeric('preferred_hours', { precision: 4, scale: 2 }),
  reason: varchar('reason', { length: 100 }), // vacation, sick, training, personal, etc.
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: jsonb('recurring_pattern').$type<{
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: boolean[];
    endDate?: string;
  }>(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userDateIdx: index('employee_availability_user_date_idx').on(table.userId, table.availableDate),
  dateIdx: index('employee_availability_date_idx').on(table.availableDate),
  typeIdx: index('employee_availability_type_idx').on(table.availabilityType)
}));

// Employee Preferences - Store employee scheduling preferences
export const employeePreferences = pgTable('employee_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id).unique(),
  preferredShifts: jsonb('preferred_shifts').$type<number[]>().default([]), // Array of shiftTemplateIds
  maxHoursPerWeek: numeric('max_hours_per_week', { precision: 4, scale: 2 }),
  minHoursPerWeek: numeric('min_hours_per_week', { precision: 4, scale: 2 }),
  preferredDaysOff: jsonb('preferred_days_off').$type<boolean[]>().default([]), // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  availableForOvertime: boolean('available_for_overtime').default(true),
  maxOvertimeHoursPerWeek: numeric('max_overtime_hours_per_week', { precision: 4, scale: 2 }),
  preferredWorkAreas: jsonb('preferred_work_areas').$type<string[]>().default([]),
  restrictedWorkAreas: jsonb('restricted_work_areas').$type<string[]>().default([]),
  preferredTeammates: jsonb('preferred_teammates').$type<number[]>().default([]), // Array of userIds
  notificationPreferences: jsonb('notification_preferences').$type<{
    scheduleChanges: boolean;
    shiftReminders: boolean;
    overtimeRequests: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  }>().default({
    scheduleChanges: true,
    shiftReminders: true,
    overtimeRequests: true,
    emailNotifications: true,
    smsNotifications: false
  }),
  flexibilityScore: integer('flexibility_score').default(5), // 1-10 scale
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('employee_preferences_user_idx').on(table.userId)
}));

// Employee Machine Certifications - Track which machines employees can operate
export const employeeMachineCertifications = pgTable('employee_machine_certifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  resourceId: integer('resource_id').notNull().references(() => resources.id),
  certificationLevel: varchar('certification_level', { length: 20 }).notNull().default('operator'), // trainee, operator, advanced, trainer
  certificationDate: timestamp('certification_date').notNull(),
  expirationDate: timestamp('expiration_date'),
  hoursOperated: numeric('hours_operated', { precision: 8, scale: 2 }).default('0'),
  lastOperatedDate: timestamp('last_operated_date'),
  qualityScore: numeric('quality_score', { precision: 5, scale: 2 }), // 0-100 scale
  safetyScore: numeric('safety_score', { precision: 5, scale: 2 }), // 0-100 scale
  productivityScore: numeric('productivity_score', { precision: 5, scale: 2 }), // 0-100 scale
  canTrain: boolean('can_train').default(false),
  restrictions: text('restrictions'),
  notes: text('notes'),
  certifiedBy: integer('certified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userResourceIdx: unique().on(table.userId, table.resourceId),
  userIdx: index('machine_certifications_user_idx').on(table.userId),
  resourceIdx: index('machine_certifications_resource_idx').on(table.resourceId),
  levelIdx: index('machine_certifications_level_idx').on(table.certificationLevel)
}));

// Shift Capacity Gaps - Track gaps between required and available capacity
export const shiftCapacityGaps = pgTable('shift_capacity_gaps', {
  id: serial('id').primaryKey(),
  plantId: integer('plant_id').references(() => ptPlants.id),
  shiftTemplateId: integer('shift_template_id').references(() => shiftTemplates.id),
  gapDate: timestamp('gap_date').notNull(),
  workCenter: varchar('work_center', { length: 100 }),
  skillCategory: varchar('skill_category', { length: 50 }),
  requiredHeadcount: integer('required_headcount').notNull(),
  availableHeadcount: integer('available_headcount').notNull(),
  gapHeadcount: integer('gap_headcount').notNull(),
  requiredHours: numeric('required_hours', { precision: 8, scale: 2 }).notNull(),
  availableHours: numeric('available_hours', { precision: 8, scale: 2 }).notNull(),
  gapHours: numeric('gap_hours', { precision: 8, scale: 2 }).notNull(),
  gapPercentage: numeric('gap_percentage', { precision: 5, scale: 2 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('low'), // low, medium, high, critical
  mitigationActions: jsonb('mitigation_actions').$type<{
    action: string;
    status: string;
    assignedTo?: number;
    dueDate?: string;
  }[]>().default([]),
  resolutionStatus: varchar('resolution_status', { length: 20 }).notNull().default('unresolved'), // unresolved, in_progress, resolved, accepted
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  dateIdx: index('shift_capacity_gaps_date_idx').on(table.gapDate),
  plantIdx: index('shift_capacity_gaps_plant_idx').on(table.plantId),
  severityIdx: index('shift_capacity_gaps_severity_idx').on(table.severity),
  statusIdx: index('shift_capacity_gaps_status_idx').on(table.resolutionStatus)
}));

// Labor Planning Optimization Runs - Track optimization algorithm executions
export const laborPlanningOptimizations = pgTable('labor_planning_optimizations', {
  id: serial('id').primaryKey(),
  plantId: integer('plant_id').references(() => ptPlants.id),
  optimizationName: varchar('optimization_name', { length: 100 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  algorithm: varchar('algorithm', { length: 50 }).notNull(), // genetic, linear_programming, constraint_satisfaction, heuristic
  objectiveFunction: varchar('objective_function', { length: 100 }).notNull(), // minimize_cost, maximize_utilization, balance_workload, minimize_gaps
  constraints: jsonb('constraints').$type<{
    maxOvertimePercent?: number;
    minRestHours?: number;
    maxConsecutiveDays?: number;
    skillRequirements?: boolean;
    employeePreferences?: boolean;
    laborRegulations?: boolean;
  }>().notNull(),
  parameters: jsonb('parameters').$type<Record<string, any>>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, running, completed, failed, cancelled
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  executionTimeSeconds: integer('execution_time_seconds'),
  results: jsonb('results').$type<{
    totalAssignments?: number;
    fulfillmentRate?: number;
    overtimeHours?: number;
    totalCost?: number;
    gapsRemaining?: number;
    utilizationRate?: number;
    employeeSatisfactionScore?: number;
  }>(),
  appliedToSchedule: boolean('applied_to_schedule').default(false),
  appliedAt: timestamp('applied_at'),
  appliedBy: integer('applied_by').references(() => users.id),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  plantIdx: index('labor_optimizations_plant_idx').on(table.plantId),
  statusIdx: index('labor_optimizations_status_idx').on(table.status),
  dateRangeIdx: index('labor_optimizations_date_range_idx').on(table.startDate, table.endDate)
}));

// Insert schemas for Labor Planning
export const insertEmployeeSkillSchema = createInsertSchema(employeeSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmployeeSkill = z.infer<typeof insertEmployeeSkillSchema>;
export type EmployeeSkill = typeof employeeSkills.$inferSelect;

export const insertLaborShiftTemplateSchema = createInsertSchema(shiftTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertLaborShiftTemplate = z.infer<typeof insertLaborShiftTemplateSchema>;
export type LaborShiftTemplate = typeof shiftTemplates.$inferSelect;

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;

export const insertLaborCapacityRequirementSchema = createInsertSchema(laborCapacityRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertLaborCapacityRequirement = z.infer<typeof insertLaborCapacityRequirementSchema>;
export type LaborCapacityRequirement = typeof laborCapacityRequirements.$inferSelect;

export const insertEmployeeAvailabilitySchema = createInsertSchema(employeeAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmployeeAvailability = z.infer<typeof insertEmployeeAvailabilitySchema>;
export type EmployeeAvailability = typeof employeeAvailability.$inferSelect;

export const insertEmployeePreferenceSchema = createInsertSchema(employeePreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmployeePreference = z.infer<typeof insertEmployeePreferenceSchema>;
export type EmployeePreference = typeof employeePreferences.$inferSelect;

export const insertEmployeeMachineCertificationSchema = createInsertSchema(employeeMachineCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmployeeMachineCertification = z.infer<typeof insertEmployeeMachineCertificationSchema>;
export type EmployeeMachineCertification = typeof employeeMachineCertifications.$inferSelect;

export const insertShiftCapacityGapSchema = createInsertSchema(shiftCapacityGaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertShiftCapacityGap = z.infer<typeof insertShiftCapacityGapSchema>;
export type ShiftCapacityGap = typeof shiftCapacityGaps.$inferSelect;

export const insertLaborPlanningOptimizationSchema = createInsertSchema(laborPlanningOptimizations).omit({
  id: true,
  createdAt: true
});
export type InsertLaborPlanningOptimization = z.infer<typeof insertLaborPlanningOptimizationSchema>;
export type LaborPlanningOptimization = typeof laborPlanningOptimizations.$inferSelect;

// Alias for backward compatibility 
export const laborOptimizations = laborPlanningOptimizations;
export type LaborOptimization = LaborPlanningOptimization;
export type InsertLaborOptimization = InsertLaborPlanningOptimization;

// Integration Management System Tables

// Integration configurations - Define available integrations
export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // erp, crm, warehouse, transport, bi, communication, cloud, accounting, iot, quality
  provider: varchar('provider', { length: 100 }).notNull(), // salesforce, sap, oracle, slack, teams, aws, google, etc.
  icon: text('icon'), // Base64 or URL to icon
  description: text('description'),
  authType: varchar('auth_type', { length: 50 }).notNull(), // oauth2, api_key, basic, custom
  authConfig: jsonb('auth_config').$type<{
    oauth?: {
      authUrl?: string;
      tokenUrl?: string;
      scopes?: string[];
      clientId?: string;
      redirectUri?: string;
    };
    apiKey?: {
      headerName?: string;
      queryParam?: string;
      prefix?: string;
    };
    basic?: {
      usernameField?: string;
      passwordField?: string;
    };
  }>().notNull(),
  baseUrl: text('base_url'),
  endpoints: jsonb('endpoints').$type<Record<string, {
    method: string;
    path: string;
    description?: string;
    params?: Record<string, any>;
  }>>().default({}),
  capabilities: jsonb('capabilities').$type<string[]>().default([]), // ['read', 'write', 'webhook', 'realtime', 'bulk']
  webhookSupport: boolean('webhook_support').default(false),
  rateLimit: jsonb('rate_limit').$type<{
    requests?: number;
    period?: string;
    concurrent?: number;
  }>(),
  defaultSyncInterval: integer('default_sync_interval').default(3600), // seconds
  customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, deprecated
  version: varchar('version', { length: 20 }),
  documentation: text('documentation'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('integrations_category_idx').on(table.category),
  providerIdx: index('integrations_provider_idx').on(table.provider),
  statusIdx: index('integrations_status_idx').on(table.status)
}));

// Integration connections - Store actual connections per plant/company
export const integrationConnections = pgTable('integration_connections', {
  id: serial('id').primaryKey(),
  integrationId: integer('integration_id').notNull().references(() => integrations.id),
  plantId: integer('plant_id').references(() => ptPlants.id),
  companyId: varchar('company_id', { length: 100 }), // For external companies if needed
  connectionName: varchar('connection_name', { length: 100 }).notNull(),
  environment: varchar('environment', { length: 20 }).notNull().default('production'), // production, staging, development
  credentials: jsonb('credentials').$type<{
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    clientSecret?: string;
    expiresAt?: string;
    customFields?: Record<string, any>;
  }>().notNull(), // Encrypted in production
  connectionUrl: text('connection_url'),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, error, expired
  lastConnectionTest: timestamp('last_connection_test'),
  lastConnectionStatus: boolean('last_connection_status'),
  lastErrorMessage: text('last_error_message'),
  syncEnabled: boolean('sync_enabled').default(true),
  syncInterval: integer('sync_interval'), // seconds, overrides default
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  integrationIdx: index('integration_connections_integration_idx').on(table.integrationId),
  plantIdx: index('integration_connections_plant_idx').on(table.plantId),
  statusIdx: index('integration_connections_status_idx').on(table.status),
  uniqueConnection: unique().on(table.integrationId, table.plantId, table.connectionName)
}));

// Integration sync jobs - Track data synchronization jobs
export const integrationSyncJobs = pgTable('integration_sync_jobs', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id').notNull().references(() => integrationConnections.id),
  jobType: varchar('job_type', { length: 50 }).notNull(), // full_sync, incremental, webhook, manual, scheduled
  direction: varchar('direction', { length: 20 }).notNull(), // inbound, outbound, bidirectional
  entityType: varchar('entity_type', { length: 100 }), // orders, inventory, customers, products, etc.
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, running, completed, failed, cancelled
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  recordsProcessed: integer('records_processed').default(0),
  recordsCreated: integer('records_created').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorMessages: jsonb('error_messages').$type<string[]>().default([]),
  syncConfig: jsonb('sync_config').$type<{
    filters?: Record<string, any>;
    mappings?: Record<string, any>;
    options?: Record<string, any>;
    batchSize?: number;
    retryAttempts?: number;
  }>().default({}),
  syncData: jsonb('sync_data').$type<{
    lastSyncToken?: string;
    checkpoint?: any;
    metadata?: Record<string, any>;
  }>(),
  executionTimeMs: integer('execution_time_ms'),
  retryCount: integer('retry_count').default(0),
  nextRetryAt: timestamp('next_retry_at'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  connectionIdx: index('sync_jobs_connection_idx').on(table.connectionId),
  statusIdx: index('sync_jobs_status_idx').on(table.status),
  entityIdx: index('sync_jobs_entity_idx').on(table.entityType),
  createdAtIdx: index('sync_jobs_created_at_idx').on(table.createdAt)
}));

// Integration field mappings - Map fields between systems
export const integrationFieldMappings = pgTable('integration_field_mappings', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id').notNull().references(() => integrationConnections.id),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // orders, products, customers, etc.
  mappingName: varchar('mapping_name', { length: 100 }).notNull(),
  direction: varchar('direction', { length: 20 }).notNull(), // inbound, outbound, bidirectional
  sourceField: varchar('source_field', { length: 200 }).notNull(),
  targetField: varchar('target_field', { length: 200 }).notNull(),
  transformation: jsonb('transformation').$type<{
    type?: string; // direct, function, lookup, constant
    function?: string;
    params?: any[];
    lookupTable?: string;
    lookupKey?: string;
    defaultValue?: any;
  }>(),
  dataType: varchar('data_type', { length: 50 }), // string, number, date, boolean, json
  required: boolean('required').default(false),
  validation: jsonb('validation').$type<{
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
    custom?: string;
  }>(),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  connectionIdx: index('field_mappings_connection_idx').on(table.connectionId),
  entityIdx: index('field_mappings_entity_idx').on(table.entityType),
  uniqueMapping: unique().on(table.connectionId, table.entityType, table.sourceField, table.targetField)
}));

// Integration logs - Store detailed logs of integration activities
export const integrationLogs = pgTable('integration_logs', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id').references(() => integrationConnections.id),
  syncJobId: integer('sync_job_id').references(() => integrationSyncJobs.id),
  logLevel: varchar('log_level', { length: 20 }).notNull(), // debug, info, warning, error, critical
  eventType: varchar('event_type', { length: 100 }).notNull(), // auth, sync, webhook, error, etc.
  message: text('message').notNull(),
  details: jsonb('details').$type<Record<string, any>>().default({}),
  request: jsonb('request').$type<{
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  }>(),
  response: jsonb('response').$type<{
    status?: number;
    headers?: Record<string, string>;
    body?: any;
    error?: string;
  }>(),
  errorCode: varchar('error_code', { length: 100 }),
  errorStack: text('error_stack'),
  userId: integer('user_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  connectionIdx: index('integration_logs_connection_idx').on(table.connectionId),
  syncJobIdx: index('integration_logs_sync_job_idx').on(table.syncJobId),
  levelIdx: index('integration_logs_level_idx').on(table.logLevel),
  eventIdx: index('integration_logs_event_idx').on(table.eventType),
  createdAtIdx: index('integration_logs_created_at_idx').on(table.createdAt)
}));

// Insert schemas for Integration Management
export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export const insertIntegrationConnectionSchema = createInsertSchema(integrationConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIntegrationConnection = z.infer<typeof insertIntegrationConnectionSchema>;
export type IntegrationConnection = typeof integrationConnections.$inferSelect;

export const insertIntegrationSyncJobSchema = createInsertSchema(integrationSyncJobs).omit({
  id: true,
  createdAt: true
});
export type InsertIntegrationSyncJob = z.infer<typeof insertIntegrationSyncJobSchema>;
export type IntegrationSyncJob = typeof integrationSyncJobs.$inferSelect;

export const insertIntegrationFieldMappingSchema = createInsertSchema(integrationFieldMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIntegrationFieldMapping = z.infer<typeof insertIntegrationFieldMappingSchema>;
export type IntegrationFieldMapping = typeof integrationFieldMappings.$inferSelect;

export const insertIntegrationLogSchema = createInsertSchema(integrationLogs).omit({
  id: true,
  createdAt: true
});
export type InsertIntegrationLog = z.infer<typeof insertIntegrationLogSchema>;
export type IntegrationLog = typeof integrationLogs.$inferSelect;

// ========================================
// Additional Relations for Resource Management
// ========================================

// scheduleScenarioRelations - resourceRequirementBlocks relation DELETED: replaced by ptjobresourceblocks
export const scheduleScenarioRelations = relations(scheduleScenarios, ({ many }) => ({
  // resourceRequirementBlocks: DELETED - replaced by ptjobresourceblocks
}));

// resourceRequirementBlocksRelations - DELETED: resourceRequirementBlocks table was replaced by ptjobresourceblocks

// Note: PT Job Activities and PT Job Resources relationships are handled 
// through the ptJobOperations relationship already established above

// Time Tracking Tables - Import from separate schema file
export * from "./time-tracking-schema";



