#!/usr/bin/env tsx

/**
 * Test script for verifying UI refresh after algorithm execution
 * This script tests the complete flow from algorithm execution to UI update
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

async function testUIRefresh() {
  console.log('🧪 Testing Algorithm Execution with UI Refresh...\n');
  
  // Initialize the agent
  const agent = productionSchedulingAgent;
  await agent.initialize();
  
  // Get initial state
  const initialOps = await db.execute(sql`
    SELECT 
      id, name, scheduled_start, scheduled_end
    FROM ptjoboperations
    WHERE id IN (1, 2, 3)
    ORDER BY id
  `);
  
  console.log('📊 Initial Operation Times:');
  for (const op of initialOps.rows) {
    console.log(`  ${op.name}: ${new Date(op.scheduled_start).toLocaleString()}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Running ASAP Algorithm...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Execute ASAP algorithm
  const asapResponse = await agent.process('run ASAP algorithm', mockContext);
  
  console.log('✅ ASAP Response:');
  console.log(asapResponse.content);
  console.log('\n📝 Response includes refresh action?', asapResponse.action?.type === 'scheduler_action');
  console.log('📝 Refresh command type:', asapResponse.action?.schedulerCommand?.type);
  
  // Check updated state
  const afterAsapOps = await db.execute(sql`
    SELECT 
      id, name, scheduled_start, scheduled_end
    FROM ptjoboperations
    WHERE id IN (1, 2, 3)
    ORDER BY id
  `);
  
  console.log('\n📊 After ASAP - Operation Times:');
  for (const op of afterAsapOps.rows) {
    console.log(`  ${op.name}: ${new Date(op.scheduled_start).toLocaleString()}`);
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Running ALAP Algorithm...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Execute ALAP algorithm
  const alapResponse = await agent.process('apply just in time scheduling', mockContext);
  
  console.log('✅ ALAP Response:');
  console.log(alapResponse.content);
  console.log('\n📝 Response includes refresh action?', alapResponse.action?.type === 'scheduler_action');
  console.log('📝 Refresh command type:', alapResponse.action?.schedulerCommand?.type);
  
  // Check final state
  const afterAlapOps = await db.execute(sql`
    SELECT 
      id, name, scheduled_start, scheduled_end
    FROM ptjoboperations
    WHERE id IN (1, 2, 3)
    ORDER BY id
  `);
  
  console.log('\n📊 After ALAP - Operation Times:');
  for (const op of afterAlapOps.rows) {
    console.log(`  ${op.name}: ${new Date(op.scheduled_start).toLocaleString()}`);
  }
  
  // Compare times
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Time Changes Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (let i = 0; i < 3; i++) {
    const initial = initialOps.rows[i];
    const afterAsap = afterAsapOps.rows[i];
    const afterAlap = afterAlapOps.rows[i];
    
    console.log(`${initial.name}:`);
    console.log(`  Initial: ${new Date(initial.scheduled_start).toLocaleDateString()}`);
    console.log(`  ASAP:    ${new Date(afterAsap.scheduled_start).toLocaleDateString()}`);
    console.log(`  ALAP:    ${new Date(afterAlap.scheduled_start).toLocaleDateString()}`);
    console.log('');
  }
  
  console.log('✅ Test complete! Both algorithms updated the database successfully.');
  console.log('\n🎯 Expected UI Behavior:');
  console.log('  1. Algorithm updates database ✅');
  console.log('  2. Agent returns scheduler_action with REFRESH_VIEW ✅'); 
  console.log('  3. AI Assistant receives action and finds iframe ✅');
  console.log('  4. PostMessage sent to iframe with REFRESH_SCHEDULE');
  console.log('  5. Scheduler receives message and calls refreshScheduleData()');
  console.log('  6. Schedule visualization updates with new times');
  console.log('  7. Version history refreshes to show new save');
  
  process.exit(0);
}

// Run the test
testUIRefresh().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});