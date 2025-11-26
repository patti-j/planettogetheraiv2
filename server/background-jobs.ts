// Phase 2 Step 2: Background Job Processing System
// Infrastructure Scaling - Async Operation Management

import { cacheManager } from './redis';
import { db } from './db';
import { agentRecommendations } from '@shared/schema';
import { sql, desc } from 'drizzle-orm';

// Job types for manufacturing ERP system
export enum JobType {
  REPORT_GENERATION = 'report_generation',
  DATA_EXPORT = 'data_export', 
  BATCH_OPERATION = 'batch_operation',
  EMAIL_NOTIFICATION = 'email_notification',
  INVENTORY_SYNC = 'inventory_sync',
  PRODUCTION_SCHEDULE = 'production_schedule',
  QUALITY_ANALYSIS = 'quality_analysis',
  SYSTEM_BACKUP = 'system_backup',
  DATABASE_CLEANUP = 'database_cleanup'
}

// Job status tracking
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Job priority levels
export enum JobPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Job interface
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  data: any;
  result?: any;
  error?: string;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  userId?: number;
  retryCount: number;
  maxRetries: number;
}

// Background job manager
export class BackgroundJobManager {
  private jobs = new Map<string, Job>();
  private workers = new Map<JobType, JobWorker>();
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeWorkers();
    this.startProcessing();
  }

  private initializeWorkers(): void {
    // Initialize workers for different job types
    this.workers.set(JobType.REPORT_GENERATION, new ReportGenerationWorker());
    this.workers.set(JobType.DATA_EXPORT, new DataExportWorker());
    this.workers.set(JobType.BATCH_OPERATION, new BatchOperationWorker());
    this.workers.set(JobType.EMAIL_NOTIFICATION, new EmailNotificationWorker());
    this.workers.set(JobType.INVENTORY_SYNC, new InventorySyncWorker());
    this.workers.set(JobType.PRODUCTION_SCHEDULE, new ProductionScheduleWorker());
    this.workers.set(JobType.QUALITY_ANALYSIS, new QualityAnalysisWorker());
    this.workers.set(JobType.SYSTEM_BACKUP, new SystemBackupWorker());
    this.workers.set(JobType.DATABASE_CLEANUP, new DatabaseCleanupWorker());

    console.log('🏭 Background Jobs: Workers initialized for manufacturing operations');
    
    // Schedule periodic database cleanup (every hour)
    this.schedulePeriodicCleanup();
  }
  
  private cleanupInterval?: NodeJS.Timeout;
  
  private schedulePeriodicCleanup(): void {
    // Run cleanup once daily (86400000 ms = 24 hours)
    this.cleanupInterval = setInterval(async () => {
      console.log('🧹 Background Jobs: Scheduling daily database cleanup');
      await this.addJob(JobType.DATABASE_CLEANUP, { 
        tables: ['agent_recommendations'],
        maxRows: 1000 
      }, JobPriority.LOW);
    }, 86400000); // 24 hours
    
    // Also run once on startup after a short delay
    setTimeout(async () => {
      console.log('🧹 Background Jobs: Running initial database cleanup check');
      await this.addJob(JobType.DATABASE_CLEANUP, { 
        tables: ['agent_recommendations'],
        maxRows: 1000 
      }, JobPriority.LOW);
    }, 30000); // 30 seconds after startup
  }

  public async addJob(
    type: JobType,
    data: any,
    priority: JobPriority = JobPriority.NORMAL,
    userId?: number,
    estimatedDuration?: number
  ): Promise<string> {
    const jobId = this.generateJobId();
    const job: Job = {
      id: jobId,
      type,
      status: JobStatus.PENDING,
      priority,
      data,
      progress: 0,
      createdAt: new Date(),
      userId,
      estimatedDuration,
      retryCount: 0,
      maxRetries: 3
    };

    this.jobs.set(jobId, job);
    
    // Cache job for persistence
    await cacheManager.cacheQueryResult(`job:${jobId}`, job, 86400); // 24 hours
    
    console.log(`📋 Background Jobs: Added ${type} job ${jobId} (Priority: ${priority})`);
    return jobId;
  }

  public async getJob(jobId: string): Promise<Job | null> {
    // Try memory first, then cache
    let job = this.jobs.get(jobId);
    if (!job) {
      const cachedJob = await cacheManager.getCachedQuery(`job:${jobId}`);
      if (cachedJob) {
        job = cachedJob;
        this.jobs.set(jobId, job);
      }
    }
    return job || null;
  }

  public async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    const jobs = Array.from(this.jobs.values()).filter(job => job.status === status);
    return jobs.sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
  }

  public async getJobsByUser(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      return false;
    }

    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date();
    await this.updateJob(job);
    
    console.log(`❌ Background Jobs: Cancelled job ${jobId}`);
    return true;
  }

  private async updateJob(job: Job): Promise<void> {
    this.jobs.set(job.id, job);
    await cacheManager.cacheQueryResult(`job:${job.id}`, job, 86400);
  }

  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processJobs();
    }, 5000); // Process every 5 seconds

    console.log('⚡ Background Jobs: Processing started');
  }

  private async processJobs(): Promise<void> {
    const pendingJobs = await this.getJobsByStatus(JobStatus.PENDING);
    
    for (const job of pendingJobs.slice(0, 3)) { // Process up to 3 jobs concurrently
      await this.executeJob(job);
    }
  }

  private async executeJob(job: Job): Promise<void> {
    const worker = this.workers.get(job.type);
    if (!worker) {
      job.status = JobStatus.FAILED;
      job.error = 'No worker available for job type';
      job.completedAt = new Date();
      await this.updateJob(job);
      return;
    }

    try {
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();
      await this.updateJob(job);

      console.log(`🔄 Background Jobs: Starting ${job.type} job ${job.id}`);

      // Execute job with progress tracking
      const result = await worker.execute(job.data, (progress) => {
        job.progress = progress;
        this.updateJob(job);
      });

      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.progress = 100;
      job.completedAt = new Date();
      job.actualDuration = job.completedAt.getTime() - (job.startedAt?.getTime() || 0);

      console.log(`✅ Background Jobs: Completed ${job.type} job ${job.id} in ${job.actualDuration}ms`);

    } catch (error) {
      job.retryCount++;
      
      if (job.retryCount < job.maxRetries) {
        job.status = JobStatus.PENDING;
        console.log(`🔄 Background Jobs: Retrying ${job.type} job ${job.id} (${job.retryCount}/${job.maxRetries})`);
      } else {
        job.status = JobStatus.FAILED;
        job.error = String(error);
        job.completedAt = new Date();
        console.log(`❌ Background Jobs: Failed ${job.type} job ${job.id}: ${error}`);
      }
    }

    await this.updateJob(job);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public getStats(): any {
    const jobs = Array.from(this.jobs.values());
    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      running: jobs.filter(j => j.status === JobStatus.RUNNING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      cancelled: jobs.filter(j => j.status === JobStatus.CANCELLED).length,
      avgDuration: this.calculateAverageDuration(jobs),
      successRate: this.calculateSuccessRate(jobs),
      workerTypes: Array.from(this.workers.keys()),
      lastProcessed: new Date().toISOString()
    };

    return stats;
  }

  private calculateAverageDuration(jobs: Job[]): number {
    const completedJobs = jobs.filter(j => j.actualDuration);
    if (completedJobs.length === 0) return 0;
    
    const total = completedJobs.reduce((sum, job) => sum + (job.actualDuration || 0), 0);
    return Math.round(total / completedJobs.length);
  }

  private calculateSuccessRate(jobs: Job[]): number {
    const finishedJobs = jobs.filter(j => 
      j.status === JobStatus.COMPLETED || j.status === JobStatus.FAILED
    );
    if (finishedJobs.length === 0) return 100;
    
    const successful = finishedJobs.filter(j => j.status === JobStatus.COMPLETED).length;
    return Math.round((successful / finishedJobs.length) * 100);
  }

  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isProcessing = false;
    console.log('⏹️ Background Jobs: Processing stopped');
  }
}

// Base worker class
abstract class JobWorker {
  abstract execute(data: any, progressCallback: (progress: number) => void): Promise<any>;
}

// Specific worker implementations for manufacturing ERP
class ReportGenerationWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(25);
    await this.delay(2000); // Simulate report generation
    progressCallback(75);
    await this.delay(1000);
    return { reportUrl: `/reports/generated_${Date.now()}.pdf`, pageCount: 15 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class DataExportWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(20);
    await this.delay(1500);
    progressCallback(60);
    await this.delay(1500);
    progressCallback(90);
    await this.delay(500);
    return { exportUrl: `/exports/data_${Date.now()}.xlsx`, recordCount: 1250 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class BatchOperationWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    const { operations = [] } = data;
    const total = operations.length;
    
    for (let i = 0; i < total; i++) {
      await this.delay(200);
      progressCallback(Math.round(((i + 1) / total) * 100));
    }
    
    return { processedCount: total, successCount: total - 2, failureCount: 2 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class EmailNotificationWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(50);
    await this.delay(1000);
    return { emailsSent: 1, status: 'delivered' };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class InventorySyncWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(30);
    await this.delay(2000);
    progressCallback(80);
    await this.delay(1000);
    return { itemsSynced: 245, discrepancies: 3 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ProductionScheduleWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(40);
    await this.delay(3000);
    progressCallback(85);
    await this.delay(1500);
    return { ordersScheduled: 12, resourcesAllocated: 8, conflicts: 1 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class QualityAnalysisWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(25);
    await this.delay(2500);
    progressCallback(70);
    await this.delay(2000);
    return { samplesAnalyzed: 89, passRate: 94.4, criticalIssues: 2 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class SystemBackupWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    progressCallback(15);
    await this.delay(5000); // Longer for backup
    progressCallback(60);
    await this.delay(3000);
    progressCallback(95);
    await this.delay(1000);
    return { backupSize: '2.4 GB', tablesBackedUp: 45, duration: '9.2 seconds' };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class DatabaseCleanupWorker extends JobWorker {
  async execute(data: any, progressCallback: (progress: number) => void): Promise<any> {
    const { maxRows = 1000 } = data;
    const results: Record<string, { before: number; after: number; deleted: number }> = {};
    
    progressCallback(10);
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    try {
      // Get current count of agent_recommendations
      const countResult = await db.select({ 
        count: sql<number>`count(*)::int` 
      }).from(agentRecommendations);
      
      const currentCount = countResult[0]?.count || 0;
      progressCallback(30);
      
      if (currentCount > maxRows) {
        // Calculate how many to delete
        const toDelete = currentCount - maxRows;
        
        console.log(`🧹 Database Cleanup: agent_recommendations has ${currentCount} rows, deleting oldest ${toDelete} rows`);
        
        // Delete oldest rows beyond the limit
        // Keep the newest 1000 rows by deleting where id is NOT in the top 1000 by created_at
        await db.execute(sql`
          DELETE FROM agent_recommendations 
          WHERE id IN (
            SELECT id FROM agent_recommendations 
            ORDER BY created_at ASC 
            LIMIT ${toDelete}
          )
        `);
        
        progressCallback(80);
        
        // Verify new count
        const newCountResult = await db.select({ 
          count: sql<number>`count(*)::int` 
        }).from(agentRecommendations);
        
        const newCount = newCountResult[0]?.count || 0;
        
        results['agent_recommendations'] = {
          before: currentCount,
          after: newCount,
          deleted: currentCount - newCount
        };
        
        console.log(`✅ Database Cleanup: agent_recommendations trimmed from ${currentCount} to ${newCount} rows`);
      } else {
        results['agent_recommendations'] = {
          before: currentCount,
          after: currentCount,
          deleted: 0
        };
        console.log(`✅ Database Cleanup: agent_recommendations has ${currentCount} rows (within limit of ${maxRows})`);
      }
      
      progressCallback(100);
      return { 
        success: true, 
        results,
        message: `Cleanup completed. Tables checked: ${Object.keys(results).length}`
      };
      
    } catch (error) {
      console.error('❌ Database Cleanup failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backgroundJobManager = new BackgroundJobManager();