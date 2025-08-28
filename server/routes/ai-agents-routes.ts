import { Router } from 'express';
import { isAuthenticated } from '../auth-middleware';

const router = Router();

// AI Agent configurations interface
interface AIAgentConfig {
  id: string;
  name: string;
  description: string;
  type: 'assistant' | 'monitoring' | 'optimization' | 'quality' | 'maintenance';
  status: 'active' | 'paused' | 'error';
  settings: {
    frequency?: string;
    mode?: string;
    threshold?: string;
    autoApply?: boolean;
    [key: string]: any;
  };
  lastRun?: Date;
  nextRun?: Date;
}

// Mock AI agents data - in production this would come from database
const aiAgents: AIAgentConfig[] = [
  {
    id: 'max-ai',
    name: 'Max AI Assistant',
    description: 'Main AI assistant for production insights and navigation',
    type: 'assistant',
    status: 'active',
    settings: {
      responseMode: 'proactive',
      analysisFrequency: '5min',
      insightLevel: 'detailed'
    },
    lastRun: new Date(Date.now() - 5 * 60 * 1000),
    nextRun: new Date(Date.now() + 5 * 60 * 1000)
  },
  {
    id: 'system-monitoring',
    name: 'System Monitoring Agent',
    description: 'Monitors system performance and generates alerts',
    type: 'monitoring',
    status: 'active',
    settings: {
      monitoringInterval: '5min',
      alertThreshold: 'medium',
      dataRetention: '30days'
    },
    lastRun: new Date(Date.now() - 3 * 60 * 1000),
    nextRun: new Date(Date.now() + 2 * 60 * 1000)
  },
  {
    id: 'production-optimization',
    name: 'Production Optimization Agent',
    description: 'Analyzes production data and suggests optimizations',
    type: 'optimization',
    status: 'active',
    settings: {
      analysisFrequency: 'hourly',
      optimizationFocus: 'efficiency',
      autoApplyChanges: 'suggest'
    },
    lastRun: new Date(Date.now() - 45 * 60 * 1000),
    nextRun: new Date(Date.now() + 15 * 60 * 1000)
  },
  {
    id: 'quality-analysis',
    name: 'Quality Analysis Agent',
    description: 'Monitors quality metrics and detects anomalies',
    type: 'quality',
    status: 'active',
    settings: {
      samplingRate: 'continuous',
      qualityThreshold: '95',
      alertLevel: 'warning'
    },
    lastRun: new Date(Date.now() - 1 * 60 * 1000),
    nextRun: new Date(Date.now() + 4 * 60 * 1000)
  },
  {
    id: 'predictive-maintenance',
    name: 'Predictive Maintenance Agent',
    description: 'Predicts equipment failures and schedules maintenance',
    type: 'maintenance',
    status: 'paused',
    settings: {
      predictionModel: 'ml',
      forecastWindow: '30days',
      confidenceLevel: '80'
    },
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    nextRun: null
  }
];

// Global agent settings
const globalSettings = {
  masterAIControl: true,
  autoStartAgents: true,
  agentLearningMode: true,
  performanceMode: 'balanced',
  defaultLanguageModel: 'gpt-5',
  responseTimeout: 30
};

// Get all AI agents
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.json({
      success: true,
      agents: aiAgents,
      globalSettings,
      summary: {
        totalAgents: aiAgents.length,
        activeAgents: aiAgents.filter(a => a.status === 'active').length,
        pausedAgents: aiAgents.filter(a => a.status === 'paused').length,
        errorAgents: aiAgents.filter(a => a.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    res.status(500).json({ error: 'Failed to fetch AI agents' });
  }
});

// Get specific AI agent
router.get('/:agentId', isAuthenticated, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = aiAgents.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Error fetching AI agent:', error);
    res.status(500).json({ error: 'Failed to fetch AI agent' });
  }
});

// Update AI agent configuration
router.put('/:agentId', isAuthenticated, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { settings, status } = req.body;
    
    const agentIndex = aiAgents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Update agent settings
    if (settings) {
      aiAgents[agentIndex].settings = { ...aiAgents[agentIndex].settings, ...settings };
    }
    
    // Update agent status
    if (status) {
      aiAgents[agentIndex].status = status;
      
      // Update next run time based on status
      if (status === 'active') {
        aiAgents[agentIndex].nextRun = new Date(Date.now() + 5 * 60 * 1000);
      } else if (status === 'paused') {
        aiAgents[agentIndex].nextRun = null;
      }
    }
    
    res.json({
      success: true,
      agent: aiAgents[agentIndex],
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI agent:', error);
    res.status(500).json({ error: 'Failed to update AI agent' });
  }
});

// Update global agent settings
router.put('/global/settings', isAuthenticated, async (req, res) => {
  try {
    const updates = req.body;
    
    // Update global settings
    Object.assign(globalSettings, updates);
    
    // If master AI control is disabled, pause all agents
    if (updates.masterAIControl === false) {
      aiAgents.forEach(agent => {
        agent.status = 'paused';
        agent.nextRun = null;
      });
    } else if (updates.masterAIControl === true && updates.autoStartAgents) {
      // If master control is enabled and auto-start is on, activate agents
      aiAgents.forEach(agent => {
        if (agent.status === 'paused') {
          agent.status = 'active';
          agent.nextRun = new Date(Date.now() + 5 * 60 * 1000);
        }
      });
    }
    
    res.json({
      success: true,
      globalSettings,
      message: 'Global settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ error: 'Failed to update global settings' });
  }
});

// Start/stop specific agent
router.post('/:agentId/:action', isAuthenticated, async (req, res) => {
  try {
    const { agentId, action } = req.params;
    
    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const agentIndex = aiAgents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    switch (action) {
      case 'start':
        aiAgents[agentIndex].status = 'active';
        aiAgents[agentIndex].nextRun = new Date(Date.now() + 5 * 60 * 1000);
        break;
      case 'stop':
        aiAgents[agentIndex].status = 'paused';
        aiAgents[agentIndex].nextRun = null;
        break;
      case 'restart':
        aiAgents[agentIndex].status = 'active';
        aiAgents[agentIndex].lastRun = new Date();
        aiAgents[agentIndex].nextRun = new Date(Date.now() + 5 * 60 * 1000);
        break;
    }
    
    res.json({
      success: true,
      agent: aiAgents[agentIndex],
      message: `Agent ${action}ed successfully`
    });
  } catch (error) {
    console.error('Error managing AI agent:', error);
    res.status(500).json({ error: 'Failed to manage AI agent' });
  }
});

// Get agent performance metrics
router.get('/:agentId/metrics', isAuthenticated, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = aiAgents.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Mock performance metrics
    const metrics = {
      uptime: '99.8%',
      avgResponseTime: '1.2s',
      successRate: '98.5%',
      tasksCompleted: 1247,
      errorsToday: 2,
      lastError: agent.status === 'error' ? new Date(Date.now() - 2 * 60 * 60 * 1000) : null,
      memoryUsage: '45MB',
      cpuUsage: '12%'
    };
    
    res.json({
      success: true,
      agentId,
      metrics
    });
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    res.status(500).json({ error: 'Failed to fetch agent metrics' });
  }
});

export default router;