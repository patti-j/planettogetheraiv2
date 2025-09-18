import express from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { insertUserSchema, insertCompanyOnboardingSchema, insertUserPreferencesSchema, insertSchedulingMessageSchema } from "@shared/schema";
import { systemMonitoringAgent } from "./monitoring-agent";
import { schedulingAI } from "./services/scheduling-ai";
import path from "path";
import fs from "fs";

// Extend the global namespace to include tokenStore
declare global {
  var tokenStore: Map<string, {
    userId: number;
    userData: any;
    createdAt: number;
    expiresAt: number;
  }> | undefined;
}

const router = express.Router();

// Serve Bryntum static assets
router.get('/schedulerpro.classic-light.css', (req, res) => {
  const cssPath = path.join(process.cwd(), 'attached_assets/build/thin/schedulerpro.classic-light.thin.css');
  res.sendFile(cssPath);
});

router.get('/schedulerpro.umd.js', (req, res) => {
  const jsPath = path.join(process.cwd(), 'attached_assets/build/schedulerpro.umd.js');
  res.sendFile(jsPath);
});

router.get('/fonts/*', (req, res) => {
  const fontFile = (req.params as any)[0];
  const fontPath = path.join(process.cwd(), 'attached_assets/build/thin/fonts', fontFile);
  res.sendFile(fontPath);
});

// Authentication routes
router.post("/auth/login", async (req, res) => {
  try {
    console.log("=== LOGIN DEBUG ===");
    const { username, password } = req.body;
    console.log(`Username: ${username}`);
    console.log(`Password length: ${password?.length}`);

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username or email
    const user = await storage.getUserByUsernameOrEmail(username);
    console.log("=== USER DATA FROM DATABASE ===");
    console.log(`User found: ${user?.username} ID: ${user?.id}`);
    console.log(`User email: ${user?.email}`);
    console.log(`User firstName: ${user?.firstName}`);
    console.log(`User lastName: ${user?.lastName}`);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get user roles and permissions
    const userRoles = await storage.getUserRoles(user.id);
    const roles = [];
    const allPermissions: string[] = [];

    for (const userRole of userRoles) {
      const role = await storage.getRole(userRole.roleId);
      if (role) {
        const rolePermissions = await storage.getRolePermissions(role.id);
        const permissions = [];
        
        for (const rp of rolePermissions) {
          const permission = await storage.getPermission(rp.permissionId);
          if (permission) {
            allPermissions.push(permission.name);
            permissions.push({
              id: permission.id,
              name: permission.name,
              feature: permission.feature,
              action: permission.action,
              description: permission.description || `${permission.action} access to ${permission.feature}`
            });
          }
        }
        roles.push({
          id: role.id,
          name: role.name,
          description: role.description || `${role.name} role with assigned permissions`,
          permissions: permissions
        });
      }
    }

    console.log(`User roles: ${roles.map(r => r.name).join(', ')}`);

    // Verify password
    const isValid = await bcryptjs.compare(password, user.passwordHash);
    console.log(`Password comparison result: ${isValid}`);

    if (!isValid) {
      console.log("Password verification failed");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Generate secure token (user ID + timestamp + secure secret from env)
    const tokenPayload = `${user.id}:${Date.now()}:${process.env.SESSION_SECRET || 'dev-secret-key'}`;
    const token = Buffer.from(tokenPayload).toString('base64');
    
    console.log(`Generated token for user ${user.id}`);
    
    // Store token mapping in memory (in production, use Redis)
    global.tokenStore = global.tokenStore || new Map();
    global.tokenStore.set(token, {
      userId: user.id,
      userData: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
        permissions: allPermissions
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days for development convenience
    });
    
    console.log("Login successful - token based");
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
        permissions: allPermissions
      },
      token: token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("planettogether_session"); // Clear the correct cookie name
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res) => {
  console.log("=== AUTH CHECK ===");
  console.log(`Authorization header: ${req.headers.authorization}`);
  console.log(`Session userId: ${req.session.userId}`);
  
  const authHeader = req.headers.authorization;
  let tokenData = null;
  
  // Try Bearer token first
  if (authHeader && authHeader.startsWith('Bearer ')) {
  
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Check token store first
    global.tokenStore = global.tokenStore || new Map();
    tokenData = global.tokenStore.get(token);
  
  // If not in memory store, try to reconstruct from token (for server restart resilience)
  if (!tokenData) {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId, timestamp, secret] = decoded.split(':');
      const expectedSecret = process.env.SESSION_SECRET || 'dev-secret-key';
      
      if (secret === expectedSecret && !isNaN(Number(userId)) && !isNaN(Number(timestamp))) {
        const tokenAge = Date.now() - Number(timestamp);
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (tokenAge < maxAge) {
          // Token is valid but not in memory store - need to fetch user from database
          console.log(`Token valid but not in memory store - fetching user ${userId} from database`);
          
          try {
            const user = await storage.getUser(Number(userId));
            if (user && user.isActive) {
              // Get user roles and permissions from database
              const userRoles = await storage.getUserRoles(user.id);
              const roles = [];
              const allPermissions = [];
              
              for (const userRole of userRoles) {
                const role = await storage.getRole(userRole.roleId);
                if (role) {
                  // Get role permissions
                  const rolePermissions = await storage.getRolePermissions(role.id);
                  const permissions = [];
                  
                  for (const rp of rolePermissions) {
                    const permission = await storage.getPermission(rp.permissionId);
                    if (permission) {
                      allPermissions.push(permission.name);
                      permissions.push({
                        id: permission.id,
                        name: permission.name,
                        feature: permission.feature,
                        action: permission.action,
                        description: permission.description || `${permission.action} access to ${permission.feature}`
                      });
                    }
                  }
                  
                  roles.push({
                    id: role.id,
                    name: role.name,
                    description: role.description || `${role.name} role with assigned permissions`,
                    permissions: permissions
                  });
                }
              }
              
              tokenData = {
                userId: user.id,
                userData: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  roles: roles,
                  permissions: allPermissions
                },
                createdAt: Number(timestamp),
                expiresAt: Number(timestamp) + maxAge
              };
              
              // Re-add to memory store
              global.tokenStore.set(token, tokenData);
            }
          } catch (dbError) {
            console.log("Failed to fetch user from database:", dbError);
          }
        }
      }
    } catch (error) {
      console.log("Could not reconstruct token:", error);
    }
  }
  
  }
  
  // If no Bearer token or invalid token, try session fallback
  if (!tokenData && req.session.userId) {
    console.log("No valid token, trying session fallback");
    try {
      const user = await storage.getUser(req.session.userId);
      if (user && user.isActive) {
        // Get user roles and permissions from database
        const userRoles = await storage.getUserRoles(user.id);
        const roles = [];
        const allPermissions = [];
        
        for (const userRole of userRoles) {
          const role = await storage.getRole(userRole.roleId);
          if (role) {
            // Get role permissions
            const rolePermissions = await storage.getRolePermissions(role.id);
            const permissions = [];
            
            for (const rp of rolePermissions) {
              const permission = await storage.getPermission(rp.permissionId);
              if (permission) {
                allPermissions.push(permission.name);
                permissions.push({
                  id: permission.id,
                  name: permission.name,
                  feature: permission.feature,
                  action: permission.action,
                  description: permission.description || `${permission.action} access to ${permission.feature}`
                });
              }
            }
            
            roles.push({
              id: role.id,
              name: role.name,
              description: role.description || `${role.name} role with assigned permissions`,
              permissions: permissions
            });
          }
        }
        
        tokenData = {
          userId: user.id,
          userData: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: roles,
            permissions: allPermissions
          }
        };
      }
    } catch (error) {
      console.log("Session fallback failed:", error);
    }
  }

  if (!tokenData) {
    console.log("No valid authentication found");
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
    console.log("Token expired");
    if (global.tokenStore && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      global.tokenStore.delete(token);
    }
    return res.status(401).json({ message: "Token expired" });
  }
  
  console.log(`Token valid for user ${tokenData.userId}`);
  res.json({ user: tokenData.userData });
});

// User management routes
router.get("/users", async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Company onboarding routes
router.get("/onboarding/status", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const onboarding = await storage.getCompanyOnboarding(userId);
    res.json({
      success: true,
      data: onboarding || {
        onboardingProgress: 0,
        isCompleted: false,
        completedSteps: [],
        primaryGoals: [],
        currentChallenges: []
      }
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred while fetching onboarding status" 
    });
  }
});

router.post("/onboarding", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const data = { ...req.body, userId };
    const onboarding = await storage.createCompanyOnboarding(data);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    console.error("Error creating onboarding:", error);
    res.status(500).json({ message: "Failed to create onboarding" });
  }
});

// User preferences routes
router.get("/user-preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const preferences = await storage.getUserPreferences(userId);
    
    // Return default preferences if none exist
    const defaultPreferences = {
      theme: "light",
      language: "en",
      timezone: "UTC",
      dashboardLayout: {},
      notificationSettings: {},
      uiSettings: {}
    };

    res.json({
      error: preferences ? undefined : "Failed to fetch user preferences",
      ...defaultPreferences,
      ...preferences
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ 
      error: "Failed to fetch user preferences",
      theme: "light",
      language: "en",
      timezone: "UTC",
      dashboardLayout: {},
      notificationSettings: {},
      uiSettings: {}
    });
  }
});

router.post("/user-preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const existing = await storage.getUserPreferences(userId);
    
    if (existing) {
      const updated = await storage.updateUserPreferences(userId, req.body);
      res.json(updated);
    } else {
      const created = await storage.createUserPreferences({ userId, ...req.body });
      res.json(created);
    }
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ message: "Failed to save user preferences" });
  }
});

// Recent pages routes
router.post("/recent-pages", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await storage.saveRecentPage({ userId, ...req.body });
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving recent page:", error);
    res.status(500).json({ message: "Failed to save recent page" });
  }
});

router.get("/recent-pages", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const pages = await storage.getRecentPages(userId);
    res.json(pages);
  } catch (error) {
    console.error("Error fetching recent pages:", error);
    res.status(500).json([]);
  }
});

// Basic manufacturing data routes
router.get("/plants", async (req, res) => {
  try {
    const plants = await storage.getPlants();
    res.json(plants);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ message: "Failed to fetch plants" });
  }
});

router.get("/resources", async (req, res) => {
  try {
    const resources = await storage.getResources();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

router.get("/job-operations", async (req, res) => {
  try {
    const operations = await storage.getJobOperations();
    res.json(operations);
  } catch (error) {
    console.error("Error fetching job operations:", error);
    res.status(500).json({ message: "Failed to fetch job operations" });
  }
});

router.get("/manufacturing-orders", async (req, res) => {
  try {
    const orders = await storage.getManufacturingOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching manufacturing orders:", error);
    res.status(500).json({ message: "Failed to fetch manufacturing orders" });
  }
});

// User role endpoints for workspace switcher
router.get("/users/:userId/assigned-roles", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userRoles = await storage.getUserRoles(userId);
    const roles = [];

    for (const userRole of userRoles) {
      const role = await storage.getRole(userRole.roleId);
      if (role) {
        roles.push({
          id: role.id,
          name: role.name,
          description: role.description || `${role.name} role`
        });
      }
    }

    res.json(roles);
  } catch (error) {
    console.error("Error fetching user assigned roles:", error);
    res.status(500).json({ message: "Failed to fetch assigned roles" });
  }
});

router.get("/users/:userId/current-role", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userRoles = await storage.getUserRoles(userId);
    
    if (userRoles.length > 0) {
      // Return the first role as the current role (in a real app, this would be tracked separately)
      const role = await storage.getRole(userRoles[0].roleId);
      if (role) {
        res.json({
          id: role.id,
          name: role.name,
          description: role.description || `${role.name} role`
        });
        return;
      }
    }
    
    res.json(null);
  } catch (error) {
    console.error("Error fetching user current role:", error);
    res.status(500).json({ message: "Failed to fetch current role" });
  }
});

// PT Operations endpoint - reads from PT tables
router.get("/pt-operations", async (req, res) => {
  try {
    console.log('Fetching PT operations from ptjoboperations table...');
    
    // Query PT operations with joins to get resource and job information
    const ptOperationsQuery = `
      SELECT 
        -- Operation core data from ptjoboperations
        jo.id as operation_id,
        jo.external_id as operation_external_id,
        jo.name as operation_name,
        jo.description as operation_description,
        jo.operation_id as base_operation_id,
        jo.required_finish_qty,
        jo.cycle_hrs,
        jo.setup_hours,
        jo.post_processing_hours,
        jo.scheduled_start,
        jo.scheduled_end,
        jo.percent_finished,
        
        -- Job information from ptjobs
        j.id as job_id,
        j.external_id as job_external_id,
        j.name as job_name,
        j.description as job_description,
        j.priority as job_priority,
        j.need_date_time as job_due_date,
        j.scheduled_status as job_status,
        
        -- Activity information from ptjobactivities
        ja.id as activity_id,
        ja.external_id as activity_external_id,
        ja.production_status as activity_status,
        ja.comments as activity_comments,
        
        -- Resource assignment from ptjobresources
        jr.id as job_resource_id,
        jr.default_resource_id as actual_resource_id,
        jr.is_primary,
        
        -- Resource information from ptresources
        r.id as resource_db_id,           -- numeric PK (internal only)
        r.resource_id as resource_id,     -- ✅ canonical STRING id for UI matching
        r.external_id as resource_external_id,
        r.name as resource_name,
        r.description as resource_description,
        r.bottleneck as is_bottleneck,
        r.active as resource_active,
        
        -- Plant information from ptplants
        p.id as plant_id,
        p.external_id as plant_external_id,
        p.name as plant_name,
        p.description as plant_description
        
      FROM ptjoboperations jo
      LEFT JOIN ptjobs j ON jo.job_id = j.id
      LEFT JOIN ptjobactivities ja ON ja.operation_id = jo.id
      LEFT JOIN ptjobresources jr ON jr.operation_id = jo.id AND jr.is_primary = true
      LEFT JOIN ptresources r ON jr.default_resource_id = r.resource_id
      LEFT JOIN ptplants p ON r.plant_id = p.id
      ORDER BY 
        jo.scheduled_start ASC NULLS LAST,
        jo.id ASC
      LIMIT 100
    `;

    const rawOperations = await db.execute(sql.raw(ptOperationsQuery));
    
    // Transform the data for the frontend (handle Neon/Drizzle result format)
    const operationsData = Array.isArray(rawOperations) ? rawOperations : rawOperations.rows || [];
    const operations = operationsData.map((op: any) => ({
      id: op.operation_id,
      name: op.operation_name || `Operation ${op.operation_id}`,
      jobName: op.job_name,
      operationName: op.operation_name,
      resourceName: op.resource_name || 'Unassigned',
      resourceId: op.resource_id ? String(op.resource_id) : null,  // Convert to string to match Bryntum requirements
      startDate: op.scheduled_start,  // Use camelCase for Bryntum
      endDate: op.scheduled_end,      // Use camelCase for Bryntum
      duration: (op.cycle_hrs || 2) * 60, // Convert hours to minutes
      percent_done: op.percent_finished || 0,
      status: op.activity_status || 'Not Started',
      priority: op.job_priority || 'Medium',
      dueDate: op.job_due_date
    }));

    console.log(`Successfully fetched ${operations.length} PT operations`);
    res.json(operations);
    
  } catch (error) {
    console.error("Error fetching PT operations:", error);
    res.status(500).json({ message: "Failed to fetch PT operations", error: (error as Error).message });
  }
});

// PT Resources endpoint - reads from PT tables
router.get("/pt-resources", async (req, res) => {
  try {
    console.log('Fetching PT resources from ptresources table...');
    
    // Query PT resources with plant information
    const ptResourcesQuery = `
      SELECT DISTINCT
        r.resource_id as id,  -- Use resource_id as the ID for proper mapping with operations
        r.external_id,
        r.name,
        r.description,
        r.bottleneck,
        r.capacity_type,
        r.hourly_cost,
        r.load_percent,
        r.online_hrs,
        r.active,
        p.name as plant_name,
        p.external_id as plant_external_id
      FROM ptresources r
      LEFT JOIN ptplants p ON r.plant_id = p.id
      WHERE r.active = true
      ORDER BY r.name
    `;

    const rawResources = await db.execute(sql.raw(ptResourcesQuery));
    
    // Transform the data for the frontend (handle Neon/Drizzle result format)
    const resourcesData = Array.isArray(rawResources) ? rawResources : rawResources.rows || [];
    const resources = resourcesData.map((resource: any) => ({
      id: resource.id,
      external_id: resource.external_id,
      name: resource.name || `Resource ${resource.id}`,
      description: resource.description,
      category: resource.resource_type || 'Manufacturing',
      capacity: resource.capacity,
      efficiency: resource.efficiency || 100,
      isBottleneck: resource.bottleneck || false,
      plantName: resource.plant_name,
      active: resource.active
    }));

    console.log(`Successfully fetched ${resources.length} PT resources`);
    res.json(resources);
    
  } catch (error) {
    console.error("Error fetching PT resources:", error);
    res.status(500).json({ message: "Failed to fetch PT resources", error: (error as Error).message });
  }
});

// PT Dependencies endpoint
router.get("/pt-dependencies", async (req, res) => {
  try {
    console.log('Fetching PT dependencies...');
    const dependencies = await storage.getPtDependencies();
    console.log(`Successfully fetched ${dependencies.length} PT dependencies`);
    res.json(dependencies);
  } catch (error) {
    console.error("Error fetching PT dependencies:", error);
    res.status(500).json({ message: "Failed to fetch PT dependencies", error: (error as Error).message });
  }
});

// Export endpoint for Bryntum scheduler
router.post("/export", async (req, res) => {
  try {
    const { format = 'pdf', data } = req.body;
    
    // For now, return a simple success response
    // In production, you would generate actual PDF/Excel files here
    res.json({ 
      success: true, 
      message: `Export to ${format.toUpperCase()} initiated`,
      format: format,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error exporting schedule:", error);
    res.status(500).json({ message: "Failed to export schedule" });
  }
});

// System Monitoring Agent API Routes
router.get("/monitoring-agent/status", async (req, res) => {
  try {
    const status = systemMonitoringAgent.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error getting monitoring agent status:", error);
    res.status(500).json({ error: "Failed to get monitoring agent status" });
  }
});

router.post("/monitoring-agent/start", async (req, res) => {
  try {
    await systemMonitoringAgent.start();
    res.json({ success: true, message: "Monitoring agent started" });
  } catch (error) {
    console.error("Error starting monitoring agent:", error);
    res.status(500).json({ error: "Failed to start monitoring agent" });
  }
});

router.post("/monitoring-agent/stop", async (req, res) => {
  try {
    await systemMonitoringAgent.stop();
    res.json({ success: true, message: "Monitoring agent stopped" });
  } catch (error) {
    console.error("Error stopping monitoring agent:", error);
    res.status(500).json({ error: "Failed to stop monitoring agent" });
  }
});

// Serve Bryntum Production Scheduler HTML  
router.get("/scheduler-demo", (req, res) => {
  try {
    console.log('Serving production scheduler HTML...');
    const htmlPath = path.join(process.cwd(), 'attached_assets', 'production-scheduler-noUnscheduled.html');
    
    // Check if file exists
    if (!fs.existsSync(htmlPath)) {
      console.error('Demo HTML file not found at:', htmlPath);
      return res.status(404).send('Demo HTML file not found');
    }
    
    // Read and send the HTML file
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    console.log('Successfully read HTML file, size:', htmlContent.length, 'bytes');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving demo HTML:', error);
    res.status(500).send('Error loading demo page');
  }
});

// ============================================
// AI Scheduling Routes
// ============================================

// Rate limiting for scheduling AI
const rateLimitMap = new Map<number, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Authentication middleware for AI routes
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  global.tokenStore = global.tokenStore || new Map();
  const tokenData = global.tokenStore.get(token);
  
  if (!tokenData || Date.now() > tokenData.expiresAt) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  req.userId = tokenData.userId;
  next();
}

// Main AI query endpoint
router.post("/ai/schedule/query", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before sending more requests.' 
      });
    }
    
    let convId = conversationId;
    
    // Create new conversation if needed
    if (!convId) {
      const title = await schedulingAI.generateTitle(message);
      const conversation = await storage.createSchedulingConversation({
        userId,
        title,
        page: 'production-schedule'
      });
      convId = conversation.id;
    }
    
    // Save user message
    await storage.addSchedulingMessage({
      conversationId: convId,
      role: 'user',
      content: message
    });
    
    // Get conversation history
    const history = await storage.getSchedulingMessages(convId);
    const formattedHistory = history
      .filter(msg => msg.id !== history[history.length - 1]?.id) // Exclude the just-added message
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Generate AI response
    const aiResponse = await schedulingAI.generateResponse(message, formattedHistory);
    
    // Save AI response
    const assistantMessage = await storage.addSchedulingMessage({
      conversationId: convId,
      role: 'assistant',
      content: aiResponse
    });
    
    res.json({
      conversationId: convId,
      message: assistantMessage
    });
  } catch (error) {
    console.error('AI scheduling query error:', error);
    res.status(500).json({ error: 'Failed to process scheduling query' });
  }
});

// Get user's conversations
router.get("/ai/schedule/conversations", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversations = await storage.getSchedulingConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get("/ai/schedule/messages/:conversationId", requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    const messages = await storage.getSchedulingMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete a conversation
router.delete("/ai/schedule/conversations/:conversationId", requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    const success = await storage.deleteSchedulingConversation(conversationId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

export default router;