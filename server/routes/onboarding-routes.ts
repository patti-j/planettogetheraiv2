import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
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
  customerRequirements,
  customerRequirementHistory,
  ptPlants,
  implementationLanes
} from '@shared/schema';
import { eq, sql, and, or, desc, count } from 'drizzle-orm';
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

// Initialize company onboarding (called when user completes step 0)
router.post('/api/onboarding/initialize', async (req, res) => {
  try {
    const { companyName, industry, size, description } = req.body;
    
    console.log('Initializing onboarding for company:', companyName);
    
    // Check if company onboarding already exists
    const existing = await db.select().from(companyOnboardingOverview).limit(1);
    
    if (existing.length > 0) {
      // Update existing record
      await db.update(companyOnboardingOverview)
        .set({
          companyName: companyName || existing[0].companyName,
          industry: industry || existing[0].industry,
          companySize: size || existing[0].companySize,
          status: 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(companyOnboardingOverview.id, existing[0].id));
      
      return res.json({ 
        success: true, 
        message: 'Company onboarding updated',
        id: existing[0].id
      });
    }
    
    // Create new company onboarding record
    const [newOnboarding] = await db.insert(companyOnboardingOverview)
      .values({
        companyName: companyName || 'New Company',
        industry: industry || 'Manufacturing',
        companySize: size || 'medium',
        totalPlants: 0,
        onboardedPlants: 0,
        inProgressPlants: 0,
        overallProgress: 0,
        status: 'in_progress',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.json({ 
      success: true, 
      message: 'Company onboarding initialized',
      id: newOnboarding.id
    });
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    res.status(500).json({ error: 'Failed to initialize onboarding' });
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
    
    console.log('Creating plant onboarding with data:', { plantId, templateId, name, startDate, targetCompletionDate });
    
    // Get template if specified
    let phases: any[] = [];
    let goals: any[] = [];
    let estimatedDuration = 90; // Default 90 days
    if (templateId) {
      const template = await db.select()
        .from(onboardingTemplates)
        .where(eq(onboardingTemplates.id, templateId))
        .limit(1);
      
      if (template.length > 0) {
        phases = (template[0].phases as any[]) || [];
        goals = (template[0].goals as any[]) || [];
        estimatedDuration = template[0].estimatedDurationDays || 90;
      }
    }
    
    // Handle dates - use current date if not provided
    const now = new Date();
    const parsedStartDate = startDate ? new Date(startDate) : now;
    const parsedTargetDate = targetCompletionDate 
      ? new Date(targetCompletionDate) 
      : new Date(now.getTime() + estimatedDuration * 24 * 60 * 60 * 1000);
    
    // Validate dates are valid
    if (isNaN(parsedStartDate.getTime())) {
      console.error('Invalid start date:', startDate);
      return res.status(400).json({ error: 'Invalid start date format' });
    }
    if (isNaN(parsedTargetDate.getTime())) {
      console.error('Invalid target date:', targetCompletionDate);
      return res.status(400).json({ error: 'Invalid target completion date format' });
    }
    
    // Create onboarding
    const [newOnboarding] = await db.insert(plantOnboarding).values({
      plantId: plantId || null,
      templateId: templateId || null,
      name: name || 'New Plant Onboarding',
      status: 'in-progress',
      startDate: parsedStartDate,
      targetCompletionDate: parsedTargetDate,
      overallProgress: 0,
      customPhases: phases,
      customGoals: goals,
      notes: notes || null,
      createdBy: assignedTo || null,
      assignedTo: assignedTo || null
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

// ============================================
// Customer Requirements API Endpoints
// ============================================

// Configure multer for spreadsheet uploads
const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (xlsx, xls) and CSV files are allowed.'));
    }
  }
});

// Get all customer requirements
router.get('/api/customer-requirements', async (req, res) => {
  try {
    const { segment, status, customerId, onboardingId, limit = 100, offset = 0 } = req.query;
    
    const conditions = [];
    if (segment && segment !== 'all') {
      conditions.push(eq(customerRequirements.segment, segment as string));
    }
    if (status) {
      conditions.push(eq(customerRequirements.lifecycleStatus, status as any));
    }
    if (customerId) {
      conditions.push(eq(customerRequirements.customerId, parseInt(customerId as string)));
    }
    if (onboardingId) {
      conditions.push(eq(customerRequirements.onboardingId, parseInt(onboardingId as string)));
    }
    
    const requirements = await db.select()
      .from(customerRequirements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customerRequirements.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(requirements);
  } catch (error) {
    console.error('Error fetching customer requirements:', error);
    res.status(500).json({ error: 'Failed to fetch customer requirements' });
  }
});

// Get customer requirements summary/statistics
router.get('/api/customer-requirements/stats', async (req, res) => {
  try {
    // Get counts by lifecycle status
    const statusCounts = await db.select({
      status: customerRequirements.lifecycleStatus,
      count: count()
    })
    .from(customerRequirements)
    .groupBy(customerRequirements.lifecycleStatus);
    
    // Get counts by segment
    const segmentCounts = await db.select({
      segment: customerRequirements.segment,
      count: count()
    })
    .from(customerRequirements)
    .groupBy(customerRequirements.segment);
    
    // Get total counts
    const totalResult = await db.select({ count: count() }).from(customerRequirements);
    const total = totalResult[0]?.count || 0;
    
    // Calculate lifecycle stage aggregates
    const modelingCount = statusCounts.filter(s => 
      s.status?.includes('modeling')
    ).reduce((sum, s) => sum + Number(s.count), 0);
    
    const testingCount = statusCounts.filter(s => 
      s.status?.includes('testing')
    ).reduce((sum, s) => sum + Number(s.count), 0);
    
    const deploymentCount = statusCounts.filter(s => 
      s.status?.includes('deployment') || s.status === 'deployed'
    ).reduce((sum, s) => sum + Number(s.count), 0);
    
    const uploadedCount = statusCounts.find(s => s.status === 'uploaded')?.count || 0;
    const deployedCount = statusCounts.find(s => s.status === 'deployed')?.count || 0;
    
    res.json({
      total,
      byStatus: statusCounts,
      bySegment: segmentCounts,
      summary: {
        uploaded: Number(uploadedCount),
        inModeling: modelingCount,
        inTesting: testingCount,
        inDeployment: deploymentCount,
        deployed: Number(deployedCount),
        completionRate: total > 0 ? Math.round((Number(deployedCount) / Number(total)) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching customer requirements stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Upload customer requirements from spreadsheet
router.post('/api/customer-requirements/upload', spreadsheetUpload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { onboardingId, customerId, customerName } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse the spreadsheet
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No data found in spreadsheet' });
    }
    
    const insertedRequirements = [];
    const errors: string[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // Map spreadsheet columns to database fields
        // Expected columns: Segment, Requirement Name, Description, Features, Priority
        const segment = row['Segment'] || row['segment'] || row['Industry'] || row['industry'] || 'General';
        const requirementName = row['Requirement Name'] || row['requirement_name'] || row['Name'] || row['name'] || row['Use Case'] || row['use_case'];
        const description = row['Description'] || row['description'] || '';
        const priority = row['Priority'] || row['priority'] || 'medium';
        
        // Handle features - can be comma-separated string or already an array
        let features: string[] = [];
        const featuresRaw = row['Features'] || row['features'] || '';
        if (typeof featuresRaw === 'string') {
          features = featuresRaw.split(',').map((f: string) => f.trim()).filter((f: string) => f);
        } else if (Array.isArray(featuresRaw)) {
          features = featuresRaw;
        }
        
        if (!requirementName) {
          errors.push(`Row ${i + 2}: Missing requirement name`);
          continue;
        }
        
        const [inserted] = await db.insert(customerRequirements).values({
          customerId: customerId ? parseInt(customerId) : null,
          customerName: customerName || 'Unknown Customer',
          segment,
          requirementName,
          description,
          features,
          priority: priority.toLowerCase(),
          lifecycleStatus: 'uploaded',
          onboardingId: onboardingId ? parseInt(onboardingId) : null,
          sourceFile: file.originalname,
          uploadedBy: (req as any).user?.id || 1
        }).returning();
        
        insertedRequirements.push(inserted);
      } catch (rowError) {
        console.error(`Error processing row ${i + 2}:`, rowError);
        errors.push(`Row ${i + 2}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully imported ${insertedRequirements.length} requirements`,
      imported: insertedRequirements.length,
      errors: errors.length > 0 ? errors : undefined,
      requirements: insertedRequirements
    });
  } catch (error) {
    console.error('Error uploading requirements:', error);
    res.status(500).json({ error: 'Failed to upload requirements' });
  }
});

// Update requirement lifecycle status
router.patch('/api/customer-requirements/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current requirement
    const [current] = await db.select()
      .from(customerRequirements)
      .where(eq(customerRequirements.id, id));
    
    if (!current) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    // Prepare update data based on new status
    const updateData: any = {
      lifecycleStatus: status,
      updatedAt: new Date()
    };
    
    // Set appropriate date fields based on status transition
    if (status === 'modeling_in_progress' && !current.modelingStartDate) {
      updateData.modelingStartDate = new Date();
    }
    if (status === 'modeling_complete') {
      updateData.modelingCompleteDate = new Date();
      updateData.modelingProgress = 100;
    }
    if (status === 'testing_in_progress' && !current.testingStartDate) {
      updateData.testingStartDate = new Date();
    }
    if (status === 'testing_complete') {
      updateData.testingCompleteDate = new Date();
      updateData.testingProgress = 100;
    }
    if (status === 'deployment_in_progress' && !current.deploymentStartDate) {
      updateData.deploymentStartDate = new Date();
    }
    if (status === 'deployed') {
      updateData.deploymentCompleteDate = new Date();
      updateData.deploymentProgress = 100;
    }
    
    // Update requirement
    const [updated] = await db.update(customerRequirements)
      .set(updateData)
      .where(eq(customerRequirements.id, id))
      .returning();
    
    // Record history
    await db.insert(customerRequirementHistory).values({
      requirementId: id,
      previousStatus: current.lifecycleStatus,
      newStatus: status,
      changedBy: (req as any).user?.id || 1,
      changeReason: reason
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating requirement status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Update requirement progress
router.patch('/api/customer-requirements/:id/progress', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { modelingProgress, testingProgress, deploymentProgress } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    
    if (modelingProgress !== undefined) updateData.modelingProgress = modelingProgress;
    if (testingProgress !== undefined) updateData.testingProgress = testingProgress;
    if (deploymentProgress !== undefined) updateData.deploymentProgress = deploymentProgress;
    
    const [updated] = await db.update(customerRequirements)
      .set(updateData)
      .where(eq(customerRequirements.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating requirement progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Download template for requirements upload - MUST be before :id route
router.get('/api/customer-requirements/template', (req, res) => {
  try {
    const templateData = [
      {
        'Segment': 'Life Sciences',
        'Requirement Name': 'Example: Batch Traceability',
        'Description': 'Ability to track batches through production process',
        'Features': 'Lot Control, Shelf Life, Batch Scheduling',
        'Priority': 'high'
      },
      {
        'Segment': 'Chemicals',
        'Requirement Name': 'Example: Tank Scheduling',
        'Description': 'Optimize tank usage and cleaning schedules',
        'Features': 'Resource Constraints, Setup Optimization',
        'Priority': 'medium'
      }
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 40 },
      { wch: 50 },
      { wch: 40 },
      { wch: 10 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Requirements');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-requirements-template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Get single requirement with history
router.get('/api/customer-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [requirement] = await db.select()
      .from(customerRequirements)
      .where(eq(customerRequirements.id, id));
    
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const history = await db.select()
      .from(customerRequirementHistory)
      .where(eq(customerRequirementHistory.requirementId, id))
      .orderBy(desc(customerRequirementHistory.changedAt));
    
    res.json({ ...requirement, history });
  } catch (error) {
    console.error('Error fetching requirement:', error);
    res.status(500).json({ error: 'Failed to fetch requirement' });
  }
});

// Delete requirement
router.delete('/api/customer-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Delete history first
    await db.delete(customerRequirementHistory)
      .where(eq(customerRequirementHistory.requirementId, id));
    
    // Delete requirement
    const [deleted] = await db.delete(customerRequirements)
      .where(eq(customerRequirements.id, id))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ error: 'Failed to delete requirement' });
  }
});

// ============================================
// Implementation Lanes Routes
// ============================================

// Get all implementation lanes
router.get('/api/implementation-lanes', async (req, res) => {
  try {
    const lanes = await db.select()
      .from(implementationLanes)
      .orderBy(implementationLanes.laneNumber);
    res.json(lanes);
  } catch (error) {
    console.error('Error fetching implementation lanes:', error);
    res.status(500).json({ error: 'Failed to fetch implementation lanes' });
  }
});

// Get lane statistics across all plants
router.get('/api/implementation-lanes/stats', async (req, res) => {
  try {
    const plantsByLane = await db.select({
      currentLane: plantOnboarding.currentLane,
      count: count()
    })
    .from(plantOnboarding)
    .groupBy(plantOnboarding.currentLane);
    
    const requirementsByLane = await db.select({
      targetLane: customerRequirements.targetLane,
      count: count()
    })
    .from(customerRequirements)
    .groupBy(customerRequirements.targetLane);
    
    res.json({
      plantsByLane,
      requirementsByLane
    });
  } catch (error) {
    console.error('Error fetching lane statistics:', error);
    res.status(500).json({ error: 'Failed to fetch lane statistics' });
  }
});

// Update requirement target lane
router.patch('/api/customer-requirements/:id/lane', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { targetLane } = req.body;
    
    if (!targetLane) {
      return res.status(400).json({ error: 'Target lane is required' });
    }
    
    const validLanes = ['lane_0', 'lane_1', 'lane_2', 'lane_3'];
    if (!validLanes.includes(targetLane)) {
      return res.status(400).json({ error: 'Invalid lane value' });
    }
    
    const [updated] = await db.update(customerRequirements)
      .set({ 
        targetLane: targetLane as 'lane_0' | 'lane_1' | 'lane_2' | 'lane_3',
        updatedAt: new Date() 
      })
      .where(eq(customerRequirements.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating requirement lane:', error);
    res.status(500).json({ error: 'Failed to update lane' });
  }
});

// Update plant onboarding lane
router.patch('/api/plant-onboarding/:id/lane', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { currentLane, targetLane, laneProgress, laneStartDate, laneTargetDate } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    
    if (currentLane !== undefined) {
      const validLanes = ['lane_0', 'lane_1', 'lane_2', 'lane_3'];
      if (!validLanes.includes(currentLane)) {
        return res.status(400).json({ error: 'Invalid current lane value' });
      }
      updateData.currentLane = currentLane;
    }
    
    if (targetLane !== undefined) {
      const validLanes = ['lane_0', 'lane_1', 'lane_2', 'lane_3'];
      if (!validLanes.includes(targetLane)) {
        return res.status(400).json({ error: 'Invalid target lane value' });
      }
      updateData.targetLane = targetLane;
    }
    
    if (laneProgress !== undefined) updateData.laneProgress = laneProgress;
    
    // Convert date strings to Date objects for Drizzle
    if (laneStartDate !== undefined) {
      const parsedStartDate = new Date(laneStartDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ error: 'Invalid lane start date format' });
      }
      updateData.laneStartDate = parsedStartDate;
    }
    
    if (laneTargetDate !== undefined) {
      const parsedTargetDate = new Date(laneTargetDate);
      if (isNaN(parsedTargetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid lane target date format' });
      }
      updateData.laneTargetDate = parsedTargetDate;
    }
    
    const [updated] = await db.update(plantOnboarding)
      .set(updateData)
      .where(eq(plantOnboarding.id, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Plant onboarding not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating plant onboarding lane:', error);
    res.status(500).json({ error: 'Failed to update lane' });
  }
});

// Get plants with lane status for cross-plant overview
router.get('/api/plants/lane-status', async (req, res) => {
  try {
    const plantsWithLanes = await db.select({
      plantId: ptPlants.id,
      plantName: ptPlants.name,
      onboardingId: plantOnboarding.id,
      currentLane: plantOnboarding.currentLane,
      targetLane: plantOnboarding.targetLane,
      laneProgress: plantOnboarding.laneProgress,
      laneStartDate: plantOnboarding.laneStartDate,
      laneTargetDate: plantOnboarding.laneTargetDate,
      status: plantOnboarding.status,
      overallProgress: plantOnboarding.overallProgress
    })
    .from(ptPlants)
    .leftJoin(plantOnboarding, eq(ptPlants.id, plantOnboarding.plantId))
    .where(eq(ptPlants.isActive, true));
    
    res.json(plantsWithLanes);
  } catch (error) {
    console.error('Error fetching plant lane status:', error);
    res.status(500).json({ error: 'Failed to fetch plant lane status' });
  }
});

// Bulk update requirements target lane
router.post('/api/customer-requirements/bulk-update-lane', async (req, res) => {
  try {
    const { ids, targetLane } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No requirement IDs provided' });
    }
    
    const validLanes = ['lane_0', 'lane_1', 'lane_2', 'lane_3'];
    if (!targetLane || !validLanes.includes(targetLane)) {
      return res.status(400).json({ error: 'Valid target lane is required' });
    }
    
    const updatedRequirements = [];
    
    for (const id of ids) {
      const [updated] = await db.update(customerRequirements)
        .set({ 
          targetLane: targetLane as 'lane_0' | 'lane_1' | 'lane_2' | 'lane_3',
          updatedAt: new Date() 
        })
        .where(eq(customerRequirements.id, id))
        .returning();
      
      if (updated) {
        updatedRequirements.push(updated);
      }
    }
    
    res.json({
      success: true,
      updated: updatedRequirements.length,
      requirements: updatedRequirements
    });
  } catch (error) {
    console.error('Error bulk updating requirement lanes:', error);
    res.status(500).json({ error: 'Failed to bulk update lanes' });
  }
});

// Bulk update requirements status
router.post('/api/customer-requirements/bulk-update-status', async (req, res) => {
  try {
    const { ids, status, reason } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No requirement IDs provided' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedRequirements = [];
    
    for (const id of ids) {
      const [current] = await db.select()
        .from(customerRequirements)
        .where(eq(customerRequirements.id, id));
      
      if (current) {
        const updateData: any = {
          lifecycleStatus: status,
          updatedAt: new Date()
        };
        
        const [updated] = await db.update(customerRequirements)
          .set(updateData)
          .where(eq(customerRequirements.id, id))
          .returning();
        
        await db.insert(customerRequirementHistory).values({
          requirementId: id,
          previousStatus: current.lifecycleStatus,
          newStatus: status,
          changedBy: (req as any).user?.id || 1,
          changeReason: reason || 'Bulk update'
        });
        
        updatedRequirements.push(updated);
      }
    }
    
    res.json({
      success: true,
      updated: updatedRequirements.length,
      requirements: updatedRequirements
    });
  } catch (error) {
    console.error('Error bulk updating requirements:', error);
    res.status(500).json({ error: 'Failed to bulk update requirements' });
  }
});

// Bulk add library requirements to customer_requirements
router.post('/api/customer-requirements/bulk-library', async (req, res) => {
  try {
    const { requirements } = req.body;
    
    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ error: 'No requirements provided' });
    }
    
    const insertedRequirements = [];
    let skipped = 0;
    
    for (const req of requirements) {
      // Check if requirement already exists (by name and segment)
      const [existing] = await db.select()
        .from(customerRequirements)
        .where(
          and(
            eq(customerRequirements.requirementName, req.requirementName),
            eq(customerRequirements.segment, req.segment)
          )
        );
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const [inserted] = await db.insert(customerRequirements).values({
        customerName: 'Library Selection',
        segment: req.segment,
        requirementName: req.requirementName,
        description: req.description || null,
        features: req.features || [],
        priority: req.priority || 'Medium',
        lifecycleStatus: 'modeling_pending',
        modelingProgress: 0,
        testingProgress: 0,
        deploymentProgress: 0,
        sourceFile: 'Requirements Library',
        uploadedAt: new Date()
      }).returning();
      
      insertedRequirements.push(inserted);
    }
    
    res.json({
      success: true,
      inserted: insertedRequirements.length,
      skipped,
      requirements: insertedRequirements
    });
  } catch (error) {
    console.error('Error adding library requirements:', error);
    res.status(500).json({ error: 'Failed to add library requirements' });
  }
});

// Seed sample customer requirements for testing/demo
router.post('/api/customer-requirements/seed', async (req, res) => {
  try {
    const sampleRequirements = [
      {
        customerName: 'Acme Manufacturing',
        segment: 'Discrete Manufacturing',
        requirementName: 'Real-time Production Visibility',
        description: 'Need complete visibility into production floor operations with real-time updates on machine status, WIP levels, and production progress.',
        features: ['Production Monitoring', 'Real-time Dashboards', 'Alerts & Notifications'],
        priority: 'high',
        lifecycleStatus: 'uploaded' as const
      },
      {
        customerName: 'Acme Manufacturing',
        segment: 'Discrete Manufacturing',
        requirementName: 'Automated Scheduling Optimization',
        description: 'Require intelligent scheduling that considers machine capacity, labor availability, material constraints, and customer priorities.',
        features: ['APS Scheduling', 'Constraint Management', 'What-if Analysis'],
        priority: 'critical',
        lifecycleStatus: 'modeling_pending' as const
      },
      {
        customerName: 'Precision Parts Inc',
        segment: 'Precision Manufacturing',
        requirementName: 'Quality Traceability System',
        description: 'Full traceability from raw materials through finished goods with lot/serial tracking and quality inspection integration.',
        features: ['Lot Tracking', 'Quality Integration', 'Genealogy Reporting'],
        priority: 'high',
        lifecycleStatus: 'modeling_in_progress' as const,
        modelingProgress: 45
      },
      {
        customerName: 'Precision Parts Inc',
        segment: 'Precision Manufacturing',
        requirementName: 'Predictive Maintenance Integration',
        description: 'Connect equipment sensors to predict failures before they occur and schedule preventive maintenance during planned downtime.',
        features: ['IoT Integration', 'Predictive Analytics', 'Maintenance Scheduling'],
        priority: 'medium',
        lifecycleStatus: 'uploaded' as const
      },
      {
        customerName: 'Global Foods Corp',
        segment: 'Food & Beverage',
        requirementName: 'Recipe/Formula Management',
        description: 'Manage complex recipes with ingredient substitutions, allergen tracking, and nutritional calculations.',
        features: ['Recipe Management', 'Allergen Tracking', 'Batch Scaling'],
        priority: 'critical',
        lifecycleStatus: 'testing_pending' as const,
        modelingProgress: 100
      },
      {
        customerName: 'Global Foods Corp',
        segment: 'Food & Beverage',
        requirementName: 'Shelf-life & Expiry Management',
        description: 'Track expiration dates, manage FIFO/FEFO inventory rotation, and prevent shipment of expired products.',
        features: ['Expiry Tracking', 'FIFO/FEFO', 'Hold Management'],
        priority: 'high',
        lifecycleStatus: 'modeling_complete' as const,
        modelingProgress: 100
      },
      {
        customerName: 'PharmaCo Industries',
        segment: 'Pharmaceutical',
        requirementName: 'FDA 21 CFR Part 11 Compliance',
        description: 'Electronic records and signatures compliance with full audit trail, user authentication, and data integrity controls.',
        features: ['Electronic Signatures', 'Audit Trail', 'Access Controls'],
        priority: 'critical',
        lifecycleStatus: 'testing_in_progress' as const,
        modelingProgress: 100,
        testingProgress: 60
      },
      {
        customerName: 'PharmaCo Industries',
        segment: 'Pharmaceutical',
        requirementName: 'Batch Record Automation',
        description: 'Automated electronic batch records with guided execution, deviation management, and review-by-exception.',
        features: ['eBatch Records', 'Deviation Management', 'Workflow Automation'],
        priority: 'high',
        lifecycleStatus: 'uploaded' as const
      },
      {
        customerName: 'AutoTech Components',
        segment: 'Automotive',
        requirementName: 'JIT/Kanban Support',
        description: 'Support for just-in-time manufacturing with electronic kanban, pull signals, and supplier integration.',
        features: ['Kanban Management', 'Supplier Portal', 'Pull Scheduling'],
        priority: 'high',
        lifecycleStatus: 'deployment_pending' as const,
        modelingProgress: 100,
        testingProgress: 100
      },
      {
        customerName: 'AutoTech Components',
        segment: 'Automotive',
        requirementName: 'EDI Integration for Customer Orders',
        description: 'Automated EDI processing for customer orders, ASNs, and invoices with major automotive OEMs.',
        features: ['EDI Processing', 'Order Automation', 'ASN Generation'],
        priority: 'medium',
        lifecycleStatus: 'deployed' as const,
        modelingProgress: 100,
        testingProgress: 100,
        deploymentProgress: 100
      }
    ];
    
    const insertedRequirements = [];
    let skipped = 0;
    
    for (const req of sampleRequirements) {
      // Check if requirement already exists
      const existing = await db.select()
        .from(customerRequirements)
        .where(and(
          eq(customerRequirements.customerName, req.customerName),
          eq(customerRequirements.requirementName, req.requirementName)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      const [inserted] = await db.insert(customerRequirements).values({
        customerName: req.customerName,
        segment: req.segment,
        requirementName: req.requirementName,
        description: req.description,
        features: req.features,
        priority: req.priority,
        lifecycleStatus: req.lifecycleStatus,
        modelingProgress: req.modelingProgress || 0,
        testingProgress: req.testingProgress || 0,
        deploymentProgress: req.deploymentProgress || 0,
        sourceFile: 'Sample Data',
        uploadedAt: new Date()
      }).returning();
      
      insertedRequirements.push(inserted);
    }
    
    res.json({
      success: true,
      message: `Seeded ${insertedRequirements.length} sample requirements (${skipped} already existed)`,
      inserted: insertedRequirements.length,
      skipped,
      requirements: insertedRequirements
    });
  } catch (error) {
    console.error('Error seeding customer requirements:', error);
    res.status(500).json({ error: 'Failed to seed customer requirements' });
  }
});

export default router;