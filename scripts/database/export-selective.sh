#!/bin/bash

# Enhanced selective export script that reads from tables.config
# Usage: ./scripts/database/export-selective.sh

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PlanetTogether Selective Database Export ===${NC}"
echo "Reading table configuration from tables.config..."

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
    exit 1
fi

# Check if config file exists
CONFIG_FILE="scripts/database/tables.config"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Read tables from config file (excluding comments and empty lines)
TABLES=""
while IFS= read -r line; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^# ]] && [[ ! -z "$line" ]]; then
        # Trim whitespace
        table=$(echo "$line" | xargs)
        if [[ ! -z "$table" ]]; then
            TABLES="$TABLES --table=$table"
        fi
    fi
done < "$CONFIG_FILE"

if [ -z "$TABLES" ]; then
    echo -e "${RED}Error: No tables specified in configuration${NC}"
    exit 1
fi

# Generate timestamp for the export
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")
EXPORT_FILE="database-exports/dev_export_selective_${TIMESTAMP}_${GIT_SHA}.sql"

# Create export directory if it doesn't exist
mkdir -p database-exports

echo -e "${YELLOW}Exporting configured tables...${NC}"
echo "Tables to export:"
echo "$TABLES" | tr ' ' '\n' | grep table | sed 's/--table=/  - /'

# Perform the export
pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    $TABLES \
    > "$EXPORT_FILE" 2>&1

# Check if export was successful
if [ $? -eq 0 ] && [ -f "$EXPORT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$EXPORT_FILE" | awk '{print $5}')
    
    echo -e "${GREEN}✅ Export completed successfully!${NC}"
    echo -e "Export file: ${GREEN}$EXPORT_FILE${NC} (${FILE_SIZE})"
    echo ""
    echo -e "${YELLOW}Next step:${NC}"
    echo "  Import to production: ./scripts/database/import-prod.sh $EXPORT_FILE"
else
    echo -e "${RED}❌ Export failed!${NC}"
    exit 1
fi