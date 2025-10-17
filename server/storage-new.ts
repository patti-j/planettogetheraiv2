import { db } from "./db";
import { 
  users, plants, resources, productionOrders, widgets,
  type User, type Plant, type Resource, type ProductionOrder, type Widget,
  type InsertUser, type InsertPlant, type InsertResource, type InsertProductionOrder, type InsertWidget,
  optimizationAlgorithms, algorithmTests, algorithmDeployments, algorithmFeedback,
  algorithmFeedbackComments, algorithmFeedbackVotes, optimizationProfiles, optimizationRuns,
  optimizationScopeConfigs, extensionData, algorithmGovernanceApprovals,
  type OptimizationAlgorithm, type AlgorithmTest, type AlgorithmDeployment, type AlgorithmFeedback,
  type OptimizationProfile, type OptimizationRun, type OptimizationScopeConfig, type ExtensionData,
  type InsertOptimizationAlgorithm, type InsertAlgorithmTest, type InsertAlgorithmDeployment,
  type InsertAlgorithmFeedback, type InsertOptimizationProfile, type InsertOptimizationRun,
  type InsertOptimizationScopeConfig, type InsertExtensionData
} from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Plants
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;

  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;

  // Production Orders
  getProductionOrders(): Promise<ProductionOrder[]>;
  getProductionOrder(id: number): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;

  // Widgets
  getWidgets(): Promise<Widget[]>;
  getWidget(id: number): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: number, updates: Partial<InsertWidget>): Promise<Widget | undefined>;
  deleteWidget(id: number): Promise<boolean>;
  getWidgetsByPlatform(platform: string): Promise<Widget[]>;
  getWidgetsByCategory(category: string): Promise<Widget[]>;
  
  // Optimization Studio - Algorithm Management
  getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]>;
  getOptimizationAlgorithm(id: number): Promise<OptimizationAlgorithm | undefined>;
  createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm>;
  updateOptimizationAlgorithm(id: number, updates: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined>;
  deleteOptimizationAlgorithm(id: number): Promise<boolean>;
  
  // Optimization Studio - Algorithm Feedback
  getAlgorithmFeedback(filters?: any): Promise<AlgorithmFeedback[]>;
  getAlgorithmFeedbackById(id: number): Promise<AlgorithmFeedback | undefined>;
  createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback>;
  updateAlgorithmFeedback(id: number, updates: Partial<InsertAlgorithmFeedback>): Promise<AlgorithmFeedback | undefined>;
  
  // Optimization Studio - Algorithm Tests
  getAlgorithmTests(algorithmId?: number): Promise<AlgorithmTest[]>;
  getAlgorithmTest(id: number): Promise<AlgorithmTest | undefined>;
  createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest>;
  
  // Optimization Studio - Algorithm Deployments  
  getAlgorithmDeployments(algorithmId?: number): Promise<AlgorithmDeployment[]>;
  createAlgorithmDeployment(deployment: InsertAlgorithmDeployment): Promise<AlgorithmDeployment>;
  
  // Optimization Studio - Optimization Profiles
  getOptimizationProfiles(algorithmId?: number): Promise<OptimizationProfile[]>;
  getOptimizationProfile(id: number): Promise<OptimizationProfile | undefined>;
  createOptimizationProfile(profile: InsertOptimizationProfile): Promise<OptimizationProfile>;
  updateOptimizationProfile(id: number, updates: Partial<InsertOptimizationProfile>): Promise<OptimizationProfile | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Plants
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants).orderBy(desc(plants.createdAt));
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const [plant] = await db.insert(plants).values(insertPlant).returning();
    return plant;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.id));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }

  // Production Orders
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return await db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt));
  }

  async getProductionOrder(id: number): Promise<ProductionOrder | undefined> {
    const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return order || undefined;
  }

  async createProductionOrder(insertOrder: InsertProductionOrder): Promise<ProductionOrder> {
    const [order] = await db.insert(productionOrders).values(insertOrder).returning();
    return order;
  }

  // Widgets
  async getWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets).orderBy(desc(widgets.createdAt));
  }

  async getWidget(id: number): Promise<Widget | undefined> {
    const [widget] = await db.select().from(widgets).where(eq(widgets.id, id));
    return widget || undefined;
  }

  async createWidget(insertWidget: InsertWidget): Promise<Widget> {
    const [widget] = await db.insert(widgets).values(insertWidget).returning();
    return widget;
  }

  async updateWidget(id: number, updates: Partial<InsertWidget>): Promise<Widget | undefined> {
    const [widget] = await db
      .update(widgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(widgets.id, id))
      .returning();
    return widget || undefined;
  }

  async deleteWidget(id: number): Promise<boolean> {
    const [deleted] = await db.delete(widgets).where(eq(widgets.id, id)).returning();
    return !!deleted;
  }

  async getWidgetsByPlatform(platform: string): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(or(eq(widgets.targetPlatform, platform), eq(widgets.targetPlatform, 'both')))
      .orderBy(desc(widgets.createdAt));
  }

  async getWidgetsByCategory(category: string): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(eq(widgets.category, category))
      .orderBy(desc(widgets.createdAt));
  }

  // Optimization Studio - Algorithm Management
  async getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]> {
    let query = db.select().from(optimizationAlgorithms);
    
    const conditions = [];
    if (category) conditions.push(eq(optimizationAlgorithms.category, category));
    if (status) conditions.push(eq(optimizationAlgorithms.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(optimizationAlgorithms.createdAt));
  }

  async getOptimizationAlgorithm(id: number): Promise<OptimizationAlgorithm | undefined> {
    const [algorithm] = await db.select().from(optimizationAlgorithms)
      .where(eq(optimizationAlgorithms.id, id));
    return algorithm || undefined;
  }

  async createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm> {
    const [newAlgorithm] = await db.insert(optimizationAlgorithms).values(algorithm).returning();
    return newAlgorithm;
  }

  async updateOptimizationAlgorithm(id: number, updates: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined> {
    const [updated] = await db.update(optimizationAlgorithms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(optimizationAlgorithms.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOptimizationAlgorithm(id: number): Promise<boolean> {
    const result = await db.delete(optimizationAlgorithms).where(eq(optimizationAlgorithms.id, id));
    return result.rowCount > 0;
  }

  // Optimization Studio - Algorithm Feedback
  async getAlgorithmFeedback(filters?: any): Promise<AlgorithmFeedback[]> {
    let query = db.select().from(algorithmFeedback);
    
    const conditions = [];
    if (filters?.algorithmName) conditions.push(eq(algorithmFeedback.algorithmName, filters.algorithmName));
    if (filters?.status) conditions.push(eq(algorithmFeedback.status, filters.status));
    if (filters?.severity) conditions.push(eq(algorithmFeedback.severity, filters.severity));
    if (filters?.category) conditions.push(eq(algorithmFeedback.category, filters.category));
    if (filters?.submittedBy) conditions.push(eq(algorithmFeedback.submittedBy, filters.submittedBy));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(algorithmFeedback.createdAt));
  }

  async getAlgorithmFeedbackById(id: number): Promise<AlgorithmFeedback | undefined> {
    const [feedback] = await db.select().from(algorithmFeedback)
      .where(eq(algorithmFeedback.id, id));
    return feedback || undefined;
  }

  async createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback> {
    const [newFeedback] = await db.insert(algorithmFeedback).values(feedback).returning();
    return newFeedback;
  }

  async updateAlgorithmFeedback(id: number, updates: Partial<InsertAlgorithmFeedback>): Promise<AlgorithmFeedback | undefined> {
    const [updated] = await db.update(algorithmFeedback)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(algorithmFeedback.id, id))
      .returning();
    return updated || undefined;
  }

  // Optimization Studio - Algorithm Tests
  async getAlgorithmTests(algorithmId?: number): Promise<AlgorithmTest[]> {
    let query = db.select().from(algorithmTests);
    
    if (algorithmId) {
      query = query.where(eq(algorithmTests.algorithmId, algorithmId));
    }
    
    return await query.orderBy(desc(algorithmTests.createdAt));
  }

  async getAlgorithmTest(id: number): Promise<AlgorithmTest | undefined> {
    const [test] = await db.select().from(algorithmTests)
      .where(eq(algorithmTests.id, id));
    return test || undefined;
  }

  async createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest> {
    const [newTest] = await db.insert(algorithmTests).values(test).returning();
    return newTest;
  }

  // Optimization Studio - Algorithm Deployments
  async getAlgorithmDeployments(algorithmId?: number): Promise<AlgorithmDeployment[]> {
    let query = db.select().from(algorithmDeployments);
    
    if (algorithmId) {
      query = query.where(eq(algorithmDeployments.algorithmId, algorithmId));
    }
    
    return await query.orderBy(desc(algorithmDeployments.createdAt));
  }

  async createAlgorithmDeployment(deployment: InsertAlgorithmDeployment): Promise<AlgorithmDeployment> {
    const [newDeployment] = await db.insert(algorithmDeployments).values(deployment).returning();
    return newDeployment;
  }

  // Optimization Studio - Optimization Profiles
  async getOptimizationProfiles(algorithmId?: number): Promise<OptimizationProfile[]> {
    let query = db.select().from(optimizationProfiles);
    
    if (algorithmId) {
      query = query.where(eq(optimizationProfiles.algorithmId, algorithmId));
    }
    
    return await query.orderBy(desc(optimizationProfiles.createdAt));
  }

  async getOptimizationProfile(id: number): Promise<OptimizationProfile | undefined> {
    const [profile] = await db.select().from(optimizationProfiles)
      .where(eq(optimizationProfiles.id, id));
    return profile || undefined;
  }

  async createOptimizationProfile(profile: InsertOptimizationProfile): Promise<OptimizationProfile> {
    const [newProfile] = await db.insert(optimizationProfiles).values(profile).returning();
    return newProfile;
  }

  async updateOptimizationProfile(id: number, updates: Partial<InsertOptimizationProfile>): Promise<OptimizationProfile | undefined> {
    const [updated] = await db.update(optimizationProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(optimizationProfiles.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();