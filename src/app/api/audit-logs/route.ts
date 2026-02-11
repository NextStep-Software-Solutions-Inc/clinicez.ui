"use server";
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { getAuditLogsAction, GetAuditLogsPayload } from "@actions/audit.action";

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const payload: GetAuditLogsPayload = {
    entityType: searchParams.get("entityType") as GetAuditLogsPayload["entityType"] ?? undefined,
    entityId: searchParams.get("entityId") ? Number(searchParams.get("entityId")) : undefined,
    action: searchParams.get("action") as GetAuditLogsPayload["action"] ?? undefined,
    fieldName: searchParams.get("fieldName") ?? undefined,
    performedBy: searchParams.get("performedBy") ? Number(searchParams.get("performedBy")) : undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  };

  const result = await getAuditLogsAction(payload);
  return NextResponse.json(result, { status: 200 });
});
