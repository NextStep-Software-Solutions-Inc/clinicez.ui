import { getConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string
    consultationId: string;
  }>
}) => {
  const { clinicUid, consultationId } = await params;
  const consultationIdInt = parseInt(consultationId);

  const consultationTicket = await getConsultationTicketAction(consultationIdInt, clinicUid);
  
  if(!consultationTicket) return NextResponse.json({error: 'Consultation ticket not found'}, {status: 404});
  return NextResponse.json(consultationTicket, {status: 200});
});