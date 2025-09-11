import { getReferralSlipsAction } from "@/actions/clinics/clinical-record/referral-slip.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse hpIds from multiple query parameters
    const hpIdsParams = searchParams.getAll("hpIds");
    const hpIds = hpIdsParams.length > 0 ? hpIdsParams.map(id => parseInt(id)).filter(id => !isNaN(id)) : undefined;

    const filters = {
      clinicUid: searchParams.get("clinicUid") || "",
      patientId: searchParams.get("patientId") ? parseInt(searchParams.get("patientId")!) : undefined,
      consultationTicketId: searchParams.get("consultationTicketId") ? parseInt(searchParams.get("consultationTicketId")!) : undefined,
      search: searchParams.get("search") || undefined,
      hpIds,
    };

    const referralSlipsResult = await getReferralSlipsAction(filters);
    return NextResponse.json(referralSlipsResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch referral slips", data: null, status: false },
      { status: 500 }
    );
  }
});
