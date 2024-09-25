import { getOrgServiceCategoriesAction } from "@actions/organizations/org-service-category.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get('orgUid') as string;

  const serviceCategories = await getOrgServiceCategoriesAction(orgUid);
  return NextResponse.json(serviceCategories, {status: 200});
});