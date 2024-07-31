import { PrismaClient as PrismaCommonClient } from "@prisma/common/client";
import { PrismaClient as PrismaTenantClient } from "@prisma/tenant/client";

export const createPrismaCommonClient = (databaseUrl: string): PrismaCommonClient => {
  return new PrismaCommonClient({
    datasources: {
      db: {
        url: databaseUrl,
      }
    }
  })
};

export const createPrismaTenantClient = (databaseUrl: string): PrismaTenantClient => {
  return new PrismaTenantClient({
    datasources: {
      db: {
        url: databaseUrl,
      }
    }
  })
};