import { db, getDb, isDbConnected } from './db';
import { users, roles, userRoles, dashboards } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface InitializationTask {
  name: string;
  priority: 'critical' | 'best-effort';
  fn: () => Promise<void>;
}

// Dynamic production detection - check at runtime, not module load time
function checkIsProduction(): boolean {
  return process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';
}

class InitializationOrchestrator {
  private readyFlag = false;
  private startTime = Date.now();
  private taskResults: Map<string, { status: 'pending' | 'success' | 'failed'; error?: string }> = new Map();
  
  constructor() {
    console.log('🚀 [Orchestrator] Initializing...');
  }
  
  async start() {
    // Check production status dynamically at start time
    const isProduction = checkIsProduction();
    console.log(`📌 [Orchestrator] Environment: ${isProduction ? 'PRODUCTION' : 'development'}`);
    console.log(`📌 [Orchestrator] REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT || 'not set'}`);
    console.log(`📌 [Orchestrator] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    
    // PRODUCTION MODE: Skip all initialization tasks entirely
    // These are setup/maintenance tasks, not runtime requirements
    // Admin credentials and users are already configured in the database
    // This prevents database cold start timeouts from blocking app startup
    if (isProduction) {
      console.log('✅ [Orchestrator] Production mode - skipping initialization tasks (already configured)');
      this.readyFlag = true;
      return;
    }
    
    // Check if database is available before running tasks
    if (!isDbConnected()) {
      console.warn('⚠️ [Orchestrator] Database not connected, skipping initialization tasks');
      this.readyFlag = true; // Allow app to start, API routes will handle db availability
      return;
    }

    // DEVELOPMENT MODE ONLY: Run initialization tasks
    const criticalTasks: InitializationTask[] = [
      {
        name: 'admin-credentials',
        priority: 'critical',
        fn: async () => {
          const { ensureAdminAccess } = await import('./ensure-admin-access');
          await ensureAdminAccess();
        }
      },
      {
        name: 'production-users',
        priority: 'critical',
        fn: async () => {
          // Skip in production (handled above)
        }
      }
    ];

    const bestEffortTasks: InitializationTask[] = [
      {
        name: 'dashboard-check',
        priority: 'best-effort',
        fn: async () => {
          const database = getDb();
          const existingDashboard = await database.select().from(dashboards).where(eq(dashboards.id, 1)).limit(1);
          if (existingDashboard.length === 0) {
            await database.insert(dashboards).values({
              name: "Max AI Canvas",
              description: "Default dashboard for Max AI generated widgets",
              configuration: {
                layout: [],
                settings: { refreshInterval: 60, theme: "light" }
              },
              userId: null,
              isActive: true,
              isDefault: false
            });
            console.log("✅ [Orchestrator] Max AI Canvas dashboard created");
          }
        }
      },
      {
        name: 'production-permissions-fix',
        priority: 'best-effort',
        fn: async () => {
          // Skip in production (handled above)
        }
      }
    ];

    // Initialize task statuses
    [...criticalTasks, ...bestEffortTasks].forEach(task => {
      this.taskResults.set(task.name, { status: 'pending' });
    });

    // Development mode: use shorter timeout since dev DB is usually warm
    const timeoutMs = 30000; // 30 seconds for development
    const retries = 1;
    console.log(`⏱️ [Orchestrator] Using ${timeoutMs}ms timeout with ${retries} retries`);
    
    const criticalPromises = criticalTasks.map(task => 
      this.executeTaskWithRetry(task, timeoutMs, retries)
    );

    // Wait for all critical tasks (use allSettled to not fail on single task failure)
    const criticalResults = await Promise.allSettled(criticalPromises);
    
    // Check if all critical tasks succeeded
    const allCriticalSucceeded = criticalResults.every(
      result => result.status === 'fulfilled' && result.value === true
    );

    if (allCriticalSucceeded) {
      this.readyFlag = true;
      const elapsed = Date.now() - this.startTime;
      console.log(`✅ [Orchestrator] Critical initialization complete in ${elapsed}ms`);
    } else {
      // Allow the app to start even if initialization fails
      this.readyFlag = true;
      console.warn('⚠️ [Orchestrator] Some critical tasks failed, system in degraded state');
    }

    // Fire best-effort tasks without awaiting
    const bestEffortTimeout = 30000; // 30 seconds
    bestEffortTasks.forEach(task => {
      this.executeTaskWithRetry(task, bestEffortTimeout, 1).catch(err => {
        console.warn(`⚠️ [Orchestrator] Best-effort task ${task.name} failed:`, err);
      });
    });
  }

  private async executeTaskWithRetry(task: InitializationTask, timeoutMs: number, maxRetries: number): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const success = await this.executeTaskWithTimeout(task, timeoutMs);
      if (success) return true;
      
      if (attempt < maxRetries) {
        console.log(`🔄 [Orchestrator] Retrying ${task.name} (attempt ${attempt + 1}/${maxRetries})...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    return false;
  }

  private async executeTaskWithTimeout(task: InitializationTask, timeoutMs: number): Promise<boolean> {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    try {
      await Promise.race([task.fn(), timeoutPromise]);
      this.taskResults.set(task.name, { status: 'success' });
      console.log(`✅ [Orchestrator] ${task.name} completed`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.taskResults.set(task.name, { status: 'failed', error: errorMsg });
      console.error(`❌ [Orchestrator] ${task.name} failed:`, errorMsg);
      return false;
    }
  }

  isReady(): boolean {
    return this.readyFlag;
  }

  getStatus() {
    return {
      ready: this.readyFlag,
      elapsed: Date.now() - this.startTime,
      tasks: Object.fromEntries(this.taskResults)
    };
  }
}

export const orchestrator = new InitializationOrchestrator();
