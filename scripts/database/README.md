# Database Migration Scripts

This directory contains scripts for migrating data between development and production databases in PlanetTogether.

## Overview

These scripts provide a safe and reliable way to transfer data from your development environment to production using PostgreSQL's native `pg_dump` and `psql` utilities.

## Prerequisites

1. **Database URLs**: You need access to both development and production database connection strings
2. **PostgreSQL Client Tools**: Ensure `pg_dump` and `psql` are installed
3. **Permissions**: Write access to create export files and read access to both databases

## Setup

### 1. Set Environment Variables

Create `.env.dev` and `.env.prod` files (never commit these!):

```bash
# .env.dev (for development - usually already set as DATABASE_URL)
export DATABASE_URL='postgresql://user:pass@host/dev_db'

# .env.prod (for production)
export PRODUCTION_DATABASE_URL='postgresql://user:pass@host/prod_db'
```

### 2. Make Scripts Executable

```bash
chmod +x scripts/database/*.sh
```

## Usage

### Full Database Export/Import

Export everything from development:
```bash
./scripts/database/export-dev.sh --full
```

Import to production:
```bash
# First, set production database URL
export PRODUCTION_DATABASE_URL='your_production_database_url'

# Then import
./scripts/database/import-prod.sh database-exports/dev_export_full_*.sql
```

### Selective Export (Recommended)

Export only essential tables:
```bash
./scripts/database/export-dev.sh --selective
```

Or use the configuration file:
```bash
# Edit tables.config to specify which tables to export
nano scripts/database/tables.config

# Run selective export
./scripts/database/export-selective.sh
```

### Schema-Only Export

Export database structure without data:
```bash
./scripts/database/export-dev.sh --schema-only
```

## Export Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `--full` | Exports entire database (schema + data) | Complete migration |
| `--selective` | Exports core production tables only | Production deployment |
| `--schema-only` | Exports structure without data | Setting up new environment |

## Safety Features

1. **Automatic Backups**: The import script creates a backup before importing
2. **Confirmation Prompts**: Requires explicit confirmation before production changes
3. **Metadata Tracking**: Creates JSON manifests for audit trail
4. **Verification Checks**: Validates row counts after import
5. **Rollback Support**: Keeps backups for emergency restoration

## Configuration

Edit `scripts/database/tables.config` to customize which tables are included in selective exports.

Core tables (always included):
- `users`, `roles`, `permissions` - Authentication and authorization
- `plants`, `resources`, `ptresources` - Plant and resource configuration
- `ptjobs`, `ptjoboperations` - Production jobs and schedules
- `planning_areas` - Planning area configuration
- `optimization_algorithms` - Algorithm settings
- `dashboards`, `widgets` - Dashboard configurations

## File Structure

```
scripts/database/
├── export-dev.sh          # Main export script
├── export-selective.sh    # Configuration-based export
├── import-prod.sh         # Production import script
├── tables.config          # Table selection configuration
└── README.md             # This file

database-exports/          # Export files directory
├── dev_export_*.sql      # Database dumps
├── manifest_*.json       # Export metadata
└── import_record_*.json  # Import logs
```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL not set"**
   - Ensure you're in the development environment
   - Check that `.env` is loaded: `source .env`

2. **"PRODUCTION_DATABASE_URL not set"**
   - Set the production URL: `export PRODUCTION_DATABASE_URL='...'`
   - Or source from file: `source .env.prod`

3. **"Permission denied"**
   - Make scripts executable: `chmod +x scripts/database/*.sh`

4. **"pg_dump: command not found"**
   - Install PostgreSQL client tools
   - On Mac: `brew install postgresql`
   - On Ubuntu: `apt-get install postgresql-client`

### Emergency Rollback

If something goes wrong after import:
```bash
# Find the backup file
ls -lh database-exports/prod_backup_*.sql

# Restore from backup
psql $PRODUCTION_DATABASE_URL < database-exports/prod_backup_before_import_*.sql
```

## Best Practices

1. **Always Test First**: Run imports on a staging environment before production
2. **Use Selective Exports**: Only migrate necessary data to minimize risk
3. **Schedule Maintenance**: Import during low-traffic periods
4. **Verify Data**: Check critical workflows after migration
5. **Keep Backups**: Retain export files for audit and recovery
6. **Document Changes**: Note what was migrated and when

## Security Notes

- Never commit `.env` files or connection strings
- Use environment variables for sensitive data
- Ensure export files are stored securely
- Limit access to production credentials
- Use SSL connections (Neon databases have this by default)

## Support

For issues or questions about database migration:
1. Check the troubleshooting section above
2. Review export/import logs in `database-exports/`
3. Verify database connectivity with `psql $DATABASE_URL -c 'SELECT 1'`