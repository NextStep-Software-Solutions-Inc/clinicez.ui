import { getPreAssessmentNotesAction } from "@actions/appointments/pre-assessment-note.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
    appointmentId: string;
  }>
}) => {
  const { clinicUid, appointmentId } = await params;
  const appointmentIdInt = parseInt(appointmentId);
  const preConsultationNotes = await getPreAssessmentNotesAction(appointmentIdInt);
  return NextResponse.json(preConsultationNotes, {status: 200});
});