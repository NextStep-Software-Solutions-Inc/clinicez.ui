import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { parseObject } from "@/lib/utils";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
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