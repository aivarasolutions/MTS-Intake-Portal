import path from "node:path";
import { defineConfig } from "prisma/config";

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

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: getConnectionString(),
      });
      return new PrismaPg(pool);
    },
  },
  datasource: {
    url: getConnectionString(),
  },
});
