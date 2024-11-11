"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { createUserAction, getUsersAction } from "@actions/users/user.action";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withJwtAuth } from '@middlewares/withJwtAuth';

const newUserSchema = z.object({
  email: z.string({
    required_error: "Email is required",
  }).trim().email({
    message: "Invalid email address",
  }),
  mobile: z.string().trim(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
})

export const POST = withUnkey(async (req) => {

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