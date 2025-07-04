import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { parseObject } from "@/lib/utils";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;
  const searchParams = new URLSearchParams(req.nextUrl.searchParams);

  const filters = parseObject(Object.fromEntries(searchParams.entries()));

  const clinicMembers = await getClinicMembersAction({clinicUid, ...filters});
  return NextResponse.json(clinicMembers, {status: 200});
});