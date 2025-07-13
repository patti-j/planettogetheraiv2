import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCapabilitySchema, insertResourceSchema, insertJobSchema, 
  insertOperationSchema, insertDependencySchema 
} from "@shared/schema";

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
      const operation = insertOperationSchema.partial().parse(req.body);
      const updatedOperation = await storage.updateOperation(id, operation);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(updatedOperation);
    } catch (error) {
      res.status(400).json({ message: "Invalid operation data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
