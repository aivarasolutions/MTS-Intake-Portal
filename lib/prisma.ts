import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Clean up environment variables - force them to be strings or undefined
  // This prevents the "string argument must be of type string" error
  if (typeof process.env.PGHOST === 'object') delete process.env.PGHOST;
  if (typeof process.env.PGPORT === 'object') delete process.env.PGPORT;
  if (typeof process.env.PGUSER === 'object') delete process.env.PGUSER;
  if (typeof process.env.PGPASSWORD === 'object') delete process.env.PGPASSWORD;
  if (typeof process.env.PGDATABASE === 'object') delete process.env.PGDATABASE;
  
  // Ensure DATABASE_URL is a string
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('DATABASE_URL environment variable is not set or is not a string');
  }
  
  // For Neon databases, we need to add SSL mode
  let finalConnectionString = connectionString;
  if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
    finalConnectionString = connectionString + (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  
  // Create pool with ONLY connectionString to avoid env var type issues
  // Explicitly set individual connection params to undefined to prevent
  // the pg library from reading PGHOST, PGPORT, etc. from environment
  const pool = new Pool({
    connectionString: finalConnectionString,
    host: undefined,
    port: undefined,
    user: undefined,
    password: undefined,
    database: undefined,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
