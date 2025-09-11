import { parseObject } from "@/lib/utils";
import { GetConsultationTicketsFilters, getConsultationTicketsAction } from "@actions/consultation/consultation-ticket.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
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