import { Router } from "express";
import { AlertsService } from "../alerts-service";
import { z } from "zod";

const router = Router();
const alertsService = new AlertsService();

// Get all alerts with optional filters
router.get("/api/alerts", async (req, res) => {
  try {
    const userId = req.user?.id;
    const filters = {
      status: req.query.status as string,
      severity: req.query.severity as string,
      type: req.query.type as string,
      plantId: req.query.plantId ? parseInt(req.query.plantId as string) : undefined,
      departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
    };
    
    const alerts = await alertsService.getAlerts(userId, filters);
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Get single alert by ID
router.get("/api/alerts/:id", async (req, res) => {
  try {
    const alert = await alertsService.getAlertById(parseInt(req.params.id));
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
});

// Create new alert
router.post("/api/alerts", async (req, res) => {
  try {
    const userId = req.user?.id;
    const alertData = {
      ...req.body,
      userId
    };
    
    const alert = await alertsService.createAlert(alertData);
    res.status(201).json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// Create AI-generated alert
router.post("/api/alerts/ai", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, description, type, context } = req.body;
    
    const result = await alertsService.createAIAlert({
      title,
      description,
      type,
      context,
      userId
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error creating AI alert:", error);
    res.status(500).json({ error: "Failed to create AI alert" });
  }
});

// Acknowledge alert
router.post("/api/alerts/:id/acknowledge", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const alert = await alertsService.acknowledgeAlert(
      parseInt(req.params.id),
      userId,
      req.body.comment
    );
    
    res.json(alert);
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

// Resolve alert
router.post("/api/alerts/:id/resolve", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { resolution, rootCause } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ error: "Resolution is required" });
    }
    
    const alert = await alertsService.resolveAlert(
      parseInt(req.params.id),
      userId,
      resolution,
      rootCause
    );
    
    res.json(alert);
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

// Escalate alert
router.post("/api/alerts/:id/escalate", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { escalateTo, reason } = req.body;
    
    if (!escalateTo || !reason) {
      return res.status(400).json({ error: "Escalate to user and reason are required" });
    }
    
    const alert = await alertsService.escalateAlert(
      parseInt(req.params.id),
      escalateTo,
      userId,
      reason
    );
    
    res.json(alert);
  } catch (error) {
    console.error("Error escalating alert:", error);
    res.status(500).json({ error: "Failed to escalate alert" });
  }
});

// Train AI model with feedback
router.post("/api/alerts/:id/feedback", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const feedback = {
      ...req.body,
      userId
    };
    
    const training = await alertsService.trainAIModel(
      parseInt(req.params.id),
      feedback
    );
    
    res.json(training);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// Get alert rules
router.get("/api/alert-rules", async (req, res) => {
  try {
    const isActive = req.query.active === 'true' ? true : 
                     req.query.active === 'false' ? false : 
                     undefined;
    
    const rules = await alertsService.getAlertRules(isActive);
    res.json(rules);
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    res.status(500).json({ error: "Failed to fetch alert rules" });
  }
});

// Create alert rule
router.post("/api/alert-rules", async (req, res) => {
  try {
    const userId = req.user?.id;
    const ruleData = {
      ...req.body,
      createdBy: userId
    };
    
    const rule = await alertsService.createAlertRule(ruleData);
    res.status(201).json(rule);
  } catch (error) {
    console.error("Error creating alert rule:", error);
    res.status(500).json({ error: "Failed to create alert rule" });
  }
});

// Update alert rule
router.put("/api/alert-rules/:id", async (req, res) => {
  try {
    const rule = await alertsService.updateAlertRule(
      parseInt(req.params.id),
      req.body
    );
    res.json(rule);
  } catch (error) {
    console.error("Error updating alert rule:", error);
    res.status(500).json({ error: "Failed to update alert rule" });
  }
});

// Delete alert rule
router.delete("/api/alert-rules/:id", async (req, res) => {
  try {
    await alertsService.deleteAlertRule(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    res.status(500).json({ error: "Failed to delete alert rule" });
  }
});

// Get alert statistics
router.get("/api/alerts/stats", async (req, res) => {
  try {
    let timeRange;
    
    if (req.query.start && req.query.end) {
      timeRange = {
        start: new Date(req.query.start as string),
        end: new Date(req.query.end as string)
      };
    }
    
    const stats = await alertsService.getAlertStatistics(timeRange);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching alert statistics:", error);
    res.status(500).json({ error: "Failed to fetch alert statistics" });
  }
});

// Get AI insights
router.get("/api/alerts/ai-insights", async (req, res) => {
  try {
    const timeRange = {
      start: req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: req.query.end ? new Date(req.query.end as string) : new Date()
    };
    
    const insights = await alertsService.getAIInsights(timeRange);
    res.json({ insights });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

// Get user subscriptions
router.get("/api/alerts/subscriptions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const subscriptions = await alertsService.getUserSubscriptions(userId);
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// Update user subscriptions
router.put("/api/alerts/subscriptions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const subscription = await alertsService.updateSubscription(userId, req.body);
    res.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// Manually trigger alert rule checking
router.post("/api/alerts/check-rules", async (req, res) => {
  try {
    await alertsService.checkAlertRules();
    res.json({ message: "Alert rules checked successfully" });
  } catch (error) {
    console.error("Error checking alert rules:", error);
    res.status(500).json({ error: "Failed to check alert rules" });
  }
});

export default router;