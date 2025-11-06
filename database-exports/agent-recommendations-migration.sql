-- Migration for agent_recommendations table
BEGIN;

-- First ensure ai_agent_team has necessary records
-- We'll insert dummy agent records that can be referenced
INSERT INTO ai_agent_team (id, name, role, description, capabilities) 
VALUES 
  (1, 'Production Scheduling Agent', 'scheduler', 'Optimizes production schedules', '["scheduling", "optimization"]'::jsonb),
  (2, 'Quality Analysis Agent', 'quality', 'Analyzes quality metrics', '["quality", "analysis"]'::jsonb),
  (3, 'Predictive Maintenance Agent', 'maintenance', 'Predicts equipment maintenance needs', '["maintenance", "prediction"]'::jsonb),
  (4, 'Shop Floor Agent', 'shop_floor', 'Monitors shop floor operations', '["monitoring", "alerts"]'::jsonb),
  (5, 'Max AI', 'orchestrator', 'Main AI orchestrator', '["orchestration", "delegation"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Save the current sequence value
SELECT setval('agent_recommendations_id_seq', COALESCE(MAX(id), 1)) FROM agent_recommendations;

-- Clear existing data (it's empty but being safe)
TRUNCATE TABLE agent_recommendations CASCADE;

-- Table structure already matches development schema, so we can import directly

COMMIT;
