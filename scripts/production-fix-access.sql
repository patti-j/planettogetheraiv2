-- PRODUCTION FIX: Grant full Administrator access to Patti and Jim
-- Run this in the production database to fix the "Access Denied" issue

-- First, ensure users exist with correct data
INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id)
VALUES 
  ('patti', 'patti@planettogether.com', 'Patti', 'User', '$2a$10$5PJZlE0Y.MkIdUacrGg36.VsDhHXcA1VtyqN1KH5f6bxUiLaD5pZy', true, 1),
  ('Jim', 'jim@planettogether.com', 'Jim', 'User', '$2a$10$5PJZlE0Y.MkIdUacrGg36.VsDhHXcA1VtyqN1KH5f6bxUiLaD5pZy', true, 1)
ON CONFLICT (username) DO UPDATE
SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = true,
  active_role_id = 1;

-- Ensure Administrator role exists
INSERT INTO roles (id, name, description, is_active, is_system_role)
VALUES (1, 'Administrator', 'Full system administrator with all permissions', true, true)
ON CONFLICT (id) DO UPDATE
SET 
  name = 'Administrator',
  is_active = true,
  is_system_role = true;

-- Create ALL permissions if they don't exist
INSERT INTO permissions (name, feature, action, description)
VALUES 
  ('schedule.view', 'schedule', 'view', 'View production schedule'),
  ('schedule.create', 'schedule', 'create', 'Create production schedules'),
  ('schedule.update', 'schedule', 'update', 'Update production schedules'),
  ('schedule.delete', 'schedule', 'delete', 'Delete production schedules'),
  ('schedule.execute', 'schedule', 'execute', 'Execute scheduling algorithms'),
  ('schedule.export', 'schedule', 'export', 'Export schedule data'),
  ('schedule.import', 'schedule', 'import', 'Import schedule data'),
  ('resources.view', 'resources', 'view', 'View resources'),
  ('resources.create', 'resources', 'create', 'Create resources'),
  ('resources.update', 'resources', 'update', 'Update resources'),
  ('resources.delete', 'resources', 'delete', 'Delete resources'),
  ('jobs.view', 'jobs', 'view', 'View jobs'),
  ('jobs.create', 'jobs', 'create', 'Create jobs'),
  ('jobs.update', 'jobs', 'update', 'Update jobs'),
  ('jobs.delete', 'jobs', 'delete', 'Delete jobs'),
  ('operations.view', 'operations', 'view', 'View operations'),
  ('operations.create', 'operations', 'create', 'Create operations'),
  ('operations.update', 'operations', 'update', 'Update operations'),
  ('operations.delete', 'operations', 'delete', 'Delete operations'),
  ('dashboard.view', 'dashboard', 'view', 'View dashboards'),
  ('dashboard.create', 'dashboard', 'create', 'Create dashboards'),
  ('dashboard.update', 'dashboard', 'update', 'Update dashboards'),
  ('dashboard.delete', 'dashboard', 'delete', 'Delete dashboards'),
  ('reports.view', 'reports', 'view', 'View reports'),
  ('reports.create', 'reports', 'create', 'Create reports'),
  ('reports.export', 'reports', 'export', 'Export reports'),
  ('analytics.view', 'analytics', 'view', 'View analytics'),
  ('settings.view', 'settings', 'view', 'View settings'),
  ('settings.update', 'settings', 'update', 'Update settings'),
  ('users.view', 'users', 'view', 'View users'),
  ('users.create', 'users', 'create', 'Create users'),
  ('users.update', 'users', 'update', 'Update users'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  ('roles.view', 'roles', 'view', 'View roles'),
  ('roles.create', 'roles', 'create', 'Create roles'),
  ('roles.update', 'roles', 'update', 'Update roles'),
  ('roles.delete', 'roles', 'delete', 'Delete roles'),
  ('permissions.view', 'permissions', 'view', 'View permissions'),
  ('permissions.manage', 'permissions', 'manage', 'Manage permissions'),
  ('system.view', 'system', 'view', 'View system information'),
  ('system.configure', 'system', 'configure', 'Configure system settings'),
  ('ai.view', 'ai', 'view', 'View AI features'),
  ('ai.use', 'ai', 'use', 'Use AI features'),
  ('ai.configure', 'ai', 'configure', 'Configure AI settings'),
  ('integrations.view', 'integrations', 'view', 'View integrations'),
  ('integrations.configure', 'integrations', 'configure', 'Configure integrations'),
  ('master-data.view', 'master-data', 'view', 'View master data'),
  ('master-data.create', 'master-data', 'create', 'Create master data'),
  ('master-data.update', 'master-data', 'update', 'Update master data'),
  ('master-data.delete', 'master-data', 'delete', 'Delete master data'),
  ('algorithms.view', 'algorithms', 'view', 'View algorithms'),
  ('algorithms.execute', 'algorithms', 'execute', 'Execute algorithms'),
  ('algorithms.configure', 'algorithms', 'configure', 'Configure algorithms')
ON CONFLICT (name) DO NOTHING;

-- Grant ALL permissions to Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- Get user IDs
DO $$
DECLARE
  patti_id INTEGER;
  jim_id INTEGER;
BEGIN
  -- Get Patti's ID
  SELECT id INTO patti_id FROM users WHERE username = 'patti';
  
  -- Get Jim's ID
  SELECT id INTO jim_id FROM users WHERE username = 'Jim';
  
  -- Ensure both users are assigned Administrator role
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES 
    (patti_id, 1, 1),
    (jim_id, 1, 1)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Update their active_role_id to Administrator
  UPDATE users SET active_role_id = 1 WHERE id IN (patti_id, jim_id);
  
  RAISE NOTICE 'Successfully configured Administrator access for Patti (ID: %) and Jim (ID: %)', patti_id, jim_id;
END $$;

-- Verify the setup
SELECT 
  u.username,
  u.email,
  r.name as role,
  COUNT(rp.permission_id) as permission_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.username IN ('patti', 'Jim')
GROUP BY u.username, u.email, r.name;

-- Show specific schedule permissions for verification
SELECT 
  u.username,
  p.name as permission,
  p.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username IN ('patti', 'Jim')
  AND p.feature = 'schedule'
ORDER BY u.username, p.name;