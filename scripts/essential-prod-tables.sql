-- Essential tables for production to work
-- Creates in correct order to avoid foreign key issues

-- Dashboards (no foreign keys to non-existent tables)
CREATE TABLE IF NOT EXISTS dashboards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  layout JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  theme VARCHAR(50) DEFAULT 'light',
  refresh_interval INTEGER,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false
);

-- Widgets
CREATE TABLE IF NOT EXISTS widgets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dashboard_id VARCHAR,
  widget_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  configuration JSON,
  position JSON,
  size JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  dashboard_layout JSON,
  default_dashboard_id VARCHAR,
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default dashboard
INSERT INTO dashboards (name, description, is_active, is_public) 
VALUES ('Main Dashboard', 'Default production dashboard', true, true)
ON CONFLICT DO NOTHING;

-- Agent activity tracking (needed by app)
CREATE TABLE IF NOT EXISTS agent_activity_tracking (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(100),
  activity_type VARCHAR(50),
  details JSON,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Max chat messages (needed by app)
CREATE TABLE IF NOT EXISTS max_chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  user_id INTEGER,
  role VARCHAR(50),
  content TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_configuration (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSON,
  description TEXT,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent recommendations
CREATE TABLE IF NOT EXISTS agent_recommendations (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(100),
  category VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  action_data JSON,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- AI agent team
CREATE TABLE IF NOT EXISTS ai_agent_team (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  configuration JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system configuration
INSERT INTO system_configuration (key, value, description, category) VALUES
('scheduler.algorithm', '"ASAP"', 'Default scheduling algorithm', 'scheduler'),
('scheduler.auto_save', 'true', 'Auto-save scheduler changes', 'scheduler'),
('system.theme', '"light"', 'Default system theme', 'ui'),
('system.language', '"en"', 'Default system language', 'ui')
ON CONFLICT DO NOTHING;