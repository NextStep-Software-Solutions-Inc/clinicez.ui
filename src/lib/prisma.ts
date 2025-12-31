import { createPrismaClient } from '@lib/factory/prisma';

let prismaClient: ReturnType<typeof createPrismaClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaClient) {
    // Set environment variables before creating client
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || "postgresql://dummy:dummy@localhost:5432/dummy";
    }
    global.prismaClient = createPrismaClient();
  }
  prismaClient = global.prismaClient;
} else {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
  }
  prismaClient = createPrismaClient();
}

export default prismaClient;