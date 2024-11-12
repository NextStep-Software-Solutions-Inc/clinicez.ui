import { getConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string
    consultationId: string;
  }
}) => {
  const consultationId = parseInt(params.consultationId);
  const clinicUid = params.clinicUid;

  const consultationTicket = await getConsultationTicketAction(consultationId, clinicUid);
  
  if(!consultationTicket) return NextResponse.json({error: 'Consultation ticket not found'}, {status: 404});
  return NextResponse.json(consultationTicket, {status: 200});
});