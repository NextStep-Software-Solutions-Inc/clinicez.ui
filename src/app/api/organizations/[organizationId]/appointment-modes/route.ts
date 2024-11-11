import { getAppointmentModesAction } from "@actions/appointments/appointment-mode.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;

  const appointmentModes = await getAppointmentModesAction(organizationId);
  return NextResponse.json(appointmentModes, {status: 200});
});