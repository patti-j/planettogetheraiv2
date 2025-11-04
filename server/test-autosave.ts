#!/usr/bin/env tsx

/**
 * Test script for verifying auto-save after algorithm execution
 * This script tests that saved_schedules entries are created after running algorithms
 */

import { productionSchedulingAgent } from './services/agents/production-scheduling-agent.service.js';
import type { AgentContext } from './services/agents/base-agent.service.js';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

// Create mock context for testing
const mockContext: AgentContext = {
  userId: 4, // Patti's user ID
  username: 'patti',
  sessionId: 'test-session',
  permissions: ['production_scheduling.view', 'production_scheduling.edit'],
  metadata: {}
};

async function testAutoSave() {
  console.log('🧪 Testing Auto-Save After Algorithm Execution...\n');
  
  // Initialize the agent
  const agent = productionSchedulingAgent;
  await agent.initialize();
  
  // Get initial saved schedules count
  const initialSaves = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM saved_schedules
    WHERE user_id = ${mockContext.userId}
  `);
  
  const initialCount = Number(initialSaves.rows[0].count);
  console.log(`📊 Initial saved schedules for user ${mockContext.userId}: ${initialCount}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Running ASAP Algorithm...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Execute ASAP algorithm
  const asapResponse = await agent.process('run ASAP algorithm', mockContext);
  
  console.log('✅ ASAP Response:');
  console.log(asapResponse.content);
  
  // Wait a moment for the save to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if a new save was created
  const afterAsapSaves = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM saved_schedules
    WHERE user_id = ${mockContext.userId}
  `);
  
  const afterAsapCount = Number(afterAsapSaves.rows[0].count);
  console.log(`\n📊 Saved schedules after ASAP: ${afterAsapCount}`);
  
  if (afterAsapCount > initialCount) {
    console.log('✅ Auto-save created after ASAP!');
    
    // Get the latest save details
    const latestSave = await db.execute(sql`
      SELECT id, name, description, metadata
      FROM saved_schedules
      WHERE user_id = ${mockContext.userId}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (latestSave.rows && latestSave.rows.length > 0) {
      const save = latestSave.rows[0];
      console.log(`   Save ID: ${save.id}`);
      console.log(`   Name: ${save.name}`);
      console.log(`   Description: ${save.description}`);
      console.log(`   Metadata: ${JSON.stringify(save.metadata)}`);
    }
  } else {
    console.log('❌ No auto-save created after ASAP');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Running ALAP Algorithm...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Execute ALAP algorithm
  const alapResponse = await agent.process('apply just in time scheduling', mockContext);
  
  console.log('✅ ALAP Response:');
  console.log(alapResponse.content);
  
  // Wait a moment for the save to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if another new save was created
  const afterAlapSaves = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM saved_schedules
    WHERE user_id = ${mockContext.userId}
  `);
  
  const afterAlapCount = Number(afterAlapSaves.rows[0].count);
  console.log(`\n📊 Saved schedules after ALAP: ${afterAlapCount}`);
  
  if (afterAlapCount > afterAsapCount) {
    console.log('✅ Auto-save created after ALAP!');
    
    // Get the latest save details
    const latestSave = await db.execute(sql`
      SELECT id, name, description, metadata
      FROM saved_schedules
      WHERE user_id = ${mockContext.userId}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (latestSave.rows && latestSave.rows.length > 0) {
      const save = latestSave.rows[0];
      console.log(`   Save ID: ${save.id}`);
      console.log(`   Name: ${save.name}`);
      console.log(`   Description: ${save.description}`);
      console.log(`   Metadata: ${JSON.stringify(save.metadata)}`);
    }
  } else {
    console.log('❌ No auto-save created after ALAP');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Initial saves: ${initialCount}`);
  console.log(`After ASAP: ${afterAsapCount} (${afterAsapCount > initialCount ? '✅ Created' : '❌ Not created'})`);
  console.log(`After ALAP: ${afterAlapCount} (${afterAlapCount > afterAsapCount ? '✅ Created' : '❌ Not created'})`);
  console.log(`Total new saves: ${afterAlapCount - initialCount}`);
  
  console.log('\n✅ Test complete! Algorithm auto-save functionality has been tested.');
  
  process.exit(0);
}

// Run the test
testAutoSave().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});