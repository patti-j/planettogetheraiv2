-- Rename archived capacity and buffer tables to PT tables
-- This migration renames 6 archived tables to use pt_ prefix for PT Resources integration

BEGIN;

-- Rename Capacity Tables (2)
ALTER TABLE IF EXISTS archived_capacity_planning_scenarios RENAME TO pt_capacity_planning_scenarios;
ALTER TABLE IF EXISTS archived_capacity_projections RENAME TO pt_capacity_projections;

-- Rename Buffer Tables (4)
ALTER TABLE IF EXISTS archived_buffer_definitions RENAME TO pt_buffer_definitions;
ALTER TABLE IF EXISTS archived_buffer_consumption RENAME TO pt_buffer_consumption;
ALTER TABLE IF EXISTS archived_buffer_management_history RENAME TO pt_buffer_management_history;
ALTER TABLE IF EXISTS archived_buffer_policies RENAME TO pt_buffer_policies;

-- Verify the renaming was successful
SELECT 
  'Renamed Tables' as status,
  COUNT(*) as table_count,
  string_agg(table_name, ', ' ORDER BY table_name) as pt_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'pt_capacity_planning_scenarios',
    'pt_capacity_projections',
    'pt_buffer_definitions',
    'pt_buffer_consumption',
    'pt_buffer_management_history',
    'pt_buffer_policies'
  );

-- Check if any archived_ tables still exist that shouldn't
SELECT 
  'Remaining Archived Tables' as status,
  COUNT(*) as table_count,
  string_agg(table_name, ', ' ORDER BY table_name) as archived_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'archived_capacity_planning_scenarios',
    'archived_capacity_projections',
    'archived_buffer_definitions',
    'archived_buffer_consumption',
    'archived_buffer_management_history',
    'archived_buffer_policies'
  );

COMMIT;

-- Add comments to the renamed tables
COMMENT ON TABLE pt_capacity_planning_scenarios IS 'PT Resources - Capacity planning scenarios for production optimization';
COMMENT ON TABLE pt_capacity_projections IS 'PT Resources - Capacity projections and forecasts';
COMMENT ON TABLE pt_buffer_definitions IS 'PT Resources - Buffer definitions for production flow management';
COMMENT ON TABLE pt_buffer_consumption IS 'PT Resources - Buffer consumption tracking and history';
COMMENT ON TABLE pt_buffer_management_history IS 'PT Resources - Historical buffer management data';
COMMENT ON TABLE pt_buffer_policies IS 'PT Resources - Buffer management policies and rules';