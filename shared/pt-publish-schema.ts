/**
 * PT Publish Tables Schema
 * These tables are used for publishing data from PlanetTogether scheduling system
 */

import { pgTable, text, integer, bigint, timestamp, numeric, boolean, pgEnum, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for PT Publish tables
export const ptJobClassificationEnum = pgEnum('ptjob_classification', [
  'production', 'maintenance', 'quality', 'setup', 'changeover', 'other'
]);

export const ptJobTypeEnum = pgEnum('ptjob_type', [
  'manufacturing', 'assembly', 'packaging', 'processing', 'inspection', 'rework'
]);

export const ptColorCodeEnum = pgEnum('ptcolor_code', [
  'red', 'yellow', 'green', 'blue', 'purple', 'orange', 'black', 'white', 'gray'
]);

export const ptScheduledStatusEnum = pgEnum('ptscheduled_status', [
  'scheduled', 'unscheduled', 'partial', 'in_progress', 'completed', 'cancelled'
]);

// PT Publish Jobs table - Main production orders/jobs
export const ptJobs = pgTable("ptjobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  
  // Customer info
  customers: text("customers"),
  customerEmail: text("customer_email"),
  agentEmail: text("agent_email"),
  
  // Dates and timing
  entryDate: timestamp("entry_date"),
  needDateTime: timestamp("need_date_time"),
  scheduledStartDateTime: timestamp("scheduled_start_date_time"),
  scheduledEndDateTime: timestamp("scheduled_end_date_time"),
  holdUntil: text("hold_until"),
  earliestDelivery: text("earliest_delivery"),
  
  // Classification and priority
  classification: ptJobClassificationEnum("classification"),
  type: ptJobTypeEnum("type"),
  priority: integer("priority"),
  importance: integer("importance"),
  hot: boolean("hot"),
  hotReason: text("hot_reason"),
  
  // Status and progress
  scheduled: boolean("scheduled"),
  scheduledStatus: ptScheduledStatusEnum("scheduled_status"),
  finished: boolean("finished"),
  started: boolean("started"),
  percentFinished: integer("percent_finished"),
  cancelled: boolean("cancelled"),
  onHold: text("on_hold"),
  onHoldReason: text("on_hold_reason"),
  hold: boolean("hold"),
  holdReason: text("hold_reason"),
  
  // Basic info
  name: text("name"),
  orderNumber: text("order_number"),
  externalId: text("external_id"),
  description: text("description"),
  notes: text("notes"),
  product: text("product"),
  productDescription: text("product_description"),
  
  // Quantities
  qty: numeric("qty"),
  
  // Costs and financials
  revenue: numeric("revenue"),
  profit: numeric("profit"),
  latePenaltyCost: numeric("late_penalty_cost"),
  expectedLatePenaltyCost: numeric("expected_late_penalty_cost"),
  laborCost: numeric("labor_cost"),
  machineCost: numeric("machine_cost"),
  materialCost: numeric("material_cost"),
  shippingCost: numeric("shipping_cost"),
  subcontractCost: numeric("subcontract_cost"),
  totalCost: numeric("total_cost"),
  throughput: numeric("throughput"),
  
  // Time tracking
  standardHours: numeric("standard_hours"),
  expectedRunHours: numeric("expected_run_hours"),
  expectedSetupHours: numeric("expected_setup_hours"),
  reportedRunHours: numeric("reported_run_hours"),
  reportedSetupHours: numeric("reported_setup_hours"),
  schedulingHours: numeric("scheduling_hours"),
  percentOfStandardHrs: integer("percent_of_standard_hrs"),
  percentOverStandardHrs: integer("percent_over_standard_hrs"),
  
  // Scheduling info
  late: boolean("late"),
  overdue: boolean("overdue"),
  latenessDays: numeric("lateness_days"),
  overdueDays: numeric("overdue_days"),
  startsInDays: integer("starts_in_days"),
  maxEarlyDeliveryDays: numeric("max_early_delivery_days"),
  
  // Resources and constraints
  leadResource: text("lead_resource"),
  resourceNames: text("resource_names"),
  bottlenecks: text("bottlenecks"),
  canSpanPlants: boolean("can_span_plants"),
  failedToScheduleReason: text("failed_to_schedule_reason"),
  
  // Flags and settings
  locked: text("locked"),
  anchored: text("anchored"),
  doNotDelete: boolean("do_not_delete"),
  doNotSchedule: boolean("do_not_schedule"),
  template: boolean("template"),
  colorCode: ptColorCodeEnum("color_code"),
  entryMethod: text("entry_method"),
  
  // Preservation flags
  commitmentPreserved: boolean("commitment_preserved"),
  doNotDeletePreserved: boolean("do_not_delete_preserved"),
  doNotSchedulePreserved: boolean("do_not_schedule_preserved"),
  
  // Additional info
  commitment: text("commitment"),
  enteredToday: boolean("entered_today"),
  printed: boolean("printed"),
  invoiced: boolean("invoiced"),
  shipped: text("shipped"),
  destination: text("destination"),
  reviewed: boolean("reviewed"),
  percentOfMaterialsAvailable: integer("percent_of_materials_available"),
  successorOrderNumbers: text("successor_order_numbers"),
  lowLevelCode: integer("low_level_code")
});

// PT Publish Manufacturing Orders
export const ptManufacturingOrders = pgTable("ptmanufacturing_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  
  // Basic info
  name: text("name"),
  productName: text("product_name"),
  productDescription: text("product_description"),
  description: text("description"),
  notes: text("notes"),
  family: text("family"),
  
  // Quantities
  requiredQty: numeric("required_qty"),
  expectedFinishQty: numeric("expected_finish_qty"),
  
  // Status
  released: boolean("released"),
  releaseDate: timestamp("release_date"),
  scheduled: boolean("scheduled"),
  scheduledStart: text("scheduled_start"),
  scheduledEnd: text("scheduled_end"),
  finished: boolean("finished"),
  frozen: text("frozen"),
  onHold: text("on_hold"),
  holdReason: text("hold_reason"),
  late: boolean("late"),
  latenessDays: numeric("lateness_days"),
  
  // Planning
  leadTimeDays: numeric("lead_time_days"),
  canSpanPlants: boolean("can_span_plants"),
  currentPathId: bigint("current_path_id", { mode: "number" }),
  defaultPathId: bigint("default_path_id", { mode: "number" }),
  locked: text("locked"),
  lockedPlantId: bigint("locked_plant_id", { mode: "number" }),
  
  // Additional fields
  overdue: boolean("overdue"),
  overdueDays: numeric("overdue_days"),
  plannedProductionQty: numeric("planned_production_qty"),
  plantId: bigint("plant_id", { mode: "number" }),
  plantName: text("plant_name"),
  priority: integer("priority"),
  startInDays: integer("start_in_days"),
  started: boolean("started"),
  percentComplete: integer("percent_complete")
});

// PT Publish Job Operations
export const ptJobOperations = pgTable("ptjob_operations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobOperationId: bigint("job_operation_id", { mode: "number" }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  
  // Basic info
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  externalId: text("external_id"),
  
  // Sequencing
  sequenceNumber: integer("sequence_number"),
  pathId: bigint("path_id", { mode: "number" }),
  
  // Status
  scheduled: boolean("scheduled"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  finished: boolean("finished"),
  started: boolean("started"),
  percentComplete: integer("percent_complete"),
  
  // Resource assignment
  resourceId: bigint("resource_id", { mode: "number" }),
  resourceName: text("resource_name"),
  departmentId: bigint("department_id", { mode: "number" }),
  departmentName: text("department_name"),
  
  // Timing
  setupHours: numeric("setup_hours"),
  runHours: numeric("run_hours"),
  postProcessingHours: numeric("post_processing_hours"),
  totalHours: numeric("total_hours"),
  actualSetupHours: numeric("actual_setup_hours"),
  actualRunHours: numeric("actual_run_hours"),
  
  // Quantities
  quantityPerCycle: numeric("quantity_per_cycle"),
  cyclesRequired: numeric("cycles_required"),
  quantityProduced: numeric("quantity_produced"),
  quantityRemaining: numeric("quantity_remaining"),
  
  // Constraints
  mustStartOn: timestamp("must_start_on"),
  mustEndBy: timestamp("must_end_by"),
  canSpanShifts: boolean("can_span_shifts"),
  canSplit: boolean("can_split"),
  
  // Additional info
  priority: integer("priority"),
  late: boolean("late"),
  latenessDays: numeric("lateness_days"),
  critical: boolean("critical"),
  bottleneck: boolean("bottleneck")
});

// PT Publish Resources
export const ptResources = pgTable("ptresources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  resourceId: bigint("resource_id", { mode: "number" }).notNull(),
  
  // Basic info
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  externalId: text("external_id"),
  
  // Classification
  resourceType: text("resource_type"),
  resourceGroup: text("resource_group"),
  departmentId: bigint("department_id", { mode: "number" }),
  departmentName: text("department_name"),
  plantId: bigint("plant_id", { mode: "number" }),
  plantName: text("plant_name"),
  
  // Status
  active: boolean("active"),
  available: boolean("available"),
  downReason: text("down_reason"),
  
  // Capacity
  capacityPerHour: numeric("capacity_per_hour"),
  efficiencyPercent: numeric("efficiency_percent"),
  utilizationPercent: numeric("utilization_percent"),
  
  // Costs
  costPerHour: numeric("cost_per_hour"),
  setupCostPerHour: numeric("setup_cost_per_hour"),
  
  // Scheduling
  finiteCapacity: boolean("finite_capacity"),
  bottleneck: boolean("bottleneck"),
  canRunMultipleJobs: boolean("can_run_multiple_jobs"),
  maxJobsParallel: integer("max_jobs_parallel"),
  
  // Additional info
  priority: integer("priority"),
  colorCode: text("color_code")
});

// PT Publish Job Activities
export const ptJobActivities = pgTable("ptjob_activities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobActivityId: bigint("job_activity_id", { mode: "number" }).notNull(),
  jobOperationId: bigint("job_operation_id", { mode: "number" }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  
  // Basic info
  activityType: text("activity_type"),
  name: text("name"),
  description: text("description"),
  
  // Timing
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  duration: numeric("duration"),
  
  // Status
  status: text("status"),
  percentComplete: integer("percent_complete"),
  
  // Resource assignment
  resourceId: bigint("resource_id", { mode: "number" }),
  resourceName: text("resource_name")
});

// Create insert schemas
export const insertPtPublishJobsSchema = createInsertSchema(ptJobs);
export const insertPtPublishManufacturingOrdersSchema = createInsertSchema(ptManufacturingOrders);
export const insertPtPublishJobOperationsSchema = createInsertSchema(ptJobOperations);
export const insertPtPublishResourcesSchema = createInsertSchema(ptResources);
export const insertPtPublishJobActivitiesSchema = createInsertSchema(ptJobActivities);

// Type exports
export type PtPublishJob = typeof ptJobs.$inferSelect;
export type InsertPtPublishJob = z.infer<typeof insertPtPublishJobsSchema>;

export type PtPublishManufacturingOrder = typeof ptManufacturingOrders.$inferSelect;
export type InsertPtPublishManufacturingOrder = z.infer<typeof insertPtPublishManufacturingOrdersSchema>;

export type PtPublishJobOperation = typeof ptJobOperations.$inferSelect;
export type InsertPtPublishJobOperation = z.infer<typeof insertPtPublishJobOperationsSchema>;

export type PtPublishResource = typeof ptResources.$inferSelect;
export type InsertPtPublishResource = z.infer<typeof insertPtPublishResourcesSchema>;

export type PtPublishJobActivity = typeof ptJobActivities.$inferSelect;
export type InsertPtPublishJobActivity = z.infer<typeof insertPtPublishJobActivitiesSchema>;