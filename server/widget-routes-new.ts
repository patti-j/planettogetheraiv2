import type { Express } from "express";
import { widgetStorage } from "./widget-storage-new";
import { insertWidgetSchema, insertDashboardSchema } from "@shared/widget-schema";

export function registerWidgetRoutes(app: Express) {
  // Widget routes
  app.get("/api/widgets", async (req, res) => {
    try {
      const widgets = await widgetStorage.getWidgets();
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching widgets:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  app.get("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const widget = await widgetStorage.getWidget(id);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      console.error("Error fetching widget:", error);
      res.status(500).json({ error: "Failed to fetch widget" });
    }
  });

  app.post("/api/widgets", async (req, res) => {
    try {
      const data = insertWidgetSchema.parse(req.body);
      const widget = await widgetStorage.createWidget(data);
      res.json(widget);
    } catch (error) {
      console.error("Error creating widget:", error);
      res.status(400).json({ error: "Failed to create widget" });
    }
  });

  app.put("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertWidgetSchema.partial().parse(req.body);
      const widget = await widgetStorage.updateWidget(id, data);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      console.error("Error updating widget:", error);
      res.status(400).json({ error: "Failed to update widget" });
    }
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await widgetStorage.deleteWidget(id);
      if (!success) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting widget:", error);
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboards", async (req, res) => {
    try {
      const dashboards = await widgetStorage.getDashboards();
      res.json(dashboards);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      res.status(500).json({ error: "Failed to fetch dashboards" });
    }
  });

  app.get("/api/dashboards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dashboard = await widgetStorage.getDashboard(id);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.post("/api/dashboards", async (req, res) => {
    try {
      const data = insertDashboardSchema.parse(req.body);
      const dashboard = await widgetStorage.createDashboard(data);
      res.json(dashboard);
    } catch (error) {
      console.error("Error creating dashboard:", error);
      res.status(400).json({ error: "Failed to create dashboard" });
    }
  });

  app.put("/api/dashboards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertDashboardSchema.partial().parse(req.body);
      const dashboard = await widgetStorage.updateDashboard(id, data);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error updating dashboard:", error);
      res.status(400).json({ error: "Failed to update dashboard" });
    }
  });

  app.delete("/api/dashboards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await widgetStorage.deleteDashboard(id);
      if (!success) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      res.status(500).json({ error: "Failed to delete dashboard" });
    }
  });

  // Mobile-specific routes
  app.get("/api/mobile/widgets", async (req, res) => {
    try {
      console.log("=== MOBILE WIDGETS ENDPOINT HIT ===");
      const widgets = await widgetStorage.getMobileWidgets();
      console.log(`Total widgets returned: ${widgets.length}`);
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching mobile widgets:", error);
      res.status(500).json({ error: "Failed to fetch mobile widgets" });
    }
  });

  app.get("/api/mobile/dashboards", async (req, res) => {
    try {
      console.log("=== MOBILE DASHBOARDS ENDPOINT HIT ===");
      const dashboards = await widgetStorage.getMobileDashboards();
      console.log(`Total dashboards returned: ${dashboards.length}`);
      res.json(dashboards);
    } catch (error) {
      console.error("Error fetching mobile dashboards:", error);
      res.status(500).json({ error: "Failed to fetch mobile dashboards" });
    }
  });
}