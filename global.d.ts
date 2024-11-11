import { createPrismaCommonClient, createPrismaTenantClient } from '@lib/factory/prisma';
declare global {
  var prismaCommon: ReturnType<typeof createPrismaCommonClient>;
  var prismaTenant: ReturnType<typeof createPrismaTenantClient>;
}

export default global