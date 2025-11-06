# 🚨 PRODUCTION ACCESS FIX - URGENT

## Problem
Users are getting "Access Denied" error in production at planettogetherai.com when trying to access the Production Scheduler. The error shows "Required permission: schedule - view".

## Root Cause
The production database doesn't have the proper user permissions configured. While the development environment works, the production database needs to be updated.

## Immediate Solution

### Option 1: Run SQL Script in Production Database
1. Access your production database console
2. Run the following SQL script: `scripts/production-fix-access.sql`
3. This script will:
   - Create/update Patti and Jim user accounts
   - Set them as Administrators
   - Grant all 52 permissions including "schedule.view"
   - Verify the configuration

### Option 2: Use Environment Variable
If you have `PRODUCTION_DATABASE_URL` configured:

```bash
# From your local machine with production database access
npm run db:push --force
tsx scripts/database/ensure-production-users-access.ts
```

## Production Deployment Configuration
The deployment has been configured with:
- **Target:** Autoscale (stateless)
- **Build:** `npm run build`
- **Run:** `npm run start`

## Verification Steps
After applying the fix:
1. Have Patti or Jim log in to planettogetherai.com
2. Navigate to Production Scheduler
3. They should now have full access

## Login Credentials
- **Username:** patti | **Password:** password123
- **Username:** Jim | **Password:** password123

## What This Fix Does
- ✅ Creates/updates Patti and Jim as users
- ✅ Assigns Administrator role to both users  
- ✅ Grants all 52 system permissions
- ✅ Specifically includes "schedule.view" permission
- ✅ Ensures full access to Production Scheduler

## IMPORTANT: Run in Production
This MUST be executed in your **production database**, not development. The development environment is already working correctly.

## Quick Copy-Paste for Database Console
If you need to quickly run this in your production database console, here's the essential part:

```sql
-- Grant Administrator to Patti and Jim
UPDATE users SET active_role_id = 1 WHERE username IN ('patti', 'Jim');
INSERT INTO user_roles (user_id, role_id) 
SELECT id, 1 FROM users WHERE username IN ('patti', 'Jim')
ON CONFLICT DO NOTHING;
```

This will immediately grant Administrator access to both users.