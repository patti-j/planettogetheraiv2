import { eq, and, desc, or } from "drizzle-orm";
import { DatabaseStorage } from "./storage.js";
import { unifiedWidgets, type InsertUnifiedWidget, type UnifiedWidget } from "../shared/schema.js";

export class WidgetStorage extends DatabaseStorage {
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
  async getWidgetsByPlatform(platform: 'mobile' | 'desktop' | 'both'): Promise<SelectUnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        and(
          eq(unifiedWidgets.isActive, true),
          eq(unifiedWidgets.targetPlatform, platform)
        )
      )
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  // Get widget by ID
  async getWidgetById(id: number): Promise<SelectUnifiedWidget | null> {
    const [widget] = await this.db
      .select()
      .from(unifiedWidgets)
      .where(and(
        eq(unifiedWidgets.id, id),
        eq(unifiedWidgets.isActive, true)
      ));
    return widget || null;
  }

  // Update widget
  async updateWidget(id: number, updates: Partial<InsertUnifiedWidget>): Promise<SelectUnifiedWidget | null> {
    const [updated] = await this.db
      .update(unifiedWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return updated || null;
  }

  // Soft delete widget
  async deleteWidget(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .update(unifiedWidgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return !!deleted;
  }

  // Get widgets by category
  async getWidgetsByCategory(category: string): Promise<SelectUnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        and(
          eq(unifiedWidgets.isActive, true),
          eq(unifiedWidgets.category, category)
        )
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
        type: "production-metrics",
        category: "production",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { metrics: ["output", "efficiency", "quality"] },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Equipment Status",
        type: "equipment-status", 
        category: "equipment",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { equipment: ["reactor1", "mixer2", "packaging"] },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Quality Metrics",
        type: "quality-dashboard",
        category: "quality",
        targetPlatform: "both",
        source: "canvas",
        configuration: { tests: ["pH", "temperature", "purity"] },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Inventory Levels",
        type: "inventory-tracking",
        category: "inventory",
        targetPlatform: "both",
        source: "canvas",
        configuration: { materials: ["raw_materials", "wip", "finished_goods"] },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Schedule Gantt",
        type: "gantt-chart",
        category: "scheduling",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { view: "weekly", resources: ["all"] },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Operation Sequencer",
        type: "operation-sequencer",
        category: "scheduling",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { view: "list", maxOperations: 20 },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "ATP/CTP Calculator",
        type: "atp-ctp",
        category: "planning",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { showDetails: true, compact: false },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "ATP Overview",
        type: "atp-ctp",
        category: "planning", 
        targetPlatform: "both",
        source: "cockpit",
        configuration: { showDetails: false, compact: true },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Schedule Optimizer",
        type: "schedule-optimizer",
        category: "scheduling",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { showOptimizer: true },
        version: "1.0.0",
        createdBy: "system"
      },
      {
        title: "Production Order Status",
        type: "production-order-status",
        category: "production",
        targetPlatform: "both",
        source: "cockpit",
        configuration: { showMetrics: true, refreshInterval: 30000 },
        version: "1.0.0",
        createdBy: "system"
      }
    ];

    for (const widget of seedData) {
      await this.createWidget(widget);
    }

    console.log(`Seeded ${seedData.length} widgets successfully`);
  }
}