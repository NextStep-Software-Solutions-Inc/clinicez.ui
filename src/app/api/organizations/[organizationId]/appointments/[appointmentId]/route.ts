import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    appointmentId: string;
  }
}) => {
  const appointmentId = parseInt(params.appointmentId);

  const appointment = await getAppointmentAction(appointmentId);
  return NextResponse.json(appointment, {status: 200});
});