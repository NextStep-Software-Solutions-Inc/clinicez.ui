import { parseObject } from "@/lib/utils";
import { GetConsultationTicketsFilters, getConsultationTicketsAction } from "@actions/consultation/consultation-ticket.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: Promise<{
    clinicUid: string;
  }>
}) => {
  const { clinicUid } = await params;
  const searchParams = new URLSearchParams(req.nextUrl.searchParams)
  const filters = parseObject(Object.fromEntries(searchParams.entries())) as GetConsultationTicketsFilters

  const consultations = await getConsultationTicketsAction({...filters, clinicUid});
  return NextResponse.json(consultations, {status: 200});
});