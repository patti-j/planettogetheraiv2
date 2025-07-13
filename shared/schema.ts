import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  capabilities: jsonb("capabilities").$type<number[]>().default([]),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  customer: text("customer").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("planned"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  duration: integer("duration").notNull(), // in hours
  requiredCapabilities: jsonb("required_capabilities").$type<number[]>().default([]),
  assignedResourceId: integer("assigned_resource_id").references(() => resources.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  order: integer("order").notNull().default(0),
});

export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  fromOperationId: integer("from_operation_id").references(() => operations.id).notNull(),
  toOperationId: integer("to_operation_id").references(() => operations.id).notNull(),
});

export const resourceViews = pgTable("resource_views", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  resourceSequence: jsonb("resource_sequence").$type<number[]>().notNull(),
  isDefault: boolean("is_default").default(false),
  colorScheme: text("color_scheme").notNull().default("by_job"),
  textLabeling: text("text_labeling").notNull().default("operation_name"),
  textLabelConfig: jsonb("text_label_config").$type<{
    labels: Array<{
      type: "operation_name" | "job_name" | "due_date" | "priority" | "status" | "duration" | "progress" | "resource_name" | "customer";
      enabled: boolean;
      order: number;
    }>;
    fontSize: number;
    fontColor: string;
  }>().default(sql`'{"labels": [{"type": "operation_name", "enabled": true, "order": 0}], "fontSize": 12, "fontColor": "#ffffff"}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export const insertOperationSchema = createInsertSchema(operations).omit({
  id: true,
}).extend({
  startTime: z.union([z.string().datetime(), z.date()]).optional(),
  endTime: z.union([z.string().datetime(), z.date()]).optional(),
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
});

export const insertResourceViewSchema = createInsertSchema(resourceViews).omit({
  id: true,
  createdAt: true,
});

export type InsertCapability = z.infer<typeof insertCapabilitySchema>;
export type Capability = typeof capabilities.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type Operation = typeof operations.$inferSelect;

export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type Dependency = typeof dependencies.$inferSelect;

export type InsertResourceView = z.infer<typeof insertResourceViewSchema>;
export type ResourceView = typeof resourceViews.$inferSelect;
