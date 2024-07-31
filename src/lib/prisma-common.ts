import { createPrismaCommonClient } from './factory/prisma';

let prismaCommon: ReturnType<typeof createPrismaCommonClient>;

if (process.env.NODE_ENV === 'production') {
  prismaCommon = createPrismaCommonClient(process.env.POSTGRES_PRISMA_URL!);
} else {
  if (!global.prismaCommon) {
    global.prismaCommon = createPrismaCommonClient(process.env.POSTGRES_PRISMA_URL!);
  }
  prismaCommon = global.prismaCommon;
}

export default prismaCommon;