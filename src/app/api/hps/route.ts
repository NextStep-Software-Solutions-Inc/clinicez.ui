import { getHPsAction } from "@actions/hp.actions";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { HealthcareProviderType } from "@prisma/common/client";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req:NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get('type') as HealthcareProviderType;
  const userId = searchParams.get('userId');
  const id = searchParams.get('id');
  const isPublished = searchParams.get('isPublished');

  const filters = {
    ...type ? { type } : {},
    ...userId ? { userId } : {},
    ...id ? { id: parseInt(id) } : {},
    ...isPublished ? { isPublished: isPublished === 'true' } : {},
  }

  const hps = await getHPsAction(filters)

  return NextResponse.json(hps, {status: 200})
})