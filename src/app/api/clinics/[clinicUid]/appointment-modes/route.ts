import { getAppointmentModesAction } from "@actions/appointments/appointment-mode.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const appointmentModes = await getAppointmentModesAction(clinicUid);
  return NextResponse.json(appointmentModes, {status: 200});
});