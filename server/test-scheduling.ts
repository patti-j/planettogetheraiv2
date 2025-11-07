#!/usr/bin/env tsx
import { AlgorithmRegistry } from './services/optimization/algorithm-registry';
import type { ScheduleDataPayload } from '../shared/schema';

// Test the ASAP algorithm with brewery operations
async function testScheduling() {
  console.log('🧪 Testing ASAP Scheduling Algorithm with Brewery Operations');
  console.log('=' .repeat(60));
  
  const registry = AlgorithmRegistry.getInstance();
  
  // Sample brewery operations for IPA Batch
  const testData: ScheduleDataPayload = {
    operations: [
      { id: '1', name: 'Grain Milling', jobId: 'job1', job_id: 'job1', sequence_number: 1, duration: 75, resourceId: 'grain-mill' },
      { id: '2', name: 'Mashing', jobId: 'job1', job_id: 'job1', sequence_number: 2, duration: 90, resourceId: 'mash-tun' },
      { id: '3', name: 'Lautering', jobId: 'job1', job_id: 'job1', sequence_number: 3, duration: 60, resourceId: 'lauter-tun' },
      { id: '4', name: 'Boiling & Hopping', jobId: 'job1', job_id: 'job1', sequence_number: 4, duration: 90, resourceId: 'brew-kettle' },
      { id: '5', name: 'Whirlpool', jobId: 'job1', job_id: 'job1', sequence_number: 5, duration: 30, resourceId: 'whirlpool' },
      { id: '6', name: 'Cooling', jobId: 'job1', job_id: 'job1', sequence_number: 6, duration: 45, resourceId: 'wort-cooler' },
      { id: '7', name: 'Primary Fermentation', jobId: 'job1', job_id: 'job1', sequence_number: 7, duration: 480, resourceId: 'fermentation-tank' },
      { id: '8', name: 'Conditioning', jobId: 'job1', job_id: 'job1', sequence_number: 8, duration: 360, resourceId: 'fermentation-tank' },
      { id: '9', name: 'Bottling', jobId: 'job1', job_id: 'job1', sequence_number: 9, duration: 180, resourceId: 'bottling-line' }
    ],
    resources: [
      { id: 'grain-mill', name: 'Grain Mill 1' },
      { id: 'mash-tun', name: 'Mash Tun 1' },
      { id: 'lauter-tun', name: 'Lauter Tun 1' },
      { id: 'brew-kettle', name: 'Brew Kettle 1' },
      { id: 'whirlpool', name: 'Whirlpool Tank 1' },
      { id: 'wort-cooler', name: 'Wort Cooler 1' },
      { id: 'fermentation-tank', name: 'Fermentation Tank 1' },
      { id: 'bottling-line', name: 'Bottling Line 1' }
    ],
    jobs: [],
    dependencies: []
  };
  
  console.log('\n📋 Input Operations:');
  testData.operations.forEach(op => {
    console.log(`  ${op.sequence_number}. ${op.name} (${op.duration} min) on ${op.resourceId}`);
  });
  
  // Execute ASAP algorithm
  console.log('\n🚀 Running ASAP Algorithm...');
  const result = registry.executeAlgorithm('asap', testData);
  
  console.log('\n✅ Scheduled Operations:');
  result.operations.forEach((op: any) => {
    const start = new Date(op.scheduled_start);
    const end = new Date(op.scheduled_end);
    console.log(`  ${op.sequence_number}. ${op.name}:`);
    console.log(`     Start: ${start.toISOString().slice(0, 16)}`);
    console.log(`     End:   ${end.toISOString().slice(0, 16)}`);
  });
  
  // Verify sequencing
  console.log('\n🔍 Verifying Operation Sequencing:');
  let allValid = true;
  for (let i = 1; i < result.operations.length; i++) {
    const prev = result.operations[i - 1];
    const curr = result.operations[i];
    
    if (prev.job_id === curr.job_id) {
      const prevEnd = new Date(prev.scheduled_end);
      const currStart = new Date(curr.scheduled_start);
      
      if (currStart < prevEnd) {
        console.log(`  ❌ ERROR: ${curr.name} starts before ${prev.name} ends!`);
        allValid = false;
      } else {
        console.log(`  ✅ ${prev.name} → ${curr.name} OK`);
      }
    }
  }
  
  if (allValid) {
    console.log('\n🎉 SUCCESS: All operations are properly sequenced!');
  } else {
    console.log('\n❌ FAILURE: Some operations are not properly sequenced!');
  }
}

testScheduling().catch(console.error);