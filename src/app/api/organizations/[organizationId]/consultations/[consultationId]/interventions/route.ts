import { getConsultationNotesAction } from "@actions/consultation/consultation-notes.action";
import { getInterventionsAction } from "@actions/consultation/intervention.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string
    consultationId: string;
  }
}) => {
  const consultationId = parseInt(params.consultationId);

  const formData = new FormData();

  formData.append('consultationTicketId', consultationId.toString());
  formData.append('orgUid', params.organizationId);
  
  const interventions = await getInterventionsAction(formData);
  if(!interventions) return NextResponse.json({error: 'Consultation ticket not found'}, {status: 404});
  return NextResponse.json(interventions, {status: 200});
});