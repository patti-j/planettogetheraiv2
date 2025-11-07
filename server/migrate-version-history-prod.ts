import { neon } from '@neondatabase/serverless';

// Migrate version history tables to production
async function migrateVersionHistoryToProduction() {
  console.log('🔄 Migrating version history schema to production...\n');
  
  if (!process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ Missing PRODUCTION_DATABASE_URL');
    process.exit(1);
  }
  
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  
  try {
    // Step 1: Create schedule_versions table in production
    console.log('📝 Creating schedule_versions table in production...');
    await prodSql`
      CREATE TABLE IF NOT EXISTS schedule_versions (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER,
        version_number INTEGER,
        checksum VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        parent_version_id INTEGER,
        source VARCHAR(50),
        comment TEXT,
        version_tag VARCHAR(50),
        snapshot_data JSONB,
        metrics JSONB
      )
    `;
    console.log('✅ schedule_versions table created in production');
    
    // Step 2: Add missing columns to ptjoboperations in production
    console.log('\n📝 Adding missing columns to ptjoboperations in production...');
    
    // Check existing columns
    const columns = await prodSql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ptjoboperations'
      AND table_schema = 'public'
    `;
    
    const columnNames = columns.map(c => c.column_name);
    console.log(`  Found ${columnNames.length} existing columns in ptjoboperations`);
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'manually_scheduled', type: 'BOOLEAN DEFAULT false' },
      { name: 'constraint_type', type: 'VARCHAR(50)' },
      { name: 'constraint_date', type: 'TIMESTAMP' },
      { name: 'time_optimistic', type: 'NUMERIC' },
      { name: 'time_most_likely', type: 'NUMERIC' },
      { name: 'time_pessimistic', type: 'NUMERIC' },
      { name: 'time_expected', type: 'NUMERIC' },
      { name: 'time_variance', type: 'NUMERIC' },
      { name: 'time_std_dev', type: 'NUMERIC' }
    ];
    
    let addedCount = 0;
    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log(`  Adding column: ${col.name}`);
        // Use template literal directly for DDL statements
        await prodSql(`ALTER TABLE ptjoboperations ADD COLUMN ${col.name} ${col.type}`);
        addedCount++;
      } else {
        console.log(`  Column already exists: ${col.name}`);
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ Added ${addedCount} new columns to ptjoboperations`);
    } else {
      console.log('✅ All columns already exist in ptjoboperations');
    }
    
    // Step 3: Verify the migration
    console.log('\n📊 Verifying production migration:');
    
    const tableCount = await prodSql`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'schedule_versions'
      AND table_schema = 'public'
    `;
    
    const colCount = await prodSql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name = 'ptjoboperations' 
      AND column_name = 'manually_scheduled'
      AND table_schema = 'public'
    `;
    
    const totalCols = await prodSql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name = 'ptjoboperations'
      AND table_schema = 'public'
    `;
    
    console.log('  ✅ schedule_versions table exists:', tableCount[0].count > 0);
    console.log('  ✅ manually_scheduled column exists:', colCount[0].count > 0);
    console.log('  ✅ Total columns in ptjoboperations:', totalCols[0].count);
    
    // Check if we can query the tables
    const versionTest = await prodSql`SELECT COUNT(*) as count FROM schedule_versions`;
    console.log('  ✅ schedule_versions table is queryable, rows:', versionTest[0].count);
    
    const opsTest = await prodSql`
      SELECT COUNT(*) as count 
      FROM ptjoboperations 
      WHERE manually_scheduled IS NOT NULL 
         OR manually_scheduled IS NULL
    `;
    console.log('  ✅ ptjoboperations with new columns is queryable, rows:', opsTest[0].count);
    
    console.log('\n🎉 Version history migration to production complete!');
    console.log('   Production database now supports:');
    console.log('   - Schedule version tracking');
    console.log('   - Enhanced operation scheduling columns');
    console.log('   - Time estimation fields (optimistic/pessimistic/expected)');
    console.log('   - Constraint-based scheduling support');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  }
}

// Run migration
migrateVersionHistoryToProduction().catch(console.error);