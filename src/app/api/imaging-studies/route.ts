
import { getImagingStudiesAction, GetImagingStudiesFilters } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { parseObject } from "@/lib/utils";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetImagingStudiesFilters;
  const studies = await getImagingStudiesAction(filters);

  return NextResponse.json(studies, { status: 200 });
});