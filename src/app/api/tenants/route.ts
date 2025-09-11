import { createTenantAction, getTenantsAction } from "@actions/tenant.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()


export const POST = withClerkAuth(async (req: NextRequest) => {
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


export const GET = withClerkAuth(async (req: NextRequest) => {

  const tenants = await getTenantsAction();

  return NextResponse.json({
    success: true,
    response: tenants
  }, response);
});