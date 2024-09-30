"use server";
import "server-only"

import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";
import { getHPAction } from "@actions/hp.actions";

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: {
    hpId: string;
  }
}) => {
  const hpId = Number(params.hpId);
  //   const searchParams = req.nextUrl.searchParams
  
  const hp = await getHPAction({ id: hpId });
  return NextResponse.json(hp, {status: 200});
});