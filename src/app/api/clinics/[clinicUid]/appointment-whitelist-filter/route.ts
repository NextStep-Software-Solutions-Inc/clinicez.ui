import { getUserAppointmentWhitelistAction } from "@actions/users/user-appointment-whitelist";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const userOrgAppointmentWhitelist = await getUserAppointmentWhitelistAction(clinicUid, userId ?? undefined);
  return NextResponse.json(userOrgAppointmentWhitelist, {status: 200});
});