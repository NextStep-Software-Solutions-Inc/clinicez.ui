import { getOrganizationRolesAction } from "@actions/organization.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;
  const organizationRoles = await getOrganizationRolesAction({orgId: organizationId});
  return NextResponse.json(organizationRoles, {status: 200});
});
    