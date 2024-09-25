import { getConsultationTicketsAction } from "@actions/consultation/consultation-ticket.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
  }
}) => {
  const organizationId = params.organizationId;
  const searchParams = req.nextUrl.searchParams
  const showArchived = searchParams.get('showArchived')

  const consultations = await getConsultationTicketsAction({
    orgUid: organizationId,
    filters: {
      showArchived: showArchived === 'true'
    }
  });
  return NextResponse.json(consultations, {status: 200});
});