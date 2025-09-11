"use server";

import { parseObject } from "@/lib/utils";
import { createOrganizationAction, getOrganizationsAction } from "@actions/organizations/organization.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


const createOrganizationSchema = z.object({
  orgUid: z.string({
    required_error: "Organization ID is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }),
  description: z.string(),
  tenantUid: z.string({
    required_error: "Tenant ID is required",
  }),
  email: z.string({
    required_error: "Email is required",
  }),
})

export const POST = withClerkAuth(async (req: NextRequest) => {

  const body = await req.json();
  const newOrganization = createOrganizationSchema.parse(body);
  const organization = await createOrganizationAction(newOrganization)

  return NextResponse.json(organization, {status: 201});
});

export const GET = withClerkAuth(async (req: NextRequest) => {

  const searchParams = new URLSearchParams(req.nextUrl.searchParams);
  const filters = parseObject(Object.fromEntries(searchParams.entries()));
  const organizations = await getOrganizationsAction(filters);
  return NextResponse.json(organizations, {status: 200});
});
  