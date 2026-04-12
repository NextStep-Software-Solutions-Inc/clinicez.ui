"use server";
import "server-only";

import { withClerkAuth } from "@middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import { getHPClinicsAction } from "@actions/hp/hp-clinics.action";

export const GET = withClerkAuth(async (_req: NextRequest, { params }: { params: Promise<{ hpId: string }> }) => {
  const { hpId } = await params;
  const id = Number(hpId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json([], { status: 200 });
  }
  const clinics = await getHPClinicsAction(id);
  return NextResponse.json(clinics, { status: 200 });
});
