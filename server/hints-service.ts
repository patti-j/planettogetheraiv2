import { db } from './db';
import { hints, userHints, hintSequences } from '@shared/schemas/hints';
import { eq, and, inArray, or, isNull, sql } from 'drizzle-orm';
import type { Hint, UserHint, HintSequence } from '@shared/schemas/hints';

export class HintsService {
  // Get hints for a specific page and user
  async getPageHints(userId: number, page: string): Promise<any[]> {
    const pageHints = await db
      .select({
        hint: hints,
        userStatus: userHints,
      })
      .from(hints)
      .leftJoin(
        userHints,
        and(
          eq(userHints.hintId, hints.id),
          eq(userHints.userId, userId)
        )
      )
      .where(
        and(
          eq(hints.isActive, true),
          or(
            eq(hints.page, page),
            isNull(hints.page) // Global hints
          )
        )
      )
      .orderBy(hints.priority);

    // Filter and format hints based on user status
    return pageHints.map(({ hint, userStatus }) => ({
      ...hint,
      userStatus: userStatus?.status || 'unseen',
      viewCount: userStatus?.viewCount || 0,
      shouldShow: this.shouldShowHint(hint, userStatus),
    }));
  }

  // Check if a hint should be shown based on conditions
  private shouldShowHint(hint: Hint, userStatus: UserHint | null): boolean {
    // Don't show dismissed hints unless they're tutorial type
    if (userStatus?.status === 'dismissed' && hint.type !== 'tutorial') {
      return false;
    }

    // Don't show completed hints
    if (userStatus?.status === 'completed') {
      return false;
    }

    // Check custom conditions if any
    if (hint.conditions) {
      return this.evaluateConditions(hint.conditions as any);
    }

    return true;
  }

  // Evaluate custom conditions for showing hints
  private evaluateConditions(conditions: any): boolean {
    // Implement condition evaluation logic
    // Examples: firstVisit, afterAction, timeDelay, etc.
    if (conditions.firstVisit) {
      // Check if it's user's first visit to the page
      return true; // Simplified for now
    }

    if (conditions.minViewCount && conditions.maxViewCount) {
      // Show hint within a specific view count range
      return true; // Simplified for now
    }

    return true;
  }

  // Mark a hint as seen
  async markHintSeen(userId: number, hintId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userHints)
      .where(
        and(
          eq(userHints.userId, userId),
          eq(userHints.hintId, hintId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // Create new user hint record
      await db.insert(userHints).values({
        userId,
        hintId,
        status: 'seen',
        viewCount: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      } as any);
    } else {
      // Update existing record
      await db
        .update(userHints)
        .set({
          status: 'seen',
          viewCount: sql`${userHints.viewCount} + 1`,
          lastSeenAt: new Date(),
        } as any)
        .where(
          and(
            eq(userHints.userId, userId),
            eq(userHints.hintId, hintId)
          )
        );
    }
  }

  // Dismiss a hint
  async dismissHint(userId: number, hintId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userHints)
      .where(
        and(
          eq(userHints.userId, userId),
          eq(userHints.hintId, hintId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userHints).values({
        userId,
        hintId,
        status: 'dismissed',
        dismissedAt: new Date(),
      } as any);
    } else {
      await db
        .update(userHints)
        .set({
          status: 'dismissed',
          dismissedAt: new Date(),
        } as any)
        .where(
          and(
            eq(userHints.userId, userId),
            eq(userHints.hintId, hintId)
          )
        );
    }
  }

  // Complete a hint (for tutorials)
  async completeHint(userId: number, hintId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userHints)
      .where(
        and(
          eq(userHints.userId, userId),
          eq(userHints.hintId, hintId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userHints).values({
        userId,
        hintId,
        status: 'completed',
        completedAt: new Date(),
      } as any);
    } else {
      await db
        .update(userHints)
        .set({
          status: 'completed',
          completedAt: new Date(),
        } as any)
        .where(
          and(
            eq(userHints.userId, userId),
            eq(userHints.hintId, hintId)
          )
        );
    }
  }

  // Reset all hints for a user
  async resetUserHints(userId: number): Promise<void> {
    await db
      .delete(userHints)
      .where(eq(userHints.userId, userId));
  }

  // Get hint sequences (tutorials)
  async getHintSequences(): Promise<HintSequence[]> {
    return await db
      .select()
      .from(hintSequences)
      .where(eq(hintSequences.isActive, true));
  }

  // Seed initial hints
  async seedHints(): Promise<void> {
    const defaultHints = [
      {
        key: 'resource-timeline-intro',
        title: 'Resource Timeline',
        content: 'This timeline shows all operations scheduled for each resource. You can drag operations to reschedule them or click for details.',
        type: 'info',
        page: '/resource-timeline',
        target: '.timeline-container',
        position: 'top',
        trigger: 'auto',
        priority: 10,
      },
      {
        key: 'optimization-button',
        title: 'Optimize Your Schedule',
        content: 'Click here to run optimization algorithms on your production schedule. Choose from ASAP, ALAP, Critical Path, or Resource Leveling.',
        type: 'tip',
        page: '/resource-timeline',
        target: '[data-hint="optimize-button"]',
        position: 'bottom',
        trigger: 'hover',
        priority: 5,
      },
      {
        key: 'dashboard-widgets',
        title: 'Customizable Widgets',
        content: 'Drag and drop widgets to customize your dashboard. Click the settings icon on any widget to configure it.',
        type: 'tip',
        page: '/dashboards',
        target: '.widget-container',
        position: 'right',
        trigger: 'auto',
        priority: 8,
      },
      {
        key: 'production-order-create',
        title: 'Create Production Order',
        content: 'Start a new production order here. The system will automatically suggest optimal scheduling based on resource availability.',
        type: 'tutorial',
        page: '/production-orders',
        target: '[data-hint="create-order"]',
        position: 'bottom',
        trigger: 'hover',
        priority: 10,
      },
      {
        key: 'ai-assistant',
        title: 'AI Assistant Available',
        content: 'Max AI can help you analyze production data, optimize schedules, and answer questions. Click the chat icon to start.',
        type: 'tip',
        page: null, // Global hint
        target: '[data-hint="ai-chat"]',
        position: 'left',
        trigger: 'auto',
        priority: 3,
      },
      {
        key: 'conflict-warning',
        title: 'Resource Conflict Detected',
        content: 'This operation conflicts with another scheduled operation. Click to view details and resolve the conflict.',
        type: 'warning',
        page: '/resource-timeline',
        target: '.conflict-indicator',
        position: 'top',
        trigger: 'auto',
        priority: 15,
        conditions: { hasConflicts: true },
      },
      {
        key: 'first-login',
        title: 'Welcome to PlanetTogether!',
        content: 'Let\'s take a quick tour of the main features. You can access this tour again from the Help menu.',
        type: 'tutorial',
        page: null,
        target: null,
        position: 'center',
        trigger: 'auto',
        priority: 20,
        conditions: { firstVisit: true },
      },
    ];

    // Insert hints if they don't exist
    for (const hintData of defaultHints) {
      const existing = await db
        .select()
        .from(hints)
        .where(eq(hints.key, hintData.key))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(hints).values(hintData);
      }
    }

    // Create a tutorial sequence
    const tutorialHints = await db
      .select()
      .from(hints)
      .where(eq(hints.type, 'tutorial'))
      .orderBy(hints.priority);

    if (tutorialHints.length > 0) {
      const existingSequence = await db
        .select()
        .from(hintSequences)
        .where(eq(hintSequences.name, 'onboarding-tutorial'))
        .limit(1);

      if (existingSequence.length === 0) {
        await db.insert(hintSequences).values({
          name: 'onboarding-tutorial',
          description: 'Initial onboarding tutorial for new users',
          hints: tutorialHints.map(h => h.id),
          requiredCompletion: false,
        } as any);
      }
    }
  }
}

export const hintsService = new HintsService();