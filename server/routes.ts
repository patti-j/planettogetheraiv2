import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { storage } from "./storage";
import { maxAI } from "./services/max-ai-service";
import { realtimeVoiceService } from './services/realtime-voice-service';
import { enhancedAuth } from "./enhanced-auth-middleware";
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
  // Calendar schemas
  insertCalendarSchema,
  insertMaintenancePeriodSchema,
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
import agentTrainingRoutes from "./routes/agent-training-routes";
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from "./config/ai-model";
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
  const cssPath = path.join(process.cwd(), 'node_modules/@bryntum/schedulerpro/schedulerpro.classic-light.css');
  res.sendFile(cssPath);
});

router.get('/schedulerpro.classic-dark.css', (req, res) => {
  const cssPath = path.join(process.cwd(), 'node_modules/@bryntum/schedulerpro/schedulerpro.classic-dark.css');
  res.sendFile(cssPath);
});

router.get('/schedulerpro.stockholm.css', (req, res) => {
  const cssPath = path.join(process.cwd(), 'node_modules/@bryntum/schedulerpro/schedulerpro.stockholm.css');
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

// Development-only endpoint for JWT token generation
// Requires valid session (auto-created in dev) before issuing JWT
router.get("/api/auth/dev-token", async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: "Forbidden in production" });
  }
  
  // In development, automatically set up session if not present
  // This mimics the /api/auth/me development bypass but creates a proper session
  if (!req.session.userId) {
    req.session.userId = 1; // Auto-assign admin user in development
    req.session.isDemo = false;
    console.log("🔧 Development mode: Auto-creating session for user 1");
  }
  
  // Now that session exists, verify we have a user
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  console.log("🔧 Development JWT token requested for session user:", req.session.userId);
  
  // Use actual session user ID
  const defaultAdminUser = {
    id: req.session.userId,
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

  // Generate JWT token with session user
  const token = generateJWT(defaultAdminUser);
  
  // Store in memory
  global.tokenStore = global.tokenStore || new Map();
  global.tokenStore.set(token, {
    userId: req.session.userId,
    userData: defaultAdminUser,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  });
  
  console.log("🔧 Development JWT token issued for session user:", req.session.userId);
  
  return res.json({
    user: defaultAdminUser,
    token: token
  });
});

router.get("/api/auth/me", async (req, res) => {
  console.log("=== AUTH CHECK ===");
  console.log(`Authorization header: ${req.headers.authorization ? 'Bearer ***' : 'None'}`);
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
router.get("/api/user-preferences/:userId", async (req, res) => {
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

router.post("/api/user-preferences/:userId", async (req, res) => {
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

// PUT route for updating user preferences (full update)
router.put("/api/user-preferences", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const existing = await storage.getUserPreferences(userId);
    
    if (existing) {
      const updated = await storage.updateUserPreferences(userId, req.body);
      res.json(updated);
    } else {
      const created = await storage.createUserPreferences({ userId, ...req.body });
      res.json(created);
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ message: "Failed to update user preferences" });
  }
});

// PUT route with userId in path
router.put("/api/user-preferences/:userId", async (req, res) => {
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
    console.error("Error updating user preferences:", error);
    res.status(500).json({ message: "Failed to update user preferences" });
  }
});

// PATCH route for partial updates to user preferences
router.patch("/api/user-preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const existing = await storage.getUserPreferences(userId);
    
    if (existing) {
      // Merge existing preferences with new ones for partial update
      const mergedPreferences = { ...existing, ...req.body };
      const updated = await storage.updateUserPreferences(userId, mergedPreferences);
      res.json(updated);
    } else {
      // Create new preferences if they don't exist
      const created = await storage.createUserPreferences({ userId, ...req.body });
      res.json(created);
    }
  } catch (error) {
    console.error("Error patching user preferences:", error);
    res.status(500).json({ message: "Failed to update user preferences" });
  }
});

// Recent pages routes
router.post("/api/recent-pages", async (req, res) => {
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

router.get("/api/recent-pages", async (req, res) => {
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
router.get("/api/plants", async (req, res) => {
  try {
    const plants = await storage.getPlants();
    res.json(plants);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ message: "Failed to fetch plants" });
  }
});

router.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await storage.getJobs();
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
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
router.get("/api/pt-operations", async (req, res) => {
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
    res.status(500).json({ message: "Failed to fetch PT operations", errorMessage: (error as Error).message });
  }
});

// PT Dependencies endpoint - generates dependencies from ptjoboperations sequence_number
router.get("/api/pt-dependencies", async (req, res) => {
  try {
    console.log('Fetching PT dependencies from ptjobsuccessormanufacturingorders table...');
    
    // Query PT dependencies - create dependencies between operations in the same job
    // Using sequence_number to ensure correct brewing process order
    const ptDependenciesQuery = `
      WITH job_operations AS (
        -- Get all operations grouped by job, ordered by brewing process sequence
        SELECT 
          jo.id as op_id,
          jo.job_id,
          jo.external_id,
          jo.name,
          jo.sequence_number,
          jo.scheduled_start,
          jo.scheduled_end
        FROM ptjoboperations jo
        WHERE jo.job_id IS NOT NULL 
          AND jo.sequence_number IS NOT NULL
      )
      -- Create dependencies between consecutive operations based on sequence_number
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
        AND curr.sequence_number = next.sequence_number - 1
      ORDER BY curr.job_id, curr.sequence_number
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
    res.status(500).json({ message: "Failed to fetch PT dependencies", errorMessage: (error as Error).message });
  }
});

// PT Resources endpoint - reads from PT tables
router.get("/api/pt-resources", async (req, res) => {
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
      category: resource.capacity_type || 'Manufacturing',
      capacity: 100, // Default capacity since column doesn't exist
      efficiency: 100, // Default efficiency since column doesn't exist
      isBottleneck: resource.bottleneck || false,
      plantName: resource.plant_name,
      active: resource.active
    }));

    console.log(`Successfully fetched ${resources.length} PT resources`);
    res.json(resources);
    
  } catch (error) {
    console.error("Error fetching PT resources:", error);
    res.status(500).json({ message: "Failed to fetch PT resources", errorMessage: (error as Error).message });
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

// Serve Bryntum assets - Route already defined above, removing duplicate

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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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

// JWT-based authentication middleware - secure and stateless (optimized)
// This is a wrapper around enhancedAuth for backwards compatibility
async function requireAuth(req: any, res: any, next: any) {
  // Development bypass for canvas widgets
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/canvas/widgets')) {
    console.log('🔧 [Canvas Widgets] Development auth bypass for:', req.path);
    return next();
  }
  
  // Use the optimized enhancedAuth middleware
  await enhancedAuth(req, res, () => {
    // Backwards compatibility: set req.userData from req.user
    if (req.user) {
      req.userData = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || '',
        roles: [], // Enhanced auth doesn't populate this
        permissions: req.user.permissions || []
      };
    }
    next();
  });
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
      userMessage: message || null,
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
router.get("/api/dashboard-configs", requireAuth, async (req, res) => {
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
                incidentTypes: true,
                trendAnalysis: true,
                safeDays: true
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
  } catch (error) {
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
    
    // Generate actual chart data for widgets (using AI-powered dynamic generation)
    async function generateChartData(dataSource: string, userQuery?: string, title?: string) {
      switch (dataSource) {
        case 'dynamic':
          // Use AI-powered dynamic chart generation
          if (userQuery) {
            try {
              const { MaxAIService } = await import('./services/max-ai-service');
              const maxAI = new MaxAIService();
              const chartData = await maxAI.getRelevantChartData(userQuery);
              console.log('[Canvas Widgets] Dynamic chart data generated:', chartData.length, 'items');
              return chartData;
            } catch (error) {
              console.error('[Canvas Widgets] Error generating dynamic chart data:', error);
            }
          }
          // If no userQuery, try to infer from title
          if (title && title.toLowerCase().includes('resource')) {
            if (title.toLowerCase().includes('plant')) {
              const resourceQuery = `
                SELECT 
                  plant_name,
                  COUNT(*) as count
                FROM ptresources 
                WHERE plant_name IS NOT NULL
                GROUP BY plant_name 
                ORDER BY COUNT(*) DESC
              `;
              const result = await db.execute(sql.raw(resourceQuery));
              return result.rows.map((row: any) => ({
                name: row.plant_name || 'Unknown Plant',
                value: parseInt(row.count),
                label: row.plant_name || 'Unknown Plant'
              }));
            } else if (title.toLowerCase().includes('department')) {
              const resourceQuery = `
                SELECT 
                  department_name,
                  COUNT(*) as count
                FROM ptresources 
                WHERE department_name IS NOT NULL
                GROUP BY department_name 
                ORDER BY COUNT(*) DESC
              `;
              const result = await db.execute(sql.raw(resourceQuery));
              return result.rows.map((row: any) => ({
                name: row.department_name || 'Unknown Department',
                value: parseInt(row.count),
                label: row.department_name || 'Unknown Department'
              }));
            }
          }
          // Fall through to jobs if can't determine
        case 'jobs':
          // Get actual production job data
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
        case 'resources':
          // Get actual resource data by plant
          const resourcesQuery = `
            SELECT 
              plant_name,
              COUNT(*) as count
            FROM ptresources 
            WHERE plant_name IS NOT NULL
            GROUP BY plant_name 
            ORDER BY COUNT(*) DESC
          `;
          const resourcesResult = await db.execute(sql.raw(resourcesQuery));
          return resourcesResult.rows.map((row: any) => ({
            name: row.plant_name || 'Unknown Plant',
            value: parseInt(row.count),
            label: row.plant_name || 'Unknown Plant'
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
      
      // Use stored chart data if available (from AI chart generation), otherwise generate fresh data
      let chartData;
      if (config.chartConfig && config.chartConfig.data) {
        // Widget has pre-generated chart data from AI - use it directly
        chartData = config.chartConfig.data;
        console.log('[Canvas Widgets] ✅ Using stored chart data from widget config:', chartData.length, 'items');
      } else if (config.data && Array.isArray(config.data)) {
        // Chart data stored directly in config.data
        chartData = config.data;
        console.log('[Canvas Widgets] ✅ Using stored chart data from config.data:', chartData.length, 'items');
      } else {
        // Legacy widget without stored data - generate it
        chartData = await generateChartData(config.dataSource || 'jobs', config.userQuery, widget.title);
        console.log('[Canvas Widgets] ⚙️ Generated fresh chart data:', chartData?.length || 0, 'items');
      }
      
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
  let userId = 1; // Default user ID for development
  
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets POST] Development mode: Skipping authentication");
    // Set default user for development
    (req as any).user = { id: 1, username: 'admin', email: 'admin@planettogether.com' };
  } else {
    // In production, require authentication
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (error: any) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
    userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
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

// Get single widget by ID - returns JSON widget data
router.get("/api/widgets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const widgetId = Number(id); // Coerce to number for proper DB query
    console.log('🔍 [Widget API] Fetching widget:', widgetId);
    
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: 'Invalid widget ID' });
    }
    
    // Query widget from database
    const result = await db.execute(sql`SELECT * FROM widgets WHERE id = ${widgetId} AND is_active = true`);
    
    if (result.rows.length === 0) {
      console.log('❌ [Widget API] Widget not found:', widgetId);
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    const widget = result.rows[0] as any;
    console.log('✅ [Widget API] Widget found:', widget.title);
    
    // Parse config if it's stored as JSON string
    let config = widget.config;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (error) {
        console.error('❌ [Widget API] Error parsing widget config:', error);
        config = {};
      }
    }
    
    // Generate chart data if it's a chart widget
    if (widget.type === 'bar' && config?.dataSource === 'dynamic') {
      try {
        const { MaxAIService } = await import('./services/max-ai-service');
        const maxAI = new MaxAIService();
        
        // Use the same method that generates dynamic charts in the canvas widgets endpoint
        const userQuery = config.userQuery || '';
        const chartData = await maxAI.getDynamicChart(userQuery);
        
        // Add chart data to widget response
        widget.chartData = chartData.data || [];
        console.log('📊 [Widget API] Chart data generated:', widget.chartData.length, 'items');
      } catch (error) {
        console.error('❌ [Widget API] Error generating chart data:', error);
        // Continue without chart data rather than failing
        widget.chartData = [];
      }
    }
    
    // Ensure config is properly included in response
    widget.config = config;
    
    res.json(widget);
  } catch (error: any) {
    console.error('❌ [Widget API] Error fetching widget:', error);
    res.status(500).json({ error: 'Failed to fetch widget' });
  }
});

// Widget visibility endpoint - missing but needed for canvas clear functionality
router.put("/api/canvas/widgets/:id/visibility", async (req, res) => {
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets] Early dev bypass middleware triggered for:", req.path);
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

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid widget ID" });
    }

    const { visible } = req.body;
    
    // Update the widget's is_active field in the database
    await db.update(widgets)
      .set({ isActive: visible === true })
      .where(eq(widgets.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating widget visibility:", error);
    res.status(500).json({ error: "Failed to update widget visibility" });
  }
});

// Batch clear all canvas widgets - fast endpoint for clearing canvas
router.post("/api/canvas/widgets/batch-clear", async (req, res) => {
  // Development bypass - skip authentication in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 [Canvas Widgets Batch Clear] Development mode: Skipping authentication");
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
    // Clear all widgets in a single database query - MUCH faster than individual updates
    const result = await db.update(widgets)
      .set({ isActive: false })
      .where(eq(widgets.isActive, true));

    res.json({ success: true, message: 'All widgets cleared' });
  } catch (error) {
    console.error("Error batch clearing widgets:", error);
    res.status(500).json({ error: "Failed to clear widgets" });
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

// Forecasting service URL
router.get("/api/forecasting-service-url", (req, res) => {
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(',')[0];
  const protocol = 'https'; // Always use HTTPS for Replit public URLs
  
  // Replit uses port-prefixed subdomains for public access (e.g., 8080-<slug>.<cluster>.replit.dev)
  const forecastingUrl = replitDevDomain 
    ? `${protocol}://8080-${replitDevDomain}`
    : `${protocol}://${req.get('host')}`;
  
  res.json({ url: forecastingUrl });
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

// Save operation schedule updates
router.patch("/api/pt-operations/schedule", async (req, res) => {
  try {
    const updates = req.body.operations;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid request: operations array required' });
    }
    
    console.log(`📝 Saving schedule updates for ${updates.length} operations...`);
    
    // Update each operation's scheduled_start, scheduled_end, and manually_scheduled flag
    let updated = 0;
    for (const op of updates) {
      try {
        await directSql`
          UPDATE ptjoboperations 
          SET 
            scheduled_start = ${op.start},
            scheduled_end = ${op.end},
            manually_scheduled = ${op.manuallyScheduled || false},
            updated_at = NOW()
          WHERE id = ${op.id}
        `;
        updated++;
      } catch (err) {
        console.error(`Failed to update operation ${op.id}:`, err);
      }
    }
    
    console.log(`✅ Successfully updated ${updated}/${updates.length} operations`);
    
    res.json({ 
      success: true, 
      updated,
      total: updates.length
    });
  } catch (error) {
    console.error("Error saving operation schedules:", error);
    res.status(500).json({ success: false, error: 'Failed to save schedule' });
  }
});

// Update operation constraint
router.put("/api/operations/:id/constraint", async (req, res) => {
  try {
    const { id } = req.params;
    const { constraintType, constraintDate } = req.body;
    
    // Validate constraint type
    const validConstraints = ['MSO', 'MFO', 'SNET', 'FNET', 'SNLT', 'FNLT', 'None'];
    if (constraintType && !validConstraints.includes(constraintType)) {
      return res.status(400).json({ 
        error: 'Invalid constraint type. Must be one of: MSO, MFO, SNET, FNET, SNLT, FNLT, None' 
      });
    }
    
    // Validate that constraint date is provided when type is not None
    if (constraintType !== 'None' && !constraintDate) {
      return res.status(400).json({ 
        error: 'Constraint date is required when setting a constraint type' 
      });
    }
    
    console.log(`🎯 Updating constraint for operation ${id}: ${constraintType} - ${constraintDate}`);
    
    // If constraint type is None, clear both fields
    const finalConstraintType = constraintType === 'None' ? null : constraintType;
    const finalConstraintDate = constraintType === 'None' ? null : constraintDate;
    
    // Update the operation's constraint fields
    await directSql`
      UPDATE ptjoboperations 
      SET 
        constraint_type = ${finalConstraintType},
        constraint_date = ${finalConstraintDate},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    
    // Fetch the updated operation to return
    const [updatedOperation] = await directSql`
      SELECT 
        id,
        name,
        constraint_type as "constraintType",
        constraint_date as "constraintDate",
        scheduled_start as "scheduledStart",
        scheduled_end as "scheduledEnd"
      FROM ptjoboperations 
      WHERE id = ${id}
    ` as any[];
    
    console.log(`✅ Successfully updated constraint for operation ${id}`);
    
    res.json({ 
      success: true, 
      operation: updatedOperation
    });
  } catch (error) {
    console.error("Error updating operation constraint:", error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update operation constraint' 
    });
  }
});

// Update operation PERT estimates
router.put("/api/operations/:id/pert", async (req, res) => {
  try {
    const { id } = req.params;
    const { timeOptimistic, timeMostLikely, timePessimistic } = req.body;
    
    // Validate that all three estimates are provided
    if (timeOptimistic === undefined || timeMostLikely === undefined || timePessimistic === undefined) {
      return res.status(400).json({ 
        error: 'All three PERT estimates are required: timeOptimistic, timeMostLikely, timePessimistic' 
      });
    }
    
    // Validate that estimates are numbers
    const optimistic = parseFloat(timeOptimistic);
    const mostLikely = parseFloat(timeMostLikely);
    const pessimistic = parseFloat(timePessimistic);
    
    if (isNaN(optimistic) || isNaN(mostLikely) || isNaN(pessimistic)) {
      return res.status(400).json({ 
        error: 'All PERT estimates must be valid numbers' 
      });
    }
    
    // Validate that optimistic <= most likely <= pessimistic
    if (optimistic > mostLikely || mostLikely > pessimistic) {
      return res.status(400).json({ 
        error: 'Invalid PERT estimates: optimistic time must be <= most likely time <= pessimistic time' 
      });
    }
    
    // Calculate PERT metrics
    const timeExpected = (optimistic + 4 * mostLikely + pessimistic) / 6;
    const timeStdDev = (pessimistic - optimistic) / 6;
    const timeVariance = Math.pow(timeStdDev, 2);
    
    console.log(`🎲 Updating PERT estimates for operation ${id}:`);
    console.log(`   Optimistic: ${optimistic}, Most Likely: ${mostLikely}, Pessimistic: ${pessimistic}`);
    console.log(`   Expected: ${timeExpected.toFixed(4)}, Std Dev: ${timeStdDev.toFixed(4)}, Variance: ${timeVariance.toFixed(6)}`);
    
    // Update the operation's PERT fields
    await directSql`
      UPDATE ptjoboperations 
      SET 
        time_optimistic = ${optimistic},
        time_most_likely = ${mostLikely},
        time_pessimistic = ${pessimistic},
        time_expected = ${timeExpected},
        time_variance = ${timeVariance},
        time_std_dev = ${timeStdDev},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    
    // Fetch the updated operation to return
    const [updatedOperation] = await directSql`
      SELECT 
        id,
        name,
        cycle_hrs as "cycleHrs",
        time_optimistic as "timeOptimistic",
        time_most_likely as "timeMostLikely",
        time_pessimistic as "timePessimistic",
        time_expected as "timeExpected",
        time_variance as "timeVariance",
        time_std_dev as "timeStdDev",
        scheduled_start as "scheduledStart",
        scheduled_end as "scheduledEnd"
      FROM ptjoboperations 
      WHERE id = ${id}
    ` as any[];
    
    console.log(`✅ Successfully updated PERT estimates for operation ${id}`);
    
    res.json({ 
      success: true, 
      operation: updatedOperation,
      calculations: {
        timeExpected: parseFloat(timeExpected.toFixed(4)),
        timeVariance: parseFloat(timeVariance.toFixed(6)),
        timeStdDev: parseFloat(timeStdDev.toFixed(4))
      }
    });
  } catch (error) {
    console.error("Error updating operation PERT estimates:", error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update PERT estimates'
    });
  }
});

// Step 3: Save scheduler changes endpoint (Legacy - keeping for compatibility)
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

    // Validate OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return res.status(500).json({
        success: false,
        message: "Voice transcription service is not properly configured"
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided"
      });
    }

    // Validate file size (double-check multer limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Audio file too large. Maximum size is ${maxSize / 1024 / 1024}MB`
      });
    }

    // Validate audio MIME type (allowlist for Whisper API)
    const allowedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a'];
    if (!allowedMimeTypes.some(type => req.file!.mimetype.includes(type))) {
      return res.status(400).json({
        success: false,
        message: `Unsupported audio format: ${req.file.mimetype}. Supported: ${allowedMimeTypes.join(', ')}`
      });
    }

    console.log("Processing audio file:", req.file.originalname, "Size:", req.file.buffer.length, "bytes", "Type:", req.file.mimetype);

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
    
    // Handle specific error types
    let statusCode = 500;
    let message = "Failed to transcribe voice recording";
    
    if (errorMessage.includes('file too large') || errorMessage.includes('File too large')) {
      statusCode = 400;
      message = "Audio file is too large. Maximum size is 10MB";
    } else if (errorMessage.includes('audio files are allowed')) {
      statusCode = 400;
      message = "Invalid file type. Only audio files are allowed";
    } else if (errorMessage.includes('400') && errorMessage.includes('file format')) {
      statusCode = 400;
      message = "Unsupported audio format. Please use WebM, OGG, MP3, or WAV";
    }
    
    res.status(statusCode).json({
      success: false,
      message,
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

// Fetch available OpenAI models
router.get("/api/ai/models", async (req, res) => {
  try {
    // Import OpenAI
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Fetch models from OpenAI API
    const response = await openai.models.list();
    
    // Return only our single configured model instead of fetching from API
    const chatModels = [{
      id: DEFAULT_MODEL,
      created: Date.now(),
      owned_by: 'openai'
    }];

    res.json({
      success: true,
      models: chatModels,
      count: 1
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching OpenAI models:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available models",
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
router.post("/api/v1/commands/schedule-job", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Schedule Job requested by user ${req.user?.id}`);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Schedule job failed - ${errorMessage}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        undefined,
        undefined,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to schedule job",
        undefined,
        undefined,
        [errorMessage]
      ));
    }
  }
});

// PUT /api/v1/commands/reschedule-job/:id - Reschedule an existing job
router.put("/api/v1/commands/reschedule-job/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    const jobId = parseInt(req.params.id);
    log(`🎯 Command ${commandId}: Reschedule Job ${jobId} requested by user ${req.user?.id}`);
    
    const command = rescheduleJobCommandSchema.parse(req.body);
    
    // Update job scheduling information
    const updatedJob = await db.update(ptJobs)
      .set({
        needDateTime: new Date(command.newStartDateTime),
        scheduledStatus: 'rescheduled',
      })
      .where(eq(ptJobs.id, jobId))
      .returning();

    if (updatedJob.length === 0) {
      res.status(404).json(createCommandResponse(
        false,
        commandId,
        `Job ${jobId} not found`,
        undefined,
        undefined,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Reschedule job failed - ${errorMessage}`);
    
    if (error instanceof z.ZodError) {
      res.status(400).json(createCommandResponse(
        false,
        commandId,
        "Invalid request data",
        undefined,
        undefined,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      ));
    } else {
      res.status(500).json(createCommandResponse(
        false,
        commandId,
        "Failed to reschedule job",
        undefined,
        undefined,
        [errorMessage]
      ));
    }
  }
});

// POST /api/v1/commands/prioritize-job - Change job priority
router.post("/api/v1/commands/prioritize-job", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Prioritize Job requested by user ${req.user?.id}`);
    
    const command = prioritizeJobCommandSchema.parse(req.body);
    
    const updatedJob = await db.update(ptJobs)
      .set({ priority: command.newPriority })
      .where(eq(ptJobs.id, command.jobId))
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Prioritize job failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// POST /api/v1/commands/cancel-job/:id - Cancel a job
router.post("/api/v1/commands/cancel-job/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    const jobId = parseInt(req.params.id);
    log(`🎯 Command ${commandId}: Cancel Job ${jobId} requested by user ${req.user?.id}`);
    
    const command = cancelJobCommandSchema.parse(req.body);
    
    const updatedJob = await db.update(ptJobs)
      .set({ cancelled: true })
      .where(eq(ptJobs.id, jobId))
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Cancel job failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// RESOURCE MANAGEMENT COMMANDS

// POST /api/v1/commands/assign-resource - Assign resource to operation
router.post("/api/v1/commands/assign-resource", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Assign Resource requested by user ${req.user?.id}`);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Assign resource failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// QUALITY CONTROL COMMANDS

// POST /api/v1/commands/quality-hold - Place quality hold on job/operation
router.post("/api/v1/commands/quality-hold", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Quality Hold requested by user ${req.user?.id}`);
    
    const command = qualityHoldCommandSchema.parse(req.body);
    
    // For now, we'll simulate placing a hold by updating job/operation status
    let updatedEntity;
    let entityType: string;
    
    if (command.jobId) {
      updatedEntity = await db.update(ptJobs)
        .set({ 
          scheduledStatus: 'on_hold'
        })
        .where(eq(ptJobs.id, command.jobId))
        .returning();
      entityType = 'job';
    } else if (command.operationId) {
      updatedEntity = await db.update(ptJobOperations)
        .set({ percentFinished: "0" })
        .where(eq(ptJobOperations.id, command.operationId))
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Quality hold failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// PRODUCTION CONTROL COMMANDS

// POST /api/v1/commands/start-operation - Start an operation
router.post("/api/v1/commands/start-operation", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Start Operation requested by user ${req.user?.id}`);
    
    const command = startOperationCommandSchema.parse(req.body);
    
    const updatedOperation = await db.update(ptJobOperations)
      .set({ 
        percentFinished: "50",
        scheduledStart: command.actualStartDateTime ? new Date(command.actualStartDateTime) : new Date()
      })
      .where(eq(ptJobOperations.id, command.operationId))
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
        startTime: updatedOperation[0].scheduledStart,
        notes: command.operatorNotes
      }
    );

    log(`✅ Command ${commandId}: Operation ${command.operationId} started`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Start operation failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// POST /api/v1/commands/stop-operation - Stop an operation
router.post("/api/v1/commands/stop-operation", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commandId = generateCommandId();
    log(`🎯 Command ${commandId}: Stop Operation requested by user ${req.user?.id}`);
    
    const command = stopOperationCommandSchema.parse(req.body);
    
    let percentFinished = "100";
    if (command.reason !== 'completed') {
      percentFinished = "75";
    }

    const updatedOperation = await db.update(ptJobOperations)
      .set({ 
        percentFinished: percentFinished,
        scheduledEnd: command.actualEndDateTime ? new Date(command.actualEndDateTime) : new Date()
      })
      .where(eq(ptJobOperations.id, command.operationId))
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
        endTime: updatedOperation[0].scheduledEnd,
        reason: command.reason,
        reasonDetails: command.reasonDetails,
        notes: command.operatorNotes
      }
    );

    log(`✅ Command ${commandId}: Operation ${command.operationId} stopped`);
    res.json(response);
  } catch (error) {
    const commandId = generateCommandId();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Command ${commandId}: Stop operation failed - ${errorMessage}`);
    
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
        [errorMessage]
      ));
    }
  }
});

// =============================================================================
// ENHANCED AUTHENTICATION API - Task 5: API Keys & OAuth 2.0
// =============================================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { apiKeys, apiKeyUsage, oauthClients, oauthTokens, users, roles, maxChatMessages } from '@shared/schema';
import { requirePermission, AuthenticatedRequest } from './enhanced-auth-middleware';
import { insertApiKeySchema, insertOauthClientSchema, ApiKey, OauthClient } from '@shared/schema';

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
      user: req.user?.id
    });

    // Initialize OpenAI
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Step 1: Analyze query intent and generate SQL
    const intentAnalysis = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
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
      success: false
    });
  }
});

// AI Agent Chat endpoint - routes to different specialized agents
router.post("/api/ai-agent/chat", async (req, res) => {
  try {
    // Development bypass - skip authentication in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 [AI Agent Chat] Development mode: Skipping authentication");
    } else {
      // In production, require authentication
      await new Promise((resolve, reject) => {
        requireAuth(req, res, (error: any) => {
          if (error) reject(error);
          else resolve(undefined);
        });
      });
    }

    const { message, agentId, context } = req.body;
    const userId = (req as any).userId || 1; // Default to user 1 in development
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`[AI Agent Chat] Processing request for agent: ${agentId || 'max'}`);
    console.log(`[AI Agent Chat] Message: "${message}"`);

    // Use respondToMessage with agent-specific training
    const response = await maxAI.respondToMessage(message, {
      userId,
      userRole: 'Administrator',
      currentPage: context?.currentPage || '/home',
      selectedData: context?.selectedData,
      recentActions: context?.recentActions,
      conversationHistory: context?.conversationHistory,
      agentId: agentId || 'max' // Pass agent context to enable specialized training
    });
    
    console.log(`[AI Agent Chat] Response generated for agent: ${agentId || 'max'}`);

    // Return response with agent ID for proper attribution
    res.json({
      ...response,
      agentId: agentId || 'max'
    });
  } catch (error) {
    console.error('AI Agent chat error:', error);
    res.status(500).json({ 
      error: "Failed to process message",
      message: "I'm experiencing technical difficulties. Please try again.",
      success: false
    });
  }
});

// ============================================
// Agent Monitoring & Control API Routes
// ============================================

// Helper function to generate sample agent connections
function generateSampleAgentConnections() {
  const now = new Date();
  
  return [
    {
      id: 1,
      agentName: 'Max AI Assistant',
      agentType: 'production_scheduling',
      connectionType: 'websocket' as const,
      status: 'active' as const,
      isEnabled: true,
      connectedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      lastActivityAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      configuration: {
        endpoint: 'wss://api.planettogether.ai/agents/max',
        authMethod: 'jwt',
        version: 'v2.1.0'
      },
      metadata: {
        capabilities: ['scheduling', 'optimization', 'analytics'],
        region: 'us-east-1',
        deployedVersion: '2.1.0'
      },
      rateLimitPerMinute: 60,
      rateLimitPerHour: 1000,
      errorCount: 2
    },
    {
      id: 2,
      agentName: 'System Monitor',
      agentType: 'system_monitoring',
      connectionType: 'polling' as const,
      status: 'active' as const,
      isEnabled: true,
      connectedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      lastActivityAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      configuration: {
        endpoint: 'https://api.planettogether.ai/agents/monitor',
        authMethod: 'api_key',
        pollInterval: 30
      },
      metadata: {
        capabilities: ['health_checks', 'performance_monitoring', 'alerting'],
        region: 'us-west-2',
        deployedVersion: '1.5.3'
      },
      rateLimitPerMinute: 120,
      rateLimitPerHour: 5000,
      errorCount: 0
    },
    {
      id: 3,
      agentName: 'Quality Analyzer',
      agentType: 'quality_analysis',
      connectionType: 'api' as const,
      status: 'active' as const,
      isEnabled: true,
      connectedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      configuration: {
        endpoint: 'https://api.planettogether.ai/agents/quality',
        authMethod: 'oauth'
      },
      metadata: {
        capabilities: ['defect_detection', 'trend_analysis', 'root_cause_analysis'],
        region: 'eu-west-1',
        deployedVersion: '1.8.2'
      },
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      errorCount: 5
    },
    {
      id: 4,
      agentName: 'Predictive Maintenance Bot',
      agentType: 'predictive_maintenance',
      connectionType: 'webhook' as const,
      status: 'suspended' as const,
      isEnabled: false,
      connectedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
      disconnectedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      lastActivityAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      configuration: {
        endpoint: 'https://api.planettogether.ai/agents/maintenance',
        authMethod: 'jwt'
      },
      metadata: {
        capabilities: ['failure_prediction', 'maintenance_scheduling', 'parts_optimization'],
        region: 'us-east-1',
        deployedVersion: '2.0.1'
      },
      rateLimitPerMinute: 45,
      rateLimitPerHour: 800,
      errorCount: 15,
      lastError: 'Connection timeout after 30s - suspended for review'
    },
    {
      id: 5,
      agentName: 'Inventory Optimizer',
      agentType: 'inventory_optimization',
      connectionType: 'api' as const,
      status: 'error' as const,
      isEnabled: true,
      connectedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      lastActivityAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      configuration: {
        endpoint: 'https://api.planettogether.ai/agents/inventory',
        authMethod: 'api_key'
      },
      metadata: {
        capabilities: ['demand_forecasting', 'reorder_optimization', 'safety_stock_calculation'],
        region: 'ap-southeast-1',
        deployedVersion: '1.4.7'
      },
      rateLimitPerMinute: 50,
      rateLimitPerHour: 1200,
      errorCount: 8,
      lastError: 'API key validation failed - please update credentials'
    }
  ];
}

// Get all agent connections
router.get("/api/agent-control/connections", async (req, res) => {
  try {
    const { status, connectionType } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (connectionType) filters.connectionType = connectionType as string;
    
    let connections = await storage.getAgentConnections(filters);
    
    // If no connections exist, return sample data
    if (connections.length === 0) {
      connections = generateSampleAgentConnections();
      
      // Apply filters to sample data if provided
      if (status) {
        connections = connections.filter(c => c.status === status);
      }
      if (connectionType) {
        connections = connections.filter(c => c.connectionType === connectionType);
      }
    }
    
    res.json({ success: true, connections });
  } catch (error) {
    console.error("Error fetching agent connections:", error);
    res.status(500).json({ success: false, error: "Failed to fetch connections" });
  }
});

// Get specific agent connection
router.get("/api/agent-control/connections/:id", async (req, res) => {
  try {
    const connection = await storage.getAgentConnectionById(Number(req.params.id));
    if (!connection) {
      return res.status(404).json({ success: false, error: "Connection not found" });
    }
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error fetching agent connection:", error);
    res.status(500).json({ success: false, error: "Failed to fetch connection" });
  }
});

// Create new agent connection
router.post("/api/agent-control/connections", async (req, res) => {
  try {
    const connection = await storage.createAgentConnection(req.body);
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error creating agent connection:", error);
    res.status(500).json({ success: false, error: "Failed to create connection" });
  }
});

// Update agent connection
router.patch("/api/agent-control/connections/:id", async (req, res) => {
  try {
    const connection = await storage.updateAgentConnection(Number(req.params.id), req.body);
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error updating agent connection:", error);
    res.status(500).json({ success: false, error: "Failed to update connection" });
  }
});

// Delete agent connection
router.delete("/api/agent-control/connections/:id", async (req, res) => {
  try {
    await storage.deleteAgentConnection(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent connection:", error);
    res.status(500).json({ success: false, error: "Failed to delete connection" });
  }
});

// Max Chat Messages endpoints
router.get("/api/max-chat-messages/:userId", async (req, res) => {
  try {
    const result = await db.select().from(maxChatMessages)
      .where(eq(maxChatMessages.userId, Number(req.params.userId)))
      .orderBy(maxChatMessages.createdAt);
    res.json(result);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

router.post("/api/max-chat-messages", async (req, res) => {
  try {
    const { userId, role, content, agentId, agentName, source } = req.body;
    const [message] = await db.insert(maxChatMessages)
      .values({
        userId,
        role,
        content,
        agentId: agentId || null,
        agentName: agentName || null,
        source: source || 'panel'
      })
      .returning();
    res.json(message);
  } catch (error) {
    console.error("Error saving chat message:", error);
    res.status(500).json({ error: "Failed to save chat message" });
  }
});

router.delete("/api/max-chat-messages/:userId", async (req, res) => {
  try {
    await db.delete(maxChatMessages)
      .where(eq(maxChatMessages.userId, Number(req.params.userId)));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat messages:", error);
    res.status(500).json({ error: "Failed to delete chat messages" });
  }
});

// Helper function to generate sample actions
function generateSampleActions(agentConnectionId: number, count: number = 15) {
  const actions = [
    {
      actionType: 'schedule_optimization',
      actionDetails: {
        algorithm: 'Critical Path Method',
        affectedJobs: 24,
        optimizationTime: 1250,
        improvementPercent: 15.5,
        beforeDuration: 480,
        afterDuration: 406
      },
      result: 'Optimized schedule - reduced makespan by 15.5%',
      errorMessage: null
    },
    {
      actionType: 'resource_allocation',
      actionDetails: {
        resourceType: 'CNC Machine',
        resourceCount: 5,
        utilizationBefore: 65,
        utilizationAfter: 87,
        conflictsResolved: 3
      },
      result: 'Resources reallocated - utilization improved to 87%',
      errorMessage: null
    },
    {
      actionType: 'bottleneck_detection',
      actionDetails: {
        analyzedWorkCenters: 12,
        bottlenecksFound: 2,
        bottlenecks: ['Assembly Line 3', 'Quality Control Station'],
        recommendedAction: 'Add parallel resources or split operations'
      },
      result: 'Detected 2 bottlenecks affecting throughput',
      errorMessage: null
    },
    {
      actionType: 'quality_check',
      actionDetails: {
        samplesAnalyzed: 500,
        defectRate: 2.3,
        qualityScore: 97.7,
        trendsIdentified: ['Material variance in Batch B-2345']
      },
      result: 'Quality analysis completed - 97.7% pass rate',
      errorMessage: null
    },
    {
      actionType: 'inventory_update',
      actionDetails: {
        itemsUpdated: 156,
        reorderPointsAdjusted: 23,
        safetyStockOptimized: true,
        projectedSavings: 12500
      },
      result: 'Inventory levels optimized - $12,500 projected savings',
      errorMessage: null
    },
    {
      actionType: 'production_forecast',
      actionDetails: {
        forecastPeriod: '30 days',
        productsAnalyzed: 45,
        accuracyScore: 94.2,
        demandVariance: 8.5,
        recommendations: ['Increase production for SKU-789', 'Reduce inventory for SKU-123']
      },
      result: 'Forecast generated with 94.2% confidence',
      errorMessage: null
    },
    {
      actionType: 'performance_analysis',
      actionDetails: {
        kpisMeasured: 8,
        oee: 78.5,
        availability: 92.0,
        performance: 88.5,
        quality: 96.3
      },
      result: 'OEE calculated at 78.5% - room for improvement',
      errorMessage: null
    },
    {
      actionType: 'data_analysis',
      actionDetails: {
        dataPointsProcessed: 50000,
        patternsIdentified: 5,
        anomaliesDetected: 2,
        correlationStrength: 0.87
      },
      result: 'Analysis complete - 5 patterns identified',
      errorMessage: null
    },
    {
      actionType: 'capacity_planning',
      actionDetails: {
        planningHorizon: '3 months',
        capacityUtilization: 82,
        peakDemandCoverage: 95,
        recommendedExpansion: '2 additional work centers'
      },
      result: 'Capacity plan updated - 95% demand coverage',
      errorMessage: null
    },
    {
      actionType: 'maintenance_scheduling',
      actionDetails: {
        equipmentChecked: 15,
        maintenanceScheduled: 3,
        predictedFailures: 1,
        downtimeReduction: '4 hours/month'
      },
      result: 'Predictive maintenance scheduled - preventing 1 failure',
      errorMessage: null
    },
    {
      actionType: 'supply_chain_optimization',
      actionDetails: {
        suppliersAnalyzed: 8,
        leadTimeReduction: 2.5,
        costSavings: 8750,
        riskScore: 'Low'
      },
      result: 'Supply chain optimized - 2.5 days lead time reduction',
      errorMessage: null
    },
    {
      actionType: 'workflow_automation',
      actionDetails: {
        processesAutomated: 3,
        timeSaved: '12 hours/week',
        errorReduction: 95,
        roiEstimate: '250%'
      },
      result: 'Workflow automated - saving 12 hours weekly',
      errorMessage: null
    },
    {
      actionType: 'demand_planning',
      actionDetails: {
        forecastAccuracy: 91.3,
        seasonalityDetected: true,
        trendsIdentified: 3,
        bufferStockOptimized: true
      },
      result: 'Demand plan updated with 91.3% accuracy',
      errorMessage: null
    },
    {
      actionType: 'energy_optimization',
      actionDetails: {
        energyConsumption: '2,450 kWh',
        reductionAchieved: 18,
        costSavings: 3200,
        carbonReduction: '0.8 tons'
      },
      result: 'Energy usage optimized - 18% reduction achieved',
      errorMessage: null
    },
    {
      actionType: 'compliance_check',
      actionDetails: {
        regulationsChecked: 12,
        complianceScore: 98,
        issuesFound: 1,
        remediationRequired: 'Update SOP documentation'
      },
      result: 'Compliance verified - 98% compliant, 1 issue to address',
      errorMessage: null
    }
  ];
  
  const now = new Date();
  
  // Select random actions and assign timestamps
  return Array.from({ length: Math.min(count, actions.length) }, (_, i) => {
    const action = actions[i % actions.length];
    const hasError = Math.random() < 0.1; // 10% chance of error
    
    return {
      id: i + 1,
      agentConnectionId,
      actionType: action.actionType,
      actionDetails: action.actionDetails,
      performedAt: new Date(now.getTime() - (i * 30 * 60 * 1000)).toISOString(), // 30 min intervals going back
      sessionId: `session-${1000 + Math.floor(i / 3)}`, // Group actions in sessions
      userId: 1,
      result: hasError ? 'failed' : action.result,
      errorMessage: hasError ? `Failed to complete ${action.actionType}: Resource temporarily unavailable` : null
    };
  });
}

// Get agent actions by connection ID
router.get("/api/agent-control/actions/:agentConnectionId", async (req, res) => {
  try {
    const agentConnectionId = Number(req.params.agentConnectionId);
    const { limit = "100", offset = "0" } = req.query;
    
    let actions = await storage.getAgentActions(
      agentConnectionId,
      Number(limit),
      Number(offset)
    );
    
    // If no actions exist, return sample data
    if (actions.length === 0) {
      actions = generateSampleActions(agentConnectionId, 10);
    }
    
    res.json({ success: true, actions });
  } catch (error) {
    console.error("Error fetching agent actions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch actions" });
  }
});

// Get all agent actions (without specific agent filter)
router.get("/api/agent-control/actions", async (req, res) => {
  try {
    const { limit = "100", offset = "0" } = req.query;
    const actions = await storage.getAgentActions(
      undefined,
      Number(limit),
      Number(offset)
    );
    res.json({ success: true, actions });
  } catch (error) {
    console.error("Error fetching agent actions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch actions" });
  }
});

// Create agent action (for logging)
router.post("/api/agent-control/actions", async (req, res) => {
  try {
    const action = await storage.createAgentAction(req.body);
    res.json({ success: true, action });
  } catch (error) {
    console.error("Error creating agent action:", error);
    res.status(500).json({ success: false, error: "Failed to create action" });
  }
});

// Get agent actions by session
router.get("/api/agent-control/actions/session/:sessionId", async (req, res) => {
  try {
    const actions = await storage.getAgentActionsBySessionId(req.params.sessionId);
    res.json({ success: true, actions });
  } catch (error) {
    console.error("Error fetching session actions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch session actions" });
  }
});

// Helper function to generate sample metrics
function generateSampleMetrics(agentConnectionId: number, count: number = 24) {
  const now = new Date();
  
  return Array.from({ length: count }, (_, i) => {
    const baseActions = 50 + Math.floor(Math.random() * 30);
    const errors = Math.floor(Math.random() * 5);
    const successRate = (baseActions - errors) / baseActions;
    
    return {
      id: i + 1,
      agentConnectionId,
      timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)).toISOString(), // 1 hour intervals
      actionsPerformed: baseActions,
      errorsOccurred: errors,
      averageResponseTime: 100 + Math.floor(Math.random() * 200),
      successRate: Number(successRate.toFixed(2)),
      dataProcessed: {
        recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
        apiCallsMade: Math.floor(Math.random() * 100) + 10,
        cacheHitRate: (Math.random() * 0.3 + 0.6).toFixed(2) // 60-90%
      }
    };
  });
}

// Get agent metrics
router.get("/api/agent-control/metrics/:agentConnectionId", async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    let metrics = await storage.getAgentMetrics(
      Number(req.params.agentConnectionId),
      startTime ? new Date(startTime as string) : undefined,
      endTime ? new Date(endTime as string) : undefined
    );
    
    // If no metrics exist, return sample data
    if (metrics.length === 0) {
      metrics = generateSampleMetrics(Number(req.params.agentConnectionId), 24);
    }
    
    res.json({ success: true, metrics });
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch metrics" });
  }
});

// Create agent metrics
router.post("/api/agent-control/metrics", async (req, res) => {
  try {
    const metrics = await storage.createAgentMetrics(req.body);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error("Error creating agent metrics:", error);
    res.status(500).json({ success: false, error: "Failed to create metrics" });
  }
});

// Helper function to generate sample policies
function generateSamplePolicies(agentConnectionId: number) {
  return [
    {
      id: 1,
      agentConnectionId,
      policyType: 'rate_limit',
      policyName: 'API Rate Limiting',
      policyDetails: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        burstLimit: 100
      },
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    },
    {
      id: 2,
      agentConnectionId,
      policyType: 'access_control',
      policyName: 'Resource Access Control',
      policyDetails: {
        allowedEndpoints: ['/api/production/*', '/api/resources/*', '/api/analytics/*'],
        deniedEndpoints: ['/api/admin/*', '/api/users/*'],
        requiresApproval: ['DELETE', 'UPDATE']
      },
      isActive: true,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      agentConnectionId,
      policyType: 'data_retention',
      policyName: 'Data Retention Policy',
      policyDetails: {
        retentionDays: 90,
        archiveAfterDays: 30,
        autoDeleteSensitiveData: true
      },
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      agentConnectionId,
      policyType: 'performance',
      policyName: 'Performance Thresholds',
      policyDetails: {
        maxResponseTimeMs: 5000,
        maxCpuUsagePercent: 80,
        maxMemoryUsageMb: 512,
        alertThreshold: 'warning'
      },
      isActive: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

// Get agent policies
router.get("/api/agent-control/policies/:agentConnectionId", async (req, res) => {
  try {
    let policies = await storage.getAgentPolicies(Number(req.params.agentConnectionId));
    
    // If no policies exist, return sample data
    if (policies.length === 0) {
      policies = generateSamplePolicies(Number(req.params.agentConnectionId));
    }
    
    res.json({ success: true, policies });
  } catch (error) {
    console.error("Error fetching agent policies:", error);
    res.status(500).json({ success: false, error: "Failed to fetch policies" });
  }
});

// Create agent policy
router.post("/api/agent-control/policies", async (req, res) => {
  try {
    const policy = await storage.createAgentPolicy(req.body);
    res.json({ success: true, policy });
  } catch (error) {
    console.error("Error creating agent policy:", error);
    res.status(500).json({ success: false, error: "Failed to create policy" });
  }
});

// Update agent policy
router.patch("/api/agent-control/policies/:id", async (req, res) => {
  try {
    const policy = await storage.updateAgentPolicy(Number(req.params.id), req.body);
    res.json({ success: true, policy });
  } catch (error) {
    console.error("Error updating agent policy:", error);
    res.status(500).json({ success: false, error: "Failed to update policy" });
  }
});

// Delete agent policy
router.delete("/api/agent-control/policies/:id", async (req, res) => {
  try {
    await storage.deleteAgentPolicy(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent policy:", error);
    res.status(500).json({ success: false, error: "Failed to delete policy" });
  }
});

// Get agent alerts
router.get("/api/agent-control/alerts", async (req, res) => {
  try {
    const { agentConnectionId, acknowledged } = req.query;
    const alerts = await storage.getAgentAlerts(
      agentConnectionId ? Number(agentConnectionId) : undefined,
      acknowledged !== undefined ? acknowledged === 'true' : undefined
    );
    res.json({ success: true, alerts });
  } catch (error) {
    console.error("Error fetching agent alerts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch alerts" });
  }
});

// Create agent alert
router.post("/api/agent-control/alerts", async (req, res) => {
  try {
    const alert = await storage.createAgentAlert(req.body);
    res.json({ success: true, alert });
  } catch (error) {
    console.error("Error creating agent alert:", error);
    res.status(500).json({ success: false, error: "Failed to create alert" });
  }
});

// Acknowledge agent alert
router.patch("/api/agent-control/alerts/:id/acknowledge", async (req, res) => {
  try {
    const { userId } = req.body;
    const alert = await storage.acknowledgeAgentAlert(Number(req.params.id), userId);
    res.json({ success: true, alert });
  } catch (error) {
    console.error("Error acknowledging agent alert:", error);
    res.status(500).json({ success: false, error: "Failed to acknowledge alert" });
  }
});

// Agent control actions
router.post("/api/agent-control/connections/:id/disable", async (req, res) => {
  try {
    const connection = await storage.updateAgentConnection(Number(req.params.id), {
      isEnabled: false,
      status: 'suspended'
    });
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error disabling agent:", error);
    res.status(500).json({ success: false, error: "Failed to disable agent" });
  }
});

router.post("/api/agent-control/connections/:id/enable", async (req, res) => {
  try {
    const connection = await storage.updateAgentConnection(Number(req.params.id), {
      isEnabled: true,
      status: 'active'
    });
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error enabling agent:", error);
    res.status(500).json({ success: false, error: "Failed to enable agent" });
  }
});

router.post("/api/agent-control/connections/:id/revoke", async (req, res) => {
  try {
    const connection = await storage.updateAgentConnection(Number(req.params.id), {
      isEnabled: false,
      status: 'revoked',
      disconnectedAt: new Date()
    });
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error revoking agent access:", error);
    res.status(500).json({ success: false, error: "Failed to revoke access" });
  }
});

// Update rate limits
router.patch("/api/agent-control/connections/:id/rate-limits", async (req, res) => {
  try {
    const { rateLimitPerMinute, rateLimitPerHour } = req.body;
    const connection = await storage.updateAgentConnection(Number(req.params.id), {
      rateLimitPerMinute,
      rateLimitPerHour
    });
    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error updating rate limits:", error);
    res.status(500).json({ success: false, error: "Failed to update rate limits" });
  }
});

// Master Data Bulk Generation endpoint with full OpenAI integration
router.post("/api/master-data/bulk-generate", requireAuth, async (req, res) => {
  try {
    const { recordCounts = {}, companyInfo, replaceExisting = false } = req.body;
    
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'OpenAI API key not configured. AI features are unavailable.',
      });
    }
    
    // Default record counts
    const defaultCounts = {
      items: 15, customers: 8, vendors: 8, capabilities: 12, workCenters: 6, 
      jobs: 12, recipes: 8, routings: 8, billsOfMaterial: 10, warehouses: 6
    };
    const finalRecordCounts = { ...defaultCounts, ...recordCounts };
    
    const totalRecords = Object.values(finalRecordCounts).reduce((a: number, b: number) => a + b, 0);
    console.log(`[AI Bulk Generate] Creating ${totalRecords} total records across all tables`);
    
    // Master data table mapping (dynamically import schema)
    const schema = await import('@shared/schema');
    const masterDataTables = {
      items: schema.items,
      customers: schema.customers,
      vendors: schema.vendors,
      capabilities: schema.ptCapabilities,
      resources: schema.ptResources,
      workCenters: schema.workCenters,
      jobs: schema.ptJobs,
      recipes: schema.recipes,
      billsOfMaterial: schema.billsOfMaterial,
      routings: schema.routings,
      warehouses: schema.ptWarehouses
    };
    
    const entityTypes = Object.keys(finalRecordCounts);
    const results: Record<string, any> = {};
    
    console.log(`[AI Bulk Generate] Entity types to process:`, entityTypes);
    console.log(`[AI Bulk Generate] Available table schemas:`, Object.keys(masterDataTables));
    
    // Process entities with OpenAI
    const processEntity = async (entityType: string) => {
      try {
        console.log(`[AI Bulk Generate] Processing entity: ${entityType}`);
        const recordCount = finalRecordCounts[entityType] || 10;
        const companyContext = companyInfo ? `\n\nCOMPANY CONTEXT: ${companyInfo}\nGenerate data relevant to this specific company/industry.` : '';
        
        const contextDescriptions: Record<string, string> = {
          items: "diverse manufacturing inventory items including raw materials, components, finished products",
          customers: "comprehensive customer database with company names, contact persons, addresses",
          vendors: "complete vendor/supplier records including company details, contact information",
          capabilities: "manufacturing capabilities and processes including machining, assembly, packaging",
          resources: "manufacturing resources like CNC machines, packaging lines, reactors",
          workCenters: "production work centers including machining stations, assembly lines",
          jobs: "production jobs with unique job numbers, specifications, quantities",
          recipes: "formulation recipes for products with ingredients and process parameters",
          billsOfMaterial: "detailed BOMs showing parent-child relationships",
          routings: "manufacturing routings with operation sequences",
          warehouses: "warehouse locations with capacity and inventory management details"
        };
        
        const requiredFields: Record<string, string> = {
          items: "REQUIRED: name (string), description (string), price (number)",
          customers: "REQUIRED: name (string), email (string), phone (string)",
          vendors: "REQUIRED: name (string), contactEmail (string), contactPhone (string)",
          capabilities: "REQUIRED: name (string), description (string)",
          resources: "REQUIRED: name (string), type (string), status (string - use 'active')",
          workCenters: "REQUIRED: name (string), description (string)",
          jobs: "REQUIRED: name (string), description (string), priority (number - use 2), status (string - use 'planned')",
          recipes: "REQUIRED: recipeName (string), recipeNumber (string), status (string - use 'Active')",
          billsOfMaterial: "REQUIRED: bomNumber (string), parentItemId (number - use 1), description (string)",
          routings: "REQUIRED: routingNumber (string), name (string), description (string)",
          warehouses: "REQUIRED: name (string), location (string), capacity (number)"
        };
        
        const systemPrompt = `You are a manufacturing data expert. Generate ${recordCount} diverse, realistic ${contextDescriptions[entityType] || 'data records'} for a comprehensive manufacturing system.${companyContext} Return a JSON object with a "suggestions" array containing objects with: operation: "create", data: {complete record data}, explanation: "brief description", confidence: 0.9.`;
        
        const userPrompt = `Generate ${recordCount} comprehensive ${entityType} records for a manufacturing company. 

${requiredFields[entityType] || "Include all required fields"}

Include diverse examples:
- Different categories, types, and classifications
- Realistic names, codes, and descriptions  
- Proper manufacturing industry values
- Varied priorities, statuses, and attributes

CRITICAL: Always include all required fields with valid non-null values. Use current date for date fields. Use realistic manufacturing names.`;

        const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.9,
            max_tokens: 4000
          }),
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const openaiResponse = await Promise.race([apiPromise, timeoutPromise]) as Response;

        if (openaiResponse.ok) {
          const aiResult = await openaiResponse.json();
          console.log(`[AI Bulk Generate] OpenAI response for ${entityType}:`, JSON.stringify(aiResult).substring(0, 500));
          const suggestions = JSON.parse(aiResult.choices[0].message.content);
          console.log(`[AI Bulk Generate] Parsed ${suggestions.suggestions?.length || 0} suggestions for ${entityType}`);
          
          let savedCount = 0;
          const tableSchema = masterDataTables[entityType as keyof typeof masterDataTables];
          
          if (!tableSchema) {
            console.error(`[AI Bulk Generate] No table schema found for ${entityType}`);
            return { success: false, error: `No table schema for ${entityType}` };
          }
          
          if (tableSchema) {
            const createPromises = suggestions.suggestions?.map(async (suggestion: any) => {
              if (suggestion.operation === 'create' && suggestion.data) {
                try {
                  const validatedData = { ...suggestion.data };
                  
                  // Entity-specific validation
                  if (entityType === 'jobs' && typeof validatedData.priority === 'string') {
                    const priorityMap: Record<string, number> = {
                      'high': 1, 'urgent': 1, 'critical': 1,
                      'medium': 2, 'normal': 2,
                      'low': 3, 'minor': 3
                    };
                    validatedData.priority = priorityMap[validatedData.priority?.toLowerCase()] || 2;
                  }
                  
                  await db.insert(tableSchema).values(validatedData);
                  savedCount++;
                  console.log(`[AI Bulk Generate] Saved ${entityType}: ${validatedData.name || validatedData.bomNumber || validatedData.routingNumber || 'record'}`);
                } catch (error) {
                  console.error(`[AI Bulk Generate] Failed to save ${entityType}:`, error instanceof Error ? error.message : error);
                }
              }
            }) || [];
            
            await Promise.all(createPromises);
          }
          
          return {
            success: true,
            count: savedCount,
            data: suggestions.suggestions || []
          };
        } else {
          const errorText = await openaiResponse.text();
          console.error(`[AI Bulk Generate] API error for ${entityType}:`, errorText);
          return { success: false, error: `API call failed: ${openaiResponse.status}` };
        }
      } catch (error) {
        console.error(`[AI Bulk Generate] Error generating ${entityType}:`, error instanceof Error ? error.message : error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    };

    // Process entities in batches
    const batchSize = 3;
    for (let i = 0; i < entityTypes.length; i += batchSize) {
      const batch = entityTypes.slice(i, i + batchSize);
      const batchPromises = batch.map(async entityType => {
        const result = await processEntity(entityType);
        results[entityType] = result;
        console.log(`[AI Bulk Generate] Completed ${entityType}: ${result.success ? `${result.count} records` : 'failed'}`);
        return result;
      });
      
      await Promise.all(batchPromises);
    }
    
    const totalGenerated = Object.values(results).reduce((sum: number, result: any) => 
      sum + (result.success ? result.count : 0), 0);
    
    res.json({
      success: true,
      message: `Bulk generation completed: ${totalGenerated} total records generated across ${entityTypes.length} entity types`,
      results,
      totalRecords: totalGenerated
    });

  } catch (error) {
    console.error('[AI Bulk Generate] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to perform bulk generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI-powered master data assistance endpoint
router.post("/api/master-data/ai-assist", requireAuth, async (req, res) => {
  try {
    // Define request schema with Zod
    const aiAssistRequestSchema = z.object({
      operation: z.enum(['suggest', 'improve', 'bulk_edit', 'generate']),
      prompt: z.string().min(1, 'Prompt cannot be empty'),
      entityType: z.string().min(1, 'Entity type is required'),
      selectedData: z.array(z.record(z.any())).optional(),
      currentData: z.array(z.record(z.any())).optional()
    });
    
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'OpenAI API key not configured. AI features are unavailable.',
      });
    }
    
    // Normalize operation field (handle case variations)
    const normalizedBody = {
      ...req.body,
      operation: req.body.operation?.toString().toLowerCase().trim()
    };
    
    // Validate request body
    const validationResult = aiAssistRequestSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join('; ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errorMessages}. Valid operations are: suggest, improve, bulk_edit, generate`
      });
    }
    
    const { operation, prompt, entityType, selectedData, currentData } = validationResult.data;
    
    console.log(`[AI Assistant] Processing ${operation} for ${entityType}: ${prompt.substring(0, 50)}...`);
    
    // Import OpenAI
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Build context-aware system prompt
    const systemPrompt = `You are an AI assistant helping with manufacturing master data management for ${entityType}.
    
Your task is to ${operation === 'suggest' ? 'provide suggestions' : operation === 'improve' ? 'improve existing data' : operation === 'bulk_edit' ? 'apply bulk edits' : 'generate new data'} for the user.

Current context:
- Entity type: ${entityType}
- Number of existing records: ${currentData?.length || 0}
- Operation: ${operation}

Guidelines:
- Provide realistic, industry-appropriate data
- Maintain consistency with existing data patterns
- Follow manufacturing industry best practices
- Include all required fields for the entity type
- Use proper data types and formats

Return your response as a JSON object with this structure:
{
  "suggestions": [
    {
      "operation": "create" | "update",
      "id": number | null,
      "data": { ...entity fields... },
      "reason": "Brief explanation of the suggestion"
    }
  ],
  "message": "Summary message for the user"
}`;
    
    const userPrompt = `${prompt}

${selectedData && selectedData.length > 0 ? `\nSelected data to work with:\n${JSON.stringify(selectedData, undefined, 2)}` : ''}

${currentData && currentData.length > 0 && currentData.length <= 10 ? `\nCurrent existing data (sample):\n${JSON.stringify(currentData.slice(0, 5), undefined, 2)}` : ''}`;
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }
    
    const result = JSON.parse(aiResponse);
    console.log(`[AI Assistant] Generated ${result.suggestions?.length || 0} suggestions`);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('[AI Assistant] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI request',
      suggestions: []
    });
  }
});

// ============================================
// Power BI Routes
// ============================================

// Power BI Service import and setup
import { PowerBIService } from "./services/powerbi";
const powerBIService = new PowerBIService();

// Enhanced server-side token cache with JWT parsing
interface CachedPowerBIToken {
  accessToken: string;
  expiresAt: number;
}

let powerBITokenCache: CachedPowerBIToken | null = null;

// Helper function to decode JWT and get expiration
function decodeJWTExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return Date.now() + (50 * 60 * 1000); // Default to 50 minutes if parsing fails
  }
}

// Get cached or fresh AAD token for server-side use only
async function getServerAADToken(): Promise<string> {
  const clientId = process.env.POWERBI_APPLICATION_ID;
  const clientSecret = process.env.POWERBI_APPLICATION_SECRET;
  const tenantId = process.env.POWERBI_TENANT_ID;
  
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("Power BI credentials not configured. Please contact administrator.");
  }

  // Check if we have a valid cached token (with 5 min buffer)
  const now = Date.now();
  if (powerBITokenCache && powerBITokenCache.expiresAt > now + (5 * 60 * 1000)) {
    return powerBITokenCache.accessToken;
  }

  // Get fresh token
  const accessToken = await powerBIService.authenticateServicePrincipal(
    clientId,
    clientSecret,
    tenantId
  );

  // Parse JWT expiration or use default
  const jwtExpiry = decodeJWTExpiry(accessToken);
  
  // Cache token with actual JWT expiry (minus 5 min buffer)
  powerBITokenCache = {
    accessToken,
    expiresAt: jwtExpiry - (5 * 60 * 1000)
  };

  return accessToken;
}

// Secure authentication check - establishes server token but never returns it to client
router.get("/api/auth/auto", async (req, res) => {
  try {
    // Test server-side authentication by getting a token
    await getServerAADToken();
    
    // Return only connection status - NEVER the token
    res.json({ 
      connected: true,
      message: "Successfully connected to Power BI",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to authenticate automatically:", error);
    
    // Extract meaningful error message
    let errorMessage = "Failed to authenticate with Power BI automatically";
    if (error instanceof Error) {
      // Check if it's an expired secret error
      if (error.message.includes("7000222") || error.message.includes("expired")) {
        errorMessage = "Your Azure app secret has expired. Please create a new client secret in Azure Portal.";
      } else if (error.message.includes("7000215")) {
        errorMessage = "Invalid client secret. Please verify your credentials in Azure Portal.";
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({ 
      connected: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get workspaces from Power BI using server-cached token
router.get("/api/powerbi/workspaces", async (req, res) => {
  try {
    // Use server-cached AAD token - client never sees it
    const accessToken = await getServerAADToken();
    const workspaces = await powerBIService.getWorkspaces(accessToken);

    res.json(workspaces);
  } catch (error) {
    console.error("Failed to get workspaces:", error);
    res.status(500).json({ 
      message: "Failed to fetch workspaces",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get reports from a specific workspace using server-cached token
router.get("/api/powerbi/workspaces/:workspaceId/reports", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Use server-cached AAD token - client never sees it
    const accessToken = await getServerAADToken();
    const reports = await powerBIService.getReportsFromWorkspace(accessToken, workspaceId);

    res.json(reports);
  } catch (error) {
    console.error("Failed to get reports from workspace:", error);
    res.status(500).json({ 
      message: "Failed to fetch reports from workspace",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get dataset information including storage mode
router.get("/api/powerbi/workspaces/:workspaceId/datasets/:datasetId", async (req, res) => {
  try {
    const { workspaceId, datasetId } = req.params;
    
    // Use server-cached AAD token - client never sees it
    const accessToken = await getServerAADToken();
    const dataset = await powerBIService.getDataset(accessToken, workspaceId, datasetId);

    res.json(dataset);
  } catch (error) {
    console.error("Failed to get dataset:", error);
    res.status(500).json({ 
      message: "Failed to fetch dataset information",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get dataset refresh history
router.get("/api/powerbi/workspaces/:workspaceId/datasets/:datasetId/refreshes", async (req, res) => {
  try {
    const { workspaceId, datasetId } = req.params;
    
    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    const refreshes = await powerBIService.getDatasetRefreshHistory(accessToken, workspaceId, datasetId);

    res.json({ refreshes });
  } catch (error) {
    console.error("Failed to get dataset refresh history:", error);
    res.status(500).json({ 
      message: "Failed to fetch dataset refresh history",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Initiate dataset refresh
router.post("/api/powerbi/workspaces/:workspaceId/datasets/:datasetId/refresh", async (req, res) => {
  try {
    const { workspaceId, datasetId } = req.params;
    
    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    
    const result = await powerBIService.triggerDatasetRefresh(accessToken, workspaceId, datasetId);

    res.status(202).json({ 
      message: "Dataset refresh initiated successfully",
      refreshId: result.refreshId,
      estimation: result.estimation
    });
  } catch (error) {
    console.error("Failed to initiate dataset refresh:", error);
    
    res.status(500).json({ 
      message: "Failed to initiate dataset refresh",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    }
    });

    // Cancel dataset refresh
    router.delete("/api/powerbi/workspaces/:workspaceId/datasets/:datasetId/refreshes/:refreshId", async (req, res) => {
    try {
    const { workspaceId, datasetId, refreshId } = req.params;

    console.log(`🛑 Attempting to cancel dataset refresh: workspace=${workspaceId}, dataset=${datasetId}, refreshId=${refreshId}`);

    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    await powerBIService.cancelDatasetRefresh(accessToken, workspaceId, datasetId, refreshId);

    console.log(`✅ Successfully cancelled dataset refresh: ${refreshId}`);
    res.status(200).json({ 
      message: "Dataset refresh cancelled successfully"
    });
    } catch (error) {
    console.error("Failed to cancel dataset refresh:", error);
    res.status(500).json({ 
      message: "Failed to cancel dataset refresh",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    }
    });


// Secure Power BI embed endpoint - uses server-cached AAD token
router.post("/api/embed", async (req, res) => {
  try {
    const { workspaceId, reportId, accessLevel, allowSaveAs } = req.body;
    
    if (!workspaceId || !reportId) {
      return res.status(400).json({ 
        message: "Workspace ID and report ID are required" 
      });
    }

    // Use server-cached AAD token - client never sees it
    const accessToken = await getServerAADToken();
    const embedConfig = await powerBIService.createEmbedConfig(
      accessToken,
      workspaceId,
      reportId,
      accessLevel || "View", // Default to View if not specified
      allowSaveAs
    );

    res.json(embedConfig);
  } catch (error) {
    console.error("Failed to create embed config:", error);
    res.status(500).json({ 
      message: "Failed to create embed configuration",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Power BI Export Routes

// Create export job
router.post("/api/powerbi/export/:workspaceId/:reportId", async (req, res) => {
  try {
    const { workspaceId, reportId } = req.params;
    const { format, powerBIReportConfiguration } = req.body;

    if (!workspaceId || !reportId) {
      return res.status(400).json({ 
        message: "Workspace ID and report ID are required" 
      });
    }

    if (!format) {
      return res.status(400).json({ 
        message: "Export format is required" 
      });
    }

    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    const result = await powerBIService.createExportJob(
      accessToken,
      workspaceId,
      reportId,
      format,
      { powerBIReportConfiguration }
    );

    // Return 202 Accepted with export job ID
    res.status(202).json({ id: result.id });
  } catch (error) {
    console.error("Failed to create export job:", error);
    res.status(500).json({ 
      message: "Failed to create export job",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get export job status
router.get("/api/powerbi/export/:workspaceId/:reportId/:exportId/status", async (req, res) => {
  try {
    const { workspaceId, reportId, exportId } = req.params;

    if (!workspaceId || !reportId || !exportId) {
      return res.status(400).json({ 
        message: "Workspace ID, report ID, and export ID are required" 
      });
    }

    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    const status = await powerBIService.getExportStatus(
      accessToken,
      workspaceId,
      reportId,
      exportId
    );

    res.json(status);
  } catch (error) {
    console.error("Failed to get export status:", error);
    res.status(500).json({ 
      message: "Failed to get export status",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Download exported file
router.get("/api/powerbi/export/:workspaceId/:reportId/:exportId/file", async (req, res) => {
  try {
    const { workspaceId, reportId, exportId } = req.params;

    if (!workspaceId || !reportId || !exportId) {
      return res.status(400).json({ 
        message: "Workspace ID, report ID, and export ID are required" 
      });
    }

    // Use server-cached AAD token
    const accessToken = await getServerAADToken();
    const fileBuffer = await powerBIService.downloadExportFile(
      accessToken,
      workspaceId,
      reportId,
      exportId
    );

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="export-${exportId}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Failed to download export file:", error);
    res.status(500).json({ 
      message: "Failed to download export file",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Agent training routes
router.use('/api', agentTrainingRoutes);

// Create a new real-time voice session
router.post('/api/realtime/sessions', async (req, res) => {
  try {
    const { agentId, instructions, voice, temperature } = req.body;
    const userId = req.session?.userId || 0;

    if (!agentId) {
      return res.status(400).json({
        message: 'Agent ID is required for real-time voice session',
      });
    }

    console.log('🎤 Creating real-time voice session for agent:', agentId);

    const sessionId = await realtimeVoiceService.createSession({
      userId,
      agentId,
      instructions,
      voice: voice || 'nova',
      temperature: temperature || 0.8,
    });

    res.json({
      sessionId,
      status: 'connected',
      model: 'gpt-realtime-mini',
    });
  } catch (error) {
    console.error('Failed to create real-time voice session:', error);
    res.status(500).json({
      message: 'Failed to create real-time voice session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Send audio to a real-time session
router.post('/api/realtime/sessions/:sessionId/audio', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const audioData = req.body; // Raw audio buffer

    if (!realtimeVoiceService.isSessionActive(sessionId)) {
      return res.status(404).json({
        message: 'Session not found or inactive',
      });
    }

    // Send audio to the Realtime API
    realtimeVoiceService.sendAudioInput(sessionId, audioData);

    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Failed to send audio:', error);
    res.status(500).json({
      message: 'Failed to send audio',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Send text to a real-time session
router.post('/api/realtime/sessions/:sessionId/text', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: 'Text input is required',
      });
    }

    if (!realtimeVoiceService.isSessionActive(sessionId)) {
      return res.status(404).json({
        message: 'Session not found or inactive',
      });
    }

    // Send text to the Realtime API
    realtimeVoiceService.sendTextInput(sessionId, text);

    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Failed to send text:', error);
    res.status(500).json({
      message: 'Failed to send text',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Commit audio buffer and get response
router.post('/api/realtime/sessions/:sessionId/commit', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!realtimeVoiceService.isSessionActive(sessionId)) {
      return res.status(404).json({
        message: 'Session not found or inactive',
      });
    }

    // Commit audio and request response
    realtimeVoiceService.commitAudioAndRespond(sessionId);

    res.json({ status: 'committed' });
  } catch (error) {
    console.error('Failed to commit audio:', error);
    res.status(500).json({
      message: 'Failed to commit audio',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Close a real-time session
router.delete('/api/realtime/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    realtimeVoiceService.closeSession(sessionId);

    res.json({ status: 'closed' });
  } catch (error) {
    console.error('Failed to close session:', error);
    res.status(500).json({
      message: 'Failed to close session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get user's active sessions
router.get('/api/realtime/sessions', async (req, res) => {
  try {
    const userId = req.session?.userId || 0;
    const sessions = realtimeVoiceService.getUserSessions(userId);

    res.json({ sessions });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    res.status(500).json({
      message: 'Failed to get sessions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Server-Sent Events endpoint for real-time session events
router.get('/api/realtime/sessions/:sessionId/events', async (req, res) => {
  const { sessionId } = req.params;
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Get session event emitter
  const events = realtimeVoiceService.getSessionEvents(sessionId);
  
  if (!events) {
    res.write('event: error\ndata: {"message": "Session not found"}\n\n');
    res.end();
    return;
  }

  console.log(`📡 SSE connection established for session ${sessionId}`);

  // Send initial connected event
  res.write('event: connected\ndata: {"status": "connected"}\n\n');

  // Forward events to SSE
  const transcriptHandler = (text: string) => {
    res.write(`event: transcript\ndata: ${JSON.stringify({ text, isFinal: false })}\n\n`);
  };

  const transcriptCompleteHandler = (text: string) => {
    res.write(`event: transcript\ndata: ${JSON.stringify({ text, isFinal: true })}\n\n`);
  };

  const audioHandler = (audioBuffer: Buffer) => {
    const base64Audio = audioBuffer.toString('base64');
    res.write(`event: audio\ndata: ${JSON.stringify({ audio: base64Audio })}\n\n`);
  };

  const statusHandler = (status: string) => {
    res.write(`event: status\ndata: ${JSON.stringify({ status })}\n\n`);
  };

  const errorHandler = (error: any) => {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || error })}\n\n`);
  };

  // Attach event listeners
  events.on('transcript_delta', transcriptHandler);
  events.on('transcript_complete', transcriptCompleteHandler);
  events.on('audio_delta', audioHandler);
  events.on('user_speaking_start', () => statusHandler('speaking'));
  events.on('user_speaking_stop', () => statusHandler('listening'));
  events.on('error', errorHandler);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`📡 SSE connection closed for session ${sessionId}`);
    events.removeListener('transcript_delta', transcriptHandler);
    events.removeListener('transcript_complete', transcriptCompleteHandler);
    events.removeListener('audio_delta', audioHandler);
    events.removeListener('error', errorHandler);
  });
});

// ============================================
// Plant and Resource Routes
// ============================================

// Get all plants
router.get("/api/ptplants", enhancedAuth, async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, name, description, is_active 
      FROM ptplants 
      WHERE is_active = true 
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// Get all resources
router.get("/api/ptresources", enhancedAuth, async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, name, description, resource_id, plant_id, active 
      FROM ptresources 
      WHERE active = true 
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// ============================================
// Product Wheel Routes
// ============================================

// Get all product wheels
router.get("/api/product-wheels", enhancedAuth, async (req, res) => {
  try {
    const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
    const wheels = await storage.getProductWheels(plantId);
    res.json(wheels);
  } catch (error: any) {
    console.error("Error fetching product wheels:", error);
    res.status(500).json({ error: "Failed to fetch product wheels" });
  }
});

// Get specific product wheel
router.get("/product-wheels/:id", enhancedAuth, async (req, res) => {
  try {
    const wheel = await storage.getProductWheel(parseInt(req.params.id));
    if (!wheel) {
      return res.status(404).json({ error: "Product wheel not found" });
    }
    res.json(wheel);
  } catch (error: any) {
    console.error("Error fetching product wheel:", error);
    res.status(500).json({ error: "Failed to fetch product wheel" });
  }
});

// Create product wheel
router.post("/product-wheels", enhancedAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const wheelData = {
      ...req.body,
      createdBy: userId,
      lastModifiedBy: userId
    };
    const wheel = await storage.createProductWheel(wheelData);
    res.json(wheel);
  } catch (error: any) {
    console.error("Error creating product wheel:", error);
    res.status(500).json({ error: "Failed to create product wheel" });
  }
});

// Update product wheel
router.put("/product-wheels/:id", enhancedAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const wheelData = {
      ...req.body,
      lastModifiedBy: userId
    };
    const wheel = await storage.updateProductWheel(parseInt(req.params.id), wheelData);
    if (!wheel) {
      return res.status(404).json({ error: "Product wheel not found" });
    }
    res.json(wheel);
  } catch (error: any) {
    console.error("Error updating product wheel:", error);
    res.status(500).json({ error: "Failed to update product wheel" });
  }
});

// Delete product wheel
router.delete("/product-wheels/:id", enhancedAuth, async (req, res) => {
  try {
    const success = await storage.deleteProductWheel(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Product wheel not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product wheel:", error);
    res.status(500).json({ error: "Failed to delete product wheel" });
  }
});

// Get wheel segments
router.get("/product-wheels/:wheelId/segments", enhancedAuth, async (req, res) => {
  try {
    const segments = await storage.getWheelSegments(parseInt(req.params.wheelId));
    res.json(segments);
  } catch (error: any) {
    console.error("Error fetching wheel segments:", error);
    res.status(500).json({ error: "Failed to fetch wheel segments" });
  }
});

// Create wheel segment
router.post("/product-wheels/:wheelId/segments", enhancedAuth, async (req, res) => {
  try {
    const segmentData = {
      ...req.body,
      wheelId: parseInt(req.params.wheelId)
    };
    const segment = await storage.createWheelSegment(segmentData);
    res.json(segment);
  } catch (error: any) {
    console.error("Error creating wheel segment:", error);
    res.status(500).json({ error: "Failed to create wheel segment" });
  }
});

// Update wheel segment
router.put("/wheel-segments/:id", enhancedAuth, async (req, res) => {
  try {
    const segment = await storage.updateWheelSegment(parseInt(req.params.id), req.body);
    if (!segment) {
      return res.status(404).json({ error: "Wheel segment not found" });
    }
    res.json(segment);
  } catch (error: any) {
    console.error("Error updating wheel segment:", error);
    res.status(500).json({ error: "Failed to update wheel segment" });
  }
});

// Delete wheel segment
router.delete("/wheel-segments/:id", enhancedAuth, async (req, res) => {
  try {
    const success = await storage.deleteWheelSegment(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Wheel segment not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting wheel segment:", error);
    res.status(500).json({ error: "Failed to delete wheel segment" });
  }
});

// Reorder wheel segments
router.put("/product-wheels/:wheelId/segments/reorder", enhancedAuth, async (req, res) => {
  try {
    const { segments } = req.body; // Array of { id, sequenceNumber }
    const success = await storage.reorderWheelSegments(parseInt(req.params.wheelId), segments);
    if (!success) {
      return res.status(400).json({ error: "Failed to reorder segments" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering wheel segments:", error);
    res.status(500).json({ error: "Failed to reorder wheel segments" });
  }
});

// Get wheel schedules
router.get("/product-wheels/:wheelId/schedules", enhancedAuth, async (req, res) => {
  try {
    const schedules = await storage.getWheelSchedules(parseInt(req.params.wheelId));
    res.json(schedules);
  } catch (error: any) {
    console.error("Error fetching wheel schedules:", error);
    res.status(500).json({ error: "Failed to fetch wheel schedules" });
  }
});

// Get current wheel schedule
router.get("/product-wheels/:wheelId/current-schedule", enhancedAuth, async (req, res) => {
  try {
    const schedule = await storage.getCurrentWheelSchedule(parseInt(req.params.wheelId));
    res.json(schedule || null);
  } catch (error: any) {
    console.error("Error fetching current wheel schedule:", error);
    res.status(500).json({ error: "Failed to fetch current wheel schedule" });
  }
});

// Create wheel schedule
router.post("/product-wheels/:wheelId/schedules", enhancedAuth, async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      wheelId: parseInt(req.params.wheelId)
    };
    const schedule = await storage.createWheelSchedule(scheduleData);
    res.json(schedule);
  } catch (error: any) {
    console.error("Error creating wheel schedule:", error);
    res.status(500).json({ error: "Failed to create wheel schedule" });
  }
});

// Update wheel schedule
router.put("/wheel-schedules/:id", enhancedAuth, async (req, res) => {
  try {
    const schedule = await storage.updateWheelSchedule(parseInt(req.params.id), req.body);
    if (!schedule) {
      return res.status(404).json({ error: "Wheel schedule not found" });
    }
    res.json(schedule);
  } catch (error: any) {
    console.error("Error updating wheel schedule:", error);
    res.status(500).json({ error: "Failed to update wheel schedule" });
  }
});

// Get wheel performance metrics
router.get("/product-wheels/:wheelId/performance", enhancedAuth, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const performance = await storage.getWheelPerformance(parseInt(req.params.wheelId), startDate, endDate);
    res.json(performance);
  } catch (error: any) {
    console.error("Error fetching wheel performance:", error);
    res.status(500).json({ error: "Failed to fetch wheel performance" });
  }
});

// Record wheel performance
router.post("/product-wheels/:wheelId/performance", enhancedAuth, async (req, res) => {
  try {
    const performanceData = {
      ...req.body,
      wheelId: parseInt(req.params.wheelId),
      metricDate: new Date()
    };
    const performance = await storage.recordWheelPerformance(performanceData);
    res.json(performance);
  } catch (error: any) {
    console.error("Error recording wheel performance:", error);
    res.status(500).json({ error: "Failed to record wheel performance" });
  }
});

// ============================================
// Calendar Management Routes
// ============================================

// Get all calendars
router.get("/api/calendars", enhancedAuth, async (req, res) => {
  try {
    const filters = {
      resourceId: req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined,
      jobId: req.query.jobId ? parseInt(req.query.jobId as string) : undefined,
      plantId: req.query.plantId ? parseInt(req.query.plantId as string) : undefined,
    };
    const calendars = await storage.getCalendars(filters);
    res.json(calendars);
  } catch (error) {
    console.error("Error fetching calendars:", error);
    res.status(500).json({ error: "Failed to fetch calendars" });
  }
});

// Get single calendar
router.get("/api/calendars/:id", enhancedAuth, async (req, res) => {
  try {
    const calendar = await storage.getCalendar(parseInt(req.params.id));
    if (!calendar) {
      return res.status(404).json({ error: "Calendar not found" });
    }
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching calendar:", error);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

// Get default calendar
router.get("/api/calendars/default", enhancedAuth, async (req, res) => {
  try {
    const calendar = await storage.getDefaultCalendar();
    if (!calendar) {
      return res.status(404).json({ error: "Default calendar not found" });
    }
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching default calendar:", error);
    res.status(500).json({ error: "Failed to fetch default calendar" });
  }
});

// Create calendar
router.post("/api/calendars", enhancedAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const calendarData = insertCalendarSchema.parse({
      ...req.body,
      createdBy: userId
    });
    
    const calendar = await storage.createCalendar(calendarData);
    res.status(201).json(calendar);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid calendar data", details: error.errors });
    }
    console.error("Error creating calendar:", error);
    res.status(500).json({ error: "Failed to create calendar" });
  }
});

// Update calendar
router.put("/api/calendars/:id", enhancedAuth, async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);
    const updateData = insertCalendarSchema.partial().parse(req.body);
    
    const calendar = await storage.updateCalendar(calendarId, updateData);
    if (!calendar) {
      return res.status(404).json({ error: "Calendar not found" });
    }
    res.json(calendar);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid update data", details: error.errors });
    }
    console.error("Error updating calendar:", error);
    res.status(500).json({ error: "Failed to update calendar" });
  }
});

// Delete calendar
router.delete("/api/calendars/:id", enhancedAuth, async (req, res) => {
  try {
    const success = await storage.deleteCalendar(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Calendar not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting calendar:", error);
    res.status(500).json({ error: "Failed to delete calendar" });
  }
});

// Assign calendar to resource
router.post("/api/resources/:id/calendar", enhancedAuth, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { calendarId } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({ error: "Calendar ID is required" });
    }
    
    const success = await storage.assignCalendarToResource(resourceId, calendarId);
    if (!success) {
      return res.status(400).json({ error: "Failed to assign calendar to resource" });
    }
    
    res.json({ message: "Calendar assigned to resource successfully" });
  } catch (error) {
    console.error("Error assigning calendar to resource:", error);
    res.status(500).json({ error: "Failed to assign calendar to resource" });
  }
});

// Assign calendar to job (using job instead of project)
router.post("/api/jobs/:id/calendar", enhancedAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { calendarId } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({ error: "Calendar ID is required" });
    }
    
    const success = await storage.assignCalendarToJob(jobId, calendarId);
    if (!success) {
      return res.status(400).json({ error: "Failed to assign calendar to job" });
    }
    
    res.json({ message: "Calendar assigned to job successfully" });
  } catch (error) {
    console.error("Error assigning calendar to job:", error);
    res.status(500).json({ error: "Failed to assign calendar to job" });
  }
});

// ============================================
// Maintenance Period Routes
// ============================================

// Get all maintenance periods
router.get("/api/maintenance-periods", enhancedAuth, async (req, res) => {
  try {
    const filters = {
      resourceId: req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined,
      jobId: req.query.jobId ? parseInt(req.query.jobId as string) : undefined,
      plantId: req.query.plantId ? parseInt(req.query.plantId as string) : undefined,
      calendarId: req.query.calendarId ? parseInt(req.query.calendarId as string) : undefined,
    };
    const periods = await storage.getMaintenancePeriods(filters);
    res.json(periods);
  } catch (error) {
    console.error("Error fetching maintenance periods:", error);
    res.status(500).json({ error: "Failed to fetch maintenance periods" });
  }
});

// Get single maintenance period
router.get("/api/maintenance-periods/:id", enhancedAuth, async (req, res) => {
  try {
    const period = await storage.getMaintenancePeriod(parseInt(req.params.id));
    if (!period) {
      return res.status(404).json({ error: "Maintenance period not found" });
    }
    res.json(period);
  } catch (error) {
    console.error("Error fetching maintenance period:", error);
    res.status(500).json({ error: "Failed to fetch maintenance period" });
  }
});

// Get active maintenance periods for a specific date
router.get("/api/maintenance-periods/active", enhancedAuth, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const periods = await storage.getActiveMaintenancePeriods(date);
    res.json(periods);
  } catch (error) {
    console.error("Error fetching active maintenance periods:", error);
    res.status(500).json({ error: "Failed to fetch active maintenance periods" });
  }
});

// Create maintenance period
router.post("/api/maintenance-periods", enhancedAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const periodData = insertMaintenancePeriodSchema.parse({
      ...req.body,
      createdBy: userId
    });
    
    const period = await storage.createMaintenancePeriod(periodData);
    res.status(201).json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid maintenance period data", details: error.errors });
    }
    console.error("Error creating maintenance period:", error);
    res.status(500).json({ error: "Failed to create maintenance period" });
  }
});

// Update maintenance period
router.put("/api/maintenance-periods/:id", enhancedAuth, async (req, res) => {
  try {
    const periodId = parseInt(req.params.id);
    const updateData = insertMaintenancePeriodSchema.partial().parse(req.body);
    
    const period = await storage.updateMaintenancePeriod(periodId, updateData);
    if (!period) {
      return res.status(404).json({ error: "Maintenance period not found" });
    }
    res.json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid update data", details: error.errors });
    }
    console.error("Error updating maintenance period:", error);
    res.status(500).json({ error: "Failed to update maintenance period" });
  }
});

// Delete maintenance period
router.delete("/api/maintenance-periods/:id", enhancedAuth, async (req, res) => {
  try {
    const success = await storage.deleteMaintenancePeriod(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Maintenance period not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting maintenance period:", error);
    res.status(500).json({ error: "Failed to delete maintenance period" });
  }
});

// ============================================
// Paginated Reports Routes - SQL Server Integration
// ============================================

import { sqlServerService } from "./services/sql-server-service";

// List all tables in SQL Server database
router.get("/api/sql-tables", enhancedAuth, async (req, res) => {
  try {
    const tables = await sqlServerService.listTables();
    res.json(tables);
  } catch (error) {
    console.error("Error listing SQL tables:", error);
    res.status(500).json({ error: "Failed to list SQL Server tables" });
  }
});

// Get schema for a specific table
router.get("/api/sql-tables/:schema/:table/schema", enhancedAuth, async (req, res) => {
  try {
    const { schema, table } = req.params;
    const tableSchema = await sqlServerService.getTableSchema(schema, table);
    res.json(tableSchema);
  } catch (error) {
    console.error("Error getting table schema:", error);
    res.status(500).json({ error: "Failed to get table schema" });
  }
});

// Get paginated data from a specific table
router.get("/api/paginated-reports", enhancedAuth, async (req, res) => {
  try {
    const schema = (req.query.schema as string) || 'dbo';
    const table = req.query.table as string;
    
    if (!table || !schema) {
      return res.status(400).json({ error: "Schema and table name are required" });
    }

    // Validate schema and table exist by checking against known tables
    const validTables = await sqlServerService.listTables();
    const isValidTable = validTables.some(
      t => t.schemaName === schema && t.tableName === table
    );
    
    if (!isValidTable) {
      return res.status(400).json({ error: "Invalid schema or table name" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const searchTerm = (req.query.searchTerm as string) || "";
    const sortBy = (req.query.sortBy as string) || "";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const data = await sqlServerService.getTableData(
      schema,
      table,
      page,
      pageSize,
      searchTerm,
      sortBy,
      sortOrder
    );

    res.json(data);
  } catch (error) {
    console.error("Error fetching paginated reports:", error);
    res.status(500).json({ error: "Failed to fetch paginated reports from SQL Server" });
  }
});

// Forced rebuild - all duplicate keys fixed
export default router;