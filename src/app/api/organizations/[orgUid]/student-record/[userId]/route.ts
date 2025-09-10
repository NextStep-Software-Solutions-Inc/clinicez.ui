"use server";
import "server-only"

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationAction } from "@actions/organizations/organization.action";
import { getOrgStudentRecordAction } from "@/actions/student-record.action";


export const GET = withClerkAuth(async (req: NextRequest, { params }: {
    params: Promise<{
      orgUid: string;
      userId: string;
    }>
  }) => {

  const { orgUid, userId } = await params;
  const organization = await getOrgStudentRecordAction({orgUid, userId})
  return NextResponse.json(organization, {status: 200});
});
