import { createHpAction, getHPsActions } from "@actions/hp.actions";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { HealthcareProviderType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()

const createHPSchema = z.object({
  userId: z.number({
    required_error: "User id is required"
  }),
  type: z.nativeEnum(HealthcareProviderType, {
    required_error: "Type is required"
  }),
  description: z.string().optional().nullable(),
})

export const POST = withJwtAuth(async (req) => {

  const body = await req.json()
  const newHp = createHPSchema.parse(body)
  const hp = await createHpAction(newHp)

  return NextResponse.json({
    success: true,
    response: hp
  }, response)
})


export const GET = withJwtAuth(async (req) => {
  const type = req.nextUrl.searchParams.get('type') as HealthcareProviderType
    
  const hps = await getHPsActions(type)

  return NextResponse.json({
    success: true,
    response: hps
  }, response)
})