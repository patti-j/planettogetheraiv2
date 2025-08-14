# PT Import Tables - Primary and Foreign Key Relationships Analysis

## Overview
Analysis of the 59 PT import tables showing their primary keys, business keys, and foreign key relationships for review.

## Key Structure Patterns

### 1. **Primary Keys**
All PT tables follow a consistent pattern:
- **`id`**: Auto-incrementing integer primary key (database-level)
- **`external_id`**: Business key from PlanetTogether system (varchar/text)

### 2. **Business Key Relationships (via external_id fields)**
PT tables use external_id patterns to maintain relationships from the original PlanetTogether system:

## **Core Organizational Hierarchy**

### Plants (Master Entity)
- **Table**: `pt_plants`
- **Primary Key**: `id` (auto-increment) + `external_id` (business key)
- **Relationships**: Root of organizational hierarchy

### Departments  
- **Table**: `pt_departments`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**: `plant_external_id` → `pt_plants.external_id`

### Resources
- **Table**: `pt_resources` 
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**: 
  - `plant_external_id` → `pt_plants.external_id`
  - `department_external_id` → `pt_departments.external_id`

## **Production Planning Chain**

### Jobs (Production Orders)
- **Table**: `pt_jobs`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**: 
  - `customer_external_id` → `pt_customers.external_id`
  - `make_to_stock_item_external_id` → `pt_items.external_id`
  - `make_to_stock_item_warehouse_external_id` → `pt_warehouses.external_id`
  - `demand_source_order_external_id` → Sales order reference

### Manufacturing Orders
- **Table**: `pt_manufacturing_orders`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**:
  - `job_external_id` → `pt_jobs.external_id`
  - `locked_plant_external_id` → `pt_plants.external_id`

### Job Operations
- **Table**: `pt_job_operations`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**:
  - `job_external_id` → `pt_jobs.external_id`
  - `mo_external_id` → `pt_manufacturing_orders.external_id`
  - `auto_created_capability_external_id` → `pt_capabilities.external_id`

## **Resource Assignment and Scheduling**

### Job Resources (Resource Assignments)
- **Table**: `pt_job_resources`
- **Keys**: `id` (PK)
- **Foreign Keys**:
  - `job_external_id` → `pt_jobs.external_id`
  - `operation_external_id` → `pt_job_operations.external_id`
  - `plant_external_id` → `pt_plants.external_id`
  - `department_external_id` → `pt_departments.external_id`
  - `resource_external_id` → `pt_resources.external_id`

### Job Activities (Actual Scheduling)
- **Table**: `pt_job_activities`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**:
  - `job_external_id` → `pt_jobs.external_id`
  - `op_external_id` → `pt_job_operations.external_id`
  - `mo_external_id` → `pt_manufacturing_orders.external_id`

## **Material and Inventory Management**

### Items (Products/Materials)
- **Table**: `pt_items`
- **Keys**: `id` (PK), `external_id` (business key)

### Warehouses
- **Table**: `pt_warehouses`  
- **Keys**: `id` (PK), `external_id` (business key)

### Inventories
- **Table**: `pt_inventories`
- **Keys**: `id` (PK)
- **Foreign Keys**:
  - `warehouse_external_id` → `pt_warehouses.external_id`
  - `item_external_id` → `pt_items.external_id`
  - `planner_external_id` → `pt_users.external_id`

### Job Materials (Material Requirements)
- **Table**: `pt_job_materials`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**:
  - `job_external_id` → `pt_jobs.external_id`
  - `mo_external_id` → `pt_manufacturing_orders.external_id`
  - `op_external_id` → `pt_job_operations.external_id`
  - `item_external_id` → `pt_items.external_id`
  - `warehouse_external_id` → `pt_warehouses.external_id`

## **Capabilities and Constraints**

### Capabilities
- **Table**: `pt_capabilities`
- **Keys**: `id` (PK), `external_id` (business key)

### Resource Capabilities (Many-to-Many)
- **Table**: `pt_resource_capabilities`
- **Foreign Keys**:
  - `resource_external_id` → `pt_resources.external_id`
  - `plant_external_id` → `pt_plants.external_id`
  - `department_external_id` → `pt_departments.external_id`
  - `capability_external_id` → `pt_capabilities.external_id`

## **Sales and Customer Management**

### Customers
- **Table**: `pt_customers`
- **Keys**: `id` (PK), `external_id` (business key)

### Sales Orders
- **Table**: `pt_sales_orders`
- **Keys**: `id` (PK), `external_id` (business key)
- **Foreign Keys**:
  - `customer_external_id` → `pt_customers.external_id`

### Sales Order Lines
- **Table**: `pt_sales_order_lines`
- **Foreign Keys**:
  - `sales_order_external_id` → `pt_sales_orders.external_id`
  - `item_external_id` → `pt_items.external_id`

## **Complex Relationship Tables**

### Job Path Management
- **pt_job_paths**: Job routing paths
- **pt_job_path_nodes**: Individual nodes in routing paths

### Resource Connections
- **pt_resource_connections**: Direct resource-to-resource connections
- **pt_resource_connectors**: Named connection types between resources

### Setup and Compatibility
- **pt_attribute_code_table_resources**: Attribute-based resource compatibility
- **pt_compatibility_code_table_resources**: Resource compatibility matrices

## **Recommendations for Implementation**

### 1. **Primary Key Strategy**
- Keep auto-increment `id` as database primary keys for performance
- Use `external_id` fields for business logic and PT system integration

### 2. **Foreign Key Constraints**
Consider adding foreign key constraints for:
- Core hierarchy: Plant → Department → Resource
- Production flow: Job → Manufacturing Order → Operations → Activities
- Material flow: Item → Inventory → Job Materials

### 3. **Indexing Strategy**
Create indexes on:
- All `external_id` fields (most frequently queried)
- Foreign key relationship fields
- Date fields used in scheduling queries

### 4. **Data Integrity**
The external_id pattern allows for:
- Referential integrity with original PT system
- Flexible querying across related entities  
- Support for both internal database operations and PT integration