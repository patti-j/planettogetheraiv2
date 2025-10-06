import { Router, Request, Response } from 'express';
import { agentTrainingLoader } from '../services/agent-training-loader';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Get all agent training documents (for developers)
router.get('/agent-training', (_req: Request, res: Response) => {
  try {
    const trainings = agentTrainingLoader.getAllTrainings();
    res.json({
      success: true,
      trainings: trainings.map(t => ({
        agentId: t.agentId,
        name: t.name,
        role: t.role,
        personality: t.personality,
        lastUpdated: t.lastUpdated
      }))
    });
  } catch (error) {
    console.error('[Agent Training] Error fetching trainings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent trainings'
    });
  }
});

// Get specific agent training document
router.get('/agent-training/:agentId', (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const training = agentTrainingLoader.getTraining(agentId);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: `Training not found for agent: ${agentId}`
      });
    }
    
    res.json({
      success: true,
      training
    });
  } catch (error) {
    console.error('[Agent Training] Error fetching training:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent training'
    });
  }
});

// Get raw markdown content (for viewing/editing)
router.get('/agent-training/:agentId/raw', (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const training = agentTrainingLoader.getTraining(agentId);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: `Training not found for agent: ${agentId}`
      });
    }
    
    res.type('text/markdown').send(training.rawContent);
  } catch (error) {
    console.error('[Agent Training] Error fetching raw training:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch raw training document'
    });
  }
});

// List available training documents
router.get('/agent-training-files', (_req: Request, res: Response) => {
  try {
    const trainingDir = join(process.cwd(), 'server/training/agents');
    const files = readdirSync(trainingDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        filename: f,
        agentId: f.replace('.md', '').replace('-agent', '').replace(/-/g, '_'),
        path: `/api/agent-training/${f.replace('.md', '').replace('-agent', '').replace(/-/g, '_')}`
      }));
    
    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('[Agent Training] Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list training files'
    });
  }
});

// Reload training documents (for development)
router.post('/agent-training/reload', (_req: Request, res: Response) => {
  try {
    agentTrainingLoader.reloadAllTrainings();
    const trainings = agentTrainingLoader.getAllTrainings();
    
    res.json({
      success: true,
      message: `Reloaded ${trainings.length} agent training documents`,
      agents: trainings.map(t => t.agentId)
    });
  } catch (error) {
    console.error('[Agent Training] Error reloading trainings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reload trainings'
    });
  }
});

export default router;