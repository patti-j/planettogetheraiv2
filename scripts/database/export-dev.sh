#!/bin/bash

# Export development database to SQL dump file
# Usage: ./scripts/database/export-dev.sh [--full | --selective]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PlanetTogether Database Export Tool ===${NC}"
echo "Exporting from DEVELOPMENT database..."

# Check if DATABASE_URL exists (development database)
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
    echo "Please ensure you're connected to the development database"
    exit 1
fi

# Create export directory if it doesn't exist
mkdir -p database-exports

# Generate timestamp for the export
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")

# Determine export mode
MODE=${1:-"--full"}

if [ "$MODE" == "--full" ]; then
    EXPORT_FILE="database-exports/dev_export_full_${TIMESTAMP}_${GIT_SHA}.sql"
    echo -e "${YELLOW}Performing FULL database export...${NC}"
    
    # Export full database (schema + data)
    pg_dump "$DATABASE_URL" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --verbose \
        > "$EXPORT_FILE"
        
elif [ "$MODE" == "--selective" ]; then
    EXPORT_FILE="database-exports/dev_export_selective_${TIMESTAMP}_${GIT_SHA}.sql"
    echo -e "${YELLOW}Performing SELECTIVE database export...${NC}"
    echo "Exporting core production tables only..."
    
    # Export selective tables (essential production data)
    pg_dump "$DATABASE_URL" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --verbose \
        --table=users \
        --table=roles \
        --table=permissions \
        --table=role_permissions \
        --table=user_roles \
        --table=plants \
        --table=resources \
        --table=ptresources \
        --table=ptjobs \
        --table=ptjoboperations \
        --table=ptjobresources \
        --table=ptjobdependencies \
        --table=ptoperations \
        --table=planning_areas \
        --table=optimization_algorithms \
        --table=algorithm_deployments \
        --table=dashboards \
        --table=widgets \
        --table=kpi_metrics \
        --table=llm_models \
        --table=agent_configurations \
        > "$EXPORT_FILE"
        
elif [ "$MODE" == "--schema-only" ]; then
    EXPORT_FILE="database-exports/dev_export_schema_${TIMESTAMP}_${GIT_SHA}.sql"
    echo -e "${YELLOW}Performing SCHEMA-ONLY export...${NC}"
    
    # Export schema only (no data)
    pg_dump "$DATABASE_URL" \
        --no-owner \
        --no-acl \
        --schema-only \
        --verbose \
        > "$EXPORT_FILE"
        
else
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Usage: $0 [--full | --selective | --schema-only]"
    exit 1
fi

# Check if export was successful
if [ $? -eq 0 ] && [ -f "$EXPORT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$EXPORT_FILE" | awk '{print $5}')
    
    # Create metadata manifest
    MANIFEST_FILE="database-exports/manifest_${TIMESTAMP}.json"
    cat > "$MANIFEST_FILE" <<EOF
{
    "export_timestamp": "$(date -Iseconds)",
    "export_mode": "$MODE",
    "export_file": "$(basename $EXPORT_FILE)",
    "file_size": "$FILE_SIZE",
    "git_sha": "$GIT_SHA",
    "source": "development",
    "database_url": "dev_database",
    "exported_by": "$USER",
    "tables_included": $([ "$MODE" == "--selective" ] && echo '["users", "roles", "permissions", "plants", "resources", "ptjobs", "ptjoboperations", "planning_areas", "optimization_algorithms", "dashboards", "widgets"]' || echo '"all"')
}
EOF
    
    echo -e "${GREEN}✅ Export completed successfully!${NC}"
    echo -e "Export file: ${GREEN}$EXPORT_FILE${NC} (${FILE_SIZE})"
    echo -e "Manifest: ${GREEN}$MANIFEST_FILE${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Review the export file if needed"
    echo "2. Run the import script to load into production:"
    echo "   ./scripts/database/import-prod.sh $EXPORT_FILE"
else
    echo -e "${RED}❌ Export failed!${NC}"
    exit 1
fi