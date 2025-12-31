import { PrismaClient } from "@prisma/client";

export const createPrismaClient = (databaseUrl: string): PrismaClient => {
  return new PrismaClient({
    // ...process.env.NODE_ENV !== 'production' ? {log: ['query', 'info', 'warn'],}:{},
    datasources: {
      db: {
        url: databaseUrl,
      }
    }
  })
};


