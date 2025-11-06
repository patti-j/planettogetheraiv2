# Migration Guide for full-export-2025-11-05T20-14-35.sql

## Quick Start

This guide helps you migrate your 16MB full database export to production at planettogetherai.com.

## What's in This Export?

- **File**: `database-exports/full-export-2025-11-05T20-14-35.sql`
- **Size**: 16MB
- **Type**: Complete database dump (schema + data)
- **Created**: November 5, 2025
- **Contents**: All tables, data, constraints, and relationships

## Migration Methods

### Method 1: Neon Dashboard (Recommended) 🎯

This is the safest method since you control the process directly in Neon.

1. **Verify the export:**
   ```bash
   ./scripts/database/verify-export.sh
   ```

2. **Access Neon Console:**
   - Go to https://console.neon.tech
   - Sign in to your account

3. **Find Production Database:**
   - Look for the database connected to planettogetherai.com
   - Note the connection details

4. **Import the Data:**
   - Option A: Use SQL Editor
     - Open SQL Editor in Neon
     - Upload or paste the export file contents
     - Execute the import
   
   - Option B: Use psql locally
     - Copy connection string from Neon
     - Run: `psql 'connection-string' < database-exports/full-export-2025-11-05T20-14-35.sql`

### Method 2: Replit Database Pane 🚀

If you have access to production database through Replit:

1. **Prepare the export:**
   ```bash
   ./scripts/database/import-full-export.sh
   # Select option 1 for instructions
   ```

2. **In Replit:**
   - Click Database icon in sidebar
   - Switch to Production view
   - Import SQL file

### Method 3: Direct Import (If You Have Production URL) ⚡

1. **Set Production URL:**
   ```bash
   export PRODUCTION_DATABASE_URL='postgresql://...'
   ```

2. **Run Import Script:**
   ```bash
   ./scripts/database/import-full-export.sh
   # Select option 2
   # Follow safety prompts
   ```

## Pre-Migration Checklist ✅

- [ ] Notify users of maintenance window
- [ ] Create backup of current production (script does this automatically)
- [ ] Verify export file integrity: `./scripts/database/verify-export.sh`
- [ ] Test login credentials are in export
- [ ] Schedule during low-traffic period

## Post-Migration Verification 🔍

After importing, verify these critical functions:

1. **Authentication:**
   - Test login at https://planettogetherai.com
   - Verify user roles and permissions

2. **Core Data:**
   ```sql
   -- Run these queries in production
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM ptjobs;
   SELECT COUNT(*) FROM resources;
   SELECT COUNT(*) FROM planning_areas;
   ```

3. **Application Features:**
   - Production Scheduler loads correctly
   - Dashboards display properly
   - AI agents respond
   - Navigation works

## Troubleshooting 🛠️

### Import Fails
- Check database connection
- Verify you have sufficient permissions
- Ensure no active connections blocking import

### Data Missing
- Verify export file is complete (16MB)
- Check if import ran to completion
- Look for error messages in import log

### Login Issues After Import
- Ensure users table was imported
- Check password hashing is preserved
- Verify session configuration

### Rollback Procedure
If something goes wrong:
```bash
# The import script creates automatic backups
# Find your backup:
ls -lh database-exports/prod_backup_*.sql

# Restore it:
psql $PRODUCTION_DATABASE_URL < database-exports/prod_backup_before_full_*.sql
```

## Security Notes 🔐

- Never commit database URLs to git
- Keep export files secure (contain sensitive data)
- Delete local exports after successful migration
- Use encrypted connections (Neon provides this by default)

## Support

For issues:
1. Check import logs: `import_full_log_*.log`
2. Verify with: `./scripts/database/verify-export.sh`
3. Review this guide and main README.md

## Quick Command Reference

```bash
# Verify export
./scripts/database/verify-export.sh

# Interactive import wizard
./scripts/database/import-full-export.sh

# Manual import (if you have URL)
export PRODUCTION_DATABASE_URL='your-url'
psql $PRODUCTION_DATABASE_URL < database-exports/full-export-2025-11-05T20-14-35.sql
```

Remember: This export contains your complete database as of Nov 5, 2025. Handle with care!