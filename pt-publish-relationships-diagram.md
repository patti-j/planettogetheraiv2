# PT Publish Tables Relationship Diagram

## Core Job/Manufacturing Flow
```
┌─────────────────┐
│   pt_publish_   │
│      jobs       │ (Master Job Records)
└────────┬────────┘
         │ job_id
         ├─────────────────────────────────────┐
         ▼                                     ▼
┌──────────────────────┐            ┌─────────────────────────┐
│     pt_publish_      │            │     pt_publish_         │
│ manufacturing_orders │◄───────────│ job_successor_          │
│                      │            │ manufacturing_orders    │
└──────────┬───────────┘            └─────────────────────────┘
           │ manufacturing_order_id
           ├──────────────┬────────────────┬──────────────────┐
           ▼              ▼                ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   pt_publish_   │ │  pt_publish_ │ │ pt_publish_ │ │  pt_publish_ │
│ job_operations  │ │  job_paths   │ │job_products │ │job_materials │
└────────┬────────┘ └──────┬───────┘ └──────┬──────┘ └──────────────┘
         │ operation_id     │ path_id        │ product_id
         ├──────────────────┼────────────────┤
         ▼                  ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────────────┐
│   pt_publish_   │ │  pt_publish_ │ │     pt_publish_        │
│ job_activities  │ │job_path_nodes│ │ job_material_supplying_│
│                 │ │              │ │     activities         │
└─────────────────┘ └──────────────┘ └────────────────────────┘
```

## Resource Management Hierarchy
```
┌─────────────────┐
│   pt_publish_   │
│     plants      │ (Top Level)
└────────┬────────┘
         │ plant_id
         ├─────────────────────────┐
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│   pt_publish_   │      │   pt_publish_    │
│  departments    │      │ plant_warehouses │
└────────┬────────┘      └──────────────────┘
         │ department_id            │
         ▼                          │ warehouse_id
┌─────────────────┐                 ▼
│   pt_publish_   │      ┌──────────────────┐
│   resources     │      │   pt_publish_    │
└────────┬────────┘      │   warehouses     │
         │ resource_id    └──────────────────┘
         ├──────────────────────────┐
         ▼                          ▼
┌──────────────────────┐  ┌─────────────────────────┐
│     pt_publish_      │  │      pt_publish_        │
│resource_capabilities │  │ capacity_interval_      │
│                      │  │ resource_assignments    │
└──────────┬───────────┘  └─────────────────────────┘
           │ capability_id           │
           ▼                         │ capacity_interval_id
┌──────────────────────┐            ▼
│     pt_publish_      │  ┌─────────────────────────┐
│    capabilities      │  │      pt_publish_        │
└──────────────────────┘  │   capacity_intervals    │
                          └─────────────────────────┘
```

## Job Resource Allocation
```
┌─────────────────┐
│ job_operations  │
└────────┬────────┘
         │ operation_id
         ├────────────────┬──────────────────┬─────────────────┐
         ▼                ▼                  ▼                 ▼
┌──────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│job_resources │ │job_resource_     │ │job_activities│ │job_operation_   │
│              │ │capabilities      │ │              │ │attributes       │
└──────┬───────┘ └──────────────────┘ └──────┬───────┘ └─────────────────┘
       │ resource_requirement_id              │ activity_id
       │                                      ├──────────────┐
       ▼                                      ▼              ▼
┌──────────────────────────┐        ┌──────────────┐ ┌──────────────────┐
│ job_resource_blocks      │        │job_resource_ │ │job_activity_     │
│                          │        │block_        │ │inventory_        │
└────────────┬─────────────┘        │intervals     │ │adjustments       │
             │ block_id              └──────────────┘ └──────────────────┘
             ▼
┌──────────────────────────┐
│ job_resource_block_      │
│ intervals                │
└──────────────────────────┘
```

## Inventory & Item Management
```
┌─────────────────┐
│   pt_publish_   │
│     items       │ (Item Master)
└────────┬────────┘
         │ item_id
         ├────────────────┬────────────────┬──────────────┐
         ▼                ▼                ▼              ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│   pt_publish_   │ │pt_publish│ │  pt_publish_ │ │  pt_publish_ │
│  inventories    │ │  lots    │ │product_rules │ │pt_attributes │
└────────┬────────┘ └──────────┘ └──────────────┘ └──────────────┘
         │ inventory_id
         ├─────────────────────────────────────┐
         ▼                                     ▼
┌─────────────────────────┐         ┌──────────────────┐
│ All Inventory Adjustment│         │   pt_publish_    │
│       Tables:           │         │purchases_to_stock│
│ - forecast_shipment_    │         └──────────────────┘
│   inventory_adjustments │
│ - job_activity_         │
│   inventory_adjustments │
│ - purchase_to_stock_    │
│   inventory_adjustments │
│ - sales_order_dist_     │
│   inventory_adjustments │
│ - transfer_order_dist_  │
│   inventory_adjustments │
└─────────────────────────┘
```

## Demand Management Flow
```
┌──────────────────┐
│   pt_publish_    │
│    customers     │
└─────────┬────────┘
          │ customer_id
          ▼
┌──────────────────┐         ┌──────────────────┐
│   pt_publish_    │         │   pt_publish_    │
│   sales_orders   │         │    forecasts     │
└─────────┬────────┘         └─────────┬────────┘
          │ sales_order_id             │ forecast_id
          ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│   pt_publish_    │         │   pt_publish_    │
│sales_order_lines │         │forecast_shipments│
└─────────┬────────┘         └──────────────────┘
          │ sales_order_line_id
          ▼
┌────────────────────────┐
│      pt_publish_       │
│sales_order_line_       │
│   distributions        │
└────────┬───────────────┘
         │ sales_order_distribution_id
         ├──────────────────────────────────────┐
         ▼                                      ▼
┌─────────────────────────┐         ┌──────────────────────────┐
│Job Product Demand Tables│         │ Purchase to Stock Demand │
│ - job_product_sales_    │         │ - purchase_to_stock_     │
│   order_demands         │         │   sales_order_demands    │
│ - job_product_forecast_ │         │ - purchase_to_stock_     │
│   demands               │         │   forecast_demands       │
│ - job_product_safety_   │         │ - purchase_to_stock_     │
│   stock_demands         │         │   safety_stock_demands   │
│ - job_product_transfer_ │         │ - purchase_to_stock_     │
│   order_demands         │         │   transfer_order_demands │
│ - job_product_deleted_  │         │ - purchase_to_stock_     │
│   demands               │         │   deleted_demands        │
└─────────────────────────┘         └──────────────────────────┘
```

## Transfer Order Flow
```
┌──────────────────┐
│   pt_publish_    │
│ transfer_orders  │
└─────────┬────────┘
          │ transfer_order_id
          ▼
┌────────────────────────┐
│      pt_publish_       │
│ transfer_order_        │
│   distributions        │
└────────┬───────────────┘
         │ transfer_order_distribution_id
         ├──────────────────────────────────────┐
         ▼                                      ▼
┌─────────────────────────┐         ┌──────────────────────────┐
│    pt_publish_          │         │      pt_publish_         │
│ job_product_transfer_   │         │ purchase_to_stock_       │
│    order_demands        │         │ transfer_order_demands   │
└─────────────────────────┘         └──────────────────────────┘
```

## System & Analytics
```
┌──────────────────┐
│   pt_publish_    │
│    schedules     │ (Published Schedule Metadata)
└──────────────────┘
         │
┌────────┴─────────┐
│                  │
▼                  ▼
┌──────────────┐ ┌──────────────┐
│ pt_publish_  │ │ pt_publish_  │
│   metrics    │ │     kpis     │
└──────────────┘ └──────────────┘

┌──────────────────┐
│   pt_publish_    │
│  report_blocks   │ (Standalone)
└──────────────────┘

┌──────────────────┐
│   pt_publish_    │
│   system_data    │ (Standalone)
└──────────────────┘
```

## Key Relationship Patterns

### 1. **Hierarchical Relationships**
- Jobs → Manufacturing Orders → Operations → Activities
- Plants → Departments → Resources
- Sales Orders → Sales Order Lines → Distributions

### 2. **Many-to-Many Relationships**
- Resources ↔ Capabilities (via resource_capabilities)
- Resources ↔ Capacity Intervals (via capacity_interval_resource_assignments)
- Jobs ↔ Materials (via job_materials)
- Jobs ↔ Products (via job_products)

### 3. **Demand Linking Tables**
- Job Products link to multiple demand sources:
  - Sales Order Demands
  - Forecast Demands
  - Safety Stock Demands
  - Transfer Order Demands
- Same pattern for Purchase to Stock

### 4. **Inventory Adjustment Pattern**
- Multiple tables track inventory adjustments from different sources:
  - Forecast Shipments
  - Job Activities
  - Purchase Orders
  - Sales Orders
  - Transfer Orders

### 5. **Common Foreign Keys**
- `publish_date` + `instance_id` - Present in all tables for multi-tenancy
- `job_id` - Links most manufacturing tables
- `inventory_id` - Links inventory and adjustment tables
- `item_id` - Links item master to various tables
- `resource_id` - Links resource-related tables
- `plant_id` - Links organizational hierarchy

## Data Flow Summary
1. **Jobs** create **Manufacturing Orders**
2. **Manufacturing Orders** have **Operations** and **Paths**
3. **Operations** require **Resources** and **Materials**
4. **Operations** produce **Products**
5. **Activities** execute the **Operations**
6. **Resources** are organized by **Plants** and **Departments**
7. **Demand** comes from **Sales Orders**, **Forecasts**, and **Transfer Orders**
8. **Supply** comes from **Purchase Orders** and **Job Products**
9. **Inventory** tracks balance between supply and demand