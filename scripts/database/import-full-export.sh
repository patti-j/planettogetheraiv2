#!/bin/bash

# Import the specific full export file to production
# Tailored for: full-export-2025-11-05T20-14-35.sql

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}=== PlanetTogether Full Export Import Tool ===${NC}"
echo -e "Configured for: ${GREEN}full-export-2025-11-05T20-14-35.sql${NC}"
echo ""

# Define the export file
EXPORT_FILE="database-exports/full-export-2025-11-05T20-14-35.sql"

# Check if export file exists
if [ ! -f "$EXPORT_FILE" ]; then
    echo -e "${RED}Error: Export file not found at: $EXPORT_FILE${NC}"
    echo "Please ensure the export file exists in the database-exports directory"
    exit 1
fi

# Display file information
FILE_SIZE=$(ls -lh "$EXPORT_FILE" | awk '{print $5}')
FILE_DATE=$(ls -l "$EXPORT_FILE" | awk '{print $6, $7, $8}')
echo -e "${BLUE}Export File Details:${NC}"
echo "  File: $(basename $EXPORT_FILE)"
echo "  Size: $FILE_SIZE"
echo "  Created: $FILE_DATE"
echo ""

# Choose import method
echo -e "${YELLOW}Select Import Method:${NC}"
echo "1. Import to Production via Neon Dashboard (Recommended)"
echo "2. Import using Production Database URL (if you have it)"
echo "3. Prepare for manual import"
echo ""
read -p "Enter your choice (1-3): " -r CHOICE
echo ""

case $CHOICE in
    1)
        echo -e "${GREEN}=== Option 1: Import via Neon Dashboard ===${NC}"
        echo ""
        echo "Steps to import your data:"
        echo ""
        echo "1. ${YELLOW}Download the export file locally:${NC}"
        echo "   The file is at: $(pwd)/$EXPORT_FILE"
        echo ""
        echo "2. ${YELLOW}Access your Neon Dashboard:${NC}"
        echo "   • Go to https://console.neon.tech"
        echo "   • Sign in to your account"
        echo ""
        echo "3. ${YELLOW}Find your production database:${NC}"
        echo "   • Look for the database connected to planettogetherai.com"
        echo "   • It should be labeled as your production instance"
        echo ""
        echo "4. ${YELLOW}Import the data:${NC}"
        echo "   • Click on 'SQL Editor' or 'Query' tab"
        echo "   • Either:"
        echo "     a) Paste the contents of the export file"
        echo "     b) Use Neon's import feature if available"
        echo ""
        echo "5. ${YELLOW}Verify the import:${NC}"
        echo "   Run these queries to check:"
        echo "   ${BLUE}SELECT COUNT(*) FROM users;${NC}"
        echo "   ${BLUE}SELECT COUNT(*) FROM ptjobs;${NC}"
        echo "   ${BLUE}SELECT COUNT(*) FROM resources;${NC}"
        echo ""
        echo -e "${GREEN}File ready at: $EXPORT_FILE${NC}"
        ;;
        
    2)
        echo -e "${GREEN}=== Option 2: Import with Production URL ===${NC}"
        echo ""
        
        # Check for production database URL
        if [ -z "$PRODUCTION_DATABASE_URL" ]; then
            echo -e "${YELLOW}Production database URL not found.${NC}"
            echo ""
            echo "To use this option, you need to:"
            echo "1. Get your production database URL from:"
            echo "   • Neon Dashboard (https://console.neon.tech)"
            echo "   • Your deployment configuration"
            echo ""
            echo "2. Set it as an environment variable:"
            echo "   ${BLUE}export PRODUCTION_DATABASE_URL='postgresql://user:pass@host/db'${NC}"
            echo ""
            echo "3. Run this script again and select option 2"
            exit 1
        fi
        
        echo -e "${RED}⚠️  WARNING: You are about to import to PRODUCTION${NC}"
        echo "Target database: [PRODUCTION]"
        echo ""
        echo "This will:"
        echo "  • Replace ALL existing data in production"
        echo "  • Import 16MB of data"
        echo "  • Affect the live site at planettogetherai.com"
        echo ""
        read -p "Are you ABSOLUTELY SURE? Type 'yes-import-to-production' to proceed: " -r
        echo
        
        if [[ ! $REPLY == "yes-import-to-production" ]]; then
            echo -e "${YELLOW}Import cancelled${NC}"
            exit 0
        fi
        
        # Create backup first
        echo -e "${BLUE}Creating safety backup of production...${NC}"
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="database-exports/prod_backup_before_full_${BACKUP_TIMESTAMP}.sql"
        
        pg_dump "$PRODUCTION_DATABASE_URL" \
            --no-owner \
            --no-acl \
            > "$BACKUP_FILE" 2>/dev/null || {
            echo -e "${YELLOW}Warning: Could not create backup${NC}"
            read -p "Continue without backup? (yes/no): " -r
            if [[ ! $REPLY == "yes" ]]; then
                exit 1
            fi
        }
        
        # Perform the import
        echo -e "${YELLOW}Importing full export to production...${NC}"
        echo "This will take a few moments for 16MB of data..."
        
        psql "$PRODUCTION_DATABASE_URL" < "$EXPORT_FILE" 2>&1 | tee import_full_log_${BACKUP_TIMESTAMP}.log || {
            echo -e "${RED}❌ Import failed!${NC}"
            if [ -f "$BACKUP_FILE" ]; then
                echo "Restore backup with:"
                echo "  ${BLUE}psql \$PRODUCTION_DATABASE_URL < $BACKUP_FILE${NC}"
            fi
            exit 1
        }
        
        echo -e "${GREEN}✅ Import completed successfully!${NC}"
        echo ""
        echo "Please verify:"
        echo "  1. Visit https://planettogetherai.com"
        echo "  2. Test login functionality"
        echo "  3. Check Production Scheduler"
        echo "  4. Verify core data is present"
        ;;
        
    3)
        echo -e "${GREEN}=== Option 3: Prepare for Manual Import ===${NC}"
        echo ""
        echo "The export file is ready for manual import:"
        echo ""
        echo -e "${BLUE}File Location:${NC}"
        echo "  $(pwd)/$EXPORT_FILE"
        echo ""
        echo -e "${BLUE}File Contents:${NC}"
        echo "  • Complete database dump from Nov 5, 2025"
        echo "  • Size: 16MB"
        echo "  • Includes all tables and data"
        echo "  • Schema + Data + Constraints"
        echo ""
        echo -e "${YELLOW}Manual Import Options:${NC}"
        echo ""
        echo "A. ${GREEN}Via Replit Database Pane:${NC}"
        echo "   1. Click Database icon in Replit sidebar"
        echo "   2. Switch to Production view"
        echo "   3. Import the SQL file"
        echo ""
        echo "B. ${GREEN}Via psql command:${NC}"
        echo "   ${BLUE}psql 'your-production-url' < $EXPORT_FILE${NC}"
        echo ""
        echo "C. ${GREEN}Via database client (TablePlus, DBeaver, etc):${NC}"
        echo "   1. Connect to production database"
        echo "   2. Open and execute the SQL file"
        echo ""
        echo -e "${MAGENTA}Important Notes:${NC}"
        echo "  • This is a FULL export - it will replace all data"
        echo "  • The export includes DROP statements for clean import"
        echo "  • Backup your production data before importing"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Need help?${NC}"
echo "  • Check scripts/database/README.md for detailed instructions"
echo "  • The export file is standard PostgreSQL SQL format"
echo "  • Compatible with any PostgreSQL 14+ database"