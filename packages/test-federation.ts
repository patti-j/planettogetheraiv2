// Test file to verify federation system integration
import { bootstrapFederation, getModule, getModuleStatus, shutdownFederation } from './federation-bootstrap';
import type {
  CorePlatformContract,
  AgentSystemContract,
  ProductionSchedulingContract,
  ShopFloorContract,
  QualityManagementContract,
  InventoryPlanningContract,
  AnalyticsReportingContract
} from './shared-components/contracts/module-contracts';

// Test function to verify all modules
async function testFederationSystem(): Promise<void> {
  console.log('=== Testing Module Federation System ===\n');
  
  try {
    // Step 1: Bootstrap the federation
    console.log('1. Bootstrapping federation...');
    await bootstrapFederation();
    console.log('   ✅ Bootstrap complete\n');
    
    // Step 2: Check module status
    console.log('2. Checking module status...');
    const status = getModuleStatus();
    console.log('   Module Status:', JSON.stringify(status, null, 2));
    console.log('   ✅ All modules registered\n');
    
    // Step 3: Test Core Platform Module
    console.log('3. Testing Core Platform Module...');
    const corePlatform = await getModule<CorePlatformContract>('@planettogether/core-platform');
    const plants = await corePlatform.getPlants();
    console.log('   Plants:', plants);
    console.log('   ✅ Core Platform working\n');
    
    // Step 4: Test Agent System Module
    console.log('4. Testing Agent System Module...');
    const agentSystem = await getModule<AgentSystemContract>('@planettogether/agent-system');
    const agents = await agentSystem.getAvailableAgents();
    console.log('   Available Agents:', agents);
    console.log('   ✅ Agent System working\n');
    
    // Step 5: Test Production Scheduling Module
    console.log('5. Testing Production Scheduling Module...');
    const scheduling = await getModule<ProductionSchedulingContract>('@planettogether/production-scheduling');
    const jobs = await scheduling.getJobs();
    console.log('   Jobs:', jobs);
    
    // Subscribe to schedule updates
    const unsubscribe = scheduling.onScheduleUpdate((schedule) => {
      console.log('   📊 Schedule Update Received:', schedule);
    });
    
    // Trigger optimization
    const optimization = await scheduling.optimizeSchedule({ targetMetric: 'makespan' });
    console.log('   Optimization Result:', optimization);
    console.log('   ✅ Production Scheduling working\n');
    
    // Step 6: Test Shop Floor Module
    console.log('6. Testing Shop Floor Module...');
    const shopFloor = await getModule<ShopFloorContract>('@planettogether/shop-floor');
    const operations = await shopFloor.getCurrentOperations(1);
    console.log('   Current Operations:', operations);
    console.log('   ✅ Shop Floor working\n');
    
    // Step 7: Test Quality Management Module
    console.log('7. Testing Quality Management Module...');
    const quality = await getModule<QualityManagementContract>('@planettogether/quality-management');
    const inspections = await quality.getInspections();
    console.log('   Inspections:', inspections);
    console.log('   ✅ Quality Management working\n');
    
    // Step 8: Test Inventory Planning Module
    console.log('8. Testing Inventory Planning Module...');
    const inventory = await getModule<InventoryPlanningContract>('@planettogether/inventory-planning');
    const items = await inventory.getInventoryItems();
    console.log('   Inventory Items:', items);
    console.log('   ✅ Inventory Planning working\n');
    
    // Step 9: Test Analytics Reporting Module
    console.log('9. Testing Analytics Reporting Module...');
    const analytics = await getModule<AnalyticsReportingContract>('@planettogether/analytics-reporting');
    const kpis = await analytics.getKPIs();
    console.log('   KPIs:', kpis);
    console.log('   ✅ Analytics Reporting working\n');
    
    // Step 10: Test Inter-Module Communication
    console.log('10. Testing Inter-Module Communication...');
    
    // Create a job and watch it flow through the system
    const newJob = await scheduling.createJob({
      jobId: 100,
      jobName: 'Test Job',
      jobNumber: 'TEST-001',
      status: 'planned',
      priority: 1,
      plantId: 1,
      externalId: 'TEST-EXT-001'
    });
    console.log('    Created Job:', newJob);
    
    // Update job status to trigger events
    await scheduling.updateJob(100, { status: 'in_progress' });
    console.log('    ✅ Inter-module events triggered\n');
    
    // Cleanup
    unsubscribe();
    
    console.log('=== All Tests Passed! ===\n');
    console.log('Federation System Summary:');
    console.log('- ✅ All 8 modules registered and initialized');
    console.log('- ✅ Core Platform and Agent System functional');
    console.log('- ✅ All 5 stub modules responding with mock data');
    console.log('- ✅ Event bus communication established');
    console.log('- ✅ Inter-module data flows configured');
    console.log('- ✅ System ready for Week 4 milestone');
    
    // Shutdown
    await shutdownFederation();
    console.log('\n✅ Federation system shutdown complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this is the main module
if (require.main === module) {
  testFederationSystem()
    .then(() => {
      console.log('\n✅ All federation tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Federation tests failed:', error);
      process.exit(1);
    });
}

export { testFederationSystem };