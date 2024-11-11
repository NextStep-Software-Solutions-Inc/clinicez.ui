import { getClinicAppointmentTabsAction } from "@actions/organizations/clinic-appointment-tab..action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;

  const orgAppointmentTabs = await getClinicAppointmentTabsAction(organizationId);
  return NextResponse.json(orgAppointmentTabs, {status: 200});
});