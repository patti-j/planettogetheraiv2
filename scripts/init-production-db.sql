-- Create basic auth tables for production
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

-- Create Administrator role
INSERT INTO roles (name, description, is_active, is_system_role) 
VALUES ('Administrator', 'Full system access', true, true)
ON CONFLICT (name) DO NOTHING;

-- Create users with hashed passwords
-- Password for patti: password123
INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id)
VALUES ('patti', 'patti@planettogether.com', 'Patti', 'User', 
        '$2b$10$qN2K9JXwN8tVOaWnSf6mxOZQzVNZlQvHqT9kLXGf1VdKxPX7F2Bau', true, 1)
ON CONFLICT (username) DO UPDATE 
SET password_hash = '$2b$10$qN2K9JXwN8tVOaWnSf6mxOZQzVNZlQvHqT9kLXGf1VdKxPX7F2Bau', is_active = true;

-- Password for Jim: planettogether  
INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id)
VALUES ('Jim', 'jim@planettogether.com', 'Jim', 'User',
        '$2b$10$KcXhD7V1wKiLgFqJ1xYpOeFNJQhZI7YXhW5vJzxhRjM5PqZXF7Qn6', true, 1)
ON CONFLICT (username) DO UPDATE
SET password_hash = '$2b$10$KcXhD7V1wKiLgFqJ1xYpOeFNJQhZI7YXhW5vJzxhRjM5PqZXF7Qn6', is_active = true;

-- Password for admin: admin123
INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id)
VALUES ('admin', 'admin@planettogether.com', 'Admin', 'User',
        '$2b$10$o42ZhKv3RRAXGLClwilpeeMwJAiSNdQPAsMC99LyRtxGwJk0Bx8dW', true, 1)
ON CONFLICT (username) DO UPDATE
SET password_hash = '$2b$10$o42ZhKv3RRAXGLClwilpeeMwJAiSNdQPAsMC99LyRtxGwJk0Bx8dW', is_active = true;

-- Assign Administrator role to all users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE r.name = 'Administrator' 
AND u.username IN ('patti', 'Jim', 'admin')
ON CONFLICT DO NOTHING;

-- Create basic permissions
INSERT INTO permissions (name, feature, action, description) VALUES
('dashboard:view', 'dashboard', 'view', 'View dashboard'),
('dashboard:create', 'dashboard', 'create', 'Create dashboard'),
('dashboard:update', 'dashboard', 'update', 'Update dashboard'),
('dashboard:delete', 'dashboard', 'delete', 'Delete dashboard'),
('dashboard:execute', 'dashboard', 'execute', 'Execute dashboard'),
('dashboard:export', 'dashboard', 'export', 'Export dashboard'),
('production:view', 'production', 'view', 'View production'),
('production:create', 'production', 'create', 'Create production'),
('production:update', 'production', 'update', 'Update production'),
('production:delete', 'production', 'delete', 'Delete production'),
('production:execute', 'production', 'execute', 'Execute production'),
('production:export', 'production', 'export', 'Export production')
ON CONFLICT DO NOTHING;

-- Grant all permissions to Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Administrator'
ON CONFLICT DO NOTHING;

-- Create session table for authentication
CREATE TABLE IF NOT EXISTS "session" (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");