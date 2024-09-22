import { getUserAction } from "@actions/users/user.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    userId: string;
  }
}) => {
  const userId = params.userId;
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get("orgUid") ?? undefined;
  
  const user = await getUserAction(userId, orgUid);
  return NextResponse.json(user, {status: 200});
});