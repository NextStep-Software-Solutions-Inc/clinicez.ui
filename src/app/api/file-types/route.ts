"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextRequest, NextResponse } from "next/server";
import { getFileTypesAction } from '@actions/file-type.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const fileTypes = await getFileTypesAction();
  return NextResponse.json(fileTypes, {
    status: 200
  });
});