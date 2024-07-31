import { getAppointmentsAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { AppointmentStatus } from "@public/json/appointment-list";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status') as AppointmentStatus;

  const appointments = await getAppointmentsAction({
    orgUid: organizationId,
    ...status ? { status }: {},
  });
  return NextResponse.json(appointments, {status: 200});
});