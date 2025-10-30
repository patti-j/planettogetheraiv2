import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, decimal, primaryKey, index, unique, uniqueIndex, pgEnum, smallint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================
// Authentication Tables
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  activeRoleId: integer("active_role_id"),
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"),
  jobTitle: varchar("job_title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  feature: varchar("feature", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: integer("assigned_by").references(() => users.id),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
});

// ============================================
// API Keys & Agent Authentication Tables
// ============================================

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyId: varchar("key_id", { length: 32 }).unique().notNull(), // public identifier
  keyHash: text("key_hash").notNull(), // hashed secret key
  name: varchar("name", { length: 255 }).notNull(), // human-readable name
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(), // creator
  roleId: integer("role_id").references(() => roles.id), // assigned role for permissions
  scope: jsonb("scope").default(sql`'[]'::jsonb`), // permitted endpoints/features
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"), // null = never expires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiKeyUsage = pgTable("api_key_usage", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  responseStatus: integer("response_status"),
  responseTime: integer("response_time_ms"),
  requestSize: integer("request_size_bytes"),
  responseSize: integer("response_size_bytes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const oauthClients = pgTable("oauth_clients", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 64 }).unique().notNull(),
  clientSecret: text("client_secret").notNull(), // hashed
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  redirectUris: jsonb("redirect_uris").default(sql`'[]'::jsonb`),
  scopes: jsonb("scopes").default(sql`'[]'::jsonb`),
  grantTypes: jsonb("grant_types").default(sql`'["client_credentials"]'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const oauthTokens = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => oauthClients.id).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  tokenType: varchar("token_type", { length: 20 }).default("Bearer"),
  scopes: jsonb("scopes").default(sql`'[]'::jsonb`),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Agent Monitoring & Control System
// ============================================

// Enum for agent connection types
export const agentConnectionTypeEnum = pgEnum("agent_connection_type", [
  "api_key",
  "oauth",
  "webhook",
  "websocket"
]);

// Enum for agent connection status
export const agentConnectionStatusEnum = pgEnum("agent_connection_status", [
  "active",
  "inactive",
  "suspended",
  "revoked",
  "rate_limited"
]);

// Track active agent connections
export const agentConnections = pgTable("agent_connections", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 64 }).unique().notNull(), // Unique identifier for the agent
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  connectionType: agentConnectionTypeEnum("connection_type").notNull(),
  status: agentConnectionStatusEnum("status").default("active").notNull(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id), // For API key auth
  oauthClientId: integer("oauth_client_id").references(() => oauthClients.id), // For OAuth auth
  ipAddress: varchar("ip_address", { length: 45 }), // Last known IP
  userAgent: text("user_agent"),
  permissions: jsonb("permissions").default(sql`'[]'::jsonb`), // Specific permissions granted
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional agent info (version, capabilities, etc.)
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  isEnabled: boolean("is_enabled").default(true),
  lastSeenAt: timestamp("last_seen_at"),
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Log all actions taken by agents
export const agentActions = pgTable("agent_actions", {
  id: serial("id").primaryKey(),
  agentConnectionId: integer("agent_connection_id").references(() => agentConnections.id).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(), // e.g., 'api_call', 'data_query', 'schedule_update'
  endpoint: varchar("endpoint", { length: 255 }), // API endpoint if applicable
  method: varchar("method", { length: 10 }), // HTTP method
  requestPayload: jsonb("request_payload"), // Sanitized request data
  responseStatus: integer("response_status"),
  responsePayload: jsonb("response_payload"), // Sanitized response data
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  affectedEntities: jsonb("affected_entities"), // IDs and types of affected records
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 64 }), // For tracking related actions
  timestamp: timestamp("timestamp").defaultNow(),
});

// Track agent performance metrics (aggregated hourly)
export const agentMetricsHourly = pgTable("agent_metrics_hourly", {
  id: serial("id").primaryKey(),
  agentConnectionId: integer("agent_connection_id").references(() => agentConnections.id).notNull(),
  hourTimestamp: timestamp("hour_timestamp").notNull(), // Start of the hour
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  avgResponseTimeMs: numeric("avg_response_time_ms", { precision: 10, scale: 2 }),
  maxResponseTimeMs: integer("max_response_time_ms"),
  minResponseTimeMs: integer("min_response_time_ms"),
  totalDataTransferredKb: numeric("total_data_transferred_kb", { precision: 15, scale: 2 }),
  uniqueEndpoints: integer("unique_endpoints"),
  errorRate: numeric("error_rate", { precision: 5, scale: 4 }), // Percentage as decimal
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent control policies
export const agentPolicies = pgTable("agent_policies", {
  id: serial("id").primaryKey(),
  agentConnectionId: integer("agent_connection_id").references(() => agentConnections.id).notNull(),
  policyType: varchar("policy_type", { length: 50 }).notNull(), // 'rate_limit', 'access_control', 'data_filter'
  policyConfig: jsonb("policy_config").notNull(), // Policy-specific configuration
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  activatedAt: timestamp("activated_at"),
  deactivatedAt: timestamp("deactivated_at"),
});

// Agent alerts and notifications
export const agentAlerts = pgTable("agent_alerts", {
  id: serial("id").primaryKey(),
  agentConnectionId: integer("agent_connection_id").references(() => agentConnections.id).notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'anomaly', 'rate_limit', 'error_threshold'
  severity: varchar("severity", { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  details: jsonb("details"), // Additional context
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note: Indexes are created inline with table definitions where needed
// The following would be created as separate database indexes if needed:
// - idx_agent_connections_status on agentConnections.status
// - idx_agent_connections_agent_id on agentConnections.agentId  
// - idx_agent_actions_connection_timestamp on (agentConnectionId, timestamp)
// - idx_agent_actions_session on agentActions.sessionId
// - idx_agent_metrics_connection_hour on (agentConnectionId, hourTimestamp)

// ============================================
// Dashboard and Widget System
// ============================================

export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  roleId: integer("role_id").references(() => roles.id),
  userId: integer("user_id").references(() => users.id),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const widgets = pgTable("widgets", {
  id: serial("id").primaryKey(),
  dashboardId: integer("dashboard_id").references(() => dashboards.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  position: jsonb("position").notNull(), // {x, y, w, h}
  config: jsonb("config").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const widgetTypes = pgTable("widget_types", {
  id: varchar("id", { length: 100 }).primaryKey(), // e.g., 'kpi-grid'
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  configurable: boolean("configurable").default(true),
  dataSourceRequired: boolean("data_source_required").default(true),
  defaultSize: jsonb("default_size").notNull(), // {w, h}
  supportedSizes: jsonb("supported_sizes").default(sql`'[]'::jsonb`),
  configSchema: jsonb("config_schema").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// PT Manufacturing Tables (Minimal Schema)
// ============================================

// Minimal ptjobs table matching actual database structure (10 columns)
export const ptJobs = pgTable("ptjobs", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  priority: integer("priority").default(1),
  needDateTime: timestamp("need_date_time"),
  // Manufacturing release date - when the job can start production (for ASAP scheduling)
  manufacturingReleaseDate: timestamp("manufacturing_release_date"),
  scheduledStatus: varchar("scheduled_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Minimal ptjoboperations table matching actual database structure (17 columns + constraint fields)
export const ptJobOperations = pgTable("ptjoboperations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => ptJobs.id),
  externalId: varchar("external_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  operationId: varchar("operation_id"),
  baseOperationId: varchar("base_operation_id"),
  requiredFinishQty: numeric("required_finish_qty"),
  cycleHrs: numeric("cycle_hrs"),
  setupHours: numeric("setup_hours"),
  postProcessingHours: numeric("post_processing_hours"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  percentFinished: numeric("percent_finished").default('0'),
  manuallyScheduled: boolean("manually_scheduled").default(false),
  // Sequence number for correct operation ordering (brewing process sequence)
  sequenceNumber: integer("sequence_number"),
  // Constraint fields
  constraintType: varchar("constraint_type", { length: 10 }), // MSO, MFO, SNET, FNET, SNLT, FNLT
  constraintDate: timestamp("constraint_date"),
  // PERT (Program Evaluation Review Technique) fields for three-point estimation
  timeOptimistic: decimal("time_optimistic", { precision: 10, scale: 4 }), // Best case duration
  timeMostLikely: decimal("time_most_likely", { precision: 10, scale: 4 }), // Expected duration
  timePessimistic: decimal("time_pessimistic", { precision: 10, scale: 4 }), // Worst case duration
  timeExpected: decimal("time_expected", { precision: 10, scale: 4 }), // Calculated: (O + 4M + P) / 6
  timeVariance: decimal("time_variance", { precision: 10, scale: 6 }), // Calculated: ((P - O) / 6)^2
  timeStdDev: decimal("time_std_dev", { precision: 10, scale: 4 }), // Calculated: (P - O) / 6
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PT Schema Insert/Select Types
export const insertPtJobSchema = createInsertSchema(ptJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPtJobOperationSchema = createInsertSchema(ptJobOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PtJob = typeof ptJobs.$inferSelect;
export type InsertPtJob = z.infer<typeof insertPtJobSchema>;

// Dashboard and Widget Insert/Select Schemas
export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWidgetSchema = createInsertSchema(widgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWidgetTypeSchema = createInsertSchema(widgetTypes).omit({
  createdAt: true,
});

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type WidgetType = typeof widgetTypes.$inferSelect;
export type InsertWidgetType = z.infer<typeof insertWidgetTypeSchema>;

// Dashboard Relations
export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  role: one(roles, {
    fields: [dashboards.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [dashboards.userId],
    references: [users.id],
  }),
  widgets: many(widgets),
}));

export const widgetsRelations = relations(widgets, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [widgets.dashboardId],
    references: [dashboards.id],
  }),
}));

// ============================================
// Company Onboarding & Configuration
// ============================================

export const companyOnboarding = pgTable("company_onboarding", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  primaryGoals: jsonb("primary_goals").default(sql`'[]'::jsonb`),
  currentChallenges: jsonb("current_challenges").default(sql`'[]'::jsonb`),
  selectedTemplate: varchar("selected_template", { length: 100 }),
  completedSteps: jsonb("completed_steps").default(sql`'[]'::jsonb`),
  onboardingProgress: integer("onboarding_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  theme: varchar("theme", { length: 20 }).default("light"),
  language: varchar("language", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  dashboardLayout: jsonb("dashboard_layout").default(sql`'{}'::jsonb`),
  notificationSettings: jsonb("notification_settings").default(sql`'{}'::jsonb`),
  uiSettings: jsonb("ui_settings").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Essential PT Tables (Manufacturing Data)
// ============================================

export const ptPlants = pgTable("ptplants", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date"),
  instanceId: varchar("instance_id", { length: 38 }),
  plantId: integer("plant_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  bottleneckThreshold: numeric("bottleneck_threshold"),
  heavyLoadThreshold: numeric("heavy_load_threshold"),
  externalId: text("external_id"),
  departmentCount: integer("department_count"),
  stableDays: numeric("stable_days"),
  dailyOperatingExpense: numeric("daily_operating_expense"),
  investedCapital: numeric("invested_capital"),
  annualPercentageRate: numeric("annual_percentage_rate"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  timezone: text("timezone").default("UTC"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  plantType: text("plant_type").default("manufacturing"),
  isActive: boolean("is_active").default(true),
  capacity: jsonb("capacity").default(sql`'{}'::jsonb`),
  operationalMetrics: jsonb("operational_metrics").default(sql`'{}'::jsonb`),
});


export const ptManufacturingOrders = pgTable("pt_manufacturing_orders", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: integer("plant_id").notNull(),
  manufacturingOrderId: integer("manufacturing_order_id"),
  orderNumber: text("order_number"),
  itemId: integer("item_id"),
  itemName: text("item_name"),
  quantity: numeric("quantity"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  status: varchar("status", { length: 50 }).default("planned"),
  priority: integer("priority").default(5),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  dueDate: timestamp("due_date"),
  customerOrderId: integer("customer_order_id"),
  description: text("description"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Master Data Tables
// ============================================

// Items table for inventory management
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemNumber: varchar("item_number", { length: 100 }).notNull().unique(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  itemType: varchar("item_type", { length: 50 }).default("finished_good"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  standardCost: numeric("standard_cost"),
  status: varchar("status", { length: 50 }).default("active"),
  plantId: integer("plant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Capabilities table for resource and work center capabilities
export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("skill"), // skill, certification, equipment, process
  level: integer("level"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add a dedicated production orders table for frontend compatibility
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  orderNumber: text("order_number"),
  itemId: integer("item_id"),
  itemName: text("item_name"),
  quantity: numeric("quantity"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  status: varchar("status", { length: 50 }).default("planned"),
  priority: integer("priority").default(5),
  dueDate: timestamp("due_date"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  customerId: integer("customer_id"),
  salesOrderId: integer("sales_order_id"),
  description: text("description"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ptResources = pgTable("ptresources", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: integer("plant_id").notNull(),
  departmentId: integer("department_id"),
  resourceId: integer("resource_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  bottleneck: boolean("bottleneck"),
  bufferHours: numeric("buffer_hours"),
  capacityType: text("capacity_type"),
  drum: boolean("drum"),
  overtimeHourlyCost: numeric("overtime_hourly_cost"),
  standardHourlyCost: numeric("standard_hourly_cost"),
  resourceType: varchar("resource_type", { length: 50 }).default("machine"),
  capacity: numeric("capacity"),
  availableHours: numeric("available_hours"),
  efficiency: numeric("efficiency").default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Production Scheduler - Saved Schedules
// ============================================

export const savedSchedules = pgTable("saved_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scheduleData: jsonb("schedule_data").notNull(), // Contains events, resources, dependencies
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional info like algorithm used, constraints, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// Schedule Versioning and Concurrency Control
// ============================================

// Schedule version tracking - stores immutable snapshots
export const scheduleVersions = pgTable("schedule_versions", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(), // Links to master schedule (ptjobs or savedSchedules)
  versionNumber: integer("version_number").notNull(), // Sequential version number
  versionTag: varchar("version_tag", { length: 50 }), // Optional tag like "v1.0", "baseline", "optimized"
  
  // Version metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'manual', 'optimization', 'import', 'auto-save'
  comment: text("comment"), // User comment about this version
  
  // Snapshot data
  snapshotData: jsonb("snapshot_data").notNull(), // Complete schedule state at this version
  operationSnapshots: jsonb("operation_snapshots").notNull(), // All operation states
  resourceAllocations: jsonb("resource_allocations"), // Resource assignments at this version
  
  // Version relationships
  parentVersionId: integer("parent_version_id"), // Previous version this was based on
  branchName: varchar("branch_name", { length: 100 }).default("main"), // Support for branching
  isMerged: boolean("is_merged").default(false),
  mergedIntoVersionId: integer("merged_into_version_id"),
  
  // Optimistic concurrency control
  checksum: varchar("checksum", { length: 64 }).notNull(), // SHA-256 hash of critical data
  conflictResolution: jsonb("conflict_resolution"), // How conflicts were resolved if any
  
  // Performance metrics at this version
  metrics: jsonb("metrics"), // Makespan, utilization, etc.
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, archived, superseded
  isBaseline: boolean("is_baseline").default(false), // Mark important versions
});

// Operation version history - tracks changes to individual operations
export const operationVersions = pgTable("operation_versions", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => ptJobOperations.id).notNull(),
  versionId: integer("version_id").references(() => scheduleVersions.id).notNull(),
  
  // Operation state at this version
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  resourceId: integer("resource_id"),
  sequenceNumber: integer("sequence_number"),
  
  // What changed
  changeType: varchar("change_type", { length: 50 }), // 'created', 'updated', 'deleted', 'rescheduled'
  changedFields: jsonb("changed_fields"), // List of fields that changed
  previousValues: jsonb("previous_values"), // Previous field values
  newValues: jsonb("new_values"), // New field values
  
  // Manual scheduling preservation
  manuallyScheduled: boolean("manually_scheduled").default(false),
  lockReason: text("lock_reason"), // Why this was locked
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Version comparison metadata
export const versionComparisons = pgTable("version_comparisons", {
  id: serial("id").primaryKey(),
  versionId1: integer("version_id_1").references(() => scheduleVersions.id).notNull(),
  versionId2: integer("version_id_2").references(() => scheduleVersions.id).notNull(),
  
  // Comparison results
  comparisonType: varchar("comparison_type", { length: 50 }), // 'diff', 'merge', 'conflict'
  differences: jsonb("differences").notNull(), // Detailed diff between versions
  conflictCount: integer("conflict_count").default(0),
  
  // Performance comparison
  metricsDelta: jsonb("metrics_delta"), // Change in metrics between versions
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Concurrency control locks
export const scheduleLocks = pgTable("schedule_locks", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  versionId: integer("version_id").references(() => scheduleVersions.id).notNull(),
  
  // Lock information
  lockType: varchar("lock_type", { length: 20 }).notNull(), // 'read', 'write', 'exclusive'
  lockedBy: integer("locked_by").references(() => users.id).notNull(),
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-release after timeout
  
  // Lock context
  sessionId: varchar("session_id", { length: 100 }), // Track which session holds the lock
  purpose: text("purpose"), // Why the lock was acquired
  
  // Optimistic control
  expectedVersion: integer("expected_version").notNull(), // Version expected when acquiring lock
  actualVersion: integer("actual_version"), // Actual version at lock time
  
  isActive: boolean("is_active").default(true),
});

// Version rollback history
export const versionRollbacks = pgTable("version_rollbacks", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  fromVersionId: integer("from_version_id").references(() => scheduleVersions.id).notNull(),
  toVersionId: integer("to_version_id").references(() => scheduleVersions.id).notNull(),
  
  // Rollback details
  rollbackReason: text("rollback_reason").notNull(),
  rollbackType: varchar("rollback_type", { length: 50 }), // 'full', 'partial', 'selective'
  affectedOperations: jsonb("affected_operations"), // Which operations were rolled back
  
  // Audit
  performedBy: integer("performed_by").references(() => users.id).notNull(),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  approved: boolean("approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// ============================================
// Product Wheel Scheduling System
// ============================================

export const ptProductWheels = pgTable("pt_product_wheels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  resourceId: integer("resource_id").references(() => ptResources.id).notNull(), // Production line/resource
  plantId: integer("plant_id").references(() => ptPlants.id).notNull(),
  
  // Wheel configuration
  cycleDurationHours: numeric("cycle_duration_hours").notNull(), // Total wheel cycle time
  changeoverMatrix: jsonb("changeover_matrix"), // Product-to-product changeover times
  optimizationRules: jsonb("optimization_rules"), // Rules for wheel optimization
  
  // Status
  isActive: boolean("is_active").default(true),
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, archived
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ptProductWheelSegments = pgTable("pt_product_wheel_segments", {
  id: serial("id").primaryKey(),
  wheelId: integer("wheel_id").references(() => ptProductWheels.id).notNull(),
  
  // Segment details
  sequenceNumber: integer("sequence_number").notNull(), // Order in the wheel
  productId: integer("product_id"), // Link to product/item
  productName: varchar("product_name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 100 }),
  
  // Timing
  allocatedHours: numeric("allocated_hours").notNull(), // Time slot in wheel
  minBatchSize: numeric("min_batch_size"),
  maxBatchSize: numeric("max_batch_size"),
  targetBatchSize: numeric("target_batch_size"),
  
  // Visual
  colorCode: varchar("color_code", { length: 7 }), // Hex color for visualization
  
  // Changeover
  changeoverFromPrevious: numeric("changeover_from_previous"), // Minutes
  setupTime: numeric("setup_time"), // Minutes
  cleaningTime: numeric("cleaning_time"), // Minutes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ptProductWheelSchedule = pgTable("pt_product_wheel_schedule", {
  id: serial("id").primaryKey(),
  wheelId: integer("wheel_id").references(() => ptProductWheels.id).notNull(),
  
  // Schedule instance
  cycleNumber: integer("cycle_number").notNull(),
  plannedStartDate: timestamp("planned_start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  
  // Status tracking
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, in_progress, completed, cancelled
  currentSegmentId: integer("current_segment_id").references(() => ptProductWheelSegments.id),
  completedSegments: integer("completed_segments").default(0),
  
  // Performance
  adherencePercentage: numeric("adherence_percentage"), // How closely we followed the wheel
  totalChangeoverTime: numeric("total_changeover_time"), // Actual changeover minutes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ptProductWheelPerformance = pgTable("pt_product_wheel_performance", {
  id: serial("id").primaryKey(),
  wheelId: integer("wheel_id").references(() => ptProductWheels.id).notNull(),
  scheduleId: integer("schedule_id").references(() => ptProductWheelSchedule.id),
  
  // Metrics
  metricDate: timestamp("metric_date").notNull(),
  oeePercentage: numeric("oee_percentage"),
  changeoverCount: integer("changeover_count"),
  totalChangeoverMinutes: numeric("total_changeover_minutes"),
  inventoryTurns: numeric("inventory_turns"),
  onTimeDelivery: numeric("on_time_delivery"),
  
  // Optimization suggestions from AI
  aiSuggestions: jsonb("ai_suggestions"),
  optimizationScore: numeric("optimization_score"), // 0-100 score
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Global Control Tower KPI System
// ============================================

// Plant KPI Targets - define KPIs and targets for each plant
export const plantKpiTargets = pgTable("plant_kpi_targets", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => ptPlants.id).notNull(),
  
  // KPI definition
  kpiName: varchar("kpi_name", { length: 200 }).notNull(),
  kpiType: varchar("kpi_type", { length: 50 }).notNull(), // efficiency, quality, throughput, cost, delivery, safety, oee
  targetValue: numeric("target_value").notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  
  // KPI weight for aggregation (0-100)
  weight: numeric("weight").default("1"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Description and metadata
  description: text("description"),
  
  // Thresholds for performance grading
  excellentThreshold: numeric("excellent_threshold").default("1.0"), // >= 100% of target
  goodThreshold: numeric("good_threshold").default("0.95"), // >= 95% of target  
  warningThreshold: numeric("warning_threshold").default("0.85"), // >= 85% of target
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plant KPI Performance - actual performance data for KPIs
export const plantKpiPerformance = pgTable("plant_kpi_performance", {
  id: serial("id").primaryKey(),
  plantKpiTargetId: integer("plant_kpi_target_id").references(() => plantKpiTargets.id).notNull(),
  
  // Performance data
  measurementDate: timestamp("measurement_date").notNull(),
  actualValue: numeric("actual_value").notNull(),
  targetValue: numeric("target_value").notNull(), // Target at time of measurement
  performanceRatio: numeric("performance_ratio").notNull(), // actual/target
  
  // Performance grade based on thresholds
  performanceGrade: varchar("performance_grade", { length: 20 }), // Excellent, Good, Warning, Critical
  
  // Additional metrics
  trendDirection: varchar("trend_direction", { length: 10 }), // up, down, stable
  percentageChange: numeric("percentage_change"), // vs previous measurement
  
  // Comments and context
  notes: text("notes"),
  dataSource: varchar("data_source", { length: 100 }), // manual, system, integration
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Autonomous Optimization Configuration
export const autonomousOptimization = pgTable("autonomous_optimization", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  plantId: integer("plant_id").references(() => ptPlants.id).notNull(),
  
  // Optimization settings
  isEnabled: boolean("is_enabled").default(false),
  optimizationObjective: varchar("optimization_objective", { length: 100 }).default("maximize_weighted_kpis"),
  
  // Target KPIs to optimize (array of KPI target IDs)
  targetKpiIds: integer("target_kpi_ids").array(),
  
  // Algorithm configuration
  allowedAlgorithms: varchar("allowed_algorithms").array(), // ASAP, ALAP, CRITICAL_PATH, etc.
  currentAlgorithm: varchar("current_algorithm", { length: 50 }).default("ASAP"),
  autoAlgorithmSelection: boolean("auto_algorithm_selection").default(true),
  
  // Optimization parameters
  enableParameterTuning: boolean("enable_parameter_tuning").default(true),
  learningMode: varchar("learning_mode", { length: 50 }).default("adaptive"), // adaptive, conservative, aggressive
  performanceThreshold: numeric("performance_threshold").default("0.85"), // Min acceptable performance
  evaluationPeriodMinutes: integer("evaluation_period_minutes").default(60),
  
  // Execution tracking
  lastOptimizationAt: timestamp("last_optimization_at"),
  totalOptimizations: integer("total_optimizations").default(0),
  successfulOptimizations: integer("successful_optimizations").default(0),
  lastPerformanceScore: numeric("last_performance_score"),
  
  // AI learning data
  learningHistory: jsonb("learning_history"), // Historical performance data
  parameterHistory: jsonb("parameter_history"), // Parameter tuning history
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// AI Agent Team System
// ============================================

// AI Agent types enum
export const agentTypeEnum = pgEnum('agent_type', [
  'production_scheduling',
  'inventory_planning', 
  'capacity_planning',
  'quality_management',
  'maintenance_planning',
  'supply_chain',
  'demand_forecasting',
  'cost_optimization',
  'safety_compliance',
  'general_assistant'
]);

export const agentStatusEnum = pgEnum('agent_status', ['active', 'paused', 'error', 'training']);

export const recommendationStatusEnum = pgEnum('recommendation_status', [
  'pending',
  'accepted', 
  'rejected',
  'completed',
  'in_progress'
]);

// AI Agent definitions - user-configurable specialized agents
export const aiAgentTeam = pgTable("ai_agent_team", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  agentType: agentTypeEnum("agent_type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Agent configuration
  specialization: jsonb("specialization"), // Focus areas within the agent type
  settings: jsonb("settings").default(sql`'{}'::jsonb`), // Agent-specific settings
  persona: text("persona"), // Custom personality/approach for the agent
  
  // Performance metrics
  totalRecommendations: integer("total_recommendations").default(0),
  acceptedRecommendations: integer("accepted_recommendations").default(0),
  successRate: numeric("success_rate").default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Agent recommendations - specific actionable recommendations from agents
export const agentRecommendations = pgTable("agent_recommendations", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => aiAgentTeam.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Recommendation details
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  priority: integer("priority").default(50), // 1-100 priority score
  confidence: integer("confidence").default(80), // AI confidence 0-100
  category: varchar("category", { length: 50 }),
  
  // Related entities
  entityType: varchar("entity_type", { length: 50 }), // 'job', 'resource', 'order', etc.
  entityId: integer("entity_id"),
  
  // Action details
  actionType: varchar("action_type", { length: 50 }), // 'schedule', 'optimize', 'adjust', etc.
  actionData: jsonb("action_data"), // Specific action parameters
  estimatedImpact: text("estimated_impact"),
  estimatedTime: integer("estimated_time"), // Minutes to implement
  
  // AI reasoning
  reasoning: text("reasoning").notNull(),
  dataPoints: jsonb("data_points"), // Supporting data used in analysis
  alternatives: jsonb("alternatives"), // Alternative approaches considered
  
  // Status tracking
  status: recommendationStatusEnum("status").default('pending'),
  feedback: text("feedback"), // User feedback on the recommendation
  actualOutcome: text("actual_outcome"), // Results after implementation
  
  // Timing
  recommendedAt: timestamp("recommended_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  implementedAt: timestamp("implemented_at"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Removed agentActions table to avoid migration conflicts
// export const agentActions = pgTable("agent_actions", { ... });

// AI Memories - store user preferences and learned context
export const aiMemories = pgTable("ai_memories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }),
  content: text("content").notNull(),
  context: jsonb("context"),
  confidence: integer("confidence").default(80),
  importance: varchar("importance", { length: 20 }).default('medium'),
  source: varchar("source", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Playbooks - knowledge base for AI agents
export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Playbook usage tracking
export const playbookUsage = pgTable("playbook_usage", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").references(() => playbooks.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  context: text("context"),
  effectivenessRating: integer("effectiveness_rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice recordings cache for AI chat and tour narration
export const voiceRecordingsCache = pgTable("voice_recordings_cache", {
  id: serial("id").primaryKey(),
  textHash: varchar("text_hash", { length: 64 }).notNull(), // SHA-256 hash of the text content
  role: varchar("role", { length: 50 }).notNull(), // director, production-scheduler, etc.
  stepId: varchar("step_id", { length: 100 }).notNull().default(''), // tour step identifier, empty string for non-tour content
  voice: varchar("voice", { length: 20 }).notNull(), // AI voice used (nova, alloy, etc.)
  audioData: text("audio_data").notNull(), // Base64 encoded audio file
  mimeType: varchar("mime_type", { length: 64 }).notNull(), // audio/mpeg, audio/webm, etc.
  encoding: varchar("encoding", { length: 32 }), // codec/encoding info
  sampleRate: integer("sample_rate"), // sample rate in Hz
  channels: smallint("channels").default(1), // number of audio channels
  fileSize: integer("file_size").notNull(), // in bytes
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  usageCount: integer("usage_count").default(1),
}, (table) => {
  return {
    // Composite unique index to allow same text with different voices/roles
    uniqueCache: uniqueIndex("unique_voice_cache").on(table.textHash, table.voice, table.role, table.stepId),
    // Index for LRU eviction
    lastUsedIdx: index("voice_cache_last_used_idx").on(table.lastUsedAt),
  };
});

// Microphone recordings for user voice input and transcription
export const microphoneRecordings = pgTable("microphone_recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  blobHash: varchar("blob_hash", { length: 64 }).notNull(), // SHA-256 hash for deduplication
  mimeType: varchar("mime_type", { length: 64 }).notNull(), // audio/webm, audio/wav, etc.
  sampleRate: integer("sample_rate"), // sample rate in Hz
  channels: smallint("channels").default(1), // number of audio channels
  durationMs: integer("duration_ms").notNull(), // duration in milliseconds
  sizeBytes: integer("size_bytes").notNull(), // file size in bytes
  source: varchar("source", { length: 50 }).notNull(), // 'chat', 'tour', 'mobile', etc.
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'transcribed', 'error'
  transcriptText: text("transcript_text"), // transcribed text result
  language: varchar("language", { length: 10 }).default('en'), // language code (en, es, fr, etc.)
  errorMessage: text("error_message"), // error details if transcription failed
  audioData: text("audio_data").notNull(), // Base64 encoded audio file
  createdAt: timestamp("created_at").defaultNow(),
  transcribedAt: timestamp("transcribed_at"),
}, (table) => {
  return {
    // Unique constraint for deduplication - prevent same recording per user
    uniqueUserBlob: uniqueIndex("unique_user_blob").on(table.userId, table.blobHash),
    // Index for user's recordings
    userIdx: index("mic_recordings_user_idx").on(table.userId),
    // Index for status queries
    statusIdx: index("mic_recordings_status_idx").on(table.status),
  };
});

// ============================================
// AI Scheduling Conversation Tables
// ============================================

export const schedulingConversations = pgTable("scheduling_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }),
  page: varchar("page", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schedulingMessages = pgTable("scheduling_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => schedulingConversations.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maxChatMessages = pgTable("max_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  agentId: varchar("agent_id", { length: 100 }), // Which agent sent this message (e.g., 'max', 'production_scheduling', 'quality_analysis')
  agentName: varchar("agent_name", { length: 255 }), // Display name of the agent
  source: varchar("source", { length: 20 }), // 'header', 'panel', or 'floating'
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Application Tables
// ============================================

export const recentPages = pgTable("recent_pages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  visitedAt: timestamp("visited_at").defaultNow(),
});

// ============================================
// Schema Exports and Types
// ============================================

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertRoleSchema = createInsertSchema(roles);
export const insertPermissionSchema = createInsertSchema(permissions);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);

// API Keys & Authentication schemas
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true, // never allow direct input of hash
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeyUsageSchema = createInsertSchema(apiKeyUsage).omit({
  id: true,
  timestamp: true,
});

export const insertOauthClientSchema = createInsertSchema(oauthClients).omit({
  id: true,
  clientSecret: true, // never allow direct input of secret
  createdAt: true,
  updatedAt: true,
});

export const insertOauthTokenSchema = createInsertSchema(oauthTokens).omit({
  id: true,
  tokenHash: true, // never allow direct input of hash
  lastUsedAt: true,
  createdAt: true,
});
export const insertCompanyOnboardingSchema = createInsertSchema(companyOnboarding);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertPtPlantSchema = createInsertSchema(ptPlants);
export const insertPtManufacturingOrderSchema = createInsertSchema(ptManufacturingOrders);
export const insertPtResourceSchema = createInsertSchema(ptResources);
export const insertRecentPageSchema = createInsertSchema(recentPages);
export const insertProductionOrderSchema = createInsertSchema(productionOrders);
export const insertSchedulingConversationSchema = createInsertSchema(schedulingConversations);
export const insertSchedulingMessageSchema = createInsertSchema(schedulingMessages);
export const insertMaxChatMessageSchema = createInsertSchema(maxChatMessages).omit({ id: true, createdAt: true });
export const insertSavedScheduleSchema = createInsertSchema(savedSchedules);

// AI Agent Team System schemas
export const insertAiAgentTeamSchema = createInsertSchema(aiAgentTeam);
export const insertAgentRecommendationSchema = createInsertSchema(agentRecommendations);
// export const insertAgentActionSchema = createInsertSchema(agentActions);
export const insertAiMemorySchema = createInsertSchema(aiMemories);
export const insertPlaybookSchema = createInsertSchema(playbooks);
export const insertPlaybookUsageSchema = createInsertSchema(playbookUsage);
export const insertVoiceRecordingsCacheSchema = createInsertSchema(voiceRecordingsCache);
export const insertMicrophoneRecordingSchema = createInsertSchema(microphoneRecordings);

// Product Wheel schemas
export const insertPtProductWheelSchema = createInsertSchema(ptProductWheels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPtProductWheelSegmentSchema = createInsertSchema(ptProductWheelSegments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPtProductWheelScheduleSchema = createInsertSchema(ptProductWheelSchedule).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPtProductWheelPerformanceSchema = createInsertSchema(ptProductWheelPerformance).omit({ id: true, createdAt: true });

// Legacy schema aliases for backward compatibility  
export const insertResourceSchema = insertPtResourceSchema;
export const insertPlantSchema = insertPtPlantSchema;
export const insertJobOperationSchema = insertPtJobOperationSchema;
export const insertManufacturingOrderSchema = insertPtManufacturingOrderSchema;
export const insertDepartmentSchema = createInsertSchema(ptPlants); // Placeholder
export const insertCapacityPlanningScenarioSchema = createInsertSchema(ptPlants); // Placeholder
export const insertMrpRunSchema = createInsertSchema(ptPlants); // Placeholder
export const insertDisruptionSchema = createInsertSchema(ptPlants); // Placeholder
export const insertCustomerSchema = createInsertSchema(ptPlants); // Placeholder
export const insertVendorSchema = createInsertSchema(ptPlants); // Placeholder
export const insertSalesOrderSchema = createInsertSchema(ptPlants); // Placeholder
export const insertInventorySchema = createInsertSchema(ptPlants); // Placeholder
export const insertBomSchema = createInsertSchema(ptPlants); // Placeholder
export const insertRoutingSchema = createInsertSchema(ptPlants); // Placeholder

// Product development schemas (placeholders for now)
export const insertStrategyDocumentSchema = createInsertSchema(ptPlants); // Placeholder
export const insertDevelopmentTaskSchema = createInsertSchema(ptPlants); // Placeholder
export const insertTestSuiteSchema = createInsertSchema(ptPlants); // Placeholder
export const insertTestCaseSchema = createInsertSchema(ptPlants); // Placeholder
export const insertArchitectureComponentSchema = createInsertSchema(ptPlants); // Placeholder

// Add more common legacy exports that the frontend might expect
export const insertDiscreteOperationSchema = insertPtJobOperationSchema;
export const insertRecipeOperationSchema = insertPtJobOperationSchema;

// Semantic Query Schemas
export const semanticQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  context: z.enum(["production", "quality", "resources", "scheduling", "general"]).optional().default("general"),
  maxResults: z.number().int().min(1).max(100).optional().default(10),
  includeMetadata: z.boolean().optional().default(false)
});

export type SemanticQuery = z.infer<typeof semanticQuerySchema>;

export const semanticQueryResponseSchema = z.object({
  success: z.boolean(),
  query: z.string(),
  intent: z.string(),
  context: z.string(),
  data: z.any(),
  metadata: z.object({
    executionTime: z.number(),
    dataSource: z.string(),
    confidence: z.number(),
    sqlQuery: z.string().optional(),
    resultCount: z.number()
  }),
  suggestions: z.array(z.string()).optional(),
  relatedQueries: z.array(z.string()).optional()
});

export type SemanticQueryResponse = z.infer<typeof semanticQueryResponseSchema>;

// Product Wheel Types
export type PtProductWheel = typeof ptProductWheels.$inferSelect;
export type InsertPtProductWheel = z.infer<typeof insertPtProductWheelSchema>;
export type PtProductWheelSegment = typeof ptProductWheelSegments.$inferSelect;
export type InsertPtProductWheelSegment = z.infer<typeof insertPtProductWheelSegmentSchema>;
export type PtProductWheelSchedule = typeof ptProductWheelSchedule.$inferSelect;
export type InsertPtProductWheelSchedule = z.infer<typeof insertPtProductWheelScheduleSchema>;
export type PtProductWheelPerformance = typeof ptProductWheelPerformance.$inferSelect;
export type InsertPtProductWheelPerformance = z.infer<typeof insertPtProductWheelPerformanceSchema>;

// Types
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

// API Keys & Authentication types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKeyUsage = typeof apiKeyUsage.$inferSelect;
export type InsertApiKeyUsage = z.infer<typeof insertApiKeyUsageSchema>;
export type OauthClient = typeof oauthClients.$inferSelect;
export type InsertOauthClient = z.infer<typeof insertOauthClientSchema>;
export type OauthToken = typeof oauthTokens.$inferSelect;
export type InsertOauthToken = z.infer<typeof insertOauthTokenSchema>;

// Database Relations for API Keys
export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [apiKeys.roleId],
    references: [roles.id],
  }),
  usage: many(apiKeyUsage),
}));

export const apiKeyUsageRelations = relations(apiKeyUsage, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsage.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const oauthClientsRelations = relations(oauthClients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [oauthClients.createdBy],
    references: [users.id],
  }),
  tokens: many(oauthTokens),
}));

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  client: one(oauthClients, {
    fields: [oauthTokens.clientId],
    references: [oauthClients.id],
  }),
}));
export type CompanyOnboarding = typeof companyOnboarding.$inferSelect;
export type InsertCompanyOnboarding = z.infer<typeof insertCompanyOnboardingSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type PtPlant = typeof ptPlants.$inferSelect;
export type InsertPtPlant = z.infer<typeof insertPtPlantSchema>;
export type PtJobOperation = typeof ptJobOperations.$inferSelect;
export type InsertPtJobOperation = z.infer<typeof insertPtJobOperationSchema>;
export type PtManufacturingOrder = typeof ptManufacturingOrders.$inferSelect;
export type InsertPtManufacturingOrder = z.infer<typeof insertPtManufacturingOrderSchema>;
export type PtResource = typeof ptResources.$inferSelect;
export type InsertPtResource = z.infer<typeof insertPtResourceSchema>;
export type RecentPage = typeof recentPages.$inferSelect;
export type InsertRecentPage = z.infer<typeof insertRecentPageSchema>;
export type SchedulingConversation = typeof schedulingConversations.$inferSelect;
export type InsertSchedulingConversation = z.infer<typeof insertSchedulingConversationSchema>;
export type SchedulingMessage = typeof schedulingMessages.$inferSelect;
export type InsertSchedulingMessage = z.infer<typeof insertSchedulingMessageSchema>;
export type MaxChatMessage = typeof maxChatMessages.$inferSelect;
export type InsertMaxChatMessage = z.infer<typeof insertMaxChatMessageSchema>;
export type SavedSchedule = typeof savedSchedules.$inferSelect;
export type InsertSavedSchedule = z.infer<typeof insertSavedScheduleSchema>;

// AI Agent Team System types
export type AiAgentTeam = typeof aiAgentTeam.$inferSelect;
export type InsertAiAgentTeam = z.infer<typeof insertAiAgentTeamSchema>;
export type AgentRecommendation = typeof agentRecommendations.$inferSelect;
export type InsertAgentRecommendation = z.infer<typeof insertAgentRecommendationSchema>;
// export type AgentAction = typeof agentActions.$inferSelect;
// export type InsertAgentAction = z.infer<typeof insertAgentActionSchema>;
export type AiMemory = typeof aiMemories.$inferSelect;
export type InsertAiMemory = z.infer<typeof insertAiMemorySchema>;
export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;
export type PlaybookUsage = typeof playbookUsage.$inferSelect;
export type InsertPlaybookUsage = z.infer<typeof insertPlaybookUsageSchema>;
export type VoiceRecordingsCache = typeof voiceRecordingsCache.$inferSelect;
export type InsertVoiceRecordingsCache = z.infer<typeof insertVoiceRecordingsCacheSchema>;
export type MicrophoneRecording = typeof microphoneRecordings.$inferSelect;
export type InsertMicrophoneRecording = z.infer<typeof insertMicrophoneRecordingSchema>;

// Product development types (placeholders)
export type StrategyDocument = PtPlant; // Placeholder
export type DevelopmentTask = PtPlant; // Placeholder
export type TestSuite = PtPlant; // Placeholder
export type TestCase = PtPlant; // Placeholder
export type ArchitectureComponent = PtPlant; // Placeholder

// Legacy aliases for backward compatibility
export const plants = ptPlants;
export const resources = ptResources;
export const manufacturingOrders = ptManufacturingOrders;
export const jobOperations = ptJobOperations;
// export const productionOrders = ptManufacturingOrders; // Removed duplicate - using dedicated table above

export type Plant = PtPlant;
export type InsertPlant = InsertPtPlant;
export type Resource = PtResource;
export type InsertResource = InsertPtResource;
export type ManufacturingOrder = PtManufacturingOrder;
export type InsertManufacturingOrder = InsertPtManufacturingOrder;
export type JobOperation = PtJobOperation;
export type InsertJobOperation = InsertPtJobOperation;
export type ProductionOrder = PtManufacturingOrder;
export type InsertProductionOrder = InsertPtManufacturingOrder;

// ============================================
// Command & Control API Schemas
// ============================================

// Job Scheduling Commands
export const scheduleJobCommandSchema = z.object({
  customers: z.string().optional(),
  needDateTime: z.string().datetime(),
  classification: z.string().optional(),
  type: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5),
  importance: z.number().int().min(1).max(10).default(5),
  hot: z.boolean().default(false),
  hotReason: z.string().optional(),
  operations: z.array(z.object({
    operationName: z.string(),
    description: z.string().optional(),
    processTime: z.number().int().positive(),
    setupTime: z.number().int().min(0).default(0),
    teardownTime: z.number().int().min(0).default(0),
    resourceRequirements: z.array(z.string()).optional(), // capability names
  })).min(1),
});

export const rescheduleJobCommandSchema = z.object({
  jobId: z.number().int().positive(),
  newStartDateTime: z.string().datetime(),
  newEndDateTime: z.string().datetime().optional(),
  reason: z.string().min(1),
});

export const prioritizeJobCommandSchema = z.object({
  jobId: z.number().int().positive(),
  newPriority: z.number().int().min(1).max(10),
  reason: z.string().min(1),
});

export const cancelJobCommandSchema = z.object({
  jobId: z.number().int().positive(),
  reason: z.string().min(1),
});

// Resource Management Commands
export const assignResourceCommandSchema = z.object({
  operationId: z.number().int().positive(),
  resourceId: z.number().int().positive(),
  isPrimary: z.boolean().default(true),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
});

export const reassignResourceCommandSchema = z.object({
  fromOperationId: z.number().int().positive(),
  toOperationId: z.number().int().positive(),
  resourceId: z.number().int().positive(),
  reason: z.string().min(1),
});

export const updateResourceAvailabilitySchema = z.object({
  resourceId: z.number().int().positive(),
  availableFrom: z.string().datetime(),
  availableTo: z.string().datetime(),
  availability: z.number().min(0).max(1).default(1), // 0 = unavailable, 1 = fully available
  reason: z.string().optional(),
});

// Quality Control Commands
export const qualityHoldCommandSchema = z.object({
  jobId: z.number().int().positive().optional(),
  operationId: z.number().int().positive().optional(),
  holdType: z.enum(['quality', 'safety', 'maintenance', 'material']),
  reason: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  expectedResolutionTime: z.string().datetime().optional(),
}).refine(data => data.jobId || data.operationId, {
  message: "Either jobId or operationId must be provided"
});

export const releaseHoldCommandSchema = z.object({
  holdId: z.string(),
  resolutionNotes: z.string().min(1),
  approvedBy: z.string().min(1),
});

export const qualityInspectionCommandSchema = z.object({
  operationId: z.number().int().positive(),
  inspectionType: z.enum(['incoming', 'in-process', 'final', 'random']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  inspectorAssigned: z.string().optional(),
  dueDateTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Production Control Commands
export const startOperationCommandSchema = z.object({
  operationId: z.number().int().positive(),
  resourceId: z.number().int().positive().optional(),
  actualStartDateTime: z.string().datetime().optional(),
  operatorNotes: z.string().optional(),
});

export const stopOperationCommandSchema = z.object({
  operationId: z.number().int().positive(),
  actualEndDateTime: z.string().datetime().optional(),
  reason: z.enum(['completed', 'quality_issue', 'equipment_failure', 'material_shortage', 'other']),
  reasonDetails: z.string().optional(),
  operatorNotes: z.string().optional(),
});

export const pauseOperationCommandSchema = z.object({
  operationId: z.number().int().positive(),
  reason: z.enum(['break', 'maintenance', 'material_wait', 'quality_check', 'other']),
  reasonDetails: z.string().optional(),
  expectedResumeTime: z.string().datetime().optional(),
});

// Command Response Types
export const commandResponseSchema = z.object({
  success: z.boolean(),
  commandId: z.string(),
  message: z.string(),
  data: z.any().optional(),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

// Type exports for Command & Control
export type ScheduleJobCommand = z.infer<typeof scheduleJobCommandSchema>;
export type RescheduleJobCommand = z.infer<typeof rescheduleJobCommandSchema>;
export type PrioritizeJobCommand = z.infer<typeof prioritizeJobCommandSchema>;
export type CancelJobCommand = z.infer<typeof cancelJobCommandSchema>;
export type AssignResourceCommand = z.infer<typeof assignResourceCommandSchema>;
export type ReassignResourceCommand = z.infer<typeof reassignResourceCommandSchema>;
export type UpdateResourceAvailability = z.infer<typeof updateResourceAvailabilitySchema>;
export type QualityHoldCommand = z.infer<typeof qualityHoldCommandSchema>;
export type ReleaseHoldCommand = z.infer<typeof releaseHoldCommandSchema>;
export type QualityInspectionCommand = z.infer<typeof qualityInspectionCommandSchema>;
export type StartOperationCommand = z.infer<typeof startOperationCommandSchema>;
export type StopOperationCommand = z.infer<typeof stopOperationCommandSchema>;
export type PauseOperationCommand = z.infer<typeof pauseOperationCommandSchema>;
export type CommandResponse = z.infer<typeof commandResponseSchema>;

// ============================================
// Calendar Management Tables
// ============================================

export const calendars = pgTable("calendars", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Working hours
  startTime: varchar("start_time", { length: 5 }).default("08:00").notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).default("17:00").notNull(), // HH:MM format
  
  // Working days (true = working day, false = non-working day)
  monday: boolean("monday").default(true).notNull(),
  tuesday: boolean("tuesday").default(true).notNull(),
  wednesday: boolean("wednesday").default(true).notNull(),
  thursday: boolean("thursday").default(true).notNull(),
  friday: boolean("friday").default(true).notNull(),
  saturday: boolean("saturday").default(false).notNull(),
  sunday: boolean("sunday").default(false).notNull(),
  
  // Time zone
  timeZone: varchar("time_zone", { length: 50 }).default("UTC").notNull(),
  
  // Associations (null means it's a default/global calendar)
  resourceId: integer("resource_id").references(() => ptResources.id),
  jobId: integer("job_id").references(() => ptJobs.id),
  plantId: integer("plant_id").references(() => ptPlants.id),
  
  // Metadata
  isDefault: boolean("is_default").default(false).notNull(), // Is this a default calendar
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Create enum for recurrence patterns
export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly"
]);

export const maintenancePeriods = pgTable("maintenance_periods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Period definition
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Recurrence settings
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrencePattern: recurrencePatternEnum("recurrence_pattern").default("none"),
  recurrenceInterval: integer("recurrence_interval").default(1), // e.g., every 2 weeks
  recurrenceEndDate: timestamp("recurrence_end_date"), // When the recurrence ends
  
  // Days of week for weekly recurrence (if applicable)
  recurrenceDaysOfWeek: jsonb("recurrence_days_of_week"), // ["monday", "friday"] for weekly pattern
  recurrenceDayOfMonth: integer("recurrence_day_of_month"), // e.g., 15th of each month
  
  // Associations
  resourceId: integer("resource_id").references(() => ptResources.id),
  jobId: integer("job_id").references(() => ptJobs.id),
  plantId: integer("plant_id").references(() => ptPlants.id),
  calendarId: integer("calendar_id").references(() => calendars.id),
  
  // Metadata
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Insert schemas
export const insertCalendarSchema = createInsertSchema(calendars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenancePeriodSchema = createInsertSchema(maintenancePeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = z.infer<typeof insertCalendarSchema>;
export type MaintenancePeriod = typeof maintenancePeriods.$inferSelect;
export type InsertMaintenancePeriod = z.infer<typeof insertMaintenancePeriodSchema>;

// ============================================
// Power BI Types
// ============================================

// Additional types for Power BI frontend
export type ReportEmbedConfig = {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  reportType?: 'Report' | 'PaginatedReport'; // Report type for backend token generation (frontend always uses type: 'report')
  workspaceId?: string; // Workspace ID for token refresh
  datasetId?: string; // Dataset ID for dataset refresh
  expiration?: string; // ISO string indicating when embed token expires
  tokenId?: string; // Token ID for tracking
  parameterValues?: Array<{ name: string; value: string }>; // For paginated report parameters (rp: prefix)
  settings: {
    filterPaneEnabled: boolean;
    parameterPanel?: { // For paginated reports
      expanded?: boolean;
      visible?: boolean;
    };
    navContentPaneEnabled: boolean;
    background: number;
    zoomLevel?: number;
    bars?: {
      statusBar?: {
        visible: boolean;
      };
      actionBar?: {
        visible: boolean;
      };
    };
    panes?: {
      pageNavigation?: {
        visible: boolean;
        position: number; // 0 = Left, 1 = Bottom
      };
      filters?: {
        visible: boolean;
      };
    };
  };
};

export type ReportFilters = {
  startDate?: string;
  endDate?: string;
  region?: string[];
  categories?: string[];
  salesChannel?: string;
  currency?: string;
};

// ============================================
// Workflow Automation Tables
// ============================================

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("manufacturing"),
  
  // Workflow definition
  definition: jsonb("definition").notNull(), // JSON structure defining steps, conditions, etc.
  version: integer("version").default(1).notNull(),
  
  // Trigger configuration
  triggerType: varchar("trigger_type", { length: 50 }).default("manual"), // manual, schedule, event, api
  triggerConfig: jsonb("trigger_config"), // Specific trigger configuration
  
  // Schedule settings (for scheduled triggers)
  cronExpression: varchar("cron_expression", { length: 100 }), // e.g., "0 9 * * *" for daily at 9am
  nextRunAt: timestamp("next_run_at"),
  
  // AI Configuration
  aiEnabled: boolean("ai_enabled").default(true).notNull(),
  aiPrompt: text("ai_prompt"), // Custom prompt for AI assistance
  aiModel: varchar("ai_model", { length: 50 }).default("gpt-4o"),
  
  // Status and metadata
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, archived
  isTemplate: boolean("is_template").default(false),
  tags: text("tags").array(),
  
  // Usage tracking
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  lastExecutedBy: integer("last_executed_by").references(() => users.id),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
  
  // Step definition
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  stepType: varchar("step_type", { length: 50 }).notNull(), // action, condition, loop, parallel, ai_task
  stepOrder: integer("step_order").notNull(),
  
  // Action configuration
  actionType: varchar("action_type", { length: 100 }), // schedule_job, assign_resource, quality_check, etc.
  actionConfig: jsonb("action_config"), // Specific action parameters
  
  // Condition logic
  conditions: jsonb("conditions"), // Conditional logic for branching
  
  // AI configuration for AI-powered steps
  aiEnabled: boolean("ai_enabled").default(false),
  aiTaskDescription: text("ai_task_description"),
  aiExpectedOutput: text("ai_expected_output"),
  
  // Error handling
  retryCount: integer("retry_count").default(0),
  retryDelaySeconds: integer("retry_delay_seconds").default(60),
  onErrorAction: varchar("on_error_action", { length: 50 }).default("stop"), // stop, continue, retry, skip
  
  // Metadata
  estimatedDurationSeconds: integer("estimated_duration_seconds"),
  timeoutSeconds: integer("timeout_seconds").default(3600),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id).notNull(),
  workflowVersion: integer("workflow_version").notNull(),
  
  // Execution details
  executionId: varchar("execution_id", { length: 100 }).unique().notNull(), // UUID for tracking
  status: varchar("status", { length: 50 }).notNull(), // pending, running, completed, failed, cancelled
  
  // Trigger information
  triggeredBy: varchar("triggered_by", { length: 50 }), // manual, schedule, event, api
  triggeredByUserId: integer("triggered_by_user_id").references(() => users.id),
  triggerData: jsonb("trigger_data"), // Any data that triggered the workflow
  
  // Execution context
  inputData: jsonb("input_data"), // Input parameters for the workflow
  outputData: jsonb("output_data"), // Final output from the workflow
  contextData: jsonb("context_data"), // Runtime context and variables
  
  // Progress tracking
  currentStepId: integer("current_step_id").references(() => workflowSteps.id),
  completedSteps: integer("completed_steps").default(0),
  totalSteps: integer("total_steps"),
  progress: numeric("progress", { precision: 5, scale: 2 }).default("0"),
  
  // AI interaction summary
  aiInteractionCount: integer("ai_interaction_count").default(0),
  aiTokensUsed: integer("ai_tokens_used").default(0),
  
  // Performance metrics
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionTimeSeconds: integer("execution_time_seconds"),
  
  // Error tracking
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  failedStepId: integer("failed_step_id").references(() => workflowSteps.id),
  
  createdAt: timestamp("created_at").defaultNow()
});

export const workflowStepExecutions = pgTable("workflow_step_executions", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").references(() => workflowExecutions.id, { onDelete: "cascade" }).notNull(),
  stepId: integer("step_id").references(() => workflowSteps.id).notNull(),
  
  // Execution status
  status: varchar("status", { length: 50 }).notNull(), // pending, running, completed, failed, skipped
  
  // Step data
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  
  // AI interaction (if applicable)
  aiRequest: jsonb("ai_request"),
  aiResponse: jsonb("ai_response"),
  aiTokensUsed: integer("ai_tokens_used"),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMilliseconds: integer("duration_milliseconds"),
  
  // Error handling
  retryAttempt: integer("retry_attempt").default(0),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow()
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  
  // Template content
  templateDefinition: jsonb("template_definition").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  // AI assistance
  aiDescription: text("ai_description"), // Description for AI to understand the template
  suggestedUseCase: text("suggested_use_case"),
  
  // Popularity and usage
  usageCount: integer("usage_count").default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  
  // Metadata
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  isOfficial: boolean("is_official").default(false), // Official templates from PlanetTogether
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const workflowLogs = pgTable("workflow_logs", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").references(() => workflowExecutions.id, { onDelete: "cascade" }).notNull(),
  stepId: integer("step_id").references(() => workflowSteps.id),
  
  // Log details
  level: varchar("level", { length: 20 }).notNull(), // debug, info, warning, error, critical
  message: text("message").notNull(),
  details: jsonb("details"),
  
  // Source information
  source: varchar("source", { length: 100 }), // Component or service that generated the log
  
  // Timestamp
  timestamp: timestamp("timestamp").defaultNow()
});

// Insert schemas for Workflow Automation
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true
});
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

export const insertWorkflowStepExecutionSchema = createInsertSchema(workflowStepExecutions).omit({
  id: true,
  createdAt: true
});
export type InsertWorkflowStepExecution = z.infer<typeof insertWorkflowStepExecutionSchema>;
export type WorkflowStepExecution = typeof workflowStepExecutions.$inferSelect;

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;

export const insertWorkflowLogSchema = createInsertSchema(workflowLogs).omit({
  id: true,
  timestamp: true
});
export type InsertWorkflowLog = z.infer<typeof insertWorkflowLogSchema>;
export type WorkflowLog = typeof workflowLogs.$inferSelect;

// Workflow Triggers - Advanced trigger management for scheduled, event-based, and metric-based execution
export const workflowTriggers = pgTable("workflow_triggers", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
  
  // Trigger identification
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Trigger type: scheduled, event, metric
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // scheduled, event, metric
  
  // Scheduled trigger configuration
  scheduleConfig: jsonb("schedule_config"), // { cronExpression, timezone, startDate, endDate }
  cronExpression: varchar("cron_expression", { length: 100 }), // e.g., "0 9 * * *" for daily at 9am
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  
  // Event-based trigger configuration
  eventConfig: jsonb("event_config"), // { eventType, eventFilters, conditions }
  eventType: varchar("event_type", { length: 100 }), // job_completed, resource_available, quality_alert, etc.
  eventFilters: jsonb("event_filters"), // Filters to match specific events
  
  // Metric-based trigger configuration
  metricConfig: jsonb("metric_config"), // { metricName, threshold, operator, aggregation }
  metricName: varchar("metric_name", { length: 100 }), // production_efficiency, resource_utilization, etc.
  metricThreshold: numeric("metric_threshold", { precision: 10, scale: 2 }), // Threshold value
  metricOperator: varchar("metric_operator", { length: 20 }), // >, <, >=, <=, ==, !=
  metricAggregation: varchar("metric_aggregation", { length: 50 }), // avg, sum, min, max, count
  metricWindow: integer("metric_window_minutes").default(60), // Time window for metric calculation
  
  // Trigger status and control
  isEnabled: boolean("is_enabled").default(true),
  status: varchar("status", { length: 50 }).default("active"), // active, paused, disabled, error
  
  // Execution limits
  maxExecutionsPerDay: integer("max_executions_per_day"),
  maxConcurrentExecutions: integer("max_concurrent_executions").default(1),
  executionTimeout: integer("execution_timeout_seconds").default(3600),
  
  // Trigger statistics
  executionCount: integer("execution_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  lastExecutionStatus: varchar("last_execution_status", { length: 50 }),
  lastExecutionAt: timestamp("last_execution_at"),
  lastError: text("last_error"),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id)
});

// Workflow Trigger Executions - Track each trigger execution
export const workflowTriggerExecutions = pgTable("workflow_trigger_executions", {
  id: serial("id").primaryKey(),
  triggerId: integer("trigger_id").references(() => workflowTriggers.id, { onDelete: "cascade" }).notNull(),
  workflowExecutionId: integer("workflow_execution_id").references(() => workflowExecutions.id),
  
  // Execution details
  status: varchar("status", { length: 50 }).notNull(), // success, failed, skipped
  triggerData: jsonb("trigger_data"), // Data that triggered the execution (event data, metric values, etc.)
  
  // Timing
  triggeredAt: timestamp("triggered_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMilliseconds: integer("duration_milliseconds"),
  
  // Error tracking
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  
  // Metadata
  notes: text("notes")
});

// Insert schemas for Workflow Triggers
export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWorkflowTrigger = z.infer<typeof insertWorkflowTriggerSchema>;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;

export const insertWorkflowTriggerExecutionSchema = createInsertSchema(workflowTriggerExecutions).omit({
  id: true
});
export type InsertWorkflowTriggerExecution = z.infer<typeof insertWorkflowTriggerExecutionSchema>;
export type WorkflowTriggerExecution = typeof workflowTriggerExecutions.$inferSelect;

// ============================================
// Optimization Studio Tables
// ============================================

export const optimizationAlgorithms = pgTable("optimization_algorithms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  baseAlgorithmId: integer("base_algorithm_id").references(() => optimizationAlgorithms.id),
  version: varchar("version", { length: 20 }).default("1.0"),
  status: varchar("status", { length: 20 }).default("draft"),
  isStandard: boolean("is_standard").default(false),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  algorithmCode: text("algorithm_code"),
  uiComponents: jsonb("ui_components").default(sql`'{}'::jsonb`),
  performance: jsonb("performance").default(sql`'{}'::jsonb`),
  approvals: jsonb("approvals").default(sql`'{}'::jsonb`),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const algorithmTests = pgTable("algorithm_tests", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  testType: varchar("test_type", { length: 50 }).notNull(),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  results: jsonb("results"),
  status: varchar("status", { length: 20 }).default("pending"),
  executionTime: integer("execution_time_ms"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const algorithmDeployments = pgTable("algorithm_deployments", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  targetModule: varchar("target_module", { length: 100 }).notNull(),
  environment: varchar("environment", { length: 50 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  deployedBy: integer("deployed_by").references(() => users.id),
  deployedAt: timestamp("deployed_at"),
  metrics: jsonb("metrics").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow()
});

export const algorithmFeedback = pgTable("algorithm_feedback", {
  id: serial("id").primaryKey(),
  algorithmName: varchar("algorithm_name", { length: 100 }).notNull(),
  algorithmVersion: varchar("algorithm_version", { length: 20 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }),
  priority: varchar("priority", { length: 20 }),
  plantId: integer("plant_id"),
  notes: text("notes"),
  executionContext: jsonb("execution_context").default(sql`'{}'::jsonb`),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  suggestedImprovement: text("suggested_improvement"),
  reproducible: boolean("reproducible").default(false),
  reproductionSteps: jsonb("reproduction_steps").default(sql`'[]'::jsonb`),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 20 }).default("new"),
  resolutionNotes: text("resolution_notes"),
  submittedBy: integer("submitted_by").references(() => users.id),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const algorithmFeedbackComments = pgTable("algorithm_feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => algorithmFeedback.id).notNull(),
  comment: text("comment").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const algorithmFeedbackVotes = pgTable("algorithm_feedback_votes", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => algorithmFeedback.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: varchar("vote_type", { length: 10 }).notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow()
});

// ============================================
// Algorithm Requirements Management Tables
// ============================================

export const algorithmRequirements = pgTable("algorithm_requirements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  requirementType: varchar("requirement_type", { length: 50 }).notNull(), // 'functional' or 'policy'
  category: varchar("category", { length: 100 }), // e.g., 'capacity', 'timing', 'sequencing', 'resource'
  priority: varchar("priority", { length: 20 }).default("high"), // 'critical', 'high', 'medium', 'low'
  
  // Validation criteria
  validationRule: text("validation_rule"), // SQL or JSON rule definition
  validationType: varchar("validation_type", { length: 50 }), // 'sql', 'json', 'custom'
  validationParameters: jsonb("validation_parameters").default(sql`'{}'::jsonb`),
  
  // Metadata
  isRelaxable: boolean("is_relaxable").default(false), // For policy requirements
  impactDescription: text("impact_description"), // What happens if requirement is violated
  exampleScenarios: jsonb("example_scenarios").default(sql`'[]'::jsonb`),
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const algorithmRequirementAssociations = pgTable("algorithm_requirement_associations", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  requirementId: integer("requirement_id").references(() => algorithmRequirements.id).notNull(),
  
  // Association configuration
  isEnabled: boolean("is_enabled").default(true),
  enforcementLevel: varchar("enforcement_level", { length: 50 }).default("strict"), // 'strict', 'soft', 'warning'
  customParameters: jsonb("custom_parameters").default(sql`'{}'::jsonb`), // Algorithm-specific parameters for this requirement
  
  // Tracking
  associatedBy: integer("associated_by").references(() => users.id),
  associatedAt: timestamp("associated_at").defaultNow()
});

export const algorithmRequirementValidations = pgTable("algorithm_requirement_validations", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  requirementId: integer("requirement_id").references(() => algorithmRequirements.id).notNull(),
  testRunId: integer("test_run_id").references(() => algorithmTests.id),
  
  // Validation results
  validationStatus: varchar("validation_status", { length: 50 }).notNull(), // 'passed', 'failed', 'warning', 'skipped'
  validationMessage: text("validation_message"),
  violationCount: integer("violation_count").default(0),
  violationDetails: jsonb("violation_details").default(sql`'[]'::jsonb`),
  
  // Performance metrics
  validationTime: integer("validation_time_ms"),
  resourcesChecked: integer("resources_checked"),
  constraintsEvaluated: integer("constraints_evaluated"),
  
  // Test context
  testData: jsonb("test_data").default(sql`'{}'::jsonb`),
  testEnvironment: varchar("test_environment", { length: 50 }),
  
  validatedAt: timestamp("validated_at").defaultNow()
});

export const optimizationProfiles = pgTable("optimization_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id),
  scope: jsonb("scope").default(sql`'{}'::jsonb`),
  objectives: jsonb("objectives").default(sql`'{}'::jsonb`),
  runtimeOptions: jsonb("runtime_options").default(sql`'{}'::jsonb`),
  constraints: jsonb("constraints").default(sql`'{}'::jsonb`),
  validationRules: jsonb("validation_rules").default(sql`'{}'::jsonb`),
  outputSettings: jsonb("output_settings").default(sql`'{}'::jsonb`),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const optimizationRuns = pgTable("optimization_runs", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  profileId: integer("profile_id").references(() => optimizationProfiles.id),
  status: varchar("status", { length: 20 }).default("pending"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  executionTime: integer("execution_time_ms"),
  inputData: jsonb("input_data").default(sql`'{}'::jsonb`),
  outputData: jsonb("output_data").default(sql`'{}'::jsonb`),
  metrics: jsonb("metrics").default(sql`'{}'::jsonb`),
  errors: jsonb("errors").default(sql`'[]'::jsonb`),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const optimizationScopeConfigs = pgTable("optimization_scope_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const extensionData = pgTable("extension_data", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldValue: jsonb("field_value").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const algorithmGovernanceApprovals = pgTable("algorithm_governance_approvals", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  algorithmVersionId: integer("algorithm_version_id").references(() => optimizationAlgorithms.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  approvalLevel: varchar("approval_level", { length: 20 }).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const governanceDeployments = pgTable("governance_deployments", {
  id: serial("id").primaryKey(),
  plantApprovalId: integer("plant_approval_id").references(() => algorithmGovernanceApprovals.id).notNull(),
  deploymentName: varchar("deployment_name", { length: 200 }).notNull(),
  deploymentType: varchar("deployment_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  deployedAt: timestamp("deployed_at"),
  lastRunAt: timestamp("last_run_at"),
  healthStatus: varchar("health_status", { length: 20 }).default("unknown"),
  runStatistics: jsonb("run_statistics").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schema validation for Optimization Studio tables
export const insertOptimizationAlgorithmSchema = createInsertSchema(optimizationAlgorithms)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOptimizationAlgorithm = z.infer<typeof insertOptimizationAlgorithmSchema>;
export type OptimizationAlgorithm = typeof optimizationAlgorithms.$inferSelect;

export const insertAlgorithmTestSchema = createInsertSchema(algorithmTests)
  .omit({ id: true, createdAt: true });
export type InsertAlgorithmTest = z.infer<typeof insertAlgorithmTestSchema>;
export type AlgorithmTest = typeof algorithmTests.$inferSelect;

export const insertAlgorithmDeploymentSchema = createInsertSchema(algorithmDeployments)
  .omit({ id: true, createdAt: true });
export type InsertAlgorithmDeployment = z.infer<typeof insertAlgorithmDeploymentSchema>;
export type AlgorithmDeployment = typeof algorithmDeployments.$inferSelect;

export const insertAlgorithmFeedbackSchema = createInsertSchema(algorithmFeedback)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlgorithmFeedback = z.infer<typeof insertAlgorithmFeedbackSchema>;
export type AlgorithmFeedback = typeof algorithmFeedback.$inferSelect;

// Algorithm Requirements Types
export const insertAlgorithmRequirementSchema = createInsertSchema(algorithmRequirements)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlgorithmRequirement = z.infer<typeof insertAlgorithmRequirementSchema>;
export type AlgorithmRequirement = typeof algorithmRequirements.$inferSelect;

export const insertAlgorithmRequirementAssociationSchema = createInsertSchema(algorithmRequirementAssociations)
  .omit({ id: true, associatedAt: true });
export type InsertAlgorithmRequirementAssociation = z.infer<typeof insertAlgorithmRequirementAssociationSchema>;
export type AlgorithmRequirementAssociation = typeof algorithmRequirementAssociations.$inferSelect;

export const insertAlgorithmRequirementValidationSchema = createInsertSchema(algorithmRequirementValidations)
  .omit({ id: true, validatedAt: true });
export type InsertAlgorithmRequirementValidation = z.infer<typeof insertAlgorithmRequirementValidationSchema>;
export type AlgorithmRequirementValidation = typeof algorithmRequirementValidations.$inferSelect;

export const insertOptimizationProfileSchema = createInsertSchema(optimizationProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOptimizationProfile = z.infer<typeof insertOptimizationProfileSchema>;
export type OptimizationProfile = typeof optimizationProfiles.$inferSelect;

export const insertOptimizationRunSchema = createInsertSchema(optimizationRuns)
  .omit({ id: true, createdAt: true });
export type InsertOptimizationRun = z.infer<typeof insertOptimizationRunSchema>;
export type OptimizationRun = typeof optimizationRuns.$inferSelect;

export const insertOptimizationScopeConfigSchema = createInsertSchema(optimizationScopeConfigs)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOptimizationScopeConfig = z.infer<typeof insertOptimizationScopeConfigSchema>;
export type OptimizationScopeConfig = typeof optimizationScopeConfigs.$inferSelect;

export const insertExtensionDataSchema = createInsertSchema(extensionData)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExtensionData = z.infer<typeof insertExtensionDataSchema>;
export type ExtensionData = typeof extensionData.$inferSelect;

export const insertAlgorithmGovernanceApprovalSchema = createInsertSchema(algorithmGovernanceApprovals)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlgorithmGovernanceApproval = z.infer<typeof insertAlgorithmGovernanceApprovalSchema>;
export type AlgorithmGovernanceApproval = typeof algorithmGovernanceApprovals.$inferSelect;

export const insertGovernanceDeploymentSchema = createInsertSchema(governanceDeployments)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGovernanceDeployment = z.infer<typeof insertGovernanceDeploymentSchema>;
export type GovernanceDeployment = typeof governanceDeployments.$inferSelect;

// ============================================================================
// Schedule Data Exchange Schemas for Production Scheduler ↔ Optimization Studio
// ============================================================================

// Schedule Operation - represents a single operation to be scheduled
export const scheduleOperationSchema = z.object({
  id: z.string(),
  name: z.string(),
  jobId: z.string(),
  jobName: z.string(),
  resourceId: z.string(),
  duration: z.number(), // in hours
  setupTime: z.number().optional(),
  startTime: z.string().optional(), // ISO string
  endTime: z.string().optional(), // ISO string
  priority: z.number().optional(),
  sequenceNumber: z.number().optional(),
  manuallyScheduled: z.boolean().optional(),
  constraints: z.array(z.object({
    type: z.string(),
    value: z.any()
  })).optional()
});
export type ScheduleOperation = z.infer<typeof scheduleOperationSchema>;

// Schedule Resource - represents a production resource
export const scheduleResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  capacity: z.number().optional(),
  availableHours: z.number().optional(),
  efficiency: z.number().optional(),
  capabilities: z.array(z.string()).optional(),
  calendar: z.object({
    workingHours: z.array(z.object({
      dayOfWeek: z.number(),
      startTime: z.string(),
      endTime: z.string()
    })).optional(),
    maintenancePeriods: z.array(z.object({
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional()
    })).optional()
  }).optional()
});
export type ScheduleResource = z.infer<typeof scheduleResourceSchema>;

// Schedule Dependency - represents dependencies between operations
export const scheduleDependencySchema = z.object({
  id: z.string(),
  fromOperationId: z.string(),
  toOperationId: z.string(),
  type: z.enum(['FS', 'FF', 'SS', 'SF']), // Finish-Start, Finish-Finish, Start-Start, Start-Finish
  lag: z.number().optional() // time lag in hours
});
export type ScheduleDependency = z.infer<typeof scheduleDependencySchema>;

// Schedule Constraint - represents global scheduling constraints
export const scheduleConstraintSchema = z.object({
  type: z.enum(['ASAP', 'ALAP', 'SNET', 'SNLT', 'FNLT', 'FNET', 'MFE', 'MSO']),
  enabled: z.boolean(),
  value: z.any().optional()
});
export type ScheduleConstraint = z.infer<typeof scheduleConstraintSchema>;

// Schedule Data Payload - complete schedule data sent to Optimization Studio
export const scheduleDataPayloadSchema = z.object({
  operations: z.array(scheduleOperationSchema),
  resources: z.array(scheduleResourceSchema),
  dependencies: z.array(scheduleDependencySchema),
  constraints: z.array(scheduleConstraintSchema).optional(),
  metadata: z.object({
    horizonStart: z.string(), // ISO string
    horizonEnd: z.string(), // ISO string
    plantId: z.string().optional(),
    scenarioId: z.string().optional(),
    version: z.string().optional()
  }).optional()
});
export type ScheduleDataPayload = z.infer<typeof scheduleDataPayloadSchema>;

// Optimization Run Request - request to run an optimization algorithm
export const optimizationRunRequestSchema = z.object({
  algorithmId: z.string(),
  scheduleData: scheduleDataPayloadSchema,
  parameters: z.record(z.any()).optional(), // algorithm-specific parameters
  runMode: z.enum(['sync', 'async']).default('sync'),
  maxDuration: z.number().optional() // max execution time in seconds
});
export type OptimizationRunRequest = z.infer<typeof optimizationRunRequestSchema>;

// Optimization Run Response - result from running an optimization
export const optimizationRunResponseSchema = z.object({
  runId: z.string(),
  status: z.enum(['success', 'error', 'timeout', 'cancelled']),
  optimizedSchedule: scheduleDataPayloadSchema.optional(),
  metrics: z.object({
    makespan: z.number().optional(),
    resourceUtilization: z.number().optional(),
    onTimeDelivery: z.number().optional(),
    totalSetupTime: z.number().optional(),
    totalIdleTime: z.number().optional()
  }).optional(),
  executionTime: z.number(), // in milliseconds
  warnings: z.array(z.string()).optional(),
  error: z.string().optional()
});
export type OptimizationRunResponse = z.infer<typeof optimizationRunResponseSchema>;

// ============================================
// Saved Forecasts for MRP Integration
// ============================================

export const savedForecasts = pgTable("saved_forecasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Forecast metadata
  modelType: varchar("model_type", { length: 50 }),
  forecastDays: integer("forecast_days"),
  itemColumn: varchar("item_column", { length: 100 }),
  quantityColumn: varchar("quantity_column", { length: 100 }),
  dateColumn: varchar("date_column", { length: 100 }),
  
  // Forecast period
  forecastStartDate: timestamp("forecast_start_date"),
  forecastEndDate: timestamp("forecast_end_date"),
  
  // Items and filters used
  forecastedItems: jsonb("forecasted_items").default(sql`'[]'::jsonb`), // Array of item names
  planningAreas: jsonb("planning_areas").default(sql`'[]'::jsonb`),
  scenarios: jsonb("scenarios").default(sql`'[]'::jsonb`),
  
  // Forecast data table (array of {date, value, lower, upper})
  forecastData: jsonb("forecast_data").notNull(),
  
  // Individual item forecasts if available
  itemForecasts: jsonb("item_forecasts"), // Object with item names as keys
  
  // Accuracy metrics
  metrics: jsonb("metrics"), // MAPE, RMSE, MAE etc.
  
  // System fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================
// Business Goals & Strategic Planning
// ============================================

export const businessGoals = pgTable("business_goals", {
  id: serial("id").primaryKey(),
  goalTitle: varchar("goal_title", { length: 255 }).notNull(),
  goalDescription: text("goal_description"),
  goalType: varchar("goal_type", { length: 50 }), // strategic, operational, tactical
  priority: varchar("priority", { length: 20 }), // low, medium, high, critical
  owner: integer("owner").references(() => users.id),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  targetValue: decimal("target_value"),
  targetUnit: varchar("target_unit", { length: 50 }), // %, $, units, etc.
  category: varchar("category", { length: 100 }),
  goalWeight: integer("goal_weight").default(100),
  businessJustification: text("business_justification"),
  status: varchar("status", { length: 50 }).default("not_started"), // not_started, in_progress, at_risk, completed
  progress: decimal("progress").default("0"), // percentage completion
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const goalProgress = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  progressDate: timestamp("progress_date").notNull(),
  progressValue: decimal("progress_value").notNull(),
  progressPercentage: decimal("progress_percentage"),
  notes: text("notes"),
  reportedBy: integer("reported_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const goalRisks = pgTable("goal_risks", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  riskTitle: varchar("risk_title", { length: 255 }).notNull(),
  riskDescription: text("risk_description"),
  probability: varchar("probability", { length: 20 }), // low, medium, high
  impact: varchar("impact", { length: 20 }), // low, medium, high
  riskScore: integer("risk_score"), // calculated from probability x impact
  mitigationPlan: text("mitigation_plan"),
  status: varchar("status", { length: 50 }).default("identified"), // identified, mitigating, resolved
  assignedTo: integer("assigned_to").references(() => users.id),
  identifiedDate: timestamp("identified_date").defaultNow(),
  resolvedDate: timestamp("resolved_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const goalIssues = pgTable("goal_issues", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  issueTitle: varchar("issue_title", { length: 255 }).notNull(),
  issueDescription: text("issue_description"),
  severity: varchar("severity", { length: 20 }), // low, medium, high, critical
  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, resolved
  rootCause: text("root_cause"),
  resolutionPlan: text("resolution_plan"),
  assignedTo: integer("assigned_to").references(() => users.id),
  estimatedResolutionDate: timestamp("estimated_resolution_date"),
  actualResolutionDate: timestamp("actual_resolution_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const goalActions = pgTable("goal_actions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  actionTitle: varchar("action_title", { length: 255 }).notNull(),
  actionDescription: text("action_description"),
  actionType: varchar("action_type", { length: 50 }), // strategic_initiative, operational_task, etc.
  priority: varchar("priority", { length: 20 }), // low, medium, high, critical
  assignedTo: integer("assigned_to").references(() => users.id),
  budget: decimal("budget"),
  expectedImpact: text("expected_impact"),
  successCriteria: text("success_criteria"),
  dependencies: text("dependencies"),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completionDate: timestamp("completion_date"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  progress: decimal("progress").default("0"),
  // Resource requirements
  resourcesPeople: text("resources_people"),
  resourcesEquipment: text("resources_equipment"),
  resourcesSkills: text("resources_skills"),
  resourcesExternalSupport: text("resources_external_support"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const goalKpis = pgTable("goal_kpis", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => businessGoals.id).notNull(),
  kpiDefinitionId: integer("kpi_definition_id"), // Link to KPI definitions if exists
  kpiName: varchar("kpi_name", { length: 255 }).notNull(),
  kpiDescription: text("kpi_description"),
  targetValue: decimal("target_value"),
  targetUnit: varchar("target_unit", { length: 50 }),
  targetPeriod: varchar("target_period", { length: 50 }), // daily, weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  measurementFrequency: varchar("measurement_frequency", { length: 50 }), 
  dataSource: varchar("data_source", { length: 255 }),
  owner: integer("owner").references(() => users.id),
  status: varchar("status", { length: 50 }).default("active"), // active, paused, completed
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================
// Master Data Types
// ============================================

// Saved Forecasts types
export const insertSavedForecastSchema = createInsertSchema(savedForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertSavedForecast = z.infer<typeof insertSavedForecastSchema>;
export type SavedForecast = typeof savedForecasts.$inferSelect;

// Items types
export const insertItemSchema = createInsertSchema(items).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Capabilities types  
export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCapability = z.infer<typeof insertCapabilitySchema>;
export type Capability = typeof capabilities.$inferSelect;

// Plant KPI Targets types
export const insertPlantKpiTargetSchema = createInsertSchema(plantKpiTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPlantKpiTarget = z.infer<typeof insertPlantKpiTargetSchema>;
export type PlantKpiTarget = typeof plantKpiTargets.$inferSelect;

// Plant KPI Performance types
export const insertPlantKpiPerformanceSchema = createInsertSchema(plantKpiPerformance).omit({
  id: true,
  createdAt: true
});
export type InsertPlantKpiPerformance = z.infer<typeof insertPlantKpiPerformanceSchema>;
export type PlantKpiPerformance = typeof plantKpiPerformance.$inferSelect;

// Autonomous Optimization types
export const insertAutonomousOptimizationSchema = createInsertSchema(autonomousOptimization).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertAutonomousOptimization = z.infer<typeof insertAutonomousOptimizationSchema>;
export type AutonomousOptimization = typeof autonomousOptimization.$inferSelect;

// Business Goals types
export const insertBusinessGoalSchema = createInsertSchema(businessGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBusinessGoal = z.infer<typeof insertBusinessGoalSchema>;
export type BusinessGoal = typeof businessGoals.$inferSelect;

// Goal Progress types
export const insertGoalProgressSchema = createInsertSchema(goalProgress).omit({
  id: true,
  createdAt: true
});
export type InsertGoalProgress = z.infer<typeof insertGoalProgressSchema>;
export type GoalProgress = typeof goalProgress.$inferSelect;

// Goal Risks types
export const insertGoalRiskSchema = createInsertSchema(goalRisks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertGoalRisk = z.infer<typeof insertGoalRiskSchema>;
export type GoalRisk = typeof goalRisks.$inferSelect;

// Goal Issues types
export const insertGoalIssueSchema = createInsertSchema(goalIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertGoalIssue = z.infer<typeof insertGoalIssueSchema>;
export type GoalIssue = typeof goalIssues.$inferSelect;

// Goal Actions types
export const insertGoalActionSchema = createInsertSchema(goalActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertGoalAction = z.infer<typeof insertGoalActionSchema>;
export type GoalAction = typeof goalActions.$inferSelect;

// Goal KPIs types
export const insertGoalKpiSchema = createInsertSchema(goalKpis).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertGoalKpi = z.infer<typeof insertGoalKpiSchema>;
export type GoalKpi = typeof goalKpis.$inferSelect;