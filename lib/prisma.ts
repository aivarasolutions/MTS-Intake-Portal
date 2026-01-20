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
  // Validate DATABASE_URL
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('❌ DATABASE_URL environment variable is not set');
  }
  
  if (typeof connectionString !== 'string') {
    throw new Error(`❌ DATABASE_URL must be a string, got ${typeof connectionString}`);
  }
  
  console.log('✓ DATABASE_URL is valid');
  console.log('✓ Creating Prisma client with direct connection');
  
  // Create Prisma client - Prisma 5.x handles the connection automatically
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  
  // Test the connection
  client.$connect()
    .then(() => {
      console.log('✅ Successfully connected to database!');
    })
    .catch((err) => {
      console.error('❌ Failed to connect to database:', err.message);
      console.error('Connection error details:', err);
    });
  
  console.log('✓ Prisma client created successfully');
  
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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
