"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgMembersAction, GetOrgMembersFilters } from "@/actions/organizations/org-member.action";
import { parseObject, searchParamsToObject } from "@/lib/utils";

export const GET = withJwtAuth(async (req: NextRequest) => {

  const filters = parseObject(searchParamsToObject(req.nextUrl.searchParams)) as GetOrgMembersFilters;

  const orgMembers = await getOrgMembersAction(filters)

  return NextResponse.json(orgMembers, { status: 200 });
});
