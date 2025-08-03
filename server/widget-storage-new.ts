import { db } from "./db";
import { widgets, dashboards, type Widget, type Dashboard, type InsertWidget, type InsertDashboard } from "@shared/widget-schema";
import { eq } from "drizzle-orm";

export class WidgetStorage {
  // Widget methods
  async getWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets).where(eq(widgets.isActive, true));
  }

  async getWidget(id: number): Promise<Widget | undefined> {
    const result = await db.select().from(widgets).where(eq(widgets.id, id));
    return result[0];
  }

  async createWidget(widget: InsertWidget): Promise<Widget> {
    const result = await db.insert(widgets).values(widget).returning();
    return result[0];
  }

  async updateWidget(id: number, widget: Partial<InsertWidget>): Promise<Widget | undefined> {
    const result = await db.update(widgets)
      .set({ ...widget, updatedAt: new Date() })
      .where(eq(widgets.id, id))
      .returning();
    return result[0];
  }

  async deleteWidget(id: number): Promise<boolean> {
    const result = await db.update(widgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(widgets.id, id));
    return result.rowCount > 0;
  }

  // Dashboard methods
  async getDashboards(): Promise<Dashboard[]> {
    return await db.select().from(dashboards).where(eq(dashboards.isActive, true));
  }

  async getDashboard(id: number): Promise<Dashboard | undefined> {
    const result = await db.select().from(dashboards).where(eq(dashboards.id, id));
    return result[0];
  }

  async createDashboard(dashboard: InsertDashboard): Promise<Dashboard> {
    const result = await db.insert(dashboards).values(dashboard).returning();
    return result[0];
  }

  async updateDashboard(id: number, dashboard: Partial<InsertDashboard>): Promise<Dashboard | undefined> {
    const result = await db.update(dashboards)
      .set({ ...dashboard, updatedAt: new Date() })
      .where(eq(dashboards.id, id))
      .returning();
    return result[0];
  }

  async deleteDashboard(id: number): Promise<boolean> {
    const result = await db.update(dashboards)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dashboards.id, id));
    return result.rowCount > 0;
  }

  // Mobile-specific methods
  async getMobileWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets).where(eq(widgets.isActive, true));
  }

  async getMobileDashboards(): Promise<Dashboard[]> {
    return await db.select().from(dashboards).where(eq(dashboards.isActive, true));
  }
}

export const widgetStorage = new WidgetStorage();