import { createTenantAction, getTenantsAction } from "@actions/tenant.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { Prisma } from "@prisma/common/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()

const createTenantSchema = z.object({
  tenantId: z.string({
    required_error: "Tenant ID is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }),
  ownerId: z.number().optional().nullable(),
})


export const POST = withJwtAuth(async (req: NextRequest) => {
  const body = await req.json();

  const newTenant = createTenantSchema.parse(body);

  const tenant = await createTenantAction({
    ...newTenant,
    ownerId: newTenant.ownerId ?? 0
  });

  return  NextResponse.json({
    success: true,
    response: tenant
  }, response);
})


export const GET = withJwtAuth(async (req: NextRequest) => {

  const tenants = await getTenantsAction();

  return NextResponse.json({
    success: true,
    response: tenants
  }, response);
});