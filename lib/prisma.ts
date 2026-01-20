import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// CRITICAL: Remove any PG* environment variables that are objects (Replit bug)
const pgVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
pgVars.forEach(varName => {
  const value = process.env[varName];
  if (value !== undefined && typeof value !== 'string') {
    console.warn(`⚠️  Removing invalid ${varName} (type: ${typeof value})`);
    delete process.env[varName];
  }
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Get DATABASE_URL and validate it's a string
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  if (typeof connectionString !== 'string') {
    throw new Error(`DATABASE_URL must be a string, got ${typeof connectionString}`);
  }
  
  // Remove channel_binding parameter if present (can cause connection issues)
  connectionString = connectionString
    .replace('&channel_binding=require', '')
    .replace('?channel_binding=require&', '?')
    .replace('?channel_binding=require', '');
  
  // Ensure sslmode=require is present for Neon
  if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
    connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  
  console.log('✓ Database connection string validated');
  
  // Parse URL to extract connection parameters
  const url = new URL(connectionString);
  
  // Create pool with ONLY explicit parameters
  // This completely bypasses pg's environment variable reading
  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1), // Remove leading slash
    ssl: url.searchParams.get('sslmode') === 'require' 
      ? { rejectUnauthorized: false } 
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // CRITICAL: Set these to undefined to prevent env var pollution
    connectionString: undefined,
  });
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle database client:', err.message);
  });
  
  // Create Prisma adapter and client
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  
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
