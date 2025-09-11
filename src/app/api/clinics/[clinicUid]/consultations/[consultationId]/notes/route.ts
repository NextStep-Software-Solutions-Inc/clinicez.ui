import { getConsultationNotesAction } from "@actions/consultation/consultation-notes.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string
    consultationId: string;
  }>
}) => {
  const { consultationId } = await params;
  const consultationIdInt = parseInt(consultationId);
  
  const consultationNotes = await getConsultationNotesAction(consultationIdInt);
  if(!consultationNotes) return NextResponse.json({error: 'Consultation notes not found'}, {status: 404});
  return NextResponse.json(consultationNotes, {status: 200});
});