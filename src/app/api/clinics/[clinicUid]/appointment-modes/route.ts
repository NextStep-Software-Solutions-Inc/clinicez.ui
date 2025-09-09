import { getAppointmentModesAction } from "@actions/appointments/appointment-mode.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const appointmentModes = await getAppointmentModesAction(clinicUid);
  return NextResponse.json(appointmentModes, {status: 200});
});