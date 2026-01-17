import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  // Prefer constructing from individual PG env vars for reliability
  if (process.env.PGHOST && process.env.PGDATABASE) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || "5432";
    const user = process.env.PGUSER || "postgres";
    const password = process.env.PGPASSWORD || "password";
    const database = process.env.PGDATABASE;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  // Fallback to DATABASE_URL
  return process.env.DATABASE_URL || "";
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
