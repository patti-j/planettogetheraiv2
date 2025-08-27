-- Create time tracking tables

-- Time Clock Entries - Main table for tracking clock in/out
CREATE TABLE IF NOT EXISTS time_clock_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  operation_id INTEGER,
  job_id INTEGER,
  clock_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  clock_out_time TIMESTAMP,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(10, 2),
  hourly_rate DECIMAL(10, 2),
  labor_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  location VARCHAR(255),
  shift_type VARCHAR(50),
  overtime_hours DECIMAL(10, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP
);

-- Team Clock Entries - For team/group clock in
CREATE TABLE IF NOT EXISTS team_clock_entries (
  id SERIAL PRIMARY KEY,
  supervisor_id INTEGER NOT NULL REFERENCES users(id),
  operation_id INTEGER NOT NULL,
  job_id INTEGER,
  team_name VARCHAR(255),
  team_members JSONB NOT NULL,
  clock_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  clock_out_time TIMESTAMP,
  total_team_hours DECIMAL(10, 2),
  total_labor_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team Member Clock Details - Individual records for team members
CREATE TABLE IF NOT EXISTS team_member_clock_details (
  id SERIAL PRIMARY KEY,
  team_clock_entry_id INTEGER NOT NULL REFERENCES team_clock_entries(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  clock_in_time TIMESTAMP NOT NULL,
  clock_out_time TIMESTAMP,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(10, 2),
  hourly_rate DECIMAL(10, 2),
  labor_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT
);

-- Labor Cost Summary - Aggregated labor costs by job/operation
CREATE TABLE IF NOT EXISTS labor_cost_summary (
  id SERIAL PRIMARY KEY,
  job_id INTEGER,
  operation_id INTEGER,
  date TIMESTAMP NOT NULL,
  total_hours DECIMAL(10, 2) NOT NULL,
  regular_hours DECIMAL(10, 2),
  overtime_hours DECIMAL(10, 2),
  total_labor_cost DECIMAL(10, 2) NOT NULL,
  regular_cost DECIMAL(10, 2),
  overtime_cost DECIMAL(10, 2),
  employee_count INTEGER,
  average_hourly_rate DECIMAL(10, 2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_clock_user ON time_clock_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_operation ON time_clock_entries(operation_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_status ON time_clock_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON time_clock_entries(clock_in_time);

CREATE INDEX IF NOT EXISTS idx_team_clock_supervisor ON team_clock_entries(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_team_clock_operation ON team_clock_entries(operation_id);
CREATE INDEX IF NOT EXISTS idx_team_clock_status ON team_clock_entries(status);

CREATE INDEX IF NOT EXISTS idx_team_member_entry ON team_member_clock_details(team_clock_entry_id);
CREATE INDEX IF NOT EXISTS idx_team_member_user ON team_member_clock_details(user_id);

CREATE INDEX IF NOT EXISTS idx_labor_cost_job ON labor_cost_summary(job_id);
CREATE INDEX IF NOT EXISTS idx_labor_cost_operation ON labor_cost_summary(operation_id);
CREATE INDEX IF NOT EXISTS idx_labor_cost_date ON labor_cost_summary(date);

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON time_clock_entries TO your_user;
-- GRANT ALL PRIVILEGES ON team_clock_entries TO your_user;
-- GRANT ALL PRIVILEGES ON team_member_clock_details TO your_user;
-- GRANT ALL PRIVILEGES ON labor_cost_summary TO your_user;