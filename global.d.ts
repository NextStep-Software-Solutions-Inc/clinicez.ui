import { createPrismaClient } from '@lib/factory/prisma';
declare global {
  var prismaClient: ReturnType<typeof createPrismaClient>;
}

export default global