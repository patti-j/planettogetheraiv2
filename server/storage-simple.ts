import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { 
  plants, capabilities, resources, users, productionOrders,
  type Plant, type Capability, type Resource, type User, type ProductionOrder,
  type InsertPlant, type InsertCapability, type InsertResource, 
  type InsertUser, type InsertProductionOrder
} from "../shared/schema-simple";

// Use HTTP connection instead of WebSocket for better compatibility
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class SimpleStorage {
  // Plants
  async getPlants(): Promise<Plant[]> {
    try {
      const result = await db.select().from(plants);
      console.log('Plants query successful, found:', result.length);
      return result;
    } catch (error) {
      console.error('Database error in getPlants:', error);
      throw error;
    }
  }

  async getPlant(id: number): Promise<Plant | null> {
    const result = await db.select().from(plants).where(eq(plants.id, id));
    return result[0] || null;
  }

  async createPlant(data: InsertPlant): Promise<Plant> {
    const result = await db.insert(plants).values(data).returning();
    return result[0];
  }

  // Capabilities
  async getCapabilities(): Promise<Capability[]> {
    return await db.select().from(capabilities);
  }

  async createCapability(data: InsertCapability): Promise<Capability> {
    const result = await db.insert(capabilities).values(data).returning();
    return result[0];
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    try {
      const result = await db.select().from(resources);
      console.log('Resources query successful, found:', result.length);
      return result;
    } catch (error) {
      console.error('Database error in getResources:', error);
      throw error;
    }
  }

  async createResource(data: InsertResource): Promise<Resource> {
    const result = await db.insert(resources).values(data).returning();
    return result[0];
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || null;
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  // Production Orders
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return await db.select().from(productionOrders);
  }

  async getProductionOrder(id: number): Promise<ProductionOrder | null> {
    const result = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return result[0] || null;
  }

  async createProductionOrder(data: InsertProductionOrder): Promise<ProductionOrder> {
    const result = await db.insert(productionOrders).values(data).returning();
    return result[0];
  }
}

export const storage = new SimpleStorage();