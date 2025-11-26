20251126

WHAT I WORKED ON TODAY

Replit Deployment Troubleshooting
- Identified .replit file had 18 port entries when autoscale deployment only supports 1 external port
- Provided shell command to clean up extra port entries (sed -i '41,108d' .replit)
- Researched production database settings for republishing

Database Maintenance
- Added automatic database cleanup job for agent_recommendations table
- Job runs once on server startup and then daily
- Trims table to 1000 rows when exceeded by deleting oldest entries
- Successfully trimmed from 1077 to 1000 rows on first run

Production Scheduler
- Fixed version loading resource ID mapping
- Made global resource maps (originalIdMap, resourceMap, resourceByName) available for version loading
- Operations now correctly appear on their proper resource rows when loading saved versions
