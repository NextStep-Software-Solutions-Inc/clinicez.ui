import { getUserAction } from "@actions/users/user.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams
  const orgUid = searchParams.get("orgUid") ?? undefined;
  
  const user = await getUserAction(userId, orgUid);
  return NextResponse.json(user, {status: 200});
});