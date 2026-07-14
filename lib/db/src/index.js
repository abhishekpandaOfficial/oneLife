import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
const isLocal = !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1");
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
    // Strip any sslmode query params so pg-connection-string doesn't override Pool constructor options
    connectionString = connectionString.replace(/[\?&]sslmode=[^&]*/g, "");
}
export const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });
export * from "./schema";
