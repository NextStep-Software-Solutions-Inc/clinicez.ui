import { getPreAssessmentNotesAction } from "@actions/appointments/pre-assessment-note.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
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