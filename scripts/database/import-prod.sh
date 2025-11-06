#!/bin/bash

# Import database dump into production
# Usage: ./scripts/database/import-prod.sh <export_file.sql>

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PlanetTogether Database Import Tool ===${NC}"
echo -e "${RED}⚠️  WARNING: This will import data into PRODUCTION database${NC}"

# Check if export file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No export file specified${NC}"
    echo "Usage: $0 <export_file.sql>"
    echo ""
    echo "Available exports:"
    ls -lh database-exports/*.sql 2>/dev/null || echo "No export files found"
    exit 1
fi

EXPORT_FILE=$1

# Check if export file exists
if [ ! -f "$EXPORT_FILE" ]; then
    echo -e "${RED}Error: Export file not found: $EXPORT_FILE${NC}"
    exit 1
fi

# Check for production database URL - you'll need to set this as PRODUCTION_DATABASE_URL
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    echo -e "${RED}Error: PRODUCTION_DATABASE_URL environment variable not set${NC}"
    echo ""
    echo "Please set your production database URL:"
    echo "  export PRODUCTION_DATABASE_URL='postgresql://user:pass@host/db'"
    echo ""
    echo "Or load from secrets:"
    echo "  source .env.prod"
    exit 1
fi

# Safety confirmation
echo ""
echo -e "${YELLOW}You are about to import:${NC}"
echo "  File: $(basename $EXPORT_FILE)"
echo "  Size: $(ls -lh $EXPORT_FILE | awk '{print $5}')"
echo "  Target: PRODUCTION DATABASE"
echo ""
echo -e "${RED}This operation will:${NC}"
echo "  • Replace existing data in production"
echo "  • Cannot be easily undone"
echo ""
read -p "Are you SURE you want to continue? Type 'yes' to proceed: " -r
echo

if [[ ! $REPLY == "yes" ]]; then
    echo -e "${YELLOW}Import cancelled by user${NC}"
    exit 1
fi

# Create backup of current production (optional but recommended)
echo -e "${BLUE}Creating safety backup of current production data...${NC}"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database-exports/prod_backup_before_import_${BACKUP_TIMESTAMP}.sql"

pg_dump "$PRODUCTION_DATABASE_URL" \
    --no-owner \
    --no-acl \
    --verbose \
    > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not create backup. Continue anyway?${NC}"
    read -p "Type 'yes' to continue without backup: " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo -e "${RED}Import cancelled${NC}"
        exit 1
    fi
}

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
fi

# Perform the import
echo ""
echo -e "${YELLOW}Importing data into production...${NC}"
echo "This may take a few moments..."

# Use psql to import (pg_restore is for custom format dumps)
psql "$PRODUCTION_DATABASE_URL" < "$EXPORT_FILE" 2>&1 | tee import_log_${BACKUP_TIMESTAMP}.log || {
    echo -e "${RED}❌ Import failed!${NC}"
    echo ""
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${YELLOW}You can restore the backup with:${NC}"
        echo "  psql \$PRODUCTION_DATABASE_URL < $BACKUP_FILE"
    fi
    exit 1
}

# Verify import success with basic checks
echo ""
echo -e "${BLUE}Verifying import...${NC}"

# Check row counts for key tables
VERIFICATION_QUERY="SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 
    'roles', COUNT(*) FROM roles
UNION ALL SELECT 
    'ptjobs', COUNT(*) FROM ptjobs
UNION ALL SELECT 
    'ptresources', COUNT(*) FROM ptresources
UNION ALL SELECT 
    'planning_areas', COUNT(*) FROM planning_areas;"

echo "Table row counts:"
psql "$PRODUCTION_DATABASE_URL" -c "$VERIFICATION_QUERY" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not verify row counts${NC}"
}

# Create import record
IMPORT_RECORD="database-exports/import_record_${BACKUP_TIMESTAMP}.json"
cat > "$IMPORT_RECORD" <<EOF
{
    "import_timestamp": "$(date -Iseconds)",
    "import_file": "$(basename $EXPORT_FILE)",
    "backup_file": "$(basename $BACKUP_FILE 2>/dev/null || echo 'none')",
    "imported_by": "$USER",
    "target": "production",
    "status": "completed"
}
EOF

echo ""
echo -e "${GREEN}✅ Import completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Post-import checklist:${NC}"
echo "  1. Test login functionality"
echo "  2. Verify core data is present"
echo "  3. Check Production Scheduler loads correctly"
echo "  4. Test a few key workflows"
echo ""
echo -e "${BLUE}Import record saved: $IMPORT_RECORD${NC}"
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${BLUE}Backup available at: $BACKUP_FILE${NC}"
fi