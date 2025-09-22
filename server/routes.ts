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

// Development-only endpoint for auto-authentication
router.get("/auth/dev-token", async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: "Forbidden in production" });
  }
  
  console.log("🔧 Development auto-authentication requested");
  
  try {
    // Get or create admin user for development
    let user = await storage.getUser(1); // Admin user typically has ID 1
    
    if (!user) {
      // Create a default admin user for development
      user = await storage.createUser({
        username: "admin",
        email: "admin@planettogether.com",
        firstName: "Admin",
        lastName: "User",
        passwordHash: await bcryptjs.hash("admin123", 10),
        isActive: true
      });
    }
    
    // Get user roles and permissions
    const userRoles = await storage.getUserRoles(user.id);
    const roles = [];
    const allPermissions = [];
    
    if (userRoles.length === 0) {
      // Create default admin role for development
      let adminRole = await storage.getRoleByName("Administrator");
      if (!adminRole) {
        adminRole = await storage.createRole({
          name: "Administrator",
          description: "System administrator with full access",
          isActive: true,
          isSystemRole: true
        });
      }
      
      // Assign admin role to user
      await storage.assignUserRole(user.id, adminRole.id);
      
      // Add to roles array
      roles.push({
        id: adminRole.id,
        name: adminRole.name,
        description: adminRole.description || "Administrator role",
        permissions: [] // Will be populated with hardcoded permissions on frontend
      });
    } else {
      // Get existing roles
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
            description: role.description || `${role.name} role`,
            permissions: permissions
          });
        }
      }
    }
    
    // Generate secure token
    const tokenPayload = `${user.id}:${Date.now()}:${process.env.SESSION_SECRET || 'dev-secret-key'}`;
    const token = Buffer.from(tokenPayload).toString('base64');
    
    console.log(`🔧 Generated dev token for user ${user.id}`);
    
    // Store token mapping in memory
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
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    console.log("🔧 Development auto-authentication successful");
    
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
    console.error("Dev token generation error:", error);
    res.status(500).json({ message: "Failed to generate development token" });
  }
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
    // Check for token authentication
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check token store
      global.tokenStore = global.tokenStore || new Map();
      let tokenData = global.tokenStore.get(token);
      
      // If not in memory store, try to reconstruct from token (for server restart resilience)
      if (!tokenData) {
        try {
          const decoded = Buffer.from(token, 'base64').toString();
          const [tokenUserId, timestamp] = decoded.split(':');
          
          if (!isNaN(Number(tokenUserId)) && !isNaN(Number(timestamp))) {
            const tokenAge = Date.now() - Number(timestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (tokenAge < maxAge) {
              // Verify user exists in database
              const user = await storage.getUser(Number(tokenUserId));
              if (user && user.isActive) {
                userId = Number(tokenUserId);
              }
            }
          }
        } catch (err) {
          // Invalid token format
        }
      } else if (tokenData.expiresAt > Date.now()) {
        userId = tokenData.userId;
      }
    }
    
    // Fallback to session
    if (!userId) {
      userId = (req.session as any)?.userId;
    }
    
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
    // Check for token authentication
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check token store
      global.tokenStore = global.tokenStore || new Map();
      let tokenData = global.tokenStore.get(token);
      
      // If not in memory store, try to reconstruct from token (for server restart resilience)
      if (!tokenData) {
        try {
          const decoded = Buffer.from(token, 'base64').toString();
          const [tokenUserId, timestamp] = decoded.split(':');
          
          if (!isNaN(Number(tokenUserId)) && !isNaN(Number(timestamp))) {
            const tokenAge = Date.now() - Number(timestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (tokenAge < maxAge) {
              // Verify user exists in database
              const user = await storage.getUser(Number(tokenUserId));
              if (user && user.isActive) {
                userId = Number(tokenUserId);
              }
            }
          }
        } catch (err) {
          // Invalid token format
        }
      } else if (tokenData.expiresAt > Date.now()) {
        userId = tokenData.userId;
      }
    }
    
    // Fallback to session
    if (!userId) {
      userId = (req.session as any)?.userId;
    }
    
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

// ============================================
// PT BREWERY DATA GENERATION
// ============================================

router.post("/api/generate-brewery-data", async (req, res) => {
  try {
    console.log('Starting brewery data generation...');
    
    // Standard brewery process steps with durations (in hours)
    const brewerySteps = [
      { name: 'Milling', sequence: 10, duration: 1, resource_pattern: 'mill' },
      { name: 'Mashing', sequence: 20, duration: 2, resource_pattern: 'mash' },
      { name: 'Lautering', sequence: 30, duration: 1.5, resource_pattern: 'lauter' },
      { name: 'Boiling', sequence: 40, duration: 1, resource_pattern: 'boil|kettle' },
      { name: 'Whirlpool', sequence: 50, duration: 0.5, resource_pattern: 'whirlpool', optional: true },
      { name: 'Cooling', sequence: 60, duration: 0.5, resource_pattern: 'cool|exchanger' },
      { name: 'Fermentation', sequence: 70, duration: 72, resource_pattern: 'ferment' }
    ];
    
    // Get all brewery resources
    const resourcesQuery = `
      SELECT resource_id, name, external_id 
      FROM ptresources 
      WHERE active = true
      ORDER BY name
    `;
    const resources = await db.execute(sql.raw(resourcesQuery));
    const resourceRows = Array.isArray(resources) ? resources : resources.rows || [];
    
    // Map resources to steps
    const resourceMap = new Map();
    console.log(`Found ${resourceRows.length} resources`);
    for (const step of brewerySteps) {
      const pattern = new RegExp(step.resource_pattern, 'i');
      const matchingResource = resourceRows.find((r: any) => pattern.test(r.name));
      if (matchingResource) {
        resourceMap.set(step.name, matchingResource.resource_id);
        console.log(`Mapped ${step.name} to resource ${matchingResource.name} (${matchingResource.resource_id})`);
      } else {
        console.log(`WARNING: No resource found for ${step.name} with pattern ${step.resource_pattern}`);
      }
    }
    
    // Get all existing brewery jobs (limit to first 10 for testing)
    const jobsQuery = `
      SELECT j.id, j.external_id, j.name, j.description 
      FROM ptjobs j
      WHERE j.external_id LIKE 'JOB-%'
      ORDER BY j.id
      LIMIT 10
    `;
    const jobs = await db.execute(sql.raw(jobsQuery));
    const jobRows = Array.isArray(jobs) ? jobs : jobs.rows || [];
    
    let operationsAdded = 0;
    let jobsProcessed = 0;
    
    console.log(`Processing ${jobRows.length} existing jobs...`);
    
    // Process each existing job
    for (const job of jobRows) {
      console.log(`Processing job ${job.external_id}...`);
      // Get existing operations for this job
      const existingOpsQuery = `
        SELECT name, sequence_number 
        FROM ptjoboperations 
        WHERE job_id = $1
      `;
      const existingOps = await db.execute(sql.raw(existingOpsQuery.replace('$1', job.id.toString())));
      const existingOpsRows = Array.isArray(existingOps) ? existingOps : existingOps.rows || [];
      const existingOpNames = new Set(existingOpsRows.map((op: any) => op.name.toLowerCase()));
      
      // Determine which steps are missing
      let baseTime = new Date();
      let lastEndTime = baseTime;
      
      // Find the latest scheduled end time if operations exist
      if (existingOpsRows.length > 0) {
        const lastOpQuery = `
          SELECT MAX(scheduled_end) as last_end 
          FROM ptjoboperations 
          WHERE job_id = $1 AND scheduled_end IS NOT NULL
        `;
        const lastOpResult = await db.execute(sql.raw(lastOpQuery.replace('$1', job.id.toString())));
        const lastOpRows = Array.isArray(lastOpResult) ? lastOpResult : lastOpResult.rows || [];
        if (lastOpRows[0]?.last_end) {
          lastEndTime = new Date(lastOpRows[0].last_end);
        }
      }
      
      // Determine if this beer should skip whirlpool (unfiltered styles)
      const skipWhirlpool = job.name?.toLowerCase().includes('wheat') || 
                           job.name?.toLowerCase().includes('hefe') ||
                           job.description?.toLowerCase().includes('unfiltered');
      
      // Add missing operations
      for (const step of brewerySteps) {
        if (existingOpNames.has(step.name.toLowerCase())) {
          continue; // Skip existing operations
        }
        
        if (step.optional && skipWhirlpool) {
          continue; // Skip optional steps for certain styles
        }
        
        const resourceId = resourceMap.get(step.name);
        if (!resourceId) {
          console.log(`Warning: No resource found for ${step.name}, skipping`);
          continue;
        }
        
        // Calculate scheduled times
        const scheduledStart = new Date(lastEndTime);
        const scheduledEnd = new Date(scheduledStart.getTime() + step.duration * 60 * 60 * 1000);
        lastEndTime = scheduledEnd;
        
        const opExternalId = `${job.external_id}-${step.name}-${Date.now()}`;
        const opDescription = `${step.name} process for ${(job.name || job.external_id).replace(/'/g, "''")}`;
        
        console.log(`  Adding ${step.name} operation...`);
        
        const insertOpQuery = `
          INSERT INTO ptjoboperations (
            external_id, name, description, job_id, 
            sequence_number, scheduled_start, scheduled_end,
            cycle_hrs, setup_hours, post_processing_hours,
            required_finish_qty, percent_finished
          ) VALUES (
            '${opExternalId.replace(/'/g, "''")}',
            '${step.name.replace(/'/g, "''")}',
            '${opDescription}',
            ${job.id},
            ${step.sequence},
            '${scheduledStart.toISOString()}',
            '${scheduledEnd.toISOString()}',
            ${step.duration},
            0.25,
            0.1,
            100,
            0
          )
          RETURNING id
        `;
        
        const opResult = await db.execute(sql.raw(insertOpQuery));
        
        const opResultRows = Array.isArray(opResult) ? opResult : opResult.rows || [];
        if (opResultRows[0]) {
          const opId = opResultRows[0].id;
          
          // Insert resource assignment
          await db.execute(sql.raw(`
            INSERT INTO ptjobresources (
              operation_id, default_resource_id, is_primary,
              setup_hrs, cycle_hrs, qty_per_cycle
            ) VALUES (
              ${opId},
              '${resourceId}',
              true,
              0.25,
              ${step.duration},
              100
            )
          `));
          
          // Insert activity
          await db.execute(sql.raw(`
            INSERT INTO ptjobactivities (
              external_id, operation_id, production_status, comments
            ) VALUES (
              'ACT-${opExternalId}',
              ${opId},
              'planned',
              'Auto-generated brewery operation'
            )
          `));
          
          operationsAdded++;
        }
      }
      
      jobsProcessed++;
    }
    
    // Create 3 new complete brewery jobs
    console.log('\nCreating new complete brewery jobs...');
    const newJobStyles = [
      { name: 'IPA', description: 'India Pale Ale - Full Process', skipWhirlpool: false },
      { name: 'Lager', description: 'German Lager - Full Process', skipWhirlpool: false },
      { name: 'Wheat', description: 'Wheat Beer - Unfiltered', skipWhirlpool: true }
    ];
    
    for (let i = 0; i < newJobStyles.length; i++) {
      const style = newJobStyles[i];
      const timestamp = Date.now() + i;
      const jobExternalId = `JOB-${style.name.toUpperCase()}-COMPLETE-${timestamp}`;
      
      // Insert new job
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
      
      console.log(`\nCreating new job: ${jobExternalId}`);
      
      const insertJobQuery = `
        INSERT INTO ptjobs (
          external_id, name, description, priority, 
          need_date_time, scheduled_status
        ) VALUES (
          '${jobExternalId.replace(/'/g, "''")}',
          '${style.name.replace(/'/g, "''")} Batch ${timestamp}',
          '${style.description.replace(/'/g, "''")}',
          2,
          '${dueDate.toISOString()}',
          'scheduled'
        )
        RETURNING id
      `;
      
      const jobResult = await db.execute(sql.raw(insertJobQuery));
      
      const jobResultRows = Array.isArray(jobResult) ? jobResult : jobResult.rows || [];
      if (jobResultRows[0]) {
        const jobId = jobResultRows[0].id;
        let baseTime = new Date();
        baseTime.setHours(baseTime.getHours() + i * 100); // Stagger start times
        let lastEndTime = baseTime;
        
        // Add all operations for this new job
        for (const step of brewerySteps) {
          if (step.optional && style.skipWhirlpool) {
            continue;
          }
          
          const resourceId = resourceMap.get(step.name);
          if (!resourceId) continue;
          
          const scheduledStart = new Date(lastEndTime);
          const scheduledEnd = new Date(scheduledStart.getTime() + step.duration * 60 * 60 * 1000);
          lastEndTime = scheduledEnd;
          
          const opExternalId = `${jobExternalId}-${step.name}`;
          console.log(`    Adding ${step.name} operation...`);
          
          const insertOpQuery = `
            INSERT INTO ptjoboperations (
              external_id, name, description, job_id,
              sequence_number, scheduled_start, scheduled_end,
              cycle_hrs, setup_hours, post_processing_hours,
              required_finish_qty, percent_finished
            ) VALUES (
              '${opExternalId.replace(/'/g, "''")}',
              '${step.name.replace(/'/g, "''")}',
              '${step.name.replace(/'/g, "''")} for ${style.name.replace(/'/g, "''")}',
              ${jobId},
              ${step.sequence},
              '${scheduledStart.toISOString()}',
              '${scheduledEnd.toISOString()}',
              ${step.duration},
              0.25,
              0.1,
              100,
              0
            )
            RETURNING id
          `;
          
          const opResult = await db.execute(sql.raw(insertOpQuery));
          
          const opRows = Array.isArray(opResult) ? opResult : opResult.rows || [];
          if (opRows[0]) {
            const opId = opRows[0].id;
            
            // Insert resource assignment
            await db.execute(sql.raw(`
              INSERT INTO ptjobresources (
                operation_id, default_resource_id, is_primary,
                setup_hrs, cycle_hrs, qty_per_cycle
              ) VALUES (${opId}, '${resourceId}', true, 0.25, ${step.duration}, 100)
            `));
            
            // Insert activity
            await db.execute(sql.raw(`
              INSERT INTO ptjobactivities (
                external_id, operation_id, production_status, comments
              ) VALUES ('ACT-${opExternalId}', ${opId}, 'planned', 'Complete brewery process')
            `));
            
            operationsAdded++;
          }
        }
        
        jobsProcessed++;
      }
    }
    
    console.log(`Brewery data generation complete: ${operationsAdded} operations added across ${jobsProcessed} jobs`);
    
    res.json({
      success: true,
      message: `Generated ${operationsAdded} operations for ${jobsProcessed} brewery jobs`,
      details: {
        existingJobsCompleted: jobRows.length,
        newJobsCreated: newJobStyles.length,
        operationsAdded,
        jobsProcessed
      }
    });
    
  } catch (error) {
    console.error('Error generating brewery data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate brewery data', 
      error: (error as Error).message 
    });
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
      LIMIT 20
    `;

    const rawOperations = await db.execute(sql.raw(ptOperationsQuery));
    
    // Transform the data for the frontend (handle Neon/Drizzle result format)
    const operationsData = Array.isArray(rawOperations) ? rawOperations : rawOperations.rows || [];
    const operations = operationsData.map((op: any) => ({
      id: op.operation_id,
      name: op.operation_name || `Operation ${op.operation_id}`,
      // Use job external_id (batch ID) or description if name is empty
      jobName: op.job_name || op.job_external_id || op.job_description || 'No Job',
      operationName: op.operation_name,
      resourceName: op.resource_name || 'Unassigned',
      resourceId: op.resource_id ? String(op.resource_id) : null,  // Convert to string to match Bryntum requirements
      startDate: op.scheduled_start,  // Use camelCase for Bryntum
      endDate: op.scheduled_end,      // Use camelCase for Bryntum
      duration: (op.cycle_hrs || 2) * 60, // Convert hours to minutes
      percent_done: op.percent_finished || 0,
      status: op.activity_status || 'Not Started',
      priority: op.job_priority || 'Medium',
      dueDate: op.job_due_date,
      // Also pass the raw external_id for dependency grouping
      externalId: op.operation_external_id,
      jobExternalId: op.job_external_id,
      // IMPORTANT: Include job_id for dependency generation
      jobId: op.job_id
    }));

    console.log(`Successfully fetched ${operations.length} PT operations`);
    res.json(operations);
    
  } catch (error) {
    console.error("Error fetching PT operations:", error);
    res.status(500).json({ message: "Failed to fetch PT operations", error: (error as Error).message });
  }
});

// PT Dependencies endpoint - reads from ptjobsuccessormanufacturingorders table
router.get("/pt-dependencies", async (req, res) => {
  try {
    console.log('Fetching PT dependencies from ptjobsuccessormanufacturingorders table...');
    
    // Query PT dependencies with operation information
    const ptDependenciesQuery = `
      SELECT 
        jsm.id as dependency_id,
        jsm.manufacturing_order_id,
        jsm.successor_operation_id,
        jsm.transfer_hrs,
        jsm.usage_qty_per_cycle,
        
        -- Get predecessor operation info by finding the operation that comes before the successor
        curr_op.id as from_operation_id,
        curr_op.external_id as from_external_id,
        curr_op.name as from_operation_name,
        
        -- Get successor operation info
        next_op.id as to_operation_id,
        next_op.external_id as to_external_id,
        next_op.name as to_operation_name
        
      FROM ptjobsuccessormanufacturingorders jsm
      INNER JOIN ptjoboperations next_op ON jsm.successor_operation_id = next_op.id
      -- Find the predecessor operation (the one that comes before the successor)
      LEFT JOIN ptjoboperations curr_op ON 
        SUBSTRING(curr_op.external_id, 1, LENGTH(curr_op.external_id) - 3) = 
        SUBSTRING(next_op.external_id, 1, LENGTH(next_op.external_id) - 3)
        AND CAST(RIGHT(curr_op.external_id, 2) AS INTEGER) = CAST(RIGHT(next_op.external_id, 2) AS INTEGER) - 1
      WHERE curr_op.id IS NOT NULL
      ORDER BY curr_op.external_id, next_op.external_id
    `;

    const rawDependencies = await db.execute(sql.raw(ptDependenciesQuery));
    
    // Transform the data for the frontend - use correct Bryntum field names
    const dependenciesData = Array.isArray(rawDependencies) ? rawDependencies : rawDependencies.rows || [];
    const dependencies = dependenciesData.map((dep: any) => ({
      id: dep.dependency_id,
      from: `op-${dep.from_operation_id}`,  // Bryntum uses 'from' not 'fromEvent'
      to: `op-${dep.to_operation_id}`,      // Bryntum uses 'to' not 'toEvent'
      type: 2, // Finish-to-Start dependency type (standard in Bryntum)
      lag: 0,  // No lag between operations
      lagUnit: 'hour',
      // Keep additional fields for debugging
      fromOperationName: dep.from_operation_name,
      toOperationName: dep.to_operation_name,
      fromExternalId: dep.from_external_id,
      toExternalId: dep.to_external_id
    }));

    console.log(`Successfully fetched ${dependencies.length} PT dependencies`);
    res.json(dependencies);
    
  } catch (error) {
    console.error("Error fetching PT dependencies:", error);
    res.status(500).json({ message: "Failed to fetch PT dependencies", error: (error as Error).message });
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

// Serve Bryntum assets
router.get("/schedulerpro.umd.js", (req, res) => {
  try {
    const jsPath = path.join(process.cwd(), 'attached_assets', 'build', 'thin', 'schedulerpro.module.thin.js');
    
    if (!fs.existsSync(jsPath)) {
      console.error('Bryntum JS file not found at:', jsPath);
      return res.status(404).send('Bryntum JS file not found');
    }
    
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(jsContent);
  } catch (error) {
    console.error('Error serving Bryntum JS:', error);
    res.status(500).send('Error loading Bryntum JS');
  }
});

// Serve Bryntum Production Scheduler HTML  
router.get("/scheduler-demo", (req, res) => {
  try {
    console.log('Serving production scheduler HTML...');
    const htmlPath = path.join(process.cwd(), 'public', 'production-scheduler.html');
    
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

// Authentication middleware for AI routes - aligned with main auth system
async function requireAuth(req: any, res: any, next: any) {
  console.log('[AI Auth] Authenticating request...');
  const authHeader = req.headers.authorization;
  
  // Check for Bearer token in authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AI Auth] Missing or invalid authorization header');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  console.log('[AI Auth] Token received, length:', token.length);
  
  // Initialize token store if needed
  global.tokenStore = global.tokenStore || new Map();
  let tokenData = global.tokenStore.get(token);
  
  // If token not in memory store, try to reconstruct from token (for server restart resilience)
  if (!tokenData) {
    console.log('[AI Auth] Token not in memory store, attempting to reconstruct...');
    
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId, timestamp, secret] = decoded.split(':');
      const expectedSecret = process.env.SESSION_SECRET || 'dev-secret-key';
      
      console.log('[AI Auth] Decoded token - userId:', userId, 'timestamp:', timestamp);
      
      // Validate token format
      if (secret !== expectedSecret) {
        console.log('[AI Auth] Invalid token secret');
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      if (isNaN(Number(userId)) || isNaN(Number(timestamp))) {
        console.log('[AI Auth] Invalid token format - userId or timestamp is not a number');
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      // Check token age (7 days max)
      const tokenAge = Date.now() - Number(timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (tokenAge > maxAge) {
        console.log('[AI Auth] Token expired - age:', Math.floor(tokenAge / 1000 / 60 / 60), 'hours');
        return res.status(401).json({ message: 'Token expired' });
      }
      
      // Token is valid but not in memory store - fetch user from database
      console.log('[AI Auth] Token valid, fetching user', userId, 'from database...');
      
      try {
        const user = await storage.getUser(Number(userId));
        
        if (!user) {
          console.log('[AI Auth] User not found in database');
          return res.status(401).json({ message: 'User not found' });
        }
        
        if (!user.isActive) {
          console.log('[AI Auth] User account is inactive');
          return res.status(401).json({ message: 'User account inactive' });
        }
        
        // Get user roles and permissions from database
        console.log('[AI Auth] Fetching user roles and permissions...');
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
        
        // Reconstruct token data
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
        
        // Store in memory for future requests
        global.tokenStore.set(token, tokenData);
        console.log('[AI Auth] Token reconstructed and cached for user:', user.id);
        
      } catch (dbError) {
        console.error('[AI Auth] Database error while fetching user:', dbError);
        return res.status(500).json({ message: 'Authentication service error' });
      }
      
    } catch (error) {
      console.error('[AI Auth] Error reconstructing token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  
  // Check if token is expired
  if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
    console.log('[AI Auth] Token expired for user:', tokenData.userId);
    global.tokenStore.delete(token);
    return res.status(401).json({ message: 'Token expired' });
  }
  
  // Authentication successful - set userId and continue
  req.userId = tokenData.userId;
  req.userData = tokenData.userData; // Also include full user data for potential use
  console.log('[AI Auth] Authentication successful for user:', tokenData.userId);
  next();
}

// Main AI query endpoint
router.post("/ai/schedule/query", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { message, conversationId } = req.body;
    
    console.log('[AI Schedule] Query endpoint called:', {
      userId,
      conversationId,
      messageLength: message?.length,
      hasAuth: !!req.headers.authorization
    });
    
    // Set response type to JSON immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!userId) {
      console.error('[AI Schedule] No userId found in request');
      return res.status(401).json({ error: 'User ID not found in authenticated request' });
    }
    
    if (!message || typeof message !== 'string') {
      console.error('[AI Schedule] Invalid message:', message);
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.warn(`[AI Schedule] Rate limit exceeded for user ${userId}`);
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before sending more requests.' 
      });
    }
    
    let convId = conversationId;
    
    try {
      // Create new conversation if needed
      if (!convId) {
        console.log('[AI Schedule] Creating new conversation for user:', userId);
        const title = await schedulingAI.generateTitle(message);
        const conversation = await storage.createSchedulingConversation({
          userId,
          title,
          page: 'production-schedule'
        });
        convId = conversation.id;
        console.log('[AI Schedule] Created conversation:', convId);
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
      console.log('[AI Schedule] Generating AI response for conversation:', convId);
      const aiResponse = await schedulingAI.generateResponse(message, formattedHistory);
      
      // Save AI response
      const assistantMessage = await storage.addSchedulingMessage({
        conversationId: convId,
        role: 'assistant',
        content: aiResponse
      });
      
      console.log('[AI Schedule] Response generated successfully for user:', userId);
      res.json({
        conversationId: convId,
        message: assistantMessage
      });
      
    } catch (innerError: any) {
      // Handle errors from the AI service specifically
      console.error('[AI Schedule] Inner error during AI processing:', innerError);
      
      // Check if it's an OpenAI-related error
      if (innerError?.message?.includes('OpenAI')) {
        return res.status(503).json({ 
          error: innerError.message,
          details: 'The AI service is having trouble. Please check the API configuration.'
        });
      }
      
      // Check if it's a database error
      if (innerError?.message?.includes('database') || innerError?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Database connection error',
          details: 'Unable to save the conversation. Please try again.'
        });
      }
      
      // Generic inner error
      return res.status(500).json({ 
        error: 'Failed to process your message',
        details: innerError?.message || 'An unexpected error occurred'
      });
    }
    
  } catch (error: any) {
    console.error('[AI Schedule] Error processing query:', error);
    console.error('[AI Schedule] Error stack:', error?.stack);
    console.error('[AI Schedule] Error details:', {
      userId: (req as any).userId,
      hasAuth: !!req.headers.authorization,
      errorMessage: error?.message || 'Unknown error',
      errorType: error?.constructor?.name
    });
    
    // Always return JSON error responses
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to process scheduling query',
      details: error?.message || 'An unexpected error occurred. Please try again.'
    });
  }
});

// Get user's conversations
router.get("/ai/schedule/conversations", requireAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const userId = (req as any).userId;
    console.log('[AI Schedule] Fetching conversations for user:', userId);
    const conversations = await storage.getSchedulingConversations(userId);
    res.json(conversations);
  } catch (error: any) {
    console.error('[AI Schedule] Error fetching conversations:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      details: error?.message || 'Database error'
    });
  }
});

// Get messages for a conversation
router.get("/ai/schedule/messages/:conversationId", requireAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    console.log('[AI Schedule] Fetching messages for conversation:', conversationId);
    const messages = await storage.getSchedulingMessages(conversationId);
    res.json(messages);
  } catch (error: any) {
    console.error('[AI Schedule] Error fetching messages:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      details: error?.message || 'Database error'
    });
  }
});

// Delete a conversation
router.delete("/ai/schedule/conversations/:conversationId", requireAuth, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    console.log('[AI Schedule] Deleting conversation:', conversationId);
    const success = await storage.deleteSchedulingConversation(conversationId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error: any) {
    console.error('[AI Schedule] Error deleting conversation:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to delete conversation',
      details: error?.message || 'Database error'
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

export default router;