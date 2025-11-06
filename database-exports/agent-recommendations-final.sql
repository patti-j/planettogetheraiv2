-- Final migration for agent_recommendations
-- Using correct agent_type enum values from production

BEGIN;

-- First, create the necessary agent team records with valid enum types
INSERT INTO ai_agent_team (id, user_id, name, agent_type, description, is_active) 
VALUES 
  (1, 1, 'Production Scheduling Agent', 'production_scheduling', 'Optimizes production schedules and resource allocation', true),
  (2, 1, 'Quality Analysis Agent', 'quality_management', 'Analyzes quality metrics and identifies improvements', true),
  (3, 1, 'Predictive Maintenance Agent', 'maintenance_planning', 'Predicts equipment maintenance needs', true),
  (4, 1, 'Shop Floor Agent', 'general_assistant', 'Monitors shop floor operations in real-time', true),
  (5, 1, 'Max AI', 'general_assistant', 'Main AI orchestrator and delegation hub', true)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  agent_type = EXCLUDED.agent_type,
  description = EXCLUDED.description,
  is_active = true;

-- Update sequence to avoid conflicts
SELECT setval('ai_agent_team_id_seq', GREATEST(5, (SELECT MAX(id) FROM ai_agent_team)));

-- Clear any existing recommendations (table is empty but being safe)
TRUNCATE TABLE agent_recommendations CASCADE;

COMMIT;
