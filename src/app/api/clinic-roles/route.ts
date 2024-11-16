import { getClinicRolesAction } from "@/actions/clinics/clinic-role.action";
import { parseObject } from "@/lib/utils";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
  }
}) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const clinicRoles = await getClinicRolesAction(filters);
  return NextResponse.json(clinicRoles, {status: 200});
});
    