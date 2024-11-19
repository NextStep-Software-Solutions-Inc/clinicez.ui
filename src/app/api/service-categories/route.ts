import { getClinicServiceCategoriesAction } from "@/actions/clinics/clinic-service-category.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const clinicUid = searchParams.get('clinicUid') as string;

  const serviceCategories = await getClinicServiceCategoriesAction(clinicUid);
  return NextResponse.json(serviceCategories, {status: 200});
});