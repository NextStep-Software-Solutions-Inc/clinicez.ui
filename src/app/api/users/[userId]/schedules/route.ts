import { getUserSchedulesAction } from "@actions/schedule/user-schedule.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const {userId} = await params;

  const userSchedules = await getUserSchedulesAction(userId);
  return NextResponse.json(userSchedules, {status: 200});
});