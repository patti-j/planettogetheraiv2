import type { Express } from "express";
import { storage } from "./storage-new";
import { seedDatabase } from "./seed-database";
import { 
  insertUserSchema, insertPlantSchema, insertResourceSchema, 
  insertProductionOrderSchema, insertUnifiedWidgetSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  console.log("Setting up database-driven routes...");

  // Initialize database with sample data
  app.post("/api/seed-database", async (req, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
      console.error("Database seeding failed:", error);
      res.status(500).json({ success: false, error: "Database seeding failed" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      // For now, return minimal user data
      res.json([
        { id: 1, username: "admin", fullName: "System Administrator", role: "admin" },
        { id: 2, username: "production_manager", fullName: "Production Manager", role: "production_manager" }
      ]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      console.error("Error fetching plants:", error);
      res.status(500).json({ error: "Failed to fetch plants" });
    }
  });

  app.post("/api/plants", async (req, res) => {
    try {
      const validatedData = insertPlantSchema.parse(req.body);
      const plant = await storage.createPlant(validatedData);
      res.status(201).json(plant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating plant:", error);
      res.status(500).json({ error: "Failed to create plant" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating resource:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // Production Orders
  app.get("/api/production-orders", async (req, res) => {
    try {
      const orders = await storage.getProductionOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching production orders:", error);
      res.status(500).json({ error: "Failed to fetch production orders" });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      const validatedData = insertProductionOrderSchema.parse(req.body);
      const order = await storage.createProductionOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating production order:", error);
      res.status(500).json({ error: "Failed to create production order" });
    }
  });

  // WIDGET ROUTES - The main focus for replacing hardcoded endpoints
  
  // Get all widgets
  app.get("/api/widgets", async (req, res) => {
    try {
      console.log("=== DATABASE WIDGETS ENDPOINT HIT ===");
      const widgets = await storage.getWidgets();
      console.log(`Returned ${widgets.length} widgets from database`);
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching widgets:", error);
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Get widgets by platform (this replaces hardcoded mobile endpoints)
  app.get("/api/widgets/platform/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      console.log(`=== DATABASE WIDGETS BY PLATFORM (${platform}) ENDPOINT HIT ===`);
      
      if (!['mobile', 'desktop', 'both'].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform. Must be 'mobile', 'desktop', or 'both'" });
      }

      const widgets = await storage.getWidgetsByPlatform(platform);
      console.log(`Returned ${widgets.length} widgets for platform ${platform}`);
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
      console.log(`=== DATABASE WIDGETS BY CATEGORY (${category}) ENDPOINT HIT ===`);
      const widgets = await storage.getWidgetsByCategory(category);
      console.log(`Returned ${widgets.length} widgets for category ${category}`);
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

      const widget = await storage.getWidget(id);
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
      const validatedData = insertUnifiedWidgetSchema.parse(req.body);
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

      const validatedData = insertUnifiedWidgetSchema.partial().parse(req.body);
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

  // Delete widget
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

  // Legacy mobile widgets endpoint - now database-driven
  app.get("/api/mobile/widgets", async (req, res) => {
    try {
      console.log("=== DATABASE-DRIVEN MOBILE WIDGETS ENDPOINT HIT ===");
      
      // Get mobile and both platform widgets
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
        category: widget.category,
        description: widget.description,
        createdAt: widget.createdAt?.toISOString() || new Date().toISOString()
      }));

      console.log(`Returned ${allMobileWidgets.length} mobile widgets from database`);
      res.json(allMobileWidgets);
    } catch (error) {
      console.error("Error fetching mobile widgets:", error);
      res.status(500).json({ error: "Failed to fetch mobile widgets" });
    }
  });

  // Legacy desktop widgets endpoint - now database-driven
  app.get("/api/desktop/widgets", async (req, res) => {
    try {
      console.log("=== DATABASE-DRIVEN DESKTOP WIDGETS ENDPOINT HIT ===");
      
      // Get desktop and both platform widgets
      const desktopWidgets = await storage.getWidgetsByPlatform('desktop');
      const bothWidgets = await storage.getWidgetsByPlatform('both');
      
      // Combine and format for backward compatibility
      const allDesktopWidgets = [...desktopWidgets, ...bothWidgets].map(widget => ({
        id: widget.id,
        title: widget.title,
        type: widget.widgetType,
        targetPlatform: widget.targetPlatform,
        source: widget.dataSource,
        configuration: widget.filters,
        category: widget.category,
        description: widget.description,
        createdAt: widget.createdAt?.toISOString() || new Date().toISOString()
      }));

      console.log(`Returned ${allDesktopWidgets.length} desktop widgets from database`);
      res.json(allDesktopWidgets);
    } catch (error) {
      console.error("Error fetching desktop widgets:", error);
      res.status(500).json({ error: "Failed to fetch desktop widgets" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        data: {
          plants: plants.length
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log("✓ Database-driven routes registered successfully");
}