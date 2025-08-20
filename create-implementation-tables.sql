-- Create implementation_projects table
CREATE TABLE IF NOT EXISTS implementation_projects (
    id SERIAL PRIMARY KEY,
    company_onboarding_id INTEGER REFERENCES company_onboarding(id),
    project_name TEXT NOT NULL,
    project_code TEXT UNIQUE,
    client_company TEXT NOT NULL,
    implementation_partner TEXT,
    project_manager TEXT,
    technical_lead TEXT,
    project_type TEXT NOT NULL, -- full_implementation, migration, upgrade, pilot
    scope TEXT,
    estimated_duration INTEGER, -- in days
    actual_duration INTEGER,
    kickoff_date TIMESTAMP,
    target_go_live_date TIMESTAMP,
    actual_go_live_date TIMESTAMP,
    status TEXT DEFAULT 'planning', -- planning, in_progress, on_hold, completed, cancelled
    health_status TEXT DEFAULT 'green', -- green, yellow, red
    risk_level TEXT DEFAULT 'low', -- low, medium, high, critical
    completion_percentage INTEGER DEFAULT 0,
    budget_amount DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    selected_modules JSONB DEFAULT '[]',
    customizations JSONB DEFAULT '[]',
    integrations JSONB DEFAULT '[]',
    ai_insights JSONB,
    last_ai_analysis TIMESTAMP,
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_phases table
CREATE TABLE IF NOT EXISTS implementation_phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    phase_name TEXT NOT NULL,
    phase_order INTEGER NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- in days
    actual_duration INTEGER,
    planned_start_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    planned_end_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, blocked
    completion_percentage INTEGER DEFAULT 0,
    assigned_team JSONB DEFAULT '[]',
    deliverables JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',
    blockers TEXT,
    signoff_required BOOLEAN DEFAULT false,
    signoff_by TEXT,
    signoff_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_sops table
CREATE TABLE IF NOT EXISTS implementation_sops (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id),
    sop_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT, -- configuration, training, testing, deployment, documentation
    description TEXT,
    document_url TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft', -- draft, in_review, approved, active, deprecated
    assigned_to TEXT,
    reviewed_by TEXT,
    approved_by TEXT,
    effective_date TIMESTAMP,
    expiry_date TIMESTAMP,
    dependencies JSONB DEFAULT '[]',
    checklist_items JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    ai_generated BOOLEAN DEFAULT false,
    ai_suggestions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_documents table
CREATE TABLE IF NOT EXISTS implementation_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id),
    phase_id INTEGER REFERENCES implementation_phases(id),
    sop_id INTEGER REFERENCES implementation_sops(id),
    document_type TEXT NOT NULL, -- requirements, design, test_plan, training_material, report
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft', -- draft, in_review, approved, final
    uploaded_by INTEGER REFERENCES users(id),
    tags JSONB DEFAULT '[]',
    access_control JSONB DEFAULT '{"public": false, "roles": []}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_tasks table
CREATE TABLE IF NOT EXISTS implementation_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    phase_id INTEGER REFERENCES implementation_phases(id),
    task_code TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT, -- configuration, development, testing, training, documentation
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, blocked, cancelled
    assigned_to TEXT,
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    planned_start TIMESTAMP,
    actual_start TIMESTAMP,
    planned_end TIMESTAMP,
    actual_end TIMESTAMP,
    completion_percentage INTEGER DEFAULT 0,
    dependencies JSONB DEFAULT '[]',
    blockers TEXT,
    comments TEXT,
    attachments JSONB DEFAULT '[]',
    ai_difficulty_score DECIMAL(3, 2),
    ai_recommendations TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_issues table
CREATE TABLE IF NOT EXISTS implementation_issues (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    phase_id INTEGER REFERENCES implementation_phases(id),
    task_id INTEGER REFERENCES implementation_tasks(id),
    issue_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- bug, change_request, risk, dependency, resource
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed, escalated
    reported_by TEXT,
    assigned_to TEXT,
    resolution TEXT,
    impact_analysis TEXT,
    workaround TEXT,
    root_cause TEXT,
    preventive_measures TEXT,
    detected_date TIMESTAMP DEFAULT NOW(),
    resolved_date TIMESTAMP,
    escalated_date TIMESTAMP,
    ai_suggested_solution TEXT,
    ai_impact_assessment JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_timelines table
CREATE TABLE IF NOT EXISTS implementation_timelines (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    version TEXT NOT NULL,
    timeline_data JSONB NOT NULL, -- Store full timeline configuration
    is_baseline BOOLEAN DEFAULT false,
    is_current BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    approved_by TEXT,
    approval_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_team_members table
CREATE TABLE IF NOT EXISTS implementation_team_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    external_member_name TEXT,
    email TEXT,
    role TEXT NOT NULL, -- project_manager, technical_lead, developer, tester, trainer, consultant
    organization TEXT, -- client, partner, vendor
    allocation_percentage INTEGER DEFAULT 100,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    skills JSONB DEFAULT '[]',
    responsibilities TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_communications table
CREATE TABLE IF NOT EXISTS implementation_communications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    communication_type TEXT NOT NULL, -- email, meeting, call, chat, report
    subject TEXT NOT NULL,
    content TEXT,
    participants JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    meeting_minutes TEXT,
    action_items JSONB DEFAULT '[]',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    communication_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create implementation_milestones table
CREATE TABLE IF NOT EXISTS implementation_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES implementation_projects(id) NOT NULL,
    milestone_name TEXT NOT NULL,
    description TEXT,
    target_date TIMESTAMP NOT NULL,
    actual_date TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, achieved, missed, at_risk
    success_criteria JSONB DEFAULT '[]',
    deliverables JSONB DEFAULT '[]',
    signoff_required BOOLEAN DEFAULT true,
    signoff_by TEXT,
    signoff_date TIMESTAMP,
    impact_if_missed TEXT,
    contingency_plan TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_implementation_projects_status ON implementation_projects(status);
CREATE INDEX IF NOT EXISTS idx_implementation_projects_company ON implementation_projects(client_company);
CREATE INDEX IF NOT EXISTS idx_implementation_phases_project ON implementation_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_implementation_tasks_project ON implementation_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_implementation_issues_project ON implementation_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_implementation_documents_project ON implementation_documents(project_id);