import { PrismaClient } from '@prisma/generated/common-client';

let prismaCommon: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaCommon = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prismaCommon = global.prisma;
}

export default prismaCommon;