import { 
  capabilities, resources, jobs, operations, dependencies,
  type Capability, type Resource, type Job, type Operation, type Dependency,
  type InsertCapability, type InsertResource, type InsertJob, 
  type InsertOperation, type InsertDependency
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private capabilities: Map<number, Capability> = new Map();
  private resources: Map<number, Resource> = new Map();
  private jobs: Map<number, Job> = new Map();
  private operations: Map<number, Operation> = new Map();
  private dependencies: Map<number, Dependency> = new Map();
  
  private currentCapabilityId = 1;
  private currentResourceId = 1;
  private currentJobId = 1;
  private currentOperationId = 1;
  private currentDependencyId = 1;

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
      const capability: Capability = { id: this.currentCapabilityId++, ...cap };
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
      const resource: Resource = { id: this.currentResourceId++, ...res };
      this.resources.set(resource.id, resource);
    });
  }

  // Capabilities
  async getCapabilities(): Promise<Capability[]> {
    return Array.from(this.capabilities.values());
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const newCapability: Capability = { id: this.currentCapabilityId++, ...capability };
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
    const newResource: Resource = { id: this.currentResourceId++, ...resource };
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
      ...job,
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
    const newOperation: Operation = { id: this.currentOperationId++, ...operation };
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
}

export const storage = new MemStorage();
