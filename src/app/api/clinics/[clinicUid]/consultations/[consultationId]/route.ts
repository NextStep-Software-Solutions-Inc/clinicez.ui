import { getConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
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