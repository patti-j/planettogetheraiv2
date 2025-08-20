import { Router } from "express";
import { implementationService } from "../implementation-service";
import { 
  insertImplementationProjectSchema,
  insertImplementationPhaseSchema,
  insertImplementationSopSchema,
  insertImplementationDocumentSchema,
  insertImplementationSignoffSchema,
  insertImplementationTaskSchema,
  insertImplementationCommentSchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// ===== PROJECTS =====

// List all projects
router.get("/projects", async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      projectManager: req.query.projectManager ? Number(req.query.projectManager) : undefined,
      clientCompany: req.query.clientCompany as string
    };
    
    const projects = await implementationService.listProjects(filters);
    res.json(projects);
  } catch (error) {
    console.error("Error listing projects:", error);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// Get single project
router.get("/projects/:id", async (req, res) => {
  try {
    const project = await implementationService.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error getting project:", error);
    res.status(500).json({ error: "Failed to get project" });
  }
});

// Create new project
router.post("/projects", async (req, res) => {
  try {
    const data = insertImplementationProjectSchema.parse(req.body);
    const project = await implementationService.createProject(data);
    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid project data", details: error.errors });
    }
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.put("/projects/:id", async (req, res) => {
  try {
    const data = insertImplementationProjectSchema.partial().parse(req.body);
    const project = await implementationService.updateProject(Number(req.params.id), data);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid project data", details: error.errors });
    }
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Get project dashboard
router.get("/projects/:id/dashboard", async (req, res) => {
  try {
    const dashboard = await implementationService.getProjectDashboard(Number(req.params.id));
    res.json(dashboard);
  } catch (error) {
    console.error("Error getting project dashboard:", error);
    res.status(500).json({ error: "Failed to get project dashboard" });
  }
});

// ===== PHASES =====

// Get project phases
router.get("/projects/:projectId/phases", async (req, res) => {
  try {
    const phases = await implementationService.getPhases(Number(req.params.projectId));
    res.json(phases);
  } catch (error) {
    console.error("Error getting phases:", error);
    res.status(500).json({ error: "Failed to get phases" });
  }
});

// Update phase
router.put("/phases/:id", async (req, res) => {
  try {
    const data = insertImplementationPhaseSchema.partial().parse(req.body);
    const phase = await implementationService.updatePhase(Number(req.params.id), data);
    if (!phase) {
      return res.status(404).json({ error: "Phase not found" });
    }
    res.json(phase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid phase data", details: error.errors });
    }
    console.error("Error updating phase:", error);
    res.status(500).json({ error: "Failed to update phase" });
  }
});

// ===== SOPS =====

// Get SOPs
router.get("/sops", async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      isTemplate: req.query.isTemplate ? req.query.isTemplate === 'true' : undefined
    };
    
    const sops = await implementationService.getSops(filters);
    res.json(sops);
  } catch (error) {
    console.error("Error getting SOPs:", error);
    res.status(500).json({ error: "Failed to get SOPs" });
  }
});

// Create SOP
router.post("/sops", async (req, res) => {
  try {
    const data = insertImplementationSopSchema.parse(req.body);
    const sop = await implementationService.createSop(data);
    res.json(sop);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid SOP data", details: error.errors });
    }
    console.error("Error creating SOP:", error);
    res.status(500).json({ error: "Failed to create SOP" });
  }
});

// Use SOP (increment usage counter)
router.post("/sops/:id/use", async (req, res) => {
  try {
    await implementationService.useSop(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error using SOP:", error);
    res.status(500).json({ error: "Failed to use SOP" });
  }
});

// ===== DOCUMENTS =====

// Get project documents
router.get("/projects/:projectId/documents", async (req, res) => {
  try {
    const filters = {
      phaseId: req.query.phaseId ? Number(req.query.phaseId) : undefined,
      documentType: req.query.documentType as string,
      category: req.query.category as string
    };
    
    const documents = await implementationService.getDocuments(Number(req.params.projectId), filters);
    res.json(documents);
  } catch (error) {
    console.error("Error getting documents:", error);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

// Upload document
router.post("/documents", async (req, res) => {
  try {
    const data = insertImplementationDocumentSchema.parse(req.body);
    const document = await implementationService.uploadDocument(data);
    res.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid document data", details: error.errors });
    }
    console.error("Error uploading document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// ===== SIGNOFFS =====

// Create signoff request
router.post("/signoffs", async (req, res) => {
  try {
    const data = insertImplementationSignoffSchema.parse(req.body);
    const signoff = await implementationService.createSignoff(data);
    res.json(signoff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid signoff data", details: error.errors });
    }
    console.error("Error creating signoff:", error);
    res.status(500).json({ error: "Failed to create signoff" });
  }
});

// Add signature to signoff
router.post("/signoffs/:id/sign", async (req, res) => {
  try {
    const signature = {
      userId: req.body.userId,
      name: req.body.name,
      role: req.body.role,
      comments: req.body.comments || '',
      signature: req.body.signature // base64 or URL
    };
    
    const signoff = await implementationService.addSignature(Number(req.params.id), signature);
    if (!signoff) {
      return res.status(404).json({ error: "Signoff not found" });
    }
    res.json(signoff);
  } catch (error) {
    console.error("Error adding signature:", error);
    res.status(500).json({ error: "Failed to add signature" });
  }
});

// ===== TASKS =====

// Get project tasks
router.get("/projects/:projectId/tasks", async (req, res) => {
  try {
    const filters = {
      phaseId: req.query.phaseId ? Number(req.query.phaseId) : undefined,
      assignedTo: req.query.assignedTo ? Number(req.query.assignedTo) : undefined,
      status: req.query.status as string,
      taskType: req.query.taskType as string
    };
    
    const tasks = await implementationService.getTasks(Number(req.params.projectId), filters);
    res.json(tasks);
  } catch (error) {
    console.error("Error getting tasks:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

// Create task
router.post("/tasks", async (req, res) => {
  try {
    const data = insertImplementationTaskSchema.parse(req.body);
    const task = await implementationService.createTask(data);
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/tasks/:id", async (req, res) => {
  try {
    const data = insertImplementationTaskSchema.partial().parse(req.body);
    const task = await implementationService.updateTask(Number(req.params.id), data);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ===== ACTIVITIES =====

// Get project activities
router.get("/projects/:projectId/activities", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const activities = await implementationService.getActivities(Number(req.params.projectId), limit);
    res.json(activities);
  } catch (error) {
    console.error("Error getting activities:", error);
    res.status(500).json({ error: "Failed to get activities" });
  }
});

// ===== COMMENTS =====

// Get project comments
router.get("/projects/:projectId/comments", async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId ? Number(req.query.entityId) : undefined;
    
    const comments = await implementationService.getComments(Number(req.params.projectId), entityType, entityId);
    res.json(comments);
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

// Add comment
router.post("/comments", async (req, res) => {
  try {
    const data = insertImplementationCommentSchema.parse(req.body);
    const comment = await implementationService.addComment(data);
    res.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid comment data", details: error.errors });
    }
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ===== STATUS REPORTS =====

// Generate AI status report
router.post("/projects/:projectId/reports/generate", async (req, res) => {
  try {
    const reportType = req.body.reportType || 'weekly';
    const report = await implementationService.generateStatusReport(Number(req.params.projectId), reportType);
    res.json(report);
  } catch (error) {
    console.error("Error generating status report:", error);
    res.status(500).json({ error: "Failed to generate status report" });
  }
});

// Get project status reports
router.get("/projects/:projectId/reports", async (req, res) => {
  try {
    const reports = await implementationService.getStatusReports(Number(req.params.projectId));
    res.json(reports);
  } catch (error) {
    console.error("Error getting status reports:", error);
    res.status(500).json({ error: "Failed to get status reports" });
  }
});

export default router;