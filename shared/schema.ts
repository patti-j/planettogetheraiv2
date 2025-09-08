import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, decimal, primaryKey, index, unique, uniqueIndex } from "drizzle-orm/pg-core";
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
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
});

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
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: integer("plant_id").notNull(),
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

export const ptJobOperations = pgTable("ptjoboperations", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: integer("plant_id").notNull(),
  manufacturingOrderId: integer("manufacturing_order_id"),
  operationId: integer("operation_id"),
  sequenceNumber: integer("sequence_number"),
  operationName: text("operation_name"),
  description: text("description"),
  duration: integer("duration"),
  setupTime: integer("setup_time").default(0),
  processTime: integer("process_time"),
  teardownTime: integer("teardown_time").default(0),
  queueTime: integer("queue_time").default(0),
  moveTime: integer("move_time").default(0),
  waitTime: integer("wait_time").default(0),
  resourceId: integer("resource_id"),
  workCenterName: text("work_center_name"),
  status: varchar("status", { length: 50 }).default("planned"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  efficiency: numeric("efficiency").default(1.0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertCompanyOnboardingSchema = createInsertSchema(companyOnboarding);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertPtPlantSchema = createInsertSchema(ptPlants);
export const insertPtJobOperationSchema = createInsertSchema(ptJobOperations);
export const insertPtManufacturingOrderSchema = createInsertSchema(ptManufacturingOrders);
export const insertPtResourceSchema = createInsertSchema(ptResources);
export const insertRecentPageSchema = createInsertSchema(recentPages);
export const insertProductionOrderSchema = createInsertSchema(productionOrders);

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

// Add more common legacy exports that the frontend might expect
export const insertDiscreteOperationSchema = insertPtJobOperationSchema;
export const insertRecipeOperationSchema = insertPtJobOperationSchema;

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