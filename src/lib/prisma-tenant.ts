import { createPrismaTenantClient } from './factory/prisma';

let prismaTenant: ReturnType<typeof createPrismaTenantClient>;

if (process.env.NODE_ENV === 'production') {
  prismaTenant = createPrismaTenantClient(process.env.TENANT_DATABASE_URL!);
} else {
  if (!global.prismaTenant) {
    global.prismaTenant = createPrismaTenantClient(process.env.TENANT_DATABASE_URL!);
  }
  prismaTenant = global.prismaTenant;
}

export default prismaTenant;