import { getUserDefaultOrg } from "@/actions/users/user-default.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    userId: string;
  }
}) => {
  const userId = params.userId;
  const searchParams = req.nextUrl.searchParams
  
  const defaultOrgRole = await getUserDefaultOrg(userId);
  return NextResponse.json(defaultOrgRole, {status: 200});
});