import { getAppointmentTypesAction } from "@actions/appointments/appointment-type.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;

  const appointmentTypes = await getAppointmentTypesAction(clinicUid);
  return NextResponse.json(appointmentTypes, {status: 200});
});