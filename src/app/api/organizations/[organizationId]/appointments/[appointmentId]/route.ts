import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string
    appointmentId: string;
  }
}) => {
  const appointmentId = parseInt(params.appointmentId);
  const organizationId = params.organizationId;
  
  const appointment = await getAppointmentAction(appointmentId, organizationId);
  if(!appointment) return NextResponse.json({error: 'Appointment not found'}, {status: 404});
  return NextResponse.json(appointment, {status: 200});
});