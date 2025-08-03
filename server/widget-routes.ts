import { Request, Response } from "express";
import { db } from "./storage";
import { unifiedWidgets, insertUnifiedWidgetSchema, users } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Get all widgets with optional platform filtering
export const getWidgets = async (req: Request, res: Response) => {
  try {
    const { platform, category, active } = req.query;
    
    const widgets = await db.select().from(unifiedWidgets);
    
    // Filter by platform if specified - note: unifiedWidgets uses targetPlatform (singular)
    const filteredWidgets = platform 
      ? widgets.filter(w => 
          w.targetPlatform === platform || 
          w.targetPlatform === 'both'
        )
      : widgets;

    res.json(filteredWidgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ error: 'Failed to fetch widgets' });
  }
};

// Get single widget by ID
export const getWidget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const widget = await db.select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.id, parseInt(id)))
      .limit(1);
      
    if (!widget.length) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    res.json(widget[0]);
  } catch (error) {
    console.error('Error fetching widget:', error);
    res.status(500).json({ error: 'Failed to fetch widget' });
  }
};

// Create new widget
export const createWidget = async (req: Request, res: Response) => {
  try {
    const widgetData = insertUnifiedWidgetSchema.parse(req.body);
    
    const [newWidget] = await db.insert(unifiedWidgets)
      .values({
        ...widgetData,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
      })
      .returning();
      
    res.status(201).json(newWidget);
  } catch (error) {
    console.error('Error creating widget:', error);
    res.status(400).json({ error: 'Failed to create widget' });
  }
};

// Update widget
export const updateWidget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = insertUnifiedWidgetSchema.partial().parse(req.body);
    
    const [updatedWidget] = await db.update(unifiedWidgets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(unifiedWidgets.id, parseInt(id)))
      .returning();
      
    if (!updatedWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    res.json(updatedWidget);
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(400).json({ error: 'Failed to update widget' });
  }
};

// Delete widget (soft delete by setting isActive to false)
export const deleteWidget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [deletedWidget] = await db.update(unifiedWidgets)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(unifiedWidgets.id, parseInt(id)))
      .returning();
      
    if (!deletedWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    res.json({ message: 'Widget deleted successfully' });
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
};

// Seed initial widgets (for migration from hardcoded data)
export const seedWidgets = async (req: Request, res: Response) => {
  try {
    const initialWidgets = [
      {
        title: "Production Overview",
        type: "production-metrics",
        category: "production",
        targetPlatforms: ["both"],
        configuration: { metrics: ["output", "efficiency", "quality"] },
        description: "Real-time production metrics and KPIs",
        componentName: "ProductionOrderStatusWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Equipment Status",
        type: "equipment-status",
        category: "equipment",
        targetPlatforms: ["both"],
        configuration: { equipment: ["reactor1", "mixer2", "packaging"] },
        description: "Monitor equipment health and status",
        componentName: "ResourceAssignmentWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Quality Metrics",
        type: "quality-dashboard",
        category: "quality",
        targetPlatforms: ["both"],
        configuration: { tests: ["pH", "temperature", "purity"] },
        description: "Quality control metrics and test results",
        componentName: "ReportsWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Inventory Levels",
        type: "inventory-tracking",
        category: "inventory",
        targetPlatforms: ["both"],
        configuration: { materials: ["raw_materials", "wip", "finished_goods"] },
        description: "Track inventory levels across all materials",
        componentName: "ProductionOrderStatusWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Schedule Gantt",
        type: "gantt-chart",
        category: "scheduling",
        targetPlatforms: ["both"],
        configuration: { view: "weekly", resources: ["all"] },
        description: "Visual schedule planning and tracking",
        componentName: "OperationSequencerWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Operation Sequencer",
        type: "operation-sequencer",
        category: "scheduling",
        targetPlatforms: ["both"],
        configuration: { maxOperations: 50, autoRefresh: true },
        description: "Sequence and manage production operations",
        componentName: "OperationSequencerWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "ATP/CTP Calculator",
        type: "atp-ctp",
        category: "planning",
        targetPlatforms: ["both"],
        configuration: { horizon: 30, includeConstraints: true },
        description: "Available and Capable to Promise calculations",
        componentName: "AtpCtpWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Schedule Optimizer",
        type: "schedule-optimizer",
        category: "optimization",
        targetPlatforms: ["both"],
        configuration: { algorithm: "genetic", maxIterations: 1000 },
        description: "AI-powered schedule optimization",
        componentName: "ScheduleOptimizationWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Production Order Status",
        type: "production-order-status",
        category: "production",
        targetPlatforms: ["both"],
        configuration: { showProgress: true, groupByStatus: true },
        description: "Track production order progress and status",
        componentName: "ProductionOrderStatusWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      },
      {
        title: "Operation Dispatch",
        type: "operation-dispatch",
        category: "operations",
        targetPlatforms: ["both"],
        configuration: { autoDispatch: false, priorityBased: true },
        description: "Dispatch operations to resources",
        componentName: "OperationDispatchWidget",
        version: "1.0.0",
        isActive: true,
        createdBy: "system"
      }
    ];

    // Check if widgets already exist
    const existingWidgets = await db.select().from(unifiedWidgets).limit(1);
    if (existingWidgets.length > 0) {
      return res.json({ message: 'Widgets already seeded', count: existingWidgets.length });
    }

    // Insert all widgets
    const insertedWidgets = await db.insert(unifiedWidgets)
      .values(initialWidgets.map(widget => ({
        ...widget,
        createdAt: new Date(),
      })))
      .returning();

    res.json({ 
      message: 'Widgets seeded successfully', 
      count: insertedWidgets.length,
      widgets: insertedWidgets 
    });
  } catch (error) {
    console.error('Error seeding widgets:', error);
    res.status(500).json({ error: 'Failed to seed widgets' });
  }
};