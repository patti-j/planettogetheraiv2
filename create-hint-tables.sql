-- Create hint configurations table
CREATE TABLE IF NOT EXISTS hint_configurations (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  target VARCHAR(200),
  page VARCHAR(100),
  position VARCHAR(20) DEFAULT 'auto',
  trigger VARCHAR(20) DEFAULT 'auto',
  delay INTEGER DEFAULT 0,
  sequence INTEGER,
  sequence_group VARCHAR(50),
  prerequisites TEXT,
  conditions TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  show_once BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user hint interactions table
CREATE TABLE IF NOT EXISTS user_hint_interactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  hint_id INTEGER NOT NULL REFERENCES hint_configurations(id),
  status VARCHAR(20) NOT NULL DEFAULT 'unseen',
  seen_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  completed_at TIMESTAMP,
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_hint_idx ON user_hint_interactions(user_id, hint_id);
CREATE INDEX IF NOT EXISTS hint_status_idx ON user_hint_interactions(status);

-- Create hint sequences table
CREATE TABLE IF NOT EXISTS hint_sequences (
  id SERIAL PRIMARY KEY,
  group_name VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  hint_ids TEXT NOT NULL,
  total_steps INTEGER NOT NULL,
  required_completion BOOLEAN DEFAULT false,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial hints
INSERT INTO hint_configurations (key, title, content, type, page, target, position, trigger, priority, is_active) VALUES
  ('welcome_dashboard', 'Welcome to PlanetTogether!', 'This is your main dashboard where you can see an overview of your production operations.', 'info', '/', null, 'center', 'auto', 100, true),
  ('schedule_tip', 'Production Schedule', 'Click here to view and manage your production schedule. You can drag and drop operations to reschedule them.', 'tip', '/schedule', '#schedule-gantt', 'bottom', 'hover', 90, true),
  ('resource_timeline', 'Resource Timeline View', 'This timeline shows all your resources and their scheduled operations. Drag operations to different resources to reassign them.', 'tutorial', '/resource-timeline', '.resource-timeline-container', 'top', 'auto', 85, true),
  ('optimization_button', 'Optimize Schedule', 'Click this button to run the optimization engine with your selected algorithm (ASAP, ALAP, Critical Path, or Resource Leveling).', 'tip', '/resource-timeline', '[data-testid="optimize-button"]', 'left', 'hover', 80, true),
  ('alerts_notification', 'AI Alerts', 'Check here for intelligent alerts about your production. AI analyzes your operations and notifies you of potential issues.', 'info', '/', '[data-testid="alerts-icon"]', 'bottom', 'hover', 75, true)
ON CONFLICT (key) DO NOTHING;