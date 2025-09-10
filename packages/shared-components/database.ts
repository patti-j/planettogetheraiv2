// Shared Database Connection Utilities for Federation Modules
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq, and, desc, gte, lte, between } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database connection singleton
let dbInstance: ReturnType<typeof drizzle> | null = null;
let connectionError: Error | null = null;

// Initialize database connection
export const initDatabase = () => {
  if (dbInstance) return dbInstance;
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    connectionError = new Error('DATABASE_URL environment variable is not set');
    console.error('[Database] Missing DATABASE_URL');
    return null;
  }

  try {
    const sqlConnection = neon(databaseUrl);
    dbInstance = drizzle(sqlConnection, { schema });
    connectionError = null;
    console.log('[Database] Connection established');
    return dbInstance;
  } catch (error) {
    connectionError = error instanceof Error ? error : new Error('Failed to connect to database');
    console.error('[Database] Connection failed:', connectionError.message);
    return null;
  }
};

// Get database instance with lazy initialization
export const getDb = () => {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
};

// Check database health
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const db = getDb();
    if (!db) return false;
    
    await db.execute(sql`SELECT 1 as health_check`);
    return true;
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return false;
  }
};

// PT Table Query Helpers
export const ptTables = {
  // Plant queries
  async getPlants() {
    const db = getDb();
    if (!db) return [];
    
    try {
      return await db.select().from(schema.ptPlants).where(eq(schema.ptPlants.isActive, true));
    } catch (error) {
      console.error('[Database] Error fetching plants:', error);
      return [];
    }
  },

  // Resource queries
  async getResources(plantId?: number) {
    const db = getDb();
    if (!db) return [];
    
    try {
      const conditions = plantId 
        ? and(eq(schema.ptResources.plantId, plantId), eq(schema.ptResources.isActive, true))
        : eq(schema.ptResources.isActive, true);
      
      return await db.select().from(schema.ptResources).where(conditions);
    } catch (error) {
      console.error('[Database] Error fetching resources:', error);
      return [];
    }
  },

  // Manufacturing Order queries
  async getManufacturingOrders(filters?: { plantId?: number; status?: string }) {
    const db = getDb();
    if (!db) return [];
    
    try {
      const conditions = [];
      conditions.push(eq(schema.ptManufacturingOrders.isActive, true));
      
      if (filters?.plantId) {
        conditions.push(eq(schema.ptManufacturingOrders.plantId, filters.plantId));
      }
      if (filters?.status) {
        conditions.push(eq(schema.ptManufacturingOrders.status, filters.status));
      }
      
      return await db.select()
        .from(schema.ptManufacturingOrders)
        .where(and(...conditions))
        .orderBy(desc(schema.ptManufacturingOrders.priority));
    } catch (error) {
      console.error('[Database] Error fetching manufacturing orders:', error);
      return [];
    }
  },

  // Job Operation queries
  async getJobOperations(filters?: { 
    plantId?: number; 
    manufacturingOrderId?: number;
    resourceId?: number;
    status?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const db = getDb();
    if (!db) return [];
    
    try {
      const conditions = [];
      conditions.push(eq(schema.ptJobOperations.isActive, true));
      
      if (filters?.plantId) {
        conditions.push(eq(schema.ptJobOperations.plantId, filters.plantId));
      }
      if (filters?.manufacturingOrderId) {
        conditions.push(eq(schema.ptJobOperations.manufacturingOrderId, filters.manufacturingOrderId));
      }
      if (filters?.resourceId) {
        conditions.push(eq(schema.ptJobOperations.resourceId, filters.resourceId));
      }
      if (filters?.status) {
        conditions.push(eq(schema.ptJobOperations.status, filters.status));
      }
      if (filters?.dateRange) {
        conditions.push(
          and(
            gte(schema.ptJobOperations.startDate, filters.dateRange.start),
            lte(schema.ptJobOperations.endDate, filters.dateRange.end)
          )
        );
      }
      
      return await db.select()
        .from(schema.ptJobOperations)
        .where(and(...conditions))
        .orderBy(schema.ptJobOperations.sequenceNumber);
    } catch (error) {
      console.error('[Database] Error fetching job operations:', error);
      return [];
    }
  },

  // Update operation status
  async updateOperationStatus(operationId: number, status: string, actualDates?: { start?: Date; end?: Date }) {
    const db = getDb();
    if (!db) return null;
    
    try {
      const updates: any = { status, updatedAt: new Date() };
      if (actualDates?.start) updates.actualStartDate = actualDates.start;
      if (actualDates?.end) updates.actualEndDate = actualDates.end;
      
      const [updated] = await db.update(schema.ptJobOperations)
        .set(updates)
        .where(eq(schema.ptJobOperations.id, operationId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('[Database] Error updating operation status:', error);
      return null;
    }
  },

  // Get resource utilization
  async getResourceUtilization(resourceId: number, dateRange: { start: Date; end: Date }) {
    const db = getDb();
    if (!db) return { utilization: 0, operations: [] };
    
    try {
      const operations = await db.select()
        .from(schema.ptJobOperations)
        .where(
          and(
            eq(schema.ptJobOperations.resourceId, resourceId),
            gte(schema.ptJobOperations.startDate, dateRange.start),
            lte(schema.ptJobOperations.endDate, dateRange.end),
            eq(schema.ptJobOperations.isActive, true)
          )
        );
      
      // Calculate utilization
      const totalHours = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60);
      let scheduledHours = 0;
      
      operations.forEach(op => {
        if (op.startDate && op.endDate) {
          const opHours = (op.endDate.getTime() - op.startDate.getTime()) / (1000 * 60 * 60);
          scheduledHours += opHours;
        }
      });
      
      const utilization = totalHours > 0 ? (scheduledHours / totalHours) * 100 : 0;
      
      return { utilization, operations };
    } catch (error) {
      console.error('[Database] Error calculating resource utilization:', error);
      return { utilization: 0, operations: [] };
    }
  },

  // Production Orders (simplified table)
  async getProductionOrders(filters?: { plantId?: number; status?: string }) {
    const db = getDb();
    if (!db) return [];
    
    try {
      const conditions = [];
      conditions.push(eq(schema.productionOrders.isActive, true));
      
      if (filters?.plantId) {
        conditions.push(eq(schema.productionOrders.plantId, filters.plantId));
      }
      if (filters?.status) {
        conditions.push(eq(schema.productionOrders.status, filters.status));
      }
      
      return await db.select()
        .from(schema.productionOrders)
        .where(and(...conditions))
        .orderBy(desc(schema.productionOrders.priority));
    } catch (error) {
      console.error('[Database] Error fetching production orders:', error);
      return [];
    }
  },
};

// Export database utilities
export { sql, eq, and, desc, gte, lte, between };
export type { schema };