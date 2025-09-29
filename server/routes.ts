import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { storage } from "./storage";
import { maxAI } from "./services/max-ai-service";
import { db, directSql } from "./db";
import { 
  insertDashboardSchema, 
  insertWidgetSchema, 
  insertWidgetTypeSchema, 
  Dashboard, 
  Widget, 
  WidgetType,
  InsertDashboard,
  InsertWidget,
  InsertWidgetType,
  // Command & Control schemas
  scheduleJobCommandSchema,
  rescheduleJobCommandSchema,
  prioritizeJobCommandSchema,
  cancelJobCommandSchema,
  assignResourceCommandSchema,
  reassignResourceCommandSchema,
  updateResourceAvailabilitySchema,
  qualityHoldCommandSchema,
  releaseHoldCommandSchema,
  qualityInspectionCommandSchema,
  startOperationCommandSchema,
  stopOperationCommandSchema,
  pauseOperationCommandSchema,
  commandResponseSchema,
  // Semantic Query schemas  
  semanticQuerySchema,
  type SemanticQueryResponse,
  type ScheduleJobCommand,
  type RescheduleJobCommand,
  type PrioritizeJobCommand,
  type CancelJobCommand,
  type AssignResourceCommand,
  type ReassignResourceCommand,
  type UpdateResourceAvailability,
  type QualityHoldCommand,
  type ReleaseHoldCommand,
  type QualityInspectionCommand,
  type StartOperationCommand,
  type StopOperationCommand,
  type PauseOperationCommand,
  type CommandResponse,
} from "@shared/schema";

// Import PT Tables from minimal schema matching actual database structure
import {
  ptJobs,
  ptJobOperations
} from "@shared/schema";
import { insertUserSchema, insertCompanyOnboardingSchema, insertUserPreferencesSchema, insertSchedulingMessageSchema, widgets } from "@shared/schema";
import { systemMonitoringAgent } from "./monitoring-agent";
import { schedulingAI } from "./services/scheduling-ai";
import { log } from "./vite";
import path from "path";
import fs from "fs";
import multer from "multer";

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

// Early development bypass for canvas widgets (must be before any authentication middleware)
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    if (req.path.startsWith('/api/canvas/widgets')) {
      console.log('🔧 [Canvas Widgets] Early dev bypass middleware triggered for:', req.path);
      return next();
    }
    next();
  });
}

// JWT Utilities - Secure token generation and verification
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

function generateJWT(user: any): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    email: user.email
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Configure multer for file uploads (specifically for voice recordings)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.fieldname === 'audio') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voice transcription'));
    }
  }
});

// Configure multer for general file uploads (documents, images, etc.)
const uploadFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for general files
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types for AI analysis
    const allowedTypes = [
      'image/', 'text/', 'application/pdf', 'application/json',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    if (isAllowed || file.fieldname === 'attachments') {
      cb(null, true);
    } else {
      cb(new Error('File type not supported for AI analysis'));
    }
  }
});

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
router.post("/api/auth/login", async (req, res) => {
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

    // Generate secure JWT token
    const token = generateJWT(user);
    
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

router.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("planettogether_session"); // Clear the correct cookie name
    res.json({ message: "Logged out successfully" });
  });
});

// Development-only endpoint for auto-authentication
router.get("/api/auth/dev-token", async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: "Forbidden in production" });
  }
  
  console.log("🔧 Development auto-authentication requested - bypassing database");
  
  // Skip database operations in development if tables don't exist
  const defaultAdminUser = {
    id: 1,
    username: "admin",
    email: "admin@planettogether.com",
    firstName: "Admin",
    lastName: "User",
    roles: [{
      id: 1,
      name: "Administrator", 
      description: "System administrator with full access",
      permissions: []
    }],
    permissions: ["*"]
  };

  // Generate JWT token for consistency
  const token = generateJWT(defaultAdminUser);
  
  // Store in memory
  global.tokenStore = global.tokenStore || new Map();
  global.tokenStore.set(token, {
    userId: 1,
    userData: defaultAdminUser,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  });
  
  console.log("🔧 Development bypass successful - using default admin user");
  
  return res.json({
    user: defaultAdminUser,
    token: token
  });
});

router.get("/api/auth/me", async (req, res) => {
  console.log("=== AUTH CHECK ===");
  console.log(`Authorization header: ${req.headers.authorization}`);
  console.log(`Session userId: ${req.session.userId}`);
  
  // Development bypass - automatically provide admin access
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 Development mode: Providing automatic admin access");
    return res.json({
      user: {
        id: 1,
        username: "admin",
        email: "admin@planettogether.com",
        firstName: "Admin",
        lastName: "User",
        roles: [{
          id: 1,
          name: "Administrator",
          description: "System administrator with full access",
          permissions: []
        }],
        permissions: ["*"] // Full access in dev mode
      }
    });
  }
  
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
      LIMIT 500
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
    
    // Query PT dependencies - create dependencies between operations in the same job
    const ptDependenciesQuery = `
      WITH job_operations AS (
        -- Get all operations grouped by job
        SELECT 
          jo.id as op_id,
          jo.job_id,
          jo.external_id,
          jo.name,
          jo.scheduled_start,
          jo.scheduled_end,
          -- Rank operations within each job by scheduled start time
          ROW_NUMBER() OVER (PARTITION BY jo.job_id ORDER BY jo.scheduled_start, jo.id) as sequence_num
        FROM ptjoboperations jo
        WHERE jo.job_id IS NOT NULL 
          AND jo.scheduled_start IS NOT NULL
      )
      -- Create dependencies between consecutive operations in the same job
      SELECT 
        ROW_NUMBER() OVER () as dependency_id,
        curr.op_id as from_operation_id,
        curr.external_id as from_external_id,
        curr.name as from_operation_name,
        next.op_id as to_operation_id,
        next.external_id as to_external_id,
        next.name as to_operation_name
      FROM job_operations curr
      INNER JOIN job_operations next 
        ON curr.job_id = next.job_id 
        AND curr.sequence_num = next.sequence_num - 1
      ORDER BY curr.job_id, curr.sequence_num
    `;

    const rawDependencies = await db.execute(sql.raw(ptDependenciesQuery));
    
    // Transform the data for the frontend - use correct Bryntum field names
    const dependenciesData = Array.isArray(rawDependencies) ? rawDependencies : rawDependencies.rows || [];
    const dependencies = dependenciesData.map((dep: any) => ({
      id: dep.dependency_id,
      from: dep.from_operation_id,  // Use numeric ID to match operation IDs
      to: dep.to_operation_id,      // Use numeric ID to match operation IDs
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

// NOTE: PT Dependencies endpoint is defined earlier in the file using direct SQL query

// PT Resource Capabilities endpoint - returns resources with their capabilities
router.get("/resources-with-capabilities", async (req, res) => {
  try {
    // Fetch all resources with their capabilities
    const rawData = await db.execute(sql`
      SELECT 
        r.id as resource_id,
        r.name as resource_name,
        r.external_id,
        r.resource_type,
        r.active,
        COALESCE(
          STRING_AGG(rc.capability_id::text, ',' ORDER BY rc.capability_id),
          ''
        ) as capabilities
      FROM ptresources r
      LEFT JOIN ptresourcecapabilities rc ON r.id = rc.resource_id
      WHERE r.active = true
      GROUP BY r.id, r.name, r.external_id, r.resource_type, r.active
      ORDER BY r.id
    `);

    const resourcesWithCapabilities = (rawData.rows || rawData).map((row: any) => ({
      id: row.resource_id,
      name: row.resource_name,
      external_id: row.external_id,
      category: row.resource_type || 'Manufacturing',
      active: row.active,
      capabilities: row.capabilities ? row.capabilities.split(',').map(Number) : []
    }));

    res.json(resourcesWithCapabilities);
  } catch (error) {
    console.error("Error fetching resources with capabilities:", error);
    res.status(500).json({ error: "Failed to fetch resources with capabilities" });
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
router.get("/api/production-scheduler", (req, res) => {
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

// JWT-based authentication middleware - secure and stateless
async function requireAuth(req: any, res: any, next: any) {
  console.log('[JWT Auth] Authenticating request...');
  
  // Development bypass for canvas widgets
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/canvas/widgets')) {
    console.log('🔧 [Canvas Widgets] Development auth bypass for:', req.path);
    return next();
  }
  
  const authHeader = req.headers.authorization;
  
  // Check for Bearer token in authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[JWT Auth] Missing or invalid authorization header');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  console.log('[JWT Auth] Token received, length:', token.length);
  
  // Verify JWT token
  const decoded = verifyJWT(token);
  if (!decoded) {
    console.log('[JWT Auth] Invalid or expired token');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  console.log('[JWT Auth] JWT verified for user:', decoded.userId);
  
  // Fetch user from database to get current roles and permissions
  try {
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      console.log('[JWT Auth] User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      console.log('[JWT Auth] User account is inactive');
      return res.status(401).json({ message: 'User account inactive' });
    }
    
    // Get current user roles and permissions from database
    console.log('[JWT Auth] Fetching user roles and permissions...');
    try {
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
      
      // Set authentication data on request
      req.userId = user.id;
      req.user = user;
      req.userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
        permissions: allPermissions
      };
      
      console.log('[JWT Auth] Authentication successful for user:', user.id);
      next();
      
    } catch (roleError) {
      // If role fetching fails, still allow access with basic user info for development
      console.warn('[JWT Auth] Role fetching failed, allowing basic access:', roleError instanceof Error ? roleError.message : 'Unknown error');
      
      req.userId = user.id;
      req.user = user;
      req.userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [],
        permissions: []
      };
      
      next();
    }
    
  } catch (dbError) {
    console.error('[JWT Auth] Database error while fetching user:', dbError);
    return res.status(500).json({ message: 'Authentication service error' });
  }
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

// AI Recommendations endpoint
router.get("/api/ai/recommendations", requireAuth, async (req, res) => {
  try {
    // Get sample AI recommendations for now - in production this would be from AI service
    const recommendations = [
      {
        id: '1',
        title: 'Optimize Resource M-203 Schedule',
        description: 'Machine M-203 shows 15% idle time. Recommend moving Job-447 earlier to improve utilization.',
        priority: 'high',
        category: 'Resource Optimization',
        confidence: 92,
        estimatedImpact: '+12% efficiency',
        createdAt: new Date().toISOString(),
        aiAgent: 'Production Optimizer'
      },
      {
        id: '2',
        title: 'Quality Alert Pattern Detected',
        description: 'Batch quality issues correlate with morning shift changes. Recommend additional quality checks.',
        priority: 'medium',
        category: 'Quality Control',
        confidence: 87,
        estimatedImpact: '-8% defect rate',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        aiAgent: 'Quality Analyst'
      },
      {
        id: '3',
        title: 'Preventive Maintenance Optimization',
        description: 'Analysis shows equipment downtime can be reduced by 23% with schedule adjustment.',
        priority: 'medium',
        category: 'Maintenance',
        confidence: 78,
        estimatedImpact: '+23% uptime',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        aiAgent: 'Maintenance Scheduler'
      }
    ];
    
    res.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching AI recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch AI recommendations' });
  }
});

// Refer recommendation to users
router.post("/recommendations/refer", requireAuth, async (req, res) => {
  try {
    const { userIds, message, recommendationId } = req.body;
    
    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs are required" });
    }
    
    if (!recommendationId) {
      return res.status(400).json({ error: "Recommendation ID is required" });
    }

    // In a real implementation, this would:
    // 1. Create referral records in the database
    // 2. Send notifications to the referred users
    // 3. Track referral status and responses
    
    console.log(`Recommendation ${recommendationId} referred to users:`, userIds);
    if (message) {
      console.log("Message:", message);
    }

    // Mock successful response
    res.json({ 
      success: true, 
      message: `Recommendation referred to ${userIds.length} user${userIds.length > 1 ? 's' : ''}`,
      referralId: `ref-${Date.now()}`,
      userIds,
      recommendationId,
      message: message || null,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error creating referral:", error);
    res.status(500).json({ error: "Failed to create referral" });
  }
});

// System Events endpoint  
router.get("/api/system/events", requireAuth, async (req, res) => {
  try {
    // Get sample system events for now - in production this would be from event log service
    const events = [
      {
        id: '1',
        type: 'schedule_updated',
        title: 'Production Schedule Updated',
        description: 'Weekly schedule optimized by AI scheduler - 3 jobs rescheduled for better efficiency',
        timestamp: new Date().toISOString(),
        status: 'active',
        source: 'AI Scheduler'
      },
      {
        id: '2',
        type: 'maintenance_completed',
        title: 'Preventive Maintenance Complete',
        description: 'CNC Machine 1 maintenance completed ahead of schedule',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'resolved',
        source: 'Maintenance System'
      },
      {
        id: '3',
        type: 'quality_alert',
        title: 'Quality Inspection Alert',
        description: 'Batch B-4522 flagged for additional quality review',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: 'active',
        source: 'Quality Control'
      },
      {
        id: '4',
        type: 'production_milestone',
        title: 'Production Milestone Achieved',
        description: 'Plant A exceeded weekly production target by 8%',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        status: 'resolved',
        source: 'Production Tracking'
      }
    ];
    
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching system events:', error);
    res.status(500).json({ error: 'Failed to fetch system events' });
  }
});

// Inbox Messages endpoint
router.get("/api/inbox", requireAuth, async (req, res) => {
  try {
    // Get sample inbox messages for now - in production this would be from messaging service
    const messages = [
      {
        id: '1',
        sender: 'Plant Manager A',
        subject: 'Weekly Production Review',
        preview: 'Can we schedule a review of this weeks production metrics and discuss the efficiency improvements...',
        timestamp: new Date().toISOString(),
        isRead: false,
        participants: ['Plant Manager A', 'Production Supervisor']
      },
      {
        id: '2',
        sender: 'Quality Team',
        subject: 'Batch B-4521 Quality Issue',
        preview: 'We need to discuss the quality findings from yesterdays batch and implement corrective actions...',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        participants: ['Quality Team', 'Shift Supervisor']
      },
      {
        id: '3',
        sender: 'Maintenance Crew',
        subject: 'Equipment Maintenance Schedule',
        preview: 'Proposing changes to the preventive maintenance schedule based on recent performance data...',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        participants: ['Maintenance Crew', 'Operations Manager']
      },
      {
        id: '4',
        sender: 'Shift Supervisor',
        subject: 'Resource Allocation Issue',
        preview: 'Need approval for overtime assignments due to unexpected demand spike in Product Line C...',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        isRead: true,
        participants: ['Shift Supervisor', 'Production Manager', 'HR Representative']
      }
    ];
    
    res.json(messages);
  } catch (error: any) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ error: 'Failed to fetch inbox messages' });
  }
});

// Dashboard Configurations endpoint
router.get("/dashboard-configs", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get user's assigned roles using proper Drizzle syntax
    const userRolesResult = await db.execute(sql`
      SELECT r.id, r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${userId} AND r.is_active = true
    `);
    const userRoles = userRolesResult.rows;

    // Get sample dashboard configs with comprehensive widgets for manufacturing roles
    // In production, this would query actual database dashboards filtered by user roles
    const allDashboards = [
      {
        id: 1,
        name: 'Executive Dashboard',
        description: 'High-level overview of operations and KPIs for executive team',
        isDefault: true,
        roleTargets: ['Plant Manager', 'Executive', 'General Manager'],
        requiredRoleNames: ['Plant Manager', 'Executive', 'General Manager'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        configuration: {
          standardWidgets: [
            {
              id: 'exec-kpi-overview',
              type: 'kpi-grid',
              title: 'Key Performance Indicators',
              position: { x: 0, y: 0, w: 8, h: 4 },
              config: {
                metrics: [
                  { name: 'Overall Equipment Effectiveness', value: 87.5, unit: '%', trend: 'up', target: 90 },
                  { name: 'Production Volume', value: 1247, unit: 'units', trend: 'up', target: 1200 },
                  { name: 'Quality Rate', value: 99.2, unit: '%', trend: 'stable', target: 99.5 },
                  { name: 'On-Time Delivery', value: 94.8, unit: '%', trend: 'down', target: 95 }
                ]
              }
            },
            {
              id: 'exec-production-chart',
              type: 'production-trend-chart',
              title: 'Production Trends (30 Days)',
              position: { x: 8, y: 0, w: 6, h: 4 },
              config: {
                chartType: 'line',
                timeRange: '30d',
                metrics: ['production_volume', 'quality_rate']
              }
            },
            {
              id: 'exec-alerts-summary',
              type: 'alert-summary',
              title: 'Critical Alerts',
              position: { x: 0, y: 4, w: 6, h: 3 },
              config: {
                alertTypes: ['critical', 'high'],
                showTrends: true
              }
            },
            {
              id: 'exec-financial-summary',
              type: 'financial-overview',
              title: 'Financial Impact',
              position: { x: 6, y: 4, w: 8, h: 3 },
              config: {
                currency: 'USD',
                showComparisons: true,
                metrics: ['cost_savings', 'revenue_impact', 'efficiency_gains']
              }
            }
          ],
          customWidgets: []
        }
      },
      {
        id: 2,
        name: 'Production Control Dashboard',
        description: 'Real-time production monitoring and control dashboard',
        isDefault: false,
        roleTargets: ['Production Manager', 'Operations Manager', 'Shift Supervisor'],
        requiredRoleNames: ['Production Manager', 'Operations Manager', 'Shift Supervisor'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        configuration: {
          standardWidgets: [
            {
              id: 'prod-live-status',
              type: 'live-production-status',
              title: 'Live Production Status',
              position: { x: 0, y: 0, w: 10, h: 3 },
              config: {
                refreshInterval: 30,
                showResourceUtilization: true,
                displayMode: 'cards'
              }
            },
            {
              id: 'prod-job-queue',
              type: 'job-queue-monitor',
              title: 'Job Queue & Schedule',
              position: { x: 10, y: 0, w: 6, h: 6 },
              config: {
                showNext: 10,
                enableDragDrop: true,
                showPriorities: true
              }
            },
            {
              id: 'prod-resource-utilization',
              type: 'resource-utilization',
              title: 'Resource Utilization',
              position: { x: 0, y: 3, w: 5, h: 4 },
              config: {
                viewMode: 'gauge',
                showTargets: true,
                alertThresholds: { low: 60, high: 95 }
              }
            },
            {
              id: 'prod-throughput',
              type: 'throughput-monitor',
              title: 'Hourly Throughput',
              position: { x: 5, y: 3, w: 5, h: 4 },
              config: {
                timeWindow: '24h',
                showTargets: true,
                chartType: 'bar'
              }
            },
            {
              id: 'prod-bottlenecks',
              type: 'bottleneck-analysis',
              title: 'Current Bottlenecks',
              position: { x: 0, y: 7, w: 8, h: 3 },
              config: {
                autoDetect: true,
                showRecommendations: true
              }
            },
            {
              id: 'prod-downtime',
              type: 'downtime-tracker',
              title: 'Downtime Analysis',
              position: { x: 8, y: 7, w: 8, h: 3 },
              config: {
                timeRange: '7d',
                categorizeReasons: true,
                showCosts: true
              }
            }
          ],
          customWidgets: [
            {
              id: 'custom-efficiency-heatmap',
              type: 'custom-chart',
              title: 'Production Efficiency Heatmap',
              position: { x: 10, y: 6, w: 6, h: 4 },
              config: {
                chartLibrary: 'recharts',
                dataSource: '/api/production-efficiency-heatmap',
                refreshInterval: 300
              }
            }
          ]
        }
      },
      {
        id: 3,
        name: 'Quality Control Dashboard',
        description: 'Quality control and compliance tracking dashboard',
        isDefault: false,
        roleTargets: ['Quality Manager', 'QC Inspector', 'Compliance Officer'],
        requiredRoleNames: ['Quality Manager', 'QC Inspector', 'Compliance Officer'],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        configuration: {
          standardWidgets: [
            {
              id: 'quality-overview',
              type: 'quality-metrics-overview',
              title: 'Quality Metrics Overview',
              position: { x: 0, y: 0, w: 8, h: 3 },
              config: {
                metrics: [
                  { name: 'Defect Rate', value: 0.8, unit: '%', target: 0.5 },
                  { name: 'First Pass Yield', value: 98.2, unit: '%', target: 98.5 },
                  { name: 'Customer Complaints', value: 3, unit: 'count', target: 2 },
                  { name: 'Inspection Coverage', value: 94.5, unit: '%', target: 95 }
                ]
              }
            },
            {
              id: 'spc-charts',
              type: 'spc-control-charts',
              title: 'Statistical Process Control',
              position: { x: 8, y: 0, w: 8, h: 6 },
              config: {
                parameters: ['temperature', 'pressure', 'pH', 'viscosity'],
                controlLimits: true,
                showTrends: true
              }
            },
            {
              id: 'batch-quality',
              type: 'batch-quality-tracker',
              title: 'Batch Quality Status',
              position: { x: 0, y: 3, w: 8, h: 4 },
              config: {
                showRecent: 20,
                highlightIssues: true,
                enableDrillDown: true
              }
            },
            {
              id: 'compliance-status',
              type: 'compliance-dashboard',
              title: 'Compliance Status',
              position: { x: 0, y: 7, w: 6, h: 3 },
              config: {
                standards: ['ISO9001', 'FDA', 'GMP'],
                showExpirations: true,
                alertOnNonCompliance: true
              }
            },
            {
              id: 'quality-costs',
              type: 'cost-of-quality',
              title: 'Cost of Quality Analysis',
              position: { x: 6, y: 7, w: 6, h: 3 },
              config: {
                categories: ['prevention', 'appraisal', 'internal_failure', 'external_failure'],
                showTrends: true,
                timeRange: '3m'
              }
            },
            {
              id: 'corrective-actions',
              type: 'corrective-actions-tracker',
              title: 'Corrective Actions',
              position: { x: 12, y: 7, w: 4, h: 3 },
              config: {
                showOverdue: true,
                priorityLevels: true
              }
            }
          ],
          customWidgets: []
        }
      },
      {
        id: 4,
        name: 'Maintenance Dashboard',
        description: 'Predictive and preventive maintenance management',
        isDefault: false,
        roleTargets: ['Maintenance Manager', 'Maintenance Technician', 'Reliability Engineer'],
        requiredRoleNames: ['Maintenance Manager', 'Maintenance Technician', 'Reliability Engineer'],
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
        configuration: {
          standardWidgets: [
            {
              id: 'maint-equipment-health',
              type: 'equipment-health-overview',
              title: 'Equipment Health Status',
              position: { x: 0, y: 0, w: 10, h: 4 },
              config: {
                showCritical: true,
                healthScoring: true,
                predictiveAlerts: true
              }
            },
            {
              id: 'maint-schedule',
              type: 'maintenance-schedule',
              title: 'Maintenance Schedule',
              position: { x: 10, y: 0, w: 6, h: 4 },
              config: {
                viewMode: 'calendar',
                showOverdue: true,
                timeHorizon: '30d'
              }
            },
            {
              id: 'maint-work-orders',
              type: 'work-order-manager',
              title: 'Active Work Orders',
              position: { x: 0, y: 4, w: 8, h: 4 },
              config: {
                statusFilters: ['open', 'in_progress'],
                prioritySort: true,
                showAssignments: true
              }
            },
            {
              id: 'maint-kpis',
              type: 'maintenance-kpis',
              title: 'Maintenance KPIs',
              position: { x: 8, y: 4, w: 8, h: 4 },
              config: {
                metrics: [
                  { name: 'MTBF', value: 168, unit: 'hours', target: 180 },
                  { name: 'MTTR', value: 2.4, unit: 'hours', target: 2.0 },
                  { name: 'Planned Maintenance %', value: 78, unit: '%', target: 80 },
                  { name: 'Maintenance Cost/Unit', value: 12.5, unit: '$', target: 12.0 }
                ]
              }
            },
            {
              id: 'maint-parts-inventory',
              type: 'spare-parts-inventory',
              title: 'Spare Parts Status',
              position: { x: 0, y: 8, w: 6, h: 3 },
              config: {
                showLowStock: true,
                criticalParts: true,
                reorderAlerts: true
              }
            },
            {
              id: 'maint-costs',
              type: 'maintenance-costs',
              title: 'Maintenance Costs',
              position: { x: 6, y: 8, w: 5, h: 3 },
              config: {
                breakdown: ['labor', 'parts', 'contractors'],
                budgetComparison: true,
                timeRange: '6m'
              }
            },
            {
              id: 'maint-reliability',
              type: 'reliability-analysis',
              title: 'Reliability Trends',
              position: { x: 11, y: 8, w: 5, h: 3 },
              config: {
                trendAnalysis: true,
                failureModes: true,
                predictiveModel: 'enabled'
              }
            }
          ],
          customWidgets: []
        }
      },
      {
        id: 5,
        name: 'Shift Operations Dashboard',
        description: 'Real-time operations dashboard for shift supervisors',
        isDefault: false,
        roleTargets: ['Shift Supervisor', 'Operations Coordinator', 'Floor Manager'],
        requiredRoleNames: ['Shift Supervisor', 'Operations Coordinator', 'Floor Manager'],
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        updatedAt: new Date(Date.now() - 345600000).toISOString(),
        configuration: {
          standardWidgets: [
            {
              id: 'shift-handover',
              type: 'shift-handover-summary',
              title: 'Shift Handover',
              position: { x: 0, y: 0, w: 8, h: 3 },
              config: {
                showPreviousShift: true,
                keyMetrics: true,
                openIssues: true
              }
            },
            {
              id: 'shift-performance',
              type: 'shift-performance-tracker',
              title: 'Current Shift Performance',
              position: { x: 8, y: 0, w: 8, h: 3 },
              config: {
                realTimeUpdate: true,
                targetComparison: true,
                progressIndicators: true
              }
            },
            {
              id: 'operator-assignments',
              type: 'operator-assignment-board',
              title: 'Operator Assignments',
              position: { x: 0, y: 3, w: 6, h: 4 },
              config: {
                skillMatching: true,
                availabilityStatus: true,
                rotationSchedule: true
              }
            },
            {
              id: 'production-alerts',
              type: 'production-alert-monitor',
              title: 'Production Alerts',
              position: { x: 6, y: 3, w: 5, h: 4 },
              config: {
                severityLevels: true,
                autoRefresh: 15,
                alertHistory: true
              }
            },
            {
              id: 'safety-incidents',
              type: 'safety-incident-tracker',
              title: 'Safety Incidents',
              position: { x: 11, y: 3, w: 5, h: 4 },
              config: {
                showNearMisses: true,
                incidentTypes: true,
                reportingStatus: true
              }
            }
          ],
          customWidgets: []
        }
      }
    ];

    // Filter dashboards based on user roles
    // In development mode or if user has admin role, return all dashboards
    const isAdmin = userRoles.some((role: any) => role.name === 'admin' || role.name === 'Admin');
    let filteredDashboards = allDashboards;

    if (!isAdmin && process.env.NODE_ENV !== 'development') {
      const userRoleNames = userRoles.map((role: any) => role.name);
      filteredDashboards = allDashboards.filter(dashboard => 
        dashboard.requiredRoleNames.some(roleName => userRoleNames.includes(roleName))
      );
    }

    // If no dashboards match user roles, provide a default one
    if (filteredDashboards.length === 0) {
      filteredDashboards = [allDashboards[0]]; // Default to Executive Dashboard
    }
    
    res.json(filteredDashboards);
  } catch (error: any) {
    console.error('Error fetching dashboard configs:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard configurations' });
  }
});

// Canvas Widgets API endpoints
router.get("/api/canvas/widgets", async (req, res) => {
  try {
    // Development bypass - skip authentication in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 [Canvas Widgets] Development mode: Skipping authentication");
    } else {
      // In production, require authentication
      await new Promise((resolve, reject) => {
        requireAuth(req, res, (error: any) => {
          if (error) reject(error);
          else resolve(undefined);
        });
      });
    }
    
    // Get saved widgets from database - only visible ones
    const savedWidgets = await db.execute(sql.raw(`SELECT * FROM widgets WHERE is_active = true`));
    console.log("🔧 [Canvas Widgets] Retrieved visible widgets:", savedWidgets.rows.length);
    
    // Generate actual chart data for widgets
    async function generateChartData(dataSource: string) {
      switch (dataSource) {
        case 'jobs':
        case 'resources':
          // Get actual production data
          const jobsQuery = `
            SELECT 
              priority,
              COUNT(*) as count
            FROM ptjobs 
            GROUP BY priority 
            ORDER BY COUNT(*) DESC
          `;
          const jobsResult = await db.execute(sql.raw(jobsQuery));
          return jobsResult.rows.map((row: any) => ({
            name: `Priority ${row.priority}`,
            value: parseInt(row.count),
            priority: row.priority
          }));
        default:
          // Default sample data
          return [
            { name: 'Active', value: 65 },
            { name: 'Pending', value: 28 },
            { name: 'Completed', value: 45 },
            { name: 'Failed', value: 12 }
          ];
      }
    }
    
    // Transform database widgets to canvas format with actual data
    const canvasWidgets = await Promise.all(savedWidgets.rows.map(async (widget) => {
      const config = typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config;
      const position = typeof widget.position === 'string' ? JSON.parse(widget.position) : widget.position;
      const chartData = await generateChartData(config.dataSource || 'jobs');
      
      return {
        id: widget.id,
        widgetType: widget.type,
        widgetSubtype: widget.type,
        title: widget.title,
        name: widget.title,
        data: chartData, // Actual chart data arrays
        configuration: {
          ...config,
          chartType: config.chartType || widget.type
        },
        position: position ? { x: position.x || 0, y: position.y || 0 } : null,
        isVisible: widget.is_active, // ✅ FIXED: Map is_active to isVisible
        createdByMax: config.createdByMaxAI || false, // ✅ FIXED: Add createdByMax field
        createdAt: widget.created_at
      };
    }));
    
    res.json(canvasWidgets);
  } catch (error: any) {
    console.error('Error fetching canvas widgets:', error);
    res.status(500).json({ error: 'Failed to fetch canvas widgets' });
  }
});

// Canvas Widget Library API (for available widget types)
router.get("/api/canvas/widget-library", async (req, res) => {
  try {
    // Get sample widget library with comprehensive manufacturing widgets
    const widgetLibrary = [
      {
        id: 'kpi-grid',
        name: 'KPI Grid',
        category: 'Performance',
        description: 'Display multiple key performance indicators in a grid layout',
        icon: 'gauge',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 8, h: 4 },
        supportedSizes: [
          { w: 4, h: 2 }, { w: 6, h: 3 }, { w: 8, h: 4 }, { w: 12, h: 6 }
        ],
        configSchema: {
          metrics: { type: 'array', required: true },
          displayMode: { type: 'select', options: ['grid', 'list', 'cards'] },
          showTrends: { type: 'boolean', default: true },
          refreshInterval: { type: 'number', default: 30 }
        }
      },
      {
        id: 'production-trend-chart',
        name: 'Production Trends',
        category: 'Production',
        description: 'Line or bar chart showing production trends over time',
        icon: 'trending-up',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 8, h: 4 },
        configSchema: {
          chartType: { type: 'select', options: ['line', 'bar', 'area'] },
          timeRange: { type: 'select', options: ['1d', '7d', '30d', '90d'] },
          metrics: { type: 'multiselect', required: true },
          showTargets: { type: 'boolean', default: false }
        }
      },
      {
        id: 'live-production-status',
        name: 'Live Production Status',
        category: 'Production',
        description: 'Real-time status of production lines and resources',
        icon: 'activity',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 10, h: 3 },
        configSchema: {
          refreshInterval: { type: 'number', default: 30, min: 5, max: 300 },
          displayMode: { type: 'select', options: ['cards', 'list', 'table'] },
          showResourceUtilization: { type: 'boolean', default: true },
          alertsEnabled: { type: 'boolean', default: true }
        }
      },
      {
        id: 'resource-utilization',
        name: 'Resource Utilization',
        category: 'Resources',
        description: 'Monitor equipment and resource utilization rates',
        icon: 'cpu',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 6, h: 4 },
        configSchema: {
          viewMode: { type: 'select', options: ['gauge', 'bar', 'donut'] },
          alertThresholds: { 
            type: 'object', 
            properties: {
              low: { type: 'number', default: 60 },
              high: { type: 'number', default: 95 }
            }
          },
          showTargets: { type: 'boolean', default: true }
        }
      },
      {
        id: 'quality-metrics-overview',
        name: 'Quality Metrics',
        category: 'Quality',
        description: 'Overview of quality control metrics and performance',
        icon: 'check-circle',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 8, h: 3 },
        configSchema: {
          displayMetrics: { type: 'multiselect', required: true },
          showTrends: { type: 'boolean', default: true },
          alertOnTarget: { type: 'boolean', default: true }
        }
      },
      {
        id: 'equipment-health-overview',
        name: 'Equipment Health',
        category: 'Maintenance',
        description: 'Monitor equipment health and predictive maintenance alerts',
        icon: 'wrench',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 10, h: 4 },
        configSchema: {
          healthScoring: { type: 'boolean', default: true },
          predictiveAlerts: { type: 'boolean', default: true },
          showCritical: { type: 'boolean', default: true },
          maintenanceTypes: { type: 'multiselect', options: ['preventive', 'predictive', 'corrective'] }
        }
      },
      {
        id: 'job-queue-monitor',
        name: 'Job Queue Monitor',
        category: 'Production',
        description: 'Monitor and manage production job queues and scheduling',
        icon: 'list',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 6, h: 6 },
        configSchema: {
          showNext: { type: 'number', default: 10, min: 5, max: 50 },
          enableDragDrop: { type: 'boolean', default: false },
          showPriorities: { type: 'boolean', default: true },
          statusFilters: { type: 'multiselect', options: ['queued', 'active', 'paused', 'completed'] }
        }
      },
      {
        id: 'alert-summary',
        name: 'Alert Summary',
        category: 'Monitoring',
        description: 'Summary of system alerts and notifications',
        icon: 'bell',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 6, h: 3 },
        configSchema: {
          alertTypes: { type: 'multiselect', options: ['critical', 'high', 'medium', 'low'] },
          showTrends: { type: 'boolean', default: false },
          groupByType: { type: 'boolean', default: true },
          maxAlerts: { type: 'number', default: 10 }
        }
      },
      {
        id: 'throughput-monitor',
        name: 'Throughput Monitor',
        category: 'Production',
        description: 'Monitor production throughput and capacity metrics',
        icon: 'bar-chart-3',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 6, h: 4 },
        configSchema: {
          timeWindow: { type: 'select', options: ['1h', '8h', '24h', '7d'] },
          chartType: { type: 'select', options: ['bar', 'line', 'area'] },
          showTargets: { type: 'boolean', default: true },
          capacityOverlay: { type: 'boolean', default: false }
        }
      },
      {
        id: 'bottleneck-analysis',
        name: 'Bottleneck Analysis',
        category: 'Analytics',
        description: 'Identify and analyze production bottlenecks',
        icon: 'zap-off',
        configurable: true,
        dataSourceRequired: true,
        defaultSize: { w: 8, h: 3 },
        configSchema: {
          autoDetect: { type: 'boolean', default: true },
          showRecommendations: { type: 'boolean', default: true },
          analysisDepth: { type: 'select', options: ['basic', 'detailed', 'comprehensive'] },
          timeHorizon: { type: 'select', options: ['current', '24h', '7d'] }
        }
      }
    ];
    
    res.json(widgets);
  } catch (error: any) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ error: 'Failed to fetch widget library' });
  }
});

router.post("/api/canvas/widgets", async (req, res) => {
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets POST] Development mode: Skipping authentication");
  } else {
    // In production, require authentication
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (error: any) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  }
  try {
    // Validate request body using widget schema
    const validationResult = insertWidgetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid widget data', 
        details: validationResult.error.errors 
      });
    }

    const { type, title, position, config, dashboardId } = validationResult.data;
    
    // Ensure user has access to the dashboard
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Verify dashboard access - in production would query database
    if (dashboardId && !Number.isInteger(Number(dashboardId))) {
      return res.status(400).json({ error: "Invalid dashboard ID" });
    }
    
    // Save widget to database using storage
    const newWidget = await storage.createCanvasWidget({
      type,
      title,
      position,
      config,
      dashboardId: dashboardId || 1
    });
    
    console.log(`[Canvas Widgets POST] Widget created with ID: ${newWidget.id}`);
    res.status(201).json(newWidget);
  } catch (error: any) {
    console.error('Error creating widget:', error);
    res.status(500).json({ error: 'Failed to create widget' });
  }
});

router.put("/api/canvas/widgets/:widgetId", async (req, res) => {
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets PUT] Development mode: Skipping authentication");
  } else {
    // In production, require authentication
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (error: any) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  }
  try {
    const { widgetId } = req.params;
    
    // Validate request body - allow partial updates
    const updateSchema = insertWidgetSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid widget update data', 
        details: validationResult.error.errors 
      });
    }

    const updateData = validationResult.data;
    
    // Ensure user has permission to update this widget
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Verify widget access - in production would query database to check widget ownership
    if (!widgetId || widgetId.trim().length === 0) {
      return res.status(400).json({ error: "Invalid widget ID" });
    }
    
    // For now, return the updated widget data
    // In production, this would update in database using storage.updateWidget()
    const updatedWidget = {
      id: widgetId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedWidget);
  } catch (error: any) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

router.delete("/api/canvas/widgets/:widgetId", async (req, res) => {
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets DELETE] Development mode: Skipping authentication");
  } else {
    // In production, require authentication
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (error: any) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  }
  try {
    const { widgetId } = req.params;
    
    // Ensure user has permission to delete this widget
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Verify widget access - in production would query database to check widget ownership
    if (!widgetId || widgetId.trim().length === 0) {
      return res.status(400).json({ error: "Invalid widget ID" });
    }
    
    // For now, just return success
    // In production, this would delete from database using storage.deleteWidget()
    res.json({ success: true, message: 'Widget deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Widget data endpoints for specific widget types
router.get("/api/widget-data/production-efficiency-heatmap", requireAuth, async (req, res) => {
  try {
    // Sample heatmap data for production efficiency
    const heatmapData = {
      timeRange: '7d',
      data: [
        { resource: 'Line 1', hour: 0, efficiency: 85, day: 'Monday' },
        { resource: 'Line 1', hour: 1, efficiency: 92, day: 'Monday' },
        { resource: 'Line 1', hour: 2, efficiency: 88, day: 'Monday' },
        { resource: 'Line 2', hour: 0, efficiency: 78, day: 'Monday' },
        { resource: 'Line 2', hour: 1, efficiency: 95, day: 'Monday' },
        { resource: 'Line 2', hour: 2, efficiency: 91, day: 'Monday' },
        // Add more sample data...
      ],
      metadata: {
        minEfficiency: 65,
        maxEfficiency: 98,
        avgEfficiency: 87.3,
        targetEfficiency: 90
      }
    };
    
    res.json(heatmapData);
  } catch (error: any) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

router.get("/api/widget-data/live-production-status", requireAuth, async (req, res) => {
  try {
    // Sample live production status data
    const productionStatus = {
      timestamp: new Date().toISOString(),
      resources: [
        {
          id: 'line-1',
          name: 'Production Line 1',
          status: 'running',
          utilization: 92.5,
          currentJob: 'Job-447',
          targetRate: 150,
          actualRate: 142,
          efficiency: 94.7,
          nextMaintenance: '2024-09-30T10:00:00Z'
        },
        {
          id: 'line-2', 
          name: 'Production Line 2',
          status: 'running',
          utilization: 87.3,
          currentJob: 'Job-448',
          targetRate: 120,
          actualRate: 118,
          efficiency: 98.3,
          nextMaintenance: '2024-10-02T14:00:00Z'
        },
        {
          id: 'line-3',
          name: 'Production Line 3', 
          status: 'maintenance',
          utilization: 0,
          currentJob: null,
          targetRate: 100,
          actualRate: 0,
          efficiency: 0,
          nextMaintenance: '2024-09-28T16:00:00Z'
        }
      ],
      summary: {
        totalLines: 3,
        activeLines: 2,
        avgUtilization: 59.9,
        totalProduction: 260,
        productionTarget: 370
      }
    };
    
    res.json(productionStatus);
  } catch (error: any) {
    console.error('Error fetching production status:', error);
    res.status(500).json({ error: 'Failed to fetch production status' });
  }
});

// Dashboard metrics endpoint - returns real metrics from PT database
router.get("/dashboard-metrics", requireAuth, async (req, res) => {
  try {
    // 1. Get active jobs count from ptjobs
    const activeJobsQuery = `
      SELECT COUNT(*) as count 
      FROM ptjobs 
      WHERE scheduled_status IN ('In Progress', 'Ready', 'Scheduled', 'Started')
        AND (scheduled_end_date IS NULL OR scheduled_end_date > NOW())
    `;
    const activeJobsResult = await db.execute(sql.raw(activeJobsQuery));
    const activeJobs = parseInt(activeJobsResult.rows[0]?.count || '0');

    // 2. Calculate resource utilization (operations scheduled hours vs available hours)
    const utilizationQuery = `
      WITH resource_stats AS (
        SELECT 
          r.id,
          r.name,
          COUNT(DISTINCT jo.id) as operation_count,
          SUM(
            CASE 
              WHEN jo.scheduled_start IS NOT NULL AND jo.scheduled_end IS NOT NULL
              THEN EXTRACT(EPOCH FROM (jo.scheduled_end - jo.scheduled_start)) / 3600
              ELSE 0
            END
          ) as scheduled_hours
        FROM ptresources r
        LEFT JOIN ptjobresources jr ON r.resource_id = jr.default_resource_id
        LEFT JOIN ptjoboperations jo ON jr.operation_id = jo.id
        WHERE r.active = true
          AND jo.scheduled_start >= NOW() - INTERVAL '7 days'
          AND jo.scheduled_start <= NOW() + INTERVAL '7 days'
        GROUP BY r.id, r.name
      )
      SELECT 
        CASE 
          WHEN SUM(168) > 0 -- 168 hours in a week (7 * 24)
          THEN ROUND((SUM(scheduled_hours) / SUM(168)) * 100, 1)
          ELSE 0
        END as utilization
      FROM resource_stats
    `;
    const utilizationResult = await db.execute(sql.raw(utilizationQuery));
    const utilization = parseFloat(utilizationResult.rows[0]?.utilization || '0');

    // 3. Get alerts count from alerts table
    const alertsQuery = `
      SELECT COUNT(*) as count 
      FROM alerts 
      WHERE status = 'active' 
        AND (dismissed_at IS NULL OR dismissed_at > NOW())
    `;
    const alertsResult = await db.execute(sql.raw(alertsQuery));
    const alertsCount = parseInt(alertsResult.rows[0]?.count || '0');

    // 4. Calculate on-time percentage (jobs completed on time vs total completed)
    const onTimeQuery = `
      WITH completed_jobs AS (
        SELECT 
          COUNT(*) as total,
          COUNT(
            CASE 
              WHEN scheduled_end_date <= need_date_time 
              THEN 1 
              ELSE NULL 
            END
          ) as on_time
        FROM ptjobs
        WHERE scheduled_status IN ('Completed', 'Shipped', 'Delivered')
          AND scheduled_end_date IS NOT NULL
          AND need_date_time IS NOT NULL
          AND scheduled_end_date >= NOW() - INTERVAL '30 days'
      )
      SELECT 
        CASE 
          WHEN total > 0 
          THEN ROUND((on_time::numeric / total) * 100, 1)
          ELSE 100
        END as on_time_percentage
      FROM completed_jobs
    `;
    const onTimeResult = await db.execute(sql.raw(onTimeQuery));
    const onTimePercentage = parseFloat(onTimeResult.rows[0]?.on_time_percentage || '100');

    // Return the metrics
    res.json({
      activeJobs,
      utilization,
      alertsCount,
      onTimePercentage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics',
      // Return default values on error so UI doesn't break
      activeJobs: 0,
      utilization: 0,
      alertsCount: 0,
      onTimePercentage: 100
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// API endpoints for the Bryntum scheduler
router.get("/api/resources", async (req, res) => {
  try {
    const resources = await storage.getResources();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

// Serve resource capabilities (what operations each resource can perform)
router.get("/resource-capabilities", async (req, res) => {
  try {
    const result = await directSql(`
      SELECT resource_id, capability_id, throughput_modifier 
      FROM ptresourcecapabilities 
      WHERE use_throughput_modifier = true
      ORDER BY resource_id, capability_id
    `);
    
    // Group by resource for easier lookup
    const capabilities: Record<string, string[]> = {};
    if (result && Array.isArray(result)) {
      for (const row of result) {
        if (!capabilities[row.resource_id]) {
          capabilities[row.resource_id] = [];
        }
        capabilities[row.resource_id].push(row.operation_type);
      }
    }
    
    // Explicitly set JSON content type and send response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(capabilities));
  } catch (error) {
    console.error('Error fetching resource capabilities:', error);
    // Also set JSON header for error response
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ error: 'Failed to fetch resource capabilities' }));
  }
});

router.get("/api/pt-operations", async (req, res) => {
  try {
    // Check if demo mode is requested (limit operations for demo)
    const isDemoMode = req.query.demo !== 'false';
    const limit = isDemoMode ? 50 : null; // Show only 50 operations for demo
    
    const operations = await storage.getDiscreteOperations(limit);
    res.json(operations);
  } catch (error) {
    console.error("Error fetching PT operations:", error);
    res.status(500).json({ message: "Failed to fetch PT operations" });
  }
});

// Step 3: Save scheduler changes endpoint
router.post("/scheduler/sync", async (req, res) => {
  try {
    const { resources, events, assignments, dependencies } = req.body;
    
    // Log the changes for debugging
    console.log('Scheduler sync request received:', {
      resources: resources?.updated?.length || 0,
      events: events?.updated?.length || 0,
      assignments: {
        added: assignments?.added?.length || 0,
        removed: assignments?.removed?.length || 0,
        updated: assignments?.updated?.length || 0
      },
      dependencies: dependencies?.updated?.length || 0
    });

    // For now, just acknowledge receipt - actual persistence would go here
    // In a real implementation, you would:
    // 1. Update ptjoboperations with new start/end dates from events.updated
    // 2. Update ptjobresources with new assignments from assignments.added/removed
    // 3. Handle any dependencies changes
    
    res.json({ 
      success: true,
      message: 'Changes received successfully',
      processed: {
        resources: resources?.updated?.length || 0,
        events: events?.updated?.length || 0,
        assignments: (assignments?.added?.length || 0) + (assignments?.updated?.length || 0),
        dependencies: dependencies?.updated?.length || 0
      }
    });
  } catch (error) {
    console.error("Error in scheduler sync:", error);
    res.status(500).json({ success: false, message: "Failed to save scheduler changes" });
  }
});

// AI Agent command endpoint - handles text commands with file attachments
router.post("/api/ai-agent/command", uploadFiles.array('attachments', 10), async (req, res) => {
  try {
    const command = req.body.command || '';
    const files = req.files as Express.Multer.File[] || [];
    
    console.log("AI Agent command received:", { 
      command: command || "No command provided",
      filesCount: files.length,
      fileNames: files.map(f => f.originalname),
      hasJSONAttachments: !!req.body.attachments
    });

    // Handle both FormData files and JSON attachments
    let attachments: Array<{ name: string; type: string; size: number; content: Buffer | null }> = [];
    
    // FormData files (from ai-left-panel)
    if (files.length > 0) {
      attachments = files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        content: file.buffer
      }));
    }
    
    // JSON attachments (from integrated-ai-assistant)
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      const jsonAttachments = req.body.attachments.map((att: any) => ({
        name: att.name || 'unknown',
        type: att.type || 'application/octet-stream',
        size: att.size || 0,
        content: att.content ? Buffer.from(att.content, 'base64') : null
      }));
      attachments = [...attachments, ...jsonAttachments];
    }

    console.log("Total attachments:", attachments.length);

    // Import the AI agent processing function
    const { processCommand } = await import("./ai-agent");

    // Process the command with attachments
    const result = await processCommand(command, attachments);

    console.log("AI Agent command result:", JSON.stringify(result));

    const response = {
      success: result.success,
      message: result.message,
      response: result.message,  // Add 'response' field for compatibility
      reply: result.message,      // Add 'reply' field for compatibility
      data: result.data,
      actions: result.actions || [],
      canvasAction: result.canvasAction
    };

    console.log("Sending response:", JSON.stringify(response));
    res.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("AI Agent command error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to process AI command",
      response: "Failed to process AI command",
      reply: "Failed to process AI command",
      error: errorMessage
    });
  }
});

// AI Agent voice transcription endpoint - handles audio file uploads
router.post("/api/ai-agent/voice", upload.single('audio'), async (req, res) => {
  try {
    console.log("Voice transcription request received");

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided"
      });
    }

    console.log("Processing audio file:", req.file.originalname, "Size:", req.file.buffer.length, "bytes");

    // Import OpenAI for voice transcription
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Create a file-like object for OpenAI from the buffer
    const audioFile = new File([req.file.buffer], req.file.originalname || "audio.wav", { 
      type: req.file.mimetype || "audio/wav" 
    });

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    console.log("Voice transcription result:", transcription.text);

    res.json({
      success: true,
      text: transcription.text,
      message: "Voice transcribed successfully"
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Voice transcription error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to transcribe voice recording",
      error: errorMessage
    });
  }
});

// AI Text-to-Speech endpoint
router.post("/api/ai/text-to-speech", async (req, res) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "No text provided for speech synthesis"
      });
    }

    console.log("Text-to-speech request:", { textLength: text.length, voice, speed });

    // Import OpenAI for text-to-speech
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      speed: speed
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache'
    });
    
    res.send(buffer);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Text-to-speech error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to generate speech",
      error: errorMessage
    });
  }
});

// ============================================
// Saved Schedules endpoints
// ============================================

// Get all saved schedules for a user
router.get("/api/saved-schedules", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const schedules = await storage.getSavedSchedules(userId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching saved schedules:", error);
    res.status(500).json({ message: "Failed to fetch saved schedules" });
  }
});

// Get a specific saved schedule
router.get("/api/saved-schedules/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const scheduleId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const schedule = await storage.getSavedSchedule(scheduleId, userId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching saved schedule:", error);
    res.status(500).json({ message: "Failed to fetch saved schedule" });
  }
});

// Create a new saved schedule
router.post("/api/saved-schedules", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const { name, description, scheduleData, metadata } = req.body;
    
    if (!name || !scheduleData) {
      return res.status(400).json({ message: "Name and schedule data are required" });
    }
    
    const newSchedule = await storage.createSavedSchedule({
      userId,
      name,
      description: description || null,
      scheduleData,
      metadata: metadata || {}
    });
    
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ message: "Failed to save schedule" });
  }
});

// Update a saved schedule
router.put("/api/saved-schedules/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const scheduleId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const { name, description, scheduleData, metadata } = req.body;
    
    const updatedSchedule = await storage.updateSavedSchedule(scheduleId, userId, {
      name,
      description,
      scheduleData,
      metadata
    });
    
    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found or unauthorized" });
    }
    
    res.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Failed to update schedule" });
  }
});

// Delete a saved schedule
router.delete("/api/saved-schedules/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const scheduleId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const success = await storage.deleteSavedSchedule(scheduleId, userId);
    
    if (!success) {
      return res.status(404).json({ message: "Schedule not found or unauthorized" });
    }
    
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Failed to delete schedule" });
  }
});

// Alerts endpoint
router.get("/api/alerts", requireAuth, async (req, res) => {
  try {
    // Get sample alerts for now - in production this would be from alerts service
    const alerts = [
      {
        id: 1,
        type: "critical",
        title: "Production Line 1 - Maintenance Required",
        message: "Scheduled maintenance overdue by 48 hours",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "unread",
        priority: "high"
      },
      {
        id: 2,
        type: "warning",
        title: "Inventory Level Low",
        message: "Raw material ABC below reorder point",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "read",
        priority: "medium"
      },
      {
        id: 3,
        type: "info",
        title: "Schedule Optimization Complete",
        message: "Production schedule optimized, 15% efficiency gain",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "read",
        priority: "low"
      }
    ];
    
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

// Dashboard Metrics endpoint
router.get("/api/dashboard-metrics", requireAuth, async (req, res) => {
  try {
    // Get sample dashboard metrics - in production this would be from analytics service
    const metrics = {
      productionEfficiency: {
        value: 87.5,
        change: 2.3,
        trend: "up"
      },
      onTimeDelivery: {
        value: 94.2,
        change: -1.1,
        trend: "down"
      },
      resourceUtilization: {
        value: 78.9,
        change: 5.2,
        trend: "up"
      },
      qualityRate: {
        value: 98.7,
        change: 0.4,
        trend: "up"
      },
      activeJobs: 42,
      pendingOrders: 18,
      completedToday: 24,
      upcomingMaintenance: 3
    };
    
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
});

// ============================================
// AI Agent Discovery & Integration API v1
// ============================================

// Agent Capabilities Discovery Endpoint
router.get("/api/v1/agent/capabilities", async (req, res) => {
  try {
    // Define manufacturing capabilities that other AI agents can discover and use
    const capabilities = {
      systemInfo: {
        name: "PlanetTogether Manufacturing SCM + APS",
        version: "1.0.0",
        description: "AI-first Factory Optimization Platform for production scheduling and supply chain management",
        lastUpdated: new Date().toISOString(),
        supportedProtocols: ["REST", "WebSocket", "OpenAPI"],
        authentication: ["JWT", "API-Key"]
      },
      
      // Production & Scheduling Capabilities  
      manufacturing: {
        productionScheduling: {
          endpoint: "/api/v1/commands/schedule-job",
          methods: ["POST"],
          description: "Schedule new production jobs with resource optimization",
          parameters: {
            jobId: { type: "string", required: true, description: "Unique job identifier" },
            productId: { type: "string", required: true, description: "Product to manufacture" },
            quantity: { type: "number", required: true, description: "Production quantity" },
            priority: { type: "string", enum: ["low", "normal", "high", "critical"], description: "Job priority level" },
            dueDate: { type: "string", format: "datetime", description: "Target completion date" },
            resourceRequirements: { type: "array", description: "Required manufacturing resources" }
          },
          response: {
            scheduleId: "string",
            estimatedStartTime: "datetime", 
            estimatedCompletionTime: "datetime",
            assignedResources: "array"
          }
        },
        
        resourceManagement: {
          endpoint: "/api/v1/commands/adjust-resource-allocation", 
          methods: ["POST"],
          description: "Dynamically adjust resource allocation for optimal production",
          parameters: {
            resourceId: { type: "string", required: true },
            newAllocation: { type: "number", min: 0, max: 100, description: "Percentage allocation" },
            effectiveTime: { type: "string", format: "datetime", description: "When to apply changes" }
          }
        },
        
        qualityControl: {
          endpoint: "/api/v1/commands/quality-hold",
          methods: ["POST"], 
          description: "Place quality holds on production batches",
          parameters: {
            batchId: { type: "string", required: true },
            holdType: { type: "string", enum: ["quarantine", "inspection", "rework"], required: true },
            reason: { type: "string", required: true },
            inspector: { type: "string", description: "Quality inspector ID" }
          }
        }
      },
      
      // Real-time Data Access Capabilities
      dataAccess: {
        liveProductionMetrics: {
          endpoint: "/api/v1/stream/production-events", 
          protocol: "WebSocket",
          description: "Real-time production metrics and KPI updates",
          events: ["job_started", "job_completed", "resource_status_changed", "quality_alert", "efficiency_update"],
          dataTypes: ["production_rate", "oee", "downtime", "quality_metrics", "resource_utilization"]
        },
        
        historicalData: {
          endpoint: "/api/v1/data/historical/{dataType}",
          methods: ["GET"],
          description: "Access historical manufacturing data for analysis", 
          parameters: {
            dataType: { type: "string", enum: ["production", "quality", "resources", "schedules"] },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            aggregation: { type: "string", enum: ["hourly", "daily", "weekly"], default: "daily" }
          }
        },
        
        semanticQuery: {
          endpoint: "/api/v1/query/semantic",
          methods: ["POST"],
          description: "Natural language queries about manufacturing operations",
          parameters: {
            query: { type: "string", required: true, description: "Natural language question" },
            context: { type: "string", enum: ["production", "quality", "resources", "scheduling"], description: "Query context for better results" },
            maxResults: { type: "number", default: 10, max: 100 }
          }
        }
      },
      
      // System Integration Capabilities
      integration: {
        healthCheck: {
          endpoint: "/api/v1/agent/status",
          methods: ["GET"],
          description: "System health and status information"
        },
        
        authenticationFlow: {
          endpoint: "/api/v1/auth/agent-token",
          methods: ["POST"],
          description: "Obtain authentication tokens for agent-to-agent communication",
          parameters: {
            agentId: { type: "string", required: true },
            agentSecret: { type: "string", required: true },
            permissions: { type: "array", description: "Requested permission scopes" }
          }
        }
      },
      
      // Available Manufacturing Resources
      availableResources: await getManufacturingResources(),
      
      // Supported Manufacturing Operations
      operations: {
        scheduling: ["ASAP", "ALAP", "Critical_Path", "Resource_Leveling", "TOC"],
        optimization: ["cost_minimization", "time_optimization", "resource_utilization", "quality_maximization"],
        reporting: ["real_time_dashboards", "custom_analytics", "compliance_reports", "performance_kpis"]
      },
      
      permissions: {
        required: ["manufacturing_read", "production_control"],
        optional: ["admin_access", "quality_control", "maintenance_manage"],
        description: "Role-based permissions system with 10 manufacturing roles"
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.json(capabilities);
  } catch (error) {
    console.error("Error fetching agent capabilities:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to retrieve system capabilities" 
    });
  }
});

// Agent Status & Health Check Endpoint
router.get("/api/v1/agent/status", async (req, res) => {
  try {
    const systemStatus = {
      status: "operational",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      
      // Core System Health
      system: {
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      
      // Manufacturing System Status
      manufacturing: {
        activeJobs: await getActiveJobsCount(),
        resourceUtilization: await getResourceUtilization(),
        systemAlerts: await getSystemAlertsCount(),
        lastScheduleUpdate: await getLastScheduleUpdate()
      },
      
      // API Health
      api: {
        authentication: "operational",
        rateLimit: "normal",
        averageResponseTime: "< 200ms",
        uptime: "99.9%"
      },
      
      // Database Connectivity
      database: {
        status: await checkDatabaseHealth(),
        connections: "healthy",
        lastBackup: "2024-01-15T10:30:00Z"
      },
      
      // AI Services Status
      aiServices: {
        schedulingAI: "operational",
        semanticQuery: "operational", 
        openAI: process.env.OPENAI_API_KEY ? "configured" : "not_configured"
      },
      
      // Agent Integration Stats
      agentStats: {
        connectedAgents: 0, // Will be populated as agents connect
        totalRequests: 0,   // Will track API usage
        lastAgentActivity: null
      },
      
      endpoints: {
        total: 45,
        public: 2,
        authenticated: 43,
        agent_specific: 8
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.json(systemStatus);
  } catch (error) {
    console.error("Error fetching agent status:", error);
    res.status(500).json({ 
      status: "error",
      error: "Internal server error",
      message: "Failed to retrieve system status",
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for agent discovery
async function getManufacturingResources() {
  try {
    const resources = await directSql(`
      SELECT 
        r.external_id as id,
        r.name,
        r.category,
        COALESCE(rc.capability_names, ARRAY[]::text[]) as capabilities,
        r.description
      FROM ptresources r
      LEFT JOIN (
        SELECT 
          rc.resource_id,
          array_agg(
            CASE rc.capability_id
              WHEN 1 THEN 'MILLING'
              WHEN 2 THEN 'MASHING' 
              WHEN 3 THEN 'LAUTERING'
              WHEN 4 THEN 'BOILING'
              WHEN 5 THEN 'FERMENTATION'
              WHEN 6 THEN 'CONDITIONING'
              WHEN 7 THEN 'DRY_HOPPING'
              WHEN 8 THEN 'PACKAGING'
              WHEN 9 THEN 'PASTEURIZATION'
              ELSE 'UNKNOWN'
            END
          ) as capability_names
        FROM ptresourcecapabilities rc
        GROUP BY rc.resource_id
      ) rc ON r.id = rc.resource_id
      ORDER BY r.name
    `);
    return resources || [];
  } catch (error) {
    console.error('Error fetching manufacturing resources:', error);
    return [];
  }
}

async function getActiveJobsCount() {
  try {
    const result = await directSql(`SELECT COUNT(*) as count FROM ptjobs WHERE status = 'active'`);
    return parseInt(result[0]?.count || '0');
  } catch (error) {
    console.error('Error getting active jobs count:', error);
    return 0;
  }
}

async function getResourceUtilization() {
  try {
    // Return average resource utilization as a percentage
    const result = await directSql(`
      SELECT AVG(utilization_percentage) as avg_utilization 
      FROM ptresources 
      WHERE utilization_percentage IS NOT NULL
    `);
    return Math.round(parseFloat(result[0]?.avg_utilization || '75.0'));
  } catch (error) {
    console.error('Error getting resource utilization:', error);
    return 75; // Default fallback
  }
}

async function getSystemAlertsCount() {
  try {
    // Count critical alerts - in production this would query actual alerts table
    return 3; // Sample data for now
  } catch (error) {
    console.error('Error getting system alerts count:', error);
    return 0;
  }
}

async function getLastScheduleUpdate() {
  try {
    const result = await directSql(`
      SELECT MAX(updated_at) as last_update 
      FROM ptjobs 
      WHERE updated_at IS NOT NULL
    `);
    return result[0]?.last_update || new Date().toISOString();
  } catch (error) {
    console.error('Error getting last schedule update:', error);
    return new Date().toISOString();
  }
}

async function checkDatabaseHealth() {
  try {
    await directSql(`SELECT 1`);
    return "healthy";
  } catch (error) {
    console.error('Database health check failed:', error);
    return "unhealthy";
  }
}

// ============================================
// Real-time Data Streaming REST API v1 
// ============================================

// Historical Data Access Endpoint
router.get("/api/v1/data/historical/:dataType", async (req, res) => {
  try {
    const { dataType } = req.params;
    const { startDate, endDate, aggregation = 'daily' } = req.query;
    
    // Validate data type
    const validTypes = ['production', 'quality', 'resources', 'schedules'];
    if (!validTypes.includes(dataType)) {
      return res.status(400).json({
        error: "Invalid data type",
        message: `Data type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Validate date range
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Dates must be in ISO format (YYYY-MM-DD)"
      });
    }
    
    // Generate historical data based on type
    const historicalData = await generateHistoricalData(dataType, start, end, aggregation as string);
    
    res.json({
      dataType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      aggregation,
      recordCount: historicalData.length,
      data: historicalData
    });
    
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve historical data"
    });
  }
});

// Real-time Production Metrics Snapshot
router.get("/api/v1/data/real-time/:dataType", async (req, res) => {
  try {
    const { dataType } = req.params;
    const validTypes = ['production_rate', 'oee', 'downtime', 'quality_metrics', 'resource_utilization'];
    
    if (!validTypes.includes(dataType)) {
      return res.status(400).json({
        error: "Invalid data type",
        message: `Data type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const realtimeData = await getCurrentRealtimeData(dataType);
    
    res.json({
      dataType,
      timestamp: new Date().toISOString(),
      data: realtimeData
    });
    
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    res.status(500).json({
      error: "Internal server error", 
      message: "Failed to retrieve real-time data"
    });
  }
});

// Schema validation for event triggers
const TriggerEventSchema = z.object({
  eventType: z.string().min(1, "eventType is required"),
  streamType: z.enum(['production_events', 'equipment_status', 'quality_metrics', 'resource_utilization', 'job_updates']).default('production_events'),
  data: z.record(z.any()).default({}),
  agentId: z.string().optional()
});

// Trigger Production Event (for testing and manual events)
router.post("/api/v1/events/trigger", async (req, res) => {
  try {
    const validation = TriggerEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid event data",
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    
    const { eventType, streamType, data, agentId } = validation.data;
    
    // Create production event with proper schema
    const productionEvent = {
      type: 'production_event',
      eventType,
      streamType,
      data,
      triggeredBy: agentId || 'manual',
      timestamp: new Date().toISOString(),
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Broadcast to all connected agents via WebSocket
    if (typeof (global as any).broadcastToAgents === 'function') {
      (global as any).broadcastToAgents(productionEvent);
      log(`📡 Broadcasting event: ${eventType} to connected agents`);
    }
    
    res.json({
      message: "Event triggered successfully",
      event: productionEvent,
      broadcastSent: true
    });
    
  } catch (error) {
    console.error("Error triggering event:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to trigger event"
    });
  }
});

// Agent Connection Status
router.get("/api/v1/stream/connections", async (req, res) => {
  try {
    // This would normally track actual connections, for now return sample data
    const connectionStats = {
      totalConnections: 0,
      activeAgents: [],
      connectionHistory: [],
      streamingStats: {
        eventsPerMinute: 0,
        bytesTransferred: 0,
        averageLatency: "0ms"
      }
    };
    
    res.json(connectionStats);
    
  } catch (error) {
    console.error("Error fetching connection stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve connection stats"
    });
  }
});

// Helper functions for data generation
async function generateHistoricalData(dataType: string, startDate: Date, endDate: Date, aggregation: string) {
  const data = [];
  const interval = aggregation === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // hourly or daily
  
  for (let time = startDate.getTime(); time <= endDate.getTime(); time += interval) {
    const timestamp = new Date(time).toISOString();
    
    switch (dataType) {
      case 'production':
        data.push({
          timestamp,
          jobsCompleted: Math.floor(Math.random() * 10) + 5,
          unitsProduced: Math.floor(Math.random() * 1000) + 500,
          efficiency: Math.round((Math.random() * 20 + 80) * 10) / 10,
          downtime: Math.round(Math.random() * 60)
        });
        break;
        
      case 'quality':
        data.push({
          timestamp,
          qualityRate: Math.round((Math.random() * 5 + 95) * 100) / 100,
          defectCount: Math.floor(Math.random() * 5),
          inspections: Math.floor(Math.random() * 20) + 10,
          reworkItems: Math.floor(Math.random() * 3)
        });
        break;
        
      case 'resources':
        data.push({
          timestamp,
          utilization: Math.round((Math.random() * 30 + 60) * 10) / 10,
          activeResources: Math.floor(Math.random() * 5) + 8,
          maintenanceEvents: Math.floor(Math.random() * 2),
          energyConsumption: Math.round((Math.random() * 500 + 1000) * 10) / 10
        });
        break;
        
      case 'schedules':
        data.push({
          timestamp,
          onTimeJobs: Math.floor(Math.random() * 8) + 7,
          delayedJobs: Math.floor(Math.random() * 3),
          averageLeadTime: Math.round((Math.random() * 5 + 10) * 10) / 10,
          scheduleChanges: Math.floor(Math.random() * 2)
        });
        break;
        
      default:
        data.push({ timestamp, value: Math.random() * 100 });
    }
  }
  
  return data;
}

async function getCurrentRealtimeData(dataType: string) {
  switch (dataType) {
    case 'production_rate':
      return {
        currentRate: Math.round((Math.random() * 50 + 75) * 10) / 10,
        targetRate: 100,
        unit: 'units/hour',
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        lastUpdated: new Date().toISOString()
      };
      
    case 'oee':
      return {
        availability: Math.round((Math.random() * 10 + 85) * 100) / 100,
        performance: Math.round((Math.random() * 10 + 80) * 100) / 100,
        quality: Math.round((Math.random() * 5 + 95) * 100) / 100,
        overall: Math.round((Math.random() * 10 + 75) * 100) / 100,
        lastUpdated: new Date().toISOString()
      };
      
    case 'downtime':
      return {
        currentDowntime: Math.floor(Math.random() * 30),
        plannedDowntime: Math.floor(Math.random() * 60),
        unplannedDowntime: Math.floor(Math.random() * 15),
        unit: 'minutes',
        lastUpdated: new Date().toISOString()
      };
      
    case 'quality_metrics':
      return {
        defectRate: Math.round((Math.random() * 2 + 1) * 100) / 100,
        firstPassYield: Math.round((Math.random() * 5 + 92) * 100) / 100,
        customerComplaints: Math.floor(Math.random() * 3),
        qualityScore: Math.round((Math.random() * 10 + 85) * 10) / 10,
        lastUpdated: new Date().toISOString()
      };
      
    case 'resource_utilization':
      return {
        averageUtilization: Math.round((Math.random() * 20 + 70) * 10) / 10,
        peakUtilization: Math.round((Math.random() * 15 + 85) * 10) / 10,
        activeResources: Math.floor(Math.random() * 3) + 8,
        idleResources: Math.floor(Math.random() * 2),
        lastUpdated: new Date().toISOString()
      };
      
    default:
      return { value: Math.random() * 100, lastUpdated: new Date().toISOString() };
  }
}

// ============================================
// Command & Control APIs for External Agents
// ============================================

// Helper function to generate unique command IDs
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to create standardized command responses
function createCommandResponse(
  success: boolean, 
  commandId: string, 
  message: string, 
  data?: any, 
  warnings?: string[], 
  errors?: string[]
): CommandResponse {
  return {
    success,
    commandId,
    message,
    data,
    warnings,
    errors
  };
}

// JOB SCHEDULING COMMANDS

// POST /api/v1/commands/schedule-job - Create a new production job
router.post("/api/v1/commands/schedule-job", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Schedule Job requested by user ${(req as any).userId}`);
    
    const command = scheduleJobCommandSchema.parse(req.body);
    
    // Create job using correct minimal schema
    const newJob = await db.insert(ptJobs).values({
      externalId: crypto.randomUUID(),
      name: `Job-${Date.now()}`,
      description: `Production job for ${command.operations.map(op => op.operationName).join(', ')}`,
      priority: command.priority,
      needDateTime: new Date(command.needDateTime),
      scheduledStatus: "planned"
    }).returning();

    const job = newJob[0];
    
    // Create operations for the job using correct minimal schema
    const operations = [];
    for (let i = 0; i < command.operations.length; i++) {
      const operation = command.operations[i];
      const opResult = await db.insert(ptJobOperations).values({
        jobId: job.id, // Link to job's primary key
        externalId: crypto.randomUUID(),
        name: operation.operationName,
        description: operation.description,
        operationId: `OP-${Date.now()}-${i}`,
        cycleHrs: operation.processTime.toString(),
        setupHours: (operation.setupTime || 0).toString(),
        postProcessingHours: (operation.teardownTime || 0).toString(),
        requiredFinishQty: "1",
        percentFinished: "0"
      }).returning();
      
      operations.push(opResult[0]);
    }
    
    const result = { job, operations };

    const response = createCommandResponse(
      true,
      commandId,
      `Production job scheduled successfully with ${operations.length} operations`,
      {
        job: job,
        operations: operations
      }
    );

    log(`✅ Command ${commandId}: Job scheduled successfully`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Schedule job failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to schedule job",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// PUT /api/v1/commands/reschedule-job/:id - Reschedule an existing job
router.put("/api/v1/commands/reschedule-job/:id", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    const jobId = parseInt(req.params.id);
    log(`🎯 Command ${commandId}: Reschedule Job ${jobId} requested by user ${req.userId}`);
    
    const command = rescheduleJobCommandSchema.parse(req.body);
    
    // Update job scheduling information
    const updatedJob = await db.update(ptJobs)
      .set({
        scheduledStartDateTime: new Date(command.newStartDateTime),
        scheduledEndDateTime: command.newEndDateTime ? new Date(command.newEndDateTime) : undefined,
      })
      .where(eq(ptJobs.jobId, jobId))
      .returning();

    if (updatedJob.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Job ${jobId} not found`,
        null,
        null,
        [`Job with ID ${jobId} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Job ${jobId} rescheduled successfully`,
      {
        job: updatedJob[0],
        reason: command.reason
      }
    );

    log(`✅ Command ${commandId}: Job ${jobId} rescheduled successfully`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Reschedule job failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to reschedule job",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// POST /api/v1/commands/prioritize-job - Change job priority
router.post("/api/v1/commands/prioritize-job", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Prioritize Job requested by user ${req.userId}`);
    
    const command = prioritizeJobCommandSchema.parse(req.body);
    
    const updatedJob = await db.update(ptJobs)
      .set({ priority: command.newPriority })
      .where(eq(ptJobs.jobId, command.jobId))
      .returning();

    if (updatedJob.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Job ${command.jobId} not found`,
        null,
        null,
        [`Job with ID ${command.jobId} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Job ${command.jobId} priority updated to ${command.newPriority}`,
      {
        job: updatedJob[0],
        reason: command.reason
      }
    );

    log(`✅ Command ${commandId}: Job ${command.jobId} priority updated`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Prioritize job failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to prioritize job",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// POST /api/v1/commands/cancel-job/:id - Cancel a job
router.post("/api/v1/commands/cancel-job/:id", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    const jobId = parseInt(req.params.id);
    log(`🎯 Command ${commandId}: Cancel Job ${jobId} requested by user ${req.userId}`);
    
    const command = cancelJobCommandSchema.parse(req.body);
    
    const updatedJob = await db.update(ptJobs)
      .set({ cancelled: true })
      .where(eq(ptJobs.jobId, jobId))
      .returning();

    if (updatedJob.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Job ${jobId} not found`,
        null,
        null,
        [`Job with ID ${jobId} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Job ${jobId} cancelled successfully`,
      {
        job: updatedJob[0],
        reason: command.reason
      }
    );

    log(`✅ Command ${commandId}: Job ${jobId} cancelled`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Cancel job failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to cancel job",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// RESOURCE MANAGEMENT COMMANDS

// POST /api/v1/commands/assign-resource - Assign resource to operation
router.post("/api/v1/commands/assign-resource", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Assign Resource requested by user ${req.userId}`);
    
    const command = assignResourceCommandSchema.parse(req.body);
    
    // Check if resource exists and is available
    const resource = await db.query.ptResources.findFirst({
      where: eq(ptResources.resourceId, command.resourceId)
    });

    if (!resource) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Resource ${command.resourceId} not found`,
        null,
        null,
        [`Resource with ID ${command.resourceId} does not exist`]
      ));
      return;
    }

    // Create resource assignment
    const assignment = await db.query.ptJobResources.insert({
      publishDate: new Date(),
      instanceId: crypto.randomUUID(),
      operationId: command.operationId,
      defaultResourceId: command.resourceId,
      isPrimary: command.isPrimary,
      startDateTime: command.startDateTime ? new Date(command.startDateTime) : undefined,
      endDateTime: command.endDateTime ? new Date(command.endDateTime) : undefined
    }).returning();

    const response = createCommandResponse(
      true,
      commandId,
      `Resource ${command.resourceId} assigned to operation ${command.operationId}`,
      {
        assignment: assignment[0],
        resource: resource
      }
    );

    log(`✅ Command ${commandId}: Resource assigned successfully`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Assign resource failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to assign resource",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// QUALITY CONTROL COMMANDS

// POST /api/v1/commands/quality-hold - Place quality hold on job/operation
router.post("/api/v1/commands/quality-hold", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Quality Hold requested by user ${req.userId}`);
    
    const command = qualityHoldCommandSchema.parse(req.body);
    
    // For now, we'll simulate placing a hold by updating job/operation status
    let updatedEntity;
    let entityType: string;
    
    if (command.jobId) {
      updatedEntity = await db.update(ptJobs)
        .set({ 
          holdUntil: command.expectedResolutionTime ? new Date(command.expectedResolutionTime) : undefined 
        })
        .where(eq(ptJobs.jobId, command.jobId))
        .returning();
      entityType = 'job';
    } else if (command.operationId) {
      updatedEntity = await db.update(ptJobOperations)
        .set({ status: 'on_hold' })
        .where(eq(ptJobOperations.operationId, command.operationId))
        .returning();
      entityType = 'operation';
    }

    if (!updatedEntity || updatedEntity.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `${entityType} not found`,
        null,
        null,
        [`${entityType} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Quality hold placed on ${entityType} - ${command.holdType} (${command.severity})`,
      {
        holdId: commandId,
        entityType,
        entity: updatedEntity[0],
        holdDetails: {
          type: command.holdType,
          reason: command.reason,
          severity: command.severity,
          expectedResolution: command.expectedResolutionTime
        }
      }
    );

    log(`✅ Command ${commandId}: Quality hold placed on ${entityType}`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Quality hold failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to place quality hold",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// PRODUCTION CONTROL COMMANDS

// POST /api/v1/commands/start-operation - Start an operation
router.post("/api/v1/commands/start-operation", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Start Operation requested by user ${req.userId}`);
    
    const command = startOperationCommandSchema.parse(req.body);
    
    const updatedOperation = await db.update(ptJobOperations)
      .set({ 
        status: 'in_progress',
        startDate: command.actualStartDateTime ? new Date(command.actualStartDateTime) : new Date()
      })
      .where(eq(ptJobOperations.operationId, command.operationId))
      .returning();

    if (updatedOperation.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Operation ${command.operationId} not found`,
        null,
        null,
        [`Operation with ID ${command.operationId} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Operation ${command.operationId} started successfully`,
      {
        operation: updatedOperation[0],
        startTime: updatedOperation[0].startDate,
        notes: command.operatorNotes
      }
    );

    log(`✅ Command ${commandId}: Operation ${command.operationId} started`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Start operation failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to start operation",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// POST /api/v1/commands/stop-operation - Stop an operation
router.post("/api/v1/commands/stop-operation", requireAuth, async (req, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Stop Operation requested by user ${req.userId}`);
    
    const command = stopOperationCommandSchema.parse(req.body);
    
    let status = 'completed';
    if (command.reason !== 'completed') {
      status = 'stopped';
    }

    const updatedOperation = await db.update(ptJobOperations)
      .set({ 
        status: status,
        endDate: command.actualEndDateTime ? new Date(command.actualEndDateTime) : new Date()
      })
      .where(eq(ptJobOperations.operationId, command.operationId))
      .returning();

    if (updatedOperation.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Operation ${command.operationId} not found`,
        null,
        null,
        [`Operation with ID ${command.operationId} does not exist`]
      ));
      return;
    }

    const response = createCommandResponse(
      true,
      commandId,
      `Operation ${command.operationId} stopped - ${command.reason}`,
      {
        operation: updatedOperation[0],
        endTime: updatedOperation[0].endDate,
        reason: command.reason,
        reasonDetails: command.reasonDetails,
        notes: command.operatorNotes
      }
    );

    log(`✅ Command ${commandId}: Operation ${command.operationId} stopped`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    log(`❌ Command ${commandId}: Stop operation failed - ${error.message}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        null,
        null,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to stop operation",
        null,
        null,
        [error.message]
      ));
    }
  }
});

// =============================================================================
// ENHANCED AUTHENTICATION API - Task 5: API Keys & OAuth 2.0
// =============================================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { apiKeys, apiKeyUsage, oauthClients, oauthTokens, users, roles } from '@shared/schema';
import { enhancedAuth, requirePermission, AuthenticatedRequest } from './enhanced-auth-middleware';
import { insertApiKeySchema, insertOauthClientSchema, ApiKey, OauthClient } from '@shared/schema';
import { desc, eq, and } from 'drizzle-orm';

// POST /api/v1/auth/api-keys - Create new API key
router.post("/api/v1/auth/api-keys", enhancedAuth, requirePermission('auth', 'manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertApiKeySchema.parse(req.body);
    
    // Generate key ID and secret
    const keyId = crypto.randomBytes(16).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    const fullKey = `pt_key_${keyId}_${secret}`;
    
    // Hash the secret for storage
    const keyHash = await bcrypt.hash(secret, 12);
    
    // Insert API key
    const [apiKey] = await db.insert(apiKeys).values({
      keyId,
      keyHash,
      name: validatedData.name,
      description: validatedData.description,
      userId: req.user!.id,
      roleId: validatedData.roleId,
      scope: validatedData.scope,
      expiresAt: validatedData.expiresAt,
    }).returning();

    console.log(`🔑 [API Keys] Created new API key: ${validatedData.name} for user ${req.user!.username}`);

    res.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        keyId: apiKey.keyId,
        name: apiKey.name,
        description: apiKey.description,
        scope: apiKey.scope,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        fullKey: fullKey // Only returned once during creation
      }
    });

  } catch (error) {
    console.error('🚨 [API Keys] Creation failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key'
    });
  }
});

// GET /api/v1/auth/api-keys - List API keys for current user
router.get("/api/v1/auth/api-keys", enhancedAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userApiKeys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, req.user!.id),
      with: {
        role: true
      },
      orderBy: [desc(apiKeys.createdAt)]
    });

    const sanitizedKeys = userApiKeys.map(key => ({
      id: key.id,
      keyId: key.keyId,
      name: key.name,
      description: key.description,
      scope: key.scope,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      role: key.role ? { id: key.role.id, name: key.role.name } : null
    }));

    res.json({
      success: true,
      apiKeys: sanitizedKeys
    });

  } catch (error) {
    console.error('🚨 [API Keys] List failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

// DELETE /api/v1/auth/api-keys/:id - Revoke API key
router.delete("/api/v1/auth/api-keys/:id", enhancedAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const keyId = parseInt(req.params.id);
    
    // Find the API key and verify ownership
    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, req.user!.id)
      )
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Deactivate the key
    await db.update(apiKeys)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    console.log(`🗑️ [API Keys] Revoked API key: ${apiKey.name} for user ${req.user!.username}`);

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('🚨 [API Keys] Revocation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

// GET /api/v1/auth/api-keys/:id/usage - Get API key usage analytics
router.get("/api/v1/auth/api-keys/:id/usage", enhancedAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const keyId = parseInt(req.params.id);
    
    // Verify API key ownership
    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, req.user!.id)
      )
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Get usage statistics
    const usage = await db.query.apiKeyUsage.findMany({
      where: eq(apiKeyUsage.apiKeyId, keyId),
      orderBy: [desc(apiKeyUsage.timestamp)],
      limit: parseInt(req.query.limit as string) || 100
    });

    res.json({
      success: true,
      usage: usage.map(u => ({
        endpoint: u.endpoint,
        method: u.method,
        responseStatus: u.responseStatus,
        responseTime: u.responseTime,
        timestamp: u.timestamp
      }))
    });

  } catch (error) {
    console.error('🚨 [API Keys] Usage fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API key usage'
    });
  }
});

// =============================================================================
// SEMANTIC QUERY API - Task 4: Natural Language Manufacturing Queries
// =============================================================================

// CRITICAL SECURITY: SQL Safety Validation Function
interface SQLSafetyResult {
  safe: boolean;
  reason?: string;
}

function validateSQLSafety(sqlQuery: string, maxResults: number): SQLSafetyResult {
  const cleanQuery = sqlQuery.trim().toLowerCase();
  
  // 1. Ensure it's exactly one statement (no semicolons except at end)
  const statements = sqlQuery.split(';').filter(s => s.trim());
  if (statements.length > 1) {
    return { safe: false, reason: "Multiple statements not allowed" };
  }
  
  // 2. Must start with SELECT (case insensitive)
  if (!cleanQuery.startsWith('select')) {
    return { safe: false, reason: "Only SELECT statements allowed" };
  }
  
  // 3. Block dangerous statement patterns (not just keywords)
  const dangerousStatementPatterns = [
    /\binsert\s+into\b/i,
    /\bupdate\s+\w+\s+set\b/i,
    /\bdelete\s+from\b/i,
    /\bdrop\s+\w+/i,
    /\bcreate\s+\w+/i,
    /\balter\s+\w+/i,
    /\btruncate\s+\w+/i,
    /\bgrant\s+\w+/i,
    /\brevoke\s+\w+/i,
    /\bexec\s*\(/i,
    /\bexecute\s*\(/i,
    /\bpg_sleep\s*\(/i,
    /\bwaitfor\s+delay/i,
    /\binformation_schema\./i,
    /\bpg_catalog\./i
  ];
  
  for (const pattern of dangerousStatementPatterns) {
    if (pattern.test(cleanQuery)) {
      return { safe: false, reason: `Blocked dangerous SQL pattern: ${pattern.source}` };
    }
  }
  
  // Block SQL injection comment patterns
  const commentPatterns = [
    /--.*$/m,
    /\/\*.*?\*\//g,
    /\bchar\s*\(/i,
    /\bascii\s*\(/i,
    /\bsubstring\s*\([^)]*,\s*\d+\s*,\s*1\s*\)/i  // Common injection pattern
  ];
  
  for (const pattern of commentPatterns) {
    if (pattern.test(sqlQuery)) {
      return { safe: false, reason: `Blocked SQL injection pattern` };
    }
  }
  
  // 4. Handle LIMIT clause requirement (allow COUNT without LIMIT)
  const isCountQuery = /select\s+count\s*\(/i.test(cleanQuery);
  const isAggregateQuery = /select\s+(count|sum|avg|min|max)\s*\(/i.test(cleanQuery);
  
  if (!isAggregateQuery && !cleanQuery.includes('limit')) {
    return { safe: false, reason: "LIMIT clause is required for non-aggregate queries" };
  }
  
  if (cleanQuery.includes('limit')) {
    const limitMatch = cleanQuery.match(/limit\s+(\d+)/);
    if (!limitMatch) {
      return { safe: false, reason: "Invalid LIMIT clause format" };
    }
    
    const limitValue = parseInt(limitMatch[1]);
    if (limitValue > maxResults) {
      return { safe: false, reason: `LIMIT ${limitValue} exceeds maximum ${maxResults}` };
    }
  }
  
  // 5. CRITICAL: Extract and validate ALL referenced tables
  const allowedTables = ['ptjobs', 'ptjoboperations', 'alerts'];
  const referencedTables = extractAllTableReferences(sqlQuery);
  
  // Every referenced table must be in the allowed list
  const unauthorizedTables = referencedTables.filter(table => 
    !allowedTables.includes(table.toLowerCase())
  );
  
  if (unauthorizedTables.length > 0) {
    return { safe: false, reason: `Unauthorized tables referenced: ${unauthorizedTables.join(', ')}` };
  }
  
  if (referencedTables.length === 0) {
    return { safe: false, reason: "No valid tables found in query" };
  }
  
  // 6. Block complex or suspicious patterns
  const suspiciousPatterns = [
    /union\s+select/i,
    /\/\*.*\*\//,
    /--.*$/m,
    /;.*select/i,
    /select.*into\s+/i,
    /exec\s*\(/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sqlQuery)) {
      return { safe: false, reason: "Suspicious SQL pattern detected" };
    }
  }
  
  return { safe: true };
}

// CRITICAL SECURITY: Extract ALL table references from SQL
function extractAllTableReferences(sqlQuery: string): string[] {
  const tables: Set<string> = new Set();
  const cleanQuery = sqlQuery.replace(/\s+/g, ' ').trim();
  
  // Pattern to match table references after FROM, JOIN, INTO, UPDATE
  // This captures: FROM table, JOIN table, LEFT JOIN table, etc.
  const tablePatterns = [
    // FROM clauses
    /\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    // JOIN clauses (any type of join)
    /\b(?:inner\s+join|left\s+join|right\s+join|full\s+join|cross\s+join|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    // UPDATE clauses
    /\bupdate\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    // INSERT INTO clauses
    /\binsert\s+into\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    // DELETE FROM clauses
    /\bdelete\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
  ];
  
  // Extract table names using each pattern
  for (const pattern of tablePatterns) {
    let match;
    while ((match = pattern.exec(cleanQuery)) !== null) {
      const tableName = match[1].toLowerCase();
      // Skip SQL keywords that might be captured
      if (!['select', 'where', 'and', 'or', 'on', 'as', 'by'].includes(tableName)) {
        tables.add(tableName);
      }
    }
  }
  
  // Handle subqueries - look for nested SELECT statements
  // This is a simplified check for obvious subquery patterns
  const subqueryPattern = /\(\s*select\s+.*?\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let subMatch;
  while ((subMatch = subqueryPattern.exec(cleanQuery)) !== null) {
    const tableName = subMatch[1].toLowerCase();
    if (!['select', 'where', 'and', 'or', 'on', 'as', 'by'].includes(tableName)) {
      tables.add(tableName);
    }
  }
  
  // Handle WITH clauses (CTEs)
  const ctePattern = /\bwith\s+[a-zA-Z_][a-zA-Z0-9_]*\s+as\s*\(\s*select\s+.*?\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let cteMatch;
  while ((cteMatch = ctePattern.exec(cleanQuery)) !== null) {
    const tableName = cteMatch[1].toLowerCase();
    if (!['select', 'where', 'and', 'or', 'on', 'as', 'by'].includes(tableName)) {
      tables.add(tableName);
    }
  }
  
  return Array.from(tables);
}

// POST /api/v1/query/semantic - Natural language query processing
router.post("/api/v1/query/semantic", requireAuth, async (req, res) => {
  const startTime = Date.now();
  let queryId = `semantic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    console.log(`🧠 [Semantic Query] ${queryId}: Processing natural language query`);
    
    // Parse and validate request
    const semanticQuery = semanticQuerySchema.parse(req.body);
    const { query, context, maxResults, includeMetadata } = semanticQuery;
    
    console.log(`🧠 [Semantic Query] ${queryId}:`, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      context,
      maxResults,
      user: req.userId
    });

    // Initialize OpenAI
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Step 1: Analyze query intent and generate SQL
    const intentAnalysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a manufacturing data analyst AI that converts natural language queries into SQL for a PlanetTogether manufacturing system database.

DATABASE SCHEMA (Available Tables Only):
- ptjobs: id, external_id, name, description, priority, need_date_time, scheduled_status, created_at, updated_at
- ptjoboperations: id, job_id, external_id, name, description, operation_id, required_finish_qty, cycle_hrs, setup_hours, post_processing_hours, scheduled_start, scheduled_end, percent_finished, created_at, updated_at
- alerts: id, title, description, severity, status, type, detected_at, created_at

Note: Only query these confirmed available tables. Do not reference ptresources, ptjobresources, or ptmanufacturingorders unless you know they exist.

QUERY CONTEXT: ${context}

Your task:
1. Understand the user's intent
2. Generate appropriate SQL query (read-only SELECT only)
3. Provide confidence score
4. Suggest related queries

Respond with JSON:
{
  "intent": "Brief description of what user is asking",
  "confidence": 0.0-1.0,
  "sql_query": "SELECT statement only",
  "data_source": "Primary table being queried",
  "explanation": "How you interpreted the query",
  "suggestions": ["Related query 1", "Related query 2"],
  "requires_joins": boolean,
  "estimated_complexity": "low|medium|high"
}

SAFETY RULES:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP)
- Use proper SQL syntax with quotes for column names containing special characters
- Limit results with LIMIT clause (max ${maxResults})
- Handle date/time queries appropriately
- Be defensive about potential SQL injection

Examples:
- "How many jobs are running?" → COUNT(*) FROM ptjobs WHERE scheduled_status = 'running'
- "What resources are overutilized?" → SELECT * FROM ptresources WHERE utilization > 80
- "Show me high priority operations" → JOIN ptjobs and ptjoboperations WHERE priority > 7`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const analysis = JSON.parse(intentAnalysis.choices[0].message.content || '{}');
    
    console.log(`🧠 [Semantic Query] ${queryId}: Intent analysis:`, {
      intent: analysis.intent,
      confidence: analysis.confidence,
      dataSource: analysis.data_source
    });

    // Step 2: SQL Safety Validation and Execution
    let queryResults = [];
    let actualResultCount = 0;
    
    if (analysis.confidence >= 0.6 && analysis.sql_query) {
      // CRITICAL: Server-side SQL safety validation
      const sqlSafetyCheck = validateSQLSafety(analysis.sql_query, maxResults);
      if (!sqlSafetyCheck.safe) {
        console.error(`🧠 [Semantic Query] ${queryId}: SQL safety violation:`, sqlSafetyCheck.reason);
        
        const executionTime = Date.now() - startTime;
        res.status(400).json({
          success: false,
          query,
          intent: analysis.intent || "Unsafe query blocked",
          context,
          data: null,
          metadata: {
            executionTime,
            dataSource: analysis.data_source || "security",
            confidence: analysis.confidence || 0,
            resultCount: 0,
            error: "Query blocked for security reasons"
          },
          suggestions: [
            "Try a simpler query about jobs or operations",
            "Ask for counts or basic information",
            "Avoid complex joins or system tables"
          ],
          securityNotice: "Query was blocked to protect system security"
        });
        return;
      }
      
      try {
        console.log(`🧠 [Semantic Query] ${queryId}: Executing validated SQL:`, analysis.sql_query);
        const queryResult = await db.execute(sql.raw(analysis.sql_query));
        queryResults = queryResult.rows;
        actualResultCount = queryResults.length;
        
        console.log(`🧠 [Semantic Query] ${queryId}: Query executed, ${actualResultCount} results`);
      } catch (sqlError) {
        console.error(`🧠 [Semantic Query] ${queryId}: SQL execution failed:`, sqlError.message);
        
        // If SQL fails, provide a helpful error response
        const executionTime = Date.now() - startTime;
        res.status(400).json({
          success: false,
          query,
          intent: analysis.intent || "Unable to understand query",
          context,
          data: null,
          metadata: {
            executionTime,
            dataSource: analysis.data_source || "unknown",
            confidence: analysis.confidence || 0,
            sqlQuery: includeMetadata ? analysis.sql_query : undefined,
            resultCount: 0,
            error: "Failed to execute generated query"
          },
          suggestions: analysis.suggestions || [
            "Try asking about jobs, resources, or operations",
            "Be more specific about what data you want to see",
            "Ask about counts, lists, or status information"
          ]
        });
        return;
      }
    } else {
      console.log(`🧠 [Semantic Query] ${queryId}: Low confidence (${analysis.confidence}), not executing SQL`);
    }

    // Step 3: Format results for user-friendly presentation
    let formattedData = queryResults;
    
    if (queryResults.length > 0 && analysis.data_source) {
      // Apply context-specific formatting based on the primary data source
      switch (analysis.data_source) {
        case 'ptjobs':
          formattedData = queryResults.map(row => ({
            id: row.id,
            name: row.name || 'Unnamed Job',
            priority: row.priority,
            status: row.scheduled_status,
            dueDate: row.need_date_time,
            description: row.description
          }));
          break;
          
        case 'ptjoboperations':
          formattedData = queryResults.map(row => ({
            id: row.id,
            name: row.name || 'Unnamed Operation',
            jobId: row.job_id,
            duration: `${row.cycle_hrs || 0}h`,
            progress: `${row.percent_finished || 0}%`,
            status: row.scheduled_start ? 'scheduled' : 'pending'
          }));
          break;
          
        case 'ptresources':
          formattedData = queryResults.map(row => ({
            id: row.id,
            name: row.name || 'Unnamed Resource',
            type: row.type,
            capacity: row.capacity,
            utilization: `${row.utilization || 0}%`,
            status: row.active ? 'active' : 'inactive'
          }));
          break;
          
        default:
          // Keep original format for other tables
          formattedData = queryResults;
      }
    }

    // Step 4: Build response
    const executionTime = Date.now() - startTime;
    const response: SemanticQueryResponse = {
      success: true,
      query,
      intent: analysis.intent || "General manufacturing query",
      context,
      data: formattedData,
      metadata: {
        executionTime,
        dataSource: analysis.data_source || "multiple",
        confidence: analysis.confidence || 0.5,
        sqlQuery: includeMetadata ? analysis.sql_query : undefined,
        resultCount: actualResultCount
      },
      suggestions: analysis.suggestions || [],
      relatedQueries: [
        "Show me all active resources",
        "What jobs have high priority?",
        "How many operations are scheduled for today?",
        "Which resources are over capacity?"
      ]
    };

    console.log(`🧠 [Semantic Query] ${queryId}: Success - ${actualResultCount} results in ${executionTime}ms`);
    res.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`🧠 [Semantic Query] ${queryId}: Error:`, error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        query: req.body.query || "Invalid query",
        intent: "Validation failed",
        context: req.body.context || "general",
        data: null,
        metadata: {
          executionTime,
          dataSource: "validation",
          confidence: 0,
          resultCount: 0
        },
        error: "Invalid request format",
        validationErrors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    } else {
      res.status(500).json({
        success: false,
        query: req.body.query || "Unknown query",
        intent: "System error",
        context: req.body.context || "general",
        data: null,
        metadata: {
          executionTime,
          dataSource: "system",
          confidence: 0,
          resultCount: 0
        },
        error: "Internal server error processing semantic query"
      });
    }
  }
});

// Max AI endpoints for manufacturing intelligence
router.post("/api/max-ai/chat", async (req, res) => {
  try {
    // Development bypass - skip authentication in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 [Max AI Chat] Development mode: Skipping authentication");
    } else {
      // In production, require authentication
      await new Promise((resolve, reject) => {
        requireAuth(req, res, (error: any) => {
          if (error) reject(error);
          else resolve(undefined);
        });
      });
    }

    const { message, context, streaming = false } = req.body;
    const userId = (req as any).userId || 1; // Default to user 1 in development
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use imported Max AI service - DEBUG ENHANCED
    console.log(`[Max AI Chat] Processing request: "${message}"`);
    console.log(`[Max AI Chat] maxAI object:`, maxAI);
    console.log(`[Max AI Chat] maxAI type:`, typeof maxAI);
    console.log(`[Max AI Chat] maxAI keys:`, Object.keys(maxAI || {}));
    console.log(`[Max AI Chat] respondToMessage exists:`, typeof maxAI?.respondToMessage);
    console.log(`[Max AI Chat] All methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(maxAI || {})));
    
    if (typeof maxAI?.generateResponse !== 'function') {
      console.error(`[Max AI Chat] CRITICAL: generateResponse is not a function!`);
      throw new Error(`Max AI service method not available: ${typeof maxAI?.generateResponse}`);
    }
    
    // Call the Max AI service directly
    console.log(`[Max AI Chat] Calling generateResponse...`);
    const response = await maxAI.generateResponse(message, {
      userId,
      userRole: 'Administrator',
      currentPage: context?.currentPage || '/home',
      selectedData: context?.selectedData,
      recentActions: context?.recentActions,
      conversationHistory: context?.conversationHistory
    });
    console.log(`[Max AI Chat] Response received:`, response);

    res.json(response);
  } catch (error) {
    console.error('Max AI chat error:', error);
    res.status(500).json({ 
      error: "Failed to process message",
      content: "I'm experiencing technical difficulties. Please try again.",
      error: true
    });
  }
});

export default router;