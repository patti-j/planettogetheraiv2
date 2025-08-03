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


}