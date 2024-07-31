import { getOrgServicesAction } from "@actions/organizations/org-service.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { AppointmentStatus } from "@public/json/appointment-list";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const categoryId = searchParams.get('categoryId');
  const orgUid = searchParams.get('orgUid');

  const filter = {
    ...orgUid ? { orgUid } : {},
    categoryId: categoryId ? parseInt(categoryId) : undefined
  }

  const services = await getOrgServicesAction(filter);
  return NextResponse.json(services, {status: 200});
});