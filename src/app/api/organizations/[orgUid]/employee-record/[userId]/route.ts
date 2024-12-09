"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgUserEmploymentRecordAction } from "@/actions/employee-record.action";


export const GET = withJwtAuth(async (req: NextRequest, { params }: {
    params: {
      orgUid: string;
      userId: string;
    }
  }) => {
    
  const { orgUid, userId } = params
  const organization = await getOrgUserEmploymentRecordAction({orgUid, userId})
  return NextResponse.json(organization, {status: 200});
});
