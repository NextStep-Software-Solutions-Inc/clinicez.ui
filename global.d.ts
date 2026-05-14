import { createPrismaClient } from '@lib/factory/prisma';

declare global {
  var prismaClient: ReturnType<typeof createPrismaClient>;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

export default global
