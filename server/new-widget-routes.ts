import type { Express } from "express";
import { newWidgetStorage } from "./new-widget-storage.js";
import { insertWidgetSchema, insertDashboardSchema } from "../shared/new-schema.js";
import { createSafeHandler } from "./error-handler.js";

function requireAuth(req: any, res: any, next: any) {
  // Mock auth for demo - replace with real auth
  req.user = { id: 1, username: "demo_user" };
  next();
}

export function setupNewWidgetRoutes(app: Express) {
  // Widget routes
  app.get("/api/v2/widgets", requireAuth, createSafeHandler(async (req, res) => {
    const platform = req.query.platform as string;
    const category = req.query.category as string;
    const type = req.query.type as string;

    let widgets;
    if (platform && ['mobile', 'desktop', 'both'].includes(platform)) {
      widgets = await newWidgetStorage.getWidgetsByPlatform(platform as any);
    } else if (category) {
      widgets = await newWidgetStorage.getWidgetsByCategory(category);
    } else if (type) {
      widgets = await newWidgetStorage.getWidgetsByType(type);
    } else {
      widgets = await newWidgetStorage.getAllWidgets();
    }

    console.log(`=== NEW WIDGETS ENDPOINT HIT ===`);
    console.log(`Platform: ${platform}, Category: ${category}, Type: ${type}`);
    console.log(`Total widgets returned: ${widgets.length}`);

    res.json(widgets);
  }));

  app.get("/api/v2/widgets/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const widget = await newWidgetStorage.getWidgetById(id);
    
    if (!widget) {
      return res.status(404).json({ error: "Widget not found" });
    }
    
    res.json(widget);
  }));

  app.post("/api/v2/widgets", requireAuth, createSafeHandler(async (req, res) => {
    const data = insertWidgetSchema.parse({
      ...req.body,
      createdBy: req.user.id
    });
    
    const widget = await newWidgetStorage.createWidget(data);
    console.log(`Created new widget: ${widget.title} (ID: ${widget.id})`);
    res.status(201).json(widget);
  }));

  app.put("/api/v2/widgets/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const data = insertWidgetSchema.partial().parse(req.body);
    
    const widget = await newWidgetStorage.updateWidget(id, data);
    if (!widget) {
      return res.status(404).json({ error: "Widget not found" });
    }
    
    console.log(`Updated widget: ${widget.title} (ID: ${widget.id})`);
    res.json(widget);
  }));

  app.delete("/api/v2/widgets/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await newWidgetStorage.deleteWidget(id);
    
    if (!success) {
      return res.status(404).json({ error: "Widget not found" });
    }
    
    console.log(`Deleted widget ID: ${id}`);
    res.json({ success: true });
  }));

  // Dashboard routes
  app.get("/api/v2/dashboards", requireAuth, createSafeHandler(async (req, res) => {
    const platform = req.query.platform as string;
    
    let dashboards;
    if (platform && ['mobile', 'desktop', 'both'].includes(platform)) {
      dashboards = await newWidgetStorage.getDashboardsByPlatform(platform as any);
    } else {
      dashboards = await newWidgetStorage.getAllDashboards();
    }

    console.log(`=== NEW DASHBOARDS ENDPOINT HIT ===`);
    console.log(`Platform: ${platform}`);
    console.log(`Total dashboards returned: ${dashboards.length}`);

    res.json(dashboards);
  }));

  app.get("/api/v2/dashboards/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dashboard = await newWidgetStorage.getDashboardById(id);
    
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }
    
    res.json(dashboard);
  }));

  app.get("/api/v2/dashboards/:id/widgets", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const widgets = await newWidgetStorage.getWidgetsForDashboard(id);
    
    console.log(`=== DASHBOARD WIDGETS ENDPOINT HIT ===`);
    console.log(`Dashboard ID: ${id}, Widgets: ${widgets.length}`);
    
    res.json(widgets);
  }));

  app.post("/api/v2/dashboards", requireAuth, createSafeHandler(async (req, res) => {
    const data = insertDashboardSchema.parse({
      ...req.body,
      createdBy: req.user.id
    });
    
    const dashboard = await newWidgetStorage.createDashboard(data);
    console.log(`Created new dashboard: ${dashboard.title} (ID: ${dashboard.id})`);
    res.status(201).json(dashboard);
  }));

  app.put("/api/v2/dashboards/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const data = insertDashboardSchema.partial().parse(req.body);
    
    const dashboard = await newWidgetStorage.updateDashboard(id, data);
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }
    
    console.log(`Updated dashboard: ${dashboard.title} (ID: ${dashboard.id})`);
    res.json(dashboard);
  }));

  app.delete("/api/v2/dashboards/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await newWidgetStorage.deleteDashboard(id);
    
    if (!success) {
      return res.status(404).json({ error: "Dashboard not found" });
    }
    
    console.log(`Deleted dashboard ID: ${id}`);
    res.json({ success: true });
  }));

  // Data seeding routes
  app.post("/api/v2/widgets/seed", requireAuth, createSafeHandler(async (req, res) => {
    await newWidgetStorage.seedSampleWidgets();
    console.log("Seeded sample widgets");
    res.json({ message: "Sample widgets created successfully" });
  }));

  app.post("/api/v2/dashboards/seed", requireAuth, createSafeHandler(async (req, res) => {
    await newWidgetStorage.seedSampleDashboards();
    console.log("Seeded sample dashboards");
    res.json({ message: "Sample dashboards created successfully" });
  }));
}