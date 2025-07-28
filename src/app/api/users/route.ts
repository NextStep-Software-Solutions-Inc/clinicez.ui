"use server";
import 'server-only'

import { withUnkey } from '@unkey/nextjs';
import { createUserAction, getUsersAction } from "@actions/users/user.action";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { parseObject } from '@/lib/utils';

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

export const POST = async (req: NextRequest, context: { params: Promise<any> }) => {

  const response = new NextResponse()
  const body = await req.json();
  
  const newUser = newUserSchema.parse(body);
  const res = await createUserAction(newUser);
  return NextResponse.json({
    success: true,
    response: res
  }, response);
}

export const GET = async (req: NextRequest, context: { params: Promise<any> }) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()));

  const response = new NextResponse()
  const users = await getUsersAction(filters);
  return NextResponse.json(users, response);
};