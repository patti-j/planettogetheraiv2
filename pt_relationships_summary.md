# PT Import Tables - Primary and Foreign Key Relationships Summary

## **Complete 59-Table Analysis**

### **Primary Key Pattern (All Tables)**
```
Every PT table has:
├── id (auto-increment integer) ← Database primary key  
└── external_id (varchar/text)  ← Business key from PlanetTogether
```

### **Core Organizational Hierarchy**
```
pt_plants (3 records)
├── PLANT_001 → "Acme Pharma Main"
├── PLANT_002 → "Acme Pharma West" 
└── PLANT_003 → "Acme Pharma EU"
    │
    └── pt_departments (5 records)
        ├── DEPT_MIX_001 → "Mixing Department"
        ├── DEPT_PRESS_001 → "Tablet Press"
        ├── DEPT_COAT_001 → "Coating Department"
        ├── DEPT_PACK_001 → "Packaging"
        └── DEPT_QC_001 → "Quality Control"
            │
            └── pt_resources (23 records)
                ├── RES_MIX_001 → "High Shear Mixer #1"
                ├── RES_MIX_002 → "High Shear Mixer #2"
                ├── RES_PRESS_001 → "Tablet Press Line A"
                └── [20 more resources...]
```

## **Key Foreign Key Relationships**

### **1. Production Planning Chain**
```
pt_customers (2) → pt_jobs (4) → pt_manufacturing_orders (4) → pt_job_operations (7)
                      ↓              ↓                           ↓
                 pt_job_products  pt_job_materials      pt_job_activities (3)
```

**Detailed Flow:**
- **pt_jobs.customer_external_id** → pt_customers.external_id
- **pt_manufacturing_orders.job_external_id** → pt_jobs.external_id  
- **pt_job_operations.job_external_id** → pt_jobs.external_id
- **pt_job_operations.mo_external_id** → pt_manufacturing_orders.external_id

### **2. Resource Assignment Network**
```
pt_job_resources (Junction Table)
├── job_external_id → pt_jobs.external_id
├── operation_external_id → pt_job_operations.external_id  
├── plant_external_id → pt_plants.external_id
├── department_external_id → pt_departments.external_id
└── resource_external_id → pt_resources.external_id
```

### **3. Capability Management**
```
pt_capabilities (15) ↔ pt_resource_capabilities ↔ pt_resources (23)
                            (Many-to-Many Junction)
```

### **4. Inventory and Materials**
```
pt_items (15) → pt_inventories (10) ← pt_warehouses (6)
     ↓               ↓
pt_job_materials    pt_lots
```

## **Complex Relationship Tables**

### **Multi-Reference Tables**
These tables reference multiple master entities:

1. **pt_job_resources** - Links jobs, operations, plants, departments, and resources
2. **pt_job_materials** - Links jobs, operations, items, and warehouses  
3. **pt_resource_capabilities** - Links resources and capabilities across organizational hierarchy
4. **pt_allowed_helpers** - Cross-department resource sharing rules
5. **pt_resource_connections** - Physical connections between resources

### **Specialized Reference Patterns**

#### **Setup and Compatibility**
- **pt_attribute_code_table_resources**: Resource compatibility by attributes
- **pt_compatibility_code_table_resources**: Direct resource compatibility
- **pt_cleanout_trigger_table_resources**: Cleaning requirements between jobs

#### **Sales Integration** 
- **pt_sales_orders** → **pt_sales_order_lines** → **pt_sales_order_line_distributions**
- **pt_customer_connections**: Links customers to specific jobs

#### **Supply Chain**
- **pt_transfer_orders** → **pt_transfer_order_distributions**: Inter-warehouse transfers
- **pt_purchases_to_stock**: Supplier purchase orders
- **pt_forecasts**: Demand forecasting by item/warehouse

## **Recommended Foreign Key Constraints**

### **Critical Relationships (High Priority)**
```sql
-- Core organizational hierarchy
pt_departments.plant_external_id → pt_plants.external_id
pt_resources.plant_external_id → pt_plants.external_id
pt_resources.department_external_id → pt_departments.external_id

-- Production planning chain
pt_manufacturing_orders.job_external_id → pt_jobs.external_id
pt_job_operations.job_external_id → pt_jobs.external_id
pt_job_operations.mo_external_id → pt_manufacturing_orders.external_id
pt_job_activities.job_external_id → pt_jobs.external_id
pt_job_activities.op_external_id → pt_job_operations.external_id

-- Resource assignments
pt_job_resources.resource_external_id → pt_resources.external_id
pt_job_resources.job_external_id → pt_jobs.external_id
pt_job_resources.operation_external_id → pt_job_operations.external_id
```

### **Data Integrity Indexes**
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

## **Data Volume Summary**
- **Plants**: 3 (Multi-site pharmaceutical company)
- **Departments**: 5 per plant (Mixing, Pressing, Coating, Packaging, QC)
- **Resources**: 23 total (Manufacturing equipment)
- **Jobs**: 4 (Active pharmaceutical batches)
- **Operations**: 7 (Manufacturing steps)
- **Activities**: 3 (Scheduled operations)
- **Capabilities**: 15 (Equipment capabilities)
- **Items**: 15 (Raw materials and products)
- **Customers**: 2 (External clients)

## **Implementation Notes**
1. **Dual Key Strategy**: Keep both auto-increment `id` (for database performance) and `external_id` (for PT integration)
2. **Referential Integrity**: Use external_id fields for all cross-table relationships
3. **Query Optimization**: Index all external_id fields heavily used in joins
4. **Data Validation**: Ensure external_id values exist in referenced tables before insert
5. **Performance**: Consider materialized views for complex multi-table queries used in scheduling