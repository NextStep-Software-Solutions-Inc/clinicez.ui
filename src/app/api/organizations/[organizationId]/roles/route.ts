import { getOrganizationRolesAction } from "@actions/organizations/organization-role.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');
  const organizationRoles = await getOrganizationRolesAction({orgId: organizationId, userId});
  return NextResponse.json(organizationRoles, {status: 200});
});
    