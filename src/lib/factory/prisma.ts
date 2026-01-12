import { PrismaClient } from "@prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const createPrismaClient = (): PrismaClient => {
  // In Prisma 7, when not using URL in schema, we need an adapter
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    // ...process.env.NODE_ENV !== 'production' ? {log: ['query', 'info', 'warn'],}:{},
    adapter,
  })
};

