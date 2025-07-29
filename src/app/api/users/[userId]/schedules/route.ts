import { getUserSchedulesAction } from "@actions/schedule/user-schedule.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const {userId} = await params;

  const userSchedules = await getUserSchedulesAction(userId);
  return NextResponse.json(userSchedules, {status: 200});
});