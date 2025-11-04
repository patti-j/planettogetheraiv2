/**
 * Schedule Version Service
 * Manages schedule versioning, snapshots, and optimistic concurrency control
 */

import crypto from 'crypto';
import { storage } from '../storage';
import { db } from '../db';
import { 
  scheduleVersions, 
  operationVersions, 
  versionComparisons,
  scheduleLocks,
  versionRollbacks,
  ptJobOperations 
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface VersionSnapshot {
  scheduleId: number;
  operations: any[];
  resources: any[];
  dependencies: any[];
  metadata: Record<string, any>;
}

export interface VersionMetrics {
  makespan: number;
  resourceUtilization: number;
  totalSetupTime: number;
  totalChangeovers: number;
  constraintViolations: number;
  totalWorkingHours?: number;
}

export interface ConcurrencyCheckResult {
  isValid: boolean;
  currentVersion: number;
  expectedVersion: number;
  conflicts?: string[];
}

export class ScheduleVersionService {
  private static instance: ScheduleVersionService;

  private constructor() {}

  public static getInstance(): ScheduleVersionService {
    if (!ScheduleVersionService.instance) {
      ScheduleVersionService.instance = new ScheduleVersionService();
    }
    return ScheduleVersionService.instance;
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(
    scheduleId: number,
    userId: number,
    source: 'manual' | 'optimization' | 'import' | 'auto-save',
    comment?: string,
    tag?: string
  ): Promise<number> {
    try {
      // Get current operations state - all operations are part of the global schedule
      const operations = await db
        .select()
        .from(ptJobOperations)
        .where(sql`job_id IN (SELECT id FROM ptjobs)`);

      // Calculate next version number
      const lastVersion = await db
        .select({ versionNumber: scheduleVersions.versionNumber })
        .from(scheduleVersions)
        .where(eq(scheduleVersions.scheduleId, scheduleId))
        .orderBy(desc(scheduleVersions.versionNumber))
        .limit(1);

      const nextVersionNumber = (lastVersion[0]?.versionNumber || 0) + 1;

      // Create snapshot data
      const snapshotData: VersionSnapshot = {
        scheduleId,
        operations: operations.map(op => ({
          id: op.id,
          jobId: op.jobId,
          name: op.name,
          scheduledStart: op.scheduledStart,
          scheduledEnd: op.scheduledEnd,
          manuallyScheduled: op.manuallyScheduled,
          constraintType: op.constraintType,
          constraintDate: op.constraintDate,
          sequenceNumber: op.sequenceNumber
        })),
        resources: [], // TODO: Fetch from ptresources when available
        dependencies: [], // TODO: Fetch from ptjobdependencies when available
        metadata: {
          operationCount: operations.length,
          timestamp: new Date().toISOString(),
          source
        }
      };

      // Calculate checksum for optimistic concurrency
      const checksum = this.calculateChecksum(snapshotData);

      // Calculate metrics
      const metrics = this.calculateMetrics(operations);

      // Get parent version if exists
      const parentVersion = await this.getLatestVersion(scheduleId);

      // Insert new version
      const [newVersion] = await db
        .insert(scheduleVersions)
        .values({
          scheduleId,
          versionNumber: nextVersionNumber,
          versionTag: tag,
          createdBy: userId,
          source,
          comment,
          snapshotData: JSON.stringify(snapshotData),
          operationSnapshots: JSON.stringify(snapshotData.operations),
          resourceAllocations: JSON.stringify(snapshotData.resources),
          parentVersionId: parentVersion?.id,
          checksum,
          metrics: JSON.stringify(metrics),
          status: 'active'
        })
        .returning();

      // Track individual operation changes if there's a parent version
      if (parentVersion) {
        await this.trackOperationChanges(newVersion.id, parentVersion, snapshotData);
      }

      return newVersion.id;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Get the latest version for a schedule
   */
  async getLatestVersion(scheduleId: number): Promise<any> {
    const versions = await db
      .select()
      .from(scheduleVersions)
      .where(eq(scheduleVersions.scheduleId, scheduleId))
      .orderBy(desc(scheduleVersions.versionNumber))
      .limit(1);

    return versions[0];
  }

  /**
   * Get version history for a schedule
   */
  async getVersionHistory(
    scheduleId: number,
    limit: number = 50
  ): Promise<any[]> {
    return await db
      .select()
      .from(scheduleVersions)
      .where(eq(scheduleVersions.scheduleId, scheduleId))
      .orderBy(desc(scheduleVersions.createdAt))
      .limit(limit);
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    versionId1: number,
    versionId2: number,
    userId: number
  ): Promise<any> {
    // Get both versions
    const [v1, v2] = await Promise.all([
      this.getVersionById(versionId1),
      this.getVersionById(versionId2)
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    // Calculate differences
    const differences = this.calculateDifferences(v1.snapshotData, v2.snapshotData);

    // Calculate metrics delta
    const metricsDelta = this.calculateMetricsDelta(v1.metrics, v2.metrics);

    // Store comparison
    const [comparison] = await db
      .insert(versionComparisons)
      .values({
        versionId1,
        versionId2,
        comparisonType: 'diff',
        differences,
        conflictCount: differences.conflicts?.length || 0,
        metricsDelta,
        createdBy: userId
      })
      .returning();

    return comparison;
  }

  /**
   * Perform optimistic concurrency check
   */
  async checkConcurrency(
    scheduleId: number,
    expectedVersionNumber: number
  ): Promise<ConcurrencyCheckResult> {
    const currentVersion = await this.getLatestVersion(scheduleId);
    
    const isValid = !currentVersion || currentVersion.versionNumber === expectedVersionNumber;

    return {
      isValid,
      currentVersion: currentVersion?.versionNumber || 0,
      expectedVersion: expectedVersionNumber,
      conflicts: isValid ? undefined : ['Version mismatch - schedule has been modified']
    };
  }

  /**
   * Acquire a schedule lock
   */
  async acquireLock(
    scheduleId: number,
    versionId: number,
    userId: number,
    lockType: 'read' | 'write' | 'exclusive',
    sessionId: string,
    purpose?: string
  ): Promise<number | null> {
    try {
      // Check for existing active locks
      const existingLocks = await db
        .select()
        .from(scheduleLocks)
        .where(
          and(
            eq(scheduleLocks.scheduleId, scheduleId),
            eq(scheduleLocks.isActive, true)
          )
        );

      // Check for conflicts based on lock type
      const hasConflict = existingLocks.some(lock => {
        if (lock.lockType === 'exclusive') return true;
        if (lockType === 'exclusive') return true;
        if (lock.lockType === 'write' && lockType === 'write') return true;
        return false;
      });

      if (hasConflict) {
        return null; // Lock conflict
      }

      // Get current version
      const currentVersion = await this.getLatestVersion(scheduleId);

      // Create lock with expiration (5 minutes default)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const [lock] = await db
        .insert(scheduleLocks)
        .values({
          scheduleId,
          versionId,
          lockType,
          lockedBy: userId,
          expiresAt,
          sessionId,
          purpose,
          expectedVersion: currentVersion?.versionNumber || 0,
          actualVersion: currentVersion?.versionNumber || 0,
          isActive: true
        })
        .returning();

      return lock.id;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return null;
    }
  }

  /**
   * Release a schedule lock
   */
  async releaseLock(lockId: number): Promise<boolean> {
    try {
      await db
        .update(scheduleLocks)
        .set({ isActive: false })
        .where(eq(scheduleLocks.id, lockId));

      return true;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    scheduleId: number,
    targetVersionId: number,
    userId: number,
    reason: string
  ): Promise<number> {
    try {
      // Get current and target versions
      const currentVersion = await this.getLatestVersion(scheduleId);
      const targetVersion = await this.getVersionById(targetVersionId);

      if (!targetVersion) {
        throw new Error('Target version not found');
      }

      // Create rollback record
      const [rollback] = await db
        .insert(versionRollbacks)
        .values({
          scheduleId,
          fromVersionId: currentVersion.id,
          toVersionId: targetVersionId,
          rollbackReason: reason,
          rollbackType: 'full',
          affectedOperations: targetVersion.operationSnapshots,
          performedBy: userId,
          approved: true,
          approvedBy: userId,
          approvedAt: new Date()
        })
        .returning();

      // Create new version from target
      const newVersionId = await this.createVersion(
        scheduleId,
        userId,
        'manual',
        `Rollback to version ${targetVersion.versionNumber}: ${reason}`,
        `rollback-v${targetVersion.versionNumber}`
      );

      // Apply target version data to operations
      await this.applyVersionSnapshot(targetVersion.snapshotData);

      return newVersionId;
    } catch (error) {
      console.error('Error rolling back version:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private calculateChecksum(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  private calculateMetrics(operations: any[]): VersionMetrics {
    // Calculate makespan (total schedule duration)
    let earliestStart = Infinity;
    let latestEnd = -Infinity;
    
    // Calculate total working hours and resource utilization
    let totalWorkingHours = 0;
    const resourceUsageMap = new Map<string, number>();

    operations.forEach(op => {
      if (op.scheduledStart && op.scheduledEnd) {
        const start = new Date(op.scheduledStart).getTime();
        const end = new Date(op.scheduledEnd).getTime();
        earliestStart = Math.min(earliestStart, start);
        latestEnd = Math.max(latestEnd, end);
        
        // Calculate working hours for this operation
        const operationHours = (end - start) / (1000 * 60 * 60);
        totalWorkingHours += operationHours;
        
        // Track resource usage if resource is assigned
        if (op.resourceId) {
          const currentUsage = resourceUsageMap.get(op.resourceId) || 0;
          resourceUsageMap.set(op.resourceId, currentUsage + operationHours);
        }
      }
    });

    const makespan = earliestStart === Infinity ? 0 : 
      (latestEnd - earliestStart) / (1000 * 60 * 60); // Convert to hours
    
    // Calculate resource utilization
    // For ASAP: operations are packed tightly at the beginning, higher utilization
    // For ALAP: operations are spread out near due dates, potentially lower utilization
    let resourceUtilization = 0;
    if (makespan > 0) {
      // Calculate average utilization across all resources
      const numResources = resourceUsageMap.size || 1; // Assume at least 1 resource
      const totalAvailableHours = makespan * numResources; // Total capacity across all resources
      
      if (totalAvailableHours > 0) {
        resourceUtilization = (totalWorkingHours / totalAvailableHours) * 100;
        // Cap at 100% (can't exceed available capacity)
        resourceUtilization = Math.min(100, resourceUtilization);
      }
    }

    return {
      makespan,
      resourceUtilization: Math.round(resourceUtilization * 10) / 10, // Round to 1 decimal
      totalSetupTime: operations.reduce((sum, op) => 
        sum + (parseFloat(op.setupHours) || 0), 0),
      totalChangeovers: 0, // Would calculate based on resource switches  
      constraintViolations: operations.filter(op => 
        op.constraintType && op.constraintDate).length,
      totalWorkingHours: Math.round(totalWorkingHours * 10) / 10 // Add total working hours
    };
  }

  private async trackOperationChanges(
    versionId: number,
    parentVersion: any,
    currentSnapshot: VersionSnapshot
  ): Promise<void> {
    const parentOps = parentVersion.operationSnapshots || [];
    const currentOps = currentSnapshot.operations;

    // Create a map for easy lookup
    const parentOpsMap = new Map(parentOps.map((op: any) => [op.id, op]));
    const currentOpsMap = new Map(currentOps.map(op => [op.id, op]));

    const changes = [];

    // Check for updates and deletions
    for (const parentOp of parentOps) {
      const currentOp = currentOpsMap.get(parentOp.id);
      
      if (!currentOp) {
        // Operation was deleted
        changes.push({
          operationId: parentOp.id,
          versionId,
          changeType: 'deleted',
          previousValues: parentOp,
          newValues: null
        });
      } else {
        // Check for changes
        const changedFields = [];
        const previousValues: any = {};
        const newValues: any = {};

        for (const key of Object.keys(parentOp)) {
          if (JSON.stringify(parentOp[key]) !== JSON.stringify(currentOp[key])) {
            changedFields.push(key);
            previousValues[key] = parentOp[key];
            newValues[key] = currentOp[key];
          }
        }

        if (changedFields.length > 0) {
          changes.push({
            operationId: currentOp.id,
            versionId,
            scheduledStart: currentOp.scheduledStart,
            scheduledEnd: currentOp.scheduledEnd,
            resourceId: currentOp.resourceId,
            sequenceNumber: currentOp.sequenceNumber,
            changeType: 'updated',
            changedFields,
            previousValues,
            newValues,
            manuallyScheduled: currentOp.manuallyScheduled
          });
        }
      }
    }

    // Check for new operations
    for (const currentOp of currentOps) {
      if (!parentOpsMap.has(currentOp.id)) {
        changes.push({
          operationId: currentOp.id,
          versionId,
          scheduledStart: currentOp.scheduledStart,
          scheduledEnd: currentOp.scheduledEnd,
          resourceId: currentOp.resourceId,
          sequenceNumber: currentOp.sequenceNumber,
          changeType: 'created',
          newValues: currentOp,
          manuallyScheduled: currentOp.manuallyScheduled
        });
      }
    }

    // Insert all changes
    if (changes.length > 0) {
      await db.insert(operationVersions).values(changes);
    }
  }

  private calculateDifferences(snapshot1: any, snapshot2: any): any {
    const differences = {
      operations: {
        added: [],
        removed: [],
        modified: []
      },
      resources: {
        added: [],
        removed: [],
        modified: []
      },
      conflicts: []
    };

    // Compare operations
    const ops1Map = new Map(snapshot1.operations.map((op: any) => [op.id, op]));
    const ops2Map = new Map(snapshot2.operations.map((op: any) => [op.id, op]));

    // Find added/removed/modified operations
    for (const [id, op] of ops2Map) {
      if (!ops1Map.has(id)) {
        differences.operations.added.push(op);
      } else if (JSON.stringify(op) !== JSON.stringify(ops1Map.get(id))) {
        differences.operations.modified.push({
          id,
          before: ops1Map.get(id),
          after: op
        });
      }
    }

    for (const [id, op] of ops1Map) {
      if (!ops2Map.has(id)) {
        differences.operations.removed.push(op);
      }
    }

    return differences;
  }

  private calculateMetricsDelta(metrics1: any, metrics2: any): any {
    if (!metrics1 || !metrics2) return null;

    return {
      makespan: metrics2.makespan - metrics1.makespan,
      resourceUtilization: metrics2.resourceUtilization - metrics1.resourceUtilization,
      totalSetupTime: metrics2.totalSetupTime - metrics1.totalSetupTime,
      totalChangeovers: metrics2.totalChangeovers - metrics1.totalChangeovers,
      constraintViolations: metrics2.constraintViolations - metrics1.constraintViolations
    };
  }

  private async getVersionById(versionId: number): Promise<any> {
    const [version] = await db
      .select()
      .from(scheduleVersions)
      .where(eq(scheduleVersions.id, versionId))
      .limit(1);

    return version;
  }

  private async applyVersionSnapshot(snapshot: VersionSnapshot): Promise<void> {
    // Apply the snapshot data back to the operations
    for (const op of snapshot.operations) {
      await db
        .update(ptJobOperations)
        .set({
          scheduledStart: op.scheduledStart,
          scheduledEnd: op.scheduledEnd,
          manuallyScheduled: op.manuallyScheduled,
          constraintType: op.constraintType,
          constraintDate: op.constraintDate,
          sequenceNumber: op.sequenceNumber
        })
        .where(eq(ptJobOperations.id, op.id));
    }
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<void> {
    await db
      .update(scheduleLocks)
      .set({ isActive: false })
      .where(
        and(
          eq(scheduleLocks.isActive, true),
          sql`${scheduleLocks.expiresAt} < NOW()`
        )
      );
  }
}

// Export singleton instance
export const scheduleVersionService = ScheduleVersionService.getInstance();