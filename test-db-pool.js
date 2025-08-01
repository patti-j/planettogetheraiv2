// Simple test script to verify database connection pooling
import { Pool } from '@neondatabase/serverless';

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 5, // Small pool for testing
  min: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

async function testConnectionPool() {
  console.log('🧪 Testing Database Connection Pool...');
  
  try {
    // Test multiple concurrent connections
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(testQuery(i));
    }
    
    const results = await Promise.all(promises);
    console.log('✅ All queries completed successfully');
    results.forEach((result, index) => {
      console.log(`   Query ${index}: ${result}ms`);
    });
    
    // Check pool metrics
    console.log('\n📊 Pool Metrics:');
    console.log(`   Total connections: ${pool.totalCount}`);
    console.log(`   Idle connections: ${pool.idleCount}`);
    console.log(`   Waiting clients: ${pool.waitingCount}`);
    
  } catch (error) {
    console.error('❌ Pool test failed:', error.message);
  } finally {
    await pool.end();
    console.log('🔚 Pool closed');
  }
}

async function testQuery(queryId) {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT $1 as test_id, NOW() as timestamp', [queryId]);
    const responseTime = Date.now() - start;
    console.log(`   ✓ Query ${queryId} completed in ${responseTime}ms`);
    return responseTime;
  } finally {
    client.release();
  }
}

// Run the test
testConnectionPool().catch(console.error);