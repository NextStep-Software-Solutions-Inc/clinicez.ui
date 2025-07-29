import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string
    appointmentId: string;
  }>
}) => {
  const { clinicUid, appointmentId } = await params;
  const appointmentIdInt = parseInt(appointmentId);
  
  const appointment = await getAppointmentAction(appointmentIdInt, clinicUid);
  if(!appointment) return NextResponse.json({error: 'Appointment not found'}, {status: 404});
  return NextResponse.json(appointment, {status: 200});
});