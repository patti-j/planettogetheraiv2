# PT Tables Complete Documentation
## Comprehensive Guide to PlanetTogether Table Structure and Relationships

*Consolidated from multiple documentation sources and Jim's corrections*

---

## Table of Contents
1. [Resource Assignment Logic (Jim's Corrections)](#resource-assignment-logic)
2. [Table Structure Overview](#table-structure-overview)
3. [Core Table Relationships](#core-table-relationships)
4. [Data Flow and Scheduling Process](#data-flow-and-scheduling-process)
5. [Data Integrity Requirements](#data-integrity-requirements)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Constraints and Rules](#constraints-and-rules)

---

## Resource Assignment Logic
*Based on Jim's corrected understanding*

### Key Scheduling Concepts

1. **Default Resource (Preference)**: Set in `ptjobresources.default_resource_id`
   - Represents the preferred resource for an operation
   - Scheduler prioritizes this resource when available
   - Can be overridden by constraints or availability

2. **Capabilities**: Stored in `jobresourcecapabilities`
   - Specify which capabilities a resource must have to be able to have an activity scheduled on it
   - Can be overridden by default resource (i.e., the default resource does not have to have the specified capabilities to be eligible)

3. **Resources Scheduled (Outcome)**: Stored in `ptjobresourceblocks`
   - Records which resource(s) are scheduled to perform the operation activity
   - Populated after scheduling is complete

### Scheduling Process Flow

#### Input Phase:
- Operations defined in `ptjoboperations` 
- Activities defined in `ptjobactivities`
- Resource requirements defined in `ptjobresources` with `default_resource_id`
- Required capabilities defined in `ptjobresourcecapabilities`
- Available resources listed in `ptresources` with their capabilities defined in `jobresourcecapabilities`

#### Scheduling Phase:
- Scheduler considers `default_resource_id` as preference if set (it is optional)
- Checks resource availability and constraints
- May assign alternative eligible resource if default is null or unavailable within timing threshold

#### Output Phase:
- `ptjobresourceblocks` defines which resources are used at which time intervals; one for each jobresource
- `ptjobresourceblockintervals` defines the various contiguous time segments of the block (setup, run, post processing, etc)

---

## Table Structure Overview

### PT Import Tables (59 tables with `pt_` prefix)
Core manufacturing data model imported from PlanetTogether APS system.

### PT Publish Tables (61 tables with `pt_publish_` prefix) 
Published schedule data and results from scheduling runs.

**Note**: *Need clarification on relationship between import vs publish table sets*

---

## Core Table Relationships

### 1. Organizational Hierarchy
```
ptPlants (Manufacturing Plants)
├── ptDepartments (Plant Departments)
│   └── ptResources (Manufacturing Resources/Equipment)
│       ├── ptResourceCapabilities (What resources can do)
│       ├── ptResourceConnections (How resources connect)
│       └── ptAllowedHelpers (Resource assistance relationships)
└── ptPlantWarehouses (Plant-specific warehouses)
    └── ptWarehouses (Storage locations)
```

**Key Relationships:**
- `ptplants.external_id` → `ptdepartments.plant_external_id`
- `ptdepartments.external_id` → `ptresources.department_external_id`
- `ptresources.external_id` → referenced across many tables as `resource_external_id`

### 2. Job Operations and Resource Requirements

#### ptjobresources (Resource Requirements)
**Purpose**: Defines resource requirements and preferences for operations
- `default_resource_id`: Links to ptresources.resource_id (preferred resource)
- `is_primary`: Boolean indicating if this is the primary resource requirement
- `resource_requirement_id`: Unique identifier for this requirement
- One operation can have multiple resource requirements (primary + secondaries)

#### ptresourcecapabilities (Resource Capabilities)
- Used to link ptjobresources to the eligible available resources that can be used to schedule the requirement

#### ptjoboperations (Operations)
**Purpose**: Contains the scheduled operations with their resource assignments
- Provide information such as run rates for use in scheduling the resource requirements
- Related to paths which provide precedence constraints and to manufacturing orders to which the operations belong which are then related to jobs

#### ptjobactivities (Activities)
- Each Operation must have one or more activities to schedule; an operation has one activity unless it is split into multiple activities
- Each activity is scheduled on one or more resources (based on jobResources, and jobResourceCapabilities or default resource)

#### ptresources (Available Resources)
**Purpose**: Master list of all available resources/machines
- `resource_id`: Unique identifier for the resource
- `department_name`: Department/work center this resource belongs to
- `bottleneck`: Boolean indicating if this is a bottleneck resource
- `active`: Boolean indicating if resource is available for scheduling
- References capacity intervals and recurring capacity intervals to determine available working capacity over time

### 3. Manufacturing Orders & Jobs Hierarchy
```
ptManufacturingOrders (Production Orders from ERP)
├── ptJobs (Scheduled production jobs)
│   ├── ptJobOperations (Manufacturing operations within jobs)
│   │   ├── ptJobActivities (Actual scheduled activities)
│   │   ├── ptJobMaterials (Materials required for operations)
│   │   ├── ptJobOperationAttributes (Setup attributes for operations)
│   │   └── ptJobResources (Resources assigned to operations)
│   ├── ptJobProducts (Products produced by jobs)
│   ├── ptJobPaths (Routing paths for operations)
│   │   └── ptJobPathNodes (Nodes in routing paths)
│   ├── ptJobResourceCapabilities (Required capabilities)
│   └── ptJobSuccessorManufacturingOrders (Job dependencies)
└── ptLots (Production lot tracking)
```

### 4. Customer & Sales Chain
```
ptCustomers (Customer master data)
├── ptSalesOrders (Customer sales orders)
│   └── ptSalesOrderLines (Individual line items)
│       └── ptSalesOrderLineDistributions (Delivery distributions)
└── ptCustomerConnections (Customer-plant relationships)
```

### 5. Product & Inventory Management
```
ptItems (Product master data)
├── ptInventories (Current stock levels)
├── ptForecasts (Demand forecasts)
├── ptForecastShipments (Forecast delivery schedules)
├── ptPurchasesToStock (Purchase orders)
├── ptTransferOrders (Stock transfers)
│   └── ptTransferOrderDistributions (Transfer distributions)
└── ptProductRules (Product-specific business rules)
```

### 6. Capacity & Scheduling
```
ptResources (Manufacturing resources)
├── ptResourceCapabilities (Resource skills/capabilities)
├── ptResourceConnections (Resource-to-resource connections)
├── ptResourceConnectors (Physical connectors between resources)
├── ptCapabilities (Master list of manufacturing capabilities)
├── ptCapacityIntervals (Resource capacity schedules)
│   └── ptCapacityIntervalResources (Resources with capacity)
├── ptRecurringCapacityIntervals (Recurring capacity patterns)
└── ptCells (Manufacturing cells containing resources)
```

---

## Data Flow and Scheduling Process

### Key Business Rules:

1. **Resource Eligibility**:
   - Resource must be active (`ptresources.active = true`)
   - Resource capabilities must match job operation resource required capabilities (unless using default resource)

2. **Scheduling Output**:
   - `ptjobresourceblocks`: Defines which resources are used at which time intervals; one for each jobresource
   - `ptjobresourceblockintervals`: Defines the various contiguous time segments of the block (setup, run, post processing, etc)

---

## Data Integrity Requirements

### Foreign Key Relationships:
- `ptjobresources.default_resource_id` → `ptresources.resource_id`
- `ptjoboperations.primary_resource_requirement_id` → `ptjobresources.resource_requirement_id` (defines which job resource is the primary, which can determine run rate)

### Consistency Checks:
- Actual resources used should exist in ptresources
- Primary resource requirements should have is_primary = true
- Job resource block segments should all be contained within the job resource block from a start to end duration perspective

### Scheduling Validation:
- Operations with blocks should have scheduled times
- Resources assigned should be active

---

## Implementation Guidelines

### External ID Patterns
Most relationships use external ID references rather than database foreign keys:
- `plant_external_id` - Links to ptplants
- `department_external_id` - Links to ptdepartments  
- `resource_external_id` - Links to ptresources
- `job_external_id` - Links to ptjobs

### Dual Key Strategy
- Keep both auto-increment `id` (for database performance) and `external_id` (for PT integration)
- Use external_id fields for all cross-table relationships
- Index all external_id fields heavily used in joins

### Query Optimization
```sql
-- Business key indexes (most frequently queried)
CREATE INDEX idx_pt_plants_external_id ON pt_plants(external_id);
CREATE INDEX idx_pt_departments_external_id ON pt_departments(external_id);  
CREATE INDEX idx_pt_resources_external_id ON pt_resources(external_id);
CREATE INDEX idx_pt_jobs_external_id ON pt_jobs(external_id);
CREATE INDEX idx_pt_job_operations_external_id ON pt_job_operations(external_id);

-- Foreign key relationship indexes
CREATE INDEX idx_pt_departments_plant ON pt_departments(plant_external_id);
CREATE INDEX idx_pt_resources_plant_dept ON pt_resources(plant_external_id, department_external_id);
CREATE INDEX idx_pt_job_resources_composite ON pt_job_resources(job_external_id, operation_external_id, resource_external_id);
```

---

## Constraints and Rules

### CRITICAL CONSTRAINT: PT Table Structure Integrity

**PT Publish tables should maintain their original structure as defined in the creation script, with minimal approved variations when absolutely necessary.**

#### ❌ AVOID WITHOUT APPROVAL:
- Add new columns to PT tables (requires explicit approval)
- Remove existing columns from PT tables
- Modify column data types
- Change column constraints
- Alter foreign key relationships
- Rename columns or tables
- Add or remove indexes (except for performance)

#### ✅ ALWAYS DO:
- Adapt application queries to work with existing PT structure
- Create complex joins and subqueries as needed
- Handle missing data in application layer
- Map old column names to PT equivalents in queries
- Transform data in the application, not the database
- Use computed columns in SELECT statements rather than adding to tables

### Common Migration Patterns

#### Column Name Differences
```sql
-- Old query:
SELECT due_date FROM production_orders

-- PT Adapted query:
SELECT need_date_time as due_date FROM pt_publish_jobs
```

#### Complex Relationships
```sql
-- PT requires more joins due to normalized structure
SELECT 
  j.name as job_name,
  jo.name as operation_name,
  r.name as resource_name
FROM pt_publish_job_operations jo
LEFT JOIN pt_publish_jobs j ON jo.job_id = j.id
LEFT JOIN pt_publish_job_resources jr ON jr.operation_id = jo.id
LEFT JOIN pt_publish_resources r ON jr.default_resource_id = r.id
```

---

## Gantt Chart Display Logic

- **Row Organization**: Each resource gets its own row
- **Operation Blocks**: Display on the resource row based on jobresourceblocks and jobresourceblockintervals
- **Time Position**: Based on scheduled_start and scheduled_end
- **Color Coding**: Can indicate if using default vs alternative resource
- **Drag-Drop**: Moving updates both time and potentially resource assignment

---

## Summary of Key Relationship Patterns

### Primary Hierarchies:
1. **Plant → Department → Resource** (Manufacturing Structure)
2. **Item → Job → Operation → Activity** (Production Flow) 
3. **Customer → Sales Order → Order Line → Distribution** (Order Management)
4. **Warehouse → Inventory/Lots** (Material Management)

### Many-to-Many Relationships:
- Resources ↔ Capabilities (via ptResourceCapabilities)
- Jobs ↔ Resource Capabilities (via ptJobResourceCapabilities)
- Attribute Tables ↔ Resources (via various resource tables)

### Cross-Reference Tables:
- Helper relationships between resources
- Capacity intervals across resources
- Cleanout triggers and compatibility rules
- Connection networks between resources

This comprehensive relationship structure enables full traceability and optimization across the entire manufacturing value chain, from customer orders through production planning, resource scheduling, material management, and delivery execution.

---

*Last Updated: Based on Jim's corrections and consolidated documentation*