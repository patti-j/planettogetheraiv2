import { pgTable, text, serial, integer, timestamp, jsonb, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PT Import Schema - For importing data from Planet Together APS system
// All PT import tables have been removed