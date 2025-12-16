import { checkRepeatPatientAction } from "@actions/appointments/appointments.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;
  const searchParams = req.nextUrl.searchParams;
  const patientUserId = searchParams.get('patientUserId');
  const hpId = searchParams.get('hpId');

  if (!patientUserId) {
    return NextResponse.json(
      { error: 'patientUserId is required' },
      { status: 400 }
    );
  }

  const result = await checkRepeatPatientAction(
    patientUserId,
    hpId ? parseInt(hpId, 10) : undefined,
    clinicUid
  );

  return NextResponse.json(result, { status: 200 });
});
