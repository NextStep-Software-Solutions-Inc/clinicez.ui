import { getPreAssessmentNotesAction } from "@actions/appointments/pre-assessment-note.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    clinicUid: string;
    appointmentId: string;
  }
}) => {
  const clinicUid = params.clinicUid;
  const appointmentId = parseInt(params.appointmentId);
  const preConsultationNotes = await getPreAssessmentNotesAction(appointmentId);
  return NextResponse.json(preConsultationNotes, {status: 200});
});