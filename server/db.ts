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
function getDatabaseUrl(): string | null {
  // Check if running in Replit deployment (production)
  if (process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production') {
    // Try PRODUCTION_DATABASE_URL first (for deployed environments)
    if (process.env.PRODUCTION_DATABASE_URL) {
      console.log('✅ Using PRODUCTION_DATABASE_URL in production deployment');
      return process.env.PRODUCTION_DATABASE_URL;
    }
    
    // Fallback to DATABASE_URL if PRODUCTION_DATABASE_URL not available
    if (process.env.DATABASE_URL) {
      console.log('⚠️ Using DATABASE_URL in production (fallback) - Consider setting PRODUCTION_DATABASE_URL');
      return process.env.DATABASE_URL;
    }
    
    // Otherwise, try to read from secure file storage
    try {
      const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf8').trim();
      if (dbUrl) {
        console.log('📁 Using database URL from secure storage in production');
        return dbUrl;
      }
    } catch (error) {
      // Silent fail - will be handled below
    }
    
    console.error('❌ DATABASE CONNECTION ERROR: No database URL found in production');
    console.error('   Please set PRODUCTION_DATABASE_URL in Deployment secrets:');
    console.error('   1. Go to Publishing → Settings → Secrets');
    console.error('   2. Add PRODUCTION_DATABASE_URL with your Neon database connection string');
    console.error('   3. Format: postgresql://user:password@host/database?sslmode=require');
    return null;
  }
  
  // In development
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in development environment');
    console.error('   Please provision a database using the Database pane');
    return null;
  }
  
  return process.env.DATABASE_URL;
}

// Get the database URL using the appropriate method
const databaseUrl = getDatabaseUrl();

// Initialize variables for database connection
let sql_connection: any = null;
let dbConnectionFailed = false;

// Only try to connect if we have a database URL
if (databaseUrl) {
  try {
    // Log masked database info for debugging (without exposing password)
    const url = new URL(databaseUrl);
    const maskedUrl = `${url.protocol}//${url.username}:***@${url.host}${url.pathname}`;
    console.log(`🔗 [Database] Attempting connection to: ${maskedUrl}`);
    console.log(`📍 [Database] Host: ${url.host}`);
    console.log(`📁 [Database] Database name: ${url.pathname.replace('/', '')}`);
    
    // Create Neon connection
    sql_connection = neon(databaseUrl);
  } catch (e) {
    console.error('❌ Failed to create database connection:', e);
    dbConnectionFailed = true;
  }
} else {
  console.warn('⚠️ Database connection skipped - no URL available');
  console.warn('   The application will run with limited functionality');
  dbConnectionFailed = true;
}

// Create a mock connection for when database is unavailable
const mockConnection = () => {
  return async (query: any, ...params: any[]) => {
    console.warn('⚠️ Database query attempted but connection unavailable');
    throw new Error('Database connection not available. Please configure PRODUCTION_DATABASE_URL in deployment settings.');
  };
};

// Add connection monitoring
let connectionCount = 0;
let queryCount = 0;
let errorCount = 0;

// Use the actual connection if available, otherwise use mock
const activeConnection = sql_connection || mockConnection();

export const db = dbConnectionFailed ? null : drizzle(activeConnection, {
  schema: { ...schema, ...alertsSchema, ...timeTrackingSchema },
  logger: process.env.NODE_ENV === 'development'
});

// Type for the database when it's known to be non-null
export type DbType = NonNullable<typeof db>;

// Type-safe database accessor - throws if db is null
// Use this in route handlers after requireDbMiddleware has verified db availability
export function getDb(): DbType {
  if (!db) {
    throw new Error('Database connection not available. Please configure PRODUCTION_DATABASE_URL in deployment settings.');
  }
  return db;
}

// Export direct SQL connection for fallback queries
export const directSql = activeConnection;

// Export connection status for health checks
export const isDbConnected = () => !dbConnectionFailed;

// Database metrics for monitoring
export const getDbMetrics = () => ({
  connectionCount,
  queryCount,
  errorCount,
});

// Database health check function
export const checkDbHealth = async () => {
  // If database connection is not available, return unhealthy status
  if (!db) {
    return {
      healthy: false,
      error: 'Database connection not initialized. Please configure PRODUCTION_DATABASE_URL.',
      timestamp: new Date().toISOString(),
      metrics: getDbMetrics(),
    };
  }
  
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