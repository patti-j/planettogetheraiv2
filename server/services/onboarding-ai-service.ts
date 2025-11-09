import { openai } from './openai-config';
import { db } from '../db';
import { 
  plantOnboarding, 
  onboardingTemplates, 
  onboardingAIRecommendations, 
  onboardingRequirements,
  plantOnboardingPhases,
  plantOnboardingTasks
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Sample onboarding templates for different industries
export const SAMPLE_TEMPLATES = [
  {
    name: "Brewery Operations",
    description: "Complete brewery onboarding from grain to glass",
    industry: "Food & Beverage",
    plantType: "Brewery",
    estimatedDuration: 90,
    phases: [
      {
        phaseId: "discovery",
        phaseName: "Discovery & Assessment",
        duration: 14,
        tasks: [
          { taskId: "t1", title: "Current state assessment", description: "Document existing processes and systems", estimatedHours: 16 },
          { taskId: "t2", title: "Requirements gathering", description: "Identify key business requirements", estimatedHours: 8 },
          { taskId: "t3", title: "Data mapping", description: "Map current data sources and flows", estimatedHours: 12 },
          { taskId: "t4", title: "Gap analysis", description: "Identify gaps between current state and desired state", estimatedHours: 8 }
        ],
        milestones: [
          { name: "Requirements documented", targetDate: 7 },
          { name: "Gap analysis complete", targetDate: 14 }
        ]
      },
      {
        phaseId: "setup",
        phaseName: "System Configuration",
        duration: 21,
        tasks: [
          { taskId: "t5", title: "Master data setup", description: "Configure products, resources, operations", estimatedHours: 24 },
          { taskId: "t6", title: "Production routing", description: "Set up brewing recipes and routings", estimatedHours: 16 },
          { taskId: "t7", title: "Quality parameters", description: "Define quality checkpoints and parameters", estimatedHours: 12 },
          { taskId: "t8", title: "Scheduling rules", description: "Configure ASAP/ALAP and critical sequences", estimatedHours: 8 }
        ],
        milestones: [
          { name: "Master data complete", targetDate: 10 },
          { name: "First test schedule generated", targetDate: 21 }
        ]
      },
      {
        phaseId: "integration",
        phaseName: "System Integration",
        duration: 14,
        tasks: [
          { taskId: "t9", title: "ERP integration", description: "Connect to existing ERP system", estimatedHours: 32 },
          { taskId: "t10", title: "Sensor integration", description: "Connect brewery sensors and IoT devices", estimatedHours: 24 },
          { taskId: "t11", title: "Quality systems", description: "Integrate with LIMS/QMS", estimatedHours: 16 },
          { taskId: "t12", title: "Data validation", description: "Validate data flow and accuracy", estimatedHours: 8 }
        ]
      },
      {
        phaseId: "training",
        phaseName: "Training & Enablement",
        duration: 21,
        tasks: [
          { taskId: "t13", title: "Admin training", description: "Train system administrators", estimatedHours: 16 },
          { taskId: "t14", title: "Planner training", description: "Train production planners", estimatedHours: 24 },
          { taskId: "t15", title: "Operator training", description: "Train shop floor operators", estimatedHours: 16 },
          { taskId: "t16", title: "Documentation", description: "Create SOPs and user guides", estimatedHours: 20 }
        ]
      },
      {
        phaseId: "go-live",
        phaseName: "Go-Live & Optimization",
        duration: 20,
        tasks: [
          { taskId: "t17", title: "Pilot run", description: "Run pilot with subset of production", estimatedHours: 40 },
          { taskId: "t18", title: "Performance tuning", description: "Optimize scheduling algorithms", estimatedHours: 24 },
          { taskId: "t19", title: "Full rollout", description: "Deploy to all production lines", estimatedHours: 32 },
          { taskId: "t20", title: "Hypercare support", description: "Provide intensive support", estimatedHours: 80 }
        ]
      }
    ],
    goals: [
      { goalId: "g1", name: "Reduce changeover time", target: "30% reduction", metric: "minutes" },
      { goalId: "g2", name: "Improve OEE", target: "15% improvement", metric: "percentage" },
      { goalId: "g3", name: "Reduce waste", target: "20% reduction", metric: "percentage" },
      { goalId: "g4", name: "Improve on-time delivery", target: "95%", metric: "percentage" }
    ]
  },
  {
    name: "Pharmaceutical Manufacturing",
    description: "GMP-compliant pharmaceutical production onboarding",
    industry: "Pharmaceutical",
    plantType: "Manufacturing",
    estimatedDuration: 120,
    phases: [
      {
        phaseId: "validation",
        phaseName: "Validation & Compliance",
        duration: 30,
        tasks: [
          { taskId: "t1", title: "IQ/OQ/PQ protocols", description: "Develop validation protocols", estimatedHours: 40 },
          { taskId: "t2", title: "21 CFR Part 11 assessment", description: "Ensure compliance with regulations", estimatedHours: 24 },
          { taskId: "t3", title: "Risk assessment", description: "Perform FMEA analysis", estimatedHours: 16 },
          { taskId: "t4", title: "Audit trail setup", description: "Configure comprehensive audit trails", estimatedHours: 8 }
        ]
      },
      {
        phaseId: "batch-tracking",
        phaseName: "Batch & Lot Management",
        duration: 21,
        tasks: [
          { taskId: "t5", title: "Batch genealogy", description: "Set up complete batch tracking", estimatedHours: 32 },
          { taskId: "t6", title: "Electronic batch records", description: "Configure EBR system", estimatedHours: 24 },
          { taskId: "t7", title: "Material tracking", description: "Track all raw materials and intermediates", estimatedHours: 16 }
        ]
      }
    ],
    goals: [
      { goalId: "g1", name: "Compliance rate", target: "100%", metric: "percentage" },
      { goalId: "g2", name: "Right first time", target: "98%", metric: "percentage" },
      { goalId: "g3", name: "Batch cycle time", target: "10% reduction", metric: "percentage" }
    ]
  },
  {
    name: "Food Processing Plant",
    description: "Food safety and efficiency focused onboarding",
    industry: "Food & Beverage",
    plantType: "Processing",
    estimatedDuration: 75,
    phases: [
      {
        phaseId: "food-safety",
        phaseName: "Food Safety Setup",
        duration: 14,
        tasks: [
          { taskId: "t1", title: "HACCP integration", description: "Integrate HACCP control points", estimatedHours: 24 },
          { taskId: "t2", title: "Allergen management", description: "Set up allergen tracking and scheduling", estimatedHours: 16 },
          { taskId: "t3", title: "Traceability setup", description: "Configure end-to-end traceability", estimatedHours: 20 }
        ]
      },
      {
        phaseId: "efficiency",
        phaseName: "Efficiency Optimization",
        duration: 21,
        tasks: [
          { taskId: "t4", title: "Line balancing", description: "Optimize production line balancing", estimatedHours: 32 },
          { taskId: "t5", title: "Changeover optimization", description: "Minimize changeover times", estimatedHours: 24 },
          { taskId: "t6", title: "Yield optimization", description: "Maximize product yield", estimatedHours: 16 }
        ]
      }
    ],
    goals: [
      { goalId: "g1", name: "Food safety compliance", target: "100%", metric: "percentage" },
      { goalId: "g2", name: "Throughput increase", target: "20%", metric: "percentage" },
      { goalId: "g3", name: "Waste reduction", target: "25%", metric: "percentage" }
    ]
  }
];

// AI-powered requirement analysis
export class OnboardingAIService {
  // Analyze uploaded requirements document and suggest features
  async analyzeRequirements(
    onboardingId: number,
    requirementText: string,
    documentName?: string
  ) {
    try {
      const prompt = `Analyze the following customer requirements for a manufacturing execution system and suggest:
1. Which PlanetTogether features should be enabled
2. What data sources need to be integrated
3. What configurations are needed
4. Implementation priorities

Customer Requirements:
${requirementText}

Provide a structured analysis with specific recommendations for:
- Production scheduling features
- Quality management
- Inventory tracking
- Reporting and analytics
- System integrations
- Data requirements

Format the response as JSON with the following structure:
{
  "requirements": [
    {
      "category": "production|quality|compliance|reporting|integration",
      "requirement": "extracted requirement text",
      "businessGoals": ["goal1", "goal2"],
      "successCriteria": ["criteria1", "criteria2"],
      "priority": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "type": "feature|configuration|data_source|integration",
      "title": "recommendation title",
      "description": "detailed description",
      "reasoning": "why this is recommended",
      "priority": "high|medium|low",
      "suggestedFeatures": ["feature1", "feature2"],
      "suggestedDataSources": ["source1", "source2"],
      "implementationSteps": ["step1", "step2"],
      "estimatedImpact": {
        "metric": "metric name",
        "improvement": "expected improvement"
      }
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert manufacturing consultant specializing in PlanetTogether APS implementation.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Save requirements
      for (const req of analysis.requirements || []) {
        await db.insert(onboardingRequirements).values({
          onboardingId,
          requirementCategory: req.category,
          requirementText: req.requirement,
          extractedFrom: documentName,
          businessGoals: req.businessGoals,
          successCriteria: req.successCriteria,
          mappedFeatures: req.suggestedFeatures,
          priority: req.priority,
          status: 'analyzed',
          analyzedAt: new Date()
        });
      }
      
      // Save AI recommendations
      for (const rec of analysis.recommendations || []) {
        await db.insert(onboardingAIRecommendations).values({
          onboardingId,
          recommendationType: rec.type,
          title: rec.title,
          description: rec.description,
          reasoning: rec.reasoning,
          priority: rec.priority,
          suggestedFeatures: rec.suggestedFeatures,
          suggestedDataSources: rec.suggestedDataSources,
          implementationSteps: rec.implementationSteps,
          estimatedImpact: rec.estimatedImpact,
          status: 'pending'
        });
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing requirements:', error);
      throw error;
    }
  }
  
  // Generate customized onboarding plan based on business goals
  async generateCustomPlan(
    plantId: number,
    businessGoals: string[],
    currentChallenges: string[],
    industry: string,
    plantType: string
  ) {
    try {
      const prompt = `Generate a customized PlanetTogether onboarding plan for:
Industry: ${industry}
Plant Type: ${plantType}
Business Goals: ${businessGoals.join(', ')}
Current Challenges: ${currentChallenges.join(', ')}

Create a detailed implementation plan with:
1. Phases with specific tasks and milestones
2. Features to prioritize based on goals
3. Success metrics aligned with business goals
4. Risk mitigation strategies
5. Timeline estimates

Format as JSON with phases, tasks, goals, and metrics.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert in manufacturing system implementations.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating custom plan:', error);
      throw error;
    }
  }
  
  // Get company-wide onboarding overview
  async getCompanyOverview() {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.plant_id,
          p.name as plant_name,
          po.id as onboarding_id,
          po.name as onboarding_name,
          po.status,
          po.overall_progress,
          po.start_date,
          po.target_completion_date,
          po.current_phase,
          COUNT(DISTINCT pop.id) as total_phases,
          COUNT(DISTINCT CASE WHEN pop.status = 'completed' THEN pop.id END) as completed_phases,
          COUNT(DISTINCT pot.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN pot.status = 'completed' THEN pot.id END) as completed_tasks
        FROM ptplants p
        LEFT JOIN plant_onboarding po ON p.plant_id = po.plant_id
        LEFT JOIN plant_onboarding_phases pop ON po.id = pop.onboarding_id
        LEFT JOIN plant_onboarding_tasks pot ON pop.id = pot.phase_id
        GROUP BY p.plant_id, p.name, po.id, po.name, po.status, 
                 po.overall_progress, po.start_date, po.target_completion_date, po.current_phase
        ORDER BY p.name
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting company overview:', error);
      throw error;
    }
  }
}

export const onboardingAIService = new OnboardingAIService();