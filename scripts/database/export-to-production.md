# Exporting to Production Database in Replit

## The Challenge
Replit uses the same `DATABASE_URL` environment variable for both dev and production, but with different values in each environment. This means we can't directly access production from development.

## Solution Options

### Option 1: Use Replit's Database Pane (Simplest)
1. Go to your Replit workspace
2. Click the "Database" icon in the left sidebar
3. Switch to "Production" view
4. Import your data directly through the UI

### Option 2: Manual Export/Import Process
1. Export from development:
```bash
./scripts/database/export-dev.sh --selective
```

2. Download the export file locally

3. Access your Neon dashboard directly:
   - Go to https://console.neon.tech
   - Find your production database
   - Use their import tools or SQL editor

### Option 3: Use Temporary Connection
1. Temporarily get your production database URL:
   - Deploy your app with a temporary endpoint that logs `process.env.DATABASE_URL`
   - Or check your Neon dashboard for the production connection string

2. Set it locally as PRODUCTION_DATABASE_URL:
```bash
export PRODUCTION_DATABASE_URL='postgresql://...'
./scripts/database/import-prod.sh database-exports/your-export.sql
```

### Option 4: Deploy-Time Migration (Advanced)
Create a one-time migration script that runs on deployment:
```javascript
// server/migrate-on-deploy.js
if (process.env.RUN_MIGRATION === 'true') {
  // Migration logic here
}
```

## Recommended Approach
For immediate needs, use **Option 1** (Database Pane) or **Option 2** (Neon Dashboard) as they're the safest and most straightforward.

## Important Notes
- Your dev and prod databases are completely separate Neon instances
- Never expose production credentials in your code
- Always backup before major migrations
- Test migrations on a staging environment first if possible