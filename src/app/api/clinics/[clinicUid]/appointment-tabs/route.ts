import { getClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const orgAppointmentTabs = await getClinicAppointmentTabsAction(clinicUid);
  return NextResponse.json(orgAppointmentTabs, {status: 200});
});