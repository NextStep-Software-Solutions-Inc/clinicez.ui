import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string;
  }
}) => {
  const clinicUid = params.clinicUid;

  const clinicMembers = await getClinicMembersAction(clinicUid);
  return NextResponse.json(clinicMembers, {status: 200});
});