import { getAppointmentTypesAction } from "@actions/appointments/appointment-type.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const appointmentTypes = await getAppointmentTypesAction(clinicUid);
  return NextResponse.json(appointmentTypes, {status: 200});
});