"use server";
import 'server-only'
import { withClerkAuth } from '@middlewares/withClerkAuth';

import { NextRequest, NextResponse } from "next/server";
import { getFileTypesAction } from '@actions/file-type.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const fileTypes = await getFileTypesAction();
  return NextResponse.json(fileTypes, {
    status: 200
  });
});