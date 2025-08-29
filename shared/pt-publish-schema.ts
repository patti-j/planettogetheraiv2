import { pgTable, text, bigint, numeric, timestamp, boolean, integer, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================
// Core Master Data Tables
// ============================================

export const ptPlants = pgTable("pt_plants", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  bottleneckThreshold: numeric("bottleneck_threshold"),
  heavyLoadThreshold: numeric("heavy_load_threshold"),
  externalId: text("external_id"),
  attributesSummary: text("attributes_summary"),
  departmentCount: integer("department_count"),
  stableDays: numeric("stable_days"),
  dailyOperatingExpense: numeric("daily_operating_expense"),
  investedCapital: numeric("invested_capital"),
  annualPercentageRate: numeric("annual_percentage_rate"),
  isActive: boolean("is_active").default(true), // Added for monitoring agent compatibility
});

export const ptDepartments = pgTable("pt_departments", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  departmentId: bigint("department_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  externalId: text("external_id"),
  attributesSummary: text("attributes_summary"),
  plantName: text("plant_name"),
  resourceCount: integer("resource_count"),
  departmentFrozenSpanDays: numeric("department_frozen_span_days"),
});

export const ptResources = pgTable("pt_resources", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  departmentId: bigint("department_id", { mode: "number" }).notNull(),
  resourceId: bigint("resource_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  bottleneck: boolean("bottleneck"),
  bufferHours: numeric("buffer_hours"),
  capacityType: text("capacity_type"),
  drum: boolean("drum"),
  overtimeHourlyCost: numeric("overtime_hourly_cost"),
  standardHourlyCost: numeric("standard_hourly_cost"),
  experimentalDispatcher: bigint("experimental_dispatcher", { mode: "number" }),
  normalDispatcher: bigint("normal_dispatcher", { mode: "number" }),
  workcenter: text("workcenter"),
  canOffload: boolean("can_offload"),
  canPreemptMaterials: boolean("can_preempt_materials"),
  canPreemptPredecessors: boolean("can_preempt_predecessors"),
  canWorkOvertime: boolean("can_work_overtime"),
  compatibilityGroup: text("compatibility_group"),
  cycleEfficiencyMultiplier: numeric("cycle_efficiency_multiplier"),
  headStartHours: numeric("head_start_hours"),
  postActivityRestHours: numeric("post_activity_rest_hours"),
  stage: integer("stage"),
  transferHours: numeric("transfer_hours"),
  consecutiveSetupTimes: boolean("consecutive_setup_times"),
  maxSameSetupHours: numeric("max_same_setup_hours"),
  setupEfficiencyMultiplier: numeric("setup_efficiency_multiplier"),
  setupIncluded: text("setup_included"),
  setupHours: numeric("setup_hours"),
  useOperationSetupTime: boolean("use_operation_setup_time"),
  active: boolean("active"),
  sameCell: boolean("same_cell"),
  currentProductSetup: text("current_product_setup"),
  currentSetupCode: text("current_setup_code"),
  currentSetupNumber: numeric("current_setup_number"),
  resourceType: text("resource_type"),
  externalId: text("external_id"),
  alwaysShowPostProcessing: boolean("always_show_post_processing"),
  attributeCodeTableName: text("attribute_code_table_name"),
  attributesSummary: text("attributes_summary"),
  bottleneckPercent: numeric("bottleneck_percent"),
  bufferHrs: numeric("buffer_hrs"),
  cellName: text("cell_name"),
  disallowDragAndDrops: boolean("disallow_drag_and_drops"),
  excludeFromGantts: boolean("exclude_from_gantts"),
  experimentalOptimizeRule: text("experimental_optimize_rule"),
  ganttRowHeightFactor: integer("gantt_row_height_factor"),
  headStartDays: numeric("head_start_days"),
  imageFileName: text("image_file_name"),
  maxQty: numeric("max_qty"),
  maxQtyPerCycle: numeric("max_qty_per_cycle"),
  maxSameSetupHrs: numeric("max_same_setup_hrs"),
  minQty: numeric("min_qty"),
  minQtyPerCycle: numeric("min_qty_per_cycle"),
  nbrCapabilities: integer("nbr_capabilities"),
  normalOptimizeRule: text("normal_optimize_rule"),
  overlappingOnlineIntervals: integer("overlapping_online_intervals"),
  sequential: boolean("sequential"),
  setupCodeTableName: text("setup_code_table_name"),
  setupHrs: numeric("setup_hrs"),
  shopViewUsersCount: integer("shop_view_users_count"),
  transferHrs: numeric("transfer_hrs"),
  workcenterExternalId: text("workcenter_external_id"),
  maxCumulativeQty: numeric("max_cumulative_qty"),
  manualAssignmentOnly: boolean("manual_assignment_only"),
  isTank: boolean("is_tank"),
  minNbrOfPeople: numeric("min_nbr_of_people"),
  batchType: text("batch_type"),
  batchVolume: numeric("batch_volume"),
  autoJoinHrs: numeric("auto_join_hrs"),
  omitSetupOnFirstActivity: boolean("omit_setup_on_first_activity"),
  omitSetupOnFirstActivityInShift: boolean("omit_setup_on_first_activity_in_shift"),
  minVolume: numeric("min_volume"),
  maxVolume: numeric("max_volume"),
});

export const ptCapabilities = pgTable("pt_capabilities", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  capabilityId: bigint("capability_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  externalId: text("external_id"),
});

export const ptResourceCapabilities = pgTable("pt_resource_capabilities", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  capabilityId: bigint("capability_id", { mode: "number" }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  departmentId: bigint("department_id", { mode: "number" }).notNull(),
  resourceId: bigint("resource_id", { mode: "number" }).notNull(),
});

// ============================================
// Item and Inventory Tables
// ============================================

export const ptItems = pgTable("pt_items", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  itemId: bigint("item_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  externalId: text("external_id"),
  notes: text("notes"),
  source: text("source"),
  itemType: text("item_type"),
  defaultLeadTimeDays: numeric("default_lead_time_days"),
  attributesSummary: text("attributes_summary"),
  batchSize: numeric("batch_size"),
  batchWindowDays: numeric("batch_window_days"),
  itemGroup: text("item_group"),
  minOrderQty: numeric("min_order_qty"),
  maxOrderQty: numeric("max_order_qty"),
  minOrderQtyRoundupLimit: numeric("min_order_qty_roundup_limit"),
  jobAutoSplitQty: numeric("job_auto_split_qty"),
  plan: boolean("plan"),
  shelfLifeDays: numeric("shelf_life_days"),
  transferQty: numeric("transfer_qty"),
  rollupAttributesToParent: boolean("rollup_attributes_to_parent"),
  cost: numeric("cost"),
});

export const ptWarehouses = pgTable("pt_warehouses", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  warehouseId: bigint("warehouse_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  externalId: text("external_id"),
  nbrOfDocks: integer("nbr_of_docks"),
  notes: text("notes"),
  attributesSummary: text("attributes_summary"),
  storageCapacity: numeric("storage_capacity"),
  annualPercentageRate: numeric("annual_percentage_rate"),
  tankWarehouse: boolean("tank_warehouse"),
});

export const ptPlantWarehouses = pgTable("pt_plant_warehouses", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  warehouseId: bigint("warehouse_id", { mode: "number" }).notNull(),
});

export const ptInventories = pgTable("pt_inventories", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  itemId: bigint("item_id", { mode: "number" }).notNull(),
  warehouseId: bigint("warehouse_id", { mode: "number" }).notNull(),
  inventoryId: bigint("inventory_id", { mode: "number" }).notNull(),
  leadTimeDays: numeric("lead_time_days"),
  bufferStock: numeric("buffer_stock"),
  safetyStock: numeric("safety_stock"),
  safetyStockWarningLevel: numeric("safety_stock_warning_level"),
  onHandQty: numeric("on_hand_qty"),
  plannerExternalId: text("planner_external_id"),
  storageCapacity: numeric("storage_capacity"),
  safetyStockJobPriority: integer("safety_stock_job_priority"),
  forecastConsumption: text("forecast_consumption"),
  mrpProcessing: text("mrp_processing"),
  mrpNotes: text("mrp_notes"),
  templateJobId: bigint("template_job_id", { mode: "number" }),
  templateManufacturingOrderId: bigint("template_manufacturing_order_id", { mode: "number" }),
  haveTemplateManufacturingOrderId: boolean("have_template_manufacturing_order_id"),
  bufferPenetrationPercent: numeric("buffer_penetration_percent"),
  autoGenerateForecasts: boolean("auto_generate_forecasts"),
  forecastInterval: text("forecast_interval"),
  numberOfIntervalsToForecast: integer("number_of_intervals_to_forecast"),
  materialAllocation: text("material_allocation"),
});

export const ptLots = pgTable("pt_lots", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  lotId: bigint("lot_id", { mode: "number" }).notNull(),
  externalId: text("external_id"),
  inventoryId: bigint("inventory_id", { mode: "number" }),
  lotSource: text("lot_source"),
  qty: numeric("qty"),
  productionDate: timestamp("production_date"),
  code: text("code"),
  wearAmount: integer("wear_amount"),
  limitMatlSrcToEligibleLots: boolean("limit_matl_src_to_eligible_lots"),
});

// ============================================
// Job and Manufacturing Order Tables
// ============================================

export const ptJobs = pgTable("pt_jobs", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  customers: text("customers"),
  entryDate: timestamp("entry_date"),
  needDateTime: timestamp("need_date_time"),
  classification: text("classification"),
  commitment: text("commitment"),
  hot: boolean("hot"),
  hotReason: text("hot_reason"),
  importance: integer("importance"),
  cancelled: boolean("cancelled"),
  latePenaltyCost: numeric("late_penalty_cost"),
  maxEarlyDeliveryDays: numeric("max_early_delivery_days"),
  priority: integer("priority"),
  type: text("type"),
  revenue: numeric("revenue"),
  profit: numeric("profit"),
  scheduled: boolean("scheduled"),
  scheduledStartDateTime: timestamp("scheduled_start_date_time"),
  scheduledEndDateTime: timestamp("scheduled_end_date_time"),
  leadResource: text("lead_resource"),
  startsInDays: integer("starts_in_days"),
  latenessDays: numeric("lateness_days"),
  late: boolean("late"),
  overdue: boolean("overdue"),
  description: text("description"),
  notes: text("notes"),
  finished: boolean("finished"),
  name: text("name"),
  doNotDelete: boolean("do_not_delete"),
  externalId: text("external_id"),
  locked: text("locked"),
  anchored: text("anchored"),
  orderNumber: text("order_number"),
  onHold: text("on_hold"),
  onHoldReason: text("on_hold_reason"),
  template: boolean("template"),
  customerEmail: text("customer_email"),
  agentEmail: text("agent_email"),
  doNotSchedule: boolean("do_not_schedule"),
  colorCode: text("color_code"),
  entryMethod: text("entry_method"),
  holdUntil: timestamp("hold_until"),
  percentFinished: integer("percent_finished"),
  scheduledStatus: text("scheduled_status"),
  standardHours: numeric("standard_hours"),
  attributesSummary: text("attributes_summary"),
  bottlenecks: text("bottlenecks"),
  canSpanPlants: boolean("can_span_plants"),
  commitmentPreserved: boolean("commitment_preserved"),
  doNotDeletePreserved: boolean("do_not_delete_preserved"),
  doNotSchedulePreserved: boolean("do_not_schedule_preserved"),
  earliestDelivery: timestamp("earliest_delivery"),
  enteredToday: boolean("entered_today"),
  expectedRunHours: numeric("expected_run_hours"),
  expectedSetupHours: numeric("expected_setup_hours"),
  failedToScheduleReason: text("failed_to_schedule_reason"),
  hold: boolean("hold"),
  holdReason: text("hold_reason"),
  laborCost: numeric("labor_cost"),
  machineCost: numeric("machine_cost"),
  materialCost: numeric("material_cost"),
  overdueDays: numeric("overdue_days"),
  percentOfStandardHrs: integer("percent_of_standard_hrs"),
  percentOverStandardHrs: integer("percent_over_standard_hrs"),
  product: text("product"),
  productDescription: text("product_description"),
  qty: numeric("qty"),
  reportedRunHours: numeric("reported_run_hours"),
  reportedSetupHours: numeric("reported_setup_hours"),
  schedulingHours: numeric("scheduling_hours"),
  started: boolean("started"),
  throughput: numeric("throughput"),
  shippingCost: numeric("shipping_cost"),
  expectedLatePenaltyCost: numeric("expected_late_penalty_cost"),
  subcontractCost: numeric("subcontract_cost"),
  totalCost: numeric("total_cost"),
  printed: boolean("printed"),
  invoiced: boolean("invoiced"),
  shipped: text("shipped"),
  destination: text("destination"),
  reviewed: boolean("reviewed"),
  percentOfMaterialsAvailable: integer("percent_of_materials_available"),
  successorOrderNumbers: text("successor_order_numbers"),
  resourceNames: text("resource_names"),
  lowLevelCode: integer("low_level_code"),
});

export const ptManufacturingOrders = pgTable("pt_manufacturing_orders", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  name: text("name"),
  requiredQty: numeric("required_qty"),
  expectedFinishQty: numeric("expected_finish_qty"),
  description: text("description"),
  productName: text("product_name"),
  productDescription: text("product_description"),
  released: boolean("released"),
  releaseDate: timestamp("release_date"),
  notes: text("notes"),
  scheduled: boolean("scheduled"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  canSpanPlants: boolean("can_span_plants"),
  currentPathId: bigint("current_path_id", { mode: "number" }),
  defaultPathId: bigint("default_path_id", { mode: "number" }),
  family: text("family"),
  finished: boolean("finished"),
  frozen: text("frozen"),
  onHold: text("on_hold"),
  holdReason: text("hold_reason"),
  late: boolean("late"),
  latenessDays: numeric("lateness_days"),
  leadTimeDays: numeric("lead_time_days"),
  locked: text("locked"),
  lockedPlantId: bigint("locked_plant_id", { mode: "number" }),
  uom: text("uom"),
  externalId: text("external_id"),
  anchored: text("anchored"),
  breakOffSourceMOName: text("break_off_source_mo_name"),
  copyRoutingFromTemplate: boolean("copy_routing_from_template"),
  holdUntil: timestamp("hold_until"),
  isBreakOff: boolean("is_break_off"),
  needDate: timestamp("need_date"),
  percentFinished: integer("percent_finished"),
  productColor: text("product_color"),
  useMONeedDate: boolean("use_mo_need_date"),
  standardHours: numeric("standard_hours"),
  attributesSummary: text("attributes_summary"),
  bottlenecks: text("bottlenecks"),
  defaultPathName: text("default_path_name"),
  expectedRunHours: numeric("expected_run_hours"),
  expectedSetupHours: numeric("expected_setup_hours"),
  hold: boolean("hold"),
  isReleased: boolean("is_released"),
  laborCost: numeric("labor_cost"),
  lockedPlantName: text("locked_plant_name"),
  machineCost: numeric("machine_cost"),
  materialCost: numeric("material_cost"),
  moNeedDate: boolean("mo_need_date"),
  preserveRequiredQty: boolean("preserve_required_qty"),
  releaseDateTime: timestamp("release_date_time"),
  reportedRunHours: numeric("reported_run_hours"),
  reportedSetupHours: numeric("reported_setup_hours"),
  requestedQty: numeric("requested_qty"),
  schedulingHours: numeric("scheduling_hours"),
  autoJoinGroup: text("auto_join_group"),
  split: boolean("split"),
  splitCount: integer("split_count"),
  splitFromManufacturingOrderId: bigint("split_from_manufacturing_order_id", { mode: "number" }),
  started: boolean("started"),
  lockToCurrentAlternatePath: boolean("lock_to_current_alternate_path"),
  dbrShippingBufferOverride: bigint("dbr_shipping_buffer_override", { mode: "number" }),
  dbrReleaseDate: timestamp("dbr_release_date"),
  dbrShippingDueDate: timestamp("dbr_shipping_due_date"),
  dbrBufferHrs: numeric("dbr_buffer_hrs"),
  shippingBufferCurrentPenetrationPercent: numeric("shipping_buffer_current_penetration_percent"),
  shippingBufferProjectedPenetrationPercent: numeric("shipping_buffer_projected_penetration_percent"),
  drumBufferProjectedPenetrationPercent: numeric("drum_buffer_projected_penetration_percent"),
  drumBufferCurrentPenetrationPercent: numeric("drum_buffer_current_penetration_percent"),
});

export const ptJobOperations = pgTable("pt_job_operations", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  operationId: bigint("operation_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  setupHours: numeric("setup_hours"),
  requiredStartQty: numeric("required_start_qty"),
  requiredFinishQty: numeric("required_finish_qty"),
  qtyPerCycle: numeric("qty_per_cycle"),
  minutesPerCycle: numeric("minutes_per_cycle"),
  postProcessingHours: numeric("post_processing_hours"),
  overlapTransferQty: numeric("overlap_transfer_qty"),
  canPause: boolean("can_pause"),
  canSubcontract: boolean("can_subcontract"),
  dailyCarryingCost: numeric("daily_carrying_cost"),
  compatibilityCode: text("compatibility_code"),
  batchCode: text("batch_code"),
  setupCode: text("setup_code"),
  setupNumber: numeric("setup_number"),
  deductScrapFromRequired: boolean("deduct_scrap_from_required"),
  successorProcessing: text("successor_processing"),
  keepSuccessorsTimeLimitHours: numeric("keep_successors_time_limit_hours"),
  constraintType: text("constraint_type"),
  holdUntilDateTime: timestamp("hold_until_date_time"),
  holdReason: text("hold_reason"),
  omitted: text("omitted"),
  finished: boolean("finished"),
  onHold: boolean("on_hold"),
  isRework: boolean("is_rework"),
  planningScrapPercent: numeric("planning_scrap_percent"),
  uom: text("uom"),
  notes: text("notes"),
  autoSplit: boolean("auto_split"),
  minAutoSplitQty: numeric("min_auto_split_qty"),
  wholeNumberSplits: boolean("whole_number_splits"),
  primaryResourceRequirementID: bigint("primary_resource_requirement_id", { mode: "number" }),
  setupColorName: text("setup_color_name"),
  timeBasedReporting: boolean("time_based_reporting"),
  externalId: text("external_id"),
  scheduled: boolean("scheduled"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  needDate: timestamp("need_date"),
  locked: text("locked"),
  anchored: text("anchored"),
  scheduledPrimaryWorkCenterExternalId: text("scheduled_primary_work_center_external_id"),
  autoReportProgress: boolean("auto_report_progress"),
  expectedFinishQty: numeric("expected_finish_qty"),
  useExpectedFinishQty: boolean("use_expected_finish_qty"),
  standardHours: numeric("standard_hours"),
  outputName: text("output_name"),
  useCompatibilityCode: boolean("use_compatibility_code"),
  attributes: text("attributes"),
  workContentHours: numeric("work_content_hours"),
  percentFinished: integer("percent_finished"),
  msProjectPredecessorOperations: text("ms_project_predecessor_operations"),
  attributesSummary: text("attributes_summary"),
  autoFinish: boolean("auto_finish"),
  bottleneck: boolean("bottleneck"),
  buyDirectMaterialsList: text("buy_direct_materials_list"),
  buyDirectMaterialsListNotAvailable: text("buy_direct_materials_list_not_available"),
  carryingCost: numeric("carrying_cost"),
  cycles: bigint("cycles", { mode: "number" }),
  cycleHrs: numeric("cycle_hrs"),
  endOfMatlPostProcDate: timestamp("end_of_matl_post_proc_date"),
  endOfResourceTransferTimeDate: timestamp("end_of_resource_transfer_time_date"),
  endOfRunDate: timestamp("end_of_run_date"),
  expectedRunHours: numeric("expected_run_hours"),
  expectedScrapQty: numeric("expected_scrap_qty"),
  expectedSetupHours: numeric("expected_setup_hours"),
  jitStartDate: timestamp("jit_start_date"),
  keepSuccessorsTimeLimitHrs: numeric("keep_successors_time_limit_hrs"),
  laborCost: numeric("labor_cost"),
  late: boolean("late"),
  latestConstraint: text("latest_constraint"),
  latestConstraintDate: timestamp("latest_constraint_date"),
  latestPredecessorFinish: timestamp("latest_predecessor_finish"),
  machineCost: numeric("machine_cost"),
  materialCost: numeric("material_cost"),
  materialList: text("material_list"),
  materialsNotAvailable: text("materials_not_available"),
});

export const ptJobActivities = pgTable("pt_job_activities", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  operationId: bigint("operation_id", { mode: "number" }).notNull(),
  activityId: bigint("activity_id", { mode: "number" }).notNull(),
  productionStatus: text("production_status"),
  requiredFinishQty: numeric("required_finish_qty"),
  reportedGoodQty: numeric("reported_good_qty"),
  reportedScrapQty: numeric("reported_scrap_qty"),
  reportedRunHours: numeric("reported_run_hours"),
  reportedSetupHours: numeric("reported_setup_hours"),
  reportedPostProcessingHours: numeric("reported_post_processing_hours"),
  zeroLength: boolean("zero_length"),
  externalId: text("external_id"),
  locked: text("locked"),
  anchored: boolean("anchored"),
  anchorStartDate: timestamp("anchor_start_date"),
  anchorDriftHours: numeric("anchor_drift_hours"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndOfSetupDate: timestamp("scheduled_end_of_setup_date"),
  scheduledEndOfRunDate: timestamp("scheduled_end_of_run_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  scheduledSetupHours: numeric("scheduled_setup_hours"),
  scheduledRunHours: numeric("scheduled_run_hours"),
  scheduledPostProcessingHours: numeric("scheduled_post_processing_hours"),
  reportedFinishDate: timestamp("reported_finish_date"),
  finishedInternally: boolean("finished_internally"),
  paused: boolean("paused"),
  nbrOfPeople: numeric("nbr_of_people"),
  peopleUsage: text("people_usage"),
  comments: text("comments"),
  comments2: text("comments2"),
  expectedFinishQty: numeric("expected_finish_qty"),
  jitStartDate: timestamp("jit_start_date"),
  scheduled: boolean("scheduled"),
  workContentHours: numeric("work_content_hours"),
  percentFinished: integer("percent_finished"),
  bottleneck: boolean("bottleneck"),
  calendarDurationHrs: numeric("calendar_duration_hrs"),
  endOfRunDate: timestamp("end_of_run_date"),
  expectedScrapQty: numeric("expected_scrap_qty"),
  laborCost: numeric("labor_cost"),
  late: boolean("late"),
  leftLeewayHrs: numeric("left_leeway_hrs"),
  machineCost: numeric("machine_cost"),
  maxDelayRequiredStartBy: timestamp("max_delay_required_start_by"),
  maxDelaySlackDays: numeric("max_delay_slack_days"),
  maxDelayViolation: boolean("max_delay_violation"),
  nbrOfPeopleAdjustedWorkContentHrs: numeric("nbr_of_people_adjusted_work_content_hrs"),
  queueDays: numeric("queue_days"),
  remainingQty: numeric("remaining_qty"),
  reportedEndOfRunDate: timestamp("reported_end_of_run_date"),
  reportedMaterialPostProcessingHrs: numeric("reported_material_post_processing_hrs"),
  reportedStartDate: timestamp("reported_start_date"),
  requiredStartQty: numeric("required_start_qty"),
  resourcesUsed: text("resources_used"),
  resourceTransferHrs: numeric("resource_transfer_hrs"),
  rightLeewayHrs: numeric("right_leeway_hrs"),
  slackDays: numeric("slack_days"),
  splitId: integer("split_id"),
  started: boolean("started"),
  timing: text("timing"),
  batched: boolean("batched"),
  cycleHrs: numeric("cycle_hrs"),
  qtyPerCycle: numeric("qty_per_cycle"),
  setupHrs: numeric("setup_hrs"),
  postProcessingHrs: numeric("post_processing_hrs"),
  planningScrapPercent: numeric("planning_scrap_percent"),
  cycleSpanManualUpdateOnly: boolean("cycle_span_manual_update_only"),
  qtyPerCycleManualUpdateOnly: boolean("qty_per_cycle_manual_update_only"),
  setupTimeManualUpdateOnly: boolean("setup_time_manual_update_only"),
  postProcessManualUpdateOnly: boolean("post_process_manual_update_only"),
  scrapPercentManualUpdateOnly: boolean("scrap_percent_manual_update_only"),
  optimizationScore: numeric("optimization_score"),
  optimizationScoreDetails: text("optimization_score_details"),
  scheduledSetupZeroLength: boolean("scheduled_setup_zero_length"),
  scheduledRunZeroLength: boolean("scheduled_run_zero_length"),
  scheduledPostProcessingZeroLength: boolean("scheduled_post_processing_zero_length"),
  reportedStartOfProcessingDate: timestamp("reported_start_of_processing_date"),
  batchAmount: numeric("batch_amount"),
  actualResourcesUsed: text("actual_resources_used"),
});

export const ptJobMaterials = pgTable("pt_job_materials", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobId: bigint("job_id", { mode: "number" }).notNull(),
  manufacturingOrderId: bigint("manufacturing_order_id", { mode: "number" }).notNull(),
  operationId: bigint("operation_id", { mode: "number" }).notNull(),
  materialRequirementId: bigint("material_requirement_id", { mode: "number" }).notNull(),
  externalId: text("external_id"),
  allocatedFor: boolean("allocated_for"),
  latestSourceDateTime: timestamp("latest_source_date_time"),
  constraintType: text("constraint_type"),
  issuedComplete: boolean("issued_complete"),
  issuedQty: numeric("issued_qty"),
  leadTimeDays: numeric("lead_time_days"),
  materialName: text("material_name"),
  materialDescription: text("material_description"),
  source: text("source"),
  totalCost: numeric("total_cost"),
  totalRequiredQty: numeric("total_required_qty"),
  minSourceQty: numeric("min_source_qty"),
  maxSourceQty: numeric("max_source_qty"),
  materialSourcing: text("material_sourcing"),
  uom: text("uom"),
  buyDirect: boolean("buy_direct"),
  qtyFromLeadTime: numeric("qty_from_lead_time"),
  available: boolean("available"),
  planned: boolean("planned"),
  requirementType: text("requirement_type"),
  supply: text("supply"),
  useOverlapActivities: boolean("use_overlap_activities"),
  useOverlapPOs: boolean("use_overlap_pos"),
  tankStorageReleaseTiming: text("tank_storage_release_timing"),
  multipleWarehouseSupplyAllowed: boolean("multiple_warehouse_supply_allowed"),
  fixedQty: boolean("fixed_qty"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  allowedLotCodes: text("allowed_lot_codes"),
  allowPartialSupply: boolean("allow_partial_supply"),
  plannedScrapQty: numeric("planned_scrap_qty"),
  minAgeHrs: numeric("min_age_hrs"),
  shelfLifePenetrationPercent: numeric("shelf_life_penetration_percent"),
  wipDurationHrs: numeric("wip_duration_hrs"),
  materialAllocation: text("material_allocation"),
});

// ============================================
// Sales and Demand Tables
// ============================================

export const ptCustomers = pgTable("pt_customers", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  customerId: bigint("customer_id", { mode: "number" }).notNull(),
  abcCode: text("abc_code"),
  colorCode: text("color_code"),
  priority: integer("priority"),
  region: text("region"),
  groupCode: text("group_code"),
  name: text("name"),
  customerType: text("customer_type"),
});

export const ptSalesOrders = pgTable("pt_sales_orders", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  salesOrderId: bigint("sales_order_id", { mode: "number" }).notNull(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  cancelled: boolean("cancelled"),
  ctpJobId: bigint("ctp_job_id", { mode: "number" }),
  customer: text("customer"),
  estimate: boolean("estimate"),
  expirationDate: timestamp("expiration_date"),
  salesAmount: numeric("sales_amount"),
  salesOffice: text("sales_office"),
  salesPerson: text("sales_person"),
  planner: text("planner"),
  project: text("project"),
});

export const ptSalesOrderLines = pgTable("pt_sales_order_lines", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  salesOrderId: bigint("sales_order_id", { mode: "number" }),
  salesOrderLineId: bigint("sales_order_line_id", { mode: "number" }).notNull(),
  description: text("description"),
  itemId: bigint("item_id", { mode: "number" }),
  lineNumber: text("line_number"),
  unitPrice: numeric("unit_price"),
});

export const ptSalesOrderLineDistributions = pgTable("pt_sales_order_line_distributions", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  salesOrderLineId: bigint("sales_order_line_id", { mode: "number" }),
  salesOrderLineDistributionId: bigint("sales_order_line_distribution_id", { mode: "number" }).notNull(),
  allowPartialAllocations: boolean("allow_partial_allocations"),
  backlogQty: numeric("backlog_qty"),
  hold: boolean("hold"),
  holdReason: text("hold_reason"),
  maximumLatenessDays: numeric("maximum_lateness_days"),
  materialAllocation: text("material_allocation"),
  minAllocationQty: numeric("min_allocation_qty"),
  minSourceQty: numeric("min_source_qty"),
  maxSourceQty: numeric("max_source_qty"),
  materialSourcing: text("material_sourcing"),
  missedSalesQty: numeric("missed_sales_qty"),
  mustSupplyFromWarehouseId: bigint("must_supply_from_warehouse_id", { mode: "number" }),
  priority: integer("priority"),
  qtyAllocatedFromOnHandInventory: numeric("qty_allocated_from_on_hand_inventory"),
  qtyAllocatedFromProjectedInventory: numeric("qty_allocated_from_projected_inventory"),
  qtyNotAllocated: numeric("qty_not_allocated"),
  qtyShipped: numeric("qty_shipped"),
  qtyOrdered: numeric("qty_ordered"),
  requiredAvailableDate: timestamp("required_available_date"),
  salesRegion: text("sales_region"),
  shipToZone: text("ship_to_zone"),
  stockShortageRule: text("stock_shortage_rule"),
  supplyingWarehouseId: bigint("supplying_warehouse_id", { mode: "number" }),
  availableDate: timestamp("available_date"),
  eligibleLots: text("eligible_lots"),
});

export const ptForecasts = pgTable("pt_forecasts", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  inventoryId: bigint("inventory_id", { mode: "number" }),
  version: text("version").notNull(),
  forecastId: bigint("forecast_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  externalId: text("external_id"),
  notes: text("notes"),
  customer: text("customer"),
  planner: text("planner"),
  priority: integer("priority"),
  salesOffice: text("sales_office"),
  salesPerson: text("sales_person"),
});

export const ptForecastShipments = pgTable("pt_forecast_shipments", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  forecastId: bigint("forecast_id", { mode: "number" }),
  forecastShipmentId: bigint("forecast_shipment_id", { mode: "number" }).notNull(),
  requiredDate: timestamp("required_date"),
  requiredQty: numeric("required_qty"),
  consumedQty: numeric("consumed_qty"),
  consumptionDetails: text("consumption_details"),
});

// ============================================
// Purchase and Transfer Order Tables
// ============================================

export const ptPurchasesToStock = pgTable("pt_purchases_to_stock", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  purchaseToStockId: bigint("purchase_to_stock_id", { mode: "number" }).notNull(),
  inventoryId: bigint("inventory_id", { mode: "number" }),
  name: text("name"),
  description: text("description"),
  itemId: bigint("item_id", { mode: "number" }),
  qtyOrdered: numeric("qty_ordered"),
  externalId: text("external_id"),
  scheduledReceiptDate: timestamp("scheduled_receipt_date"),
  unloadHrs: numeric("unload_hrs"),
  transferHrs: numeric("transfer_hrs"),
  availableDate: timestamp("available_date"),
  vendorExternalId: text("vendor_external_id"),
  buyerExternalId: text("buyer_external_id"),
  warehouseId: bigint("warehouse_id", { mode: "number" }),
  unloadEndDate: timestamp("unload_end_date"),
  notes: text("notes"),
  attributesSummary: text("attributes_summary"),
  firm: boolean("firm"),
  closed: boolean("closed"),
  dbrReceivingBufferHrs: numeric("dbr_receiving_buffer_hrs"),
  dbrReceiptDate: timestamp("dbr_receipt_date"),
  dbrCurrentPenetrationPercent: numeric("dbr_current_penetration_percent"),
  qtyReceived: numeric("qty_received"),
  maintenanceMethod: text("maintenance_method"),
  actualReceiptDate: timestamp("actual_receipt_date"),
});

export const ptTransferOrders = pgTable("pt_transfer_orders", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  transferOrderId: bigint("transfer_order_id", { mode: "number" }).notNull(),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  externalId: text("external_id"),
  attributesSummary: text("attributes_summary"),
  firm: boolean("firm"),
  priority: integer("priority"),
  closed: boolean("closed"),
  maintenanceMethod: text("maintenance_method"),
});

export const ptTransferOrderDistributions = pgTable("pt_transfer_order_distributions", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  transferOrderId: bigint("transfer_order_id", { mode: "number" }),
  transferOrderDistributionId: bigint("transfer_order_distribution_id", { mode: "number" }).notNull(),
  itemId: bigint("item_id", { mode: "number" }),
  fromWarehouseId: bigint("from_warehouse_id", { mode: "number" }),
  toWarehouseId: bigint("to_warehouse_id", { mode: "number" }),
  qtyOrdered: numeric("qty_ordered"),
  qtyShipped: numeric("qty_shipped"),
  qtyReceived: numeric("qty_received"),
  minSourceQty: numeric("min_source_qty"),
  maxSourceQty: numeric("max_source_qty"),
  materialSourcing: text("material_sourcing"),
  materialAllocation: text("material_allocation"),
  scheduledShipDate: timestamp("scheduled_ship_date"),
  scheduledReceiveDate: timestamp("scheduled_receive_date"),
  closed: boolean("closed"),
});

// ============================================
// Capacity and Scheduling Tables
// ============================================

export const ptCapacityIntervals = pgTable("pt_capacity_intervals", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  capacityIntervalId: bigint("capacity_interval_id", { mode: "number" }).notNull(),
  name: text("name"),
  externalId: text("external_id"),
  description: text("description"),
  notes: text("notes"),
  durationHrs: numeric("duration_hrs"),
  endDateTime: timestamp("end_date_time"),
  intervalType: text("interval_type"),
  nbrOfPeople: numeric("nbr_of_people"),
  startDateTime: timestamp("start_date_time"),
});

export const ptCapacityIntervalResourceAssignments = pgTable("pt_capacity_interval_resource_assignments", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  capacityIntervalId: bigint("capacity_interval_id", { mode: "number" }).notNull(),
  resourceId: bigint("resource_id", { mode: "number" }).notNull(),
});

export const ptRecurringCapacityIntervals = pgTable("pt_recurring_capacity_intervals", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  recurringCapacityIntervalId: bigint("recurring_capacity_interval_id", { mode: "number" }).notNull(),
  name: text("name"),
  externalId: text("external_id"),
  description: text("description"),
  notes: text("notes"),
  dayType: text("day_type"),
  durationHrs: numeric("duration_hrs"),
  endDateTime: timestamp("end_date_time"),
  intervalType: text("interval_type"),
  nbrOfPeople: numeric("nbr_of_people"),
  startDateTime: timestamp("start_date_time"),
  sunday: boolean("sunday"),
  monday: boolean("monday"),
  tuesday: boolean("tuesday"),
  wednesday: boolean("wednesday"),
  thursday: boolean("thursday"),
  friday: boolean("friday"),
  saturday: boolean("saturday"),
  maxNbrRecurrences: integer("max_nbr_recurrences"),
  monthlyDayNumber: integer("monthly_day_number"),
  monthlyOccurrence: text("monthly_occurrence"),
  nbrIntervalsToOverride: integer("nbr_intervals_to_override"),
  nbrOfPeopleOverride: numeric("nbr_of_people_override"),
  occurrence: text("occurrence"),
  recurrence: text("recurrence"),
  recurrenceEndDateTime: timestamp("recurrence_end_date_time"),
  recurrenceEndType: text("recurrence_end_type"),
  skipFrequency: integer("skip_frequency"),
  yearlyMonth: text("yearly_month"),
});

export const ptSchedules = pgTable("pt_schedules", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  instanceName: text("instance_name"),
  instanceVersion: text("instance_version"),
  scenarioId: bigint("scenario_id", { mode: "number" }),
  scenarioName: text("scenario_name"),
  scenarioDescription: text("scenario_description"),
  publisherUserId: bigint("publisher_user_id", { mode: "number" }),
  publishedEntireSchedule: boolean("published_entire_schedule"),
  clock: timestamp("clock"),
  publishHorizonEnd: timestamp("publish_horizon_end"),
  scenarioType: text("scenario_type"),
  lastSchedulePublished: boolean("last_schedule_published"),
  lastLiveSchedulePublished: boolean("last_live_schedule_published"),
  lastWhatIfSchedulePublished: boolean("last_what_if_schedule_published"),
  lastPublishedSchedulePublished: boolean("last_published_schedule_published"),
  lastNetChangeLiveSchedulePublished: boolean("last_net_change_live_schedule_published"),
  lastNetChangePublishedSchedulePublished: boolean("last_net_change_published_schedule_published"),
  lastPublishForScenario: boolean("last_publish_for_scenario"),
  planningHorizonEnd: timestamp("planning_horizon_end"),
  utcOffsetHrs: integer("utc_offset_hrs"),
});

// ============================================
// Metrics and KPI Tables
// ============================================

export const ptMetrics = pgTable("pt_metrics", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  jobsOnTimePercent: numeric("jobs_on_time_percent"),
  jobsOverduePercent: numeric("jobs_overdue_percent"),
  outputPerWeek: numeric("output_per_week"),
  averageLeadTime: bigint("average_lead_time", { mode: "number" }),
  usersWhoOptimize: integer("users_who_optimize"),
  salesOrderRev30: numeric("sales_order_rev_30"),
  salesOrderRev60: numeric("sales_order_rev_60"),
  salesOrderRev90: numeric("sales_order_rev_90"),
  salesOrderRev365: numeric("sales_order_rev_365"),
  salesOrders: integer("sales_orders"),
  purchaseOrders: integer("purchase_orders"),
  scheduledJobs: integer("scheduled_jobs"),
  operations: integer("operations"),
  failedToScheduleJobs: integer("failed_to_schedule_jobs"),
  jobsPastPlanningHorizon: integer("jobs_past_planning_horizon"),
  numberOfUsers: integer("number_of_users"),
  lastManualActionDate: timestamp("last_manual_action_date"),
  lastAutomaticActionDate: timestamp("last_automatic_action_date"),
});

export const ptKPIs = pgTable("pt_kpis", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  calculatorName: text("calculator_name").notNull(),
  currentValue: numeric("current_value"),
  calculatorId: bigint("calculator_id", { mode: "number" }).notNull(),
});

// ============================================
// Additional Support Tables
// ============================================

export const ptProductRules = pgTable("pt_product_rules", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: varchar("instance_id", { length: 38 }).notNull(),
  itemId: bigint("item_id", { mode: "number" }).notNull(),
  plantId: bigint("plant_id", { mode: "number" }).notNull(),
  departmentId: bigint("department_id", { mode: "number" }).notNull(),
  resourceId: bigint("resource_id", { mode: "number" }).notNull(),
  operationName: varchar("operation_name", { length: 48 }).notNull(),
  setupHrs: numeric("setup_hrs"),
  useSetupHrs: boolean("use_setup_hrs"),
  cycleHrs: numeric("cycle_hrs"),
  useCycleHrs: boolean("use_cycle_hrs"),
  qtyPerCycle: numeric("qty_per_cycle"),
  useQtyPerCycle: boolean("use_qty_per_cycle"),
  materialPostProcessingHrs: numeric("material_post_processing_hrs"),
  useMaterialPostProcessingHrs: boolean("use_material_post_processing_hrs"),
  postProcessingHrs: numeric("post_processing_hrs"),
  usePostProcessingHrs: boolean("use_post_processing_hrs"),
  planningScrapPercent: numeric("planning_scrap_percent"),
  usePlanningScrapPercent: boolean("use_planning_scrap_percent"),
  headStartHrs: numeric("head_start_hrs"),
  useHeadStartHrs: boolean("use_head_start_hrs"),
  minVolume: numeric("min_volume"),
  useMinVolume: boolean("use_min_volume"),
  maxVolume: numeric("max_volume"),
  useMaxVolume: boolean("use_max_volume"),
});

export const ptSystemData = pgTable("pt_system_data", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 13 }),
  validateDB: boolean("validate_db"),
  prepareData: boolean("prepare_data"),
  clearCustomTables: boolean("clear_custom_tables"),
});

// ============================================
// Table Relations (using numeric PT IDs for efficient joins)
// ============================================

// Plant Relations
export const ptPlantsRelations = relations(ptPlants, ({ many }) => ({
  departments: many(ptDepartments),
  resources: many(ptResources),
  plantWarehouses: many(ptPlantWarehouses),
}));

// Department Relations
export const ptDepartmentsRelations = relations(ptDepartments, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [ptDepartments.plantId],
    references: [ptPlants.plantId],
  }),
  resources: many(ptResources),
}));

// Resource Relations
export const ptResourcesRelations = relations(ptResources, ({ one, many }) => ({
  plant: one(ptPlants, {
    fields: [ptResources.plantId],
    references: [ptPlants.plantId],
  }),
  department: one(ptDepartments, {
    fields: [ptResources.departmentId],
    references: [ptDepartments.departmentId],
  }),
  resourceCapabilities: many(ptResourceCapabilities),
  jobActivities: many(ptJobActivities),
  capacityIntervalAssignments: many(ptCapacityIntervalResourceAssignments),
}));

// Resource Capability Relations
export const ptResourceCapabilitiesRelations = relations(ptResourceCapabilities, ({ one }) => ({
  resource: one(ptResources, {
    fields: [ptResourceCapabilities.resourceId],
    references: [ptResources.resourceId],
  }),
  capability: one(ptCapabilities, {
    fields: [ptResourceCapabilities.capabilityId],
    references: [ptCapabilities.capabilityId],
  }),
}));

// Capability Relations
export const ptCapabilitiesRelations = relations(ptCapabilities, ({ many }) => ({
  resourceCapabilities: many(ptResourceCapabilities),
}));

// Item Relations
export const ptItemsRelations = relations(ptItems, ({ many }) => ({
  inventories: many(ptInventories),
  lots: many(ptLots),
  jobMaterials: many(ptJobMaterials),
  salesOrderLines: many(ptSalesOrderLines),
}));

// Warehouse Relations
export const ptWarehousesRelations = relations(ptWarehouses, ({ many }) => ({
  plantWarehouses: many(ptPlantWarehouses),
  inventories: many(ptInventories),
}));

// Plant Warehouse Relations
export const ptPlantWarehousesRelations = relations(ptPlantWarehouses, ({ one }) => ({
  plant: one(ptPlants, {
    fields: [ptPlantWarehouses.plantId],
    references: [ptPlants.plantId],
  }),
  warehouse: one(ptWarehouses, {
    fields: [ptPlantWarehouses.warehouseId],
    references: [ptWarehouses.warehouseId],
  }),
}));

// Inventory Relations
export const ptInventoriesRelations = relations(ptInventories, ({ one }) => ({
  item: one(ptItems, {
    fields: [ptInventories.itemId],
    references: [ptItems.itemId],
  }),
  warehouse: one(ptWarehouses, {
    fields: [ptInventories.warehouseId],
    references: [ptWarehouses.warehouseId],
  }),
}));

// Lot Relations
export const ptLotsRelations = relations(ptLots, ({ one }) => ({
  item: one(ptItems, {
    fields: [ptLots.item_id],
    references: [ptItems.itemId],
  }),
}));

// Job Relations
export const ptJobsRelations = relations(ptJobs, ({ one, many }) => ({
  manufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobs.manufacturing_order_id],
    references: [ptManufacturingOrders.manufacturingOrderId],
  }),
  operations: many(ptJobOperations),
  materials: many(ptJobMaterials),
}));

// Manufacturing Order Relations
export const ptManufacturingOrdersRelations = relations(ptManufacturingOrders, ({ many }) => ({
  jobs: many(ptJobs),
  operations: many(ptJobOperations),
}));

// Job Operation Relations
export const ptJobOperationsRelations = relations(ptJobOperations, ({ one, many }) => ({
  job: one(ptJobs, {
    fields: [ptJobOperations.jobId],
    references: [ptJobs.jobId],
  }),
  manufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobOperations.manufacturingOrderId],
    references: [ptManufacturingOrders.manufacturingOrderId],
  }),
  activities: many(ptJobActivities),
}));

// Job Activity Relations
export const ptJobActivitiesRelations = relations(ptJobActivities, ({ one }) => ({
  operation: one(ptJobOperations, {
    fields: [ptJobActivities.operationId],
    references: [ptJobOperations.operationId],
  }),
  resource: one(ptResources, {
    fields: [ptJobActivities.resource_id],
    references: [ptResources.resourceId],
  }),
}));

// Job Material Relations
export const ptJobMaterialsRelations = relations(ptJobMaterials, ({ one }) => ({
  job: one(ptJobs, {
    fields: [ptJobMaterials.jobId],
    references: [ptJobs.jobId],
  }),
  item: one(ptItems, {
    fields: [ptJobMaterials.item_id],
    references: [ptItems.itemId],
  }),
}));

// Customer Relations
export const ptCustomersRelations = relations(ptCustomers, ({ many }) => ({
  salesOrders: many(ptSalesOrders),
}));

// Sales Order Relations
export const ptSalesOrdersRelations = relations(ptSalesOrders, ({ one, many }) => ({
  customer: one(ptCustomers, {
    fields: [ptSalesOrders.customer],
    references: [ptCustomers.customerId],
  }),
  salesOrderLines: many(ptSalesOrderLines),
}));

// Sales Order Line Relations
export const ptSalesOrderLinesRelations = relations(ptSalesOrderLines, ({ one, many }) => ({
  salesOrder: one(ptSalesOrders, {
    fields: [ptSalesOrderLines.salesOrderId],
    references: [ptSalesOrders.salesOrderId],
  }),
  item: one(ptItems, {
    fields: [ptSalesOrderLines.itemId],
    references: [ptItems.itemId],
  }),
  distributions: many(ptSalesOrderLineDistributions),
}));

// Sales Order Line Distribution Relations
export const ptSalesOrderLineDistributionsRelations = relations(ptSalesOrderLineDistributions, ({ one }) => ({
  salesOrderLine: one(ptSalesOrderLines, {
    fields: [ptSalesOrderLineDistributions.salesOrderLineId],
    references: [ptSalesOrderLines.salesOrderLineId],
  }),
}));

// Forecast Relations
export const ptForecastsRelations = relations(ptForecasts, ({ many }) => ({
  forecastShipments: many(ptForecastShipments),
}));

// Forecast Shipment Relations
export const ptForecastShipmentsRelations = relations(ptForecastShipments, ({ one }) => ({
  forecast: one(ptForecasts, {
    fields: [ptForecastShipments.forecastId],
    references: [ptForecasts.forecastId],
  }),
}));

// Transfer Order Relations
export const ptTransferOrdersRelations = relations(ptTransferOrders, ({ many }) => ({
  distributions: many(ptTransferOrderDistributions),
}));

// Transfer Order Distribution Relations
export const ptTransferOrderDistributionsRelations = relations(ptTransferOrderDistributions, ({ one }) => ({
  transferOrder: one(ptTransferOrders, {
    fields: [ptTransferOrderDistributions.transferOrderId],
    references: [ptTransferOrders.transferOrderId],
  }),
}));

// Capacity Interval Relations
export const ptCapacityIntervalsRelations = relations(ptCapacityIntervals, ({ many }) => ({
  resourceAssignments: many(ptCapacityIntervalResourceAssignments),
}));

// Capacity Interval Resource Assignment Relations
export const ptCapacityIntervalResourceAssignmentsRelations = relations(ptCapacityIntervalResourceAssignments, ({ one }) => ({
  capacityInterval: one(ptCapacityIntervals, {
    fields: [ptCapacityIntervalResourceAssignments.capacityIntervalId],
    references: [ptCapacityIntervals.capacityIntervalId],
  }),
  resource: one(ptResources, {
    fields: [ptCapacityIntervalResourceAssignments.resourceId],
    references: [ptResources.resourceId],
  }),
}));

// ============================================
// Export Insert Schemas and Types
// ============================================

export const insertPtPlantsSchema = createInsertSchema(ptPlants);
export const insertPtDepartmentsSchema = createInsertSchema(ptDepartments);
export const insertPtResourcesSchema = createInsertSchema(ptResources);
export const insertPtCapabilitiesSchema = createInsertSchema(ptCapabilities);
export const insertPtResourceCapabilitiesSchema = createInsertSchema(ptResourceCapabilities);
export const insertPtItemsSchema = createInsertSchema(ptItems);
export const insertPtWarehousesSchema = createInsertSchema(ptWarehouses);
export const insertPtPlantWarehousesSchema = createInsertSchema(ptPlantWarehouses);
export const insertPtInventoriesSchema = createInsertSchema(ptInventories);
export const insertPtLotsSchema = createInsertSchema(ptLots);
export const insertPtJobsSchema = createInsertSchema(ptJobs);
export const insertPtManufacturingOrdersSchema = createInsertSchema(ptManufacturingOrders);
export const insertPtJobOperationsSchema = createInsertSchema(ptJobOperations);
export const insertPtJobActivitiesSchema = createInsertSchema(ptJobActivities);
export const insertPtJobMaterialsSchema = createInsertSchema(ptJobMaterials);
export const insertPtCustomersSchema = createInsertSchema(ptCustomers);
export const insertPtSalesOrdersSchema = createInsertSchema(ptSalesOrders);
export const insertPtSalesOrderLinesSchema = createInsertSchema(ptSalesOrderLines);
export const insertPtSalesOrderLineDistributionsSchema = createInsertSchema(ptSalesOrderLineDistributions);
export const insertPtForecastsSchema = createInsertSchema(ptForecasts);
export const insertPtForecastShipmentsSchema = createInsertSchema(ptForecastShipments);
export const insertPtPurchasesToStockSchema = createInsertSchema(ptPurchasesToStock);
export const insertPtTransferOrdersSchema = createInsertSchema(ptTransferOrders);
export const insertPtTransferOrderDistributionsSchema = createInsertSchema(ptTransferOrderDistributions);
export const insertPtCapacityIntervalsSchema = createInsertSchema(ptCapacityIntervals);
export const insertPtCapacityIntervalResourceAssignmentsSchema = createInsertSchema(ptCapacityIntervalResourceAssignments);
export const insertPtRecurringCapacityIntervalsSchema = createInsertSchema(ptRecurringCapacityIntervals);
export const insertPtSchedulesSchema = createInsertSchema(ptSchedules);
export const insertPtMetricsSchema = createInsertSchema(ptMetrics);
export const insertPtKPIsSchema = createInsertSchema(ptKPIs);
export const insertPtProductRulesSchema = createInsertSchema(ptProductRules);
export const insertPtSystemDataSchema = createInsertSchema(ptSystemData);

// Export Select Types
export type PtPlant = typeof ptPlants.$inferSelect;
export type PtDepartment = typeof ptDepartments.$inferSelect;
export type PtResource = typeof ptResources.$inferSelect;
export type PtCapability = typeof ptCapabilities.$inferSelect;
export type PtResourceCapability = typeof ptResourceCapabilities.$inferSelect;
export type PtItem = typeof ptItems.$inferSelect;
export type PtWarehouse = typeof ptWarehouses.$inferSelect;
export type PtPlantWarehouse = typeof ptPlantWarehouses.$inferSelect;
export type PtInventory = typeof ptInventories.$inferSelect;
export type PtLot = typeof ptLots.$inferSelect;
export type PtJob = typeof ptJobs.$inferSelect;
export type PtManufacturingOrder = typeof ptManufacturingOrders.$inferSelect;
export type PtJobOperation = typeof ptJobOperations.$inferSelect;
export type PtJobActivity = typeof ptJobActivities.$inferSelect;
export type PtJobMaterial = typeof ptJobMaterials.$inferSelect;
export type PtCustomer = typeof ptCustomers.$inferSelect;
export type PtSalesOrder = typeof ptSalesOrders.$inferSelect;
export type PtSalesOrderLine = typeof ptSalesOrderLines.$inferSelect;
export type PtSalesOrderLineDistribution = typeof ptSalesOrderLineDistributions.$inferSelect;
export type PtForecast = typeof ptForecasts.$inferSelect;
export type PtForecastShipment = typeof ptForecastShipments.$inferSelect;
export type PtPurchaseToStock = typeof ptPurchasesToStock.$inferSelect;
export type PtTransferOrder = typeof ptTransferOrders.$inferSelect;
export type PtTransferOrderDistribution = typeof ptTransferOrderDistributions.$inferSelect;
export type PtCapacityInterval = typeof ptCapacityIntervals.$inferSelect;
export type PtCapacityIntervalResourceAssignment = typeof ptCapacityIntervalResourceAssignments.$inferSelect;
export type PtRecurringCapacityInterval = typeof ptRecurringCapacityIntervals.$inferSelect;
export type PtSchedule = typeof ptSchedules.$inferSelect;
export type PtMetric = typeof ptMetrics.$inferSelect;
export type PtKPI = typeof ptKPIs.$inferSelect;
export type PtProductRule = typeof ptProductRules.$inferSelect;
export type PtSystemData = typeof ptSystemData.$inferSelect;

// Export Insert Types
export type InsertPtPlant = z.infer<typeof insertPtPlantsSchema>;
export type InsertPtDepartment = z.infer<typeof insertPtDepartmentsSchema>;
export type InsertPtResource = z.infer<typeof insertPtResourcesSchema>;
export type InsertPtCapability = z.infer<typeof insertPtCapabilitiesSchema>;
export type InsertPtResourceCapability = z.infer<typeof insertPtResourceCapabilitiesSchema>;
export type InsertPtItem = z.infer<typeof insertPtItemsSchema>;
export type InsertPtWarehouse = z.infer<typeof insertPtWarehousesSchema>;
export type InsertPtPlantWarehouse = z.infer<typeof insertPtPlantWarehousesSchema>;
export type InsertPtInventory = z.infer<typeof insertPtInventoriesSchema>;
export type InsertPtLot = z.infer<typeof insertPtLotsSchema>;
export type InsertPtJob = z.infer<typeof insertPtJobsSchema>;
export type InsertPtManufacturingOrder = z.infer<typeof insertPtManufacturingOrdersSchema>;
export type InsertPtJobOperation = z.infer<typeof insertPtJobOperationsSchema>;
export type InsertPtJobActivity = z.infer<typeof insertPtJobActivitiesSchema>;
export type InsertPtJobMaterial = z.infer<typeof insertPtJobMaterialsSchema>;
export type InsertPtCustomer = z.infer<typeof insertPtCustomersSchema>;
export type InsertPtSalesOrder = z.infer<typeof insertPtSalesOrdersSchema>;
export type InsertPtSalesOrderLine = z.infer<typeof insertPtSalesOrderLinesSchema>;
export type InsertPtSalesOrderLineDistribution = z.infer<typeof insertPtSalesOrderLineDistributionsSchema>;
export type InsertPtForecast = z.infer<typeof insertPtForecastsSchema>;
export type InsertPtForecastShipment = z.infer<typeof insertPtForecastShipmentsSchema>;
export type InsertPtPurchaseToStock = z.infer<typeof insertPtPurchasesToStockSchema>;
export type InsertPtTransferOrder = z.infer<typeof insertPtTransferOrdersSchema>;
export type InsertPtTransferOrderDistribution = z.infer<typeof insertPtTransferOrderDistributionsSchema>;
export type InsertPtCapacityInterval = z.infer<typeof insertPtCapacityIntervalsSchema>;
export type InsertPtCapacityIntervalResourceAssignment = z.infer<typeof insertPtCapacityIntervalResourceAssignmentsSchema>;
export type InsertPtRecurringCapacityInterval = z.infer<typeof insertPtRecurringCapacityIntervalsSchema>;
export type InsertPtSchedule = z.infer<typeof insertPtSchedulesSchema>;
export type InsertPtMetric = z.infer<typeof insertPtMetricsSchema>;
export type InsertPtKPI = z.infer<typeof insertPtKPIsSchema>;
export type InsertPtProductRule = z.infer<typeof insertPtProductRulesSchema>;
export type InsertPtSystemData = z.infer<typeof insertPtSystemDataSchema>;