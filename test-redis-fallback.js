// Redis Fallback Implementation Test
// Phase 1 Step 2: Comprehensive Caching Test with Fallback

async function testCachingImplementation() {
  console.log('🧪 Testing Phase 1 Step 2: Redis Caching Implementation\n');
  
  // Import the CacheManager from the server
  const { CacheManager } = await import('./server/redis.ts');
  const cacheManager = new CacheManager();
  
  let testResults = { passed: 0, failed: 0, total: 0 };

  // Test 1: Session Caching
  await runTest('Session Caching Functionality', async () => {
    const sessionId = 'test_session_123';
    const sessionData = {
      userId: 'user_123',
      username: 'testuser',
      role: 'production_scheduler',
      loginTime: new Date().toISOString()
    };

    await cacheManager.setSession(sessionId, sessionData, 300);
    console.log('   ✓ Session data stored');

    const retrievedSession = await cacheManager.getSession(sessionId);
    if (!retrievedSession || retrievedSession.userId !== sessionData.userId) {
      throw new Error('Session data mismatch');
    }
    console.log('   ✓ Session data retrieved correctly');

    await cacheManager.deleteSession(sessionId);
    const deletedSession = await cacheManager.getSession(sessionId);
    if (deletedSession !== null) {
      throw new Error('Session deletion failed');
    }
    console.log('   ✓ Session cleanup successful');
  }, testResults);

  // Test 2: Query Result Caching
  await runTest('Query Result Caching', async () => {
    const queryKey = 'production_orders_summary';
    const queryResult = {
      total: 150,
      completed: 75,
      inProgress: 45,
      pending: 30,
      lastUpdated: new Date().toISOString()
    };

    await cacheManager.cacheQueryResult(queryKey, queryResult, 300);
    console.log('   ✓ Query result cached');

    const cachedResult = await cacheManager.getCachedQuery(queryKey);
    if (!cachedResult || cachedResult.total !== queryResult.total) {
      throw new Error('Cached query result mismatch');
    }
    console.log('   ✓ Query result retrieved from cache');
  }, testResults);

  // Test 3: Cache Invalidation
  await runTest('Cache Invalidation', async () => {
    // Cache multiple entries
    await cacheManager.cacheQueryResult('orders_daily', { count: 50 }, 300);
    await cacheManager.cacheQueryResult('orders_weekly', { count: 350 }, 300);
    await cacheManager.cacheQueryResult('inventory_summary', { items: 250 }, 300);
    console.log('   ✓ Multiple cache entries created');

    // Test invalidation
    await cacheManager.invalidateCache('orders_');
    console.log('   ✓ Cache invalidation completed');

    // Verify specific entries are gone but others remain
    const dailyOrders = await cacheManager.getCachedQuery('orders_daily');
    const inventory = await cacheManager.getCachedQuery('inventory_summary');
    
    if (dailyOrders !== null) {
      throw new Error('Cache invalidation failed - daily orders still exists');
    }
    if (inventory === null) {
      throw new Error('Cache invalidation too broad - inventory was incorrectly removed');
    }
    console.log('   ✓ Selective cache invalidation working');
  }, testResults);

  // Test 4: Health Check
  await runTest('Cache Health Check', async () => {
    const health = await cacheManager.healthCheck();
    if (health.status !== 'healthy') {
      throw new Error(`Health check failed: ${health.error}`);
    }
    console.log(`   ✓ Cache health check passed (latency: ${health.latency}ms)`);
  }, testResults);

  // Test 5: Metrics Collection
  await runTest('Cache Metrics Collection', async () => {
    const metrics = await cacheManager.getMetrics();
    if (typeof metrics.connected !== 'boolean') {
      throw new Error('Invalid metrics format');
    }
    console.log(`   ✓ Metrics collected (connected: ${metrics.connected})`);
    if (metrics.connected) {
      console.log(`   ✓ Memory usage: ${metrics.usedMemory}`);
      console.log(`   ✓ Total keys: ${metrics.totalKeys}`);
    } else {
      console.log('   ✓ Using fallback cache implementation');
    }
  }, testResults);

  // Results Summary
  console.log('\n📊 Phase 1 Step 2 - Redis Caching Test Results:');
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📝 Total:  ${testResults.total}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

  if (testResults.failed === 0) {
    console.log('🎉 Phase 1 Step 2 implementation complete!');
    console.log('✅ Redis caching with fallback successfully implemented');
    console.log('✅ Session management optimized');
    console.log('✅ Query result caching operational');
    console.log('✅ Cache invalidation patterns working');
    console.log('✅ Health monitoring and metrics available');
    console.log('\n🚀 Ready to proceed to Phase 1 Step 3: Rate Limiting & Security');
  } else {
    console.log('⚠️  Some tests failed. Implementation needs review.');
  }
}

async function runTest(testName, testFunction, results) {
  results.total++;
  try {
    console.log(`🧪 Testing: ${testName}`);
    await testFunction();
    console.log(`   ✅ ${testName} PASSED\n`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ ${testName} FAILED: ${error.message}\n`);
    results.failed++;
  }
}

// Run the test
testCachingImplementation().catch(console.error);