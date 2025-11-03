#!/usr/bin/env tsx

/**
 * Test script for ASAP/ALAP scheduling algorithms
 * This script tests the scheduling algorithms directly in the agent service
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

async function testAlgorithms() {
  console.log('🧪 Testing ASAP/ALAP Scheduling Algorithms...\n');
  
  // Initialize the agent
  const agent = productionSchedulingAgent;
  await agent.initialize();
  
  // Test queries
  const testQueries = [
    { query: "run asap algorithm", expectedAlgorithm: "ASAP" },
    { query: "optimize schedule", expectedAlgorithm: "ASAP" },
    { query: "minimize lead times", expectedAlgorithm: "ASAP" },
    { query: "run alap scheduling", expectedAlgorithm: "ALAP" },
    { query: "apply just in time", expectedAlgorithm: "ALAP" },
    { query: "minimize inventory", expectedAlgorithm: "ALAP" }
  ];
  
  console.log('📊 Current Schedule Status:');
  
  // Check current operations status
  const operations = await db.execute(sql`
    SELECT 
      COUNT(*) as total_ops,
      COUNT(scheduled_start) as scheduled_ops
    FROM ptjoboperations
  `);
  
  console.log(`Total operations: ${operations.rows[0].total_ops}`);
  console.log(`Scheduled operations: ${operations.rows[0].scheduled_ops}\n`);
  
  // Test each algorithm query
  for (const test of testQueries) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Testing: "${test.query}"`);
    console.log(`Expected Algorithm: ${test.expectedAlgorithm}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      const response = await agent.process(test.query, mockContext);
      
      console.log('\n✅ Response received:');
      console.log('─────────────────────');
      console.log(response.content);
      
      if (response.error) {
        console.log(`\n⚠️ Error flag: ${response.error}`);
      }
      
      // Check if operations were actually scheduled
      const afterOps = await db.execute(sql`
        SELECT 
          COUNT(*) as total_ops,
          COUNT(scheduled_start) as scheduled_ops
        FROM ptjoboperations
      `);
      
      console.log('\n📊 After Algorithm:');
      console.log(`Scheduled operations: ${afterOps.rows[0].scheduled_ops}/${afterOps.rows[0].total_ops}`);
      
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
    }
  }
  
  // Final check - sample some scheduled operations
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📅 Sample of Scheduled Operations:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const scheduledSample = await db.execute(sql`
    SELECT 
      jo.name as operation_name,
      j.name as job_name,
      jo.scheduled_start,
      jo.scheduled_end
    FROM ptjoboperations jo
    INNER JOIN ptjobs j ON jo.job_id = j.id
    WHERE jo.scheduled_start IS NOT NULL
    ORDER BY jo.scheduled_start
    LIMIT 5
  `);
  
  for (const op of scheduledSample.rows) {
    const start = op.scheduled_start ? new Date(op.scheduled_start).toLocaleString() : 'Not scheduled';
    const end = op.scheduled_end ? new Date(op.scheduled_end).toLocaleString() : 'Not scheduled';
    console.log(`\n${op.job_name} - ${op.operation_name}:`);
    console.log(`  Start: ${start}`);
    console.log(`  End:   ${end}`);
  }
  
  console.log('\n✅ Algorithm testing complete!\n');
  process.exit(0);
}

// Run the tests
testAlgorithms().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});