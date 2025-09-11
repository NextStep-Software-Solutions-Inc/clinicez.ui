import { getClinicServicesAction } from "@/actions/clinics/clinic-service.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { AppointmentStatus } from "@public/json/appointment-list";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const categoryId = searchParams.get('categoryId');
  const orgUid = searchParams.get('orgUid');

  const filter = {
    ...(orgUid ? { orgUid } : {}),
    categoryId: categoryId ? parseInt(categoryId) : undefined
  }

  const services = await getClinicServicesAction(filter);
  return NextResponse.json(services, { status: 200 });
});