-- Archive old manufacturing tables by renaming them with 'archived_' prefix
-- This preserves data while clearly marking tables as obsolete
-- Run date: 2025-08-15

BEGIN;

-- Core Manufacturing Tables (Replaced by PT tables)
ALTER TABLE IF EXISTS production_orders RENAME TO archived_production_orders;
ALTER TABLE IF EXISTS operations RENAME TO archived_operations;
ALTER TABLE IF EXISTS resources RENAME TO archived_resources;
ALTER TABLE IF EXISTS discrete_operations RENAME TO archived_discrete_operations;
ALTER TABLE IF EXISTS process_operations RENAME TO archived_process_operations;
ALTER TABLE IF EXISTS work_centers RENAME TO archived_work_centers;

-- Recipe/Routing Tables (Replaced by PT tables)
ALTER TABLE IF EXISTS recipe_operations RENAME TO archived_recipe_operations;
ALTER TABLE IF EXISTS recipe_phases RENAME TO archived_recipe_phases;
ALTER TABLE IF EXISTS routing_operations RENAME TO archived_routing_operations;
ALTER TABLE IF EXISTS routings RENAME TO archived_routings;

-- Planning Tables (Replaced by PT tables)
ALTER TABLE IF EXISTS demand_forecasts RENAME TO archived_demand_forecasts;
ALTER TABLE IF EXISTS material_requirements RENAME TO archived_material_requirements;
ALTER TABLE IF EXISTS planned_orders RENAME TO archived_planned_orders;
ALTER TABLE IF EXISTS production_versions RENAME TO archived_production_versions;

-- BOM Tables (if they exist)
ALTER TABLE IF EXISTS bills_of_material RENAME TO archived_bills_of_material;
ALTER TABLE IF EXISTS bom_lines RENAME TO archived_bom_lines;
ALTER TABLE IF EXISTS bom_material_requirements RENAME TO archived_bom_material_requirements;
ALTER TABLE IF EXISTS bom_product_outputs RENAME TO archived_bom_product_outputs;

-- Formula Tables (if they exist)
ALTER TABLE IF EXISTS formulas RENAME TO archived_formulas;
ALTER TABLE IF EXISTS formula_ingredients RENAME TO archived_formula_ingredients;

-- Operation Management Tables (if they exist)
ALTER TABLE IF EXISTS operation_dependencies RENAME TO archived_operation_dependencies;
ALTER TABLE IF EXISTS operation_resources RENAME TO archived_operation_resources;
ALTER TABLE IF EXISTS operation_transitions RENAME TO archived_operation_transitions;

-- Quality Tables (if they exist)
ALTER TABLE IF EXISTS quality_specs RENAME TO archived_quality_specs;
ALTER TABLE IF EXISTS quality_tests RENAME TO archived_quality_tests;
ALTER TABLE IF EXISTS quality_results RENAME TO archived_quality_results;
ALTER TABLE IF EXISTS inspection_plans RENAME TO archived_inspection_plans;
ALTER TABLE IF EXISTS inspection_results RENAME TO archived_inspection_results;

-- Inventory/Stock Tables (if they exist)
ALTER TABLE IF EXISTS inventory_transactions RENAME TO archived_inventory_transactions;
ALTER TABLE IF EXISTS stock_locations RENAME TO archived_stock_locations;
ALTER TABLE IF EXISTS stock_movements RENAME TO archived_stock_movements;

-- Scheduling Tables (if they exist)
ALTER TABLE IF EXISTS production_schedules RENAME TO archived_production_schedules;
ALTER TABLE IF EXISTS schedule_entries RENAME TO archived_schedule_entries;
ALTER TABLE IF EXISTS schedule_conflicts RENAME TO archived_schedule_conflicts;

-- Capacity/Buffer Tables (if they exist)
ALTER TABLE IF EXISTS capacity_groups RENAME TO archived_capacity_groups;
ALTER TABLE IF EXISTS capacity_profiles RENAME TO archived_capacity_profiles;
ALTER TABLE IF EXISTS capacity_requirements RENAME TO archived_capacity_requirements;
ALTER TABLE IF EXISTS capacity_planning_scenarios RENAME TO archived_capacity_planning_scenarios;
ALTER TABLE IF EXISTS capacity_projections RENAME TO archived_capacity_projections;

ALTER TABLE IF EXISTS buffer_definitions RENAME TO archived_buffer_definitions;
ALTER TABLE IF EXISTS buffer_consumption RENAME TO archived_buffer_consumption;
ALTER TABLE IF EXISTS buffer_management_history RENAME TO archived_buffer_management_history;
ALTER TABLE IF EXISTS buffer_policies RENAME TO archived_buffer_policies;

-- Manufacturing-related tables that may still be in use (review before archiving)
-- These are commented out for safety - uncomment if you're sure they're not needed
-- ALTER TABLE IF EXISTS capabilities RENAME TO archived_capabilities;
-- ALTER TABLE IF EXISTS available_to_promise RENAME TO archived_available_to_promise;

COMMIT;

-- Verify archival
SELECT 
  COUNT(*) as archived_count,
  string_agg(table_name, ', ' ORDER BY table_name) as archived_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'archived_%';