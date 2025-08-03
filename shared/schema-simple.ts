import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic tables without circular dependencies
export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  location: text("location"),
});

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
  capabilities: jsonb("capabilities").$type<number[]>(),
  photo: text("photo"),
  isDrum: boolean("is_drum").default(false),
  drumDesignationDate: timestamp("drum_designation_date"),
  drumDesignationReason: text("drum_designation_reason"),
  drumDesignationMethod: text("drum_designation_method"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("released"),
  priority: text("priority").notNull().default("medium"),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas - simplified to avoid type errors
export const insertPlantSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  location: z.string().optional(),
});

export const insertCapabilitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const insertResourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  status: z.string().optional(),
  capabilities: z.array(z.number()).optional(),
  photo: z.string().optional(),
  isDrum: z.boolean().optional(),
  drumDesignationDate: z.date().optional(),
  drumDesignationReason: z.string().optional(),
  drumDesignationMethod: z.string().optional(),
});

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  passwordHash: z.string(),
  isActive: z.boolean().optional(),
  lastLogin: z.date().optional(),
  avatar: z.string().optional(),
});

export const insertProductionOrderSchema = z.object({
  orderNumber: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  plantId: z.number(),
});

// Types
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

export type Capability = typeof capabilities.$inferSelect;
export type InsertCapability = z.infer<typeof insertCapabilitySchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;