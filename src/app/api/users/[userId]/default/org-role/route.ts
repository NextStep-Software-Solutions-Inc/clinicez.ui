import { getUserDefaultOrgsRole } from "@/actions/users/user-default.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams
  
  const defaultOrgRole = await getUserDefaultOrgsRole(userId);
  return NextResponse.json(defaultOrgRole, {status: 200});
});