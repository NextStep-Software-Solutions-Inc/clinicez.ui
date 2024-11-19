import { getConsultationTicketsAction } from "@actions/consultation/consultation-ticket.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string;
  }
}) => {
  const clinicUid = params.clinicUid;
  const searchParams = req.nextUrl.searchParams
  const showArchived = searchParams.get('showArchived')
  const userId = String(searchParams.get('userId'))

  const consultations = await getConsultationTicketsAction({
    showArchived: showArchived === 'true',
    userId, 
    clinicUid
  });
  return NextResponse.json(consultations, {status: 200});
});