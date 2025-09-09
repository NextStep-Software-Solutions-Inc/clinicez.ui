import { getHPsAction, getHpsByIdsAction } from "@actions/hp.actions";
import { convertStringToNumber } from "@lib/utils";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextRequest, NextResponse } from "next/server";


export const GET = withJwtAuth(async (req:NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const hpTypeId = convertStringToNumber(searchParams.get('hpTypeId'));
  const userId = searchParams.get('userId');
  const id = convertStringToNumber(searchParams.get('id'));
  const isPublished = searchParams.get('isPublished');

  const filters = {
    ...(hpTypeId ? { hpTypeId } : {}),
    ...(userId ? { userId } : {}),
    ...(id ? { id } : {}),
    ...(isPublished ? { isPublished: isPublished === 'true' } : {}),
  }

  const hps = await getHPsAction(filters)

  return NextResponse.json(hps, {status: 200})
})

export const POST = withJwtAuth(async (req:NextRequest) => {
  const payload = await req.json()
  const ids = payload.ids as number[]
  const hps = await getHpsByIdsAction(ids)
  return NextResponse.json(hps, {status: 200})
})

