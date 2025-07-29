import { getAppointmentsAction } from "@actions/appointments/appointments.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { AppointmentStatus, RoutedAptStatus } from "@public/json/appointment-list";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;
  const searchParams = req.nextUrl.searchParams
  const filter = Object.fromEntries(searchParams.entries());
  const appointments = await getAppointmentsAction({
    clinicUid: clinicUid,
    ...filter,
  });
  return NextResponse.json(appointments, {status: 200});
});