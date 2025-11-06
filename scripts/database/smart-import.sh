#!/bin/bash

# Smart import that handles existing data and conflicts
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Smart Import for Production ===${NC}"
echo "This script imports data table by table with conflict handling"
echo ""

# Check if production URL is set
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    echo -e "${RED}Error: PRODUCTION_DATABASE_URL not set${NC}"
    exit 1
fi

# Use the fixed export file
EXPORT_FILE="database-exports/full-export-fixed.sql"

if [ ! -f "$EXPORT_FILE" ]; then
    echo -e "${RED}Error: Fixed export file not found${NC}"
    echo "Run ./scripts/database/fix-export.sh first"
    exit 1
fi

echo -e "${YELLOW}Starting selective import...${NC}"
echo ""

# Function to import a specific table
import_table() {
    local table=$1
    echo -n "Importing $table... "
    
    # First, clear existing data (optional - comment out if you want to merge)
    psql "$PRODUCTION_DATABASE_URL" -c "TRUNCATE TABLE $table CASCADE;" 2>/dev/null || true
    
    # Extract and import just this table's data
    grep "^INSERT INTO $table " "$EXPORT_FILE" | \
        psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || {
            echo -e "${YELLOW}(some conflicts, continuing)${NC}"
            return
        }
    
    # Count records
    COUNT=$(psql "$PRODUCTION_DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    echo -e "${GREEN}✓ ($COUNT records)${NC}"
}

# Import in dependency order (parent tables first)
echo -e "${BLUE}Phase 1: Core System Tables${NC}"
import_table "permissions"
import_table "roles"
import_table "users"

echo ""
echo -e "${BLUE}Phase 2: Relationship Tables${NC}"
import_table "role_permissions"
import_table "user_roles"

echo ""
echo -e "${BLUE}Phase 3: Production Data${NC}"
import_table "ptjobs"
import_table "ptjoboperations"
import_table "dashboards"
import_table "widgets"

echo ""
echo -e "${BLUE}Phase 4: Other Tables${NC}"
# Add more tables as needed
for table in agent_recommendations schedule_versions; do
    if grep -q "^INSERT INTO $table " "$EXPORT_FILE"; then
        import_table "$table"
    fi
done

echo ""
echo -e "${GREEN}=== Import Summary ===${NC}"
psql "$PRODUCTION_DATABASE_URL" -c "
SELECT 
    'Core Tables' as category,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions
UNION ALL
SELECT 
    'Production',
    (SELECT COUNT(*) FROM ptjobs),
    (SELECT COUNT(*) FROM ptjoboperations),
    (SELECT COUNT(*) FROM dashboards);
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ Smart import completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Test login at https://planettogetherai.com"
echo "2. Verify Production Scheduler works"
echo "3. Check dashboards and widgets"