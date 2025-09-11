import { getClinicRolesAction } from "@/actions/clinics/clinic-role.action";
import { parseObject } from "@/lib/utils";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{}>
}) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const clinicRoles = await getClinicRolesAction(filters);
  return NextResponse.json(clinicRoles, {status: 200});
});
    