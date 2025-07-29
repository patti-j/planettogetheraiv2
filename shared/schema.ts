import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, numeric, primaryKey, index, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  address: text("address"),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  photo: text("photo"), // Base64 encoded photo data
  // Removed plantId - now using many-to-many relationship via plantResources junction table
  // Removed isShared and sharedPlants - now handled by multiple entries in plantResources table
});

// Junction table for many-to-many relationship between plants and resources
export const plantResources = pgTable("plant_resources", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  isPrimary: boolean("is_primary").default(true), // Indicates if this is the primary plant for this resource
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  plantResourceUnique: unique().on(table.plantId, table.resourceId),
}));

// Production Orders (formerly jobs) - firm manufacturing orders ready for execution
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // e.g., "PO-2025-001"
  name: text("name").notNull(),
  description: text("description"),
  customer: text("customer").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("released"), // released, in_progress, completed, cancelled
  quantity: integer("quantity").notNull().default(1),
  dueDate: timestamp("due_date"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  itemNumber: text("item_number"), // Reference to items table
  salesOrderNumber: text("sales_order_number"), // Reference to sales order
  productionVersionId: integer("production_version_id").references(() => productionVersions.id), // Links to production version which defines how to produce this item
  createdAt: timestamp("created_at").defaultNow(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
});

// Planned Orders - preliminary orders from MRP planning before becoming production orders
export const plannedOrders = pgTable("planned_orders", {
  id: serial("id").primaryKey(),
  plannedOrderNumber: text("planned_order_number").notNull().unique(), // e.g., "PLN-2025-001"
  itemNumber: text("item_number").notNull(), // What to produce
  quantity: integer("quantity").notNull(),
  requiredDate: timestamp("required_date").notNull(), // When needed
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  orderType: text("order_type").notNull().default("production"), // production, purchase, transfer
  source: text("source").notNull().default("mrp"), // mrp, manual, forecast
  status: text("status").notNull().default("firm"), // firm, released_to_production, cancelled
  priority: text("priority").notNull().default("medium"),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  salesOrderNumber: text("sales_order_number"), // Originating sales order if applicable
  productionVersionId: integer("production_version_id").references(() => productionVersions.id), // Links to production version which defines how to produce this item
  createdAt: timestamp("created_at").defaultNow(),
  // Removed productionOrderId foreign key - now handled via many-to-many junction table
});

// Many-to-Many Junction Table: Planned Orders ↔ Production Orders
// Supports consolidation (multiple planned orders → 1 production order) and splitting (1 planned order → multiple production orders)
export const plannedOrderProductionOrders = pgTable("planned_order_production_orders", {
  id: serial("id").primaryKey(),
  plannedOrderId: integer("planned_order_id").references(() => plannedOrders.id).notNull(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  conversionType: text("conversion_type").notNull(), // "consolidation", "split", "one_to_one"
  plannedQuantity: integer("planned_quantity").notNull(), // Quantity from planned order allocated to this production order
  convertedQuantity: integer("converted_quantity").notNull(), // Actual quantity converted
  conversionRatio: numeric("conversion_ratio", { precision: 8, scale: 4 }).notNull().default("1.0000"), // plannedQuantity/totalPlannedQuantity for this production order
  notes: text("notes"), // Reason for consolidation/split
  convertedAt: timestamp("converted_at").defaultNow(),
  convertedBy: integer("converted_by").references(() => users.id),
}, (table) => ({
  // Ensure each planned order can only be converted to a production order once with the same conversion details
  uniquePlannedProductionOrder: unique().on(table.plannedOrderId, table.productionOrderId),
}));

// SAP S/4HANA Process Industries Master Recipes - Header level (equivalent of routing for process manufacturing)
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  recipeNumber: text("recipe_number").notNull().unique(), // e.g., "RCP-001"
  recipeName: text("recipe_name").notNull(),
  materialNumber: text("material_number").notNull(), // Finished or intermediate product the recipe is for
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  recipeVersion: text("recipe_version").notNull().default("1.0"),
  recipeType: text("recipe_type").notNull().default("master"), // master, pilot, trial, development
  status: text("status").notNull().default("created"), // created, released_for_planning, released_for_execution, obsolete
  baseQuantity: numeric("base_quantity", { precision: 10, scale: 4 }).notNull(), // Standard quantity the recipe is designed for
  baseUnit: text("base_unit").notNull().default("kg"), // Base unit of measure
  validityDateFrom: timestamp("validity_date_from").notNull(), // When recipe becomes valid
  validityDateTo: timestamp("validity_date_to"), // When recipe expires (null = unlimited)
  
  // Process Manufacturing specific attributes
  yieldFactor: numeric("yield_factor", { precision: 5, scale: 2 }).notNull().default("100"), // percentage (95.5 = 95.5% yield)
  scaleMinimum: numeric("scale_minimum", { precision: 5, scale: 2 }).default("50"), // minimum scale percentage
  scaleMaximum: numeric("scale_maximum", { precision: 5, scale: 2 }).default("200"), // maximum scale percentage
  totalCycleTime: integer("total_cycle_time"), // total time in minutes
  
  // Recipe documentation
  description: text("description"),
  processNotes: text("process_notes"),
  safetyNotes: text("safety_notes"),
  
  // Quality and environmental specifications
  qualitySpecifications: jsonb("quality_specifications").$type<{
    target_yield: number;
    min_yield: number;
    max_yield: number;
    critical_quality_parameters: Array<{
      parameter: string;
      target_value: number;
      min_value: number;
      max_value: number;
      unit: string;
      test_method: string;
    }>;
  }>(),
  environmentalConditions: jsonb("environmental_conditions").$type<{
    temperature_range: { min: number; max: number };
    humidity_range: { min: number; max: number };
    pressure_range: { min: number; max: number };
    atmosphere: string; // nitrogen, air, vacuum, etc.
  }>(),
  
  // Audit fields
  createdBy: text("created_by").notNull(),
  approvedBy: text("approved_by"),
  approvedDate: timestamp("approved_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  materialPlantIdx: unique().on(table.materialNumber, table.plantId, table.recipeVersion),
}));

// Recipe Operations - define individual processing steps (like operations in discrete manufacturing routing)
export const recipeOperations = pgTable("recipe_operations", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  operationNumber: text("operation_number").notNull(), // e.g., "0010", "0020"
  operationName: text("operation_name").notNull(), // e.g., "Mixing", "Heating", "Filling"
  workCenterId: integer("work_center_id").references(() => workCenters.id).notNull(), // Equipment or production line
  controlKey: text("control_key").notNull().default("PP01"), // Defines scheduling, costing, confirmation behavior
  description: text("description"),
  
  // Standard values for scheduling and costing
  setupTime: integer("setup_time").default(0), // minutes
  processingTime: integer("processing_time").notNull(), // minutes per base quantity
  teardownTime: integer("teardown_time").default(0), // minutes
  queueTime: integer("queue_time").default(0), // minutes
  moveTime: integer("move_time").default(0), // minutes
  
  // Resource requirements (human, machine, utility)
  laborHours: numeric("labor_hours", { precision: 8, scale: 2 }).default("0"), // Labor hours per base quantity
  machineHours: numeric("machine_hours", { precision: 8, scale: 2 }).default("0"), // Machine hours per base quantity
  utilityConsumption: jsonb("utility_consumption").$type<Array<{
    utility_type: string; // steam, electricity, water, nitrogen, etc.
    consumption_rate: number; // units per hour
    unit: string; // kWh, m3, kg/hr, etc.
  }>>().default([]),
  
  // Cost factors
  setupCost: numeric("setup_cost", { precision: 10, scale: 2 }).default("0"),
  processingCost: numeric("processing_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Process control and safety
  criticalOperation: boolean("critical_operation").default(false), // Requires special attention
  safetyRequirements: text("safety_requirements"),
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]), // Required worker/equipment capabilities
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  recipeOperationIdx: unique().on(table.recipeId, table.operationNumber),
}));

// Recipe Phases - subdivisions of operations for more granular control (PP-PI specific)
export const recipePhases = pgTable("recipe_phases", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => recipeOperations.id).notNull(), // Which operation this phase belongs to
  processOperationId: integer("process_operation_id").references(() => processOperations.id), // Many-to-one with process operations
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
}));

// Recipe Operation Relationships - define sequence and dependencies between operations/phases
export const recipeOperationRelationships = pgTable("recipe_operation_relationships", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  predecessorOperationId: integer("predecessor_operation_id").references(() => recipeOperations.id).notNull(),
  successorOperationId: integer("successor_operation_id").references(() => recipeOperations.id).notNull(),
  predecessorPhaseId: integer("predecessor_phase_id").references(() => recipePhases.id), // Optional: specific phase dependency
  successorPhaseId: integer("successor_phase_id").references(() => recipePhases.id), // Optional: specific phase dependency
  
  // Relationship type defines scheduling logic
  relationshipType: text("relationship_type").notNull().default("FS"), // FS=Finish-Start, SS=Start-Start, FF=Finish-Finish, SF=Start-Finish
  lagTime: integer("lag_time").default(0), // Minutes between operations (can be negative for lead time)
  
  // Dependency strength and conditions
  dependencyType: text("dependency_type").notNull().default("mandatory"), // mandatory, preferred, optional
  condition: text("condition"), // Optional condition for the dependency (e.g., "if temperature > 80°C")
  
  // Process flow control
  splitMergeType: text("split_merge_type"), // parallel_split, exclusive_choice, simple_merge, synchronizing_merge
  branchCondition: text("branch_condition"), // Condition for branching logic
  
  // Documentation
  description: text("description"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  recipeRelationIdx: unique().on(table.recipeId, table.predecessorOperationId, table.successorOperationId),
}));

// Recipe Material Assignments - materials assigned to specific phases (from BOM)
export const recipeMaterialAssignments = pgTable("recipe_material_assignments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  operationId: integer("operation_id").references(() => recipeOperations.id).notNull(),
  phaseId: integer("phase_id").references(() => recipePhases.id).notNull(), // Which phase uses this material
  materialNumber: text("material_number").notNull(), // Reference to material/component
  materialDescription: text("material_description"),
  
  // Quantity and consumption
  requiredQuantity: numeric("required_quantity", { precision: 10, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  consumptionType: text("consumption_type").notNull().default("direct"), // direct, backflush, manual
  
  // Process-specific material handling
  additionMethod: text("addition_method"), // continuous, batch, staged, manual
  additionSequence: integer("addition_sequence").default(1), // Order of addition within phase
  additionRate: numeric("addition_rate", { precision: 8, scale: 2 }), // Rate of addition (units per minute)
  additionTemperature: numeric("addition_temperature", { precision: 5, scale: 1 }), // Target temperature during addition
  
  // Material staging and shop floor control
  stagingLocation: text("staging_location"), // Where material should be staged
  stagingTiming: integer("staging_timing"), // Minutes before operation start
  handlingInstructions: text("handling_instructions"),
  
  // Batch tracing and compliance
  lotTrackingRequired: boolean("lot_tracking_required").default(false),
  serialTrackingRequired: boolean("serial_tracking_required").default(false),
  qualityControlRequired: boolean("quality_control_required").default(false),
  
  // Substitution and flexibility
  substituteAllowed: boolean("substitute_allowed").default(false),
  substituteMaterials: jsonb("substitute_materials").$type<Array<{
    material_number: string;
    material_description: string;
    conversion_factor: number;
    notes: string;
  }>>().default([]),
  
  // Documentation
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  recipePhaseMatIdx: unique().on(table.recipeId, table.phaseId, table.materialNumber),
}));

// Vendors - supplier information for recipe materials and equipment
export const vendors = pgTable("vendors", {
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

// Customers - customer information for finished products
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerNumber: text("customer_number").notNull().unique(), // e.g., "CUST-001"
  customerName: text("customer_name").notNull(),
  customerType: text("customer_type").notNull().default("standard"), // standard, preferred, key_account, distributor
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull().default("US"),
  taxId: text("tax_id"),
  paymentTerms: text("payment_terms").notNull().default("net30"), // net30, net60, COD, etc.
  creditLimit: integer("credit_limit").default(0), // in cents
  currency: text("currency").notNull().default("USD"),
  salesRepresentative: text("sales_representative"),
  industrySegment: text("industry_segment"), // automotive, aerospace, pharmaceutical, etc.
  accountStatus: text("account_status").notNull().default("active"), // active, inactive, credit_hold, suspended
  specialRequirements: jsonb("special_requirements").$type<Array<{
    requirement_type: string;
    description: string;
    mandatory: boolean;
  }>>().default([]),
  qualityRequirements: jsonb("quality_requirements").$type<{
    certifications_required: string[];
    inspection_level: string; // normal, tightened, reduced
    documentation_requirements: string[];
  }>(),
  shippingInstructions: text("shipping_instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recipe Formulas - input materials with quantities (like a BOM for recipes)
export const recipeFormulas = pgTable("recipe_formulas", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  phaseId: integer("phase_id").references(() => recipePhases.id), // which phase uses this ingredient
  itemNumber: text("item_number").notNull(), // what material/ingredient
  itemDescription: text("item_description"),
  quantity: integer("quantity").notNull(), // quantity needed (stored as integer for precision)
  unit: text("unit").notNull(), // kg, lbs, liters, gallons, etc.
  percentageByWeight: integer("percentage_by_weight"), // percentage * 100 (e.g., 2.5% = 250)
  materialType: text("material_type").notNull(), // raw_material, intermediate, catalyst, solvent, etc.
  additionMethod: text("addition_method"), // continuous, batch, staged, etc.
  additionRate: integer("addition_rate"), // rate of addition (units per minute)
  additionTemperature: integer("addition_temperature"), // temperature when adding
  scalingFactor: integer("scaling_factor").default(100), // how this scales with batch size (percentage)
  isOptional: boolean("is_optional").default(false),
  substitutes: jsonb("substitutes").$type<Array<{
    item_number: string;
    item_description: string;
    conversion_factor: number; // how much substitute needed per unit of original
    notes: string;
  }>>().default([]),
  specifications: jsonb("specifications").$type<{
    purity_min: number;
    moisture_max: number;
    particle_size: { min: number; max: number; unit: string };
    other_specs: Array<{
      specification: string;
      requirement: string;
      test_method: string;
    }>;
  }>(),
  storageRequirements: text("storage_requirements"),
  handlingNotes: text("handling_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Production Versions - Links BOMs/Recipes with Routings to define material consumption per operation
// Similar to SAP's Production Version concept
export const productionVersions = pgTable("production_versions", {
  id: serial("id").primaryKey(),
  versionNumber: text("version_number").notNull(), // e.g., "PV-001", "V1.0"
  itemNumber: text("item_number").notNull(), // What product this version produces
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  
  // Plant validity - which plants this version is valid for
  validPlants: jsonb("valid_plants").$type<number[]>().notNull().default([]), // Array of plant IDs
  
  // MRP (Material Requirements Planning) control
  mrpRelevant: boolean("mrp_relevant").notNull().default(true), // Whether this version can be used by MRP
  
  // Validity period
  validFrom: timestamp("valid_from").notNull(), // When this version becomes active
  validTo: timestamp("valid_to"), // When this version expires (null = unlimited)
  
  // Link to Recipe for process manufacturing (BOM is linked through routing operations, not directly)
  recipeId: integer("recipe_id").references(() => recipes.id), // For process manufacturing
  
  // Link to Routing for discrete manufacturing (defines the sequence of operations)
  routingId: integer("routing_id").references(() => routings.id), // For discrete manufacturing
  
  // Link to Bill of Materials for discrete manufacturing material requirements
  bomId: integer("bom_id").references(() => billsOfMaterial.id), // For discrete manufacturing
  
  // Routing information - links operations to material consumption
  routingOperations: jsonb("routing_operations").$type<Array<{
    operation_number: string; // e.g., "010", "020", "030"
    operation_name: string;
    work_center: string; // resource/work center where operation is performed
    setup_time: number; // minutes
    run_time_per_unit: number; // minutes per unit
    required_capabilities: number[]; // capability IDs needed
    
    // Material consumption for this operation
    material_consumption: Array<{
      item_number: string;
      item_description: string;
      quantity_per_unit: number; // how much consumed per finished unit
      unit: string; // kg, lbs, pieces, etc.
      consumption_type: string; // "automatic", "manual", "backflush"
      scrap_percentage: number; // expected scrap %
      issue_storage_location: string; // where material comes from
      consumption_posting: string; // when to post consumption (operation_start, operation_end, order_completion)
    }>;
    
    // By-products or co-products produced in this operation
    outputs: Array<{
      item_number: string;
      item_description: string;
      quantity_per_unit: number;
      unit: string;
      output_type: string; // "by_product", "co_product", "rework", "scrap"
      receipt_storage_location: string;
    }>;
  }>>().default([]),
  
  // Production parameters and lot size validation
  lotSizeMin: integer("lot_size_min").notNull().default(1), // minimum production quantity for this version
  lotSizeMax: integer("lot_size_max").notNull(), // maximum production quantity for this version
  standardLotSize: integer("standard_lot_size").notNull().default(100), // typical batch size
  
  // Costing and planning parameters
  planningStrategy: text("planning_strategy").default("make_to_stock"), // make_to_stock, make_to_order, assemble_to_order
  procurementType: text("procurement_type").default("in_house"), // in_house, external, both
  leadTime: integer("lead_time").default(0), // production lead time in days
  
  // Alternative production methods
  alternativeVersions: jsonb("alternative_versions").$type<Array<{
    version_id: number;
    priority: number; // 1 = highest priority
    usage_probability: number; // percentage (0-100)
    conditions: string; // when to use this alternative
  }>>().default([]),
  
  // Status and control
  status: text("status").notNull().default("active"), // active, inactive, planned, obsolete
  description: text("description"),
  changeNumber: text("change_number"), // engineering change number
  approvedBy: text("approved_by"),
  approvedDate: timestamp("approved_date"),
  
  // Revision tracking
  revisionLevel: text("revision_level").default("A"), // A, B, C, etc.
  revisionReason: text("revision_reason"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by"), // user ID who created this version
}, (table) => ({
  // Ensure only one active version per item-plant combination at any given time
  uniqueActiveVersion: unique("unique_active_version").on(table.itemNumber, table.plantId, table.validFrom),
  itemPlantIndex: index("production_versions_item_plant_idx").on(table.itemNumber, table.plantId),
  validityIndex: index("production_versions_validity_idx").on(table.validFrom, table.validTo),
}));

// Discrete Operations - for discrete manufacturing with distinct, countable parts
export const discreteOperations = pgTable("discrete_operations", {
  id: serial("id").primaryKey(),
  routingId: integer("routing_id").references(() => routings.id).notNull(),
  operationName: text("operation_name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  standardDuration: integer("standard_duration").notNull(), // in hours
  actualDuration: integer("actual_duration"), // Actual time taken
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  sequenceNumber: integer("sequence_number").notNull().default(0),
  workCenterId: integer("work_center_id"),
  priority: integer("priority").default(5),
  completionPercentage: integer("completion_percentage").default(0),
  qualityCheckRequired: boolean("quality_check_required").default(false),
  qualityStatus: text("quality_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discrete Operation Phases - track phases like setup, run, cleanup for discrete operations
export const discreteOperationPhases = pgTable("discrete_operation_phases", {
  id: serial("id").primaryKey(),
  discreteOperationId: integer("discrete_operation_id").notNull().references(() => discreteOperations.id),
  phaseType: text("phase_type", { enum: ["setup", "run", "cleanup", "inspection", "changeover", "maintenance"] }).notNull(),
  phaseName: text("phase_name").notNull(),
  description: text("description"),
  sequenceNumber: integer("sequence_number").notNull(), // Order within the operation
  standardDuration: integer("standard_duration").notNull(), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  status: text("status", { enum: ["pending", "active", "completed", "skipped", "on_hold"] }).notNull().default("pending"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  scheduledStartTime: timestamp("scheduled_start_time"),
  scheduledEndTime: timestamp("scheduled_end_time"),
  resourceRequirements: jsonb("resource_requirements"), // Specific resources needed for this phase
  skillRequirements: text("skill_requirements").array(), // Required skills/certifications
  instructions: text("instructions"), // Phase-specific instructions
  qualityCheckpoints: jsonb("quality_checkpoints"), // Quality checks during phase
  completionCriteria: text("completion_criteria"), // What defines phase completion
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  discreteOperationPhaseIdx: index("discrete_operation_phases_discrete_operation_idx").on(table.discreteOperationId),
  phaseSequenceIdx: index("discrete_operation_phases_sequence_idx").on(table.discreteOperationId, table.sequenceNumber)
}));

// Discrete Operation Phase Resource Requirements - junction table linking phases to resource requirements
export const discreteOperationPhaseResourceRequirements = pgTable("discrete_operation_phase_resource_requirements", {
  id: serial("id").primaryKey(),
  discreteOperationPhaseId: integer("discrete_operation_phase_id").notNull().references(() => discreteOperationPhases.id, { onDelete: "cascade" }),
  resourceRequirementId: integer("resource_requirement_id").notNull().references(() => resourceRequirements.id, { onDelete: "cascade" }),
  phaseSpecificQuantity: numeric("phase_specific_quantity"), // Override quantity for this specific phase
  phasePriority: text("phase_priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  timingConstraints: jsonb("timing_constraints").$type<{
    startOffset?: number; // Minutes from phase start
    endOffset?: number; // Minutes from phase end
    duration?: number; // Required duration in minutes
    flexibility?: "fixed" | "flexible" | "preferred";
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Composite primary key alternative
  uniquePhaseResourceIdx: uniqueIndex("discrete_phase_resource_unique_idx").on(table.discreteOperationPhaseId, table.resourceRequirementId),
  phaseIdx: index("discrete_phase_resource_phase_idx").on(table.discreteOperationPhaseId),
  resourceIdx: index("discrete_phase_resource_requirement_idx").on(table.resourceRequirementId)
}));

// Process Operations - for process manufacturing with continuous flows, batches, and recipes
export const processOperations = pgTable("process_operations", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(), // Many-to-one relationship with recipes
  operationName: text("operation_name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  standardDuration: integer("standard_duration").notNull(), // in hours
  actualDuration: integer("actual_duration"), // Actual time taken
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  sequenceNumber: integer("sequence_number").notNull().default(0),
  setupTime: integer("setup_time").default(0), // Setup time in minutes
  priority: integer("priority").default(5),
  completionPercentage: integer("completion_percentage").default(0),
  qualityCheckRequired: boolean("quality_check_required").default(false),
  qualityStatus: text("quality_status").default("pending"),
  temperature: numeric("temperature"),
  pressure: numeric("pressure"),
  phLevel: numeric("ph_level"),
  batchSize: numeric("batch_size"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resource Requirements - defines what resources each recipe phase needs
export const resourceRequirements = pgTable("resource_requirements", {
  id: serial("id").primaryKey(),
  // Links to recipe phases (many-to-one relationship)
  recipePhaseId: integer("recipe_phase_id").references(() => recipePhases.id).notNull(),
  requirementName: text("requirement_name").notNull(), // e.g., "Primary Machine", "Secondary Setup", "Quality Control"
  requirementType: text("requirement_type").notNull().default("primary"), // primary, secondary, setup, quality, maintenance
  quantity: integer("quantity").notNull().default(1), // how many resources needed
  duration: integer("duration"), // duration this resource is needed (in minutes), null = full operation duration
  startOffset: integer("start_offset").default(0), // minutes after operation start when resource is needed
  endOffset: integer("end_offset").default(0), // minutes before operation end when resource is released
  
  // Resource selection criteria
  defaultResourceId: integer("default_resource_id").references(() => resources.id), // preferred resource
  eligibleResourceIds: jsonb("eligible_resource_ids").$type<number[]>().default([]), // specific resources that can be used
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]), // capabilities needed if no eligible resources specified
  
  // Priority and flexibility
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  isOptional: boolean("is_optional").default(false), // whether this requirement is optional
  canBeShared: boolean("can_be_shared").default(false), // whether this resource can be shared with other operations
  
  // Allocation preferences
  allocationStrategy: text("allocation_strategy").default("capability_based"), // capability_based, specific_resource, load_balanced
  preferredSkillLevel: text("preferred_skill_level").default("any"), // any, basic, intermediate, advanced, expert
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  recipePhaseRequirementIndex: index("resource_requirements_recipe_phase_idx").on(table.recipePhaseId),
  defaultResourceIndex: index("resource_requirements_default_resource_idx").on(table.defaultResourceId),
}));

// Resource Requirement Assignments - tracks actual resource assignments for requirements  
export const resourceRequirementAssignments = pgTable("resource_requirement_assignments", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id").references(() => resourceRequirements.id).notNull(),
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id).notNull(),
  quantity: integer("quantity").notNull().default(1), // how many units of this resource assigned
  
  // Timing for this assignment
  plannedStartTime: timestamp("planned_start_time"),
  plannedEndTime: timestamp("planned_end_time"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  
  // Assignment details
  assignmentReason: text("assignment_reason").default("automatic"), // automatic, manual, optimization, capability_match
  assignedBy: text("assigned_by"), // user who made the assignment
  skillLevel: text("skill_level"), // skill level of assigned resource for this task
  
  // Status tracking
  status: text("status").notNull().default("planned"), // planned, confirmed, in_progress, completed, cancelled
  utilizationPercent: integer("utilization_percent").default(100), // how much of resource capacity is used
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  requirementAssignmentIndex: index("resource_assignments_requirement_idx").on(table.requirementId),
  resourceAssignmentIndex: index("resource_assignments_resource_idx").on(table.assignedResourceId),
  statusIndex: index("resource_assignments_status_idx").on(table.status),
}));



// Dependencies between operations (can be discrete-to-discrete, process-to-process, or cross-type)
export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  // From operation (can be either discrete or process)
  fromDiscreteOperationId: integer("from_discrete_operation_id").references(() => discreteOperations.id),
  fromProcessOperationId: integer("from_process_operation_id").references(() => processOperations.id),
  // To operation (can be either discrete or process)
  toDiscreteOperationId: integer("to_discrete_operation_id").references(() => discreteOperations.id),
  toProcessOperationId: integer("to_process_operation_id").references(() => processOperations.id),
  dependencyType: text("dependency_type").notNull().default("finish_to_start"), // finish_to_start, start_to_start, finish_to_finish, start_to_finish
  lagTime: integer("lag_time").default(0), // Time lag in minutes between operations
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
export const scheduleScenarios: ReturnType<typeof pgTable> = pgTable("schedule_scenarios", {
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
  // Can reference either discrete or process operations
  discreteOperationId: integer("discrete_operation_id").references(() => discreteOperations.id),
  processOperationId: integer("process_operation_id").references(() => processOperations.id),
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
  affectedDiscreteOperationId: integer("affected_discrete_operation_id").references(() => discreteOperations.id),
  affectedProcessOperationId: integer("affected_process_operation_id").references(() => processOperations.id),
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

export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export const insertPlantResourceSchema = createInsertSchema(plantResources).omit({
  id: true,
  createdAt: true,
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({
  id: true,
  createdAt: true,
});

export const insertPlannedOrderSchema = createInsertSchema(plannedOrders).omit({
  id: true,
  createdAt: true,
});

// Junction table insert schema for many-to-many relationship
export const insertPlannedOrderProductionOrderSchema = createInsertSchema(plannedOrderProductionOrders).omit({
  id: true,
  convertedAt: true,
}).extend({
  convertedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

// Insert schemas for both operation types
export const insertDiscreteOperationSchema = createInsertSchema(discreteOperations).omit({
  id: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledStartDate: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledEndDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDiscreteOperationPhaseSchema = createInsertSchema(discreteOperationPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledStartTime: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDiscreteOperationPhaseResourceRequirementSchema = createInsertSchema(discreteOperationPhaseResourceRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcessOperationSchema = createInsertSchema(processOperations).omit({
  id: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledStartDate: z.union([z.string().datetime(), z.date()]).optional(),
  scheduledEndDate: z.union([z.string().datetime(), z.date()]).optional(),
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

// Disruption Management Insert Schemas
export const insertDisruptionSchema = createInsertSchema(disruptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDisruptionActionSchema = createInsertSchema(disruptionActions).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledTime: z.union([z.string().datetime(), z.date()]).optional(),
  completedTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDisruptionEscalationSchema = createInsertSchema(disruptionEscalations).omit({
  id: true,
  createdAt: true,
}).extend({
  expectedResponse: z.union([z.string().datetime(), z.date()]).optional(),
  actualResponse: z.union([z.string().datetime(), z.date()]).optional(),
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
  plantId: integer("plant_id").references(() => plants.id),
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
  plantId: integer("plant_id").references(() => plants.id), // null = all plants
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

// Production Scheduler's Cockpit Configuration
export const cockpitLayouts = pgTable("cockpit_layouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
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

export type InsertCapability = z.infer<typeof insertCapabilitySchema>;
export type Capability = typeof capabilities.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertPlantResource = z.infer<typeof insertPlantResourceSchema>;
export type PlantResource = typeof plantResources.$inferSelect;

export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = typeof productionOrders.$inferSelect;

export type InsertPlannedOrder = z.infer<typeof insertPlannedOrderSchema>;
export type PlannedOrder = typeof plannedOrders.$inferSelect;

// Junction table types for many-to-many relationship
export type PlannedOrderProductionOrder = typeof plannedOrderProductionOrders.$inferSelect;
export type InsertPlannedOrderProductionOrder = z.infer<typeof insertPlannedOrderProductionOrderSchema>;

// Types for both operation types
export type InsertDiscreteOperation = z.infer<typeof insertDiscreteOperationSchema>;
export type DiscreteOperation = typeof discreteOperations.$inferSelect;

export type InsertDiscreteOperationPhase = z.infer<typeof insertDiscreteOperationPhaseSchema>;
export type DiscreteOperationPhase = typeof discreteOperationPhases.$inferSelect;

export type InsertDiscreteOperationPhaseResourceRequirement = z.infer<typeof insertDiscreteOperationPhaseResourceRequirementSchema>;
export type DiscreteOperationPhaseResourceRequirement = typeof discreteOperationPhaseResourceRequirements.$inferSelect;

export type InsertProcessOperation = z.infer<typeof insertProcessOperationSchema>;
export type ProcessOperation = typeof processOperations.$inferSelect;

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

// Cockpit Types
export type InsertCockpitLayout = z.infer<typeof insertCockpitLayoutSchema>;
export type CockpitLayout = typeof cockpitLayouts.$inferSelect;

export type InsertCockpitWidget = z.infer<typeof insertCockpitWidgetSchema>;
export type CockpitWidget = typeof cockpitWidgets.$inferSelect;

export type InsertCockpitAlert = z.infer<typeof insertCockpitAlertSchema>;
export type CockpitAlert = typeof cockpitAlerts.$inferSelect;

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
  itemId: integer("item_id").references(() => stockItems.id).notNull(),
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
  plantId: integer("plant_id").references(() => plants.id), // Trigger applies to specific plant
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
  plantId: integer("plant_id").references(() => plants.id), // Workflow applies to specific plant
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
  }>().default(sql`'{"email": true, "push": true, "desktop": true, "reminders": true, "tours": true}'::jsonb`),
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

export const insertDemoTourParticipantSchema = createInsertSchema(demoTourParticipants).omit({
  id: true,
  tourStartedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceRecordingsCacheSchema = createInsertSchema(voiceRecordingsCache).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  usageCount: true,
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  generatedAt: true,
  updatedAt: true,
});

export type InsertDemoTourParticipant = z.infer<typeof insertDemoTourParticipantSchema>;
export type DemoTourParticipant = typeof demoTourParticipants.$inferSelect;
export type InsertVoiceRecordingsCache = z.infer<typeof insertVoiceRecordingsCacheSchema>;
export type VoiceRecordingsCache = typeof voiceRecordingsCache.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;

// User Preferences Schema and Types
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const chatMessages = pgTable("chat_messages", {
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
export const insertStrategyDocumentSchema = createInsertSchema(strategyDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevelopmentTaskSchema = createInsertSchema(developmentTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArchitectureComponentSchema = createInsertSchema(architectureComponents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertChatMemberSchema = createInsertSchema(chatMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatReactionSchema = createInsertSchema(chatReactions).omit({
  id: true,
  createdAt: true,
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
export const insertStockItemSchema = createInsertSchema(stockItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertStockBalanceSchema = createInsertSchema(stockBalances).omit({
  id: true,
  updatedAt: true,
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  forecastDate: z.union([z.string().datetime(), z.date()]),
});

export const insertDemandDriverSchema = createInsertSchema(demandDrivers).omit({
  id: true,
  createdAt: true,
});

export const insertDemandHistorySchema = createInsertSchema(demandHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  period: z.union([z.string().datetime(), z.date()]),
});

export const insertStockOptimizationScenarioSchema = createInsertSchema(stockOptimizationScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptimizationRecommendationSchema = createInsertSchema(optimizationRecommendations).omit({
  id: true,
  createdAt: true,
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
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  validityDateFrom: z.union([z.string().datetime(), z.date()]),
  validityDateTo: z.union([z.string().datetime(), z.date()]).optional(),
  approvedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertRecipeOperationSchema = createInsertSchema(recipeOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipePhaseSchema = createInsertSchema(recipePhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeOperationRelationshipSchema = createInsertSchema(recipeOperationRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeMaterialAssignmentSchema = createInsertSchema(recipeMaterialAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeFormulaSchema = createInsertSchema(recipeFormulas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// Vendor and Customer Insert Schemas
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Recipe Types - SAP S/4HANA Process Industries Structure
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type RecipeOperation = typeof recipeOperations.$inferSelect;
export type InsertRecipeOperation = z.infer<typeof insertRecipeOperationSchema>;

export type RecipePhase = typeof recipePhases.$inferSelect;
export type InsertRecipePhase = z.infer<typeof insertRecipePhaseSchema>;

export type RecipeOperationRelationship = typeof recipeOperationRelationships.$inferSelect;
export type InsertRecipeOperationRelationship = z.infer<typeof insertRecipeOperationRelationshipSchema>;

export type RecipeMaterialAssignment = typeof recipeMaterialAssignments.$inferSelect;
export type InsertRecipeMaterialAssignment = z.infer<typeof insertRecipeMaterialAssignmentSchema>;

export type RecipeFormula = typeof recipeFormulas.$inferSelect;
export type InsertRecipeFormula = z.infer<typeof insertRecipeFormulaSchema>;



// Vendor and Customer Types
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

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
export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  votes: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackVoteSchema = createInsertSchema(feedbackVotes).omit({
  id: true,
  createdAt: true,
});

// Feedback types
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;

// Onboarding schemas
export const insertCompanyOnboardingSchema = createInsertSchema(companyOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
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
export const schedulingHistory = pgTable("scheduling_history", {
  id: serial("id").primaryKey(),
  algorithmName: text("algorithm_name").notNull(),
  algorithmType: text("algorithm_type").notNull(), // backwards_scheduling, forward_scheduling, constraint_based, ai_optimized
  algorithmVersion: text("algorithm_version").notNull().default("1.0.0"),
  executionMode: text("execution_mode").notNull().default("production"), // production, simulation, test
  triggeredBy: integer("triggered_by").references(() => users.id).notNull(),
  triggerMethod: text("trigger_method").notNull().default("manual"), // manual, automated, scheduled, api
  plantId: integer("plant_id").references(() => plants.id),
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
  // Can reference either discrete or process operations
  discreteOperationId: integer("discrete_operation_id").references(() => discreteOperations.id),
  processOperationId: integer("process_operation_id").references(() => processOperations.id),
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
  plantId: integer("plant_id").references(() => plants.id),
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
export const insertSystemIntegrationSchema = createInsertSchema(systemIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationJobSchema = createInsertSchema(integrationJobs).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationEventSchema = createInsertSchema(integrationEvents).omit({
  id: true,
  createdAt: true,
});

// Scheduling History Insert Schemas
export const insertSchedulingHistorySchema = createInsertSchema(schedulingHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchedulingResultSchema = createInsertSchema(schedulingResults).omit({
  id: true,
  createdAt: true,
});

export const insertAlgorithmPerformanceSchema = createInsertSchema(algorithmPerformance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types for scheduling history
export type SchedulingHistory = typeof schedulingHistory.$inferSelect;
export type InsertSchedulingHistory = z.infer<typeof insertSchedulingHistorySchema>;
export type SchedulingResult = typeof schedulingResults.$inferSelect;
export type InsertSchedulingResult = z.infer<typeof insertSchedulingResultSchema>;
export type AlgorithmPerformance = typeof algorithmPerformance.$inferSelect;
export type InsertAlgorithmPerformance = z.infer<typeof insertAlgorithmPerformanceSchema>;

export const insertIntegrationMappingSchema = createInsertSchema(integrationMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationTemplateSchema = createInsertSchema(integrationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers).omit({
  id: true,
  lastTriggered: true,
  triggerCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowActionSchema = createInsertSchema(workflowActions).omit({
  id: true,
  executionCount: true,
  lastExecuted: true,
  averageExecutionTime: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  executionCount: true,
  successCount: true,
  errorCount: true,
  lastExecuted: true,
  averageExecutionTime: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowActionMappingSchema = createInsertSchema(workflowActionMappings).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowActionExecutionSchema = createInsertSchema(workflowActionExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowMonitoringSchema = createInsertSchema(workflowMonitoring).omit({
  id: true,
  lastAlert: true,
  alertCount: true,
  createdAt: true,
  updatedAt: true,
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

// Plant Management Schemas
export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  createdAt: true,
});

// Plant Management Types
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

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

// Optimization Studio Tables
export const optimizationAlgorithms = pgTable("optimization_algorithms", {
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
  }>().default({}),
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

// Extension Studio Insert Schemas
export const insertExtensionSchema = createInsertSchema(extensions).omit({
  id: true,
  installCount: true,
  rating: true,
  lastUpdated: true,
  createdAt: true,
});

// Optimization Studio Insert Schemas
export const insertOptimizationAlgorithmSchema = createInsertSchema(optimizationAlgorithms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlgorithmTestSchema = createInsertSchema(algorithmTests).omit({
  id: true,
  createdAt: true,
});

export const insertAlgorithmDeploymentSchema = createInsertSchema(algorithmDeployments).omit({
  id: true,
  deployedAt: true,
  lastHealthCheck: true,
});

export const insertExtensionDataSchema = createInsertSchema(extensionData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExtensionFileSchema = createInsertSchema(extensionFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExtensionInstallationSchema = createInsertSchema(extensionInstallations).omit({
  id: true,
  installedAt: true,
  lastUsed: true,
});

export const insertExtensionMarketplaceSchema = createInsertSchema(extensionMarketplace).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
});

export const insertExtensionReviewSchema = createInsertSchema(extensionReviews).omit({
  id: true,
  helpful: true,
  createdAt: true,
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
export const insertOptimizationScopeConfigSchema = createInsertSchema(optimizationScopeConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptimizationRunSchema = createInsertSchema(optimizationRuns).omit({
  id: true,
  createdAt: true,
});

// Optimization Profiles Insert Schemas
export const insertOptimizationProfileSchema = createInsertSchema(optimizationProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileUsageHistorySchema = createInsertSchema(profileUsageHistory).omit({
  id: true,
  createdAt: true,
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

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export const insertErrorReportSchema = createInsertSchema(errorReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

export type InsertErrorReport = z.infer<typeof insertErrorReportSchema>;
export type ErrorReport = typeof errorReports.$inferSelect;

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

export const insertTourPromptTemplateSchema = createInsertSchema(tourPromptTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
});

export const insertTourPromptTemplateUsageSchema = createInsertSchema(tourPromptTemplateUsage).omit({
  id: true,
  createdAt: true,
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
export const insertAIMemorySchema = createInsertSchema(aiMemories).omit({
  id: true,
  lastAccessed: true,
  accessCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAIMemoryTagSchema = createInsertSchema(aiMemoryTags).omit({
  id: true,
  createdAt: true,
});

export const insertAIConversationContextSchema = createInsertSchema(aiConversationContext).omit({
  id: true,
  totalMessages: true,
  lastInteraction: true,
  createdAt: true,
  updatedAt: true,
});

// AI Memory Types
export type AIMemory = typeof aiMemories.$inferSelect;
export type InsertAIMemory = z.infer<typeof insertAIMemorySchema>;

export type AIMemoryTag = typeof aiMemoryTags.$inferSelect;
export type InsertAIMemoryTag = z.infer<typeof insertAIMemoryTagSchema>;

export type AIConversationContext = typeof aiConversationContext.$inferSelect;
export type InsertAIConversationContext = z.infer<typeof insertAIConversationContextSchema>;

// Presentation System Insert Schemas
export const insertPresentationSchema = createInsertSchema(presentations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresentationSlideSchema = createInsertSchema(presentationSlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresentationTourIntegrationSchema = createInsertSchema(presentationTourIntegrations).omit({
  id: true,
  createdAt: true,
});

export const insertPresentationLibrarySchema = createInsertSchema(presentationLibrary).omit({
  id: true,
  downloadCount: true,
  rating: true,
  ratingCount: true,
  approvedAt: true,
  createdAt: true,
});

export const insertPresentationAnalyticsSchema = createInsertSchema(presentationAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertPresentationAIContentSchema = createInsertSchema(presentationAIContent).omit({
  id: true,
  createdAt: true,
});

// Presentation Studio Insert Schemas
export const insertPresentationMaterialSchema = createInsertSchema(presentationMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresentationContentSuggestionSchema = createInsertSchema(presentationContentSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresentationProjectSchema = createInsertSchema(presentationProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  plantId: integer("plant_id").references(() => plants.id).notNull(),
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
export const insertProductionPlanSchema = createInsertSchema(productionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
  endDate: z.union([z.string().datetime(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertProductionTargetSchema = createInsertSchema(productionTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
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

export const insertResourceAllocationSchema = createInsertSchema(resourceAllocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductionMilestoneSchema = createInsertSchema(productionMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export const insertIndustryTemplateSchema = createInsertSchema(industryTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserIndustryTemplateSchema = createInsertSchema(userIndustryTemplates).omit({
  id: true,
  appliedAt: true,
  lastModified: true,
});

export const insertTemplateConfigurationSchema = createInsertSchema(templateConfigurations).omit({
  id: true,
  createdAt: true,
});

// Industry Templates Types
export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type InsertIndustryTemplate = z.infer<typeof insertIndustryTemplateSchema>;

export type UserIndustryTemplate = typeof userIndustryTemplates.$inferSelect;
export type InsertUserIndustryTemplate = z.infer<typeof insertUserIndustryTemplateSchema>;

export type TemplateConfiguration = typeof templateConfigurations.$inferSelect;
export type InsertTemplateConfiguration = z.infer<typeof insertTemplateConfigurationSchema>;

// Shift Management System Insert Schemas
export const insertShiftTemplateSchema = createInsertSchema(shiftTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceShiftAssignmentSchema = createInsertSchema(resourceShiftAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftScenarioSchema = createInsertSchema(shiftScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHolidaySchema = createInsertSchema(holidays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.union([z.string().datetime(), z.date()]),
});

export const insertResourceAbsenceSchema = createInsertSchema(resourceAbsences).omit({
  id: true,
  requestedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string().datetime(), z.date()]),
  endDate: z.union([z.string().datetime(), z.date()]),
  approvedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftCoverageSchema = createInsertSchema(shiftCoverage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  shiftDate: z.union([z.string().datetime(), z.date()]),
});

export const insertShiftUtilizationSchema = createInsertSchema(shiftUtilization).omit({
  id: true,
  createdAt: true,
}).extend({
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
  plantId: integer("plant_id").references(() => plants.id),
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
  plantId: integer("plant_id").references(() => plants.id),
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
  plantId: integer("plant_id").references(() => plants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unplanned Downtime Insert Schemas
export const insertUnplannedDowntimeSchema = createInsertSchema(unplannedDowntime).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]),
  estimatedEndTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
  lastOccurrence: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertOvertimeShiftSchema = createInsertSchema(overtimeShifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]),
  endTime: z.union([z.string().datetime(), z.date()]),
  actualStartTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDowntimeActionSchema = createInsertSchema(downtimeActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  startedAt: z.union([z.string().datetime(), z.date()]).optional(),
  completedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertShiftChangeRequestSchema = createInsertSchema(shiftChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
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
export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiMappingSchema = createInsertSchema(apiMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiTestSchema = createInsertSchema(apiTests).omit({
  id: true,
  createdAt: true,
  runAt: true,
});

export const insertApiAuditLogSchema = createInsertSchema(apiAuditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertApiCredentialSchema = createInsertSchema(apiCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  plant: one(plants, {
    fields: [schedulingHistory.plantId],
    references: [plants.id],
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
  // Can reference either discrete or process operations
  discreteOperation: one(discreteOperations, {
    fields: [schedulingResults.discreteOperationId],
    references: [discreteOperations.id],
  }),
  processOperation: one(processOperations, {
    fields: [schedulingResults.processOperationId],
    references: [processOperations.id],
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
  plant: one(plants, {
    fields: [algorithmPerformance.plantId],
    references: [plants.id],
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
  plant: one(plants, {
    fields: [recipes.plantId],
    references: [plants.id],
  }),
  operations: many(recipeOperations),
  processOperations: many(processOperations), // One-to-many relationship with process operations
  operationRelationships: many(recipeOperationRelationships, {
    relationName: "recipeToRelationships"
  }),
  materialAssignments: many(recipeMaterialAssignments),
  formulas: many(recipeFormulas),
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
  phases: many(recipePhases),
  materialAssignments: many(recipeMaterialAssignments),
  predecessorRelationships: many(recipeOperationRelationships, {
    relationName: "predecessorOperation"
  }),
  successorRelationships: many(recipeOperationRelationships, {
    relationName: "successorOperation"
  }),
}));

export const recipePhasesRelations = relations(recipePhases, ({ one, many }) => ({
  operation: one(recipeOperations, {
    fields: [recipePhases.operationId],
    references: [recipeOperations.id],
  }),
  processOperation: one(processOperations, { // Many-to-one relationship: many recipe phases belong to one process operation
    fields: [recipePhases.processOperationId],
    references: [processOperations.id],
  }),
  specificResource: one(resources, {
    fields: [recipePhases.specificResourceId],
    references: [resources.id],
  }),
  materialAssignments: many(recipeMaterialAssignments),
  formulas: many(recipeFormulas),
  resourceRequirements: many(resourceRequirements), // One-to-many with resource requirements
  formulationDetailAssignments: many(productionVersionPhaseFormulationDetails), // Junction table for phase-specific formulation details
}));

export const recipeOperationRelationshipsRelations = relations(recipeOperationRelationships, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeOperationRelationships.recipeId],
    references: [recipes.id],
    relationName: "recipeToRelationships"
  }),
  predecessorOperation: one(recipeOperations, {
    fields: [recipeOperationRelationships.predecessorOperationId],
    references: [recipeOperations.id],
    relationName: "predecessorOperation"
  }),
  successorOperation: one(recipeOperations, {
    fields: [recipeOperationRelationships.successorOperationId],
    references: [recipeOperations.id],
    relationName: "successorOperation"
  }),
  predecessorPhase: one(recipePhases, {
    fields: [recipeOperationRelationships.predecessorPhaseId],
    references: [recipePhases.id],
  }),
  successorPhase: one(recipePhases, {
    fields: [recipeOperationRelationships.successorPhaseId],
    references: [recipePhases.id],
  }),
}));

export const recipeMaterialAssignmentsRelations = relations(recipeMaterialAssignments, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeMaterialAssignments.recipeId],
    references: [recipes.id],
  }),
  operation: one(recipeOperations, {
    fields: [recipeMaterialAssignments.operationId],
    references: [recipeOperations.id],
  }),
  phase: one(recipePhases, {
    fields: [recipeMaterialAssignments.phaseId],
    references: [recipePhases.id],
  }),
}));

export const recipeFormulasRelations = relations(recipeFormulas, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeFormulas.recipeId],
    references: [recipes.id],
  }),
  phase: one(recipePhases, {
    fields: [recipeFormulas.phaseId],
    references: [recipePhases.id],
  }),
}));





// Resource Requirements relations
export const resourceRequirementsRelations = relations(resourceRequirements, ({ one, many }) => ({
  // Recipe phase relationship (many-to-one)
  recipePhase: one(recipePhases, {
    fields: [resourceRequirements.recipePhaseId],
    references: [recipePhases.id],
  }),
  // Default resource relationship
  defaultResource: one(resources, {
    fields: [resourceRequirements.defaultResourceId],
    references: [resources.id],
  }),
  // Assignment relationships
  assignments: many(resourceRequirementAssignments),
  // Discrete operation phase links through junction table
  discretePhaseLinks: many(discreteOperationPhaseResourceRequirements),
}));

// Resource Requirement Assignments relations
export const resourceRequirementAssignmentsRelations = relations(resourceRequirementAssignments, ({ one }) => ({
  requirement: one(resourceRequirements, {
    fields: [resourceRequirementAssignments.requirementId],
    references: [resourceRequirements.id],
  }),
  assignedResource: one(resources, {
    fields: [resourceRequirementAssignments.assignedResourceId],
    references: [resources.id],
  }),
}));

// ===== COMPREHENSIVE ERP MANUFACTURING DATA STRUCTURES =====

// Departments and organizational structure
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull().unique(),
  parentDepartmentId: integer("parent_department_id").references((): any => departments.id),
  managerId: integer("manager_id"), // Will reference employees table
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  costCenter: text("cost_center"),
  budgetAmount: integer("budget_amount").default(0), // in cents
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work centers - physical or logical groupings where work is performed
export const workCenters = pgTable("work_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull().unique(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  capacity: integer("capacity").notNull().default(1), // units per hour
  efficiency: integer("efficiency").notNull().default(100), // percentage
  costPerHour: integer("cost_per_hour").default(0), // in cents
  setupTime: integer("setup_time").default(0), // minutes
  teardownTime: integer("teardown_time").default(0), // minutes
  queueTime: integer("queue_time").default(0), // minutes
  moveTime: integer("move_time").default(0), // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Sites - multiple manufacturing locations
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: jsonb("address").$type<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>().notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  currency: text("currency").notNull().default("USD"),
  parentSiteId: integer("parent_site_id").references((): any => sites.id),
  siteType: text("site_type").notNull().default("manufacturing"), // manufacturing, warehouse, distribution, office
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items - products, components, raw materials
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemNumber: text("item_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull(), // finished_good, component, raw_material, service
  unitOfMeasure: text("unit_of_measure").notNull().default("EA"), // EA, LBS, GAL, etc.
  weight: integer("weight").default(0), // in grams
  volume: integer("volume").default(0), // in cubic centimeters
  standardCost: integer("standard_cost").default(0), // in cents
  listPrice: integer("list_price").default(0), // in cents
  leadTime: integer("lead_time").default(0), // days
  safetyStock: integer("safety_stock").default(0),
  reorderPoint: integer("reorder_point").default(0),
  lotSizeRule: text("lot_size_rule").default("fixed"), // fixed, lot_for_lot, economic_order_quantity
  lotSize: integer("lot_size").default(1),
  shelfLife: integer("shelf_life").default(0), // days
  requiresLotControl: boolean("requires_lot_control").default(false),
  requiresSerialControl: boolean("requires_serial_control").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Storage Locations - warehouses and storage areas within plants
export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  plantId: integer("plant_id").references(() => plants.id).notNull(), // Changed from siteId to plantId for one-to-many relationship
  locationType: text("location_type").notNull().default("general"), // general, finished_goods, raw_materials, work_in_process
  address: jsonb("address").$type<{
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>(),
  totalCapacity: integer("total_capacity").default(0), // cubic units
  usedCapacity: integer("used_capacity").default(0), // cubic units
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory - current stock levels
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id).notNull(),
  location: text("location"), // bin, shelf, etc.
  onHandQuantity: integer("on_hand_quantity").notNull().default(0),
  allocatedQuantity: integer("allocated_quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  onOrderQuantity: integer("on_order_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  averageCost: integer("average_cost").default(0), // in cents
  lastCountDate: timestamp("last_count_date"),
  lastMovementDate: timestamp("last_movement_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  itemStorageLocationIdx: unique().on(table.itemId, table.storageLocationId),
}));

// Inventory lots for lot-controlled items
export const inventoryLots = pgTable("inventory_lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  storageLocationId: integer("storage_location_id").references(() => storageLocations.id).notNull(),
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

// Sales orders from customers
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerCode: text("customer_code"),
  customerContact: jsonb("customer_contact").$type<{
    name?: string;
    email?: string;
    phone?: string;
  }>(),
  orderDate: timestamp("order_date").notNull(),
  requestedDate: timestamp("requested_date").notNull(),
  promisedDate: timestamp("promised_date"),
  shippedDate: timestamp("shipped_date"),
  status: text("status").notNull().default("open"), // open, confirmed, in_production, shipped, invoiced, closed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  totalAmount: integer("total_amount").default(0), // in cents
  currency: text("currency").notNull().default("USD"),
  siteId: integer("site_id").references(() => sites.id).notNull(),
  salesPerson: text("sales_person"),
  notes: text("notes"),
  shippingAddress: jsonb("shipping_address").$type<{
    name?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales order line items
export const salesOrderLines = pgTable("sales_order_lines", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  orderedQuantity: integer("ordered_quantity").notNull(),
  shippedQuantity: integer("shipped_quantity").default(0),
  unitPrice: integer("unit_price").notNull(), // in cents
  extendedPrice: integer("extended_price").notNull(), // in cents
  requestedDate: timestamp("requested_date").notNull(),
  promisedDate: timestamp("promised_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  salesOrderLineIdx: unique().on(table.salesOrderId, table.lineNumber),
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
  siteId: integer("site_id").references(() => sites.id).notNull(),
  buyerName: text("buyer_name"),
  notes: text("notes"),
  terms: text("terms"), // payment terms
  freightTerms: text("freight_terms"), // FOB, CIF, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase order line items
export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  orderedQuantity: integer("ordered_quantity").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  unitCost: integer("unit_cost").notNull(), // in cents
  extendedCost: integer("extended_cost").notNull(), // in cents
  requestedDate: timestamp("requested_date").notNull(),
  promisedDate: timestamp("promised_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  purchaseOrderLineIdx: unique().on(table.purchaseOrderId, table.lineNumber),
}));

// Transfer orders between storage locations/sites
export const transferOrders = pgTable("transfer_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  fromStorageLocationId: integer("from_storage_location_id").references(() => storageLocations.id).notNull(),
  toStorageLocationId: integer("to_storage_location_id").references(() => storageLocations.id).notNull(),
  requestedDate: timestamp("requested_date").notNull(),
  shippedDate: timestamp("shipped_date"),
  receivedDate: timestamp("received_date"),
  status: text("status").notNull().default("open"), // open, shipped, received, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  requestedBy: text("requested_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transfer order line items
export const transferOrderLines = pgTable("transfer_order_lines", {
  id: serial("id").primaryKey(),
  transferOrderId: integer("transfer_order_id").references(() => transferOrders.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  requestedQuantity: integer("requested_quantity").notNull(),
  shippedQuantity: integer("shipped_quantity").default(0),
  receivedQuantity: integer("received_quantity").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  transferOrderLineIdx: unique().on(table.transferOrderId, table.lineNumber),
}));

// Bills of Material - recipe/formula for making items
export const billsOfMaterial = pgTable("bills_of_material", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").references(() => items.id).notNull(),
  revision: text("revision").notNull().default("1"),
  description: text("description"),
  effectiveDate: timestamp("effective_date").notNull(),
  expiredDate: timestamp("expired_date"),
  bomType: text("bom_type").notNull().default("production"), // production, engineering, costing
  standardQuantity: integer("standard_quantity").notNull().default(1), // quantity this BOM produces
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentItemRevisionIdx: unique().on(table.parentItemId, table.revision),
}));

// BOM line items - components needed
export const bomLines = pgTable("bom_lines", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => billsOfMaterial.id).notNull(),
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
  bomId: integer("bom_id").references(() => billsOfMaterial.id).notNull(),
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
  bomId: integer("bom_id").references(() => billsOfMaterial.id).notNull(),
  productId: integer("product_id").references(() => items.id).notNull(), // Reference to output product/item
  outputQuantity: numeric("output_quantity", { precision: 10, scale: 4 }).notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  productType: text("product_type").notNull().default("primary"), // primary, co_product, by_product
  yieldPercentage: numeric("yield_percentage", { precision: 5, scale: 2 }).default("100"), // Expected yield %
  qualityGrade: text("quality_grade"), // Grade or quality classification
  isPrimary: boolean("is_primary").default(false), // True for the main output product
  sortOrder: integer("sort_order").default(1), // Display order
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Material Requirements - detailed requirements for formulations in process manufacturing OR bills of material in discrete manufacturing
export const materialRequirements = pgTable("material_requirements", {
  id: serial("id").primaryKey(),
  formulationId: integer("formulation_id").references(() => formulations.id),
  bomId: integer("bom_id").references(() => billsOfMaterial.id), // New relationship to bills of material
  itemId: integer("item_id").references(() => items.id), // Link to item master for inventory management
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
export const productionVersionPhaseFormulationDetails = pgTable("production_version_phase_formulation_details", {
  id: serial("id").primaryKey(),
  productionVersionId: integer("production_version_id").notNull().references(() => productionVersions.id, { onDelete: "cascade" }),
  recipePhaseId: integer("recipe_phase_id").notNull().references(() => recipePhases.id, { onDelete: "cascade" }),
  formulationDetailId: integer("formulation_detail_id").notNull().references(() => formulationDetails.id, { onDelete: "cascade" }),
  phaseSpecificValue: text("phase_specific_value"), // Override value for this specific phase
  phaseSpecificNotes: text("phase_specific_notes"), // Phase-specific instructions or notes
  applicabilityConditions: text("applicability_conditions"), // When this detail applies in the phase
  criticality: text("criticality").default("medium"), // "low", "medium", "high", "critical"
  validationRequired: boolean("validation_required").default(false), // Whether this detail requires validation in this phase
  monitoringFrequency: text("monitoring_frequency"), // "continuous", "batch_start", "batch_end", "hourly", etc.
  alertThresholds: jsonb("alert_thresholds"), // JSON for threshold configurations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate assignments
  uniqueAssignment: unique().on(table.productionVersionId, table.recipePhaseId, table.formulationDetailId),
  // Indexes for efficient querying
  productionVersionIdx: index("pvpfd_production_version_idx").on(table.productionVersionId),
  recipePhaseIdx: index("pvpfd_recipe_phase_idx").on(table.recipePhaseId),
  formulationDetailIdx: index("pvpfd_formulation_detail_idx").on(table.formulationDetailId),
}));

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
  
  // Production version linkage for process manufacturing
  productionVersionId: integer("production_version_id").references(() => productionVersions.id),
  
  // Sourcing and supply
  preferredVendorId: integer("preferred_vendor_id").references(() => vendors.id),
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

// Routings - sequence of operations to make items
export const routings = pgTable("routings", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  revision: text("revision").notNull().default("1"),
  description: text("description"),
  effectiveDate: timestamp("effective_date").notNull(),
  expiredDate: timestamp("expired_date"),
  routingType: text("routing_type").notNull().default("production"), // production, alternate, engineering
  standardQuantity: integer("standard_quantity").notNull().default(1), // lot size this routing is based on
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  itemRevisionIdx: unique().on(table.itemId, table.revision),
}));

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
  siteId: integer("site_id").references(() => sites.id).notNull(),
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

// Plants Relations
export const plantsRelations = relations(plants, ({ many }) => ({
  plantResources: many(plantResources),
  productionOrders: many(productionOrders),
  departments: many(departments),
  workCenters: many(workCenters),
  productionVersions: many(productionVersions),
  plannedOrders: many(plannedOrders),
  storageLocations: many(storageLocations), // One-to-many: plants can have multiple storage locations
}));

// Resources Relations
export const resourcesRelations = relations(resources, ({ many }) => ({
  plantResources: many(plantResources),
}));

// Plant Resources Junction Table Relations
export const plantResourcesRelations = relations(plantResources, ({ one }) => ({
  plant: one(plants, {
    fields: [plantResources.plantId],
    references: [plants.id],
  }),
  resource: one(resources, {
    fields: [plantResources.resourceId],
    references: [resources.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parentDepartment: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
  }),
  plant: one(plants, {
    fields: [departments.plantId],
    references: [plants.id],
  }),
  workCenters: many(workCenters),
  employees: many(employees),
}));

export const workCentersRelations = relations(workCenters, ({ one, many }) => ({
  department: one(departments, {
    fields: [workCenters.departmentId],
    references: [departments.id],
  }),
  plant: one(plants, {
    fields: [workCenters.plantId],
    references: [plants.id],
  }),
  employees: many(employees),
  routingOperations: many(routingOperations),
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

export const sitesRelations = relations(sites, ({ one, many }) => ({
  parentSite: one(sites, {
    fields: [sites.parentSiteId],
    references: [sites.id],
  }),
  // Removed storageLocations: storage locations now belong to plants instead of sites
  salesOrders: many(salesOrders),
  purchaseOrders: many(purchaseOrders),
  forecasts: many(forecasts),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  inventory: many(inventory),
  inventoryLots: many(inventoryLots),
  salesOrderLines: many(salesOrderLines),
  purchaseOrderLines: many(purchaseOrderLines),
  transferOrderLines: many(transferOrderLines),
  billsOfMaterial: many(billsOfMaterial),
  bomLines: many(bomLines),
  materialRequirements: many(materialRequirements), // Link to material requirements for inventory management
  formulationDetails: many(formulationDetails), // Link to formulation details for standardized specifications
  routings: many(routings),
  forecasts: many(forecasts),
}));

export const storageLocationsRelations = relations(storageLocations, ({ one, many }) => ({
  plant: one(plants, {
    fields: [storageLocations.plantId],
    references: [plants.id],
  }),
  inventory: many(inventory),
  inventoryLots: many(inventoryLots),
  transferOrdersFrom: many(transferOrders, { relationName: "fromStorageLocation" }),
  transferOrdersTo: many(transferOrders, { relationName: "toStorageLocation" }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [inventory.storageLocationId],
    references: [storageLocations.id],
  }),
}));

export const inventoryLotsRelations = relations(inventoryLots, ({ one }) => ({
  item: one(items, {
    fields: [inventoryLots.itemId],
    references: [items.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [inventoryLots.storageLocationId],
    references: [storageLocations.id],
  }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  site: one(sites, {
    fields: [salesOrders.siteId],
    references: [sites.id],
  }),
  lines: many(salesOrderLines),
}));

export const salesOrderLinesRelations = relations(salesOrderLines, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderLines.salesOrderId],
    references: [salesOrders.id],
  }),
  item: one(items, {
    fields: [salesOrderLines.itemId],
    references: [items.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  site: one(sites, {
    fields: [purchaseOrders.siteId],
    references: [sites.id],
  }),
  lines: many(purchaseOrderLines),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderLines.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  item: one(items, {
    fields: [purchaseOrderLines.itemId],
    references: [items.id],
  }),
}));

export const transferOrdersRelations = relations(transferOrders, ({ one, many }) => ({
  fromStorageLocation: one(storageLocations, {
    fields: [transferOrders.fromStorageLocationId],
    references: [storageLocations.id],
    relationName: "fromStorageLocation",
  }),
  toStorageLocation: one(storageLocations, {
    fields: [transferOrders.toStorageLocationId],
    references: [storageLocations.id],
    relationName: "toStorageLocation",
  }),
  lines: many(transferOrderLines),
}));

export const transferOrderLinesRelations = relations(transferOrderLines, ({ one }) => ({
  transferOrder: one(transferOrders, {
    fields: [transferOrderLines.transferOrderId],
    references: [transferOrders.id],
  }),
  item: one(items, {
    fields: [transferOrderLines.itemId],
    references: [items.id],
  }),
}));

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
}));

export const routingsRelations = relations(routings, ({ one, many }) => ({
  item: one(items, {
    fields: [routings.itemId],
    references: [items.id],
  }),
  operations: many(routingOperations),
  discreteOperations: many(discreteOperations),
  productionVersions: many(productionVersions),
}));

export const routingOperationsRelations = relations(routingOperations, ({ one }) => ({
  routing: one(routings, {
    fields: [routingOperations.routingId],
    references: [routings.id],
  }),
  workCenter: one(workCenters, {
    fields: [routingOperations.workCenterId],
    references: [workCenters.id],
  }),
}));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  item: one(items, {
    fields: [forecasts.itemId],
    references: [items.id],
  }),
  site: one(sites, {
    fields: [forecasts.siteId],
    references: [sites.id],
  }),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  plant: one(plants, {
    fields: [productionOrders.plantId],
    references: [plants.id],
  }),
  productionVersion: one(productionVersions, {
    fields: [productionOrders.productionVersionId],
    references: [productionVersions.id],
  }),
  // Relations to both discrete and process operations
  discreteOperations: many(discreteOperations),
  processOperations: many(processOperations),
  // Many-to-many relationship with planned orders via junction table
  plannedOrderLinks: many(plannedOrderProductionOrders),
}));

export const productionVersionsRelations = relations(productionVersions, ({ one, many }) => ({
  plant: one(plants, {
    fields: [productionVersions.plantId],
    references: [plants.id],
  }),
  recipe: one(recipes, {
    fields: [productionVersions.recipeId],
    references: [recipes.id],
  }),
  routing: one(routings, {
    fields: [productionVersions.routingId],
    references: [routings.id],
  }),
  bom: one(billsOfMaterial, {
    fields: [productionVersions.bomId],
    references: [billsOfMaterial.id],
  }),
  productionOrders: many(productionOrders),
  plannedOrders: many(plannedOrders),
  formulations: many(formulations), // One-to-many: one production version can have many formulations
  phaseFormulationDetailAssignments: many(productionVersionPhaseFormulationDetails), // Junction table for phase-specific formulation details
}));

export const plannedOrdersRelations = relations(plannedOrders, ({ one, many }) => ({
  plant: one(plants, {
    fields: [plannedOrders.plantId],
    references: [plants.id],
  }),
  productionVersion: one(productionVersions, {
    fields: [plannedOrders.productionVersionId],
    references: [productionVersions.id],
  }),
  // Many-to-many relationship with production orders via junction table
  productionOrderLinks: many(plannedOrderProductionOrders),
}));

// Junction table relations for many-to-many relationship
export const plannedOrderProductionOrdersRelations = relations(plannedOrderProductionOrders, ({ one }) => ({
  plannedOrder: one(plannedOrders, {
    fields: [plannedOrderProductionOrders.plannedOrderId],
    references: [plannedOrders.id],
  }),
  productionOrder: one(productionOrders, {
    fields: [plannedOrderProductionOrders.productionOrderId],
    references: [productionOrders.id],
  }),
  convertedBy: one(users, {
    fields: [plannedOrderProductionOrders.convertedBy],
    references: [users.id],
  }),
}));

// Relations for discrete operations
export const discreteOperationsRelations = relations(discreteOperations, ({ one, many }) => ({
  routing: one(routings, {
    fields: [discreteOperations.routingId],
    references: [routings.id],
  }),
  resourceRequirements: many(resourceRequirements),
  phases: many(discreteOperationPhases), // One-to-many relationship: one operation has many phases
}));

export const discreteOperationPhasesRelations = relations(discreteOperationPhases, ({ one, many }) => ({
  discreteOperation: one(discreteOperations, {
    fields: [discreteOperationPhases.discreteOperationId],
    references: [discreteOperations.id],
  }),
  resourceRequirementLinks: many(discreteOperationPhaseResourceRequirements),
}));

// Discrete Operation Phase Resource Requirements junction table relations
export const discreteOperationPhaseResourceRequirementsRelations = relations(discreteOperationPhaseResourceRequirements, ({ one }) => ({
  discreteOperationPhase: one(discreteOperationPhases, {
    fields: [discreteOperationPhaseResourceRequirements.discreteOperationPhaseId],
    references: [discreteOperationPhases.id],
  }),
  resourceRequirement: one(resourceRequirements, {
    fields: [discreteOperationPhaseResourceRequirements.resourceRequirementId],
    references: [resourceRequirements.id],
  }),
}));

// Relations for process operations
export const processOperationsRelations = relations(processOperations, ({ one, many }) => ({
  productionOrder: one(productionOrders, {
    fields: [processOperations.productionOrderId],
    references: [productionOrders.id],
  }),
  recipe: one(recipes, {
    fields: [processOperations.recipeId],
    references: [recipes.id],
  }),
  recipePhases: many(recipePhases), // One-to-many relationship: one process operation has many recipe phases
  assignedResource: one(resources, {
    fields: [processOperations.assignedResourceId],
    references: [resources.id],
  }),
  resourceRequirements: many(resourceRequirements),
}));

// Relations for material requirements
export const materialRequirementsRelations = relations(materialRequirements, ({ one }) => ({
  formulation: one(formulations, {
    fields: [materialRequirements.formulationId],
    references: [formulations.id],
  }),
  billOfMaterial: one(billsOfMaterial, {
    fields: [materialRequirements.bomId],
    references: [billsOfMaterial.id],
  }),
  item: one(items, {
    fields: [materialRequirements.itemId],
    references: [items.id],
  }),
}));

// Relations for formulations
export const formulationsRelations = relations(formulations, ({ one, many }) => ({
  productionVersion: one(productionVersions, {
    fields: [formulations.productionVersionId],
    references: [productionVersions.id],
  }),
  preferredVendor: one(vendors, {
    fields: [formulations.preferredVendorId],
    references: [vendors.id],
  }),
  materialRequirements: many(materialRequirements), // One-to-many: one formulation can have many material requirements
  formulationDetails: many(formulationDetails), // One-to-many: one formulation can have many formulation details
}));

// Relations for formulation details
export const formulationDetailsRelations = relations(formulationDetails, ({ one, many }) => ({
  formulation: one(formulations, {
    fields: [formulationDetails.formulationId],
    references: [formulations.id],
  }),
  item: one(items, {
    fields: [formulationDetails.itemId],
    references: [items.id],
  }),
  phaseAssignments: many(productionVersionPhaseFormulationDetails), // Many-to-many: one formulation detail can be assigned to many phases
}));

// Relations for production version phase formulation details junction table
export const productionVersionPhaseFormulationDetailsRelations = relations(productionVersionPhaseFormulationDetails, ({ one }) => ({
  productionVersion: one(productionVersions, {
    fields: [productionVersionPhaseFormulationDetails.productionVersionId],
    references: [productionVersions.id],
  }),
  recipePhase: one(recipePhases, {
    fields: [productionVersionPhaseFormulationDetails.recipePhaseId],
    references: [recipePhases.id],
  }),
  formulationDetail: one(formulationDetails, {
    fields: [productionVersionPhaseFormulationDetails.formulationDetailId],
    references: [formulationDetails.id],
  }),
}));

// Enhanced vendor relations to include formulations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  preferredFormulations: many(formulations),
}));



// ===== ERP INSERT SCHEMAS =====

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertWorkCenterSchema = createInsertSchema(workCenters).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  hireDate: z.union([z.string().datetime(), z.date()]).optional(),
  terminationDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertStorageLocationSchema = createInsertSchema(storageLocations).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryLotSchema = createInsertSchema(inventoryLots).omit({
  id: true,
  createdAt: true,
}).extend({
  expirationDate: z.union([z.string().datetime(), z.date()]).optional(),
  receivedDate: z.union([z.string().datetime(), z.date()]),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  orderDate: z.union([z.string().datetime(), z.date()]),
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
  shippedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertSalesOrderLineSchema = createInsertSchema(salesOrderLines).omit({
  id: true,
  createdAt: true,
}).extend({
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  orderDate: z.union([z.string().datetime(), z.date()]),
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
  receivedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertPurchaseOrderLineSchema = createInsertSchema(purchaseOrderLines).omit({
  id: true,
  createdAt: true,
}).extend({
  requestedDate: z.union([z.string().datetime(), z.date()]),
  promisedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertTransferOrderSchema = createInsertSchema(transferOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requestedDate: z.union([z.string().datetime(), z.date()]),
  shippedDate: z.union([z.string().datetime(), z.date()]).optional(),
  receivedDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertTransferOrderLineSchema = createInsertSchema(transferOrderLines).omit({
  id: true,
  createdAt: true,
});

export const insertBillOfMaterialSchema = createInsertSchema(billsOfMaterial).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  expiredDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertBomLineSchema = createInsertSchema(bomLines).omit({
  id: true,
  createdAt: true,
});

export const insertBomMaterialRequirementSchema = createInsertSchema(bomMaterialRequirements).omit({
  id: true,
  createdAt: true,
});

export const insertBomProductOutputSchema = createInsertSchema(bomProductOutputs).omit({
  id: true,
  createdAt: true,
});

export const insertRoutingSchema = createInsertSchema(routings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  expiredDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertRoutingOperationSchema = createInsertSchema(routingOperations).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialRequirementSchema = createInsertSchema(materialRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormulationsSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForecastSchema = createInsertSchema(forecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  forecastDate: z.union([z.string().datetime(), z.date()]),
});

// ===== ERP TYPE EXPORTS =====

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type WorkCenter = typeof workCenters.$inferSelect;
export type InsertWorkCenter = z.infer<typeof insertWorkCenterSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type StorageLocation = typeof storageLocations.$inferSelect;
export type InsertStorageLocation = z.infer<typeof insertStorageLocationSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InsertInventoryLot = z.infer<typeof insertInventoryLotSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

export type SalesOrderLine = typeof salesOrderLines.$inferSelect;
export type InsertSalesOrderLine = z.infer<typeof insertSalesOrderLineSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;
export type InsertPurchaseOrderLine = z.infer<typeof insertPurchaseOrderLineSchema>;

export type TransferOrder = typeof transferOrders.$inferSelect;
export type InsertTransferOrder = z.infer<typeof insertTransferOrderSchema>;

export type TransferOrderLine = typeof transferOrderLines.$inferSelect;
export type InsertTransferOrderLine = z.infer<typeof insertTransferOrderLineSchema>;

export type BillOfMaterial = typeof billsOfMaterial.$inferSelect;
export type InsertBillOfMaterial = z.infer<typeof insertBillOfMaterialSchema>;

export type BomLine = typeof bomLines.$inferSelect;
export type InsertBomLine = z.infer<typeof insertBomLineSchema>;

export type BomMaterialRequirement = typeof bomMaterialRequirements.$inferSelect;
export type InsertBomMaterialRequirement = z.infer<typeof insertBomMaterialRequirementSchema>;

export type BomProductOutput = typeof bomProductOutputs.$inferSelect;
export type InsertBomProductOutput = z.infer<typeof insertBomProductOutputSchema>;

export type Routing = typeof routings.$inferSelect;
export type InsertRouting = z.infer<typeof insertRoutingSchema>;

export type RoutingOperation = typeof routingOperations.$inferSelect;
export type InsertRoutingOperation = z.infer<typeof insertRoutingOperationSchema>;

export type MaterialRequirement = typeof materialRequirements.$inferSelect;
export type InsertMaterialRequirement = z.infer<typeof insertMaterialRequirementSchema>;

export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationsSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;

// User Secrets Management - for storing API keys and sensitive connection data
export const userSecrets = pgTable("user_secrets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
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

export const insertUserSecretSchema = createInsertSchema(userSecrets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSecret = typeof userSecrets.$inferSelect;
export type InsertUserSecret = z.infer<typeof insertUserSecretSchema>;

// Production Version Schema
export const insertProductionVersionSchema = createInsertSchema(productionVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductionVersion = typeof productionVersions.$inferSelect;
export type InsertProductionVersion = z.infer<typeof insertProductionVersionSchema>;

// Resource Requirements Insert Schemas
export const insertResourceRequirementSchema = createInsertSchema(resourceRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceRequirementAssignmentSchema = createInsertSchema(resourceRequirementAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  plannedStartTime: z.union([z.string().datetime(), z.date()]).optional(),
  plannedEndTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualStartTime: z.union([z.string().datetime(), z.date()]).optional(),
  actualEndTime: z.union([z.string().datetime(), z.date()]).optional(),
});



// Resource Requirements Types
export type ResourceRequirement = typeof resourceRequirements.$inferSelect;
export type InsertResourceRequirement = z.infer<typeof insertResourceRequirementSchema>;
export type ResourceRequirementAssignment = typeof resourceRequirementAssignments.$inferSelect;
export type InsertResourceRequirementAssignment = z.infer<typeof insertResourceRequirementAssignmentSchema>;


// Formulations Insert Schema and Types
export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  approvedDate: z.union([z.string().datetime(), z.date()]).optional(),
  lastCostUpdate: z.union([z.string().datetime(), z.date()]).optional(),
});

export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;

// Formulation Details Insert Schema and Types
export const insertFormulationDetailSchema = createInsertSchema(formulationDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FormulationDetail = typeof formulationDetails.$inferSelect;
export type InsertFormulationDetail = z.infer<typeof insertFormulationDetailSchema>;

export const insertProductionVersionPhaseFormulationDetailSchema = createInsertSchema(productionVersionPhaseFormulationDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductionVersionPhaseFormulationDetail = typeof productionVersionPhaseFormulationDetails.$inferSelect;
export type InsertProductionVersionPhaseFormulationDetail = z.infer<typeof insertProductionVersionPhaseFormulationDetailSchema>;

