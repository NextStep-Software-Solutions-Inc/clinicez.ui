"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { createUserAction, getUsersAction } from "@actions/users/user.action";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withJwtAuth } from '@middlewares/withJwtAuth';

const newUserSchema = z.object({
  userId: z.string({
    required_error: "User ID is required",
  }),
  email: z.string({
    required_error: "Email is required",
  }).email({
    message: "Invalid email address",
  }),
  firstName: z.string().nullable(),
  middleName: z.string().nullable(),
  lastName: z.string().nullable(),
  nickname: z.string().nullable(),
  picture: z.string().nullable(),
})

export const POST = withUnkey(async (req) => {
   
  if (!req.unkey?.valid) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  if (!req.unkey?.permissions?.includes('user:create')) {
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

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const orgId = searchParams.get('orgId') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const email = searchParams.get('email') ?? '';
  
  const filter = {
    ...(orgId? {orgId}: {}),
    ...(userId? {userId}: {}),
    ...(email ? {email}: {})
  }
  const response = new NextResponse()
  const users = await getUsersAction(filter);
  return NextResponse.json(users, response);
});