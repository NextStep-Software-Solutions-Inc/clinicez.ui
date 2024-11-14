import { getClinicRolesAction } from "@/actions/clinics/clinic-role.action";
import { parseObject } from "@/lib/utils";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string;
  }
}) => {
  const clinicUid = params.clinicUid;
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const organizationRoles = await getClinicRolesAction({clinicUid, ...filters});
  return NextResponse.json(organizationRoles, {status: 200});
});
    