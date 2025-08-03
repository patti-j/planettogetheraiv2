import { eq, and, desc, or } from "drizzle-orm";
import { DatabaseStorage } from "./storage.js";
import { unifiedWidgets, widgetDeployments, type InsertUnifiedWidget, type UnifiedWidget } from "../shared/schema.js";

export class WidgetStorage {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  private get db() {
    return this.storage.db;
  }
  // Create a new widget
  async createWidget(widget: InsertUnifiedWidget): Promise<UnifiedWidget> {
    const [created] = await this.db.insert(unifiedWidgets).values(widget).returning();
    return created;
  }

  // Get all active widgets
  async getAllWidgets(): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  // Get widgets by platform
  async getWidgetsByPlatform(platform: 'mobile' | 'desktop' | 'both'): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        eq(unifiedWidgets.targetPlatform, platform)
      )
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  // Get widget by ID
  async getWidgetById(id: number): Promise<UnifiedWidget | null> {
    const [widget] = await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        eq(unifiedWidgets.id, id)
      );
    return widget || null;
  }

  // Update widget
  async updateWidget(id: number, updates: Partial<InsertUnifiedWidget>): Promise<UnifiedWidget | null> {
    const [updated] = await this.db
      .update(unifiedWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return updated || null;
  }

  // Delete widget (hard delete since schema doesn't have isActive)
  async deleteWidget(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(unifiedWidgets)
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return !!deleted;
  }

  // Get widgets by category
  async getWidgetsByCategory(category: string): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        eq(unifiedWidgets.category, category)
      )
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  // Seed initial widgets from current hardcoded data
  async seedWidgets(): Promise<void> {
    const existingWidgets = await this.getAllWidgets();
    if (existingWidgets.length > 0) {
      console.log('Widgets already seeded, skipping...');
      return;
    }

    const seedData: InsertUnifiedWidget[] = [
      {
        title: "Production Overview",
        widgetType: "production-metrics",
        category: "production", 
        targetPlatform: "both",
        dataSource: "jobs",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 0 },
        createdBy: 1
      },
      {
        title: "Equipment Status",
        widgetType: "equipment-status", 
        category: "equipment",
        targetPlatform: "both",
        dataSource: "resources",
        size: { width: 300, height: 200 },
        position: { x: 320, y: 0 },
        createdBy: 1
      },
      {
        title: "Quality Metrics",
        widgetType: "quality-dashboard",
        category: "quality",
        targetPlatform: "both",
        dataSource: "metrics",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 220 },
        createdBy: 1
      },
      {
        title: "Inventory Levels",
        widgetType: "inventory-tracking",
        category: "inventory",
        targetPlatform: "both",
        dataSource: "stocks",
        size: { width: 300, height: 200 },
        position: { x: 320, y: 220 },
        createdBy: 1
      },
      {
        title: "Schedule Gantt",
        widgetType: "gantt-chart",
        category: "scheduling",
        targetPlatform: "both",
        dataSource: "operations",
        size: { width: 640, height: 300 },
        position: { x: 0, y: 440 },
        createdBy: 1
      },
      {
        title: "Operation Sequencer",
        widgetType: "operation-sequencer",
        category: "scheduling",
        targetPlatform: "both",
        dataSource: "operations",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 760 },
        createdBy: 1
      },
      {
        title: "ATP/CTP Calculator",
        widgetType: "atp-ctp",
        category: "planning",
        targetPlatform: "both",
        dataSource: "jobs",
        size: { width: 300, height: 200 },
        position: { x: 320, y: 760 },
        createdBy: 1
      },
      {
        title: "ATP Overview",
        widgetType: "atp-ctp",
        category: "planning", 
        targetPlatform: "both",
        dataSource: "jobs",
        size: { width: 300, height: 150 },
        position: { x: 0, y: 980 },
        createdBy: 1
      },
      {
        title: "Schedule Optimizer",
        widgetType: "schedule-optimizer",
        category: "scheduling",
        targetPlatform: "both",
        dataSource: "operations",
        size: { width: 300, height: 150 },
        position: { x: 320, y: 980 },
        createdBy: 1
      },
      {
        title: "Production Order Status",
        widgetType: "production-order-status",
        category: "production",
        targetPlatform: "both",
        dataSource: "jobs",
        size: { width: 300, height: 200 },
        position: { x: 640, y: 760 },
        createdBy: 1
      },
      {
        title: "Operation Dispatch",
        widgetType: "operation-dispatch",
        category: "operations",
        targetPlatform: "both",
        dataSource: "operations",
        size: { width: 350, height: 400 },
        position: { x: 0, y: 1200 },
        createdBy: 1
      },
      {
        title: "Resource Assignment",
        widgetType: "resource-assignment", 
        category: "resources",
        targetPlatform: "both",
        dataSource: "resources",
        size: { width: 350, height: 400 },
        position: { x: 370, y: 1200 },
        createdBy: 1
      }
    ];

    for (const widget of seedData) {
      await this.createWidget(widget);
    }

    console.log(`Seeded ${seedData.length} widgets successfully`);
  }
}