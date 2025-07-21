import { parseObject } from "@/lib/utils";
import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
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
    