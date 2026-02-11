"use server";
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { getAuditLogsAction, GetAuditLogsPayload } from "@actions/audit.action";

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const fieldName = searchParams.get("fieldName");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const payload: GetAuditLogsPayload = {
    entityType: entityType ? entityType as NonNullable<GetAuditLogsPayload["entityType"]> : undefined,
    entityId: searchParams.get("entityId") ? Number(searchParams.get("entityId")) : undefined,
    action: action ? action as NonNullable<GetAuditLogsPayload["action"]> : undefined,
    fieldName: fieldName ? fieldName : undefined,
    performedBy: searchParams.get("performedBy") ? Number(searchParams.get("performedBy")) : undefined,
    startDate: startDate ? startDate : undefined,
    endDate: endDate ? endDate : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  };

  const result = await getAuditLogsAction(payload);
  return NextResponse.json(result, { status: 200 });
});
