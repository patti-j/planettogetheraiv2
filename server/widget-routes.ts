import { Express } from "express";
import { DatabaseStorage } from "./storage";
import { WidgetService } from "./widget-service";
import { z } from "zod";

const createWidgetSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),
  targetPlatform: z.array(z.enum(['mobile', 'desktop'])).default(['mobile', 'desktop']),
  configuration: z.record(z.any()).default({}),
  isActive: z.boolean().default(true)
});

const updateWidgetSchema = createWidgetSchema.partial();

export function setupWidgetRoutes(app: Express, storage: DatabaseStorage) {
  const widgetService = new WidgetService(storage);

  // Get all widgets with optional platform filtering
  app.get("/api/widgets", async (req, res) => {
    try {
      const platform = req.query.platform as 'mobile' | 'desktop' | undefined;
      const category = req.query.category as string | undefined;
      
      // For now, return the current hardcoded data structure but validate it
      const widgets = [
        {
          id: 1,
          title: "Production Overview",
          type: "production-order-status",
          category: "production",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { showMetrics: true, refreshInterval: 30000 },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 2,
          title: "Equipment Status",
          type: "resource-assignment",
          category: "resources",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { showDetails: true, compact: false },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 3,
          title: "Quality Metrics",
          type: "reports",
          category: "quality",
          targetPlatform: ["mobile", "desktop"],
          source: "canvas",
          configuration: { reportTypes: ["quality"], timeRange: "daily" },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 4,
          title: "Inventory Levels",
          type: "production-order-status",
          category: "inventory",
          targetPlatform: ["mobile", "desktop"],
          source: "canvas",
          configuration: { showMetrics: true, maxItems: 50 },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 5,
          title: "Schedule Gantt",
          type: "operation-sequencer",
          category: "scheduling",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { view: "grid", maxItems: 20 },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 6,
          title: "Operation Sequencer",
          type: "operation-sequencer",
          category: "scheduling",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { view: "list", isDesktop: false },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 7,
          title: "ATP/CTP Calculator",
          type: "atp-ctp",
          category: "planning",
          targetPlatform: ["mobile", "desktop"],
          source: "canvas",
          configuration: { compact: false, showDetails: true },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 8,
          title: "ATP Overview",
          type: "atp-ctp",
          category: "planning",
          targetPlatform: ["mobile", "desktop"],
          source: "canvas",
          configuration: { compact: true, view: "compact" },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 9,
          title: "Schedule Optimizer",
          type: "schedule-optimizer",
          category: "scheduling",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { showOptimizer: true, optimizationLevel: "balanced" },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        {
          id: 10,
          title: "Operation Dispatch",
          type: "operation-dispatch",
          category: "operations",
          targetPlatform: ["mobile", "desktop"],
          source: "cockpit",
          configuration: { showActions: true, compact: false },
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        }
      ];

      // Validate and filter widgets
      const validatedWidgets = widgets
        .filter(widget => {
          // Filter by platform if specified
          if (platform && !widgetService.isWidgetSupportedOnPlatform(widget.type, platform)) {
            return false;
          }
          // Filter by category if specified
          if (category && widget.category !== category) {
            return false;
          }
          return widget.isActive;
        })
        .map(widget => ({
          ...widget,
          configuration: widgetService.validateWidgetConfig(widget.type, widget.configuration)
        }));

      console.log(`=== WIDGETS ENDPOINT HIT (platform: ${platform}, category: ${category}) ===`);
      console.log(`Total widgets returned: ${validatedWidgets.length}`);
      
      res.json(validatedWidgets);
    } catch (error) {
      console.error("Error fetching widgets:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Get widget by ID
  app.get("/api/widgets/:id", async (req, res) => {
    try {
      const widgetId = parseInt(req.params.id);
      
      // Get from the widgets endpoint and find by ID
      const allWidgets = await new Promise<any[]>((resolve) => {
        app.request('/api/widgets', {}, (err: any, response: any) => {
          if (err) resolve([]);
          else resolve(response.body || []);
        });
      });

      const widget = allWidgets.find(w => w.id === widgetId);
      
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json(widget);
    } catch (error) {
      console.error("Error fetching widget:", error);
      res.status(500).json({ error: "Failed to fetch widget" });
    }
  });

  // Get widget types registry
  app.get("/api/widget-types", (req, res) => {
    try {
      const widgetTypes = widgetService.getAvailableWidgetTypes().map(type => ({
        type,
        ...widgetService.getWidgetMetadata(type)
      }));
      
      res.json(widgetTypes);
    } catch (error) {
      console.error("Error fetching widget types:", error);
      res.status(500).json({ error: "Failed to fetch widget types" });
    }
  });

  // Get widget configuration for specific type and platform
  app.get("/api/widget-config/:type", (req, res) => {
    try {
      const { type } = req.params;
      const platform = (req.query.platform as 'mobile' | 'desktop') || 'desktop';
      const configuration = req.query.configuration ? JSON.parse(req.query.configuration as string) : {};
      
      if (!widgetService.isWidgetSupportedOnPlatform(type, platform)) {
        return res.status(400).json({ error: `Widget type ${type} not supported on ${platform}` });
      }

      const props = widgetService.getWidgetProps(type, configuration, platform);
      const metadata = widgetService.getWidgetMetadata(type);
      
      res.json({
        type,
        platform,
        props,
        metadata
      });
    } catch (error) {
      console.error("Error getting widget config:", error);
      res.status(500).json({ error: "Failed to get widget configuration" });
    }
  });

  // Create new widget (for future use)
  app.post("/api/widgets", async (req, res) => {
    try {
      const widgetData = createWidgetSchema.parse(req.body);
      
      // Validate widget type exists
      if (!widgetService.getWidgetMetadata(widgetData.type)) {
        return res.status(400).json({ error: `Unknown widget type: ${widgetData.type}` });
      }

      // Validate configuration
      const validatedConfig = widgetService.validateWidgetConfig(widgetData.type, widgetData.configuration);
      
      // For now, just return success - database implementation would go here
      const newWidget = {
        id: Date.now(), // Temporary ID generation
        ...widgetData,
        configuration: validatedConfig,
        createdAt: new Date().toISOString(),
        createdBy: "user" // Would come from auth
      };

      res.status(201).json(newWidget);
    } catch (error) {
      console.error("Error creating widget:", error);
      res.status(400).json({ error: "Failed to create widget" });
    }
  });
}