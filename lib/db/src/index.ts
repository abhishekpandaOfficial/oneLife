import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const rawConnectionString = process.env.DATABASE_URL;

// Honor the connection string's own sslmode (Replit's managed Postgres sets
// sslmode=disable since it doesn't support SSL; external providers like
// Neon/Supabase typically set sslmode=require). Fall back to disabling SSL
// for localhost/127.0.0.1 and enabling it otherwise when no sslmode is given.
const sslModeMatch = rawConnectionString?.match(/[\?&]sslmode=([^&]*)/i);
const sslMode = sslModeMatch?.[1]?.toLowerCase();

const isLocalHost =
  !rawConnectionString ||
  rawConnectionString.includes("localhost") ||
  rawConnectionString.includes("127.0.0.1");

const useSsl =
  sslMode === "disable"
    ? false
    : sslMode === "require" || sslMode === "verify-full" || sslMode === "verify-ca"
      ? true
      : !isLocalHost;

// Strip sslmode query params so pg-connection-string doesn't override the
// Pool constructor's own `ssl` option below.
const connectionString = rawConnectionString?.replace(/[\?&]sslmode=[^&]*/g, "");

export const pool = new Pool({ 
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });

export * from "./schema";
