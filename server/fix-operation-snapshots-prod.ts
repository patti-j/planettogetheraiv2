#!/usr/bin/env tsx
// Fix missing operation_snapshots column in production schedule_versions table
import { neon } from '@neondatabase/serverless';

async function fixOperationSnapshotsColumn() {
  const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;
  
  if (!PRODUCTION_DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(PRODUCTION_DATABASE_URL);
  
  console.log('🔧 Adding missing operation_snapshots column to production schedule_versions table...');
  
  try {
    // Add the missing column
    await sql`
      ALTER TABLE schedule_versions 
      ADD COLUMN IF NOT EXISTS operation_snapshots JSONB;
    `;
    
    console.log('✅ Successfully added operation_snapshots column!');
    
    // Verify the column was added
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'schedule_versions' 
      AND column_name = 'operation_snapshots';
    `;
    
    if (columns.length > 0) {
      console.log('✅ Verified: operation_snapshots column exists with type:', columns[0].data_type);
    } else {
      console.log('⚠️ Warning: Column was not found after creation attempt');
    }
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
  
  console.log('✅ Production database fix complete!');
}

// Run the fix
fixOperationSnapshotsColumn().catch(console.error);