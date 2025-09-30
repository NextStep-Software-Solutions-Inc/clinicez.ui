import { parseObject, searchParamsToObject } from "@/lib/utils";
import { getOrganizationMembersReportAction, OrganizationMembersReportFilters } from "@actions/organizations/org-report.action";
import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withClerkAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ orgUid: string }> }
  ) => {
    const { orgUid } = await params;

    const rawFilters = parseObject(
      searchParamsToObject(req.nextUrl.searchParams)
    );

    const filters: OrganizationMembersReportFilters = {
      orgUid,
      startDate:
        typeof rawFilters.startDate === "string" ? rawFilters.startDate : undefined,
      endDate:
        typeof rawFilters.endDate === "string" ? rawFilters.endDate : undefined,
      gender:
        typeof rawFilters.gender === "string" ? rawFilters.gender : undefined,
      collegeId:
        typeof rawFilters.collegeId === "string" ? rawFilters.collegeId : undefined,
      programId:
        typeof rawFilters.programId === "string"
          ? rawFilters.programId
          : undefined,
      yearLevelId:
        typeof rawFilters.yearLevelId === "string"
          ? rawFilters.yearLevelId
          : undefined,
    };

    const report = await getOrganizationMembersReportAction(filters);

    const statusCode = report.status
      ? 200
      : report.message === "Forbidden"
        ? 403
        : report.message === "Unauthorized"
          ? 401
          : 400;

    return NextResponse.json(report, { status: statusCode });
  }
);
