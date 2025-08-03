import { neon, neonConfig } from '@neondatabase/serverless';
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

// Create Neon connection
const sql_connection = neon(process.env.DATABASE_URL);

// Add connection monitoring
let connectionCount = 0;
let queryCount = 0;
let errorCount = 0;

export const db = drizzle(sql_connection, { schema });

// Export direct SQL connection for fallback queries
export const directSql = sql_connection;

// Database metrics for monitoring
export const getDbMetrics = () => ({
  connectionCount,
  queryCount,
  errorCount,
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