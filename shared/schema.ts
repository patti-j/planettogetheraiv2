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

// Minimal ptjobs table matching actual database structure (9 columns)
export const ptJobs = pgTable("ptjobs", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  priority: integer("priority").default(1),
  needDateTime: timestamp("need_date_time"),
  scheduledStatus: varchar("scheduled_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Minimal ptjoboperations table matching actual database structure (17 columns)
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
export const insertCapabilitySchema = createInsertSchema(ptPlants); // Placeholder
export const insertDepartmentSchema = createInsertSchema(ptPlants); // Placeholder
export const insertCapacityPlanningScenarioSchema = createInsertSchema(ptPlants); // Placeholder
export const insertMrpRunSchema = createInsertSchema(ptPlants); // Placeholder
export const insertDisruptionSchema = createInsertSchema(ptPlants); // Placeholder
export const insertCustomerSchema = createInsertSchema(ptPlants); // Placeholder
export const insertVendorSchema = createInsertSchema(ptPlants); // Placeholder
export const insertSalesOrderSchema = createInsertSchema(ptPlants); // Placeholder
export const insertInventorySchema = createInsertSchema(ptPlants); // Placeholder
export const insertItemSchema = createInsertSchema(ptPlants); // Placeholder
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
  workspaceId?: string; // Workspace ID for token refresh
  datasetId?: string; // Dataset ID for dataset refresh
  expiration?: string; // ISO string indicating when embed token expires
  tokenId?: string; // Token ID for tracking
  settings: {
    filterPaneEnabled: boolean;
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