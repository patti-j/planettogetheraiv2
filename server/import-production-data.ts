import { db } from './db';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';

/**
 * Import production data from SQL export files
 * This script should be run ONCE after initial production deployment
 * 
 * IMPORTANT: This will run IN PRODUCTION when called from an API endpoint
 * Only run this once to avoid duplicating data!
 */
export async function importProductionData() {
  try {
    console.log('🚀 Starting production data import...');
    
    // Check if data already exists to prevent duplicate imports
    const existingUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const userCount = Number(existingUsers.rows[0].count);
    
    if (userCount > 1) {  // More than just admin user
      console.log('⚠️ Production database already has data. Skipping import to prevent duplicates.');
      return { 
        success: false, 
        message: 'Database already populated. Import skipped to prevent duplicates.' 
      };
    }
    
    // Define import order (respects foreign key constraints)
    const importOrder = [
      'permissions',
      'roles', 
      'role_permissions',
      'users',
      'user_roles',
      'user_preferences',
      'ptjobs',
      'ptjoboperations',
      'schedule_versions',
      'dashboards',
      'agent_connections',
      'agent_actions',
      'agent_metrics_hourly',
      'agent_policies',
      'agent_recommendations',
      'max_chat_messages',
      'recent_pages'
      // 'widgets' - Skip widgets as it's too large (32K rows)
    ];
    
    const exportDir = path.join(process.cwd(), 'database-exports');
    const timestamp = '2025-11-05T20-14-35';
    let importedTables = 0;
    let totalRows = 0;
    
    for (const tableName of importOrder) {
      const fileName = `${tableName}-${timestamp}.sql`;
      const filePath = path.join(exportDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${fileName}, skipping...`);
        continue;
      }
      
      try {
        console.log(`📝 Importing ${tableName}...`);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        
        // Split by semicolons but be careful with values containing semicolons
        const statements = sqlContent
          .split(/;\s*\n/)
          .filter(stmt => stmt.trim().length > 0)
          .filter(stmt => !stmt.trim().startsWith('--')); // Skip comments
        
        let rowsImported = 0;
        for (const statement of statements) {
          if (statement.trim().startsWith('INSERT INTO')) {
            try {
              await db.execute(sql.raw(statement + ';'));
              rowsImported++;
            } catch (err: any) {
              // Skip duplicate key errors
              if (err.code === '23505') {
                console.log(`  ⚠️ Skipping duplicate in ${tableName}`);
              } else {
                console.error(`  ❌ Error in ${tableName}: ${err.message}`);
              }
            }
          }
        }
        
        console.log(`  ✅ Imported ${rowsImported} rows into ${tableName}`);
        importedTables++;
        totalRows += rowsImported;
        
      } catch (error: any) {
        console.error(`❌ Failed to import ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Production data import complete!`);
    console.log(`📊 Imported ${importedTables} tables with ${totalRows} total rows`);
    
    return {
      success: true,
      message: `Successfully imported ${importedTables} tables with ${totalRows} rows`,
      details: {
        tablesImported: importedTables,
        totalRows: totalRows
      }
    };
    
  } catch (error: any) {
    console.error('❌ Import failed:', error);
    return {
      success: false,
      message: `Import failed: ${error.message}`
    };
  }
}

// One-time setup endpoint (should be protected and run only once)
export async function handleProductionSetup(req: any, res: any) {
  // Security check - only allow in production and with special key
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ 
      error: 'This endpoint only works in production environment' 
    });
  }
  
  // Check for setup key (you should set this as a secret in Replit)
  const setupKey = req.headers['x-setup-key'];
  if (setupKey !== process.env.PRODUCTION_SETUP_KEY) {
    return res.status(401).json({ 
      error: 'Invalid setup key' 
    });
  }
  
  try {
    const result = await importProductionData();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Import failed', 
      message: error.message 
    });
  }
}