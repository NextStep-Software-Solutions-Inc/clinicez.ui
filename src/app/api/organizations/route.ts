import { createOrganizationAction, getOrganizationsAction } from "@actions/organization.action";
import { de } from "@faker-js/faker";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()

const createOrganizationSchema = z.object({
  orgId: z.string({
    required_error: "Organization ID is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }),
  description: z.string().optional().nullable(),
  tenantId: z.number({
    required_error: "Tenant ID is required",
  }),
})

export const POST = withJwtAuth(async (req: NextRequest) => {

  const body = await req.json();
  const newOrganization = createOrganizationSchema.parse(body);
  const organization = await createOrganizationAction(newOrganization)

  return NextResponse.json({
    success: true,
    response: organization
  }, response);
});

export const GET = withJwtAuth(async (req: NextRequest) => {

  const organizations = await getOrganizationsAction();
  return NextResponse.json({
    success: true,
    response: organizations
  }, response);
});
  