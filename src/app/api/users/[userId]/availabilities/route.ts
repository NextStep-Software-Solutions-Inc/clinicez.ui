import { getUserTimeSlotsAction } from "@actions/schedule/time-slot.actions";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 40;
export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    userId: string;
  }
}) => {
  const userId = params.userId;
  const searchParams = req.nextUrl.searchParams;
  const serviceId = Number(searchParams.get("serviceId"));
  const appointmentTypeId = Number(searchParams.get("appointmentTypeId"));

  const availabilities = await getUserTimeSlotsAction({
    userId: userId,
    serviceId,
    appointmentTypeId
  });
  return NextResponse.json(availabilities, {status: 200});
});