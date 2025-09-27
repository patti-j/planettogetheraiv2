import { db } from "./db";
import { 
  users, plants, resources, productionOrders, widgets,
  type User, type Plant, type Resource, type ProductionOrder, type Widget,
  type InsertUser, type InsertPlant, type InsertResource, type InsertProductionOrder, type InsertWidget
} from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Plants
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;

  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;

  // Production Orders
  getProductionOrders(): Promise<ProductionOrder[]>;
  getProductionOrder(id: number): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;

  // Widgets
  getWidgets(): Promise<Widget[]>;
  getWidget(id: number): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: number, updates: Partial<InsertWidget>): Promise<Widget | undefined>;
  deleteWidget(id: number): Promise<boolean>;
  getWidgetsByPlatform(platform: string): Promise<Widget[]>;
  getWidgetsByCategory(category: string): Promise<Widget[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Plants
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants).orderBy(desc(plants.createdAt));
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const [plant] = await db.insert(plants).values(insertPlant).returning();
    return plant;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.id));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }

  // Production Orders
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return await db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt));
  }

  async getProductionOrder(id: number): Promise<ProductionOrder | undefined> {
    const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return order || undefined;
  }

  async createProductionOrder(insertOrder: InsertProductionOrder): Promise<ProductionOrder> {
    const [order] = await db.insert(productionOrders).values(insertOrder).returning();
    return order;
  }

  // Widgets
  async getWidgets(): Promise<UnifiedWidget[]> {
    return await db.select().from(unifiedWidgets).orderBy(desc(unifiedWidgets.createdAt));
  }

  async getWidget(id: number): Promise<UnifiedWidget | undefined> {
    const [widget] = await db.select().from(unifiedWidgets).where(eq(unifiedWidgets.id, id));
    return widget || undefined;
  }

  async createWidget(insertWidget: InsertUnifiedWidget): Promise<UnifiedWidget> {
    const [widget] = await db.insert(unifiedWidgets).values(insertWidget).returning();
    return widget;
  }

  async updateWidget(id: number, updates: Partial<InsertUnifiedWidget>): Promise<UnifiedWidget | undefined> {
    const [widget] = await db
      .update(unifiedWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return widget || undefined;
  }

  async deleteWidget(id: number): Promise<boolean> {
    const [deleted] = await db.delete(unifiedWidgets).where(eq(unifiedWidgets.id, id)).returning();
    return !!deleted;
  }

  async getWidgetsByPlatform(platform: string): Promise<UnifiedWidget[]> {
    return await db
      .select()
      .from(unifiedWidgets)
      .where(or(eq(unifiedWidgets.targetPlatform, platform), eq(unifiedWidgets.targetPlatform, 'both')))
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  async getWidgetsByCategory(category: string): Promise<UnifiedWidget[]> {
    return await db
      .select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.category, category))
      .orderBy(desc(unifiedWidgets.createdAt));
  }
}

export const storage = new DatabaseStorage();