import { createPrismaClient } from '@lib/factory/prisma';

let prismaClient: ReturnType<typeof createPrismaClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaClient) {
    global.prismaClient = createPrismaClient();
  }
  prismaClient = global.prismaClient;
} else {
  prismaClient = createPrismaClient();
}

export default prismaClient;