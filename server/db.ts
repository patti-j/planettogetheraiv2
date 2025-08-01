import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection pool configuration for better performance and monitoring
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections in pool
  min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum connections to maintain
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'), // 5 seconds
  // Performance monitoring
  log: process.env.NODE_ENV === 'development' ? console.log : undefined,
};

export const pool = new Pool(poolConfig);

// Add connection pool monitoring
let connectionCount = 0;
let queryCount = 0;
let errorCount = 0;

// Hook into pool events for monitoring
const originalConnect = pool.connect.bind(pool);
pool.connect = async function() {
  connectionCount++;
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 DB Pool: Active connections: ${connectionCount}`);
  }
  return originalConnect();
};

export const db = drizzle({ client: pool, schema });

// Database metrics for monitoring
export const getDbMetrics = () => ({
  totalConnections: pool.totalCount,
  idleConnections: pool.idleCount,
  waitingClients: pool.waitingCount,
  connectionCount,
  queryCount,
  errorCount,
  poolConfig: {
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeout: poolConfig.idleTimeoutMillis,
    connectionTimeout: poolConfig.connectionTimeoutMillis,
  }
});

// Database health check function
export const checkDbHealth = async () => {
  try {
    const start = Date.now();
    const result = await db.execute(sql`SELECT 1 as health_check`);
    const responseTime = Date.now() - start;
    
    return {
      healthy: true,
      responseTime,
      timestamp: new Date().toISOString(),
      metrics: getDbMetrics(),
    };
  } catch (error) {
    errorCount++;
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      metrics: getDbMetrics(),
    };
  }
};