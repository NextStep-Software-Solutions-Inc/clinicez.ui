import { PrismaClient as PrismaCommonClient } from "@prisma/generated/common-client";

export const createPrismaCommonClient = (databaseUrl: string): PrismaCommonClient => {
  return new PrismaCommonClient({
    datasources: {
      db: {
        url: databaseUrl,
      }
    }
  })
};