"use server";

import { createOrganizationAction, getOrganizationsAction } from "@actions/organizations/organization.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const createOrganizationSchema = z.object({
  orgUid: z.string({
    required_error: "Organization ID is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }),
  email: z.string({
    required_error: "Name is required",
  }),
  description: z.string(),
  tenantUid: z.string({
    required_error: "Tenant ID is required",
  }),
})

export const POST = withJwtAuth(async (req: NextRequest) => {

  const body = await req.json();
  const newOrganization = createOrganizationSchema.parse(body);
  const organization = await createOrganizationAction(newOrganization)

  return NextResponse.json(organization, {status: 201});
});

export const GET = withJwtAuth(async (req: NextRequest) => {

  const organizations = await getOrganizationsAction();
  return NextResponse.json(organizations, {status: 200});
});
  