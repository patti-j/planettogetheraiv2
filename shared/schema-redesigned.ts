import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, decimal, primaryKey, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// =============================================
// REDESIGNED SUPPLY CHAIN MANAGEMENT SCHEMA
// Based on existing tables but cleaned and optimized
// =============================================

// =============================================================================
// 1. ORGANIZATIONAL STRUCTURE
// =============================================================================

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  address: text("address"),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  departmentCode: text("department_code").unique().notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
});

export const workCenters = pgTable("work_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workCenterCode: text("work_center_code").unique().notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).default("100.00"),
  costCenter: text("cost_center"),
  isActive: boolean("is_active").default(true),
});

// =============================================================================
// 2. USER MANAGEMENT & SECURITY
// =============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  primaryPlantId: integer("primary_plant_id").references(() => plants.id),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id), // Role scope
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  userRoleUnique: unique().on(table.userId, table.roleId, table.plantId),
}));

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  theme: text("theme").default("light"), // light, dark
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),
  dateFormat: text("date_format").default("MM/dd/yyyy"),
  timeFormat: text("time_format").default("12h"), // 12h, 24h
  dashboardLayout: jsonb("dashboard_layout").$type<any>().default({}),
  notificationSettings: jsonb("notification_settings").$type<{
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  }>().default({}),
  maxAiSettings: jsonb("max_ai_settings").$type<{
    isOpen?: boolean;
    dockPosition?: string;
    preferredModel?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recentPages = pgTable("recent_pages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pagePath: text("page_path").notNull(),
  pageTitle: text("page_title").notNull(),
  pageIcon: text("page_icon"), // Icon name for display
  visitedAt: timestamp("visited_at").defaultNow(),
  visitCount: integer("visit_count").default(1),
  isPinned: boolean("is_pinned").default(false),
}, (table) => ({
  userPageUnique: unique().on(table.userId, table.pagePath),
  userIdIdx: index("recent_pages_user_id_idx").on(table.userId),
  visitedAtIdx: index("recent_pages_visited_at_idx").on(table.visitedAt),
}));

// =============================================================================
// 3. MASTER DATA - ITEMS & MATERIALS
// =============================================================================

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemNumber: text("item_number").unique().notNull(),
  description: text("description").notNull(),
  itemType: text("item_type").notNull(), // 'finished_good', 'raw_material', 'semi_finished', 'service'
  category: text("category"), // Product grouping
  unitOfMeasure: text("unit_of_measure").notNull(),
  standardCost: decimal("standard_cost", { precision: 12, scale: 4 }),
  weight: decimal("weight", { precision: 10, scale: 4 }),
  dimensions: jsonb("dimensions").$type<{
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itemPlants = pgTable("item_plants", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  isManufactured: boolean("is_manufactured").default(false),
  isPurchased: boolean("is_purchased").default(false),
  leadTime: integer("lead_time_days").default(0),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 2 }).default("0"),
  maximumStock: decimal("maximum_stock", { precision: 10, scale: 2 }),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  itemPlantUnique: unique().on(table.itemId, table.plantId),
}));

// =============================================================================
// 4. PRODUCT STRUCTURE - BILLS OF MATERIAL
// =============================================================================

export const billsOfMaterial = pgTable("bills_of_material", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").references(() => items.id).notNull(),
  version: text("version").notNull().default("1"),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  bomType: text("bom_type").notNull().default("manufacturing"), // 'manufacturing', 'engineering', 'costing'
  baseQuantity: decimal("base_quantity", { precision: 10, scale: 4 }).default("1"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  bomVersionUnique: unique().on(table.parentItemId, table.version, table.plantId),
}));

export const bomComponents = pgTable("bom_components", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => billsOfMaterial.id).notNull(),
  componentItemId: integer("component_item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 6 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  scrapPercent: decimal("scrap_percent", { precision: 5, scale: 2 }).default("0.00"),
  positionNumber: integer("position_number").notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  bomPositionUnique: unique().on(table.bomId, table.positionNumber),
}));

// =============================================================================
// 5. MANUFACTURING PROCESSES - ROUTINGS
// =============================================================================

export const routings = pgTable("routings", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  version: text("version").notNull().default("1"),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  routingType: text("routing_type").notNull().default("standard"), // 'standard', 'alternative', 'rework'
  description: text("description"),
  totalLeadTime: decimal("total_lead_time", { precision: 8, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  routingVersionUnique: unique().on(table.itemId, table.version, table.plantId),
}));

export const routingOperations = pgTable("routing_operations", {
  id: serial("id").primaryKey(),
  routingId: integer("routing_id").references(() => routings.id).notNull(),
  operationNumber: text("operation_number").notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  description: text("description").notNull(),
  operationType: text("operation_type").default("production"), // 'production', 'setup', 'quality', 'transport'
  setupTime: decimal("setup_time", { precision: 8, scale: 2 }).default("0.00"), // minutes
  runTimePerUnit: decimal("run_time_per_unit", { precision: 8, scale: 4 }).notNull(), // minutes per unit
  laborTime: decimal("labor_time", { precision: 8, scale: 2 }),
  machineTime: decimal("machine_time", { precision: 8, scale: 2 }),
  sequence: integer("sequence").notNull(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  routingOperationUnique: unique().on(table.routingId, table.operationNumber),
}));

// =============================================================================
// 6. RESOURCE MANAGEMENT
// =============================================================================

export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  category: text("category"), // 'machining', 'assembly', 'testing', 'packaging'
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  resourceCode: text("resource_code").unique().notNull(),
  type: text("type").notNull(), // 'machine', 'labor', 'tool', 'equipment'
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }).default("1.00"),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).default("100.00"),
  costPerHour: decimal("cost_per_hour", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("available"), // 'available', 'maintenance', 'down', 'setup'
  capabilities: jsonb("capabilities").$type<number[]>().default([]),
  isActive: boolean("is_active").default(true),
});

export const resourceCapabilities = pgTable("resource_capabilities", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  capabilityId: integer("capability_id").references(() => capabilities.id).notNull(),
  proficiencyLevel: integer("proficiency_level").default(5), // 1-10 scale
  certificationRequired: boolean("certification_required").default(false),
}, (table) => ({
  resourceCapabilityUnique: unique().on(table.resourceId, table.capabilityId),
}));

// =============================================================================
// 7. PLANNING & SCHEDULING
// =============================================================================

export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: integer("priority").default(50), // 1-100
  status: text("status").notNull().default("planned"), // 'planned', 'released', 'active', 'hold', 'completed', 'cancelled'
  customer: text("customer"),
  salesOrderNumber: text("sales_order_number"),
  bomId: integer("bom_id").references(() => billsOfMaterial.id),
  routingId: integer("routing_id").references(() => routings.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
});

export const plannedOrders = pgTable("planned_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  requiredDate: timestamp("required_date").notNull(),
  planningHorizon: text("planning_horizon").default("weekly"), // 'daily', 'weekly', 'monthly'
  sourceDemand: text("source_demand"), // 'sales_order', 'forecast', 'safety_stock'
  sourceDemandId: integer("source_demand_id"),
  isConverted: boolean("is_converted").default(false),
  convertedToOrderId: integer("converted_to_order_id").references(() => productionOrders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  operationNumber: text("operation_number").notNull(),
  routingOperationId: integer("routing_operation_id").references(() => routingOperations.id),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  description: text("description").notNull(),
  sequence: integer("sequence").notNull(),
  status: text("status").notNull().default("planned"), // 'planned', 'released', 'active', 'hold', 'completed', 'cancelled'
  setupTime: decimal("setup_time", { precision: 8, scale: 2 }).default("0.00"),
  runTime: decimal("run_time", { precision: 8, scale: 2 }).notNull(),
  queueTime: decimal("queue_time", { precision: 8, scale: 2 }).default("0.00"),
  moveTime: decimal("move_time", { precision: 8, scale: 2 }).default("0.00"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id),
}, (table) => ({
  operationUnique: unique().on(table.productionOrderId, table.operationNumber),
}));

// =============================================================================
// 8. SUPPLY CHAIN - VENDORS & CUSTOMERS
// =============================================================================

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorCode: text("vendor_code").unique().notNull(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  currency: text("currency").default("USD"),
  paymentTerms: text("payment_terms"),
  leadTime: integer("lead_time_days").default(0),
  qualityRating: integer("quality_rating"), // 1-10
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerCode: text("customer_code").unique().notNull(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  currency: text("currency").default("USD"),
  paymentTerms: text("payment_terms"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// 9. INVENTORY MANAGEMENT
// =============================================================================

export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  locationCode: text("location_code").unique().notNull(),
  name: text("name").notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  locationType: text("location_type").notNull(), // 'raw_material', 'wip', 'finished_goods', 'quarantine'
  capacity: decimal("capacity", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true),
});

export const inventoryBalances = pgTable("inventory_balances", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id).notNull(),
  quantityOnHand: decimal("quantity_on_hand", { precision: 12, scale: 4 }).default("0"),
  quantityReserved: decimal("quantity_reserved", { precision: 12, scale: 4 }).default("0"),
  quantityAvailable: decimal("quantity_available", { precision: 12, scale: 4 }).default("0"),
  unitCost: decimal("unit_cost", { precision: 12, scale: 4 }),
  lastMovementDate: timestamp("last_movement_date"),
  lastCountDate: timestamp("last_count_date"),
}, (table) => ({
  inventoryUnique: unique().on(table.itemId, table.storageLocationId),
}));

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id).notNull(),
  transactionType: text("transaction_type").notNull(), // 'receipt', 'issue', 'transfer', 'adjustment', 'count'
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 4 }),
  referenceType: text("reference_type"), // 'production_order', 'purchase_order', 'sales_order'
  referenceId: integer("reference_id"),
  reasonCode: text("reason_code"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
});

// =============================================================================
// 10. OPTIMIZATION ALGORITHMS
// =============================================================================

export const optimizationAlgorithms = pgTable("optimization_algorithms", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'scheduling', 'inventory', 'capacity', 'routing'
  algorithmType: text("algorithm_type").notNull(), // 'genetic', 'simulated_annealing', 'linear_programming', 'heuristic'
  version: text("version").notNull().default("1.0.0"),
  isActive: boolean("is_active").default(true),
  parameters: jsonb("parameters").$type<Record<string, {
    type: string;
    default: any;
    min?: number;
    max?: number;
    options?: string[];
    description: string;
    required: boolean;
  }>>(),
  objectives: jsonb("objectives").$type<Array<{
    name: string;
    type: "minimize" | "maximize";
    weight: number;
    description: string;
  }>>(),
  constraints: jsonb("constraints").$type<Array<{
    name: string;
    type: string;
    value: any;
    description: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const algorithmRuns = pgTable("algorithm_runs", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id),
  runName: text("run_name"),
  parameters: jsonb("parameters").$type<Record<string, any>>(),
  status: text("status").notNull().default("running"), // 'running', 'completed', 'failed', 'cancelled'
  results: jsonb("results").$type<{
    objective_values: Record<string, number>;
    solution_quality: number;
    iterations: number;
    convergence_time: number;
    recommendations: Array<{
      type: string;
      description: string;
      impact: string;
      priority: number;
    }>;
    performance_metrics: Record<string, number>;
  }>(),
  executionTimeMs: integer("execution_time_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// =============================================================================
// RELATIONS DEFINITIONS
// =============================================================================

export const plantsRelations = relations(plants, ({ many }) => ({
  departments: many(departments),
  users: many(users),
  productionOrders: many(productionOrders),
  plannedOrders: many(plannedOrders),
  itemPlants: many(itemPlants),
  storageLocations: many(storageLocations),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  plant: one(plants, {
    fields: [departments.plantId],
    references: [plants.id],
  }),
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
  }),
  workCenters: many(workCenters),
}));

export const workCentersRelations = relations(workCenters, ({ one, many }) => ({
  department: one(departments, {
    fields: [workCenters.departmentId],
    references: [departments.id],
  }),
  resources: many(resources),
  routingOperations: many(routingOperations),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  primaryPlant: one(plants, {
    fields: [users.primaryPlantId],
    references: [plants.id],
  }),
  userRoles: many(userRoles),
  preferences: one(userPreferences),
  recentPages: many(recentPages),
  productionOrders: many(productionOrders),
  algorithmRuns: many(algorithmRuns),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  itemPlants: many(itemPlants),
  billsOfMaterial: many(billsOfMaterial),
  bomComponents: many(bomComponents),
  routings: many(routings),
  productionOrders: many(productionOrders),
  plannedOrders: many(plannedOrders),
  inventoryBalances: many(inventoryBalances),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  item: one(items, {
    fields: [productionOrders.itemId],
    references: [items.id],
  }),
  plant: one(plants, {
    fields: [productionOrders.plantId],
    references: [plants.id],
  }),
  bom: one(billsOfMaterial, {
    fields: [productionOrders.bomId],
    references: [billsOfMaterial.id],
  }),
  routing: one(routings, {
    fields: [productionOrders.routingId],
    references: [routings.id],
  }),
  createdByUser: one(users, {
    fields: [productionOrders.createdBy],
    references: [users.id],
  }),
  operations: many(operations),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  productionOrder: one(productionOrders, {
    fields: [operations.productionOrderId],
    references: [productionOrders.id],
  }),
  workCenter: one(workCenters, {
    fields: [operations.workCenterId],
    references: [workCenters.id],
  }),
  routingOperation: one(routingOperations, {
    fields: [operations.routingOperationId],
    references: [routingOperations.id],
  }),
  assignedResource: one(resources, {
    fields: [operations.assignedResourceId],
    references: [resources.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const recentPagesRelations = relations(recentPages, ({ one }) => ({
  user: one(users, {
    fields: [recentPages.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Insert Schemas
export const insertPlantSchema = createInsertSchema(plants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true });
export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({ id: true, createdAt: true });
export const insertOperationSchema = createInsertSchema(operations).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecentPageSchema = createInsertSchema(recentPages).omit({ id: true, visitedAt: true });

// Select Types
export type Plant = typeof plants.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type WorkCenter = typeof workCenters.$inferSelect;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ItemPlant = typeof itemPlants.$inferSelect;
export type BillOfMaterial = typeof billsOfMaterial.$inferSelect;
export type BomComponent = typeof bomComponents.$inferSelect;
export type Routing = typeof routings.$inferSelect;
export type RoutingOperation = typeof routingOperations.$inferSelect;
export type Capability = typeof capabilities.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ResourceCapability = typeof resourceCapabilities.$inferSelect;
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type PlannedOrder = typeof plannedOrders.$inferSelect;
export type Operation = typeof operations.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type RecentPage = typeof recentPages.$inferSelect;
export type StorageLocation = typeof storageLocations.$inferSelect;
export type InventoryBalance = typeof inventoryBalances.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type OptimizationAlgorithm = typeof optimizationAlgorithms.$inferSelect;
export type AlgorithmRun = typeof algorithmRuns.$inferSelect;

// Insert Types
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertRecentPage = z.infer<typeof insertRecentPageSchema>;