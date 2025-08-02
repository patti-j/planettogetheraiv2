import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-basic";
import { insertPlantSchema, insertCapabilitySchema, insertResourceSchema, insertUserSchema, insertProductionOrderSchema } from "../shared/schema-simple";
import { db } from "./db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";
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
    res.json({
      id: "demo_user", 
      username: "demo_user",
      email: "demo@example.com",
      isDemo: true
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for:", username);
      
      // Demo authentication - accept any credentials for demo purposes
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

  // Mobile Library API - Returns widgets for mobile library
  app.get("/api/mobile/widgets", async (req, res) => {
    console.log("=== MOBILE WIDGETS ENDPOINT HIT ===");
    
    // Simplified widget data with only targetPlatform categorization
    const mobileWidgets = [
      {
        id: 1,
        title: "Production Overview",
        type: "production-metrics",
        targetPlatform: "both",
        configuration: { metrics: ["output", "efficiency", "quality"] },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Equipment Status",
        type: "equipment-status",
        targetPlatform: "both",
        configuration: { equipment: ["reactor1", "mixer2", "packaging"] },
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Quality Metrics",
        type: "quality-dashboard",
        targetPlatform: "both",
        configuration: { tests: ["pH", "temperature", "purity"] },
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Inventory Levels",
        type: "inventory-tracking",
        targetPlatform: "both",
        configuration: { materials: ["raw_materials", "wip", "finished_goods"] },
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        title: "Schedule Gantt",
        type: "gantt-chart",
        targetPlatform: "both",
        configuration: { view: "weekly", resources: ["all"] },
        createdAt: new Date().toISOString()
      },
      {
        id: 6,
        title: "Operation Sequencer",
        type: "operation-sequencer",
        targetPlatform: "both",
        configuration: { 
          view: "compact", 
          allowReorder: true,
          showResourceFilter: true,
          showStatusFilter: true,
          showOptimizationFlags: true
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 7,
        title: "ATP/CTP Calculator",
        type: "atp-ctp",
        targetPlatform: "both",
        configuration: { 
          view: "full",
          showCalculator: true,
          showOverview: true,
          autoRefresh: true
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 8,
        title: "ATP Overview",
        type: "atp-ctp",
        targetPlatform: "both",
        configuration: { 
          view: "compact",
          compact: true,
          showOverview: true,
          maxItems: 3
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 9,
        title: "Schedule Optimizer",
        type: "schedule-optimizer",
        targetPlatform: "both",
        configuration: { 
          view: "full",
          showTradeoffs: true,
          showOptimization: true,
          allowConfiguration: true
        },
        createdAt: new Date().toISOString()
      }
    ];
    
    console.log("Total widgets returned:", mobileWidgets.length);
    res.json(mobileWidgets);
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

  return createServer(app);
}