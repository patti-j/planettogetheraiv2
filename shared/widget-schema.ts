import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple, clean widget schema
export const widgets = pgTable("widgets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // chart, metric, table, etc.
  description: text("description"),
  configuration: jsonb("configuration").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  targetPlatform: text("target_platform").default("both"), // mobile, desktop, both
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard schema
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  configuration: jsonb("configuration").$type<{
    layout?: string;
    widgets?: string[];
    [key: string]: any;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  targetPlatform: text("target_platform").default("both"), // mobile, desktop, both
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertWidgetSchema = createInsertSchema(widgets, {
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  configuration: z.record(z.any()).optional(),
});

export const insertDashboardSchema = createInsertSchema(dashboards, {
  title: z.string().min(1, "Title is required"),
  configuration: z.object({
    layout: z.string().optional(),
    widgets: z.array(z.string()).optional(),
  }).catchall(z.any()).optional(),
});

// Types
export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;