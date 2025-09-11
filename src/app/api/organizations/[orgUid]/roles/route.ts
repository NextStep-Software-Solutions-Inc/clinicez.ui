import { parseObject } from "@/lib/utils";
import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    orgUid: string;
  }>
}) => {
  const {orgUid} = await params;
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()));

  const organizationRoles = await getOrganizationRolesAction({...filters, orgUid: orgUid});
  return NextResponse.json(organizationRoles, {status: 200});
});
    