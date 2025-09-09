import { getClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const orgAppointmentTabs = await getClinicAppointmentTabsAction(clinicUid);
  return NextResponse.json(orgAppointmentTabs, {status: 200});
});