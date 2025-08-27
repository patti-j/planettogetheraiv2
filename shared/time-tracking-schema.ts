import { 
  pgTable, 
  serial, 
  varchar, 
  timestamp, 
  integer,
  decimal,
  boolean,
  json,
  text,
  index
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Time Clock Entries - Main table for tracking clock in/out
export const timeClockEntries = pgTable("time_clock_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  operationId: integer("operation_id"), // Optional - when clocking into specific operation
  jobId: integer("job_id"), // Optional - related job
  clockInTime: timestamp("clock_in_time").notNull().defaultNow(),
  clockOutTime: timestamp("clock_out_time"),
  breakMinutes: integer("break_minutes").default(0), // Total break time in minutes
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }), // Calculated total hours worked
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Employee's hourly rate at time of entry
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }), // Calculated labor cost
  status: varchar("status", { length: 50 }).default("active"), // active, closed, cancelled
  notes: text("notes"),
  location: varchar("location", { length: 255 }), // Work location/department
  shiftType: varchar("shift_type", { length: 50 }), // day, night, weekend, overtime
  overtimeHours: decimal("overtime_hours", { precision: 10, scale: 2 }).default(sql`0`),
  overtimeRate: decimal("overtime_rate", { precision: 10, scale: 2 }), // Overtime multiplier
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
}, (table) => [
  index("idx_time_clock_user").on(table.userId),
  index("idx_time_clock_operation").on(table.operationId),
  index("idx_time_clock_status").on(table.status),
  index("idx_time_clock_date").on(table.clockInTime),
]);

// Team Clock Entries - For team/group clock in
export const teamClockEntries = pgTable("team_clock_entries", {
  id: serial("id").primaryKey(),
  supervisorId: integer("supervisor_id").notNull().references(() => users.id),
  operationId: integer("operation_id").notNull(),
  jobId: integer("job_id"),
  teamName: varchar("team_name", { length: 255 }),
  teamMembers: json("team_members").notNull(), // Array of user IDs
  clockInTime: timestamp("clock_in_time").notNull().defaultNow(),
  clockOutTime: timestamp("clock_out_time"),
  totalTeamHours: decimal("total_team_hours", { precision: 10, scale: 2 }),
  totalLaborCost: decimal("total_labor_cost", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("active"),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_team_clock_supervisor").on(table.supervisorId),
  index("idx_team_clock_operation").on(table.operationId),
  index("idx_team_clock_status").on(table.status),
]);

// Team Member Clock Details - Individual records for team members
export const teamMemberClockDetails = pgTable("team_member_clock_details", {
  id: serial("id").primaryKey(),
  teamClockEntryId: integer("team_clock_entry_id").notNull().references(() => teamClockEntries.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  breakMinutes: integer("break_minutes").default(0),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("active"),
  notes: text("notes"),
}, (table) => [
  index("idx_team_member_entry").on(table.teamClockEntryId),
  index("idx_team_member_user").on(table.userId),
]);

// Labor Cost Summary - Aggregated labor costs by job/operation
export const laborCostSummary = pgTable("labor_cost_summary", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  operationId: integer("operation_id"),
  date: timestamp("date").notNull(),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }).notNull(),
  regularHours: decimal("regular_hours", { precision: 10, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 10, scale: 2 }),
  totalLaborCost: decimal("total_labor_cost", { precision: 10, scale: 2 }).notNull(),
  regularCost: decimal("regular_cost", { precision: 10, scale: 2 }),
  overtimeCost: decimal("overtime_cost", { precision: 10, scale: 2 }),
  employeeCount: integer("employee_count"),
  averageHourlyRate: decimal("average_hourly_rate", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_labor_cost_job").on(table.jobId),
  index("idx_labor_cost_operation").on(table.operationId),
  index("idx_labor_cost_date").on(table.date),
]);

// Relations
export const timeClockEntriesRelations = relations(timeClockEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeClockEntries.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [timeClockEntries.approvedBy],
    references: [users.id],
  }),
}));

export const teamClockEntriesRelations = relations(teamClockEntries, ({ one, many }) => ({
  supervisor: one(users, {
    fields: [teamClockEntries.supervisorId],
    references: [users.id],
  }),
  memberDetails: many(teamMemberClockDetails),
}));

export const teamMemberClockDetailsRelations = relations(teamMemberClockDetails, ({ one }) => ({
  teamEntry: one(teamClockEntries, {
    fields: [teamMemberClockDetails.teamClockEntryId],
    references: [teamClockEntries.id],
  }),
  user: one(users, {
    fields: [teamMemberClockDetails.userId],
    references: [users.id],
  }),
}));

// Type exports
export type TimeClockEntry = typeof timeClockEntries.$inferSelect;
export type InsertTimeClockEntry = typeof timeClockEntries.$inferInsert;
export type TeamClockEntry = typeof teamClockEntries.$inferSelect;
export type InsertTeamClockEntry = typeof teamClockEntries.$inferInsert;
export type TeamMemberClockDetail = typeof teamMemberClockDetails.$inferSelect;
export type InsertTeamMemberClockDetail = typeof teamMemberClockDetails.$inferInsert;
export type LaborCostSummary = typeof laborCostSummary.$inferSelect;

// Zod schemas for validation
export const insertTimeClockEntrySchema = createInsertSchema(timeClockEntries)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertTeamClockEntrySchema = createInsertSchema(teamClockEntries)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertTeamMemberClockDetailSchema = createInsertSchema(teamMemberClockDetails)
  .omit({ id: true });

// Validation types
export type InsertTimeClockEntryInput = z.infer<typeof insertTimeClockEntrySchema>;
export type InsertTeamClockEntryInput = z.infer<typeof insertTeamClockEntrySchema>;
export type InsertTeamMemberClockDetailInput = z.infer<typeof insertTeamMemberClockDetailSchema>;