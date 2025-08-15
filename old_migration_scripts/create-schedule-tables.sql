-- Create enums for schedule types and statuses
CREATE TYPE schedule_type AS ENUM ('plant', 'department', 'resource', 'work_center', 'production_line', 'enterprise');
CREATE TYPE schedule_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'active', 'archived', 'superseded');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'on_hold', 'escalated');

-- Main schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Schedule scope
  schedule_type schedule_type NOT NULL,
  scope_id INTEGER,
  scope_name VARCHAR(255),
  
  -- Version control
  version INTEGER NOT NULL DEFAULT 1,
  parent_schedule_id INTEGER REFERENCES schedules(id),
  is_baseline BOOLEAN DEFAULT FALSE,
  
  -- Time horizon
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  schedule_horizon_days INTEGER,
  
  -- Status and workflow
  status schedule_status NOT NULL DEFAULT 'draft',
  approval_status approval_status DEFAULT 'pending',
  
  -- Metadata
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_by INTEGER,
  modified_at TIMESTAMP DEFAULT NOW(),
  approved_by INTEGER,
  approved_at TIMESTAMP,
  published_at TIMESTAMP,
  
  -- Performance metrics
  utilization_rate REAL,
  efficiency_score REAL,
  on_time_delivery_rate REAL,
  
  -- Additional settings
  parameters JSONB,
  metadata JSONB
);

-- Create indexes for schedules
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_type ON schedules(schedule_type);
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX idx_schedules_scope ON schedules(scope_id);

-- Schedule assignments table
CREATE TABLE IF NOT EXISTS schedule_assignments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  
  -- What is being scheduled
  assignment_type VARCHAR(50) NOT NULL,
  assignment_id INTEGER NOT NULL,
  assignment_name VARCHAR(255),
  
  -- Resource assignment
  resource_id INTEGER,
  resource_name VARCHAR(255),
  alternate_resource_id INTEGER,
  
  -- Timing
  planned_start_time TIMESTAMP NOT NULL,
  planned_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  
  -- Quantities and durations
  planned_duration INTEGER,
  actual_duration INTEGER,
  planned_quantity DECIMAL(15, 3),
  actual_quantity DECIMAL(15, 3),
  
  -- Sequencing and priority
  sequence_number INTEGER,
  priority INTEGER DEFAULT 5,
  is_locked BOOLEAN DEFAULT FALSE,
  is_manually_scheduled BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled',
  completion_percentage REAL DEFAULT 0,
  
  -- Constraints and dependencies
  predecessors JSONB,
  successors JSONB,
  constraints JSONB,
  
  -- Additional data
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for schedule_assignments
CREATE INDEX idx_schedule_assignments_schedule ON schedule_assignments(schedule_id);
CREATE INDEX idx_schedule_assignments_resource ON schedule_assignments(resource_id);
CREATE INDEX idx_schedule_assignments_dates ON schedule_assignments(planned_start_time, planned_end_time);
CREATE INDEX idx_schedule_assignments_type ON schedule_assignments(assignment_type, assignment_id);

-- Schedule comparisons table
CREATE TABLE IF NOT EXISTS schedule_comparisons (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comparison_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  
  base_schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  compare_schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  
  -- Comparison metrics
  total_changes INTEGER,
  resource_changes INTEGER,
  timing_changes INTEGER,
  sequence_changes INTEGER,
  
  -- Performance differences
  utilization_delta REAL,
  efficiency_delta REAL,
  on_time_delta REAL,
  
  -- Comparison details
  comparison_data JSONB,
  highlights JSONB,
  
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  metadata JSONB
);

-- Create indexes for schedule_comparisons
CREATE INDEX idx_comparisons_schedules ON schedule_comparisons(base_schedule_id, compare_schedule_id);

-- Schedule discussions table
CREATE TABLE IF NOT EXISTS schedule_discussions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  
  -- Discussion thread
  parent_discussion_id INTEGER REFERENCES schedule_discussions(id),
  thread_id VARCHAR(50),
  
  -- Content
  user_id INTEGER NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(100),
  
  message TEXT NOT NULL,
  attachments JSONB,
  
  -- Context
  context_type VARCHAR(50),
  context_id INTEGER,
  context_data JSONB,
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INTEGER,
  resolved_at TIMESTAMP,
  
  -- Mentions and notifications
  mentions JSONB,
  is_announcement BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  
  metadata JSONB
);

-- Create indexes for schedule_discussions
CREATE INDEX idx_discussions_schedule ON schedule_discussions(schedule_id);
CREATE INDEX idx_discussions_user ON schedule_discussions(user_id);
CREATE INDEX idx_discussions_thread ON schedule_discussions(thread_id);
CREATE INDEX idx_discussions_context ON schedule_discussions(context_type, context_id);

-- Schedule approvals table
CREATE TABLE IF NOT EXISTS schedule_approvals (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  
  -- Approval level and sequence
  approval_level INTEGER NOT NULL,
  approval_sequence INTEGER,
  
  -- Approver details
  approver_id INTEGER NOT NULL,
  approver_name VARCHAR(255),
  approver_role VARCHAR(100),
  delegated_to INTEGER,
  
  -- Status and decision
  status approval_status NOT NULL DEFAULT 'pending',
  decision VARCHAR(50),
  comments TEXT,
  conditions TEXT,
  
  -- Timing
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  due_date TIMESTAMP,
  escalated_at TIMESTAMP,
  
  -- Additional data
  attachments JSONB,
  metadata JSONB,
  
  UNIQUE(schedule_id, approver_id, approval_level)
);

-- Create indexes for schedule_approvals
CREATE INDEX idx_approvals_schedule ON schedule_approvals(schedule_id);
CREATE INDEX idx_approvals_approver ON schedule_approvals(approver_id);
CREATE INDEX idx_approvals_status ON schedule_approvals(status);

-- Schedule snapshots table
CREATE TABLE IF NOT EXISTS schedule_snapshots (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  
  snapshot_code VARCHAR(50) UNIQUE,
  snapshot_type VARCHAR(50),
  description TEXT,
  
  -- Snapshot data
  schedule_data JSONB NOT NULL,
  assignments_data JSONB NOT NULL,
  metrics_data JSONB,
  
  -- Versioning
  version INTEGER,
  is_baseline BOOLEAN DEFAULT FALSE,
  
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  metadata JSONB
);

-- Create indexes for schedule_snapshots
CREATE INDEX idx_snapshots_schedule ON schedule_snapshots(schedule_id);
CREATE INDEX idx_snapshots_created ON schedule_snapshots(created_at);

-- Schedule subscriptions table
CREATE TABLE IF NOT EXISTS schedule_subscriptions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  user_id INTEGER NOT NULL,
  
  -- Subscription preferences
  notify_on_changes BOOLEAN DEFAULT TRUE,
  notify_on_approval BOOLEAN DEFAULT TRUE,
  notify_on_publish BOOLEAN DEFAULT TRUE,
  notify_on_discussion BOOLEAN DEFAULT FALSE,
  
  -- Notification settings
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  digest_frequency VARCHAR(50),
  
  subscribed_at TIMESTAMP DEFAULT NOW(),
  last_notified_at TIMESTAMP,
  
  metadata JSONB,
  
  UNIQUE(schedule_id, user_id)
);

-- Create indexes for schedule_subscriptions
CREATE INDEX idx_subscriptions_schedule ON schedule_subscriptions(schedule_id);
CREATE INDEX idx_subscriptions_user ON schedule_subscriptions(user_id);