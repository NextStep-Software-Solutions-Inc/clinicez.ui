import { getPreAssessmentNotesAction } from "@actions/appointments/pre-assessment-note.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string;
    appointmentId: string;
  }
}) => {
  const organizationId = params.organizationId;
  const appointmentId = parseInt(params.appointmentId);
  const preConsultationNotes = await getPreAssessmentNotesAction(appointmentId);
  return NextResponse.json(preConsultationNotes, {status: 200});
});