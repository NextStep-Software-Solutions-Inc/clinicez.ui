import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
import { parseObject } from "@/lib/utils";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const resolvedParams = await params;
  const clinicUid = resolvedParams.clinicUid;
  const searchParams = new URLSearchParams(req.nextUrl.searchParams);

  const filters = parseObject(Object.fromEntries(searchParams.entries()));

  const clinicMembers = await getClinicPatientsAction({clinicUid, ...filters});
  return NextResponse.json(clinicMembers, {status: 200});
});