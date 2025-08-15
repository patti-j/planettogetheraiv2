-- Rename archived capacity and buffer tables to PT tables
-- This migration renames 6 archived tables to use pt prefix (no underscore) for PT Resources integration

BEGIN;

-- Rename Capacity Tables (2)
ALTER TABLE IF EXISTS archived_capacity_planning_scenarios RENAME TO ptcapacity_planning_scenarios;
ALTER TABLE IF EXISTS archived_capacity_projections RENAME TO ptcapacity_projections;

-- Rename Buffer Tables (4)
ALTER TABLE IF EXISTS archived_buffer_definitions RENAME TO ptbuffer_definitions;
ALTER TABLE IF EXISTS archived_buffer_consumption RENAME TO ptbuffer_consumption;
ALTER TABLE IF EXISTS archived_buffer_management_history RENAME TO ptbuffer_management_history;
ALTER TABLE IF EXISTS archived_buffer_policies RENAME TO ptbuffer_policies;

-- Verify the renaming was successful
SELECT 
  'Renamed Tables' as status,
  COUNT(*) as table_count,
  string_agg(table_name, ', ' ORDER BY table_name) as pt_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'ptcapacity_planning_scenarios',
    'ptcapacity_projections',
    'ptbuffer_definitions',
    'ptbuffer_consumption',
    'ptbuffer_management_history',
    'ptbuffer_policies'
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
COMMENT ON TABLE ptcapacity_planning_scenarios IS 'PT Resources - Capacity planning scenarios for production optimization';
COMMENT ON TABLE ptcapacity_projections IS 'PT Resources - Capacity projections and forecasts';
COMMENT ON TABLE ptbuffer_definitions IS 'PT Resources - Buffer definitions for production flow management';
COMMENT ON TABLE ptbuffer_consumption IS 'PT Resources - Buffer consumption tracking and history';
COMMENT ON TABLE ptbuffer_management_history IS 'PT Resources - Historical buffer management data';
COMMENT ON TABLE ptbuffer_policies IS 'PT Resources - Buffer management policies and rules';