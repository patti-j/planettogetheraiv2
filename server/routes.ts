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
  insertUserRoleSchema, insertRolePermissionSchema
} from "@shared/schema";
import { processAICommand, transcribeAudio } from "./ai-agent";
import { emailService } from "./email";
import multer from "multer";
import session from "express-session";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";

// Session interface is declared in index.ts

// Session is now configured in index.ts

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware is configured in index.ts

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserWithRolesAndPermissions(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
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
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserWithRolesAndPermissions(userId);
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

      // Check if user has training permissions (trainer or systems manager)
      const hasTrainingPermission = await storage.hasPermission(userId, 'training', 'view');
      if (!hasTrainingPermission) {
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching available roles:", error);
      res.status(500).json({ error: "Failed to fetch available roles" });
    }
  });

  app.post("/api/users/:userId/switch-role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;
      
      if (isNaN(userId) || isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid user ID or role ID" });
      }

      // Check if user has training permissions
      const hasTrainingPermission = await storage.hasPermission(userId, 'training', 'view');
      if (!hasTrainingPermission) {
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      // Verify user has this role assigned
      const userRoles = await storage.getUserRoles(userId);
      const hasRole = userRoles.some(role => role.id === roleId);
      if (!hasRole) {
        return res.status(403).json({ error: "User is not assigned to this role" });
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
