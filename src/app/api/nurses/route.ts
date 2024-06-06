import { createNurseAction, getNursesAction } from "@actions/nurse.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()

const createNurseSchema = z.object({
  title: z.string({
    required_error: "Title is required"
  }),
  name: z.string({
    required_error: "Name is required"
  }),
  suffix: z.string().optional().nullable(),
  healthcareProviderId: z.number({
    required_error: "Healthcare Provider Id is required"
  }),
})

export const POST = withJwtAuth(async (req) => {

  const newNurse = createNurseSchema.parse(await req.json())
  const nurse = await createNurseAction(newNurse)

  return NextResponse.json({
    success: true,
    response: nurse
  }, response)

})

export const GET = withJwtAuth(async (req) => {

  const nurses = await getNursesAction()

  return NextResponse.json({
    success: true,
    response: nurses
  }, response)
  
})