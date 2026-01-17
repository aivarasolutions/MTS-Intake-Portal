import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  const isProduction = process.env.NODE_ENV === "production";
  
  // In production, always prefer DATABASE_URL as it has the correct external hostname
  if (isProduction && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`[DB] Production: Using DATABASE_URL -> ${url.host}${url.pathname}`);
    } catch {
      console.log(`[DB] Production: Using DATABASE_URL`);
    }
    return process.env.DATABASE_URL;
  }
  
  // In development, prefer constructing from individual PG env vars
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || "5432";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || "password";
  const database = process.env.PGDATABASE;

  if (host && database) {
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    console.log(`[DB] Development: Connecting to PostgreSQL at ${host}:${port}/${database}`);
    return connectionString;
  }

  // Final fallback to DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      console.log(`[DB] Fallback: Using DATABASE_URL -> ${url.host}${url.pathname}`);
    } catch {
      console.log(`[DB] Fallback: Using DATABASE_URL`);
    }
    return dbUrl;
  }

  console.error("[DB] ERROR: No database connection configured!");
  throw new Error("Database connection not configured. Please set DATABASE_URL.");
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
