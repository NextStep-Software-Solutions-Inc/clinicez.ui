import { createPrismaCommonClient } from './factory/prisma';

let prismaCommon: ReturnType<typeof createPrismaCommonClient>;

if (process.env.NODE_ENV === 'production') {
  prismaCommon = createPrismaCommonClient(process.env.DATABASE_URL!);
} else {
  if (!global.prisma) {
    global.prisma = createPrismaCommonClient(process.env.DATABASE_URL!);
  }
  prismaCommon = global.prisma;
}

export default prismaCommon;