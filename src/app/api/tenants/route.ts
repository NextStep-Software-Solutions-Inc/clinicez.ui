import { createTenantAction, getTenantsAction } from "@actions/tenant.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()


export const POST = withJwtAuth(async (req: NextRequest) => {
  const body = await req.json();

  // const newTenant = createTenantSchema.parse(body);

  // const tenant = await createTenantAction({
  //   ...newTenant,
  //   ownerId: newTenant.ownerId ?? 0
  // });

  return  NextResponse.json({
    success: true,
    response: {}
  }, response);
})


export const GET = withJwtAuth(async (req: NextRequest) => {

  const tenants = await getTenantsAction();

  return NextResponse.json({
    success: true,
    response: tenants
  }, response);
});