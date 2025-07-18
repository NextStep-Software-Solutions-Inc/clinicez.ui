
import { getImagingStudiesAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { withJwtAuth } from "@/middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const filters = {
    clinicUid: searchParams.get("clinicUid") ?? undefined,
    patientId: searchParams.get("patientId") ? Number(searchParams.get("patientId")) : undefined,
    hpId: searchParams.get("hpId") ? Number(searchParams.get("hpId")) : undefined,
    consultationTicketId: searchParams.get("consultationTicketId") ? Number(searchParams.get("consultationTicketId")) : undefined,
    status: searchParams.get("status") ?? undefined,
  };

  try {
    const studiesResult = await getImagingStudiesAction(filters);
    return NextResponse.json(studiesResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch imaging studies", data: null, status: false },
      { status: 500 }
    );
  }
});