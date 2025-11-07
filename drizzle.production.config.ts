import { defineConfig } from "drizzle-kit";

if (!process.env.PRODUCTION_DATABASE_URL) {
  throw new Error("PRODUCTION_DATABASE_URL is not set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  strict: false,  // Disables confirmation prompts
  verbose: true,  // Shows all SQL statements
  dbCredentials: {
    url: process.env.PRODUCTION_DATABASE_URL,
  },
});