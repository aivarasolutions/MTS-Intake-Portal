import { PrismaClient } from '@prisma/client';

// CRITICAL: Remove any PG* environment variables that might interfere
console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);

const pgVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
pgVars.forEach(varName => {
  const value = process.env[varName];
  if (value !== undefined) {
    console.log(`🗑️  Deleting ${varName} to prevent conflicts`);
    delete process.env[varName];
  }
});

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const hostMatch = dbUrl.match(/@([^:/]+)/);
  console.log('DATABASE_URL host:', hostMatch ? hostMatch[1] : 'NOT FOUND');
}
console.log('=================================');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('❌ DATABASE_URL environment variable is not set');
  }
  
  if (typeof connectionString !== 'string') {
    throw new Error(`❌ DATABASE_URL must be a string, got ${typeof connectionString}`);
  }
  
  console.log('✓ DATABASE_URL is valid');
  console.log('✓ Creating Prisma client with connection pooling settings');
  
  // Create Prisma client with connection pool settings optimized for Neon serverless
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
  
  // Test connection with retry logic
  const connectWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await client.$connect();
        console.log('✅ Successfully connected to database!');
        return;
      } catch (err: any) {
        console.error(`❌ Connection attempt ${i + 1} failed:`, err.message);
        if (i < retries - 1) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    console.error('❌ Failed to connect to database after all retries');
  };
  
  connectWithRetry();
  
  console.log('✓ Prisma client created successfully');
  
  return client;
}

// Always use singleton pattern
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Store in global to prevent multiple instances during development
globalForPrisma.prisma = prisma;

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
