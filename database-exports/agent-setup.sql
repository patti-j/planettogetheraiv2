-- Setup necessary agent records
BEGIN;

-- First, check what agent_type enum values exist
SELECT unnest(enum_range(NULL::agent_type));

-- Insert agent team records for each unique agent_id we'll need
-- Using user_id 1 (admin) for all agents
INSERT INTO ai_agent_team (id, user_id, name, agent_type, description, is_active) 
VALUES 
  (1, 1, 'Production Scheduling Agent', 'planner', 'Optimizes production schedules and resource allocation', true),
  (2, 1, 'Quality Analysis Agent', 'analyst', 'Analyzes quality metrics and identifies improvements', true),
  (3, 1, 'Predictive Maintenance Agent', 'analyst', 'Predicts equipment maintenance needs', true),
  (4, 1, 'Shop Floor Agent', 'executor', 'Monitors shop floor operations in real-time', true),
  (5, 1, 'Max AI', 'orchestrator', 'Main AI orchestrator and delegation hub', true)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- Update sequence to avoid conflicts
SELECT setval('ai_agent_team_id_seq', GREATEST(5, (SELECT MAX(id) FROM ai_agent_team)));

COMMIT;
