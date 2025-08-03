import { Express } from "express";
import { z } from "zod";
import { WidgetStorage } from "./widget-storage.js";
import { createInsertSchema } from "drizzle-zod";
import { unifiedWidgets } from "../shared/schema.js";

const insertWidgetSchema = createInsertSchema(unifiedWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

const updateWidgetSchema = insertWidgetSchema.partial();

export function setupWidgetRoutes(app: Express, storage: WidgetStorage) {
  
  // Get all widgets
  app.get("/api/widgets", async (req, res) => {
    try {
      const widgets = await storage.getAllWidgets();
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching widgets:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Get widgets by platform (mobile/desktop/both)
  app.get("/api/widgets/platform/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      
      if (!['mobile', 'desktop', 'both'].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform. Must be 'mobile', 'desktop', or 'both'" });
      }

      const widgets = await storage.getWidgetsByPlatform(platform as 'mobile' | 'desktop' | 'both');
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching widgets by platform:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Get widgets by category
  app.get("/api/widgets/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const widgets = await storage.getWidgetsByCategory(category);
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching widgets by category:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Get widget by ID
  app.get("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      const widget = await storage.getWidgetById(id);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json(widget);
    } catch (error) {
      console.error("Error fetching widget:", error);
      res.status(500).json({ error: "Failed to fetch widget" });
    }
  });

  // Create new widget
  app.post("/api/widgets", async (req, res) => {
    try {
      const validatedData = insertWidgetSchema.parse(req.body);
      const widget = await storage.createWidget(validatedData);
      res.status(201).json(widget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating widget:", error);
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  // Update widget
  app.put("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      const validatedData = updateWidgetSchema.parse(req.body);
      const widget = await storage.updateWidget(id, validatedData);
      
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json(widget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating widget:", error);
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  // Delete widget (soft delete)
  app.delete("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      const success = await storage.deleteWidget(id);
      if (!success) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json({ message: "Widget deleted successfully" });
    } catch (error) {
      console.error("Error deleting widget:", error);
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  // Seed widgets endpoint (for development)
  app.post("/api/widgets/seed", async (req, res) => {
    try {
      await storage.seedWidgets();
      res.json({ message: "Widgets seeded successfully" });
    } catch (error) {
      console.error("Error seeding widgets:", error);
      res.status(500).json({ error: "Failed to seed widgets" });
    }
  });

  // Legacy mobile widgets endpoint - now uses database
  app.get("/api/mobile/widgets", async (req, res) => {
    try {
      console.log("=== DATABASE-DRIVEN MOBILE WIDGETS ENDPOINT HIT ===");
      
      // Get widgets that are compatible with mobile (mobile or both)
      const mobileWidgets = await storage.getWidgetsByPlatform('mobile');
      const bothWidgets = await storage.getWidgetsByPlatform('both');
      
      // Combine and format for backward compatibility
      const allMobileWidgets = [...mobileWidgets, ...bothWidgets].map(widget => ({
        id: widget.id,
        title: widget.title,
        type: widget.widgetType,
        targetPlatform: widget.targetPlatform,
        source: widget.dataSource,
        configuration: widget.filters,
        createdAt: widget.createdAt?.toISOString() || new Date().toISOString()
      }));

      console.log(`Total mobile widgets returned: ${allMobileWidgets.length}`);
      res.json(allMobileWidgets);
    } catch (error) {
      console.error("Error fetching mobile widgets:", error);
      res.status(500).json({ error: "Failed to fetch mobile widgets" });
    }
  });
}