# Database Migration Guide - Development to Production

## Overview
This guide explains how to migrate data from your development database to your production database in Replit. The system provides both data export capabilities and smart seeding scripts to ensure your production environment has all necessary data.

## Available Tools

### 1. Database Export Script
Exports all development data into SQL files for migration.

**Command:**
```bash
npm run db:export
```

**What it does:**
- Exports all tables with their data to `database-exports/` directory
- Creates individual SQL files for each table
- Creates a combined SQL file with all data
- Generates a summary JSON file with statistics

**Output files:**
- `full-export-{timestamp}.sql` - Complete database export
- `{tablename}-{timestamp}.sql` - Individual table exports
- `export-summary-{timestamp}.json` - Export statistics

### 2. Production Seed Script
Initializes essential data for production environment.

**Command:**
```bash
npm run db:seed:production
```

**What it does:**
- Creates default permissions and roles
- Sets up administrator account (admin/admin123)
- Creates sample resources and production jobs
- Configures AI agent user
- Only runs if data doesn't already exist (idempotent)

## Migration Process

### Option A: Fresh Production Setup (Recommended for Initial Deployment)

1. **Deploy your application:**
   - Click "Deploy" button in Replit
   - Wait for deployment to complete

2. **Run production seed:**
   ```bash
   npm run db:seed:production
   ```

3. **Verify setup:**
   - Login with admin/admin123
   - Check that all permissions and roles are created
   - Verify sample data is loaded

### Option B: Full Data Migration

1. **Export development data:**
   ```bash
   npm run db:export
   ```

2. **Review exported files:**
   - Check `database-exports/` directory
   - Review `export-summary-{timestamp}.json` for statistics

3. **Deploy application:**
   - Click "Deploy" button in Replit

4. **Import to production:**
   - Open Replit Database pane
   - Switch to "Production" database
   - Copy contents of `full-export-{timestamp}.sql`
   - Run the SQL in production database console

### Option C: Selective Migration

1. **Export development data:**
   ```bash
   npm run db:export
   ```

2. **Choose specific tables:**
   - Navigate to `database-exports/`
   - Select individual table SQL files you want to migrate
   - For example:
     - `ptjobs-{timestamp}.sql` for production jobs
     - `ptresources-{timestamp}.sql` for resources
     - `users-{timestamp}.sql` for user accounts

3. **Import selected tables:**
   - Open Replit Database pane
   - Switch to "Production" database
   - Run selected SQL files in order

## Important Tables

### Core System Tables (Required)
- `permissions` - System permissions
- `roles` - User roles  
- `role_permissions` - Role-permission mappings
- `users` - User accounts
- `user_roles` - User-role assignments

### Manufacturing Data
- `ptresources` - Production resources
- `ptjobs` - Production jobs
- `ptjoboperations` - Job operations
- `schedule_versions` - Schedule snapshots

### Configuration
- `user_preferences` - User settings
- `dashboards` - Dashboard configurations
- `widgets` - Dashboard widgets

### AI/Automation
- `agent_connections` - AI agent configurations
- `agent_recommendations` - AI recommendations
- `automation_rules` - Automation rules

## Best Practices

### Before Migration
1. **Backup current data:**
   - Always export current data before major changes
   - Keep multiple export versions

2. **Test in development:**
   - Test your seed scripts in development first
   - Verify data integrity

3. **Plan downtime:**
   - Schedule migration during low-usage periods
   - Notify users in advance

### During Migration
1. **Run in order:**
   - Core system tables first (permissions, roles, users)
   - Then reference data (resources, job templates)
   - Finally transactional data (jobs, operations)

2. **Verify each step:**
   - Check row counts match export summary
   - Test login and permissions
   - Verify critical data is present

### After Migration
1. **Change default passwords:**
   - Immediately change admin password
   - Update any default user passwords

2. **Test critical functions:**
   - Login with different role types
   - Create a test job
   - Run scheduling algorithms
   - Verify AI agents are working

3. **Monitor logs:**
   - Check application logs for errors
   - Monitor database performance
   - Review user activity

## Troubleshooting

### Common Issues

**Issue: Foreign key constraint errors**
- **Solution:** Import tables in correct order (parent tables before child tables)

**Issue: Duplicate key errors**
- **Solution:** Either truncate existing data or use seed script which checks for existing data

**Issue: Permission denied errors**
- **Solution:** Ensure you're connected to the correct database and have proper permissions

**Issue: Data type mismatches**
- **Solution:** Check that development and production schemas match (run `npm run db:push` in production)

### Emergency Recovery

If migration fails:
1. Export current production data immediately
2. Restore from backup if available
3. Run production seed script for minimal working state
4. Contact support if issues persist

## Security Considerations

1. **Sensitive Data:**
   - Review exported SQL for sensitive information
   - Remove or obfuscate production passwords
   - Don't commit export files to version control

2. **Access Control:**
   - Change all default passwords after migration
   - Review user permissions
   - Audit admin access

3. **API Keys:**
   - Regenerate API keys in production
   - Update environment variables
   - Use Replit secrets for sensitive values

## Automation Options

For continuous deployment, consider:

1. **Automatic seeding:**
   - Add seed script to production startup
   - Use environment checks to prevent re-seeding

2. **Scheduled exports:**
   - Create cron job for regular exports
   - Maintain backup rotation policy

3. **Migration scripts:**
   - Version your migration scripts
   - Use incremental migrations for updates

## Support

For additional help:
- Check application logs: `npm run dev` and view console
- Review database structure in Replit Database pane
- Test queries in database console before running migrations

Remember: Always backup before making changes to production data!