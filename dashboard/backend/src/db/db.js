import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

// Resolve correct .env path (works in dist/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "/opt/dashboard/backend/.env");

// Debug: log env path to verify it's correct
console.log("🧩 Loading .env from:", envPath);
config({ path: envPath });

// Check if DATABASE_URL is loaded
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "found" : "missing");

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL environment variable is required");
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

// Database health check
export async function checkDatabaseConnection() {
  try {
    await sql`SELECT 1`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

export * from "./schema.js";

