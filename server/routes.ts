import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCapabilitySchema, insertResourceSchema, insertJobSchema, 
  insertOperationSchema, insertDependencySchema, insertResourceViewSchema,
  insertCustomTextLabelSchema, insertKanbanConfigSchema, insertReportConfigSchema,
  insertDashboardConfigSchema, insertScheduleScenarioSchema, insertScenarioOperationSchema,
  insertScenarioEvaluationSchema, insertScenarioDiscussionSchema,
  insertSystemUserSchema, insertSystemHealthSchema, insertSystemEnvironmentSchema,
  insertSystemUpgradeSchema, insertSystemAuditLogSchema, insertSystemSettingsSchema,
  insertCapacityPlanningScenarioSchema, insertStaffingPlanSchema, insertShiftPlanSchema,
  insertEquipmentPlanSchema, insertCapacityProjectionSchema,
  insertBusinessGoalSchema, insertGoalProgressSchema, insertGoalRiskSchema,
  insertGoalIssueSchema, insertGoalKpiSchema, insertGoalActionSchema,
  insertUserSchema, insertRoleSchema, insertPermissionSchema,
  insertUserRoleSchema, insertRolePermissionSchema,
  insertDemoTourParticipantSchema,
  insertVoiceRecordingsCacheSchema,
  insertDisruptionSchema, insertDisruptionActionSchema, insertDisruptionEscalationSchema
} from "@shared/schema";
import { processAICommand, transcribeAudio } from "./ai-agent";
import { emailService } from "./email";
import multer from "multer";
import session from "express-session";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";
import crypto from "crypto";

// Session interface is declared in index.ts

// Session is now configured in index.ts

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware is configured in index.ts

  // Demo login route for prospective users
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      const { role } = req.body;
      
      console.log("=== DEMO LOGIN ===");
      console.log("Demo role:", role);
      
      if (!role) {
        return res.status(400).json({ message: "Demo role is required" });
      }

      // Demo user mapping for different roles
      const demoUsers = {
        'director': { id: 'demo_director', username: 'demo_director', role: 'Director' },
        'plant-manager': { id: 'demo_plant', username: 'demo_plant_manager', role: 'Plant Manager' },
        'production-scheduler': { id: 'demo_scheduler', username: 'demo_scheduler', role: 'Production Scheduler' },
        'it-administrator': { id: 'demo_it_admin', username: 'demo_it_admin', role: 'IT Administrator' },
        'systems-manager': { id: 'demo_systems', username: 'demo_systems_manager', role: 'Systems Manager' },
        'administrator': { id: 'demo_admin', username: 'demo_administrator', role: 'Administrator' },
        'shop-floor-operations': { id: 'demo_shop_floor', username: 'demo_shop_floor', role: 'Shop Floor Operations' },
        'data-analyst': { id: 'demo_analyst', username: 'demo_data_analyst', role: 'Data Analyst' },
        'trainer': { id: 'demo_trainer', username: 'demo_trainer', role: 'Trainer' },
        'maintenance-technician': { id: 'demo_maintenance', username: 'demo_maintenance', role: 'Maintenance Technician' },
        // Legacy mappings for backward compatibility
        'executive': { id: 'demo_director', username: 'demo_director', role: 'Director' },
        'production': { id: 'demo_scheduler', username: 'demo_scheduler', role: 'Production Scheduler' },
        'it-admin': { id: 'demo_it_admin', username: 'demo_it_admin', role: 'IT Administrator' }
      };

      const demoUser = demoUsers[role as keyof typeof demoUsers];
      if (!demoUser) {
        return res.status(400).json({ message: "Invalid demo role" });
      }

      // Create demo session without database lookup
      req.session.userId = demoUser.id;
      req.session.isDemo = true;
      req.session.demoRole = demoUser.role;
      
      // Generate demo auth token
      const demoToken = `demo_${demoUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        message: "Demo login successful",
        user: {
          id: demoUser.id,
          username: demoUser.username,
          email: `${demoUser.username}@demo.planettogether.com`,
          isActive: true,
          isDemo: true,
          role: demoUser.role
        },
        token: demoToken
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("=== LOGIN DEBUG ===");
      console.log("Username:", username);
      console.log("Password length:", password ? password.length : 'undefined');
      console.log("Password:", password); // Temporary for debugging
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserWithRolesAndPermissions(username);
      if (!user) {
        console.log("User not found:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("User found:", user.username, "ID:", user.id);
      console.log("Stored hash:", user.passwordHash);
      console.log("Comparing password:", password);
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log("Password comparison result:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Password verification failed");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Generate a simple token and store user ID in session AND return token
      console.log("=== LOGIN SUCCESS ===");
      const token = `user_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.session.userId = user.id;
      req.session.token = token;
      
      // Force session save and return token
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        console.log("Session saved successfully with token:", token);
        console.log("Session ID:", req.sessionID);
        
        // Return user data with token
        const { passwordHash, ...userData } = user;
        res.json({ ...userData, token });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      console.log("=== AUTH CHECK ===");
      console.log("Session ID:", req.sessionID);
      console.log("Authorization header:", req.headers.authorization);
      console.log("Session userId:", req.session?.userId);
      
      let userId = req.session?.userId;
      let isDemo = req.session?.isDemo;
      
      // Check for token in Authorization header if session fails
      if (!userId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Handle demo tokens
        if (token.startsWith('demo_')) {
          isDemo = true;
          const tokenParts = token.split('_');
          if (tokenParts.length >= 3) {
            userId = tokenParts[1] + '_' + tokenParts[2]; // demo_exec, demo_prod, etc.
            console.log("Demo token userId:", userId);
          }
        }
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        else if (token.startsWith('user_')) {
          const tokenParts = token.split('_');
          if (tokenParts.length >= 2) {
            userId = parseInt(tokenParts[1]);
            console.log("Token userId:", userId);
          }
        }
      }
      
      if (!userId) {
        console.log("No userId found, returning 401");
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Handle demo users
      if (isDemo || (typeof userId === 'string' && userId.startsWith('demo_'))) {
        const demoUsers = {
          'demo_director': { 
            id: 'demo_director', 
            username: 'demo_director', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Director',
            isActive: true,
            isDemo: true,
            role: 'Director',
            activeRole: { id: 'demo_director_role', name: 'Director' },
            permissions: ['business-goals-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_director_role', name: 'Director' }]
          },
          'demo_plant': { 
            id: 'demo_plant', 
            username: 'demo_plant_manager', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Plant Manager',
            isActive: true,
            isDemo: true,
            role: 'Plant Manager',
            activeRole: { id: 'demo_plant_role', name: 'Plant Manager' },
            permissions: ['plant-manager-view', 'capacity-planning-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_plant_role', name: 'Plant Manager' }]
          },
          'demo_scheduler': { 
            id: 'demo_scheduler', 
            username: 'demo_scheduler', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Scheduler',
            isActive: true,
            isDemo: true,
            role: 'Production Scheduler',
            activeRole: { id: 'demo_scheduler_role', name: 'Production Scheduler' },
            permissions: ['schedule-view', 'boards-view', 'shop-floor-view', 'analytics-view', 'scheduling-optimizer-view', 'capacity-planning-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_scheduler_role', name: 'Production Scheduler' }]
          },
          'demo_it_admin': { 
            id: 'demo_it_admin', 
            username: 'demo_it_admin', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'IT Admin',
            isActive: true,
            isDemo: true,
            role: 'IT Administrator',
            activeRole: { id: 'demo_it_admin_role', name: 'IT Administrator' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_it_admin_role', name: 'IT Administrator' }]
          },
          'demo_systems': { 
            id: 'demo_systems', 
            username: 'demo_systems_manager', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Systems Manager',
            isActive: true,
            activeRole: { id: 'demo_systems_role', name: 'Systems Manager' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'training-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_systems_role', name: 'Systems Manager' }]
          },
          'demo_admin': { 
            id: 'demo_admin', 
            username: 'demo_administrator', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Administrator',
            isActive: true,
            activeRole: { id: 'demo_admin_role', name: 'Administrator' },
            permissions: ['role-management-view', 'user-management-view', 'systems-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_admin_role', name: 'Administrator' }]
          },
          'demo_shop_floor': { 
            id: 'demo_shop_floor', 
            username: 'demo_shop_floor', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Shop Floor',
            isActive: true,
            activeRole: { id: 'demo_shop_floor_role', name: 'Shop Floor Operations' },
            permissions: ['shop-floor-view', 'operator-dashboard-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_shop_floor_role', name: 'Shop Floor Operations' }]
          },
          'demo_analyst': { 
            id: 'demo_analyst', 
            username: 'demo_data_analyst', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Data Analyst',
            isActive: true,
            activeRole: { id: 'demo_analyst_role', name: 'Data Analyst' },
            permissions: ['analytics-view', 'reports-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_analyst_role', name: 'Data Analyst' }]
          },
          'demo_trainer': { 
            id: 'demo_trainer', 
            username: 'demo_trainer', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Trainer',
            isActive: true,
            isDemo: true,
            role: 'Trainer',
            activeRole: { id: 'demo_trainer_role', name: 'Trainer' },
            permissions: [
              'training-view', 'role-switching-permissions', 'analytics-view', 'reports-view',
              'schedule-view', 'business-goals-view', 'visual-factory-view', 
              'ai-assistant-view', 'feedback-view'
            ],
            roles: [{ id: 'demo_trainer_role', name: 'Trainer' }]
          },
          'demo_maintenance': { 
            id: 'demo_maintenance', 
            username: 'demo_maintenance', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Maintenance Tech',
            isActive: true,
            activeRole: { id: 'demo_maintenance_role', name: 'Maintenance Technician' },
            permissions: ['maintenance-planning-view', 'shop-floor-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_maintenance_role', name: 'Maintenance Technician' }]
          },
          // Legacy mappings for backward compatibility
          'demo_exec': { 
            id: 'demo_director', 
            username: 'demo_director', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Director',
            isActive: true,
            activeRole: { id: 'demo_director_role', name: 'Director' },
            permissions: ['business-goals-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_director_role', name: 'Director' }]
          },
          'demo_prod': { 
            id: 'demo_scheduler', 
            username: 'demo_scheduler', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Scheduler',
            isActive: true,
            activeRole: { id: 'demo_scheduler_role', name: 'Production Scheduler' },
            permissions: ['schedule-view', 'boards-view', 'shop-floor-view', 'analytics-view', 'scheduling-optimizer-view', 'capacity-planning-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_scheduler_role', name: 'Production Scheduler' }]
          },
          'demo_it': { 
            id: 'demo_it_admin', 
            username: 'demo_it_admin', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'IT Admin',
            isActive: true,
            activeRole: { id: 'demo_it_admin_role', name: 'IT Administrator' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_it_admin_role', name: 'IT Administrator' }]
          }
        };
        
        const demoUser = demoUsers[userId as keyof typeof demoUsers];
        if (demoUser) {
          console.log("Demo user found, returning demo data");
          return res.json(demoUser);
        }
      }

      const user = await storage.getUserWithRoles(userId);
      if (!user || !user.isActive) {
        console.log("User not found or inactive for userId:", userId);
        return res.status(401).json({ message: "User not found or inactive" });
      }

      console.log("User found, returning user data");
      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Capabilities
  app.get("/api/capabilities", async (req, res) => {
    try {
      const capabilities = await storage.getCapabilities();
      res.json(capabilities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capabilities" });
    }
  });

  app.post("/api/capabilities", async (req, res) => {
    try {
      const capability = insertCapabilitySchema.parse(req.body);
      const newCapability = await storage.createCapability(capability);
      res.status(201).json(newCapability);
    } catch (error) {
      res.status(400).json({ message: "Invalid capability data" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resource = insertResourceSchema.parse(req.body);
      const newResource = await storage.createResource(resource);
      res.status(201).json(newResource);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource data" });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = insertResourceSchema.partial().parse(req.body);
      const updatedResource = await storage.updateResource(id, resource);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(updatedResource);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource data" });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResource(id);
      if (!deleted) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Update resource photo endpoint
  app.put("/api/resources/:id/photo", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { photo } = req.body;
      
      if (!photo) {
        return res.status(400).json({ message: "Photo data is required" });
      }
      
      const updatedResource = await storage.updateResource(id, { photo });
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(updatedResource);
    } catch (error) {
      res.status(500).json({ message: "Failed to update resource photo" });
    }
  });

  // Jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const job = insertJobSchema.parse(req.body);
      const newJob = await storage.createJob(job);
      res.status(201).json(newJob);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = insertJobSchema.partial().parse(req.body);
      const updatedJob = await storage.updateJob(id, job);
      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(updatedJob);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJob(id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Operations
  app.get("/api/operations", async (req, res) => {
    try {
      const operations = await storage.getOperations();
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  app.get("/api/jobs/:jobId/operations", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const operations = await storage.getOperationsByJobId(jobId);
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  app.get("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.getOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(operation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operation" });
    }
  });

  app.post("/api/operations", async (req, res) => {
    try {
      const operation = insertOperationSchema.parse(req.body);
      const newOperation = await storage.createOperation(operation);
      res.status(201).json(newOperation);
    } catch (error) {
      res.status(400).json({ message: "Invalid operation data" });
    }
  });

  app.put("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Handle the date conversion before validation
      const requestData = { ...req.body };
      
      if (requestData.startTime && typeof requestData.startTime === 'string') {
        requestData.startTime = new Date(requestData.startTime);
      }
      if (requestData.endTime && typeof requestData.endTime === 'string') {
        requestData.endTime = new Date(requestData.endTime);
      }
      
      const operation = insertOperationSchema.partial().parse(requestData);
      const updatedOperation = await storage.updateOperation(id, operation);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(updatedOperation);
    } catch (error: any) {
      console.error('Operation update error:', error);
      if (error.issues) {
        console.error('Validation errors:', error.issues);
        res.status(400).json({ message: "Invalid operation data", errors: error.issues });
      } else {
        res.status(400).json({ message: "Invalid operation data", error: error.message });
      }
    }
  });

  app.delete("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOperation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete operation" });
    }
  });

  // Dependencies
  app.get("/api/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getDependencies();
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  app.get("/api/operations/:operationId/dependencies", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      const dependencies = await storage.getDependenciesByOperationId(operationId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  app.post("/api/dependencies", async (req, res) => {
    try {
      const dependency = insertDependencySchema.parse(req.body);
      const newDependency = await storage.createDependency(dependency);
      res.status(201).json(newDependency);
    } catch (error) {
      res.status(400).json({ message: "Invalid dependency data" });
    }
  });

  app.delete("/api/dependencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDependency(id);
      if (!deleted) {
        return res.status(404).json({ message: "Dependency not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete dependency" });
    }
  });

  // Resource Views
  app.get("/api/resource-views", async (req, res) => {
    try {
      const resourceViews = await storage.getResourceViews();
      res.json(resourceViews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource views" });
    }
  });

  app.get("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resourceView = await storage.getResourceView(id);
      if (!resourceView) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.json(resourceView);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource view" });
    }
  });

  app.post("/api/resource-views", async (req, res) => {
    try {
      const resourceView = insertResourceViewSchema.parse(req.body);
      const newResourceView = await storage.createResourceView(resourceView);
      res.status(201).json(newResourceView);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource view data" });
    }
  });

  app.put("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resourceView = insertResourceViewSchema.partial().parse(req.body);
      const updatedResourceView = await storage.updateResourceView(id, resourceView);
      if (!updatedResourceView) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.json(updatedResourceView);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource view data" });
    }
  });

  app.delete("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResourceView(id);
      if (!deleted) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource view" });
    }
  });

  app.get("/api/resource-views/default", async (req, res) => {
    try {
      const defaultView = await storage.getDefaultResourceView();
      if (!defaultView) {
        return res.status(404).json({ message: "No default resource view found" });
      }
      res.json(defaultView);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default resource view" });
    }
  });

  app.post("/api/resource-views/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setDefaultResourceView(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to set default resource view" });
    }
  });

  // Metrics endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      const operations = await storage.getOperations();
      const resources = await storage.getResources();

      const activeJobs = jobs.filter(job => job.status === "active").length;
      const overdueOperations = operations.filter(op => 
        op.endTime && new Date(op.endTime) < new Date() && op.status !== "completed"
      ).length;

      // Calculate resource utilization
      const assignedOperations = operations.filter(op => op.assignedResourceId).length;
      const totalOperations = operations.length;
      const utilization = totalOperations > 0 ? Math.round((assignedOperations / totalOperations) * 100) : 0;

      // Calculate average lead time
      const completedOperations = operations.filter(op => op.status === "completed");
      const avgLeadTime = completedOperations.length > 0 
        ? completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOperations.length / 24
        : 0;

      const metrics = {
        activeJobs,
        utilization,
        overdueOperations,
        avgLeadTime: parseFloat(avgLeadTime.toFixed(1))
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // AI Agent routes
  const upload = multer();

  app.post("/api/ai-agent/command", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command || typeof command !== "string") {
        return res.status(400).json({ message: "Command is required" });
      }
      
      const response = await processAICommand(command);
      res.json(response);
    } catch (error) {
      console.error("AI Agent command error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process AI command" 
      });
    }
  });

  app.post("/api/ai-agent/voice", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }
      
      const transcribedText = await transcribeAudio(req.file.buffer);
      res.json({ text: transcribedText });
    } catch (error) {
      console.error("Voice transcription error:", error);
      res.status(500).json({ 
        message: "Failed to transcribe audio" 
      });
    }
  });

  // AI Image Generation
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, resourceId } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural", // DALL-E 3 doesn't have a "cartoon" style, but we can use prompt engineering
      });
      
      const imageUrl = response.data[0].url;
      
      // Fetch the image and convert to base64 to avoid CORS issues
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      
      res.json({ imageUrl: base64Image, resourceId });
    } catch (error) {
      console.error("AI Image generation error:", error);
      
      // Check if this is a quota/rate limit error
      const errorMessage = error.message || "Unknown error";
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('exceeded') ||
                          errorMessage.includes('insufficient_quota') ||
                          errorMessage.includes('rate_limit');
      
      if (isQuotaError) {
        res.status(429).json({ 
          message: "Quota exceeded",
          error: errorMessage,
          quotaExceeded: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate image",
          error: errorMessage
        });
      }
    }
  });

  // Custom Text Labels
  app.get("/api/custom-text-labels", async (req, res) => {
    try {
      const customTextLabels = await storage.getCustomTextLabels();
      res.json(customTextLabels);
    } catch (error) {
      console.error("Error fetching custom text labels:", error);
      res.status(500).json({ error: "Failed to fetch custom text labels" });
    }
  });

  app.post("/api/custom-text-labels", async (req, res) => {
    try {
      const validation = insertCustomTextLabelSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid custom text label data", details: validation.error.errors });
      }

      const customTextLabel = await storage.createCustomTextLabel(validation.data);
      res.status(201).json(customTextLabel);
    } catch (error) {
      console.error("Error creating custom text label:", error);
      res.status(500).json({ error: "Failed to create custom text label" });
    }
  });

  app.put("/api/custom-text-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custom text label ID" });
      }

      const validation = insertCustomTextLabelSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid custom text label data", details: validation.error.errors });
      }

      const customTextLabel = await storage.updateCustomTextLabel(id, validation.data);
      if (!customTextLabel) {
        return res.status(404).json({ error: "Custom text label not found" });
      }
      res.json(customTextLabel);
    } catch (error) {
      console.error("Error updating custom text label:", error);
      res.status(500).json({ error: "Failed to update custom text label" });
    }
  });

  app.delete("/api/custom-text-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custom text label ID" });
      }

      const success = await storage.deleteCustomTextLabel(id);
      if (!success) {
        return res.status(404).json({ error: "Custom text label not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom text label:", error);
      res.status(500).json({ error: "Failed to delete custom text label" });
    }
  });

  // Kanban Configurations
  app.get("/api/kanban-configs", async (req, res) => {
    try {
      const kanbanConfigs = await storage.getKanbanConfigs();
      res.json(kanbanConfigs);
    } catch (error) {
      console.error("Error fetching kanban configs:", error);
      res.status(500).json({ error: "Failed to fetch kanban configs" });
    }
  });

  app.post("/api/kanban-configs", async (req, res) => {
    try {
      const validation = insertKanbanConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid kanban config data", details: validation.error.errors });
      }

      const kanbanConfig = await storage.createKanbanConfig(validation.data);
      res.status(201).json(kanbanConfig);
    } catch (error) {
      console.error("Error creating kanban config:", error);
      res.status(500).json({ error: "Failed to create kanban config" });
    }
  });

  app.put("/api/kanban-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      const validation = insertKanbanConfigSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid kanban config data", details: validation.error.errors });
      }

      const kanbanConfig = await storage.updateKanbanConfig(id, validation.data);
      if (!kanbanConfig) {
        return res.status(404).json({ error: "Kanban config not found" });
      }
      res.json(kanbanConfig);
    } catch (error) {
      console.error("Error updating kanban config:", error);
      res.status(500).json({ error: "Failed to update kanban config" });
    }
  });

  app.delete("/api/kanban-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      const kanbanConfig = await storage.deleteKanbanConfig(id);
      if (!kanbanConfig) {
        return res.status(404).json({ error: "Kanban config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting kanban config:", error);
      res.status(500).json({ error: "Failed to delete kanban config" });
    }
  });

  app.post("/api/kanban-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      await storage.setDefaultKanbanConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default kanban config:", error);
      res.status(500).json({ error: "Failed to set default kanban config" });
    }
  });

  // Report Configurations
  app.get("/api/report-configs", async (req, res) => {
    try {
      const configs = await storage.getReportConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching report configs:", error);
      res.status(500).json({ error: "Failed to fetch report configs" });
    }
  });

  app.get("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const config = await storage.getReportConfig(id);
      if (!config) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching report config:", error);
      res.status(500).json({ error: "Failed to fetch report config" });
    }
  });

  app.post("/api/report-configs", async (req, res) => {
    try {
      const config = insertReportConfigSchema.parse(req.body);
      const newConfig = await storage.createReportConfig(config);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating report config:", error);
      res.status(400).json({ error: "Invalid report config data" });
    }
  });

  app.put("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const updateData = insertReportConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateReportConfig(id, updateData);
      if (!updatedConfig) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating report config:", error);
      res.status(400).json({ error: "Invalid report config data" });
    }
  });

  app.delete("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const deleted = await storage.deleteReportConfig(id);
      if (!deleted) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting report config:", error);
      res.status(500).json({ error: "Failed to delete report config" });
    }
  });

  app.post("/api/report-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      await storage.setDefaultReportConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default report config:", error);
      res.status(500).json({ error: "Failed to set default report config" });
    }
  });

  // Dashboard Configurations
  app.get("/api/dashboard-configs", async (req, res) => {
    try {
      const dashboards = await storage.getDashboardConfigs();
      res.json(dashboards);
    } catch (error) {
      console.error("Error fetching dashboard configs:", error);
      res.status(500).json({ error: "Failed to fetch dashboard configs" });
    }
  });

  app.get("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const dashboard = await storage.getDashboardConfig(id);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching dashboard config:", error);
      res.status(500).json({ error: "Failed to fetch dashboard config" });
    }
  });

  app.post("/api/dashboard-configs", async (req, res) => {
    try {
      const dashboardData = insertDashboardConfigSchema.parse(req.body);
      const newDashboard = await storage.createDashboardConfig(dashboardData);
      res.status(201).json(newDashboard);
    } catch (error) {
      console.error("Error creating dashboard config:", error);
      res.status(400).json({ error: "Invalid dashboard config data" });
    }
  });

  app.put("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const updateData = insertDashboardConfigSchema.partial().parse(req.body);
      const updatedDashboard = await storage.updateDashboardConfig(id, updateData);
      if (!updatedDashboard) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json(updatedDashboard);
    } catch (error) {
      console.error("Error updating dashboard config:", error);
      res.status(400).json({ error: "Invalid dashboard config data" });
    }
  });

  app.delete("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const deleted = await storage.deleteDashboardConfig(id);
      if (!deleted) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dashboard config:", error);
      res.status(500).json({ error: "Failed to delete dashboard config" });
    }
  });

  app.post("/api/dashboard-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      await storage.setDefaultDashboardConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default dashboard config:", error);
      res.status(500).json({ error: "Failed to set default dashboard config" });
    }
  });

  // Email API routes
  app.post("/api/email/send", async (req, res) => {
    try {
      const { to, subject, htmlBody, textBody, from } = req.body;
      
      if (!to || !subject || (!htmlBody && !textBody)) {
        return res.status(400).json({ 
          error: "Missing required fields: to, subject, and either htmlBody or textBody" 
        });
      }

      const success = await emailService.sendEmail({
        to,
        subject,
        htmlBody,
        textBody,
        from
      });

      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error in email send route:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/email/order-confirmation", async (req, res) => {
    try {
      const { customerEmail, orderDetails } = req.body;
      
      if (!customerEmail || !orderDetails) {
        return res.status(400).json({ error: "Missing customerEmail or orderDetails" });
      }

      const success = await emailService.sendOrderConfirmation(customerEmail, orderDetails);

      if (success) {
        res.json({ success: true, message: "Order confirmation sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send order confirmation" });
      }
    } catch (error) {
      console.error("Error sending order confirmation:", error);
      res.status(500).json({ error: "Failed to send order confirmation" });
    }
  });

  app.post("/api/email/production-update", async (req, res) => {
    try {
      const { customerEmail, jobDetails } = req.body;
      
      if (!customerEmail || !jobDetails) {
        return res.status(400).json({ error: "Missing customerEmail or jobDetails" });
      }

      const success = await emailService.sendProductionStatusUpdate(customerEmail, jobDetails);

      if (success) {
        res.json({ success: true, message: "Production update sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send production update" });
      }
    } catch (error) {
      console.error("Error sending production update:", error);
      res.status(500).json({ error: "Failed to send production update" });
    }
  });

  app.post("/api/email/maintenance-alert", async (req, res) => {
    try {
      const { maintenanceTeamEmail, resourceDetails } = req.body;
      
      if (!maintenanceTeamEmail || !resourceDetails) {
        return res.status(400).json({ error: "Missing maintenanceTeamEmail or resourceDetails" });
      }

      const success = await emailService.sendMaintenanceAlert(maintenanceTeamEmail, resourceDetails);

      if (success) {
        res.json({ success: true, message: "Maintenance alert sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send maintenance alert" });
      }
    } catch (error) {
      console.error("Error sending maintenance alert:", error);
      res.status(500).json({ error: "Failed to send maintenance alert" });
    }
  });

  app.post("/api/email/operation-alert", async (req, res) => {
    try {
      const { operatorEmail, operationDetails } = req.body;
      
      if (!operatorEmail || !operationDetails) {
        return res.status(400).json({ error: "Missing operatorEmail or operationDetails" });
      }

      const success = await emailService.sendOperationAlert(operatorEmail, operationDetails);

      if (success) {
        res.json({ success: true, message: "Operation alert sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send operation alert" });
      }
    } catch (error) {
      console.error("Error sending operation alert:", error);
      res.status(500).json({ error: "Failed to send operation alert" });
    }
  });

  // Schedule Scenarios
  app.get("/api/schedule-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getScheduleScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching schedule scenarios:", error);
      res.status(500).json({ error: "Failed to fetch schedule scenarios" });
    }
  });

  app.get("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const scenario = await storage.getScheduleScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching schedule scenario:", error);
      res.status(500).json({ error: "Failed to fetch schedule scenario" });
    }
  });

  app.post("/api/schedule-scenarios", async (req, res) => {
    try {
      const validation = insertScheduleScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid schedule scenario data", details: validation.error.errors });
      }

      const scenario = await storage.createScheduleScenario(validation.data);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating schedule scenario:", error);
      res.status(500).json({ error: "Failed to create schedule scenario" });
    }
  });

  app.put("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const validation = insertScheduleScenarioSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid schedule scenario data", details: validation.error.errors });
      }

      const scenario = await storage.updateScheduleScenario(id, validation.data);
      if (!scenario) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error updating schedule scenario:", error);
      res.status(500).json({ error: "Failed to update schedule scenario" });
    }
  });

  app.delete("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const success = await storage.deleteScheduleScenario(id);
      if (!success) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting schedule scenario:", error);
      res.status(500).json({ error: "Failed to delete schedule scenario" });
    }
  });

  // Scenario Operations
  app.get("/api/scenarios/:scenarioId/operations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const operations = await storage.getScenarioOperations(scenarioId);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching scenario operations:", error);
      res.status(500).json({ error: "Failed to fetch scenario operations" });
    }
  });

  app.post("/api/scenarios/:scenarioId/operations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioOperationSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario operation data", details: validation.error.errors });
      }

      const operation = await storage.createScenarioOperation(validation.data);
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating scenario operation:", error);
      res.status(500).json({ error: "Failed to create scenario operation" });
    }
  });

  app.put("/api/scenario-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario operation ID" });
      }

      const validation = insertScenarioOperationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario operation data", details: validation.error.errors });
      }

      const operation = await storage.updateScenarioOperation(id, validation.data);
      if (!operation) {
        return res.status(404).json({ error: "Scenario operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Error updating scenario operation:", error);
      res.status(500).json({ error: "Failed to update scenario operation" });
    }
  });

  app.delete("/api/scenario-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario operation ID" });
      }

      const success = await storage.deleteScenarioOperation(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario operation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario operation:", error);
      res.status(500).json({ error: "Failed to delete scenario operation" });
    }
  });

  // Scenario Evaluations
  app.get("/api/scenarios/:scenarioId/evaluations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const evaluations = await storage.getScenarioEvaluations(scenarioId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching scenario evaluations:", error);
      res.status(500).json({ error: "Failed to fetch scenario evaluations" });
    }
  });

  app.post("/api/scenarios/:scenarioId/evaluations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioEvaluationSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario evaluation data", details: validation.error.errors });
      }

      const evaluation = await storage.createScenarioEvaluation(validation.data);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating scenario evaluation:", error);
      res.status(500).json({ error: "Failed to create scenario evaluation" });
    }
  });

  app.put("/api/scenario-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario evaluation ID" });
      }

      const validation = insertScenarioEvaluationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario evaluation data", details: validation.error.errors });
      }

      const evaluation = await storage.updateScenarioEvaluation(id, validation.data);
      if (!evaluation) {
        return res.status(404).json({ error: "Scenario evaluation not found" });
      }
      res.json(evaluation);
    } catch (error) {
      console.error("Error updating scenario evaluation:", error);
      res.status(500).json({ error: "Failed to update scenario evaluation" });
    }
  });

  app.delete("/api/scenario-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario evaluation ID" });
      }

      const success = await storage.deleteScenarioEvaluation(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario evaluation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario evaluation:", error);
      res.status(500).json({ error: "Failed to delete scenario evaluation" });
    }
  });

  // Scenario Discussions
  app.get("/api/scenarios/:scenarioId/discussions", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const discussions = await storage.getScenarioDiscussions(scenarioId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching scenario discussions:", error);
      res.status(500).json({ error: "Failed to fetch scenario discussions" });
    }
  });

  app.post("/api/scenarios/:scenarioId/discussions", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioDiscussionSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario discussion data", details: validation.error.errors });
      }

      const discussion = await storage.createScenarioDiscussion(validation.data);
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating scenario discussion:", error);
      res.status(500).json({ error: "Failed to create scenario discussion" });
    }
  });

  app.put("/api/scenario-discussions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario discussion ID" });
      }

      const validation = insertScenarioDiscussionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario discussion data", details: validation.error.errors });
      }

      const discussion = await storage.updateScenarioDiscussion(id, validation.data);
      if (!discussion) {
        return res.status(404).json({ error: "Scenario discussion not found" });
      }
      res.json(discussion);
    } catch (error) {
      console.error("Error updating scenario discussion:", error);
      res.status(500).json({ error: "Failed to update scenario discussion" });
    }
  });

  app.delete("/api/scenario-discussions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario discussion ID" });
      }

      const success = await storage.deleteScenarioDiscussion(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario discussion not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario discussion:", error);
      res.status(500).json({ error: "Failed to delete scenario discussion" });
    }
  });

  // System Management API Routes

  // System Users
  app.get("/api/system/users", async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching system users:", error);
      res.status(500).json({ error: "Failed to fetch system users" });
    }
  });

  app.get("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getSystemUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching system user:", error);
      res.status(500).json({ error: "Failed to fetch system user" });
    }
  });

  app.post("/api/system/users", async (req, res) => {
    try {
      const validation = insertSystemUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.createSystemUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating system user:", error);
      res.status(500).json({ error: "Failed to create system user" });
    }
  });

  app.put("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertSystemUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.updateSystemUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating system user:", error);
      res.status(500).json({ error: "Failed to update system user" });
    }
  });

  app.delete("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const success = await storage.deleteSystemUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system user:", error);
      res.status(500).json({ error: "Failed to delete system user" });
    }
  });

  // System Health
  app.get("/api/system/health", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const health = await storage.getSystemHealth(environment);
      res.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  app.post("/api/system/health", async (req, res) => {
    try {
      const validation = insertSystemHealthSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid health data", details: validation.error.errors });
      }

      const health = await storage.createSystemHealth(validation.data);
      res.status(201).json(health);
    } catch (error) {
      console.error("Error creating system health record:", error);
      res.status(500).json({ error: "Failed to create system health record" });
    }
  });

  // System Environments
  app.get("/api/system/environments", async (req, res) => {
    try {
      const environments = await storage.getSystemEnvironments();
      res.json(environments);
    } catch (error) {
      console.error("Error fetching system environments:", error);
      res.status(500).json({ error: "Failed to fetch system environments" });
    }
  });

  app.get("/api/system/environments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid environment ID" });
      }

      const environment = await storage.getSystemEnvironment(id);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json(environment);
    } catch (error) {
      console.error("Error fetching system environment:", error);
      res.status(500).json({ error: "Failed to fetch system environment" });
    }
  });

  app.post("/api/system/environments", async (req, res) => {
    try {
      const validation = insertSystemEnvironmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid environment data", details: validation.error.errors });
      }

      const environment = await storage.createSystemEnvironment(validation.data);
      res.status(201).json(environment);
    } catch (error) {
      console.error("Error creating system environment:", error);
      res.status(500).json({ error: "Failed to create system environment" });
    }
  });

  app.put("/api/system/environments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid environment ID" });
      }

      const validation = insertSystemEnvironmentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid environment data", details: validation.error.errors });
      }

      const environment = await storage.updateSystemEnvironment(id, validation.data);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json(environment);
    } catch (error) {
      console.error("Error updating system environment:", error);
      res.status(500).json({ error: "Failed to update system environment" });
    }
  });

  // System Upgrades
  app.get("/api/system/upgrades", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const upgrades = await storage.getSystemUpgrades(environment);
      res.json(upgrades);
    } catch (error) {
      console.error("Error fetching system upgrades:", error);
      res.status(500).json({ error: "Failed to fetch system upgrades" });
    }
  });

  app.post("/api/system/upgrades", async (req, res) => {
    try {
      const validation = insertSystemUpgradeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid upgrade data", details: validation.error.errors });
      }

      const upgrade = await storage.createSystemUpgrade(validation.data);
      res.status(201).json(upgrade);
    } catch (error) {
      console.error("Error creating system upgrade:", error);
      res.status(500).json({ error: "Failed to create system upgrade" });
    }
  });

  app.put("/api/system/upgrades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid upgrade ID" });
      }

      const validation = insertSystemUpgradeSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid upgrade data", details: validation.error.errors });
      }

      const upgrade = await storage.updateSystemUpgrade(id, validation.data);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      console.error("Error updating system upgrade:", error);
      res.status(500).json({ error: "Failed to update system upgrade" });
    }
  });

  // System Audit Log
  app.get("/api/system/audit-log", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const resource = req.query.resource as string | undefined;
      const auditLog = await storage.getSystemAuditLog(userId, resource);
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching system audit log:", error);
      res.status(500).json({ error: "Failed to fetch system audit log" });
    }
  });

  app.post("/api/system/audit-log", async (req, res) => {
    try {
      const validation = insertSystemAuditLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid audit log data", details: validation.error.errors });
      }

      const auditLog = await storage.createSystemAuditLog(validation.data);
      res.status(201).json(auditLog);
    } catch (error) {
      console.error("Error creating system audit log:", error);
      res.status(500).json({ error: "Failed to create system audit log" });
    }
  });

  // System Settings
  app.get("/api/system/settings", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const category = req.query.category as string | undefined;
      const settings = await storage.getSystemSettings(environment, category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });

  app.post("/api/system/settings", async (req, res) => {
    try {
      const validation = insertSystemSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid settings data", details: validation.error.errors });
      }

      const setting = await storage.createSystemSetting(validation.data);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating system setting:", error);
      res.status(500).json({ error: "Failed to create system setting" });
    }
  });

  app.put("/api/system/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid setting ID" });
      }

      const validation = insertSystemSettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid settings data", details: validation.error.errors });
      }

      const setting = await storage.updateSystemSetting(id, validation.data);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });

  // Capacity Planning Scenarios
  app.get("/api/capacity-planning-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getCapacityPlanningScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching capacity planning scenarios:", error);
      res.status(500).json({ error: "Failed to fetch capacity planning scenarios" });
    }
  });

  app.get("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const scenario = await storage.getCapacityPlanningScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to fetch capacity planning scenario" });
    }
  });

  app.post("/api/capacity-planning-scenarios", async (req, res) => {
    try {
      const validation = insertCapacityPlanningScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity planning scenario data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        startDate: new Date(validation.data.startDate),
        endDate: new Date(validation.data.endDate)
      };

      const scenario = await storage.createCapacityPlanningScenario(data);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to create capacity planning scenario" });
    }
  });

  app.put("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertCapacityPlanningScenarioSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity planning scenario data", details: validation.error.errors });
      }

      const scenario = await storage.updateCapacityPlanningScenario(id, validation.data);
      if (!scenario) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error updating capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to update capacity planning scenario" });
    }
  });

  app.delete("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const success = await storage.deleteCapacityPlanningScenario(id);
      if (!success) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to delete capacity planning scenario" });
    }
  });

  // Staffing Plans
  app.get("/api/staffing-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getStaffingPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching staffing plans:", error);
      res.status(500).json({ error: "Failed to fetch staffing plans" });
    }
  });

  app.get("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getStaffingPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching staffing plan:", error);
      res.status(500).json({ error: "Failed to fetch staffing plan" });
    }
  });

  app.post("/api/staffing-plans", async (req, res) => {
    try {
      const validation = insertStaffingPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid staffing plan data", details: validation.error.errors });
      }

      const plan = await storage.createStaffingPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating staffing plan:", error);
      res.status(500).json({ error: "Failed to create staffing plan" });
    }
  });

  app.put("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertStaffingPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid staffing plan data", details: validation.error.errors });
      }

      const plan = await storage.updateStaffingPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating staffing plan:", error);
      res.status(500).json({ error: "Failed to update staffing plan" });
    }
  });

  app.delete("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteStaffingPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staffing plan:", error);
      res.status(500).json({ error: "Failed to delete staffing plan" });
    }
  });

  // Shift Plans
  app.get("/api/shift-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getShiftPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching shift plans:", error);
      res.status(500).json({ error: "Failed to fetch shift plans" });
    }
  });

  app.get("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getShiftPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching shift plan:", error);
      res.status(500).json({ error: "Failed to fetch shift plan" });
    }
  });

  app.post("/api/shift-plans", async (req, res) => {
    try {
      const validation = insertShiftPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid shift plan data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        effectiveDate: new Date(validation.data.effectiveDate),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
      };

      const plan = await storage.createShiftPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating shift plan:", error);
      res.status(500).json({ error: "Failed to create shift plan" });
    }
  });

  app.put("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertShiftPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid shift plan data", details: validation.error.errors });
      }

      const plan = await storage.updateShiftPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating shift plan:", error);
      res.status(500).json({ error: "Failed to update shift plan" });
    }
  });

  app.delete("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteShiftPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift plan:", error);
      res.status(500).json({ error: "Failed to delete shift plan" });
    }
  });

  // Equipment Plans
  app.get("/api/equipment-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getEquipmentPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching equipment plans:", error);
      res.status(500).json({ error: "Failed to fetch equipment plans" });
    }
  });

  app.get("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getEquipmentPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching equipment plan:", error);
      res.status(500).json({ error: "Failed to fetch equipment plan" });
    }
  });

  app.post("/api/equipment-plans", async (req, res) => {
    try {
      const validation = insertEquipmentPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid equipment plan data", details: validation.error.errors });
      }

      const plan = await storage.createEquipmentPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating equipment plan:", error);
      res.status(500).json({ error: "Failed to create equipment plan" });
    }
  });

  app.put("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertEquipmentPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid equipment plan data", details: validation.error.errors });
      }

      const plan = await storage.updateEquipmentPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating equipment plan:", error);
      res.status(500).json({ error: "Failed to update equipment plan" });
    }
  });

  app.delete("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteEquipmentPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting equipment plan:", error);
      res.status(500).json({ error: "Failed to delete equipment plan" });
    }
  });

  // Capacity Projections
  app.get("/api/capacity-projections", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const projections = await storage.getCapacityProjections(scenarioId);
      res.json(projections);
    } catch (error) {
      console.error("Error fetching capacity projections:", error);
      res.status(500).json({ error: "Failed to fetch capacity projections" });
    }
  });

  app.get("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const projection = await storage.getCapacityProjection(id);
      if (!projection) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json(projection);
    } catch (error) {
      console.error("Error fetching capacity projection:", error);
      res.status(500).json({ error: "Failed to fetch capacity projection" });
    }
  });

  app.post("/api/capacity-projections", async (req, res) => {
    try {
      const validation = insertCapacityProjectionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity projection data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        validFromDate: new Date(validation.data.validFromDate),
        validToDate: new Date(validation.data.validToDate)
      };

      const projection = await storage.createCapacityProjection(data);
      res.status(201).json(projection);
    } catch (error) {
      console.error("Error creating capacity projection:", error);
      res.status(500).json({ error: "Failed to create capacity projection" });
    }
  });

  app.put("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const validation = insertCapacityProjectionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity projection data", details: validation.error.errors });
      }

      const projection = await storage.updateCapacityProjection(id, validation.data);
      if (!projection) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json(projection);
    } catch (error) {
      console.error("Error updating capacity projection:", error);
      res.status(500).json({ error: "Failed to update capacity projection" });
    }
  });

  app.delete("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const success = await storage.deleteCapacityProjection(id);
      if (!success) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting capacity projection:", error);
      res.status(500).json({ error: "Failed to delete capacity projection" });
    }
  });

  // Business Goals
  app.get("/api/business-goals", async (req, res) => {
    try {
      const goals = await storage.getBusinessGoals();
      res.json(goals);
    } catch (error) {
      console.error("Error fetching business goals:", error);
      res.status(500).json({ error: "Failed to fetch business goals" });
    }
  });

  app.get("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const goal = await storage.getBusinessGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error fetching business goal:", error);
      res.status(500).json({ error: "Failed to fetch business goal" });
    }
  });

  app.post("/api/business-goals", async (req, res) => {
    try {
      const validation = insertBusinessGoalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid business goal data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        startDate: new Date(validation.data.startDate),
        targetDate: new Date(validation.data.targetDate)
      };

      const goal = await storage.createBusinessGoal(data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating business goal:", error);
      res.status(500).json({ error: "Failed to create business goal" });
    }
  });

  app.put("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const validation = insertBusinessGoalSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid business goal data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.targetDate) data.targetDate = new Date(data.targetDate);

      const goal = await storage.updateBusinessGoal(id, data);
      if (!goal) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error updating business goal:", error);
      res.status(500).json({ error: "Failed to update business goal" });
    }
  });

  app.delete("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const success = await storage.deleteBusinessGoal(id);
      if (!success) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting business goal:", error);
      res.status(500).json({ error: "Failed to delete business goal" });
    }
  });

  // Goal Progress
  app.get("/api/goal-progress", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const progress = await storage.getGoalProgress(goalId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching goal progress:", error);
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });

  app.post("/api/goal-progress", async (req, res) => {
    try {
      const validation = insertGoalProgressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal progress data", details: validation.error.errors });
      }

      const progress = await storage.createGoalProgress(validation.data);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating goal progress:", error);
      res.status(500).json({ error: "Failed to create goal progress" });
    }
  });

  // Goal Risks
  app.get("/api/goal-risks", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const risks = await storage.getGoalRisks(goalId);
      res.json(risks);
    } catch (error) {
      console.error("Error fetching goal risks:", error);
      res.status(500).json({ error: "Failed to fetch goal risks" });
    }
  });

  app.post("/api/goal-risks", async (req, res) => {
    try {
      const validation = insertGoalRiskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal risk data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.mitigation_deadline) data.mitigation_deadline = new Date(data.mitigation_deadline);

      const risk = await storage.createGoalRisk(data);
      res.status(201).json(risk);
    } catch (error) {
      console.error("Error creating goal risk:", error);
      res.status(500).json({ error: "Failed to create goal risk" });
    }
  });

  // Goal Issues
  app.get("/api/goal-issues", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const issues = await storage.getGoalIssues(goalId);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching goal issues:", error);
      res.status(500).json({ error: "Failed to fetch goal issues" });
    }
  });

  app.post("/api/goal-issues", async (req, res) => {
    try {
      const validation = insertGoalIssueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal issue data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.estimatedResolutionDate) data.estimatedResolutionDate = new Date(data.estimatedResolutionDate);
      if (data.actualResolutionDate) data.actualResolutionDate = new Date(data.actualResolutionDate);

      const issue = await storage.createGoalIssue(data);
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating goal issue:", error);
      res.status(500).json({ error: "Failed to create goal issue" });
    }
  });

  // Goal KPIs
  app.get("/api/goal-kpis", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const kpis = await storage.getGoalKpis(goalId);
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching goal KPIs:", error);
      res.status(500).json({ error: "Failed to fetch goal KPIs" });
    }
  });

  app.post("/api/goal-kpis", async (req, res) => {
    try {
      const validation = insertGoalKpiSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal KPI data", details: validation.error.errors });
      }

      const kpi = await storage.createGoalKpi(validation.data);
      res.status(201).json(kpi);
    } catch (error) {
      console.error("Error creating goal KPI:", error);
      res.status(500).json({ error: "Failed to create goal KPI" });
    }
  });

  // Goal Actions
  app.get("/api/goal-actions", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const actions = await storage.getGoalActions(goalId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching goal actions:", error);
      res.status(500).json({ error: "Failed to fetch goal actions" });
    }
  });

  app.post("/api/goal-actions", async (req, res) => {
    try {
      const validation = insertGoalActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal action data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.targetDate) data.targetDate = new Date(data.targetDate);
      if (data.completedDate) data.completedDate = new Date(data.completedDate);

      const action = await storage.createGoalAction(data);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating goal action:", error);
      res.status(500).json({ error: "Failed to create goal action" });
    }
  });

  // User Management API Routes

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error during authentication:", error);
      res.status(500).json({ error: "Failed to authenticate user" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users-with-roles", async (req, res) => {
    try {
      const users = await storage.getUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      res.status(500).json({ error: "Failed to fetch users with roles" });
    }
  });

  app.get("/api/users/:id/with-roles", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUserWithRoles(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user with roles:", error);
      res.status(500).json({ error: "Failed to fetch user with roles" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.updateUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Get individual role by ID
  app.get("/api/roles/:roleId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const role = await storage.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // Get all system roles for role demonstration (trainers only) - MUST be before /api/roles/:id
  app.get("/api/roles/all", async (req, res) => {
    try {
      console.log("=== ROLES/ALL ENDPOINT ===");
      console.log("Authorization header:", req.headers.authorization);
      console.log("Session userId:", req.session?.userId);
      
      let userId = req.session?.userId;
      
      // Check for token in Authorization header if session fails
      if (!userId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2 && tokenParts[0] === 'user') {
          userId = parseInt(tokenParts[1]);
          console.log("Token userId:", userId);
        }
      }
      
      if (!userId) {
        console.log("No userId found, returning 401");
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("Checking training permissions for userId:", userId);
      
      // Check if user's originally assigned roles have training permissions
      // This allows trainers/systems managers to access training features even while demonstrating other roles
      const userAssignedRoles = await storage.getUserRoles(userId);
      console.log("User assigned roles:", userAssignedRoles.map((r: any) => `${r.id}:${r.name}`));
      
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      console.log("Has trainer/systems manager role:", hasTrainerRole);
      
      if (!hasTrainerRole) {
        return res.status(403).json({ error: "User does not have role demonstration permissions" });
      }

      console.log("Fetching all roles with permission count...");
      const allRoles = await storage.getAllRolesWithPermissionCount();
      console.log("All roles fetched:", allRoles.length, "roles");
      res.json(allRoles);
    } catch (error) {
      console.error("Error fetching all roles:", error);
      res.status(500).json({ error: "Failed to fetch all roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validation = insertRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role data", details: validation.error.errors });
      }

      const role = await storage.createRole(validation.data);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const validation = insertRoleSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role data", details: validation.error.errors });
      }

      const role = await storage.updateRole(id, validation.data);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Permissions
  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/feature/:feature", async (req, res) => {
    try {
      const feature = req.params.feature;
      const permissions = await storage.getPermissionsByFeature(feature);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions by feature:", error);
      res.status(500).json({ error: "Failed to fetch permissions by feature" });
    }
  });

  app.post("/api/permissions", async (req, res) => {
    try {
      const validation = insertPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid permission data", details: validation.error.errors });
      }

      const permission = await storage.createPermission(validation.data);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.put("/api/permissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid permission ID" });
      }

      const validation = insertPermissionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid permission data", details: validation.error.errors });
      }

      const permission = await storage.updatePermission(id, validation.data);
      if (!permission) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  app.delete("/api/permissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid permission ID" });
      }

      const success = await storage.deletePermission(id);
      if (!success) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ error: "Failed to delete permission" });
    }
  });

  // User Role Assignment
  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.post("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertUserRoleSchema.safeParse({
        ...req.body,
        userId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user role data", details: validation.error.errors });
      }

      const userRole = await storage.assignUserRole(validation.data);
      res.status(201).json(userRole);
    } catch (error) {
      console.error("Error assigning user role:", error);
      res.status(500).json({ error: "Failed to assign user role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      if (isNaN(userId) || isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid user ID or role ID" });
      }

      const success = await storage.removeUserRole(userId, roleId);
      if (!success) {
        return res.status(404).json({ error: "User role assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user role:", error);
      res.status(500).json({ error: "Failed to remove user role" });
    }
  });

  // Role Permission Assignment
  app.get("/api/roles/:roleId/permissions", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/roles/:roleId/permissions", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const validation = insertRolePermissionSchema.safeParse({
        ...req.body,
        roleId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role permission data", details: validation.error.errors });
      }

      const rolePermission = await storage.assignRolePermission(validation.data);
      res.status(201).json(rolePermission);
    } catch (error) {
      console.error("Error assigning role permission:", error);
      res.status(500).json({ error: "Failed to assign role permission" });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ error: "Invalid role ID or permission ID" });
      }

      const success = await storage.removeRolePermission(roleId, permissionId);
      if (!success) {
        return res.status(404).json({ error: "Role permission assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing role permission:", error);
      res.status(500).json({ error: "Failed to remove role permission" });
    }
  });

  // Permission Checking
  app.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.get("/api/users/:userId/permissions/check", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { feature, action } = req.query;
      
      if (isNaN(userId) || !feature || !action) {
        return res.status(400).json({ error: "User ID, feature, and action are required" });
      }

      const hasPermission = await storage.hasPermission(userId, feature as string, action as string);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({ error: "Failed to check user permission" });
    }
  });

  // Role Management API routes
  app.get("/api/roles-management", async (req, res) => {
    try {
      const roles = await storage.getRolesWithPermissionsAndUserCount();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles for management:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles-management", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "Role name and permissions array are required" });
      }

      const role = await storage.createRoleWithPermissions({ name, description: description || "" }, permissions);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.patch("/api/roles-management/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const { name, description, permissions } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "Role name and permissions array are required" });
      }

      const role = await storage.updateRoleWithPermissions(id, { name, description: description || "" }, permissions);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles-management/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      // Check if role has users assigned
      const roleWithUsers = await storage.getRoleWithUserCount(id);
      if (!roleWithUsers) {
        return res.status(404).json({ error: "Role not found" });
      }

      if (roleWithUsers.userCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete role. It is assigned to ${roleWithUsers.userCount} users.` 
        });
      }

      if (roleWithUsers.isSystemRole) {
        return res.status(400).json({ error: "Cannot delete system roles" });
      }

      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Role Switching API for Trainers and Systems Managers
  app.get("/api/users/:userId/available-roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user's originally assigned roles include trainer or systems manager
      const userAssignedRoles = await storage.getUserRoles(userId);
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      if (!hasTrainerRole) {
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching available roles:", error);
      res.status(500).json({ error: "Failed to fetch available roles" });
    }
  });

  // Get assigned roles (all roles assigned to user - used for training mode detection)
  app.get("/api/users/:userId/assigned-roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Allow users to check their own assigned roles regardless of current active role
      // This is needed for training mode detection
      const roles = await storage.getUserRoles(userId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching assigned roles:", error);
      res.status(500).json({ error: "Failed to fetch assigned roles" });
    }
  });

  app.post("/api/users/:userId/switch-role", async (req, res) => {
    console.log(`=== ROLE SWITCH ENDPOINT HIT ===`);
    console.log(`Request body:`, req.body);
    console.log(`User ID param:`, req.params.userId);
    console.log(`Session userId:`, req.session?.userId);
    console.log(`Authorization header:`, req.headers.authorization);
    
    try {
      // First, authenticate the user (same logic as /api/auth/me)
      let authenticatedUserId = req.session?.userId;
      
      // Check for token in Authorization header if session fails
      if (!authenticatedUserId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2 && tokenParts[0] === 'user') {
          authenticatedUserId = parseInt(tokenParts[1]);
          console.log("Token userId:", authenticatedUserId);
        }
      }
      
      if (!authenticatedUserId) {
        console.log("No authenticated userId found, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;
      
      console.log(`Parsed User ID: ${userId}, Role ID: ${roleId}`);
      console.log(`Authenticated User ID: ${authenticatedUserId}`);
      
      // Ensure user can only switch their own role
      if (authenticatedUserId !== userId) {
        console.log(`User ${authenticatedUserId} trying to switch role for user ${userId} - denied`);
        return res.status(403).json({ error: "Can only switch your own role" });
      }
      
      if (isNaN(userId) || isNaN(roleId)) {
        console.log(`Invalid parameters: userId=${userId}, roleId=${roleId}`);
        return res.status(400).json({ error: "Invalid user ID or role ID" });
      }

      // Get user's originally assigned roles (not their current active role)
      const userAssignedRoles = await storage.getUserRoles(userId);
      console.log(`User assigned roles:`, userAssignedRoles.map((r: any) => `${r.id}:${r.name}`));
      
      const isReturningToAssignedRole = userAssignedRoles.some((role: any) => role.id === roleId);
      console.log(`Is returning to assigned role: ${isReturningToAssignedRole}`);
      
      if (isReturningToAssignedRole) {
        // Always allow returning to originally assigned roles (training mode exit)
        console.log(`✓ Allowing return to assigned role: ${roleId}`);
        const updatedUser = await storage.switchUserRole(userId, roleId);
        res.json(updatedUser);
        return;
      }

      // For switching to demonstration roles, check if user has trainer/systems manager assigned
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      console.log(`User has trainer/systems manager role: ${hasTrainerRole}`);
      
      if (!hasTrainerRole) {
        console.log(`✗ Denying role switch - no trainer permissions`);
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      console.log(`✓ Allowing demonstration role switch to: ${roleId}`);
      // For training purposes, allow switching to any role without assignment check
      const updatedUser = await storage.switchUserRole(userId, roleId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error switching user role:", error);
      res.status(500).json({ error: "Failed to switch role" });
    }
  });

  app.get("/api/users/:userId/current-role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const currentRole = await storage.getUserCurrentRole(userId);
      res.json(currentRole);
    } catch (error) {
      console.error("Error fetching current role:", error);
      res.status(500).json({ error: "Failed to fetch current role" });
    }
  });

  // Permissions grouped by feature for role management
  app.get("/api/permissions/grouped", async (req, res) => {
    try {
      const permissions = await storage.getPermissionsGroupedByFeature();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching grouped permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Visual Factory routes
  app.get('/api/visual-factory/displays', async (req, res) => {
    try {
      const displays = await storage.getVisualFactoryDisplays();
      res.json(displays);
    } catch (error) {
      console.error('Error fetching visual factory displays:', error);
      res.status(500).json({ error: 'Failed to fetch displays' });
    }
  });

  app.get('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const display = await storage.getVisualFactoryDisplay(id);
      if (!display) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json(display);
    } catch (error) {
      console.error('Error fetching visual factory display:', error);
      res.status(500).json({ error: 'Failed to fetch display' });
    }
  });

  app.post('/api/visual-factory/displays', async (req, res) => {
    try {
      const display = await storage.createVisualFactoryDisplay(req.body);
      res.json(display);
    } catch (error) {
      console.error('Error creating visual factory display:', error);
      res.status(500).json({ error: 'Failed to create display' });
    }
  });

  app.put('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const display = await storage.updateVisualFactoryDisplay(id, req.body);
      if (!display) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json(display);
    } catch (error) {
      console.error('Error updating visual factory display:', error);
      res.status(500).json({ error: 'Failed to update display' });
    }
  });

  app.delete('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVisualFactoryDisplay(id);
      if (!success) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting visual factory display:', error);
      res.status(500).json({ error: 'Failed to delete display' });
    }
  });

  // Demo Tour Participants Routes
  app.get('/api/demo-tour-participants', async (req, res) => {
    try {
      const participants = await storage.getDemoTourParticipants();
      res.json(participants);
    } catch (error) {
      console.error('Error fetching demo tour participants:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participants' });
    }
  });

  app.get('/api/demo-tour-participants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const participant = await storage.getDemoTourParticipant(id);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error fetching demo tour participant:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participant' });
    }
  });

  app.get('/api/demo-tour-participants/email/:email', async (req, res) => {
    try {
      const email = req.params.email;
      const participant = await storage.getDemoTourParticipantByEmail(email);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error fetching demo tour participant by email:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participant' });
    }
  });

  app.post('/api/demo-tour-participants', async (req, res) => {
    try {
      console.log('Creating demo tour participant with data:', req.body);
      const parsedData = insertDemoTourParticipantSchema.parse(req.body);
      console.log('Parsed data:', parsedData);
      const participant = await storage.createDemoTourParticipant(parsedData);
      console.log('Participant created successfully:', participant);
      res.status(201).json(participant);
    } catch (error) {
      console.error('Error creating demo tour participant:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ error: 'Failed to create demo tour participant', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/demo-tour-participants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertDemoTourParticipantSchema.partial().parse(req.body);
      const participant = await storage.updateDemoTourParticipant(id, parsedData);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error updating demo tour participant:', error);
      res.status(500).json({ error: 'Failed to update demo tour participant' });
    }
  });

  app.post('/api/demo-tour-participants/:id/complete', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { feedback } = req.body;
      const participant = await storage.completeDemoTour(id, feedback);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error completing demo tour:', error);
      res.status(500).json({ error: 'Failed to complete demo tour' });
    }
  });

  app.post('/api/demo-tour-participants/:id/steps', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = req.body;
      const success = await storage.addTourStep(id, step);
      if (!success) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding tour step:', error);
      res.status(500).json({ error: 'Failed to add tour step' });
    }
  });

  // Voice Recordings Cache API routes
  app.get('/api/voice-cache/:textHash', async (req, res) => {
    try {
      const textHash = req.params.textHash;
      const recording = await storage.getVoiceRecording(textHash);
      
      if (!recording) {
        return res.status(404).json({ error: 'Voice recording not found' });
      }

      // Update usage count
      await storage.updateVoiceRecordingUsage(recording.id);
      
      res.json({
        id: recording.id,
        audioData: recording.audioData,
        voice: recording.voice,
        duration: recording.duration,
        usageCount: recording.usageCount + 1
      });
    } catch (error) {
      console.error('Error fetching cached voice recording:', error);
      res.status(500).json({ error: 'Failed to fetch cached voice recording' });
    }
  });

  app.post('/api/voice-cache', async (req, res) => {
    try {
      const validation = insertVoiceRecordingsCacheSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid voice recording data', details: validation.error.errors });
      }

      // Create text hash for caching
      const textHash = crypto.createHash('sha256').update(validation.data.textHash).digest('hex');
      
      const recordingData = {
        ...validation.data,
        textHash,
        fileSize: Buffer.byteLength(validation.data.audioData, 'base64')
      };

      const recording = await storage.createVoiceRecording(recordingData);
      res.status(201).json(recording);
    } catch (error) {
      console.error('Error creating voice recording cache:', error);
      res.status(500).json({ error: 'Failed to create voice recording cache' });
    }
  });

  // Track active voice generation requests to prevent duplicates
  const activeVoiceRequests = new Map<string, Promise<Buffer>>();

  // AI Text-to-Speech endpoint with caching for high-quality voice generation
  app.post("/api/ai/text-to-speech", async (req, res) => {
    try {
      const { text, voice = "alloy", gender = "female", speed = 1.1, role = "demo", stepId = "", cacheOnly = false } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Create hash for cache lookup
      const cacheKey = `${text}-${voice}-${gender}-${speed}`;
      const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');

      // Check cache first - enable caching for permanent voice storage
      console.log(`Checking for existing voice generation or cache for hash: ${textHash}`);
      
      // If this exact request is already being processed, wait for it
      if (activeVoiceRequests.has(textHash)) {
        console.log(`Waiting for existing voice generation request: ${textHash}`);
        try {
          const buffer = await activeVoiceRequests.get(textHash)!;
          res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=7200',
            'X-Content-Type-Options': 'nosniff',
            'X-Voice-Cache': 'deduplicated'
          });
          return res.send(buffer);
        } catch (error) {
          console.error(`Error waiting for existing request: ${error}`);
          // If waiting failed, continue to generate new audio
        }
      }
      // Check database cache for existing recording
      const cachedRecording = await storage.getVoiceRecording(textHash);
      
      if (cachedRecording) {
        console.log(`Found cached recording, usage count: ${cachedRecording.usageCount || 0}`);
        await storage.updateVoiceRecordingUsage(cachedRecording.id);
        
        // Return cached audio
        const audioBuffer = Buffer.from(cachedRecording.audioData, 'base64');
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'public, max-age=7200',
          'X-Content-Type-Options': 'nosniff',
          'X-Voice-Cache': 'hit'
        });
        return res.send(audioBuffer);
      }

      // If cacheOnly is true and no cached recording found, return error
      if (cacheOnly) {
        console.log(`Cache-only request but no cached recording found for hash: ${textHash}`);
        return res.status(404).json({ error: "No cached voice recording found for this text" });
      }

      // Map enhanced voice names to OpenAI voices and adjust speed
      const voiceMapping: { [key: string]: { voice: string, speedModifier: number } } = {
        'alloy': { voice: 'alloy', speedModifier: 1.0 }, // Neutral - Most popular American voice
        'nova': { voice: 'nova', speedModifier: 1.0 }, // Female - Clear American pronunciation  
        'fable': { voice: 'fable', speedModifier: 1.0 }, // Male - Top rated American voice
        'echo': { voice: 'echo', speedModifier: 1.0 }, // Male - Articulate American voice
        'onyx': { voice: 'onyx', speedModifier: 1.0 }, // Male - Deep American voice
        'shimmer': { voice: 'shimmer', speedModifier: 1.0 }, // Female - Bright American accent
        // British-style variations (Note: OpenAI TTS maintains American accent but with refined characteristics)
        'alloy-british': { voice: 'alloy', speedModifier: 0.92 }, // Alex - Neutral, Elegant style
        'nova-british': { voice: 'nova', speedModifier: 0.88 }, // Victoria - Female, Classic style  
        'fable-british': { voice: 'fable', speedModifier: 0.90 }, // William - Male, Distinguished style
        'echo-british': { voice: 'echo', speedModifier: 0.85 }, // James - Male, Refined style
        'onyx-british': { voice: 'onyx', speedModifier: 0.87 }, // Oliver - Male, Deep style
        'shimmer-british': { voice: 'shimmer', speedModifier: 0.93 }, // Emma - Female, Bright style
        // American variations
        'alloy-business': { voice: 'alloy', speedModifier: 0.95 }, // Professional American
        'nova-slow': { voice: 'nova', speedModifier: 0.8 }, // Gentle American
        'fable-fast': { voice: 'fable', speedModifier: 1.3 }, // Dynamic American
        'echo-calm': { voice: 'echo', speedModifier: 0.9 }, // Composed American
        'shimmer-energetic': { voice: 'shimmer', speedModifier: 1.2 } // Energetic American
      };

      const voiceConfig = voiceMapping[voice] || { voice: 'nova', speedModifier: 1.0 };
      const selectedVoice = voiceConfig.voice;
      const adjustedSpeed = speed * voiceConfig.speedModifier;

      // Generate new voice if not cached - create a promise to track this generation
      const voiceGenerationPromise = (async () => {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        console.log(`Generating AI speech for text: "${text.substring(0, 50)}..." using voice: ${selectedVoice}`);

        // Use faster tts-1 model for demo tours to reduce latency
        const model = text.length > 200 ? "tts-1-hd" : "tts-1";
        
        const mp3 = await openai.audio.speech.create({
          model: model,
          voice: selectedVoice as any,
          input: text,
          speed: Math.min(Math.max(adjustedSpeed, 0.25), 4.0)
        });

        return Buffer.from(await mp3.arrayBuffer());
      })();

      // Store the promise to prevent duplicate requests
      activeVoiceRequests.set(textHash, voiceGenerationPromise);
      
      const buffer = await voiceGenerationPromise;
      
      // Clean up the tracking once complete
      activeVoiceRequests.delete(textHash);
      
      // Cache the generated audio for future use
      try {
        const audioData = buffer.toString('base64');
        await storage.createVoiceRecording({
          textHash,
          role,
          stepId,
          voice: selectedVoice,
          audioData,
          fileSize: buffer.length,
          duration: null
        });
        console.log(`Cached new voice recording with hash: ${textHash}`);
      } catch (cacheError) {
        console.error('Error caching voice recording:', cacheError);
        // Continue even if caching fails
      }
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=7200',
        'X-Content-Type-Options': 'nosniff',
        'X-Voice-Cache': 'miss'
      });
      
      res.send(buffer);
    } catch (error) {
      // Clean up tracking on error
      try {
        const cacheKey = `${req.body.text}-${req.body.voice || "alloy"}-${req.body.gender || "female"}-${req.body.speed || 1.1}`;
        const errorTextHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
        activeVoiceRequests.delete(errorTextHash);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      console.error("AI text-to-speech error:", error);
      res.status(500).json({ error: "Failed to generate AI speech" });
    }
  });

  // Pre-generate voice recordings for tour steps
  async function preGenerateVoiceRecordings(role: string, steps: any[]) {
    console.log(`Starting voice pre-generation for ${role} with ${steps.length} steps`);
    
    for (const step of steps) {
      if (step.voiceScript) {
        try {
          // Create enhanced narration text (same logic as in guided-tour.tsx)
          const enhancedText = createEngagingNarration(step, role);
          
          // Generate voice hash 
          const cacheKey = `${enhancedText}-nova-female-1.15`;
          const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
          
          // Check if already cached
          const existingCache = await storage.getVoiceRecording(textHash);
          if (existingCache) {
            console.log(`Voice already cached for step ${step.id}`);
            continue;
          }
          
          // Generate new voice recording
          console.log(`Generating voice for step: ${step.id}`);
          const audioBuffer = await generateTTSAudio(enhancedText, 'nova', 1.15);
          
          // Save to cache
          await storage.saveVoiceRecording({
            textHash,
            role,
            stepId: step.id,
            voice: 'nova',
            audioData: audioBuffer.toString('base64'),
            fileSize: audioBuffer.length,
            duration: Math.ceil(enhancedText.length * 50), // Estimate duration
          });
          
          console.log(`Successfully cached voice for step ${step.id}`);
        } catch (error) {
          console.error(`Failed to pre-generate voice for step ${step.id}:`, error);
        }
      }
    }
    console.log(`Completed voice pre-generation for ${role}`);
  }
  
  // Create engaging narration (same logic as guided-tour.tsx)
  function createEngagingNarration(stepData: any, role: string): string {
    if (stepData.voiceScript) {
      return stepData.voiceScript;
    }
    
    const benefit = Array.isArray(stepData.benefits) && stepData.benefits.length > 0 
      ? stepData.benefits[0] 
      : stepData.description;
    
    return `Let me show you ${stepData.title}. ${stepData.description} ${benefit}`;
  }
  
  // Generate TTS audio using OpenAI
  async function generateTTSAudio(text: string, voice: string = 'nova', speed: number = 1.15): Promise<Buffer> {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any,
      input: text,
      speed: speed,
      response_format: "mp3"
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }

  // Function to get accessible routes for a role
  async function getAccessibleRoutesForRole(roleId: number): Promise<{[key: string]: string}> {
    // Map routes to required permissions
    const routePermissions = {
      '/production-schedule': 'production-scheduling-view', // Main dashboard shows production schedule
      '/analytics': 'analytics-view', 
      '/reports': 'reports-view',
      '/max-ai-assistant': 'ai-assistant-view',
      '/boards': 'boards-view',
      '/shop-floor': 'shop-floor-view',
      '/operator-dashboard': 'operator-dashboard-view',
      '/maintenance': 'maintenance-view',
      '/optimize-orders': 'scheduling-optimizer-view',
      '/erp-import': 'erp-import-view',
      '/plant-manager-dashboard': 'plant-manager-view',
      '/systems-management-dashboard': 'systems-management-view',
      '/capacity-planning': 'capacity-planning-view',
      '/visual-factory': 'visual-factory-view',
      '/business-goals': 'business-goals-view',
      '/role-management': 'role-management-view',
      '/user-role-assignments-page': 'user-management-view',
      '/training': 'training-view',
      '/feedback': 'feedback-view'
    };

    // All system navigation paths
    const allSystemRoutes = {
      '/production-schedule': 'Production Schedule - Main production schedule view with Gantt chart',
      '/analytics': 'Analytics - Performance metrics and insights',
      '/reports': 'Reports - Production reporting and analysis',
      '/max-ai-assistant': 'Max AI Assistant - AI-powered manufacturing assistant',
      '/boards': 'Boards - Job and resource management boards',
      '/shop-floor': 'Shop Floor - Live floor status and resource monitoring',
      '/operator-dashboard': 'Operator Dashboard - Equipment operator interface',
      '/maintenance': 'Maintenance - Equipment maintenance management',
      '/optimize-orders': 'Optimize Orders - Intelligent scheduling optimizer',
      '/erp-import': 'ERP Import - External system data integration',
      '/plant-manager-dashboard': 'Plant Manager Dashboard - Overall plant operations management',
      '/systems-management-dashboard': 'Systems Management Dashboard - System configuration and settings',
      '/capacity-planning': 'Capacity Planning - Resource capacity analysis',
      '/visual-factory': 'Visual Factory - Large screen displays for manufacturing',
      '/business-goals': 'Business Goals - Strategic objectives and KPI tracking',
      '/role-management': 'Role Management - User roles and permissions',
      '/user-role-assignments-page': 'User Role Assignments - User assignments and access control',
      '/training': 'Training - Training modules and role demonstrations',
      '/feedback': 'Feedback - User feedback and suggestions'
    };

    try {
      // Get role by ID using storage interface  
      const role = await storage.getRole(roleId);
      
      if (!role) {
        console.log(`Role not found: ${roleId}, using default routes`);
        return { '/production-schedule': allSystemRoutes['/production-schedule'] }; // Fallback to dashboard only
      }

      // Get role permissions using storage interface
      const rolePermissionsList = await storage.getRolePermissions(role.id);
      const permissionFeatures = rolePermissionsList.map(p => p.feature);
      console.log(`Role ${role.name} has permissions for features:`, permissionFeatures);

      // Filter routes based on permissions
      const accessibleRoutes: {[key: string]: string} = {};
      
      for (const [route, description] of Object.entries(allSystemRoutes)) {
        const requiredPermission = (routePermissions as any)[route];
        
        if (requiredPermission) {
          // Extract feature from permission (e.g., 'production-scheduling-view' -> 'production-scheduling')
          const requiredFeature = requiredPermission.replace('-view', '');
          
          // Use flexible permission matching - check for exact match or related features
          const hasPermission = permissionFeatures.includes(requiredFeature) || 
            permissionFeatures.some(feature => {
              // Flexible matching for common cases
              if (requiredFeature.includes('scheduling') && (feature.includes('production-scheduling') || feature.includes('schedule'))) return true;
              if (requiredFeature.includes('optimization') && feature.includes('schedule-optimization')) return true;
              if (requiredFeature.includes('dashboard') && feature.includes('production-scheduling')) return true;
              if (requiredFeature.includes('analytics') && (feature.includes('reports') || feature.includes('analytics'))) return true;
              return false;
            });
          
          if (hasPermission) {
            accessibleRoutes[route] = description;
            console.log(`✓ Role ${role.name} can access ${route} (${requiredFeature})`);
          } else {
            console.log(`✗ Role ${role.name} cannot access ${route} (missing ${requiredFeature})`);
          }
        } else {
          // Routes without specific permission requirements
          accessibleRoutes[route] = description;
        }
      }

      console.log(`Final accessible routes for ${role.name}:`, Object.keys(accessibleRoutes));
      return accessibleRoutes;
      
    } catch (error) {
      console.error(`Error getting accessible routes for role ID ${roleId}:`, error);
      return { '/': allSystemRoutes['/'] }; // Fallback to dashboard only
    }
  }

  // AI Tour Generation endpoint
  app.post("/api/ai/generate-tour", async (req, res) => {
    try {
      const { roles, guidance } = req.body;
      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({ message: "Roles array is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate role-specific accessible routes
      const roleRoutes: {[role: string]: {[path: string]: string}} = {};
      
      for (const role of roles) {
        // Find role by exact name match (roles now use proper case)
        const roleRecord = await storage.getRoleByName(role);
        if (roleRecord) {
          roleRoutes[role] = await getAccessibleRoutesForRole(roleRecord.id);
        } else {
          console.log(`Role not found for display name: ${role}`);
          roleRoutes[role] = { '/': 'Dashboard - Main production schedule view' };
        }
      }

      let prompt = `Generate comprehensive guided tour content for PlanetTogether manufacturing system for these roles: ${roles.join(', ')}.

IMPORTANT: You MUST ONLY use navigation paths that are accessible to each specific role based on their permissions.

Role-specific accessible navigation paths:
${roles.map(role => {
  const accessibleRoutes = roleRoutes[role];
  return `${role}:\n${Object.entries(accessibleRoutes).map(([path, desc]) => `  - ${path} (${desc})`).join('\n')}`;
}).join('\n\n')}

INTELLIGENT TOUR CREATION GUIDELINES:
1. Analyze each role's accessible routes and select the most valuable features for that role's responsibilities
2. For Production Schedulers: Focus on scheduling, optimization, and planning features
3. For Plant Managers: Emphasize oversight, reporting, and management features  
4. For Directors: Highlight strategic, analytical, and goal-tracking features
5. Adapt tour content based on the role's core job functions and available permissions

PERMISSION MATCHING RULES:
- Use flexible matching when interpreting user guidance - if user mentions "scheduling" look for routes with scheduling, optimization, or planning
- If user mentions "analytics" or "reports" look for reporting, analytics, or dashboard features
- Match user intent to available permissions rather than requiring exact terminology
- Prioritize the most relevant features for each role from their accessible routes

REQUIREMENTS:
1. NEVER include routes that are not listed for that specific role
2. Each role can ONLY visit the pages listed above for that role  
3. Tours must respect role-based access control permissions
4. Use ONLY the role-specific navigation paths listed for each role
5. Create 3-5 engaging tour steps per role covering their most important accessible features
6. IMPORTANT: End each tour by explaining this was a role-specific overview and encourage exploring other role perspectives

For each role, create:
1. 3-5 tour steps covering accessible features only
2. Engaging voice scripts for each step (2-3 sentences each)
3. Clear benefits for each feature (2-3 benefits per step)
4. Use ONLY the role-specific navigation paths listed for each role
5. Final step should mention this covers their role's key features and encourage multi-role exploration

Each tour step must have:
- navigationPath: One of the exact paths accessible to that role (from the role-specific list above)
- stepName: Brief descriptive title (e.g., "Interactive Gantt Chart", "Scheduling Boards", "Optimization Tools")
- description: Clear explanation of what the user will see and do on this page (optimized for tour playbook)
- benefits: Array of 2-3 specific business advantages from using this feature
- voiceScript: Natural narration explaining the step (2-3 sentences, engaging and informative)

TOUR CONCLUSION GUIDELINES:
- The final step should emphasize that this tour covered the most important features for their specific role
- Mention that PlanetTogether has many more features accessible to different roles (Production Schedulers, Plant Managers, Systems Managers, etc.)
- Encourage users to explore other role perspectives to see the full scope of the platform
- Make users aware that what they saw is role-specific and there's much more to discover
- Use language like "This tour showcased the key features for your role as a [Role Name]" and "Explore other roles to see additional capabilities"

Return JSON format with each role as a top-level key containing tourSteps array.`;

      // Add user guidance if provided
      if (guidance && guidance.trim()) {
        prompt += `\n\nAdditional instructions: ${guidance.trim()}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using latest model
        messages: [
          {
            role: "system",
            content: "You are a manufacturing software expert creating guided tours for different user roles. Generate comprehensive, engaging tour content with clear benefits and professional voice narration scripts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      let generatedContent = completion.choices[0].message.content || '';
      
      // Extract JSON content from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        generatedContent = jsonMatch[1];
      }
      
      // Try to parse as JSON, fallback to text response if needed
      let tourData;
      try {
        tourData = JSON.parse(generatedContent);
        console.log("Successfully parsed AI tour data:", Object.keys(tourData));
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError.message);
        console.error("Content to parse:", generatedContent);
        tourData = { content: generatedContent, roles: roles };
      }

      // Save generated tours to database
      const savedTours = [];
      for (const role of roles) {
        const roleKey = role.toLowerCase().replace(/\s+/g, '-');
        const roleKeyPascal = role.replace(/\s+/g, ''); // ProductionScheduler format
        
        // Try different ways to access the tour data based on AI response format
        let roleTourData = null;
        
        // Check for nested roles structure (roles.Director.tourSteps)
        if (tourData.roles && tourData.roles[role]) {
          roleTourData = tourData.roles[role];
        }
        // Check for PascalCase key (ProductionScheduler)
        else if (tourData[roleKeyPascal]) {
          roleTourData = tourData[roleKeyPascal];
        }
        // Check for PascalCase key with "Tour" suffix (ProductionSchedulerTour)
        else if (tourData[roleKeyPascal + 'Tour']) {
          roleTourData = tourData[roleKeyPascal + 'Tour'];
        }
        // Check for direct role key with spaces
        else if (tourData[role]) {
          roleTourData = tourData[role];
        }
        // Check for lowercase-dash key
        else if (tourData[roleKey]) {
          roleTourData = tourData[roleKey];
        }
        // Fallback to using the whole tourData if it has steps directly
        else if (tourData.steps || tourData.tourSteps) {
          roleTourData = tourData;
        }
        else {
          console.log(`No role data found for ${role}. Available keys:`, Object.keys(tourData));
        }
        
        // Handle both 'steps' and 'tourSteps' property names
        const steps = roleTourData?.steps || roleTourData?.tourSteps || [];
        console.log(`Extracted ${steps.length} steps for ${role}`);
        
        if (steps && steps.length > 0) {
          try {
            // Get role ID for this role display name - use proper case name directly
            const roleRecord = await storage.getRoleByName(role);
            if (!roleRecord) {
              console.error(`Role not found for name: ${role}`);
              continue;
            }
            
            const tourRecord = await storage.upsertTour({
              roleId: roleRecord.id,
              roleDisplayName: role,
              tourData: {
                steps: steps,
                totalSteps: steps.length,
                estimatedDuration: roleTourData?.estimatedDuration || "5 min",
                voiceScriptCount: steps.filter((s: any) => s.voiceScript).length
              },
              isGenerated: true,
              createdBy: req.user?.id || 'system'
            });
            savedTours.push(tourRecord);
            console.log(`Successfully saved tour for ${role}:`, tourRecord.id);
            
            // Pre-generate voice recordings for all tour steps
            console.log(`Pre-generating voice recordings for ${role} tour...`);
            await preGenerateVoiceRecordings(role, steps);
          } catch (saveError) {
            console.error(`Error saving tour for ${role}:`, saveError);
          }
        } else {
          console.log(`No valid tour data found for ${role}`, { roleTourData, steps });
        }
      }

      // Validate generated tours
      const validationResults = await validateToursRoutes(savedTours);
      
      res.json({ 
        success: true,
        tourData,
        savedTours,
        validationResults,
        generatedFor: roles,
        message: `Tour content generated and saved for ${roles.length} role(s)`
      });

    } catch (error) {
      console.error("AI Tour generation error:", error);
      
      const errorMessage = error.message || "Unknown error";
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('exceeded');
      
      if (isQuotaError) {
        res.status(429).json({ 
          message: "AI quota exceeded",
          error: errorMessage,
          quotaExceeded: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate tour content",
          error: errorMessage
        });
      }
    }
  });

  // Enhanced function to validate tours comprehensively
  async function validateToursRoutes(tours: any[]): Promise<any> {
    const validationResults = {
      valid: [],
      invalid: [],
      criticalErrors: [],
      summary: {
        totalTours: tours.length,
        validTours: 0,
        invalidTours: 0,
        criticalErrors: 0,
        totalIssues: 0,
        validationCategories: {
          roleIdValidation: 0,
          tourDataStructure: 0,
          stepValidation: 0,
          routeAccessibility: 0,
          dataIntegrity: 0
        }
      }
    };

    // Get all valid roles for validation
    const allRoles = await storage.getRoles();
    const validRoleIds = allRoles.map(role => role.id);

    for (const tour of tours) {
      const tourValidation = {
        tourId: tour.id,
        role: tour.roleDisplayName,
        roleId: tour.roleId,
        issues: [],
        validSteps: [],
        invalidSteps: [],
        criticalErrors: []
      };

      // 1. CRITICAL: Role ID Validation
      if (!tour.roleId || !validRoleIds.includes(tour.roleId)) {
        const criticalError = {
          type: 'CRITICAL_ROLE_ID_INVALID',
          issue: `Tour references invalid role ID: ${tour.roleId}`,
          severity: 'CRITICAL',
          impact: 'Tour cannot function - will cause JavaScript errors',
          suggestion: `Update roleId to one of: ${validRoleIds.join(', ')}`
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.roleIdValidation++;
      }

      // 2. CRITICAL: Tour Data Structure Validation
      if (!tour.tourData) {
        const criticalError = {
          type: 'CRITICAL_NO_TOUR_DATA',
          issue: 'Tour has no tourData field',
          severity: 'CRITICAL',
          impact: 'Tour will not display any steps',
          suggestion: 'Regenerate tour with proper tour data structure'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      } else if (!tour.tourData.steps || !Array.isArray(tour.tourData.steps)) {
        const criticalError = {
          type: 'CRITICAL_NO_STEPS',
          issue: 'Tour data has no steps array',
          severity: 'CRITICAL',
          impact: 'Tour will not display any steps',
          suggestion: 'Regenerate tour with proper steps array'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      } else if (tour.tourData.steps.length === 0) {
        const criticalError = {
          type: 'CRITICAL_EMPTY_STEPS',
          issue: 'Tour has empty steps array',
          severity: 'CRITICAL',
          impact: 'Tour will show no content',
          suggestion: 'Regenerate tour with actual steps'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      }

      // 3. Role-based Route Accessibility (only if role ID is valid)
      if (validRoleIds.includes(tour.roleId)) {
        try {
          const roleAccessibleRoutes = await getAccessibleRoutesForRole(tour.roleId);
          const accessiblePaths = Object.keys(roleAccessibleRoutes);
          
          // Check each tour step for route accessibility
          if (tour.tourData && tour.tourData.steps && Array.isArray(tour.tourData.steps)) {
            for (let i = 0; i < tour.tourData.steps.length; i++) {
              const step = tour.tourData.steps[i];
              
              // 4. Step Structure Validation
              if (!step.stepName && !step.stepTitle && !step.title) {
                tourValidation.issues.push({
                  type: 'STEP_NO_TITLE',
                  stepIndex: i + 1,
                  issue: 'Step has no title/name',
                  severity: 'WARNING',
                  impact: 'Step will show generic title',
                  suggestion: 'Add stepName, stepTitle, or title field'
                });
                validationResults.summary.validationCategories.stepValidation++;
              }

              if (!step.description && !step.voiceScript) {
                tourValidation.issues.push({
                  type: 'STEP_NO_DESCRIPTION',
                  stepIndex: i + 1,
                  stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                  issue: 'Step has no description or voice script',
                  severity: 'WARNING',
                  impact: 'Step will show generic description',
                  suggestion: 'Add description or voiceScript field'
                });
                validationResults.summary.validationCategories.stepValidation++;
              }

              // 5. Route Accessibility Validation
              const navigationPath = step.navigationPath;
              if (navigationPath && navigationPath !== "current") {
                if (accessiblePaths.includes(navigationPath)) {
                  tourValidation.validSteps.push({
                    stepIndex: i + 1,
                    stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                    navigationPath,
                    status: 'valid'
                  });
                } else {
                  const issue = {
                    type: 'ROUTE_NOT_ACCESSIBLE',
                    stepIndex: i + 1,
                    stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                    navigationPath,
                    issue: `Route '${navigationPath}' is not accessible to role '${tour.roleDisplayName}'`,
                    severity: 'ERROR',
                    impact: 'User will see access denied when clicking this step',
                    suggestion: `Replace with accessible route: ${accessiblePaths.slice(0, 3).join(', ')}`
                  };
                  
                  tourValidation.issues.push(issue);
                  tourValidation.invalidSteps.push(issue);
                  validationResults.summary.validationCategories.routeAccessibility++;
                }
              }
            }
          }
        } catch (error) {
          tourValidation.issues.push({
            type: 'ROLE_PERMISSION_CHECK_FAILED',
            issue: `Failed to check permissions for role ID ${tour.roleId}: ${error.message}`,
            severity: 'ERROR',
            impact: 'Cannot validate route accessibility',
            suggestion: 'Check role permissions in database'
          });
          validationResults.summary.validationCategories.roleIdValidation++;
        }
      }

      // 6. Data Integrity Validation
      if (!tour.roleDisplayName) {
        tourValidation.issues.push({
          type: 'MISSING_ROLE_DISPLAY_NAME',
          issue: 'Tour has no roleDisplayName',
          severity: 'WARNING',
          impact: 'Tour will show generic role name',
          suggestion: 'Add roleDisplayName field'
        });
        validationResults.summary.validationCategories.dataIntegrity++;
      }

      if (!tour.id) {
        const criticalError = {
          type: 'CRITICAL_NO_TOUR_ID',
          issue: 'Tour has no ID',
          severity: 'CRITICAL',
          impact: 'Tour cannot be referenced or updated',
          suggestion: 'Ensure tour has unique ID from database'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.dataIntegrity++;
      }

      // Classify tour based on severity of issues
      if (tourValidation.criticalErrors.length > 0) {
        validationResults.criticalErrors.push(tourValidation);
        validationResults.summary.criticalErrors++;
        validationResults.summary.totalIssues += tourValidation.criticalErrors.length + tourValidation.issues.length;
      } else if (tourValidation.issues.length === 0) {
        validationResults.valid.push(tourValidation);
        validationResults.summary.validTours++;
      } else {
        validationResults.invalid.push(tourValidation);
        validationResults.summary.invalidTours++;
        validationResults.summary.totalIssues += tourValidation.issues.length;
      }
    }

    console.log(`Enhanced tour validation completed: ${validationResults.summary.validTours} valid, ${validationResults.summary.invalidTours} invalid, ${validationResults.summary.criticalErrors} critical errors`);
    return validationResults;
  }

  // AI Permission Generation - Preview
  app.post("/api/ai/generate-permissions-preview", requireAuth, async (req, res) => {
    try {
      const { roleIds, description = "" } = req.body;
      
      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({ message: "Role IDs array is required" });
      }

      // Get the selected roles and existing permissions
      const roles = await storage.getRolesByIds(roleIds);
      if (!roles || roles.length === 0) {
        return res.status(404).json({ message: "No roles found for the provided IDs" });
      }

      const allPermissions = await storage.getAllPermissions();
      
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Create role context for AI
      const roleContext = roles.map(role => ({
        name: role.name,
        description: role.description,
        currentPermissions: role.permissions?.map(p => p.name) || []
      }));

      const availablePermissions = allPermissions.map(p => ({
        name: p.name,
        feature: p.feature,
        action: p.action,
        description: p.description
      }));

      const hasSpecificInstructions = description.trim().length > 0;
      
      const prompt = hasSpecificInstructions 
        ? `You are a permission management assistant. Follow the user's specific instructions exactly.

Roles to modify:
${roleContext.map(r => `- ${r.name}: ${r.description || 'No description'}\n  Current permissions: ${r.currentPermissions.join(', ') || 'None'}`).join('\n')}

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

User Instructions: ${description}

IMPORTANT RULES:
1. ONLY add the specific permissions mentioned in the user instructions
2. If the user says "add visual factory permission", only add visual-factory-view permission
3. If the user says "add visual factory and shop floor permissions", only add those two specific permissions
4. Do NOT add additional permissions beyond what the user specifically requested
5. Preserve existing permissions unless specifically told to remove them

Return a JSON object with this structure:
{
  "rolePermissions": {
    "RoleName": ["specific-permission-mentioned-by-user"]
  },
  "reasoning": "Added only the permissions specifically requested by the user",
  "summary": "Brief summary of what will be changed"
}`
        : `You are a permission management assistant. Recommend appropriate permissions based on role names and responsibilities.

Roles to analyze:
${roleContext.map(r => `- ${r.name}: ${r.description || 'No description'}\n  Current permissions: ${r.currentPermissions.join(', ') || 'None'}`).join('\n')}

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

RULES for role-based recommendations:
1. Analyze each role name and determine what permissions are typically needed
2. Follow principle of least privilege - only essential permissions
3. Focus on view permissions primarily, add create/edit/delete only when clearly needed for the role
4. Consider manufacturing workflow and organizational hierarchy

Return a JSON object with this structure:
{
  "rolePermissions": {
    "RoleName": ["recommended-permission-1", "recommended-permission-2"]
  },
  "reasoning": "Explanation of why these permissions fit the role",
  "summary": "Brief summary of recommended changes"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a security and role management expert for manufacturing systems. Assign permissions thoughtfully based on job roles while maintaining security best practices."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      let generatedContent = completion.choices[0].message.content || '';
      
      // Extract JSON content from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        generatedContent = jsonMatch[1];
      }

      let aiResponse;
      try {
        aiResponse = JSON.parse(generatedContent);
      } catch (parseError) {
        console.error("Failed to parse AI permission response:", parseError);
        return res.status(500).json({ message: "AI generated invalid response format" });
      }

      // Generate preview of suggested permissions
      const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
      const previewChanges = [];

      console.log("AI Response:", JSON.stringify(aiResponse, null, 2));
      console.log("Available permission names:", Array.from(permissionMap.keys()));

      for (const role of roles) {
        const suggestedPermissions = aiResponse.rolePermissions?.[role.name] || [];
        console.log(`Processing role ${role.name}, suggested permissions:`, suggestedPermissions);
        
        const permissionDetails = suggestedPermissions
          .map(permName => {
            // Try exact match first
            let id = permissionMap.get(permName);
            let resolvedName = permName;
            
            // If not found, try converting from colon format to dash format
            if (!id && permName.includes(':')) {
              const dashFormat = permName.replace(':', '-');
              id = permissionMap.get(dashFormat);
              if (id) {
                resolvedName = dashFormat;
                console.log(`Converted '${permName}' to '${dashFormat}': found`);
              }
            }
            
            // If still not found, try partial matching by feature name
            if (!id) {
              const featurePart = permName.split(':')[0] || permName.split('-')[0];
              const matchingPermissions = Array.from(permissionMap.keys()).filter(p => p.startsWith(featurePart));
              if (matchingPermissions.length > 0) {
                const viewPerm = matchingPermissions.find(p => p.endsWith('-view'));
                if (viewPerm) {
                  id = permissionMap.get(viewPerm);
                  resolvedName = viewPerm;
                  console.log(`Using view permission '${viewPerm}' for '${permName}'`);
                }
              }
            }
            
            return id ? { 
              originalName: permName, 
              resolvedName, 
              id,
              permission: allPermissions.find(p => p.id === id)
            } : null;
          })
          .filter(item => item !== null);

        if (permissionDetails.length > 0) {
          // Get current permissions for this role (use original role data from roles array which includes permissions)
          const currentPermissionIds = role.permissions?.map(p => p.id) || [];
          const newPermissionIds = permissionDetails.map(p => p.id);
          const actuallyNewPermissions = permissionDetails.filter(p => !currentPermissionIds.includes(p.id));
          
          previewChanges.push({
            roleName: role.name,
            roleId: role.id,
            currentPermissionCount: currentPermissionIds.length,
            newPermissions: actuallyNewPermissions,
            totalPermissionsAfter: Array.from(new Set([...currentPermissionIds, ...newPermissionIds])).length
          });
        }
      }

      res.json({ 
        success: true,
        preview: true,
        summary: aiResponse.summary || "Permission changes ready for review",
        reasoning: aiResponse.reasoning || "AI generated permission recommendations",
        changes: previewChanges,
        hasSpecificInstructions
      });

    } catch (error) {
      console.error("AI permission generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate permissions with AI" 
      });
    }
  });

  // AI Permission Generation - Apply Changes
  app.post("/api/ai/apply-permissions", requireAuth, async (req, res) => {
    try {
      const { changes } = req.body;
      
      if (!changes || !Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ message: "Changes array is required" });
      }

      const appliedChanges = [];

      for (const change of changes) {
        if (change.newPermissions && change.newPermissions.length > 0) {
          // Pass new permissions to storage - it handles additive merging internally
          const newPermissionIds = change.newPermissions.map(p => p.id);
          
          await storage.updateRolePermissions(change.roleId, { permissions: newPermissionIds });
          appliedChanges.push({
            roleName: change.roleName,
            addedPermissions: change.newPermissions.map(p => p.resolvedName),
            addedCount: change.newPermissions.length
          });
          
          console.log(`Applied ${change.newPermissions.length} permissions to role ${change.roleName}`);
        }
      }

      res.json({ 
        success: true, 
        message: "Permissions applied successfully",
        appliedChanges,
        totalRolesModified: appliedChanges.length
      });

    } catch (error) {
      console.error("AI permission application error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to apply permission changes" 
      });
    }
  });

  // AI Role Creation
  app.post("/api/ai/create-role", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get all available permissions for context
      const allPermissions = await storage.getAllPermissions();
      const availablePermissions = allPermissions.map(p => ({
        name: p.name,
        feature: p.feature,
        action: p.action,
        description: p.description
      }));

      const systemPrompt = `You are an AI assistant that creates system roles based on user descriptions. 
      
Given a role description, you must:
1. Create an appropriate role name (e.g., "Quality Manager", "Marketing Coordinator") 
2. Write a clear role description
3. Select appropriate permissions from the available list

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

IMPORTANT RULES:
1. Only select permissions that are actually available in the list above
2. Choose permissions that logically match the role's responsibilities
3. Be conservative - better to give fewer permissions that make sense than too many
4. Consider the principle of least privilege - give only what's needed for the role to function
5. For management roles, include appropriate view permissions but be careful with edit/delete permissions
6. For operational roles, focus on the specific features they need access to

Return a JSON object with this exact structure:
{
  "name": "Role Name",
  "description": "Clear description of what this role does",
  "permissions": ["permission-name-1", "permission-name-2"],
  "reasoning": "Brief explanation of why these permissions were selected"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      let roleData;
      try {
        roleData = JSON.parse(response.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({ message: "AI returned invalid response format" });
      }

      // Validate required fields
      if (!roleData.name || !roleData.description || !Array.isArray(roleData.permissions)) {
        return res.status(500).json({ message: "AI response missing required fields" });
      }

      // Map permission names to IDs and validate they exist
      const permissionIds = [];
      for (const permissionName of roleData.permissions) {
        const permission = allPermissions.find(p => p.name === permissionName);
        if (permission) {
          permissionIds.push(permission.id);
        } else {
          console.warn(`Permission not found: ${permissionName}`);
        }
      }

      // Create the role with permissions
      const newRole = await storage.createRoleWithPermissions({
        name: roleData.name,
        description: roleData.description
      }, permissionIds);

      console.log(`AI created role: ${roleData.name} with ${permissionIds.length} permissions`);

      res.json({
        success: true,
        name: newRole.name,
        description: newRole.description,
        permissionCount: permissionIds.length,
        reasoning: roleData.reasoning,
        role: newRole
      });

    } catch (error) {
      console.error("AI role creation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create role with AI" 
      });
    }
  });

  // Tours API endpoints
  app.get("/api/tours", requireAuth, async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ error: "Failed to fetch tours" });
    }
  });

  // Tour validation endpoint - MUST come before /api/tours/:id route
  app.get("/api/tours/validate", requireAuth, async (req, res) => {
    try {
      // Get all tours
      const allTours = await storage.getTours();
      
      // Validate all tours
      const validationResults = await validateToursRoutes(allTours);
      
      res.json({
        success: true,
        validation: validationResults,
        message: `Validated ${allTours.length} tours: ${validationResults.summary.validTours} valid, ${validationResults.summary.invalidTours} invalid`
      });
      
    } catch (error) {
      console.error("Error validating tours:", error);
      res.status(500).json({ 
        error: "Failed to validate tours",
        details: error.message 
      });
    }
  });

  app.get("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const tour = await storage.getTour(id);
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  // Legacy endpoint for backwards compatibility (role name)
  app.get("/api/tours/role/:role", requireAuth, async (req, res) => {
    try {
      const roleName = req.params.role;
      
      // First get the role ID by role name  
      const role = await storage.getRoleByName(roleName);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const tour = await storage.getTourByRoleId(role.id);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour not found for role" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour by role:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  // New standardized endpoint using role ID
  app.get("/api/tours/role-id/:roleId", requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }
      
      const tour = await storage.getTourByRoleId(roleId);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour not found for role" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour by role ID:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  app.put("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const updatedTour = await storage.updateTour(id, req.body);
      if (!updatedTour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error) {
      console.error("Error updating tour:", error);
      res.status(500).json({ error: "Failed to update tour" });
    }
  });

  app.delete("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const deleted = await storage.deleteTour(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json({ message: "Tour deleted successfully" });
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ error: "Failed to delete tour" });
    }
  });

  // Voice generation for tours endpoint
  app.post('/api/tours/generate-voice', requireAuth, async (req, res) => {
    try {
      const { tours, options } = req.body;
      
      if (!tours || !Array.isArray(tours)) {
        return res.status(400).json({ error: 'Tours array is required' });
      }

      const results = {
        total: 0,
        generated: 0,
        cached: 0,
        errors: []
      };

      for (const tour of tours) {
        try {
          console.log(`Generating voice for tour: ${tour.roleDisplayName}`);
          
          if (!tour.tourData?.steps || !Array.isArray(tour.tourData.steps)) {
            console.log(`No steps found for tour: ${tour.roleDisplayName}`);
            continue;
          }

          for (const step of tour.tourData.steps) {
            results.total++;
            
            try {
              let voiceScript = step.voiceScript || step.description;
              
              // If user requested script regeneration, enhance with AI
              if (options.regenerateScript && options.userInstructions) {
                // Use OpenAI to enhance the script based on user instructions
                const OpenAI = (await import("openai")).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                
                const enhancementResponse = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [{
                    role: "user",
                    content: `Transform this tour step into an engaging voice narration following these instructions: "${options.userInstructions}"
                    
Original step:
Title: ${step.title}
Description: ${step.description}
Benefits: ${step.benefits?.join(', ') || 'None'}
Role: ${tour.roleDisplayName}

Create a natural, conversational voice script that explains this feature to someone in the ${tour.roleDisplayName} role. Keep it under 30 seconds when spoken.`
                  }],
                  max_tokens: 200
                });
                
                voiceScript = enhancementResponse.choices[0]?.message?.content?.trim() || voiceScript;
              }
              
              // Generate voice hash with selected options
              const cacheKey = `${voiceScript}-${options.voice || 'nova'}-${options.gender || 'female'}-${options.speed || 1.0}`;
              const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
              
              // Check if already cached
              const existingCache = await storage.getVoiceRecording(textHash);
              if (existingCache) {
                results.cached++;
                console.log(`Voice already cached for step ${step.id} in ${tour.roleDisplayName}`);
                continue;
              }
              
              // Generate new voice recording
              console.log(`Generating voice for step: ${step.id} in ${tour.roleDisplayName}`);
              const audioBuffer = await generateTTSAudio(
                voiceScript, 
                options.voice || 'nova', 
                options.speed || 1.0
              );
              
              // Save to cache
              await storage.saveVoiceRecording({
                textHash,
                role: tour.roleDisplayName,
                stepId: step.id,
                voice: options.voice || 'nova',
                audioData: audioBuffer.toString('base64'),
                fileSize: audioBuffer.length,
                duration: Math.ceil(voiceScript.length * 50), // Estimate duration
              });
              
              results.generated++;
              console.log(`Successfully generated and cached voice for step ${step.id} in ${tour.roleDisplayName}`);
              
            } catch (stepError) {
              console.error(`Error generating voice for step ${step.id} in ${tour.roleDisplayName}:`, stepError);
              results.errors.push({
                tour: tour.roleDisplayName,
                step: step.id,
                error: stepError.message
              });
            }
          }
          
        } catch (tourError) {
          console.error(`Error processing tour ${tour.roleDisplayName}:`, tourError);
          results.errors.push({
            tour: tour.roleDisplayName,
            error: tourError.message
          });
        }
      }
      
      console.log(`Voice generation completed: ${results.generated} generated, ${results.cached} cached, ${results.errors.length} errors`);
      
      res.json({
        success: true,
        message: `Voice generation completed: ${results.generated} new recordings generated, ${results.cached} already cached`,
        results
      });
      
    } catch (error) {
      console.error('Voice generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate voice recordings',
        details: error.message 
      });
    }
  });

  // Disruption Management API Routes
  
  // Disruptions
  app.get("/api/disruptions", async (req, res) => {
    try {
      const disruptions = await storage.getDisruptions();
      res.json(disruptions);
    } catch (error) {
      console.error("Error fetching disruptions:", error);
      res.status(500).json({ error: "Failed to fetch disruptions" });
    }
  });

  app.get("/api/disruptions/active", async (req, res) => {
    try {
      const disruptions = await storage.getActiveDisruptions();
      res.json(disruptions);
    } catch (error) {
      console.error("Error fetching active disruptions:", error);
      res.status(500).json({ error: "Failed to fetch active disruptions" });
    }
  });

  app.get("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const disruption = await storage.getDisruption(id);
      if (!disruption) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json(disruption);
    } catch (error) {
      console.error("Error fetching disruption:", error);
      res.status(500).json({ error: "Failed to fetch disruption" });
    }
  });

  app.post("/api/disruptions", async (req, res) => {
    try {
      const validation = insertDisruptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption data", details: validation.error.errors });
      }

      const disruption = await storage.createDisruption(validation.data);
      res.status(201).json(disruption);
    } catch (error) {
      console.error("Error creating disruption:", error);
      res.status(500).json({ error: "Failed to create disruption" });
    }
  });

  app.put("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const validation = insertDisruptionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption data", details: validation.error.errors });
      }

      const disruption = await storage.updateDisruption(id, validation.data);
      if (!disruption) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json(disruption);
    } catch (error) {
      console.error("Error updating disruption:", error);
      res.status(500).json({ error: "Failed to update disruption" });
    }
  });

  app.delete("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const success = await storage.deleteDisruption(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption:", error);
      res.status(500).json({ error: "Failed to delete disruption" });
    }
  });

  // Disruption Actions
  app.get("/api/disruption-actions", async (req, res) => {
    try {
      const disruptionId = req.query.disruptionId ? parseInt(req.query.disruptionId as string) : undefined;
      const actions = await storage.getDisruptionActions(disruptionId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching disruption actions:", error);
      res.status(500).json({ error: "Failed to fetch disruption actions" });
    }
  });

  app.get("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const action = await storage.getDisruptionAction(id);
      if (!action) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error fetching disruption action:", error);
      res.status(500).json({ error: "Failed to fetch disruption action" });
    }
  });

  app.post("/api/disruption-actions", async (req, res) => {
    try {
      const validation = insertDisruptionActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption action data", details: validation.error.errors });
      }

      const action = await storage.createDisruptionAction(validation.data);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating disruption action:", error);
      res.status(500).json({ error: "Failed to create disruption action" });
    }
  });

  app.put("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const validation = insertDisruptionActionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption action data", details: validation.error.errors });
      }

      const action = await storage.updateDisruptionAction(id, validation.data);
      if (!action) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error updating disruption action:", error);
      res.status(500).json({ error: "Failed to update disruption action" });
    }
  });

  app.delete("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const success = await storage.deleteDisruptionAction(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption action:", error);
      res.status(500).json({ error: "Failed to delete disruption action" });
    }
  });

  // Disruption Escalations
  app.get("/api/disruption-escalations", async (req, res) => {
    try {
      const disruptionId = req.query.disruptionId ? parseInt(req.query.disruptionId as string) : undefined;
      const escalations = await storage.getDisruptionEscalations(disruptionId);
      res.json(escalations);
    } catch (error) {
      console.error("Error fetching disruption escalations:", error);
      res.status(500).json({ error: "Failed to fetch disruption escalations" });
    }
  });

  app.get("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const escalation = await storage.getDisruptionEscalation(id);
      if (!escalation) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json(escalation);
    } catch (error) {
      console.error("Error fetching disruption escalation:", error);
      res.status(500).json({ error: "Failed to fetch disruption escalation" });
    }
  });

  app.post("/api/disruption-escalations", async (req, res) => {
    try {
      const validation = insertDisruptionEscalationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption escalation data", details: validation.error.errors });
      }

      const escalation = await storage.createDisruptionEscalation(validation.data);
      res.status(201).json(escalation);
    } catch (error) {
      console.error("Error creating disruption escalation:", error);
      res.status(500).json({ error: "Failed to create disruption escalation" });
    }
  });

  app.put("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const validation = insertDisruptionEscalationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption escalation data", details: validation.error.errors });
      }

      const escalation = await storage.updateDisruptionEscalation(id, validation.data);
      if (!escalation) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json(escalation);
    } catch (error) {
      console.error("Error updating disruption escalation:", error);
      res.status(500).json({ error: "Failed to update disruption escalation" });
    }
  });

  app.delete("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const success = await storage.deleteDisruptionEscalation(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption escalation:", error);
      res.status(500).json({ error: "Failed to delete disruption escalation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
