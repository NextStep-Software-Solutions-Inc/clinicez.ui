import { getUserAction } from '@actions/user.action';
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextResponse } from 'next/server';
import 'server-only'

export const dynamic = 'force-dynamic' // defaults to auto

export const GET = withJwtAuth(async (req:Request,  {params}: { params: { userId: string } }) => {
  
  const userId = params.userId
  const response = new NextResponse()
  const user = await getUserAction(userId);
  return NextResponse.json(user, response, );
});