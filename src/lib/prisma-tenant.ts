import { createPrismaTenantClient } from '@lib/factory/prisma';

let prismaTenant: ReturnType<typeof createPrismaTenantClient>;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prismaTenant) {
    global.prismaTenant = createPrismaTenantClient(process.env.TENANT_DATABASE_URL!);
  }
  prismaTenant = global.prismaTenant;
} else {
  prismaTenant = createPrismaTenantClient(process.env.TENANT_DATABASE_URL!);
}
export default prismaTenant;