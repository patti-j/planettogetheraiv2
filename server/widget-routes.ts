import { Express } from "express";
import { WidgetStorage } from "./widget-storage.js";

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



  // Legacy mobile widgets endpoint - now uses database
  app.get("/api/mobile/widgets", async (req, res) => {
    try {
      console.log("=== MOBILE WIDGETS ENDPOINT HIT ===");
      
      // Get all widgets that are compatible with mobile (mobile or both)
      const mobileCompatibleWidgets = await storage.getMobileCompatibleWidgets();
      
      // Format for backward compatibility
      const formattedWidgets = mobileCompatibleWidgets.map(widget => ({
        id: widget.id,
        title: widget.title,
        type: widget.widgetType,
        targetPlatform: widget.targetPlatform,
        source: widget.dataSource,
        configuration: widget.filters,
        createdAt: widget.createdAt?.toISOString() || new Date().toISOString()
      }));

      console.log(`Total widgets returned: ${formattedWidgets.length}`);
      res.json(formattedWidgets);
    } catch (error) {
      console.error("Error fetching mobile widgets:", error);
      res.status(500).json({ error: "Failed to fetch mobile widgets" });
    }
  });
}