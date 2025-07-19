import { 
  capabilities, resources, jobs, operations, dependencies, resourceViews, customTextLabels, kanbanConfigs, reportConfigs, dashboardConfigs,
  scheduleScenarios, scenarioOperations, scenarioEvaluations, scenarioDiscussions,
  systemUsers, systemHealth, systemEnvironments, systemUpgrades, systemAuditLog, systemSettings,
  type Capability, type Resource, type Job, type Operation, type Dependency, type ResourceView, type CustomTextLabel, type KanbanConfig, type ReportConfig, type DashboardConfig,
  type ScheduleScenario, type ScenarioOperation, type ScenarioEvaluation, type ScenarioDiscussion,
  type SystemUser, type SystemHealth, type SystemEnvironment, type SystemUpgrade, type SystemAuditLog, type SystemSettings,
  type InsertCapability, type InsertResource, type InsertJob, 
  type InsertOperation, type InsertDependency, type InsertResourceView, type InsertCustomTextLabel, type InsertKanbanConfig, type InsertReportConfig, type InsertDashboardConfig,
  type InsertScheduleScenario, type InsertScenarioOperation, type InsertScenarioEvaluation, type InsertScenarioDiscussion,
  type InsertSystemUser, type InsertSystemHealth, type InsertSystemEnvironment, type InsertSystemUpgrade, type InsertSystemAuditLog, type InsertSystemSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Capabilities
  getCapabilities(): Promise<Capability[]>;
  createCapability(capability: InsertCapability): Promise<Capability>;
  
  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Operations
  getOperations(): Promise<Operation[]>;
  getOperationsByJobId(jobId: number): Promise<Operation[]>;
  getOperation(id: number): Promise<Operation | undefined>;
  createOperation(operation: InsertOperation): Promise<Operation>;
  updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined>;
  deleteOperation(id: number): Promise<boolean>;
  
  // Dependencies
  getDependencies(): Promise<Dependency[]>;
  getDependenciesByOperationId(operationId: number): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  deleteDependency(id: number): Promise<boolean>;
  
  // Resource Views
  getResourceViews(): Promise<ResourceView[]>;
  getResourceView(id: number): Promise<ResourceView | undefined>;
  createResourceView(resourceView: InsertResourceView): Promise<ResourceView>;
  updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined>;
  deleteResourceView(id: number): Promise<boolean>;
  getDefaultResourceView(): Promise<ResourceView | undefined>;
  setDefaultResourceView(id: number): Promise<void>;
  
  // Custom Text Labels
  getCustomTextLabels(): Promise<CustomTextLabel[]>;
  getCustomTextLabel(id: number): Promise<CustomTextLabel | undefined>;
  createCustomTextLabel(customTextLabel: InsertCustomTextLabel): Promise<CustomTextLabel>;
  updateCustomTextLabel(id: number, customTextLabel: Partial<InsertCustomTextLabel>): Promise<CustomTextLabel | undefined>;
  deleteCustomTextLabel(id: number): Promise<boolean>;
  
  // Kanban Configurations
  getKanbanConfigs(): Promise<KanbanConfig[]>;
  getKanbanConfig(id: number): Promise<KanbanConfig | undefined>;
  createKanbanConfig(kanbanConfig: InsertKanbanConfig): Promise<KanbanConfig>;
  updateKanbanConfig(id: number, kanbanConfig: Partial<InsertKanbanConfig>): Promise<KanbanConfig | undefined>;
  deleteKanbanConfig(id: number): Promise<boolean>;
  getDefaultKanbanConfig(): Promise<KanbanConfig | undefined>;
  setDefaultKanbanConfig(id: number): Promise<void>;
  
  // Report Configurations
  getReportConfigs(): Promise<ReportConfig[]>;
  getReportConfig(id: number): Promise<ReportConfig | undefined>;
  createReportConfig(reportConfig: InsertReportConfig): Promise<ReportConfig>;
  updateReportConfig(id: number, reportConfig: Partial<InsertReportConfig>): Promise<ReportConfig | undefined>;
  deleteReportConfig(id: number): Promise<boolean>;
  getDefaultReportConfig(): Promise<ReportConfig | undefined>;
  setDefaultReportConfig(id: number): Promise<void>;
  
  // Dashboard Configurations
  getDashboardConfigs(): Promise<DashboardConfig[]>;
  getDashboardConfig(id: number): Promise<DashboardConfig | undefined>;
  createDashboardConfig(dashboardConfig: InsertDashboardConfig): Promise<DashboardConfig>;
  updateDashboardConfig(id: number, dashboardConfig: Partial<InsertDashboardConfig>): Promise<DashboardConfig | undefined>;
  deleteDashboardConfig(id: number): Promise<boolean>;
  getDefaultDashboardConfig(): Promise<DashboardConfig | undefined>;
  setDefaultDashboardConfig(id: number): Promise<void>;

  // Schedule Scenarios
  getScheduleScenarios(): Promise<ScheduleScenario[]>;
  getScheduleScenario(id: number): Promise<ScheduleScenario | undefined>;
  createScheduleScenario(scenario: InsertScheduleScenario): Promise<ScheduleScenario>;
  updateScheduleScenario(id: number, scenario: Partial<InsertScheduleScenario>): Promise<ScheduleScenario | undefined>;
  deleteScheduleScenario(id: number): Promise<boolean>;

  // Scenario Operations
  getScenarioOperations(scenarioId: number): Promise<ScenarioOperation[]>;
  createScenarioOperation(operation: InsertScenarioOperation): Promise<ScenarioOperation>;
  updateScenarioOperation(id: number, operation: Partial<InsertScenarioOperation>): Promise<ScenarioOperation | undefined>;
  deleteScenarioOperation(id: number): Promise<boolean>;
  deleteScenarioOperationsByScenario(scenarioId: number): Promise<boolean>;

  // Scenario Evaluations
  getScenarioEvaluations(scenarioId: number): Promise<ScenarioEvaluation[]>;
  createScenarioEvaluation(evaluation: InsertScenarioEvaluation): Promise<ScenarioEvaluation>;
  updateScenarioEvaluation(id: number, evaluation: Partial<InsertScenarioEvaluation>): Promise<ScenarioEvaluation | undefined>;
  deleteScenarioEvaluation(id: number): Promise<boolean>;

  // Scenario Discussions
  getScenarioDiscussions(scenarioId: number): Promise<ScenarioDiscussion[]>;
  createScenarioDiscussion(discussion: InsertScenarioDiscussion): Promise<ScenarioDiscussion>;
  updateScenarioDiscussion(id: number, discussion: Partial<InsertScenarioDiscussion>): Promise<ScenarioDiscussion | undefined>;
  deleteScenarioDiscussion(id: number): Promise<boolean>;

  // System Users
  getSystemUsers(): Promise<SystemUser[]>;
  getSystemUser(id: number): Promise<SystemUser | undefined>;
  getSystemUserByUsername(username: string): Promise<SystemUser | undefined>;
  createSystemUser(user: InsertSystemUser): Promise<SystemUser>;
  updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser | undefined>;
  deleteSystemUser(id: number): Promise<boolean>;

  // System Health
  getSystemHealth(environment?: string): Promise<SystemHealth[]>;
  getSystemHealthByMetric(metricName: string, environment?: string): Promise<SystemHealth[]>;
  createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth>;
  deleteSystemHealth(id: number): Promise<boolean>;

  // System Environments
  getSystemEnvironments(): Promise<SystemEnvironment[]>;
  getSystemEnvironment(id: number): Promise<SystemEnvironment | undefined>;
  getSystemEnvironmentByName(name: string): Promise<SystemEnvironment | undefined>;
  createSystemEnvironment(environment: InsertSystemEnvironment): Promise<SystemEnvironment>;
  updateSystemEnvironment(id: number, environment: Partial<InsertSystemEnvironment>): Promise<SystemEnvironment | undefined>;
  deleteSystemEnvironment(id: number): Promise<boolean>;

  // System Upgrades
  getSystemUpgrades(environment?: string): Promise<SystemUpgrade[]>;
  getSystemUpgrade(id: number): Promise<SystemUpgrade | undefined>;
  createSystemUpgrade(upgrade: InsertSystemUpgrade): Promise<SystemUpgrade>;
  updateSystemUpgrade(id: number, upgrade: Partial<InsertSystemUpgrade>): Promise<SystemUpgrade | undefined>;
  deleteSystemUpgrade(id: number): Promise<boolean>;

  // System Audit Log
  getSystemAuditLog(userId?: number, resource?: string): Promise<SystemAuditLog[]>;
  createSystemAuditLog(auditLog: InsertSystemAuditLog): Promise<SystemAuditLog>;
  deleteSystemAuditLog(id: number): Promise<boolean>;

  // System Settings
  getSystemSettings(environment?: string, category?: string): Promise<SystemSettings[]>;
  getSystemSetting(key: string, environment: string): Promise<SystemSettings | undefined>;
  createSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings>;
  updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined>;
  deleteSystemSetting(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private capabilities: Map<number, Capability> = new Map();
  private resources: Map<number, Resource> = new Map();
  private jobs: Map<number, Job> = new Map();
  private operations: Map<number, Operation> = new Map();
  private dependencies: Map<number, Dependency> = new Map();
  private resourceViews: Map<number, ResourceView> = new Map();
  
  private currentCapabilityId = 1;
  private currentResourceId = 1;
  private currentJobId = 1;
  private currentOperationId = 1;
  private currentDependencyId = 1;
  private currentResourceViewId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default capabilities
    const defaultCapabilities = [
      { name: "CNC Machine", description: "Computer Numerical Control machining" },
      { name: "Welding", description: "Metal welding operations" },
      { name: "Assembly", description: "Component assembly operations" },
      { name: "Quality Control", description: "Inspection and testing" },
      { name: "Painting", description: "Surface finishing operations" },
    ];

    defaultCapabilities.forEach(cap => {
      const capability: Capability = { 
        id: this.currentCapabilityId++, 
        name: cap.name,
        description: cap.description || null
      };
      this.capabilities.set(capability.id, capability);
    });

    // Default resources
    const defaultResources = [
      { name: "CNC-001", type: "Machine", status: "active", capabilities: [1] },
      { name: "CNC-002", type: "Machine", status: "active", capabilities: [1] },
      { name: "WLD-001", type: "Welding Station", status: "active", capabilities: [2] },
      { name: "ASM-001", type: "Assembly Station", status: "active", capabilities: [3] },
      { name: "QC-001", type: "Quality Station", status: "active", capabilities: [4] },
    ];

    defaultResources.forEach(res => {
      const resource: Resource = { 
        id: this.currentResourceId++, 
        name: res.name,
        type: res.type,
        status: res.status || "active",
        capabilities: res.capabilities as number[]
      };
      this.resources.set(resource.id, resource);
    });

    // Add some sample jobs and operations
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample jobs
    const sampleJobs = [
      {
        name: "Widget Assembly - Batch A",
        customer: "Tech Corp",
        description: "Assembly of 500 widgets for Q1 delivery",
        priority: "high",
        status: "active",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        name: "Motor Housing Production",
        customer: "AutoParts Inc",
        description: "CNC machining of 100 motor housings",
        priority: "medium",
        status: "planned",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    ];

    sampleJobs.forEach(jobData => {
      const job: Job = {
        id: this.currentJobId++,
        name: jobData.name,
        customer: jobData.customer,
        description: jobData.description,
        priority: jobData.priority,
        status: jobData.status,
        dueDate: jobData.dueDate,
        createdAt: new Date(),
      };
      this.jobs.set(job.id, job);
    });

    // Sample operations for the first job
    const sampleOperations = [
      {
        jobId: 1,
        name: "CNC Machining",
        description: "Machine widget base components",
        status: "in-progress",
        duration: 16,
        requiredCapabilities: [1], // CNC Machine
        assignedResourceId: 1,
        order: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Welding",
        description: "Weld frame components",
        status: "planned",
        duration: 8,
        requiredCapabilities: [2], // Welding
        assignedResourceId: 3,
        order: 2,
        startTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Final Assembly",
        description: "Assemble all components",
        status: "planned",
        duration: 12,
        requiredCapabilities: [3], // Assembly
        assignedResourceId: 4,
        order: 3,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Quality Check",
        description: "Final inspection and testing",
        status: "planned",
        duration: 4,
        requiredCapabilities: [4], // Quality Control
        assignedResourceId: 5,
        order: 4,
        startTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 40 * 60 * 60 * 1000),
      },
    ];

    sampleOperations.forEach(opData => {
      const operation: Operation = {
        id: this.currentOperationId++,
        jobId: opData.jobId,
        name: opData.name,
        description: opData.description,
        status: opData.status,
        duration: opData.duration,
        requiredCapabilities: opData.requiredCapabilities,
        assignedResourceId: opData.assignedResourceId,
        startTime: opData.startTime,
        endTime: opData.endTime,
        order: opData.order,
      };
      this.operations.set(operation.id, operation);
    });
  }

  // Capabilities
  async getCapabilities(): Promise<Capability[]> {
    return Array.from(this.capabilities.values());
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const newCapability: Capability = { 
      id: this.currentCapabilityId++, 
      name: capability.name,
      description: capability.description || null
    };
    this.capabilities.set(newCapability.id, newCapability);
    return newCapability;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const newResource: Resource = { 
      id: this.currentResourceId++, 
      name: resource.name,
      type: resource.type,
      status: resource.status || "active",
      capabilities: (resource.capabilities as number[]) || null
    };
    this.resources.set(newResource.id, newResource);
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existing = this.resources.get(id);
    if (!existing) return undefined;
    
    const updated: Resource = { ...existing, ...resource };
    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = { 
      id: this.currentJobId++, 
      name: job.name,
      description: job.description || null,
      customer: job.customer,
      priority: job.priority || "medium",
      status: job.status || "planned",
      dueDate: job.dueDate || null,
      createdAt: new Date()
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    
    const updated: Job = { ...existing, ...job };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: number): Promise<boolean> {
    // Also delete associated operations
    const operationsToDelete = Array.from(this.operations.values())
      .filter(op => op.jobId === id);
    
    operationsToDelete.forEach(op => {
      this.operations.delete(op.id);
    });
    
    return this.jobs.delete(id);
  }

  // Operations
  async getOperations(): Promise<Operation[]> {
    return Array.from(this.operations.values());
  }

  async getOperationsByJobId(jobId: number): Promise<Operation[]> {
    return Array.from(this.operations.values())
      .filter(op => op.jobId === jobId)
      .sort((a, b) => a.order - b.order);
  }

  async getOperation(id: number): Promise<Operation | undefined> {
    return this.operations.get(id);
  }

  async createOperation(operation: InsertOperation): Promise<Operation> {
    const newOperation: Operation = { 
      id: this.currentOperationId++, 
      jobId: operation.jobId,
      name: operation.name,
      description: operation.description || null,
      status: operation.status || "planned",
      duration: operation.duration,
      requiredCapabilities: (operation.requiredCapabilities as number[]) || null,
      assignedResourceId: operation.assignedResourceId || null,
      startTime: operation.startTime || null,
      endTime: operation.endTime || null,
      order: operation.order || 0
    };
    this.operations.set(newOperation.id, newOperation);
    return newOperation;
  }

  async updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined> {
    const existing = this.operations.get(id);
    if (!existing) return undefined;
    
    const updated: Operation = { ...existing, ...operation };
    this.operations.set(id, updated);
    return updated;
  }

  async deleteOperation(id: number): Promise<boolean> {
    // Also delete associated dependencies
    const dependenciesToDelete = Array.from(this.dependencies.values())
      .filter(dep => dep.fromOperationId === id || dep.toOperationId === id);
    
    dependenciesToDelete.forEach(dep => {
      this.dependencies.delete(dep.id);
    });
    
    return this.operations.delete(id);
  }

  // Dependencies
  async getDependencies(): Promise<Dependency[]> {
    return Array.from(this.dependencies.values());
  }

  async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
    return Array.from(this.dependencies.values())
      .filter(dep => dep.fromOperationId === operationId || dep.toOperationId === operationId);
  }

  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const newDependency: Dependency = { id: this.currentDependencyId++, ...dependency };
    this.dependencies.set(newDependency.id, newDependency);
    return newDependency;
  }

  async deleteDependency(id: number): Promise<boolean> {
    return this.dependencies.delete(id);
  }

  async getResourceViews(): Promise<ResourceView[]> {
    return Array.from(this.resourceViews.values());
  }

  async getResourceView(id: number): Promise<ResourceView | undefined> {
    return this.resourceViews.get(id);
  }

  async createResourceView(resourceView: InsertResourceView): Promise<ResourceView> {
    const newResourceView: ResourceView = { 
      id: this.currentResourceViewId++, 
      ...resourceView,
      createdAt: new Date()
    };
    this.resourceViews.set(newResourceView.id, newResourceView);
    return newResourceView;
  }

  async updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined> {
    const existing = this.resourceViews.get(id);
    if (!existing) return undefined;
    
    const updated: ResourceView = { ...existing, ...resourceView };
    this.resourceViews.set(id, updated);
    return updated;
  }

  async deleteResourceView(id: number): Promise<boolean> {
    return this.resourceViews.delete(id);
  }

  async getDefaultResourceView(): Promise<ResourceView | undefined> {
    return Array.from(this.resourceViews.values()).find(view => view.isDefault);
  }

  async setDefaultResourceView(id: number): Promise<void> {
    // First, set all existing views to non-default
    Array.from(this.resourceViews.values()).forEach(view => {
      view.isDefault = false;
      this.resourceViews.set(view.id, view);
    });
    
    // Then set the specified view as default
    const view = this.resourceViews.get(id);
    if (view) {
      view.isDefault = true;
      this.resourceViews.set(id, view);
    }
  }
}

export class DatabaseStorage implements IStorage {
  async getCapabilities(): Promise<Capability[]> {
    return await db.select().from(capabilities);
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const [newCapability] = await db
      .insert(capabilities)
      .values(capability)
      .returning();
    return newCapability;
  }

  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    // First delete associated operations
    await db.delete(operations).where(eq(operations.jobId, id));
    
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getOperations(): Promise<Operation[]> {
    return await db.select().from(operations);
  }

  async getOperationsByJobId(jobId: number): Promise<Operation[]> {
    return await db.select().from(operations).where(eq(operations.jobId, jobId));
  }

  async getOperation(id: number): Promise<Operation | undefined> {
    const [operation] = await db.select().from(operations).where(eq(operations.id, id));
    return operation || undefined;
  }

  async createOperation(operation: InsertOperation): Promise<Operation> {
    const [newOperation] = await db
      .insert(operations)
      .values(operation)
      .returning();
    return newOperation;
  }

  async updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined> {
    const [updatedOperation] = await db
      .update(operations)
      .set(operation)
      .where(eq(operations.id, id))
      .returning();
    return updatedOperation || undefined;
  }

  async deleteOperation(id: number): Promise<boolean> {
    // First delete associated dependencies
    await db.delete(dependencies).where(eq(dependencies.fromOperationId, id));
    await db.delete(dependencies).where(eq(dependencies.toOperationId, id));
    
    const result = await db.delete(operations).where(eq(operations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDependencies(): Promise<Dependency[]> {
    return await db.select().from(dependencies);
  }

  async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
    return await db.select().from(dependencies).where(
      eq(dependencies.fromOperationId, operationId)
    );
  }

  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const [newDependency] = await db
      .insert(dependencies)
      .values(dependency)
      .returning();
    return newDependency;
  }

  async deleteDependency(id: number): Promise<boolean> {
    const result = await db.delete(dependencies).where(eq(dependencies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getResourceViews(): Promise<ResourceView[]> {
    return await db.select().from(resourceViews);
  }

  async getResourceView(id: number): Promise<ResourceView | undefined> {
    const [resourceView] = await db.select().from(resourceViews).where(eq(resourceViews.id, id));
    return resourceView || undefined;
  }

  async createResourceView(resourceView: InsertResourceView): Promise<ResourceView> {
    const [newResourceView] = await db
      .insert(resourceViews)
      .values(resourceView)
      .returning();
    return newResourceView;
  }

  async updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined> {
    const [updatedResourceView] = await db
      .update(resourceViews)
      .set(resourceView)
      .where(eq(resourceViews.id, id))
      .returning();
    return updatedResourceView || undefined;
  }

  async deleteResourceView(id: number): Promise<boolean> {
    const result = await db.delete(resourceViews).where(eq(resourceViews.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefaultResourceView(): Promise<ResourceView | undefined> {
    const [defaultView] = await db.select().from(resourceViews).where(eq(resourceViews.isDefault, true));
    return defaultView || undefined;
  }

  async setDefaultResourceView(id: number): Promise<void> {
    // First, set all existing views to non-default
    await db.update(resourceViews).set({ isDefault: false });
    
    // Then set the specified view as default
    await db.update(resourceViews).set({ isDefault: true }).where(eq(resourceViews.id, id));
  }

  // Custom Text Labels
  async getCustomTextLabels(): Promise<CustomTextLabel[]> {
    return await db.select().from(customTextLabels);
  }

  async getCustomTextLabel(id: number): Promise<CustomTextLabel | undefined> {
    const [customTextLabel] = await db.select().from(customTextLabels).where(eq(customTextLabels.id, id));
    return customTextLabel || undefined;
  }

  async createCustomTextLabel(customTextLabel: InsertCustomTextLabel): Promise<CustomTextLabel> {
    const [newCustomTextLabel] = await db
      .insert(customTextLabels)
      .values(customTextLabel)
      .returning();
    return newCustomTextLabel;
  }

  async updateCustomTextLabel(id: number, customTextLabel: Partial<InsertCustomTextLabel>): Promise<CustomTextLabel | undefined> {
    const [updatedCustomTextLabel] = await db
      .update(customTextLabels)
      .set(customTextLabel)
      .where(eq(customTextLabels.id, id))
      .returning();
    return updatedCustomTextLabel || undefined;
  }

  async deleteCustomTextLabel(id: number): Promise<boolean> {
    const result = await db.delete(customTextLabels).where(eq(customTextLabels.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Kanban Configurations
  async getKanbanConfigs(): Promise<KanbanConfig[]> {
    return await db.select().from(kanbanConfigs);
  }

  async getKanbanConfig(id: number): Promise<KanbanConfig | undefined> {
    const [kanbanConfig] = await db.select().from(kanbanConfigs).where(eq(kanbanConfigs.id, id));
    return kanbanConfig || undefined;
  }

  async createKanbanConfig(kanbanConfig: InsertKanbanConfig): Promise<KanbanConfig> {
    const [newKanbanConfig] = await db
      .insert(kanbanConfigs)
      .values(kanbanConfig)
      .returning();
    return newKanbanConfig;
  }

  async updateKanbanConfig(id: number, kanbanConfig: Partial<InsertKanbanConfig>): Promise<KanbanConfig | undefined> {
    const [updatedKanbanConfig] = await db
      .update(kanbanConfigs)
      .set(kanbanConfig)
      .where(eq(kanbanConfigs.id, id))
      .returning();
    return updatedKanbanConfig || undefined;
  }

  async deleteKanbanConfig(id: number): Promise<boolean> {
    const result = await db.delete(kanbanConfigs).where(eq(kanbanConfigs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefaultKanbanConfig(): Promise<KanbanConfig | undefined> {
    const [defaultConfig] = await db.select().from(kanbanConfigs).where(eq(kanbanConfigs.isDefault, true));
    return defaultConfig || undefined;
  }

  async setDefaultKanbanConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(kanbanConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(kanbanConfigs).set({ isDefault: true }).where(eq(kanbanConfigs.id, id));
  }

  async getReportConfigs(): Promise<ReportConfig[]> {
    return await db.select().from(reportConfigs);
  }

  async getReportConfig(id: number): Promise<ReportConfig | undefined> {
    const [config] = await db.select().from(reportConfigs).where(eq(reportConfigs.id, id));
    return config || undefined;
  }

  async createReportConfig(reportConfig: InsertReportConfig): Promise<ReportConfig> {
    const [config] = await db
      .insert(reportConfigs)
      .values(reportConfig)
      .returning();
    return config;
  }

  async updateReportConfig(id: number, reportConfig: Partial<InsertReportConfig>): Promise<ReportConfig | undefined> {
    const [config] = await db
      .update(reportConfigs)
      .set(reportConfig)
      .where(eq(reportConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteReportConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(reportConfigs)
      .where(eq(reportConfigs.id, id));
    return result.rowCount > 0;
  }

  async getDefaultReportConfig(): Promise<ReportConfig | undefined> {
    const [config] = await db.select().from(reportConfigs).where(eq(reportConfigs.isDefault, true));
    return config || undefined;
  }

  async setDefaultReportConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(reportConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(reportConfigs).set({ isDefault: true }).where(eq(reportConfigs.id, id));
  }

  async getDashboardConfigs(): Promise<DashboardConfig[]> {
    return await db.select().from(dashboardConfigs);
  }

  async getDashboardConfig(id: number): Promise<DashboardConfig | undefined> {
    const [config] = await db.select().from(dashboardConfigs).where(eq(dashboardConfigs.id, id));
    return config || undefined;
  }

  async createDashboardConfig(dashboardConfig: InsertDashboardConfig): Promise<DashboardConfig> {
    const [config] = await db
      .insert(dashboardConfigs)
      .values(dashboardConfig)
      .returning();
    return config;
  }

  async updateDashboardConfig(id: number, dashboardConfig: Partial<InsertDashboardConfig>): Promise<DashboardConfig | undefined> {
    const [config] = await db
      .update(dashboardConfigs)
      .set(dashboardConfig)
      .where(eq(dashboardConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteDashboardConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(dashboardConfigs)
      .where(eq(dashboardConfigs.id, id));
    return result.rowCount > 0;
  }

  async getDefaultDashboardConfig(): Promise<DashboardConfig | undefined> {
    const [config] = await db.select().from(dashboardConfigs).where(eq(dashboardConfigs.isDefault, true));
    return config || undefined;
  }

  async setDefaultDashboardConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(dashboardConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(dashboardConfigs).set({ isDefault: true }).where(eq(dashboardConfigs.id, id));
  }

  // Schedule Scenarios
  async getScheduleScenarios(): Promise<ScheduleScenario[]> {
    return await db.select().from(scheduleScenarios);
  }

  async getScheduleScenario(id: number): Promise<ScheduleScenario | undefined> {
    const [scenario] = await db.select().from(scheduleScenarios).where(eq(scheduleScenarios.id, id));
    return scenario || undefined;
  }

  async createScheduleScenario(scenario: InsertScheduleScenario): Promise<ScheduleScenario> {
    const [newScenario] = await db
      .insert(scheduleScenarios)
      .values(scenario)
      .returning();
    return newScenario;
  }

  async updateScheduleScenario(id: number, scenario: Partial<InsertScheduleScenario>): Promise<ScheduleScenario | undefined> {
    const [updatedScenario] = await db
      .update(scheduleScenarios)
      .set(scenario)
      .where(eq(scheduleScenarios.id, id))
      .returning();
    return updatedScenario || undefined;
  }

  async deleteScheduleScenario(id: number): Promise<boolean> {
    // First delete associated scenario operations, evaluations, and discussions
    await db.delete(scenarioOperations).where(eq(scenarioOperations.scenarioId, id));
    await db.delete(scenarioEvaluations).where(eq(scenarioEvaluations.scenarioId, id));
    await db.delete(scenarioDiscussions).where(eq(scenarioDiscussions.scenarioId, id));
    
    const result = await db.delete(scheduleScenarios).where(eq(scheduleScenarios.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Operations
  async getScenarioOperations(scenarioId: number): Promise<ScenarioOperation[]> {
    return await db.select().from(scenarioOperations).where(eq(scenarioOperations.scenarioId, scenarioId));
  }

  async createScenarioOperation(operation: InsertScenarioOperation): Promise<ScenarioOperation> {
    const [newOperation] = await db
      .insert(scenarioOperations)
      .values(operation)
      .returning();
    return newOperation;
  }

  async updateScenarioOperation(id: number, operation: Partial<InsertScenarioOperation>): Promise<ScenarioOperation | undefined> {
    const [updatedOperation] = await db
      .update(scenarioOperations)
      .set(operation)
      .where(eq(scenarioOperations.id, id))
      .returning();
    return updatedOperation || undefined;
  }

  async deleteScenarioOperation(id: number): Promise<boolean> {
    const result = await db.delete(scenarioOperations).where(eq(scenarioOperations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScenarioOperationsByScenario(scenarioId: number): Promise<boolean> {
    const result = await db.delete(scenarioOperations).where(eq(scenarioOperations.scenarioId, scenarioId));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Evaluations
  async getScenarioEvaluations(scenarioId: number): Promise<ScenarioEvaluation[]> {
    return await db.select().from(scenarioEvaluations).where(eq(scenarioEvaluations.scenarioId, scenarioId));
  }

  async createScenarioEvaluation(evaluation: InsertScenarioEvaluation): Promise<ScenarioEvaluation> {
    const [newEvaluation] = await db
      .insert(scenarioEvaluations)
      .values(evaluation)
      .returning();
    return newEvaluation;
  }

  async updateScenarioEvaluation(id: number, evaluation: Partial<InsertScenarioEvaluation>): Promise<ScenarioEvaluation | undefined> {
    const [updatedEvaluation] = await db
      .update(scenarioEvaluations)
      .set(evaluation)
      .where(eq(scenarioEvaluations.id, id))
      .returning();
    return updatedEvaluation || undefined;
  }

  async deleteScenarioEvaluation(id: number): Promise<boolean> {
    const result = await db.delete(scenarioEvaluations).where(eq(scenarioEvaluations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Discussions
  async getScenarioDiscussions(scenarioId: number): Promise<ScenarioDiscussion[]> {
    return await db.select().from(scenarioDiscussions).where(eq(scenarioDiscussions.scenarioId, scenarioId));
  }

  async createScenarioDiscussion(discussion: InsertScenarioDiscussion): Promise<ScenarioDiscussion> {
    const [newDiscussion] = await db
      .insert(scenarioDiscussions)
      .values(discussion)
      .returning();
    return newDiscussion;
  }

  async updateScenarioDiscussion(id: number, discussion: Partial<InsertScenarioDiscussion>): Promise<ScenarioDiscussion | undefined> {
    const [updatedDiscussion] = await db
      .update(scenarioDiscussions)
      .set(discussion)
      .where(eq(scenarioDiscussions.id, id))
      .returning();
    return updatedDiscussion || undefined;
  }

  async deleteScenarioDiscussion(id: number): Promise<boolean> {
    const result = await db.delete(scenarioDiscussions).where(eq(scenarioDiscussions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Users
  async getSystemUsers(): Promise<SystemUser[]> {
    return await db.select().from(systemUsers);
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user || undefined;
  }

  async getSystemUserByUsername(username: string): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.username, username));
    return user || undefined;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await db
      .insert(systemUsers)
      .values(user)
      .returning();
    return newUser;
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser | undefined> {
    const [updatedUser] = await db
      .update(systemUsers)
      .set(user)
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteSystemUser(id: number): Promise<boolean> {
    const result = await db.delete(systemUsers).where(eq(systemUsers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Health
  async getSystemHealth(environment?: string): Promise<SystemHealth[]> {
    if (environment) {
      return await db.select().from(systemHealth).where(eq(systemHealth.environment, environment));
    }
    return await db.select().from(systemHealth);
  }

  async getSystemHealthByMetric(metricName: string, environment?: string): Promise<SystemHealth[]> {
    let query = db.select().from(systemHealth).where(eq(systemHealth.metricName, metricName));
    if (environment) {
      query = query.where(eq(systemHealth.environment, environment));
    }
    return await query;
  }

  async createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth> {
    const [newHealth] = await db
      .insert(systemHealth)
      .values(health)
      .returning();
    return newHealth;
  }

  async deleteSystemHealth(id: number): Promise<boolean> {
    const result = await db.delete(systemHealth).where(eq(systemHealth.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Environments
  async getSystemEnvironments(): Promise<SystemEnvironment[]> {
    return await db.select().from(systemEnvironments);
  }

  async getSystemEnvironment(id: number): Promise<SystemEnvironment | undefined> {
    const [environment] = await db.select().from(systemEnvironments).where(eq(systemEnvironments.id, id));
    return environment || undefined;
  }

  async getSystemEnvironmentByName(name: string): Promise<SystemEnvironment | undefined> {
    const [environment] = await db.select().from(systemEnvironments).where(eq(systemEnvironments.name, name));
    return environment || undefined;
  }

  async createSystemEnvironment(environment: InsertSystemEnvironment): Promise<SystemEnvironment> {
    const [newEnvironment] = await db
      .insert(systemEnvironments)
      .values(environment)
      .returning();
    return newEnvironment;
  }

  async updateSystemEnvironment(id: number, environment: Partial<InsertSystemEnvironment>): Promise<SystemEnvironment | undefined> {
    const [updatedEnvironment] = await db
      .update(systemEnvironments)
      .set(environment)
      .where(eq(systemEnvironments.id, id))
      .returning();
    return updatedEnvironment || undefined;
  }

  async deleteSystemEnvironment(id: number): Promise<boolean> {
    const result = await db.delete(systemEnvironments).where(eq(systemEnvironments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Upgrades
  async getSystemUpgrades(environment?: string): Promise<SystemUpgrade[]> {
    if (environment) {
      return await db.select().from(systemUpgrades).where(eq(systemUpgrades.environment, environment));
    }
    return await db.select().from(systemUpgrades);
  }

  async getSystemUpgrade(id: number): Promise<SystemUpgrade | undefined> {
    const [upgrade] = await db.select().from(systemUpgrades).where(eq(systemUpgrades.id, id));
    return upgrade || undefined;
  }

  async createSystemUpgrade(upgrade: InsertSystemUpgrade): Promise<SystemUpgrade> {
    const [newUpgrade] = await db
      .insert(systemUpgrades)
      .values(upgrade)
      .returning();
    return newUpgrade;
  }

  async updateSystemUpgrade(id: number, upgrade: Partial<InsertSystemUpgrade>): Promise<SystemUpgrade | undefined> {
    const [updatedUpgrade] = await db
      .update(systemUpgrades)
      .set(upgrade)
      .where(eq(systemUpgrades.id, id))
      .returning();
    return updatedUpgrade || undefined;
  }

  async deleteSystemUpgrade(id: number): Promise<boolean> {
    const result = await db.delete(systemUpgrades).where(eq(systemUpgrades.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Audit Log
  async getSystemAuditLog(userId?: number, resource?: string): Promise<SystemAuditLog[]> {
    let query = db.select().from(systemAuditLog);
    if (userId) {
      query = query.where(eq(systemAuditLog.userId, userId));
    }
    if (resource) {
      query = query.where(eq(systemAuditLog.resource, resource));
    }
    return await query;
  }

  async createSystemAuditLog(auditLog: InsertSystemAuditLog): Promise<SystemAuditLog> {
    const [newAuditLog] = await db
      .insert(systemAuditLog)
      .values(auditLog)
      .returning();
    return newAuditLog;
  }

  async deleteSystemAuditLog(id: number): Promise<boolean> {
    const result = await db.delete(systemAuditLog).where(eq(systemAuditLog.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Settings
  async getSystemSettings(environment?: string, category?: string): Promise<SystemSettings[]> {
    let query = db.select().from(systemSettings);
    if (environment) {
      query = query.where(eq(systemSettings.environment, environment));
    }
    if (category) {
      query = query.where(eq(systemSettings.category, category));
    }
    return await query;
  }

  async getSystemSetting(key: string, environment: string): Promise<SystemSettings | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .where(eq(systemSettings.environment, environment));
    return setting || undefined;
  }

  async createSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings> {
    const [newSetting] = await db
      .insert(systemSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined> {
    const [updatedSetting] = await db
      .update(systemSettings)
      .set(setting)
      .where(eq(systemSettings.id, id))
      .returning();
    return updatedSetting || undefined;
  }

  async deleteSystemSetting(id: number): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
