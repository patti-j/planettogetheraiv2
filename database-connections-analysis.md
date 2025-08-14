# Database Table Connections Analysis

## Core Manufacturing Data Flow

### 1. Plant → Resources → Production Hierarchy
```
plants (59 PT tables)
├── plant_resources → resources
├── departments → department_resources
├── production_orders
│   ├── discrete_operations
│   │   └── discrete_operation_phases
│   │       └── discrete_operation_phase_resource_requirements
│   └── process_operations
└── work_centers → employees
```

### 2. Production Planning & Scheduling Chain
```
forecasts → items
├── production_versions
│   ├── formulations
│   │   └── formulation_details
│   └── production_version_phase_material_requirements
├── production_orders
│   ├── discrete_operations
│   └── routings
└── bills_of_material
    └── bom_lines
```

### 3. User Management & Permissions
```
users
├── user_roles → roles
│   └── role_permissions → permissions
├── chat_channels → chat_members → chat_messages
├── feedback → feedback_comments
└── user_preferences
```

### 4. Algorithm & Optimization Studio
```
optimization_algorithms
├── algorithm_deployments → users (deployed_by)
├── algorithm_tests → users (created_by)
├── algorithm_performance → plants
└── optimization_runs
    └── algorithm_feedback → users (submitted_by, resolved_by)
```

### 5. Inventory & Stock Management
```
items
├── inventory → storage_locations
├── inventory_lots
├── stock_items → stock_transactions
└── demand_history
```

## PT Import Data Connections (59 Tables)

### Key PT Import Relationships:
```
pt_plants
├── pt_departments
├── pt_resources → pt_resource_capabilities
├── pt_jobs → pt_job_operations
│   ├── pt_job_materials
│   ├── pt_job_activities
│   └── pt_job_successor_manufacturing_orders (NEW)
├── pt_manufacturing_orders (NEW)
├── pt_lots (NEW) → pt_items
├── pt_forecast_shipments (NEW) → pt_forecasts
└── pt_inventories → pt_warehouses
```

## Critical Data Connections by Function

### Production Execution
1. **production_orders** → **discrete_operations** → **discrete_operation_phases**
2. **resources** ←→ **plant_resources** ←→ **plants**
3. **production_orders** → **items** (item_number reference)

### Scheduling & Optimization
1. **optimization_algorithms** → **algorithm_deployments** → **plants**
2. **scheduling_results** → **scenario_operations**
3. **buffer_definitions** → **discrete_operations** → **resources**

### Master Data Integration
1. **PT Import Tables** connect via external_id fields to main schema
2. **pt_jobs** → **jobs** (via external_id mapping)
3. **pt_resources** → **resources** (via external_id mapping)
4. **pt_plants** → **plants** (via external_id mapping)

### Supply Chain Visibility
1. **sales_orders** → **production_orders** → **discrete_operations**
2. **inventory** → **items** → **forecasts**
3. **demand_forecasts** → **stock_optimization_scenarios**

## New Tables Impact (Added Today)

### 1. pt_forecast_shipments
**Connects:** pt_forecasts ↔ pt_warehouses
**Purpose:** Links forecast demand to specific shipment requirements

### 2. pt_job_successor_manufacturing_orders  
**Connects:** pt_jobs ↔ pt_manufacturing_orders ↔ pt_operations
**Purpose:** Manages job dependencies and manufacturing order relationships

### 3. pt_lots
**Connects:** pt_items ↔ pt_warehouses
**Purpose:** Enables lot/batch traceability for pharmaceutical manufacturing

### 4. pt_manufacturing_orders
**Connects:** pt_jobs ↔ pt_plants ↔ pt_items
**Purpose:** Complete manufacturing order master data with 30+ fields

## Integration Points Between Main Schema & PT Import

### External ID Mapping Strategy:
- **plants.id** ↔ **pt_plants.externalId**
- **resources.id** ↔ **pt_resources.externalId** 
- **production_orders.orderNumber** ↔ **pt_jobs.externalId**
- **items.itemNumber** ↔ **pt_items.externalId**

### Data Synchronization Flow:
```
PT System → PT Import Tables → Data Transformation → Main Schema Tables
```

## Key Relationship Patterns

### 1. Hierarchical Relationships
- Plants → Departments → Resources
- Production Orders → Operations → Phases
- BOM → BOM Lines → Material Requirements

### 2. Many-to-Many Relationships
- plants ←→ resources (via plant_resources)
- users ←→ roles (via user_roles)  
- roles ←→ permissions (via role_permissions)

### 3. Self-Referencing Relationships
- departments.parent_department_id → departments.id
- chat_messages.reply_to_id → chat_messages.id
- production_orders.parent_order_id → production_orders.id

### 4. Audit Trail Connections
- Most tables → users (created_by, updated_by, resolved_by)
- algorithm_feedback → users (multiple user references)
- disruptions → users (escalation tracking)

## Data Flow for Key Business Processes

### 1. Production Planning Process
```
forecasts → production_versions → production_orders → discrete_operations → resources
```

### 2. Quality Management Process  
```
production_orders → lots → inventory_lots → quality_tests → certificates
```

### 3. Schedule Optimization Process
```
optimization_algorithms → optimization_runs → algorithm_performance → plants
```

This comprehensive connection analysis shows how the 305+ tables work together to support manufacturing operations, from planning through execution to analysis.