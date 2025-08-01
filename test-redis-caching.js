// Comprehensive Redis Caching Test Suite
// Phase 1 Step 2: Redis Implementation Testing

import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

async function runComprehensiveRedisTests() {
  console.log('🧪 Starting Comprehensive Redis Caching Tests...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Basic Connection
  await runTest('Basic Redis Connection', async () => {
    await redis.ping();
    console.log('   ✓ Redis server responds to PING');
  }, testResults);

  // Test 2: Session Caching
  await runTest('Session Caching Performance', async () => {
    const sessionId = 'test_session_123';
    const sessionData = {
      userId: 'user_123',
      username: 'testuser',
      isDemo: false,
      loginTime: new Date().toISOString(),
      permissions: ['read', 'write', 'admin']
    };

    // Set session
    const setStart = Date.now();
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData));
    const setTime = Date.now() - setStart;
    console.log(`   ✓ Session stored in ${setTime}ms`);

    // Get session
    const getStart = Date.now();
    const retrievedData = await redis.get(`session:${sessionId}`);
    const getTime = Date.now() - getStart;
    console.log(`   ✓ Session retrieved in ${getTime}ms`);

    const parsedData = JSON.parse(retrievedData);
    if (parsedData.userId !== sessionData.userId) {
      throw new Error('Session data mismatch');
    }
    console.log('   ✓ Session data integrity verified');

    // Cleanup
    await redis.del(`session:${sessionId}`);
    console.log('   ✓ Session cleanup successful');
  }, testResults);

  // Test 3: Query Result Caching
  await runTest('Query Result Caching', async () => {
    const queryKey = 'production_orders_summary';
    const mockQueryResult = {
      total: 150,
      completed: 75,
      inProgress: 45,
      pending: 30,
      lastUpdated: new Date().toISOString(),
      breakdown: {
        highPriority: 25,
        mediumPriority: 85,
        lowPriority: 40
      }
    };

    // Cache query result
    const cacheStart = Date.now();
    await redis.setex(`query:${queryKey}`, 300, JSON.stringify(mockQueryResult));
    const cacheTime = Date.now() - cacheStart;
    console.log(`   ✓ Query result cached in ${cacheTime}ms`);

    // Retrieve cached query
    const retrieveStart = Date.now();
    const cachedResult = await redis.get(`query:${queryKey}`);
    const retrieveTime = Date.now() - retrieveStart;
    console.log(`   ✓ Query result retrieved in ${retrieveTime}ms`);

    const parsedResult = JSON.parse(cachedResult);
    if (parsedResult.total !== mockQueryResult.total) {
      throw new Error('Query cache data mismatch');
    }
    console.log('   ✓ Query cache data integrity verified');

    // Test TTL
    const ttl = await redis.ttl(`query:${queryKey}`);
    if (ttl <= 0 || ttl > 300) {
      throw new Error('TTL not set correctly');
    }
    console.log(`   ✓ TTL correctly set (${ttl}s remaining)`);

    // Cleanup
    await redis.del(`query:${queryKey}`);
  }, testResults);

  // Test 4: Cache Invalidation
  await runTest('Cache Invalidation Patterns', async () => {
    // Create multiple cache entries
    await redis.setex('query:orders_daily', 300, JSON.stringify({ day: 'today', count: 50 }));
    await redis.setex('query:orders_weekly', 300, JSON.stringify({ week: 'current', count: 350 }));
    await redis.setex('query:orders_monthly', 300, JSON.stringify({ month: 'august', count: 1500 }));
    await redis.setex('query:inventory_summary', 300, JSON.stringify({ items: 250 }));
    console.log('   ✓ Multiple cache entries created');

    // Test pattern invalidation
    const orderKeys = await redis.keys('query:orders_*');
    if (orderKeys.length !== 3) {
      throw new Error(`Expected 3 order keys, found ${orderKeys.length}`);
    }
    console.log(`   ✓ Found ${orderKeys.length} order cache entries`);

    // Invalidate order-related caches
    await redis.del(...orderKeys);
    const remainingOrderKeys = await redis.keys('query:orders_*');
    if (remainingOrderKeys.length !== 0) {
      throw new Error('Order cache invalidation failed');
    }
    console.log('   ✓ Order cache entries invalidated');

    // Verify inventory cache still exists
    const inventoryExists = await redis.exists('query:inventory_summary');
    if (!inventoryExists) {
      throw new Error('Inventory cache incorrectly removed');
    }
    console.log('   ✓ Selective invalidation working correctly');

    // Cleanup
    await redis.del('query:inventory_summary');
  }, testResults);

  // Test 5: Concurrent Operations
  await runTest('Concurrent Cache Operations', async () => {
    const promises = [];
    const concurrentOps = 10;

    // Create concurrent cache operations
    for (let i = 0; i < concurrentOps; i++) {
      promises.push(
        redis.setex(`concurrent:test_${i}`, 60, JSON.stringify({ id: i, data: `test_data_${i}` }))
      );
    }

    const setStart = Date.now();
    await Promise.all(promises);
    const setTime = Date.now() - setStart;
    console.log(`   ✓ ${concurrentOps} concurrent writes completed in ${setTime}ms`);

    // Verify all entries exist
    const retrievePromises = [];
    for (let i = 0; i < concurrentOps; i++) {
      retrievePromises.push(redis.get(`concurrent:test_${i}`));
    }

    const retrieveStart = Date.now();
    const results = await Promise.all(retrievePromises);
    const retrieveTime = Date.now() - retrieveStart;
    console.log(`   ✓ ${concurrentOps} concurrent reads completed in ${retrieveTime}ms`);

    // Verify data integrity
    for (let i = 0; i < concurrentOps; i++) {
      const data = JSON.parse(results[i]);
      if (data.id !== i) {
        throw new Error(`Data integrity failed for entry ${i}`);
      }
    }
    console.log('   ✓ All concurrent operations maintained data integrity');

    // Cleanup
    const cleanupKeys = [];
    for (let i = 0; i < concurrentOps; i++) {
      cleanupKeys.push(`concurrent:test_${i}`);
    }
    await redis.del(...cleanupKeys);
  }, testResults);

  // Test 6: Memory Usage and Performance
  await runTest('Memory Usage and Performance Analysis', async () => {
    const info = await redis.info('memory');
    const usedMemoryMatch = info.match(/used_memory:(\d+)/);
    const usedMemory = usedMemoryMatch ? parseInt(usedMemoryMatch[1]) : 0;
    console.log(`   ✓ Current memory usage: ${(usedMemory / 1024 / 1024).toFixed(2)} MB`);

    // Performance test: Large data caching
    const largeData = {
      orders: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        orderNumber: `ORD-${i}`,
        customer: `Customer ${i}`,
        items: Array.from({ length: 5 }, (_, j) => ({ itemId: j, quantity: j + 1 }))
      }))
    };

    const largeCacheStart = Date.now();
    await redis.setex('performance:large_dataset', 300, JSON.stringify(largeData));
    const largeCacheTime = Date.now() - largeCacheStart;
    console.log(`   ✓ Large dataset (1000 orders) cached in ${largeCacheTime}ms`);

    const largeRetrieveStart = Date.now();
    const retrievedLargeData = await redis.get('performance:large_dataset');
    const largeRetrieveTime = Date.now() - largeRetrieveStart;
    console.log(`   ✓ Large dataset retrieved in ${largeRetrieveTime}ms`);

    const parsedLargeData = JSON.parse(retrievedLargeData);
    if (parsedLargeData.orders.length !== 1000) {
      throw new Error('Large dataset integrity check failed');
    }
    console.log('   ✓ Large dataset integrity verified');

    // Cleanup
    await redis.del('performance:large_dataset');
  }, testResults);

  // Test Results Summary
  console.log('\n📊 Redis Caching Test Results:');
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📝 Total:  ${testResults.total}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

  if (testResults.failed === 0) {
    console.log('🎉 All Redis caching tests passed! Phase 1 Step 2 implementation verified.');
  } else {
    console.log('⚠️  Some tests failed. Review implementation before proceeding.');
  }

  await redis.quit();
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

// Run the comprehensive test suite
runComprehensiveRedisTests().catch(console.error);