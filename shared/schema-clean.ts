import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// =============================================
// CLEAN MANUFACTURING ERP DATABASE SCHEMA
// =============================================

// 1. ORGANIZATION STRUCTURE
// =============================================

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const workCenters = pgTable("work_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).default("100.00"),
  isActive: boolean("is_active").default(true),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  plantId: integer("plant_id").references(() => plants.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'admin', 'planner', 'operator', 'viewer'
  plantId: integer("plant_id").references(() => plants.id), // Role scope
});

// 2. PRODUCT & PROCESS DEFINITION
// =============================================

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemNumber: text("item_number").unique().notNull(),
  description: text("description").notNull(),
  itemType: text("item_type").notNull(), // 'finished_good', 'raw_material', 'work_in_process'
  unitOfMeasure: text("unit_of_measure").notNull(),
  standardCost: decimal("standard_cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
});

export const billsOfMaterial = pgTable("bills_of_material", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").references(() => items.id).notNull(),
  version: text("version").notNull().default("1"),
  effectiveDate: timestamp("effective_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  isActive: boolean("is_active").default(true),
});

export const bomComponents = pgTable("bom_components", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => billsOfMaterial.id).notNull(),
  componentItemId: integer("component_item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  scrapPercent: decimal("scrap_percent", { precision: 5, scale: 2 }).default("0.00"),
  sequence: integer("sequence").default(10),
});

export const routings = pgTable("routings", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  version: text("version").notNull().default("1"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const routingOperations = pgTable("routing_operations", {
  id: serial("id").primaryKey(),
  routingId: integer("routing_id").references(() => routings.id).notNull(),
  operationNumber: integer("operation_number").notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  description: text("description").notNull(),
  setupTime: decimal("setup_time", { precision: 8, scale: 2 }).default("0.00"), // minutes
  runTime: decimal("run_time", { precision: 8, scale: 2 }).notNull(), // minutes per unit
  sequence: integer("sequence").notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'machine', 'labor', 'tool'
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }).default("1.00"),
  status: text("status").notNull().default("available"), // 'available', 'maintenance', 'down'
});

export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
});

export const resourceCapabilities = pgTable("ptresourcecapabilities", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  capabilityId: integer("capability_id").references(() => capabilities.id).notNull(),
  proficiencyLevel: integer("proficiency_level").default(1), // 1-5 scale
});

// 3. PLANNING & SCHEDULING
// =============================================

export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: integer("priority").default(50), // 1-100
  status: text("status").notNull().default("planned"), // 'planned', 'released', 'active', 'completed', 'cancelled'
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plannedOrders = pgTable("planned_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  requiredDate: timestamp("required_date").notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  isConverted: boolean("is_converted").default(false), // Converted to production order
  createdAt: timestamp("created_at").defaultNow(),
});

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  operationNumber: integer("operation_number").notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(),
  description: text("description").notNull(),
  setupTime: decimal("setup_time", { precision: 8, scale: 2 }).default("0.00"),
  runTime: decimal("run_time", { precision: 8, scale: 2 }).notNull(),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  status: text("status").notNull().default("planned"), // 'planned', 'released', 'active', 'completed'
});

export const resourceAssignments = pgTable("resource_assignments", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => operations.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  assignedQuantity: decimal("assigned_quantity", { precision: 10, scale: 2 }).default("1.00"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
});

// 4. OPTIMIZATION & ANALYTICS
// =============================================

export const optimizationAlgorithms = pgTable("optimization_algorithms", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'scheduling', 'inventory', 'capacity'
  isActive: boolean("is_active").default(true),
  parameters: jsonb("parameters").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const algorithmRuns = pgTable("algorithm_runs", {
  id: serial("id").primaryKey(),
  algorithmId: integer("algorithm_id").references(() => optimizationAlgorithms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  parameters: jsonb("parameters").$type<Record<string, any>>(),
  status: text("status").notNull().default("running"), // 'running', 'completed', 'failed'
  results: jsonb("results").$type<Record<string, any>>(),
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// =============================================
// TYPES AND SCHEMAS
// =============================================

// Insert Schemas
export const insertPlantSchema = createInsertSchema(plants);
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({ id: true, createdAt: true });
export const insertOperationSchema = createInsertSchema(operations).omit({ id: true });

// Select Types
export type Plant = typeof plants.$inferSelect;
export type User = typeof users.$inferSelect;
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type Operation = typeof operations.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Resource = typeof resources.$inferSelect;

// Insert Types
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type InsertOperation = z.infer<typeof insertOperationSchema>;

// =============================================
// RELATIONS
// =============================================

export const plantsRelations = relations(plants, ({ many }) => ({
  departments: many(departments),
  users: many(users),
  productionOrders: many(productionOrders),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  plant: one(plants, {
    fields: [departments.plantId],
    references: [plants.id],
  }),
  workCenters: many(workCenters),
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
  operations: many(operations),
}));

export const operationsRelations = relations(operations, ({ one, many }) => ({
  productionOrder: one(productionOrders, {
    fields: [operations.productionOrderId],
    references: [productionOrders.id],
  }),
  workCenter: one(workCenters, {
    fields: [operations.workCenterId],
    references: [workCenters.id],
  }),
  resourceAssignments: many(resourceAssignments),
}));