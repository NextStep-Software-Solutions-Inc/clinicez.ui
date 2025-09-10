import { getReferralReasonsAction } from "@/actions/clinics/clinical-record/referral-reason.action";
import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest) => {
  try {
    const reasonsResult = await getReferralReasonsAction();
    return NextResponse.json(reasonsResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch referral reasons", data: null, status: false },
      { status: 500 }
    );
  }
});
