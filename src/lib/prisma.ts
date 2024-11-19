import { createPrismaClient } from '@lib/factory/prisma';

let prismaClient: ReturnType<typeof createPrismaClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaClient) {
    global.prismaClient = createPrismaClient(process.env.DATABASE_URL_UNPOOLED!);
  }
  prismaClient = global.prismaClient;
} else {
  prismaClient = createPrismaClient(process.env.DATABASE_URL!);
}

export default prismaClient;