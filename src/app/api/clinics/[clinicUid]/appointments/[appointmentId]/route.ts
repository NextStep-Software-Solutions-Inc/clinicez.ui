import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
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