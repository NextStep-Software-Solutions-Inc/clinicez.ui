import { getAppointmentTypesAction } from "@actions/appointments/appointment-type.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;

  const appointmentTypes = await getAppointmentTypesAction(organizationId);
  return NextResponse.json(appointmentTypes, {status: 200});
});