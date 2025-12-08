import { db } from "./db";
import { 
  // implementationProjects,
  // implementationPhases,
  // implementationSops,
  // implementationDocuments,
  // implementationSignoffs,
  // implementationActivities,
  // implementationTasks,
  // implementationComments,
  // implementationStatusReports,
  companyOnboarding,
  type InsertImplementationProject,
  type InsertImplementationPhase,
  type InsertImplementationSop,
  type InsertImplementationDocument,
  type InsertImplementationSignoff,
  type InsertImplementationActivity,
  type InsertImplementationTask,
  type InsertImplementationComment,
  type InsertImplementationStatusReport,
  type ImplementationProject,
  type ImplementationPhase,
  type ImplementationSop,
  type ImplementationDocument,
  type ImplementationSignoff,
  type ImplementationActivity,
  type ImplementationTask,
  type ImplementationComment,
  type ImplementationStatusReport
} from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import OpenAI from "openai";
import { DEFAULT_MODEL } from "./config/ai-model";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class ImplementationService {
  // ===== PROJECT MANAGEMENT =====
  
  async createProject(data: InsertImplementationProject): Promise<ImplementationProject> {
    // Get the company name from onboarding data
    const [onboardingData] = await db.select()
      .from(companyOnboarding)
      .orderBy(desc(companyOnboarding.createdAt))
      .limit(1);
    
    // Create the project data with company info from onboarding
    const projectData = {
      ...data,
      clientCompany: onboardingData?.companyName || data.clientCompany,
      companyOnboardingId: onboardingData?.id || data.companyOnboardingId
    };
    
    // Generate project code if not provided
    if (!projectData.projectCode) {
      const year = new Date().getFullYear();
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(implementationProjects)
        .where(sql`project_code LIKE ${`IMPL-${year}-%`}`);
      projectData.projectCode = `IMPL-${year}-${String((count[0]?.count || 0) + 1).padStart(3, '0')}`;
    }
    
    const [project] = await db.insert(implementationProjects)
      .values(projectData)
      .returning();
      
    // Create default phases if it's a new project
    if (project.id) {
      await this.createDefaultPhases(project.id, projectData.projectType || 'full_implementation');
      await this.logActivity({
        projectId: project.id,
        activityType: 'project_created',
        title: 'Project Created',
        description: `Implementation project ${project.projectCode} has been created`,
        activityDate: new Date(),
        performedBy: projectData.projectManager || undefined
      });
    }
    
    return project;
  }
  
  async getProject(projectId: number): Promise<ImplementationProject | null> {
    const [project] = await db.select()
      .from(implementationProjects)
      .where(eq(implementationProjects.id, projectId));
    return project || null;
  }
  
  async listProjects(filters?: {
    status?: string;
    projectManager?: number;
    clientCompany?: string;
  }): Promise<ImplementationProject[]> {
    let query = db.select().from(implementationProjects);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(implementationProjects.status, filters.status));
    }
    if (filters?.projectManager) {
      conditions.push(eq(implementationProjects.projectManager, filters.projectManager));
    }
    if (filters?.clientCompany) {
      conditions.push(eq(implementationProjects.clientCompany, filters.clientCompany));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(implementationProjects.createdAt));
  }
  
  async updateProject(projectId: number, data: Partial<InsertImplementationProject>): Promise<ImplementationProject | null> {
    const [updated] = await db.update(implementationProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(implementationProjects.id, projectId))
      .returning();
    return updated || null;
  }
  
  // ===== PHASE MANAGEMENT =====
  
  async createDefaultPhases(projectId: number, projectType: string) {
    const defaultPhases = this.getDefaultPhases(projectType);
    
    for (let i = 0; i < defaultPhases.length; i++) {
      await db.insert(implementationPhases).values({
        projectId,
        phaseNumber: i + 1,
        phaseName: defaultPhases[i].name,
        description: defaultPhases[i].description,
        deliverables: defaultPhases[i].deliverables,
        acceptanceCriteria: defaultPhases[i].acceptanceCriteria,
        status: 'pending'
      });
    }
  }
  
  private getDefaultPhases(projectType: string) {
    const phases = {
      full_implementation: [
        {
          name: 'Project Kickoff & Planning',
          description: 'Initialize project, establish team, and create detailed project plan',
          deliverables: ['Project charter', 'Communication plan', 'Risk register', 'Detailed project schedule'],
          acceptanceCriteria: ['All stakeholders identified', 'Project plan approved', 'Resources allocated']
        },
        {
          name: 'Requirements & Design',
          description: 'Gather business requirements and design system configuration',
          deliverables: ['Requirements document', 'System design document', 'Data migration plan', 'Integration specifications'],
          acceptanceCriteria: ['Requirements signed off', 'Design approved by stakeholders', 'Test scenarios defined']
        },
        {
          name: 'System Configuration',
          description: 'Configure system according to approved design',
          deliverables: ['Configured system', 'Configuration documentation', 'Custom development (if any)'],
          acceptanceCriteria: ['All modules configured', 'Custom code tested', 'Configuration review completed']
        },
        {
          name: 'Data Migration',
          description: 'Migrate data from legacy systems',
          deliverables: ['Migrated data', 'Data validation report', 'Data reconciliation report'],
          acceptanceCriteria: ['Data migrated successfully', 'Data validation passed', 'User acceptance of data quality']
        },
        {
          name: 'Testing & Quality Assurance',
          description: 'Perform comprehensive system testing',
          deliverables: ['Test results', 'Defect log', 'Performance test results', 'Security audit report'],
          acceptanceCriteria: ['All critical defects resolved', 'Performance benchmarks met', 'Security requirements satisfied']
        },
        {
          name: 'Training & Documentation',
          description: 'Train users and prepare documentation',
          deliverables: ['Training materials', 'User manuals', 'Admin guides', 'Training completion records'],
          acceptanceCriteria: ['All users trained', 'Documentation approved', 'Training feedback positive']
        },
        {
          name: 'Go-Live Preparation',
          description: 'Prepare for production deployment',
          deliverables: ['Go-live checklist', 'Cutover plan', 'Rollback plan', 'Support plan'],
          acceptanceCriteria: ['Go-live readiness confirmed', 'Support team ready', 'Contingency plans in place']
        },
        {
          name: 'Go-Live & Support',
          description: 'Deploy to production and provide hypercare support',
          deliverables: ['Production system', 'Go-live report', 'Issue log', 'Performance metrics'],
          acceptanceCriteria: ['System operational', 'Users able to work', 'Critical issues resolved']
        },
        {
          name: 'Post-Implementation Review',
          description: 'Review project success and handover to support',
          deliverables: ['Project closure report', 'Lessons learned', 'Support handover', 'Benefits realization plan'],
          acceptanceCriteria: ['Project objectives met', 'Knowledge transferred', 'Support team operational']
        }
      ],
      migration: [
        { name: 'Migration Assessment', description: 'Assess current system and migration requirements', deliverables: [], acceptanceCriteria: [] },
        { name: 'Migration Planning', description: 'Plan migration approach and timeline', deliverables: [], acceptanceCriteria: [] },
        { name: 'System Setup', description: 'Setup target system environment', deliverables: [], acceptanceCriteria: [] },
        { name: 'Data Migration', description: 'Migrate data to new system', deliverables: [], acceptanceCriteria: [] },
        { name: 'Validation & Testing', description: 'Validate migrated data and test system', deliverables: [], acceptanceCriteria: [] },
        { name: 'Cutover', description: 'Switch to new system', deliverables: [], acceptanceCriteria: [] }
      ],
      pilot: [
        { name: 'Pilot Planning', description: 'Plan pilot scope and success criteria', deliverables: [], acceptanceCriteria: [] },
        { name: 'Pilot Setup', description: 'Setup pilot environment', deliverables: [], acceptanceCriteria: [] },
        { name: 'Pilot Execution', description: 'Run pilot with selected users', deliverables: [], acceptanceCriteria: [] },
        { name: 'Pilot Review', description: 'Review pilot results and decide on rollout', deliverables: [], acceptanceCriteria: [] }
      ]
    };
    
    return phases[projectType] || phases.full_implementation;
  }
  
  async getPhases(projectId: number): Promise<ImplementationPhase[]> {
    return db.select()
      .from(implementationPhases)
      .where(eq(implementationPhases.projectId, projectId))
      .orderBy(implementationPhases.phaseNumber);
  }
  
  async updatePhase(phaseId: number, data: Partial<InsertImplementationPhase>): Promise<ImplementationPhase | null> {
    const [updated] = await db.update(implementationPhases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(implementationPhases.id, phaseId))
      .returning();
      
    if (updated && data.status === 'completed') {
      await this.checkProjectCompletion(updated.projectId);
    }
    
    return updated || null;
  }
  
  private async checkProjectCompletion(projectId: number) {
    const phases = await this.getPhases(projectId);
    const allComplete = phases.every(p => p.status === 'completed');
    
    if (allComplete) {
      await this.updateProject(projectId, { 
        status: 'completed',
        actualGoLiveDate: new Date(),
        completionPercentage: "100"
      });
    } else {
      const completedCount = phases.filter(p => p.status === 'completed').length;
      const percentage = ((completedCount / phases.length) * 100).toFixed(2);
      await this.updateProject(projectId, { 
        completionPercentage: percentage
      });
    }
  }
  
  // ===== SOP MANAGEMENT =====
  
  async createSop(data: InsertImplementationSop): Promise<ImplementationSop> {
    const [sop] = await db.insert(implementationSops)
      .values(data)
      .returning();
    return sop;
  }
  
  async getSops(filters?: {
    category?: string;
    isActive?: boolean;
    isTemplate?: boolean;
  }): Promise<ImplementationSop[]> {
    let query = db.select().from(implementationSops);
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(implementationSops.category, filters.category));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(implementationSops.isActive, filters.isActive));
    }
    if (filters?.isTemplate !== undefined) {
      conditions.push(eq(implementationSops.isTemplate, filters.isTemplate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(implementationSops.title);
  }
  
  async useSop(sopId: number): Promise<void> {
    await db.update(implementationSops)
      .set({ 
        usageCount: sql`usage_count + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(implementationSops.id, sopId));
  }
  
  // ===== DOCUMENT MANAGEMENT =====
  
  async uploadDocument(data: InsertImplementationDocument): Promise<ImplementationDocument> {
    const [document] = await db.insert(implementationDocuments)
      .values({
        ...data,
        uploadedAt: new Date()
      })
      .returning();
      
    await this.logActivity({
      projectId: data.projectId!,
      phaseId: data.phaseId || undefined,
      activityType: 'document_uploaded',
      title: 'Document Uploaded',
      description: `Document "${data.documentName}" has been uploaded`,
      relatedDocumentId: document.id,
      activityDate: new Date(),
      performedBy: data.uploadedBy || undefined
    });
    
    return document;
  }
  
  async getDocuments(projectId: number, filters?: {
    phaseId?: number;
    documentType?: string;
    category?: string;
  }): Promise<ImplementationDocument[]> {
    const conditions = [eq(implementationDocuments.projectId, projectId)];
    
    if (filters?.phaseId) {
      conditions.push(eq(implementationDocuments.phaseId, filters.phaseId));
    }
    if (filters?.documentType) {
      conditions.push(eq(implementationDocuments.documentType, filters.documentType));
    }
    if (filters?.category) {
      conditions.push(eq(implementationDocuments.category, filters.category));
    }
    
    return db.select()
      .from(implementationDocuments)
      .where(and(...conditions))
      .orderBy(desc(implementationDocuments.uploadedAt));
  }
  
  // ===== SIGNOFF MANAGEMENT =====
  
  async createSignoff(data: InsertImplementationSignoff): Promise<ImplementationSignoff> {
    const [signoff] = await db.insert(implementationSignoffs)
      .values(data)
      .returning();
      
    await this.logActivity({
      projectId: data.projectId,
      phaseId: data.phaseId || undefined,
      activityType: 'signoff_created',
      title: 'Signoff Request Created',
      description: `Signoff request "${data.title}" has been created`,
      relatedSignoffId: signoff.id,
      activityDate: new Date(),
      performedBy: data.createdBy || undefined
    });
    
    return signoff;
  }
  
  async addSignature(signoffId: number, signature: {
    userId: number;
    name: string;
    role: string;
    comments: string;
    signature: string;
  }): Promise<ImplementationSignoff | null> {
    const [signoff] = await db.select()
      .from(implementationSignoffs)
      .where(eq(implementationSignoffs.id, signoffId));
      
    if (!signoff) return null;
    
    const updatedSignoffs = [
      ...(signoff.signoffs || []),
      { ...signature, signedAt: new Date().toISOString() }
    ];
    
    // Check if all required signoffs are complete
    const requiredCount = signoff.requiredSignoffs?.filter(r => r.required).length || 0;
    const signedCount = updatedSignoffs.length;
    const isComplete = signedCount >= requiredCount;
    
    const [updated] = await db.update(implementationSignoffs)
      .set({
        signoffs: updatedSignoffs,
        status: isComplete ? 'completed' : 'partial',
        isComplete,
        completedAt: isComplete ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(implementationSignoffs.id, signoffId))
      .returning();
      
    if (updated) {
      await this.logActivity({
        projectId: updated.projectId,
        phaseId: updated.phaseId || undefined,
        activityType: 'signoff_received',
        title: 'Signoff Received',
        description: `${signature.name} (${signature.role}) has signed off`,
        relatedSignoffId: signoffId,
        activityDate: new Date(),
        performedBy: signature.userId
      });
      
      if (isComplete && updated.phaseId) {
        await this.updatePhase(updated.phaseId, { status: 'completed' });
      }
    }
    
    return updated || null;
  }
  
  // ===== TASK MANAGEMENT =====
  
  async createTask(data: InsertImplementationTask): Promise<ImplementationTask> {
    const [task] = await db.insert(implementationTasks)
      .values(data)
      .returning();
      
    await this.logActivity({
      projectId: data.projectId,
      phaseId: data.phaseId || undefined,
      activityType: 'task_created',
      title: 'Task Created',
      description: `Task "${data.taskName}" has been created`,
      relatedTaskId: task.id,
      activityDate: new Date(),
      performedBy: data.assignedBy || undefined
    });
    
    return task;
  }
  
  async updateTask(taskId: number, data: Partial<InsertImplementationTask>): Promise<ImplementationTask | null> {
    const [updated] = await db.update(implementationTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(implementationTasks.id, taskId))
      .returning();
      
    if (updated && data.status === 'completed') {
      await this.logActivity({
        projectId: updated.projectId,
        phaseId: updated.phaseId || undefined,
        activityType: 'task_completed',
        title: 'Task Completed',
        description: `Task "${updated.taskName}" has been completed`,
        relatedTaskId: taskId,
        activityDate: new Date(),
        performedBy: updated.assignedTo || undefined
      });
    }
    
    return updated || null;
  }
  
  async getTasks(projectId: number, filters?: {
    phaseId?: number;
    assignedTo?: number;
    status?: string;
    taskType?: string;
  }): Promise<ImplementationTask[]> {
    const conditions = [eq(implementationTasks.projectId, projectId)];
    
    if (filters?.phaseId) {
      conditions.push(eq(implementationTasks.phaseId, filters.phaseId));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(implementationTasks.assignedTo, filters.assignedTo));
    }
    if (filters?.status) {
      conditions.push(eq(implementationTasks.status, filters.status));
    }
    if (filters?.taskType) {
      conditions.push(eq(implementationTasks.taskType, filters.taskType));
    }
    
    return db.select()
      .from(implementationTasks)
      .where(and(...conditions))
      .orderBy(implementationTasks.priority, implementationTasks.dueDate);
  }
  
  // ===== ACTIVITY LOGGING =====
  
  async logActivity(data: InsertImplementationActivity): Promise<ImplementationActivity> {
    const [activity] = await db.insert(implementationActivities)
      .values(data)
      .returning();
    return activity;
  }
  
  async getActivities(projectId: number, limit: number = 50): Promise<ImplementationActivity[]> {
    return db.select()
      .from(implementationActivities)
      .where(eq(implementationActivities.projectId, projectId))
      .orderBy(desc(implementationActivities.activityDate))
      .limit(limit);
  }
  
  // ===== COMMENTS/COLLABORATION =====
  
  async addComment(data: InsertImplementationComment): Promise<ImplementationComment> {
    const [comment] = await db.insert(implementationComments)
      .values(data)
      .returning();
    return comment;
  }
  
  async getComments(projectId: number, entityType?: string, entityId?: number): Promise<ImplementationComment[]> {
    const conditions = [eq(implementationComments.projectId, projectId)];
    
    if (entityType) {
      conditions.push(eq(implementationComments.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(implementationComments.entityId, entityId));
    }
    
    return db.select()
      .from(implementationComments)
      .where(and(...conditions))
      .orderBy(desc(implementationComments.createdAt));
  }
  
  // ===== AI-POWERED STATUS REPORTS =====
  
  async generateStatusReport(projectId: number, reportType: string = 'weekly'): Promise<ImplementationStatusReport> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    
    const phases = await this.getPhases(projectId);
    const tasks = await this.getTasks(projectId);
    const activities = await this.getActivities(projectId, 100);
    const documents = await this.getDocuments(projectId);
    
    // Prepare context for AI
    const context = {
      project,
      phases,
      tasks,
      recentActivities: activities.slice(0, 20),
      documentCount: documents.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalTasks: tasks.length,
      blockedTasks: tasks.filter(t => t.status === 'blocked'),
      upcomingTasks: tasks.filter(t => t.status === 'pending' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5)
    };
    
    // Generate report using OpenAI
    const aiReport = await this.generateAIReport(context, reportType);
    
    // Save report to database
    const [report] = await db.insert(implementationStatusReports)
      .values({
        projectId,
        reportType,
        reportDate: new Date(),
        period: this.getReportPeriod(reportType),
        ...aiReport,
        aiModel: 'gpt-4o',
        generationTime: Date.now()
      })
      .returning();
    
    return report;
  }
  
  private async generateAIReport(context: any, reportType: string) {
    const prompt = `
      Generate a comprehensive ${reportType} status report for an implementation project with the following context:
      
      Project: ${context.project.projectName} (${context.project.projectCode})
      Client: ${context.project.clientCompany}
      Status: ${context.project.status}
      Overall Progress: ${context.project.completionPercentage}%
      
      Phases:
      ${context.phases.map((p: any) => `- ${p.phaseName}: ${p.status} (${p.completionPercentage}%)`).join('\n')}
      
      Tasks: ${context.completedTasks}/${context.totalTasks} completed
      Blocked Tasks: ${context.blockedTasks.length}
      
      Recent Activities (last 20):
      ${context.recentActivities.slice(0, 10).map((a: any) => `- ${a.title}: ${a.description}`).join('\n')}
      
      Please provide a JSON response with:
      1. executiveSummary: Brief overview for executives (2-3 sentences)
      2. progressSummary: Detailed progress update (paragraph)
      3. keyAccomplishments: Array of 3-5 key achievements
      4. upcomingMilestones: Array of 3-5 upcoming milestones
      5. overallProgress: Number (percentage)
      6. scheduleVariance: Number (percentage, positive if ahead, negative if behind)
      7. activeIssues: Array of issues with {title, severity, owner, dueDate}
      8. risks: Array of risks with {title, probability, impact, mitigation}
      9. aiRecommendations: Array of 3-5 recommendations with {category, recommendation, priority, expectedImpact}
      10. aiConfidence: Number between 0-100 indicating confidence in the analysis
    `;
    
    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert project manager specializing in ERP implementations. Provide realistic, actionable insights based on the project data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        executiveSummary: result.executiveSummary || '',
        progressSummary: result.progressSummary || '',
        keyAccomplishments: result.keyAccomplishments || [],
        upcomingMilestones: result.upcomingMilestones || [],
        overallProgress: String(result.overallProgress || context.project.completionPercentage),
        scheduleVariance: String(result.scheduleVariance || 0),
        budgetVariance: "0", // Would need budget tracking for this
        activeIssues: result.activeIssues || [],
        risks: result.risks || [],
        aiRecommendations: result.aiRecommendations || [],
        aiConfidence: String(result.aiConfidence || 85)
      };
    } catch (error) {
      console.error('Error generating AI report:', error);
      // Return a basic report if AI fails
      return {
        executiveSummary: `Project ${context.project.projectName} is ${context.project.completionPercentage}% complete.`,
        progressSummary: `The project has ${context.completedTasks} of ${context.totalTasks} tasks completed.`,
        keyAccomplishments: [],
        upcomingMilestones: [],
        overallProgress: context.project.completionPercentage,
        scheduleVariance: "0",
        budgetVariance: "0",
        activeIssues: [],
        risks: [],
        aiRecommendations: [],
        aiConfidence: "0"
      };
    }
  }
  
  private getReportPeriod(reportType: string): string {
    const now = new Date();
    switch (reportType) {
      case 'daily':
        return now.toLocaleDateString();
      case 'weekly':
        const weekNumber = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
        return `Week ${weekNumber}, ${now.getFullYear()}`;
      case 'monthly':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return now.toLocaleDateString();
    }
  }
  
  async getStatusReports(projectId: number): Promise<ImplementationStatusReport[]> {
    return db.select()
      .from(implementationStatusReports)
      .where(eq(implementationStatusReports.projectId, projectId))
      .orderBy(desc(implementationStatusReports.reportDate));
  }
  
  // ===== PROJECT DASHBOARD DATA =====
  
  async getProjectDashboard(projectId: number) {
    const project = await this.getProject(projectId);
    const phases = await this.getPhases(projectId);
    const tasks = await this.getTasks(projectId);
    const documents = await this.getDocuments(projectId);
    const activities = await this.getActivities(projectId, 10);
    const signoffs = await db.select()
      .from(implementationSignoffs)
      .where(eq(implementationSignoffs.projectId, projectId));
    
    const metrics = {
      completedPhases: phases.filter(p => p.status === 'completed').length,
      totalPhases: phases.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalTasks: tasks.length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
      documentsUploaded: documents.length,
      pendingSignoffs: signoffs.filter(s => s.status === 'pending').length,
      completedSignoffs: signoffs.filter(s => s.status === 'completed').length
    };
    
    return {
      project,
      phases,
      metrics,
      recentActivities: activities,
      upcomingTasks: tasks
        .filter(t => t.status === 'pending' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5)
    };
  }
}

export const implementationService = new ImplementationService();