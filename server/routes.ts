import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCapabilitySchema, insertResourceSchema, insertJobSchema, 
  insertOperationSchema, insertDependencySchema, insertResourceViewSchema,
  insertCustomTextLabelSchema, insertKanbanConfigSchema, insertReportConfigSchema,
  insertDashboardConfigSchema
} from "@shared/schema";
import { processAICommand, transcribeAudio } from "./ai-agent";
import { emailService } from "./email";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
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
        size: "512x512", // Smaller size for faster generation
        quality: "standard",
      });
      
      const imageUrl = response.data[0].url;
      res.json({ imageUrl, resourceId });
    } catch (error) {
      console.error("AI Image generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate image" 
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
