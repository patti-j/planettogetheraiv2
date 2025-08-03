import { eq, desc, and, or, sql } from "drizzle-orm";
import { db } from "./db.js";
import { widgets, dashboards, type InsertWidget, type Widget, type InsertDashboard, type Dashboard } from "../shared/new-schema.js";

export class NewWidgetStorage {
  // Widget CRUD operations
  async createWidget(widget: InsertWidget): Promise<Widget> {
    const [created] = await db.insert(widgets).values([widget]).returning();
    return created;
  }

  async getAllWidgets(): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(eq(widgets.isActive, true))
      .orderBy(desc(widgets.createdAt));
  }

  async getWidgetsByPlatform(platform: 'mobile' | 'desktop' | 'both'): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(
        and(
          eq(widgets.isActive, true),
          or(
            eq(widgets.targetPlatform, platform),
            eq(widgets.targetPlatform, 'both')
          )
        )
      )
      .orderBy(desc(widgets.createdAt));
  }

  async getWidgetById(id: number): Promise<Widget | null> {
    const [widget] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, id), eq(widgets.isActive, true)));
    return widget || null;
  }

  async updateWidget(id: number, updates: Partial<InsertWidget>): Promise<Widget | null> {
    const [updated] = await db
      .update(widgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(widgets.id, id))
      .returning();
    return updated || null;
  }

  async deleteWidget(id: number): Promise<boolean> {
    const [deleted] = await db
      .update(widgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(widgets.id, id))
      .returning();
    return !!deleted;
  }

  async getWidgetsByCategory(category: string): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(
        and(
          eq(widgets.isActive, true),
          eq(widgets.category, category)
        )
      )
      .orderBy(desc(widgets.createdAt));
  }

  async getWidgetsByType(type: string): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(
        and(
          eq(widgets.isActive, true),
          eq(widgets.type, type)
        )
      )
      .orderBy(desc(widgets.createdAt));
  }

  // Dashboard CRUD operations
  async createDashboard(dashboard: InsertDashboard): Promise<Dashboard> {
    const [created] = await db.insert(dashboards).values([dashboard]).returning();
    return created;
  }

  async getAllDashboards(): Promise<Dashboard[]> {
    return await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.isActive, true))
      .orderBy(desc(dashboards.createdAt));
  }

  async getDashboardsByPlatform(platform: 'mobile' | 'desktop' | 'both'): Promise<Dashboard[]> {
    return await db
      .select()
      .from(dashboards)
      .where(
        and(
          eq(dashboards.isActive, true),
          or(
            eq(dashboards.targetPlatform, platform),
            eq(dashboards.targetPlatform, 'both')
          )
        )
      )
      .orderBy(desc(dashboards.createdAt));
  }

  async getDashboardById(id: number): Promise<Dashboard | null> {
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(and(eq(dashboards.id, id), eq(dashboards.isActive, true)));
    return dashboard || null;
  }

  async updateDashboard(id: number, updates: Partial<InsertDashboard>): Promise<Dashboard | null> {
    const [updated] = await db
      .update(dashboards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dashboards.id, id))
      .returning();
    return updated || null;
  }

  async deleteDashboard(id: number): Promise<boolean> {
    const [deleted] = await db
      .update(dashboards)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dashboards.id, id))
      .returning();
    return !!deleted;
  }

  // Utility methods
  async getWidgetsForDashboard(dashboardId: number): Promise<Widget[]> {
    // Get dashboard configuration to find widget IDs
    const dashboard = await this.getDashboardById(dashboardId);
    if (!dashboard || !dashboard.configuration?.widgets) {
      return [];
    }

    const widgetIds = dashboard.configuration.widgets.map(w => w.widgetId);
    if (widgetIds.length === 0) return [];

    return await db
      .select()
      .from(widgets)
      .where(
        and(
          eq(widgets.isActive, true),
          sql`${widgets.id} = ANY(${widgetIds})`
        )
      );
  }

  async seedSampleWidgets(): Promise<void> {
    const sampleWidgets: InsertWidget[] = [
      {
        title: "Production Overview",
        type: "metric",
        targetPlatform: "both",
        dataSource: "production_orders",
        dataQuery: {
          aggregation: "count",
          filters: { status: "active" }
        },
        visualization: {
          displayFormat: "number",
          colors: ["#3b82f6"]
        },
        layout: {
          width: 300,
          height: 200,
          x: 0,
          y: 0
        },
        category: "production",
        description: "Total active production orders"
      },
      {
        title: "Equipment Status",
        type: "chart",
        targetPlatform: "both",
        dataSource: "resources",
        dataQuery: {
          groupBy: "status",
          aggregation: "count"
        },
        visualization: {
          chartType: "doughnut",
          colors: ["#10b981", "#f59e0b", "#ef4444"],
          showLegend: true
        },
        layout: {
          width: 400,
          height: 300,
          x: 320,
          y: 0
        },
        category: "equipment",
        description: "Current status of all equipment"
      },
      {
        title: "Quality Metrics",
        type: "gauge",
        targetPlatform: "both",
        dataSource: "quality",
        dataQuery: {
          aggregation: "avg",
          filters: { type: "quality_score" }
        },
        visualization: {
          displayFormat: "percentage",
          thresholds: [
            { value: 70, color: "#ef4444", label: "Poor" },
            { value: 85, color: "#f59e0b", label: "Good" },
            { value: 95, color: "#10b981", label: "Excellent" }
          ]
        },
        layout: {
          width: 300,
          height: 300,
          x: 0,
          y: 220
        },
        category: "quality",
        description: "Real-time quality score"
      },
      {
        title: "Inventory Levels",
        type: "chart",
        targetPlatform: "both",
        dataSource: "inventory",
        dataQuery: {
          groupBy: "category",
          aggregation: "sum",
          orderBy: { field: "quantity", direction: "desc" },
          limit: 10
        },
        visualization: {
          chartType: "bar",
          colors: ["#8b5cf6", "#06b6d4", "#84cc16"],
          showLabels: true
        },
        layout: {
          width: 400,
          height: 300,
          x: 320,
          y: 220
        },
        category: "inventory",
        description: "Current inventory levels by category"
      }
    ];

    await db.insert(widgets).values(sampleWidgets);
  }

  async seedSampleDashboards(): Promise<void> {
    const sampleDashboards: InsertDashboard[] = [
      {
        title: "Factory Overview",
        description: "Real-time production metrics and equipment status",
        targetPlatform: "both",
        layout: {
          type: "grid",
          columns: 12,
          rowHeight: 100,
          margin: [10, 10]
        },
        configuration: {
          widgets: [
            { widgetId: 1, x: 0, y: 0, w: 6, h: 2 },
            { widgetId: 2, x: 6, y: 0, w: 6, h: 3 },
            { widgetId: 3, x: 0, y: 2, w: 6, h: 3 },
            { widgetId: 4, x: 6, y: 3, w: 6, h: 3 }
          ]
        },
        category: "operational",
        isDefault: true
      },
      {
        title: "Production Planning",
        description: "Schedule management and resource allocation",
        targetPlatform: "desktop",
        layout: {
          type: "grid",
          columns: 12,
          rowHeight: 80
        },
        configuration: {
          widgets: [
            { widgetId: 1, x: 0, y: 0, w: 12, h: 2 },
            { widgetId: 2, x: 0, y: 2, w: 8, h: 4 },
            { widgetId: 4, x: 8, y: 2, w: 4, h: 4 }
          ]
        },
        category: "planning"
      },
      {
        title: "Quality Control",
        description: "Quality metrics and testing results",
        targetPlatform: "both",
        layout: {
          type: "grid",
          columns: 12,
          rowHeight: 100
        },
        configuration: {
          widgets: [
            { widgetId: 3, x: 0, y: 0, w: 12, h: 4 }
          ]
        },
        category: "quality"
      }
    ];

    await db.insert(dashboards).values(sampleDashboards);
  }
}

export const newWidgetStorage = new NewWidgetStorage();