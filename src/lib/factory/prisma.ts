import { PrismaClient } from "@prisma/client";

export const createPrismaClient = (): PrismaClient => {
  // In Prisma 7, the connection URL is configured via prisma.config.ts
  // and read from environment variables
  return new PrismaClient({
    // ...process.env.NODE_ENV !== 'production' ? {log: ['query', 'info', 'warn'],}:{},
  })
};

