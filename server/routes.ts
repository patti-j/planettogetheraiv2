import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCapabilitySchema, insertResourceSchema, insertJobSchema, 
  insertOperationSchema, insertDependencySchema, insertResourceViewSchema,
  insertCustomTextLabelSchema
} from "@shared/schema";
import { processAICommand, transcribeAudio } from "./ai-agent";
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

  const httpServer = createServer(app);
  return httpServer;
}
