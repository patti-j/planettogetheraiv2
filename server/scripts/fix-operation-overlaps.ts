#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fixOperationOverlaps() {
  console.log('🔧 Starting operation overlap fix...');

  try {
    // Get all operations with their resource assignments, ordered by current scheduled_start
    const operations = await sql(`
      SELECT 
        o.id,
        o.name,
        o.scheduled_start,
        o.scheduled_end,
        o.cycle_hrs,
        o.setup_hours,
        o.post_processing_hours,
        jr.default_resource_id as resource_id
      FROM ptjoboperations o
      LEFT JOIN ptjobresources jr ON o.id = jr.operation_id
      WHERE jr.default_resource_id IS NOT NULL
      ORDER BY jr.default_resource_id, o.scheduled_start NULLS LAST, o.id
    `);

    console.log(`📊 Found ${operations.length} operations to reschedule`);

    // Group operations by resource
    const operationsByResource: Record<string, typeof operations> = {};
    for (const op of operations) {
      const resourceId = op.resource_id;
      if (!operationsByResource[resourceId]) {
        operationsByResource[resourceId] = [];
      }
      operationsByResource[resourceId].push(op);
    }

    // Base start time for scheduling (September 3, 2025, 7:00 AM)
    const baseStartTime = new Date('2025-09-03T07:00:00');
    
    // Track updates to make
    const updates: Array<{ id: number; start: Date; end: Date }> = [];

    // Schedule operations for each resource sequentially
    for (const [resourceId, resourceOps] of Object.entries(operationsByResource)) {
      console.log(`\n📋 Scheduling ${resourceOps.length} operations for resource ${resourceId}`);
      
      let currentTime = new Date(baseStartTime);
      
      for (const op of resourceOps) {
        // Calculate operation duration in hours
        const setupHours = parseFloat(op.setup_hours) || 0;
        const cycleHours = parseFloat(op.cycle_hrs) || 0;
        const postHours = parseFloat(op.post_processing_hours) || 0;
        const totalHours = setupHours + cycleHours + postHours;
        
        // Default to 2 hours if no duration specified
        const durationHours = totalHours > 0 ? totalHours : 2;
        
        // Set the start time for this operation
        const opStart = new Date(currentTime);
        
        // Calculate end time
        const opEnd = new Date(opStart);
        opEnd.setHours(opEnd.getHours() + durationHours);
        
        updates.push({
          id: op.id,
          start: opStart,
          end: opEnd
        });
        
        console.log(`  - ${op.name}: ${opStart.toISOString()} to ${opEnd.toISOString()} (${durationHours}h)`);
        
        // Move current time to after this operation ends plus a 30-minute buffer
        currentTime = new Date(opEnd);
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
    }

    // Apply all updates to the database
    console.log(`\n🚀 Applying ${updates.length} updates to database...`);
    
    for (const update of updates) {
      await sql(`
        UPDATE ptjoboperations 
        SET 
          scheduled_start = $1,
          scheduled_end = $2
        WHERE id = $3
      `, [update.start, update.end, update.id]);
    }

    // Verify no overlaps remain
    const overlapsCheck = await sql(`
      SELECT COUNT(*) as overlap_count
      FROM ptjoboperations o1
      JOIN ptjobresources jr1 ON o1.id = jr1.operation_id
      JOIN ptjoboperations o2 ON o2.id != o1.id
      JOIN ptjobresources jr2 ON o2.id = jr2.operation_id
      WHERE jr1.default_resource_id = jr2.default_resource_id
        AND jr1.default_resource_id IS NOT NULL
        AND o1.scheduled_start < o2.scheduled_end 
        AND o2.scheduled_start < o1.scheduled_end
        AND o1.id < o2.id
    `);

    const overlapCount = overlapsCheck[0]?.overlap_count || 0;
    
    if (overlapCount === 0) {
      console.log('✅ Success! All overlaps have been eliminated.');
    } else {
      console.log(`⚠️ Warning: ${overlapCount} overlaps still remain. Manual review needed.`);
    }

    // Show a summary of the new schedule
    const summary = await sql(`
      SELECT 
        jr.default_resource_id as resource_id,
        COUNT(*) as operation_count,
        MIN(o.scheduled_start) as earliest_start,
        MAX(o.scheduled_end) as latest_end
      FROM ptjoboperations o
      JOIN ptjobresources jr ON o.id = jr.operation_id
      WHERE jr.default_resource_id IS NOT NULL
      GROUP BY jr.default_resource_id
      ORDER BY jr.default_resource_id
    `);

    console.log('\n📊 Schedule Summary by Resource:');
    for (const row of summary) {
      console.log(`  ${row.resource_id}: ${row.operation_count} operations, ${row.earliest_start} to ${row.latest_end}`);
    }

  } catch (error) {
    console.error('❌ Error fixing operation overlaps:', error);
    process.exit(1);
  }
}

// Run the fix
fixOperationOverlaps().then(() => {
  console.log('\n🎉 Operation overlap fix complete!');
  process.exit(0);
});