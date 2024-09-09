import { getConsultationRecordAction } from "@actions/consultation/consultation-record.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    organizationId: string
    consultationId: string;
  }
}) => {
  const consultationId = parseInt(params.consultationId);
  const orgUid = params.organizationId;

  const consultationRecord = await getConsultationRecordAction(consultationId, orgUid);
  
  if(!consultationRecord) return NextResponse.json({error: 'Consultation record not found'}, {status: 404});
  return NextResponse.json(consultationRecord, {status: 200});
});