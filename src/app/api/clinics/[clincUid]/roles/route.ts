import { getClinicRolesAction } from "@actions/organizations/clinic-role.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string;
  }
}) => {
  const clinicUid = params.clinicUid;
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId');
  const organizationRoles = await getClinicRolesAction({clinicUid, userId: userId ?? undefined});
  return NextResponse.json(organizationRoles, {status: 200});
});
    