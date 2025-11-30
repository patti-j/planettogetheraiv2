import { Router } from 'express';
import { db } from '../db';
import { sql, eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const implementationGoalSchema = z.object({
  businessGoalId: z.number().optional().nullable(),
  plantId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  targetValue: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
  targetUnit: z.string().max(50).optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'on_track', 'at_risk', 'completed', 'paused']).default('not_started'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const implementationFeatureSchema = z.object({
  featureName: z.string().max(255),
  featureCategory: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  plantId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  isUniversal: z.boolean().default(false),
  implementationStatus: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'on_hold']).default('pending'),
  configurationProgress: z.number().min(0).max(100).default(0),
  testingProgress: z.number().min(0).max(100).default(0),
  deploymentProgress: z.number().min(0).max(100).default(0),
  relatedGoalIds: z.array(z.number()).optional().nullable(),
  relatedKpiIds: z.array(z.number()).optional().nullable(),
  dependencies: z.array(z.number()).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const dataRequirementSchema = z.object({
  dataName: z.string().max(255),
  dataCategory: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  plantId: z.number().optional().nullable(),
  featureId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  sourceSystem: z.string().max(255).optional().nullable(),
  dataFormat: z.string().max(100).optional().nullable(),
  frequency: z.string().max(50).optional().nullable(),
  isRequired: z.boolean().default(true),
  collectionStatus: z.enum(['not_started', 'in_progress', 'collected', 'validated', 'integrated']).default('not_started'),
  validationStatus: z.enum(['pending', 'passed', 'failed', 'needs_review']).default('pending'),
  qualityScore: z.number().min(0).max(100).optional().nullable(),
  mappingProgress: z.number().min(0).max(100).default(0),
  assignedTo: z.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

const manufacturingRequirementSchema = z.object({
  requirementName: z.string().max(255),
  requirementCategory: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  plantId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  isUniversal: z.boolean().default(false),
  lifecycleStatus: z.enum(['identified', 'modeling', 'testing', 'deployment', 'completed', 'archived']).default('identified'),
  modelingProgress: z.number().min(0).max(100).default(0),
  testingProgress: z.number().min(0).max(100).default(0),
  deploymentProgress: z.number().min(0).max(100).default(0),
  relatedFeatureIds: z.array(z.number()).optional().nullable(),
  relatedGoalIds: z.array(z.number()).optional().nullable(),
  relatedDataIds: z.array(z.number()).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  businessImpact: z.string().optional().nullable(),
  successCriteria: z.any().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const milestoneSchema = z.object({
  milestoneName: z.string().max(255),
  description: z.string().optional().nullable(),
  milestoneType: z.string().max(50).optional().nullable(),
  plantId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  isCompanyWide: z.boolean().default(false),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']).default('pending'),
  targetDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  relatedGoalIds: z.array(z.number()).optional().nullable(),
  relatedFeatureIds: z.array(z.number()).optional().nullable(),
  dependencies: z.array(z.number()).optional().nullable(),
  deliverables: z.any().optional().nullable(),
  successCriteria: z.string().optional().nullable(),
  owner: z.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

const kpiTargetSchema = z.object({
  kpiName: z.string().max(255),
  kpiCategory: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  goalId: z.number().optional().nullable(),
  plantId: z.number().optional().nullable(),
  onboardingId: z.number().optional().nullable(),
  baselineValue: z.string().optional().nullable(),
  targetValue: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  measurementFrequency: z.string().max(50).optional().nullable(),
  status: z.enum(['tracking', 'on_track', 'at_risk', 'off_track', 'achieved']).default('tracking'),
  relatedFeatureIds: z.array(z.number()).optional().nullable(),
  dataSourceId: z.number().optional().nullable(),
  owner: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// ==================== IMPLEMENTATION GOALS ====================

router.get('/api/implementation/goals', async (req, res) => {
  try {
    const { plantId, onboardingId, status } = req.query;
    
    let query = `SELECT * FROM implementation_goals WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching implementation goals:', error);
    res.status(500).json({ error: 'Failed to fetch implementation goals' });
  }
});

router.post('/api/implementation/goals', async (req, res) => {
  try {
    const validated = implementationGoalSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO implementation_goals (
        business_goal_id, plant_id, onboarding_id, target_value, current_value,
        target_unit, status, priority, start_date, target_date, completion_date, notes
      ) VALUES (
        ${validated.businessGoalId}, ${validated.plantId}, ${validated.onboardingId},
        ${validated.targetValue}, ${validated.currentValue}, ${validated.targetUnit},
        ${validated.status}, ${validated.priority}, 
        ${validated.startDate ? new Date(validated.startDate) : null},
        ${validated.targetDate ? new Date(validated.targetDate) : null},
        ${validated.completionDate ? new Date(validated.completionDate) : null},
        ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating implementation goal:', error);
    res.status(500).json({ error: 'Failed to create implementation goal' });
  }
});

router.patch('/api/implementation/goals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }
    if (updates.currentValue !== undefined) {
      setClauses.push(`current_value = $${paramIndex++}`);
      params.push(updates.currentValue);
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      params.push(updates.priority);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE implementation_goals SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating implementation goal:', error);
    res.status(500).json({ error: 'Failed to update implementation goal' });
  }
});

router.delete('/api/implementation/goals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM implementation_goals WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting implementation goal:', error);
    res.status(500).json({ error: 'Failed to delete implementation goal' });
  }
});

// ==================== IMPLEMENTATION FEATURES ====================

router.get('/api/implementation/features', async (req, res) => {
  try {
    const { plantId, onboardingId, status, isUniversal } = req.query;
    
    let query = `SELECT * FROM implementation_features WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND implementation_status = $${paramIndex++}`;
      params.push(status);
    }
    if (isUniversal !== undefined) {
      query += ` AND is_universal = $${paramIndex++}`;
      params.push(isUniversal === 'true');
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching implementation features:', error);
    res.status(500).json({ error: 'Failed to fetch implementation features' });
  }
});

router.post('/api/implementation/features', async (req, res) => {
  try {
    const validated = implementationFeatureSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO implementation_features (
        feature_name, feature_category, description, plant_id, onboarding_id,
        is_universal, implementation_status, configuration_progress, testing_progress,
        deployment_progress, related_goal_ids, related_kpi_ids, dependencies, priority,
        estimated_hours, actual_hours, assigned_to, start_date, target_date, completion_date, notes
      ) VALUES (
        ${validated.featureName}, ${validated.featureCategory}, ${validated.description},
        ${validated.plantId}, ${validated.onboardingId}, ${validated.isUniversal},
        ${validated.implementationStatus}, ${validated.configurationProgress},
        ${validated.testingProgress}, ${validated.deploymentProgress},
        ${JSON.stringify(validated.relatedGoalIds || [])},
        ${JSON.stringify(validated.relatedKpiIds || [])},
        ${JSON.stringify(validated.dependencies || [])},
        ${validated.priority}, ${validated.estimatedHours}, ${validated.actualHours},
        ${validated.assignedTo},
        ${validated.startDate ? new Date(validated.startDate) : null},
        ${validated.targetDate ? new Date(validated.targetDate) : null},
        ${validated.completionDate ? new Date(validated.completionDate) : null},
        ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating implementation feature:', error);
    res.status(500).json({ error: 'Failed to create implementation feature' });
  }
});

router.patch('/api/implementation/features/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.implementationStatus) {
      setClauses.push(`implementation_status = $${paramIndex++}`);
      params.push(updates.implementationStatus);
    }
    if (updates.configurationProgress !== undefined) {
      setClauses.push(`configuration_progress = $${paramIndex++}`);
      params.push(updates.configurationProgress);
    }
    if (updates.testingProgress !== undefined) {
      setClauses.push(`testing_progress = $${paramIndex++}`);
      params.push(updates.testingProgress);
    }
    if (updates.deploymentProgress !== undefined) {
      setClauses.push(`deployment_progress = $${paramIndex++}`);
      params.push(updates.deploymentProgress);
    }
    if (updates.priority) {
      setClauses.push(`priority = $${paramIndex++}`);
      params.push(updates.priority);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    if (updates.actualHours !== undefined) {
      setClauses.push(`actual_hours = $${paramIndex++}`);
      params.push(updates.actualHours);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE implementation_features SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating implementation feature:', error);
    res.status(500).json({ error: 'Failed to update implementation feature' });
  }
});

router.delete('/api/implementation/features/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM implementation_features WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting implementation feature:', error);
    res.status(500).json({ error: 'Failed to delete implementation feature' });
  }
});

// ==================== DATA REQUIREMENTS ====================

router.get('/api/implementation/data-requirements', async (req, res) => {
  try {
    const { plantId, featureId, onboardingId, status } = req.query;
    
    let query = `SELECT * FROM implementation_data_requirements WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (featureId) {
      query += ` AND feature_id = $${paramIndex++}`;
      params.push(parseInt(featureId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND collection_status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY is_required DESC, created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data requirements:', error);
    res.status(500).json({ error: 'Failed to fetch data requirements' });
  }
});

router.post('/api/implementation/data-requirements', async (req, res) => {
  try {
    const validated = dataRequirementSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO implementation_data_requirements (
        data_name, data_category, description, plant_id, feature_id, onboarding_id,
        source_system, data_format, frequency, is_required, collection_status,
        validation_status, quality_score, mapping_progress, assigned_to, notes
      ) VALUES (
        ${validated.dataName}, ${validated.dataCategory}, ${validated.description},
        ${validated.plantId}, ${validated.featureId}, ${validated.onboardingId},
        ${validated.sourceSystem}, ${validated.dataFormat}, ${validated.frequency},
        ${validated.isRequired}, ${validated.collectionStatus}, ${validated.validationStatus},
        ${validated.qualityScore}, ${validated.mappingProgress}, ${validated.assignedTo},
        ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating data requirement:', error);
    res.status(500).json({ error: 'Failed to create data requirement' });
  }
});

router.patch('/api/implementation/data-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.collectionStatus) {
      setClauses.push(`collection_status = $${paramIndex++}`);
      params.push(updates.collectionStatus);
    }
    if (updates.validationStatus) {
      setClauses.push(`validation_status = $${paramIndex++}`);
      params.push(updates.validationStatus);
    }
    if (updates.qualityScore !== undefined) {
      setClauses.push(`quality_score = $${paramIndex++}`);
      params.push(updates.qualityScore);
    }
    if (updates.mappingProgress !== undefined) {
      setClauses.push(`mapping_progress = $${paramIndex++}`);
      params.push(updates.mappingProgress);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE implementation_data_requirements SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating data requirement:', error);
    res.status(500).json({ error: 'Failed to update data requirement' });
  }
});

router.delete('/api/implementation/data-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM implementation_data_requirements WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data requirement:', error);
    res.status(500).json({ error: 'Failed to delete data requirement' });
  }
});

// ==================== MANUFACTURING REQUIREMENTS ====================

router.get('/api/implementation/manufacturing-requirements', async (req, res) => {
  try {
    const { plantId, onboardingId, status, isUniversal } = req.query;
    
    let query = `SELECT * FROM plant_manufacturing_requirements WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND lifecycle_status = $${paramIndex++}`;
      params.push(status);
    }
    if (isUniversal !== undefined) {
      query += ` AND is_universal = $${paramIndex++}`;
      params.push(isUniversal === 'true');
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching manufacturing requirements:', error);
    res.status(500).json({ error: 'Failed to fetch manufacturing requirements' });
  }
});

router.post('/api/implementation/manufacturing-requirements', async (req, res) => {
  try {
    const validated = manufacturingRequirementSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO plant_manufacturing_requirements (
        requirement_name, requirement_category, description, plant_id, onboarding_id,
        is_universal, lifecycle_status, modeling_progress, testing_progress, deployment_progress,
        related_feature_ids, related_goal_ids, related_data_ids, priority, business_impact,
        success_criteria, assigned_to, start_date, target_date, completion_date, notes
      ) VALUES (
        ${validated.requirementName}, ${validated.requirementCategory}, ${validated.description},
        ${validated.plantId}, ${validated.onboardingId}, ${validated.isUniversal},
        ${validated.lifecycleStatus}, ${validated.modelingProgress}, ${validated.testingProgress},
        ${validated.deploymentProgress},
        ${JSON.stringify(validated.relatedFeatureIds || [])},
        ${JSON.stringify(validated.relatedGoalIds || [])},
        ${JSON.stringify(validated.relatedDataIds || [])},
        ${validated.priority}, ${validated.businessImpact},
        ${JSON.stringify(validated.successCriteria || {})},
        ${validated.assignedTo},
        ${validated.startDate ? new Date(validated.startDate) : null},
        ${validated.targetDate ? new Date(validated.targetDate) : null},
        ${validated.completionDate ? new Date(validated.completionDate) : null},
        ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating manufacturing requirement:', error);
    res.status(500).json({ error: 'Failed to create manufacturing requirement' });
  }
});

router.patch('/api/implementation/manufacturing-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.lifecycleStatus) {
      setClauses.push(`lifecycle_status = $${paramIndex++}`);
      params.push(updates.lifecycleStatus);
    }
    if (updates.modelingProgress !== undefined) {
      setClauses.push(`modeling_progress = $${paramIndex++}`);
      params.push(updates.modelingProgress);
    }
    if (updates.testingProgress !== undefined) {
      setClauses.push(`testing_progress = $${paramIndex++}`);
      params.push(updates.testingProgress);
    }
    if (updates.deploymentProgress !== undefined) {
      setClauses.push(`deployment_progress = $${paramIndex++}`);
      params.push(updates.deploymentProgress);
    }
    if (updates.priority) {
      setClauses.push(`priority = $${paramIndex++}`);
      params.push(updates.priority);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE plant_manufacturing_requirements SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating manufacturing requirement:', error);
    res.status(500).json({ error: 'Failed to update manufacturing requirement' });
  }
});

router.delete('/api/implementation/manufacturing-requirements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM plant_manufacturing_requirements WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting manufacturing requirement:', error);
    res.status(500).json({ error: 'Failed to delete manufacturing requirement' });
  }
});

// ==================== MILESTONES ====================

router.get('/api/implementation/milestones', async (req, res) => {
  try {
    const { plantId, onboardingId, status, isCompanyWide } = req.query;
    
    let query = `SELECT * FROM implementation_milestones WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (isCompanyWide !== undefined) {
      query += ` AND is_company_wide = $${paramIndex++}`;
      params.push(isCompanyWide === 'true');
    }
    
    query += ' ORDER BY target_date ASC NULLS LAST, created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

router.post('/api/implementation/milestones', async (req, res) => {
  try {
    const validated = milestoneSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO implementation_milestones (
        milestone_name, description, milestone_type, plant_id, onboarding_id,
        is_company_wide, status, target_date, completion_date, related_goal_ids,
        related_feature_ids, dependencies, deliverables, success_criteria, owner, notes
      ) VALUES (
        ${validated.milestoneName}, ${validated.description}, ${validated.milestoneType},
        ${validated.plantId}, ${validated.onboardingId}, ${validated.isCompanyWide},
        ${validated.status},
        ${validated.targetDate ? new Date(validated.targetDate) : null},
        ${validated.completionDate ? new Date(validated.completionDate) : null},
        ${JSON.stringify(validated.relatedGoalIds || [])},
        ${JSON.stringify(validated.relatedFeatureIds || [])},
        ${JSON.stringify(validated.dependencies || [])},
        ${JSON.stringify(validated.deliverables || [])},
        ${validated.successCriteria}, ${validated.owner}, ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

router.patch('/api/implementation/milestones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.status) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    if (updates.completionDate) {
      setClauses.push(`completion_date = $${paramIndex++}`);
      params.push(updates.completionDate);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE implementation_milestones SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

router.delete('/api/implementation/milestones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM implementation_milestones WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// ==================== KPI TARGETS ====================

router.get('/api/implementation/kpi-targets', async (req, res) => {
  try {
    const { plantId, goalId, onboardingId, status } = req.query;
    
    let query = `SELECT * FROM implementation_kpi_targets WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (goalId) {
      query += ` AND goal_id = $${paramIndex++}`;
      params.push(parseInt(goalId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    res.status(500).json({ error: 'Failed to fetch KPI targets' });
  }
});

router.post('/api/implementation/kpi-targets', async (req, res) => {
  try {
    const validated = kpiTargetSchema.parse(req.body);
    
    const result = await db.execute(sql`
      INSERT INTO implementation_kpi_targets (
        kpi_name, kpi_category, description, goal_id, plant_id, onboarding_id,
        baseline_value, target_value, current_value, unit, measurement_frequency,
        status, related_feature_ids, data_source_id, owner, start_date, target_date, notes
      ) VALUES (
        ${validated.kpiName}, ${validated.kpiCategory}, ${validated.description},
        ${validated.goalId}, ${validated.plantId}, ${validated.onboardingId},
        ${validated.baselineValue}, ${validated.targetValue}, ${validated.currentValue},
        ${validated.unit}, ${validated.measurementFrequency}, ${validated.status},
        ${JSON.stringify(validated.relatedFeatureIds || [])},
        ${validated.dataSourceId}, ${validated.owner},
        ${validated.startDate ? new Date(validated.startDate) : null},
        ${validated.targetDate ? new Date(validated.targetDate) : null},
        ${validated.notes}
      ) RETURNING *
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating KPI target:', error);
    res.status(500).json({ error: 'Failed to create KPI target' });
  }
});

router.patch('/api/implementation/kpi-targets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.currentValue !== undefined) {
      setClauses.push(`current_value = $${paramIndex++}`);
      params.push(updates.currentValue);
    }
    if (updates.status) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }
    
    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `UPDATE implementation_kpi_targets SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.execute(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating KPI target:', error);
    res.status(500).json({ error: 'Failed to update KPI target' });
  }
});

router.delete('/api/implementation/kpi-targets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(sql`DELETE FROM implementation_kpi_targets WHERE id = ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting KPI target:', error);
    res.status(500).json({ error: 'Failed to delete KPI target' });
  }
});

// ==================== TASKS ====================

router.get('/api/implementation/tasks', async (req, res) => {
  try {
    const { plantId, milestoneId, featureId, onboardingId, status } = req.query;
    
    let query = `SELECT * FROM implementation_tasks WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (plantId) {
      query += ` AND plant_id = $${paramIndex++}`;
      params.push(parseInt(plantId as string));
    }
    if (milestoneId) {
      query += ` AND milestone_id = $${paramIndex++}`;
      params.push(parseInt(milestoneId as string));
    }
    if (featureId) {
      query += ` AND feature_id = $${paramIndex++}`;
      params.push(parseInt(featureId as string));
    }
    if (onboardingId) {
      query += ` AND onboarding_id = $${paramIndex++}`;
      params.push(parseInt(onboardingId as string));
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY priority DESC, due_date ASC NULLS LAST';
    
    const result = await db.execute(sql.raw(query));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ==================== DASHBOARD SUMMARY ====================

router.get('/api/implementation/dashboard', async (req, res) => {
  try {
    const { plantId, onboardingId } = req.query;
    
    const goalsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'at_risk') as at_risk
      FROM implementation_goals
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    const featuresResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE implementation_status = 'completed') as completed,
        COUNT(*) FILTER (WHERE implementation_status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE implementation_status = 'blocked') as blocked,
        AVG(configuration_progress) as avg_config_progress,
        AVG(testing_progress) as avg_testing_progress,
        AVG(deployment_progress) as avg_deployment_progress
      FROM implementation_features
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    const requirementsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lifecycle_status = 'completed') as completed,
        COUNT(*) FILTER (WHERE lifecycle_status = 'modeling') as modeling,
        COUNT(*) FILTER (WHERE lifecycle_status = 'testing') as testing,
        COUNT(*) FILTER (WHERE lifecycle_status = 'deployment') as deployment
      FROM plant_manufacturing_requirements
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    const dataResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE collection_status = 'integrated') as integrated,
        COUNT(*) FILTER (WHERE collection_status = 'validated') as validated,
        COUNT(*) FILTER (WHERE validation_status = 'failed') as failed_validation,
        AVG(quality_score) as avg_quality_score,
        AVG(mapping_progress) as avg_mapping_progress
      FROM implementation_data_requirements
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    const milestonesResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'delayed') as delayed,
        MIN(target_date) FILTER (WHERE status != 'completed') as next_milestone_date
      FROM implementation_milestones
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    const kpisResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'achieved') as achieved,
        COUNT(*) FILTER (WHERE status = 'on_track') as on_track,
        COUNT(*) FILTER (WHERE status = 'at_risk') as at_risk,
        COUNT(*) FILTER (WHERE status = 'off_track') as off_track
      FROM implementation_kpi_targets
      ${plantId ? sql`WHERE plant_id = ${parseInt(plantId as string)}` : sql``}
    `);
    
    res.json({
      goals: goalsResult.rows[0],
      features: featuresResult.rows[0],
      manufacturingRequirements: requirementsResult.rows[0],
      dataRequirements: dataResult.rows[0],
      milestones: milestonesResult.rows[0],
      kpis: kpisResult.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching implementation dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch implementation dashboard' });
  }
});

// ==================== GENERATE SAMPLE DATA ====================

router.post('/api/implementation/generate-sample-data', async (req, res) => {
  try {
    const { plantId, onboardingId } = req.body;
    
    const existingGoals = await db.execute(sql`SELECT COUNT(*) as count FROM implementation_goals`);
    if (parseInt(existingGoals.rows[0].count as string) > 0) {
      return res.json({ message: 'Sample data already exists' });
    }
    
    await db.execute(sql`
      INSERT INTO implementation_goals (business_goal_id, plant_id, onboarding_id, target_value, current_value, target_unit, status, priority, notes)
      VALUES 
        (NULL, ${plantId || 1}, ${onboardingId || 1}, '95', '82', '%', 'in_progress', 'high', 'Improve OEE to world-class levels'),
        (NULL, ${plantId || 1}, ${onboardingId || 1}, '20', '35', 'minutes', 'in_progress', 'medium', 'Reduce average changeover time'),
        (NULL, ${plantId || 1}, ${onboardingId || 1}, '99.5', '97.2', '%', 'on_track', 'high', 'Achieve near-perfect quality rate'),
        (NULL, ${plantId || 2}, ${onboardingId || 1}, '15', '22', '%', 'at_risk', 'critical', 'Reduce inventory holding costs')
    `);
    
    await db.execute(sql`
      INSERT INTO implementation_features (feature_name, feature_category, description, plant_id, onboarding_id, is_universal, implementation_status, configuration_progress, testing_progress, deployment_progress, priority)
      VALUES 
        ('Real-time Production Monitoring', 'Monitoring', 'Live dashboards for production status', ${plantId || 1}, ${onboardingId || 1}, true, 'completed', 100, 100, 100, 'high'),
        ('Predictive Maintenance', 'Maintenance', 'ML-based equipment failure prediction', ${plantId || 1}, ${onboardingId || 1}, false, 'in_progress', 80, 45, 0, 'high'),
        ('Advanced Scheduling Engine', 'Planning', 'Constraint-based scheduling optimization', ${plantId || 1}, ${onboardingId || 1}, true, 'in_progress', 100, 70, 30, 'critical'),
        ('Quality Analytics', 'Quality', 'SPC charts and defect analysis', ${plantId || 1}, ${onboardingId || 1}, false, 'pending', 20, 0, 0, 'medium'),
        ('Material Flow Optimization', 'Logistics', 'WIP tracking and routing', ${plantId || 2}, ${onboardingId || 1}, false, 'blocked', 60, 10, 0, 'high')
    `);
    
    await db.execute(sql`
      INSERT INTO plant_manufacturing_requirements (requirement_name, requirement_category, description, plant_id, onboarding_id, is_universal, lifecycle_status, modeling_progress, testing_progress, deployment_progress, priority)
      VALUES 
        ('Multi-machine constraint handling', 'Scheduling', 'Handle complex resource dependencies', ${plantId || 1}, ${onboardingId || 1}, true, 'testing', 100, 60, 0, 'critical'),
        ('Batch size optimization', 'Production', 'Dynamic batch sizing based on demand', ${plantId || 1}, ${onboardingId || 1}, false, 'modeling', 45, 0, 0, 'high'),
        ('Setup matrix integration', 'Scheduling', 'Sequence-dependent setup times', ${plantId || 1}, ${onboardingId || 1}, true, 'deployment', 100, 100, 75, 'high'),
        ('Energy consumption tracking', 'Sustainability', 'Track energy per unit produced', ${plantId || 2}, ${onboardingId || 1}, false, 'identified', 10, 0, 0, 'medium')
    `);
    
    await db.execute(sql`
      INSERT INTO implementation_data_requirements (data_name, data_category, description, plant_id, onboarding_id, source_system, data_format, frequency, is_required, collection_status, validation_status, quality_score, mapping_progress)
      VALUES 
        ('Production Orders', 'Planning', 'Order data from ERP', ${plantId || 1}, ${onboardingId || 1}, 'SAP', 'iDoc', 'Real-time', true, 'integrated', 'passed', 95, 100),
        ('Machine Status', 'Equipment', 'PLC signals for state tracking', ${plantId || 1}, ${onboardingId || 1}, 'Siemens PLC', 'OPC-UA', 'Real-time', true, 'validated', 'passed', 88, 100),
        ('Quality Measurements', 'Quality', 'Inspection results', ${plantId || 1}, ${onboardingId || 1}, 'QMS', 'CSV', 'Hourly', true, 'in_progress', 'pending', NULL, 45),
        ('Maintenance Logs', 'Maintenance', 'Work order history', ${plantId || 1}, ${onboardingId || 1}, 'CMMS', 'API', 'Daily', false, 'not_started', 'pending', NULL, 0),
        ('Energy Meter Data', 'Sustainability', 'Power consumption readings', ${plantId || 2}, ${onboardingId || 1}, 'IoT Gateway', 'MQTT', 'Minute', false, 'collected', 'needs_review', 72, 60)
    `);
    
    await db.execute(sql`
      INSERT INTO implementation_milestones (milestone_name, description, milestone_type, plant_id, onboarding_id, is_company_wide, status, target_date, success_criteria)
      VALUES 
        ('Phase 1: Foundation Complete', 'Core infrastructure and data integration', 'Phase', ${plantId || 1}, ${onboardingId || 1}, false, 'completed', '2025-10-15', 'All core data sources connected'),
        ('Phase 2: Scheduling Go-Live', 'Production scheduling module live', 'Phase', ${plantId || 1}, ${onboardingId || 1}, false, 'in_progress', '2025-12-31', 'Scheduling engine in production'),
        ('Q1 2026 Review', 'Quarterly progress assessment', 'Review', NULL, NULL, true, 'pending', '2026-03-31', 'All plants on track'),
        ('Full Rollout Complete', 'All plants fully operational', 'Major', NULL, NULL, true, 'pending', '2027-06-30', '100% plant coverage')
    `);
    
    await db.execute(sql`
      INSERT INTO implementation_kpi_targets (kpi_name, kpi_category, description, plant_id, onboarding_id, baseline_value, target_value, current_value, unit, measurement_frequency, status)
      VALUES 
        ('OEE', 'Performance', 'Overall Equipment Effectiveness', ${plantId || 1}, ${onboardingId || 1}, '72', '85', '78', '%', 'Daily', 'on_track'),
        ('Schedule Adherence', 'Planning', 'On-time completion rate', ${plantId || 1}, ${onboardingId || 1}, '68', '95', '82', '%', 'Weekly', 'at_risk'),
        ('First Pass Yield', 'Quality', 'Products passing first inspection', ${plantId || 1}, ${onboardingId || 1}, '91', '98', '94.5', '%', 'Daily', 'on_track'),
        ('Changeover Time', 'Efficiency', 'Average setup duration', ${plantId || 1}, ${onboardingId || 1}, '45', '25', '32', 'minutes', 'Per event', 'on_track'),
        ('Inventory Turns', 'Financial', 'Annual inventory turnover', ${plantId || 2}, ${onboardingId || 1}, '8', '12', '9.2', 'turns/year', 'Monthly', 'at_risk')
    `);
    
    res.json({ success: true, message: 'Sample implementation data created successfully' });
  } catch (error) {
    console.error('Error generating sample data:', error);
    res.status(500).json({ error: 'Failed to generate sample data' });
  }
});

export default router;
