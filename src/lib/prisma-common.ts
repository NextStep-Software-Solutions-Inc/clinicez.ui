import { createPrismaCommonClient } from './factory/prisma';

let prismaCommon: ReturnType<typeof createPrismaCommonClient>;

if (process.env.NODE_ENV === 'production') {
  prismaCommon = createPrismaCommonClient(process.env.COMMON_DATABASE_URL!);
} else {
  if (!global.prismaCommon) {
    global.prismaCommon = createPrismaCommonClient(process.env.COMMON_DATABASE_URL_UNPOOLED!);
  }
  prismaCommon = global.prismaCommon;
}

export default prismaCommon;