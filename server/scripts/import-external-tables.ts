#!/usr/bin/env tsx
/**
 * External Database Table Import Script
 * 
 * This script connects to an external PlanetTogether database to import
 * missing PT table data into the local development database.
 * 
 * Usage:
 *   npx tsx server/scripts/import-external-tables.ts [table_name]
 * 
 * Example:
 *   npx tsx server/scripts/import-external-tables.ts ptresourcecapabilities
 */

import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { db } from '../db.js';

// Configuration
const EXTERNAL_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL;
const TABLE_TO_IMPORT = process.argv[2] || 'ptresourcecapabilities';

if (!EXTERNAL_DATABASE_URL) {
  console.error('❌ EXTERNAL_DATABASE_URL environment variable is required');
  process.exit(1);
}

const externalDb = neon(EXTERNAL_DATABASE_URL);

/**
 * Import specific PT table from external database
 */
async function importTable(tableName: string) {
  try {
    console.log(`🔍 Checking table: ${tableName}`);
    
    // Check if table exists locally
    const localCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = ${tableName}
    `);
    
    if (localCount.rows[0]?.count === '0') {
      console.log(`❌ Table ${tableName} does not exist locally`);
      return false;
    }

    // Check local record count
    const localRecordCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
    const localRecords = Number(localRecordCount.rows[0]?.count || 0);
    console.log(`📊 Local ${tableName} has ${localRecords} records`);

    // Connect to external database
    console.log(`✅ Connected to external database`);
    
    // Check external record count
    const externalRecordCount = await externalDb(`SELECT COUNT(*) as count FROM ${tableName}`);
    const externalRecords = Number(externalRecordCount[0]?.count || 0);
    console.log(`📊 External ${tableName} has ${externalRecords} records`);

    if (externalRecords === 0) {
      console.log(`📝 External table is empty, skipping import`);
      return false;
    }

    if (localRecords > 0) {
      console.log(`⚠️  Local table already has data, skipping import`);
      return false;
    }

    // Import data from external database
    console.log(`🔄 Importing ${externalRecords} records from external database...`);
    
    // Get all data from external table
    const externalData = await externalDb(`SELECT * FROM ${tableName} ORDER BY id`);
    
    if (externalData.length === 0) {
      console.log(`📝 No data to import`);
      return true;
    }

    // Get column information
    const columns = Object.keys(externalData[0]);
    console.log(`📋 Columns: ${columns.join(', ')}`);

    // Build INSERT statement
    const placeholders = externalData.map((_, index) => 
      `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');
    
    const values = externalData.flatMap(row => columns.map(col => row[col]));
    
    const insertQuery = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;

    await db.execute(sql.raw(insertQuery, ...values));
    
    console.log(`✅ Successfully imported ${externalData.length} records into ${tableName}`);
    return true;

  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error);
    return false;
  }
}

/**
 * Create default PT Resource Capabilities if table is empty
 */
async function createDefaultCapabilities() {
  try {
    console.log('🔧 Creating default resource capabilities...');

    // Capability mappings based on brewing operations
    const capabilityMappings = [
      { resource_id: 1, capability_id: 1, capability: 'MILLING' },        // Grain Mill
      { resource_id: 2, capability_id: 2, capability: 'MASHING' },        // Mash Tun 1
      { resource_id: 3, capability_id: 3, capability: 'LAUTERING' },      // Lauter Tun
      { resource_id: 4, capability_id: 4, capability: 'BOILING' },        // Brew Kettle 1
      { resource_id: 5, capability_id: 5, capability: 'FERMENTATION' },   // Fermenter Tank 1
      { resource_id: 6, capability_id: 5, capability: 'FERMENTATION' },   // Fermenter Tank 2
      { resource_id: 7, capability_id: 5, capability: 'FERMENTATION' },   // Fermenter Tank 3
      { resource_id: 8, capability_id: 6, capability: 'CONDITIONING' },   // Bright Tank 1
      { resource_id: 8, capability_id: 7, capability: 'DRY_HOPPING' },    // Bright Tank 1 (dual capability)
      { resource_id: 9, capability_id: 6, capability: 'CONDITIONING' },   // Bright Tank 2
      { resource_id: 9, capability_id: 7, capability: 'DRY_HOPPING' },    // Bright Tank 2 (dual capability)
      { resource_id: 10, capability_id: 8, capability: 'PACKAGING' },     // Bottle Filler Line
      { resource_id: 11, capability_id: 8, capability: 'PACKAGING' },     // Can Filler Line
      { resource_id: 12, capability_id: 9, capability: 'PASTEURIZATION' }, // Pasteurizer
    ];

    let nextId = 1;
    for (const mapping of capabilityMappings) {
      await db.execute(sql`
        INSERT INTO ptresourcecapabilities (
          id, publish_date, instance_id, resource_id, capability_id, 
          throughput_modifier, setup_hours_override, use_throughput_modifier, use_setup_hours_override
        ) VALUES (${nextId}, NOW(), 'DEFAULT', ${mapping.resource_id}, ${mapping.capability_id}, 1.0, 0.0, false, false)
      `);
      
      console.log(`✅ Added capability ${mapping.capability} to resource ${mapping.resource_id}`);
      nextId++;
    }

    console.log(`✅ Default capabilities created successfully`);
    return true;

  } catch (error) {
    console.error(`❌ Error creating default capabilities:`, error);
    return false;
  }
}

/**
 * Main import process
 */
async function main() {
  console.log(`🚀 Starting import process for table: ${TABLE_TO_IMPORT}`);
  
  const importSuccess = await importTable(TABLE_TO_IMPORT);
  
  // Special handling for ptresourcecapabilities table
  if (TABLE_TO_IMPORT === 'ptresourcecapabilities' && !importSuccess) {
    await createDefaultCapabilities();
  }
  
  console.log(`🎉 Import process completed`);
}

// Run the import if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { importTable, createDefaultCapabilities };