import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string
    appointmentId: string;
  }
}) => {
  const appointmentId = parseInt(params.appointmentId);
  const clinicUid = params.clinicUid;
  
  const appointment = await getAppointmentAction(appointmentId, clinicUid);
  if(!appointment) return NextResponse.json({error: 'Appointment not found'}, {status: 404});
  return NextResponse.json(appointment, {status: 200});
});