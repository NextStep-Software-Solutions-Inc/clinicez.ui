import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const createPrismaClient = (): PrismaClient => {
  // In Prisma 7, when not using URL in schema, we need an adapter
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
  const pool = new Pool({
    connectionString: databaseUrl,
    // Increased pool size to handle concurrent permission checks and transactions
    max: 20, // Maximum number of connections in the pool
    min: 5, // Minimum number of connections to maintain
    // Connection timeout and idle timeout settings
    connectionTimeoutMillis: 10000, // Wait up to 10 seconds for a connection
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    ...process.env.NODE_ENV !== 'production' ? { log: ['query', 'info', 'warn'], } : {},
    adapter,
  })
};

