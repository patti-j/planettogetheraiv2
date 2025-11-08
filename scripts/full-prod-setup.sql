-- Full production database schema setup
-- This creates ALL tables needed for PlanetTogether application

-- Drop existing tables if needed (careful in production)
-- Uncomment only if you need to recreate from scratch

-- Core auth tables (already created, but included for completeness)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  active_role_id INTEGER REFERENCES roles(id),
  last_login TIMESTAMP,
  avatar TEXT,
  job_title VARCHAR(100),
  department VARCHAR(100),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  feature VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (role_id, permission_id)
);

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Dashboard and widgets tables
CREATE TABLE IF NOT EXISTS dashboards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  layout JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  theme VARCHAR(50) DEFAULT 'light',
  refresh_interval INTEGER,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS widgets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dashboard_id VARCHAR REFERENCES dashboards(id) ON DELETE CASCADE,
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
  user_id INTEGER UNIQUE REFERENCES users(id),
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  dashboard_layout JSON,
  default_dashboard_id VARCHAR REFERENCES dashboards(id),
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduler tables (critical for production scheduler)
CREATE TABLE IF NOT EXISTS ptjobs (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  product_id VARCHAR(50),
  quantity DECIMAL(12, 2),
  priority INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptactivities (
  id VARCHAR PRIMARY KEY,
  activity_id VARCHAR(50) UNIQUE NOT NULL,
  job_id VARCHAR REFERENCES ptjobs(id),
  operation_id VARCHAR(50),
  resource_id VARCHAR(50),
  description VARCHAR(255),
  sequence_number INTEGER,
  setup_time DECIMAL(8, 2) DEFAULT 0,
  run_time DECIMAL(8, 2) DEFAULT 0,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptresources (
  id VARCHAR PRIMARY KEY,
  resource_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  resource_type VARCHAR(50),
  capacity DECIMAL(10, 2) DEFAULT 1,
  efficiency DECIMAL(5, 2) DEFAULT 100,
  cost_per_hour DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  department VARCHAR(100),
  location VARCHAR(100),
  calendar_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptoperations (
  id VARCHAR PRIMARY KEY,
  operation_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  operation_type VARCHAR(50),
  setup_time DECIMAL(8, 2) DEFAULT 0,
  run_time DECIMAL(8, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptproducts (
  id VARCHAR PRIMARY KEY,
  product_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  product_type VARCHAR(50),
  unit_of_measure VARCHAR(20),
  standard_cost DECIMAL(12, 4),
  list_price DECIMAL(12, 4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptmaterials (
  id VARCHAR PRIMARY KEY,
  material_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  material_type VARCHAR(50),
  unit_of_measure VARCHAR(20),
  on_hand_quantity DECIMAL(12, 2) DEFAULT 0,
  available_quantity DECIMAL(12, 2) DEFAULT 0,
  reorder_point DECIMAL(12, 2),
  reorder_quantity DECIMAL(12, 2),
  lead_time_days INTEGER,
  cost_per_unit DECIMAL(12, 4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptcalendars (
  id VARCHAR PRIMARY KEY,
  calendar_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  time_zone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptdemand (
  id VARCHAR PRIMARY KEY,
  demand_id VARCHAR(50) UNIQUE NOT NULL,
  product_id VARCHAR REFERENCES ptproducts(id),
  customer_id VARCHAR(50),
  order_number VARCHAR(50),
  quantity DECIMAL(12, 2) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  priority INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduling version control
CREATE TABLE IF NOT EXISTS scheduler_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(255) NOT NULL,
  description TEXT,
  snapshot_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT false,
  job_count INTEGER,
  resource_count INTEGER,
  total_duration DECIMAL(10, 2),
  utilization_percentage DECIMAL(5, 2)
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

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  permissions JSON,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Monitoring and metrics
CREATE TABLE IF NOT EXISTS production_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(12, 4),
  unit VARCHAR(20),
  resource_id VARCHAR(50),
  job_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id SERIAL PRIMARY KEY,
  kpi_name VARCHAR(100) NOT NULL,
  target_value DECIMAL(12, 4),
  actual_value DECIMAL(12, 4),
  unit VARCHAR(20),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ptjobs_status ON ptjobs(status);
CREATE INDEX IF NOT EXISTS idx_ptjobs_scheduled_start ON ptjobs(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_ptactivities_job_id ON ptactivities(job_id);
CREATE INDEX IF NOT EXISTS idx_ptactivities_resource_id ON ptactivities(resource_id);
CREATE INDEX IF NOT EXISTS idx_ptactivities_scheduled_start ON ptactivities(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_production_metrics_timestamp ON production_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON widgets(dashboard_id);

-- Seed initial data for Administrator role (if not exists)
INSERT INTO roles (name, description, is_active, is_system_role) 
VALUES ('Administrator', 'Full system access', true, true)
ON CONFLICT (name) DO NOTHING;

-- Basic permissions
INSERT INTO permissions (name, feature, action, description) VALUES
('dashboard:view', 'dashboard', 'view', 'View dashboard'),
('dashboard:create', 'dashboard', 'create', 'Create dashboard'),
('dashboard:update', 'dashboard', 'update', 'Update dashboard'),
('dashboard:delete', 'dashboard', 'delete', 'Delete dashboard'),
('production:view', 'production', 'view', 'View production'),
('production:create', 'production', 'create', 'Create production'),
('production:update', 'production', 'update', 'Update production'),
('production:delete', 'production', 'delete', 'Delete production')
ON CONFLICT DO NOTHING;

-- Default system configuration
INSERT INTO system_configuration (key, value, description, category) VALUES
('scheduler.algorithm', '"ASAP"', 'Default scheduling algorithm', 'scheduler'),
('scheduler.auto_save', 'true', 'Auto-save scheduler changes', 'scheduler'),
('system.theme', '"light"', 'Default system theme', 'ui'),
('system.language', '"en"', 'Default system language', 'ui')
ON CONFLICT DO NOTHING;