#!/usr/bin/env tsx

/**
 * Test script for Production Scheduling Agent
 * This script sends various queries to the agent and records actual responses
 */

import { productionSchedulingAgent } from './services/agents/production-scheduling-agent.service.js';
import type { AgentContext } from './services/agents/base-agent.service.js';
import * as fs from 'fs';
import * as path from 'path';

// Test queries to send to the agent
const testQueries = [
  "list jobs with their priorities and need by dates",
  "show me all jobs",
  "which jobs are high priority?",
  "what jobs are due this week?",
  "show me overdue jobs",
  "what's the status of jobs?",
  "tell me about job IPA Batch 001",
  "what operations are in job MO-001?",
  "show completed jobs",
  "jobs due today",
  "run ASAP optimization",
  "apply JIT scheduling",
  "what's the priority of MO-001?",
  "show jobs",
  "list all jobs"
];

// Create mock context for testing
const mockContext: AgentContext = {
  userId: 4, // Patti's user ID
  username: 'patti',
  sessionId: 'test-session',
  permissions: ['production_scheduling.view', 'production_scheduling.edit'],
  metadata: {}
};

async function runTests() {
  console.log('🧪 Starting Production Scheduling Agent Tests...\n');
  
  // Initialize the agent (it's already a singleton)
  const agent = productionSchedulingAgent;
  await agent.initialize();
  
  const results: string[] = [];
  results.push('# Production Scheduling Agent - Actual Test Results');
  results.push(`## Test Date: ${new Date().toLocaleString()}`);
  results.push('## Actual responses from the Production Scheduling Agent\n');
  results.push('---\n');
  
  // Run each test query
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n📝 Test ${i + 1}/${testQueries.length}: "${query}"`);
    
    try {
      // Call the agent with the query
      const response = await agent.process(query, mockContext);
      
      // Format the result
      results.push(`## Test ${i + 1}: "${query}"\n`);
      results.push('**Actual Response:**');
      results.push('```');
      results.push(response.content);
      results.push('```');
      
      if (response.error) {
        results.push(`⚠️ **Error Status:** ${response.error}`);
      }
      
      results.push('\n---\n');
      
      console.log('✅ Response received');
      console.log('Response preview:', response.content.substring(0, 100) + '...');
      
    } catch (error: any) {
      console.error(`❌ Error in test ${i + 1}:`, error.message);
      
      results.push(`## Test ${i + 1}: "${query}"\n`);
      results.push('**Error:**');
      results.push('```');
      results.push(`Error: ${error.message}`);
      results.push('```');
      results.push('\n---\n');
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Add summary
  results.push('## Test Summary\n');
  results.push(`- Total queries tested: ${testQueries.length}`);
  results.push(`- Test completed at: ${new Date().toLocaleString()}`);
  results.push(`- Agent: ProductionSchedulingAgentService`);
  results.push(`- User context: ${mockContext.username} (ID: ${mockContext.userId})`);
  
  // Write results to file
  const outputPath = path.join(process.cwd(), 'production-agent-actual-results.md');
  fs.writeFileSync(outputPath, results.join('\n'));
  
  console.log(`\n✅ Test complete! Results saved to: ${outputPath}`);
  console.log(`📊 Total tests run: ${testQueries.length}`);
  
  // Exit cleanly
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});