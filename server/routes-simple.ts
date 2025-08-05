import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-basic";
import { insertPlantSchema, insertCapabilitySchema, insertResourceSchema, insertUserSchema, insertProductionOrderSchema } from "../shared/schema-simple";
import { db } from "./db";
import * as schema from "../shared/schema";
import { sql, eq, or, ilike, and } from "drizzle-orm";
import { processAICommand, processDesignStudioAIRequest } from "./ai-agent";
import bcrypt from "bcryptjs";

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  let userId = req.session?.userId;
  
  // Check for token in Authorization header if session fails
  if (!userId && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    
    // Handle demo tokens
    if (token.startsWith('demo_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 3) {
        userId = tokenParts[1] + '_' + tokenParts[2]; // demo_exec, demo_prod, etc.
      }
    }
    // Extract user ID from regular token (format: user_ID_timestamp_random)
    else if (token.startsWith('user_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 2) {
        userId = parseInt(tokenParts[1]);
      }
    }
  }
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Add userId to request for use in route handlers
  req.user = { id: userId };
  next();
}

export function registerSimpleRoutes(app: express.Application): Server {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Authentication endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
          id: "demo_user",
          username: "demo_user", 
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
          isActive: true,
          roles: [{
            id: 2,
            name: "Production Scheduler",
            description: "Production Scheduler with basic permissions",
            permissions: [
              { id: 1, name: "schedule-view", feature: "schedule", action: "view", description: "View schedules" },
              { id: 2, name: "schedule-create", feature: "schedule", action: "create", description: "Create schedules" },
              { id: 3, name: "schedule-edit", feature: "schedule", action: "edit", description: "Edit schedules" },
              { id: 4, name: "schedule-delete", feature: "schedule", action: "delete", description: "Delete schedules" },
              { id: 5, name: "scheduling-optimizer-view", feature: "scheduling-optimizer", action: "view", description: "View scheduling optimizer" },
              { id: 6, name: "shop-floor-view", feature: "shop-floor", action: "view", description: "View shop floor" },
              { id: 7, name: "boards-view", feature: "boards", action: "view", description: "View boards" },
              { id: 8, name: "erp-import-view", feature: "erp-import", action: "view", description: "View ERP import" },
              { id: 9, name: "analytics-view", feature: "analytics", action: "view", description: "View analytics" },
              { id: 10, name: "reports-view", feature: "reports", action: "view", description: "View reports" },
              { id: 11, name: "ai-assistant-view", feature: "ai-assistant", action: "view", description: "Use AI assistant" },
              { id: 12, name: "feedback-view", feature: "feedback", action: "view", description: "View feedback" }
            ]
          }]
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      console.log("Processing token:", token.substring(0, 20) + "...");
      
      // Handle user tokens
      if (token.startsWith('user_')) {
        console.log("Token starts with user_, parsing...");
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2) {
          const userId = parseInt(tokenParts[1]);
          
          try {
            console.log("Extracting userId from token:", userId);
            
            // Use direct database query to bypass storage schema issues
            const userResult = await db.select().from(schema.users).where(eq(schema.users.id, userId));
            const user = userResult[0];
            console.log("Direct DB result:", user ? {id: user.id, username: user.username, isActive: user.isActive, firstName: user.firstName} : "null");
            
            if (user && user.isActive) {
              console.log("Returning admin user data for:", user.username);
              console.log("User details:", { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName });
              return res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isActive: user.isActive,
                roles: [{
                  id: 1,
                  name: "Administrator",
                  description: "Full system administrator with all permissions",
                  permissions: [
                    { id: 1, name: "shop-floor-view", feature: "shop-floor", action: "view", description: "View shop floor" },
                    { id: 2, name: "operator-dashboard-view", feature: "operator-dashboard", action: "view", description: "View operator dashboard" },
                    { id: 3, name: "forklift-driver-view", feature: "forklift-driver", action: "view", description: "View forklift driver" },
                    { id: 4, name: "maintenance-view", feature: "maintenance", action: "view", description: "View maintenance" },
                    { id: 5, name: "disruption-management-view", feature: "disruption-management", action: "view", description: "View disruption management" },
                    { id: 6, name: "optimization-studio-view", feature: "optimization-studio", action: "view", description: "View optimization studio" },
                    { id: 7, name: "demand-planning-view", feature: "demand-planning", action: "view", description: "View demand planning" },
                    { id: 8, name: "inventory-optimization-view", feature: "inventory-optimization", action: "view", description: "View inventory optimization" },
                    { id: 9, name: "business-goals-view", feature: "business-goals", action: "view", description: "View business goals" },
                    { id: 10, name: "systems-management-view", feature: "systems-management", action: "view", description: "View systems management" },
                    { id: 11, name: "systems-integration-view", feature: "systems-integration", action: "view", description: "View systems integration" },
                    { id: 12, name: "industry-templates-view", feature: "industry-templates", action: "view", description: "View industry templates" },
                    { id: 13, name: "visual-factory-view", feature: "visual-factory", action: "view", description: "View visual factory" },
                    { id: 14, name: "chat-view", feature: "chat", action: "view", description: "View chat" },
                    { id: 15, name: "tenant-admin-view", feature: "tenant-admin", action: "view", description: "View tenant administration" }
                  ]
                }]
              });
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        }
      }
      
      // Default fallback
      console.log("Falling back to demo user - token did not match expected pattern or user lookup failed");
      return res.json({
        id: "demo_user",
        username: "demo_user", 
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        isActive: true,
        roles: [{
          id: 2,
          name: "Production Scheduler",
          description: "Production Scheduler with basic permissions",
          permissions: [
            { id: 1, name: "schedule-view", feature: "schedule", action: "view", description: "View schedules" },
            { id: 2, name: "schedule-create", feature: "schedule", action: "create", description: "Create schedules" },
            { id: 3, name: "schedule-edit", feature: "schedule", action: "edit", description: "Edit schedules" },
            { id: 4, name: "schedule-delete", feature: "schedule", action: "delete", description: "Delete schedules" },
            { id: 5, name: "scheduling-optimizer-view", feature: "scheduling-optimizer", action: "view", description: "View scheduling optimizer" },
            { id: 6, name: "shop-floor-view", feature: "shop-floor", action: "view", description: "View shop floor" },
            { id: 7, name: "boards-view", feature: "boards", action: "view", description: "View boards" },
            { id: 8, name: "erp-import-view", feature: "erp-import", action: "view", description: "View ERP import" },
            { id: 9, name: "analytics-view", feature: "analytics", action: "view", description: "View analytics" },
            { id: 10, name: "reports-view", feature: "reports", action: "view", description: "View reports" },
            { id: 11, name: "ai-assistant-view", feature: "ai-assistant", action: "view", description: "Use AI assistant" },
            { id: 12, name: "feedback-view", feature: "feedback", action: "view", description: "View feedback" }
          ]
        }]
      });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint 
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for:", username);
      
      const users = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, username))
        .limit(1);
      
      if (users.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const user = users[0];
      console.log("User found:", user.username, "ID:", user.id);
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await db.update(schema.users)
        .set({ lastLogin: new Date() })
        .where(eq(schema.users.id, user.id));
      
      // Get user roles
      const userRoles = await db.select({
        id: schema.roles.id,
        name: schema.roles.name,
        description: schema.roles.description,
        isActive: schema.roles.isActive,
        isSystemRole: schema.roles.isSystemRole,
        createdAt: schema.roles.createdAt,
        permissionId: schema.permissions.id,
        permissionName: schema.permissions.name,
        feature: schema.permissions.feature,
        action: schema.permissions.action,
        permissionDescription: schema.permissions.description,
        permissionCreatedAt: schema.permissions.createdAt
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .leftJoin(schema.rolePermissions, eq(schema.roles.id, schema.rolePermissions.roleId))
      .leftJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.userRoles.userId, user.id));
      
      // Generate token
      const token = `user_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transformedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roles: formatUserRoles(userRoles)
      };
      
      res.json({
        user: transformedUser,
        token,
        message: "Login successful"
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to format user roles
  function formatUserRoles(userRoles: any[]) {
    const rolesMap = new Map();
    
    userRoles.forEach(row => {
      if (!rolesMap.has(row.id)) {
        rolesMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          permissions: []
        });
      }
      
      if (row.permissionId) {
        rolesMap.get(row.id).permissions.push({
          id: row.permissionId,
          name: row.permissionName,
          feature: row.feature,
          action: row.action,
          description: row.permissionDescription,
          createdAt: row.permissionCreatedAt
        });
      }
    });
    
    return Array.from(rolesMap.values());
  }

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
      res.status(500).json({ error: "Failed to fetch resources" });
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

  const server = createServer(app);
  return server;
}