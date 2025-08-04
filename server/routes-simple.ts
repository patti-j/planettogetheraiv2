import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-basic";
import { insertPlantSchema, insertCapabilitySchema, insertResourceSchema, insertUserSchema, insertProductionOrderSchema } from "../shared/schema-simple";
import { db } from "./db";
import * as schema from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import { processAICommand } from "./ai-agent";

export function registerSimpleRoutes(app: express.Application): Server {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      console.error("Error fetching plants:", error);
      res.status(500).json({ error: "Failed to fetch plants", details: error.message });
    }
  });

  app.post("/api/plants", async (req, res) => {
    try {
      const data = insertPlantSchema.parse(req.body);
      const plant = await storage.createPlant(data);
      res.json(plant);
    } catch (error) {
      res.status(400).json({ error: "Invalid plant data" });
    }
  });

  // Capabilities
  app.get("/api/capabilities", async (req, res) => {
    try {
      const capabilities = await storage.getCapabilities();
      res.json(capabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capabilities" });
    }
  });

  app.post("/api/capabilities", async (req, res) => {
    try {
      const data = insertCapabilitySchema.parse(req.body);
      const capability = await storage.createCapability(data);
      res.json(capability);
    } catch (error) {
      res.status(400).json({ error: "Invalid capability data" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources", details: error.message });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const data = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(data);
      res.json(resource);
    } catch (error) {
      res.status(400).json({ error: "Invalid resource data" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Production Orders
  app.get("/api/production-orders", async (req, res) => {
    try {
      const orders = await storage.getProductionOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production orders" });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      const data = insertProductionOrderSchema.parse(req.body);
      const order = await storage.createProductionOrder(data);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid production order data" });
    }
  });

  // Basic auth endpoints for demo
  app.get("/api/auth/me", (req, res) => {
    // Check for stored user in session or token
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.includes('trainer_token_')) {
      res.json({
        id: "trainer", 
        username: "trainer",
        email: "trainer@example.com",
        isDemo: false
      });
    } else {
      res.json({
        id: "demo_user", 
        username: "demo_user",
        email: "demo@example.com",
        isDemo: true
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for:", username);
      
      // Handle trainer user (case insensitive)
      if (username && username.toLowerCase() === "trainer") {
        const user = {
          id: "trainer",
          username: "trainer",
          email: "trainer@example.com",
          isDemo: false
        };
        
        const token = "trainer_token_" + Date.now();
        
        res.json({
          user,
          token,
          message: "Trainer login successful"
        });
        return;
      }
      
      // Default demo authentication for other users
      const user = {
        id: "demo_user",
        username: username || "demo_user", 
        email: "demo@example.com",
        isDemo: true
      };
      
      // Generate a simple token for demo
      const token = "demo_token_" + Date.now();
      
      res.json({
        user,
        token,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Mobile Library API - Returns widgets for mobile library (database-driven)
  app.get("/api/mobile/widgets", async (req, res) => {
    console.log("=== MOBILE WIDGETS ENDPOINT HIT ===");
    
    try {
      // Get mobile-compatible widgets from database (platform = 'mobile' or 'both')
      const mobileCompatibleWidgets = await db
        .select()
        .from(schema.unifiedWidgets)
        .where(
          sql`target_platform IN ('mobile', 'both')`
        )
        .orderBy(schema.unifiedWidgets.createdAt);

      // Format for backward compatibility
      const formattedWidgets = mobileCompatibleWidgets.map(widget => ({
        id: widget.id,
        title: widget.title,
        type: widget.widgetType,
        targetPlatform: widget.targetPlatform,
        source: widget.dataSource,
        configuration: widget.filters || {},
        createdAt: widget.createdAt?.toISOString() || new Date().toISOString()
      }));

      console.log(`Total widgets returned: ${formattedWidgets.length}`);
      console.log("Widget IDs:", formattedWidgets.map(w => `${w.id}: ${w.title}`).join(", "));
      res.json(formattedWidgets);
    } catch (error) {
      console.error("Error fetching mobile widgets:", error);
      res.status(500).json({ error: "Failed to fetch mobile widgets" });
    }
  });

  // Desktop widgets endpoint (if needed later)
  app.get("/api/desktop/widgets", async (req, res) => {
    console.log("=== DESKTOP WIDGETS ENDPOINT HIT ===");
    
    // Filter for desktop and both widgets
    const mobileWidgets = [
      {
        id: 1,
        title: "Production Overview",
        type: "production-metrics",
        targetPlatform: "both",
        configuration: { metrics: ["output", "efficiency", "quality"] },
        createdAt: new Date().toISOString()
      },
      // Add more desktop-specific or both widgets as needed
    ];
    
    const desktopWidgets = mobileWidgets.filter(widget => 
      widget.targetPlatform === "desktop" || widget.targetPlatform === "both"
    );
    
    console.log("Total desktop widgets returned:", desktopWidgets.length);
    res.json(desktopWidgets);
  });

  // Mobile Dashboards API - Simplified with targetPlatform only
  app.get("/api/mobile/dashboards", (req, res) => {
    console.log("=== MOBILE DASHBOARDS ENDPOINT HIT ===");
    
    const mobileDashboards = [
      {
        id: 1,
        title: "Factory Overview",
        description: "Real-time production metrics and equipment status",
        targetPlatform: "both",
        configuration: { 
          layout: "grid",
          widgets: ["production-metrics", "equipment-status", "quality-dashboard"]
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Production Planning",
        description: "Schedule management and resource allocation",
        targetPlatform: "both",
        configuration: { 
          layout: "timeline",
          widgets: ["gantt-chart", "resource-allocation", "capacity-planning"]
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Quality Control",
        description: "Quality metrics and testing results",
        targetPlatform: "both",
        configuration: { 
          layout: "metrics",
          widgets: ["quality-tests", "inspection-plans", "certificates"]
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Inventory Management",
        description: "Stock levels and material tracking",
        targetPlatform: "both",
        configuration: { 
          layout: "dashboard",
          widgets: ["inventory-tracking", "stock-alerts", "procurement"]
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        title: "Scheduling Optimization",
        description: "Advanced scheduling tools and trade-off analysis",
        targetPlatform: "both",
        configuration: { 
          layout: "optimization",
          widgets: ["schedule-optimizer", "operation-sequencer", "atp-ctp"]
        },
        createdAt: new Date().toISOString()
      }
    ];
    
    console.log("Total dashboards returned:", mobileDashboards.length);
    res.json(mobileDashboards);
  });

  // Desktop dashboards endpoint (if needed later)
  app.get("/api/desktop/dashboards", (req, res) => {
    console.log("=== DESKTOP DASHBOARDS ENDPOINT HIT ===");
    
    // Simplified dashboard data with only targetPlatform categorization
    const allDashboards = [
      {
        id: 1,
        title: "Factory Overview",
        description: "Real-time production metrics and equipment status",
        targetPlatform: "both",
        configuration: { 
          layout: "grid",
          widgets: ["production-metrics", "equipment-status", "quality-dashboard"]
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Advanced Analytics",
        description: "Detailed analytics for desktop users",
        targetPlatform: "desktop",
        configuration: { 
          layout: "analytics",
          widgets: ["trend-analysis", "predictive-models", "reporting-suite"]
        },
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter for desktop and both dashboards
    const desktopDashboards = allDashboards.filter(dashboard => 
      dashboard.targetPlatform === "desktop" || dashboard.targetPlatform === "both"
    );
    
    console.log("Total desktop dashboards returned:", desktopDashboards.length);
    res.json(desktopDashboards);
  });

  // Optimization endpoints for Schedule Optimizer widget
  app.get("/api/optimization/algorithms", async (req, res) => {
    try {
      const { category, status } = req.query;
      const algorithms = await storage.getOptimizationAlgorithms(
        category as string, 
        status as string
      );
      res.json(algorithms);
    } catch (error) {
      console.error("Error fetching optimization algorithms:", error);
      res.status(500).json({ error: "Failed to fetch optimization algorithms" });
    }
  });

  app.get("/api/optimization/profiles", async (req, res) => {
    try {
      // Sample optimization profiles
      const profiles = [
        {
          id: 1,
          name: "High Efficiency",
          description: "Maximize equipment utilization and minimize idle time",
          algorithmId: 3, // Bottleneck Optimizer
          configuration: {
            priority: "efficiency",
            weights: {
              utilization: 0.4,
              throughput: 0.3,
              quality: 0.2,
              cost: 0.1
            }
          },
          isDefault: true
        },
        {
          id: 2,
          name: "Fast Delivery",
          description: "Optimize for shortest lead times and on-time delivery",
          algorithmId: 1, // Forward Scheduling
          configuration: {
            priority: "speed",
            weights: {
              delivery: 0.5,
              throughput: 0.3,
              utilization: 0.2
            }
          },
          isDefault: false
        },
        {
          id: 3,
          name: "Balanced Production",
          description: "Balance efficiency, quality, and delivery performance",
          algorithmId: 4, // Genetic Algorithm
          configuration: {
            priority: "balanced",
            weights: {
              efficiency: 0.25,
              quality: 0.25,
              delivery: 0.25,
              cost: 0.25
            }
          },
          isDefault: false
        }
      ];
      
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching optimization profiles:", error);
      res.status(500).json({ error: "Failed to fetch optimization profiles" });
    }
  });

  app.get("/api/optimization/scheduling-history", async (req, res) => {
    try {
      // Sample scheduling history
      const history = [
        {
          id: 1,
          profileName: "High Efficiency",
          algorithm: "Bottleneck Optimization",
          executedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          duration: 45000, // 45 seconds
          results: {
            efficiency: 94,
            utilization: 87,
            makespan: 168, // hours
            improvements: {
              throughput: "+12%",
              efficiency: "+8%",
              bottleneckReduction: "2 resolved"
            }
          },
          status: "completed"
        },
        {
          id: 2,
          profileName: "Fast Delivery", 
          algorithm: "Forward Scheduling",
          executedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          duration: 15000, // 15 seconds
          results: {
            efficiency: 88,
            utilization: 82,
            makespan: 144, // hours
            improvements: {
              deliveryTime: "-24 hours",
              efficiency: "+5%",
              resourceBalance: "Improved"
            }
          },
          status: "completed"
        }
      ];
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching scheduling history:", error);
      res.status(500).json({ error: "Failed to fetch scheduling history" });
    }
  });

  // Mobile AI Chat endpoint - simple version without authentication
  app.post("/api/ai-agent/mobile-chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log('=== MOBILE AI CHAT DEBUG ===');
      console.log('User Message:', message);
      console.log('Context:', context);
      console.log('=============================');

      // Simple AI responses for mobile without database dependencies
      const lowerMessage = message.toLowerCase();
      let response = {
        message: "Hello! I'm Max, your AI assistant. I can help you with production optimization, scheduling, and manufacturing insights.",
        canvasAction: null,
        data: null,
        actions: []
      };

      if (lowerMessage.includes('optimize') || lowerMessage.includes('widget')) {
        response = {
          message: "I can help you optimize your production! Here are some key areas to focus on:\n\n• **Production Efficiency**: Monitor OEE (Overall Equipment Effectiveness)\n• **Resource Utilization**: Track equipment and labor usage\n• **Quality Metrics**: Watch defect rates and first-pass yield\n• **Schedule Optimization**: Balance workload across resources\n\nWould you like me to show you specific optimization widgets or create a custom dashboard?",
          canvasAction: 'create',
          data: {
            type: 'widget',
            title: 'Production Optimization Dashboard',
            content: {
              widgets: ['efficiency-metrics', 'resource-utilization', 'quality-trends', 'schedule-optimizer']
            }
          },
          actions: ['show_widget', 'create_dashboard']
        };
      } else if (lowerMessage.includes('production') || lowerMessage.includes('manufacturing')) {
        response = {
          message: "I can provide insights on your manufacturing operations:\n\n• **Current Production Status**: Real-time job progress\n• **Equipment Status**: Machine availability and performance\n• **Quality Control**: Testing results and compliance\n• **Inventory Levels**: Raw materials and finished goods\n\nWhat specific production area would you like to explore?",
          canvasAction: 'show',
          data: {
            type: 'dashboard',
            title: 'Production Overview',
            metrics: ['output', 'efficiency', 'quality', 'inventory']
          },
          actions: ['show_production', 'view_equipment']
        };
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('planning')) {
        response = {
          message: "I can assist with production scheduling and planning:\n\n• **Schedule Optimization**: Balance resources and minimize bottlenecks\n• **Capacity Planning**: Forecast resource needs\n• **Dependency Management**: Handle operation sequences\n• **What-if Analysis**: Test different scenarios\n\nLet me know what scheduling challenge you're facing!",
          canvasAction: 'create',
          data: {
            type: 'gantt',
            title: 'Production Schedule',
            view: 'weekly'
          },
          actions: ['show_schedule', 'optimize_schedule']
        };
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
        response = {
          message: "I'm Max, your AI manufacturing assistant! I can help you with:\n\n• **Production Optimization** - Improve efficiency and reduce waste\n• **Schedule Management** - Balance workloads and meet deadlines\n• **Quality Control** - Monitor metrics and prevent defects\n• **Resource Planning** - Optimize equipment and labor usage\n• **Data Analysis** - Generate insights from your manufacturing data\n\nJust ask me about any aspect of your manufacturing operations!",
          canvasAction: null,
          data: null,
          actions: ['learn_more']
        };
      }
      
      res.json(response);

    } catch (error) {
      console.error("Mobile AI chat error:", error);
      res.status(500).json({ 
        error: "Failed to process AI chat request",
        message: "I'm experiencing some technical difficulties. Please try again in a moment."
      });
    }
  });

  // Schedule Scenarios API
  app.get("/api/schedule-scenarios", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM schedule_scenarios ORDER BY created_at DESC`);
      res.json(result);
    } catch (error) {
      console.error("Error fetching schedule scenarios:", error);
      res.status(500).json({ message: "Failed to fetch schedule scenarios" });
    }
  });

  app.post("/api/schedule-scenarios", async (req, res) => {
    try {
      const data = schema.insertScheduleScenarioSchema.parse(req.body);
      const [scenario] = await db.insert(schema.scheduleScenarios).values(data).returning();
      res.json(scenario);
    } catch (error) {
      console.error("Error creating schedule scenario:", error);
      res.status(500).json({ message: "Failed to create schedule scenario" });
    }
  });

  app.get("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [scenario] = await db.select().from(schema.scheduleScenarios)
        .where(eq(schema.scheduleScenarios.id, id));
      
      if (!scenario) {
        return res.status(404).json({ message: "Schedule scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching schedule scenario:", error);
      res.status(500).json({ message: "Failed to fetch schedule scenario" });
    }
  });

  // Resource Requirement Blocks API (unified for both discrete and process operations)
  app.get("/api/schedule-scenarios/:scenarioId/blocks", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const blocks = await db.select().from(schema.resourceRequirementBlocks)
        .where(eq(schema.resourceRequirementBlocks.scenarioId, scenarioId));
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching resource requirement blocks:", error);
      res.status(500).json({ message: "Failed to fetch resource requirement blocks" });
    }
  });

  app.post("/api/schedule-scenarios/:scenarioId/blocks", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const data = schema.insertResourceRequirementBlockSchema.parse({
        ...req.body,
        scenarioId
      });
      const [block] = await db.insert(schema.resourceRequirementBlocks).values(data).returning();
      res.json(block);
    } catch (error) {
      console.error("Error creating resource requirement block:", error);
      res.status(500).json({ message: "Failed to create resource requirement block" });
    }
  });

  app.get("/api/resource-requirement-blocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [block] = await db.select().from(schema.resourceRequirementBlocks)
        .where(eq(schema.resourceRequirementBlocks.id, id));
      
      if (!block) {
        return res.status(404).json({ message: "Resource requirement block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error fetching resource requirement block:", error);
      res.status(500).json({ message: "Failed to fetch resource requirement block" });
    }
  });

  app.put("/api/resource-requirement-blocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body, updatedAt: new Date() };
      const [block] = await db.update(schema.resourceRequirementBlocks)
        .set(data)
        .where(eq(schema.resourceRequirementBlocks.id, id))
        .returning();
      
      if (!block) {
        return res.status(404).json({ message: "Resource requirement block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating resource requirement block:", error);
      res.status(500).json({ message: "Failed to update resource requirement block" });
    }
  });

  app.delete("/api/resource-requirement-blocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(schema.resourceRequirementBlocks)
        .where(eq(schema.resourceRequirementBlocks.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting resource requirement block:", error);
      res.status(500).json({ message: "Failed to delete resource requirement block" });
    }
  });



  return createServer(app);
}