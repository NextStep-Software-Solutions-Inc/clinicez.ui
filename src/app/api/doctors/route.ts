import { createDoctorAction, getDoctorsAction } from "@actions/doctor.action";
import { withJwtAuth } from "@middlewares/withJwtAuth";
import { NextResponse } from "next/server";
import { z } from "zod";

const response = new NextResponse()

const createDoctorSchema = z.object({
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

  const newDoctor = createDoctorSchema.parse(await req.json())
  const doctor = await createDoctorAction(newDoctor)

  return NextResponse.json({
    success: true,
    response: doctor
  }, response)

})

export const GET = withJwtAuth(async (req) => {

  const doctors = await getDoctorsAction()

  return NextResponse.json({
    success: true,
    response: doctors
  }, response)
  
})