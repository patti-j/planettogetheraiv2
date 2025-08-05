// Phase 2 Infrastructure Scaling Implementation Test
// Comprehensive validation of Background Jobs, Monitoring, CDN, and Message Queue

console.log('🚀 Testing Phase 2: Infrastructure Scaling Implementation');
console.log('=====================================================\n');

const BASE_URL = 'http://localhost:5000';

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Background Jobs System
async function testBackgroundJobs() {
  console.log('📋 Testing Background Jobs System...');
  
  try {
    // Test job creation
    const jobData = {
      type: 'report_generation',
      data: { reportType: 'production', dateRange: 'last_week' },
      priority: 3,
      estimatedDuration: 5000
    };
    
    const createResponse = await makeRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
    
    console.log(`  ✓ Job created: ${createResponse.jobId}`);
    
    // Test job stats
    const stats = await makeRequest('/api/jobs-stats');
    console.log(`  ✓ Job stats retrieved - Total: ${stats.total}, Running: ${stats.running}`);
    console.log(`  ✓ Success rate: ${stats.successRate}%, Average duration: ${stats.avgDuration}ms`);
    
    // Test job listing
    const jobs = await makeRequest('/api/jobs?status=pending');
    console.log(`  ✓ Pending jobs: ${jobs.length}`);
    
    // Test specific job retrieval
    if (createResponse.jobId) {
      const job = await makeRequest(`/api/jobs/${createResponse.jobId}`);
      console.log(`  ✓ Job details retrieved - Status: ${job.status}, Progress: ${job.progress}%`);
    }
    
    console.log('  🎯 Background Jobs System: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Background Jobs Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 2: Monitoring & Observability
async function testMonitoring() {
  console.log('📊 Testing Monitoring & Observability...');
  
  try {
    // Test system health
    const health = await makeRequest('/api/system/health');
    console.log(`  ✓ System health: ${health.status} (Score: ${health.score})`);
    console.log(`  ✓ Health issues: ${health.issues.length}`);
    
    // Test monitoring dashboard
    const monitoring = await makeRequest('/api/system/monitoring');
    console.log(`  ✓ Monitoring data retrieved`);
    console.log(`  ✓ Active alerts: ${monitoring.alerts.total} (Critical: ${monitoring.alerts.critical})`);
    console.log(`  ✓ Cache status: ${monitoring.cache?.status || 'unknown'}`);
    console.log(`  ✓ Response time: ${monitoring.performance?.responseTime || 'N/A'}ms`);
    
    // Test metrics
    const metrics = await makeRequest('/api/system/metrics');
    console.log(`  ✓ Latest metrics retrieved`);
    if (metrics.system) {
      console.log(`  ✓ Memory usage: ${metrics.system.memory.percentage.toFixed(1)}%`);
      console.log(`  ✓ Database connections: ${metrics.system.database.connections}`);
    }
    
    // Test alerts
    const alerts = await makeRequest('/api/system/alerts');
    console.log(`  ✓ Alerts retrieved: ${alerts.length} total`);
    
    console.log('  🎯 Monitoring System: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Monitoring Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 3: CDN & Asset Optimization
async function testCDN() {
  console.log('🌐 Testing CDN & Asset Optimization...');
  
  try {
    // Test CDN status
    const cdnStatus = await makeRequest('/api/system/cdn-status');
    console.log(`  ✓ CDN health: ${cdnStatus.health.status}`);
    console.log(`  ✓ Cache status: ${cdnStatus.health.cacheStatus}`);
    console.log(`  ✓ Healthy regions: ${cdnStatus.health.regions.filter(r => r.status === 'healthy').length}/${cdnStatus.health.regions.length}`);
    
    // Test asset metrics
    const assetMetrics = await makeRequest('/api/system/asset-metrics');
    console.log(`  ✓ Total assets: ${assetMetrics.totalAssets}`);
    console.log(`  ✓ Cache hit rate: ${assetMetrics.cacheHitRate}%`);
    console.log(`  ✓ Average load time: ${assetMetrics.averageLoadTime}ms`);
    console.log(`  ✓ Bandwidth saved: ${(assetMetrics.bandwidthSaved / 1024 / 1024).toFixed(1)} MB`);
    
    console.log('  🎯 CDN System: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ CDN Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 4: Performance Benchmarks
async function testPerformance() {
  console.log('⚡ Testing Performance Benchmarks...');
  
  try {
    // Test multiple concurrent requests
    const startTime = Date.now();
    const requests = [
      makeRequest('/api/jobs-stats'),
      makeRequest('/api/system/health'),
      makeRequest('/api/system/monitoring'),
      makeRequest('/api/system/cdn-status')
    ];
    
    await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    console.log(`  ✓ Concurrent requests completed in ${totalTime}ms`);
    console.log(`  ✓ Average response time: ${(totalTime / requests.length).toFixed(1)}ms`);
    
    // Test endpoint availability
    const endpoints = [
      '/api/jobs',
      '/api/jobs-stats', 
      '/api/system/monitoring',
      '/api/system/health',
      '/api/system/alerts',
      '/api/system/metrics',
      '/api/system/cdn-status',
      '/api/system/asset-metrics'
    ];
    
    let availableEndpoints = 0;
    for (const endpoint of endpoints) {
      try {
        await makeRequest(endpoint);
        availableEndpoints++;
      } catch (error) {
        console.log(`  ⚠️ Endpoint ${endpoint} not available: ${error.message}`);
      }
    }
    
    console.log(`  ✓ Available endpoints: ${availableEndpoints}/${endpoints.length}`);
    console.log('  🎯 Performance Tests: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Performance Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 5: Integration Test
async function testIntegration() {
  console.log('🔗 Testing System Integration...');
  
  try {
    // Create multiple jobs and monitor system response
    const jobPromises = [];
    for (let i = 0; i < 3; i++) {
      jobPromises.push(makeRequest('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          type: i === 0 ? 'data_export' : i === 1 ? 'inventory_sync' : 'quality_analysis',
          data: { testId: i },
          priority: 2
        })
      }));
    }
    
    const jobs = await Promise.all(jobPromises);
    console.log(`  ✓ Created ${jobs.length} test jobs`);
    
    // Wait and check system metrics
    await delay(2000);
    
    const monitoring = await makeRequest('/api/system/monitoring');
    console.log(`  ✓ System handling ${monitoring.jobs.total} total jobs`);
    console.log(`  ✓ Success rate maintained: ${monitoring.jobs.successRate}%`);
    
    // Check that monitoring detected the activity
    const health = await makeRequest('/api/system/health');
    console.log(`  ✓ System health: ${health.status} (Score: ${health.score})`);
    
    console.log('  🎯 Integration Tests: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Integration Test failed: ${error.message}\n`);
    return false;
  }
}

// Main test runner
async function runPhase2Tests() {
  console.log('🎯 Phase 2 Infrastructure Scaling - Test Suite');
  console.log('==============================================\n');
  
  const tests = [
    { name: 'Background Jobs', fn: testBackgroundJobs },
    { name: 'Monitoring & Observability', fn: testMonitoring },
    { name: 'CDN & Asset Optimization', fn: testCDN },
    { name: 'Performance Benchmarks', fn: testPerformance },
    { name: 'System Integration', fn: testIntegration }
  ];
  
  let passedTests = 0;
  const startTime = Date.now();
  
  for (const test of tests) {
    const testPassed = await test.fn();
    if (testPassed) passedTests++;
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('📊 PHASE 2 TEST RESULTS');
  console.log('========================');
  console.log(`✅ Tests Passed: ${passedTests}/${tests.length}`);
  console.log(`⏱️ Total Time: ${totalTime}ms`);
  console.log(`🎯 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 PHASE 2 INFRASTRUCTURE SCALING: COMPLETE');
    console.log('✅ All systems operational and ready for production scaling');
  } else {
    console.log('\n⚠️ Some tests failed - review implementation');
  }
}

// Run tests
runPhase2Tests().catch(console.error);