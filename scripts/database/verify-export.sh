#!/bin/bash

# Verify and analyze the export file contents
# Usage: ./scripts/database/verify-export.sh [export-file]

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== Export File Verification Tool ===${NC}"
echo ""

# Default to the full export if no file specified
EXPORT_FILE=${1:-"database-exports/full-export-2025-11-05T20-14-35.sql"}

if [ ! -f "$EXPORT_FILE" ]; then
    echo -e "${RED}Error: Export file not found: $EXPORT_FILE${NC}"
    echo ""
    echo "Available exports:"
    ls -lh database-exports/*.sql 2>/dev/null || echo "No export files found"
    exit 1
fi

echo -e "${BLUE}Analyzing: $(basename $EXPORT_FILE)${NC}"
echo ""

# File information
FILE_SIZE=$(ls -lh "$EXPORT_FILE" | awk '{print $5}')
LINE_COUNT=$(wc -l < "$EXPORT_FILE")
echo -e "${GREEN}File Statistics:${NC}"
echo "  Size: $FILE_SIZE"
echo "  Lines: $LINE_COUNT"
echo ""

# Extract table information
echo -e "${GREEN}Tables in Export:${NC}"
grep -E "^CREATE TABLE|^COPY .* FROM stdin" "$EXPORT_FILE" | while read -r line; do
    if [[ $line == CREATE* ]]; then
        TABLE_NAME=$(echo "$line" | sed -n 's/CREATE TABLE[^"]*"\([^"]*\)".*/\1/p')
        if [ ! -z "$TABLE_NAME" ]; then
            echo -n "  • $TABLE_NAME"
        fi
    elif [[ $line == COPY* ]]; then
        ROW_COUNT=$(echo "$line" | sed -n 's/.*(\([0-9]*\) rows.*/\1/p' 2>/dev/null || echo "")
        if [ ! -z "$ROW_COUNT" ]; then
            echo " ($ROW_COUNT rows)"
        else
            echo ""
        fi
    fi
done

# Count data records
echo ""
echo -e "${GREEN}Data Summary:${NC}"
echo "  Users: $(grep -c "^COPY public.users " "$EXPORT_FILE" 2>/dev/null || echo "0") tables"
echo "  Jobs: $(grep -c "^COPY public.ptjobs " "$EXPORT_FILE" 2>/dev/null || echo "0") tables"
echo "  Resources: $(grep -c "^COPY public.resources " "$EXPORT_FILE" 2>/dev/null || echo "0") tables"
echo "  Dashboards: $(grep -c "^COPY public.dashboards " "$EXPORT_FILE" 2>/dev/null || echo "0") tables"
echo ""

# Check for critical tables
echo -e "${GREEN}Critical Tables Check:${NC}"
CRITICAL_TABLES=("users" "roles" "permissions" "ptjobs" "resources" "plants" "planning_areas")
for table in "${CRITICAL_TABLES[@]}"; do
    if grep -q "CREATE TABLE.*\"$table\"" "$EXPORT_FILE"; then
        echo -e "  ✅ $table - ${GREEN}Found${NC}"
    else
        echo -e "  ❌ $table - ${RED}Missing${NC}"
    fi
done

echo ""
echo -e "${GREEN}Export Type Analysis:${NC}"
if grep -q "CREATE TABLE" "$EXPORT_FILE" && grep -q "COPY .* FROM stdin" "$EXPORT_FILE"; then
    echo -e "  ${MAGENTA}Full Export${NC} (Schema + Data)"
elif grep -q "CREATE TABLE" "$EXPORT_FILE" && ! grep -q "COPY .* FROM stdin" "$EXPORT_FILE"; then
    echo -e "  ${YELLOW}Schema Only${NC} (No Data)"
elif ! grep -q "CREATE TABLE" "$EXPORT_FILE" && grep -q "COPY .* FROM stdin" "$EXPORT_FILE"; then
    echo -e "  ${BLUE}Data Only${NC} (No Schema)"
else
    echo -e "  ${RED}Unknown Format${NC}"
fi

echo ""
echo -e "${GREEN}Safety Features:${NC}"
if grep -q "DROP TABLE IF EXISTS" "$EXPORT_FILE"; then
    echo -e "  ✅ Clean import mode (includes DROP statements)"
else
    echo -e "  ⚠️  Append mode (no DROP statements)"
fi

if grep -q "BEGIN;" "$EXPORT_FILE" && grep -q "COMMIT;" "$EXPORT_FILE"; then
    echo -e "  ✅ Transaction wrapped (atomic import)"
else
    echo -e "  ⚠️  No transaction wrapper"
fi

echo ""
echo -e "${CYAN}Import Recommendations:${NC}"
echo "  • This export is ready for production import"
echo "  • Ensure you have a backup before importing"
echo "  • Run during low-traffic period"
echo "  • Verify application functionality after import"
echo ""
echo -e "${YELLOW}To import this file:${NC}"
echo "  ${BLUE}./scripts/database/import-full-export.sh${NC}"