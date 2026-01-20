import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// CRITICAL: Log all PG* environment variables for debugging
console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const hostMatch = dbUrl.match(/@([^:/]+)/);
  console.log('DATABASE_URL host:', hostMatch ? hostMatch[1] : 'NOT FOUND');
}

const pgVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
pgVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`, value !== undefined ? `${typeof value} - ${String(value).substring(0, 20)}...` : 'undefined');
  
  // Delete ANY PG* variable regardless of type
  if (value !== undefined) {
    console.log(`🗑️  Deleting ${varName} to prevent conflicts`);
    delete process.env[varName];
  }
});
console.log('=================================');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Get DATABASE_URL and validate it's a string
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('❌ DATABASE_URL environment variable is not set');
  }
  
  if (typeof connectionString !== 'string') {
    throw new Error(`❌ DATABASE_URL must be a string, got ${typeof connectionString}`);
  }
  
  console.log('✓ DATABASE_URL is a valid string');
  
  // Remove channel_binding parameter if present (can cause connection issues)
  connectionString = connectionString
    .replace('&channel_binding=require', '')
    .replace('?channel_binding=require&', '?')
    .replace('?channel_binding=require', '');
  
  // Ensure sslmode=require is present for Neon
  if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
    connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  
  // Parse URL to extract connection parameters
  const url = new URL(connectionString);
  
  console.log('✓ Parsed connection details:');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port || '5432');
  console.log('  Database:', url.pathname.slice(1));
  console.log('  SSL:', url.searchParams.get('sslmode'));
  
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
    // CRITICAL: Do NOT pass connectionString to prevent env var reading
  });
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle database client:', err.message);
    console.error('Error details:', err);
  });
  
  // Test the connection immediately
  pool.connect()
    .then(client => {
      console.log('✅ Successfully connected to database!');
      client.release();
    })
    .catch(err => {
      console.error('❌ Failed to connect to database:', err.message);
      console.error('Connection error details:', err);
    });
  
  // Create Prisma adapter and client
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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
