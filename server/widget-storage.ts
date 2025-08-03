import { db } from "./db";
import { unifiedWidgets, widgetDeployments, type UnifiedWidget, type InsertUnifiedWidget, type WidgetDeployment, type InsertWidgetDeployment } from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export class WidgetStorage {
  // Create a new widget
  async createWidget(widget: InsertUnifiedWidget): Promise<UnifiedWidget> {
    const [newWidget] = await db.insert(unifiedWidgets).values(widget).returning();
    return newWidget;
  }

  // Get all widgets with optional platform filtering
  async getWidgets(targetPlatform?: string): Promise<UnifiedWidget[]> {
    if (targetPlatform && targetPlatform !== 'both') {
      return await db.select()
        .from(unifiedWidgets)
        .where(
          inArray(unifiedWidgets.targetPlatform, [targetPlatform, 'both'])
        );
    }
    return await db.select().from(unifiedWidgets);
  }

  // Get widget by ID
  async getWidgetById(id: number): Promise<UnifiedWidget | null> {
    const [widget] = await db.select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.id, id));
    return widget || null;
  }

  // Update widget
  async updateWidget(id: number, updates: Partial<InsertUnifiedWidget>): Promise<UnifiedWidget | null> {
    const [updated] = await db.update(unifiedWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return updated || null;
  }

  // Delete widget
  async deleteWidget(id: number): Promise<boolean> {
    const result = await db.delete(unifiedWidgets)
      .where(eq(unifiedWidgets.id, id));
    return result.count > 0;
  }

  // Deploy widget to a system
  async deployWidget(deployment: InsertWidgetDeployment): Promise<WidgetDeployment> {
    const [newDeployment] = await db.insert(widgetDeployments).values(deployment).returning();
    return newDeployment;
  }

  // Get deployments for a widget
  async getWidgetDeployments(widgetId: number): Promise<WidgetDeployment[]> {
    return await db.select()
      .from(widgetDeployments)
      .where(eq(widgetDeployments.widgetId, widgetId));
  }

  // Seed initial widgets from hardcoded data
  async seedWidgets(userId: number): Promise<void> {
    const existingWidgets = await this.getWidgets();
    if (existingWidgets.length > 0) {
      console.log("Widgets already seeded, skipping...");
      return;
    }

    const seedWidgets: InsertUnifiedWidget[] = [
      {
        title: "Production Overview",
        subtitle: "Real-time production metrics",
        targetPlatform: "both",
        widgetType: "kpi",
        dataSource: "production_orders",
        chartType: "number",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "production-metrics" },
          cockpit: { type: "production-order-status" }
        },
        createdBy: userId,
        category: "operational",
        description: "Overview of current production metrics including output, efficiency, and quality"
      },
      {
        title: "Equipment Status",
        subtitle: "Real-time equipment monitoring",
        targetPlatform: "both",
        widgetType: "table",
        dataSource: "resources",
        size: { width: 400, height: 300 },
        position: { x: 0, y: 200 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "equipment-status" },
          cockpit: { type: "resource-assignment" }
        },
        createdBy: userId,
        category: "operational",
        description: "Current status of all production equipment and resources"
      },
      {
        title: "Operation Sequencer",
        subtitle: "Schedule and sequence operations",
        targetPlatform: "both",
        widgetType: "timeline",
        dataSource: "operations",
        size: { width: 500, height: 400 },
        position: { x: 0, y: 500 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "operation-sequencer" },
          cockpit: { type: "operation-sequencer" }
        },
        createdBy: userId,
        category: "operational",
        description: "Interactive tool for scheduling and sequencing manufacturing operations"
      },
      {
        title: "ATP/CTP Calculator",
        subtitle: "Available and Capable to Promise",
        targetPlatform: "both",
        widgetType: "chart",
        dataSource: "production_orders",
        chartType: "bar",
        size: { width: 400, height: 300 },
        position: { x: 400, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "atp-ctp" },
          cockpit: { type: "atp-ctp" }
        },
        createdBy: userId,
        category: "operational",
        description: "Calculate available and capable to promise quantities"
      },
      {
        title: "Quality Dashboard",
        subtitle: "Quality metrics and testing results",
        targetPlatform: "both",
        widgetType: "chart",
        dataSource: "metrics",
        chartType: "line",
        size: { width: 400, height: 300 },
        position: { x: 400, y: 300 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "quality-dashboard" },
          cockpit: { type: "reports" }
        },
        createdBy: userId,
        category: "quality",
        description: "Quality metrics including pH, temperature, and purity measurements"
      },
      {
        title: "Inventory Tracking",
        subtitle: "Stock levels and material tracking",
        targetPlatform: "both",
        widgetType: "kpi",
        dataSource: "stock_items",
        chartType: "gauge",
        size: { width: 300, height: 200 },
        position: { x: 800, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "inventory-tracking" },
          cockpit: { type: "production-order-status" }
        },
        createdBy: userId,
        category: "operational",
        description: "Track inventory levels for raw materials, WIP, and finished goods"
      },
      {
        title: "Schedule Gantt",
        subtitle: "Visual production schedule",
        targetPlatform: "both",
        widgetType: "timeline",
        dataSource: "operations",
        size: { width: 600, height: 400 },
        position: { x: 0, y: 900 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "gantt-chart" },
          cockpit: { type: "operation-sequencer" }
        },
        createdBy: userId,
        category: "operational",
        description: "Gantt chart view of production schedule with resource allocation"
      },
      {
        title: "Schedule Optimizer",
        subtitle: "AI-powered schedule optimization",
        targetPlatform: "both",
        widgetType: "chart",
        dataSource: "operations",
        chartType: "bar",
        size: { width: 400, height: 300 },
        position: { x: 600, y: 900 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "schedule-optimizer" },
          cockpit: { type: "schedule-optimizer" }
        },
        createdBy: userId,
        category: "operational",
        description: "AI-powered optimization of production schedules"
      },
      {
        title: "Production Order Status",
        subtitle: "Track production order progress",
        targetPlatform: "both",
        widgetType: "table",
        dataSource: "production_orders",
        size: { width: 500, height: 300 },
        position: { x: 1000, y: 900 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "production-order-status" },
          cockpit: { type: "production-order-status" }
        },
        createdBy: userId,
        category: "operational",
        description: "Status and progress tracking for all production orders"
      },
      {
        title: "Operation Dispatch",
        subtitle: "Dispatch and manage operations",
        targetPlatform: "both",
        widgetType: "list",
        dataSource: "operations",
        size: { width: 400, height: 350 },
        position: { x: 1500, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        systemSpecificConfig: {
          mobile: { type: "operation-dispatch" },
          cockpit: { type: "operation-dispatch" }
        },
        createdBy: userId,
        category: "operational",
        description: "Dispatch operations to resources and track execution"
      }
    ];

    // Insert all seed widgets
    for (const widget of seedWidgets) {
      await this.createWidget(widget);
    }

    console.log(`Seeded ${seedWidgets.length} widgets successfully`);
  }

  // Get widgets formatted for mobile API (backward compatibility)
  async getMobileWidgets(): Promise<any[]> {
    const widgets = await this.getWidgets('mobile');
    
    return widgets.map(widget => {
      const mobileConfig = widget.systemSpecificConfig?.mobile || {};
      return {
        id: widget.id,
        title: widget.title,
        type: mobileConfig.type || widget.widgetType,
        targetPlatform: widget.targetPlatform,
        source: widget.deployedSystems.includes('cockpit') ? 'cockpit' : 'canvas',
        configuration: mobileConfig,
        createdAt: widget.createdAt?.toISOString()
      };
    });
  }
}

export const widgetStorage = new WidgetStorage();