import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
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
  
  const pool = new Pool({
    connectionString: finalConnectionString,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
