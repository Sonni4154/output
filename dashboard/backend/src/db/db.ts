import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as qbSchema from './schema.js';
import * as calendarSchema from './calendar-schema.js';

// Resolve correct .env path (works in dist/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

// Debug: log env path to verify it's correct
console.log("🧩 Loading .env from:", envPath);
config({ path: envPath });

// Check if DATABASE_URL is loaded
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "found" : "missing");

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL environment variable is required');
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Combine all schemas
const schema = {
  ...qbSchema,
  ...calendarSchema,
};

// Create Drizzle instance with combined schema
export const db = drizzle(sql, { schema });

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Export all schemas
export * from './schema.js';
export * from './calendar-schema.js';

