import { parseObject } from "@/lib/utils";
import { getUserTimeSlotsAction } from "@actions/schedule/time-slot.actions";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 40;
export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    userId: string;
  }>
}) => {
  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams;

  const serviceId = Number(searchParams.get("serviceId"));
  const appointmentTypeId = Number(searchParams.get("appointmentTypeId"));
  const hpId = Number(searchParams.get("hpId"));

  const availabilities = await getUserTimeSlotsAction({
    userId,
    serviceId,
    hpId,
    appointmentTypeId
  });
  return NextResponse.json(availabilities, { status: 200 });
});