import { pgTable, varchar, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Hint definitions table
export const hints = pgTable('hints', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  key: varchar('key', { length: 100 }).notNull().unique(), // Unique identifier for the hint
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(), // Main hint text
  type: varchar('type', { length: 50 }).notNull().default('info'), // info, tip, warning, tutorial
  target: varchar('target', { length: 200 }), // CSS selector or element ID
  page: varchar('page', { length: 100 }), // Page/route where hint appears
  position: varchar('position', { length: 20 }).default('auto'), // top, bottom, left, right, auto
  trigger: varchar('trigger', { length: 20 }).default('hover'), // hover, click, auto, manual
  priority: integer('priority').default(0), // Higher priority hints show first
  conditions: jsonb('conditions'), // JSON conditions for when to show
  metadata: jsonb('metadata'), // Additional configuration
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_hints_page').on(table.page),
  index('idx_hints_key').on(table.key),
  index('idx_hints_active').on(table.isActive),
]);

// User hint interactions table
export const userHints = pgTable('user_hints', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  hintId: integer('hint_id').notNull().references(() => hints.id),
  status: varchar('status', { length: 20 }).notNull().default('unseen'), // unseen, seen, dismissed, completed
  viewCount: integer('view_count').default(0),
  firstSeenAt: timestamp('first_seen_at'),
  lastSeenAt: timestamp('last_seen_at'),
  dismissedAt: timestamp('dismissed_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_user_hints_user').on(table.userId),
  index('idx_user_hints_hint').on(table.hintId),
  index('idx_user_hints_status').on(table.status),
]);

// Hint sequences for tutorials
export const hintSequences = pgTable('hint_sequences', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  hints: jsonb('hints').notNull(), // Array of hint IDs in order
  requiredCompletion: boolean('required_completion').default(false), // Must complete before proceeding
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_hint_sequences_active').on(table.isActive),
]);

// Types
export type Hint = typeof hints.$inferSelect;
export type InsertHint = z.infer<typeof insertHintSchema>;
export type UserHint = typeof userHints.$inferSelect;
export type InsertUserHint = z.infer<typeof insertUserHintSchema>;
export type HintSequence = typeof hintSequences.$inferSelect;

// Schemas
export const insertHintSchema = createInsertSchema(hints);
export const insertUserHintSchema = createInsertSchema(userHints);
export const insertHintSequenceSchema = createInsertSchema(hintSequences);