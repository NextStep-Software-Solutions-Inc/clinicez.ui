import { getConsultationNotesAction } from "@actions/consultation/consultation-notes.action";
import { getInterventionsAction } from "@actions/consultation/intervention.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string
    consultationId: string;
  }>
}) => {
  const { consultationId, clinicUid } = await params;
  const consultationIdInt = parseInt(consultationId);

  const formData = new FormData();

  formData.append('consultationTicketId', consultationIdInt.toString());
  formData.append('clinicUid', clinicUid);
  
  const interventions = await getInterventionsAction(formData);
  if(!interventions) return NextResponse.json({error: 'Consultation ticket not found'}, {status: 404});
  return NextResponse.json(interventions, {status: 200});
});