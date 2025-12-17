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

  if (!patientUserId) {
    return NextResponse.json(
      { error: 'patientUserId is required' },
      { status: 400 }
    );
  }

  const result = await checkRepeatPatientAction(
    patientUserId,
    clinicUid
  );

  return NextResponse.json(result.data, { status: 200 });
});
