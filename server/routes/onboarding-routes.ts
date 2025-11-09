import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { 
  plantOnboarding, 
  onboardingTemplates,
  plantOnboardingPhases,
  plantOnboardingTasks,
  plantOnboardingMetrics,
  plantOnboardingDocuments,
  onboardingAIRecommendations,
  onboardingRequirements,
  ptPlants
} from '@shared/schema';
import { eq, sql, and, or } from 'drizzle-orm';
import { onboardingAIService, SAMPLE_TEMPLATES } from '../services/onboarding-ai-service';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and DOCX files are allowed.'));
    }
  }
});

// Get all onboarding templates
router.get('/api/onboarding/templates', async (req, res) => {
  try {
    const templates = await db.select().from(onboardingTemplates);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create sample templates
router.post('/api/onboarding/templates/initialize', async (req, res) => {
  try {
    // Check if templates already exist
    const existing = await db.select().from(onboardingTemplates).limit(1);
    if (existing.length > 0) {
      return res.json({ message: 'Templates already initialized' });
    }
    
    // Insert sample templates
    for (const template of SAMPLE_TEMPLATES) {
      await db.insert(onboardingTemplates).values({
        name: template.name,
        description: template.description,
        industry: template.industry,
        plantType: template.plantType,
        phases: template.phases,
        goals: template.goals,
        estimatedDuration: template.estimatedDuration,
        isPublic: true,
        createdBy: 1
      });
    }
    
    res.json({ message: 'Sample templates created successfully' });
  } catch (error) {
    console.error('Error creating templates:', error);
    res.status(500).json({ error: 'Failed to create templates' });
  }
});

// Get plant onboardings with optional filtering
router.get('/api/onboarding/plants', async (req, res) => {
  try {
    const { plantId, status } = req.query;
    
    let query = db.select({
      id: plantOnboarding.id,
      plant_id: plantOnboarding.plantId,
      template_id: plantOnboarding.templateId,
      name: plantOnboarding.name,
      status: plantOnboarding.status,
      start_date: plantOnboarding.startDate,
      target_completion_date: plantOnboarding.targetCompletionDate,
      actual_completion_date: plantOnboarding.actualCompletionDate,
      overall_progress: plantOnboarding.overallProgress,
      current_phase: plantOnboarding.currentPhase,
      custom_phases: plantOnboarding.customPhases,
      custom_goals: plantOnboarding.customGoals,
      notes: plantOnboarding.notes,
      plant_name: ptPlants.name
    })
    .from(plantOnboarding)
    .leftJoin(ptPlants, eq(plantOnboarding.plantId, ptPlants.plantId));
    
    const conditions = [];
    if (plantId) {
      conditions.push(eq(plantOnboarding.plantId, parseInt(plantId as string)));
    }
    if (status) {
      conditions.push(eq(plantOnboarding.status, status as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    res.json(result);
  } catch (error) {
    console.error('Error fetching plant onboardings:', error);
    res.status(500).json({ error: 'Failed to fetch onboardings' });
  }
});

// Create new plant onboarding
router.post('/api/onboarding/plants', async (req, res) => {
  try {
    const { plantId, templateId, name, startDate, targetCompletionDate, assignedTo, notes } = req.body;
    
    // Get template if specified
    let phases = [];
    let goals = [];
    if (templateId) {
      const template = await db.select()
        .from(onboardingTemplates)
        .where(eq(onboardingTemplates.id, templateId))
        .limit(1);
      
      if (template.length > 0) {
        phases = template[0].phases || [];
        goals = template[0].goals || [];
      }
    }
    
    // Create onboarding
    const [newOnboarding] = await db.insert(plantOnboarding).values({
      plantId,
      templateId,
      name,
      status: 'in-progress',
      startDate: new Date(startDate),
      targetCompletionDate: new Date(targetCompletionDate),
      overallProgress: 0,
      customPhases: phases,
      customGoals: goals,
      notes,
      createdBy: assignedTo,
      assignedTo
    }).returning();
    
    // Create phases if template was used
    if (phases.length > 0) {
      for (const phase of phases) {
        const [newPhase] = await db.insert(plantOnboardingPhases).values({
          onboardingId: newOnboarding.id,
          phaseId: phase.phaseId,
          phaseName: phase.phaseName,
          status: 'not-started',
          progress: 0,
          tasks: phase.tasks || [],
          milestones: phase.milestones || [],
          totalTasks: phase.tasks?.length || 0
        }).returning();
        
        // Create tasks for the phase
        if (phase.tasks && phase.tasks.length > 0) {
          for (const task of phase.tasks) {
            await db.insert(plantOnboardingTasks).values({
              phaseId: newPhase.id,
              taskId: task.taskId,
              title: task.title,
              description: task.description,
              priority: 'medium',
              status: 'pending',
              estimatedHours: task.estimatedHours
            });
          }
        }
      }
    }
    
    res.json(newOnboarding);
  } catch (error) {
    console.error('Error creating plant onboarding:', error);
    res.status(500).json({ error: 'Failed to create onboarding' });
  }
});

// Upload and analyze requirements document
router.post('/api/onboarding/:id/requirements/upload', upload.single('file'), async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.id);
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Extract text from file (simplified - in production would use proper parsers)
    const requirementText = file.buffer.toString('utf-8');
    
    // Save document reference
    const [document] = await db.insert(plantOnboardingDocuments).values({
      onboardingId,
      documentType: 'requirements',
      documentName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user?.id || 1
    }).returning();
    
    // Analyze requirements with AI
    const analysis = await onboardingAIService.analyzeRequirements(
      onboardingId,
      requirementText,
      file.originalname
    );
    
    res.json({
      document,
      analysis
    });
  } catch (error) {
    console.error('Error uploading requirements:', error);
    res.status(500).json({ error: 'Failed to upload and analyze requirements' });
  }
});

// Get AI recommendations for an onboarding
router.get('/api/onboarding/:id/recommendations', async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.id);
    
    const recommendations = await db.select()
      .from(onboardingAIRecommendations)
      .where(eq(onboardingAIRecommendations.onboardingId, onboardingId));
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get requirements for an onboarding
router.get('/api/onboarding/:id/requirements', async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.id);
    
    const requirements = await db.select()
      .from(onboardingRequirements)
      .where(eq(onboardingRequirements.onboardingId, onboardingId));
    
    res.json(requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// Update recommendation status
router.patch('/api/onboarding/recommendations/:id', async (req, res) => {
  try {
    const recommendationId = parseInt(req.params.id);
    const { status, acceptedBy } = req.body;
    
    const [updated] = await db.update(onboardingAIRecommendations)
      .set({
        status,
        acceptedBy,
        acceptedAt: status === 'accepted' ? new Date() : null
      })
      .where(eq(onboardingAIRecommendations.id, recommendationId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating recommendation:', error);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

// Generate custom onboarding plan
router.post('/api/onboarding/generate-plan', async (req, res) => {
  try {
    const { plantId, businessGoals, currentChallenges, industry, plantType } = req.body;
    
    const plan = await onboardingAIService.generateCustomPlan(
      plantId,
      businessGoals,
      currentChallenges,
      industry,
      plantType
    );
    
    res.json(plan);
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate custom plan' });
  }
});

// Get company-wide onboarding overview
router.get('/api/onboarding/company-overview', async (req, res) => {
  try {
    const overview = await onboardingAIService.getCompanyOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error fetching company overview:', error);
    res.status(500).json({ error: 'Failed to fetch company overview' });
  }
});

// Get onboarding phases
router.get('/api/onboarding/plants/:id/phases', async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.id);
    
    const phases = await db.select()
      .from(plantOnboardingPhases)
      .where(eq(plantOnboardingPhases.onboardingId, onboardingId));
    
    res.json(phases);
  } catch (error) {
    console.error('Error fetching phases:', error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

// Get onboarding metrics
router.get('/api/onboarding/plants/:id/metrics', async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.id);
    
    const metrics = await db.select()
      .from(plantOnboardingMetrics)
      .where(eq(plantOnboardingMetrics.onboardingId, onboardingId));
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Update phase progress
router.patch('/api/onboarding/phases/:id', async (req, res) => {
  try {
    const phaseId = parseInt(req.params.id);
    const { status, progress } = req.body;
    
    const [updated] = await db.update(plantOnboardingPhases)
      .set({
        status,
        progress,
        endDate: status === 'completed' ? new Date() : null
      })
      .where(eq(plantOnboardingPhases.id, phaseId))
      .returning();
    
    // Update overall onboarding progress
    if (updated) {
      const phases = await db.select()
        .from(plantOnboardingPhases)
        .where(eq(plantOnboardingPhases.onboardingId, updated.onboardingId));
      
      const totalProgress = phases.reduce((sum, p) => sum + (p.progress || 0), 0);
      const overallProgress = Math.round(totalProgress / phases.length);
      
      await db.update(plantOnboarding)
        .set({ overallProgress })
        .where(eq(plantOnboarding.id, updated.onboardingId));
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

export default router;