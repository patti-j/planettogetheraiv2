import { pgTable, text, serial, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PT Import Schema - For importing data from Planet Together APS system

// AllowedHelpers - Defines which resources can help other resources
export const ptAllowedHelpers = pgTable("pt_allowed_helpers", {
  id: serial("id").primaryKey(),
  allowedHelperPlantExternalId: text("allowed_helper_plant_external_id"),
  allowedHelperDepartmentExternalId: text("allowed_helper_department_external_id"),
  allowedHelperResourceExternalId: text("allowed_helper_resource_external_id"),
  resourcePlantExternalId: text("resource_plant_external_id"),
  resourceDepartmentExternalId: text("resource_department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attribute Code Tables
export const ptAttributeCodeTables = pgTable("pt_attribute_code_tables", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  description: text("description"),
  previousPrecedence: text("previous_precedence"),
  wildcard: text("wildcard"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeCodeTableAttrCodes = pgTable("pt_attribute_code_table_attr_codes", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  attributeExternalId: text("attribute_external_id"),
  durationHours: text("duration_hours"),
  previousOpAttributeCode: text("previous_op_attribute_code"),
  nextOpAttributeCode: text("next_op_attribute_code"),
  cleanoutGrade: text("cleanout_grade"),
  cost: text("cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeCodeTableAttrNames = pgTable("pt_attribute_code_table_attr_names", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  attributeExternalId: text("attribute_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeCodeTableResources = pgTable("pt_attribute_code_table_resources", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attribute Range Tables
export const ptAttributeRangeTables = pgTable("pt_attribute_range_tables", {
  id: serial("id").primaryKey(),
  name: text("name"),
  tableId: text("table_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeRangeTableAttrNames = pgTable("pt_attribute_range_table_attr_names", {
  id: serial("id").primaryKey(),
  attributeExternalId: text("attribute_external_id"),
  tableId: text("table_id"),
  description: text("description"),
  eligibilityConstraint: text("eligibility_constraint"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeRangeTableFrom = pgTable("pt_attribute_range_table_from", {
  id: serial("id").primaryKey(),
  attributeExternalId: text("attribute_external_id"),
  tableId: text("table_id"),
  fromId: text("from_id"),
  fromRangeStart: text("from_range_start"),
  fromRangeEnd: text("from_range_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeRangeTableTo = pgTable("pt_attribute_range_table_to", {
  id: serial("id").primaryKey(),
  attributeExternalId: text("attribute_external_id"),
  tableId: text("table_id"),
  fromId: text("from_id"),
  toRangeStart: text("to_range_start"),
  toRangeEnd: text("to_range_end"),
  setupCost: text("setup_cost"),
  setupMinutes: text("setup_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptAttributeRangeTableResources = pgTable("pt_attribute_range_table_resources", {
  id: serial("id").primaryKey(),
  tableId: text("table_id"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attributes - Master list of attributes for setup optimization
export const ptAttributes = pgTable("pt_attributes", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  attributeTrigger: text("attribute_trigger"),
  attributeType: text("attribute_type"),
  cleanoutGrade: text("cleanout_grade"),
  colorCode: text("color_code"),
  consecutiveSetup: text("consecutive_setup"),
  defaultCost: text("default_cost"),
  defaultDurationHrs: text("default_duration_hrs"),
  hideInGrids: text("hide_in_grids"),
  showInGantt: text("show_in_gantt"),
  useInSequencing: text("use_in_sequencing"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Capabilities - Skill or capability that resources can have
export const ptCapabilities = pgTable("pt_capabilities", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Capacity Intervals - Time periods when resources are available
export const ptCapacityIntervals = pgTable("pt_capacity_intervals", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  startDateTime: timestamp("start_date_time"),
  endDateTime: text("end_date_time"),
  description: text("description"),
  canStartActivity: text("can_start_activity"),
  capacityCode: text("capacity_code"),
  cleanOutSetups: text("clean_out_setups"),
  color: text("color"),
  intervalType: text("interval_type"),
  nbrOfPeople: text("nbr_of_people"),
  notes: text("notes"),
  overtime: text("overtime"),
  preventOperationsFromSpanning: text("prevent_operations_from_spanning"),
  usedForClean: text("used_for_clean"),
  usedForPostProcessing: text("used_for_post_processing"),
  usedForRun: text("used_for_run"),
  usedForSetup: text("used_for_setup"),
  usedForStoragePostProcessing: text("used_for_storage_post_processing"),
  useOnlyWhenLate: text("use_only_when_late"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCapacityIntervalResources = pgTable("pt_capacity_interval_resources", {
  id: serial("id").primaryKey(),
  capacityIntervalExternalId: text("capacity_interval_external_id"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cells - Work cells or production areas
export const ptCells = pgTable("pt_cells", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cleanout Trigger Tables
export const ptCleanoutTriggerTables = pgTable("pt_cleanout_trigger_tables", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCleanoutTriggerTableOpCount = pgTable("pt_cleanout_trigger_table_op_count", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  cleanCost: text("clean_cost"),
  durationHours: text("duration_hours"),
  triggerValue: text("trigger_value"),
  cleanoutGrade: text("cleanout_grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCleanoutTriggerTableProdUnits = pgTable("pt_cleanout_trigger_table_prod_units", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  durationHours: text("duration_hours"),
  productionUnit: text("production_unit"),
  triggerValue: text("trigger_value"),
  cleanCost: text("clean_cost"),
  cleanoutGrade: text("cleanout_grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCleanoutTriggerTableTime = pgTable("pt_cleanout_trigger_table_time", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  durationHours: text("duration_hours"),
  triggerValueHours: text("trigger_value_hours"),
  cleanCost: text("clean_cost"),
  cleanoutGrade: text("cleanout_grade"),
  triggerAtEnd: text("trigger_at_end"),
  usePostProcessingTime: text("use_post_processing_time"),
  useProcessingTime: text("use_processing_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCleanoutTriggerTableResources = pgTable("pt_cleanout_trigger_table_resources", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compatibility Code Tables
export const ptCompatibilityCodeTables = pgTable("pt_compatibility_code_tables", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  allowedList: text("allowed_list"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCompatibilityCodes = pgTable("pt_compatibility_codes", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  compatibilityCode: text("compatibility_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCompatibilityCodeTableResources = pgTable("pt_compatibility_code_table_resources", {
  id: serial("id").primaryKey(),
  tableName: text("table_name"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers
export const ptCustomers = pgTable("pt_customers", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  notes: text("notes"),
  abcCode: text("abc_code"),
  customerType: text("customer_type"),
  groupCode: text("group_code"),
  colorCode: text("color_code"),
  priority: text("priority"),
  region: text("region"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ptCustomerConnections = pgTable("pt_customer_connections", {
  id: serial("id").primaryKey(),
  customerExternalId: text("customer_external_id"),
  jobExternalId: text("job_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments
export const ptDepartments = pgTable("pt_departments", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  plantExternalId: text("plant_external_id"),
  name: text("name"),
  description: text("description"),
  departmentFrozenSpanHrs: text("department_frozen_span_hrs"),
  notes: text("notes"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forecasts
export const ptForecasts = pgTable("pt_forecasts", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  forecastVersion: text("forecast_version"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  forecastDate: text("forecast_date"),
  forecastQty: text("forecast_qty"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventories
export const ptInventories = pgTable("pt_inventories", {
  id: serial("id").primaryKey(),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  autoGenerateForecasts: text("auto_generate_forecasts"),
  bufferStock: text("buffer_stock"),
  daysOnHand: text("days_on_hand"),
  dbrReceivingBufferDays: text("dbr_receiving_buffer_days"),
  dbrShippingBufferDays: text("dbr_shipping_buffer_days"),
  forecastConsumption: text("forecast_consumption"),
  forecastConsumptionWindowDays: text("forecast_consumption_window_days"),
  forecastInterval: text("forecast_interval"),
  leadTimeDays: text("lead_time_days"),
  materialAllocation: text("material_allocation"),
  maxInventory: text("max_inventory"),
  mrpExcessQuantityAllocation: text("mrp_excess_quantity_allocation"),
  mrpProcessing: text("mrp_processing"),
  numberOfIntervalsToForecast: text("number_of_intervals_to_forecast"),
  onHandQty: text("on_hand_qty"),
  plannerExternalId: text("planner_external_id"),
  preventSharedBatchOverflow: text("prevent_shared_batch_overflow"),
  safetyStock: text("safety_stock"),
  safetyStockJobPriority: text("safety_stock_job_priority"),
  safetyStockWarningLevel: text("safety_stock_warning_level"),
  storageCapacity: text("storage_capacity"),
  templateJobExternalId: text("template_job_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items - Products, materials, and components
export const ptItems = pgTable("pt_items", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  batchSize: text("batch_size"),
  batchWindowHrs: text("batch_window_hrs"),
  cost: text("cost"),
  defaultLeadTimeDays: text("default_lead_time_days"),
  itemGroup: text("item_group"),
  itemType: text("item_type"),
  jobAutoSplitQty: text("job_auto_split_qty"),
  lotUsability: text("lot_usability"),
  maxOrderQty: text("max_order_qty"),
  minOrderQty: text("min_order_qty"),
  minOrderQtyRoundupLimit: text("min_order_qty_roundup_limit"),
  notes: text("notes"),
  planInventory: text("plan_inventory"),
  rollupAttributesToParent: text("rollup_attributes_to_parent"),
  shelfLifeHrs: text("shelf_life_hrs"),
  source: text("source"),
  transferQty: text("transfer_qty"),
  unitVolume: text("unit_volume"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs - Main manufacturing orders
export const ptJobs = pgTable("pt_jobs", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  releaseDate: text("release_date"),
  dueDate: text("due_date"),
  makeToOrderLineExternalId: text("make_to_order_line_external_id"),
  makeToOrderReleaseQty: text("make_to_order_release_qty"),
  makeToStock: text("make_to_stock"),
  makeToStockItemQty: text("make_to_stock_item_qty"),
  makeToStockItemReleaseQty: text("make_to_stock_item_release_qty"),
  makeToStockItemExternalId: text("make_to_stock_item_external_id"),
  makeToStockItemWarehouseExternalId: text("make_to_stock_item_warehouse_external_id"),
  customerExternalId: text("customer_external_id"),
  actualStartDateTime: text("actual_start_date_time"),
  aggregateDemand: text("aggregate_demand"),
  approved: text("approved"),
  category: text("category"),
  changeOverFrom: text("change_over_from"),
  changeOverTo: text("change_over_to"),
  color: text("color"),
  completedDateTime: text("completed_date_time"),
  customerCommitDate: text("customer_commit_date"),
  commitPromiseDate: text("commit_promise_date"),
  demandSourceOrderExternalId: text("demand_source_order_external_id"),
  excessProductionPercentage: text("excess_production_percentage"),
  extraQuantity: text("extra_quantity"),
  firm: text("firm"),
  holdReason: text("hold_reason"),
  holdUntilDateTime: text("hold_until_date_time"),
  jobType: text("job_type"),
  kanbanExternalId: text("kanban_external_id"),
  locked: text("locked"),
  minorRevisionNbr: text("minor_revision_nbr"),
  needDate: text("need_date"),
  notes: text("notes"),
  onHold: text("on_hold"),
  optimization: text("optimization"),
  priority: text("priority"),
  priorityRank: text("priority_rank"),
  productionStatus: text("production_status"),
  profit: text("profit"),
  promisedShipDate: text("promised_ship_date"),
  releaseRequestDate: text("release_request_date"),
  repeatableTemplate: text("repeatable_template"),
  revisionNbr: text("revision_nbr"),
  salePrice: text("sale_price"),
  shortNote: text("short_note"),
  showOnHotList: text("show_on_hot_list"),
  skipMaterialRequirements: text("skip_material_requirements"),
  sourceCoOrder: text("source_co_order"),
  status: text("status"),
  templateName: text("template_name"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  userGroup: text("user_group"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Activities - Actual scheduled activities for jobs
export const ptJobActivities = pgTable("pt_job_activities", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  requiredFinishQty: text("required_finish_qty"),
  actualResourcesUsed: text("actual_resources_used"),
  anchor: text("anchor"),
  anchorStartDate: text("anchor_start_date"),
  batchAmount: text("batch_amount"),
  cleanHrs: text("clean_hrs"),
  cleanTimeManualUpdateOnly: text("clean_time_manual_update_only"),
  cleanOutGrade: text("clean_out_grade"),
  comments: text("comments"),
  comments2: text("comments2"),
  cycleHrs: text("cycle_hrs"),
  cycleSpanManualUpdateOnly: text("cycle_span_manual_update_only"),
  nbrOfPeople: text("nbr_of_people"),
  paused: text("paused"),
  peopleUsage: text("people_usage"),
  planningScrapPercent: text("planning_scrap_percent"),
  scrapPercentManualUpdateOnly: text("scrap_percent_manual_update_only"),
  postProcessingHrs: text("post_processing_hrs"),
  postProcessManualUpdateOnly: text("post_process_manual_update_only"),
  productionStatus: text("production_status"),
  qtyPerCycle: text("qty_per_cycle"),
  qtyPerCycleManualUpdateOnly: text("qty_per_cycle_manual_update_only"),
  reportedCleanHrs: text("reported_clean_hrs"),
  reportedCleanoutGrade: text("reported_cleanout_grade"),
  reportedEndOfRunDate: text("reported_end_of_run_date"),
  reportedFinishDate: text("reported_finish_date"),
  reportedGoodQty: text("reported_good_qty"),
  reportedPostProcessingHrs: text("reported_post_processing_hrs"),
  reportedRunHrs: text("reported_run_hrs"),
  reportedScrapQty: text("reported_scrap_qty"),
  reportedSetupHrs: text("reported_setup_hrs"),
  reportedStartDate: text("reported_start_date"),
  reportedStartOfProcessingDate: text("reported_start_of_processing_date"),
  scheduledCycleHrs: text("scheduled_cycle_hrs"),
  scheduledCleanHrs: text("scheduled_clean_hrs"),
  scheduledPostProcessingHrs: text("scheduled_post_processing_hrs"),
  scheduledPostProcessingZeroLength: text("scheduled_post_processing_zero_length"),
  scheduledRunZeroLength: text("scheduled_run_zero_length"),
  scheduledSetupHrs: text("scheduled_setup_hrs"),
  scheduledSetupZeroLength: text("scheduled_setup_zero_length"),
  setupHrs: text("setup_hrs"),
  setupTimeManualUpdateOnly: text("setup_time_manual_update_only"),
  tankPostProcessingHrs: text("tank_post_processing_hrs"),
  tankPostProcessingHrsManualUpdateOnly: text("tank_post_processing_hrs_manual_update_only"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Materials - Materials required for job operations
export const ptJobMaterials = pgTable("pt_job_materials", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  totalRequiredQty: text("total_required_qty"),
  allowedLotCodes: text("allowed_lot_codes"),
  allowPartialSupply: text("allow_partial_supply"),
  available: text("available"),
  constraintType: text("constraint_type"),
  fixedQty: text("fixed_qty"),
  issuedQty: text("issued_qty"),
  latestSourceDateTime: text("latest_source_date_time"),
  leadTimeHrs: text("lead_time_hrs"),
  materialAllocation: text("material_allocation"),
  materialDescription: text("material_description"),
  materialName: text("material_name"),
  materialSourcing: text("material_sourcing"),
  maxSourceQty: text("max_source_qty"),
  minAgeHrs: text("min_age_hrs"),
  minRemainingShelfLifeHrs: text("min_remaining_shelf_life_hrs"),
  minSourceQty: text("min_source_qty"),
  multipleWarehouseSupplyAllowed: text("multiple_warehouse_supply_allowed"),
  plannedScrapQty: text("planned_scrap_qty"),
  productRelease: text("product_release"),
  requirementType: text("requirement_type"),
  source: text("source"),
  tankStorageReleaseTiming: text("tank_storage_release_timing"),
  totalCost: text("total_cost"),
  uom: text("uom"),
  usabilityRequirement: text("usability_requirement"),
  useOverlapActivities: text("use_overlap_activities"),
  useOverlapPurchases: text("use_overlap_purchases"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Operation Attributes - Attributes for job operations
export const ptJobOperationAttributes = pgTable("pt_job_operation_attributes", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  attributeExternalId: text("attribute_external_id"),
  code: text("code"),
  codeManualUpdateOnly: text("code_manual_update_only"),
  colorCode: text("color_code"),
  colorOverride: text("color_override"),
  colorCodeManualUpdateOnly: text("color_code_manual_update_only"),
  cost: text("cost"),
  costOverride: text("cost_override"),
  costManualUpdateOnly: text("cost_manual_update_only"),
  durationHrs: text("duration_hrs"),
  durationOverride: text("duration_override"),
  durationHrsManualUpdateOnly: text("duration_hrs_manual_update_only"),
  number: text("number"),
  numberManualUpdateOnly: text("number_manual_update_only"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Operations - Operations within jobs
export const ptJobOperations = pgTable("pt_job_operations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  requiredFinishQty: text("required_finish_qty"),
  cycleHrs: text("cycle_hrs"),
  cycleSpanManualUpdateOnly: text("cycle_span_manual_update_only"),
  qtyPerCycle: text("qty_per_cycle"),
  qtyPerCycleManualUpdateOnly: text("qty_per_cycle_manual_update_only"),
  description: text("description"),
  autoCreatedCapabilityExternalId: text("auto_created_capability_external_id"),
  autoCreateRequirements: text("auto_create_requirements"),
  autoFinish: text("auto_finish"),
  autoReportProgress: text("auto_report_progress"),
  autoSplit: text("auto_split"),
  autoSplitType: text("auto_split_type"),
  minAutoSplitAmount: text("min_auto_split_amount"),
  maxAutoSplitAmount: text("max_auto_split_amount"),
  batchCode: text("batch_code"),
  canPause: text("can_pause"),
  canResize: text("can_resize"),
  canSubcontract: text("can_subcontract"),
  carryingCost: text("carrying_cost"),
  cleanHrs: text("clean_hrs"),
  cleanTimeManualUpdateOnly: text("clean_time_manual_update_only"),
  cleanOutGrade: text("clean_out_grade"),
  commitEndDate: text("commit_end_date"),
  commitStartDate: text("commit_start_date"),
  compatibilityCode: text("compatibility_code"),
  useCompatibilityCode: text("use_compatibility_code"),
  deductScrapFromRequired: text("deduct_scrap_from_required"),
  onHold: text("on_hold"),
  holdReason: text("hold_reason"),
  holdUntilDateTime: text("hold_until_date_time"),
  isRework: text("is_rework"),
  jitStartDateBufferDays: text("jit_start_date_buffer_days"),
  keepSuccessorsTimeLimitHrs: text("keep_successors_time_limit_hrs"),
  materialsManualUpdateOnly: text("materials_manual_update_only"),
  notes: text("notes"),
  omitted: text("omitted"),
  operationSequence: text("operation_sequence"),
  outputName: text("output_name"),
  overlapTransferQty: text("overlap_transfer_qty"),
  plannedScrapQty: text("planned_scrap_qty"),
  planningScrapPercent: text("planning_scrap_percent"),
  preventSplitsFromIncurringClean: text("prevent_splits_from_incurring_clean"),
  preventSplitsFromIncurringSetup: text("prevent_splits_from_incurring_setup"),
  scrapPercentManualUpdateOnly: text("scrap_percent_manual_update_only"),
  postProcessingHrs: text("post_processing_hrs"),
  postProcessManualUpdateOnly: text("post_process_manual_update_only"),
  productCode: text("product_code"),
  productsManualUpdateOnly: text("products_manual_update_only"),
  resourceRequirementsManualUpdateOnly: text("resource_requirements_manual_update_only"),
  setupCode: text("setup_code"),
  setupColor: text("setup_color"),
  setupHrs: text("setup_hrs"),
  setupTimeManualUpdateOnly: text("setup_time_manual_update_only"),
  setupNumber: text("setup_number"),
  setupSplitType: text("setup_split_type"),
  splitUpdateMode: text("split_update_mode"),
  standardRunHrs: text("standard_run_hrs"),
  standardSetupHrs: text("standard_setup_hrs"),
  successorProcessing: text("successor_processing"),
  tankPostProcessingHrs: text("tank_post_processing_hrs"),
  tankPostProcessingManualUpdateOnly: text("tank_post_processing_manual_update_only"),
  timeBasedReporting: text("time_based_reporting"),
  uom: text("uom"),
  useExpectedFinishQty: text("use_expected_finish_qty"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  wholeNumberSplits: text("whole_number_splits"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Paths - Routing paths for jobs
export const ptJobPaths = pgTable("pt_job_paths", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  name: text("name"),
  autoBuildLinearPath: text("auto_build_linear_path"),
  autoUse: text("auto_use"),
  autoUseReleaseOffsetDays: text("auto_use_release_offset_days"),
  preference: text("preference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Path Nodes - Connections between operations in job paths
export const ptJobPathNodes = pgTable("pt_job_path_nodes", {
  id: serial("id").primaryKey(),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  pathExternalId: text("path_external_id"),
  predecessorOperationExternalId: text("predecessor_operation_external_id"),
  allowManualConnectorViolation: text("allow_manual_connector_violation"),
  autoFinishPredecessor: text("auto_finish_predecessor"),
  ignoreInvalidSuccessorOperationExternalIds: text("ignore_invalid_successor_operation_external_ids"),
  maxDelayHrs: text("max_delay_hrs"),
  overlapPercentComplete: text("overlap_percent_complete"),
  overlapSetups: text("overlap_setups"),
  overlapTransferHrs: text("overlap_transfer_hrs"),
  overlapType: text("overlap_type"),
  successorOperationExternalId: text("successor_operation_external_id"),
  transferDuringPredeccessorOnlineTime: text("transfer_during_predecessor_online_time"),
  transferHrs: text("transfer_hrs"),
  transferStart: text("transfer_start"),
  transferEnd: text("transfer_end"),
  usageQtyPerCycle: text("usage_qty_per_cycle"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Products - Products produced by job operations
export const ptJobProducts = pgTable("pt_job_products", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  totalOutputQty: text("total_output_qty"),
  completedQty: text("completed_qty"),
  fixedQty: text("fixed_qty"),
  inventoryAvailableTiming: text("inventory_available_timing"),
  limitMatlSrcToEligibleLots: text("limit_matl_src_to_eligible_lots"),
  useLimitMatlSrcToEligibleLots: text("use_limit_matl_src_to_eligible_lots"),
  lotCode: text("lot_code"),
  materialPostProcessingHrs: text("material_post_processing_hrs"),
  materialRequirement: text("material_requirement"),
  predecessor: text("predecessor"),
  setWarehouseDuringMRP: text("set_warehouse_during_mrp"),
  storeInTank: text("store_in_tank"),
  unitVolumeOverride: text("unit_volume_override"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Resource Capabilities - Capabilities required by job resources
export const ptJobResourceCapabilities = pgTable("pt_job_resource_capabilities", {
  id: serial("id").primaryKey(),
  capabilityExternalId: text("capability_external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  resourceRequirementExternalId: text("resource_requirement_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Resources - Resources required for job operations
export const ptJobResources = pgTable("pt_job_resources", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  jobExternalId: text("job_external_id"),
  moExternalId: text("mo_external_id"),
  opExternalId: text("op_external_id"),
  description: text("description"),
  attentionPercent: text("attention_percent"),
  blockFillImageFile: text("block_fill_image_file"),
  blockFillPattern: text("block_fill_pattern"),
  blockFillType: text("block_fill_type"),
  capacityCode: text("capacity_code"),
  copyMaterialsToCapabilities: text("copy_materials_to_capabilities"),
  cycleTimeEfficiencyMultiplier: text("cycle_time_efficiency_multiplier"),
  eligibleResourceConstraint: text("eligible_resource_constraint"),
  eligibleResourceCount: text("eligible_resource_count"),
  ganttDisplayPriority: text("gantt_display_priority"),
  ganttRowHeightFactor: text("gantt_row_height_factor"),
  imageFileName: text("image_file_name"),
  jobResourceParallelism: text("job_resource_parallelism"),
  jobResourceType: text("job_resource_type"),
  manualAssignmentOnly: text("manual_assignment_only"),
  multipleRequiredHelperResourceCount: text("multiple_required_helper_resource_count"),
  plannedSetupColor: text("planned_setup_color"),
  requiredHelperResourceCount: text("required_helper_resource_count"),
  resourceExternalId: text("resource_external_id"),
  scheduleResourceInParallel: text("schedule_resource_in_parallel"),
  setupEfficiencyMultiplier: text("setup_efficiency_multiplier"),
  showUnscheduledActivityBlocks: text("show_unscheduled_activity_blocks"),
  unitResourcePercent: text("unit_resource_percent"),
  useOperationSetupTime: text("use_operation_setup_time"),
  useSetupCode: text("use_setup_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Resource Blocks - Primary scheduling output defining which resources are used at which time intervals
export const ptJobResourceBlocks = pgTable("ptjobresourceblocks", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: text("instance_id").notNull(),
  jobId: text("job_id").notNull(),
  manufacturingOrderId: text("manufacturing_order_id").notNull(),
  operationId: text("operation_id").notNull(),
  activityId: text("activity_id").notNull(),
  blockId: text("block_id").notNull(),
  batchId: text("batch_id").notNull(),
  plantId: text("plant_id").notNull(),
  departmentId: text("department_id").notNull(),
  resourceId: text("resource_id").notNull(),
  scheduledStart: text("scheduled_start"),
  scheduledEnd: text("scheduled_end"),
  locked: boolean("locked"),
  sequence: text("sequence"),
  runNbr: text("run_nbr"),
  resourceRequirementId: text("resource_requirement_id"),
  durationHrs: text("duration_hrs"),
  laborCost: text("labor_cost"),
  machineCost: text("machine_cost"),
  resourceRequirementIndex: text("resource_requirement_index"),
  scheduled: boolean("scheduled"),
  batched: boolean("batched"),
  scheduleId: text("schedule_id"),
});

// Job Resource Block Intervals - Detailed breakdown defining the various contiguous time segments of the block
export const ptJobResourceBlockIntervals = pgTable("ptjobresourceblockintervals", {
  id: serial("id").primaryKey(),
  publishDate: timestamp("publish_date").notNull(),
  instanceId: text("instance_id").notNull(),
  jobId: text("job_id").notNull(),
  manufacturingOrderId: text("manufacturing_order_id").notNull(),
  operationId: text("operation_id").notNull(),
  activityId: text("activity_id").notNull(),
  blockId: text("block_id").notNull(), // References ptJobResourceBlocks.blockId (not database id)
  intervalIndex: text("interval_index").notNull(),
  outputQty: text("output_qty"),
  shiftStart: text("shift_start"),
  shiftEnd: text("shift_end"),
  shiftName: text("shift_name"),
  shiftDescription: text("shift_description"),
  shiftNbrOfPeople: text("shift_nbr_of_people"),
  shiftType: text("shift_type"),
  setupStart: text("setup_start"),
  setupEnd: text("setup_end"),
  runStart: text("run_start"),
  runEnd: text("run_end"),
  postProcessingStart: text("post_processing_start"),
  postProcessingEnd: text("post_processing_end"),
  scheduledStart: text("scheduled_start"),
  scheduledEnd: text("scheduled_end"),
});

// Plants - Manufacturing facilities
export const ptPlants = pgTable("pt_plants", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  annualPercentageRate: text("annual_percentage_rate"),
  bottleneckThreshold: text("bottleneck_threshold"),
  dailyOperatingExpense: text("daily_operating_expense"),
  heavyLoadThreshold: text("heavy_load_threshold"),
  investedCapital: text("invested_capital"),
  notes: text("notes"),
  stableSpanHrs: text("stable_span_hrs"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plant Warehouses - Warehouses associated with plants
export const ptPlantWarehouses = pgTable("pt_plant_warehouses", {
  id: serial("id").primaryKey(),
  warehouseExternalId: text("warehouse_external_id"),
  plantExternalId: text("plant_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Rules - Rules for products on resources
export const ptProductRules = pgTable("pt_product_rules", {
  id: serial("id").primaryKey(),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  productItemExternalId: text("product_item_external_id"),
  cleanHrs: text("clean_hrs"),
  useCleanHrs: text("use_clean_hrs"),
  cleanoutUnitsRatio: text("cleanout_units_ratio"),
  useCleanoutUnits: text("use_cleanout_units"),
  cycleHrs: text("cycle_hrs"),
  useCycleHrs: text("use_cycle_hrs"),
  headStartHrs: text("head_start_hrs"),
  useHeadStartSpan: text("use_head_start_span"),
  materialPostProcessingHrs: text("material_post_processing_hrs"),
  useMaterialPostProcessingSpan: text("use_material_post_processing_span"),
  maxQty: text("max_qty"),
  useMaxQty: text("use_max_qty"),
  minQty: text("min_qty"),
  useMinQty: text("use_min_qty"),
  maxVolume: text("max_volume"),
  useMaxVolume: text("use_max_volume"),
  minVolume: text("min_volume"),
  useMinVolume: text("use_min_volume"),
  operationCode: text("operation_code"),
  planningScrapPercent: text("planning_scrap_percent"),
  usePlanningScrapPercent: text("use_planning_scrap_percent"),
  postProcessingHrs: text("post_processing_hrs"),
  usePostProcessingHrs: text("use_post_processing_hrs"),
  qtyPerCycle: text("qty_per_cycle"),
  useQtyPerCycle: text("use_qty_per_cycle"),
  setupHrs: text("setup_hrs"),
  useSetupHrs: text("use_setup_hrs"),
  transferQty: text("transfer_qty"),
  useTransferQty: text("use_transfer_qty"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchases To Stock - Purchase orders for inventory
export const ptPurchasesToStock = pgTable("pt_purchases_to_stock", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  name: text("name"),
  description: text("description"),
  qtyOrdered: text("qty_ordered"),
  scheduledReceiptDate: text("scheduled_receipt_date"),
  actualReceiptDate: text("actual_receipt_date"),
  buyerExternalId: text("buyer_external_id"),
  closed: text("closed"),
  firm: text("firm"),
  limitMatlSrcToEligibleLots: text("limit_matl_src_to_eligible_lots"),
  useLimitMatlSrcToEligibleLots: text("use_limit_matl_src_to_eligible_lots"),
  lotCode: text("lot_code"),
  notes: text("notes"),
  qtyReceived: text("qty_received"),
  transferHrs: text("transfer_hrs"),
  unloadHrs: text("unload_hrs"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  vendorExternalId: text("vendor_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring Capacity Intervals - Repeating capacity patterns
export const ptRecurringCapacityIntervals = pgTable("pt_recurring_capacity_intervals", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  startDateTime: timestamp("start_date_time"),
  endDateTime: text("end_date_time"),
  recurrence: text("recurrence"),
  recurrenceEndType: text("recurrence_end_type"),
  description: text("description"),
  color: text("color"),
  sunday: text("sunday"),
  monday: text("monday"),
  tuesday: text("tuesday"),
  wednesday: text("wednesday"),
  thursday: text("thursday"),
  friday: text("friday"),
  saturday: text("saturday"),
  intervalType: text("interval_type"),
  canStartActivity: text("can_start_activity"),
  capacityCode: text("capacity_code"),
  cleanOutSetups: text("clean_out_setups"),
  overtime: text("overtime"),
  preventOperationsFromSpanning: text("prevent_operations_from_spanning"),
  usedForClean: text("used_for_clean"),
  usedForPostProcessing: text("used_for_post_processing"),
  usedForRun: text("used_for_run"),
  usedForSetup: text("used_for_setup"),
  usedForStoragePostProcessing: text("used_for_storage_post_processing"),
  useOnlyWhenLate: text("use_only_when_late"),
  maxNbrRecurrences: text("max_nbr_recurrences"),
  monthlyDayNumber: text("monthly_day_number"),
  nbrIntervalsToOverride: text("nbr_intervals_to_override"),
  nbrOfPeople: text("nbr_of_people"),
  nbrOfPeopleOverride: text("nbr_of_people_override"),
  notes: text("notes"),
  recurrenceEndDateTime: text("recurrence_end_date_time"),
  skipFrequency: text("skip_frequency"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Capabilities - Capabilities that resources have
export const ptResourceCapabilities = pgTable("pt_resource_capabilities", {
  id: serial("id").primaryKey(),
  capabilityExternalId: text("capability_external_id"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Connections - Connections between resources
export const ptResourceConnections = pgTable("pt_resource_connections", {
  id: serial("id").primaryKey(),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  resourceExternalId: text("resource_external_id"),
  connectionDirection: text("connection_direction"),
  resourceConnectorExternalId: text("resource_connector_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource Connectors - Defines connections between resources
export const ptResourceConnectors = pgTable("pt_resource_connectors", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  linkMaterials: text("link_materials"),
  linkSuccessors: text("link_successors"),
  notes: text("notes"),
  transitHours: text("transit_hours"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resources - Manufacturing resources (machines, work centers, etc.)
export const ptResources = pgTable("pt_resources", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  plantExternalId: text("plant_external_id"),
  departmentExternalId: text("department_external_id"),
  name: text("name"),
  description: text("description"),
  active: text("active"),
  activitySetupEfficiencyMultiplier: text("activity_setup_efficiency_multiplier"),
  autoJoinHrs: text("auto_join_hrs"),
  autoSplitHrs: text("auto_split_hrs"),
  batchType: text("batch_type"),
  batchVolume: text("batch_volume"),
  bufferSpanHrs: text("buffer_span_hrs"),
  capacityType: text("capacity_type"),
  cellExternalId: text("cell_external_id"),
  changeoverSetupEfficiencyMultiplier: text("changeover_setup_efficiency_multiplier"),
  consecutiveSetupTimes: text("consecutive_setup_times"),
  cycleEfficiencyMultiplier: text("cycle_efficiency_multiplier"),
  disallowDragAndDrops: text("disallow_drag_and_drops"),
  discontinueSameCellScheduling: text("discontinue_same_cell_scheduling"),
  drum: text("drum"),
  excludeFromGantts: text("exclude_from_gantts"),
  experimentalSequencingPlan: text("experimental_sequencing_plan"),
  experimentalSequencingPlanTwo: text("experimental_sequencing_plan_two"),
  experimentalSequencingPlanThree: text("experimental_sequencing_plan_three"),
  experimentalSequencingPlanFour: text("experimental_sequencing_plan_four"),
  ganttRowHeightFactor: text("gantt_row_height_factor"),
  headStartHrs: text("head_start_hrs"),
  imageFileName: text("image_file_name"),
  isTank: text("is_tank"),
  manualAssignmentOnly: text("manual_assignment_only"),
  maxQty: text("max_qty"),
  maxQtyPerCycle: text("max_qty_per_cycle"),
  maxSameSetupHrs: text("max_same_setup_hrs"),
  maxVolume: text("max_volume"),
  minNbrOfPeople: text("min_nbr_of_people"),
  minQty: text("min_qty"),
  minQtyPerCycle: text("min_qty_per_cycle"),
  minVolume: text("min_volume"),
  noDefaultRecurringCapacityInterval: text("no_default_recurring_capacity_interval"),
  normalSequencingPlan: text("normal_sequencing_plan"),
  notes: text("notes"),
  omitSetupOnFirstActivity: text("omit_setup_on_first_activity"),
  omitSetupOnFirstActivityInShift: text("omit_setup_on_first_activity_in_shift"),
  overtimeHourlyCost: text("overtime_hourly_cost"),
  resourceType: text("resource_type"),
  scheduledRunSpanAlgorithm: text("scheduled_run_span_algorithm"),
  scheduledSetupSpanAlgorithm: text("scheduled_setup_span_algorithm"),
  scheduledTransferSpanAlgorithm: text("scheduled_transfer_span_algorithm"),
  sequential: text("sequential"),
  setupEfficiencyMultiplier: text("setup_efficiency_multiplier"),
  setupHrs: text("setup_hrs"),
  setupIncluded: text("setup_included"),
  stage: text("stage"),
  standardCleanHours: text("standard_clean_hours"),
  standardCleanoutGrade: text("standard_cleanout_grade"),
  standardHourlyCost: text("standard_hourly_cost"),
  transferHrs: text("transfer_hrs"),
  useAttributeCleanouts: text("use_attribute_cleanouts"),
  useOperationCleanout: text("use_operation_cleanout"),
  useOperationSetupTime: text("use_operation_setup_time"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  workcenter: text("workcenter"),
  workcenterExternalId: text("workcenter_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Orders
export const ptSalesOrders = pgTable("pt_sales_orders", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  cancelAtExpirationDate: text("cancel_at_expiration_date"),
  cancelled: text("cancelled"),
  customerExternalId: text("customer_external_id"),
  estimate: text("estimate"),
  expirationDate: text("expiration_date"),
  notes: text("notes"),
  planner: text("planner"),
  project: text("project"),
  salesAmount: text("sales_amount"),
  salesOffice: text("sales_office"),
  salesPerson: text("sales_person"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Order Lines
export const ptSalesOrderLines = pgTable("pt_sales_order_lines", {
  id: serial("id").primaryKey(),
  salesOrderExternalId: text("sales_order_external_id"),
  itemExternalId: text("item_external_id"),
  lineNumber: text("line_number"),
  description: text("description"),
  unitPrice: text("unit_price"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Order Line Distributions
export const ptSalesOrderLineDistributions = pgTable("pt_sales_order_line_distributions", {
  id: serial("id").primaryKey(),
  salesOrderExternalId: text("sales_order_external_id"),
  lineNumber: text("line_number"),
  qtyOrdered: text("qty_ordered"),
  requiredAvailableDate: text("required_available_date"),
  mustSupplyFromWarehouseExternalId: text("must_supply_from_warehouse_external_id"),
  useMustSupplyFromWarehouseExternalId: text("use_must_supply_from_warehouse_external_id"),
  allowedLotCodes: text("allowed_lot_codes"),
  allowPartialAllocations: text("allow_partial_allocations"),
  closed: text("closed"),
  hold: text("hold"),
  holdReason: text("hold_reason"),
  materialAllocation: text("material_allocation"),
  materialSourcing: text("material_sourcing"),
  maximumLatenessDays: text("maximum_lateness_days"),
  maxSourceQty: text("max_source_qty"),
  minAllocationQty: text("min_allocation_qty"),
  minSourceQty: text("min_source_qty"),
  priority: text("priority"),
  qtyShipped: text("qty_shipped"),
  salesRegion: text("sales_region"),
  shipToZone: text("ship_to_zone"),
  stockShortageRule: text("stock_shortage_rule"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transfer Orders
export const ptTransferOrders = pgTable("pt_transfer_orders", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  closed: text("closed"),
  description: text("description"),
  notes: text("notes"),
  priority: text("priority"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transfer Order Distributions
export const ptTransferOrderDistributions = pgTable("pt_transfer_order_distributions", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  transferOrderExternalId: text("transfer_order_external_id"),
  itemExternalId: text("item_external_id"),
  fromWarehouseExternalId: text("from_warehouse_external_id"),
  toWarehouseExternalId: text("to_warehouse_external_id"),
  qtyOrdered: text("qty_ordered"),
  qtyReceived: text("qty_received"),
  qtyShipped: text("qty_shipped"),
  scheduledReceiveDate: text("scheduled_receive_date"),
  scheduledShipDate: text("scheduled_ship_date"),
  closed: text("closed"),
  materialAllocation: text("material_allocation"),
  materialSourcing: text("material_sourcing"),
  maxSourceQty: text("max_source_qty"),
  minSourceQty: text("min_source_qty"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PT Import Users (different from application users)
export const ptUsers = pgTable("pt_users", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  login: text("login"),
  active: text("active"),
  description: text("description"),
  displayLanguage: text("display_language"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  notes: text("notes"),
  password: text("password"),
  plantPermissionGroup: text("plant_permission_group"),
  requirePasswordResetAtNextLogin: text("require_password_reset_at_next_login"),
  timeZone: text("time_zone"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  userPermissionGroup: text("user_permission_group"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Warehouses
export const ptWarehouses = pgTable("pt_warehouses", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  description: text("description"),
  annualPercentageRate: text("annual_percentage_rate"),
  nbrOfDocks: text("nbr_of_docks"),
  notes: text("notes"),
  storageCapacity: text("storage_capacity"),
  tankWarehouse: text("tank_warehouse"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ForecastShipments - Forecast shipment data
export const ptForecastShipments = pgTable("pt_forecast_shipments", {
  id: serial("id").primaryKey(),
  forecastExternalId: text("forecast_external_id"),
  requiredDate: text("required_date"),
  requiredQty: text("required_qty"),
  warehouseExternalId: text("warehouse_external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// JobSuccessorManufacturingOrders - Job successor relationships to manufacturing orders
export const ptJobSuccessorManufacturingOrders = pgTable("pt_job_successor_manufacturing_orders", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  manufacturingOrderId: integer("manufacturing_order_id").references(() => ptManufacturingOrders.id),
  successorManufacturingOrderId: integer("successor_manufacturing_order_id").references(() => ptManufacturingOrders.id),
  successorOperationId: integer("successor_operation_id").references(() => ptJobOperations.id),
  successorPathId: integer("successor_path_id").references(() => ptJobPaths.id),
  transferHrs: text("transfer_hrs"),
  usageQtyPerCycle: text("usage_qty_per_cycle"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lots - Lot/batch tracking information
export const ptLots = pgTable("pt_lots", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  itemExternalId: text("item_external_id"),
  warehouseExternalId: text("warehouse_external_id"),
  qty: text("qty"),
  code: text("code"),
  expirationDate: text("expiration_date"),
  limitMatlSrcToEligibleLots: text("limit_matl_src_to_eligible_lots"),
  lotProductionDate: text("lot_production_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ManufacturingOrders - Manufacturing order master data
export const ptManufacturingOrders = pgTable("pt_manufacturing_orders", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  name: text("name"),
  jobExternalId: text("job_external_id"),
  requiredQty: text("required_qty"),
  description: text("description"),
  alternatePathSelection: text("alternate_path_selection"),
  autoJoinGroup: text("auto_join_group"),
  batchDefinitionName: text("batch_definition_name"),
  batchGroupName: text("batch_group_name"),
  canSpanPlants: text("can_span_plants"),
  copyRoutingFromTemplate: text("copy_routing_from_template"),
  dbrShippingBufferOverrideDays: text("dbr_shipping_buffer_override_days"),
  defaultPathExternalId: text("default_path_external_id"),
  expectedFinishQty: text("expected_finish_qty"),
  family: text("family"),
  hold: text("hold"),
  holdReason: text("hold_reason"),
  holdUntilDate: text("hold_until_date"),
  isReleased: text("is_released"),
  lockedPlantExternalId: text("locked_plant_external_id"),
  lockToCurrentAlternatePath: text("lock_to_current_alternate_path"),
  moNeedDate: text("mo_need_date"),
  needDate: text("need_date"),
  notes: text("notes"),
  preserveRequiredQty: text("preserve_required_qty"),
  productColor: text("product_color"),
  productDescription: text("product_description"),
  productName: text("product_name"),
  releaseDateTime: text("release_date_time"),
  splitUpdateMode: text("split_update_mode"),
  uom: text("uom"),
  userFields: jsonb("user_fields").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export insert schemas and types for each table
export const insertPtAllowedHelpersSchema = createInsertSchema(ptAllowedHelpers).omit({ id: true, createdAt: true });
export type InsertPtAllowedHelpers = z.infer<typeof insertPtAllowedHelpersSchema>;
export type PtAllowedHelpers = typeof ptAllowedHelpers.$inferSelect;

export const insertPtAttributesSchema = createInsertSchema(ptAttributes).omit({ id: true, createdAt: true });
export type InsertPtAttributes = z.infer<typeof insertPtAttributesSchema>;
export type PtAttributes = typeof ptAttributes.$inferSelect;

export const insertPtCapabilitiesSchema = createInsertSchema(ptCapabilities).omit({ id: true, createdAt: true });
export type InsertPtCapabilities = z.infer<typeof insertPtCapabilitiesSchema>;
export type PtCapabilities = typeof ptCapabilities.$inferSelect;

export const insertPtCustomersSchema = createInsertSchema(ptCustomers).omit({ id: true, createdAt: true });
export type InsertPtCustomers = z.infer<typeof insertPtCustomersSchema>;
export type PtCustomers = typeof ptCustomers.$inferSelect;

export const insertPtDepartmentsSchema = createInsertSchema(ptDepartments).omit({ id: true, createdAt: true });
export type InsertPtDepartments = z.infer<typeof insertPtDepartmentsSchema>;
export type PtDepartments = typeof ptDepartments.$inferSelect;

export const insertPtItemsSchema = createInsertSchema(ptItems).omit({ id: true, createdAt: true });
export type InsertPtItems = z.infer<typeof insertPtItemsSchema>;
export type PtItems = typeof ptItems.$inferSelect;

export const insertPtJobsSchema = createInsertSchema(ptJobs).omit({ id: true, createdAt: true });
export type InsertPtJobs = z.infer<typeof insertPtJobsSchema>;
export type PtJobs = typeof ptJobs.$inferSelect;

export const insertPtJobOperationsSchema = createInsertSchema(ptJobOperations).omit({ id: true, createdAt: true });
export type InsertPtJobOperations = z.infer<typeof insertPtJobOperationsSchema>;
export type PtJobOperations = typeof ptJobOperations.$inferSelect;

export const insertPtPlantsSchema = createInsertSchema(ptPlants).omit({ id: true, createdAt: true });
export type InsertPtPlants = z.infer<typeof insertPtPlantsSchema>;
export type PtPlants = typeof ptPlants.$inferSelect;

export const insertPtResourcesSchema = createInsertSchema(ptResources).omit({ id: true, createdAt: true });
export type InsertPtResources = z.infer<typeof insertPtResourcesSchema>;
export type PtResources = typeof ptResources.$inferSelect;

export const insertPtSalesOrdersSchema = createInsertSchema(ptSalesOrders).omit({ id: true, createdAt: true });
export type InsertPtSalesOrders = z.infer<typeof insertPtSalesOrdersSchema>;
export type PtSalesOrders = typeof ptSalesOrders.$inferSelect;

export const insertPtWarehousesSchema = createInsertSchema(ptWarehouses).omit({ id: true, createdAt: true });
export type InsertPtWarehouses = z.infer<typeof insertPtWarehousesSchema>;
export type PtWarehouses = typeof ptWarehouses.$inferSelect;

export const insertPtForecastShipmentsSchema = createInsertSchema(ptForecastShipments).omit({ id: true, createdAt: true });
export type InsertPtForecastShipments = z.infer<typeof insertPtForecastShipmentsSchema>;
export type PtForecastShipments = typeof ptForecastShipments.$inferSelect;

export const insertPtJobSuccessorManufacturingOrdersSchema = createInsertSchema(ptJobSuccessorManufacturingOrders).omit({ id: true, createdAt: true });
export type InsertPtJobSuccessorManufacturingOrders = z.infer<typeof insertPtJobSuccessorManufacturingOrdersSchema>;
export type PtJobSuccessorManufacturingOrders = typeof ptJobSuccessorManufacturingOrders.$inferSelect;

export const insertPtLotsSchema = createInsertSchema(ptLots).omit({ id: true, createdAt: true });
export type InsertPtLots = z.infer<typeof insertPtLotsSchema>;
export type PtLots = typeof ptLots.$inferSelect;

export const insertPtManufacturingOrdersSchema = createInsertSchema(ptManufacturingOrders).omit({ id: true, createdAt: true });
export type InsertPtManufacturingOrders = z.infer<typeof insertPtManufacturingOrdersSchema>;
export type PtManufacturingOrders = typeof ptManufacturingOrders.$inferSelect;

export const insertPtJobPathsSchema = createInsertSchema(ptJobPaths).omit({ id: true, createdAt: true });
export type InsertPtJobPaths = z.infer<typeof insertPtJobPathsSchema>;
export type PtJobPaths = typeof ptJobPaths.$inferSelect;

export const insertPtJobActivitiesSchema = createInsertSchema(ptJobActivities).omit({ id: true, createdAt: true });
export type InsertPtJobActivities = z.infer<typeof insertPtJobActivitiesSchema>;
export type PtJobActivities = typeof ptJobActivities.$inferSelect;

export const insertPtJobMaterialsSchema = createInsertSchema(ptJobMaterials).omit({ id: true, createdAt: true });
export type InsertPtJobMaterials = z.infer<typeof insertPtJobMaterialsSchema>;
export type PtJobMaterials = typeof ptJobMaterials.$inferSelect;

export const insertPtJobPathNodesSchema = createInsertSchema(ptJobPathNodes).omit({ id: true, createdAt: true });
export type InsertPtJobPathNodes = z.infer<typeof insertPtJobPathNodesSchema>;
export type PtJobPathNodes = typeof ptJobPathNodes.$inferSelect;

export const insertPtJobResourcesSchema = createInsertSchema(ptJobResources).omit({ id: true, createdAt: true });
export type InsertPtJobResources = z.infer<typeof insertPtJobResourcesSchema>;
export type PtJobResources = typeof ptJobResources.$inferSelect;

export const insertPtJobResourceBlocksSchema = createInsertSchema(ptJobResourceBlocks).omit({ id: true, createdAt: true });
export type InsertPtJobResourceBlocks = z.infer<typeof insertPtJobResourceBlocksSchema>;
export type PtJobResourceBlocks = typeof ptJobResourceBlocks.$inferSelect;

export const insertPtJobResourceBlockIntervalsSchema = createInsertSchema(ptJobResourceBlockIntervals).omit({ id: true, createdAt: true });
export type InsertPtJobResourceBlockIntervals = z.infer<typeof insertPtJobResourceBlockIntervalsSchema>;
export type PtJobResourceBlockIntervals = typeof ptJobResourceBlockIntervals.$inferSelect;



// Relations for PT Import tables - Updated Architecture
// New hierarchical structure: Jobs → Manufacturing Orders → Operations/Paths

// ptJobActivities relates to ptJobOperations, NOT to ptJobs
export const ptJobActivitiesRelations = relations(ptJobActivities, ({ one }) => ({
  operation: one(ptJobOperations, {
    fields: [ptJobActivities.opExternalId],
    references: [ptJobOperations.externalId],
  }),
}));

// ptJobMaterials relates to ptJobOperations, NOT to ptJobs  
export const ptJobMaterialsRelations = relations(ptJobMaterials, ({ one }) => ({
  operation: one(ptJobOperations, {
    fields: [ptJobMaterials.opExternalId],
    references: [ptJobOperations.externalId],
  }),
}));

// ptJobOperations relates to ptJobManufacturingOrders and ptJobPathNodes, NOT to ptJobs
export const ptJobOperationsRelations = relations(ptJobOperations, ({ one, many }) => ({
  manufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobOperations.moExternalId],
    references: [ptManufacturingOrders.externalId],
  }),
  activities: many(ptJobActivities),
  materials: many(ptJobMaterials),
  resources: many(ptJobResources),
}));

// ptJobPathNodes relates to ptJobOperations through successor/predecessor operation fields
export const ptJobPathNodesRelations = relations(ptJobPathNodes, ({ one }) => ({
  predecessorOperation: one(ptJobOperations, {
    fields: [ptJobPathNodes.predecessorOperationExternalId],
    references: [ptJobOperations.externalId],
  }),
  successorOperation: one(ptJobOperations, {
    fields: [ptJobPathNodes.successorOperationExternalId], 
    references: [ptJobOperations.externalId],
  }),
}));

// ptJobResources relates to ptJobOperations, NOT to ptJobs
export const ptJobResourcesRelations = relations(ptJobResources, ({ one }) => ({
  operation: one(ptJobOperations, {
    fields: [ptJobResources.opExternalId],
    references: [ptJobOperations.externalId],
  }),
}));

// ptJobResourceBlocks relates to ptJobOperations and has many intervals
export const ptJobResourceBlocksRelations = relations(ptJobResourceBlocks, ({ one, many }) => ({
  operation: one(ptJobOperations, {
    fields: [ptJobResourceBlocks.operationId],
    references: [ptJobOperations.externalId],
  }),
  intervals: many(ptJobResourceBlockIntervals),
}));

// ptJobResourceBlockIntervals relates ONLY to ptJobResourceBlocks on blockId (one-to-many relationship)
export const ptJobResourceBlockIntervalsRelations = relations(ptJobResourceBlockIntervals, ({ one }) => ({
  block: one(ptJobResourceBlocks, {
    fields: [ptJobResourceBlockIntervals.blockId],
    references: [ptJobResourceBlocks.blockId], // Both are text fields in PT system
  }),
}));

// ptJobPaths relates to ptManufacturingOrders, NOT to ptJobs
export const ptJobPathsRelations = relations(ptJobPaths, ({ one }) => ({
  manufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobPaths.moExternalId],
    references: [ptManufacturingOrders.externalId],
  }),
}));

// ptManufacturingOrders has relations to operations and paths
export const ptManufacturingOrdersRelations = relations(ptManufacturingOrders, ({ many }) => ({
  operations: many(ptJobOperations),
  jobPaths: many(ptJobPaths),
  successorManufacturingOrders: many(ptJobSuccessorManufacturingOrders, { 
    relationName: "successorManufacturingOrders" 
  }),
  predecessorManufacturingOrders: many(ptJobSuccessorManufacturingOrders, { 
    relationName: "predecessorManufacturingOrders" 
  }),
}));

// ptJobSuccessorManufacturingOrders relationships
export const ptJobSuccessorManufacturingOrdersRelations = relations(ptJobSuccessorManufacturingOrders, ({ one }) => ({
  manufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobSuccessorManufacturingOrders.manufacturingOrderId],
    references: [ptManufacturingOrders.id],
    relationName: "predecessorManufacturingOrders"
  }),
  successorManufacturingOrder: one(ptManufacturingOrders, {
    fields: [ptJobSuccessorManufacturingOrders.successorManufacturingOrderId],
    references: [ptManufacturingOrders.id],
    relationName: "successorManufacturingOrders"
  }),
  successorOperation: one(ptJobOperations, {
    fields: [ptJobSuccessorManufacturingOrders.successorOperationId],
    references: [ptJobOperations.id],
  }),
  successorPath: one(ptJobPaths, {
    fields: [ptJobSuccessorManufacturingOrders.successorPathId],
    references: [ptJobPaths.id],
  }),
}));

// ptJobs does NOT have direct relations to activities, materials, operations, or paths
// Jobs inherit all relationships through their connection to manufacturing orders
export const ptJobsRelations = relations(ptJobs, ({ one }) => ({
  // Jobs can relate to manufacturing orders, but all other relationships
  // are established at the manufacturing order and operation level
}));