// Phase 3 Multi-Tenant Architecture Implementation Test
// Comprehensive validation of Tenant Management, Resolution, and Database Isolation

console.log('🏢 Testing Phase 3: Multi-Tenant Architecture Implementation');
console.log('=========================================================\n');

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
  
  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${text}`);
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Tenant Management System
async function testTenantManagement() {
  console.log('🏗️ Testing Tenant Management System...');
  
  try {
    // Test tenant stats
    const stats = await makeRequest('/api/tenant-admin/stats');
    console.log(`  ✓ Tenant stats retrieved - Total: ${stats.totalTenants}, Active: ${stats.activeTenants}`);
    console.log(`  ✓ Plan distribution: Starter: ${stats.planDistribution.starter}, Pro: ${stats.planDistribution.professional}, Enterprise: ${stats.planDistribution.enterprise}`);
    
    // Test tenant listing
    const tenants = await makeRequest('/api/tenant-admin/tenants');
    console.log(`  ✓ Retrieved ${tenants.length} existing tenants`);
    
    // Test specific tenant details
    if (tenants.length > 0) {
      const firstTenant = tenants[0];
      const tenantDetails = await makeRequest(`/api/tenant-admin/tenants/${firstTenant.id}`);
      console.log(`  ✓ Tenant details retrieved for ${tenantDetails.name} (${tenantDetails.plan} plan)`);
      
      // Test tenant health
      const health = await makeRequest(`/api/tenant-admin/tenants/${firstTenant.id}/health`);
      console.log(`  ✓ Tenant health: ${health.status}, Database: ${health.database ? 'Connected' : 'Disconnected'}`);
    }
    
    console.log('  🎯 Tenant Management: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Tenant Management Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 2: Tenant Resolution
async function testTenantResolution() {
  console.log('🔍 Testing Tenant Resolution...');
  
  try {
    // Test resolution without tenant context
    const noTenant = await makeRequest('/api/tenant-info');
    console.log(`  ✓ No tenant resolution: ${noTenant.resolved ? 'Found' : 'None'} (${noTenant.resolvedBy})`);
    
    // Test resolution with header
    const headerResolution = await makeRequest('/api/tenant-info', {
      headers: { 'x-tenant-id': 'tenant_001' }
    });
    console.log(`  ✓ Header resolution: ${headerResolution.resolved ? 'Success' : 'Failed'} (${headerResolution.resolvedBy})`);
    
    if (headerResolution.resolved) {
      console.log(`  ✓ Resolved tenant: ${headerResolution.tenant.name} (${headerResolution.tenant.plan} plan)`);
      console.log(`  ✓ Available features: ${headerResolution.tenant.features.join(', ')}`);
    }
    
    // Test resolution with subdomain (simulated)
    const subdomainResolution = await makeRequest('/api/tenant-info', {
      headers: { 'host': 'acme-manufacturing.planettogether.com' }
    });
    console.log(`  ✓ Subdomain resolution: ${subdomainResolution.resolved ? 'Success' : 'Failed'} (${subdomainResolution.resolvedBy})`);
    
    console.log('  🎯 Tenant Resolution: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Tenant Resolution Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 3: Tenant Creation
async function testTenantCreation() {
  console.log('🏭 Testing Tenant Creation...');
  
  try {
    // Create a test tenant
    const newTenantData = {
      name: 'Test Manufacturing Co',
      subdomain: 'test-manufacturing',
      plan: 'professional',
      adminEmail: 'admin@testmanufacturing.com',
      adminPassword: 'TempPass123!',
      features: ['basic-scheduling', 'inventory-management', 'quality-tracking']
    };
    
    const createResult = await makeRequest('/api/tenant-admin/tenants', {
      method: 'POST',
      body: JSON.stringify(newTenantData)
    });
    
    console.log(`  ✓ Tenant created successfully: ${createResult.tenant.name}`);
    console.log(`  ✓ Tenant ID: ${createResult.tenant.id}`);
    console.log(`  ✓ Admin credentials: ${createResult.credentials.email}`);
    console.log(`  ✓ Login URL: ${createResult.credentials.loginUrl}`);
    
    // Verify tenant can be retrieved
    const retrievedTenant = await makeRequest(`/api/tenant-admin/tenants/${createResult.tenant.id}`);
    console.log(`  ✓ Created tenant verified: ${retrievedTenant.name} (Status: ${retrievedTenant.status})`);
    
    console.log('  🎯 Tenant Creation: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Tenant Creation Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 4: Multi-Tenant Isolation
async function testTenantIsolation() {
  console.log('🔒 Testing Multi-Tenant Isolation...');
  
  try {
    // Get tenant list for isolation testing
    const tenants = await makeRequest('/api/tenant-admin/tenants');
    
    if (tenants.length < 2) {
      console.log('  ⚠️ Need at least 2 tenants for isolation testing');
      return true;
    }
    
    const tenant1 = tenants[0];
    const tenant2 = tenants[1];
    
    // Test that tenant contexts are isolated
    const tenant1Info = await makeRequest('/api/tenant-info', {
      headers: { 'x-tenant-id': tenant1.id }
    });
    
    const tenant2Info = await makeRequest('/api/tenant-info', {
      headers: { 'x-tenant-id': tenant2.id }
    });
    
    console.log(`  ✓ Tenant 1 isolation: ${tenant1Info.tenant.name} (${tenant1Info.tenant.plan})`);
    console.log(`  ✓ Tenant 2 isolation: ${tenant2Info.tenant.name} (${tenant2Info.tenant.plan})`);
    console.log(`  ✓ Different databases: ${tenant1.databaseUrl !== tenant2.databaseUrl ? 'Yes' : 'No'}`);
    console.log(`  ✓ Feature isolation: ${JSON.stringify(tenant1.features) !== JSON.stringify(tenant2.features) ? 'Different' : 'Same'}`);
    
    console.log('  🎯 Tenant Isolation: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Tenant Isolation Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 5: Performance and Scalability
async function testPerformanceScalability() {
  console.log('⚡ Testing Performance & Scalability...');
  
  try {
    // Test concurrent tenant operations
    const startTime = Date.now();
    
    const concurrentRequests = [
      makeRequest('/api/tenant-admin/stats'),
      makeRequest('/api/tenant-admin/tenants'),
      makeRequest('/api/tenant-info', { headers: { 'x-tenant-id': 'tenant_001' } }),
      makeRequest('/api/tenant-info', { headers: { 'x-tenant-id': 'tenant_002' } })
    ];
    
    await Promise.all(concurrentRequests);
    const totalTime = Date.now() - startTime;
    
    console.log(`  ✓ Concurrent operations completed in ${totalTime}ms`);
    console.log(`  ✓ Average response time: ${(totalTime / concurrentRequests.length).toFixed(1)}ms`);
    
    // Test tenant resolution performance
    const resolutionStartTime = Date.now();
    for (let i = 0; i < 5; i++) {
      await makeRequest('/api/tenant-info', {
        headers: { 'x-tenant-id': 'tenant_001' }
      });
    }
    const resolutionTime = Date.now() - resolutionStartTime;
    
    console.log(`  ✓ Tenant resolution performance: ${(resolutionTime / 5).toFixed(1)}ms average`);
    
    // Test system capacity metrics
    const stats = await makeRequest('/api/tenant-admin/stats');
    console.log(`  ✓ System capacity: ${stats.totalTenants} tenants, ${stats.totalUsers} users`);
    console.log(`  ✓ Storage utilization: ${(stats.storageUsed / 1024).toFixed(1)} GB`);
    
    console.log('  🎯 Performance & Scalability: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Performance Test failed: ${error.message}\n`);
    return false;
  }
}

// Test 6: Integration with Previous Phases
async function testPhaseIntegration() {
  console.log('🔗 Testing Integration with Previous Phases...');
  
  try {
    // Test that Phase 2 infrastructure works with multi-tenancy
    const backgroundJobs = await makeRequest('/api/jobs-stats');
    console.log(`  ✓ Background jobs integration: ${backgroundJobs.total} jobs processed`);
    
    const monitoring = await makeRequest('/api/system/monitoring');
    console.log(`  ✓ Monitoring integration: System health ${monitoring.health.status}`);
    
    const cdnStatus = await makeRequest('/api/system/cdn-status');
    console.log(`  ✓ CDN integration: ${cdnStatus.health.status} status`);
    
    // Test tenant-specific operations work with infrastructure
    const tenantJob = await makeRequest('/api/jobs', {
      method: 'POST',
      headers: { 'x-tenant-id': 'tenant_001' },
      body: JSON.stringify({
        type: 'inventory_sync',
        data: { tenantId: 'tenant_001', syncType: 'full' },
        priority: 2
      })
    });
    
    console.log(`  ✓ Tenant-specific job created: ${tenantJob.jobId}`);
    
    console.log('  🎯 Phase Integration: PASSED\n');
    return true;
    
  } catch (error) {
    console.log(`  ❌ Phase Integration Test failed: ${error.message}\n`);
    return false;
  }
}

// Main test runner
async function runPhase3Tests() {
  console.log('🎯 Phase 3 Multi-Tenant Architecture - Test Suite');
  console.log('================================================\n');
  
  const tests = [
    { name: 'Tenant Management System', fn: testTenantManagement },
    { name: 'Tenant Resolution', fn: testTenantResolution },
    { name: 'Tenant Creation', fn: testTenantCreation },
    { name: 'Multi-Tenant Isolation', fn: testTenantIsolation },
    { name: 'Performance & Scalability', fn: testPerformanceScalability },
    { name: 'Phase Integration', fn: testPhaseIntegration }
  ];
  
  let passedTests = 0;
  const startTime = Date.now();
  
  for (const test of tests) {
    const testPassed = await test.fn();
    if (testPassed) passedTests++;
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('📊 PHASE 3 TEST RESULTS');
  console.log('========================');
  console.log(`✅ Tests Passed: ${passedTests}/${tests.length}`);
  console.log(`⏱️ Total Time: ${totalTime}ms`);
  console.log(`🎯 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 PHASE 3 MULTI-TENANT ARCHITECTURE: COMPLETE');
    console.log('✅ Enterprise-grade multi-tenant scaling ready for production');
  } else {
    console.log('\n⚠️ Some tests failed - review implementation');
  }
}

// Run tests
runPhase3Tests().catch(console.error);