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
  companyOnboardingOverview,
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
    
    const conditions = [];
    if (plantId) {
      conditions.push(eq(plantOnboarding.plantId, parseInt(plantId as string)));
    }
    if (status) {
      conditions.push(eq(plantOnboarding.status, status as string));
    }
    
    const query = db.select({
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
    .leftJoin(ptPlants, eq(plantOnboarding.plantId, ptPlants.plantId))
    .where(conditions.length > 0 ? and(...conditions) : undefined);
    
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
    let phases: any[] = [];
    let goals: any[] = [];
    if (templateId) {
      const template = await db.select()
        .from(onboardingTemplates)
        .where(eq(onboardingTemplates.id, templateId))
        .limit(1);
      
      if (template.length > 0) {
        phases = (template[0].phases as any[]) || [];
        goals = (template[0].goals as any[]) || [];
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

// Get company onboarding overview
router.get('/api/onboarding/company/overview', async (req, res) => {
  try {
    // Get company overview
    const [overview] = await db.select()
      .from(companyOnboardingOverview)
      .limit(1);
    
    // Get all plant onboardings with plant information
    const onboardings = await db.select({
      id: plantOnboarding.id,
      plantId: plantOnboarding.plantId,
      name: plantOnboarding.name,
      status: plantOnboarding.status,
      progress: plantOnboarding.overallProgress,
      startDate: plantOnboarding.startDate,
      targetCompletionDate: plantOnboarding.targetCompletionDate,
      actualCompletionDate: plantOnboarding.actualCompletionDate,
      currentPhase: plantOnboarding.currentPhase,
      plantName: ptPlants.name,
      plantCity: ptPlants.city,
      plantCountry: ptPlants.country
    })
    .from(plantOnboarding)
    .leftJoin(ptPlants, eq(plantOnboarding.plantId, ptPlants.id))
    .orderBy(plantOnboarding.startDate);
    
    // Calculate summary statistics
    const totalPlants = onboardings.length;
    const completedPlants = onboardings.filter(p => p.status === 'completed').length;
    const inProgressPlants = onboardings.filter(p => p.status === 'in-progress').length;
    const notStartedPlants = onboardings.filter(p => p.status === 'not-started').length;
    const pausedPlants = onboardings.filter(p => p.status === 'paused').length;
    
    res.json({
      overview: overview || {
        companyName: 'Global Breweries Inc',
        totalPlants,
        onboardedPlants: completedPlants,
        inProgressPlants,
        averageCompletionTime: 90,
        bestPractices: [
          "Start with pilot plant",
          "Establish clear KPIs",
          "Regular progress reviews",
          "Cross-plant knowledge sharing"
        ],
        commonChallenges: [
          "Regulatory compliance",
          "Equipment lead times", 
          "Staff availability",
          "Integration complexity"
        ],
        successMetrics: {
          avgOeeImprovement: 21.5,
          timeToProduction: 85,
          safetyIncidents: 0
        }
      },
      plants: onboardings,
      summary: {
        total: totalPlants,
        completed: completedPlants,
        inProgress: inProgressPlants,
        notStarted: notStartedPlants,
        paused: pausedPlants
      }
    });
  } catch (error) {
    console.error('Error fetching company overview:', error);
    res.status(500).json({ error: 'Failed to fetch company overview' });
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
        endDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null
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

// Generate sample onboarding data for demo purposes
router.post('/api/onboarding/generate-sample-data', async (req, res) => {
  try {
    // First, ensure templates exist
    const existingTemplates = await db.select().from(onboardingTemplates);
    if (existingTemplates.length === 0) {
      // Create sample templates
      for (const template of SAMPLE_TEMPLATES) {
        await db.insert(onboardingTemplates).values({
          name: template.name,
          description: template.description,
          industry: template.industry,
          plantType: template.plantType,
          estimatedDuration: template.estimatedDuration,
          phases: template.phases,
          goals: template.goals
        });
      }
    }

    // Check if we already have sample data
    const existingOnboardings = await db.select().from(plantOnboarding);
    if (existingOnboardings.length > 0) {
      return res.json({ message: 'Sample data already exists', count: existingOnboardings.length });
    }

    // Create sample plant onboardings
    const samplePlants = [
      { 
        plantId: 1, 
        name: "Amsterdam Brewery - Digital Transformation", 
        status: "completed",
        overallProgress: 100,
        currentPhase: "Go-Live",
        startDate: '2024-09-01',
        targetCompletionDate: '2024-11-30'
      },
      { 
        plantId: 2, 
        name: "Munich Facility - APS Implementation", 
        status: "in-progress",
        overallProgress: 65,
        currentPhase: "Integration Testing",
        startDate: '2024-10-01',
        targetCompletionDate: '2025-01-15'
      },
      { 
        plantId: 3, 
        name: "Berlin Plant - Quality Module Rollout", 
        status: "in-progress",
        overallProgress: 40,
        currentPhase: "System Configuration",
        startDate: '2024-10-15',
        targetCompletionDate: '2025-02-01'
      },
      { 
        plantId: 4, 
        name: "Prague Brewery - Initial Setup", 
        status: "not-started",
        overallProgress: 0,
        currentPhase: "Discovery",
        startDate: '2025-01-01',
        targetCompletionDate: '2025-04-01'
      },
      {
        plantId: 5,
        name: "Vienna Operations - Scheduling Optimization",
        status: "in-progress",
        overallProgress: 85,
        currentPhase: "Training & Support",
        startDate: '2024-08-15',
        targetCompletionDate: '2024-12-15'
      }
    ];

    // Get brewery template ID
    const breweryTemplate = await db.select()
      .from(onboardingTemplates)
      .where(eq(onboardingTemplates.plantType, 'Brewery'))
      .limit(1);
    
    const templateId = breweryTemplate.length > 0 ? breweryTemplate[0].id : null;

    // Create onboardings with phases
    for (const plant of samplePlants) {
      const [onboarding] = await db.insert(plantOnboarding).values({
        plantId: plant.plantId,
        templateId: templateId,
        name: plant.name,
        status: plant.status,
        startDate: plant.startDate,
        targetCompletionDate: plant.targetCompletionDate,
        overallProgress: plant.overallProgress,
        currentPhase: plant.currentPhase
      }).returning();

      // Create phases for this onboarding based on progress
      const phases = [
        { 
          phaseId: "discovery", 
          phaseName: "Discovery & Assessment", 
          progress: plant.overallProgress >= 20 ? 100 : Math.min(plant.overallProgress * 5, 100),
          status: plant.overallProgress >= 20 ? 'completed' : plant.overallProgress > 0 ? 'in-progress' : 'not-started',
          totalTasks: 4,
          completedTasks: plant.overallProgress >= 20 ? 4 : Math.floor(plant.overallProgress / 5)
        },
        { 
          phaseId: "setup", 
          phaseName: "System Configuration", 
          progress: plant.overallProgress >= 40 ? 100 : plant.overallProgress >= 20 ? (plant.overallProgress - 20) * 5 : 0,
          status: plant.overallProgress >= 40 ? 'completed' : plant.overallProgress >= 20 ? 'in-progress' : 'not-started',
          totalTasks: 8,
          completedTasks: plant.overallProgress >= 40 ? 8 : plant.overallProgress >= 20 ? Math.floor((plant.overallProgress - 20) / 2.5) : 0
        },
        { 
          phaseId: "integration", 
          phaseName: "System Integration", 
          progress: plant.overallProgress >= 60 ? 100 : plant.overallProgress >= 40 ? (plant.overallProgress - 40) * 5 : 0,
          status: plant.overallProgress >= 60 ? 'completed' : plant.overallProgress >= 40 ? 'in-progress' : 'not-started',
          totalTasks: 6,
          completedTasks: plant.overallProgress >= 60 ? 6 : plant.overallProgress >= 40 ? Math.floor((plant.overallProgress - 40) / 3.3) : 0
        },
        { 
          phaseId: "training", 
          phaseName: "Training & Support", 
          progress: plant.overallProgress >= 80 ? 100 : plant.overallProgress >= 60 ? (plant.overallProgress - 60) * 5 : 0,
          status: plant.overallProgress >= 80 ? 'completed' : plant.overallProgress >= 60 ? 'in-progress' : 'not-started',
          totalTasks: 5,
          completedTasks: plant.overallProgress >= 80 ? 5 : plant.overallProgress >= 60 ? Math.floor((plant.overallProgress - 60) / 4) : 0
        },
        { 
          phaseId: "go-live", 
          phaseName: "Go-Live", 
          progress: plant.overallProgress >= 100 ? 100 : plant.overallProgress >= 80 ? (plant.overallProgress - 80) * 5 : 0,
          status: plant.overallProgress >= 100 ? 'completed' : plant.overallProgress >= 80 ? 'in-progress' : 'not-started',
          totalTasks: 3,
          completedTasks: plant.overallProgress >= 100 ? 3 : plant.overallProgress >= 80 ? Math.floor((plant.overallProgress - 80) / 6.7) : 0
        }
      ];

      for (const phase of phases) {
        const [createdPhase] = await db.insert(plantOnboardingPhases).values({
          onboardingId: onboarding.id,
          phaseId: phase.phaseId,
          phaseName: phase.phaseName,
          status: phase.status,
          progress: phase.progress,
          startDate: phase.status !== 'not-started' ? plant.startDate : null,
          endDate: phase.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
          totalTasks: phase.totalTasks,
          completedTasks: phase.completedTasks
        }).returning();

        // Create sample tasks for each phase
        if (phase.phaseId === 'discovery') {
          await db.insert(plantOnboardingTasks).values([
            { phaseId: createdPhase.id, taskId: "t1", title: "Current state assessment", status: phase.completedTasks >= 1 ? 'completed' : 'in-progress', estimatedHours: 16 },
            { phaseId: createdPhase.id, taskId: "t2", title: "Requirements gathering", status: phase.completedTasks >= 2 ? 'completed' : phase.completedTasks >= 1 ? 'in-progress' : 'not-started', estimatedHours: 8 },
            { phaseId: createdPhase.id, taskId: "t3", title: "Data mapping", status: phase.completedTasks >= 3 ? 'completed' : phase.completedTasks >= 2 ? 'in-progress' : 'not-started', estimatedHours: 12 },
            { phaseId: createdPhase.id, taskId: "t4", title: "Gap analysis", status: phase.completedTasks >= 4 ? 'completed' : phase.completedTasks >= 3 ? 'in-progress' : 'not-started', estimatedHours: 8 }
          ]);
        }
      }
    }

    // Add some sample metrics for completed/in-progress onboardings
    const onboardingsWithProgress = await db.select()
      .from(plantOnboarding)
      .where(or(
        eq(plantOnboarding.status, 'completed'),
        eq(plantOnboarding.status, 'in-progress')
      ));

    for (const ob of onboardingsWithProgress) {
      if (ob.overallProgress && ob.overallProgress > 40) {
        await db.insert(plantOnboardingMetrics).values([
          { 
            onboardingId: ob.id, 
            metricName: "Schedule Accuracy", 
            targetValue: "95", 
            metricValue: ob.overallProgress > 80 ? "92" : "85", 
            metricUnit: "%"
          },
          { 
            onboardingId: ob.id, 
            metricName: "On-Time Delivery", 
            targetValue: "98", 
            metricValue: ob.overallProgress > 60 ? "96" : "88", 
            metricUnit: "%"
          },
          { 
            onboardingId: ob.id, 
            metricName: "Resource Utilization", 
            targetValue: "85", 
            metricValue: ob.overallProgress > 70 ? "83" : "75", 
            metricUnit: "%"
          }
        ]);
      }
    }

    res.json({ 
      success: true, 
      message: 'Sample data generated successfully',
      onboardings: samplePlants.length,
      phases: samplePlants.length * 5
    });
  } catch (error) {
    console.error('Error generating sample data:', error);
    res.status(500).json({ error: 'Failed to generate sample data' });
  }
});

export default router;