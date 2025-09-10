import { getUserDefaultOrg } from "@/actions/users/user-default.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const {userId} = await params;
  const searchParams = req.nextUrl.searchParams
  
  const defaultOrgRole = await getUserDefaultOrg(userId);
  return NextResponse.json(defaultOrgRole, {status: 200});
});