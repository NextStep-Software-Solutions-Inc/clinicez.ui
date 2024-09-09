import { getConsultationNotesAction } from "@actions/consultation/consultation-notes.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string
    consultationId: string;
  }
}) => {
  const consultationId = parseInt(params.consultationId);
  
  const consultationNotes = await getConsultationNotesAction(consultationId);
  if(!consultationNotes) return NextResponse.json({error: 'Consultation notes not found'}, {status: 404});
  return NextResponse.json(consultationNotes, {status: 200});
});