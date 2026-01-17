import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  // Always use DATABASE_URL - it's managed by Replit and works in both dev and production
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      console.log(`[DB] Connecting via DATABASE_URL -> ${url.host}${url.pathname}`);
    } catch {
      console.log(`[DB] Connecting via DATABASE_URL`);
    }
    return dbUrl;
  }

  console.error("[DB] ERROR: DATABASE_URL not configured!");
  throw new Error("Database connection not configured. DATABASE_URL is required.");
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
