import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema-simple";
import * as alertsSchema from "@shared/alerts-schema";
import * as timeTrackingSchema from "@shared/time-tracking-schema";
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

// Function to get database URL - handles both development and production
function getDatabaseUrl(): string {
  // Check if running in Replit deployment (production)
  if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
    // Try PRODUCTION_DATABASE_URL first (for deployed environments)
    if (process.env.PRODUCTION_DATABASE_URL) {
      console.log('Using PRODUCTION_DATABASE_URL in production deployment');
      return process.env.PRODUCTION_DATABASE_URL;
    }
    
    // Fallback to DATABASE_URL if PRODUCTION_DATABASE_URL not available
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL in production (fallback)');
      return process.env.DATABASE_URL;
    }
    
    // Otherwise, try to read from secure file storage
    try {
      const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf8').trim();
      if (dbUrl) {
        console.log('Using database URL from secure storage in production');
        return dbUrl;
      }
    } catch (error) {
      console.error('Failed to read production database URL from file:', error);
    }
    
    throw new Error(
      "DATABASE_URL must be set in production environment",
    );
  }
  
  // In development
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  return process.env.DATABASE_URL;
}

// Get the database URL using the appropriate method
const databaseUrl = getDatabaseUrl();

// Log masked database info for debugging (without exposing password)
try {
  const url = new URL(databaseUrl);
  const maskedUrl = `${url.protocol}//${url.username}:***@${url.host}${url.pathname}`;
  console.log(`🔗 [Database] Connecting to: ${maskedUrl}`);
  console.log(`📍 [Database] Host: ${url.host}`);
  console.log(`📁 [Database] Database name: ${url.pathname.replace('/', '')}`);
} catch (e) {
  console.log('🔗 [Database] Connection configured');
}

// Create Neon connection
const sql_connection = neon(databaseUrl);

// Add connection monitoring
let connectionCount = 0;
let queryCount = 0;
let errorCount = 0;

export const db = drizzle(sql_connection, {
  schema: { ...schema, ...alertsSchema, ...timeTrackingSchema },
  logger: process.env.NODE_ENV === 'development'
});

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