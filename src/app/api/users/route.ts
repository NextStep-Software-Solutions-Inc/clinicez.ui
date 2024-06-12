import { withUnkey } from '@unkey/nextjs';
import { createUserAction, getUsersAction } from "@actions/user.action";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withJwtAuth } from "@middlewares/withJwtAuth";

const newUserSchema = z.object({
  userId: z.string({
    required_error: "User ID is required",
  }),
  email: z.string({
    required_error: "Email is required",
  }).email({
    message: "Invalid email address",
  }),
  name: z.string().nullable(),
  picture: z.string().nullable(),
})

export const POST = withUnkey(async (req) => {
   
  if (!req.unkey?.valid) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  if (!req.unkey?.permissions?.includes('create:user')) {
    return new NextResponse('unauthorized', { status: 403 });
  }


  const response = new NextResponse()
  const body = await req.json();
  const newUser = newUserSchema.parse(body);
  const res = await createUserAction(newUser);
  return NextResponse.json({
    success: true,
    response: res
  }, response);
})

export const GET = withJwtAuth(async (req) => {
  const response = new NextResponse()
  const users = await getUsersAction();
  return NextResponse.json({
    success: true,
    response: users
  }, response);
});