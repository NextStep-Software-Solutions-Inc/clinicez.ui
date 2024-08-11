import { createPrismaCommonClient } from '@lib/factory/prisma';

let prismaCommon: ReturnType<typeof createPrismaCommonClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaCommon) {
    global.prismaCommon = createPrismaCommonClient(process.env.COMMON_DATABASE_URL_UNPOOLED!);
  }
  prismaCommon = global.prismaCommon;
} else {
  prismaCommon = createPrismaCommonClient(process.env.COMMON_DATABASE_URL!);
}

export default prismaCommon;