import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  // Always prefer constructing from individual PG env vars for reliability
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || "5432";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || "password";
  const database = process.env.PGDATABASE;

  if (host && database) {
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    console.log(`[DB] Connecting to PostgreSQL at ${host}:${port}/${database}`);
    return connectionString;
  }

  // Fallback to DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // Extract host from URL for logging (hide password)
    try {
      const url = new URL(dbUrl);
      console.log(`[DB] Using DATABASE_URL: ${url.host}${url.pathname}`);
    } catch {
      console.log(`[DB] Using DATABASE_URL (could not parse for logging)`);
    }
    return dbUrl;
  }

  console.error("[DB] ERROR: No database connection configured!");
  throw new Error("Database connection not configured. Please set PGHOST/PGDATABASE or DATABASE_URL.");
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
