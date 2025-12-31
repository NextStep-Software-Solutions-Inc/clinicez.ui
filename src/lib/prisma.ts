import { createPrismaClient } from '@lib/factory/prisma';

let prismaClient: ReturnType<typeof createPrismaClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaClient) {
    global.prismaClient = createPrismaClient(process.env.DATABASE_URL_UNPOOLED || "postgresql://dummy:dummy@localhost:5432/dummy");
  }
  prismaClient = global.prismaClient;
} else {
  prismaClient = createPrismaClient(process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy");
}

export default prismaClient;