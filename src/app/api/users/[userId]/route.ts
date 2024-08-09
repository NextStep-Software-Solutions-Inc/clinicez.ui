import { getUserAction } from "@actions/users/user.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    userId: string;
  }
}) => {
  const userId = params.userId;

  const user = await getUserAction(userId);
  return NextResponse.json(user, {status: 200});
});