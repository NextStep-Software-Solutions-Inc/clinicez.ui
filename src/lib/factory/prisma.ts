import { PrismaClient } from "@prisma/client";

export const createPrismaClient = (): PrismaClient => {
  // In Prisma 7, we simply instantiate the client
  // The connection is configured via environment variables
  return new PrismaClient({
    // ...process.env.NODE_ENV !== 'production' ? {log: ['query', 'info', 'warn'],}:{},
  })
};

