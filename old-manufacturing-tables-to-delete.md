# Old Manufacturing Tables to Delete

## Overview
These are the old manufacturing tables that will be deleted once migration to PT Publish tables is complete. App-specific tables (users, roles, dashboards, etc.) are NOT included in this list.

## Tables to Delete (Grouped by Function)

### 1. Core Production Management
- **production_orders** → replaced by `pt_publish_jobs`
- **operations** → replaced by `pt_publish_job_operations`
- **planned_orders** → replaced by `pt_publish_planned_orders`
- **planned_order_production_orders** → junction table, no longer needed
- **master_production_schedule** → replaced by PT planning tables

### 2. Resources & Capabilities
- **resources** → replaced by `pt_publish_resources`
- **capabilities** → ✅ DELETED (replaced by `ptcapabilities`)
- **plants** → replaced by `pt_publish_plants`
- **plant_resources** → replaced by PT resource-plant relationships
- **plant_algorithm_deployments** → plant-specific, needs migration

### 3. Operation Types
- **discrete_operations** → replaced by `pt_publish_job_activities`
- **discrete_operation_phases** → replaced by PT activity phases
- **discrete_operation_phase_relationships** → ✅ DELETED (replaced by PT relationships)
- **discrete_operation_phase_resource_requirements** → replaced by PT resource requirements
- **process_operations** → replaced by `pt_publish_job_activities` with activity_type
- **operation_status_reports** → replaced by PT status tracking

### 4. Work Centers & Routings
- **work_centers** → replaced by `pt_publish_work_centers`
- **work_center_resources** → replaced by PT work center relationships
- **routings** → replaced by `pt_publish_routings`
- **routing_operations** → replaced by `pt_publish_routing_operations`

### 5. Recipe Management (Process Manufacturing)
- **recipes** → replaced by `pt_publish_recipes`
- **recipe_phases** → replaced by PT recipe structures
- **recipe_phase_relationships** → replaced by PT relationships
- **recipe_operations** → replaced by PT recipe operations
- **recipe_operation_relationships** → replaced by PT relationships
- **recipe_material_assignments** → replaced by PT material assignments
- **recipe_formulas** → replaced by PT formulations
- **recipe_product_outputs** → replaced by PT outputs
- **recipe_equipment** → replaced by PT equipment assignments

### 6. Production Versions
- **production_versions** → replaced by PT production versions
- **production_version_phase_bom_product_outputs** → replaced by PT structures
- **production_version_phase_formulation_details** → replaced by PT formulations
- **production_version_phase_material_requirements** → replaced by PT requirements
- **production_version_phase_recipe_product_outputs** → replaced by PT outputs

### 7. Bills of Material
- **bills_of_material** → replaced by `pt_publish_boms`
- **bom_lines** → replaced by `pt_publish_bom_lines`
- **bom_material_requirements** → replaced by PT material requirements
- **bom_product_outputs** → replaced by PT product outputs

### 8. Inventory & Stock Management
- **inventory** → replaced by `pt_publish_inventory`
- **inventory_lots** → replaced by PT lot tracking
- **stock_items** → replaced by PT stock management
- **stock_balances** → replaced by PT balances
- **stocks** → replaced by PT stock tables
- **stock_transactions** → replaced by PT transactions
- **stock_optimization_scenarios** → replaced by PT optimization

### 9. Resource Planning
- **resource_requirements** → replaced by PT resource requirements
- **resource_requirement_assignments** → replaced by PT assignments
- **resource_requirement_blocks** → replaced by PT blocks
- **resource_allocations** → replaced by PT allocations
- **resource_absences** → replaced by PT absence tracking
- **resource_shift_assignments** → replaced by PT shift management
- **resource_views** → replaced by PT resource views
- **department_resources** → replaced by PT department relationships
- **user_resource_assignments** → may need to keep for user-resource mapping

### 10. Forecasting & Planning
- **forecasts** → replaced by `pt_publish_forecasts`
- **demand_forecasts** → replaced by PT demand planning
- **sales_forecasts** → replaced by PT sales forecasting
- **material_requirements** → replaced by PT MRP tables

### 11. Production Support
- **production_plans** → replaced by PT planning tables
- **production_targets** → replaced by PT target management
- **production_milestones** → replaced by PT milestone tracking
- **scenario_operations** → replaced by PT scenario planning
- **unplanned_downtime** → replaced by PT downtime tracking

### 12. Material Management
- **formulations** → replaced by PT formulations
- **formulation_details** → replaced by PT formulation details
- **items** → replaced by `pt_publish_items` (product master)
- **vendors** → replaced by `pt_publish_vendors`

## Summary Statistics
- **Total tables to delete:** 67
- **Core production tables:** 5
- **Resource & capacity tables:** 14
- **Recipe/process tables:** 9
- **BOM tables:** 4
- **Inventory tables:** 7
- **Planning tables:** 4

## Migration Notes
1. All data from these tables must be migrated to PT Publish tables before deletion
2. Foreign key relationships need to be updated to point to PT tables
3. Application code must be updated to use PT table queries
4. Backup all data before deletion
5. Some junction tables (like user_resource_assignments) may need special consideration if they link to app-specific tables

## Tables NOT Being Deleted (App-Specific)
These tables are NOT manufacturing-specific and will remain:
- User management: users, roles, permissions, user_roles
- UI/UX: dashboards, widgets, canvas_*, cockpit_*
- Communication: chat_*, notifications, alerts, comments
- System: system_*, api_*, integration_*
- AI features: ai_*, algorithm_*
- Workflow engine: workflows, workflow_* (app workflows, not manufacturing)
- Business features: customers, billing_*, feedback_*
- Analytics: kpi_*, smart_kpi_*, reports