# PT (PlanetTogether) Tables - Relationship Analysis

## Overview
The PT import database contains 59 tables that represent a complete PlanetTogether APS (Advanced Planning & Scheduling) system. While the tables don't have explicit foreign key constraints, they are connected through external ID references that form the core data model for manufacturing planning and scheduling.

## Core Entity Relationships

### 1. **Organizational Hierarchy**
```
pt_plants (Manufacturing Plants)
├── pt_departments (Plant Departments)
│   └── pt_resources (Manufacturing Resources/Equipment)
│       ├── pt_resource_capabilities (What resources can do)
│       ├── pt_resource_connections (How resources connect)
│       └── pt_allowed_helpers (Resource assistance relationships)
└── pt_plant_warehouses (Plant-specific warehouses)
    └── pt_warehouses (Storage locations)
```

**Key Relationships:**
- `pt_plants.external_id` → referenced by `pt_departments.plant_external_id`
- `pt_departments.external_id` → referenced by `pt_resources.department_external_id`
- `pt_resources.external_id` → referenced across many tables as `resource_external_id`

### 2. **Manufacturing Orders & Jobs Hierarchy**
```
pt_manufacturing_orders (Production Orders from ERP)
├── pt_jobs (Scheduled production jobs)
│   ├── pt_job_operations (Manufacturing operations within jobs)
│   │   ├── pt_job_activities (Actual scheduled activities)
│   │   ├── pt_job_materials (Materials required for operations)
│   │   ├── pt_job_operation_attributes (Setup attributes for operations)
│   │   └── pt_job_resources (Resources assigned to operations)
│   ├── pt_job_products (Products produced by jobs)
│   ├── pt_job_paths (Routing paths for operations)
│   │   └── pt_job_path_nodes (Nodes in routing paths)
│   ├── pt_job_resource_capabilities (Required capabilities)
│   └── pt_job_successor_manufacturing_orders (Job dependencies)
└── pt_lots (Production lot tracking)
```

**Key Relationships:**
- `pt_manufacturing_orders.external_id` → `pt_jobs.mo_external_id`
- `pt_jobs.external_id` → `pt_job_operations.job_external_id`
- `pt_jobs.external_id` → `pt_job_activities.job_external_id`
- `pt_job_operations.external_id` → `pt_job_materials.op_external_id`

### 3. **Customer & Sales Chain**
```
pt_customers (Customer master data)
├── pt_sales_orders (Customer sales orders)
│   └── pt_sales_order_lines (Individual line items)
│       └── pt_sales_order_line_distributions (Delivery distributions)
└── pt_customer_connections (Customer-plant relationships)
```

**Key Relationships:**
- `pt_customers.external_id` → `pt_sales_orders.customer_external_id`
- `pt_sales_orders.external_id` → `pt_sales_order_lines.sales_order_external_id`

### 4. **Product & Inventory Management**
```
pt_items (Product master data)
├── pt_inventories (Current stock levels)
├── pt_forecasts (Demand forecasts)
├── pt_forecast_shipments (Forecast delivery schedules)
├── pt_purchases_to_stock (Purchase orders)
├── pt_transfer_orders (Stock transfers)
│   └── pt_transfer_order_distributions (Transfer distributions)
└── pt_product_rules (Product-specific business rules)
```

**Key Relationships:**
- `pt_items.external_id` → referenced across inventory and forecast tables
- `pt_warehouses.external_id` → `pt_inventories.warehouse_external_id`

### 5. **Setup Optimization & Attributes**
```
pt_attributes (Setup/changeover attributes)
├── pt_attribute_code_tables (Changeover time tables)
│   ├── pt_attribute_code_table_attr_codes (Attribute codes)
│   ├── pt_attribute_code_table_attr_names (Attribute names)
│   └── pt_attribute_code_table_resources (Applicable resources)
├── pt_attribute_range_tables (Attribute range optimization)
│   ├── pt_attribute_range_table_attr_names (Range attribute names)
│   ├── pt_attribute_range_table_from (Range start values)
│   ├── pt_attribute_range_table_to (Range end values)
│   └── pt_attribute_range_table_resources (Applicable resources)
├── pt_compatibility_codes (Product compatibility)
├── pt_compatibility_code_tables (Compatibility matrices)
│   └── pt_compatibility_code_table_resources (Resource compatibility)
└── pt_cleanout_trigger_tables (Cleanout requirements)
    ├── pt_cleanout_trigger_table_op_count (Operation count triggers)
    ├── pt_cleanout_trigger_table_prod_units (Production unit triggers)
    ├── pt_cleanout_trigger_table_resources (Resource-specific triggers)
    └── pt_cleanout_trigger_table_time (Time-based triggers)
```

### 6. **Resource Management & Capacity**
```
pt_resources (Manufacturing resources)
├── pt_resource_capabilities (Resource skills/capabilities)
├── pt_resource_connections (Resource-to-resource connections)
├── pt_resource_connectors (Physical connectors between resources)
├── pt_capabilities (Master list of manufacturing capabilities)
├── pt_capacity_intervals (Resource capacity schedules)
│   └── pt_capacity_interval_resources (Resources with capacity)
├── pt_recurring_capacity_intervals (Recurring capacity patterns)
└── pt_cells (Manufacturing cells containing resources)
```

### 7. **System Administration**
```
pt_users (PT system users)
└── (User access and permissions - connects to main user system)
```

## Key Integration Points

### External ID Patterns
Most relationships use external ID references rather than database foreign keys:
- `plant_external_id` - Links to pt_plants
- `department_external_id` - Links to pt_departments  
- `resource_external_id` - Links to pt_resources
- `job_external_id` - Links to pt_jobs
- `mo_external_id` - Links to pt_manufacturing_orders
- `op_external_id` - Links to pt_job_operations
- `item_external_id` - Links to pt_items
- `customer_external_id` - Links to pt_customers
- `warehouse_external_id` - Links to pt_warehouses

### Cross-System Integration
These PT tables serve as import/staging tables that connect to the main ERP system:
- Manufacturing orders flow from ERP → PT → Scheduled jobs
- Resources and capabilities sync between systems
- Inventory levels and forecasts integrate with demand planning
- Customer orders drive production scheduling

## Data Flow Summary

1. **Master Data**: Plants → Departments → Resources → Capabilities
2. **Demand Planning**: Customers → Sales Orders → Forecasts → Manufacturing Orders
3. **Production Planning**: Manufacturing Orders → Jobs → Operations → Activities
4. **Resource Planning**: Resources → Capacity → Assignments → Execution
5. **Material Planning**: Items → Inventory → Requirements → Procurement
6. **Quality & Compliance**: Lots → Traceability → Attributes → Rules

This structure represents a complete Advanced Planning & Scheduling (APS) system that integrates with ERP systems to provide optimized production scheduling based on resource capabilities, material availability, and customer demand.