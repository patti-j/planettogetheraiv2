import { Router } from "express";
import { AlertsService } from "../alerts-service";
import { aiAnalysisService } from "../ai-analysis-service";
import { z } from "zod";

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

const router = Router();
const alertsService = new AlertsService();

// Get all alerts with optional filters
router.get("/api/alerts", requireAuth, async (req, res) => {
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

// =============== AI ANALYSIS CONFIGURATION ENDPOINTS ===============
// (Put these BEFORE the generic :id routes to avoid conflicts)

// Get AI analysis configurations
router.get("/api/alerts/ai-analysis-configs", requireAuth, async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const configs = await aiAnalysisService.getAnalysisConfigs(activeOnly);
    res.json(configs);
  } catch (error) {
    console.error("Error fetching AI analysis configs:", error);
    res.status(500).json({ error: "Failed to fetch AI analysis configurations" });
  }
});

// Create new AI analysis configuration
router.post("/api/alerts/ai-analysis-configs", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const configData = {
      ...req.body,
      createdBy: userId
    };
    
    const result = await aiAnalysisService.createAnalysisConfig(configData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating AI analysis config:", error);
    res.status(500).json({ error: "Failed to create AI analysis configuration" });
  }
});

// Run AI analysis manually
router.post("/api/alerts/ai-analysis/:configId/run", requireAuth, async (req, res) => {
  try {
    const configId = parseInt(req.params.configId);
    if (isNaN(configId)) {
      return res.status(400).json({ error: "Invalid configuration ID" });
    }
    
    const result = await aiAnalysisService.runAnalysis(configId, 'manual');
    res.json(result);
  } catch (error) {
    console.error("Error running AI analysis:", error);
    res.status(500).json({ error: "Failed to run AI analysis" });
  }
});

// Get AI analysis run history
router.get("/api/alerts/ai-analysis-history", requireAuth, async (req, res) => {
  try {
    const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const history = await aiAnalysisService.getAnalysisHistory(configId, limit);
    res.json(history);
  } catch (error) {
    console.error("Error fetching AI analysis history:", error);
    res.status(500).json({ error: "Failed to fetch AI analysis history" });
  }
});

// Run all scheduled analyses
router.post("/api/alerts/ai-analysis/run-scheduled", requireAuth, async (req, res) => {
  try {
    const result = await aiAnalysisService.runScheduledAnalyses();
    res.json(result);
  } catch (error) {
    console.error("Error running scheduled analyses:", error);
    res.status(500).json({ error: "Failed to run scheduled analyses" });
  }
});

// Get alert statistics
router.get("/api/alerts/stats", requireAuth, async (req, res) => {
  try {
    const timeRange = req.query.timeRange as string || '24h';
    const stats = await alertsService.getAlertStatistics(timeRange);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching alert statistics:", error);
    res.status(500).json({ error: "Failed to fetch alert statistics" });
  }
});

// Get AI insights for alerts
router.get("/api/alerts/ai-insights", requireAuth, async (req, res) => {
  try {
    const timeRange = req.query.timeRange as string || '24h';
    const insights = await alertsService.getAIInsights(timeRange);
    res.json(insights);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

// Get user AI settings
router.get("/api/alerts/ai-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Return default AI settings for now
    const aiSettings = {
      globalAiEnabled: true,
      confidenceThreshold: 75,
      autoCreateAlerts: true,
      emailNotifications: true,
      smartFiltering: true,
      learningMode: true
    };
    
    res.json(aiSettings);
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    res.status(500).json({ error: "Failed to fetch AI settings" });
  }
});

// Update user AI settings
router.put("/api/alerts/ai-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // For now, just return the updated settings
    const updatedSettings = req.body;
    
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error updating AI settings:", error);
    res.status(500).json({ error: "Failed to update AI settings" });
  }
});

// Get user alert subscriptions
router.get("/api/alerts/subscriptions", requireAuth, async (req, res) => {
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

// Update user alert subscription
router.put("/api/alerts/subscriptions", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    await alertsService.updateUserSubscription(userId, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// Check alert rules endpoint (trigger evaluation manually)
router.post("/api/alerts/check-rules", async (req, res) => {
  try {
    await alertsService.checkAlertRules();
    res.json({ message: "Alert rules checked successfully" });
  } catch (error) {
    console.error("Error checking alert rules:", error);
    res.status(500).json({ error: "Failed to check alert rules" });
  }
});

// Get single alert by ID
router.get("/api/alerts/:id", requireAuth, async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: "Invalid alert ID" });
    }
    const alert = await alertsService.getAlertById(alertId);
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
router.post("/api/alerts", requireAuth, async (req, res) => {
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
router.post("/api/alerts/ai", requireAuth, async (req, res) => {
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
router.post("/api/alerts/:id/acknowledge", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: "Invalid alert ID" });
    }
    
    const alert = await alertsService.acknowledgeAlert(
      alertId,
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
router.post("/api/alerts/:id/resolve", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { resolution, rootCause } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ error: "Resolution is required" });
    }
    
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: "Invalid alert ID" });
    }
    
    const alert = await alertsService.resolveAlert(
      alertId,
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
router.post("/api/alerts/:id/escalate", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { escalateTo, reason } = req.body;
    
    if (!escalateTo || !reason) {
      return res.status(400).json({ error: "Escalate to user and reason are required" });
    }
    
    const alertId = parseInt(req.params.id);
    const escalateToId = parseInt(escalateTo);
    
    if (isNaN(alertId) || isNaN(escalateToId)) {
      return res.status(400).json({ error: "Invalid alert ID or escalate to user ID" });
    }
    
    const alert = await alertsService.escalateAlert(
      alertId,
      escalateToId,
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
router.post("/api/alerts/:id/feedback", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const feedback = {
      ...req.body,
      userId
    };
    
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: "Invalid alert ID" });
    }
    
    const training = await alertsService.trainAIModel(
      alertId,
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
router.post("/api/alert-rules", requireAuth, async (req, res) => {
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
router.put("/api/alert-rules/:id", requireAuth, async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ error: "Invalid rule ID" });
    }
    
    const rule = await alertsService.updateAlertRule(ruleId, req.body);
    res.json(rule);
  } catch (error) {
    console.error("Error updating alert rule:", error);
    res.status(500).json({ error: "Failed to update alert rule" });
  }
});

// Delete alert rule
router.delete("/api/alert-rules/:id", requireAuth, async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ error: "Invalid rule ID" });
    }
    
    await alertsService.deleteAlertRule(ruleId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    res.status(500).json({ error: "Failed to delete alert rule" });
  }
});

// Get alert statistics
router.get("/api/alerts/stats", requireAuth, async (req, res) => {
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

// Get user AI settings
router.get("/api/alerts/ai-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Return default AI settings for now
    const aiSettings = {
      globalAiEnabled: true,
      confidenceThreshold: 75,
      autoCreateAlerts: true,
      emailNotifications: true,
      smartFiltering: true,
      learningMode: true
    };
    
    res.json(aiSettings);
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    res.status(500).json({ error: "Failed to fetch AI settings" });
  }
});

// Update user AI settings
router.put("/api/alerts/ai-settings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // For now, just return the updated settings
    const updatedSettings = req.body;
    
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error updating AI settings:", error);
    res.status(500).json({ error: "Failed to update AI settings" });
  }
});

export default router;