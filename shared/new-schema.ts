import { pgTable, serial, text, jsonb, timestamp, boolean, integer, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Clean Widget System - New Implementation
// This replaces the complex unified_widgets, cockpit_widgets, canvas_widgets system

// Main widget table - simplified and clean
export const widgets = pgTable("widgets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // chart, metric, table, list, gauge, progress, alert, map, timeline
  
  // Platform targeting
  targetPlatform: text("target_platform").notNull().default("both"), // mobile, desktop, both
  
  // Data configuration
  dataSource: text("data_source").notNull(), // production_orders, operations, resources, metrics, inventory, quality
  dataQuery: jsonb("data_query").$type<{
    filters?: Record<string, any>;
    groupBy?: string;
    orderBy?: { field: string; direction: "asc" | "desc" };
    limit?: number;
    aggregation?: "count" | "sum" | "avg" | "min" | "max";
    dateRange?: { field: string; from?: string; to?: string };
  }>().default({}),
  
  // Visual configuration
  visualization: jsonb("visualization").$type<{
    chartType?: "bar" | "line" | "pie" | "doughnut" | "area" | "scatter";
    colors?: string[];
    thresholds?: Array<{ value: number; color: string; label?: string }>;
    displayFormat?: "number" | "percentage" | "currency" | "duration";
    showLabels?: boolean;
    showLegend?: boolean;
    orientation?: "horizontal" | "vertical";
  }>().default({}),
  
  // Layout and positioning
  layout: jsonb("layout").$type<{
    width: number;
    height: number;
    x?: number;
    y?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }>().notNull(),
  
  // Behavior settings
  settings: jsonb("settings").$type<{
    refreshInterval?: number; // seconds
    autoRefresh?: boolean;
    clickAction?: {
      type: "drill_down" | "navigate" | "modal" | "none";
      target?: string;
      params?: Record<string, any>;
    };
    alerts?: Array<{
      condition: { field: string; operator: string; value: any };
      message: string;
      severity: "info" | "warning" | "error" | "critical";
    }>;
  }>().default({}),
  
  // Metadata
  description: text("description"),
  category: text("category"), // production, quality, inventory, maintenance, analytics
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Ownership and sharing
  createdBy: integer("created_by").notNull().default(1), // user ID
  isShared: boolean("is_shared").default(false),
  isTemplate: boolean("is_template").default(false),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("widgets_type_idx").on(table.type),
  platformIdx: index("widgets_platform_idx").on(table.targetPlatform),
  categoryIdx: index("widgets_category_idx").on(table.category),
  createdByIdx: index("widgets_created_by_idx").on(table.createdBy),
  activeIdx: index("widgets_active_idx").on(table.isActive),
}));

// Dashboard table - collections of widgets
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Platform targeting
  targetPlatform: text("target_platform").notNull().default("both"), // mobile, desktop, both
  
  // Layout configuration
  layout: jsonb("layout").$type<{
    type: "grid" | "free" | "responsive";
    columns?: number;
    rowHeight?: number;
    margin?: [number, number];
    padding?: [number, number];
    breakpoints?: Record<string, { cols: number; margin: [number, number] }>;
  }>().notNull(),
  
  // Widget placements
  configuration: jsonb("configuration").$type<{
    widgets: Array<{
      widgetId: number;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      minH?: number;
      maxW?: number;
      maxH?: number;
      static?: boolean;
      customConfig?: Record<string, any>;
    }>;
  }>().default({ widgets: [] }),
  
  // Theme and appearance
  theme: jsonb("theme").$type<{
    name: string;
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      surface?: string;
      text?: string;
      border?: string;
    };
    typography?: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
    };
  }>().default({ name: "default" }),
  
  // Metadata
  category: text("category"), // operational, executive, maintenance, quality
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Ownership and sharing
  createdBy: integer("created_by").notNull().default(1),
  isShared: boolean("is_shared").default(false),
  isTemplate: boolean("is_template").default(false),
  isDefault: boolean("is_default").default(false),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  platformIdx: index("dashboards_platform_idx").on(table.targetPlatform),
  categoryIdx: index("dashboards_category_idx").on(table.category),
  createdByIdx: index("dashboards_created_by_idx").on(table.createdBy),
  activeIdx: index("dashboards_active_idx").on(table.isActive),
  defaultIdx: index("dashboards_default_idx").on(table.isDefault),
}));

// Insert schemas
export const insertWidgetSchema = createInsertSchema(widgets, {
  title: z.string().min(1, "Title is required"),
  type: z.enum(["chart", "metric", "table", "list", "gauge", "progress", "alert", "map", "timeline"]),
  targetPlatform: z.enum(["mobile", "desktop", "both"]),
  dataSource: z.string().min(1, "Data source is required"),
  layout: z.object({
    width: z.number().min(100),
    height: z.number().min(50),
    x: z.number().optional(),
    y: z.number().optional(),
  }),
});

export const insertDashboardSchema = createInsertSchema(dashboards, {
  title: z.string().min(1, "Title is required"),
  targetPlatform: z.enum(["mobile", "desktop", "both"]),
  layout: z.object({
    type: z.enum(["grid", "free", "responsive"]),
    columns: z.number().optional(),
    rowHeight: z.number().optional(),
  }),
});

// Types
export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;